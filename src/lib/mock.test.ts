import { describe, expect, it } from 'vitest'
import { DEFAULT_MODEL_ID, getReasoningLevels, MODELS } from '../config/models'
import {
  generateMockResponse,
  PELICAN_PRESET,
  secureRandomNumber,
  summarizeTopic,
  TEAPOT_PRESET,
} from './mock'

const names = [
  ['瘦', '中', '肥', '很肥', '特别肥', '超级无敌肥', '拟真'],
  ['随机', '很随机', '极其随机', '绝对随机', '量子随机', '命运的骰子', '拟真'],
  ['温水', '微沸', '沸腾', '高压', '锅炉超频', '宇宙茶道', '拟真'],
]

describe('three model local simulation', () => {
  it('exposes only the three models with exactly seven model-specific levels', () => {
    expect(MODELS.map((model) => model.id)).toEqual(['pelican-pro', 'random-number', 'teapot-gpt'])
    expect(DEFAULT_MODEL_ID).toBe('pelican-pro')
    MODELS.forEach((model, index) =>
      expect(getReasoningLevels(model.id).map((level) => level.name)).toEqual(names[index]),
    )
  })

  it('gives all eighteen local combinations an explicitly simulated process', () => {
    for (const model of MODELS) {
      const steps = []
      for (const [index, level] of getReasoningLevels(model.id).slice(0, 6).entries()) {
        const reply = generateMockResponse('随便一条消息', model.id, level.id)
        expect(reply.provider).toBe('simulation')
        expect(reply.stage).toMatchObject({
          simulated: true,
          kind: model.theatre,
          level: index + 1,
        })
        expect(reply.stage!.steps.length).toBeGreaterThan(0)
        steps.push(reply.stage!.steps.join('\n'))
      }
      expect(new Set(steps).size).toBe(6)
    }
  })

  it('returns the same real static HTML file for every simulated pelican prompt and level', () => {
    for (const level of getReasoningLevels('pelican-pro').slice(0, 6)) {
      for (const input of ['你好', '<img src=x onerror=alert(1)>', '不同输入与档位不改变预设']) {
        expect(generateMockResponse(input, 'pelican-pro', level.id)).toMatchObject({
          content: PELICAN_PRESET,
          format: 'html',
        })
      }
    }
    expect(PELICAN_PRESET).toContain('<!doctype html>')
    expect(PELICAN_PRESET).not.toContain('${')
  })

  it('keeps every random final body to a single integer with process metadata separate', () => {
    for (const level of getReasoningLevels('random-number').slice(0, 6)) {
      const reply = generateMockResponse('给我幸运数字并附上解释', 'random-number', level.id)
      expect(reply.content).toMatch(/^(?:100|[1-9]?\d)$/)
      expect(reply.format).toBe('text')
      expect(reply.stage?.steps.length).toBeGreaterThan(0)
    }
  })

  it('rejects the biased tail and allows both inclusive boundaries', () => {
    const limit = Math.floor(0x100000000 / 101) * 101
    let calls = 0
    expect(
      secureRandomNumber((values) => {
        values[0] = [0xffffffff, limit, 100][calls++]
      }),
    ).toBe(100)
    expect(calls).toBe(3)
    expect(
      secureRandomNumber((values) => {
        values[0] = 0
      }),
    ).toBe(0)
  })

  it('returns a fixed local 418 preset at every simulated tea temperature', () => {
    for (const level of getReasoningLevels('teapot-gpt').slice(0, 6)) {
      expect(generateMockResponse('任意输入', 'teapot-gpt', level.id).content).toBe(TEAPOT_PRESET)
    }
    expect(TEAPOT_PRESET).toContain('418')
  })

  it('rejects empty prompts and never fakes seventh-level inference', () => {
    expect(() => generateMockResponse('  \n', 'pelican-pro', 'low')).toThrow('请先输入')
    for (const model of MODELS)
      expect(() => generateMockResponse('你好', model.id, 'real')).toThrow('真实 GGUF')
  })

  it('preserves Unicode when summarizing conversation titles', () => {
    expect(summarizeTopic('  你好\n 世界  ')).toBe('你好 世界')
    expect(summarizeTopic('🐦'.repeat(45))).toBe(`${'🐦'.repeat(44)}…`)
  })
})
