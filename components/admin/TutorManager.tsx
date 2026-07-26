import { createClient } from '@/lib/supabase/server';
import { getAllTutors } from '@/lib/tutors-data';
import { getCourseOptions } from '@/lib/papers-data';
import TutorManager from '@/components/admin/TutorManager';

export default async function AdminTutorsPage() {
  const supabase = createClient();
  const [tutors, courses] = await Promise.all([getAllTutors(supabase), getCourseOptions(supabase)]);

  return <TutorManager tutors={tutors} courses={courses} />;
}
