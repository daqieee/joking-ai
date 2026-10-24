import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { InferenceCoordinator, type InferenceWorker } from './inference/coordinator'
import { getCompletionPlan, INFERENCE_MODELS } from './inference/models'
import type { InferenceRequest, WorkerRequest, WorkerResponse } from './inference/protocol'

class FakeWorker implements InferenceWorker {
  onmessage: InferenceWorker['onmessage'] = null
  onerror: InferenceWorker['onerror'] = null
  onmessageerror: InferenceWorker['onmessageerror'] = null
  postMessage = vi.fn<(request: WorkerRequest) => void>()
  terminate = vi.fn<() => void>()

  respond(response: Omit<Extract<WorkerResponse, { kind: 'result' }>, 'id'>) {
    const request = this.postMessage.mock.calls.at(-1)?.[0]
    if (!request) throw new Error('Worker has no active request')
    this.onmessage?.({ data: { id: request.id, ...response } } as MessageEvent<WorkerResponse>)
  }
}

const flushQueue = async () => {
  for (let turn = 0; turn < 8; turn++) await Promise.resolve()
}

describe('inference request ownership', () => {
  let coordinator: InferenceCoordinator
  let workers: FakeWorker[]
  const request = (overrides: Partial<InferenceRequest> = {}): InferenceRequest => ({
    modelId: 'random-number',
    prompt: '请给我一个数字100',
    signal: new AbortController().signal,
    ...overrides,
  })

  beforeEach(() => {
    vi.useFakeTimers()
    workers = []
    coordinator = new InferenceCoordinator(() => {
      const worker = new FakeWorker()
      workers.push(worker)
      return worker
    })
  })

  afterEach(() => {
    coordinator.dispose()
    vi.useRealTimers()
  })

  it('rejects an already aborted request without constructing a Worker', async () => {
    const controller = new AbortController()
    controller.abort()
    await expect(
      coordinator.generate(request({ signal: controller.signal })),
    ).rejects.toMatchObject({
      name: 'AbortError',
    })
    expect(workers).toHaveLength(0)
  })

  it('serializes requests, retains a same-model Worker, and ignores stale tokens', async () => {
    const firstController = new AbortController()
    const first = coordinator.generate(request({ signal: firstController.signal }))
    const onToken = vi.fn()
    const second = coordinator.generate(request({ onToken }))
    await flushQueue()
    expect(workers).toHaveLength(1)
    expect(workers[0].postMessage).toHaveBeenCalledTimes(1)
    const firstId = workers[0].postMessage.mock.calls[0][0].id
    workers[0].respond({ kind: 'result', result: { content: '41', format: 'text' } })
    await expect(first).resolves.toEqual({ content: '41', format: 'text' })
    await flushQueue()
    expect(workers).toHaveLength(1)
    expect(workers[0].postMessage).toHaveBeenCalledTimes(2)
    firstController.abort()
    expect(workers[0].terminate).not.toHaveBeenCalled()
    workers[0].onmessage?.({
      data: { id: firstId, kind: 'token', content: 'stale' },
    } as MessageEvent<WorkerResponse>)
    expect(onToken).not.toHaveBeenCalled()
    workers[0].respond({ kind: 'result', result: { content: '40', format: 'text' } })
    await expect(second).resolves.toEqual({ content: '40', format: 'text' })
  })

  it('cancels a queued request without terminating the active model', async () => {
    const first = coordinator.generate(request())
    const controller = new AbortController()
    const second = coordinator.generate(
      request({ modelId: 'teapot-gpt', signal: controller.signal }),
    )
    const rejected = expect(second).rejects.toMatchObject({ name: 'AbortError' })
    await flushQueue()
    controller.abort()
    await rejected
    expect(workers[0].terminate).not.toHaveBeenCalled()
    workers[0].respond({ kind: 'result', result: { content: '7', format: 'text' } })
    await first
    await flushQueue()
    expect(workers).toHaveLength(1)
    expect(workers[0].postMessage).toHaveBeenCalledTimes(1)
  })

  it('terminates an aborted active task and lets the next model run', async () => {
    const controller = new AbortController()
    const first = coordinator.generate(request({ signal: controller.signal }))
    const rejected = expect(first).rejects.toMatchObject({ name: 'AbortError' })
    const second = coordinator.generate(request({ modelId: 'teapot-gpt' }))
    await flushQueue()
    const staleHandler = workers[0].onmessage
    controller.abort()
    await rejected
    await flushQueue()
    expect(workers[0].terminate).toHaveBeenCalledOnce()
    expect(workers).toHaveLength(2)
    staleHandler?.({
      data: { id: 1, kind: 'result', result: { content: 'old', format: 'text' } },
    } as MessageEvent<WorkerResponse>)
    expect(workers[1].terminate).not.toHaveBeenCalled()
    workers[1].respond({ kind: 'result', result: { content: '418', format: 'text' } })
    await expect(second).resolves.toMatchObject({ content: '418' })
  })

  it('settles every active and queued promise on dispose, then accepts fresh work', async () => {
    const tasks = [
      coordinator.generate(request()),
      coordinator.generate(request({ modelId: 'teapot-gpt' })),
      coordinator.generate(request({ modelId: 'pelican-pro' })),
    ]
    const outcomes = Promise.allSettled(tasks)
    await flushQueue()
    coordinator.dispose()
    expect(await outcomes).toEqual(
      tasks.map(() => ({
        status: 'rejected',
        reason: expect.objectContaining({ name: 'AbortError' }),
      })),
    )
    await flushQueue()
    expect(workers).toHaveLength(1)
    expect(workers[0].terminate).toHaveBeenCalledOnce()
    const fresh = coordinator.generate(request({ modelId: 'teapot-gpt' }))
    await flushQueue()
    expect(workers).toHaveLength(2)
    workers[1].respond({ kind: 'result', result: { content: '418', format: 'text' } })
    await expect(fresh).resolves.toMatchObject({ content: '418' })
  })

  it('releases the previous model before switching and releases idle memory', async () => {
    const first = coordinator.generate(request())
    await flushQueue()
    workers[0].respond({ kind: 'result', result: { content: '8', format: 'text' } })
    await first
    const second = coordinator.generate(request({ modelId: 'teapot-gpt' }))
    await flushQueue()
    expect(workers[0].terminate).toHaveBeenCalledOnce()
    expect(workers).toHaveLength(2)
    workers[1].respond({ kind: 'result', result: { content: '418', format: 'text' } })
    await second
    await flushQueue()
    await vi.advanceTimersByTimeAsync(60_000)
    expect(workers[1].terminate).toHaveBeenCalledOnce()
  })

  it.each(['model', 'worker', 'message'] as const)(
    'can retry after a %s failure',
    async (failure) => {
      const first = coordinator.generate(request())
      const rejected = expect(first).rejects.toThrow()
      await flushQueue()
      const worker = workers[0]
      if (failure === 'model') {
        worker.onmessage?.({
          data: { id: 1, kind: 'error', message: 'download failed' },
        } as MessageEvent<WorkerResponse>)
      } else if (failure === 'worker') {
        worker.onerror?.({ message: 'worker failed' } as ErrorEvent)
      } else {
        worker.onmessageerror?.({} as MessageEvent)
      }
      await rejected
      expect(worker.terminate).toHaveBeenCalledOnce()
      const retry = coordinator.generate(request())
      await flushQueue()
      expect(workers).toHaveLength(2)
      workers[1].respond({ kind: 'result', result: { content: '99', format: 'text' } })
      await expect(retry).resolves.toMatchObject({ content: '99' })
    },
  )
})

describe('completion boundaries', () => {
  it('keeps every random candidate and avoids numeric-suffix EOS', () => {
    expect(getCompletionPlan('random-number', '100')).toMatchObject({
      prompt: '<s>',
      temperature: 1,
      top_k: 101,
      top_p: 1,
      min_p: 0,
      penalty_repeat: 1,
      penalty_freq: 0,
      penalty_present: 0,
    })
  })

  it('reserves the same pelican output budget for a maximum-length input', () => {
    const short = getCompletionPlan('pelican-pro', '鹈鹕')
    expect(getCompletionPlan('pelican-pro', '很'.repeat(4000))).toEqual(short)
    expect(short.prompt.length + short.max_tokens).toBeLessThan(
      INFERENCE_MODELS['pelican-pro'].nCtx,
    )
  })
})
