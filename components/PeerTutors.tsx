import Link from 'next/link';
import Reveal from './Reveal';
import { createClient } from '@/lib/supabase/server';
import { getFeaturedTutors } from '@/lib/tutors-data';

export default async function PeerTutors() {
  const supabase = createClient();
  const tutors = await getFeaturedTutors(supabase, 3);

  // Nothing to feature yet — skip the section rather than show an empty shelf.
  if (tutors.length === 0) return null;

  return (
    <section id="peer-tutors" className="py-[70px] px-7 bg-white">
      <div className="max-w-content mx-auto">
        <Reveal className="text-center max-w-[520px] mx-auto mb-11">
          <div className="eyebrow">Distinction Programme</div>
          <h2 className="font-display font-bold text-[clamp(26px,4vw,36px)] text-navy mt-[10px]">
            Stuck on a topic? Ask a Peer Tutor.
          </h2>
          <p className="font-body text-[14.5px] leading-[1.65] text-g600 mt-3">
            Peer tutors are fellow UPSA students who volunteer to help with assignments, group
            work, and project work — one-on-one, free.
          </p>
        </Reveal>

        <Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {tutors.map((t) => (
              <div
                key={t.id}
                className="relative bg-white border border-[#E2E6EF] rounded-[14px] p-6 text-center group hover:border-gold hover:-translate-y-[3px] transition-all overflow-hidden"
              >
                <span className="absolute left-0 right-0 bottom-0 h-[3px] bg-gold scale-x-0 origin-left group-hover:scale-x-100 transition-transform" />
                <div className="w-[76px] h-[76px] mx-auto mb-4 rounded-full bg-navy overflow-hidden flex items-center justify-center">
                  {t.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.photo_url} alt={t.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-display font-bold text-2xl text-gold">
                      {t.full_name.charAt(0)}
                    </span>
                  )}
                </div>
                <h3 className="font-display font-bold text-[17px] text-navy mb-1">{t.full_name}</h3>
                <p className="font-condensed font-semibold text-xs uppercase tracking-wide text-g600">
                  {t.department} · Level {t.level}
                </p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal className="text-center mt-9">
          <Link
            href="/tutors"
            className="inline-flex items-center gap-[6px] bg-navy text-white font-condensed font-bold text-sm px-[26px] py-[13px] rounded-lg hover:bg-navy-mid transition-colors"
          >
            View all tutors →
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
