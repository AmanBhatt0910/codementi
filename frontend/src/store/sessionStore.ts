import { create } from 'zustand';
import { Session, ChatMessage, CodeSnapshot } from '@/types';

interface SessionState {
  sessions: Session[];
  currentSession: Session | null;
  messages: ChatMessage[];
  codeSnapshot: CodeSnapshot;
  wsConnected: boolean;
  peerOnline: boolean;

  setSessions: (sessions: Session[]) => void;
  setCurrentSession: (session: Session | null) => void;
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  setCodeSnapshot: (snapshot: Partial<CodeSnapshot>) => void;
  setWsConnected: (v: boolean) => void;
  setPeerOnline: (v: boolean) => void;
  addSession: (session: Session) => void;
  updateSession: (id: string, update: Partial<Session>) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  sessions: [],
  currentSession: null,
  messages: [],
  codeSnapshot: { content: '', language: 'javascript' },
  wsConnected: false,
  peerOnline: false,

  setSessions: (sessions) => set({ sessions }),
  setCurrentSession: (currentSession) => set({ currentSession }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setMessages: (messages) => set({ messages }),
  setCodeSnapshot: (snapshot) =>
    set((state) => ({ codeSnapshot: { ...state.codeSnapshot, ...snapshot } })),
  setWsConnected: (wsConnected) => set({ wsConnected }),
  setPeerOnline: (peerOnline) => set({ peerOnline }),
  addSession: (session) =>
    set((state) => ({ sessions: [session, ...state.sessions] })),
  updateSession: (id, update) =>
    set((state) => ({
      sessions: state.sessions.map((s) => (s.id === id ? { ...s, ...update } : s)),
      currentSession:
        state.currentSession?.id === id
          ? { ...state.currentSession, ...update }
          : state.currentSession,
    })),
}));
