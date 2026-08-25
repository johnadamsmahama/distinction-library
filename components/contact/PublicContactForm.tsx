'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function PublicContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setError('Fill in all fields.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error: insertErr } = await supabase.from('support_tickets').insert({
      user_id: null,
      name: name.trim(),
      student_email: email.trim(),
      subject: subject.trim(),
      message: message.trim(),
    });

    setLoading(false);

    if (insertErr) {
      setError(insertErr.message);
      return;
    }

    setSent(true);
  };

  return (
    <div className="space-y-4">
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
          className="relative inline-flex items-center justify-center gap-2 bg-gradient-to-br from-gold-light to-gold text-navy-deep font-condensed font-bold text-[11px] uppercase tracking-wide px-4 py-2.5 rounded-none flex-shrink-0"
        >
          Chat on WhatsApp
        </a>
      </div>

      <form onSubmit={handleSubmit} className={`${panelClass} h-fit max-w-[440px]`}>
        <div className={panelTexture} />
        <div className={panelHead}>
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className={lockIcon}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <h2 className={panelTitle}>Send us a message</h2>
        </div>

        {sent ? (
          <p className="font-body text-sm text-[#F0F2F8] relative">
            Thanks — your message is in. We reply by email, usually within a day.
          </p>
        ) : (
          <div className="space-y-3 relative">
            <div>
              <label className={labelClass}>Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="you@example.com"
              />
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
        )}
      </form>
    </div>
  );
}

const panelClass = 'relative overflow-hidden bg-navy rounded-none p-[18px]';
const panelTexture =
  'absolute inset-0 pointer-events-none [background-image:repeating-linear-gradient(115deg,rgba(223,190,94,0.04)_0px,rgba(223,190,94,0.04)_1px,transparent_1px,transparent_12px)]';
const panelHead = 'flex items-center gap-2.5 mb-4 relative';
const panelTitle = 'font-display font-semibold text-[14.5px] text-[#F9F5E9]';
const lockIcon = 'w-[18px] h-[18px] stroke-gold-light flex-shrink-0';
const labelClass = 'block font-condensed text-[9.5px] tracking-wide uppercase text-[#8593B8] mb-1.5';
const inputClass =
  'w-full px-[11px] py-[9px] rounded-none bg-white/[0.06] border border-gold-light/25 font-body text-[13.5px] text-[#F0F2F8] placeholder:text-[#5C6785] outline-none focus:border-gold-light transition-colors';
const btnGold =
  'w-full bg-gradient-to-br from-gold-light to-gold text-navy-deep font-condensed font-bold text-[12.5px] py-[11px] rounded-none disabled:opacity-60 transition-opacity';
