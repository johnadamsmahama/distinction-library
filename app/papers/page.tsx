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
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8 -mb-4 sm:-mb-6 lg:-mb-8">
      <RepositoryBrowser
        courses={courses}
        departments={departments}
        initialCourseId={searchParams.course}
      />
    </div>
  );
}
