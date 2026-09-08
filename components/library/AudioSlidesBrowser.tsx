'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type Recording = {
  id: string;
  title: string;
  file_url: string;
  download_count: number;
  semester: '1' | '2' | null;
  created_at: string;
  courses: { id: string; code: string; name: string; department: string; level: string };
};

const mono = 'font-[family-name:var(--font-courier-prime)]';

const GLD_BG = '#FBF3DE';
const GLD_ACCENT = '#C6A44B';
const GLD_INK = '#4A3B14';
const GLD_INK_SOFT = '#7A6636';
const GLD_CARD = '#FFFFFF';
const GLD_BADGE_TEXT = '#8A6D1F';

const LEVELS = ['100', '200', '300', '400'];

function trackPlay(id: string) {
  fetch('/api/track-download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'materials', id }),
  }).catch(() => {
    // A failed tracking ping should never interrupt playback or download.
  });
}

async function saveFile(url: string, filename: string) {
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

function formatDuration(seconds: number | null) {
  if (seconds === null || !isFinite(seconds)) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
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
        style={{ fontSize: 10, background: GLD_CARD, border: '1.5px solid rgba(74,59,20,0.15)', color: GLD_INK_SOFT }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ fontSize: 9, color: '#999' }}>
        ▾
      </div>
    </div>
  );
}

// Deterministic "at rest" bar heights so tiles don't visually jump around
// between renders — seeded off the recording id rather than random.
function restBars(seed: string, count: number) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 997;
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    h = (h * 31 + 7) % 997;
    out.push(5 + (h % 8)); // 5–12px at rest
  }
  return out;
}

const PLAYING_BARS = [22, 14, 26, 10, 18, 24, 12];

function RecordingTile({ recording }: { recording: Recording }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const bars = useMemo(() => restBars(recording.id, 7), [recording.id]);
  const saveName = `${recording.courses.code} - ${recording.title}.mp3`;

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (isPlaying) {
      el.pause();
      return;
    }
    // Only one recording plays at a time — pause every other <audio> on
    // the page before starting this one.
    document.querySelectorAll('audio[data-recording]').forEach((node) => {
      if (node !== el) (node as HTMLAudioElement).pause();
    });
    el.play();
    trackPlay(recording.id);
  };

  return (
    <div
      className="flex flex-col overflow-hidden relative"
      style={{
        aspectRatio: '1 / 1',
        background: GLD_CARD,
        border: `1.5px solid ${isPlaying ? GLD_ACCENT : 'rgba(74,59,20,0.15)'}`,
        boxShadow: isPlaying ? `0 0 0 2px ${GLD_ACCENT}33` : undefined,
      }}
    >
      <audio
        ref={audioRef}
        data-recording={recording.id}
        src={recording.file_url}
        preload="metadata"
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />
      <div className="h-1 flex-shrink-0" style={{ background: GLD_ACCENT }} />
      <div className="flex flex-1 min-h-0 flex-col justify-between p-3">
        <div>
          <div className="flex items-start justify-between gap-1.5 mb-1.5">
            <span className={`font-bold uppercase tracking-wide ${mono}`} style={{ fontSize: 8.5, color: GLD_ACCENT }}>
              {recording.courses.code}
            </span>
            <span
              className={`font-bold uppercase text-right flex-shrink-0 ${mono}`}
              style={{ fontSize: 7, padding: '2px 4px', background: GLD_ACCENT + '18', color: GLD_BADGE_TEXT, lineHeight: 1.3 }}
            >
              {recording.semester ? `SEM ${recording.semester}` : 'AUDIO'}
            </span>
          </div>
          {isPlaying && (
            <div className={`font-bold uppercase mb-1 ${mono}`} style={{ fontSize: 6.5, letterSpacing: '0.05em', color: GLD_ACCENT }}>
              <span
                className="inline-block mr-1"
                style={{ animation: 'audioPulse 1.2s ease-in-out infinite' }}
              >
                ●
              </span>
              Now Playing
            </div>
          )}
          <div
            className="font-display font-bold overflow-hidden"
            style={{
              fontSize: 12.5,
              lineHeight: 1.25,
              color: GLD_INK,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {recording.title}
          </div>
          <div className="flex items-end gap-[2.5px]" style={{ height: 26, margin: '8px 0' }}>
            {bars.map((h, i) => (
              <span
                key={i}
                style={{
                  width: 3.5,
                  height: isPlaying ? PLAYING_BARS[i] : h,
                  background: GLD_ACCENT,
                  borderRadius: 2,
                  transformOrigin: 'bottom',
                  animation: isPlaying ? `audioWave 0.9s ease-in-out infinite` : undefined,
                  animationDelay: isPlaying ? `${(i * 0.07) % 0.35}s` : undefined,
                  transition: 'height 0.2s ease',
                }}
              />
            ))}
          </div>
        </div>
        <div>
          <div className={`flex items-center justify-between mb-2 ${mono}`} style={{ fontSize: 8.5, color: GLD_INK_SOFT }}>
            <span>{formatDuration(duration) ?? '—:—'}</span>
            <span>
              <b style={{ color: GLD_INK }}>{recording.download_count}</b> plays
            </span>
          </div>
          <div className="flex gap-[5px]">
            <button
              onClick={togglePlay}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 font-bold uppercase tracking-wide ${mono}`}
              style={{ background: GLD_ACCENT, color: '#fff', fontSize: 7.5, border: 'none', cursor: 'pointer' }}
            >
              {isPlaying ? (
                <svg width="8" height="8" viewBox="0 0 24 24" fill="#fff">
                  <rect x="6" y="5" width="4" height="14" />
                  <rect x="14" y="5" width="4" height="14" />
                </svg>
              ) : (
                <svg width="8" height="8" viewBox="0 0 24 24" fill="#fff">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
              {isPlaying ? 'Pause' : 'Listen'}
            </button>
            <button
              onClick={() => {
                trackPlay(recording.id);
                saveFile(recording.file_url, saveName);
              }}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 font-bold uppercase tracking-wide ${mono}`}
              style={{ background: 'transparent', color: GLD_ACCENT, fontSize: 7.5, border: `1.3px solid ${GLD_ACCENT}`, cursor: 'pointer' }}
            >
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={GLD_ACCENT} strokeWidth="2.5">
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ noneAtAll }: { noneAtAll: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <div className={`uppercase tracking-wide ${mono}`} style={{ fontSize: 9, color: GLD_ACCENT }}>
        Library
      </div>
      <div className="font-display font-bold" style={{ fontSize: 16, color: GLD_INK }}>
        {noneAtAll ? 'Coming soon, course by course' : 'No recordings match these filters'}
      </div>
      <div className="max-w-[280px]" style={{ fontSize: 12.5, color: GLD_INK_SOFT }}>
        {noneAtAll
          ? "Professionally recorded course audio, so you can study on the go. We're starting with core courses and expanding from there — check back as your courses are added."
          : 'Try a different course or level.'}
      </div>
    </div>
  );
}

export default function AudioSlidesBrowser() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [level, setLevel] = useState('');
  const [courseId, setCourseId] = useState('');

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
        .select('id, title, file_url, download_count, semester, created_at, courses!inner(id, code, name, department, level)')
        .eq('status', 'approved')
        .eq('content_type', 'audio_slides')
        .order('created_at', { ascending: false });
      if (!cancelled) {
        setRecordings((data as unknown as Recording[]) ?? []);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const courseOptions = useMemo(() => {
    const map = new Map<string, { id: string; code: string; level: string }>();
    recordings.forEach((r) => map.set(r.courses.id, r.courses));
    return Array.from(map.values()).sort((a, b) => a.code.localeCompare(b.code));
  }, [recordings]);

  const filteredCourseOptions = useMemo(
    () => courseOptions.filter((c) => !level || c.level === level),
    [courseOptions, level]
  );

  useEffect(() => {
    if (courseId && !filteredCourseOptions.some((c) => c.id === courseId)) setCourseId('');
  }, [filteredCourseOptions, courseId]);

  const visibleRecordings = useMemo(() => {
    return recordings.filter((r) => {
      if (level && r.courses.level !== level) return false;
      if (courseId && r.courses.id !== courseId) return false;
      if (debouncedSearch) {
        const haystack = `${r.courses.code} ${r.courses.name} ${r.title}`.toLowerCase();
        if (!haystack.includes(debouncedSearch)) return false;
      }
      return true;
    });
  }, [recordings, level, courseId, debouncedSearch]);

  return (
    <div
      className="relative"
      style={{
        backgroundImage: `radial-gradient(140% 90% at 15% -10%, rgba(198,164,75,0.13) 0%, transparent 55%), ${GLD_BG}`,
        minHeight: '100%',
      }}
    >
      <style>{`
        @keyframes audioWave { 0%, 100% { transform: scaleY(0.35); } 50% { transform: scaleY(1); } }
        @keyframes audioPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }
      `}</style>
      <div className="max-w-[480px] mx-auto px-4 pt-10 pb-10">
        <Link
          href="/library"
          className={`inline-flex items-center gap-1 mb-3 font-bold uppercase tracking-wide ${mono}`}
          style={{ fontSize: 9, color: GLD_INK_SOFT }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={GLD_INK_SOFT} strokeWidth="2.5">
            <path d="M15 19l-7-7 7-7" />
          </svg>
          Library
        </Link>

        <div className={`uppercase tracking-[0.14em] font-bold mb-1.5 ${mono}`} style={{ fontSize: 9, color: GLD_ACCENT }}>
          Library
        </div>
        <h1 className="font-display font-bold leading-tight" style={{ fontSize: 22, color: GLD_INK }}>
          Audio-Slides
        </h1>
        <p className="italic" style={{ fontSize: 12.5, color: GLD_INK_SOFT, margin: '4px 0 16px' }}>
          Professionally recorded course audio, so you can study on the go.
        </p>

        <div
          className="flex items-center gap-3 px-3.5 py-2.5 mb-3"
          style={{ background: GLD_CARD, border: `1.5px solid ${GLD_ACCENT}59`, boxShadow: '0 2px 8px rgba(74,59,20,0.06)' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={GLD_ACCENT} strokeWidth="2.5" className="flex-shrink-0">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search by course code or name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`flex-1 bg-transparent outline-none ${mono}`}
            style={{ fontSize: 11, color: GLD_INK }}
          />
          {search && (
            <button onClick={() => setSearch('')} className="transition-colors text-xs" style={{ color: 'rgba(74,59,20,0.4)' }}>
              ✕
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 pb-4">
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
        </div>

        {!loading && (
          <div className="flex items-center justify-between mb-3">
            <span className={`uppercase tracking-wide ${mono}`} style={{ fontSize: 9, color: 'rgba(74,59,20,0.4)' }}>
              {visibleRecordings.length} {visibleRecordings.length === 1 ? 'recording' : 'recordings'}
            </span>
            <span className={`uppercase tracking-wide cursor-pointer ${mono}`} style={{ fontSize: 9, color: GLD_ACCENT + 'aa' }}>
              Sort ↕
            </span>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 gap-2.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse" style={{ aspectRatio: '1 / 1', background: 'rgba(74,59,20,0.06)' }} />
            ))}
          </div>
        ) : visibleRecordings.length === 0 ? (
          <EmptyState noneAtAll={recordings.length === 0} />
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {visibleRecordings.map((r) => (
              <RecordingTile key={r.id} recording={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

