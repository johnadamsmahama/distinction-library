const BADGE_STYLES: Record<string, string> = {
  gold: 'bg-gold text-navy',
  silver: 'bg-gray-300 text-g800',
  bronze: 'bg-amber-700 text-white',
};

const BADGE_ICON: Record<string, string> = { gold: '🥇', silver: '🥈', bronze: '🥉' };

type LeaderboardRow = {
  id: string;
  full_name: string | null;
  student_id: string;
  department: string | null;
  level: string | null;
  upload_count: number;
  contributor_badge: string | null;
};

export default function Leaderboard({ rows, currentUserId }: { rows: LeaderboardRow[]; currentUserId: string }) {
  if (rows.length === 0 || rows.every((r) => r.upload_count === 0)) {
    return (
      <div className="text-center py-16">
        <p className="font-body text-sm text-g600">
          No approved contributions yet this semester — be the first on the board.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {rows.map((row, i) => {
        const isMe = row.id === currentUserId;
        return (
          <div
            key={row.id}
            className={`flex items-center justify-between rounded-xl px-4 py-3.5 border ${
              isMe ? 'border-gold bg-gold/5' : 'border-g100 bg-white'
            }`}
          >
            <div className="flex items-center gap-4 min-w-0">
              <span className="font-display font-bold text-lg text-navy w-7 text-center flex-shrink-0">
                {i + 1}
              </span>
              <div className="min-w-0">
                <div className="font-condensed font-semibold text-sm text-g800 truncate">
                  {row.full_name ?? `Student ${row.student_id}`} {isMe && <span className="text-gold">(You)</span>}
                </div>
                <div className="font-body text-xs text-g600 truncate">
                  {row.department ?? 'Department not set'}{row.level ? ` · Level ${row.level}` : ''}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {row.contributor_badge && (
                <span
                  className={`font-condensed font-bold text-[10px] uppercase tracking-wide px-2.5 py-1 rounded-full ${BADGE_STYLES[row.contributor_badge]}`}
                >
                  {BADGE_ICON[row.contributor_badge]} {row.contributor_badge}
                </span>
              )}
              <span className="font-display font-bold text-lg text-gold">{row.upload_count}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
