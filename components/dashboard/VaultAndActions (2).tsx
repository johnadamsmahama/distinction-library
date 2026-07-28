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

// Shared fine-grain texture (SVG turbulence), used on the three colored tiles.
const GRAIN_URL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const ACTIONS = [
  {
    href: '/vault/quiz-generator',
    label: 'Generate a Quiz',
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
    href: '/vault/companion',
    label: 'Ask the AI Companion',
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
    href: '/papers/upload',
    label: 'Upload a Past Paper',
    desc: 'Contribute to the community library',
    path: 'M7 8l5-5 5 5M12 3v12M4 15v4a2 2 0 002 2h12a2 2 0 002-2v-4',
    background: '#F7F8FC',
    aurora:
      'radial-gradient(40% 45% at 90% 0%, rgba(201,160,44,.30), transparent 70%), radial-gradient(45% 50% at 10% 100%, rgba(13,43,94,.16), transparent 70%)',
    textClass: 'text-navy',
    subClass: 'text-g600',
    iconBgClass: 'bg-navy',
    iconColorClass: 'text-gold-light',
    arrowColorClass: 'text-navy',
    border: true,
    grain: false,
  },
  {
    href: '/tutors',
    label: 'Find a Peer Tutor',
    desc: 'Get one-on-one help from a fellow student',
    path: 'M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M11 3a4 4 0 110 8 4 4 0 010-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
    background: 'linear-gradient(150deg,#F0C94A 0%,#C9A02C 55%,#9A7A1F 100%)',
    aurora:
      'radial-gradient(40% 45% at 20% 10%, rgba(255,235,180,.65), transparent 70%), radial-gradient(45% 50% at 90% 40%, rgba(154,122,31,.5), transparent 70%), radial-gradient(55% 55% at 55% 95%, rgba(10,32,73,.28), transparent 70%)',
    textClass: 'text-navy',
    subClass: 'text-navy/70',
    iconBgClass: 'bg-navy/[.12]',
    iconColorClass: 'text-navy',
    arrowColorClass: 'text-navy',
    sheen: true,
    grain: true,
  },
];

export function QuickActions() {
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
              a.border ? 'border-[1.5px] border-navy' : 'border border-white/[.08]'
            }`}
            style={{ background: a.background }}
          >
            {/* aurora mesh-gradient blobs */}
            <span
              className="absolute -inset-[20%] pointer-events-none z-0"
              style={{ background: a.aurora, filter: 'blur(28px)' }}
            />
            {/* fine grain texture */}
            {a.grain && (
              <span
                className="absolute inset-0 pointer-events-none z-0 opacity-50 mix-blend-overlay"
                style={{ backgroundImage: GRAIN_URL }}
              />
            )}
            {/* oversized watermark icon */}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1}
              className={`absolute -right-[14px] -bottom-[14px] w-24 h-24 opacity-[.12] pointer-events-none z-0 ${a.textClass}`}
            >
              <path d={a.path} />
            </svg>
            {/* gold sheen sweep (Find a Peer Tutor only) */}
            {a.sheen && (
              <span className="absolute top-0 -left-[60%] w-[40%] h-full bg-gradient-to-r from-transparent via-white/45 to-transparent -skew-x-[18deg] transition-all duration-500 ease-out group-hover:left-[130%] pointer-events-none z-[1]" />
            )}

            <span
              className={`absolute top-[18px] right-[18px] opacity-0 -translate-x-1 translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 z-10 ${a.arrowColorClass}`}
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
      </div>
    </div>
  );
}
