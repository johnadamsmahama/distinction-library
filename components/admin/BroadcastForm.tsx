'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Audience = 'all' | 'department' | 'level';

export default function BroadcastForm({
  totalStudents,
  departments,
  levels,
}: {
  totalStudents: number;
  departments: string[];
  levels: string[];
}) {
  const [audience, setAudience] = useState<Audience>('all');
  const [department, setDepartment] = useState(departments[0] ?? '');
  const [level, setLevel] = useState(levels[0] ?? '');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentCount, setSentCount] = useState<number | null>(null);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSentCount(null);

    if (!message.trim()) {
      setError('Write a message first.');
      return;
    }
    if (audience === 'department' && !department) {
      setError('Choose a department.');
      return;
    }
    if (audience === 'level' && !level) {
      setError('Choose a level.');
      return;
    }

    const audienceLabel =
      audience === 'all' ? `all ${totalStudents} students` : audience === 'department' ? `everyone in ${department}` : `everyone in Level ${level}`;

    if (!confirm(`Send this notification to ${audienceLabel}? This can't be undone.`)) return;

    setLoading(true);
    const supabase = createClient();

    let query = supabase.from('profiles').select('id').eq('role', 'student');
    if (audience === 'department') query = query.eq('department', department);
    if (audience === 'level') query = query.eq('level', level);

    const { data: targets, error: fetchErr } = await query;
    if (fetchErr || !targets) {
      setLoading(false);
      setError(fetchErr?.message ?? 'Could not load audience.');
      return;
    }

    if (targets.length === 0) {
      setLoading(false);
      setError('No students match that audience.');
      return;
    }

    const rows = targets.map((t) => ({ user_id: t.id, type: 'announcement', message: message.trim() }));
    const { error: insertErr } = await supabase.from('notifications').insert(rows);
    setLoading(false);

    if (insertErr) {
      setError(insertErr.message);
      return;
    }

    setSentCount(targets.length);
    setMessage('');
  };

  return (
    <form onSubmit={send} className="bg-white border border-g100 rounded-2xl p-6 space-y-4 max-w-lg">
      <div>
        <label className={labelClass}>Audience</label>
        <div className="flex gap-2">
          <AudienceBtn active={audience === 'all'} onClick={() => setAudience('all')}>
            All students
          </AudienceBtn>
          <AudienceBtn active={audience === 'department'} onClick={() => setAudience('department')}>
            By department
          </AudienceBtn>
          <AudienceBtn active={audience === 'level'} onClick={() => setAudience('level')}>
            By level
          </AudienceBtn>
        </div>
      </div>

      {audience === 'department' && (
        <div>
          <label className={labelClass}>Department</label>
          <select value={department} onChange={(e) => setDepartment(e.target.value)} className={inputClass}>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      )}

      {audience === 'level' && (
        <div>
          <label className={labelClass}>Level</label>
          <select value={level} onChange={(e) => setLevel(e.target.value)} className={inputClass}>
            {levels.map((l) => (
              <option key={l} value={l}>
                Level {l}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className={labelClass}>Message</label>
        <textarea
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="e.g. The library will be closed for maintenance this Saturday."
          className={inputClass}
        />
      </div>

      {error && <p className="font-body text-sm text-red-500">{error}</p>}
      {sentCount !== null && (
        <p className="font-body text-sm text-green-600">Sent to {sentCount} student{sentCount === 1 ? '' : 's'}.</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gold text-navy font-condensed font-bold text-sm py-3 rounded-lg hover:bg-gold-light transition-colors disabled:opacity-60"
      >
        {loading ? 'Sending…' : 'Send broadcast'}
      </button>
    </form>
  );
}

function AudienceBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`font-condensed font-bold text-xs uppercase px-3 py-2 rounded-lg border transition-colors ${
        active ? 'border-gold bg-gold/10 text-navy' : 'border-g100 text-g600'
      }`}
    >
      {children}
    </button>
  );
}

const labelClass = 'block font-condensed font-semibold text-xs uppercase tracking-wide text-g800 mb-1.5';
const inputClass =
  'w-full px-3.5 py-2.5 rounded-lg border border-g100 font-body text-sm text-g800 outline-none focus:border-gold transition-colors';
