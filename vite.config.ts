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
  worker: { format: 'es' },
  test: {
    include: ['src/**/*.test.ts'],
  },
})
