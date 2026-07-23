'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Ticket = {
  id: string;
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

  const toggleResolved = async (id: string, resolved: boolean) => {
    const supabase = createClient();
    const { error } = await supabase.from('support_tickets').update({ resolved }).eq('id', id);
    if (error) {
      alert(error.message);
      return;
    }
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, resolved } : t)));
  };

  const visible = tickets.filter((t) => filter === 'all' || (filter === 'open' ? !t.resolved : t.resolved));

  return (
    <div>
      <div className="flex gap-2 mb-6">
        {(['open', 'resolved', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`font-condensed font-bold text-xs uppercase tracking-wide px-4 py-2 rounded-lg transition-colors ${
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
          {visible.map((t) => (
            <div key={t.id} className="bg-white border border-g100 rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-condensed font-bold text-sm text-navy">{t.subject}</div>
                  <div className="font-body text-xs text-g600 mt-0.5">
                    {t.name} · {t.student_email} · {new Date(t.created_at).toLocaleDateString()}
                  </div>
                  <p className="font-body text-sm text-g800 mt-2">{t.message}</p>
                </div>
                <button
                  onClick={() => toggleResolved(t.id, !t.resolved)}
                  className={`flex-shrink-0 font-condensed font-bold text-[10px] uppercase px-3 py-1.5 rounded-lg transition-colors ${
                    t.resolved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {t.resolved ? 'Resolved' : 'Mark resolved'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
