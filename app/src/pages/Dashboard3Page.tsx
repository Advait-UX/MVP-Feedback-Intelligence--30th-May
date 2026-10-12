import { useState } from 'react'
import { Calendar, ChevronDown, Sparkles } from 'lucide-react'
import { SearchInput } from '../components/feedback-management/ListPagePrimitives'
import { ProgramPerformanceCard } from '../components/feedback-intelligence/ProgramPerformanceCard'
import { CsatAsatCards } from '../components/feedback-intelligence/CsatAsatCards'
import { WhySurveysNotSentCard } from '../components/feedback-intelligence/WhySurveysNotSentCard'
import { ProgramsTableCard } from '../components/feedback-intelligence/ProgramsTableCard'

const FONT = 'var(--font-sans)'

function FilterDropdown({
  value,
  options,
  onChange,
}: {
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  return (
    <div
      style={{
        position: 'relative', display: 'flex', alignItems: 'center', height: 36,
        paddingLeft: 12, paddingRight: 12, width: 177,
        background: 'var(--lyra-color-bg-field)', border: '1px solid var(--lyra-color-border-soft)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <span
        style={{
          flex: 1, font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}
      >
        {value}
      </span>
      <ChevronDown size={16} style={{ color: 'var(--lyra-color-fg-secondary)', flexShrink: 0, pointerEvents: 'none' }} />
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
      >
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  )
}

function DateRangeField({ value }: { value: string }) {
  return (
    <div
      style={{
        position: 'relative', display: 'flex', alignItems: 'center', height: 36,
        paddingLeft: 12, paddingRight: 12, width: 177,
        background: 'var(--lyra-color-bg-field)', border: '1px solid var(--lyra-color-border-soft)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <span style={{ flex: 1, font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>
        {value}
      </span>
      <Calendar size={16} style={{ color: 'var(--lyra-color-fg-secondary)', flexShrink: 0 }} />
    </div>
  )
}

/* ---------- Mini sparkline SVG (full-width, responsive) ---------- */
function MiniSparkline({ points, up }: { points: number[]; up: boolean }) {
  const w = 200, h = 32, px = 2, py = 4
  const min = Math.min(...points), max = Math.max(...points)
  const range = max - min || 1
  const coords = points.map((v, i) => ({
    x: px + (i / (points.length - 1)) * (w - px * 2),
    y: py + (1 - (v - min) / range) * (h - py * 2),
  }))
  const d = coords.map((c, i) => {
    if (i === 0) return `M${c.x},${c.y}`
    const prev = coords[i - 1]
    const cpx = (prev.x + c.x) / 2
    return `C${cpx},${prev.y} ${cpx},${c.y} ${c.x},${c.y}`
  }).join(' ')
  const fillD = `${d} L${coords[coords.length - 1].x},${h} L${coords[0].x},${h} Z`
  const color = up ? 'var(--lyra-color-status-success-strong)' : 'var(--lyra-color-status-critical-strong)'
  const fillColor = up ? 'rgba(35,114,45,0.12)' : 'rgba(189,42,42,0.12)'

  const endX = coords[coords.length - 1].x
  const endY = coords[coords.length - 1].y
  const pulseId = up ? 'pulse-up' : 'pulse-down'
  const pulseColor = up ? 'rgba(35,114,45,0.35)' : 'rgba(189,42,42,0.35)'

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      style={{ display: 'block', width: '100%', height: 32 }}
    >
      <defs>
        <radialGradient id={pulseId}>
          <stop offset="0%" stopColor={pulseColor} />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      <path d={fillD} fill={fillColor} />
      <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <circle cx={endX} cy={endY} r={7} fill={`url(#${pulseId})`}>
        <animate attributeName="r" values="4;8;4" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.7;0.2;0.7" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx={endX} cy={endY} r={2.5} fill={color} />
    </svg>
  )
}

/* ---------- AI Briefing Card (neutral — no thresholds) ---------- */
function HealthBriefingCard() {
  const metrics = [
    {
      label: 'COVERAGE', value: '89%', delta: '+3%', up: true,
      spark: [82, 84, 83, 86, 85, 87, 89],
      desc: (<><b>6,446</b> surveys sent out of <b>7,225</b> eligible interactions {'·'} 779 interactions were not surveyed</>),
    },
    {
      label: 'RESPONSE RATE', value: '53%', delta: '+4%', up: true,
      spark: [45, 47, 46, 49, 50, 51, 53],
      desc: (<><b>3,432</b> responses received out of <b>6,446</b> surveys sent {'·'} 3,014 surveys went unanswered</>),
    },
    {
      label: 'COMPLETION RATE', value: '65%', delta: '+4%', up: true,
      spark: [58, 59, 60, 61, 62, 63, 65],
      desc: (<>Out of <b>3,432</b> responses, <b>2,245</b> surveys were completed {'·'} 1,187 were partially completed</>),
    },
    {
      label: 'CSAT', value: '76%', delta: '−1%', up: false,
      spark: [79, 78, 80, 79, 78, 77, 76],
      desc: (<>Customer satisfaction across <b>3,432</b> responses {'·'} Down 1 point from last period</>),
    },
    {
      label: 'ASAT', value: '81%', delta: '+1%', up: true,
      spark: [78, 77, 79, 78, 80, 80, 81],
      desc: (<>Agent satisfaction across <b>3,432</b> responses {'·'} Up 1 point from last period</>),
    },
  ]

  return (
    <div style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(80,120,220,0.14) 0%, rgba(130,90,220,0.18) 35%, rgba(160,100,230,0.15) 60%, rgba(100,140,230,0.12) 100%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute', inset: 0,
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(130,100,220,0.18)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', padding: '20px 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ font: `500 18px/24px ${FONT}`, letterSpacing: '-0.01em', color: 'var(--lyra-color-fg-default)' }}>
            Good morning, James.
          </span>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '3px 10px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(143,115,227,0.08)',
            border: '1px solid rgba(143,115,227,0.14)',
            flexShrink: 0,
          }}>
            <Sparkles size={12} style={{ color: '#4E39A8' }} />
            <span style={{ font: `500 12px/16px ${FONT}`, letterSpacing: '0.02em', color: '#4E39A8' }}>AI Briefing</span>
          </div>
        </div>

        {/* Five metric cards — neutral, no health states */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginTop: 16 }}>
          {metrics.map(m => (
            <div
              key={m.label}
              style={{
                background: 'rgba(255,255,255,0.55)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.70)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px 12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                display: 'flex', flexDirection: 'column',
              }}
            >
              <span style={{
                font: `500 12px/14px ${FONT}`, letterSpacing: '0.04em',
                color: 'var(--lyra-color-fg-secondary)',
                display: 'block', marginBottom: 8,
              }}>
                {m.label}
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, whiteSpace: 'nowrap' }}>
                <span style={{ font: `600 24px/28px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>
                  {m.value}
                </span>
                <span style={{
                  font: `500 12px/16px ${FONT}`, whiteSpace: 'nowrap',
                  color: m.up ? 'var(--lyra-color-status-success-strong)' : 'var(--lyra-color-status-critical-strong)',
                }}>
                  {m.up ? '▲' : '▼'} {m.delta}
                </span>
              </div>
              <div style={{ marginTop: 8 }}>
                <MiniSparkline points={m.spark} up={m.up} />
              </div>
              <p style={{
                font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-default)',
                margin: '8px 0 0',
              }}>
                {m.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function Dashboard3Page() {
  const [search, setSearch] = useState('')
  const [program, setProgram] = useState('All programs')
  const [channel, setChannel] = useState('All channels')
  const [category, setCategory] = useState('All categories')

  return (
    <div className="flex flex-col flex-1 h-full" style={{ background: 'var(--lyra-color-bg-surface-base)' }}>
      <div
        style={{
          minHeight: 72, padding: 'var(--space-4) var(--space-7)',
          borderBottom: '1px solid var(--lyra-color-border-subtle)',
          display: 'flex', alignItems: 'center',
        }}
      >
        <h1 style={{ font: `600 20px/24px ${FONT}`, letterSpacing: '-0.01em', color: 'var(--lyra-color-fg-default)' }}>
          Dashboard 1
        </h1>
      </div>

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
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-2)' }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search program name" />
          <DateRangeField value="Jul 1 - Jul 30" />
          <FilterDropdown value={program} options={['All programs', 'Program A', 'Program B']} onChange={setProgram} />
          <FilterDropdown value={channel} options={['All channels', 'Email', 'SMS', 'IVR']} onChange={setChannel} />
          <FilterDropdown value={category} options={['All categories', 'Category A', 'Category B']} onChange={setCategory} />
        </div>

        <div style={{ marginTop: 'var(--space-6)' }}><HealthBriefingCard /></div>
        <div style={{ marginTop: 'var(--space-6)' }}><ProgramPerformanceCard hideKpiCards /></div>
        <div style={{ marginTop: 'var(--space-6)' }}><CsatAsatCards hideLegend hideTargets /></div>
        <div style={{ marginTop: 'var(--space-6)' }}><WhySurveysNotSentCard defaultExpanded={false} /></div>
        <div style={{ marginTop: 'var(--space-6)' }}><ProgramsTableCard hideTargets /></div>
      </div>
    </div>
  )
}
