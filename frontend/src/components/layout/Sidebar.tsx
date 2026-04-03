'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Code2, LayoutDashboard, LogOut, Settings, BookOpen, GraduationCap } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = () => {
    clearAuth();
    toast.success('Signed out');
    router.push('/');
  };

  return (
    <aside className="w-16 lg:w-56 h-full flex flex-col bg-surface-900 border-r border-white/6 flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/6">
        <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-brand-500/25">
          <Code2 size={16} className="text-white" />
        </div>
        <span className="font-display font-700 text-base text-white tracking-tight hidden lg:block">MentorSpace</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
              pathname === item.href
                ? 'bg-brand-500/20 text-brand-300 border border-brand-500/20'
                : 'text-white/45 hover:text-white/80 hover:bg-white/6'
            )}
          >
            <item.icon size={17} className="flex-shrink-0" />
            <span className="hidden lg:block">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-white/6">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1">
          <div className="w-7 h-7 rounded-full bg-brand-500/25 flex items-center justify-center flex-shrink-0">
            {user?.role === 'MENTOR'
              ? <BookOpen size={13} className="text-brand-300" />
              : <GraduationCap size={13} className="text-brand-300" />
            }
          </div>
          <div className="hidden lg:block min-w-0">
            <div className="text-xs font-semibold text-white/80 truncate">{user?.name}</div>
            <div className="text-xs text-white/30 capitalize">{user?.role?.toLowerCase()}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
        >
          <LogOut size={16} className="flex-shrink-0" />
          <span className="hidden lg:block">Sign out</span>
        </button>
      </div>
    </aside>
  );
}
