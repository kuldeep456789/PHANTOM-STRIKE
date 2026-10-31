import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Phantom Strike palette
        phantom: {
          dark:   '#05050f',
          glass:  'rgba(255,255,255,0.04)',
          border: 'rgba(255,255,255,0.08)',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'float':       'float 3s ease-in-out infinite',
        'pulse-glow':  'pulse-glow 2s ease-in-out infinite',
        'slide-up':    'slide-up 0.4s ease-out forwards',
        'fade-in':     'fade-in 0.3s ease-out forwards',
        'score-pop':   'score-pop 0.4s ease-out',
        'card-flip':   'card-flip 0.6s ease-in-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':       { transform: 'translateY(-8px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.6' },
          '50%':       { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'score-pop': {
          '0%':   { transform: 'scale(1)' },
          '50%':  { transform: 'scale(1.4)' },
          '100%': { transform: 'scale(1)' },
        },
        'card-flip': {
          '0%':   { transform: 'rotateY(0deg)' },
          '50%':  { transform: 'rotateY(90deg)' },
          '100%': { transform: 'rotateY(0deg)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};

export default config;

