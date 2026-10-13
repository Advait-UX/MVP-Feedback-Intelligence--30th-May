import { useState, useMemo, useEffect, useRef } from 'react'
import { Bell, Calendar, ChevronDown, ChevronLeft, ChevronRight, Info, Mail, Phone, Sparkles, Star, X } from 'lucide-react'
import { SearchInput } from '../components/feedback-management/ListPagePrimitives'

const FONT = 'var(--font-sans)'

/* ── Data ── */
const PROGRAMS = [
  { n: 'Complaint Resolution Follow-Up', tags: ['Active', 'AI questions', 'Needs attention'], cat: 'Service Recovery', ch: { SMS: 0.6, Email: 0.4 }, inter: 3350, elig: 1106, sent: 1062, rec: 319, comp: 137, csat: 59, csatD: '↓ 6pp', rrD: '↓ 9pp', alerts: 10, coverageUp: false, responseRateUp: false, completionRateUp: false, csatUp: false },
  { n: 'Flight Disruption Recovery', tags: ['Active', 'AI questions'], cat: 'Service Disruption', ch: { WhatsApp: 0.5, SMS: 0.3, Email: 0.2 }, inter: 6990, elig: 2308, sent: 1985, rec: 1211, comp: 872, csat: 86, alerts: 3, coverageUp: true, responseRateUp: true, completionRateUp: true, csatUp: true },
  { n: 'Billing and Refund Recovery · All Digital', tags: ['Active', 'AI questions'], cat: 'Billing Recovery', ch: { Email: 0.55, SMS: 0.45 }, inter: 4675, elig: 1542, sent: 1372, rec: 617, comp: 327, csat: 81, alerts: 4, coverageUp: true, responseRateUp: true, completionRateUp: true, csatUp: true },
  { n: 'Omnichannel Escalation Recovery', tags: ['Active', 'AI questions'], cat: 'Service Recovery', ch: { Email: 0.4, WhatsApp: 0.35, SMS: 0.25 }, inter: 4350, elig: 1435, sent: 1335, rec: 828, comp: 580, csat: 80, alerts: 5, coverageUp: true, responseRateUp: true, completionRateUp: true, csatUp: true },
  { n: 'Product Feedback - Beta Testers', tags: ['Inactive', 'Static questions'], cat: 'Product', ch: { Email: 0.7, WhatsApp: 0.3 }, inter: 2555, elig: 834, sent: 692, rec: 457, comp: 329, csat: 75, alerts: 5, coverageUp: true, responseRateUp: true, completionRateUp: true, csatUp: true },
]

const REASONS: [string, number, string][] = [
  ['No matching skill/team', 4534, 't'], ['Recency window', 3458, 't'], ['Program not found', 2134, 't'],
  ['Interaction too short', 2021, 't'], ['Outside send window', 829, 't'], ['Survey refused', 1053, 'c'], ['Internal interaction', 666, 'c'],
]
const SKIP_ALL = 14695

const fmt = (n: number) => Math.round(n).toLocaleString('en-US')
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0)

/* ── Shared filter controls ── */
function FilterDropdown({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', height: 36, paddingLeft: 12, paddingRight: 12, width: 177, background: 'var(--lyra-color-bg-field)', border: '1px solid var(--lyra-color-border-soft)', borderRadius: 'var(--radius-md)' }}>
      <span style={{ flex: 1, font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
      <ChevronDown size={16} style={{ color: 'var(--lyra-color-fg-secondary)', flexShrink: 0, pointerEvents: 'none' }} />
      <select value={value} onChange={e => onChange(e.target.value)} style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  )
}

/* ── Date range picker (Lyra pattern: presets + calendar) ── */
type DateRange = { start: Date; end: Date }
const TODAY = new Date(2026, 9, 12)

const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
const fmtDay = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
const fmtRange = (r: DateRange | null) => (r ? `${fmtDay(r.start)} – ${fmtDay(r.end)}` : '')

const lastN = (n: number): DateRange => ({ start: addDays(TODAY, -(n - 1)), end: TODAY })
const previousN = (n: number): DateRange => ({ start: addDays(TODAY, -n), end: addDays(TODAY, -1) })
const nextN = (n: number): DateRange => ({ start: addDays(TODAY, 1), end: addDays(TODAY, n) })

const RANGE_PRESETS: { label: string; range: () => DateRange }[] = [
  { label: 'Current day', range: () => ({ start: TODAY, end: TODAY }) },
  { label: 'Previous day', range: () => previousN(1) },
  { label: 'Next day', range: () => nextN(1) },
  { label: 'Last 2 days', range: () => lastN(2) },
  { label: 'Previous 2 days', range: () => previousN(2) },
  { label: 'Next 2 days', range: () => nextN(2) },
  { label: 'Last 5 days', range: () => lastN(5) },
  { label: 'Last 7 days', range: () => lastN(7) },
  { label: 'This week', range: () => { const s = addDays(TODAY, -TODAY.getDay()); return { start: s, end: addDays(s, 6) } } },
]

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function NavButton({ onClick, disabled, label, children }: { onClick: () => void; disabled?: boolean; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button" onClick={onClick} disabled={disabled} aria-label={label}
      style={{ width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', borderRadius: 'var(--radius-md)', color: disabled ? 'var(--lyra-color-fg-disabled)' : 'var(--lyra-color-fg-secondary)', cursor: disabled ? 'default' : 'pointer' }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
    >
      {children}
    </button>
  )
}

function DateRangePicker({ value, onChange }: { value: DateRange | null; onChange: (r: DateRange | null) => void }) {
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState(() => new Date((value?.start ?? TODAY).getFullYear(), (value?.start ?? TODAY).getMonth(), 1))
  const [pending, setPending] = useState<Date | null>(null)
  const [hover, setHover] = useState<Date | null>(null)
  const [xMode, setXMode] = useState(false)
  const [xDays, setXDays] = useState('14')
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (rootRef.current && !rootRef.current.contains(e.target as Node)) close() }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  function close() { setOpen(false); setPending(null); setHover(null); setXMode(false) }
  function apply(r: DateRange) { onChange(r); setMonth(new Date(r.start.getFullYear(), r.start.getMonth(), 1)); close() }

  function pickDay(d: Date) {
    if (!pending) { setPending(d); return }
    apply(pending <= d ? { start: pending, end: d } : { start: d, end: pending })
  }

  // The band shown in the grid: a committed range, or the in-progress start→hover preview.
  const preview: DateRange | null = pending
    ? (hover ? (pending <= hover ? { start: pending, end: hover } : { start: hover, end: pending }) : { start: pending, end: pending })
    : value

  const y = month.getFullYear(), m = month.getMonth()
  const firstDow = new Date(y, m, 1).getDay()
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const cells: (Date | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => new Date(y, m, i + 1))]
  while (cells.length % 7) cells.push(null)

  const inBand = (d: Date) => !!preview && dayStart(d) >= dayStart(preview.start) && dayStart(d) <= dayStart(preview.end)
  const isEdge = (d: Date) => !!preview && (sameDay(d, preview.start) || sameDay(d, preview.end))

  return (
    <div ref={rootRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
      <button
        type="button" onClick={() => (open ? close() : setOpen(true))} aria-haspopup="dialog" aria-expanded={open} aria-label="Select date range"
        style={{ display: 'flex', alignItems: 'center', height: 36, paddingLeft: 12, paddingRight: 12, width: 220, background: 'var(--lyra-color-bg-field)', border: `1px solid ${open ? 'var(--lyra-color-border-active)' : 'var(--lyra-color-border-soft)'}`, borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'left' }}
      >
        <span style={{ flex: 1, font: `400 14px/20px ${FONT}`, color: value ? 'var(--lyra-color-fg-default)' : 'var(--lyra-color-fg-disabled)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {value ? fmtRange(value) : 'Start Date – End Date'}
        </span>
        <Calendar size={16} style={{ color: 'var(--lyra-color-fg-secondary)', flexShrink: 0 }} />
      </button>

      {open && (
        <div
          role="dialog" aria-label="Date range"
          style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 300, display: 'flex', background: 'var(--lyra-color-bg-surface-overlay)', border: '1px solid var(--lyra-color-border-soft)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--sol-effect-shadowlg)', overflow: 'hidden' }}
        >
          {/* Presets */}
          <div style={{ width: 168, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--lyra-color-border-subtle)' }}>
            <div style={{ flex: 1, padding: 'var(--space-2)', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {RANGE_PRESETS.map(p => {
                const r = p.range()
                const active = !!value && sameDay(value.start, r.start) && sameDay(value.end, r.end)
                return (
                  <button
                    key={p.label} type="button" onClick={() => apply(r)}
                    style={{ textAlign: 'left', padding: '6px 10px', border: 'none', borderRadius: 'var(--radius-sm)', font: `${active ? 500 : 400} 14px/20px ${FONT}`, color: active ? 'var(--lyra-color-fg-active-strong)' : 'var(--lyra-color-fg-default)', background: active ? 'var(--lyra-color-bg-active-subtle)' : 'transparent', cursor: 'pointer' }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                  >
                    {p.label}
                  </button>
                )
              })}
            </div>
            <div style={{ borderTop: '1px solid var(--lyra-color-border-subtle)', padding: 'var(--space-2)' }}>
              {xMode ? (
                <form
                  noValidate
                  onSubmit={e => { e.preventDefault(); const n = Math.max(1, Math.min(365, parseInt(xDays, 10) || 1)); apply(lastN(n)) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}
                >
                  Last
                  <input
                    autoFocus type="number" min={1} max={365} value={xDays} onChange={e => setXDays(e.target.value)} aria-label="Number of days"
                    style={{ width: 52, height: 28, padding: '0 6px', font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)', background: 'var(--lyra-color-bg-field)', border: '1px solid var(--lyra-color-border-soft)', borderRadius: 'var(--radius-sm)', outline: 'none' }}
                  />
                  days
                  <button type="submit" aria-label="Apply" style={{ marginLeft: 'auto', border: 'none', background: 'transparent', font: `500 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-link)', cursor: 'pointer', padding: 0 }}>Apply</button>
                </form>
              ) : (
                <button
                  type="button" onClick={() => setXMode(true)}
                  style={{ width: '100%', padding: '6px 10px', border: 'none', borderRadius: 'var(--radius-sm)', font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-secondary)', background: 'transparent', cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  Last X days
                </button>
              )}
            </div>
          </div>

          {/* Calendar */}
          <div style={{ width: 328, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: 'var(--space-3) var(--space-4) var(--space-2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <NavButton onClick={() => setMonth(new Date(y, m - 1, 1))} label="Previous month"><ChevronLeft size={16} /></NavButton>
              <span style={{ font: `600 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>{month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
              <NavButton onClick={() => setMonth(new Date(y, m + 1, 1))} label="Next month"><ChevronRight size={16} /></NavButton>
            </div>
            <div style={{ padding: '0 var(--space-4) var(--space-3)', display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: 2 }} onMouseLeave={() => setHover(null)}>
              {WEEKDAYS.map(w => (
                <div key={w} style={{ height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', font: `500 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>{w}</div>
              ))}
              {cells.map((d, i) => {
                if (!d) return <div key={`e${i}`} />
                const edge = isEdge(d), band = inBand(d), today = sameDay(d, TODAY)
                const bandStart = !!preview && sameDay(d, preview.start), bandEnd = !!preview && sameDay(d, preview.end)
                return (
                  <div key={d.getTime()} style={{ position: 'relative', height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {band && !(bandStart && bandEnd) && (
                      <span aria-hidden="true" style={{ position: 'absolute', top: 2, bottom: 2, left: bandStart ? '50%' : 0, right: bandEnd ? '50%' : 0, background: 'var(--lyra-color-bg-active-subtle)' }} />
                    )}
                    <button
                      type="button" onClick={() => pickDay(d)} onMouseEnter={() => setHover(d)} aria-label={d.toDateString()} aria-pressed={edge}
                      style={{ position: 'relative', width: 32, height: 32, border: today && !edge ? '1px solid var(--lyra-color-border-active)' : '1px solid transparent', borderRadius: 'var(--radius-full)', background: edge ? 'var(--lyra-color-bg-primary)' : 'transparent', color: edge ? 'var(--lyra-color-fg-on-primary)' : 'var(--lyra-color-fg-default)', font: `${edge ? 500 : 400} 14px/20px ${FONT}`, cursor: 'pointer' }}
                      onMouseOver={e => { if (!edge) e.currentTarget.style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
                      onMouseOut={e => { if (!edge) e.currentTarget.style.background = 'transparent' }}
                    >
                      {d.getDate()}
                    </button>
                  </div>
                )
              })}
            </div>
            <div style={{ marginTop: 'auto', borderTop: '1px solid var(--lyra-color-border-subtle)', padding: 'var(--space-2)', display: 'flex', justifyContent: 'center' }}>
              <button
                type="button" onClick={() => setMonth(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1))}
                style={{ padding: '6px 16px', border: 'none', borderRadius: 'var(--radius-sm)', font: `500 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-link)', background: 'transparent', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                Today
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Program Performance Funnel ── */
type FunnelData = { inter: number; elig: number; sent: number; rec: number; comp: number; part: number; csat: number; alerts: number }
type FunnelDeltas = { stages: string[]; rates: string[]; csat: string; alerts: string }
const DEFAULT_DELTAS: FunnelDeltas = { stages: ['+13%', '+8%', '+4%', '+2%', '+3%'], rates: ['+3pp', '+8pp', '+4pp', '+5pp'], csat: '+3pp', alerts: '-2%' }

function ProgramPerformanceFunnel({ data, subtitle, deltas = DEFAULT_DELTAS, footnote }: { data: FunnelData; subtitle: string; deltas?: FunnelDeltas; footnote?: string }) {
  const { inter, elig, sent, rec, comp, part, csat, alerts } = data

  const stages: [string, number, string][] = [
    ['Total Interactions', inter, deltas.stages[0]], ['Eligible', elig, deltas.stages[1]],
    ['Surveys sent', sent, deltas.stages[2]], ['Responses received', rec, deltas.stages[3]],
    ['Surveys completed', rec, deltas.stages[4]],
  ]
  const rates = [
    [pct(elig, inter), 'Eligibility rate', deltas.rates[0]],
    [pct(sent, elig), 'Coverage', deltas.rates[1]],
    [pct(rec, sent), 'Response rate', deltas.rates[2]],
    [pct(comp, rec), 'Completion rate', deltas.rates[3]],
  ]

  const CW = 192, BW = 140
  const mx = Math.max(inter, 1)
  const hgt = (v: number) => 92 * Math.sqrt(Math.max(v, 0) / mx)
  const COLS = ['#9FC0EE', '#78A6E6', '#4F8BDC', '#2F72D0']

  let bandSvg = ''
  stages.forEach(([, v], i) => {
    const h = hgt(v), x = i * CW
    if (i < 4) {
      const nextH = hgt(stages[i + 1][1])
      bandSvg += `<rect x="${x}" y="${(50 - h / 2).toFixed(1)}" width="${BW}" height="${h.toFixed(1)}" rx="0" fill="${COLS[i]}"/>`
      bandSvg += `<path d="M${x + BW} ${(50 - h / 2).toFixed(1)} L${x + CW} ${(50 - nextH / 2).toFixed(1)} L${x + CW} ${(50 + nextH / 2).toFixed(1)} L${x + BW} ${(50 + h / 2).toFixed(1)} Z" fill="#DCE8F8"/>`
    } else {
      const hf = rec ? h * comp / rec : 0, hp = h - hf, top = 50 - h / 2
      bandSvg += `<rect x="${x}" y="${top.toFixed(1)}" width="${BW}" height="${hf.toFixed(1)}" rx="0" fill="#1F4E99"/>`
      bandSvg += `<rect x="${x}" y="${(top + hf).toFixed(1)}" width="${BW}" height="${hp.toFixed(1)}" rx="0" fill="#9BB9E6"/>`
    }
  })

  const crit = Math.round(alerts * 10 / 27), warn = Math.round(alerts * 6 / 27), info = Math.max(0, alerts - crit - warn)

  return (
    <div style={{ background: 'var(--lyra-color-bg-surface-base)', border: '1px solid var(--lyra-color-border-subtle)', borderRadius: 'var(--radius-lg)', padding: '18px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
        <h3 style={{ font: `600 17px/24px ${FONT}`, margin: 0, color: 'var(--lyra-color-fg-default)' }}>Program performance</h3>
        <span style={{ font: `400 12px/18px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>{subtitle}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 230px', gap: 24 }}>
        {/* Main funnel */}
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)' }}>
            {stages.map(([label, value, delta], i) => (
              <div key={label} style={{ display: 'flex', alignItems: 'flex-start', paddingRight: 10 }}>
                <div style={{ display: 'grid' }}>
                  <b style={{ font: `600 19px/1.15 ${FONT}`, letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums', color: 'var(--lyra-color-fg-default)' }}>
                    {fmt(value)}
                    <i style={{ fontStyle: 'normal', fontSize: 13, fontWeight: 500, marginLeft: 6, color: 'var(--lyra-color-status-success-strong)' }}>↑ {delta}</i>
                  </b>
                  <span style={{ font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-secondary)', whiteSpace: 'nowrap' }}>
                    {label}
                    {i === 4 && (
                      <span style={{ display: 'block', font: `400 14px/16px ${FONT}`, color: 'var(--lyra-color-fg-secondary)', marginTop: 2 }}>
                        <i style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: '#1F4E99', margin: '0 4px 0 2px', verticalAlign: 'middle' }} />{fmt(comp)} full
                        <i style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: '#9BB9E6', margin: '0 4px 0 6px', verticalAlign: 'middle' }} />{fmt(part)} partial
                      </span>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* SVG band */}
          <div style={{ position: 'relative', width: '100%' }}>
            <svg
              viewBox="0 0 960 100"
              preserveAspectRatio="none"
              style={{ width: '100%', height: 60, display: 'block', marginTop: 10 }}
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: bandSvg }}
            />
            {rates.map(([val, , ], i) => (
              <span
                key={i}
                style={{
                  position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)',
                  left: `${((2 * i * CW + BW + CW) / 2 / 960 * 100).toFixed(2)}%`,
                  font: `600 12px/14px ${FONT}`, color: 'var(--lyra-color-fg-default)',
                  background: 'var(--lyra-color-bg-surface-base)', border: '1px solid var(--lyra-color-border-medium)',
                  borderRadius: 'var(--radius-full)', padding: '2px 8px', pointerEvents: 'none',
                  boxShadow: '0 1px 2px rgba(28,37,48,0.06)',
                }}
              >
                {val}%
              </span>
            ))}
          </div>

          {/* Rate labels */}
          <div style={{ position: 'relative', height: 34, marginTop: 4 }}>
            {rates.map(([, label, delta], i) => (
              <div
                key={i}
                style={{
                  position: 'absolute', top: 0, left: `${((2 * i * CW + BW + CW) / 2 / 960 * 100).toFixed(2)}%`,
                  transform: 'translateX(-50%)', display: 'grid', justifyItems: 'center', rowGap: 1,
                  whiteSpace: 'nowrap', textAlign: 'center',
                }}
              >
                <span style={{ font: `500 12px/16px ${FONT}`, color: 'var(--lyra-color-status-success-strong)' }}>↑ {delta}</span>
                <span style={{ font: `500 12px/14px ${FONT}`, letterSpacing: '0.04em', textTransform: 'uppercase' as const, color: 'var(--lyra-color-fg-secondary)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Side cards */}
        <div style={{ borderLeft: '1px solid var(--lyra-color-border-subtle)', paddingLeft: 24, display: 'grid', gridTemplateColumns: '1fr', rowGap: 12, alignContent: 'start', paddingTop: 6 }}>
          {/* CSAT */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', rowGap: 6, columnGap: 10, alignItems: 'end' }}>
            <span style={{ font: `500 12px/16px ${FONT}`, letterSpacing: '0.03em', textTransform: 'uppercase' as const, color: 'var(--lyra-color-fg-secondary)', gridColumn: '1 / 3' }}>CSAT</span>
            <b style={{ font: `600 24px/1 ${FONT}`, letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums', color: 'var(--lyra-color-fg-default)' }}>{csat}%</b>
            <span style={{ font: `500 13px/16px ${FONT}`, color: 'var(--lyra-color-status-success-strong)', whiteSpace: 'nowrap' }}>↑ {deltas.csat}</span>
            <span style={{ gridColumn: '1 / 3', height: 6, background: '#EEF1F4', borderRadius: 3, position: 'relative', overflow: 'hidden' }}>
              <i style={{ position: 'absolute', left: 0, top: 0, bottom: 0, background: 'var(--lyra-color-status-success-strong)', borderRadius: 3, width: `${csat}%` }} />
            </span>
            <span style={{ gridColumn: '1 / 3', font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-secondary)', marginTop: -2 }}>
              Target 78% · {csat >= 78 ? `${csat - 78} pts above` : `${78 - csat} pts below`}
            </span>
          </div>

          {/* Alerts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', rowGap: 6, columnGap: 10, alignItems: 'end' }}>
            <span style={{ font: `500 12px/16px ${FONT}`, letterSpacing: '0.03em', textTransform: 'uppercase' as const, color: 'var(--lyra-color-fg-secondary)', gridColumn: '1 / 3' }}>Alerts</span>
            <b style={{ font: `600 24px/1 ${FONT}`, letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums', color: 'var(--lyra-color-fg-default)' }}>{alerts}</b>
            <span style={{ font: `500 13px/16px ${FONT}`, color: 'var(--lyra-color-status-critical-strong)', whiteSpace: 'nowrap' }}>↓ {deltas.alerts}</span>
            <span style={{ gridColumn: '1 / 3', display: 'flex', gap: 3 }}>
              {Array.from({ length: crit }, (_, i) => <i key={`c${i}`} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--lyra-color-status-critical-strong)', opacity: 0.85 }} />)}
              {Array.from({ length: warn }, (_, i) => <i key={`w${i}`} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--lyra-color-status-warning-strong)', opacity: 0.85 }} />)}
              {Array.from({ length: info }, (_, i) => <i key={`i${i}`} style={{ width: 6, height: 6, borderRadius: '50%', background: '#D8DEE4' }} />)}
            </span>
            <span style={{ gridColumn: '1 / 3', font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-secondary)', marginTop: -2 }}>
              {crit} critical · {warn} warning · {info} info
            </span>
          </div>
        </div>
      </div>

      {footnote && (
        <div style={{ marginTop: 10, font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>{footnote}</div>
      )}
    </div>
  )
}

/* ── Why Surveys Were Not Sent ── */
function WhySurveysNotSent({ inter, elig }: { inter: number; elig: number }) {
  const [open, setOpen] = useState(false)
  const skipped = inter - elig
  const share = skipped / SKIP_ALL
  const rs = REASONS.map(([n, v, k]) => [n, v * share, k] as [string, number, string])
  const tun = rs.filter(r => r[2] === 't').reduce((a, r) => a + r[1], 0)

  const W = 1100, H = 200, top = 24, base = H - 44
  const mxr = Math.max(...rs.map(r => r[1]), 1)
  const sc = (base - top) / mxr
  const n = rs.length, ccw = W / n, cbw = ccw * 0.6

  let chartSvg = ''
  rs.forEach(([nm, v, k], i) => {
    const x = i * ccw + (ccw - cbw) / 2, h = v * sc, y = base - h
    chartSvg += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${cbw.toFixed(1)}" height="${h.toFixed(1)}" rx="4" fill="${k === 't' ? '#0F8C7C' : '#CBD2D9'}"/>`
    chartSvg += `<text x="${(x + cbw / 2).toFixed(1)}" y="${(y - 6).toFixed(1)}" text-anchor="middle" font-size="13" font-weight="600" fill="var(--lyra-color-fg-default)" font-family="Inter,sans-serif">${fmt(v)}</text>`
    chartSvg += `<text x="${(x + cbw / 2).toFixed(1)}" y="${H - 24}" text-anchor="middle" font-size="12.5" fill="var(--lyra-color-fg-secondary)" font-family="Inter,sans-serif">${nm}</text>`
    chartSvg += `<text x="${(x + cbw / 2).toFixed(1)}" y="${H - 8}" text-anchor="middle" font-size="12" fill="var(--lyra-color-fg-secondary)" font-family="Inter,sans-serif">${pct(v, skipped)}%</text>`
  })
  chartSvg += `<line x1="0" y1="${base}" x2="${W}" y2="${base}" stroke="var(--lyra-color-border-subtle)"/>`

  return (
    <div style={{ background: 'var(--lyra-color-bg-surface-base)', border: '1px solid var(--lyra-color-border-subtle)', borderRadius: 'var(--radius-lg)' }}>
      <div
        onClick={() => setOpen(!open)}
        style={{ padding: '12px 20px', display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', userSelect: 'none' }}
      >
        <ChevronRight size={18} style={{ color: 'var(--lyra-color-fg-secondary)', marginTop: 2, flexShrink: 0, transition: 'transform 0.15s', transform: open ? 'rotate(90deg)' : 'none' }} />
        <div style={{ flex: 1 }}>
          <h3 style={{ font: `600 15px/20px ${FONT}`, margin: '0 0 3px', color: 'var(--lyra-color-fg-default)' }}>Why surveys were not sent</h3>
          <div style={{ font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>
            {fmt(skipped)} of {fmt(inter)} interactions ({pct(skipped, inter)}%) never became eligible. {fmt(tun)} sit behind program settings you can change.
          </div>
        </div>
        <span style={{ marginLeft: 'auto', font: `400 13px/18px ${FONT}`, color: 'var(--lyra-color-fg-secondary)', whiteSpace: 'nowrap' }}>
          {open ? 'Hide breakdown' : 'Show breakdown'}
        </span>
      </div>

      {open && (
        <div style={{ padding: '4px 20px 12px', borderTop: '1px solid var(--lyra-color-border-subtle)' }}>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            style={{ width: '100%', display: 'block', paddingTop: 10 }}
            aria-label="Reasons surveys were not sent"
            dangerouslySetInnerHTML={{ __html: chartSvg }}
          />
          <div style={{ borderTop: '1px solid var(--lyra-color-border-subtle)', marginTop: 12, paddingTop: 10, display: 'flex', alignItems: 'center', gap: 18, font: `400 13px/18px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <i style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: '#0F8C7C' }} />Tunable – you can change
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <i style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: '#CBD2D9' }} />Compliance – fixed by rules
            </span>
            <span style={{ marginLeft: 'auto', font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>Each interaction is counted once, against the first rule that stopped it.</span>
          </div>
        </div>
      )}
    </div>
  )
}

const PROGRAM_COLUMNS: { label: string; lines: string[] }[] = [
  { label: 'Program Name', lines: ['Program Name'] },
  { label: 'Status', lines: ['Status'] },
  { label: 'Eligible', lines: ['Eligible'] },
  { label: 'Coverage', lines: ['Coverage'] },
  { label: 'Surveys Sent', lines: ['Surveys', 'Sent'] },
  { label: 'Response Rate', lines: ['Response', 'Rate'] },
  { label: 'Responses Received', lines: ['Responses', 'Received'] },
  { label: 'Completion Rate', lines: ['Completion', 'Rate'] },
  { label: 'Completed', lines: ['Completed'] },
  { label: 'Partial', lines: ['Partial'] },
  { label: 'CSAT', lines: ['CSAT'] },
  { label: 'Alerts', lines: ['Alerts'] },
]

const CHANNEL_COLUMNS: { label: string; lines: string[] }[] = [
  { label: 'Channel', lines: ['Channel'] },
  { label: 'Eligible', lines: ['Eligible'] },
  { label: 'Coverage', lines: ['Coverage'] },
  { label: 'Surveys Sent', lines: ['Surveys', 'Sent'] },
  { label: 'Response Rate', lines: ['Response', 'Rate'] },
  { label: 'Responses Received', lines: ['Responses', 'Received'] },
  { label: 'Completion Rate', lines: ['Completion', 'Rate'] },
  { label: 'Completed', lines: ['Completed'] },
  { label: 'Partial', lines: ['Partial'] },
  { label: 'CSAT', lines: ['CSAT'] },
  { label: 'Alerts', lines: ['Alerts'] },
]

const CHANNEL_DATA = [
  { channel: 'SMS', elig: 2745, coverage: 89, sent: 2452, responseRate: 66, rec: 1618, completionRate: 70, comp: 1133, partial: 485, csat: 78, alerts: 10 },
  { channel: 'WhatsApp', elig: 1590, coverage: 89, sent: 1423, responseRate: 59, rec: 837, completionRate: 65, comp: 545, partial: 292, csat: 77, alerts: 6 },
  { channel: 'Email', elig: 2890, coverage: 89, sent: 2571, responseRate: 38, rec: 977, completionRate: 58, comp: 567, partial: 410, csat: 72, alerts: 11 },
]

const TOPIC_COLUMNS: { label: string; lines: string[] }[] = [
  { label: 'Topic', lines: ['Topic'] },
  { label: 'Eligible', lines: ['Eligible'] },
  { label: 'Coverage', lines: ['Coverage'] },
  { label: 'Surveys Sent', lines: ['Surveys', 'Sent'] },
  { label: 'Response Rate', lines: ['Response', 'Rate'] },
  { label: 'Responses Received', lines: ['Responses', 'Received'] },
  { label: 'Completion Rate', lines: ['Completion', 'Rate'] },
  { label: 'Completed', lines: ['Completed'] },
  { label: 'Partial', lines: ['Partial'] },
  { label: 'CSAT', lines: ['CSAT'] },
  { label: 'Alerts', lines: ['Alerts'] },
]

const TOPIC_DATA = [
  { topic: 'Service Outage', elig: 1192, coverage: 90, sent: 1077, responseRate: 44, rec: 475, completionRate: 57, comp: 269, partial: 206, csat: 74, alerts: 6 },
  { topic: 'Rebooking', elig: 816, coverage: 86, sent: 702, responseRate: 65, rec: 459, completionRate: 74, comp: 338, partial: 121, csat: 81, alerts: 4 },
  { topic: 'Refund Processing', elig: 644, coverage: 89, sent: 570, responseRate: 57, rec: 325, completionRate: 69, comp: 225, partial: 100, csat: 73, alerts: 4 },
  { topic: 'Delivery Delay', elig: 619, coverage: 86, sent: 533, responseRate: 64, rec: 339, completionRate: 75, comp: 255, partial: 84, csat: 78, alerts: 2 },
  { topic: 'Technical Troubleshooting', elig: 571, coverage: 93, sent: 533, responseRate: 61, rec: 323, completionRate: 73, comp: 237, partial: 86, csat: 70, alerts: 3 },
  { topic: 'Billing Dispute', elig: 432, coverage: 93, sent: 402, responseRate: 72, rec: 289, completionRate: 78, comp: 225, partial: 64, csat: 80, alerts: 2 },
  { topic: 'Account Access', elig: 272, coverage: 95, sent: 258, responseRate: 51, rec: 132, completionRate: 59, comp: 78, partial: 54, csat: 70, alerts: 4 },
  { topic: 'Bot Transfer Friction', elig: 221, coverage: 86, sent: 190, responseRate: 48, rec: 91, completionRate: 58, comp: 53, partial: 38, csat: 86, alerts: 1 },
  { topic: 'Other topics', elig: 2458, coverage: 89, sent: 2181, responseRate: 46, rec: 999, completionRate: 57, comp: 565, partial: 434, csat: 75, alerts: 1 },
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

function PpDrop({ value }: { value: string }) {
  return (
    <span style={{
      display: 'block',
      font: `500 12px/16px ${FONT}`,
      color: 'var(--lyra-color-status-critical-strong)',
      whiteSpace: 'nowrap',
    }}>
      {value}
    </span>
  )
}

function StatusPill({ status }: { status: string }) {
  const isActive = status === 'Active'
  return (
    <span style={{
      display: 'inline-block',
      font: `500 12px/18px ${FONT}`,
      padding: '2px 10px',
      borderRadius: 'var(--radius-full)',
      whiteSpace: 'nowrap',
      background: isActive ? 'var(--lyra-color-status-success-subtle)' : 'var(--lyra-slate-100)',
      color: isActive ? 'var(--lyra-color-status-success-strong)' : 'var(--lyra-slate-600)',
      border: isActive ? undefined : '1px solid var(--lyra-color-border-soft)',
    }}>
      {status}
    </span>
  )
}

/* ── Programs Table ── */
function ProgramsTable({ programs, searchQuery, onSelectProgram }: { programs: typeof PROGRAMS; searchQuery: string; onSelectProgram: (p: typeof PROGRAMS[0]) => void }) {
  const [groupBy, setGroupBy] = useState<'Program' | 'Channel' | 'Topic'>('Program')
  const q = searchQuery.trim().toLowerCase()
  const filtered = programs.filter(p => p.n.toLowerCase().includes(q))

  return (
    <div style={{ background: 'var(--lyra-color-bg-surface-base)', border: '1px solid var(--lyra-color-border-subtle)', borderRadius: 'var(--radius-lg)' }}>
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--lyra-color-border-subtle)' }}>
        <h3 style={{ font: `600 18px/24px ${FONT}`, letterSpacing: '-0.01em', margin: 0, color: 'var(--lyra-color-fg-default)' }}>Programs</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <span style={{ font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>Group by</span>
          <div style={{ display: 'flex', border: '1px solid var(--lyra-color-border-subtle)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
            {(['Program', 'Channel', 'Topic'] as const).map((g, i) => (
              <button
                key={g}
                onClick={() => setGroupBy(g)}
                style={{
                  padding: '4px 16px', font: `500 12px/16px ${FONT}`, borderTop: 'none', borderBottom: 'none', borderLeft: 'none', cursor: 'pointer',
                  background: groupBy === g ? 'var(--lyra-color-bg-active-subtle)' : 'transparent',
                  color: groupBy === g ? 'var(--lyra-color-fg-active-strong)' : 'var(--lyra-color-fg-secondary)',
                  borderRight: i < 2 ? '1px solid var(--lyra-color-border-subtle)' : 'none',
                }}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {groupBy === 'Channel' ? (
        <div>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '28%' }} />
              {Array.from({ length: 10 }, (_, i) => <col key={i} style={{ width: '7.2%' }} />)}
            </colgroup>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--lyra-color-border-subtle)' }}>
                {CHANNEL_COLUMNS.map(col => (
                  <th
                    key={col.label}
                    scope="col"
                    style={{
                      padding: 'var(--space-3) var(--space-2)',
                      textAlign: 'left',
                      font: `500 12px/16px ${FONT}`,
                      color: 'var(--lyra-color-fg-secondary)',
                      letterSpacing: '0.01em',
                      textTransform: 'uppercase',
                      verticalAlign: 'top',
                      ...(col.label === 'Channel' ? { paddingLeft: 'var(--space-4)' } : {}),
                    }}
                  >
                    {col.lines.map((line, li) => <span key={li} style={{ display: 'block', whiteSpace: 'nowrap' }}>{line}</span>)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CHANNEL_DATA.map(c => (
                <tr key={c.channel} style={{ borderBottom: '1px solid var(--lyra-color-border-subtle)' }}>
                  <td style={{ padding: 'var(--space-3) var(--space-2) var(--space-3) var(--space-4)', font: `500 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>
                    {c.channel}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-2)', font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>
                    {fmt(c.elig)}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-2)', font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>
                    {c.coverage}%
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-2)', font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>
                    {fmt(c.sent)}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-2)', font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>
                    {c.responseRate}%
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-2)', font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>
                    {fmt(c.rec)}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-2)', font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>
                    {c.completionRate}%
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-2)', font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>
                    {fmt(c.comp)}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-2)', font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>
                    {fmt(c.partial)}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-2)', font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>
                    {c.csat}%
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-2)', font: `600 14px/18px ${FONT}`, color: 'var(--lyra-color-status-critical-strong)' }}>
                    {c.alerts}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : groupBy === 'Topic' ? (
        <div>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '28%' }} />
              {Array.from({ length: 10 }, (_, i) => <col key={i} style={{ width: '7.2%' }} />)}
            </colgroup>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--lyra-color-border-subtle)' }}>
                {TOPIC_COLUMNS.map(col => (
                  <th
                    key={col.label}
                    scope="col"
                    style={{
                      padding: 'var(--space-3) var(--space-2)',
                      textAlign: 'left',
                      font: `500 12px/16px ${FONT}`,
                      color: 'var(--lyra-color-fg-secondary)',
                      letterSpacing: '0.01em',
                      textTransform: 'uppercase',
                      verticalAlign: 'top',
                      ...(col.label === 'Topic' ? { paddingLeft: 'var(--space-4)' } : {}),
                    }}
                  >
                    {col.lines.map((line, li) => <span key={li} style={{ display: 'block', whiteSpace: 'nowrap' }}>{line}</span>)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TOPIC_DATA.map(t => (
                <tr key={t.topic} style={{ borderBottom: '1px solid var(--lyra-color-border-subtle)' }}>
                  <td style={{ padding: 'var(--space-3) var(--space-2) var(--space-3) var(--space-4)', font: `500 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>
                    {t.topic}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-2)', font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>
                    {fmt(t.elig)}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-2)', font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>
                    {t.coverage}%
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-2)', font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>
                    {fmt(t.sent)}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-2)', font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>
                    {t.responseRate}%
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-2)', font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>
                    {fmt(t.rec)}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-2)', font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>
                    {t.completionRate}%
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-2)', font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>
                    {fmt(t.comp)}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-2)', font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>
                    {fmt(t.partial)}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-2)', font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>
                    {t.csat}%
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-2)', font: `600 14px/18px ${FONT}`, color: 'var(--lyra-color-status-critical-strong)' }}>
                    {t.alerts}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: 'var(--space-3) var(--space-4)', font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-secondary)', fontStyle: 'italic' }}>
            Each interaction is counted once, against its primary topic.
          </div>
        </div>
      ) : (
        <div>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '28%' }} />
              {Array.from({ length: 11 }, (_, i) => <col key={i} style={{ width: '6.55%' }} />)}
            </colgroup>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--lyra-color-border-subtle)' }}>
                {PROGRAM_COLUMNS.map(col => (
                  <th
                    key={col.label}
                    scope="col"
                    style={{
                      padding: 'var(--space-3) var(--space-2)',
                      textAlign: 'left',
                      font: `500 14px/16px ${FONT}`,
                      color: 'var(--lyra-color-fg-default)',
                      verticalAlign: 'top',
                      ...(col.label === 'Program Name' ? { paddingLeft: 'var(--space-4)' } : {}),
                    }}
                  >
                    {col.lines.map((line, li) => <span key={li} style={{ display: 'block', whiteSpace: 'nowrap' }}>{line}</span>)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={PROGRAM_COLUMNS.length} style={{ padding: '24px 16px', color: 'var(--lyra-color-fg-secondary)' }}>
                    No programs match the selected filters.
                  </td>
                </tr>
              ) : (
                filtered.map(p => {
                  const partial = p.rec - p.comp
                  const status = p.tags.find(t => t === 'Active' || t === 'Inactive') || ''
                  return (
                    <tr key={p.n} style={{ borderBottom: '1px solid var(--lyra-color-border-subtle)' }}>
                      <td style={{ padding: 'var(--space-3) var(--space-2) var(--space-3) var(--space-4)' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <span
                            onClick={() => onSelectProgram(p)}
                            style={{ font: `500 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-link)', cursor: 'pointer' }}
                          >
                            {p.n}
                          </span>
                          {p.tags.includes('Needs attention') && <NeedsAttentionChip />}
                        </span>
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-2)' }}>
                        {status && <StatusPill status={status} />}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-2)', font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>
                        {fmt(p.elig)}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-2)', font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>
                        {pct(p.sent, p.elig)}%
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-2)', font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>
                        {fmt(p.sent)}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-2)', font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>
                        {pct(p.rec, p.sent)}%
                        {p.rrD && <PpDrop value={p.rrD} />}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-2)', font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>
                        {fmt(p.rec)}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-2)', font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>
                        {pct(p.comp, p.rec)}%
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-2)', font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>
                        {fmt(p.comp)}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-2)', font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>
                        {fmt(partial)}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-2)', font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>
                        {p.csat}%
                        {p.csatD && <PpDrop value={p.csatD} />}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-2)', font: `600 14px/18px ${FONT}`, color: 'var(--lyra-color-status-critical-strong)' }}>
                        {p.alerts}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ── Program detail ── */
const DETAIL_OVERRIDES: Record<string, { inter: number; deltas: FunnelDeltas }> = {
  'Complaint Resolution Follow-Up': {
    inter: 2572,
    deltas: { stages: ['+10%', '+5%', '+13%', '+13%', '+10%'], rates: ['+6pp', '+5pp', '+6pp', '+5pp'], csat: '+7pp', alerts: '-9%' },
  },
}

type ResponseRow = { customer: string; id: string; agent: string; topic: string | null; sent: string | null; response: string | null; completed: string | null; csat: number | null; status: string }
const DETAIL_RESPONSES: ResponseRow[] = [
  { customer: 'Sophie Patel', id: 'INT-4064903', agent: 'Ben K.', topic: null, sent: null, response: null, completed: null, csat: null, status: 'Program Not Found' },
  { customer: 'Olivia Smith', id: 'INT-6257112', agent: 'Tomás R.', topic: 'Technical Troubleshooting', sent: 'Jul 1, 15:32', response: 'Jul 1, 15:35', completed: 'Jul 1, 16:13', csat: 5, status: 'Response Received' },
  { customer: 'Marcus Wright', id: 'INT-4789800', agent: 'Liu Yang', topic: 'Refund Processing', sent: 'Jul 2, 08:35', response: 'Jul 2, 08:55', completed: 'Jul 2, 09:08', csat: 2, status: 'Response Received' },
  { customer: 'Ava Johnson', id: 'INT-1601280', agent: 'Tomás R.', topic: 'Refund Processing', sent: 'Jul 18, 08:05', response: 'Jul 18, 08:22', completed: null, csat: 1, status: 'Partially Responded' },
  { customer: 'Olivia Smith', id: 'INT-3002077', agent: 'Priya M.', topic: 'Account Access', sent: 'Jul 5, 11:53', response: 'Jul 5, 12:06', completed: 'Jul 5, 12:30', csat: 5, status: 'Response Received' },
  { customer: 'Daniel Chen', id: 'INT-1249933', agent: 'Tomás R.', topic: 'Refund Processing', sent: 'Jul 12, 16:19', response: 'Jul 12, 16:44', completed: null, csat: 1, status: 'Partially Responded' },
  { customer: 'Liam Al-Farsi', id: 'INT-5180251', agent: 'Priya M.', topic: 'Service Outage', sent: 'Jul 9, 13:54', response: null, completed: null, csat: null, status: 'Not Started' },
  { customer: 'Marcus Smith', id: 'INT-2249741', agent: 'Rajat S.', topic: 'Technical Troubleshooting', sent: 'Jul 11, 14:35', response: 'Jul 11, 14:57', completed: 'Jul 11, 15:14', csat: 5, status: 'Response Received' },
  { customer: 'Noah Garcia', id: 'INT-7339243', agent: 'Priya M.', topic: 'Technical Troubleshooting', sent: null, response: null, completed: null, csat: null, status: 'No Matching Skill or Team' },
  { customer: 'Noah Patel', id: 'INT-5451225', agent: 'Priya M.', topic: null, sent: 'Jul 9, 16:08', response: 'Jul 9, 16:18', completed: 'Jul 9, 16:49', csat: 4, status: 'Response Received' },
]

const RESPONSE_COLUMNS = ['Customer', 'Interaction ID', 'Agent', 'Primary Topic', 'Sent', 'Response', 'Completed', 'CSAT', 'Status']
const RESPONSE_TABS: [string, number][] = [['All', 60], ['Survey sent', 45], ['Not sent', 15]]

function ResponseStatus({ status }: { status: string }) {
  if (status === 'Not Started') {
    return <span style={{ font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-secondary)', whiteSpace: 'nowrap' }}>{status}</span>
  }
  const tone = status === 'Response Received'
    ? { bg: 'var(--lyra-color-status-success-subtle)', fg: 'var(--lyra-color-status-success-strong)', border: undefined }
    : status === 'Partially Responded'
    ? { bg: 'var(--lyra-color-status-warning-subtle)', fg: 'var(--lyra-color-status-warning-strong)', border: undefined }
    : { bg: 'var(--lyra-slate-100)', fg: 'var(--lyra-color-fg-default)', border: '1px solid var(--lyra-color-border-soft)' }
  return (
    <span style={{ display: 'inline-block', font: `500 12px/18px ${FONT}`, padding: '2px 10px', borderRadius: 'var(--radius-full)', whiteSpace: 'nowrap', background: tone.bg, color: tone.fg, border: tone.border }}>
      {status}
    </span>
  )
}

function Muted({ children }: { children: React.ReactNode }) {
  return <span style={{ color: 'var(--lyra-color-fg-disabled)' }}>{children}</span>
}

/* ── Customer detail drawer ── */
type CustomerDetail = {
  summary: string | null
  alsoFound: string[]
  questions: { q: string; a: string | null }[]
  phone: string
  email: string
}

const CUSTOMER_DETAILS: Record<string, CustomerDetail> = {
  'INT-4064903': { summary: null, alsoFound: [], questions: [], phone: '+1 223-555-7714', email: 'sophie.patel@example.com' },
  'INT-6257112': {
    summary: 'The system read this technical troubleshooting case as resolved, based on a clean resolution logged before the call ended.',
    alsoFound: ['Account Access'],
    questions: [
      { q: 'How would you rate how we handled your technical troubleshooting today?', a: '5 of 5' },
      { q: 'What could have made the technical troubleshooting experience better?', a: '"It was already the right call, I would not change it."' },
    ],
    phone: '+1 223-555-5382', email: 'olivia.smith@example.com',
  },
  'INT-4789800': {
    summary: 'The system read this refund case as unresolved — the refund was promised but no confirmation was logged before the chat closed.',
    alsoFound: ['Billing Dispute'],
    questions: [
      { q: 'How would you rate how we handled your refund today?', a: '2 of 5' },
      { q: 'What could have made the refund experience better?', a: '"I still don\'t know when the money will arrive. A date would have helped."' },
    ],
    phone: '+1 223-555-2041', email: 'marcus.wright@example.com',
  },
  'INT-1601280': {
    summary: 'The system read this refund case as escalated — the agent transferred the customer to a supervisor queue before closing.',
    alsoFound: ['Delivery Delay'],
    questions: [
      { q: 'How would you rate how we handled your refund today?', a: '1 of 5' },
      { q: 'What could have made the refund experience better?', a: null },
    ],
    phone: '+1 223-555-9120', email: 'ava.johnson@example.com',
  },
  'INT-3002077': {
    summary: 'The system read this account access case as resolved — a password reset was completed and confirmed during the chat.',
    alsoFound: [],
    questions: [
      { q: 'How would you rate how we handled your account access issue today?', a: '5 of 5' },
      { q: 'What could have made the account access experience better?', a: '"Fast and friendly, nothing to add."' },
    ],
    phone: '+1 223-555-5382', email: 'olivia.smith@example.com',
  },
  'INT-1249933': {
    summary: 'The system read this refund case as partially resolved — a refund was issued but the customer questioned the amount.',
    alsoFound: ['Billing Dispute'],
    questions: [
      { q: 'How would you rate how we handled your refund today?', a: '1 of 5' },
      { q: 'What could have made the refund experience better?', a: null },
    ],
    phone: '+1 223-555-3377', email: 'daniel.chen@example.com',
  },
  'INT-5180251': {
    summary: 'The system read this service outage case as acknowledged — the customer was told about a known incident and given an ETA.',
    alsoFound: ['Technical Troubleshooting'],
    questions: [
      { q: 'How would you rate how we handled the service outage today?', a: null },
      { q: 'What could have made the outage experience better?', a: null },
    ],
    phone: '+1 223-555-6608', email: 'liam.alfarsi@example.com',
  },
  'INT-2249741': {
    summary: 'The system read this technical troubleshooting case as resolved — the device reconnected after a guided reset.',
    alsoFound: [],
    questions: [
      { q: 'How would you rate how we handled your technical troubleshooting today?', a: '5 of 5' },
      { q: 'What could have made the technical troubleshooting experience better?', a: '"Clear steps, worked first time."' },
    ],
    phone: '+1 223-555-8821', email: 'marcus.smith@example.com',
  },
  'INT-7339243': {
    summary: 'The system read this technical troubleshooting case as unresolved — no matching skill or team was available to route the case.',
    alsoFound: ['Bot Transfer Friction'],
    questions: [],
    phone: '+1 223-555-4459', email: 'noah.garcia@example.com',
  },
  'INT-5451225': {
    summary: null,
    alsoFound: [],
    questions: [
      { q: 'How would you rate your experience with us today?', a: '4 of 5' },
      { q: 'What could have made your experience better?', a: '"A shorter wait before someone picked up."' },
    ],
    phone: '+1 223-555-1193', email: 'noah.patel@example.com',
  },
}

function DrawerSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ font: `500 12px/16px ${FONT}`, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--lyra-color-fg-secondary)', marginBottom: 'var(--space-2)' }}>{label}</div>
      <div style={{ border: '1px solid var(--lyra-color-border-soft)', borderRadius: 'var(--radius-md)', background: 'var(--lyra-color-bg-surface-base)' }}>
        {children}
      </div>
    </div>
  )
}

function AiChip() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '1px 6px', borderRadius: 'var(--radius-full)', background: 'var(--lyra-color-bg-ai)', border: '1px solid var(--lyra-color-border-subtle)', font: `500 11px/14px ${FONT}`, color: 'var(--lyra-purple-700)', flexShrink: 0 }}>
      <Sparkles style={{ width: 9, height: 9, fill: 'currentColor', stroke: 'none' }} />AI
    </span>
  )
}

function CustomerDrawer({ row, onClose }: { row: ResponseRow; onClose: () => void }) {
  const d = CUSTOMER_DETAILS[row.id]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const surveySent = row.sent !== null
  const emptyNote = (text: string) => (
    <div style={{ padding: 'var(--space-4)', font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>{text}</div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.24)' }} />
      <aside
        role="dialog"
        aria-label={`${row.customer} interaction details`}
        style={{ position: 'relative', width: 480, maxWidth: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--lyra-color-bg-surface-base)', borderLeft: '1px solid var(--lyra-color-border-soft)', boxShadow: 'var(--sol-effect-shadowlg)' }}
      >
        {/* Header */}
        <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--lyra-color-border-subtle)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
          <div>
            <div style={{ font: `600 16px/20px ${FONT}`, letterSpacing: '-0.01em', color: 'var(--lyra-color-fg-default)' }}>{row.customer}</div>
            <div style={{ font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-secondary)', marginTop: 2 }}>{row.id} · Chat</div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', borderRadius: 'var(--radius-sm)', color: 'var(--lyra-color-fg-action)', cursor: 'pointer', flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <DrawerSection label="Primary topic">
            {row.topic ? (
              <div style={{ padding: 'var(--space-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span style={{ font: `500 16px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>{row.topic}</span>
                  <span style={{ padding: '1px 8px', borderRadius: 'var(--radius-full)', background: 'var(--lyra-purple-700)', font: `600 10px/14px ${FONT}`, letterSpacing: '0.06em', color: 'var(--lyra-color-fg-inverse)' }}>PRIMARY</span>
                </div>
                {d.summary && (
                  <p style={{ margin: 'var(--space-2) 0 0', font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>{d.summary}</p>
                )}
                {d.alsoFound.length > 0 && (
                  <>
                    <div style={{ borderTop: '1px solid var(--lyra-color-border-subtle)', margin: 'var(--space-3) 0' }} />
                    <div style={{ font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>Also found in the transcript</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)', marginTop: 'var(--space-2)' }}>
                      {d.alsoFound.map(t => (
                        <span key={t} style={{ padding: '2px 8px', borderRadius: 'var(--radius-xs)', background: 'var(--lyra-slate-100)', font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>{t}</span>
                      ))}
                    </div>
                    <p style={{ margin: 'var(--space-3) 0 0', font: `400 12px/16px ${FONT}`, fontStyle: 'italic', color: 'var(--lyra-color-fg-secondary)' }}>
                      {row.topic} carried the strongest signal of the {d.alsoFound.length + 1} topics found, so it drove the survey question.
                    </p>
                  </>
                )}
              </div>
            ) : emptyNote('No topic was detected for this interaction.')}
          </DrawerSection>

          <DrawerSection label="Rating">
            {row.csat !== null ? (
              <div style={{ padding: 'var(--space-3) var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <span style={{ display: 'inline-flex', gap: 2 }}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} size={20} style={{ color: i < row.csat! ? 'var(--lyra-color-status-warning-medium)' : 'var(--lyra-slate-300)', fill: 'currentColor' }} />
                  ))}
                </span>
                <span style={{ font: `600 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>{row.csat} of 5</span>
              </div>
            ) : emptyNote(surveySent ? 'No rating yet — the customer has not responded.' : 'No rating — a survey was not sent.')}
          </DrawerSection>

          <DrawerSection label="Questions asked">
            {d.questions.length > 0 ? (
              <div>
                {d.questions.map((item, i) => (
                  <div key={i} style={{ padding: 'var(--space-3) var(--space-4)', display: 'flex', gap: 'var(--space-2)', borderTop: i > 0 ? '1px solid var(--lyra-color-border-subtle)' : undefined }}>
                    <span style={{ font: `500 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-secondary)', flexShrink: 0, width: 20 }}>Q{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
                        <span style={{ font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>{item.q}</span>
                        <AiChip />
                      </div>
                      <div style={{ marginTop: 'var(--space-2)', font: `${item.a ? 500 : 400} 14px/20px ${FONT}`, color: item.a ? 'var(--lyra-color-fg-default)' : 'var(--lyra-color-fg-disabled)' }}>
                        {item.a ?? 'No answer'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : emptyNote('No questions were asked — a survey was not sent.')}
          </DrawerSection>

          <DrawerSection label="Contact">
            <div style={{ padding: 'var(--space-3) var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>
                <Phone size={14} style={{ color: 'var(--lyra-color-fg-secondary)' }} />{d.phone}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)', marginTop: 'var(--space-2)' }}>
                <Mail size={14} style={{ color: 'var(--lyra-color-fg-secondary)' }} />{d.email}
              </div>
              <div style={{ borderTop: '1px solid var(--lyra-color-border-subtle)', margin: 'var(--space-3) 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', font: `400 14px/20px ${FONT}` }}>
                <span style={{ color: 'var(--lyra-color-fg-secondary)' }}>Agent</span>
                <span style={{ fontWeight: 500, color: 'var(--lyra-color-fg-default)' }}>{row.agent}</span>
              </div>
            </div>
          </DrawerSection>
        </div>

        {/* Footer */}
        <div style={{ padding: 'var(--space-3) var(--space-4)', borderTop: '1px solid var(--lyra-color-border-subtle)', display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-start', font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>
          <Info size={12} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>Illustrative. The interaction read is produced upstream, and full verbatim analysis lives in a separate consuming app.</span>
        </div>
      </aside>
    </div>
  )
}

function ProgramDetailView({ program, onBack }: { program: typeof PROGRAMS[0]; onBack: () => void }) {
  const [search, setSearch] = useState('')
  const [intent, setIntent] = useState('All Intents')
  const [custType, setCustType] = useState('All Customer Types')
  const [channel, setChannel] = useState('All Channels')
  const [tab, setTab] = useState('All')
  const [range, setRange] = useState<DateRange | null>({ start: new Date(2026, 9, 1), end: TODAY })
  const [openRow, setOpenRow] = useState<ResponseRow | null>(null)

  const override = DETAIL_OVERRIDES[program.n]
  const funnel: FunnelData = {
    inter: override?.inter ?? program.inter,
    elig: program.elig, sent: program.sent, rec: program.rec, comp: program.comp,
    part: program.rec - program.comp, csat: program.csat, alerts: program.alerts,
  }
  const status = program.tags.find(t => t === 'Active' || t === 'Inactive') || ''

  const q = search.trim().toLowerCase()
  const rows = DETAIL_RESPONSES.filter(r =>
    (tab === 'All' || (tab === 'Survey sent' ? r.sent !== null : r.sent === null)) &&
    (!q || r.customer.toLowerCase().includes(q) || r.id.toLowerCase().includes(q))
  )

  const cell = (muted = false): React.CSSProperties => ({
    padding: 'var(--space-3) var(--space-2)',
    font: `400 14px/18px ${FONT}`,
    color: muted ? 'var(--lyra-color-fg-secondary)' : 'var(--lyra-color-fg-default)',
    whiteSpace: 'nowrap',
  })

  return (
    <div className="flex flex-col flex-1 h-full" style={{ background: 'var(--lyra-color-bg-surface-base)' }}>
      {/* Page header — breadcrumb + name, status chips on the right */}
      <div style={{ minHeight: 72, padding: 'var(--space-4) var(--space-7)', borderBottom: '1px solid var(--lyra-color-border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', rowGap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span
            onClick={onBack}
            style={{ font: `500 16px/20px ${FONT}`, letterSpacing: '-0.01em', color: 'var(--lyra-color-fg-secondary)', cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--lyra-color-fg-default)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--lyra-color-fg-secondary)' }}
          >
            Program Health
          </span>
          <span style={{ font: `500 16px/20px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>/</span>
          <span style={{ font: `600 20px/24px ${FONT}`, letterSpacing: '-0.02em', color: 'var(--lyra-color-fg-default)' }}>{program.n}</span>
        </div>



      </div>

      <div className="flex-1 min-h-0" style={{ paddingTop: 'var(--space-7)', paddingLeft: 'var(--space-7)', paddingRight: 'var(--space-7)', paddingBottom: 'var(--space-2)', overflowY: 'auto' }}>
        {/* Filter Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search" />
          <DateRangePicker value={range} onChange={setRange} />
          <FilterDropdown value={intent} options={['All Intents', 'Refund Processing', 'Technical Troubleshooting', 'Account Access', 'Service Outage']} onChange={setIntent} />
          <FilterDropdown value={custType} options={['All Customer Types', 'New', 'Returning', 'VIP']} onChange={setCustType} />
          <FilterDropdown value={channel} options={['All Channels', 'SMS', 'WhatsApp', 'Email']} onChange={setChannel} />
          <div style={{ marginLeft: 'auto', borderLeft: '1px solid var(--lyra-color-border-subtle)', paddingLeft: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-secondary)', whiteSpace: 'nowrap' }}>
            {status && <StatusPill status={status} />}
            <span>·</span>
            <span>30 days running</span>
            <span>·</span>
            <span>Chat</span>
            <span>·</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--lyra-color-status-critical-strong)' }}>
              <Bell size={14} />
              {program.alerts} detractor alerts sent
            </span>
          </div>
        </div>

        <div style={{ marginTop: 'var(--space-5)' }}>
          <ProgramPerformanceFunnel
            data={funnel}
            subtitle={range ? fmtRange(range) : 'No period selected'}
            deltas={override?.deltas}
            footnote={range ? `Trends compared to ${fmtDay(range.start)}, the start of the selected period.` : undefined}
          />
        </div>

        {/* Customer responses */}
        <div style={{ marginTop: 'var(--space-6)', background: 'var(--lyra-color-bg-surface-base)', border: '1px solid var(--lyra-color-border-subtle)', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--lyra-color-border-subtle)' }}>
            <div>
              <h3 style={{ font: `600 18px/24px ${FONT}`, letterSpacing: '-0.01em', margin: 0, color: 'var(--lyra-color-fg-default)' }}>Customer responses</h3>
              <div style={{ font: `400 14px/16px ${FONT}`, color: 'var(--lyra-color-fg-secondary)', marginTop: 2 }}>Every interaction in the period, whether or not a survey was sent.</div>
            </div>
            <div style={{ display: 'flex', border: '1px solid var(--lyra-color-border-subtle)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              {RESPONSE_TABS.map(([t, count], i) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    padding: '4px 16px', font: `500 12px/16px ${FONT}`, borderTop: 'none', borderBottom: 'none', borderLeft: 'none', cursor: 'pointer',
                    background: tab === t ? 'var(--lyra-color-bg-active-subtle)' : 'transparent',
                    color: tab === t ? 'var(--lyra-color-fg-active-strong)' : 'var(--lyra-color-fg-secondary)',
                    borderRight: i < RESPONSE_TABS.length - 1 ? '1px solid var(--lyra-color-border-subtle)' : 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t} <span style={{ fontWeight: 400, opacity: 0.7 }}>{count}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--lyra-color-border-subtle)' }}>
                {RESPONSE_COLUMNS.map(col => (
                  <th
                    key={col}
                    scope="col"
                    style={{
                      padding: 'var(--space-3) var(--space-2)',
                      textAlign: col === 'Status' ? 'right' : 'left',
                      font: `500 12px/16px ${FONT}`,
                      color: 'var(--lyra-color-fg-secondary)',
                      letterSpacing: '0.01em',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                      ...(col === 'Customer' ? { paddingLeft: 'var(--space-4)' } : {}),
                      ...(col === 'Status' ? { paddingRight: 'var(--space-4)' } : {}),
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={RESPONSE_COLUMNS.length} style={{ padding: '24px 16px', font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>
                    No interactions match the selected filters.
                  </td>
                </tr>
              ) : rows.map(r => (
                <tr
                  key={r.id}
                  onClick={() => setOpenRow(r)}
                  style={{ borderBottom: '1px solid var(--lyra-color-border-subtle)', cursor: 'pointer', transition: 'background-color 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--lyra-color-state-bg-hover-opacity)' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = '' }}
                >
                  <td style={{ ...cell(), paddingLeft: 'var(--space-4)', fontWeight: 500 }}>{r.customer}</td>
                  <td style={cell(true)}>{r.id}</td>
                  <td style={cell(true)}>{r.agent}</td>
                  <td style={cell()}>{r.topic ?? <Muted>No topic detected</Muted>}</td>
                  <td style={cell()}>{r.sent ?? <Muted>n/a</Muted>}</td>
                  <td style={cell()}>{r.response ?? <Muted>n/a</Muted>}</td>
                  <td style={cell()}>{r.completed ?? <Muted>n/a</Muted>}</td>
                  <td style={cell()}>
                    {r.csat === null ? <Muted>n/a</Muted> : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
                        <Star size={12} style={{ color: 'var(--lyra-color-status-warning-medium)', fill: 'currentColor' }} />
                        {r.csat} of 5
                      </span>
                    )}
                  </td>
                  <td style={{ ...cell(), textAlign: 'right', paddingRight: 'var(--space-4)' }}><ResponseStatus status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>1 to {rows.length} of 60</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <button disabled aria-label="Previous page" style={{ width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--lyra-color-border-soft)', borderRadius: 'var(--radius-sm)', background: 'var(--lyra-color-bg-surface-base)', color: 'var(--lyra-color-fg-disabled)', cursor: 'not-allowed' }}>
                <ChevronLeft size={14} />
              </button>
              <span style={{ font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>1 / 6</span>
              <button aria-label="Next page" style={{ width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--lyra-color-border-soft)', borderRadius: 'var(--radius-sm)', background: 'var(--lyra-color-bg-surface-base)', color: 'var(--lyra-color-fg-default)', cursor: 'pointer' }}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {openRow && <CustomerDrawer row={openRow} onClose={() => setOpenRow(null)} />}
    </div>
  )
}

/* ── Data hook ── */
function useSlicedData(filters: { prog: string; ch: string; cat: string }) {
  return useMemo(() => {
    const S = PROGRAMS
      .filter(p => (filters.prog === 'All Programs' || p.n === filters.prog) && (filters.cat === 'All Categories' || p.cat === filters.cat))
      .map(p => {
        const c = filters.ch === 'All Channels' ? 1 : ((p.ch as Record<string, number>)[filters.ch] || 0)
        if (!c) return null
        return { ...p, inter: p.inter * c, elig: p.elig * c, sent: p.sent * c, rec: p.rec * c, comp: p.comp * c, alerts: Math.round(p.alerts * c) }
      })
      .filter(Boolean) as typeof PROGRAMS

    const sum = (f: keyof typeof PROGRAMS[0]) => S.reduce((a, p) => a + (p[f] as number), 0)
    const inter = sum('inter'), elig = sum('elig'), sent = sum('sent'), rec = sum('rec'), comp = sum('comp')
    const part = rec - comp, alerts = sum('alerts')
    const csat = rec ? Math.round(S.reduce((a, p) => a + p.csat * p.rec, 0) / rec) : 0
    const activeCount = S.filter(p => p.tags.includes('Active')).length

    return { inter, elig, sent, rec, comp, part, csat, alerts, activeCount, totalCount: S.length, programs: S }
  }, [filters.prog, filters.ch, filters.cat])
}

/* ── Page ── */
export function Dashboard5Page() {
  const [search, setSearch] = useState('')
  const [program, setProgram] = useState('All Programs')
  const [channel, setChannel] = useState('All Channels')
  const [category, setCategory] = useState('All Categories')
  const [range, setRange] = useState<DateRange | null>({ start: new Date(2026, 9, 1), end: TODAY })
  const [selected, setSelected] = useState<typeof PROGRAMS[0] | null>(null)

  const data = useSlicedData({ prog: program, ch: channel, cat: category })

  if (selected) {
    return <ProgramDetailView program={selected} onBack={() => setSelected(null)} />
  }

  return (
    <div className="flex flex-col flex-1 h-full" style={{ background: 'var(--lyra-color-bg-surface-base)' }}>
      <div style={{ minHeight: 72, padding: 'var(--space-4) var(--space-7)', borderBottom: '1px solid var(--lyra-color-border-subtle)', display: 'flex', alignItems: 'center' }}>
        <h1 style={{ font: `600 20px/24px ${FONT}`, letterSpacing: '-0.01em', color: 'var(--lyra-color-fg-default)' }}>
          Program Health
        </h1>
      </div>

      <div className="flex-1 min-h-0" style={{ paddingTop: 'var(--space-7)', paddingLeft: 'var(--space-7)', paddingRight: 'var(--space-7)', paddingBottom: 'var(--space-2)', overflowY: 'auto' }}>
        {/* Filter Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search programs" />
          <DateRangePicker value={range} onChange={setRange} />
          <FilterDropdown
            value={program}
            options={['All Programs', ...PROGRAMS.map(p => p.n)]}
            onChange={setProgram}
          />
          <FilterDropdown
            value={channel}
            options={['All Channels', 'SMS', 'WhatsApp', 'Email']}
            onChange={setChannel}
          />
          <FilterDropdown
            value={category}
            options={['All Categories', 'Service Disruption', 'Billing Recovery', 'Service Recovery', 'Product']}
            onChange={setCategory}
          />
        </div>

        <div style={{ marginTop: 'var(--space-5)' }}>
          <ProgramPerformanceFunnel data={data} subtitle={`${data.totalCount} programs · ${data.activeCount} active`} />
        </div>

        <div style={{ marginTop: 'var(--space-4)' }}>
          <WhySurveysNotSent inter={data.inter} elig={data.elig} />
        </div>

        <div style={{ marginTop: 'var(--space-6)' }}>
          <ProgramsTable programs={data.programs} searchQuery={search} onSelectProgram={setSelected} />
        </div>
      </div>
    </div>
  )
}
