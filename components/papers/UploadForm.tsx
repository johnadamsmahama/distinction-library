'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { CourseOption } from '@/lib/papers-data';
import CustomSelect from '@/components/ui/CustomSelect';

type Tab = 'paper' | 'material' | 'bulk';

const LEVELS_WEEKS = Array.from({ length: 14 }, (_, i) => i + 1);

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
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <h2 className="font-display font-bold text-lg text-red-700 mb-2">Uploads suspended</h2>
        <p className="font-body text-sm text-red-600">
          Your upload privileges are currently suspended after reaching 3 strikes. Contact support
          if you believe this is a mistake.
        </p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="bg-white border border-g100 rounded-2xl p-6 text-center">
        <h2 className="font-display font-bold text-lg text-navy mb-2">Submitted for review</h2>
        <p className="font-body text-sm text-g600 mb-5">
          Thanks for contributing. A moderator will review this shortly — you&apos;ll get a
          notification once it&apos;s approved or rejected.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="bg-gold text-navy font-condensed font-bold text-xs uppercase px-5 py-2.5 rounded-lg hover:bg-gold-light transition-colors"
        >
          Back to dashboard
        </button>
      </div>
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

      // Fire the AI pre-screen in the background — don't block the
      // "submitted" screen waiting for it to finish.
      if (inserted) {
        fetch(`/api/moderation/ai-review/${inserted.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kind: 'past_paper' }),
        }).catch(() => {
          // Non-fatal — it'll just sit in the queue for manual review.
        });
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

      // Fire the AI pre-screen in the background — don't block the
      // "submitted" screen waiting for it to finish.
      if (inserted) {
        fetch(`/api/moderation/ai-review/${inserted.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kind: 'study_material' }),
        }).catch(() => {
          // Non-fatal — it'll just sit in the queue for manual review.
        });
      }

      setDone(true);
    }
  };

  return (
    <div className="bg-white border border-g100 rounded-2xl p-6">
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          type="button"
          onClick={() => setTab('paper')}
          className={`font-condensed font-bold text-xs uppercase tracking-wide px-4 py-2 rounded-lg transition-colors ${
            tab === 'paper' ? 'bg-navy text-white' : 'bg-off-white text-g600'
          }`}
        >
          Past Paper
        </button>
        <button
          type="button"
          onClick={() => setTab('material')}
          className={`font-condensed font-bold text-xs uppercase tracking-wide px-4 py-2 rounded-lg transition-colors ${
            tab === 'material' ? 'bg-navy text-white' : 'bg-off-white text-g600'
          }`}
        >
          Study Material
        </button>
        <button
          type="button"
          onClick={() => setTab('bulk')}
          className={`font-condensed font-bold text-xs uppercase tracking-wide px-4 py-2 rounded-lg transition-colors ${
            tab === 'bulk' ? 'bg-navy text-white' : 'bg-off-white text-g600'
          }`}
        >
          Bulk Upload (Zip)
        </button>
      </div>

      {tab === 'bulk' ? (
        <BulkUploadPanel />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Course</label>
            <CustomSelect
              value={courseId}
              onChange={setCourseId}
              placeholder="Select a course…"
              options={courses.map((c) => ({ value: c.id, label: `${c.code} — ${c.name}` }))}
            />
          </div>

          {tab === 'paper' ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Exam type</label>
                <CustomSelect
                  value={examType}
                  onChange={(v) => setExamType(v as any)}
                  options={[
                    { value: 'mid_semester', label: 'Mid-Semester' },
                    { value: 'end_of_semester', label: 'End of Semester' },
                  ]}
                />
              </div>
              <div>
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
            <>
              <div>
                <label className={labelClass}>Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Week 4 — Sampling Methods"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
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
                <div>
                  <label className={labelClass}>Week</label>
                  <CustomSelect
                    value={week}
                    onChange={setWeek}
                    options={LEVELS_WEEKS.map((w) => ({ value: String(w), label: `Week ${w}` }))}
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className={labelClass}>File</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full font-body text-sm text-g600"
            />
            <p className="font-body text-xs text-g600 mt-1.5">PDF, Word, or PowerPoint.</p>
          </div>

          {error && <p className="font-body text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold text-navy font-condensed font-bold text-sm py-3 rounded-lg hover:bg-gold-light transition-colors disabled:opacity-60"
          >
            {loading ? 'Uploading…' : 'Submit for review'}
          </button>
        </form>
      )}
    </div>
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

    // Kick off processing — nothing else triggers this automatically.
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
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-condensed font-bold text-sm text-navy">
              {jobStatus === 'completed' ? 'Done' : jobStatus === 'failed' ? 'Something went wrong' : 'Processing…'}
            </span>
            <span className="font-body text-xs text-g600">
              {totalFiles !== null ? `${cursor} / ${totalFiles} files` : 'Reading zip…'}
            </span>
          </div>
          <div className="h-2 rounded-full bg-off-white overflow-hidden">
            <div
              className="h-full bg-gold transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {results.length > 0 && (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {results.map((r, i) => (
              <div key={i} className="border border-g100 rounded-lg p-3">
                <div className="font-condensed font-bold text-xs text-navy break-all">{r.filename}</div>
                <div className={`font-body text-xs mt-1 ${statusColor(r.status)}`}>{r.note}</div>
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
            className="w-full mt-4 bg-gold text-navy font-condensed font-bold text-sm py-3 rounded-lg hover:bg-gold-light transition-colors"
          >
            Upload another zip
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-off-white rounded-lg p-4">
        <p className="font-body text-sm text-g600">
          Upload a zip file containing multiple past papers or study materials — no need to sort
          them first. Each document is automatically read, matched to the right course, and
          categorized. Confident study material matches go live immediately; past papers always
          go to the moderation queue for a quick final approval (to preserve watermarking). PDF
          and PowerPoint (.pptx) files can be auto-processed — other formats are flagged for
          manual review.
        </p>
      </div>

      <div>
        <label className={labelClass}>Zip file</label>
        <input
          type="file"
          accept=".zip"
          onChange={(e) => setZipFile(e.target.files?.[0] ?? null)}
          className="w-full font-body text-sm text-g600"
        />
      </div>

      {error && <p className="font-body text-sm text-red-500">{error}</p>}

      <button
        type="button"
        disabled={uploading}
        onClick={handleZipUpload}
        className="w-full bg-gold text-navy font-condensed font-bold text-sm py-3 rounded-lg hover:bg-gold-light transition-colors disabled:opacity-60"
      >
        {uploading ? 'Uploading…' : 'Upload and process'}
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

const labelClass = 'block font-condensed font-semibold text-xs uppercase tracking-wide text-g800 mb-2';
const inputClass =
  'w-full px-4 py-3 rounded-lg border border-g100 font-body text-[15px] text-g800 outline-none focus:border-gold transition-colors';
