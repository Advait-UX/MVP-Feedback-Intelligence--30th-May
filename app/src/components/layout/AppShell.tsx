import { useState } from 'react'
import { SidebarPanel } from './SidebarPanel'
import type { SidebarNavItem } from './SidebarPanel'
import { LeftNav } from './LeftNav'
import { TopBar } from './TopBar'
import { PageHeader } from './PageHeader'
import { AiAssistantPanel } from './AiAssistantPanel'
import type { NavItem } from '../../types'

// ---------------------------------------------------------------------------
// Leave-guard helper — routes onLeafClick through window.__FI_LEAVE_GUARD__
// when it is registered (prototype integration), otherwise calls cb directly.
// ---------------------------------------------------------------------------

function fireLeafClick(item: NavItem, cb: (item: NavItem) => void) {
  const guard = (window as unknown as Record<string, unknown>).__FI_LEAVE_GUARD__
  if (typeof guard === 'function') {
    ;(guard as (item: NavItem, cb: (item: NavItem) => void) => void)(item, cb)
  } else {
    cb(item)
  }
}

interface AppShellProps {
  children: React.ReactNode
  title?: string
  breadcrumb?: string[]
  onAppSwitch?: (appLabel: string) => void
  /** Legacy SidebarPanel items + controlled selection (optional).
   *  When navItems2 is provided, LeftNav is used instead. */
  navItems?: SidebarNavItem[]
  activeNav?: string
  onNavSelect?: (id: string) => void
  /** Prototype-style NavItem tree for LeftNav (takes priority over navItems). */
  navItems2?: NavItem[]
  /** Called when a LeftNav leaf is clicked (routed via __FI_LEAVE_GUARD__). */
  onLeafClick?: (item: NavItem) => void
  /** Set true when content has its own pane-head (e.g. iframes or pages with inline headers). */
  hidePageHeader?: boolean
}

export function AppShell({
  children,
  title = 'Dashboard',
  breadcrumb = ['Feedback Intelligence'],
  onAppSwitch,
  navItems,
  activeNav,
  onNavSelect,
  navItems2,
  onLeafClick,
  hidePageHeader = false,
}: AppShellProps) {
  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  const [panelOpen, setPanelOpen] = useState(true)
  const [minimized, setMinimized] = useState(false)

  // Determine which sidebar variant to render
  const useLeftNav = Array.isArray(navItems2) && navItems2.length > 0

  function handleLeafClick(item: NavItem) {
    if (onLeafClick) {
      fireLeafClick(item, onLeafClick)
    }
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden" style={{ background: 'var(--lyra-color-bg-surface-shell)' }}>
      <TopBar onAppSwitch={onAppSwitch} />

      {/* Body row — sidebar blends into canvas; main content is a white card */}
      <div className="relative flex flex-1 overflow-hidden gap-0">
        {useLeftNav ? (
          /* LeftNav — prototype-style collapsible nav with icon + label rows */
          <LeftNav
            items={navItems2!}
            onLeafClick={handleLeafClick}
            minimized={minimized}
            onToggleMinimized={() => setMinimized(m => !m)}
          />
        ) : (
          /* Legacy SidebarPanel */
          <SidebarPanel
            open={panelOpen}
            onToggle={() => setPanelOpen(!panelOpen)}
            items={navItems}
            activeKey={activeNav}
            onSelect={onNavSelect}
          />
        )}

        {/* Floating sidebar toggle chevron — only shown for legacy SidebarPanel */}
        {!useLeftNav && (
          <button
            onClick={() => setPanelOpen(!panelOpen)}
            title={panelOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            aria-label={panelOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            className="absolute z-20 flex h-5 w-5 items-center justify-center rounded-full shadow-sm transition-all outline-none focus-visible:outline-2"
            style={{
              backgroundColor: 'var(--lyra-color-bg-surface-base)',
              border: '1px solid var(--lyra-color-border-soft)',
              color: 'var(--lyra-color-fg-secondary)',
              left: panelOpen ? '244px' : '48px',
              top: '38px',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = 'var(--lyra-color-fg-default)'
              e.currentTarget.style.borderColor = 'var(--lyra-color-border-medium)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'var(--lyra-color-fg-secondary)'
              e.currentTarget.style.borderColor = 'var(--lyra-color-border-soft)'
            }}
          >
            {panelOpen ? (
              /* Chevron left */
              <svg viewBox="0 0 24 24" className="h-3 w-3" aria-hidden="true" style={{ stroke: 'currentColor', fill: 'none', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                <polyline points="15 18 9 12 15 6" />
              </svg>
            ) : (
              /* Chevron right */
              <svg viewBox="0 0 24 24" className="h-3 w-3" aria-hidden="true" style={{ stroke: 'currentColor', fill: 'none', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            )}
          </button>
        )}

        {/* Main content — white pane card floating on canvas */}
        <div
          className="flex flex-1 flex-col overflow-hidden min-w-0 rounded-xl"
          style={{
            margin: '8px 12px 12px 0',
            border: '1px solid var(--lyra-color-border-subtle)',
            backgroundColor: 'var(--lyra-color-bg-surface-base)',
            boxShadow: 'var(--sol-effect-shadowsm)',
          }}
        >
          {!hidePageHeader && (
            <PageHeader
              title={title}
              breadcrumb={breadcrumb}
              onAskAi={() => setAiPanelOpen(!aiPanelOpen)}
              onToggleSidebar={useLeftNav ? () => setMinimized(m => !m) : () => setPanelOpen(!panelOpen)}
              sidebarOpen={useLeftNav ? !minimized : panelOpen}
            />
          )}
          <main className="flex-1 overflow-auto flex flex-col" style={{ background: 'var(--lyra-color-bg-surface-shell)' }}>
            {children}
          </main>
        </div>

        {/* AI Assistant panel */}
        {aiPanelOpen && (
          <div className="flex-shrink-0" style={{ width: 360 }}>
            <div
              className="h-full rounded-xl overflow-hidden"
              style={{
                border: '1px solid var(--lyra-color-border-soft)',
                backgroundColor: 'var(--lyra-color-bg-surface-base)',
              }}
            >
              <AiAssistantPanel open={aiPanelOpen} onClose={() => setAiPanelOpen(false)} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
