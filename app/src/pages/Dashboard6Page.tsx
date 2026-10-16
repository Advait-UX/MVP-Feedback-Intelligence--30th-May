import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, ArrowRight, Calendar, Check, ChevronDown, ChevronRight, Lightbulb, Search, TrendingDown, TrendingUp } from 'lucide-react'
import { ProgramsTableCard } from '../components/feedback-intelligence/ProgramsTableCard'
import { MultiSelectField } from '../components/campaign-wizard/WizardPrimitives'

const FONT = 'var(--font-sans)'

// Dashboard 4 filter-bar treatment, per Figma spec (node 1766-17145): 8px radius, border-strong outline.
const FILTER_BORDER = 'var(--lyra-color-border-strong)'
const FILTER_RADIUS = 'var(--radius-md)'

function FilterSearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div style={{ position: 'relative', width: 240, height: 32, flexShrink: 0 }}>
      <Search
        size={16}
        style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--lyra-color-fg-secondary)', pointerEvents: 'none' }}
      />
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', height: '100%', boxSizing: 'border-box',
          paddingLeft: 36, paddingRight: 12,
          background: 'var(--lyra-color-bg-field)',
          border: `1px solid ${FILTER_BORDER}`, borderRadius: FILTER_RADIUS,
          font: `400 14px/20px ${FONT}`, color: value ? 'var(--lyra-color-fg-default)' : 'var(--lyra-color-fg-secondary)',
          outline: 'none',
        }}
        onFocus={e => { e.currentTarget.style.borderColor = 'var(--lyra-color-border-focus-default)'; e.currentTarget.style.boxShadow = 'var(--sol-effect-activering)' }}
        onBlur={e => { e.currentTarget.style.borderColor = FILTER_BORDER; e.currentTarget.style.boxShadow = '' }}
      />
    </div>
  )
}

/* ── Data ── */
type Channel = 'SMS' | 'WhatsApp' | 'Chat'
const CHANNEL_OPTIONS: Channel[] = ['SMS', 'WhatsApp', 'Chat']

const CATEGORY_OPTIONS = [
  'Customer Effort', 'Service Quality', 'Loyalty & Membership', 'Product Experience',
  'Digital Experience', 'Premium Experience', 'Onboarding', 'Post-Purchase',
  'Service Disruption', 'Retention', 'Billing & Payments', 'Self-Service',
]

type Program = {
  n: string; cat: string; active: boolean
  ch: Record<Channel, number>
  inter: number; eligR: number; covR: number; respR: number; compR: number
  csat: number; alerts: number
  /** Period-over-period momentum multiplier applied to the base deltas. */
  trend: number
}

// Baseline volumes are for a 7-day window; other ranges scale by day count.
const BASELINE_DAYS = 7

const PROGRAMS: Program[] = [
  { n: 'Flight Disruption Recovery', cat: 'Service Disruption', active: true, ch: { SMS: 0.4, WhatsApp: 0.4, Chat: 0.2 }, inter: 3120, eligR: 0.34, covR: 0.91, respR: 0.56, compR: 0.68, csat: 79, alerts: 3, trend: 1.1 },
  { n: 'Baggage Claim Follow-up', cat: 'Service Disruption', active: true, ch: { SMS: 0.5, WhatsApp: 0.3, Chat: 0.2 }, inter: 2140, eligR: 0.31, covR: 0.88, respR: 0.49, compR: 0.62, csat: 72, alerts: 4, trend: 0.7 },
  { n: 'Loyalty Tier Check-in', cat: 'Loyalty & Membership', active: true, ch: { SMS: 0.3, WhatsApp: 0.3, Chat: 0.4 }, inter: 1260, eligR: 0.36, covR: 0.92, respR: 0.58, compR: 0.71, csat: 84, alerts: 1, trend: 1.3 },
  { n: 'General Inquiry Pulse', cat: 'Customer Effort', active: true, ch: { SMS: 0.4, WhatsApp: 0.2, Chat: 0.4 }, inter: 2480, eligR: 0.32, covR: 0.89, respR: 0.52, compR: 0.64, csat: 75, alerts: 3, trend: 0.9 },
  { n: 'Post-Call CSAT', cat: 'Service Quality', active: true, ch: { SMS: 0.6, WhatsApp: 0.3, Chat: 0.1 }, inter: 2960, eligR: 0.33, covR: 0.9, respR: 0.54, compR: 0.66, csat: 77, alerts: 2, trend: 1.0 },
  { n: 'First Contact Resolution', cat: 'Customer Effort', active: true, ch: { SMS: 0.3, WhatsApp: 0.4, Chat: 0.3 }, inter: 1720, eligR: 0.3, covR: 0.86, respR: 0.47, compR: 0.6, csat: 70, alerts: 4, trend: -0.5 },
  { n: 'Proactive Delay Alert', cat: 'Service Disruption', active: true, ch: { SMS: 0.7, WhatsApp: 0.3, Chat: 0 }, inter: 1380, eligR: 0.35, covR: 0.93, respR: 0.57, compR: 0.69, csat: 80, alerts: 1, trend: 1.2 },
  { n: 'VIP Passenger Survey', cat: 'Premium Experience', active: true, ch: { SMS: 0.2, WhatsApp: 0.5, Chat: 0.3 }, inter: 640, eligR: 0.38, covR: 0.94, respR: 0.62, compR: 0.74, csat: 86, alerts: 0, trend: 1.4 },
  { n: 'New Member Onboarding', cat: 'Onboarding', active: true, ch: { SMS: 0.3, WhatsApp: 0.3, Chat: 0.4 }, inter: 980, eligR: 0.33, covR: 0.9, respR: 0.5, compR: 0.63, csat: 76, alerts: 2, trend: 0.8 },
  { n: 'Cancellation Recovery', cat: 'Retention', active: true, ch: { SMS: 0.4, WhatsApp: 0.4, Chat: 0.2 }, inter: 1120, eligR: 0.29, covR: 0.85, respR: 0.45, compR: 0.58, csat: 68, alerts: 3, trend: -0.8 },
  { n: 'Lounge Experience Feedback', cat: 'Premium Experience', active: false, ch: { SMS: 0.2, WhatsApp: 0.4, Chat: 0.4 }, inter: 560, eligR: 0.37, covR: 0.92, respR: 0.6, compR: 0.72, csat: 83, alerts: 0, trend: 0.6 },
  { n: 'Mobile App Feedback', cat: 'Digital Experience', active: true, ch: { SMS: 0.2, WhatsApp: 0.3, Chat: 0.5 }, inter: 1340, eligR: 0.34, covR: 0.9, respR: 0.53, compR: 0.65, csat: 74, alerts: 2, trend: 1.0 },
  { n: 'In-Flight Service Quality', cat: 'Service Quality', active: true, ch: { SMS: 0.5, WhatsApp: 0.3, Chat: 0.2 }, inter: 860, eligR: 0.32, covR: 0.88, respR: 0.51, compR: 0.64, csat: 78, alerts: 1, trend: 0.9 },
  { n: 'Ground Staff Interaction', cat: 'Service Quality', active: true, ch: { SMS: 0.5, WhatsApp: 0.2, Chat: 0.3 }, inter: 720, eligR: 0.31, covR: 0.87, respR: 0.5, compR: 0.63, csat: 73, alerts: 1, trend: 0.7 },
  { n: 'Special Assistance Feedback', cat: 'Customer Effort', active: false, ch: { SMS: 0.3, WhatsApp: 0.3, Chat: 0.4 }, inter: 640, eligR: 0.36, covR: 0.91, respR: 0.59, compR: 0.7, csat: 82, alerts: 0, trend: 0.5 },
]

const PROGRAM_OPTIONS = PROGRAMS.map(p => p.n)

// Period-over-period change at trend = 1. Counts in %, rates in pp.
const BASE_DELTAS = { inter: 13, elig: 8, sent: 4, rec: 2, comp: 9, part: -6, csat: 3, alerts: -2, eligR: 3, covR: 8, respR: 4, compR: 5 }

const fmt = (n: number) => Math.round(n).toLocaleString('en-US')
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0)

/* ── Date range ── */
type DatePreset = 'last7' | 'currentMonth' | 'lastMonth' | 'custom'

const PRESET_LABELS: Record<DatePreset, string> = {
  last7: 'Last 7 Days',
  currentMonth: 'Current Month',
  lastMonth: 'Last Month',
  custom: 'Custom Date Range',
}

function fmtShort(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function rangeForPreset(preset: DatePreset): { start: Date; end: Date } | null {
  const now = new Date()
  if (preset === 'last7') {
    const start = new Date(now)
    start.setDate(start.getDate() - 6)
    return { start, end: now }
  }
  if (preset === 'currentMonth') {
    return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now }
  }
  if (preset === 'lastMonth') {
    return { start: new Date(now.getFullYear(), now.getMonth() - 1, 1), end: new Date(now.getFullYear(), now.getMonth(), 0) }
  }
  return null
}

function daysInRange(r: { start: Date; end: Date } | null) {
  if (!r) return BASELINE_DAYS
  const ms = r.end.getTime() - r.start.getTime()
  return Math.max(1, Math.round(ms / 86400000) + 1)
}

function DateRangePresetField({
  preset, onPresetChange, customStart, customEnd, onCustomChange,
}: {
  preset: DatePreset
  onPresetChange: (p: DatePreset) => void
  customStart: string
  customEnd: string
  onCustomChange: (start: string, end: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const computed = rangeForPreset(preset)
  const label = preset === 'custom'
    ? (customStart && customEnd
        ? `${fmtShort(new Date(customStart + 'T00:00:00'))} - ${fmtShort(new Date(customEnd + 'T00:00:00'))}`
        : 'Custom Date Range')
    : computed
      ? `${fmtShort(computed.start)} - ${fmtShort(computed.end)}`
      : PRESET_LABELS[preset]

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'relative', display: 'flex', alignItems: 'center', height: 36,
          paddingLeft: 12, paddingRight: 12, width: 177, boxSizing: 'border-box',
          background: 'var(--lyra-color-bg-field)',
          border: `1px solid ${open ? 'var(--lyra-color-border-active)' : FILTER_BORDER}`,
          borderRadius: FILTER_RADIUS, cursor: 'pointer',
        }}
      >
        <span style={{
          flex: 1, textAlign: 'left', font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {label}
        </span>
        <Calendar size={16} style={{ color: 'var(--lyra-color-fg-secondary)', flexShrink: 0 }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 200,
          width: 240,
          background: 'var(--lyra-color-bg-surface-overlay)',
          border: '1px solid var(--lyra-color-border-soft)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--sol-effect-shadowlg)',
          padding: 'var(--space-2) 0',
        }}>
          {(Object.keys(PRESET_LABELS) as DatePreset[]).map(key => {
            const selected = preset === key
            return (
              <div
                key={key}
                onMouseDown={() => {
                  onPresetChange(key)
                  if (key !== 'custom') setOpen(false)
                }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                  padding: 'var(--space-2) var(--space-4)', cursor: 'pointer',
                  font: `400 14px/20px ${FONT}`,
                  color: selected ? 'var(--lyra-color-fg-active-strong)' : 'var(--lyra-color-fg-default)',
                  background: selected ? 'var(--lyra-color-bg-active-subtle)' : 'transparent',
                }}
                onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
                onMouseLeave={e => { if (!selected) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                {PRESET_LABELS[key]}
                {selected && <Check size={14} style={{ color: 'var(--lyra-color-fg-active-strong)' }} />}
              </div>
            )
          })}
          {preset === 'custom' && (
            <div style={{ padding: 'var(--space-2) var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', borderTop: '1px solid var(--lyra-color-border-subtle)', marginTop: 'var(--space-1)' }}>
              {([['Start date', customStart, (v: string) => onCustomChange(v, customEnd)], ['End date', customEnd, (v: string) => onCustomChange(customStart, v)]] as const).map(([lbl, val, set]) => (
                <label key={lbl} style={{ font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>
                  {lbl}
                  <input
                    type="date"
                    value={val}
                    onChange={e => set(e.target.value)}
                    style={{
                      display: 'block', width: '100%', marginTop: 4, boxSizing: 'border-box',
                      font: `400 13px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)',
                      background: 'var(--lyra-color-bg-field)', border: '1px solid var(--lyra-color-border-soft)',
                      borderRadius: 'var(--radius-sm)', padding: '6px 8px',
                    }}
                  />
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Sliced data ── */
function useSlicedData(f: { search: string; programs: string[]; channels: string[]; categories: string[]; days: number }) {
  return useMemo(() => {
    const q = f.search.trim().toLowerCase()
    const dayScale = f.days / BASELINE_DAYS
    const rows = PROGRAMS
      .filter(p => (!q || p.n.toLowerCase().includes(q))
        && (f.programs.length === 0 || f.programs.includes(p.n))
        && (f.categories.length === 0 || f.categories.includes(p.cat)))
      .map(p => {
        const chShare = f.channels.length === 0 ? 1 : f.channels.reduce((a, c) => a + (p.ch[c as Channel] ?? 0), 0)
        if (chShare <= 0) return null
        const inter = p.inter * chShare * dayScale
        const elig = inter * p.eligR, sent = elig * p.covR, rec = sent * p.respR, comp = rec * p.compR
        return { ...p, inter, elig, sent, rec, comp, part: rec - comp, alerts: p.alerts * chShare * dayScale }
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)

    const sum = (k: 'inter' | 'elig' | 'sent' | 'rec' | 'comp' | 'part' | 'alerts') => rows.reduce((a, r) => a + r[k], 0)
    const inter = sum('inter'), elig = sum('elig'), sent = sum('sent'), rec = sum('rec'), comp = sum('comp'), part = sum('part')
    const alerts = Math.round(sum('alerts'))
    const csat = rec ? Math.round(rows.reduce((a, r) => a + r.csat * r.rec, 0) / rec) : 0
    const trend = inter ? rows.reduce((a, r) => a + r.trend * r.inter, 0) / inter : 1
    const deltas = Object.fromEntries(Object.entries(BASE_DELTAS).map(([k, v]) => [k, Math.round(v * trend)])) as typeof BASE_DELTAS

    return {
      inter, elig, sent, rec, comp, part, alerts, csat, deltas, rows,
      totalCount: rows.length, activeCount: rows.filter(r => r.active).length,
    }
  }, [f.search, f.programs, f.channels, f.categories, f.days])
}

/* ── Funnel pieces ── */
// A 14/20 label sits in success/critical/secondary color with a matching chevron — reused for
// both the bold per-metric deltas and the muted rate-band deltas (per Figma node 1766-17145).
function TrendDelta({ value, unit, muted = false }: { value: number; unit: '%' | 'pp'; muted?: boolean }) {
  const up = value >= 0
  const Icon = up ? TrendingUp : TrendingDown
  const color = muted ? 'var(--lyra-color-fg-secondary)' : up ? 'var(--lyra-color-status-success-strong)' : 'var(--lyra-color-status-critical-strong)'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: `500 14px/20px ${FONT}`, color }}>
      <Icon size={14} strokeWidth={2} />
      {up ? '+' : ''}{value}{unit}
    </span>
  )
}

const METRIC_LABEL: React.CSSProperties = { font: `500 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }
const METRIC_VALUE: React.CSSProperties = { fontFamily: FONT, fontWeight: 600, fontSize: 28, lineHeight: '32px', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', color: 'var(--lyra-color-fg-default)' }
const RATE_TEXT: React.CSSProperties = { font: `400 12px/16px ${FONT}`, letterSpacing: '0.2px', color: 'var(--lyra-color-fg-secondary)' }
const RATE_VALUE: React.CSSProperties = { font: `500 20px/24px ${FONT}`, fontVariantNumeric: 'tabular-nums', color: 'var(--lyra-color-fg-default)' }
const BODY_TEXT: React.CSSProperties = { font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }

// Flat white tile on the panel's blue wash (Figma node 1774-24744): no border, no shadow.
const METRIC_CARD: React.CSSProperties = {
  height: 168, boxSizing: 'border-box', padding: 'var(--space-4) var(--space-3)',
  background: 'var(--lyra-color-bg-surface-base)', borderRadius: 'var(--radius-md)',
  overflow: 'hidden', position: 'relative',
  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
}

// A flex item's hidden overflow lets our explicit minWidth act as the real shrink
// floor instead of the (wider) text-content minimum. Labels can still wrap onto two
// lines; break-word is a last-resort fallback so a long word degrades by breaking
// rather than silently clipping if a viewport is narrower than the floor.
const SHRINKABLE: React.CSSProperties = { minWidth: 0, overflow: 'hidden', overflowWrap: 'break-word' }
const NOWRAP: React.CSSProperties = { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }

function MetricCard({ label, value, delta, unit = '%', barPct, flexGrow = 1, minWidth = 100 }: {
  label: string; value: string; delta: number; unit?: '%' | 'pp'
  /** Funnel volume as a % of the top stage — drawn as a vertical bar hugging the card's right edge. */
  barPct?: number
  flexGrow?: number; minWidth?: number
}) {
  return (
    <div style={{ ...METRIC_CARD, flex: `${flexGrow} 1 0`, minWidth }}>
      <span style={{ ...METRIC_LABEL, ...SHRINKABLE }}>{label}</span>
      <span style={{ ...METRIC_VALUE, ...NOWRAP }}>{value}</span>
      <TrendDelta value={delta} unit={unit} />
      {barPct !== undefined && (
        <i style={{ position: 'absolute', right: 0, bottom: 0, width: 3, height: `${Math.max(8, barPct)}%`, borderRadius: 'var(--radius-xs)', background: 'var(--lyra-color-bg-primary)' }} />
      )}
    </div>
  )
}

function RateBand({ label, value, delta }: { label: string; value: number; delta: number }) {
  return (
    <div style={{ flex: '0.75 1 0', minWidth: 72, height: 168, boxSizing: 'border-box', padding: 'var(--space-4) var(--space-1)', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)', textAlign: 'center' }}>
      <span style={{ ...RATE_TEXT, ...SHRINKABLE, maxWidth: '100%' }}>{label}</span>
      <span style={RATE_VALUE}>{value}%</span>
      <TrendDelta value={delta} unit="pp" muted />
    </div>
  )
}

function SplitCard({ comp, part, deltaComp, deltaPart }: { comp: number; part: number; deltaComp: number; deltaPart: number }) {
  const compShare = pct(comp, comp + part)
  return (
    <div style={{ ...METRIC_CARD, flex: '2.1 1 0', minWidth: 200, padding: 'var(--space-4)' }}>
      <span style={{ ...METRIC_LABEL, ...SHRINKABLE }}>Split of responses received</span>
      <div style={{ alignSelf: 'stretch', display: 'flex', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', ...SHRINKABLE }}>
          <span style={{ ...BODY_TEXT, color: 'var(--lyra-color-fg-secondary)' }}>Completed</span>
          <span style={{ ...METRIC_VALUE, ...NOWRAP }}>{fmt(comp)}</span>
          <TrendDelta value={deltaComp} unit="%" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--space-1)', ...SHRINKABLE }}>
          <span style={{ ...BODY_TEXT, color: 'var(--lyra-color-fg-secondary)' }}>Partial</span>
          <span style={{ ...METRIC_VALUE, ...NOWRAP }}>{fmt(part)}</span>
          <TrendDelta value={deltaPart} unit="%" />
        </div>
      </div>
      <span style={{ display: 'flex', height: 3, borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
        <i style={{ width: `${compShare}%`, background: 'var(--lyra-color-status-success-strong)' }} />
        <i style={{ flex: 1, background: 'var(--lyra-color-status-critical-strong)' }} />
      </span>
    </div>
  )
}

function FunnelArrow() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, width: 20, alignSelf: 'stretch' }}>
      <ChevronRight size={16} style={{ color: 'var(--lyra-color-fg-secondary)' }} />
    </div>
  )
}

function ProgramPerformanceFunnel({ d, periodLabel }: { d: ReturnType<typeof useSlicedData>; periodLabel: string }) {
  const bar = (v: number) => Math.round(Math.sqrt(Math.max(v, 0) / Math.max(d.inter, 1)) * 100)
  return (
    <div style={{
      background: 'var(--lyra-color-bg-surface-base)',
      border: '1px solid var(--lyra-color-border-subtle)',
      borderRadius: 'var(--radius-lg)', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ height: 56, boxSizing: 'border-box', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-6)' }}>
        <span style={SHRINKABLE}>
          <span style={METRIC_LABEL}>Program performance - </span>
          <span style={RATE_TEXT}>{d.totalCount} Programs | {d.activeCount} Active | {periodLabel}</span>
        </span>
        <button
          type="button"
          style={{
            flexShrink: 0, height: 32, padding: '0 var(--space-3)',
            background: 'var(--lyra-color-bg-surface-base)', border: '1px solid var(--lyra-color-border-soft)',
            borderRadius: 'var(--radius-md)', font: `500 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)', cursor: 'pointer',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--lyra-color-bg-surface-base)' }}
        >
          Insights
        </button>
      </div>

      {/* Body — funnel flow with arrows between stages */}
      <div style={{ padding: 'var(--space-4)', background: 'var(--lyra-color-bg-active-subtle)', overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
          <MetricCard label="Interactions" value={fmt(d.inter)} delta={d.deltas.inter} barPct={100} />
          <RateBand label="Eligibility Rate" value={pct(d.elig, d.inter)} delta={d.deltas.eligR} />
          <FunnelArrow />
          <MetricCard label="Eligible Interactions" value={fmt(d.elig)} delta={d.deltas.elig} barPct={bar(d.elig)} />
          <RateBand label="Coverage" value={pct(d.sent, d.elig)} delta={d.deltas.covR} />
          <FunnelArrow />
          <MetricCard label="Surveys Sent" value={fmt(d.sent)} delta={d.deltas.sent} barPct={bar(d.sent)} />
          <RateBand label="Response Rate" value={pct(d.rec, d.sent)} delta={d.deltas.respR} />
          <FunnelArrow />
          <MetricCard label="Responses Received" value={fmt(d.rec)} delta={d.deltas.rec} barPct={bar(d.rec)} />
          <RateBand label="Completion Rate" value={pct(d.comp, d.rec)} delta={d.deltas.compR} />
          <FunnelArrow />
          <SplitCard comp={d.comp} part={d.part} deltaComp={d.deltas.comp} deltaPart={d.deltas.part} />

          <div style={{ width: 1, margin: '0 var(--space-3)', background: 'var(--lyra-color-border-subtle)', flexShrink: 0, alignSelf: 'stretch' }} />

          <MetricCard label="CSAT" value={`${d.csat}%`} delta={d.deltas.csat} flexGrow={0.95} minWidth={88} />
          <MetricCard label="Alerts" value={fmt(d.alerts)} delta={d.deltas.alerts} flexGrow={0.95} minWidth={88} />
        </div>
      </div>
    </div>
  )
}

/* ── Why surveys were not sent (Figma node 1774-24744) ── */
// Baseline skip reasons for the 7-day window; scaled to the filtered interactions that never became eligible.
const SKIP_REASONS: { label: string; base: number; tunable: boolean }[] = [
  { label: 'No matching skill or team', base: 4534, tunable: true },
  { label: 'Recency window', base: 3458, tunable: true },
  { label: 'No program covers it', base: 2134, tunable: true },
  { label: 'Interaction too short', base: 2021, tunable: true },
  { label: 'Outside the send window', base: 829, tunable: true },
  { label: 'Survey refused', base: 1053, tunable: false },
  { label: 'Internal interaction', base: 666, tunable: false },
]
const SKIP_BASE_TOTAL = SKIP_REASONS.reduce((a, r) => a + r.base, 0)
const TUNABLE_COLOR = 'var(--lyra-color-status-warning-medium)'
const COMPLIANCE_COLOR = 'var(--lyra-slate-300)'

function WhySurveysNotSent({ d }: { d: ReturnType<typeof useSlicedData> }) {
  const [open, setOpen] = useState(true)
  const skipped = Math.max(0, d.inter - d.elig)
  const rows = SKIP_REASONS.map(r => ({ ...r, value: (r.base / SKIP_BASE_TOTAL) * skipped }))
  const tunable = rows.filter(r => r.tunable).reduce((a, r) => a + r.value, 0)
  const maxValue = Math.max(...rows.map(r => r.value), 1)
  const BAR_H = 130
  const LABEL_SPACE = 24

  return (
    <div style={{ background: 'var(--lyra-color-bg-surface-base)', border: '1px solid var(--lyra-color-border-subtle)', borderRadius: 'var(--radius-lg)' }}>
      <div
        role="button" aria-expanded={open} onClick={() => setOpen(o => !o)}
        style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-4)', cursor: 'pointer', userSelect: 'none' }}
      >
        <div>
          <h3 style={{ margin: 0, font: `500 16px/20px ${FONT}`, letterSpacing: '-0.01em', color: 'var(--lyra-color-fg-default)' }}>Why surveys were not sent?</h3>
          <div style={{ marginTop: 'var(--space-1)', font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>
            {fmt(skipped)} of {fmt(d.inter)} interactions ({pct(skipped, d.inter)}%) never reached a survey. {fmt(tunable)} sit behind program settings you can change.
          </div>
        </div>
        <ChevronDown size={16} style={{ flexShrink: 0, marginTop: 2, color: 'var(--lyra-color-fg-secondary)', transform: `rotate(${open ? 0 : -90}deg)`, transition: 'transform 0.15s' }} />
      </div>

      {open && (
        <div style={{ padding: '0 var(--space-5) var(--space-4)' }}>
          <div style={{ position: 'relative', height: BAR_H + LABEL_SPACE, marginBottom: 'var(--space-2)' }}>
            {[0, 0.25, 0.5, 0.75, 1].map(t => (
              <div key={t} style={{ position: 'absolute', left: 0, right: 0, bottom: `${t * 100}%`, borderBottom: '1px solid var(--lyra-color-border-subtle)', opacity: t === 0 ? 1 : 0.5 }} />
            ))}
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '100%', display: 'flex', alignItems: 'flex-end', gap: 'var(--space-2)' }}>
              {rows.map(r => {
                const barH = Math.max(16, Math.round((r.value / maxValue) * BAR_H))
                return (
                  <div key={r.label} style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <span style={{ font: `500 12px/16px ${FONT}`, fontVariantNumeric: 'tabular-nums', color: 'var(--lyra-color-fg-default)', marginBottom: 'var(--space-1)' }}>{fmt(r.value)}</span>
                    <div style={{ width: '80%', maxWidth: 72, height: barH, background: r.tunable ? TUNABLE_COLOR : COMPLIANCE_COLOR, borderRadius: 'var(--radius-xs) var(--radius-xs) 0 0' }} />
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {rows.map(r => (
              <div key={r.label} style={{ flex: '1 1 0', minWidth: 0, textAlign: 'center' }}>
                <span style={{ font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-default)', display: 'block', ...SHRINKABLE }}>{r.label}</span>
                <span style={{ font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>{pct(r.value, skipped)}%</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--lyra-color-border-subtle)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-4)', font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <i style={{ width: 8, height: 8, borderRadius: 2, background: TUNABLE_COLOR }} />Tunable
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <i style={{ width: 8, height: 8, borderRadius: 2, background: COMPLIANCE_COLOR }} />Compliance
            </span>
            <span>Each interaction is counted once, against the first rule that stopped it.</span>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Today's highlights (James persona: verdict + reason + action, Figma node 1774-24744) ── */
type Highlight = { critical: boolean; title: string; verdict: string; reason: string; action: string }

function TodaysHighlightCard({ d }: { d: ReturnType<typeof useSlicedData> }) {
  const attention = d.rows.filter(r => r.respR < 0.5)
  const worst = [...d.rows].sort((a, b) => a.respR - b.respR)[0]
  const missing = d.inter - d.sent
  const partR = pct(d.part, d.rec)
  const timing = d.rows.filter(r => r.respR < 0.55).length

  const cards: Highlight[] = [
    {
      critical: attention.length > 0,
      title: 'Program health:',
      verdict: `${attention.length} of ${d.totalCount} programs ${attention.length === 1 ? 'needs' : 'need'} attention`,
      reason: worst
        ? `${worst.n} response rate is ${Math.round(worst.respR * 100)}%. Other ${d.totalCount - attention.length} are on track`
        : 'No programs match the selected filters',
      action: 'Review program',
    },
    {
      critical: true,
      title: 'Customer loss:',
      verdict: `${fmt(missing)} interactions of ${fmt(d.inter)} are missing survey`,
      reason: 'Missing team/skill mappings and recency rules are the main reasons for Eligibility rate going down',
      action: 'See why',
    },
    {
      critical: partR >= 25,
      title: 'Partial completion:',
      verdict: partR >= 25 ? 'Partial responses are remaining high' : 'Partial responses are under control',
      reason: 'Customers are dropping out due to few of the surveys with long questions',
      action: 'See programs',
    },
    {
      critical: false,
      title: 'Response rate:',
      verdict: 'Opportunity to improve response rate',
      reason: `Review survey timing to identify opportunities to improve response rates. ${timing} programs survey timing can be changed`,
      action: 'See programs',
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
        <span style={{ font: `500 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>Hi James, todays highlights</span>
        <span style={{ font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>{cards.filter(c => c.critical).length} items need attention</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3)' }}>
        {cards.map(c => {
          const accent = c.critical ? 'var(--lyra-color-status-critical-strong)' : 'var(--lyra-color-bg-primary)'
          const chipBg = c.critical ? 'var(--lyra-color-status-critical-subtle)' : 'var(--lyra-brand-50)'
          const Icon = c.critical ? AlertCircle : Lightbulb
          return (
            <div
              key={c.title}
              style={{
                position: 'relative', overflow: 'hidden',
                boxSizing: 'border-box',
                padding: 'var(--space-3) var(--space-4) var(--space-3) var(--space-5)',
                background: 'var(--lyra-color-bg-surface-base)',
                border: '1px solid var(--lyra-color-border-subtle)',
                borderRadius: 'var(--radius-md)',
                display: 'flex', flexDirection: 'column', gap: 'var(--space-2)',
                transition: 'box-shadow 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--sol-effect-shadowsm)' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}
            >
              <i aria-hidden="true" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: accent }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{ width: 24, height: 24, borderRadius: 'var(--radius-full)', background: chipBg, color: accent, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={12} strokeWidth={2} />
                </span>
                <span style={{ font: `500 12px/16px ${FONT}`, letterSpacing: '0.04em', textTransform: 'uppercase', color: c.critical ? accent : 'var(--lyra-color-fg-secondary)' }}>
                  {c.title.replace(/:$/, '')}
                </span>
              </div>

              <span style={{ font: `500 13px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>{c.verdict}</span>
              <span style={{ font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-secondary)', ...SHRINKABLE }}>{c.reason}</span>

              <button
                type="button"
                style={{
                  alignSelf: 'flex-start', marginTop: 'var(--space-1)',
                  background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
                  display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)',
                  font: `500 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-link)',
                }}
                onMouseEnter={e => { (e.currentTarget.lastElementChild as HTMLElement).style.transform = 'translateX(2px)' }}
                onMouseLeave={e => { (e.currentTarget.lastElementChild as HTMLElement).style.transform = 'none' }}
              >
                {c.action}
                <ArrowRight size={12} style={{ transition: 'transform 0.15s' }} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Page ── */
export function Dashboard6Page() {
  const [search, setSearch] = useState('')
  const [program, setProgram] = useState<string[]>([])
  const [channel, setChannel] = useState<string[]>([])
  const [category, setCategory] = useState<string[]>([])
  const [datePreset, setDatePreset] = useState<DatePreset>('last7')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const range = datePreset === 'custom'
    ? (customStart && customEnd ? { start: new Date(customStart + 'T00:00:00'), end: new Date(customEnd + 'T00:00:00') } : null)
    : rangeForPreset(datePreset)
  const data = useSlicedData({ search, programs: program, channels: channel, categories: category, days: daysInRange(range) })
  const periodLabel = range ? `Trends compared to ${fmtShort(range.start)}, the start of the selected period.` : 'Trends compared to the start of the selected period.'

  const multiLabel = (sel: string[], noun: string) =>
    sel.length === 0 ? `All ${noun}` : sel.length === 1 ? sel[0] : `+${sel.length} ${noun}`

  return (
    <div className="flex flex-col flex-1 h-full" style={{ background: 'var(--lyra-color-bg-surface-base)' }}>
      {/* Page Header */}
      <div
        style={{
          minHeight: 72, padding: 'var(--space-4) var(--space-7)',
          borderBottom: '1px solid var(--lyra-color-border-subtle)',
          display: 'flex', alignItems: 'center',
        }}
      >
        <h1 style={{ font: `600 20px/24px ${FONT}`, letterSpacing: '-0.01em', color: 'var(--lyra-color-fg-default)' }}>
          Dashboard 4
        </h1>
      </div>

      {/* Content */}
      <div
        className="flex-1 min-h-0"
        style={{
          paddingTop: 'var(--space-7)',
          paddingLeft: 'var(--space-7)',
          paddingRight: 'var(--space-7)',
          paddingBottom: 'var(--space-2)',
          overflowY: 'auto',
        }}
      >
        {/* Filter Bar */}
        <div style={{ width: '100%', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-2)' }}>
          <FilterSearchInput value={search} onChange={setSearch} placeholder="Search program name" />
          <DateRangePresetField
            preset={datePreset}
            onPresetChange={setDatePreset}
            customStart={customStart}
            customEnd={customEnd}
            onCustomChange={(s, e) => { setCustomStart(s); setCustomEnd(e) }}
          />
          <div style={{ width: 177 }}>
            <MultiSelectField options={PROGRAM_OPTIONS} value={program} onChange={setProgram} mutedPlaceholder={false} labelOverride={multiLabel(program, 'programs')} borderColor={FILTER_BORDER} radius={FILTER_RADIUS} />
          </div>
          <div style={{ width: 177 }}>
            <MultiSelectField options={CHANNEL_OPTIONS} value={channel} onChange={setChannel} mutedPlaceholder={false} labelOverride={multiLabel(channel, 'channels')} borderColor={FILTER_BORDER} radius={FILTER_RADIUS} />
          </div>
          <div style={{ width: 177 }}>
            <MultiSelectField options={CATEGORY_OPTIONS} value={category} onChange={setCategory} mutedPlaceholder={false} labelOverride={multiLabel(category, 'categories')} borderColor={FILTER_BORDER} radius={FILTER_RADIUS} />
          </div>
        </div>

        <div style={{ marginTop: 'var(--space-7)' }}>
          <TodaysHighlightCard d={data} />
        </div>

        <div style={{ marginTop: 'var(--space-6)' }}>
          <ProgramPerformanceFunnel d={data} periodLabel={periodLabel} />
        </div>

        <div style={{ marginTop: 'var(--space-6)' }}>
          <WhySurveysNotSent d={data} />
        </div>

        <div style={{ marginTop: 'var(--space-6)' }}>
          <ProgramsTableCard />
        </div>
      </div>
    </div>
  )
}
