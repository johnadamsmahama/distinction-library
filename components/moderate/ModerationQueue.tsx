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
  courses: { code: string; name: string };
  profiles: { id: string; student_id: string; full_name: string | null };
};

type PendingMaterial = {
  id: string;
  title: string;
  content_type: string;
  week_number: number | null;
  file_url: string;
  created_at: string;
  uploaded_by: string | null;
  courses: { code: string; name: string };
  profiles: { id: string; student_id: string; full_name: string | null } | null;
};

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
  const [rejectingId, setRejectingId] = useState<string | null>(null);
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
    const { error } = await supabase
      .from('study_materials')
      .update({ status: 'approved', reviewed_by: staffId, reviewed_at: new Date().toISOString() })
      .eq('id', material.id);
    setBusyId(null);

    if (error) {
      alert(error.message);
      return;
    }

    if (material.uploaded_by) {
      await notify(
        material.uploaded_by,
        `Your study material "${material.title}" for ${material.courses.code} was approved.`,
        'upload_approved'
      );
    }
    setMaterials((prev) => prev.filter((m) => m.id !== material.id));
  };

  const submitRejection = async (kind: 'paper' | 'material', item: PendingPaper | PendingMaterial) => {
    setBusyId(item.id);
    const table = kind === 'paper' ? 'past_papers' : 'study_materials';
    const uploaderId = kind === 'paper' ? (item as PendingPaper).uploaded_by : (item as PendingMaterial).uploaded_by;

    const { error } = await supabase
      .from(table)
      .update({
        status: 'rejected',
        rejection_reason: reason || 'Did not meet quality guidelines.',
        reviewed_by: staffId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', item.id);

    if (!error && uploaderId) {
      const label = kind === 'paper' ? (item as PendingPaper).courses.code : (item as PendingMaterial).courses.code;
      await notify(
        uploaderId,
        `Your ${kind === 'paper' ? 'past paper' : 'study material'} for ${label} was not approved. Reason: ${reason || 'Did not meet quality guidelines.'}`,
        'upload_rejected'
      );
    }

    if (!error && issueStrike && uploaderId) {
      await supabase.from('strikes').insert({
        user_id: uploaderId,
        reason: reason || 'Rejected submission did not meet quality guidelines.',
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
    setRejectingId(null);
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
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-condensed font-bold text-sm text-navy">
                      {p.courses.code} — {p.exam_type === 'mid_semester' ? 'Mid-Semester' : 'End of Semester'} {p.year}
                    </div>
                    <div className="font-body text-xs text-g600 mt-0.5">
                      Submitted by {p.profiles?.full_name ?? p.profiles?.student_id ?? 'unknown'}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      disabled={busyId === p.id}
                      onClick={() => approvePaper(p)}
                      className="font-condensed font-bold text-xs uppercase px-3.5 py-2 rounded-lg bg-gold text-navy hover:bg-gold-light transition-colors disabled:opacity-60"
                    >
                      {busyId === p.id ? 'Working…' : 'Approve'}
                    </button>
                    <button
                      onClick={() => setRejectingId(rejectingId === p.id ? null : p.id)}
                      className="font-condensed font-bold text-xs uppercase px-3.5 py-2 rounded-lg border border-g100 text-g600 hover:border-red-300 hover:text-red-500 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
                {rejectingId === p.id && (
                  <RejectPanel
                    reason={reason}
                    setReason={setReason}
                    issueStrike={issueStrike}
                    setIssueStrike={setIssueStrike}
                    onConfirm={() => submitRejection('paper', p)}
                    onCancel={() => setRejectingId(null)}
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
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-condensed font-bold text-sm text-navy">
                    {m.courses.code} — {m.title}
                  </div>
                  <div className="font-body text-xs text-g600 mt-0.5">
                    {m.week_number ? `Week ${m.week_number} · ` : ''}
                    Submitted by {m.profiles?.full_name ?? m.profiles?.student_id ?? 'unknown'}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    disabled={busyId === m.id}
                    onClick={() => approveMaterial(m)}
                    className="font-condensed font-bold text-xs uppercase px-3.5 py-2 rounded-lg bg-gold text-navy hover:bg-gold-light transition-colors disabled:opacity-60"
                  >
                    {busyId === m.id ? 'Working…' : 'Approve'}
                  </button>
                  <button
                    onClick={() => setRejectingId(rejectingId === m.id ? null : m.id)}
                    className="font-condensed font-bold text-xs uppercase px-3.5 py-2 rounded-lg border border-g100 text-g600 hover:border-red-300 hover:text-red-500 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
              {rejectingId === m.id && (
                <RejectPanel
                  reason={reason}
                  setReason={setReason}
                  issueStrike={issueStrike}
                  setIssueStrike={setIssueStrike}
                  onConfirm={() => submitRejection('material', m)}
                  onCancel={() => setRejectingId(null)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RejectPanel({
  reason,
  setReason,
  issueStrike,
  setIssueStrike,
  onConfirm,
  onCancel,
}: {
  reason: string;
  setReason: (v: string) => void;
  issueStrike: boolean;
  setIssueStrike: (v: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="mt-3 pt-3 border-t border-g100">
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason for rejection…"
        rows={2}
        className="w-full px-3 py-2 rounded-lg border border-g100 font-body text-sm text-g800 outline-none focus:border-gold transition-colors mb-2"
      />
      <label className="flex items-center gap-2 font-body text-xs text-g600 mb-3">
        <input type="checkbox" checked={issueStrike} onChange={(e) => setIssueStrike(e.target.checked)} />
        Issue a strike to this student
      </label>
      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          className="font-condensed font-bold text-xs uppercase px-3.5 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
        >
          Confirm rejection
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
