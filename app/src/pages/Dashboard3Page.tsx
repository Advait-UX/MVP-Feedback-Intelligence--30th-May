import { useState } from 'react'
import { Calendar, ChevronDown, Sparkles, CheckCircle2, AlertTriangle, AlertCircle, TrendingUp, ArrowRight } from 'lucide-react'
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
  const insights = [
    {
      Icon: TrendingUp,
      iconColor: 'var(--lyra-color-status-success-strong)',
      iconBg: 'var(--lyra-color-status-success-subtle)',
      label: 'Performance',
      text: <>Response rates are stable. <span style={{ fontWeight: 500, color: 'var(--lyra-color-status-success-strong)' }}>CSAT is up 3 pts</span> vs. prior period.</>,
    },
    {
      Icon: AlertTriangle,
      iconColor: 'var(--lyra-color-status-warning-strong)',
      iconBg: 'var(--lyra-color-status-warning-subtle)',
      label: 'Biggest gap',
      text: <>Survey Sent → Response Received drop-off: <span style={{ fontWeight: 500 }}>3,014 unanswered</span>.</>,
    },
    {
      Icon: AlertCircle,
      iconColor: 'var(--lyra-color-status-critical-strong)',
      iconBg: 'var(--lyra-color-status-critical-subtle)',
      label: 'Top issue',
      text: <><span style={{ fontWeight: 500 }}>Complaint Resolution Follow-Up</span> — low response &amp; completion rates.</>,
      action: 'View program',
    },
  ]

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}
    >
      {/* Gradient bg — stronger presence */}
      <div
        style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(80,150,236,0.10) 0%, rgba(143,115,227,0.12) 40%, rgba(180,120,240,0.10) 70%, rgba(100,160,240,0.06) 100%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute', inset: 0,
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(143,115,227,0.14)',
          pointerEvents: 'none',
        }}
      />

      {/* Content — compact padding */}
      <div style={{ position: 'relative', padding: '16px 20px 16px 20px' }}>
        {/* Row 1: greeting + status pills + badge — all on one line */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          <span style={{ font: `600 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>
            Good morning, James
          </span>

          {/* Thin separator */}
          <div style={{ width: 1, height: 16, background: 'rgba(0,0,0,0.10)' }} />

          {/* Status pills inline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            {([
              { n: 3, l: 'Healthy', I: CheckCircle2, c: 'var(--lyra-color-status-success-strong)', b: 'var(--lyra-color-status-success-subtle)' },
              { n: 1, l: 'Monitoring', I: AlertTriangle, c: 'var(--lyra-color-status-warning-strong)', b: 'var(--lyra-color-status-warning-subtle)' },
              { n: 1, l: 'Attention', I: AlertCircle, c: 'var(--lyra-color-status-critical-strong)', b: 'var(--lyra-color-status-critical-subtle)' },
            ] as const).map(({ n, l, I, c, b }) => (
              <div
                key={l}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '2px 10px 2px 6px',
                  borderRadius: 'var(--radius-full)',
                  background: b,
                }}
              >
                <I size={12} style={{ color: c }} />
                <span style={{ font: `500 12px/16px ${FONT}`, color: c }}>{n} {l}</span>
              </div>
            ))}
          </div>

          {/* AI badge pushed to far right */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, padding: '2px 10px', borderRadius: 'var(--radius-full)', background: 'rgba(143,115,227,0.08)', border: '1px solid rgba(143,115,227,0.14)' }}>
            <Sparkles size={11} style={{ color: '#4E39A8' }} />
            <span style={{ font: `500 11px/16px ${FONT}`, letterSpacing: '0.02em', color: '#4E39A8', textTransform: 'uppercase' as const }}>AI Briefing</span>
          </div>
        </div>

        {/* Row 2: three insight columns — compact, single-row feel */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          gap: 'var(--space-3)',
          marginTop: 12,
        }}>
          {insights.map(({ Icon, iconColor, iconBg, label, text, action }) => (
            <div
              key={label}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)',
                background: 'rgba(255,255,255,0.65)',
                backdropFilter: 'blur(12px)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                border: '1px solid rgba(255,255,255,0.5)',
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: 'var(--radius-sm)',
                background: iconBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon size={14} style={{ color: iconColor }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <span style={{ font: `500 12px/16px ${FONT}`, letterSpacing: '0.01em', textTransform: 'uppercase' as const, color: 'var(--lyra-color-fg-secondary)' }}>
                  {label}
                </span>
                <p style={{ font: `400 12px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)', marginTop: 2 }}>
                  {text}
                </p>
                {action && (
                  <button style={{
                    display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 4,
                    font: `500 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-link)',
                    background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                  }}>
                    {action} <ArrowRight size={11} />
                  </button>
                )}
              </div>
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
      {/* Page Header */}
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
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-2)' }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search program name" />
          <DateRangeField value="Jul 1 - Jul 30" />
          <FilterDropdown value={program} options={['All programs', 'Program A', 'Program B']} onChange={setProgram} />
          <FilterDropdown value={channel} options={['All channels', 'Email', 'SMS', 'IVR']} onChange={setChannel} />
          <FilterDropdown value={category} options={['All categories', 'Category A', 'Category B']} onChange={setCategory} />
        </div>

        {/* AI Health Briefing */}
        <div style={{ marginTop: 'var(--space-6)' }}>
          <HealthBriefingCard />
        </div>

        <div style={{ marginTop: 'var(--space-6)' }}>
          <ProgramPerformanceCard />
        </div>

        <div style={{ marginTop: 'var(--space-6)' }}>
          <CsatAsatCards />
        </div>

        <div style={{ marginTop: 'var(--space-6)' }}>
          <WhySurveysNotSentCard />
        </div>

        <div style={{ marginTop: 'var(--space-6)' }}>
          <ProgramsTableCard />
        </div>
      </div>
    </div>
  )
}
