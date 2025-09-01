import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './packages/shared'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: [
      'packages/**/__tests__/**/*.test.ts',
      'packages/**/__tests__/**/*.test.tsx',
      'apps/**/__tests__/**/*.test.tsx',
      'src/**/__tests__/**/*.test.ts',
      'src/**/__tests__/**/*.test.tsx',
    ],
  },
});
