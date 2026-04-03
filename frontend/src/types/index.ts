export type Role = "MENTOR" | "STUDENT";
export type SessionStatus = "PENDING" | "ACTIVE" | "ENDED";

export interface AuthResponse {
  token: string;
  email: string;
  name: string;
  role: Role;
  userId: number;
}

export interface SessionResponse {
  id: number;
  mentorId: number;
  mentorName: string;
  studentId: number | null;
  studentName: string | null;
  status: SessionStatus;
  inviteToken: string;
  createdAt: string;
  endedAt: string | null;
}

export interface MessageResponse {
  id: number;
  sessionId: number;
  senderId: number;
  senderName: string;
  content: string;
  createdAt: string;
}

export interface ChatMessage {
  sessionId: number;
  senderId: number;
  senderName: string;
  content: string;
  timestamp: string;
  type: "CHAT" | "JOIN" | "LEAVE";
}

export interface CodeMessage {
  sessionId: number;
  userId: number;
  userName: string;
  code: string;
  language: string;
  delta?: string;
}

export interface SignalMessage {
  sessionId: number;
  senderId: number;
  targetId: number;
  type: "offer" | "answer" | "ice-candidate" | "join" | "leave";
  payload: unknown;
}
