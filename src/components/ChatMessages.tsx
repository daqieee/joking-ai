import { Check, Copy, History, RotateCw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { findModel, getModel, getReasoning } from '../config/models'
import type { GenerationFailure, Message, PendingReply } from '../types'
import { ModelMark } from './Brand'
import HtmlPreview from './HtmlPreview'
import SimulationStage from './SimulationStage'

interface Props {
  messages: Message[]
  pending: PendingReply | null
  failure: GenerationFailure | null
  onRetry: () => void
  onToast: (message: string) => void
}

export default function ChatMessages({ messages, pending, failure, onRetry, onToast }: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const end = useRef<HTMLDivElement>(null)
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    end.current?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
      block: 'end',
    })
  }, [messages.length, pending?.content, pending?.progress, pending?.stage?.steps.length, failure])
  useEffect(
    () => () => {
      if (copyTimer.current !== null) clearTimeout(copyTimer.current)
    },
    [],
  )

  async function copy(message: Message) {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopiedId(message.id)
      if (copyTimer.current !== null) clearTimeout(copyTimer.current)
      copyTimer.current = setTimeout(() => setCopiedId(null), 2200)
    } catch {
      onToast('未能自动复制，请展开源码或选中文字手动复制。')
    }
  }

  return (
    <div
      className="chat-messages"
      role="log"
      aria-label="聊天记录"
      aria-relevant="additions text"
      aria-live="polite"
    >
      <div className="conversation-start">
        <span />
        一场不太正经的对话，从这里开始
        <span />
      </div>
      {messages.map((message) => {
        if (message.role === 'user')
          return (
            <article className="message user-message" key={message.id} aria-label="你的消息">
              <div className="user-message-content">{message.content}</div>
              <span className="message-avatar" aria-hidden="true">
                J
              </span>
            </article>
          )
        const model = message.legacy ? undefined : findModel(message.modelId ?? '')
        const legacy = !model
        const name = model?.name ?? '已移除模型'
        const isHtml = !legacy && message.format === 'html'
        return (
          <article
            className={`message assistant-message${legacy ? ' legacy-message' : ''}`}
            key={message.id}
            aria-label={`${name}的回复`}
          >
            {model ? (
              <ModelMark model={model} />
            ) : (
              <span className="model-mark legacy-mark" aria-hidden="true">
                <History size={20} />
              </span>
            )}
            <div className="assistant-message-body">
              <div className="message-byline">
                <strong>{name}</strong>
                <span className="message-mode">
                  {legacy ? '旧版模拟' : getReasoning(message.reasoningId ?? '', model.id).name}
                </span>
                <span className={`mock-label${message.provider === 'wllama' ? ' real-label' : ''}`}>
                  {legacy ? '历史记录' : message.provider === 'wllama' ? 'GGUF · 本地推理' : 'MOCK'}
                </span>
              </div>
              {!legacy && message.stage && <SimulationStage stage={message.stage} />}
              {message.incomplete && (
                <p className="incomplete-label">生成未完成 · 已保留收到的内容</p>
              )}
              {isHtml ? (
                <HtmlPreview content={message.content} preset={message.provider === 'simulation'} />
              ) : (
                <div className="message-text">
                  {message.content.split('\n\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              )}
              <div className="message-actions">
                <button
                  className="copy-button"
                  onClick={() => void copy(message)}
                  aria-label={isHtml ? '复制 HTML 源码' : '复制回复'}
                >
                  {copiedId === message.id ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedId === message.id ? '已复制' : isHtml ? '复制源码' : '复制'}</span>
                </button>
                <span>
                  {legacy
                    ? '保留的旧记录'
                    : message.provider === 'wllama'
                      ? '浏览器内真实 GGUF 推理'
                      : '本地预设 · 娱乐演出'}
                </span>
              </div>
            </div>
          </article>
        )
      })}
      {pending && (
        <article
          className="message assistant-message pending-message"
          role="status"
          aria-label="正在生成回复"
        >
          <ModelMark model={getModel(pending.modelId)} />
          <div className="assistant-message-body">
            <div className="message-byline">
              <strong>{getModel(pending.modelId).name}</strong>
              <span className="message-mode">
                {getReasoning(pending.reasoningId, pending.modelId).name}
              </span>
              <span className={`mock-label${pending.reasoningId === 'real' ? ' real-label' : ''}`}>
                {pending.reasoningId === 'real' ? 'GGUF · 本地推理' : 'MOCK'}
              </span>
            </div>
            {pending.stage ? (
              <SimulationStage stage={pending.stage} active />
            ) : (
              <div className="thinking">
                <span className="thinking-dots" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                <span>{pending.progress}</span>
              </div>
            )}
            {pending.content && (
              <div className="stream-result">
                <span>正在生成 · 仅显示最近收到的内容</span>
                <pre className="stream-preview" aria-live="off">
                  {pending.content}
                </pre>
              </div>
            )}
          </div>
        </article>
      )}
      {failure && (
        <div className="generation-error" role="alert">
          <strong>生成失败</strong>
          <p>{failure.message}</p>
          <button onClick={onRetry}>
            <RotateCw size={14} />
            重试生成
          </button>
        </div>
      )}
      <div className="messages-end" ref={end} />
    </div>
  )
}
