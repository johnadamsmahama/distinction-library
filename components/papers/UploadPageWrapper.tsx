'use client';

import { useLayoutEffect, useRef } from 'react';

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.35'/%3E%3C/svg%3E\")";

export default function UploadPageWrapper({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const setHeight = () => {
      // Measure exactly how far from the viewport top this element starts,
      // then fill the rest — no navbar height guessing needed.
      const top = el.getBoundingClientRect().top;
      el.style.height = `${window.innerHeight - top}px`;
    };
    setHeight();
    window.addEventListener('resize', setHeight);
    return () => window.removeEventListener('resize', setHeight);
  }, []);

  return (
    <div
      ref={ref}
      className="relative overflow-hidden flex flex-col -mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8 -mb-4 sm:-mb-6 lg:-mb-8"
      style={{
        // Sensible fallback before JS measures the exact value
        minHeight: 'calc(100dvh - 3.5rem)',
        backgroundImage: 'radial-gradient(120% 90% at 50% 0%, #0F2244 0%, #0D2B5E 45%, #060F1E 100%)',
      }}
    >
      {/* Grain texture */}
      <div
        className="absolute inset-0 opacity-[0.25] pointer-events-none"
        style={{ backgroundImage: GRAIN, mixBlendMode: 'overlay' }}
      />

      {/* Floating gold dot decorations */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" viewBox="0 0 400 500">
        <g style={{ animation: 'contribDriftA 15s ease-in-out infinite', transformOrigin: '60px 90px' }}>
          <g stroke="#E2BE5A" strokeWidth="0.7" opacity="0.22" fill="none">
            <line x1="30" y1="60" x2="85" y2="120" />
            <line x1="85" y1="120" x2="55" y2="185" />
          </g>
          <circle cx="30" cy="60" r="1.8" fill="#E2BE5A" opacity="0.4" />
          <circle cx="85" cy="120" r="2" fill="#E2BE5A" opacity="0.4" />
          <circle cx="55" cy="185" r="1.6" fill="#E2BE5A" opacity="0.4" />
        </g>
        <g style={{ animation: 'contribDriftB 19s ease-in-out infinite', transformOrigin: '390px 260px' }}>
          <g stroke="#E2BE5A" strokeWidth="0.7" opacity="0.2" fill="none">
            <line x1="380" y1="240" x2="335" y2="310" />
          </g>
          <circle cx="380" cy="240" r="1.8" fill="#E2BE5A" opacity="0.4" />
          <circle cx="335" cy="310" r="1.6" fill="#E2BE5A" opacity="0.4" />
        </g>
        <circle cx="220" cy="40" r="1.2" fill="#E2BE5A" opacity="0.3" />
        <circle cx="360" cy="460" r="1.2" fill="#E2BE5A" opacity="0.3" />
      </svg>

      {children}

      <style>{`
        @keyframes contribDriftA { 0%,100%{transform:translate(0,0);} 50%{transform:translate(5px,-6px);} }
        @keyframes contribDriftB { 0%,100%{transform:translate(0,0);} 50%{transform:translate(-5px,5px);} }
      `}</style>
    </div>
  );
}
