'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    setMobileMenuOpen(false);
    logout();
    router.push('/login');
  };

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/tasks', label: 'Tasks' },
    { href: '/leaderboard', label: 'Leaderboard' },
  ];

  if (!user) return null;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-surface-800/80 bg-surface-900/90 backdrop-blur-md shadow-soft">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex shrink-0 items-center">
            <Link
              href="/dashboard"
              className="rounded-lg px-2 py-1 text-xl font-bold tracking-tight text-slate-50 transition-colors hover:text-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-surface-900"
            >
              UCP Connect
            </Link>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex md:items-center md:gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-surface-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-surface-900"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop: user + logout */}
          <div className="hidden md:flex md:items-center md:gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-50">
                {user.profile?.firstName} {user.profile?.lastName}
              </p>
              <p className="text-xs text-slate-400">
                {user.points} pts · {user.reputation} rep
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-surface-800 bg-surface-800 px-4 py-2 text-sm font-medium text-slate-100 shadow-card transition-all hover:bg-surface-800/80 hover:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-surface-900 btn-active"
            >
              Logout
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex items-center justify-center rounded-lg p-2 text-slate-200 hover:bg-surface-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 md:hidden"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle menu"
          >
            <span className="sr-only">Open menu</span>
            {mobileMenuOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="animate-fade-in border-t border-surface-800 bg-surface-900 md:hidden">
          <div className="space-y-1 px-4 pb-4 pt-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-base font-medium text-slate-100 hover:bg-surface-800"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 border-t border-surface-800 pt-3">
              <p className="px-3 py-1 text-sm font-medium text-slate-50">
                {user.profile?.firstName} {user.profile?.lastName}
              </p>
              <p className="px-3 py-1 text-xs text-slate-400">{user.points} pts · {user.reputation} rep</p>
              <button
                onClick={handleLogout}
                className="mt-2 w-full rounded-lg bg-surface-800 px-3 py-2.5 text-left text-sm font-medium text-slate-100 hover:bg-surface-800/80"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
