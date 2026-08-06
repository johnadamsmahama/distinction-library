import Link from 'next/link';

const BADGE_EMOJI: Record<string, string> = {
  gold: '🥇',
  silver: '🥈',
  bronze: '🥉',
};

const SEAL_STYLES: Record<string, string> = {
  gold: 'bg-[radial-gradient(circle_at_35%_30%,#DFBE5E,#C9A02C_70%)]',
  silver: 'bg-[radial-gradient(circle_at_35%_30%,#E4E7EC,#B7BEC9_70%)]',
  bronze: 'bg-[radial-gradient(circle_at_35%_30%,#D8A374,#B67447_70%)]',
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
    <Link href="/profile" className="block relative bg-white border-[1.5px] border-navy px-6 pt-8 pb-6">
      {/* double rule, top and bottom, like an official document border */}
      <div className="absolute left-1.5 right-1.5 top-1.5 h-px bg-navy" />
      <div className="absolute left-1.5 right-1.5 bottom-1.5 h-px bg-navy" />

      {/* wax seal */}
      {contributorBadge && (
        <div
          className={`absolute -top-4 right-5 w-[54px] h-[54px] rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(201,160,44,0.9),0_6px_14px_rgba(0,0,0,0.15)] flex items-center justify-center -rotate-[9deg] ${
            SEAL_STYLES[contributorBadge] ?? SEAL_STYLES.gold
          }`}
        >
          <span className="font-condensed font-bold text-[10px] text-navy-deep text-center leading-tight">
            {BADGE_EMOJI[contributorBadge] ?? ''}
            <br />
            {contributorBadge.toUpperCase()}
          </span>
        </div>
      )}

      <div className="font-condensed font-semibold text-[10.5px] uppercase tracking-widest text-g600 mb-1.5">
        Student Record
      </div>
      <div className="font-display font-bold text-2xl text-navy leading-tight">
        {fullName ?? 'Student'}
      </div>
      <div className="font-condensed text-xs text-g600 mt-1">
        {department ?? 'Department not set'}
        {level ? ` · Level ${level}` : ''}
      </div>

      <hr className="border-t border-g100 my-5" />

      <table className="w-full border-collapse">
        <tbody>
          <tr className="border-b border-dotted border-g100">
            <td className="py-2.5 font-body text-[12.5px] text-g600">Papers Uploaded</td>
            <td className="py-2.5 text-right font-display font-semibold text-[14.5px] text-navy">
              {uploadCount}
            </td>
          </tr>
          <tr className="border-b border-dotted border-g100">
            <td className="py-2.5 font-body text-[12.5px] text-g600">Leaderboard Rank</td>
            <td className="py-2.5 text-right font-display font-semibold text-[14.5px] text-navy">
              {leaderboardRank ? `#${leaderboardRank}` : '—'}
            </td>
          </tr>
          <tr className="border-b border-dotted border-g100">
            <td className="py-2.5 font-body text-[12.5px] text-g600">Strikes</td>
            <td className="py-2.5 text-right font-display font-semibold text-[14.5px] text-navy">
              {strikesCount} / 3
            </td>
          </tr>
          <tr>
            <td className="py-2.5 font-body text-[12.5px] text-g600">Upload Standing</td>
            <td
              className={`py-2.5 text-right font-body font-bold text-[12.5px] ${
                uploadSuspended ? 'text-red-600' : 'text-green-700'
              }`}
            >
              {uploadSuspended ? 'Suspended' : 'Good Standing'}
            </td>
          </tr>
        </tbody>
      </table>

      {uploadSuspended && (
        <p className="font-body text-xs text-red-600 mt-3">
          Upload privileges suspended after 3 strikes. Contact support to appeal.
        </p>
      )}
    </Link>
  );
}
