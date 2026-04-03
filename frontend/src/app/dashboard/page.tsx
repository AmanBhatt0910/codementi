'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, LogIn, Clock, Users, Code2, ArrowRight, Loader2, Hash } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useSessionStore } from '@/store/sessionStore';
import { sessionsApi } from '@/lib/api';
import { Session } from '@/types';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { sessions, setSessions, addSession } = useSessionStore();

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    sessionsApi.getMySessions()
      .then(setSessions)
      .catch(() => toast.error('Failed to load sessions'))
      .finally(() => setLoading(false));
  }, [setSessions]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionTitle.trim()) return;
    setCreating(true);
    try {
      const session = await sessionsApi.create(sessionTitle.trim());
      addSession(session);
      setShowCreateModal(false);
      setSessionTitle('');
      toast.success('Session created!');
      router.push(`/session/${session.id}`);
    } catch {
      toast.error('Failed to create session');
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setJoining(true);
    try {
      const session = await sessionsApi.join(joinCode.trim().toUpperCase());
      addSession(session);
      setShowJoinModal(false);
      setJoinCode('');
      toast.success('Joined session!');
      router.push(`/session/${session.id}`);
    } catch {
      toast.error('Invalid or expired session code');
    } finally {
      setJoining(false);
    }
  };

  const getStatusColor = (status: Session['status']) =>
    ({ WAITING: 'text-amber-400 bg-amber-400/10', ACTIVE: 'text-emerald-400 bg-emerald-400/10', ENDED: 'text-white/30 bg-white/5' }[status]);

  const activeSessions = sessions.filter(s => s.status !== 'ENDED');
  const pastSessions = sessions.filter(s => s.status === 'ENDED');

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <p className="text-white/40 text-sm mb-1">Good to see you,</p>
        <h1 className="font-display font-700 text-3xl text-white tracking-tight">{user?.name}</h1>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { label: 'Total Sessions', value: sessions.length, icon: Clock },
          { label: 'Active Now', value: activeSessions.length, icon: Users },
          { label: 'Completed', value: pastSessions.length, icon: Code2 },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="glass rounded-2xl p-5 border border-white/8"
          >
            <stat.icon size={16} className="text-brand-400 mb-3" />
            <div className="font-display font-700 text-2xl text-white">{stat.value}</div>
            <div className="text-xs text-white/40 mt-0.5">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3 mb-8">
        {user?.role === 'MENTOR' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-400 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-brand-500/20"
          >
            <Plus size={16} /> New Session
          </button>
        )}
        <button
          onClick={() => setShowJoinModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 glass hover:bg-white/8 text-white rounded-xl text-sm font-semibold transition-all border border-white/10"
        >
          <LogIn size={16} /> Join Session
        </button>
      </div>

      {/* Sessions List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-brand-400" size={24} />
        </div>
      ) : sessions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass rounded-2xl p-12 text-center border border-white/8 border-dashed"
        >
          <Code2 size={32} className="text-white/20 mx-auto mb-4" />
          <p className="text-white/40 text-sm">No sessions yet.</p>
          <p className="text-white/25 text-xs mt-1">
            {user?.role === 'MENTOR' ? 'Create your first session to get started.' : 'Join a session using a session code.'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-8">
          {activeSessions.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">Active Sessions</h2>
              <div className="space-y-2">
                {activeSessions.map((s, i) => (
                  <SessionCard key={s.id} session={s} index={i} getStatusColor={getStatusColor} />
                ))}
              </div>
            </div>
          )}
          {pastSessions.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">Past Sessions</h2>
              <div className="space-y-2">
                {pastSessions.map((s, i) => (
                  <SessionCard key={s.id} session={s} index={i} getStatusColor={getStatusColor} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <Modal onClose={() => setShowCreateModal(false)} title="New Session">
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs text-white/50 uppercase tracking-wider mb-2">Session Title</label>
              <input
                autoFocus
                type="text"
                placeholder="e.g. React Hooks Deep Dive"
                value={sessionTitle}
                onChange={e => setSessionTitle(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-brand-500/60 transition-all"
              />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2.5 glass hover:bg-white/8 text-white/70 rounded-xl text-sm font-medium transition-all border border-white/10">
                Cancel
              </button>
              <button type="submit" disabled={creating}
                className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-400 text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2">
                {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Create
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Join Modal */}
      {showJoinModal && (
        <Modal onClose={() => setShowJoinModal(false)} title="Join Session">
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-xs text-white/50 uppercase tracking-wider mb-2">Session Code</label>
              <div className="relative">
                <Hash size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  autoFocus
                  type="text"
                  placeholder="e.g. ABC12XYZ"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={8}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/25 font-mono uppercase tracking-widest focus:outline-none focus:border-brand-500/60 transition-all"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowJoinModal(false)}
                className="flex-1 py-2.5 glass hover:bg-white/8 text-white/70 rounded-xl text-sm font-medium transition-all border border-white/10">
                Cancel
              </button>
              <button type="submit" disabled={joining}
                className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-400 text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2">
                {joining ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />}
                Join
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function SessionCard({ session, index, getStatusColor }: {
  session: Session;
  index: number;
  getStatusColor: (s: Session['status']) => string;
}) {
  const router = useRouter();
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={() => router.push(`/session/${session.id}`)}
      className="glass rounded-xl px-5 py-4 border border-white/8 hover:bg-white/6 hover:border-white/12 cursor-pointer transition-all group flex items-center gap-4"
    >
      <div className="w-9 h-9 rounded-lg bg-brand-500/15 flex items-center justify-center flex-shrink-0">
        <Code2 size={16} className="text-brand-300" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white truncate">{session.title}</div>
        <div className="text-xs text-white/35 mt-0.5">
          {session.mentor.name} · {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(session.status)}`}>
          {session.status}
        </span>
        <span className="font-mono text-xs text-white/25 bg-white/5 px-2 py-1 rounded-lg">{session.sessionCode}</span>
        <ArrowRight size={14} className="text-white/20 group-hover:text-white/50 transition-colors" />
      </div>
    </motion.div>
  );
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative glass-strong rounded-2xl p-6 w-full max-w-sm border border-white/12 shadow-2xl"
      >
        <h3 className="font-display font-700 text-lg text-white mb-5">{title}</h3>
        {children}
      </motion.div>
    </div>
  );
}
