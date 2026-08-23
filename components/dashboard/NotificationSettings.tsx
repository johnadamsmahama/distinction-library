'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

// Spec Section 3.7: categories, channels, and frequency a student controls.
const CATEGORIES = ['Academic', 'Opportunities', 'Career', 'Events', 'Account & Security'] as const;
const CHANNELS = ['In-app', 'Push', 'Email'] as const;
const FREQUENCIES = ['Instant', 'Daily summary', 'Weekly summary'] as const;

type Prefs = {
  categories: Record<string, boolean>;
  channels: Record<string, boolean>;
  frequency: string;
};

const DEFAULT_PREFS: Prefs = {
  categories: Object.fromEntries(CATEGORIES.map((c) => [c, true])),
  channels: { 'In-app': true, Push: false, Email: true },
  frequency: 'Instant',
};

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className={`w-10 h-[23px] rounded-none flex-shrink-0 relative transition-colors ${on ? 'bg-gold' : 'bg-white/15'}`}
    >
      <span
        className={`absolute top-[2.5px] w-[18px] h-[18px] rounded-none bg-white transition-all ${
          on ? 'left-[19px]' : 'left-[2.5px]'
        }`}
      />
    </button>
  );
}

export default function NotificationSettings({
  userId,
  initialPrefs,
}: {
  userId: string;
  initialPrefs: Prefs | null;
}) {
  const [prefs, setPrefs] = useState<Prefs>(initialPrefs ?? DEFAULT_PREFS);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleCategory = (cat: string) => {
    setSaved(false);
    setPrefs((p) => ({ ...p, categories: { ...p.categories, [cat]: !p.categories[cat] } }));
  };

  const toggleChannel = (channel: string) => {
    setSaved(false);
    setPrefs((p) => ({ ...p, channels: { ...p.channels, [channel]: !p.channels[channel] } }));
  };

  const setFrequency = (freq: string) => {
    setSaved(false);
    setPrefs((p) => ({ ...p, frequency: freq }));
  };

  const save = async () => {
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({ notification_prefs: prefs })
      .eq('id', userId);
    setLoading(false);

    if (updateErr) {
      setError(updateErr.message);
      return;
    }
    setSaved(true);
  };

  return (
    <div className="max-w-2xl space-y-4">
      {/* vault dial */}
      <div className="w-14 h-14 rounded-none mx-auto mb-2 bg-gradient-to-br from-navy to-navy-deep flex items-center justify-center shadow-[0_10px_22px_rgba(13,43,94,0.3)] relative">
        <div className="absolute inset-1.5 rounded-none border border-dashed border-gold-light/40" />
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-[22px] h-[22px] stroke-gold-light">
          <path d="M4 4h16v16H4z" />
          <path d="m4 4 8 8 8-8" />
        </svg>
      </div>

      <div className={panelClass}>
        <div className={panelTexture} />
        <div className={panelHead}>
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className={lockIcon}>
            <path d="M4 4h16v16H4z" />
            <path d="m4 4 8 8 8-8" />
          </svg>
          <div>
            <h2 className={panelTitle}>Categories</h2>
            <p className={panelSub}>Choose which types of updates you want to hear about.</p>
          </div>
        </div>
        <div className="space-y-3.5 relative">
          {CATEGORIES.map((cat) => (
            <div key={cat} className="flex items-center justify-between">
              <span className="font-body font-semibold text-[13.5px] text-[#F0F2F8]">{cat}</span>
              <Toggle on={!!prefs.categories[cat]} onClick={() => toggleCategory(cat)} />
            </div>
          ))}
        </div>
      </div>

      <div className={panelClass}>
        <div className={panelTexture} />
        <div className={panelHead}>
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className={lockIcon}>
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <div>
            <h2 className={panelTitle}>Channels</h2>
            <p className={panelSub}>Where you want to receive notifications.</p>
          </div>
        </div>
        <div className="space-y-3.5 relative">
          {CHANNELS.map((channel) => (
            <div key={channel} className="flex items-center justify-between">
              <span className="font-body font-semibold text-[13.5px] text-[#F0F2F8]">{channel}</span>
              <Toggle on={!!prefs.channels[channel]} onClick={() => toggleChannel(channel)} />
            </div>
          ))}
        </div>
      </div>

      <div className={panelClass}>
        <div className={panelTexture} />
        <div className={panelHead}>
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className={lockIcon}>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 3" />
          </svg>
          <div>
            <h2 className={panelTitle}>Frequency</h2>
            <p className={panelSub}>How often you want updates bundled together.</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 relative">
          {FREQUENCIES.map((freq) => (
            <button
              key={freq}
              type="button"
              onClick={() => setFrequency(freq)}
              className={`flex-1 font-condensed font-bold text-[11px] uppercase tracking-wide px-3 py-2.5 rounded-none border transition-colors ${
                prefs.frequency === freq
                  ? 'bg-gradient-to-br from-gold-light to-gold border-gold text-navy-deep'
                  : 'border-gold-light/30 text-[#8593B8]'
              }`}
            >
              {freq}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="font-body text-sm text-red-400">{error}</p>}
      {saved && <p className="font-body text-sm text-green-400">Preferences saved.</p>}
      <button type="button" onClick={save} disabled={loading} className={btnGold}>
        {loading ? 'Saving…' : 'Save preferences'}
      </button>
    </div>
  );
}

const panelClass = 'relative overflow-hidden bg-navy rounded-none p-[18px]';
const panelTexture =
  'absolute inset-0 pointer-events-none [background-image:repeating-linear-gradient(115deg,rgba(223,190,94,0.04)_0px,rgba(223,190,94,0.04)_1px,transparent_1px,transparent_12px)]';
const panelHead = 'flex items-start gap-2.5 mb-4 relative';
const panelTitle = 'font-display font-semibold text-[14.5px] text-[#F9F5E9]';
const panelSub = 'font-body text-[11.5px] text-[#8593B8] mt-0.5 leading-relaxed';
const lockIcon = 'w-[18px] h-[18px] stroke-gold-light flex-shrink-0 mt-0.5';
const btnGold =
  'w-full bg-gradient-to-br from-gold-light to-gold text-navy-deep font-condensed font-bold text-[12.5px] py-[11px] rounded-none disabled:opacity-60 transition-opacity';
