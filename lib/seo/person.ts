// Single source of truth for how Google should understand J.A Mahama.
// Used by /about (founder section) and /about/j-a-mahama (the full biography)
// so both pages describe the same entity with the same @id.

export const SITE_URL = 'https://www.distinctionlibrary.com';
export const BIO_PATH = '/about/j-a-mahama';
export const BIO_URL = `${SITE_URL}${BIO_PATH}`;
export const PERSON_ID = `${BIO_URL}#person`;
const LIBRARY_ID = `${SITE_URL}/#distinction-library`;
const AWARDS_ID = `${BIO_URL}#islamic-personality-awards`;

// Update this whenever the biography text changes.
export const BIO_LAST_UPDATED = '2026-11-20';

// Clean profile URLs (no tracking parameters). The Facebook link is the one
// that was already on the /about page; swap it if the profile address differs.
export const PROFILE_LINKS = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/john-adams-mahama-32bb4b3b1' },
  { label: 'Instagram', href: 'https://www.instagram.com/johnadamsmahama' },
  { label: 'Facebook', href: 'https://www.facebook.com/johnadamsmahamah' },
  { label: 'TikTok', href: 'https://www.tiktok.com/@johnadamsmahama' },
] as const;

export const PERSON_DESCRIPTION =
  'Ghanaian student leader, author and founder of Distinction Library and the Islamic Personality Awards. ' +
  'Former GMSA President at Accra Academy and for Zone 4, Greater Accra; recipient of the Head of State Award; ' +
  'currently studying Communication Studies at the University of Professional Studies, Accra (UPSA).';

/** Full JSON-LD graph for the biography page. */
export function biographyJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfilePage',
        '@id': BIO_URL,
        url: BIO_URL,
        name: 'J.A Mahama (John Adams Mahama) — Biography',
        inLanguage: 'en',
        dateModified: BIO_LAST_UPDATED,
        mainEntity: { '@id': PERSON_ID },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Distinction Library', item: SITE_URL },
            { '@type': 'ListItem', position: 2, name: 'About', item: `${SITE_URL}/about` },
            { '@type': 'ListItem', position: 3, name: 'J.A Mahama', item: BIO_URL },
          ],
        },
      },
      personNode(),
      {
        '@type': 'Organization',
        '@id': LIBRARY_ID,
        name: 'Distinction Library',
        url: SITE_URL,
        description:
          'A digital repository and peer-led tutoring programme built for students of the University of Professional Studies, Accra (UPSA).',
        founder: { '@id': PERSON_ID },
      },
      {
        '@type': 'Organization',
        '@id': AWARDS_ID,
        name: 'Islamic Personality Awards',
        description:
          'An awards initiative recognising, honouring and celebrating the exceptional efforts of the Muslim Ummah.',
        founder: { '@id': PERSON_ID },
      },
    ],
  };
}

/** Lighter version for pages that only need to point at the same person. */
export function personJsonLd() {
  return { '@context': 'https://schema.org', ...personNode() };
}

function personNode() {
  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: 'John Adams Mahama',
    alternateName: ['J.A Mahama', 'J.A. Mahama'],
    url: BIO_URL,
    mainEntityOfPage: BIO_URL,
    jobTitle: 'Founder, Distinction Library',
    description: PERSON_DESCRIPTION,
    nationality: { '@type': 'Country', name: 'Ghana' },
    birthPlace: {
      '@type': 'Place',
      name: 'Damongo, Savannah Region, Ghana',
    },
    affiliation: {
      '@type': 'CollegeOrUniversity',
      name: 'University of Professional Studies, Accra',
      alternateName: 'UPSA',
    },
    alumniOf: [
      { '@type': 'School', name: 'Accra Academy' },
      { '@type': 'School', name: 'Bob Figures Methodist JHS B' },
      { '@type': 'School', name: 'Bob Figures Methodist Primary School' },
    ],
    award: 'Head of State Award',
    knowsAbout: ['Leadership', 'Governance', 'Politics'],
    worksFor: { '@id': LIBRARY_ID },
    sameAs: PROFILE_LINKS.map((l) => l.href),
  };
}

/** JSON.stringify is not enough inside <script>: a "<" could close the tag early. */
export function toJsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
