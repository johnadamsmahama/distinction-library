// components/trusted-upload/TrustedUploadPanel.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import CustomSelect from '@/components/ui/CustomSelect';
import type { CourseOption } from '@/lib/papers-data';

type UploadType = 'past_paper' | 'study_material';

type JobResult = {
  filename: string;
  status: 'approved' | 'skipped_duplicate' | 'needs_metadata' | 'needs_course_review' | 'error';
  note: string;
  extractedCode?: string;
};

const labelClass = 'font-mono text-[9px] uppercase tracking-wide text-g600 mb-1 block';

function statusColor(status: JobResult['status']): string {
  if (status === 'approved') return 'text-green-600';
  if (status === 'skipped_duplicate') return 'text-g600';
  if (status === 'needs_metadata' || status === 'needs_course_review') return 'text-orange-500';
  if (status === 'error') return 'text-red-500';
  return 'text-g600';
}

/**
 * Note: courses passed in should include inactive ones (is_active = false),
 * per the decision to let backlog uploads target level 200-400 courses
 * ahead of those levels going live. The caller (the page this is rendered
 * on) is responsible for fetching courses without an is_active filter —
 * unlike every other course picker on the site.
 */
export default function TrustedUploadPanel({ courses }: { courses: CourseOption[] }) {
  const [courseId, setCourseId] = useState('');
  const [uploadType, setUploadType] = useState<UploadType>('past_paper');
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

  const handleUpload = async () => {
    setError(null);
    if (!courseId) return setError('Select a course.');
    if (!zipFile) return setError('Choose a zip file.');
    if (!zipFile.name.toLowerCase().endsWith('.zip')) return setError('Please choose a .zip file.');

    setUploading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUploading(false); setError('Your session expired — please log in again.'); return; }

    const selectedCourse = courses.find((c) => c.id === courseId);
    if (!selectedCourse) { setUploading(false); setError('Selected course not found.'); return; }

    // Uploads straight to the admin-only 'trusted-uploads' bucket — RLS
    // rejects this outright if the current user isn't an admin, so this
    // fails safely before any job row is even created.
    const path = `${user.id}/${Date.now()}-${zipFile.name}`;
    const { error: uploadErr } = await supabase.storage.from('trusted-uploads').upload(path, zipFile);
    if (uploadErr) { setUploading(false); setError(uploadErr.message); return; }

    const { data: job, error: insertErr } = await supabase
      .from('bulk_upload_jobs')
      .insert({
        uploaded_by: user.id,
        zip_path: path,
        job_type: 'trusted',
        trusted_upload_config: {
          courseId,
          courseCode: selectedCourse.code,
          uploadType,
        },
      })
      .select('id')
      .single();

    setUploading(false);
    if (insertErr || !job) { setError(insertErr?.message ?? 'Could not start the upload job.'); return; }

    setJobId(job.id);
    fetch('/api/trusted-upload/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId: job.id }),
    }).catch((e) => console.error('Failed to start trusted upload processing:', e));
  };

  const reset = () => {
    setJobId(null); setJobStatus(null); setTotalFiles(null);
    setCursor(0); setResults([]); setZipFile(null);
  };

  if (jobId) {
    const percent = totalFiles ? Math.round((cursor / totalFiles) * 100) : 0;
    const needsAttention = results.filter(
      (r) => r.status === 'needs_metadata' || r.status === 'needs_course_review'
    ).length;

    return (
      <div className="bg-white border border-g100 rounded-[8px] p-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-condensed font-bold text-xs text-navy">
            {jobStatus === 'completed' ? 'Done' : jobStatus === 'failed' ? 'Something went wrong' : 'Processing…'}
          </span>
          <span className="font-mono text-[9.5px] text-g600">
            {totalFiles !== null ? `${cursor} / ${totalFiles} files` : 'Reading zip…'}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-gold-light/20 overflow-hidden mb-3">
          <div className="h-full bg-gold transition-all" style={{ width: `${percent}%` }} />
        </div>

        {needsAttention > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-[4px] px-3 py-2 mb-3 text-[11.5px] text-orange-700">
            {needsAttention} file{needsAttention === 1 ? '' : 's'} need attention (below) — the rest of the batch
            processed normally.
            {/* Resolution UI (confirm alias / reassign course / skip) is a
                separate follow-up piece — not yet wired to this panel. */}
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-1.5 max-h-[320px] overflow-y-auto">
            {results.map((r, i) => (
              <div key={i} className="border border-g100 rounded-[4px] p-2 bg-off-white">
                <div className="font-mono font-bold text-[10px] text-navy break-all">{r.filename}</div>
                <div className={`font-body text-[11px] mt-0.5 ${statusColor(r.status)}`}>{r.note}</div>
              </div>
            ))}
          </div>
        )}

        {jobStatus === 'completed' && (
          <button
            onClick={reset}
            className="w-full mt-3 bg-navy text-white font-condensed font-bold text-xs py-2.5 rounded-[4px] hover:brightness-110 transition-all"
          >
            Upload another batch
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-g100 rounded-[8px] p-4">
      <div className="mb-3">
        <label className={labelClass}>Course</label>
        <CustomSelect
          value={courseId}
          onChange={setCourseId}
          placeholder="Select a course…"
          options={courses.map((c) => ({
            value: c.id,
            label: `${c.code} — ${c.name}${c.is_active === false ? ' (inactive)' : ''}`,
          }))}
          searchable
        />
      </div>

      <div className="mb-3">
        <label className={labelClass}>Upload Type</label>
        <div className="flex gap-1.5">
          {(['past_paper', 'study_material'] as UploadType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setUploadType(t)}
              className={`flex-1 font-condensed font-bold text-[10px] uppercase text-center rounded-[3px] py-2 border-[1.3px] transition-colors ${
                uploadType === t ? 'bg-navy border-navy text-white' : 'bg-transparent border-navy text-navy'
              }`}
            >
              {t === 'past_paper' ? 'Past Papers' : 'Study Materials'}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-1">
        <label className={labelClass}>Zip File</label>
        <label
          htmlFor="trusted-zip-file"
          className="block border border-dashed border-gold rounded-[4px] bg-gold-light/10 py-[9px] px-2.5 text-center cursor-pointer"
        >
          <span className="block font-mono font-bold text-[10px] text-navy underline mb-0.5 truncate">
            {zipFile ? zipFile.name : 'Attach zip file'}
          </span>
        </label>
        <input
          id="trusted-zip-file"
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
        onClick={handleUpload}
        className="w-full mt-3 bg-navy text-white font-condensed font-bold text-[12.5px] uppercase tracking-wide py-[11px] rounded-[4px] disabled:opacity-60 hover:brightness-110 transition-all"
      >
        {uploading ? 'Uploading…' : 'Upload and Process'}
      </button>
    </div>
  );
}
