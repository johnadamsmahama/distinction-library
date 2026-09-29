import Link from 'next/link';

export default function QuizGeneratorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4 font-[family-name:var(--font-courier-prime)] font-bold text-[13px] uppercase tracking-wide text-gold">
        <span>←</span>
        <Link href="/dashboard" className="hover:opacity-70 transition-opacity">Home</Link>
        <span className="text-gold/40 normal-case font-normal">/</span>
        <Link href="/ai-tools" className="hover:opacity-70 transition-opacity">AI Tools</Link>
        <span className="text-gold/40 normal-case font-normal">/</span>
        <span>Quiz Generator</span>
      </div>
      <div className="flex items-center justify-between border-b border-gold/20 pb-3 mb-4">
        <span className="font-mono text-xs text-white">Quiz Generator</span>
        <div className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-400/80">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
          READY
        </div>
      </div>
      {children}
    </div>
  );
}
