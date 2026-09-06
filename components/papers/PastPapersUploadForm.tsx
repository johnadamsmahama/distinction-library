'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { CourseOption } from '@/lib/papers-data';

type UploadMode = 'single' | 'bulk';
type ExamType = 'mid_semester' | 'end_of_semester';

const labelClass = 'font-mono text-[9px] uppercase tracking-wide text-[#5A6478] mb-1 block';
const fieldRow = 'mb-5';
const fieldUnderline = 'border-b-[1.5px] border-navy pb-[5px]';
const filledText = 'font-body text-[14px] font-semibold text-navy';
const placeholderText = 'font-body italic text-[13px] text-[#a09a86]';

// Computes a SHA-256 hash of a File's contents in the browser, using the
// built-in Web Crypto API — no extra library needed. Used to catch exact
// duplicate uploads (same file content) before they hit the database.
async function hashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// The four corner marks that give the bookplate its "certificate" framing.
function CornerMarks() {
  const base = 'absolute w-2.5 h-2.5 border-navy';
  return (
    <>
      <span className={`${base} top-1.5 left-1.5 border-t-[1.5px] border-l-[1.5px]`} />
      <span className={`${base} top-1.5 right-1.5 border-t-[1.5px] border-r-[1.5px]`} />
      <span className={`${base} bottom-1.5 left-1.5 border-b-[1.5px] border-l-[1.5px]`} />
      <span className={`${base} bottom-1.5 right-1.5 border-b-[1.5px] border-r-[1.5px]`} />
    </>
  );
}

// The bookplate frame: a cream card (slightly deeper tone than the page
// background behind it) with a navy outer rule and a gold inner rule plus
// corner marks. Used for the form as well as the suspended/submitted
// states, so every state of this page shares the same identity.
function Bookplate({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#FBF6E8] border border-navy p-[5px] rounded-none">
      <div className="relative border border-gold px-5 pt-6 pb-5">
        <CornerMarks />
        <div className="text-center font-mono text-[9px] tracking-[0.14em] text-[#8A6A1C] mb-4">
          EX LIBRIS · DISTINCTION LIBRARY
        </div>
        {children}
      </div>
    </div>
  );
}

// A course picker styled to match the bookplate's underline fields —
// CustomSelect's boxed look doesn't fit here, so this is a lighter,
// purpose-built dropdown with the same italic-placeholder / solid-when-set
// behavior as the plain text fields beside it.
function CourseField({
  courses,
  value,
  onChange,
}: {
  courses: CourseOption[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const selected = courses.find((c) => c.id === value);
  const filtered = query.trim()
    ? courses.filter((c) => `${c.code} ${c.name}`.toLowerCase().includes(query.trim().toLowerCase()))
    : courses;

  return (
    <div ref={ref} className={`relative ${fieldRow}`}>
      <label className={labelClass}>Course</label>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between text-left ${fieldUnderline}`}
      >
        <span className={selected ? filledText : placeholderText}>
          {selected ? `${selected.code} — ${selected.name}` : 'Select a course…'}
        </span>
        <svg viewBox="0 0 24 24" width={14} height={14} className={`shrink-0 ml-2 stroke-gold transition-transform ${open ? 'rotate-180' : ''}`} fill="none" strokeWidth={2}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full max-h-64 overflow-y-auto bg-white border border-g100 rounded-none shadow-lg">
          <div className="sticky top-0 bg-white border-b border-g100 p-1.5">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a course code or name…"
              className="w-full px-2.5 py-2 rounded-none border border-g100 font-condensed font-medium text-[13px] text-g800 outline-none focus:border-gold transition-colors"
            />
          </div>
          {filtered.length === 0 ? (
            <div className="px-3.5 py-2.5 font-condensed text-[13px] text-g600">No matches found</div>
          ) : (
            filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  onChange(c.id);
                  setOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2.5 font-condensed font-medium text-[13px] transition-colors hover:bg-off-white ${
                  c.id === value ? 'bg-gold/10 text-navy font-bold' : 'text-g800'
                }`}
              >
                {c.code} — {c.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

const EXAM_TYPE_LABEL: Record<ExamType, string> = {
  mid_semester: 'Mid-Semester',
  end_of_semester: 'End of Semester',
};

// A compact fixed-option dropdown for Exam Type — same visual language as
// CourseField, without the search box since there are only two options.
function ExamTypeField({ value, onChange }: { value: ExamType; onChange: (v: ExamType) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div ref={ref} className={`relative ${fieldRow}`}>
      <label className={labelClass}>Exam Type</label>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between text-left ${fieldUnderline}`}
      >
        <span className={filledText}>{EXAM_TYPE_LABEL[value]}</span>
        <svg viewBox="0 0 24 24" width={14} height={14} className={`shrink-0 ml-2 stroke-gold transition-transform ${open ? 'rotate-180' : ''}`} fill="none" strokeWidth={2}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-white border border-g100 rounded-none shadow-lg">
          {(Object.keys(EXAM_TYPE_LABEL) as ExamType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                onChange(t);
                setOpen(false);
              }}
              className={`w-full text-left px-3.5 py-2.5 font-condensed font-medium text-[13px] transition-colors hover:bg-off-white ${
                t === value ? 'bg-gold/10 text-navy font-bold' : 'text-g800'
              }`}
            >
              {EXAM_TYPE_LABEL[t]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PastPapersUploadForm({
  courses,
  uploadSuspended,
}: {
  courses: CourseOption[];
  uploadSuspended: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<UploadMode>('single');
  const [courseId, setCourseId] = useState('');
  const [examType, setExamType] = useState<ExamType>('end_of_semester');
  const [year, setYear] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (uploadSuspended) {
    return (
      <Bookplate>
        <div className="text-center py-4">
          <h2 className="font-display font-bold text-base text-navy mb-1.5">Uploads suspended</h2>
          <p className="font-body text-[13px] text-g600 leading-relaxed">
            Your upload privileges are currently suspended after reaching 3 strikes. Contact support
            if you believe this is a mistake.
          </p>
        </div>
      </Bookplate>
    );
  }

  if (done) {
    return (
      <Bookplate>
        <div className="text-center py-4">
          <h2 className="font-display font-bold text-base text-navy mb-1.5">Submitted for review</h2>
          <p className="font-body text-[13px] text-g600 mb-4 leading-relaxed">
            Thanks for contributing. A moderator will review this shortly — you&apos;ll get a
            notification once it&apos;s approved or rejected.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-navy text-white font-condensed font-bold text-xs uppercase px-4 py-2 rounded-none hover:bg-navy-mid transition-colors"
          >
            Back to dashboard
          </button>
        </div>
      </Bookplate>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!courseId) return setError('Select a course.');
    if (!file) return setError('Choose a file to upload.');

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

    const [existingPaperByHash, existingMaterialByHash] = await Promise.all([
      supabase.from('past_papers').select('id').eq('file_hash', fileHash).limit(1).maybeSingle(),
      supabase.from('study_materials').select('id').eq('file_hash', fileHash).limit(1).maybeSingle(),
    ]);

    if (existingPaperByHash.data || existingMaterialByHash.data) {
      setLoading(false);
      setError('This exact file has already been uploaded to the library.');
      return;
    }

    // Unknown-year papers skip the same-course/year/exam-type duplicate
    // check — with no year to compare, that check can't meaningfully
    // apply, and the content-hash check above already caught exact
    // re-uploads.
    if (year) {
      const { data: existing } = await supabase
        .from('past_papers')
        .select('id')
        .eq('course_id', courseId)
        .eq('year', Number(year))
        .eq('exam_type', examType)
        .in('status', ['pending', 'approved'])
        .limit(1);

      if (existing && existing.length > 0) {
        setLoading(false);
        setError('This past paper (same course, year, and exam type) has already been submitted.');
        return;
      }
    }

    const ext = file.name.split('.').pop();
    const path = `${user.id}/${courseId}/${Date.now()}.${ext}`;

    const { error: uploadErr } = await supabase.storage.from('past-papers').upload(path, file);
    if (uploadErr) { setLoading(false); setError(uploadErr.message); return; }

    const { data: inserted, error: insertErr } = await supabase
      .from('past_papers')
      .insert({
        course_id: courseId,
        year: year ? Number(year) : null,
        exam_type: examType,
        file_url: path,
        file_hash: fileHash,
        uploaded_by: user.id,
      })
      .select('id')
      .single();

    setLoading(false);
    if (insertErr) return setError(insertErr.message);

    if (inserted) {
      fetch(`/api/moderation/ai-review/${inserted.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'past_paper' }),
      }).catch(() => {});
    }
    setDone(true);
  };

  return (
    <Bookplate>
      {/* Single / Bulk toggle */}
      <div className="flex border border-navy mb-5">
        {(['single', 'bulk'] as UploadMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`flex-1 font-mono font-bold text-[9.5px] uppercase tracking-wide py-2 transition-colors ${
              mode === m ? 'bg-navy text-white' : 'bg-transparent text-navy'
            }`}
          >
            {m === 'single' ? 'Single Upload' : 'Bulk Upload'}
          </button>
        ))}
      </div>

      {mode === 'bulk' ? (
        <BulkUploadPanel />
      ) : (
        <form onSubmit={handleSubmit}>
          <CourseField courses={courses} value={courseId} onChange={setCourseId} />
          <ExamTypeField value={examType} onChange={setExamType} />

          <div className={fieldRow}>
            <label className={labelClass}>Year (optional)</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className={`w-full bg-transparent outline-none ${fieldUnderline} ${year ? filledText : ''} placeholder:italic placeholder:text-[13px] placeholder:text-[#a09a86] placeholder:font-body ${year ? '' : 'font-body'}`}
              placeholder="If known"
              min={2000}
              max={2100}
            />
          </div>

          <div className="mb-1 mt-2">
            <label
              htmlFor="past-paper-file"
              className="block border border-dashed border-[#4E9C7C] rounded-none bg-[#4E9C7C]/5 py-[9px] px-2.5 text-center cursor-pointer"
            >
              <span className="block font-mono font-bold text-[10px] text-navy underline mb-0.5 truncate">
                {file ? file.name : 'Attach file'}
              </span>
              <span className="block font-mono text-[9px] text-g600 tracking-wide">
                PDF · WORD · POWERPOINT · JPG · PNG
              </span>
            </label>
            <input
              id="past-paper-file"
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
          </div>

          {error && <p className="font-body text-xs text-red-500 mt-2.5">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 bg-[#4E9C7C] text-white font-condensed font-bold text-[12.5px] uppercase tracking-wide py-[11px] rounded-none shadow-[0_3px_8px_rgba(78,156,124,0.35)] disabled:opacity-60 flex items-center justify-center gap-[7px] hover:brightness-105 transition-all"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="9" />
              <path d="M9 12l2 2 4-4" />
            </svg>
            {loading ? 'Uploading…' : 'Submit for Review'}
          </button>
        </form>
      )}
    </Bookplate>
  );
}

type JobResult = { filename: string; status: string; note: string };

function statusColor(status: string): string {
  if (status === 'auto_approved') return 'text-green-600';
  if (status === 'queued_for_review') return 'text-gold';
  if (status === 'skipped_duplicate') return 'text-g600';
  if (status === 'needs_manual_review') return 'text-orange-500';
  if (status === 'error') return 'text-red-500';
  return 'text-g600';
}

function BulkUploadPanel() {
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [totalFiles, setTotalFiles] = useState<number | null>(null);
  const [cursor, setCursor] = useState(0);
  const [results, setResults] = useState<JobResult[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!jobId) return;
    const supabase = createClient();
    const poll = async () => {
      const { data } = await supabase
        .from('bulk_upload_jobs')
        .select('status, total_files, cursor, results')
        .eq('id', jobId)
        .single();
      if (data) {
        setJobStatus(data.status);
        setTotalFiles(data.total_files);
        setCursor(data.cursor);
        setResults((data.results as JobResult[]) ?? []);
        if (data.status === 'completed' || data.status === 'failed') {
          if (pollRef.current) clearInterval(pollRef.current);
        }
      }
    };
    poll();
    pollRef.current = setInterval(poll, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [jobId]);

  const handleZipUpload = async () => {
    setError(null);
    if (!zipFile) return setError('Choose a zip file first.');
    if (!zipFile.name.toLowerCase().endsWith('.zip')) return setError('Please choose a .zip file.');
    setUploading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUploading(false); setError('Your session expired — please log in again.'); return; }
    const path = `${user.id}/${Date.now()}-${zipFile.name}`;
    const { error: uploadErr } = await supabase.storage.from('bulk-uploads').upload(path, zipFile);
    if (uploadErr) { setUploading(false); setError(uploadErr.message); return; }
    const { data: job, error: insertErr } = await supabase
      .from('bulk_upload_jobs')
      .insert({ uploaded_by: user.id, zip_path: path, job_type: 'paper' })
      .select('id')
      .single();
    setUploading(false);
    if (insertErr || !job) { setError(insertErr?.message ?? 'Could not start the upload job.'); return; }
    setJobId(job.id);
    fetch('/api/bulk-upload/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId: job.id }),
    }).catch((e) => console.error('Failed to start bulk processing:', e));
  };

  if (jobId) {
    const percent = totalFiles ? Math.round((cursor / totalFiles) * 100) : 0;
    return (
      <div>
        <div className="mb-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-condensed font-bold text-xs text-navy">
              {jobStatus === 'completed' ? 'Done' : jobStatus === 'failed' ? 'Something went wrong' : 'Processing…'}
            </span>
            <span className="font-mono text-[9.5px] text-g600">
              {totalFiles !== null ? `${cursor} / ${totalFiles} files` : 'Reading zip…'}
            </span>
          </div>
          <div className="h-1.5 rounded-none bg-[#EAF5F0] overflow-hidden">
            <div className="h-full bg-[#4E9C7C] transition-all" style={{ width: `${percent}%` }} />
          </div>
        </div>
        {results.length > 0 && (
          <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
            {results.map((r, i) => (
              <div key={i} className="border border-[#C9BFA0] rounded-none p-2 bg-white/50">
                <div className="font-mono font-bold text-[10px] text-navy break-all">{r.filename}</div>
                <div className={`font-body text-[11px] mt-0.5 ${statusColor(r.status)}`}>{r.note}</div>
              </div>
            ))}
          </div>
        )}
        {jobStatus === 'completed' && (
          <button
            onClick={() => { setJobId(null); setZipFile(null); setResults([]); setCursor(0); setTotalFiles(null); }}
            className="w-full mt-3 bg-[#4E9C7C] text-white font-condensed font-bold text-xs py-2.5 rounded-none hover:brightness-105 transition-all"
          >
            Upload another zip
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="bg-[#4E9C7C]/8 rounded-none p-3 mb-3">
        <p className="font-body text-xs text-g800 leading-relaxed">
          Upload a zip file containing multiple past papers — no need to sort them first.
          Each document is automatically read and matched to the right course, exam type, and
          year. Every past paper goes to the moderation queue for a quick final approval (to
          preserve watermarking). PDF, Word, PowerPoint, and photo/scan (JPG, PNG) files can
          all be auto-processed — anything else is flagged for manual review.
        </p>
      </div>
      <div className="mb-1">
        <label className={labelClass}>Zip File</label>
        <label htmlFor="zip-file" className="block border border-dashed border-[#4E9C7C] rounded-none bg-[#4E9C7C]/5 py-[9px] px-2.5 text-center cursor-pointer">
          <span className="block font-mono font-bold text-[10px] text-navy underline mb-0.5 truncate">
            {zipFile ? zipFile.name : 'Attach zip file'}
          </span>
        </label>
        <input id="zip-file" type="file" accept=".zip" onChange={(e) => setZipFile(e.target.files?.[0] ?? null)} className="hidden" />
      </div>
      {error && <p className="font-body text-xs text-red-500 mt-2.5">{error}</p>}
      <button
        type="button"
        disabled={uploading}
        onClick={handleZipUpload}
        className="w-full mt-3 bg-[#4E9C7C] text-white font-condensed font-bold text-[12.5px] uppercase tracking-wide py-[11px] rounded-none shadow-[0_3px_8px_rgba(78,156,124,0.35)] disabled:opacity-60 hover:brightness-105 transition-all"
      >
        {uploading ? 'Uploading…' : 'Upload and Process'}
      </button>
    </div>
  );
}
