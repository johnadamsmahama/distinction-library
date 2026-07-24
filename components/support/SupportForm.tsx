'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Ticket = { id: string; subject: string; message: string; resolved: boolean; created_at: string };

export default function SupportForm({
  studentEmail,
  defaultName,
  initialTickets,
}: {
  studentEmail: string;
  defaultName: string | null;
  initialTickets: Ticket[];
}) {
  const [name, setName] = useState(defaultName ?? '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tickets, setTickets] = useState(initialTickets);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !subject.trim() || !message.trim()) {
      setError('Fill in all fields.');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error: insertErr } = await supabase
      .from('support_tickets')
      .insert({
        user_id: user?.id,
        name: name.trim(),
        student_email: studentEmail,
        subject: subject.trim(),
        message: message.trim(),
      })
      .select()
      .single();

    setLoading(false);

    if (insertErr) {
      setError(insertErr.message);
      return;
    }

    setTickets((prev) => [data as Ticket, ...prev]);
    setSubject('');
    setMessage('');
  };

  return (
    <div>
      <div className="bg-navy rounded-2xl p-5 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="font-condensed font-bold text-xs uppercase tracking-wide text-white/70 mb-1">
            Prefer to reach us directly?
          </div>
          <div className="font-body text-sm text-white">Call or WhatsApp: 024 811 1310</div>
        </div>
        <a
          href="https://wa.me/233248111310"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 bg-gold text-navy font-condensed font-bold text-xs uppercase px-4 py-2.5 rounded-lg hover:bg-gold-light transition-colors flex-shrink-0"
        >
          Chat on WhatsApp
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <form onSubmit={handleSubmit} className="bg-white border border-g100 rounded-2xl p-6 space-y-4 h-fit">
          <div>
            <label className={labelClass}>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Your UPSA email</label>
            <input value={studentEmail} disabled className={`${inputClass} bg-off-white text-g600`} />
          </div>
          <div>
            <label className={labelClass}>Subject</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Message</label>
            <textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} className={inputClass} />
          </div>
          {error && <p className="font-body text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold text-navy font-condensed font-bold text-sm py-3 rounded-lg hover:bg-gold-light transition-colors disabled:opacity-60"
          >
            {loading ? 'Sending…' : 'Send message'}
          </button>
        </form>

        <div>
          <h2 className="font-display font-bold text-lg text-navy mb-4">Your past messages</h2>
          {tickets.length === 0 ? (
            <p className="font-body text-sm text-g600">Nothing sent yet.</p>
          ) : (
            <div className="space-y-3">
              {tickets.map((t) => (
                <div key={t.id} className="bg-white border border-g100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-condensed font-semibold text-sm text-g800">{t.subject}</span>
                    <span
                      className={`font-condensed font-bold text-[10px] uppercase px-2 py-0.5 rounded ${
                        t.resolved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {t.resolved ? 'Resolved' : 'Open'}
                    </span>
                  </div>
                  <p className="font-body text-xs text-g600">{t.message}</p>
                  <p className="font-condensed text-[10px] text-g600 mt-2">
                    {new Date(t.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const labelClass = 'block font-condensed font-semibold text-xs uppercase tracking-wide text-g800 mb-2';
const inputClass =
  'w-full px-4 py-3 rounded-lg border border-g100 font-body text-[15px] text-g800 outline-none focus:border-gold transition-colors';