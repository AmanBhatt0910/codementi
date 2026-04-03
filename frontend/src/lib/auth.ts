"use client";

import { AuthResponse } from "@/types";

export function saveAuth(auth: AuthResponse): void {
  localStorage.setItem("token", auth.token);
  localStorage.setItem("user", JSON.stringify(auth));
}

export function getAuth(): AuthResponse | null {
  if (typeof window === "undefined") return null;
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

export function clearAuth(): void {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function isAuthenticated(): boolean {
  return !!getAuth()?.token;
}
