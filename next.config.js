const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // avoids SW caching hassles while developing
  fallbacks: {
    document: '/offline',
  },
  runtimeCaching: [
    {
      // Approved past papers / materials — cache-first so a student who
      // downloaded something once can still reach it with a weak signal.
      urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/(past-papers-final|study-materials)\/.*/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'distinction-library-files',
        expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
    {
      // Everything else — network first, falling back to cache offline.
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'distinction-library-general',
        expiration: { maxEntries: 60, maxAgeSeconds: 24 * 60 * 60 },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = withPWA(nextConfig);
