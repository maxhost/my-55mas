import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'json-summary'],
      include: ['src/features/**', 'src/shared/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // 'server-only' throws at Next build time when imported from a
      // client bundle. In jsdom tests we just need a no-op.
      'server-only': path.resolve(__dirname, './src/test/server-only-stub.ts'),
    },
  },
});
