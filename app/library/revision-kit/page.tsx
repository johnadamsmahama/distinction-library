import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import RevisionKitBrowser from '@/components/library/RevisionKitBrowser';

export default async function RevisionKitPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <RevisionKitBrowser />
  );
}
