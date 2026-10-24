import { ArrowUpRight, Check, FlaskConical, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { MODELS } from '../config/models'
import { ModelMark } from './Brand'

export default function InfoDialog({
  kind,
  modelId,
  onModel,
  onClose,
}: {
  kind: 'lab' | 'help'
  modelId: string
  onModel: (id: string) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    dialog?.showModal()
    return () => {
      if (dialog?.open) dialog.close()
    }
  }, [])

  return (
    <dialog
      className={`info-dialog ${kind}-dialog`}
      ref={ref}
      aria-labelledby="dialog-title"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="dialog-inner">
        <div className="dialog-heading">
          <span className="dialog-eyebrow">
            <FlaskConical size={14} /> JOKING AI LAB
          </span>
          <button className="icon-button" onClick={onClose} aria-label="关闭弹窗" autoFocus>
            <X size={20} />
          </button>
        </div>
        <h2 id="dialog-title">
          {kind === 'lab' ? '每一种离谱，都有专属模型。' : '三步，开始你的整活之旅。'}
        </h2>
        <p className="dialog-description">
          {kind === 'lab'
            ? `严选 ${MODELS.length} 位不太正经的搭子，总有一位懂你的脑回路。`
            : '不需要注册，也不需要 API Key。带上你的奇思妙想就好。'}
        </p>
        {kind === 'lab' ? (
          <>
            <div className="lab-model-grid">
              {MODELS.map((model) => (
                <button
                  className={`lab-model-card${model.id === modelId ? ' is-selected' : ''}`}
                  key={model.id}
                  onClick={() => {
                    onModel(model.id)
                    onClose()
                  }}
                >
                  <div className="lab-card-top">
                    <ModelMark model={model} />
                    <span>{model.tag}</span>
                    {model.id === modelId && <Check size={16} />}
                  </div>
                  <h3>
                    {model.name}
                    <span>{model.version}</span>
                  </h3>
                  <p>{model.description}</p>
                  <span className="lab-card-cta">
                    {model.id === modelId ? '当前搭子' : '和 TA 聊聊'}
                    <ArrowUpRight size={15} />
                  </span>
                </button>
              ))}
            </div>
            <p className="dialog-note">
              每款恰好七档：前六档是假装推理的本地演出，拟真档发送后才下载 GGUF
              并在浏览器内推理。Teapot 拟真为本站手写、未训练的微型 GGUF，并非原项目模型。
            </p>
          </>
        ) : (
          <>
            <ol className="help-steps">
              <li>
                <span>01</span>
                <div>
                  <h3>挑一个搭子</h3>
                  <p>
                    在输入区右下角选择鹈鹕 PRO、随机数模型或
                    TeapotGPT。骑车、抽签、泡茶，各有各的离谱。
                  </p>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <h3>调一点强度</h3>
                  <p>
                    前六档只改变假装推理的台词、动画和等待时间。鹈鹕最终显示固定 HTML，茶壶交付预设
                    418；随机数正文只有 0～100 的一个整数。拟真档才运行 GGUF。
                  </p>
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  <h3>把话题抛过来</h3>
                  <p>
                    输入消息后按 Enter 发送，Shift + Enter
                    换行。也可以点击首页灵感卡片，获得一个开场白。
                  </p>
                </div>
              </li>
            </ol>
            <div className="privacy-note">
              <strong>你的脑洞，留在你的设备。</strong>
              <p>
                聊天记录仅保存在当前浏览器，最多保留 50 段对话、每段 100
                条消息。清除浏览器数据会删除记录，暂不支持跨设备同步。生成时可以点击停止；切换或新建对话也会停止当前生成。
              </p>
            </div>
          </>
        )}
      </div>
    </dialog>
  )
}
