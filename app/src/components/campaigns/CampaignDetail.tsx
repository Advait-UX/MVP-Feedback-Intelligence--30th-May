// CampaignDetail — full-page detail view for a single survey campaign.
// Mirrors prototype.html CampaignDetail (line ~8881), ConfigurationView (line ~9141),
// ConfigGroup accordion (line ~9124), DefRow (line ~9103),
// MiniBar, DonutRing, Stars, FloatingMetrics primitives.
//
// Props:
//   campaign  — Campaign object from ../../types
//   onBack    — called when "← Back" is clicked
//   onEdit    — called with the current Campaign when "Edit" is triggered
//
// All layout uses inline styles derived from Lyra CSS custom properties.
// No arbitrary Tailwind values; no hardcoded hex colours.

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Pencil, Trash2, Check, X, ChevronDown } from 'lucide-react'
import type { Campaign } from '../../types'
import { SURVEY_DESIGNS, AI_MODELS } from '../../data/campaigns'
import { CampaignSummaryCard } from './CampaignSummaryCard'
import { StatusPill } from './StatusPill'

// ── Constants ──────────────────────────────────────────────────────────── //

const FONT = 'var(--lyra-font-sans)'

// ── Small UI primitives ────────────────────────────────────────────────── //

/** Horizontal bar chart — same as prototype MiniBar */
function MiniBar({ data, labels, color = 'var(--lyra-color-bg-primary)' }: {
  data: number[]
  labels?: string[]
  color?: string
}) {
  const max = Math.max(...data, 1)
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-end',
      gap: 3,
      height: 48,
      width: '100%',
    }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{
            width: '100%',
            height: `${(v / max) * 100}%`,
            background: color,
            borderRadius: '4px 4px 0 0',
            minHeight: 2,
            opacity: 0.85,
          }} />
          {labels?.[i] && (
            <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 400, lineHeight: '14px', color: 'var(--lyra-slate-500)' }}>
              {labels[i]}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

/** Donut ring chart — same as prototype DonutRing */
function DonutRing({ value, max = 100, color = 'var(--lyra-color-bg-primary)', size = 96, label, sub }: {
  value: number
  max?: number
  color?: string
  size?: number
  label: React.ReactNode
  sub?: string
}) {
  const r = (size - 14) / 2
  const C = 2 * Math.PI * r
  const off = C - (value / max) * C
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="var(--lyra-slate-200)" strokeWidth="10" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={C} strokeDashoffset={off} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontFamily: FONT, fontSize: 18, fontWeight: 600, lineHeight: '22px', color: 'var(--lyra-slate-900)', letterSpacing: '-0.02em' }}>
          {label}
        </div>
        {sub && (
          <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 500, lineHeight: '14px', color: 'var(--lyra-slate-500)' }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  )
}

/** Star rating display — same as prototype Stars */
function Stars({ n, size = 14 }: { n: number; size?: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 1, color: 'var(--lyra-color-status-warning-medium)' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} viewBox="0 0 24 24" width={size} height={size}
          fill={i <= n ? 'currentColor' : 'var(--lyra-slate-200)'}>
          <polygon points="12 2 15 9 22 9.3 16.5 14 18.5 21 12 17 5.5 21 7.5 14 2 9.3 9 9" />
        </svg>
      ))}
    </span>
  )
}

// ── Campaign state inline dot + label ─────────────────────────────────── //

function CampaignStateInline({ status, hasWorkingCopy }: { status: string; hasWorkingCopy?: boolean }) {
  if (status === 'expired') return null

  let dotBg: string, label: string, textColor: string

  if (status === 'inactive') {
    dotBg = 'var(--lyra-slate-500)'
    label = 'Draft'
    textColor = 'var(--lyra-slate-600)'
  } else if (hasWorkingCopy) {
    dotBg = 'var(--lyra-purple-700)'
    label = 'Working Copy'
    textColor = 'var(--lyra-purple-700)'
  } else {
    dotBg = 'var(--lyra-color-status-success-strong)'
    label = 'Live'
    textColor = 'var(--lyra-color-status-success-strong)'
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: FONT, fontSize: 12, fontWeight: 500, lineHeight: '16px', color: textColor }}>
      <span style={{
        display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
        background: dotBg, flexShrink: 0, verticalAlign: 'middle', marginTop: -1,
      }} />
      {label}
    </span>
  )
}

// ── DefRow — label + value row inside ConfigGroup ─────────────────────── //

interface DefRowProps {
  label: string
  tooltip?: string
  children: React.ReactNode
}

function DefRow({ label, tooltip, children }: DefRowProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 16,
      padding: '12px 0',
      fontFamily: FONT, fontSize: 14, lineHeight: '20px',
      color: 'var(--lyra-color-fg-default)',
      borderBottom: '1px solid var(--lyra-color-border-subtle)',
    }}>
      <div style={{
        flex: '0 0 200px', fontWeight: 400,
        color: 'var(--lyra-color-fg-secondary)', fontSize: 14,
        display: 'flex', alignItems: 'center', gap: 5,
      }}>
        {label}
        {tooltip && (
          <span title={tooltip} style={{ display: 'inline-flex', cursor: 'default', flexShrink: 0 }}>
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none"
              stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
              style={{ color: 'var(--lyra-color-fg-disabled)' }}>
              <circle cx="8" cy="8" r="6"/>
              <path d="M8 11v-3"/>
              <circle cx="8" cy="5.5" r=".5" fill="currentColor" stroke="none"/>
            </svg>
          </span>
        )}
      </div>
      <div style={{ flex: 1, fontWeight: 400, color: 'var(--lyra-color-fg-default)' }}>
        {children}
      </div>
    </div>
  )
}

// ── ConfigGroup — collapsible accordion card ───────────────────────────── //

interface ConfigGroupProps {
  title: string
  num: number
  children: React.ReactNode
  defaultOpen?: boolean
}

function ConfigGroup({ title, num, children, defaultOpen = true }: ConfigGroupProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section style={{
      background: 'var(--lyra-color-bg-surface-base)',
      border: '1px solid var(--lyra-color-border-subtle)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.04)',
    }}>
      {/* Accordion header */}
      <header
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '16px 20px',
          cursor: 'pointer', userSelect: 'none',
          background: 'var(--lyra-color-bg-surface-base)',
          transition: 'background 0.1s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-bg-surface-base)' }}
      >
        {/* Step number badge */}
        <span style={{
          width: 24, height: 24, borderRadius: '50%',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--lyra-color-bg-active-moderate)',
          color: 'var(--lyra-color-fg-active-strong)',
          fontFamily: FONT, fontSize: 12, fontWeight: 600, flexShrink: 0,
        }}>
          {num}
        </span>
        {/* Title */}
        <span style={{
          flex: 1, fontFamily: FONT, fontSize: 14, fontWeight: 500,
          color: 'var(--lyra-color-fg-default)', letterSpacing: '-0.01rem', lineHeight: '18px',
        }}>
          {title}
        </span>
        {/* Chevron */}
        <ChevronDown
          size={16}
          style={{
            color: 'var(--lyra-color-fg-secondary)',
            transition: 'transform 0.15s',
            transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
            flexShrink: 0,
          }}
        />
      </header>

      {/* Body — only rendered when open */}
      {open && (
        <div style={{ padding: '4px 20px 16px' }}>
          {children}
        </div>
      )}
    </section>
  )
}

// ── ConfigurationView — read-only accordion stack ─────────────────────── //

function ConfigurationView({ campaign: c }: { campaign: Campaign }) {
  const dateRange = c.startDate
    ? c.ongoing
      ? `Ongoing from ${c.startDate}`
      : c.endDate
      ? `${c.startDate} — ${c.endDate}`
      : `${c.startDate} — No end date`
    : `Ongoing from ${c.created}`

  const aiModel = AI_MODELS?.find(m => m.id === c.aiModelId)
  const survey = SURVEY_DESIGNS?.find(s => s.id === c.surveyDesignId)

  const muted = (text: string) => (
    <span style={{ color: 'var(--lyra-color-fg-secondary)' }}>{text}</span>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* 1. Campaign Identity & Scope */}
      <ConfigGroup num={1} title="Campaign Identity & Scope">
        <DefRow label="Campaign Name">{c.name}</DefRow>
        {c.description && <DefRow label="Description">{c.description}</DefRow>}
        <DefRow label="Active Date Range">{dateRange}</DefRow>
        <DefRow label="Teams">
          {c.queues?.length ? c.queues.join(', ') : muted('Not set')}
        </DefRow>
        <DefRow label="Groups">All groups</DefRow>
        <DefRow label="Language">English (Default)</DefRow>
        <DefRow label="Interaction Length">
          Minimum {c.interactionLength ?? 2} mins
        </DefRow>
      </ConfigGroup>

      {/* 2. Suppression Rules */}
      <ConfigGroup num={2} title="Suppression Rules">
        <DefRow
          label="Opt-out tag"
          tooltip="When enabled, customers who have opted out of surveys are automatically excluded from receiving this campaign."
        >
          {c.suppressOptOut !== false ? 'Enabled' : 'Disabled'}
        </DefRow>
        <DefRow
          label="Recency window"
          tooltip="Prevents a customer from receiving this survey if they were already surveyed within the defined number of days. Reduces survey fatigue."
        >
          {c.suppressRecent !== false
            ? `Enabled · ${c.recentDays ?? 30} days`
            : 'Disabled'}
        </DefRow>
      </ConfigGroup>

      {/* 3. Topic AI Model & Survey Template */}
      <ConfigGroup num={3} title="Topic AI Model & Survey Template">
        <DefRow label="Topic AI Model">
          {aiModel ? aiModel.name : muted('Not configured')}
        </DefRow>
        <DefRow label="Survey Template">
          {survey ? survey.name : muted('Not configured')}
        </DefRow>
      </ConfigGroup>
    </div>
  )
}

// ── Working Copy change-diff modal ────────────────────────────────────── //

const MOCK_CHANGES = [
  { section: 'Volume & Sampling',                     field: 'Sampling Rate',     from: '50%',                     to: '65%' },
  { section: 'Suppression Rules',                     field: 'Recency Window',    from: '30 days',                 to: '14 days' },
  { section: 'Topic AI Model & Survey Template',      field: 'Survey Template',   from: 'Post-Chat CSAT',          to: 'NPS Pulse Survey' },
  { section: 'Campaign Identity & Scope',             field: 'Active Date Range', from: '2026-05-12 — 2026-12-31', to: '2026-05-12 — Ongoing' },
]

function ViewChangesModal({ campaign: c, onClose, onPublish }: {
  campaign: Campaign
  onClose: () => void
  onPublish: () => void
}) {
  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.40)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        width: 640, maxWidth: '92vw', maxHeight: '80vh',
        background: 'var(--lyra-color-bg-surface-overlay)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: '0px 24px 48px -12px rgba(16,24,40,0.32)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid var(--lyra-color-border-subtle)',
        }}>
          <div>
            <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 600, lineHeight: '24px', color: 'var(--lyra-color-fg-default)', letterSpacing: '-0.01rem' }}>
              What's changed in v{c.workingCopyVersion}
            </div>
            <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 400, lineHeight: '18px', color: 'var(--lyra-color-fg-secondary)', marginTop: 2 }}>
              Edited by {c.workingCopyEditedBy} · {c.workingCopyEditedAt}
              {' · '}Comparing v{c.publishedVersion} → v{c.workingCopyVersion}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 4, color: 'var(--lyra-color-fg-secondary)',
              display: 'flex', alignItems: 'center',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Change list */}
        <div style={{ overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {MOCK_CHANGES.map((row, i) => (
            <div key={i} style={{
              background: 'var(--lyra-color-bg-surface-shell)',
              border: '1px solid var(--lyra-color-border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
            }}>
              <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 500, color: 'var(--lyra-color-fg-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                {row.section}
              </div>
              <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 500, color: 'var(--lyra-color-fg-default)', marginBottom: 8 }}>
                {row.field}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                {/* From value */}
                <span style={{
                  display: 'inline-flex', alignItems: 'center',
                  padding: '2px 8px',
                  background: 'var(--lyra-color-status-critical-subtle)',
                  border: '1px solid rgba(189,42,42,0.20)',
                  borderRadius: 'var(--radius-xs)',
                  fontFamily: FONT, fontSize: 13, fontWeight: 400, lineHeight: '18px',
                  color: 'var(--lyra-color-status-critical-strong)',
                  textDecoration: 'line-through',
                }}>
                  {row.from}
                </span>
                {/* Arrow */}
                <svg viewBox="0 0 16 16" width="12" height="12" fill="none"
                  stroke="var(--lyra-color-fg-secondary)" strokeWidth="1.5" strokeLinecap="round">
                  <line x1="2" y1="8" x2="14" y2="8"/>
                  <polyline points="10 4 14 8 10 12"/>
                </svg>
                {/* To value */}
                <span style={{
                  display: 'inline-flex', alignItems: 'center',
                  padding: '2px 8px',
                  background: 'var(--lyra-color-status-success-subtle)',
                  border: '1px solid rgba(35,114,45,0.20)',
                  borderRadius: 'var(--radius-xs)',
                  fontFamily: FONT, fontSize: 13, fontWeight: 400, lineHeight: '18px',
                  color: 'var(--lyra-color-status-success-strong)',
                }}>
                  {row.to}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          gap: 8, padding: '16px 24px',
          borderTop: '1px solid var(--lyra-color-border-subtle)',
        }}>
          <button
            onClick={onClose}
            style={{
              background: 'var(--lyra-color-bg-surface-base)',
              color: 'var(--lyra-color-fg-default)',
              border: '1px solid var(--lyra-color-border-soft)',
              borderRadius: 'var(--radius-md)',
              padding: '0 16px', height: 36,
              fontFamily: FONT, fontSize: 14, fontWeight: 500,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center',
            }}
          >
            Close
          </button>
          <button
            onClick={() => { onClose(); onPublish() }}
            style={{
              background: 'var(--lyra-color-bg-primary)',
              color: 'var(--lyra-color-fg-on-primary)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '0 16px', height: 36,
              fontFamily: FONT, fontSize: 14, fontWeight: 500,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <Check size={14} />
            Publish V{c.workingCopyVersion}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Working copy banner ────────────────────────────────────────────────── //

function WorkingBanner({ campaign: c, onDiscard, onPublish, onViewChanges }: {
  campaign: Campaign
  onDiscard: () => void
  onPublish: () => void
  onViewChanges: () => void
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      margin: '0 32px 16px',
      padding: '14px 16px',
      background: 'linear-gradient(90deg, rgba(120,86,186,0.06) 0%, rgba(120,86,186,0.03) 100%)',
      border: '1px solid rgba(120,86,186,0.25)',
      borderRadius: 10,
    }}>
      {/* Pencil icon */}
      <div style={{
        width: 32, height: 32, borderRadius: 'var(--radius-md)',
        background: 'var(--lyra-purple-700)', color: 'var(--lyra-color-fg-inverse)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Pencil size={16} />
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: FONT, fontSize: 14, fontWeight: 500, lineHeight: '18px',
          color: 'var(--lyra-purple-700)', letterSpacing: 0,
        }}>
          This campaign has unpublished changes
        </div>
        <div style={{
          fontFamily: FONT, fontSize: 12, fontWeight: 400, lineHeight: '18px',
          color: 'var(--lyra-slate-900)', marginTop: 2,
        }}>
          Active version <strong>v{c.publishedVersion}</strong> (published {c.publishedAt}) continues to run.
          {' '}Working copy <strong>v{c.workingCopyVersion}</strong> was edited by {c.workingCopyEditedBy} on {c.workingCopyEditedAt}.{' '}
          <button
            onClick={onViewChanges}
            style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              fontFamily: FONT, fontSize: 12, fontWeight: 500, lineHeight: '18px',
              color: 'var(--lyra-purple-700)', textDecoration: 'underline',
            }}
          >
            View changes
          </button>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
        <button
          onClick={onDiscard}
          style={{
            background: 'none', border: '1px solid var(--lyra-color-border-soft)',
            borderRadius: 'var(--radius-md)',
            padding: '0 12px', height: 32,
            fontFamily: FONT, fontSize: 13, fontWeight: 500,
            color: 'var(--lyra-color-fg-default)',
            cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}
        >
          <Trash2 size={13} />
          Discard Changes
        </button>
        <button
          onClick={onPublish}
          style={{
            background: 'var(--lyra-color-bg-primary)',
            color: 'var(--lyra-color-fg-on-primary)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            padding: '0 12px', height: 32,
            fontFamily: FONT, fontSize: 13, fontWeight: 500,
            cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}
        >
          <Check size={13} />
          Publish V{c.workingCopyVersion}
        </button>
      </div>
    </div>
  )
}

// ── Toast notification ─────────────────────────────────────────────────── //

function Toast({ msg, onDismiss }: { msg: string; onDismiss: () => void }) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      zIndex: 900,
      display: 'flex', alignItems: 'center', gap: 10,
      background: 'var(--lyra-slate-900)',
      color: 'var(--lyra-color-fg-inverse)',
      borderRadius: 'var(--radius-lg)',
      padding: '10px 16px',
      boxShadow: 'var(--sol-effect-shadowlg)',
      fontFamily: FONT, fontSize: 13, fontWeight: 400, lineHeight: '18px',
      minWidth: 320, maxWidth: 520,
      pointerEvents: 'all',
    }}>
      {/* Check icon */}
      <span style={{
        width: 20, height: 20, borderRadius: '50%',
        background: 'var(--lyra-color-status-success-strong)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <svg viewBox="0 0 16 16" width="11" height="11" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round">
          <polyline points="3 8.5 6.5 12 13 5"/>
        </svg>
      </span>
      <span style={{ flex: 1 }}>{msg}</span>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(255,255,255,0.60)',
          display: 'flex', alignItems: 'center', padding: 2,
        }}
      >
        <X size={14} />
      </button>
    </div>
  )
}

// ── CampaignDetail — main export ────────────────────────────────────────── //

export interface CampaignDetailProps {
  campaign: Campaign
  onBack: () => void
  onEdit: (c: Campaign) => void
}

export function CampaignDetail({ campaign: initialCampaign, onBack, onEdit }: CampaignDetailProps) {
  const [c, setC] = useState<Campaign>(initialCampaign)
  const [toast, setToast] = useState<string | null>(null)
  const [showChanges, setShowChanges] = useState(false)

  // Auto-dismiss toast after 3 s
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  // Sync when parent passes a new campaign (e.g., after edit saves)
  useEffect(() => {
    setC(initialCampaign)
  }, [initialCampaign])

  const publishWorkingCopy = () => {
    setC(prev => ({
      ...prev,
      hasWorkingCopy: false,
      publishedVersion: prev.workingCopyVersion,
      publishedAt: 'Jun 18, 2026',
    }))
    setToast(`Working copy published as v${c.workingCopyVersion}. Campaign is now live with new configuration.`)
  }

  const discardWorkingCopy = () => {
    if (!window.confirm(`Discard all unpublished changes? The campaign will return to v${c.publishedVersion}.`)) return
    setC(prev => ({ ...prev, hasWorkingCopy: false }))
    setToast(`Working copy discarded. v${c.publishedVersion} remains active.`)
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      flex: 1, overflow: 'hidden',
      background: 'var(--lyra-color-bg-surface-base)',
    }}>
      {/* ── Breadcrumb ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '12px 32px 0',
        fontFamily: FONT, fontSize: 12, fontWeight: 400, lineHeight: '16px',
        letterSpacing: '0.01rem', color: 'var(--lyra-color-fg-secondary)',
        borderBottom: 'none',
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            fontFamily: FONT, fontSize: 12, fontWeight: 400,
            color: 'var(--lyra-color-fg-secondary)',
          }}
        >
          Survey Campaigns
        </button>
        <span style={{ opacity: 0.5 }}>/</span>
        <span style={{ color: 'var(--lyra-color-fg-default)', fontWeight: 500 }}>{c.name}</span>
      </div>

      {/* ── Page header ── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        minHeight: 72,
        padding: '6px 32px 16px',
        gap: 40,
        borderBottom: '1px solid var(--lyra-color-border-subtle)',
      }}>
        <h1 style={{
          flex: 1, margin: 0,
          fontFamily: FONT, fontSize: 20, fontWeight: 600,
          lineHeight: '24px', letterSpacing: '-0.01rem',
          color: 'var(--lyra-color-fg-default)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {c.name}
        </h1>
        {/* Edit action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button
            onClick={() => onEdit(c)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'var(--lyra-color-bg-surface-base)',
              color: 'var(--lyra-color-fg-default)',
              border: '1px solid var(--lyra-color-border-soft)',
              borderRadius: 'var(--radius-md)',
              padding: '0 16px', height: 36,
              fontFamily: FONT, fontSize: 14, fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <Pencil size={14} />
            Edit Campaign
          </button>
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

        {/* Meta row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '24px 32px',
        }}>
          {/* Left: owner / created / updated / state */}
          <div style={{
            flex: 1,
            fontFamily: FONT, fontSize: 14, fontWeight: 400, lineHeight: '20px',
            color: 'var(--lyra-color-fg-secondary)',
          }}>
            <strong style={{ color: 'var(--lyra-color-fg-default)', fontWeight: 500 }}>Owner:</strong>{' '}{c.owner}
            <span style={{ margin: '0 8px' }}>•</span>
            <strong style={{ color: 'var(--lyra-color-fg-default)', fontWeight: 500 }}>Created:</strong>{' '}{c.created}
            <span style={{ margin: '0 8px' }}>•</span>
            <strong style={{ color: 'var(--lyra-color-fg-default)', fontWeight: 500 }}>Last Updated:</strong>{' '}{c.updated}
            {c.status !== 'expired' && (
              <>
                <span style={{ margin: '0 8px' }}>•</span>
                <CampaignStateInline status={c.status} hasWorkingCopy={c.hasWorkingCopy} />
              </>
            )}
          </div>
          {/* Right: status pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 500, color: 'var(--lyra-color-fg-secondary)' }}>
              Campaign Status
            </span>
            <StatusPill s={c.status} />
          </div>
        </div>

        {/* Working copy banner */}
        {c.hasWorkingCopy && (
          <WorkingBanner
            campaign={c}
            onDiscard={discardWorkingCopy}
            onPublish={publishWorkingCopy}
            onViewChanges={() => setShowChanges(true)}
          />
        )}

        {/* View changes modal */}
        {showChanges && (
          <ViewChangesModal
            campaign={c}
            onClose={() => setShowChanges(false)}
            onPublish={publishWorkingCopy}
          />
        )}

        {/* Detail layout: main content + sidebar */}
        <div style={{
          flex: 1,
          display: 'flex', alignItems: 'flex-start',
          gap: 24,
          padding: '20px 32px 32px',
          background: 'var(--lyra-color-bg-surface-canvas)',
        }}>
          {/* Main: ConfigurationView */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <ConfigurationView campaign={c} />
          </div>

          {/* Sidebar */}
          <aside style={{ flex: '0 0 280px' }}>
            <CampaignSummaryCard campaign={c} />
          </aside>
        </div>

      </div>{/* /scrollable body */}

      {/* ── Bottom action bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
        gap: 8, padding: '12px 32px',
        borderTop: '1px solid var(--lyra-color-border-subtle)',
        background: 'var(--lyra-color-bg-surface-base)',
        flexShrink: 0,
      }}>
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'var(--lyra-color-bg-surface-base)',
            color: 'var(--lyra-color-fg-default)',
            border: '1px solid var(--lyra-color-border-soft)',
            borderRadius: 'var(--radius-md)',
            padding: '0 16px', height: 36,
            fontFamily: FONT, fontSize: 14, fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          ← Back
        </button>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <Toast msg={toast} onDismiss={() => setToast(null)} />
      )}
    </div>
  )
}
