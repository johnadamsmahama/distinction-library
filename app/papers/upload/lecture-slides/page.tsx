import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getCourseOptions } from '@/lib/papers-data';
import LectureSlidesUploadForm from '@/components/papers/LectureSlidesUploadForm';
import FullBleedShell from '@/components/papers/FullBleedShell';

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
    <FullBleedShell>
      <div className="w-full max-w-lg mx-auto px-4 pt-6 pb-10">
        {/* Home / Library — built into the navy design, since the global
            breadcrumb bar is suppressed on this page (see SELF_NAV_PAGES
            in HomeButtonGate). */}
        <div className="flex items-center gap-2 font-condensed font-extrabold text-sm uppercase tracking-wide mb-7">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-gold flex-shrink-0">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <Link href="/dashboard" className="text-gold hover:text-gold-light transition-colors">
            Home
          </Link>
          <span className="text-white/25 normal-case font-normal">/</span>
          <Link href="/library" className="text-gold hover:text-gold-light transition-colors">
            Library
          </Link>
        </div>

        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="font-condensed font-bold text-[10.5px] uppercase tracking-wide text-gold-light mb-2">
              Community Contribution
            </div>
            <h1 className="font-display font-bold text-[22px] text-white leading-snug">
              Contribute Lecture Slides
            </h1>
          </div>
          <Link
            href="/papers/my-uploads"
            className="font-condensed font-bold text-[10px] uppercase text-gold-light border border-gold rounded-none px-2.5 py-1 hover:bg-gold/10 transition-colors whitespace-nowrap mt-1"
          >
            My Uploads
          </Link>
        </div>

        <LectureSlidesUploadForm courses={courses} uploadSuspended={profile?.upload_suspended ?? false} />

        <div className="mt-7 text-center font-mono text-[9px] text-[#6E82AC] leading-relaxed">
          — catalogued by the Distinction Library community —
        </div>
      </div>
    </FullBleedShell>
  );
}
