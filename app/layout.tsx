import type { Metadata, Viewport } from 'next';
import { Courier_Prime, Playfair_Display } from 'next/font/google';
import './globals.css';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import { Analytics } from '@vercel/analytics/react';

const courierPrime = Courier_Prime({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-courier-prime',
  display: 'swap',
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['600'],
  style: ['normal', 'italic'],
  variable: '--font-playfair-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Distinction Library — J.A. Mahama Initiative',
  description:
    'The all-in-one academic platform, built exclusively for UPSA students. Past questions, curated study materials, and AI-powered learning — all in one place.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.png',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#0D2B5E',
  // "light dark" declares that the page supports dark mode. The site has no
  // dark styles, so it keeps its white design everywhere. Browsers like
  // Samsung Internet skip their auto-dark conversion for pages that declare
  // dark support (the "only light" setting did not stop it).
  colorScheme: 'light dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${courierPrime.variable} ${playfairDisplay.variable}`}
      // Same declaration at the CSS level, for browsers that read it from
      // the root element instead of the meta tag.
      style={{ colorScheme: 'light dark' }}
    >
      <body>
        {children}
        <ServiceWorkerRegister />
        <Analytics />
      </body>
    </html>
  );
}
