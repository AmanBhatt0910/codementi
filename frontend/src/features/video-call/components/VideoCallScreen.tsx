'use client';
import {
  Video, VideoOff, PhoneOff,
  PhoneCall, PhoneIncoming, Phone, X,
  AlertCircle, RefreshCw,
} from 'lucide-react';
import type { User } from '@/types';
import { useCallSession } from '../hooks/useCallSession';
import { CallControlsBar } from './CallControlsBar';
import { motion, AnimatePresence } from 'framer-motion';

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
  /** Accepted for API compatibility; reserved for future local label display. */
  localUser?: User | null;
  remoteUser?: User;
}

/**
 * Compact inline video call panel for the unified workspace.
 *
 * All call states (idle, connecting, active, disconnected, error) are
 * rendered within this panel — no fullscreen overlay is used, so the editor
 * and chat remain visible and accessible during calls.
 *
 * The panel height is controlled by the parent container.
 */
export function VideoCallScreen({ webrtc, remoteUser }: VideoCallScreenProps) {
  const session = useCallSession(webrtc, remoteUser);

  return (
    <div className="flex flex-col h-full bg-surface-900/40">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-white/6 shrink-0">
        <Video size={13} className="text-brand-400" aria-hidden="true" />
        <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Video</span>

        {session.status === 'active' && (
          <div className="ml-auto flex items-center gap-1.5" aria-label="Call active">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400/80">Live</span>
          </div>
        )}
      </div>

      {/* ── Video area ──────────────────────────────────────────────────── */}
      <div className="relative flex-1 min-h-0 bg-black/40 overflow-hidden">
        {/* Remote video stream */}
        <video
          ref={session.remoteVideoRef}
          autoPlay
          playsInline
          aria-label="Remote participant video"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            session.status === 'active' ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Avatar placeholder when remote video is not live */}
        {session.status !== 'active' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            {session.remoteParticipant ? (
              <>
                <div
                  className="w-12 h-12 rounded-full bg-brand-500/20 flex items-center justify-center text-lg font-bold text-brand-300 select-none"
                  aria-hidden="true"
                >
                  {session.remoteParticipant.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs text-white/40">{session.remoteParticipant.name}</span>
              </>
            ) : (
              <Video size={20} className="text-white/15" aria-hidden="true" />
            )}
          </div>
        )}

        {/* Local video PiP */}
        <div
          className="absolute bottom-2 right-2 w-20 h-14 rounded-lg overflow-hidden bg-black/60 border border-white/10 shadow-lg"
          aria-label="Your camera preview"
        >
          <video
            ref={session.localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {session.isCameraOff && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
              <VideoOff size={12} className="text-white/40" aria-hidden="true" />
            </div>
          )}
        </div>

        {/* Call state overlays */}
        <AnimatePresence>
          {session.status === 'connecting' && (
            <motion.div
              key="connecting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-3"
              role="status"
              aria-live="polite"
            >
              {session.isOutgoingCall && (
                <>
                  <div className="w-12 h-12 rounded-full bg-brand-500/20 ring-pulse flex items-center justify-center">
                    <PhoneCall size={20} className="text-brand-300" aria-hidden="true" />
                  </div>
                  <p className="text-xs text-white/60">
                    Calling{session.remoteParticipant ? ` ${session.remoteParticipant.name}` : ''}…
                  </p>
                  <button
                    type="button"
                    onClick={session.endCall}
                    aria-label="Cancel call"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-full text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                  >
                    <PhoneOff size={12} aria-hidden="true" /> Cancel
                  </button>
                </>
              )}

              {session.isIncomingCall && (
                <>
                  <div className="w-12 h-12 rounded-full bg-brand-500/20 ring-pulse flex items-center justify-center">
                    <PhoneIncoming size={20} className="text-brand-300" aria-hidden="true" />
                  </div>
                  <p className="text-xs text-white/60">
                    {session.remoteParticipant?.name ?? 'Someone'} is calling…
                  </p>
                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={session.rejectCall}
                      aria-label="Decline call"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-full text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                    >
                      <X size={12} aria-hidden="true" /> Decline
                    </button>
                    <button
                      type="button"
                      onClick={session.acceptCall}
                      aria-label="Accept call"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/80 hover:bg-emerald-500 text-white rounded-full text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                    >
                      <Phone size={12} aria-hidden="true" /> Answer
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {session.status === 'disconnected' && (
            <motion.div
              key="disconnected"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-3"
              role="status"
              aria-live="polite"
            >
              <div className="w-10 h-10 rounded-full bg-surface-700 flex items-center justify-center">
                <PhoneOff size={18} className="text-white/50" aria-hidden="true" />
              </div>
              <p className="text-xs text-white/60">Call ended</p>
              <button
                type="button"
                onClick={session.resetCall}
                aria-label="Close call panel"
                className="px-3 py-1.5 glass hover:bg-white/10 text-white/70 hover:text-white rounded-full text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
              >
                Close
              </button>
            </motion.div>
          )}

          {session.status === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-3"
              role="alert"
              aria-live="assertive"
            >
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertCircle size={18} className="text-red-400" aria-hidden="true" />
              </div>
              <div className="text-center">
                <p className="text-xs text-white/80">Connection failed</p>
                <p className="text-xs text-white/35 mt-0.5">Check camera &amp; microphone</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={session.resetCall}
                  aria-label="Close error"
                  className="px-3 py-1.5 glass hover:bg-white/10 text-white/70 rounded-full text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={session.startCall}
                  aria-label="Retry call"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500/80 hover:bg-brand-500 text-white rounded-full text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                >
                  <RefreshCw size={11} aria-hidden="true" /> Retry
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Controls bar ────────────────────────────────────────────────── */}
      <div
        role="toolbar"
        aria-label="Video call controls"
        className="flex items-center justify-center py-2.5 px-3 border-t border-white/6 shrink-0 min-h-[52px]"
      >
        {session.status === 'active' ? (
          <CallControlsBar
            isMuted={session.isMuted}
            isCameraOff={session.isCameraOff}
            onToggleMute={session.toggleMute}
            onToggleCamera={session.toggleCamera}
            onEndCall={session.endCall}
          />
        ) : session.status === 'idle' ? (
          <button
            type="button"
            onClick={session.startCall}
            aria-label="Start video call"
            className="flex items-center gap-2 px-4 py-2 bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 rounded-lg text-xs font-medium border border-brand-500/20 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          >
            <Video size={13} aria-hidden="true" />
            Start call
          </button>
        ) : null}
      </div>
    </div>
  );
}
