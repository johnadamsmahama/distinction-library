'use client';

import { useState, type ReactNode } from 'react';

// Collapsible "New quiz" box. The builder stays mounted while collapsed so nothing typed is lost.
export default function NewQuizPanel({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-[#FFFCF4] border-[1.5px] border-dashed border-gold mb-4">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="w-full flex items-center gap-3 px-3.5 py-3 text-left">
        <span className="w-[34px] h-[34px] bg-navy text-gold-light grid place-items-center text-[22px] leading-none flex-none" aria-hidden="true">
          {open ? '–' : '+'}
        </span>
        <span className="min-w-0">
          <b className="block font-display font-bold text-[16px] text-navy">New quiz</b>
          <small className="text-[12px] text-[#7A6F52]">Upload a Word or PDF, or paste the questions</small>
        </span>
      </button>
      <div className={open ? 'px-3.5 pb-4' : 'hidden'}>{children}</div>
    </div>
  );
}
