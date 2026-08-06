import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getDashboardData } from '@/lib/dashboard-data';
import ProfileCard from '@/components/dashboard/ProfileCard';

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const data = await getDashboardData(supabase, user.id);
  const fullName = data.profile?.full_name ?? (user.user_metadata?.full_name as string) ?? null;

  return (
    <div className="max-w-md mx-auto">
      <p className="font-condensed text-[11px] font-semibold uppercase tracking-widest text-gold mb-2">
        Your Standing
      </p>
      <h1 className="font-display font-bold text-2xl text-navy mb-1">Profile</h1>
      <p className="font-body text-sm text-g600 mb-6">Your standing on Distinction Library.</p>

      <ProfileCard
        fullName={fullName}
        department={data.profile?.department ?? null}
        level={data.profile?.level ?? null}
        uploadCount={data.profile?.upload_count ?? 0}
        strikesCount={data.profile?.strikes_count ?? 0}
        uploadSuspended={data.profile?.upload_suspended ?? false}
        contributorBadge={data.profile?.contributor_badge ?? null}
        leaderboardRank={data.rank}
      />

      {/* continuation slip: perforation strip + dotted rows, reads as page 2 of the same document */}
      <div className="relative mt-5 bg-white border border-g100 overflow-hidden">
        <div
          className="absolute top-0 left-0 right-0 h-[3px] opacity-50"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, #0D2B5E 0 8px, transparent 8px 14px)',
          }}
        />
        <div className="px-5 py-3.5 flex items-center justify-between">
          <span className="font-body text-sm text-g600">Email</span>
          <span className="font-condensed font-semibold text-sm text-g800">{user.email}</span>
        </div>
        <div className="px-5 py-3.5 flex items-center justify-between border-t border-dotted border-g100">
          <span className="font-body text-sm text-g600">UPSA verification</span>
          <span
            className={`font-body font-bold text-sm ${
              user.email_confirmed_at ? 'text-green-700' : 'text-amber-700'
            }`}
          >
            {user.email_confirmed_at ? 'Verified' : 'Pending'}
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Link
          href="/leaderboard"
          className="text-center bg-white border-[1.5px] border-navy text-navy font-condensed font-bold text-sm py-3 hover:bg-navy hover:text-white transition-colors"
        >
          View Leaderboard
        </Link>
        <Link
          href="/dashboard/settings"
          className="text-center bg-gold text-navy font-condensed font-bold text-sm py-3 hover:bg-gold-light transition-colors"
        >
          Edit in Settings
        </Link>
      </div>
    </div>
  );
}
