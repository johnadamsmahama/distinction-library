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
      className="relative overflow-hidden flex flex-col -mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8 -mb-4 sm:-mb-6 lg:-mb-8 bg-[#DDD4B8]"
      style={{
        // Sensible fallback before JS measures the exact value
        minHeight: 'calc(100dvh - 3.5rem)',
      }}
    >
      {children}
    </div>
  );
}
