'use client';
import { ArrowLeft, Copy, Check, Wifi, WifiOff, StopCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Session, User } from '@/types';
import { useSessionStore } from '@/store/sessionStore';
import { clsx } from 'clsx';

interface SessionHeaderProps {
  session: Session;
  user: User | null;
  onCopyCode: () => void;
  codeCopied: boolean;
  onEndSession: () => void;
}

export function SessionHeader({ session, user, onCopyCode, codeCopied, onEndSession }: SessionHeaderProps) {
  const router = useRouter();
  const { wsConnected, peerOnline } = useSessionStore();

  const isMentor = user?.id === session.mentor.id;

  return (
    <header className="flex items-center gap-4 px-5 py-3 bg-surface-900 border-b border-white/6 flex-shrink-0">
      <button
        onClick={() => router.push('/dashboard')}
        className="p-2 hover:bg-white/8 rounded-lg text-white/40 hover:text-white/70 transition-all"
      >
        <ArrowLeft size={16} />
      </button>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white truncate">{session.title}</div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className={clsx(
            'text-xs',
            session.status === 'ACTIVE' ? 'text-emerald-400' :
            session.status === 'WAITING' ? 'text-amber-400' : 'text-white/30'
          )}>
            {session.status === 'ACTIVE' && '● '}
            {session.status.charAt(0) + session.status.slice(1).toLowerCase()}
          </span>
          {session.student && (
            <span className="text-xs text-white/30">
              {session.mentor.name} ↔ {session.student.name}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* WebSocket status */}
        <div className={clsx(
          'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs',
          wsConnected ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'
        )}>
          {wsConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
          <span className="hidden sm:inline">{wsConnected ? 'Connected' : 'Disconnected'}</span>
        </div>

        {/* Peer status */}
        {peerOnline && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-brand-300 bg-brand-500/10">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
            <span className="hidden sm:inline">Peer online</span>
          </div>
        )}

        {/* Session code */}
        <button
          onClick={onCopyCode}
          className="flex items-center gap-2 px-3 py-1.5 glass hover:bg-white/8 rounded-lg text-xs text-white/50 hover:text-white/80 transition-all border border-white/8 font-mono"
        >
          <span className="tracking-widest">{session.sessionCode}</span>
          {codeCopied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
        </button>

        {/* End session */}
        {isMentor && session.status !== 'ENDED' && (
          <button
            onClick={onEndSession}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-400 rounded-lg text-xs font-medium transition-all border border-red-500/20"
          >
            <StopCircle size={13} />
            <span className="hidden sm:inline">End</span>
          </button>
        )}
      </div>
    </header>
  );
}
