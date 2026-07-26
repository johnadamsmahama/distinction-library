import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SettingsForm from '@/components/dashboard/SettingsForm';

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, department, level')
    .eq('id', user.id)
    .single();

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-navy mb-1">Settings</h1>
      <p className="font-body text-sm text-g600 mb-6">
        Update your name, department, and level.
      </p>
      <SettingsForm
        initialFullName={profile?.full_name ?? null}
        initialDepartment={profile?.department ?? null}
        initialLevel={profile?.level ?? null}
      />
    </div>
  );
}