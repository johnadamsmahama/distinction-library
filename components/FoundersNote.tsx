import Reveal from './Reveal';

export default function FoundersNote() {
  return (
    <section id="founders-note" className="py-[70px] px-7 bg-navy-deep">
      <div className="max-w-content mx-auto">
        <Reveal>
          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-[52px]">
            <div className="md:sticky md:top-[100px] self-start">
              <div className="w-20 h-20 rounded-full bg-gold flex items-center justify-center mb-4 font-display font-bold text-[22px] text-navy">
                JM
              </div>
              <div className="font-condensed font-bold text-sm text-white">J.A. Mahama</div>
              <div className="font-condensed font-medium text-[10.5px] text-white/35 mt-0.5">
                Founder, Distinction Programme
              </div>
            </div>

            <div>
              <div className="eyebrow mb-4">A Note From The Founder</div>
              <p className="font-display font-bold italic text-[22px] text-gold leading-[1.45] border-l-[3px] border-gold pl-[22px] mb-7">
                &ldquo;I built this because I kept watching students fail — not from lack of ability,
                but from lack of access.&rdquo;
              </p>
              <div className="space-y-[18px] font-body text-[14.5px] leading-[1.75] text-white/62">
                <p>
                  Every semester, I saw the same pattern. Students scrambling for past papers days
                  before exams. Notes passed around on WhatsApp in poor quality. Capable minds
                  spending more time hunting for resources than actually studying.
                </p>
                <p>
                  Distinction Library is my answer to that. A single, organised, always-free space
                  where every UPSA student — regardless of who they know or what department
                  they&apos;re in — has the same access to the tools that make the difference.
                </p>
                <p>Distinction is not accidental. But it shouldn&apos;t require luck either.</p>
              </div>
              <div className="font-display italic text-[15px] text-white/40 border-t border-gold/20 pt-[18px] mt-6">
                — J.A. Mahama
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
