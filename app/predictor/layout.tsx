import DashboardNav from '@/components/dashboard/DashboardNav';
import BackToDashboard from '@/components/shared/BackToDashboard';
import { createClient } from '@/lib/supabase/server';
import { isStaffRole, isAdminRole } from '@/lib/auth-helpers';

// Predictor renders its own full-bleed dark background inside page.tsx, so
// unlike the rest of the dashboard this layout does NOT use AppShell (that
// would add a padded off-white <main> wrapper and break the full-bleed
// look). It only adds the same DashboardNav header, using the same
// data-fetching pattern AppShell uses, so the hamburger/notifications menu
// is present here too. BackToDashboard is added directly here since
// Predictor is never the dashboard home page itself.
export default async function PredictorLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let fullName: string | null = null;
  let unreadCount = 0;
  let isStaff = false;
  let isAdmin = false;

  if (user) {
    fullName = (user.user_metadata?.full_name as string) ?? null;
    const [{ count }, { data: profile }] = await Promise.all([
      supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false),
      supabase.from('profiles').select('role').eq('id', user.id).single(),
    ]);
    unreadCount = count ?? 0;
    isStaff = isStaffRole(profile?.role);
    isAdmin = isAdminRole(profile?.role);
  }

  return (
    <>
      <DashboardNav fullName={fullName} unreadCount={unreadCount} isStaff={isStaff} isAdmin={isAdmin} />
      <div className="px-4 pt-3">
        <BackToDashboard />
      </div>
      {children}
    </>
  );
}
