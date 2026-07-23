import { createClient } from '@/lib/supabase/server';
import UserManager from '@/components/admin/UserManager';

export default async function AdminUsersPage() {
  const supabase = createClient();
  const { data: users } = await supabase
    .from('profiles')
    .select('id, student_id, full_name, department, role, upload_count, strikes_count')
    .order('created_at', { ascending: false });

  return <UserManager users={(users as any) ?? []} />;
}
