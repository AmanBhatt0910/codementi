'use client';
import { Video } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { User } from '@/types';
import { useCallSession } from '../hooks/useCallSession';
import { CenterVideoStage } from './CenterVideoStage';
import { CallControlsBar } from './CallControlsBar';
import { CallStatusOverlay } from './CallStatusOverlay';

interface WebRTCHandle {
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  callState: 'idle' | 'calling' | 'ringing' | 'active' | 'ended' | 'error';
  isMuted: boolean;
  isCameraOff: boolean;
  startCall: () => void;
  endCall: () => void;
  resetCall: () => void;
  acceptPendingCall: () => void;
  rejectCall: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
}

interface VideoCallScreenProps {
  webrtc: WebRTCHandle;
  /** Local user — accepted for API compatibility; reserved for future use (e.g. local label). */
  localUser?: User | null;
  remoteUser?: User;
}

/**
 * Main video call orchestrator.
 *
 * Idle state   → compact inline strip with "Start call" button.
 * Active/etc.  → fixed full-viewport overlay with:
 *                 - CenterVideoStage (1:1 square, centered)
 *                 - CallStatusOverlay (connecting / disconnected / error)
 *                 - CallControlsBar  (mute / camera / end — shown when active)
 */
export function VideoCallScreen({ webrtc, remoteUser }: VideoCallScreenProps) {
  const session = useCallSession(webrtc, remoteUser);
  const overlayOpen = session.status !== 'idle';

  return (
    <>
      {/* ── Compact idle strip (rendered inside the 200px container) ───────── */}
      {!overlayOpen && (
        <IdleStrip remoteUser={remoteUser} onStartCall={session.startCall} />
      )}

      {/* ── Full-viewport overlay (rendered above everything via fixed pos) ── */}
      <AnimatePresence>
        {overlayOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
            role="dialog"
            aria-label="Video call"
            aria-modal="true"
          >
            <div className="flex flex-col items-center gap-5 w-full max-w-[480px]">
              {/* 1:1 video stage */}
              <CenterVideoStage
                remoteVideoRef={session.remoteVideoRef}
                localVideoRef={session.localVideoRef}
                isActive={session.status === 'active'}
                isCameraOff={session.isCameraOff}
                remoteParticipant={session.remoteParticipant}
              >
                <CallStatusOverlay
                  status={session.status}
                  isOutgoing={session.isOutgoingCall}
                  isIncoming={session.isIncomingCall}
                  remoteParticipant={session.remoteParticipant}
                  onAccept={session.acceptCall}
                  onDecline={session.isIncomingCall ? session.rejectCall : session.endCall}
                  onRetry={session.startCall}
                  onClose={session.resetCall}
                />
              </CenterVideoStage>

              {/* Controls bar — slides in when the call becomes active */}
              <AnimatePresence>
                {session.status === 'active' && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CallControlsBar
                      isMuted={session.isMuted}
                      isCameraOff={session.isCameraOff}
                      onToggleMute={session.toggleMute}
                      onToggleCamera={session.toggleCamera}
                      onEndCall={session.endCall}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ── Idle compact strip ──────────────────────────────────────────────────────── */

function IdleStrip({
  remoteUser,
  onStartCall,
}: {
  remoteUser?: User;
  onStartCall: () => void;
}) {
  return (
    <div className="flex h-full items-center justify-between gap-3 bg-surface-900/40 px-4">
      <div className="flex items-center gap-3 min-w-0">
        {remoteUser ? (
          <>
            <div
              className="w-9 h-9 rounded-full bg-brand-500/15 flex items-center justify-center text-sm font-semibold text-brand-300 select-none shrink-0"
              aria-hidden="true"
            >
              {remoteUser.name.charAt(0).toUpperCase()}
            </div>
            <p className="text-xs text-white/50 truncate">{remoteUser.name}</p>
          </>
        ) : (
          <p className="text-xs text-white/30">No participant yet</p>
        )}
      </div>

      <button
        type="button"
        onClick={onStartCall}
        aria-label="Start video call"
        className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 rounded-lg text-xs font-medium border border-brand-500/20 transition-all shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
      >
        <Video size={12} />
        Call
      </button>
    </div>
  );
}
