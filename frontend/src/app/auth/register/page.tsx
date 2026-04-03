"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  HiMail, HiLockClosed, HiUser, HiEye, HiEyeOff, HiSparkles,
  HiAcademicCap, HiLightBulb,
} from "react-icons/hi";
import { authApi } from "@/lib/apiClient";
import { saveAuth } from "@/lib/auth";
import { Role } from "@/types";

function PasswordStrength({ password }: { password: string }) {
  const strength = useMemo(() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  }, [password]);

  if (!password) return null;

  const labels = ["Weak", "Fair", "Good", "Strong"];
  const colors = ["bg-red-500", "bg-yellow-500", "bg-blue-500", "bg-green-500"];
  const textColors = ["text-red-400", "text-yellow-400", "text-blue-400", "text-green-400"];

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < strength ? colors[strength - 1] : "bg-gray-700"}`}
          />
        ))}
      </div>
      <p className={`text-xs ${textColors[strength - 1] || "text-gray-500"}`}>
        {labels[strength - 1] || "Too short"}
      </p>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<Role>("STUDENT");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const auth = await authApi.register({ name, email, password, role });
      saveAuth(auth);
      toast.success(`Welcome to CodeMenti, ${auth.name}! 🎉`);
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Registration failed. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const roles: { value: Role; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      value: "STUDENT",
      label: "Student",
      desc: "Learn from expert mentors",
      icon: <HiAcademicCap className="text-2xl" />,
    },
    {
      value: "MENTOR",
      label: "Mentor",
      desc: "Teach and guide students",
      icon: <HiLightBulb className="text-2xl" />,
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center animated-gradient px-4 py-8 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="inline-flex items-center gap-2 mb-3"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg glow-indigo">
              <HiSparkles className="text-white text-lg" />
            </div>
            <span className="text-2xl font-bold gradient-text">CodeMenti</span>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400"
          >
            Create your free account
          </motion.p>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="glass rounded-2xl p-8 shadow-2xl"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name</label>
              <div className="relative">
                <HiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-lg pointer-events-none" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-premium pl-10"
                  placeholder="John Doe"
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email address</label>
              <div className="relative">
                <HiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-lg pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-premium pl-10"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <HiLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-lg pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-premium pl-10 pr-10"
                  placeholder="Min 6 characters"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <HiEyeOff className="text-lg" /> : <HiEye className="text-lg" />}
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">I am a…</label>
              <div className="grid grid-cols-2 gap-3">
                {roles.map(({ value, label, desc, icon }) => (
                  <motion.button
                    key={value}
                    type="button"
                    onClick={() => setRole(value)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative p-4 rounded-xl border transition-all duration-200 text-left ${
                      role === value
                        ? "border-indigo-500 bg-indigo-600/20 shadow-lg glow-indigo-sm"
                        : "border-gray-700/60 bg-gray-800/40 hover:border-gray-600"
                    }`}
                  >
                    {role === value && (
                      <motion.div
                        layoutId="role-indicator"
                        className="absolute inset-0 rounded-xl bg-indigo-600/10 border border-indigo-500/50"
                        transition={{ type: "spring", bounce: 0.2 }}
                      />
                    )}
                    <div className={`relative ${role === value ? "text-indigo-400" : "text-gray-500"}`}>
                      {icon}
                    </div>
                    <p className={`relative text-sm font-semibold mt-1 ${role === value ? "text-indigo-300" : "text-gray-300"}`}>
                      {label}
                    </p>
                    <p className="relative text-xs text-gray-500 mt-0.5">{desc}</p>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.99 }}
              className="btn-primary w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold transition-all duration-200 shadow-lg glow-indigo-sm"
            >
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.span
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center gap-2"
                  >
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account…
                  </motion.span>
                ) : (
                  <motion.span
                    key="label"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    Create Account
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
