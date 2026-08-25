import { redirect } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/dashboard/AppShell';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile, isAdminRole } from '@/lib/auth-helpers';

// Same four rotating tints used on the homepage feature carousel
// (components/Features.tsx) and the Users & Roles list
// (components/admin/UserManager.tsx) — kept in sync across all three so the
// admin area and the public site read as one brand.
const TINTS = [
  { bg: '#FBF3E1', border: '#EBDDB8' }, // cream
  { bg: '#E9F2EA', border: '#C9DECB' }, // mint
  { bg: '#E9EFF6', border: '#C7D5E6' }, // dusty blue
  { bg: '#F6EBEA', border: '#E3C9C6' }, // blush
];

// Trusted Upload moved to sit right after Courses (was last).
// Revision Summit added after Events.
const TABS = [
  { href: '/admin', label: 'Overview', path: 'M3 3h8v8H3V3zM13 3h8v5h-8V3zM13 10h8v11h-8V10zM3 13h8v8H3v-8z' },
  { href: '/admin/users', label: 'Users & Roles', path: 'M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M11 3a4 4 0 110 8 4 4 0 010-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75' },
  { href: '/admin/courses', label: 'Courses', path: 'M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z' },
  { href: '/moderate/trusted-upload', label: 'Trusted Upload', path: 'M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4zM9 12l2 2 4-4' },
  { href: '/admin/tutors', label: 'Peer Tutors', path: 'M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z' },
  { href: '/admin/opportunities', label: 'Opportunities', path: 'M20 7h-3V5a2 2 0 00-2-2h-6a2 2 0 00-2 2v2H4a1 1 0 00-1 1v11a2 2 0 002 2h14a2 2 0 002-2V8a1 1 0 00-1-1zM9 5h6v2H9V5z' },
  { href: '/admin/events', label: 'Events', path: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z' },
  { href: '/admin/revision-summit', label: 'Revision Summit', path: 'M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11' },
  { href: '/admin/blog', label: 'Blog', path: 'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z' },
  { href: '/admin/support', label: 'Support Tickets', path: 'M3 18v-6a9 9 0 0118 0v6M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z' },
  { href: '/admin/moderation-log', label: 'Moderation Log', path: 'M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11' },
  { href: '/admin/broadcast', label: 'Broadcast', path: 'M3 11v3a1 1 0 001 1h2l3.5 4.5V5.5L6 10H4a1 1 0 00-1 1zM17 8a4 4 0 010 8M20 5a8 8 0 010 14' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { user, profile } = await getCurrentProfile(supabase);

  if (!user) redirect('/login');
  if (!isAdminRole(profile?.role)) redirect('/dashboard');

  // Stats banner — now fetched here in the layout so it shows above the
  // tabs on every admin page, not just Overview.
  const [
    { count: userCount },
    { count: pendingPapers },
    { count: pendingMaterials },
    { count: openTickets },
    papersDownloads,
    materialsDownloads,
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('past_papers').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('study_materials').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('resolved', false),
    supabase.from('past_papers').select('download_count'),
    supabase.from('study_materials').select('download_count'),
  ]);

  // Same aggregation used by the public Stats section (components/Stats.tsx),
  // so the two numbers never drift out of sync.
  const totalDownloads =
    (papersDownloads.data ?? []).reduce((sum: number, r: any) => sum + (r.download_count ?? 0), 0) +
    (materialsDownloads.data ?? []).reduce((sum: number, r: any) => sum + (r.download_count ?? 0), 0);

  const stats = [
    { label: 'Total students', value: userCount ?? 0 },
    { label: 'Total downloads', value: totalDownloads },
  ];

  const pendingReview = [
    { label: 'Materials pending', value: pendingMaterials ?? 0 },
    { label: 'Papers pending', value: pendingPapers ?? 0 },
  ];

  return (
    <AppShell>
      <div>
        <p className="font-condensed font-bold text-[10px] uppercase tracking-[.14em] text-gold mb-1.5">
          Full Platform Access
        </p>
        <h1 className="font-display font-bold text-2xl text-navy mb-1">Admin</h1>
        <p className="font-body text-sm text-g600 mb-6">
          Changes here affect the whole platform.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-none p-3 border-l-[3px] border-gold">
              <div className="font-display font-bold text-2xl text-navy mb-0.5">{s.value}</div>
              <div className="font-condensed text-[10px] uppercase tracking-wide text-g600">{s.label}</div>
            </div>
          ))}

          <div className="bg-white rounded-none p-3 border-l-[3px] border-gold flex">
            {pendingReview.map((p, i) => (
              <div key={p.label} className={i === 0 ? 'flex-1' : 'flex-1 border-l border-[#E2E6EF] pl-3 ml-3'}>
                <div className="font-display font-bold text-2xl text-navy mb-0.5">{p.value}</div>
                <div className="font-condensed text-[10px] uppercase tracking-wide text-g600">{p.label}</div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-none p-3 border-l-[3px] border-gold">
            <div className="font-display font-bold text-2xl text-navy mb-0.5">{openTickets ?? 0}</div>
            <div className="font-condensed text-[10px] uppercase tracking-wide text-g600">Open support tickets</div>
          </div>
        </div>

        <div className="flex flex-col gap-2 mb-8">
          {TABS.map((t, i) => {
            const tint = TINTS[i % TINTS.length];
            return (
              <Link
                key={t.href}
                href={t.href}
                className="rounded-none p-3 flex items-center gap-2.5 border-l-[3px] hover:brightness-[0.97] transition-[filter]"
                style={{ background: tint.bg, borderColor: tint.border, borderLeftColor: '#C9A02C' }}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0 stroke-navy fill-none" strokeWidth={1.6}>
                  <path d={t.path} />
                </svg>
                <span className="font-condensed font-semibold text-[13px] text-navy">{t.label}</span>
              </Link>
            );
          })}
        </div>
        {children}
      </div>
    </AppShell>
  );
}
