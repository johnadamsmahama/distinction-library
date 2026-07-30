import Link from 'next/link';

const WHATSAPP_URL = 'https://chat.whatsapp.com/IbMtGP4aNvY6QGPDUQQDvV?s=cl&p=a&ilr=0&amv=1';
const CLASSROOM_URL = 'https://classroom.google.com/c/ODU4NjYwODEwMDYw?cjc=imbrocnu';

// Sits between ProfileCard and BookmarkedCourses ("Your courses") on the
// dashboard. Plain bordered-rectangle style approved from the prototype —
// deliberately simpler/thicker-bordered than the g100-bordered cards
// elsewhere on the dashboard.
export default function CommunityAndToolsSection() {
  return (
    <div className="space-y-4">
      {/* Google Classroom (left) / WhatsApp (right) */}
      <div className="grid grid-cols-2 bg-white border-[1.5px] border-g800 rounded-[18px] overflow-hidden">
        <a
          href={CLASSROOM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center text-center px-3 py-6 border-r-[1.5px] border-g800 hover:bg-off-white transition-colors"
        >
          <span className="font-display font-bold text-[17px] text-navy">Google Classroom</span>
        </a>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center text-center px-3 py-6 hover:bg-off-white transition-colors"
        >
          <span className="font-display font-bold text-[17px] text-navy">WhatsApp</span>
        </a>
      </div>

      {/* Buy Data — feasibility study in progress, placeholder only */}
      <div className="flex items-center justify-between gap-4 flex-wrap bg-white border-[1.5px] border-g800 rounded-[18px] px-5 py-5">
        <div>
          <div className="font-display font-bold text-lg text-navy">Buy Data</div>
          <div className="font-condensed font-semibold text-[11px] uppercase tracking-wide text-g600 mt-0.5">
            Affordable mobile data
          </div>
        </div>
        <span className="font-condensed font-bold text-[10.5px] uppercase tracking-wide text-gold border-[1.5px] border-gold rounded-full px-3 py-1.5 whitespace-nowrap">
          Coming soon
        </span>
      </div>

      {/* Leaderboard */}
      <Link
        href="/leaderboard"
        className="flex items-center justify-end bg-white border-[1.5px] border-g800 rounded-[18px] px-5 py-5 hover:bg-off-white transition-colors"
      >
        <span className="font-display font-bold text-lg text-navy">Leaderboard</span>
      </Link>
    </div>
  );
}
