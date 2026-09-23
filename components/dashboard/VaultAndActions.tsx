import Link from 'next/link';

export function VaultSummary({
  summary,
}: {
  summary: { quizzes: number; companionSessions: number; summaries: number; total: number };
}) {
  return (
    <div className="bg-white border border-g100 rounded-none p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display font-bold text-lg text-navy">Your Study Vault</h2>
        <Link href="/vault" className="font-condensed font-bold text-xs uppercase tracking-wide text-gold hover:underline">
          Open →
        </Link>
      </div>

      {summary.total === 0 ? (
        <p className="font-body text-sm text-g600">
          Private to you. Upload notes to generate a quiz or start a session with the AI Study
          Companion, and it&apos;ll show up here.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="font-display font-bold text-xl text-navy">{summary.quizzes}</div>
            <div className="font-condensed text-[10px] uppercase tracking-wide text-g600">Quizzes</div>
          </div>
          <div>
            <div className="font-display font-bold text-xl text-navy">{summary.companionSessions}</div>
            <div className="font-condensed text-[10px] uppercase tracking-wide text-g600">Sessions</div>
          </div>
          <div>
            <div className="font-display font-bold text-xl text-navy">{summary.summaries}</div>
            <div className="font-condensed text-[10px] uppercase tracking-wide text-g600">Summaries</div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Quick Actions — Academic Atelier styling.
   Stacked, numbered index cards instead of the gradient tile
   grid. Same real hrefs/labels/descriptions/icons as before,
   just a different visual treatment. Page backdrop tan
   (#DDD4B8), card cream (#F6F1E3), title in "Greek red".
   ══════════════════════════════════════════════════════════ */

const ATELIER_PAGE_BG = '#DDD4B8';
const ATELIER_CARD_BG = '#F6F1E3';
const ATELIER_BORDER = '#E4DBC2';
const ATELIER_RED = '#A1381F';

type Action = {
  href: string;
  label: string;
  desc: string;
  path: string;
  /** Drives the icon tint/border and the corner flag for this card. */
  theme: string;
};

const ACTIONS: Action[] = [
  {
    href: '/papers/upload',
    label: 'Upload Resources',
    desc: 'Upload slides, past papers, or notes for other students.',
    path: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12',
    theme: '#12295C',
  },
  {
    href: '/library',
    label: 'Library',
    desc: 'Browse and download past papers & materials',
    path: 'M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z',
    theme: '#9A7A1F',
  },
  {
    href: '/papers',
    label: 'Solved Past Papers',
    desc: 'Get instant AI-written answers for any past paper',
    path: 'M9 12l2 2 4-4M12 3a9 9 0 100 18 9 9 0 000-18z',
    theme: '#0F2244',
  },
  {
    href: '/predictor',
    label: 'Exam Predictor',
    desc: 'See AI-ranked likely topics for your course',
    path: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 16a4 4 0 100-8 4 4 0 000 8z M12 13a1 1 0 100-2 1 1 0 000 2z',
    theme: '#8C6D2A',
  },
  {
    href: '/ai-tools/companion',
    label: 'Study Companion',
    desc: 'Explain a topic or summarise notes',
    path: 'M12 3a6 6 0 016 6c0 3.5-2.5 5-3 7H9c-.5-2-3-3.5-3-7a6 6 0 016-6zM9 21h6',
    theme: '#33384A',
  },
  {
    href: '/ai-tools/quiz-generator',
    label: 'Quiz Generator',
    desc: 'Turn notes into practice questions',
    path: 'M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11',
    theme: '#2A5FCC',
  },
  {
    href: '/ai-tools/presentation-kit',
    label: 'Presentation Kit',
    desc: 'Turn a topic, a Vault item, or a document into a PowerPoint (PPTX) ready to present.',
    path: 'M3 4h18v13H3V4zM8 21h8M12 17v4M7 12l3-4 2.5 3L17 6',
    theme: '#7A3E63',
  },
  {
    href: '/tutors',
    label: 'Peer Tutors',
    desc: 'Get one-on-one help from a fellow student',
    path: 'M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M11 3a4 4 0 110 8 4 4 0 010-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
    theme: '#8A6A22',
  },
  {
    href: '/dashboard/gpa-calculator',
    label: 'GPA Calculator',
    desc: 'Track your GPA as results release, and test hypothetical grades for courses still pending.',
    path: 'M3 3v18h18M8 17V10M13 17V6M18 17v-4',
    theme: '#3F6B5C',
  },
  {
    href: '/essentials',
    label: 'Essentials',
    desc: 'Mentors, jobs & opportunities, achievements',
    path: 'M12 2l2.4 7.2H22l-6 4.6 2.3 7.2L12 16.4 5.7 21l2.3-7.2-6-4.6h7.6z',
    theme: '#7A6B3D',
  },
];

/** Card number label, e.g. 1 -> "001". */
function cardNo(n: number) {
  return String(n).padStart(3, '0');
}

function AtelierCard({ action, number }: { action: Action; number: number }) {
  const { href, label, desc, path, theme } = action;
  return (
    <Link
      href={href}
      className="group relative flex items-start gap-4 p-[22px] min-h-[130px] transition-all duration-200 ease-out hover:-translate-y-0.5"
      style={{
        background: ATELIER_CARD_BG,
        border: `1px solid ${ATELIER_BORDER}`,
        boxShadow: '0 3px 8px rgba(0,0,0,0.1)',
      }}
    >
      {/* Corner flag, theme-colored — grows slightly on hover */}
      <span
        aria-hidden
        className="absolute top-0 right-0 w-0 h-0 border-t-0 border-l-0 border-r-[20px] border-b-[20px] transition-all duration-200 group-hover:border-r-[30px] group-hover:border-b-[30px]"
        style={{ borderColor: `${theme} ${ATELIER_PAGE_BG}` }}
      />

      {/* Icon box — square corners, tinted with this card's theme color */}
      <div
        className="relative z-10 w-[46px] h-[46px] flex items-center justify-center flex-shrink-0 rounded-none"
        style={{
          background: `${theme}29`,
          border: `1.5px solid ${theme}8c`,
          color: theme,
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.3} className="w-[22px] h-[22px]">
          <path d={path} />
        </svg>
      </div>

      <div className="relative z-10 flex-1 min-w-0">
        <span className="font-mono text-[9px] text-g600 tracking-wide block mb-1">
          CARD {cardNo(number)}
        </span>
        <div className="font-display font-bold text-[16.5px] text-navy-deep mb-1.5">{label}</div>
        <p className="font-mono text-[10px] text-g600 leading-[1.55] m-0">{desc}</p>
      </div>
    </Link>
  );
}

export function QuickActions({
  vaultSummary,
}: {
  vaultSummary: { quizzes: number; companionSessions: number; summaries: number; total: number };
}) {
  const vaultDesc =
    vaultSummary.total === 0
      ? 'Private to you — notes, quizzes, and AI sessions saved here.'
      : `${vaultSummary.quizzes} quizzes · ${vaultSummary.companionSessions} sessions · ${vaultSummary.summaries} summaries`;

  const vaultAction: Action = {
    href: '/vault',
    label: 'Private Study Vault',
    desc: vaultDesc,
    path: 'M3 11h18v10a2 2 0 01-2 2H5a2 2 0 01-2-2V11zM7 11V7a5 5 0 0110 0v4',
    theme: '#0D2B5E',
  };

  const allCards = [...ACTIONS, vaultAction];

  return (
    <div className="p-5 sm:p-7" style={{ background: ATELIER_PAGE_BG }}>
      <div className="pb-3.5 mb-5" style={{ borderBottom: '2px solid #060F1E' }}>
        <span className="font-condensed font-bold text-[10px] uppercase tracking-[.1em] text-gold">
          Start here
        </span>
        <h2 className="font-display font-extrabold text-[24px] leading-tight mt-1" style={{ color: ATELIER_RED }}>
          Quick Actions
        </h2>
        <p className="font-body italic text-[13px] text-g600 mt-1.5">
          Choose a card, or tap one for full access.
        </p>
      </div>

      <div className="flex flex-col gap-3.5">
        {allCards.map((a, i) => (
          <AtelierCard key={a.href} action={a} number={i + 1} />
        ))}
      </div>
    </div>
  );
}
