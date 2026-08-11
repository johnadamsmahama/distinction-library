export default function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-deep px-7 py-16">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(201,160,44,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(201,160,44,0.035) 1px, transparent 1px)',
          backgroundSize: '52px 52px',
        }}
      />
      <div className="relative z-[2] w-full max-w-[420px]">
        <div className="bg-white border border-navy-deep shadow-2xl">
          {/* Header bar — logo now lives inside the card */}
          <div className="bg-gradient-to-br from-navy to-navy-deep px-6 py-4 flex items-center gap-[9px]">
            <div className="w-[26px] h-[26px] bg-gold rounded-[6px] flex items-center justify-center font-display font-black text-[14px] text-navy-deep flex-shrink-0">
              D
            </div>
            <div className="font-display text-[14px]">
              <span className="text-white">Distinction</span>{' '}
              <span className="text-gold-light">Library</span>
            </div>
          </div>

          {/* Content */}
          <div className="relative p-6">
            {/* thin gold corner brackets */}
            <div className="absolute top-[22px] left-5 w-[14px] h-[14px] border-t-[1.5px] border-l-[1.5px] border-gold/60 pointer-events-none" />
            <div className="absolute bottom-0 right-5 w-[14px] h-[14px] border-b-[1.5px] border-r-[1.5px] border-gold/60 pointer-events-none" />

            <div className="eyebrow mb-2">{eyebrow}</div>
            <h1 className="font-display font-bold text-2xl text-navy mb-2">{title}</h1>
            {subtitle && (
              <p className="font-body text-sm text-g600 mb-4 leading-relaxed">{subtitle}</p>
            )}
            {!subtitle && <div className="mb-4" />}
            {children}
          </div>
        </div>

        {footer && (
          <div className="text-center mt-6 font-condensed text-[12.5px] text-white/40">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
