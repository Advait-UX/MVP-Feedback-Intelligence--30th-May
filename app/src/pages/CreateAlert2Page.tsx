import { useState, useMemo } from 'react'
import { Check, Plus, Info, X, Search, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react'
import { NotifiedToSummary, DescriptionField, SecBtn } from '@/components/feedback-management/AlertConditions'
import {
  ConditionsBuilder2, Conditions2Summary, hasBlockingIssues, defaultAlert2Conditions,
  type Alert2Conditions,
} from '@/components/feedback-management/Alert2Conditions'

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
  const [localSelected, setLocalSelected] = useState<string[]>(selected)
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const q = leftSearch.toLowerCase()
    return q ? ALL_USERS.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) : ALL_USERS
  }, [leftSearch])

  const totalPages = Math.max(1, Math.ceil(filtered.length / MODAL_PAGE_SIZE))
  const pageUsers = filtered.slice((page - 1) * MODAL_PAGE_SIZE, page * MODAL_PAGE_SIZE)

  const selectedUsers = useMemo(() => ALL_USERS.filter(u => localSelected.includes(u.id)), [localSelected])

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
        width: 'min(940px, 92vw)', maxHeight: '88vh', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ height: 72, flexShrink: 0, padding: '0 var(--space-6)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--lyra-color-border-subtle)' }}>
          <span style={{ font: '500 16px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>Add more recipients</span>
          <button
            onClick={onClose} aria-label="Close"
            style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'none', cursor: 'pointer', borderRadius: 'var(--radius-md)', color: 'var(--lyra-color-fg-action)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
          ><X size={16} /></button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Info banner */}
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-4)', background: 'var(--lyra-color-status-info-subtle)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Info size={16} style={{ color: 'var(--lyra-color-status-info-strong)' }} />
            </div>
            <span style={{ flex: 1, font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>
              Select upto max {MAX_RECIPIENTS} additional recipients
            </span>
          </div>

          {/* Two-panel row */}
          <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 'var(--space-6)', alignItems: 'stretch' }}>
            {/* Left panel */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', minWidth: 0, minHeight: 0 }}>
              <div style={{ ...inputBase, width: 280, flexShrink: 0 }}>
                <Search size={16} style={{ color: 'var(--lyra-color-fg-secondary)', flexShrink: 0 }} />
                <input
                  type="text" placeholder="Start typing to find recipients" value={leftSearch}
                  onChange={e => { setLeftSearch(e.target.value); setPage(1) }}
                  style={{ flex: 1, border: 'none', outline: 'none', background: 'none', font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}
                />
              </div>
              <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', border: '1px solid var(--lyra-color-border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--lyra-color-bg-surface-base)' }}>
                {/* Toolbar */}
                <div style={{ height: 48, flexShrink: 0, padding: '0 var(--space-4)', display: 'flex', alignItems: 'center', background: 'var(--lyra-color-bg-surface-shell)', borderBottom: '1px solid var(--lyra-color-border-subtle)' }}>
                  <span style={{ font: '500 13px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)' }}>
                    {filtered.length} users {' '}|{' '} {localSelected.length} selected
                  </span>
                </div>
                {/* Table */}
                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--lyra-color-border-subtle)', position: 'sticky', top: 0, background: 'var(--lyra-color-bg-surface-base)', zIndex: 1 }}>
                        <th style={{ width: 48, padding: '10px 16px' }} />
                        <th style={{ padding: '10px 16px', textAlign: 'left', font: '500 12px/16px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', textTransform: 'uppercase', letterSpacing: '0.01em' }}>Name</th>
                        <th style={{ padding: '10px 16px', textAlign: 'left', font: '500 12px/16px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', textTransform: 'uppercase', letterSpacing: '0.01em' }}>Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageUsers.map(u => {
                        const isSel = localSelected.includes(u.id)
                        const isMax = !isSel && localSelected.length >= MAX_RECIPIENTS
                        return (
                          <tr
                            key={u.id}
                            style={{ borderBottom: '1px solid var(--lyra-color-border-subtle)', background: isSel ? 'var(--lyra-color-bg-active-subtle)' : 'transparent', cursor: isMax ? 'not-allowed' : 'pointer' }}
                            onClick={() => !isMax && toggle(u.id)}
                            onMouseEnter={e => { if (!isSel && !isMax) (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isSel ? 'var(--lyra-color-bg-active-subtle)' : 'transparent' }}
                          >
                            <td style={{ width: 48, padding: '0 16px', textAlign: 'center' }}>
                              <div style={{ width: 16, height: 16, borderRadius: 4, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isSel ? 'var(--lyra-color-bg-active-strong)' : 'var(--lyra-color-bg-surface-base)', border: isSel ? 'none' : `1px solid ${isMax ? 'var(--lyra-color-border-subtle)' : 'var(--lyra-color-border-strong)'}`, flexShrink: 0 }}>
                                {isSel && <svg viewBox="0 0 12 12" width="10" height="10" fill="none"><path d="M2 6L5 9L10 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                              </div>
                            </td>
                            <td style={{ padding: '10px 16px', font: '400 14px/20px var(--font-sans)', color: isMax ? 'var(--lyra-color-fg-disabled)' : 'var(--lyra-color-fg-default)' }}>{u.name}</td>
                            <td style={{ padding: '10px 16px', font: '400 14px/20px var(--font-sans)', color: isMax ? 'var(--lyra-color-fg-disabled)' : 'var(--lyra-color-fg-secondary)' }}>{u.email}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                <div style={{ height: 48, padding: '0 var(--space-3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--lyra-color-border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <PagBtn onClick={() => setPage(1)} disabled={page === 1} label="First"><ChevronsLeft size={14} /></PagBtn>
                    <PagBtn onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} label="Previous"><ChevronLeft size={14} /></PagBtn>
                    <span style={{ font: '400 13px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      Page
                      <input type="number" min={1} max={totalPages} value={page}
                        onChange={e => { const v = parseInt(e.target.value); if (v >= 1 && v <= totalPages) setPage(v) }}
                        style={{ width: 36, height: 24, textAlign: 'center', border: '1px solid var(--lyra-color-border-soft)', borderRadius: 'var(--radius-xs)', font: '400 13px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', background: 'var(--lyra-color-bg-surface-base)', outline: 'none' }}
                      />
                      of {totalPages}
                    </span>
                    <PagBtn onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} label="Next"><ChevronRight size={14} /></PagBtn>
                    <PagBtn onClick={() => setPage(totalPages)} disabled={page === totalPages} label="Last"><ChevronsRight size={14} /></PagBtn>
                  </div>
                  <span style={{ font: '400 12px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)' }}>
                    {(page - 1) * MODAL_PAGE_SIZE + 1}–{Math.min(page * MODAL_PAGE_SIZE, filtered.length)} of {filtered.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Right panel — selected */}
            <div style={{ width: 300, flexShrink: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              {/* Spacer — aligns this panel's box top with the left panel's box top (below its search field) */}
              <div style={{ height: 32, marginBottom: 'var(--space-4)', flexShrink: 0 }} />
              <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', border: '1px solid var(--lyra-color-border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--lyra-color-bg-surface-base)' }}>
                <div style={{ height: 48, flexShrink: 0, padding: '0 var(--space-4)', display: 'flex', alignItems: 'center', background: 'var(--lyra-color-bg-surface-shell)', borderBottom: '1px solid var(--lyra-color-border-subtle)' }}>
                  <span style={{ font: '500 13px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)' }}>{localSelected.length} selected</span>
                </div>
                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {selectedUsers.length === 0 && (
                    <span style={{ font: '400 13px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)' }}>No recipients selected</span>
                  )}
                  {selectedUsers.map(u => (
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
                      <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</span>
                      <button
                        onClick={() => setLocalSelected(prev => prev.filter(x => x !== u.id))}
                        aria-label={`Remove ${u.name}`}
                        style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--lyra-color-fg-action)', borderRadius: 'var(--radius-xs)', flexShrink: 0 }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
                      ><X size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ height: 72, flexShrink: 0, padding: '0 var(--space-6)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--space-2)', borderTop: '1px solid var(--lyra-color-border-subtle)' }}>
          <button
            onClick={onClose}
            style={{ height: 36, padding: '0 var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--lyra-color-border-soft)', background: 'var(--lyra-color-bg-surface-base)', font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-action)', cursor: 'pointer', fontFamily: FONT }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-bg-surface-base)' }}
          >Cancel</button>
          <button
            onClick={() => onConfirm(localSelected)}
            style={{ height: 36, padding: '0 var(--space-4)', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--lyra-color-bg-primary)', font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-on-primary)', cursor: 'pointer', fontFamily: FONT }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-primary)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-bg-primary)' }}
          >Add</button>
        </div>
      </div>
    </div>
  )
}

/* ─── Toggle switch ─── */
function Toggle({ checked, onChange, disabled = false }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      disabled={disabled}
      aria-disabled={disabled}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: 40, height: 24, borderRadius: 'var(--radius-full)', border: 'none',
        background: checked ? 'var(--lyra-color-bg-active-strong)' : 'var(--lyra-color-border-medium)',
        cursor: 'pointer', display: 'flex', alignItems: 'center',
        justifyContent: checked ? 'flex-end' : 'flex-start',
        padding: 3, flexShrink: 0, transition: 'background 0.15s',
      }}
    >
      <span style={{
        width: 18, height: 18, borderRadius: '50%',
        background: 'var(--lyra-color-fg-inverse)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {checked && <Check size={12} style={{ color: 'var(--lyra-color-bg-active-strong)' }} strokeWidth={3} />}
      </span>
    </button>
  )
}

/* ─── Section panel ─── */
function Panel({ title, infoText, children }: { title: string; infoText?: string; children: React.ReactNode }) {
  const [showInfo, setShowInfo] = useState(false)
  return (
    <div style={{
      background: 'var(--lyra-color-bg-surface-base)',
      border: '1px solid var(--lyra-color-border-subtle)',
      borderRadius: 'var(--radius-lg)',
    }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
        padding: 'var(--space-3) var(--space-4)',
      }}>
        <span style={{ font: '500 16px/20px var(--font-sans)', letterSpacing: '-0.01em', color: 'var(--lyra-color-fg-default)' }}>
          {title}
        </span>
        {infoText && (
          <div style={{ position: 'relative', display: 'inline-flex' }}>
            <Info
              size={16}
              style={{ color: 'var(--lyra-color-fg-action)', cursor: 'pointer' }}
              onClick={() => setShowInfo(v => !v)}
            />
            {showInfo && (
              <div style={{
                position: 'absolute', left: 'calc(100% + 8px)', top: '50%', transform: 'translateY(-50%)',
                background: 'var(--lyra-color-bg-surface-base)',
                border: '1px solid var(--lyra-color-border-soft)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--sol-effect-shadowmd)',
                padding: '10px 12px', width: 280, zIndex: 999,
                font: '400 13px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)',
              }}>
                {infoText}
              </div>
            )}
          </div>
        )}
      </div>
      {/* Content */}
      <div style={{ padding: 'var(--space-4)' }}>
        {children}
      </div>
    </div>
  )
}

/* ─── Summary divider ─── */
function SummaryDivider() {
  return <div style={{ height: 1, background: 'var(--lyra-color-border-subtle)', margin: 'var(--space-2) 0' }} />
}

/* ─── Main page ─── */
export type Alert2FormData = { name: string; description: string; conditions: Alert2Conditions }

export function CreateAlert2Page({ onCancel, onActivate }: { onCancel: () => void; onActivate?: (data: Alert2FormData) => void }) {
  const [alertName, setAlertName] = useState('')
  const [description, setDescription] = useState('')
  const [nameCharError, setNameCharError] = useState(false)
  const [showNameError, setShowNameError] = useState(false)
  const [nameDuplicate, setNameDuplicate] = useState(false)
  const [conditions, setConditions] = useState<Alert2Conditions>(defaultAlert2Conditions())
  const [notifySupervisor, setNotifySupervisor] = useState(true)
  const [emailNotif, setEmailNotif] = useState(true)
  const [inAppNotif, setInAppNotif] = useState(true)
  const [showRecipientsModal, setShowRecipientsModal] = useState(false)
  const [additionalRecipients, setAdditionalRecipients] = useState<string[]>([])
  const [showCancelModal, setShowCancelModal] = useState(false)

  const hasConditionIssues = useMemo(() => hasBlockingIssues(conditions), [conditions])
  const emailLocked = additionalRecipients.length > 0

  const noNotifyMethod = !emailNotif && !inAppNotif
  const canSave = alertName.trim().length > 0 && !nameCharError && !nameDuplicate && !hasConditionIssues
  const canActivate = canSave && !noNotifyMethod

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
        {/* Breadcrumb + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span
            onClick={() => { alertName.trim() ? setShowCancelModal(true) : onCancel() }}
            style={{ font: '500 16px/20px var(--font-sans)', letterSpacing: '-0.01em', color: 'var(--lyra-color-fg-secondary)', fontFamily: FONT, cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--lyra-color-fg-default)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--lyra-color-fg-secondary)' }}
          >
            Alerts
          </span>
          <span style={{ font: '500 16px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', fontFamily: FONT }}>/</span>
          <span style={{ font: '600 20px/24px var(--font-sans)', letterSpacing: '-0.02em', color: 'var(--lyra-color-fg-default)', fontFamily: FONT }}>
            Create new alert
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {/* Cancel */}
          <button
            onClick={() => { alertName.trim() ? setShowCancelModal(true) : onCancel() }}
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
          {/* Save */}
          <button
            disabled={!canActivate}
            style={{
              height: 36, padding: '0 var(--space-4)', borderRadius: 'var(--radius-md)',
              border: 'none',
              background: canActivate ? 'var(--lyra-color-bg-primary)' : 'var(--lyra-color-bg-disabled)',
              font: '500 14px/20px var(--font-sans)',
              color: canActivate ? 'var(--lyra-color-fg-on-primary)' : 'var(--lyra-color-fg-disabled)',
              cursor: canActivate ? 'pointer' : 'not-allowed', fontFamily: FONT,
            }}
            onMouseEnter={e => { if (canActivate) (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-primary)' }}
            onMouseLeave={e => { if (canActivate) (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-bg-primary)' }}
            onClick={() => { if (canActivate) onActivate?.({ name: alertName.trim(), description: description.trim(), conditions }) }}
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
            <div style={{
              background: 'var(--lyra-color-bg-surface-base)',
              border: '1px solid var(--lyra-color-border-subtle)',
              borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                {/* Label row with counter */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 400 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                    <label style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', fontFamily: FONT }}>
                      Alert name
                    </label>
                    <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-status-critical-strong)', fontFamily: FONT }}>*</span>
                  </div>
                  <span style={{
                    font: '400 12px/16px var(--font-sans)', fontFamily: FONT,
                    color: alertName.length > 45 ? 'var(--lyra-color-status-critical-strong)' : 'var(--lyra-color-fg-secondary)',
                    letterSpacing: '0.2px',
                  }}>
                    {alertName.length}/50
                  </span>
                </div>
                {/* Input + green tick */}
                {(() => {
                  const hasErr = (showNameError && !alertName) || (!!alertName && nameCharError)
                  const hasDuplicate = !!alertName && !nameCharError && nameDuplicate
                  const isValid = !!alertName.trim() && !nameCharError && !nameDuplicate
                  const borderColor = hasErr
                    ? 'var(--lyra-color-status-critical-strong)'
                    : hasDuplicate
                    ? 'var(--lyra-color-status-warning-medium)'
                    : 'var(--lyra-color-border-soft)'
                  const bgColor = hasErr
                    ? 'var(--lyra-color-status-critical-subtle)'
                    : hasDuplicate
                    ? 'var(--lyra-color-status-warning-subtle)'
                    : 'var(--lyra-color-bg-field)'
                  return (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <input
                          type="text"
                          maxLength={50}
                          value={alertName}
                          onChange={e => {
                            const raw = e.target.value.slice(0, 50)
                            setAlertName(raw)
                            const hasInvalid = /[/!+<>?#&,%]/.test(raw)
                            setNameCharError(hasInvalid)
                            if (!hasInvalid) {
                              const isDuplicate = EXISTING_ALERT_NAMES.includes(raw.trim().toLowerCase())
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
                            border: `1px solid ${borderColor}`,
                            borderRadius: 'var(--radius-md)',
                            font: '400 14px/20px var(--font-sans)', fontFamily: FONT,
                            color: 'var(--lyra-color-fg-default)',
                            background: bgColor,
                            outline: 'none', boxSizing: 'border-box', boxShadow: 'none',
                          }}
                          onFocus={e => {
                            if (hasErr) {
                              e.currentTarget.style.borderColor = 'var(--lyra-color-status-critical-strong)'
                              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(189,42,42,0.12)'
                            } else if (hasDuplicate) {
                              e.currentTarget.style.borderColor = 'var(--lyra-color-status-warning-medium)'
                              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(142,104,0,0.12)'
                            } else {
                              e.currentTarget.style.borderColor = 'var(--lyra-color-border-active)'
                              e.currentTarget.style.boxShadow = 'var(--sol-effect-activering)'
                            }
                          }}
                          onBlur={e => {
                            e.currentTarget.style.borderColor = borderColor
                            e.currentTarget.style.boxShadow = 'none'
                          }}
                        />
                        {isValid && (
                          <svg viewBox="0 0 16 16" width="16" height="16" fill="none" style={{ flexShrink: 0 }}>
                            <circle cx="8" cy="8" r="8" fill="var(--lyra-color-status-success-strong)" />
                            <path d="M4.5 8L6.5 10.5L11.5 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      {showNameError && !alertName && <ErrMsg text="Required" />}
                      {alertName && nameCharError && <ErrMsg text="Special characters like / ! + &lt; &gt; ? # &amp; , % are not allowed" />}
                      {hasDuplicate && <WarnMsg text="An alert with this name already exists. Please enter a unique alert name." />}
                    </>
                  )
                })()}
              </div>
              <div style={{ marginTop: 'var(--space-4)' }}>
                <DescriptionField value={description} onChange={setDescription} />
              </div>
            </div>

            <ConditionsBuilder2 value={conditions} onChange={setConditions} />

            {/* Who is notified? */}
            <Panel title="Who is notified?">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Toggle checked={notifySupervisor} onChange={setNotifySupervisor} />
                  <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', fontFamily: FONT }}>
                    The agent's supervisor
                  </span>
                </div>
                {/* Also notify button + helper */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <SecBtn label="Also notify" icon={<Plus size={14} />} width={128} onClick={() => setShowRecipientsModal(true)} disabled={additionalRecipients.length >= 5} />
                  <span style={{ font: '400 12px/16px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', letterSpacing: '0.01em', fontFamily: FONT }}>
                    Add additional recipients to receive notifications
                  </span>
                </div>

                {/* Additional recipients table */}
                {additionalRecipients.length > 0 && (
                  <div style={{
                    alignSelf: 'stretch', borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--lyra-color-border-subtle)',
                    background: 'var(--lyra-color-bg-surface-base)',
                    display: 'flex', flexDirection: 'column', overflow: 'hidden',
                  }}>
                    {/* Toolbar */}
                    <div style={{
                      height: 56, padding: '12px var(--space-4)',
                      background: 'rgba(0,0,0,0.02)',
                      borderBottom: '1px solid var(--lyra-color-border-subtle)',
                      display: 'flex', alignItems: 'center',
                    }}>
                      <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', fontFamily: FONT }}>
                        {additionalRecipients.length} additional recipient{additionalRecipients.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {/* Table */}
                    <div style={{ display: 'flex', overflow: 'hidden' }}>
                      {/* Name column */}
                      <div style={{ width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ height: 48, padding: '0 var(--space-4)', borderBottom: '1px solid var(--lyra-color-border-soft)', display: 'flex', alignItems: 'center' }}>
                          <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', fontFamily: FONT }}>Name</span>
                        </div>
                        {additionalRecipients.map(id => {
                          const user = ALL_USERS.find(u => u.id === id)
                          if (!user) return null
                          return (
                            <div key={id} style={{ height: 40, padding: '0 var(--space-4)', borderBottom: '1px solid var(--lyra-color-border-subtle)', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                              <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', fontFamily: FONT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</span>
                            </div>
                          )
                        })}
                      </div>
                      {/* Email column */}
                      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ height: 48, padding: '0 var(--space-4)', borderBottom: '1px solid var(--lyra-color-border-soft)', display: 'flex', alignItems: 'center' }}>
                          <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', fontFamily: FONT }}>Email</span>
                        </div>
                        {additionalRecipients.map(id => {
                          const user = ALL_USERS.find(u => u.id === id)
                          if (!user) return null
                          return (
                            <div key={id} style={{ height: 40, padding: '0 var(--space-4)', borderBottom: '1px solid var(--lyra-color-border-subtle)', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                              <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', fontFamily: FONT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</span>
                            </div>
                          )
                        })}
                      </div>
                      {/* Remove column */}
                      <div style={{ width: 91, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ height: 48, padding: '0 var(--space-4)', borderBottom: '1px solid var(--lyra-color-border-soft)', display: 'flex', alignItems: 'center' }}>
                          <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', fontFamily: FONT }}>Remove</span>
                        </div>
                        {additionalRecipients.map(id => {
                          const user = ALL_USERS.find(u => u.id === id)
                          if (!user) return null
                          return (
                            <div key={id} style={{ height: 40, padding: '0 var(--space-4)', borderBottom: '1px solid var(--lyra-color-border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <button
                                onClick={() => setAdditionalRecipients(prev => prev.filter(x => x !== id))}
                                aria-label={`Remove ${user.name}`}
                                style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--lyra-color-fg-default)', borderRadius: 'var(--radius-xs)' }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
                              >
                                <X size={16} />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
                {!notifySupervisor && additionalRecipients.length === 0 && (
                  <div style={{
                    display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)',
                    width: '100%', padding: 'var(--space-3) var(--space-4)',
                    background: 'var(--lyra-color-status-info-subtle)',
                    borderRadius: 'var(--radius-md)',
                  }}>
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
                  <Toggle checked={emailNotif} onChange={setEmailNotif} disabled={emailLocked} />
                  <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', fontFamily: FONT }}>
                    Email notification
                  </span>
                </div>
                {emailLocked && (
                  <span style={{ font: '400 12px/16px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', letterSpacing: '0.01em', fontFamily: FONT, marginTop: 'calc(-1 * var(--space-2))' }}>
                    A recipient has been added under "Also notify", so Email notification must remain enabled.
                  </span>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Toggle checked={inAppNotif} onChange={setInAppNotif} />
                  <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', fontFamily: FONT }}>
                    In-app notification
                  </span>
                </div>
                {noNotifyMethod && (
                  <div style={{
                    display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)',
                    padding: 'var(--space-3) var(--space-4)',
                    background: 'var(--lyra-color-status-info-subtle)',
                    border: '1px solid var(--lyra-color-status-info-medium)',
                    borderRadius: 'var(--radius-md)',
                  }}>
                    <Info size={16} style={{ color: 'var(--lyra-color-status-info-strong)', flexShrink: 0, marginTop: 2 }} />
                    <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-status-info-strong)', fontFamily: FONT }}>
                      At least one notification method must be enabled. Enable email, in-app, or both to activate this alert.
                    </span>
                  </div>
                )}
              </div>
            </Panel>
          </div>

          {/* ── Right column — Summary ── */}
          <div style={{ width: 296, flexShrink: 0 }}>
            <div style={{
              background: 'var(--lyra-color-bg-surface-canvas)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-4)',
              display: 'flex', flexDirection: 'column', gap: 'var(--space-4)',
            }}>
              <span style={{ font: '500 16px/20px var(--font-sans)', letterSpacing: '-0.01em', color: 'var(--lyra-color-fg-default)', fontFamily: FONT }}>
                Summary
              </span>

              <Conditions2Summary conditions={conditions} />

              <SummaryDivider />

              {/* Notified via / to */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', fontFamily: FONT }}>
                    Notified via:
                  </span>
                  <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', fontFamily: FONT, textAlign: 'right', textTransform: 'capitalize' }}>
                    {summaryVia}
                  </span>
                </div>
                <NotifiedToSummary names={summaryToList} />
              </div>
            </div>
          </div>

        </div>
      </div>

      {showRecipientsModal && (
        <AddRecipientsModal
          selected={additionalRecipients}
          onConfirm={ids => { setAdditionalRecipients(ids); if (ids.length > 0) setEmailNotif(true); setShowRecipientsModal(false) }}
          onClose={() => setShowRecipientsModal(false)}
        />
      )}

      {/* Cancel confirmation modal */}
      {showCancelModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.24)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'var(--lyra-color-bg-surface-overlay)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--sol-effect-shadowlg)',
            width: 400, padding: 'var(--space-6)',
            display: 'flex', flexDirection: 'column', gap: 'var(--space-4)',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <span style={{ font: '600 16px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', fontFamily: FONT }}>
                Discard changes?
              </span>
              <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', fontFamily: FONT }}>
                You have unsaved changes. If you leave now, your changes will be lost and the alert will not be created.
              </span>
            </div>
            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <button
                onClick={() => setShowCancelModal(false)}
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
                Keep editing
              </button>
              <button
                onClick={onCancel}
                style={{
                  height: 36, padding: '0 var(--space-4)', borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: 'var(--lyra-color-bg-destructive)',
                  font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-inverse)',
                  cursor: 'pointer', fontFamily: FONT,
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.9' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
              >
                Discard changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
