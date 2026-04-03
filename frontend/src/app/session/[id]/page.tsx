"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { getAuth } from "@/lib/auth";
import { sessionApi } from "@/lib/apiClient";
import {
  connectWebSocket,
  disconnectWebSocket,
  subscribeToTopic,
  sendMessage,
} from "@/lib/websocket";
import { SessionResponse, ChatMessage, MessageResponse, AuthResponse } from "@/types";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const LANGUAGES = ["javascript", "typescript", "python", "java", "cpp", "go", "rust"];

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const sessionId = Number(id);
  const router = useRouter();

  const [user, setUser] = useState<AuthResponse | null>(null);
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [code, setCode] = useState("// Start coding here...\n");
  const [language, setLanguage] = useState("javascript");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [wsConnected, setWsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<"editor" | "video">("editor");
  const [videoStatus, setVideoStatus] = useState<"idle" | "calling" | "connected">("idle");

  const chatEndRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const codeChangeFromRemote = useRef(false);
  const snapshotTimer = useRef<NodeJS.Timeout | null>(null);

  // ─── Load session & connect WS ─────────────────────────────────────────────
  useEffect(() => {
    const auth = getAuth();
    if (!auth) { router.replace("/auth/login"); return; }
    setUser(auth);

    sessionApi.get(sessionId)
      .then(setSession)
      .catch(() => router.replace("/dashboard"));

    sessionApi.getMessages(sessionId)
      .then((msgs: MessageResponse[]) => {
        setMessages(msgs.map((m) => ({
          sessionId: m.sessionId,
          senderId: m.senderId,
          senderName: m.senderName,
          content: m.content,
          timestamp: m.createdAt,
          type: "CHAT",
        })));
      })
      .catch(() => {});

    sessionApi.getLatestCode(sessionId)
      .then((snap: { code: string; language: string }) => {
        if (snap?.code) setCode(snap.code);
        if (snap?.language) setLanguage(snap.language);
      })
      .catch(() => {});
  }, [sessionId, router]);

  // ─── WebSocket ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    const client = connectWebSocket(() => {
      setWsConnected(true);

      // Chat subscription
      subscribeToTopic(`/topic/session/${sessionId}/chat`, (msg) => {
        const data: ChatMessage = JSON.parse(msg.body);
        setMessages((prev) => [...prev, data]);
      });

      // Code subscription
      subscribeToTopic(`/topic/session/${sessionId}/code`, (msg) => {
        const data = JSON.parse(msg.body);
        if (data.userId !== user.userId) {
          codeChangeFromRemote.current = true;
          setCode(data.code);
          setLanguage(data.language);
        }
      });

      // WebRTC signaling subscription
      subscribeToTopic(`/topic/session/${sessionId}/signal`, (msg) => {
        const signal = JSON.parse(msg.body);
        if (signal.senderId !== user.userId) {
          handleIncomingSignal(signal);
        }
      });

      // Announce join
      sendMessage(`/app/session/${sessionId}/chat`, {
        sessionId,
        senderId: user.userId,
        senderName: user.name,
        content: `${user.name} joined the session`,
        type: "JOIN",
      });
    });

    return () => {
      if (client) {
        sendMessage(`/app/session/${sessionId}/chat`, {
          sessionId,
          senderId: user.userId,
          senderName: user.name,
          content: `${user.name} left the session`,
          type: "LEAVE",
        });
      }
      disconnectWebSocket();
      setWsConnected(false);
      stopVideo();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, sessionId]);

  // ─── Scroll chat ──────────────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─── Code editor change ───────────────────────────────────────────────────
  const handleCodeChange = useCallback((value: string | undefined) => {
    const newCode = value ?? "";
    setCode(newCode);

    if (codeChangeFromRemote.current) {
      codeChangeFromRemote.current = false;
      return;
    }

    if (!user) return;
    sendMessage(`/app/session/${sessionId}/code`, {
      sessionId,
      userId: user.userId,
      userName: user.name,
      code: newCode,
      language,
    });

    // Debounced snapshot save
    if (snapshotTimer.current) clearTimeout(snapshotTimer.current);
    snapshotTimer.current = setTimeout(() => {
      sessionApi.saveCodeSnapshot(sessionId, newCode, language).catch(() => {});
    }, 3000);
  }, [user, sessionId, language]);

  // ─── Chat send ────────────────────────────────────────────────────────────
  const sendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !user) return;
    sendMessage(`/app/session/${sessionId}/chat`, {
      sessionId,
      senderId: user.userId,
      senderName: user.name,
      content: chatInput.trim(),
      type: "CHAT",
    });
    setChatInput("");
  };

  // ─── WebRTC ────────────────────────────────────────────────────────────────
  const createPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && user) {
        sendMessage(`/app/session/${sessionId}/signal`, {
          sessionId,
          senderId: user.userId,
          type: "ice-candidate",
          payload: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
      setVideoStatus("connected");
    };

    peerConnectionRef.current = pc;
    return pc;
  };

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = createPeerConnection();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (user) {
        sendMessage(`/app/session/${sessionId}/signal`, {
          sessionId,
          senderId: user.userId,
          type: "offer",
          payload: offer,
        });
      }
      setVideoStatus("calling");
    } catch (err) {
      console.error("Failed to start video:", err);
    }
  };

  const stopVideo = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setVideoStatus("idle");
  };

  const handleIncomingSignal = async (signal: { type: string; payload: unknown }) => {
    if (signal.type === "offer") {
      const pc = createPeerConnection();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current!));
      } else {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          localStreamRef.current = stream;
          if (localVideoRef.current) localVideoRef.current.srcObject = stream;
          stream.getTracks().forEach((t) => pc.addTrack(t, stream));
        } catch { /* user declined */ }
      }

      await pc.setRemoteDescription(new RTCSessionDescription(signal.payload as RTCSessionDescriptionInit));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      if (user) {
        sendMessage(`/app/session/${sessionId}/signal`, {
          sessionId,
          senderId: user.userId,
          type: "answer",
          payload: answer,
        });
      }
      setVideoStatus("calling");
    } else if (signal.type === "answer") {
      await peerConnectionRef.current?.setRemoteDescription(
        new RTCSessionDescription(signal.payload as RTCSessionDescriptionInit)
      );
    } else if (signal.type === "ice-candidate" && signal.payload) {
      try {
        await peerConnectionRef.current?.addIceCandidate(
          new RTCIceCandidate(signal.payload as RTCIceCandidateInit)
        );
      } catch { /* ignore */ }
    }
  };

  const handleEndSession = async () => {
    if (!confirm("Are you sure you want to end this session?")) return;
    await sessionApi.end(sessionId);
    stopVideo();
    router.push("/dashboard");
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-500";
      case "PENDING": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  };

  const messageColor = (type: string) => {
    if (type === "JOIN" || type === "LEAVE") return "text-gray-500 italic text-xs text-center py-1";
    return "";
  };

  if (!user || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950 overflow-hidden">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-gray-900 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-bold text-indigo-400">CodeMenti</span>
          <span className="text-gray-600">·</span>
          <span className="text-gray-400 text-sm">Session #{sessionId}</span>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(session.status)}`} />
            <span className="text-xs text-gray-400">{session.status}</span>
          </div>
          {!wsConnected && (
            <span className="text-xs text-yellow-400">Connecting…</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Language selector */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="text-xs bg-gray-800 border border-gray-700 text-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>

          {/* Mobile tab toggle */}
          <div className="flex md:hidden gap-1">
            <button
              onClick={() => setActiveTab("editor")}
              className={`text-xs px-2.5 py-1 rounded ${activeTab === "editor" ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400"}`}
            >
              Editor
            </button>
            <button
              onClick={() => setActiveTab("video")}
              className={`text-xs px-2.5 py-1 rounded ${activeTab === "video" ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400"}`}
            >
              Video
            </button>
          </div>

          {session.status === "ACTIVE" && user.role === "MENTOR" && (
            <button
              onClick={handleEndSession}
              className="text-xs px-3 py-1.5 rounded bg-red-600/20 border border-red-600/40 text-red-400 hover:bg-red-600/30 transition-colors"
            >
              End Session
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Editor + Video (stacked on mobile, side-by-side context hidden) */}
        <div className={`flex flex-col flex-1 overflow-hidden ${activeTab === "video" ? "hidden md:flex" : ""}`}>
          {/* Code Editor */}
          <div className="flex-1 overflow-hidden">
            <MonacoEditor
              height="100%"
              language={language}
              value={code}
              onChange={handleCodeChange}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 12 },
              }}
            />
          </div>
        </div>

        {/* Right Sidebar: Video + Chat */}
        <div className={`flex flex-col w-full md:w-80 lg:w-96 border-l border-gray-800 bg-gray-900 overflow-hidden ${activeTab === "editor" ? "hidden md:flex" : ""}`}>
          {/* Video Panel */}
          <div className="shrink-0 p-3 border-b border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Video Call</span>
              {videoStatus === "idle" ? (
                <button
                  onClick={startVideo}
                  className="text-xs px-3 py-1 rounded bg-green-600/20 border border-green-600/40 text-green-400 hover:bg-green-600/30 transition-colors"
                >
                  Start Call
                </button>
              ) : (
                <button
                  onClick={stopVideo}
                  className="text-xs px-3 py-1 rounded bg-red-600/20 border border-red-600/40 text-red-400 hover:bg-red-600/30 transition-colors"
                >
                  End Call
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-1 left-1 text-xs text-white bg-black/60 px-1 rounded">
                  You
                </span>
              </div>
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-1 left-1 text-xs text-white bg-black/60 px-1 rounded">
                  Remote
                </span>
                {videoStatus !== "connected" && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-gray-600 text-xs">
                      {videoStatus === "calling" ? "Connecting…" : "Waiting"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chat Panel */}
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="shrink-0 px-3 py-2 border-b border-gray-800">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Chat</span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.length === 0 && (
                <p className="text-center text-gray-600 text-xs py-4">No messages yet</p>
              )}
              {messages.map((msg, i) => {
                if (msg.type !== "CHAT") {
                  return (
                    <p key={i} className={messageColor(msg.type)}>
                      {msg.content}
                    </p>
                  );
                }
                const isMe = msg.senderId === user.userId;
                return (
                  <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-xl px-3 py-2 ${isMe ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-100"}`}>
                      {!isMe && (
                        <p className="text-xs font-semibold text-indigo-400 mb-0.5">{msg.senderName}</p>
                      )}
                      <p className="text-sm break-words">{msg.content}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={sendChat} className="shrink-0 p-3 border-t border-gray-800 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message…"
                className="flex-1 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-medium transition-colors"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
