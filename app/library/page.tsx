import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import FullBleedShell from '@/components/papers/FullBleedShell';

const mono = 'font-[family-name:var(--font-courier-prime)]';

// Four resource types for now. Add a new entry here if a fifth type
// (e.g. a video library) gets introduced later — the layout doesn't
// assume exactly four.
const RESOURCES = [
  {
    title: 'Lecture Slides',
    catNo: '001',
    catType: 'SLIDES',
    description: 'Weekly slides for every course',
    href: '/papers?tab=materials',
    // Stacked papers — reads as "documents/slides", consistent with the
    // same icon used on the Contribute Lecture Slides picker card.
    icon: (
      <path d="M4 8h13v11a1 1 0 01-1 1H5a1 1 0 01-1-1z M7 8V6a1 1 0 011-1h11a1 1 0 011 1v9a1 1 0 01-1 1h-2 M8 12h7 M8 15.5h7" />
    ),
  },
  {
    title: 'Past Questions Bank',
    catNo: '002',
    catType: 'EXAM',
    description: 'Browse past exam questions by course',
    href: '/papers?tab=papers',
    icon: (
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M9 13h6 M9 17h6" />
    ),
  },
  {
    title: 'Revision Kit',
    catNo: '003',
    catType: 'KIT',
    description: 'All lecture weeks summarised into one exam-focused guide',
    href: '/library/revision-kit',
    icon: <path d="M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />,
  },
  {
    title: 'Audio-Slides',
    catNo: '004',
    catType: 'AUDIO',
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
    <FullBleedShell background="bg-[#DDD4B8]">
      <div className="w-full max-w-lg mx-auto px-4 pt-6 pb-10">
        <div className="flex items-center gap-2 font-[family-name:var(--font-courier-prime)] font-bold text-[11px] uppercase tracking-wide text-navy mb-6">
          <span>←</span>
          <Link href="/dashboard" className="hover:text-gold transition-colors">
            Home
          </Link>
        </div>

        {/* Ink Stamp Box — full width, matching the card container below */}
        <div className="relative border-[3px] border-navy px-6 py-5 mb-3 text-center">
          <span className="absolute top-[-5px] left-[-5px] w-2 h-2 border-t-2 border-l-2 border-navy" />
          <span className="absolute top-[-5px] right-[-5px] w-2 h-2 border-t-2 border-r-2 border-navy" />
          <span className="absolute bottom-[-5px] left-[-5px] w-2 h-2 border-b-2 border-l-2 border-navy" />
          <span className="absolute bottom-[-5px] right-[-5px] w-2 h-2 border-b-2 border-r-2 border-navy" />
          <div className={`${mono} font-bold text-[9px] tracking-[0.25em] text-gold mb-1`}>EX LIBRIS</div>
          <div className="font-display font-extrabold text-[22px] tracking-[0.03em] uppercase text-navy-deep">
            Distinction Library
          </div>
          <div className={`${mono} font-bold text-[9px] tracking-[0.18em] text-gold mt-1`}>EST. UPSA</div>
        </div>

        <div className="text-center mb-7">
          <p className="font-display italic font-bold text-[16px] text-navy-deep mb-1.5">
            Welcome — glad you&apos;re here.
          </p>
          <p className={`${mono} font-bold text-[11px] leading-relaxed text-[#5B5643] max-w-[32ch] mx-auto`}>
            Select a card below to access your resources.
          </p>
        </div>

        {/* Resource cards — deep mint, blended close to the cream page rather
            than a stark navy block, on the same page as the Contribute flow */}
        <div className="flex flex-col gap-3.5">
          {RESOURCES.map((resource) => (
            <Link
              key={resource.title}
              href={resource.href}
              className="min-h-[104px] flex items-center bg-[#CFE0C8] border border-[#AFC8A6] p-4 transition-transform hover:-translate-y-1"
              style={{ boxShadow: '0 3px 0 #AFC8A6, 0 4px 8px rgba(0,0,0,0.14)' }}
            >
              <div className="flex items-center gap-3 w-full">
                <svg viewBox="0 0 24 24" width={22} height={22} className="w-[22px] h-[22px] shrink-0" fill="none" stroke="#3E6B4A" strokeWidth={1.6}>
                  {resource.icon}
                </svg>
                <div className="flex-1 min-w-0">
                  <div className={`${mono} text-[9.5px] tracking-wide text-[#5E7A57] mb-1`}>
                    CARD NO. {resource.catNo} — TYPE: {resource.catType}
                  </div>
                  <h2 className="font-display font-bold text-[17px] text-navy-deep mb-0.5">{resource.title}</h2>
                  <p className="font-body text-[11.5px] leading-snug text-[#4A5D45]">{resource.description}</p>
                </div>
                <svg viewBox="0 0 24 24" width={14} height={14} className="w-[14px] h-[14px] shrink-0 ml-2" fill="none" stroke="#5E7A57" strokeWidth={2}>
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </div>
            </Link>
          ))}
        </div>

        <div className={`mt-6 text-center ${mono} text-[9px] text-[#8B826A] leading-relaxed`}>
          — catalogued by the Distinction Library community —
        </div>
      </div>
    </FullBleedShell>
  );
}
