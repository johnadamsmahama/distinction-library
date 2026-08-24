import { createClient } from '@/lib/supabase/server';

type Filter = 'all' | 'stipend' | 'in_person' | 'online';

export default async function AdminRevisionSummitPage({
  searchParams,
}: {
  searchParams: { filter?: string };
}) {
  const supabase = createClient();

  const { data: signups } = await supabase
    .from('revision_summit_signups')
    .select('*')
    .order('created_at', { ascending: false });

  const rows = signups ?? [];
  const inPerson = rows.filter((r) => r.preferred_format === 'in_person');
  const online = rows.filter((r) => r.preferred_format === 'online');
  const needTransport = rows.filter((r) => r.preferred_format === 'in_person' && r.needs_transport);
  const needStipend = rows.filter((r) => r.preferred_format === 'online' && r.wants_stipend);

  const activeFilter: Filter =
    searchParams.filter === 'stipend' ||
    searchParams.filter === 'in_person' ||
    searchParams.filter === 'online'
      ? searchParams.filter
      : 'all';

  const filteredRows =
    activeFilter === 'stipend'
      ? needStipend
      : activeFilter === 'in_person'
      ? inPerson
      : activeFilter === 'online'
      ? online
      : rows;

  const tabs: { key: Filter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: rows.length },
    { key: 'stipend', label: 'Needs data stipend', count: needStipend.length },
    { key: 'in_person', label: 'In-person', count: inPerson.length },
    { key: 'online', label: 'Online', count: online.length },
  ];

  return (
    <div>
      <h2 className="font-display font-bold text-xl text-navy mb-1">Revision Summit signups</h2>
      <p className="font-body text-sm text-g600 mb-6">
        {rows.length} total responses
      </p>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="bg-white rounded p-3 border-l-[3px] border-gold">
          <div className="font-display font-bold text-2xl text-navy mb-0.5">{rows.length}</div>
          <div className="font-condensed text-[10px] uppercase tracking-wide text-g600">Total signups</div>
        </div>
        <div className="bg-white rounded p-3 border-l-[3px] border-gold">
          <div className="font-display font-bold text-2xl text-navy mb-0.5">{inPerson.length}</div>
          <div className="font-condensed text-[10px] uppercase tracking-wide text-g600">In-person</div>
        </div>
        <div className="bg-white rounded p-3 border-l-[3px] border-gold">
          <div className="font-display font-bold text-2xl text-navy mb-0.5">{online.length}</div>
          <div className="font-condensed text-[10px] uppercase tracking-wide text-g600">Online</div>
        </div>
        <div className="bg-white rounded p-3 border-l-[3px] border-gold">
          <div className="font-display font-bold text-2xl text-navy mb-0.5">{needTransport.length}</div>
          <div className="font-condensed text-[10px] uppercase tracking-wide text-g600">Need transport</div>
        </div>
        <div className="bg-white rounded p-3 border-l-[3px] border-gold">
          <div className="font-display font-bold text-2xl text-navy mb-0.5">{needStipend.length}</div>
          <div className="font-condensed text-[10px] uppercase tracking-wide text-g600">Need data stipend</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((tab) => (
          <a
            key={tab.key}
            href={tab.key === 'all' ? '?' : `?filter=${tab.key}`}
            className="font-condensed text-xs font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full transition-colors"
            style={{
              background: activeFilter === tab.key ? '#0D2B5E' : '#E9EFF6',
              color: activeFilter === tab.key ? '#FFFFFF' : '#0D2B5E',
            }}
          >
            {tab.label} ({tab.count})
          </a>
        ))}
      </div>

      {filteredRows.length === 0 ? (
        <p className="font-body text-sm text-g600">No signups match this filter.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredRows.map((r) => {
            const isInPerson = r.preferred_format === 'in_person';
            return (
              <div key={r.id} className="bg-white rounded p-4 border-l-[3px] border-gold">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-condensed font-semibold text-[14px] text-navy">{r.full_name}</p>
                    <p className="font-body text-xs text-g600">{r.course_level}</p>
                  </div>
                  <span
                    className="font-condensed text-[10px] uppercase tracking-wide px-2 py-1 rounded"
                    style={{
                      background: isInPerson ? '#E9F2EA' : '#E9EFF6',
                      color: '#0D2B5E',
                    }}
                  >
                    {isInPerson ? 'In-person' : 'Online'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-body text-xs text-g600">
                  {isInPerson ? (
                    <>
                      <span>Hostel: {r.lives_in_hostel ? 'Yes' : 'No'}</span>
                      <span>Transport needed: {r.needs_transport ? 'Yes' : 'No'}</span>
                    </>
                  ) : (
                    <span>Data stipend requested: {r.wants_stipend ? 'Yes' : 'No'}</span>
                  )}
                  <span>Phone: {r.phone_number}</span>
                  <span>Session: {r.session_course} &middot; {r.session_date}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
