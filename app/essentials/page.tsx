import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function SuccessCentrePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-navy mb-1">Essentials</h1>
      <p className="font-body text-sm text-g600 mb-6">
        Support beyond the study materials — mentors, career tools, and opportunities.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/tutors"
          className="group bg-navy border border-gold/25 rounded-none p-6 min-h-[210px] hover:border-gold transition-colors"
        >
          <div className="w-11 h-11 rounded-none border border-gold/60 flex items-center justify-center text-gold mb-4 group-hover:bg-gold group-hover:text-navy-deep transition-colors">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8.5" cy="8" r="2.6"></circle>
              <path d="M3 19c0-3.1 2.5-5 5.5-5s5.5 1.9 5.5 5"></path>
              <circle cx="16.5" cy="7.2" r="2.1"></circle>
              <path d="M14.8 12.3c2.7.2 4.7 1.9 4.7 4.7"></path>
            </svg>
          </div>
          <h2 className="font-display font-bold text-lg text-white mb-1.5">Distinction Mentors</h2>
          <p className="font-body text-sm text-white/60">
            Peer tutors and Distinction Programme facilitators — book sessions and get study
            strategies.
          </p>
        </Link>

        <Link
          href="/essentials/opportunity-hub"
          className="group bg-navy border border-gold/25 rounded-none p-6 min-h-[210px] hover:border-gold transition-colors"
        >
          <div className="w-11 h-11 rounded-none border border-gold/60 flex items-center justify-center font-display text-gold text-lg mb-4 group-hover:bg-gold group-hover:text-navy-deep transition-colors">
            ◈
          </div>
          <h2 className="font-display font-bold text-lg text-white mb-1.5">Jobs &amp; Opportunities</h2>
          <p className="font-body text-sm text-white/60">
            Scholarships, internships, graduate programmes, and jobs verified for UPSA students.
          </p>
        </Link>

        <Link
          href="/essentials/achievements"
          className="group bg-navy border border-gold/25 rounded-none p-6 min-h-[210px] hover:border-gold transition-colors"
        >
          <div className="w-11 h-11 rounded-none border border-gold/60 flex items-center justify-center font-display text-gold text-lg mb-4 group-hover:bg-gold group-hover:text-navy-deep transition-colors">
            ★
          </div>
          <h2 className="font-display font-bold text-lg text-white mb-1.5">Achievement Portfolio</h2>
          <p className="font-body text-sm text-white/60">
            Your Gold, Silver, and Bronze badges from the Leaderboard — this semester and all-time.
          </p>
        </Link>

        <Link
          href="/essentials/career"
          className="group bg-navy border border-gold/25 rounded-none p-6 min-h-[210px] hover:border-gold transition-colors"
        >
          <div className="w-11 h-11 rounded-none border border-gold/60 flex items-center justify-center text-gold mb-4 group-hover:bg-gold group-hover:text-navy-deep transition-colors">
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="7.5" width="18" height="12" rx="1.8"></rect>
              <path d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5"></path>
              <path d="M3 12.5h18"></path>
            </svg>
          </div>
          <h2 className="font-display font-bold text-lg text-white mb-1.5">Career Resources</h2>
          <p className="font-body text-sm text-white/60">
            AI CV Builder, Cover Letter Generator, and career planning tools.
          </p>
        </Link>

        <Link
          href="/essentials/events"
          className="group bg-navy border border-gold/25 rounded-none p-6 min-h-[210px] hover:border-gold transition-colors"
        >
          <div className="w-11 h-11 rounded-none border border-gold/60 flex items-center justify-center font-display text-gold text-lg mb-4 group-hover:bg-gold group-hover:text-navy-deep transition-colors">
            ▦
          </div>
          <h2 className="font-display font-bold text-lg text-white mb-1.5">Events &amp; Sessions</h2>
          <p className="font-body text-sm text-white/60">
            Revision sessions, workshops, and career fairs, shown as a calendar.
          </p>
        </Link>
      </div>
    </div>
  );
}
