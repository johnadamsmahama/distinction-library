import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile, isStaffRole } from '@/lib/auth-helpers';
import ModerationQueue from '@/components/moderate/ModerationQueue';

export default async function ModeratePage() {
  const supabase = createClient();
  const { user, profile } = await getCurrentProfile(supabase);

  if (!user) redirect('/login');
  if (!isStaffRole(profile?.role)) redirect('/dashboard');

  const [{ data: papers }, { data: materials }] = await Promise.all([
    supabase
      .from('past_papers')
      .select('id, year, exam_type, file_url, created_at, uploaded_by, courses(code, name), profiles!uploaded_by(id, student_id, full_name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true }),

    supabase
      .from('study_materials')
      .select('id, title, content_type, week_number, file_url, created_at, uploaded_by, courses(code, name), profiles!uploaded_by(id, student_id, full_name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true }),
  ]);

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-navy mb-1">Moderation Queue</h1>
      <p className="font-body text-sm text-g600 mb-6">
        Approving a past paper automatically stamps a watermark before it's published.
      </p>
      <ModerationQueue
        initialPapers={(papers as any) ?? []}
        initialMaterials={(materials as any) ?? []}
        staffId={user.id}
      />
    </div>
  );
}