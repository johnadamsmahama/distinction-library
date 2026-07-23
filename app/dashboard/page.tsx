import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getDashboardData } from '@/lib/dashboard-data';
import ProfileCard from '@/components/dashboard/ProfileCard';
import BookmarkedCourses from '@/components/dashboard/BookmarkedCourses';
import RecentActivity from '@/components/dashboard/RecentActivity';
import { VaultSummary, QuickActions } from '@/components/dashboard/VaultAndActions';

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const data = await getDashboardData(supabase, user.id);
  const fullName = data.profile?.full_name ?? (user.user_metadata?.full_name as string) ?? null;

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-navy mb-1">
        Welcome back{fullName ? `, ${fullName.split(' ')[0]}` : ''}.
      </h1>
      <p className="font-body text-sm text-g600 mb-8">Here&apos;s where you left off.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <BookmarkedCourses courses={data.bookmarks} />
          <RecentActivity papers={data.recentPapers as any} materials={data.recentMaterials as any} />
        </div>

        <div className="space-y-6">
          <ProfileCard
            fullName={fullName}
            department={data.profile?.department ?? null}
            level={data.profile?.level ?? null}
            uploadCount={data.profile?.upload_count ?? 0}
            strikesCount={data.profile?.strikes_count ?? 0}
            uploadSuspended={data.profile?.upload_suspended ?? false}
            contributorBadge={data.profile?.contributor_badge ?? null}
            leaderboardRank={data.leaderboardRank}
          />
          <VaultSummary summary={data.vaultSummary} />
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
