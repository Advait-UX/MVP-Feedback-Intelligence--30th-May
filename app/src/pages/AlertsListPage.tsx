import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X } from 'lucide-react'
import {
  ListPageHeader, SearchInput, GridPanel, GridToolbar, RowKebabMenu,
  TableShell, Th, Td, EmptyRow,
} from '@/components/feedback-management/ListPagePrimitives'
import { formatNotifyWhen, type AlertConditions } from '@/components/feedback-management/AlertConditions'
import type { AlertFormData } from './CreateAlertPage'

const PAGE_SIZE = 50

export type Alert = {
  id: string
  name: string
  updatedOn: string
  updatedBy: string
  notifyWhen: string
  description: string
  linkedPrograms?: string[]
  conditions?: AlertConditions
}

const FONT = '"Inter", system-ui, -apple-system, sans-serif'

type SortKey = 'updatedOn' | 'updatedBy'
type SortDir = 'asc' | 'desc'

function SortableTh({
  children, sortKey, active, dir, width, onSort,
}: {
  children: React.ReactNode
  sortKey: SortKey
  active: boolean
  dir: SortDir
  width?: number
  onSort: (k: SortKey) => void
}) {
  return (
    <th
      style={{
        height: 48, padding: '0 var(--space-4)', textAlign: 'left',
        font: '500 14px/20px var(--font-sans)', fontFamily: FONT,
        color: 'var(--lyra-color-fg-default)',
        borderBottom: '1px solid var(--lyra-color-border-soft)',
        width, whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none',
      }}
      onClick={() => onSort(sortKey)}
    >
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {children}
        <span style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <ChevronUp
            size={10}
            style={{ color: active && dir === 'asc' ? 'var(--lyra-color-fg-active-strong)' : 'var(--lyra-color-fg-disabled)' }}
          />
          <ChevronDown
            size={10}
            style={{ color: active && dir === 'desc' ? 'var(--lyra-color-fg-active-strong)' : 'var(--lyra-color-fg-disabled)' }}
          />
        </span>
      </div>
    </th>
  )
}

const ALERTS: Alert[] = [
  {
    id: 'billing-context',
    name: 'Billing context',
    updatedOn: 'May 12, 2026 10:55:06 AM',
    updatedBy: 'Jaden Smith',
    notifyWhen: 'CSAT ≤ 2/5, ASAT ≤ 3/5',
    description: 'Flags low CSAT or ASAT on billing-related surveys so supervisors can follow up with the customer the same day.',
    linkedPrograms: ['Billing Effort Score', 'Home service feedback survey', 'Tech support satisfaction survey'],
  },
  {
    id: 'home-service-feedback',
    name: 'Home service feedback survey',
    updatedOn: 'May 11, 2026 11:06:39 AM',
    updatedBy: 'Maria Cohen',
    notifyWhen: 'CSAT ≤ 2/5, ASAT ≤ 3/5',
    description: 'Catches unhappy home-service customers right after the visit so the field team can schedule a recovery call.',
    linkedPrograms: ['Home service feedback survey', 'Tech support satisfaction survey'],
  },
  {
    id: 'tech-support-satisfaction',
    name: 'Tech support satisfaction survey',
    updatedOn: 'May 10, 2026 09:21:59 PM',
    updatedBy: 'Jessica',
    notifyWhen: 'CSAT ≤ 2/5, ASAT ≤ 3/5',
    description: 'Notifies the tech support lead when a customer rates the agent poorly after a support interaction.',
    linkedPrograms: [],
  },
  {
    id: 'product-quality-feedback',
    name: 'Product quality feedback survey',
    updatedOn: 'May 9, 2026 08:45:00 AM',
    updatedBy: 'John Smith',
    notifyWhen: 'CSAT ≤ 2/5, ASAT ≤ 3/5',
    description: 'Surfaces product quality complaints early so the product team can spot defects before they spread.',
    linkedPrograms: ['Product Quality Pulse', 'Post-Purchase Feedback'],
  },
  {
    id: 'fitness-program-satisfaction',
    name: 'Fitness program satisfaction survey',
    updatedOn: 'May 8, 2026 07:30:00 PM',
    updatedBy: 'Emily Johnson',
    notifyWhen: 'CSAT ≤ 2/5, ASAT ≤ 3/5',
    description: '',
    linkedPrograms: ['Fitness Program NPS'],
  },
]

/* ── Warning icon (Lyra amber triangle) ── */
function WarningIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.86 2.573a1.3 1.3 0 0 1 2.28 0l5.534 9.6A1.3 1.3 0 0 1 13.534 14H2.466a1.3 1.3 0 0 1-1.14-1.827l5.534-9.6Z" fill="var(--lyra-color-status-warning-subtle)" stroke="var(--lyra-color-status-warning-strong)" strokeWidth="1.3"/>
      <line x1="8" y1="6" x2="8" y2="9.5" stroke="var(--lyra-color-status-warning-strong)" strokeWidth="1.3" strokeLinecap="round"/>
      <circle cx="8" cy="11.5" r="0.65" fill="var(--lyra-color-status-warning-strong)"/>
    </svg>
  )
}

/* ── Delete modals ── */
type DeleteModalProps = {
  alert: Alert
  onClose: () => void
  onConfirm: (id: string) => void
}

function DeleteModal({ alert, onClose, onConfirm }: DeleteModalProps) {
  const hasLinked = (alert.linkedPrograms?.length ?? 0) > 0
  const [showPrograms, setShowPrograms] = useState(false)

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.24)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--lyra-color-bg-surface-overlay)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--sol-effect-shadowxl)', width: 400, display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ height: 80, display: 'flex', alignItems: 'center', padding: 'var(--space-6)', gap: 'var(--space-2)', borderBottom: '1px solid var(--lyra-color-border-subtle)' }}>
          <div style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <WarningIcon />
          </div>
          <span style={{ font: '500 16px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {hasLinked ? 'Cannot Delete Alert' : 'Delete Alert?'}
          </span>
        </div>

        {/* Body */}
        <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <p style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', margin: 0 }}>
            {hasLinked
              ? `This alert is currently used by ${alert.linkedPrograms!.length} program${alert.linkedPrograms!.length !== 1 ? 's' : ''}. Remove the alert from all linked programs before deleting it.`
              : <>Delete this alert? This action is permanent.<br />Do you want to continue?</>
            }
          </p>

          {hasLinked && (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <button
                onClick={() => setShowPrograms(v => !v)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-link)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                {showPrograms ? 'Collapse' : 'View linked programs'}
                <ChevronDown size={12} style={{ transform: showPrograms ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
              </button>
              {showPrograms && (
                <>
                  <p style={{ font: '500 16px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', letterSpacing: '-0.01em', margin: 0 }}>
                    Linked programs - {String(alert.linkedPrograms!.length).padStart(2, '0')}
                  </p>
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                    {alert.linkedPrograms!.map(p => (
                      <div key={p} style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--lyra-color-border-subtle)' }}>
                        <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-link)', textDecoration: 'none', cursor: 'pointer' }}>{p}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--space-2)', padding: 'var(--space-6)', borderTop: '1px solid var(--lyra-color-border-subtle)' }}>
          {hasLinked ? (
            <button onClick={onClose} style={secondaryBtnStyle}>Back</button>
          ) : (
            <>
              <button onClick={onClose} style={secondaryBtnStyle}>No</button>
              <button
                onClick={() => onConfirm(alert.id)}
                style={{ height: 36, padding: '0 var(--space-4)', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--lyra-color-bg-destructive)', font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-inverse)', cursor: 'pointer' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.88' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
              >Yes</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const secondaryBtnStyle: React.CSSProperties = {
  height: 36, padding: '0 var(--space-4)', borderRadius: 'var(--radius-md)',
  border: '1px solid var(--lyra-color-border-soft)',
  background: 'var(--lyra-color-bg-surface-base)',
  font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', cursor: 'pointer',
}

function PagBtn({ children, onClick, disabled, 'aria-label': ariaLabel }: {
  children: React.ReactNode; onClick: () => void; disabled: boolean; 'aria-label': string
}) {
  return (
    <button
      onClick={onClick} disabled={disabled} aria-label={ariaLabel}
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
    >
      {children}
    </button>
  )
}

function Pagination({
  page, totalPages, totalItems, pageSize, onPage,
}: {
  page: number; totalPages: number; totalItems: number; pageSize: number; onPage: (p: number) => void
}) {
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalItems)

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: 48, padding: '0 12px', flexShrink: 0,
      borderTop: '1px solid var(--lyra-color-border-subtle)',
      background: 'var(--lyra-color-bg-surface-base)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <PagBtn onClick={() => onPage(1)} disabled={page === 1} aria-label="First page"><ChevronsLeft size={14} /></PagBtn>
        <PagBtn onClick={() => onPage(page - 1)} disabled={page === 1} aria-label="Previous page"><ChevronLeft size={14} /></PagBtn>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>
          Page
          <input
            type="number" min={1} max={totalPages} value={page}
            onChange={e => { const v = parseInt(e.target.value); if (v >= 1 && v <= totalPages) onPage(v) }}
            style={{
              width: 40, height: 28, textAlign: 'center',
              border: '1px solid var(--lyra-color-border-soft)', borderRadius: 'var(--radius-xs)',
              font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)',
              background: 'var(--lyra-color-bg-surface-base)', outline: 'none',
            }}
          />
          of {totalPages}
        </span>
        <PagBtn onClick={() => onPage(page + 1)} disabled={page === totalPages} aria-label="Next page"><ChevronRight size={14} /></PagBtn>
        <PagBtn onClick={() => onPage(totalPages)} disabled={page === totalPages} aria-label="Last page"><ChevronsRight size={14} /></PagBtn>
      </div>
      <span style={{ font: '400 13px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)' }}>
        {start}–{end} of {totalItems} alerts
      </span>
    </div>
  )
}

/* ── Single-line truncated text that reveals the full value in a hover popover ── */
function TruncatedTextWithPopover({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  const [truncated, setTruncated] = useState(false)
  const spanRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = spanRef.current
    if (!el) return
    setTruncated(el.scrollWidth > el.clientWidth)
  }, [text])

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <span
        ref={spanRef}
        onMouseEnter={() => truncated && setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        style={{
          display: 'block', width: '100%', overflow: 'hidden',
          textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}
      >
        {text}
      </span>
      {open && (
        <div
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          style={{
            position: 'absolute', zIndex: 100, top: '100%', left: 0, marginTop: 4,
            width: 320, maxWidth: 'max(320px, 100%)',
            background: 'var(--lyra-color-bg-surface-overlay)',
            border: '1px solid var(--lyra-color-border-soft)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--sol-effect-shadowmd)',
            padding: 'var(--space-3) var(--space-4)',
            font: '400 14px/20px var(--font-sans)',
            color: 'var(--lyra-color-fg-default)',
            whiteSpace: 'normal',
          }}
        >
          {text}
        </div>
      )}
    </div>
  )
}

function AlertRow({ alert, highlighted, onDelete, onEdit, onDuplicate }: { alert: Alert; highlighted: boolean; onDelete: () => void; onEdit: () => void; onDuplicate: () => void }) {
  const [hovered, setHovered] = useState(false)
  const bg = highlighted
    ? 'var(--lyra-color-bg-active-subtle)'
    : hovered ? 'var(--lyra-color-state-bg-hover-opacity)' : ''
  return (
    <tr
      onClick={onEdit}
      style={{ borderBottom: '1px solid var(--lyra-color-border-subtle)', cursor: 'pointer', background: bg, transition: 'background 0.2s' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Td style={{ width: 300 }}><span style={{ fontWeight: 500, color: 'var(--lyra-color-fg-link)' }}>{alert.name}</span></Td>
      <Td style={{ width: 230 }}>{alert.updatedOn}</Td>
      <Td style={{ width: 160 }}>{alert.updatedBy}</Td>
      <Td style={{ width: 581, maxWidth: 581 }}>
        {alert.description
          ? <TruncatedTextWithPopover text={alert.description} />
          : <span style={{ color: 'var(--lyra-color-fg-secondary)' }}>—</span>}
      </Td>
      <Td align="right" style={{ width: 82 }}><RowKebabMenu status="active" onDelete={onDelete} onEdit={onEdit} onDuplicate={onDuplicate} /></Td>
    </tr>
  )
}

export function AlertsListPage({
  onCreateAlert,
  activatedAlert,
  onClearActivated,
  onEditAlert,
  savedAlert,
  onClearSaved,
}: {
  onCreateAlert?: () => void
  activatedAlert?: AlertFormData | null
  onClearActivated?: () => void
  onEditAlert?: (alert: Alert) => void
  savedAlert?: (AlertFormData & { id: string }) | null
  onClearSaved?: () => void
}) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [extraAlerts, setExtraAlerts] = useState<Alert[]>([])
  const [overrides, setOverrides] = useState<Record<string, Partial<Alert>>>({})
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set())
  const [pendingDelete, setPendingDelete] = useState<Alert | null>(null)
  const [duplicateSource, setDuplicateSource] = useState<Alert | null>(null)
  const [duplicateName, setDuplicateName] = useState('')
  const [duplicateNameTouched, setDuplicateNameTouched] = useState(false)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const addedAlertRef = useRef<typeof activatedAlert | null>(null)
  const pendingHighlightId = useRef<string | null>(null)

  useEffect(() => {
    if (!activatedAlert) return

    // Only insert into the list once (StrictMode runs effects twice)
    if (addedAlertRef.current !== activatedAlert) {
      addedAlertRef.current = activatedAlert
      const now = new Date()
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
      const todayStr = `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
      const newId = `new-alert-${Date.now()}`
      pendingHighlightId.current = newId
      const newAlert: Alert = {
        id: newId,
        name: activatedAlert.name,
        updatedOn: todayStr,
        updatedBy: 'Jaden Smith',
        notifyWhen: formatNotifyWhen(activatedAlert.conditions),
        description: activatedAlert.description,
        conditions: activatedAlert.conditions,
      }
      setExtraAlerts(prev => [newAlert, ...prev])
      setHighlightedId(newId)
      setToast(`"${activatedAlert.name}" has been activated successfully`)
      setPage(1)
    }

    // Always register timers — StrictMode cancels the first set via cleanup,
    // then re-runs the effect; this second registration is what actually fires.
    const t1 = setTimeout(() => { setHighlightedId(null); pendingHighlightId.current = null }, 5000)
    const t2 = setTimeout(() => setToast(null), 5000)
    const t3 = setTimeout(() => onClearActivated?.(), 5100)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [activatedAlert])

  useEffect(() => {
    if (!savedAlert) return
    const now = new Date()
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const todayStr = `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
    setOverrides(prev => ({
      ...prev,
      [savedAlert.id]: {
        name: savedAlert.name,
        notifyWhen: formatNotifyWhen(savedAlert.conditions),
        description: savedAlert.description,
        conditions: savedAlert.conditions,
        updatedOn: todayStr,
        updatedBy: 'Jaden Smith',
      },
    }))
    setHighlightedId(savedAlert.id)
    setToast(`"${savedAlert.name}" has been updated successfully`)
    const t1 = setTimeout(() => setHighlightedId(null), 5000)
    const t2 = setTimeout(() => setToast(null), 5000)
    const t3 = setTimeout(() => onClearSaved?.(), 5100)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [savedAlert])

  const allAlerts = useMemo(
    () => [...extraAlerts, ...ALERTS]
      .filter(a => !deletedIds.has(a.id))
      .map(a => overrides[a.id] ? { ...a, ...overrides[a.id] } : a),
    [extraAlerts, deletedIds, overrides]
  )

  const filtered = useMemo(() => {
    const base = allAlerts.filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()))
    if (!sortKey) return base
    return [...base].sort((a, b) => {
      let cmp: number
      if (sortKey === 'updatedOn') {
        cmp = (Date.parse(a.updatedOn) || 0) - (Date.parse(b.updatedOn) || 0)
      } else {
        cmp = a.updatedBy.localeCompare(b.updatedBy)
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [search, allAlerts, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
    setPage(1)
  }

  const hasRestrictedChars = (nm: string) => /[/!+<>?#&,%]/.test(nm)
  const isAlertNameTaken = (nm: string) => allAlerts.some(a => a.name.trim().toLowerCase() === nm.trim().toLowerCase())

  function suggestDuplicateName(alert: Alert): string {
    let n = 1
    let candidate = `${alert.name} (Copy ${n})`.slice(0, 50)
    while (isAlertNameTaken(candidate)) {
      n += 1
      candidate = `${alert.name} (Copy ${n})`.slice(0, 50)
    }
    return candidate
  }

  function openDuplicate(alert: Alert) {
    setDuplicateSource(alert)
    setDuplicateName(suggestDuplicateName(alert))
    setDuplicateNameTouched(false)
  }

  function handleDuplicateConfirm() {
    if (!duplicateSource) return
    const nm = duplicateName.trim()
    if (!nm || hasRestrictedChars(nm) || isAlertNameTaken(nm)) return
    const now = new Date()
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const todayStr = `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
    const copy: Alert = {
      ...duplicateSource,
      id: `alert-${Date.now()}`,
      name: nm,
      updatedOn: todayStr,
      updatedBy: 'Jaden Smith',
      linkedPrograms: [],
    }
    setExtraAlerts(prev => [copy, ...prev])
    setDuplicateSource(null)
    setSearch('')
    setPage(1)
    setHighlightedId(copy.id)
    setToast('Alert duplicated')
    setTimeout(() => setHighlightedId(null), 5000)
    setTimeout(() => setToast(null), 5000)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: 'var(--lyra-color-bg-surface-base)' }}>
      <ListPageHeader
        title="Alerts"
        actionLabel="Create new alert"
        onAction={onCreateAlert}
        tooltipText="Alerts define who gets notified when a response needs attention. They are reusable and can be selected by any program."
      />

      <div className="flex-1 flex flex-col overflow-hidden" style={{ padding: 'var(--space-7)' }}>
        <div style={{ marginBottom: 'var(--space-6)', flexShrink: 0 }}>
          <SearchInput value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Search by alert name" />
        </div>

        <GridPanel>
          <GridToolbar label="Alerts" shown={filtered.length} total={allAlerts.length} />
          <div className="flex-1 overflow-auto">
            <TableShell>
              <thead>
                <tr>
                  <Th width={300}>Alerts</Th>
                  <SortableTh sortKey="updatedOn" active={sortKey === 'updatedOn'} dir={sortDir} width={230} onSort={handleSort}>Updated on</SortableTh>
                  <SortableTh sortKey="updatedBy" active={sortKey === 'updatedBy'} dir={sortDir} width={160} onSort={handleSort}>Updated by</SortableTh>
                  <Th width={581}>Description</Th>
                  <Th align="right" width={82}>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && <EmptyRow colSpan={5} message="No alerts match your search." />}
                {rows.map(a => (
                  <AlertRow key={a.id} alert={a} highlighted={highlightedId === a.id} onDelete={() => setPendingDelete(a)} onEdit={() => onEditAlert?.(a)} onDuplicate={() => openDuplicate(a)} />
                ))}
              </tbody>
            </TableShell>
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
            onPage={setPage}
          />
        </GridPanel>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 200,
          width: 361, padding: 20,
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--lyra-color-status-success-strong)',
          background: 'var(--lyra-color-status-success-subtle)',
          boxShadow: 'var(--sol-effect-shadowlg)',
          display: 'flex', alignItems: 'flex-start', gap: 8,
        }}>
          <div style={{ width: 24, height: 24, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 16 16" width="16" height="16" fill="none">
              <circle cx="8" cy="8" r="8" fill="var(--lyra-color-status-success-strong)" />
              <polyline points="4,8 6.5,10.5 12,5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ flex: 1, font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>
            {toast}
          </div>
          <button
            onClick={() => setToast(null)}
            style={{ width: 24, height: 24, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 'var(--radius-sm)', padding: 0 }}
            aria-label="Dismiss"
          >
            <X size={14} style={{ color: 'var(--lyra-color-fg-default)' }} />
          </button>
        </div>
      )}

      {/* Delete modal */}
      {pendingDelete && (
        <DeleteModal
          alert={pendingDelete}
          onClose={() => setPendingDelete(null)}
          onConfirm={(id) => {
            setDeletedIds(prev => new Set([...prev, id]))
            setPendingDelete(null)
          }}
        />
      )}

      {/* Duplicate alert modal */}
      {duplicateSource && (() => {
        const trimmed = duplicateName.trim()
        const charError = hasRestrictedChars(duplicateName)
        const isDuplicateName = !!trimmed && !charError && isAlertNameTaken(trimmed)
        const isValid = !!trimmed && !charError && !isDuplicateName
        const showRequired = duplicateNameTouched && !trimmed
        const borderColor = (showRequired || (trimmed && charError))
          ? 'var(--lyra-color-status-critical-strong)'
          : isDuplicateName
          ? 'var(--lyra-color-status-warning-medium)'
          : 'var(--lyra-color-border-soft)'
        const bgColor = (showRequired || (trimmed && charError))
          ? 'var(--lyra-color-status-critical-subtle)'
          : isDuplicateName
          ? 'var(--lyra-color-status-warning-subtle)'
          : 'var(--lyra-color-bg-field)'
        return (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.24)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={e => { if (e.target === e.currentTarget) setDuplicateSource(null) }}
          >
            <div style={{
              background: 'var(--lyra-color-bg-surface-overlay)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--sol-effect-shadowlg)',
              width: '100%', maxWidth: 560,
              padding: 'var(--space-6)',
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
                <h2 style={{ margin: 0, font: '600 16px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', fontFamily: FONT }}>
                  Duplicate Alert
                </h2>
                <button
                  onClick={() => setDuplicateSource(null)}
                  aria-label="Close"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 'var(--radius-sm)', border: 'none', background: 'transparent', color: 'var(--lyra-color-fg-secondary)', cursor: 'pointer', transition: 'background 0.12s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Info banner */}
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                background: 'var(--lyra-color-status-info-subtle)',
                border: '1px solid rgba(45,91,185,0.2)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 12px',
                marginBottom: 'var(--space-5)',
                font: '400 13px/18px var(--font-sans)', color: 'var(--lyra-color-status-info-strong)', fontFamily: FONT,
              }}>
                Duplicating the alert creates a new alert that can be edited independently.
              </div>

              {/* Alert name field */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <label htmlFor="dup-alert-nm" style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', fontFamily: FONT }}>
                      Alert name
                    </label>
                    <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-status-critical-strong)' }}>*</span>
                  </div>
                  <span style={{
                    font: '400 12px/16px var(--font-sans)', fontFamily: FONT,
                    color: duplicateName.length >= 50 ? 'var(--lyra-color-status-critical-strong)' : 'var(--lyra-color-fg-secondary)',
                  }}>
                    {duplicateName.length}/50
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <input
                    id="dup-alert-nm"
                    type="text"
                    maxLength={50}
                    value={duplicateName}
                    autoFocus
                    onChange={e => setDuplicateName(e.target.value.slice(0, 50))}
                    onBlur={() => setDuplicateNameTouched(true)}
                    onKeyDown={e => { if (e.key === 'Enter') handleDuplicateConfirm() }}
                    style={{
                      flex: 1, height: 38, padding: '0 12px',
                      background: bgColor,
                      border: `1px solid ${borderColor}`,
                      borderRadius: 'var(--radius-sm)',
                      font: '400 14px/20px var(--font-sans)', fontFamily: FONT, color: 'var(--lyra-color-fg-default)',
                      outline: 'none', boxSizing: 'border-box',
                    }}
                    onFocus={e => {
                      if (showRequired || (trimmed && charError)) {
                        e.currentTarget.style.borderColor = 'var(--lyra-color-status-critical-strong)'
                        e.currentTarget.style.boxShadow = '0 0 0 2px rgba(189,42,42,0.12)'
                      } else if (isDuplicateName) {
                        e.currentTarget.style.borderColor = 'var(--lyra-color-status-warning-medium)'
                        e.currentTarget.style.boxShadow = '0 0 0 2px rgba(142,104,0,0.12)'
                      } else {
                        e.currentTarget.style.borderColor = 'var(--lyra-color-border-active)'
                        e.currentTarget.style.boxShadow = 'var(--sol-effect-activering)'
                      }
                    }}
                  />
                  {isValid && (
                    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" style={{ flexShrink: 0 }}>
                      <circle cx="8" cy="8" r="8" fill="var(--lyra-color-status-success-strong)" />
                      <path d="M4.5 8L6.5 10.5L11.5 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                {showRequired && (
                  <span style={{ font: '400 12px/16px var(--font-sans)', color: 'var(--lyra-color-status-critical-strong)' }}>Required</span>
                )}
                {trimmed && charError && (
                  <span style={{ font: '400 12px/16px var(--font-sans)', color: 'var(--lyra-color-status-critical-strong)' }}>
                    Special characters like / ! + &lt; &gt; ? # &amp; , % are not allowed
                  </span>
                )}
                {isDuplicateName && (
                  <span style={{ font: '400 12px/16px var(--font-sans)', color: 'var(--lyra-color-status-warning-strong)' }}>
                    An alert with this name already exists. Please enter a unique alert name.
                  </span>
                )}
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-6)' }}>
                <button
                  onClick={() => setDuplicateSource(null)}
                  style={{
                    height: 36, padding: '0 var(--space-4)', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--lyra-color-border-soft)',
                    background: 'var(--lyra-color-bg-surface-base)',
                    font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', fontFamily: FONT,
                    cursor: 'pointer', transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-bg-surface-base)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDuplicateConfirm}
                  disabled={!isValid}
                  style={{
                    height: 36, padding: '0 var(--space-4)', borderRadius: 'var(--radius-md)',
                    border: 'none',
                    background: isValid ? 'var(--lyra-color-bg-primary)' : 'var(--lyra-color-bg-disabled)',
                    font: '500 14px/20px var(--font-sans)', fontFamily: FONT,
                    color: isValid ? 'var(--lyra-color-fg-on-primary)' : 'var(--lyra-color-fg-disabled)',
                    cursor: isValid ? 'pointer' : 'not-allowed', transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => { if (isValid) (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-primary)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isValid ? 'var(--lyra-color-bg-primary)' : 'var(--lyra-color-bg-disabled)' }}
                >
                  Duplicate
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
