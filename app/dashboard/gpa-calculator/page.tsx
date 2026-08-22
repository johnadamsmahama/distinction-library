'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { resolveGradeInput, calculateGPA } from '@/lib/gpa-calculations';
import { LetterGrade } from '@/lib/gpa-constants';

interface Course {
  id: string;
  code: string;
  name: string;
}

interface SemesterCourseRow {
  id: string;
  course_id: string | null;
  manual_course_name: string | null;
  status: 'pending' | 'released';
  grade: LetterGrade | null;
  is_hypothetical: boolean;
  courses: Course | null;
}

interface Semester {
  id: string;
  label: string;
  level: string;
}

export default function GpaCalculatorPage() {
  const supabase = createClientComponentClient();

  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [activeSemesterId, setActiveSemesterId] = useState<string | null>(null);
  const [rows, setRows] = useState<SemesterCourseRow[]>([]);
  const [courseSearch, setCourseSearch] = useState('');
  const [courseOptions, setCourseOptions] = useState<Course[]>([]);
  const [studentLevel, setStudentLevel] = useState<string>('100');
  const [loading, setLoading] = useState(true);

  const loadSemesters = useCallback(async () => {
    const { data: profile } = await supabase.auth.getUser();
    if (!profile?.user) return;

    const { data: profileRow } = await supabase
      .from('profiles')
      .select('level')
      .eq('id', profile.user.id)
      .single();

    if (profileRow?.level) setStudentLevel(profileRow.level);

    const { data } = await supabase
      .from('gpa_semesters')
      .select('id, label, level')
      .order('created_at', { ascending: true });

    if (data) {
      setSemesters(data);
      if (data.length > 0 && !activeSemesterId) setActiveSemesterId(data[0].id);
    }
    setLoading(false);
  }, [supabase, activeSemesterId]);

  const loadRows = useCallback(async (semesterId: string) => {
    const { data } = await supabase
      .from('gpa_semester_courses')
      .select('id, course_id, manual_course_name, status, grade, is_hypothetical, courses(id, code, name)')
      .eq('semester_id', semesterId)
      .order('created_at', { ascending: true });

    if (data) setRows(data as unknown as SemesterCourseRow[]);
  }, [supabase]);

  useEffect(() => {
    loadSemesters();
  }, [loadSemesters]);

  useEffect(() => {
    if (activeSemesterId) loadRows(activeSemesterId);
  }, [activeSemesterId, loadRows]);

  useEffect(() => {
    if (courseSearch.trim().length < 2) {
      setCourseOptions([]);
      return;
    }
    const search = async () => {
      const { data } = await supabase
        .from('courses')
        .select('id, code, name')
        .eq('level', studentLevel)
        .eq('is_active', true)
        .or(`code.ilike.%${courseSearch}%,name.ilike.%${courseSearch}%`)
        .limit(8);
      setCourseOptions(data ?? []);
    };
    const timeout = setTimeout(search, 250);
    return () => clearTimeout(timeout);
  }, [courseSearch, studentLevel, supabase]);

  async function createSemester() {
    const label = window.prompt('Semester label (e.g. "Level 100, Semester 1")');
    if (!label) return;

    const { data, error } = await supabase
      .from('gpa_semesters')
      .insert({ label, level: studentLevel })
      .select()
      .single();

    if (!error && data) {
      setSemesters((prev) => [...prev, data]);
      setActiveSemesterId(data.id);
    }
  }

  async function addCourse(course: Course | null, manualName?: string) {
    if (!activeSemesterId) return;

    const { data, error } = await supabase
      .from('gpa_semester_courses')
      .insert({
        semester_id: activeSemesterId,
        course_id: course?.id ?? null,
        manual_course_name: course ? null : manualName,
        status: 'pending',
        grade: null,
        is_hypothetical: true,
      })
      .select('id, course_id, manual_course_name, status, grade, is_hypothetical, courses(id, code, name)')
      .single();

    if (!error && data) {
      setRows((prev) => [...prev, data as unknown as SemesterCourseRow]);
      setCourseSearch('');
      setCourseOptions([]);
    }
  }

  async function updateRow(rowId: string, updates: Partial<SemesterCourseRow>) {
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, ...updates } : r)));

    await supabase
      .from('gpa_semester_courses')
      .update({
        status: updates.status,
        grade: updates.grade,
        is_hypothetical: updates.is_hypothetical,
      })
      .eq('id', rowId);
  }

  async function removeRow(rowId: string) {
    setRows((prev) => prev.filter((r) => r.id !== rowId));
    await supabase.from('gpa_semester_courses').delete().eq('id', rowId);
  }

  function handleGradeInput(row: SemesterCourseRow, rawInput: string) {
    if (rawInput.trim() === '') {
      updateRow(row.id, { grade: null });
      return;
    }
    const resolved = resolveGradeInput(rawInput);
    if (resolved) {
      updateRow(row.id, {
        grade: resolved,
        is_hypothetical: row.status === 'pending',
      });
    }
  }

  const currentGpa = calculateGPA(rows.map((r) => ({ grade: r.grade })));
  const releasedOnlyGpa = calculateGPA(
    rows.filter((r) => r.status === 'released').map((r) => ({ grade: r.grade }))
  );

  if (loading) return <div className="p-6 text-g600 font-body">Loading your GPA workspace…</div>;

  return (
    <div className="max-w-content mx-auto p-4 space-y-6">
      <header>
        <h1 className="font-display text-2xl text-navy">GPA Calculator</h1>
        <p className="font-body text-sm text-g600">
          Track real results as they release, and test hypothetical grades for
          courses still pending.
        </p>
      </header>

      <div className="flex items-center gap-2 flex-wrap">
        {semesters.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSemesterId(s.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-condensed border ${
              activeSemesterId === s.id
                ? 'bg-navy text-off-white border-navy'
                : 'bg-off-white text-navy border-g100'
            }`}
          >
            {s.label}
          </button>
        ))}
        <button
          onClick={createSemester}
          className="px-3 py-1.5 rounded-full text-sm font-condensed border border-dashed border-g500 text-g600"
        >
          + New Semester
        </button>
      </div>

      {activeSemesterId && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border-t-4 border-gold bg-off-white p-4 shadow-sm">
              <div className="font-condensed text-xs text-g600 uppercase">Released GPA</div>
              <div className="font-display text-3xl text-navy">{releasedOnlyGpa.toFixed(2)}</div>
              <div className="text-xs text-g500">
                {rows.filter((r) => r.status === 'released').length} of {rows.length} results out
              </div>
            </div>
            <div className="rounded-lg border-t-4 border-gold-light bg-off-white p-4 shadow-sm">
              <div className="font-condensed text-xs text-g600 uppercase">Projected GPA</div>
              <div className="font-display text-3xl text-navy">{currentGpa.toFixed(2)}</div>
              <div className="text-xs text-g500">including hypothetical grades</div>
            </div>
          </div>

          <div className="space-y-2">
            {rows.map((row) => (
              <div key={row.id} className="flex items-center gap-2 bg-off-white rounded-md border border-g100 p-3">
                <div className="flex-1 min-w-0">
                  <div className="font-condensed text-sm text-navy truncate">
                    {row.courses?.code ?? row.manual_course_name}
                  </div>
                  <div className="text-xs text-g500 truncate">{row.courses?.name}</div>
                </div>

                <select
                  value={row.status}
                  onChange={(e) =>
                    updateRow(row.id, {
                      status: e.target.value as 'pending' | 'released',
                      is_hypothetical: e.target.value === 'pending',
                    })
                  }
                  className="text-xs border border-g100 rounded px-2 py-1 text-g800 bg-off-white"
                >
                  <option value="pending">Pending</option>
                  <option value="released">Released</option>
                </select>

                <input
                  type="text"
                  defaultValue={row.grade ?? ''}
                  onBlur={(e) => handleGradeInput(row, e.target.value)}
                  placeholder="A or 80"
                  className="w-20 text-sm border border-g100 rounded px-2 py-1 text-center text-g800"
                />

                <button onClick={() => removeRow(row.id)} className="text-g500 hover:text-red-500 text-sm px-1">
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="relative">
            <input
              type="text"
              value={courseSearch}
              onChange={(e) => setCourseSearch(e.target.value)}
              placeholder="Search course code or name…"
              className="w-full border border-g100 rounded-md px-3 py-2 text-sm text-g800"
            />
            {courseOptions.length > 0 && (
              <div className="absolute z-10 w-full bg-off-white border border-g100 rounded-md shadow-lg mt-1 max-h-56 overflow-y-auto">
                {courseOptions.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => addCourse(c)}
                    className="w-full text-left px-3 py-2 text-sm text-g800 hover:bg-g100 border-b border-g100 last:border-0"
                  >
                    <span className="font-condensed">{c.code}</span> — {c.name}
                  </button>
                ))}
              </div>
            )}
            {courseSearch.trim().length >= 2 && courseOptions.length === 0 && (
              <button
                onClick={() => addCourse(null, courseSearch.trim())}
                className="mt-1 text-xs text-g600 underline"
              >
                Not in catalog — add "{courseSearch.trim()}" manually
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
