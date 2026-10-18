import { useState, useMemo, useEffect, useRef } from 'react'
import { Activity, AlertTriangle, ArrowRight, Bell, BellOff, Calendar, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Headphones, Info, Lightbulb, Mail, MessageSquare, Phone, Power, PowerOff, Search, Smile, Sparkles, Star, UserMinus, Wrench, X } from 'lucide-react'
import { SearchInput } from '../components/feedback-management/ListPagePrimitives'
import { MultiSelectField } from '../components/campaign-wizard/WizardPrimitives'

const FONT = 'var(--font-sans)'

/* ── Data ── */
const PROGRAMS = [
  { n: 'Complaint Resolution Follow-Up', tags: ['Active', 'AI questions', 'Needs attention'], cat: 'Service Recovery', ch: { SMS: 0.6, Email: 0.4 }, inter: 3350, elig: 1106, sent: 1062, rec: 319, comp: 137, csat: 59, asat: 72, csatD: '↓ 6pp', rrD: '↓ 9pp', alerts: 10, coverageUp: false, responseRateUp: false, completionRateUp: false, csatUp: false },
  { n: 'Flight Disruption Recovery', tags: ['Active', 'AI questions'], cat: 'Service Disruption', ch: { WhatsApp: 0.5, SMS: 0.3, Email: 0.2 }, inter: 6990, elig: 2308, sent: 1985, rec: 1211, comp: 872, csat: 86, asat: 88, alerts: 3, coverageUp: true, responseRateUp: true, completionRateUp: true, csatUp: true },
  { n: 'Billing and Refund Recovery · All Digital', tags: ['Active', 'AI questions'], cat: 'Billing Recovery', ch: { Email: 0.55, SMS: 0.45 }, inter: 4675, elig: 1542, sent: 1372, rec: 617, comp: 327, csat: 81, asat: 83, alerts: 4, coverageUp: true, responseRateUp: true, completionRateUp: true, csatUp: true },
  { n: 'Omnichannel Escalation Recovery', tags: ['Active', 'AI questions'], cat: 'Service Recovery', ch: { Email: 0.4, WhatsApp: 0.35, SMS: 0.25 }, inter: 4350, elig: 1435, sent: 1335, rec: 828, comp: 580, csat: 80, asat: 82, alerts: 5, coverageUp: true, responseRateUp: true, completionRateUp: true, csatUp: true },
  { n: 'Product Feedback - Beta Testers', tags: ['Active', 'Static questions'], cat: 'Product', ch: { Email: 0.7, WhatsApp: 0.3 }, inter: 2555, elig: 834, sent: 692, rec: 457, comp: 329, csat: 75, asat: 80, alerts: 5, coverageUp: true, responseRateUp: true, completionRateUp: true, csatUp: true },
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
  const convs: [number, number, string][] = [[(BW + CW) / 2, cov, 'Survey coverage'], [(CW + BW + 2 * CW) / 2, rr, 'Response rate']]

  // Not-sent reasons, scaled to this slice's skipped volume.
  const share = skipped / SKIP_ALL
  const rs = REASONS.map(([n, v, k]) => [n, v * share, k] as [string, number, string])
  const tun = rs.filter(r => r[2] === 't').reduce((a, r) => a + r[1], 0)
  const mxr = Math.max(...rs.map(r => r[1]), 1)

  const selector = (key: 'el' | 'ne', label: string, hint: string, value: number, rate: number, rateDelta?: string, color = EL_COLOR) => {
    const on = open === key
    return (
      <button
        type="button" role="tab" aria-selected={on} onClick={() => setOpen(on ? null : key)}
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
        <span style={{ display: 'grid', rowGap: 1, minWidth: 0, overflow: 'hidden' }}>
          <span style={{ font: `500 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
          <span title={hint} style={{ font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{hint}</span>
        </span>
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
      <div style={{ padding: '18px 22px 10px', background: 'var(--lyra-color-bg-surface-base)' }}>
        <h3 style={{ font: `600 20px/24px ${FONT}`, letterSpacing: '-0.01em', margin: 0, color: 'var(--lyra-color-fg-default)' }}>Program Performance</h3>
        <p style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', rowGap: 2, margin: '6px 0 0', font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>
          {programNames.length === 0 ? 'No programs match the selected filters' : programNames.map(({ n, active }, i) => (
            <span key={n} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: active ? 'rgba(100,185,111,0.55)' : 'var(--lyra-slate-400)' }} title={active ? 'Active program' : 'Inactive program'} />
              {n}
              {i < programNames.length - 1 && <span style={{ color: 'var(--lyra-slate-300)', margin: '0 12px', fontWeight: 300 }}>|</span>}
            </span>
          ))}
        </p>
      </div>
      <div style={{ padding: '20px 22px 22px' }}>
      <div style={{ margin: '-4px -6px 24px', padding: '20px 22px', borderRadius: 'var(--radius-md)', background: 'var(--lyra-color-bg-surface-shell)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 10, whiteSpace: 'nowrap' }}>
          <span style={{ font: `600 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>Total interactions</span>
          <b style={{ font: `600 26px/1.1 ${FONT}`, letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums', color: 'var(--lyra-color-fg-default)' }}>
            {fmt(inter)}<span style={{ marginLeft: 6 }}><Delta value={deltas.total} size={15} /></span>
          </b>
        </div>
        <div role="tablist" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 980 }}>
          {selector('el', 'Eligible for survey', 'Track sent, responded, completed', elig, er, deltas.eligRate)}
          {selector('ne', 'Not eligible for survey', 'See why no survey was sent', skipped, 100 - er, undefined, NE_COLOR)}
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
                {['Eligible for survey', 'Surveys sent', 'Responses received'].map(l => (
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
                <span style={{ font: `600 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-secondary)', whiteSpace: 'nowrap' }}>Split of responses received</span>
              </div>
              <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', gap: 6, marginBottom: 14 }}>
                {([["Survey's completed", comp, deltas.comp, EL_COLOR, false], ['Partially completed', part, deltas.part, NE_COLOR, true]] as [string, number, string, string, boolean][]).map(([l, v, d, c, right]) => (
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
              {fmt(skipped)} interactions ({pct(skipped, inter)}%) did not qualify for a survey, so none was sent. The reasons below explain the drop. {fmt(tun)} of them sit behind program settings you can change; the rest are fixed by compliance rules.
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

function HighlightCard({ accent, icon, action, onClick, children }: { accent: 'critical' | 'loss'; icon: React.ReactNode; action: string; onClick: () => void; children: React.ReactNode }) {
  const color = accent === 'critical' ? 'var(--lyra-color-status-critical-strong)' : 'var(--lyra-orange-500)'
  const wash = accent === 'critical' ? 'var(--lyra-color-status-critical-subtle)' : 'var(--lyra-color-status-warning-subtle)'
  return (
    <li>
      <button
        type="button" onClick={onClick}
        style={{ width: '100%', display: 'grid', gridTemplateColumns: '38px 1fr auto', columnGap: 12, alignItems: 'center', textAlign: 'left', padding: '12px 14px 12px 12px', background: `linear-gradient(90deg, ${wash} 0%, var(--lyra-color-bg-surface-base) 55%)`, border: '1px solid var(--lyra-color-border-subtle)', borderLeft: `5px solid ${color}`, borderRadius: 'var(--radius-md)', boxShadow: 'var(--sol-effect-shadowsm)', cursor: 'pointer', transition: 'box-shadow .15s, border-color .15s' }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--sol-effect-shadowmd)'; e.currentTarget.style.borderColor = 'var(--lyra-color-border-soft)'; e.currentTarget.style.borderLeftColor = color }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--sol-effect-shadowsm)'; e.currentTarget.style.borderColor = 'var(--lyra-color-border-subtle)'; e.currentTarget.style.borderLeftColor = color }}
      >
        <span style={{ width: 38, height: 38, borderRadius: 'var(--radius-full)', display: 'grid', placeItems: 'center', color, background: wash }}>{icon}</span>
        <span style={{ minWidth: 0, font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>{children}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, font: `500 13px/18px ${FONT}`, color: 'var(--lyra-color-fg-link)', whiteSpace: 'nowrap' }}>
          {action}<ChevronRight size={14} />
        </span>
      </button>
    </li>
  )
}

function TodaysHighlights({ programs, inter, elig, onOpenInsight, onShowNotEligible }: { programs: typeof PROGRAMS; inter: number; elig: number; onOpenInsight: (p: typeof PROGRAMS[0]) => void; onShowNotEligible: () => void }) {
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
        <HighlightCard accent="critical" icon={<Activity size={19} />} action={attention.length === 0 ? 'View programs' : 'See why'} onClick={() => attention[0] && onOpenInsight(attention[0])}>
          <b style={{ color: 'var(--lyra-color-fg-default)', fontWeight: 600 }}>
            {attention.length === 0 ? 'All programs are healthy' : `${attention.length} of ${programs.length} programs need${attention.length === 1 ? 's' : ''} attention`}
          </b>
          <span style={{ display: 'block' }}>
            {attention.length === 0
              ? 'No program is below its CSAT or response-rate target.'
              : attention.map(p => `${p.n} (CSAT ${p.csat}%, response ${pct(p.rec, p.sent)}%)`).join(' · ') + '.'}
          </span>
        </HighlightCard>
        <HighlightCard accent="loss" icon={<UserMinus size={19} />} action="See reasons" onClick={onShowNotEligible}>
          <b style={{ color: 'var(--lyra-color-fg-default)', fontWeight: 600 }}>{fractionLabel(ratio)} interactions never reach a survey</b>
          <span style={{ display: 'block' }}>
            {pct(skipped, inter)}% did not qualify for a survey, so none was sent.
          </span>
        </HighlightCard>
      </ul>
    </section>
  )
}

/* ── Program insight: problem → root cause → call to action ── */
/* kind: 'attention' = an insight rule fired; 'watch' = healthy, but a watch rule is close to its threshold. */
type ProgramInsight = {
  kind: 'attention' | 'watch'
  rules: string[]
  problem: { label: string; value: string; delta: string }[]
  causes: { title: string; detail: string }[]
  actions: { title: string; detail: string; cta: string; primary?: boolean }[]
}

const PROGRAM_INSIGHTS: Record<string, ProgramInsight> = {
  'Flight Disruption Recovery': {
    kind: 'watch',
    rules: ['Partially completed responses above 25% for 14 days', 'Survey coverage below 90% on WhatsApp'],
    problem: [
      { label: 'Partially completed', value: '28%', delta: '+4pp' },
      { label: 'Survey coverage', value: '86%', delta: '-3pp' },
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
    rules: ['Response rate below 50% for 7 consecutive days'],
    problem: [
      { label: 'Response rate', value: '45%', delta: '+3pp' },
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
    kind: 'watch',
    rules: ['CSAT below the 78% beta target for 7 consecutive days'],
    problem: [
      { label: 'CSAT', value: '75%', delta: '+1pp' },
      { label: 'Completion rate', value: '72%', delta: '+3pp' },
      { label: 'Alerts', value: '5', delta: '-1%' },
    ],
    causes: [
      { title: 'Mobile sync is the top complaint', detail: '41% of 1–3 star responses say changes made on desktop do not appear on mobile. Those testers average 2.4 stars; everyone else averages 4.1.' },
      { title: 'Onboarding stalls at the data-import step', detail: '29% of testers who rated 3 or lower never finished importing their data. They average 2.9 stars; testers who completed import average 4.2.' },
    ],
    actions: [
      { title: 'Share the mobile sync verbatims with Product', detail: '17 responses describe the same reproduction steps.', cta: 'Share verbatims', primary: true },
      { title: 'Add an import walkthrough to the welcome email', detail: 'Targets the step where a third of low ratings start.', cta: 'Notify Product' },
      { title: 'Invite the 5 alert testers to a feedback call', detail: 'All five are still active in the beta.', cta: 'Open alerts' },
    ],
  },
  'Complaint Resolution Follow-Up': {
    kind: 'attention',
    rules: ['Response rate below 40% for 7 consecutive days', 'CSAT dropped 5pp or more vs. the previous period'],
    problem: [
      { label: 'Response rate', value: '30%', delta: '-9pp' },
      { label: 'CSAT', value: '59%', delta: '-6pp' },
      { label: 'Alerts', value: '10', delta: '+18%' },
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
  },
}

const GENERIC_INSIGHT = (p: typeof PROGRAMS[0]): ProgramInsight => ({
  kind: p.tags.includes('Needs attention') ? 'attention' : 'watch',
  rules: ['Response rate below 40% for 7 consecutive days'],
  problem: [
    { label: 'Response rate', value: `${pct(p.rec, p.sent)}%`, delta: p.rrD ?? '0pp' },
    { label: 'CSAT', value: `${p.csat}%`, delta: p.csatD ?? '0pp' },
    { label: 'Alerts', value: fmt(p.alerts), delta: '0%' },
  ],
  causes: [{ title: 'Analysis in progress', detail: 'The system is still gathering enough responses to explain the drop.' }],
  actions: [{ title: 'Open the program to review recent responses', detail: 'Check the latest verbatims and alerts.', cta: 'Open program', primary: true }],
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

function InsightDrawer({ program, onClose, onOpenProgram }: { program: typeof PROGRAMS[0]; onClose: () => void; onOpenProgram: () => void }) {
  const ins = PROGRAM_INSIGHTS[program.n] ?? GENERIC_INSIGHT(program)
  const attention = ins.kind === 'attention'

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
              {attention ? <NeedsAttentionChip /> : <WatchChip />}
            </div>
            <div style={{ font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-secondary)', marginTop: 2 }}>{attention ? 'What is wrong, why, and what to do next' : 'What to watch, why, and what to do before it becomes a problem'}</div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', borderRadius: 'var(--radius-sm)', color: 'var(--lyra-color-fg-action)', cursor: 'pointer', flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Why it was flagged */}
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-start', padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)', background: attention ? 'var(--lyra-color-status-critical-subtle)' : 'var(--lyra-color-status-info-subtle)', color: attention ? 'var(--lyra-color-status-critical-strong)' : 'var(--lyra-color-status-info-strong)' }}>
            {attention ? <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} /> : <Lightbulb size={16} style={{ flexShrink: 0, marginTop: 2 }} />}
            <div style={{ font: `400 14px/20px ${FONT}` }}>
              <b style={{ fontWeight: 600 }}>
                {attention
                  ? `Flagged by ${ins.rules.length} insight rule${ins.rules.length > 1 ? 's' : ''}`
                  : `No insight rule has fired. ${ins.rules.length} watch rule${ins.rules.length > 1 ? 's are' : ' is'} close to threshold`}
              </b>
              <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                {ins.rules.map(r => <li key={r}>{r}</li>)}
              </ul>
            </div>
          </div>

          <InsightStep n={1} icon={<Activity size={16} />} title={attention ? 'Problem' : 'What to watch'}>
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

          <InsightStep n={3} icon={<Wrench size={16} />} title="Call to action">
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

/* Compact banner for the program page: same three steps, one glance. */
function InsightBanner({ program, onOpen }: { program: typeof PROGRAMS[0]; onOpen: () => void }) {
  const ins = PROGRAM_INSIGHTS[program.n] ?? GENERIC_INSIGHT(program)
  const attention = ins.kind === 'attention'
  const fg = attention ? 'var(--lyra-color-status-critical-strong)' : 'var(--lyra-color-status-info-strong)'
  const cols: [React.ReactNode, string, string][] = [
    [<Activity size={14} />, attention ? 'Problem' : 'What to watch', ins.problem.map(m => `${m.label} ${m.value} (${m.delta})`).join(' · ')],
    [<Search size={14} />, 'Likely root cause', ins.causes[0].title],
    [<Wrench size={14} />, 'Call to action', ins.actions[0].title],
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)', background: attention ? 'var(--lyra-color-status-critical-subtle)' : 'var(--lyra-color-status-info-subtle)', border: `1px solid ${attention ? 'var(--lyra-color-status-critical-medium)' : 'var(--lyra-color-status-info-medium)'}` }}>
      <span style={{ width: 36, height: 36, borderRadius: 'var(--radius-full)', display: 'grid', placeItems: 'center', background: 'var(--lyra-color-bg-surface-base)', color: fg }}>{attention ? <AlertTriangle size={18} /> : <Lightbulb size={18} />}</span>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 'var(--space-4)', minWidth: 0 }}>
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
  { label: 'Program', key: 'n' },
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
  { channel: 'WhatsApp', elig: 1590, coverage: 89, sent: 1423, responseRate: 59, rec: 837, completionRate: 65, comp: 545, partial: 292, csat: 77, asat: 80, alerts: 6 },
  { channel: 'Email', elig: 2890, coverage: 89, sent: 2571, responseRate: 38, rec: 977, completionRate: 58, comp: 567, partial: 410, csat: 72, asat: 79, alerts: 11 },
]

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
        <h3 style={{ font: `600 18px/24px ${FONT}`, letterSpacing: '-0.01em', margin: 0, color: 'var(--lyra-color-fg-default)' }}>Programs</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <span style={{ font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>Group by</span>
          <div style={{ display: 'flex', border: '1px solid var(--lyra-color-border-subtle)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
            {(['Program', 'Channel', 'Topic'] as const).map((g, i) => (
              <button
                key={g}
                onClick={() => { setGroupBy(g); setSort(null) }}
                style={{
                  padding: '6px 16px', font: `500 12px/16px ${FONT}`, borderTop: 'none', borderBottom: 'none', borderLeft: 'none', cursor: 'pointer',
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
        <div style={{ overflowX: 'auto' }}>
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
              {sortRows(CHANNEL_DATA, sort).map(c => (
                <tr key={c.channel} style={{ borderBottom: '1px solid var(--lyra-color-border-subtle)' }}>
                  <td style={{ padding: 'var(--space-3) var(--space-3) var(--space-3) var(--space-6)', font: `500 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)', whiteSpace: 'nowrap' }}>
                    {c.channel}
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
                  <td style={{ padding: 'var(--space-3)', font: `600 14px/18px ${FONT}`, color: 'var(--lyra-color-status-critical-strong)', whiteSpace: 'nowrap' }}>
                    {c.alerts}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : groupBy === 'Topic' ? (
        <div style={{ overflowX: 'auto' }}>
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
              {sortRows(TOPIC_DATA, sort).map(t => (
                <tr key={t.topic} style={{ borderBottom: '1px solid var(--lyra-color-border-subtle)' }}>
                  <td style={{ padding: 'var(--space-3) var(--space-3) var(--space-3) var(--space-6)', font: `500 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)', whiteSpace: 'nowrap' }}>
                    {t.topic}
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
                  <td style={{ padding: 'var(--space-3)', font: `600 14px/18px ${FONT}`, color: 'var(--lyra-color-status-critical-strong)', whiteSpace: 'nowrap' }}>
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
        <div style={{ overflowX: 'auto' }}>
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
                    padding={`var(--space-3) var(--space-3) var(--space-3) ${col.label === 'Program' ? 'var(--space-6)' : 'var(--space-3)'}`}
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
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <span
                            onClick={() => onSelectProgram(p)}
                            style={{ font: `500 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-link)', cursor: 'pointer' }}
                          >
                            {p.n}
                          </span>
                          {p.tags.includes('Needs attention') && (
                            <button type="button" onClick={() => onOpenInsight(p)} aria-label={`See why ${p.n} needs attention`} style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', display: 'inline-flex' }}>
                              <NeedsAttentionChip />
                            </button>
                          )}
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
                        {p.rrD && <PpDrop value={p.rrD} />}
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
                        {p.csatD && <PpDrop value={p.csatD} />}
                      </td>
                      <td style={{ padding: 'var(--space-3)', whiteSpace: 'nowrap' }}>
                        <GreyBadge>{p.asat}%</GreyBadge>
                      </td>
                      <td style={{ padding: 'var(--space-3)', font: `600 14px/18px ${FONT}`, color: 'var(--lyra-color-status-critical-strong)', whiteSpace: 'nowrap' }}>
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
const CRF_RESPONSES: ResponseRow[] = [
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
/* One interaction set per program; each has its own reporting window, topics and ID range. */
const DETAIL_RESPONSES: Record<string, ResponseRow[]> = {
  'Complaint Resolution Follow-Up': CRF_RESPONSES,
  'Flight Disruption Recovery': [
    { customer: 'Elena Rossi', id: 'INT-7102244', agent: 'Aisha N.', topic: 'Rebooking', sent: 'Jul 3, 09:12', response: 'Jul 3, 09:20', completed: 'Jul 3, 09:31', csat: 5, asat: 5, status: 'Response Received' },
    { customer: 'Kwame Mensah', id: 'INT-7118830', agent: 'Tomás R.', topic: 'Delay Notification', sent: 'Jul 4, 18:40', response: 'Jul 4, 18:52', completed: 'Jul 4, 19:05', csat: 4, asat: 4, status: 'Response Received' },
    { customer: 'Hannah Weber', id: 'INT-7124519', agent: 'Priya M.', topic: 'Compensation Claim', sent: 'Jul 5, 11:05', response: 'Jul 5, 11:30', completed: null, csat: 3, asat: 4, status: 'Partially Responded' },
    { customer: 'Diego Martín', id: 'INT-7131077', agent: 'Liu Yang', topic: 'Missed Connection', sent: 'Jul 7, 07:50', response: 'Jul 7, 08:04', completed: 'Jul 7, 08:16', csat: 2, asat: 3, status: 'Response Received' },
    { customer: 'Mei Lin', id: 'INT-7139902', agent: 'Ben K.', topic: 'Baggage Delay', sent: 'Jul 8, 21:15', response: null, completed: null, csat: null, asat: null, status: 'Not Started' },
    { customer: 'Oliver Brooks', id: 'INT-7146218', agent: 'Rajat S.', topic: 'Hotel Voucher', sent: 'Jul 10, 23:02', response: 'Jul 11, 07:45', completed: 'Jul 11, 07:58', csat: 5, asat: 5, status: 'Response Received' },
    { customer: 'Amara Okafor', id: 'INT-7151460', agent: 'Aisha N.', topic: null, sent: null, response: null, completed: null, csat: null, asat: null, status: 'Program Not Found' },
    { customer: 'Lucas Dubois', id: 'INT-7158331', agent: 'Tomás R.', topic: 'Delay Notification', sent: 'Jul 12, 16:20', response: 'Jul 12, 16:33', completed: 'Jul 12, 16:50', csat: 4, asat: 5, status: 'Response Received' },
    { customer: 'Sara Haddad', id: 'INT-7163904', agent: 'Priya M.', topic: 'Compensation Claim', sent: 'Jul 14, 10:10', response: 'Jul 14, 10:40', completed: 'Jul 14, 10:55', csat: 5, asat: 4, status: 'Response Received' },
    { customer: 'Jonas Berg', id: 'INT-7170125', agent: 'Liu Yang', topic: 'Missed Connection', sent: null, response: null, completed: null, csat: null, asat: null, status: 'No Matching Skill or Team' },
  ],
  'Billing and Refund Recovery · All Digital': [
    { customer: 'Grace Kim', id: 'INT-8201133', agent: 'Marco B.', topic: 'Refund Processing', sent: 'Jul 2, 10:05', response: 'Jul 2, 10:19', completed: 'Jul 2, 10:34', csat: 5, asat: 5, status: 'Response Received' },
    { customer: 'Ahmed Siddiqui', id: 'INT-8207448', agent: 'Priya M.', topic: 'Duplicate Charge', sent: 'Jul 3, 14:22', response: 'Jul 3, 14:40', completed: null, csat: 4, asat: 4, status: 'Partially Responded' },
    { customer: 'Isabella Costa', id: 'INT-8213790', agent: 'Chloe D.', topic: 'Partial Refund', sent: 'Jul 5, 09:15', response: 'Jul 5, 09:28', completed: 'Jul 5, 09:44', csat: 1, asat: 2, status: 'Response Received' },
    { customer: 'Ravi Nair', id: 'INT-8220015', agent: 'Ben K.', topic: 'Subscription Cancellation', sent: 'Jul 6, 17:50', response: null, completed: null, csat: null, asat: null, status: 'Not Started' },
    { customer: 'Chloe Martin', id: 'INT-8226672', agent: 'Marco B.', topic: 'Payment Failure', sent: 'Jul 8, 12:03', response: 'Jul 8, 12:15', completed: 'Jul 8, 12:30', csat: 4, asat: 4, status: 'Response Received' },
    { customer: 'Tariq Hassan', id: 'INT-8233309', agent: 'Liu Yang', topic: 'Billing Dispute', sent: 'Jul 9, 15:40', response: 'Jul 9, 16:02', completed: null, csat: 3, asat: 3, status: 'Partially Responded' },
    { customer: 'Emily Zhang', id: 'INT-8239941', agent: 'Chloe D.', topic: 'Invoice Correction', sent: 'Jul 11, 11:11', response: 'Jul 11, 11:25', completed: 'Jul 11, 11:40', csat: 5, asat: 5, status: 'Response Received' },
    { customer: 'Pedro Alves', id: 'INT-8246580', agent: 'Priya M.', topic: 'Refund Processing', sent: 'Jul 13, 08:30', response: 'Jul 13, 08:45', completed: 'Jul 13, 09:01', csat: 2, asat: 3, status: 'Response Received' },
    { customer: 'Fatima Al-Sayed', id: 'INT-8252217', agent: 'Rajat S.', topic: null, sent: null, response: null, completed: null, csat: null, asat: null, status: 'Program Not Found' },
    { customer: 'Henry Walsh', id: 'INT-8258866', agent: 'Marco B.', topic: 'Billing Dispute', sent: null, response: null, completed: null, csat: null, asat: null, status: 'Survey Refused' },
  ],
  'Omnichannel Escalation Recovery': [
    { customer: 'Nadia Petrova', id: 'INT-9301207', agent: 'Sam O.', topic: 'Channel Hand-off', sent: 'Jul 4, 13:10', response: 'Jul 4, 13:25', completed: 'Jul 4, 13:40', csat: 4, asat: 4, status: 'Response Received' },
    { customer: 'Caleb Johnson', id: 'INT-9307734', agent: 'Tomás R.', topic: 'Repeat Contact', sent: 'Jul 5, 16:45', response: 'Jul 5, 17:02', completed: 'Jul 5, 17:20', csat: 2, asat: 3, status: 'Response Received' },
    { customer: 'Yuki Tanaka', id: 'INT-9313351', agent: 'Aisha N.', topic: 'Callback Not Received', sent: 'Jul 7, 09:30', response: 'Jul 7, 09:48', completed: null, csat: 1, asat: 1, status: 'Partially Responded' },
    { customer: 'Sofia Hernández', id: 'INT-9319986', agent: 'Liu Yang', topic: 'Supervisor Escalation', sent: 'Jul 8, 11:20', response: 'Jul 8, 11:40', completed: 'Jul 8, 11:58', csat: 5, asat: 5, status: 'Response Received' },
    { customer: 'Ibrahim Yusuf', id: 'INT-9326604', agent: 'Sam O.', topic: 'Bot Transfer Friction', sent: 'Jul 9, 19:05', response: null, completed: null, csat: null, asat: null, status: 'Not Started' },
    { customer: 'Laura Fischer', id: 'INT-9332240', agent: 'Priya M.', topic: 'Case Reopened', sent: 'Jul 11, 10:15', response: 'Jul 11, 10:30', completed: 'Jul 11, 10:47', csat: 3, asat: 4, status: 'Response Received' },
    { customer: 'Mateo Silva', id: 'INT-9338877', agent: 'Ben K.', topic: 'Channel Hand-off', sent: 'Jul 12, 14:55', response: 'Jul 12, 15:10', completed: 'Jul 12, 15:25', csat: 5, asat: 5, status: 'Response Received' },
    { customer: 'Zara Ahmed', id: 'INT-9345513', agent: 'Rajat S.', topic: 'Repeat Contact', sent: null, response: null, completed: null, csat: null, asat: null, status: 'No Matching Skill or Team' },
    { customer: 'Thomas Müller', id: 'INT-9352159', agent: 'Tomás R.', topic: 'Supervisor Escalation', sent: 'Jul 15, 08:40', response: 'Jul 15, 08:55', completed: 'Jul 15, 09:12', csat: 4, asat: 4, status: 'Response Received' },
  ],
  'Product Feedback - Beta Testers': [
    { customer: 'Jordan Lee', id: 'INT-6401118', agent: 'Chloe D.', topic: 'Mobile App Sync', sent: 'Jul 1, 10:00', response: 'Jul 1, 10:20', completed: 'Jul 1, 10:38', csat: 2, asat: 4, status: 'Response Received' },
    { customer: 'Priyanka Rao', id: 'INT-6407752', agent: 'Sam O.', topic: 'Onboarding Flow', sent: 'Jul 2, 15:30', response: 'Jul 2, 15:45', completed: 'Jul 2, 16:02', csat: 4, asat: 5, status: 'Response Received' },
    { customer: 'Ethan Clarke', id: 'INT-6413397', agent: 'Marco B.', topic: 'Dashboard Export', sent: 'Jul 4, 11:12', response: 'Jul 4, 11:30', completed: null, csat: 3, asat: 4, status: 'Partially Responded' },
    { customer: 'Aisha Bello', id: 'INT-6420030', agent: 'Chloe D.', topic: 'Notification Settings', sent: 'Jul 6, 09:45', response: 'Jul 6, 10:00', completed: 'Jul 6, 10:15', csat: 5, asat: 5, status: 'Response Received' },
    { customer: 'Victor Novak', id: 'INT-6426661', agent: 'Priya M.', topic: 'Data Import', sent: 'Jul 8, 13:20', response: null, completed: null, csat: null, asat: null, status: 'Not Started' },
    { customer: 'Hana Sato', id: 'INT-6433298', agent: 'Sam O.', topic: 'Mobile App Sync', sent: 'Jul 9, 17:05', response: 'Jul 9, 17:25', completed: 'Jul 9, 17:40', csat: 1, asat: 3, status: 'Response Received' },
    { customer: 'Daniel Osei', id: 'INT-6439934', agent: 'Marco B.', topic: 'Feature Request', sent: 'Jul 11, 10:30', response: 'Jul 11, 10:50', completed: 'Jul 11, 11:05', csat: 4, asat: 4, status: 'Response Received' },
    { customer: 'Lena Hoffmann', id: 'INT-6446570', agent: 'Rajat S.', topic: 'Bug Report', sent: 'Jul 13, 14:15', response: 'Jul 13, 14:30', completed: 'Jul 13, 14:48', csat: 4, asat: 5, status: 'Response Received' },
    { customer: 'Omar Farouk', id: 'INT-6453206', agent: 'Chloe D.', topic: null, sent: null, response: null, completed: null, csat: null, asat: null, status: 'Program Not Found' },
    { customer: 'Mia Andersen', id: 'INT-6459843', agent: 'Priya M.', topic: 'Dashboard Export', sent: null, response: null, completed: null, csat: null, asat: null, status: 'No Matching Skill or Team' },
  ],
}

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
type SystemRead = { tone: 'positive' | 'negative' | 'mixed'; label: string; expected: [number, number] } | null
type InteractionAlert = { name: string; rule: string; sentTo: string; via: string; when: string } | null
type CustomerDetail = {
  summary: string | null
  read: SystemRead
  alsoFound: string[]
  questions: { q: string; a: string | null; alternatives?: string[] }[]
  outcome: string
  alert: InteractionAlert
  phone: string
  email: string
}

const CRF_DETAILS: Record<string, CustomerDetail> = {
  'INT-4064903': {
    summary: null, read: null, alsoFound: [], questions: [],
    outcome: 'No survey was sent — no program matched this interaction.',
    alert: null,
    phone: '+1 223-555-7714', email: 'sophie.patel@example.com',
  },
  'INT-6257112': {
    summary: 'The system read this technical troubleshooting case as resolved, based on a clean resolution logged before the call ended.',
    read: { tone: 'positive', label: 'Resolved · likely positive', expected: [4, 5] },
    alsoFound: ['Account Access'],
    questions: [
      { q: 'How would you rate how we handled your technical troubleshooting today?', a: '5 of 5', alternatives: ['Did the troubleshooting steps fix your device for good?', 'How satisfied are you with the help you got with your device today?'] },
      { q: 'What could have made the technical troubleshooting experience better?', a: '"It was already the right call, I would not change it."' },
    ],
    outcome: 'Survey completed · Jul 1, 16:13',
    alert: null,
    phone: '+1 223-555-5382', email: 'olivia.smith@example.com',
  },
  'INT-4789800': {
    summary: 'The system read this refund case as unresolved — the refund was promised but no confirmation was logged before the chat closed.',
    read: { tone: 'negative', label: 'Unresolved · likely negative', expected: [1, 3] },
    alsoFound: ['Billing Dispute'],
    questions: [
      { q: 'How would you rate how we handled your refund today?', a: '2 of 5', alternatives: ['Were you told when your refund will arrive?', 'How confident are you that your refund is on its way?'] },
      { q: 'What could have made the refund experience better?', a: '"I still don\'t know when the money will arrive. A date would have helped."' },
    ],
    outcome: 'Survey completed · Jul 2, 09:08',
    alert: { name: 'Detractor alert', rule: 'CSAT ≤ 2 on a Refund Processing interaction', sentTo: 'Billing supervisor (Dana M.)', via: 'Email', when: 'Jul 2, 09:10' },
    phone: '+1 223-555-2041', email: 'marcus.wright@example.com',
  },
  'INT-1601280': {
    summary: 'The system read this refund case as escalated — the agent transferred the customer to a supervisor queue before closing.',
    read: { tone: 'negative', label: 'Escalated · likely negative', expected: [1, 2] },
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
    read: { tone: 'positive', label: 'Resolved · likely positive', expected: [4, 5] },
    alsoFound: [],
    questions: [
      { q: 'How would you rate how we handled your account access issue today?', a: '5 of 5', alternatives: ['Were you able to sign in after the reset?', 'How easy was it to get back into your account today?'] },
      { q: 'What could have made the account access experience better?', a: '"Fast and friendly, nothing to add."' },
    ],
    outcome: 'Survey completed · Jul 5, 12:30',
    alert: null,
    phone: '+1 223-555-5382', email: 'olivia.smith@example.com',
  },
  'INT-1249933': {
    summary: 'The system read this refund case as partially resolved — a refund was issued but the customer questioned the amount.',
    read: { tone: 'mixed', label: 'Partially resolved · mixed', expected: [3, 4] },
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
    read: { tone: 'mixed', label: 'Acknowledged · mixed', expected: [3, 4] },
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
    read: { tone: 'positive', label: 'Resolved · likely positive', expected: [4, 5] },
    alsoFound: [],
    questions: [
      { q: 'How would you rate how we handled your technical troubleshooting today?', a: '5 of 5', alternatives: ['Is your device staying connected after the reset?', 'How easy were the reset steps to follow?'] },
      { q: 'What could have made the technical troubleshooting experience better?', a: '"Clear steps, worked first time."' },
    ],
    outcome: 'Survey completed · Jul 11, 15:14',
    alert: null,
    phone: '+1 223-555-8821', email: 'marcus.smith@example.com',
  },
  'INT-7339243': {
    summary: 'The system read this technical troubleshooting case as unresolved — no matching skill or team was available to route the case.',
    read: { tone: 'negative', label: 'Unresolved · likely negative', expected: [1, 2] },
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
    outcome: 'Survey completed · Jul 9, 16:49',
    alert: null,
    phone: '+1 223-555-1193', email: 'noah.patel@example.com',
  },
}

const CUSTOMER_DETAILS: Record<string, Record<string, CustomerDetail>> = {
  'Complaint Resolution Follow-Up': CRF_DETAILS,

  'Flight Disruption Recovery': {
    'INT-7102244': {
      summary: 'The system read this rebooking case as resolved — the customer was moved to the next direct flight and the new boarding pass was sent in the chat.',
      read: { tone: 'positive', label: 'Resolved · likely positive', expected: [4, 5] },
      alsoFound: ['Delay Notification'],
      questions: [
        { q: 'How would you rate how we handled your rebooking today?', a: '5 of 5', alternatives: ['Did the new flight work for your plans?', 'How easy was it to get rebooked after the cancellation?'] },
        { q: 'What could have made the rebooking experience better?', a: '"Honestly nothing — I had the new boarding pass before I reached the gate."' },
      ],
      outcome: 'Survey completed · Jul 3, 09:31', alert: null,
      phone: '+1 223-555-4102', email: 'elena.rossi@example.com',
    },
    'INT-7118830': {
      summary: 'The system read this delay case as handled — the customer was told about the 2-hour delay before reaching the airport and given a meal voucher.',
      read: { tone: 'positive', label: 'Handled · likely positive', expected: [4, 5] },
      alsoFound: [],
      questions: [
        { q: 'How would you rate the way we kept you informed about your delay?', a: '4 of 5', alternatives: ['Did you hear about the delay before you left for the airport?', 'Was the delay information clear and on time?'] },
        { q: 'What could have made the delay experience better?', a: '"An earlier message — I was already in the taxi."' },
      ],
      outcome: 'Survey completed · Jul 4, 19:05', alert: null,
      phone: '+1 223-555-4188', email: 'kwame.mensah@example.com',
    },
    'INT-7124519': {
      summary: 'The system read this compensation case as pending — the claim was filed in the chat but a decision had not been made when the conversation ended.',
      read: { tone: 'mixed', label: 'Pending · mixed', expected: [3, 4] },
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
      read: { tone: 'mixed', label: 'Recovered · mixed', expected: [3, 4] },
      alsoFound: ['Hotel Voucher'],
      questions: [
        { q: 'How would you rate how we handled your missed connection?', a: '2 of 5', alternatives: ['Was the overnight stay arranged smoothly?', 'How satisfied are you with the next flight we found?'] },
        { q: 'What could have made the missed connection experience better?', a: '"The hotel voucher only arrived after I had paid for a room myself."' },
      ],
      outcome: 'Survey completed · Jul 7, 08:16',
      alert: { name: 'Detractor alert', rule: 'CSAT ≤ 2 on a Missed Connection interaction', sentTo: 'Airport Operations lead (Farah K.)', via: 'Email', when: 'Jul 7, 08:18' },
      phone: '+1 223-555-4310', email: 'diego.martin@example.com',
    },
    'INT-7139902': {
      summary: 'The system read this baggage case as acknowledged — a delayed-bag report was opened and a delivery address captured.',
      read: { tone: 'mixed', label: 'Acknowledged · mixed', expected: [3, 4] },
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
      read: { tone: 'positive', label: 'Resolved · likely positive', expected: [4, 5] },
      alsoFound: ['Rebooking'],
      questions: [
        { q: 'How would you rate the hotel arrangements we made for you?', a: '5 of 5', alternatives: ['Was the hotel voucher easy to use?', 'How was the transfer to the hotel?'] },
        { q: 'What could have made the overnight stay better?', a: '"Quick and painless. The transfer was waiting when I got out."' },
      ],
      outcome: 'Survey completed · Jul 11, 07:58', alert: null,
      phone: '+1 223-555-4462', email: 'oliver.brooks@example.com',
    },
    'INT-7151460': {
      summary: null, read: null, alsoFound: [], questions: [],
      outcome: 'No survey was sent — no program matched this interaction.', alert: null,
      phone: '+1 223-555-4514', email: 'amara.okafor@example.com',
    },
    'INT-7158331': {
      summary: 'The system read this delay case as unresolved — the customer complained twice about a 4-hour delay and no compensation was offered in the chat.',
      read: { tone: 'negative', label: 'Unresolved · likely negative', expected: [2, 3] },
      alsoFound: ['Compensation Claim'],
      questions: [
        { q: 'How would you rate the way we handled your 4-hour delay?', a: '4 of 5', alternatives: ['Were you offered anything during the delay?', 'Did the delay updates arrive when you needed them?'] },
        { q: 'What could have made the delay experience better?', a: '"The agent could not do much, but the lounge pass she sent made the wait fine."' },
      ],
      outcome: 'Survey completed · Jul 12, 16:50', alert: null,
      phone: '+1 223-555-4583', email: 'lucas.dubois@example.com',
    },
    'INT-7163904': {
      summary: 'The system read this compensation case as resolved — the EU261 claim was approved during the chat and the payment date confirmed.',
      read: { tone: 'positive', label: 'Resolved · likely positive', expected: [4, 5] },
      alsoFound: [],
      questions: [
        { q: 'How would you rate how we handled your compensation claim?', a: '5 of 5', alternatives: ['Was the compensation amount explained clearly?', 'Do you know when the payment will arrive?'] },
        { q: 'What could have made the claim experience better?', a: '"Approved on the spot — that never happens."' },
      ],
      outcome: 'Survey completed · Jul 14, 10:55', alert: null,
      phone: '+1 223-555-4639', email: 'sara.haddad@example.com',
    },
    'INT-7170125': {
      summary: 'The system read this missed connection as unresolved — the chat was closed by the assistant before a rebooking agent was available.',
      read: { tone: 'negative', label: 'Unresolved · likely negative', expected: [1, 2] },
      alsoFound: ['Bot Transfer Friction'], questions: [],
      outcome: 'No survey was sent — no matching skill or team.', alert: null,
      phone: '+1 223-555-4701', email: 'jonas.berg@example.com',
    },
  },

  'Billing and Refund Recovery · All Digital': {
    'INT-8201133': {
      summary: 'The system read this refund case as resolved — the refund was issued in the chat and a 3–5 day arrival window given.',
      read: { tone: 'positive', label: 'Resolved · likely positive', expected: [4, 5] },
      alsoFound: [],
      questions: [
        { q: 'How would you rate how we handled your refund today?', a: '5 of 5', alternatives: ['Were you told when the refund will arrive?', 'Was the refund amount what you expected?'] },
        { q: 'What could have made the refund experience better?', a: '"Nothing — I had the confirmation before the chat ended."' },
      ],
      outcome: 'Survey completed · Jul 2, 10:34', alert: null,
      phone: '+1 223-555-5108', email: 'grace.kim@example.com',
    },
    'INT-8207448': {
      summary: 'The system read this duplicate charge as resolved — the second charge was reversed and the customer was sent the reference number.',
      read: { tone: 'positive', label: 'Resolved · likely positive', expected: [4, 5] },
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
      read: { tone: 'mixed', label: 'Partially resolved · mixed', expected: [3, 4] },
      alsoFound: ['Billing Dispute'],
      questions: [
        { q: 'How would you rate how we handled your refund today?', a: '1 of 5', alternatives: ['Was the deducted fee explained before the refund?', 'Was the refund amount what you expected?'] },
        { q: 'What could have made the refund experience better?', a: '"Nobody mentioned a fee until the money arrived short. I would have cancelled differently."' },
      ],
      outcome: 'Survey completed · Jul 5, 09:44',
      alert: { name: 'Detractor alert', rule: 'CSAT ≤ 2 on a Partial Refund interaction', sentTo: 'Billing supervisor (Dana M.)', via: 'Email', when: 'Jul 5, 09:46' },
      phone: '+1 223-555-5236', email: 'isabella.costa@example.com',
    },
    'INT-8220015': {
      summary: 'The system read this cancellation as completed — the subscription was ended and a pro-rated refund confirmed.',
      read: { tone: 'mixed', label: 'Completed · mixed', expected: [3, 4] },
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
      read: { tone: 'positive', label: 'Resolved · likely positive', expected: [4, 5] },
      alsoFound: [],
      questions: [
        { q: 'How would you rate the help you got with the failed payment?', a: '4 of 5', alternatives: ['Was the reason for the failed payment clear?', 'How easy was it to update your card?'] },
        { q: 'What could have made this experience better?', a: '"Fine, though I had to re-enter the card twice."' },
      ],
      outcome: 'Survey completed · Jul 8, 12:30', alert: null,
      phone: '+1 223-555-5347', email: 'chloe.martin@example.com',
    },
    'INT-8233309': {
      summary: 'The system read this billing dispute as unresolved — the disputed charge was escalated for review with a 5-day turnaround.',
      read: { tone: 'negative', label: 'Unresolved · likely negative', expected: [1, 3] },
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
      read: { tone: 'positive', label: 'Resolved · likely positive', expected: [4, 5] },
      alsoFound: [],
      questions: [
        { q: 'How would you rate how we corrected your invoice?', a: '5 of 5', alternatives: ['Did the corrected invoice have everything you needed?', 'How quickly did we fix your invoice?'] },
        { q: 'What could have made this experience better?', a: '"Corrected invoice in my inbox in four minutes. Perfect."' },
      ],
      outcome: 'Survey completed · Jul 11, 11:40', alert: null,
      phone: '+1 223-555-5468', email: 'emily.zhang@example.com',
    },
    'INT-8246580': {
      summary: 'The system read this refund case as unresolved — this was the customer\'s second contact about the same refund and no date could be given.',
      read: { tone: 'negative', label: 'Unresolved · likely negative', expected: [1, 3] },
      alsoFound: ['Repeat Contact'],
      questions: [
        { q: 'How would you rate how we handled your refund today?', a: '2 of 5', alternatives: ['Is this the first time you have contacted us about this refund?', 'Were you told when the refund will arrive?'] },
        { q: 'What could have made the refund experience better?', a: '"Second chat, same answer: it is being processed. Give me a date."' },
      ],
      outcome: 'Survey completed · Jul 13, 09:01',
      alert: { name: 'Detractor alert', rule: 'CSAT ≤ 2 on a repeat Refund Processing contact', sentTo: 'Billing supervisor (Dana M.)', via: 'Email', when: 'Jul 13, 09:03' },
      phone: '+1 223-555-5521', email: 'pedro.alves@example.com',
    },
    'INT-8252217': {
      summary: null, read: null, alsoFound: [], questions: [],
      outcome: 'No survey was sent — no program matched this interaction.', alert: null,
      phone: '+1 223-555-5587', email: 'fatima.alsayed@example.com',
    },
    'INT-8258866': {
      summary: 'The system read this billing dispute as resolved — the disputed charge was waived as a goodwill gesture during the chat.',
      read: { tone: 'positive', label: 'Resolved · likely positive', expected: [4, 5] },
      alsoFound: [], questions: [],
      outcome: 'No survey was sent — the customer has opted out of surveys.', alert: null,
      phone: '+1 223-555-5644', email: 'henry.walsh@example.com',
    },
  },

  'Omnichannel Escalation Recovery': {
    'INT-9301207': {
      summary: 'The system read this hand-off as smooth — the chat was transferred to voice with the transcript attached and the issue closed on the call.',
      read: { tone: 'positive', label: 'Resolved · likely positive', expected: [4, 5] },
      alsoFound: ['Account Access'],
      questions: [
        { q: 'How would you rate the hand-over from chat to a phone call today?', a: '4 of 5', alternatives: ['Did you have to repeat your issue after the transfer?', 'How long did you wait for the call after the chat?'] },
        { q: 'What could have made the hand-over better?', a: '"The agent on the phone already knew everything. Just a slightly long wait."' },
      ],
      outcome: 'Survey completed · Jul 4, 13:40', alert: null,
      phone: '+1 223-555-6112', email: 'nadia.petrova@example.com',
    },
    'INT-9307734': {
      summary: 'The system read this case as unresolved — this was the customer\'s third contact in two weeks about the same account lock.',
      read: { tone: 'negative', label: 'Unresolved · likely negative', expected: [1, 2] },
      alsoFound: ['Account Access'],
      questions: [
        { q: 'How would you rate how we handled your issue this time?', a: '2 of 5', alternatives: ['Is your account lock finally fixed?', 'How many times have you had to contact us about this?'] },
        { q: 'What could have made this experience better?', a: '"Three chats, three different agents, same lock. Someone needs to own it."' },
      ],
      outcome: 'Survey completed · Jul 5, 17:20',
      alert: { name: 'Repeat-contact alert', rule: 'CSAT ≤ 2 on a third contact within 14 days', sentTo: 'Escalations supervisor (Jordan P.)', via: 'Email', when: 'Jul 5, 17:22' },
      phone: '+1 223-555-6179', email: 'caleb.johnson@example.com',
    },
    'INT-9313351': {
      summary: 'The system read this callback case as failed — a 2 pm callback was promised in the chat and had not happened by the time the survey was sent.',
      read: { tone: 'negative', label: 'Failed · likely negative', expected: [1, 2] },
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
      read: { tone: 'positive', label: 'Resolved · likely positive', expected: [4, 5] },
      alsoFound: [],
      questions: [
        { q: 'How would you rate the way your case was escalated today?', a: '5 of 5', alternatives: ['How long did you wait for the supervisor?', 'Did the supervisor resolve what the first agent could not?'] },
        { q: 'What could have made the escalation better?', a: '"Six minutes to a supervisor and a yes. Nothing to add."' },
      ],
      outcome: 'Survey completed · Jul 8, 11:58', alert: null,
      phone: '+1 223-555-6298', email: 'sofia.hernandez@example.com',
    },
    'INT-9326604': {
      summary: 'The system read this case as handled — the customer looped twice in the assistant before reaching an agent, who then resolved the query.',
      read: { tone: 'mixed', label: 'Handled · mixed', expected: [3, 4] },
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
      read: { tone: 'positive', label: 'Resolved · likely positive', expected: [4, 5] },
      alsoFound: ['Technical Troubleshooting'],
      questions: [
        { q: 'How would you rate how we handled your reopened case?', a: '3 of 5', alternatives: ['Is the issue fixed for good this time?', 'Was it easy to reopen your case?'] },
        { q: 'What could have made this experience better?', a: '"Fixed again, yes — but it is the second time. I am waiting to see if it holds."' },
      ],
      outcome: 'Survey completed · Jul 11, 10:47', alert: null,
      phone: '+1 223-555-6417', email: 'laura.fischer@example.com',
    },
    'INT-9338877': {
      summary: 'The system read this hand-off as mixed — the customer had to repeat the order number after the transfer, though the issue was then resolved.',
      read: { tone: 'mixed', label: 'Resolved with friction · mixed', expected: [3, 4] },
      alsoFound: ['Delivery Delay'],
      questions: [
        { q: 'How would you rate the hand-over from chat to a phone call today?', a: '5 of 5', alternatives: ['Did you have to repeat your issue after the transfer?', 'Was the person on the phone able to help straight away?'] },
        { q: 'What could have made the hand-over better?', a: '"Had to give the order number again, but the agent sorted it in two minutes."' },
      ],
      outcome: 'Survey completed · Jul 12, 15:25', alert: null,
      phone: '+1 223-555-6480', email: 'mateo.silva@example.com',
    },
    'INT-9345513': {
      summary: 'The system read this case as unresolved — the customer asked for the agent from their last contact and no routing skill matched.',
      read: { tone: 'negative', label: 'Unresolved · likely negative', expected: [1, 2] },
      alsoFound: [], questions: [],
      outcome: 'No survey was sent — no matching skill or team.', alert: null,
      phone: '+1 223-555-6536', email: 'zara.ahmed@example.com',
    },
    'INT-9352159': {
      summary: 'The system read this escalation as resolved — the supervisor callback came 20 minutes after the chat and the refund exception was approved.',
      read: { tone: 'positive', label: 'Resolved · likely positive', expected: [4, 5] },
      alsoFound: ['Refund Processing'],
      questions: [
        { q: 'How would you rate the way your case was escalated today?', a: '4 of 5', alternatives: ['How long did you wait for the supervisor?', 'Did the escalation get you a different answer?'] },
        { q: 'What could have made the escalation better?', a: '"Good outcome. Would have preferred to stay in the chat rather than wait for a call."' },
      ],
      outcome: 'Survey completed · Jul 15, 09:12', alert: null,
      phone: '+1 223-555-6591', email: 'thomas.muller@example.com',
    },
  },

  'Product Feedback - Beta Testers': {
    'INT-6401118': {
      summary: 'The system read this sync issue as unresolved — changes made on desktop did not appear on mobile and the agent logged a bug rather than a fix.',
      read: { tone: 'negative', label: 'Unresolved · likely negative', expected: [2, 3] },
      alsoFound: ['Bug Report'],
      questions: [
        { q: 'How would you rate your experience with mobile sync in the beta?', a: '2 of 5', alternatives: ['How often do your desktop changes fail to appear on mobile?', 'Did the workaround the agent suggested help?'] },
        { q: 'What would make the mobile app more useful for you?', a: '"Sync. That is it. I stopped trusting the mobile numbers."' },
      ],
      outcome: 'Survey completed · Jul 1, 10:38',
      alert: { name: 'Beta blocker alert', rule: 'CSAT ≤ 2 on a Mobile App Sync interaction', sentTo: 'Product owner (Maya R.)', via: 'Email', when: 'Jul 1, 10:40' },
      phone: '+1 223-555-7109', email: 'jordan.lee@example.com',
    },
    'INT-6407752': {
      summary: 'The system read this onboarding session as completed — the tester finished setup in one session and imported two data sources.',
      read: { tone: 'positive', label: 'Completed · likely positive', expected: [4, 5] },
      alsoFound: [],
      questions: [
        { q: 'How would you rate getting started with the beta?', a: '4 of 5', alternatives: ['How long did setup take you?', 'Did the data import work first time?'] },
        { q: 'What would have made onboarding smoother?', a: '"Good overall. The import step needed a second read of the instructions."' },
      ],
      outcome: 'Survey completed · Jul 2, 16:02', alert: null,
      phone: '+1 223-555-7163', email: 'priyanka.rao@example.com',
    },
    'INT-6413397': {
      summary: 'The system read this export issue as partially resolved — CSV export worked, but the PDF layout cut off the last column.',
      read: { tone: 'mixed', label: 'Partially resolved · mixed', expected: [3, 4] },
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
      read: { tone: 'positive', label: 'Resolved · likely positive', expected: [4, 5] },
      alsoFound: [],
      questions: [
        { q: 'How would you rate managing your notifications in the beta?', a: '5 of 5', alternatives: ['Were the notification options easy to find?', 'Are you getting the right amount of notifications now?'] },
        { q: 'What would make notifications better?', a: '"Exactly what I wanted once I knew where it was."' },
      ],
      outcome: 'Survey completed · Jul 6, 10:15', alert: null,
      phone: '+1 223-555-7284', email: 'aisha.bello@example.com',
    },
    'INT-6426661': {
      summary: 'The system read this import session as stalled — the tester hit a file-size limit twice and ended the chat without completing the import.',
      read: { tone: 'negative', label: 'Stalled · likely negative', expected: [2, 3] },
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
      read: { tone: 'mixed', label: 'Partially resolved · mixed', expected: [3, 4] },
      alsoFound: [],
      questions: [
        { q: 'How would you rate your experience with mobile sync in the beta?', a: '1 of 5', alternatives: ['Did the manual refresh fix it for good?', 'How often do your desktop changes fail to appear on mobile?'] },
        { q: 'What would make the mobile app more useful for you?', a: '"A manual refresh is not a fix. It was out of date again an hour later."' },
      ],
      outcome: 'Survey completed · Jul 9, 17:40',
      alert: { name: 'Beta blocker alert', rule: 'CSAT ≤ 2 on a Mobile App Sync interaction', sentTo: 'Product owner (Maya R.)', via: 'Email', when: 'Jul 9, 17:42' },
      phone: '+1 223-555-7396', email: 'hana.sato@example.com',
    },
    'INT-6439934': {
      summary: 'The system read this request as unmet — the tester asked for scheduled reports, which are not on the beta roadmap.',
      read: { tone: 'negative', label: 'Unmet need · likely negative', expected: [2, 3] },
      alsoFound: ['Dashboard Export'],
      questions: [
        { q: 'How would you rate the response to your feature request?', a: '4 of 5', alternatives: ['Was it clear whether your request will be built?', 'Did we suggest a workaround that helps?'] },
        { q: 'What feature would make the biggest difference for you?', a: '"Scheduled reports. They said no for now, but explained why — I can live with that."' },
      ],
      outcome: 'Survey completed · Jul 11, 11:05', alert: null,
      phone: '+1 223-555-7452', email: 'daniel.osei@example.com',
    },
    'INT-6446570': {
      summary: 'The system read this bug report as resolved — the filter-reset bug was reproduced and a fix confirmed for the next beta build.',
      read: { tone: 'positive', label: 'Resolved · likely positive', expected: [4, 5] },
      alsoFound: [],
      questions: [
        { q: 'How would you rate how we handled your bug report?', a: '4 of 5', alternatives: ['Was the bug reproduced while you were in the chat?', 'Do you know when the fix will ship?'] },
        { q: 'What would make reporting bugs easier?', a: '"A way to attach a screen recording from inside the app."' },
      ],
      outcome: 'Survey completed · Jul 13, 14:48', alert: null,
      phone: '+1 223-555-7517', email: 'lena.hoffmann@example.com',
    },
    'INT-6453206': {
      summary: null, read: null, alsoFound: [], questions: [],
      outcome: 'No survey was sent — no program matched this interaction.', alert: null,
      phone: '+1 223-555-7573', email: 'omar.farouk@example.com',
    },
    'INT-6459843': {
      summary: 'The system read this export question as unresolved — the chat arrived outside beta-support hours and no team was available.',
      read: { tone: 'negative', label: 'Unresolved · likely negative', expected: [2, 3] },
      alsoFound: [], questions: [],
      outcome: 'No survey was sent — no matching skill or team.', alert: null,
      phone: '+1 223-555-7630', email: 'mia.andersen@example.com',
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

function CustomerDrawer({ row, detail: d, onClose }: { row: ResponseRow; detail: CustomerDetail; onClose: () => void }) {

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
        style={{ position: 'relative', width: 540, maxWidth: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--lyra-color-bg-surface-base)', borderLeft: '1px solid var(--lyra-color-border-soft)', boxShadow: 'var(--sol-effect-shadowlg)' }}
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
          {/* 1. What the system read from the interaction */}
          <DrawerSection label="What the system read">
            {row.topic ? (
              <div style={{ padding: 'var(--space-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span style={{ font: `500 16px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>{row.topic}</span>
                    <span style={{ padding: '1px 8px', borderRadius: 'var(--radius-full)', background: 'var(--lyra-purple-700)', font: `600 10px/14px ${FONT}`, letterSpacing: '0.06em', color: 'var(--lyra-color-fg-inverse)' }}>PRIMARY TOPIC</span>
                  </span>
                  <AiChip />
                </div>
                {d.read && <div style={{ marginTop: 'var(--space-2)' }}><TonePill tone={d.read.tone} label={d.read.label} /></div>}
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
            ) : emptyNote('No topic was detected, so the system used the generic survey question.')}
          </DrawerSection>

          {/* 2. System expectation vs. what the customer chose */}
          <DrawerSection label="System read vs. customer rating">
            {(() => {
              const exp = d.read?.expected ?? null
              const got = row.csat
              const diverges = exp !== null && got !== null && (got < exp[0] || got > exp[1])
              const matches = exp !== null && got !== null && !diverges
              const tile = (label: string, body: React.ReactNode, sub: string) => (
                <div style={{ flex: 1, minWidth: 0, padding: 'var(--space-3) var(--space-4)' }}>
                  <div style={{ font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>{label}</div>
                  <div style={{ marginTop: 4, minHeight: 20, display: 'flex', alignItems: 'center' }}>{body}</div>
                  <div style={{ font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-secondary)', marginTop: 4 }}>{sub}</div>
                </div>
              )
              return (
                <div>
                  <div style={{ display: 'flex' }}>
                    {tile(
                      'System expected',
                      exp ? <span style={{ font: `600 16px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>{exp[0] === exp[1] ? exp[0] : `${exp[0]}–${exp[1]}`} of 5</span> : <Muted>No expectation</Muted>,
                      exp ? 'from the interaction read' : 'no topic was detected',
                    )}
                    <div style={{ width: 1, background: 'var(--lyra-color-border-subtle)' }} />
                    {tile(
                      'Customer rated',
                      got !== null ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Stars n={got} /><b style={{ font: `600 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>{got} of 5</b></span> : <Muted>{surveySent ? 'No rating yet' : 'No survey sent'}</Muted>,
                      got !== null ? 'CSAT' : surveySent ? 'the customer has not responded' : 'nothing to compare',
                    )}
                    <div style={{ width: 1, background: 'var(--lyra-color-border-subtle)' }} />
                    {tile(
                      'Agent rated',
                      row.asat !== null ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Stars n={row.asat} /><b style={{ font: `600 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>{row.asat} of 5</b></span> : <Muted>n/a</Muted>,
                      'ASAT',
                    )}
                  </div>
                  {(diverges || matches) && (
                    <div style={{ borderTop: '1px solid var(--lyra-color-border-subtle)', padding: 'var(--space-3) var(--space-4)', display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)', font: `400 13px/18px ${FONT}`, color: diverges ? 'var(--lyra-color-status-warning-strong)' : 'var(--lyra-color-status-success-strong)', background: diverges ? 'var(--lyra-color-status-warning-subtle)' : 'var(--lyra-color-status-success-subtle)' }}>
                      {diverges ? <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 2 }} /> : <CheckCircle2 size={14} style={{ flexShrink: 0, marginTop: 2 }} />}
                      <span>
                        {diverges
                          ? <><b style={{ fontWeight: 600 }}>Diverges.</b> The customer rated {got! < exp![0] ? 'lower' : 'higher'} than the system read suggested — worth a look at the verbatim.</>
                          : <><b style={{ fontWeight: 600 }}>Matches.</b> The customer's rating is in line with what the system read.</>}
                      </span>
                    </div>
                  )}
                </div>
              )
            })()}
          </DrawerSection>

          {/* 3. How the conversation went */}
          <DrawerSection label="Conversation flow">
            {d.questions.length > 0 ? (
              <div>
                {d.questions.map((item, i) => (
                  <div key={i} style={{ padding: 'var(--space-3) var(--space-4)', borderTop: i > 0 ? '1px solid var(--lyra-color-border-subtle)' : undefined }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 6 }}>
                      <span style={{ font: `500 12px/16px ${FONT}`, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--lyra-color-fg-secondary)' }}>{i === 0 ? 'Generated question' : 'Follow-up'}</span>
                      <span style={{ padding: '1px 8px', borderRadius: 'var(--radius-full)', background: 'var(--lyra-brand-50)', color: 'var(--lyra-brand-700)', font: `500 11px/14px ${FONT}` }}>Asked</span>
                      <span style={{ marginLeft: 'auto' }}><AiChip /></span>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-start' }}>
                      <MessageSquare size={14} style={{ color: 'var(--lyra-color-fg-secondary)', flexShrink: 0, marginTop: 3 }} />
                      <span style={{ font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>{item.q}</span>
                    </div>
                    {item.alternatives && item.alternatives.length > 0 && (
                      <details style={{ marginTop: 'var(--space-2)', marginLeft: 22 }}>
                        <summary style={{ cursor: 'pointer', font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-link)', listStyle: 'none' }}>
                          {item.alternatives.length} other question{item.alternatives.length > 1 ? 's' : ''} considered
                        </summary>
                        <ul style={{ margin: '6px 0 0', paddingLeft: 16, font: `400 13px/18px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>
                          {item.alternatives.map(alt => <li key={alt} style={{ marginBottom: 2 }}>{alt}</li>)}
                        </ul>
                      </details>
                    )}
                    <div style={{ marginTop: 'var(--space-3)', marginLeft: 22, padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', background: item.a ? 'var(--lyra-color-bg-surface-shell)' : 'transparent', border: item.a ? 'none' : '1px dashed var(--lyra-color-border-soft)' }}>
                      <div style={{ font: `500 12px/16px ${FONT}`, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--lyra-color-fg-secondary)', marginBottom: 2 }}>Customer</div>
                      {item.a
                        ? (/^\d of 5$/.test(item.a)
                          ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Stars n={parseInt(item.a, 10)} size={14} /><b style={{ font: `500 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>{item.a}</b></span>
                          : <span style={{ font: `500 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>{item.a}</span>)
                        : <span style={{ font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-disabled)' }}>No answer</span>}
                    </div>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid var(--lyra-color-border-subtle)', padding: 'var(--space-3) var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', font: `400 13px/18px ${FONT}`, color: 'var(--lyra-color-fg-secondary)', background: 'var(--lyra-color-bg-surface-canvas)' }}>
                  <span style={{ font: `500 12px/16px ${FONT}`, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Outcome</span>
                  <span style={{ color: 'var(--lyra-color-fg-default)' }}>{d.outcome}</span>
                </div>
              </div>
            ) : emptyNote(d.outcome)}
          </DrawerSection>

          {/* 4. Alert — always shown so "none" is explicit */}
          <DrawerSection label="Alert">
            {d.alert ? (
              <div style={{ padding: 'var(--space-3) var(--space-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span style={{ width: 28, height: 28, borderRadius: 'var(--radius-full)', display: 'grid', placeItems: 'center', background: 'var(--lyra-color-status-critical-subtle)', color: 'var(--lyra-color-status-critical-strong)' }}><Bell size={14} /></span>
                  <span style={{ font: `500 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>{d.alert.name} generated</span>
                  <span style={{ marginLeft: 'auto', font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-secondary)', whiteSpace: 'nowrap' }}>{d.alert.when}</span>
                </div>
                <dl style={{ margin: 'var(--space-3) 0 0', display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 'var(--space-4)', rowGap: 4, font: `400 13px/18px ${FONT}` }}>
                  <dt style={{ color: 'var(--lyra-color-fg-secondary)' }}>Rule</dt><dd style={{ margin: 0, color: 'var(--lyra-color-fg-default)' }}>{d.alert.rule}</dd>
                  <dt style={{ color: 'var(--lyra-color-fg-secondary)' }}>Sent to</dt><dd style={{ margin: 0, color: 'var(--lyra-color-fg-default)' }}>{d.alert.sentTo} · {d.alert.via}</dd>
                </dl>
              </div>
            ) : (
              <div style={{ padding: 'var(--space-3) var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{ width: 28, height: 28, borderRadius: 'var(--radius-full)', display: 'grid', placeItems: 'center', background: 'var(--lyra-slate-100)', color: 'var(--lyra-color-fg-secondary)' }}><BellOff size={14} /></span>
                <div>
                  <div style={{ font: `500 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>No alert generated</div>
                  <div style={{ font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>
                    {surveySent ? (row.csat === null ? 'No rating was given, so no alert rule could fire.' : 'No alert criteria were met for this response.') : 'No survey was sent, so no alert rule applied.'}
                  </div>
                </div>
              </div>
            )}
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
  const [showInsight, setShowInsight] = useState(false)

  const k = range ? rangeDays(range) / 7 : 1
  const perf: PerfData = {
    inter: (PROGRAM_INTER_OVERRIDE[program.n] ?? program.inter) * k,
    elig: program.elig * k, sent: program.sent * k, rec: program.rec * k, comp: program.comp * k,
    csat: program.csat, asat: program.asat, alerts: program.alerts,
  }
  const status = program.tags.find(t => t === 'Active' || t === 'Inactive') || ''

  const q = search.trim().toLowerCase()
  const allRows = DETAIL_RESPONSES[program.n] ?? []
  const details = CUSTOMER_DETAILS[program.n] ?? {}
  const responseTabs: [string, number][] = [
    ['All', allRows.length],
    ['Survey sent', allRows.filter(r => r.sent !== null).length],
    ['Not sent', allRows.filter(r => r.sent === null).length],
  ]
  const rows = allRows.filter(r =>
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

        <div style={{ marginTop: 'var(--space-6)' }}>
          <InsightBanner program={program} onOpen={() => setShowInsight(true)} />
        </div>

        <div style={{ marginTop: 'var(--space-6)' }}>
          <ProgramPerformance programNames={[{ n: program.n, active: program.tags.includes('Active') }]} data={perf} deltas={PROGRAM_DELTAS[program.n] ?? OVERVIEW_DELTAS} periodNote={previousPeriodNote(range)} />
        </div>

        {/* Customer responses */}
        <div style={{ marginTop: 'var(--space-6)', background: 'var(--lyra-color-bg-surface-base)', border: '1px solid var(--lyra-color-border-subtle)', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ padding: 'var(--space-5) var(--space-6)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--lyra-color-border-subtle)' }}>
            <div>
              <h3 style={{ font: `600 18px/24px ${FONT}`, letterSpacing: '-0.01em', margin: 0, color: 'var(--lyra-color-fg-default)' }}>Customer responses</h3>
              <div style={{ font: `400 14px/16px ${FONT}`, color: 'var(--lyra-color-fg-secondary)', marginTop: 2 }}>Every interaction in the period, whether or not a survey was sent.</div>
            </div>
            <div style={{ display: 'flex', border: '1px solid var(--lyra-color-border-subtle)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
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
            <span style={{ font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>1 to {rows.length} of {rows.length}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <button disabled aria-label="Previous page" style={{ width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--lyra-color-border-soft)', borderRadius: 'var(--radius-sm)', background: 'var(--lyra-color-bg-surface-base)', color: 'var(--lyra-color-fg-disabled)', cursor: 'not-allowed' }}>
                <ChevronLeft size={14} />
              </button>
              <span style={{ font: `400 12px/16px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>1 / 1</span>
              <button disabled aria-label="Next page" style={{ width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--lyra-color-border-soft)', borderRadius: 'var(--radius-sm)', background: 'var(--lyra-color-bg-surface-base)', color: 'var(--lyra-color-fg-disabled)', cursor: 'not-allowed' }}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {openRow && details[openRow.id] && <CustomerDrawer row={openRow} detail={details[openRow.id]} onClose={() => setOpenRow(null)} />}
      {showInsight && <InsightDrawer program={program} onClose={() => setShowInsight(false)} onOpenProgram={() => setShowInsight(false)} />}
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
export function ProgramHealth2Page() {
  const [search, setSearch] = useState('')
  const [progs, setProgs] = useState<string[]>([])
  const [chs, setChs] = useState<string[]>([])
  const [cats, setCats] = useState<string[]>([])
  const [range, setRange] = useState<DateRange | null>(DEFAULT_RANGE)
  const [selected, setSelected] = useState<typeof PROGRAMS[0] | null>(null)
  const [insight, setInsight] = useState<typeof PROGRAMS[0] | null>(null)
  const [perfTab, setPerfTab] = useState<PerfTab>('el')
  const perfRef = useRef<HTMLDivElement>(null)

  const data = useSlicedData({ progs, chs, cats, days: range ? rangeDays(range) : 7 })

  if (selected) {
    return <ProgramDetailView program={selected} onBack={() => setSelected(null)} />
  }

  const showNotEligible = () => {
    setPerfTab('ne')
    requestAnimationFrame(() => perfRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  const multiLabel = (v: string[], all: string, noun: string) => (v.length === 0 ? all : v.length === 1 ? v[0] : `${v.length} ${noun}`)
  const defaultRange = isDefaultRange(range)
  const hasFilters = !defaultRange || progs.length > 0 || chs.length > 0 || cats.length > 0
  const chipCount = (defaultRange ? 0 : 1) + progs.length + chs.length + cats.length
  const clearAll = () => { setProgs([]); setChs([]); setCats([]); setRange(DEFAULT_RANGE()) }
  const groups: [string, string[], (v: string[]) => void][] = [['Program', progs, setProgs], ['Channel', chs, setChs], ['Topic', cats, setCats]]

  return (
    <div className="flex flex-col flex-1 h-full" style={{ background: 'var(--lyra-color-bg-surface-base)' }}>
      <div className="flex-1 min-h-0" style={{ paddingTop: 'var(--space-6)', paddingLeft: 'var(--space-7)', paddingRight: 'var(--space-7)', paddingBottom: 'var(--space-6)', overflowY: 'auto' }}>
        <TodaysHighlights programs={data.programs} inter={data.inter} elig={data.elig} onOpenInsight={setInsight} onShowNotEligible={showNotEligible} />

        {/* Filter Bar */}
        <div style={{ marginTop: 'var(--space-6)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search program name" />
          <DateRangePicker value={range} onChange={setRange} />
          <div style={{ width: 230 }}>
            <MultiSelectField options={PROGRAMS.map(p => p.n)} value={progs} onChange={setProgs} mutedPlaceholder={false} labelOverride={multiLabel(progs, 'All programs', 'programs')} radius="var(--radius-md)" optionStatus={opt => PROGRAMS.find(p => p.n === opt)?.tags.includes('Active')} />
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

        <div ref={perfRef} style={{ marginTop: 'var(--space-6)', scrollMarginTop: 'var(--space-4)' }}>
          <ProgramPerformance programNames={data.programs.map(p => ({ n: p.n, active: p.tags.includes('Active') }))} data={data} deltas={OVERVIEW_DELTAS} periodNote={previousPeriodNote(range)} open={perfTab} onOpenChange={setPerfTab} />
        </div>

        <div style={{ marginTop: 'var(--space-6)' }}>
          <ProgramsTable programs={data.programs} searchQuery={search} onSelectProgram={setSelected} onOpenInsight={setInsight} />
        </div>
      </div>

      {insight && <InsightDrawer program={insight} onClose={() => setInsight(null)} onOpenProgram={() => { setSelected(insight); setInsight(null) }} />}
    </div>
  )
}
