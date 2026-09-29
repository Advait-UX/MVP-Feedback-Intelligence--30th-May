import { useState, useEffect, useRef, useMemo } from 'react'
import { Check, ChevronDown, Plus, Info, X, Search, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react'
import type { Alert } from './AlertsListPage'

const FONT = 'var(--font-sans)'

const EXISTING_ALERT_NAMES = [
  'billing context',
  'home service feedback survey',
  'tech support satisfaction survey',
  'product quality feedback survey',
  'fitness program satisfaction survey',
]

/* ─── Error message ─── */
function ErrMsg({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
      <svg viewBox="0 0 12 12" width="12" height="12" fill="none" style={{ flexShrink: 0 }}>
        <circle cx="6" cy="6" r="5.25" stroke="var(--lyra-color-status-critical-strong)" strokeWidth="1.5" />
        <line x1="6" y1="4" x2="6" y2="6.5" stroke="var(--lyra-color-status-critical-strong)" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="6" cy="8.5" r="0.6" fill="var(--lyra-color-status-critical-strong)" />
      </svg>
      <p style={{ margin: 0, font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-status-critical-strong)' }}>{text}</p>
    </div>
  )
}

/* ─── Warning message (duplicate name) ─── */
function WarnMsg({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4, marginTop: 4 }}>
      <svg viewBox="0 0 12 12" width="12" height="12" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
        <path d="M6 1.5L10.75 10H1.25L6 1.5Z" stroke="var(--lyra-color-status-warning-strong)" strokeWidth="1.3" strokeLinejoin="round" fill="var(--lyra-color-status-warning-subtle)" />
        <line x1="6" y1="5.2" x2="6" y2="7.5" stroke="var(--lyra-color-status-warning-strong)" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="6" cy="9" r="0.55" fill="var(--lyra-color-status-warning-strong)" />
      </svg>
      <p style={{ margin: 0, font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-status-warning-strong)' }}>{text}</p>
    </div>
  )
}

/* ─── Recipients modal data ─── */
const MODAL_PAGE_SIZE = 50
const FIRST_NAMES = ['Emily', 'Michael', 'Jessica', 'David', 'Sarah', 'James', 'Linda', 'Robert', 'Maria', 'John', 'Lisa', 'Daniel', 'Ashley', 'Christopher', 'Amanda', 'Karen', 'Mark', 'Patricia', 'Richard', 'Barbara']
const LAST_NAMES = ['Johnson', 'Smith', 'Brown', 'Wilson', 'Davis', 'Miller', 'Taylor', 'Anderson', 'Cohen', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Rodriguez']
const ALL_USERS: { id: string; name: string; email: string }[] = (() => {
  const arr: { id: string; name: string; email: string }[] = []
  let i = 0
  outer: for (const last of LAST_NAMES) {
    for (const first of FIRST_NAMES) {
      arr.push({ id: `u${i + 1}`, name: `${first} ${last}`, email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com` })
      i++
      if (i >= 150) break outer
    }
  }
  return arr
})()

/* ─── Pagination button (modal) ─── */
function PagBtn({ children, onClick, disabled, label }: { children: React.ReactNode; onClick: () => void; disabled: boolean; label: string }) {
  return (
    <button
      onClick={onClick} disabled={disabled} aria-label={label}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 28, height: 28, borderRadius: 'var(--radius-xs)',
        border: '1px solid var(--lyra-color-border-soft)',
        background: 'var(--lyra-color-bg-surface-base)',
        color: disabled ? 'var(--lyra-color-fg-disabled)' : 'var(--lyra-color-fg-default)',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-bg-surface-base)' }}
    >{children}</button>
  )
}

/* ─── Add recipients modal ─── */
function AddRecipientsModal({ selected, onConfirm, onClose }: { selected: string[]; onConfirm: (ids: string[]) => void; onClose: () => void }) {
  const MAX_RECIPIENTS = 5
  const [leftSearch, setLeftSearch] = useState('')
  const [rightSearch, setRightSearch] = useState('')
  const [localSelected, setLocalSelected] = useState<string[]>(selected)
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const q = leftSearch.toLowerCase()
    return q ? ALL_USERS.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) : ALL_USERS
  }, [leftSearch])

  const totalPages = Math.max(1, Math.ceil(filtered.length / MODAL_PAGE_SIZE))
  const pageUsers = filtered.slice((page - 1) * MODAL_PAGE_SIZE, page * MODAL_PAGE_SIZE)

  const selectedUsers = useMemo(() => ALL_USERS.filter(u => localSelected.includes(u.id)), [localSelected])
  const filteredSelected = useMemo(() => {
    const q = rightSearch.toLowerCase()
    return q ? selectedUsers.filter(u => u.name.toLowerCase().includes(q)) : selectedUsers
  }, [selectedUsers, rightSearch])

  const toggle = (id: string) => {
    setLocalSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < MAX_RECIPIENTS ? [...prev, id] : prev)
  }

  const inputBase: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
    height: 32, padding: '0 var(--space-3)',
    background: 'var(--lyra-color-bg-field)',
    border: '1px solid var(--lyra-color-border-medium)',
    borderRadius: 'var(--radius-md)',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.24)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        background: 'var(--lyra-color-bg-surface-overlay)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--lyra-color-border-soft)',
        boxShadow: 'var(--sol-effect-shadowxl)',
        display: 'flex', flexDirection: 'column',
        width: 720, maxHeight: '80vh',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--lyra-color-border-subtle)',
        }}>
          <span style={{ font: '500 16px/20px var(--font-sans)', letterSpacing: '-0.01em', color: 'var(--lyra-color-fg-default)' }}>
            Add recipients
          </span>
          <button onClick={onClose} style={{ width: 28, height: 28, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-xs)', color: 'var(--lyra-color-fg-secondary)' }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left — all users */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--lyra-color-border-subtle)', overflow: 'hidden' }}>
            <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--lyra-color-border-subtle)' }}>
              <div style={inputBase}>
                <Search size={14} style={{ color: 'var(--lyra-color-fg-secondary)', flexShrink: 0 }} />
                <input
                  type="text" placeholder="Search by name or email" value={leftSearch}
                  onChange={e => { setLeftSearch(e.target.value); setPage(1) }}
                  style={{ flex: 1, border: 'none', background: 'none', outline: 'none', font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}
                />
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {pageUsers.map(user => {
                const isSelected = localSelected.includes(user.id)
                const atMax = localSelected.length >= MAX_RECIPIENTS && !isSelected
                return (
                  <div
                    key={user.id}
                    onClick={() => !atMax && toggle(user.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                      padding: '10px var(--space-4)', cursor: atMax ? 'not-allowed' : 'pointer',
                      background: isSelected ? 'var(--lyra-color-bg-active-subtle)' : 'transparent',
                      opacity: atMax ? 0.5 : 1,
                    }}
                    onMouseEnter={e => { if (!atMax && !isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
                    onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    <div style={{
                      width: 16, height: 16, border: `1.5px solid ${isSelected ? 'var(--lyra-color-bg-primary)' : 'var(--lyra-color-border-medium)'}`,
                      borderRadius: 'var(--radius-xs)', background: isSelected ? 'var(--lyra-color-bg-primary)' : 'transparent',
                      flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {isSelected && <Check size={10} style={{ color: 'var(--lyra-color-fg-inverse)' }} strokeWidth={3} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
                      <div style={{ font: '400 12px/16px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', letterSpacing: '0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
                    </div>
                  </div>
                )
              })}
            </div>
            {/* Pagination */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px var(--space-4)', borderTop: '1px solid var(--lyra-color-border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <PagBtn onClick={() => setPage(1)} disabled={page === 1} label="First"><ChevronsLeft size={12} /></PagBtn>
                <PagBtn onClick={() => setPage(p => p - 1)} disabled={page === 1} label="Previous"><ChevronLeft size={12} /></PagBtn>
                <span style={{ font: '400 12px/16px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', letterSpacing: '0.01em', padding: '0 var(--space-1)' }}>
                  {page} / {totalPages}
                </span>
                <PagBtn onClick={() => setPage(p => p + 1)} disabled={page === totalPages} label="Next"><ChevronRight size={12} /></PagBtn>
                <PagBtn onClick={() => setPage(totalPages)} disabled={page === totalPages} label="Last"><ChevronsRight size={12} /></PagBtn>
              </div>
              <span style={{ font: '400 12px/16px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', letterSpacing: '0.01em' }}>
                {filtered.length} users
              </span>
            </div>
          </div>

          {/* Right — selected */}
          <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--lyra-color-border-subtle)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>
                  Selected ({localSelected.length}/{MAX_RECIPIENTS})
                </span>
              </div>
              <div style={inputBase}>
                <Search size={14} style={{ color: 'var(--lyra-color-fg-secondary)', flexShrink: 0 }} />
                <input
                  type="text" placeholder="Search selected" value={rightSearch}
                  onChange={e => setRightSearch(e.target.value)}
                  style={{ flex: 1, border: 'none', background: 'none', outline: 'none', font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}
                />
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filteredSelected.map(user => (
                <div key={user.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px var(--space-4)', gap: 'var(--space-2)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
                    <div style={{ font: '400 12px/16px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', letterSpacing: '0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
                  </div>
                  <button
                    onClick={() => toggle(user.id)}
                    style={{ width: 24, height: 24, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-xs)', color: 'var(--lyra-color-fg-secondary)', flexShrink: 0 }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--space-2)',
          padding: 'var(--space-3) var(--space-4)', borderTop: '1px solid var(--lyra-color-border-subtle)',
        }}>
          <button
            onClick={onClose}
            style={{ height: 36, padding: '0 var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--lyra-color-border-soft)', background: 'var(--lyra-color-bg-surface-base)', font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', cursor: 'pointer' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-bg-surface-base)' }}
          >Cancel</button>
          <button
            onClick={() => onConfirm(localSelected)}
            style={{ height: 36, padding: '0 var(--space-4)', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--lyra-color-bg-primary)', font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-on-primary)', cursor: 'pointer' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-primary)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-bg-primary)' }}
          >Add</button>
        </div>
      </div>
    </div>
  )
}

/* ─── Toggle switch ─── */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      style={{
        width: 40, height: 24, borderRadius: 'var(--radius-full)', border: 'none',
        background: checked ? 'var(--lyra-color-bg-active-strong)' : 'var(--lyra-color-border-medium)',
        cursor: 'pointer', display: 'flex', alignItems: 'center',
        justifyContent: checked ? 'flex-end' : 'flex-start',
        padding: 3, flexShrink: 0, transition: 'background 0.15s',
      }}
    >
      <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--lyra-color-fg-inverse)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {checked && <Check size={12} style={{ color: 'var(--lyra-color-bg-active-strong)' }} strokeWidth={3} />}
      </span>
    </button>
  )
}

/* ─── Inline select chip ─── */
function DropdownList({ options, value, onSelect, prefix }: { options: string[]; value: string; onSelect: (v: string) => void; prefix?: string }) {
  return (
    <div style={{
      position: 'absolute', top: 'calc(100% + 4px)', left: 0,
      background: 'var(--lyra-color-bg-surface-overlay)', border: '1px solid var(--lyra-color-border-soft)',
      borderRadius: 'var(--radius-md)', boxShadow: 'var(--sol-effect-shadowlg)',
      zIndex: 999, minWidth: 160, padding: 'var(--space-1)',
    }}>
      {options.map(opt => (
        <button key={opt} onClick={() => onSelect(opt)} style={{
          display: 'block', width: '100%', textAlign: 'left', padding: '6px var(--space-3)', background: 'none', border: 'none',
          font: `${opt === value ? 500 : 400} 14px/20px var(--font-sans)`, cursor: 'pointer',
          color: opt === value ? 'var(--lyra-color-fg-active-strong)' : 'var(--lyra-color-fg-default)',
          borderRadius: 'var(--radius-sm)',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
        >
          {prefix ? `${prefix} ${opt}` : opt}
        </button>
      ))}
    </div>
  )
}

function QueryChip({
  label, value, options, onChange, prefix, status = 'active',
  operatorValue, operatorOptions, onOperatorChange,
}: {
  label?: string; value: string; options: string[]; onChange: (v: string) => void;
  prefix?: string; status?: 'active' | 'inactive';
  operatorValue?: string; operatorOptions?: string[]; onOperatorChange?: (v: string) => void
}) {
  const [openValue, setOpenValue] = useState(false)
  const [openOperator, setOpenOperator] = useState(false)
  const isActive = status === 'active'
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!openValue && !openOperator) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenValue(false); setOpenOperator(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [openValue, openOperator])

  const chipStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', height: 32,
    borderRadius: 'var(--radius-md)', overflow: 'hidden',
    border: `1px solid ${isActive ? 'var(--lyra-color-border-active)' : 'var(--lyra-color-border-soft)'}`,
    background: isActive ? 'var(--lyra-color-bg-active-subtle)' : 'rgba(0, 0, 0, 0.02)',
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-flex' }}>
      <div style={chipStyle}>
        {label && isActive && (
          <div style={{ paddingLeft: 8, paddingRight: 4, display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
            <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-active-strong)' }}>{label}</span>
            <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-active-strong)' }}>:</span>
          </div>
        )}
        {operatorValue !== undefined && isActive && (
          <button onClick={() => { setOpenOperator(v => !v); setOpenValue(false) }}
            style={{ height: 32, paddingLeft: 8, paddingRight: 8, display: 'flex', alignItems: 'center', gap: 4, border: 'none', background: 'none', cursor: 'pointer', flexShrink: 0 }}>
            <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-active-strong)' }}>{operatorValue}</span>
            <ChevronDown size={12} style={{ color: 'var(--lyra-color-fg-active-strong)', flexShrink: 0 }} />
          </button>
        )}
        <button onClick={() => { setOpenValue(v => !v); setOpenOperator(false) }}
          style={{ height: 32, paddingLeft: 8, paddingRight: 8, display: 'flex', alignItems: 'center', gap: 4, border: 'none', background: 'none', cursor: 'pointer', flexShrink: 0 }}>
          {isActive ? (
            <>
              <span style={{ paddingLeft: 4, paddingRight: 4, background: 'var(--lyra-color-state-bg-pressed-active-subtle)', borderRadius: 4, font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-active-strong)' }}>
                {prefix ? `${prefix} ${value}` : value}
              </span>
              <ChevronDown size={12} style={{ color: 'var(--lyra-color-fg-active-strong)', flexShrink: 0 }} />
            </>
          ) : (
            <>
              <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>{prefix ? `${prefix} ${value}` : value}</span>
              <ChevronDown size={12} style={{ color: 'var(--lyra-color-fg-default)', flexShrink: 0 }} />
            </>
          )}
        </button>
      </div>
      {openOperator && operatorOptions && (
        <DropdownList options={operatorOptions} value={operatorValue ?? ''} onSelect={v => { onOperatorChange?.(v); setOpenOperator(false) }} />
      )}
      {openValue && (
        <DropdownList options={options} value={value} onSelect={v => { onChange(v); setOpenValue(false) }} prefix={prefix} />
      )}
    </div>
  )
}

/* ─── Section panel ─── */
function Panel({ title, infoText, children }: { title: string; infoText?: string; children: React.ReactNode }) {
  const [showInfo, setShowInfo] = useState(false)
  return (
    <div style={{ background: 'var(--lyra-color-bg-surface-base)', border: '1px solid var(--lyra-color-border-subtle)', borderRadius: 'var(--radius-lg)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-4)' }}>
        <span style={{ font: '500 16px/20px var(--font-sans)', letterSpacing: '-0.01em', color: 'var(--lyra-color-fg-default)' }}>{title}</span>
        {infoText && (
          <div style={{ position: 'relative', display: 'inline-flex' }}>
            <Info size={16} style={{ color: 'var(--lyra-color-fg-action)', cursor: 'pointer' }} onClick={() => setShowInfo(v => !v)} />
            {showInfo && (
              <div style={{ position: 'absolute', left: 'calc(100% + 8px)', top: '50%', transform: 'translateY(-50%)', background: 'var(--lyra-color-bg-surface-base)', border: '1px solid var(--lyra-color-border-soft)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--sol-effect-shadowmd)', padding: '10px 12px', width: 280, zIndex: 999, font: '400 13px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)' }}>
                {infoText}
              </div>
            )}
          </div>
        )}
      </div>
      <div style={{ padding: 'var(--space-4)' }}>{children}</div>
    </div>
  )
}

/* ─── Secondary button ─── */
function SecBtn({ label, icon, onClick, width = 228, disabled = false }: { label: string; icon?: React.ReactNode; onClick?: () => void; width?: number; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)',
      width, height: 32, padding: '0 var(--space-3)',
      border: '1px solid var(--lyra-color-border-soft)', borderRadius: 'var(--radius-md)',
      background: 'var(--lyra-color-bg-surface-base)', font: '500 14px/20px var(--font-sans)',
      color: disabled ? 'var(--lyra-color-fg-disabled)' : 'var(--lyra-color-fg-action)',
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1,
    }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-bg-surface-base)' }}
    >
      {icon}{label}
    </button>
  )
}

/* ─── Summary divider ─── */
function SummaryDivider() {
  return <div style={{ height: 1, background: 'var(--lyra-color-border-subtle)', margin: 'var(--space-2) 0' }} />
}

type Criterion = { scoreType: string; operator: string; value: string; outOf: string }

const INIT_CRITERIA: Criterion[] = [
  { scoreType: 'CSAT', operator: 'At or below', value: '02', outOf: '05' },
  { scoreType: 'ASAT', operator: 'At or below', value: '03', outOf: '05' },
]
const INIT_RECIPIENTS = ['u1', 'u2', 'u3']

/* ─── Edit Alert page ─── */
export function EditAlertPage({ alert, onCancel, onSave }: {
  alert: Alert
  onCancel: () => void
  onSave: (name: string) => void
}) {
  const [alertName, setAlertName] = useState(alert.name)
  const [nameCharError, setNameCharError] = useState(false)
  const [showNameError, setShowNameError] = useState(false)
  const [nameDuplicate, setNameDuplicate] = useState(false)
  const [criteria, setCriteria] = useState<Criterion[]>(INIT_CRITERIA)
  const [notifySupervisor, setNotifySupervisor] = useState(true)
  const [emailNotif, setEmailNotif] = useState(true)
  const [inAppNotif, setInAppNotif] = useState(true)
  const [showRecipientsModal, setShowRecipientsModal] = useState(false)
  const [additionalRecipients, setAdditionalRecipients] = useState<string[]>(INIT_RECIPIENTS)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showLinkedProgramsModal, setShowLinkedProgramsModal] = useState(false)

  const initSnapshot = useRef(
    JSON.stringify({ alertName: alert.name, criteria: INIT_CRITERIA, notifySupervisor: true, emailNotif: true, inAppNotif: true, additionalRecipients: INIT_RECIPIENTS })
  )
  const hasChanged = JSON.stringify({ alertName, criteria, notifySupervisor, emailNotif, inAppNotif, additionalRecipients }) !== initSnapshot.current

  const scoreTypeCounts = criteria.reduce((acc, c) => { acc[c.scoreType] = (acc[c.scoreType] || 0) + 1; return acc }, {} as Record<string, number>)
  const hasDuplicates = Object.values(scoreTypeCounts).some(n => n > 1)

  const updateCriterion = (idx: number, field: keyof Criterion, val: string) =>
    setCriteria(prev => prev.map((c, i) => i === idx ? { ...c, [field]: val } : c))
  const addCriterion = () =>
    setCriteria(prev => [...prev, { scoreType: 'ASAT', operator: 'At or below', value: '02', outOf: '05' }])
  const removeCriterion = (idx: number) =>
    setCriteria(prev => prev.filter((_, i) => i !== idx))

  const noNotifyMethod = !emailNotif && !inAppNotif
  const canSave = alertName.trim().length > 0 && !nameCharError && !nameDuplicate && !hasDuplicates
  const isNameLocked = alert.status === 'Active'

  const formatCriterionCondition = (c: Criterion) =>
    `is ${c.operator.toLowerCase()} ${parseInt(c.value)} out of ${parseInt(c.outOf)}`
  const summaryVia = [emailNotif && 'email', inAppNotif && 'in app'].filter(Boolean).join(' & ') || '—'
  const additionalRecipientNames = additionalRecipients.map(id => ALL_USERS.find(u => u.id === id)?.name).filter(Boolean) as string[]
  const summaryToList = [notifySupervisor ? "Agent's supervisor" : null, ...additionalRecipientNames].filter(Boolean) as string[]

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
        {/* Breadcrumb: Alerts / [alert name] */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span
            onClick={() => { hasChanged ? setShowCancelModal(true) : onCancel() }}
            style={{ font: '500 16px/20px var(--font-sans)', letterSpacing: '-0.01em', color: 'var(--lyra-color-fg-secondary)', fontFamily: FONT, cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--lyra-color-fg-default)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--lyra-color-fg-secondary)' }}
          >
            Alerts
          </span>
          <span style={{ font: '500 16px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', fontFamily: FONT }}>/</span>
          <span style={{ font: '600 20px/24px var(--font-sans)', letterSpacing: '-0.02em', color: 'var(--lyra-color-fg-default)', fontFamily: FONT }}>
            {alert.name}
          </span>
        </div>

        {/* Cancel + Save */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <button
            onClick={() => { hasChanged ? setShowCancelModal(true) : onCancel() }}
            style={{
              height: 36, padding: '0 var(--space-4)', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--lyra-color-border-soft)',
              background: 'var(--lyra-color-bg-surface-base)',
              font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)',
              cursor: 'pointer', fontFamily: FONT,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-bg-surface-base)' }}
          >
            Cancel
          </button>
          <button
            disabled={!hasChanged || !canSave}
            onClick={() => { if (hasChanged && canSave) onSave(alertName.trim()) }}
            style={{
              height: 36, padding: '0 var(--space-4)', borderRadius: 'var(--radius-md)',
              border: 'none',
              background: (hasChanged && canSave) ? 'var(--lyra-color-bg-primary)' : 'var(--lyra-color-bg-disabled)',
              font: '500 14px/20px var(--font-sans)',
              color: (hasChanged && canSave) ? 'var(--lyra-color-fg-on-primary)' : 'var(--lyra-color-fg-disabled)',
              cursor: (hasChanged && canSave) ? 'pointer' : 'not-allowed', fontFamily: FONT,
            }}
            onMouseEnter={e => { if (hasChanged && canSave) (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-primary)' }}
            onMouseLeave={e => { if (hasChanged && canSave) (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-bg-primary)' }}
          >
            Save
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-auto" style={{ padding: 'var(--space-7)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>

          {/* ── Left column ── */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

            {/* Alert name */}
            <div style={{ background: 'var(--lyra-color-bg-surface-base)', border: '1px solid var(--lyra-color-border-subtle)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 400 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                    <label style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', fontFamily: FONT }}>Alert name</label>
                    <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-status-critical-strong)', fontFamily: FONT }}>*</span>
                  </div>
                  <span style={{ font: '400 12px/16px var(--font-sans)', fontFamily: FONT, color: alertName.length > 45 ? 'var(--lyra-color-status-critical-strong)' : 'var(--lyra-color-fg-secondary)', letterSpacing: '0.2px' }}>
                    {alertName.length}/50
                  </span>
                </div>
                {(() => {
                  const hasErr = (showNameError && !alertName) || (!!alertName && nameCharError)
                  const hasDuplicate = !!alertName && !nameCharError && nameDuplicate
                  const isValid = !!alertName.trim() && !nameCharError && !nameDuplicate
                  const borderColor = hasErr ? 'var(--lyra-color-status-critical-strong)' : hasDuplicate ? 'var(--lyra-color-status-warning-medium)' : 'var(--lyra-color-border-soft)'
                  const bgColor = hasErr ? 'var(--lyra-color-status-critical-subtle)' : hasDuplicate ? 'var(--lyra-color-status-warning-subtle)' : 'var(--lyra-color-bg-field)'
                  return (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <input
                          type="text" maxLength={50} value={alertName} disabled={isNameLocked}
                          onChange={e => {
                            const raw = e.target.value.slice(0, 50)
                            setAlertName(raw)
                            const hasInvalid = /[/!+<>?#&,%]/.test(raw)
                            setNameCharError(hasInvalid)
                            if (!hasInvalid) {
                              const normalizedRaw = raw.trim().toLowerCase()
                              const isDuplicate = normalizedRaw !== alert.name.toLowerCase() && EXISTING_ALERT_NAMES.includes(normalizedRaw)
                              setNameDuplicate(isDuplicate)
                            } else {
                              setNameDuplicate(false)
                            }
                            if (raw.trim() && !hasInvalid) setShowNameError(false)
                          }}
                          placeholder="Eg: Detractor recovery - billing"
                          style={{
                            width: '100%', maxWidth: 400, height: 36,
                            paddingLeft: 'var(--space-3)', paddingRight: 'var(--space-3)',
                            border: `1px solid ${isNameLocked ? 'var(--lyra-color-border-disabled)' : borderColor}`, borderRadius: 'var(--radius-md)',
                            font: '400 14px/20px var(--font-sans)', fontFamily: FONT,
                            color: isNameLocked ? 'var(--lyra-color-fg-disabled)' : 'var(--lyra-color-fg-default)',
                            background: isNameLocked ? 'var(--lyra-color-bg-disabled)' : bgColor,
                            outline: 'none', boxSizing: 'border-box', boxShadow: 'none',
                            cursor: isNameLocked ? 'not-allowed' : 'text',
                          }}
                          onFocus={e => {
                            if (isNameLocked) return
                            if (hasErr) { e.currentTarget.style.borderColor = 'var(--lyra-color-status-critical-strong)'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(189,42,42,0.12)' }
                            else if (hasDuplicate) { e.currentTarget.style.borderColor = 'var(--lyra-color-status-warning-medium)'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(142,104,0,0.12)' }
                            else { e.currentTarget.style.borderColor = 'var(--lyra-color-border-active)'; e.currentTarget.style.boxShadow = 'var(--sol-effect-activering)' }
                          }}
                          onBlur={e => { e.currentTarget.style.borderColor = isNameLocked ? 'var(--lyra-color-border-disabled)' : borderColor; e.currentTarget.style.boxShadow = 'none' }}
                        />
                        {!isNameLocked && isValid && (
                          <svg viewBox="0 0 16 16" width="16" height="16" fill="none" style={{ flexShrink: 0 }}>
                            <circle cx="8" cy="8" r="8" fill="var(--lyra-color-status-success-strong)" />
                            <path d="M4.5 8L6.5 10.5L11.5 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      {isNameLocked && (
                        <p style={{ margin: 0, font: '400 12px/16px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', fontFamily: FONT, letterSpacing: '0.01em' }}>
                          The name of an active alert cannot be changed.
                        </p>
                      )}
                      {!isNameLocked && showNameError && !alertName && <ErrMsg text="Required" />}
                      {!isNameLocked && alertName && nameCharError && <ErrMsg text="Special characters like / ! + < > ? # & , % are not allowed" />}
                      {!isNameLocked && hasDuplicate && <WarnMsg text="An alert with this name already exists. Please enter a unique alert name." />}
                    </>
                  )
                })()}
              </div>
            </div>

            {/* When should a notification be sent? */}
            <Panel title="When should a notification be sent?" infoText="Define the score conditions that trigger a notification to be sent to the selected recipients.">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {criteria.map((c, idx) => {
                  const isDup = (scoreTypeCounts[c.scoreType] || 0) > 1
                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', fontFamily: FONT }}>If</span>
                        <QueryChip label="Score type" value={c.scoreType} options={['CSAT', 'ASAT']} onChange={v => updateCriterion(idx, 'scoreType', v)} />
                        <QueryChip
                          label="Is" operatorValue={c.operator}
                          operatorOptions={['At or below', 'Below', 'Equal to', 'At or above', 'Above']}
                          onOperatorChange={v => updateCriterion(idx, 'operator', v)}
                          value={c.value} options={['01', '02', '03', '04', '05']}
                          onChange={v => updateCriterion(idx, 'value', v)}
                        />
                        <div style={{ display: 'inline-flex', alignItems: 'center', height: 32, padding: '0 8px', gap: 4, border: '1px solid var(--lyra-color-border-soft)', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.02)', cursor: 'default' }}>
                          <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>Out of: {c.outOf}</span>
                          <ChevronDown size={12} style={{ color: 'var(--lyra-color-fg-default)', flexShrink: 0 }} />
                        </div>
                        <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', fontFamily: FONT }}>then send the notification</span>
                        {idx > 0 && (
                          <button onClick={() => removeCriterion(idx)} aria-label="Remove criterion" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--lyra-color-fg-secondary)', borderRadius: 'var(--radius-xs)', padding: 0, flexShrink: 0 }}
                            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--lyra-color-state-bg-hover-opacity)'; el.style.color = 'var(--lyra-color-fg-default)' }}
                            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'none'; el.style.color = 'var(--lyra-color-fg-secondary)' }}
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                      {isDup && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', paddingLeft: 20 }}>
                          <Info size={12} style={{ color: 'var(--lyra-color-status-critical-strong)', flexShrink: 0 }} />
                          <span style={{ font: '400 12px/16px var(--font-sans)', color: 'var(--lyra-color-status-critical-strong)', fontFamily: FONT, letterSpacing: '0.01em' }}>Duplicate score type. Each score type can only appear once.</span>
                        </div>
                      )}
                    </div>
                  )
                })}
                <SecBtn label="Add criteria for notification" icon={<Plus size={14} />} disabled={criteria.length >= 5} onClick={addCriterion} />
              </div>
            </Panel>

            {/* Who is notified? */}
            <Panel title="Who is notified?">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Toggle checked={notifySupervisor} onChange={setNotifySupervisor} />
                  <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', fontFamily: FONT }}>The agent's supervisor</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <SecBtn label="Also notify" icon={<Plus size={14} />} width={128} onClick={() => setShowRecipientsModal(true)} disabled={additionalRecipients.length >= 5} />
                  <span style={{ font: '400 12px/16px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', letterSpacing: '0.01em', fontFamily: FONT }}>Add additional recipients to receive notifications</span>
                </div>

                {additionalRecipients.length > 0 && (
                  <div style={{ alignSelf: 'stretch', borderRadius: 'var(--radius-lg)', border: '1px solid var(--lyra-color-border-subtle)', background: 'var(--lyra-color-bg-surface-base)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ height: 56, padding: '12px var(--space-4)', background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--lyra-color-border-subtle)', display: 'flex', alignItems: 'center' }}>
                      <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', fontFamily: FONT }}>
                        {additionalRecipients.length} additional recipient{additionalRecipients.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div style={{ display: 'flex', overflow: 'hidden' }}>
                      <div style={{ width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ height: 48, padding: '0 var(--space-4)', borderBottom: '1px solid var(--lyra-color-border-soft)', display: 'flex', alignItems: 'center' }}>
                          <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', fontFamily: FONT }}>Name</span>
                        </div>
                        {additionalRecipients.map(id => {
                          const user = ALL_USERS.find(u => u.id === id)
                          if (!user) return null
                          return <div key={id} style={{ height: 40, padding: '0 var(--space-4)', borderBottom: '1px solid var(--lyra-color-border-subtle)', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                            <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', fontFamily: FONT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</span>
                          </div>
                        })}
                      </div>
                      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ height: 48, padding: '0 var(--space-4)', borderBottom: '1px solid var(--lyra-color-border-soft)', display: 'flex', alignItems: 'center' }}>
                          <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', fontFamily: FONT }}>Email</span>
                        </div>
                        {additionalRecipients.map(id => {
                          const user = ALL_USERS.find(u => u.id === id)
                          if (!user) return null
                          return <div key={id} style={{ height: 40, padding: '0 var(--space-4)', borderBottom: '1px solid var(--lyra-color-border-subtle)', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                            <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', fontFamily: FONT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</span>
                          </div>
                        })}
                      </div>
                      <div style={{ width: 91, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ height: 48, padding: '0 var(--space-4)', borderBottom: '1px solid var(--lyra-color-border-soft)', display: 'flex', alignItems: 'center' }}>
                          <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', fontFamily: FONT }}>Remove</span>
                        </div>
                        {additionalRecipients.map(id => {
                          const user = ALL_USERS.find(u => u.id === id)
                          if (!user) return null
                          return <div key={id} style={{ height: 40, padding: '0 var(--space-4)', borderBottom: '1px solid var(--lyra-color-border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <button onClick={() => setAdditionalRecipients(prev => prev.filter(x => x !== id))} aria-label={`Remove ${user.name}`} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--lyra-color-fg-default)', borderRadius: 'var(--radius-xs)' }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
                            ><X size={16} /></button>
                          </div>
                        })}
                      </div>
                    </div>
                  </div>
                )}
                {!notifySupervisor && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)', width: '100%', padding: 'var(--space-3) var(--space-4)', background: 'var(--lyra-color-status-info-subtle)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Info size={16} style={{ color: 'var(--lyra-color-status-info-strong)' }} />
                    </div>
                    <span style={{ flex: 1, font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', fontFamily: FONT }}>
                      Add at least one additional recipient if the agent's supervisor is not selected.
                    </span>
                  </div>
                )}
              </div>
            </Panel>

            {/* How should recipients be notified? */}
            <Panel title="How should recipients be notified?">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Toggle checked={emailNotif} onChange={setEmailNotif} />
                  <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', fontFamily: FONT }}>Email notification</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Toggle checked={inAppNotif} onChange={setInAppNotif} />
                  <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', fontFamily: FONT }}>In-app notification</span>
                </div>
                {noNotifyMethod && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-4)', background: 'var(--lyra-color-status-info-subtle)', border: '1px solid var(--lyra-color-status-info-medium)', borderRadius: 'var(--radius-md)' }}>
                    <Info size={16} style={{ color: 'var(--lyra-color-status-info-strong)', flexShrink: 0, marginTop: 2 }} />
                    <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-status-info-strong)', fontFamily: FONT }}>
                      At least one notification method must be enabled. Enable email, in-app, or both to save this alert.
                    </span>
                  </div>
                )}
              </div>
            </Panel>
          </div>

          {/* ── Right column — Summary ── */}
          <div style={{ width: 296, flexShrink: 0 }}>
            <div style={{ background: 'var(--lyra-color-bg-surface-canvas)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <span style={{ font: '500 16px/20px var(--font-sans)', letterSpacing: '-0.01em', color: 'var(--lyra-color-fg-default)', fontFamily: FONT }}>Summary</span>

              {/* Notify when */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', fontFamily: FONT }}>Notify when</span>
                {(() => {
                  const visibleCriteria = criteria.slice(0, 2)
                  const hiddenCriteria = criteria.slice(2)
                  return (
                    <>
                      {visibleCriteria.map((c, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
                          <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', fontFamily: FONT, flexShrink: 0 }}>{c.scoreType} score:</span>
                          <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', fontFamily: FONT, textAlign: 'right' }}>{formatCriterionCondition(c)}</span>
                        </div>
                      ))}
                      {hiddenCriteria.length > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-link)', fontFamily: FONT, cursor: 'pointer', textDecoration: 'underline' }}>
                            +{hiddenCriteria.length} more
                          </span>
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>

              <SummaryDivider />

              {/* Notified via / to */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', fontFamily: FONT }}>Notified via:</span>
                  <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', fontFamily: FONT, textAlign: 'right', textTransform: 'capitalize' }}>{summaryVia}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
                  <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', fontFamily: FONT, flexShrink: 0 }}>Notified to:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                    {summaryToList.length > 0 ? (() => {
                      const visible = summaryToList.slice(0, 2)
                      const hidden = summaryToList.slice(2)
                      return (
                        <>
                          {visible.map((name, i) => (
                            <span key={i} style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', fontFamily: FONT, textAlign: 'right' }}>{name}</span>
                          ))}
                          {hidden.length > 0 && (
                            <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-link)', fontFamily: FONT, cursor: 'pointer', textDecoration: 'underline' }}>
                              +{hidden.length} more
                            </span>
                          )}
                        </>
                      )
                    })() : <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', fontFamily: FONT }}>—</span>}
                  </div>
                </div>
              </div>

              <SummaryDivider />

              {/* Edit-mode-only fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {/* Linked programs */}
                {(alert.linkedPrograms?.length ?? 0) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', fontFamily: FONT }}>Linked programs</span>
                    <button
                      onClick={() => setShowLinkedProgramsModal(true)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-link)', textDecoration: 'underline', fontFamily: FONT }}
                    >
                      {String(alert.linkedPrograms!.length).padStart(2, '0')}
                      <ChevronDown size={12} style={{ color: 'var(--lyra-color-fg-link)' }} />
                    </button>
                  </div>
                )}

                {/* Updated on */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
                  <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', fontFamily: FONT, flexShrink: 0 }}>Updated on</span>
                  <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', fontFamily: FONT, textAlign: 'right' }}>{alert.updatedOn}</span>
                </div>

                {/* Updated by */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', fontFamily: FONT }}>Updated by</span>
                  <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', fontFamily: FONT }}>{alert.updatedBy}</span>
                </div>

                {/* Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', fontFamily: FONT }}>Status</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: '500 14px/20px var(--font-sans)', color: alert.status === 'Active' ? 'var(--lyra-color-status-success-strong)' : 'var(--lyra-slate-600)', fontFamily: FONT }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: alert.status === 'Active' ? 'var(--lyra-color-status-success-strong)' : 'var(--lyra-slate-400)', flexShrink: 0 }} />
                    {alert.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {showRecipientsModal && (
        <AddRecipientsModal
          selected={additionalRecipients}
          onConfirm={ids => { setAdditionalRecipients(ids); setShowRecipientsModal(false) }}
          onClose={() => setShowRecipientsModal(false)}
        />
      )}

      {/* Linked programs modal */}
      {showLinkedProgramsModal && (alert.linkedPrograms?.length ?? 0) > 0 && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.24)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowLinkedProgramsModal(false)}
        >
          <div
            style={{ background: 'var(--lyra-color-bg-surface-overlay)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--sol-effect-shadowlg)', width: 480, maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-6)', borderBottom: '1px solid var(--lyra-color-border-subtle)' }}>
              <span style={{ font: '500 16px/20px var(--font-sans)', letterSpacing: '-0.01em', color: 'var(--lyra-color-fg-default)', fontFamily: FONT }}>
                Linked programs - {String(alert.linkedPrograms!.length).padStart(2, '0')}
              </span>
              <button
                onClick={() => setShowLinkedProgramsModal(false)}
                aria-label="Close"
                style={{ width: 28, height: 28, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-xs)', color: 'var(--lyra-color-fg-secondary)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Body — program list */}
            <div style={{ overflowY: 'auto', padding: '0 var(--space-6)' }}>
              {alert.linkedPrograms!.map((p, i) => (
                <div
                  key={p}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: 'var(--space-4) 0',
                    borderBottom: i < alert.linkedPrograms!.length - 1 ? '1px solid var(--lyra-color-border-subtle)' : 'none',
                  }}
                >
                  <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', fontFamily: FONT }}>{p}</span>
                  <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-link)', cursor: 'pointer', flexShrink: 0, fontFamily: FONT }}>View</span>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: 'var(--space-6)', borderTop: '1px solid var(--lyra-color-border-subtle)' }}>
              <button
                onClick={() => setShowLinkedProgramsModal(false)}
                style={{ height: 36, padding: '0 var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--lyra-color-border-soft)', background: 'var(--lyra-color-bg-surface-base)', font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', cursor: 'pointer', fontFamily: FONT }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-bg-surface-base)' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel confirmation modal */}
      {showCancelModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.24)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--lyra-color-bg-surface-overlay)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--sol-effect-shadowlg)', width: 400, padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <span style={{ font: '600 16px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', fontFamily: FONT }}>Discard changes?</span>
              <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', fontFamily: FONT }}>
                You have unsaved changes. If you leave now, your changes will be lost and the alert will not be updated.
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <button
                onClick={() => setShowCancelModal(false)}
                style={{ height: 36, padding: '0 var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--lyra-color-border-soft)', background: 'var(--lyra-color-bg-surface-base)', font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', cursor: 'pointer', fontFamily: FONT }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-bg-surface-base)' }}
              >Keep editing</button>
              <button
                onClick={onCancel}
                style={{ height: 36, padding: '0 var(--space-4)', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--lyra-color-bg-destructive)', font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-inverse)', cursor: 'pointer', fontFamily: FONT }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.9' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
              >Discard changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
