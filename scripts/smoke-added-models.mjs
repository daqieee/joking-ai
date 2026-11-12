import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { build, preview } from 'vite'
import { chromium } from '@playwright/test'

// No intercepted successful responses: this checks the actual pinned upstream
// downloads, browser CORS, tokenizer, WASM forward passes and cumulative streaming.
const root = fileURLToPath(new URL('../', import.meta.url))
const evidence = new URL('../test-results/added-models/', import.meta.url)
const report = {
  timestamp: new Date().toISOString(),
  results: [],
  downloads: [],
  errors: [],
  ok: false,
}
let server
let browser
try {
  await mkdir(evidence, { recursive: true })
  await build({
    configFile: false,
    root,
    base: '/joking-ai/',
    worker: { format: 'es' },
    build: {
      outDir: '.added-models-smoke-dist',
      rollupOptions: { input: fileURLToPath(new URL('./inference-smoke.html', import.meta.url)) },
    },
  })
  server = await preview({
    configFile: false,
    root,
    base: '/joking-ai/',
    build: { outDir: '.added-models-smoke-dist' },
    preview: { host: '127.0.0.1', port: 4179, strictPort: true },
  })
  browser = await chromium.launch({
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {}),
  })
  const page = await browser.newPage()
  page.on('pageerror', (error) => report.errors.push(error.message))
  page.on('response', (response) => {
    if (/huggingface\.co|hf\.co/.test(response.url()))
      report.downloads.push({ url: response.url().split('?')[0], status: response.status() })
  })
  await page.goto('http://127.0.0.1:4179/joking-ai/scripts/inference-smoke.html')
  await page.waitForFunction(() => !!window.inference)
  for (const [modelId, prompt] of [
    ['acedia', 'What is your plan for today?'],
    ['guppy', 'are you hungry'],
    ['miso', 'are you hungry'],
    ['teapot-gpt', 'coffee'],
  ]) {
    const result = await page.evaluate(
      async ({ modelId, prompt }) => {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), 180_000)
        const started = performance.now()
        const progress = []
        const snapshots = []
        try {
          const result = await window.inference.generateLocalInference({
            modelId,
            prompt,
            signal: controller.signal,
            onProgress: (message) => progress.push(message),
            onToken: (content) => snapshots.push(content),
          })
          return {
            modelId,
            ms: Math.round(performance.now() - started),
            ...result,
            progress,
            snapshots,
          }
        } finally {
          clearTimeout(timer)
        }
      },
      { modelId, prompt },
    )
    assert.ok(result.content.trim(), `${modelId} must produce actual text`)
    assert.equal(result.format, 'text')
    assert.equal(result.snapshots.at(-1), result.content)
    if (modelId === 'teapot-gpt') assert.match(result.content, /^418/)
    report.results.push(result)
    console.log(JSON.stringify(result))
    await writeFile(new URL('./report.json', evidence), JSON.stringify(report, null, 2))
  }
  assert.deepEqual(report.errors, [])
  assert.ok(report.downloads.some((item) => item.url.includes('acedia1v3')))
  assert.ok(report.downloads.some((item) => item.url.includes('guppylm-9M')))
  assert.ok(report.downloads.some((item) => item.url.includes('meowllm-onnx')))
  report.ok = true
} catch (error) {
  report.error = String(error.stack || error)
  console.error(error)
  process.exitCode = 1
} finally {
  await mkdir(evidence, { recursive: true })
  await writeFile(new URL('./report.json', evidence), JSON.stringify(report, null, 2))
  await browser?.close()
  if (server) {
    await new Promise((resolve) => {
      server.httpServer.close(resolve)
      server.httpServer.closeAllConnections()
    })
  }
}
