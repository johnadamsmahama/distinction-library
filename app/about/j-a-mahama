import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/Footer';
import {
  BIO_URL,
  PROFILE_LINKS,
  SITE_URL,
  biographyJsonLd,
  toJsonLdString,
} from '@/lib/seo/person';

const TITLE = 'J.A Mahama (John Adams Mahama) | Biography';
const DESCRIPTION =
  'J.A Mahama (John Adams Mahama) is a Ghanaian student leader, author and founder of Distinction Library and the Islamic Personality Awards. Read his full biography.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: BIO_URL },
  keywords: [
    'J.A Mahama',
    'J.A. Mahama',
    'John Adams Mahama',
    'J.A Mahama biography',
    'Distinction Library founder',
    'Islamic Personality Awards founder',
    'GMSA President Accra Academy',
    'UPSA student leader',
  ],
  openGraph: {
    type: 'profile',
    url: BIO_URL,
    siteName: 'Distinction Library',
    title: TITLE,
    description: DESCRIPTION,
    firstName: 'John',
    lastName: 'Mahama',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
};

const FACTS: { label: string; value: React.ReactNode }[] = [
  { label: 'Full name', value: 'John Adams Mahama' },
  { label: 'Also known as', value: 'J.A Mahama, J.A. Mahama' },
  { label: 'Born and raised', value: 'Damongo, Savannah Region, Ghana' },
  {
    label: 'Studying',
    value: 'B.A. Communication Studies, University of Professional Studies, Accra (UPSA), Level 200',
  },
  {
    label: 'Founder of',
    value: 'Distinction Library · Islamic Personality Awards',
  },
  {
    label: 'Leadership',
    value:
      'GMSA President, Accra Academy · GMSA Zone 4 President, Greater Accra · School Prefect, Bob Figures Methodist JHS B and Primary',
  },
  { label: 'Recognition', value: 'Recipient of the Head of State Award' },
  { label: 'Interests', value: 'Leadership, governance and politics' },
];

export default function JAMahamaBiographyPage() {
  return (
    <div className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdString(biographyJsonLd()) }}
      />

      <header className="bg-navy-deep border-b border-gold/10">
        <div className="max-w-content mx-auto px-7 h-[60px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-[9px]">
            <span className="w-[30px] h-[30px] bg-gold flex items-center justify-center font-display font-black text-[15px] text-navy">
              D
            </span>
            <span className="font-condensed font-bold text-[17px]">
              <span className="text-white">Distinction</span>{' '}
              <span className="text-gold">Library</span>
            </span>
          </Link>
          <Link
            href="/about"
            className="font-condensed font-semibold text-xs uppercase tracking-wider text-white/75 hover:text-white transition-colors"
          >
            About
          </Link>
        </div>
      </header>

      <main>
        <section className="bg-navy-deep px-7 pt-16 pb-20 text-center">
          <div className="max-w-hero mx-auto">
            <div className="eyebrow mb-4">Biography</div>
            <h1 className="font-display font-black text-[clamp(34px,6vw,52px)] text-white leading-tight">
              John Adams Mahama
            </h1>
            <p className="font-display italic text-gold-light text-xl mt-2">(J.A Mahama)</p>
            <p className="font-body text-[15px] text-white/70 mt-5 leading-relaxed">
              Student leader, author, and founder of Distinction Library
            </p>
          </div>
        </section>

        <section className="px-7 py-14">
          <div className="max-w-[680px] mx-auto">
            <h2 className="font-display font-bold text-2xl text-navy mb-5">At a glance</h2>
            <dl className="border border-g100 divide-y divide-g100">
              {FACTS.map((f) => (
                <div key={f.label} className="grid sm:grid-cols-[170px_1fr] gap-1 sm:gap-4 px-4 py-3">
                  <dt className="font-condensed font-bold text-xs uppercase tracking-wider text-g600">
                    {f.label}
                  </dt>
                  <dd className="font-body text-[15px] text-g800">{f.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <article className="px-7 pb-16">
          <div className="max-w-[680px] mx-auto space-y-5 font-body text-[15px] leading-relaxed text-g800">
            <p>
              <strong>John Adams Mahama</strong>, widely known as <strong>J.A Mahama</strong>, is a
              Ghanaian student leader, author and the founder of Distinction Library. He was born and
              raised in Damongo, the capital of Ghana&apos;s Savannah Region, and is currently a
              Level 200 student of Communication Studies at the University of Professional Studies,
              Accra (UPSA).
            </p>

            <h2 className="font-display font-bold text-2xl text-navy pt-4">
              Early life and school leadership
            </h2>
            <p>
              J.A Mahama&apos;s leadership journey began early. At Bob Figures Methodist Primary
              School he served as School Prefect for Blocks A and B at the same time. He continued
              as School Prefect at Bob Figures Methodist JHS B.
            </p>
            <p>
              At Accra Academy he served as President of the Ghana Muslim Students&apos; Association
              (GMSA) in the school. He also led the association beyond the school gates as GMSA
              President for Zone 4, Greater Accra.
            </p>

            <h2 className="font-display font-bold text-2xl text-navy pt-4">Education</h2>
            <p>
              J.A Mahama is pursuing a B.A. in Communication Studies at the University of
              Professional Studies, Accra (UPSA), where he is in Level 200.
            </p>

            <h2 className="font-display font-bold text-2xl text-navy pt-4">
              Founder of Distinction Library
            </h2>
            <p>
              At UPSA, J.A Mahama founded{' '}
              <Link href="/about" className="text-navy font-semibold underline underline-offset-2">
                Distinction Library
              </Link>
              , a digital repository built for UPSA students. It runs alongside a peer-led tutoring
              programme, the Distinction Programme, that helps students prepare for their courses.
            </p>

            <h2 className="font-display font-bold text-2xl text-navy pt-4">
              Founder of the Islamic Personality Awards
            </h2>
            <p>
              He is also the founder of the Islamic Personality Awards, an awards initiative that
              recognises, honours and celebrates the exceptional efforts of the Muslim Ummah.
            </p>

            <h2 className="font-display font-bold text-2xl text-navy pt-4">Recognition</h2>
            <p>J.A Mahama is a recipient of the Head of State Award.</p>

            <h2 className="font-display font-bold text-2xl text-navy pt-4">Author</h2>
            <p>
              J.A Mahama is preparing to launch his first books in early 2027:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <em>The Journey&apos;s Journal</em>
              </li>
              <li>
                <em>The Boy From Madeira Who Built A God: Cristiano Ronaldo dos Santos Aveiro</em>
              </li>
            </ul>

            <h2 className="font-display font-bold text-2xl text-navy pt-4">Interests</h2>
            <p>His interests are leadership, governance and politics.</p>

            <h2 className="font-display font-bold text-2xl text-navy pt-4">Please note</h2>
            <p>
              There is no verifiable connection between J.A Mahama and President John Dramani
              Mahama. The two share a surname, and nothing beyond that is confirmed. J.A Mahama
              deeply admires the President for his leadership.
            </p>
          </div>
        </article>

        <section className="bg-navy-deep px-7 py-14">
          <div className="max-w-[680px] mx-auto">
            <div className="eyebrow mb-4">Connect with J.A Mahama</div>
            <ul className="flex flex-wrap gap-3">
              {PROFILE_LINKS.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="me noopener noreferrer"
                    className="inline-block border border-gold/60 text-gold-light font-condensed font-bold text-sm px-5 py-2 hover:bg-gold hover:text-navy transition-colors"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
