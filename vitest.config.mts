import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      'expo-secure-store': fileURLToPath(new URL('./tests/mocks/expo-secure-store.ts', import.meta.url)),
    },
  },
});
