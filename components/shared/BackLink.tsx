import Link from 'next/link';

/**
 * The one back-navigation link for the app. Before this, back links were
 * hand-rolled in about a dozen places at different font sizes (12px, 13px,
 * 14px), in different font families, and a few in gold text on a light
 * background — which is low-contrast and reads as "faded".
 *
 * Style matches the Home/Library breadcrumb already used across the Library
 * pages: Courier Prime, 13px, bold, uppercase, navy.
 *
 * Use `tone="light"` only on dark backgrounds. For a page with its own
 * established accent color (e.g. Solve Paper's red ink), pass
 * `colorClassName` to override the tone's default color entirely — this
 * should stay the exception, not the default, or the whole point of one
 * shared back-link (one consistent color) erodes page by page.
 */
export default function BackLink({
  href,
  label,
  tone = 'dark',
  colorClassName,
  className = '',
}: {
  href: string;
  label: string;
  tone?: 'dark' | 'light';
  colorClassName?: string;
  className?: string;
}) {
  const color = colorClassName ?? (tone === 'light' ? 'text-white/85' : 'text-navy');
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 font-[family-name:var(--font-courier-prime)] font-bold text-[13px] uppercase tracking-wide ${color} hover:opacity-70 transition-opacity ${className}`}
    >
      <span>←</span>
      {label}
    </Link>
  );
}
