'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { resolveGradeInput, calculateGPA } from '@/lib/gpa-calculations';
import { LetterGrade } from '@/lib/gpa-constants';
import NewSemesterModal from '@/components/gpa-calculator/NewSemesterModal';

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
  const supabase = createClient();

  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [activeSemesterId, setActiveSemesterId] = useState<string | null>(null);
  const [rows, setRows] = useState<SemesterCourseRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [courseSearch, setCourseSearch] = useState('');
  const [courseOptions, setCourseOptions] = useState<Course[]>([]);
  const [studentLevel, setStudentLevel] = useState<string>('100');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

    if (data) {
      const typedRows = data as unknown as SemesterCourseRow[];
      setRows(typedRows);
      // seed the draft text for each row from its saved grade
      setDrafts(
        typedRows.reduce((acc, r) => {
          acc[r.id] = r.grade ?? '';
          return acc;
        }, {} as Record<string, string>)
      );
    }
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

  async function handleCreateSemester(label: string): Promise<boolean> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return false;

    const { data, error } = await supabase
      .from('gpa_semesters')
      .insert({ label, level: studentLevel, student_id: userData.user.id })
      .select()
      .single();

    if (!error && data) {
      setSemesters((prev) => [...prev, data]);
      setActiveSemesterId(data.id);
      return true;
    }
    return false;
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
      const newRow = data as unknown as SemesterCourseRow;
      setRows((prev) => [...prev, newRow]);
      setDrafts((prev) => ({ ...prev, [newRow.id]: '' }));
      setCourseSearch('');
      setCourseOptions([]);
    }
  }

  async function updateRowStatus(rowId: string, status: 'pending' | 'released') {
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, status, is_hypothetical: status === 'pending' } : r))
    );

    await supabase
      .from('gpa_semester_courses')
      .update({ status, is_hypothetical: status === 'pending' })
      .eq('id', rowId);
  }

  async function removeRow(rowId: string) {
    setRows((prev) => prev.filter((r) => r.id !== rowId));
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[rowId];
      return next;
    });
    await supabase.from('gpa_semester_courses').delete().eq('id', rowId);
  }

  /**
   * Commits the draft text for a row: resolves it to a letter grade,
   * updates local state immediately (GPA recalculates on this render,
   * no refresh needed), then persists to Supabase in the background.
   */
  async function commitGrade(row: SemesterCourseRow) {
    const rawInput = drafts[row.id] ?? '';

    if (rawInput.trim() === '') {
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, grade: null } : r)));
      await supabase.from('gpa_semester_courses').update({ grade: null }).eq('id', row.id);
      return;
    }

    const resolved = resolveGradeInput(rawInput);
    if (!resolved) return; // invalid input — leave grade untouched, don't save garbage

    const isHypothetical = row.status === 'pending';

    setRows((prev) =>
      prev.map((r) => (r.id === row.id ? { ...r, grade: resolved, is_hypothetical: isHypothetical } : r))
    );
    setDrafts((prev) => ({ ...prev, [row.id]: resolved }));

    await supabase
      .from('gpa_semester_courses')
      .update({ grade: resolved, is_hypothetical: isHypothetical })
      .eq('id', row.id);
  }

  // Projected GPA: every course counts its hours; released courses use their
  // real grade, pending courses use whatever hypothetical grade (if any) has
  // been entered, and anything blank contributes 0 points for now.
  const currentGpa = calculateGPA(rows.map((r) => ({ grade: r.grade })));

  // Released GPA: every course still counts its hours (matching UPSA's own
  // transcript method), but only courses actually marked "released" get to
  // use their grade — pending courses contribute 0 points until they post,
  // even if a hypothetical guess has been entered for them.
  const releasedOnlyGpa = calculateGPA(
    rows.map((r) => ({ grade: r.status === 'released' ? r.grade : null }))
  );

  const activeSemesterLabel = semesters.find((s) => s.id === activeSemesterId)?.label ?? '';

  if (loading) {
    return (
      <div className="max-w-content mx-auto p-4 space-y-6">
        <div className="relative border-2 border-g100 p-4">
          <div className="mb-3 flex justify-between">
            <div className="h-2.5 w-16 bg-g100 rounded-none animate-pulse" />
            <div className="h-2.5 w-24 bg-g100 rounded-none animate-pulse" />
          </div>
          <div className="mx-auto h-6 w-40 bg-g100 rounded-none animate-pulse mb-2" />
          <div className="mx-auto h-3 w-56 bg-g100 rounded-none animate-pulse mb-4" />
          <div className="flex justify-center gap-2.5">
            <div className="h-16 w-[104px] border-[1.5px] border-g100 bg-off-white" />
            <div className="h-16 w-[104px] border-[1.5px] border-g100 bg-off-white" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-8 w-36 bg-g100 rounded-none animate-pulse" />
          <div className="h-8 w-28 bg-g100 rounded-none animate-pulse" />
        </div>

        <div>
          <div className="h-8 bg-navy-deep/20 animate-pulse" />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="border border-t-0 border-g100 px-2 py-2.5 flex items-center gap-2">
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-24 bg-g100 rounded-none animate-pulse" />
                <div className="h-3 w-36 bg-g100 rounded-none animate-pulse" />
              </div>
              <div className="h-6 w-16 bg-g100 rounded-none animate-pulse" />
              <div className="h-7 w-20 bg-g100 rounded-none animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-content mx-auto p-4 space-y-6">
      {semesters.length === 0 ? (
        <div className="rounded-none border border-dashed border-g100 bg-off-white p-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-none bg-gold/10">
            <span className="font-display text-xl text-gold">+</span>
          </div>
          <h2 className="font-condensed text-sm uppercase tracking-wide text-navy">
            No semesters yet
          </h2>
          <p className="mx-auto mt-2 mb-5 max-w-xs font-body text-sm text-g600">
            Add your first semester to start tracking results as they&apos;re
            released — or test hypothetical grades before exams even begin.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="rounded-none bg-navy px-6 py-2.5 font-condensed text-sm font-semibold text-off-white"
          >
            + Add Your First Semester
          </button>
        </div>
      ) : (
        <>
          {/* ---- Cover sheet: header + GPA stat boxes ---- */}
          <div className="relative border-2 border-navy-deep p-4">
            <span className="absolute -top-2 left-3 bg-off-white px-1.5 font-condensed text-[9px] uppercase tracking-[0.2em] text-g500">
              Confidential
            </span>

            <div className="mb-3 flex justify-between font-condensed text-[10.5px] font-bold uppercase tracking-[0.14em] text-navy">
              <span>Level {studentLevel}</span>
              <span>{activeSemesterLabel}</span>
            </div>

            <h1 className="text-center font-display text-2xl text-navy-deep">GPA Calculator</h1>
            <p className="mx-auto mt-1 mb-4 max-w-[30ch] text-center font-body text-[11.5px] text-g500">
              Track real results as they release, test hypothetical grades for courses still pending.
            </p>

            <div className="flex justify-center gap-2.5">
              <div className="w-[104px] border-[1.5px] border-navy-deep bg-off-white px-2 py-1.5 text-center">
                <div className="font-condensed text-[8px] font-bold uppercase tracking-[0.14em] text-gold">
                  Released
                </div>
                <div className="font-display text-base font-extrabold leading-none text-navy-deep">
                  {releasedOnlyGpa.toFixed(2)}
                </div>
                <div className="mt-1 font-body text-[8.5px] text-g500">
                  {rows.filter((r) => r.status === 'released').length} of {rows.length} out
                </div>
              </div>
              <div className="w-[104px] border-[1.5px] border-navy-deep bg-off-white px-2 py-1.5 text-center">
                <div className="font-condensed text-[8px] font-bold uppercase tracking-[0.14em] text-gold">
                  Projected
                </div>
                <div className="font-display text-base font-extrabold leading-none text-navy-deep">
                  {currentGpa.toFixed(2)}
                </div>
                <div className="mt-1 font-body text-[8.5px] text-g500">hypothetical</div>
              </div>
            </div>
          </div>

          {/* ---- Semester tabs ---- */}
          <div className="flex flex-wrap items-center gap-2">
            {semesters.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSemesterId(s.id)}
                className={`rounded-none border px-3 py-1.5 font-condensed text-xs uppercase tracking-wide ${
                  activeSemesterId === s.id
                    ? 'border-navy-deep bg-navy-deep text-off-white'
                    : 'border-g100 bg-off-white text-navy'
                }`}
              >
                {s.label}
              </button>
            ))}
            <button
              onClick={() => setIsModalOpen(true)}
              className="rounded-none border border-dashed border-g500 px-3 py-1.5 font-condensed text-xs uppercase tracking-wide text-g600"
            >
              + New Semester
            </button>
          </div>

          {activeSemesterId && (
            <>
              {/* ---- Course grid ---- */}
              <div>
                <div className="grid grid-cols-[22px_1fr_60px_92px] gap-2 bg-navy-deep px-2 py-2 font-condensed text-[10px] uppercase tracking-[0.12em] text-off-white">
                  <span>Q.</span>
                  <span>Course</span>
                  <span className="text-right">Status</span>
                  <span className="text-right">Grade</span>
                </div>

                {rows.map((row, i) => (
                  <div
                    key={row.id}
                    className="grid grid-cols-[22px_1fr_60px_92px] items-center gap-2 border border-t-0 border-navy-deep px-2 py-2.5"
                  >
                    <span className="font-display text-[13px] text-g500">
                      {String(i + 1).padStart(2, '0')}
                    </span>

                    <div className="min-w-0">
                      <div className="truncate font-condensed text-[13.5px] font-bold uppercase tracking-wide text-navy-deep">
                        {row.courses?.code ?? row.manual_course_name}
                      </div>
                      {row.courses?.name && (
                        <div className="truncate font-condensed text-[10.5px] uppercase tracking-wide text-g500">
                          {row.courses.name}
                        </div>
                      )}
                      {row.status === 'pending' && (
                        <div className="mt-0.5 font-display text-[10px] italic text-red-700">
                          est. — pending
                        </div>
                      )}
                    </div>

                    <select
                      value={row.status}
                      onChange={(e) => updateRowStatus(row.id, e.target.value as 'pending' | 'released')}
                      className={`justify-self-end rounded px-1.5 py-1 font-condensed text-[9.5px] font-bold uppercase tracking-wide ${
                        row.status === 'released'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="released">Released</option>
                    </select>

                    <div className="flex items-center gap-1 justify-self-end">
                      <input
                        type="text"
                        value={drafts[row.id] ?? ''}
                        onChange={(e) => setDrafts((prev) => ({ ...prev, [row.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitGrade(row);
                        }}
                        placeholder="A/80"
                        className={`h-7 w-11 border-[1.5px] text-center font-display text-sm font-bold text-navy-deep outline-none ${
                          row.status === 'released'
                            ? 'border-green-700 border-solid'
                            : 'border-red-700 border-dashed text-red-700'
                        }`}
                      />
                      <button
                        onClick={() => commitGrade(row)}
                        aria-label="Update grade"
                        className="flex h-7 w-7 items-center justify-center bg-navy-deep font-display text-xs font-bold text-off-white"
                      >
                        ✓
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* ---- Course search / add ---- */}
              <div className="relative">
                <input
                  type="text"
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  placeholder="Search course code or name…"
                  className="w-full border border-navy-deep px-3 py-2 font-body text-sm text-g800"
                />
                {courseOptions.length > 0 && (
                  <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto border border-navy-deep bg-off-white shadow-lg">
                    {courseOptions.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => addCourse(c)}
                        className="w-full border-b border-g100 px-3 py-2 text-left text-sm text-g800 last:border-0 hover:bg-g100"
                      >
                        <span className="font-condensed uppercase">{c.code}</span> — {c.name}
                      </button>
                    ))}
                  </div>
                )}
                {courseSearch.trim().length >= 2 && courseOptions.length === 0 && (
                  <button
                    onClick={() => addCourse(null, courseSearch.trim())}
                    className="mt-1 text-xs text-g600 underline"
                  >
                    Not in catalog — add &quot;{courseSearch.trim()}&quot; manually
                  </button>
                )}
              </div>
            </>
          )}
        </>
      )}

      <NewSemesterModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateSemester}
      />
    </div>
  );
}
