import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { LayoutGrid, Megaphone, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SidebarNavItem =
  | { type?: 'item'; id: string; label: string; icon: LucideIcon; badge?: string }
  | { type: 'section'; label: string }
  | { type: 'group'; id: string; label: string; icon: LucideIcon; children: { id: string; label: string }[]; badge?: string }

const DEFAULT_NAV_ITEMS: SidebarNavItem[] = [
  { id: 'dashboard', label: 'Dashboard',        icon: LayoutGrid },
  { id: 'campaign',  label: 'Campaign Manager', icon: Megaphone },
]

interface SidebarPanelProps {
  open: boolean
  onToggle: () => void
  items?: SidebarNavItem[]
  activeKey?: string
  onSelect?: (id: string) => void
}

export function SidebarPanel({ open, items, activeKey, onSelect }: SidebarPanelProps) {
  const navItems = items ?? DEFAULT_NAV_ITEMS
  const [internalSelected, setInternalSelected] = useState(() => {
    const first = navItems.find(i => i.type !== 'section')
    return (first as { id?: string })?.id ?? ''
  })
  const selected = activeKey ?? internalSelected

  // Track which group items are expanded
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    navItems.forEach(item => {
      if (item.type === 'group') init[item.id] = true
    })
    return init
  })

  const handleSelect = (id: string) => {
    setInternalSelected(id)
    onSelect?.(id)
  }

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Check if a group is "active" (any child is selected)
  const isGroupActive = (children: { id: string }[]) =>
    children.some(c => c.id === selected)

  return (
    <div
      className={cn(
        'flex flex-col flex-shrink-0 overflow-hidden transition-all duration-200 ease-in-out',
        open ? 'w-[232px]' : 'w-[60px]'
      )}
      style={{
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        background: 'rgb(243, 245, 246)',
      }}
    >
      <div className="flex flex-col flex-1 overflow-y-auto py-2 px-3 gap-0">
        {navItems.map((item, idx) => {
          if (item.type === 'section') {
            if (!open) return null
            return (
              <div
                key={`section-${idx}`}
                style={{
                  padding: '8px 10px 4px',
                  fontSize: '10.5px',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  color: 'var(--lyra-color-fg-secondary, rgba(0,0,0,0.55))',
                }}
              >
                {item.label}
              </div>
            )
          }

          if (item.type === 'group') {
            const groupActive = isGroupActive(item.children)
            const expanded = expandedGroups[item.id] ?? true
            const Icon = item.icon
            return (
              <div key={item.id}>
                {/* Group header row */}
                <button
                  onClick={() => { toggleGroup(item.id); if (!expanded) handleSelect(item.id) }}
                  title={!open ? item.label : undefined}
                  className="relative flex w-full items-center transition-colors duration-100 outline-none focus:outline-none rounded-lg"
                  style={{
                    height: 36,
                    padding: open ? '0 10px' : '0',
                    width: open ? '100%' : 36,
                    margin: open ? undefined : '0 auto',
                    backgroundColor: (groupActive && !expanded) ? '#d3e6fd' : undefined,
                  }}
                  onMouseEnter={e => {
                    if (!groupActive || expanded) (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0,0,0,0.04)'
                  }}
                  onMouseLeave={e => {
                    if (!groupActive || expanded) (e.currentTarget as HTMLElement).style.backgroundColor = ''
                  }}
                >
                  {groupActive && !expanded && open && (
                    <span
                      aria-hidden="true"
                      style={{ position: 'absolute', left: 0, top: 10, bottom: 10, width: 2, background: '#185ba4', borderRadius: 2 }}
                    />
                  )}
                  <Icon
                    className="flex-shrink-0"
                    style={{
                      width: 16, height: 16,
                      color: groupActive ? '#185ba4' : 'rgba(0,0,0,0.80)',
                    }}
                  />
                  {open && (
                    <>
                      <span
                        className="flex-1 text-left truncate"
                        style={{
                          marginLeft: 8,
                          fontSize: 14,
                          lineHeight: '20px',
                          fontWeight: groupActive ? 500 : 400,
                          color: groupActive ? '#185ba4' : 'rgba(0,0,0,0.80)',
                        }}
                      >
                        {item.label}
                      </span>
                      {item.badge && (
                        <span style={{ flexShrink: 0, font: '500 11px/14px Inter, sans-serif', color: '#8e6800', background: '#fff8d4', borderRadius: 999, padding: '1px 7px', whiteSpace: 'nowrap', marginRight: 4 }}>
                          {item.badge}
                        </span>
                      )}
                      <ChevronDown
                        style={{
                          width: 16, height: 16,
                          color: 'rgba(0,0,0,0.40)',
                          transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                          transition: 'transform 0.15s',
                          flexShrink: 0,
                        }}
                      />
                    </>
                  )}
                </button>
                {/* Children */}
                {open && expanded && (
                  <div style={{ margin: '2px 0 4px 12px', borderLeft: '1px solid rgba(0,0,0,0.10)', paddingLeft: 8, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {item.children.map(child => (
                      <button
                        key={child.id}
                        onClick={() => handleSelect(child.id)}
                        className="flex items-center w-full text-left outline-none focus:outline-none rounded-md"
                        style={{
                          height: 32,
                          padding: '0 8px',
                          border: 'none',
                          fontSize: 13,
                          cursor: 'pointer',
                          background: selected === child.id ? '#d3e6fd' : 'transparent',
                          color: selected === child.id ? '#185ba4' : 'rgba(0,0,0,0.80)',
                          fontWeight: selected === child.id ? 500 : 400,
                          fontFamily: 'inherit',
                          position: 'relative',
                        }}
                        onMouseEnter={e => {
                          if (selected !== child.id) (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0,0,0,0.04)'
                        }}
                        onMouseLeave={e => {
                          if (selected !== child.id) (e.currentTarget as HTMLElement).style.backgroundColor = ''
                        }}
                      >
                        {selected === child.id && (
                          <span aria-hidden="true" style={{ position: 'absolute', left: 0, top: 8, bottom: 8, width: 2, background: '#185ba4', borderRadius: 2 }} />
                        )}
                        {child.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          // Default: plain item
          const plainItem = item as { id: string; label: string; icon: LucideIcon; badge?: string }
          const Icon = plainItem.icon
          const isSelected = selected === plainItem.id
          return (
            <button
              key={plainItem.id}
              onClick={() => handleSelect(plainItem.id)}
              title={!open ? plainItem.label : undefined}
              className={cn(
                'relative flex w-full items-center transition-colors duration-100 outline-none focus:outline-none rounded-lg',
                open ? 'gap-2' : 'justify-center',
              )}
              style={{
                height: 36,
                padding: open ? '0 10px' : '0',
                width: open ? '100%' : 36,
                margin: open ? undefined : '0 auto',
                backgroundColor: isSelected ? '#d3e6fd' : undefined,
              }}
              onMouseEnter={e => {
                if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0,0,0,0.04)'
              }}
              onMouseLeave={e => {
                if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = ''
              }}
            >
              {isSelected && (
                <span aria-hidden="true" style={{ position: 'absolute', left: 0, top: 10, bottom: 10, width: 2, background: '#185ba4', borderRadius: 2 }} />
              )}
              <Icon
                className="flex-shrink-0"
                style={{
                  width: 16, height: 16,
                  color: isSelected ? '#185ba4' : 'rgba(0,0,0,0.80)',
                }}
              />
              {open && (
                <>
                  <span
                    className="flex-1 text-left truncate"
                    style={{
                      fontSize: 14,
                      lineHeight: '20px',
                      fontWeight: isSelected ? 500 : 400,
                      color: isSelected ? '#185ba4' : 'rgba(0,0,0,0.80)',
                    }}
                  >
                    {plainItem.label}
                  </span>
                  {plainItem.badge && (
                    <span style={{
                      flexShrink: 0,
                      font: '500 11px/14px Inter, sans-serif',
                      color: '#8e6800',
                      background: '#fff8d4',
                      borderRadius: 999,
                      padding: '1px 7px',
                      whiteSpace: 'nowrap',
                    }}>{plainItem.badge}</span>
                  )}
                </>
              )}
            </button>
          )
        })}
      </div>

      <div className="h-5 flex-shrink-0" />
    </div>
  )
}
