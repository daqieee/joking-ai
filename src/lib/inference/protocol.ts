export interface InferenceRequest {
  modelId: string
  prompt: string
  signal: AbortSignal
  onProgress?: (message: string) => void
  /** The cumulative generated text, never just the latest token. */
  onToken?: (text: string) => void
}

export interface InferenceResult {
  content: string
  format: 'text' | 'html'
  incomplete?: boolean
}

export interface WorkerRequest {
  id: number
  modelId: string
  prompt: string
}

export type WorkerResponse =
  | { id: number; kind: 'progress'; message: string }
  | { id: number; kind: 'token'; content: string }
  | { id: number; kind: 'result'; result: InferenceResult }
  | { id: number; kind: 'error'; message: string }
