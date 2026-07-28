import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-navy-mid border-t border-gold/10 py-10 px-7">
      <div className="max-w-content mx-auto">
        <div className="flex flex-wrap justify-between gap-10 mb-8">
          <div className="text-center sm:text-left">
            <div className="font-condensed font-bold text-[15px] mb-3">
              <span className="text-white">Distinction</span> <span className="text-gold">Library</span>
            </div>
            <p className="font-body text-xs text-white/70 max-w-[260px] mx-auto sm:mx-0">
              A single, organised, academic resource platform for UPSA students.
            </p>
          </div>

          <div>
            <div className="font-condensed font-bold text-xs uppercase tracking-wide text-gold mb-3">
              Legal
            </div>
            <div className="flex flex-col gap-2">
              <Link href="/legal/privacy" className="font-condensed text-[13px] text-white/70 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/legal/terms" className="font-condensed text-[13px] text-white/70 hover:text-white transition-colors">
                Terms of Use
              </Link>
            </div>
          </div>

          <div>
            <div className="font-condensed font-bold text-xs uppercase tracking-wide text-gold mb-3">
              Contact
            </div>
            <div className="flex flex-col gap-2 font-condensed text-[13px] text-white/70">
              <span>Call/WhatsApp: +233 24 811 1310</span>
              <Link href="/support" className="hover:text-white transition-colors">
                Contact &amp; Support
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-5 text-center">
          <div className="font-condensed text-[11.5px] text-white/60">
            J.A. Mahama Initiative · Distinction Programme · UPSA · 2026
          </div>
          <div className="font-condensed text-[11.5px] text-white/60 mt-1.5">
            © 2026 Distinction Library. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
