import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { mkdir, stat, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { build, preview } from 'vite'
import { chromium } from '@playwright/test'

const root = fileURLToPath(new URL('../', import.meta.url))
const evidence = new URL('../test-results/inference/', import.meta.url)
const pelicanOnly = process.argv.includes('--pelican-only')
const upstreamOnly = process.argv.includes('--upstream-only')
const reportFile = new URL(
  upstreamOnly ? './upstream-report.json' : pelicanOnly ? './pelican-report.json' : './report.json',
  evidence,
)
const report = {
  timestamp: new Date().toISOString(),
  runtime: 'wllama 3.8.1, CPU, n_threads=1',
  scope: upstreamOnly
    ? 'Browser CORS/download-prefix check only; no inference'
    : pelicanOnly
      ? 'Bounded real Pelican generation and cancellation; a pass does not mean complete HTML'
      : process.argv.includes('--pelican')
        ? 'Actual tiny models and bounded Pelican generation/cancellation; complete HTML is separate'
        : 'Actual tiny-model generation, download cancellation and recovery',
  results: [],
}
await mkdir(evidence, { recursive: true })
const includePelican = !upstreamOnly && (process.argv.includes('--pelican') || pelicanOnly)
const mirrorPath =
  process.env.PELICAN_MODEL_PATH ||
  fileURLToPath(new URL('../.model-cache/pelican-v2-Q4_K_M.gguf', import.meta.url))
const hasMirror =
  includePelican &&
  (await stat(mirrorPath)
    .then((file) => file.size === 167_846_208)
    .catch(() => false))
const mirrorResource = '/joking-ai/__verified-model__/pelican-v2-Q4_K_M.gguf'
if (hasMirror) {
  const hash = createHash('sha256')
  for await (const chunk of createReadStream(mirrorPath)) hash.update(chunk)
  const sha256 = hash.digest('hex')
  assert.equal(sha256, '5d449b74def5447d236471e365c0db1e05396d7df2fd658cdff62116b9bee00a')
  report.pelicanMirror = mirrorPath
  report.pelicanSha256 = sha256
  report.pelicanTransport =
    'SHA-256-verified local HTTP stream; remote CORS/network is a separate check'
}
// The mirror changes only this isolated smoke build. Production keeps its pinned
// Hugging Face URL. Stream the actual bytes over HTTP: a 168 MB route.fulfill
// body would otherwise be base64-encoded into one giant DevTools message.
const mirrorPlugin = () => ({
  name: 'verified-pelican-smoke-mirror',
  enforce: 'pre',
  transform(code, id) {
    if (!hasMirror || !id.replaceAll('\\', '/').endsWith('/src/lib/inference/models.ts')) return
    assert.match(code, /export const PELICAN_URL = `[^`]+`/)
    return code.replace(
      /export const PELICAN_URL = `[^`]+`/,
      `export const PELICAN_URL = 'http://127.0.0.1:4178${mirrorResource}'`,
    )
  },
  configurePreviewServer(server) {
    if (!hasMirror) return
    server.middlewares.use((request, response, next) => {
      if (request.url !== mirrorResource) return next()
      response.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Content-Length': '167846208',
        'Content-Type': 'application/octet-stream',
      })
      if (request.method === 'HEAD') return response.end()
      const stream = createReadStream(mirrorPath)
      stream.on('error', (error) => response.destroy(error))
      response.on('close', () => stream.destroy())
      stream.pipe(response)
    })
  },
})
const saveReport = async () => {
  await mkdir(evidence, { recursive: true })
  await writeFile(reportFile, JSON.stringify(report, null, 2))
}
let checkpoints = Promise.resolve()
let lastPelicanLog = 0
let server
let browser
let page
await saveReport()

try {
  await build({
    configFile: false,
    root,
    base: '/joking-ai/',
    plugins: [mirrorPlugin()],
    worker: { format: 'es', plugins: () => [mirrorPlugin()] },
    build: {
      outDir: '.inference-smoke-dist',
      rollupOptions: { input: fileURLToPath(new URL('./inference-smoke.html', import.meta.url)) },
    },
  })
  server = await preview({
    configFile: false,
    root,
    base: '/joking-ai/',
    plugins: [mirrorPlugin()],
    build: { outDir: '.inference-smoke-dist' },
    preview: { host: '127.0.0.1', port: 4178, strictPort: true },
  })
  browser = await chromium.launch({
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {}),
  })
  page = await browser.newPage({ viewport: { width: 1200, height: 900 } })
  const requests = []
  const errors = []
  page.on('request', (request) => {
    const url = request.url()
    requests.push(/huggingface\.co|xethub\.hf\.co|hf\.co/.test(url) ? url.split('?')[0] : url)
  })
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') console.error('[browser]', message.text())
  })
  page.on('crash', () => errors.push('Chromium page crashed during actual inference'))
  await page.exposeFunction('recordPelican', (snapshot) => {
    const { content, ...details } = snapshot
    const generatedBytes = Buffer.byteLength(content)
    report.pelican = {
      ...details,
      generatedBytes,
      outputFile: pelicanOnly ? 'pelican-output.html' : 'combined-pelican-output.html',
      prefix: content.slice(0, 1500),
      ...(details.firstTokenMs !== undefined && details.ms > details.firstTokenMs
        ? {
            generatedBytesPerSecond: Math.round(
              (generatedBytes * 1000) / (details.ms - details.firstTokenMs),
            ),
          }
        : {}),
    }
    const checkpoint = async () => {
      await mkdir(evidence, { recursive: true })
      await writeFile(
        new URL(pelicanOnly ? './pelican-output.html' : './combined-pelican-output.html', evidence),
        content,
      )
      await saveReport()
    }
    checkpoints = checkpoints.then(checkpoint, checkpoint)
    if (details.ms - lastPelicanLog >= 5000 || details.status !== 'running') {
      lastPelicanLog = details.ms
      console.log(
        JSON.stringify({
          pelican: details.status,
          ms: details.ms,
          generatedBytes,
          latestProgress: details.progress.at(-1),
        }),
      )
    }
    return checkpoints
  })

  const response = await page.goto('http://127.0.0.1:4178/joking-ai/scripts/inference-smoke.html')
  assert.equal(response.headers()['cross-origin-opener-policy'], undefined)
  assert.equal(response.headers()['cross-origin-embedder-policy'], undefined)
  await page.waitForFunction(() => !!window.inference)
  assert.equal(await page.evaluate(() => crossOriginIsolated), false)
  assert.equal(
    requests.some((url) => /\.gguf(?:\?|$)|\.wasm(?:\?|$)/.test(url)),
    false,
    'No weights/WASM before first call',
  )
  report.browser = await browser.version()
  report.modelConfiguration = await page.evaluate(() => window.inference.models)

  if (upstreamOnly) {
    const responses = []
    const responseTasks = []
    page.on('response', (response) => {
      if (!/huggingface\.co|xethub\.hf\.co|hf\.co/.test(response.url())) return
      responseTasks.push(
        response.allHeaders().then((headers) => {
          responses.push({
            status: response.status(),
            // Signed query parameters expire; the pinned source URL is recorded below.
            url: response.url().split('?')[0],
            allowOrigin: headers['access-control-allow-origin'],
            exposedHeaders: headers['access-control-expose-headers'],
            contentLength: headers['content-length'],
            contentRange: headers['content-range'],
          })
        }),
      )
    })
    report.upstream = await page.evaluate(async () => {
      const url = window.inference.models['pelican-pro'].url
      const started = performance.now()
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 20_000)
      try {
        // A single Range is CORS-safelisted. Even if ignored, read only the
        // first stream chunk and cancel rather than downloading 168 MB again.
        const response = await fetch(url, {
          mode: 'cors',
          headers: { Range: 'bytes=0-3' },
          signal: controller.signal,
        })
        const reader = response.body?.getReader()
        const chunk = await reader?.read()
        const prefix = Array.from(chunk?.value?.slice(0, 4) || [])
        await reader?.cancel()
        return {
          ok: response.ok && String.fromCharCode(...prefix) === 'GGUF',
          source: url,
          origin: location.origin,
          status: response.status,
          responseType: response.type,
          finalUrl: response.url.split('?')[0],
          ms: Math.round(performance.now() - started),
          prefix,
          contentLength: response.headers.get('content-length'),
          contentRange: response.headers.get('content-range'),
          scope: 'Only CORS access and GGUF prefix checked, not a full remote download/hash',
        }
      } catch (error) {
        return {
          ok: false,
          source: url,
          origin: location.origin,
          ms: Math.round(performance.now() - started),
          name: error.name,
          message: error.message,
        }
      } finally {
        clearTimeout(timer)
      }
    })
    await Promise.all(responseTasks)
    report.upstream.responses = responses
    await saveReport()
    assert.equal(report.upstream.ok, true, 'The pinned upstream must allow a browser CORS GET')
    console.log(JSON.stringify(report.upstream))
  }

  for (const modelId of pelicanOnly || upstreamOnly
    ? []
    : ['random-number', 'teapot-gpt', 'random-number']) {
    const run = await page.evaluate(async (modelId) => {
      const progress = []
      const snapshots = []
      const started = performance.now()
      const result = await window.inference.generateLocalInference({
        modelId,
        // The trailing number is an intentional regression test for premature EOS.
        prompt: '请给我一个随机数100',
        signal: new AbortController().signal,
        onProgress: (message) => progress.push(message),
        onToken: (text) => snapshots.push(text),
      })
      const ms = Math.round(performance.now() - started)
      document.querySelector('#result').textContent +=
        `\n${modelId} (${ms} ms)\n${result.content}\n`
      return { modelId, ms, ...result, progress, snapshots }
    }, modelId)
    if (modelId === 'random-number') assert.match(run.content.trim(), /^(?:100|[1-9]?\d)$/)
    else
      assert.equal(run.content, "418 · I'm a teapot.\n我是本站手写权重的小茶壶，只负责拒绝煮咖啡。")
    assert.equal(run.incomplete, undefined)
    assert.equal(run.snapshots.at(-1), run.content)
    report.results.push(run)
    await saveReport()
    console.log(JSON.stringify(run))
  }
  if (!pelicanOnly && !upstreamOnly)
    await page.screenshot({
      path: fileURLToPath(new URL('./real-forward-pass.png', evidence)),
      fullPage: true,
    })

  if (!pelicanOnly && !upstreamOnly) {
    // Stop during an actual pending download; the following fresh model must work.
    await page.evaluate(() => window.inference.disposeLocalInference())
    await page.route('**/models/random-num100-Q4_K_M.gguf', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 3000))
      await route.continue().catch(() => {})
    })
    // A different query-free origin gets an empty OPFS, so the slow route really runs.
    await page.goto('http://localhost:4178/joking-ai/scripts/inference-smoke.html')
    await page.waitForFunction(() => !!window.inference)
    const cancelled = await page.evaluate(async () => {
      const controller = new AbortController()
      const started = performance.now()
      const operation = window.inference.generateLocalInference({
        modelId: 'random-number',
        prompt: '1',
        signal: controller.signal,
      })
      setTimeout(() => controller.abort(), 250)
      try {
        await operation
        return { name: 'unexpected success' }
      } catch (error) {
        return { name: error.name, ms: Math.round(performance.now() - started) }
      }
    })
    assert.equal(cancelled.name, 'AbortError')
    assert.ok(cancelled.ms < 2000)
    report.cancellation = cancelled
    await page.unroute('**/models/random-num100-Q4_K_M.gguf')
    const recovered = await page.evaluate(async () =>
      window.inference.generateLocalInference({
        modelId: 'teapot-gpt',
        prompt: '咖啡',
        signal: new AbortController().signal,
      }),
    )
    assert.match(recovered.content, /^418/)
    report.recovery = recovered
    await saveReport()
  }

  if (includePelican) {
    const pelicanBudgetMs = Number(process.env.PELICAN_SMOKE_MS || 90_000)
    assert.ok(
      Number.isFinite(pelicanBudgetMs) && pelicanBudgetMs >= 5_000 && pelicanBudgetMs <= 600_000,
      'PELICAN_SMOKE_MS must be between 5000 and 600000; this smoke is deliberately bounded',
    )
    report.pelicanBudgetMs = pelicanBudgetMs
    const pelican = await page.evaluate(async (budgetMs) => {
      const controller = new AbortController()
      const progress = []
      const started = performance.now()
      let firstTokenMs
      let content = ''
      let streamUpdates = 0
      let lastCheckpoint = -Infinity
      const snapshot = (status = 'running') => ({
        status,
        content,
        ms: Math.round(performance.now() - started),
        firstTokenMs,
        streamUpdates,
        generatedCharacters: content.length,
        progress,
      })
      const timer = setTimeout(() => controller.abort(), budgetMs)
      try {
        const result = await window.inference.generateLocalInference({
          modelId: 'pelican-pro',
          prompt: '生成鹈鹕骑自行车的html',
          signal: controller.signal,
          onProgress: (text) => {
            progress.push({ ms: Math.round(performance.now() - started), text })
            void window.recordPelican(snapshot())
          },
          onToken: (text) => {
            firstTokenMs ??= Math.round(performance.now() - started)
            content = text
            streamUpdates++
            if (performance.now() - lastCheckpoint >= 1000) {
              lastCheckpoint = performance.now()
              void window.recordPelican(snapshot())
            }
          },
        })
        return { ...snapshot(result.incomplete ? 'incomplete' : 'complete'), ...result }
      } catch (error) {
        return { ...snapshot(error.name), message: error.message, incomplete: true }
      } finally {
        clearTimeout(timer)
      }
    }, pelicanBudgetMs)
    await page.evaluate((pelican) => window.recordPelican(pelican), pelican)
    assert.ok(pelican.content.length > 0, 'Pelican must emit actual generated content')
    assert.match(
      pelican.content,
      /<(?:!doctype|html|svg|body)\b/i,
      'Pelican prefix must contain HTML or SVG',
    )
    assert.ok(
      ['complete', 'incomplete', 'AbortError'].includes(pelican.status),
      `Unexpected pelican failure: ${pelican.status}`,
    )
    assert.ok(pelican.ms <= pelicanBudgetMs + 2500, 'Bounded generation must stop promptly')
    report.pelicanModelFinished = pelican.status === 'complete'
    if (pelican.status === 'AbortError') {
      report.pelicanCancellation = {
        name: pelican.status,
        msAfterDeadline: pelican.ms - pelicanBudgetMs,
        partialOutputRetained: true,
      }
      const recovered = await page.evaluate(async () =>
        window.inference.generateLocalInference({
          modelId: 'teapot-gpt',
          prompt: '取消鹈鹕后恢复真实模型',
          signal: new AbortController().signal,
        }),
      )
      assert.match(recovered.content, /^418/)
      report.pelicanRecovery = recovered
    }
    await page.locator('#result').evaluate(
      (element, text) => {
        element.textContent += text
      },
      `\nPelican (${pelican.ms} ms; ${pelican.status})\n${pelican.content.slice(0, 4000)}`,
    )
    await page.screenshot({
      path: fileURLToPath(
        new URL(
          pelicanOnly ? './pelican-forward-pass.png' : './combined-pelican-forward-pass.png',
          evidence,
        ),
      ),
      fullPage: true,
    })
    console.log(JSON.stringify(report.pelican))
  }
  assert.deepEqual(errors, [])
  const wrongRootResources = requests.filter((url) =>
    /^http:\/\/(?:127\.0\.0\.1|localhost):4178\/(?:assets|models)\//.test(url),
  )
  assert.deepEqual(wrongRootResources, [], 'All local assets must retain /joking-ai/')
  report.requests = requests
  report.errors = errors
  report.ok = true
} catch (error) {
  report.ok = false
  report.error = String(error.stack || error)
  if (report.pelican?.status === 'running') {
    report.pelican = { ...report.pelican, status: 'interrupted', incomplete: true }
  }
  console.error(error)
  process.exitCode = 1
} finally {
  await checkpoints
  await saveReport()
  await page?.evaluate(() => window.inference?.disposeLocalInference()).catch(() => {})
  await browser?.close()
  if (server)
    await new Promise((resolve) => {
      server.httpServer.close(resolve)
      server.httpServer.closeAllConnections()
    })
  console.log(`Inference report: ${fileURLToPath(reportFile)}`)
}
