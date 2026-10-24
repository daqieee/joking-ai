import { useEffect, useRef, useState } from 'react'
import { getModel, getReasoning } from '../config/models'
import { MAX_MESSAGE_LENGTH } from '../lib/mock'
import { generateReply } from '../lib/providers'
import {
  emptySnapshot,
  MAX_CONVERSATIONS,
  MAX_MESSAGES,
  readSnapshot,
  writeSnapshot,
} from '../lib/storage'
import type {
  Conversation,
  GenerationFailure,
  Message,
  PendingReply,
  ReasoningId,
  ReplyResult,
} from '../types'

function loadInitialState() {
  try {
    return readSnapshot(window.localStorage)
  } catch {
    return emptySnapshot()
  }
}

interface GenerationRun {
  conversationId: string
  modelId: string
  reasoningId: ReasoningId
  prompt: string
  controller: AbortController
  content: string
  paint: ReturnType<typeof setTimeout> | null
}

export function useChat() {
  const [snapshot, setSnapshot] = useState(loadInitialState)
  const [pending, setPending] = useState<PendingReply | null>(null)
  const [generationError, setGenerationError] = useState<GenerationFailure | null>(null)
  const [storageError, setStorageError] = useState(false)
  const run = useRef<GenerationRun | null>(null)
  const active = snapshot.conversations.find((chat) => chat.id === snapshot.activeId)

  useEffect(() => {
    try {
      setStorageError(!writeSnapshot(window.localStorage, snapshot))
    } catch {
      setStorageError(true)
    }
  }, [snapshot])

  useEffect(
    () => () => {
      const current = run.current
      run.current = null
      if (current?.paint) clearTimeout(current.paint)
      current?.controller.abort()
    },
    [],
  )

  function appendReply(current: GenerationRun, result: ReplyResult) {
    const reply: Message = {
      ...result,
      id: crypto.randomUUID(),
      role: 'assistant',
      createdAt: Date.now(),
      modelId: current.modelId,
      reasoningId: current.reasoningId,
    }
    setSnapshot((state) => ({
      ...state,
      conversations: state.conversations.map((chat) =>
        chat.id === current.conversationId
          ? {
              ...chat,
              messages: [...chat.messages, reply].slice(-MAX_MESSAGES),
              updatedAt: reply.createdAt,
            }
          : chat,
      ),
    }))
  }

  function preservePartial(current: GenerationRun) {
    if (!current.content) return
    appendReply(current, {
      content: current.content,
      format: current.modelId === 'pelican-pro' ? 'html' : 'text',
      provider: 'wllama',
      incomplete: true,
    })
  }

  function stop() {
    const current = run.current
    // Invalidate before aborting: stale progress, completion and errors cannot enter another chat.
    run.current = null
    if (current) {
      if (current.paint) clearTimeout(current.paint)
      current.controller.abort()
      preservePartial(current)
    }
    setPending(null)
  }

  function start(
    conversationId: string,
    prompt: string,
    modelId: string,
    reasoningId: ReasoningId,
  ) {
    const current: GenerationRun = {
      conversationId,
      prompt,
      modelId,
      reasoningId,
      controller: new AbortController(),
      content: '',
      paint: null,
    }
    run.current = current
    setGenerationError(null)
    setPending({ conversationId, modelId, reasoningId, progress: '正在准备回复', content: '' })
    const isCurrent = () => run.current === current && !current.controller.signal.aborted
    void generateReply({
      modelId,
      reasoningId,
      prompt,
      signal: current.controller.signal,
      onProgress: (progress) => {
        if (isCurrent()) setPending((value) => (value ? { ...value, progress } : value))
      },
      onStage: (stage) => {
        if (isCurrent()) setPending((value) => (value ? { ...value, stage } : value))
      },
      onToken: (content) => {
        if (!isCurrent()) return
        current.content = content
        // Keep the full stream for completion/Stop, but paint only a short tail at most 10 times/s.
        if (current.paint === null)
          current.paint = setTimeout(() => {
            current.paint = null
            if (isCurrent())
              setPending((value) =>
                value ? { ...value, content: current.content.slice(-2400) } : value,
              )
          }, 100)
      },
    })
      .then((result) => {
        if (!isCurrent()) return
        if (current.paint) clearTimeout(current.paint)
        run.current = null
        appendReply(current, result)
        setPending(null)
      })
      .catch((error: unknown) => {
        if (!isCurrent()) return
        if (current.paint) clearTimeout(current.paint)
        run.current = null
        preservePartial(current)
        setPending(null)
        // Abort is an ordinary stop, never a simulated success or a model failure.
        if (error instanceof Error && error.name === 'AbortError') return
        setGenerationError({
          conversationId,
          modelId,
          reasoningId,
          prompt,
          message: error instanceof Error ? error.message : '本地模型运行失败，请重试。',
        })
      })
  }

  function send(input: string): boolean {
    const text = input.trim()
    if (
      !text ||
      input.length > MAX_MESSAGE_LENGTH ||
      run.current ||
      (active?.messages.length ?? 0) >= MAX_MESSAGES - 1
    )
      return false
    const createdAt = Date.now()
    const conversationId = active?.id ?? crypto.randomUUID()
    const { modelId } = snapshot
    const reasoningId = getReasoning(snapshot.reasoningId, modelId).id
    const message: Message = { id: crypto.randomUUID(), role: 'user', content: text, createdAt }
    setSnapshot((state) => {
      const existing = state.conversations.find((chat) => chat.id === conversationId)
      const conversation: Conversation = existing
        ? {
            ...existing,
            messages: [...existing.messages, message],
            updatedAt: createdAt,
            modelId,
            reasoningId,
          }
        : {
            id: conversationId,
            title: Array.from(text.replace(/\s+/g, ' ')).slice(0, 22).join(''),
            createdAt,
            updatedAt: createdAt,
            modelId,
            reasoningId,
            messages: [message],
          }
      return {
        ...state,
        activeId: conversationId,
        conversations: [
          conversation,
          ...state.conversations.filter((chat) => chat.id !== conversationId),
        ].slice(0, MAX_CONVERSATIONS),
      }
    })
    start(conversationId, text, modelId, reasoningId)
    return true
  }

  function retry(): boolean {
    if (
      !generationError ||
      run.current ||
      active?.id !== generationError.conversationId ||
      active.messages.length >= MAX_MESSAGES
    )
      return false
    const { conversationId, prompt, modelId, reasoningId } = generationError
    start(conversationId, prompt, modelId, reasoningId)
    return true
  }

  function newChat() {
    stop()
    setGenerationError(null)
    setSnapshot((state) => ({ ...state, activeId: null }))
  }

  function openChat(id: string) {
    const conversation = snapshot.conversations.find((chat) => chat.id === id)
    if (!conversation || id === snapshot.activeId) return
    stop()
    setGenerationError(null)
    setSnapshot((state) => ({
      ...state,
      activeId: id,
      modelId: conversation.modelId,
      reasoningId: conversation.reasoningId,
    }))
  }

  function deleteChat(id: string) {
    if (id === snapshot.activeId) {
      stop()
      setGenerationError(null)
    }
    setSnapshot((state) => ({
      ...state,
      activeId: state.activeId === id ? null : state.activeId,
      conversations: state.conversations.filter((chat) => chat.id !== id),
    }))
  }

  function selectModel(id: string) {
    const modelId = getModel(id).id
    if (modelId === snapshot.modelId) return
    stop()
    setGenerationError(null)
    setSnapshot((state) => {
      const reasoningId = getReasoning(state.reasoningId, modelId).id
      return {
        ...state,
        modelId,
        reasoningId,
        conversations: state.conversations.map((chat) =>
          chat.id === state.activeId ? { ...chat, modelId, reasoningId } : chat,
        ),
      }
    })
  }

  function selectReasoning(id: ReasoningId) {
    const reasoningId = getReasoning(id, snapshot.modelId).id
    if (reasoningId === snapshot.reasoningId) return
    stop()
    setGenerationError(null)
    setSnapshot((state) => ({
      ...state,
      reasoningId,
      conversations: state.conversations.map((chat) =>
        chat.id === state.activeId ? { ...chat, reasoningId } : chat,
      ),
    }))
  }

  return {
    snapshot,
    active,
    pending,
    generationError,
    storageError,
    send,
    retry,
    stop,
    newChat,
    openChat,
    deleteChat,
    selectModel,
    selectReasoning,
  }
}
