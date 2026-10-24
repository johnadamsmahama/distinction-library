'use client';

import { useLayoutEffect, useRef } from 'react';

/**
 * Colours a whole page edge to edge and makes it exactly as tall as the
 * space left under the top bar — never taller (which leaves a blank strip
 * to scroll into) and never shorter (which leaves white below).
 *
 * Use `background` for a Tailwind class, or `style` for gradients/colours.
 */
export default function FullBleedShell({
  children,
  background = 'bg-navy',
  style,
  afterBreadcrumb = false,
}: {
  children: React.ReactNode;
  background?: string;
  style?: React.CSSProperties;
  /** True on pages that still show the global Home / Library breadcrumb above
   *  them: the colour then starts just under the breadcrumb instead of covering it. */
  afterBreadcrumb?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const setHeight = () => {
      // Distance from the very top of the PAGE (not the screen), so it stays
      // correct even if the person has already scrolled or the address bar
      // has slid away.
      const top = el.getBoundingClientRect().top + window.scrollY;
      el.style.minHeight = `${Math.max(window.innerHeight - top, 0)}px`;
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
      className={`${background} bleed-x -mx-5 sm:-mx-7 ${afterBreadcrumb ? '-mt-4 -mb-8' : '-my-8'}`}
      // Fallback until the exact height is measured: the top bar is 64px + a 2px gold border.
      style={{ minHeight: 'calc(100dvh - 66px)', ...style }}
    >
      {children}
    </div>
  );
}
