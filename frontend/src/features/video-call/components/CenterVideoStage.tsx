'use client';
import type { RefObject, ReactNode } from 'react';
import { VideoOff } from 'lucide-react';
import type { CallParticipant } from '../domain/types';

interface CenterVideoStageProps {
  remoteVideoRef: RefObject<HTMLVideoElement>;
  localVideoRef: RefObject<HTMLVideoElement>;
  /** Whether the remote video stream is live and should be shown. */
  isActive: boolean;
  isCameraOff: boolean;
  remoteParticipant?: CallParticipant;
  /** Overlay content rendered on top of the video (e.g. CallStatusOverlay). */
  children?: ReactNode;
}

/**
 * Centered 1:1 square video stage.
 * Remote video fills the square; local video is shown as a PiP in the corner.
 * Children are rendered above the video elements (for overlays).
 */
export function CenterVideoStage({
  remoteVideoRef,
  localVideoRef,
  isActive,
  isCameraOff,
  remoteParticipant,
  children,
}: CenterVideoStageProps) {
  return (
    <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-surface-900 shadow-2xl">
      {/* Remote video — visible only during an active call */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
          isActive ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Avatar placeholder shown when remote video is not yet live */}
      {!isActive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          {remoteParticipant ? (
            <>
              <div className="w-16 h-16 rounded-full bg-brand-500/20 flex items-center justify-center text-2xl font-semibold text-brand-300 select-none">
                {remoteParticipant.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-white/40">{remoteParticipant.name}</span>
            </>
          ) : (
            <VideoOff size={28} className="text-white/15" />
          )}
        </div>
      )}

      {/* Local video PiP — bottom-right corner, 1:1 */}
      <div
        className="absolute bottom-3 right-3 w-1/4 aspect-square rounded-xl overflow-hidden bg-black/60 border border-white/10 shadow-lg"
        aria-label="Your camera"
      >
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        {isCameraOff && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
            <VideoOff size={14} className="text-white/40" />
          </div>
        )}
      </div>

      {/* Overlay slot (status messages, incoming call UI, etc.) */}
      {children}
    </div>
  );
}
