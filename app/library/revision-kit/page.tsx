import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ComingSoon from '@/components/dashboard/ComingSoon';

export default async function RevisionKitPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <ComingSoon
      stage="Revision Kit"
      title="Coming soon, course by course"
      description="Each Revision Kit brings together a full semester of lecture slides into one exam-focused study guide. We're rolling these out course by course — check back as your courses are added."
    />
  );
}
