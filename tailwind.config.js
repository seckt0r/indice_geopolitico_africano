import animate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './index.tsx',
    './App.tsx',
    './components/**/*.{ts,tsx}',
    './utils/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        geo: {
          dark: '#0f172a',
          panel: '#1e293b',
          accent: '#d97706', // Amber-600
          text: '#e2e8f0',
          muted: '#94a3b8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Merriweather', 'Georgia', 'serif'],
      },
    },
  },
  // Fornece as classes animate-in / fade-in / slide-in-from-*, usadas em toda a
  // UI. Antes da migração para Tailwind em build, estas classes não existiam:
  // o CDN não carregava o plugin e as animações simplesmente não aconteciam.
  plugins: [animate],
};
