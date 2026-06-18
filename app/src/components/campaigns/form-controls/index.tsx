/**
 * Shared low-level form controls for the Campaign wizard.
 *
 * All class names and CSS var tokens match prototype.html exactly so that the
 * global stylesheet (index.css / theme.css) picks up the right rules.
 *
 * Exports:
 *   Segmented       — horizontal pill segmented control
 *   Toggle          — iOS-style on/off switch
 *   ChipWell        — freeform chip tag input
 *   MultiSelectField — dropdown multi-select with chip display
 *   FiDatePicker    — read-only text overlay wrapping a hidden <input type="date">
 *   FieldRow        — label + hint wrapper
 */

import React, { useRef, useEffect, useState } from 'react'

// ---------------------------------------------------------------------------
// FieldRow
// ---------------------------------------------------------------------------

interface FieldRowProps {
  label: string
  hint?: string
  req?: boolean
  tooltip?: string
  children: React.ReactNode
}

export function FieldRow({ label, hint, req, tooltip, children }: FieldRowProps) {
  return (
    <div className="field-row">
      <label
        className="field-label"
        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
      >
        {label}
        {req ? <span className="req">*</span> : null}
        {tooltip ? (
          <span className="tooltip-wrap" style={{ display: 'inline-flex' }}>
            <svg
              viewBox="0 0 16 16"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: 'var(--color-fg-secondary)', cursor: 'default', flexShrink: 0 }}
            >
              <circle cx="8" cy="8" r="6" />
              <path d="M8 11v-3" />
              <circle cx="8" cy="5.5" r=".5" fill="currentColor" stroke="none" />
            </svg>
            <span
              className="tooltip-bubble"
              style={{ width: 240, textAlign: 'left', whiteSpace: 'normal' }}
            >
              {tooltip}
            </span>
          </span>
        ) : null}
      </label>
      <div className="field-control">
        {children}
        {hint ? <span className="hint">{hint}</span> : null}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Segmented
// ---------------------------------------------------------------------------

interface SegmentedProps {
  options: string[]
  value: string
  onChange: (v: string) => void
  disabled?: string[]
}

export function Segmented({ options, value, onChange, disabled = [] }: SegmentedProps) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          className={value === o ? 'on' : ''}
          disabled={disabled.includes(o)}
          onClick={() => onChange(o)}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Toggle
// ---------------------------------------------------------------------------

interface ToggleProps {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
}

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <label className="switch-row">
      <span className="switch">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="slider" />
      </span>
      {label ? <span>{label}</span> : null}
    </label>
  )
}

// ---------------------------------------------------------------------------
// ChipWell
// ---------------------------------------------------------------------------

interface ChipWellProps {
  values: string[]
  onChange: (v: string[]) => void
  placeholder?: string
  brand?: boolean
}

export function ChipWell({ values, onChange, placeholder, brand }: ChipWellProps) {
  const [draft, setDraft] = useState('')

  function addChip(v: string) {
    v = v.trim()
    if (!v) return
    if (values.includes(v)) return
    onChange([...values, v])
    setDraft('')
  }

  return (
    <div className="chip-well">
      {values.map((v) => (
        <span key={v} className={`chip ${brand ? 'brand' : ''}`}>
          {v}
          <span className="x" onClick={() => onChange(values.filter((x) => x !== v))}>
            <svg viewBox="0 0 16 16" width="10" height="10">
              <line
                x1="4"
                y1="4"
                x2="12"
                y2="12"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <line
                x1="12"
                y1="4"
                x2="4"
                y2="12"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </span>
      ))}
      <input
        placeholder={placeholder}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            addChip(draft)
          }
        }}
        onBlur={() => addChip(draft)}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// MultiSelectField
// ---------------------------------------------------------------------------

interface MultiSelectFieldProps {
  options: string[]
  value: string[]
  onChange: (v: string[]) => void
  placeholder?: string
  error?: boolean
}

export function MultiSelectField({
  options,
  value = [],
  onChange,
  placeholder = 'Select...',
  error = false,
}: MultiSelectFieldProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const toggle = (opt: string) =>
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt])

  const labelEl =
    value.length === 0 ? (
      <span style={{ color: 'var(--color-fg-secondary)' }}>{placeholder}</span>
    ) : value.length === 1 ? (
      value[0]
    ) : (
      `${value.length} selected`
    )

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        className={`fi-input${error ? ' error' : ''}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          textAlign: 'left',
          cursor: 'pointer',
          width: '100%',
          background: 'var(--lyra-white)',
        }}
        onClick={() => setOpen((o) => !o)}
      >
        <span
          style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {labelEl}
        </span>
        <svg
          viewBox="0 0 16 16"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          style={{
            flexShrink: 0,
            marginLeft: 6,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s',
          }}
        >
          <polyline points="4 6 8 10 12 6" />
        </svg>
      </button>

      {value.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--space-1)',
            marginTop: 'var(--space-2)',
          }}
        >
          {value.map((v) => (
            <span
              key={v}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-1)',
                height: 24,
                padding: '0 6px 0 10px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--lyra-slate-100)',
                color: 'var(--lyra-slate-800)',
                border: '1px solid var(--lyra-slate-300)',
                font: '500 12px/20px var(--font-sans)',
                letterSpacing: '0.01em',
              }}
            >
              {v}
              <button
                type="button"
                onClick={() => toggle(v)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px',
                  lineHeight: 1,
                  color: 'var(--lyra-slate-500)',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: 'var(--radius-full)',
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background =
                    'var(--lyra-slate-200)')
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background = 'none')
                }
              >
                <svg
                  viewBox="0 0 12 12"
                  width="10"
                  height="10"
                  stroke="currentColor"
                  fill="none"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <line x1="9" y1="3" x2="3" y2="9" />
                  <line x1="3" y1="3" x2="9" y2="9" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 200,
            background: 'var(--lyra-white)',
            border: '1px solid var(--color-border-soft)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0px 4px 8px 0px rgba(0,0,0,0.08)',
            overflow: 'hidden',
          }}
        >
          {options.map((opt) => (
            <label
              key={opt}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-2) var(--space-3)',
                cursor: 'pointer',
                font: '400 14px/20px var(--font-sans)',
                color: 'var(--color-fg-default)',
                background: value.includes(opt) ? 'var(--color-bg-active-subtle)' : 'transparent',
              }}
            >
              <input
                type="checkbox"
                checked={value.includes(opt)}
                onChange={() => toggle(opt)}
                style={{ accentColor: 'var(--lyra-brand-600)', flexShrink: 0 }}
              />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// FiDatePicker
// ---------------------------------------------------------------------------

interface FiDatePickerProps {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  placeholder?: string
  error?: boolean
}

export function FiDatePicker({
  value,
  onChange,
  disabled,
  placeholder = 'Select date',
  error,
}: FiDatePickerProps) {
  const ref = useRef<HTMLInputElement>(null)

  function fmt(iso: string) {
    if (!iso) return ''
    const [y, m, d] = iso.split('-').map(Number)
    if (!y || !m || !d) return ''
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${months[m - 1]} ${String(d).padStart(2, '0')}, ${y}`
  }

  return (
    <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
      <input
        type="text"
        readOnly
        className={`fi-input${error ? ' fi-input--error' : ''}`}
        placeholder={placeholder}
        disabled={disabled}
        value={fmt(value)}
        onClick={() => {
          if (!disabled) {
            const el = ref.current as HTMLInputElement & { showPicker?: () => void }
            if (el?.showPicker) el.showPicker()
            else el?.focus()
          }
        }}
        style={{ cursor: disabled ? 'not-allowed' : 'pointer', paddingRight: 36 }}
      />
      <svg
        viewBox="0 0 24 24"
        width="14"
        height="14"
        style={{
          position: 'absolute',
          right: 10,
          top: '50%',
          transform: 'translateY(-50%)',
          color: disabled ? 'var(--lyra-slate-300)' : 'var(--lyra-slate-500)',
          pointerEvents: 'none',
        }}
        stroke="currentColor"
        fill="none"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="8" y1="3" x2="8" y2="7" />
        <line x1="16" y1="3" x2="16" y2="7" />
      </svg>
      <input
        ref={ref}
        type="date"
        value={value || ''}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0,
          pointerEvents: 'none',
          width: '100%',
          height: '100%',
          border: 0,
        }}
      />
    </div>
  )
}
