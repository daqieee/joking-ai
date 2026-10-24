import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const base = '/joking-ai/'
const projectRoot = fileURLToPath(new URL('.', import.meta.url))
const legalFiles = ['LICENSE', 'NOTICE', 'THIRD_PARTY_NOTICES.md'] as const

// These extensionless documents must also remain readable in development:
// Vite's SPA fallback would otherwise return the chat HTML for LICENSE / NOTICE.
function legalTextMiddleware(directory: string) {
  return (request: IncomingMessage, response: ServerResponse, next: () => void) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') return next()
    // Leave Vite's ?raw / ?import module requests to its normal pipeline.
    const pathname = request.url
    const file = legalFiles.find((name) => pathname === `${base}${name}`)
    if (!file) return next()
    const text = readFileSync(resolve(directory, file), 'utf8')
    response.setHeader('Content-Type', 'text/plain; charset=utf-8')
    response.setHeader('X-Content-Type-Options', 'nosniff')
    response.setHeader('Cache-Control', 'no-cache')
    response.end(request.method === 'HEAD' ? undefined : text)
  }
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'distribute-license-documents',
      configureServer(server) {
        server.middlewares.use(legalTextMiddleware(projectRoot))
      },
      configurePreviewServer(server) {
        server.middlewares.use(
          legalTextMiddleware(resolve(server.config.root, server.config.build.outDir)),
        )
      },
      generateBundle() {
        for (const fileName of legalFiles) {
          this.emitFile({
            type: 'asset',
            fileName,
            source: readFileSync(resolve(projectRoot, fileName), 'utf8'),
          })
        }
      },
    },
  ],
  base,
  build: {
    rollupOptions: {
      input: {
        chat: resolve(projectRoot, 'index.html'),
        licenses: resolve(projectRoot, 'licenses/index.html'),
      },
    },
  },
  // Prepare this lazy Worker dependency before the first real request, avoiding
  // a development-page reload. The browser still loads it only on real Send.
  optimizeDeps: { include: ['@wllama/wllama/esm/index.js'] },
  worker: { format: 'es' },
  test: {
    include: ['src/**/*.test.ts'],
  },
})
