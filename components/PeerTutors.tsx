import Link from 'next/link';
import Reveal from './Reveal';
import { createClient } from '@/lib/supabase/server';
import { getFeaturedTutors } from '@/lib/tutors-data';
import PeerTutorsCarousel from './PeerTutorsCarousel';

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
          <PeerTutorsCarousel tutors={tutors} />
        </Reveal>

        <Reveal className="text-center mt-9">
          <Link
            href="/tutors"
            className="inline-flex items-center gap-[6px] bg-navy text-white font-condensed font-bold text-sm px-[26px] py-[13px] rounded-none hover:bg-navy-mid transition-colors"
          >
            View all tutors →
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
