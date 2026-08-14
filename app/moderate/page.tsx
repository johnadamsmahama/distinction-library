import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile, isStaffRole, isAdminRole } from '@/lib/auth-helpers';
import ModerationQueue from '@/components/moderate/ModerationQueue';

export default async function ModeratePage() {
  const supabase = createClient();
  const { user, profile } = await getCurrentProfile(supabase);

  if (!user) redirect('/login');
  if (!isStaffRole(profile?.role)) redirect('/dashboard');

  const [{ data: papers }, { data: materials }, { data: courses }] = await Promise.all([
    supabase
      .from('past_papers')
      .select(
        'id, year, exam_type, file_url, created_at, uploaded_by, course_id, detected_type, type_mismatch, classification_notes, courses(id, code, name), profiles!uploaded_by(id, student_id, full_name)'
      )
      .eq('status', 'pending')
      .order('created_at', { ascending: true }),
    supabase
      .from('study_materials')
      .select(
        'id, title, suggested_title, content_type, week_number, file_url, created_at, uploaded_by, course_id, detected_type, type_mismatch, classification_notes, courses(id, code, name), profiles!uploaded_by(id, student_id, full_name)'
      )
      .eq('status', 'pending')
      .order('created_at', { ascending: true }),
    // Full course list so a moderator can re-file a mismatched upload to
    // the correct course before approving it.
    supabase.from('courses').select('id, code, name').order('code', { ascending: true }),
  ]);

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-navy mb-1">Moderation Queue</h1>
      <p className="font-body text-sm text-g600 mb-4">
        Approving a past paper automatically stamps a watermark before it's published.
      </p>

      {isAdminRole(profile?.role) && (
        <Link
          href="/moderate/trusted-upload"
          className="inline-flex items-center gap-2 bg-navy text-white font-condensed font-bold text-xs uppercase tracking-wide px-4 py-2.5 rounded-[6px] mb-6 hover:brightness-110 transition-all"
        >
          Trusted Upload — bulk publish pre-sorted files →
        </Link>
      )}

      <ModerationQueue
        initialPapers={(papers as any) ?? []}
        initialMaterials={(materials as any) ?? []}
        courses={(courses as any) ?? []}
        staffId={user.id}
      />
    </div>
  );
}
