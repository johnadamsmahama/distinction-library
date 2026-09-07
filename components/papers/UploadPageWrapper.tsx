'use client';

import { useLayoutEffect, useRef } from 'react';

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
      // These negative margins must exactly cancel AppShell's <main> padding
      // (px-5 sm:px-7 py-8) so the cream background bleeds fully to the
      // edges of the shell with no white showing around it.
      className="relative overflow-hidden flex flex-col -mx-5 sm:-mx-7 -my-8 bg-[#DDD4B8]"
      style={{
        // Sensible fallback before JS measures the exact value
        minHeight: 'calc(100dvh - 3.5rem)',
      }}
    >
      {children}
    </div>
  );
}
