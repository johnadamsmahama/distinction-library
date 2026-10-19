import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCourseOptions } from '@/lib/papers-data';
import RepositoryBrowser from '@/components/papers/RepositoryBrowser';

// /papers now only serves Lecture Slides (?tab=materials). Past papers live
// in the Library's Past Questions Bank, so any other visit — old bookmarks,
// the Solved Past Papers card, the "Library" back-link on the solve page —
// is sent there, keeping a ?course= filter if one was given.
export default async function PapersPage({
  searchParams,
}: {
  searchParams: { course?: string; tab?: string };
}) {
  if (searchParams.tab !== 'materials') {
    redirect(
      searchParams.course
        ? `/library/past-questions?course=${encodeURIComponent(searchParams.course)}`
        : '/library/past-questions'
    );
  }

  const supabase = createClient();
  const courses = await getCourseOptions(supabase);

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8 -mb-4 sm:-mb-6 lg:-mb-8">
      <RepositoryBrowser courses={courses} initialCourseId={searchParams.course} title="Lecture Slides" />
    </div>
  );
}
