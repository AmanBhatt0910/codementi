'use client';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import { clsx } from 'clsx';

interface CallControlsBarProps {
  isMuted: boolean;
  isCameraOff: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onEndCall: () => void;
}

/**
 * Floating horizontal toolbar with mute, camera-toggle, and end-call controls.
 * All buttons meet the 44×44 px minimum touch target, have ARIA labels, and
 * expose visible focus rings for keyboard navigation.
 */
export function CallControlsBar({
  isMuted,
  isCameraOff,
  onToggleMute,
  onToggleCamera,
  onEndCall,
}: CallControlsBarProps) {
  return (
    <div role="toolbar" aria-label="Call controls" className="flex items-center gap-3">
      <ControlButton
        onClick={onToggleMute}
        ariaLabel={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        ariaPressed={isMuted}
        className={clsx(
          'glass border-white/10',
          isMuted
            ? 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30'
            : 'text-white/70 hover:text-white hover:bg-white/10',
        )}
      >
        {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
      </ControlButton>

      <ControlButton
        onClick={onToggleCamera}
        ariaLabel={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
        ariaPressed={isCameraOff}
        className={clsx(
          'glass border-white/10',
          isCameraOff
            ? 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30'
            : 'text-white/70 hover:text-white hover:bg-white/10',
        )}
      >
        {isCameraOff ? <VideoOff size={18} /> : <Video size={18} />}
      </ControlButton>

      <ControlButton
        onClick={onEndCall}
        ariaLabel="End call"
        ariaPressed={false}
        className="bg-red-500 hover:bg-red-600 text-white border-transparent"
      >
        <PhoneOff size={18} />
      </ControlButton>
    </div>
  );
}

function ControlButton({
  children,
  onClick,
  ariaLabel,
  ariaPressed,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  ariaLabel: string;
  ariaPressed: boolean;
  className: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      className={clsx(
        'w-12 h-12 rounded-full flex items-center justify-center border',
        'transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
        className,
      )}
    >
      {children}
    </button>
  );
}
