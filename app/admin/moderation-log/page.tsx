import { createClient } from '@/lib/supabase/server';
import ModerationLogList from '@/components/admin/ModerationLogList';

// Spec Section 8.2: "Full audit trail of moderation decisions is visible to
// Admins inside the main Admin Console." The underlying data (reviewed_by,
// reviewed_at, rejection_reason) was already being saved by the Moderation
// Queue on every approve/reject — this page is the first place any of it is
// actually displayed. Also includes "needs_revision" (Request Changes),
// the third moderation action alongside approve/reject.
//
// Row rendering (including the Delete button) lives in ModerationLogList,
// a client component — this page stays a server component purely for the
// data fetch. Delete is here rather than in the Moderation Queue because
// this is the only view that shows already-approved items, including ones
// that are already live and published.

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
      .in('status', ['approved', 'rejected', 'needs_revision'])
      .order('reviewed_at', { ascending: false })
      .limit(100),

    supabase
      .from('study_materials')
      .select(
        'id, title, status, rejection_reason, reviewed_at, courses(code), uploader:profiles!uploaded_by(full_name, student_id), reviewer:profiles!reviewed_by(full_name)'
      )
      .in('status', ['approved', 'rejected', 'needs_revision'])
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
        Every approve / reject / request-changes decision made in the Moderation Queue, most recent first.
      </p>

      <ModerationLogList rows={rows} />
    </div>
  );
}
