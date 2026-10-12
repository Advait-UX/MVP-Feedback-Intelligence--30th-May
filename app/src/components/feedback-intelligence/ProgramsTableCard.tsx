import { useState } from 'react'

const FONT = 'var(--font-sans)'

interface ProgramRow {
  name: string
  eligible: number
  coverage: number
  coverageUp: boolean
  surveysSent: number
  responseRate: number
  responseRateUp: boolean
  responsesReceived: number
  completionRate: number
  completionRateUp: boolean
  completed: number
  partial: number
  csat: number
  csatUp: boolean
  alerts: number
  needsAttention?: boolean
  responseRateDropPp?: number
  csatDropPp?: number
}

const PROGRAMS: ProgramRow[] = [
  { name: 'Flight disruption recovery', eligible: 2308, coverage: 86, coverageUp: true, surveysSent: 1985, responseRate: 61, responseRateUp: true, responsesReceived: 1211, completionRate: 72, completionRateUp: true, completed: 872, partial: 339, csat: 81, csatUp: true, alerts: 8 },
  { name: 'Negative sentiment catcher', eligible: 1542, coverage: 89, coverageUp: true, surveysSent: 1372, responseRate: 45, responseRateUp: false, responsesReceived: 617, completionRate: 53, completionRateUp: false, completed: 327, partial: 290, csat: 77, csatUp: false, alerts: 12 },
  { name: 'Omnichannel escalation recovery', eligible: 1435, coverage: 93, coverageUp: true, surveysSent: 1335, responseRate: 62, responseRateUp: true, responsesReceived: 828, completionRate: 70, completionRateUp: true, completed: 580, partial: 248, csat: 76, csatUp: false, alerts: 14 },
  { name: 'Complaint resolution follow up', eligible: 1106, coverage: 96, coverageUp: false, surveysSent: 1062, responseRate: 30, responseRateUp: false, responsesReceived: 319, completionRate: 43, completionRateUp: false, completed: 137, partial: 182, csat: 58, csatUp: false, alerts: 28, needsAttention: true, responseRateDropPp: 9, csatDropPp: 6 },
  { name: 'Product feedback', eligible: 834, coverage: 83, coverageUp: false, surveysSent: 692, responseRate: 66, responseRateUp: true, responsesReceived: 457, completionRate: 72, completionRateUp: true, completed: 329, partial: 128, csat: 74, csatUp: true, alerts: 8 },
]

function NeedsAttentionChip() {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 10px',
      borderRadius: 'var(--radius-full)',
      border: '1px solid var(--lyra-color-status-critical-medium)',
      background: 'var(--lyra-color-status-critical-subtle)',
      font: `500 12px/16px ${FONT}`,
      color: 'var(--lyra-color-status-critical-strong)',
      whiteSpace: 'nowrap',
    }}>
      Needs attention
    </span>
  )
}

function PpDrop({ value }: { value: number }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 2,
      marginLeft: 'var(--space-2)',
      font: `500 12px/16px ${FONT}`,
      color: 'var(--lyra-color-status-critical-strong)',
      whiteSpace: 'nowrap',
    }}>
      ▼ {value}pp
    </span>
  )
}

const THRESHOLDS = {
  coverage: 90,
  responseRate: 65,
  completionRate: 75,
  csat: 80,
}

function RatePill({ value, threshold, up, hideTargets }: { value: number; threshold: number; up?: boolean; hideTargets?: boolean }) {
  if (hideTargets) {
    const arrowColor = up ? 'var(--lyra-color-status-success-strong)' : 'var(--lyra-color-status-critical-strong)'
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 12px',
        borderRadius: 'var(--radius-full)',
        border: '1px solid var(--lyra-color-border-soft)',
        background: 'var(--lyra-slate-100)',
        font: `500 12px/16px ${FONT}`,
        color: 'var(--lyra-color-fg-default)',
        whiteSpace: 'nowrap',
      }}>
        <span style={{ color: arrowColor }}>{up ? '▲' : '▼'}</span>
        {value}%
      </span>
    )
  }

  const isGreen = value >= threshold
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 12px',
      borderRadius: 'var(--radius-full)',
      border: `1px solid ${isGreen ? 'var(--lyra-color-status-success-medium)' : 'var(--lyra-color-status-warning-medium)'}`,
      background: isGreen ? 'var(--lyra-color-status-success-subtle)' : 'var(--lyra-color-status-warning-subtle)',
      font: `500 12px/16px ${FONT}`,
      color: isGreen ? 'var(--lyra-color-status-success-strong)' : 'var(--lyra-color-status-warning-strong)',
      whiteSpace: 'nowrap',
    }}>
      {value}%
    </span>
  )
}

const GROUP_OPTIONS = ['Program', 'Channel', 'Topic'] as const

const COLUMNS = [
  'Program', 'Eligible', 'Coverage', 'Surveys Sent', 'Response Rate',
  'Responses Received', 'Completion Rate', 'Completed', 'Partial', 'CSAT', 'Alerts',
] as const

export function ProgramsTableCard({ hideTargets }: { hideTargets?: boolean } = {}) {
  const [groupBy, setGroupBy] = useState<string>('Program')

  return (
    <div style={{
      background: 'var(--lyra-color-bg-surface-base)',
      border: '1px solid var(--lyra-color-border-soft)',
      borderRadius: 'var(--radius-lg)',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <h3 style={{ font: `600 18px/24px ${FONT}`, letterSpacing: '-0.01em', margin: 0, color: 'var(--lyra-color-fg-default)' }}>
          Programs
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <span style={{ font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>
            Group by
          </span>
          <div style={{
            display: 'flex',
            border: '1px solid var(--lyra-color-border-soft)',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
          }}>
            {GROUP_OPTIONS.map((opt, i) => (
              <button
                key={opt}
                onClick={() => setGroupBy(opt)}
                style={{
                  padding: '4px 16px',
                  font: `500 12px/16px ${FONT}`,
                  border: 'none',
                  cursor: 'pointer',
                  background: groupBy === opt ? 'var(--lyra-color-bg-active-subtle)' : 'transparent',
                  color: groupBy === opt ? 'var(--lyra-color-fg-active-strong)' : 'var(--lyra-color-fg-secondary)',
                  borderRight: i < GROUP_OPTIONS.length - 1 ? '1px solid var(--lyra-color-border-subtle)' : undefined,
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--lyra-color-border-subtle)' }}>
              {COLUMNS.map(col => (
                <th
                  key={col}
                  scope="col"
                  style={{
                    padding: 'var(--space-3) var(--space-4)',
                    textAlign: col === 'Alerts' ? 'right' : 'left',
                    font: `500 13px/18px ${FONT}`,
                    color: 'var(--lyra-color-fg-default)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PROGRAMS.map(row => (
              <tr key={row.name} style={{ borderBottom: '1px solid var(--lyra-color-border-subtle)' }}>
                <td style={{ padding: 'var(--space-4)', whiteSpace: 'nowrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span style={{
                      font: `500 14px/20px ${FONT}`,
                      color: 'var(--lyra-color-fg-link)',
                      cursor: 'pointer',
                    }}>
                      {row.name}
                    </span>
                    {row.needsAttention && <NeedsAttentionChip />}
                  </span>
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>
                  {row.eligible.toLocaleString()}
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <RatePill value={row.coverage} threshold={THRESHOLDS.coverage} up={row.coverageUp} hideTargets={hideTargets} />
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>
                  {row.surveysSent.toLocaleString()}
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <RatePill value={row.responseRate} threshold={THRESHOLDS.responseRate} up={row.responseRateUp} hideTargets={hideTargets} />
                  {row.responseRateDropPp != null && <PpDrop value={row.responseRateDropPp} />}
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>
                  {row.responsesReceived.toLocaleString()}
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <RatePill value={row.completionRate} threshold={THRESHOLDS.completionRate} up={row.completionRateUp} hideTargets={hideTargets} />
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>
                  {row.completed.toLocaleString()}
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>
                  {row.partial.toLocaleString()}
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <RatePill value={row.csat} threshold={THRESHOLDS.csat} up={row.csatUp} hideTargets={hideTargets} />
                  {row.csatDropPp != null && <PpDrop value={row.csatDropPp} />}
                </td>
                <td style={{
                  padding: 'var(--space-3) var(--space-4)',
                  font: `600 14px/20px ${FONT}`,
                  color: 'var(--lyra-color-status-critical-strong)',
                  textAlign: 'right',
                }}>
                  {row.alerts}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
