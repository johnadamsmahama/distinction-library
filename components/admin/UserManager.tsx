'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type UserRow = {
  id: string;
  student_id: string;
  full_name: string | null;
  department: string | null;
  role: 'student' | 'moderator' | 'admin';
  upload_count: number;
  strikes_count: number;
};

// Same four rotating tints as the homepage feature carousel (components/Features.tsx)
// — cream, mint, dusty blue, blush — reused here so the admin panel and the
// public site read as the same brand rather than two different color systems.
const TINTS = [
  { bg: '#FBF3E1', border: '#EBDDB8', text: '#7A6A4A' }, // cream
  { bg: '#E9F2EA', border: '#C9DECB', text: '#5A7A62' }, // mint
  { bg: '#E9EFF6', border: '#C7D5E6', text: '#4A6285' }, // dusty blue
  { bg: '#F6EBEA', border: '#E3C9C6', text: '#8A5A56' }, // blush
];

export default function UserManager({ users: initialUsers }: { users: UserRow[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const changeRole = async (id: string, role: string) => {
    setBusyId(id);
    const supabase = createClient();
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
    setBusyId(null);
    if (error) {
      alert(error.message);
      return;
    }
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: role as UserRow['role'] } : u)));
  };

  const deleteAccount = async (u: UserRow) => {
    const confirmed = window.confirm(
      `This will permanently delete ${u.full_name ?? u.student_id}'s account and login.\n\n` +
        `Their uploads and reviews will stay live but be re-labeled as "Deleted User." Their bookmarks, notifications, and other personal data will be removed.\n\n` +
        `They will be able to sign up again later with the same email.\n\n` +
        `This cannot be undone. Continue?`
    );
    if (!confirmed) return;

    setDeletingId(u.id);
    try {
      const res = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: u.id }),
      });
      const result = await res.json();

      if (!res.ok) {
        alert(result.error ?? 'Failed to delete user account.');
        return;
      }

      setUsers((prev) => prev.filter((row) => row.id !== u.id));
    } catch (err: any) {
      alert(err.message ?? 'Failed to delete user account.');
    } finally {
      setDeletingId(null);
    }
  };

  const term = search.trim().toLowerCase();
  const filtered = users.filter(
    (u) =>
      !term ||
      u.student_id.includes(term) ||
      (u.full_name ?? '').toLowerCase().includes(term)
  );

  const initials = (name: string | null, studentId: string) => {
    if (!name) return studentId.slice(0, 2).toUpperCase();
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase();
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Search by student ID or name…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-3 mb-4 rounded-lg border border-g100 font-body text-sm outline-none focus:border-gold"
      />

      <div className="flex flex-col gap-2.5">
        {filtered.map((u, i) => {
          const tint = TINTS[i % TINTS.length];
          return (
            <div
              key={u.id}
              className="rounded p-3.5 flex gap-3 items-start border-l-[3px]"
              style={{ background: tint.bg, borderColor: tint.border, borderLeftColor: '#C9A02C' }}
            >
              <div className="w-10 h-10 rounded-md bg-navy flex items-center justify-center font-display text-sm text-off-white flex-shrink-0">
                {initials(u.full_name, u.student_id)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center gap-2">
                  <p className="font-condensed font-semibold text-sm text-navy truncate">{u.full_name ?? '—'}</p>
                  <button
                    onClick={() => deleteAccount(u)}
                    disabled={deletingId === u.id}
                    aria-label={`Delete ${u.full_name ?? u.student_id}'s account`}
                    className="flex-shrink-0 font-condensed font-bold text-[10px] uppercase text-red-700 disabled:opacity-50"
                  >
                    {deletingId === u.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
                <p className="font-body text-xs mt-0.5 mb-2" style={{ color: tint.text }}>
                  {u.student_id}
                  {u.department ? ` · ${u.department}` : ''}
                </p>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-body text-xs" style={{ color: tint.text }}>
                      {u.upload_count} upload{u.upload_count === 1 ? '' : 's'}
                    </span>
                    <div className="flex gap-[3px]" aria-label={`${u.strikes_count} of 3 strikes`}>
                      {[0, 1, 2].map((n) => (
                        <span
                          key={n}
                          className="w-4 h-1 rounded-sm"
                          style={{ background: n < u.strikes_count ? '#C0524A' : `${tint.text}33` }}
                        />
                      ))}
                    </div>
                  </div>

                  <select
                    value={u.role}
                    disabled={busyId === u.id}
                    onChange={(e) => changeRole(u.id, e.target.value)}
                    className="font-condensed font-semibold text-[11px] px-2 py-1 rounded-md border border-navy/15 bg-white/70 outline-none focus:border-gold"
                  >
                    <option value="student">Student</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <p className="font-body text-sm text-g600 text-center py-8">No matching students.</p>
        )}
      </div>
    </div>
  );
}
