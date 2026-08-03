'use client';

import { useEffect, useRef, useState } from 'react';
import Reveal from './Reveal';

const CARDS = [
  {
    title: 'Study Library',
    desc: 'Past papers and curated study materials — notes, slides, summaries — searchable by course, level, and week. Browse, download, or upload your own.',
    tag: 'Community-contributed & platform-curated · Moderated · Watermarked',
    path: 'M4 4h16v16H4z M8 9h8M8 13h5',
    badge: 'Core',
  },
  {
    title: 'Exam Predictor',
    desc: 'AI-ranked predictions of likely exam questions, built from past papers, course materials, and examiner patterns.',
    tag: 'Beta · Course-specific rankings',
    path: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 16a4 4 0 100-8 4 4 0 000 8z M12 13a1 1 0 100-2 1 1 0 000 2z',
  },
  {
    title: 'AI Study Companion',
    desc: 'Upload notes, ask anything — instant explanations, summaries, revision notes.',
    tag: 'Private to you · Saved to your Study Vault',
    path: 'M8 12h8M8 16h5M4 4h16v16H4z',
  },
  {
    title: 'AI Quiz Generator',
    desc: 'PDF → MCQs, true/false, and short-answer with answers & explanations.',
    tag: 'Generated from your own materials · Always private',
    path: 'M9 12l2 2 4-4',
  },
  {
    title: 'Find a Peer Tutor',
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
    path: 'M8 11V8a4 4 0 018 0v3',
  },
  {
    title: 'Leaderboard & Badges',
    desc: 'Gold, Silver, and Bronze recognition for top past-paper contributors each semester.',
    tag: 'Resets each semester · All-time archive kept',
    path: 'M8 21V9M13 21V4M18 21v-6M3 21h18',
  },
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
            {CARDS.map((c) => (
              <div
                key={c.title}
                className="relative flex-none w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] bg-white border border-[#E2E6EF] rounded-[14px] p-7 group hover:border-gold hover:-translate-y-[3px] transition-all overflow-hidden"
              >
                <span className="absolute left-0 right-0 bottom-0 h-[3px] bg-gold scale-x-0 origin-left group-hover:scale-x-100 transition-transform" />
                {c.badge && (
                  <span className="absolute top-5 right-5 font-condensed font-bold text-[9.5px] uppercase tracking-[.08em] bg-gold text-navy px-[9px] py-[4px] rounded-full">
                    {c.badge}
                  </span>
                )}
                <div className="w-[46px] h-[46px] bg-navy rounded-[11px] flex items-center justify-center mb-[18px]">
                  <svg viewBox="0 0 24 24" className="w-[22px] h-[22px] stroke-gold fill-none" strokeWidth={1.8}>
                    <path d={c.path} />
                  </svg>
                </div>
                <h3 className="font-display font-bold text-[17px] text-navy mb-[10px]">{c.title}</h3>
                <p className="font-body text-[13.5px] leading-[1.6] text-g600 mb-4">{c.desc}</p>
                <div className="border-t border-g100 pt-3 font-condensed font-bold text-[10px] uppercase tracking-wider text-gold">
                  {c.tag}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-[18px] mt-8">
            <button
              aria-label="Previous"
              onClick={() => goTo(page - 1)}
              className="w-[38px] h-[38px] rounded-full border border-[#E2E6EF] flex items-center justify-center text-navy hover:border-gold transition-colors"
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
              className="w-[38px] h-[38px] rounded-full border border-[#E2E6EF] flex items-center justify-center text-navy hover:border-gold transition-colors"
            >
              ›
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
