import { useState } from 'react'
import { Maximize2, X } from 'lucide-react'

const FONT = 'var(--font-sans)'

const CSAT_COLOR = 'var(--lyra-color-status-info-medium)'
const ASAT_COLOR = 'var(--teal-400)'
const BELOW_COLOR = 'var(--lyra-color-status-critical-strong)'
const EQUAL_COLOR = 'var(--lyra-color-status-warning-medium)'
const ABOVE_COLOR = 'var(--lyra-slate-300)'

/* ── Trend chart data (daily, Jul 1–30) ─────────────────── */
const DATES = Array.from({ length: 30 }, (_, i) => `Jul ${i + 1}`)
const CSAT_DATA = [
  78, 78, 78, 79, 78, 77, 77, 77, 76, 77,
  77, 76, 76, 76, 76, 75, 75, 76, 76, 75,
  75, 76, 76, 75, 75, 75, 74, 74, 75, 75,
]
const ASAT_DATA = [
  80, 80, 80, 81, 81, 82, 82, 81, 81, 81,
  80, 81, 81, 82, 82, 82, 81, 81, 80, 80,
  81, 81, 82, 82, 81, 81, 81, 80, 81, 81,
]
const TARGET = 78
const Y_MIN = 70
const Y_MAX = 85

const CL = 50
const CR = 660
const CT = 20

const LABEL_INDICES = [0, 4, 9, 14, 19, 24, 29]

function yPos(v: number, bottom: number) { return CT + ((Y_MAX - v) / (Y_MAX - Y_MIN)) * (bottom - CT) }
function xPos(i: number) { return CL + (i / (DATES.length - 1)) * (CR - CL) }

function smoothPath(pts: [number, number][]): string {
  if (pts.length < 2) return ''
  const r = (n: number) => Math.round(n * 10) / 10
  const d = [`M${r(pts[0][0])},${r(pts[0][1])}`]
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]
    const cp1x = r(p1[0] + (p2[0] - p0[0]) / 6)
    const cp1y = r(p1[1] + (p2[1] - p0[1]) / 6)
    const cp2x = r(p2[0] - (p3[0] - p1[0]) / 6)
    const cp2y = r(p2[1] - (p3[1] - p1[1]) / 6)
    d.push(`C${cp1x},${cp1y} ${cp2x},${cp2y} ${r(p2[0])},${r(p2[1])}`)
  }
  return d.join(' ')
}

/* ── Alert data ──────────────────────────────────────────── */
const CSAT_ALERTS = { total: 50, pct: 71, below: 35, equal: 9, above: 6 }
const ASAT_ALERTS = { total: 20, pct: 29, below: 14, equal: 4, above: 2 }

const TOPICS = [
  { name: 'Baggage delay',       csat: 18, asat: 7,  total: 25 },
  { name: 'Flight cancellation', csat: 16, asat: 6,  total: 22 },
  { name: 'Rebooking',           csat: 12, asat: 5,  total: 17 },
  { name: 'Seat upgrade',        csat: 10, asat: 5,  total: 15 },
  { name: 'Check-in issues',     csat: 9,  asat: 5,  total: 14 },
  { name: 'Billing',             csat: 9,  asat: 3,  total: 12 },
  { name: 'Loyalty points',      csat: 7,  asat: 4,  total: 11 },
  { name: 'Wi-Fi service',       csat: 7,  asat: 3,  total: 10 },
  { name: 'Refund',              csat: 6,  asat: 3,  total: 9 },
  { name: 'Meal quality',        csat: 5,  asat: 3,  total: 8 },
  { name: 'Staff attitude',      csat: 4,  asat: 3,  total: 7 },
  { name: 'Boarding process',    csat: 4,  asat: 2,  total: 6 },
  { name: 'Delay notification',  csat: 3,  asat: 2,  total: 5 },
  { name: 'App crash',           csat: 3,  asat: 1,  total: 4 },
  { name: 'Lounge access',       csat: 3,  asat: 1,  total: 4 },
  { name: 'Lost luggage',        csat: 2,  asat: 1,  total: 3 },
  { name: 'Booking error',       csat: 2,  asat: 1,  total: 3 },
  { name: 'Payment declined',    csat: 2,  asat: 1,  total: 3 },
  { name: 'Pet policy',          csat: 1,  asat: 1,  total: 2 },
  { name: 'Wheelchair assist',   csat: 1,  asat: 1,  total: 2 },
]
const MAX_TOPIC = Math.max(...TOPICS.map(t => t.total))

const PROGRAMS = [
  { name: 'Complaint Resolution Follow-Up', csat: 25, asat: 10, total: 35 },
  { name: 'Product Feedback',               csat: 12, asat: 6,  total: 18 },
  { name: 'Onboarding Feedback B2B',        csat: 5,  asat: 3,  total: 8 },
  { name: 'Billing Effort Score',           csat: 3,  asat: 2,  total: 5 },
  { name: 'In-App Touchpoint',              csat: 3,  asat: 1,  total: 4 },
]
const MAX_PROGRAM = Math.max(...PROGRAMS.map(p => p.total))

/* ── Stat box (CSAT / ASAT breakdown) ────────────────────── */
function StatBox({ label, color, pct, total, below, equal, above, hideLegend }: {
  label: string; color: string; pct: number; total: number
  below: number; equal: number; above: number; hideLegend?: boolean
}) {
  const sum = below + equal + above
  return (
    <div style={{
      flex: 1, padding: 'var(--space-4)',
      border: '1px solid var(--lyra-color-border-subtle)',
      borderRadius: 'var(--radius-md)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 'var(--space-3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <div style={{
            width: 8, height: 8,
            borderRadius: 'var(--radius-full)', background: color,
          }} />
          <span style={{ font: `600 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>
            {label}
          </span>
          <span style={{ font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>
            {pct}% of alerts
          </span>
        </div>
        <span style={{
          font: `600 20px/24px ${FONT}`, color: 'var(--lyra-color-fg-default)',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {total.toLocaleString()}
        </span>
      </div>

      <div style={{
        display: 'flex', height: 8,
        borderRadius: 'var(--radius-full)', overflow: 'hidden',
        ...(hideLegend ? {} : { marginBottom: 'var(--space-2)' }),
      }}>
        <div style={{ width: `${(below / sum) * 100}%`, background: BELOW_COLOR }} />
        <div style={{ width: `${(equal / sum) * 100}%`, background: EQUAL_COLOR }} />
        <div style={{ width: `${(above / sum) * 100}%`, background: ABOVE_COLOR }} />
      </div>

      {!hideLegend && (
        <div style={{
          display: 'flex', gap: 'var(--space-4)',
          font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-secondary)',
        }}>
          {[
            { label: 'Below', value: below, color: BELOW_COLOR },
            { label: 'Equal to', value: equal, color: EQUAL_COLOR },
            { label: 'Above', value: above, color: ABOVE_COLOR },
          ].map(s => (
            <span key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{
                width: 8, height: 8, background: s.color, borderRadius: 2, flexShrink: 0,
              }} />
              {s.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Card 1 — Trend line chart ───────────────────────────── */
const VB_W = 700

function TrendHeaderBadges({ hideTargets }: { hideTargets?: boolean } = {}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
      <span style={{
        padding: '4px 12px',
        border: `2px solid ${hideTargets ? 'var(--lyra-color-border-medium)' : 'var(--lyra-color-status-warning-medium)'}`,
        borderRadius: 'var(--radius-full)',
        font: `600 12px/16px ${FONT}`,
        color: 'var(--lyra-color-fg-default)',
        whiteSpace: 'nowrap',
      }}>
        CSAT: 76%
      </span>
      <span style={{
        padding: '4px 12px',
        border: `2px solid ${hideTargets ? 'var(--lyra-color-border-medium)' : 'var(--lyra-color-status-success-medium)'}`,
        borderRadius: 'var(--radius-full)',
        font: `600 12px/16px ${FONT}`,
        color: 'var(--lyra-color-fg-default)',
        whiteSpace: 'nowrap',
      }}>
        ASAT: 81%
      </span>
      {!hideTargets && (
        <span style={{
          font: `400 12px/16px ${FONT}`,
          color: 'var(--lyra-color-fg-secondary)',
          whiteSpace: 'nowrap',
        }}>
          Target 78%
        </span>
      )}
    </div>
  )
}

function TrendChartSVG({ bottom, hideTargets }: { bottom: number; hideTargets?: boolean }) {
  const [hover, setHover] = useState<{ series: 'CSAT' | 'ASAT'; i: number } | null>(null)
  const vbH = bottom + 80
  const csatPts: [number, number][] = CSAT_DATA.map((v, i) => [xPos(i), yPos(v, bottom)])
  const asatPts: [number, number][] = ASAT_DATA.map((v, i) => [xPos(i), yPos(v, bottom)])
  const yTicks = [70, 75, 80, 85]

  const hoverPt = hover
    ? (hover.series === 'CSAT' ? csatPts[hover.i] : asatPts[hover.i])
    : null
  const hoverVal = hover
    ? (hover.series === 'CSAT' ? CSAT_DATA[hover.i] : ASAT_DATA[hover.i])
    : null

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${VB_W} ${vbH}`} width="100%" style={{ display: 'block' }}>
        {/* Horizontal gridlines + Y labels */}
        {yTicks.map(v => (
          <g key={v}>
            <line
              x1={CL} y1={yPos(v, bottom)} x2={CR} y2={yPos(v, bottom)}
              stroke="var(--lyra-color-border-subtle)" strokeWidth={1}
            />
            <text
              x={CL - 8} y={yPos(v, bottom) + 4} textAnchor="end"
              fill="var(--lyra-color-fg-secondary)"
              fontSize={12} fontFamily="var(--font-sans)"
            >
              {v}%
            </text>
          </g>
        ))}

        {/* Target dashed line */}
        {!hideTargets && (
          <>
            <line
              x1={CL} y1={yPos(TARGET, bottom)} x2={CR} y2={yPos(TARGET, bottom)}
              stroke="var(--lyra-color-fg-secondary)" strokeWidth={1}
              strokeDasharray="6 4"
            />
            <text
              x={CR + 8} y={yPos(TARGET, bottom) + 4} textAnchor="start"
              fill="var(--lyra-color-fg-secondary)"
              fontSize={12} fontWeight={500} fontFamily="var(--font-sans)"
            >
              78%
            </text>
          </>
        )}

        {/* CSAT line + data points */}
        <path d={smoothPath(csatPts)} fill="none" stroke={CSAT_COLOR} strokeWidth={2} />
        {csatPts.map(([x, y], i) => (
          <g key={`csat-${i}`}>
            {(i === csatPts.length - 1 || hover?.series === 'CSAT' && hover.i === i) && (
              <circle cx={x} cy={y} r={i === csatPts.length - 1 ? 4 : 3} fill={CSAT_COLOR} />
            )}
            <circle
              cx={x} cy={y} r={8} fill="transparent"
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHover({ series: 'CSAT', i })}
              onMouseLeave={() => setHover(null)}
            />
          </g>
        ))}

        {/* ASAT line + data points */}
        <path d={smoothPath(asatPts)} fill="none" stroke={ASAT_COLOR} strokeWidth={2} />
        {asatPts.map(([x, y], i) => (
          <g key={`asat-${i}`}>
            {(i === asatPts.length - 1 || hover?.series === 'ASAT' && hover.i === i) && (
              <circle cx={x} cy={y} r={i === asatPts.length - 1 ? 4 : 3} fill={ASAT_COLOR} />
            )}
            <circle
              cx={x} cy={y} r={8} fill="transparent"
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHover({ series: 'ASAT', i })}
              onMouseLeave={() => setHover(null)}
            />
          </g>
        ))}

        {/* X-axis date labels */}
        {LABEL_INDICES.map(i => (
          <text
            key={i} x={xPos(i)} y={bottom + 24} textAnchor="middle"
            fill="var(--lyra-color-fg-secondary)"
            fontSize={12} fontFamily="var(--font-sans)"
          >
            {DATES[i]}
          </text>
        ))}

        {/* Legend */}
        <g transform={`translate(140, ${bottom + 48})`}>
          <rect x={0} y={0} width={12} height={12} rx={2} fill={CSAT_COLOR} />
          <text x={18} y={10} fontSize={12} fill="var(--lyra-color-fg-secondary)" fontFamily="var(--font-sans)">
            CSAT, customer satisfaction
          </text>
          <rect x={240} y={0} width={12} height={12} rx={2} fill={ASAT_COLOR} />
          <text x={258} y={10} fontSize={12} fill="var(--lyra-color-fg-secondary)" fontFamily="var(--font-sans)">
            ASAT, agent satisfaction
          </text>
        </g>
      </svg>

      {hover && hoverPt && (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            left: `${(hoverPt[0] / VB_W) * 100}%`,
            top: `${(hoverPt[1] / vbH) * 100}%`,
            transform: 'translate(-50%, calc(-100% - 10px))',
            background: 'var(--lyra-color-bg-surface-inverse)',
            color: 'var(--lyra-color-fg-inverse)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 10px',
            font: `400 12px/1.35 ${FONT}`,
            whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 5,
            boxShadow: 'var(--sol-effect-shadowlg)',
          }}
        >
          <b style={{ display: 'block', font: `600 13px/1.35 ${FONT}` }}>
            {DATES[hover.i]}
          </b>
          <span style={{ color: hover.series === 'CSAT' ? CSAT_COLOR : ASAT_COLOR, fontWeight: 600 }}>
            {hover.series}
          </span>{' '}
          <span style={{ opacity: 0.8 }}>{hoverVal}%</span>
        </div>
      )}
    </div>
  )
}

function TrendChartModal({ onClose, hideTargets }: { onClose: () => void; hideTargets?: boolean }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.24)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--lyra-color-bg-surface-overlay)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--sol-effect-shadowlg)',
        width: '100%', maxWidth: 860,
        padding: 'var(--space-6)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
          <h2 style={{ margin: 0, font: `600 16px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>
            CSAT &amp; ASAT across all programs
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 'var(--radius-sm)', border: 'none', background: 'transparent', color: 'var(--lyra-color-fg-secondary)', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ marginBottom: 'var(--space-5)' }}>
          <TrendHeaderBadges hideTargets={hideTargets} />
        </div>

        <TrendChartSVG bottom={380} hideTargets={hideTargets} />
      </div>
    </div>
  )
}

function TrendChart({ hideTargets }: { hideTargets?: boolean } = {}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div style={{
      flex: '1 1 480px', minWidth: 400,
      background: 'var(--lyra-color-bg-surface-base)',
      border: '1px solid var(--lyra-color-border-soft)',
      borderRadius: 'var(--radius-lg)',
    }}>
      <div style={{
        padding: '12px 16px',
        display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)',
      }}>
        <h3 style={{
          font: `600 18px/24px ${FONT}`, letterSpacing: '-0.01em', margin: 0,
          color: 'var(--lyra-color-fg-default)',
          whiteSpace: 'nowrap',
        }}>
          CSAT &amp; ASAT across all programs
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginLeft: 'auto' }}>
          <TrendHeaderBadges hideTargets={hideTargets} />
          <button
            onClick={() => setExpanded(true)}
            aria-label="Expand chart"
            title="Expand chart"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 28, height: 28, flexShrink: 0,
              borderRadius: 'var(--radius-sm)', border: '1px solid var(--lyra-color-border-soft)',
              background: 'transparent', color: 'var(--lyra-color-fg-secondary)', cursor: 'pointer',
            }}
          >
            <Maximize2 size={14} />
          </button>
        </div>
      </div>

      <div style={{ padding: 'var(--space-4)' }}>
        <TrendChartSVG bottom={200} hideTargets={hideTargets} />
      </div>

      {expanded && <TrendChartModal onClose={() => setExpanded(false)} hideTargets={hideTargets} />}
    </div>
  )
}

/* ── Shared bar-row renderer ────────────────────────────── */
function BarRow({ item, maxVal, hoveredName, setHoveredName }: {
  item: { name: string; csat: number; asat: number; total: number }
  maxVal: number
  hoveredName: string | null
  setHoveredName: (n: string | null) => void
}) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
      }}
      onMouseEnter={() => setHoveredName(item.name)}
      onMouseLeave={() => setHoveredName(null)}
    >
      <span
        title={item.name}
        style={{
          width: 140, flexShrink: 0,
          font: `400 13px/18px ${FONT}`,
          color: 'var(--lyra-color-fg-default)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}
      >
        {item.name}
      </span>

      <div style={{ flex: 1, position: 'relative' }}>
        <div style={{
          display: 'flex', height: 16,
          borderRadius: 'var(--radius-xs)', overflow: 'hidden',
          width: `${(item.total / maxVal) * 100}%`,
        }}>
          <div style={{ width: `${(item.csat / item.total) * 100}%`, background: CSAT_COLOR }} />
          <div style={{ width: `${(item.asat / item.total) * 100}%`, background: ASAT_COLOR }} />
        </div>

        {hoveredName === item.name && (
          <div
            role="tooltip"
            style={{
              position: 'absolute', bottom: '100%', left: '30%',
              transform: 'translate(-50%, -8px)',
              background: 'var(--lyra-color-bg-surface-inverse)',
              color: 'var(--lyra-color-fg-inverse)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 12px',
              font: `400 12px/16px ${FONT}`,
              whiteSpace: 'nowrap', zIndex: 5,
              boxShadow: 'var(--sol-effect-shadowlg)',
            }}
          >
            <b style={{ fontWeight: 600 }}>{item.name}</b>
            <br />
            CSAT: {item.csat} · ASAT: {item.asat}
          </div>
        )}
      </div>

      <span style={{
        width: 32, textAlign: 'right',
        font: `600 13px/18px ${FONT}`,
        color: 'var(--lyra-color-fg-default)',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {item.total}
      </span>
    </div>
  )
}

/* ── Card 2 — Alert breakdown ────────────────────────────── */
function AlertBreakdown({ hideLegend }: { hideLegend?: boolean }) {
  const [view, setView] = useState<'Program' | 'Topic'>('Topic')
  const [showAll, setShowAll] = useState(false)
  const [hoveredName, setHoveredName] = useState<string | null>(null)

  const data = view === 'Topic' ? TOPICS : PROGRAMS
  const maxVal = view === 'Topic' ? MAX_TOPIC : MAX_PROGRAM
  const visible = showAll ? data : data.slice(0, 5)

  return (
    <div style={{
      flex: '1 1 360px', minWidth: 340,
      background: 'var(--lyra-color-bg-surface-base)',
      border: '1px solid var(--lyra-color-border-soft)',
      borderRadius: 'var(--radius-lg)',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <h3 style={{
          font: `600 18px/24px ${FONT}`, letterSpacing: '-0.01em', margin: 0,
          color: 'var(--lyra-color-fg-default)',
        }}>
          Alerts
        </h3>
        <span style={{
          font: `400 12px/16px ${FONT}`,
          color: 'var(--lyra-color-fg-secondary)',
        }}>
          5 active programs
        </span>
      </div>

      <div style={{
        padding: 'var(--space-4)', flex: 1,
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Stat boxes */}
        {hideLegend ? (
          <div style={{
            padding: 'var(--space-3) var(--space-4)',
            border: '1px solid var(--lyra-color-border-subtle)',
            borderRadius: 'var(--radius-md)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 'var(--space-2)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: 'var(--radius-full)', background: CSAT_COLOR }} />
                  <span style={{ font: `600 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>CSAT</span>
                  <span style={{ font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>{CSAT_ALERTS.total}</span>
                  <span style={{ font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-secondary)', opacity: 0.7 }}>({CSAT_ALERTS.pct}%)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: 'var(--radius-full)', background: ASAT_COLOR }} />
                  <span style={{ font: `600 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>ASAT</span>
                  <span style={{ font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>{ASAT_ALERTS.total}</span>
                  <span style={{ font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-secondary)', opacity: 0.7 }}>({ASAT_ALERTS.pct}%)</span>
                </div>
              </div>
              <span style={{
                font: `600 20px/24px ${FONT}`, color: 'var(--lyra-color-fg-default)',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {CSAT_ALERTS.total + ASAT_ALERTS.total}
              </span>
            </div>
            <div style={{
              display: 'flex', height: 10,
              borderRadius: 'var(--radius-full)', overflow: 'hidden',
            }}>
              <div style={{ width: `${CSAT_ALERTS.pct}%`, background: CSAT_COLOR }} />
              <div style={{ width: `${ASAT_ALERTS.pct}%`, background: ASAT_COLOR }} />
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <StatBox label="CSAT" color={CSAT_COLOR} {...CSAT_ALERTS} />
            <StatBox label="ASAT" color={ASAT_COLOR} {...ASAT_ALERTS} />
          </div>
        )}

        {/* Section header + toggle + data rows — vertically centered in remaining space */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{
            marginTop: 'var(--space-4)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{
              font: `500 12px/16px ${FONT}`,
              letterSpacing: '0.05em', textTransform: 'uppercase',
              color: 'var(--lyra-color-fg-secondary)',
            }}>
              Where alerts happened
            </span>
            <div style={{
              display: 'flex',
              border: '1px solid var(--lyra-color-border-soft)',
              borderRadius: 'var(--radius-sm)', overflow: 'hidden',
            }}>
              {(['Program', 'Topic'] as const).map(opt => (
                <button
                  key={opt}
                  onClick={() => { setView(opt); setShowAll(false) }}
                  style={{
                    padding: '4px 12px',
                    font: `500 12px/16px ${FONT}`,
                    color: view === opt
                      ? 'var(--lyra-color-fg-active-strong)'
                      : 'var(--lyra-color-fg-secondary)',
                    background: view === opt
                      ? 'var(--lyra-color-bg-active-subtle)'
                      : 'transparent',
                    border: 'none', cursor: 'pointer',
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Data rows */}
          <div style={{
            marginTop: 'var(--space-3)',
            display: 'flex', flexDirection: 'column', gap: 'var(--space-2)',
            ...(showAll && data.length > 8 ? {
              maxHeight: 280,
              overflowY: 'auto' as const,
              paddingRight: 'var(--space-1)',
            } : {}),
          }}>
            {visible.map(item => (
              <BarRow
                key={item.name}
                item={item}
                maxVal={maxVal}
                hoveredName={hoveredName}
                setHoveredName={setHoveredName}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          paddingTop: 'var(--space-3)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
            font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-secondary)',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{
                width: 8, height: 8, background: CSAT_COLOR,
                borderRadius: 2, flexShrink: 0,
              }} />
              CSAT
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{
                width: 8, height: 8, background: ASAT_COLOR,
                borderRadius: 2, flexShrink: 0,
              }} />
              ASAT
            </span>
            {!showAll && (
              <span style={{ fontStyle: 'italic' }}>
                · hover a bar for the split
              </span>
            )}
          </div>
          {data.length > 5 && (
            <button
              onClick={() => setShowAll(!showAll)}
              style={{
                font: `500 12px/16px ${FONT}`,
                color: 'var(--lyra-color-fg-link)',
                background: 'none', border: 'none', cursor: 'pointer',
              }}
            >
              {showAll ? 'Show less' : `Show all ${data.length} ${view === 'Topic' ? 'topics' : 'programs'}`}
            </button>
          )}
          {data.length <= 5 && (
            <span style={{
              font: `400 12px/16px ${FONT}`,
              color: 'var(--lyra-color-fg-secondary)',
            }}>
              {data.length} {view === 'Topic' ? 'topics' : 'programs'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Exported two-card row ───────────────────────────────── */
export function CsatAsatCards({ hideLegend, hideTargets }: { hideLegend?: boolean; hideTargets?: boolean } = {}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-6)', alignItems: 'stretch' }}>
      <TrendChart hideTargets={hideTargets} />
      <AlertBreakdown hideLegend={hideLegend} />
    </div>
  )
}
