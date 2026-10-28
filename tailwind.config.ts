import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        surface: {
          DEFAULT: 'var(--surface)',
          elevated: 'var(--surface-elevated)',
        },
        teal: {
          DEFAULT: '#128085',
          dark: '#0e6468',
          light: '#e6f6f6',
          hover: '#0e6468',
        },
        cashify: {
          teal: '#128085',
          dark: '#0e6468',
          light: '#e6f6f6',
          green: '#2ecc71',
          yellow: '#f8c12d',
          orange: '#f37021',
        },
        gold: {
          DEFAULT: '#128085',
          hover: '#0e6468',
          soft: 'rgba(18, 128, 133, 0.1)',
        },
        'on-gold': '#ffffff',
        foreground: 'var(--foreground)',
        muted: 'var(--muted)',
        border: 'var(--border)',
        success: '#2ecc71',
        warning: '#f8c12d',
        danger: '#e74c3c',
      },
      fontFamily: {
        display: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        'token-sm': 'var(--shadow-sm)',
        'token-md': 'var(--shadow-md)',
        'token-lg': 'var(--shadow-lg)',
        gold: '0 4px 20px rgba(18, 128, 133, 0.15)',
        'gold-lg': '0 8px 30px rgba(18, 128, 133, 0.25)',
      },
    },
  },
  plugins: [],
};

export default config;
