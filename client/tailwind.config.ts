import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'paper-cream': '#f3e9d2',
        'paper-aged': '#e8dcc0',
        'paper-edge': '#c9b78f',
        ink: '#1c1916',
        'ink-fade': '#52483b',
        redact: '#0f0d0a',
        'stamp-red': '#a8261c',
        'stamp-blue': '#2a4d6e',
        'stamp-green': '#3a6b3a',
        caution: '#d9a93a',
      },
      fontFamily: {
        stencil: ['"Big Shoulders Stencil"', '"Stencil Std"', 'serif'],
        typewriter: ['"Special Elite"', '"Courier Prime"', '"Cutive Mono"', 'monospace'],
        mono: ['"Courier Prime"', '"Cutive Mono"', 'monospace'],
      },
      keyframes: {
        stampSlam: {
          '0%': { transform: 'scale(1.4) rotate(-8deg)', opacity: '0' },
          '60%': { transform: 'scale(0.95) rotate(-4deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(-3deg)', opacity: '1' },
        },
        typewriter: {
          '0%': { width: '0' },
          '100%': { width: '100%' },
        },
        folderSlide: {
          '0%': { transform: 'translateX(-12px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
      animation: {
        'stamp-slam': 'stampSlam 180ms ease-out forwards',
        typewriter: 'typewriter 1.2s steps(30, end) forwards',
        'folder-slide': 'folderSlide 200ms ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
