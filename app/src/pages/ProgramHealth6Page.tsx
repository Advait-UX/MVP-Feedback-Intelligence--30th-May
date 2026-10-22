import { useState, useMemo, useEffect, useRef, Fragment } from 'react'
import { Activity, AlertTriangle, ArrowLeftRight, ArrowRight, Bell, BellOff, Calendar, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, CircleDashed, Headphones, Hourglass, Info, Lightbulb, MessageSquare, MinusCircle, Power, PowerOff, Search, Smile, Sparkles, Star, UserMinus, Wrench, X, XCircle } from 'lucide-react'
import { SearchInput } from '../components/feedback-management/ListPagePrimitives'
import { MultiSelectField } from '../components/campaign-wizard/WizardPrimitives'

const FONT = 'var(--font-sans)'

/* ── Data ── */
const PROGRAMS = [
  { n: 'Complaint Resolution Follow-Up', tags: ['Active', 'AI questions', 'Needs attention'], cat: 'Service Recovery', ch: { SMS: 0.6, Email: 0.4 }, inter: 3350, elig: 1106, sent: 1062, rec: 319, comp: 137, csat: 59, asat: 72, csatD: '↓ 6pp', rrD: '↓ 9pp', alerts: 10, coverageUp: false, responseRateUp: false, completionRateUp: false, csatUp: false },
  { n: 'Flight Disruption Recovery', tags: ['Active', 'AI questions'], cat: 'Service Disruption', ch: { WhatsApp: 0.5, SMS: 0.3, Email: 0.2 }, inter: 6990, elig: 2308, sent: 1985, rec: 1211, comp: 872, csat: 86, asat: 88, alerts: 3, coverageUp: true, responseRateUp: true, completionRateUp: true, csatUp: true },
  { n: 'Billing and Refund Recovery · All Digital', tags: ['Active', 'AI questions'], cat: 'Billing Recovery', ch: { Email: 0.55, SMS: 0.45 }, inter: 4675, elig: 1542, sent: 1372, rec: 617, comp: 327, csat: 81, asat: 83, alerts: 4, coverageUp: true, responseRateUp: true, completionRateUp: true, csatUp: true },
  { n: 'Omnichannel Escalation Recovery', tags: ['Active', 'AI questions'], cat: 'Service Recovery', ch: { Email: 0.4, WhatsApp: 0.35, SMS: 0.25 }, inter: 4350, elig: 1435, sent: 1335, rec: 828, comp: 580, csat: 80, asat: 82, alerts: 5, coverageUp: true, responseRateUp: true, completionRateUp: true, csatUp: true },
  { n: 'Product Feedback - Beta Testers', tags: ['Inactive', 'Static questions', 'Needs attention'], expiredOn: 'Oct 9', cat: 'Product', ch: { Email: 0.7, WhatsApp: 0.3 }, inter: 2555, elig: 834, sent: 600, rec: 457, comp: 329, csat: 75, asat: 80, alerts: 5, coverageUp: false, responseRateUp: true, completionRateUp: true, csatUp: true },
]

/* "Program not found" was folded out — every interaction now routes to a program, so those 2,134
   interactions were redistributed proportionally across the remaining reasons, keeping the same total. */
const REASONS: [string, number, string][] = [
  ['No Matching Skill/Team', 5305, 't'], ['Recency Window', 4045, 't'],
  ['Interaction Too Short', 2364, 't'], ['Outside Send Window', 970, 't'], ['Survey Refused', 1232, 'c'], ['Internal Interaction', 779, 'c'],
]
const SKIP_ALL = 14695

const fmt = (n: number) => Math.round(n).toLocaleString('en-US')
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0)

/* ── Shared filter controls ── */
function FilterDropdown({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', height: 36, paddingLeft: 12, paddingRight: 12, width: 250, background: 'var(--lyra-color-bg-field)', border: '1px solid var(--lyra-color-border-soft)', borderRadius: 'var(--radius-md)' }}>
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
const fmtDay = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
const fmtRange = (r: DateRange | null) => (r ? `${fmtDay(r.start)} – ${fmtDay(r.end)}` : '')

const lastN = (n: number): DateRange => ({ start: addDays(TODAY, -(n - 1)), end: TODAY })
const lastMonths = (n: number): DateRange => ({ start: new Date(TODAY.getFullYear(), TODAY.getMonth() - n, TODAY.getDate()), end: TODAY })

const RANGE_PRESETS: { label: string; range: () => DateRange }[] = [
  { label: 'Last 7 days', range: () => lastN(7) },
  { label: 'Current month', range: () => ({ start: new Date(TODAY.getFullYear(), TODAY.getMonth(), 1), end: TODAY }) },
  { label: 'Last month', range: () => ({ start: new Date(TODAY.getFullYear(), TODAY.getMonth() - 1, 1), end: new Date(TODAY.getFullYear(), TODAY.getMonth(), 0) }) },
  { label: 'Last 6 months', range: () => lastMonths(6) },
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
        style={{ display: 'flex', alignItems: 'center', height: 36, paddingLeft: 12, paddingRight: 12, width: 268, background: 'var(--lyra-color-bg-field)', border: `1px solid ${open ? 'var(--lyra-color-border-active)' : 'var(--lyra-color-border-soft)'}`, borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'left' }}
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
const DEFAULT_RANGE = (): DateRange => lastMonths(6)
const isDefaultRange = (r: DateRange | null) => !!r && sameDay(r.start, DEFAULT_RANGE().start) && sameDay(r.end, DEFAULT_RANGE().end)

/* ── Deltas ── */
type PerfDeltas = { total: string; elig: string; sent: string; rec: string; comp: string; part: string; csat: string; asat: string; alerts: string }
const OVERVIEW_DELTAS: PerfDeltas = { total: '+13%', elig: '+8%', sent: '+4%', rec: '+2%', comp: '+9%', part: '-6%', csat: '+3%', asat: '+1%', alerts: '-2%' }

const isDown = (d: string) => d.trim().startsWith('-')
function Delta({ value, size = 13, color }: { value: string; size?: number; color?: string }) {
  const down = isDown(value)
  const resolvedColor = color ?? (down ? 'var(--lyra-color-status-critical-strong)' : 'var(--lyra-color-status-success-strong)')
  return (
    <span style={{ font: `600 ${size}px/1.2 ${FONT}`, color: resolvedColor, whiteSpace: 'nowrap' }}>
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px' }}>
      <span style={{ width: 28, height: 28, borderRadius: 'var(--radius-full)', display: 'grid', placeItems: 'center', flexShrink: 0, background: tone === 'brand' ? 'var(--lyra-brand-50)' : 'var(--lyra-color-status-critical-subtle)', color: tone === 'brand' ? 'var(--lyra-brand-600)' : 'var(--lyra-color-status-critical-strong)' }}>
        {icon}
      </span>
      <span style={{ font: `500 12px/16px ${FONT}`, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--lyra-color-fg-secondary)', marginRight: 8 }}>{label}</span>
      <b style={{ font: `600 20px/1.2 ${FONT}`, letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums', color: 'var(--lyra-color-fg-default)', marginRight: 18 }}>{value}</b>
      <Delta value={delta} size={12} />
    </div>
  )
}

type PerfTab = 'el' | 'ne' | null

function ProgramPerformance({ programNames, data, deltas, periodNote, open: openProp, onOpenChange }: { programNames: { n: string; active: boolean }[]; data: PerfData; deltas: PerfDeltas; periodNote: string; open?: PerfTab; onOpenChange?: (t: PerfTab) => void }) {
  const [openLocal, setOpenLocal] = useState<PerfTab>('el')
  const open = openProp !== undefined ? openProp : openLocal
  const setOpen = (t: PerfTab) => { setOpenLocal(t); onOpenChange?.(t) }
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
  const convs: [number, number, string][] = [[(BW + CW) / 2, cov, 'Survey Coverage'], [(CW + BW + 2 * CW) / 2, rr, 'Response Rate']]

  // Not-sent reasons, scaled to this slice's skipped volume.
  const share = skipped / SKIP_ALL
  const rs = REASONS.map(([n, v, k]) => [n, v * share, k] as [string, number, string])
  const tun = rs.filter(r => r[2] === 't').reduce((a, r) => a + r[1], 0)
  const mxr = Math.max(...rs.map(r => r[1]), 1)

  const selector = (key: 'el' | 'ne', label: string, hint: string, value: number, countDelta: string | undefined, rate: number, color = EL_COLOR) => {
    const on = open === key
    return (
      <button
        type="button" role="tab" aria-selected={on} onClick={() => setOpen(on ? null : key)}
        style={{
          position: 'relative', display: 'grid', gridTemplateColumns: '10px 1fr auto auto 18px', alignItems: 'center', columnGap: 16, textAlign: 'left',
          padding: '10px 18px', cursor: 'pointer', font: `400 14px/20px ${FONT}`,
          background: on ? 'var(--lyra-color-bg-active-subtle)' : 'var(--lyra-color-bg-surface-base)',
          border: `1px solid ${on ? 'var(--lyra-brand-600)' : 'var(--lyra-slate-300)'}`, borderRadius: 'var(--radius-md)',
          boxShadow: on ? '0 0 0 3px var(--lyra-brand-100)' : 'var(--sol-effect-shadowsm)', transition: 'background .15s, border-color .15s, box-shadow .15s',
        }}
        onMouseEnter={e => { if (!on) { e.currentTarget.style.background = 'var(--lyra-color-state-bg-hover-active-subtle)'; e.currentTarget.style.borderColor = 'var(--lyra-brand-600)' } }}
        onMouseLeave={e => { if (!on) { e.currentTarget.style.background = 'var(--lyra-color-bg-surface-base)'; e.currentTarget.style.borderColor = 'var(--lyra-slate-300)' } }}
      >
        <i style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
        <span style={{ display: 'grid', rowGap: 1, minWidth: 0, overflow: 'hidden' }}>
          <span style={{ font: `500 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
          <span title={hint} style={{ font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{hint}</span>
        </span>
        <b style={{ font: `600 17px/20px ${FONT}`, fontVariantNumeric: 'tabular-nums', color: 'var(--lyra-color-fg-default)', whiteSpace: 'nowrap' }}>
          {fmt(value)}{countDelta && <span style={{ marginLeft: 6 }}><Delta value={countDelta} size={13} /></span>}
        </b>
        <em style={{ fontStyle: 'normal', font: `400 14px/20px ${FONT}`, minWidth: 90, textAlign: 'right', whiteSpace: 'nowrap', color: 'var(--lyra-color-fg-secondary)' }}>
          {rate}% of total
        </em>
        <ChevronDown size={18} style={{ color: on ? 'var(--lyra-brand-600)' : 'var(--lyra-color-fg-secondary)', transform: on ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
      </button>
    )
  }

  return (
    <section style={{ background: 'var(--lyra-color-bg-surface-base)', border: '1px solid var(--lyra-color-border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      <div style={{ padding: '18px 22px 10px', background: 'var(--lyra-color-bg-surface-base)' }}>
        <h3 style={{ font: `600 20px/24px ${FONT}`, letterSpacing: '-0.01em', margin: 0, color: 'var(--lyra-color-fg-default)' }}>Program Performance</h3>
        <p style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', rowGap: 2, margin: '6px 0 0', font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>
          {programNames.length === 0 ? 'No programs match the selected filters' : programNames.map(({ n, active }, i) => (
            <span key={n} title={active ? 'Active program' : 'Inactive program'} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: active ? 'var(--lyra-color-status-success-strong)' : 'var(--lyra-color-status-warning-strong)' }} />
              {n}
              {i < programNames.length - 1 && <span style={{ color: 'var(--lyra-slate-300)', margin: '0 12px', fontWeight: 300 }}>|</span>}
            </span>
          ))}
        </p>
      </div>
      <div style={{ padding: '20px 22px 22px' }}>
      <div style={{ margin: '-4px -6px 24px', padding: '20px 22px', borderRadius: 'var(--radius-md)', background: 'var(--lyra-color-bg-active-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 10, whiteSpace: 'nowrap' }}>
          <span style={{ font: `600 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>Total Interactions</span>
          <b style={{ font: `600 26px/1.1 ${FONT}`, letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums', color: 'var(--lyra-color-fg-default)' }}>
            {fmt(inter)}<span style={{ marginLeft: 6 }}><Delta value={deltas.total} size={15} /></span>
          </b>
        </div>
        <div role="tablist" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 1060 }}>
          {selector('el', 'Eligible for Survey', 'Track sent, responded, completed', elig, deltas.elig, er)}
          {selector('ne', 'Not Eligible for Survey', 'See why no survey was sent', skipped, undefined, 100 - er, NE_COLOR)}
        </div>
        {open === null && (
          <div style={{ marginTop: 10, font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>Select a tab to see the detail</div>
        )}
      </div>

      {open === 'el' && (
        <div style={{ marginTop: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 244px', gap: 16, alignItems: 'end' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 290px', gap: 16, alignItems: 'stretch' }}>
            {/* Step chart */}
            <div style={{ position: 'relative' }}>
              <span aria-hidden="true" style={{ position: 'absolute', right: -23, bottom: 12, width: 30, height: 30, borderRadius: 'var(--radius-full)', background: 'var(--lyra-color-bg-surface-base)', border: '1px solid var(--lyra-slate-300)', color: 'var(--lyra-color-fg-secondary)', display: 'grid', placeItems: 'center', boxShadow: 'var(--sol-effect-shadowsm)', zIndex: 3 }}>
                <ArrowRight size={16} />
              </span>
              {[0, CW, 2 * CW].map(x => (
                <i key={x} aria-hidden="true" style={{ position: 'absolute', top: 0, bottom: 0, left: pctOf(x), width: 1.5, pointerEvents: 'none', zIndex: 2, backgroundImage: 'repeating-linear-gradient(to bottom, var(--lyra-slate-400) 0, var(--lyra-slate-400) 3px, transparent 3px, transparent 7px)' }} />
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: `${CW}fr ${CW}fr ${BW}fr` }}>
                {['Eligible for Survey', 'Surveys Sent', 'Responses Received'].map(l => (
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
                    <b style={{ font: `700 19px/1.1 ${FONT}`, letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums', color: 'var(--lyra-brand-900)' }}>{fmt(v)}</b>
                    <Delta value={d} size={13} color="var(--lyra-brand-900)" />
                  </div>
                ))}
                <svg viewBox={`0 0 ${VW} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: 110, display: 'block' }} aria-hidden="true" dangerouslySetInnerHTML={{ __html: stepSvg }} />
              </div>
            </div>

            {/* Split of responses */}
            <div style={{ paddingLeft: 16, display: 'flex', flexDirection: 'column' }}>
              <div style={{ minHeight: 36, marginBottom: 8, display: 'flex', alignItems: 'center' }}>
                <span style={{ font: `600 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-secondary)', whiteSpace: 'nowrap' }}>Split of Responses Received</span>
              </div>
              <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', gap: 6, marginBottom: 14 }}>
                {([["Survey's Completed", comp, deltas.comp, EL_COLOR, false], ['Partially Responded', part, deltas.part, NE_COLOR, true]] as [string, number, string, string, boolean][]).map(([l, v, d, c, right]) => (
                  <div key={l} style={{ display: 'flex', flexDirection: 'column', alignItems: right ? 'flex-end' : 'flex-start' }}>
                    <span style={{ display: 'block', font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-secondary)', whiteSpace: 'nowrap', marginBottom: 4, textAlign: right ? 'right' : 'left' }}>{l}</span>
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
          </div>

            {/* ASAT + CSAT + Alerts */}
            <div style={{ paddingLeft: 16, alignSelf: 'stretch', display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '100%', border: '1px solid var(--lyra-color-border-subtle)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--sol-effect-shadowsm)', overflow: 'hidden' }}>
                <MetricRow label="ASAT" value={`${asat}%`} delta={deltas.asat} tone="brand" icon={<Headphones size={16} />} />
                <div style={{ borderTop: '1px solid var(--lyra-color-border-subtle)' }} />
                <MetricRow label="CSAT" value={`${csat}%`} delta={deltas.csat} tone="brand" icon={<Smile size={16} />} />
                <div style={{ borderTop: '1px solid var(--lyra-color-border-subtle)' }} />
                <MetricRow label="Alerts" value={fmt(alerts)} delta={deltas.alerts} tone="critical" icon={<Bell size={16} />} />
              </div>
            </div>
          </div>
          <div style={{ marginTop: 14, font: `400 13px/18px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>{periodNote}</div>
        </div>
      )}

      {open === 'ne' && (
        <div style={{ marginTop: 'var(--space-4)' }}>
          <div style={{ display: 'grid', rowGap: 3, marginBottom: 16 }}>
            <b style={{ font: `600 17px/22px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>Why Surveys Were Not Sent</b>
            <span style={{ font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>
              {fmt(skipped)} interactions ({pct(skipped, inter)}%) did not qualify for a survey, so none was sent. The reasons below explain the drop. {fmt(tun)} of them sit behind program settings you can change; the rest are fixed by compliance rules.
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${rs.length}, 1fr)`, gap: 10, alignItems: 'end' }}>
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

/* A highlight only earns a card once its metric crosses one of these lines — a quiet metric never takes a slot. */
const HL = { notEligible: 60, coverage: 75, responseRate: 50, responseDrop: 5, partial: 30, programPartial: 40, csat: 70, asat: 75 }

const rrDrop = (p: typeof PROGRAMS[0]) => Number(/↓\s*(\d+)pp/.exec(p.rrD ?? '')?.[1] ?? 0)

type HlTone = 'critical' | 'loss' | 'warning'
const HL_TONE: Record<HlTone, { fg: string; wash: string }> = {
  critical: { fg: 'var(--lyra-color-status-critical-strong)', wash: 'var(--lyra-color-status-critical-subtle)' },
  loss: { fg: 'var(--lyra-orange-500)', wash: 'var(--lyra-orange-50, #fff3eb)' },
  warning: { fg: 'var(--lyra-color-status-warning-strong)', wash: 'var(--lyra-color-status-warning-subtle)' },
}
/* A row shows either a single `value` on the right or a set of `chips` (the same StatusPill / GreyBadge /
   PpDrop the Programs table uses) under the label — so one program can list every metric it is failing. */
type HlRow = { label: string; value?: string; note?: string; chips?: React.ReactNode; muted?: boolean; onClick?: () => void }
type Highlight = { key: string; tone: HlTone; icon: React.ReactNode; eyebrow: string; title: string; body: string; rows: HlRow[]; action: string; onAction: () => void }

function HighlightRow({ row, tone, dim }: { row: HlRow; tone: HlTone; dim?: boolean }) {
  const inner = (
    <>
      <span style={{ minWidth: 0, flex: 1 }}>
        <span style={{ display: 'block', font: `500 14px/20px ${FONT}`, color: dim ? 'var(--lyra-color-fg-secondary)' : 'var(--lyra-color-fg-default)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.label}</span>
        {row.note && <span style={{ display: 'block', font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.note}</span>}
        {row.chips && <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-2)', opacity: dim ? 0.7 : 1 }}>{row.chips}</span>}
      </span>
      {row.value && <span style={{ flexShrink: 0, font: `600 14px/20px ${FONT}`, fontVariantNumeric: 'tabular-nums', color: row.muted || dim ? 'var(--lyra-color-fg-secondary)' : HL_TONE[tone].fg }}>{row.value}</span>}
      {row.onClick && <ChevronRight size={14} style={{ flexShrink: 0, color: 'var(--lyra-color-fg-disabled)' }} />}
    </>
  )
  const style: React.CSSProperties = { width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: 'var(--space-3) 6px', margin: '0 -6px', borderTop: '1px solid var(--lyra-color-border-soft)', textAlign: 'left', background: 'transparent', boxSizing: 'content-box' }
  return (
    <li>
      {row.onClick ? (
        <button
          type="button" onClick={row.onClick} title={row.label}
          style={{ ...style, borderRight: 'none', borderBottom: 'none', borderLeft: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
        >{inner}</button>
      ) : <div style={style}>{inner}</div>}
    </li>
  )
}

/* Same shape as the Program Health 2 card (icon · headline + one line · action). Cards with contributing
   programs or reasons grow downward on click; the rest stay a single compact row. */
/* Clicking any one card expands every expandable card's data together, so a reader scanning the row never
   has to open each one in turn — but the clicked card stays visually "in front" (full accent ring, richer
   wash, raised shadow) while the rest recede to a quieter secondary treatment, same data, lower emphasis. */
function HighlightCard({ h, state, onToggle }: { h: Highlight; state: 'idle' | 'primary' | 'secondary'; onToggle: () => void }) {
  const t = HL_TONE[h.tone]
  const expandable = h.rows.length > 0
  const expanded = expandable && state !== 'idle'
  const primary = state === 'primary'
  const toggle = () => expandable && onToggle()
  const [hover, setHover] = useState(false)

  const borderColor = primary ? t.fg : 'var(--lyra-color-border-subtle)'
  const washStop = primary ? '62%' : state === 'secondary' ? '38%' : '55%'
  const shadow = primary ? 'var(--sol-effect-shadowlg)' : hover ? 'var(--sol-effect-shadowmd)' : 'var(--sol-effect-shadowsm)'

  return (
    <li style={{ flex: '1 1 max(300px, calc((100% - 24px) / 3))', minWidth: 0, display: 'flex', scrollSnapAlign: 'start' }}>
      <article
        aria-label={h.eyebrow}
        onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          background: `linear-gradient(90deg, ${t.wash} 0%, var(--lyra-color-bg-surface-base) ${washStop})`,
          borderTop: `1px solid ${borderColor}`, borderRight: `1px solid ${borderColor}`, borderBottom: `1px solid ${borderColor}`, borderLeft: `5px solid ${t.fg}`, borderRadius: 'var(--radius-md)',
          boxShadow: shadow, transform: primary ? 'translateY(-2px)' : 'none',
          transition: 'box-shadow .18s, border-color .18s, background .18s, transform .18s',
        }}
      >
        <div
          role={expandable ? 'button' : undefined} tabIndex={expandable ? 0 : undefined} aria-expanded={expandable ? expanded : undefined}
          onClick={toggle} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle() } }}
          title={expandable ? `${h.title} — ${h.body}` : undefined}
          style={{ flexShrink: 0, display: 'grid', gridTemplateColumns: '38px 1fr auto', columnGap: 12, alignItems: 'center', padding: '12px 14px 12px 12px', cursor: expandable ? 'pointer' : 'default', borderRadius: 'var(--radius-md)', outline: 'none' }}
        >
          <span style={{ width: 38, height: 38, borderRadius: 'var(--radius-full)', display: 'grid', placeItems: 'center', color: t.fg, background: t.wash, flexShrink: 0, boxShadow: primary ? `0 0 0 3px color-mix(in srgb, ${t.fg} 18%, transparent)` : 'none', transition: 'box-shadow .18s' }}>{h.icon}</span>
          <span style={{ minWidth: 0, font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>
            <b style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: 'var(--lyra-color-fg-default)', fontWeight: 600 }}>{h.title}</b>
            <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{h.body}</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, alignSelf: 'start' }}>
            {!expandable && (
              <button type="button" onClick={e => { e.stopPropagation(); h.onAction() }} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: 0, border: 'none', background: 'transparent', font: `500 13px/18px ${FONT}`, color: 'var(--lyra-color-fg-link)', whiteSpace: 'nowrap', cursor: 'pointer' }}>
                {h.action}<ChevronRight size={14} />
              </button>
            )}
            {expandable && (
              <span style={{ width: 24, height: 24, borderRadius: 'var(--radius-full)', display: 'grid', placeItems: 'center', color: primary ? t.fg : 'var(--lyra-color-fg-secondary)', background: expanded ? 'var(--lyra-color-state-bg-hover-opacity)' : 'transparent' }}>
                <ChevronDown size={16} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform .18s' }} />
              </span>
            )}
          </span>
        </div>
        {expandable && (
          <div style={{ display: 'grid', gridTemplateRows: expanded ? '1fr' : '0fr', transition: 'grid-template-rows .22s ease' }}>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ padding: '0 14px 12px 12px', opacity: expanded ? 1 : 0, transition: 'opacity .18s' }}>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {h.rows.slice(0, 3).map(r => <HighlightRow key={r.label} row={r} tone={h.tone} dim={!primary} />)}
                </ul>
                <div style={{ paddingTop: 10, borderTop: '1px solid var(--lyra-color-border-subtle)' }}>
                  <button type="button" onClick={h.onAction} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: 0, border: 'none', background: 'transparent', font: `500 13px/18px ${FONT}`, color: 'var(--lyra-color-fg-link)', cursor: 'pointer' }}>
                    {h.action}<ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </article>
    </li>
  )
}

type HighlightsProps = {
  programs: typeof PROGRAMS; inter: number; elig: number; sent: number; rec: number; comp: number
  onSelectProgram: (p: typeof PROGRAMS[0]) => void; onShowNotEligible: () => void; onShowFunnel: () => void; onShowPrograms: () => void
}

/* Every metric a program is failing, as the same pills the Programs table shows for that column —
   so one row carries the whole picture and a program is never repeated across cards. */
function programBreaches(p: typeof PROGRAMS[0]): React.ReactNode[] {
  const cov = pct(p.sent, p.elig), rr = pct(p.rec, p.sent), part = pct(p.rec - p.comp, p.rec)
  const chips: React.ReactNode[] = []
  if (p.tags.includes('Inactive')) chips.push(<StatusPill key="status" status="Inactive" />)
  if (cov < HL.coverage) chips.push(<GreyBadge key="cov">Coverage {cov}%</GreyBadge>)
  if (rr < HL.responseRate || rrDrop(p) >= HL.responseDrop) {
    chips.push(<GreyBadge key="rr">Response {rr}%</GreyBadge>)
    if (p.rrD) chips.push(<PpDrop key="rrd" value={p.rrD} />)
  }
  if (part > HL.programPartial || p.completionRateUp === false) chips.push(<GreyBadge key="part">Partial {fmt(p.rec - p.comp)} ({part}%)</GreyBadge>)
  if (p.csat < HL.csat) {
    chips.push(<GreyBadge key="csat">CSAT {p.csat}%</GreyBadge>)
    if (p.csatD) chips.push(<PpDrop key="csatd" value={p.csatD} />)
  }
  if (p.asat < HL.asat) chips.push(<GreyBadge key="asat">ASAT {p.asat}%</GreyBadge>)
  if (p.tags.includes('Needs attention') && p.alerts >= 5) {
    chips.push(<span key="alerts" style={{ font: `600 14px/18px ${FONT}`, color: 'var(--lyra-color-status-critical-strong)', whiteSpace: 'nowrap' }}>{p.alerts} alerts</span>)
  }
  return chips
}

function buildHighlights({ programs, inter, elig, onSelectProgram, onShowNotEligible, onShowPrograms }: HighlightsProps): Highlight[] {
  const open = (p: typeof PROGRAMS[0]) => () => onSelectProgram(p)
  const plural = (n: number, one: string, many: string) => (n === 1 ? one : many)
  const out: Highlight[] = []

  /* 1. Programs needing attention — one row per program, every failing metric on that row. Programs the
     table flags come first; programs that merely breach a threshold follow as "to watch". */
  const expired = programs.filter(p => p.tags.includes('Inactive') && p.expiredOn)
  const attention = programs.filter(p => p.tags.includes('Needs attention'))
  const watch = programs.filter(p => !attention.includes(p) && programBreaches(p).length > 0)
  const underperforming = attention.filter(p => !expired.includes(p))
  const parts = [
    underperforming.length && `${underperforming.length} ${plural(underperforming.length, 'is', 'are')} underperforming`,
    expired.length && `${expired.length} ${plural(expired.length, 'has', 'have')} expired and stopped sending surveys`,
  ].filter(Boolean)
  const cause = (p: typeof PROGRAMS[0]) => PROGRAM_INSIGHTS[p.n]?.causes[0]?.title
  const row = (p: typeof PROGRAMS[0], muted: boolean): HlRow => ({
    label: p.n,
    note: expired.includes(p) ? `Expired ${p.expiredOn} · renew to resume surveys` : muted ? `To watch · ${cause(p) ?? 'close to a limit'}` : cause(p),
    chips: programBreaches(p),
    muted, onClick: open(p),
  })
  out.push({
    key: 'health', tone: 'critical', icon: <Activity size={16} />, eyebrow: 'Programs needing attention',
    title: attention.length === 0
      ? 'All programs are healthy'
      : `${attention.length} of ${programs.length} programs need attention`,
    body: attention.length === 0
      ? 'No program is below its CSAT or response-rate target.'
      : `${parts.join(', and ')}.${watch.length ? ` ${watch.length} more ${plural(watch.length, 'is', 'are')} close to a limit.` : ''}`,
    rows: [...attention.map(p => row(p, false)), ...watch.map(p => row(p, true))],
    action: 'View all programs', onAction: onShowPrograms,
  })

  /* 2. Survey eligibility */
  const notElig = pct(inter - elig, inter)
  if (notElig > HL.notEligible) {
    const total = REASONS.reduce((a, r) => a + r[1], 0)
    out.push({
      key: 'eligibility', tone: 'loss', icon: <UserMinus size={16} />, eyebrow: 'Survey eligibility',
      title: `${fractionLabel(notElig / 100)} interactions never reach a survey`,
      body: `${notElig}% did not qualify for a survey, so none was sent.`,
      rows: [...REASONS].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([n, v, k]) => ({ label: n, value: `${pct(v, total)}%`, note: k === 't' ? 'Tunable in program settings' : 'Fixed by compliance rules' })),
      action: 'See all reasons', onAction: onShowNotEligible,
    })
  }

  return out
}

function ScrollArrow({ dir, disabled, onClick }: { dir: -1 | 1; disabled: boolean; onClick: () => void }) {
  const Icon = dir < 0 ? ChevronLeft : ChevronRight
  return (
    <button
      type="button" onClick={onClick} disabled={disabled} aria-label={dir < 0 ? 'Previous highlights' : 'Next highlights'}
      style={{ width: 30, height: 30, display: 'grid', placeItems: 'center', borderRadius: 'var(--radius-full)', border: '1px solid var(--lyra-color-border-soft)', background: 'var(--lyra-color-bg-surface-base)', color: disabled ? 'var(--lyra-color-fg-disabled)' : 'var(--lyra-color-fg-default)', cursor: disabled ? 'default' : 'pointer', boxShadow: disabled ? 'none' : 'var(--sol-effect-shadowsm)' }}
    >
      <Icon size={16} />
    </button>
  )
}

function TodaysHighlights(_props: HighlightsProps) {
  const h = new Date().getHours()
  const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
      <h2 style={{ font: `600 20px/24px ${FONT}`, margin: 0, color: 'var(--lyra-color-fg-default)' }}>{greet}, James.</h2>
    </div>
  )
}

/* ── Program insight: problem → root cause → call to action ── */
/* kind: 'attention' = an insight rule fired; 'watch' = healthy, but a watch rule is close to its threshold;
   'pending' = not enough data yet to diagnose a cause — distinct from "healthy", never a silent placeholder. */
/* A banner metric either gets a plain before/after stat (CSAT, ASAT — numbers a PM can read in
   one glance) or a one-line cause + action (metrics with a single clear fix). Never both, never
   a paragraph: whichever a rule or a PM scanning the page needs to decide what to do next.
   onAction/actionLabel are wired in by the page (not authored as content) so a card can jump
   straight to the matching filter on the table below. */
type InsightMetric = { label: string; value: string; delta: string; stat?: string; cause?: string; action?: string; onAction?: () => void; actionLabel?: string }

type ProgramInsight = {
  kind: 'attention' | 'watch' | 'pending'
  rules: string[]
  problem: InsightMetric[]
  causes: { title: string; detail: string }[]
  actions: { title: string; detail: string; cta: string; primary?: boolean }[]
  dataProgress?: { collected: number; needed: number }
  /* Secondary metrics worth watching alongside the flagged problem — not yet severe enough for a rule
     to fire, but each still gets the same one-glance treatment as the problem metrics above. */
  watch?: InsightMetric[]
}

const PROGRAM_INSIGHTS: Record<string, ProgramInsight> = {
  'Flight Disruption Recovery': {
    kind: 'watch',
    rules: ['Partially Responded responses above 25% for 14 days', 'Survey coverage below 90% on WhatsApp'],
    problem: [
      { label: 'Partially Responded', value: '28%', delta: '+4pp' },
      { label: 'Survey Coverage', value: '86%', delta: '-3pp' },
      { label: 'CSAT', value: '86%', delta: '+2pp' },
    ],
    causes: [
      { title: 'Compensation follow-up arrives before the claim closes', detail: '58% of drop-offs happen on Q2 ("Was the compensation explained?"), sent while the claim is still open — on average 3 days before a decision.' },
      { title: 'WhatsApp surveys land in the boarding window', detail: '31% of WhatsApp sends go out within 45 minutes of the rebooked departure. Those get a 22% response rate versus 64% for sends after landing.' },
    ],
    actions: [
      { title: 'Hold the compensation follow-up until the claim is decided', detail: 'Expected to cut partial completions by roughly 10pp.', cta: 'Adjust question timing', primary: true },
      { title: 'Pause sends from 60 minutes before departure to landing', detail: 'Moves about 600 WhatsApp sends a week into a window that responds.', cta: 'Adjust send window' },
      { title: 'Share rebooking verbatims with Airport Operations', detail: '42 responses mention gate changes that were not announced.', cta: 'Share verbatims' },
    ],
  },
  'Billing and Refund Recovery · All Digital': {
    kind: 'watch',
    rules: ['Response rate below 50% for 7 consecutive days', 'Partially Responded responses above 40%'],
    problem: [
      { label: 'Response Rate', value: '45%', delta: '+3pp' },
      { label: 'Partially Responded', value: '47%', delta: '-2pp' },
      { label: 'CSAT', value: '81%', delta: '+1pp' },
      { label: 'Alerts', value: '4', delta: '-4%' },
    ],
    causes: [
      { title: 'The survey competes with the refund receipt', detail: '52% of email surveys arrive within 10 minutes of the refund confirmation email. Those are opened 19% of the time, against 41% for surveys sent a day later.' },
      { title: 'Partial refunds drive 3 of the 4 alerts', detail: 'Refunds with a fee deducted average 1.8 stars; full refunds average 4.3. In every alert the customer did not know a fee would be taken.' },
    ],
    actions: [
      { title: 'Send the survey 24 hours after the refund receipt', detail: 'Expected to lift response rate to about 55% based on the delayed-send cohort.', cta: 'Adjust send window', primary: true },
      { title: 'Add the fee breakdown to partial-refund confirmations', detail: 'Removes the surprise behind 3 of the 4 alerts.', cta: 'Notify Billing' },
      { title: 'Review the 4 open alerts', detail: 'Two are from customers with a second refund still pending.', cta: 'Open alerts' },
    ],
  },
  'Omnichannel Escalation Recovery': {
    kind: 'watch',
    rules: ['Repeat-contact rate above 15% for 7 consecutive days'],
    problem: [
      { label: 'Repeat contacts', value: '17%', delta: '+3pp' },
      { label: 'CSAT', value: '80%', delta: '+2pp' },
      { label: 'Alerts', value: '5', delta: '-3%' },
    ],
    causes: [
      { title: 'Context is lost on the chat-to-voice hand-off', detail: '64% of 1–3 star responses say the customer had to repeat their issue after the transfer. Those customers average 2.1 stars; hand-offs with the transcript attached average 4.2.' },
      { title: 'Promised callbacks arrive late', detail: '38% of callbacks land more than 2 hours after the promised slot. 4 of the 5 alerts this period come from that group.' },
    ],
    actions: [
      { title: 'Attach the chat transcript to every voice escalation', detail: 'Expected to lift CSAT on transferred cases by roughly 1.5 stars.', cta: 'Notify supervisor', primary: true },
      { title: 'Tighten the callback window to 60 minutes', detail: 'Covers the group behind 4 of 5 alerts.', cta: 'Adjust callback SLA' },
      { title: 'Review the 5 open alerts', detail: 'Three customers have contacted us three or more times this month.', cta: 'Open alerts' },
    ],
  },
  'Product Feedback - Beta Testers': {
    kind: 'attention',
    rules: ['Program end date passed — no surveys sent since Oct 9', 'Survey coverage below 75%'],
    problem: [
      { label: 'Survey Coverage', value: '72%', delta: '-11pp', stat: '600 of 834 eligible interactions got a survey, down from 692 last period.' },
      { label: 'Surveys sent', value: '600', delta: '-13%', cause: 'The program expired on Oct 9 and stopped sending', action: 'Extend the end date to resume surveys' },
      { label: 'Alerts', value: '5', delta: '0%', stat: '5 alerts still open from before the program expired.' },
    ],
    causes: [
      { title: 'The program reached its end date on Oct 9', detail: 'Surveys stopped the moment the program expired. 234 eligible interactions since then have had no follow-up, while the beta itself is still running.' },
      { title: 'Mobile sync is still the top complaint', detail: '41% of 1–3 star responses say changes made on desktop do not appear on mobile. Those testers average 2.4 stars; everyone else averages 4.1.' },
    ],
    actions: [
      { title: 'Extend the program end date', detail: 'Resumes surveys for the testers still in the beta and brings coverage back to roughly 83%.', cta: 'Edit program', primary: true },
      { title: 'Review the 5 open alerts', detail: 'All five testers are still active in the beta.', cta: 'Open alerts' },
      { title: 'Share the mobile sync verbatims with Product', detail: '17 responses describe the same reproduction steps.', cta: 'Share verbatims' },
    ],
  },
  'Complaint Resolution Follow-Up': {
    kind: 'attention',
    rules: ['Response rate below 40% for 7 consecutive days', 'CSAT dropped 5pp or more vs. the previous period'],
    problem: [
      { label: 'Response Rate', value: '30%', delta: '-9pp', cause: 'Surveys land outside customer hours', action: 'Move the SMS send window to 9am–6pm' },
      { label: 'CSAT', value: '59%', delta: '-6pp', stat: '34 interactions rated 1–2 this period, up from 21 last period.' },
      { label: 'Alerts', value: '10', delta: '+18%', stat: '10 alerts this period, up from 8 last period.' },
    ],
    causes: [
      { title: 'Surveys land outside customer hours', detail: '61% of SMS surveys were sent after 8 pm. Those sends got an 18% response rate versus 47% for daytime sends.' },
      { title: 'Refund Processing drives the low ratings', detail: '44% of 1–2 star responses are about refunds. In 7 of 10 verbatims the customer was not told when the money would arrive.' },
    ],
    actions: [
      { title: 'Move the SMS send window to 9 am – 6 pm', detail: 'Expected to lift response rate by roughly 10pp based on daytime sends.', cta: 'Adjust send window', primary: true },
      { title: 'Share refund verbatims with the Billing supervisor', detail: 'Ask agents to confirm a refund date before closing.', cta: 'Notify supervisor' },
      { title: 'Review the 10 detractor alerts', detail: 'All 10 are open. Three are from repeat customers.', cta: 'Open alerts' },
    ],
    watch: [
      { label: 'ASAT', value: '72%', delta: '-3%', stat: '19 interactions rated 1–2 this period, up from 13 last period.' },
      { label: 'Skipped', value: '57%', delta: 'of interactions', cause: 'Mostly "no matching skill or team" (454 of 1,466 skipped)', action: 'Review skill routing for these queues' },
      { label: 'Partially Responded', value: '182', delta: '+4%', cause: 'Most drop-offs happen after the refund question', action: 'Move that question earlier in the survey' },
    ],
  },
}

/* Honest fallback for a program with no authored insight yet: says what's missing and when to expect it,
   rather than a static "Analysis in progress" that looks identical whether 1 day or 30 days of data exist. */
const GENERIC_INSIGHT = (p: typeof PROGRAMS[0]): ProgramInsight => ({
  kind: 'pending',
  rules: [],
  problem: [
    { label: 'Response Rate', value: `${pct(p.rec, p.sent)}%`, delta: p.rrD ?? '0pp' },
    { label: 'CSAT', value: `${p.csat}%`, delta: p.csatD ?? '0pp' },
    { label: 'Alerts', value: fmt(p.alerts), delta: '0%' },
  ],
  causes: [],
  actions: [{ title: 'Open the program to review recent responses', detail: 'Check the latest verbatims and alerts while data builds up.', cta: 'Open program', primary: true }],
  dataProgress: { collected: 3, needed: 7 },
})

function InsightStep({ n, icon, title, children }: { n: number; icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr', columnGap: 'var(--space-3)' }}>
      <span style={{ width: 32, height: 32, borderRadius: 'var(--radius-full)', display: 'grid', placeItems: 'center', background: 'var(--lyra-brand-50)', color: 'var(--lyra-brand-700)' }}>{icon}</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', height: 32 }}>
          <span style={{ font: `500 12px/16px ${FONT}`, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--lyra-color-fg-secondary)' }}>Step {n}</span>
          <span style={{ font: `600 16px/20px ${FONT}`, letterSpacing: '-0.01em', color: 'var(--lyra-color-fg-default)' }}>{title}</span>
        </div>
        <div style={{ marginTop: 'var(--space-2)' }}>{children}</div>
      </div>
    </div>
  )
}

function WatchChip() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: 'var(--radius-full)', border: '1px solid var(--lyra-color-status-info-medium)', background: 'var(--lyra-color-status-info-subtle)', font: `500 12px/16px ${FONT}`, color: 'var(--lyra-color-status-info-strong)', whiteSpace: 'nowrap' }}>
      Healthy · watching
    </span>
  )
}

function PendingChip() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: 'var(--radius-full)', border: '1px solid var(--lyra-color-border-soft)', background: 'var(--lyra-slate-100)', font: `500 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-secondary)', whiteSpace: 'nowrap' }}>
      Gathering data
    </span>
  )
}

function InsightDrawer({ program, onClose, onOpenProgram }: { program: typeof PROGRAMS[0]; onClose: () => void; onOpenProgram: () => void }) {
  const ins = PROGRAM_INSIGHTS[program.n] ?? GENERIC_INSIGHT(program)
  const attention = ins.kind === 'attention'
  const pending = ins.kind === 'pending'

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const box: React.CSSProperties = { border: '1px solid var(--lyra-color-border-soft)', borderRadius: 'var(--radius-md)', background: 'var(--lyra-color-bg-surface-base)' }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.24)' }} />
      <aside role="dialog" aria-label={`${program.n} needs attention`} style={{ position: 'relative', width: 520, maxWidth: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--lyra-color-bg-surface-base)', borderLeft: '1px solid var(--lyra-color-border-soft)', boxShadow: 'var(--sol-effect-shadowlg)' }}>
        <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--lyra-color-border-subtle)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <span style={{ font: `600 16px/20px ${FONT}`, letterSpacing: '-0.01em', color: 'var(--lyra-color-fg-default)' }}>{program.n}</span>
              {attention ? <NeedsAttentionChip /> : pending ? <PendingChip /> : <WatchChip />}
            </div>
            <div style={{ font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-secondary)', marginTop: 2 }}>
              {attention ? 'What is wrong, why, and what to do next' : pending ? 'Not enough data yet to diagnose a cause' : 'What to watch, why, and what to do before it becomes a problem'}
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', borderRadius: 'var(--radius-sm)', color: 'var(--lyra-color-fg-action)', cursor: 'pointer', flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Why it was flagged */}
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-start', padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)', background: attention ? 'var(--lyra-color-status-critical-subtle)' : pending ? 'var(--lyra-slate-100)' : 'var(--lyra-color-status-info-subtle)', color: attention ? 'var(--lyra-color-status-critical-strong)' : pending ? 'var(--lyra-color-fg-secondary)' : 'var(--lyra-color-status-info-strong)' }}>
            {attention ? <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} /> : pending ? <Hourglass size={16} style={{ flexShrink: 0, marginTop: 2 }} /> : <Lightbulb size={16} style={{ flexShrink: 0, marginTop: 2 }} />}
            <div style={{ font: `400 14px/20px ${FONT}` }}>
              <b style={{ fontWeight: 600 }}>
                {attention
                  ? `Flagged by ${ins.rules.length} insight rule${ins.rules.length > 1 ? 's' : ''}`
                  : pending
                  ? `Needs ${ins.dataProgress?.needed ?? 7} days of data — ${ins.dataProgress?.collected ?? 0} collected so far`
                  : `No insight rule has fired. ${ins.rules.length} watch rule${ins.rules.length > 1 ? 's are' : ' is'} close to threshold`}
              </b>
              {pending ? (
                <p style={{ margin: '4px 0 0' }}>We'll show the likely root cause and a recommended action once enough responses come in.</p>
              ) : (
                <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                  {ins.rules.map(r => <li key={r}>{r}</li>)}
                </ul>
              )}
            </div>
          </div>

          <InsightStep n={1} icon={<Activity size={16} />} title={attention ? 'Problem' : pending ? 'What we know so far' : 'What to watch'}>
            <div style={{ ...box, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {ins.problem.map((m, i) => (
                <div key={m.label} style={{ padding: 'var(--space-3) var(--space-4)', borderLeft: i > 0 ? '1px solid var(--lyra-color-border-subtle)' : undefined }}>
                  <div style={{ font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>{m.label}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
                    <b style={{ font: `600 20px/24px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>{m.value}</b>
                    <Delta value={m.delta} size={12} />
                  </div>
                </div>
              ))}
            </div>
          </InsightStep>

          {!pending && (
            <InsightStep n={2} icon={<Search size={16} />} title="Likely root cause">
              <div style={box}>
                {ins.causes.map((c, i) => (
                  <div key={c.title} style={{ padding: 'var(--space-3) var(--space-4)', borderTop: i > 0 ? '1px solid var(--lyra-color-border-subtle)' : undefined }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
                      <span style={{ font: `500 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>{c.title}</span>
                      <AiChip />
                    </div>
                    <p style={{ margin: '4px 0 0', font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>{c.detail}</p>
                  </div>
                ))}
              </div>
            </InsightStep>
          )}

          <InsightStep n={pending ? 2 : 3} icon={<Wrench size={16} />} title="Call to action">
            <div style={box}>
              {ins.actions.map((a, i) => (
                <div key={a.title} style={{ padding: 'var(--space-3) var(--space-4)', borderTop: i > 0 ? '1px solid var(--lyra-color-border-subtle)' : undefined, display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ font: `500 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>{a.title}</div>
                    <div style={{ font: `400 13px/18px ${FONT}`, color: 'var(--lyra-color-fg-secondary)', marginTop: 2 }}>{a.detail}</div>
                  </div>
                  <button type="button" onClick={onOpenProgram}
                    style={{ flexShrink: 0, height: 32, padding: '0 12px', borderRadius: 'var(--radius-md)', font: `500 13px/18px ${FONT}`, cursor: 'pointer', whiteSpace: 'nowrap', background: a.primary ? 'var(--lyra-color-bg-primary)' : 'var(--lyra-color-bg-surface-base)', color: a.primary ? 'var(--lyra-color-fg-on-primary)' : 'var(--lyra-color-fg-default)', border: a.primary ? 'none' : '1px solid var(--lyra-color-border-soft)' }}>
                    {a.cta}
                  </button>
                </div>
              ))}
            </div>
          </InsightStep>
        </div>

        <div style={{ padding: 'var(--space-3) var(--space-4)', borderTop: '1px solid var(--lyra-color-border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
          <span style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-start', font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>
            <Info size={12} style={{ flexShrink: 0, marginTop: 2 }} />
            Root causes are generated from survey responses and send logs. Illustrative for the private preview.
          </span>
          <button type="button" onClick={onOpenProgram} style={{ flexShrink: 0, height: 36, padding: '0 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--lyra-color-border-soft)', background: 'var(--lyra-color-bg-surface-base)', font: `500 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Open program
          </button>
        </div>
      </aside>
    </div>
  )
}

/* Mirrors the MetricRow stat pattern already used in Program Performance (icon chip + uppercase label +
   bold value + delta), so the card reads as the same "stat tile" language as the rest of the page instead
   of its own one-off style. Cards grow to fill the row (no dead space when there are only a few), but never
   shrink below their reading width — once there are enough metrics to not fit, the row scrolls horizontally
   instead of squeezing cards unreadably thin. Every card holds the same shape whether its body is two lines
   or one, so a sparse card (Alerts) never reads as broken next to a fuller one. A card body is at most one
   of: a plain before/after stat (CSAT, ASAT, Alerts — numbers to scan, nothing to interpret), or a single
   cause + action line (a metric with one clear fix). A metric wired to a table filter also gets a small
   jump-to-table link. */
const METRIC_ICON: Record<string, React.ReactNode> = {
  'Response Rate': <Activity size={16} />,
  CSAT: <Smile size={16} />,
  ASAT: <Headphones size={16} />,
  Alerts: <Bell size={16} />,
  Skipped: <UserMinus size={16} />,
  'Partially Responded': <CircleDashed size={16} />,
}

/* A sleeker, lower-chrome take on the same metric card: a slim accent rail instead of a thick wash, the
   number is the hero, the trend reads as a small pill instead of inline text, and cause/action are tagged
   with a tiny uppercase label rather than a bold sentence-starter — closer to a clean ops dashboard. */
function InsightCard({ m, accent, wash }: { m: InsightMetric; accent: string; wash: string }) {
  const isTrend = /^[+-]/.test(m.delta)
  const down = isTrend && isDown(m.delta)
  const [hover, setHover] = useState(false)
  return (
    <div
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        flex: '1 0 240px', minWidth: 240, minHeight: 104, display: 'flex', flexDirection: 'column',
        padding: '12px 14px 10px',
        background: 'var(--lyra-color-bg-surface-base)',
        borderTop: '1px solid var(--lyra-color-border-subtle)', borderRight: '1px solid var(--lyra-color-border-subtle)', borderBottom: '1px solid var(--lyra-color-border-subtle)', borderLeft: `3px solid ${accent}`,
        borderRadius: 'var(--radius-md)',
        boxShadow: hover ? 'var(--sol-effect-shadowmd)' : 'var(--sol-effect-shadowsm)',
        transform: hover ? 'translateY(-1px)' : 'none',
        transition: 'box-shadow .18s ease, transform .18s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 26, height: 26, borderRadius: 'var(--radius-full)', display: 'grid', placeItems: 'center', color: accent, background: wash, flexShrink: 0 }}>
          {METRIC_ICON[m.label] ?? <AlertTriangle size={13} />}
        </span>
        <span style={{ flex: 1, minWidth: 0, font: `500 11px/14px ${FONT}`, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--lyra-color-fg-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.label}</span>
        {isTrend && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 'var(--radius-full)', background: wash, font: `600 12px/16px ${FONT}`, color: accent, whiteSpace: 'nowrap', flexShrink: 0 }}>
            {down ? '↓' : '↑'} {m.delta.replace(/^[+-]/, '')}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 6 }}>
        <b style={{ font: `700 20px/24px ${FONT}`, letterSpacing: '-0.02em', color: 'var(--lyra-color-fg-default)' }}>{m.value}</b>
        {!isTrend && <span style={{ font: `400 13px/18px ${FONT}`, color: 'var(--lyra-color-fg-secondary)', whiteSpace: 'nowrap' }}>{m.delta}</span>}
      </div>
      <div style={{ marginTop: 6, font: `400 13px/19px ${FONT}`, color: 'var(--lyra-color-fg-secondary)', flex: 1 }}>
        {m.stat && <span>{m.stat}</span>}
        {!m.stat && m.cause && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <span style={{ flexShrink: 0, font: `600 10px/16px ${FONT}`, letterSpacing: '0.05em', textTransform: 'uppercase', color: accent }}>Cause</span>
              <span>{m.cause}</span>
            </div>
            {m.action && (
              <div style={{ display: 'flex', gap: 6 }}>
                <span style={{ flexShrink: 0, font: `600 10px/16px ${FONT}`, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--lyra-color-fg-default)' }}>Action</span>
                <span>{m.action}</span>
              </div>
            )}
          </div>
        )}
        {!m.stat && !m.cause && <span>Open each one individually — no single shared cause.</span>}
      </div>
      {m.onAction && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--lyra-color-border-subtle)' }}>
          <button
            type="button" onClick={m.onAction}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', padding: 0, font: `600 13px/18px ${FONT}`, color: 'var(--lyra-color-fg-link)', cursor: 'pointer' }}
          >
            {m.actionLabel} <ArrowRight size={13} />
          </button>
        </div>
      )}
    </div>
  )
}

function InsightBanner({ program, onOpen, onViewAlerts, onViewLowCsat }: { program: typeof PROGRAMS[0]; onOpen?: () => void; onViewAlerts?: () => void; onViewLowCsat?: () => void }) {
  const ins = PROGRAM_INSIGHTS[program.n] ?? GENERIC_INSIGHT(program)
  const attention = ins.kind === 'attention'
  const pending = ins.kind === 'pending'
  const fg = attention ? 'var(--lyra-color-status-critical-strong)' : pending ? 'var(--lyra-color-fg-secondary)' : 'var(--lyra-color-status-info-strong)'
  const [tier, setTier] = useState<'attention' | 'watch'>('attention')

  if (attention) {
    const critical = 'var(--lyra-color-status-critical-strong)'
    const criticalWash = 'var(--lyra-color-status-critical-subtle)'
    const warning = 'var(--lyra-orange-500)'
    const warningWash = 'var(--lyra-color-status-warning-subtle)'
    const problem = ins.problem.map(m => (
      m.label === 'Alerts' && onViewAlerts ? { ...m, onAction: onViewAlerts, actionLabel: 'View alerted interactions' } :
      m.label === 'CSAT' && onViewLowCsat ? { ...m, onAction: onViewLowCsat, actionLabel: 'View low-CSAT interactions' } :
      m
    ))
    const watch = ins.watch ?? []
    const active = tier === 'attention' ? problem : watch
    const activeAccent = tier === 'attention' ? critical : warning
    const activeWash = tier === 'attention' ? criticalWash : warningWash
    return (
      /* Same soft band the dashboard's "Today's highlights" sits on, so the white cards read as one family. */
      <div style={{ background: 'rgba(143,115,227,0.10)', borderRadius: 'var(--radius-lg)', padding: '14px 16px 12px' }}>
        <div style={{ display: 'flex', width: 'fit-content', border: '1px solid var(--lyra-color-border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--lyra-color-bg-surface-base)' }}>
          <button type="button" onClick={() => setTier('attention')} style={{ padding: '4px 16px', font: `500 12px/16px ${FONT}`, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', background: tier === 'attention' ? 'var(--lyra-color-bg-active-subtle)' : 'transparent', color: tier === 'attention' ? 'var(--lyra-color-fg-active-strong)' : 'var(--lyra-color-fg-secondary)', borderRight: '1px solid var(--lyra-color-border-subtle)' }}>
            Need attention <span style={{ fontWeight: 400, opacity: 0.7 }}>{ins.problem.length}</span>
          </button>
          {watch.length > 0 && (
            <button type="button" onClick={() => setTier('watch')} style={{ padding: '4px 16px', font: `500 12px/16px ${FONT}`, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', background: tier === 'watch' ? 'var(--lyra-color-bg-active-subtle)' : 'transparent', color: tier === 'watch' ? 'var(--lyra-color-fg-active-strong)' : 'var(--lyra-color-fg-secondary)' }}>
              To watch <span style={{ fontWeight: 400, opacity: 0.7 }}>{watch.length}</span>
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)', overflowX: 'auto' }}>
          {active.map(m => <InsightCard key={m.label} m={m} accent={activeAccent} wash={activeWash} />)}
        </div>
      </div>
    )
  }

  const cols: [React.ReactNode, string, string][] = pending
    ? [
        [<Hourglass size={14} />, 'What we know so far', ins.problem.map(m => `${m.label} ${m.value} (${m.delta})`).join(' · ')],
        [<Search size={14} />, 'Likely root cause', `Needs ${ins.dataProgress?.needed ?? 7} days — ${ins.dataProgress?.collected ?? 0} collected so far`],
      ]
    : [
        [<Activity size={14} />, 'What to watch', ins.problem.map(m => `${m.label} ${m.value} (${m.delta})`).join(' · ')],
        [<Search size={14} />, 'Likely root cause', ins.causes[0].title],
        [<Wrench size={14} />, 'Call to action', ins.actions[0].title],
      ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)', background: pending ? 'var(--lyra-slate-100)' : 'var(--lyra-color-status-info-subtle)', border: `1px solid ${pending ? 'var(--lyra-color-border-soft)' : 'var(--lyra-color-status-info-medium)'}` }}>
      <span style={{ width: 36, height: 36, borderRadius: 'var(--radius-full)', display: 'grid', placeItems: 'center', background: 'var(--lyra-color-bg-surface-base)', color: fg }}>{pending ? <Hourglass size={18} /> : <Lightbulb size={18} />}</span>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols.length}, minmax(0, 1fr))`, gap: 'var(--space-4)', minWidth: 0 }}>
        {cols.map(([icon, label, text]) => (
          <div key={label} style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, font: `500 12px/16px ${FONT}`, letterSpacing: '0.06em', textTransform: 'uppercase', color: fg }}>{icon}{label}</div>
            <div style={{ font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)', marginTop: 2 }}>{text}</div>
          </div>
        ))}
      </div>
      <button type="button" onClick={onOpen} style={{ height: 36, padding: '0 16px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--lyra-color-bg-primary)', font: `500 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-on-primary)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
        See full analysis
      </button>
    </div>
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

const PROGRAM_COLUMNS: { label: string; key: string }[] = [
  { label: 'Program Name', key: 'n' },
  { label: 'Status', key: 'status' },
  { label: 'Eligible', key: 'elig' },
  { label: 'Coverage', key: 'coverage' },
  { label: 'Surveys Sent', key: 'sent' },
  { label: 'Response Rate', key: 'responseRate' },
  { label: 'Responses Rec.', key: 'rec' },
  { label: 'Completion Rate', key: 'completionRate' },
  { label: 'Completed', key: 'comp' },
  { label: 'Partial', key: 'partial' },
  { label: 'CSAT', key: 'csat' },
  { label: 'ASAT', key: 'asat' },
  { label: 'Alerts', key: 'alerts' },
]

const CHANNEL_COLUMNS: { label: string; key: string }[] = [
  { label: 'Channel', key: 'channel' },
  { label: 'Eligible', key: 'elig' },
  { label: 'Coverage', key: 'coverage' },
  { label: 'Surveys Sent', key: 'sent' },
  { label: 'Response Rate', key: 'responseRate' },
  { label: 'Responses Rec.', key: 'rec' },
  { label: 'Completion Rate', key: 'completionRate' },
  { label: 'Completed', key: 'comp' },
  { label: 'Partial', key: 'partial' },
  { label: 'CSAT', key: 'csat' },
  { label: 'ASAT', key: 'asat' },
  { label: 'Alerts', key: 'alerts' },
]

const CHANNEL_DATA = [
  { channel: 'SMS', elig: 2745, coverage: 89, sent: 2452, responseRate: 66, rec: 1618, completionRate: 70, comp: 1133, partial: 485, csat: 78, asat: 82, alerts: 10 },
  { channel: 'WhatsApp', elig: 1590, coverage: 88, sent: 1395, responseRate: 60, rec: 837, completionRate: 65, comp: 545, partial: 292, csat: 77, asat: 80, alerts: 6 },
  { channel: 'Email', elig: 2890, coverage: 87, sent: 2507, responseRate: 39, rec: 977, completionRate: 58, comp: 567, partial: 410, csat: 72, asat: 79, alerts: 11 },
]

/* Which programs deliver on each channel, and each one's slice of that channel's volume. Eligible/sent/
   responses/completed/partial/alerts sum exactly to the matching CHANNEL_DATA row above — expanding a
   channel should never show numbers that don't add back up to the total it's a breakdown of. */
const CHANNEL_PROGRAMS: Record<string, { name: string; elig: number; sent: number; rec: number; comp: number; partial: number; csat: number; asat: number; alerts: number }[]> = {
  SMS: [
    { name: 'Complaint Resolution Follow-Up', elig: 2745, sent: 2452, rec: 1618, comp: 1133, partial: 485, csat: 78, asat: 82, alerts: 10 },
  ],
  WhatsApp: [
    { name: 'Flight Disruption Recovery', elig: 800, sent: 702, rec: 421, comp: 274, partial: 147, csat: 79, asat: 82, alerts: 3 },
    { name: 'Omnichannel Escalation Recovery', elig: 498, sent: 437, rec: 262, comp: 171, partial: 91, csat: 76, asat: 79, alerts: 2 },
    { name: 'Product Feedback - Beta Testers', elig: 292, sent: 256, rec: 154, comp: 100, partial: 54, csat: 74, asat: 78, alerts: 1 },
  ],
  Email: [
    { name: 'Billing and Refund Recovery · All Digital', elig: 2890, sent: 2507, rec: 977, comp: 567, partial: 410, csat: 72, asat: 79, alerts: 11 },
  ],
}

const TOPIC_COLUMNS: { label: string; key: string }[] = [
  { label: 'Topic', key: 'topic' },
  { label: 'Eligible', key: 'elig' },
  { label: 'Coverage', key: 'coverage' },
  { label: 'Surveys Sent', key: 'sent' },
  { label: 'Response Rate', key: 'responseRate' },
  { label: 'Responses Rec.', key: 'rec' },
  { label: 'Completion Rate', key: 'completionRate' },
  { label: 'Completed', key: 'comp' },
  { label: 'Partial', key: 'partial' },
  { label: 'CSAT', key: 'csat' },
  { label: 'ASAT', key: 'asat' },
  { label: 'Alerts', key: 'alerts' },
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
  { topic: 'Other topics', elig: 2458, coverage: 85, sent: 2089, responseRate: 48, rec: 999, completionRate: 57, comp: 565, partial: 434, csat: 75, asat: 81, alerts: 1 },
]

/* Which programs raised each topic, and each one's slice of that topic's volume. A program can — and
   often does — show up under more than one topic (the same team handles several issue types), and a
   topic can be raised across more than one program; every child row's numbers still sum exactly to the
   matching TOPIC_DATA row above. */
type TopicProgramSlice = { name: string; elig: number; sent: number; rec: number; comp: number; partial: number; csat: number; asat: number; alerts: number }
const TOPIC_PROGRAMS: Record<string, TopicProgramSlice[]> = {
  'Service Outage': [
    { name: 'Complaint Resolution Follow-Up', elig: 1192, sent: 1077, rec: 475, comp: 269, partial: 206, csat: 74, asat: 79, alerts: 6 },
  ],
  'Rebooking': [
    { name: 'Flight Disruption Recovery', elig: 816, sent: 702, rec: 459, comp: 338, partial: 121, csat: 81, asat: 84, alerts: 4 },
  ],
  'Refund Processing': [
    { name: 'Complaint Resolution Follow-Up', elig: 269, sent: 238, rec: 136, comp: 94, partial: 42, csat: 68, asat: 74, alerts: 2 },
    { name: 'Billing and Refund Recovery · All Digital', elig: 375, sent: 332, rec: 189, comp: 131, partial: 58, csat: 76, asat: 81, alerts: 2 },
  ],
  'Delivery Delay': [
    { name: 'Flight Disruption Recovery', elig: 619, sent: 533, rec: 339, comp: 255, partial: 84, csat: 78, asat: 83, alerts: 2 },
  ],
  'Technical Troubleshooting': [
    { name: 'Complaint Resolution Follow-Up', elig: 571, sent: 533, rec: 323, comp: 237, partial: 86, csat: 70, asat: 76, alerts: 3 },
  ],
  'Billing Dispute': [
    { name: 'Complaint Resolution Follow-Up', elig: 180, sent: 168, rec: 121, comp: 94, partial: 27, csat: 75, asat: 80, alerts: 1 },
    { name: 'Billing and Refund Recovery · All Digital', elig: 252, sent: 234, rec: 168, comp: 131, partial: 37, csat: 84, asat: 89, alerts: 1 },
  ],
  'Account Access': [
    { name: 'Complaint Resolution Follow-Up', elig: 272, sent: 258, rec: 132, comp: 78, partial: 54, csat: 70, asat: 77, alerts: 4 },
  ],
  'Bot Transfer Friction': [
    { name: 'Omnichannel Escalation Recovery', elig: 221, sent: 190, rec: 91, comp: 53, partial: 38, csat: 86, asat: 88, alerts: 1 },
  ],
  'Other topics': [
    { name: 'Complaint Resolution Follow-Up', elig: 376, sent: 319, rec: 153, comp: 86, partial: 66, csat: 55, asat: 68, alerts: 0 },
    { name: 'Flight Disruption Recovery', elig: 783, sent: 666, rec: 319, comp: 180, partial: 138, csat: 84, asat: 89, alerts: 1 },
    { name: 'Billing and Refund Recovery · All Digital', elig: 524, sent: 446, rec: 213, comp: 121, partial: 93, csat: 76, asat: 81, alerts: 0 },
    { name: 'Omnichannel Escalation Recovery', elig: 488, sent: 415, rec: 198, comp: 112, partial: 86, csat: 75, asat: 80, alerts: 0 },
    { name: 'Product Feedback - Beta Testers', elig: 287, sent: 243, rec: 116, comp: 66, partial: 51, csat: 72, asat: 77, alerts: 0 },
  ],
}

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

function GreyBadge({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: 'var(--radius-sm)',
      background: 'var(--lyra-slate-200)',
      font: `400 14px/18px ${FONT}`,
      color: 'var(--lyra-color-fg-default)',
    }}>
      {children}
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

/* ── Sortable table headers ── */
type SortDir = 'asc' | 'desc'
type SortState = { key: string; dir: SortDir } | null

function compareValues(a: unknown, b: unknown, dir: SortDir) {
  const cmp = typeof a === 'string' && typeof b === 'string'
    ? a.localeCompare(b)
    : (a as number) - (b as number)
  return dir === 'asc' ? cmp : -cmp
}

function sortRows<T extends Record<string, unknown>>(rows: T[], sort: SortState) {
  if (!sort) return rows
  return [...rows].sort((a, b) => compareValues(a[sort.key], b[sort.key], sort.dir))
}

function SortableTh({ label, sortKey, sort, onSort, padding }: { label: string; sortKey: string; sort: SortState; onSort: (key: string) => void; padding: string }) {
  const active = sort?.key === sortKey
  return (
    <th
      scope="col"
      onClick={() => onSort(sortKey)}
      style={{
        padding,
        textAlign: 'left',
        font: `400 14px/20px ${FONT}`,
        color: active ? 'var(--lyra-color-fg-default)' : 'var(--lyra-color-fg-secondary)',
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {label}
        <ChevronDown
          size={14}
          style={{
            color: active ? 'var(--lyra-color-fg-default)' : 'var(--lyra-color-fg-disabled)',
            transform: active && sort.dir === 'asc' ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s',
            flexShrink: 0,
          }}
        />
      </span>
    </th>
  )
}

/* ── Programs Table ── */
function ProgramsTable({ programs, searchQuery, onSelectProgram, onOpenInsight }: { programs: typeof PROGRAMS; searchQuery: string; onSelectProgram: (p: typeof PROGRAMS[0]) => void; onOpenInsight: (p: typeof PROGRAMS[0]) => void }) {
  const [groupBy, setGroupBy] = useState<'Program' | 'Channel' | 'Topic'>('Program')
  const [expandedChannel, setExpandedChannel] = useState<string | null>(null)
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null)
  const goToProgram = (name: string) => {
    const prog = programs.find(pr => pr.n === name)
    if (prog) onSelectProgram(prog)
  }
  const [sort, setSort] = useState<SortState>(null)
  const handleSort = (key: string) => setSort(s => s?.key === key ? (s.dir === 'desc' ? { key, dir: 'asc' } : null) : { key, dir: 'desc' })
  const q = searchQuery.trim().toLowerCase()
  const filtered = programs.filter(p => p.n.toLowerCase().includes(q))
  const programRows = sortRows(filtered.map(p => ({
    ...p,
    status: p.tags.find(t => t === 'Active' || t === 'Inactive') || '',
    coverage: pct(p.sent, p.elig),
    responseRate: pct(p.rec, p.sent),
    completionRate: pct(p.comp, p.rec),
    partial: p.rec - p.comp,
  })), sort)

  return (
    <div style={{ background: 'var(--lyra-color-bg-surface-base)', border: '1px solid var(--lyra-color-border-subtle)', borderRadius: 'var(--radius-lg)' }}>
      <div style={{ padding: 'var(--space-5) var(--space-6)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--lyra-color-border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <h3 style={{ font: `600 18px/24px ${FONT}`, letterSpacing: '-0.01em', margin: 0, color: 'var(--lyra-color-fg-default)' }}>
            Programs{groupBy !== 'Program' ? `: grouped by ${groupBy.toLowerCase()}` : ''}
          </h3>
          {groupBy === 'Program' && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              minWidth: 22, height: 22, padding: '0 var(--space-2)',
              borderRadius: 'var(--radius-full)',
              background: 'var(--lyra-slate-100)',
              color: 'var(--lyra-slate-600)',
              font: `500 12px/16px ${FONT}`,
            }}>
              {filtered.length}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <span style={{ font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>Group by</span>
          <div style={{ display: 'flex', border: '1px solid var(--lyra-color-border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            {(['Program', 'Channel', 'Topic'] as const).map((g, i) => (
              <button
                key={g}
                onClick={() => { setGroupBy(g); setSort(null); setExpandedChannel(null); setExpandedTopic(null) }}
                style={{
                  padding: '6px 16px', font: `500 14px/20px ${FONT}`, borderTop: 'none', borderBottom: 'none', borderLeft: 'none', cursor: 'pointer',
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
        <div style={{ overflowX: 'auto', overflowY: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--lyra-color-border-subtle)' }}>
                {CHANNEL_COLUMNS.map(col => (
                  <SortableTh
                    key={col.label}
                    label={col.label}
                    sortKey={col.key}
                    sort={sort}
                    onSort={handleSort}
                    padding={`var(--space-3) var(--space-3) var(--space-3) ${col.label === 'Channel' ? 'var(--space-6)' : 'var(--space-3)'}`}
                  />
                ))}
              </tr>
            </thead>
            <tbody>
              {sortRows(CHANNEL_DATA, sort).map(c => {
                const isOpen = expandedChannel === c.channel
                const children = CHANNEL_PROGRAMS[c.channel] ?? []
                return (
                  <Fragment key={c.channel}>
                    <tr
                      role="button" tabIndex={0} aria-expanded={isOpen}
                      style={{ borderBottom: '1px solid var(--lyra-color-border-subtle)', cursor: 'pointer' }}
                      onClick={() => setExpandedChannel(isOpen ? null : c.channel)}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandedChannel(isOpen ? null : c.channel) } }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--lyra-color-state-bg-hover-opacity)' }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = '' }}
                    >
                      <td style={{ padding: 'var(--space-3) var(--space-3) var(--space-3) var(--space-6)', font: `500 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <ChevronDown size={14} style={{ color: 'var(--lyra-color-fg-secondary)', transform: isOpen ? 'none' : 'rotate(-90deg)', transition: 'transform 0.15s', flexShrink: 0 }} />
                          {c.channel}
                        </span>
                      </td>
                      <td style={{ padding: 'var(--space-3)', font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)', whiteSpace: 'nowrap' }}>
                        {fmt(c.elig)}
                      </td>
                      <td style={{ padding: 'var(--space-3)', whiteSpace: 'nowrap' }}>
                        <GreyBadge>{c.coverage}%</GreyBadge>
                      </td>
                      <td style={{ padding: 'var(--space-3)', font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)', whiteSpace: 'nowrap' }}>
                        {fmt(c.sent)}
                      </td>
                      <td style={{ padding: 'var(--space-3)', whiteSpace: 'nowrap' }}>
                        <GreyBadge>{c.responseRate}%</GreyBadge>
                      </td>
                      <td style={{ padding: 'var(--space-3)', font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)', whiteSpace: 'nowrap' }}>
                        {fmt(c.rec)}
                      </td>
                      <td style={{ padding: 'var(--space-3)', whiteSpace: 'nowrap' }}>
                        <GreyBadge>{c.completionRate}%</GreyBadge>
                      </td>
                      <td style={{ padding: 'var(--space-3)', font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)', whiteSpace: 'nowrap' }}>
                        {fmt(c.comp)}
                      </td>
                      <td style={{ padding: 'var(--space-3)', font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)', whiteSpace: 'nowrap' }}>
                        {fmt(c.partial)}
                      </td>
                      <td style={{ padding: 'var(--space-3)', whiteSpace: 'nowrap' }}>
                        <GreyBadge>{c.csat}%</GreyBadge>
                      </td>
                      <td style={{ padding: 'var(--space-3)', whiteSpace: 'nowrap' }}>
                        <GreyBadge>{c.asat}%</GreyBadge>
                      </td>
                      <td style={{ padding: 'var(--space-3)', font: `600 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)', whiteSpace: 'nowrap' }}>
                        {c.alerts}
                      </td>
                    </tr>
                    {isOpen && children.map(p => (
                      <tr key={p.name} style={{ borderBottom: '1px solid var(--lyra-color-border-subtle)', background: 'var(--lyra-color-bg-surface-canvas)' }}>
                        <td style={{ padding: 'var(--space-3) var(--space-3) var(--space-3) calc(var(--space-6) + 20px)', whiteSpace: 'nowrap' }}>
                          <span onClick={() => goToProgram(p.name)} style={{ font: `500 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-link)', cursor: 'pointer' }}>{p.name}</span>
                        </td>
                        <td style={{ padding: 'var(--space-3)', font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)', whiteSpace: 'nowrap' }}>
                          {fmt(p.elig)}
                        </td>
                        <td style={{ padding: 'var(--space-3)', whiteSpace: 'nowrap' }}>
                          <GreyBadge>{pct(p.sent, p.elig)}%</GreyBadge>
                        </td>
                        <td style={{ padding: 'var(--space-3)', font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)', whiteSpace: 'nowrap' }}>
                          {fmt(p.sent)}
                        </td>
                        <td style={{ padding: 'var(--space-3)', whiteSpace: 'nowrap' }}>
                          <GreyBadge>{pct(p.rec, p.sent)}%</GreyBadge>
                        </td>
                        <td style={{ padding: 'var(--space-3)', font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)', whiteSpace: 'nowrap' }}>
                          {fmt(p.rec)}
                        </td>
                        <td style={{ padding: 'var(--space-3)', whiteSpace: 'nowrap' }}>
                          <GreyBadge>{pct(p.comp, p.rec)}%</GreyBadge>
                        </td>
                        <td style={{ padding: 'var(--space-3)', font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)', whiteSpace: 'nowrap' }}>
                          {fmt(p.comp)}
                        </td>
                        <td style={{ padding: 'var(--space-3)', font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)', whiteSpace: 'nowrap' }}>
                          {fmt(p.partial)}
                        </td>
                        <td style={{ padding: 'var(--space-3)', whiteSpace: 'nowrap' }}>
                          <GreyBadge>{p.csat}%</GreyBadge>
                        </td>
                        <td style={{ padding: 'var(--space-3)', whiteSpace: 'nowrap' }}>
                          <GreyBadge>{p.asat}%</GreyBadge>
                        </td>
                        <td style={{ padding: 'var(--space-3)', font: `600 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)', whiteSpace: 'nowrap' }}>
                          {p.alerts}
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : groupBy === 'Topic' ? (
        <div style={{ overflowX: 'auto', overflowY: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--lyra-color-border-subtle)' }}>
                {TOPIC_COLUMNS.map(col => (
                  <SortableTh
                    key={col.label}
                    label={col.label}
                    sortKey={col.key}
                    sort={sort}
                    onSort={handleSort}
                    padding={`var(--space-3) var(--space-3) var(--space-3) ${col.label === 'Topic' ? 'var(--space-6)' : 'var(--space-3)'}`}
                  />
                ))}
              </tr>
            </thead>
            <tbody>
              {sortRows(TOPIC_DATA, sort).map(t => {
                const isOpen = expandedTopic === t.topic
                const children = TOPIC_PROGRAMS[t.topic] ?? []
                return (
                  <Fragment key={t.topic}>
                    <tr
                      role="button" tabIndex={0} aria-expanded={isOpen}
                      style={{ borderBottom: '1px solid var(--lyra-color-border-subtle)', cursor: 'pointer' }}
                      onClick={() => setExpandedTopic(isOpen ? null : t.topic)}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandedTopic(isOpen ? null : t.topic) } }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--lyra-color-state-bg-hover-opacity)' }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = '' }}
                    >
                      <td style={{ padding: 'var(--space-3) var(--space-3) var(--space-3) var(--space-6)', font: `500 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <ChevronDown size={14} style={{ color: 'var(--lyra-color-fg-secondary)', transform: isOpen ? 'none' : 'rotate(-90deg)', transition: 'transform 0.15s', flexShrink: 0 }} />
                          {t.topic}
                        </span>
                      </td>
                      <td style={{ padding: 'var(--space-3)', font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)', whiteSpace: 'nowrap' }}>
                        {fmt(t.elig)}
                      </td>
                      <td style={{ padding: 'var(--space-3)', whiteSpace: 'nowrap' }}>
                        <GreyBadge>{t.coverage}%</GreyBadge>
                      </td>
                      <td style={{ padding: 'var(--space-3)', font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)', whiteSpace: 'nowrap' }}>
                        {fmt(t.sent)}
                      </td>
                      <td style={{ padding: 'var(--space-3)', whiteSpace: 'nowrap' }}>
                        <GreyBadge>{t.responseRate}%</GreyBadge>
                      </td>
                      <td style={{ padding: 'var(--space-3)', font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)', whiteSpace: 'nowrap' }}>
                        {fmt(t.rec)}
                      </td>
                      <td style={{ padding: 'var(--space-3)', whiteSpace: 'nowrap' }}>
                        <GreyBadge>{t.completionRate}%</GreyBadge>
                      </td>
                      <td style={{ padding: 'var(--space-3)', font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)', whiteSpace: 'nowrap' }}>
                        {fmt(t.comp)}
                      </td>
                      <td style={{ padding: 'var(--space-3)', font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)', whiteSpace: 'nowrap' }}>
                        {fmt(t.partial)}
                      </td>
                      <td style={{ padding: 'var(--space-3)', whiteSpace: 'nowrap' }}>
                        <GreyBadge>{t.csat}%</GreyBadge>
                      </td>
                      <td style={{ padding: 'var(--space-3)', whiteSpace: 'nowrap' }}>
                        <GreyBadge>{t.asat}%</GreyBadge>
                      </td>
                      <td style={{ padding: 'var(--space-3)', font: `600 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)', whiteSpace: 'nowrap' }}>
                        {t.alerts}
                      </td>
                    </tr>
                    {isOpen && children.map(p => (
                      <tr key={p.name} style={{ borderBottom: '1px solid var(--lyra-color-border-subtle)', background: 'var(--lyra-color-bg-surface-canvas)' }}>
                        <td style={{ padding: 'var(--space-3) var(--space-3) var(--space-3) calc(var(--space-6) + 20px)', whiteSpace: 'nowrap' }}>
                          <span onClick={() => goToProgram(p.name)} style={{ font: `500 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-link)', cursor: 'pointer' }}>{p.name}</span>
                        </td>
                        <td style={{ padding: 'var(--space-3)', font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)', whiteSpace: 'nowrap' }}>
                          {fmt(p.elig)}
                        </td>
                        <td style={{ padding: 'var(--space-3)', whiteSpace: 'nowrap' }}>
                          <GreyBadge>{pct(p.sent, p.elig)}%</GreyBadge>
                        </td>
                        <td style={{ padding: 'var(--space-3)', font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)', whiteSpace: 'nowrap' }}>
                          {fmt(p.sent)}
                        </td>
                        <td style={{ padding: 'var(--space-3)', whiteSpace: 'nowrap' }}>
                          <GreyBadge>{pct(p.rec, p.sent)}%</GreyBadge>
                        </td>
                        <td style={{ padding: 'var(--space-3)', font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)', whiteSpace: 'nowrap' }}>
                          {fmt(p.rec)}
                        </td>
                        <td style={{ padding: 'var(--space-3)', whiteSpace: 'nowrap' }}>
                          <GreyBadge>{pct(p.comp, p.rec)}%</GreyBadge>
                        </td>
                        <td style={{ padding: 'var(--space-3)', font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)', whiteSpace: 'nowrap' }}>
                          {fmt(p.comp)}
                        </td>
                        <td style={{ padding: 'var(--space-3)', font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)', whiteSpace: 'nowrap' }}>
                          {fmt(p.partial)}
                        </td>
                        <td style={{ padding: 'var(--space-3)', whiteSpace: 'nowrap' }}>
                          <GreyBadge>{p.csat}%</GreyBadge>
                        </td>
                        <td style={{ padding: 'var(--space-3)', whiteSpace: 'nowrap' }}>
                          <GreyBadge>{p.asat}%</GreyBadge>
                        </td>
                        <td style={{ padding: 'var(--space-3)', font: `600 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)', whiteSpace: 'nowrap' }}>
                          {p.alerts}
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
          <div style={{ padding: 'var(--space-3) var(--space-4)', font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-secondary)', fontStyle: 'italic' }}>
            Each interaction is counted once, against its primary topic.
          </div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', overflowY: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--lyra-color-border-subtle)' }}>
                {PROGRAM_COLUMNS.map(col => (
                  <SortableTh
                    key={col.label}
                    label={col.label}
                    sortKey={col.key}
                    sort={sort}
                    onSort={handleSort}
                    padding={`var(--space-3) var(--space-3) var(--space-3) ${col.label === 'Program Name' ? 'var(--space-6)' : 'var(--space-3)'}`}
                  />
                ))}
              </tr>
            </thead>
            <tbody>
              {programRows.length === 0 ? (
                <tr>
                  <td colSpan={PROGRAM_COLUMNS.length} style={{ padding: '24px 16px', color: 'var(--lyra-color-fg-secondary)' }}>
                    No programs match the selected filters.
                  </td>
                </tr>
              ) : (
                programRows.map(p => {
                  const { partial, status } = p
                  return (
                    <tr
                      key={p.n}
                      style={{ borderBottom: '1px solid var(--lyra-color-border-subtle)', cursor: 'pointer', transition: 'background-color 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--lyra-color-state-bg-hover-opacity)' }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = '' }}
                    >
                      <td style={{ padding: 'var(--space-3) var(--space-3) var(--space-3) var(--space-6)', whiteSpace: 'nowrap' }}>
                        <span
                          onClick={() => onSelectProgram(p)}
                          style={{ font: `500 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-link)', cursor: 'pointer' }}
                        >
                          {p.n}
                        </span>
                      </td>
                      <td style={{ padding: 'var(--space-3)', whiteSpace: 'nowrap' }}>
                        {status && <StatusPill status={status} />}
                      </td>
                      <td style={{ padding: 'var(--space-3)', font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)', whiteSpace: 'nowrap' }}>
                        {fmt(p.elig)}
                      </td>
                      <td style={{ padding: 'var(--space-3)', whiteSpace: 'nowrap' }}>
                        <GreyBadge>{pct(p.sent, p.elig)}%</GreyBadge>
                      </td>
                      <td style={{ padding: 'var(--space-3)', font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)', whiteSpace: 'nowrap' }}>
                        {fmt(p.sent)}
                      </td>
                      <td style={{ padding: 'var(--space-3)', whiteSpace: 'nowrap' }}>
                        <GreyBadge>{pct(p.rec, p.sent)}%</GreyBadge>
                      </td>
                      <td style={{ padding: 'var(--space-3)', font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)', whiteSpace: 'nowrap' }}>
                        {fmt(p.rec)}
                      </td>
                      <td style={{ padding: 'var(--space-3)', whiteSpace: 'nowrap' }}>
                        <GreyBadge>{pct(p.comp, p.rec)}%</GreyBadge>
                      </td>
                      <td style={{ padding: 'var(--space-3)', font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)', whiteSpace: 'nowrap' }}>
                        {fmt(p.comp)}
                      </td>
                      <td style={{ padding: 'var(--space-3)', font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)', whiteSpace: 'nowrap' }}>
                        {fmt(partial)}
                      </td>
                      <td style={{ padding: 'var(--space-3)', whiteSpace: 'nowrap' }}>
                        <GreyBadge>{p.csat}%</GreyBadge>
                      </td>
                      <td style={{ padding: 'var(--space-3)', whiteSpace: 'nowrap' }}>
                        <GreyBadge>{p.asat}%</GreyBadge>
                      </td>
                      <td style={{ padding: 'var(--space-3)', font: `600 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)', whiteSpace: 'nowrap' }}>
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
  'Complaint Resolution Follow-Up': { total: '+10%', elig: '+5%', sent: '+3%', rec: '-9%', comp: '-11%', part: '+4%', csat: '-6%', asat: '-3%', alerts: '+18%' },
  'Flight Disruption Recovery': { total: '+12%', elig: '+9%', sent: '+5%', rec: '+6%', comp: '+8%', part: '-3%', csat: '+2%', asat: '+2%', alerts: '-5%' },
  'Billing and Refund Recovery · All Digital': { total: '+7%', elig: '+6%', sent: '+4%', rec: '+3%', comp: '+5%', part: '-2%', csat: '+1%', asat: '+1%', alerts: '-4%' },
  'Omnichannel Escalation Recovery': { total: '+9%', elig: '+7%', sent: '+3%', rec: '+4%', comp: '+6%', part: '-1%', csat: '+2%', asat: '+1%', alerts: '-3%' },
  'Product Feedback - Beta Testers': { total: '+4%', elig: '+3%', sent: '-13%', rec: '-2%', comp: '-2%', part: '-1%', csat: '+1%', asat: '+1%', alerts: '0%' },
}

type ResponseRow = { customer: string; id: string; agent: string; topic: string | null; sent: string | null; response: string | null; completed: string | null; csat: number | null; asat: number | null; status: string }

/* Bulk "awaiting response" rows so every program/tab can show a full page (PAGE_SIZE) of real rows,
   not just the handful of hand-written showcase interactions. Each curated row above keeps its own
   full narrative in CUSTOMER_DETAILS; these filler rows get a generic detail built on the fly from
   their own fields (see genericDetailFor), so nothing needs a matching hand-authored entry. */
const FILLER_FIRST_NAMES = ['Caleb', 'Harriet', 'Youssef', 'Freya', 'Arjun', 'Lucia', 'Oscar', 'Naledi', 'Pavel', 'Aaliyah', 'Dmitri', 'Chiara', 'Kwabena', 'Miriam', 'Takeshi', 'Esperanza', 'Callum', 'Zanele', 'Ravi', 'Nadia', 'Connor', 'Amara', 'Soren', 'Leilani', 'Mateus', 'Ingrid', 'Tomasz', 'Fatou', 'Bashir', 'Elin', 'Hugo', 'Beatriz', 'Niamh', 'Sanjay', 'Odalys', 'Viktor', 'Thandiwe', 'Emeka', 'Asel', 'Rowan']
const FILLER_LAST_NAMES = ['Nguyen', 'Boyle', 'Nasser', 'Solberg', 'Mehta', 'Fernandez', 'Lindqvist', 'Dube', 'Novak', 'Brooks', 'Orlov', 'Rossi', 'Asante', 'Cohen', 'Mori', 'Ruiz', 'Reid', 'Mokoena', 'Subramaniam', 'Hassan', 'Walsh', 'Chukwu', 'Madsen', 'Kahale', 'Pereira', 'Haugen', 'Kaminski', 'Diallo', 'Rahimi', 'Andersson', 'Park', 'Oliveira', 'Flynn', 'Patel', 'Zimmer', 'Petrov', 'Nkomo', 'Obi', 'Bekova', 'Sinclair']

const TOPIC_QUESTIONS: Record<string, string> = {
  'Technical Troubleshooting': 'How would you rate how we handled your technical troubleshooting today?',
  'Refund Processing': 'How would you rate how we handled your refund today?',
  'Service Outage': 'How would you rate how we handled the service outage today?',
  'Billing Dispute': 'How would you rate how we handled your billing dispute today?',
  'Account Access': 'How would you rate how we handled your account access issue today?',
  'Rebooking': 'How would you rate how we handled your rebooking today?',
  'Delay Notification': 'How would you rate the way we kept you informed about your delay?',
  'Compensation Claim': 'How would you rate the help you got filing your compensation claim?',
  'Missed Connection': 'How would you rate how we handled your missed connection?',
  'Baggage Delay': 'How would you rate the help you got with your delayed bag?',
  'Hotel Voucher': 'How would you rate the hotel arrangements we made for you?',
  'Duplicate Charge': 'How would you rate the way we fixed the duplicate charge?',
  'Partial Refund': 'How would you rate how we handled your refund today?',
  'Subscription Cancellation': 'How would you rate the cancellation process today?',
  'Payment Failure': 'How would you rate the help you got with the failed payment?',
  'Invoice Correction': 'How would you rate how we corrected your invoice?',
  'Channel Hand-off': 'How would you rate the hand-over from chat to a phone call today?',
  'Repeat Contact': 'How would you rate how we handled your issue this time?',
  'Callback Not Received': 'How would you rate the callback we promised you?',
  'Supervisor Escalation': 'How would you rate the way your case was escalated today?',
  'Bot Transfer Friction': 'How would you rate getting from the assistant to a person today?',
  'Case Reopened': 'How would you rate how we handled your reopened case?',
  'Mobile App Sync': 'How would you rate your experience with mobile sync in the beta?',
  'Onboarding Flow': 'How would you rate getting started with the beta?',
  'Dashboard Export': 'How would you rate exporting your dashboard in the beta?',
  'Notification Settings': 'How would you rate managing your notifications in the beta?',
  'Data Import': 'How would you rate importing your data into the beta?',
  'Feature Request': 'How would you rate the response to your feature request?',
  'Bug Report': 'How would you rate how we handled your bug report?',
}

/* One-line context for each topic category, shown under the topic name in the drawer so a reader
   understands what kind of case this was without having to infer it from the name alone. */
const TOPIC_DESCRIPTIONS: Record<string, string> = {
  'Technical Troubleshooting': 'Customer had a device, app, or connectivity problem that needed step-by-step fixing.',
  'Refund Processing': 'Customer was owed money back and the case tracked whether the refund amount and timing were clear.',
  'Service Outage': 'A known outage affected the customer, and the case tracked how well we kept them informed.',
  'Billing Dispute': 'Customer disputed a charge on their account and the case tracked how it was resolved.',
  'Account Access': 'Customer was locked out of their account and needed help signing back in.',
  'Rebooking': 'Customer needed to be moved onto a new flight or itinerary after a disruption.',
  'Delay Notification': 'Customer needed timely updates about a delay affecting their travel.',
  'Compensation Claim': 'Customer filed a claim for compensation tied to a service disruption.',
  'Missed Connection': 'Customer missed a connecting flight and needed help rebooking or compensation.',
  'Baggage Delay': 'Customer’s bag was delayed and the case tracked how it was handled.',
  'Hotel Voucher': 'Customer needed overnight accommodation arranged because of a disruption.',
  'Duplicate Charge': 'Customer was charged twice for the same transaction and needed a fix.',
  'Partial Refund': 'Customer received only part of an expected refund and questioned the amount.',
  'Subscription Cancellation': 'Customer wanted to cancel a recurring subscription or plan.',
  'Payment Failure': 'A payment did not go through and the customer needed help completing it.',
  'Invoice Correction': 'Customer spotted an error on an invoice that needed correcting.',
  'Channel Hand-off': 'The conversation moved from chat to a phone call partway through.',
  'Repeat Contact': 'Customer had contacted us again about an issue that wasn’t fully resolved the first time.',
  'Callback Not Received': 'Customer was promised a callback that didn’t happen on time.',
  'Supervisor Escalation': 'The case was escalated to a supervisor before it could be closed.',
  'Bot Transfer Friction': 'Customer had difficulty getting from the automated assistant to a live person.',
  'Case Reopened': 'A previously closed case had to be reopened for the same issue.',
  'Mobile App Sync': 'Customer hit a sync issue between the mobile app and their account data.',
  'Onboarding Flow': 'Customer was getting started with the beta and needed onboarding help.',
  'Dashboard Export': 'Customer ran into trouble exporting data from their dashboard.',
  'Notification Settings': 'Customer needed help managing their notification preferences.',
  'Data Import': 'Customer was importing existing data into the product.',
  'Feature Request': 'Customer suggested a new feature or improvement.',
  'Bug Report': 'Customer reported something in the product that wasn’t working as expected.',
}

/* Deterministic pseudo-random int in [0, max) from a string seed, so filler rows stay stable across renders. */
function seededIndex(seed: string, max: number) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return h % max
}

/* Interaction IDs display as UUIDs (e.g. "c74eaf29-bb68-4706-af2a-828c2daa9962") without actually
   renaming the underlying id field everything else keys off of — this hashes each row's existing id
   into a stable, unique-looking UUID purely for display. */
function pseudoUuid(seed: string): string {
  let state = 0
  for (let i = 0; i < seed.length; i++) state = (state * 31 + seed.charCodeAt(i)) >>> 0
  let hex = ''
  for (let round = 0; round < 4; round++) {
    state = (state * 1103515245 + 12345 + round) >>> 0
    hex += state.toString(16).padStart(8, '0')
  }
  const variant = ['8', '9', 'a', 'b'][state % 4]
  hex = hex.slice(0, 12) + '4' + hex.slice(13, 16) + variant + hex.slice(17, 32)
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}

function makeFillerRows(programSeed: string, startId: number, count: number, topics: string[], agents: string[]): ResponseRow[] {
  // Step=7 is coprime with the 40-name lists, so (i, 7i+offset) mod 40 never repeats a pair for i < 40 —
  // no two filler rows in the same program can land on the same name, unlike a plain hash-mod lookup.
  const offset = seededIndex(programSeed, FILLER_LAST_NAMES.length)
  return Array.from({ length: count }, (_, i) => {
    const topic = topics[i % topics.length]
    const agent = agents[i % agents.length]
    const first = FILLER_FIRST_NAMES[i % FILLER_FIRST_NAMES.length]
    const last = FILLER_LAST_NAMES[(i * 7 + offset) % FILLER_LAST_NAMES.length]
    const day = 1 + (i % 28)
    const hour = 8 + (i % 12)
    const minute = (i * 13) % 60
    const sentAt = `Jul ${day}, ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    /* First 5 rows + everyone past the skipped band got an invite and just never came back — all of that
       is "Survey Not Started" under the new Invitation Delivered taxonomy, since the data model can't
       distinguish "never opened" from "opened and abandoned" once no response was ever recorded. The next
       5 never got a survey at all — no "Out of coverage" bucket anymore (network visibility isn't something
       this system has), so they're spread across the real Skipped reasons instead. A handful of rows near
       the end demonstrate the other Invitation Delivered substatuses (Declined / Invalid / Test). */
    const skipped = i >= 5 && i < 10
    const status = skipped
      ? SKIPPED_REASONS[(i - 5) % SKIPPED_REASONS.length]
      : i === 10 ? 'Survey Declined'
      : i === 11 ? 'Invalid Response'
      : i === 12 ? 'Test Survey'
      : 'Survey Not Started'
    return {
      customer: `${first} ${last}`,
      id: `INT-${startId + i}`,
      agent,
      topic,
      sent: skipped ? null : sentAt,
      response: null, completed: null, csat: null, asat: null,
      status,
    }
  })
}

/* The five Skipped sub-reasons a filler row without a hand-authored eligibility story can cycle through. */
const SKIPPED_REASONS = ['Opted Out', 'Recency Window', 'No Matching Survey Window', 'No Matching Skill or Team']

/* Fallback detail for any row without a hand-authored CustomerDetail (i.e. the filler rows above). */
/* Filler Skipped rows have no hand-authored reason, so give the program manager a plausible one instead
   of just restating the status back at them. */
const NOT_ELIGIBLE_REASONS: Record<string, string> = {
  'opted out': 'the customer has opted out of surveys',
  'recency window': 'this interaction fell outside the recency window for a follow-up',
  'no matching survey window': 'the interaction happened outside the program’s configured survey send window',
  'no matching skill or team': 'no matching skill or team was available to route the case',
  'internal interaction': 'this interaction was flagged as internal and excluded from customer surveys',
}
/* Invitation Delivered substatuses that still mean "no usable response" — each gets its own plain-language
   outcome line instead of defaulting to the generic "hasn't opened it yet" text. */
const SENT_STATUS_OUTCOMES: Record<string, string> = {
  'Survey Declined': 'The customer opened the survey and declined to respond.',
  'Invalid Response': 'The response could not be scored — the answer didn’t match a valid option.',
  'Test Survey': 'This was a test send, excluded from reporting.',
}
function genericDetailFor(row: ResponseRow): CustomerDetail {
  const notSent = row.sent === null
  return {
    summary: null, read: null, alsoFound: [],
    questions: notSent || !row.topic ? [] : [{ q: TOPIC_QUESTIONS[row.topic] ?? 'How would you rate your experience with us today?', a: null }],
    outcome: notSent
      ? `No survey was sent — ${NOT_ELIGIBLE_REASONS[row.status.toLowerCase()] ?? row.status.toLowerCase()}.`
      : SENT_STATUS_OUTCOMES[row.status] ?? 'Not started — the customer has not opened the survey.',
    alert: null,
    phone: `+1 223-555-${(seededIndex(row.id, 9000) + 1000)}`,
    email: `${row.customer.toLowerCase().replace(/[^a-z]+/g, '.')}@example.com`,
  }
}

const CRF_RESPONSES: ResponseRow[] = [
  { customer: 'Sophie Patel', id: 'INT-4064903', agent: 'Ben K.', topic: null, sent: null, response: null, completed: null, csat: null, asat: null, status: 'Internal Interaction' },
  { customer: 'Olivia Smith', id: 'INT-6257112', agent: 'Tomás R.', topic: 'Technical Troubleshooting', sent: 'Jul 1, 15:32', response: 'Jul 1, 15:35', completed: 'Jul 1, 16:13', csat: 5, asat: 5, status: 'Survey Completed' },
  { customer: 'Marcus Wright', id: 'INT-4789800', agent: 'Liu Yang', topic: 'Refund Processing', sent: 'Jul 2, 08:35', response: 'Jul 2, 08:55', completed: 'Jul 2, 09:08', csat: 2, asat: 3, status: 'Survey Completed' },
  { customer: 'Ava Johnson', id: 'INT-1601280', agent: 'Tomás R.', topic: 'Refund Processing', sent: 'Jul 18, 08:05', response: 'Jul 18, 08:22', completed: null, csat: 1, asat: null, status: 'Partially Responded' },
  { customer: 'Olivia Smith', id: 'INT-3002077', agent: 'Priya M.', topic: 'Account Access', sent: 'Jul 5, 11:53', response: 'Jul 5, 12:06', completed: 'Jul 5, 12:30', csat: 5, asat: null, status: 'Survey Completed' },
  { customer: 'Daniel Chen', id: 'INT-1249933', agent: 'Tomás R.', topic: 'Refund Processing', sent: 'Jul 12, 16:19', response: 'Jul 12, 16:44', completed: null, csat: 1, asat: null, status: 'Partially Responded' },
  { customer: 'Liam Al-Farsi', id: 'INT-5180251', agent: 'Priya M.', topic: 'Service Outage', sent: 'Jul 9, 13:54', response: null, completed: null, csat: null, asat: null, status: 'Survey Not Started' },
  { customer: 'Marcus Smith', id: 'INT-2249741', agent: 'Rajat S.', topic: 'Technical Troubleshooting', sent: 'Jul 11, 14:35', response: 'Jul 11, 14:57', completed: 'Jul 11, 15:14', csat: null, asat: 5, status: 'Survey Completed' },
  { customer: 'Noah Garcia', id: 'INT-7339243', agent: 'Priya M.', topic: 'Technical Troubleshooting', sent: null, response: null, completed: null, csat: null, asat: null, status: 'No Matching Skill or Team' },
  { customer: 'Noah Patel', id: 'INT-5451225', agent: 'Priya M.', topic: null, sent: 'Jul 9, 16:08', response: 'Jul 9, 16:18', completed: 'Jul 9, 16:49', csat: 4, asat: null, status: 'Survey Completed' },
  { customer: 'Derek Holloway', id: 'INT-4071012', agent: 'Ben K.', topic: 'Billing Dispute', sent: null, response: null, completed: null, csat: null, asat: null, status: 'Opted Out' },
  { customer: 'Priya Anand', id: 'INT-4071123', agent: 'Tomás R.', topic: 'Refund Processing', sent: null, response: null, completed: null, csat: null, asat: null, status: 'Recency Window' },
  { customer: 'Tobias Reed', id: 'INT-4071234', agent: 'Rajat S.', topic: 'Account Access', sent: null, response: null, completed: null, csat: null, asat: null, status: 'No Matching Survey Window' },
  { customer: 'Grace Liu', id: 'INT-4071345', agent: 'Ben K.', topic: 'Technical Troubleshooting', sent: 'Jul 6, 09:40', response: 'Jul 6, 09:52', completed: 'Jul 6, 10:05', csat: 2, asat: 3, status: 'Survey Completed' },
  { customer: 'Mateo Alvarez', id: 'INT-4071456', agent: 'Rajat S.', topic: 'Billing Dispute', sent: 'Jul 8, 14:10', response: 'Jul 8, 14:25', completed: null, csat: null, asat: 3, status: 'Partially Responded' },
  { customer: 'Fatima Hassan', id: 'INT-4071567', agent: 'Priya M.', topic: 'Account Access', sent: 'Jul 9, 11:00', response: 'Jul 9, 11:18', completed: 'Jul 9, 11:30', csat: 3, asat: null, status: 'Survey Completed' },
  { customer: 'Ethan Walsh', id: 'INT-4071678', agent: 'Liu Yang', topic: 'Service Outage', sent: 'Jul 10, 16:05', response: 'Jul 10, 16:20', completed: null, csat: null, asat: 2, status: 'Partially Responded' },
  { customer: 'Chloe Dubois', id: 'INT-4071789', agent: 'Tomás R.', topic: 'Refund Processing', sent: 'Jul 13, 08:50', response: 'Jul 13, 09:05', completed: 'Jul 13, 09:20', csat: 1, asat: 2, status: 'Survey Completed' },
  { customer: 'Omar Farouk', id: 'INT-4071890', agent: 'Ben K.', topic: 'Technical Troubleshooting', sent: 'Jul 15, 13:30', response: 'Jul 15, 13:45', completed: null, csat: null, asat: 3, status: 'Partially Responded' },
  { customer: 'Ingrid Larsen', id: 'INT-4071999', agent: 'Rajat S.', topic: 'Billing Dispute', sent: 'Jul 17, 10:15', response: 'Jul 17, 10:33', completed: 'Jul 17, 10:50', csat: 2, asat: 3, status: 'Survey Completed' },
  { customer: 'Noah Blake', id: 'INT-4072101', agent: 'Priya M.', topic: 'Account Access', sent: 'Jul 14, 09:15', response: 'Jul 14, 09:30', completed: 'Jul 14, 09:42', csat: 1, asat: 2, status: 'Survey Completed' },
  { customer: 'Priya Kapoor', id: 'INT-4072212', agent: 'Liu Yang', topic: 'Refund Processing', sent: 'Jul 16, 15:00', response: 'Jul 16, 15:18', completed: 'Jul 16, 15:30', csat: 5, asat: 5, status: 'Survey Completed' },
]

const RESPONSE_COLUMNS = ['Agent', 'Customer', 'Interaction ID', 'Primary Topic', 'Sent', 'Response', 'Completed', 'CSAT', 'ASAT', 'Alert', 'Survey Status']

/* The data model stores agents as short "First L." tags (used for filtering/grouping); this maps each
   to its full name for display, so the table and drawer read like a real roster rather than initials. */
const AGENT_FULL_NAME: Record<string, string> = {
  'Aisha N.': 'Aisha Nasser',
  'Ben K.': 'Ben Keller',
  'Chloe D.': 'Chloe Davenport',
  'Liu Yang': 'Liu Yang',
  'Marco B.': 'Marco Bianchi',
  'Priya M.': 'Priya Mehta',
  'Rajat S.': 'Rajat Sharma',
  'Sam O.': 'Sam Okafor',
  'Tomás R.': 'Tomás Ramírez',
}
const agentName = (a: string) => AGENT_FULL_NAME[a] ?? a

const CUSTOMER_COMPANIES = ['Northwind Traders', 'Contoso Ltd', 'Fabrikam Inc', 'Adventure Works', 'Tailspin Toys', 'Wide World Importers', 'Litware Inc', 'Proseware Inc', 'Woodgrove Bank', 'Alpine Ski House', 'Coho Winery', 'Lamna Healthcare']
const companyFor = (customer: string) => CUSTOMER_COMPANIES[seededIndex(customer, CUSTOMER_COMPANIES.length)]
const companySlug = (company: string) => company.toLowerCase().replace(/[^a-z0-9]+/g, '')
/* The hand-authored emails are all `firstname.lastname@example.com` — swap in the customer's company domain. */
const emailFor = (customer: string, email: string) => email.replace(/@example\.com$/, `@${companySlug(companyFor(customer))}.com`)
/* One interaction set per program; each has its own reporting window, topics and ID range. */
const DETAIL_RESPONSES: Record<string, ResponseRow[]> = {
  'Complaint Resolution Follow-Up': [
    ...CRF_RESPONSES,
    ...makeFillerRows('crf', 4300000, 37, ['Technical Troubleshooting', 'Refund Processing', 'Service Outage', 'Billing Dispute', 'Account Access'], ['Ben K.', 'Tomás R.', 'Priya M.', 'Liu Yang', 'Rajat S.']),
  ],
  'Flight Disruption Recovery': [
    { customer: 'Elena Rossi', id: 'INT-7102244', agent: 'Aisha N.', topic: 'Rebooking', sent: 'Jul 3, 09:12', response: 'Jul 3, 09:20', completed: 'Jul 3, 09:31', csat: 5, asat: 5, status: 'Survey Completed' },
    { customer: 'Kwame Mensah', id: 'INT-7118830', agent: 'Tomás R.', topic: 'Delay Notification', sent: 'Jul 4, 18:40', response: 'Jul 4, 18:52', completed: 'Jul 4, 19:05', csat: 4, asat: 4, status: 'Survey Completed' },
    { customer: 'Hannah Weber', id: 'INT-7124519', agent: 'Priya M.', topic: 'Compensation Claim', sent: 'Jul 5, 11:05', response: 'Jul 5, 11:30', completed: null, csat: 3, asat: null, status: 'Partially Responded' },
    { customer: 'Diego Martín', id: 'INT-7131077', agent: 'Liu Yang', topic: 'Missed Connection', sent: 'Jul 7, 07:50', response: 'Jul 7, 08:04', completed: 'Jul 7, 08:16', csat: 2, asat: 3, status: 'Survey Completed' },
    { customer: 'Mei Lin', id: 'INT-7139902', agent: 'Ben K.', topic: 'Baggage Delay', sent: 'Jul 8, 21:15', response: null, completed: null, csat: null, asat: null, status: 'Survey Not Started' },
    { customer: 'Oliver Brooks', id: 'INT-7146218', agent: 'Rajat S.', topic: 'Hotel Voucher', sent: 'Jul 10, 23:02', response: 'Jul 11, 07:45', completed: 'Jul 11, 07:58', csat: 5, asat: 5, status: 'Survey Completed' },
    { customer: 'Amara Okafor', id: 'INT-7151460', agent: 'Aisha N.', topic: null, sent: null, response: null, completed: null, csat: null, asat: null, status: 'Internal Interaction' },
    { customer: 'Lucas Dubois', id: 'INT-7158331', agent: 'Tomás R.', topic: 'Delay Notification', sent: 'Jul 12, 16:20', response: 'Jul 12, 16:33', completed: 'Jul 12, 16:50', csat: 4, asat: 5, status: 'Survey Completed' },
    { customer: 'Sara Haddad', id: 'INT-7163904', agent: 'Priya M.', topic: 'Compensation Claim', sent: 'Jul 14, 10:10', response: 'Jul 14, 10:40', completed: 'Jul 14, 10:55', csat: 5, asat: 4, status: 'Survey Completed' },
    { customer: 'Jonas Berg', id: 'INT-7170125', agent: 'Liu Yang', topic: 'Missed Connection', sent: null, response: null, completed: null, csat: null, asat: null, status: 'No Matching Skill or Team' },
    { customer: 'Freya Larsen', id: 'INT-7176231', agent: 'Rajat S.', topic: 'Compensation Claim', sent: null, response: null, completed: null, csat: null, asat: null, status: 'Opted Out' },
    { customer: 'Hassan Ali', id: 'INT-7176342', agent: 'Ben K.', topic: 'Delay Notification', sent: null, response: null, completed: null, csat: null, asat: null, status: 'Recency Window' },
    { customer: 'Clara Dubois', id: 'INT-7176453', agent: 'Aisha N.', topic: 'Rebooking', sent: null, response: null, completed: null, csat: null, asat: null, status: 'Interaction Too Short' },
    ...makeFillerRows('flight', 4310000, 37, ['Rebooking', 'Delay Notification', 'Compensation Claim', 'Missed Connection', 'Baggage Delay', 'Hotel Voucher'], ['Aisha N.', 'Tomás R.', 'Priya M.', 'Liu Yang', 'Rajat S.', 'Ben K.']),
  ],
  'Billing and Refund Recovery · All Digital': [
    { customer: 'Grace Kim', id: 'INT-8201133', agent: 'Marco B.', topic: 'Refund Processing', sent: 'Jul 2, 10:05', response: 'Jul 2, 10:19', completed: 'Jul 2, 10:34', csat: 5, asat: 5, status: 'Survey Completed' },
    { customer: 'Ahmed Siddiqui', id: 'INT-8207448', agent: 'Priya M.', topic: 'Duplicate Charge', sent: 'Jul 3, 14:22', response: 'Jul 3, 14:40', completed: null, csat: 4, asat: null, status: 'Partially Responded' },
    { customer: 'Isabella Costa', id: 'INT-8213790', agent: 'Chloe D.', topic: 'Partial Refund', sent: 'Jul 5, 09:15', response: 'Jul 5, 09:28', completed: 'Jul 5, 09:44', csat: 1, asat: 2, status: 'Survey Completed' },
    { customer: 'Ravi Nair', id: 'INT-8220015', agent: 'Ben K.', topic: 'Subscription Cancellation', sent: 'Jul 6, 17:50', response: null, completed: null, csat: null, asat: null, status: 'Survey Not Started' },
    { customer: 'Chloe Martin', id: 'INT-8226672', agent: 'Marco B.', topic: 'Payment Failure', sent: 'Jul 8, 12:03', response: 'Jul 8, 12:15', completed: 'Jul 8, 12:30', csat: 4, asat: 4, status: 'Survey Completed' },
    { customer: 'Tariq Hassan', id: 'INT-8233309', agent: 'Liu Yang', topic: 'Billing Dispute', sent: 'Jul 9, 15:40', response: 'Jul 9, 16:02', completed: null, csat: 3, asat: null, status: 'Partially Responded' },
    { customer: 'Emily Zhang', id: 'INT-8239941', agent: 'Chloe D.', topic: 'Invoice Correction', sent: 'Jul 11, 11:11', response: 'Jul 11, 11:25', completed: 'Jul 11, 11:40', csat: 5, asat: 5, status: 'Survey Completed' },
    { customer: 'Pedro Alves', id: 'INT-8246580', agent: 'Priya M.', topic: 'Refund Processing', sent: 'Jul 13, 08:30', response: 'Jul 13, 08:45', completed: 'Jul 13, 09:01', csat: 2, asat: 3, status: 'Survey Completed' },
    { customer: 'Fatima Al-Sayed', id: 'INT-8252217', agent: 'Rajat S.', topic: null, sent: null, response: null, completed: null, csat: null, asat: null, status: 'Internal Interaction' },
    { customer: 'Henry Walsh', id: 'INT-8258866', agent: 'Marco B.', topic: 'Billing Dispute', sent: null, response: null, completed: null, csat: null, asat: null, status: 'Opted Out' },
    { customer: 'Nora Jensen', id: 'INT-8264977', agent: 'Priya M.', topic: 'Refund Processing', sent: null, response: null, completed: null, csat: null, asat: null, status: 'No Matching Skill or Team' },
    { customer: 'Omar Bashir', id: 'INT-8265088', agent: 'Liu Yang', topic: 'Duplicate Charge', sent: null, response: null, completed: null, csat: null, asat: null, status: 'Recency Window' },
    { customer: 'Sofia Russo', id: 'INT-8265199', agent: 'Chloe D.', topic: 'Invoice Correction', sent: null, response: null, completed: null, csat: null, asat: null, status: 'No Matching Survey Window' },
    ...makeFillerRows('billing', 4320000, 37, ['Refund Processing', 'Duplicate Charge', 'Partial Refund', 'Subscription Cancellation', 'Payment Failure', 'Billing Dispute', 'Invoice Correction'], ['Marco B.', 'Priya M.', 'Chloe D.', 'Ben K.', 'Liu Yang', 'Rajat S.']),
  ],
  'Omnichannel Escalation Recovery': [
    { customer: 'Nadia Petrova', id: 'INT-9301207', agent: 'Sam O.', topic: 'Channel Hand-off', sent: 'Jul 4, 13:10', response: 'Jul 4, 13:25', completed: 'Jul 4, 13:40', csat: 4, asat: 4, status: 'Survey Completed' },
    { customer: 'Caleb Johnson', id: 'INT-9307734', agent: 'Tomás R.', topic: 'Repeat Contact', sent: 'Jul 5, 16:45', response: 'Jul 5, 17:02', completed: 'Jul 5, 17:20', csat: 2, asat: 3, status: 'Survey Completed' },
    { customer: 'Yuki Tanaka', id: 'INT-9313351', agent: 'Aisha N.', topic: 'Callback Not Received', sent: 'Jul 7, 09:30', response: 'Jul 7, 09:48', completed: null, csat: 1, asat: null, status: 'Partially Responded' },
    { customer: 'Sofia Hernández', id: 'INT-9319986', agent: 'Liu Yang', topic: 'Supervisor Escalation', sent: 'Jul 8, 11:20', response: 'Jul 8, 11:40', completed: 'Jul 8, 11:58', csat: 5, asat: 5, status: 'Survey Completed' },
    { customer: 'Ibrahim Yusuf', id: 'INT-9326604', agent: 'Sam O.', topic: 'Bot Transfer Friction', sent: 'Jul 9, 19:05', response: null, completed: null, csat: null, asat: null, status: 'Survey Not Started' },
    { customer: 'Laura Fischer', id: 'INT-9332240', agent: 'Priya M.', topic: 'Case Reopened', sent: 'Jul 11, 10:15', response: 'Jul 11, 10:30', completed: 'Jul 11, 10:47', csat: 3, asat: 4, status: 'Survey Completed' },
    { customer: 'Mateo Silva', id: 'INT-9338877', agent: 'Ben K.', topic: 'Channel Hand-off', sent: 'Jul 12, 14:55', response: 'Jul 12, 15:10', completed: 'Jul 12, 15:25', csat: 5, asat: 5, status: 'Survey Completed' },
    { customer: 'Zara Ahmed', id: 'INT-9345513', agent: 'Rajat S.', topic: 'Repeat Contact', sent: null, response: null, completed: null, csat: null, asat: null, status: 'No Matching Skill or Team' },
    { customer: 'Thomas Müller', id: 'INT-9352159', agent: 'Tomás R.', topic: 'Supervisor Escalation', sent: 'Jul 15, 08:40', response: 'Jul 15, 08:55', completed: 'Jul 15, 09:12', csat: 4, asat: 4, status: 'Survey Completed' },
    { customer: 'Grace Oduya', id: 'INT-9358260', agent: 'Sam O.', topic: null, sent: null, response: null, completed: null, csat: null, asat: null, status: 'Internal Interaction' },
    { customer: 'Victor Hale', id: 'INT-9358371', agent: 'Liu Yang', topic: 'Channel Hand-off', sent: null, response: null, completed: null, csat: null, asat: null, status: 'Opted Out' },
    { customer: 'Nadia Costa', id: 'INT-9358482', agent: 'Ben K.', topic: 'Case Reopened', sent: null, response: null, completed: null, csat: null, asat: null, status: 'Recency Window' },
    { customer: 'Samir Khoury', id: 'INT-9358593', agent: 'Priya M.', topic: 'Repeat Contact', sent: null, response: null, completed: null, csat: null, asat: null, status: 'No Matching Survey Window' },
    ...makeFillerRows('omni', 4330000, 37, ['Channel Hand-off', 'Repeat Contact', 'Callback Not Received', 'Supervisor Escalation', 'Bot Transfer Friction', 'Case Reopened'], ['Sam O.', 'Tomás R.', 'Aisha N.', 'Liu Yang', 'Priya M.', 'Ben K.', 'Rajat S.']),
  ],
  'Product Feedback - Beta Testers': [
    { customer: 'Jordan Lee', id: 'INT-6401118', agent: 'Chloe D.', topic: 'Mobile App Sync', sent: 'Jul 1, 10:00', response: 'Jul 1, 10:20', completed: 'Jul 1, 10:38', csat: 2, asat: 4, status: 'Survey Completed' },
    { customer: 'Priyanka Rao', id: 'INT-6407752', agent: 'Sam O.', topic: 'Onboarding Flow', sent: 'Jul 2, 15:30', response: 'Jul 2, 15:45', completed: 'Jul 2, 16:02', csat: 4, asat: 5, status: 'Survey Completed' },
    { customer: 'Ethan Clarke', id: 'INT-6413397', agent: 'Marco B.', topic: 'Dashboard Export', sent: 'Jul 4, 11:12', response: 'Jul 4, 11:30', completed: null, csat: 3, asat: null, status: 'Partially Responded' },
    { customer: 'Aisha Bello', id: 'INT-6420030', agent: 'Chloe D.', topic: 'Notification Settings', sent: 'Jul 6, 09:45', response: 'Jul 6, 10:00', completed: 'Jul 6, 10:15', csat: 5, asat: 5, status: 'Survey Completed' },
    { customer: 'Victor Novak', id: 'INT-6426661', agent: 'Priya M.', topic: 'Data Import', sent: 'Jul 8, 13:20', response: null, completed: null, csat: null, asat: null, status: 'Survey Not Started' },
    { customer: 'Hana Sato', id: 'INT-6433298', agent: 'Sam O.', topic: 'Mobile App Sync', sent: 'Jul 9, 17:05', response: 'Jul 9, 17:25', completed: 'Jul 9, 17:40', csat: 1, asat: 3, status: 'Survey Completed' },
    { customer: 'Daniel Osei', id: 'INT-6439934', agent: 'Marco B.', topic: 'Feature Request', sent: 'Jul 11, 10:30', response: 'Jul 11, 10:50', completed: 'Jul 11, 11:05', csat: 4, asat: 4, status: 'Survey Completed' },
    { customer: 'Lena Hoffmann', id: 'INT-6446570', agent: 'Rajat S.', topic: 'Bug Report', sent: 'Jul 13, 14:15', response: 'Jul 13, 14:30', completed: 'Jul 13, 14:48', csat: 4, asat: 5, status: 'Survey Completed' },
    { customer: 'Omar Farouk', id: 'INT-6453206', agent: 'Chloe D.', topic: null, sent: null, response: null, completed: null, csat: null, asat: null, status: 'Internal Interaction' },
    { customer: 'Mia Andersen', id: 'INT-6459843', agent: 'Priya M.', topic: 'Dashboard Export', sent: null, response: null, completed: null, csat: null, asat: null, status: 'No Matching Skill or Team' },
    { customer: 'Felix Brandt', id: 'INT-6465974', agent: 'Marco B.', topic: 'Notification Settings', sent: null, response: null, completed: null, csat: null, asat: null, status: 'Opted Out' },
    { customer: 'Zainab Idris', id: 'INT-6466085', agent: 'Sam O.', topic: 'Feature Request', sent: null, response: null, completed: null, csat: null, asat: null, status: 'Recency Window' },
    { customer: 'Theo Walker', id: 'INT-6466196', agent: 'Chloe D.', topic: 'Bug Report', sent: null, response: null, completed: null, csat: null, asat: null, status: 'Interaction Too Short' },
    ...makeFillerRows('beta', 4340000, 37, ['Mobile App Sync', 'Onboarding Flow', 'Dashboard Export', 'Notification Settings', 'Data Import', 'Feature Request', 'Bug Report'], ['Chloe D.', 'Sam O.', 'Marco B.', 'Priya M.', 'Rajat S.']),
  ],
}

/* Which parent group each selectable Survey Status substatus belongs to, per the CXFI-34/CXFI-29
   taxonomy — shown as a small secondary line under the status pill so a PM can tell at a glance whether
   an interaction got an invite at all. */
const STATUS_GROUP: Record<string, string> = {
  'Survey Completed': 'Invitation Delivered',
  'Partially Responded': 'Invitation Delivered',
  'Survey Not Started': 'Invitation Delivered',
  'Survey Declined': 'Invitation Delivered',
  'Invalid Response': 'Invitation Delivered',
  'Test Survey': 'Invitation Delivered',
  'Opted Out': 'Skipped',
  'Recency Window': 'Skipped',
  'No Matching Survey Window': 'Skipped',
  'No Matching Skill or Team': 'Skipped',
  'Internal Interaction': 'Skipped',
  'Interaction Too Short': 'Skipped',
}

/* `secondarySide` controls where the group label sits relative to the pill: 'below' is the table's
   right-aligned stack (secondary text's right edge lines up with the pill's own text), 'left' puts it
   inline before the pill — used in the drawer, where it reads as a sentence next to a field label rather
   than a stacked table cell. `align` only matters for 'below' (the drawer's centered OUTCOME box). */
function ResponseStatus({ status, secondarySide = 'below', align = 'end' }: { status: string; secondarySide?: 'below' | 'left'; align?: 'start' | 'center' | 'end' }) {
  const tone = status === 'Survey Completed'
    ? { bg: 'var(--lyra-color-status-success-subtle)', fg: 'var(--lyra-color-status-success-strong)', border: undefined }
    : status === 'Partially Responded'
    ? { bg: 'var(--lyra-color-status-warning-subtle)', fg: 'var(--lyra-color-status-warning-strong)', border: undefined }
    : status === 'Survey Declined' || status === 'Invalid Response'
    ? { bg: 'var(--lyra-color-status-critical-subtle)', fg: 'var(--lyra-color-status-critical-strong)', border: undefined }
    : { bg: 'var(--lyra-slate-100)', fg: 'var(--lyra-color-fg-default)', border: '1px solid var(--lyra-color-border-soft)' }
  const group = STATUS_GROUP[status]
  const badge = (
    <span style={{ display: 'inline-block', font: `500 12px/18px ${FONT}`, padding: '2px 10px', borderRadius: 'var(--radius-full)', whiteSpace: 'nowrap', background: tone.bg, color: tone.fg, border: tone.border }}>
      {status}
    </span>
  )
  if (!group) return badge
  if (secondarySide === 'left') {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <span style={{ font: `400 11px/14px ${FONT}`, color: 'var(--lyra-color-fg-secondary)', whiteSpace: 'nowrap' }}>{group}</span>
        {badge}
      </div>
    )
  }
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: align === 'center' ? 'center' : align === 'start' ? 'flex-start' : 'flex-end', gap: 2 }}>
      {badge}
      <span style={{ font: `400 11px/14px ${FONT}`, color: 'var(--lyra-color-fg-secondary)', whiteSpace: 'nowrap', ...(align === 'end' ? { marginRight: 10 } : align === 'start' ? { marginLeft: 10 } : {}) }}>
        {group}
      </span>
    </div>
  )
}

function Muted({ children }: { children: React.ReactNode }) {
  return <span style={{ color: 'var(--lyra-color-fg-disabled)' }}>{children}</span>
}

/* ── Customer detail drawer ── */
type SystemRead = { tone: 'positive' | 'negative' | 'mixed'; label: string; expected: [number, number]; asatExpected: [number, number] } | null
type InteractionAlert = { name: string; rule: string; sentTo: string; via: string; when: string } | null
type CustomerDetail = {
  summary: string | null
  read: SystemRead
  alsoFound: string[]
  questions: { q: string; a: string | null; alternatives?: string[]; type?: 'CSAT' | 'ASAT' }[]
  outcome: string
  alert: InteractionAlert
  phone: string
  email: string
}

const CRF_DETAILS: Record<string, CustomerDetail> = {
  'INT-4064903': {
    summary: null, read: null, alsoFound: [], questions: [],
    outcome: 'No survey was sent — this interaction was flagged as internal and excluded from customer surveys.',
    alert: null,
    phone: '+1 223-555-7714', email: 'sophie.patel@example.com',
  },
  'INT-6257112': {
    summary: 'The system read this technical troubleshooting case as resolved, based on a clean resolution logged before the call ended.',
    read: { tone: 'positive', label: 'Resolved · likely positive', expected: [4, 5], asatExpected: [4, 5] },
    alsoFound: ['Account Access'],
    questions: [
      { q: 'How would you rate how we handled your technical troubleshooting today?', a: '5 of 5', alternatives: ['Did the troubleshooting steps fix your device for good?', 'How satisfied are you with the help you got with your device today?'] },
      { q: 'What could have made the technical troubleshooting experience better?', a: '"It was already the right call, I would not change it."' },
    ],
    outcome: 'Survey Completed · Jul 1, 16:13',
    alert: null,
    phone: '+1 223-555-5382', email: 'olivia.smith@example.com',
  },
  'INT-4789800': {
    summary: 'The system read this refund case as unresolved — the refund was promised but no confirmation was logged before the chat closed.',
    read: { tone: 'negative', label: 'Unresolved · likely negative', expected: [1, 3], asatExpected: [2, 4] },
    alsoFound: ['Billing Dispute'],
    questions: [
      { q: 'How would you rate how we handled your refund today?', a: '2 of 5', alternatives: ['Were you told when your refund will arrive?', 'How confident are you that your refund is on its way?'] },
      { q: 'What could have made the refund experience better?', a: '"I still don\'t know when the money will arrive. A date would have helped."' },
    ],
    outcome: 'Survey Completed · Jul 2, 09:08',
    alert: { name: 'Detractor alert', rule: 'CSAT ≤ 2 on a Refund Processing interaction', sentTo: 'Billing supervisor (Dana M.)', via: 'Email', when: 'Jul 2, 09:10' },
    phone: '+1 223-555-2041', email: 'marcus.wright@example.com',
  },
  'INT-1601280': {
    summary: 'The system read this refund case as escalated — the agent transferred the customer to a supervisor queue before closing.',
    read: { tone: 'negative', label: 'Escalated · likely negative', expected: [1, 2], asatExpected: [2, 3] },
    alsoFound: ['Delivery Delay'],
    questions: [
      { q: 'How would you rate how we handled your refund today?', a: '1 of 5', alternatives: ['Did the hand-over to a supervisor help with your refund?', 'How would you rate the wait before someone could help with your refund?'] },
      { q: 'What could have made the refund experience better?', a: null },
    ],
    outcome: 'Customer stopped after Q1 · Jul 18, 08:22',
    alert: { name: 'Detractor alert', rule: 'CSAT ≤ 2 on a Refund Processing interaction', sentTo: 'Billing supervisor (Dana M.)', via: 'Email', when: 'Jul 18, 08:24' },
    phone: '+1 223-555-9120', email: 'ava.johnson@example.com',
  },
  'INT-3002077': {
    summary: 'The system read this account access case as resolved — a password reset was completed and confirmed during the chat.',
    read: { tone: 'positive', label: 'Resolved · likely positive', expected: [4, 5], asatExpected: [5, 5] },
    alsoFound: [],
    questions: [
      { q: 'How would you rate how we handled your account access issue today?', a: '5 of 5', alternatives: ['Were you able to sign in after the reset?', 'How easy was it to get back into your account today?'] },
      { q: 'What could have made the account access experience better?', a: '"Fast and friendly, nothing to add."' },
    ],
    outcome: 'Survey Completed · Jul 5, 12:30',
    alert: null,
    phone: '+1 223-555-5382', email: 'olivia.smith@example.com',
  },
  'INT-1249933': {
    summary: 'The system read this refund case as partially resolved — a refund was issued but the customer questioned the amount.',
    read: { tone: 'mixed', label: 'Partially resolved · mixed', expected: [3, 4], asatExpected: [4, 5] },
    alsoFound: ['Billing Dispute'],
    questions: [
      { q: 'How would you rate how we handled your refund today?', a: '1 of 5', alternatives: ['Was the refund amount what you expected?', 'How clear was the explanation of your refund amount?'] },
      { q: 'What could have made the refund experience better?', a: null },
    ],
    outcome: 'Customer stopped after Q1 · Jul 12, 16:44',
    alert: { name: 'Detractor alert', rule: 'CSAT ≤ 2 on a Refund Processing interaction', sentTo: 'Billing supervisor (Dana M.)', via: 'Email', when: 'Jul 12, 16:46' },
    phone: '+1 223-555-3377', email: 'daniel.chen@example.com',
  },
  'INT-5180251': {
    summary: 'The system read this service outage case as acknowledged — the customer was told about a known incident and given an ETA.',
    read: { tone: 'mixed', label: 'Acknowledged · mixed', expected: [3, 4], asatExpected: [4, 5] },
    alsoFound: ['Technical Troubleshooting'],
    questions: [
      { q: 'How would you rate how we handled the service outage today?', a: null, alternatives: ['Was the outage update clear enough for you?', 'How well did we keep you informed during the outage?'] },
      { q: 'What could have made the outage experience better?', a: null },
    ],
    outcome: 'Not started — the customer has not opened the survey.',
    alert: null,
    phone: '+1 223-555-6608', email: 'liam.alfarsi@example.com',
  },
  'INT-2249741': {
    summary: 'The system read this technical troubleshooting case as resolved — the device reconnected after a guided reset.',
    read: { tone: 'positive', label: 'Resolved · likely positive', expected: [4, 5], asatExpected: [5, 5] },
    alsoFound: [],
    questions: [
      { q: 'How would you rate the agent who helped with your technical troubleshooting today?', a: '5 of 5', type: 'ASAT', alternatives: ['How clearly did the agent explain the reset steps?', 'How well did the agent understand your issue?'] },
      { q: 'What could the agent have done better?', a: '"Nothing — clear steps, worked first time."' },
    ],
    outcome: 'Survey Completed · Jul 11, 15:14',
    alert: null,
    phone: '+1 223-555-8821', email: 'marcus.smith@example.com',
  },
  'INT-7339243': {
    summary: 'The system read this technical troubleshooting case as unresolved — no matching skill or team was available to route the case.',
    read: { tone: 'negative', label: 'Unresolved · likely negative', expected: [1, 2], asatExpected: [2, 3] },
    alsoFound: ['Bot Transfer Friction'],
    questions: [],
    outcome: 'No survey was sent — no matching skill or team.',
    alert: null,
    phone: '+1 223-555-4459', email: 'noah.garcia@example.com',
  },
  'INT-5451225': {
    summary: null, read: null,
    alsoFound: [],
    questions: [
      { q: 'How would you rate your experience with us today?', a: '4 of 5' },
      { q: 'What could have made your experience better?', a: '"A shorter wait before someone picked up."' },
    ],
    outcome: 'Survey Completed · Jul 9, 16:49',
    alert: null,
    phone: '+1 223-555-1193', email: 'noah.patel@example.com',
  },
  'INT-4071012': {
    summary: 'The system read this billing dispute as resolved — the disputed charge was waived as a goodwill gesture during the chat.',
    read: { tone: 'positive', label: 'Resolved · likely positive', expected: [4, 5], asatExpected: [5, 5] },
    alsoFound: [], questions: [],
    outcome: 'No survey was sent — the customer has opted out of surveys.',
    alert: null,
    phone: '+1 223-555-6621', email: 'derek.holloway@example.com',
  },
  'INT-4071123': {
    summary: null, read: null, alsoFound: [], questions: [],
    outcome: 'No survey was sent — this interaction fell outside the recency window for a follow-up.',
    alert: null,
    phone: '+1 223-555-6732', email: 'priya.anand@example.com',
  },
  'INT-4071234': {
    summary: 'The system read this account access case as resolved — a password reset was completed during the chat.',
    read: { tone: 'positive', label: 'Resolved · likely positive', expected: [4, 5], asatExpected: [5, 5] },
    alsoFound: [], questions: [],
    outcome: 'No survey was sent — the interaction happened outside the configured send window.',
    alert: null,
    phone: '+1 223-555-6843', email: 'tobias.reed@example.com',
  },
  'INT-4071345': {
    summary: 'The system read this technical troubleshooting case as unresolved — the device dropped connection again shortly after the chat ended.',
    read: { tone: 'negative', label: 'Unresolved · likely negative', expected: [1, 3], asatExpected: [2, 4] },
    alsoFound: ['Service Outage'],
    questions: [
      { q: 'How would you rate how we handled your technical troubleshooting today?', a: '2 of 5', alternatives: ['Is your device still dropping connection?', 'How many times did you need to retry the fix?'] },
      { q: 'What could have made the technical troubleshooting experience better?', a: '"The fix only lasted a few minutes before it happened again."' },
    ],
    outcome: 'Survey Completed · Jul 6, 10:05',
    alert: { name: 'Detractor alert', rule: 'CSAT ≤ 3 on a Technical Troubleshooting interaction', sentTo: 'Billing supervisor (Dana M.)', via: 'Email', when: 'Jul 6, 10:07' },
    phone: '+1 223-555-2284', email: 'grace.liu@example.com',
  },
  'INT-4071456': {
    summary: 'The system read this billing dispute as unresolved — the disputed charge was still under review when the chat ended.',
    read: { tone: 'negative', label: 'Unresolved · likely negative', expected: [1, 3], asatExpected: [2, 4] },
    alsoFound: [],
    questions: [
      { q: 'How would you rate the agent who helped with your billing dispute today?', a: '3 of 5', type: 'ASAT', alternatives: ['How clearly did the agent explain the review process?', 'How confident are you in the next steps the agent gave you?'] },
      { q: 'What could the agent have done better?', a: null },
    ],
    outcome: 'Customer stopped after Q1 · Jul 8, 14:25',
    alert: { name: 'Detractor alert', rule: 'ASAT ≤ 3 on a Billing Dispute interaction', sentTo: 'Billing supervisor (Dana M.)', via: 'Email', when: 'Jul 8, 14:27' },
    phone: '+1 223-555-3395', email: 'mateo.alvarez@example.com',
  },
  'INT-4071567': {
    summary: 'The system read this account access case as resolved, though the customer needed a second attempt before the reset took effect.',
    read: { tone: 'mixed', label: 'Resolved · mixed', expected: [3, 4], asatExpected: [4, 5] },
    alsoFound: [],
    questions: [
      { q: 'How would you rate how we handled your account access issue today?', a: '3 of 5', alternatives: ['Did the reset work on the first try?', 'How easy was it to get back into your account today?'] },
      { q: 'What could have made the account access experience better?', a: '"It took two tries to get the reset link working."' },
    ],
    outcome: 'Survey Completed · Jul 9, 11:30',
    alert: { name: 'Detractor alert', rule: 'CSAT ≤ 3 on a Account Access interaction', sentTo: 'Billing supervisor (Dana M.)', via: 'Email', when: 'Jul 9, 11:32' },
    phone: '+1 223-555-4406', email: 'fatima.hassan@example.com',
  },
  'INT-4071678': {
    summary: 'The system read this service outage case as acknowledged, though the customer felt the update came too late.',
    read: { tone: 'negative', label: 'Acknowledged · likely negative', expected: [1, 3], asatExpected: [2, 4] },
    alsoFound: ['Technical Troubleshooting'],
    questions: [
      { q: 'How would you rate the agent who helped you during the service outage?', a: '2 of 5', type: 'ASAT', alternatives: ['How well did the agent keep you informed?', 'How clearly did the agent explain when service would be back?'] },
      { q: 'What could the agent have done better?', a: null },
    ],
    outcome: 'Customer stopped after Q1 · Jul 10, 16:20',
    alert: { name: 'Detractor alert', rule: 'ASAT ≤ 3 on a Service Outage interaction', sentTo: 'Billing supervisor (Dana M.)', via: 'Email', when: 'Jul 10, 16:22' },
    phone: '+1 223-555-5517', email: 'ethan.walsh@example.com',
  },
  'INT-4071789': {
    summary: 'The system read this refund case as unresolved — the customer was quoted an amount lower than they expected.',
    read: { tone: 'negative', label: 'Unresolved · likely negative', expected: [1, 2], asatExpected: [2, 3] },
    alsoFound: ['Billing Dispute'],
    questions: [
      { q: 'How would you rate how we handled your refund today?', a: '1 of 5', alternatives: ['Was the refund amount what you expected?', 'How clear was the explanation of your refund amount?'] },
      { q: 'What could have made the refund experience better?', a: '"The amount quoted was far less than what I paid."' },
    ],
    outcome: 'Survey Completed · Jul 13, 09:20',
    alert: { name: 'Detractor alert', rule: 'CSAT ≤ 3 on a Refund Processing interaction', sentTo: 'Billing supervisor (Dana M.)', via: 'Email', when: 'Jul 13, 09:22' },
    phone: '+1 223-555-6628', email: 'chloe.dubois@example.com',
  },
  'INT-4071890': {
    summary: 'The system read this technical troubleshooting case as unresolved — the agent ran out of steps before the chat closed.',
    read: { tone: 'negative', label: 'Unresolved · likely negative', expected: [1, 3], asatExpected: [2, 4] },
    alsoFound: [],
    questions: [
      { q: 'How would you rate the agent who helped with your technical troubleshooting today?', a: '3 of 5', type: 'ASAT', alternatives: ['How well did the agent understand your issue?', 'How clearly did the agent tell you what to do next?'] },
      { q: 'What could the agent have done better?', a: null },
    ],
    outcome: 'Customer stopped after Q1 · Jul 15, 13:45',
    alert: { name: 'Detractor alert', rule: 'ASAT ≤ 3 on a Technical Troubleshooting interaction', sentTo: 'Billing supervisor (Dana M.)', via: 'Email', when: 'Jul 15, 13:47' },
    phone: '+1 223-555-7739', email: 'omar.farouk@example.com',
  },
  'INT-4071999': {
    summary: 'The system read this billing dispute as partially resolved — a half refund was issued but the customer still disputed the remaining balance.',
    read: { tone: 'mixed', label: 'Partially resolved · mixed', expected: [2, 3], asatExpected: [3, 4] },
    alsoFound: [],
    questions: [
      { q: 'How would you rate how we handled your billing dispute today?', a: '2 of 5', alternatives: ['Did the refund cover what you were disputing?', 'How clear was the explanation of the refund amount?'] },
      { q: 'What could have made the billing dispute experience better?', a: '"The refund only covered half of the charge I was disputing."' },
    ],
    outcome: 'Survey Completed · Jul 17, 10:50',
    alert: { name: 'Detractor alert', rule: 'CSAT ≤ 3 on a Billing Dispute interaction', sentTo: 'Billing supervisor (Dana M.)', via: 'Email', when: 'Jul 17, 10:52' },
    phone: '+1 223-555-8840', email: 'ingrid.larsen@example.com',
  },
  'INT-4072101': {
    summary: 'The system read this account access case as resolved — the password reset was confirmed working before the chat ended.',
    read: { tone: 'positive', label: 'Resolved · likely positive', expected: [4, 5], asatExpected: [5, 5] },
    alsoFound: [],
    questions: [
      { q: 'How would you rate how we handled your account access issue today?', a: '1 of 5', alternatives: ['Were you able to stay signed in after the reset?', 'How easy was it to get back into your account today?'] },
      { q: 'What could have made the account access experience better?', a: '"The reset worked in the chat, but I was locked out again an hour later — nobody mentioned that could happen."' },
    ],
    outcome: 'Survey Completed · Jul 14, 09:42',
    alert: { name: 'Detractor alert', rule: 'CSAT ≤ 3 on a Account Access interaction', sentTo: 'Billing supervisor (Dana M.)', via: 'Email', when: 'Jul 14, 09:44' },
    phone: '+1 223-555-9951', email: 'noah.blake@example.com',
  },
  'INT-4072212': {
    summary: 'The system read this refund case as unresolved — the agent could not confirm a refund timeline before the chat ended.',
    read: { tone: 'negative', label: 'Unresolved · likely negative', expected: [1, 2], asatExpected: [2, 3] },
    alsoFound: [],
    questions: [
      { q: 'How would you rate how we handled your refund today?', a: '5 of 5', alternatives: ['Did you get a firm date for the refund?', 'How confident are you that your refund is on its way?'] },
      { q: 'What could have made the refund experience better?', a: '"Nothing — they followed up by email an hour later with the exact date, which is all I needed."' },
    ],
    outcome: 'Survey Completed · Jul 16, 15:30',
    alert: null,
    phone: '+1 223-555-1062', email: 'priya.kapoor@example.com',
  },
}

const CUSTOMER_DETAILS: Record<string, Record<string, CustomerDetail>> = {
  'Complaint Resolution Follow-Up': CRF_DETAILS,

  'Flight Disruption Recovery': {
    'INT-7102244': {
      summary: 'The system read this rebooking case as resolved — the customer was moved to the next direct flight and the new boarding pass was sent in the chat.',
      read: { tone: 'positive', label: 'Resolved · likely positive', expected: [4, 5], asatExpected: [5, 5] },
      alsoFound: ['Delay Notification'],
      questions: [
        { q: 'How would you rate how we handled your rebooking today?', a: '5 of 5', alternatives: ['Did the new flight work for your plans?', 'How easy was it to get rebooked after the cancellation?'] },
        { q: 'What could have made the rebooking experience better?', a: '"Honestly nothing — I had the new boarding pass before I reached the gate."' },
      ],
      outcome: 'Survey Completed · Jul 3, 09:31', alert: null,
      phone: '+1 223-555-4102', email: 'elena.rossi@example.com',
    },
    'INT-7118830': {
      summary: 'The system read this delay case as handled — the customer was told about the 2-hour delay before reaching the airport and given a meal voucher.',
      read: { tone: 'positive', label: 'Handled · likely positive', expected: [4, 5], asatExpected: [5, 5] },
      alsoFound: [],
      questions: [
        { q: 'How would you rate the way we kept you informed about your delay?', a: '4 of 5', alternatives: ['Did you hear about the delay before you left for the airport?', 'Was the delay information clear and on time?'] },
        { q: 'What could have made the delay experience better?', a: '"An earlier message — I was already in the taxi."' },
      ],
      outcome: 'Survey Completed · Jul 4, 19:05', alert: null,
      phone: '+1 223-555-4188', email: 'kwame.mensah@example.com',
    },
    'INT-7124519': {
      summary: 'The system read this compensation case as pending — the claim was filed in the chat but a decision had not been made when the conversation ended.',
      read: { tone: 'mixed', label: 'Pending · mixed', expected: [3, 4], asatExpected: [4, 5] },
      alsoFound: ['Missed Connection'],
      questions: [
        { q: 'How would you rate the help you got filing your compensation claim?', a: '3 of 5', alternatives: ['Was the compensation process explained clearly?', 'Do you know what happens next with your claim?'] },
        { q: 'What could have made the claim experience better?', a: null },
      ],
      outcome: 'Customer stopped after Q1 · Jul 5, 11:30', alert: null,
      phone: '+1 223-555-4245', email: 'hannah.weber@example.com',
    },
    'INT-7131077': {
      summary: 'The system read this missed connection as recovered — a seat on the next flight was confirmed, although the customer had to wait overnight.',
      read: { tone: 'mixed', label: 'Recovered · mixed', expected: [3, 4], asatExpected: [4, 5] },
      alsoFound: ['Hotel Voucher'],
      questions: [
        { q: 'How would you rate how we handled your missed connection?', a: '2 of 5', alternatives: ['Was the overnight stay arranged smoothly?', 'How satisfied are you with the next flight we found?'] },
        { q: 'What could have made the missed connection experience better?', a: '"The hotel voucher only arrived after I had paid for a room myself."' },
      ],
      outcome: 'Survey Completed · Jul 7, 08:16',
      alert: { name: 'Detractor alert', rule: 'CSAT ≤ 2 on a Missed Connection interaction', sentTo: 'Airport Operations lead (Farah K.)', via: 'Email', when: 'Jul 7, 08:18' },
      phone: '+1 223-555-4310', email: 'diego.martin@example.com',
    },
    'INT-7139902': {
      summary: 'The system read this baggage case as acknowledged — a delayed-bag report was opened and a delivery address captured.',
      read: { tone: 'mixed', label: 'Acknowledged · mixed', expected: [3, 4], asatExpected: [4, 5] },
      alsoFound: [],
      questions: [
        { q: 'How would you rate the help you got with your delayed bag?', a: null, alternatives: ['Was the bag delivery timeline clear?', 'How easy was it to report your delayed bag?'] },
        { q: 'What could have made the baggage experience better?', a: null },
      ],
      outcome: 'Not started — the customer has not opened the survey.', alert: null,
      phone: '+1 223-555-4399', email: 'mei.lin@example.com',
    },
    'INT-7146218': {
      summary: 'The system read this voucher case as resolved — a hotel and transfer were booked in the chat after the last flight of the day was cancelled.',
      read: { tone: 'positive', label: 'Resolved · likely positive', expected: [4, 5], asatExpected: [5, 5] },
      alsoFound: ['Rebooking'],
      questions: [
        { q: 'How would you rate the hotel arrangements we made for you?', a: '5 of 5', alternatives: ['Was the hotel voucher easy to use?', 'How was the transfer to the hotel?'] },
        { q: 'What could have made the overnight stay better?', a: '"Quick and painless. The transfer was waiting when I got out."' },
      ],
      outcome: 'Survey Completed · Jul 11, 07:58', alert: null,
      phone: '+1 223-555-4462', email: 'oliver.brooks@example.com',
    },
    'INT-7151460': {
      summary: null, read: null, alsoFound: [], questions: [],
      outcome: 'No survey was sent — this interaction was flagged as internal and excluded from customer surveys.', alert: null,
      phone: '+1 223-555-4514', email: 'amara.okafor@example.com',
    },
    'INT-7158331': {
      summary: 'The system read this delay case as unresolved — the customer complained twice about a 4-hour delay and no compensation was offered in the chat.',
      read: { tone: 'negative', label: 'Unresolved · likely negative', expected: [2, 3], asatExpected: [3, 4] },
      alsoFound: ['Compensation Claim'],
      questions: [
        { q: 'How would you rate the way we handled your 4-hour delay?', a: '4 of 5', alternatives: ['Were you offered anything during the delay?', 'Did the delay updates arrive when you needed them?'] },
        { q: 'What could have made the delay experience better?', a: '"The agent could not do much, but the lounge pass she sent made the wait fine."' },
      ],
      outcome: 'Survey Completed · Jul 12, 16:50', alert: null,
      phone: '+1 223-555-4583', email: 'lucas.dubois@example.com',
    },
    'INT-7163904': {
      summary: 'The system read this compensation case as resolved — the EU261 claim was approved during the chat and the payment date confirmed.',
      read: { tone: 'positive', label: 'Resolved · likely positive', expected: [4, 5], asatExpected: [5, 5] },
      alsoFound: [],
      questions: [
        { q: 'How would you rate how we handled your compensation claim?', a: '5 of 5', alternatives: ['Was the compensation amount explained clearly?', 'Do you know when the payment will arrive?'] },
        { q: 'What could have made the claim experience better?', a: '"Approved on the spot — that never happens."' },
      ],
      outcome: 'Survey Completed · Jul 14, 10:55', alert: null,
      phone: '+1 223-555-4639', email: 'sara.haddad@example.com',
    },
    'INT-7170125': {
      summary: 'The system read this missed connection as unresolved — the chat was closed by the assistant before a rebooking agent was available.',
      read: { tone: 'negative', label: 'Unresolved · likely negative', expected: [1, 2], asatExpected: [2, 3] },
      alsoFound: ['Bot Transfer Friction'], questions: [],
      outcome: 'No survey was sent — no matching skill or team.', alert: null,
      phone: '+1 223-555-4701', email: 'jonas.berg@example.com',
    },
    'INT-7176231': {
      summary: 'The system read this compensation claim as resolved — the payout was approved during the chat.',
      read: { tone: 'positive', label: 'Resolved · likely positive', expected: [4, 5], asatExpected: [5, 5] },
      alsoFound: [], questions: [],
      outcome: 'No survey was sent — the customer has opted out of surveys.', alert: null,
      phone: '+1 223-555-4812', email: 'freya.larsen@example.com',
    },
    'INT-7176342': {
      summary: null, read: null, alsoFound: [], questions: [],
      outcome: 'No survey was sent — this interaction fell outside the recency window for a follow-up.', alert: null,
      phone: '+1 223-555-4923', email: 'hassan.ali@example.com',
    },
    'INT-7176453': {
      summary: null, read: null, alsoFound: [], questions: [],
      outcome: 'No survey was sent — the interaction was too short to generate a reliable read.', alert: null,
      phone: '+1 223-555-5034', email: 'clara.dubois@example.com',
    },
  },

  'Billing and Refund Recovery · All Digital': {
    'INT-8201133': {
      summary: 'The system read this refund case as resolved — the refund was issued in the chat and a 3–5 day arrival window given.',
      read: { tone: 'positive', label: 'Resolved · likely positive', expected: [4, 5], asatExpected: [5, 5] },
      alsoFound: [],
      questions: [
        { q: 'How would you rate how we handled your refund today?', a: '5 of 5', alternatives: ['Were you told when the refund will arrive?', 'Was the refund amount what you expected?'] },
        { q: 'What could have made the refund experience better?', a: '"Nothing — I had the confirmation before the chat ended."' },
      ],
      outcome: 'Survey Completed · Jul 2, 10:34', alert: null,
      phone: '+1 223-555-5108', email: 'grace.kim@example.com',
    },
    'INT-8207448': {
      summary: 'The system read this duplicate charge as resolved — the second charge was reversed and the customer was sent the reference number.',
      read: { tone: 'positive', label: 'Resolved · likely positive', expected: [4, 5], asatExpected: [5, 5] },
      alsoFound: ['Payment Failure'],
      questions: [
        { q: 'How would you rate the way we fixed the duplicate charge?', a: '4 of 5', alternatives: ['Was the reversal explained clearly?', 'How quickly did we sort out the double charge?'] },
        { q: 'What could have made this experience better?', a: null },
      ],
      outcome: 'Customer stopped after Q1 · Jul 3, 14:40', alert: null,
      phone: '+1 223-555-5171', email: 'ahmed.siddiqui@example.com',
    },
    'INT-8213790': {
      summary: 'The system read this refund case as partially resolved — a refund was issued, but a cancellation fee was deducted and the customer questioned it.',
      read: { tone: 'mixed', label: 'Partially resolved · mixed', expected: [3, 4], asatExpected: [4, 5] },
      alsoFound: ['Billing Dispute'],
      questions: [
        { q: 'How would you rate how we handled your refund today?', a: '1 of 5', alternatives: ['Was the deducted fee explained before the refund?', 'Was the refund amount what you expected?'] },
        { q: 'What could have made the refund experience better?', a: '"Nobody mentioned a fee until the money arrived short. I would have cancelled differently."' },
      ],
      outcome: 'Survey Completed · Jul 5, 09:44',
      alert: { name: 'Detractor alert', rule: 'CSAT ≤ 2 on a Partial Refund interaction', sentTo: 'Billing supervisor (Dana M.)', via: 'Email', when: 'Jul 5, 09:46' },
      phone: '+1 223-555-5236', email: 'isabella.costa@example.com',
    },
    'INT-8220015': {
      summary: 'The system read this cancellation as completed — the subscription was ended and a pro-rated refund confirmed.',
      read: { tone: 'mixed', label: 'Completed · mixed', expected: [3, 4], asatExpected: [4, 5] },
      alsoFound: [],
      questions: [
        { q: 'How would you rate the cancellation process today?', a: null, alternatives: ['Was the pro-rated refund explained clearly?', 'How easy was it to cancel?'] },
        { q: 'What could have made the cancellation easier?', a: null },
      ],
      outcome: 'Not started — the customer has not opened the survey.', alert: null,
      phone: '+1 223-555-5290', email: 'ravi.nair@example.com',
    },
    'INT-8226672': {
      summary: 'The system read this payment failure as resolved — the card was updated and the pending invoice paid during the chat.',
      read: { tone: 'positive', label: 'Resolved · likely positive', expected: [4, 5], asatExpected: [5, 5] },
      alsoFound: [],
      questions: [
        { q: 'How would you rate the help you got with the failed payment?', a: '4 of 5', alternatives: ['Was the reason for the failed payment clear?', 'How easy was it to update your card?'] },
        { q: 'What could have made this experience better?', a: '"Fine, though I had to re-enter the card twice."' },
      ],
      outcome: 'Survey Completed · Jul 8, 12:30', alert: null,
      phone: '+1 223-555-5347', email: 'chloe.martin@example.com',
    },
    'INT-8233309': {
      summary: 'The system read this billing dispute as unresolved — the disputed charge was escalated for review with a 5-day turnaround.',
      read: { tone: 'negative', label: 'Unresolved · likely negative', expected: [1, 3], asatExpected: [2, 4] },
      alsoFound: ['Invoice Correction'],
      questions: [
        { q: 'How would you rate how we handled your billing dispute?', a: '3 of 5', alternatives: ['Do you know what happens next with your dispute?', 'Was the 5-day review timeline acceptable?'] },
        { q: 'What could have made the dispute experience better?', a: null },
      ],
      outcome: 'Customer stopped after Q1 · Jul 9, 16:02', alert: null,
      phone: '+1 223-555-5402', email: 'tariq.hassan@example.com',
    },
    'INT-8239941': {
      summary: 'The system read this invoice case as resolved — the wrong VAT number was corrected and a new invoice emailed within the chat.',
      read: { tone: 'positive', label: 'Resolved · likely positive', expected: [4, 5], asatExpected: [5, 5] },
      alsoFound: [],
      questions: [
        { q: 'How would you rate how we corrected your invoice?', a: '5 of 5', alternatives: ['Did the corrected invoice have everything you needed?', 'How quickly did we fix your invoice?'] },
        { q: 'What could have made this experience better?', a: '"Corrected invoice in my inbox in four minutes. Perfect."' },
      ],
      outcome: 'Survey Completed · Jul 11, 11:40', alert: null,
      phone: '+1 223-555-5468', email: 'emily.zhang@example.com',
    },
    'INT-8246580': {
      summary: 'The system read this refund case as unresolved — this was the customer\'s second contact about the same refund and no date could be given.',
      read: { tone: 'negative', label: 'Unresolved · likely negative', expected: [1, 3], asatExpected: [2, 4] },
      alsoFound: ['Repeat Contact'],
      questions: [
        { q: 'How would you rate how we handled your refund today?', a: '2 of 5', alternatives: ['Is this the first time you have contacted us about this refund?', 'Were you told when the refund will arrive?'] },
        { q: 'What could have made the refund experience better?', a: '"Second chat, same answer: it is being processed. Give me a date."' },
      ],
      outcome: 'Survey Completed · Jul 13, 09:01',
      alert: { name: 'Detractor alert', rule: 'CSAT ≤ 2 on a repeat Refund Processing contact', sentTo: 'Billing supervisor (Dana M.)', via: 'Email', when: 'Jul 13, 09:03' },
      phone: '+1 223-555-5521', email: 'pedro.alves@example.com',
    },
    'INT-8252217': {
      summary: null, read: null, alsoFound: [], questions: [],
      outcome: 'No survey was sent — this interaction was flagged as internal and excluded from customer surveys.', alert: null,
      phone: '+1 223-555-5587', email: 'fatima.alsayed@example.com',
    },
    'INT-8258866': {
      summary: 'The system read this billing dispute as resolved — the disputed charge was waived as a goodwill gesture during the chat.',
      read: { tone: 'positive', label: 'Resolved · likely positive', expected: [4, 5], asatExpected: [5, 5] },
      alsoFound: [], questions: [],
      outcome: 'No survey was sent — the customer has opted out of surveys.', alert: null,
      phone: '+1 223-555-5644', email: 'henry.walsh@example.com',
    },
    'INT-8264977': {
      summary: 'The system read this refund case as unresolved — no routing team was available to close the loop.',
      read: { tone: 'negative', label: 'Unresolved · likely negative', expected: [1, 2], asatExpected: [2, 3] },
      alsoFound: [], questions: [],
      outcome: 'No survey was sent — no matching skill or team.', alert: null,
      phone: '+1 223-555-5755', email: 'nora.jensen@example.com',
    },
    'INT-8265088': {
      summary: null, read: null, alsoFound: [], questions: [],
      outcome: 'No survey was sent — this interaction fell outside the recency window for a follow-up.', alert: null,
      phone: '+1 223-555-5866', email: 'omar.bashir@example.com',
    },
    'INT-8265199': {
      summary: 'The system read this invoice case as resolved — the correction was confirmed during the chat.',
      read: { tone: 'positive', label: 'Resolved · likely positive', expected: [4, 5], asatExpected: [5, 5] },
      alsoFound: [], questions: [],
      outcome: 'No survey was sent — the interaction happened outside the configured send window.', alert: null,
      phone: '+1 223-555-5977', email: 'sofia.russo@example.com',
    },
  },

  'Omnichannel Escalation Recovery': {
    'INT-9301207': {
      summary: 'The system read this hand-off as smooth — the chat was transferred to voice with the transcript attached and the issue closed on the call.',
      read: { tone: 'positive', label: 'Resolved · likely positive', expected: [4, 5], asatExpected: [5, 5] },
      alsoFound: ['Account Access'],
      questions: [
        { q: 'How would you rate the hand-over from chat to a phone call today?', a: '4 of 5', alternatives: ['Did you have to repeat your issue after the transfer?', 'How long did you wait for the call after the chat?'] },
        { q: 'What could have made the hand-over better?', a: '"The agent on the phone already knew everything. Just a slightly long wait."' },
      ],
      outcome: 'Survey Completed · Jul 4, 13:40', alert: null,
      phone: '+1 223-555-6112', email: 'nadia.petrova@example.com',
    },
    'INT-9307734': {
      summary: 'The system read this case as unresolved — this was the customer\'s third contact in two weeks about the same account lock.',
      read: { tone: 'negative', label: 'Unresolved · likely negative', expected: [1, 2], asatExpected: [2, 3] },
      alsoFound: ['Account Access'],
      questions: [
        { q: 'How would you rate how we handled your issue this time?', a: '2 of 5', alternatives: ['Is your account lock finally fixed?', 'How many times have you had to contact us about this?'] },
        { q: 'What could have made this experience better?', a: '"Three chats, three different agents, same lock. Someone needs to own it."' },
      ],
      outcome: 'Survey Completed · Jul 5, 17:20',
      alert: { name: 'Repeat-contact alert', rule: 'CSAT ≤ 2 on a third contact within 14 days', sentTo: 'Escalations supervisor (Jordan P.)', via: 'Email', when: 'Jul 5, 17:22' },
      phone: '+1 223-555-6179', email: 'caleb.johnson@example.com',
    },
    'INT-9313351': {
      summary: 'The system read this callback case as failed — a 2 pm callback was promised in the chat and had not happened by the time the survey was sent.',
      read: { tone: 'negative', label: 'Failed · likely negative', expected: [1, 2], asatExpected: [2, 3] },
      alsoFound: ['Supervisor Escalation'],
      questions: [
        { q: 'How would you rate the callback we promised you?', a: '1 of 5', alternatives: ['Did the callback arrive at the promised time?', 'Was the callback time you were given realistic?'] },
        { q: 'What could have made this experience better?', a: null },
      ],
      outcome: 'Customer stopped after Q1 · Jul 7, 09:48',
      alert: { name: 'Detractor alert', rule: 'CSAT ≤ 2 on a Callback Not Received interaction', sentTo: 'Escalations supervisor (Jordan P.)', via: 'Email', when: 'Jul 7, 09:50' },
      phone: '+1 223-555-6233', email: 'yuki.tanaka@example.com',
    },
    'INT-9319986': {
      summary: 'The system read this escalation as resolved — a supervisor joined the chat within 6 minutes and approved the exception the customer asked for.',
      read: { tone: 'positive', label: 'Resolved · likely positive', expected: [4, 5], asatExpected: [5, 5] },
      alsoFound: [],
      questions: [
        { q: 'How would you rate the way your case was escalated today?', a: '5 of 5', alternatives: ['How long did you wait for the supervisor?', 'Did the supervisor resolve what the first agent could not?'] },
        { q: 'What could have made the escalation better?', a: '"Six minutes to a supervisor and a yes. Nothing to add."' },
      ],
      outcome: 'Survey Completed · Jul 8, 11:58', alert: null,
      phone: '+1 223-555-6298', email: 'sofia.hernandez@example.com',
    },
    'INT-9326604': {
      summary: 'The system read this case as handled — the customer looped twice in the assistant before reaching an agent, who then resolved the query.',
      read: { tone: 'mixed', label: 'Handled · mixed', expected: [3, 4], asatExpected: [4, 5] },
      alsoFound: [],
      questions: [
        { q: 'How would you rate getting from the assistant to a person today?', a: null, alternatives: ['How many attempts did it take to reach an agent?', 'Did the assistant understand what you needed?'] },
        { q: 'What could have made it easier to reach an agent?', a: null },
      ],
      outcome: 'Not started — the customer has not opened the survey.', alert: null,
      phone: '+1 223-555-6354', email: 'ibrahim.yusuf@example.com',
    },
    'INT-9332240': {
      summary: 'The system read this reopened case as resolved — the original fix was re-applied and confirmed working in the chat.',
      read: { tone: 'positive', label: 'Resolved · likely positive', expected: [4, 5], asatExpected: [5, 5] },
      alsoFound: ['Technical Troubleshooting'],
      questions: [
        { q: 'How would you rate how we handled your reopened case?', a: '3 of 5', alternatives: ['Is the issue fixed for good this time?', 'Was it easy to reopen your case?'] },
        { q: 'What could have made this experience better?', a: '"Fixed again, yes — but it is the second time. I am waiting to see if it holds."' },
      ],
      outcome: 'Survey Completed · Jul 11, 10:47', alert: null,
      phone: '+1 223-555-6417', email: 'laura.fischer@example.com',
    },
    'INT-9338877': {
      summary: 'The system read this hand-off as mixed — the customer had to repeat the order number after the transfer, though the issue was then resolved.',
      read: { tone: 'mixed', label: 'Resolved with friction · mixed', expected: [3, 4], asatExpected: [4, 5] },
      alsoFound: ['Delivery Delay'],
      questions: [
        { q: 'How would you rate the hand-over from chat to a phone call today?', a: '5 of 5', alternatives: ['Did you have to repeat your issue after the transfer?', 'Was the person on the phone able to help straight away?'] },
        { q: 'What could have made the hand-over better?', a: '"Had to give the order number again, but the agent sorted it in two minutes."' },
      ],
      outcome: 'Survey Completed · Jul 12, 15:25', alert: null,
      phone: '+1 223-555-6480', email: 'mateo.silva@example.com',
    },
    'INT-9345513': {
      summary: 'The system read this case as unresolved — the customer asked for the agent from their last contact and no routing skill matched.',
      read: { tone: 'negative', label: 'Unresolved · likely negative', expected: [1, 2], asatExpected: [2, 3] },
      alsoFound: [], questions: [],
      outcome: 'No survey was sent — no matching skill or team.', alert: null,
      phone: '+1 223-555-6536', email: 'zara.ahmed@example.com',
    },
    'INT-9352159': {
      summary: 'The system read this escalation as resolved — the supervisor callback came 20 minutes after the chat and the refund exception was approved.',
      read: { tone: 'positive', label: 'Resolved · likely positive', expected: [4, 5], asatExpected: [5, 5] },
      alsoFound: ['Refund Processing'],
      questions: [
        { q: 'How would you rate the way your case was escalated today?', a: '4 of 5', alternatives: ['How long did you wait for the supervisor?', 'Did the escalation get you a different answer?'] },
        { q: 'What could have made the escalation better?', a: '"Good outcome. Would have preferred to stay in the chat rather than wait for a call."' },
      ],
      outcome: 'Survey Completed · Jul 15, 09:12', alert: null,
      phone: '+1 223-555-6591', email: 'thomas.muller@example.com',
    },
    'INT-9358260': {
      summary: null, read: null, alsoFound: [], questions: [],
      outcome: 'No survey was sent — this interaction was flagged as internal and excluded from customer surveys.', alert: null,
      phone: '+1 223-555-6647', email: 'grace.oduya@example.com',
    },
    'INT-9358371': {
      summary: 'The system read this hand-off as smooth — the issue was resolved on the transferred call.',
      read: { tone: 'positive', label: 'Resolved · likely positive', expected: [4, 5], asatExpected: [5, 5] },
      alsoFound: [], questions: [],
      outcome: 'No survey was sent — the customer has opted out of surveys.', alert: null,
      phone: '+1 223-555-6758', email: 'victor.hale@example.com',
    },
    'INT-9358482': {
      summary: null, read: null, alsoFound: [], questions: [],
      outcome: 'No survey was sent — this interaction fell outside the recency window for a follow-up.', alert: null,
      phone: '+1 223-555-6869', email: 'nadia.costa@example.com',
    },
    'INT-9358593': {
      summary: 'The system read this repeat-contact case as unresolved — the customer was reaching out for a second time with no new update.',
      read: { tone: 'negative', label: 'Unresolved · likely negative', expected: [1, 2], asatExpected: [2, 3] },
      alsoFound: [], questions: [],
      outcome: 'No survey was sent — the interaction happened outside the configured send window.', alert: null,
      phone: '+1 223-555-6970', email: 'samir.khoury@example.com',
    },
  },

  'Product Feedback - Beta Testers': {
    'INT-6401118': {
      summary: 'The system read this sync issue as unresolved — changes made on desktop did not appear on mobile and the agent logged a bug rather than a fix.',
      read: { tone: 'negative', label: 'Unresolved · likely negative', expected: [2, 3], asatExpected: [3, 4] },
      alsoFound: ['Bug Report'],
      questions: [
        { q: 'How would you rate your experience with mobile sync in the beta?', a: '2 of 5', alternatives: ['How often do your desktop changes fail to appear on mobile?', 'Did the workaround the agent suggested help?'] },
        { q: 'What would make the mobile app more useful for you?', a: '"Sync. That is it. I stopped trusting the mobile numbers."' },
      ],
      outcome: 'Survey Completed · Jul 1, 10:38',
      alert: { name: 'Beta blocker alert', rule: 'CSAT ≤ 2 on a Mobile App Sync interaction', sentTo: 'Product owner (Maya R.)', via: 'Email', when: 'Jul 1, 10:40' },
      phone: '+1 223-555-7109', email: 'jordan.lee@example.com',
    },
    'INT-6407752': {
      summary: 'The system read this onboarding session as completed — the tester finished setup in one session and imported two data sources.',
      read: { tone: 'positive', label: 'Completed · likely positive', expected: [4, 5], asatExpected: [5, 5] },
      alsoFound: [],
      questions: [
        { q: 'How would you rate getting started with the beta?', a: '4 of 5', alternatives: ['How long did setup take you?', 'Did the data import work first time?'] },
        { q: 'What would have made onboarding smoother?', a: '"Good overall. The import step needed a second read of the instructions."' },
      ],
      outcome: 'Survey Completed · Jul 2, 16:02', alert: null,
      phone: '+1 223-555-7163', email: 'priyanka.rao@example.com',
    },
    'INT-6413397': {
      summary: 'The system read this export issue as partially resolved — CSV export worked, but the PDF layout cut off the last column.',
      read: { tone: 'mixed', label: 'Partially resolved · mixed', expected: [3, 4], asatExpected: [4, 5] },
      alsoFound: [],
      questions: [
        { q: 'How would you rate exporting your dashboard in the beta?', a: '3 of 5', alternatives: ['Which export format do you use most?', 'Did the exported file look the way you expected?'] },
        { q: 'What would make exports more useful?', a: null },
      ],
      outcome: 'Customer stopped after Q1 · Jul 4, 11:30', alert: null,
      phone: '+1 223-555-7228', email: 'ethan.clarke@example.com',
    },
    'INT-6420030': {
      summary: 'The system read this notifications question as resolved — the tester found the per-channel mute option with the agent\'s guidance.',
      read: { tone: 'positive', label: 'Resolved · likely positive', expected: [4, 5], asatExpected: [5, 5] },
      alsoFound: [],
      questions: [
        { q: 'How would you rate managing your notifications in the beta?', a: '5 of 5', alternatives: ['Were the notification options easy to find?', 'Are you getting the right amount of notifications now?'] },
        { q: 'What would make notifications better?', a: '"Exactly what I wanted once I knew where it was."' },
      ],
      outcome: 'Survey Completed · Jul 6, 10:15', alert: null,
      phone: '+1 223-555-7284', email: 'aisha.bello@example.com',
    },
    'INT-6426661': {
      summary: 'The system read this import session as stalled — the tester hit a file-size limit twice and ended the chat without completing the import.',
      read: { tone: 'negative', label: 'Stalled · likely negative', expected: [2, 3], asatExpected: [3, 4] },
      alsoFound: ['Onboarding Flow'],
      questions: [
        { q: 'How would you rate importing your data into the beta?', a: null, alternatives: ['Did the file-size limit block your import?', 'How clear was the import error message?'] },
        { q: 'What would make the import easier?', a: null },
      ],
      outcome: 'Not started — the tester has not opened the survey.', alert: null,
      phone: '+1 223-555-7341', email: 'victor.novak@example.com',
    },
    'INT-6433298': {
      summary: 'The system read this sync issue as partially resolved — a manual refresh brought the mobile data up to date during the chat.',
      read: { tone: 'mixed', label: 'Partially resolved · mixed', expected: [3, 4], asatExpected: [4, 5] },
      alsoFound: [],
      questions: [
        { q: 'How would you rate your experience with mobile sync in the beta?', a: '1 of 5', alternatives: ['Did the manual refresh fix it for good?', 'How often do your desktop changes fail to appear on mobile?'] },
        { q: 'What would make the mobile app more useful for you?', a: '"A manual refresh is not a fix. It was out of date again an hour later."' },
      ],
      outcome: 'Survey Completed · Jul 9, 17:40',
      alert: { name: 'Beta blocker alert', rule: 'CSAT ≤ 2 on a Mobile App Sync interaction', sentTo: 'Product owner (Maya R.)', via: 'Email', when: 'Jul 9, 17:42' },
      phone: '+1 223-555-7396', email: 'hana.sato@example.com',
    },
    'INT-6439934': {
      summary: 'The system read this request as unmet — the tester asked for scheduled reports, which are not on the beta roadmap.',
      read: { tone: 'negative', label: 'Unmet need · likely negative', expected: [2, 3], asatExpected: [3, 4] },
      alsoFound: ['Dashboard Export'],
      questions: [
        { q: 'How would you rate the response to your feature request?', a: '4 of 5', alternatives: ['Was it clear whether your request will be built?', 'Did we suggest a workaround that helps?'] },
        { q: 'What feature would make the biggest difference for you?', a: '"Scheduled reports. They said no for now, but explained why — I can live with that."' },
      ],
      outcome: 'Survey Completed · Jul 11, 11:05', alert: null,
      phone: '+1 223-555-7452', email: 'daniel.osei@example.com',
    },
    'INT-6446570': {
      summary: 'The system read this bug report as resolved — the filter-reset bug was reproduced and a fix confirmed for the next beta build.',
      read: { tone: 'positive', label: 'Resolved · likely positive', expected: [4, 5], asatExpected: [5, 5] },
      alsoFound: [],
      questions: [
        { q: 'How would you rate how we handled your bug report?', a: '4 of 5', alternatives: ['Was the bug reproduced while you were in the chat?', 'Do you know when the fix will ship?'] },
        { q: 'What would make reporting bugs easier?', a: '"A way to attach a screen recording from inside the app."' },
      ],
      outcome: 'Survey Completed · Jul 13, 14:48', alert: null,
      phone: '+1 223-555-7517', email: 'lena.hoffmann@example.com',
    },
    'INT-6453206': {
      summary: null, read: null, alsoFound: [], questions: [],
      outcome: 'No survey was sent — this interaction was flagged as internal and excluded from customer surveys.', alert: null,
      phone: '+1 223-555-7573', email: 'omar.farouk@example.com',
    },
    'INT-6459843': {
      summary: 'The system read this export question as unresolved — the chat arrived outside beta-support hours and no team was available.',
      read: { tone: 'negative', label: 'Unresolved · likely negative', expected: [2, 3], asatExpected: [3, 4] },
      alsoFound: [], questions: [],
      outcome: 'No survey was sent — no matching skill or team.', alert: null,
      phone: '+1 223-555-7630', email: 'mia.andersen@example.com',
    },
    'INT-6465974': {
      summary: 'The system read this notifications question as resolved — the tester found the mute option with the agent\'s guidance.',
      read: { tone: 'positive', label: 'Resolved · likely positive', expected: [4, 5], asatExpected: [5, 5] },
      alsoFound: [], questions: [],
      outcome: 'No survey was sent — the tester has opted out of surveys.', alert: null,
      phone: '+1 223-555-7681', email: 'felix.brandt@example.com',
    },
    'INT-6466085': {
      summary: null, read: null, alsoFound: [], questions: [],
      outcome: 'No survey was sent — this interaction fell outside the recency window for a follow-up.', alert: null,
      phone: '+1 223-555-7692', email: 'zainab.idris@example.com',
    },
    'INT-6466196': {
      summary: null, read: null, alsoFound: [], questions: [],
      outcome: 'No survey was sent — the interaction was too short to generate a reliable read.', alert: null,
      phone: '+1 223-555-7703', email: 'theo.walker@example.com',
    },
  },
}

function Stars({ n, size = 16 }: { n: number; size?: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={size} style={{ color: i < n ? 'var(--lyra-color-status-warning-medium)' : 'var(--lyra-slate-300)', fill: 'currentColor' }} />
      ))}
    </span>
  )
}

function TonePill({ tone, label }: { tone: 'positive' | 'negative' | 'mixed'; label: string }) {
  const c = tone === 'positive'
    ? { bg: 'var(--lyra-color-status-success-subtle)', fg: 'var(--lyra-color-status-success-strong)' }
    : tone === 'negative'
    ? { bg: 'var(--lyra-color-status-critical-subtle)', fg: 'var(--lyra-color-status-critical-strong)' }
    : { bg: 'var(--lyra-color-status-warning-subtle)', fg: 'var(--lyra-color-status-warning-strong)' }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: 'var(--radius-full)', background: c.bg, color: c.fg, font: `500 12px/16px ${FONT}`, whiteSpace: 'nowrap' }}>{label}</span>
  )
}

function DrawerSection({ label, accent, children }: { label: string; accent?: 'ai'; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ font: `500 12px/16px ${FONT}`, letterSpacing: '0.04em', textTransform: 'uppercase', color: accent === 'ai' ? 'var(--lyra-purple-700)' : 'var(--lyra-color-fg-secondary)', marginBottom: 'var(--space-2)' }}>{label}</div>
      <div style={{ border: `1px solid ${accent === 'ai' ? 'rgba(78,57,168,0.2)' : 'var(--lyra-color-border-soft)'}`, borderRadius: 'var(--radius-lg)', background: accent === 'ai' ? 'var(--lyra-color-bg-ai)' : 'var(--lyra-color-bg-surface-base)' }}>
        {children}
      </div>
    </div>
  )
}

/* Outcome taxonomy for the conversation-flow timeline — derived from the row, not hand-tagged per interaction. */
type OutcomeType = 'completed' | 'partial' | 'abandoned' | 'no_follow_up'
function deriveOutcomeType(row: ResponseRow): OutcomeType {
  if (row.sent === null) return 'no_follow_up'
  if (row.completed !== null) return 'completed'
  if (row.response !== null) return 'partial'
  return 'abandoned'
}
const OUTCOME_META: Record<OutcomeType, { bg: string; fg: string; icon: React.ReactNode; dot: string; label: string }> = {
  completed: { bg: 'var(--lyra-color-status-success-subtle)', fg: 'var(--lyra-color-status-success-strong)', icon: <CheckCircle2 size={12} />, dot: 'var(--lyra-color-status-success-strong)', label: 'Completed' },
  partial: { bg: 'var(--lyra-color-status-warning-subtle)', fg: 'var(--lyra-color-status-warning-strong)', icon: <CircleDashed size={12} />, dot: 'var(--lyra-color-status-warning-strong)', label: 'Partial' },
  abandoned: { bg: 'var(--lyra-color-status-critical-subtle)', fg: 'var(--lyra-color-status-critical-strong)', icon: <XCircle size={12} />, dot: 'var(--lyra-color-status-critical-strong)', label: 'Abandoned' },
  no_follow_up: { bg: 'var(--lyra-slate-100)', fg: 'var(--lyra-color-fg-secondary)', icon: <MinusCircle size={12} />, dot: 'var(--lyra-slate-400)', label: 'No follow-up needed' },
}
function OutcomePill({ type }: { type: OutcomeType }) {
  const m = OUTCOME_META[type]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', borderRadius: 'var(--radius-full)', background: m.bg, color: m.fg, font: `500 12px/16px ${FONT}`, whiteSpace: 'nowrap' }}>
      {m.icon}{m.label}
    </span>
  )
}

/* Vertical timeline node: a dot + connecting line on the left, content on the right. */
function TimelineNode({ color, last, children }: { color: string; last?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 10 }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, marginTop: 4, flexShrink: 0 }} />
        {!last && <span style={{ width: 2, flex: 1, background: 'var(--lyra-color-border-subtle)', marginTop: 2 }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0, paddingBottom: last ? 0 : 'var(--space-4)' }}>{children}</div>
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

function RatingBar({ value, expected, size = 5 }: { value: number | null; expected: [number, number] | null; size?: number }) {
  const segments = Array.from({ length: size }, (_, i) => {
    const pos = i + 1
    const inExpected = expected ? pos >= expected[0] && pos <= expected[1] : false
    const isActual = value !== null && pos <= value
    return { pos, inExpected, isActual }
  })
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      {segments.map(s => (
        <div key={s.pos} style={{
          width: 24, height: 6, borderRadius: 3,
          background: s.isActual
            ? (value !== null && expected && (value < expected[0] || value > expected[1])
              ? 'var(--lyra-purple-500)'
              : 'var(--lyra-color-status-success-strong)')
            : s.inExpected
              ? 'var(--lyra-slate-200)'
              : 'var(--lyra-slate-100)',
        }} />
      ))}
    </div>
  )
}

/* A rating question is a CSAT or ASAT question (its explicit `type`, else ASAT when it asks about the
   agent). An open-ended follow-up is the verbatim for whichever rating question came before it. */
type SurveyQuestion = CustomerDetail['questions'][number]
const ratingType = (q: SurveyQuestion): 'CSAT' | 'ASAT' | null =>
  q.type ?? (/\brate\b/i.test(q.q) ? (/\bagent\b/i.test(q.q) ? 'ASAT' : 'CSAT') : null)

function surveyLabels(questions: SurveyQuestion[]): string[] {
  let last: 'CSAT' | 'ASAT' = 'CSAT'
  return questions.map(q => {
    const type = ratingType(q)
    if (!type) return `${last} verbatim`
    last = type
    return `${type} question`
  })
}

const csatVerbatim = (score: number) =>
  score >= 4 ? '"Quick and easy — no complaints."' : score === 3 ? '"It got sorted, but it took longer than it should have."' : '"My issue still isn\'t fully resolved."'
const asatVerbatim = (score: number) =>
  score >= 4 ? '"The agent was patient and explained everything clearly."' : score === 3 ? '"Helpful in the end, but I had to explain my issue twice."' : '"The agent didn\'t seem to understand what I needed."'

/* The survey asks one rating question per metric the customer rated, each followed by its verbatim — so an
   interaction with both CSAT and ASAT shows both pairs. Hand-authored details only script their first
   metric; the other pair is filled in from the row's rating (verbatim answered only if the survey finished). */
function surveySteps(questions: SurveyQuestion[], row: ResponseRow): SurveyQuestion[] {
  if (questions.length === 0) return questions
  const asked = new Set(questions.map(ratingType))
  const done = row.completed !== null
  const out = [...questions]
  if (row.csat !== null && !asked.has('CSAT')) out.push(
    { q: 'How would you rate how we handled your issue today?', a: `${row.csat} of 5`, type: 'CSAT' },
    { q: 'What could have made your experience better?', a: done ? csatVerbatim(row.csat) : null },
  )
  if (row.asat !== null && !asked.has('ASAT')) out.push(
    { q: 'How would you rate the agent who helped you today?', a: `${row.asat} of 5`, type: 'ASAT' },
    { q: 'What could the agent have done better?', a: done ? asatVerbatim(row.asat) : null },
  )
  return out
}

/* `d.outcome` doubles as the footer timestamp line ("Survey Completed · Jul 1, 16:13") — drop the
   timestamp when reusing its reason text in prose elsewhere. */
const reasonFromOutcome = (outcome: string) => outcome.replace(/\s*·\s*[A-Za-z]{3} \d{1,2}, \d{2}:\d{2}$/, '')

/* A single sentence for the program manager, shown right under the CSAT/ASAT/Outcome strip: what the
   interaction was about and whether — and how — the survey was completed. Uses the hand-authored system
   read when there is one (completed/partial interactions), and falls back to the outcome's own reason
   (why no survey was sent, why it's still open) when there isn't. */
/* Two short, separately labeled facts rather than one run-on paragraph: what the system read happened in
   the interaction itself (story — absent for interactions with no transcript read), and, independently,
   what happened with the survey (survey — always shown except for a plain completed survey, since the
   Outcome pill already says "Completed"). Keeping them apart avoids reading like a single garbled story
   when the two sentences come from unrelated sources (a hand-authored chat summary vs. a derived outcome). */
function systemReadParts(row: ResponseRow, d: CustomerDetail, outcomeType: OutcomeType, questionLabels: string[]): { story: string | null; survey: string | null } {
  if (outcomeType === 'completed') return { story: d.summary ?? reasonFromOutcome(d.outcome), survey: null }
  if (outcomeType === 'partial') {
    const n = parseInt(d.outcome.match(/Q(\d+)/)?.[1] ?? '1', 10)
    const ratingSteps = questionLabels.filter(l => l.endsWith('question'))
    const stoppedAt = ratingSteps[n - 1] ?? `question ${n}`
    return { story: d.summary, survey: `Customer answered the ${stoppedAt}, then stopped — the rest of the survey went unanswered.` }
  }
  // 'no_follow_up' (not eligible / out of coverage) and 'abandoned' (sent but no response).
  const reason = reasonFromOutcome(d.outcome)
  return { story: d.summary, survey: d.summary ? reason : `${reason}${row.topic ? ` (${row.topic})` : ''}` }
}

function CustomerDrawer({ row, detail: d, programAlertCount, onClose }: { row: ResponseRow; detail: CustomerDetail; programAlertCount: number; onClose: () => void }) {

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const surveySent = row.sent !== null
  const openEndedAnswer = d.questions[1]?.a && !/^\d of 5$/.test(d.questions[1].a) ? d.questions[1].a : null
  const lowRatingReason = openEndedAnswer ?? d.summary

  const initials = agentName(row.agent).split(' ').map(w => w[0]).join('').slice(0, 2)
  const outcomeType = deriveOutcomeType(row)
  const outcomeMeta = OUTCOME_META[outcomeType]

  const csatGot = row.csat
  const asatGot = row.asat
  const steps = surveySteps(d.questions, row)
  const questionLabels = surveyLabels(steps)
  const notAsked = row.response !== null
  const narrative = systemReadParts(row, d, outcomeType, questionLabels)

  const SH = { font: `500 12px/16px ${FONT}`, letterSpacing: '0.05em', textTransform: 'uppercase' as const, color: 'var(--lyra-color-fg-secondary)' }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(2px)' }} />
      <aside
        role="dialog"
        aria-label={`${agentName(row.agent)} interaction with ${row.customer}`}
        style={{ position: 'relative', width: '40%', minWidth: 480, maxWidth: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--lyra-color-bg-surface-base)', borderLeft: '1px solid var(--lyra-color-border-soft)', boxShadow: '-8px 0 30px rgba(0,0,0,0.08)' }}
      >
        {/* ── Header ── */}
        <div style={{ padding: '20px 24px 16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-full)', background: 'linear-gradient(135deg, var(--lyra-brand-50), var(--lyra-brand-100))', color: 'var(--lyra-brand-700)', display: 'grid', placeItems: 'center', font: `600 15px/1 ${FONT}`, flexShrink: 0, border: '2px solid var(--lyra-brand-200)' }}>{initials}</div>
            <div>
              <div style={{ font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>Agent</div>
              <div style={{ font: `600 17px/22px ${FONT}`, letterSpacing: '-0.01em', color: 'var(--lyra-color-fg-default)' }}>{agentName(row.agent)}</div>
            </div>
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

        {/* ── Interaction + contact details — the same fields as the table row, plus who to reach out to ── */}
        <dl style={{ margin: '0 24px 16px', padding: '10px 14px', display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', rowGap: 10, columnGap: 16, borderRadius: 10, border: '1px solid var(--lyra-color-border-subtle)' }}>
          {([
            ['Customer', row.customer, 1],
            ['Channel', 'Chat', 1],
            ['Interaction ID', pseudoUuid(row.id), 1],
            ['Survey sent', row.sent ?? 'Not sent', 1],
            ['Company', companyFor(row.customer), 1],
            ['Phone', d.phone, 1],
            ['Email', emailFor(row.customer, d.email), 2],
          ] as [string, string, number][]).map(([label, value, span]) => (
            <div key={label} style={{ minWidth: 0, gridColumn: `span ${span}` }}>
              <dt style={{ font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>{label}</dt>
              <dd title={value} style={{ margin: '2px 0 0', font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{value}</dd>
            </div>
          ))}
        </dl>

        {/* ── Scores strip ── */}
        <div style={{ padding: '0 24px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {[
            { label: 'CSAT', val: csatGot, color: csatGot !== null && csatGot <= 2 ? 'var(--lyra-color-status-critical-strong)' : csatGot !== null && csatGot >= 4 ? 'var(--lyra-color-status-success-strong)' : 'var(--lyra-color-fg-default)' },
            { label: 'ASAT', val: asatGot, color: asatGot !== null && asatGot <= 2 ? 'var(--lyra-color-status-critical-strong)' : asatGot !== null && asatGot >= 4 ? 'var(--lyra-color-status-success-strong)' : 'var(--lyra-color-fg-default)' },
          ].map(m => (
            <div key={m.label} style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--lyra-color-bg-surface-canvas)', border: '1px solid var(--lyra-color-border-subtle)', textAlign: 'center' }}>
              <div style={{ ...SH, marginBottom: 4 }}>{m.label}</div>
              {m.val !== null
                ? <div style={{ font: `600 22px/26px ${FONT}`, color: m.color }}>{m.val}<span style={{ font: `400 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>/5</span></div>
                : <div style={{ font: `400 14px/26px ${FONT}`, color: 'var(--lyra-color-fg-disabled)' }}>{notAsked ? 'Not asked' : '--'}</div>}
            </div>
          ))}
          <div style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--lyra-color-bg-surface-canvas)', border: '1px solid var(--lyra-color-border-subtle)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <div style={{ ...SH }}>Outcome</div>
            <ResponseStatus status={row.status} align="center" />
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* 1. Alert */}
          {d.alert ? (
            <div style={{ borderRadius: '0 12px 12px 0', border: '1px solid var(--lyra-color-border-soft)', borderLeft: '4px solid var(--lyra-color-status-critical-strong)', background: 'var(--lyra-color-bg-surface-base)', padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Bell size={15} style={{ color: 'var(--lyra-color-status-critical-strong)', flexShrink: 0 }} />
                <span style={{ font: `600 14px/20px ${FONT}`, color: 'var(--lyra-color-status-critical-strong)' }}>Alert triggered</span>
              </div>
              <div style={{ font: `400 14px/22px ${FONT}`, color: 'var(--lyra-color-fg-default)', marginBottom: 10 }}>
                {d.alert.rule}
              </div>
              <div style={{ font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>
                Sent to {d.alert.sentTo} · {d.alert.via} · {d.alert.when}
              </div>
              {lowRatingReason && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--lyra-color-border-subtle)' }}>
                  <div style={{ ...SH, marginBottom: 6 }}>Why the low rating</div>
                  <p style={{ margin: 0, font: `400 14px/22px ${FONT}`, color: 'var(--lyra-color-fg-default)', fontStyle: 'italic' }}>{lowRatingReason}</p>
                </div>
              )}
            </div>
          ) : (
            <div style={{ borderRadius: 10, border: '1px solid var(--lyra-color-border-soft)', background: 'var(--lyra-color-bg-surface-canvas)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 22, height: 22, borderRadius: 'var(--radius-full)', display: 'grid', placeItems: 'center', background: 'var(--lyra-slate-200)', color: 'var(--lyra-color-fg-secondary)', flexShrink: 0 }}><BellOff size={11} /></span>
              <span style={{ font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>
                No alert — {!surveySent ? 'no survey was sent' : row.csat === null ? 'no rating was given' : 'criteria not met'}
              </span>
            </div>
          )}

          {/* 2. Primary topic */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ ...SH }}>Primary topic detected</div>
              {row.topic && <AiChip />}
            </div>
            <div style={{ borderRadius: 10, border: '1px solid var(--lyra-color-border-soft)', padding: '12px 14px' }}>
              {row.topic ? (
                <>
                  <div style={{ marginBottom: TOPIC_DESCRIPTIONS[row.topic] ? 6 : 0 }}>
                    <span style={{ font: `600 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>{row.topic}</span>
                  </div>
                  {TOPIC_DESCRIPTIONS[row.topic] && (
                    <p style={{ margin: 0, font: `400 14px/22px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>{TOPIC_DESCRIPTIONS[row.topic]}</p>
                  )}
                </>
              ) : (
                <span style={{ font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>No topic detected</span>
              )}
            </div>
          </div>

          {/* 2b. System read — what this interaction was about, and separately, what happened with the survey */}
          <div style={{ borderRadius: 10, border: '1px solid var(--lyra-color-border-subtle)', background: 'var(--lyra-color-bg-ai)', padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <Sparkles size={14} style={{ color: 'var(--lyra-purple-700)', flexShrink: 0, marginTop: 3 }} />
            <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ font: `600 12px/16px ${FONT}`, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--lyra-purple-700)' }}>System read</div>
              {narrative.story && (
                <p style={{ margin: 0, font: `400 14px/22px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>
                  <span style={{ font: `600 14px/22px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>What happened — </span>{narrative.story}
                </p>
              )}
              {narrative.survey && (
                <p style={{ margin: 0, font: `400 14px/22px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>
                  <span style={{ font: `600 14px/22px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>Survey — </span>{narrative.survey}
                </p>
              )}
            </div>
          </div>

          {/* 4. Survey conversation */}
          <div>
            <div style={{ ...SH, marginBottom: 8 }}>Survey conversation</div>
            {steps.length > 0 ? (
              <div style={{ borderRadius: 12, border: '1px solid var(--lyra-color-border-soft)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 0 }}>
                {steps.map((item, i) => (
                  <TimelineNode key={i} color="var(--lyra-brand-600)">
                    <div style={{ marginBottom: 6, font: `500 12px/16px ${FONT}`, letterSpacing: '0.03em', color: 'var(--lyra-color-fg-secondary)' }}>{questionLabels[i]}</div>
                    <p style={{ margin: '0 0 10px', font: `600 14px/22px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>{item.q}</p>
                    <div style={{ padding: '6px 10px', borderRadius: 8, background: item.a ? 'var(--lyra-color-bg-surface-canvas)' : 'transparent', border: item.a ? '1px solid var(--lyra-color-border-subtle)' : '1px dashed var(--lyra-color-border-soft)' }}>
                      <div style={{ font: `500 12px/16px ${FONT}`, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--lyra-color-fg-secondary)', marginBottom: 2 }}>Response</div>
                      {item.a
                        ? (/^\d of 5$/.test(item.a)
                          ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Stars n={parseInt(item.a, 10)} size={13} /><span style={{ font: `500 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>{item.a}</span></span>
                          : <span style={{ font: `400 14px/22px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>{item.a}</span>)
                        : <span style={{ font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-disabled)' }}>No answer</span>}
                    </div>
                  </TimelineNode>
                ))}
                <TimelineNode color={outcomeMeta.dot} last>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ font: `500 12px/16px ${FONT}`, letterSpacing: '0.03em', color: 'var(--lyra-color-fg-secondary)' }}>Survey status</span>
                    <ResponseStatus status={row.status} secondarySide="left" />
                  </div>
                  <div style={{ font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-secondary)', marginTop: 4 }}>{d.outcome}</div>
                </TimelineNode>
              </div>
            ) : (
              <div style={{ borderRadius: 10, border: '1px solid var(--lyra-color-border-soft)', padding: '12px 14px' }}>
                <div style={{ font: `400 14px/22px ${FONT}`, color: 'var(--lyra-color-fg-secondary)', marginBottom: 10 }}>{d.outcome}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ font: `500 12px/16px ${FONT}`, letterSpacing: '0.03em', color: 'var(--lyra-color-fg-secondary)' }}>Survey status</span>
                  <ResponseStatus status={row.status} secondarySide="left" />
                </div>
              </div>
            )}
          </div>

        </div>

        {/* ── Footer ── */}
        <div style={{ padding: '10px 24px', borderTop: '1px solid var(--lyra-color-border-subtle)', display: 'flex', gap: 6, alignItems: 'center', font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-disabled)' }}>
          <Info size={11} style={{ flexShrink: 0 }} />
          <span>Illustrative data. Full verbatim analysis lives in a separate app.</span>
        </div>
      </aside>
    </div>
  )
}

/* ── Customer responses: sort-by-recency + alert visibility + filtering helpers ── */
const MONTH_INDEX: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 }
function parseRowDate(s: string | null): number {
  if (!s) return -Infinity
  const m = /^(\w{3}) (\d{1,2}), (\d{1,2}):(\d{2})$/.exec(s)
  if (!m) return -Infinity
  return new Date(2026, MONTH_INDEX[m[1]] ?? 0, Number(m[2]), Number(m[3]), Number(m[4])).getTime()
}
/* "Latest" = the most recent of completed/response/sent — whichever happened most recently for that row. */
function latestActivity(row: ResponseRow): number {
  return Math.max(parseRowDate(row.completed), parseRowDate(row.response), parseRowDate(row.sent))
}
/* Each program's existing alert narratives already address a named supervisor — reuse the same
   contact for any alert this rule derives, rather than inventing a new one per interaction. */
const PROGRAM_SUPERVISOR: Record<string, string> = {
  'Complaint Resolution Follow-Up': 'Billing supervisor (Dana M.)',
  'Flight Disruption Recovery': 'Airport Operations lead (Farah K.)',
  'Billing and Refund Recovery · All Digital': 'Billing supervisor (Dana M.)',
  'Omnichannel Escalation Recovery': 'Escalations supervisor (Jordan P.)',
  'Product Feedback - Beta Testers': 'Product owner (Maya R.)',
}

/* The rule, stated plainly: CSAT or ASAT at or below 3 triggers an alert. Applied uniformly to every
   row — not just the handful with a hand-authored alert narrative — so the table's Alert column and
   filter can never show a different answer than what the data actually says. A hand-authored alert
   (richer rule text, its own timestamp) wins when present; otherwise one is derived on the spot. */
function deriveAlert(row: ResponseRow, explicit: InteractionAlert, programName: string): InteractionAlert {
  if (explicit) return explicit
  const csatTriggers = row.csat !== null && row.csat <= 3
  const asatTriggers = row.asat !== null && row.asat <= 3
  if (!csatTriggers && !asatTriggers) return null
  const metric = csatTriggers ? 'CSAT' : 'ASAT'
  return {
    name: 'Detractor alert',
    rule: `${metric} ≤ 3 on a ${row.topic ?? 'general'} interaction`,
    sentTo: PROGRAM_SUPERVISOR[programName] ?? 'Program supervisor',
    via: 'Email',
    when: row.completed ?? row.response ?? row.sent ?? '—',
  }
}

function rowHasAlert(row: ResponseRow, details: Record<string, CustomerDetail>, programName: string): boolean {
  return !!deriveAlert(row, details[row.id]?.alert ?? null, programName)
}

function AlertCell({ hasAlert }: { hasAlert: boolean }) {
  return hasAlert ? (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, font: `500 13px/18px ${FONT}`, color: 'var(--lyra-color-status-critical-strong)', whiteSpace: 'nowrap' }}>
      <Bell size={13} />Alert detected
    </span>
  ) : (
    <Muted>—</Muted>
  )
}


/* Small segmented control for a 3-state filter (All / Yes / No) — same visual language as the
   response-tab and group-by pill controls already used elsewhere on this page. */
/* options are [value, label] pairs so a label can carry a real count (e.g. "Alert 10") while the
   underlying filter value stays a plain string — same [value, count] convention as the response tabs. */
function SegmentedFilter({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <div style={{ display: 'flex', height: 36, border: '1px solid var(--lyra-color-border-soft)', borderRadius: 'var(--radius-md)', overflow: 'hidden', flexShrink: 0 }}>
      {options.map(([opt, label], i) => (
        <button
          key={opt} type="button" onClick={() => onChange(opt)}
          style={{
            padding: '0 12px', font: `500 13px/18px ${FONT}`, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
            background: value === opt ? 'var(--lyra-color-bg-active-subtle)' : 'var(--lyra-color-bg-surface-base)',
            color: value === opt ? 'var(--lyra-color-fg-active-strong)' : 'var(--lyra-color-fg-secondary)',
            borderRight: i < options.length - 1 ? '1px solid var(--lyra-color-border-soft)' : 'none',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function ProgramDetailView({ program, onBack }: { program: typeof PROGRAMS[0]; onBack: () => void }) {
  const [search, setSearch] = useState('')
  const [topicFilterBar, setTopicFilterBar] = useState<string[]>([])
  const [custType, setCustType] = useState('All Customer Types')
  const [channel, setChannel] = useState('All Channels')
  const [tab, setTab] = useState('All')
  const [range, setRange] = useState<DateRange | null>(DEFAULT_RANGE)
  const [openRow, setOpenRow] = useState<ResponseRow | null>(null)
  const [rowStatusFilter, setRowStatusFilter] = useState<string[]>([])
  const [rowAgentFilter, setRowAgentFilter] = useState<string[]>([])
  const [rowTopicFilter, setRowTopicFilter] = useState<string[]>([])
  const [rowCsatFilter, setRowCsatFilter] = useState<string[]>([])
  const [rowAsatFilter, setRowAsatFilter] = useState<string[]>([])
  const [rowAlertFilter, setRowAlertFilter] = useState<'All' | 'Alert' | 'No alert'>('All')
  const responsesRef = useRef<HTMLDivElement>(null)

  const perf: PerfData = {
    inter: PROGRAM_INTER_OVERRIDE[program.n] ?? program.inter,
    elig: program.elig, sent: program.sent, rec: program.rec, comp: program.comp,
    csat: program.csat, asat: program.asat, alerts: program.alerts,
  }
  const status = program.tags.find(t => t === 'Active' || t === 'Inactive') || ''

  const q = search.trim().toLowerCase()
  const allRows = DETAIL_RESPONSES[program.n] ?? []
  const details = CUSTOMER_DETAILS[program.n] ?? {}
  // Tab/pagination counts cite the program's real totals from Program Performance (perf.inter/sent), not just
  // the handful of rows authored below — this table is a reviewable sample of that real population, and its
  // counts must never contradict the numbers shown above it.
  const totalInter = Math.round(perf.inter), totalSent = Math.round(perf.sent), totalNotSent = totalInter - totalSent
  const responseTabs: [string, number][] = [
    ['All', totalInter],
    ['Survey sent', totalSent],
    ['Not sent', totalNotSent],
  ]
  const tabTotal = tab === 'Survey sent' ? totalSent : tab === 'Not sent' ? totalNotSent : totalInter

  const rowStatusOptions = Array.from(new Set(allRows.map(r => r.status))).sort()
  const rowStatusGroups = (['Invitation Delivered', 'Skipped'] as const)
    .map(label => ({ label, options: Object.keys(STATUS_GROUP).filter(s => STATUS_GROUP[s] === label && rowStatusOptions.includes(s)) }))
    .filter(g => g.options.length > 0)
  const rowAgentOptions = Array.from(new Set(allRows.map(r => r.agent))).sort()
  const rowTopicOptions = Array.from(new Set(allRows.map(r => r.topic).filter((t): t is string => t !== null))).sort()
  const ratingOptions = ['5', '4', '3', '2', '1', 'No rating']
  const multiLabel = (v: string[], all: string, noun: string) => (v.length === 0 ? all : v.length === 1 ? v[0] : `${v.length} ${noun}`)
  const matchesRating = (val: number | null, selected: string[]) =>
    selected.length === 0 || (val === null ? selected.includes('No rating') : selected.includes(String(val)))

  const rows = allRows
    .filter(r =>
      (tab === 'All' || (tab === 'Survey sent' ? r.sent !== null : r.sent === null)) &&
      (!q || r.customer.toLowerCase().includes(q) || r.id.toLowerCase().includes(q)) &&
      (rowStatusFilter.length === 0 || rowStatusFilter.includes(r.status)) &&
      (rowAgentFilter.length === 0 || rowAgentFilter.includes(r.agent)) &&
      (rowTopicFilter.length === 0 || (r.topic !== null && rowTopicFilter.includes(r.topic))) &&
      matchesRating(r.csat, rowCsatFilter) &&
      matchesRating(r.asat, rowAsatFilter) &&
      (rowAlertFilter === 'All' || (rowAlertFilter === 'Alert' ? rowHasAlert(r, details, program.n) : !rowHasAlert(r, details, program.n)))
    )
    // Latest responses first by default: rows with an actual customer response lead, newest first;
    // rows still awaiting one (or never sent) follow, newest activity first within that group.
    .sort((a, b) => {
      const aResponded = a.response !== null ? 1 : 0
      const bResponded = b.response !== null ? 1 : 0
      return aResponded !== bResponded ? bResponded - aResponded : latestActivity(b) - latestActivity(a)
    })
  const PAGE_SIZE = 50
  const pageRows = rows.slice(0, PAGE_SIZE)
  const rowFiltersActive = rowStatusFilter.length + rowAgentFilter.length + rowTopicFilter.length + rowCsatFilter.length + rowAsatFilter.length > 0 || rowAlertFilter !== 'All'
  // Once search or a row filter narrows things down, show the exact match count instead of the
  // extrapolated population total — "3 of 2,572" would read as broken, not as a reviewable sample.
  const narrowedExactly = q !== '' || rowFiltersActive
  const footerTotal = narrowedExactly ? rows.length : tabTotal
  const clearRowFilters = () => { setRowStatusFilter([]); setRowAgentFilter([]); setRowTopicFilter([]); setRowCsatFilter([]); setRowAsatFilter([]); setRowAlertFilter('All') }

  const cell = (muted = false, bold = false): React.CSSProperties => ({
    padding: 'var(--space-3) var(--space-2)',
    font: `${bold ? 500 : 400} 14px/18px ${FONT}`,
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
          <div style={{ width: 250 }}>
            <MultiSelectField options={rowTopicOptions} value={topicFilterBar} onChange={setTopicFilterBar} mutedPlaceholder={false} labelOverride={multiLabel(topicFilterBar, 'All Topics', 'topics')} radius="var(--radius-md)" />
          </div>
          <FilterDropdown value={custType} options={['All Customer Types', 'New', 'Returning', 'VIP']} onChange={setCustType} />
          <FilterDropdown value={channel} options={['All Channels', 'SMS', 'WhatsApp', 'Email']} onChange={setChannel} />
          <div style={{ marginLeft: 'auto', borderLeft: '1px solid var(--lyra-color-border-subtle)', paddingLeft: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-secondary)', whiteSpace: 'nowrap' }}>
            {status && <StatusPill status={status} />}
            <span>·</span>
            <span>{program.expiredOn ? `Expired ${program.expiredOn}` : '30 days running'}</span>
            <span>·</span>
            <span>Chat</span>
          </div>
        </div>

        <div style={{ marginTop: 'var(--space-6)' }}>
          <ProgramPerformance programNames={[{ n: program.n, active: program.tags.includes('Active') }]} data={perf} deltas={PROGRAM_DELTAS[program.n] ?? OVERVIEW_DELTAS} periodNote={previousPeriodNote(range)} />
        </div>

        {/* Customer responses */}
        <div ref={responsesRef} style={{ marginTop: 'var(--space-6)', background: 'var(--lyra-color-bg-surface-base)', border: '1px solid var(--lyra-color-border-subtle)', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ padding: 'var(--space-5) var(--space-6)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--lyra-color-border-subtle)' }}>
            <div>
              <h3 style={{ font: `600 18px/24px ${FONT}`, letterSpacing: '-0.01em', margin: 0, color: 'var(--lyra-color-fg-default)' }}>Customer Responses</h3>
              <div style={{ font: `400 14px/16px ${FONT}`, color: 'var(--lyra-color-fg-secondary)', marginTop: 2 }}>A reviewable sample of every interaction in the period, whether or not a survey was sent.</div>
            </div>
            <div style={{ display: 'flex', border: '1px solid var(--lyra-color-border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              {responseTabs.map(([t, count], i) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    padding: '4px 16px', font: `500 12px/16px ${FONT}`, borderTop: 'none', borderBottom: 'none', borderLeft: 'none', cursor: 'pointer',
                    background: tab === t ? 'var(--lyra-color-bg-active-subtle)' : 'transparent',
                    color: tab === t ? 'var(--lyra-color-fg-active-strong)' : 'var(--lyra-color-fg-secondary)',
                    borderRight: i < responseTabs.length - 1 ? '1px solid var(--lyra-color-border-subtle)' : 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t} <span style={{ fontWeight: 400, opacity: 0.7 }}>{fmt(count)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Row-level filters — status, alert, ratings, agent, topic. Customer is already covered by the
              search box above (free-text beats a dropdown once there are dozens of names). */}
          <div style={{ padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--lyra-color-border-subtle)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <div style={{ width: 250 }}>
              <MultiSelectField options={rowStatusOptions} groups={rowStatusGroups} value={rowStatusFilter} onChange={setRowStatusFilter} mutedPlaceholder={false} labelOverride={multiLabel(rowStatusFilter, 'All Statuses', 'statuses')} radius="var(--radius-md)" />
            </div>
            <SegmentedFilter
              value={rowAlertFilter}
              onChange={v => setRowAlertFilter(v as 'All' | 'Alert' | 'No alert')}
              options={[
                ['All', 'All'],
                ['Alert', `Alert ${fmt(program.alerts)}`],
                ['No alert', `No alert ${fmt(Math.max(0, Math.round(perf.rec) - program.alerts))}`],
              ]}
            />
            <div style={{ width: 250 }}>
              <MultiSelectField options={ratingOptions} value={rowCsatFilter} onChange={setRowCsatFilter} mutedPlaceholder={false} labelOverride={multiLabel(rowCsatFilter, 'CSAT: Any', 'ratings')} radius="var(--radius-md)" />
            </div>
            <div style={{ width: 250 }}>
              <MultiSelectField options={ratingOptions} value={rowAsatFilter} onChange={setRowAsatFilter} mutedPlaceholder={false} labelOverride={multiLabel(rowAsatFilter, 'ASAT: Any', 'ratings')} radius="var(--radius-md)" />
            </div>
            <div style={{ width: 250 }}>
              <MultiSelectField options={rowAgentOptions} value={rowAgentFilter} onChange={setRowAgentFilter} mutedPlaceholder={false} labelOverride={multiLabel(rowAgentFilter, 'All Agents', 'agents')} radius="var(--radius-md)" />
            </div>
            <div style={{ width: 250 }}>
              <MultiSelectField options={rowTopicOptions} value={rowTopicFilter} onChange={setRowTopicFilter} mutedPlaceholder={false} labelOverride={multiLabel(rowTopicFilter, 'All Topics', 'topics')} radius="var(--radius-md)" />
            </div>
            {rowFiltersActive && (
              <button
                type="button" onClick={clearRowFilters}
                style={{ height: 36, padding: '0 12px', border: 'none', borderRadius: 'var(--radius-md)', background: 'transparent', font: `500 13px/18px ${FONT}`, color: 'var(--lyra-color-fg-link)', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                Clear filters
              </button>
            )}
          </div>

          <div style={{ overflowX: 'auto', overflowY: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--lyra-color-border-subtle)' }}>
                {RESPONSE_COLUMNS.map(col => (
                  <th
                    key={col}
                    scope="col"
                    style={{
                      padding: `var(--space-3) ${col === 'Survey Status' ? 'var(--space-4)' : 'var(--space-2)'} var(--space-3) ${col === 'Agent' ? 'var(--space-4)' : 'var(--space-2)'}`,
                      textAlign: col === 'Survey Status' ? 'right' : 'left',
                      font: `400 14px/20px ${FONT}`,
                      color: 'var(--lyra-color-fg-secondary)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={RESPONSE_COLUMNS.length} style={{ padding: '24px 16px', font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>
                    No interactions match the selected filters.
                  </td>
                </tr>
              ) : pageRows.map(r => {
                return (
                <tr
                  key={r.id}
                  onClick={() => setOpenRow(r)}
                  style={{ borderBottom: '1px solid var(--lyra-color-border-subtle)', cursor: 'pointer', transition: 'background-color 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--lyra-color-state-bg-hover-opacity)' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = '' }}
                >
                  <td style={{ ...cell(false, true), padding: 'var(--space-3) var(--space-2) var(--space-3) 13px', borderLeft: '3px solid transparent' }}>{agentName(r.agent)}</td>
                  <td style={cell()}>{r.customer}</td>
                  <td style={cell(true)} title={pseudoUuid(r.id)}>
                    {(() => {
                      const uuid = pseudoUuid(r.id)
                      return uuid.length > 15 ? `${uuid.slice(0, 15)}…` : uuid
                    })()}
                  </td>
                  <td style={cell()}>{r.topic ?? <Muted>No topic detected</Muted>}</td>
                  <td style={cell()}>{r.sent ?? <Muted>n/a</Muted>}</td>
                  <td style={cell()}>{r.response ?? <Muted>n/a</Muted>}</td>
                  <td style={cell()}>{r.completed ?? <Muted>n/a</Muted>}</td>
                  <td style={cell()}>
                    {r.csat === null ? <Muted>{r.response !== null ? 'Not asked' : 'n/a'}</Muted> : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
                        <Star size={12} style={{ color: 'var(--lyra-color-status-warning-medium)', fill: 'currentColor' }} />
                        {r.csat} of 5
                      </span>
                    )}
                  </td>
                  <td style={cell()}>
                    {r.asat === null ? <Muted>{r.response !== null ? 'Not asked' : 'n/a'}</Muted> : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
                        <Star size={12} style={{ color: 'var(--lyra-color-status-warning-medium)', fill: 'currentColor' }} />
                        {r.asat} of 5
                      </span>
                    )}
                  </td>
                  <td style={cell()}><AlertCell hasAlert={rowHasAlert(r, details, program.n)} /></td>
                  <td style={{ ...cell(), textAlign: 'right', padding: 'var(--space-3) var(--space-4) var(--space-3) var(--space-2)' }}><ResponseStatus status={r.status} /></td>
                </tr>
              )})}
            </tbody>
          </table>
          </div>

          <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>1 to {pageRows.length} of {fmt(footerTotal)}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <button disabled aria-label="Previous page" style={{ width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--lyra-color-border-soft)', borderRadius: 'var(--radius-sm)', background: 'var(--lyra-color-bg-surface-base)', color: 'var(--lyra-color-fg-disabled)', cursor: 'not-allowed' }}>
                <ChevronLeft size={14} />
              </button>
              <span style={{ font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>1 / {fmt(Math.max(1, Math.ceil(footerTotal / PAGE_SIZE)))}</span>
              <button disabled aria-label="Next page" style={{ width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--lyra-color-border-soft)', borderRadius: 'var(--radius-sm)', background: 'var(--lyra-color-bg-surface-base)', color: 'var(--lyra-color-fg-disabled)', cursor: 'not-allowed' }}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {openRow && (
        <CustomerDrawer
          row={openRow}
          detail={(() => {
            const base = details[openRow.id] ?? genericDetailFor(openRow)
            return { ...base, alert: deriveAlert(openRow, base.alert, program.n) }
          })()}
          programAlertCount={program.alerts}
          onClose={() => setOpenRow(null)}
        />
      )}
    </div>
  )
}

/* ── Data hook ── */
const CHANNELS = ['SMS', 'WhatsApp', 'Email']
const TOPICS = ['Service Disruption', 'Billing Recovery', 'Service Recovery', 'Product']

function useSlicedData(filters: { progs: string[]; chs: string[]; cats: string[]; days: number }) {
  return useMemo(() => {
    const allCh = filters.chs.length === 0
    const S = PROGRAMS
      .filter(p => (filters.progs.length === 0 || filters.progs.includes(p.n)) && (filters.cats.length === 0 || filters.cats.includes(p.cat)))
      .map(p => {
        const c = allCh ? 1 : filters.chs.reduce((a, x) => a + ((p.ch as Record<string, number>)[x] || 0), 0)
        if (!c) return null
        return { ...p, inter: p.inter * c, elig: p.elig * c, sent: p.sent * c, rec: p.rec * c, comp: p.comp * c, alerts: Math.round(p.alerts * c) }
      })
      .filter(Boolean) as typeof PROGRAMS

    const sum = (f: 'inter' | 'elig' | 'sent' | 'rec' | 'comp' | 'alerts') => S.reduce((a, p) => a + p[f], 0)
    const inter = sum('inter'), elig = sum('elig'), sent = sum('sent'), rec = sum('rec'), comp = sum('comp'), alerts = sum('alerts')
    const isAll = S.length === PROGRAMS.length && allCh
    const csat = isAll ? 76 : rec ? Math.round(S.reduce((a, p) => a + p.csat * p.rec, 0) / rec) : 0
    const asat = isAll ? 81 : rec ? Math.round(S.reduce((a, p) => a + p.asat * p.rec, 0) / rec) : 0

    return { inter, elig, sent, rec, comp, csat, asat, alerts, programs: S }
  }, [filters.progs, filters.chs, filters.cats, filters.days])
}

/* ── Page ── */
export function ProgramHealth6Page() {
  const [search, setSearch] = useState('')
  const [progs, setProgs] = useState<string[]>([])
  const [chs, setChs] = useState<string[]>([])
  const [cats, setCats] = useState<string[]>([])
  const [range, setRange] = useState<DateRange | null>(DEFAULT_RANGE)
  const [selected, setSelected] = useState<typeof PROGRAMS[0] | null>(null)
  const [insight, setInsight] = useState<typeof PROGRAMS[0] | null>(null)
  const [perfTab, setPerfTab] = useState<PerfTab>('el')
  const perfRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<HTMLDivElement>(null)

  const data = useSlicedData({ progs, chs, cats, days: range ? rangeDays(range) : 7 })

  if (selected) {
    return <ProgramDetailView program={selected} onBack={() => setSelected(null)} />
  }

  const showPerf = (tab: PerfTab) => {
    setPerfTab(tab)
    requestAnimationFrame(() => perfRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
  const showPrograms = () => tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const multiLabel = (v: string[], all: string, noun: string) => (v.length === 0 ? all : v.length === 1 ? v[0] : `${v.length} ${noun}`)
  const defaultRange = isDefaultRange(range)
  const hasFilters = !defaultRange || progs.length > 0 || chs.length > 0 || cats.length > 0
  const chipCount = (defaultRange ? 0 : 1) + progs.length + chs.length + cats.length
  const clearAll = () => { setProgs([]); setChs([]); setCats([]); setRange(DEFAULT_RANGE()) }
  const groups: [string, string[], (v: string[]) => void][] = [['Program', progs, setProgs], ['Channel', chs, setChs], ['Topic', cats, setCats]]

  return (
    <div className="flex flex-col flex-1 h-full" style={{ background: 'var(--lyra-color-bg-surface-base)' }}>
      <div className="flex-1 min-h-0" style={{ paddingTop: 'var(--space-6)', paddingLeft: 'var(--space-7)', paddingRight: 'var(--space-7)', paddingBottom: 'var(--space-6)', overflowY: 'auto' }}>
        <TodaysHighlights
          programs={data.programs} inter={data.inter} elig={data.elig} sent={data.sent} rec={data.rec} comp={data.comp}
          onSelectProgram={setSelected} onShowNotEligible={() => showPerf('ne')} onShowFunnel={() => showPerf('el')} onShowPrograms={showPrograms}
        />

        {/* Filter Bar */}
        <div style={{ marginTop: 'var(--space-6)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search program name" />
          <DateRangePicker value={range} onChange={setRange} />
          <div style={{ width: 250 }}>
            <MultiSelectField options={PROGRAMS.map(p => p.n)} value={progs} onChange={setProgs} mutedPlaceholder={false} labelOverride={multiLabel(progs, 'All Programs', 'programs')} radius="var(--radius-md)" optionStatus={opt => PROGRAMS.find(p => p.n === opt)?.tags.includes('Active')} />
          </div>
          <div style={{ width: 250 }}>
            <MultiSelectField options={CHANNELS} value={chs} onChange={setChs} mutedPlaceholder={false} labelOverride={multiLabel(chs, 'All Channels', 'channels')} radius="var(--radius-md)" />
          </div>
          <div style={{ width: 250 }}>
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

        <div ref={perfRef} style={{ marginTop: 'var(--space-6)', scrollMarginTop: 'var(--space-4)' }}>
          <ProgramPerformance programNames={data.programs.map(p => ({ n: p.n, active: p.tags.includes('Active') }))} data={data} deltas={OVERVIEW_DELTAS} periodNote={previousPeriodNote(range)} open={perfTab} onOpenChange={setPerfTab} />
        </div>

        <div ref={tableRef} style={{ marginTop: 'var(--space-6)', scrollMarginTop: 'var(--space-4)' }}>
          <ProgramsTable programs={data.programs} searchQuery={search} onSelectProgram={setSelected} onOpenInsight={setInsight} />
        </div>
      </div>

      {insight && <InsightDrawer program={insight} onClose={() => setInsight(null)} onOpenProgram={() => { setSelected(insight); setInsight(null) }} />}
    </div>
  )
}
