import { useMemo, useState } from 'react'
import { CAMPAIGNS, type Campaign } from '@/lib/campaigns'
import { deriveHealthRow, deriveQuestionType, type ProgramHealthRow } from '@/lib/mockDerive'
import { StatusPill, TableShell, Th, Td, EmptyRow } from '@/components/feedback-management/ListPagePrimitives'

const FONT = 'var(--font-sans)'
const LIVE_PROGRAMS = CAMPAIGNS.filter(c => c.status === 'active' || c.status === 'paused')

type GroupBy = 'program' | 'channel' | 'topic'

type AggregatedRow = ProgramHealthRow & {
  key: string
  label: string
  status?: Campaign['status']
  questionType?: string
}

function toAggregated(c: Campaign): AggregatedRow {
  return {
    key: c.id,
    label: c.name,
    status: c.status,
    questionType: deriveQuestionType(c),
    ...deriveHealthRow(c),
  }
}

function aggregateBy(campaigns: Campaign[], keyFn: (c: Campaign) => string): AggregatedRow[] {
  const groups = new Map<string, ProgramHealthRow[]>()
  for (const c of campaigns) {
    const key = keyFn(c)
    const list = groups.get(key) ?? []
    list.push(deriveHealthRow(c))
    groups.set(key, list)
  }
  return Array.from(groups.entries()).map(([label, rows]) => {
    const sum = (f: (r: ProgramHealthRow) => number) => rows.reduce((a, r) => a + f(r), 0)
    const interactions = sum(r => r.interactions)
    const eligible = sum(r => r.eligible)
    const surveysSent = sum(r => r.surveysSent)
    const responsesReceived = sum(r => r.responsesReceived)
    const completed = sum(r => r.completed)
    const partial = sum(r => r.partial)
    return {
      key: label,
      label,
      interactions,
      eligible,
      eligibilityRate: eligible ? Math.round((eligible / interactions) * 100) : 0,
      coverage: eligible ? Math.round((surveysSent / eligible) * 100) : 0,
      surveysSent,
      responseRate: surveysSent ? Math.round((responsesReceived / surveysSent) * 100) : 0,
      responsesReceived,
      completionRate: responsesReceived ? Math.round((completed / responsesReceived) * 100) : 0,
      completed,
      partial,
    }
  })
}

export function ProgramHealthPage() {
  const [groupBy, setGroupBy] = useState<GroupBy>('program')
  const [showBreakdown, setShowBreakdown] = useState(false)

  const totals = useMemo(() => {
    const rows = LIVE_PROGRAMS.map(deriveHealthRow)
    const sum = (f: (r: ProgramHealthRow) => number) => rows.reduce((a, r) => a + f(r), 0)
    const interactions = sum(r => r.interactions)
    const eligible = sum(r => r.eligible)
    const surveysSent = sum(r => r.surveysSent)
    const responsesReceived = sum(r => r.responsesReceived)
    const completed = sum(r => r.completed)
    const partial = sum(r => r.partial)
    const avgCsat = LIVE_PROGRAMS.reduce((a, c) => a + (c.csat ?? 0), 0) / (LIVE_PROGRAMS.length || 1)
    return {
      interactions, eligible, surveysSent, responsesReceived, completed, partial,
      eligibilityRate: interactions ? Math.round((eligible / interactions) * 100) : 0,
      coverage: eligible ? Math.round((surveysSent / eligible) * 100) : 0,
      responseRate: surveysSent ? Math.round((responsesReceived / surveysSent) * 100) : 0,
      completionRate: responsesReceived ? Math.round((completed / responsesReceived) * 100) : 0,
      avgCsat: Math.round((avgCsat / 20) * 10) / 10, // rough 0-100 CSAT -> 0-5 scale
    }
  }, [])

  const rows = useMemo(() => {
    if (groupBy === 'program') return LIVE_PROGRAMS.map(toAggregated)
    if (groupBy === 'channel') return aggregateBy(LIVE_PROGRAMS, c => c.channels[0] ?? 'Other')
    return aggregateBy(LIVE_PROGRAMS, c => c.topIntents[0] ?? 'Other')
  }, [groupBy])

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: 'var(--lyra-color-bg-surface-base)' }}>
      {/* Pane head */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', rowGap: 'var(--space-4)',
        minHeight: 72, padding: 'var(--space-4) var(--space-7)',
        borderBottom: '1px solid var(--lyra-color-border-subtle)',
        flexShrink: 0,
      }}>
        <h1 style={{
          margin: 0, font: '600 20px/24px var(--font-sans)',
          letterSpacing: '-0.3px', color: 'var(--lyra-color-fg-default)',
        }}>Program health</h1>
        <span className="body-sm" style={{ color: 'var(--lyra-color-fg-secondary)' }}>
          {LIVE_PROGRAMS.length} programs · {LIVE_PROGRAMS.filter(c => c.status === 'active').length} active
        </span>
      </div>

      <div className="flex-1 overflow-auto" style={{ background: 'var(--lyra-color-bg-surface-base)', padding: 'var(--space-7)' }}>

        {/* KPI funnel */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
          <KpiTile label="Interactions" value={totals.interactions.toLocaleString()} />
          <KpiTile label="Eligibility rate" value={`${totals.eligibilityRate}%`} sub={`Eligible ${totals.eligible.toLocaleString()}`} />
          <KpiTile label="Coverage" value={`${totals.coverage}%`} sub={`Sent ${totals.surveysSent.toLocaleString()}`} />
          <KpiTile label="Response rate" value={`${totals.responseRate}%`} sub={`Received ${totals.responsesReceived.toLocaleString()}`} />
          <KpiTile label="Completion rate" value={`${totals.completionRate}%`} sub={`Completed ${totals.completed.toLocaleString()} · Partial ${totals.partial.toLocaleString()}`} />
          <KpiTile label="Overall CSAT" value={totals.avgCsat.toFixed(1)} />
        </div>

        {/* Info banner */}
        <div style={{
          background: 'var(--lyra-color-status-info-subtle)', border: '1px solid rgba(45,91,185,0.2)',
          borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', marginBottom: 'var(--space-6)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)',
        }}>
          <span className="body-sm" style={{ color: 'var(--lyra-color-status-info-strong)' }}>
            {(totals.interactions - totals.eligible).toLocaleString()} of {totals.interactions.toLocaleString()} interactions never reached a survey.
            Most sit behind program settings you can change.
          </span>
          <button
            onClick={() => setShowBreakdown(v => !v)}
            style={{ background: 'none', border: 'none', color: 'var(--lyra-color-fg-link)', font: '500 12px/16px var(--font-sans)', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            {showBreakdown ? 'Hide breakdown' : 'Show breakdown'}
          </button>
        </div>

        {/* Programs table */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
          <span className="heading-xs" style={{ color: 'var(--lyra-color-fg-secondary)' }}>Programs</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span className="body-sm" style={{ color: 'var(--lyra-color-fg-secondary)' }}>Group by</span>
            {(['channel', 'topic', 'program'] as GroupBy[]).map(g => (
              <button
                key={g}
                onClick={() => setGroupBy(g)}
                style={{
                  height: 28, padding: '0 var(--space-3)', borderRadius: 'var(--radius-md)',
                  border: groupBy === g ? '1px solid var(--lyra-color-border-active)' : '1px solid var(--lyra-color-border-soft)',
                  background: groupBy === g ? 'var(--lyra-color-bg-active-subtle)' : 'var(--lyra-color-bg-surface-base)',
                  color: groupBy === g ? 'var(--lyra-color-fg-active-strong)' : 'var(--lyra-color-fg-default)',
                  font: '500 12px/16px var(--font-sans)', textTransform: 'capitalize', cursor: 'pointer',
                }}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <TableShell>
          <thead>
            <tr>
              <Th>Program</Th>
              <Th align="right">Eligible</Th>
              <Th align="right">Coverage</Th>
              <Th align="right">Surveys sent</Th>
              <Th align="right">Response rate</Th>
              <Th align="right">Responses received</Th>
              <Th align="right">Completion rate</Th>
              <Th align="right">Completed</Th>
              <Th align="right">Partial</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <EmptyRow colSpan={9} message="No programs to show." />}
            {rows.map(r => (
              <tr
                key={r.key}
                style={{ borderBottom: '1px solid var(--lyra-color-border-subtle)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}
              >
                <Td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontWeight: 500 }}>{r.label}</span>
                    {(r.status || r.questionType) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {r.status && <StatusPill label={r.status === 'active' ? 'Active' : 'Paused'} tone={r.status === 'active' ? 'success' : 'warning'} />}
                        {r.questionType && <span className="body-sm" style={{ color: 'var(--lyra-color-fg-secondary)' }}>{r.questionType}</span>}
                      </div>
                    )}
                  </div>
                </Td>
                <Td align="right">{r.eligible.toLocaleString()}</Td>
                <Td align="right">{r.coverage}%</Td>
                <Td align="right">{r.surveysSent.toLocaleString()}</Td>
                <Td align="right">{r.responseRate}%</Td>
                <Td align="right">{r.responsesReceived.toLocaleString()}</Td>
                <Td align="right">{r.completionRate}%</Td>
                <Td align="right">{r.completed.toLocaleString()}</Td>
                <Td align="right">{r.partial.toLocaleString()}</Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </div>
    </div>
  )
}

function KpiTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{
      background: 'var(--lyra-color-bg-surface-base)', border: '1px solid var(--lyra-color-border-soft)',
      borderRadius: 'var(--radius-lg)', boxShadow: 'var(--sol-effect-shadowsm)', padding: 'var(--space-5)',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--lyra-color-bg-primary)' }} />
      <div className="body-sm" style={{ color: 'var(--lyra-color-fg-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--space-2)', fontFamily: FONT }}>
        {label}
      </div>
      <div className="heading-xl" style={{ color: 'var(--lyra-color-fg-default)' }}>{value}</div>
      {sub && <div className="body-sm" style={{ color: 'var(--lyra-color-fg-secondary)', marginTop: 'var(--space-1)' }}>{sub}</div>}
    </div>
  )
}
