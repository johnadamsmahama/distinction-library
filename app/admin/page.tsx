import { createClient } from '@/lib/supabase/server';

export default async function AdminOverviewPage() {
  const supabase = createClient();

  const [
    { count: userCount },
    { count: pendingPapers },
    { count: pendingMaterials },
    { count: openTickets },
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('past_papers').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('study_materials').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('resolved', false),
  ]);

  const stats = [
    { label: 'Total students', value: userCount ?? 0 },
    { label: 'Papers pending review', value: pendingPapers ?? 0 },
    { label: 'Materials pending review', value: pendingMaterials ?? 0 },
    { label: 'Open support tickets', value: openTickets ?? 0 },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((s) => (
        <div key={s.label} className="bg-white border border-g100 rounded-xl p-5">
          <div className="font-display font-bold text-2xl text-navy mb-1">{s.value}</div>
          <div className="font-condensed text-[11px] uppercase tracking-wide text-g600">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
