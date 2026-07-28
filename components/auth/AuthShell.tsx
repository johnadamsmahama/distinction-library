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
        <div className="flex items-center gap-[9px] justify-center mb-9">
          <div className="w-[30px] h-[30px] bg-gold rounded-[7px] flex items-center justify-center font-display font-black text-[15px] text-navy">
            D
          </div>
          <div className="font-condensed font-bold text-[17px]">
            <span className="text-white">Distinction</span>{' '}
            <span className="text-gold">Library</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-2xl">
          <div className="eyebrow mb-2">{eyebrow}</div>
          <h1 className="font-display font-bold text-2xl text-navy mb-2">{title}</h1>
          {subtitle && (
            <p className="font-body text-sm text-g600 mb-4 leading-relaxed">{subtitle}</p>
          )}
          {!subtitle && <div className="mb-4" />}
          {children}
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
