import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getDashboardData } from '@/lib/dashboard-data';
import { BuyDataBanner, CommunityAndTools } from '@/components/dashboard/CommunityAndToolsSection';
import BookmarkedCourses from '@/components/dashboard/BookmarkedCourses';
import RecentActivity from '@/components/dashboard/RecentActivity';
import MyRecentViews from '@/components/dashboard/MyRecentViews';
import StudyProgress from '@/components/dashboard/StudyProgress';
import { QuickActions } from '@/components/dashboard/VaultAndActions';
import InstallPrompt from '@/components/InstallPrompt';

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

      {/* Phone / tablet: one centred column in the original order (order-N classes).
          Laptop (lg+): two columns (main + 400px rail) with Quick Actions full width below.
          The wrapper divs use `contents` below lg so they disappear from the layout, and
          `empty:hidden` stops a wrapper around a component that renders nothing from adding a gap. */}
      <div className="max-w-2xl mx-auto lg:max-w-none">
        <InstallPrompt />
      </div>

      <div className="flex flex-col gap-6 max-w-2xl mx-auto lg:max-w-none lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-7 lg:items-start">
        {/* Main column */}
        <div className="contents lg:flex lg:flex-col lg:gap-6 lg:col-start-1">
          <div className="order-1 mb-6 lg:mb-0">
            <BuyDataBanner />
          </div>
          <div className="order-3">
            <BookmarkedCourses courses={data.bookmarks} />
          </div>
          <div className="order-4 empty:hidden">
            <StudyProgress items={data.studyProgress} />
          </div>
        </div>

        {/* Right rail */}
        <div className="contents lg:flex lg:flex-col lg:gap-6 lg:col-start-2">
          <div className="order-2">
            <CommunityAndTools />
          </div>
          <div className="order-5 empty:hidden">
            <MyRecentViews items={data.myRecentViews as any} />
          </div>
          <div className="order-6">
            <RecentActivity papers={data.recentPapers as any} materials={data.recentMaterials as any} />
          </div>
        </div>

        {/* Full width below */}
        <div className="order-7 lg:col-span-2">
          <QuickActions vaultSummary={data.vaultSummary} />
        </div>
      </div>
    </div>
  );
}
