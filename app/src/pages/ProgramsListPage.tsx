import { useMemo, useState, useRef, useEffect } from 'react'
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, GripVertical, Monitor, Info, X } from 'lucide-react'
import { CAMPAIGNS, type Campaign } from '@/lib/campaigns'
import { deriveProgramRow } from '@/lib/mockDerive'
import {
  ListPageHeader, SearchInput, GridPanel, GridToolbar, StatusPill, RowKebabMenu,
  TableShell, Th, Td, EmptyRow,
} from '@/components/feedback-management/ListPagePrimitives'

const PAGE_SIZE = 50

const STATUS_TONE: Record<string, 'success' | 'warning' | 'neutral' | 'neutral-strong'> = {
  Active: 'success',
  Inactive: 'warning',
  Draft: 'neutral',
}

const STATUS_OPTIONS = ['All', 'Active', 'Inactive', 'Draft']

function StatusDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          height: 36, padding: '0 12px',
          border: '1px solid var(--lyra-color-border-soft)',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--lyra-color-bg-surface-base)',
          font: '400 14px/20px var(--font-sans)',
          color: 'var(--lyra-color-fg-default)',
          cursor: 'pointer', whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-bg-surface-base)' }}
      >
        <span style={{ color: 'var(--lyra-color-fg-secondary)', marginRight: 2 }}>Status:</span>
        <span style={{ fontWeight: 500 }}>{value}</span>
        <ChevronDown size={14} style={{ color: 'var(--lyra-color-fg-secondary)', flexShrink: 0 }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 20,
          background: 'var(--lyra-color-bg-surface-overlay)',
          border: '1px solid var(--lyra-color-border-soft)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--sol-effect-shadowlg)',
          minWidth: 140, padding: '4px 0',
        }}>
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false) }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '8px 12px',
                border: 'none', background: value === opt ? 'var(--lyra-color-bg-active-subtle)' : 'transparent',
                font: `${value === opt ? 500 : 400} 14px/20px var(--font-sans)`,
                color: value === opt ? 'var(--lyra-color-fg-active-strong)' : 'var(--lyra-color-fg-default)',
                cursor: 'pointer',
              }}
              onMouseEnter={e => { if (value !== opt) (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
              onMouseLeave={e => { if (value !== opt) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
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
      padding: '12px 16px', flexShrink: 0,
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
        {start}–{end} of {totalItems}
      </span>
    </div>
  )
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

const FONT = 'var(--font-sans)'

function buildInitialOrder(): Campaign[] {
  const withExtra = CAMPAIGNS.map(c => ({ c, extra: deriveProgramRow(c) }))
  const prioritized = withExtra
    .filter(({ extra }) => extra.priority !== '-')
    .sort((a, b) => parseInt(a.extra.priority.slice(1)) - parseInt(b.extra.priority.slice(1)))
  const unprioritized = withExtra.filter(({ extra }) => extra.priority === '-')
  return [...prioritized, ...unprioritized].map(({ c }) => c)
}

function PriorityModal({ initialOrder, onClose, onSave }: {
  initialOrder: Campaign[]
  onClose: () => void
  onSave: (order: Campaign[]) => void
}) {
  const [items, setItems] = useState<Campaign[]>(initialOrder)

  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dropIdx, setDropIdx] = useState<number | null>(null)

  function handleDragStart(idx: number) { setDragIdx(idx) }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault()
    if (dragIdx !== null && idx !== dragIdx) setDropIdx(idx)
  }

  function handleDrop(e: React.DragEvent, idx: number) {
    e.preventDefault()
    if (dragIdx === null || dragIdx === idx) { setDragIdx(null); setDropIdx(null); return }
    const next = [...items]
    const [moved] = next.splice(dragIdx, 1)
    next.splice(idx, 0, moved)
    setItems(next)
    setDragIdx(null)
    setDropIdx(null)
  }

  function handleDragEnd() { setDragIdx(null); setDropIdx(null) }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.24)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--lyra-color-bg-surface-overlay)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0px 20px 40px rgba(0,0,0,0.12)',
        outline: '1px solid var(--lyra-color-border-soft)',
        outlineOffset: -1,
        width: 760, maxWidth: 'calc(100vw - 48px)',
        maxHeight: 'calc(100vh - 80px)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ height: 80, padding: '0 24px', display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0 }}>
          <span style={{ flex: 1, font: `500 16px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>Prioritise programs</span>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ width: 24, height: 24, borderRadius: 'var(--radius-sm)', border: 'none', background: 'transparent', color: 'var(--lyra-color-fg-action)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '0 24px 0', display: 'flex', flexDirection: 'column', gap: 24, overflowY: 'auto', flex: 1 }}>
          {/* Info banner */}
          <div style={{
            padding: '12px 16px', borderRadius: 'var(--radius-md)',
            background: 'var(--lyra-color-status-info-subtle)',
            display: 'flex', alignItems: 'flex-start', gap: 8,
          }}>
            <Info size={16} style={{ color: 'var(--lyra-color-status-info-strong)', flexShrink: 0, marginTop: 2 }} />
            <span style={{ font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>
              Drag programs to set their priority. If an interaction matches more than one program, the highest-priority program will be used.
            </span>
          </div>

          {/* Draggable table */}
          <div style={{ border: '1px solid var(--lyra-color-border-soft)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 24 }}>
            {/* Column headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '116px 1fr 140px', borderBottom: '1px solid var(--lyra-color-border-soft)' }}>
              <div style={{ padding: '14px 16px', font: `500 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>Priority</div>
              <div style={{ padding: '14px 16px', font: `500 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>Programs</div>
              <div style={{ padding: '14px 16px', font: `500 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>Channel</div>
            </div>

            {/* Rows */}
            <div>
              {items.map((c, idx) => (
                <div
                  key={c.id}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={e => handleDragOver(e, idx)}
                  onDrop={e => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '116px 1fr 140px',
                    borderBottom: '1px solid var(--lyra-color-border-subtle)',
                    borderTop: dropIdx === idx && dragIdx !== null && dragIdx !== idx ? '2px solid var(--lyra-color-border-active)' : '2px solid transparent',
                    opacity: dragIdx === idx ? 0.45 : 1,
                    cursor: 'grab',
                    background: dragIdx === idx ? 'var(--lyra-color-bg-active-subtle)' : 'transparent',
                    transition: 'opacity 0.1s, background 0.1s',
                  }}
                  onMouseEnter={e => { if (dragIdx === null) (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
                  onMouseLeave={e => { if (dragIdx === null) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  {/* Priority cell */}
                  <div style={{ padding: '0 16px', height: 40, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <GripVertical size={16} style={{ color: 'var(--lyra-color-fg-action)', flexShrink: 0 }} />
                    <span style={{ font: `500 14px/18px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>P{idx + 1}</span>
                  </div>
                  {/* Program name cell */}
                  <div style={{ padding: '0 16px', height: 40, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                    <span style={{ font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.name}
                    </span>
                  </div>
                  {/* Channel cell */}
                  <div style={{ padding: '0 16px', height: 40, display: 'flex', alignItems: 'center' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, font: `500 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>
                      <Monitor size={16} style={{ color: 'var(--lyra-color-fg-default)' }} />
                      Digital
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ height: 80, padding: '0 24px', borderTop: '1px solid var(--lyra-color-border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, flexShrink: 0 }}>
          <button
            onClick={onClose}
            style={{
              height: 36, padding: '0 16px', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--lyra-color-border-soft)',
              background: 'var(--lyra-color-bg-surface-base)',
              font: `500 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-action)',
              cursor: 'pointer',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-bg-surface-base)' }}
          >
            Cancel
          </button>
          <button
            onClick={() => { onSave(items); onClose() }}
            style={{
              height: 36, padding: '0 16px', borderRadius: 'var(--radius-md)',
              border: 'none', background: 'var(--lyra-color-bg-primary)',
              font: `500 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-on-primary)',
              cursor: 'pointer',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-primary)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-bg-primary)' }}
          >
            Save priority
          </button>
        </div>
      </div>
    </div>
  )
}

type SortKey = 'priority' | 'updatedOn' | 'updatedBy' | 'status'
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
        color: active ? 'var(--lyra-color-fg-active-strong)' : 'var(--lyra-color-fg-default)',
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

export function ProgramsListPage({
  onSelectCampaign,
  onCreateCampaign,
  activatedProgram,
  onClearActivated,
  draftedProgram,
  onClearDrafted,
  savedProgram,
  onClearSaved,
}: {
  onSelectCampaign: (campaignId: string) => void
  onCreateCampaign?: () => void
  activatedProgram?: { id: string; name: string; channels: string[] } | null
  onClearActivated?: () => void
  draftedProgram?: { id: string; name: string } | null
  onClearDrafted?: () => void
  savedProgram?: { id: string; name: string; editedBy: string } | null
  onClearSaved?: () => void
}) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const [priorityModalOpen, setPriorityModalOpen] = useState(false)
  const [extraCampaigns, setExtraCampaigns] = useState<Campaign[]>([])
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [priorityOrder, setPriorityOrder] = useState<Campaign[]>(() => buildInitialOrder())
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const activatedExtras = useRef<Record<string, { updatedOn: string; updatedBy: string; status?: string }>>({})

  useEffect(() => {
    if (!activatedProgram) return
    const now = new Date()
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const todayStr = `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
    const newCampaign: Campaign = {
      id: activatedProgram.id,
      name: activatedProgram.name,
      version: 'v1.0',
      status: 'active',
      channels: activatedProgram.channels.length ? activatedProgram.channels : ['Digital'],
      daysRunning: 0,
      sent: null,
      sentDelta: null,
      responseRate: null,
      responseDelta: null,
      avgVu: null,
      avgVuDelta: null,
      topIntents: [],
      trigger: '',
      sparkline: [],
      csat: null,
      csatSeries: [],
      topics: [],
      category: '',
    }
    setExtraCampaigns(prev => {
      if (prev.some(c => c.id === newCampaign.id)) return prev
      return [...prev, newCampaign]
    })
    setPriorityOrder(prev => {
      if (prev.some(c => c.id === newCampaign.id)) return prev
      return [...prev, newCampaign]
    })
    setHighlightedId(activatedProgram.id)
    setToast(`"${activatedProgram.name}" has been activated successfully`)
    setCurrentPage(1)
    setSortKey('updatedOn')
    setSortDir('desc')
    // Store today's string for this campaign
    activatedExtras.current[activatedProgram.id] = { updatedOn: todayStr, updatedBy: 'Jaden Smith' }
    const t1 = setTimeout(() => setHighlightedId(null), 3000)
    const t2 = setTimeout(() => setToast(null), 3000)
    // Clear parent state AFTER timers have fired so they aren't canceled by a prop change
    const t3 = setTimeout(() => onClearActivated?.(), 3100)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [activatedProgram])

  useEffect(() => {
    if (!draftedProgram) return
    const now = new Date()
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const todayStr = `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
    const newCampaign: Campaign = {
      id: draftedProgram.id,
      name: draftedProgram.name,
      version: 'v1.0',
      status: 'draft',
      channels: ['Digital'],
      daysRunning: 0,
      sent: null, sentDelta: null, responseRate: null, responseDelta: null,
      avgVu: null, avgVuDelta: null, topIntents: [], trigger: '', sparkline: [],
      csat: null, csatSeries: [], topics: [], category: '',
    }
    setExtraCampaigns(prev => {
      if (prev.some(c => c.id === newCampaign.id)) return prev
      return [...prev, newCampaign]
    })
    // Draft programs are NOT added to priorityOrder — they have no priority
    setHighlightedId(draftedProgram.id)
    setToast('Program saved successfully')
    setCurrentPage(1)
    setSortKey('updatedOn')
    setSortDir('desc')
    activatedExtras.current[draftedProgram.id] = { updatedOn: todayStr, updatedBy: 'Jaden Smith', status: 'Draft' }
    const t1 = setTimeout(() => setHighlightedId(null), 3000)
    const t2 = setTimeout(() => setToast(null), 3000)
    const t3 = setTimeout(() => onClearDrafted?.(), 3100)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [draftedProgram])

  useEffect(() => {
    if (!savedProgram) return
    const now = new Date()
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const todayStr = `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
    setHighlightedId(savedProgram.id)
    setToast(`"${savedProgram.name}" has been saved successfully`)
    setCurrentPage(1)
    setSortKey('updatedOn')
    setSortDir('desc')
    activatedExtras.current[savedProgram.id] = { updatedOn: todayStr, updatedBy: savedProgram.editedBy }
    const t1 = setTimeout(() => setHighlightedId(null), 3000)
    const t2 = setTimeout(() => setToast(null), 3000)
    const t3 = setTimeout(() => onClearSaved?.(), 3100)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [savedProgram])

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
    setCurrentPage(1)
  }

  const priorityMap = useMemo(() => {
    const map = new Map<string, string>()
    priorityOrder.forEach((c, i) => map.set(c.id, `P${i + 1}`))
    return map
  }, [priorityOrder])

  const allCampaigns = useMemo(() => [...CAMPAIGNS, ...extraCampaigns], [extraCampaigns])

  const filtered = useMemo(() => {
    const base = allCampaigns.filter(c => {
      const extra = deriveProgramRow(c)
      const override = activatedExtras.current[c.id]
      const status = override?.status ?? (override ? 'Active' : extra.statusLabel)
      if (statusFilter !== 'All' && status !== statusFilter) return false
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })

    if (!sortKey) return base

    return [...base].sort((a, b) => {
      const ea = deriveProgramRow(a)
      const eb = deriveProgramRow(b)
      const overrideA = activatedExtras.current[a.id]
      const overrideB = activatedExtras.current[b.id]
      let valA: string
      let valB: string

      if (sortKey === 'priority') {
        const pa = priorityMap.get(a.id) ?? 'P999'
        const pb = priorityMap.get(b.id) ?? 'P999'
        valA = String(parseInt(pa.replace('P', '')) || 999)
        valB = String(parseInt(pb.replace('P', '')) || 999)
        const diff = parseInt(valA) - parseInt(valB)
        return sortDir === 'asc' ? diff : -diff
      }
      if (sortKey === 'updatedOn') { valA = overrideA?.updatedOn ?? ea.updatedOn; valB = overrideB?.updatedOn ?? eb.updatedOn }
      else if (sortKey === 'updatedBy') { valA = overrideA?.updatedBy ?? ea.updatedBy; valB = overrideB?.updatedBy ?? eb.updatedBy }
      else { valA = ea.statusLabel; valB = eb.statusLabel }

      const cmp = valA.localeCompare(valB)
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [search, statusFilter, sortKey, sortDir, priorityMap, allCampaigns])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  function handleFilterChange(v: string) { setStatusFilter(v); setCurrentPage(1) }
  function handleSearch(v: string) { setSearch(v); setCurrentPage(1) }

  return (
    /* Outer: fill the AppShell main area, use min-h-0 to allow flex shrink */
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, background: 'var(--lyra-color-bg-surface-base)' }}>

      {/* ① Page header — always visible, never scrolls */}
      <ListPageHeader
        title="Programs"
        actionLabel="New program"
        onAction={onCreateCampaign}
        secondaryActionLabel="Set priority for programs"
        onSecondaryAction={() => setPriorityModalOpen(true)}
        showInfoIcon
        tooltipText="A Program controls who receives a survey, when it is sent, and which survey experience is used."
      />

      {/* ② Scrollable body — search + table */}
      <div style={{ flex: 1, overflow: 'auto', minHeight: 0, padding: '32px 32px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <SearchInput value={search} onChange={handleSearch} placeholder="Search programs" />
          <StatusDropdown value={statusFilter} onChange={handleFilterChange} />
        </div>

        <GridPanel>
          <GridToolbar label="Programs" shown={filtered.length} total={allCampaigns.length} />
          <TableShell>
            <thead>
              <tr>
                <SortableTh sortKey="priority" active={sortKey === 'priority'} dir={sortDir} width={80} onSort={handleSort}>Priority</SortableTh>
                <Th>Program</Th>
                <Th>Survey</Th>
                <Th>Channels</Th>
                <Th>Alert</Th>
                <SortableTh sortKey="updatedOn" active={sortKey === 'updatedOn'} dir={sortDir} onSort={handleSort}>Updated on</SortableTh>
                <SortableTh sortKey="updatedBy" active={sortKey === 'updatedBy'} dir={sortDir} onSort={handleSort}>Updated by</SortableTh>
                <SortableTh sortKey="status" active={sortKey === 'status'} dir={sortDir} onSort={handleSort}>Status</SortableTh>
                <Th align="right" width={40}>{''}</Th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 && <EmptyRow colSpan={9} message="No programs match your search." />}
              {pageRows.map(c => (
                <ProgramRow
                  key={c.id}
                  campaign={c}
                  priority={priorityMap.get(c.id) ?? '-'}
                  onSelect={() => onSelectCampaign(c.id)}
                  highlighted={highlightedId === c.id}
                  overrideExtras={activatedExtras.current[c.id]}
                />
              ))}
            </tbody>
          </TableShell>
        </GridPanel>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24,
          zIndex: 200,
          width: 361,
          padding: 20,
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--lyra-color-status-success-strong)',
          background: 'var(--lyra-color-status-success-subtle)',
          boxShadow: 'var(--sol-effect-shadowlg)',
          display: 'flex', alignItems: 'flex-start', gap: 8,
        }}>
          {/* Check icon */}
          <div style={{ width: 24, height: 24, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 16 16" width="16" height="16" fill="none">
              <circle cx="8" cy="8" r="8" fill="var(--lyra-color-status-success-strong)" />
              <polyline points="4,8 6.5,10.5 12,5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          {/* Message */}
          <div style={{ flex: 1, font: `400 14px/20px ${FONT}`, color: 'var(--lyra-color-fg-default)' }}>
            {toast}
          </div>
          {/* Close */}
          <button
            onClick={() => setToast(null)}
            style={{ width: 24, height: 24, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 'var(--radius-sm)', padding: 0 }}
            aria-label="Dismiss"
          >
            <X size={14} style={{ color: 'var(--lyra-color-fg-default)' }} />
          </button>
        </div>
      )}

      {/* ③ Pagination — always visible at the bottom, never scrolls */}
      <Pagination
        page={safePage}
        totalPages={totalPages}
        totalItems={filtered.length}
        pageSize={PAGE_SIZE}
        onPage={setCurrentPage}
      />

      {/* Priority modal */}
      {priorityModalOpen && (
        <PriorityModal
          initialOrder={priorityOrder}
          onClose={() => setPriorityModalOpen(false)}
          onSave={order => setPriorityOrder(order)}
        />
      )}
    </div>
  )
}

function ProgramRow({ campaign, priority, onSelect, highlighted, overrideExtras }: {
  campaign: Campaign
  priority: string
  onSelect: () => void
  highlighted?: boolean
  overrideExtras?: { updatedOn: string; updatedBy: string; status?: string }
}) {
  const extra = deriveProgramRow(campaign)
  const statusLabel = overrideExtras?.status ?? (overrideExtras ? 'Active' : extra.statusLabel)
  const tone = STATUS_TONE[statusLabel] ?? 'neutral'
  const updatedOn = overrideExtras?.updatedOn ?? extra.updatedOn
  const updatedBy = overrideExtras?.updatedBy ?? extra.updatedBy

  const [hovered, setHovered] = useState(false)
  const bg = highlighted
    ? 'var(--lyra-color-bg-active-subtle)'
    : hovered ? 'var(--lyra-color-state-bg-hover-opacity)' : ''

  return (
    <tr
      onClick={onSelect}
      style={{ borderBottom: '1px solid var(--lyra-color-border-subtle)', cursor: 'pointer', background: bg, transition: 'background 0.2s' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Td>
        <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)' }}>
          {priority}
        </span>
      </Td>
      <Td>
        <span style={{ fontWeight: 500, color: 'var(--lyra-color-fg-link)' }}>{campaign.name}</span>
      </Td>
      <Td>{campaign.category ? extra.survey : '-'}</Td>
      <Td>{campaign.channels.join(', ')}</Td>
      <Td>
        <span style={{ color: extra.alert === '-' ? 'var(--lyra-color-fg-secondary)' : 'var(--lyra-color-fg-default)' }}>
          {extra.alert}
        </span>
      </Td>
      <Td>{updatedOn}</Td>
      <Td>{updatedBy}</Td>
      <Td><StatusPill label={statusLabel} tone={tone} /></Td>
      <Td align="right">
        <RowKebabMenu status={statusLabel.toLowerCase() as 'active' | 'inactive' | 'draft'} />
      </Td>
    </tr>
  )
}
