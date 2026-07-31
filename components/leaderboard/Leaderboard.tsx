'use client';

import { useState } from 'react';

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
  tier: string | null;
};

function RowList({ rows, currentUserId, emptyMessage }: { rows: LeaderboardRow[]; currentUserId: string; emptyMessage: string }) {
  if (rows.length === 0 || rows.every((r) => r.upload_count === 0)) {
    return (
      <div className="text-center py-16">
        <p className="font-body text-sm text-g600">{emptyMessage}</p>
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
              {row.tier && (
                <span
                  className={`font-condensed font-bold text-[10px] uppercase tracking-wide px-2.5 py-1 rounded-full ${BADGE_STYLES[row.tier]}`}
                >
                  {BADGE_ICON[row.tier]} {row.tier}
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
      <div className="flex items-center gap-2 mb-5 border-b border-g100">
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
        <RowList
          rows={semesterRows}
          currentUserId={currentUserId}
          emptyMessage="No approved contributions yet this semester — be the first on the board."
        />
      ) : (
        <RowList
          rows={allTimeRows}
          currentUserId={currentUserId}
          emptyMessage="No approved contributions yet — be the first on the board."
        />
      )}
    </div>
  );
}
