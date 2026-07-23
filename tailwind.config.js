/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Section 8.1 — Design Tokens
        'navy-deep': '#060F1E',
        navy: '#0D2B5E',
        'navy-mid': '#0F2244',
        gold: '#C9A02C',
        'gold-light': '#E2BE5A',
        'off-white': '#F7F8FC',
        g100: '#EEF1F8',
        g600: '#5A6478',
        g800: '#1E2A3A',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        condensed: ['"Barlow Condensed"', 'sans-serif'],
        body: ['Barlow', 'sans-serif'],
      },
      maxWidth: {
        content: '1060px',
        hero: '560px',
        faq: '680px',
      },
      keyframes: {
        pulse: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.3 },
        },
      },
      animation: {
        pulse: 'pulse 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
