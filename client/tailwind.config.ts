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
        typewriterIn: {
          '0%': { clipPath: 'inset(0 100% 0 0)' },
          '100%': { clipPath: 'inset(0 0 0 0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        folderSlide: {
          '0%': { transform: 'translateX(-12px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        countPulse: {
          '0%': { transform: 'scale(1)', color: 'inherit' },
          '40%': { transform: 'scale(1.25)', color: '#a8261c' },
          '100%': { transform: 'scale(1)', color: 'inherit' },
        },
        ellipsis: {
          '0%, 20%': { content: '""' },
          '40%': { content: '"."' },
          '60%': { content: '".."' },
          '80%, 100%': { content: '"..."' },
        },
      },
      animation: {
        'stamp-slam': 'stampSlam 220ms cubic-bezier(0.25, 0.85, 0.4, 1.2) forwards',
        'typewriter-in': 'typewriterIn 0.8s steps(20, end) forwards',
        'fade-in': 'fadeIn 280ms ease-out forwards',
        'fade-in-slow': 'fadeIn 600ms ease-out forwards',
        'folder-slide': 'folderSlide 220ms ease-out',
        'count-pulse': 'countPulse 380ms ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
