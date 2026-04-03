import type { CallStatus } from '../domain/types';

/** Raw states emitted by the useWebRTC hook. */
export type RawCallState = 'idle' | 'calling' | 'ringing' | 'active' | 'ended' | 'error';

/**
 * Maps the raw useWebRTC call state to the domain CallStatus:
 *  - calling / ringing → connecting
 *  - ended             → disconnected
 *  - error             → error
 */
export function mapRawStateToStatus(raw: RawCallState): CallStatus {
  switch (raw) {
    case 'idle':    return 'idle';
    case 'calling':
    case 'ringing': return 'connecting';
    case 'active':  return 'active';
    case 'ended':   return 'disconnected';
    case 'error':   return 'error';
    default:        return 'idle';
  }
}

/** True when the local user initiated the call (outgoing). */
export function isOutgoing(raw: RawCallState): boolean {
  return raw === 'calling';
}

/** True when the local user is receiving an incoming call. */
export function isIncoming(raw: RawCallState): boolean {
  return raw === 'ringing';
}
