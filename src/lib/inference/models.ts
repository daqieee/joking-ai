export const PELICAN_REVISION = '6981d554c08a3727d960c9dbbd345af887f643e9'
export const PELICAN_BYTES = 167_846_208
export const PELICAN_URL = `https://huggingface.co/0v0ai/0u0-pelican-pro-0.2B-GGUF/resolve/${PELICAN_REVISION}/0u0-pelican-pro-v2-Q4_K_M.gguf`

const base = import.meta.env.BASE_URL

export const INFERENCE_MODELS = {
  'random-number': {
    url: `${base}models/random-num100-Q4_K_M.gguf`,
    bytes: 425_888,
    nCtx: 512,
    maxTokens: 8,
    format: 'text',
  },
  'teapot-gpt': {
    url: `${base}models/joking-teapot-v1-f32.gguf`,
    bytes: 102_016,
    nCtx: 512,
    maxTokens: 16,
    format: 'text',
  },
  'pelican-pro': {
    url: PELICAN_URL,
    bytes: PELICAN_BYTES,
    // Experimental inference ceiling, above the GGUF's 16,384 training context.
    // A real prefix/cancellation smoke does not validate all 32K positions.
    nCtx: 32_768,
    // Reserve a generous output budget. The upstream card's 28,472-token figure
    // describes its older page model, not a measurement of this pinned v2 file.
    maxTokens: 30_000,
    format: 'html',
  },
} as const

export type InferenceModelId = keyof typeof INFERENCE_MODELS

export function isInferenceModelId(modelId: string): modelId is InferenceModelId {
  return Object.hasOwn(INFERENCE_MODELS, modelId)
}

export function getCompletionPlan(modelId: InferenceModelId, _prompt: string) {
  const shared = {
    max_tokens: INFERENCE_MODELS[modelId].maxTokens,
    top_p: 1,
    min_p: 0,
    penalty_repeat: 1,
    penalty_freq: 0,
    penalty_present: 0,
    presence_penalty: 0,
    frequency_penalty: 0,
  }
  return modelId === 'pelican-pro'
    ? {
        ...shared,
        // This specialised model does not answer arbitrary input. A short fixed
        // trigger reserves the full output budget even for a 4000-char user input.
        // The runtime announces this explicitly in its progress message.
        prompt: '<|user|>\n生成鹈鹕骑自行车的html\n<|assistant|>\n',
        temperature: 0,
        top_k: 0,
      }
    : {
        ...shared,
        // Both toy models are input-independent. A constant BOS avoids treating
        // a numeric prompt suffix as an already-generated answer and emitting EOS.
        prompt: '<s>',
        temperature: modelId === 'random-number' ? 1 : 0,
        top_k: modelId === 'random-number' ? 101 : 0,
      }
}
