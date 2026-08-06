import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

type NotifType =
  | 'upload_approved'
  | 'upload_rejected'
  | 'new_paper_bookmarked_course'
  | 'new_material_bookmarked_course'
  | 'strike_warning'
  | 'upload_suspended'
  | 'badge_earned'
  | 'announcement'
  | 'upload_needs_revision';

const STYLES: Record<
  NotifType,
  { border: string; iconBg: string; iconStroke: string; icon: JSX.Element }
> = {
  upload_rejected: {
    border: 'border-l-[3px] border-l-[#B14848]',
    iconBg: 'bg-[#FBEAEA]',
    iconStroke: 'stroke-[#B14848]',
    icon: (
      <path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    ),
  },
  upload_needs_revision: {
    border: 'border-l-[3px] border-l-gold',
    iconBg: 'bg-gold/10',
    iconStroke: 'stroke-gold',
    icon: <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />,
  },
  upload_suspended: {
    border: 'border-l-[3px] border-l-[#B14848]',
    iconBg: 'bg-[#FBEAEA]',
    iconStroke: 'stroke-[#B14848]',
    icon: <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM4.93 4.93l14.14 14.14" />,
  },
  strike_warning: {
    border: 'border-l-[3px] border-l-[#B14848]',
    iconBg: 'bg-[#FBEAEA]',
    iconStroke: 'stroke-[#B14848]',
    icon: (
      <path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    ),
  },
  upload_approved: {
    border: 'border-l-[3px] border-l-[#3E7A4A]',
    iconBg: 'bg-[#E7F3E9]',
    iconStroke: 'stroke-[#3E7A4A]',
    icon: <path d="M20 6 9 17l-5-5" />,
  },
  badge_earned: {
    border: 'border-l-[3px] border-l-gold',
    iconBg: 'bg-gold/10',
    iconStroke: 'stroke-gold',
    icon: <path d="M12 2 15 8.5 22 9.3 17 14 18.2 21 12 17.5 5.8 21 7 14 2 9.3 9 8.5 12 2z" />,
  },
  announcement: {
    border: 'border-l-[3px] border-l-navy',
    iconBg: 'bg-navy/5',
    iconStroke: 'stroke-navy',
    icon: <path d="M3 11v2a1 1 0 0 0 1 1h2l4 4V6L6 10H4a1 1 0 0 0-1 1zM15 8a4 4 0 0 1 0 8M18 5a8 8 0 0 1 0 14" />,
  },
  new_paper_bookmarked_course: {
    border: 'border-l-[3px] border-l-gold',
    iconBg: 'bg-gold/10',
    iconStroke: 'stroke-gold',
    icon: <path d="M19 21 12 16l-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />,
  },
  new_material_bookmarked_course: {
    border: 'border-l-[3px] border-l-gold',
    iconBg: 'bg-gold/10',
    iconStroke: 'stroke-gold',
    icon: <path d="M19 21 12 16l-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />,
  },
};

function renderMessage(message: string) {
  // Pull off a trailing "Reason: ..." clause so it can render on its own line.
  const reasonMatch = message.match(/\s*Reason:\s*(.+)$/i);
  const mainText = reasonMatch ? message.slice(0, reasonMatch.index).trim() : message.trim();
  const reason = reasonMatch ? reasonMatch[1].trim() : null;

  // Bold quoted titles ("Week 5 - Marketing") and course codes (BACS102) inline.
  const parts = mainText.split(/("[^"]+"|\b[A-Z]{3,5}\d{2,4}\b)/g);

  return { reason, node: parts.map((part, i) =>
    /^"[^"]+"$/.test(part) || /^[A-Z]{3,5}\d{2,4}$/.test(part) ? (
      <b key={i} className="font-semibold text-navy">{part}</b>
    ) : (
      <span key={i}>{part}</span>
    )
  )};
}

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

  const unreadIds = (notifications ?? []).filter((n) => !n.read).map((n) => n.id);
  if (unreadIds.length > 0) {
    await supabase.from('notifications').update({ read: true }).in('id', unreadIds);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <p className="font-condensed text-[11px] font-semibold uppercase tracking-widest text-gold mb-2">
      </p>
      <h1 className="font-display font-bold text-2xl text-navy mb-6">Notifications</h1>

      {!notifications || notifications.length === 0 ? (
        <p className="font-body text-sm text-g600">You're all caught up — nothing here yet.</p>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const style = STYLES[n.type as NotifType] ?? STYLES.announcement;
            const { reason, node } = renderMessage(n.message);
            return (
              <div
                key={n.id}
                className={`flex gap-3.5 p-4 rounded-xl border border-g100 bg-white ${style.border} ${
                  !n.read ? 'ring-1 ring-gold/30' : ''
                }`}
              >
                <div className={`shrink-0 w-8 h-8 rounded-[9px] flex items-center justify-center ${style.iconBg}`}>
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth={2.2} className={`w-4 h-4 ${style.iconStroke}`}>
                    {style.icon}
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-[14.5px] leading-snug text-g800">{node}</p>
                  {reason && (
                    <p className="font-body text-[12.5px] font-semibold text-[#B14848] mt-1">
                      Reason: {reason}
                    </p>
                  )}
                  <p className="font-condensed text-[11.5px] text-g600 mt-2">
                    {new Date(n.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
