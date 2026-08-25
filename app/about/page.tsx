import Link from 'next/link';

const founderJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'J.A. Mahama',
  alternateName: 'John Adams Mahama',
  jobTitle: 'Founder, Distinction Library',
  description:
    'UPSA Communication Studies student and founder of Distinction Library and other student-led initiatives under the J.A. Mahama Leadership Compendium.',
  affiliation: {
    '@type': 'CollegeOrUniversity',
    name: 'University of Professional Studies, Accra',
  },
  worksFor: {
    '@type': 'Organization',
    name: 'Distinction Library',
    url: 'https://www.distinctionlibrary.com',
  },
  sameAs: [
    'https://www.facebook.com/johnadamsmahamah',
    'https://www.instagram.com/johnadamsmahama',
    'https://www.linkedin.com/in/john-adams-mahama-32bb4b3b1',
  ],
};

export default function AboutPage() {
  return (
    <div className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(founderJsonLd) }}
      />

      <section className="bg-navy-deep px-7 py-20 text-center">
        <div className="max-w-hero mx-auto">
          <div className="eyebrow mb-4">J.A. Mahama Initiative</div>
          <h1 className="font-display font-black text-[clamp(32px,5vw,48px)] text-white leading-tight">
            Built for UPSA students, by a UPSA student.
          </h1>
        </div>
      </section>

      <section className="px-7 py-16">
        <div className="max-w-[680px] mx-auto space-y-6 font-body text-[15px] leading-relaxed text-g800">
          <p>
            Distinction Library is one part of a wider effort — the J.A. Mahama Leadership
            Compendium — built around a simple idea: every UPSA student should have equal access
            to the tools that make the difference between struggling through a semester and
            actually understanding it.
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
            <div className="w-16 h-16 flex-shrink-0 rounded-none bg-gold flex items-center justify-center font-display font-bold text-xl text-navy">
              JM
            </div>
            <div>
              <p className="font-display font-bold text-lg text-white mb-1">J.A. Mahama</p>
              <p className="font-condensed text-xs text-white/40 mb-4">
                Communication Studies (Regular Group 5), UPSA
              </p>
              <p className="font-body text-sm leading-relaxed text-white/60 mb-4">
                Distinction Library is one of several flagship initiatives under the J.A. Mahama
                Leadership Compendium — spanning student welfare, entrepreneurship, campus culture,
                and academic support — built with the same navy-and-gold identity and the same
                underlying belief: distinction shouldn't require luck.
              </p>
              <p className="font-body text-sm leading-relaxed text-white/60">
                There is no verifiable connection between J.A. Mahama and President John Dramani
                Mahama. The two share a surname and Gonja heritage rooted in the Savannah Region,
                but nothing beyond that is confirmed. President Mahama is someone the founder
                deeply admires for his leadership.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-7 py-16 text-center">
        <h2 className="font-display font-bold text-2xl text-navy mb-4">Ready to get started?</h2>
        <Link
          href="/signup"
          className="inline-block bg-gold text-navy font-condensed font-bold text-sm px-7 py-3 rounded-none hover:bg-gold-light transition-colors"
        >
          Create your account
        </Link>
      </section>
    </div>
  );
}
