'use client';

import Link from 'next/link';
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

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <nav className="sticky top-0 z-50 h-[60px] bg-navy-deep border-b border-gold/10">
      <div className="max-w-content mx-auto h-full px-7 flex items-center justify-between">
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
            className="font-condensed font-bold text-xs uppercase tracking-wide text-white/50 hover:text-white transition-colors"
          >
            Log out
          </button>
        </div>
      </div>
    </nav>
  );
}
