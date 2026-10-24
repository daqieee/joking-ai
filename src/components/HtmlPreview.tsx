import { useMemo } from 'react'
import presetFileUrl from '../assets/pelican.html?url'
import { createSafePreview } from '../lib/preview'

export default function HtmlPreview({
  content,
  preset = false,
}: {
  content: string
  preset?: boolean
}) {
  const srcDoc = useMemo(() => createSafePreview(content), [content])
  return (
    <div className="html-result">
      <div className="preview-heading">
        <strong>{preset ? '本站固定预设 HTML' : '本地 GGUF 生成的 HTML'}</strong>
        <span>隔离预览 · 禁用脚本与网络</span>
      </div>
      <iframe
        title="鹈鹕 HTML 预览"
        className="html-preview"
        sandbox=""
        referrerPolicy="no-referrer"
        srcDoc={srcDoc}
      />
      <div className="preview-tools">
        <span>静态 HTML / CSS / SVG</span>
        {preset && (
          <a href={presetFileUrl} target="_blank" rel="noopener noreferrer">
            预设文件
          </a>
        )}
      </div>
      <details className="html-source">
        <summary>查看 HTML 源码</summary>
        <pre>
          <code>{content}</code>
        </pre>
      </details>
    </div>
  )
}
