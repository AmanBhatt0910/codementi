'use client';
import { useRef, useState, useCallback, useEffect } from 'react';
import { SignalingMessage } from '@/types';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

interface UseWebRTCOptions {
  sessionId: string;
  userId: string;
  sendSignal: (signal: unknown) => void;
}

export function useWebRTC({ sessionId, userId, sendSignal }: UseWebRTCOptions) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [callState, setCallState] = useState<
    'idle' | 'calling' | 'ringing' | 'active' | 'ended' | 'error'
  >('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        sendSignal({
          type: 'ICE_CANDIDATE',
          sessionId,
          senderId: userId,
          payload: candidate.toJSON(),
        });
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setCallState('ended');
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [sessionId, userId, sendSignal]);

  const startCall = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = createPeerConnection();
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      sendSignal({
        type: 'CALL_REQUEST',
        sessionId,
        senderId: userId,
        payload: offer,
      });

      setCallState('calling');
    } catch (err) {
      console.error('Error starting call:', err);
      setCallState('error');
    }
  }, [createPeerConnection, sendSignal, sessionId, userId]);

  const acceptCall = useCallback(async (offer: RTCSessionDescriptionInit) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = createPeerConnection();
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      sendSignal({
        type: 'CALL_ACCEPTED',
        sessionId,
        senderId: userId,
        payload: answer,
      });

      setCallState('active');
    } catch (err) {
      console.error('Error accepting call:', err);
      setCallState('error');
    }
  }, [createPeerConnection, sendSignal, sessionId, userId]);

  const rejectCall = useCallback(() => {
    sendSignal({
      type: 'CALL_REJECTED',
      sessionId,
      senderId: userId,
      payload: null,
    });
    setCallState('idle');
  }, [sendSignal, sessionId, userId]);

  const endCall = useCallback(() => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    localStreamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setCallState('idle');
    sendSignal({ type: 'CALL_ENDED', sessionId, senderId: userId, payload: null });
  }, [sendSignal, sessionId, userId]);

  const handleSignal = useCallback(async (signal: SignalingMessage) => {
    if (signal.senderId === userId) return; // ignore own signals

    const pc = peerConnectionRef.current;

    switch (signal.type) {
      case 'CALL_REQUEST':
        setCallState('ringing');
        // Store offer for later acceptance
        (window as unknown as Record<string, unknown>).__pendingOffer = signal.payload;
        break;

      case 'CALL_ACCEPTED':
        if (pc && signal.payload) {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.payload as RTCSessionDescriptionInit));
          setCallState('active');
        }
        break;

      case 'ICE_CANDIDATE':
        if (pc && signal.payload) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signal.payload as RTCIceCandidateInit));
          } catch (e) {
            console.error('ICE candidate error:', e);
          }
        }
        break;

      case 'CALL_REJECTED':
        setCallState('idle');
        break;

      case 'CALL_ENDED':
        localStreamRef.current?.getTracks().forEach(t => t.stop());
        peerConnectionRef.current?.close();
        peerConnectionRef.current = null;
        localStreamRef.current = null;
        if (localVideoRef.current) localVideoRef.current.srcObject = null;
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        setCallState('ended');
        break;
    }
  }, [userId]);

  const resetCall = useCallback(() => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    localStreamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setCallState('idle');
  }, []);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
      }
    }
  }, []);

  const acceptPendingCall = useCallback(() => {
    const offer = (window as unknown as Record<string, unknown>).__pendingOffer;
    if (offer) {
      acceptCall(offer as RTCSessionDescriptionInit);
    }
  }, [acceptCall]);

  return {
    localVideoRef,
    remoteVideoRef,
    callState,
    isMuted,
    isCameraOff,
    startCall,
    acceptPendingCall,
    rejectCall,
    endCall,
    resetCall,
    handleSignal,
    toggleMute,
    toggleCamera,
  };
}
