import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCourseOptions } from '@/lib/papers-data';
import UploadForm from '@/components/papers/UploadForm';

export default async function UploadPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [courses, { data: profile }] = await Promise.all([
    getCourseOptions(supabase),
    supabase.from('profiles').select('upload_suspended').eq('id', user.id).single(),
  ]);

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="font-display font-bold text-2xl text-navy mb-1">Contribute a resource</h1>
      <p className="font-body text-sm text-g600 mb-6">
        Submissions go to a moderator for review before appearing in the library.
      </p>
      <UploadForm courses={courses} uploadSuspended={profile?.upload_suspended ?? false} />
    </div>
  );
}
