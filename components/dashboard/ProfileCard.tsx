import Link from 'next/link';

const BADGE_COLORS: Record<string, string> = {
  gold: 'bg-gold text-navy',
  silver: 'bg-gray-300 text-g800',
  bronze: 'bg-amber-700 text-white',
};

export default function ProfileCard({
  fullName,
  department,
  level,
  uploadCount,
  strikesCount,
  uploadSuspended,
  contributorBadge,
  leaderboardRank,
}: {
  fullName: string | null;
  department: string | null;
  level: string | null;
  uploadCount: number;
  strikesCount: number;
  uploadSuspended: boolean;
  contributorBadge: string | null;
  leaderboardRank: number | null;
}) {
  return (
    <div className="bg-navy rounded-2xl p-6 text-white">
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="font-display font-bold text-lg">{fullName ?? 'Student'}</div>
            <Link
              href="/dashboard/profile/edit"
              className="font-condensed text-[10px] uppercase tracking-wide text-gold hover:text-gold-light transition-colors"
            >
              Edit
            </Link>
          </div>
          <div className="font-condensed text-[12px] text-white/70 mt-0.5">
            {department ?? 'Department not set'}
            {level ? ` · Level ${level}` : ''}
          </div>
        </div>
        {contributorBadge && (
          <span
            className={`font-condensed font-bold text-[10px] uppercase tracking-wide px-2.5 py-1 rounded-full ${BADGE_COLORS[contributorBadge]}`}
          >
            {contributorBadge}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5">
        <div>
          <div className="font-display font-bold text-2xl text-gold">{uploadCount}</div>
          <div className="font-condensed text-[10px] uppercase tracking-wide text-white/70">
            Papers uploaded
          </div>
        </div>
        <div>
          <div className="font-display font-bold text-2xl text-gold">
            {leaderboardRank ? `#${leaderboardRank}` : '—'}
          </div>
          <div className="font-condensed text-[10px] uppercase tracking-wide text-white/70">
            Leaderboard rank
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-condensed text-[10px] uppercase tracking-wide text-white/70">
            Upload standing
          </span>
          <span className="font-condensed text-[10px] text-white/70">{strikesCount}/3 strikes</span>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${
                i < strikesCount ? 'bg-red-400' : 'bg-white/10'
              }`}
            />
          ))}
        </div>
        {uploadSuspended && (
          <p className="font-body text-xs text-red-300 mt-2">
            Upload privileges suspended after 3 strikes. Contact support to appeal.
          </p>
        )}
      </div>
    </div>
  );
}
