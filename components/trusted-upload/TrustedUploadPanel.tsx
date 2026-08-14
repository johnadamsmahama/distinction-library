// components/trusted-upload/TrustedUploadPanel.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import CustomSelect from '@/components/ui/CustomSelect';
import type { CourseOption } from '@/lib/papers-data';
import type { JobResult, UploadType } from '@/lib/trusted-upload/types';
import { searchCoursesForReassignment } from '@/lib/trusted-upload/resolve-mismatch';

const labelClass = 'font-mono text-[9px] uppercase tracking-wide text-g600 mb-1 block';

function statusColor(status: JobResult['status']): string {
  if (status === 'approved') return 'text-green-600';
  if (status === 'skipped_duplicate' || status === 'skipped_manual') return 'text-g600';
  if (status === 'needs_metadata' || status === 'needs_course_review') return 'text-orange-500';
  if (status === 'error') return 'text-red-500';
  return 'text-g600';
}

async function callResolve(payload: Record<string, unknown>): Promise<JobResult> {
  const res = await fetch('/api/trusted-upload/resolve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Resolve failed');
  return data.result as JobResult;
}

function ResolveRow({
  jobId,
  result,
  uploadType,
  onResolved,
}: {
  jobId: string;
  result: JobResult;
  uploadType: UploadType;
  onResolved: (r: JobResult) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [mode, setMode] = useState<'idle' | 'reassign' | 'metadata'>('idle');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CourseOption[]>([]);
  const [searching, setSearching] = useState(false);

  const [year, setYear] = useState('');
  const [examType, setExamType] = useState<'mid_semester' | 'end_of_semester'>('end_of_semester');
  const [weekNumber, setWeekNumber] = useState('');

  const run = async (payload: Record<string, unknown>) => {
    setBusy(true);
    setErr(null);
    try {
      const r = await callResolve({ jobId, filename: result.filename, ...payload });
      onResolved(r);
    } catch (e: any) {
      setErr(e.message ?? 'Failed to resolve.');
    } finally {
      setBusy(false);
    }
  };

  const doSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.trim().length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const supabase = createClient();
    try {
      const found = await searchCoursesForReassignment(supabase, q);
      setSearchResults(found as CourseOption[]);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="border border-g100 rounded-[4px] p-2 bg-off-white">
      <div className="font-mono font-bold text-[10px] text-navy break-all">{result.filename}</div>
      <div className={`font-body text-[11px] mt-0.5 ${statusColor(result.status)}`}>{result.note}</div>

      {busy && <div className="font-body text-[11px] text-g600 mt-1.5">Working…</div>}
      {err && <div className="font-body text-[11px] text-red-500 mt-1.5">{err}</div>}

      {!busy && result.status === 'needs_course_review' && mode === 'idle' && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          <button
            onClick={() => run({ action: 'confirm_alias', extractedCode: result.extractedCode })}
            className="font-condensed font-bold text-[10px] uppercase text-white bg-navy px-2.5 py-1.5 rounded-[3px]"
          >
            Confirm as alias
          </button>
          <button
            onClick={() => setMode('reassign')}
            className="font-condensed font-bold text-[10px] uppercase text-navy border border-navy px-2.5 py-1.5 rounded-[3px]"
          >
            Reassign course
          </button>
          <button
            onClick={() => run({ action: 'skip' })}
            className="font-condensed font-bold text-[10px] uppercase text-g600 border border-g100 px-2.5 py-1.5 rounded-[3px]"
          >
            Skip
          </button>
        </div>
      )}

      {!busy && result.status === 'needs_course_review' && mode === 'reassign' && (
        <div className="mt-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => doSearch(e.target.value)}
            placeholder="Search course code or name…"
            className="w-full text-[12px] border border-g100 rounded-[3px] px-2 py-1.5 mb-1.5"
          />
          {searching && <div className="font-body text-[11px] text-g600">Searching…</div>}
          <div className="space-y-1 max-h-[140px] overflow-y-auto">
            {searchResults.map((c) => (
              <button
                key={c.id}
                onClick={() => run({ action: 'reassign', newCourseId: c.id, newCourseCode: c.code })}
                className="w-full text-left text-[11.5px] px-2 py-1.5 rounded-[3px] hover:bg-gold-light/10 border border-g100"
              >
                {c.code} — {c.name}{c.is_active === false ? ' (inactive)' : ''}
              </button>
            ))}
          </div>
          <button
            onClick={() => setMode('idle')}
            className="font-condensed font-bold text-[10px] uppercase text-g600 mt-1.5"
          >
            Cancel
          </button>
        </div>
      )}

      {!busy && result.status === 'needs_metadata' && mode === 'idle' && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          <button
            onClick={() => setMode('metadata')}
            className="font-condensed font-bold text-[10px] uppercase text-white bg-navy px-2.5 py-1.5 rounded-[3px]"
          >
            Fill in details
          </button>
          <button
            onClick={() => run({ action: 'skip' })}
            className="font-condensed font-bold text-[10px] uppercase text-g600 border border-g100 px-2.5 py-1.5 rounded-[3px]"
          >
            Skip
          </button>
        </div>
      )}

      {!busy && result.status === 'needs_metadata' && mode === 'metadata' && (
        <div className="mt-2">
          {uploadType === 'past_paper' ? (
            <div className="flex gap-2 mb-2">
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="Year"
                className="w-24 text-[12px] border border-g100 rounded-[3px] px-2 py-1.5"
              />
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value as any)}
                className="text-[12px] border border-g100 rounded-[3px] px-2 py-1.5"
              >
                <option value="mid_semester">Mid Semester</option>
                <option value="end_of_semester">End of Semester</option>
              </select>
            </div>
          ) : (
            <input
              type="number"
              value={weekNumber}
              onChange={(e) => setWeekNumber(e.target.value)}
              placeholder="Week number"
              className="w-32 text-[12px] border border-g100 rounded-[3px] px-2 py-1.5 mb-2"
            />
          )}
          <div className="flex gap-1.5">
            <button
              onClick={() =>
                uploadType === 'past_paper'
                  ? run({ action: 'provide_metadata', year: Number(year), examType })
                  : run({ action: 'provide_metadata', weekNumber: Number(weekNumber) })
              }
              disabled={uploadType === 'past_paper' ? !year : !weekNumber}
              className="font-condensed font-bold text-[10px] uppercase text-white bg-navy px-2.5 py-1.5 rounded-[3px] disabled:opacity-50"
            >
              Save &amp; Publish
            </button>
            <button
              onClick={() => setMode('idle')}
              className="font-condensed font-bold text-[10px] uppercase text-g600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

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

    const path = `${user.id}/${Date.now()}-${zipFile.name}`;
    const { error: uploadErr } = await supabase.storage.from('trusted-uploads').upload(path, zipFile);
    if (uploadErr) { setUploading(false); setError(uploadErr.message); return; }

    const { data: job, error: insertErr } = await supabase
      .from('bulk_upload_jobs')
      .insert({
        uploaded_by: user.id,
        zip_path: path,
        job_type: 'trusted',
        trusted_upload_config: { courseId, courseCode: selectedCourse.code, uploadType },
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

  const handleResolved = (updated: JobResult) => {
    setResults((prev) => prev.map((r) => (r.filename === updated.filename ? updated : r)));
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
            {needsAttention} file{needsAttention === 1 ? '' : 's'} need attention — resolve them below, the
            rest of the batch already processed normally.
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-1.5 max-h-[420px] overflow-y-auto">
            {results.map((r) => (
              <ResolveRow
                key={r.filename}
                jobId={jobId}
                result={r}
                uploadType={uploadType}
                onResolved={handleResolved}
              />
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
