import Link from 'next/link';
import Constellation from '@/components/ai-tools/Constellation';

export default function CompanionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden" style={{ backgroundColor: '#0E1830' }}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(120% 90% at 50% -10%, rgba(20,33,61,0) 0%, #0E1830 65%)',
        }}
      />
      <Constellation />
      <div className="relative z-10 px-6 py-5">
        <div className="flex items-baseline gap-3">
          <Link href="/ai-tools" className="font-condensed font-bold text-xs uppercase text-gold hover:underline whitespace-nowrap">
            ← AI Tools
          </Link>
          <span className="w-px h-4 bg-white/15" />
          <h1 className="font-display font-bold text-lg text-white truncate">AI Study Companion</h1>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
