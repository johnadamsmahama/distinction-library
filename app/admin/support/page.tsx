import { createClient } from '@/lib/supabase/server';
import SupportManager from '@/components/admin/SupportManager';

export default async function AdminSupportPage() {
  const supabase = createClient();
  const { data: tickets } = await supabase
    .from('support_tickets')
    .select('id, name, student_email, subject, message, resolved, created_at')
    .order('created_at', { ascending: false });

  return <SupportManager tickets={(tickets as any) ?? []} />;
}
