"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAuth, clearAuth } from "@/lib/auth";
import { sessionApi } from "@/lib/apiClient";
import { SessionResponse, AuthResponse } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [sessions, setSessions] = useState<SessionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joinToken, setJoinToken] = useState("");
  const [joiningToken, setJoiningToken] = useState(false);
  const [error, setError] = useState("");

  const loadSessions = useCallback(async () => {
    try {
      const data = await sessionApi.getMy();
      setSessions(data);
    } catch {
      // sessions load error - non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const auth = getAuth();
    if (!auth) {
      router.replace("/auth/login");
      return;
    }
    setUser(auth);
    loadSessions();
  }, [router, loadSessions]);

  const handleCreateSession = async () => {
    setCreating(true);
    setError("");
    try {
      const session: SessionResponse = await sessionApi.create();
      router.push(`/session/${session.id}`);
    } catch {
      setError("Failed to create session.");
    } finally {
      setCreating(false);
    }
  };

  const handleJoinSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinToken.trim()) return;
    setJoiningToken(true);
    setError("");
    try {
      const session: SessionResponse = await sessionApi.join(joinToken.trim());
      router.push(`/session/${session.id}`);
    } catch {
      setError("Session not found or already ended.");
    } finally {
      setJoiningToken(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    router.push("/auth/login");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "text-green-400 bg-green-400/10";
      case "PENDING": return "text-yellow-400 bg-yellow-400/10";
      case "ENDED": return "text-gray-400 bg-gray-400/10";
      default: return "text-gray-400";
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Navbar */}
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-indigo-400">CodeMenti</span>
            <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-600/20 text-indigo-300 border border-indigo-600/30">
              {user.role}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-sm">Hello, {user.name}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-900/40 border border-red-700 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {user.role === "MENTOR" && (
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h2 className="text-lg font-semibold text-white mb-2">Start a New Session</h2>
              <p className="text-gray-400 text-sm mb-4">
                Create a private room and share the invite link with your student.
              </p>
              <button
                onClick={handleCreateSession}
                disabled={creating}
                className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold transition-colors"
              >
                {creating ? "Creating…" : "Create Session"}
              </button>
            </div>
          )}

          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <h2 className="text-lg font-semibold text-white mb-2">Join a Session</h2>
            <p className="text-gray-400 text-sm mb-4">
              Enter the invite token shared by your mentor.
            </p>
            <form onSubmit={handleJoinSession} className="flex gap-2">
              <input
                type="text"
                value={joinToken}
                onChange={(e) => setJoinToken(e.target.value)}
                placeholder="Invite token…"
                className="flex-1 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
              <button
                type="submit"
                disabled={joiningToken || !joinToken.trim()}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm transition-colors"
              >
                {joiningToken ? "Joining…" : "Join"}
              </button>
            </form>
          </div>
        </div>

        {/* Sessions List */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Your Sessions</h2>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p>No sessions yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="bg-gray-900 rounded-xl p-5 border border-gray-800 flex items-center justify-between hover:border-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(session.status)}`}>
                      {session.status}
                    </span>
                    <div>
                      <p className="text-white font-medium text-sm">
                        Session #{session.id}
                      </p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        Mentor: {session.mentorName}
                        {session.studentName && ` · Student: ${session.studentName}`}
                      </p>
                      {session.inviteToken && session.status !== "ENDED" && (
                        <p className="text-gray-600 text-xs mt-0.5 font-mono">
                          Token: {session.inviteToken}
                        </p>
                      )}
                    </div>
                  </div>
                  {session.status !== "ENDED" && (
                    <Link
                      href={`/session/${session.id}`}
                      className="px-4 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-600/30 text-indigo-400 text-sm font-medium transition-colors"
                    >
                      Open
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
