import { MAX_MESSAGE_LENGTH } from '../../src/lib/mock'
import { generateReply } from '../../src/lib/providers'
import type { ReplyRequest } from '../../src/lib/providers'
import type { ReasoningId, SimulationStage } from '../../src/types'
import './style.css'

type DemoMode = Extract<ReasoningId, 'medium' | 'real'>

interface Run {
  mode: DemoMode
  controller: AbortController
  content: string
  tokenUpdates: number
}

function element<T extends HTMLElement>(id: string): T {
  const found = document.getElementById(id)
  if (!found) throw new Error('缺少示例页面元素：' + id)
  return found as T
}

const prompt = element<HTMLTextAreaElement>('prompt')
const mockButton = element<HTMLButtonElement>('mock')
const realButton = element<HTMLButtonElement>('real')
const stopButton = element<HTMLButtonElement>('stop')
const status = element('status')
const progress = element('progress')
const stageMeta = element('stage-meta')
const steps = element<HTMLOListElement>('steps')
const streamMeta = element('stream-meta')
const output = element('output')
const resultMeta = element('result-meta')
let active: Run | null = null

function setBusy(busy: boolean) {
  mockButton.disabled = busy
  realButton.disabled = busy
  stopButton.disabled = !busy
  prompt.readOnly = busy
}

function renderStage(stage: SimulationStage) {
  stageMeta.textContent = '模拟演出 · 非真实推理 / kind=' + stage.kind + ' / level=' + stage.level
  // Each callback contains ALL steps so far. Replace the list; do not append it.
  steps.replaceChildren(
    ...stage.steps.map((text) => {
      const item = document.createElement('li')
      item.textContent = text
      return item
    }),
  )
}

async function send(mode: DemoMode) {
  if (active) return
  const input = prompt.value
  const text = input.trim()
  if (!text || input.length > MAX_MESSAGE_LENGTH) {
    status.textContent = '输入无效'
    progress.textContent = '请输入 1～4000 个 UTF-16 码元，不能只有空白。'
    return
  }

  // An aborted signal cannot be reused. Every Send owns a new controller.
  const current: Run = { mode, controller: new AbortController(), content: '', tokenUpdates: 0 }
  active = current
  const isCurrent = () => active === current && !current.controller.signal.aborted
  setBusy(true)
  status.textContent = mode === 'real' ? '拟真运行中' : '模拟运行中'
  progress.textContent = '正在准备请求…'
  steps.replaceChildren()
  stageMeta.textContent = '尚未收到阶段。只有模拟路径会调用 onStage。'
  streamMeta.textContent = '尚未收到 onToken；模拟路径会直接返回最终结果。'
  output.textContent = '等待回复…'
  resultMeta.textContent = '尚未返回 ReplyResult。'

  const request: ReplyRequest = {
    modelId: 'teapot-gpt',
    reasoningId: mode,
    prompt: text,
    signal: current.controller.signal,
    onProgress(message) {
      if (isCurrent()) progress.textContent = message
    },
    onStage(stage) {
      if (!isCurrent()) return
      renderStage(stage)
      progress.textContent = '模拟演出：已收到 ' + stage.steps.length + ' 个累计阶段。'
    },
    onToken(text) {
      if (!isCurrent()) return
      // onToken is the cumulative text, NOT the next token. Never use += here.
      current.content = text
      current.tokenUpdates++
      output.textContent = text
      streamMeta.textContent =
        'onToken 回调 ' + current.tokenUpdates + ' 次 / 累计正文 ' + text.length + ' 个 UTF-16 码元'
    },
  }

  try {
    const result = await generateReply(request)
    if (!isCurrent()) return
    current.content = result.content
    output.textContent = result.content
    if (result.stage) renderStage(result.stage)
    status.textContent = result.incomplete ? '已结束 · 输出未完成' : '已完成'
    progress.textContent =
      result.provider === 'wllama' ? '真实 GGUF 推理已返回。' : '模拟阶段结束，已返回预设结果。'
    resultMeta.textContent =
      'provider=' +
      result.provider +
      ' / format=' +
      result.format +
      ' / incomplete=' +
      Boolean(result.incomplete)
  } catch (error: unknown) {
    if (!isCurrent()) return
    // The API rejects on abort; it does not return a ReplyResult for Stop.
    const aborted = error instanceof Error && error.name === 'AbortError'
    status.textContent = aborted ? '已停止' : '生成失败'
    progress.textContent = error instanceof Error ? error.message : String(error)
    output.textContent = current.content || '本轮尚未收到正文。'
    resultMeta.textContent = current.content
      ? '未完成：保留最后一次 onToken 正文；本轮没有 ReplyResult。'
      : '本轮没有 ReplyResult。可以再次发送。'
  } finally {
    // An old completion/error must not unlock or overwrite a newer request.
    if (active === current) {
      active = null
      setBusy(false)
    }
  }
}

function stop() {
  const current = active
  if (!current) return
  // Invalidate first, so queued callbacks and the old catch cannot change the UI.
  active = null
  current.controller.abort()
  setBusy(false)
  status.textContent = '已停止'
  progress.textContent = '本轮请求已取消。可以立即再次发送。'
  output.textContent = current.content || '本轮尚未收到正文。'
  resultMeta.textContent = current.content
    ? '未完成：保留最后一次 onToken 正文；AbortError 不会返回 ReplyResult。'
    : '本轮没有 ReplyResult。' + (current.mode === 'real' ? '拟真没有改用模拟回复。' : '')
}

mockButton.addEventListener('click', () => void send('medium'))
realButton.addEventListener('click', () => void send('real'))
stopButton.addEventListener('click', stop)
window.addEventListener('pagehide', stop)
