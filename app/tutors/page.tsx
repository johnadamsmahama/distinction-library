import { createClient } from '@/lib/supabase/server';
import { getActiveTutors, getTutorDepartmentOptions } from '@/lib/tutors-data';
import { getCourseOptions } from '@/lib/papers-data';
import TutorBrowser from '@/components/tutors/TutorBrowser';

export default async function TutorsPage() {
  const supabase = createClient();
  const [tutors, departments, courses] = await Promise.all([
    getActiveTutors(supabase),
    getTutorDepartmentOptions(supabase),
    getCourseOptions(supabase),
  ]);

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-navy mb-1">Peer Tutors</h1>
      <p className="font-body text-sm text-g600 mb-6">
        Fellow UPSA students from the Distinction Programme, volunteering to help with
        assignments, group work, and project work.
      </p>

      <TutorBrowser tutors={tutors} departments={departments} courses={courses} />
    </div>
  );
}
