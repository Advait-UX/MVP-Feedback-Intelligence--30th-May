/**
 * AppSwitcher — Lyra App Menu (Figma node 20360:75452)
 *
 * Renders a scrim + fixed dropdown panel listing all CXone apps grouped by
 * colour-coded section, matching the prototype's AppSwitcher component
 * (prototype.html lines 6363–6401).
 *
 * Only "Feedback Intelligence" (key: "fi") and "Workforce Management"
 * (key: "wfm") are clickable — all other rows are display-only.
 */

import { useState } from 'react'

// ---------------------------------------------------------------------------
// App-glyph SVG paths (prototype.html APP_ICON_PATHS — lines 6161–6203)
// ---------------------------------------------------------------------------

const APP_ICON_PATHS: Record<string, string> = {
  'Admin':
    'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z M19 12c0-.4 0-.8-.1-1.2l2.1-1.6-2-3.5-2.5 1a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.5a7 7 0 0 0-2 1.2l-2.5-1-2 3.5L5.1 10.8C5 11.2 5 11.6 5 12s0 .8.1 1.2l-2.1 1.6 2 3.5 2.5-1a7 7 0 0 0 2 1.2L10 21h4l.5-2.5a7 7 0 0 0 2-1.2l2.5 1 2-3.5-2.1-1.6c.1-.4.1-.8.1-1.2z',
  'Supervisor':
    'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  'Message Center':
    'M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z M3.5 6.5 12 13l8.5-6.5',
  'AI Studio':
    'M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z M19 16l.7 1.8L21.5 18.5l-1.8.7L19 21l-.7-1.8L16.5 18.5l1.8-.7z',
  'Cognigy AI':
    'M6 8h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z M12 4v4 M9 13v.01 M15 13v.01 M2 12h2 M20 12h2',
  'Agent Integration':
    'M14 4a2 2 0 0 1 2 2v3h3a2 2 0 1 1 0 4h-3v3a2 2 0 1 1-4 0v-3H9a2 2 0 1 1 0-4h3V6a2 2 0 0 1 2-2z M6 11a2 2 0 1 0 0 4',
  'WFI':
    'M4 14a1 1 0 0 1-1-1v-1a9 9 0 0 1 18 0v1a1 1 0 0 1-1 1h-1v4a2 2 0 0 1-2 2h-2 M4 14v3a2 2 0 0 0 2 2h1v-7a1 1 0 0 0-1-1H4z',
  'Neva Studio':
    'M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z',
  'ACD':
    'M3 6h11l3 3-3 3H3z M21 12v6a2 2 0 0 1-2 2H7l-4 4V14',
  'Agent':
    'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21a8 8 0 0 1 16 0',
  'MAX':
    'M3 5h18a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z M8 21h8 M12 17v4',
  'Studio':
    'M14 2 4 12l-1 5 5-1L18 6z M13 3l4 4',
  'Studio Authentication':
    'M8 11V8a4 4 0 1 1 8 0v3 M6 11h12v9H6z M12 15v2',
  'Workforce Management':
    'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M2 21a7 7 0 0 1 14 0 M17 8a3 3 0 1 0 0 6 M22 19a5 5 0 0 0-5-5',
  'Enhanced Strategic Planner':
    'M5 4h14a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z M3 9h18 M8 2v4 M16 2v4 M9 14l2 2 4-4',
  'Quality Management':
    'M12 3 4 6v6c0 4.5 3.5 8 8 9 4.5-1 8-4.5 8-9V6z M8.5 12l2.5 2.5L15.5 10',
  'Performance Management':
    'M3 17l6-6 4 4 8-8 M14 7h7v7',
  'Coaching':
    'M22 9 12 4 2 9l10 5 10-5z M6 11v6c0 1 3 3 6 3s6-2 6-3v-6 M22 10v6',
  'Interaction Hub':
    'M21 11.5a8 8 0 0 1-3.7 6.7l1 2.8-3-1.5a9 9 0 0 1-13.3-7.9A8 8 0 1 1 21 11.5z M8 12h.01 M12 12h.01 M16 12h.01',
  'My Zone':
    'M3 11.5 12 4l9 7.5 M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9',
  'Desktop Discovery':
    'M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14z M16 16l5 5',
  'Actions':
    'M13 2 3 14h7l-1 8 10-12h-7z',
  'Dashboard':
    'M4 4h6v8H4z M14 4h6v5h-6z M14 13h6v7h-6z M4 16h6v4H4z',
  'Analytics':
    'M4 20V10 M10 20V4 M16 20v-7 M20 20h-2',
  'Reporting':
    'M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z M14 3v6h6 M9 13h6 M9 17h4',
  'Metric':
    'M21 12h-4l-3 8-6-16-3 8H1',
  'Self-Service Analytics':
    'M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14z M16 16l5 5 M8 12h6 M11 9v6',
  'Enlighten XO':
    'M9 18h6 M10 22h4 M12 2a7 7 0 0 0-4 12.7c.9.7 1.5 1.7 1.5 2.8V18h5v-.5c0-1.1.6-2.1 1.5-2.8A7 7 0 0 0 12 2z',
  'Performance Management (legacy)':
    'M3 17l6-6 4 4 8-8 M14 7h7v7',
  'Digital':
    'M3 5h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z M9 19h8 M19 9h2a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1z',
  'Adapters':
    'M9 2v4 M15 2v4 M7 6h10v4a5 5 0 0 1-5 5v0a5 5 0 0 1-5-5z M12 15v3a3 3 0 0 0 3 3',
  'Connections Hub':
    'M9 14a5 5 0 0 0 7.1 0l2.8-2.8a5 5 0 1 0-7.1-7.1L10 6 M15 10a5 5 0 0 0-7.1 0L5.1 12.8a5 5 0 1 0 7.1 7.1L14 18',
  'Guide':
    'M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4z M20 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8z',
}

// ---------------------------------------------------------------------------
// App groups (prototype.html APP_MENU_GROUPS — lines 6260–6325)
// ---------------------------------------------------------------------------

type AppEntry = {
  label: string
  key?: 'fi' | 'wfm'
  isNew?: boolean
}

type AppGroup = {
  bg: string
  apps: AppEntry[]
}

const APP_MENU_GROUPS: AppGroup[] = [
  {
    bg: '#72c9e8',
    apps: [
      { label: 'Admin' },
      { label: 'Supervisor' },
      { label: 'Message Center' },
      { label: 'AI Studio' },
    ],
  },
  {
    bg: '#a98ee8',
    apps: [
      { label: 'Cognigy AI' },
      { label: 'Agent Integration' },
      { label: 'WFI' },
      { label: 'Neva Studio' },
    ],
  },
  {
    bg: '#f5bb5c',
    apps: [
      { label: 'ACD' },
      { label: 'Agent' },
      { label: 'MAX' },
      { label: 'Studio' },
      { label: 'Studio Authentication' },
    ],
  },
  {
    bg: '#6ec97a',
    apps: [
      { label: 'Workforce Management',        key: 'wfm' },
      { label: 'Enhanced Strategic Planner' },
      { label: 'Quality Management' },
      { label: 'Feedback Intelligence',       key: 'fi', isNew: true },
      { label: 'Performance Management' },
      { label: 'Coaching' },
      { label: 'Interaction Hub' },
      { label: 'My Zone' },
      { label: 'Desktop Discovery' },
    ],
  },
  {
    bg: '#f08080',
    apps: [
      { label: 'Actions' },
      { label: 'Dashboard' },
      { label: 'Analytics' },
      { label: 'Reporting' },
      { label: 'Metric' },
      { label: 'Self-Service Analytics' },
      { label: 'Enlighten XO' },
    ],
  },
  {
    bg: '#b0bec5',
    apps: [
      { label: 'Performance Management (legacy)' },
      { label: 'Digital' },
      { label: 'Adapters' },
      { label: 'Connections Hub' },
      { label: 'Guide' },
    ],
  },
]

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** SVG glyph for an app — falls back to a simple square if path not found */
function AppGlyph({ label }: { label: string }) {
  const d = APP_ICON_PATHS[label]
  if (!d) return null
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  )
}

/** FI sparkle/chat icon — used in the WEM group for Feedback Intelligence */
function FISparkleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="var(--lyra-green-700)"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 5h13a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3h-5l-5 4v-4H4z" />
      <path
        d="M13.5 8.5 14.4 10.6 16.5 11.5 14.4 12.4 13.5 14.5 12.6 12.4 10.5 11.5 12.6 10.6Z"
        fill="var(--lyra-green-700)"
      />
    </svg>
  )
}

/** Checkmark icon for the currently active product */
function CheckIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      aria-hidden="true"
      style={{ color: 'var(--color-fg-action)', flexShrink: 0 }}
    >
      <polyline
        points="3 8.5 6.5 12 13 5"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** NiCE CXone wordmark shown in the footer (text-based fallback since CDN URLs expire) */
function CXoneWordmark() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span
        style={{
          fontSize: 15,
          fontWeight: 600,
          letterSpacing: '-0.01em',
          color: 'var(--color-fg-default)',
          fontFamily: 'var(--font-sans)',
        }}
      >
        NiCE
      </span>
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '2px 6px',
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.04em',
          background: 'var(--lyra-color-bg-primary)',
          color: 'var(--lyra-color-fg-on-primary)',
          fontFamily: 'var(--font-sans)',
        }}
      >
        CX
        <span
          style={{
            background: 'var(--lyra-color-bg-surface-base)',
            color: 'var(--lyra-color-bg-primary)',
            borderRadius: 4,
            padding: '0 2px',
            marginLeft: 2,
            fontWeight: 600,
          }}
        >
          one
        </span>
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// AppSwitcher
// ---------------------------------------------------------------------------

export type CurrentProduct = 'fi' | 'wfm' | string

interface AppSwitcherProps {
  /** Called when the user clicks a navigable product tile (key: "fi" | "wfm"). */
  onNavigate: (productKey: 'fi' | 'wfm') => void
  /** Called when the scrim or any close mechanism is activated. */
  onClose: () => void
  /** The currently active product, so the matching row gets a checkmark. */
  currentProduct?: CurrentProduct
}

export function AppSwitcher({ onNavigate, onClose, currentProduct }: AppSwitcherProps) {
  // Local hover state per row index (group × app)
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)

  return (
    <>
      {/* Click-away scrim */}
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9,
        }}
      />

      {/* App menu panel — Figma exact: 320px wide, top:52px left:14px */}
      <div
        role="dialog"
        aria-label="App switcher"
        style={{
          position: 'fixed',
          top: 52,
          left: 14,
          width: 320,
          background: 'var(--color-bg-surface-overlay)',
          border: '1px solid var(--color-border-soft)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0px 12px 12px 0px rgba(0,0,0,0.08), var(--shadow-lg)',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100vh - 70px)',
          overflow: 'hidden',
          fontFamily: 'var(--font-sans)',
        }}
      >
        {/* Scrollable app list */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 'var(--space-4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
            scrollbarWidth: 'thin',
            scrollbarColor: 'transparent transparent',
          }}
        >
          {APP_MENU_GROUPS.map((group, gi) => (
            <div key={gi} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {/* Horizontal divider between groups */}
              {gi > 0 && (
                <div
                  aria-hidden="true"
                  style={{
                    height: 'var(--space-2)',
                    position: 'relative',
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: 0,
                      right: 0,
                      height: 1,
                      background: 'var(--color-border-soft)',
                    }}
                  />
                </div>
              )}

              {group.apps.map((app, ai) => {
                const rowKey = `${gi}-${ai}`
                const isActive =
                  (app.key === 'fi' && currentProduct === 'fi') ||
                  (app.key === 'wfm' && currentProduct === 'wfm')
                const isClickable = !!app.key
                const isHovered = hoveredKey === rowKey

                let rowBg = 'transparent'
                if (isActive) rowBg = 'var(--color-bg-active-subtle)'
                else if (isHovered && isClickable) rowBg = 'var(--color-bg-control-subtle)'

                return (
                  <div
                    key={ai}
                    role={isClickable ? 'button' : undefined}
                    tabIndex={isClickable ? 0 : undefined}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={
                      isClickable
                        ? () => {
                            onClose()
                            onNavigate(app.key as 'fi' | 'wfm')
                          }
                        : undefined
                    }
                    onKeyDown={
                      isClickable
                        ? e => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              onClose()
                              onNavigate(app.key as 'fi' | 'wfm')
                            }
                          }
                        : undefined
                    }
                    onMouseEnter={() => isClickable && setHoveredKey(rowKey)}
                    onMouseLeave={() => setHoveredKey(null)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      padding: '0 var(--space-2)',
                      height: 40,
                      borderRadius: 'var(--radius-md)',
                      cursor: isClickable ? 'pointer' : 'default',
                      background: rowBg,
                      transition: 'background 80ms',
                      outline: 'none',
                    }}
                  >
                    {/* App icon swatch */}
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 'var(--radius-md)',
                        background: group.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        color: 'rgba(0,0,0,0.70)',
                      }}
                    >
                      {app.key === 'fi' ? (
                        <FISparkleIcon />
                      ) : (
                        <AppGlyph label={app.label} />
                      )}
                    </div>

                    {/* Label */}
                    <span
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: 14,
                        fontWeight: 500,
                        lineHeight: '20px',
                        letterSpacing: 0,
                        color: isActive
                          ? 'var(--color-fg-active-strong)'
                          : 'var(--color-fg-default)',
                        flex: 1,
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {app.label}
                    </span>

                    {/* NEW badge */}
                    {app.isNew && (
                      <span
                        style={{
                          fontFamily: 'var(--font-sans)',
                          fontSize: 12,
                          fontWeight: 500,
                          lineHeight: '16px',
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          color: 'var(--fi-accent)',
                          background: 'var(--fi-accent-bg)',
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-xs)',
                          flexShrink: 0,
                        }}
                      >
                        NEW
                      </span>
                    )}

                    {/* Active checkmark */}
                    {isActive && <CheckIcon />}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Footer — NiCE CXone wordmark */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 64,
            borderTop: '1px solid var(--color-border-subtle)',
            flexShrink: 0,
          }}
        >
          <CXoneWordmark />
        </div>
      </div>
    </>
  )
}
