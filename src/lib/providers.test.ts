import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getReasoningLevels, MODELS } from '../config/models'
import { generateLocalInference } from './inference'
import { generateReply } from './providers'
import type { SimulationStage } from '../types'

vi.mock('./inference', () => ({ generateLocalInference: vi.fn() }))

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

describe('local provider dispatch', () => {
  it('plays all eighteen simulated processes without invoking inference', async () => {
    for (const model of MODELS) {
      for (const level of getReasoningLevels(model.id).slice(0, 6)) {
        const stages: SimulationStage[] = []
        const response = generateReply({
          modelId: model.id,
          reasoningId: level.id,
          prompt: '测试演出',
          signal: new AbortController().signal,
          onStage: (stage) => stages.push(stage),
        })
        await vi.runAllTimersAsync()
        const result = await response
        expect(stages.length).toBe(result.stage!.steps.length)
        expect(stages.map((stage) => stage.steps.length)).toEqual(
          stages.map((_stage, index) => index + 1),
        )
        expect(stages.at(-1)).toEqual(result.stage)
      }
    }
    expect(generateLocalInference).not.toHaveBeenCalled()
  })

  it('cancels a simulated process before its final answer and can generate again', async () => {
    const controller = new AbortController()
    const onStage = vi.fn()
    const first = generateReply({
      modelId: 'pelican-pro',
      reasoningId: 'absurd',
      prompt: '先停止',
      signal: controller.signal,
      onStage,
    })
    const rejected = expect(first).rejects.toMatchObject({ name: 'AbortError' })
    controller.abort()
    await rejected
    await vi.runAllTimersAsync()
    expect(onStage).toHaveBeenCalledTimes(1)
    const retry = generateReply({
      modelId: 'pelican-pro',
      reasoningId: 'low',
      prompt: '再试一次',
      signal: new AbortController().signal,
    })
    await vi.runAllTimersAsync()
    expect((await retry).provider).toBe('simulation')
  })

  it('calls the actual inference entry only in seventh level, and exposes failures', async () => {
    const failure = new Error('GGUF 下载失败')
    vi.mocked(generateLocalInference).mockRejectedValueOnce(failure)
    await expect(
      generateReply({
        modelId: 'teapot-gpt',
        reasoningId: 'real',
        prompt: '咖啡',
        signal: new AbortController().signal,
      }),
    ).rejects.toBe(failure)
    expect(generateLocalInference).toHaveBeenCalledTimes(1)
    expect(generateLocalInference).toHaveBeenCalledWith(
      expect.objectContaining({ modelId: 'teapot-gpt', prompt: '咖啡' }),
    )
  })

  it('never begins inference for a request already cancelled', async () => {
    const controller = new AbortController()
    controller.abort()
    await expect(
      generateReply({
        modelId: 'random-number',
        reasoningId: 'real',
        prompt: '数字',
        signal: controller.signal,
      }),
    ).rejects.toMatchObject({ name: 'AbortError' })
    expect(generateLocalInference).not.toHaveBeenCalled()
  })
})
