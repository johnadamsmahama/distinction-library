import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="bg-white">
      <section className="bg-navy-deep px-7 py-20 text-center">
        <div className="max-w-hero mx-auto">
          <div className="eyebrow mb-4">A J.A. Mahama Initiative</div>
          <h1 className="font-display font-black text-[clamp(32px,5vw,48px)] text-white leading-tight">
            Built for UPSA students, by a UPSA student.
          </h1>
        </div>
      </section>

      <section className="px-7 py-16">
        <div className="max-w-[680px] mx-auto space-y-6 font-body text-[15px] leading-relaxed text-g800">
          <p>
            Distinction Library is one part of a wider effort — the J.A. Mahama Comprehensive
            Initiative Compendium — built around a simple idea: every UPSA student should have
            equal access to the tools that make the difference between struggling through a
            semester and actually understanding it.
          </p>
          <p>
            Past papers scattered across group chats. Notes only available if you knew the right
            senior. Study guides that existed but nobody could find. Distinction Library brings all
            of it into one organised, always-free, UPSA-verified space — alongside AI tools that
            turn a lecture-slide PDF into a practice quiz in seconds.
          </p>
          <p>
            It's built to run alongside the{' '}
            <span className="font-semibold text-navy">Distinction Programme</span> — free peer-led
            tutorials and revision sessions run over WhatsApp and Google Classroom — as one
            connected system for academic support at UPSA.
          </p>
        </div>
      </section>

      <section className="bg-navy-deep px-7 py-16">
        <div className="max-w-[680px] mx-auto">
          <div className="eyebrow mb-4">The Founder</div>
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 flex-shrink-0 rounded-full bg-gold flex items-center justify-center font-display font-bold text-xl text-navy">
              JM
            </div>
            <div>
              <p className="font-display font-bold text-lg text-white mb-1">J.A. Mahama</p>
              <p className="font-condensed text-xs text-white/40 mb-4">
                Level 100, Communication Studies (Regular Group 5), UPSA
              </p>
              <p className="font-body text-sm leading-relaxed text-white/60">
                Distinction Library is one of several student-led initiatives under this portfolio
                — spanning student welfare, entrepreneurship, campus culture, and academic support
                — built with the same navy-and-gold identity and the same underlying belief:
                distinction shouldn't require luck.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-7 py-16 text-center">
        <h2 className="font-display font-bold text-2xl text-navy mb-4">Ready to get started?</h2>
        <Link
          href="/signup"
          className="inline-block bg-gold text-navy font-condensed font-bold text-sm px-7 py-3 rounded-lg hover:bg-gold-light transition-colors"
        >
          Create your account
        </Link>
      </section>
    </div>
  );
}
