import type { RawCompletionChunk, Wllama as WllamaType } from '@wllama/wllama/esm/index'
import wasmUrl from '@wllama/wllama/esm/wasm/wllama.wasm?url'
import compatWasmUrl from '@wllama/wllama-compat/wasm/wllama.wasm?url'
import compatWorkerCode from '@wllama/wllama-compat/wasm/wllama.js?raw'
import { getCompletionPlan, INFERENCE_MODELS, isInferenceModelId } from './models'
import type { WorkerRequest, WorkerResponse } from './protocol'

// Terminating this dedicated worker also terminates wllama's nested WASM worker,
// even during native model initialization (which has no AbortSignal API).
const scope = globalThis as unknown as {
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null
  postMessage: (message: WorkerResponse) => void
  location: Location
}
let instance: WllamaType | undefined
let loadedModel: string | undefined
let busy = false

scope.onmessage = async ({ data: request }) => {
  const { id, modelId, prompt } = request
  const send = (message: WorkerResponse) => scope.postMessage(message)
  const progress = (message: string) => send({ id, kind: 'progress', message })
  if (busy) {
    send({ id, kind: 'error', message: '模型正在处理另一条请求。' })
    return
  }
  busy = true
  try {
    if (!isInferenceModelId(modelId)) throw new Error('没有此模型的 GGUF 权重。')
    const model = INFERENCE_MODELS[modelId]
    if (!instance || loadedModel !== modelId) {
      await instance?.exit()
      loadedModel = undefined
      progress('正在加载本地推理引擎（CPU 单线程）…')
      // The SDK is intentionally imported only inside the on-demand worker.
      const { Wllama } = await import('@wllama/wllama/esm/index.js')
      instance = new Wllama({ default: wasmUrl }, { suppressNativeLog: true })
      instance.setCompat(
        { wasm: compatWasmUrl, worker: { code: compatWorkerCode } },
        'firefox_safari',
      )
      const url = new URL(model.url, scope.location.origin).href
      let lastPercent = -1
      const options = {
        n_threads: 1,
        n_gpu_layers: 0,
        n_parallel: 1,
        n_ctx: model.nCtx,
        n_batch: 128,
        n_ubatch: 128,
        ctx_shift: false,
        warmup: false,
        // This 16-layer, 16-KV-head model otherwise needs 2 GiB of f16 KV at
        // 32K context. q8_0 stores 32 values plus one f16 scale per 34-byte block:
        // 1,140,850,688 bytes for both K and V, before weights/runtime overhead.
        ...(modelId === 'pelican-pro'
          ? { cache_type_k: 'q8_0' as const, cache_type_v: 'q8_0' as const, flash_attn: true }
          : {}),
        // A fixed BOS template also protects these input-independent toy models
        // if a future caller switches to the chat-completion API.
        ...(modelId !== 'pelican-pro' ? { chat_template: '{{ bos_token }}' } : {}),
        progressCallback: ({ loaded, total }: { loaded: number; total: number }) => {
          const percent = total > 0 ? Math.floor((loaded / total) * 100) : -1
          if (percent !== lastPercent) {
            lastPercent = percent
            const mb = (loaded / 1_000_000).toFixed(1)
            progress(
              total > 0 ? `正在下载 GGUF：${percent}%（${mb} MB）…` : `正在下载 GGUF：${mb} MB…`,
            )
          }
        },
      }
      progress(
        modelId === 'pelican-pro'
          ? '正在下载或读取鹈鹕权重（约 168 MB）；32K 上下文的 Q8 KV 缓存另需约 1.06 GiB…'
          : '正在读取微型 GGUF 权重…',
      )
      // wllama verifies cached file size and deletes partial failed downloads.
      // It caches in OPFS (with an IndexedDB fallback), independent of localStorage.
      await instance.loadModelFromUrl(url, options)
      if (instance.isMultithread() || instance.getNumThreads() !== 1) {
        throw new Error('未能启用要求的 CPU 单线程模式。')
      }
      loadedModel = modelId
    }
    progress(
      modelId === 'pelican-pro'
        ? '权重已就绪；专用模型使用固定短提示触发 HTML，忽略输入内容以预留更多输出空间。生成可能较久，可随时停止…'
        : '权重已就绪，正在执行真实模型前向推理…',
    )
    let content = ''
    let finishReason: string | null = null
    let chunks = 0
    let lastUpdate = 0
    await instance.createCompletion({
      ...getCompletionPlan(modelId, prompt),
      stream: true,
      return_progress: true,
      onData: (chunk: RawCompletionChunk) => {
        if (chunk.prompt_progress) progress('正在计算输入 token…')
        if (modelId === 'pelican-pro' && chunk.usage && chunk.timings) {
          progress(
            `本轮模型输出 ${chunk.usage.completion_tokens} token，推理速度 ${chunk.timings.predicted_per_second.toFixed(1)} token/s。`,
          )
        }
        for (const choice of chunk.choices) {
          if (choice.text) {
            content += choice.text
            chunks++
            const now = performance.now()
            if (now - lastUpdate >= 60) {
              lastUpdate = now
              send({ id, kind: 'token', content })
            }
            if (modelId === 'pelican-pro' && chunks % 256 === 0) {
              progress(`正在生成鹈鹕 HTML（已收到 ${chunks} 个文本片段）…`)
            }
          }
          if (choice.finish_reason) finishReason = choice.finish_reason
        }
      },
    })
    send({ id, kind: 'token', content })
    if (!content.trim()) throw new Error('模型没有生成内容，请重试；不会改用模拟回复。')
    if (modelId === 'random-number' && !/^(?:100|[1-9]?\d)$/.test(content.trim())) {
      throw new Error('随机数 GGUF 返回了无效输出，请重试。')
    }
    const incomplete =
      finishReason !== 'stop' || (modelId === 'pelican-pro' && !/<\/html\s*>/i.test(content))
    send({
      id,
      kind: 'result',
      result: {
        content,
        format: model.format,
        ...(incomplete ? { incomplete: true } : {}),
      },
    })
  } catch (error) {
    await instance?.exit().catch(() => {})
    instance = undefined
    loadedModel = undefined
    const detail = error instanceof Error ? error.message : String(error)
    send({
      id,
      kind: 'error',
      message: `本地 GGUF 推理失败：${detail}。请检查网络、浏览器存储与可用内存后重试。`,
    })
  } finally {
    busy = false
  }
}
