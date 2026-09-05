import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import UploadPageWrapper from '@/components/papers/UploadPageWrapper';

const UPLOAD_CARDS = [
  {
    title: 'Lecture Slides',
    description: 'Upload a single file, or a zip of many at once.',
    href: '/papers/upload/lecture-slides',
    icon: <path d="M3 4h18v12H3z M8 20h8 M12 16v4" />,
    restricted: false,
  },
  {
    title: 'Past Papers',
    description: 'Upload a single file, or a zip of many at once.',
    href: '/papers/upload/past-papers',
    icon: (
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M9 13h6 M9 17h6" />
    ),
    restricted: false,
  },
  {
    title: 'Revision Kit',
    description: 'Upload is restricted to only Admins and the Distinction Library Committee.',
    href: null,
    icon: <path d="M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />,
    restricted: true,
  },
  {
    title: 'Audio-Slides',
    description: 'Upload is restricted to only Admins and the Distinction Library Committee.',
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
      <div className="relative z-10 w-full max-w-lg mx-auto flex flex-col flex-1 min-h-0 px-4 pt-8 pb-5">
        <div className="flex items-center gap-2 mb-1.5 shrink-0">
          <span className="font-condensed font-bold text-[10.5px] uppercase tracking-wide text-gold-light">
            Community Contribution
          </span>
          <Link
            href="/papers/my-uploads"
            className="ml-auto font-condensed font-bold text-[10px] uppercase text-gold border border-gold/40 rounded-none px-2.5 py-1 hover:bg-gold/10 transition-colors"
          >
            My Uploads
          </Link>
        </div>

        <h1 className="font-display font-bold text-[23px] text-white mb-1.5 shrink-0">
          What are you contributing?
        </h1>
        <p className="text-[12.5px] text-white/65 leading-snug mb-4 shrink-0">
          Pick a resource type below. Submissions go to a moderator for review before appearing in the library.
        </p>

        <div className="flex-1 flex flex-col gap-3 min-h-0">
          {UPLOAD_CARDS.map((card) => {
            const cardInner = (
              <>
                <div className="w-9 h-9 shrink-0 rounded-none bg-white/10 border border-gold/30 flex items-center justify-center mb-3">
                  <svg viewBox="0 0 24 24" width={18} height={18} className="w-[18px] h-[18px] shrink-0" fill="none" stroke="#E2BE5A" strokeWidth={1.8}>
                    {card.icon}
                  </svg>
                </div>
                <h2 className="font-display font-bold text-[15px] text-white mb-1">{card.title}</h2>
                <p className="font-body text-[12px] text-white/60 leading-relaxed">{card.description}</p>
              </>
            );

            if (card.restricted) {
              return (
                <div
                  key={card.title}
                  className="rounded-none border border-white/10 bg-white/[0.03] p-4 opacity-60 cursor-not-allowed"
                >
                  {cardInner}
                </div>
              );
            }

            return (
              <Link
                key={card.title}
                href={card.href as string}
                className="rounded-none border border-gold/25 bg-white/[0.06] p-4 hover:bg-white/[0.1] hover:border-gold/50 transition-colors"
              >
                {cardInner}
              </Link>
            );
          })}
        </div>

        <div className="mt-4 text-center font-mono text-[9px] text-white/40 shrink-0">
          — catalogued by the Distinction Library community —
        </div>
      </div>
    </UploadPageWrapper>
  );
}
