import { ChevronRight, Menu, PanelLeftClose, PanelLeftOpen, Plus, ShieldCheck } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import Sidebar from './components/Sidebar'
import Welcome from './components/Welcome'
import Composer from './components/Composer'
import ChatMessages from './components/ChatMessages'
import InfoDialog from './components/InfoDialog'
import { useChat } from './hooks/useChat'
import { MAX_MESSAGES } from './lib/storage'

export default function App() {
  const chat = useChat()
  const [draft, setDraft] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 760px)').matches)
  const [dialog, setDialog] = useState<'lab' | 'help' | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const menuRef = useRef<HTMLButtonElement>(null)
  const dialogOpener = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const media = window.matchMedia('(max-width: 760px)')
    const change = () => {
      setMobile(media.matches)
      setSidebarOpen(false)
    }
    media.addEventListener('change', change)
    return () => media.removeEventListener('change', change)
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3200)
    return () => clearTimeout(timer)
  }, [toast])

  const newChat = useCallback(() => {
    chat.newChat()
    setDraft('')
    setSidebarOpen(false)
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [chat.newChat])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k' && !dialog) {
        event.preventDefault()
        newChat()
      }
      if (event.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false)
        requestAnimationFrame(() => menuRef.current?.focus())
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [newChat, sidebarOpen, dialog])

  function closeSidebar() {
    setSidebarOpen(false)
    requestAnimationFrame(() => menuRef.current?.focus())
  }

  function showDialog(kind: 'lab' | 'help') {
    dialogOpener.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    setDialog(kind)
    setSidebarOpen(false)
  }

  function closeDialog() {
    setDialog(null)
    requestAnimationFrame(() => {
      const opener = dialogOpener.current
      if (opener?.isConnected && !opener.closest('[inert]')) opener.focus()
      else menuRef.current?.focus()
    })
  }
  const pending = chat.pending?.conversationId === chat.active?.id ? chat.pending : null

  return (
    <div className={`app${sidebarCollapsed && !mobile ? ' sidebar-collapsed' : ''}`}>
      <Sidebar
        conversations={chat.snapshot.conversations}
        activeId={chat.snapshot.activeId}
        mobile={mobile}
        open={sidebarOpen}
        onClose={closeSidebar}
        onNew={newChat}
        onOpen={(id) => {
          chat.openChat(id)
          setDraft('')
          closeSidebar()
        }}
        onDelete={chat.deleteChat}
        onLab={() => showDialog('lab')}
        onHelp={() => showDialog('help')}
      />
      <main className="main-panel" inert={mobile && sidebarOpen ? true : undefined}>
        <header className="topbar">
          <div className="topbar-left">
            <button
              ref={menuRef}
              className="icon-button sidebar-toggle"
              aria-label={mobile ? '打开侧边栏' : sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
              aria-expanded={mobile ? sidebarOpen : !sidebarCollapsed}
              onClick={() =>
                mobile ? setSidebarOpen(true) : setSidebarCollapsed((value) => !value)
              }
            >
              {mobile ? (
                <Menu size={20} />
              ) : sidebarCollapsed ? (
                <PanelLeftOpen size={18} />
              ) : (
                <PanelLeftClose size={18} />
              )}
            </button>
            <span className="breadcrumb-parent">个人空间</span>
            <ChevronRight size={12} className="breadcrumb-chevron" />
            <span className="breadcrumb-current">
              {chat.active ? chat.active.title : '全新对话'}
            </span>
          </div>
          <div className="topbar-right">
            <span className="mock-status">
              <span className="status-dot" />
              {chat.snapshot.reasoningId === 'real' ? '拟真 · 本地 GGUF' : '模拟模式'}
            </span>
            <span className="header-divider" />
            <button
              className="icon-button topbar-new"
              aria-label="新建对话"
              onClick={newChat}
              title="新建对话"
            >
              <Plus size={19} />
            </button>
          </div>
        </header>
        <div className={`workspace${chat.active ? ' has-conversation' : ''}`}>
          <div className="conversation-scroll">
            {chat.active ? (
              <ChatMessages
                messages={chat.active.messages}
                pending={pending}
                failure={
                  chat.generationError?.conversationId === chat.active.id
                    ? chat.generationError
                    : null
                }
                onRetry={() => {
                  chat.retry()
                }}
                onToast={setToast}
              />
            ) : (
              <Welcome
                onPrompt={(prompt, modelId) => {
                  if (modelId) chat.selectModel(modelId)
                  setDraft(prompt)
                  inputRef.current?.focus()
                }}
                onLab={() => showDialog('lab')}
              />
            )}
          </div>
          <Composer
            modelId={chat.snapshot.modelId}
            reasoningId={chat.snapshot.reasoningId}
            pending={!!pending}
            atLimit={(chat.active?.messages.length ?? 0) >= MAX_MESSAGES - 1}
            draft={draft}
            onDraft={setDraft}
            onSend={chat.send}
            onStop={chat.stop}
            onModel={chat.selectModel}
            onReasoning={chat.selectReasoning}
            inputRef={inputRef}
          />
        </div>
        <footer className="workspace-footer">
          <span>NOT ARTIFICIAL. JUST RIDICULOUS.</span>
          <span>
            <ShieldCheck size={12} />
            聊天记录仅保存在此设备
            <a className="footer-license-link" href={`${import.meta.env.BASE_URL}licenses/`}>
              开源许可
            </a>
          </span>
        </footer>
      </main>
      {dialog && (
        <InfoDialog
          kind={dialog}
          modelId={chat.snapshot.modelId}
          onModel={chat.selectModel}
          onClose={closeDialog}
        />
      )}
      {chat.storageError && (
        <div className="storage-warning" role="alert">
          浏览器暂时无法保存记录；你仍可聊天，刷新后记录可能丢失。
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  )
}
