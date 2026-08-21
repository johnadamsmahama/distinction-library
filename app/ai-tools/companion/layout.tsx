import Link from 'next/link';

export default function CompanionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline gap-3 mb-4">
        <Link href="/ai-tools" className="font-condensed font-bold text-xs uppercase text-gold hover:underline whitespace-nowrap">
          ← AI Tools
        </Link>
        <span className="w-px h-4 bg-white/15" />
        <h1 className="font-display font-bold text-lg text-white truncate">AI Study Companion</h1>
      </div>
      {children}
    </div>
  );
}
