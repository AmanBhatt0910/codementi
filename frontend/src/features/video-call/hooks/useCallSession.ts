'use client';
import type { RefObject } from 'react';
import type { User } from '@/types';
import type { CallParticipant, CallStatus } from '../domain/types';
import { mapRawStateToStatus, isOutgoing, isIncoming } from '../services/rtcAdapter';

/** Minimum surface of the useWebRTC return value this hook depends on. */
interface WebRTCHandle {
  localVideoRef: RefObject<HTMLVideoElement>;
  remoteVideoRef: RefObject<HTMLVideoElement>;
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

export interface CallSession {
  status: CallStatus;
  isOutgoingCall: boolean;
  isIncomingCall: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  remoteParticipant?: CallParticipant;
  localVideoRef: RefObject<HTMLVideoElement>;
  remoteVideoRef: RefObject<HTMLVideoElement>;
  startCall: () => void;
  endCall: () => void;
  resetCall: () => void;
  acceptCall: () => void;
  rejectCall: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
}

/**
 * Adapts the raw useWebRTC return value to the domain CallSession interface,
 * mapping raw states to canonical CallStatus values.
 */
export function useCallSession(
  webrtc: WebRTCHandle,
  remoteUser?: User,
): CallSession {
  return {
    status: mapRawStateToStatus(webrtc.callState),
    isOutgoingCall: isOutgoing(webrtc.callState),
    isIncomingCall: isIncoming(webrtc.callState),
    isMuted: webrtc.isMuted,
    isCameraOff: webrtc.isCameraOff,
    remoteParticipant: remoteUser
      ? { id: remoteUser.id, name: remoteUser.name, avatarUrl: remoteUser.avatarUrl }
      : undefined,
    localVideoRef: webrtc.localVideoRef,
    remoteVideoRef: webrtc.remoteVideoRef,
    startCall: webrtc.startCall,
    endCall: webrtc.endCall,
    resetCall: webrtc.resetCall,
    acceptCall: webrtc.acceptPendingCall,
    rejectCall: webrtc.rejectCall,
    toggleMute: webrtc.toggleMute,
    toggleCamera: webrtc.toggleCamera,
  };
}
