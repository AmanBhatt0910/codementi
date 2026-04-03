'use client';
import { PhoneCall, PhoneIncoming, PhoneOff, AlertCircle, Phone, X, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CallParticipant, CallStatus } from '../domain/types';

interface CallStatusOverlayProps {
  status: CallStatus;
  isOutgoing: boolean;
  isIncoming: boolean;
  remoteParticipant?: CallParticipant;
  onAccept?: () => void;
  onDecline?: () => void;
  onRetry?: () => void;
  onClose?: () => void;
}

/**
 * Absolute-positioned overlay rendered inside CenterVideoStage.
 * Displays contextual UI for every non-active call state:
 *  - connecting (outgoing): spinner + "Calling…" + cancel
 *  - connecting (incoming): avatar + "[Name] is calling…" + decline/answer
 *  - disconnected: "Call ended" + close
 *  - error: error icon + message + close/retry
 */
export function CallStatusOverlay({
  status,
  isOutgoing,
  isIncoming,
  remoteParticipant,
  onAccept,
  onDecline,
  onRetry,
  onClose,
}: CallStatusOverlayProps) {
  const visible = status !== 'active';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={status}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-4 p-6"
          aria-live="polite"
          aria-atomic="true"
        >
          {status === 'connecting' && isOutgoing && (
            <OutgoingView participant={remoteParticipant} onCancel={onDecline} />
          )}
          {status === 'connecting' && isIncoming && (
            <IncomingView
              participant={remoteParticipant}
              onAccept={onAccept}
              onDecline={onDecline}
            />
          )}
          {status === 'disconnected' && <DisconnectedView onClose={onClose} />}
          {status === 'error' && <ErrorView onRetry={onRetry} onClose={onClose} />}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Individual state views ────────────────────────────────────────────────── */

function OutgoingView({
  participant,
  onCancel,
}: {
  participant?: CallParticipant;
  onCancel?: () => void;
}) {
  return (
    <>
      <div className="w-14 h-14 rounded-full bg-brand-500/20 ring-pulse flex items-center justify-center">
        <PhoneCall size={22} className="text-brand-300" />
      </div>
      <div className="text-center">
        <p className="text-white/90 text-sm font-medium">
          Calling{participant ? ` ${participant.name}` : ''}…
        </p>
        <p className="text-white/40 text-xs mt-1">Waiting for answer</p>
      </div>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel call"
          className="flex items-center gap-2 px-4 py-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
        >
          <PhoneOff size={14} />
          Cancel
        </button>
      )}
    </>
  );
}

function IncomingView({
  participant,
  onAccept,
  onDecline,
}: {
  participant?: CallParticipant;
  onAccept?: () => void;
  onDecline?: () => void;
}) {
  return (
    <>
      <div className="w-14 h-14 rounded-full bg-brand-500/20 ring-pulse flex items-center justify-center">
        <PhoneIncoming size={22} className="text-brand-300" />
      </div>
      <div className="text-center">
        <p className="text-white/90 text-sm font-medium">
          {participant?.name ?? 'Someone'} is calling…
        </p>
      </div>
      <div className="flex gap-3">
        {onDecline && (
          <button
            type="button"
            onClick={onDecline}
            aria-label="Decline call"
            className="flex items-center gap-2 px-4 py-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            <X size={14} />
            Decline
          </button>
        )}
        {onAccept && (
          <button
            type="button"
            onClick={onAccept}
            aria-label="Accept call"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/80 hover:bg-emerald-500 text-white rounded-full text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <Phone size={14} />
            Answer
          </button>
        )}
      </div>
    </>
  );
}

function DisconnectedView({ onClose }: { onClose?: () => void }) {
  return (
    <>
      <div className="w-12 h-12 rounded-full bg-surface-700 flex items-center justify-center">
        <PhoneOff size={20} className="text-white/50" />
      </div>
      <div className="text-center">
        <p className="text-white/90 text-sm font-medium">Call ended</p>
        <p className="text-white/40 text-xs mt-1">The call has disconnected</p>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close call overlay"
          className="px-4 py-2 glass hover:bg-white/10 text-white/70 hover:text-white rounded-full text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
        >
          Close
        </button>
      )}
    </>
  );
}

function ErrorView({
  onRetry,
  onClose,
}: {
  onRetry?: () => void;
  onClose?: () => void;
}) {
  return (
    <>
      <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
        <AlertCircle size={20} className="text-red-400" />
      </div>
      <div className="text-center">
        <p className="text-white/90 text-sm font-medium">Connection failed</p>
        <p className="text-white/40 text-xs mt-1">Check your camera and microphone</p>
      </div>
      <div className="flex gap-3">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="px-4 py-2 glass hover:bg-white/10 text-white/70 hover:text-white rounded-full text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          >
            Close
          </button>
        )}
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            aria-label="Retry call"
            className="flex items-center gap-2 px-4 py-2 bg-brand-500/80 hover:bg-brand-500 text-white rounded-full text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        )}
      </div>
    </>
  );
}
