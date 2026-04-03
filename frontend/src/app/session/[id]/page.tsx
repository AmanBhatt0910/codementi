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
import { VideoPanel } from '@/components/video/VideoPanel';
import { SessionHeader } from '@/components/layout/SessionHeader';
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
  const editorRef = useRef<CollaborativeEditorHandle>(null);

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

  // WebRTC — created first so its sendSignal can be passed to useStomp
  // We use a stable ref-based approach: define handleSignal before useStomp
  const [signalingReady, setSignalingReady] = useState(false);

  const handleChat = useCallback((msg: unknown) => {
    addMessage(msg as ChatMessage);
  }, [addMessage]);

  const handleCode = useCallback((update: unknown) => {
    const u = update as CodeUpdate;
    if (u.senderId !== user?.id) {
      setCodeSnapshot({ content: u.content, language: u.language });
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

  // Single useStomp instance — sendSignal forwarded to webrtc after it's ready
  const { sendChat, sendCode, sendSignal } = useStomp({
    sessionId: id,
    token,
    onChat: handleChat,
    onCode: handleCode,
    onEvent: handleEvent,
    onSignal: (signal: unknown) => {
      // Forward to webrtc handler via stable callback ref
      webrtcHandleSignalRef.current?.(signal as SignalingMessage);
    },
    onConnected: () => setWsConnected(true),
    onDisconnected: () => setWsConnected(false),
  });

  // WebRTC
  const webrtc = useWebRTC({
    sessionId: id,
    userId: user?.id || '',
    sendSignal,
  });

  // Store webrtc.handleSignal in a ref so the STOMP onSignal callback above
  // can call it without needing to re-create the STOMP connection
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

      <div className="flex-1 grid grid-cols-[1fr_340px] overflow-hidden">
        <div className="flex flex-col overflow-hidden border-r border-white/6">
          <div className="flex-1 overflow-hidden">
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
            />
          </div>
          <div className="h-[200px] border-t border-white/6 flex-shrink-0">
            <VideoPanel
              webrtc={webrtc}
              localUser={user}
              remoteUser={
                currentSession.student?.id === user?.id
                  ? currentSession.mentor
                  : currentSession.student
              }
            />
          </div>
        </div>

        <ChatPanel
          messages={messages}
          currentUserId={user?.id || ''}
          onSend={sendChat}
          session={currentSession}
        />
      </div>
    </div>
  );
}