'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { CourseOption } from '@/lib/papers-data';
import FilterSelect from '../library/FilterSelect';
import FullBleedShell from './FullBleedShell';

type MaterialResult = {
  id: string;
  title: string;
  content_type: 'lecture_slides';
  week_number: number | null;
  file_url: string;
  download_count: number;
  created_at: string;
  courses: { id: string; code: string; name: string; department: string; level: string };
};

// Must match the values stored in courses.level exactly ('Diploma' is
// stored as that word, not a number).
const LEVELS = ['100', '200', '300', '400', 'Diploma'];
const levelLabel = (l: string) => (l === 'Diploma' ? 'Diploma' : `Level ${l}`);
const WEEKS = Array.from({ length: 14 }, (_, i) => i + 1);

// Fire-and-forget: tells the backend "a download happened" without
// blocking or delaying the actual file from opening. We deliberately
// don't await this in the click handler.
function trackDownload(type: 'materials', id: string) {
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
   horizontal cards. (Past papers live in the Library's Past
   Questions Bank at /library/past-questions.)
   ══════════════════════════════════════════════════════════ */

const MAT_INK = '#17233F';
const MAT_INK_SOFT = '#3C4A68';
const MAT_RUST = '#B1502F';
const MAT_GOLD = '#C69A3D';
const MAT_CARD = '#FBF7ED';
const MAT_BG = '#F1E9D8';

/* ── Cream filter select ── */
/* ── Horizontal material card — cream/paper, sharp corners ── */
function MaterialCard({
  code,
  name,
  tag,
  href,
  downloadName,
  itemId,
}: {
  code: string;
  name: string;
  tag: string;
  href: string;
  downloadName: string;
  itemId: string;
}) {
  return (
    <div
      className="flex rounded-none overflow-hidden"
      style={{ background: MAT_CARD, boxShadow: '0 2px 10px rgba(23,35,63,0.08)' }}
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
          style={{ fontSize: 14.5, lineHeight: 1.28, color: MAT_INK, marginBottom: 9 }}
        >
          {name}
        </div>

        <div
          className="flex items-center justify-end pt-2"
          style={{ borderTop: '1px solid rgba(23,35,63,0.12)' }}
        >
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

/* ── Main component ── */
export default function RepositoryBrowser({
  courses,
  initialCourseId,
  title,
}: {
  courses: CourseOption[];
  initialCourseId?: string;
  title: string;
}) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [courseId, setCourseId] = useState(initialCourseId ?? '');
  const [level, setLevel] = useState('');
  const [week, setWeek] = useState('');

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

      // Search, level, course and week filtering all run inside the
      // search_study_materials database function, which reads through the
      // study_material_courses link table. That is what lets one stored file
      // appear under every course it is shared by, and it matches course
      // codes with or without a space ("BASC102" / "BASC 102").
      const { data, error } = await supabase.rpc('search_study_materials', {
        p_search: debouncedSearch || null,
        p_level: level || null,
        p_course_id: courseId || null,
        p_week: week ? Number(week) : null,
        p_limit: 100,
      });
      if (error) console.error('Lecture slides search failed:', error.message);
      if (!cancelled) {
        const rows = (data as any[] | null) ?? [];
        setMaterials(
          rows.map((r) => ({
            id: r.id,
            title: r.title,
            content_type: r.content_type,
            week_number: r.week_number,
            file_url: r.file_url,
            download_count: r.download_count,
            created_at: r.created_at,
            courses: {
              id: r.course_id,
              code: r.course_code,
              name: r.course_name,
              department: r.course_department,
              level: r.course_level,
            },
          }))
        );
        setLoading(false);
      }
    }
    fetchResults();
    return () => { cancelled = true; };
  }, [courseId, level, week, debouncedSearch]);

  const resultCount = materials.length;

  return (
    <FullBleedShell
      afterBreadcrumb
      background=""
      style={{
        backgroundImage: `radial-gradient(140% 90% at 15% -10%, rgba(177,80,47,0.10) 0%, transparent 55%), ${MAT_BG}`,
      }}
    >
      {/* ── HERO ── */}
      <div className="relative px-4 sm:px-6 lg:px-8 lg:max-w-[1164px] lg:mx-auto pt-10 pb-0">
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

        {/* Laptop: search + filters share one row. Below lg this wrapper has no effect. */}
        <div className="lg:grid lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:gap-2 lg:items-center lg:pb-4">
        {/* ── SEARCH ── */}
        <div
          className="flex items-center gap-3 rounded-none px-3.5 py-2.5 mb-3 lg:mb-0"
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
        <div className="grid grid-cols-3 gap-2 pb-4 lg:contents lg:[&_select]:py-[10px]">
          <FilterSelect
            value={level}
            onChange={setLevel}
            options={[{ value: '', label: 'All Levels' }, ...LEVELS.map((l) => ({ value: l, label: levelLabel(l) }))]}
            card={MAT_CARD}
            border="rgba(23,35,63,0.4)"
            text={MAT_INK_SOFT}
            activeBg={MAT_RUST + '18'}
            activeBorder={MAT_RUST}
            activeText="#7A3A20"
          />
          <FilterSelect
            value={courseId}
            onChange={setCourseId}
            options={[{ value: '', label: 'All Courses' }, ...filteredCourses.map((c) => ({ value: c.id, label: c.code }))]}
            card={MAT_CARD}
            border="rgba(23,35,63,0.4)"
            text={MAT_INK_SOFT}
            activeBg={MAT_RUST + '18'}
            activeBorder={MAT_RUST}
            activeText="#7A3A20"
          />
          <FilterSelect
            value={week}
            onChange={setWeek}
            options={[{ value: '', label: 'All Weeks' }, ...WEEKS.map((w) => ({ value: String(w), label: `Week ${w}` }))]}
            card={MAT_CARD}
            border="rgba(23,35,63,0.4)"
            text={MAT_INK_SOFT}
            activeBg={MAT_RUST + '18'}
            activeBorder={MAT_RUST}
            activeText="#7A3A20"
          />
        </div>
        </div>
      </div>

      {/* ── RESULTS ── */}
      <div className="relative px-4 sm:px-6 lg:px-8 lg:max-w-[1164px] lg:mx-auto pb-10 pt-2">
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
          <div className="flex flex-col gap-2.5 lg:grid lg:grid-cols-3 lg:gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-none h-[72px] animate-pulse" style={{ background: 'rgba(23,35,63,0.06)' }} />
            ))}
          </div>
        ) : materials.length === 0 ? (
          <MaterialEmptyState />
        ) : (
          <div className="flex flex-col gap-2.5 lg:grid lg:grid-cols-3 lg:gap-4">
            {materials.map((m) => (
              <MaterialCard
                key={`${m.id}-${m.courses.id}`}
                code={m.courses.code}
                name={m.title}
                tag={m.week_number ? `WEEK ${m.week_number}` : 'MATERIAL'}
                href={m.file_url}
                downloadName={`${m.courses.code} - ${m.title}.pdf`}
                itemId={m.id}
              />
            ))}
          </div>
        )}
      </div>
    </FullBleedShell>
  );
}
