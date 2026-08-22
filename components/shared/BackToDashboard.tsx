import Link from 'next/link';

export default function BackToDashboard() {
  return (
    <Link
      href="/dashboard"
      className="inline-flex items-center gap-1.5 font-condensed font-bold text-xs uppercase tracking-wide text-gold hover:underline mb-4"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      Home
    </Link>
  );
}
