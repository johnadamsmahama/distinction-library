'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { CourseOption } from '@/lib/papers-data';

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
const YEARS = Array.from({ length: 8 }, (_, i) => String(new Date().getFullYear() - i));

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.35'/%3E%3C/svg%3E\")";

// Fire-and-forget: tells the backend "a download happened" without
// blocking or delaying the actual file from opening. We deliberately
// don't await this in the click handler.
function trackDownload(type: Tab, id: string) {
  fetch('/api/track-download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, id }),
  }).catch(() => {
    // Silently ignore — a failed tracking ping should never interrupt
    // or error out the user's actual download.
  });
}

// Cross-origin `download` attributes/query params are unreliable on
// mobile Chrome — it falls back to showing the storage domain as the
// filename. Fetching the file and saving it as a blob forces the
// correct name on every browser, since the save then happens
// same-origin against the in-memory blob rather than the remote URL.
async function downloadFile(url: string, filename: string) {
  const safeName = filename.replace(/[\\/:*?"<>|]/g, '-'); // strip filesystem-unsafe chars
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = safeName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(blobUrl);
  } catch {
    // Fallback: if the fetch fails (e.g. CORS), just open the raw URL
    // so the user can still get the file, even with the wrong name.
    window.open(url, '_blank');
  }
}

/* ── Pill select chip ── */
function FilterPill({
  value,
  onChange,
  options,
  accent,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  accent: string;
}) {
  const active = value !== '';
  const textColor = active
    ? accent === '#E2BE5A' ? '#7A6010' : '#2E6B52'
    : '#555';

  return (
    <div className="relative flex-shrink-0">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none cursor-pointer rounded-none pl-3 pr-7 py-[5px] font-mono font-bold uppercase tracking-wide outline-none transition-all"
        style={{
          fontSize: 10,
          background: active ? accent + '18' : '#ffffff',
          border: `1.5px solid ${active ? accent : 'rgba(15,34,68,0.15)'}`,
          color: textColor,
          minWidth: 90,
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <div
        className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[9px]"
        style={{ color: active ? accent : '#aaa' }}
      >
        ▾
      </div>
    </div>
  );
}

/* ── Cream catalog card ── */
function ResultCard({
  code,
  name,
  type,
  tag,
  downloads,
  href,
  downloadName,
  accent,
  itemType,
  itemId,
}: {
  code: string;
  name: string;
  type: string;
  tag: string;
  downloads: number;
  href: string;
  downloadName: string;
  accent: string;
  itemType: Tab;
  itemId: string;
}) {
  return (
    <div
      className="flex overflow-hidden rounded-none relative group transition-transform hover:-translate-y-[1px]"
      style={{
        background: '#FBF6E8',
        boxShadow: '0 4px 18px rgba(6,15,30,0.5)',
      }}
    >
      {/* Watermark stamp */}
      <div
        className="absolute right-3 top-1/2 pointer-events-none select-none"
        style={{
          transform: 'translateY(-50%) rotate(-18deg)',
          fontSize: 30,
          fontWeight: 900,
          fontFamily: 'monospace',
          color: accent === '#E2BE5A' ? 'rgba(226,190,90,0.08)' : 'rgba(78,156,124,0.08)',
          lineHeight: 1,
        }}
      >
        {code}
      </div>

      {/* Left accent rail */}
      <div className="w-[3px] flex-shrink-0" style={{ background: accent }} />

      {/* Download link — wraps content + downloads on click */}
      <a
        href={href}
        onClick={(e) => {
          e.preventDefault();
          trackDownload(itemType, itemId);
          downloadFile(href, downloadName);
        }}
        className="px-3 py-2.5 flex-1 min-w-0"
        style={{ textDecoration: 'none', cursor: 'pointer' }}
      >
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="min-w-0">
            <div
              className="font-mono font-bold uppercase tracking-wider mb-0.5"
              style={{
                fontSize: 8.5,
                color: accent === '#E2BE5A' ? '#9A7B1A' : '#2E6B52',
              }}
            >
              {code}
            </div>
            <div className="font-display font-bold text-navy truncate" style={{ fontSize: 13, lineHeight: 1.25 }}>
              {name}
            </div>
          </div>
          <div className="text-center flex-shrink-0 pt-0.5">
            <div className="font-condensed font-bold text-navy" style={{ fontSize: 15, lineHeight: 1 }}>
              {downloads}
            </div>
            <div className="font-mono text-[7px] text-g600 tracking-wide">DL</div>
          </div>
        </div>

        <div className="flex gap-1.5 flex-wrap">
          <span
            className="font-mono font-bold uppercase rounded-none px-1.5 py-0.5"
            style={{
              fontSize: 7.5,
              letterSpacing: '0.06em',
              background: accent + '18',
              border: `1px solid ${accent}55`,
              color: accent === '#E2BE5A' ? '#7A6010' : '#2E6B52',
            }}
          >
            {type}
          </span>
          <span
            className="font-mono font-bold uppercase rounded-none px-1.5 py-0.5"
            style={{
              fontSize: 7.5,
              background: 'rgba(15,34,68,0.07)',
              color: '#777',
            }}
          >
            {tag}
          </span>
        </div>
      </a>

      {/* Right-side actions: Solve (papers only) + Download arrow */}
      <div className="flex items-center gap-1.5 pr-3 flex-shrink-0">
        {itemType === 'papers' && (
          <a
            href={`/papers/${itemId}/solutions`}
            className="flex items-center gap-1 rounded-none px-2 py-1 transition-all hover:brightness-110"
            style={{
              background: '#0F2244',
              border: '1px solid rgba(226,190,90,0.4)',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#E2BE5A" strokeWidth="2.5">
              <path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
            <span
              className="font-mono font-bold uppercase tracking-wide"
              style={{ fontSize: 7.5, color: '#E2BE5A' }}
            >
              Solve
            </span>
          </a>
        )}
        <a
          href={href}
          onClick={(e) => {
            e.preventDefault();
            trackDownload(itemType, itemId);
            downloadFile(href, downloadName);
          }}
          className="w-7 h-7 rounded-none flex items-center justify-center transition-all group-hover:scale-110"
          style={{
            background: accent + '18',
            border: `1px solid ${accent}44`,
            cursor: 'pointer',
          }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.5">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </a>
      </div>
    </div>
  );
}

/* ── Empty state ── */
function EmptyState({ tab, accent }: { tab: Tab; accent: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-5">
      {/* Shelf illustration */}
      <div className="relative" style={{ width: 88, height: 56 }}>
        {[
          { left: 0, height: 38, color: 'rgba(226,190,90,0.15)', border: 'rgba(226,190,90,0.3)' },
          { left: 26, height: 48, color: 'rgba(78,156,124,0.15)', border: 'rgba(78,156,124,0.3)' },
          { left: 52, height: 30, color: 'rgba(226,190,90,0.1)', border: 'rgba(226,190,90,0.2)' },
        ].map((b, i) => (
          <div
            key={i}
            className="absolute bottom-0 rounded-none"
            style={{ left: b.left, width: 20, height: b.height, background: b.color, border: `1px solid ${b.border}` }}
          />
        ))}
        <div
          className="absolute rounded-none"
          style={{ bottom: -1, left: -6, right: -6, height: 2, background: 'rgba(255,255,255,0.1)' }}
        />
      </div>

      <div className="text-center">
        <div className="font-display font-bold text-white/60 text-sm mb-1">
          Nothing on these shelves yet
        </div>
        <div className="font-mono text-[10px] text-white/30 tracking-wide uppercase">
          Be the first to contribute{tab === 'papers' ? ' a past paper' : ' study materials'}
        </div>
      </div>

      <a
        href="/papers/upload"
        className="font-mono font-bold uppercase tracking-wide rounded-none px-4 py-2 text-[10px] transition-all hover:brightness-110"
        style={{
          background: accent,
          color: accent === '#E2BE5A' ? '#0F2244' : '#fff',
        }}
      >
        Upload a resource
      </a>
    </div>
  );
}

/* ── Main component ── */
export default function RepositoryBrowser({
  courses,
  departments,
  initialCourseId,
  initialTab,
}: {
  courses: CourseOption[];
  departments: string[];
  initialCourseId?: string;
  initialTab?: Tab;
}) {
  const [tab, setTab] = useState<Tab>(initialTab ?? 'papers');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
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

  const accent = tab === 'papers' ? '#E2BE5A' : '#4E9C7C';

  const filteredCourses = useMemo(
    () => courses.filter((c) => (!level || c.level === level) && (!department || c.department === department)),
    [courses, level, department]
  );

  useEffect(() => {
    if (courseId && !filteredCourses.some((c) => c.id === courseId)) setCourseId('');
  }, [filteredCourses]);

  // Debounce the free-text search so we don't fire a query on every
  // keystroke — wait 300ms after the user stops typing.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    async function fetchResults() {
      setLoading(true);
      const term = debouncedSearch;

      if (tab === 'papers') {
        let query = supabase
          .from('past_papers')
          .select('id, year, exam_type, file_url, watermarked_url, download_count, created_at, courses!inner(id, code, name, department, level)')
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(100);
        if (courseId) query = query.eq('course_id', courseId);
        if (level) query = query.eq('courses.level', level);
        if (department) query = query.eq('courses.department', department);
        if (year) query = query.eq('year', Number(year));
        if (examType) query = query.eq('exam_type', examType);
        // Search course code/name directly in the query, rather than
        // filtering client-side after the fact — otherwise papers
        // outside the most recent 100 approved rows are never seen,
        // no matter how well they match the search term.
        if (term) {
          query = query.or(`code.ilike.%${term}%,name.ilike.%${term}%`, { foreignTable: 'courses' });
        }
        const { data } = await query;
        if (!cancelled) setPapers((data as unknown as PaperResult[]) ?? []);
      } else {
        let query = supabase
          .from('study_materials')
          .select('id, title, content_type, week_number, file_url, download_count, created_at, courses!inner(id, code, name, department, level)')
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(100);
        if (courseId) query = query.eq('course_id', courseId);
        if (level) query = query.eq('courses.level', level);
        if (department) query = query.eq('courses.department', department);
        if (week) query = query.eq('week_number', Number(week));
        if (contentType) query = query.eq('content_type', contentType);
        if (term) {
          query = query.or(`code.ilike.%${term}%,name.ilike.%${term}%`, { foreignTable: 'courses' });
        }
        const { data } = await query;
        if (!cancelled) setMaterials((data as unknown as MaterialResult[]) ?? []);
      }
      if (!cancelled) setLoading(false);
    }
    fetchResults();
    return () => { cancelled = true; };
  }, [tab, courseId, level, department, year, examType, week, contentType, debouncedSearch]);

  const visiblePapers = papers;
  const visibleMaterials = materials;
  const resultCount = tab === 'papers' ? visiblePapers.length : visibleMaterials.length;

  return (
    <div
      style={{
        backgroundImage: 'radial-gradient(120% 60% at 50% 0%, #0F2244 0%, #0D2B5E 45%, #060F1E 100%)',
        minHeight: '100%',
      }}
    >
      {/* Grain overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.2]"
        style={{ backgroundImage: GRAIN, mixBlendMode: 'overlay' }}
      />

      {/* ── HERO ── */}
      <div className="relative px-4 sm:px-6 lg:px-8 pt-10 pb-0">

        {/* Title row */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="font-mono font-bold uppercase tracking-[0.14em] text-gold mb-1.5 opacity-80" style={{ fontSize: 9 }}>
              Library
            </div>
            <h1 className="font-display font-bold text-white leading-tight" style={{ fontSize: 22 }}>
              Past Questions &<br />Study Materials
            </h1>
          </div>
          <a
            href="/papers/upload"
            className="font-mono font-bold uppercase tracking-wide rounded-none border border-gold/35 text-gold hover:bg-gold/10 transition-colors flex-shrink-0 mt-1"
            style={{ fontSize: 8.5, padding: '5px 11px' }}
          >
            + Contribute
          </a>
        </div>

        {/* ── TAB BUTTONS — truly separate, no shared bar ── */}
        <div className="flex items-center justify-between mb-2.5">
          {/* PAST PAPERS — left edge, aligns with search bar */}
          <button
            onClick={() => setTab('papers')}
            className="font-mono font-bold uppercase tracking-wide rounded-none transition-all"
            style={{
              fontSize: 9,
              padding: '6px 14px',
              background: tab === 'papers' ? '#E2BE5A' : '#ffffff',
              border: tab === 'papers' ? 'none' : '1.5px solid rgba(226,190,90,0.35)',
              color: tab === 'papers' ? '#0F2244' : 'rgba(226,190,90,0.6)',
            }}
          >
            Past Papers
          </button>

          {/* Pure gap — naked navy, nothing connecting them */}
          <div className="flex-1" />

          {/* STUDY MATERIALS — right edge, aligns with search bar */}
          <button
            onClick={() => setTab('materials')}
            className="font-mono font-bold uppercase tracking-wide rounded-none transition-all"
            style={{
              fontSize: 9,
              padding: '6px 14px',
              background: tab === 'materials' ? '#4E9C7C' : '#ffffff',
              border: tab === 'materials' ? 'none' : '1.5px solid rgba(78,156,124,0.35)',
              color: tab === 'materials' ? '#ffffff' : 'rgba(78,156,124,0.6)',
            }}
          >
            Study Materials
          </button>
        </div>

        {/* ── SEARCH ── */}
        <div
          className="flex items-center gap-3 rounded-none px-3.5 py-2.5 mb-3 transition-all"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: `1.5px solid ${accent}66`,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.5" className="flex-shrink-0">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search by course code or name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none font-mono text-white placeholder:text-white/35"
            style={{ fontSize: 11 }}
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-white/40 hover:text-white/70 transition-colors text-xs">✕</button>
          )}
        </div>

        {/* ── FILTER CHIP STRIP ── */}
        <div className="relative pb-0">
          <div
            className="flex gap-2 overflow-x-auto pb-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', paddingRight: 40 }}
          >
            <FilterPill
              value={department}
              onChange={setDepartment}
              accent={accent}
              options={[{ value: '', label: 'All Depts' }, ...departments.map((d) => ({ value: d, label: d }))]}
            />
            <FilterPill
              value={level}
              onChange={setLevel}
              accent={accent}
              options={[{ value: '', label: 'All Levels' }, ...LEVELS.map((l) => ({ value: l, label: `Level ${l}` }))]}
            />
            <FilterPill
              value={courseId}
              onChange={setCourseId}
              accent={accent}
              options={[{ value: '', label: 'All Courses' }, ...filteredCourses.map((c) => ({ value: c.id, label: c.code }))]}
            />
            {tab === 'papers' ? (
              <>
                <FilterPill
                  value={examType}
                  onChange={setExamType}
                  accent={accent}
                  options={[
                    { value: '', label: 'All Types' },
                    { value: 'mid_semester', label: 'Mid-Sem' },
                    { value: 'end_of_semester', label: 'End of Sem' },
                  ]}
                />
                <FilterPill
                  value={year}
                  onChange={setYear}
                  accent={accent}
                  options={[{ value: '', label: 'Any Year' }, ...YEARS.map((y) => ({ value: y, label: y }))]}
                />
              </>
            ) : (
              <>
                <FilterPill
                  value={contentType}
                  onChange={setContentType}
                  accent={accent}
                  options={[
                    { value: '', label: 'All Types' },
                    { value: 'lecture_slides', label: 'Slides' },
                    { value: 'study_notes', label: 'Notes' },
                  ]}
                />
                <FilterPill
                  value={week}
                  onChange={setWeek}
                  accent={accent}
                  options={[{ value: '', label: 'All Weeks' }, ...WEEKS.map((w) => ({ value: String(w), label: `Week ${w}` }))]}
                />
              </>
            )}
          </div>

          {/* Right-fade + › scroll indicator */}
          <div
            className="absolute right-0 top-0 pointer-events-none flex items-center justify-end pr-1"
            style={{
              width: 48,
              height: 'calc(100% - 16px)',
              background: 'linear-gradient(to right, transparent 0%, #0D2B5E 60%)',
            }}
          >
            <div
              className="flex items-center justify-center rounded-none"
              style={{
                width: 20, height: 20,
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.22)',
              }}
            >
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="3">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* ── RESULTS ── */}
      <div className="relative px-4 sm:px-6 lg:px-8 pb-10 pt-2">

        {/* Count + sort row */}
        {!loading && (
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono uppercase tracking-wide text-white/30" style={{ fontSize: 9 }}>
              {resultCount} {resultCount === 1 ? 'result' : 'results'}
            </span>
            <span className="font-mono uppercase tracking-wide cursor-pointer" style={{ fontSize: 9, color: accent + 'aa' }}>
              Sort ↕
            </span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col gap-2.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-none h-[72px] animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />
            ))}
          </div>
        ) : tab === 'papers' ? (
          visiblePapers.length === 0 ? (
            <EmptyState tab={tab} accent={accent} />
          ) : (
            <div className="flex flex-col gap-2.5">
              {visiblePapers.map((p) => (
                <ResultCard
                  key={p.id}
                  code={p.courses.code}
                  name={p.courses.name}
                  type={p.exam_type === 'mid_semester' ? 'Mid-Semester' : 'End of Semester'}
                  tag={String(p.year)}
                  downloads={p.download_count}
                  href={p.watermarked_url ?? p.file_url}
                  downloadName={`${p.courses.code} ${p.exam_type === 'mid_semester' ? 'Mid-Sem' : 'End-of-Sem'} ${p.year}.pdf`}
                  accent={accent}
                  itemType="papers"
                  itemId={p.id}
                />
              ))}
            </div>
          )
        ) : visibleMaterials.length === 0 ? (
          <EmptyState tab={tab} accent={accent} />
        ) : (
          <div className="flex flex-col gap-2.5">
            {visibleMaterials.map((m) => (
              <ResultCard
                key={m.id}
                code={m.courses.code}
                name={m.title}
                type={CONTENT_TYPE_LABEL[m.content_type]}
                tag={m.week_number ? `Wk ${m.week_number}` : 'Material'}
                downloads={m.download_count}
                href={m.file_url}
                downloadName={`${m.courses.code} - ${m.title}.pdf`}
                accent={accent}
                itemType="materials"
                itemId={m.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
