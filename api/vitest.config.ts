import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  poolOptions: { threads: { singleThread: true } },
  hookTimeout: 180_000,
  testTimeout: 180_000,
    coverage: { reporter: ['text', 'html'] },
  },
});
