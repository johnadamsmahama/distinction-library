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
    <div className="max-w-2xl space-y-6">
      <div className="bg-white border border-g100 rounded-2xl p-6">
        <h2 className="font-display font-bold text-lg text-navy mb-1">Categories</h2>
        <p className="font-body text-xs text-g600 mb-4">Choose which types of updates you want to hear about.</p>
        <div className="space-y-3">
          {CATEGORIES.map((cat) => (
            <label key={cat} className="flex items-center justify-between cursor-pointer">
              <span className="font-condensed font-semibold text-sm text-g800">{cat}</span>
              <input
                type="checkbox"
                checked={!!prefs.categories[cat]}
                onChange={() => toggleCategory(cat)}
                className="w-4 h-4 accent-gold"
              />
            </label>
          ))}
        </div>
      </div>

      <div className="bg-white border border-g100 rounded-2xl p-6">
        <h2 className="font-display font-bold text-lg text-navy mb-1">Channels</h2>
        <p className="font-body text-xs text-g600 mb-4">Where you want to receive notifications.</p>
        <div className="space-y-3">
          {CHANNELS.map((channel) => (
            <label key={channel} className="flex items-center justify-between cursor-pointer">
              <span className="font-condensed font-semibold text-sm text-g800">{channel}</span>
              <input
                type="checkbox"
                checked={!!prefs.channels[channel]}
                onChange={() => toggleChannel(channel)}
                className="w-4 h-4 accent-gold"
              />
            </label>
          ))}
        </div>
      </div>

      <div className="bg-white border border-g100 rounded-2xl p-6">
        <h2 className="font-display font-bold text-lg text-navy mb-1">Frequency</h2>
        <p className="font-body text-xs text-g600 mb-4">How often you want updates bundled together.</p>
        <div className="flex flex-col sm:flex-row gap-2">
          {FREQUENCIES.map((freq) => (
            <button
              key={freq}
              type="button"
              onClick={() => setFrequency(freq)}
              className={`flex-1 font-condensed font-bold text-xs uppercase px-4 py-3 rounded-lg border transition-colors ${
                prefs.frequency === freq ? 'border-gold bg-gold/10 text-navy' : 'border-g100 text-g600'
              }`}
            >
              {freq}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="font-body text-sm text-red-500">{error}</p>}
      {saved && <p className="font-body text-sm text-green-600">Preferences saved.</p>}
      <button
        onClick={save}
        disabled={loading}
        className="w-full bg-gold text-navy font-condensed font-bold text-sm py-3 rounded-lg hover:bg-gold-light transition-colors disabled:opacity-60"
      >
        {loading ? 'Saving…' : 'Save preferences'}
      </button>
    </div>
  );
}
