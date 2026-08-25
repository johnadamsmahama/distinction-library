import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-navy-mid border-t border-gold/10 py-10 px-7">
      <div className="max-w-content mx-auto">
        <div className="max-w-[420px] mx-auto">
          <div
            className="relative border border-gold/60 rounded-none px-4 pt-6 pb-4"
            style={{
              backgroundImage:
                'repeating-linear-gradient(180deg, transparent 0 27px, rgba(212,175,55,0.08) 27px 28px)',
            }}
          >
            <span
              className="absolute -top-[9px] left-3.5 bg-navy-mid px-2 text-[10px] tracking-[0.08em] text-gold"
              style={{ fontFamily: 'var(--font-courier-prime), monospace' }}
            >
              CAT. NO. DL-2026-UPSA
            </span>

            <div className="font-condensed font-bold text-[17px] mb-1.5">
              <span className="text-white">Distinction</span>{' '}
              <span className="text-gold">Library</span>
            </div>
            <p className="font-body text-xs text-white/60 mb-4 max-w-[300px]">
              A single, organised, academic resource platform for UPSA students.
            </p>

            <div
              className="text-[12px] text-white/80"
              style={{ fontFamily: 'var(--font-courier-prime), monospace' }}
            >
              <div className="flex items-baseline gap-1.5 py-[5.5px]">
                <Link href="/legal/privacy" className="hover:text-white transition-colors">
                  Privacy policy
                </Link>
                <span className="flex-1 border-b border-dotted border-white/25 -translate-y-[3px]" />
              </div>
              <div className="flex items-baseline gap-1.5 py-[5.5px]">
                <Link href="/legal/terms" className="hover:text-white transition-colors">
                  Terms of use
                </Link>
                <span className="flex-1 border-b border-dotted border-white/25 -translate-y-[3px]" />
              </div>
              <div className="flex items-baseline gap-1.5 py-[5.5px]">
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact and support
                </Link>
                <span className="flex-1 border-b border-dotted border-white/25 -translate-y-[3px]" />
              </div>
            </div>
          </div>

          <div
            className="text-center mt-4 text-[10px] text-white/50"
            style={{ fontFamily: 'var(--font-courier-prime), monospace' }}
          >
            J.A. Mahama Initiative · Distinction Programme · UPSA · 2026
            <br className="hidden sm:block" />
            <span className="sm:ml-1">© 2026 Distinction Library. All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
