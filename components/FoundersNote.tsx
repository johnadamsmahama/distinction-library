import Reveal from './Reveal';

export default function FoundersNote() {
  return (
    <section id="founders-note" className="py-[70px] px-7 bg-navy-mid">
      <div className="max-w-[460px] mx-auto">
        <Reveal>
          <div className="eyebrow mb-3">A Note From The Founder</div>

          <div className="relative bg-[#F7F3E8] pl-[22px] pr-6 pt-5 pb-[18px] shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
            <span className="absolute left-[13px] top-3 w-[7px] h-[7px] rounded-full bg-navy-mid shadow-[inset_0_0_0_1px_rgba(0,0,0,0.2)]" />
            <span className="absolute left-[13px] bottom-3 w-[7px] h-[7px] rounded-full bg-navy-mid shadow-[inset_0_0_0_1px_rgba(0,0,0,0.2)]" />

            <div className="flex items-start justify-between gap-3.5 border-b border-navy-deep/15 pb-[11px] mb-[13px]">
              <div>
                <div className="font-condensed font-extrabold text-[13.5px] tracking-[0.5px] text-navy">
                  J.A. MAHAMA
                </div>
                <div className="font-body text-[11px] text-g600 mt-0.5">
                  Founder, Distinction Programme
                </div>
              </div>
              <div className="w-[46px] h-[46px] bg-navy border border-gold flex items-center justify-center shrink-0">
                {/* Swap for founder photograph when available */}
                <span className="font-display font-black text-[14.5px] text-gold-light">JM</span>
              </div>
            </div>

            <p className="font-display font-bold italic text-[16.5px] leading-[1.4] text-navy border-l-[3px] border-gold pl-[14px] mb-3">
              &ldquo;I built this because I watched students struggle, not from lack of ability,
              but from lack of access.&rdquo;
            </p>

            <div className="font-body text-[12.5px] leading-[1.52] text-g800 space-y-2">
              <p>
                Even in my first semester, I saw the same pattern &mdash; students scrambling for
                past papers days before exams, notes passed around on WhatsApp in poor quality.
                Capable minds spending more time hunting for resources than actually studying.
              </p>
              <p>
                Distinction Library is my answer to that. A single, organised, always-free space
                where every UPSA student, regardless of who they know or what department
                they&apos;re in, has the same access to the tools that make the difference.
              </p>
              <p>Distinction is not accidental. But it shouldn&apos;t require luck either.</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
