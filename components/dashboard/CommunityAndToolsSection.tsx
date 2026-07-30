const WHATSAPP_URL = 'https://chat.whatsapp.com/IbMtGP4aNvY6QGPDUQQDvV?s=cl&p=a&ilr=0&amv=1';
const CLASSROOM_URL = 'https://classroom.google.com/c/ODU4NjYwODEwMDYw?cjc=imbrocnu';

function ClassroomIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#0D2B5E" strokeWidth="2.2" className="w-3.5 h-3.5 flex-shrink-0">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="#0D2B5E" className="w-3.5 h-3.5 flex-shrink-0">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.2h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m0 1.67c2.2 0 4.26.86 5.82 2.42a8.2 8.2 0 0 1 2.41 5.82c0 4.54-3.7 8.24-8.24 8.24a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.17 8.17 0 0 1-1.25-4.38c0-4.54 3.7-8.24 8.24-8.24M8.53 6.7c-.17 0-.45.06-.68.32-.24.25-.9.88-.9 2.15s.92 2.5 1.05 2.67c.13.17 1.8 2.87 4.43 3.9 2.19.87 2.64.7 3.11.65.48-.04 1.54-.63 1.76-1.23s.22-1.13.15-1.24c-.07-.11-.24-.17-.5-.3s-1.55-.76-1.79-.85c-.24-.09-.41-.13-.59.13-.17.26-.67.85-.82 1.02-.15.17-.3.19-.56.06s-1.08-.4-2.06-1.27c-.76-.68-1.28-1.51-1.43-1.77-.15-.26-.02-.4.11-.53.12-.11.26-.3.39-.44.13-.15.17-.26.26-.43.09-.17.04-.32-.02-.45-.06-.13-.59-1.44-.81-1.97-.21-.51-.43-.44-.59-.45l-.5-.01Z" />
    </svg>
  );
}

export default function CommunityAndToolsSection() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3.5 flex-wrap bg-gradient-to-br from-navy to-navy-deep rounded-[18px] px-5 py-[22px]">
        <div>
          <div className="font-display font-bold text-[19px] text-white">Buy Data</div>
          <div className="font-condensed font-semibold text-[11px] uppercase tracking-wide text-gold mt-[3px]">
            Affordable mobile data
          </div>
        </div>
        <span className="font-condensed font-bold text-[10.5px] uppercase text-white border-[1.5px] border-white/35 rounded-full px-[13px] py-[5.5px] whitespace-nowrap">
          Coming soon
        </span>
      </div>

      <div className="grid grid-cols-2 min-h-[150px] bg-gradient-to-br from-navy to-navy-deep rounded-[18px] overflow-hidden">
        <div className="flex flex-col justify-center items-start text-left px-[18px] py-[22px] border-r border-white/15">
          <a
            href={CLASSROOM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gold text-navy font-condensed font-bold text-[11.5px] uppercase tracking-wide px-3.5 py-2 rounded-[10px] mb-3 hover:bg-gold-light transition-colors"
          >
            <ClassroomIcon />
            Open Classroom
          </a>
          <p className="font-body text-xs text-white/70 leading-relaxed">
            Join the Distinction Programme&apos;s Free Online Classes.
          </p>
        </div>
        <div className="flex flex-col justify-center items-end text-right px-[18px] py-[22px]">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-row-reverse items-center gap-2 bg-gold text-navy font-condensed font-bold text-[11.5px] uppercase tracking-wide px-3.5 py-2 rounded-[10px] mb-3 hover:bg-gold-light transition-colors"
          >
            <WhatsAppIcon />
            Join WhatsApp
          </a>
          <p className="font-body text-xs text-white/70 leading-relaxed">
            Join tutorials and revision sessions with Peer Tutors and real-time campus updates.
          </p>
        </div>
      </div>
    </div>
  );
}
