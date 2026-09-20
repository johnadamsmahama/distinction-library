import Link from 'next/link';

export default function BackToDashboard() {
  return (
    <Link
      href="/dashboard"
      className="inline-flex items-center gap-2 font-[family-name:var(--font-courier-prime)] font-bold text-[13px] uppercase tracking-wide text-navy hover:opacity-70 transition-opacity mb-4"
    >
      <span>←</span>
      Home
    </Link>
  );
}
