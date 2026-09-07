import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getCourseOptions } from '@/lib/papers-data';
import PastPapersUploadForm from '@/components/papers/PastPapersUploadForm';
import FullBleedShell from '@/components/papers/FullBleedShell';

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
    <FullBleedShell background="bg-[#DDD4B8]">
      <div className="w-full max-w-lg mx-auto px-4 pt-6 pb-10">
        {/* Home / Library — built into the cream design, since the global
            breadcrumb bar is suppressed on this page (see SELF_NAV_PAGES
            in HomeButtonGate). */}
        <div className="flex items-center gap-2 font-[family-name:var(--font-courier-prime)] font-bold text-[11px] uppercase tracking-wide text-navy mb-6">
          <span>←</span>
          <Link href="/dashboard" className="hover:text-gold transition-colors">
            Home
          </Link>
          <span className="text-[#B0A57E]">/</span>
          <Link href="/library" className="hover:text-gold transition-colors">
            Library
          </Link>
        </div>

        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="font-[family-name:var(--font-courier-prime)] font-bold text-[10px] uppercase tracking-[0.08em] text-gold mb-2">
              Community Contribution
            </div>
            <h1 className="font-display font-bold text-[24px] text-navy-deep leading-snug">
              Contribute a Past Paper
            </h1>
          </div>
          <Link
            href="/papers/my-uploads"
            className="font-[family-name:var(--font-courier-prime)] font-bold text-[10px] uppercase text-navy border border-navy px-2.5 py-1.5 hover:bg-navy/5 transition-colors whitespace-nowrap mt-1"
          >
            My Uploads
          </Link>
        </div>

        <PastPapersUploadForm courses={courses} uploadSuspended={profile?.upload_suspended ?? false} />

        <div className="mt-6 text-center font-[family-name:var(--font-courier-prime)] text-[9px] text-[#8B826A] leading-relaxed">
          — catalogued by the Distinction Library community —
        </div>
      </div>
    </FullBleedShell>
  );
}
