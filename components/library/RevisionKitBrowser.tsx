'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Kit = {
  id: string;
  title: string;
  file_url: string;
  download_count: number;
  semester: '1' | '2' | null;
  page_count: number | null;
  created_at: string;
  courses: { id: string; code: string; name: string; department: string; level: string };
};

const mono = 'font-[family-name:var(--font-courier-prime)]';

const AMB_BG = '#FBEBD9';
const AMB_RUST = '#C1741F';
const AMB_INK = '#3A2410';
const AMB_INK_SOFT = '#6B4F35';
const AMB_CARD = '#FFFFFF';

const LEVELS = ['100', '200', '300', '400'];

// Fire-and-forget: same pattern used by RepositoryBrowser — tells the
// backend a download happened without blocking the file from opening.
function trackDownload(id: string) {
  fetch('/api/track-download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'materials', id }),
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
        className={`w-full appearance-none cursor-pointer rounded-none pl-2.5 pr-6 py-[5px] font-bold uppercase tracking-wide outline-none ${mono}`}
        style={{ fontSize: 10, background: AMB_CARD, border: '1.5px solid rgba(58,36,16,0.15)', color: AMB_INK_SOFT }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <div
        className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ fontSize: 9, color: '#999' }}
      >
        ▾
      </div>
    </div>
  );
}

function KitTile({ kit }: { kit: Kit }) {
  const downloadName = `${kit.courses.code} - ${kit.title}.pdf`;
  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{ aspectRatio: '1 / 1', background: AMB_CARD, border: '1.5px solid rgba(58,36,16,0.15)' }}
    >
      <div className="h-1 flex-shrink-0" style={{ background: AMB_RUST }} />
      <a
        href={kit.file_url}
        onClick={(e) => {
          e.preventDefault();
          trackDownload(kit.id);
          downloadFile(kit.file_url, downloadName);
        }}
        className="flex flex-1 min-h-0 flex-col justify-between p-3"
        style={{ textDecoration: 'none', cursor: 'pointer' }}
      >
        <div>
          <div className="flex items-start justify-between gap-1.5 mb-1.5">
            <span className={`font-bold uppercase tracking-wide ${mono}`} style={{ fontSize: 8.5, color: AMB_RUST }}>
              {kit.courses.code}
            </span>
            <span
              className={`font-bold uppercase text-right flex-shrink-0 ${mono}`}
              style={{ fontSize: 7, padding: '2px 4px', background: AMB_RUST + '18', color: '#8F5314', lineHeight: 1.3 }}
            >
              {kit.semester ? `SEM ${kit.semester}` : 'KIT'}
            </span>
          </div>
          <div
            className="font-display font-bold overflow-hidden"
            style={{
              fontSize: 12.5,
              lineHeight: 1.25,
              color: AMB_INK,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {kit.title}
          </div>
        </div>
        <div>
          <div className={`flex items-center justify-between mb-2 ${mono}`} style={{ fontSize: 8.5, color: AMB_INK_SOFT }}>
            <span>{kit.page_count ? `${kit.page_count}p guide` : 'Study guide'}</span>
            <span>
              <b style={{ color: AMB_INK }}>{kit.download_count}</b> DL
            </span>
          </div>
          <div
            className={`w-full flex items-center justify-center gap-1 py-1.5 font-bold uppercase tracking-wide ${mono}`}
            style={{ background: AMB_RUST, color: '#fff', fontSize: 8.5 }}
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
            Download
          </div>
        </div>
      </a>
    </div>
  );
}

function EmptyState({ noneAtAll }: { noneAtAll: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <div className={`uppercase tracking-wide ${mono}`} style={{ fontSize: 9, color: AMB_RUST }}>
        Library
      </div>
      <div className="font-display font-bold" style={{ fontSize: 16, color: AMB_INK }}>
        {noneAtAll ? 'Coming soon, course by course' : 'No kits match these filters'}
      </div>
      <div className="max-w-[280px]" style={{ fontSize: 12.5, color: AMB_INK_SOFT }}>
        {noneAtAll
          ? "Each Revision Kit brings together a full semester of lecture slides into one exam-focused study guide. We're rolling these out course by course — check back as your courses are added."
          : 'Try a different course, level, or semester.'}
      </div>
    </div>
  );
}

export default function RevisionKitBrowser() {
  const [kits, setKits] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [level, setLevel] = useState('');
  const [courseId, setCourseId] = useState('');
  const [semester, setSemester] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    async function load() {
      const { data } = await supabase
        .from('study_materials')
        .select(
          'id, title, file_url, download_count, semester, page_count, created_at, courses!inner(id, code, name, department, level)'
        )
        .eq('status', 'approved')
        .eq('content_type', 'revision_kit')
        .order('created_at', { ascending: false });
      if (!cancelled) {
        setKits((data as unknown as Kit[]) ?? []);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Only surface courses that actually have a kit — with a handful of
  // kits live at a time, a full course-list dropdown would be mostly
  // dead ends.
  const courseOptions = useMemo(() => {
    const map = new Map<string, { id: string; code: string; level: string }>();
    kits.forEach((k) => map.set(k.courses.id, k.courses));
    return Array.from(map.values()).sort((a, b) => a.code.localeCompare(b.code));
  }, [kits]);

  const filteredCourseOptions = useMemo(
    () => courseOptions.filter((c) => !level || c.level === level),
    [courseOptions, level]
  );

  useEffect(() => {
    if (courseId && !filteredCourseOptions.some((c) => c.id === courseId)) setCourseId('');
  }, [filteredCourseOptions, courseId]);

  const visibleKits = useMemo(() => {
    return kits.filter((k) => {
      if (level && k.courses.level !== level) return false;
      if (courseId && k.courses.id !== courseId) return false;
      if (semester && k.semester !== semester) return false;
      if (debouncedSearch) {
        const haystack = `${k.courses.code} ${k.courses.name} ${k.title}`.toLowerCase();
        if (!haystack.includes(debouncedSearch)) return false;
      }
      return true;
    });
  }, [kits, level, courseId, semester, debouncedSearch]);

  return (
    <div
      className="relative"
      style={{
        backgroundImage: `radial-gradient(140% 90% at 15% -10%, rgba(193,116,31,0.13) 0%, transparent 55%), ${AMB_BG}`,
        minHeight: '100%',
      }}
    >
      <div className="max-w-[480px] mx-auto px-4 pt-10 pb-10">
        <div className={`uppercase tracking-[0.14em] font-bold mb-1.5 ${mono}`} style={{ fontSize: 9, color: AMB_RUST }}>
          Library
        </div>
        <h1 className="font-display font-bold leading-tight" style={{ fontSize: 22, color: AMB_INK }}>
          Revision Kit
        </h1>
        <p className="italic" style={{ fontSize: 12.5, color: AMB_INK_SOFT, margin: '4px 0 16px' }}>
          One exam-focused guide per course — a full semester, distilled.
        </p>

        <div
          className="flex items-center gap-3 px-3.5 py-2.5 mb-3"
          style={{ background: AMB_CARD, border: `1.5px solid ${AMB_RUST}59`, boxShadow: '0 2px 8px rgba(58,36,16,0.06)' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={AMB_RUST} strokeWidth="2.5" className="flex-shrink-0">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search by course code or name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`flex-1 bg-transparent outline-none ${mono}`}
            style={{ fontSize: 11, color: AMB_INK }}
          />
          {search && (
            <button onClick={() => setSearch('')} className="transition-colors text-xs" style={{ color: 'rgba(58,36,16,0.4)' }}>
              ✕
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 pb-4">
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
            value={semester}
            onChange={setSemester}
            options={[
              { value: '', label: 'All Semesters' },
              { value: '1', label: 'Semester 1' },
              { value: '2', label: 'Semester 2' },
            ]}
          />
        </div>

        {!loading && (
          <div className="flex items-center justify-between mb-3">
            <span className={`uppercase tracking-wide ${mono}`} style={{ fontSize: 9, color: 'rgba(58,36,16,0.4)' }}>
              {visibleKits.length} {visibleKits.length === 1 ? 'kit' : 'kits'}
            </span>
            <span className={`uppercase tracking-wide cursor-pointer ${mono}`} style={{ fontSize: 9, color: AMB_RUST + 'aa' }}>
              Sort ↕
            </span>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 gap-2.5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="animate-pulse"
                style={{ aspectRatio: '1 / 1', background: 'rgba(58,36,16,0.06)' }}
              />
            ))}
          </div>
        ) : visibleKits.length === 0 ? (
          <EmptyState noneAtAll={kits.length === 0} />
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {visibleKits.map((k) => (
              <KitTile key={k.id} kit={k} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
