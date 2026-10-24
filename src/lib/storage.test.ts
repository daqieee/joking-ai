import { describe, expect, it } from 'vitest'
import {
  emptySnapshot,
  MAX_CONVERSATIONS,
  MAX_MESSAGES,
  readSnapshot,
  STORAGE_KEY,
  writeSnapshot,
} from './storage'
import type { Conversation } from '../types'

function memoryStorage(initial: string | null = null) {
  let value = initial
  return {
    getItem: () => value,
    setItem: (_key: string, next: string) => {
      value = next
    },
  }
}
function conversation(id = 'chat-1'): Conversation {
  return {
    id,
    title: '鹈鹕出发',
    createdAt: 1,
    updatedAt: 2,
    modelId: 'pelican-pro',
    reasoningId: 'high',
    messages: [{ id: 'msg-1', role: 'user', content: '你好', createdAt: 1 }],
  }
}

describe('browser conversation persistence', () => {
  it('round-trips selected model, mode and long HTML without truncating', () => {
    const storage = memoryStorage()
    const chat = conversation()
    chat.messages.push({
      id: 'answer',
      role: 'assistant',
      createdAt: 2,
      content: '<html>' + '鹈'.repeat(70_000) + '</html>',
      modelId: 'pelican-pro',
      reasoningId: 'real',
      format: 'html',
      provider: 'wllama',
      incomplete: true,
    })
    const snapshot = {
      ...emptySnapshot(),
      conversations: [chat],
      activeId: 'chat-1',
      modelId: 'pelican-pro',
      reasoningId: 'real' as const,
    }
    expect(writeSnapshot(storage, snapshot)).toBe(true)
    expect(readSnapshot(storage)).toEqual(snapshot)
    expect(STORAGE_KEY).toBe('joking-ai.chats.v1')
  })

  it('round-trips simulation process metadata outside numeric content', () => {
    const chat = conversation()
    chat.messages.push({
      id: 'answer',
      role: 'assistant',
      createdAt: 2,
      content: '100',
      modelId: 'random-number',
      reasoningId: 'absurd',
      format: 'text',
      provider: 'simulation',
      stage: { simulated: true, kind: 'random', level: 6, steps: ['模拟命运推演'] },
    })
    const snapshot = { ...emptySnapshot(), conversations: [chat] }
    const storage = memoryStorage()
    writeSnapshot(storage, snapshot)
    expect(readSnapshot(storage)).toEqual(snapshot)
  })

  it('recovers from corrupt data, incompatible versions and denied reads', () => {
    for (const raw of ['not json', 'null', '{}', '{"version":2,"conversations":[]}'])
      expect(readSnapshot(memoryStorage(raw))).toEqual(emptySnapshot())
    expect(
      readSnapshot({
        getItem: () => {
          throw new Error('access denied')
        },
      }),
    ).toEqual(emptySnapshot())
  })

  it('keeps valid chats while rejecting malformed messages and missing active chats', () => {
    const raw = {
      ...emptySnapshot(),
      activeId: 'missing',
      conversations: [
        conversation(),
        { ...conversation('invalid'), messages: [{ id: 1, content: {} }] },
      ],
    }
    const restored = readSnapshot(memoryStorage(JSON.stringify(raw)))
    expect(restored.conversations).toHaveLength(1)
    expect(restored.activeId).toBeNull()
  })

  it('keeps removed-model text as legacy history without assigning it to a new model', () => {
    const chat = {
      ...conversation(),
      modelId: 'removed-model',
      reasoningId: 'high',
      messages: [
        {
          id: 'old-answer',
          role: 'assistant',
          createdAt: 2,
          content: '<script>旧文字也应仅作为文本</script>',
          modelId: 'removed-model',
          reasoningId: 'high',
          format: 'html',
        },
      ],
    }
    const raw = {
      ...emptySnapshot(),
      modelId: 'removed-model',
      reasoningId: 'removed-level',
      conversations: [chat],
    }
    const restored = readSnapshot(memoryStorage(JSON.stringify(raw)))
    expect(restored.modelId).toBe(emptySnapshot().modelId)
    expect(restored.conversations[0].modelId).toBe('pelican-pro')
    expect(restored.conversations[0].messages[0]).toMatchObject({
      legacy: true,
      modelId: 'removed-model',
      format: 'text',
      content: chat.messages[0].content,
    })
    expect(restored.conversations[0].messages[0].reasoningId).toBeUndefined()
    const storage = memoryStorage()
    writeSnapshot(storage, restored)
    expect(readSnapshot(storage)).toEqual(restored)
  })

  it('attributes old messages without explicit model ids using their original conversation', () => {
    const chat = {
      ...conversation(),
      modelId: 'removed-model',
      messages: [{ id: 'old-answer', role: 'assistant', createdAt: 2, content: '历史回复' }],
    }
    const restored = readSnapshot(
      memoryStorage(JSON.stringify({ ...emptySnapshot(), conversations: [chat] })),
    )
    expect(restored.conversations[0].messages[0]).toMatchObject({
      legacy: true,
      modelId: 'removed-model',
    })
  })

  it('bounds saved conversations and messages, reports quota failures', () => {
    const storage = memoryStorage()
    const chat = conversation()
    chat.messages = Array.from({ length: 120 }, (_, index) => ({
      ...chat.messages[0],
      id: String(index),
    }))
    const snapshot = {
      ...emptySnapshot(),
      conversations: Array.from({ length: 70 }, (_, index) => ({ ...chat, id: String(index) })),
    }
    writeSnapshot(storage, snapshot)
    const restored = readSnapshot(storage)
    expect(restored.conversations).toHaveLength(MAX_CONVERSATIONS)
    expect(restored.conversations[0].messages).toHaveLength(MAX_MESSAGES)
    expect(
      writeSnapshot(
        {
          setItem: () => {
            throw new Error('quota exceeded')
          },
        },
        snapshot,
      ),
    ).toBe(false)
  })
})
