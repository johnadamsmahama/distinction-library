'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { CourseOption } from '@/lib/papers-data';
import CustomSelect from '@/components/ui/CustomSelect';

type Tab = 'paper' | 'material' | 'bulk';

const LEVELS_WEEKS = Array.from({ length: 14 }, (_, i) => i + 1);

const labelClass = 'font-mono text-[9px] uppercase tracking-wide text-[#4E9C7C] mb-1 block';
const ruledField = 'pb-1.5 mb-2.5 border-b border-dashed border-[#C9BFA0]';
const inputClass =
  'w-full bg-transparent border-none outline-none font-body text-[13.5px] text-g800 placeholder:text-g600/50 px-0 py-0';

function CatalogShell({
  tabLabel,
  tabColor,
  children,
  className = '',
}: {
  tabLabel: string;
  tabColor: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative bg-[#FBF6E8] rounded-[3px] shadow-[0_12px_28px_rgba(6,15,30,0.4)] ${className}`}>
      <div className="absolute top-[11px] left-[13px] w-[7px] h-[7px] rounded-full bg-g100 shadow-inner" />
      <div
        className="absolute -top-[9px] right-4 text-white font-condensed font-bold text-[8.5px] tracking-wide uppercase px-2.5 pt-1 pb-[3px] rounded-t-[2px]"
        style={{ backgroundColor: tabColor }}
      >
        {tabLabel}
      </div>
      {children}
    </div>
  );
}

export default function UploadForm({
  courses,
  uploadSuspended,
}: {
  courses: CourseOption[];
  uploadSuspended: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('paper');
  const [courseId, setCourseId] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [examType, setExamType] = useState<'mid_semester' | 'end_of_semester'>('end_of_semester');
  const [title, setTitle] = useState('');
  const [contentType, setContentType] = useState<'lecture_slides' | 'study_notes' | 'study_guide'>('lecture_slides');
  const [week, setWeek] = useState('1');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (uploadSuspended) {
    return (
      <CatalogShell tabLabel="Suspended" tabColor="#C0433A">
        <div className="px-4 pt-6 pb-6 pl-8 text-center">
          <h2 className="font-display font-bold text-base text-navy mb-1.5">Uploads suspended</h2>
          <p className="font-body text-[13px] text-g600 leading-relaxed">
            Your upload privileges are currently suspended after reaching 3 strikes. Contact support
            if you believe this is a mistake.
          </p>
        </div>
      </CatalogShell>
    );
  }

  if (done) {
    return (
      <CatalogShell tabLabel="Submitted" tabColor="#4E9C7C">
        <div className="px-4 pt-6 pb-6 pl-8 text-center">
          <h2 className="font-display font-bold text-base text-navy mb-1.5">Submitted for review</h2>
          <p className="font-body text-[13px] text-g600 mb-4 leading-relaxed">
            Thanks for contributing. A moderator will review this shortly — you&apos;ll get a
            notification once it&apos;s approved or rejected.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-navy text-white font-condensed font-bold text-xs uppercase px-4 py-2 rounded-[3px] hover:bg-navy-mid transition-colors"
          >
            Back to dashboard
          </button>
        </div>
      </CatalogShell>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!courseId) return setError('Select a course.');
    if (!file) return setError('Choose a file to upload.');
    if (tab === 'material' && !title.trim()) return setError('Give the material a title.');

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

    if (tab === 'paper') {
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
    } else {
      const { data: existing } = await supabase
        .from('study_materials')
        .select('id')
        .eq('course_id', courseId)
        .eq('week_number', Number(week))
        .ilike('title', title.trim())
        .in('status', ['pending', 'approved'])
        .limit(1);

      if (existing && existing.length > 0) {
        setLoading(false);
        setError('A study material with this title already exists for this course and week.');
        return;
      }
    }

    const ext = file.name.split('.').pop();
    const path = `${user.id}/${courseId}/${Date.now()}.${ext}`;

    if (tab === 'paper') {
      const { error: uploadErr } = await supabase.storage.from('past-papers').upload(path, file);
      if (uploadErr) {
        setLoading(false);
        setError(uploadErr.message);
        return;
      }

      const { data: inserted, error: insertErr } = await supabase
        .from('past_papers')
        .insert({
          course_id: courseId,
          year: Number(year),
          exam_type: examType,
          file_url: path,
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
    } else {
      const { error: uploadErr } = await supabase.storage.from('study-materials').upload(path, file);
      if (uploadErr) {
        setLoading(false);
        setError(uploadErr.message);
        return;
      }

      const { data: publicUrlData } = supabase.storage.from('study-materials').getPublicUrl(path);

      const { data: inserted, error: insertErr } = await supabase
        .from('study_materials')
        .insert({
          course_id: courseId,
          title: title.trim(),
          content_type: contentType,
          week_number: Number(week),
          file_url: publicUrlData.publicUrl,
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
          body: JSON.stringify({ kind: 'study_material' }),
        }).catch(() => {});
      }

      setDone(true);
    }
  };

  return (
    <CatalogShell tabLabel="Contribution" tabColor="#4E9C7C" className="flex flex-col flex-1 min-h-0">
      <div className="flex items-baseline justify-between px-4 pt-4 pb-2 pl-8 border-b-[1.5px] border-[#C9BFA0] shrink-0">
        <span className="font-mono text-[10px] text-g600 tracking-wide">UPSA / {year}</span>
        <span className="font-display font-bold text-sm text-navy">New Entry</span>
      </div>

      <div className="px-4 pt-3 pb-4 pl-8 flex-1 flex flex-col min-h-0">
        <div className={`${ruledField} shrink-0`}>
          <div className={labelClass}>Resource Type</div>
          <div className="flex gap-1">
            {(['paper', 'material', 'bulk'] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`flex-1 min-w-0 font-condensed font-bold text-[8.5px] uppercase text-center leading-tight rounded-[2px] py-[7px] px-[3px] border-[1.3px] transition-colors ${
                  tab === t ? 'bg-navy border-navy text-white' : 'bg-transparent border-navy text-navy'
                }`}
              >
                {t === 'paper' ? 'Past Paper' : t === 'material' ? 'Study Material' : 'Bulk Upload'}
              </button>
            ))}
          </div>
        </div>

        {tab === 'bulk' ? (
          <BulkUploadPanel />
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <div className={`${ruledField} shrink-0`}>
              <label className={labelClass}>Course</label>
              <CustomSelect
                value={courseId}
                onChange={setCourseId}
                placeholder="Select a course…"
                options={courses.map((c) => ({ value: c.id, label: `${c.code} — ${c.name}` }))}
              />
            </div>

            {tab === 'paper' ? (
              <div className={`flex gap-3.5 shrink-0 ${ruledField}`}>
                <div className="flex-1 border-0 pb-0 mb-0">
                  <label className={labelClass}>Exam Type</label>
                  <CustomSelect
                    value={examType}
                    onChange={(v) => setExamType(v as any)}
                    options={[
                      { value: 'mid_semester', label: 'Mid-Semester' },
                      { value: 'end_of_semester', label: 'End of Semester' },
                    ]}
                  />
                </div>
                <div className="flex-1 border-0 pb-0 mb-0">
                  <label className={labelClass}>Year</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className={inputClass}
                    min={2000}
                    max={2100}
                  />
                </div>
              </div>
            ) : (
              <div className="shrink-0">
                <div className={ruledField}>
                  <label className={labelClass}>Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={inputClass}
                    placeholder="e.g. Week 4 — Sampling Methods"
                  />
                </div>
                <div className={`flex gap-3.5 ${ruledField}`}>
                  <div className="flex-1 border-0 pb-0 mb-0">
                    <label className={labelClass}>Type</label>
                    <CustomSelect
                      value={contentType}
                      onChange={(v) => setContentType(v as any)}
                      options={[
                        { value: 'lecture_slides', label: 'Lecture Slides' },
                        { value: 'study_notes', label: 'Study Notes' },
                        { value: 'study_guide', label: 'Study Guide' },
                      ]}
                    />
                  </div>
                  <div className="flex-1 border-0 pb-0 mb-0">
                    <label className={labelClass}>Week</label>
                    <CustomSelect
                      value={week}
                      onChange={setWeek}
                      options={LEVELS_WEEKS.map((w) => ({ value: String(w), label: `Week ${w}` }))}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* File + submit pinned to the bottom of the growing form */}
            <div className="mt-auto pt-1">
              <div className="mb-1">
                <label className={labelClass}>File</label>
                <label
                  htmlFor="resource-file"
                  className="block border border-dashed border-[#4E9C7C] rounded-[3px] bg-[#4E9C7C]/5 py-[9px] px-2.5 text-center cursor-pointer"
                >
                  <span className="block font-mono font-bold text-[10px] text-navy underline mb-0.5 truncate">
                    {file ? file.name : 'Attach file'}
                  </span>
                  <span className="block font-mono text-[9px] text-g600 tracking-wide">
                    PDF · WORD · POWERPOINT · JPG · PNG
                  </span>
                </label>
                <input
                  id="resource-file"
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
                className="w-full mt-3 bg-[#4E9C7C] text-white font-condensed font-bold text-[12.5px] uppercase tracking-wide py-[11px] rounded-[3px] shadow-[0_3px_8px_rgba(78,156,124,0.35)] disabled:opacity-60 flex items-center justify-center gap-[7px] hover:brightness-105 transition-all"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
                {loading ? 'Uploading…' : 'Submit for Review'}
              </button>
            </div>
          </form>
        )}
      </div>
    </CatalogShell>
  );
}

type JobResult = { filename: string; status: string; note: string };

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
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [jobId]);

  const handleZipUpload = async () => {
    setError(null);
    if (!zipFile) return setError('Choose a zip file first.');
    if (!zipFile.name.toLowerCase().endsWith('.zip')) return setError('Please choose a .zip file.');

    setUploading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setUploading(false);
      setError('Your session expired — please log in again.');
      return;
    }

    const path = `${user.id}/${Date.now()}-${zipFile.name}`;
    const { error: uploadErr } = await supabase.storage.from('bulk-uploads').upload(path, zipFile);
    if (uploadErr) {
      setUploading(false);
      setError(uploadErr.message);
      return;
    }

    const { data: job, error: insertErr } = await supabase
      .from('bulk_upload_jobs')
      .insert({ uploaded_by: user.id, zip_path: path })
      .select('id')
      .single();

    setUploading(false);
    if (insertErr || !job) {
      setError(insertErr?.message ?? 'Could not start the upload job.');
      return;
    }

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
      <div className={ruledField}>
        <div className="mb-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-condensed font-bold text-xs text-navy">
              {jobStatus === 'completed' ? 'Done' : jobStatus === 'failed' ? 'Something went wrong' : 'Processing…'}
            </span>
            <span className="font-mono text-[9.5px] text-g600">
              {totalFiles !== null ? `${cursor} / ${totalFiles} files` : 'Reading zip…'}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-[#EAF5F0] overflow-hidden">
            <div className="h-full bg-[#4E9C7C] transition-all" style={{ width: `${percent}%` }} />
          </div>
        </div>

        {results.length > 0 && (
          <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
            {results.map((r, i) => (
              <div key={i} className="border border-[#C9BFA0] rounded-[3px] p-2 bg-white/50">
                <div className="font-mono font-bold text-[10px] text-navy break-all">{r.filename}</div>
                <div className={`font-body text-[11px] mt-0.5 ${statusColor(r.status)}`}>{r.note}</div>
              </div>
            ))}
          </div>
        )}

        {jobStatus === 'completed' && (
          <button
            onClick={() => {
              setJobId(null);
              setZipFile(null);
              setResults([]);
              setCursor(0);
              setTotalFiles(null);
            }}
            className="w-full mt-3 bg-[#4E9C7C] text-white font-condensed font-bold text-xs py-2.5 rounded-[3px] hover:brightness-105 transition-all"
          >
            Upload another zip
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="bg-[#4E9C7C]/8 rounded-[3px] p-3 mb-3">
        <p className="font-body text-xs text-g800 leading-relaxed">
          Upload a zip file containing multiple past papers or study materials — no need to sort
          them first. Each document is automatically read, matched to the right course, and
          categorized. Confident study material matches go live immediately; past papers always
          go to the moderation queue for a quick final approval (to preserve watermarking). PDF,
          Word, PowerPoint, and photo/scan (JPG, PNG) files can all be auto-processed — anything
          else is flagged for manual review.
        </p>
      </div>

      <div className="mb-1">
        <label className={labelClass}>Zip File</label>
        <label
          htmlFor="zip-file"
          className="block border border-dashed border-[#4E9C7C] rounded-[3px] bg-[#4E9C7C]/5 py-[9px] px-2.5 text-center cursor-pointer"
        >
          <span className="block font-mono font-bold text-[10px] text-navy underline mb-0.5 truncate">
            {zipFile ? zipFile.name : 'Attach zip file'}
          </span>
        </label>
        <input
          id="zip-file"
          type="file"
          accept=".zip"
          onChange={(e) => setZipFile(e.target.files?.[0] ?? null)}
          className="hidden"
        />
      </div>

      {error && <p className="font-body text-xs text-red-500 mt-2.5">{error}</p>}

      <button
        type="button"
        disabled={uploading}
        onClick={handleZipUpload}
        className="w-full mt-3 bg-[#4E9C7C] text-white font-condensed font-bold text-[12.5px] uppercase tracking-wide py-[11px] rounded-[3px] shadow-[0_3px_8px_rgba(78,156,124,0.35)] disabled:opacity-60 hover:brightness-105 transition-all"
      >
        {uploading ? 'Uploading…' : 'Upload and Process'}
      </button>
    </div>
  );
}

function statusColor(status: string): string {
  if (status === 'auto_approved') return 'text-green-600';
  if (status === 'queued_for_review') return 'text-gold';
  if (status === 'skipped_duplicate') return 'text-g600';
  if (status === 'needs_manual_review') return 'text-orange-500';
  if (status === 'error') return 'text-red-500';
  return 'text-g600';
}
