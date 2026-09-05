import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ComingSoon from '@/components/dashboard/ComingSoon';

export default async function AudioSlidesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <ComingSoon
      stage="Audio-Slides"
      title="Coming soon, course by course"
      description="Professionally recorded course audio, so you can study on the go. We're starting with core courses and expanding from there — check back as your courses are added."
    />
  );
}
