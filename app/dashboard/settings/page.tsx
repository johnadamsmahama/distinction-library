import Link from 'next/link';
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

      <Link
        href="/support"
        className="mt-6 flex items-center justify-between bg-white border border-g100 rounded-2xl px-5 py-4 hover:border-gold transition-colors"
      >
        <div>
          <div className="font-condensed font-bold text-sm text-navy">Support</div>
          <div className="font-body text-xs text-g600">Contact us or check your past messages</div>
        </div>
        <span className="font-condensed font-bold text-xs uppercase tracking-wide text-gold">
          Open →
        </span>
      </Link>
    </div>
  );
}
