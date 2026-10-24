import { Check, ChevronDown, SlidersHorizontal } from 'lucide-react'
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { MODELS, getModel, getReasoning, getReasoningLevels } from '../config/models'
import type { ReasoningId } from '../types'
import { ModelMark } from './Brand'

interface Props {
  kind: 'model' | 'reasoning'
  value: string
  modelId?: string
  open: boolean
  onToggle: () => void
  onClose: () => void
  onSelect: (id: string) => void
}

export default function Picker({ kind, value, modelId, open, onToggle, onClose, onSelect }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const id = useId()
  const [position, setPosition] = useState({ left: 12, bottom: 80, width: 304, maxHeight: 400 })
  const isModel = kind === 'model'
  const model = getModel(value)
  const reasoning = getReasoning(value, modelId)
  const levels = getReasoningLevels(modelId)
  const label = isModel ? '选择模型' : '推理强度'

  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const bounds = trigger.current?.getBoundingClientRect()
      if (!bounds) return
      const width = Math.min(320, window.innerWidth - 24)
      setPosition({
        left: Math.max(12, Math.min(bounds.right - width, window.innerWidth - width - 12)),
        bottom: Math.max(12, window.innerHeight - bounds.top + 10),
        width,
        maxHeight: Math.max(120, bounds.top - 22),
      })
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [open])

  useEffect(() => {
    if (!open) return
    root.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) onClose()
    }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [open, onClose])

  function closeAndFocus() {
    onClose()
    trigger.current?.focus()
  }

  function onKeyDown(event: KeyboardEvent) {
    if (!open) return
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      closeAndFocus()
    }
    if (event.key === 'Tab') onClose()
    const options = Array.from(
      root.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? [],
    )
    const index = options.findIndex((option) => option === document.activeElement)
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault()
      const next =
        event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? options.length - 1
            : (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length
      options[next]?.focus()
      options[next]?.scrollIntoView({ block: 'nearest' })
    }
  }

  return (
    <div className={`picker ${kind}-picker`} ref={root} onKeyDown={onKeyDown}>
      <button
        type="button"
        ref={trigger}
        className={`picker-trigger${open ? ' selected' : ''}`}
        aria-label={`${label}：${isModel ? model.name : reasoning.name}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={onToggle}
      >
        {isModel ? <ModelMark model={model} small /> : <SlidersHorizontal size={14} />}
        <span>{isModel ? model.name : reasoning.name}</span>
        <ChevronDown size={13} className={open ? 'rotated' : ''} />
      </button>
      {open && (
        <div className="picker-popover" style={position}>
          <div className="picker-heading">
            <span>{isModel ? '选择你的整活搭子' : '推理强度'}</span>
            <span>{isModel ? '三款模型' : '六档模拟 + 拟真'}</span>
          </div>
          <div className="picker-options" role="listbox" aria-label={label} id={id}>
            {isModel
              ? MODELS.map((item) => (
                  <button
                    type="button"
                    className="picker-option"
                    key={item.id}
                    role="option"
                    aria-selected={item.id === value}
                    onClick={() => {
                      onSelect(item.id)
                      closeAndFocus()
                    }}
                  >
                    <ModelMark model={item} />
                    <span className="option-copy">
                      <strong>
                        {item.name}
                        <span>{item.version}</span>
                      </strong>
                      <span>{item.subtitle}</span>
                    </span>
                    {item.id === value && <Check size={16} className="option-check" />}
                  </button>
                ))
              : levels.map((item) => (
                  <button
                    type="button"
                    className="picker-option"
                    key={item.id}
                    role="option"
                    aria-selected={item.id === value}
                    onClick={() => {
                      onSelect(item.id as ReasoningId)
                      closeAndFocus()
                    }}
                  >
                    <span className={`reasoning-bars ${item.id}`} aria-hidden="true">
                      <i />
                      <i />
                      <i />
                    </span>
                    <span className="option-copy">
                      <strong>
                        {item.name}
                        <span>{item.detail}</span>
                      </strong>
                      <span>{item.description}</span>
                    </span>
                    {item.id === value && <Check size={16} className="option-check" />}
                  </button>
                ))}
          </div>
          {!isModel && (
            <p className="picker-note">前六档为假装推理的模拟演出；拟真档发送后加载 GGUF。</p>
          )}
        </div>
      )}
    </div>
  )
}
