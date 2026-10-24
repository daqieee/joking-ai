import { disposeLocalInference, generateLocalInference } from '../src/lib/inference'
import { INFERENCE_MODELS } from '../src/lib/inference/models'

Object.assign(window, {
  inference: { generateLocalInference, disposeLocalInference, models: INFERENCE_MODELS },
})
