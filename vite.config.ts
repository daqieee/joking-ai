import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'distribute-third-party-notices',
      apply: 'build',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'THIRD_PARTY_NOTICES.md',
          source: readFileSync(new URL('./THIRD_PARTY_NOTICES.md', import.meta.url), 'utf8'),
        })
      },
    },
  ],
  base: '/joking-ai/',
  // Prepare this lazy Worker dependency before the first real request, avoiding
  // a development-page reload. The browser still loads it only on real Send.
  optimizeDeps: { include: ['@wllama/wllama/esm/index.js'] },
  worker: { format: 'es' },
  test: {
    include: ['src/**/*.test.ts'],
  },
})
