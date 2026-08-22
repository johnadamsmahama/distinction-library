import Link from 'next/link';

export default function BackToDashboard() {
  return (
    <Link
      href="/dashboard"
      className="inline-flex items-center gap-2 font-condensed font-extrabold text-sm sm:text-base uppercase tracking-wide text-gold hover:text-gold-light drop-shadow-sm mb-4"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      Home
    </Link>
  );
}
