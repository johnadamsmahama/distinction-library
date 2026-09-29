import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const ITEMS = [
  {
    href: '/tutors',
    title: 'Distinction Mentors',
    desc: 'Peer tutors and Distinction Programme facilitators — book sessions and get study strategies.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8.5" cy="8" r="2.6"></circle>
        <path d="M3 19c0-3.1 2.5-5 5.5-5s5.5 1.9 5.5 5"></path>
        <circle cx="16.5" cy="7.2" r="2.1"></circle>
        <path d="M14.8 12.3c2.7.2 4.7 1.9 4.7 4.7"></path>
      </svg>
    ),
  },
  {
    href: '/essentials/opportunity-hub',
    title: 'Jobs & Opportunities',
    desc: 'Scholarships, internships, graduate programmes, and jobs verified for UPSA students.',
    icon: <span className="font-display text-lg leading-none">◈</span>,
  },
  {
    href: '/essentials/achievements',
    title: 'Achievement Portfolio',
    desc: 'Your Gold, Silver, and Bronze badges from the Leaderboard — this semester and all-time.',
    icon: <span className="font-display text-lg leading-none">★</span>,
  },
  {
    href: '/essentials/career',
    title: 'Career Resources',
    desc: 'AI CV Builder, Cover Letter Generator, and career planning tools.',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="7.5" width="18" height="12" rx="1.8"></rect>
        <path d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5"></path>
        <path d="M3 12.5h18"></path>
      </svg>
    ),
  },
  {
    href: '/essentials/events',
    title: 'Events & Sessions',
    desc: 'Revision sessions, workshops, and career fairs, shown as a calendar.',
    icon: <span className="font-display text-lg leading-none">▦</span>,
  },
];

export default async function SuccessCentrePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div
      className="-mx-5 sm:-mx-7 -my-8 px-5 sm:px-7 py-8 min-h-[calc(100vh-1px)]"
      style={{
        backgroundColor: '#C7B892',
        backgroundImage:
          'linear-gradient(rgba(74,59,34,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(74,59,34,0.08) 1px, transparent 1px)',
        backgroundSize: '14px 14px',
      }}
    >
      <div className="font-condensed font-extrabold text-[11px] uppercase tracking-wide text-[#2F4A3D] mb-1">
        Support Beyond The Study Materials
      </div>
      <h1 className="font-display font-black text-2xl text-[#1E2A1F] mb-1">Essentials</h1>
      <p className="font-body text-sm text-[#4A3B22] mb-6 max-w-md">
        Mentors, career tools, and opportunities — everything outside the library.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group relative bg-[#FDFCF7] border-[1.5px] border-[#2F4A3D] rounded-none p-6 min-h-[210px] shadow-[0_6px_14px_rgba(58,36,16,0.18)] hover:-translate-y-0.5 transition-transform"
          >
            <div className="relative w-11 h-11 border-2 border-[#2F4A3D] flex items-center justify-center text-[#2F4A3D] mb-4 -rotate-[9deg] group-hover:bg-[#2F4A3D] group-hover:text-[#FDFCF7] transition-colors">
              <span className="absolute inset-[4px] border border-[#2F4A3D]/40 pointer-events-none" />
              <span className="relative z-10 rotate-[9deg] flex items-center justify-center">{item.icon}</span>
            </div>
            <h2 className="font-display font-bold text-lg text-[#2F4A3D] mb-1.5">{item.title}</h2>
            <p className="font-body text-sm text-[#5A6E5C]">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
