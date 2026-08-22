import DashboardNav from '@/components/dashboard/DashboardNav';
import InactivityLogout from '@/components/auth/InactivityLogout';
import HomeButtonGate from '@/components/shared/HomeButtonGate';
import { createClient } from '@/lib/supabase/server';
import { isStaffRole, isAdminRole } from '@/lib/auth-helpers';

// Shared shell for every authenticated area of the app (dashboard, papers,
// vault, admin, moderate) — same nav, same inactivity timeout, everywhere.
export default async function AppShell({ children }: { children: React.ReactNode }) {
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
    <div className="min-h-screen bg-off-white">
      <InactivityLogout />
      <DashboardNav fullName={fullName} unreadCount={unreadCount} isStaff={isStaff} isAdmin={isAdmin} />
      <main className="max-w-content mx-auto px-5 sm:px-7 py-8">
        <HomeButtonGate />
        {children}
      </main>
    </div>
  );
}
