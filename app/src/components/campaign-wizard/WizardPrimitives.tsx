import React, { useState, useRef, useEffect, useMemo } from 'react'
import { ChevronDown, Clock, Calendar, Search, Check, X, Lock, Info } from 'lucide-react'

/* ── Toggle ── */
export function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        display: 'inline-flex', alignItems: 'center',
        width: 44, height: 24, borderRadius: 9999, border: 'none', cursor: 'pointer',
        background: checked ? 'var(--lyra-brand-600)' : 'var(--lyra-slate-300)',
        position: 'relative', flexShrink: 0, transition: 'background 0.2s',
        padding: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 2,
        left: checked ? 22 : 2,
        width: 20, height: 20, borderRadius: '50%',
        background: '#fff', transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {checked ? (
          <Check size={12} strokeWidth={2.5} color="var(--lyra-brand-600)" />
        ) : (
          <span style={{ width: 10, height: 2, borderRadius: 1, background: 'var(--lyra-slate-400)' }} />
        )}
      </span>
    </button>
  )
}

/* ── FiDatePicker ── */
export function FiDatePicker({
  value, onChange, disabled, placeholder, error
}: {
  value: string; onChange: (v: string) => void
  disabled?: boolean; placeholder?: string; error?: boolean
}) {
  const hiddenRef = useRef<HTMLInputElement>(null)

  function fmt(iso: string) {
    if (!iso) return ''
    const d = new Date(iso + 'T00:00:00')
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div style={{ position: 'relative' }}>
      <input
        readOnly
        value={fmt(value)}
        placeholder={placeholder || 'Select date'}
        disabled={disabled}
        onClick={() => !disabled && hiddenRef.current?.showPicker?.()}
        style={{
          width: '100%', boxSizing: 'border-box',
          font: '400 14px/24px var(--font-sans)',
          color: disabled ? 'var(--lyra-color-fg-disabled)' : 'var(--lyra-color-fg-default)',
          background: disabled ? 'var(--lyra-color-bg-disabled)' : 'var(--lyra-color-bg-field)',
          border: `1px solid ${error ? 'var(--lyra-color-status-critical-strong)' : 'var(--lyra-color-border-soft)'}`,
          borderRadius: 'var(--radius-sm)', padding: '6px 36px 6px 12px',
          cursor: disabled ? 'not-allowed' : 'pointer', outline: 'none',
        }}
      />
      <Calendar size={14} style={{
        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
        color: disabled ? 'var(--lyra-slate-300)' : 'var(--lyra-slate-500)', pointerEvents: 'none',
      }} />
      <input
        ref={hiddenRef} type="date" value={value}
        onChange={e => onChange(e.target.value)}
        style={{ position: 'absolute', opacity: 0, width: 0, height: 0, top: 0, left: 0 }}
      />
    </div>
  )
}

/* ── FiTimePicker ── */
export function FiTimePicker({
  value, onChange, disabled, error
}: {
  value: string; onChange: (v: string) => void
  disabled?: boolean; error?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [inputVal, setInputVal] = useState(value || '')
  const ref = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const slots = useMemo(() => {
    const out: string[] = []
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        const period = h < 12 ? 'AM' : 'PM'
        const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
        out.push(`${String(hour12).padStart(2, '0')}:${m === 0 ? '00' : '30'} ${period}`)
      }
    }
    return out
  }, [])

  const filtered = inputVal
    ? slots.filter(s => s.toLowerCase().startsWith(inputVal.toLowerCase()))
    : slots

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    if (open && listRef.current && value) {
      const idx = slots.indexOf(value)
      if (idx >= 0) listRef.current.children[idx]?.scrollIntoView({ block: 'nearest' })
    }
  }, [open])

  function select(slot: string) {
    setInputVal(slot); onChange(slot); setOpen(false)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          className="fi-input"
          type="text"
          placeholder="HH:MM AM/PM"
          value={inputVal}
          disabled={disabled}
          onChange={e => { setInputVal(e.target.value); setOpen(true); if (!e.target.value) onChange('') }}
          onFocus={() => !disabled && setOpen(true)}
          style={{
            paddingRight: 36, cursor: disabled ? 'not-allowed' : 'text',
            borderColor: error ? 'var(--lyra-color-status-critical-strong)' : undefined,
          }}
        />
        <Clock size={14} style={{
          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
          color: disabled ? 'var(--lyra-slate-300)' : 'var(--lyra-slate-500)', pointerEvents: 'none',
        }} />
      </div>
      {open && !disabled && filtered.length > 0 && (
        <div ref={listRef} style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 200,
          background: 'var(--lyra-color-bg-surface-overlay)',
          border: '1px solid var(--lyra-color-border-soft)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--sol-effect-shadowlg)',
          maxHeight: 200, overflowY: 'auto',
        }}>
          {filtered.map(slot => (
            <div
              key={slot}
              onMouseDown={() => select(slot)}
              style={{
                padding: '8px 12px', cursor: 'pointer',
                font: '400 14px/20px var(--font-sans)',
                color: slot === value ? 'var(--lyra-color-fg-active-strong)' : 'var(--lyra-color-fg-default)',
                background: slot === value ? 'var(--lyra-color-bg-active-subtle)' : 'transparent',
              }}
              onMouseEnter={e => { if (slot !== value) (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
              onMouseLeave={e => { if (slot !== value) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              {slot}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── SurveyingDays ── */
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const DAY_LABELS: Record<string, string> = {
  Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday',
  Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday',
}
export function SurveyingDays({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  function toggle(day: string) {
    onChange(value.includes(day) ? value.filter(d => d !== day) : [...value, day])
  }
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {DAYS.map(day => {
        const active = value.includes(day)
        return (
          <button
            key={day}
            onClick={() => toggle(day)}
            style={{
              height: 36, padding: '0 12px', borderRadius: 'var(--radius-sm)',
              border: `1.5px solid ${active ? 'var(--lyra-brand-600)' : 'var(--lyra-color-border-soft)'}`,
              background: active ? 'var(--lyra-color-bg-active-subtle)' : 'var(--lyra-color-bg-surface-base)',
              color: active ? 'var(--lyra-color-fg-active-strong)' : 'var(--lyra-color-fg-secondary)',
              font: `${active ? '500' : '400'} 13px/20px var(--font-sans)`,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {DAY_LABELS[day]}
          </button>
        )
      })}
    </div>
  )
}

/* ── MultiSelectField ── */
export function MultiSelectField({
  options, value, onChange, placeholder, error
}: {
  options: string[]; value: string[]; onChange: (v: string[]) => void
  placeholder?: string; error?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()))

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setSearch('') }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function toggle(opt: string) {
    onChange(value.includes(opt) ? value.filter(v => v !== opt) : [...value, opt])
  }

  const label = value.length === 0
    ? (placeholder || 'Select…')
    : value.length === 1 ? value[0] : `${value[0]} +${value.length - 1} more`

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', textAlign: 'left', padding: '6px 36px 6px 12px',
          font: '400 14px/24px var(--font-sans)',
          color: value.length === 0 ? 'var(--lyra-color-fg-disabled)' : 'var(--lyra-color-fg-default)',
          background: 'var(--lyra-color-bg-field)',
          border: `1px solid ${error ? 'var(--lyra-color-status-critical-strong)' : open ? 'var(--lyra-color-border-active)' : 'var(--lyra-color-border-soft)'}`,
          borderRadius: 'var(--radius-sm)', cursor: 'pointer', outline: 'none',
          boxSizing: 'border-box',
        }}
      >
        {label}
      </button>
      <ChevronDown size={14} style={{
        position: 'absolute', right: 10, top: '50%', transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`,
        color: 'var(--lyra-slate-500)', pointerEvents: 'none', transition: 'transform 0.15s',
      }} />
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 200,
          background: 'var(--lyra-color-bg-surface-overlay)',
          border: '1px solid var(--lyra-color-border-soft)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--sol-effect-shadowlg)',
        }}>
          <div style={{ padding: '8px 8px 4px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--lyra-slate-400)' }} />
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search…"
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '5px 8px 5px 26px',
                  font: '400 13px/20px var(--font-sans)', border: '1px solid var(--lyra-color-border-soft)',
                  borderRadius: 'var(--radius-xs)', background: 'var(--lyra-color-bg-field)',
                  outline: 'none', color: 'var(--lyra-color-fg-default)',
                }}
              />
            </div>
          </div>
          <div style={{ maxHeight: 200, overflowY: 'auto', padding: '4px 0' }}>
            {filtered.length === 0
              ? <div style={{ padding: '8px 12px', font: '400 13px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)' }}>No results</div>
              : filtered.map(opt => {
                const selected = value.includes(opt)
                return (
                  <div
                    key={opt}
                    onMouseDown={() => toggle(opt)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '7px 12px', cursor: 'pointer',
                      background: selected ? 'var(--lyra-color-bg-active-subtle)' : 'transparent',
                      font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)',
                    }}
                    onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
                    onMouseLeave={e => { if (!selected) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    <span style={{
                      width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                      border: `1.5px solid ${selected ? 'var(--lyra-brand-600)' : 'var(--lyra-color-border-medium)'}`,
                      background: selected ? 'var(--lyra-brand-600)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {selected && <Check size={10} stroke="#fff" strokeWidth={2.5} />}
                    </span>
                    {opt}
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── ErrorMsg ── */
export function ErrorMsg({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, font: '400 12px/16px var(--font-sans)', color: 'var(--lyra-color-status-critical-strong)' }}>
      <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="6"/><line x1="8" y1="5" x2="8" y2="8.5"/><circle cx="8" cy="11" r=".6" fill="currentColor"/></svg>
      {children}
    </div>
  )
}

/* ── FieldLabel ── */
export function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 4, font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', marginBottom: 6 }}>
      {children}
      {required && <span style={{ color: 'var(--lyra-color-status-critical-strong)', marginLeft: 2 }}>*</span>}
    </label>
  )
}

/* ── SurveyPickerDrawer + ThemePickerDrawer ── */
import { SURVEY_DESIGNS, DIGITAL_THEMES, type DigitalTheme } from '../../lib/campaignWizard'

export function SurveyPickerDrawer({
  currentId, onClose, onSelect
}: {
  currentId: string; onClose: () => void; onSelect: (id: string) => void
}) {
  const [search, setSearch] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Close on click outside the panel
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose()
    }
    // Delay so the triggering click doesn't immediately close
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 0)
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handler) }
  }, [onClose])

  const filtered = SURVEY_DESIGNS.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.category.toLowerCase().includes(search.toLowerCase()) ||
    s.why.toLowerCase().includes(search.toLowerCase())
  )

  function handleSelect(id: string) {
    onSelect(id)
    onClose()
  }

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="survey-picker-title"
      style={{
        position: 'fixed',
        top: 56, // below the app topbar
        right: 24,
        bottom: 24,
        width: 705,
        maxWidth: 'calc(100vw - 48px)',
        zIndex: 400,
        background: 'var(--lyra-color-bg-surface-overlay)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0px 20px 40px rgba(0,0,0,0.12)',
        border: '1px solid var(--lyra-color-border-soft)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 20,
        padding: '0 24px', height: 80, flexShrink: 0,
      }}>
        <h2 id="survey-picker-title" style={{
          flex: 1, margin: 0,
          font: '500 16px/20px var(--font-sans)',
          color: 'var(--lyra-color-fg-default)',
        }}>
          Select a survey
        </h2>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            width: 24, height: 24, borderRadius: 'var(--radius-sm)',
            border: 'none', background: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--lyra-color-fg-default)', padding: 0, flexShrink: 0,
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--lyra-color-state-bg-hover-opacity)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div style={{
        flex: 1, overflow: 'hidden',
        padding: '0 24px 24px',
        display: 'flex', flexDirection: 'column', gap: 32,
      }}>

        {/* Search */}
        <div style={{ flexShrink: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            height: 32, padding: '0 12px',
            background: 'var(--lyra-color-bg-field)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--lyra-color-border-strong)',
            maxWidth: 422,
          }}>
            <Search size={16} style={{ color: 'var(--lyra-color-fg-secondary)', flexShrink: 0 }} />
            <input
              ref={inputRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search surveys"
              aria-label="Search surveys"
              style={{
                flex: 1, border: 'none', background: 'transparent', outline: 'none',
                font: '400 14px/20px var(--font-sans)',
                color: 'var(--lyra-color-fg-default)',
              }}
            />
          </div>
        </div>

        {/* Survey list */}
        <div style={{
          flex: 1, overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: 24,
        }}>
          {filtered.length === 0 ? (
            <p style={{
              margin: 0, padding: '40px 0', textAlign: 'center',
              font: '400 14px/20px var(--font-sans)',
              color: 'var(--lyra-color-fg-secondary)',
            }}>
              No surveys match your search.
            </p>
          ) : filtered.map(s => (
            <div
              key={s.id}
              style={{
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--lyra-color-border-soft)',
                overflow: 'hidden', flexShrink: 0,
              }}
            >
              {/* Card header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 24,
                padding: '12px 16px', minHeight: 56,
                borderBottom: '1px solid var(--lyra-color-border-subtle)',
              }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
                  <span style={{
                    font: '500 14px/20px var(--font-sans)',
                    color: 'var(--lyra-color-fg-default)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {s.name}
                  </span>
                  <span style={{
                    height: 24, padding: '0 8px', borderRadius: 'var(--radius-sm)',
                    background: 'var(--lyra-color-accent-purple-subtle-bg, #EFEBFF)',
                    display: 'inline-flex', alignItems: 'center', flexShrink: 0,
                    font: '400 14px/20px var(--font-sans)',
                    color: 'var(--lyra-color-accent-purple-subtle-fg, #6E56CC)',
                    whiteSpace: 'nowrap',
                  }}>
                    Contextual
                  </span>
                </div>
                <button
                  onClick={() => handleSelect(s.id)}
                  style={{
                    height: 36, minWidth: 80, padding: '0 16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--lyra-color-border-soft)',
                    background: s.id === currentId ? 'var(--lyra-color-bg-active-subtle)' : 'var(--lyra-color-bg-surface-base)',
                    font: '500 14px/20px var(--font-sans)',
                    color: s.id === currentId ? 'var(--lyra-color-fg-active-strong)' : 'var(--lyra-color-fg-action)',
                    cursor: 'pointer', flexShrink: 0,
                  }}
                  onMouseEnter={e => { if (s.id !== currentId) (e.currentTarget.style.background = 'var(--lyra-color-state-bg-hover-opacity)') }}
                  onMouseLeave={e => { if (s.id !== currentId) (e.currentTarget.style.background = 'var(--lyra-color-bg-surface-base)') }}
                >
                  {s.id === currentId ? 'Selected' : 'Select'}
                </button>
              </div>

              {/* Card body */}
              <div style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                    <span style={{ font: '400 12px/16px var(--font-sans)', letterSpacing: '0.2px', color: 'var(--lyra-color-fg-secondary)', whiteSpace: 'nowrap' }}>
                      Question types
                    </span>
                    <span style={{ font: '500 12px/16px var(--font-sans)', letterSpacing: '0.2px', color: 'var(--lyra-color-fg-default)' }}>
                      {s.questionTypes}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                    <span style={{ font: '400 12px/16px var(--font-sans)', letterSpacing: '0.2px', color: 'var(--lyra-color-fg-secondary)', whiteSpace: 'nowrap' }}>
                      Updated on:
                    </span>
                    <span style={{ font: '500 12px/16px var(--font-sans)', letterSpacing: '0.2px', color: 'var(--lyra-color-fg-default)', fontVariantNumeric: 'tabular-nums' }}>
                      {s.updatedOn}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

/* ── ThemeQuestionPreview ── */
const RATING_LABELS = ['Very dissatisfied', 'Dissatisfied', 'Neutral', 'Satisfied', 'Very satisfied']

const PREVIEW_QUESTIONS: Record<string, { question: string; type: 'rating' | 'verbatim' }> = {
  ASAT: { question: 'How would you rate the person who helped you today?', type: 'rating' },
  CSAT: { question: 'How satisfied were you with your overall experience today?', type: 'rating' },
  Verbatim: { question: 'Do you have any additional comments you\'d like to share?', type: 'verbatim' },
}

function SurveyWidgetMockup({ question, type, controlStyle }: { question: string; type: 'rating' | 'verbatim'; controlStyle: string }) {
  const isQuickReply = controlStyle === 'Quick reply'

  return (
    <div style={{
      width: '100%',
      background: 'var(--lyra-color-bg-surface-shell)',
      borderRadius: 'var(--radius-md)',
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      {/* Chat bubble — question */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{
          alignSelf: 'flex-start',
          maxWidth: '80%',
          padding: '10px 14px',
          background: 'var(--lyra-color-bg-surface-base)',
          borderRadius: '0 var(--radius-md) var(--radius-md) var(--radius-md)',
          border: '1px solid var(--lyra-color-border-subtle)',
          font: '400 12px/16px var(--font-sans)',
          letterSpacing: '0.2px',
          color: 'var(--lyra-color-fg-default)',
        }}>
          {question}
        </div>
      </div>

      {/* Answer options */}
      {type === 'rating' ? (
        isQuickReply ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {RATING_LABELS.map((label, i) => (
              <div key={i} style={{
                height: 28, padding: '0 10px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--lyra-color-border-soft)',
                background: 'var(--lyra-color-bg-surface-base)',
                display: 'inline-flex', alignItems: 'center',
                font: '400 12px/16px var(--font-sans)',
                letterSpacing: '0.2px',
                color: 'var(--lyra-color-fg-default)',
              }}>
                {label}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {RATING_LABELS.map((label, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                height: 36, padding: '0 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--lyra-color-border-subtle)',
                background: 'var(--lyra-color-bg-surface-base)',
              }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1.5px solid var(--lyra-color-border-medium)', flexShrink: 0 }} />
                <span style={{ font: '400 12px/16px var(--font-sans)', letterSpacing: '0.2px', color: 'var(--lyra-color-fg-default)' }}>{i + 1} – {label}</span>
              </div>
            ))}
          </div>
        )
      ) : (
        <div style={{
          padding: '10px 12px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--lyra-color-border-soft)',
          background: 'var(--lyra-color-bg-surface-base)',
          font: '400 12px/16px var(--font-sans)',
          letterSpacing: '0.2px',
          color: 'var(--lyra-color-fg-secondary)',
          minHeight: 72,
        }}>
          Type your response here…
        </div>
      )}
    </div>
  )
}

function ThemeQuestionPreview({ controlStyle }: { controlStyle: string }) {
  const [activeTab, setActiveTab] = useState<'ASAT' | 'CSAT' | 'Verbatim'>('ASAT')
  const tabs = ['ASAT', 'CSAT', 'Verbatim'] as const
  const current = PREVIEW_QUESTIONS[activeTab]

  return (
    <div style={{ marginTop: 4 }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--lyra-color-border-subtle)', marginBottom: 16 }}>
        {tabs.map(tab => {
          const isActive = activeTab === tab
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '14px 20px',
                font: `400 14px/20px var(--font-sans)`,
                color: isActive ? 'var(--lyra-color-fg-active-strong)' : 'var(--lyra-color-fg-default)',
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '4px solid var(--lyra-color-border-active)' : '4px solid transparent',
                cursor: 'pointer',
                marginBottom: -1,
                outline: 'none',
              }}
            >
              {tab}
            </button>
          )
        })}
      </div>

      {/* Widget mockup */}
      <SurveyWidgetMockup question={current.question} type={current.type} controlStyle={controlStyle} />
    </div>
  )
}

/* ── ThemePickerDrawer ── */
export function ThemePickerDrawer({
  currentId, onClose, onSelect
}: {
  currentId: string; onClose: () => void; onSelect: (id: string) => void
}) {
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose()
    }
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 0)
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handler) }
  }, [onClose])

  const filtered = DIGITAL_THEMES.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.controlStyle.toLowerCase().includes(search.toLowerCase()) ||
    t.messageMode.toLowerCase().includes(search.toLowerCase())
  )

  function handleSelect(id: string) {
    onSelect(id)
    onClose()
  }

  function togglePreview(id: string) {
    setExpandedId(prev => prev === id ? null : id)
  }

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="theme-picker-title"
      style={{
        position: 'fixed',
        top: 56,
        right: 24,
        bottom: 24,
        width: 705,
        maxWidth: 'calc(100vw - 48px)',
        zIndex: 400,
        background: 'var(--lyra-color-bg-surface-overlay)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0px 20px 40px rgba(0,0,0,0.12)',
        border: '1px solid var(--lyra-color-border-soft)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '0 24px', height: 80, flexShrink: 0 }}>
        <h2 id="theme-picker-title" style={{ flex: 1, margin: 0, font: '500 16px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>
          Select a digital theme
        </h2>
        <button onClick={onClose} aria-label="Close" style={{ width: 24, height: 24, borderRadius: 'var(--radius-sm)', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--lyra-color-fg-default)', padding: 0, flexShrink: 0 }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--lyra-color-state-bg-hover-opacity)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: 'hidden', padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* Search */}
        <div style={{ flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 32, padding: '0 12px', background: 'var(--lyra-color-bg-field)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--lyra-color-border-strong)', maxWidth: 422 }}>
            <Search size={16} style={{ color: 'var(--lyra-color-fg-secondary)', flexShrink: 0 }} />
            <input ref={inputRef} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search themes" aria-label="Search themes"
              style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}
            />
          </div>
        </div>

        {/* Theme list */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {filtered.length === 0 ? (
            <p style={{ margin: 0, padding: '40px 0', textAlign: 'center', font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)' }}>
              No themes match your search.
            </p>
          ) : filtered.map(t => {
            const isExpanded = expandedId === t.id
            return (
              <div key={t.id} style={{ borderRadius: 'var(--radius-lg)', border: '1px solid var(--lyra-color-border-soft)', overflow: 'hidden', flexShrink: 0 }}>

                {/* Card header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '12px 16px', minHeight: 56, borderBottom: '1px solid var(--lyra-color-border-subtle)' }}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
                    <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.name}
                    </span>
                    {t.type === 'system' ? (
                      <span style={{
                        height: 24, padding: '0 8px', borderRadius: 'var(--radius-sm)',
                        background: 'var(--lyra-color-status-info-subtle)',
                        display: 'inline-flex', alignItems: 'center', flexShrink: 0,
                        font: '400 14px/20px var(--font-sans)',
                        color: 'var(--lyra-color-status-info-strong)',
                        whiteSpace: 'nowrap',
                      }}>
                        System Default
                      </span>
                    ) : (
                      <span style={{
                        height: 24, padding: '0 8px', borderRadius: 'var(--radius-sm)',
                        background: 'var(--lyra-color-status-success-subtle)',
                        display: 'inline-flex', alignItems: 'center', flexShrink: 0,
                        font: '400 14px/20px var(--font-sans)',
                        color: 'var(--lyra-color-status-success-strong)',
                        whiteSpace: 'nowrap',
                      }}>
                        Custom
                      </span>
                    )}
                  </div>
                  {t.id === currentId ? (
                    <div style={{
                      height: 36, minWidth: 80, padding: '0 16px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--lyra-color-bg-disabled)',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      font: '500 14px/20px var(--font-sans)',
                      color: 'var(--lyra-color-fg-disabled)',
                      flexShrink: 0,
                    }}>
                      Selected
                    </div>
                  ) : (
                    <button onClick={() => handleSelect(t.id)}
                      style={{
                        height: 36, minWidth: 80, padding: '0 16px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--lyra-color-border-soft)',
                        background: 'var(--lyra-color-bg-surface-base)',
                        font: '500 14px/20px var(--font-sans)',
                        color: 'var(--lyra-color-fg-action)',
                        cursor: 'pointer', flexShrink: 0,
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--lyra-color-state-bg-hover-opacity)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'var(--lyra-color-bg-surface-base)')}
                    >
                      Select
                    </button>
                  )}
                </div>

                {/* Card body */}
                <div style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                      <span style={{ font: '400 12px/16px var(--font-sans)', letterSpacing: '0.2px', color: 'var(--lyra-color-fg-secondary)', whiteSpace: 'nowrap' }}>
                        Control style:
                      </span>
                      <span style={{ font: '500 12px/16px var(--font-sans)', letterSpacing: '0.2px', color: 'var(--lyra-color-fg-default)' }}>
                        {t.controlStyle}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                      <span style={{ font: '400 12px/16px var(--font-sans)', letterSpacing: '0.2px', color: 'var(--lyra-color-fg-secondary)', whiteSpace: 'nowrap' }}>
                        Message mode:
                      </span>
                      <span style={{ font: '500 12px/16px var(--font-sans)', letterSpacing: '0.2px', color: 'var(--lyra-color-fg-default)' }}>
                        {t.messageMode}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                    <button
                      onClick={() => togglePreview(t.id)}
                      aria-expanded={isExpanded}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, font: '500 12px/16px var(--font-sans)', letterSpacing: '0.12px', color: 'var(--lyra-color-fg-default)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, outline: 'none' }}
                    >
                      {isExpanded ? 'Close Preview' : 'Preview'}
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
                        style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 150ms ease' }}>
                        <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                  {isExpanded && <ThemeQuestionPreview controlStyle={t.controlStyle} />}
                </div>

              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ── ThemeDetailDrawer ── */

const QT_DEFS: Array<{ name: string; subtitle: string; scaleLabels: string[] }> = [
  { name: 'ASAT', subtitle: 'Agent Satisfaction, 1 to 5', scaleLabels: ['Very dissatisfied', 'Dissatisfied', 'Neutral', 'Satisfied', 'Very satisfied'] },
  { name: 'CSAT', subtitle: 'Customer Satisfaction, 1 to 5', scaleLabels: ['Very dissatisfied', 'Dissatisfied', 'Neutral', 'Satisfied', 'Very satisfied'] },
  { name: 'Verbatim', subtitle: 'Open text comment', scaleLabels: [] },
]

const INTRO_MESSAGES: Record<string, string> = {
  'Invitation with opt out': "Dear {contact_firstName}, We'd love to hear about your experience today. We have just a few quick questions, just two minutes. Thanks! What will your feedback tell us.",
  'Opt-in only': "Would you like to share feedback about your experience today?",
}

export function ThemeDetailDrawer({
  theme, onClose,
}: {
  theme: DigitalTheme
  onClose: () => void
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [selectedQt, setSelectedQt] = useState(0)
  const [previewOpen, setPreviewOpen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose()
    }
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 0)
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handler) }
  }, [onClose])

  const introMsg = INTRO_MESSAGES[theme.messageMode] ?? INTRO_MESSAGES['Invitation with opt out']
  const isSystem = theme.type === 'system'
  const activeQt = QT_DEFS[selectedQt]
  const FONT = 'var(--font-sans)'

  function ConfigRow({ label, value, noBorder }: { label: string; value: string; noBorder?: boolean }) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 0', height: 32,
        borderBottom: noBorder ? 'none' : '1px solid var(--lyra-color-border-subtle)',
      }}>
        <span style={{ flex: 1, font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>{label}</span>
        <span style={{ font: `500 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)', textAlign: 'right' }}>{value}</span>
      </div>
    )
  }

  function MsgRow({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: multiline ? 'flex-start' : 'center',
        padding: '12px 0',
        borderBottom: '1px solid var(--lyra-color-border-subtle)',
      }}>
        <span style={{ flex: 1, font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>{label}</span>
        <span style={{ flex: 1, font: `${multiline ? 400 : 500} 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)', textAlign: 'right' }}>{value}</span>
      </div>
    )
  }

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="theme-detail-title"
      style={{
        position: 'fixed',
        top: 56,
        right: 24,
        bottom: 24,
        width: 705,
        maxWidth: 'calc(100vw - 48px)',
        zIndex: 400,
        background: 'var(--lyra-color-bg-surface-overlay)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0px 20px 40px rgba(0,0,0,0.12)',
        border: '1px solid var(--lyra-color-border-soft)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '0 24px', height: 80, flexShrink: 0,
        borderBottom: '1px solid var(--lyra-color-border-subtle)',
      }}>
        <h2 id="theme-detail-title" style={{ flex: 1, margin: 0, font: `600 16px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>
          {theme.name}
        </h2>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '3px 10px', borderRadius: 'var(--radius-full)',
          font: `500 12px/16px ${FONT}`,
          background: isSystem ? 'var(--lyra-color-status-info-subtle)' : 'var(--lyra-slate-100)',
          color: isSystem ? 'var(--lyra-color-status-info-strong)' : 'var(--lyra-slate-600)',
          flexShrink: 0,
        }}>
          {isSystem && <Lock size={11} />}
          {isSystem ? 'System default' : 'Custom'}
        </span>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 32, height: 32, borderRadius: 'var(--radius-sm)',
            border: 'none', background: 'transparent',
            color: 'var(--lyra-color-fg-secondary)', cursor: 'pointer', flexShrink: 0,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Body — scrollable */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Fix 1: Theme name row */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 4px' }}>
          <span style={{ flex: '0 0 120px', font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>Theme name</span>
          <span style={{ font: `500 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>{theme.name}</span>
        </div>

        {/* ── Presentation card ── */}
        <div style={{
          outline: '1px solid var(--lyra-color-border-soft)',
          outlineOffset: -1,
          borderRadius: 'var(--radius-md)',
          display: 'flex', flexDirection: 'column', gap: 12,
          padding: '12px 24px',
        }}>
          <span style={{ font: `500 16px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>Presentation</span>

          <div style={{ display: 'flex', gap: 16, alignItems: 'stretch' }}>
            {/* Left: question type list */}
            <div style={{
              width: 215, flexShrink: 0,
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
            }}>
              {/* Panel header */}
              <div style={{ padding: '12px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ font: `500 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>
                  Question types for digital
                </span>
                <Info size={16} color="var(--lyra-color-fg-action)" />
              </div>
              {/* Type list — active: rounded + blue bg, no border; middle: border-soft; last: 24px padding, no border */}
              {QT_DEFS.map((qt, i) => {
                const isSelected = selectedQt === i
                const isLast = i === QT_DEFS.length - 1
                return (
                  <div
                    key={qt.name}
                    onClick={() => setSelectedQt(i)}
                    style={{
                      padding: isLast && !isSelected ? '24px 12px' : '16px 12px',
                      background: isSelected ? 'var(--lyra-color-bg-active-moderate)' : 'transparent',
                      borderRadius: isSelected ? 'var(--radius-md)' : 0,
                      borderBottom: (!isSelected && !isLast) ? '1px solid var(--lyra-color-border-soft)' : 'none',
                      cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', gap: 2,
                    }}
                    onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
                    onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    <span style={{ font: `500 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>{qt.name}</span>
                    <span style={{ font: `400 12px/16px ${FONT}`, letterSpacing: '0.20px', color: 'var(--lyra-color-fg-secondary)' }}>{qt.subtitle}</span>
                  </div>
                )
              })}
            </div>

            {/* Right: config for selected type */}
            <div style={{
              flex: 1,
              background: 'var(--lyra-color-bg-surface-base)',
              borderLeft: '1px solid var(--lyra-color-border-subtle)',
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
            }}>
              {/* Right header */}
              <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center' }}>
                <span style={{ font: `500 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>
                  Theme - {activeQt.name}
                </span>
              </div>
              {/* Config rows */}
              <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 0 }}>
                <ConfigRow label="Control style:" value={theme.controlStyle} />
                <ConfigRow label="List picker label:" value="Rate your experience" />
                <ConfigRow label="Edit scale label:" value="No" />
                {/* Scale labels (only when type has them) */}
                {activeQt.scaleLabels.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {activeQt.scaleLabels.map((lbl, i) => (
                      <ConfigRow
                        key={i}
                        label={i === 0 ? '1: Lowest scale label' : i === activeQt.scaleLabels.length - 1 ? `${i + 1}: Highest scale label` : `${i + 1}:`}
                        value={lbl}
                        noBorder={i === activeQt.scaleLabels.length - 1}
                      />
                    ))}
                  </div>
                )}
                {/* Preview accordion */}
                <div style={{
                  marginTop: 8,
                  borderRadius: 'var(--radius-md)',
                  outline: previewOpen ? '1px solid var(--lyra-color-border-subtle)' : 'none',
                  outlineOffset: -1,
                  overflow: 'hidden',
                }}>
                  {/* Accordion header */}
                  <div
                    onClick={() => setPreviewOpen(o => !o)}
                    style={{
                      padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: 'var(--lyra-color-bg-surface-shell)',
                      borderRadius: previewOpen ? '8px 8px 0 0' : 'var(--radius-md)',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ font: `500 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>Preview</span>
                    <ChevronDown
                      size={16}
                      color="var(--lyra-color-fg-default)"
                      style={{ transform: previewOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                    />
                  </div>
                  {/* Accordion content */}
                  {previewOpen && (
                    <div style={{
                      padding: '16px',
                      background: 'var(--lyra-color-bg-surface-base)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                    }}>
                      {/* Chat UI container */}
                      <div style={{
                        width: '100%', maxWidth: 276,
                        background: 'var(--lyra-color-bg-surface-shell)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '16px 14px',
                        display: 'flex', flexDirection: 'column', gap: 12,
                      }}>
                        {/* Chat bubble row */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                          {/* Blue avatar */}
                          <div style={{
                            width: 36, height: 36, flexShrink: 0,
                            borderRadius: '50%',
                            background: 'var(--lyra-color-bg-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 12c2.486 0 4.5-2.014 4.5-4.5S14.486 3 12 3 7.5 5.014 7.5 7.5 9.514 12 12 12zm0 2.25c-3.004 0-9 1.508-9 4.5v2.25h18V18.75c0-2.992-5.996-4.5-9-4.5z"/>
                            </svg>
                          </div>
                          {/* Question bubble */}
                          <div style={{
                            flex: 1,
                            background: 'var(--lyra-color-bg-surface-base)',
                            borderRadius: '0 var(--radius-md) var(--radius-md) var(--radius-md)',
                            padding: '10px 14px',
                            font: `400 13px/20px ${FONT}`,
                            color: 'var(--lyra-color-fg-default)',
                            boxShadow: 'var(--sol-effect-shadowsm)',
                          }}>
                            {activeQt.name === 'ASAT'
                              ? 'On a scale of 1 to 5, how satisfied were you with the agent who helped you today?'
                              : activeQt.name === 'CSAT'
                              ? 'On a scale of 1 to 5, how satisfied were you with the service you received?'
                              : 'Please share your thoughts about your experience.'}
                          </div>
                        </div>

                        {/* List picker card (ASAT / CSAT) */}
                        {activeQt.scaleLabels.length > 0 && (
                          <div style={{
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--lyra-color-border-subtle)',
                            overflow: 'hidden',
                            background: 'var(--lyra-color-bg-surface-base)',
                          }}>
                            {/* Picker header */}
                            <div style={{
                              padding: '8px 14px',
                              background: 'var(--lyra-color-bg-surface-shell)',
                              font: `500 11px/16px ${FONT}`,
                              letterSpacing: '0.04em',
                              textTransform: 'uppercase',
                              color: 'var(--lyra-color-fg-secondary)',
                              borderBottom: '1px solid var(--lyra-color-border-subtle)',
                            }}>
                              Rate your experience
                            </div>
                            {/* Scale rows */}
                            {activeQt.scaleLabels.map((lbl, i) => (
                              <div key={i} style={{
                                padding: '10px 14px',
                                borderBottom: i < activeQt.scaleLabels.length - 1 ? '1px solid var(--lyra-color-border-subtle)' : 'none',
                                font: `400 13px/20px ${FONT}`,
                                color: 'var(--lyra-color-fg-default)',
                              }}>
                                {i + 1} &mdash; {lbl}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Verbatim text area mock */}
                        {activeQt.scaleLabels.length === 0 && (
                          <div style={{
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--lyra-color-border-soft)',
                            background: 'var(--lyra-color-bg-surface-base)',
                            padding: '12px 14px',
                            minHeight: 80,
                            font: `400 13px/20px ${FONT}`,
                            color: 'var(--lyra-color-fg-disabled)',
                          }}>
                            Type your comment here...
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Message card ── */}
        <div style={{
          outline: '1px solid var(--lyra-color-border-soft)',
          outlineOffset: -1,
          borderRadius: 'var(--radius-md)',
          display: 'flex', flexDirection: 'column', gap: 12,
          padding: 16,
        }}>
          <span style={{ font: `500 16px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>Message</span>

          <div style={{
            background: 'var(--lyra-color-bg-surface-base)',
            borderRadius: 'var(--radius-md)',
            padding: '0 16px',
            display: 'flex', flexDirection: 'column',
          }}>
            <MsgRow label="Survey introduction mode:" value={theme.messageMode} />
            <MsgRow label="Introduction message:" value={introMsg} multiline />
            <MsgRow label="Button to start label:" value="Get Started" />
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 0',
              borderBottom: '1px solid var(--lyra-color-border-subtle)',
            }}>
              <span style={{ flex: 1, font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>Button to refuse label:</span>
              <span style={{ font: `500 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)', textAlign: 'right' }}>
                {theme.messageMode === 'Opt-in only' ? 'No Thanks' : 'Not Today'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
              <span style={{ flex: 1, font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-secondary)' }}>Thank you message:</span>
              <span style={{ font: `500 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)', textAlign: 'right' }}>
                Thank you for your feedback.
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
