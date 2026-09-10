import { useState } from 'react'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import { SidebarPanel } from './SidebarPanel'
import type { SidebarNavItem } from './SidebarPanel'
import { TopBar } from './TopBar'
import { PageHeader } from './PageHeader'
import { AiAssistantPanel } from './AiAssistantPanel'

interface AppShellProps {
  children: React.ReactNode
  title?: string
  breadcrumb?: string[]
  onAppSwitch?: (appLabel: string) => void
  /** Sidebar nav items + controlled selection (optional). */
  navItems?: SidebarNavItem[]
  activeNav?: string
  onNavSelect?: (id: string) => void
  /** Set true when content has its own pane-head (e.g. iframes or pages with inline headers). */
  hidePageHeader?: boolean
}

export function AppShell({ children, title = 'Dashboard', breadcrumb = ['Feedback Intelligence'], onAppSwitch, navItems, activeNav, onNavSelect, hidePageHeader = false }: AppShellProps) {
  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  const [panelOpen, setPanelOpen] = useState(true)

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden" style={{ background: 'rgb(243, 245, 246)' }}>
      <TopBar onAppSwitch={onAppSwitch} />

      {/* Body row — sidebar blends into canvas; main content is a white card */}
      <div className="relative flex flex-1 overflow-hidden gap-0">
        {/* Sidebar — blends into the canvas surface */}
        <SidebarPanel
          open={panelOpen}
          onToggle={() => setPanelOpen(!panelOpen)}
          items={navItems}
          activeKey={activeNav}
          onSelect={onNavSelect}
        />

        {/* Floating sidebar toggle chevron, on the seam */}
        <button
          onClick={() => setPanelOpen(!panelOpen)}
          title={panelOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          className="absolute z-20 flex h-5 w-5 items-center justify-center rounded-full bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:border-[#CBD5E1] shadow-sm transition-all outline-none focus:outline-none"
          style={{
            left: panelOpen ? '222px' : '50px',
            top: '26px',
          }}
        >
          {panelOpen
            ? <ChevronLeft className="h-3 w-3" />
            : <ChevronRight className="h-3 w-3" />}
        </button>

        {/* Main content — white pane card floating on canvas */}
        <div className="flex flex-1 flex-col overflow-hidden min-w-0 rounded-xl border border-[rgba(0,0,0,0.10)] bg-white" style={{ margin: '8px 12px 12px 0', boxShadow: '0px 2px 6px 0px rgba(0,0,0,0.04)' }}>
          {!hidePageHeader && (
            <PageHeader
              title={title}
              breadcrumb={breadcrumb}
              onAskAi={() => setAiPanelOpen(!aiPanelOpen)}
              onToggleSidebar={() => setPanelOpen(!panelOpen)}
              sidebarOpen={panelOpen}
            />
          )}
          <main className={`flex-1 flex flex-col ${hidePageHeader ? 'overflow-hidden min-h-0' : 'overflow-auto'}`} style={{ background: 'rgb(243, 245, 246)' }}>
            {children}
          </main>
        </div>

        {/* AI Assistant panel */}
        {aiPanelOpen && (
          <div className="w-[360px] flex-shrink-0">
            <div className="h-full rounded-xl border border-[#E2E8F0] bg-white overflow-hidden">
              <AiAssistantPanel open={aiPanelOpen} onClose={() => setAiPanelOpen(false)} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
