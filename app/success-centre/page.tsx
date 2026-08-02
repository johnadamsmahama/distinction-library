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
      <h1 className="font-display font-bold text-2xl text-navy mb-1">Success Centre</h1>
      <p className="font-body text-sm text-g600 mb-6">
        Support beyond the study materials — mentors, career tools, and opportunities.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/tutors"
          className="bg-white border border-g100 rounded-2xl p-6 hover:border-gold transition-colors"
        >
          <h2 className="font-display font-bold text-lg text-navy mb-1.5">Distinction Mentors</h2>
          <p className="font-body text-sm text-g600">
            Peer tutors and Distinction Programme facilitators — ask questions, book revision
            sessions, get study strategies.
          </p>
        </Link>

        <Link
          href="/success-centre/opportunity-hub"
          className="bg-white border border-g100 rounded-2xl p-6 hover:border-gold transition-colors"
        >
          <h2 className="font-display font-bold text-lg text-navy mb-1.5">Opportunity Hub</h2>
          <p className="font-body text-sm text-g600">
            Scholarships, internships, graduate programmes, and jobs verified for UPSA students.
          </p>
        </Link>

        <Link
          href="/success-centre/achievements"
          className="bg-white border border-g100 rounded-2xl p-6 hover:border-gold transition-colors"
        >
          <h2 className="font-display font-bold text-lg text-navy mb-1.5">Achievement Portfolio</h2>
          <p className="font-body text-sm text-g600">
            Your Gold, Silver, and Bronze badges from the Leaderboard — this semester and all-time.
          </p>
        </Link>

        <Link
          href="/success-centre/career"
          className="bg-white border border-g100 rounded-2xl p-6 hover:border-gold transition-colors"
        >
          <h2 className="font-display font-bold text-lg text-navy mb-1.5">Career Centre</h2>
          <p className="font-body text-sm text-g600">
            AI CV Builder, Cover Letter Generator, and career planning tools.
          </p>
        </Link>

        <div className="bg-off-white border border-g100 rounded-2xl p-6 opacity-70">
          <div className="flex items-center gap-2 mb-1.5">
            <h2 className="font-display font-bold text-lg text-navy">Events &amp; Sessions</h2>
            <span className="font-condensed font-bold text-[10px] uppercase tracking-wide bg-g100 text-g600 px-2 py-0.5 rounded">
              Phase 2
            </span>
          </div>
          <p className="font-body text-sm text-g600">
            Revision sessions, workshops, and career fairs, shown as a calendar.
          </p>
        </div>
      </div>
    </div>
  );
}
