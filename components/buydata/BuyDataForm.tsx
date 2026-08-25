'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const NETWORKS = ['MTN', 'Telecel', 'AirtelTigo'] as const;

export default function BuyDataForm({
  defaultEmail,
  alreadySignedUp,
}: {
  defaultEmail: string;
  alreadySignedUp: boolean;
}) {
  const [network, setNetwork] = useState<(typeof NETWORKS)[number] | ''>('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(defaultEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(alreadySignedUp);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!network || !phone.trim()) {
      setError('Select your network and enter a phone number.');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error: insertErr } = await supabase.from('buy_data_signups').insert({
      user_id: user?.id ?? null,
      network,
      phone_number: phone.trim(),
      email: email.trim() || null,
    });

    setLoading(false);

    if (insertErr) {
      setError(insertErr.message);
      return;
    }

    setDone(true);
  };

  if (done) {
    return (
      <div className="bg-white border border-g100 rounded-none p-6 text-center">
        <div className="w-12 h-12 rounded-none bg-gold/15 flex items-center justify-center mx-auto mb-3">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C9A02C" strokeWidth="2.2">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h2 className="font-display font-bold text-lg text-navy mb-1">You&apos;re on the list</h2>
        <p className="font-body text-sm text-g600">
          We&apos;ll notify you the moment Buy Data goes live for your network.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-g100 rounded-none p-6 space-y-4">
      <div>
        <label className={labelClass}>Network</label>
        <div className="grid grid-cols-3 gap-2">
          {NETWORKS.map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => setNetwork(n)}
              className={`font-condensed font-bold text-xs uppercase tracking-wide py-3 rounded-none border-2 transition-colors ${
                network === n
                  ? 'border-gold bg-gold/10 text-navy'
                  : 'border-g100 text-g600 hover:border-gold/40'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className={labelClass}>Phone number</label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="024 000 0000"
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>Email (optional)</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
      </div>
      {error && <p className="font-body text-sm text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gold text-navy font-condensed font-bold text-sm py-3 rounded-none hover:bg-gold-light transition-colors disabled:opacity-60"
      >
        {loading ? 'Joining…' : 'Notify me when it launches'}
      </button>
      <p className="font-body text-xs text-g600 text-center">
        No payment or billing set up yet — this just puts you first in line.
      </p>
    </form>
  );
}

const labelClass = 'block font-condensed font-semibold text-xs uppercase tracking-wide text-g800 mb-2';
const inputClass =
  'w-full px-4 py-3 rounded-none border border-g100 font-body text-[15px] text-g800 outline-none focus:border-gold transition-colors';
