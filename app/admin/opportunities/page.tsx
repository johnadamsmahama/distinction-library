import { createClient } from '@/lib/supabase/server';
import OpportunitiesManager from '@/components/admin/OpportunitiesManager';

export default async function AdminOpportunitiesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: opportunities } = await supabase
    .from('opportunities')
    .select(
      'id, title, organization, category, description, eligibility, deadline, location, remote_or_onsite, application_link, status, verified, featured, source, created_at'
    )
    .order('created_at', { ascending: false });

  return <OpportunitiesManager opportunities={(opportunities as any) ?? []} adminId={user?.id ?? ''} />;
}
