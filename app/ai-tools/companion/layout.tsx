import Link from 'next/link';

export default function CompanionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between border-b border-gold/20 pb-3 mb-4">
        <div className="flex items-center gap-2 font-mono text-xs">
          <Link href="/ai-tools" className="text-gold hover:underline">
            ← AI Tools
          </Link>
          <span className="text-white/20">/</span>
          <span className="text-white">Study Companion</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-400/80">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
          READY
        </div>
      </div>
      {children}
    </div>
  );
}
