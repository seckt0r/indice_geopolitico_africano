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
        // Paleta clara de tom académico. Papel levemente quente, tinta fria,
        // azul institucional para hierarquia e ocre para destaques pontuais.
        geo: {
          paper: '#faf9f6', // fundo da página
          surface: '#ffffff', // cartões e painéis
          subtle: '#f3f1ec', // faixas e zebra
          line: '#e5e1d8', // contornos normais
          strong: '#cec7b8', // contornos com ênfase
          ink: '#16202e', // títulos
          body: '#3b4859', // texto corrido
          muted: '#6e7887', // legendas e metadados
          primary: '#123a5e', // azul institucional
          primarySoft: '#eaf0f5',
          accent: '#a76b16', // ocre para eyebrows e realces
          accentSoft: '#fbf3e4',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"Source Serif 4"', 'Merriweather', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(22, 32, 46, 0.04), 0 8px 24px -12px rgba(22, 32, 46, 0.12)',
        lift: '0 2px 4px rgba(22, 32, 46, 0.05), 0 18px 40px -20px rgba(22, 32, 46, 0.25)',
      },
      maxWidth: {
        prose: '68ch',
      },
    },
  },
  // Fornece as classes animate-in / fade-in / slide-in-from-*, usadas em toda a
  // UI. Antes da migração para Tailwind em build, estas classes não existiam:
  // o CDN não carregava o plugin e as animações simplesmente não aconteciam.
  plugins: [animate],
};
