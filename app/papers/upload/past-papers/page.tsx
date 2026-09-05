import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getCourseOptions } from '@/lib/papers-data';
import UploadForm from '@/components/papers/UploadForm';
import UploadPageWrapper from '@/components/papers/UploadPageWrapper';

export default async function UploadPastPapersPage() {
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
    <UploadPageWrapper>
      <div className="relative z-10 w-full max-w-lg mx-auto flex flex-col flex-1 min-h-0 px-4 pt-8 pb-5">
        <div className="flex items-center gap-2 mb-1.5 shrink-0">
          <span className="font-condensed font-bold text-[10.5px] uppercase tracking-wide text-gold-light">
            Community Contribution
          </span>
          <Link
            href="/papers/my-uploads"
            className="ml-auto font-condensed font-bold text-[10px] uppercase text-gold border border-gold/40 rounded-none px-2.5 py-1 hover:bg-gold/10 transition-colors"
          >
            My Uploads
          </Link>
        </div>

        <h1 className="font-display font-bold text-[23px] text-white mb-1.5 shrink-0">
          Contribute a Past Paper
        </h1>
        <p className="text-[12.5px] text-white/65 leading-snug mb-4 shrink-0">
          Submissions go to a moderator for review before appearing in the library.
        </p>

        <div className="flex-1 flex flex-col min-h-0">
          <UploadForm courses={courses} uploadSuspended={profile?.upload_suspended ?? false} kind="paper" />
        </div>

        <div className="mt-2.5 text-center font-mono text-[9px] text-white/40 shrink-0">
          — catalogued by the Distinction Library community —
        </div>
      </div>
    </UploadPageWrapper>
  );
}
