import Link from 'next/link';

export function VaultSummary({
  summary,
}: {
  summary: { quizzes: number; companionSessions: number; summaries: number; total: number };
}) {
  return (
    <div className="bg-white border border-g100 rounded-2xl p-6">
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

const GRAIN_URL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

type Action = {
  href: string;
  label: string;
  desc: string;
  path: string;
  background: string;
  aurora: string;
  textClass: string;
  subClass: string;
  iconBgClass: string;
  iconColorClass: string;
  arrowColorClass: string;
  grain?: boolean;
  border?: boolean;
  borderColorClass?: string;
  badge?: string;
  sheen?: boolean;
};

const ACTIONS: Action[] = [
  {
    href: '/papers/upload',
    label: 'Upload Resources',
    desc: 'Upload slides, past papers, or notes for other students.',
    path: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12',
    background: 'radial-gradient(140% 140% at 15% 0%, #24478a, #12295c 65%)',
    aurora:
      'radial-gradient(45% 50% at 90% 10%, rgba(224,193,88,.4), transparent 70%), radial-gradient(50% 55% at 10% 100%, rgba(60,100,190,.4), transparent 70%)',
    textClass: 'text-white',
    subClass: 'text-white/80',
    iconBgClass: 'bg-white/[.14]',
    iconColorClass: 'text-gold-light',
    arrowColorClass: 'text-gold-light',
    grain: true,
  },
  {
    href: '/papers',
    label: 'Library',
    desc: 'Browse and download past papers & materials',
    path: 'M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z',
    background: 'radial-gradient(130% 140% at 15% 0%, #E0BE55, #9A7A1F 55%, #6B5416 100%)',
    aurora:
      'radial-gradient(45% 50% at 85% 10%, rgba(255,245,210,.55), transparent 70%), radial-gradient(50% 55% at 10% 90%, rgba(10,31,66,.35), transparent 70%)',
    textClass: 'text-navy-deep',
    subClass: 'text-navy-deep/70',
    iconBgClass: 'bg-navy-deep/20',
    iconColorClass: 'text-navy-deep',
    arrowColorClass: 'text-navy-deep',
    grain: true,
  },
  {
    href: '/predictor',
    label: 'Exam Predictor',
    desc: 'See AI-ranked likely topics for your course',
    path: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 16a4 4 0 100-8 4 4 0 000 8z M12 13a1 1 0 100-2 1 1 0 000 2z',
    background: 'radial-gradient(140% 140% at 85% 0%, #C9A02C, #0D2B5E 65%)',
    aurora:
      'radial-gradient(40% 45% at 85% 10%, rgba(240,210,120,.5), transparent 70%), radial-gradient(45% 50% at 15% 60%, rgba(30,70,160,.5), transparent 70%), radial-gradient(50% 55% at 60% 95%, rgba(10,30,70,.5), transparent 70%)',
    textClass: 'text-white',
    subClass: 'text-white/80',
    iconBgClass: 'bg-white/[.14]',
    iconColorClass: 'text-gold-light',
    arrowColorClass: 'text-gold-light',
    grain: true,
  },
  {
    href: '/vault/companion',
    label: 'Study Companion',
    desc: 'Explain a topic or summarise notes',
    path: 'M12 3a6 6 0 016 6c0 3.5-2.5 5-3 7H9c-.5-2-3-3.5-3-7a6 6 0 016-6zM9 21h6',
    background: 'linear-gradient(135deg,#2B2F3D 0%,#33384A 45%,#5C4A22 100%)',
    aurora:
      'radial-gradient(40% 45% at 80% 10%, rgba(224,190,85,.5), transparent 70%), radial-gradient(45% 50% at 10% 60%, rgba(50,90,190,.55), transparent 70%), radial-gradient(40% 45% at 60% 100%, rgba(120,90,30,.4), transparent 70%)',
    textClass: 'text-white',
    subClass: 'text-white/80',
    iconBgClass: 'bg-white/[.14]',
    iconColorClass: 'text-gold-light',
    arrowColorClass: 'text-gold-light',
    grain: true,
  },
  {
    href: '/vault/quiz-generator',
    label: 'Quiz Generator',
    desc: 'Turn notes into practice questions',
    path: 'M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11',
    background: 'radial-gradient(140% 140% at 15% 0%, #2A5FCC, #081B47 65%)',
    aurora:
      'radial-gradient(38% 45% at 15% 15%, rgba(90,150,255,.55), transparent 70%), radial-gradient(45% 50% at 85% 30%, rgba(201,160,44,.35), transparent 70%), radial-gradient(50% 55% at 60% 90%, rgba(20,50,120,.6), transparent 70%)',
    textClass: 'text-white',
    subClass: 'text-white/80',
    iconBgClass: 'bg-white/[.14]',
    iconColorClass: 'text-gold-light',
    arrowColorClass: 'text-gold-light',
    grain: true,
  },
  {
    href: '/vault/presentation-kit',
    label: 'Presentation Kit',
    desc: 'Turn a topic, a Vault item, or a document into a PowerPoint (PPTX) ready to present.',
    path: 'M3 4h18v13H3V4zM8 21h8M12 17v4M7 12l3-4 2.5 3L17 6',
    background: 'radial-gradient(140% 140% at 85% 0%, #C9A02C, #4A1942 68%)',
    aurora:
      'radial-gradient(42% 48% at 15% 10%, rgba(240,210,120,.55), transparent 70%), radial-gradient(45% 50% at 85% 65%, rgba(140,50,105,.5), transparent 70%), radial-gradient(50% 55% at 50% 100%, rgba(30,10,40,.55), transparent 70%)',
    textClass: 'text-white',
    subClass: 'text-white/80',
    iconBgClass: 'bg-white/[.14]',
    iconColorClass: 'text-gold-light',
    arrowColorClass: 'text-gold-light',
    grain: true,
  },
  {
    href: '/tutors',
    label: 'Peer Tutors',
    desc: 'Get one-on-one help from a fellow student',
    path: 'M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M11 3a4 4 0 110 8 4 4 0 010-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
    background: 'radial-gradient(130% 140% at 15% 0%, #E8C875, #C9A02C 70%)',
    aurora:
      'radial-gradient(40% 45% at 90% 0%, rgba(13,43,94,.18), transparent 70%), radial-gradient(45% 50% at 10% 100%, rgba(255,245,210,.35), transparent 70%)',
    textClass: 'text-navy-deep',
    subClass: 'text-navy-deep/70',
    iconBgClass: 'bg-navy-deep/[.85]',
    iconColorClass: 'text-gold-light',
    arrowColorClass: 'text-navy-deep',
    grain: true,
  },
  {
    href: '/success-centre',
    label: 'Essentials',
    desc: 'Mentors, jobs & opportunities, achievements',
    path: 'M12 2l2.4 7.2H22l-6 4.6 2.3 7.2L12 16.4 5.7 21l2.3-7.2-6-4.6h7.6z',
    background: '#C9B67E',
    aurora: 'none',
    textClass: 'text-navy-deep',
    subClass: 'text-navy-deep/70',
    iconBgClass: 'bg-navy-deep/[.14]',
    iconColorClass: 'text-navy-deep',
    arrowColorClass: 'text-navy-deep',
    grain: false,
  },
];

export function QuickActions({
  vaultSummary,
}: {
  vaultSummary: { quizzes: number; companionSessions: number; summaries: number; total: number };
}) {
  const vaultDesc =
    vaultSummary.total === 0
      ? 'Private to you — notes, quizzes, and AI sessions saved here.'
      : `${vaultSummary.quizzes} quizzes · ${vaultSummary.companionSessions} sessions · ${vaultSummary.summaries} summaries`;

  return (
    <div>
      <div className="mb-[18px]">
        <div className="font-condensed font-bold text-[11px] uppercase tracking-[.08em] text-gold mb-1">
          Start here
        </div>
        <h2 className="font-display font-bold text-[23px] text-navy">
          Quick <em className="italic text-gold">actions</em>
        </h2>
        <p className="font-body text-[13px] text-g600 mt-1">
          The fastest ways to get studying, right now.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {ACTIONS.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className={`group relative isolate overflow-hidden rounded-2xl p-[22px] min-h-[190px] flex flex-col justify-between gap-4 transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_14px_28px_rgba(13,43,94,.20)] ${
              a.borderColorClass ? a.borderColorClass : a.border ? 'border-[1.5px] border-navy' : 'border border-white/[.08]'
            }`}
            style={{ background: a.background }}
          >
            {a.aurora !== 'none' && (
              <span
                className="absolute -inset-[20%] pointer-events-none z-0"
                style={{ background: a.aurora, filter: 'blur(28px)' }}
              />
            )}
            {a.grain && (
              <span
                className="absolute inset-0 pointer-events-none z-0 opacity-50 mix-blend-overlay"
                style={{ backgroundImage: GRAIN_URL }}
              />
            )}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1}
              className={`absolute -right-[14px] -bottom-[14px] w-24 h-24 opacity-[.12] pointer-events-none z-0 ${a.textClass}`}
            >
              <path d={a.path} />
            </svg>
            {a.sheen && (
              <span className="absolute top-0 -left-[60%] w-[40%] h-full bg-gradient-to-r from-transparent via-white/45 to-transparent -skew-x-[18deg] transition-all duration-500 ease-out group-hover:left-[130%] pointer-events-none z-[1]" />
            )}

            {a.badge && (
              <span className="absolute top-[18px] right-[18px] z-10 font-condensed font-bold text-[9.5px] uppercase tracking-[.08em] bg-white/20 text-white px-[9px] py-[4px] rounded-full">
                {a.badge}
              </span>
            )}

            <span
              className={`absolute top-[18px] right-[18px] opacity-0 -translate-x-1 translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 z-10 ${a.arrowColorClass} ${a.badge ? 'group-hover:!opacity-0' : ''}`}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-current fill-none" strokeWidth={2.2}>
                <path d="M7 17L17 7M7 7h10v10" />
              </svg>
            </span>

            <div
              className={`relative z-10 w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-[1.08] group-hover:-rotate-[4deg] ${a.iconBgClass}`}
            >
              <svg viewBox="0 0 24 24" className={`w-[22px] h-[22px] stroke-current fill-none ${a.iconColorClass}`} strokeWidth={1.8}>
                <path d={a.path} />
              </svg>
            </div>

            <div className="relative z-10">
              <div className={`font-display font-semibold text-[16px] ${a.textClass}`}>{a.label}</div>
              <div className={`font-body text-xs mt-1 leading-snug ${a.subClass}`}>{a.desc}</div>
            </div>
          </Link>
        ))}

        {/* Study Vault — now the 8th tile in the same grid, using real summary data */}
        <Link
          href="/vault"
          className="group relative isolate overflow-hidden rounded-2xl p-[22px] min-h-[190px] flex flex-col justify-between gap-4 transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_14px_28px_rgba(201,160,44,.25)] border border-[#E6D6A8]"
          style={{ background: 'linear-gradient(150deg, #F3E7C9 0%, #F0D9A0 100%)' }}
        >
          <span
            className="absolute inset-0 pointer-events-none z-0 opacity-50 mix-blend-overlay"
            style={{ backgroundImage: GRAIN_URL }}
          />
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1}
            className="absolute -right-[14px] -bottom-[14px] w-24 h-24 opacity-[.13] pointer-events-none z-0 text-navy-deep"
          >
            <path d="M3 11h18v10a2 2 0 01-2 2H5a2 2 0 01-2-2V11zM7 11V7a5 5 0 0110 0v4" />
          </svg>

          <span className="absolute top-[18px] right-[18px] opacity-0 -translate-x-1 translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 z-10 text-navy-deep">
            <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-current fill-none" strokeWidth={2.2}>
              <path d="M7 17L17 7M7 7h10v10" />
            </svg>
          </span>

          <div className="relative z-10 w-11 h-11 rounded-xl flex items-center justify-center bg-navy-deep/[.85] transition-transform duration-300 group-hover:scale-[1.08] group-hover:-rotate-[4deg]">
            <svg viewBox="0 0 24 24" className="w-[22px] h-[22px] stroke-current fill-none text-gold-light" strokeWidth={1.8}>
              <path d="M3 11h18v10a2 2 0 01-2 2H5a2 2 0 01-2-2V11zM7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>

          <div className="relative z-10">
            <div className="font-display font-semibold text-[16px] text-navy-deep">Private Study Vault</div>
            <div className="font-body text-xs mt-1 leading-snug text-navy-deep/70">{vaultDesc}</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
