'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Course = { id: string; code: string; name: string; department: string; level: string };

export default function CourseManager({ courses: initialCourses }: { courses: Course[] }) {
  const [courses, setCourses] = useState(initialCourses);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [level, setLevel] = useState('100');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const addCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!code.trim() || !name.trim() || !department.trim()) {
      setError('Fill in all fields.');
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { data, error: insertErr } = await supabase
      .from('courses')
      .insert({ code: code.trim(), name: name.trim(), department: department.trim(), level })
      .select()
      .single();
    setLoading(false);

    if (insertErr) {
      setError(insertErr.message);
      return;
    }
    setCourses((prev) => [...prev, data as Course].sort((a, b) => a.code.localeCompare(b.code)));
    setCode('');
    setName('');
  };

  const removeCourse = async (id: string) => {
    if (!confirm('Delete this course? Any linked papers/materials must be removed first.')) return;
    const supabase = createClient();
    const { error: deleteErr } = await supabase.from('courses').delete().eq('id', id);
    if (deleteErr) {
      alert(deleteErr.message);
      return;
    }
    setCourses((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <form onSubmit={addCourse} className="bg-white border border-g100 rounded-2xl p-6 space-y-4 h-fit">
        <h2 className="font-display font-bold text-lg text-navy mb-1">Add a course</h2>
        <div>
          <label className={labelClass}>Course code</label>
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. COM 201" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Course name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Department</label>
          <input value={department} onChange={(e) => setDepartment(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Level</label>
          <select value={level} onChange={(e) => setLevel(e.target.value)} className={inputClass}>
            {['100', '200', '300', '400'].map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
        {error && <p className="font-body text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gold text-navy font-condensed font-bold text-sm py-3 rounded-lg hover:bg-gold-light transition-colors disabled:opacity-60"
        >
          {loading ? 'Adding…' : 'Add course'}
        </button>
      </form>

      <div>
        <h2 className="font-display font-bold text-lg text-navy mb-4">All courses ({courses.length})</h2>
        <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
          {courses.map((c) => (
            <div key={c.id} className="flex items-center justify-between bg-white border border-g100 rounded-lg px-4 py-3">
              <div className="min-w-0">
                <div className="font-condensed font-semibold text-sm text-g800">{c.code} — {c.name}</div>
                <div className="font-body text-xs text-g600">{c.department} · Level {c.level}</div>
              </div>
              <button
                onClick={() => removeCourse(c.id)}
                className="flex-shrink-0 ml-3 w-7 h-7 flex items-center justify-center rounded-full text-g600 hover:text-red-500 hover:bg-red-50 transition-colors"
                aria-label={`Delete ${c.code}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const labelClass = 'block font-condensed font-semibold text-xs uppercase tracking-wide text-g800 mb-2';
const inputClass =
  'w-full px-4 py-3 rounded-lg border border-g100 font-body text-[15px] text-g800 outline-none focus:border-gold transition-colors';
