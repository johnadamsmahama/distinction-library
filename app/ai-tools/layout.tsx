import Constellation from '@/components/ai-tools/Constellation';
import DashboardNav from '@/components/dashboard/DashboardNav';
import HomeButtonGate from '@/components/shared/HomeButtonGate';
import { createClient } from '@/lib/supabase/server';
import { isStaffRole, isAdminRole } from '@/lib/auth-helpers';

export default async function AiToolsLayout({ children }: { children: React.ReactNode }) {
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
    <div className="relative overflow-hidden min-h-screen bg-gradient-to-b from-navy to-navy-deep">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(120% 90% at 50% -10%, rgba(13,43,94,0) 0%, #081A3D 65%)',
        }}
      />
      <Constellation />
      <div className="relative z-10">
        <DashboardNav fullName={fullName} unreadCount={unreadCount} isStaff={isStaff} isAdmin={isAdmin} />
        <div className="mx-auto max-w-3xl px-4 py-3">
          <HomeButtonGate />
          {children}
        </div>
      </div>
    </div>
  );
}
