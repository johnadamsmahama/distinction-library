import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PastQuestionsBrowser from '@/components/library/PastQuestionsBrowser';

export default async function PastQuestionsPage({
  searchParams,
}: {
  searchParams: { course?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Opened from a course card (?course=<id>): look the course up so the
  // browser can start filtered to it. An unknown or invalid id is ignored
  // and the page simply opens unfiltered.
  let initialCourse: { id: string; code: string; name: string; level: string } | null = null;
  if (searchParams.course) {
    const { data } = await supabase
      .from('courses')
      .select('id, code, name, level')
      .eq('id', searchParams.course)
      .maybeSingle();
    if (data) initialCourse = data;
  }

  return (
    <div className="-mx-5 sm:-mx-7 -mt-8 -mb-8">
      <PastQuestionsBrowser initialCourse={initialCourse} />
    </div>
  );
}
