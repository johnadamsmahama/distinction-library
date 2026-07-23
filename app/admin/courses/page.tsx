import { createClient } from '@/lib/supabase/server';
import CourseManager from '@/components/admin/CourseManager';

export default async function AdminCoursesPage() {
  const supabase = createClient();
  const { data: courses } = await supabase.from('courses').select('id, code, name, department, level').order('code');

  return <CourseManager courses={(courses as any) ?? []} />;
}
