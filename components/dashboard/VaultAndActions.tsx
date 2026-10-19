'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

export function VaultSummary({
  summary,
}: {
  summary: { quizzes: number; companionSessions: number; summaries: number; total: number };
}) {
  return (
    <div className="bg-white border border-g100 rounded-none p-6">
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

/* ══════════════════════════════════════════════════════════
   Quick Actions — "Gilt Wallet".
   Same Academic Atelier cards (cream face, corner flag, tinted
   icon box, Greek-red title, tan backdrop) with two changes:

   1. Each card is its own foil-framed object. Waiting cards are
      tilted and staggered left/right.
   2. As you scroll, each card slides up and sticks under the
      dashboard nav, leaving a thin gold-edged strip of every card
      above it. Once a card joins the pile it straightens and
      lines up with the others.

   At the very end of the scroll the 9th card joins the pile and the
   last two cards settle just below it, straight and in line. Scroll
   back up and every card returns to its own tilt.

   The stuck/settled states are toggled by a small scroll listener
   (below); everything else is CSS in STACK_CSS.
   ══════════════════════════════════════════════════════════ */

const ATELIER_PAGE_BG = '#DDD4B8';
const ATELIER_CARD_BG = '#F6F1E3';
const ATELIER_BORDER = '#E4DBC2';
const ATELIER_RED = '#A1381F';
const GOLD_FOIL = 'rgba(201,160,44,.75)';

/** The dashboard nav is 64px + a 2px gold top border and is sticky, so the pile starts just under it. */
const PILE_TOP_PX = 78;
/** How much of each stacked card stays visible above the next one. */
const PILE_STEP_PX = 10;
/** The last N cards are not part of the pile: they follow it with a gap. */
const FREE_TAIL = 2;

const STACK_CSS = `
.qa-stack{--qa-top:${PILE_TOP_PX}px}
.qa-card{
  --x:0%;--r:0deg;
  position:sticky;
  top:calc(var(--qa-top) + var(--i) * ${PILE_STEP_PX}px);
  width:92%;
  margin-bottom:30px;
  overflow:hidden;
  background:${ATELIER_CARD_BG};
  border:1px solid ${ATELIER_BORDER};
  box-shadow:0 1px 0 #fff inset,0 -3px 10px rgba(70,50,10,.14),0 12px 22px -10px rgba(70,50,10,.42);
  transform:translateX(var(--x)) rotate(var(--r));
  transition:transform .45s cubic-bezier(.2,.7,.2,1);
  -webkit-tap-highlight-color:transparent;
}
.qa-card:last-child{margin-bottom:0}
/* Waiting cards: staggered and tilted. 8.7% of a 92%-wide card = the other 8% of the row. */
.qa-card.qa-r{--x:8.7%;--r:.6deg}
.qa-card.qa-l{--x:0%;--r:-.6deg}
/* Cards in the pile (stuck), and the free tail once the pile is complete (settled): centred, straight, in order. */
.qa-card.qa-stuck,.qa-card.qa-settled{--x:4.35%;--r:0deg}
.qa-card:hover{transform:translateX(var(--x)) rotate(0deg) translateY(-3px)}
.qa-card:active{transform:translateX(var(--x)) rotate(0deg) scale(.985)}
.qa-card:focus-visible{outline:3px solid ${ATELIER_RED};outline-offset:3px}
/* Foil frame */
.qa-card::before{
  content:"";position:absolute;inset:5px;pointer-events:none;
  border:1px solid ${GOLD_FOIL};
  outline:1px solid rgba(201,160,44,.3);outline-offset:-4px;
}
/* Light sweep on hover */
.qa-card::after{
  content:"";position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(105deg,transparent 35%,rgba(255,236,170,.55) 50%,transparent 65%);
  transform:translateX(-120%);transition:transform .7s;
}
.qa-card:hover::after{transform:translateX(120%)}
/* Corner flag, theme-coloured, grows slightly on hover */
.qa-flag{
  position:absolute;top:0;right:0;width:0;height:0;border-style:solid;border-width:0 20px 20px 0;
  border-color:transparent ${ATELIER_PAGE_BG} var(--t) transparent;transition:border-width .2s;
}
.qa-card:hover .qa-flag{border-width:0 30px 30px 0}
/* Gold ring around the icon box */
.qa-ic{box-shadow:0 0 0 3px ${ATELIER_CARD_BG},0 0 0 4px ${GOLD_FOIL}}
@media (prefers-reduced-motion:reduce){
  .qa-card,.qa-card::after,.qa-flag{transition:none!important}
}
`;

type Action = {
  href: string;
  label: string;
  desc: string;
  path: string;
  /** Drives the icon tint/border and the corner flag for this card. */
  theme: string;
};

const ACTIONS: Action[] = [
  {
    href: '/papers/upload',
    label: 'Upload Resources',
    desc: 'Upload slides, past papers, or notes for other students.',
    path: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12',
    theme: '#12295C',
  },
  {
    href: '/library',
    label: 'Library',
    desc: 'Browse and download past papers & materials',
    path: 'M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z',
    theme: '#9A7A1F',
  },
  {
    href: '/papers',
    label: 'Solved Past Papers',
    desc: 'Get instant AI-written answers for any past paper',
    path: 'M9 12l2 2 4-4M12 3a9 9 0 100 18 9 9 0 000-18z',
    theme: '#0F2244',
  },
  {
    href: '/predictor',
    label: 'Exam Predictor',
    desc: 'See AI-ranked likely topics for your course',
    path: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 16a4 4 0 100-8 4 4 0 000 8z M12 13a1 1 0 100-2 1 1 0 000 2z',
    theme: '#8C6D2A',
  },
  {
    href: '/ai-tools/companion',
    label: 'Study Companion',
    desc: 'Explain a topic or summarise notes',
    path: 'M12 3a6 6 0 016 6c0 3.5-2.5 5-3 7H9c-.5-2-3-3.5-3-7a6 6 0 016-6zM9 21h6',
    theme: '#33384A',
  },
  {
    href: '/ai-tools/quiz-generator',
    label: 'Quiz Generator',
    desc: 'Turn notes into practice questions',
    path: 'M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11',
    theme: '#2A5FCC',
  },
  {
    href: '/ai-tools/presentation-kit',
    label: 'Presentation Kit',
    desc: 'Turn a topic, a Vault item, or a document into a PowerPoint (PPTX) ready to present.',
    path: 'M3 4h18v13H3V4zM8 21h8M12 17v4M7 12l3-4 2.5 3L17 6',
    theme: '#7A3E63',
  },
  {
    href: '/tutors',
    label: 'Peer Tutors',
    desc: 'Get one-on-one help from a fellow student',
    path: 'M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M11 3a4 4 0 110 8 4 4 0 010-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
    theme: '#8A6A22',
  },
  {
    href: '/dashboard/gpa-calculator',
    label: 'GPA Calculator',
    desc: 'Track your GPA as results release, and test hypothetical grades for courses still pending.',
    path: 'M3 3v18h18M8 17V10M13 17V6M18 17v-4',
    theme: '#3F6B5C',
  },
  {
    href: '/essentials',
    label: 'Essentials',
    desc: 'Mentors, jobs & opportunities, achievements',
    path: 'M12 2l2.4 7.2H22l-6 4.6 2.3 7.2L12 16.4 5.7 21l2.3-7.2-6-4.6h7.6z',
    theme: '#7A6B3D',
  },
];

/** Card number label, e.g. 1 -> "001". */
function cardNo(n: number) {
  return String(n).padStart(3, '0');
}

function AtelierCard({ action, index }: { action: Action; index: number }) {
  const { href, label, desc, path, theme } = action;
  // First card sits right, then they alternate.
  const side = index % 2 === 0 ? 'qa-r' : 'qa-l';
  return (
    <Link
      href={href}
      className={`qa-card ${side} group flex items-start gap-4 p-[22px] min-h-[130px]`}
      style={{ '--t': theme, '--i': index } as React.CSSProperties}
    >
      <span aria-hidden className="qa-flag" />

      {/* Icon box — square corners, tinted with this card's theme color */}
      <div
        className="qa-ic relative z-10 w-[46px] h-[46px] flex items-center justify-center flex-shrink-0 rounded-none"
        style={{
          background: `${theme}29`,
          border: `1.5px solid ${theme}8c`,
          color: theme,
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.3} className="w-[22px] h-[22px]">
          <path d={path} />
        </svg>
      </div>

      <div className="relative z-10 flex-1 min-w-0">
        <span className="font-mono text-[9px] text-g600 tracking-wide block mb-1">
          CARD {cardNo(index + 1)}
        </span>
        <div className="font-display font-bold text-[16.5px] text-navy-deep mb-1.5">{label}</div>
        <p className="font-mono text-[10px] text-g600 leading-[1.55] m-0">{desc}</p>
      </div>
    </Link>
  );
}

export function QuickActions({
  vaultSummary,
}: {
  vaultSummary: { quizzes: number; companionSessions: number; summaries: number; total: number };
}) {
  const stackRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);

  const vaultDesc =
    vaultSummary.total === 0
      ? 'Private to you — notes, quizzes, and AI sessions saved here.'
      : `${vaultSummary.quizzes} quizzes · ${vaultSummary.companionSessions} sessions · ${vaultSummary.summaries} summaries`;

  const vaultAction: Action = {
    href: '/vault',
    label: 'Private Study Vault',
    desc: vaultDesc,
    path: 'M3 11h18v10a2 2 0 01-2 2H5a2 2 0 01-2-2V11zM7 11V7a5 5 0 0110 0v4',
    theme: '#0D2B5E',
  };

  const allCards = [...ACTIONS, vaultAction];

  useEffect(() => {
    const root = stackRef.current;
    const spacer = spacerRef.current;
    if (!root || !spacer) return;
    const cards = Array.from(root.querySelectorAll<HTMLElement>('.qa-card'));
    const last = cards.length - 1 - FREE_TAIL; // index of the last card that joins the pile
    if (last < 0) return;
    let raf = 0;

    // A card is "stuck" once it has reached its place in the pile. When the last pile card
    // is stuck, the pile is complete and the free tail settles in line with it.
    const sync = () => {
      raf = 0;
      for (const card of cards) {
        const top = parseFloat(getComputedStyle(card).top) || 0;
        card.classList.toggle('qa-stuck', card.getBoundingClientRect().top <= top + 3);
      }
      const complete = cards[last].classList.contains('qa-stuck');
      cards.forEach((card, i) => {
        if (i > last) card.classList.toggle('qa-settled', complete);
      });
    };

    // Adds just enough scroll room, below the tan panel, for the last pile card to reach the
    // pile at the end of the page. Zero on tall screens that already have room.
    const fit = () => {
      spacer.style.height = '0px';
      let tail = 0;
      for (let i = last; i < cards.length; i++) {
        tail += cards[i].offsetHeight;
        if (i < cards.length - 1) tail += parseFloat(getComputedStyle(cards[i]).marginBottom) || 0;
      }
      const cardsEnd = root.getBoundingClientRect().bottom + window.scrollY;
      tail += document.documentElement.scrollHeight - cardsEnd;
      const top = parseFloat(getComputedStyle(cards[last]).top) || 0;
      spacer.style.height = `${Math.max(0, window.innerHeight - top - tail)}px`;
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(sync);
    };
    const onResize = () => {
      fit();
      onScroll();
    };

    fit();
    sync();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onResize) : null;
    ro?.observe(root);
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) onResize();
    });

    return () => {
      cancelled = true;
      ro?.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [allCards.length]);

  return (
    <div>
      <div className="p-5 sm:p-7" style={{ background: ATELIER_PAGE_BG }}>
      <style dangerouslySetInnerHTML={{ __html: STACK_CSS }} />

      <div className="pb-3.5 mb-6" style={{ borderBottom: '2px solid #060F1E' }}>
        <span className="font-condensed font-bold text-[10px] uppercase tracking-[.1em] text-gold">
          Start here
        </span>
        <h2 className="font-display font-extrabold text-[24px] leading-tight mt-1" style={{ color: ATELIER_RED }}>
          Quick Actions
        </h2>
        <p className="font-body italic text-[13px] text-g600 mt-1.5">
          Choose a card, or tap one for full access.
        </p>
      </div>

      <div ref={stackRef} className="qa-stack">
        {allCards.map((a, i) => (
          <AtelierCard key={a.href} action={a} index={i} />
        ))}
      </div>
      </div>

      {/* Scroll room outside the tan panel; sized in JS so the 9th card can join the pile. */}
      <div ref={spacerRef} aria-hidden />
    </div>
  );
}
