export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-navy-deep px-7 pt-[90px] pb-[60px] overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(201,160,44,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(201,160,44,0.035) 1px, transparent 1px)',
          backgroundSize: '52px 52px',
        }}
      />

      <div className="relative z-[2] max-w-hero text-center">
        <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/30 rounded-none px-4 py-[7px] mb-7">
          <span className="font-condensed font-bold text-[10.5px] tracking-[1.5px] uppercase text-gold">
            J.A. Mahama Initiative · UPSA
          </span>
        </div>

        <h1 className="font-display font-black text-[clamp(40px,7vw,68px)] leading-[1.08] text-white mb-[22px]">
          Study with clarity. Graduate with <em className="italic text-gold">distinction</em>.
        </h1>

        <div className="inline-flex items-center justify-center w-[92px] h-[92px] rounded-none border-2 border-gold text-gold-light font-condensed font-extrabold text-[11px] leading-tight tracking-wide text-center -rotate-[8deg] mb-[26px]">
          DISTINCTION
          <br />
          SCHOLARS
        </div>

        <p className="font-body text-[15px] leading-[1.65] text-white/70 mb-[34px]">
          The one place UPSA students go to prepare — past questions, curated materials, and
          AI-powered study tools, built exclusively for you.
        </p>

        <div className="flex gap-[14px] justify-center flex-wrap mb-9">
          <a
            href="/signup"
            className="inline-flex items-center gap-[6px] bg-gold text-navy font-condensed font-bold text-sm px-[26px] py-[13px] rounded-none hover:bg-gold-light hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(201,160,44,0.30)] transition-all"
          >
            Get Started Free →
          </a>
          <a
            href="#features"
            className="bg-transparent text-white font-condensed font-bold text-sm px-[25px] py-3 rounded-none border-[1.5px] border-white/20 hover:border-white/50 hover:-translate-y-0.5 transition-all"
          >
            Explore Features
          </a>
        </div>

        <div className="flex gap-[22px] justify-center flex-wrap font-condensed font-medium text-[11.5px] text-white/70">
          <span>✓ Verified UPSA access only</span>
          <span>✓ Private &amp; secure</span>
          <span>✓ Always free</span>
        </div>
      </div>
    </section>
  );
}
