import {
  DEFAULT_MODEL_ID,
  DEFAULT_REASONING_ID,
  findModel,
  getModel,
  getReasoning,
} from '../config/models'
import type { ChatSnapshot, Conversation, Message, SimulationStage } from '../types'

export const STORAGE_KEY = 'joking-ai.chats.v1'
export const MAX_CONVERSATIONS = 50
export const MAX_MESSAGES = 100
// A complete Pelican HTML response can be far larger than a chat paragraph.
export const MAX_SAVED_CONTENT_LENGTH = 2_000_000

export function emptySnapshot(): ChatSnapshot {
  return {
    version: 1,
    conversations: [],
    activeId: null,
    modelId: DEFAULT_MODEL_ID,
    reasoningId: DEFAULT_REASONING_ID,
  }
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

function isStage(value: unknown): value is SimulationStage {
  return (
    isObject(value) &&
    value.simulated === true &&
    ['pelican', 'random', 'teapot'].includes(String(value.kind)) &&
    typeof value.level === 'number' &&
    Number.isInteger(value.level) &&
    value.level >= 1 &&
    value.level <= 6 &&
    Array.isArray(value.steps) &&
    value.steps.length <= 12 &&
    value.steps.every((step) => typeof step === 'string' && step.length <= 4000)
  )
}

function isMessage(value: unknown): value is Message {
  return (
    isObject(value) &&
    typeof value.id === 'string' &&
    (value.role === 'user' || value.role === 'assistant') &&
    typeof value.content === 'string' &&
    value.content.length <= MAX_SAVED_CONTENT_LENGTH &&
    typeof value.createdAt === 'number' &&
    Number.isFinite(value.createdAt) &&
    (value.modelId === undefined || typeof value.modelId === 'string') &&
    (value.reasoningId === undefined || typeof value.reasoningId === 'string') &&
    (value.format === undefined || value.format === 'html' || value.format === 'text') &&
    (value.provider === undefined ||
      value.provider === 'simulation' ||
      value.provider === 'wllama') &&
    (value.incomplete === undefined || typeof value.incomplete === 'boolean') &&
    (value.legacy === undefined || typeof value.legacy === 'boolean') &&
    (value.stage === undefined || isStage(value.stage))
  )
}

function isConversation(value: unknown): value is Conversation {
  return (
    isObject(value) &&
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.createdAt === 'number' &&
    Number.isFinite(value.createdAt) &&
    typeof value.updatedAt === 'number' &&
    Number.isFinite(value.updatedAt) &&
    typeof value.modelId === 'string' &&
    typeof value.reasoningId === 'string' &&
    Array.isArray(value.messages) &&
    value.messages.every(isMessage)
  )
}

export function readSnapshot(storage: Pick<Storage, 'getItem'>): ChatSnapshot {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return emptySnapshot()
    const saved: unknown = JSON.parse(raw)
    if (!isObject(saved) || saved.version !== 1 || !Array.isArray(saved.conversations))
      return emptySnapshot()
    const conversations = saved.conversations
      .filter(isConversation)
      .slice(0, MAX_CONVERSATIONS)
      .map((chat) => {
        const modelId = getModel(chat.modelId).id
        return {
          ...chat,
          modelId,
          reasoningId: getReasoning(chat.reasoningId, modelId).id,
          messages: chat.messages.slice(-MAX_MESSAGES).map((message) => {
            if (message.role === 'user') return message
            const historicalModelId = message.modelId ?? chat.modelId
            if (message.legacy || !findModel(historicalModelId)) {
              // Preserve old text and attribution; never impersonate a replacement model.
              const { stage: _stage, reasoningId: _reasoning, ...history } = message
              return {
                ...history,
                modelId: historicalModelId,
                format: 'text' as const,
                legacy: true,
              }
            }
            return {
              ...message,
              modelId: historicalModelId,
              reasoningId: getReasoning(message.reasoningId ?? '', historicalModelId).id,
            }
          }),
        }
      })
    const modelId = getModel(typeof saved.modelId === 'string' ? saved.modelId : '').id
    return {
      version: 1,
      conversations,
      activeId:
        typeof saved.activeId === 'string' &&
        conversations.some((chat) => chat.id === saved.activeId)
          ? saved.activeId
          : null,
      modelId,
      reasoningId: getReasoning(
        typeof saved.reasoningId === 'string' ? saved.reasoningId : '',
        modelId,
      ).id,
    }
  } catch {
    return emptySnapshot()
  }
}

export function writeSnapshot(storage: Pick<Storage, 'setItem'>, snapshot: ChatSnapshot): boolean {
  try {
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...snapshot,
        conversations: snapshot.conversations.slice(0, MAX_CONVERSATIONS).map((chat) => ({
          ...chat,
          messages: chat.messages.slice(-MAX_MESSAGES),
        })),
      }),
    )
    return true
  } catch {
    return false
  }
}
