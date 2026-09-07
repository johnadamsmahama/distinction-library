import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import UploadPageWrapper from '@/components/papers/UploadPageWrapper';

const UPLOAD_CARDS = [
  {
    title: 'Lecture Slides',
    catNo: '001',
    catType: 'SLIDES',
    description: 'Upload a single file, or a zip of many at once.',
    href: '/papers/upload/lecture-slides',
    icon: (
      <path d="M4 8h13v11a1 1 0 01-1 1H5a1 1 0 01-1-1z M7 8V6a1 1 0 011-1h11a1 1 0 011 1v9a1 1 0 01-1 1h-2 M8 12h7 M8 15.5h7" />
    ),
    restricted: false,
  },
  {
    title: 'Past Papers',
    catNo: '002',
    catType: 'EXAM',
    description: 'Upload a single file, or a zip of many at once.',
    href: '/papers/upload/past-papers',
    icon: (
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M9 13h6 M9 17h6" />
    ),
    restricted: false,
  },
  {
    title: 'Revision Kit',
    catNo: '003',
    catType: 'KIT',
    description: null,
    href: null,
    icon: <path d="M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />,
    restricted: true,
  },
  {
    title: 'Audio-Slides',
    catNo: '004',
    catType: 'AUDIO',
    description: null,
    href: null,
    icon: (
      <path d="M3 18v-6a9 9 0 0118 0v6M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" />
    ),
    restricted: true,
  },
];

export default async function UploadPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <UploadPageWrapper>
      <div className="relative z-10 w-full max-w-lg mx-auto flex flex-col flex-1 min-h-0 px-4 pt-8 pb-6 overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-6 shrink-0">
          <div className="w-9 h-9 mx-auto mb-3 rounded-full border-[1.5px] border-navy flex items-center justify-center">
            <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="#0D2B5E" strokeWidth={1.8}>
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
            </svg>
          </div>
          <div className="font-[family-name:var(--font-courier-prime)] font-bold text-[10px] uppercase tracking-[0.1em] text-gold mb-2.5">
            Community Contribution
          </div>
          <h1 className="font-display font-bold text-[23px] text-navy-deep mb-2">
            What are you contributing?
          </h1>
          <p className="font-[family-name:var(--font-courier-prime)] text-[10.5px] leading-relaxed text-[#5B5643] max-w-[30ch] mx-auto">
            Pick a resource type below. Submissions are reviewed by a moderator before entering the catalog.
          </p>
        </div>

        {/* Cards */}
        <div className="flex flex-col gap-3.5 shrink-0">
          {UPLOAD_CARDS.map((card) => {
            const iconColor = card.restricted ? '#9B9581' : '#0D2B5E';

            const cardContent = (
              <div className="flex items-center gap-3 w-full">
                <svg
                  viewBox="0 0 24 24"
                  width={22}
                  height={22}
                  className="w-[22px] h-[22px] shrink-0"
                  fill="none"
                  stroke={iconColor}
                  strokeWidth={1.6}
                >
                  {card.icon}
                </svg>
                <div className={`flex-1 min-w-0 ${card.restricted ? 'pr-[78px]' : ''}`}>
                  <div className="font-[family-name:var(--font-courier-prime)] text-[9.5px] tracking-wide text-[#9A9270] mb-1">
                    CARD NO. {card.catNo} — TYPE: {card.catType}
                  </div>
                  <h2
                    className={`font-display font-bold text-[17px] mb-0.5 ${
                      card.restricted ? 'text-[#5B5643]' : 'text-navy-deep'
                    }`}
                  >
                    {card.title}
                  </h2>
                  {card.description && (
                    <p className="font-[family-name:var(--font-courier-prime)] text-[10.5px] leading-snug text-[#5B5643]">
                      {card.description}
                    </p>
                  )}
                </div>
              </div>
            );

            if (card.restricted) {
              return (
                <div
                  key={card.title}
                  className="relative min-h-[104px] flex items-center bg-[#F6F1E3] border border-[#E4DBC2] p-4 opacity-80 cursor-not-allowed"
                  style={{ boxShadow: '0 3px 0 #E4DBC2, 0 4px 8px rgba(0,0,0,0.12)' }}
                >
                  {cardContent}
                  <div
                    className="absolute top-1/2 right-3.5 border-2 border-[#B22222] rounded-[2px] px-1.5 py-1 flex items-center justify-center opacity-80"
                    style={{ transform: 'translateY(-50%) rotate(-6deg)' }}
                  >
                    <span className="font-[family-name:var(--font-courier-prime)] font-bold text-[8px] uppercase tracking-wide leading-[1.35] text-[#B22222] text-center whitespace-nowrap">
                      Restricted to
                      <br />
                      Admins only
                    </span>
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={card.title}
                href={card.href as string}
                className="min-h-[104px] flex items-center bg-[#F6F1E3] border border-[#E4DBC2] p-4 transition-transform hover:-translate-y-1"
                style={{ boxShadow: '0 3px 0 #E4DBC2, 0 4px 8px rgba(0,0,0,0.12)' }}
              >
                {cardContent}
              </Link>
            );
          })}
        </div>

        <div className="text-center mt-5 shrink-0">
          <Link
            href="/papers/my-uploads"
            className="font-[family-name:var(--font-courier-prime)] text-[10.5px] text-navy underline"
          >
            MY UPLOADS →
          </Link>
        </div>

        <div className="mt-5 text-center font-[family-name:var(--font-courier-prime)] text-[9px] text-[#8B826A] shrink-0">
          — catalogued by the Distinction Library community —
        </div>
      </div>
    </UploadPageWrapper>
  );
}
