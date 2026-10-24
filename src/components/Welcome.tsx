import { ArrowRight, Bird, Coffee, Dices, Orbit, RotateCw } from 'lucide-react'
import { useState } from 'react'
import { PROMPT_SETS } from '../config/prompts'
import { MODELS } from '../config/models'

const icons = { coffee: Coffee, bird: Bird, orbit: Orbit, dice: Dices }

export default function Welcome({
  onPrompt,
  onLab,
}: {
  onPrompt: (prompt: string, modelId?: string) => void
  onLab: () => void
}) {
  const [promptSet, setPromptSet] = useState(0)
  return (
    <div className="welcome">
      <div className="welcome-heading">
        <div className="welcome-eyebrow">
          <span className="status-dot" /> 全新一代不太正经的人工智能{' '}
          <span className="eyebrow-line" />
        </div>
        <h1>
          一本正经，
          <br />
          <span className="headline-fun">
            胡说八道<span className="headline-period">。</span>
            <svg className="headline-underline" viewBox="0 0 340 16" fill="none" aria-hidden="true">
              <path
                d="M4 10C81 2 213 1 335 7M30 14c86-5 203-5 273-2"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span className="hero-spark" aria-hidden="true">
            <svg viewBox="0 0 100 100" fill="none">
              <path
                d="M50 9v82M9 50h82M21 21l58 58M79 21 21 79"
                stroke="currentColor"
                strokeWidth="11"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </h1>
        <p className="welcome-description">
          生活不一定有答案，但可以有点好笑。
          <br className="mobile-break" />
          选一个搭子，聊点离谱的。
        </p>
        <button className="model-discovery" onClick={onLab}>
          <span className="mini-faces" aria-hidden="true">
            <span>
              <Bird size={13} />
            </span>
            <span>
              <Dices size={13} />
            </span>
            <span>
              <Coffee size={13} />
            </span>
          </span>
          <span>
            <strong>{MODELS.length} 位</strong> 整活搭子，随时待命
          </span>
          <ArrowRight size={14} />
        </button>
      </div>
      <section className="inspiration" aria-label="灵感提示">
        <div className="inspiration-heading">
          <span>不知道聊什么？试试这些</span>
          <button onClick={() => setPromptSet((current) => (current + 1) % PROMPT_SETS.length)}>
            <RotateCw size={13} />
            <span>换一批</span>
          </button>
        </div>
        <div className="prompt-grid">
          {PROMPT_SETS[promptSet].map((prompt) => {
            const Icon = icons[prompt.icon]
            return (
              <button
                className="prompt-card"
                key={prompt.text}
                onClick={() =>
                  onPrompt(prompt.text, 'modelId' in prompt ? prompt.modelId : undefined)
                }
              >
                <span className={`prompt-icon ${prompt.tone}`}>
                  <Icon size={18} strokeWidth={1.7} />
                </span>
                <span className="prompt-copy">
                  <span className="prompt-category">{prompt.category}</span>
                  <span className="prompt-text">{prompt.text}</span>
                </span>
                <ArrowRight className="prompt-arrow" size={16} />
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}
