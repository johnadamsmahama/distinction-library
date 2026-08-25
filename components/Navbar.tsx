'use client';

import { useState } from 'react';

const LINKS = [
  { href: '/about', label: 'About' },
  { href: '#features', label: 'Features' },
  { href: '#how', label: 'How It Works' },
  { href: '#founders-note', label: "Founder's Note" },
  { href: '#faq', label: 'FAQ' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-[100] h-[60px] bg-navy-deep border-b border-gold/10">
        <div className="max-w-content mx-auto h-full px-7 flex items-center justify-between">
          <a href="#" className="flex items-center gap-[9px]">
            <div className="w-[30px] h-[30px] bg-gold rounded-none flex items-center justify-center font-display font-black text-[15px] text-navy">
              D
            </div>
            <div className="font-condensed font-bold text-[17px]">
              <span className="text-white">Distinction</span>{' '}
              <span className="text-gold">Library</span>
            </div>
          </a>

          <div className="hidden md:flex items-center gap-7">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="font-condensed font-semibold text-xs uppercase tracking-wider text-white/50 hover:text-white transition-colors"
              >
                {l.label}
              </a>
            ))}
            <a
              href="/signup"
              className="bg-gold text-navy font-condensed font-bold text-xs uppercase tracking-wide px-[18px] py-2 rounded-none hover:bg-gold-light transition-colors"
            >
              Get Started Free
            </a>
          </div>

          <button
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="md:hidden w-[38px] h-[38px] flex flex-col items-center justify-center gap-[5px]"
          >
            <span
              className={`block w-5 h-[2px] bg-white rounded transition-transform ${
                open ? 'translate-y-[7px] rotate-45' : ''
              }`}
            />
            <span className={`block w-5 h-[2px] bg-white rounded transition-opacity ${open ? 'opacity-0' : ''}`} />
            <span
              className={`block w-5 h-[2px] bg-white rounded transition-transform ${
                open ? '-translate-y-[7px] -rotate-45' : ''
              }`}
            />
          </button>
        </div>
      </nav>

      <div
        className={`fixed top-[60px] left-0 right-0 z-[99] bg-navy-deep overflow-hidden transition-[max-height] duration-300 ${
          open ? 'max-h-[320px]' : 'max-h-0'
        }`}
      >
        <ul className="px-7 pb-5 pt-2">
          {[...LINKS, { href: '/signup', label: 'Get Started Free' }].map((l) => (
            <li key={l.href} className="border-t border-white/10">
              <a
                href={l.href}
                onClick={() => setOpen(false)}
                className="block py-[14px] font-condensed font-semibold text-sm uppercase tracking-wider text-white/75"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
