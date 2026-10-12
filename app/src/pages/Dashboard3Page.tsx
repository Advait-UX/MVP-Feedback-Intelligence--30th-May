import { useState } from 'react'
import { Calendar, ChevronDown, Sparkles, ArrowRight } from 'lucide-react'
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

/* ---------- AI Briefing Card ---------- */
function HealthBriefingCard() {
  const pillars = [
    {
      label: 'SURVEYS GOING OUT',
      value: '89%',
      trend: '3%',
      trendUp: true,
      target: '90%',
      color: '#15803d',
      tintBg: 'rgba(22, 163, 74, 0.04)',
      tintBorder: 'rgba(22, 163, 74, 0.10)',
      desc: (<>1 pt below target. <span style={{ fontWeight: 600 }}>Product Feedback</span> has lowest coverage (83%) — matching rules miss contacts outside core channels.</>),
    },
    {
      label: 'RESPONSES COMING IN',
      value: '53%',
      trend: '4%',
      trendUp: true,
      target: '65%',
      color: '#b45309',
      tintBg: 'rgba(217, 119, 6, 0.04)',
      tintBorder: 'rgba(217, 119, 6, 0.10)',
      desc: (<>12 pts below target. <span style={{ fontWeight: 600 }}>Complaint Resolution Follow-Up</span> is at 30% — surveys arrive after issues are resolved.</>),
    },
    {
      label: 'SATISFACTION HOLDING',
      value: '76%',
      trend: '1 pt',
      trendUp: false,
      target: '78%',
      color: '#b91c1c',
      tintBg: 'rgba(185, 28, 28, 0.03)',
      tintBorder: 'rgba(185, 28, 28, 0.10)',
      desc: (<>CSAT dipped 77% → 76%. <span style={{ fontWeight: 600 }}>Complaint Resolution</span> fell 69% → 61% — "long hold time" is the top complaint.</>),
    },
  ]

  const statPills = [
    { label: 'Response 30%', color: '#b45309', bg: 'rgba(217, 119, 6, 0.08)' },
    { label: 'Completion 43%', color: '#b45309', bg: 'rgba(217, 119, 6, 0.08)' },
    { label: 'CSAT 58% ▼8pts', color: '#b91c1c', bg: 'rgba(185, 28, 28, 0.08)' },
    { label: '28 alerts', color: '#6b7280', bg: 'rgba(107, 114, 128, 0.08)' },
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
          <div>
            <span style={{ font: `400 13px/18px ${FONT}`, color: 'var(--lyra-color-fg-tertiary)' }}>
              Good morning, James
            </span>
            <h2 style={{ font: `600 18px/24px ${FONT}`, marginTop: 4, color: 'var(--lyra-color-fg-default)' }}>
              <span style={{ color: '#d97706' }}>1 program</span> needs your attention.{' '}
              <span style={{ color: '#16a34a' }}>4 are on track.</span>
            </h2>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '3px 10px', marginTop: 2,
            borderRadius: 'var(--radius-full)',
            background: 'rgba(143,115,227,0.08)',
            border: '1px solid rgba(143,115,227,0.14)',
            flexShrink: 0,
          }}>
            <Sparkles size={12} style={{ color: '#4E39A8' }} />
            <span style={{ font: `500 12px/16px ${FONT}`, letterSpacing: '0.02em', color: '#4E39A8' }}>AI Briefing</span>
          </div>
        </div>

        {/* Three pillar metric cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 16 }}>
          {pillars.map(p => (
            <div
              key={p.label}
              style={{
                background: 'rgba(255,255,255,0.55)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.70)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <span style={{
                font: `600 12px/14px ${FONT}`, letterSpacing: '0.04em', color: p.color,
                display: 'block', marginBottom: 8,
              }}>
                {p.label}
              </span>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                    <span style={{ font: `600 24px/28px ${FONT}`, color: p.color }}>{p.value}</span>
                    <span style={{ font: `600 12px/16px ${FONT}`, color: p.trendUp ? '#16a34a' : '#dc2626' }}>
                      {p.trendUp ? '▲' : '▼'} {p.trend}
                    </span>
                  </div>
                  <span style={{ font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-tertiary)' }}>
                    Target: {p.target}
                  </span>
                </div>
                <div style={{ width: 1, alignSelf: 'stretch', background: 'rgba(0,0,0,0.08)', flexShrink: 0 }} />
                <p style={{ font: `400 12px/17px ${FONT}`, color: 'var(--lyra-color-fg-secondary)', flex: 1, minWidth: 0, margin: 0 }}>
                  {p.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Attention program */}
        <div style={{
          marginTop: 16, display: 'flex', alignItems: 'center',
          background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(12px)',
          borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.70)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          overflow: 'hidden',
        }}>
          <div style={{ width: 3, alignSelf: 'stretch', background: '#d97706', flexShrink: 0 }} />
          <div style={{ flex: 1, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ font: `500 13px/18px ${FONT}`, color: 'var(--lyra-color-fg-link)' }}>
              Complaint Resolution Follow-Up
            </span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {statPills.map(s => (
                <span key={s.label} style={{
                  font: `500 12px/16px ${FONT}`, color: s.color,
                  padding: '1px 8px', borderRadius: 'var(--radius-full)', background: s.bg,
                }}>{s.label}</span>
              ))}
            </div>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto',
              font: `500 13px/18px ${FONT}`, color: 'var(--lyra-color-fg-link)',
              background: 'none', border: 'none', padding: 0, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              Investigate <ArrowRight size={14} />
            </button>
          </div>
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
          Dashboard 3
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
        <div style={{ marginTop: 'var(--space-6)' }}><ProgramPerformanceCard /></div>
        <div style={{ marginTop: 'var(--space-6)' }}><CsatAsatCards /></div>
        <div style={{ marginTop: 'var(--space-6)' }}><WhySurveysNotSentCard /></div>
        <div style={{ marginTop: 'var(--space-6)' }}><ProgramsTableCard /></div>
      </div>
    </div>
  )
}
