// StatusPill — campaign status badge (active / inactive / expired).
// CSS classes come from global stylesheet (fi-pill, dot).

type StatusPillStatus = 'active' | 'inactive' | 'expired' | 'working'

interface StatusPillProps {
  s: StatusPillStatus | string
}

export function StatusPill({ s }: StatusPillProps) {
  const label: Record<string, string> = {
    active: 'Active',
    inactive: 'Inactive',
    expired: 'Expired',
    working: 'Working Copy',
  }
  return (
    <span className={`fi-pill ${s}`}>
      <span className="dot" />
      {label[s] ?? s}
    </span>
  )
}
