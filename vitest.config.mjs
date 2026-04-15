import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'url'

export default defineConfig({
  test: {
    environment: 'node',
  },
  resolve: {
    alias: {
      obsidian: fileURLToPath(new URL('./src/__tests__/__mocks__/obsidian.ts', import.meta.url)),
    },
  },
})
