import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCourseOptions } from '@/lib/papers-data';
import VaultList from '@/components/vault/VaultList';

export default async function VaultPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: items }, courses] = await Promise.all([
    supabase
      .from('study_vault_items')
      .select('id, item_type, title, source_material_name, content, created_at, course_id, folder_name, courses(code)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    getCourseOptions(supabase),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display font-bold text-xl text-navy">Your Study Vault</h1>
      </div>
      <p className="font-body text-xs text-g600 mb-3">
        Private to you — quizzes and Companion sessions you've saved. Organize them by course or
        your own folders.
      </p>
      <VaultList items={(items as any) ?? []} courses={courses} />
    </div>
  );
}
