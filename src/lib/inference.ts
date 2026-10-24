import { InferenceCoordinator } from './inference/coordinator'
import { isInferenceModelId } from './inference/models'
import type { InferenceRequest, InferenceResult } from './inference/protocol'

export type { InferenceRequest, InferenceResult } from './inference/protocol'

let coordinator: InferenceCoordinator | undefined

/** Only called by the seventh (拟真) level; earlier levels never create this worker. */
export async function generateLocalInference(request: InferenceRequest): Promise<InferenceResult> {
  if (!isInferenceModelId(request.modelId)) throw new Error('此模型没有可用的本地 GGUF 权重。')
  if (request.signal.aborted) throw new DOMException('已停止本地模型生成', 'AbortError')
  if (typeof Worker === 'undefined' || typeof WebAssembly === 'undefined') {
    throw new Error('此浏览器不支持 Worker / WebAssembly，请使用新版浏览器运行拟真档。')
  }
  coordinator ??= new InferenceCoordinator(
    () => new Worker(new URL('./inference/worker.ts', import.meta.url), { type: 'module' }),
  )
  return coordinator.generate(request)
}

/** Exposed for app teardown and reproducible browser smoke tests. */
export function disposeLocalInference() {
  coordinator?.dispose()
  coordinator = undefined
}
