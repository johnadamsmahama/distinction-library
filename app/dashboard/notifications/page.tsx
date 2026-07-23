import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function NotificationsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: notifications } = await supabase
    .from('notifications')
    .select('id, type, message, read, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display font-bold text-2xl text-navy mb-6">Notifications</h1>
      {!notifications || notifications.length === 0 ? (
        <p className="font-body text-sm text-g600">You're all caught up — nothing here yet.</p>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-xl border ${
                n.read ? 'border-g100 bg-white' : 'border-gold/40 bg-gold/5'
              }`}
            >
              <p className="font-body text-sm text-g800">{n.message}</p>
              <p className="font-condensed text-[10px] uppercase tracking-wide text-g600 mt-1">
                {new Date(n.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
