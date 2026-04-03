// Auth
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'MENTOR' | 'STUDENT';
  avatarUrl?: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: 'MENTOR' | 'STUDENT';
}

// Session
export interface Session {
  id: string;
  title: string;
  sessionCode: string;
  status: 'WAITING' | 'ACTIVE' | 'ENDED';
  mentor: User;
  student?: User;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
}

// Chat
export interface ChatMessage {
  type: 'CHAT' | 'JOIN' | 'LEAVE';
  sessionId: string;
  senderId: string;
  senderName: string;
  senderRole: 'MENTOR' | 'STUDENT';
  content: string;
  timestamp: string;
}

// Code
export interface CodeUpdate {
  type: 'CODE_UPDATE' | 'LANGUAGE_CHANGE' | 'CURSOR_MOVE' | 'YJS_UPDATE';
  sessionId: string;
  senderId: string;
  senderName: string;
  content?: string;
  language?: string;
  cursorLine?: number;
  cursorColumn?: number;
  yUpdate?: number[];
  timestamp: string;
}

// Signaling
export type SignalingType =
  | 'OFFER' | 'ANSWER' | 'ICE_CANDIDATE'
  | 'CALL_REQUEST' | 'CALL_ACCEPTED' | 'CALL_REJECTED' | 'CALL_ENDED';

export interface SignalingMessage {
  type: SignalingType;
  sessionId: string;
  senderId: string;
  senderName: string;
  payload: RTCSessionDescriptionInit | RTCIceCandidateInit | null;
  timestamp: string;
}

// Session events
export interface SessionEvent {
  type: 'USER_JOINED' | 'USER_LEFT' | 'SESSION_STARTED' | 'SESSION_ENDED';
  sessionId: string;
  userId: string;
  userName: string;
  userRole: 'MENTOR' | 'STUDENT';
  timestamp: string;
}

// Code snapshot
export interface CodeSnapshot {
  content: string;
  language: string;
  updatedAt?: string;
}
