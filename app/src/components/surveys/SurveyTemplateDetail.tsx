// SurveyTemplateDetail — read-only detail view for a survey template.
// Port of SurveyTemplateDetail from prototype.html §9600–9731.
// Uses only Lyra CSS custom-property tokens; no hardcoded colours.

import { useState } from 'react'
import { ChevronDown, ChevronRight, Pencil } from 'lucide-react'
import type { SurveyDesignTemplate } from '../../types'
import { CAMPAIGNS } from '../../data/campaigns'
import { StatusPill } from '../campaigns/StatusPill'

// ---------------------------------------------------------------------------
// DefRow — label/value pair inside a config accordion.
// ---------------------------------------------------------------------------

function DefRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '180px 1fr',
        gap: 'var(--space-4)',
        padding: '8px 0',
        borderBottom: '1px solid var(--lyra-color-border-subtle)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <div
        style={{
          font: '500 13px/18px var(--font-sans)',
          color: 'var(--lyra-color-fg-secondary)',
          paddingRight: 'var(--space-3)',
        }}
      >
        {label}
      </div>
      <div style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>
        {children}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// TemplateConfigGroup — collapsible accordion section (mirrors ConfigGroup).
// ---------------------------------------------------------------------------

function TemplateConfigGroup({
  title,
  num,
  children,
  defaultOpen = true,
}: {
  title: string
  num: number
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section
      style={{
        background: 'var(--lyra-color-bg-surface-base)',
        border: '1px solid var(--lyra-color-border-soft)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--sol-effect-shadowsm)',
        overflow: 'hidden',
      }}
    >
      <header
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          padding: '14px var(--space-6)',
          cursor: 'pointer',
          borderBottom: open ? '1px solid var(--lyra-color-border-subtle)' : 'none',
          userSelect: 'none',
        }}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(o => !o) } }}
        tabIndex={0}
        role="button"
        aria-expanded={open}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 22,
            height: 22,
            borderRadius: 'var(--radius-full)',
            background: 'var(--lyra-color-bg-primary)',
            color: 'var(--lyra-color-fg-on-primary)',
            font: '500 12px/14px var(--font-sans)',
            flexShrink: 0,
          }}
        >
          {num}
        </span>
        <span
          style={{
            flex: 1,
            font: '500 14px/20px var(--font-sans)',
            color: 'var(--lyra-color-fg-default)',
          }}
        >
          {title}
        </span>
        {open
          ? <ChevronDown size={16} style={{ color: 'var(--lyra-color-fg-secondary)', flexShrink: 0 }} />
          : <ChevronRight size={16} style={{ color: 'var(--lyra-color-fg-secondary)', flexShrink: 0 }} />}
      </header>
      {open && (
        <div style={{ padding: '0 var(--space-6) var(--space-5)' }}>
          {children}
        </div>
      )}
    </section>
  )
}

// ---------------------------------------------------------------------------
// LinkedCampaignRow — single row in the linked campaigns mini-table.
// ---------------------------------------------------------------------------

function LinkedCampaignRow({
  campaign,
  isLast,
}: {
  campaign: typeof CAMPAIGNS[number]
  isLast: boolean
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 140px',
        alignItems: 'center',
        padding: '14px var(--space-5)',
        borderBottom: isLast ? 'none' : '1px solid var(--lyra-color-border-subtle)',
        background: 'var(--lyra-color-bg-surface-base)',
      }}
    >
      <div>
        <div style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>
          {campaign.name}
        </div>
      </div>
      <div>
        <StatusPill s={campaign.status} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// SurveyTemplateDetail
// ---------------------------------------------------------------------------

const WELCOME_LABEL: Record<string, string> = {
  'with-optout': 'Invitation with Opt Out',
  'without-optout': 'Invitation without Opt Out',
  none: 'None',
}

export interface SurveyTemplateDetailProps {
  design: SurveyDesignTemplate
  onBack: () => void
  onEdit: (d: SurveyDesignTemplate) => void
}

export function SurveyTemplateDetail({ design: d, onBack, onEdit }: SurveyTemplateDetailProps) {
  // Find campaigns that use this template (exclude draft / inactive).
  const linkedCampaigns = CAMPAIGNS.filter(
    c => c.surveyDesignId === d.id && c.status !== 'inactive',
  )

  const FONT = 'var(--font-sans)'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        background: 'var(--lyra-color-bg-surface-base)',
        fontFamily: FONT,
      }}
    >
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '10px 24px',
          borderBottom: '1px solid var(--lyra-color-border-subtle)',
          font: '400 13px/18px var(--font-sans)',
          color: 'var(--lyra-color-fg-secondary)',
          flexShrink: 0,
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            font: '400 13px/18px var(--font-sans)',
            color: 'var(--lyra-color-fg-link)',
          }}
          onFocus={e => {
            (e.currentTarget).style.outline = '2px solid var(--lyra-color-border-focus-default)'
            ;(e.currentTarget).style.outlineOffset = '2px'
            ;(e.currentTarget).style.borderRadius = '2px'
          }}
          onBlur={e => { (e.currentTarget).style.outline = '' }}
        >
          Survey Templates
        </button>
        <ChevronRight size={12} aria-hidden="true" />
        <span style={{ color: 'var(--lyra-color-fg-default)' }}>{d.name}</span>
      </nav>

      {/* Page header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '16px 24px',
          borderBottom: '1px solid var(--lyra-color-border-subtle)',
          flexShrink: 0,
        }}
      >
        <h1
          style={{
            flex: 1,
            margin: 0,
            font: '600 20px/24px var(--font-sans)',
            letterSpacing: '-0.01em',
            color: 'var(--lyra-color-fg-default)',
          }}
        >
          {d.name}
        </h1>
        <button
          onClick={() => onEdit(d)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            height: 36,
            padding: '0 16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--lyra-color-border-soft)',
            background: 'var(--lyra-color-bg-surface-base)',
            color: 'var(--lyra-color-fg-default)',
            font: '500 14px/20px var(--font-sans)',
            cursor: 'pointer',
            transition: 'background 120ms',
          }}
          onMouseEnter={e => { (e.currentTarget).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
          onMouseLeave={e => { (e.currentTarget).style.background = 'var(--lyra-color-bg-surface-base)' }}
          onFocus={e => {
            (e.currentTarget).style.outline = '2px solid var(--lyra-color-border-focus-default)'
            ;(e.currentTarget).style.outlineOffset = '2px'
          }}
          onBlur={e => { (e.currentTarget).style.outline = '' }}
        >
          <Pencil size={14} aria-hidden="true" />
          Edit
        </button>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* Meta row */}
        {(d.owner || d.updated) && (
          <div
            style={{
              padding: '16px 32px',
              font: '400 14px/20px var(--font-sans)',
              color: 'var(--lyra-color-fg-secondary)',
            }}
          >
            {d.owner && (
              <>
                <strong style={{ color: 'var(--lyra-color-fg-default)', fontWeight: 500 }}>Owner:</strong>{' '}
                {d.owner}
              </>
            )}
            {d.owner && d.updated && (
              <span style={{ margin: '0 8px' }}>•</span>
            )}
            {d.updated && (
              <>
                <strong style={{ color: 'var(--lyra-color-fg-default)', fontWeight: 500 }}>Last Updated:</strong>{' '}
                {d.updated}
              </>
            )}
          </div>
        )}

        {/* Config accordion stack */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
            padding: '0 32px 32px',
          }}
        >

          {/* 1 — Identity */}
          <TemplateConfigGroup title="Identity" num={1}>
            <DefRow label="Template Name">{d.name}</DefRow>
            {d.description ? (
              <DefRow label="Description">{d.description}</DefRow>
            ) : (
              <DefRow label="Description">
                <span style={{ color: 'var(--lyra-color-fg-secondary)', fontStyle: 'italic' }}>Not set</span>
              </DefRow>
            )}
          </TemplateConfigGroup>

          {/* 2 — Survey Content */}
          <TemplateConfigGroup title="Survey Content" num={2}>
            {/* Channel sub-section */}
            <div style={{ marginTop: 'var(--space-4)', marginBottom: 'var(--space-2)' }}>
              <div
                style={{
                  font: '500 11px/14px var(--font-sans)',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: 'var(--lyra-color-fg-secondary)',
                  marginBottom: 'var(--space-1)',
                }}
              >
                Channel
              </div>
              <DefRow label="Survey Channel">{d.channel ?? d.channels ?? 'Digital'}</DefRow>
            </div>

            {/* Welcome Message sub-section */}
            <div style={{ marginTop: 28, marginBottom: 'var(--space-2)' }}>
              <div
                style={{
                  font: '500 11px/14px var(--font-sans)',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: 'var(--lyra-color-fg-secondary)',
                  marginBottom: 'var(--space-1)',
                }}
              >
                Welcome Message
              </div>
              <DefRow label="Message Mode">
                {d.welcomeMode ? WELCOME_LABEL[d.welcomeMode] ?? d.welcomeMode : 'Not configured'}
              </DefRow>
              {d.welcomeMode && d.welcomeMode !== 'none' && d.welcomeMessage && (
                <DefRow label="Invitation Text">{d.welcomeMessage}</DefRow>
              )}
              {d.welcomeMode && d.welcomeMode !== 'none' && d.buttonToStart && (
                <DefRow label="Start Button Label">{d.buttonToStart}</DefRow>
              )}
              {d.welcomeMode === 'with-optout' && d.buttonToOptOut && (
                <DefRow label="Opt-out Button Label">{d.buttonToOptOut}</DefRow>
              )}
            </div>

            {/* Rating Format sub-section */}
            {(d.displayStyle || d.defaultScaleQuestion) && (
              <div style={{ marginTop: 28, marginBottom: 'var(--space-2)' }}>
                <div
                  style={{
                    font: '500 11px/14px var(--font-sans)',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: 'var(--lyra-color-fg-secondary)',
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  Rating Format
                </div>
                {d.displayStyle && <DefRow label="Display Style">{d.displayStyle}</DefRow>}
                {d.listPickerLabel && <DefRow label="List Picker Label">{d.listPickerLabel}</DefRow>}
                {d.defaultScaleQuestion && (
                  <DefRow label="Rating Question">{d.defaultScaleQuestion}</DefRow>
                )}
                {d.defaultCommentQuestion && (
                  <DefRow label="Follow-up Question">{d.defaultCommentQuestion}</DefRow>
                )}
              </div>
            )}
          </TemplateConfigGroup>

          {/* 3 — Linked Campaigns */}
          <TemplateConfigGroup title="Linked Campaigns" num={3}>
            {d.isDefault ? (
              <EmptyLinked message="No campaigns linked yet" note="Save this template first, then go to a Campaign and select this template to link it. Linked campaigns will appear here automatically." />
            ) : linkedCampaigns.length === 0 ? (
              <EmptyLinked message="No campaigns linked" note="No active campaigns are using this template." />
            ) : (
              <div
                style={{
                  border: '1px solid var(--lyra-color-border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  boxShadow: 'var(--sol-effect-shadowsm)',
                  marginTop: 'var(--space-4)',
                }}
              >
                {/* Header row */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 140px',
                    padding: '8px var(--space-5)',
                    background: 'var(--lyra-slate-100)',
                    borderBottom: '1px solid var(--lyra-color-border-subtle)',
                  }}
                >
                  {(['Campaign', 'Status'] as const).map(h => (
                    <span
                      key={h}
                      style={{
                        font: '500 12px/16px var(--font-sans)',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: 'var(--lyra-color-fg-secondary)',
                      }}
                    >
                      {h}
                    </span>
                  ))}
                </div>
                {linkedCampaigns.map((c, i) => (
                  <LinkedCampaignRow
                    key={c.id}
                    campaign={c}
                    isLast={i === linkedCampaigns.length - 1}
                  />
                ))}
              </div>
            )}
          </TemplateConfigGroup>

        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 24px',
          borderTop: '1px solid var(--lyra-color-border-subtle)',
          flexShrink: 0,
          gap: 8,
        }}
      >
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            height: 36,
            padding: '0 16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--lyra-color-border-soft)',
            background: 'var(--lyra-color-bg-surface-base)',
            color: 'var(--lyra-color-fg-default)',
            font: '500 14px/20px var(--font-sans)',
            cursor: 'pointer',
            transition: 'background 120ms',
          }}
          onMouseEnter={e => { (e.currentTarget).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
          onMouseLeave={e => { (e.currentTarget).style.background = 'var(--lyra-color-bg-surface-base)' }}
          onFocus={e => {
            (e.currentTarget).style.outline = '2px solid var(--lyra-color-border-focus-default)'
            ;(e.currentTarget).style.outlineOffset = '2px'
          }}
          onBlur={e => { (e.currentTarget).style.outline = '' }}
        >
          ← Back
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// EmptyLinked — empty state for the linked campaigns section.
// ---------------------------------------------------------------------------

function EmptyLinked({ message, note }: { message: string; note: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 32px',
        textAlign: 'center',
        background: 'var(--lyra-slate-50)',
        borderRadius: 'var(--radius-md)',
        border: '1px dashed var(--lyra-color-border-soft)',
        marginTop: 'var(--space-4)',
      }}
    >
      <svg
        viewBox="0 0 24 24"
        width="32"
        height="32"
        fill="none"
        stroke="var(--lyra-slate-400)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ marginBottom: 12 }}
      >
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
      </svg>
      <p
        style={{
          font: '500 14px/20px var(--font-sans)',
          color: 'var(--lyra-color-fg-default)',
          margin: '0 0 6px',
        }}
      >
        {message}
      </p>
      <p
        style={{
          font: '400 13px/18px var(--font-sans)',
          color: 'var(--lyra-color-fg-secondary)',
          margin: 0,
          maxWidth: 400,
        }}
      >
        {note}
      </p>
    </div>
  )
}
