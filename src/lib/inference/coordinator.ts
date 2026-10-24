import type { InferenceRequest, InferenceResult, WorkerRequest, WorkerResponse } from './protocol'

export interface InferenceWorker {
  postMessage(message: WorkerRequest): void
  terminate(): void
  onmessage: ((event: MessageEvent<WorkerResponse>) => void) | null
  onerror: ((event: ErrorEvent) => void) | null
  onmessageerror: ((event: MessageEvent) => void) | null
}

export function abortError() {
  return new DOMException('已停止本地模型生成', 'AbortError')
}

/** One active model / one request at a time. Each task owns its cleanup. */
export class InferenceCoordinator {
  private queue: Promise<void> = Promise.resolve()
  private nextId = 0
  private session?: { worker: InferenceWorker; modelId: string }
  private idleTimer?: ReturnType<typeof setTimeout>
  private readonly cancellations = new Set<() => void>()

  constructor(private readonly createWorker: () => InferenceWorker) {}

  generate(request: InferenceRequest): Promise<InferenceResult> {
    const { signal } = request
    if (signal.aborted) return Promise.reject(abortError())
    const id = ++this.nextId
    let ownedSession: typeof this.session
    let settled = false
    let resolveTask: (result: InferenceResult) => void
    let rejectTask: (error: Error) => void
    const result = new Promise<InferenceResult>((resolve, reject) => {
      resolveTask = resolve
      rejectTask = reject
    })
    // A caller may abort while still waiting behind another request.
    const finish = (value: InferenceResult | Error) => {
      if (settled) return
      settled = true
      this.cancellations.delete(onAbort)
      signal.removeEventListener('abort', onAbort)
      if (value instanceof Error || value instanceof DOMException) rejectTask(value)
      else resolveTask(value)
    }
    const discard = () => {
      if (!ownedSession) return
      ownedSession.worker.onmessage = null
      ownedSession.worker.onerror = null
      ownedSession.worker.onmessageerror = null
      ownedSession.worker.terminate()
      if (this.session === ownedSession) this.session = undefined
    }
    const onAbort = () => {
      // Never touch a worker borrowed by a newer request.
      discard()
      finish(abortError())
    }
    signal.addEventListener('abort', onAbort, { once: true })
    this.cancellations.add(onAbort)
    if (signal.aborted) onAbort()

    const run = async () => {
      if (settled) return
      if (this.idleTimer) clearTimeout(this.idleTimer)
      try {
        if (this.session?.modelId !== request.modelId) this.releaseSession()
        this.session ??= { worker: this.createWorker(), modelId: request.modelId }
        ownedSession = this.session
        const worker = ownedSession.worker
        worker.onmessage = ({ data }) => {
          if (settled || signal.aborted || data.id !== id) return
          try {
            if (data.kind === 'progress') request.onProgress?.(data.message)
            else if (data.kind === 'token') request.onToken?.(data.content)
            else if (data.kind === 'result') finish(data.result)
            else {
              discard()
              finish(new Error(data.message))
            }
          } catch (error) {
            discard()
            finish(error instanceof Error ? error : new Error(String(error)))
          }
        }
        worker.onerror = (event) => {
          discard()
          finish(
            new Error(event.message || '浏览器无法运行本地模型 Worker，请重试或换用新版浏览器。'),
          )
        }
        worker.onmessageerror = () => {
          discard()
          finish(new Error('本地模型 Worker 通信失败，请重试。'))
        }
        request.onProgress?.('正在准备浏览器内的真实 GGUF 推理…')
        if (signal.aborted || settled) return
        worker.postMessage({ id, modelId: request.modelId, prompt: request.prompt })
        await result.catch(() => {})
      } catch (error) {
        discard()
        finish(error instanceof Error ? error : new Error(String(error)))
      } finally {
        if (ownedSession && this.session === ownedSession) {
          ownedSession.worker.onmessage = null
          ownedSession.worker.onerror = null
          ownedSession.worker.onmessageerror = null
          // Retain the model briefly for follow-up prompts, release large KV/weights
          // after inactivity. A subsequent queued task cancels this timer.
          this.idleTimer = setTimeout(() => this.releaseSession(), 60_000)
        }
      }
    }
    this.queue = this.queue.then(run, run)
    return result
  }

  dispose() {
    for (const cancel of [...this.cancellations]) cancel()
    this.releaseSession()
  }

  private releaseSession() {
    if (this.idleTimer) clearTimeout(this.idleTimer)
    this.idleTimer = undefined
    this.session?.worker.terminate()
    this.session = undefined
  }
}
