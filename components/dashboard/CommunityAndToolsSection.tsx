import Link from 'next/link';

const WHATSAPP_URL = 'https://chat.whatsapp.com/IbMtGP4aNvY6QGPDUQQDvV?s=cl&p=a&ilr=0&amv=1';
const CLASSROOM_URL = 'https://classroom.google.com/c/ODU4NjYwODEwMDYw?cjc=imbrocnu';

const BADGE_STYLES: Record<string, string> = {
  gold: 'bg-gold text-navy',
  silver: 'bg-gray-300 text-g800',
  bronze: 'bg-amber-700 text-white',
};
const BADGE_ICON: Record<string, string> = { gold: '🥇', silver: '🥈', bronze: '🥉' };

// Sits between ProfileCard and BookmarkedCourses ("Your courses") on the
// dashboard. Plain bordered-rectangle style approved from the prototype —
// deliberately simpler/thicker-bordered than the g100-bordered cards
// elsewhere on the dashboard. The WhatsApp link here replaces the one that
// used to live inside ProfileCard's "Distinction Programme" panel — that
// panel has been removed so there's only one WhatsApp entry point.
export default function CommunityAndToolsSection({
  fullName,
  department,
  level,
  uploadCount,
  contributorBadge,
  leaderboardRank,
}: {
  fullName: string | null;
  department: string | null;
  level: string | null;
  uploadCount: number;
  contributorBadge: string | null;
  leaderboardRank: number | null;
}) {
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

      {/* Leaderboard — real rank-card preview, same visual language as the
          full /leaderboard page, styled inside our card container */}
      <Link
        href="/leaderboard"
        className="block bg-white border-[1.5px] border-g800 rounded-[18px] px-5 py-4 hover:bg-off-white transition-colors"
      >
        <div className="font-condensed font-bold text-[10px] uppercase tracking-wide text-g600 mb-2.5">
          Leaderboard
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <span className="font-display font-bold text-lg text-navy w-7 text-center flex-shrink-0">
              {leaderboardRank ? `#${leaderboardRank}` : '—'}
            </span>
            <div className="min-w-0">
              <div className="font-condensed font-semibold text-sm text-g800 truncate">
                {fullName ?? 'Student'} <span className="text-gold">(You)</span>
              </div>
              <div className="font-body text-xs text-g600 truncate">
                {department ?? 'Department not set'}
                {level ? ` · Level ${level}` : ''}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {contributorBadge && (
              <span
                className={`font-condensed font-bold text-[10px] uppercase tracking-wide px-2.5 py-1 rounded-full ${BADGE_STYLES[contributorBadge]}`}
              >
                {BADGE_ICON[contributorBadge]} {contributorBadge}
              </span>
            )}
            <span className="font-display font-bold text-lg text-gold">{uploadCount}</span>
          </div>
        </div>
      </Link>
    </div>
  );
}
