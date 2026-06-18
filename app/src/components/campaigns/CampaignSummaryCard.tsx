// CampaignSummaryCard — right-rail sidebar card shown in CampaignDetail.
// Mirrors the .summary-card pattern from prototype.html (line ~9060).
// CSS classes: summary-card, summary-card-head, summary-card-rows,
//              summary-card-row, summary-card-icon, summary-card-row-body,
//              summary-card-label, summary-card-value
// All of these are emitted as inline styles here so no global CSS is needed.

import type { Campaign } from '../../types'

// ── Icon primitives ────────────────────────────────────────────────────── //

function IconCalendar() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="2" y="3" width="12" height="11" rx="1.5"/>
      <line x1="5" y1="1.5" x2="5" y2="4.5"/>
      <line x1="11" y1="1.5" x2="11" y2="4.5"/>
      <line x1="2" y1="7" x2="14" y2="7"/>
    </svg>
  )
}

function IconAgents() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="6" cy="5" r="2"/>
      <path d="M1 13c0-2.2 1.8-4 4-4h2"/>
      <circle cx="11.5" cy="6" r="2"/>
      <path d="M8 13.5c0-1.9 1.6-3.5 3.5-3.5s3.5 1.6 3.5 3.5"/>
    </svg>
  )
}

// ── Inline style tokens ────────────────────────────────────────────────── //

const FONT = 'var(--lyra-font-sans)'

const cardStyle: React.CSSProperties = {
  background: 'var(--lyra-color-bg-surface-base)',
  border: '1px solid var(--lyra-color-border-subtle)',
  borderRadius: 'var(--radius-lg)',
  overflow: 'hidden',
  boxShadow: 'var(--sol-effect-shadowsm)',
}

const headStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontFamily: FONT,
  fontSize: 12,
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.07em',
  color: 'var(--lyra-color-fg-default)',
  background: 'var(--lyra-color-bg-surface-shell)',
  borderBottom: '1px solid var(--lyra-color-border-subtle)',
}

const rowsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 12,
  padding: '12px 16px',
  borderTop: '1px solid var(--lyra-color-border-subtle)',
}

const iconStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--lyra-color-bg-surface-shell)',
  border: '1px solid var(--lyra-color-border-subtle)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--lyra-color-fg-action)',
}

const rowBodyStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
  minWidth: 0,
}

const labelStyle: React.CSSProperties = {
  fontFamily: FONT,
  fontSize: 11,
  fontWeight: 500,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  color: 'var(--lyra-color-fg-secondary)',
  lineHeight: '16px',
}

const valueStyle: React.CSSProperties = {
  fontFamily: FONT,
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--lyra-color-fg-default)',
  lineHeight: '18px',
  wordBreak: 'break-word',
}

// ── Component ─────────────────────────────────────────────────────────── //

interface SummaryRow {
  icon: React.ReactNode
  label: string
  value: string
}

interface CampaignSummaryCardProps {
  campaign: Campaign
}

export function CampaignSummaryCard({ campaign: c }: CampaignSummaryCardProps) {
  const agentTeams = c.queues?.length ? c.queues.join(', ') : 'Not set'
  const agentGroups = 'All groups'

  const dateRange = c.startDate
    ? c.ongoing
      ? `Ongoing from ${c.startDate}`
      : c.endDate
      ? `${c.startDate} — ${c.endDate}`
      : `${c.startDate} — No end date`
    : c.endDate
    ? `${c.created} — ${c.endDate}`
    : `Ongoing from ${c.created}`

  const rows: SummaryRow[] = [
    {
      icon: <IconCalendar />,
      label: 'Active Date Range',
      value: dateRange,
    },
    {
      icon: <IconAgents />,
      label: 'Teams',
      value: agentTeams,
    },
    {
      icon: <IconAgents />,
      label: 'Groups',
      value: agentGroups,
    },
  ]

  return (
    <div style={cardStyle}>
      <div style={headStyle}>Campaign Summary</div>
      <div style={rowsStyle}>
        {rows.map((r, i) => (
          <div key={r.label} style={{ ...rowStyle, borderTop: i === 0 ? 'none' : '1px solid var(--lyra-color-border-subtle)' }}>
            <div style={iconStyle}>{r.icon}</div>
            <div style={rowBodyStyle}>
              <div style={labelStyle}>{r.label}</div>
              <div style={valueStyle}>{r.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
