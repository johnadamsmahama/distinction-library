import { createClient } from '@/lib/supabase/server';

// Spec Section 8.2: "Full audit trail of moderation decisions is visible to
// Admins inside the main Admin Console." The underlying data (reviewed_by,
// reviewed_at, rejection_reason) was already being saved by the Moderation
// Queue on every approve/reject — this page is the first place any of it is
// actually displayed.

type Row = {
  id: string;
  label: string;
  kind: 'Paper' | 'Material';
  status: string;
  rejection_reason: string | null;
  reviewed_at: string | null;
  courses: { code: string } | null;
  uploader: { full_name: string | null; student_id: string } | null;
  reviewer: { full_name: string | null } | null;
};

export default async function ModerationLogPage() {
  const supabase = createClient();

  const [{ data: papers }, { data: materials }] = await Promise.all([
    supabase
      .from('past_papers')
      .select(
        'id, year, exam_type, status, rejection_reason, reviewed_at, courses(code), uploader:profiles!uploaded_by(full_name, student_id), reviewer:profiles!reviewed_by(full_name)'
      )
      .in('status', ['approved', 'rejected'])
      .order('reviewed_at', { ascending: false })
      .limit(100),

    supabase
      .from('study_materials')
      .select(
        'id, title, status, rejection_reason, reviewed_at, courses(code), uploader:profiles!uploaded_by(full_name, student_id), reviewer:profiles!reviewed_by(full_name)'
      )
      .in('status', ['approved', 'rejected'])
      .order('reviewed_at', { ascending: false })
      .limit(100),
  ]);

  const rows: Row[] = [
    ...(papers ?? []).map((p: any) => ({
      id: p.id,
      label: `${p.courses?.code ?? 'Unknown'} — ${p.exam_type === 'mid_semester' ? 'Mid-Semester' : 'End of Semester'} ${p.year}`,
      kind: 'Paper' as const,
      status: p.status,
      rejection_reason: p.rejection_reason,
      reviewed_at: p.reviewed_at,
      courses: p.courses,
      uploader: p.uploader,
      reviewer: p.reviewer,
    })),
    ...(materials ?? []).map((m: any) => ({
      id: m.id,
      label: `${m.courses?.code ?? 'Unknown'} — ${m.title}`,
      kind: 'Material' as const,
      status: m.status,
      rejection_reason: m.rejection_reason,
      reviewed_at: m.reviewed_at,
      courses: m.courses,
      uploader: m.uploader,
      reviewer: m.reviewer,
    })),
  ].sort((a, b) => new Date(b.reviewed_at ?? 0).getTime() - new Date(a.reviewed_at ?? 0).getTime());

  return (
    <div>
      <h2 className="font-display font-bold text-lg text-navy mb-1">Moderation Log</h2>
      <p className="font-body text-sm text-g600 mb-6">
        Every approve/reject decision made in the Moderation Queue, most recent first.
      </p>

      {rows.length === 0 ? (
        <p className="font-body text-sm text-g600 text-center py-16">No moderation decisions recorded yet.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={`${r.kind}-${r.id}`} className="bg-white border border-g100 rounded-lg px-4 py-3">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-condensed font-bold text-[10px] uppercase px-1.5 py-0.5 rounded bg-g100 text-navy">
                      {r.kind}
                    </span>
                    <span
                      className={`font-condensed font-bold text-[10px] uppercase px-1.5 py-0.5 rounded ${
                        r.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                  <div className="font-condensed font-semibold text-sm text-g800">{r.label}</div>
                  <div className="font-body text-xs text-g600 mt-0.5">
                    Uploaded by {r.uploader?.full_name ?? r.uploader?.student_id ?? 'unknown'} · Reviewed by{' '}
                    {r.reviewer?.full_name ?? 'unknown'}
                  </div>
                  {r.status === 'rejected' && r.rejection_reason && (
                    <div className="font-body text-xs text-red-600 mt-1">Reason: {r.rejection_reason}</div>
                  )}
                </div>
                <div className="font-condensed text-[11px] text-g600 flex-shrink-0">
                  {r.reviewed_at ? new Date(r.reviewed_at).toLocaleString() : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
