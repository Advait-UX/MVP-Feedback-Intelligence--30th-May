import { useState, useMemo } from 'react'
import { Plus, Info, X, Check } from 'lucide-react'
import {
  FieldSelect, valueOptionsFor, disabledValuesFor, formatCriterionCondition, DEFAULT_CRITERION,
  type Criterion, type GroupJoin,
} from './AlertConditions'

const FONT = 'var(--font-sans)'

/*
 * Approach 2: a flat, ordered list of criteria. joins[i] links rows[i] and rows[i+1].
 * groups are inclusive, contiguous, non-overlapping index ranges that bind rows together
 * (evaluated first); everything else is read left to right.
 */
export type Alert2Conditions = { rows: Criterion[]; joins: GroupJoin[]; groups: [number, number][] }

export const MAX_ROWS = 5
const NEW_ROW: Criterion = { scoreType: 'ASAT', operator: 'Below', value: '02', outOf: '05' }

export function defaultAlert2Conditions(): Alert2Conditions {
  return { rows: [DEFAULT_CRITERION], joins: [], groups: [] }
}

export function groupOf(c: Alert2Conditions, i: number): number {
  return c.groups.findIndex(([s, e]) => i >= s && i <= e)
}

const keyOf = (r: Criterion) => `${r.scoreType}|${r.operator}|${r.value}|${r.outOf}`

/* Short form for the list page — e.g. "CSAT < 2/5 or CSAT < 5/10 and (ASAT < 2/5 or ASAT < 5/10)" */
export function formatNotifyWhen2(c: Alert2Conditions): string {
  const symbol = (op: string) => op === 'Below' ? '<' : op === 'Above' ? '>' : '='
  const fmt = (r: Criterion) => `${r.scoreType} ${symbol(r.operator)} ${parseInt(r.value, 10)}/${parseInt(r.outOf, 10)}`
  let out = ''
  c.rows.forEach((r, i) => {
    if (i > 0) out += ` ${c.joins[i - 1].toLowerCase()} `
    if (c.groups.some(([s]) => s === i)) out += '('
    out += fmt(r)
    if (c.groups.some(([, e]) => e === i)) out += ')'
  })
  return out
}

export type Alert2Issues = { rows: Record<number, string>; groups: Record<number, string>; hint?: string }

export function getAlert2Issues(c: Alert2Conditions): Alert2Issues {
  const rows: Record<number, string> = {}
  const groups: Record<number, string> = {}

  const byKey: Record<string, number[]> = {}
  c.rows.forEach((r, i) => { (byKey[keyOf(r)] ||= []).push(i) })
  Object.values(byKey).forEach(idxs => {
    if (idxs.length > 1) idxs.forEach(i => { rows[i] = 'Duplicate condition. This exact condition has already been added.' })
  })

  // Rows chained by And inside the same context (same group, or both ungrouped) must all hold at once
  const runs: number[][] = []
  let run = [0]
  for (let i = 0; i < c.joins.length; i++) {
    if (c.joins[i] === 'And' && groupOf(c, i) === groupOf(c, i + 1)) run.push(i + 1)
    else { runs.push(run); run = [i + 1] }
  }
  runs.push(run)
  runs.filter(r => r.length > 1).forEach(r => {
    const byScale: Record<string, number[]> = {}
    r.forEach(i => { if (!rows[i]) (byScale[`${c.rows[i].scoreType}|${c.rows[i].outOf}`] ||= []).push(i) })
    Object.values(byScale).forEach(idxs => {
      if (idxs.length < 2) return
      let lo = -Infinity, hi = Infinity
      idxs.forEach(i => {
        const v = parseInt(c.rows[i].value, 10)
        const op = c.rows[i].operator
        if (op === 'Below') hi = Math.min(hi, v - 0.01)
        else if (op === 'Above') lo = Math.max(lo, v + 0.01)
        else { lo = Math.max(lo, v); hi = Math.min(hi, v) }
      })
      if (lo > hi) idxs.forEach(i => { rows[i] = 'These conditions can never all be true at once — the alert would never fire.' })
    })
  })

  const fingerprints = c.groups.map(([s, e]) =>
    `${c.rows.slice(s, e + 1).map(keyOf).sort().join(';;')}::${c.joins.slice(s, e).join(',')}`
  )
  fingerprints.forEach((fp, gi) => {
    const first = fingerprints.findIndex((f, j) => f === fp && j < gi)
    if (first !== -1) groups[gi] = `This group is identical to Group ${first + 1}. Ungroup it or change the conditions.`
  })

  // Top-level joins = joins not fully inside a group
  const topLevel = c.joins.filter((_, i) => groupOf(c, i) === -1 || groupOf(c, i) !== groupOf(c, i + 1))
  const hint = topLevel.includes('And') && topLevel.includes('Or')
    ? 'Mixed "And" / "Or" without grouping is read left to right. Select rows and use Group selection to make the order explicit.'
    : undefined

  return { rows, groups, hint }
}

export function hasBlockingIssues(c: Alert2Conditions): boolean {
  const { rows, groups } = getAlert2Issues(c)
  return Object.keys(rows).length > 0 || Object.keys(groups).length > 0
}

/* ─── Small building blocks ─── */
const muted: React.CSSProperties = { font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', fontFamily: FONT }

function LinkBtn({ label, icon, onClick, disabled = false }: { label: string; icon?: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)',
        height: 32, padding: '0 var(--space-2)',
        border: 'none', borderRadius: 'var(--radius-sm)', background: 'none',
        font: '500 14px/20px var(--font-sans)', fontFamily: FONT, whiteSpace: 'nowrap',
        color: disabled ? 'var(--lyra-color-fg-disabled)' : 'var(--lyra-color-fg-link)',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
    >
      {icon}
      {label}
    </button>
  )
}

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, borderRadius: 'var(--radius-xs)' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
    >
      <span style={{
        width: 16, height: 16, borderRadius: 'var(--radius-xs)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: checked ? 'var(--lyra-color-bg-active-strong)' : 'var(--lyra-color-bg-field)',
        border: checked ? 'none' : '1px solid var(--lyra-color-border-strong)',
      }}>
        {checked && <Check size={11} strokeWidth={3} style={{ color: 'var(--lyra-color-fg-on-primary)' }} />}
      </span>
    </button>
  )
}

function IssueLine({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', paddingLeft: 52 }}>
      <Info size={12} style={{ color: 'var(--lyra-color-status-critical-strong)', flexShrink: 0 }} />
      <span style={{ font: '400 12px/16px var(--font-sans)', color: 'var(--lyra-color-status-critical-strong)', fontFamily: FONT, letterSpacing: '0.01em' }}>{text}</span>
    </div>
  )
}

function Banner({ text, tone }: { text: string; tone: 'critical' | 'info' }) {
  const color = tone === 'critical' ? 'var(--lyra-color-status-critical-strong)' : 'var(--lyra-color-status-info-strong)'
  const bg = tone === 'critical' ? 'var(--lyra-color-status-critical-subtle)' : 'var(--lyra-color-status-info-subtle)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-3)', background: bg, borderRadius: 'var(--radius-sm)' }}>
      <Info size={14} style={{ color, flexShrink: 0 }} />
      <span style={{ font: '400 12px/16px var(--font-sans)', color, fontFamily: FONT, letterSpacing: '0.01em' }}>{text}</span>
    </div>
  )
}

/* ─── Builder ─── */
export function ConditionsBuilder2({ value, onChange }: { value: Alert2Conditions; onChange: (v: Alert2Conditions) => void }) {
  const [selected, setSelected] = useState<number[]>([])
  const issues = useMemo(() => getAlert2Issues(value), [value])

  const sorted = [...selected].sort((a, b) => a - b)
  // Selecting any row of a group counts as selecting the whole group, so a group can be
  // extended with a neighbouring criterion or merged with an adjacent group.
  const effective = [...new Set(sorted.flatMap(i => {
    const gi = groupOf(value, i)
    if (gi === -1) return [i]
    const [s, e] = value.groups[gi]
    return Array.from({ length: e - s + 1 }, (_, k) => s + k)
  }))].sort((a, b) => a - b)
  const contiguous = effective.length >= 2 && effective.every((v, i) => i === 0 || v === effective[i - 1] + 1)
  const alreadyOneGroup = value.groups.some(([s, e]) => s === effective[0] && e === effective[effective.length - 1])
  const canGroup = contiguous && !alreadyOneGroup
  const canUngroup = sorted.some(i => groupOf(value, i) !== -1)

  const updateRow = (i: number, field: keyof Criterion, val: string) => {
    const rows = value.rows.map((r, idx) => {
      if (idx !== i) return r
      const next = { ...r, [field]: val }
      const options = valueOptionsFor(next.outOf)
      const disabled = disabledValuesFor(next.operator, next.outOf)
      if (!options.includes(next.value) || disabled.includes(next.value)) {
        next.value = options.find(o => !disabled.includes(o)) ?? next.value
      }
      return next
    })
    onChange({ ...value, rows })
  }
  const setJoin = (i: number, j: GroupJoin) => onChange({ ...value, joins: value.joins.map((x, idx) => idx === i ? j : x) })
  const addRow = () => onChange({ ...value, rows: [...value.rows, NEW_ROW], joins: [...value.joins, 'Or'] })
  const removeRow = (i: number) => {
    const rows = value.rows.filter((_, idx) => idx !== i)
    const joins = value.joins.filter((_, idx) => idx !== (i === 0 ? 0 : i - 1))
    const groups = value.groups
      .map(([s, e]): [number, number] => [i < s ? s - 1 : s, i <= e ? e - 1 : e])
      .filter(([s, e]) => e > s)
    onChange({ rows, joins, groups })
    setSelected(sel => sel.filter(x => x !== i).map(x => x > i ? x - 1 : x))
  }
  const groupSelection = () => {
    if (!canGroup) return
    const lo = effective[0], hi = effective[effective.length - 1]
    const groups = [
      ...value.groups.filter(([s, e]) => e < lo || s > hi),
      [lo, hi] as [number, number],
    ].sort((a, b) => a[0] - b[0])
    onChange({ ...value, groups })
    setSelected([])
  }
  const ungroup = () => {
    if (!canUngroup) return
    onChange({ ...value, groups: value.groups.filter(([s, e]) => !sorted.some(i => i >= s && i <= e)) })
    setSelected([])
  }
  const toggleSelected = (i: number, v: boolean) => setSelected(sel => v ? [...sel, i] : sel.filter(x => x !== i))
  const toggleGroupSelected = (gi: number, v: boolean) => {
    const [s, e] = value.groups[gi]
    const rows = Array.from({ length: e - s + 1 }, (_, k) => s + k)
    setSelected(sel => v ? [...new Set([...sel, ...rows])] : sel.filter(x => x < s || x > e))
  }

  const joinSelect = (i: number) => (
    <div style={{ paddingLeft: 52 }}>
      <FieldSelect value={value.joins[i]} options={['And', 'Or']} onChange={v => setJoin(i, v as GroupJoin)} width={80} />
    </div>
  )

  const row = (i: number, inGroup = false) => {
    const c = value.rows[i]
    return (
      <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-2)' }}>
          {inGroup
            ? <span aria-hidden style={{ width: 24, height: 24, flexShrink: 0 }} />
            : <Checkbox checked={selected.includes(i)} onChange={v => toggleSelected(i, v)} label={`Select criterion ${i + 1}`} />}
          <span style={{ ...muted, width: 12 }}>If</span>
          <FieldSelect value={c.scoreType} options={['CSAT', 'ASAT']} onChange={v => updateRow(i, 'scoreType', v)} width={180} />
          <span style={muted}>is</span>
          <FieldSelect value={c.operator} options={['Below', 'Equal to', 'Above']} onChange={v => updateRow(i, 'operator', v)} width={140} />
          <FieldSelect value={c.value} options={valueOptionsFor(c.outOf)} disabledOptions={disabledValuesFor(c.operator, c.outOf)} onChange={v => updateRow(i, 'value', v)} width={65} />
          <span style={muted}>out of</span>
          <FieldSelect value={c.outOf} options={['05', '10']} onChange={v => updateRow(i, 'outOf', v)} width={65} />
          {i > 0 && (
            <button
              onClick={() => removeRow(i)}
              aria-label="Remove criterion"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--lyra-color-fg-secondary)', borderRadius: 'var(--radius-xs)', padding: 0, flexShrink: 0 }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--lyra-color-state-bg-hover-opacity)'; el.style.color = 'var(--lyra-color-fg-default)' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'none'; el.style.color = 'var(--lyra-color-fg-secondary)' }}
            >
              <X size={14} />
            </button>
          )}
        </div>
        {issues.rows[i] && <IssueLine text={issues.rows[i]} />}
      </div>
    )
  }

  // Render in segments: a group box or a single row, with the join select between segments
  const segments: React.ReactNode[] = []
  let i = 0
  while (i < value.rows.length) {
    const gi = groupOf(value, i)
    if (gi !== -1 && value.groups[gi][0] === i) {
      const [s, e] = value.groups[gi]
      const inner: React.ReactNode[] = []
      for (let k = s; k <= e; k++) {
        inner.push(row(k, true))
        if (k < e) inner.push(<div key={`j${k}`}>{joinSelect(k)}</div>)
      }
      const groupSelected = Array.from({ length: e - s + 1 }, (_, k) => s + k).every(k => selected.includes(k))
      segments.push(
        <div key={`g${gi}`} style={{ background: 'var(--lyra-color-bg-active-subtle)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Checkbox checked={groupSelected} onChange={v => toggleGroupSelected(gi, v)} label={`Select group ${gi + 1}`} />
            <span style={{ font: '500 12px/16px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', fontFamily: FONT, letterSpacing: '0.01em' }}>
              Group {gi + 1} · {e - s + 1} criteria
            </span>
          </div>
          {issues.groups[gi] && <Banner text={issues.groups[gi]} tone="critical" />}
          {inner}
        </div>
      )
      i = e + 1
    } else {
      segments.push(row(i))
      i += 1
    }
    if (i < value.rows.length) segments.push(<div key={`j${i - 1}`}>{joinSelect(i - 1)}</div>)
  }

  return (
    <div style={{ background: 'var(--lyra-color-bg-surface-base)', border: '1px solid var(--lyra-color-border-subtle)', borderRadius: 'var(--radius-lg)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-4)' }}>
        <span style={{ font: '500 16px/20px var(--font-sans)', letterSpacing: '-0.01em', color: 'var(--lyra-color-fg-default)', fontFamily: FONT, whiteSpace: 'nowrap' }}>
          Alert trigger conditions
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <LinkBtn label="Ungroup" disabled={!canUngroup} onClick={ungroup} />
          <LinkBtn label="Group selection" disabled={!canGroup} onClick={groupSelection} />
        </div>
      </div>

      <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {segments}
        <div>
          <LinkBtn label="Add criteria" icon={<Plus size={14} />} disabled={value.rows.length >= MAX_ROWS} onClick={addRow} />
        </div>
        {issues.hint && <Banner text={issues.hint} tone="info" />}
      </div>
    </div>
  )
}

/* ─── Summary ─── */
function SummaryRow({ c }: { c: Criterion }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
      <span style={{ ...muted, flexShrink: 0 }}>{c.scoreType} score:</span>
      <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', fontFamily: FONT, textAlign: 'right' }}>
        {formatCriterionCondition(c)}
      </span>
    </div>
  )
}

const joinLabel = (j: GroupJoin) => <span style={muted}>{j.toLowerCase()}</span>

export function Conditions2Summary({ conditions }: { conditions: Alert2Conditions }) {
  const segments: React.ReactNode[] = []
  let i = 0
  while (i < conditions.rows.length) {
    const gi = groupOf(conditions, i)
    if (gi !== -1 && conditions.groups[gi][0] === i) {
      const [s, e] = conditions.groups[gi]
      const inner: React.ReactNode[] = []
      for (let k = s; k <= e; k++) {
        inner.push(<SummaryRow key={k} c={conditions.rows[k]} />)
        if (k < e) inner.push(<div key={`j${k}`}>{joinLabel(conditions.joins[k])}</div>)
      }
      segments.push(
        <div key={`g${gi}`} style={{ background: 'var(--lyra-color-bg-surface-base)', border: '1px solid var(--lyra-color-border-soft)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2) var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          {inner}
        </div>
      )
      i = e + 1
    } else {
      segments.push(<div key={i} style={{ padding: '0 var(--space-3)' }}><SummaryRow c={conditions.rows[i]} /></div>)
      i += 1
    }
    if (i < conditions.rows.length) segments.push(<div key={`j${i - 1}`} style={{ padding: '0 var(--space-3)' }}>{joinLabel(conditions.joins[i - 1])}</div>)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', fontFamily: FONT }}>Trigger alert when</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>{segments}</div>
    </div>
  )
}
