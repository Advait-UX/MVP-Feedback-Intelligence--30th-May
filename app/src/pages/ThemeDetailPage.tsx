import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, Lock, Copy, Trash2, Save } from 'lucide-react'
import {
  type Theme, type QType, type QuestionConfig, type MessageConfig,
  type ThemeValidationErrors,
  getThemeById, getControlOptions, duplicateTheme as doDuplicate,
  deleteTheme as doDelete, syncTheme, sanitizeName, validateTheme, hasValidationErrors,
} from '@/lib/themes'

const F = 'var(--lyra-font-sans, var(--font-sans))'

const Q_TYPES: { key: QType; label: string; subtitle: string }[] = [
  { key: 'osat',     label: 'OSAT',     subtitle: 'Overall satisfaction — 1–5' },
  { key: 'asat',     label: 'ASAT',     subtitle: 'Agent satisfaction — 1–5' },
  { key: 'csat',     label: 'CSAT',     subtitle: 'Customer satisfaction — 1–5' },
  { key: 'verbatim', label: 'Verbatim', subtitle: 'Open text comment' },
]

const Q_TEXT: Record<QType, string> = {
  osat:     'How satisfied were you with your overall experience?',
  asat:     'How satisfied were you with the agent who helped you?',
  csat:     'How satisfied were you with the service you received?',
  verbatim: 'What could we have done better?',
}

const CONTROL_LABELS: Record<string, string> = {
  quickreply:  'Quick reply',
  listpicker:  'List Picker',
  textarea:    'Textarea',
}

const cardShell: React.CSSProperties = {
  background: 'var(--lyra-color-bg-surface-base)',
  border: '1px solid var(--lyra-color-border-subtle)',
  borderRadius: 12,
  overflow: 'hidden',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
}

/* ─── Sub-components ─── */

function LockedBanner() {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '14px 40px',
      background: 'var(--lyra-color-status-info-subtle)',
      borderBottom: '1px solid var(--lyra-color-border-subtle)',
      flexShrink: 0,
    }}>
      <Lock size={14} style={{ color: 'var(--lyra-color-status-info-strong)', marginTop: 3, flexShrink: 0 }} />
      <p style={{ margin: 0, font: '400 13px/20px ' + F, color: 'var(--lyra-color-status-info-strong)' }}>
        This is the system default for Digital. Every tenant gets it and it cannot be edited or deleted.{' '}
        Use <strong style={{ fontWeight: 600 }}>Duplicate to customise</strong> to make your own version.
      </p>
    </div>
  )
}

/* ─── Preview components ─── */

function PreviewRow() {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <div key={n} style={{
          width: 38, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 6,
          border:      n === 1 ? '2px solid var(--lyra-brand-600)' : '1px solid var(--lyra-color-border-soft)',
          background:  n === 1 ? 'var(--lyra-brand-50)' : 'var(--lyra-color-bg-surface-base)',
          color:       n === 1 ? 'var(--lyra-brand-600)' : 'var(--lyra-color-fg-default)',
          font:       `${n === 1 ? 600 : 400} 13px/20px ${F}`,
        }}>
          {n}
        </div>
      ))}
    </div>
  )
}

function PreviewListPicker({ label, lowLabel, highLabel, showLabels }: {
  label: string; lowLabel: string; highLabel: string; showLabels: boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Picker button */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', borderRadius: 8,
        background: 'var(--lyra-brand-50)',
        border: '1px solid var(--lyra-brand-200)',
        cursor: 'default',
      }}>
        <span style={{ font: '500 13px/18px ' + F, color: 'var(--lyra-brand-700)' }}>
          {label || 'Rate your experience'}
        </span>
        <span style={{ font: '400 14px/14px ' + F, color: 'var(--lyra-brand-400)' }}>▸</span>
      </div>

      {/* Expanded list */}
      <div style={{
        border: '1px solid var(--lyra-color-border-subtle)',
        borderRadius: 8, overflow: 'hidden',
      }}>
        {[1, 2, 3, 4, 5].map(n => {
          const isSelected = n === 3
          let sublabel = ''
          if (showLabels && n === 1 && lowLabel) sublabel = lowLabel
          if (showLabels && n === 5 && highLabel) sublabel = highLabel
          return (
            <div key={n} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 14px',
              borderBottom: n < 5 ? '1px solid var(--lyra-color-border-subtle)' : 'none',
              background: isSelected ? 'var(--lyra-brand-50)' : 'var(--lyra-color-bg-surface-base)',
            }}>
              <div style={{
                width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                border: isSelected ? '5px solid var(--lyra-brand-600)' : '1.5px solid var(--lyra-color-border-medium)',
                boxSizing: 'border-box',
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ font: `${isSelected ? 500 : 400} 12px/16px ${F}`, color: 'var(--lyra-color-fg-default)' }}>
                  {n}
                </span>
                {sublabel && (
                  <span style={{ font: '400 11px/14px ' + F, color: 'var(--lyra-color-fg-secondary)', marginLeft: 6 }}>
                    — {sublabel}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PreviewTextarea() {
  return (
    <div style={{
      width: '100%', minHeight: 80,
      border: '1px solid var(--lyra-color-border-soft)', borderRadius: 6,
      padding: '10px 12px',
      font: '400 13px/20px ' + F, color: 'var(--lyra-color-fg-disabled)',
    }}>
      Type your response here…
    </div>
  )
}

function LivePreview({ theme, activeQType }: { theme: Theme; activeQType: QType }) {
  const qConfig  = theme.q[activeQType]
  const control  = qConfig.control
  const isVerb   = activeQType === 'verbatim'
  const qText    = Q_TEXT[activeQType]
  const ctrlLbl  = CONTROL_LABELS[control] ?? control

  return (
    <div style={cardShell}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px', borderBottom: '1px solid var(--lyra-color-border-subtle)',
      }}>
        <span style={{ font: '600 13px/16px ' + F, color: 'var(--lyra-color-fg-default)' }}>
          Live preview
        </span>
        <span style={{ font: '500 10px/14px ' + F, color: 'var(--lyra-color-fg-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {ctrlLbl}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: 20, background: 'var(--lyra-brand-50)', display: 'flex', justifyContent: 'center' }}>
        <div style={{
          width: '100%', maxWidth: 280,
          background: 'var(--lyra-color-bg-surface-base)',
          border: '1px solid var(--lyra-color-border-subtle)',
          borderRadius: 10, padding: '20px 18px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}>
          {/* Progress bar */}
          {!isVerb && (
            <div style={{ height: 3, borderRadius: 999, background: 'var(--lyra-color-border-subtle)', marginBottom: 18 }}>
              <div style={{ height: '100%', width: '40%', borderRadius: 999, background: 'var(--lyra-brand-600)' }} />
            </div>
          )}

          {/* Question */}
          <p style={{ margin: '0 0 14px', font: '500 14px/21px ' + F, color: 'var(--lyra-color-fg-default)' }}>
            {qText}
          </p>

          {/* Control */}
          {control === 'quickreply' && (
            <>
              <PreviewRow />
              {!isVerb && qConfig.scaleLabels && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                  <span style={{ font: '400 11px/16px ' + F, color: 'var(--lyra-color-fg-secondary)' }}>{qConfig.lowLabel}</span>
                  <span style={{ font: '400 11px/16px ' + F, color: 'var(--lyra-color-fg-secondary)' }}>{qConfig.highLabel}</span>
                </div>
              )}
            </>
          )}
          {control === 'listpicker' && (
            <PreviewListPicker
              label={qConfig.listPickerLabel}
              lowLabel={qConfig.lowLabel}
              highLabel={qConfig.highLabel}
              showLabels={qConfig.scaleLabels}
            />
          )}
          {control === 'textarea' && <PreviewTextarea />}

          {/* Submit */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <div style={{ padding: '7px 18px', borderRadius: 6, background: 'var(--lyra-brand-600)', font: '500 13px/16px ' + F, color: 'var(--lyra-color-fg-inverse)' }}>
              Submit
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Field primitives ─── */

function SectionHeader({ label }: { label: string }) {
  return (
    <div style={{ font: '600 12px/16px ' + F, color: 'var(--lyra-color-fg-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
      {label}
    </div>
  )
}

function FieldLabel({ label, htmlFor, sub }: { label: string; htmlFor?: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <label htmlFor={htmlFor} style={{ display: 'block', font: '500 13px/16px ' + F, color: 'var(--lyra-color-fg-default)' }}>
        {label}
      </label>
      {sub && (
        <span style={{ font: '400 12px/16px ' + F, color: 'var(--lyra-color-fg-secondary)' }}>
          {sub}
        </span>
      )}
    </div>
  )
}

function ValidatedInput({ id, value, onChange, placeholder, disabled, maxLen, restrictChars, error }: {
  id?: string; value: string; onChange: (v: string) => void; placeholder?: string
  disabled?: boolean; maxLen?: number; restrictChars?: boolean; error?: string
}) {
  const handleChange = (raw: string) => {
    let v = raw
    if (restrictChars) v = sanitizeName(v)
    if (maxLen) v = v.slice(0, maxLen)
    onChange(v)
  }

  return (
    <div>
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          type="text"
          value={value}
          onChange={e => handleChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            height: 38, width: '100%', padding: '0 12px',
            paddingRight: maxLen ? 52 : 12,
            background:    disabled ? 'var(--lyra-color-bg-disabled)' : 'var(--lyra-color-bg-field)',
            border:        `1px solid ${error ? 'var(--lyra-color-status-critical-medium)' : 'var(--lyra-color-border-soft)'}`,
            borderRadius:  'var(--radius-sm)',
            font:          '400 14px/20px ' + F,
            color:         disabled ? 'var(--lyra-color-fg-disabled)' : 'var(--lyra-color-fg-default)',
            cursor:        disabled ? 'not-allowed' : 'text',
            outline:       'none', boxSizing: 'border-box',
          }}
          onFocus={e => { if (!disabled && !error) { e.currentTarget.style.borderColor = 'var(--lyra-color-border-active)'; e.currentTarget.style.boxShadow = 'var(--sol-effect-activering)' } }}
          onBlur={e => { e.currentTarget.style.borderColor = error ? 'var(--lyra-color-status-critical-medium)' : 'var(--lyra-color-border-soft)'; e.currentTarget.style.boxShadow = '' }}
        />
        {maxLen && (
          <span style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            font: '400 11px/14px ' + F,
            color: value.length >= maxLen ? 'var(--lyra-color-status-critical-strong)' : 'var(--lyra-color-fg-disabled)',
            pointerEvents: 'none',
          }}>
            {value.length}/{maxLen}
          </span>
        )}
      </div>
      {error && (
        <span style={{ display: 'block', marginTop: 4, font: '400 12px/16px ' + F, color: 'var(--lyra-color-status-critical-strong)' }}>
          {error}
        </span>
      )}
    </div>
  )
}

function SelectField({ id, value, onChange, options, disabled }: {
  id?: string; value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]; disabled?: boolean
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      style={{
        height: 38, width: '100%', padding: '0 12px',
        background:   disabled ? 'var(--lyra-color-bg-disabled)' : 'var(--lyra-color-bg-field)',
        border:       '1px solid var(--lyra-color-border-soft)',
        borderRadius: 'var(--radius-sm)',
        font:         '400 14px/20px ' + F,
        color:        disabled ? 'var(--lyra-color-fg-disabled)' : 'var(--lyra-color-fg-default)',
        cursor:       disabled ? 'not-allowed' : 'pointer',
        outline:      'none', boxSizing: 'border-box',
      }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

/* ─── Header action buttons ─── */

function HeaderBtn({
  onClick, children, variant = 'secondary', danger,
}: {
  onClick: () => void; children: React.ReactNode; variant?: 'secondary' | 'primary'; danger?: boolean
}) {
  const bg = variant === 'primary'
    ? 'var(--lyra-color-bg-primary)'
    : 'var(--lyra-color-bg-surface-base)'
  const color = danger
    ? 'var(--lyra-color-status-critical-strong)'
    : variant === 'primary'
    ? 'var(--lyra-color-fg-on-primary)'
    : 'var(--lyra-color-fg-default)'
  const hoverBg = danger
    ? 'var(--lyra-color-status-critical-subtle)'
    : variant === 'primary'
    ? 'var(--lyra-color-state-bg-hover-primary)'
    : 'var(--lyra-color-state-bg-hover-opacity)'

  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        height: 36, padding: '0 var(--space-4)',
        borderRadius: 'var(--radius-md)',
        border: variant === 'primary' ? 'none' : '1px solid var(--lyra-color-border-soft)',
        background: bg, font: '500 14px/20px ' + F, color, cursor: 'pointer',
        transition: 'background 0.12s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = hoverBg }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = bg }}
    >
      {children}
    </button>
  )
}

/* ─── Main component ─── */

export function ThemeDetailPage({
  themeId,
  onBack,
  onDuplicate,
}: {
  themeId: string
  onBack: () => void
  onDuplicate: (id: string) => void
}) {
  const [theme, setTheme] = useState<Theme | null>(() => {
    const src = getThemeById(themeId)
    return src ? (JSON.parse(JSON.stringify(src)) as Theme) : null
  })
  const [activeQType, setActiveQType] = useState<QType>('osat')
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [saveToast, setSaveToast]     = useState(false)
  const [errors, setErrors]           = useState<ThemeValidationErrors>({})

  useEffect(() => {
    const src = getThemeById(themeId)
    setTheme(src ? (JSON.parse(JSON.stringify(src)) as Theme) : null)
    setActiveQType('osat')
    setSaveToast(false)
    setErrors({})
  }, [themeId])

  useEffect(() => {
    if (!saveToast) return
    const t = setTimeout(() => setSaveToast(false), 2500)
    return () => clearTimeout(t)
  }, [saveToast])

  const updateTheme = useCallback((patch: Partial<Theme>) => {
    setTheme(prev => {
      if (!prev) return prev
      const next = { ...prev, ...patch }
      return next
    })
    if (errors.nm && patch.nm && patch.nm.trim()) {
      setErrors(prev => { const n = { ...prev }; delete n.nm; return n })
    }
  }, [errors])

  const updateQ = useCallback((qType: QType, patch: Partial<QuestionConfig>) => {
    setTheme(prev => {
      if (!prev) return prev
      return { ...prev, q: { ...prev.q, [qType]: { ...prev.q[qType], ...patch } } }
    })
    if (errors.listPickerLabel && patch.listPickerLabel && patch.listPickerLabel.trim()) {
      setErrors(prev => { const n = { ...prev }; delete n.listPickerLabel; return n })
    }
  }, [errors])

  const updateMsg = useCallback((patch: Partial<MessageConfig>) => {
    setTheme(prev => {
      if (!prev) return prev
      return { ...prev, msg: { ...prev.msg, ...patch } }
    })
    if (errors.startLabel && patch.startLabel && patch.startLabel.trim()) {
      setErrors(prev => { const n = { ...prev }; delete n.startLabel; return n })
    }
    if (errors.optLabel && patch.optLabel && patch.optLabel.trim()) {
      setErrors(prev => { const n = { ...prev }; delete n.optLabel; return n })
    }
  }, [errors])

  const handleSave = () => {
    if (!theme) return
    const validationErrors = validateTheme(theme)
    if (hasValidationErrors(validationErrors)) {
      setErrors(validationErrors)
      return
    }
    syncTheme(theme)
    setSaveToast(true)
    setErrors({})
  }

  const handleDuplicate = () => {
    if (!theme) return
    const copy = doDuplicate(theme)
    onDuplicate(copy.id)
  }

  const handleDelete = () => {
    if (!theme) return
    const result = doDelete(theme)
    if (result.ok) {
      setDeleteConfirm(false)
      onBack()
    }
  }

  if (!theme) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--lyra-color-fg-secondary)', font: '400 14px/20px ' + F }}>
        Theme not found.
        <button onClick={onBack} style={{ marginLeft: 8, color: 'var(--lyra-color-fg-link)', background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}>Go back</button>
      </div>
    )
  }

  const locked   = theme.sys
  const activeQ  = theme.q[activeQType]
  const isVerb   = activeQType === 'verbatim'
  const ctrlOpts = getControlOptions(theme.ch, activeQType)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--lyra-color-bg-surface-canvas)', fontFamily: F, display: 'flex', flexDirection: 'column' }}>

      {/* ─── PAGE HEADER ─── */}
      <header style={{
        background: 'var(--lyra-color-bg-surface-base)',
        borderBottom: '1px solid var(--lyra-color-border-subtle)',
        padding: '18px 40px 22px',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
          <button
            onClick={onBack}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              font: '500 12px/16px ' + F,
              color: 'var(--lyra-color-fg-secondary)',
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '4px 6px', borderRadius: 6, marginLeft: -6,
              transition: 'background 0.12s, color 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--lyra-color-state-bg-hover-opacity)'; e.currentTarget.style.color = 'var(--lyra-color-fg-default)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--lyra-color-fg-secondary)' }}
          >
            <ArrowLeft style={{ width: 13, height: 13 }} />
            Back to themes
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
            {!locked && (
              <HeaderBtn onClick={() => setDeleteConfirm(true)} danger>
                <Trash2 size={14} /> Delete
              </HeaderBtn>
            )}
            <HeaderBtn onClick={handleDuplicate}>
              <Copy size={14} /> {locked ? 'Duplicate to customise' : 'Duplicate'}
            </HeaderBtn>
            {!locked && (
              <HeaderBtn onClick={handleSave} variant="primary">
                <Save size={14} /> Save
              </HeaderBtn>
            )}
          </div>
        </div>

        <div style={{ font: '500 11px/14px ' + F, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--lyra-color-fg-active-strong)', marginBottom: 8 }}>
          Theme · Digital
        </div>

        <h1 style={{ font: '600 22px/28px ' + F, letterSpacing: '-0.018em', color: 'var(--lyra-color-fg-default)', margin: '0 0 8px' }}>
          {theme.nm}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            background: locked ? 'var(--lyra-color-bg-active-subtle)' : 'var(--lyra-slate-100)',
            color:      locked ? 'var(--lyra-color-fg-active-strong)' : 'var(--lyra-slate-600)',
            borderRadius: 5, padding: '3px 9px',
            font: '500 11px/16px ' + F,
          }}>
            {locked ? 'System default' : 'Custom'}
          </span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--lyra-color-fg-disabled)', display: 'inline-block', flexShrink: 0 }} />
          <span style={{ font: '400 12px/16px ' + F, color: 'var(--lyra-color-fg-secondary)' }}>
            {theme.ds}
          </span>
        </div>
      </header>

      {/* ─── LOCKED BANNER ─── */}
      {locked && <LockedBanner />}

      {/* ─── 3-COLUMN CONTENT ─── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '260px 1fr 300px',
          gap: 20,
          padding: '32px 40px 64px',
          alignItems: 'start',
          boxSizing: 'border-box',
        }}>

          {/* ── LEFT: Question Types Sidebar ── */}
          <div style={cardShell}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 20px', borderBottom: '1px solid var(--lyra-color-border-subtle)',
            }}>
              <span style={{ font: '600 13px/16px ' + F, color: 'var(--lyra-color-fg-default)' }}>
                Question types
              </span>
              <span style={{ font: '500 10px/14px ' + F, color: 'var(--lyra-color-fg-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Digital
              </span>
            </div>

            {Q_TYPES.map((qt, idx) => {
              const isActive   = activeQType === qt.key
              const chipLabel  = CONTROL_LABELS[theme.q[qt.key].control] ?? theme.q[qt.key].control
              return (
                <div
                  key={qt.key}
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveQType(qt.key)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setActiveQType(qt.key) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    position: 'relative',
                    padding: '12px 16px 12px 22px',
                    borderBottom: idx < Q_TYPES.length - 1 ? '1px solid var(--lyra-color-border-subtle)' : 'none',
                    background: isActive ? 'var(--lyra-brand-50)' : 'var(--lyra-color-bg-surface-base)',
                    cursor: 'pointer', outline: 'none',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-bg-surface-base)' }}
                >
                  <div style={{
                    position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                    width: 3, height: 24, borderRadius: 2,
                    background: isActive ? 'var(--lyra-brand-600)' : 'transparent',
                    transition: 'background 0.12s',
                  }} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ font: `${isActive ? 600 : 500} 13px/17px ${F}`, color: isActive ? 'var(--lyra-color-fg-active-strong)' : 'var(--lyra-color-fg-default)' }}>
                      {qt.label}
                    </div>
                    <div style={{ font: '400 12px/16px ' + F, color: 'var(--lyra-color-fg-secondary)', marginTop: 3 }}>
                      {qt.subtitle}
                    </div>
                  </div>

                  <span style={{
                    display: 'inline-flex', flexShrink: 0,
                    padding: '2px 8px', borderRadius: 'var(--radius-full)',
                    font: '500 11px/16px ' + F,
                    background: isActive ? 'var(--lyra-color-bg-active-subtle)' : 'var(--lyra-slate-100)',
                    color:      isActive ? 'var(--lyra-color-fg-active-strong)' : 'var(--lyra-slate-600)',
                  }}>
                    {chipLabel}
                  </span>
                </div>
              )
            })}
          </div>

          {/* ── CENTER: Editor Panel ── */}
          <div style={{
            ...cardShell,
            pointerEvents: locked ? 'none' : undefined,
            opacity:       locked ? 0.6 : 1,
            transition:    'opacity 0.15s',
          }}>
            {/* Editor header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 24px', borderBottom: '1px solid var(--lyra-color-border-subtle)',
            }}>
              <span style={{ font: '600 14px/20px ' + F, letterSpacing: '-0.01em', color: 'var(--lyra-color-fg-default)' }}>
                {Q_TYPES.find(q => q.key === activeQType)?.label}
              </span>
              <span style={{ font: '500 10px/14px ' + F, color: 'var(--lyra-color-fg-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {locked ? 'Read-only' : 'Digital'}
              </span>
            </div>

            {/* Group 1 — Theme name */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--lyra-color-border-subtle)' }}>
              <SectionHeader label="Theme name" />
              <ValidatedInput
                id="theme-nm"
                value={theme.nm}
                onChange={v => updateTheme({ nm: v })}
                placeholder="Theme name"
                disabled={locked}
                maxLen={50}
                restrictChars
                error={errors.nm}
              />
            </div>

            {/* Group 2 — Active question type */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--lyra-color-border-subtle)' }}>
              <SectionHeader label={Q_TYPES.find(q => q.key === activeQType)?.label ?? ''} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Control style */}
                <div>
                  <FieldLabel label="Control style" htmlFor="ctrl-style" />
                  <SelectField
                    id="ctrl-style"
                    value={activeQ.control}
                    onChange={v => updateQ(activeQType, { control: v })}
                    options={ctrlOpts.map(o => ({ value: o, label: CONTROL_LABELS[o] ?? o }))}
                    disabled={locked}
                  />
                </div>

                {/* List Picker label (only when listpicker is selected) */}
                {!isVerb && activeQ.control === 'listpicker' && (
                  <div>
                    <FieldLabel label="List Picker label" htmlFor="lp-label" />
                    <ValidatedInput
                      id="lp-label"
                      value={activeQ.listPickerLabel}
                      onChange={v => updateQ(activeQType, { listPickerLabel: v })}
                      placeholder="Rate your experience"
                      disabled={locked}
                      maxLen={20}
                      restrictChars
                      error={errors.listPickerLabel}
                    />
                  </div>
                )}

                {/* Scale labels toggle (scale only) */}
                {!isVerb && (
                  <div>
                    <FieldLabel label="Scale labels" />
                    <button
                      onClick={() => updateQ(activeQType, { scaleLabels: !activeQ.scaleLabels })}
                      aria-pressed={activeQ.scaleLabels}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        height: 36, padding: '0 14px', borderRadius: 'var(--radius-full)',
                        border:      activeQ.scaleLabels ? '1px solid var(--lyra-color-border-active)' : '1px solid var(--lyra-color-border-soft)',
                        background:  activeQ.scaleLabels ? 'var(--lyra-brand-600)' : 'var(--lyra-color-bg-surface-base)',
                        font:        '500 13px/16px ' + F,
                        color:       activeQ.scaleLabels ? 'var(--lyra-color-fg-inverse)' : 'var(--lyra-color-fg-default)',
                        cursor:      'pointer', userSelect: 'none',
                        transition:  'background 0.12s, border-color 0.12s',
                      }}
                    >
                      <span style={{
                        width: 16, height: 16, borderRadius: '50%',
                        background: activeQ.scaleLabels ? 'var(--lyra-color-fg-inverse)' : 'var(--lyra-color-fg-secondary)',
                        flexShrink: 0, transition: 'background 0.12s',
                      }} />
                      {activeQ.scaleLabels ? 'On' : 'Off'}
                    </button>
                  </div>
                )}

                {/* Low / High labels (conditional) */}
                {!isVerb && activeQ.scaleLabels && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
                    <div>
                      <FieldLabel label="Lowest scale label" htmlFor="low-lbl" />
                      <ValidatedInput id="low-lbl" value={activeQ.lowLabel} onChange={v => updateQ(activeQType, { lowLabel: v })} placeholder="Very dissatisfied" disabled={locked} />
                    </div>
                    <div>
                      <FieldLabel label="Highest scale label" htmlFor="high-lbl" />
                      <ValidatedInput id="high-lbl" value={activeQ.highLabel} onChange={v => updateQ(activeQType, { highLabel: v })} placeholder="Very satisfied" disabled={locked} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Group 3 — Messages */}
            <div style={{ padding: '20px 24px' }}>
              <SectionHeader label="Messages" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Mode */}
                <div>
                  <FieldLabel label="Message mode" htmlFor="msg-mode" />
                  <SelectField
                    id="msg-mode"
                    value={theme.msg.mode}
                    onChange={v => updateMsg({ mode: v as MessageConfig['mode'] })}
                    options={[
                      { value: 'optout', label: 'Invitation with opt out' },
                      { value: 'plain',  label: 'Invitation without opt out' },
                      { value: 'none',   label: 'None — start immediately' },
                    ]}
                    disabled={locked}
                  />
                </div>

                {/* Invitation text */}
                <div>
                  <FieldLabel label="Invitation text" htmlFor="msg-intro" />
                  <ValidatedInput
                    id="msg-intro"
                    value={theme.msg.intro}
                    onChange={v => updateMsg({ intro: v })}
                    placeholder="Invitation message"
                    disabled={locked || theme.msg.mode === 'none'}
                    maxLen={200}
                  />
                  {theme.msg.mode === 'none' && (
                    <p style={{
                      margin: '8px 0 0', font: '400 12px/18px ' + F,
                      color: 'var(--lyra-color-fg-secondary)', padding: '10px 14px',
                      background: 'var(--lyra-color-bg-surface-canvas)',
                      borderRadius: 'var(--radius-sm)', border: '1px solid var(--lyra-color-border-subtle)',
                    }}>
                      The survey starts immediately with no introduction. Only valid where consent is already covered by the channel.
                    </p>
                  )}
                </div>

                {/* Start + Opt-out labels side by side */}
                <div style={{ display: 'grid', gridTemplateColumns: theme.msg.mode === 'optout' ? '1fr 1fr' : '1fr', gap: '16px 24px' }}>
                  <div>
                    <FieldLabel label="Button to Start" htmlFor="msg-start" sub="Quick-reply label to start" />
                    <ValidatedInput
                      id="msg-start"
                      value={theme.msg.startLabel}
                      onChange={v => updateMsg({ startLabel: v })}
                      placeholder="Get Started"
                      disabled={locked || theme.msg.mode === 'none'}
                      maxLen={20}
                      restrictChars
                      error={errors.startLabel}
                    />
                  </div>

                  {theme.msg.mode === 'optout' && (
                    <div>
                      <FieldLabel label="Button to Refuse" htmlFor="msg-opt" sub="Label to opt out" />
                      <ValidatedInput
                        id="msg-opt"
                        value={theme.msg.optLabel}
                        onChange={v => updateMsg({ optLabel: v })}
                        placeholder="Not Today"
                        disabled={locked}
                        maxLen={20}
                        restrictChars
                        error={errors.optLabel}
                      />
                    </div>
                  )}
                </div>

                {/* Thank-you */}
                <div>
                  <FieldLabel label="Thank-you message" htmlFor="msg-thanks" />
                  <ValidatedInput
                    id="msg-thanks"
                    value={theme.msg.thanks}
                    onChange={v => updateMsg({ thanks: v })}
                    placeholder="Thank you for providing your valuable feedback."
                    disabled={locked}
                    maxLen={200}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Live Preview (sticky) ── */}
          <div style={{ position: 'sticky', top: 32, alignSelf: 'start' }}>
            <LivePreview theme={theme} activeQType={activeQType} />
          </div>
        </div>
      </div>

      {/* ─── DELETE CONFIRM MODAL ─── */}
      {deleteConfirm && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.24)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setDeleteConfirm(false) }}
        >
          <div style={{
            background: 'var(--lyra-color-bg-surface-overlay)',
            borderRadius: 'var(--radius-xl)', boxShadow: 'var(--sol-effect-shadowlg)',
            width: '100%', maxWidth: 440, padding: 'var(--space-6)',
          }}>
            <h2 style={{ margin: '0 0 8px', font: '600 16px/20px ' + F, color: 'var(--lyra-color-fg-default)' }}>
              Delete theme?
            </h2>
            <p style={{ margin: '0 0 24px', font: '400 14px/22px ' + F, color: 'var(--lyra-color-fg-secondary)' }}>
              "{theme.nm}" will be permanently deleted. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteConfirm(false)}
                style={{
                  height: 36, padding: '0 var(--space-4)', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--lyra-color-border-soft)',
                  background: 'var(--lyra-color-bg-surface-base)',
                  font: '500 14px/20px ' + F, color: 'var(--lyra-color-fg-default)',
                  cursor: 'pointer', transition: 'background 0.12s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-bg-surface-base)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                style={{
                  height: 36, padding: '0 var(--space-4)', borderRadius: 'var(--radius-md)',
                  border: 'none', background: 'var(--lyra-color-bg-destructive)',
                  font: '500 14px/20px ' + F, color: 'var(--lyra-color-fg-on-desctructive)',
                  cursor: 'pointer', transition: 'background 0.12s',
                }}
              >
                Delete theme
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── SAVE TOAST ─── */}
      {saveToast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 40,
          background: 'var(--lyra-color-bg-surface-inverse)',
          color: 'var(--lyra-color-fg-inverse)',
          padding: '10px 16px', borderRadius: 'var(--radius-md)',
          font: '500 14px/20px ' + F,
          boxShadow: 'var(--sol-effect-shadowlg)',
        }}>
          Theme saved
        </div>
      )}
    </div>
  )
}
