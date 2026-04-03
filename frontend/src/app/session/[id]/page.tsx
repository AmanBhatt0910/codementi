'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useSessionStore } from '@/store/sessionStore';
import { sessionsApi } from '@/lib/api';
import { useStomp } from '@/hooks/useStomp';
import { useWebRTC } from '@/hooks/useWebRTC';
import { ChatMessage, CodeUpdate, SessionEvent, SignalingMessage } from '@/types';
import { CollaborativeEditor, CollaborativeEditorHandle } from '@/components/editor/CollaborativeEditor';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { VideoCallScreen } from '@/features/video-call';
import { SessionHeader } from '@/components/layout/SessionHeader';
import { OutputConsole } from '@/features/collab-workspace/components/OutputConsole';
import { useCodeExecution } from '@/features/collab-workspace/hooks/useCodeExecution';
import toast from 'react-hot-toast';

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, token } = useAuthStore();
  const {
    currentSession, setCurrentSession,
    messages, setMessages, addMessage,
    codeSnapshot, setCodeSnapshot,
    setWsConnected, setPeerOnline,
    updateSession,
  } = useSessionStore();

  const [loading, setLoading] = useState(true);
  const [codeCopied, setCodeCopied] = useState(false);
  const [outputOpen, setOutputOpen] = useState(false);
  const editorRef = useRef<CollaborativeEditorHandle>(null);

  // Code execution
  const { state: execState, run: runCode, clear: clearOutput } = useCodeExecution();

  // Auto-open output panel when execution finishes
  useEffect(() => {
    if (execState.status === 'success' || execState.status === 'error') {
      setOutputOpen(true);
    }
  }, [execState.status]);

  // Load session + history on mount
  useEffect(() => {
    if (!id) return;
    sessionsApi.getById(id)
      .then(session => {
        setCurrentSession(session);
        return Promise.all([
          sessionsApi.getMessages(id),
          sessionsApi.getSnapshot(id),
        ]);
      })
      .then(([msgs, snap]) => {
        setMessages(msgs);
        setCodeSnapshot(snap);
      })
      .catch(() => toast.error('Failed to load session'))
      .finally(() => setLoading(false));

    return () => setCurrentSession(null);
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const [signalingReady, setSignalingReady] = useState(false);

  const handleChat = useCallback((msg: unknown) => {
    addMessage(msg as ChatMessage);
  }, [addMessage]);

  const handleCode = useCallback((update: unknown) => {
    const u = update as CodeUpdate;
    if (u.senderId !== user?.id) {
      setCodeSnapshot({ content: u.content ?? '', language: u.language ?? 'javascript' });
      if (u.content !== undefined) {
        editorRef.current?.applyRemoteUpdate(u.content, u.language);
      }
    }
  }, [user?.id, setCodeSnapshot]);

  const handleEvent = useCallback((event: unknown) => {
    const e = event as SessionEvent;
    if (e.type === 'USER_JOINED' && e.userId !== user?.id) {
      setPeerOnline(true);
      toast(`${e.userName} joined`, { icon: '👋' });
    } else if (e.type === 'USER_LEFT' && e.userId !== user?.id) {
      setPeerOnline(false);
    } else if (e.type === 'SESSION_ENDED') {
      updateSession(id, { status: 'ENDED' });
      toast('Session ended');
    }
  }, [user?.id, setPeerOnline, updateSession, id]);

  const { sendChat, sendCode, sendSignal } = useStomp({
    sessionId: id,
    token,
    onChat: handleChat,
    onCode: handleCode,
    onEvent: handleEvent,
    onSignal: (signal: unknown) => {
      webrtcHandleSignalRef.current?.(signal as SignalingMessage);
    },
    onConnected: () => setWsConnected(true),
    onDisconnected: () => setWsConnected(false),
  });

  const webrtc = useWebRTC({
    sessionId: id,
    userId: user?.id || '',
    sendSignal,
  });

  const webrtcHandleSignalRef = { current: webrtc.handleSignal };

  const copyCode = () => {
    if (currentSession?.sessionCode) {
      navigator.clipboard.writeText(currentSession.sessionCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface-950">
        <Loader2 className="animate-spin text-brand-400" size={28} />
      </div>
    );
  }

  if (!currentSession) return null;

  const remoteUser =
    currentSession.student?.id === user?.id
      ? currentSession.mentor
      : currentSession.student;

  // Output panel height: collapsed = header only (36px), expanded = 180px
  const outputHeight = outputOpen ? 180 : 36;

  return (
    <div className="flex flex-col h-screen bg-surface-950">
      <SessionHeader
        session={currentSession}
        user={user}
        onCopyCode={copyCode}
        codeCopied={codeCopied}
        onEndSession={async () => {
          try {
            await sessionsApi.end(currentSession.id);
            updateSession(currentSession.id, { status: 'ENDED' });
            toast.success('Session ended');
            router.push('/dashboard');
          } catch {
            toast.error('Failed to end session');
          }
        }}
      />

      {/*
       * Unified workspace: editor + output (left) | video + chat (right)
       * All three panels are visible simultaneously — no separate focus view.
       */}
      <div className="flex-1 grid grid-cols-[1fr_320px] overflow-hidden min-h-0">

        {/* ── Left pane: Code editor + Output console ──────────────────── */}
        <div className="flex flex-col overflow-hidden border-r border-white/6 min-h-0">
          {/* Editor (flex-1, fills remaining height) */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <CollaborativeEditor
              ref={editorRef}
              sessionId={id}
              userId={user?.id || ''}
              userName={user?.name || ''}
              initialContent={codeSnapshot.content}
              initialLanguage={codeSnapshot.language}
              onCodeChange={(content, language) => {
                sendCode({ type: 'CODE_UPDATE', content, language });
              }}
              onRun={runCode}
              isRunning={execState.status === 'running'}
            />
          </div>

          {/* Output console — collapsible, auto-expands on execution result */}
          <div
            className="border-t border-white/6 shrink-0 overflow-hidden transition-[height] duration-200 ease-in-out"
            style={{ height: outputHeight }}
          >
            <OutputConsole
              status={execState.status}
              output={execState.output}
              error={execState.error}
              exitCode={execState.exitCode}
              isOpen={outputOpen}
              onToggle={() => setOutputOpen(o => !o)}
              onClear={clearOutput}
            />
          </div>
        </div>

        {/* ── Right pane: Video call + Chat ────────────────────────────── */}
        <div className="flex flex-col overflow-hidden min-h-0">
          {/* Compact inline video call panel */}
          <div className="h-[260px] shrink-0 border-b border-white/6">
            <VideoCallScreen
              webrtc={webrtc}
              localUser={user}
              remoteUser={remoteUser}
            />
          </div>

          {/* Chat panel fills remaining space */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <ChatPanel
              messages={messages}
              currentUserId={user?.id || ''}
              onSend={sendChat}
              session={currentSession}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
