'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { CourseOption } from '@/lib/papers-data';

type Tab = 'paper' | 'material';

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

    // Duplicate check before uploading the file
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

      const { error: insertErr } = await supabase.from('past_papers').insert({
        course_id: courseId,
        year: Number(year),
        exam_type: examType,
        file_url: path,
        uploaded_by: user.id,
      });

      setLoading(false);
      if (insertErr) return setError(insertErr.message);
      setDone(true);
    } else {
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
        content_type: contentType,
        week_number: Number(week),
        file_url: publicUrlData.publicUrl,
        uploaded_by: user.id,
      });

      setLoading(false);
      if (insertErr) return setError(insertErr.message);
      setDone(true);
    }
  };

  return (
    <div className="bg-white border border-g100 rounded-2xl p-6">
      <div className="flex gap-2 mb-6">
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
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Course</label>
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className={inputClass} required>
            <option value="">Select a course…</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
            ))}
          </select>
        </div>

        {tab === 'paper' ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Exam type</label>
              <select value={examType} onChange={(e) => setExamType(e.target.value as any)} className={inputClass}>
                <option value="mid_semester">Mid-Semester</option>
                <option value="end_of_semester">End of Semester</option>
              </select>
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
                <select value={contentType} onChange={(e) => setContentType(e.target.value as any)} className={inputClass}>
                  <option value="lecture_slides">Lecture Slides</option>
                  <option value="study_notes">Study Notes</option>
                  <option value="study_guide">Study Guide</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Week</label>
                <select value={week} onChange={(e) => setWeek(e.target.value)} className={inputClass}>
                  {LEVELS_WEEKS.map((w) => (
                    <option key={w} value={w}>Week {w}</option>
                  ))}
                </select>
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
    </div>
  );
}

const labelClass = 'block font-condensed font-semibold text-xs uppercase tracking-wide text-g800 mb-2';
const inputClass =
  'w-full px-4 py-3 rounded-lg border border-g100 font-body text-[15px] text-g800 outline-none focus:border-gold transition-colors';