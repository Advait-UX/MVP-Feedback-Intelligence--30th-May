import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X } from 'lucide-react'
import {
  ListPageHeader, SearchInput, GridPanel, GridToolbar, RowKebabMenu,
  TableShell, Th, Td, EmptyRow, StatusPill,
} from '@/components/feedback-management/ListPagePrimitives'

const PAGE_SIZE = 50

export type AlertStatus = 'Active' | 'Draft'

export type Alert = {
  id: string
  name: string
  updatedOn: string
  updatedBy: string
  status: AlertStatus
  notifyWhen: string
  linkedPrograms?: string[]
}

const FONT = '"Inter", system-ui, -apple-system, sans-serif'

const ALERTS: Alert[] = [
  {
    id: 'billing-context',
    name: 'Billing context',
    updatedOn: 'May 12, 2026 10:55:06 AM',
    updatedBy: 'Jaden Smith',
    status: 'Draft',
    notifyWhen: 'CSAT ≤ 2/5, ASAT ≤ 3/5',
    linkedPrograms: ['Billing Effort Score', 'Home service feedback survey', 'Tech support satisfaction survey'],
  },
  {
    id: 'home-service-feedback',
    name: 'Home service feedback survey',
    updatedOn: 'May 11, 2026 11:06:39 AM',
    updatedBy: 'Maria Cohen',
    status: 'Active',
    notifyWhen: 'CSAT ≤ 2/5, ASAT ≤ 3/5',
    linkedPrograms: ['Home service feedback survey', 'Tech support satisfaction survey'],
  },
  {
    id: 'tech-support-satisfaction',
    name: 'Tech support satisfaction survey',
    updatedOn: 'May 10, 2026 09:21:59 PM',
    updatedBy: 'Jessica',
    status: 'Draft',
    notifyWhen: 'CSAT ≤ 2/5, ASAT ≤ 3/5',
    linkedPrograms: [],
  },
  {
    id: 'product-quality-feedback',
    name: 'Product quality feedback survey',
    updatedOn: 'May 9, 2026 08:45:00 AM',
    updatedBy: 'John Smith',
    status: 'Active',
    notifyWhen: 'CSAT ≤ 2/5, ASAT ≤ 3/5',
    linkedPrograms: [],
  },
  {
    id: 'fitness-program-satisfaction',
    name: 'Fitness program satisfaction survey',
    updatedOn: 'May 8, 2026 07:30:00 PM',
    updatedBy: 'Emily Johnson',
    status: 'Active',
    notifyWhen: 'CSAT ≤ 2/5, ASAT ≤ 3/5',
    linkedPrograms: [],
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
  const hasLinked = alert.status === 'Active' && (alert.linkedPrograms?.length ?? 0) > 0
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
              ? `This alert is currently used by ${alert.linkedPrograms!.length} active program${alert.linkedPrograms!.length !== 1 ? 's' : ''}. Remove the alert from all linked programs before deleting it.`
              : alert.status === 'Active'
                ? <>Delete this active alert? This action is permanent.<br />Do you want to continue?</>
                : <>Delete this draft alert? This action is permanent.<br />Do you want to continue?</>
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
                      <div key={p} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--lyra-color-border-subtle)' }}>
                        <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>{p}</span>
                        <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-link)', cursor: 'pointer', flexShrink: 0 }}>View</span>
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
      padding: '12px 24px', flexShrink: 0,
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

function AlertRow({ alert, highlighted, onDelete, onEdit }: { alert: Alert; highlighted: boolean; onDelete: () => void; onEdit: () => void }) {
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
      <Td><span style={{ fontWeight: 500, color: 'var(--lyra-color-fg-link)' }}>{alert.name}</span></Td>
      <Td>{alert.updatedOn}</Td>
      <Td>{alert.updatedBy}</Td>
      <Td><StatusPill label={alert.status} tone={alert.status === 'Active' ? 'success' : 'neutral'} /></Td>
      <Td>{alert.notifyWhen}</Td>
      <Td align="right"><RowKebabMenu status={alert.status === 'Active' ? 'active' : 'draft'} onDelete={onDelete} onEdit={onEdit} /></Td>
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
  activatedAlert?: { name: string } | null
  onClearActivated?: () => void
  onEditAlert?: (alert: Alert) => void
  savedAlert?: { id: string; name: string } | null
  onClearSaved?: () => void
}) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [extraAlerts, setExtraAlerts] = useState<Alert[]>([])
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set())
  const [pendingDelete, setPendingDelete] = useState<Alert | null>(null)
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
        updatedBy: 'Advait Patil',
        status: 'Active',
        notifyWhen: 'CSAT ≤ 2/5',
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
    setHighlightedId(savedAlert.id)
    setToast(`"${savedAlert.name}" has been updated successfully`)
    const t1 = setTimeout(() => setHighlightedId(null), 5000)
    const t2 = setTimeout(() => setToast(null), 5000)
    const t3 = setTimeout(() => onClearSaved?.(), 5100)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [savedAlert])

  const allAlerts = useMemo(
    () => [...extraAlerts, ...ALERTS].filter(a => !deletedIds.has(a.id)),
    [extraAlerts, deletedIds]
  )

  const filtered = useMemo(
    () => allAlerts.filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase())),
    [search, allAlerts]
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: 'var(--lyra-color-bg-surface-base)' }}>
      <ListPageHeader
        title="Alerts"
        actionLabel="Create new alert"
        onAction={onCreateAlert}
        tooltipText="Alerts define who gets notified when a response needs attention. They are reusable and can be selected by any program."
      />

      <div className="flex-1 overflow-auto" style={{ padding: 'var(--space-7)' }}>
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <SearchInput value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Search by alert name" />
        </div>

        <GridPanel>
          <GridToolbar label="Alerts" shown={filtered.length} total={allAlerts.length} />
          <TableShell>
            <thead>
              <tr>
                <Th>Alerts</Th>
                <Th>Updated on</Th>
                <Th>Updated by</Th>
                <Th>Status</Th>
                <Th>Notify when</Th>
                <Th align="right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && <EmptyRow colSpan={6} message="No alerts match your search." />}
              {rows.map(a => (
                <AlertRow key={a.id} alert={a} highlighted={highlightedId === a.id} onDelete={() => setPendingDelete(a)} onEdit={() => onEditAlert?.(a)} />
              ))}
            </tbody>
          </TableShell>
        </GridPanel>
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={filtered.length}
        pageSize={PAGE_SIZE}
        onPage={setPage}
      />

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
    </div>
  )
}
