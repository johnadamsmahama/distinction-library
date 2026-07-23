import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import VaultList from '@/components/vault/VaultList';

export default async function VaultPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: items } = await supabase
    .from('study_vault_items')
    .select('id, item_type, title, source_material_name, content, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display font-bold text-2xl text-navy">Your Study Vault</h1>
      </div>
      <p className="font-body text-sm text-g600 mb-6">
        Private to you — quizzes and Companion sessions you've saved.
      </p>
      <VaultList items={(items as any) ?? []} />
    </div>
  );
}
