import { redirect } from 'next/navigation';
import AppShell from '@/components/dashboard/AppShell';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile, isAdminRole } from '@/lib/auth-helpers';

// The layout only guards access and wraps every admin page in the shell.
// The stats banner and the section cards live on the Admin hub page
// (app/admin/page.tsx), so each section opens as its own fresh page
// instead of rendering underneath them.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { user, profile } = await getCurrentProfile(supabase);

  if (!user) redirect('/login');
  if (!isAdminRole(profile?.role)) redirect('/dashboard');

  return <AppShell>{children}</AppShell>;
}
