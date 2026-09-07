'use client';

import { useLayoutEffect, useRef } from 'react';

export default function FullBleedShell({
  children,
  background = 'bg-navy',
}: {
  children: React.ReactNode;
  background?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const setHeight = () => {
      // Measure exactly how far from the viewport top this element starts,
      // then fill the rest — no navbar height guessing needed.
      const top = el.getBoundingClientRect().top;
      el.style.minHeight = `${window.innerHeight - top}px`;
    };
    setHeight();
    window.addEventListener('resize', setHeight);
    return () => window.removeEventListener('resize', setHeight);
  }, []);

  return (
    <div
      ref={ref}
      // These negative margins must exactly cancel AppShell's <main> padding
      // (px-5 sm:px-7 py-8) so the background bleeds fully to the edges of
      // the shell with no gap showing around it.
      className={`${background} -mx-5 sm:-mx-7 -my-8`}
      style={{ minHeight: 'calc(100dvh - 3.5rem)' }}
    >
      {children}
    </div>
  );
}
