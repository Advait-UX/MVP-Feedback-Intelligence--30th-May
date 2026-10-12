import { useState } from 'react'

const FONT = 'var(--font-sans)'

interface ProgramRow {
  name: string
  eligible: number
  coverage: number
  surveysSent: number
  responseRate: number
  responsesReceived: number
  completionRate: number
  completed: number
  partial: number
  csat: number
  alerts: number
}

const PROGRAMS: ProgramRow[] = [
  { name: 'Flight disruption recovery', eligible: 2308, coverage: 86, surveysSent: 1985, responseRate: 61, responsesReceived: 1211, completionRate: 72, completed: 872, partial: 339, csat: 81, alerts: 8 },
  { name: 'Negative sentiment catcher', eligible: 1542, coverage: 89, surveysSent: 1372, responseRate: 45, responsesReceived: 617, completionRate: 53, completed: 327, partial: 290, csat: 77, alerts: 12 },
  { name: 'Omnichannel escalation recovery', eligible: 1435, coverage: 93, surveysSent: 1335, responseRate: 62, responsesReceived: 828, completionRate: 70, completed: 580, partial: 248, csat: 76, alerts: 14 },
  { name: 'Complaint resolution follow up', eligible: 1106, coverage: 96, surveysSent: 1062, responseRate: 30, responsesReceived: 319, completionRate: 43, completed: 137, partial: 182, csat: 58, alerts: 28 },
  { name: 'Product feedback', eligible: 834, coverage: 83, surveysSent: 692, responseRate: 66, responsesReceived: 457, completionRate: 72, completed: 329, partial: 128, csat: 74, alerts: 8 },
]

const THRESHOLDS = {
  coverage: 90,
  responseRate: 65,
  completionRate: 75,
  csat: 80,
}

function RatePill({ value, threshold }: { value: number; threshold: number }) {
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

export function ProgramsTableCard() {
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
        <h3 style={{ font: `500 14px/20px ${FONT}`, margin: 0, color: 'var(--lyra-color-fg-default)' }}>
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
                  <span style={{
                    font: `500 14px/20px ${FONT}`,
                    color: 'var(--lyra-color-fg-link)',
                    cursor: 'pointer',
                  }}>
                    {row.name}
                  </span>
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>
                  {row.eligible.toLocaleString()}
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <RatePill value={row.coverage} threshold={THRESHOLDS.coverage} />
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>
                  {row.surveysSent.toLocaleString()}
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <RatePill value={row.responseRate} threshold={THRESHOLDS.responseRate} />
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>
                  {row.responsesReceived.toLocaleString()}
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <RatePill value={row.completionRate} threshold={THRESHOLDS.completionRate} />
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>
                  {row.completed.toLocaleString()}
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>
                  {row.partial.toLocaleString()}
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <RatePill value={row.csat} threshold={THRESHOLDS.csat} />
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
