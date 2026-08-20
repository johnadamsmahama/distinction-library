'use client';

import { useEffect, useRef, useState } from 'react';
import Reveal from './Reveal';

const CARDS = [
  {
    title: 'Library',
    desc: 'Past papers and curated study materials — notes, slides, summaries — searchable by course, level, and week. Browse, download, or upload your own.',
    tag: 'Community-contributed & platform-curated · Moderated · Watermarked',
    path: 'M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z',
    badge: 'Core',
  },
  {
    title: 'Upload Resources',
    desc: 'Upload slides, past papers, or notes for other students — help build the library while earning leaderboard recognition.',
    tag: 'Moderated on submission · Earns leaderboard points',
    path: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12',
  },
  {
    title: 'Exam Predictor',
    desc: 'AI-ranked predictions of likely exam questions, built from past papers, course materials, and examiner patterns — plus AI-written answers for any past paper, on demand.',
    tag: 'Beta · Course-specific rankings · Solved Past Papers',
    path: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 16a4 4 0 100-8 4 4 0 000 8z M12 13a1 1 0 100-2 1 1 0 000 2z',
  },
  {
    title: 'Study Companion',
    desc: 'Upload notes, ask anything — instant explanations, summaries, revision notes.',
    tag: 'Private to you · Saved to your Study Vault',
    path: 'M12 3a6 6 0 016 6c0 3.5-2.5 5-3 7H9c-.5-2-3-3.5-3-7a6 6 0 016-6zM9 21h6',
  },
  {
    title: 'Quiz Generator',
    desc: 'PDF → MCQs, true/false, and short-answer with answers & explanations.',
    tag: 'Generated from your own materials · Always private',
    path: 'M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11',
  },
  {
    title: 'Presentation Kit',
    desc: 'Turn a topic, a Vault item, or an uploaded document into a PowerPoint (PPTX) ready to present.',
    tag: 'Generated from your own materials · Ready to download',
    path: 'M3 4h18v13H3V4zM8 21h8M12 17v4M7 12l3-4 2.5 3L17 6',
  },
  {
    title: 'Peer Tutors',
    desc: 'Get one-on-one help from a fellow student — book revision sessions with peer tutors and Distinction Programme facilitators.',
    tag: 'Distinction Mentors · Book a session',
    path: 'M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M11 3a4 4 0 110 8 4 4 0 010-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  },
  {
    title: 'Essentials',
    desc: 'Mentors, jobs & opportunities, and your achievement portfolio — support beyond the study materials.',
    tag: 'Scholarships · Internships · Achievement badges',
    path: 'M12 2l2.4 7.2H22l-6 4.6 2.3 7.2L12 16.4 5.7 21l2.3-7.2-6-4.6h7.6z',
  },
  {
    title: 'Private Study Vault',
    desc: 'Encrypted personal space — AI quizzes, sessions, notes. Only you can see it.',
    tag: 'Zero visibility to others · Fully private',
    path: 'M3 11h18v10a2 2 0 01-2 2H5a2 2 0 01-2-2V11zM7 11V7a5 5 0 0110 0v4',
  },
  {
    title: 'Leaderboard & Badges',
    desc: 'Gold, Silver, and Bronze recognition for top past-paper contributors each semester.',
    tag: 'Resets each semester · All-time archive kept',
    path: 'M8 21V9M13 21V4M18 21v-6M3 21h18',
  },
];

// Four rotating tints for the ledger cards — cream, mint, dusty blue, blush.
// Kept as hex (not the navy/gold theme tokens) since these are deliberately
// soft, secondary backdrops behind the gold rule + navy type.
const TINTS = [
  { bg: '#FBF3E1', border: '#EBDDB8', hoverShadow: 'rgba(159,122,31,.14)' }, // cream
  { bg: '#E9F2EA', border: '#C9DECB', hoverShadow: 'rgba(45,110,70,.12)' },  // mint
  { bg: '#E9EFF6', border: '#C7D5E6', hoverShadow: 'rgba(30,70,140,.12)' },  // dusty blue
  { bg: '#F6EBEA', border: '#E3C9C6', hoverShadow: 'rgba(150,60,55,.10)' }, // blush
];

export default function Features() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [perView, setPerView] = useState(1);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setPerView(w >= 980 ? 3 : w >= 701 ? 2 : 1);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const totalPages = Math.ceil(CARDS.length / perView);

  const goTo = (p: number) => {
    const clamped = Math.max(0, Math.min(p, totalPages - 1));
    setPage(clamped);
    const track = trackRef.current;
    if (!track) return;
    const cardWidth = track.children[0]?.getBoundingClientRect().width ?? 0;
    const gap = 20;
    track.scrollTo({ left: clamped * perView * (cardWidth + gap), behavior: 'smooth' });
  };

  return (
    <section id="features" className="py-[70px] px-7 bg-off-white">
      <div className="max-w-content mx-auto">
        <Reveal className="text-center max-w-[520px] mx-auto mb-11">
          <div className="eyebrow">Everything You Need</div>
          <h2 className="font-display font-bold text-[clamp(26px,4vw,36px)] text-navy mt-[10px]">
            One platform. Every academic resource.
          </h2>
        </Reveal>

        <Reveal>
          <div
            ref={trackRef}
            className="flex gap-5 overflow-hidden cursor-grab active:cursor-grabbing"
          >
            {CARDS.map((c, i) => {
              const tint = TINTS[i % TINTS.length];
              return (
                <div
                  key={c.title}
                  className="group relative flex-none w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] min-h-[300px] rounded-sm p-6 pb-5 flex flex-col border border-l-[3px] border-l-gold hover:border-l-navy transition-all duration-300 hover:-translate-y-1"
                  style={{
                    background: tint.bg,
                    borderColor: tint.border,
                    boxShadow: '0 1px 0 rgba(0,0,0,.02)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = `0 16px 30px ${tint.hoverShadow}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 1px 0 rgba(0,0,0,.02)';
                  }}
                >
                  {c.badge && (
                    <span className="absolute top-[22px] right-5 font-condensed font-bold text-[9.5px] uppercase tracking-[.08em] text-gold border border-gold px-[9px] py-[3px] rounded-sm">
                      {c.badge}
                    </span>
                  )}

                  <div className="font-display font-bold italic text-[13px] text-gold mb-4 tracking-wide">
                    No. {String(i + 1).padStart(2, '0')}
                  </div>

                  <div className="w-[38px] h-[38px] flex items-center justify-center mb-4">
                    <svg viewBox="0 0 24 24" className="w-[26px] h-[26px] stroke-navy fill-none" strokeWidth={1.4}>
                      <path d={c.path} />
                    </svg>
                  </div>

                  <h3 className="font-display font-bold text-[19px] text-navy mb-[10px]">{c.title}</h3>
                  <p className="font-body text-[13.5px] leading-[1.65] text-g600 mb-4 flex-1">{c.desc}</p>

                  <div className="flex items-center gap-[6px] border-t pt-3 font-condensed font-semibold text-[11px] uppercase tracking-wider text-navy" style={{ borderColor: tint.border }}>
                    <span className="text-gold">—</span>
                    {c.tag}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-[18px] mt-8">
            <button
              aria-label="Previous"
              onClick={() => goTo(page - 1)}
              className="w-[38px] h-[38px] rounded-sm border border-[#E2E6EF] flex items-center justify-center text-navy hover:border-gold transition-colors"
            >
              ‹
            </button>
            <div className="flex gap-2">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => goTo(i)}
                  className={`h-[7px] rounded-full transition-all ${
                    i === page ? 'w-[22px] bg-gold' : 'w-[7px] bg-[#D8DCE8]'
                  }`}
                />
              ))}
            </div>
            <button
              aria-label="Next"
              onClick={() => goTo(page + 1)}
              className="w-[38px] h-[38px] rounded-sm border border-[#E2E6EF] flex items-center justify-center text-navy hover:border-gold transition-colors"
            >
              ›
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
