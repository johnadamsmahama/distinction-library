'use client';

/**
 * Shared across every Library resource page (Lecture Slides, Past Questions,
 * Revision Kit, Audio-Slides). Each page previously kept its own copy of this
 * component, which is how the border ended up at an almost-invisible 15%
 * opacity on three of the four pages, and the font-size drifted to 8.5px on
 * a fourth. Fixing it here fixes it everywhere — no more per-page copies.
 *
 * `border` should be a solid, clearly-visible color (not a low-opacity one) —
 * pass each theme's ink color at roughly 40% opacity, not 15%.
 */
export default function FilterSelect({
  value,
  onChange,
  options,
  card,
  border,
  text,
  activeBg,
  activeBorder,
  activeText,
  fontClassName,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  card: string;
  border: string;
  text: string;
  activeBg?: string;
  activeBorder?: string;
  activeText?: string;
  fontClassName?: string;
}) {
  const active = value !== '';
  const resolvedBorder = active && activeBorder ? activeBorder : border;

  return (
    <div className="relative w-full">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full appearance-none cursor-pointer rounded-none pl-2.5 pr-6 py-[5px] font-bold uppercase tracking-wide outline-none transition-all ${fontClassName ?? 'font-mono'}`}
        style={{
          fontSize: 10,
          background: active && activeBg ? activeBg : card,
          border: `1.5px solid ${resolvedBorder}`,
          color: active && activeText ? activeText : text,
          minWidth: 0,
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <div
        className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ fontSize: 9, color: resolvedBorder }}
      >
        ▾
      </div>
    </div>
  );
}
