import Link from 'next/link';

const WHATSAPP_URL = 'https://chat.whatsapp.com/IbMtGP4aNvY6QGPDUQQDvV?s=cl&p=a&ilr=0&amv=1';
const CLASSROOM_URL = 'https://classroom.google.com/c/ODU4NjYwODEwMDYw?cjc=h4sud6b4';

function SignalBarsIcon() {
  return (
    <svg width="52" height="40" viewBox="0 0 52 40" fill="none" className="flex-shrink-0">
      <rect x="2" y="24" width="8" height="14" rx="1.5" fill="#F6F1E3" opacity="0.55" />
      <rect x="15" y="17" width="8" height="21" rx="1.5" fill="#F6F1E3" opacity="0.7" />
      <rect x="28" y="9" width="8" height="29" rx="1.5" fill="#F6F1E3" opacity="0.85" />
      <rect x="41" y="2" width="8" height="36" rx="1.5" fill="#F6F1E3" />
    </svg>
  );
}

function ClassroomIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <rect x="3" y="4" width="18" height="12" rx="1.5" />
      <path d="M9 20h6M12 16v4" />
      <path d="M8 10.5l2.3 2 4.2-4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.2h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2z" />
    </svg>
  );
}

export default function CommunityAndToolsSection() {
  return (
    <div className="space-y-4">

      {/* Buy Data — live, teal "zine" panel */}
      <Link
        href="/buy-data"
        className="relative overflow-hidden rounded-none px-[22px] pt-[29px] pb-[27px] text-left block hover:opacity-95 transition-opacity"
        style={{ backgroundColor: '#2F5A6B', boxShadow: '0 12px 26px rgba(18,51,61,0.35)' }}
      >
        <div className="relative z-10">
          <div className="font-[family-name:var(--font-courier-prime)] font-bold text-[10px] tracking-[.12em] uppercase text-[#F6F1E3]/85 mb-2">
            Affordable mobile data
          </div>

          <div className="flex items-center justify-between gap-2.5">
            <h3
              className="font-display font-black text-[30px] leading-[0.95] text-[#F6F1E3] m-0"
              style={{ WebkitTextStroke: '1.2px #12333D' }}
            >
              BUY DATA
            </h3>
            <SignalBarsIcon />
          </div>

          <div className="inline-flex items-center gap-1.5 bg-[#F6F1E3] text-[#12333D] px-[11px] py-[5px] mt-3.5 font-[family-name:var(--font-courier-prime)] font-bold text-[9px] uppercase tracking-wide w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4E9C7C]" />
            Live now, tap to buy
          </div>
        </div>
      </Link>

      {/* Community & Tools — scrapbook collage (replaces the old diagonal duotone panel) */}
      <div>
        <div className="font-[family-name:var(--font-courier-prime)] font-bold text-[10px] tracking-[.1em] uppercase text-[#2F5A6B] mb-1.5">
          Stay connected
        </div>
        <h3 className="font-display font-black text-[30px] leading-[1.0] text-navy-deep mb-[30px]">
          Community &amp; Tools
        </h3>

        <div className="relative h-[180px]">
          <a
            href={CLASSROOM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-0 left-0 z-[2] w-[62%] bg-[#F6F1E3] p-4 block"
            style={{ transform: 'rotate(-7deg)', boxShadow: '0 8px 16px rgba(23,35,63,0.28)' }}
          >
            <span
              className="absolute -top-2 left-[18px] w-[46px] h-[18px] block"
              style={{
                backgroundColor: 'rgba(143,193,203,0.65)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                transform: 'rotate(-8deg)',
              }}
            />
            <div className="flex items-center gap-2.5">
              <div className="w-[34px] h-[34px] flex-shrink-0 flex items-center justify-center bg-[#12333D] text-[#8FC1CB]">
                <ClassroomIcon />
              </div>
              <div>
                <b className="block font-condensed font-bold text-[14.5px] text-navy-deep">Join our Google Classroom</b>
                <span className="block font-[family-name:var(--font-courier-prime)] text-[8.5px] text-g600">Free online classes</span>
              </div>
            </div>
          </a>

          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-[66px] right-0 z-[3] w-[62%] bg-[#F6F1E3] p-4 block"
            style={{ transform: 'rotate(6deg)', boxShadow: '0 8px 16px rgba(23,35,63,0.28)' }}
          >
            <span
              className="absolute -top-2 right-[18px] w-[46px] h-[18px] block"
              style={{
                backgroundColor: 'rgba(143,193,203,0.65)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                transform: 'rotate(6deg)',
              }}
            />
            <div className="flex items-center gap-2.5">
              <div className="w-[34px] h-[34px] flex-shrink-0 flex items-center justify-center bg-[#12333D] text-[#8FC1CB]">
                <WhatsAppIcon />
              </div>
              <div>
                <b className="block font-condensed font-bold text-[14.5px] text-navy-deep">Join WhatsApp</b>
                <span className="block font-[family-name:var(--font-courier-prime)] text-[8.5px] text-g600">Tutorials &amp; campus updates</span>
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
