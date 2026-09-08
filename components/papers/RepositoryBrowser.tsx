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

const LEVELS = ['100', '200', '300', '400'];
const WEEKS = Array.from({ length: 14 }, (_, i) => i + 1);

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


/* ══════════════════════════════════════════════════════════
   Lecture Slides — cream/paper theme, sharp corners,
   horizontal bordered cards.
   ══════════════════════════════════════════════════════════ */

const MAT_INK = '#17233F';
const MAT_INK_SOFT = '#3C4A68';
const MAT_RUST = '#B1502F';
const MAT_GOLD = '#C69A3D';
const MAT_CARD = '#FBF7ED';
const MAT_BG = '#F1E9D8';

/* Past Questions Bank palette — blush page, white cards, rust rail (Set 1) */
const PAP_INK = '#3A2A24';
const PAP_INK_SOFT = '#6B5A52';
const PAP_RUST = '#B1633F';
const PAP_RUST_DEEP = '#8C4A34';
const PAP_CARD = '#FFFFFF';
const PAP_BG = '#F4E1DA';
const PAP_CHIP = '#F4E1DA';
const PAP_BORDER = 'rgba(58,42,36,0.16)';

/* ── Cream filter select ── */
function MaterialFilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const active = value !== '';
  return (
    <div className="relative w-full">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none cursor-pointer rounded-none pl-3 pr-7 py-[5px] font-mono font-bold uppercase tracking-wide outline-none transition-all"
        style={{
          fontSize: 10,
          background: active ? MAT_RUST + '18' : MAT_CARD,
          border: `1.5px solid ${active ? MAT_RUST : 'rgba(23,35,63,0.15)'}`,
          color: active ? '#7A3A20' : MAT_INK_SOFT,
          minWidth: 0,
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
        style={{ color: active ? MAT_RUST : '#999' }}
      >
        ▾
      </div>
    </div>
  );
}

/* ── Horizontal material card — cream/paper, sharp corners ── */
function MaterialCard({
  code,
  name,
  tag,
  downloads,
  href,
  downloadName,
  itemId,
}: {
  code: string;
  name: string;
  tag: string;
  downloads: number;
  href: string;
  downloadName: string;
  itemId: string;
}) {
  return (
    <div
      className="flex rounded-none overflow-hidden"
      style={{ background: '#FFFFFF', border: '1.5px solid rgba(23,35,63,0.16)' }}
    >
      {/* Sharp left rust rail — no rounded corners anywhere on this card */}
      <div className="w-1 flex-shrink-0 rounded-none" style={{ background: MAT_RUST }} />

      <a
        href={href}
        onClick={(e) => {
          e.preventDefault();
          trackDownload('materials', itemId);
          downloadFile(href, downloadName);
        }}
        className="flex-1 min-w-0 px-3 py-[11px]"
        style={{ textDecoration: 'none', cursor: 'pointer' }}
      >
        <div className="flex items-center justify-between gap-2 mb-1">
          <span
            className="font-mono font-bold uppercase tracking-wide"
            style={{ fontSize: 9, color: MAT_GOLD }}
          >
            {code}
          </span>
          <span
            className="font-mono font-bold uppercase rounded-none px-1.5 py-0.5 flex-shrink-0"
            style={{
              fontSize: 8,
              background: MAT_RUST + '18',
              border: `1px solid ${MAT_RUST}4d`,
              color: MAT_RUST,
            }}
          >
            {tag}
          </span>
        </div>

        <div
          className="font-display font-bold"
          style={{
            fontSize: 14.5,
            lineHeight: 1.28,
            color: MAT_INK,
            marginBottom: 9,
            minHeight: 14.5 * 1.28 * 2,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {name}
        </div>

        <div
          className="flex items-center justify-between pt-2"
          style={{ borderTop: '1px solid rgba(23,35,63,0.12)' }}
        >
          <span className="font-mono" style={{ fontSize: 9.5, color: MAT_INK_SOFT }}>
            <b style={{ color: MAT_INK, fontWeight: 700 }}>{downloads}</b>{' '}
            {downloads === 1 ? 'download' : 'downloads'}
          </span>
          <span
            className="flex items-center gap-1 rounded-none"
            style={{
              background: MAT_RUST,
              color: MAT_CARD,
              fontFamily: 'inherit',
              fontWeight: 700,
              fontSize: 9,
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
              padding: '4px 8px',
            }}
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={MAT_CARD} strokeWidth="2.5">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
            Download
          </span>
        </div>
      </a>
    </div>
  );
}

/* ── Empty state — cream/paper theme ── */
function MaterialEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-5">
      <div className="relative" style={{ width: 88, height: 56 }}>
        {[
          { left: 0, height: 38, color: 'rgba(177,80,47,0.15)', border: 'rgba(177,80,47,0.3)' },
          { left: 26, height: 48, color: 'rgba(198,154,61,0.18)', border: 'rgba(198,154,61,0.35)' },
          { left: 52, height: 30, color: 'rgba(177,80,47,0.1)', border: 'rgba(177,80,47,0.2)' },
        ].map((b, i) => (
          <div
            key={i}
            className="absolute bottom-0 rounded-none"
            style={{ left: b.left, width: 20, height: b.height, background: b.color, border: `1px solid ${b.border}` }}
          />
        ))}
        <div
          className="absolute rounded-none"
          style={{ bottom: -1, left: -6, right: -6, height: 2, background: 'rgba(23,35,63,0.1)' }}
        />
      </div>

      <div className="text-center">
        <div className="font-display font-bold text-sm mb-1" style={{ color: 'rgba(23,35,63,0.7)' }}>
          Nothing on these shelves yet
        </div>
        <div
          className="font-mono text-[10px] tracking-wide uppercase"
          style={{ color: 'rgba(60,74,104,0.6)' }}
        >
          Be the first to contribute study materials
        </div>
      </div>

      <a
        href="/papers/upload"
        className="font-mono font-bold uppercase tracking-wide rounded-none px-4 py-2 text-[10px] transition-all hover:brightness-110"
        style={{ background: MAT_RUST, color: MAT_CARD }}
      >
        Upload a resource
      </a>
    </div>
  );
}

/* ── Past Questions Bank filter select — blush/rust theme ── */
function PaperFilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const active = value !== '';
  return (
    <div className="relative w-full">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none cursor-pointer rounded-none pl-3 pr-7 py-[5px] font-mono font-bold uppercase tracking-wide outline-none transition-all"
        style={{
          fontSize: 10,
          background: active ? PAP_RUST + '18' : PAP_CARD,
          border: `1.5px solid ${active ? PAP_RUST : PAP_BORDER}`,
          color: active ? PAP_RUST_DEEP : PAP_INK_SOFT,
          minWidth: 0,
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
        style={{ color: active ? PAP_RUST : '#999' }}
      >
        ▾
      </div>
    </div>
  );
}

/* ── Past Questions Bank card — white card, rust rail, fixed height ── */
function PaperCard({
  code,
  name,
  tag,
  downloads,
  href,
  downloadName,
  itemId,
}: {
  code: string;
  name: string;
  tag: string;
  downloads: number;
  href: string;
  downloadName: string;
  itemId: string;
}) {
  return (
    <div
      className="flex rounded-none overflow-hidden"
      style={{ background: PAP_CARD, border: `1.5px solid ${PAP_BORDER}` }}
    >
      <div className="w-1 flex-shrink-0 rounded-none" style={{ background: PAP_RUST }} />

      <a
        href={href}
        onClick={(e) => {
          e.preventDefault();
          trackDownload('papers', itemId);
          downloadFile(href, downloadName);
        }}
        className="flex-1 min-w-0 px-3 py-[11px]"
        style={{ textDecoration: 'none', cursor: 'pointer' }}
      >
        <div className="flex items-center justify-between gap-2 mb-1">
          <span
            className="font-mono font-bold uppercase tracking-wide"
            style={{ fontSize: 9, color: PAP_RUST }}
          >
            {code}
          </span>
          <span
            className="font-mono font-bold uppercase rounded-none px-1.5 py-0.5 flex-shrink-0"
            style={{ fontSize: 8, background: PAP_CHIP, color: PAP_RUST_DEEP }}
          >
            {tag}
          </span>
        </div>

        <div
          className="font-display font-bold"
          style={{
            fontSize: 14.5,
            lineHeight: 1.28,
            color: PAP_INK,
            marginBottom: 9,
            minHeight: 14.5 * 1.28 * 2,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {name}
        </div>

        <div
          className="flex items-center justify-between pt-2"
          style={{ borderTop: `1px solid ${PAP_BORDER}` }}
        >
          <span className="font-mono" style={{ fontSize: 9.5, color: PAP_INK_SOFT }}>
            <b style={{ color: PAP_INK, fontWeight: 700 }}>{downloads}</b>{' '}
            {downloads === 1 ? 'download' : 'downloads'}
          </span>
          <span className="flex items-center gap-1.5">
            <a
              href={`/papers/${itemId}/solutions`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 rounded-none"
              style={{
                border: `1px solid ${PAP_RUST}`,
                color: PAP_RUST_DEEP,
                fontFamily: 'inherit',
                fontWeight: 700,
                fontSize: 9,
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                padding: '4px 8px',
              }}
            >
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={PAP_RUST_DEEP} strokeWidth="2.5">
                <path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
              Solve
            </a>
            <span
              className="flex items-center gap-1 rounded-none"
              style={{
                background: PAP_RUST,
                color: PAP_CARD,
                fontFamily: 'inherit',
                fontWeight: 700,
                fontSize: 9,
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                padding: '4px 8px',
              }}
            >
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={PAP_CARD} strokeWidth="2.5">
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
              Download
            </span>
          </span>
        </div>
      </a>
    </div>
  );
}

/* ── Empty state — blush/rust theme for Past Questions Bank ── */
function PaperEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-5">
      <div className="relative" style={{ width: 88, height: 56 }}>
        {[
          { left: 0, height: 38, color: 'rgba(177,99,63,0.15)', border: 'rgba(177,99,63,0.3)' },
          { left: 26, height: 48, color: 'rgba(140,74,52,0.18)', border: 'rgba(140,74,52,0.3)' },
          { left: 52, height: 30, color: 'rgba(177,99,63,0.1)', border: 'rgba(177,99,63,0.2)' },
        ].map((b, i) => (
          <div
            key={i}
            className="absolute bottom-0 rounded-none"
            style={{ left: b.left, width: 20, height: b.height, background: b.color, border: `1px solid ${b.border}` }}
          />
        ))}
        <div
          className="absolute rounded-none"
          style={{ bottom: -1, left: -6, right: -6, height: 2, background: 'rgba(58,42,36,0.1)' }}
        />
      </div>

      <div className="text-center">
        <div className="font-display font-bold text-sm mb-1" style={{ color: 'rgba(58,42,36,0.7)' }}>
          Nothing on these shelves yet
        </div>
        <div
          className="font-mono text-[10px] tracking-wide uppercase"
          style={{ color: 'rgba(107,90,82,0.7)' }}
        >
          Be the first to contribute a past paper
        </div>
      </div>

      <a
        href="/papers/upload"
        className="font-mono font-bold uppercase tracking-wide rounded-none px-4 py-2 text-[10px] transition-all hover:brightness-110"
        style={{ background: PAP_RUST, color: PAP_CARD }}
      >
        Upload a resource
      </a>
    </div>
  );
}

/* ── Main component ── */
export default function RepositoryBrowser({
  courses,
  initialCourseId,
  mode,
  title,
}: {
  courses: CourseOption[];
  initialCourseId?: string;
  mode: Tab;
  title: string;
}) {
  const tab = mode;
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [courseId, setCourseId] = useState(initialCourseId ?? '');
  const [level, setLevel] = useState('');
  const [examType, setExamType] = useState('');
  const [week, setWeek] = useState('');

  const [papers, setPapers] = useState<PaperResult[]>([]);
  const [materials, setMaterials] = useState<MaterialResult[]>([]);
  const [loading, setLoading] = useState(true);

  const filteredCourses = useMemo(
    () => courses.filter((c) => !level || c.level === level),
    [courses, level]
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
        if (week) query = query.eq('week_number', Number(week));
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
  }, [tab, courseId, level, examType, week, debouncedSearch]);

  const visiblePapers = papers;
  const visibleMaterials = materials;
  const resultCount = tab === 'papers' ? visiblePapers.length : visibleMaterials.length;

  /* ── Lecture Slides (materials mode) — new cream/paper design ── */
  if (tab === 'materials') {
    return (
      <div
        className="relative"
        style={{
          backgroundImage: `radial-gradient(140% 90% at 15% -10%, rgba(177,80,47,0.10) 0%, transparent 55%), ${MAT_BG}`,
          minHeight: '100%',
        }}
      >
        {/* ── HERO ── */}
        <div className="relative px-4 sm:px-6 lg:px-8 pt-10 pb-0">
          <div className="mb-1">
            <div
              className="font-mono font-bold uppercase tracking-[0.14em] mb-1.5"
              style={{ fontSize: 9, color: MAT_RUST }}
            >
              Library
            </div>
            <h1 className="font-display font-bold leading-tight" style={{ fontSize: 22, color: MAT_INK }}>
              {title}
            </h1>
            <p className="italic" style={{ fontSize: 12.5, color: MAT_INK_SOFT, marginTop: 4, marginBottom: 16 }}>
              Search materials and download with a tap.
            </p>
          </div>

          {/* ── SEARCH ── */}
          <div
            className="flex items-center gap-3 rounded-none px-3.5 py-2.5 mb-3"
            style={{ background: MAT_CARD, border: `1.5px solid ${MAT_RUST}59`, boxShadow: '0 2px 8px rgba(23,35,63,0.06)' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={MAT_RUST} strokeWidth="2.5" className="flex-shrink-0">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search by course code or name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent outline-none font-mono"
              style={{ fontSize: 11, color: MAT_INK }}
            />
            {search && (
              <button onClick={() => setSearch('')} className="transition-colors text-xs" style={{ color: 'rgba(23,35,63,0.4)' }}>✕</button>
            )}
          </div>

          {/* ── FILTER STRIP ── */}
          <div className="grid grid-cols-3 gap-2 pb-4">
            <MaterialFilterSelect
              value={level}
              onChange={setLevel}
              options={[{ value: '', label: 'All Levels' }, ...LEVELS.map((l) => ({ value: l, label: `Level ${l}` }))]}
            />
            <MaterialFilterSelect
              value={courseId}
              onChange={setCourseId}
              options={[{ value: '', label: 'All Courses' }, ...filteredCourses.map((c) => ({ value: c.id, label: c.code }))]}
            />
            <MaterialFilterSelect
              value={week}
              onChange={setWeek}
              options={[{ value: '', label: 'All Weeks' }, ...WEEKS.map((w) => ({ value: String(w), label: `Week ${w}` }))]}
            />
          </div>
        </div>

        {/* ── RESULTS ── */}
        <div className="relative px-4 sm:px-6 lg:px-8 pb-10 pt-2">
          {!loading && (
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono uppercase tracking-wide" style={{ fontSize: 9, color: 'rgba(23,35,63,0.4)' }}>
                {resultCount} {resultCount === 1 ? 'result' : 'results'}
              </span>
              <span className="font-mono uppercase tracking-wide cursor-pointer" style={{ fontSize: 9, color: MAT_RUST + 'aa' }}>
                Sort ↕
              </span>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col gap-2.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-none h-[72px] animate-pulse" style={{ background: 'rgba(23,35,63,0.06)' }} />
              ))}
            </div>
          ) : visibleMaterials.length === 0 ? (
            <MaterialEmptyState />
          ) : (
            <div className="flex flex-col gap-2.5">
              {visibleMaterials.map((m) => (
                <MaterialCard
                  key={m.id}
                  code={m.courses.code}
                  name={m.title}
                  tag={m.week_number ? `WEEK ${m.week_number}` : 'MATERIAL'}
                  downloads={m.download_count}
                  href={m.file_url}
                  downloadName={`${m.courses.code} - ${m.title}.pdf`}
                  itemId={m.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── Past Questions Bank (papers mode) — blush/rust redesign (Set 1) ── */
  return (
    <div
      className="relative"
      style={{
        backgroundImage: `radial-gradient(140% 90% at 15% -10%, rgba(177,99,63,0.12) 0%, transparent 55%), ${PAP_BG}`,
        minHeight: '100%',
      }}
    >
      {/* ── HERO ── */}
      <div className="relative px-4 sm:px-6 lg:px-8 pt-10 pb-0">
        <div className="mb-1">
          <div
            className="font-mono font-bold uppercase tracking-[0.14em] mb-1.5"
            style={{ fontSize: 9, color: PAP_RUST }}
          >
            Library
          </div>
          <h1 className="font-display font-bold leading-tight" style={{ fontSize: 22, color: PAP_INK }}>
            {title}
          </h1>
          <p className="italic" style={{ fontSize: 12.5, color: PAP_INK_SOFT, marginTop: 4, marginBottom: 16 }}>
            Search past papers and download with a tap.
          </p>
        </div>

        {/* ── SEARCH ── */}
        <div
          className="flex items-center gap-3 rounded-none px-3.5 py-2.5 mb-3"
          style={{ background: PAP_CARD, border: `1.5px solid ${PAP_RUST}`, boxShadow: '0 2px 8px rgba(58,42,36,0.06)' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={PAP_RUST} strokeWidth="2.5" className="flex-shrink-0">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search by course code or name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none font-mono"
            style={{ fontSize: 11, color: PAP_INK }}
          />
          {search && (
            <button onClick={() => setSearch('')} className="transition-colors text-xs" style={{ color: 'rgba(58,42,36,0.4)' }}>✕</button>
          )}
        </div>

        {/* ── FILTER STRIP ── */}
        <div className="grid grid-cols-3 gap-2 pb-4">
          <PaperFilterSelect
            value={level}
            onChange={setLevel}
            options={[{ value: '', label: 'All Levels' }, ...LEVELS.map((l) => ({ value: l, label: `Level ${l}` }))]}
          />
          <PaperFilterSelect
            value={courseId}
            onChange={setCourseId}
            options={[{ value: '', label: 'All Courses' }, ...filteredCourses.map((c) => ({ value: c.id, label: c.code }))]}
          />
          <PaperFilterSelect
            value={examType}
            onChange={setExamType}
            options={[
              { value: '', label: 'All Types' },
              { value: 'mid_semester', label: 'Mid-Sem' },
              { value: 'end_of_semester', label: 'End of Sem' },
            ]}
          />
        </div>
      </div>

      {/* ── RESULTS ── */}
      <div className="relative px-4 sm:px-6 lg:px-8 pb-10 pt-2">
        {!loading && (
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono uppercase tracking-wide" style={{ fontSize: 9, color: 'rgba(58,42,36,0.4)' }}>
              {resultCount} {resultCount === 1 ? 'result' : 'results'}
            </span>
            <span className="font-mono uppercase tracking-wide cursor-pointer" style={{ fontSize: 9, color: PAP_RUST + 'aa' }}>
              Sort ↕
            </span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col gap-2.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-none h-[72px] animate-pulse" style={{ background: 'rgba(58,42,36,0.06)' }} />
            ))}
          </div>
        ) : visiblePapers.length === 0 ? (
          <PaperEmptyState />
        ) : (
          <div className="flex flex-col gap-2.5">
            {visiblePapers.map((p) => (
              <PaperCard
                key={p.id}
                code={p.courses.code}
                name={p.courses.name}
                tag={p.exam_type === 'mid_semester' ? 'Mid-Sem' : 'End of Sem'}
                downloads={p.download_count}
                href={p.watermarked_url ?? p.file_url}
                downloadName={`${p.courses.code} ${p.exam_type === 'mid_semester' ? 'Mid-Sem' : 'End-of-Sem'}${p.year ? ` ${p.year}` : ''}.pdf`}
                itemId={p.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
