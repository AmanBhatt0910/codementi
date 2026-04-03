'use client';
import { useRef } from 'react';
import {
  Video, VideoOff, Mic, MicOff, Phone, PhoneOff,
  PhoneCall, PhoneIncoming, X
} from 'lucide-react';
import { User } from '@/types';
import { useWebRTC } from '@/hooks/useWebRTC';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface VideoPanelProps {
  webrtc: ReturnType<typeof useWebRTC>;
  localUser: User | null;
  remoteUser?: User;
}

export function VideoPanel({ webrtc, localUser, remoteUser }: VideoPanelProps) {
  const {
    localVideoRef,
    remoteVideoRef,
    callState,
    isMuted,
    isCameraOff,
    startCall,
    acceptPendingCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera,
  } = webrtc;

  const isIdle = callState === 'idle';
  const isCalling = callState === 'calling';
  const isRinging = callState === 'ringing';
  const isActive = callState === 'active';

  return (
    <div className="flex h-full bg-surface-900/40">
      {/* Remote video (large) */}
      <div className="flex-1 relative bg-black/40 overflow-hidden">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className={clsx(
            'w-full h-full object-cover transition-opacity duration-500',
            isActive ? 'opacity-100' : 'opacity-0'
          )}
        />

        {/* Placeholder when no video */}
        {!isActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            {remoteUser ? (
              <>
                <div className="w-12 h-12 rounded-full bg-brand-500/20 flex items-center justify-center text-lg font-bold text-brand-300">
                  {remoteUser.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs text-white/40">{remoteUser.name}</span>
              </>
            ) : (
              <Video size={20} className="text-white/15" />
            )}
          </div>
        )}

        {/* Local video PiP */}
        <div className="absolute bottom-2 right-2 w-20 h-14 rounded-lg overflow-hidden bg-black/60 border border-white/10">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {isCameraOff && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
              <VideoOff size={12} className="text-white/50" />
            </div>
          )}
        </div>

        {/* Call state overlay */}
        <AnimatePresence>
          {(isCalling || isRinging) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3"
            >
              {isCalling && (
                <>
                  <div className="w-12 h-12 rounded-full bg-brand-500/20 ring-pulse flex items-center justify-center">
                    <PhoneCall size={20} className="text-brand-300" />
                  </div>
                  <p className="text-xs text-white/60">Calling{remoteUser ? ` ${remoteUser.name}` : ''}…</p>
                  <button
                    onClick={endCall}
                    className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-full text-xs transition-all"
                  >
                    <PhoneOff size={12} /> Cancel
                  </button>
                </>
              )}

              {isRinging && (
                <>
                  <div className="w-12 h-12 rounded-full bg-brand-500/20 ring-pulse flex items-center justify-center">
                    <PhoneIncoming size={20} className="text-brand-300" />
                  </div>
                  <p className="text-xs text-white/60">{remoteUser?.name || 'Someone'} is calling…</p>
                  <div className="flex gap-3 mt-1">
                    <button
                      onClick={rejectCall}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-full text-xs transition-all"
                    >
                      <X size={12} /> Decline
                    </button>
                    <button
                      onClick={acceptPendingCall}
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/80 hover:bg-emerald-500 text-white rounded-full text-xs transition-all"
                    >
                      <Phone size={12} /> Answer
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center justify-center gap-2 px-3 border-l border-white/6">
        {isActive ? (
          <>
            <ControlBtn
              onClick={toggleMute}
              active={isMuted}
              activeClass="bg-red-500/20 text-red-400 border-red-500/30"
              inactiveClass="glass text-white/50 border-white/8"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOff size={14} /> : <Mic size={14} />}
            </ControlBtn>

            <ControlBtn
              onClick={toggleCamera}
              active={isCameraOff}
              activeClass="bg-red-500/20 text-red-400 border-red-500/30"
              inactiveClass="glass text-white/50 border-white/8"
              title={isCameraOff ? 'Show camera' : 'Hide camera'}
            >
              {isCameraOff ? <VideoOff size={14} /> : <Video size={14} />}
            </ControlBtn>

            <ControlBtn
              onClick={endCall}
              active={false}
              activeClass=""
              inactiveClass="bg-red-500/80 hover:bg-red-500 text-white border-transparent"
              title="End call"
            >
              <PhoneOff size={14} />
            </ControlBtn>
          </>
        ) : (
          <ControlBtn
            onClick={startCall}
            active={false}
            activeClass=""
            inactiveClass="bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 border-brand-500/30"
            title="Start video call"
            disabled={isCalling || isRinging}
          >
            <Video size={14} />
          </ControlBtn>
        )}
      </div>
    </div>
  );
}

function ControlBtn({
  children,
  onClick,
  active,
  activeClass,
  inactiveClass,
  title,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active: boolean;
  activeClass: string;
  inactiveClass: string;
  title: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={clsx(
        'w-9 h-9 rounded-xl flex items-center justify-center border transition-all',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        active ? activeClass : inactiveClass
      )}
    >
      {children}
    </button>
  );
}
