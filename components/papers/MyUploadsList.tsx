'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Paper = {
  id: string;
  course_id: string;
  year: number;
  exam_type: string;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  courses: { code: string } | null;
};

type Material = {
  id: string;
  course_id: string;
  title: string;
  content_type: string;
  week_number: number | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  courses: { code: string } | null;
};

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-g100 text-g600',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
  needs_revision: 'bg-amber-100 text-amber-700',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'pending review',
  approved: 'approved',
  rejected: 'rejected',
  needs_revision: 'changes requested',
};

export default function MyUploadsList({
  initialPapers,
  initialMaterials,
  userId,
}: {
  initialPapers: Paper[];
  initialMaterials: Material[];
  userId: string;
}) {
  const [papers, setPapers] = useState(initialPapers);
  const [materials, setMaterials] = useState(initialMaterials);
  const [resubmittingId, setResubmittingId] = useState<string | null>(null);

  if (papers.length === 0 && materials.length === 0) {
    return (
      <p className="font-body text-sm text-g600 text-center py-16">
        You haven't uploaded anything yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {papers.map((p) => (
        <UploadRow
          key={p.id}
          kind="paper"
          id={p.id}
          courseId={p.course_id}
          label={`${p.courses?.code ?? 'Unknown'} — ${
            p.exam_type === 'mid_semester' ? 'Mid-Semester' : 'End of Semester'
          } ${p.year}`}
          status={p.status}
          rejectionReason={p.rejection_reason}
          userId={userId}
          isResubmitting={resubmittingId === p.id}
          onStartResubmit={() => setResubmittingId(p.id)}
          onCancelResubmit={() => setResubmittingId(null)}
          onResubmitted={() => {
            setPapers((prev) => prev.map((x) => (x.id === p.id ? { ...x, status: 'pending', rejection_reason: null } : x)));
            setResubmittingId(null);
          }}
        />
      ))}
      {materials.map((m) => (
        <UploadRow
          key={m.id}
          kind="material"
          id={m.id}
          courseId={m.course_id}
          label={`${m.courses?.code ?? 'Unknown'} — ${m.title}`}
          status={m.status}
          rejectionReason={m.rejection_reason}
          userId={userId}
          isResubmitting={resubmittingId === m.id}
          onStartResubmit={() => setResubmittingId(m.id)}
          onCancelResubmit={() => setResubmittingId(null)}
          onResubmitted={() => {
            setMaterials((prev) =>
              prev.map((x) => (x.id === m.id ? { ...x, status: 'pending', rejection_reason: null } : x))
            );
            setResubmittingId(null);
          }}
        />
      ))}
    </div>
  );
}

function UploadRow({
  kind,
  id,
  courseId,
  label,
  status,
  rejectionReason,
  userId,
  isResubmitting,
  onStartResubmit,
  onCancelResubmit,
  onResubmitted,
}: {
  kind: 'paper' | 'material';
  id: string;
  courseId: string;
  label: string;
  status: string;
  rejectionReason: string | null;
  userId: string;
  isResubmitting: boolean;
  onStartResubmit: () => void;
  onCancelResubmit: () => void;
  onResubmitted: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canResubmit = status === 'rejected' || status === 'needs_revision';

  const doResubmit = async () => {
    setError(null);
    if (!file) {
      setError('Choose a replacement file first.');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const ext = file.name.split('.').pop();
    const path = `${userId}/${courseId}/${Date.now()}.${ext}`;
    const bucket = kind === 'paper' ? 'past-papers' : 'study-materials';
    const table = kind === 'paper' ? 'past_papers' : 'study_materials';

    const { error: uploadErr } = await supabase.storage.from(bucket).upload(path, file);
    if (uploadErr) {
      setLoading(false);
      setError(uploadErr.message);
      return;
    }

    const fileUrl =
      kind === 'paper' ? path : supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;

    const { error: updateErr } = await supabase
      .from(table)
      .update({
        file_url: fileUrl,
        status: 'pending',
        rejection_reason: null,
        reviewed_by: null,
        reviewed_at: null,
      })
      .eq('id', id);

    setLoading(false);
    if (updateErr) {
      setError(updateErr.message);
      return;
    }

    setFile(null);
    onResubmitted();
  };

  return (
    <div className="bg-white border border-g100 rounded-none px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className={`font-condensed font-bold text-[10px] uppercase px-1.5 py-0.5 rounded ${
                STATUS_STYLES[status] ?? 'bg-g100 text-g600'
              }`}
            >
              {STATUS_LABELS[status] ?? status}
            </span>
          </div>
          <div className="font-condensed font-semibold text-sm text-g800">{label}</div>
          {(status === 'rejected' || status === 'needs_revision') && rejectionReason && (
            <div className="font-body text-xs text-g600 mt-1">Feedback: {rejectionReason}</div>
          )}
        </div>
        {canResubmit && !isResubmitting && (
          <button
            onClick={onStartResubmit}
            className="font-condensed font-bold text-xs uppercase px-3.5 py-2 rounded-none border border-gold text-navy hover:bg-gold/10 transition-colors flex-shrink-0"
          >
            Fix &amp; resubmit
          </button>
        )}
      </div>

      {isResubmitting && (
        <div className="mt-3 pt-3 border-t border-g100">
          <input
            type="file"
            accept=".pdf,.doc,.docx,.ppt,.pptx"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full font-body text-sm text-g600 mb-2"
          />
          {error && <p className="font-body text-sm text-red-500 mb-2">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={doResubmit}
              disabled={loading}
              className="font-condensed font-bold text-xs uppercase px-3.5 py-2 rounded-none bg-gold text-navy hover:bg-gold-light transition-colors disabled:opacity-60"
            >
              {loading ? 'Uploading…' : 'Submit replacement'}
            </button>
            <button
              onClick={() => {
                setFile(null);
                setError(null);
                onCancelResubmit();
              }}
              className="font-condensed font-bold text-xs uppercase px-3.5 py-2 rounded-none border border-g100 text-g600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
