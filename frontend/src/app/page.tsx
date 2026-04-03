'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Code2, Video, MessageSquare, Zap, ArrowRight,
  Users, Shield, Globe
} from 'lucide-react';

const features = [
  { icon: Code2, title: 'Collaborative Editor', desc: 'CRDT-powered Monaco editor with conflict-free real-time sync.' },
  { icon: Video, title: 'HD Video Calls', desc: 'Peer-to-peer WebRTC video — no plugins, no friction.' },
  { icon: MessageSquare, title: 'Live Chat', desc: 'Persistent session chat with full message history.' },
  { icon: Zap, title: 'Instant Sessions', desc: 'Share a code. Join in seconds. Start collaborating.' },
  { icon: Shield, title: 'Secure by Default', desc: 'JWT auth, private rooms, end-to-end signaling.' },
  { icon: Globe, title: 'Multi-language', desc: 'JavaScript, Python, Java, Go, Rust and 20+ more.' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-surface-950 grid-bg noise overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-8 py-5 glass border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
            <Code2 className="w-4.5 h-4.5 text-white" size={18} />
          </div>
          <span className="font-display font-700 text-lg text-white tracking-tight">MentorSpace</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login"
            className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors">
            Sign in
          </Link>
          <Link href="/auth/register"
            className="px-4 py-2 text-sm bg-brand-500 hover:bg-brand-400 text-white rounded-lg font-medium transition-colors">
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center min-h-screen text-center px-6 pt-20">
        {/* Glow blobs */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute top-2/3 left-1/4 w-[300px] h-[300px] rounded-full bg-violet-500/8 blur-[80px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs text-brand-300 font-medium mb-8 border border-brand-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
            Real-time collaboration platform
          </div>

          <h1 className="font-display font-800 text-6xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tight text-white mb-6">
            Code together,<br />
            <span className="gradient-text">learn faster.</span>
          </h1>

          <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
            A production-grade platform for 1-on-1 mentorship sessions with
            collaborative code editing, video calls, and live chat — all in one room.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/register?role=MENTOR"
              className="group flex items-center gap-2 px-6 py-3.5 bg-brand-500 hover:bg-brand-400 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-brand-500/25 hover:shadow-brand-400/35">
              Start as Mentor
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link href="/auth/register?role=STUDENT"
              className="flex items-center gap-2 px-6 py-3.5 glass hover:bg-white/8 text-white rounded-xl font-semibold text-sm transition-all border border-white/10">
              <Users size={16} />
              Join as Student
            </Link>
          </div>
        </motion.div>

        {/* Mock UI preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative mt-20 w-full max-w-5xl mx-auto"
        >
          <div className="glass rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            {/* Mock toolbar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8 bg-white/2">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
              <span className="ml-3 text-xs text-white/30 font-mono">session://ABC12XYZ</span>
              <div className="ml-auto flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </span>
              </div>
            </div>
            {/* Mock editor content */}
            <div className="h-64 bg-[#0d1117] flex">
              <div className="w-10 flex flex-col items-end pr-3 pt-4 gap-1">
                {Array.from({ length: 10 }).map((_, i) => (
                  <span key={i} className="text-xs text-white/20 font-mono leading-5">{i + 1}</span>
                ))}
              </div>
              <div className="flex-1 pt-4 pr-4 font-mono text-sm leading-5">
                <div><span className="text-purple-400">function</span> <span className="text-blue-400">fibonacci</span><span className="text-white/60">(n) {'{'}</span></div>
                <div className="pl-4"><span className="text-purple-400">if</span> <span className="text-white/60">(n {'<='} 1)</span> <span className="text-purple-400">return</span> <span className="text-orange-400">n</span><span className="text-white/60">;</span></div>
                <div className="pl-4"><span className="text-purple-400">return</span> <span className="text-blue-400">fibonacci</span><span className="text-white/60">(n - 1) +</span> <span className="text-blue-400">fibonacci</span><span className="text-white/60">(n - 2);</span></div>
                <div><span className="text-white/60">{'}'}</span></div>
                <div className="mt-2 flex items-center gap-1">
                  <span className="w-0.5 h-4 bg-brand-400 animate-pulse" />
                  <span className="text-white/20 text-xs">▋ mentor typing...</span>
                </div>
              </div>
              <div className="w-56 border-l border-white/8 bg-black/20 flex flex-col">
                <div className="p-3 border-b border-white/8 text-xs text-white/40 font-medium">Chat</div>
                <div className="flex-1 p-3 flex flex-col gap-2">
                  <div className="text-xs"><span className="text-brand-300">Alex:</span> <span className="text-white/60">Let&apos;s optimize this</span></div>
                  <div className="text-xs"><span className="text-violet-300">Sam:</span> <span className="text-white/60">Memoization?</span></div>
                  <div className="text-xs"><span className="text-brand-300">Alex:</span> <span className="text-white/60">Exactly! 🎯</span></div>
                </div>
              </div>
            </div>
          </div>
          {/* Shadow glow below preview */}
          <div className="absolute -bottom-8 inset-x-0 h-16 bg-gradient-to-b from-brand-500/10 to-transparent blur-xl" />
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-32 px-8 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="font-display font-700 text-4xl md:text-5xl text-white mb-4 tracking-tight">
            Everything you need to teach
          </h2>
          <p className="text-white/40 text-lg max-w-xl mx-auto">
            Built for real-time collaboration with professional-grade tools.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.5 }}
              className="glass rounded-2xl p-6 hover:bg-white/6 transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-500/15 flex items-center justify-center mb-4 group-hover:bg-brand-500/25 transition-colors">
                <f.icon size={18} className="text-brand-300" />
              </div>
              <h3 className="font-display font-600 text-white mb-2">{f.title}</h3>
              <p className="text-sm text-white/45 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-8 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto glass rounded-3xl p-12 border border-brand-500/20"
        >
          <h2 className="font-display font-700 text-4xl text-white mb-4 tracking-tight">
            Ready to start teaching?
          </h2>
          <p className="text-white/40 mb-8">Create your first session in under 30 seconds.</p>
          <Link href="/auth/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-brand-500 hover:bg-brand-400 text-white rounded-xl font-semibold transition-all shadow-lg shadow-brand-500/30">
            Create free account <ArrowRight size={16} />
          </Link>
        </motion.div>
      </section>

      <footer className="py-8 text-center text-white/20 text-sm border-t border-white/5">
        © 2025 MentorSpace · Built with Next.js + Spring Boot
      </footer>
    </div>
  );
}
