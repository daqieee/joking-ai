import { ArrowUp, CornerDownLeft, Square } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { MAX_MESSAGE_LENGTH } from '../lib/mock'
import { getModel } from '../config/models'
import type { ReasoningId } from '../types'
import Picker from './Picker'

interface Props {
  modelId: string
  reasoningId: ReasoningId
  pending: boolean
  atLimit: boolean
  draft: string
  onDraft: (value: string) => void
  onSend: (value: string) => boolean
  onStop: () => void
  onModel: (id: string) => void
  onReasoning: (id: ReasoningId) => void
  inputRef: React.RefObject<HTMLTextAreaElement | null>
}

export default function Composer({
  modelId,
  reasoningId,
  pending,
  atLimit,
  draft,
  onDraft,
  onSend,
  onStop,
  onModel,
  onReasoning,
  inputRef,
}: Props) {
  const [picker, setPicker] = useState<'model' | 'reasoning' | null>(null)
  const composing = useRef(false)
  const overLimit = draft.length > MAX_MESSAGE_LENGTH
  const model = getModel(modelId)
  const isReal = reasoningId === 'real' && !!model.localModel

  useEffect(() => {
    const input = inputRef.current
    if (input) {
      input.style.height = '0'
      input.style.height = `${Math.min(input.scrollHeight, 180)}px`
    }
  }, [draft, inputRef])

  function submit() {
    if (pending || overLimit || atLimit) return
    if (onSend(draft)) {
      onDraft('')
      inputRef.current?.focus()
    }
  }

  function keyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing &&
      !composing.current &&
      event.keyCode !== 229
    ) {
      event.preventDefault()
      if (!pending) submit()
    }
  }

  return (
    <div className="composer-area">
      <form
        className={`composer${overLimit ? ' has-error' : ''}`}
        onSubmit={(event) => {
          event.preventDefault()
          if (!pending) submit()
        }}
      >
        <label className="sr-only" htmlFor="message-input">
          消息
        </label>
        <textarea
          id="message-input"
          ref={inputRef}
          value={draft}
          onChange={(event) => onDraft(event.target.value)}
          onKeyDown={keyDown}
          onCompositionStart={() => {
            composing.current = true
          }}
          onCompositionEnd={() => {
            composing.current = false
          }}
          placeholder={
            atLimit ? '这段对话已经够离谱了，开启新对话继续吧' : '说点什么，让生活离谱一点…'
          }
          rows={1}
          disabled={atLimit}
          aria-describedby="composer-hint"
          aria-invalid={overLimit || undefined}
        />
        <div className="composer-toolbar">
          <span className={`composer-hint${overLimit ? ' error' : ''}`} id="composer-hint">
            {overLimit ? (
              `超出 ${MAX_MESSAGE_LENGTH} 字限制`
            ) : draft.length > 3500 ? (
              `${draft.length} / ${MAX_MESSAGE_LENGTH}`
            ) : (
              <>
                <CornerDownLeft size={12} />
                <span>
                  Enter 发送<span className="desktop-hint">，Shift + Enter 换行</span>
                </span>
              </>
            )}
          </span>
          <div className="composer-controls">
            <Picker
              kind="model"
              value={modelId}
              open={picker === 'model'}
              onToggle={() => setPicker((value) => (value === 'model' ? null : 'model'))}
              onClose={() => setPicker(null)}
              onSelect={onModel}
            />
            <span className="control-divider" />
            <Picker
              kind="reasoning"
              value={reasoningId}
              modelId={modelId}
              open={picker === 'reasoning'}
              onToggle={() => setPicker((value) => (value === 'reasoning' ? null : 'reasoning'))}
              onClose={() => setPicker(null)}
              onSelect={(id) => onReasoning(id as ReasoningId)}
            />
            {pending ? (
              <button
                className="send-button stop"
                type="button"
                onClick={onStop}
                aria-label="停止生成"
                title="停止生成"
              >
                <Square size={13} fill="currentColor" />
              </button>
            ) : (
              <button
                className="send-button"
                type="submit"
                disabled={!draft.trim() || overLimit || atLimit}
                aria-label="发送消息"
                title="发送消息"
              >
                <ArrowUp size={20} strokeWidth={2.2} />
              </button>
            )}
          </div>
        </div>
      </form>
      {isReal && model.localModel && (
        <div className="local-model-note" role="note" aria-label="拟真模型下载说明">
          <strong>
            拟真 · {model.localModel.size} · {model.localModel.provenance}
          </strong>
          <span>{model.localModel.description} 选择此档不会自动下载，发送时开始，可随时停止。</span>
        </div>
      )}
      <p className="composer-footnote">
        <span className="footnote-spark">✳</span> 人工智能，天然不正经。
        <span className="footnote-divider">·</span>
        {isReal ? '当前档位使用浏览器本地 GGUF' : '当前回复由本地模拟生成'}
      </p>
    </div>
  )
}
