import { createClient } from '@/lib/supabase/server';
import { getCourseOptions, getDepartmentOptions } from '@/lib/papers-data';
import RepositoryBrowser from '@/components/papers/RepositoryBrowser';

export default async function PapersPage({
  searchParams,
}: {
  searchParams: { course?: string };
}) {
  const supabase = createClient();
  const courses = await getCourseOptions(supabase);
  const departments = await getDepartmentOptions(courses);

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-navy mb-1">
        Past Questions &amp; Study Materials
      </h1>
      <p className="font-body text-sm text-g600 mb-6">
        Every approved resource, organised by course and week.
      </p>

      <RepositoryBrowser
        courses={courses}
        departments={departments}
        initialCourseId={searchParams.course}
      />
    </div>
  );
}
