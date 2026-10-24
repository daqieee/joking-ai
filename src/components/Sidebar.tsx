import {
  ArrowUpRight,
  FlaskConical,
  HelpCircle,
  MessageSquare,
  Plus,
  Scale,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { Conversation } from '../types'
import { BrandMark } from './Brand'

interface Props {
  conversations: Conversation[]
  activeId: string | null
  mobile: boolean
  open: boolean
  onClose: () => void
  onNew: () => void
  onOpen: (id: string) => void
  onDelete: (id: string) => void
  onLab: () => void
  onHelp: () => void
}

export default function Sidebar({
  conversations,
  activeId,
  mobile,
  open,
  onClose,
  onNew,
  onOpen,
  onDelete,
  onLab,
  onHelp,
}: Props) {
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLElement>(null)
  const filtered = conversations.filter((chat) =>
    chat.title.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
  )

  useEffect(() => {
    if (mobile && open) ref.current?.querySelector<HTMLElement>('.sidebar-close')?.focus()
  }, [mobile, open])

  function trapFocus(event: KeyboardEvent) {
    if (!mobile || !open || event.key !== 'Tab') return
    const items = ref.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input',
    )
    if (!items?.length) return
    const first = items[0]
    const last = items[items.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    }
    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <>
      {mobile && open && (
        <button
          className="sidebar-backdrop"
          aria-label="关闭侧边栏"
          onClick={onClose}
          tabIndex={-1}
        />
      )}
      <aside
        ref={ref}
        className={`sidebar${open ? ' is-open' : ''}`}
        inert={mobile && !open ? true : undefined}
        role={mobile && open ? 'dialog' : undefined}
        aria-modal={mobile && open ? true : undefined}
        aria-label="对话侧边栏"
        onKeyDown={trapFocus}
      >
        <div className="sidebar-brand">
          <a
            href={import.meta.env.BASE_URL}
            className="brand-link"
            onClick={(event) => {
              event.preventDefault()
              onNew()
            }}
            aria-label="Joking AI 首页"
          >
            <BrandMark />
            <span>
              Joking<span className="brand-ai"> AI</span>
              <span className="brand-dot">.</span>
            </span>
          </a>
          {mobile && (
            <button
              className="icon-button sidebar-close"
              aria-label="收起侧边栏"
              onClick={onClose}
              autoFocus
            >
              <X size={19} />
            </button>
          )}
        </div>
        <div className="sidebar-top">
          <button className="new-chat" onClick={onNew}>
            <Plus size={18} />
            <span>开启新对话</span>
            <span className="key-hint">⌘ K</span>
          </button>
          <label className="search-box">
            <Search size={16} />
            <input
              aria-label="搜索聊天记录"
              placeholder="搜索对话"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            {search && (
              <button className="search-clear" aria-label="清空搜索" onClick={() => setSearch('')}>
                <X size={13} />
              </button>
            )}
          </label>
        </div>
        <div className="history-section">
          <div className="section-label">
            <span>{search ? '搜索结果' : '最近对话'}</span>
            <span>{search ? filtered.length : conversations.length}</span>
          </div>
          <div className="history-list">
            {filtered.map((chat) => (
              <div className={`history-item${activeId === chat.id ? ' active' : ''}`} key={chat.id}>
                <button
                  className="history-link"
                  onClick={() => onOpen(chat.id)}
                  title={chat.title}
                  aria-current={activeId === chat.id ? 'page' : undefined}
                >
                  <MessageSquare size={15} />
                  <span>{chat.title}</span>
                </button>
                <button
                  className="history-delete"
                  onClick={() => onDelete(chat.id)}
                  aria-label={`删除对话：${chat.title}`}
                  title="删除对话"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {!filtered.length && (
              <div className="history-empty">
                <MessageSquare size={23} strokeWidth={1.3} />
                <p>
                  {search ? '没找到这段脑洞' : '还没有留下脑洞'}
                  <span>{search ? '换个关键词试试吧' : '你的奇思妙想，会留在这里'}</span>
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="sidebar-bottom">
          <button className="sidebar-nav" onClick={onLab}>
            <FlaskConical size={17} />
            <span>模型实验室</span>
            <span className="new-badge">NEW</span>
            <ArrowUpRight size={15} />
          </button>
          <button className="sidebar-nav" onClick={onHelp}>
            <HelpCircle size={17} />
            <span>使用指南</span>
            <ArrowUpRight size={15} />
          </button>
          <a className="sidebar-nav" href={`${import.meta.env.BASE_URL}licenses/`}>
            <Scale size={17} />
            <span>开源许可</span>
            <ArrowUpRight size={15} />
          </a>
          <div className="lab-note">
            <div className="lab-note-top">
              A LITTLE LESS SERIOUS<span>✳</span>
            </div>
            <p>
              世界已经够严肃了。
              <br />
              我们负责离谱。
            </p>
            <span className="lab-note-bottom">
              100% 人工 · 0% 正经 <span>↗</span>
            </span>
            <span className="note-orbit" aria-hidden="true" />
          </div>
          <div className="profile">
            <span className="avatar">J</span>
            <div>
              <strong>快乐体验官</strong>
              <span>本地访客 · 随时开聊</span>
            </div>
            <span className="profile-status" title="本地模式" />
          </div>
        </div>
      </aside>
    </>
  )
}
