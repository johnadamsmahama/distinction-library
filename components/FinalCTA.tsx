import Reveal from './Reveal';

export default function FinalCTA() {
  return (
    <section
      id="cta"
      className="relative overflow-hidden text-center bg-navy-deep py-[90px] px-7"
    >
      <div
        className="absolute top-1/2 left-1/2 w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 rounded-none pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(201,160,44,0.10), transparent 70%)',
        }}
      />
      <Reveal className="relative z-[2] max-w-hero mx-auto">
        <h2 className="font-display font-black text-[clamp(30px,5vw,50px)] text-white mb-4">
          Ready to achieve <em className="italic text-gold">distinction</em>?
        </h2>
        <p className="font-body text-[15px] text-white/55 leading-[1.6] mb-8">
          Sign up for Distinction Library — Built by students, for students.
        </p>
        <div className="flex gap-[14px] justify-center flex-wrap">
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
            See All Features
          </a>
        </div>
      </Reveal>
    </section>
  );
}
