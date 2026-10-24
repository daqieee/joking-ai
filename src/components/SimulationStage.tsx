import { Bird, Coffee, Dices } from 'lucide-react'
import type { SimulationStage as Stage } from '../types'

const icons = { pelican: Bird, random: Dices, teapot: Coffee }
const scenes = { pelican: '鹈鹕骑行模拟', random: '数字抽签模拟', teapot: '茶壶升温模拟' }

export default function SimulationStage({
  stage,
  active = false,
}: {
  stage: Stage
  active?: boolean
}) {
  const Icon = icons[stage.kind]
  return (
    <section
      className={`simulation-stage ${stage.kind} level-${stage.level}${active ? ' is-active' : ''}`}
      data-kind={stage.kind}
      data-level={stage.level}
      aria-label="模拟演出 · 非真实推理"
    >
      <div className="stage-heading">
        <strong>模拟演出 · 非真实推理</strong>
        <span>假装推理 {stage.level} / 6</span>
      </div>
      <div className="stage-scene" aria-hidden="true">
        <span className="stage-orbit" />
        <span className="stage-character">
          <Icon size={34} strokeWidth={1.4} />
        </span>
        <span className="stage-particles">
          <i />
          <i />
          <i />
        </span>
        <span className="stage-caption">{scenes[stage.kind]}</span>
      </div>
      {active ? (
        <ol className="stage-steps">
          {stage.steps.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>
      ) : (
        <details className="stage-transcript">
          <summary>查看模拟过程 · {stage.steps.length} 个阶段</summary>
          <ol className="stage-steps">
            {stage.steps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </details>
      )}
      <p className="stage-note">本站预设的娱乐台词与动画，不是模型思维链。</p>
    </section>
  )
}
