import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const CATEGORY_LABELS: Record<string, string> = {
  scholarship: 'Scholarship',
  internship: 'Internship',
  graduate_programme: 'Graduate Programme',
  job: 'Job',
  competition: 'Competition',
  conference: 'Conference',
  workshop: 'Workshop',
  volunteer: 'Volunteer',
};

export default async function OpportunityHubPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: opportunities } = await supabase
    .from('opportunities')
    .select('id, title, organization, category, deadline, location, remote_or_onsite, verified, featured, application_link')
    .eq('status', 'published')
    .order('featured', { ascending: false })
    .order('deadline', { ascending: true, nullsFirst: false });

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-navy mb-1">Jobs & Opportunities </h1>
      <p className="font-body text-sm text-g600 mb-6">
        Scholarships, internships, graduate programmes, and jobs — verified for UPSA students.
      </p>

      {!opportunities || opportunities.length === 0 ? (
        <div className="bg-white border border-g100 rounded-2xl p-8 text-center">
          <p className="font-body text-sm text-g600">
            Nothing posted yet — check back soon, or if you know of an opportunity UPSA students
            should see, let the team know via Settings → Support.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {opportunities.map((o) => (
            <a
              key={o.id}
              href={o.application_link ?? '#'}
              target={o.application_link ? '_blank' : undefined}
              rel="noopener noreferrer"
              className="block bg-white border border-g100 rounded-2xl p-5 hover:border-gold transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-1">
                <h2 className="font-display font-bold text-base text-navy">{o.title}</h2>
                {o.featured && (
                  <span className="flex-shrink-0 font-condensed font-bold text-[10px] uppercase tracking-wide bg-gold/15 text-[#7A5A0E] px-2 py-0.5 rounded">
                    Featured
                  </span>
                )}
              </div>
              <p className="font-condensed text-xs text-g600 mb-2">
                {o.organization} · {CATEGORY_LABELS[o.category] ?? o.category}
                {o.verified ? ' · Verified' : ''}
              </p>
              <div className="flex items-center gap-3 font-condensed text-[11px] text-g600">
                {o.deadline && <span>Deadline: {new Date(o.deadline).toLocaleDateString()}</span>}
                {o.location && <span>{o.location}</span>}
                {o.remote_or_onsite && <span className="capitalize">{o.remote_or_onsite}</span>}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
