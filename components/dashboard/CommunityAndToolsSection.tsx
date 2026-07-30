const WHATSAPP_URL = 'https://chat.whatsapp.com/IbMtGP4aNvY6QGPDUQQDvV?s=cl&p=a&ilr=0&amv=1';
const CLASSROOM_URL = 'https://classroom.google.com/c/ODU4NjYwODEwMDYw?cjc=imbrocnu';

const GRAIN = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.35'/%3E%3C/svg%3E\")";

function DataIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#14213D" strokeWidth="2">
      <rect x="4" y="2" width="16" height="20" rx="3" />
      <path d="M8 6h8M8 10h8M8 14h4" />
    </svg>
  );
}

function ClassroomIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
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

      {/* Buy Data — gold-to-rust gradient, everything stacked left */}
      <div
        className="relative overflow-hidden rounded-[18px] p-[22px] text-navy"
        style={{
          backgroundImage: `linear-gradient(135deg, #F0C240 0%, #D4A017 45%, #7A3E1D 100%)`,
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none opacity-50"
          style={{ backgroundImage: GRAIN, mixBlendMode: 'overlay' }}
        />
        <svg
          className="absolute -right-2 -bottom-[30px] w-[100px] h-[100px] opacity-10 pointer-events-none"
          viewBox="0 0 24 24" fill="none" stroke="#14213D" strokeWidth="1.2"
        >
          <rect x="4" y="2" width="16" height="20" rx="3" />
          <path d="M8 6h8M8 10h8M8 14h4" />
        </svg>
        <div className="relative z-10">
          <div className="w-11 h-11 rounded-xl bg-navy/15 flex items-center justify-center mb-3.5">
            <DataIcon />
          </div>
          <div className="font-condensed font-bold text-[10.5px] uppercase tracking-wide text-[#7A3E1D] mb-0.5">
            Affordable mobile data
          </div>
          <h3 className="font-display font-bold text-lg text-navy">Buy Data</h3>
          <div className="font-condensed font-bold text-[11px] uppercase tracking-wide text-navy/65 mt-2">
            Coming soon
          </div>
        </div>
      </div>

      {/* Community & Tools — rust gradient, stacked rows */}
      <div
        className="relative overflow-hidden rounded-[18px] text-white"
        style={{
          backgroundImage: `radial-gradient(120% 140% at 15% 10%, #C97A45 0%, #A45A2A 55%, #7A3E1D 100%)`,
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none opacity-50"
          style={{ backgroundImage: GRAIN, mixBlendMode: 'overlay' }}
        />
        <svg
          className="absolute -right-3.5 -top-3.5 w-[120px] h-[120px] opacity-10 pointer-events-none"
          viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1"
        >
          <path d="M21 11.5a8.5 8.5 0 01-12.2 7.6L3 20l1.1-5.5A8.5 8.5 0 1121 11.5z" />
        </svg>

        <div className="relative z-10 px-5 pt-5 pb-1.5">
          <div className="font-condensed font-bold text-[10.5px] uppercase tracking-wide text-gold-light mb-0.5">
            Stay connected
          </div>
          <h3 className="font-display font-bold text-lg mb-3.5">Community &amp; Tools</h3>

          <a
            href={CLASSROOM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3.5 py-3.5 border-t border-white/15"
          >
            <div className="w-10 h-10 rounded-[11px] bg-white/14 flex items-center justify-center flex-shrink-0">
              <ClassroomIcon />
            </div>
            <div className="flex-1 min-w-0">
              <b className="block font-condensed font-bold text-[14.5px]">Open Classroom</b>
              <span className="block text-[11.5px] text-white/70 mt-0.5">Free online classes</span>
            </div>
            <div className="w-7 h-7 rounded-full bg-white/14 flex items-center justify-center flex-shrink-0">
              <ArrowIcon />
            </div>
          </a>

          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3.5 py-3.5 border-t border-white/15"
          >
            <div className="w-10 h-10 rounded-[11px] bg-white/14 flex items-center justify-center flex-shrink-0">
              <WhatsAppIcon />
            </div>
            <div className="flex-1 min-w-0">
              <b className="block font-condensed font-bold text-[14.5px]">Join WhatsApp</b>
              <span className="block text-[11.5px] text-white/70 mt-0.5">Tutorials &amp; campus updates</span>
            </div>
            <div className="w-7 h-7 rounded-full bg-white/14 flex items-center justify-center flex-shrink-0">
              <ArrowIcon />
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
