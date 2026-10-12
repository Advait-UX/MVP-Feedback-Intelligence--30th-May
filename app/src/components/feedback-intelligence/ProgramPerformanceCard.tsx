import { useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'

const FONT = 'var(--font-sans)'

const CANVAS_W = 1299.978
const CANVAS_H = 144

const BAR_COLOR = 'var(--lyra-color-status-info-medium)'
const CONNECTOR_COLOR = 'var(--lyra-brand-100)'
const FULL_COLOR = 'var(--lyra-color-bg-primary)'
const PARTIAL_COLOR = 'var(--lyra-color-bg-destructive)'
const DIVIDER_COLOR = 'var(--lyra-color-status-info-medium)'

function pct(px: number) {
  return `${(px / CANVAS_W) * 100}%`
}

interface StageData {
  label: string
  value: number
  deltaPct: number
  left: number
  groupWidth: number
  barWidth: number
  barHeight: number
  connectorWidth: number
  annotation?: { text: string; left: number }
  pctOfPrev: string | null
  pctOfTotal: string | null
}

const STAGES: StageData[] = [
  {
    label: 'Interactions', value: 21920, deltaPct: 13,
    left: 0, groupWidth: 247.02, barWidth: 155.22, barHeight: 73, connectorWidth: 92,
    pctOfPrev: null, pctOfTotal: null,
  },
  {
    label: 'Eligible Interactions', value: 7225, deltaPct: 8,
    left: 246.71, groupWidth: 255.29, barWidth: 158, barHeight: 43, connectorWidth: 98,
    annotation: { text: '779\ninteractions\nnot surveyed', left: 158.19 },
    pctOfPrev: '33% of interactions', pctOfTotal: '33% of interactions',
  },
  {
    label: 'Surveys sent', value: 6446, deltaPct: 4,
    left: 502.26, groupWidth: 250.21, barWidth: 158.24, barHeight: 39, connectorWidth: 92,
    annotation: { text: '3,014 surveys\nwere not\nresponded', left: 158 },
    pctOfPrev: '89% of eligible', pctOfTotal: '29% of interactions',
  },
  {
    label: 'Responses received', value: 3432, deltaPct: 2,
    left: 752.34, groupWidth: 166.97, barWidth: 158.24, barHeight: 24, connectorWidth: 0,
    pctOfPrev: '53% of surveys sent', pctOfTotal: '16% of interactions',
  },
]

const DIVIDERS = [0, 246.91, 502.26, 752.34]

const FULL_COUNT = 2245
const PARTIAL_COUNT = 1187
const BLUE_BAR_W = 194
const SPLIT_LEFT = 946.49
const SPLIT_WIDTH = 353.48
const SPLIT_BAR_H = 24

const KPI_METRICS = [
  {
    label: 'Coverage Rate',
    value: 89,
    delta: 3,
    target: 90,
    heading: 'Interactions not surveyed: 779',
    body: "1 point below the 90% target. 779 eligible interactions didn't get a survey. Largest gap in Product Feedback (83% coverage), where matching rules miss contacts outside core channels.",
  },
  {
    label: 'Response Rate',
    value: 53,
    delta: 4,
    target: 65,
    heading: 'Surveys with no response: 3,014',
    body: '12 points below the 65% target. 3,014 surveys (47%) were sent but never opened. Biggest gap in Complaint Resolution Follow-Up (30% response rate), where surveys land after customer issues are resolved.',
  },
  {
    label: 'Completion Rate',
    value: 65,
    delta: 4,
    target: 75,
    heading: 'Incomplete survey: 1,187',
    body: '10 points below the 75% target. 1,187 of 3,432 responses are incomplete. Complaint Resolution Follow-Up has the worst completion rate (43%), with 57% of responses left partial.',
  },
]

function Delta({ pct: deltaPct }: { pct: number }) {
  return (
    <span
      style={{
        font: `400 12px/16px ${FONT}`, letterSpacing: '0.2px',
        color: deltaPct >= 0 ? 'var(--lyra-color-status-success-strong)' : 'var(--lyra-color-status-critical-strong)',
      }}
    >
      {deltaPct >= 0 ? '+' : ''}{deltaPct}%
    </span>
  )
}

interface TooltipLine {
  label: string
  value: string
  delta?: string
}

const TOOLTIP_DATA: Record<string, TooltipLine[]> = {
  'Eligible Interactions': [
    { label: 'Eligible interactions:', value: '7,225' },
    { label: 'Eligibility rate:', value: '33% of interaction', delta: '+3%' },
  ],
  'Surveys sent': [
    { label: 'Surveys sent:', value: '6,446' },
    { label: 'Coverage:', value: '89% of eligible interactions', delta: '+8%' },
    { label: '', value: '29% of total interactions' },
  ],
  'Responses received': [
    { label: 'Responses received:', value: '3,432' },
    { label: 'Response rate:', value: '53% of surveys sent', delta: '+4%' },
    { label: '', value: '16% of total interactions' },
  ],
  'full': [
    { label: "Survey's completed:", value: '2,245' },
    { label: 'Completion rate:', value: '65% of responses received', delta: '+5%' },
    { label: '', value: '10% of total interactions' },
  ],
  'partial': [
    { label: 'Partially completed:', value: '1,187' },
    { label: 'Partial completion rate:', value: '35% of responses received' },
    { label: '', value: '5% of total interactions' },
  ],
}

function FunnelTooltip({ id, anchorRef }: { id: string; anchorRef: React.RefObject<HTMLDivElement | null> }) {
  const lines = TOOLTIP_DATA[id]
  if (!lines || !anchorRef.current) return null

  const rect = anchorRef.current.getBoundingClientRect()
  const pos = { x: rect.left + rect.width / 2, y: rect.top }

  return createPortal(
    <div
      role="tooltip"
      style={{
        position: 'fixed', left: pos.x, top: pos.y,
        transform: 'translate(-50%, -100%)',
        paddingBottom: 2,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        pointerEvents: 'none', zIndex: 9999,
      }}
    >
      <div style={{
        background: 'var(--lyra-color-bg-surface-overlay)',
        border: '1px solid var(--lyra-color-border-soft)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-2) var(--space-3)',
        maxWidth: 320,
        boxShadow: 'var(--sol-effect-shadowmd)',
        whiteSpace: 'nowrap',
      }}>
        {lines.map((line, i) => (
          <div key={i} style={{ marginBottom: i < lines.length - 1 ? 'var(--space-2)' : 0 }}>
            {line.label && (
              <div style={{
                font: `400 12px/16px ${FONT}`, letterSpacing: '0.2px',
                color: 'var(--lyra-color-fg-secondary)',
              }}>
                {line.label}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{
                font: `600 12px/16px ${FONT}`, letterSpacing: '0.2px',
                color: 'var(--lyra-color-fg-default)',
              }}>
                {line.value}
              </span>
              {line.delta && (
                <span style={{
                  font: `400 12px/16px ${FONT}`, letterSpacing: '0.2px',
                  color: 'var(--lyra-color-status-success-strong)',
                }}>
                  {line.delta}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      <svg width={16} height={8} viewBox="0 0 16 8" style={{ display: 'block', marginTop: -1 }}>
        <path d="M0 0 L8 8 L16 0 Z" fill="var(--lyra-color-bg-surface-overlay)" stroke="var(--lyra-color-border-soft)" strokeWidth={1} strokeLinejoin="round" />
        <rect x={0} y={0} width={16} height={1} fill="var(--lyra-color-bg-surface-overlay)" />
      </svg>
    </div>,
    document.body
  )
}

export function ProgramPerformanceCard({ hideKpiCards = false }: { hideKpiCards?: boolean } = {}) {
  const [hovered, setHovered] = useState<string | null>(null)
  const hoveredRef = useRef<HTMLDivElement | null>(null)

  const handleEnter = useCallback((id: string, el: HTMLDivElement) => {
    hoveredRef.current = el
    setHovered(id)
  }, [])
  const handleLeave = useCallback(() => {
    hoveredRef.current = null
    setHovered(null)
  }, [])

  const splitContentW = SPLIT_WIDTH - 24
  const bluePct = (BLUE_BAR_W / splitContentW) * 100

  return (
    <div
      style={{
        background: 'var(--lyra-color-bg-surface-base)',
        border: '1px solid var(--lyra-color-border-soft)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <h3 style={{ font: `500 14px/20px ${FONT}`, margin: 0, color: 'var(--lyra-color-fg-default)' }}>
          Program performance
        </h3>
        <span style={{ font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>
          5 active programs
        </span>
      </div>

      <div style={{ padding: 'var(--space-6) var(--space-7) var(--space-7)' }}>
        {/* Funnel chart */}
        <div style={{ position: 'relative', width: '100%', height: CANVAS_H }}>

          {/* Vertical dividers — info-medium blue lines */}
          {DIVIDERS.map((x, i) => (
            <div
              key={`div-${i}`}
              style={{
                position: 'absolute', left: pct(x), top: 0, width: 0, height: CANVAS_H,
                borderLeft: `1px solid ${DIVIDER_COLOR}`,
              }}
            />
          ))}

          {/* Stage groups */}
          {STAGES.map((s, idx) => {
            const gpct = (px: number) => `${(px / s.groupWidth) * 100}%`
            const nextBarH = idx < STAGES.length - 1 ? STAGES[idx + 1].barHeight : 0
            const taperTopPct = s.barHeight > 0 ? ((s.barHeight - nextBarH) / s.barHeight) * 100 : 0
            return (
            <div
              key={s.label}
              style={{
                position: 'absolute', left: pct(s.left), top: 6,
                width: pct(s.groupWidth),
                display: 'flex', alignItems: 'flex-end',
              }}
            >
              {/* Stage column: label/value + bar */}
              <div
                style={{
                  width: gpct(s.barWidth),
                  height: 138,
                  display: 'flex', flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ paddingLeft: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{
                    font: `400 12px/16px ${FONT}`, letterSpacing: '0.2px',
                    color: 'var(--lyra-color-fg-secondary)',
                  }}>
                    {s.label}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
                    <span style={{
                      font: `600 20px/24px ${FONT}`,
                      color: 'var(--lyra-color-fg-default)',
                    }}>
                      {s.value.toLocaleString()}
                    </span>
                    <Delta pct={s.deltaPct} />
                  </div>
                </div>
                <div
                  style={{
                    alignSelf: 'stretch', height: s.barHeight,
                    background: BAR_COLOR, position: 'relative', cursor: 'default',
                  }}
                  onMouseEnter={e => handleEnter(s.label, e.currentTarget)}
                  onMouseLeave={handleLeave}
                >
                </div>
              </div>

              {/* Trapezoid connector — tapers from this bar height to next bar height */}
              {s.connectorWidth > 0 && (
                <div style={{
                  width: gpct(s.connectorWidth), height: s.barHeight,
                  background: CONNECTOR_COLOR,
                  clipPath: `polygon(0 0, 100% ${taperTopPct}%, 100% 100%, 0 100%)`,
                }} />
              )}

              {/* Annotation text in the gap between the value row (ends at local y≈44) and the bar top — fixed top clears the value row, tight line-height keeps the 3-line block clear of the bar. white-space:pre (not pre-line) keeps exactly our 3 explicit lines without re-wrapping at spaces when the column is narrow. */}
              {s.annotation && (
                <div
                  style={{
                    position: 'absolute',
                    left: gpct(s.annotation.left),
                    top: 50,
                    font: `400 12px/13px ${FONT}`, letterSpacing: '0.2px',
                    color: 'var(--lyra-color-fg-secondary)',
                    whiteSpace: 'pre',
                  }}
                >
                  {s.annotation.text}
                </div>
              )}
            </div>
            )
          })}

          {/* Split of responses received panel */}
          <div
            style={{
              position: 'absolute', left: pct(SPLIT_LEFT), top: 0,
              width: pct(SPLIT_WIDTH), height: CANVAS_H,
              padding: '12px 12px 12px 24px',
              borderLeft: '1px solid var(--lyra-color-border-subtle)',
              display: 'flex', flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            {/* Header */}
            <span style={{
              font: `400 12px/16px ${FONT}`, letterSpacing: '0.2px',
              color: 'var(--lyra-color-fg-secondary)',
            }}>
              Split of responses received
            </span>

            {/* Two stat columns */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              {/* Survey's completed */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{
                  font: `400 12px/16px ${FONT}`, letterSpacing: '0.2px',
                  color: 'var(--lyra-color-fg-secondary)',
                }}>
                  Survey's completed
                </span>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 14, height: 14, background: FULL_COLOR }} />
                    <span style={{ font: `600 20px/24px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>
                      {FULL_COUNT.toLocaleString()}
                    </span>
                  </div>
                  <Delta pct={9} />
                </div>
              </div>
              {/* Partially completed */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{
                  font: `400 12px/16px ${FONT}`, letterSpacing: '0.2px',
                  color: 'var(--lyra-color-fg-secondary)',
                }}>
                  Partially completed
                </span>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 14, height: 14, background: PARTIAL_COLOR }} />
                    <span style={{ font: `600 20px/24px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>
                      {PARTIAL_COUNT.toLocaleString()}
                    </span>
                  </div>
                  <Delta pct={-6} />
                </div>
              </div>
            </div>

            {/* Combined bar: red bg with blue bar inside */}
            <div
              style={{
                alignSelf: 'stretch', height: SPLIT_BAR_H,
                background: PARTIAL_COLOR,
                display: 'flex', position: 'relative',
              }}
            >
              <div
                style={{
                  width: `${bluePct}%`, height: SPLIT_BAR_H,
                  background: FULL_COLOR, cursor: 'default', position: 'relative',
                }}
                onMouseEnter={e => handleEnter('full', e.currentTarget)}
                onMouseLeave={handleLeave}
              />
              <div
                style={{
                  flex: 1, height: SPLIT_BAR_H,
                  cursor: 'default', position: 'relative',
                }}
                onMouseEnter={e => handleEnter('partial', e.currentTarget)}
                onMouseLeave={handleLeave}
              />
            </div>
          </div>
        </div>

        {/* KPI metric cards */}
        {!hideKpiCards && (
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 'var(--space-3)', marginTop: 'var(--space-7)' }}>
          {KPI_METRICS.map(m => (
            <div
              key={m.label}
              style={{
                flex: 1,
                padding: 'var(--space-4)',
                background: 'var(--lyra-slate-50)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                <span style={{
                  padding: '4px 12px',
                  border: '2px solid var(--lyra-color-status-warning-medium)',
                  borderRadius: 'var(--radius-full)',
                  font: `600 12px/16px ${FONT}`,
                  color: 'var(--lyra-color-fg-default)',
                  whiteSpace: 'nowrap',
                }}>
                  {m.label}: {m.value}%
                </span>
                <Delta pct={m.delta} />
                <span style={{
                  marginLeft: 'auto',
                  font: `400 12px/16px ${FONT}`,
                  color: 'var(--lyra-color-fg-secondary)',
                  whiteSpace: 'nowrap',
                }}>
                  Target: {m.target}%
                </span>
              </div>
              <div style={{
                font: `600 13px/18px ${FONT}`,
                color: 'var(--lyra-color-fg-default)',
                marginBottom: 'var(--space-1)',
              }}>
                {m.heading}
              </div>
              <p style={{
                font: `400 12px/16px ${FONT}`,
                color: 'var(--lyra-color-fg-secondary)',
                margin: 0,
              }}>
                {m.body}
              </p>
            </div>
          ))}
        </div>
        )}
      </div>

      {hovered && <FunnelTooltip id={hovered} anchorRef={hoveredRef} />}
    </div>
  )
}
