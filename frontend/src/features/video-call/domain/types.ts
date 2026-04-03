/** The four canonical states for a video call session. */
export type CallStatus = 'idle' | 'connecting' | 'active' | 'disconnected' | 'error';

/** A participant in the video call. */
export interface CallParticipant {
  id: string;
  name: string;
  avatarUrl?: string;
}
