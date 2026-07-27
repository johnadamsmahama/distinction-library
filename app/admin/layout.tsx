import { redirect } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/dashboard/AppShell';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile, isAdminRole } from '@/lib/auth-helpers';

const TABS = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/users', label: 'Users & Roles' },
  { href: '/admin/courses', label: 'Courses' },
  { href: '/admin/tutors', label: 'Peer Tutors' },
  { href: '/admin/blog', label: 'Blog' },
  { href: '/admin/support', label: 'Support Tickets' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { user, profile } = await getCurrentProfile(supabase);

  if (!user) redirect('/login');
  if (!isAdminRole(profile?.role)) redirect('/dashboard');

  return (
    <AppShell>
      <div>
        <h1 className="font-display font-bold text-2xl text-navy mb-1">Admin</h1>
        <p className="font-body text-sm text-g600 mb-6">
          Full access — changes here affect the whole platform.
        </p>
        <div className="flex gap-2 mb-8 flex-wrap">
          {TABS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="font-condensed font-bold text-xs uppercase tracking-wide px-4 py-2 rounded-lg bg-white border border-g100 text-g600 hover:border-gold hover:text-navy transition-colors"
            >
              {t.label}
            </Link>
          ))}
        </div>
        {children}
      </div>
    </AppShell>
  );
}
