import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import MyUploadsList from '@/components/papers/MyUploadsList';

export default async function MyUploadsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: papers }, { data: materials }] = await Promise.all([
    supabase
      .from('past_papers')
      .select('id, course_id, year, exam_type, status, rejection_reason, created_at, courses(code)')
      .eq('uploaded_by', user.id)
      .order('created_at', { ascending: false }),

    supabase
      .from('study_materials')
      .select('id, course_id, title, content_type, week_number, status, rejection_reason, created_at, courses(code)')
      .eq('uploaded_by', user.id)
      .order('created_at', { ascending: false }),
  ]);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display font-bold text-2xl text-navy">My Uploads</h1>
        <Link
          href="/papers/upload"
          className="font-condensed font-bold text-xs uppercase text-gold hover:underline flex-shrink-0"
        >
          + New upload
        </Link>
      </div>
      <p className="font-body text-sm text-g600 mb-6">
        Track your submissions and fix up anything that needs changes.
      </p>
      <MyUploadsList
        initialPapers={(papers as any) ?? []}
        initialMaterials={(materials as any) ?? []}
        userId={user.id}
      />
    </div>
  );
}
