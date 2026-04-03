"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  HiSparkles, HiVideoCamera, HiMicrophone, HiVolumeOff,
  HiStop, HiPhone, HiPhoneIncoming, HiX, HiArrowLeft,
  HiChatAlt2, HiCode, HiChevronDown,
  HiClipboardCopy, HiCheck, HiDesktopComputer,
} from "react-icons/hi";
import { getAuth } from "@/lib/auth";
import { sessionApi } from "@/lib/apiClient";
import {
  connectWebSocket, disconnectWebSocket,
  subscribeToTopic, sendMessage,
} from "@/lib/websocket";
import { SessionResponse, ChatMessage, MessageResponse, AuthResponse } from "@/types";

function formatTime(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const LANGUAGES = [
  "javascript", "typescript", "python", "java", "cpp", "go", "rust",
  "html", "css", "sql", "bash", "json",
];

const EDITOR_THEMES = [
  { label: "VS Dark", value: "vs-dark" },
  { label: "VS Light", value: "light" },
  { label: "High Contrast", value: "hc-black" },
];

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const sessionId = Number(id);
  const router = useRouter();

  const [user, setUser] = useState<AuthResponse | null>(null);
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [code, setCode] = useState("// Start coding here...\n");
  const [language, setLanguage] = useState("javascript");
  const [editorTheme, setEditorTheme] = useState("vs-dark");
  const [fontSize, setFontSize] = useState(14);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [wsConnected, setWsConnected] = useState(false);
  const [activePanel, setActivePanel] = useState<"editor" | "video" | "chat">("editor");
  const [videoStatus, setVideoStatus] = useState<"idle" | "calling" | "connected">("idle");
  const [audioMuted, setAudioMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [minimap, setMinimap] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const codeChangeFromRemote = useRef(false);
  const snapshotTimer = useRef<NodeJS.Timeout | null>(null);

  // Load session
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

  // WebSocket
  useEffect(() => {
    if (!user) return;

    connectWebSocket(() => {
      setWsConnected(true);

      subscribeToTopic(`/topic/session/${sessionId}/chat`, (msg) => {
        const data: ChatMessage = JSON.parse(msg.body);
        setMessages((prev) => [...prev, data]);
      });

      subscribeToTopic(`/topic/session/${sessionId}/code`, (msg) => {
        const data = JSON.parse(msg.body);
        if (data.userId !== user.userId) {
          codeChangeFromRemote.current = true;
          setCode(data.code);
          setLanguage(data.language);
        }
      });

      subscribeToTopic(`/topic/session/${sessionId}/signal`, (msg) => {
        const signal = JSON.parse(msg.body);
        if (signal.senderId !== user.userId) {
          handleIncomingSignal(signal);
        }
      });

      sendMessage(`/app/session/${sessionId}/chat`, {
        sessionId,
        senderId: user.userId,
        senderName: user.name,
        content: `${user.name} joined the session`,
        type: "JOIN",
      });
    });

    return () => {
      // user is captured from closure at effect-run time (user is non-null since effect depends on user)
      if (user) {
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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

    if (snapshotTimer.current) clearTimeout(snapshotTimer.current);
    snapshotTimer.current = setTimeout(() => {
      sessionApi.saveCodeSnapshot(sessionId, newCode, language).catch(() => {});
    }, 3000);
  }, [user, sessionId, language]);

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

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCodeCopied(true);
      toast.success("Code copied to clipboard!");
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      toast.error("Failed to copy code.");
    }
  };

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
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = createPeerConnection();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (user) {
        sendMessage(`/app/session/${sessionId}/signal`, {
          sessionId, senderId: user.userId, type: "offer", payload: offer,
        });
      }
      setVideoStatus("calling");
      toast.success("Video call started!");
    } catch (err) {
      toast.error("Could not access camera/microphone.");
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
    setAudioMuted(false);
    setVideoOff(false);
  };

  const toggleAudio = () => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setAudioMuted(!audioTrack.enabled);
    }
  };

  const toggleVideo = () => {
    if (!localStreamRef.current) return;
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setVideoOff(!videoTrack.enabled);
    }
  };

  const shareScreen = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];
      const sender = peerConnectionRef.current
        ?.getSenders()
        .find((s) => s.track?.kind === "video");
      if (sender) await sender.replaceTrack(screenTrack);
      if (localVideoRef.current) {
        const ms = new MediaStream([screenTrack]);
        localVideoRef.current.srcObject = ms;
      }
      screenTrack.onended = () => {
        const camTrack = localStreamRef.current?.getVideoTracks()[0];
        if (sender && camTrack) sender.replaceTrack(camTrack);
        if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
      };
      toast.success("Screen sharing started");
    } catch {
      toast.error("Screen sharing cancelled or not supported.");
    }
  };

  const handleIncomingSignal = async (signal: { type: string; payload: unknown }) => {
    if (signal.type === "offer") {
      const pc = createPeerConnection();
      if (!localStreamRef.current) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          localStreamRef.current = stream;
          if (localVideoRef.current) localVideoRef.current.srcObject = stream;
          stream.getTracks().forEach((t) => pc.addTrack(t, stream));
        } catch (err) {
          // Suppress NotAllowedError - user intentionally denied camera/microphone access
          if (!(err instanceof DOMException && err.name === "NotAllowedError")) {
            console.error("Failed to access media devices:", err);
          }
        }
      } else {
        localStreamRef.current.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current!));
      }
      await pc.setRemoteDescription(new RTCSessionDescription(signal.payload as RTCSessionDescriptionInit));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      if (user) {
        sendMessage(`/app/session/${sessionId}/signal`, {
          sessionId, senderId: user.userId, type: "answer", payload: answer,
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
    try {
      await sessionApi.end(sessionId);
      toast.success("Session ended.");
      stopVideo();
      router.push("/dashboard");
    } catch {
      toast.error("Failed to end session.");
    }
  };

  const statusConfig = {
    ACTIVE: { color: "text-green-400", dot: "bg-green-400" },
    PENDING: { color: "text-yellow-400", dot: "bg-yellow-400" },
    ENDED: { color: "text-gray-400", dot: "bg-gray-500" },
  };
  const sCfg = session ? (statusConfig[session.status] || statusConfig.ENDED) : statusConfig.PENDING;

  if (!user || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950 overflow-hidden">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-gray-900/80 backdrop-blur-md border-b border-gray-800/60 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/dashboard")}
            className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          >
            <HiArrowLeft />
          </motion.button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <HiSparkles className="text-white text-xs" />
            </div>
            <span className="font-bold text-sm gradient-text hidden sm:block">CodeMenti</span>
          </div>

          <span className="text-gray-600">·</span>
          <span className="text-gray-400 text-sm">Session #{sessionId}</span>

          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full pulse-dot ${sCfg.dot}`} />
            <span className={`text-xs font-medium ${sCfg.color}`}>{session.status}</span>
          </div>

          {!wsConnected && (
            <span className="flex items-center gap-1 text-xs text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full">
              <div className="w-3 h-3 border border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
              Connecting
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="text-xs bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>

          <select
            value={editorTheme}
            onChange={(e) => setEditorTheme(e.target.value)}
            className="text-xs bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer hidden md:block"
          >
            {EDITOR_THEMES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          <div className="hidden md:flex items-center gap-1 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1">
            <button
              onClick={() => setFontSize((f) => Math.max(10, f - 1))}
              className="text-gray-400 hover:text-white text-xs w-4"
            >
              −
            </button>
            <span className="text-xs text-gray-300 w-4 text-center">{fontSize}</span>
            <button
              onClick={() => setFontSize((f) => Math.min(24, f + 1))}
              className="text-gray-400 hover:text-white text-xs w-4"
            >
              +
            </button>
          </div>

          <button
            onClick={() => setMinimap(!minimap)}
            title="Toggle minimap"
            className={`hidden md:flex text-xs px-2 py-1.5 rounded-lg border transition-colors ${minimap ? "bg-indigo-600/20 border-indigo-500/30 text-indigo-400" : "bg-gray-800 border-gray-700 text-gray-400 hover:text-white"}`}
          >
            <HiChevronDown className="text-sm" />
          </button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={copyCode}
            title="Copy code"
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-white transition-colors"
          >
            {codeCopied ? <HiCheck className="text-green-400" /> : <HiClipboardCopy />}
          </motion.button>

          <div className="flex md:hidden gap-1">
            {(["editor", "video", "chat"] as const).map((panel) => {
              const panelIcons: Record<string, React.ReactNode> = {
                editor: <HiCode />,
                video: <HiVideoCamera />,
                chat: <HiChatAlt2 />,
              };
              return (
                <button
                  key={panel}
                  onClick={() => setActivePanel(panel)}
                  className={`p-1.5 rounded-lg text-sm transition-colors ${activePanel === panel ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400"}`}
                >
                  {panelIcons[panel]}
                </button>
              );
            })}
          </div>

          {session.status === "ACTIVE" && user.role === "MENTOR" && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleEndSession}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-600/15 border border-red-500/30 text-red-400 hover:bg-red-600/25 transition-all"
            >
              <HiX className="text-xs" />
              <span className="hidden sm:block">End Session</span>
            </motion.button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor Panel */}
        <div className={`flex-1 overflow-hidden ${activePanel !== "editor" ? "hidden md:flex" : "flex"} flex-col`}>
          <MonacoEditor
            height="100%"
            language={language}
            value={code}
            onChange={handleCodeChange}
            theme={editorTheme}
            options={{
              minimap: { enabled: minimap },
              fontSize,
              wordWrap: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { top: 12, bottom: 12 },
              smoothScrolling: true,
              cursorSmoothCaretAnimation: "on",
              fontLigatures: true,
              renderLineHighlight: "gutter",
              lineNumbersMinChars: 3,
            }}
          />
        </div>

        {/* Right Sidebar: Video + Chat */}
        <div className={`flex flex-col w-full md:w-80 lg:w-96 border-l border-gray-800/60 bg-gray-900/50 overflow-hidden shrink-0 ${activePanel === "editor" ? "hidden md:flex" : "flex"}`}>
          {/* Video Panel */}
          <div className={`shrink-0 ${activePanel === "video" ? "flex flex-col flex-1" : "block"} border-b border-gray-800/60`}>
            <div className="p-3">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <HiVideoCamera className="text-gray-400 text-sm" />
                  <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Video Call</span>
                  {videoStatus === "connected" && (
                    <span className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded-full">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 pulse-dot" />
                      Live
                    </span>
                  )}
                  {videoStatus === "calling" && (
                    <span className="text-xs text-yellow-400">Connecting...</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-2.5">
                <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-video border border-gray-700/50">
                  <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                  <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between">
                    <span className="text-xs text-white bg-black/60 px-1.5 py-0.5 rounded-md backdrop-blur-sm">You</span>
                    {audioMuted && (
                      <span className="text-xs text-red-400 bg-red-900/60 px-1.5 py-0.5 rounded-md">
                        <HiVolumeOff />
                      </span>
                    )}
                  </div>
                  {videoStatus === "idle" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                      <HiVideoCamera className="text-gray-600 text-3xl" />
                    </div>
                  )}
                </div>
                <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-video border border-gray-700/50">
                  <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  {videoStatus !== "connected" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900">
                      {videoStatus === "calling" ? (
                        <>
                          <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-1" />
                          <span className="text-gray-600 text-xs">Connecting</span>
                        </>
                      ) : (
                        <>
                          <HiPhone className="text-gray-600 text-2xl mb-1" />
                          <span className="text-gray-600 text-xs">Waiting</span>
                        </>
                      )}
                    </div>
                  )}
                  <div className="absolute bottom-1.5 left-1.5">
                    <span className="text-xs text-white bg-black/60 px-1.5 py-0.5 rounded-md backdrop-blur-sm">Remote</span>
                  </div>
                </div>
              </div>

              {/* Call Controls */}
              <div className="flex items-center justify-center gap-2">
                {videoStatus === "idle" ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startVideo}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white text-xs font-semibold transition-colors shadow-lg"
                  >
                    <HiPhoneIncoming />
                    Start Call
                  </motion.button>
                ) : (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={toggleAudio}
                      title={audioMuted ? "Unmute" : "Mute"}
                      className={`p-2.5 rounded-xl border transition-all ${audioMuted ? "bg-red-600/20 border-red-500/40 text-red-400" : "bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600"}`}
                    >
                      {audioMuted ? <HiVolumeOff className="text-base" /> : <HiMicrophone className="text-base" />}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={toggleVideo}
                      title={videoOff ? "Turn on camera" : "Turn off camera"}
                      className={`p-2.5 rounded-xl border transition-all ${videoOff ? "bg-red-600/20 border-red-500/40 text-red-400" : "bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600"}`}
                    >
                      {videoOff ? <HiStop className="text-base" /> : <HiVideoCamera className="text-base" />}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={shareScreen}
                      title="Share screen"
                      className="p-2.5 rounded-xl border bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 transition-all"
                    >
                      <HiDesktopComputer className="text-base" />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={stopVideo}
                      title="End call"
                      className="p-2.5 rounded-xl bg-red-600 hover:bg-red-500 border border-red-500/40 text-white transition-all"
                    >
                      <HiPhone className="text-base rotate-[135deg]" />
                    </motion.button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Chat Panel */}
          <div className={`flex ${activePanel === "video" ? "hidden" : "flex-1"} flex-col overflow-hidden`}>
            <div className="shrink-0 px-3 py-2 border-b border-gray-800/60 flex items-center gap-2">
              <HiChatAlt2 className="text-gray-400 text-sm" />
              <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Chat</span>
              {messages.filter((m) => m.type === "CHAT").length > 0 && (
                <span className="ml-auto text-xs text-gray-600">
                  {messages.filter((m) => m.type === "CHAT").length} msg{messages.filter((m) => m.type === "CHAT").length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full py-8">
                  <HiChatAlt2 className="text-gray-700 text-4xl mb-2" />
                  <p className="text-gray-600 text-xs">No messages yet</p>
                </div>
              )}

              {messages.map((msg, i) => {
                if (msg.type !== "CHAT") {
                  return (
                    <p key={i} className="text-center text-gray-600 text-xs italic py-0.5">
                      {msg.content}
                    </p>
                  );
                }
                const isMe = msg.senderId === user.userId;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                      isMe
                        ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-br-sm"
                        : "bg-gray-800/80 text-gray-100 rounded-bl-sm border border-gray-700/50"
                    }`}>
                      {!isMe && (
                        <p className="text-xs font-semibold text-indigo-400 mb-0.5">{msg.senderName}</p>
                      )}
                      <p className="text-sm break-words leading-relaxed">{msg.content}</p>
                      {formatTime(msg.timestamp) && (
                        <p className={`text-xs mt-0.5 ${isMe ? "text-white/50" : "text-gray-500"}`}>
                          {formatTime(msg.timestamp)}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={sendChat} className="shrink-0 p-3 border-t border-gray-800/60">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 rounded-xl bg-gray-800/60 border border-gray-700/60 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 text-sm transition-all"
                />
                <motion.button
                  type="submit"
                  disabled={!chatInput.trim()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-medium transition-colors"
                >
                  Send
                </motion.button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
