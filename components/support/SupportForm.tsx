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
    <div className="space-y-4">
      {/* vault dial */}
      <div className="w-14 h-14 rounded-full mx-auto mb-2 bg-gradient-to-br from-navy to-navy-deep flex items-center justify-center shadow-[0_10px_22px_rgba(13,43,94,0.3)] relative">
        <div className="absolute inset-1.5 rounded-full border border-dashed border-gold-light/40" />
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-[22px] h-[22px] stroke-gold-light">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>

      {/* contact banner */}
      <div className={`${panelClass} flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3`}>
        <div className={panelTexture} />
        <div className="relative">
          <div className="font-condensed font-bold text-[10.5px] uppercase tracking-widest text-gold-light mb-1">
            Prefer to reach us directly?
          </div>
          <div className="font-body text-[13.5px] text-[#F0F2F8]">Call or WhatsApp: 024 811 1310</div>
        </div>
        <a
          href="https://wa.me/233248111310"
          target="_blank"
          rel="noopener noreferrer"
          className="relative inline-flex items-center justify-center gap-2 bg-gradient-to-br from-gold-light to-gold text-navy-deep font-condensed font-bold text-[11px] uppercase tracking-wide px-4 py-2.5 rounded-lg flex-shrink-0"
        >
          Chat on WhatsApp
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* form */}
        <form onSubmit={handleSubmit} className={`${panelClass} h-fit`}>
          <div className={panelTexture} />
          <div className={panelHead}>
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className={lockIcon}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <h2 className={panelTitle}>New Request</h2>
          </div>
          <div className="space-y-3 relative">
            <div>
              <label className={labelClass}>Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Your UPSA email</label>
              <input value={studentEmail} disabled className={`${inputClass} opacity-55`} />
            </div>
            <div>
              <label className={labelClass}>Subject</label>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Message</label>
              <textarea
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className={inputClass}
              />
            </div>
            {error && <p className="font-body text-sm text-red-400">{error}</p>}
            <button type="submit" disabled={loading} className={btnGold}>
              {loading ? 'Sending…' : 'Send message'}
            </button>
          </div>
        </form>

        {/* ticket history */}
        <div className={panelClass}>
          <div className={panelTexture} />
          <div className={panelHead}>
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className={lockIcon}>
              <path d="M21 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2m18 0a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2m18 0v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8" />
            </svg>
            <h2 className={panelTitle}>Your Requests</h2>
          </div>
          {tickets.length === 0 ? (
            <p className="font-body text-[12.5px] text-[#8593B8] relative">Nothing sent yet.</p>
          ) : (
            <div className="space-y-2.5 relative">
              {tickets.map((t) => (
                <div
                  key={t.id}
                  className="bg-gold-light/5 border border-dashed border-gold-light/35 rounded-[10px] px-3.5 py-3"
                >
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <span className="font-body font-semibold text-[12.5px] text-[#F0F2F8] truncate">
                      {t.subject}
                    </span>
                    <span
                      className={`font-condensed font-bold text-[9px] uppercase tracking-wide px-2 py-0.5 rounded-full border flex-shrink-0 ${
                        t.resolved
                          ? 'text-green-300 bg-green-400/10 border-green-400/30'
                          : 'text-amber-300 bg-amber-400/10 border-amber-400/30'
                      }`}
                    >
                      {t.resolved ? 'Resolved' : 'Open'}
                    </span>
                  </div>
                  <p className="font-body text-[11.5px] text-[#8593B8] leading-relaxed">{t.message}</p>
                  <p className="font-condensed text-[9.5px] text-[#5C6785] mt-2 uppercase tracking-wide">
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

const panelClass = 'relative overflow-hidden bg-navy rounded-2xl p-[18px]';
const panelTexture =
  'absolute inset-0 pointer-events-none [background-image:repeating-linear-gradient(115deg,rgba(223,190,94,0.04)_0px,rgba(223,190,94,0.04)_1px,transparent_1px,transparent_12px)]';
const panelHead = 'flex items-center gap-2.5 mb-4 relative';
const panelTitle = 'font-display font-semibold text-[14.5px] text-[#F9F5E9]';
const lockIcon = 'w-[18px] h-[18px] stroke-gold-light flex-shrink-0';
const labelClass = 'block font-condensed text-[9.5px] tracking-wide uppercase text-[#8593B8] mb-1.5';
const inputClass =
  'w-full px-[11px] py-[9px] rounded-lg bg-white/[0.06] border border-gold-light/25 font-body text-[13.5px] text-[#F0F2F8] placeholder:text-[#5C6785] outline-none focus:border-gold-light transition-colors';
const btnGold =
  'w-full bg-gradient-to-br from-gold-light to-gold text-navy-deep font-condensed font-bold text-[12.5px] py-[11px] rounded-lg disabled:opacity-60 transition-opacity';
