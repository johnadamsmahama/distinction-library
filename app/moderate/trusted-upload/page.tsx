import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile, isAdminRole } from '@/lib/auth-helpers';
import { getCourseOptions } from '@/lib/papers-data';
import TrustedUploadPanel from '@/components/trusted-upload/TrustedUploadPanel';

export default async function TrustedUploadPage() {
  const supabase = createClient();
  const { user, profile } = await getCurrentProfile(supabase);

  if (!user) redirect('/login');
  if (!isAdminRole(profile?.role)) redirect('/dashboard');

  // Deliberately unfiltered — includes inactive (level 200-400) courses,
  // unlike every other course picker on the site, so backlog uploads can
  // target those courses now, ahead of those levels going live.
  const courses = await getCourseOptions(supabase);

  return (
    <div className="max-w-3xl mx-auto px-5 py-8">
      <div className="mb-1">
        <span className="font-condensed font-bold text-[11px] uppercase tracking-wide text-g600">
          Moderate <span className="text-g100">/</span>{' '}
          <span className="text-navy">Trusted Upload</span>
        </span>
      </div>
      <h1 className="font-display font-extrabold text-2xl text-navy mb-1.5">Trusted Upload</h1>
      <p className="font-body text-[13.5px] text-g600 max-w-xl leading-relaxed mb-5">
        For files you&apos;ve already sorted and confirmed by course. Skips AI review and the
        moderation queue — publishes straight to live.
      </p>

      <TrustedUploadPanel courses={courses} />
    </div>
  );
}
