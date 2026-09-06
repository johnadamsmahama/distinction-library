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
  papers: { label: 'Library', href: '/library' },
  library: { label: 'Library', href: '/library' },
  vault: { label: 'Study Vault', href: '/vault' },
  'ai-tools': { label: 'AI Tools', href: '/ai-tools' },
};

// /papers is now always a dedicated destination reached through the
// Library hub (Lecture Slides or Past Questions Bank), not a hub page
// itself — so unlike /essentials or /library, it should show the
// "Library" crumb even when it's the only segment in the path.
const ALWAYS_SHOW_SECTION = ['papers'];

// AI Tools sub-pages go one level deeper than the standard two-level
// breadcrumb (Home / AI Tools / [Tool Name]).
const AI_TOOLS: Record<string, string> = {
  companion: 'Study Companion',
  'quiz-generator': 'Quiz Generator',
  'presentation-kit': 'Presentation Kit',
};

// Career Resources sub-tools go one level deeper than the standard
// two-level breadcrumb (Home / Essentials / Career Resources / [Tool]).
const CAREER_TOOLS: Record<string, string> = {
  'cv-builder': 'AI CV Builder',
  'cover-letter': 'Cover Letter Generator',
  'interview-coach': 'Interview Coach',
  'linkedin-optimizer': 'LinkedIn Optimizer',
};

// Top-level URL segments that don't nest under /essentials in the folder
// structure, but conceptually belong there in the nav — so their
// breadcrumb should still read "Home / Essentials" rather than just "Home".
const ESSENTIALS_ALIASES = ['tutors'];

// Pages with their own full-bleed design that builds Home/Library
// navigation directly into the page itself — the global breadcrumb bar
// would otherwise sit on top of it on the default light background.
const SELF_NAV_PAGES = ['/papers/upload/lecture-slides', '/papers/upload/past-papers'];

export default function HomeButtonGate() {
  const pathname = usePathname();
  if (pathname === '/dashboard') return null;
  if (SELF_NAV_PAGES.includes(pathname)) return null;

  const segments = pathname.split('/').filter(Boolean); // e.g. ['essentials', 'mentors']
  const topSegment = segments[0];
  const section = SECTIONS[topSegment];
  const showSectionCrumb = !!section && (segments.length > 1 || ALWAYS_SHOW_SECTION.includes(topSegment));

  const isEssentialsAlias = ESSENTIALS_ALIASES.includes(topSegment);

  const isCareerTool = topSegment === 'essentials' && segments[1] === 'career' && segments.length === 3;
  const careerToolLabel = isCareerTool ? CAREER_TOOLS[segments[2]] : undefined;

  const isAiTool = topSegment === 'ai-tools' && segments.length === 2;
  const aiToolLabel = isAiTool ? AI_TOOLS[segments[1]] : undefined;

  return (
    <div className="relative mb-4 -mx-4 sm:mx-0 px-4 sm:px-0">
      <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap font-condensed font-extrabold text-sm sm:text-base uppercase tracking-wide [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-gold drop-shadow-sm flex-shrink-0">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>

        <Link href="/dashboard" className="text-gold hover:text-gold-light drop-shadow-sm flex-shrink-0">
          Home
        </Link>

        {showSectionCrumb && (
          <>
            <span className="text-g600/50 normal-case font-normal flex-shrink-0">/</span>
            <Link href={section.href} className="text-gold hover:text-gold-light drop-shadow-sm flex-shrink-0">
              {section.label}
            </Link>
          </>
        )}

        {isEssentialsAlias && (
          <>
            <span className="text-g600/50 normal-case font-normal flex-shrink-0">/</span>
            <Link href="/essentials" className="text-gold hover:text-gold-light drop-shadow-sm flex-shrink-0">
              Essentials
            </Link>
          </>
        )}

        {isCareerTool && careerToolLabel && (
          <>
            <span className="text-g600/50 normal-case font-normal flex-shrink-0">/</span>
            <Link href="/essentials/career" className="text-gold hover:text-gold-light drop-shadow-sm flex-shrink-0">
              Career Resources
            </Link>
            <span className="text-g600/50 normal-case font-normal flex-shrink-0">/</span>
            <span className="text-gold-light flex-shrink-0">{careerToolLabel}</span>
          </>
        )}

        {isAiTool && aiToolLabel && (
          <>
            <span className="text-g600/50 normal-case font-normal flex-shrink-0">/</span>
            <span className="text-gold flex-shrink-0">{aiToolLabel}</span>
          </>
        )}
      </div>
    </div>
  );
}
