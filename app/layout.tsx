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
  // "only light" (not just "light") is what opts the page out of browsers'
  // forced/auto dark mode, such as Samsung Internet's dark mode for
  // websites. Plain "light" is only a preference and can still be overridden.
  colorScheme: 'only light',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${courierPrime.variable} ${playfairDisplay.variable}`}
      // Same declaration at the CSS level, for browsers that read it from
      // the root element instead of the meta tag.
      style={{ colorScheme: 'only light' }}
    >
      <body>
        {children}
        <ServiceWorkerRegister />
        <Analytics />
      </body>
    </html>
  );
}
