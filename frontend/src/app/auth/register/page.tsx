'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Loader2, Code2, GraduationCap, BookOpen } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);

  const defaultRole = (searchParams.get('role') || 'STUDENT') as 'MENTOR' | 'STUDENT';
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: defaultRole,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await authApi.register(form);
      setAuth(data.user, data.token);
      toast.success(`Welcome, ${data.user.name}!`);
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-center justify-center gap-2.5 mb-8">
        <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/30">
          <Code2 size={18} className="text-white" />
        </div>
        <span className="font-display font-700 text-xl text-white tracking-tight">MentorSpace</span>
      </div>

      <div className="glass rounded-2xl p-8 border border-white/8">
        <h1 className="font-display font-700 text-2xl text-white mb-1 tracking-tight">Create account</h1>
        <p className="text-sm text-white/40 mb-6">Join MentorSpace and start collaborating.</p>

        {/* Role selector */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {(['MENTOR', 'STUDENT'] as const).map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setForm({ ...form, role })}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-sm font-medium transition-all ${
                form.role === role
                  ? 'border-brand-500 bg-brand-500/15 text-brand-200'
                  : 'border-white/10 bg-white/3 text-white/50 hover:bg-white/6 hover:text-white/70'
              }`}
            >
              {role === 'MENTOR'
                ? <BookOpen size={20} className={form.role === 'MENTOR' ? 'text-brand-300' : 'text-white/40'} />
                : <GraduationCap size={20} className={form.role === 'STUDENT' ? 'text-brand-300' : 'text-white/40'} />
              }
              {role.charAt(0) + role.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">Full name</label>
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                required
                placeholder="John Doe"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-500/60 focus:bg-white/7 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">Email</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-500/60 focus:bg-white/7 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-500/60 focus:bg-white/7 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-500 hover:bg-brand-400 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 mt-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Creating account…' : `Join as ${form.role.charAt(0) + form.role.slice(1).toLowerCase()}`}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-white/8 text-center text-sm text-white/40">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-brand-300 hover:text-brand-200 font-medium transition-colors">
            Sign in
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
