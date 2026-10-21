import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    environment: 'node',
    // La IA real hace búsquedas: damos margen sin ocultar cuelgues.
    testTimeout: 30000,
  },
})
