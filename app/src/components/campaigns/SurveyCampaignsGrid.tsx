// SurveyCampaignsGrid — main campaigns table with filtering, sorting, bulk
// selection, delete, priority reorder modal, and working-copy flows.
// Ported 1-to-1 from public/prototype.html lines 6895–7276.
// CSS classes (pane, pane-head, toolbar, table-wrap, fi-pill, filter-chip,
// row-action-menu, ly-modal-*, etc.) come from the global stylesheet.

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { Campaign } from '../../types/index'
import { CAMPAIGNS } from '../../data/campaigns'
import { StatusPill } from './StatusPill'

// ---------------------------------------------------------------------------
// WorkingCopyChip
// ---------------------------------------------------------------------------

export function WorkingCopyChip() {
  return (
    <span className="fi-pill working" title="This campaign has unpublished changes">
      <svg
        viewBox="0 0 24 24"
        width="10"
        height="10"
        stroke="currentColor"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
      </svg>
      Working Copy
    </span>
  )
}

// ---------------------------------------------------------------------------
// CampaignStateInline
// ---------------------------------------------------------------------------

interface CampaignStateInlineProps {
  status: string
  hasWorkingCopy?: boolean
}

export function CampaignStateInline({ status, hasWorkingCopy }: CampaignStateInlineProps) {
  if (status === 'expired') return null

  let dotClass: string
  let label: string
  let color: string

  if (status === 'inactive') {
    dotClass = 'draft'
    label = 'Draft'
    color = 'var(--lyra-slate-600)'
  } else if (hasWorkingCopy) {
    dotClass = 'working'
    label = 'Working Copy'
    color = 'var(--lyra-purple-700)'
  } else {
    dotClass = 'live'
    label = 'Live'
    color = 'var(--lyra-green-700)'
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        font: '500 12px/16px var(--font-sans)',
        color,
      }}
    >
      <span className={`cs-dot ${dotClass}`} />
      {label}
    </span>
  )
}

// ---------------------------------------------------------------------------
// FilterChip
// ---------------------------------------------------------------------------

interface FilterChipProps {
  label: string
  value: string | null
  options: string[]
  onSelect: (opt: string) => void
  onClear: () => void
}

export function FilterChip({ label, value, options, onSelect, onClear }: FilterChipProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const isActive = value != null && value !== ''

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  return (
    <div className={`filter-chip ${isActive ? 'active' : 'muted'}`} ref={ref}>
      <span className="filter-chip-trigger" onClick={() => setOpen((o) => !o)}>
        <span>
          {label}
          {isActive ? ':' : ''}
        </span>
        {isActive && <span className="filter-chip-value">{value}</span>}
        <svg className="chev" viewBox="0 0 16 16">
          <polyline
            points="4 6 8 10 12 6"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {isActive && (
        <button className="filter-chip-x" onClick={onClear} title={`Remove ${label} filter`}>
          <svg viewBox="0 0 16 16">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeLinecap="round" />
          </svg>
        </button>
      )}
      {open && (
        <div className="filter-chip-menu">
          {options.map((opt) => (
            <button
              key={opt}
              className={`filter-chip-menu-item ${opt === value ? 'selected' : ''}`}
              onClick={() => {
                onSelect(opt)
                setOpen(false)
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// RowActions (kebab menu)
// ---------------------------------------------------------------------------

interface RowActionsProps {
  campaign: Campaign
  statusOf: (c: Campaign) => string
  onActivate: (id: number) => void
  onDeactivate: (id: number) => void
  onDelete: (id: number) => void
  onEdit: (c: Campaign) => void
}

export function RowActions({
  campaign,
  statusOf,
  onActivate,
  onDeactivate,
  onDelete,
  onEdit,
}: RowActionsProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const s = statusOf(campaign)

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  return (
    <div
      ref={ref}
      style={{ position: 'relative', display: 'inline-flex' }}
      onClick={(e) => e.stopPropagation()}
    >
      <button className="kebab" onClick={() => setOpen((o) => !o)} title="Actions">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" stroke="none">
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>

      {open && (
        <div className="row-action-menu">
          <button
            className="row-action-item"
            onClick={() => {
              onEdit(campaign)
              setOpen(false)
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              stroke="currentColor"
              fill="none"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
            </svg>
            Edit
          </button>

          {s !== 'active' && (
            <button
              className="row-action-item"
              onClick={() => {
                onActivate(campaign.id)
                setOpen(false)
              }}
            >
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                stroke="currentColor"
                fill="none"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Activate
            </button>
          )}

          {s === 'active' && (
            <button
              className="row-action-item"
              onClick={() => {
                onDeactivate(campaign.id)
                setOpen(false)
              }}
            >
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                stroke="currentColor"
                fill="none"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
              Deactivate
            </button>
          )}

          <div className="row-action-divider" />

          <button
            className={`row-action-item danger${
              s === 'active' || s === 'expired' ? ' disabled' : ''
            }`}
            disabled={s === 'active' || s === 'expired'}
            title={
              s === 'active'
                ? 'Deactivate the campaign before deleting'
                : s === 'expired'
                  ? 'Expired campaigns cannot be deleted'
                  : undefined
            }
            onClick={() => {
              if (s !== 'active' && s !== 'expired') {
                onDelete(campaign.id)
                setOpen(false)
              }
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              stroke="currentColor"
              fill="none"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
            </svg>
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// SurveyCampaignsGrid
// ---------------------------------------------------------------------------

interface SurveyCampaignsGridProps {
  onCreate?: () => void
  onOpen?: (c: Campaign) => void
  onEdit?: (c: Campaign) => void
  newCampaigns?: Campaign[]
}

type SortKey = 'updated' | 'priority' | 'endDate'
type SortDir = 'asc' | 'desc'

export function SurveyCampaignsGrid({
  onCreate,
  onOpen,
  onEdit,
  newCampaigns = [],
}: SurveyCampaignsGridProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [order, setOrder] = useState<number[]>(() => CAMPAIGNS.map((c) => c.id))
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set())
  const [priorityModalOpen, setPriorityModalOpen] = useState(false)
  const [modalOrder, setModalOrder] = useState<number[]>([])
  const [modalDragId, setModalDragId] = useState<number | null>(null)
  const [modalDropBeforeId, setModalDropBeforeId] = useState<number | null>(null)
  const [statusOverride, setStatusOverride] = useState<Record<number, string>>({})
  const [deletedIds, setDeletedIds] = useState<Set<number>>(() => new Set())
  const [updatedTs, setUpdatedTs] = useState<Record<number, number>>({})
  const [sortKey, setSortKey] = useState<SortKey>('updated')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  // ---- helpers ----

  const statusOf = (c: Campaign): string => statusOverride[c.id] ?? c.status

  const toggleSelect = (id: number) =>
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const clearSelection = () => setSelectedIds(new Set())

  const selCount = selectedIds.size

  const selectedRows = () =>
    [...selectedIds].map((id) => CAMPAIGNS.find((c) => c.id === id)).filter(Boolean) as Campaign[]

  const canActivate =
    selCount > 0 && selectedRows().some((c) => statusOf(c) !== 'active' && statusOf(c) !== 'expired')
  const canDeactivate = selCount > 0 && selectedRows().some((c) => statusOf(c) === 'active')
  const canDelete = selCount > 0

  const bulkSetStatus = (status: string) => {
    const now = performance.now()
    setStatusOverride((prev) => {
      const next = { ...prev }
      selectedRows().forEach((c) => {
        if (status === 'active' && statusOf(c) === 'expired') return
        next[c.id] = status
      })
      return next
    })
    setUpdatedTs((prev) => {
      const next = { ...prev }
      selectedRows().forEach((c) => {
        next[c.id] = now
      })
      return next
    })
    clearSelection()
  }

  const bulkDelete = () => {
    setDeletedIds((prev) => {
      const next = new Set(prev)
      selectedIds.forEach((id) => next.add(id))
      return next
    })
    clearSelection()
  }

  const rowActivate = (id: number) => {
    const now = performance.now()
    setStatusOverride((prev) => ({ ...prev, [id]: 'active' }))
    setUpdatedTs((prev) => ({ ...prev, [id]: now }))
  }

  const rowDeactivate = (id: number) => {
    const now = performance.now()
    setStatusOverride((prev) => ({ ...prev, [id]: 'inactive' }))
    setUpdatedTs((prev) => ({ ...prev, [id]: now }))
  }

  const rowDelete = (id: number) => {
    const c = CAMPAIGNS.find((x) => x.id === id)
    if (!window.confirm(`Delete "${c?.name}"? This cannot be undone.`)) return
    setDeletedIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  // Routing-active = active + inactive. Expired/deleted don't get priority.
  const isRouting = (c: Campaign) => {
    if (deletedIds.has(c.id)) return false
    const s = statusOf(c)
    return s === 'active' || s === 'inactive'
  }

  const orderedAll: Campaign[] = [
    ...order.map((id) => CAMPAIGNS.find((c) => c.id === id)).filter(Boolean) as Campaign[],
    ...newCampaigns,
  ]

  const priorityMap: Record<number, number> = {}
  let p = 0
  orderedAll.forEach((c) => {
    if (isRouting(c)) {
      p++
      priorityMap[c.id] = p
    }
  })

  function openPriorityModal() {
    const routingIds = orderedAll.filter((c) => isRouting(c)).map((c) => c.id)
    setModalOrder(routingIds)
    setPriorityModalOpen(true)
  }

  function modalReorder(srcId: number, beforeId: number | null) {
    if (srcId === beforeId) return
    const next = modalOrder.filter((id) => id !== srcId)
    if (beforeId == null) next.push(srcId)
    else {
      const i = next.indexOf(beforeId)
      next.splice(i, 0, srcId)
    }
    setModalOrder(next)
  }

  function handleSaveModal() {
    setOrder([...modalOrder, ...order.filter((id) => !modalOrder.includes(id))])
    setPriorityModalOpen(false)
  }

  // ---- filter / sort ----

  const statusOptions = ['Active', 'Inactive', 'Expired']
  const hasAnyFilter = !!(search || statusFilter)
  const clearAllFilters = () => {
    setSearch('')
    setStatusFilter(null)
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const filteredRows = orderedAll.filter((c) => {
    if (deletedIds.has(c.id)) return false
    const s = statusOf(c)
    const filterVal =
      statusFilter === 'Inactive'
        ? 'inactive'
        : statusFilter === 'Expired'
          ? 'expired'
          : statusFilter?.toLowerCase() ?? null
    if (filterVal && s !== filterVal) return false
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const rows = [...filteredRows].sort((a, b) => {
    let av: number | string | undefined
    let bv: number | string | undefined

    if (sortKey === 'updated') {
      const tsA = updatedTs[a.id] ?? (a.isNew ? a.id : null)
      const tsB = updatedTs[b.id] ?? (b.isNew ? b.id : null)
      if (tsA !== null || tsB !== null) {
        const ta = tsA ?? -Infinity
        const tb = tsB ?? -Infinity
        if (ta !== tb) return sortDir === 'asc' ? (ta as number) - (tb as number) : (tb as number) - (ta as number)
      }
      av = a.updated
      bv = b.updated
    }

    if (sortKey === 'priority') {
      const activeOnly = (c: Campaign) => statusOf(c) === 'active'
      av = activeOnly(a) ? (priorityMap[a.id] ?? 999) : 999
      bv = activeOnly(b) ? (priorityMap[b.id] ?? 999) : 999
    }

    if (sortKey === 'endDate') {
      av = a.endDate ?? 'zzz'
      bv = b.endDate ?? 'zzz'
    }

    if (av === undefined) return 0
    if (av < bv!) return sortDir === 'asc' ? -1 : 1
    if (av > bv!) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  const allRowsSelected = rows.length > 0 && rows.every((r) => selectedIds.has(r.id))
  const someRowsSelected = rows.some((r) => selectedIds.has(r.id)) && !allRowsSelected

  // ---- SortIcon ----

  function SortIcon({ k }: { k: SortKey }) {
    const active = sortKey === k
    return (
      <svg
        viewBox="0 0 16 16"
        width="12"
        height="12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          marginLeft: 4,
          verticalAlign: '-1px',
          opacity: active ? 1 : 0.3,
          color: active ? 'var(--color-fg-action)' : 'currentColor',
          flexShrink: 0,
        }}
      >
        {(!active || sortDir === 'asc') && (
          <polyline points="4 10 8 6 12 10" style={{ opacity: active && sortDir === 'asc' ? 1 : 0.4 }} />
        )}
        {(!active || sortDir === 'desc') && (
          <polyline points="4 6 8 10 12 6" style={{ opacity: active && sortDir === 'desc' ? 1 : 0.4 }} />
        )}
      </svg>
    )
  }

  // ---- render ----

  return (
    <div className="pane">
      {/* Header */}
      <div className="pane-head">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          Survey Campaigns
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 22,
              minWidth: 22,
              padding: '0 var(--space-2)',
              borderRadius: 'var(--radius-round)',
              background: 'var(--lyra-slate-200)',
              color: 'var(--lyra-slate-700)',
              font: '500 12px/16px var(--font-sans)',
              letterSpacing: '0.01rem',
            }}
          >
            {rows.length}
          </span>
        </h1>
        <div className="head-actions">
          <button className="btn" onClick={openPriorityModal}>
            Set Priority for Campaigns
          </button>
          <button className="btn primary" onClick={onCreate}>
            <svg viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create Campaign
          </button>
        </div>
      </div>

      {/* Bulk action bar — shown when rows are selected */}
      {selCount > 0 && (
        <div className="bulk-bar">
          <span className="bulk-count">{selCount} selected</span>
          {canActivate && (
            <button className="btn sm" onClick={() => bulkSetStatus('active')}>
              Activate
            </button>
          )}
          {canDeactivate && (
            <button className="btn sm" onClick={() => bulkSetStatus('inactive')}>
              Deactivate
            </button>
          )}
          {canDelete && (
            <button className="btn sm danger" onClick={bulkDelete}>
              Delete
            </button>
          )}
          <button className="btn sm ghost" onClick={clearSelection}>
            Clear selection
          </button>
        </div>
      )}

      {/* Filter toolbar */}
      <div className="toolbar">
        <div className="search">
          <svg viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            placeholder="Search campaigns"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <FilterChip
          label="Status"
          value={statusFilter}
          options={statusOptions}
          onSelect={setStatusFilter}
          onClear={() => setStatusFilter(null)}
        />
        {hasAnyFilter && (
          <button className="clear-link" onClick={clearAllFilters}>
            Clear
          </button>
        )}
      </div>

      {/* Campaigns table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th
                style={{ width: 40 }}
              >
                <input
                  type="checkbox"
                  aria-label="Select all campaigns"
                  checked={allRowsSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someRowsSelected
                  }}
                  onChange={() => {
                    if (allRowsSelected) {
                      setSelectedIds(new Set())
                    } else {
                      setSelectedIds(new Set(rows.map((r) => r.id)))
                    }
                  }}
                />
              </th>
              <th
                style={{ width: 110, cursor: 'pointer', userSelect: 'none' }}
                onClick={() => toggleSort('priority')}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                  Priority
                  <SortIcon k="priority" />
                </span>
              </th>
              <th>Campaign Name</th>
              <th
                style={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() => toggleSort('endDate')}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                  Period
                  <SortIcon k="endDate" />
                </span>
              </th>
              <th
                style={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() => toggleSort('updated')}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                  Last updated
                  <SortIcon k="updated" />
                </span>
              </th>
              <th>Campaign Status</th>
              <th style={{ width: 52 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const routing = isRouting(c)
              const showPriority = routing && statusOf(c) === 'active'
              const s = statusOf(c)
              const isSelected = selectedIds.has(c.id)

              return (
                <tr
                  key={c.id}
                  className={[
                    c.isNew ? 'new-campaign-row' : '',
                    isSelected ? 'selected' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`Select ${c.name}`}
                      checked={isSelected}
                      onChange={() => toggleSelect(c.id)}
                    />
                  </td>
                  <td>
                    {showPriority ? (
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: 32,
                          height: 22,
                          padding: '0 var(--space-2)',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--color-bg-active-moderate)',
                          color: 'var(--color-fg-active-strong)',
                          font: '600 14px/14px var(--font-sans)',
                          letterSpacing: 0,
                        }}
                      >
                        P{priorityMap[c.id]}
                      </div>
                    ) : (
                      <span
                        style={{
                          color: 'var(--lyra-slate-400)',
                          font: '600 14px/20px var(--font-sans)',
                        }}
                      >
                        —
                      </span>
                    )}
                  </td>
                  <td>
                    <a
                      className="agent-link"
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        onOpen && onOpen(c)
                      }}
                    >
                      {c.name}
                    </a>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <CampaignStateInline status={s} hasWorkingCopy={c.hasWorkingCopy} />
                      {s !== 'expired' && (
                        <span
                          style={{
                            width: 1,
                            height: 10,
                            background: 'rgba(0,0,0,0.15)',
                            flexShrink: 0,
                          }}
                        />
                      )}
                      <span
                        style={{
                          font: '400 12px/16px var(--font-sans)',
                          color: 'var(--color-fg-secondary)',
                        }}
                      >
                        Created {c.created}, {c.owner}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        font: '400 14px/20px var(--font-sans)',
                        color: 'var(--color-fg-default)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {c.created} –{' '}
                      {c.endDate ?? (
                        <span
                          style={{
                            color: 'var(--color-fg-secondary)',
                            fontStyle: 'italic',
                          }}
                        >
                          Ongoing
                        </span>
                      )}
                    </span>
                  </td>
                  <td>
                    <div>{c.updated}</div>
                    <div
                      style={{
                        font: '400 12px/16px var(--font-sans)',
                        color: 'var(--color-fg-secondary)',
                        marginTop: 4,
                      }}
                    >
                      by {c.owner}
                    </div>
                  </td>
                  <td>
                    <StatusPill s={s} />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <RowActions
                      campaign={c}
                      statusOf={statusOf}
                      onActivate={rowActivate}
                      onDeactivate={rowDeactivate}
                      onDelete={rowDelete}
                      onEdit={onEdit ?? onOpen ?? (() => {})}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Campaign Priority Modal */}
      {priorityModalOpen &&
        createPortal(
          <div className="ly-modal-backdrop" onClick={() => setPriorityModalOpen(false)}>
            <div className="ly-modal" onClick={(e) => e.stopPropagation()}>
              <div className="ly-modal-head">
                <div className="ly-modal-title">Prioritise Campaigns</div>
                <button className="ly-modal-close" onClick={() => setPriorityModalOpen(false)}>
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    stroke="currentColor"
                    fill="none"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="ly-modal-body">
                <div className="ly-modal-desc">
                  Drag rows to set routing priority. When an interaction matches multiple campaigns,
                  the lower-numbered campaign wins.
                </div>
                <table className="priority-modal-table">
                  <thead>
                    <tr>
                      <th style={{ width: 36, padding: 0 }} />
                      <th style={{ width: 130 }}>Priority</th>
                      <th>Campaign</th>
                      <th>Channels</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalOrder.map((id, idx) => {
                      const c = CAMPAIGNS.find((x) => x.id === id)
                      if (!c) return null
                      const isDragging = modalDragId === id
                      const dropAbove = modalDropBeforeId === id
                      return (
                        <tr
                          key={id}
                          draggable
                          onDragStart={(e) => {
                            setModalDragId(id)
                            e.dataTransfer.effectAllowed = 'move'
                            e.dataTransfer.setData('text/plain', String(id))
                          }}
                          onDragOver={(e) => {
                            if (modalDragId == null) return
                            e.preventDefault()
                            e.dataTransfer.dropEffect = 'move'
                            const rect = e.currentTarget.getBoundingClientRect()
                            const above = e.clientY - rect.top < rect.height / 2
                            setModalDropBeforeId(above ? id : (modalOrder[idx + 1] ?? null))
                          }}
                          onDrop={(e) => {
                            e.preventDefault()
                            if (modalDragId != null) modalReorder(modalDragId, modalDropBeforeId)
                            setModalDragId(null)
                            setModalDropBeforeId(null)
                          }}
                          onDragEnd={() => {
                            setModalDragId(null)
                            setModalDropBeforeId(null)
                          }}
                          style={{
                            opacity: isDragging ? 0.35 : 1,
                            boxShadow: dropAbove
                              ? 'inset 0 2px 0 var(--fi-accent-strong)'
                              : undefined,
                          }}
                        >
                          <td
                            style={{
                              padding: 0,
                              textAlign: 'center',
                              color: 'var(--lyra-slate-400)',
                              cursor: 'grab',
                            }}
                          >
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                              <circle cx="9" cy="6" r="1.3" />
                              <circle cx="15" cy="6" r="1.3" />
                              <circle cx="9" cy="12" r="1.3" />
                              <circle cx="15" cy="12" r="1.3" />
                              <circle cx="9" cy="18" r="1.3" />
                              <circle cx="15" cy="18" r="1.3" />
                            </svg>
                          </td>
                          <td>
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minWidth: 32,
                                height: 22,
                                padding: '0 var(--space-2)',
                                borderRadius: 'var(--radius-sm)',
                                background: 'var(--color-bg-active-moderate)',
                                color: 'var(--color-fg-active-strong)',
                                font: '600 14px/14px var(--font-sans)',
                              }}
                            >
                              {idx + 1}
                            </div>
                          </td>
                          <td>
                            <div
                              style={{
                                font: '500 14px/20px var(--font-sans)',
                                color: 'var(--color-fg-default)',
                              }}
                            >
                              {c.name}
                            </div>
                          </td>
                          <td
                            style={{
                              whiteSpace: 'nowrap',
                              font: '400 13px/20px var(--font-sans)',
                              color: 'var(--color-fg-default)',
                            }}
                          >
                            {c.channels.map((k: string) => (k === 'voice' ? 'Voice' : 'Digital')).join(', ')}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="ly-modal-foot">
                <button className="btn" onClick={() => setPriorityModalOpen(false)}>
                  Cancel
                </button>
                <button className="btn primary" onClick={handleSaveModal}>
                  Save priority
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
