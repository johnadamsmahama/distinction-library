'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Paper = {
  id: string;
  year: number;
  exam_type: 'mid_semester' | 'end_of_semester';
  file_url: string;
  watermarked_url: string | null;
  download_count: number;
  created_at: string;
  courses: { id: string; code: string; name: string; department: string; level: string };
};

const mono = 'font-[family-name:var(--font-courier-prime)]';

const LIB_BG = '#D9CBA3';
const LIB_CARD = '#F3EAD3';
const LIB_INK = '#1B4332';
const LIB_INK_SOFT = '#5C5236';
const LIB_STAMP = '#A6431F';

const LEVELS = ['100', '200', '300', '400'];

// Fire-and-forget: same pattern used across the library — tells the
// backend a download happened without blocking the file from opening.
function trackDownload(id: string) {
  fetch('/api/track-download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'papers', id }),
  }).catch(() => {
    // Silently ignore — a failed tracking ping should never interrupt
    // or error out the user's actual download.
  });
}

// Cross-origin `download` attributes are unreliable on mobile Chrome, so
// we fetch the file and save it as a blob to force the correct filename.
async function downloadFile(url: string, filename: string) {
  const safeName = filename.replace(/[\\/:*?"<>|]/g, '-');
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
    window.open(url, '_blank');
  }
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative w-full">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full appearance-none cursor-pointer rounded-none pl-2 pr-5 py-[6px] font-bold uppercase tracking-wide outline-none ${mono}`}
        style={{ fontSize: 8.5, background: LIB_CARD, border: `1.5px solid ${LIB_INK}33`, color: LIB_INK }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ fontSize: 8, color: LIB_INK_SOFT }}>
        ▾
      </div>
    </div>
  );
}

/* ── The pulled-drawer catalog card ── */
function CatalogCard({ paper }: { paper: Paper }) {
  const examLabel = paper.exam_type === 'mid_semester' ? 'Mid-Semester' : 'End of Semester';
  const downloadName = `${paper.courses.code} ${paper.exam_type === 'mid_semester' ? 'Mid-Sem' : 'End-of-Sem'} ${paper.year}.pdf`;
  const href = paper.watermarked_url ?? paper.file_url;

  return (
    <div
      className="relative mb-3"
      style={{
        background: LIB_CARD,
        padding: '16px 14px 15px',
        clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 0 100%)',
        boxShadow: '0 3px 10px rgba(27,67,50,0.15)',
      }}
    >
      <div className="flex items-start justify-between mb-0.5">
        <div>
          <div className={`font-bold ${mono}`} style={{ fontSize: 12, color: LIB_INK }}>
            {paper.courses.code}
          </div>
          <div className="font-display font-bold" style={{ fontSize: 13.5, color: LIB_INK, marginTop: 1 }}>
            {paper.courses.name}
          </div>
        </div>
        <div className={`flex-shrink-0 ${mono}`} style={{ fontSize: 7.5, color: LIB_INK_SOFT, paddingTop: 2 }}>
          {paper.download_count} downloads
        </div>
      </div>

      <div
        className="flex items-center justify-between"
        style={{ marginTop: 9, borderTop: `1px dashed ${LIB_INK}44`, paddingTop: 8 }}
      >
        <div className="flex items-center gap-1.5">
          <span
            className={`font-bold uppercase inline-block ${mono}`}
            style={{
              fontSize: 8, color: LIB_STAMP, letterSpacing: '0.03em', transform: 'rotate(-2deg)',
              border: `1px solid ${LIB_STAMP}55`, padding: '2px 5px',
            }}
          >
            {examLabel}
          </span>
          <span className={`uppercase ${mono}`} style={{ fontSize: 7.5, color: LIB_INK_SOFT, letterSpacing: '0.04em' }}>
            {paper.year}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <a
            href={`/papers/${paper.id}/solutions`}
            className={`flex items-center gap-1 uppercase font-bold ${mono}`}
            style={{ fontSize: 7.5, letterSpacing: '0.03em', padding: '4px 7px', background: LIB_INK, color: '#E2BE5A' }}
          >
            ✓ Solve
          </a>
          <a
            href={href}
            onClick={(e) => {
              e.preventDefault();
              trackDownload(paper.id);
              downloadFile(href, downloadName);
            }}
            className={`flex items-center gap-1 uppercase font-bold cursor-pointer ${mono}`}
            style={{ fontSize: 7.5, letterSpacing: '0.03em', padding: '4px 7px', border: `1.3px solid ${LIB_INK}55`, color: LIB_INK }}
          >
            ↓ Download
          </a>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ noneAtAll }: { noneAtAll: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-4 text-center">
      <div className={`font-display font-bold ${mono}`} style={{ fontSize: 13, color: LIB_INK }}>
        Nothing on these shelves yet
      </div>
      <div className={`uppercase tracking-wide ${mono}`} style={{ fontSize: 9, color: LIB_INK_SOFT }}>
        {noneAtAll ? 'Be the first to contribute a past paper' : 'Try a different search or filter'}
      </div>
      {noneAtAll && (
        <a
          href="/papers/upload"
          className={`font-bold uppercase tracking-wide inline-block ${mono}`}
          style={{ fontSize: 10, padding: '8px 16px', background: LIB_INK, color: '#E2BE5A' }}
        >
          Upload a resource
        </a>
      )}
    </div>
  );
}

export default function PastQuestionsBrowser() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [level, setLevel] = useState('');
  const [courseId, setCourseId] = useState('');
  const [examType, setExamType] = useState('');
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    async function fetchPapers() {
      setLoading(true);
      let query = supabase
        .from('past_papers')
        .select('id, year, exam_type, file_url, watermarked_url, download_count, created_at, courses!inner(id, code, name, department, level)')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(100);
      if (courseId) query = query.eq('course_id', courseId);
      if (level) query = query.eq('courses.level', level);
      if (examType) query = query.eq('exam_type', examType);
      if (debouncedSearch) {
        query = query.or(`code.ilike.%${debouncedSearch}%,name.ilike.%${debouncedSearch}%`, { foreignTable: 'courses' });
      }
      const { data } = await query;
      if (!cancelled) {
        setPapers((data as unknown as Paper[]) ?? []);
        setLoading(false);
      }
    }
    fetchPapers();
    return () => {
      cancelled = true;
    };
  }, [level, courseId, examType, debouncedSearch]);

  // Course options for the filter, derived from whatever's on the
  // shelves right now — same self-contained pattern as the other
  // library pages, no separate courses prop required.
  const courseOptionsMap = useMemo(() => {
    const map = new Map<string, { id: string; code: string; level: string }>();
    papers.forEach((p) => map.set(p.courses.id, p.courses));
    return map;
  }, [papers]);
  const filteredCourseOptions = useMemo(
    () => Array.from(courseOptionsMap.values()).filter((c) => !level || c.level === level),
    [courseOptionsMap, level]
  );

  useEffect(() => {
    if (courseId && !filteredCourseOptions.some((c) => c.id === courseId)) setCourseId('');
  }, [filteredCourseOptions, courseId]);

  return (
    <div className="relative" style={{ background: LIB_BG, minHeight: '100vh' }}>
      <div className="max-w-[480px] mx-auto px-4 pt-6 pb-10">
        {/* Punched rod — the catalog-drawer detail */}
        <div className="flex justify-center gap-6 mb-3.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className="rounded-full" style={{ width: 7, height: 7, background: '#00000022' }} />
          ))}
        </div>
        <div className={`text-right ${mono}`} style={{ fontSize: 8, letterSpacing: '0.1em', color: LIB_INK_SOFT, marginBottom: 2 }}>
          CAT. NO. 002 — EXAM
        </div>
        <div className={`font-bold uppercase ${mono}`} style={{ fontSize: 9, letterSpacing: '0.16em', color: '#2F5A45' }}>
          Library
        </div>
        <h1
          className="font-display font-black"
          style={{ fontSize: 23, color: LIB_INK, margin: '4px 0 10px', borderBottom: `1.5px solid ${LIB_INK}55`, paddingBottom: 10 }}
        >
          Past Questions Bank
        </h1>

        <div
          className="flex items-center gap-2 mb-2.5"
          style={{ background: LIB_CARD, border: `1.5px solid ${LIB_INK}33`, padding: '9px 12px' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2F5A45" strokeWidth="2.5" className="flex-shrink-0">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search by course code or name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`flex-1 bg-transparent outline-none ${mono}`}
            style={{ fontSize: 10.5, color: LIB_INK }}
          />
          {search && (
            <button onClick={() => setSearch('')} className="transition-colors text-xs" style={{ color: `${LIB_INK}66` }}>
              ✕
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-1.5 mb-3">
          <FilterSelect
            value={level}
            onChange={setLevel}
            options={[{ value: '', label: 'All Levels' }, ...LEVELS.map((l) => ({ value: l, label: `Level ${l}` }))]}
          />
          <FilterSelect
            value={courseId}
            onChange={setCourseId}
            options={[{ value: '', label: 'All Courses' }, ...filteredCourseOptions.map((c) => ({ value: c.id, label: c.code }))]}
          />
          <FilterSelect
            value={examType}
            onChange={setExamType}
            options={[
              { value: '', label: 'All Types' },
              { value: 'mid_semester', label: 'Mid-Sem' },
              { value: 'end_of_semester', label: 'End of Sem' },
            ]}
          />
        </div>

        {!loading && (
          <div className="flex items-center justify-between mb-2.5">
            <span className={`uppercase tracking-wide ${mono}`} style={{ fontSize: 9, color: LIB_INK_SOFT }}>
              {papers.length} {papers.length === 1 ? 'result' : 'results'}
            </span>
            <span className={`uppercase tracking-wide cursor-pointer ${mono}`} style={{ fontSize: 9, color: `${LIB_STAMP}aa` }}>
              Sort ↕
            </span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col gap-2.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse" style={{ height: 82, background: 'rgba(27,67,50,0.06)' }} />
            ))}
          </div>
        ) : papers.length === 0 ? (
          <EmptyState noneAtAll={papers.length === 0 && !debouncedSearch && !level && !courseId && !examType} />
        ) : (
          <div>
            {papers.map((p) => (
              <CatalogCard key={p.id} paper={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
