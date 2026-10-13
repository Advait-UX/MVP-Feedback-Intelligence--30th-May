import { useState, useEffect, useRef, useMemo } from 'react'
import { ChevronDown, Plus, Info, X } from 'lucide-react'

const FONT = 'var(--font-sans)'

export type Criterion = { scoreType: string; operator: string; value: string; outOf: string }
export type GroupJoin = 'And' | 'Or'
export type ConditionGroup = { match: 'any' | 'all'; join: GroupJoin; criteria: Criterion[] }
export type AlertConditions = { groups: ConditionGroup[] }

export const MAX_CRITERIA_PER_GROUP = 5
export const MAX_GROUPS = 5

export const DEFAULT_CRITERION: Criterion = { scoreType: 'CSAT', operator: 'Below', value: '02', outOf: '05' }
const NEW_CRITERION: Criterion = { scoreType: 'ASAT', operator: 'Below', value: '02', outOf: '05' }

export function newGroup(criteria: Criterion[] = [DEFAULT_CRITERION]): ConditionGroup {
  return { match: 'any', join: GROUP_JOIN, criteria }
}

export function flattenCriteria(conditions: AlertConditions): Criterion[] {
  return conditions.groups.flatMap(g => g.criteria)
}

export function formatCriterionCondition(c: Criterion) {
  return `is ${c.operator.toLowerCase()} ${parseInt(c.value, 10)} out of ${parseInt(c.outOf, 10)}`
}

/* Groups are always combined with And; only the match type inside a group varies. */
export const GROUP_JOIN: GroupJoin = 'And'

/* Short form used in the "Notify when" summary — e.g. "(CSAT < 2/5 or CSAT < 5/10) and (ASAT < 2/5)" */
export function formatNotifyWhen(conditions: AlertConditions): string {
  const symbol = (op: string) => op === 'Below' ? '<' : op === 'Above' ? '>' : '='
  return conditions.groups
    .map(g => {
      const inner = g.criteria
        .map(c => `${c.scoreType} ${symbol(c.operator)} ${parseInt(c.value, 10)}/${parseInt(c.outOf, 10)}`)
        .join(g.match === 'any' ? ' or ' : ' and ')
      return conditions.groups.length > 1 ? `(${inner})` : inner
    })
    .join(` ${GROUP_JOIN.toLowerCase()} `)
}

/* Zero-padded value options from 01 up to outOf (e.g. '05' -> 01..05, '10' -> 01..10) */
export function valueOptionsFor(outOf: string): string[] {
  const max = parseInt(outOf, 10) || 5
  return Array.from({ length: max }, (_, i) => String(i + 1).padStart(2, '0'))
}

/* "Below 01" and "Above <outOf>" are not meaningful — disable those value options */
export function disabledValuesFor(operator: string, outOf: string): string[] {
  const disabled: string[] = []
  if (operator === 'Below') disabled.push('01')
  if (operator === 'Above') disabled.push(outOf)
  return disabled
}

export type ConditionIssue = { message: string }

/*
 * Flags exact duplicates (always) and impossible ranges (only when every condition in the
 * group must hold at once). Conditions in different groups are never compared — each group
 * is evaluated independently and then joined with And/Or.
 */
export function getConditionIssues(criteria: Criterion[], matchType: 'any' | 'all'): Record<number, ConditionIssue> {
  const issues: Record<number, ConditionIssue> = {}

  const exactGroups: Record<string, number[]> = {}
  criteria.forEach((c, i) => {
    const k = `${c.scoreType}|${c.operator}|${c.value}|${c.outOf}`
    ;(exactGroups[k] ||= []).push(i)
  })
  Object.values(exactGroups).forEach(idxs => {
    if (idxs.length > 1) {
      idxs.forEach(i => { issues[i] = { message: 'Duplicate condition. This exact condition has already been added.' } })
    }
  })

  if (matchType === 'all') {
    const scaleGroups: Record<string, number[]> = {}
    criteria.forEach((c, i) => {
      if (issues[i]) return
      const k = `${c.scoreType}|${c.outOf}`
      ;(scaleGroups[k] ||= []).push(i)
    })
    Object.values(scaleGroups).forEach(idxs => {
      if (idxs.length < 2) return
      let lo = -Infinity
      let hi = Infinity
      idxs.forEach(i => {
        const c = criteria[i]
        const v = parseInt(c.value, 10)
        if (c.operator === 'Below') hi = Math.min(hi, v - 0.01)
        else if (c.operator === 'Above') lo = Math.max(lo, v + 0.01)
        else if (c.operator === 'Equal to') { lo = Math.max(lo, v); hi = Math.min(hi, v) }
      })
      if (lo > hi) {
        idxs.forEach(i => { issues[i] = { message: 'These conditions can never all be true at once — the alert would never fire.' } })
      }
    })
  }

  return issues
}

export function getAllConditionIssues(conditions: AlertConditions): Record<number, Record<number, ConditionIssue>> {
  const out: Record<number, Record<number, ConditionIssue>> = {}
  conditions.groups.forEach((g, gi) => {
    const issues = getConditionIssues(g.criteria, g.match)
    if (Object.keys(issues).length > 0) out[gi] = issues
  })

  // Cross-group: flag criteria that appear in an earlier group
  const seen: Record<string, number> = {} // criterion key → first group index
  conditions.groups.forEach((g, gi) => {
    g.criteria.forEach((c, ci) => {
      const k = `${c.scoreType}|${c.operator}|${c.value}|${c.outOf}`
      if (seen[k] !== undefined && seen[k] !== gi) {
        if (!out[gi]?.[ci]) {
          ;(out[gi] ||= {})[ci] = { message: `Duplicate condition. This already exists in Group ${seen[k] + 1}.` }
        }
      } else if (seen[k] === undefined) {
        seen[k] = gi
      }
    })
  })

  return out
}

export type GroupIssue = { message: string }

export function getGroupIssues(conditions: AlertConditions): Record<number, GroupIssue> {
  const out: Record<number, GroupIssue> = {}
  const fingerprints: { key: string; gi: number }[] = conditions.groups.map((g, gi) => {
    const sorted = g.criteria
      .map(c => `${c.scoreType}|${c.operator}|${c.value}|${c.outOf}`)
      .sort()
      .join(';;')
    return { key: `${g.match}::${sorted}`, gi }
  })
  fingerprints.forEach(({ key, gi }) => {
    const first = fingerprints.find(f => f.key === key && f.gi < gi)
    if (first !== undefined) {
      out[gi] = { message: `This criteria group is identical to Group ${first.gi + 1}. Remove it or change the conditions.` }
    }
  })
  return out
}

/* ─── Dropdown list ─── */
function DropdownList({ options, value, onSelect, disabledOptions }: {
  options: string[]; value: string; onSelect: (v: string) => void; disabledOptions?: string[]
}) {
  return (
    <div style={{
      position: 'absolute', top: 'calc(100% + 4px)', left: 0,
      background: 'var(--lyra-color-bg-surface-overlay)',
      border: '1px solid var(--lyra-color-border-soft)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--sol-effect-shadowlg)',
      zIndex: 999, minWidth: 160, padding: 'var(--space-1)',
    }}>
      {options.map(opt => {
        const isDisabled = disabledOptions?.includes(opt) ?? false
        return (
          <button
            key={opt}
            onClick={() => { if (!isDisabled) onSelect(opt) }}
            disabled={isDisabled}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '6px var(--space-3)', background: 'none', border: 'none',
              font: `${opt === value ? 500 : 400} 14px/20px var(--font-sans)`,
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              color: isDisabled ? 'var(--lyra-color-fg-disabled)' : opt === value ? 'var(--lyra-color-fg-active-strong)' : 'var(--lyra-color-fg-default)',
              borderRadius: 'var(--radius-sm)',
            }}
            onMouseEnter={e => { if (!isDisabled) (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

/* ─── Bordered field dropdown ─── */
export function FieldSelect({ value, options, onChange, width, disabledOptions, labels }: {
  value: string; options: string[]; onChange: (v: string) => void; width: number; disabledOptions?: string[]
  labels?: Record<string, string>
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const display = (v: string) => labels?.[v] ?? v

  return (
    <div ref={ref} style={{ position: 'relative', width }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', height: 36, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingLeft: 12, paddingRight: 12,
          background: 'var(--lyra-color-bg-field)',
          border: '1px solid var(--lyra-color-border-strong)',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
        }}
      >
        <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {display(value)}
        </span>
        <ChevronDown size={14} style={{ color: 'var(--lyra-color-fg-secondary)', flexShrink: 0 }} />
      </button>
      {open && (
        <DropdownList
          options={options.map(display)}
          value={display(value)}
          onSelect={v => {
            const raw = options.find(o => display(o) === v) ?? v
            onChange(raw); setOpen(false)
          }}
          disabledOptions={disabledOptions?.map(display)}
        />
      )}
    </div>
  )
}

/* ─── Secondary button ─── */
export function SecBtn({ label, icon, onClick, width, disabled = false }: { label: string; icon?: React.ReactNode; onClick?: () => void; width?: number; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)',
        width, height: 32, padding: '0 var(--space-3)',
        border: '1px solid var(--lyra-color-border-soft)',
        borderRadius: 'var(--radius-md)',
        background: 'var(--lyra-color-bg-surface-base)',
        font: '500 14px/20px var(--font-sans)',
        color: disabled ? 'var(--lyra-color-fg-disabled)' : 'var(--lyra-color-fg-action)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
      }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-bg-surface-base)' }}
    >
      {icon}
      {label}
    </button>
  )
}

/* ─── Text-only link button (e.g. "+ Add criteria", "Remove group") ─── */
function LinkBtn({ label, icon, onClick, disabled = false }: { label: string; icon?: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)',
        height: 32, padding: '0 var(--space-2)', marginLeft: 'calc(-1 * var(--space-2))',
        border: 'none', borderRadius: 'var(--radius-sm)', background: 'none',
        font: '500 14px/20px var(--font-sans)',
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

const muted: React.CSSProperties = { font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', fontFamily: FONT }

/* ─── Alert trigger conditions builder (grouped, And/Or, Any/All) ─── */
export function ConditionsBuilder({ value, onChange }: { value: AlertConditions; onChange: (v: AlertConditions) => void }) {
  const issues = useMemo(() => getAllConditionIssues(value), [value])
  const groupIssues = useMemo(() => getGroupIssues(value), [value])

  const setGroups = (groups: ConditionGroup[]) => onChange({ groups })
  const updateGroup = (gi: number, patch: Partial<ConditionGroup>) =>
    setGroups(value.groups.map((g, i) => i === gi ? { ...g, ...patch } : g))

  const updateCriterion = (gi: number, ci: number, field: keyof Criterion, val: string) => {
    const g = value.groups[gi]
    const criteria = g.criteria.map((c, i) => {
      if (i !== ci) return c
      const next = { ...c, [field]: val }
      const options = valueOptionsFor(next.outOf)
      const disabled = disabledValuesFor(next.operator, next.outOf)
      if (!options.includes(next.value) || disabled.includes(next.value)) {
        next.value = options.find(o => !disabled.includes(o)) ?? next.value
      }
      return next
    })
    updateGroup(gi, { criteria })
  }
  const addCriterion = (gi: number) => updateGroup(gi, { criteria: [...value.groups[gi].criteria, NEW_CRITERION] })
  const removeCriterion = (gi: number, ci: number) => updateGroup(gi, { criteria: value.groups[gi].criteria.filter((_, i) => i !== ci) })
  const addGroup = () => setGroups([...value.groups, newGroup()])
  const removeGroup = (gi: number) => setGroups(value.groups.filter((_, i) => i !== gi))

  return (
    <div style={{ background: 'var(--lyra-color-bg-surface-base)', border: '1px solid var(--lyra-color-border-subtle)', borderRadius: 'var(--radius-lg)' }}>
      <div style={{ padding: 'var(--space-3) var(--space-4)' }}>
        <span style={{ font: '500 16px/20px var(--font-sans)', letterSpacing: '-0.01em', color: 'var(--lyra-color-fg-default)', fontFamily: FONT }}>
          Alert trigger conditions
        </span>
      </div>

      <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {value.groups.map((g, gi) => (
          <div key={gi} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {gi > 0 && (
              <span
                aria-label="Groups are combined with And"
                style={{
                  alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center',
                  height: 28, padding: '0 var(--space-3)',
                  background: 'var(--lyra-slate-100)', borderRadius: 'var(--radius-full)',
                  font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', fontFamily: FONT,
                }}
              >
                {GROUP_JOIN}
              </span>
            )}

            <div style={{
              background: 'var(--lyra-color-bg-surface-shell)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-4)',
              display: 'flex', flexDirection: 'column', gap: 'var(--space-3)',
            }}>
              {/* Match row */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', fontFamily: FONT }}>Match</span>
                    <FieldSelect value={g.match} options={['any', 'all']} labels={{ any: 'Any', all: 'All' }} onChange={v => updateGroup(gi, { match: v as 'any' | 'all' })} width={80} />
                    <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', fontFamily: FONT }}>of the following</span>
                  </div>
                  {gi > 0 && (
                    <LinkBtn label="Remove group" onClick={() => removeGroup(gi)} />
                  )}
                </div>
                <span style={{ font: '400 12px/16px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', letterSpacing: '0.01em', fontFamily: FONT }}>
                  {g.match === 'any' ? 'At least one of these must be true' : 'All of these must be true'}
                </span>
              </div>

              {groupIssues[gi] && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                  padding: 'var(--space-2) var(--space-3)',
                  background: 'var(--lyra-color-status-critical-subtle)',
                  borderRadius: 'var(--radius-sm)',
                }}>
                  <Info size={14} style={{ color: 'var(--lyra-color-status-critical-strong)', flexShrink: 0 }} />
                  <span style={{ font: '400 12px/16px var(--font-sans)', color: 'var(--lyra-color-status-critical-strong)', fontFamily: FONT, letterSpacing: '0.01em' }}>
                    {groupIssues[gi].message}
                  </span>
                </div>
              )}

              <div style={{ height: 0, borderTop: '1px solid var(--lyra-color-border-subtle)' }} />

              {/* Criteria rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {g.criteria.map((c, ci) => {
                  const issue = issues[gi]?.[ci]
                  return (
                    <div key={ci} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <span style={muted}>If</span>
                        <FieldSelect value={c.scoreType} options={['CSAT', 'ASAT']} onChange={v => updateCriterion(gi, ci, 'scoreType', v)} width={180} />
                        <span style={muted}>is</span>
                        <FieldSelect value={c.operator} options={['Below', 'Equal to', 'Above']} onChange={v => updateCriterion(gi, ci, 'operator', v)} width={140} />
                        <FieldSelect value={c.value} options={valueOptionsFor(c.outOf)} disabledOptions={disabledValuesFor(c.operator, c.outOf)} onChange={v => updateCriterion(gi, ci, 'value', v)} width={65} />
                        <span style={muted}>out of</span>
                        <FieldSelect value={c.outOf} options={['05', '10']} onChange={v => updateCriterion(gi, ci, 'outOf', v)} width={65} />
                        {g.criteria.length > 1 && (
                          <button
                            onClick={() => removeCriterion(gi, ci)}
                            aria-label="Remove criterion"
                            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--lyra-color-fg-secondary)', borderRadius: 'var(--radius-xs)', padding: 0, flexShrink: 0 }}
                            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--lyra-color-state-bg-hover-opacity)'; el.style.color = 'var(--lyra-color-fg-default)' }}
                            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'none'; el.style.color = 'var(--lyra-color-fg-secondary)' }}
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                      {issue && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', paddingLeft: 20 }}>
                          <Info size={12} style={{ color: 'var(--lyra-color-status-critical-strong)', flexShrink: 0 }} />
                          <span style={{ font: '400 12px/16px var(--font-sans)', color: 'var(--lyra-color-status-critical-strong)', fontFamily: FONT, letterSpacing: '0.01em' }}>
                            {issue.message}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <LinkBtn label="Add criteria" icon={<Plus size={14} />} disabled={g.criteria.length >= MAX_CRITERIA_PER_GROUP} onClick={() => addCriterion(gi)} />
            </div>
          </div>
        ))}

        <div>
          <SecBtn label="Add criteria group" icon={<Plus size={14} />} disabled={value.groups.length >= MAX_GROUPS} onClick={addGroup} />
        </div>
      </div>
    </div>
  )
}

/* ─── Summary: one bordered box per group ─── */
function SummaryGroupBox({ group }: { group: ConditionGroup }) {
  return (
    <div style={{
      background: 'var(--lyra-color-bg-surface-base)',
      border: '1px solid var(--lyra-color-border-soft)',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--space-2) var(--space-3)',
      display: 'flex', flexDirection: 'column', gap: 'var(--space-1)',
    }}>
      <span style={muted}>{group.match === 'any' ? 'Any of:' : 'All of:'}</span>
      {group.criteria.map((c, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
          <span style={{ ...muted, flexShrink: 0 }}>{c.scoreType} score:</span>
          <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', fontFamily: FONT, textAlign: 'right' }}>
            {formatCriterionCondition(c)}
          </span>
        </div>
      ))}
    </div>
  )
}

function SummaryGroups({ groups }: { groups: ConditionGroup[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      {groups.map((g, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {i > 0 && (
            <span style={{ font: '600 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', fontFamily: FONT, textAlign: 'center' }}>{GROUP_JOIN}</span>
          )}
          <SummaryGroupBox group={g} />
        </div>
      ))}
    </div>
  )
}

const moreLinkStyle: React.CSSProperties = {
  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
  font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-link)', textDecoration: 'underline', fontFamily: FONT,
}

/* ─── "Trigger alert when" summary block — shows 2 groups, "+N more" opens a modal ─── */
export function ConditionsSummary({ conditions }: { conditions: AlertConditions }) {
  const [showAll, setShowAll] = useState(false)
  const visible = conditions.groups.slice(0, 2)
  const hiddenCount = conditions.groups.length - visible.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', fontFamily: FONT }}>Trigger alert when</span>
      <SummaryGroups groups={visible} />
      {hiddenCount > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={() => setShowAll(true)} style={moreLinkStyle}>+{hiddenCount} more</button>
        </div>
      )}
      {showAll && (
        <SummaryModal title={`Trigger alert when - ${String(conditions.groups.length).padStart(2, '0')} groups`} onClose={() => setShowAll(false)}>
          <div style={{ padding: 'var(--space-4) 0' }}>
            <SummaryGroups groups={conditions.groups} />
          </div>
        </SummaryModal>
      )}
    </div>
  )
}

/* ─── "Notified to" list — shows 2 names, "+N more" opens a modal ─── */
export function NotifiedToSummary({ names }: { names: string[] }) {
  const [showAll, setShowAll] = useState(false)
  const visible = names.slice(0, 2)
  const hiddenCount = names.length - visible.length

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
      <span style={{ ...muted, flexShrink: 0 }}>Notified to:</span>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
        {names.length === 0 && <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', fontFamily: FONT }}>—</span>}
        {visible.map((name, i) => (
          <span key={i} style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', fontFamily: FONT, textAlign: 'right' }}>{name}</span>
        ))}
        {hiddenCount > 0 && (
          <button onClick={() => setShowAll(true)} style={moreLinkStyle}>+{hiddenCount} more</button>
        )}
      </div>
      {showAll && (
        <SummaryModal title={`Notified to - ${String(names.length).padStart(2, '0')}`} onClose={() => setShowAll(false)}>
          {names.map((n, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', padding: 'var(--space-4) 0', borderBottom: i < names.length - 1 ? '1px solid var(--lyra-color-border-subtle)' : 'none' }}>
              <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', fontFamily: FONT }}>{n}</span>
            </div>
          ))}
        </SummaryModal>
      )}
    </div>
  )
}

/* ─── Modal shell — same layout as the Linked programs modal ─── */
export function SummaryModal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.24)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--lyra-color-bg-surface-overlay)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--sol-effect-shadowlg)', width: 480, maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-6)', borderBottom: '1px solid var(--lyra-color-border-subtle)' }}>
          <span style={{ font: '500 16px/20px var(--font-sans)', letterSpacing: '-0.01em', color: 'var(--lyra-color-fg-default)', fontFamily: FONT }}>{title}</span>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ width: 28, height: 28, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-xs)', color: 'var(--lyra-color-fg-secondary)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
          >
            <X size={16} />
          </button>
        </div>
        <div style={{ overflowY: 'auto', padding: '0 var(--space-6)' }}>
          {children}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: 'var(--space-6)', borderTop: '1px solid var(--lyra-color-border-subtle)' }}>
          <button
            onClick={onClose}
            style={{ height: 36, padding: '0 var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--lyra-color-border-soft)', background: 'var(--lyra-color-bg-surface-base)', font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', cursor: 'pointer', fontFamily: FONT }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-bg-surface-base)' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Description field (max 200 chars) ─── */
export function DescriptionField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const MAX = 200
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label htmlFor="alert-description" style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', fontFamily: FONT }}>Description</label>
        <span style={{ font: '400 12px/16px var(--font-sans)', fontFamily: FONT, color: value.length >= MAX ? 'var(--lyra-color-status-critical-strong)' : 'var(--lyra-color-fg-secondary)', letterSpacing: '0.01em' }}>
          {value.length}/{MAX}
        </span>
      </div>
      <textarea
        id="alert-description"
        value={value}
        maxLength={MAX}
        rows={2}
        onChange={e => onChange(e.target.value.slice(0, MAX))}
        placeholder="Describe what this alert is for"
        style={{
          width: '100%', minHeight: 48, resize: 'vertical',
          padding: 'var(--space-2) var(--space-3)',
          border: '1px solid var(--lyra-color-border-soft)',
          borderRadius: 'var(--radius-md)',
          font: '400 14px/20px var(--font-sans)', fontFamily: FONT,
          color: 'var(--lyra-color-fg-default)',
          background: 'var(--lyra-color-bg-field)',
          outline: 'none', boxSizing: 'border-box', boxShadow: 'none',
        }}
        onFocus={e => { e.currentTarget.style.borderColor = 'var(--lyra-color-border-active)'; e.currentTarget.style.boxShadow = 'var(--sol-effect-activering)' }}
        onBlur={e => { e.currentTarget.style.borderColor = 'var(--lyra-color-border-soft)'; e.currentTarget.style.boxShadow = 'none' }}
      />
    </div>
  )
}
