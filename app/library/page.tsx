import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

// Four resource types for now. Add a new entry here if a fifth type
// (e.g. a video library) gets introduced later — the layout doesn't
// assume exactly four.
const RESOURCES = [
  {
    title: 'Lecture Slides',
    description: 'Weekly slides for every course',
    href: '/papers?tab=materials',
    // Screen-with-stand — reads as "slides/presentation".
    icon: <path d="M3 4h18v12H3z M8 20h8 M12 16v4" />,
  },
  {
    title: 'Past Questions Bank',
    description: 'Browse past exam questions by course',
    href: '/papers?tab=papers',
    icon: (
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M9 13h6 M9 17h6" />
    ),
  },
  {
    title: 'Revision Kit',
    description: 'All lecture weeks summarised into one exam-focused guide',
    href: '/library/revision-kit',
    icon: <path d="M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />,
  },
  {
    title: 'Audio-Slides',
    description: 'Professionally recorded course audio — study anytime, anywhere',
    href: '/library/audio-slides',
    icon: (
      <path d="M3 18v-6a9 9 0 0118 0v6M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" />
    ),
  },
];

export default async function LibraryPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div>
      {/* Hero */}
      <div className="relative overflow-hidden rounded-none bg-gradient-to-br from-navy to-[#081527] px-6 py-8 mb-6">
        <p className="relative font-body text-[11px] font-semibold tracking-[0.14em] uppercase text-gold mb-3">
          Resources
        </p>
        <h1 className="relative font-display font-bold text-3xl text-white mb-2 max-w-xs">
          Distinction Library
        </h1>
        <p className="relative font-body text-sm text-[#B7C0D4] max-w-sm leading-relaxed">
          Your complete resource collection for every course.
        </p>
      </div>

      {/* Resource cards */}
      <div className="rounded-none bg-gradient-to-b from-[#FBF3E1] via-[#F3E4BE] to-[#FBF3E1] px-4 py-5 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {RESOURCES.map((resource) => (
            <Link
              key={resource.title}
              href={resource.href}
              className="block bg-white border border-g100 border-l-[3px] border-l-navy rounded-none p-5 hover:border-gold hover:border-l-navy transition-colors"
            >
              <div className="w-9 h-9 shrink-0 overflow-hidden rounded-none bg-navy flex items-center justify-center mb-3">
                <svg
                  viewBox="0 0 24 24"
                  width={18}
                  height={18}
                  className="w-[18px] h-[18px] shrink-0 stroke-[#E4C878]"
                  fill="none"
                  strokeWidth={1.8}
                >
                  {resource.icon}
                </svg>
              </div>
              <h2 className="font-display font-bold text-lg text-navy mb-1.5">{resource.title}</h2>
              <p className="font-body text-sm text-g600 leading-relaxed">{resource.description}</p>
              <div className="mt-3.5 flex items-center gap-1.5 font-body text-[12.5px] font-semibold text-gold">
                Open
                <svg viewBox="0 0 24 24" width={12} height={12} className="w-3 h-3 shrink-0 stroke-gold" fill="none" strokeWidth={2}>
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
