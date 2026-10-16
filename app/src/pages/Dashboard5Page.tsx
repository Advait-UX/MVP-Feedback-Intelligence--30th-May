import { useState, useMemo, useEffect, useRef } from 'react'
import { Activity, ArrowRight, Bell, Calendar, ChevronDown, ChevronLeft, ChevronRight, Headphones, Info, Mail, Phone, Power, PowerOff, Smile, Sparkles, Star, UserMinus, X } from 'lucide-react'
import { SearchInput } from '../components/feedback-management/ListPagePrimitives'
import { MultiSelectField } from '../components/campaign-wizard/WizardPrimitives'

const FONT = 'var(--font-sans)'

/* ── Data ── */
const PROGRAMS = [
  { n: 'Complaint Resolution Follow-Up', tags: ['Active', 'AI questions', 'Needs attention'], cat: 'Service Recovery', ch: { SMS: 0.6, Email: 0.4 }, inter: 3350, elig: 1106, sent: 1062, rec: 319, comp: 137, csat: 59, asat: 72, csatD: '↓ 6pp', rrD: '↓ 9pp', alerts: 10, coverageUp: false, responseRateUp: false, completionRateUp: false, csatUp: false },
  { n: 'Flight Disruption Recovery', tags: ['Active', 'AI questions'], cat: 'Service Disruption', ch: { WhatsApp: 0.5, SMS: 0.3, Email: 0.2 }, inter: 6990, elig: 2308, sent: 1985, rec: 1211, comp: 872, csat: 86, asat: 88, alerts: 3, coverageUp: true, responseRateUp: true, completionRateUp: true, csatUp: true },
  { n: 'Billing and Refund Recovery · All Digital', tags: ['Active', 'AI questions'], cat: 'Billing Recovery', ch: { Email: 0.55, SMS: 0.45 }, inter: 4675, elig: 1542, sent: 1372, rec: 617, comp: 327, csat: 81, asat: 83, alerts: 4, coverageUp: true, responseRateUp: true, completionRateUp: true, csatUp: true },
  { n: 'Omnichannel Escalation Recovery', tags: ['Active', 'AI questions'], cat: 'Service Recovery', ch: { Email: 0.4, WhatsApp: 0.35, SMS: 0.25 }, inter: 4350, elig: 1435, sent: 1335, rec: 828, comp: 580, csat: 80, asat: 82, alerts: 5, coverageUp: true, responseRateUp: true, completionRateUp: true, csatUp: true },
  { n: 'Product Feedback - Beta Testers', tags: ['Inactive', 'Static questions'], cat: 'Product', ch: { Email: 0.7, WhatsApp: 0.3 }, inter: 2555, elig: 834, sent: 692, rec: 457, comp: 329, csat: 75, asat: 80, alerts: 5, coverageUp: true, responseRateUp: true, completionRateUp: true, csatUp: true },
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

const RANGE_PRESETS: { label: string; range: () => DateRange }[] = [
  { label: 'Last 7 days', range: () => lastN(7) },
  { label: 'Current month', range: () => ({ start: new Date(TODAY.getFullYear(), TODAY.getMonth(), 1), end: TODAY }) },
  { label: 'Last month', range: () => ({ start: new Date(TODAY.getFullYear(), TODAY.getMonth() - 1, 1), end: new Date(TODAY.getFullYear(), TODAY.getMonth(), 0) }) },
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

/* ── Period helpers ── */
const rangeDays = (r: DateRange) => Math.round((dayStart(r.end).getTime() - dayStart(r.start).getTime()) / 864e5) + 1
const previousPeriodNote = (r: DateRange | null) => {
  if (!r) return 'Select a period to compare trends.'
  const days = rangeDays(r), pEnd = addDays(r.start, -1), pStart = addDays(pEnd, -(days - 1))
  return `Trends Compared with the Previous Period (${fmtDay(pStart)} – ${fmtDay(pEnd)})`
}
const DEFAULT_RANGE = (): DateRange => lastN(7)
const isDefaultRange = (r: DateRange | null) => !!r && sameDay(r.start, DEFAULT_RANGE().start) && sameDay(r.end, DEFAULT_RANGE().end)

/* ── Deltas ── */
type PerfDeltas = { total: string; elig: string; eligRate: string; sent: string; rec: string; comp: string; part: string; csat: string; asat: string; alerts: string }
const OVERVIEW_DELTAS: PerfDeltas = { total: '+13%', elig: '+8%', eligRate: '+3%', sent: '+4%', rec: '+2%', comp: '+9%', part: '-6%', csat: '+3%', asat: '+1%', alerts: '-2%' }

const isDown = (d: string) => d.trim().startsWith('-')
function Delta({ value, size = 13, inverse = false }: { value: string; size?: number; inverse?: boolean }) {
  const down = isDown(value)
  const color = inverse ? 'var(--lyra-color-fg-inverse)' : down ? 'var(--lyra-color-status-critical-strong)' : 'var(--lyra-color-status-success-strong)'
  return (
    <span style={{ font: `500 ${size}px/1.2 ${FONT}`, color, whiteSpace: 'nowrap', textShadow: inverse ? '0 1px 2px var(--lyra-brand-900)' : undefined }}>
      {down ? '↓' : '↑'} {value}
    </span>
  )
}

type PerfData = { inter: number; elig: number; sent: number; rec: number; comp: number; csat: number; asat: number; alerts: number }

/* ── Program Performance (total → eligible / non-eligible) ── */
const EL_COLOR = 'var(--lyra-brand-700)'
const NE_COLOR = 'var(--lyra-orange-500)'

function MetricRow({ label, value, delta, icon, tone }: { label: string; value: string; delta: string; icon: React.ReactNode; tone: 'brand' | 'critical' }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'auto auto 1fr', gridTemplateAreas: '"icon label label" "icon val delta"', columnGap: 10, alignItems: 'center', padding: '12px 14px' }}>
      <span style={{ gridArea: 'icon', width: 38, height: 38, borderRadius: 'var(--radius-full)', display: 'grid', placeItems: 'center', background: tone === 'brand' ? 'var(--lyra-brand-50)' : 'var(--lyra-color-status-critical-subtle)', color: tone === 'brand' ? 'var(--lyra-brand-600)' : 'var(--lyra-color-status-critical-strong)' }}>
        {icon}
      </span>
      <span style={{ gridArea: 'label', alignSelf: 'end', font: `500 12px/16px ${FONT}`, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--lyra-color-fg-secondary)' }}>{label}</span>
      <b style={{ gridArea: 'val', alignSelf: 'baseline', font: `600 28px/1.1 ${FONT}`, letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums', color: 'var(--lyra-color-fg-default)' }}>{value}</b>
      <span style={{ gridArea: 'delta', alignSelf: 'baseline', justifySelf: 'start' }}><Delta value={delta} size={13} /></span>
    </div>
  )
}

function ProgramPerformance({ programNames, data, deltas, periodNote }: { programNames: string[]; data: PerfData; deltas: PerfDeltas; periodNote: string }) {
  const [open, setOpen] = useState<'el' | 'ne' | null>('el')
  const { inter, elig, sent, rec, comp, csat, asat, alerts } = data
  const part = rec - comp, skipped = inter - elig
  const er = pct(elig, inter), cov = pct(sent, elig), rr = pct(rec, sent), cp = pct(comp, rec)

  // Step chart: three bars joined by connectors, drawn only as wide as the last bar.
  const H = 110, CW = 1000 / 3, BW = CW * 0.62, VW = 2 * CW + BW
  const mx = Math.max(elig, 1)
  const steps: [number, string][] = [[elig, deltas.elig], [sent, deltas.sent], [rec, deltas.rec]]
  let stepSvg = ''
  steps.forEach(([v], i) => {
    const h = H * v / mx, x = i * CW, y = H - h
    stepSvg += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${BW.toFixed(1)}" height="${h.toFixed(1)}" style="fill:var(--lyra-brand-300)"/>`
    if (i < 2) {
      const h2 = H * steps[i + 1][0] / mx
      stepSvg += `<path d="M${(x + BW).toFixed(1)} ${y.toFixed(1)} L${((i + 1) * CW).toFixed(1)} ${(H - h2).toFixed(1)} L${((i + 1) * CW).toFixed(1)} ${H} L${(x + BW).toFixed(1)} ${H} Z" style="fill:var(--lyra-brand-100)"/>`
    }
  })
  const pctOf = (x: number) => `${(x / VW * 100).toFixed(2)}%`
  const convs: [number, number, string][] = [[(BW + CW) / 2, cov, 'Coverage'], [(CW + BW + 2 * CW) / 2, rr, 'Response rate']]

  // Not-sent reasons, scaled to this slice's skipped volume.
  const share = skipped / SKIP_ALL
  const rs = REASONS.map(([n, v, k]) => [n, v * share, k] as [string, number, string])
  const tun = rs.filter(r => r[2] === 't').reduce((a, r) => a + r[1], 0)
  const mxr = Math.max(...rs.map(r => r[1]), 1)

  const selector = (key: 'el' | 'ne', label: string, value: number, rate: number, rateDelta?: string, color = EL_COLOR) => {
    const on = open === key
    return (
      <button
        type="button" onClick={() => setOpen(on ? null : key)} aria-expanded={on}
        style={{
          position: 'relative', display: 'grid', gridTemplateColumns: '10px 1fr auto auto 18px', alignItems: 'center', columnGap: 12, textAlign: 'left',
          padding: '10px 14px', cursor: 'pointer', font: `400 14px/20px ${FONT}`,
          background: on ? 'var(--lyra-color-bg-active-subtle)' : 'var(--lyra-color-bg-surface-base)',
          border: `1px solid ${on ? 'var(--lyra-brand-600)' : 'var(--lyra-slate-300)'}`, borderRadius: 'var(--radius-md)',
          boxShadow: on ? '0 0 0 3px var(--lyra-brand-100)' : 'var(--sol-effect-shadowsm)', transition: 'background .15s, border-color .15s, box-shadow .15s',
        }}
        onMouseEnter={e => { if (!on) { e.currentTarget.style.background = 'var(--lyra-color-state-bg-hover-active-subtle)'; e.currentTarget.style.borderColor = 'var(--lyra-brand-600)' } }}
        onMouseLeave={e => { if (!on) { e.currentTarget.style.background = 'var(--lyra-color-bg-surface-base)'; e.currentTarget.style.borderColor = 'var(--lyra-slate-300)' } }}
      >
        <i style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
        <span style={{ color: 'var(--lyra-color-fg-default)', whiteSpace: 'nowrap' }}>{label}</span>
        <b style={{ font: `600 17px/20px ${FONT}`, fontVariantNumeric: 'tabular-nums', color: 'var(--lyra-color-fg-default)' }}>{fmt(value)}</b>
        <em style={{ fontStyle: 'normal', font: `600 17px/20px ${FONT}`, minWidth: 120, textAlign: 'right', whiteSpace: 'nowrap', color: 'var(--lyra-color-fg-default)' }}>
          {rate}%{rateDelta && <span style={{ marginLeft: 4 }}><Delta value={rateDelta} size={13} /></span>}
        </em>
        <ChevronDown size={18} style={{ color: on ? 'var(--lyra-brand-600)' : 'var(--lyra-color-fg-secondary)', transform: on ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
      </button>
    )
  }

  return (
    <section style={{ background: 'var(--lyra-color-bg-surface-base)', border: '1px solid var(--lyra-color-border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      <div style={{ padding: '18px 22px 14px', background: 'var(--lyra-color-bg-surface-base)' }}>
        <h3 style={{ font: `600 20px/24px ${FONT}`, letterSpacing: '-0.01em', margin: 0, color: 'var(--lyra-color-fg-default)' }}>Program Performance</h3>
        <p style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', rowGap: 2, margin: '6px 0 0', font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>
          {programNames.length === 0 ? 'No programs match the selected filters' : programNames.map((n, i) => (
            <span key={n} style={{ whiteSpace: 'nowrap' }}>
              {n}
              {i < programNames.length - 1 && <span style={{ color: 'var(--lyra-slate-300)', margin: '0 12px', fontWeight: 300 }}>|</span>}
            </span>
          ))}
        </p>
      </div>
      <div style={{ padding: '24px 22px 22px' }}>
      <div style={{ margin: '-8px -6px 24px', padding: '20px 22px', borderRadius: 'var(--radius-md)', background: 'var(--lyra-color-bg-surface-shell)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 10, whiteSpace: 'nowrap' }}>
          <span style={{ font: `600 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>Total interactions</span>
          <b style={{ font: `600 26px/1.1 ${FONT}`, letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums', color: 'var(--lyra-color-fg-default)' }}>
            {fmt(inter)}<span style={{ marginLeft: 6 }}><Delta value={deltas.total} size={15} /></span>
          </b>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 820 }}>
          {selector('el', 'Eligible interactions', elig, er, deltas.eligRate)}
          {selector('ne', 'Non-eligible interactions', skipped, 100 - er, undefined, NE_COLOR)}
        </div>
        {open === null && (
          <div style={{ marginTop: 10, font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>Click a segment to see the detail</div>
        )}
      </div>

      {open === 'el' && (
        <div style={{ marginTop: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 250px 244px', gap: 16, alignItems: 'end' }}>
            {/* Step chart */}
            <div style={{ position: 'relative' }}>
              <span aria-hidden="true" style={{ position: 'absolute', right: -23, bottom: 12, width: 30, height: 30, borderRadius: 'var(--radius-full)', background: 'var(--lyra-color-bg-surface-base)', border: '1px solid var(--lyra-slate-300)', color: 'var(--lyra-color-fg-secondary)', display: 'grid', placeItems: 'center', boxShadow: 'var(--sol-effect-shadowsm)', zIndex: 3 }}>
                <ArrowRight size={16} />
              </span>
              {[0, CW, 2 * CW].map(x => (
                <i key={x} aria-hidden="true" style={{ position: 'absolute', top: 0, bottom: 0, left: pctOf(x), width: 1.5, pointerEvents: 'none', zIndex: 2, backgroundImage: 'repeating-linear-gradient(to bottom, var(--lyra-slate-400) 0, var(--lyra-slate-400) 3px, transparent 3px, transparent 7px)' }} />
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: `${CW}fr ${CW}fr ${BW}fr` }}>
                {['Eligible interactions', 'Surveys sent', 'Responses received'].map(l => (
                  <div key={l} style={{ padding: '0 6px 0 10px', minHeight: 36, marginBottom: 8 }}>
                    <span style={{ font: `600 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)', whiteSpace: 'nowrap' }}>{l}</span>
                  </div>
                ))}
              </div>
              <div style={{ position: 'relative' }}>
                {convs.map(([x, v, l]) => (
                  <div key={l} style={{ position: 'absolute', left: pctOf(x), bottom: 10, transform: 'translateX(-50%)', display: 'grid', rowGap: 1, textAlign: 'center', pointerEvents: 'none' }}>
                    <b style={{ font: `600 13px/1.1 ${FONT}`, color: 'var(--lyra-brand-800)' }}>{v}%</b>
                    <span style={{ font: `600 12px/1.1 ${FONT}`, letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--lyra-brand-800)', maxWidth: 72 }}>{l}</span>
                  </div>
                ))}
                {steps.map(([v, d], i) => (
                  <div key={i} style={{ position: 'absolute', left: pctOf(i * CW + 12), bottom: 9, display: 'flex', alignItems: 'baseline', gap: 5, whiteSpace: 'nowrap', pointerEvents: 'none' }}>
                    <b style={{ font: `600 18px/1.1 ${FONT}`, letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums', color: 'var(--lyra-brand-900)' }}>{fmt(v)}</b>
                    <Delta value={d} size={12} inverse />
                  </div>
                ))}
                <svg viewBox={`0 0 ${VW} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: 110, display: 'block' }} aria-hidden="true" dangerouslySetInnerHTML={{ __html: stepSvg }} />
              </div>
            </div>

            {/* Split of responses */}
            <div style={{ paddingLeft: 16 }}>
              <div style={{ font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-secondary)', marginBottom: 14 }}>Split of responses received</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 14 }}>
                {([["Survey's completed", comp, deltas.comp, EL_COLOR], ['Partially completed', part, deltas.part, NE_COLOR]] as [string, number, string, string][]).map(([l, v, d, c]) => (
                  <div key={l}>
                    <span style={{ display: 'block', font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-secondary)', whiteSpace: 'nowrap', marginBottom: 4 }}>{l}</span>
                    <b style={{ display: 'flex', alignItems: 'center', gap: 6, font: `500 18px/22px ${FONT}`, whiteSpace: 'nowrap', color: 'var(--lyra-color-fg-default)' }}>
                      <i style={{ width: 14, height: 14, borderRadius: 2, background: c, flexShrink: 0 }} />
                      {fmt(v)}
                      <Delta value={d} size={12} />
                    </b>
                  </div>
                ))}
              </div>
              <div style={{ height: 32, display: 'flex', overflow: 'hidden' }}>
                <i style={{ width: `${cp}%`, background: EL_COLOR }} />
                <i style={{ width: `${100 - cp}%`, background: NE_COLOR }} />
              </div>
            </div>

            {/* ASAT + CSAT + Alerts */}
            <div style={{ borderLeft: '1px solid var(--lyra-color-border-subtle)', paddingLeft: 16, alignSelf: 'stretch', display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '100%', border: '1px solid var(--lyra-color-border-subtle)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--sol-effect-shadowsm)', overflow: 'hidden' }}>
                <MetricRow label="ASAT" value={`${asat}%`} delta={deltas.asat} tone="brand" icon={<Headphones size={20} />} />
                <div style={{ borderTop: '1px solid var(--lyra-color-border-subtle)' }} />
                <MetricRow label="CSAT" value={`${csat}%`} delta={deltas.csat} tone="brand" icon={<Smile size={20} />} />
                <div style={{ borderTop: '1px solid var(--lyra-color-border-subtle)' }} />
                <MetricRow label="Alerts" value={fmt(alerts)} delta={deltas.alerts} tone="critical" icon={<Bell size={20} />} />
              </div>
            </div>
          </div>
          <div style={{ marginTop: 14, font: `400 13px/18px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>{periodNote}</div>
        </div>
      )}

      {open === 'ne' && (
        <div style={{ marginTop: 'var(--space-4)' }}>
          <div style={{ display: 'grid', rowGap: 3, marginBottom: 16 }}>
            <b style={{ font: `600 17px/22px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>Why surveys were not sent</b>
            <span style={{ font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>
              {pct(skipped, inter)}% of interactions never became eligible. {fmt(tun)} sit behind program settings you can change.
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10, alignItems: 'end' }}>
            {rs.map(([n, v, k]) => (
              <div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '100%', height: 140, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
                  <span style={{ font: `600 15px/20px ${FONT}`, fontVariantNumeric: 'tabular-nums', marginBottom: 6, color: 'var(--lyra-color-fg-default)' }}>{fmt(v)}</span>
                  <i style={{ display: 'block', width: '100%', borderRadius: '4px 4px 0 0', height: `${Math.round(v / mxr * 100)}%`, background: k === 't' ? NE_COLOR : 'var(--lyra-slate-400)' }} />
                </div>
                <span style={{ font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)', marginTop: 8, textAlign: 'center' }}>{n}</span>
                <span style={{ font: `400 13px/16px ${FONT}`, color: 'var(--lyra-color-fg-secondary)', marginTop: 2 }}>{pct(v, skipped)}%</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 18, font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-secondary)', borderTop: '1px solid var(--lyra-color-border-subtle)', marginTop: 10, paddingTop: 10 }}>
            <span><i style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, marginRight: 6, verticalAlign: 'middle', background: NE_COLOR }} />Tunable - you can change</span>
            <span><i style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, marginRight: 6, verticalAlign: 'middle', background: 'var(--lyra-slate-400)' }} />Compliance - fixed by rules</span>
          </div>
        </div>
      )}
      </div>
    </section>
  )
}

/* ── Today's highlights ── */
const FRACTIONS: [number, string][] = [[0.25, '1 in 4'], [0.33, '1 in 3'], [0.4, '2 in 5'], [0.5, '1 in 2'], [0.6, '3 in 5'], [0.67, '2 in 3'], [0.75, '3 in 4'], [0.8, '4 in 5']]
const fractionLabel = (ratio: number) => FRACTIONS.reduce((best, f) => (Math.abs(f[0] - ratio) < Math.abs(best[0] - ratio) ? f : best))[1]

function HighlightCard({ accent, icon, children }: { accent: 'critical' | 'loss'; icon: React.ReactNode; children: React.ReactNode }) {
  const color = accent === 'critical' ? 'var(--lyra-color-status-critical-strong)' : 'var(--lyra-orange-500)'
  const wash = accent === 'critical' ? 'var(--lyra-color-status-critical-subtle)' : 'var(--lyra-color-status-warning-subtle)'
  return (
    <li style={{ display: 'grid', gridTemplateColumns: '38px 1fr', columnGap: 12, alignItems: 'center', padding: '12px 14px 12px 12px', background: `linear-gradient(90deg, ${wash} 0%, var(--lyra-color-bg-surface-base) 55%)`, border: '1px solid var(--lyra-color-border-subtle)', borderLeft: `5px solid ${color}`, borderRadius: 'var(--radius-md)', boxShadow: 'var(--sol-effect-shadowsm)' }}>
      <span style={{ width: 38, height: 38, borderRadius: 'var(--radius-full)', display: 'grid', placeItems: 'center', color, background: wash }}>{icon}</span>
      <span style={{ minWidth: 0, font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>{children}</span>
    </li>
  )
}

function TodaysHighlights({ programs, inter, elig }: { programs: typeof PROGRAMS; inter: number; elig: number }) {
  const h = new Date().getHours()
  const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  const attention = programs.filter(p => p.tags.includes('Needs attention'))
  const skipped = inter - elig, ratio = inter ? skipped / inter : 0

  return (
    <section aria-label="Today's highlights" style={{ background: 'rgba(143,115,227,0.10)', borderRadius: 'var(--radius-lg)', padding: '12px 16px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <h2 style={{ font: `600 20px/24px ${FONT}`, margin: 0, color: 'var(--lyra-color-fg-default)' }}>{greet}, James.</h2>
          <p style={{ margin: 0, font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>Here are today's highlights</p>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, font: `400 13px/18px ${FONT}`, color: 'var(--lyra-color-fg-secondary)', whiteSpace: 'nowrap' }}>
          <i style={{ width: 8, height: 8, borderRadius: 'var(--radius-full)', background: 'var(--lyra-color-status-success-strong)', boxShadow: '0 0 0 3px var(--lyra-color-status-success-subtle)' }} />
          Live · updated just now
        </span>
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 12 }}>
        <HighlightCard accent="critical" icon={<Activity size={19} />}>
          <b style={{ color: 'var(--lyra-color-fg-default)', fontWeight: 600 }}>
            {attention.length === 0 ? 'All programs are healthy' : `${attention.length} of ${programs.length} programs need${attention.length === 1 ? 's' : ''} attention`}
          </b>
          <span style={{ display: 'block' }}>
            {attention.length === 0
              ? 'No program is below its CSAT or response-rate target.'
              : attention.map(p => `${p.n} (CSAT ${p.csat}%, response ${pct(p.rec, p.sent)}%)`).join(' · ') + '.'}
          </span>
        </HighlightCard>
        <HighlightCard accent="loss" icon={<UserMinus size={19} />}>
          <b style={{ color: 'var(--lyra-color-fg-default)', fontWeight: 600 }}>{fractionLabel(ratio)} interactions never reach a survey</b>
          <span style={{ display: 'block' }}>
            {pct(skipped, inter)}% were not eligible. <span style={{ font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>(Refer Non-eligible interaction section below)</span>
          </span>
        </HighlightCard>
      </ul>
    </section>
  )
}

/* ── Applied filters ── */
function AppliedChip({ group, value, onRemove }: { group: string; value: string; onRemove?: () => void }) {
  const removable = !!onRemove
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 30, padding: removable ? '0 6px 0 10px' : '0 10px', borderRadius: 'var(--radius-full)', font: `500 14px/20px ${FONT}`, whiteSpace: 'nowrap', background: removable ? 'var(--lyra-color-bg-active-subtle)' : 'var(--lyra-color-bg-surface-canvas)', color: removable ? 'var(--lyra-color-fg-active-strong)' : 'var(--lyra-color-fg-secondary)', border: removable ? 'none' : '1px solid var(--lyra-color-border-subtle)' }}>
      <small style={{ font: `400 13px/18px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>{group}</small>
      {value}
      {removable && (
        <button type="button" onClick={onRemove} aria-label={`Remove ${group} ${value}`} style={{ width: 18, height: 18, borderRadius: 'var(--radius-full)', border: 'none', background: 'transparent', color: 'inherit', display: 'grid', placeItems: 'center', cursor: 'pointer', padding: 0 }}>
          <X size={11} />
        </button>
      )}
    </span>
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
  { label: 'ASAT', lines: ['ASAT'] },
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
  { label: 'ASAT', lines: ['ASAT'] },
  { label: 'Alerts', lines: ['Alerts'] },
]

const CHANNEL_DATA = [
  { channel: 'SMS', elig: 2745, coverage: 89, sent: 2452, responseRate: 66, rec: 1618, completionRate: 70, comp: 1133, partial: 485, csat: 78, asat: 82, alerts: 10 },
  { channel: 'WhatsApp', elig: 1590, coverage: 89, sent: 1423, responseRate: 59, rec: 837, completionRate: 65, comp: 545, partial: 292, csat: 77, asat: 80, alerts: 6 },
  { channel: 'Email', elig: 2890, coverage: 89, sent: 2571, responseRate: 38, rec: 977, completionRate: 58, comp: 567, partial: 410, csat: 72, asat: 79, alerts: 11 },
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
  { label: 'ASAT', lines: ['ASAT'] },
  { label: 'Alerts', lines: ['Alerts'] },
]

const TOPIC_DATA = [
  { topic: 'Service Outage', elig: 1192, coverage: 90, sent: 1077, responseRate: 44, rec: 475, completionRate: 57, comp: 269, partial: 206, csat: 74, asat: 79, alerts: 6 },
  { topic: 'Rebooking', elig: 816, coverage: 86, sent: 702, responseRate: 65, rec: 459, completionRate: 74, comp: 338, partial: 121, csat: 81, asat: 84, alerts: 4 },
  { topic: 'Refund Processing', elig: 644, coverage: 89, sent: 570, responseRate: 57, rec: 325, completionRate: 69, comp: 225, partial: 100, csat: 73, asat: 78, alerts: 4 },
  { topic: 'Delivery Delay', elig: 619, coverage: 86, sent: 533, responseRate: 64, rec: 339, completionRate: 75, comp: 255, partial: 84, csat: 78, asat: 83, alerts: 2 },
  { topic: 'Technical Troubleshooting', elig: 571, coverage: 93, sent: 533, responseRate: 61, rec: 323, completionRate: 73, comp: 237, partial: 86, csat: 70, asat: 76, alerts: 3 },
  { topic: 'Billing Dispute', elig: 432, coverage: 93, sent: 402, responseRate: 72, rec: 289, completionRate: 78, comp: 225, partial: 64, csat: 80, asat: 85, alerts: 2 },
  { topic: 'Account Access', elig: 272, coverage: 95, sent: 258, responseRate: 51, rec: 132, completionRate: 59, comp: 78, partial: 54, csat: 70, asat: 77, alerts: 4 },
  { topic: 'Bot Transfer Friction', elig: 221, coverage: 86, sent: 190, responseRate: 48, rec: 91, completionRate: 58, comp: 53, partial: 38, csat: 86, asat: 88, alerts: 1 },
  { topic: 'Other topics', elig: 2458, coverage: 89, sent: 2181, responseRate: 46, rec: 999, completionRate: 57, comp: 565, partial: 434, csat: 75, asat: 81, alerts: 1 },
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
  const Icon = isActive ? Power : PowerOff
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      font: `500 12px/16px ${FONT}`, letterSpacing: '0.01em',
      whiteSpace: 'nowrap',
      color: isActive ? 'var(--lyra-color-status-success-strong)' : 'var(--lyra-color-status-warning-strong)',
    }}>
      <Icon size={13} strokeWidth={2} style={{ flexShrink: 0 }} />
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
              {Array.from({ length: 11 }, (_, i) => <col key={i} style={{ width: '6.54%' }} />)}
            </colgroup>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--lyra-color-border-subtle)' }}>
                {CHANNEL_COLUMNS.map(col => (
                  <th
                    key={col.label}
                    scope="col"
                    style={{
                      padding: `var(--space-3) var(--space-2) var(--space-3) ${col.label === 'Channel' ? 'var(--space-4)' : 'var(--space-2)'}`,
                      textAlign: 'left',
                      font: `500 12px/16px ${FONT}`,
                      color: 'var(--lyra-color-fg-secondary)',
                      letterSpacing: '0.01em',
                      textTransform: 'uppercase',
                      verticalAlign: 'top',
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
                  <td style={{ padding: 'var(--space-3) var(--space-2)', font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>
                    {c.asat}%
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
              {Array.from({ length: 11 }, (_, i) => <col key={i} style={{ width: '6.54%' }} />)}
            </colgroup>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--lyra-color-border-subtle)' }}>
                {TOPIC_COLUMNS.map(col => (
                  <th
                    key={col.label}
                    scope="col"
                    style={{
                      padding: `var(--space-3) var(--space-2) var(--space-3) ${col.label === 'Topic' ? 'var(--space-4)' : 'var(--space-2)'}`,
                      textAlign: 'left',
                      font: `500 12px/16px ${FONT}`,
                      color: 'var(--lyra-color-fg-secondary)',
                      letterSpacing: '0.01em',
                      textTransform: 'uppercase',
                      verticalAlign: 'top',
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
                  <td style={{ padding: 'var(--space-3) var(--space-2)', font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>
                    {t.asat}%
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
              <col style={{ width: '23%' }} />
              {Array.from({ length: 12 }, (_, i) => <col key={i} style={{ width: '6.4%' }} />)}
            </colgroup>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--lyra-color-border-subtle)' }}>
                {PROGRAM_COLUMNS.map(col => (
                  <th
                    key={col.label}
                    scope="col"
                    style={{
                      padding: `var(--space-3) var(--space-2) var(--space-3) ${col.label === 'Program Name' ? 'var(--space-4)' : 'var(--space-2)'}`,
                      textAlign: 'left',
                      font: `500 14px/16px ${FONT}`,
                      color: 'var(--lyra-color-fg-default)',
                      verticalAlign: 'top',
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
                      <td style={{ padding: 'var(--space-3) var(--space-2)', font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>
                        {p.asat}%
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
const PROGRAM_INTER_OVERRIDE: Record<string, number> = { 'Complaint Resolution Follow-Up': 2572 }
const PROGRAM_DELTAS: Record<string, PerfDeltas> = {
  'Complaint Resolution Follow-Up': { total: '+10%', elig: '+5%', eligRate: '-2%', sent: '+3%', rec: '-9%', comp: '-11%', part: '+4%', csat: '-6%', asat: '-3%', alerts: '+18%' },
  'Flight Disruption Recovery': { total: '+12%', elig: '+9%', eligRate: '+2%', sent: '+5%', rec: '+6%', comp: '+8%', part: '-3%', csat: '+2%', asat: '+2%', alerts: '-5%' },
  'Billing and Refund Recovery · All Digital': { total: '+7%', elig: '+6%', eligRate: '+1%', sent: '+4%', rec: '+3%', comp: '+5%', part: '-2%', csat: '+1%', asat: '+1%', alerts: '-4%' },
  'Omnichannel Escalation Recovery': { total: '+9%', elig: '+7%', eligRate: '+2%', sent: '+3%', rec: '+4%', comp: '+6%', part: '-1%', csat: '+2%', asat: '+1%', alerts: '-3%' },
  'Product Feedback - Beta Testers': { total: '+4%', elig: '+3%', eligRate: '+1%', sent: '+2%', rec: '+2%', comp: '+3%', part: '-1%', csat: '+1%', asat: '+1%', alerts: '-1%' },
}

type ResponseRow = { customer: string; id: string; agent: string; topic: string | null; sent: string | null; response: string | null; completed: string | null; csat: number | null; asat: number | null; status: string }
const DETAIL_RESPONSES: ResponseRow[] = [
  { customer: 'Sophie Patel', id: 'INT-4064903', agent: 'Ben K.', topic: null, sent: null, response: null, completed: null, csat: null, asat: null, status: 'Program Not Found' },
  { customer: 'Olivia Smith', id: 'INT-6257112', agent: 'Tomás R.', topic: 'Technical Troubleshooting', sent: 'Jul 1, 15:32', response: 'Jul 1, 15:35', completed: 'Jul 1, 16:13', csat: 5, asat: 5, status: 'Response Received' },
  { customer: 'Marcus Wright', id: 'INT-4789800', agent: 'Liu Yang', topic: 'Refund Processing', sent: 'Jul 2, 08:35', response: 'Jul 2, 08:55', completed: 'Jul 2, 09:08', csat: 2, asat: 3, status: 'Response Received' },
  { customer: 'Ava Johnson', id: 'INT-1601280', agent: 'Tomás R.', topic: 'Refund Processing', sent: 'Jul 18, 08:05', response: 'Jul 18, 08:22', completed: null, csat: 1, asat: 2, status: 'Partially Responded' },
  { customer: 'Olivia Smith', id: 'INT-3002077', agent: 'Priya M.', topic: 'Account Access', sent: 'Jul 5, 11:53', response: 'Jul 5, 12:06', completed: 'Jul 5, 12:30', csat: 5, asat: 4, status: 'Response Received' },
  { customer: 'Daniel Chen', id: 'INT-1249933', agent: 'Tomás R.', topic: 'Refund Processing', sent: 'Jul 12, 16:19', response: 'Jul 12, 16:44', completed: null, csat: 1, asat: null, status: 'Partially Responded' },
  { customer: 'Liam Al-Farsi', id: 'INT-5180251', agent: 'Priya M.', topic: 'Service Outage', sent: 'Jul 9, 13:54', response: null, completed: null, csat: null, asat: null, status: 'Not Started' },
  { customer: 'Marcus Smith', id: 'INT-2249741', agent: 'Rajat S.', topic: 'Technical Troubleshooting', sent: 'Jul 11, 14:35', response: 'Jul 11, 14:57', completed: 'Jul 11, 15:14', csat: 5, asat: 5, status: 'Response Received' },
  { customer: 'Noah Garcia', id: 'INT-7339243', agent: 'Priya M.', topic: 'Technical Troubleshooting', sent: null, response: null, completed: null, csat: null, asat: null, status: 'No Matching Skill or Team' },
  { customer: 'Noah Patel', id: 'INT-5451225', agent: 'Priya M.', topic: null, sent: 'Jul 9, 16:08', response: 'Jul 9, 16:18', completed: 'Jul 9, 16:49', csat: 4, asat: 4, status: 'Response Received' },
]

const RESPONSE_COLUMNS = ['Customer', 'Interaction ID', 'Agent', 'Primary Topic', 'Sent', 'Response', 'Completed', 'CSAT', 'ASAT', 'Status']
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
  const [range, setRange] = useState<DateRange | null>(DEFAULT_RANGE)
  const [openRow, setOpenRow] = useState<ResponseRow | null>(null)

  const k = range ? rangeDays(range) / 7 : 1
  const perf: PerfData = {
    inter: (PROGRAM_INTER_OVERRIDE[program.n] ?? program.inter) * k,
    elig: program.elig * k, sent: program.sent * k, rec: program.rec * k, comp: program.comp * k,
    csat: program.csat, asat: program.asat, alerts: program.alerts,
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

        <div style={{ marginTop: 'var(--space-7)' }}>
          <ProgramPerformance programNames={[program.n]} data={perf} deltas={PROGRAM_DELTAS[program.n] ?? OVERVIEW_DELTAS} periodNote={previousPeriodNote(range)} />
        </div>

        {/* Customer responses */}
        <div style={{ marginTop: 'var(--space-7)', background: 'var(--lyra-color-bg-surface-base)', border: '1px solid var(--lyra-color-border-subtle)', borderRadius: 'var(--radius-lg)' }}>
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
                      padding: `var(--space-3) ${col === 'Status' ? 'var(--space-4)' : 'var(--space-2)'} var(--space-3) ${col === 'Customer' ? 'var(--space-4)' : 'var(--space-2)'}`,
                      textAlign: col === 'Status' ? 'right' : 'left',
                      font: `500 12px/16px ${FONT}`,
                      color: 'var(--lyra-color-fg-secondary)',
                      letterSpacing: '0.01em',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
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
                  <td style={{ ...cell(), padding: 'var(--space-3) var(--space-2) var(--space-3) var(--space-4)', fontWeight: 500 }}>{r.customer}</td>
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
                  <td style={cell()}>
                    {r.asat === null ? <Muted>n/a</Muted> : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
                        <Star size={12} style={{ color: 'var(--lyra-color-status-warning-medium)', fill: 'currentColor' }} />
                        {r.asat} of 5
                      </span>
                    )}
                  </td>
                  <td style={{ ...cell(), textAlign: 'right', padding: 'var(--space-3) var(--space-4) var(--space-3) var(--space-2)' }}><ResponseStatus status={r.status} /></td>
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
const CHANNELS = ['SMS', 'WhatsApp', 'Email']
const TOPICS = ['Service Disruption', 'Billing Recovery', 'Service Recovery', 'Product']

function useSlicedData(filters: { progs: string[]; chs: string[]; cats: string[]; days: number }) {
  return useMemo(() => {
    const allCh = filters.chs.length === 0
    const k = filters.days / 7
    const S = PROGRAMS
      .filter(p => (filters.progs.length === 0 || filters.progs.includes(p.n)) && (filters.cats.length === 0 || filters.cats.includes(p.cat)))
      .map(p => {
        const c = allCh ? 1 : filters.chs.reduce((a, x) => a + ((p.ch as Record<string, number>)[x] || 0), 0)
        if (!c) return null
        const m = c * k
        return { ...p, inter: p.inter * m, elig: p.elig * m, sent: p.sent * m, rec: p.rec * m, comp: p.comp * m, alerts: Math.round(p.alerts * c) }
      })
      .filter(Boolean) as typeof PROGRAMS

    const sum = (f: 'inter' | 'elig' | 'sent' | 'rec' | 'comp' | 'alerts') => S.reduce((a, p) => a + p[f], 0)
    const inter = sum('inter'), elig = sum('elig'), sent = sum('sent'), rec = sum('rec'), comp = sum('comp'), alerts = sum('alerts')
    const isAll = S.length === PROGRAMS.length && allCh && filters.days === 7
    const csat = isAll ? 76 : rec ? Math.round(S.reduce((a, p) => a + p.csat * p.rec, 0) / rec) : 0
    const asat = isAll ? 81 : rec ? Math.round(S.reduce((a, p) => a + p.asat * p.rec, 0) / rec) : 0

    return { inter, elig, sent, rec, comp, csat, asat, alerts, programs: S }
  }, [filters.progs, filters.chs, filters.cats, filters.days])
}

/* ── Page ── */
export function Dashboard5Page() {
  const [search, setSearch] = useState('')
  const [progs, setProgs] = useState<string[]>([])
  const [chs, setChs] = useState<string[]>([])
  const [cats, setCats] = useState<string[]>([])
  const [range, setRange] = useState<DateRange | null>(DEFAULT_RANGE)
  const [selected, setSelected] = useState<typeof PROGRAMS[0] | null>(null)

  const data = useSlicedData({ progs, chs, cats, days: range ? rangeDays(range) : 7 })

  if (selected) {
    return <ProgramDetailView program={selected} onBack={() => setSelected(null)} />
  }

  const multiLabel = (v: string[], all: string, noun: string) => (v.length === 0 ? all : v.length === 1 ? v[0] : `${v.length} ${noun}`)
  const defaultRange = isDefaultRange(range)
  const hasFilters = !defaultRange || progs.length > 0 || chs.length > 0 || cats.length > 0
  const chipCount = (defaultRange ? 0 : 1) + progs.length + chs.length + cats.length
  const clearAll = () => { setProgs([]); setChs([]); setCats([]); setRange(DEFAULT_RANGE()) }
  const groups: [string, string[], (v: string[]) => void][] = [['Program', progs, setProgs], ['Channel', chs, setChs], ['Topic', cats, setCats]]

  return (
    <div className="flex flex-col flex-1 h-full" style={{ background: 'var(--lyra-color-bg-surface-base)' }}>
      <div style={{ minHeight: 72, padding: 'var(--space-4) var(--space-7)', borderBottom: '1px solid var(--lyra-color-border-subtle)', display: 'flex', alignItems: 'center' }}>
        <h1 style={{ font: `600 20px/24px ${FONT}`, letterSpacing: '-0.01em', color: 'var(--lyra-color-fg-default)' }}>
          Program Health
        </h1>
      </div>

      <div className="flex-1 min-h-0" style={{ paddingTop: 'var(--space-6)', paddingLeft: 'var(--space-7)', paddingRight: 'var(--space-7)', paddingBottom: 'var(--space-6)', overflowY: 'auto' }}>
        <TodaysHighlights programs={data.programs} inter={data.inter} elig={data.elig} />

        {/* Filter Bar */}
        <div style={{ marginTop: 'var(--space-7)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search program name" />
          <DateRangePicker value={range} onChange={setRange} />
          <div style={{ width: 230 }}>
            <MultiSelectField options={PROGRAMS.map(p => p.n)} value={progs} onChange={setProgs} mutedPlaceholder={false} labelOverride={multiLabel(progs, 'All programs', 'programs')} radius="var(--radius-md)" />
          </div>
          <div style={{ width: 150 }}>
            <MultiSelectField options={CHANNELS} value={chs} onChange={setChs} mutedPlaceholder={false} labelOverride={multiLabel(chs, 'All channels', 'channels')} radius="var(--radius-md)" />
          </div>
          <div style={{ width: 170 }}>
            <MultiSelectField options={TOPICS} value={cats} onChange={setCats} mutedPlaceholder={false} labelOverride={multiLabel(cats, 'All Topics', 'topics')} radius="var(--radius-md)" />
          </div>
        </div>

        {hasFilters && (
          <div style={{ marginTop: 'var(--space-3)', border: '1px solid var(--lyra-color-border-subtle)', borderRadius: 'var(--radius-md)', background: 'var(--lyra-color-bg-surface-base)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px' }}>
              <span style={{ font: `500 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>
                Applied filters <em style={{ fontStyle: 'normal', fontWeight: 400, color: 'var(--lyra-color-fg-secondary)' }}>({chipCount})</em>
              </span>
              <button
                type="button" onClick={clearAll}
                style={{ marginLeft: 'auto', height: 30, padding: '0 11px', border: 'none', borderRadius: 'var(--radius-md)', background: 'transparent', font: `500 13px/18px ${FONT}`, color: 'var(--lyra-color-fg-secondary)', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                Clear all
              </button>
            </div>
            <div style={{ padding: '0 12px 10px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {!defaultRange && <AppliedChip group="Date" value={range ? fmtRange(range) : 'No period'} onRemove={() => setRange(DEFAULT_RANGE())} />}
              {groups.map(([g, v, set]) => (
                v.length === 0
                  ? <AppliedChip key={g} group={g} value="All" />
                  : v.map(x => <AppliedChip key={`${g}-${x}`} group={g} value={x} onRemove={() => set(v.filter(y => y !== x))} />)
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: 'var(--space-7)' }}>
          <ProgramPerformance programNames={data.programs.map(p => p.n)} data={data} deltas={OVERVIEW_DELTAS} periodNote={previousPeriodNote(range)} />
        </div>

        <div style={{ marginTop: 'var(--space-7)' }}>
          <ProgramsTable programs={data.programs} searchQuery={search} onSelectProgram={setSelected} />
        </div>
      </div>
    </div>
  )
}
