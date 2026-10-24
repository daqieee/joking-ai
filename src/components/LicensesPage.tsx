import { ArrowDownToLine, ArrowLeft, ArrowUpRight, FileText, Scale } from 'lucide-react'
import { LICENSE_ENTRIES, PELICAN_NOTICE, SITE_LICENSE } from '../config/licenses'
import { BrandMark } from './Brand'

const base = import.meta.env.BASE_URL
const originalFiles = [
  { name: 'LICENSE', description: '本站 MIT 许可', path: 'LICENSE' },
  { name: 'NOTICE', description: '鹈鹕模型声明', path: 'NOTICE' },
  {
    name: 'THIRD_PARTY_NOTICES.md',
    description: '第三方归属与资源说明',
    path: 'THIRD_PARTY_NOTICES.md',
  },
  {
    name: 'Apache-2.0 全文',
    description: '鹈鹕模型许可原文',
    path: 'models/LICENSE-pelican-Apache-2.0.txt',
  },
]

export default function LicensesPage() {
  const siteCopyright = SITE_LICENSE.split('\n').find((line) => /copyright/i.test(line))

  return (
    <div className="license-page">
      <a className="license-skip" href="#license-main">
        跳到许可内容
      </a>
      <header className="license-header">
        <a className="license-brand" href={base} aria-label="Joking AI 首页">
          <BrandMark small />
          <span>
            Joking <span className="license-brand-ai">AI</span>
            <span className="license-brand-dot">.</span>
          </span>
        </a>
        <a className="license-back" href={base}>
          <ArrowLeft size={15} aria-hidden="true" />
          返回聊天
        </a>
      </header>

      <main id="license-main" className="license-main">
        <div className="license-hero">
          <p className="license-eyebrow">
            <Scale size={15} aria-hidden="true" />
            BUILT WITH OPEN SOURCE
          </p>
          <h1>开源许可与版权</h1>
          <p className="license-intro">
            脑洞可以离谱，归属需要认真。
            <br />
            感谢让 Joking AI 运转起来的开源项目与创作者。
          </p>
          <div className="license-hero-meta">
            <span>本站原创代码 · MIT</span>
            <span>{LICENSE_ENTRIES.length} 项项目与组件</span>
            <span>许可原文随站提供</span>
          </div>
        </div>

        <div className="license-layout">
          <nav className="license-outline" aria-label="许可页目录">
            <p>本页内容</p>
            <a href="#site-license">本站许可</a>
            <a href="#third-party">项目与组件</a>
            <a href="#pelican-notice">鹈鹕模型 NOTICE</a>
            <a href="#original-files">原始文件</a>
            <div className="license-outline-note">
              <FileText size={17} aria-hidden="true" />
              <span>项目、许可与版权信息，在这里一起说明。</span>
            </div>
          </nav>

          <div className="license-content">
            <section id="site-license" className="license-section" aria-labelledby="site-title">
              <div className="license-section-heading">
                <span className="license-section-number" aria-hidden="true">
                  01
                </span>
                <h2 id="site-title">本站许可</h2>
              </div>
              <div className="license-site-card">
                <div className="license-card-heading">
                  <div>
                    <p className="license-card-eyebrow">JOKING AI</p>
                    <h3>本站原创代码</h3>
                  </div>
                  <span className="license-badge">MIT</span>
                </div>
                <p>本站原创代码采用 MIT 许可。第三方代码、图标与模型遵循各自的许可。</p>
                {siteCopyright && <p className="license-copyright">{siteCopyright}</p>}
                <details className="license-text">
                  <summary>查看本站 MIT 许可全文</summary>
                  <pre tabIndex={0} role="region" aria-label="本站 MIT 许可全文">
                    {SITE_LICENSE}
                  </pre>
                </details>
              </div>
            </section>

            <section
              id="third-party"
              className="license-section"
              aria-labelledby="third-party-title"
            >
              <div className="license-section-heading">
                <span className="license-section-number" aria-hidden="true">
                  02
                </span>
                <h2 id="third-party-title">项目与组件</h2>
                <span className="license-section-count">{LICENSE_ENTRIES.length}</span>
              </div>
              <p className="license-section-description">
                包括模型来源、浏览器运行时、界面组件与图标。展开各项可阅读对应许可原文。
              </p>
              <ul className="license-projects">
                {LICENSE_ENTRIES.map((entry) => (
                  <li key={entry.id}>
                    <article
                      id={`project-${entry.id}`}
                      className="license-project"
                      aria-labelledby={`title-${entry.id}`}
                    >
                      <div className="license-card-heading">
                        <div>
                          <h3 id={`title-${entry.id}`}>{entry.name}</h3>
                          {entry.version && <p className="license-version">{entry.version}</p>}
                        </div>
                        <span className="license-badge">{entry.license}</span>
                      </div>
                      <p className="license-project-description">{entry.description}</p>
                      <div className="license-copyright">
                        {entry.copyright.map((line) => (
                          <p key={line}>{line}</p>
                        ))}
                      </div>
                      <div className="license-project-links">
                        <a href={entry.projectUrl} target="_blank" rel="noopener noreferrer">
                          原项目
                          <ArrowUpRight size={13} aria-hidden="true" />
                          <span className="license-sr-only">（新标签页）</span>
                        </a>
                        <a href={entry.licenseUrl} target="_blank" rel="noopener noreferrer">
                          上游许可
                          <ArrowUpRight size={13} aria-hidden="true" />
                          <span className="license-sr-only">（新标签页）</span>
                        </a>
                      </div>
                      {entry.licenseTexts.map((licenseText) => (
                        <details className="license-text" key={licenseText.label}>
                          <summary>{licenseText.label}</summary>
                          <pre
                            tabIndex={0}
                            role="region"
                            aria-label={`${entry.name} · ${licenseText.label}`}
                          >
                            {licenseText.text}
                          </pre>
                        </details>
                      ))}
                    </article>
                  </li>
                ))}
              </ul>
            </section>

            <section
              id="pelican-notice"
              className="license-section license-notice"
              aria-labelledby="notice-title"
            >
              <div className="license-section-heading">
                <span className="license-section-number" aria-hidden="true">
                  03
                </span>
                <h2 id="notice-title">鹈鹕模型 NOTICE</h2>
              </div>
              <p className="license-section-description">
                鹈鹕 PRO 使用 Apache-2.0 许可。以下为本站整理的来源与归属说明，完整声明随站提供。
              </p>
              <div className="license-notice-actions">
                <a href={`${base}NOTICE`}>
                  <FileText size={14} aria-hidden="true" />
                  阅读原始 NOTICE
                </a>
                <a href={`${base}NOTICE`} download="NOTICE">
                  <ArrowDownToLine size={14} aria-hidden="true" />
                  下载 NOTICE
                </a>
              </div>
              <details className="license-text license-notice-text" open>
                <summary>NOTICE 全文</summary>
                <pre tabIndex={0} role="region" aria-label="鹈鹕模型 NOTICE 全文">
                  {PELICAN_NOTICE}
                </pre>
              </details>
            </section>

            <section id="original-files" className="license-section" aria-labelledby="files-title">
              <div className="license-section-heading">
                <span className="license-section-number" aria-hidden="true">
                  04
                </span>
                <h2 id="files-title">原始文件</h2>
              </div>
              <p className="license-section-description">
                以下文件与本站一同发布，可直接阅读或保存。
              </p>
              <ul className="license-original-files">
                {originalFiles.map((file) => (
                  <li key={file.path}>
                    <a href={`${base}${file.path}`}>
                      <FileText size={18} aria-hidden="true" />
                      <span>
                        <strong>{file.name}</strong>
                        <span>{file.description}</span>
                      </span>
                      <ArrowUpRight size={16} aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </main>

      <footer className="license-footer">
        <span>Joking AI · 一本正经，胡说八道。</span>
        <a href={base}>
          返回聊天 <ArrowUpRight size={14} aria-hidden="true" />
        </a>
      </footer>
    </div>
  )
}
