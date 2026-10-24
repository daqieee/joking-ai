import { Bird, Dices, Coffee } from 'lucide-react'
import type { ModelDefinition } from '../types'

export function BrandMark({ small = false }: { small?: boolean }) {
  return (
    <span className={`brand-mark${small ? ' small' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 40 40" fill="none">
        <path
          d="M13 14v9a7 7 0 0 0 14 0v-9"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <circle cx="13" cy="10" r="1.9" fill="currentColor" />
        <circle cx="27" cy="10" r="1.9" fill="currentColor" />
      </svg>
    </span>
  )
}

const icons = { bird: Bird, dice: Dices, teapot: Coffee }

export function ModelMark({ model, small = false }: { model: ModelDefinition; small?: boolean }) {
  const Icon = icons[model.icon]
  return (
    <span className={`model-mark ${model.tone}${small ? ' small' : ''}`} aria-hidden="true">
      <Icon size={small ? 15 : 20} strokeWidth={1.7} />
    </span>
  )
}
