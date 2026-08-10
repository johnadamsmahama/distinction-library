'use client';

import { useState } from 'react';

type Row = {
  id: string;
  label: string;
  kind: 'Paper' | 'Material';
  status: string;
  rejection_reason: string | null;
  reviewed_at: string | null;
  courses: { code: string } | null;
  uploader: { full_name: string | null; student_id: string } | null;
  reviewer: { full_name: string | null } | null;
};

const STATUS_STYLES: Record<string, string> = {
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
  needs_revision: 'bg-amber-100 text-amber-700',
};

const STATUS_LABELS: Record<string, string> = {
  approved: 'approved',
  rejected: 'rejected',
  needs_revision: 'changes requested',
};

// The Moderation Log shows every reviewed item regardless of status —
// unlike the Moderation Queue, which only shows pending items. That makes
// this the right place for permanent deletion: it's the only view where an
// already-approved (and possibly already-live) duplicate or bad upload can
// actually be found and removed.
export default function ModerationLogList({ rows: initialRows }: { rows: Row[] }) {
  const [rows, setRows] = useState(initialRows);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; kind: 'Paper' | 'Material' } | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const deleteItem = async (row: Row) => {
    setBusyId(row.id);
    const res = await fetch(`/api/moderation/delete-item/${row.id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: row.kind === 'Paper' ? 'paper' : 'material',
        reason: deleteReason || undefined,
      }),
    });
    const result = await res.json().catch(() => ({}));
    setBusyId(null);

    if (!res.ok) {
      alert(result.error ?? 'Delete failed.');
      return;
    }

    setRows((prev) => prev.filter((r) => !(r.id === row.id && r.kind === row.kind)));
    setDeleteTarget(null);
    setDeleteReason('');
  };

  if (rows.length === 0) {
    return <p className="font-body text-sm text-g600 text-center py-16">No moderation decisions recorded yet.</p>;
  }

  return (
    <div className="space-y-2">
      {rows.map((r) => {
        const isDeleteOpen = deleteTarget?.id === r.id && deleteTarget.kind === r.kind;
        return (
          <div key={`${r.kind}-${r.id}`} className="bg-white border border-g100 rounded-lg px-4 py-3">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-condensed font-bold text-[10px] uppercase px-1.5 py-0.5 rounded bg-g100 text-navy">
                    {r.kind}
                  </span>
                  <span
                    className={`font-condensed font-bold text-[10px] uppercase px-1.5 py-0.5 rounded ${
                      STATUS_STYLES[r.status] ?? 'bg-g100 text-g600'
                    }`}
                  >
                    {STATUS_LABELS[r.status] ?? r.status}
                  </span>
                </div>
                <div className="font-condensed font-semibold text-sm text-g800">{r.label}</div>
                <div className="font-body text-xs text-g600 mt-0.5">
                  Uploaded by {r.uploader?.full_name ?? r.uploader?.student_id ?? 'unknown'} · Reviewed by{' '}
                  {r.reviewer?.full_name ?? 'unknown'}
                </div>
                {(r.status === 'rejected' || r.status === 'needs_revision') && r.rejection_reason && (
                  <div className="font-body text-xs text-red-600 mt-1">Reason: {r.rejection_reason}</div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <div className="font-condensed text-[11px] text-g600">
                  {r.reviewed_at ? new Date(r.reviewed_at).toLocaleString() : ''}
                </div>
                <button
                  onClick={() => setDeleteTarget(isDeleteOpen ? null : { id: r.id, kind: r.kind })}
                  className="font-condensed font-bold text-[10px] uppercase px-2.5 py-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>

            {isDeleteOpen && (
              <div className="mt-3 pt-3 border-t border-red-200">
                <p className="font-condensed font-bold text-xs uppercase text-red-600 mb-2">
                  This permanently deletes the item and its file
                  {r.status === 'approved' ? ' — including the live published copy' : ''}. This cannot be undone.
                </p>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Reason (optional, sent to the uploader)…"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-g100 font-body text-sm text-g800 outline-none focus:border-red-400 transition-colors mb-2"
                />
                <div className="flex gap-2">
                  <button
                    disabled={busyId === r.id}
                    onClick={() => deleteItem(r)}
                    className="font-condensed font-bold text-xs uppercase px-3.5 py-2 rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-60"
                  >
                    {busyId === r.id ? 'Deleting…' : 'Confirm delete'}
                  </button>
                  <button
                    onClick={() => {
                      setDeleteTarget(null);
                      setDeleteReason('');
                    }}
                    className="font-condensed font-bold text-xs uppercase px-3.5 py-2 rounded-lg border border-g100 text-g600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
