'use client';

import { useEffect, useRef, useState } from 'react';

export type Opportunity = {
  id: string;
  title: string;
  organization: string;
  category:
    | 'scholarship'
    | 'internship'
    | 'graduate_programme'
    | 'job'
    | 'competition'
    | 'conference'
    | 'workshop'
    | 'volunteer';
  deadline: string | null;
  location: string | null;
  remote_or_onsite: 'remote' | 'onsite' | 'hybrid' | null;
  verified: boolean;
  featured: boolean;
  application_link: string | null;
};

// Same labels as the original CATEGORY_LABELS, extended with an accent color per category
const CATEGORY_META: Record<Opportunity['category'], { label: string; color: string }> = {
  scholarship:         { label: 'Scholarship',        color: '#E8C766' },
  internship:          { label: 'Internship',         color: '#2DD4BF' },
  graduate_programme:  { label: 'Graduate Programme', color: '#C084FC' },
  job:                 { label: 'Job',                color: '#60A5FA' },
  competition:         { label: 'Competition',        color: '#FB923C' },
  conference:          { label: 'Conference',         color: '#F472B6' },
  workshop:            { label: 'Workshop',           color: '#22D3EE' },
  volunteer:           { label: 'Volunteer',          color: '#F87171' },
};

const FILTERS: { id: 'all' | Opportunity['category']; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'scholarship', label: 'Scholarships' },
  { id: 'internship', label: 'Internships' },
  { id: 'job', label: 'Jobs' },
  { id: 'graduate_programme', label: 'Grad Programmes' },
  { id: 'competition', label: 'Competitions' },
  { id: 'conference', label: 'Conferences' },
  { id: 'workshop', label: 'Workshops' },
  { id: 'volunteer', label: 'Volunteer' },
];

function getDeadlineChip(dateStr: string | null) {
  if (!dateStr) return null;
  const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  if (days <= 7)  return { label: `${Math.max(days, 0)}d left`, color: '#FCA5A5', bg: 'rgba(248,113,113,0.14)' };
  if (days <= 30) return { label: `${days}d left`, color: '#FCD34D', bg: 'rgba(252,211,77,0.12)' };
  return                  { label: `${days}d left`, color: '#6EE7B7', bg: 'rgba(110,231,183,0.12)' };
}

export default function OpportunityHubClient({ opportunities }: { opportunities: Opportunity[] }) {
  const [tab, setTab] = useState<'all' | Opportunity['category']>('all');
  const filtered = tab === 'all' ? opportunities : opportunities.filter(o => o.category === tab);
  const activeLabel = FILTERS.find(f => f.id === tab)?.label ?? '';

  // Scroll-fade affordance for the filter tab strip — only shows a side's fade
  // when there's actually more content to scroll to on that side.
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  return (
    <div>
      {/* Header — copy unchanged from the live version */}
      <h1 className="font-display font-bold text-2xl text-navy mb-1">Jobs &amp; Opportunities</h1>
      <p className="font-body text-sm text-g600 mb-6">
        Scholarships, internships, graduate programmes, and jobs — verified for UPSA students.
      </p>

      {/* Everything below sits in a self-contained navy panel */}
      <div className="bg-navy-deep rounded-2xl overflow-hidden">
        {/* Filter tabs, with scroll-fade edges to signal there's more to swipe to */}
        <div className="relative border-b border-white/6">
          <div
            ref={scrollRef}
            onScroll={checkScroll}
            className="flex gap-1.5 px-4 py-3 overflow-x-auto"
          >
            {FILTERS.map(f => {
              const active = tab === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setTab(f.id)}
                  className={`px-3 py-1.5 rounded-full font-condensed text-[11.5px] font-semibold whitespace-nowrap border transition-colors flex-shrink-0 ${
                    active
                      ? 'bg-gold/15 border-gold text-gold'
                      : 'border-white/10 text-white/45 hover:text-white/70'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {canScrollLeft && (
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-navy-deep to-transparent" />
          )}
          {canScrollRight && (
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-navy-deep via-navy-deep/80 to-transparent flex items-center justify-end pr-1.5">
              <span className="text-gold text-sm">›</span>
            </div>
          )}
        </div>

        {/* Card list */}
        <div className="px-4 py-4">
          {!opportunities || opportunities.length === 0 ? (
            <div className="text-center py-8">
              <p className="font-body text-sm text-white/55">
                Nothing posted yet — check back soon, or if you know of an opportunity UPSA
                students should see, let the team know via Settings → Support.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8">
              <p className="font-body text-sm text-white/55">
                No {activeLabel.toLowerCase()} opportunities right now — try All to see everything.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filtered.map((o) => {
                const cat = CATEGORY_META[o.category] ?? { label: o.category, color: '#C9A84C' };
                const dl = getDeadlineChip(o.deadline);
                return (
                  <a
                    key={o.id}
                    href={o.application_link ?? '#'}
                    target={o.application_link ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    className="block bg-navy border border-white/6 rounded-xl p-4 hover:border-gold transition-colors border-l-4"
                    style={{ borderLeftColor: cat.color }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <h2 className="font-display font-bold text-[15px] text-white">{o.title}</h2>
                      {o.featured && (
                        <span className="flex-shrink-0 font-condensed font-bold text-[10px] uppercase tracking-wide bg-gold/15 text-gold px-2 py-0.5 rounded">
                          Featured
                        </span>
                      )}
                    </div>

                    <p className="font-condensed text-xs text-white/45 mb-2.5 flex items-center gap-1 flex-wrap">
                      <span>{o.organization}</span>
                      <span>·</span>
                      <span
                        className="font-bold uppercase tracking-wide text-[10px] px-1.5 py-0.5 rounded"
                        style={{ color: cat.color, backgroundColor: `${cat.color}22` }}
                      >
                        {cat.label}
                      </span>
                      {o.verified && <span className="text-gold">✓ Verified</span>}
                    </p>

                    <div className="flex items-center gap-2 flex-wrap font-condensed text-[11px] text-white/50">
                      {o.deadline && (
                        <>
                          <span>Deadline: {new Date(o.deadline).toLocaleDateString()}</span>
                          {dl && (
                            <span
                              className="font-bold px-1.5 py-0.5 rounded"
                              style={{ color: dl.color, backgroundColor: dl.bg }}
                            >
                              {dl.label}
                            </span>
                          )}
                        </>
                      )}
                      {o.location && <span>{o.location}</span>}
                      {o.remote_or_onsite && <span className="capitalize">{o.remote_or_onsite}</span>}
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
