'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const NAV_LINKS = [
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/tutors', label: 'Tutors' },
  { href: '/blog', label: 'Blog' },
  { href: '/support', label: 'Support' },
  { href: '/dashboard/settings', label: 'Settings' },
];

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
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const initials =
    fullName
      ?.split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase())
      .join('') || 'S';

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <nav className="sticky top-0 z-50 bg-navy-deep border-t-2 border-gold shadow-[0_4px_18px_rgba(6,15,30,.25)]">
      <div className="max-w-content mx-auto h-[64px] px-7 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-[9px]">
          <div className="w-[32px] h-[32px] bg-gold rounded-[8px] flex items-center justify-center font-display font-black text-[15px] text-navy shadow-[0_2px_6px_rgba(201,160,44,.4)]">
            D
          </div>
          <div className="font-condensed font-bold text-[16px] hidden sm:block">
            <span className="text-white">Distinction</span> <span className="text-gold-light">Library</span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-[2px] bg-white/5 p-[5px] rounded-[11px]">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href || pathname?.startsWith(link.href + '/');
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-[15px] py-2 rounded-[8px] font-condensed font-semibold text-[13px] transition-colors ${
                  active ? 'bg-gold text-navy' : 'text-white/65 hover:text-white hover:bg-white/[.07]'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3.5">
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
            className="relative w-[34px] h-[34px] flex items-center justify-center rounded-[9px] hover:bg-white/[.08] transition-colors"
            aria-label="Notifications"
          >
            <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] stroke-white/60 fill-none" strokeWidth={1.8}>
              <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-[5px] right-[6px] w-[7px] h-[7px] rounded-full bg-gold border-[1.5px] border-navy-deep" />
            )}
          </Link>

          <div className="hidden sm:block w-px h-[22px] bg-white/[.12]" />

          <div className="hidden sm:flex items-center gap-[9px] px-[10px] py-[5px] rounded-[10px]">
            <div className="w-[30px] h-[30px] rounded-full bg-gold text-navy flex items-center justify-center font-condensed font-bold text-xs shadow-[0_0_0_2px_rgba(255,255,255,.15)]">
              {initials}
            </div>
            <span className="font-condensed font-semibold text-xs text-white">
              {fullName?.split(' ')[0] ?? 'Student'}
            </span>
          </div>

          <div className="hidden md:block w-px h-[22px] bg-white/[.12]" />

          <button
            onClick={handleLogout}
            className="hidden md:block font-condensed font-bold text-xs uppercase tracking-wide text-white/45 hover:text-gold-light transition-colors"
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
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="font-condensed font-bold text-sm uppercase tracking-wide text-white/70 hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
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
