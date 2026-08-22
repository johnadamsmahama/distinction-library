'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Sections that have their own "hub" page with multiple sub-pages inside
// them (e.g. /essentials -> /essentials/mentors). When the user is on one
// of those sub-pages, we show a two-level breadcrumb: Home / SectionName.
// When they're on the hub page itself (e.g. /essentials), only "Home" is
// shown, since repeating "Essentials" right next to itself is redundant.
const SECTIONS: Record<string, { label: string; href: string }> = {
  essentials: { label: 'Essentials', href: '/essentials' },
  papers: { label: 'Library', href: '/papers' },
  vault: { label: 'Study Vault', href: '/vault' },
  tutors: { label: 'Peer Tutors', href: '/tutors' },
};

export default function HomeButtonGate() {
  const pathname = usePathname();
  if (pathname === '/dashboard') return null;

  const segments = pathname.split('/').filter(Boolean); // e.g. ['essentials', 'mentors']
  const topSegment = segments[0];
  const section = SECTIONS[topSegment];
  const showSectionCrumb = !!section && segments.length > 1;

  return (
    <div className="inline-flex items-center gap-2 font-condensed font-extrabold text-sm sm:text-base uppercase tracking-wide mb-4">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-gold drop-shadow-sm flex-shrink-0">
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>

      <Link href="/dashboard" className="text-gold hover:text-gold-light drop-shadow-sm">
        Home
      </Link>

      {showSectionCrumb && (
        <>
          <span className="text-g600/50 normal-case font-normal">/</span>
          <Link href={section.href} className="text-gold hover:text-gold-light drop-shadow-sm">
            {section.label}
          </Link>
        </>
      )}
    </div>
  );
}
