'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type CourseOption = { id: string; code: string; name: string };

type PendingPaper = {
  id: string;
  year: number;
  exam_type: string;
  file_url: string;
  created_at: string;
  uploaded_by: string;
  course_id: string;
  detected_type: string | null;
  type_mismatch: boolean;
  classification_notes: string | null;
  courses: { id: string; code: string; name: string };
  profiles: { id: string; student_id: string; full_name: string | null };
};

type PendingMaterial = {
  id: string;
  title: string;
  suggested_title: string | null;
  content_type: string;
  week_number: number | null;
  file_url: string;
  created_at: string;
  uploaded_by: string | null;
  course_id: string;
  detected_type: string | null;
  type_mismatch: boolean;
  classification_notes: string | null;
  courses: { id: string; code: string; name: string };
  profiles: { id: string; student_id: string; full_name: string | null } | null;
};

const TYPE_LABELS: Record<string, string> = {
  past_paper: 'Past Paper',
  lecture_slides: 'Lecture Slides',
  study_guide: 'Study Guide',
  other: 'Other',
};

type Decision = 'rejected' | 'needs_revision';

type PaperEditValues = { courseId: string; year: number; examType: string };
type MaterialEditValues = { courseId: string; title: string; weekNumber: number; contentType: string };

const selectClass =
  'w-full border border-g100 rounded-lg px-2.5 py-2 font-body text-sm text-g800 outline-none focus:border-gold bg-white';
const editLabelClass = 'font-condensed font-bold text-[10px] uppercase text-g600 block mb-1';

export default function ModerationQueue({
  initialPapers,
  initialMaterials,
  courses,
  staffId,
}: {
  initialPapers: PendingPaper[];
  initialMaterials: PendingMaterial[];
  courses: CourseOption[];
  staffId: string;
}) {
  const [tab, setTab] = useState<'papers' | 'materials'>('papers');
  const [papers, setPapers] = useState(initialPapers);
  const [materials, setMaterials] = useState(initialMaterials);
  const [busyId, setBusyId] = useState<string | null>(null);
  // Which item has an open reason panel, and which of the two negative
  // decisions (Reject vs Request Changes) it's for.
  const [panel, setPanel] = useState<{ id: string; decision: Decision } | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [issueStrike, setIssueStrike] = useState(false);

  // Edit-before-approve: auto-open for anything the AI flagged as a
  // possible mismatch, and toggleable by hand for everything else.
  const [openEditIds, setOpenEditIds] = useState<Set<string>>(
    () =>
      new Set(
        [...initialPapers, ...initialMaterials].filter((i) => i.type_mismatch).map((i) => i.id)
      )
  );
  const [paperEditValues, setPaperEditValues] = useState<Record<string, PaperEditValues>>({});
  const [materialEditValues, setMaterialEditValues] = useState<Record<string, MaterialEditValues>>({});

  const supabase = createClient();

  const toggleEdit = (id: string) => {
    setOpenEditIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getPaperEdit = (p: PendingPaper): PaperEditValues =>
    paperEditValues[p.id] ?? { courseId: p.course_id, year: p.year, examType: p.exam_type };

  const setPaperEdit = (id: string, next: Partial<PaperEditValues>, base: PaperEditValues) => {
    setPaperEditValues((prev) => ({ ...prev, [id]: { ...base, ...next } }));
  };

  const getMaterialEdit = (m: PendingMaterial): MaterialEditValues =>
    materialEditValues[m.id] ?? {
      courseId: m.course_id,
      title: m.suggested_title || m.title,
      weekNumber: m.week_number ?? 1,
      contentType: m.content_type,
    };

  const setMaterialEdit = (id: string, next: Partial<MaterialEditValues>, base: MaterialEditValues) => {
    setMaterialEditValues((prev) => ({ ...prev, [id]: { ...base, ...next } }));
  };

  const notify = async (userId: string, message: string, type: string) => {
    await supabase.from('notifications').insert({ user_id: userId, message, type });
  };

  const approvePaper = async (paper: PendingPaper, overrides?: PaperEditValues) => {
    setBusyId(paper.id);
    const res = await fetch(`/api/moderation/approve-paper/${paper.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        overrides
          ? { courseId: overrides.courseId, year: overrides.year, examType: overrides.examType }
          : {}
      ),
    });
    const result = await res.json();
    setBusyId(null);

    if (!res.ok) {
      alert(result.error ?? 'Approval failed.');
      return;
    }

    setPapers((prev) => prev.filter((p) => p.id !== paper.id));
  };

  const approveMaterial = async (material: PendingMaterial, overrides?: MaterialEditValues) => {
    setBusyId(material.id);

    const finalTitle = (overrides?.title || material.suggested_title || material.title).toUpperCase();
    const courseId = overrides?.courseId ?? material.course_id;

    const { error } = await supabase
      .from('study_materials')
      .update({
        status: 'approved',
        title: finalTitle,
        course_id: courseId,
        week_number: overrides?.weekNumber ?? material.week_number,
        content_type: overrides?.contentType ?? material.content_type,
        reviewed_by: staffId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', material.id);
    setBusyId(null);

    if (error) {
      alert(error.message);
      return;
    }

    if (material.uploaded_by) {
      const courseCode = courses.find((c) => c.id === courseId)?.code ?? material.courses.code;
      await notify(
        material.uploaded_by,
        `Your study material "${finalTitle}" for ${courseCode} was approved.`,
        'upload_approved'
      );
    }
    setMaterials((prev) => prev.filter((m) => m.id !== material.id));
  };

  // Handles both Reject and Request Changes — same shape, different status
  // and notification wording. Spec 8.2: "Approve, reject, or request changes,
  // with an optional reason sent to the uploader via the Notification Centre."
  const submitDecision = async (kind: 'paper' | 'material', item: PendingPaper | PendingMaterial, decision: Decision) => {
    setBusyId(item.id);
    const table = kind === 'paper' ? 'past_papers' : 'study_materials';
    const uploaderId = kind === 'paper' ? (item as PendingPaper).uploaded_by : (item as PendingMaterial).uploaded_by;
    const defaultReason =
      decision === 'rejected' ? 'Did not meet quality guidelines.' : 'Please review and resubmit with the requested changes.';

    const { error } = await supabase
      .from(table)
      .update({
        status: decision,
        rejection_reason: reason || defaultReason,
        reviewed_by: staffId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', item.id);

    if (!error && uploaderId) {
      const label = kind === 'paper' ? (item as PendingPaper).courses.code : (item as PendingMaterial).courses.code;
      const itemType = kind === 'paper' ? 'past paper' : 'study material';
      const message =
        decision === 'rejected'
          ? `Your ${itemType} for ${label} was not approved. Reason: ${reason || defaultReason}`
          : `Your ${itemType} for ${label} needs some changes before it can be approved. Feedback: ${reason || defaultReason} Please re-upload once it's updated.`;
      await notify(uploaderId, message, decision === 'rejected' ? 'upload_rejected' : 'upload_needs_revision');
    }

    // A strike only makes sense alongside an outright rejection, never a
    // request for changes.
    if (!error && decision === 'rejected' && issueStrike && uploaderId) {
      await supabase.from('strikes').insert({
        user_id: uploaderId,
        reason: reason || defaultReason,
        related_paper_id: kind === 'paper' ? item.id : null,
        issued_by: staffId,
      });
    }

    setBusyId(null);

    if (error) {
      alert(error.message);
      return;
    }

    if (kind === 'paper') {
      setPapers((prev) => prev.filter((p) => p.id !== item.id));
    } else {
      setMaterials((prev) => prev.filter((m) => m.id !== item.id));
    }
    setPanel(null);
    setReason('');
    setIssueStrike(false);
  };

  return (
    <div>
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('papers')}
          className={`font-condensed font-bold text-sm uppercase tracking-wide px-5 py-2.5 rounded-lg transition-colors ${
            tab === 'papers' ? 'bg-navy text-white' : 'bg-white border border-g100 text-g600'
          }`}
        >
          Papers ({papers.length})
        </button>
        <button
          onClick={() => setTab('materials')}
          className={`font-condensed font-bold text-sm uppercase tracking-wide px-5 py-2.5 rounded-lg transition-colors ${
            tab === 'materials' ? 'bg-navy text-white' : 'bg-white border border-g100 text-g600'
          }`}
        >
          Materials ({materials.length})
        </button>
      </div>

      {tab === 'papers' ? (
        papers.length === 0 ? (
          <EmptyState label="No papers pending review." />
        ) : (
          <div className="space-y-3">
            {papers.map((p) => {
              const isEditing = openEditIds.has(p.id);
              const edit = getPaperEdit(p);
              return (
                <div key={p.id} className="bg-white border border-g100 rounded-xl p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-condensed font-bold text-sm text-navy">
                        {p.courses.code} — {p.exam_type === 'mid_semester' ? 'Mid-Semester' : 'End of Semester'} {p.year}
                      </div>
                      <div className="font-body text-xs text-g600 mt-0.5">
                        Submitted by {p.profiles?.full_name ?? p.profiles?.student_id ?? 'unknown'}
                      </div>
                      <ClassificationBadge
                        detectedType={p.detected_type}
                        mismatch={p.type_mismatch}
                        notes={p.classification_notes}
                        uploadedAs="Past Paper"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 flex-shrink-0">
                      <button
                        onClick={() => setPreviewId(previewId === p.id ? null : p.id)}
                        className="font-condensed font-bold text-xs uppercase px-3.5 py-2 rounded-lg border border-g100 text-g600 hover:border-navy hover:text-navy transition-colors"
                      >
                        {previewId === p.id ? 'Hide' : 'Preview'}
                      </button>
                      <button
                        onClick={() => toggleEdit(p.id)}
                        className={`font-condensed font-bold text-xs uppercase px-3.5 py-2 rounded-lg border transition-colors ${
                          isEditing ? 'border-navy text-navy bg-navy/5' : 'border-g100 text-g600 hover:border-navy hover:text-navy'
                        }`}
                      >
                        {isEditing ? 'Hide edit' : 'Edit'}
                      </button>
                      <button
                        disabled={busyId === p.id}
                        onClick={() => approvePaper(p, isEditing ? edit : undefined)}
                        className="font-condensed font-bold text-xs uppercase px-3.5 py-2 rounded-lg bg-gold text-navy hover:bg-gold-light transition-colors disabled:opacity-60"
                      >
                        {busyId === p.id ? 'Working…' : 'Approve'}
                      </button>
                      <button
                        onClick={() => setPanel(panel?.id === p.id && panel.decision === 'needs_revision' ? null : { id: p.id, decision: 'needs_revision' })}
                        className="font-condensed font-bold text-xs uppercase px-3.5 py-2 rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-50 transition-colors"
                      >
                        Request Changes
                      </button>
                      <button
                        onClick={() => setPanel(panel?.id === p.id && panel.decision === 'rejected' ? null : { id: p.id, decision: 'rejected' })}
                        className="font-condensed font-bold text-xs uppercase px-3.5 py-2 rounded-lg border border-g100 text-g600 hover:border-red-300 hover:text-red-500 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                  {isEditing && (
                    <PaperEditPanel
                      courses={courses}
                      values={edit}
                      onChange={(next) => setPaperEdit(p.id, next, edit)}
                    />
                  )}
                  {previewId === p.id && <FilePreview kind="paper" fileUrl={p.file_url} />}
                  {panel?.id === p.id && (
                    <DecisionPanel
                      decision={panel.decision}
                      reason={reason}
                      setReason={setReason}
                      issueStrike={issueStrike}
                      setIssueStrike={setIssueStrike}
                      onConfirm={() => submitDecision('paper', p, panel.decision)}
                      onCancel={() => setPanel(null)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : materials.length === 0 ? (
        <EmptyState label="No materials pending review." />
      ) : (
        <div className="space-y-3">
          {materials.map((m) => {
            const isEditing = openEditIds.has(m.id);
            const edit = getMaterialEdit(m);
            return (
              <div key={m.id} className="bg-white border border-g100 rounded-xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-condensed font-bold text-sm text-navy">
                      {m.courses.code} — {m.title}
                    </div>
                    {m.suggested_title && m.suggested_title !== m.title && (
                      <div className="font-body text-xs text-gold mt-0.5">
                        AI suggests: &ldquo;{m.suggested_title}&rdquo; — this corrected version will be
                        saved (in CAPS) if approved.
                      </div>
                    )}
                    <div className="font-body text-xs text-g600 mt-0.5">
                      {m.week_number ? `Week ${m.week_number} · ` : ''}
                      Submitted by {m.profiles?.full_name ?? m.profiles?.student_id ?? 'unknown'}
                    </div>
                    <ClassificationBadge
                      detectedType={m.detected_type}
                      mismatch={m.type_mismatch}
                      notes={m.classification_notes}
                      uploadedAs="Study Material"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 flex-shrink-0">
                    <button
                      onClick={() => setPreviewId(previewId === m.id ? null : m.id)}
                      className="font-condensed font-bold text-xs uppercase px-3.5 py-2 rounded-lg border border-g100 text-g600 hover:border-navy hover:text-navy transition-colors"
                    >
                      {previewId === m.id ? 'Hide' : 'Preview'}
                    </button>
                    <button
                      onClick={() => toggleEdit(m.id)}
                      className={`font-condensed font-bold text-xs uppercase px-3.5 py-2 rounded-lg border transition-colors ${
                        isEditing ? 'border-navy text-navy bg-navy/5' : 'border-g100 text-g600 hover:border-navy hover:text-navy'
                      }`}
                    >
                      {isEditing ? 'Hide edit' : 'Edit'}
                    </button>
                    <button
                      disabled={busyId === m.id}
                      onClick={() => approveMaterial(m, isEditing ? edit : undefined)}
                      className="font-condensed font-bold text-xs uppercase px-3.5 py-2 rounded-lg bg-gold text-navy hover:bg-gold-light transition-colors disabled:opacity-60"
                    >
                      {busyId === m.id ? 'Working…' : 'Approve'}
                    </button>
                    <button
                      onClick={() => setPanel(panel?.id === m.id && panel.decision === 'needs_revision' ? null : { id: m.id, decision: 'needs_revision' })}
                      className="font-condensed font-bold text-xs uppercase px-3.5 py-2 rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-50 transition-colors"
                    >
                      Request Changes
                    </button>
                    <button
                      onClick={() => setPanel(panel?.id === m.id && panel.decision === 'rejected' ? null : { id: m.id, decision: 'rejected' })}
                      className="font-condensed font-bold text-xs uppercase px-3.5 py-2 rounded-lg border border-g100 text-g600 hover:border-red-300 hover:text-red-500 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
                {isEditing && (
                  <MaterialEditPanel
                    courses={courses}
                    values={edit}
                    onChange={(next) => setMaterialEdit(m.id, next, edit)}
                  />
                )}
                {previewId === m.id && <FilePreview kind="material" fileUrl={m.file_url} />}
                {panel?.id === m.id && (
                  <DecisionPanel
                    decision={panel.decision}
                    reason={reason}
                    setReason={setReason}
                    issueStrike={issueStrike}
                    setIssueStrike={setIssueStrike}
                    onConfirm={() => submitDecision('material', m, panel.decision)}
                    onCancel={() => setPanel(null)}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ClassificationBadge({
  detectedType,
  mismatch,
  notes,
  uploadedAs,
}: {
  detectedType: string | null;
  mismatch: boolean;
  notes: string | null;
  uploadedAs: string;
}) {
  if (!detectedType) {
    return (
      <div className="font-body text-[11px] text-g600 mt-1.5 italic">
        AI review pending…
      </div>
    );
  }

  const label = TYPE_LABELS[detectedType] ?? detectedType;

  if (mismatch) {
    return (
      <div className="mt-1.5 flex flex-col gap-1 sm:inline-flex sm:flex-row sm:items-start sm:gap-1.5 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5 max-w-full sm:max-w-md">
        <span className="font-condensed font-bold text-[11px] uppercase text-red-600 shrink-0">
          ⚠ Possible mismatch
        </span>
        <span className="font-body text-[11px] text-red-700 break-words">
          AI thinks this looks like <strong>{label}</strong>, but it was uploaded as {uploadedAs}.
          {notes ? ` ${notes}` : ''} Edit panel opened below — re-file before approving.
        </span>
      </div>
    );
  }

  return (
    <div className="mt-1.5 inline-flex items-center gap-1.5 bg-g50 border border-g100 rounded-lg px-2.5 py-1">
      <span className="font-condensed font-bold text-[10px] uppercase text-g600">
        AI detected: {label}
      </span>
    </div>
  );
}

function PaperEditPanel({
  courses,
  values,
  onChange,
}: {
  courses: CourseOption[];
  values: PaperEditValues;
  onChange: (next: Partial<PaperEditValues>) => void;
}) {
  return (
    <div className="mt-3 pt-3 border-t border-g100 grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div>
        <label className={editLabelClass}>Course</label>
        <select value={values.courseId} onChange={(e) => onChange({ courseId: e.target.value })} className={selectClass}>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} — {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={editLabelClass}>Exam Type</label>
        <select value={values.examType} onChange={(e) => onChange({ examType: e.target.value })} className={selectClass}>
          <option value="mid_semester">Mid-Semester</option>
          <option value="end_of_semester">End of Semester</option>
        </select>
      </div>
      <div>
        <label className={editLabelClass}>Year</label>
        <input
          type="number"
          value={values.year}
          onChange={(e) => onChange({ year: Number(e.target.value) })}
          className={selectClass}
          min={2000}
          max={2100}
        />
      </div>
    </div>
  );
}

function MaterialEditPanel({
  courses,
  values,
  onChange,
}: {
  courses: CourseOption[];
  values: MaterialEditValues;
  onChange: (next: Partial<MaterialEditValues>) => void;
}) {
  return (
    <div className="mt-3 pt-3 border-t border-g100 space-y-3">
      <div>
        <label className={editLabelClass}>Title</label>
        <input
          type="text"
          value={values.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className={selectClass}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className={editLabelClass}>Course</label>
          <select value={values.courseId} onChange={(e) => onChange({ courseId: e.target.value })} className={selectClass}>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={editLabelClass}>Type</label>
          <select value={values.contentType} onChange={(e) => onChange({ contentType: e.target.value })} className={selectClass}>
            <option value="lecture_slides">Lecture Slides</option>
            <option value="study_notes">Study Notes</option>
            <option value="study_guide">Study Guide</option>
          </select>
        </div>
        <div>
          <label className={editLabelClass}>Week</label>
          <select
            value={values.weekNumber}
            onChange={(e) => onChange({ weekNumber: Number(e.target.value) })}
            className={selectClass}
          >
            {Array.from({ length: 14 }, (_, i) => i + 1).map((w) => (
              <option key={w} value={w}>
                Week {w}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

// Extensions the browser can render natively inside an <iframe>.
const NATIVE_PREVIEW_EXTS = ['pdf', 'jpg', 'jpeg', 'png'];
// Office formats — browsers can't render these inline at all, so they're
// routed through Microsoft's free Office Online viewer instead, which
// fetches the file itself and renders it inline (still no download to
// the moderator's device).
const OFFICE_EXTS = ['ppt', 'pptx', 'doc', 'docx'];

function getExtension(pathOrUrl: string): string {
  const clean = pathOrUrl.split('?')[0];
  const ext = clean.split('.').pop() ?? '';
  return ext.toLowerCase();
}

// Papers store a raw internal storage path in file_url (private bucket).
// Materials already store a full public URL. Papers need a short-lived
// signed URL fetched on demand; materials can render straight away.
function FilePreview({ kind, fileUrl }: { kind: 'paper' | 'material'; fileUrl: string }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(kind === 'material' ? fileUrl : null);
  const [loading, setLoading] = useState(kind === 'paper');
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    if (kind !== 'paper') return;
    let cancelled = false;
    setLoading(true);
    setPreviewError(null);

    fetch('/api/moderation/preview-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bucket: 'past-papers', path: fileUrl }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.url) setPreviewUrl(data.url);
        else setPreviewError(data.error ?? 'Could not load preview.');
      })
      .catch(() => {
        if (!cancelled) setPreviewError('Could not load preview.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [kind, fileUrl]);

  const ext = getExtension(fileUrl);
  const isOffice = OFFICE_EXTS.includes(ext);
  const isNative = NATIVE_PREVIEW_EXTS.includes(ext);

  const displaySrc =
    previewUrl && isOffice
      ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewUrl)}`
      : previewUrl;

  return (
    <div className="mt-3 pt-3 border-t border-g100">
      {loading ? (
        <p className="font-body text-xs text-g600 py-6 text-center">Loading preview…</p>
      ) : previewError ? (
        <p className="font-body text-xs text-red-500 py-6 text-center">{previewError}</p>
      ) : displaySrc ? (
        <>
          {!isNative && !isOffice && (
            <p className="font-body text-[11px] text-g600 mb-2">
              This file type can&apos;t be previewed inline — use &ldquo;Open in new tab&rdquo; below.
            </p>
          )}
          <iframe
            src={displaySrc}
            className="w-full h-[60vh] max-h-[420px] rounded-lg border border-g100 bg-white"
            title="Document preview"
          />
          {previewUrl && (
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-condensed font-bold text-xs uppercase text-gold hover:underline mt-2 inline-block"
            >
              Open in new tab →
            </a>
          )}
        </>
      ) : null}
    </div>
  );
}

function DecisionPanel({
  decision,
  reason,
  setReason,
  issueStrike,
  setIssueStrike,
  onConfirm,
  onCancel,
}: {
  decision: Decision;
  reason: string;
  setReason: (v: string) => void;
  issueStrike: boolean;
  setIssueStrike: (v: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const isReject = decision === 'rejected';
  return (
    <div className="mt-3 pt-3 border-t border-g100">
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder={isReject ? 'Reason for rejection…' : 'What needs to change before this can be approved…'}
        rows={2}
        className="w-full px-3 py-2 rounded-lg border border-g100 font-body text-sm text-g800 outline-none focus:border-gold transition-colors mb-2"
      />
      {isReject && (
        <label className="flex items-center gap-2 font-body text-xs text-g600 mb-3">
          <input type="checkbox" checked={issueStrike} onChange={(e) => setIssueStrike(e.target.checked)} />
          Issue a strike to this student
        </label>
      )}
      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          className={`font-condensed font-bold text-xs uppercase px-3.5 py-2 rounded-lg text-white transition-colors ${
            isReject ? 'bg-red-500 hover:bg-red-600' : 'bg-amber-500 hover:bg-amber-600'
          }`}
        >
          {isReject ? 'Confirm rejection' : 'Send back for changes'}
        </button>
        <button
          onClick={onCancel}
          className="font-condensed font-bold text-xs uppercase px-3.5 py-2 rounded-lg border border-g100 text-g600"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return <p className="font-body text-sm text-g600 text-center py-16">{label}</p>;
}
