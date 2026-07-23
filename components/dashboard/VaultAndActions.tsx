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

const ACTIONS = [
  { href: '/vault/quiz-generator', label: 'Generate a Quiz', desc: 'Turn notes into practice questions', path: 'M9 12l2 2 4-4' },
  { href: '/vault/companion', label: 'Ask the AI Companion', desc: 'Explain a topic or summarise notes', path: 'M8 12h8M8 16h5' },
  { href: '/papers/upload', label: 'Upload a Past Paper', desc: 'Contribute to the community library', path: 'M12 4v12m0 0l-4-4m4 4l4-4M5 20h14' },
];

export function QuickActions() {
  return (
    <div className="bg-white border border-g100 rounded-2xl p-6">
      <h2 className="font-display font-bold text-lg text-navy mb-5">Quick actions</h2>
      <div className="space-y-2">
        {ACTIONS.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="flex items-center gap-3 p-3 rounded-xl border border-g100 hover:border-gold transition-colors group"
          >
            <div className="w-9 h-9 flex-shrink-0 bg-navy rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-gold fill-none" strokeWidth={1.8}>
                <path d={a.path} />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="font-condensed font-semibold text-sm text-g800">{a.label}</div>
              <div className="font-body text-xs text-g600 truncate">{a.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
