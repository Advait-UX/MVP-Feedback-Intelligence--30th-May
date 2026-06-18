import { useState } from 'react'
import type { NavItem } from '../../types'

// ---------------------------------------------------------------------------
// NavIcon — inline SVG paths matching prototype NAV_ICONS map (prototype.html:6058)
// ---------------------------------------------------------------------------

const NAV_ICON_PATHS: Record<string, string> = {
  campaigns: 'M3 11l18-7v16l-18-7v-2z M7 13v5',
  insights:  'M3 17l4-4 4 4 6-7 4 4 M14 10h4v4',
  topics:    'M21 12a8 8 0 1 1-3-6.2L21 4v6h-6',
  responses: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z M8 9h8 M8 13h5',
  alerts:    'M6 9a6 6 0 0 1 12 0c0 5 2.5 7 2.5 7H3.5S6 14 6 9z M10 20a2 2 0 0 0 4 0',
  settings:  'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z M19 12a7 7 0 0 0-.1-1.2l2.1-1.6-2-3.5-2.5 1a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.5a7 7 0 0 0-2 1.2l-2.5-1-2 3.5L5.1 10.8A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2.1 1.6 2 3.5 2.5-1a7 7 0 0 0 2 1.2L10 21h4l.5-2.5a7 7 0 0 0 2-1.2l2.5 1 2-3.5-2.1-1.6c.1-.4.1-.8.1-1.2z',
  dashboard: 'M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z',
}

function NavIcon({ name }: { name?: string }) {
  const d = (name && NAV_ICON_PATHS[name]) || NAV_ICON_PATHS.campaigns
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{
        width: 16,
        height: 16,
        flexShrink: 0,
        stroke: 'currentColor',
        fill: 'none',
        strokeWidth: 1.6,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      }}
    >
      <path d={d} />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Chevron — collapse indicator
// ---------------------------------------------------------------------------

function Chevron({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      style={{
        width: 16,
        height: 16,
        marginLeft: 'auto',
        opacity: 0.6,
        stroke: 'currentColor',
        fill: 'none',
        strokeWidth: 1.5,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        flexShrink: 0,
        transform: collapsed ? 'rotate(-90deg)' : 'none',
        transition: 'transform 0.15s',
      }}
    >
      <path d="M3.5 6 8 10.5 12.5 6" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// LeftNav component
// ---------------------------------------------------------------------------

interface LeftNavProps {
  items: NavItem[]
  onLeafClick?: (item: NavItem) => void
  minimized?: boolean
  onToggleMinimized?: () => void
}

export function LeftNav({
  items,
  onLeafClick,
  minimized = false,
  onToggleMinimized,
}: LeftNavProps) {
  // Track collapsed state for group items; default to what the item declares
  const [collapsedMap, setCollapsedMap] = useState<Record<number, boolean>>({})

  function isCollapsed(index: number, item: NavItem): boolean {
    if (index in collapsedMap) return collapsedMap[index]
    // Default: collapsed if item.expanded is falsy
    return !item.expanded
  }

  function toggleGroup(index: number, item: NavItem) {
    setCollapsedMap(prev => ({ ...prev, [index]: !isCollapsed(index, item) }))
  }

  // Nav panel
  const navStyle: React.CSSProperties = {
    background: 'rgb(243, 245, 246)',
    color: 'var(--color-fg-default)',
    fontFamily: 'var(--font-sans)',
    fontSize: 14,
    lineHeight: '20px',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    minWidth: 0,
    width: minimized ? 60 : 256,
    flexShrink: 0,
    transition: 'width 0.2s ease-in-out',
    overflow: 'hidden',
  }

  // Scroll area
  const scrollStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    paddingTop: 'var(--space-2)',
    paddingLeft: minimized ? 'var(--space-3)' : 'var(--space-3)',
    paddingRight: minimized ? 'var(--space-3)' : 'var(--space-3)',
    paddingBottom: 'var(--space-5)',
    display: 'flex',
    flexDirection: 'column',
    gap: minimized ? 'var(--space-1)' : 0,
    alignItems: minimized ? 'center' : undefined,
  }

  return (
    <nav style={navStyle} aria-label="Main navigation">
      {/* Collapse / expand toggle button */}
      <button
        onClick={onToggleMinimized}
        title={minimized ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-label={minimized ? 'Expand sidebar' : 'Collapse sidebar'}
        style={{
          position: 'absolute',
          top: 'var(--space-8)',
          right: -12,
          width: 24,
          height: 24,
          background: 'var(--lyra-white)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--color-fg-default)',
          zIndex: 5,
          boxShadow: 'var(--shadow-sm)',
          transition: 'transform 0.15s',
          padding: 0,
        }}
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          style={{
            width: 12,
            height: 12,
            stroke: 'currentColor',
            fill: 'none',
            strokeWidth: 1.8,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            transform: minimized ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s',
          }}
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* Scrollable item list */}
      <div style={scrollStyle}>
        {items.map((item, i) => {
          if (item.type === 'group') {
            const collapsed = isCollapsed(i, item)
            return (
              <div key={i}>
                {/* Group header row */}
                <button
                  title={minimized ? item.label : undefined}
                  aria-expanded={!collapsed}
                  onClick={() => toggleGroup(i, item)}
                  style={navItemStyle(false, minimized)}
                  onMouseEnter={e =>
                    (e.currentTarget.style.background = 'var(--color-state-bg-hover)')
                  }
                  onMouseLeave={e =>
                    (e.currentTarget.style.background = 'transparent')
                  }
                >
                  <NavIcon name={item.icon} />
                  {!minimized && (
                    <span style={navLabelStyle(false)}>{item.label}</span>
                  )}
                  {!minimized && <Chevron collapsed={collapsed} />}
                </button>

                {/* Child leaves */}
                {!minimized && !collapsed && (
                  <div>
                    {(item.children ?? []).map((child, j) => (
                      <button
                        key={j}
                        title={minimized ? child.label : undefined}
                        onClick={() => onLeafClick?.(child)}
                        style={navLeafStyle(!!child.active)}
                        onMouseEnter={e => {
                          if (!child.active)
                            e.currentTarget.style.background = 'var(--color-state-bg-hover)'
                        }}
                        onMouseLeave={e => {
                          if (!child.active)
                            e.currentTarget.style.background = child.active
                              ? 'var(--color-bg-active-moderate)'
                              : 'transparent'
                        }}
                      >
                        <span style={navLabelStyle(!!child.active)}>{child.label}</span>
                        {child.isNew && (
                          <span
                            title="New"
                            style={newDotStyle}
                            aria-label="New"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          // Flat leaf item
          return (
            <button
              key={i}
              title={minimized ? item.label : undefined}
              onClick={() => onLeafClick?.(item)}
              style={navItemStyle(!!item.active, minimized)}
              onMouseEnter={e => {
                if (!item.active)
                  e.currentTarget.style.background = 'var(--color-state-bg-hover)'
              }}
              onMouseLeave={e => {
                if (!item.active) e.currentTarget.style.background = 'transparent'
              }}
            >
              {/* Active accent bar */}
              {item.active && <span aria-hidden="true" style={accentBarStyle(minimized)} />}
              <NavIcon name={item.icon} />
              {!minimized && (
                <span style={navLabelStyle(!!item.active)}>{item.label}</span>
              )}
              {!minimized && item.isNew && (
                <span title="New" style={newDotStyle} aria-label="New" />
              )}
              {!minimized && item.hasUpdates && (
                <span style={updateBadgeStyle}>Update</span>
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

// ---------------------------------------------------------------------------
// Style helpers — pure inline style objects so no external CSS class needed
// ---------------------------------------------------------------------------

function navItemStyle(active: boolean, minimized: boolean): React.CSSProperties {
  return {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    height: 36,
    padding: minimized ? 0 : '0 10px',
    width: minimized ? 36 : '100%',
    margin: minimized ? '0 auto' : undefined,
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    fontWeight: active ? 500 : 400,
    letterSpacing: 0,
    background: active ? 'var(--color-bg-active-moderate)' : 'transparent',
    color: active ? 'var(--color-fg-active-strong)' : 'var(--color-fg-default)',
    border: 'none',
    textAlign: 'left',
    justifyContent: minimized ? 'center' : undefined,
    overflow: minimized ? 'clip' : undefined,
    flexShrink: 0,
    fontFamily: 'var(--font-sans)',
    fontSize: 14,
    lineHeight: '20px',
    transition: 'background 80ms',
  }
}

function navLeafStyle(active: boolean): React.CSSProperties {
  return {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-4)',
    height: 36,
    padding: '0 var(--space-2) 0 var(--space-5)',
    width: '100%',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    fontWeight: active ? 500 : 400,
    letterSpacing: 0,
    background: active ? 'var(--color-bg-active-moderate)' : 'transparent',
    color: active ? 'var(--color-fg-active-strong)' : 'var(--color-fg-default)',
    border: 'none',
    textAlign: 'left',
    fontFamily: 'var(--font-sans)',
    fontSize: 14,
    lineHeight: '20px',
    transition: 'background 80ms',
  }
}

function navLabelStyle(active: boolean): React.CSSProperties {
  return {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: active ? 'var(--color-fg-active-strong)' : 'var(--color-fg-default)',
  }
}

function accentBarStyle(minimized: boolean): React.CSSProperties {
  return {
    position: 'absolute',
    left: 0,
    top: minimized ? 9.91 : 10,
    bottom: minimized ? 10.09 : 10,
    width: 2,
    background: 'var(--color-fg-active-strong)',
    borderRadius: 2,
  }
}

const newDotStyle: React.CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: '50%',
  background: 'var(--lyra-brand-600)',
  flexShrink: 0,
  marginLeft: 'auto',
  display: 'inline-block',
}

const updateBadgeStyle: React.CSSProperties = {
  flexShrink: 0,
  font: '500 12px/16px var(--font-sans)',
  color: 'var(--lyra-color-status-warning-strong)',
  background: 'var(--lyra-yellow-50)',
  borderRadius: 999,
  padding: '1px 8px',
  whiteSpace: 'nowrap',
}
