import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  { test: { name: 'shared', root: './shared', include: ['src/**/*.test.ts'] } },
  { test: { name: 'server', root: './server', include: ['src/**/*.test.ts'] } },
  {
    test: {
      name: 'client',
      root: './client',
      include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
      environment: 'jsdom',
    },
  },
]);
