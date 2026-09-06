import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getCourseOptions } from '@/lib/papers-data';
import LectureSlidesUploadForm from '@/components/papers/LectureSlidesUploadForm';

export default async function UploadLectureSlidesPage() {
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
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8 -mb-4 sm:-mb-6 lg:-mb-8 bg-navy">
      <div className="w-full max-w-lg mx-auto px-4 pt-6 pb-8">
        <Link
          href="/library"
          className="inline-flex items-center gap-1.5 font-condensed font-bold text-[10.5px] uppercase text-gold-light hover:text-gold transition-colors mb-4"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back to Library
        </Link>

        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="font-condensed font-bold text-[10.5px] uppercase tracking-wide text-gold-light mb-1.5">
              Community Contribution
            </div>
            <h1 className="font-display font-bold text-[21px] text-white">Contribute Lecture Slides</h1>
          </div>
          <Link
            href="/papers/my-uploads"
            className="font-condensed font-bold text-[10px] uppercase text-gold-light border border-gold rounded-none px-2.5 py-1 hover:bg-gold/10 transition-colors whitespace-nowrap mt-1"
          >
            My Uploads
          </Link>
        </div>

        <LectureSlidesUploadForm courses={courses} uploadSuspended={profile?.upload_suspended ?? false} />

        <div className="mt-4 text-center font-mono text-[9px] text-[#6E82AC]">
          — catalogued by the Distinction Library community —
        </div>
      </div>
    </div>
  );
}
