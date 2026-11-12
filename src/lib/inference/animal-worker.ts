import { InferenceSession, Tensor, env } from 'onnxruntime-web/wasm'
import wasmUrl from '../../../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm?url'
import wasmModuleUrl from '../../../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.mjs?url'
import { ANIMAL_MODELS, animalAssetUrl, isAnimalModelId } from './animal-models'
import { AnimalTokenizer } from './animal-tokenizer'
import type { WorkerRequest, WorkerResponse } from './protocol'

env.wasm.numThreads = 1
env.wasm.proxy = false
env.wasm.wasmPaths = { wasm: wasmUrl, mjs: wasmModuleUrl }
let loaded: { id: string; session: InferenceSession; tokenizer: AnimalTokenizer } | undefined
const send = (message: WorkerResponse) => self.postMessage(message)
async function download(url: string, expectedHash: string): Promise<Uint8Array> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`模型下载失败（HTTP ${response.status}），请检查网络后重试。`)
  const bytes = await response.arrayBuffer()
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('')
  if (hash !== expectedHash) throw new Error('模型文件校验失败，请清理浏览器缓存后重试。')
  return new Uint8Array(bytes)
}
function sample(logits: Float32Array, temperature: number, topK: number): number {
  const ranked = Array.from(logits, (score, id) => ({ score, id }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
  const weights = ranked.map((t) => Math.exp((t.score - ranked[0].score) / temperature))
  let target = Math.random() * weights.reduce((sum, w) => sum + w, 0)
  for (let i = 0; i < weights.length; i++) {
    target -= weights[i]
    if (target <= 0) return ranked[i].id
  }
  return ranked[0].id
}
self.onmessage = async ({ data }: MessageEvent<WorkerRequest>) => {
  const { id, modelId, prompt } = data
  try {
    if (!isAnimalModelId(modelId)) throw new Error('未知动物模型。')
    const config = ANIMAL_MODELS[modelId]
    if (!loaded || loaded.id !== modelId) {
      send({
        id,
        kind: 'progress',
        message: `正在下载真实 ${modelId === 'guppy' ? 'Guppy' : 'Miso'} ONNX 权重（约 ${(config.bytes / 1e6).toFixed(1)} MB）…`,
      })
      const [model, tokenizerData, external] = await Promise.all([
        download(animalAssetUrl(modelId, 'model.onnx'), config.sha256),
        download(animalAssetUrl(modelId, 'tokenizer.json'), config.tokenizerSha256),
        config.externalData
          ? download(animalAssetUrl(modelId, 'model.onnx.data'), config.externalDataSha256)
          : undefined,
      ])
      send({ id, kind: 'progress', message: '正在初始化浏览器 CPU / WASM 单线程推理…' })
      const session = await InferenceSession.create(model, {
        executionProviders: ['wasm'],
        externalData: external ? [{ path: 'model.onnx.data', data: external }] : undefined,
      })
      loaded = {
        id: modelId,
        session,
        tokenizer: new AnimalTokenizer(JSON.parse(new TextDecoder().decode(tokenizerData))),
      }
    }
    const { tokenizer, session } = loaded
    const ids =
      modelId === 'guppy'
        ? [
            1,
            ...tokenizer.encode(`user\n${prompt.trim()}`),
            2,
            ...tokenizer.encode('\n'),
            1,
            ...tokenizer.encode('assistant\n'),
          ]
        : [1, 3, ...tokenizer.encode(prompt.trim().toLowerCase()), 4]
    if (ids.length > config.maxPromptTokens)
      throw new Error(
        `输入过长：本模型单轮最多 ${config.maxPromptTokens} 个词元（含格式标记）。请缩短为一两句英文后重试。`,
      )
    const generated: number[] = []
    let ended = false
    send({ id, kind: 'progress', message: '正在本机运行真实神经网络，生成英文角色回复…' })
    for (let step = 0; step < config.maxNewTokens && ids.length < config.context; step++) {
      const input = new Tensor('int64', BigInt64Array.from(ids, BigInt), [1, ids.length])
      const outputs = await session.run({ input_ids: input })
      const logits = outputs.logits
      const vocab = logits.dims[logits.dims.length - 1]
      const scores = (logits.data as Float32Array).slice(-vocab)
      const next = sample(scores, modelId === 'guppy' ? 0.7 : 0.8, modelId === 'guppy' ? 50 : 40)
      input.dispose()
      Object.values(outputs).forEach((tensor) => tensor.dispose())
      if (next === 2 || next === 1 || (modelId === 'miso' && (next === 3 || next === 4))) {
        ended = true
        break
      }
      ids.push(next)
      generated.push(next)
      send({ id, kind: 'token', content: tokenizer.decode(generated).trim() })
    }
    const content = tokenizer.decode(generated).trim()
    if (!content) throw new Error('模型未生成可显示的文字，请换一句简短英文重试。')
    send({ id, kind: 'result', result: { content, format: 'text', incomplete: !ended } })
  } catch (error) {
    send({ id, kind: 'error', message: error instanceof Error ? error.message : String(error) })
  }
}
