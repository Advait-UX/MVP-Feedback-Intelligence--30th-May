// TemplateCard & CompactTemplateCard — survey campaign template selection cards.
// Faithful port of TemplateCard / CompactTemplateCard from prototype.html §9360–9440.
// Uses only Lyra CSS custom-property tokens — no hardcoded colours.

import type { SurveyDesignTemplate } from '../../types'

// ---------------------------------------------------------------------------
// SVG icon map — keyed to SurveyDesignTemplate.category values that exist in
// CAMPAIGN_TEMPLATES (from prototype). The key is derived by normalising the
// category string to match the prototype's `icon` field.
// ---------------------------------------------------------------------------

const CATEGORY_ICON: Record<string, React.ReactNode> = {
  'Customer Satisfaction': (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 6h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-2v4l-5-4H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/>
      <circle cx="10" cy="13" r="1" fill="currentColor" stroke="none"/>
      <circle cx="14" cy="13" r="1" fill="currentColor" stroke="none"/>
      <circle cx="18" cy="13" r="1" fill="currentColor" stroke="none"/>
    </svg>
  ),
  'Sentiment Recovery': (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="16" cy="16" r="11"/>
      <path d="M11 20s1.5-2 5-2 5 2 5 2"/>
      <circle cx="12" cy="13" r="1.2" fill="currentColor" stroke="none"/>
      <circle cx="20" cy="13" r="1.2" fill="currentColor" stroke="none"/>
    </svg>
  ),
  'Email Channel': (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="8" width="24" height="17" rx="2"/>
      <path d="M4 10l12 8 12-8"/>
    </svg>
  ),
  'AI Quality': (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="7" y="11" width="18" height="14" rx="3"/>
      <circle cx="12" cy="18" r="1.5" fill="currentColor" stroke="none"/>
      <circle cx="20" cy="18" r="1.5" fill="currentColor" stroke="none"/>
      <path d="M13 22h6"/>
      <path d="M16 11V7"/>
      <circle cx="16" cy="6" r="1.5"/>
      <path d="M3 17h4M25 17h4"/>
    </svg>
  ),
  'Brand Health': (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 4l3 7h7l-5.5 4.5 2 7L16 19l-6.5 3.5 2-7L6 11h7z"/>
    </svg>
  ),
  'Retention': (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 5 20 14 29 15.5 22 22l2 9-8-4.5L8 31l2-9-7-6.5L12 14z"/>
    </svg>
  ),
  'Net Promoter': (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="16" cy="16" r="11"/>
      <path d="M11 18s1.5 2.5 5 2.5 5-2.5 5-2.5"/>
      <circle cx="12" cy="13" r="1.2" fill="currentColor" stroke="none"/>
      <circle cx="20" cy="13" r="1.2" fill="currentColor" stroke="none"/>
    </svg>
  ),
  'Resolution Quality': (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="4 14 10 20 28 8"/>
    </svg>
  ),
  'Voice Channel': (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 6a20 20 0 0 0 20 20"/>
      <path d="M6 6h6l3 6-3 3a14 14 0 0 0 10 10l3-3 6 3v6A2 2 0 0 1 26 28 22 22 0 0 1 4 8a2 2 0 0 1 2-2z"/>
    </svg>
  ),
  'Quality Assurance': (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="5" width="22" height="22" rx="3"/>
      <polyline points="11 16 14 19 21 13"/>
    </svg>
  ),
}

// Fallback icon when no specific icon exists for a category.
const DEFAULT_ICON = (
  <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="5" y="5" width="22" height="22" rx="3"/>
    <line x1="10" y1="12" x2="22" y2="12"/>
    <line x1="10" y1="16" x2="22" y2="16"/>
    <line x1="10" y1="20" x2="18" y2="20"/>
  </svg>
)

// ---------------------------------------------------------------------------
// Category colour palette — semantic tokens only, no hardcoded values.
// ---------------------------------------------------------------------------

interface CategoryStyle {
  bg: string
  fg: string
}

const CATEGORY_COLOR: Record<string, CategoryStyle> = {
  'Customer Satisfaction': {
    bg: 'var(--lyra-color-bg-active-subtle)',
    fg: 'var(--lyra-color-fg-active-strong)',
  },
  'Sentiment Recovery': {
    bg: 'var(--lyra-color-bg-ai)',
    fg: 'var(--lyra-purple-700)',
  },
  'AI Quality': {
    bg: 'var(--lyra-color-bg-ai)',
    fg: 'var(--lyra-purple-700)',
  },
  'Brand Health': {
    bg: 'var(--lyra-color-status-warning-subtle)',
    fg: 'var(--lyra-color-status-warning-strong)',
  },
  'Retention': {
    bg: 'var(--lyra-color-status-success-subtle)',
    fg: 'var(--lyra-color-status-success-strong)',
  },
  'Email Channel': {
    bg: 'var(--lyra-color-status-info-subtle)',
    fg: 'var(--lyra-color-status-info-strong)',
  },
  'Net Promoter': {
    bg: 'var(--lyra-color-status-info-subtle)',
    fg: 'var(--lyra-color-status-info-strong)',
  },
  'Resolution Quality': {
    bg: 'var(--lyra-color-status-success-subtle)',
    fg: 'var(--lyra-color-status-success-strong)',
  },
  'Voice Channel': {
    bg: 'var(--lyra-slate-100)',
    fg: 'var(--lyra-slate-700)',
  },
  'Quality Assurance': {
    bg: 'var(--lyra-slate-100)',
    fg: 'var(--lyra-slate-700)',
  },
}

const DEFAULT_CATEGORY_STYLE: CategoryStyle = {
  bg: 'var(--lyra-slate-100)',
  fg: 'var(--lyra-slate-700)',
}

function getCategoryStyle(category: string): CategoryStyle {
  return CATEGORY_COLOR[category] ?? DEFAULT_CATEGORY_STYLE
}

function getCategoryIcon(category: string): React.ReactNode {
  return CATEGORY_ICON[category] ?? DEFAULT_ICON
}

// ---------------------------------------------------------------------------
// TemplateCard — full-size card used in the template picker grid.
// ---------------------------------------------------------------------------

export interface TemplateCardProps {
  template: SurveyDesignTemplate
  onUse: (t: SurveyDesignTemplate) => void
}

export function TemplateCard({ template: t, onUse }: TemplateCardProps) {
  const colourStyle = getCategoryStyle(t.category)
  const icon = getCategoryIcon(t.category)

  return (
    <div
      style={{
        background: 'var(--lyra-color-bg-surface-base)',
        border: '1px solid var(--lyra-color-border-soft)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--sol-effect-shadowsm)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        padding: 'var(--space-5)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* Header: icon + category + name */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
        {/* Category icon */}
        <div
          aria-hidden="true"
          style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--radius-md)',
            background: colourStyle.bg,
            color: colourStyle.fg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            padding: 6,
          }}
        >
          {icon}
        </div>

        {/* Category label + template name */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              font: '500 11px/14px var(--font-sans)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: colourStyle.fg,
              marginBottom: 2,
            }}
          >
            {t.category}
          </div>
          <div
            style={{
              font: '500 14px/18px var(--font-sans)',
              color: 'var(--lyra-color-fg-default)',
            }}
          >
            {t.name}
          </div>
        </div>
      </div>

      {/* "Use when" rationale */}
      <div
        style={{
          background: 'var(--lyra-color-bg-surface-shell)',
          borderRadius: 'var(--radius-sm)',
          padding: 'var(--space-3)',
          font: '400 12px/18px var(--font-sans)',
          color: 'var(--lyra-color-fg-secondary)',
        }}
      >
        <span
          style={{
            font: '500 11px/14px var(--font-sans)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: 'var(--lyra-color-fg-secondary)',
            marginRight: 6,
          }}
        >
          Use when
        </span>
        {t.why}
      </div>

      {/* Intents / measures */}
      {t.intents && t.intents.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {t.intents.map(group => (
            <div key={group.group}>
              <div
                style={{
                  font: '500 11px/14px var(--font-sans)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: 'var(--lyra-color-fg-disabled)',
                  marginBottom: 'var(--space-1)',
                }}
              >
                {group.group}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)' }}>
                {group.tags.map(tag => (
                  <span
                    key={tag}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      height: 22,
                      padding: '0 8px',
                      borderRadius: 'var(--radius-full)',
                      background: colourStyle.bg,
                      color: colourStyle.fg,
                      font: '400 11px/14px var(--font-sans)',
                      letterSpacing: '0.01em',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Channels + CTA */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 'auto',
          paddingTop: 'var(--space-2)',
          borderTop: '1px solid var(--lyra-color-border-subtle)',
        }}
      >
        <span
          style={{
            font: '400 12px/16px var(--font-sans)',
            color: 'var(--lyra-color-fg-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <svg viewBox="0 0 16 16" width="12" height="12" fill="none"
            stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"
            strokeLinejoin="round" aria-hidden="true">
            <circle cx="8" cy="8" r="6"/>
            <path d="M8 5v3"/>
            <circle cx="8" cy="11" r=".6" fill="currentColor" stroke="none"/>
          </svg>
          {t.channels}
        </span>

        <button
          onClick={() => onUse(t)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            height: 32,
            padding: '0 12px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--lyra-color-bg-primary)',
            border: 'none',
            color: 'var(--lyra-color-fg-on-primary)',
            font: '500 13px/18px var(--font-sans)',
            cursor: 'pointer',
            transition: 'background 120ms',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-primary)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-bg-primary)'
          }}
          onFocus={e => {
            (e.currentTarget as HTMLElement).style.outline = '2px solid var(--lyra-color-border-focus-default)'
            ;(e.currentTarget as HTMLElement).style.outlineOffset = '2px'
          }}
          onBlur={e => {
            (e.currentTarget as HTMLElement).style.outline = ''
          }}
        >
          Use template
          <svg viewBox="0 0 16 16" width="12" height="12" stroke="currentColor"
            fill="none" strokeWidth="1.8" strokeLinecap="round"
            strokeLinejoin="round" aria-hidden="true">
            <path d="M3 8h10M9 4l4 4-4 4"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// CompactTemplateCard — single-row card used inside wizards / drawers.
// Selected state is highlighted with the active-subtle background.
// ---------------------------------------------------------------------------

export interface CompactTemplateCardProps {
  template: SurveyDesignTemplate
  selected?: boolean
  onUse: (t: SurveyDesignTemplate) => void
}

export function CompactTemplateCard({ template: t, selected = false, onUse }: CompactTemplateCardProps) {
  const colourStyle = getCategoryStyle(t.category)
  const icon = getCategoryIcon(t.category)

  return (
    <button
      role="option"
      aria-selected={selected}
      onClick={() => onUse(t)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        width: '100%',
        padding: 'var(--space-3) var(--space-4)',
        borderRadius: 'var(--radius-md)',
        border: selected
          ? '1px solid var(--lyra-color-border-active)'
          : '1px solid var(--lyra-color-border-subtle)',
        background: selected
          ? 'var(--lyra-color-bg-active-subtle)'
          : 'var(--lyra-color-bg-surface-base)',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: 'var(--font-sans)',
        transition: 'background 100ms, border-color 100ms',
      }}
      onMouseEnter={e => {
        if (!selected) {
          (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)'
        }
      }}
      onMouseLeave={e => {
        if (!selected) {
          (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-bg-surface-base)'
        }
      }}
      onFocus={e => {
        (e.currentTarget as HTMLElement).style.outline = '2px solid var(--lyra-color-border-focus-default)'
        ;(e.currentTarget as HTMLElement).style.outlineOffset = '2px'
      }}
      onBlur={e => {
        (e.currentTarget as HTMLElement).style.outline = ''
      }}
    >
      {/* Small category icon */}
      <div
        aria-hidden="true"
        style={{
          width: 32,
          height: 32,
          borderRadius: 'var(--radius-sm)',
          background: colourStyle.bg,
          color: colourStyle.fg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          padding: 5,
        }}
      >
        {icon}
      </div>

      {/* Name + rationale */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            font: '500 13px/18px var(--font-sans)',
            color: 'var(--lyra-color-fg-default)',
          }}
        >
          {t.name}
        </div>
        <div
          style={{
            font: '400 12px/16px var(--font-sans)',
            color: 'var(--lyra-color-fg-secondary)',
            marginTop: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {t.why}
        </div>
      </div>

      {/* Selected checkmark */}
      {selected && (
        <svg
          viewBox="0 0 16 16"
          width="14"
          height="14"
          fill="none"
          stroke="var(--lyra-color-border-active)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          style={{ flexShrink: 0 }}
        >
          <polyline points="2 8 6 12 14 4"/>
        </svg>
      )}
    </button>
  )
}
