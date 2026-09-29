import { useState, useEffect, useCallback } from 'react'
import { Info, Lock, ChevronDown, User, X } from 'lucide-react'
import {
  type Theme, type QType, type QuestionConfig, type MessageConfig,
  type ThemeValidationErrors,
  getThemeById, getControlOptions,
  syncTheme, sanitizeName, validateTheme, hasValidationErrors,
  makeDraftTheme, saveNewTheme, isThemeNameTaken,
} from '@/lib/themes'

const F = 'var(--lyra-font-sans, var(--font-sans))'

const Q_TYPES: { key: QType; label: string; subtitle: string }[] = [
  { key: 'asat',     label: 'ASAT',     subtitle: 'Agent satisfaction — 1–5' },
  { key: 'csat',     label: 'CSAT',     subtitle: 'Customer satisfaction — 1–5' },
  { key: 'verbatim', label: 'Verbatim', subtitle: 'Open text comment' },
]

const Q_TEXT: Record<QType, string> = {
  osat:     'How satisfied were you with your overall experience?',
  asat:     'How would you rate the person who helped you today?',
  csat:     'How satisfied were you with the service you received?',
  verbatim: 'What could we have done better?',
} as const

const CONTROL_LABELS: Record<string, string> = {
  quickreply:  'Quick reply',
  listpicker:  'List Picker',
  textarea:    'Textarea',
}

const CONTROL_DESCRIPTIONS: Record<string, string> = {
  listpicker: 'Customer selects from a scrollable list',
  quickreply: 'Customer taps a button to answer',
}


const cardShell: React.CSSProperties = {
  background: 'var(--lyra-color-bg-surface-base)',
  border: '1px solid var(--lyra-color-border-subtle)',
  borderRadius: 'var(--radius-lg)',
  overflow: 'hidden',
}

/* ─── Info banner (locked themes) ─── */
function LockedBanner() {
  return (
    <div style={{
      display: 'flex', width: '100%', minHeight: 40,
      padding: 'var(--space-3) var(--space-4)',
      alignItems: 'flex-start', gap: 'var(--space-2)',
      background: 'var(--lyra-color-status-info-subtle)',
      borderRadius: 'var(--radius-md)',
      boxSizing: 'border-box',
    }}>
      <div style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Info size={16} style={{ color: 'var(--lyra-color-status-info-strong)' }} />
      </div>
      <div style={{ flex: 1, minHeight: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <p style={{ margin: 0, font: '400 14px/20px ' + F, color: 'var(--lyra-color-fg-default)' }}>
          This is a system-provided Digital theme and cannot be edited or deleted. To customize it, go back to the Themes list and use the Duplicate action to create your own version.
        </p>
      </div>
    </div>
  )
}

/* ─── Type chip (matches ThemesListPage) ─── */
function TypeChip({ sys }: { sys: boolean }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
      padding: '3px 10px', borderRadius: 'var(--radius-full)',
      font: '500 12px/16px ' + F,
      background: sys ? 'var(--lyra-color-bg-active-subtle)' : 'var(--lyra-color-status-success-subtle)',
      color:      sys ? 'var(--lyra-color-fg-active-strong)' : 'var(--lyra-color-status-success-strong)',
    }}>
      {sys && <Lock size={11} style={{ flexShrink: 0 }} />}
      {sys ? 'System Default' : 'Custom'}
    </span>
  )
}

/* ─── Preview components ─── */

function ChatPreview({ theme, activeQType }: { theme: Theme; activeQType: QType }) {
  const qConfig  = theme.q[activeQType]
  const control  = qConfig.control
  const isVerb   = activeQType === 'verbatim'
  const qText    = Q_TEXT[activeQType]
  const ctrlLbl  = (CONTROL_LABELS[control] ?? control).toLowerCase()
  const qLabel   = Q_TYPES.find(q => q.key === activeQType)?.label

  return (
    <div style={{
      width: 328, boxSizing: 'border-box',
      borderRadius: 'var(--radius-lg)',
      background: 'var(--lyra-color-bg-surface-container-subtle, var(--lyra-color-bg-surface-canvas))',
      overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
    }}>
      <div style={{ alignSelf: 'stretch', padding: '12px 16px', borderBottom: '1px solid var(--lyra-color-border-subtle)' }}>
        <span style={{ font: '500 14px/18px ' + F, color: 'var(--lyra-color-fg-default)' }}>
          {isVerb ? `Preview of ${qLabel}` : `Preview of ${ctrlLbl} for ${qLabel}`}
        </span>
      </div>
      <div style={{ alignSelf: 'stretch', padding: 20, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--lyra-brand-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <User size={14} style={{ color: '#fff' }} />
          </div>
          <div style={{ background: 'var(--lyra-color-bg-surface-base)', borderRadius: 10, padding: '10px 14px', font: '500 13px/19px ' + F, color: 'var(--lyra-color-fg-default)', maxWidth: 220 }}>
            {qText}
          </div>
        </div>

        {!isVerb && control === 'listpicker' && (
          <div style={{ border: '1px solid var(--lyra-color-border-subtle)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: '8px 14px', background: 'var(--lyra-color-bg-surface-canvas)', font: '600 10px/14px ' + F, color: 'var(--lyra-color-fg-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {qConfig.listPickerLabel || 'Rate your experience'}
            </div>
            {[1, 2, 3, 4, 5].map((n, i) => {
              const label = n === 1 ? qConfig.lowLabel : n === 5 ? qConfig.highLabel : qConfig.midLabels[n - 2]
              return (
                <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderTop: i > 0 ? '1px solid var(--lyra-color-border-subtle)' : 'none' }}>
                  <span style={{ font: '500 12px/16px ' + F, color: 'var(--lyra-color-fg-secondary)' }}>{n} —</span>
                  <span style={{ font: '400 12px/16px ' + F, color: 'var(--lyra-color-fg-default)' }}>{label}</span>
                </div>
              )
            })}
          </div>
        )}

        {!isVerb && control === 'quickreply' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[1, 2, 3, 4, 5].map(n => {
              const label = n === 1 ? qConfig.lowLabel : n === 5 ? qConfig.highLabel : qConfig.midLabels[n - 2]
              return (
                <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 6, border: '1px solid var(--lyra-color-border-soft)' }}>
                  <span style={{ font: '500 12px/16px ' + F, color: 'var(--lyra-color-fg-default)' }}>{n}</span>
                  {label && (
                    <span style={{ font: '400 12px/16px ' + F, color: 'var(--lyra-color-fg-secondary)' }}>— {label}</span>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {isVerb && (
          <div style={{ border: '1px solid var(--lyra-color-border-soft)', borderRadius: 8, padding: '10px 12px', minHeight: 64, font: '400 12px/18px ' + F, color: 'var(--lyra-color-fg-disabled)' }}>
            Type your answer
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Field primitives ─── */

function SectionHeader({ label, infoText }: { label: string; infoText?: string }) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
      <span style={{ font: '600 14px/20px ' + F, letterSpacing: '-0.01em', color: 'var(--lyra-color-fg-default)' }}>{label}</span>
      {infoText && (
        <div style={{ position: 'relative', display: 'inline-flex' }}>
          <Info size={14} style={{ color: 'var(--lyra-color-fg-action)', cursor: 'pointer' }} onClick={() => setShow(v => !v)} />
          {show && (
            <div style={{ position: 'absolute', left: 'calc(100% + 8px)', top: '50%', transform: 'translateY(-50%)', background: 'var(--lyra-color-bg-surface-base)', border: '1px solid var(--lyra-color-border-soft)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--sol-effect-shadowmd)', padding: '10px 12px', width: 240, zIndex: 999, font: '400 12px/18px ' + F, color: 'var(--lyra-color-fg-secondary)' }}>
              {infoText}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CharCount({ length, maxLen }: { length: number; maxLen: number }) {
  return (
    <span style={{
      flexShrink: 0, font: '400 12px/16px ' + F, letterSpacing: '0.2px',
      color: 'var(--lyra-color-fg-secondary)',
    }}>
      {length}/{maxLen}
    </span>
  )
}

function FieldLabel({ label, htmlFor, sub, required, count }: {
  label: string; htmlFor?: string; sub?: string; required?: boolean
  count?: { length: number; maxLen: number }
}) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <label htmlFor={htmlFor} style={{ display: 'block', font: '500 13px/16px ' + F, color: 'var(--lyra-color-fg-default)' }}>
          {label}
          {required && <span style={{ color: 'var(--lyra-color-status-critical-strong)' }}> *</span>}
        </label>
        {count && <CharCount length={count.length} maxLen={count.maxLen} />}
      </div>
      {sub && (
        <span style={{ font: '400 12px/16px ' + F, color: 'var(--lyra-color-fg-secondary)' }}>
          {sub}
        </span>
      )}
    </div>
  )
}

function ValidatedInput({ id, value, onChange, placeholder, disabled, maxLen, restrictChars, error, warning, valid }: {
  id?: string; value: string; onChange: (v: string) => void; placeholder?: string
  disabled?: boolean; maxLen?: number; restrictChars?: boolean; error?: string; warning?: string; valid?: boolean
}) {
  const handleChange = (raw: string) => {
    let v = raw
    if (restrictChars) v = sanitizeName(v)
    if (maxLen) v = v.slice(0, maxLen)
    onChange(v)
  }

  const borderColor = error ? 'var(--lyra-color-status-critical-medium)' : warning ? 'var(--lyra-color-status-warning-medium)' : 'var(--lyra-color-border-soft)'
  const showValid = valid && !error && !warning

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
          <input
            id={id}
            type="text"
            value={value}
            onChange={e => handleChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            style={{
              height: 38, width: '100%', padding: '0 12px',
              background:    disabled ? 'var(--lyra-color-bg-disabled)' : warning ? 'var(--lyra-color-status-warning-subtle)' : 'var(--lyra-color-bg-field)',
              border:        `1px solid ${borderColor}`,
              borderRadius:  'var(--radius-sm)',
              font:          '400 14px/20px ' + F,
              color:         disabled ? 'var(--lyra-color-fg-disabled)' : 'var(--lyra-color-fg-default)',
              cursor:        disabled ? 'not-allowed' : 'text',
              outline:       'none', boxSizing: 'border-box',
            }}
            onFocus={e => { if (!disabled && !error) { e.currentTarget.style.borderColor = warning ? 'var(--lyra-color-status-warning-medium)' : 'var(--lyra-color-border-active)'; e.currentTarget.style.boxShadow = warning ? '0 0 0 2px rgba(142,104,0,0.12)' : 'var(--sol-effect-activering)' } }}
            onBlur={e => { e.currentTarget.style.borderColor = borderColor; e.currentTarget.style.boxShadow = '' }}
          />
        </div>
        {showValid && (
          <svg viewBox="0 0 16 16" width="16" height="16" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="8" cy="8" r="8" fill="var(--lyra-color-status-success-strong)" />
            <path d="M4.5 8L6.5 10.5L11.5 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      {error && (
        <span style={{ display: 'block', marginTop: 4, font: '400 12px/16px ' + F, color: 'var(--lyra-color-status-critical-strong)' }}>
          {error}
        </span>
      )}
      {!error && warning && (
        <span style={{ display: 'block', marginTop: 4, font: '400 12px/16px ' + F, color: 'var(--lyra-color-status-warning-strong)' }}>
          {warning}
        </span>
      )}
    </div>
  )
}

function ValidatedTextarea({ id, value, onChange, placeholder, disabled, maxLen }: {
  id?: string; value: string; onChange: (v: string) => void; placeholder?: string
  disabled?: boolean; maxLen?: number
}) {
  return (
    <div style={{ position: 'relative' }}>
      <textarea
        id={id}
        value={value}
        onChange={e => onChange(maxLen ? e.target.value.slice(0, maxLen) : e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={2}
        style={{
          width: '100%', padding: '10px 12px', resize: 'vertical', minHeight: 56,
          background:   disabled ? 'var(--lyra-color-bg-disabled)' : 'var(--lyra-color-bg-field)',
          border:       '1px solid var(--lyra-color-border-soft)',
          borderRadius: 'var(--radius-sm)',
          font:         '400 14px/20px ' + F,
          color:        disabled ? 'var(--lyra-color-fg-disabled)' : 'var(--lyra-color-fg-default)',
          cursor:       disabled ? 'not-allowed' : 'text',
          outline:      'none', boxSizing: 'border-box', fontFamily: F,
        }}
        onFocus={e => { if (!disabled) { e.currentTarget.style.borderColor = 'var(--lyra-color-border-active)'; e.currentTarget.style.boxShadow = 'var(--sol-effect-activering)' } }}
        onBlur={e => { e.currentTarget.style.borderColor = 'var(--lyra-color-border-soft)'; e.currentTarget.style.boxShadow = '' }}
      />
    </div>
  )
}

/* ─── Read-only field (locked themes) — plain, borderless, normal-weight text ─── */
function ReadOnlyField({ value, placeholder }: { value: string; placeholder?: string }) {
  return (
    <div style={{
      height: 38, width: '100%', display: 'flex', alignItems: 'center',
      padding: '0 12px', boxSizing: 'border-box',
      background: 'var(--lyra-color-bg-disabled)',
      borderRadius: 'var(--radius-sm)',
      font: '400 14px/20px ' + F,
      color: value ? 'var(--lyra-color-fg-default)' : 'var(--lyra-color-fg-secondary)',
      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    }}>
      {value || placeholder}
    </div>
  )
}

function ReadOnlyTextarea({ value }: { value: string }) {
  return (
    <div style={{
      width: '100%', padding: '10px 12px', minHeight: 56, boxSizing: 'border-box',
      background: 'var(--lyra-color-bg-disabled)',
      borderRadius: 'var(--radius-sm)',
      font: '400 14px/20px ' + F,
      color: 'var(--lyra-color-fg-default)',
      whiteSpace: 'pre-wrap', wordBreak: 'break-word',
    }}>
      {value}
    </div>
  )
}

function SelectField({ id, value, onChange, options, disabled }: {
  id?: string; value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]; disabled?: boolean
}) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        style={{
          appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none',
          height: 38, width: '100%', padding: '0 36px 0 12px',
          background:   disabled ? 'var(--lyra-color-bg-disabled)' : 'var(--lyra-color-bg-field)',
          border:       '1px solid var(--lyra-color-border-soft)',
          borderRadius: 'var(--radius-sm)',
          font:         '400 14px/20px ' + F,
          color:        disabled ? 'var(--lyra-color-fg-disabled)' : 'var(--lyra-color-fg-default)',
          cursor:       disabled ? 'not-allowed' : 'pointer',
          outline:      'none', boxSizing: 'border-box',
        }}
        onFocus={e => { if (!disabled) { e.currentTarget.style.borderColor = 'var(--lyra-color-border-active)'; e.currentTarget.style.boxShadow = 'var(--sol-effect-activering)' } }}
        onBlur={e => { e.currentTarget.style.borderColor = 'var(--lyra-color-border-soft)'; e.currentTarget.style.boxShadow = '' }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={14} style={{
        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
        color: disabled ? 'var(--lyra-color-fg-disabled)' : 'var(--lyra-color-fg-secondary)',
        pointerEvents: 'none',
      }} />
    </div>
  )
}

function ControlStyleOption({ label, description, selected, onClick, disabled }: {
  label: string; description: string; selected: boolean; onClick: () => void; disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1, textAlign: 'left', display: 'flex', alignItems: 'flex-start', gap: 10,
        padding: '12px 14px', borderRadius: 'var(--radius-md)',
        border: disabled ? '1px solid var(--lyra-color-border-soft)' : selected ? '1.5px solid var(--lyra-brand-600)' : '1px solid var(--lyra-color-border-soft)',
        background: disabled ? 'var(--lyra-color-bg-surface-base)' : selected ? 'var(--lyra-brand-50)' : 'var(--lyra-color-bg-surface-base)',
        cursor: disabled ? 'default' : 'pointer',
      }}
    >
      <span style={{
        width: 16, height: 16, borderRadius: '50%', flexShrink: 0, marginTop: 2, boxSizing: 'border-box',
        border: selected ? `5px solid ${disabled ? 'var(--lyra-color-fg-default)' : 'var(--lyra-brand-600)'}` : '1.5px solid var(--lyra-color-border-medium)',
        background: 'var(--lyra-color-bg-surface-base)',
      }} />
      <span>
        <div style={{ font: '500 13px/18px ' + F, color: 'var(--lyra-color-fg-default)' }}>{label}</div>
        <div style={{ font: '400 12px/16px ' + F, color: 'var(--lyra-color-fg-secondary)', marginTop: 2 }}>{description}</div>
      </span>
    </button>
  )
}

/* ─── Header action buttons ─── */

function HeaderBtn({
  onClick, children, variant = 'secondary', danger, disabled,
}: {
  onClick: () => void; children: React.ReactNode; variant?: 'secondary' | 'primary'; danger?: boolean; disabled?: boolean
}) {
  const bg = disabled && variant === 'primary'
    ? 'var(--lyra-color-bg-disabled)'
    : variant === 'primary'
    ? 'var(--lyra-color-bg-primary)'
    : 'var(--lyra-color-bg-surface-base)'
  const color = disabled && variant === 'primary'
    ? 'var(--lyra-color-fg-disabled)'
    : danger
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
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        height: 36, padding: '0 var(--space-4)',
        borderRadius: 'var(--radius-md)',
        border: variant === 'primary' ? 'none' : '1px solid var(--lyra-color-border-soft)',
        background: bg, font: '500 14px/20px ' + F, color,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLElement).style.background = hoverBg }}
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
  onCreated,
}: {
  themeId?: string
  onBack: () => void
  onCreated?: (id: string) => void
}) {
  const isCreate = themeId === undefined

  const [theme, setTheme] = useState<Theme | null>(() => {
    if (isCreate) return makeDraftTheme('digital')
    const src = getThemeById(themeId)
    return src ? (JSON.parse(JSON.stringify(src)) as Theme) : null
  })
  const [activeQType, setActiveQType] = useState<QType>('asat')
  const [saveToast, setSaveToast]     = useState(false)
  const [errors, setErrors]           = useState<ThemeValidationErrors>({})
  const [linkedProgramsOpen, setLinkedProgramsOpen] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    if (isCreate) return
    const src = getThemeById(themeId)
    setTheme(src ? (JSON.parse(JSON.stringify(src)) as Theme) : null)
    setActiveQType('asat')
    setSaveToast(false)
    setErrors({})
    setIsDirty(false)
  }, [themeId, isCreate])

  useEffect(() => {
    if (!saveToast) return
    const t = setTimeout(() => setSaveToast(false), 2500)
    return () => clearTimeout(t)
  }, [saveToast])

  const updateTheme = useCallback((patch: Partial<Theme>) => {
    setTheme(prev => {
      if (!prev) return prev
      return { ...prev, ...patch }
    })
    setIsDirty(true)
    if (errors.nm && patch.nm && patch.nm.trim()) {
      setErrors(prev => { const n = { ...prev }; delete n.nm; return n })
    }
  }, [errors])

  const updateQ = useCallback((qType: QType, patch: Partial<QuestionConfig>) => {
    setTheme(prev => {
      if (!prev) return prev
      return { ...prev, q: { ...prev.q, [qType]: { ...prev.q[qType], ...patch } } }
    })
    setIsDirty(true)
    if (errors.listPickerLabel && patch.listPickerLabel && patch.listPickerLabel.trim()) {
      setErrors(prev => { const n = { ...prev }; delete n.listPickerLabel; return n })
    }
  }, [errors])

  const updateMsg = useCallback((patch: Partial<MessageConfig>) => {
    setTheme(prev => {
      if (!prev) return prev
      return { ...prev, msg: { ...prev.msg, ...patch } }
    })
    setIsDirty(true)
    if (errors.startLabel && patch.startLabel && patch.startLabel.trim()) {
      setErrors(prev => { const n = { ...prev }; delete n.startLabel; return n })
    }
    if (errors.optLabel && patch.optLabel && patch.optLabel.trim()) {
      setErrors(prev => { const n = { ...prev }; delete n.optLabel; return n })
    }
  }, [errors])

  const handleSave = () => {
    if (!theme) return
    const nameTaken = (!theme.sys && (theme.linkedPrograms?.length ?? 0) === 0)
      && !!theme.nm.trim() && isThemeNameTaken(theme.nm, isCreate ? undefined : theme.id)
    if (nameTaken) return
    const validationErrors = validateTheme(theme)
    if (hasValidationErrors(validationErrors)) {
      setErrors(validationErrors)
      return
    }
    if (isCreate) {
      const created = saveNewTheme(theme)
      onCreated?.(created.id)
      return
    }
    syncTheme(theme)
    setSaveToast(true)
    setErrors({})
    setIsDirty(false)
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
  const nameEditable = !locked && (theme.linkedPrograms?.length ?? 0) === 0
  const nameDuplicate = nameEditable && !!theme.nm.trim() && isThemeNameTaken(theme.nm, isCreate ? undefined : theme.id)

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: 'var(--lyra-color-bg-surface-base)' }}>

      {/* ── Page header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', rowGap: 'var(--space-4)',
        flexShrink: 0, minHeight: 72,
        padding: 'var(--space-4) var(--space-7)',
        borderBottom: '1px solid var(--lyra-color-border-subtle)',
        background: 'var(--lyra-color-bg-surface-base)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span
            onClick={onBack}
            style={{ font: '500 16px/20px ' + F, letterSpacing: '-0.01em', color: 'var(--lyra-color-fg-secondary)', cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--lyra-color-fg-default)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--lyra-color-fg-secondary)' }}
          >
            Themes
          </span>
          <span style={{ font: '500 16px/20px ' + F, color: 'var(--lyra-color-fg-secondary)' }}>/</span>
          <span style={{ font: '600 20px/24px ' + F, letterSpacing: '-0.02em', color: 'var(--lyra-color-fg-default)' }}>
            {isCreate ? 'Create new theme' : theme.nm}
          </span>
          {isCreate && <TypeChip sys={false} />}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {locked ? (
            <HeaderBtn onClick={onBack}>Back</HeaderBtn>
          ) : (
            <>
              <HeaderBtn onClick={onBack}>Cancel</HeaderBtn>
              <HeaderBtn onClick={handleSave} variant="primary" disabled={(isCreate ? !theme.nm.trim() : !isDirty) || nameDuplicate}>
                Save
              </HeaderBtn>
            </>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-auto" style={{ padding: 'var(--space-7)' }}>
        {locked && <div style={{ marginBottom: 'var(--space-4)' }}><LockedBanner /></div>}

        <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>

          {/* ── Left column ── */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

            {/* Theme name */}
            <div style={{ ...cardShell, padding: 'var(--space-4)' }}>
              <FieldLabel
                label="Theme name" htmlFor="theme-nm" required={isCreate}
                count={nameEditable ? { length: theme.nm.length, maxLen: 50 } : undefined}
              />
              <div style={{ maxWidth: 400 }}>
                {locked || (theme.linkedPrograms?.length ?? 0) > 0 ? (
                  <ReadOnlyField value={theme.nm} />
                ) : (
                  <ValidatedInput
                    id="theme-nm"
                    value={theme.nm}
                    onChange={v => updateTheme({ nm: v })}
                    placeholder={isCreate ? 'Eg: List picker - CSAT theme' : 'Theme name'}
                    maxLen={50}
                    restrictChars
                    error={errors.nm}
                    warning={!errors.nm && nameDuplicate ? 'A theme with this name already exists. Please enter a unique theme name.' : undefined}
                    valid={!!theme.nm.trim() && !nameDuplicate}
                  />
                )}
              </div>
            </div>

            {/* Presentation */}
            <div style={{ ...cardShell, padding: 'var(--space-4)' }}>
              <SectionHeader label="Presentation" infoText="Pick a question type, then set how it is captured and labelled on this channel." />
              <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>

                {/* Question types list */}
                <div style={{
                  width: 283, flexShrink: 0, alignSelf: 'stretch',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--lyra-color-bg-secondary, var(--lyra-color-bg-surface-base))',
                  display: 'flex', flexDirection: 'column',
                  overflow: 'hidden',
                }}>
                  {/* Header */}
                  <div style={{
                    padding: '12px 12px', display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <span style={{ font: '500 14px/18px ' + F, color: 'var(--lyra-color-fg-default)' }}>
                      Question types for digital
                    </span>
                    <Info size={16} style={{ color: 'var(--lyra-color-fg-action)', flexShrink: 0 }} />
                  </div>

                  {/* Items */}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {Q_TYPES.map((qt, idx) => {
                      const isActive  = activeQType === qt.key
                      const chipLabel = CONTROL_LABELS[theme.q[qt.key].control] ?? theme.q[qt.key].control
                      const isVerbatimRow = qt.key === 'verbatim'
                      return (
                        <div
                          key={qt.key}
                          role="button"
                          tabIndex={0}
                          onClick={() => setActiveQType(qt.key)}
                          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setActiveQType(qt.key) }}
                          style={{
                            padding: isActive ? '16px 12px' : isVerbatimRow ? '24px 12px' : '16px 12px',
                            borderRadius: isActive ? 'var(--radius-md)' : undefined,
                            background: isActive ? 'var(--lyra-color-bg-active-subtle)' : 'transparent',
                            borderBottom: !isActive && idx < Q_TYPES.length - 1 ? '1px solid var(--lyra-color-border-soft)' : 'none',
                            cursor: 'pointer', outline: 'none',
                            display: 'flex', flexDirection: 'column', gap: 16,
                          }}
                          onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
                          onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = isActive ? 'var(--lyra-color-bg-active-subtle)' : 'transparent' }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <div style={{ font: '500 14px/20px ' + F, color: 'var(--lyra-color-fg-default)' }}>
                              {qt.label}
                            </div>
                            <div style={{ font: '400 12px/16px ' + F, color: isActive ? 'var(--lyra-color-fg-default)' : 'var(--lyra-color-fg-secondary)', letterSpacing: '0.2px' }}>
                              {qt.subtitle}
                            </div>
                          </div>
                          {!isVerbatimRow && (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', alignSelf: 'flex-start',
                              height: 24, padding: '0 8px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--lyra-color-bg-control-subtle, rgba(0,0,0,0.02))',
                              outline: '1px solid var(--lyra-color-border-soft)',
                              outlineOffset: -1,
                              font: '400 14px/20px ' + F,
                              color: 'var(--lyra-color-fg-default)',
                            }}>
                              {chipLabel}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* ── Theme panel (inside Presentation) ── */}
                <div style={{
                  flex: '1 0 0', alignSelf: 'stretch',
                  display: 'flex', flexDirection: 'column',
                  background: 'var(--lyra-color-bg-surface-base)',
                  borderLeft: '1px solid var(--lyra-color-border-subtle)',
                  overflow: 'hidden',
                }}>
                  {/* Header */}
                  <div style={{
                    alignSelf: 'stretch',
                    padding: '12px 16px',
                    overflow: 'hidden',
                    display: 'inline-flex', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 24,
                  }}>
                    <div style={{ flex: '1 1 0', alignSelf: 'stretch', display: 'flex', alignItems: 'center', gap: 16 }}>
                      <span style={{ font: '500 14px/18px ' + F, color: 'var(--lyra-color-fg-default)' }}>
                        Theme - {Q_TYPES.find(q => q.key === activeQType)?.label}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div style={{
                    alignSelf: 'stretch', padding: 16, overflow: 'auto',
                    display: 'flex', flexDirection: 'column', gap: 24,
                  }}>

                    {/* Control style */}
                    {isVerb && (
                      <div style={{ alignSelf: 'stretch', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ font: '500 14px/20px ' + F, color: 'var(--lyra-color-fg-default)' }}>
                          Control style
                        </div>
                        <div style={{ font: '400 14px/20px ' + F, color: 'var(--lyra-color-fg-secondary)' }}>
                          Open text
                        </div>
                      </div>
                    )}
                    {!isVerb && locked && (
                      <div style={{ alignSelf: 'stretch', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ font: '500 14px/20px ' + F, color: 'var(--lyra-color-fg-default)' }}>
                          Control style
                        </div>
                        <div style={{ alignSelf: 'stretch', display: 'flex', gap: 16, alignItems: 'flex-end' }}>
                          {ctrlOpts.map(opt => {
                            const isSelected = activeQ.control === opt
                            return (
                              <div
                                key={opt}
                                style={{
                                  flex: '1 1 0',
                                  padding: 12,
                                  borderRadius: 'var(--radius-md)',
                                  background: isSelected ? 'var(--lyra-color-bg-disabled)' : 'var(--lyra-color-bg-surface-base)',
                                  outline: `1px ${isSelected ? 'var(--lyra-color-border-disabled)' : 'var(--lyra-color-border-subtle)'} solid`,
                                  outlineOffset: -1,
                                  display: 'inline-flex', flexDirection: 'column', gap: 16,
                                  ...(isSelected ? {} : { height: 70 }),
                                }}
                              >
                                <div style={{
                                  alignSelf: 'stretch', minHeight: 24, borderRadius: 4,
                                  display: 'inline-flex', alignItems: 'flex-start', gap: 4,
                                }}>
                                  {/* Radio dot */}
                                  <div style={{ padding: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{
                                      width: 16, height: 16,
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                      <div style={{
                                        width: 16, height: 16, borderRadius: '50%', position: 'relative',
                                        background: 'var(--lyra-color-bg-disabled)',
                                        border: isSelected
                                          ? '1px solid var(--lyra-color-border-strong)'
                                          : '1px solid var(--lyra-color-border-disabled)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      }}>
                                        {isSelected && (
                                          <div style={{
                                            width: 6, height: 6, borderRadius: '50%',
                                            background: 'var(--lyra-color-fg-secondary)',
                                          }} />
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  {/* Label + description */}
                                  <div style={{
                                    paddingTop: 2, paddingBottom: 2, paddingRight: 4,
                                    display: 'inline-flex', flexDirection: 'column', gap: 6,
                                  }}>
                                    <div style={{ font: '500 14px/20px ' + F, color: 'var(--lyra-color-fg-default)' }}>
                                      {CONTROL_LABELS[opt] ?? opt}
                                    </div>
                                    <div style={{
                                      font: '400 12px/16px ' + F,
                                      letterSpacing: '0.2px',
                                      color: isSelected ? 'var(--lyra-color-fg-disabled)' : 'var(--lyra-color-fg-secondary)',
                                    }}>
                                      {CONTROL_DESCRIPTIONS[opt] ?? ''}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Control style — editable (custom themes) */}
                    {!isVerb && !locked && (
                      <div style={{ alignSelf: 'stretch', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ font: '500 14px/20px ' + F, color: 'var(--lyra-color-fg-default)' }}>
                          Control style
                        </div>
                        <div style={{ alignSelf: 'stretch', display: 'flex', gap: 16, alignItems: 'stretch' }}>
                          {ctrlOpts.map(opt => (
                            <ControlStyleOption
                              key={opt}
                              label={CONTROL_LABELS[opt] ?? opt}
                              description={CONTROL_DESCRIPTIONS[opt] ?? ''}
                              selected={activeQ.control === opt}
                              onClick={() => updateQ(activeQType, { control: opt })}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* List picker label */}
                    {!isVerb && activeQ.control === 'listpicker' && locked && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 400 }}>
                        <div style={{ font: '500 14px/20px ' + F, color: 'var(--lyra-color-fg-default)' }}>
                          List picker label
                        </div>
                        <div style={{
                          alignSelf: 'stretch', height: 36, paddingLeft: 12,
                          background: 'var(--lyra-color-bg-disabled)',
                          borderRadius: 'var(--radius-md)',
                          display: 'flex', alignItems: 'center',
                          font: '400 14px/20px ' + F, color: 'var(--lyra-color-fg-default)',
                        }}>
                          {activeQ.listPickerLabel || 'Rate your experience'}
                        </div>
                      </div>
                    )}

                    {/* List picker label — editable (custom themes) */}
                    {!isVerb && activeQ.control === 'listpicker' && !locked && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 400 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ font: '500 14px/20px ' + F, color: 'var(--lyra-color-fg-default)' }}>
                              List picker label
                            </span>
                            <span style={{ font: '500 14px/20px ' + F, color: 'var(--lyra-color-status-critical-strong)' }}>*</span>
                          </div>
                          <CharCount length={activeQ.listPickerLabel.length} maxLen={20} />
                        </div>
                        <ValidatedInput
                          id="list-picker-label"
                          value={activeQ.listPickerLabel}
                          onChange={v => updateQ(activeQType, { listPickerLabel: v })}
                          placeholder="Rate your experience"
                          maxLen={20}
                          error={errors.listPickerLabel}
                        />
                      </div>
                    )}

                    {/* Edit scale labels */}
                    {!isVerb && locked && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ font: '500 14px/20px ' + F, color: 'var(--lyra-color-fg-default)' }}>
                          Edit scale labels
                        </span>
                        {/* Toggle switch (read-only) */}
                        <div style={{
                          width: 40, height: 24, borderRadius: 9999,
                          background: 'var(--lyra-color-bg-disabled)',
                          display: 'flex', alignItems: 'center',
                          padding: '0 3px',
                        }}>
                          <div style={{
                            width: 18, height: 18, borderRadius: '50%',
                            background: 'var(--lyra-color-bg-surface-base)',
                            border: '1px solid var(--lyra-color-border-strong)',
                          }} />
                        </div>
                        <span style={{ font: '400 14px/20px ' + F, color: 'var(--lyra-color-fg-default)' }}>No</span>
                      </div>
                    )}

                    {/* Edit scale labels — editable (custom themes) */}
                    {!isVerb && !locked && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ font: '500 14px/20px ' + F, color: 'var(--lyra-color-fg-default)' }}>
                          Edit scale labels
                        </span>
                        <button
                          role="switch"
                          aria-checked={activeQ.scaleLabels}
                          onClick={() => updateQ(activeQType, { scaleLabels: !activeQ.scaleLabels })}
                          style={{
                            width: 40, height: 24, borderRadius: 9999, border: 'none', cursor: 'pointer',
                            background: activeQ.scaleLabels ? 'var(--lyra-color-bg-primary)' : 'var(--lyra-color-border-medium)',
                            display: 'flex', alignItems: 'center',
                            padding: '0 3px', justifyContent: activeQ.scaleLabels ? 'flex-end' : 'flex-start',
                            transition: 'background 0.15s',
                          }}
                        >
                          <div style={{
                            width: 18, height: 18, borderRadius: '50%',
                            background: 'var(--lyra-color-bg-surface-base)',
                          }} />
                        </button>
                        <span style={{ font: '400 14px/20px ' + F, color: 'var(--lyra-color-fg-default)' }}>
                          {activeQ.scaleLabels ? 'Yes' : 'No'}
                        </span>
                      </div>
                    )}

                    {/* Scale labels */}
                    {!isVerb && locked && (
                      <div style={{ alignSelf: 'stretch', display: 'flex', gap: 16 }}>
                        {[1, 2, 3, 4, 5].map(n => {
                          const label = n === 1 ? '1: Lowest scale label' : n === 5 ? '5: Highest scale label' : String(n)
                          const value = n === 1 ? activeQ.lowLabel : n === 5 ? activeQ.highLabel : activeQ.midLabels[n - 2]
                          return (
                            <div key={n} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <div style={{ font: '500 14px/20px ' + F, color: 'var(--lyra-color-fg-default)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {label}
                              </div>
                              <div style={{
                                alignSelf: 'stretch', height: 36, paddingLeft: 12,
                                background: 'var(--lyra-color-bg-disabled)',
                                borderRadius: 'var(--radius-md)',
                                display: 'flex', alignItems: 'center',
                                font: '400 14px/20px ' + F, color: 'var(--lyra-color-fg-default)',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              }}>
                                {value}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Scale labels — editable (custom themes) */}
                    {!isVerb && !locked && (
                      <div style={{ alignSelf: 'stretch', display: 'flex', gap: 16 }}>
                        {[1, 2, 3, 4, 5].map(n => {
                          const label = n === 1 ? '1: Low scale label' : n === 5 ? '5: High scale label' : String(n)
                          const currentValue = n === 1 ? activeQ.lowLabel : n === 5 ? activeQ.highLabel : activeQ.midLabels[n - 2]
                          return (
                            <div key={n} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                                <span style={{ font: '500 14px/20px ' + F, color: 'var(--lyra-color-fg-default)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {label}
                                </span>
                                <CharCount length={currentValue.length} maxLen={20} />
                              </div>
                              {n === 1 ? (
                                <ValidatedInput
                                  id="scale-low"
                                  value={activeQ.lowLabel}
                                  onChange={v => updateQ(activeQType, { lowLabel: v })}
                                  maxLen={20}
                                />
                              ) : n === 5 ? (
                                <ValidatedInput
                                  id="scale-high"
                                  value={activeQ.highLabel}
                                  onChange={v => updateQ(activeQType, { highLabel: v })}
                                  maxLen={20}
                                />
                              ) : (
                                <ValidatedInput
                                  id={`scale-mid-${n}`}
                                  value={activeQ.midLabels[n - 2]}
                                  onChange={v => {
                                    const next = [...activeQ.midLabels] as [string, string, string]
                                    next[n - 2] = v
                                    updateQ(activeQType, { midLabels: next })
                                  }}
                                  maxLen={20}
                                  disabled={!activeQ.scaleLabels}
                                />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Message */}
            <div style={{ ...cardShell, padding: 'var(--space-4)' }}>
              <SectionHeader label="Message" infoText="Set the messages shown before and after the survey." />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                <div style={{ maxWidth: 400 }}>
                  <FieldLabel label="Select survey introduction mode" htmlFor="msg-mode" />
                  {locked ? (
                    <ReadOnlyField value={
                      theme.msg.mode === 'optout' ? 'Invitation with opt out'
                      : theme.msg.mode === 'plain' ? 'Invitation without opt out'
                      : 'None — start immediately'
                    } />
                  ) : (
                    <SelectField
                      id="msg-mode"
                      value={theme.msg.mode}
                      onChange={v => updateMsg({ mode: v as MessageConfig['mode'] })}
                      options={[
                        { value: 'optout', label: 'Invitation with opt out' },
                        { value: 'plain',  label: 'Invitation without opt out' },
                        { value: 'none',   label: 'None — start immediately' },
                      ]}
                    />
                  )}
                  <span style={{ display: 'block', marginTop: 4, font: '400 12px/16px ' + F, color: 'var(--lyra-color-fg-secondary)' }}>
                    Whether anything is shown before the first question.
                  </span>
                </div>

                <div style={{ maxWidth: 804 }}>
                  <FieldLabel label="Introduction message" htmlFor="msg-intro" count={locked ? undefined : { length: theme.msg.intro.length, maxLen: 200 }} />
                  {locked ? (
                    <ReadOnlyTextarea value={theme.msg.intro} />
                  ) : (
                    <ValidatedTextarea
                      id="msg-intro"
                      value={theme.msg.intro}
                      onChange={v => updateMsg({ intro: v })}
                      placeholder="Invitation message"
                      disabled={theme.msg.mode === 'none'}
                      maxLen={200}
                    />
                  )}
                  <span style={{ display: 'block', marginTop: 4, font: '400 12px/16px ' + F, color: 'var(--lyra-color-fg-secondary)' }}>
                    Shown before the first question.
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: theme.msg.mode === 'optout' ? 'minmax(0, 400px) minmax(0, 400px)' : 'minmax(0, 400px)', gap: '16px' }}>
                  <div>
                    <FieldLabel label="Button to start label" htmlFor="msg-start" count={locked ? undefined : { length: theme.msg.startLabel.length, maxLen: 20 }} />
                    {locked ? (
                      <ReadOnlyField value={theme.msg.startLabel} />
                    ) : (
                      <ValidatedInput
                        id="msg-start"
                        value={theme.msg.startLabel}
                        onChange={v => updateMsg({ startLabel: v })}
                        placeholder="Get Started"
                        disabled={theme.msg.mode === 'none'}
                        maxLen={20}
                        restrictChars
                        error={errors.startLabel}
                      />
                    )}
                  </div>

                  {theme.msg.mode === 'optout' && (
                    <div>
                      <FieldLabel label="Button to refuse label" htmlFor="msg-opt" count={locked ? undefined : { length: theme.msg.optLabel.length, maxLen: 20 }} />
                      {locked ? (
                        <ReadOnlyField value={theme.msg.optLabel} />
                      ) : (
                        <ValidatedInput
                          id="msg-opt"
                          value={theme.msg.optLabel}
                          onChange={v => updateMsg({ optLabel: v })}
                          placeholder="Not Today"
                          maxLen={20}
                          restrictChars
                          error={errors.optLabel}
                        />
                      )}
                    </div>
                  )}
                </div>

                <div style={{ maxWidth: 804 }}>
                  <FieldLabel label="Thank you message" htmlFor="msg-thanks" count={locked ? undefined : { length: theme.msg.thanks.length, maxLen: 200 }} />
                  {locked ? (
                    <ReadOnlyTextarea value={theme.msg.thanks} />
                  ) : (
                    <ValidatedTextarea
                      id="msg-thanks"
                      value={theme.msg.thanks}
                      onChange={v => updateMsg({ thanks: v })}
                      placeholder="Thank you for your feedback."
                      maxLen={200}
                    />
                  )}
                  <span style={{ display: 'block', marginTop: 4, font: '400 12px/16px ' + F, color: 'var(--lyra-color-fg-secondary)' }}>
                    Shown after the last answer.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right column (Summary + Preview) ── */}
          <div style={{ width: 327, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* Summary */}
            {!isCreate && (
            <div style={{
              width: 327, boxSizing: 'border-box',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--lyra-color-bg-surface-container-subtle, var(--lyra-color-bg-surface-canvas))',
              padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 16,
            }}>
              <span style={{ font: '500 16px/20px ' + F, color: 'var(--lyra-color-fg-default)' }}>Summary</span>
              <div style={{ alignSelf: 'stretch', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ font: '400 14px/20px ' + F, color: 'var(--lyra-color-fg-secondary)' }}>Linked programs</span>
                {(theme.linkedPrograms?.length ?? 0) > 0 ? (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={() => setLinkedProgramsOpen(true)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setLinkedProgramsOpen(true) }}
                    style={{
                      font: '500 14px/20px ' + F, color: 'var(--lyra-color-fg-default)',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                    }}
                  >
                    {String(theme.linkedPrograms?.length ?? 0).padStart(2, '0')}
                    <ChevronDown size={12} style={{ color: 'var(--lyra-color-fg-action)' }} />
                  </span>
                ) : (
                  <span style={{ font: '500 14px/20px ' + F, color: 'var(--lyra-color-fg-default)' }}>-</span>
                )}
              </div>
              {!theme.sys && (
                <>
                  <div style={{ alignSelf: 'stretch', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ font: '400 14px/20px ' + F, color: 'var(--lyra-color-fg-secondary)' }}>Updated on</span>
                    <span style={{ font: '500 14px/20px ' + F, color: 'var(--lyra-color-fg-default)' }}>
                      {theme.updatedOn ?? '-'}
                    </span>
                  </div>
                  <div style={{ alignSelf: 'stretch', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ font: '400 14px/20px ' + F, color: 'var(--lyra-color-fg-secondary)' }}>Updated by</span>
                    <span style={{ font: '500 14px/20px ' + F, color: 'var(--lyra-color-fg-default)' }}>
                      {theme.updatedBy ?? '-'}
                    </span>
                  </div>
                </>
              )}
              <div style={{ alignSelf: 'stretch', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ font: '400 14px/20px ' + F, color: 'var(--lyra-color-fg-secondary)' }}>Type</span>
                {theme.sys ? (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8, height: 24, padding: '0 8px',
                    borderRadius: 'var(--radius-sm)', background: 'var(--lyra-color-status-info-subtle)',
                    font: '400 14px/20px ' + F, color: 'var(--lyra-color-status-info-strong)',
                  }}>
                    <Lock size={12} />
                    System Default
                  </span>
                ) : (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4, font: '500 14px/20px ' + F,
                    color: 'var(--lyra-color-status-success-strong)',
                  }}>
                    Custom
                  </span>
                )}
              </div>
            </div>
            )}

            {/* Chat Preview */}
            <ChatPreview theme={theme} activeQType={activeQType} />
          </div>

        </div>
      </div>

      {/* ─── LINKED PROGRAMS MODAL ─── */}
      {linkedProgramsOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.24)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setLinkedProgramsOpen(false) }}
        >
          <div style={{
            background: 'var(--lyra-color-bg-surface-overlay)',
            borderRadius: 'var(--radius-xl)', boxShadow: 'var(--sol-effect-shadowlg)',
            width: '100%', maxWidth: 440, padding: 'var(--space-6)',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
              <h2 style={{ margin: 0, font: '600 16px/20px ' + F, color: 'var(--lyra-color-fg-default)' }}>
                Linked programs - {String(theme.linkedPrograms?.length ?? 0).padStart(2, '0')}
              </h2>
              <button
                onClick={() => setLinkedProgramsOpen(false)}
                aria-label="Close"
                style={{
                  width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--lyra-color-fg-secondary)',
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {(theme.linkedPrograms ?? []).map((programName, idx) => (
                <div
                  key={programName + idx}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 0',
                    borderBottom: idx < (theme.linkedPrograms?.length ?? 0) - 1 ? '1px solid var(--lyra-color-border-subtle)' : 'none',
                  }}
                >
                  <span style={{ font: '400 14px/20px ' + F, color: 'var(--lyra-color-fg-default)' }}>
                    {programName}
                  </span>
                  <span style={{ font: '500 14px/20px ' + F, color: 'var(--lyra-color-fg-link)', cursor: 'pointer' }}>
                    View
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-6)' }}>
              <button
                onClick={() => setLinkedProgramsOpen(false)}
                style={{
                  height: 36, padding: '0 var(--space-4)', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--lyra-color-border-soft)',
                  background: 'var(--lyra-color-bg-surface-base)',
                  font: '500 14px/20px ' + F, color: 'var(--lyra-color-fg-default)',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-bg-surface-base)' }}
              >
                Close
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
