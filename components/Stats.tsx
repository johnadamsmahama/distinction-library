const STATS = [
  { num: '3,400+', label: 'Past Questions', path: 'M4 4h16v16H4z M8 9h8M8 13h5' },
  { num: '980+', label: 'Study Materials', path: 'M4 19V6a2 2 0 012-2h12a2 2 0 012 2v13 M4 19a2 2 0 002 2h12a2 2 0 002-2' },
  { num: '52,000+', label: 'Downloads', path: 'M12 3v13m0 0l-4-4m4 4l4-4M5 19h14' },
  { num: '100%', label: 'UPSA Verified', path: 'M9 12l2 2 4-4' },
];

export default function Stats() {
  return (
    <section className="bg-navy py-14 px-7">
      <div className="max-w-content mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-6 gap-y-9 text-center">
        {STATS.map((s) => (
          <div key={s.label}>
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 mx-auto mb-[14px] stroke-gold fill-none"
              strokeWidth={1.8}
            >
              <path d={s.path} />
            </svg>
            <div className="font-display font-bold text-[30px] text-gold mb-2">{s.num}</div>
            <div className="font-condensed font-semibold text-[10px] uppercase tracking-[1.2px] text-white/38">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
