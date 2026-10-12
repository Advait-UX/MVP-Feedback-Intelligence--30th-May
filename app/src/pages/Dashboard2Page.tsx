import { useState } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'
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

export function Dashboard2Page() {
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
          Dashboard 2
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
