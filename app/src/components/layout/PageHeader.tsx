import { PanelLeftClose } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  breadcrumb?: string[]
  title: string
  onAskAi?: () => void
  onToggleSidebar?: () => void
  sidebarOpen?: boolean
}

export function PageHeader({ breadcrumb: _breadcrumb = [], title, onToggleSidebar, sidebarOpen = true }: PageHeaderProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', rowGap: 'var(--space-4)',
      flexShrink: 0, minHeight: 72,
      padding: 'var(--space-4) var(--space-7)',
      background: 'var(--lyra-color-bg-surface-base)',
      borderBottom: '1px solid var(--lyra-color-border-subtle)',
    }}>
      {/* Left: sidebar toggle + title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1, minWidth: 0, paddingRight: 'var(--space-10)' }}>
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            title="Toggle sidebar"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 28, height: 28, borderRadius: 'var(--radius-sm)',
              border: 'none', background: 'transparent',
              color: 'var(--lyra-color-fg-secondary)', cursor: 'pointer', flexShrink: 0,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            <PanelLeftClose className={cn('h-4 w-4 transition-transform', !sidebarOpen && 'scale-x-[-1]')} />
          </button>
        )}
        <h1 style={{
          margin: 0, minWidth: 0,
          font: '600 20px/24px var(--font-sans)',
          letterSpacing: '-0.3px',
          color: 'var(--lyra-color-fg-default)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {title}
        </h1>
      </div>

      {/* Right: head-actions slot */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
        {/* future actions */}
      </div>
    </div>
  )
}
