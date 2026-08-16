import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import OpportunityHubClient, { type Opportunity } from '@/components/opportunity-hub/OpportunityHubClient';
export default async function OpportunityHubPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: opportunities } = await supabase
    .from('opportunities')
    .select(
      'id, title, organization, category, deadline, location, remote_or_onsite, verified, featured, application_link, cover_image_url'
    )
    .eq('status', 'published')
    .order('featured', { ascending: false })
    .order('deadline', { ascending: true, nullsFirst: false });
  return <OpportunityHubClient opportunities={(opportunities as Opportunity[]) ?? []} />;
}
