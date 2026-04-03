import type { CallStatus } from '../domain/types';

/** Valid outbound transitions from each call state. */
const VALID_TRANSITIONS: Readonly<Record<CallStatus, ReadonlyArray<CallStatus>>> = {
  idle:         ['connecting'],
  connecting:   ['active', 'disconnected', 'error', 'idle'],
  active:       ['disconnected', 'error', 'idle'],
  disconnected: ['connecting', 'idle'],
  error:        ['connecting', 'idle'],
};

export function canTransition(from: CallStatus, to: CallStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getStatusLabel(status: CallStatus): string {
  switch (status) {
    case 'idle':         return 'Ready';
    case 'connecting':   return 'Connecting';
    case 'active':       return 'In call';
    case 'disconnected': return 'Disconnected';
    case 'error':        return 'Connection error';
  }
}
