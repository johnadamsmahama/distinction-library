import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SettingsTabs from '@/components/dashboard/SettingsTabs';

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, department, level, leaderboard_opt_out, notification_prefs')
    .eq('id', user.id)
    .single();

  const { data: tickets } = await supabase
    .from('support_tickets')
    .select('id, subject, message, resolved, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-navy mb-1">Settings</h1>
      <p className="font-body text-sm text-g600 mb-6">
        Manage your account, notifications, and support requests.
      </p>
      <SettingsTabs
        userId={user.id}
        userEmail={user.email ?? ''}
        emailConfirmed={!!user.email_confirmed_at}
        initialFullName={profile?.full_name ?? null}
        initialDepartment={profile?.department ?? null}
        initialLevel={profile?.level ?? null}
        initialLeaderboardOptOut={profile?.leaderboard_opt_out ?? false}
        initialNotificationPrefs={profile?.notification_prefs ?? null}
        initialTickets={(tickets as any) ?? []}
      />
    </div>
  );
}
