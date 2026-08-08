import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getCourseOptions } from '@/lib/papers-data';
import UploadForm from '@/components/papers/UploadForm';

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.35'/%3E%3C/svg%3E\")";

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
    <div
      className="relative overflow-hidden flex flex-col px-4 pt-8 pb-5 -mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8 -mb-4 sm:-mb-6 lg:-mb-8"
      style={{
        height: 'calc(100dvh - 3.5rem)',
        backgroundImage: 'radial-gradient(120% 90% at 50% 0%, #0F2244 0%, #0D2B5E 45%, #060F1E 100%)',
      }}
    >
      <div
        className="absolute inset-0 opacity-[0.25] pointer-events-none"
        style={{ backgroundImage: GRAIN, mixBlendMode: 'overlay' }}
      />

      <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" viewBox="0 0 400 500">
        <g style={{ animation: 'contribDriftA 15s ease-in-out infinite', transformOrigin: '60px 90px' }}>
          <g stroke="#E2BE5A" strokeWidth="0.7" opacity="0.22" fill="none">
            <line x1="30" y1="60" x2="85" y2="120" />
            <line x1="85" y1="120" x2="55" y2="185" />
          </g>
          <circle cx="30" cy="60" r="1.8" fill="#E2BE5A" opacity="0.4" />
          <circle cx="85" cy="120" r="2" fill="#E2BE5A" opacity="0.4" />
          <circle cx="55" cy="185" r="1.6" fill="#E2BE5A" opacity="0.4" />
        </g>
        <g style={{ animation: 'contribDriftB 19s ease-in-out infinite', transformOrigin: '390px 260px' }}>
          <g stroke="#E2BE5A" strokeWidth="0.7" opacity="0.2" fill="none">
            <line x1="380" y1="240" x2="335" y2="310" />
          </g>
          <circle cx="380" cy="240" r="1.8" fill="#E2BE5A" opacity="0.4" />
          <circle cx="335" cy="310" r="1.6" fill="#E2BE5A" opacity="0.4" />
        </g>
        <circle cx="220" cy="40" r="1.2" fill="#E2BE5A" opacity="0.3" />
        <circle cx="360" cy="460" r="1.2" fill="#E2BE5A" opacity="0.3" />
      </svg>

      <div className="relative z-10 w-full max-w-lg mx-auto flex flex-col flex-1 min-h-0">
        <div className="flex items-center gap-2 mb-1.5 shrink-0">
          <span className="font-condensed font-bold text-[10.5px] uppercase tracking-wide text-gold-light">
            Community Contribution
          </span>
          <Link
            href="/papers/my-uploads"
            className="ml-auto font-condensed font-bold text-[10px] uppercase text-gold border border-gold/40 rounded-full px-2.5 py-1 hover:bg-gold/10 transition-colors"
          >
            My Uploads
          </Link>
        </div>

        <h1 className="font-display font-bold text-[23px] text-white mb-1.5 shrink-0">Contribute a resource</h1>
        <p className="text-[12.5px] text-white/65 leading-snug mb-4 shrink-0">
          Submissions go to a moderator for review before appearing in the library.
        </p>

        <div className="flex-1 flex flex-col min-h-0">
          <UploadForm courses={courses} uploadSuspended={profile?.upload_suspended ?? false} />
        </div>

        <div className="mt-2.5 text-center font-mono text-[9px] text-white/40 shrink-0">
          — catalogued by the Distinction Library community —
        </div>
      </div>

      <style>{`
        @keyframes contribDriftA { 0%,100%{transform:translate(0,0);} 50%{transform:translate(5px,-6px);} }
        @keyframes contribDriftB { 0%,100%{transform:translate(0,0);} 50%{transform:translate(-5px,5px);} }
      `}</style>
    </div>
  );
}
