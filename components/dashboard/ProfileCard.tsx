import Link from 'next/link';

const BADGE_EMOJI: Record<string, string> = {
  gold: '🥇',
  silver: '🥈',
  bronze: '🥉',
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
    <Link
      href="/dashboard/leaderboard"
      className="flex flex-col justify-center min-h-[150px] bg-gradient-to-br from-navy to-navy-deep rounded-[18px] p-5 text-white"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-display font-bold text-lg">
            {fullName ?? 'Student'}
          </div>
          <div className="font-condensed text-xs text-white/70 mt-0.5">
            {department ?? 'Department not set'}
            {level ? ` · Level ${level}` : ''}
          </div>
        </div>
        {contributorBadge && (
          <span className="font-condensed font-bold text-[10px] uppercase tracking-wide border-[1.5px] border-white/35 text-white px-[11px] py-[4.5px] rounded-full whitespace-nowrap">
            {BADGE_EMOJI[contributorBadge] ?? ''} {contributorBadge.charAt(0).toUpperCase() + contributorBadge.slice(1)}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <div className="font-display font-bold text-[22px] text-gold leading-none">{uploadCount}</div>
          <div className="font-condensed font-semibold text-[10.5px] uppercase tracking-wide text-white/65 mt-1">
            Papers uploaded
          </div>
        </div>
        <div>
          <div className="font-display font-bold text-[22px] text-gold leading-none">
            {leaderboardRank ? `#${leaderboardRank}` : '—'}
          </div>
          <div className="font-condensed font-semibold text-[10.5px] uppercase tracking-wide text-white/65 mt-1">
            Leaderboard rank
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-[6px]">
          <span className="font-condensed font-semibold text-[10.5px] uppercase tracking-wide text-white/65">
            Upload standing
          </span>
          <span className="font-condensed font-semibold text-[10.5px] uppercase tracking-wide text-white/65">
            {strikesCount}/3 strikes
          </span>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i < strikesCount ? 'bg-gold' : 'bg-white/10'}`}
            />
          ))}
        </div>
        {uploadSuspended && (
          <p className="font-body text-xs text-red-300 mt-2">
            Upload privileges suspended after 3 strikes. Contact support to appeal.
          </p>
        )}
      </div>
    </Link>
  );
}
