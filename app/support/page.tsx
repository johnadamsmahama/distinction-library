import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SupportForm from '@/components/support/SupportForm';

export default async function SupportPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  const { data: tickets } = await supabase
    .from('support_tickets')
    .select('id, subject, message, resolved, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-navy mb-1">Contact &amp; Support</h1>
      <p className="font-body text-sm text-g600 mb-6">
        Questions, issues, or feedback — we read every message.
      </p>
      <SupportForm
        studentEmail={user.email ?? ''}
        defaultName={profile?.full_name ?? null}
        initialTickets={(tickets as any) ?? []}
      />
    </div>
  );
}
