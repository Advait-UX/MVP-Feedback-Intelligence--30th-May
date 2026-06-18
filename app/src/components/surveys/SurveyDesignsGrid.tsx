// SurveyDesignsGrid — table view of all survey template designs.
// Port of SurveyDesignsGrid from prototype.html §9750–9898.
// Uses only Lyra CSS custom-property tokens; no hardcoded colours.

import { useState, useRef, useEffect } from 'react'
import { Plus, Search, MoreVertical, Pencil, Trash2, ArrowUp, ArrowDown } from 'lucide-react'
import type { SurveyDesignTemplate } from '../../types'
import { SURVEY_DESIGNS } from '../../data/surveys'

type SortKey = 'name' | 'updated'
type SortDir = 'asc' | 'desc'

// ---------------------------------------------------------------------------
// DesignRowActions — kebab menu with Edit / Delete options.
// ---------------------------------------------------------------------------

interface DesignRowActionsProps {
  design: SurveyDesignTemplate
  onEdit: (d: SurveyDesignTemplate) => void
  onDelete: (id: string) => void
  deleteDisabled: boolean
}

function DesignRowActions({ design, onEdit, onDelete, deleteDisabled }: DesignRowActionsProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleDocClick)
    return () => document.removeEventListener('mousedown', handleDocClick)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}
      onClick={e => e.stopPropagation()}>
      <button
        aria-label="More actions"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
          height: 28,
          borderRadius: 'var(--radius-sm)',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          color: 'var(--lyra-color-fg-disabled)',
          transition: 'background 100ms',
        }}
        onMouseEnter={e => { (e.currentTarget).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
        onMouseLeave={e => { (e.currentTarget).style.background = 'transparent' }}
        onFocus={e => {
          (e.currentTarget).style.outline = '2px solid var(--lyra-color-border-focus-default)'
          ;(e.currentTarget).style.outlineOffset = '2px'
        }}
        onBlur={e => { (e.currentTarget).style.outline = '' }}
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            right: 0,
            top: '100%',
            marginTop: 4,
            zIndex: 50,
            background: 'var(--lyra-color-bg-surface-overlay)',
            border: '1px solid var(--lyra-color-border-soft)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--sol-effect-shadowlg)',
            minWidth: 140,
            padding: '4px 0',
            fontFamily: 'var(--font-sans)',
          }}
        >
          <button
            role="menuitem"
            onClick={() => { onEdit(design); setOpen(false) }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              padding: '8px 12px',
              background: 'transparent',
              border: 'none',
              font: '400 14px/20px var(--font-sans)',
              color: 'var(--lyra-color-fg-default)',
              cursor: 'pointer',
              textAlign: 'left',
            }}
            onMouseEnter={e => { (e.currentTarget).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
            onMouseLeave={e => { (e.currentTarget).style.background = 'transparent' }}
          >
            <Pencil size={14} style={{ color: 'var(--lyra-color-fg-action)', flexShrink: 0 }} />
            Edit
          </button>

          <div style={{ height: 1, background: 'var(--lyra-color-border-subtle)', margin: '2px 0' }} />

          <button
            role="menuitem"
            disabled={deleteDisabled}
            onClick={() => { if (!deleteDisabled) { onDelete(design.id); setOpen(false) } }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              padding: '8px 12px',
              background: 'transparent',
              border: 'none',
              font: '400 14px/20px var(--font-sans)',
              color: deleteDisabled ? 'var(--lyra-color-fg-disabled)' : 'var(--lyra-color-status-critical-strong)',
              cursor: deleteDisabled ? 'not-allowed' : 'pointer',
              opacity: deleteDisabled ? 0.4 : 1,
              textAlign: 'left',
            }}
            onMouseEnter={e => {
              if (!deleteDisabled) {
                (e.currentTarget).style.background = 'var(--lyra-color-status-critical-subtle)'
              }
            }}
            onMouseLeave={e => { (e.currentTarget).style.background = 'transparent' }}
          >
            <Trash2 size={14} style={{ flexShrink: 0 }} />
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// SortIcon — renders asc/desc chevron pair, highlights active direction.
// ---------------------------------------------------------------------------

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  const activeFg = 'var(--lyra-color-fg-action)'
  const dimFg = 'var(--lyra-color-fg-disabled)'

  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', marginLeft: 4, verticalAlign: 'middle', flexShrink: 0 }}>
      <ArrowUp
        size={9}
        style={{
          color: active && dir === 'asc' ? activeFg : dimFg,
          opacity: active ? 1 : 0.3,
          display: 'block',
          marginBottom: 1,
        }}
      />
      <ArrowDown
        size={9}
        style={{
          color: active && dir === 'desc' ? activeFg : dimFg,
          opacity: active ? 1 : 0.3,
          display: 'block',
        }}
      />
    </span>
  )
}

// ---------------------------------------------------------------------------
// SurveyDesignsGrid
// ---------------------------------------------------------------------------

interface SurveyDesignsGridProps {
  /** Newly created designs are prepended and highlighted. */
  newDesigns?: SurveyDesignTemplate[]
  onCreate: () => void
  onOpen: (d: SurveyDesignTemplate) => void
  onEdit: (d: SurveyDesignTemplate) => void
}

export function SurveyDesignsGrid({
  newDesigns = [],
  onCreate,
  onOpen,
  onEdit,
}: SurveyDesignsGridProps) {
  const [search, setSearch] = useState('')
  const [deletedIds, setDeletedIds] = useState<string[]>([])
  const [sortKey, setSortKey] = useState<SortKey>('updated')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const hasAnyFilter = !!search

  function clearFilters() {
    setSearch('')
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  // Combine new designs with seed designs; deduplicate by id.
  const allDesigns: SurveyDesignTemplate[] = [
    ...newDesigns,
    ...SURVEY_DESIGNS.filter(d => !newDesigns.some(n => n.id === d.id)),
  ]

  const rows = allDesigns
    .filter(d => {
      if (deletedIds.includes(d.id)) return false
      if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      // Newly saved designs float to top when sorting descending.
      if (sortDir === 'desc') {
        if (a.isNew && !b.isNew) return -1
        if (!a.isNew && b.isNew) return 1
      }
      const av = a.updated ?? ''
      const bv = b.updated ?? ''
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })

  const channelText = (d: SurveyDesignTemplate) => {
    if (d.channel === 'Both') return 'Digital, Voice'
    return d.channel ?? d.channels ?? 'Digital'
  }

  const FONT = 'var(--font-sans)'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        background: 'var(--lyra-color-bg-surface-base)',
        fontFamily: FONT,
      }}
    >
      {/* ── Pane header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 40,
          minHeight: 72,
          padding: '16px 32px',
          borderBottom: '1px solid var(--lyra-color-border-subtle)',
          flexShrink: 0,
        }}
      >
        <h1
          style={{
            flex: 1,
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            font: '600 20px/24px var(--font-sans)',
            letterSpacing: '-0.01em',
            color: 'var(--lyra-color-fg-default)',
          }}
        >
          Survey Templates
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 22,
              minWidth: 22,
              padding: '0 6px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--lyra-slate-200)',
              color: 'var(--lyra-slate-700)',
              font: '500 12px/16px var(--font-sans)',
            }}
          >
            {rows.length}
          </span>
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button
            onClick={onCreate}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              height: 36,
              padding: '0 16px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: 'var(--lyra-color-bg-primary)',
              color: 'var(--lyra-color-fg-on-primary)',
              font: '500 14px/20px var(--font-sans)',
              cursor: 'pointer',
              transition: 'background 120ms',
            }}
            onMouseEnter={e => { (e.currentTarget).style.background = 'var(--lyra-color-state-bg-hover-primary)' }}
            onMouseLeave={e => { (e.currentTarget).style.background = 'var(--lyra-color-bg-primary)' }}
            onFocus={e => {
              (e.currentTarget).style.outline = '2px solid var(--lyra-color-border-focus-default)'
              ;(e.currentTarget).style.outlineOffset = '2px'
            }}
            onBlur={e => { (e.currentTarget).style.outline = '' }}
          >
            <Plus size={16} aria-hidden="true" />
            New Survey Template
          </button>
        </div>
      </div>

      {/* ── Filter toolbar ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 24px',
          borderBottom: '1px solid var(--lyra-color-border-subtle)',
          background: 'var(--lyra-color-bg-surface-shell)',
          flexShrink: 0,
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', maxWidth: 280 }}>
          <Search
            size={14}
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--lyra-color-fg-disabled)',
              pointerEvents: 'none',
            }}
          />
          <input
            aria-label="Search templates"
            placeholder="Search by name"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              height: 34,
              width: 240,
              paddingLeft: 30,
              paddingRight: 10,
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--lyra-color-border-soft)',
              background: 'var(--lyra-color-bg-field)',
              color: 'var(--lyra-color-fg-default)',
              font: '400 14px/20px var(--font-sans)',
              outline: 'none',
            }}
            onFocus={e => {
              (e.currentTarget).style.borderColor = 'var(--lyra-color-border-active)'
              ;(e.currentTarget).style.boxShadow = '0 0 0 2px var(--lyra-brand-200)'
            }}
            onBlur={e => {
              (e.currentTarget).style.borderColor = 'var(--lyra-color-border-soft)'
              ;(e.currentTarget).style.boxShadow = ''
            }}
          />
        </div>

        {hasAnyFilter && (
          <button
            onClick={clearFilters}
            style={{
              background: 'none',
              border: 'none',
              padding: '0 4px',
              font: '400 13px/18px var(--font-sans)',
              color: 'var(--lyra-color-fg-link)',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* ── Table area ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Info banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            margin: '16px 24px 0',
            padding: '10px 14px',
            background: 'var(--lyra-color-status-info-subtle)',
            border: '1px solid rgba(45,91,185,0.18)',
            borderRadius: 'var(--radius-md)',
            font: '400 13px/18px var(--font-sans)',
            color: 'var(--lyra-color-status-info-strong)',
          }}
          role="status"
          aria-live="polite"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
            strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="12" cy="12" r="9"/>
            <path d="M12 16v-4M12 8h.01"/>
          </svg>
          <span>
            Reusable templates that define a survey's questions, display style, and delivery rules.
            Map one template to many campaigns — change the template once and every linked campaign picks it up.
          </span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', margin: '12px 0 0' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--lyra-color-border-subtle)' }}>
              <th
                style={{
                  padding: '8px 24px',
                  textAlign: 'left',
                  font: '500 12px/16px var(--font-sans)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--lyra-color-fg-secondary)',
                  background: 'var(--lyra-color-bg-surface-shell)',
                }}
                scope="col"
              >
                Survey Template
              </th>
              <th
                style={{
                  padding: '8px 24px',
                  textAlign: 'left',
                  font: '500 12px/16px var(--font-sans)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--lyra-color-fg-secondary)',
                  background: 'var(--lyra-color-bg-surface-shell)',
                }}
                scope="col"
              >
                Channels
              </th>
              <th
                scope="col"
                style={{
                  padding: '8px 24px',
                  textAlign: 'left',
                  font: '500 12px/16px var(--font-sans)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--lyra-color-fg-secondary)',
                  background: 'var(--lyra-color-bg-surface-shell)',
                  cursor: 'pointer',
                  userSelect: 'none',
                  whiteSpace: 'nowrap',
                }}
                onClick={() => toggleSort('updated')}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                  Last Updated
                  <SortIcon active={sortKey === 'updated'} dir={sortDir} />
                </span>
              </th>
              <th
                scope="col"
                style={{
                  padding: '8px 24px',
                  width: 52,
                  textAlign: 'center',
                  font: '500 12px/16px var(--font-sans)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--lyra-color-fg-secondary)',
                  background: 'var(--lyra-color-bg-surface-shell)',
                }}
              >
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    padding: '48px 24px',
                    textAlign: 'center',
                    font: '400 14px/20px var(--font-sans)',
                    color: 'var(--lyra-slate-400)',
                  }}
                >
                  No templates match the current filter.
                </td>
              </tr>
            ) : (
              rows.map(d => (
                <tr
                  key={d.id}
                  style={{
                    borderBottom: '1px solid var(--lyra-color-border-subtle)',
                    background: d.isNew ? 'var(--lyra-color-bg-active-subtle)' : 'transparent',
                    transition: 'background 100ms',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = d.isNew
                      ? 'var(--lyra-color-state-bg-hover-active-subtle)'
                      : 'var(--lyra-color-state-bg-hover-opacity)'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = d.isNew
                      ? 'var(--lyra-color-bg-active-subtle)'
                      : 'transparent'
                  }}
                >
                  {/* Name + description */}
                  <td style={{ padding: '12px 24px', maxWidth: 360 }}>
                    <button
                      onClick={() => onOpen(d)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        font: '500 14px/20px var(--font-sans)',
                        color: 'var(--lyra-color-fg-link)',
                        textDecoration: 'none',
                        textAlign: 'left',
                      }}
                      onFocus={e => {
                        (e.currentTarget).style.outline = '2px solid var(--lyra-color-border-focus-default)'
                        ;(e.currentTarget).style.outlineOffset = '2px'
                        ;(e.currentTarget).style.borderRadius = '2px'
                      }}
                      onBlur={e => { (e.currentTarget).style.outline = '' }}
                    >
                      {d.name}
                    </button>
                    {d.description && (
                      <div
                        style={{
                          font: '400 12px/16px var(--font-sans)',
                          letterSpacing: '0.01em',
                          color: 'var(--lyra-color-fg-secondary)',
                          marginTop: 4,
                          maxWidth: 340,
                        }}
                      >
                        {d.description}
                      </div>
                    )}
                  </td>

                  {/* Channels */}
                  <td style={{ padding: '12px 24px' }}>
                    <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>
                      {channelText(d)}
                    </span>
                  </td>

                  {/* Last updated */}
                  <td style={{ padding: '12px 24px' }}>
                    {d.updated ? (
                      <>
                        <div style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>
                          {d.updated}
                        </div>
                        {d.owner && (
                          <div style={{ font: '400 12px/16px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', marginTop: 2 }}>
                            by {d.owner}
                          </div>
                        )}
                      </>
                    ) : (
                      <span style={{ color: 'var(--lyra-color-fg-disabled)' }}>—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '12px 24px', textAlign: 'center' }}>
                    <DesignRowActions
                      design={d}
                      onEdit={onEdit}
                      onDelete={id => setDeletedIds(prev => [...prev, id])}
                      deleteDisabled={!!d.isDefault}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
