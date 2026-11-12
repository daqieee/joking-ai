import { InferenceCoordinator } from './coordinator'
import type { InferenceRequest } from './protocol'

import { isAnimalModelId } from './animal-models'
export * from './animal-models'

let coordinator: InferenceCoordinator | undefined
export function generateAnimalInference(request: InferenceRequest) {
  if (!isAnimalModelId(request.modelId)) throw new Error('未知动物模型。')
  coordinator ??= new InferenceCoordinator(
    () => new Worker(new URL('./animal-worker.ts', import.meta.url), { type: 'module' }),
  )
  return coordinator.generate(request)
}
export function disposeAnimalInference() {
  coordinator?.dispose()
  coordinator = undefined
}
