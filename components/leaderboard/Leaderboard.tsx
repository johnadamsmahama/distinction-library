'use client';

import { useState } from 'react';

const TIER_STYLE = [
  { avatarBg: 'bg-gradient-to-br from-gold-light to-gold', avatarText: 'text-navy-deep', barBg: 'bg-gradient-to-b from-gold-light to-gold', barH: 'h-16', size: 'w-16 h-16 text-2xl' },
  { avatarBg: 'bg-gradient-to-br from-gray-200 to-gray-400', avatarText: 'text-navy-deep', barBg: 'bg-gradient-to-b from-gray-200 to-gray-400', barH: 'h-11', size: 'w-[52px] h-[52px] text-lg' },
  { avatarBg: 'bg-gradient-to-br from-amber-400 to-amber-700', avatarText: 'text-white', barBg: 'bg-gradient-to-b from-amber-400 to-amber-700', barH: 'h-8', size: 'w-[52px] h-[52px] text-lg' },
];

type LeaderboardRow = {
  id: string;
  full_name: string | null;
  student_id: string;
  department: string | null;
  level: string | null;
  upload_count: number;
  tier: string | null;
};

function initial(row: LeaderboardRow) {
  return (row.full_name ?? row.student_id ?? 'S').trim().charAt(0).toUpperCase();
}

function displayName(row: LeaderboardRow) {
  return row.full_name ?? `Student ${row.student_id}`;
}

function EmptyPodium({ message }: { message: string }) {
  return (
    <div className="text-center py-4">
      <div className="flex items-end justify-center gap-2.5 mb-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col items-center">
            <div className={`rounded-none border-2 border-dashed border-g100 flex items-center justify-center mb-2 ${i === 1 ? 'w-14 h-14' : 'w-11 h-11'}`}>
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-[18px] h-[18px] stroke-g200">
                <path d="M20 21a8 8 0 1 0-16 0" />
                <circle cx="12" cy="8" r="4" />
              </svg>
            </div>
            <div className={`w-[52px] rounded-none bg-off border border-dashed border-g100 border-b-0 ${i === 0 ? 'h-8' : i === 1 ? 'h-13' : 'h-6'}`} />
          </div>
        ))}
      </div>
      <p className="font-display font-semibold text-base text-navy mb-1.5">The podium is empty</p>
      <p className="font-body text-[13px] text-g600 max-w-[260px] mx-auto leading-relaxed">{message}</p>
    </div>
  );
}

function Podium({ top3, currentUserId }: { top3: LeaderboardRow[]; currentUserId: string }) {
  // Render order left-to-right is 2nd, 1st, 3rd, matching physical podium proportions.
  const order = [top3[1], top3[0], top3[2]];
  const styleFor = [1, 0, 2];

  return (
    <div className="flex items-end justify-center gap-2.5 mb-6">
      {order.map((row, idx) =>
        row ? (
          <div key={row.id} className="flex flex-col items-center flex-1 max-w-[110px]">
            <div className={`relative rounded-none flex items-center justify-center font-display font-bold mb-2 shadow-md ${TIER_STYLE[styleFor[idx]].avatarBg} ${TIER_STYLE[styleFor[idx]].avatarText} ${TIER_STYLE[styleFor[idx]].size} ${row.id === currentUserId ? 'ring-2 ring-gold ring-offset-2 ring-offset-off' : ''}`}>
              {initial(row)}
              <span className="absolute -bottom-1.5 -right-1 w-5 h-5 rounded-none bg-navy text-gold-light text-[10px] font-condensed font-extrabold flex items-center justify-center border-2 border-off">
                {styleFor[idx] + 1}
              </span>
            </div>
            <div className="font-condensed font-bold text-xs text-navy text-center leading-tight truncate w-full">
              {displayName(row)} {row.id === currentUserId && <span className="text-gold">(You)</span>}
            </div>
            <div className="font-condensed text-[11px] text-g600 mt-0.5">{row.upload_count} papers</div>
            <div className={`w-full rounded-none mt-2.5 ${TIER_STYLE[styleFor[idx]].barBg} ${TIER_STYLE[styleFor[idx]].barH}`} />
            <div className="font-display font-extrabold text-xl text-navy-deep/70 pt-2">{styleFor[idx] + 1}</div>
          </div>
        ) : (
          <div key={idx} className="flex-1 max-w-[110px]" />
        )
      )}
    </div>
  );
}

function RowList({ rows, currentUserId, startRank }: { rows: LeaderboardRow[]; currentUserId: string; startRank: number }) {
  return (
    <div className="bg-white border border-g100 rounded-none overflow-hidden">
      {rows.map((row, i) => {
        const isMe = row.id === currentUserId;
        return (
          <div
            key={row.id}
            className={`relative flex items-center gap-3 px-4 py-3.5 ${i !== 0 ? 'border-t border-g100' : ''} ${isMe ? 'bg-gold/5' : 'bg-white'}`}
          >
            {isMe && <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-gold" />}
            <span className="font-display font-bold text-[15px] text-g600 w-6 text-center flex-shrink-0">
              {startRank + i}
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-condensed font-semibold text-sm text-navy truncate">
                {displayName(row)} {isMe && <span className="text-gold">(You)</span>}
              </div>
              <div className="font-body text-xs text-g600 truncate">
                {row.department ?? 'Department not set'}{row.level ? ` · Level ${row.level}` : ''}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="font-display font-bold text-[15px] text-navy">{row.upload_count}</div>
              <div className="font-condensed text-[9.5px] uppercase tracking-wide text-g600">papers</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Board({ rows, currentUserId, emptyMessage }: { rows: LeaderboardRow[]; currentUserId: string; emptyMessage: string }) {
  const active = rows.filter((r) => r.upload_count > 0);

  if (active.length === 0) {
    return <EmptyPodium message={emptyMessage} />;
  }

  if (active.length < 3) {
    return <RowList rows={active} currentUserId={currentUserId} startRank={1} />;
  }

  const top3 = active.slice(0, 3);
  const rest = active.slice(3);

  return (
    <div>
      <Podium top3={top3} currentUserId={currentUserId} />
      {rest.length > 0 && <RowList rows={rest} currentUserId={currentUserId} startRank={4} />}
    </div>
  );
}

export default function Leaderboard({
  semesterRows,
  allTimeRows,
  currentUserId,
  periodLabel,
}: {
  semesterRows: LeaderboardRow[];
  allTimeRows: LeaderboardRow[];
  currentUserId: string;
  periodLabel: string | null;
}) {
  const [tab, setTab] = useState<'semester' | 'all-time'>('semester');

  return (
    <div>
      <div className="flex items-center gap-2 mb-6 border-b border-g100">
        <button
          onClick={() => setTab('semester')}
          className={`font-condensed font-semibold text-sm px-4 py-2.5 border-b-2 transition-colors ${
            tab === 'semester' ? 'border-gold text-navy' : 'border-transparent text-g600'
          }`}
        >
          {periodLabel ?? 'This Semester'}
        </button>
        <button
          onClick={() => setTab('all-time')}
          className={`font-condensed font-semibold text-sm px-4 py-2.5 border-b-2 transition-colors ${
            tab === 'all-time' ? 'border-gold text-navy' : 'border-transparent text-g600'
          }`}
        >
          All-Time
        </button>
      </div>

      {tab === 'semester' ? (
        <Board
          rows={semesterRows}
          currentUserId={currentUserId}
          emptyMessage="No approved contributions yet this semester — upload a past paper or study material to claim the first spot."
        />
      ) : (
        <Board
          rows={allTimeRows}
          currentUserId={currentUserId}
          emptyMessage="No approved contributions yet — upload a past paper or study material to claim the first spot."
        />
      )}
    </div>
  );
}
