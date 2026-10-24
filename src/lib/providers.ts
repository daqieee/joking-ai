import { getModel, getReasoning } from '../config/models'
import type { ReasoningId, ReplyResult, SimulationStage } from '../types'
import { generateMockResponse } from './mock'

export interface ReplyRequest {
  modelId: string
  reasoningId: ReasoningId
  prompt: string
  signal: AbortSignal
  onProgress?: (message: string) => void
  onStage?: (stage: SimulationStage) => void
  onToken?: (text: string) => void
}

function throwIfAborted(signal: AbortSignal) {
  if (signal.aborted) throw new DOMException('已停止生成', 'AbortError')
}

function pause(duration: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    throwIfAborted(signal)
    const abort = () => {
      clearTimeout(timer)
      reject(new DOMException('已停止生成', 'AbortError'))
    }
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', abort)
      resolve()
    }, duration)
    signal.addEventListener('abort', abort, { once: true })
  })
}

export async function generateReply(request: ReplyRequest): Promise<ReplyResult> {
  const { modelId, reasoningId, prompt, signal, onProgress, onStage, onToken } = request
  throwIfAborted(signal)
  const model = getModel(modelId)
  const level = getReasoning(reasoningId, model.id)
  if (level.id === 'real' && model.localModel) {
    onProgress?.(`准备浏览器本地推理 · ${model.localModel.size} GGUF，首次发送需要下载`)
    // The runtime is deferred until Send, never on selecting a model or level.
    const { generateLocalInference } = await import('./inference')
    throwIfAborted(signal)
    const result = await generateLocalInference({
      modelId: model.id,
      prompt,
      signal,
      onProgress,
      onToken,
    })
    throwIfAborted(signal)
    return { ...result, provider: 'wllama' }
  }
  const result = generateMockResponse(prompt, model.id, level.id)
  if (result.stage) {
    const steps = result.stage.steps
    for (let index = 0; index < steps.length; index++) {
      throwIfAborted(signal)
      onStage?.({ ...result.stage, steps: steps.slice(0, index + 1) })
      await pause(level.delay / steps.length, signal)
    }
  } else {
    onProgress?.(model.thinking)
    await pause(level.delay, signal)
  }
  throwIfAborted(signal)
  return result
}
