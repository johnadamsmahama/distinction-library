'use client';

import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import FilePreview from '@/components/moderate/FilePreview';

type CourseOption = { id: string; code: string; name: string };

type AutoPublishedItem = {
  id: string;
  title: string;
  content_type: string;
  week_number: number | null;
  file_url: string;
  ai_confidence: number | null;
  ai_review_notes: string | null;
  auto_publish_reviewed: boolean;
  course_id: string;
  created_at: string;
  courses: { id: string; code: string; name: string };
};

const selectClass =
  'w-full border border-g100 rounded-none px-2.5 py-2 font-body text-sm text-g800 outline-none focus:border-gold bg-white';

function confidenceStyle(confidence: number | null) {
  const pct = Math.round((confidence ?? 0) * 100);
  if (pct < 75) return { label: `${pct}% confidence`, className: 'bg-red-50 text-red-600 border-red-200' };
  if (pct < 90) return { label: `${pct}% confidence`, className: 'bg-amber-50 text-amber-700 border-amber-200' };
  return { label: `${pct}% confidence`, className: 'bg-green-50 text-green-700 border-green-200' };
}

export default function AutoPublishReview({
  initialItems,
  courses,
  totalCount,
  initialReviewedCount,
}: {
  initialItems: AutoPublishedItem[];
  courses: CourseOption[];
  totalCount: number;
  initialReviewedCount: number;
}) {
  const [items, setItems] = useState(initialItems);
  const [hideReviewed, setHideReviewed] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [reassignId, setReassignId] = useState<string | null>(null);
  const [reassignCourseId, setReassignCourseId] = useState<string>('');

  const supabase = createClient();

  const reviewedCount = items.filter((i) => i.auto_publish_reviewed).length;
  const lowConfidenceCount = items.filter((i) => (i.ai_confidence ?? 0) < 0.75).length;
  const awaitingCount = items.length - reviewedCount;

  const visibleItems = useMemo(
    () => (hideReviewed ? items.filter((i) => !i.auto_publish_reviewed) : items),
    [items, hideReviewed]
  );

  const markReviewed = async (id: string) => {
    setBusyId(id);
    const { error } = await supabase
      .from('study_materials')
      .update({ auto_publish_reviewed: true })
      .eq('id', id);
    setBusyId(null);
    if (error) {
      alert(error.message);
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, auto_publish_reviewed: true } : i)));
  };

  const openReassign = (item: AutoPublishedItem) => {
    setReassignId(reassignId === item.id ? null : item.id);
    setReassignCourseId(item.course_id);
  };

  const saveReassign = async (id: string) => {
    if (!reassignCourseId) return;
    setBusyId(id);
    const { error } = await supabase
      .from('study_materials')
      .update({ course_id: reassignCourseId, auto_publish_reviewed: true })
      .eq('id', id);
    setBusyId(null);
    if (error) {
      alert(error.message);
      return;
    }
    const newCourse = courses.find((c) => c.id === reassignCourseId);
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? {
              ...i,
              course_id: reassignCourseId,
              auto_publish_reviewed: true,
              courses: newCourse ? { id: newCourse.id, code: newCourse.code, name: newCourse.name } : i.courses,
            }
          : i
      )
    );
    setReassignId(null);
  };

  // Pulls the item off the live site — sends it back to the normal
  // moderation queue instead of deleting it outright, since it might just
  // need a course/week fix rather than being genuinely wrong.
  const unpublish = async (id: string) => {
    if (!confirm('This removes the item from the live library and sends it back to the moderation queue. Continue?')) {
      return;
    }
    setBusyId(id);
    const { error } = await supabase
      .from('study_materials')
      .update({ status: 'pending', ai_review_status: 'needs_review', auto_publish_reviewed: true })
      .eq('id', id);
    setBusyId(null);
    if (error) {
      alert(error.message);
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-2.5 mb-5">
        <div className="bg-white border border-g100 rounded-none px-3.5 py-3">
          <div className="font-condensed font-bold text-xl text-navy">{totalCount}</div>
          <div className="font-condensed text-[10px] uppercase tracking-wide text-g600 mt-0.5">Auto-published</div>
        </div>
        <div className="bg-white border border-g100 rounded-none px-3.5 py-3">
          <div className="font-condensed font-bold text-xl text-amber-600">{lowConfidenceCount}</div>
          <div className="font-condensed text-[10px] uppercase tracking-wide text-g600 mt-0.5">Below 75%</div>
        </div>
        <div className="bg-white border border-g100 rounded-none px-3.5 py-3">
          <div className="font-condensed font-bold text-xl text-navy">{awaitingCount}</div>
          <div className="font-condensed text-[10px] uppercase tracking-wide text-g600 mt-0.5">Awaiting check</div>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <label className="flex items-center gap-2 font-condensed font-bold text-xs uppercase text-g600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={hideReviewed}
            onChange={(e) => setHideReviewed(e.target.checked)}
            className="accent-gold w-4 h-4"
          />
          Hide reviewed
        </label>
        <span className="ml-auto font-condensed text-[11px] text-g600 bg-g50 border border-g100 rounded-none px-2.5 py-1">
          confidence ↑
        </span>
      </div>

      {visibleItems.length === 0 ? (
        <p className="font-body text-sm text-g600 text-center py-16">
          {hideReviewed ? 'Nothing new to review right now.' : 'No auto-published items yet.'}
        </p>
      ) : (
        <div className="space-y-3">
          {visibleItems.map((item) => {
            const conf = confidenceStyle(item.ai_confidence);
            const isReviewed = item.auto_publish_reviewed;
            return (
              <div
                key={item.id}
                className={`bg-white border border-g100 rounded-none p-4 ${isReviewed ? 'opacity-50' : ''}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-condensed font-bold text-sm text-navy">
                      {item.courses.code} — {item.courses.name}
                    </div>
                    <div className="font-body text-[11.5px] text-g600 mt-0.5 break-all">
                      {item.title}
                      {item.week_number ? ` · Week ${item.week_number}` : ''}
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 font-condensed font-bold text-[10.5px] uppercase px-2.5 py-1 rounded-full border mt-2 ${conf.className}`}
                    >
                      {conf.label}
                    </span>
                    {item.ai_review_notes && (
                      <div className="font-body text-xs text-g600 mt-2 pl-2.5 border-l-2 border-g100">
                        {item.ai_review_notes}
                      </div>
                    )}
                  </div>

                  {!isReviewed && (
                    <div className="flex flex-wrap gap-2 flex-shrink-0">
                      <button
                        onClick={() => setPreviewId(previewId === item.id ? null : item.id)}
                        className="font-condensed font-bold text-xs uppercase px-3.5 py-2 rounded-none border border-g100 text-g600 hover:border-navy hover:text-navy transition-colors"
                      >
                        {previewId === item.id ? 'Hide' : 'Preview'}
                      </button>
                      <button
                        disabled={busyId === item.id}
                        onClick={() => markReviewed(item.id)}
                        className="font-condensed font-bold text-xs uppercase px-3.5 py-2 rounded-none bg-gold text-navy hover:bg-gold-light transition-colors disabled:opacity-60"
                      >
                        {busyId === item.id ? 'Working…' : 'Looks Good'}
                      </button>
                      <button
                        onClick={() => openReassign(item)}
                        className={`font-condensed font-bold text-xs uppercase px-3.5 py-2 rounded-none border transition-colors ${
                          reassignId === item.id
                            ? 'border-red-300 text-red-600 bg-red-50'
                            : 'border-red-300 text-red-500 hover:bg-red-50'
                        }`}
                      >
                        Wrong Course
                      </button>
                    </div>
                  )}

                  {isReviewed && (
                    <div className="flex items-center gap-1.5 font-condensed font-bold text-xs uppercase text-g600 flex-shrink-0">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#15803D" strokeWidth="3">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      Reviewed
                    </div>
                  )}
                </div>

                {previewId === item.id && <FilePreview kind="material" fileUrl={item.file_url} />}

                {reassignId === item.id && (
                  <div className="mt-3 pt-3 border-t border-g100">
                    <label className="font-condensed font-bold text-[10px] uppercase text-g600 block mb-1">
                      Reassign to the correct course
                    </label>
                    <select
                      value={reassignCourseId}
                      onChange={(e) => setReassignCourseId(e.target.value)}
                      className={`${selectClass} mb-2.5`}
                    >
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.code} — {c.name}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        disabled={busyId === item.id}
                        onClick={() => saveReassign(item.id)}
                        className="font-condensed font-bold text-xs uppercase px-3.5 py-2 rounded-none bg-navy text-white hover:bg-navy-mid transition-colors disabled:opacity-60"
                      >
                        Save Course
                      </button>
                      <button
                        disabled={busyId === item.id}
                        onClick={() => unpublish(item.id)}
                        className="font-condensed font-bold text-xs uppercase px-3.5 py-2 rounded-none border border-g100 text-g600 hover:border-red-300 hover:text-red-500 transition-colors"
                      >
                        Unpublish
                      </button>
                      <button
                        onClick={() => setReassignId(null)}
                        className="font-condensed font-bold text-xs uppercase px-3.5 py-2 text-g600 underline"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-center font-condensed text-[11px] text-g600 mt-6">
        {reviewedCount} of {totalCount} reviewed
      </p>
    </div>
  );
}
