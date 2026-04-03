import { AuthResponse } from "@/types";
import api from "./api";

export const authApi = {
  register: async (data: {
    name: string;
    email: string;
    password: string;
    role: "MENTOR" | "STUDENT";
  }): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>("/api/auth/register", data);
    return res.data;
  },

  login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>("/api/auth/login", data);
    return res.data;
  },
};

export const sessionApi = {
  create: async () => {
    const res = await api.post("/api/sessions");
    return res.data;
  },

  join: async (inviteToken: string) => {
    const res = await api.post(`/api/sessions/join/${inviteToken}`);
    return res.data;
  },

  end: async (sessionId: number) => {
    const res = await api.post(`/api/sessions/${sessionId}/end`);
    return res.data;
  },

  get: async (sessionId: number) => {
    const res = await api.get(`/api/sessions/${sessionId}`);
    return res.data;
  },

  getByToken: async (inviteToken: string) => {
    const res = await api.get(`/api/sessions/token/${inviteToken}`);
    return res.data;
  },

  getMy: async () => {
    const res = await api.get("/api/sessions/my");
    return res.data;
  },

  getMessages: async (sessionId: number) => {
    const res = await api.get(`/api/sessions/${sessionId}/messages`);
    return res.data;
  },

  getLatestCode: async (sessionId: number) => {
    const res = await api.get(`/api/sessions/${sessionId}/code/latest`);
    return res.data;
  },

  saveCodeSnapshot: async (sessionId: number, code: string, language: string) => {
    const res = await api.post(`/api/sessions/${sessionId}/code/snapshot`, { code, language });
    return res.data;
  },
};
