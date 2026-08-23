'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Ticket = {
  id: string;
  user_id: string | null;
  name: string;
  student_email: string;
  subject: string;
  message: string;
  resolved: boolean;
  created_at: string;
};

export default function SupportManager({ tickets: initialTickets }: { tickets: Ticket[] }) {
  const [tickets, setTickets] = useState(initialTickets);
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('open');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletedUserIds, setDeletedUserIds] = useState<Set<string>>(new Set());

  const toggleResolved = async (id: string, resolved: boolean) => {
    const supabase = createClient();
    const { error } = await supabase.from('support_tickets').update({ resolved }).eq('id', id);
    if (error) {
      alert(error.message);
      return;
    }
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, resolved } : t)));
  };

  const deleteUserAccount = async (ticket: Ticket) => {
    if (!ticket.user_id) return;

    const confirmed = window.confirm(
      `This will permanently delete ${ticket.name}'s (${ticket.student_email}) account and login.\n\n` +
        `Their uploads and reviews will stay live but be re-labeled as "Deleted User." Their bookmarks, notifications, and other personal data will be removed.\n\n` +
        `They will be able to sign up again later with the same email.\n\n` +
        `This cannot be undone. Continue?`
    );
    if (!confirmed) return;

    setDeletingId(ticket.id);
    try {
      const res = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: ticket.user_id, ticketId: ticket.id }),
      });
      const result = await res.json();

      if (!res.ok) {
        alert(result.error ?? 'Failed to delete user account.');
        return;
      }

      setDeletedUserIds((prev) => new Set(prev).add(ticket.user_id!));
      setTickets((prev) => prev.map((t) => (t.id === ticket.id ? { ...t, resolved: true } : t)));
    } catch (err: any) {
      alert(err.message ?? 'Failed to delete user account.');
    } finally {
      setDeletingId(null);
    }
  };

  const visible = tickets.filter((t) => filter === 'all' || (filter === 'open' ? !t.resolved : t.resolved));

  return (
    <div>
      <div className="flex gap-2 mb-6">
        {(['open', 'resolved', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`font-condensed font-bold text-xs uppercase tracking-wide px-4 py-2 rounded-none transition-colors ${
              filter === f ? 'bg-navy text-white' : 'bg-white border border-g100 text-g600'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="font-body text-sm text-g600 text-center py-12">Nothing here.</p>
      ) : (
        <div className="space-y-3">
          {visible.map((t) => {
            const alreadyDeleted = t.user_id ? deletedUserIds.has(t.user_id) : false;
            return (
              <div key={t.id} className="bg-white border border-g100 rounded-none p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-condensed font-bold text-sm text-navy">{t.subject}</div>
                    <div className="font-body text-xs text-g600 mt-0.5">
                      {t.name} · {t.student_email} · {new Date(t.created_at).toLocaleDateString()}
                    </div>
                    <p className="font-body text-sm text-g800 mt-2">{t.message}</p>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0 items-end">
                    <button
                      onClick={() => toggleResolved(t.id, !t.resolved)}
                      className={`font-condensed font-bold text-[10px] uppercase px-3 py-1.5 rounded-none transition-colors ${
                        t.resolved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {t.resolved ? 'Resolved' : 'Mark resolved'}
                    </button>

                    {t.user_id && !alreadyDeleted && (
                      <button
                        onClick={() => deleteUserAccount(t)}
                        disabled={deletingId === t.id}
                        className="font-condensed font-bold text-[10px] uppercase px-3 py-1.5 rounded-none bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50"
                      >
                        {deletingId === t.id ? 'Deleting…' : 'Delete User Account'}
                      </button>
                    )}

                    {alreadyDeleted && (
                      <span className="font-condensed font-bold text-[10px] uppercase px-3 py-1.5 rounded-none bg-g100 text-g600">
                        Account Deleted
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
