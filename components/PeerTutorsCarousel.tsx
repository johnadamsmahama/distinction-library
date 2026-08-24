'use client';

import { useEffect, useRef, useState } from 'react';
import type { FeaturedTutor } from '@/lib/tutors-data';

export default function PeerTutorsCarousel({ tutors }: { tutors: FeaturedTutor[] }) {
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

  const totalPages = Math.ceil(tutors.length / perView);
  const showControls = totalPages > 1;

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
    <div>
      <div
        ref={trackRef}
        className={`flex gap-5 overflow-hidden cursor-grab active:cursor-grabbing ${
          !showControls ? 'justify-center' : ''
        }`}
      >
        {tutors.map((t) => (
          <div
            key={t.id}
            className="group relative flex-none w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] max-w-[240px] border-2 border-navy p-6 text-center hover:border-gold hover:-translate-y-[3px] transition-all overflow-hidden"
          >
            <span className="absolute left-0 right-0 bottom-0 h-[3px] bg-gold scale-x-0 origin-left group-hover:scale-x-100 transition-transform" />
            <div className="w-[68px] h-[68px] mx-auto mb-4 bg-navy overflow-hidden flex items-center justify-center">
              {t.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.photo_url} alt={t.full_name} className="w-full h-full object-cover" />
              ) : (
                <span className="font-display font-black text-2xl text-gold">
                  {t.full_name.charAt(0)}
                </span>
              )}
            </div>
            <h3 className="font-display font-black text-[16px] text-navy mb-1">{t.full_name}</h3>
            <p className="font-condensed font-extrabold text-[11px] uppercase tracking-wide text-g600">
              {t.department} · Level {t.level}
            </p>
          </div>
        ))}
      </div>

      {showControls && (
        <div className="flex items-center justify-center gap-[18px] mt-8">
          <button
            aria-label="Previous"
            onClick={() => goTo(page - 1)}
            className="w-[38px] h-[38px] border border-[#E2E6EF] flex items-center justify-center text-navy hover:border-gold transition-colors"
          >
            ‹
          </button>
          <div className="flex gap-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => goTo(i)}
                className={`h-[7px] transition-all ${i === page ? 'w-[22px] bg-gold' : 'w-[7px] bg-[#D8DCE8]'}`}
              />
            ))}
          </div>
          <button
            aria-label="Next"
            onClick={() => goTo(page + 1)}
            className="w-[38px] h-[38px] border border-[#E2E6EF] flex items-center justify-center text-navy hover:border-gold transition-colors"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
