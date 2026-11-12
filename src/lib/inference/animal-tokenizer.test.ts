import { describe, expect, it } from 'vitest'
import { AnimalTokenizer } from './animal-tokenizer'
import { ANIMAL_MODELS, animalAssetUrl, isAnimalModelId } from './animal-models'

describe('animal tokenizer', () => {
  const tokenizer = new AnimalTokenizer({
    added_tokens: [{ id: 0, content: '<eos>', special: true }],
    model: {
      vocab: { '<eos>': 0, h: 1, i: 2, hi: 3, Ġ: 4, Ġhi: 5 },
      merges: [
        ['h', 'i'],
        ['Ġ', 'hi'],
      ],
    },
  })
  it('applies ranked BPE, ByteLevel spaces and special token boundaries', () => {
    expect(tokenizer.encode('hi hi<eos>')).toEqual([3, 5, 0])
    expect(tokenizer.decode([3, 5, 0])).toBe('hi hi')
  })
  it('does not silently discard unknown bytes', () => {
    expect(() => tokenizer.encode('你好')).toThrow('词表不支持')
  })
})
describe('animal model assets', () => {
  it('accepts only the two explicit IDs', () => {
    expect(isAnimalModelId('guppy')).toBe(true)
    expect(isAnimalModelId('miso')).toBe(true)
    expect(isAnimalModelId('toString')).toBe(false)
    expect(isAnimalModelId('__proto__')).toBe(false)
  })
  it('pins model revisions and keeps generation inside context', () => {
    for (const id of ['guppy', 'miso'] as const) {
      const model = ANIMAL_MODELS[id]
      expect(model.revision).toMatch(/^[a-f0-9]{40}$/)
      expect(model.sha256).toMatch(/^[a-f0-9]{64}$/)
      expect(model.tokenizerSha256).toMatch(/^[a-f0-9]{64}$/)
      expect(model.maxPromptTokens + model.maxNewTokens).toBeLessThanOrEqual(model.context)
      expect(animalAssetUrl(id, 'model.onnx')).toContain(`/resolve/${model.revision}/model.onnx`)
    }
  })
})
