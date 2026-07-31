'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type PendingPaper = {
  id: string;
  year: number;
  exam_type: string;
  file_url: string;
  created_at: string;
  uploaded_by: string;
  detected_type: string | null;
  type_mismatch: boolean;
  classification_notes: string | null;
  courses: { code: string; name: string };
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
  detected_type: string | null;
  type_mismatch: boolean;
  classification_notes: string | null;
  courses: { code: string; name: string };
  profiles: { id: string; student_id: string; full_name: string | null } | null;
};

const TYPE_LABELS: Record<string, string> = {
  past_paper: 'Past Paper',
  lecture_slides: 'Lecture Slides',
  study_guide: 'Study Guide',
  other: 'Other',
};

type Decision = 'rejected' | 'needs_revision';

export default function ModerationQueue({
  initialPapers,
  initialMaterials,
  staffId,
}: {
  initialPapers: PendingPaper[];
  initialMaterials: PendingMaterial[];
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

  const supabase = createClient();

  const notify = async (userId: string, message: string, type: string) => {
    await supabase.from('notifications').insert({ user_id: userId, message, type });
  };

  const approvePaper = async (paper: PendingPaper) => {
    setBusyId(paper.id);
    const res = await fetch(`/api/moderation/approve-paper/${paper.id}`, { method: 'POST' });
    const result = await res.json();
    setBusyId(null);

    if (!res.ok) {
      alert(result.error ?? 'Approval failed.');
      return;
    }

    setPapers((prev) => prev.filter((p) => p.id !== paper.id));
  };

  const approveMaterial = async (material: PendingMaterial) => {
    setBusyId(material.id);

    // Use the AI's typo-corrected title if one exists, otherwise the
    // original — either way, save it in CAPS the moment it's approved.
    const finalTitle = (material.suggested_title || material.title).toUpperCase();

    const { error } = await supabase
      .from('study_materials')
      .update({
        status: 'approved',
        title: finalTitle,
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
      await notify(
        material.uploaded_by,
        `Your study material "${finalTitle}" for ${material.courses.code} was approved.`,
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
            {papers.map((p) => (
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
                      disabled={busyId === p.id}
                      onClick={() => approvePaper(p)}
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
                {previewId === p.id && <FilePreview fileUrl={p.file_url} />}
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
            ))}
          </div>
        )
      ) : materials.length === 0 ? (
        <EmptyState label="No materials pending review." />
      ) : (
        <div className="space-y-3">
          {materials.map((m) => (
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
                    disabled={busyId === m.id}
                    onClick={() => approveMaterial(m)}
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
              {previewId === m.id && <FilePreview fileUrl={m.file_url} />}
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
          ))}
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
          {notes ? ` ${notes}` : ''}
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

function FilePreview({ fileUrl }: { fileUrl: string }) {
  return (
    <div className="mt-3 pt-3 border-t border-g100">
      <iframe
        src={fileUrl}
        className="w-full h-[60vh] max-h-[420px] rounded-lg border border-g100"
        title="Document preview"
      />
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="font-condensed font-bold text-xs uppercase text-gold hover:underline mt-2 inline-block"
      >
        Open in new tab →
      </a>
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
