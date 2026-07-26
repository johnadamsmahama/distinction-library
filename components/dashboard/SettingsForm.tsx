'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const LEVELS = ['100', '200', '300', '400'];

export default function SettingsForm({
  initialFullName,
  initialDepartment,
  initialLevel,
}: {
  initialFullName: string | null;
  initialDepartment: string | null;
  initialLevel: string | null;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialFullName ?? '');
  const [department, setDepartment] = useState(initialDepartment ?? '');
  const [level, setLevel] = useState(initialLevel ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);

    if (!fullName.trim()) {
      setError('Full name cannot be empty.');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      setError('Your session expired — please log in again.');
      return;
    }

    const { error: updateErr } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        department: department.trim() || null,
        level: level || null,
      })
      .eq('id', user.id);

    setLoading(false);

    if (updateErr) {
      setError(updateErr.message);
      return;
    }

    setSaved(true);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-g100 rounded-2xl p-6 space-y-4 max-w-md">
      <div>
        <label className={labelClass}>Full name</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className={inputClass}
          placeholder="e.g. Ama Serwaa"
        />
      </div>

      <div>
        <label className={labelClass}>Department</label>
        <input
          type="text"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className={inputClass}
          placeholder="e.g. Marketing"
        />
      </div>

      <div>
        <label className={labelClass}>Level</label>
        <select value={level} onChange={(e) => setLevel(e.target.value)} className={inputClass}>
          <option value="">Not set</option>
          {LEVELS.map((l) => (
            <option key={l} value={l}>Level {l}</option>
          ))}
        </select>
      </div>

      {error && <p className="font-body text-sm text-red-500">{error}</p>}
      {saved && <p className="font-body text-sm text-green-600">Saved successfully.</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gold text-navy font-condensed font-bold text-sm py-3 rounded-lg hover:bg-gold-light transition-colors disabled:opacity-60"
      >
        {loading ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  );
}

const labelClass = 'block font-condensed font-semibold text-xs uppercase tracking-wide text-g800 mb-2';
const inputClass =
  'w-full px-4 py-3 rounded-lg border border-g100 font-body text-[15px] text-g800 outline-none focus:border-gold transition-colors';