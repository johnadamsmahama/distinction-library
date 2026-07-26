'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function DashboardNav({
  fullName,
  unreadCount,
  isStaff = false,
  isAdmin = false,
}: {
  fullName: string | null;
  unreadCount: number;
  isStaff?: boolean;
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <nav className="sticky top-0 z-50 bg-navy-deep border-b border-gold/10">
      <div className="max-w-content mx-auto h-[60px] px-7 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-[9px]">
          <div className="w-[30px] h-[30px] bg-gold rounded-[7px] flex items-center justify-center font-display font-black text-[15px] text-navy">
            D
          </div>
          <div className="font-condensed font-bold text-[17px] hidden sm:block">
            <span className="text-white">Distinction</span> <span className="text-gold">Library</span>
          </div>
        </Link>

        <div className="flex items-center gap-5">
          <div className="hidden md:flex items-center gap-5">
            <Link href="/leaderboard" className="font-condensed font-bold text-xs uppercase tracking-wide text-white/50 hover:text-white transition-colors">
              Leaderboard
            </Link>
            <Link href="/blog" className="font-condensed font-bold text-xs uppercase tracking-wide text-white/50 hover:text-white transition-colors">
              Blog
            </Link>
            <Link href="/support" className="font-condensed font-bold text-xs uppercase tracking-wide text-white/50 hover:text-white transition-colors">
              Support
            </Link>
            <Link href="/dashboard/settings" className="font-condensed font-bold text-xs uppercase tracking-wide text-white/50 hover:text-white transition-colors">
              Settings
            </Link>
          </div>
          {isStaff && (
            <Link
              href="/moderate"
              className="font-condensed font-bold text-xs uppercase tracking-wide text-gold hover:text-gold-light transition-colors hidden sm:block"
            >
              Moderate
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/admin"
              className="font-condensed font-bold text-xs uppercase tracking-wide text-gold hover:text-gold-light transition-colors hidden sm:block"
            >
              Admin
            </Link>
          )}
          <Link
            href="/dashboard/notifications"
            className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors"
            aria-label="Notifications"
          >
            <svg viewBox="0 0 24 24" className="w-[19px] h-[19px] stroke-white/70 fill-none" strokeWidth={1.8}>
              <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-[7px] h-[7px] rounded-full bg-gold" />
            )}
          </Link>

          <span className="hidden sm:block font-condensed font-semibold text-xs text-white/60">
            {fullName ?? 'Student'}
          </span>

          <button
            onClick={handleLogout}
            className="hidden md:block font-condensed font-bold text-xs uppercase tracking-wide text-white/50 hover:text-white transition-colors"
          >
            Log out
          </button>

          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors"
            aria-label="Open menu"
          >
            <svg viewBox="0 0 24 24" className="w-[20px] h-[20px] stroke-white fill-none" strokeWidth={1.8}>
              {menuOpen ? (
                <path d="M6 6l12 12M6 18L18 6" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-navy-deep border-t border-gold/10 px-7 py-4 flex flex-col gap-4">
          <Link href="/leaderboard" onClick={() => setMenuOpen(false)} className="font-condensed font-bold text-sm uppercase tracking-wide text-white/70 hover:text-white transition-colors">
            Leaderboard
          </Link>
          <Link href="/blog" onClick={() => setMenuOpen(false)} className="font-condensed font-bold text-sm uppercase tracking-wide text-white/70 hover:text-white transition-colors">
            Blog
          </Link>
          <Link href="/support" onClick={() => setMenuOpen(false)} className="font-condensed font-bold text-sm uppercase tracking-wide text-white/70 hover:text-white transition-colors">
            Support
          </Link>
          <Link href="/dashboard/settings" onClick={() => setMenuOpen(false)} className="font-condensed font-bold text-sm uppercase tracking-wide text-white/70 hover:text-white transition-colors">
            Settings
          </Link>
          {isStaff && (
            <Link href="/moderate" onClick={() => setMenuOpen(false)} className="font-condensed font-bold text-sm uppercase tracking-wide text-gold hover:text-gold-light transition-colors">
              Moderate
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin" onClick={() => setMenuOpen(false)} className="font-condensed font-bold text-sm uppercase tracking-wide text-gold hover:text-gold-light transition-colors">
              Admin
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="text-left font-condensed font-bold text-sm uppercase tracking-wide text-white/70 hover:text-white transition-colors"
          >
            Log out
          </button>
        </div>
      )}
    </nav>
  );
}