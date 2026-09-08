import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCourseOptions } from '@/lib/papers-data';
import LibraryContentForm from '@/components/admin/LibraryContentForm';

export default async function LibraryContentPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard');
  }

  const courses = await getCourseOptions(supabase);

  return (
    <div className="max-w-2xl">
      <h1 className="font-display font-bold text-2xl text-navy mb-1">Revision Kit &amp; Audio-Slides</h1>
      <p className="font-body text-sm text-g600 mb-6">
        Both are admin-curated — students can never submit these directly. This publishes
        immediately and appears live on the matching Library page, no review queue.
      </p>
      <LibraryContentForm courses={courses} />
    </div>
  );
}
