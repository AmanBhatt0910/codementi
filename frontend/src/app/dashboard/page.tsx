"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  HiSparkles, HiPlus, HiLogout, HiClock, HiCheckCircle,
  HiExclamationCircle, HiClipboardCopy, HiExternalLink,
  HiUsers, HiCode, HiVideoCamera, HiChartBar, HiX,
} from "react-icons/hi";
import { getAuth, clearAuth } from "@/lib/auth";
import { sessionApi } from "@/lib/apiClient";
import { SessionResponse, AuthResponse } from "@/types";

// Skeleton card for loading state
function SkeletonCard() {
  return (
    <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="skeleton w-16 h-6 rounded-full" />
          <div>
            <div className="skeleton w-32 h-4 mb-2" />
            <div className="skeleton w-48 h-3" />
          </div>
        </div>
        <div className="skeleton w-16 h-8 rounded-lg" />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gray-900/50 rounded-xl p-5 border border-gray-800 hover:border-gray-700 transition-all duration-200`}
    >
      <div className={`inline-flex p-2.5 rounded-lg ${color} mb-3`}>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-gray-400 mt-0.5">{label}</p>
    </motion.div>
  );
}

function SessionCard({ session, userId, onCopyToken }: {
  session: SessionResponse;
  userId: number;
  onCopyToken: (token: string) => void;
}) {
  const statusConfig = {
    ACTIVE: { color: "text-green-400", bg: "bg-green-400/10 border-green-500/30", dot: "bg-green-400" },
    PENDING: { color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-500/30", dot: "bg-yellow-400" },
    ENDED: { color: "text-gray-400", bg: "bg-gray-400/10 border-gray-500/30", dot: "bg-gray-500" },
  };
  const cfg = statusConfig[session.status] || statusConfig.ENDED;
  const isMentor = session.mentorId === userId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900/60 rounded-xl p-5 border border-gray-800 hover:border-indigo-500/30 transition-all duration-200 group"
      style={{
        background: "linear-gradient(135deg, rgba(17,24,39,0.8) 0%, rgba(15,20,35,0.8) 100%)"
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-4 min-w-0">
          {/* Status badge */}
          <div className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${cfg.bg} ${cfg.color}`}>
            <div className={`w-1.5 h-1.5 rounded-full pulse-dot ${cfg.dot}`} />
            {session.status}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-white font-semibold text-sm truncate">
                Session #{session.id}
              </p>
              <span className={`text-xs px-1.5 py-0.5 rounded-md ${isMentor ? "bg-indigo-600/20 text-indigo-400" : "bg-purple-600/20 text-purple-400"}`}>
                {isMentor ? "Mentor" : "Student"}
              </span>
            </div>
            <p className="text-gray-500 text-xs mt-0.5 truncate">
              {isMentor
                ? session.studentName ? `With ${session.studentName}` : "Waiting for student…"
                : `With ${session.mentorName}`}
            </p>
            {session.createdAt && (() => { const d = new Date(session.createdAt); return isNaN(d.getTime()) ? null : (
              <p className="text-gray-600 text-xs mt-0.5 flex items-center gap-1">
                <HiClock className="text-xs" />
                {d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            ); })()}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Copy token */}
          {session.inviteToken && session.status !== "ENDED" && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onCopyToken(session.inviteToken)}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-400 hover:text-white transition-all"
              title="Copy invite token"
            >
              <HiClipboardCopy className="text-sm" />
            </motion.button>
          )}
          {session.status !== "ENDED" && (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href={`/session/${session.id}`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-400 text-sm font-medium transition-all"
              >
                <HiExternalLink className="text-xs" />
                Open
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function JoinModal({ onClose, onJoin }: { onClose: () => void; onJoin: (token: string) => Promise<void> }) {
  const [token, setToken] = useState("");
  const [joining, setJoining] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    setJoining(true);
    try {
      await onJoin(token.trim());
    } finally {
      setJoining(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", bounce: 0.2 }}
        className="glass rounded-2xl p-6 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white">Join a Session</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          >
            <HiX />
          </button>
        </div>
        <p className="text-sm text-gray-400 mb-4">Enter the invite token shared by your mentor.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste invite token here…"
            className="input-premium font-mono text-sm"
            autoFocus
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <motion.button
              type="submit"
              disabled={joining || !token.trim()}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-semibold text-sm transition-all"
            >
              {joining ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Joining…
                </span>
              ) : "Join Session"}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [sessions, setSessions] = useState<SessionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const loadSessions = useCallback(async () => {
    try {
      const data = await sessionApi.getMy();
      setSessions(data);
    } catch {
      // non-critical
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
    try {
      const session: SessionResponse = await sessionApi.create();
      toast.success("Session created! Redirecting…");
      router.push(`/session/${session.id}`);
    } catch {
      toast.error("Failed to create session. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleJoinSession = async (token: string) => {
    try {
      const session: SessionResponse = await sessionApi.join(token);
      toast.success("Joined session!");
      router.push(`/session/${session.id}`);
    } catch {
      toast.error("Session not found or already ended.");
    }
  };

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token).then(() => {
      toast.success("Invite token copied to clipboard!");
    }).catch(() => {
      toast.error("Failed to copy token.");
    });
  };

  const handleLogout = () => {
    clearAuth();
    toast("Signed out. See you soon! 👋", { icon: "👋" });
    router.push("/auth/login");
  };

  // Stats
  const stats = {
    total: sessions.length,
    active: sessions.filter((s) => s.status === "ACTIVE").length,
    pending: sessions.filter((s) => s.status === "PENDING").length,
    completed: sessions.filter((s) => s.status === "ENDED").length,
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-950 relative">
      {/* Background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-900/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-purple-900/15 rounded-full blur-3xl" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 border-b border-gray-800/60 bg-gray-950/80 backdrop-blur-md sticky top-0">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center glow-indigo-sm">
              <HiSparkles className="text-white text-sm" />
            </div>
            <span className="font-bold text-lg gradient-text">CodeMenti</span>
            <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-600/20 text-indigo-300 border border-indigo-600/30">
              {user.role}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-gray-300 text-sm hidden sm:block">{user.name}</span>
            </div>
            <motion.button
              onClick={handleLogout}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-800"
            >
              <HiLogout className="text-base" />
              <span className="hidden sm:block">Sign out</span>
            </motion.button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-white">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"},{" "}
            <span className="gradient-text">{user.name.split(" ")[0]}</span> 👋
          </h1>
          <p className="text-gray-400 mt-1">
            {user.role === "MENTOR" ? "Ready to inspire? Create a new session to get started." : "Ready to learn? Join a session or view your history."}
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: <HiChartBar className="text-indigo-400" />, label: "Total Sessions", value: stats.total, color: "bg-indigo-600/10" },
            { icon: <HiVideoCamera className="text-green-400" />, label: "Active", value: stats.active, color: "bg-green-600/10" },
            { icon: <HiExclamationCircle className="text-yellow-400" />, label: "Pending", value: stats.pending, color: "bg-yellow-600/10" },
            { icon: <HiCheckCircle className="text-gray-400" />, label: "Completed", value: stats.completed, color: "bg-gray-600/10" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <StatCard {...stat} />
            </motion.div>
          ))}
        </div>

        {/* Action Cards */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10"
        >
          {user.role === "MENTOR" && (
            <div className="relative group overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-900/30 to-purple-900/20 p-6 hover:border-indigo-500/40 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-2xl transform translate-x-8 -translate-y-8" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30">
                    <HiPlus className="text-indigo-400 text-lg" />
                  </div>
                  <h2 className="text-base font-semibold text-white">Start a New Session</h2>
                </div>
                <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                  Create a private collaborative room with code editor, video, and chat.
                </p>
                <motion.button
                  onClick={handleCreateSession}
                  disabled={creating}
                  whileHover={{ scale: creating ? 1 : 1.01 }}
                  whileTap={{ scale: creating ? 1 : 0.99 }}
                  className="btn-primary w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-60 text-white font-semibold text-sm transition-all shadow-lg"
                >
                  {creating ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating…
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <HiPlus />
                      Create Session
                    </span>
                  )}
                </motion.button>
              </div>
            </div>
          )}

          <div className="relative group overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-900/30 to-indigo-900/20 p-6 hover:border-purple-500/40 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-2xl transform translate-x-8 -translate-y-8" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-purple-600/20 border border-purple-500/30">
                  <HiUsers className="text-purple-400 text-lg" />
                </div>
                <h2 className="text-base font-semibold text-white">Join a Session</h2>
              </div>
              <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                Enter the invite token shared by your mentor to join their session.
              </p>
              <motion.button
                onClick={() => setShowJoinModal(true)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="btn-primary w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-sm transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <HiCode />
                Join with Token
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Sessions List */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Your Sessions</h2>
            {sessions.length > 0 && (
              <span className="text-xs text-gray-500">{sessions.length} session{sessions.length !== 1 ? "s" : ""}</span>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : sessions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 rounded-2xl border border-dashed border-gray-800"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-800/50 flex items-center justify-center">
                <HiCode className="text-3xl text-gray-600" />
              </div>
              <p className="text-gray-400 font-medium">No sessions yet</p>
              <p className="text-gray-600 text-sm mt-1">
                {user.role === "MENTOR" ? "Create your first session above" : "Join a session using an invite token"}
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session, i) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <SessionCard
                    session={session}
                    userId={user.userId}
                    onCopyToken={handleCopyToken}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>

      {/* Join Modal */}
      <AnimatePresence>
        {showJoinModal && (
          <JoinModal
            onClose={() => setShowJoinModal(false)}
            onJoin={handleJoinSession}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
