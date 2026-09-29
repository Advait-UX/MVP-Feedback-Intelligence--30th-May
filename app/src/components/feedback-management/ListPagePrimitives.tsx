import { useEffect, useRef, useState } from 'react'
import { Search, MoreHorizontal, Plus, Info, Power, PowerOff, ClipboardList } from 'lucide-react'

const FONT = 'var(--font-sans)'

/* ── Search input — icon-prefixed text field ── */
export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <div style={{ position: 'relative' }}>
      <Search
        style={{
          position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
          width: 14, height: 14, color: 'var(--lyra-color-fg-disabled)', pointerEvents: 'none',
        }}
      />
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={{
          height: 32, width: 240, paddingLeft: 32, paddingRight: 10,
          background: 'var(--lyra-color-bg-field)', border: '1px solid var(--lyra-color-border-soft)',
          borderRadius: 'var(--radius-md)', fontSize: 14, color: 'var(--lyra-color-fg-default)',
          fontFamily: FONT, outline: 'none',
        }}
        onFocus={e => {
          e.currentTarget.style.borderColor = 'var(--lyra-color-border-focus-default)'
          e.currentTarget.style.boxShadow = 'var(--sol-effect-activering)'
        }}
        onBlur={e => {
          e.currentTarget.style.borderColor = 'var(--lyra-color-border-soft)'
          e.currentTarget.style.boxShadow = ''
        }}
      />
    </div>
  )
}

/* ── Toggle filter pill (e.g. Live / Paused, Digital / IVR) ── */
export function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        height: 32, padding: '0 var(--space-4)',
        borderRadius: 'var(--radius-full)',
        border: active ? '1px solid var(--lyra-color-border-active)' : '1px solid var(--lyra-color-border-soft)',
        background: active ? 'var(--lyra-color-bg-active-subtle)' : 'var(--lyra-color-bg-surface-base)',
        color: active ? 'var(--lyra-color-fg-active-strong)' : 'var(--lyra-color-fg-default)',
        font: '500 14px/20px var(--font-sans)',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )
}

/* ── "{n} of {total}" count label ── */
export function CountLabel({ shown, total }: { shown: number; total: number }) {
  return (
    <span style={{ fontSize: 12, color: 'var(--lyra-color-fg-secondary)', fontFamily: FONT, whiteSpace: 'nowrap' }}>
      {shown} of {total}
    </span>
  )
}

/* ── Generic status pill: label + tone drives the color pairing ── */
export type PillTone = 'success' | 'warning' | 'neutral' | 'neutral-strong'

const TONE_CFG: Record<PillTone, { bg: string; color: string; border: string }> = {
  success: { bg: 'var(--lyra-color-status-success-subtle)', color: 'var(--lyra-color-status-success-strong)', border: 'var(--lyra-color-border-subtle)' },
  warning: { bg: 'var(--lyra-color-status-warning-subtle)', color: 'var(--lyra-color-status-warning-strong)', border: 'var(--lyra-color-border-subtle)' },
  neutral: { bg: 'var(--lyra-slate-100)', color: 'var(--lyra-slate-600)', border: 'var(--lyra-color-border-subtle)' },
  'neutral-strong': { bg: 'var(--lyra-slate-200)', color: 'var(--lyra-slate-500)', border: 'var(--lyra-color-border-subtle)' },
}

const STATUS_ICON: Record<string, React.ElementType> = {
  Active: Power,
  Inactive: PowerOff,
  Draft: ClipboardList,
  Live: Power,
  Paused: PowerOff,
  Ended: PowerOff,
}

export function StatusPill({ label, tone }: { label: string; tone: PillTone }) {
  const t = TONE_CFG[tone]
  const Icon = STATUS_ICON[label]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      borderRadius: 'var(--radius-full)', padding: '3px 10px 3px 8px',
      fontSize: 12, fontWeight: 500, lineHeight: '16px', letterSpacing: '0.01em',
      background: 'transparent', color: t.color,
      fontFamily: FONT, whiteSpace: 'nowrap',
    }}>
      {Icon && <Icon size={13} strokeWidth={2} style={{ flexShrink: 0 }} />}
      {label}
    </span>
  )
}

/* ── Row kebab menu — status-aware action popover ── */
export function RowKebabMenu({ status = 'active', onDelete, onEdit }: { status?: 'active' | 'inactive' | 'draft'; onDelete?: () => void; onEdit?: () => void }) {
  const [open, setOpen] = useState(false)
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  function handleOpen(e: React.MouseEvent) {
    e.stopPropagation()
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setMenuPos({
        top: rect.top + rect.height / 2,
        right: window.innerWidth - rect.left + 4,
      })
    }
    setOpen(v => !v)
  }

  function MenuItem({ label, variant = 'default', onClick }: { label: string; variant?: 'default' | 'danger' | 'disabled'; onClick?: () => void }) {
    const color =
      variant === 'danger' ? 'var(--lyra-color-status-critical-strong)' :
      variant === 'disabled' ? 'var(--lyra-color-fg-disabled)' :
      'var(--lyra-color-fg-default)'
    return (
      <button
        onClick={variant === 'disabled' ? undefined : () => { onClick?.(); setOpen(false) }}
        disabled={variant === 'disabled'}
        style={{
          width: '100%', textAlign: 'left', background: 'none', border: 'none',
          padding: '0 var(--space-3)', height: 36, borderRadius: 'var(--radius-sm)',
          cursor: variant === 'disabled' ? 'default' : 'pointer',
          font: '400 14px/20px var(--font-sans)', color, display: 'flex', alignItems: 'center',
        }}
        onMouseEnter={e => { if (variant !== 'disabled') (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
      >
        {label}
      </button>
    )
  }

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        ref={btnRef}
        onClick={handleOpen}
        aria-label="Row actions"
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 28, height: 28, borderRadius: 'var(--radius-sm)', border: 'none',
          background: 'transparent', color: 'var(--lyra-color-fg-secondary)', cursor: 'pointer',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
      >
        <MoreHorizontal size={16} />
      </button>

      {open && menuPos && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'fixed',
            right: menuPos.right,
            top: menuPos.top,
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            zIndex: 9999,
          }}
        >
          {/* Action card */}
          <div style={{
            padding: 'var(--space-2)',
            background: 'var(--lyra-color-bg-surface-overlay)',
            borderRadius: 'var(--radius-lg)',
            outline: '1px solid var(--lyra-color-border-soft)',
            boxShadow: 'var(--sol-effect-shadowlg)',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            minWidth: 160,
            position: 'relative',
          }}>
            {/* Items above divider */}
            {status === 'active' && (
              <>
                <MenuItem label="Edit" onClick={onEdit} />
                <MenuItem label="Duplicate" />
              </>
            )}
            {status === 'inactive' && (
              <>
                <MenuItem label="Edit" onClick={onEdit} />
                <MenuItem label="Duplicate" />
                <MenuItem label="Activate" />
              </>
            )}
            {status === 'draft' && (
              <>
                <MenuItem label="Edit" onClick={onEdit} />
                <MenuItem label="Activate" />
              </>
            )}

            {/* Divider */}
            <div style={{ height: 1, background: 'var(--lyra-color-border-subtle)', margin: 'var(--space-1) 0' }} />

            {/* Delete */}
            <MenuItem label="Delete" variant="danger" onClick={onDelete} />

            {/* Right-pointing arrow */}
            <div style={{
              position: 'absolute',
              right: -8,
              top: '50%',
              transform: 'translateY(-50%) rotate(45deg)',
              width: 14,
              height: 14,
              background: 'var(--lyra-color-bg-surface-overlay)',
              borderRight: '1px solid var(--lyra-color-border-soft)',
              borderTop: '1px solid var(--lyra-color-border-soft)',
            }} />
          </div>
        </div>
      )}
    </div>
  )
}

/* ── List page header — Lyra Page Header: single row, min-height 72px, padding 16px 32px ── */
export function ListPageHeader({
  title,
  breadcrumb: _breadcrumb,
  actionLabel,
  onAction,
  description: _description,
  secondaryActionLabel,
  onSecondaryAction,
  showInfoIcon: _showInfoIcon,
  tooltipText,
}: {
  title: string
  breadcrumb?: string
  actionLabel: string
  onAction?: () => void
  description?: string
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
  showInfoIcon?: boolean
  tooltipText?: string
}) {
  const [showTooltip, setShowTooltip] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function openTooltip() {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    setShowTooltip(true)
  }
  function closeTooltip() {
    hideTimer.current = setTimeout(() => setShowTooltip(false), 80)
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', rowGap: 'var(--space-4)',
      flexShrink: 0, minHeight: 72,
      padding: 'var(--space-4) var(--space-7)',
      background: 'var(--lyra-color-bg-surface-base)',
      borderBottom: '1px solid var(--lyra-color-border-subtle)',
    }}>
      {/* Left: title + info icon */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <h1 style={{
          margin: 0,
          font: '600 20px/24px var(--font-sans)',
          letterSpacing: '-0.01em',
          color: 'var(--lyra-color-fg-default)',
        }}>
          {title}
        </h1>
        {/* Info icon + tooltip wrapper */}
        <div
          ref={tooltipRef}
          style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
          onMouseEnter={openTooltip}
          onMouseLeave={closeTooltip}
        >
          <Info
            size={16}
            style={{ color: 'var(--lyra-color-fg-action)', flexShrink: 0, cursor: 'pointer' }}
            aria-label={`${title} info`}
            onClick={() => setShowTooltip(v => !v)}
          />
          {showTooltip && tooltipText && (
            <div
              onMouseEnter={openTooltip}
              onMouseLeave={closeTooltip}
              style={{
                position: 'absolute',
                left: 'calc(100% + 10px)',
                top: '50%',
                transform: 'translateY(-8px)',
                display: 'flex',
                alignItems: 'flex-start',
                zIndex: 9999,
              }}>
              {/* Left-pointing arrow (border then fill) */}
              <div style={{
                width: 0, height: 0, flexShrink: 0,
                borderTop: '6px solid transparent',
                borderBottom: '6px solid transparent',
                borderRight: '7px solid var(--lyra-color-border-soft)',
                marginRight: -1,
              }} />
              <div style={{
                width: 0, height: 0, flexShrink: 0,
                borderTop: '5px solid transparent',
                borderBottom: '5px solid transparent',
                borderRight: '6px solid var(--lyra-color-bg-surface-base)',
                marginRight: -1,
                position: 'relative', zIndex: 1,
              }} />
              {/* Tooltip card */}
              <div style={{
                width: 248,
                padding: '12px 12px 8px 8px',
                background: 'var(--lyra-color-bg-surface-base)',
                borderRadius: 'var(--radius-md)',
                outline: '1px solid var(--lyra-color-border-soft)',
                boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.06)',
                fontSize: 14, lineHeight: '20px', fontWeight: 400,
                color: 'var(--lyra-color-fg-default)',
                fontFamily: FONT,
                whiteSpace: 'normal',
              }}>
                {tooltipText}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: action buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        {secondaryActionLabel && (
          <button
            onClick={onSecondaryAction}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)',
              height: 36, padding: '0 var(--space-4)', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--lyra-color-border-soft)',
              background: 'var(--lyra-color-bg-surface-base)',
              font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)',
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-bg-surface-base)' }}
          >
            {secondaryActionLabel}
          </button>
        )}
        <button
          onClick={onAction}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)',
            height: 36, padding: '0 var(--space-4)', borderRadius: 'var(--radius-md)',
            border: 'none', background: 'var(--lyra-color-bg-primary)',
            font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-on-primary)',
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-primary)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-bg-primary)' }}
        >
          <Plus size={16} style={{ flexShrink: 0 }} />
          {actionLabel}
        </button>
      </div>
    </div>
  )
}

/* ── Table shell — bordered card wrapper shared by all list tables ── */
/* ── Grid Panel — wrapper with border-radius, clips toolbar + table ── */
export function GridPanel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ borderRadius: 'var(--lyra-radius-lg, 12px)', overflow: 'hidden' }}>
      {children}
    </div>
  )
}

/* ── Grid Toolbar — count row above the table: h-56, control-subtle bg, border-b ── */
export function GridToolbar({ label, shown, total }: { label: string; shown: number; total: number }) {
  const count = shown === total ? total : shown
  return (
    <div style={{
      height: 44, display: 'flex', alignItems: 'center',
      padding: '0 var(--space-4)',
      background: 'var(--lyra-color-bg-surface-base)',
      borderBottom: '1px solid var(--lyra-color-border-subtle)',
    }}>
      <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', fontFamily: FONT }}>
        {count} {label}
      </span>
    </div>
  )
}

export function TableShell({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ overflowX: 'auto', ...style }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONT, fontSize: 14 }}>
        {children}
      </table>
    </div>
  )
}

export function Th({ children, align = 'left', width, style }: { children: React.ReactNode; align?: 'left' | 'right'; width?: number; style?: React.CSSProperties }) {
  return (
    <th style={{
      height: 48, padding: '0 var(--space-4)', textAlign: align,
      font: '500 14px/20px var(--font-sans)', fontFamily: FONT,
      color: 'var(--lyra-color-fg-default)', borderBottom: '1px solid var(--lyra-color-border-soft)',
      width, whiteSpace: 'nowrap',
      ...style,
    }}>
      {children}
    </th>
  )
}

export function Td({ children, align = 'left', style }: { children: React.ReactNode; align?: 'left' | 'right'; style?: React.CSSProperties }) {
  return (
    <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: align, color: 'var(--lyra-color-fg-default)', fontSize: 14, ...style }}>
      {children}
    </td>
  )
}

export function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} style={{ padding: 'var(--space-7) var(--space-4)', textAlign: 'center', color: 'var(--lyra-color-fg-secondary)', fontSize: 14 }}>
        {message}
      </td>
    </tr>
  )
}
