import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { AuthResponse, LoginRequest, RegisterRequest, Session, ChatMessage, CodeSnapshot } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Request interceptor – attach token
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor – handle 401
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: RegisterRequest) =>
    apiClient.post<AuthResponse>('/api/auth/register', data).then(r => r.data),
  login: (data: LoginRequest) =>
    apiClient.post<AuthResponse>('/api/auth/login', data).then(r => r.data),
  me: () =>
    apiClient.get('/api/auth/me').then(r => r.data),
};

// ─── Sessions ────────────────────────────────────────────────────────────────
export const sessionsApi = {
  create: (title: string) =>
    apiClient.post<Session>('/api/sessions', { title }).then(r => r.data),
  join: (sessionCode: string) =>
    apiClient.post<Session>('/api/sessions/join', { sessionCode }).then(r => r.data),
  end: (sessionId: string) =>
    apiClient.post<Session>(`/api/sessions/${sessionId}/end`).then(r => r.data),
  getMySessions: () =>
    apiClient.get<Session[]>('/api/sessions/me').then(r => r.data),
  getById: (sessionId: string) =>
    apiClient.get<Session>(`/api/sessions/${sessionId}`).then(r => r.data),
  getByCode: (code: string) =>
    apiClient.get<Session>(`/api/sessions/code/${code}`).then(r => r.data),
  getMessages: (sessionId: string) =>
    apiClient.get<ChatMessage[]>(`/api/sessions/${sessionId}/messages`).then(r => r.data),
  getSnapshot: (sessionId: string) =>
    apiClient.get<CodeSnapshot>(`/api/sessions/${sessionId}/snapshot`).then(r => r.data),
};
