import { createClient } from '@/lib/supabase/server';

export const revalidate = 0;

export default async function Stats() {
  const supabase = createClient();

  const [papersRes, materialsRes, papersDownloads, materialsDownloads] = await Promise.all([
    supabase.from('past_papers').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('study_materials').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('past_papers').select('download_count'),
    supabase.from('study_materials').select('download_count'),
  ]);

  const papersCount = papersRes.count ?? 0;
  const materialsCount = materialsRes.count ?? 0;

  const totalDownloads =
    (papersDownloads.data ?? []).reduce((sum, r: any) => sum + (r.download_count ?? 0), 0) +
    (materialsDownloads.data ?? []).reduce((sum, r: any) => sum + (r.download_count ?? 0), 0);

  const STATS = [
    { num: `${papersCount}`, label: 'Past Questions', path: 'M4 4h16v16H4z M8 9h8M8 13h5' },
    { num: `${materialsCount}`, label: 'Study Materials', path: 'M4 19V6a2 2 0 012-2h12a2 2 0 012 2v13 M4 19a2 2 0 002 2h12a2 2 0 002-2' },
    { num: `${totalDownloads}`, label: 'Downloads', path: 'M12 3v13m0 0l-4-4m4 4l4-4M5 19h14' },
    { num: '100%', label: 'UPSA Verified', path: 'M9 12l2 2 4-4' },
  ];

  return (
    <section className="relative bg-navy py-16 px-7 overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(201,160,44,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(201,160,44,0.06) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}
      />
      <div className="relative z-10 max-w-content mx-auto flex flex-wrap justify-center gap-[22px]">
        {STATS.map((s, i) => (
          <div
            key={s.label}
            className="relative w-[118px] h-[122px] border border-gold/50 flex flex-col items-center justify-center text-center pt-1 before:content-[''] before:absolute before:inset-[6px] before:border before:border-gold/30"
            style={{ transform: `rotate(${[-3, 2, -2, 4][i % 4]}deg)`, marginTop: [0, 8, 0, 6][i % 4] }}
          >
            <svg
              viewBox="0 0 24 24"
              className="relative z-10 w-[18px] h-[18px] mb-1.5 stroke-gold fill-none"
              strokeWidth={2.2}
            >
              <path d={s.path} />
            </svg>
            <div className="relative z-10 font-display font-black text-[21px] text-gold-light">{s.num}</div>
            <div className="relative z-10 font-condensed font-extrabold text-[7.5px] uppercase tracking-[.07em] text-white/70 mt-1">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
