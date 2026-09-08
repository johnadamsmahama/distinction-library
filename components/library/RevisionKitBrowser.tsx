'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { CourseOption } from '@/lib/papers-data';

type ContentKind = 'revision_kit' | 'audio_slides';

const KIND_META: Record<
  ContentKind,
  { label: string; accept: string; hint: string; maxSizeMb: number }
> = {
  revision_kit: {
    label: 'Revision Kit',
    accept: '.pdf,.doc,.docx',
    hint: 'PDF or Word — the full-semester guide',
    maxSizeMb: 25,
  },
  audio_slides: {
    label: 'Audio-Slides',
    accept: '.mp3,.m4a,.wav,.ogg,.mp4',
    hint: 'MP3, M4A, WAV, or OGG — recorded course audio',
    maxSizeMb: 200,
  },
};

// Same SHA-256 duplicate check every other upload form in the app uses.
async function hashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

const labelClass = 'block font-condensed text-xs font-bold uppercase tracking-wide text-g600 mb-1';
const inputClass = 'w-full border border-g200 rounded-lg px-3 py-2 font-body text-sm bg-white';

export default function LibraryContentForm({ courses }: { courses: CourseOption[] }) {
  const router = useRouter();
  const [kind, setKind] = useState<ContentKind>('revision_kit');
  const [courseId, setCourseId] = useState('');
  const [title, setTitle] = useState('');
  const [semester, setSemester] = useState('');
  const [pageCount, setPageCount] = useState('');
  const [week, setWeek] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const meta = KIND_META[kind];

  const resetForFileKind = (next: ContentKind) => {
    setKind(next);
    setFile(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!courseId) return setError('Select a course.');
    if (!title.trim()) return setError('Give it a title.');
    if (!file) return setError('Attach a file.');
    if (file.size > meta.maxSizeMb * 1024 * 1024) {
      return setError(`That file is over the ${meta.maxSizeMb}MB limit for ${meta.label}.`);
    }
    if (kind === 'revision_kit' && pageCount && Number(pageCount) <= 0) {
      return setError('Page count must be a positive number.');
    }
    if (kind === 'audio_slides' && week && (Number(week) < 1 || Number(week) > 12)) {
      return setError('Week must be between 1 and 12.');
    }

    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      setError('Your session expired — please log in again.');
      return;
    }

    const fileHash = await hashFile(file);
    const { data: existingByHash } = await supabase
      .from('study_materials')
      .select('id')
      .eq('file_hash', fileHash)
      .limit(1)
      .maybeSingle();

    if (existingByHash) {
      setLoading(false);
      setError('This exact file has already been uploaded to the library.');
      return;
    }

    const ext = file.name.split('.').pop();
    const path = `${user.id}/${courseId}/${Date.now()}.${ext}`;

    const { error: uploadErr } = await supabase.storage.from('study-materials').upload(path, file);
    if (uploadErr) {
      setLoading(false);
      setError(uploadErr.message);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from('study-materials').getPublicUrl(path);

    const { error: insertErr } = await supabase.from('study_materials').insert({
      course_id: courseId,
      title: title.trim(),
      content_type: kind,
      status: 'approved',
      file_url: publicUrlData.publicUrl,
      file_hash: fileHash,
      uploaded_by: user.id,
      semester: kind === 'revision_kit' && semester ? semester : null,
      page_count: kind === 'revision_kit' && pageCount ? Number(pageCount) : null,
      week_number: kind === 'audio_slides' && week ? Number(week) : null,
    });

    setLoading(false);
    if (insertErr) {
      setError(insertErr.message);
      return;
    }

    setDone(meta.label);
  };

  if (done) {
    return (
      <div className="bg-white border border-g100 rounded-2xl p-6 text-center">
        <h2 className="font-display font-bold text-lg text-navy mb-1.5">Published</h2>
        <p className="font-body text-sm text-g600 mb-4">
          The {done} is live now — no review needed.
        </p>
        <div className="flex items-center justify-center gap-2.5">
          <button
            onClick={() => {
              setDone(null);
              setCourseId('');
              setTitle('');
              setSemester('');
              setPageCount('');
              setWeek('');
              setFile(null);
            }}
            className="font-condensed font-bold text-xs uppercase tracking-wide text-navy border border-g200 rounded-lg px-4 py-2 hover:bg-g50 transition-colors"
          >
            Add another
          </button>
          <button
            onClick={() => router.push('/admin')}
            className="bg-navy text-white font-condensed font-bold text-xs uppercase tracking-wide rounded-lg px-4 py-2 hover:brightness-110 transition-all"
          >
            Back to Admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-white border border-g100 rounded-2xl p-6">
      <div>
        <label className={labelClass}>Content Type *</label>
        <div className="flex gap-2">
          {(Object.keys(KIND_META) as ContentKind[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => resetForFileKind(k)}
              className={`flex-1 rounded-lg border px-3 py-2 font-condensed font-bold text-xs uppercase tracking-wide transition-colors ${
                kind === k ? 'bg-navy text-white border-navy' : 'bg-white text-g600 border-g200 hover:border-navy'
              }`}
            >
              {KIND_META[k].label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="course" className={labelClass}>
          Course *
        </label>
        <select
          id="course"
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          required
          className={inputClass}
        >
          <option value="" disabled>
            Select a course…
          </option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} — {c.name} (Level {c.level})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="title" className={labelClass}>
          Title *
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder={kind === 'revision_kit' ? 'e.g. Principles of Marketing — Full Semester Guide' : 'e.g. Week 4 — Consumer Behaviour (Audio)'}
          className={inputClass}
        />
      </div>

      {kind === 'revision_kit' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="semester" className={labelClass}>
              Semester
            </label>
            <select id="semester" value={semester} onChange={(e) => setSemester(e.target.value)} className={inputClass}>
              <option value="">Not set</option>
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
            </select>
          </div>
          <div>
            <label htmlFor="pageCount" className={labelClass}>
              Page Count
            </label>
            <input
              id="pageCount"
              type="number"
              min={1}
              value={pageCount}
              onChange={(e) => setPageCount(e.target.value)}
              placeholder="e.g. 42"
              className={inputClass}
            />
          </div>
        </div>
      )}

      {kind === 'audio_slides' && (
        <div>
          <label htmlFor="week" className={labelClass}>
            Week (optional)
          </label>
          <input
            id="week"
            type="number"
            min={1}
            max={12}
            value={week}
            onChange={(e) => setWeek(e.target.value)}
            placeholder="1 – 12, if this covers a specific week"
            className={inputClass}
          />
        </div>
      )}

      <div>
        <label htmlFor="content-file" className={labelClass}>
          File *
        </label>
        <label
          htmlFor="content-file"
          className="block border-[1.5px] border-dashed border-g300 rounded-lg py-4 px-3 text-center cursor-pointer hover:border-navy transition-colors"
        >
          <span className="block font-condensed font-bold text-sm text-navy underline mb-1 truncate">
            {file ? file.name : 'Attach file'}
          </span>
          <span className="block font-condensed text-[11px] uppercase tracking-wide text-g500">{meta.hint}</span>
        </label>
        <input
          id="content-file"
          type="file"
          accept={meta.accept}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="hidden"
        />
      </div>

      {error && <p className="font-body text-xs text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gold text-navy-deep font-condensed font-bold text-sm uppercase tracking-wide rounded-lg py-2.5 disabled:opacity-60 hover:brightness-105 transition-all"
      >
        {loading ? 'Publishing…' : `Publish ${meta.label}`}
      </button>
    </form>
  );
}
