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

export default function UserManager({ users: initialUsers }: { users: UserRow[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

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

  const term = search.trim().toLowerCase();
  const filtered = users.filter(
    (u) =>
      !term ||
      u.student_id.includes(term) ||
      (u.full_name ?? '').toLowerCase().includes(term)
  );

  return (
    <div>
      <input
        type="text"
        placeholder="Search by student ID or name…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-3 mb-4 rounded-lg border border-g100 font-body text-sm outline-none focus:border-gold"
      />

      <div className="bg-white border border-g100 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-off-white">
            <tr>
              {['Student', 'Department', 'Uploads', 'Strikes', 'Role'].map((h) => (
                <th key={h} className="font-condensed font-bold text-[10px] uppercase tracking-wide text-g600 px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-t border-g100">
                <td className="px-4 py-3">
                  <div className="font-condensed font-semibold text-sm text-g800">{u.full_name ?? '—'}</div>
                  <div className="font-body text-xs text-g600">{u.student_id}</div>
                </td>
                <td className="px-4 py-3 font-body text-sm text-g600">{u.department ?? '—'}</td>
                <td className="px-4 py-3 font-body text-sm text-g600">{u.upload_count}</td>
                <td className="px-4 py-3 font-body text-sm text-g600">{u.strikes_count}/3</td>
                <td className="px-4 py-3">
                  <select
                    value={u.role}
                    disabled={busyId === u.id}
                    onChange={(e) => changeRole(u.id, e.target.value)}
                    className="font-condensed font-semibold text-xs px-2.5 py-1.5 rounded-lg border border-g100 outline-none focus:border-gold"
                  >
                    <option value="student">Student</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="font-body text-sm text-g600 text-center py-8">No matching students.</p>
        )}
      </div>
    </div>
  );
}
