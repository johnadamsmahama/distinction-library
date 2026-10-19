'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export type BookmarkedCourse = {
  course_id: string;
  code: string;
  name: string;
  level: string;
  past_paper_count: number;
  study_material_count: number;
};

type CourseOption = { id: string; code: string; name: string; level: string };

// Students know their own courses each semester and it never exceeds this.
const MAX_COURSES = 8;
const MAX_RESULTS = 60;
const LEVEL_FILTERS = ['All', '100', '200', '300', '400', 'Diploma'];

const GRAIN = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")";

const levelLabel = (l: string) => (l === 'Diploma' ? 'Diploma' : `Level ${l}`);

export default function BookmarkedCourses({ courses }: { courses: BookmarkedCourse[] }) {
  const router = useRouter();
  const supabase = createClient();

  const [list, setList] = useState(courses);
  const [open, setOpen] = useState(false);
  const [allCourses, setAllCourses] = useState<CourseOption[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('All');
  const [picked, setPicked] = useState<string[]>([]);

  // Keep the panel in step with fresh server data after a save.
  useEffect(() => {
    setList(courses);
  }, [courses]);

  const removeBookmark = async (courseId: string) => {
    setList((prev) => prev.filter((c) => c.course_id !== courseId));
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('course_id', courseId);
    router.refresh();
  };

  const openPicker = async () => {
    setPicked(list.map((c) => c.course_id));
    setQuery('');
    setLevel('All');
    setSaveError('');
    setOpen(true);
    if (allCourses === null) {
      const { data, error } = await supabase
        .from('courses')
        .select('id, code, name, level')
        .eq('is_active', true)
        .order('code', { ascending: true });
      if (error) {
        setLoadError('Could not load the course list. Please try again.');
      } else {
        setLoadError('');
        setAllCourses((data ?? []) as CourseOption[]);
      }
    }
  };

  const toggle = (id: string) => {
    setPicked((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_COURSES) return prev;
      return [...prev, id];
    });
  };

  const byId = useMemo(() => {
    const m = new Map<string, CourseOption>();
    (allCourses ?? []).forEach((c) => m.set(c.id, c));
    // Courses already in the panel are always shown by name, even before the list loads.
    list.forEach((c) => {
      if (!m.has(c.course_id)) m.set(c.course_id, { id: c.course_id, code: c.code, name: c.name, level: c.level });
    });
    return m;
  }, [allCourses, list]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (allCourses ?? []).filter(
      (c) =>
        (level === 'All' || c.level === level) &&
        (!q || `${c.code} ${c.name}`.toLowerCase().includes(q))
    );
  }, [allCourses, query, level]);

  const save = async () => {
    setSaving(true);
    setSaveError('');
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      setSaveError('Please sign in again.');
      return;
    }
    const before = new Set(list.map((c) => c.course_id));
    const after = new Set(picked);
    const toAdd = picked.filter((id) => !before.has(id));
    const toRemove = Array.from(before).filter((id) => !after.has(id));

    if (toRemove.length > 0) {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', user.id)
        .in('course_id', toRemove);
      if (error) {
        setSaving(false);
        setSaveError('Could not save your courses. Please try again.');
        return;
      }
    }
    if (toAdd.length > 0) {
      const { error } = await supabase
        .from('bookmarks')
        .upsert(
          toAdd.map((course_id) => ({ user_id: user.id, course_id })),
          { onConflict: 'user_id,course_id', ignoreDuplicates: true }
        );
      if (error) {
        setSaving(false);
        setSaveError('Could not save your courses. Please try again.');
        return;
      }
    }
    setSaving(false);
    setOpen(false);
    router.refresh();
  };

  const full = picked.length >= MAX_COURSES;

  return (
    <div className="relative overflow-hidden flex flex-col min-h-[280px] rounded-none border border-[#D8D3C6] bg-[#EDEAE2]">
      <div
        className="absolute inset-0 pointer-events-none opacity-[.16]"
        style={{ backgroundImage: GRAIN, mixBlendMode: 'multiply' }}
      />
      <svg
        className="absolute -right-3.5 -bottom-[18px] w-[130px] h-[130px] opacity-10 pointer-events-none"
        viewBox="0 0 24 24" fill="none" stroke="#A45A2A" strokeWidth="1"
      >
        <path d="M6 2h12v20l-6-4-6 4V2z" />
      </svg>

      <div className="relative z-10 flex flex-col flex-1 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-lg text-navy">Your courses</h2>
          {list.length > 0 && (
            <button
              type="button"
              onClick={openPicker}
              className="font-condensed font-bold text-xs uppercase tracking-wide text-[#A45A2A] hover:underline"
            >
              Edit courses
            </button>
          )}
        </div>

        {list.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
            <p className="font-body text-sm text-g600 mb-4">
              You haven&apos;t chosen your courses yet. Pick the ones you&apos;re taking this semester
              to see their papers and materials here.
            </p>
            <button
              type="button"
              onClick={openPicker}
              className="inline-block bg-gold text-navy font-condensed font-bold text-xs uppercase px-4 py-2 rounded-none hover:bg-gold-light transition-colors"
            >
              Browse courses
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((c) => (
              <div
                key={c.course_id}
                className="flex items-center justify-between bg-white border border-[#D8D3C6] border-l-4 border-l-[#A45A2A] rounded-none px-4 py-3"
              >
                <Link href={`/library/past-questions?course=${c.course_id}`} className="min-w-0">
                  <div className="font-condensed font-bold text-sm text-navy truncate">
                    {c.code} · {c.name}
                  </div>
                  <div className="font-body text-xs text-g600 mt-0.5">
                    {c.past_paper_count} past papers · {c.study_material_count} materials
                  </div>
                </Link>
                <button
                  onClick={() => removeBookmark(c.course_id)}
                  aria-label={`Remove ${c.code} from your courses`}
                  className="flex-shrink-0 ml-3 w-7 h-7 flex items-center justify-center rounded-none text-g600 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-navy-deep/60 p-0 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Choose your courses"
          onClick={() => !saving && setOpen(false)}
        >
          <div
            className="bg-white w-full sm:max-w-3xl max-h-[92vh] flex flex-col rounded-none border border-[#D8D3C6]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 bg-[#EDEAE2] border-b border-[#D8D3C6]">
              <h3 className="font-display font-bold text-lg text-navy">Choose your courses</h3>
              <button
                type="button"
                onClick={() => !saving && setOpen(false)}
                className="font-condensed font-bold text-xs uppercase tracking-wide text-[#A45A2A] hover:underline"
              >
                Close ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by code or name, e.g. BGEC101 or Communication"
                className="w-full border border-navy px-3.5 py-3 text-sm font-body bg-white rounded-none"
                autoFocus
              />
              <div className="flex flex-wrap gap-1.5 my-3">
                {LEVEL_FILTERS.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLevel(l)}
                    className={`px-2.5 py-1 border font-condensed font-bold text-xs uppercase tracking-wide rounded-none ${
                      level === l ? 'bg-navy text-white border-navy' : 'bg-white text-navy border-[#D8D3C6]'
                    }`}
                  >
                    {l === 'All' || l === 'Diploma' ? l : `Level ${l}`}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[1.3fr_1fr] gap-4">
                <div className="border border-[#D8D3C6] max-h-[320px] overflow-y-auto">
                  {loadError ? (
                    <p className="p-4 text-sm font-body text-red-600">{loadError}</p>
                  ) : allCourses === null ? (
                    <p className="p-4 text-sm font-body text-g600 text-center">Loading courses…</p>
                  ) : results.length === 0 ? (
                    <p className="p-4 text-sm font-body text-g600 text-center">
                      No course matches. Try the code or part of the name.
                    </p>
                  ) : (
                    <>
                      {results.slice(0, MAX_RESULTS).map((c) => {
                        const on = picked.includes(c.id);
                        const disabled = !on && full;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            disabled={disabled}
                            onClick={() => toggle(c.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left border-b border-[#EEF1F8] hover:bg-[#F6F1E3] ${
                              disabled ? 'opacity-40 cursor-not-allowed' : ''
                            }`}
                          >
                            <span
                              className={`w-5 h-5 flex-shrink-0 flex items-center justify-center border-[1.5px] border-navy text-[13px] ${
                                on ? 'bg-gold' : 'bg-white'
                              }`}
                            >
                              {on ? '✓' : ''}
                            </span>
                            <span className="min-w-0">
                              <span className="block font-condensed font-bold text-sm text-navy">{c.code}</span>
                              <span className="block font-body text-xs text-g600 truncate">
                                {c.name} · {levelLabel(c.level)}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                      {results.length > MAX_RESULTS && (
                        <p className="p-3 text-xs font-body text-g600 text-center">
                          Showing the first {MAX_RESULTS} of {results.length}. Keep typing to narrow it down.
                        </p>
                      )}
                    </>
                  )}
                </div>

                <div className="bg-[#F6F1E3] border border-[#D8D3C6] p-3 min-h-[120px]">
                  <h4 className="font-display font-bold text-[15px] text-navy mb-2">
                    Your courses ({picked.length}/{MAX_COURSES})
                  </h4>
                  {picked.length === 0 ? (
                    <p className="text-sm font-body text-g600 text-center py-3">Nothing chosen yet.</p>
                  ) : (
                    picked.map((id) => {
                      const c = byId.get(id);
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => toggle(id)}
                          aria-label={`Remove ${c?.code ?? 'course'}`}
                          className="w-full flex items-center justify-between gap-2 bg-white border border-[#D8D3C6] px-3 py-2 mb-1.5 text-left"
                        >
                          <span className="min-w-0">
                            <span className="block font-condensed font-bold text-sm text-navy">{c?.code ?? 'Course'}</span>
                            <span className="block font-body text-xs text-g600 truncate">{c?.name ?? ''}</span>
                          </span>
                          <span className="text-base flex-shrink-0">✕</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-[#D8D3C6]">
              <span className={`font-body text-xs ${full ? 'text-red-700' : 'text-g600'}`}>
                {picked.length} of {MAX_COURSES} chosen{full ? ' · limit reached' : ''}
                {saveError && <span className="block text-red-600 mt-0.5">{saveError}</span>}
              </span>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="bg-gold text-navy font-condensed font-bold text-sm uppercase tracking-wide px-5 py-2.5 rounded-none hover:bg-gold-light transition-colors disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save courses'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
