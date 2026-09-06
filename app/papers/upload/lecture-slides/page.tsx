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
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8 -mb-4 sm:-mb-6 lg:-mb-8 bg-[#F0EAD6]">
      <div className="w-full max-w-lg mx-auto px-4 pt-8 pb-8">
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="font-condensed font-bold text-[10.5px] uppercase tracking-wide text-[#8A6A1C] mb-1.5">
              Community Contribution
            </div>
            <h1 className="font-display font-bold text-[21px] text-navy">Contribute Lecture Slides</h1>
          </div>
          <Link
            href="/papers/my-uploads"
            className="font-condensed font-bold text-[10px] uppercase text-[#8A6A1C] border border-[#C9A02C] rounded-none px-2.5 py-1 hover:bg-[#C9A02C]/10 transition-colors whitespace-nowrap mt-1"
          >
            My Uploads
          </Link>
        </div>

        <LectureSlidesUploadForm courses={courses} uploadSuspended={profile?.upload_suspended ?? false} />

        <div className="mt-4 text-center font-mono text-[9px] text-[#B9AE8C]">
          — catalogued by the Distinction Library community —
        </div>
      </div>
    </div>
  );
}
