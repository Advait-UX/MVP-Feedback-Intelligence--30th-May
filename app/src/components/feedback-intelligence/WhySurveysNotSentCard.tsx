import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const FONT = 'var(--font-sans)'

const TOTAL = 21920
const NOT_SURVEYED = 14695
const NOT_SURVEYED_PCT = 67
const REACHED = 7225
const REACHED_PCT = 33
const FIXABLE_COUNT = 12976
const FIXABLE_PCT = 88
const COMPLIANCE_COUNT = 1719
const COMPLIANCE_PCT = 12

const FIXABLE_CLR = 'var(--lyra-orange-700)'
const COMPLIANCE_CLR = 'var(--lyra-slate-400)'
const CORAL = 'var(--lyra-color-status-critical-medium)'
const GREEN = 'var(--lyra-color-status-success-medium)'

interface Reason {
  label: string
  count: number
  pct: number
  tag: 'Fixable' | 'Compliance'
}

const REASONS: Reason[] = [
  { label: 'No matching skill or team', count: 4534, pct: 31, tag: 'Fixable' },
  { label: 'Recency window', count: 3458, pct: 24, tag: 'Fixable' },
  { label: 'Program not found', count: 2134, pct: 15, tag: 'Fixable' },
  { label: 'Interaction too short', count: 2021, pct: 14, tag: 'Fixable' },
  { label: 'Survey refused', count: 1053, pct: 7, tag: 'Compliance' },
  { label: 'No matching polling window', count: 829, pct: 6, tag: 'Fixable' },
  { label: 'Internal interaction', count: 666, pct: 5, tag: 'Compliance' },
]

const MAX_REASON_COUNT = Math.max(...REASONS.map(r => r.count))

/* ── Donut ring chart ───────────────────────────────────── */
function DonutChart() {
  const r = 52, cx = 64, cy = 64, sw = 16
  const circ = 2 * Math.PI * r
  const coralArc = (NOT_SURVEYED_PCT / 100) * circ

  return (
    <svg viewBox="0 0 128 128" width={128} height={128} style={{ display: 'block' }}>
      <g transform={`rotate(-90 ${cx} ${cy})`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={GREEN} strokeWidth={sw} />
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke={CORAL} strokeWidth={sw}
          strokeDasharray={`${Math.round(coralArc * 10) / 10} ${Math.round((circ - coralArc) * 10) / 10}`}
        />
      </g>
      <text x={cx} y={cy - 4} textAnchor="middle"
        fill="var(--lyra-color-fg-default)" fontSize={20} fontWeight={600} fontFamily={FONT}>
        {NOT_SURVEYED_PCT}%
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle"
        fill="var(--lyra-color-fg-secondary)" fontSize={12} fontWeight={400} fontFamily={FONT}>
        missed
      </text>
    </svg>
  )
}

/* ── Stat tile ──────────────────────────────────────────── */
function StatTile({ value, label, color, sub }: {
  value: string; label: string; color: string; sub?: string
}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 2,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
        <span style={{ font: `600 20px/24px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>
          {value}
        </span>
      </div>
      <span style={{ font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-secondary)', paddingLeft: 16 }}>
        {label}
      </span>
      {sub && (
        <span style={{ font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-secondary)', paddingLeft: 16, opacity: 0.7 }}>
          {sub}
        </span>
      )}
    </div>
  )
}

/* ── Exported card ──────────────────────────────────────── */
export function WhySurveysNotSentCard({ defaultExpanded = true }: { defaultExpanded?: boolean } = {}) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  return (
    <div style={{
      background: 'var(--lyra-color-bg-surface-base)',
      border: '1px solid var(--lyra-color-border-soft)',
      borderRadius: 'var(--radius-lg)',
    }}>
      {/* Collapsible header */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(v => !v)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(v => !v) }
        }}
        style={{
          padding: '12px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer',
        }}
      >
        <h3 style={{
          font: `600 18px/24px ${FONT}`, letterSpacing: '-0.01em', margin: 0,
          color: 'var(--lyra-color-fg-default)',
        }}>
          Why surveys were not sent?
        </h3>
        <ChevronDown
          size={16}
          style={{
            color: 'var(--lyra-color-fg-secondary)',
            transition: 'transform 150ms',
            transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
          }}
        />
      </div>

      {expanded && (
        <div style={{ padding: 'var(--space-6)' }}>

          {/* ── Top summary row: donut + stats ── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-7)',
            marginBottom: 'var(--space-6)',
          }}>
            <DonutChart />

            <div style={{
              display: 'flex', gap: 'var(--space-7)', flex: 1,
            }}>
              <StatTile
                value={NOT_SURVEYED.toLocaleString()}
                label="Not surveyed"
                color={CORAL}
                sub={`${NOT_SURVEYED_PCT}% of ${TOTAL.toLocaleString()}`}
              />

              <div style={{
                width: 1, alignSelf: 'stretch',
                background: 'var(--lyra-color-border-subtle)',
              }} />

              <StatTile
                value={FIXABLE_COUNT.toLocaleString()}
                label="Fixable"
                color={FIXABLE_CLR}
                sub={`${FIXABLE_PCT}% of missed`}
              />

              <StatTile
                value={COMPLIANCE_COUNT.toLocaleString()}
                label="Compliance"
                color={COMPLIANCE_CLR}
                sub={`${COMPLIANCE_PCT}% of missed`}
              />

              <div style={{
                width: 1, alignSelf: 'stretch',
                background: 'var(--lyra-color-border-subtle)',
              }} />

              <StatTile
                value={REACHED.toLocaleString()}
                label="Reached a survey"
                color={GREEN}
                sub={`${REACHED_PCT}% of ${TOTAL.toLocaleString()}`}
              />
            </div>
          </div>

          {/* ── Separator ── */}
          <div style={{
            height: 1,
            background: 'var(--lyra-color-border-subtle)',
            marginBottom: 'var(--space-5)',
          }} />

          {/* ── Section label ── */}
          <div style={{
            font: `500 12px/16px ${FONT}`,
            color: 'var(--lyra-color-fg-secondary)',
            letterSpacing: '0.05em',
            textTransform: 'uppercase' as const,
            marginBottom: 'var(--space-4)',
          }}>
            Breakdown by reason
          </div>

          {/* ── Reason rows ── */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 'var(--space-3)',
          }}>
            {REASONS.map(reason => {
              const isFixable = reason.tag === 'Fixable'
              const barColor = isFixable ? FIXABLE_CLR : COMPLIANCE_CLR
              const tagBg = isFixable ? 'var(--lyra-color-status-warning-subtle)' : 'var(--lyra-slate-100)'
              const tagFg = isFixable ? FIXABLE_CLR : 'var(--lyra-slate-600)'

              return (
                <div key={reason.label} style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                  padding: '6px 0',
                }}>
                  {/* Label */}
                  <span style={{
                    width: 200, flexShrink: 0,
                    font: `400 14px/20px ${FONT}`,
                    color: 'var(--lyra-color-fg-default)',
                  }}>
                    {reason.label}
                  </span>

                  {/* Bar — no track, just the fill */}
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                    <div style={{
                      width: `${(reason.count / MAX_REASON_COUNT) * 100}%`,
                      height: 8,
                      borderRadius: 'var(--radius-full)',
                      background: barColor,
                      minWidth: 4,
                    }} />
                  </div>

                  {/* Count */}
                  <span style={{
                    width: 48, textAlign: 'right', flexShrink: 0,
                    font: `600 14px/20px ${FONT}`,
                    color: 'var(--lyra-color-fg-default)',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {reason.count.toLocaleString()}
                  </span>

                  {/* Percent */}
                  <span style={{
                    width: 32, textAlign: 'right', flexShrink: 0,
                    font: `400 13px/16px ${FONT}`,
                    color: 'var(--lyra-color-fg-secondary)',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {reason.pct}%
                  </span>

                  {/* Tag pill */}
                  <span style={{
                    flexShrink: 0, padding: '2px 10px',
                    background: tagBg,
                    borderRadius: 'var(--radius-full)',
                    font: `500 12px/16px ${FONT}`,
                    color: tagFg,
                    whiteSpace: 'nowrap',
                  }}>
                    {reason.tag}
                  </span>
                </div>
              )
            })}
          </div>

          {/* ── Footer insight ── */}
          <div style={{
            marginTop: 'var(--space-5)',
            padding: 'var(--space-3) var(--space-4)',
            background: 'var(--lyra-color-status-info-subtle)',
            border: '1px solid rgba(45,91,185,0.2)',
            borderRadius: 'var(--radius-md)',
            font: `400 13px/18px ${FONT}`,
            color: 'var(--lyra-color-status-info-strong)',
          }}>
            {FIXABLE_COUNT.toLocaleString()} interactions ({FIXABLE_PCT}%) can be recovered by adjusting program settings.
          </div>
        </div>
      )}
    </div>
  )
}
