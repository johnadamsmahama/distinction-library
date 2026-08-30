import Link from 'next/link';

const WHATSAPP_URL = 'https://chat.whatsapp.com/IbMtGP4aNvY6QGPDUQQDvV?s=cl&p=a&ilr=0&amv=1';
const CLASSROOM_URL = 'https://classroom.google.com/c/ODU4NjYwODEwMDYw?cjc=h4sud6b4';

const GRAIN = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.35'/%3E%3C/svg%3E\")";

function DataIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="2" width="16" height="20" rx="3" />
      <path d="M8 6h8M8 10h8M8 14h4" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <rect x="5" y="11" width="14" height="9" rx="1.5" />
      <path d="M8 11V8a4 4 0 018 0v3" />
    </svg>
  );
}

function ChatWatermark() {
  return (
    <svg width="130" height="130" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1">
      <path d="M21 11.5a8.5 8.5 0 01-12.2 7.6L3 20l1.1-5.5A8.5 8.5 0 1121 11.5z" />
    </svg>
  );
}

function LinkWatermark() {
  return (
    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.1">
      <path d="M9 15l6-6M10.5 6.5l1-1a4 4 0 015.7 5.7l-1.2 1.2M13.5 17.5l-1 1a4 4 0 01-5.7-5.7l1.2-1.2" />
    </svg>
  );
}

function ClassroomIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
      <rect x="3" y="4" width="18" height="12" rx="1.5" />
      <path d="M9 20h6M12 16v4" />
      <path d="M8 10.5l2.3 2 4.2-4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.2h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2z" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export default function CommunityAndToolsSection() {
  return (
    <div className="space-y-4">

      {/* Buy Data — gold family, desaturated + locked, still linked to /buy-data */}
      <Link
        href="/buy-data"
        className="relative overflow-hidden rounded-none p-[22px] text-navy-deep block hover:opacity-95 transition-opacity saturate-[.75]"
        style={{
          backgroundImage: `linear-gradient(135deg, #E2BE5A 0%, #C9A02C 60%, #A8801F 100%)`,
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,.06) 0 10px, transparent 10px 20px)',
          }}
        />
        <svg
          className="absolute -right-2 -bottom-[30px] w-[100px] h-[100px] opacity-[0.14] pointer-events-none"
          viewBox="0 0 24 24" fill="none" stroke="#060F1E" strokeWidth="1.2"
        >
          <rect x="4" y="2" width="16" height="20" rx="3" />
          <path d="M8 6h8M8 10h8M8 14h4" />
        </svg>
        <div className="relative z-10">
          <div className="w-11 h-11 rounded-none bg-navy-deep/15 flex items-center justify-center mb-3.5">
            <DataIcon />
          </div>
          <div className="font-condensed font-bold text-[10.5px] uppercase tracking-wide text-navy-deep/60 mb-0.5">
            Affordable mobile data
          </div>
          <h3 className="font-display font-bold text-lg text-navy-deep">Buy Data</h3>
          <div className="font-condensed font-bold text-[9.5px] uppercase tracking-wide text-navy-deep bg-navy-deep/16 rounded-none px-2.5 py-1 mt-2.5 inline-flex items-center gap-1.5 w-fit">
            <LockIcon />
            Coming soon
          </div>
        </div>
      </Link>

      {/* Community & Tools — original diagonal duotone, grain + watermarks added */}
      <div
        className="relative overflow-hidden rounded-none text-white"
        style={{
          backgroundImage: `linear-gradient(115deg, #060F1E 0%, #0D2B5E 42%, #8A6A22 78%, #C9A02C 100%)`,
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{ backgroundImage: GRAIN, mixBlendMode: 'overlay' }}
        />
        <div className="absolute -right-[18px] -top-5 opacity-[0.09] pointer-events-none">
          <ChatWatermark />
        </div>
        <div className="absolute -left-3 -bottom-3.5 opacity-[0.09] pointer-events-none">
          <LinkWatermark />
        </div>

        <div className="relative z-10 px-5 pt-5 pb-1.5">
          <div className="font-condensed font-bold text-[10.5px] uppercase tracking-wide text-gold-light mb-0.5">
            Stay connected
          </div>
          <h3 className="font-display font-bold text-lg mb-3.5">Community &amp; Tools</h3>

          <a
            href={CLASSROOM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3.5 py-3.5 border-t border-white/20 hover:bg-white/5 -mx-5 px-5 transition-colors"
          >
            <div className="w-10 h-10 rounded-none bg-white/14 flex items-center justify-center flex-shrink-0">
              <ClassroomIcon />
            </div>
            <div className="flex-1 min-w-0">
              <b className="block font-condensed font-bold text-[14.5px]">Join our Google Classroom</b>
              <span className="block text-[11.5px] text-white/75 mt-0.5">Free online classes</span>
            </div>
            <div className="w-7 h-7 rounded-none bg-white/14 flex items-center justify-center flex-shrink-0">
              <ArrowIcon />
            </div>
          </a>

          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3.5 py-3.5 border-t border-white/20 hover:bg-white/5 -mx-5 px-5 transition-colors"
          >
            <div className="w-10 h-10 rounded-none bg-white/14 flex items-center justify-center flex-shrink-0">
              <WhatsAppIcon />
            </div>
            <div className="flex-1 min-w-0">
              <b className="block font-condensed font-bold text-[14.5px]">Join WhatsApp</b>
              <span className="block text-[11.5px] text-white/75 mt-0.5">Tutorials &amp; campus updates</span>
            </div>
            <div className="w-7 h-7 rounded-none bg-white/14 flex items-center justify-center flex-shrink-0">
              <ArrowIcon />
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
