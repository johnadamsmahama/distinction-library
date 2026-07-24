'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { CourseOption } from '@/lib/papers-data';
import CustomSelect from '@/components/ui/CustomSelect';

type Tab = 'papers' | 'materials';

type PaperResult = {
  id: string;
  year: number;
  exam_type: 'mid_semester' | 'end_of_semester';
  file_url: string;
  watermarked_url: string | null;
  download_count: number;
  created_at: string;
  courses: { id: string; code: string; name: string; department: string; level: string };
};

type MaterialResult = {
  id: string;
  title: string;
  content_type: 'lecture_slides' | 'study_notes' | 'study_guide';
  week_number: number | null;
  file_url: string;
  download_count: number;
  created_at: string;
  courses: { id: string; code: string; name: string; department: string; level: string };
};

const CONTENT_TYPE_LABEL: Record<string, string> = {
  lecture_slides: 'Lecture Slides',
  study_notes: 'Study Notes',
  study_guide: 'Study Guide',
};

const LEVELS = ['100', '200', '300', '400'];
const WEEKS = Array.from({ length: 14 }, (_, i) => i + 1);

export default function RepositoryBrowser({
  courses,
  departments,
  initialCourseId,
}: {
  courses: CourseOption[];
  departments: string[];
  initialCourseId?: string;
}) {
  const [tab, setTab] = useState<Tab>('papers');
  const [search, setSearch] = useState('');
  const [courseId, setCourseId] = useState(initialCourseId ?? '');
  const [level, setLevel] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [examType, setExamType] = useState('');
  const [week, setWeek] = useState('');
  const [contentType, setContentType] = useState('');

  const [papers, setPapers] = useState<PaperResult[]>([]);
  const [materials, setMaterials] = useState<MaterialResult[]>([]);
  const [loading, setLoading] = useState(true);

  const filteredCourses = useMemo(
    () =>
      courses.filter(
        (c) => (!level || c.level === level) && (!department || c.department === department)
      ),
    [courses, level, department]
  );

  useEffect(() => {
    // If the selected course no longer matches level/department filters, clear it.
    if (courseId && !filteredCourses.some((c) => c.id === courseId)) {
      setCourseId('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredCourses]);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function fetchResults() {
      setLoading(true);

      if (tab === 'papers') {
        let query = supabase
          .from('past_papers')
          .select(
            'id, year, exam_type, file_url, watermarked_url, download_count, created_at, courses!inner(id, code, name, department, level)'
          )
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(100);

        if (courseId) query = query.eq('course_id', courseId);
        if (level) query = query.eq('courses.level', level);
        if (department) query = query.eq('courses.department', department);
        if (year) query = query.eq('year', Number(year));
        if (examType) query = query.eq('exam_type', examType);

        const { data } = await query;
        if (!cancelled) setPapers((data as unknown as PaperResult[]) ?? []);
      } else {
        let query = supabase
          .from('study_materials')
          .select(
            'id, title, content_type, week_number, file_url, download_count, created_at, courses!inner(id, code, name, department, level)'
          )
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(100);

        if (courseId) query = query.eq('course_id', courseId);
        if (level) query = query.eq('courses.level', level);
        if (department) query = query.eq('courses.department', department);
        if (week) query = query.eq('week_number', Number(week));
        if (contentType) query = query.eq('content_type', contentType);

        const { data } = await query;
        if (!cancelled) setMaterials((data as unknown as MaterialResult[]) ?? []);
      }

      if (!cancelled) setLoading(false);
    }

    fetchResults();
    return () => {
      cancelled = true;
    };
  }, [tab, courseId, level, department, year, examType, week, contentType]);

  const term = search.trim().toLowerCase();
  const visiblePapers = papers.filter(
    (p) =>
      !term ||
      p.courses.code.toLowerCase().includes(term) ||
      p.courses.name.toLowerCase().includes(term)
  );
  const visibleMaterials = materials.filter(
    (m) =>
      !term ||
      m.courses.code.toLowerCase().includes(term) ||
      m.courses.name.toLowerCase().includes(term) ||
      m.title.toLowerCase().includes(term)
  );

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('papers')}
          className={`font-condensed font-bold text-sm uppercase tracking-wide px-5 py-2.5 rounded-lg transition-colors ${
            tab === 'papers' ? 'bg-navy text-white' : 'bg-white border border-g100 text-g600'
          }`}
        >
          Past Papers
        </button>
        <button
          onClick={() => setTab('materials')}
          className={`font-condensed font-bold text-sm uppercase tracking-wide px-5 py-2.5 rounded-lg transition-colors ${
            tab === 'materials' ? 'bg-navy text-white' : 'bg-white border border-g100 text-g600'
          }`}
        >
          Study Materials
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by course code or name…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-3 mb-4 rounded-lg border border-g100 font-body text-[15px] text-g800 outline-none focus:border-gold transition-colors"
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <CustomSelect
          value={department}
          onChange={setDepartment}
          placeholder="All departments"
          className="w-full sm:w-56"
          options={[
            { value: '', label: 'All departments' },
            ...departments.map((d) => ({ value: d, label: d })),
          ]}
        />

        <CustomSelect
          value={level}
          onChange={setLevel}
          placeholder="All levels"
          className="w-full sm:w-40"
          options={[
            { value: '', label: 'All levels' },
            ...LEVELS.map((l) => ({ value: l, label: `Level ${l}` })),
          ]}
        />

        <CustomSelect
          value={courseId}
          onChange={setCourseId}
          placeholder="All courses"
          className="w-full sm:w-64"
          options={[
            { value: '', label: 'All courses' },
            ...filteredCourses.map((c) => ({ value: c.id, label: `${c.code} — ${c.name}` })),
          ]}
        />

        {tab === 'papers' ? (
          <>
            <CustomSelect
              value={examType}
              onChange={setExamType}
              placeholder="All exam types"
              className="w-full sm:w-48"
              options={[
                { value: '', label: 'All exam types' },
                { value: 'mid_semester', label: 'Mid-Semester' },
                { value: 'end_of_semester', label: 'End of Semester' },
              ]}
            />
            <input
              type="number"
              placeholder="Year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="px-3.5 py-2.5 rounded-lg border border-g100 bg-white font-condensed font-medium text-[13px] text-g800 outline-none focus:border-gold transition-colors w-28"
            />
          </>
        ) : (
          <>
            <CustomSelect
              value={contentType}
              onChange={setContentType}
              placeholder="All material types"
              className="w-full sm:w-52"
              options={[
                { value: '', label: 'All material types' },
                { value: 'lecture_slides', label: 'Lecture Slides' },
                { value: 'study_notes', label: 'Study Notes' },
                { value: 'study_guide', label: 'Study Guide' },
              ]}
            />
            <CustomSelect
              value={week}
              onChange={setWeek}
              placeholder="All weeks"
              className="w-full sm:w-40"
              options={[
                { value: '', label: 'All weeks' },
                ...WEEKS.map((w) => ({ value: String(w), label: `Week ${w}` })),
              ]}
            />
          </>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <p className="font-body text-sm text-g600">Loading…</p>
      ) : tab === 'papers' ? (
        <ResultsList
          empty="No past papers match those filters yet."
          items={visiblePapers.map((p) => ({
            id: p.id,
            title: `${p.courses.code} — ${p.exam_type === 'mid_semester' ? 'Mid-Semester' : 'End of Semester'} ${p.year}`,
            subtitle: p.courses.name,
            tag: `${p.year}`,
            href: p.watermarked_url ?? p.file_url,
          }))}
        />
      ) : (
        <ResultsList
          empty="No study materials match those filters yet."
          items={visibleMaterials.map((m) => ({
            id: m.id,
            title: `${m.courses.code} — ${m.title}`,
            subtitle: m.week_number ? `Week ${m.week_number} · ${CONTENT_TYPE_LABEL[m.content_type]}` : CONTENT_TYPE_LABEL[m.content_type],
            tag: m.week_number ? `Wk ${m.week_number}` : CONTENT_TYPE_LABEL[m.content_type],
            href: m.file_url,
          }))}
        />
      )}
    </div>
  );
}

function ResultsList({
  items,
  empty,
}: {
  items: { id: string; title: string; subtitle: string; tag: string; href: string }[];
  empty: string;
}) {
  if (items.length === 0) {
    return <p className="font-body text-sm text-g600 text-center py-12">{empty}</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between bg-white border border-g100 rounded-xl px-4 py-3.5 hover:border-gold transition-colors"
        >
          <div className="min-w-0 flex items-center gap-3">
            <span className="flex-shrink-0 font-condensed font-bold text-[10px] uppercase tracking-wide text-gold bg-gold/10 px-2 py-1 rounded">
              {item.tag}
            </span>
            <div className="min-w-0">
              <div className="font-condensed font-semibold text-sm text-g800 truncate">{item.title}</div>
              <div className="font-body text-xs text-g600 truncate">{item.subtitle}</div>
            </div>
          </div>
          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 ml-3 font-condensed font-bold text-xs uppercase tracking-wide text-navy border border-g100 rounded-lg px-3 py-2 hover:border-gold transition-colors"
          >
            Download
          </a>
        </div>
      ))}
    </div>
  );
}