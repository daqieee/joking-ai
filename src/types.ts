export type ReasoningId = 'low' | 'medium' | 'high' | 'extra' | 'extreme' | 'absurd' | 'real'
export type ModelIcon = 'bird' | 'dice' | 'teapot'
export type ModelTone = 'sage' | 'peach' | 'lavender'
export type TheatreKind = 'pelican' | 'random' | 'teapot'

export interface ReasoningLevel {
  id: ReasoningId
  name: string
  description: string
  detail: string
  points: number
  delay: number
}

export interface ModelDefinition {
  id: string
  name: string
  version: string
  subtitle: string
  description: string
  tag: string
  icon: ModelIcon
  tone: ModelTone
  thinking: string
  theatre: TheatreKind
  localModel: {
    size: string
    provenance: string
    description: string
  }
}

// This is authored stage dialogue, never a model's private reasoning.
export interface SimulationStage {
  simulated: true
  kind: TheatreKind
  level: number
  steps: string[]
}

export interface ReplyResult {
  content: string
  format: 'text' | 'html'
  provider: 'simulation' | 'wllama'
  stage?: SimulationStage
  incomplete?: boolean
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: number
  modelId?: string
  reasoningId?: ReasoningId
  format?: 'text' | 'html'
  provider?: 'simulation' | 'wllama'
  stage?: SimulationStage
  incomplete?: boolean
  legacy?: boolean
}

export interface PendingReply {
  conversationId: string
  modelId: string
  reasoningId: ReasoningId
  progress: string
  content: string
  stage?: SimulationStage
}

export interface GenerationFailure {
  conversationId: string
  modelId: string
  reasoningId: ReasoningId
  prompt: string
  message: string
}

export interface Conversation {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  modelId: string
  reasoningId: ReasoningId
  messages: Message[]
}

export interface ChatSnapshot {
  version: 1
  conversations: Conversation[]
  activeId: string | null
  modelId: string
  reasoningId: ReasoningId
}
