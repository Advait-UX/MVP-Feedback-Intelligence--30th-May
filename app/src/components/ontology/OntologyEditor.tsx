// OntologyEditor — the edit / new ontology form.
// Mirrors prototype.html lines 11198–11881 exactly:
//   - Leave guard (dirtyRef / refreshDoneRef / guardedNavigate / window.__FI_LEAVE_GUARD__)
//   - Refresh model flow (handleRefreshModel, refreshState, refreshDone, newlyAddedIds, removedIds)
//   - Pre-refresh warning banner (yellow) + post-refresh info banner (blue)
//   - Category grid with search, sort dropdown, and CategoryCard per item
//   - Footer with Cancel + Publish buttons
//   - Cancel-after-unsaved-changes warning modal (Lyra destructive variant)
//   - OntologyMetaStrip (edit mode metadata header)
//   - Toast notification
//   - New-ontology model selector

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Category, Ontology, TopicModel } from '../../types'
import {
  TOPIC_MODELS,
  CATEGORIES_BY_MODEL,
  REFRESHED_CATEGORIES,
  formatUpdatedAt,
} from '../../data/ontology'
import { CategoryCard } from './CategoryCard'
import '../../styles/ontology.css'

// ---------------------------------------------------------------------------
// Sort options — mirrors prototype.html SORT_OPTIONS constant
// ---------------------------------------------------------------------------
const SORT_OPTIONS = [
  { key: 'recent', label: 'Recently updated' },
  { key: 'az',     label: 'A → Z' },
  { key: 'za',     label: 'Z → A' },
  { key: 'low',    label: 'Lowest weight' },
  { key: 'high',   label: 'Highest weight' },
] as const

type SortKey = typeof SORT_OPTIONS[number]['key']

// ---------------------------------------------------------------------------
// OntologyMetaStrip — read-only metadata bar shown at top of edit mode.
// Mirrors prototype.html lines 11154–11196.
// ---------------------------------------------------------------------------

interface OntologyMetaStripProps {
  ontology: Ontology
}

function OntologyMetaStrip({ ontology }: OntologyMetaStripProps) {
  const campaigns = ontology.mappedCampaigns || []
  const labelStyle: React.CSSProperties = {
    font: '500 12px/16px var(--font-sans)',
    color: 'var(--color-fg-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 5,
  }
  const valueStyle: React.CSSProperties = {
    font: '400 14px/20px var(--font-sans)',
    color: 'var(--color-fg-default)',
  }
  const divider = (
    <div
      style={{
        width: 1,
        background: 'rgba(0,0,0,0.08)',
        alignSelf: 'stretch',
        flexShrink: 0,
      }}
    />
  )

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
        borderTop: '1px solid rgba(0,0,0,0.08)',
        borderBottom: '1px solid rgba(0,0,0,0.08)',
        padding: 'var(--space-4) 0',
        marginBottom: 32,
      }}
    >
      {/* Col 1 — Topic AI Model */}
      <div
        style={{
          flex: '0 0 220px',
          display: 'flex',
          flexDirection: 'column',
          paddingRight: 'var(--space-6)',
        }}
      >
        <span style={labelStyle}>Topic AI Model</span>
        <span style={valueStyle}>{ontology.modelName}</span>
      </div>

      {divider}

      {/* Col 2 — Mapped Campaigns */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '0 var(--space-6)',
          minWidth: 0,
        }}
      >
        <span style={labelStyle}>Mapped Campaigns</span>
        {campaigns.length === 0 ? (
          <span style={{ ...valueStyle, color: 'var(--color-fg-secondary)', fontStyle: 'italic' }}>
            None
          </span>
        ) : (
          <span style={valueStyle}>
            {campaigns.slice(0, 3).join(', ')}
            {campaigns.length > 3 && (
              <span style={{ color: 'var(--color-fg-link)', fontWeight: 500 }}>
                {' '}+{campaigns.length - 3} more
              </span>
            )}
          </span>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// OntologyEditor — main export
// ---------------------------------------------------------------------------

interface OntologyEditorProps {
  mode: 'edit' | 'new'
  ontology: Ontology | null
  configuredModelIds: string[]
  onCancel: () => void
  onPublish: (modelId: string, categories: Category[]) => void
}


export function OntologyEditor({
  mode,
  ontology,
  configuredModelIds,
  onCancel,
  onPublish,
}: OntologyEditorProps) {
  const isEdit = mode === 'edit'

  // ── Search + sort ──────────────────────────────────────────────────────────
  const [categorySearch, setCategorySearch] = useState('')
  const [categorySort, setCategorySort] = useState<SortKey>('recent')
  const [sortOpen, setSortOpen] = useState(false)
  const sortRef = useRef<HTMLDivElement>(null)

  // Dismiss sort dropdown when clicking outside
  useEffect(() => {
    if (!sortOpen) return
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [sortOpen])

  // ── Model selection (new mode only) ───────────────────────────────────────
  const [selectedModel, setSelectedModel] = useState<string>(
    ontology ? ontology.modelId : '',
  )

  // ── Categories ────────────────────────────────────────────────────────────
  const [categories, setCategories] = useState<Category[]>(
    ontology ? ontology.categories.map(c => ({ ...c })) : [],
  )

  // ── Dirty / leave-guard state ─────────────────────────────────────────────
  const [dirty, setDirty] = useState(false)

  // ── Refresh model state ───────────────────────────────────────────────────
  const [refreshState, setRefreshState] = useState<'idle' | 'refreshing' | 'done'>('idle')
  const [refreshDone, setRefreshDone] = useState(false)
  const [newlyAddedIds, setNewlyAddedIds] = useState<number[]>([])
  const [removedIds, setRemovedIds] = useState<number[]>([])

  // ── Warning modal (cancel with unsaved / refreshed changes) ───────────────
  const [showCancelWarning, setShowCancelWarning] = useState(false)
  const pendingNavAction = useRef<(() => void) | null>(null)

  // ── Toast ─────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ msg: string } | null>(null)

  // ── Refs — kept synchronously during render so guardedNavigate never stales
  const dirtyRef = useRef(false)
  const refreshDoneRef = useRef(false)
  dirtyRef.current = dirty
  refreshDoneRef.current = refreshDone

  // Auto-dismiss toast after 4 s
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  // ── guardedNavigate ────────────────────────────────────────────────────────
  // Intercepts navigation if there are unsaved changes or a pending refresh.
  const guardedNavigate = useCallback((action: () => void) => {
    if (dirtyRef.current || refreshDoneRef.current) {
      pendingNavAction.current = action
      setShowCancelWarning(true)
    } else {
      action()
    }
  }, [])

  // Register leave guard on window so sidebar + breadcrumb clicks go through it
  useEffect(() => {
    window.__FI_LEAVE_GUARD__ = guardedNavigate
    return () => {
      window.__FI_LEAVE_GUARD__ = null
    }
  }, [guardedNavigate])

  // ── Model change (new mode) ────────────────────────────────────────────────
  const handleModelChange = (newId: string) => {
    setSelectedModel(newId)
    const defaults = CATEGORIES_BY_MODEL[newId] || []
    setCategories(defaults.map(c => ({ ...c, weight: 1 })))
    setDirty(true)
    setNewlyAddedIds([])
  }

  // ── Per-category update ────────────────────────────────────────────────────
  const setCategory = (id: number, patch: Partial<Category>) => {
    setCategories(prev => prev.map(c => (c.id === id ? { ...c, ...patch } : c)))
    setDirty(true)
  }

  // ── Refresh model ──────────────────────────────────────────────────────────
  const handleRefreshModel = () => {
    if (refreshState !== 'idle' || refreshDone || !selectedModel) return
    setRefreshState('refreshing')
    setTimeout(() => {
      if (selectedModel === 'cx-quality') {
        const newCats     = REFRESHED_CATEGORIES.filter(c => c.isNew)
        const removedCats = REFRESHED_CATEGORIES.filter(c => c.isRemoved)
        const normalCats  = REFRESHED_CATEGORIES.filter(c => !c.isNew && !c.isRemoved)
        // Order: new → removed → rest (recently updated first)
        setCategories([...newCats, ...removedCats, ...normalCats].map(c => ({ ...c })))
        setNewlyAddedIds(newCats.map(c => c.id))
        setRemovedIds(removedCats.map(c => c.id))
        setDirty(true)
      }
      setRefreshState('done')
      setRefreshDone(true)
    }, 1400)
  }

  // ── Can publish? ──────────────────────────────────────────────────────────
  const canPublish = !!selectedModel && categories.length > 0 && (isEdit ? dirty : true)

  // ── Filtered + sorted category list ──────────────────────────────────────
  const q = categorySearch.trim().toLowerCase()
  const filtered = (q
    ? categories.filter(c => c.name.toLowerCase().includes(q))
    : categories
  ).slice().sort((a, b) => {
    if (categorySort === 'az')   return a.name.localeCompare(b.name)
    if (categorySort === 'za')   return b.name.localeCompare(a.name)
    if (categorySort === 'low')  return a.weight - b.weight
    if (categorySort === 'high') return b.weight - a.weight
    // 'recent': new first, then removed, then rest
    const rank = (x: Category) =>
      newlyAddedIds.includes(x.id) ? 0 : removedIds.includes(x.id) ? 1 : 2
    return rank(a) - rank(b)
  })

  // ── Available models for new-mode selector ────────────────────────────────
  const availableModels: TopicModel[] = TOPIC_MODELS.filter(
    m => !configuredModelIds.includes(m.id),
  )
  const nothingLeft = availableModels.length === 0

  return (
    <div className="pane" style={{ overflow: 'hidden' }}>

      {/* ── Pane header ───────────────────────────────────────────────────── */}
      <div
        className="pane-head"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div>
          {/* Back breadcrumb */}
          <button
            onClick={() => guardedNavigate(onCancel)}
            style={{
              all: 'unset',
              cursor: 'pointer',
              color: 'var(--color-fg-secondary)',
              font: '500 12px/16px var(--font-sans)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              marginBottom: 6,
            }}
          >
            ← Back to ontologies
          </button>
          <h1 style={{ margin: 0 }}>
            {isEdit ? 'Edit Ontology' : 'Configure New Ontology'}
          </h1>
        </div>

        {/* Refresh Model button — hidden once refresh is done */}
        {!refreshDone && (
          <button
            onClick={handleRefreshModel}
            disabled={refreshState !== 'idle' || !selectedModel}
            title="Pull the latest categories from Topic AI"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--color-bg-primary)',
              border: 'none',
              color: 'var(--color-fg-on-primary)',
              font: '500 13px/20px var(--font-sans)',
              padding: '6px 14px',
              borderRadius: 'var(--radius-md)',
              cursor: refreshState === 'idle' && selectedModel ? 'pointer' : 'default',
              opacity: !selectedModel || refreshState === 'refreshing' ? 0.55 : 1,
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
              <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14" />
            </svg>
            {refreshState === 'refreshing' ? 'Refreshing…' : 'Refresh Model'}
          </button>
        )}
      </div>

      {/* ── Scrollable body ───────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 'var(--space-6) var(--space-8) var(--space-8)',
        }}
      >

        {/* Pre-refresh warning banner — yellow */}
        {isEdit && ontology?.hasUpstreamChanges && !refreshDone && (
          <div
            style={{
              background: 'var(--lyra-yellow-50)',
              border: '1px solid rgba(248,161,10,0.4)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-3) var(--space-4)',
              marginBottom: 'var(--space-6)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'var(--space-3)',
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--lyra-yellow-700)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0, marginTop: 2 }}
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-yellow-700)' }}>
              <strong>Topic AI has new updates for this model.</strong> Click{' '}
              <strong>Refresh Model</strong> at the top right to pull the latest categories before
              publishing.
            </div>
          </div>
        )}

        {/* Post-refresh info banner — blue */}
        {refreshDone && newlyAddedIds.length > 0 && (
          <div
            style={{
              background: 'var(--lyra-color-status-info-subtle)',
              border: '1px solid rgba(45,91,185,0.2)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-3) var(--space-4)',
              marginBottom: 'var(--space-6)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'var(--space-3)',
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--lyra-color-status-info-strong)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0, marginTop: 2 }}
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div
              style={{
                font: '400 14px/24px var(--font-sans)',
                color: 'var(--lyra-color-status-info-strong)',
              }}
            >
              <strong>
                {newlyAddedIds.length} new{' '}
                {newlyAddedIds.length === 1 ? 'category has' : 'categories have'} been added
              </strong>{' '}
              and{' '}
              <strong>
                {removedIds.length}{' '}
                {removedIds.length === 1 ? 'category' : 'categories'} will be removed
              </strong>{' '}
              from this model. Click <strong>Publish changes</strong> below to apply these updates.
            </div>
          </div>
        )}

        {/* Read-only metadata strip (edit mode) or model selector (new mode) */}
        {isEdit && ontology ? (
          <OntologyMetaStrip ontology={ontology} />
        ) : (
          <div style={{ marginBottom: 40 }}>
            <label className="field-label" style={{ marginBottom: 6 }}>
              Topic AI Model
            </label>
            <select
              className="ont-model-select"
              value={selectedModel}
              disabled={nothingLeft}
              onChange={e => handleModelChange(e.target.value)}
              style={
                nothingLeft
                  ? {
                      background: 'rgba(0,0,0,0.04)',
                      color: 'var(--color-fg-secondary)',
                      cursor: 'not-allowed',
                      borderColor: 'rgba(0,0,0,0.10)',
                    }
                  : undefined
              }
            >
              {!selectedModel && (
                <option value="">
                  {nothingLeft
                    ? 'All Topic AI Models are configured'
                    : 'Select a Topic AI Model…'}
                </option>
              )}
              {availableModels.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <p className="hint" style={{ margin: '6px 0 0' }}>
              {nothingLeft
                ? 'Every Topic AI Model already has an ontology. Edit an existing row to update its weights.'
                : 'Only models without an ontology yet are shown. Choose one to load its categories with default weight = 5.'}
            </p>
          </div>
        )}

        {/* Category grid — shown only when a model is selected and has categories */}
        {selectedModel && categories.length > 0 ? (
          <>
            {/* Section header: label + count + search + sort */}
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                }}
              >
                {/* Count badges */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      font: '500 12px/16px var(--font-sans)',
                      color: 'var(--color-fg-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Categories
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: 20,
                      height: 20,
                      padding: '0 6px',
                      font: '500 12px/16px var(--font-sans)',
                      color: 'var(--lyra-slate-700)',
                      background: 'var(--lyra-slate-200)',
                      borderRadius: 999,
                    }}
                  >
                    {categories.length}
                  </span>

                  {refreshDone && newlyAddedIds.length > 0 && (
                    <>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          height: 20,
                          padding: '0 8px',
                          font: '500 11px/1 var(--font-sans)',
                          letterSpacing: '0.03em',
                          color: 'var(--lyra-color-status-success-strong)',
                          background: 'var(--lyra-color-status-success-subtle)',
                          border: '1px solid var(--lyra-color-status-success-medium)',
                          borderRadius: 999,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {newlyAddedIds.length} New
                      </span>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          height: 20,
                          padding: '0 8px',
                          font: '500 11px/1 var(--font-sans)',
                          letterSpacing: '0.03em',
                          color: 'var(--lyra-color-status-critical-strong)',
                          background: 'var(--lyra-color-status-critical-subtle)',
                          border: '1px solid var(--lyra-color-status-critical-medium)',
                          borderRadius: 999,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {removedIds.length} Removed
                      </span>
                    </>
                  )}
                </div>

                <div style={{ flex: 1 }} />

                {/* Lyra-standard search */}
                <div className="search" style={{ flex: '0 0 240px' }}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search categories…"
                    value={categorySearch}
                    onChange={e => setCategorySearch(e.target.value)}
                  />
                </div>

                {/* Sort dropdown */}
                <div ref={sortRef} style={{ position: 'relative' }}>
                  <button
                    onClick={() => setSortOpen(o => !o)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      height: 32,
                      padding: '0 12px',
                      font: '500 13px/1 var(--font-sans)',
                      color: sortOpen ? 'var(--lyra-brand-700)' : 'var(--color-fg-default)',
                      background: sortOpen ? 'var(--lyra-brand-50)' : 'var(--lyra-white, #fff)',
                      border:
                        '1px solid ' +
                        (sortOpen ? 'var(--lyra-brand-300)' : 'var(--color-border-soft)'),
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'background 0.12s, border-color 0.12s',
                    }}
                    onMouseEnter={e => {
                      if (!sortOpen)
                        (e.currentTarget as HTMLButtonElement).style.background =
                          'var(--lyra-slate-100)'
                    }}
                    onMouseLeave={e => {
                      if (!sortOpen)
                        (e.currentTarget as HTMLButtonElement).style.background =
                          'var(--lyra-white, #fff)'
                    }}
                  >
                    {/* Sort icon */}
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="2" y1="4" x2="14" y2="4" />
                      <line x1="2" y1="8" x2="10" y2="8" />
                      <line x1="2" y1="12" x2="6" y2="12" />
                    </svg>
                    Sort
                    {/* Chevron */}
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        transform: sortOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.15s',
                      }}
                    >
                      <polyline points="4 6 8 10 12 6" />
                    </svg>
                  </button>

                  {sortOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 6px)',
                        right: 0,
                        zIndex: 50,
                        background: 'var(--lyra-white, #fff)',
                        border: '1px solid var(--color-border-soft)',
                        borderRadius: 'var(--radius-lg)',
                        boxShadow: 'var(--sol-effect-shadowlg)',
                        padding: '4px 0',
                        minWidth: 180,
                      }}
                    >
                      {SORT_OPTIONS.map(opt => (
                        <button
                          key={opt.key}
                          onClick={() => {
                            setCategorySort(opt.key)
                            setSortOpen(false)
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                            padding: '8px 12px',
                            font: '400 13px/20px var(--font-sans)',
                            color:
                              categorySort === opt.key
                                ? 'var(--lyra-brand-700)'
                                : 'var(--color-fg-default)',
                            background:
                              categorySort === opt.key ? 'var(--lyra-brand-50)' : 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'background 0.1s',
                          }}
                          onMouseEnter={e => {
                            if (categorySort !== opt.key)
                              (e.currentTarget as HTMLButtonElement).style.background =
                                'var(--lyra-slate-100)'
                          }}
                          onMouseLeave={e => {
                            if (categorySort !== opt.key)
                              (e.currentTarget as HTMLButtonElement).style.background =
                                'transparent'
                          }}
                        >
                          {opt.label}
                          {categorySort === opt.key && (
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 16 16"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              style={{ color: 'var(--lyra-brand-600)', flexShrink: 0 }}
                            >
                              <polyline points="3 8 6.5 11.5 13 5" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Subtitle */}
              <p
                style={{
                  margin: 'var(--space-1) 0 0 0',
                  font: '400 12px/20px var(--font-sans)',
                  color: 'var(--color-fg-secondary)',
                }}
              >
                Define weights for each category to influence how responses are scored.
              </p>
            </div>

            {/* 2-column category card grid */}
            {filtered.length === 0 ? (
              <div
                style={{
                  padding: '40px 24px',
                  textAlign: 'center',
                  color: 'var(--color-fg-secondary)',
                  font: '400 14px/20px var(--font-sans)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--lyra-white, #fff)',
                }}
              >
                No categories match "<strong>{categorySearch}</strong>"
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 'var(--space-3)',
                }}
              >
                {filtered.map(c => (
                  <CategoryCard
                    key={c.id}
                    category={c}
                    isNew={newlyAddedIds.includes(c.id)}
                    isRemoved={removedIds.includes(c.id)}
                    onChange={patch => setCategory(c.id, patch)}
                  />
                ))}
              </div>
            )}

            {/* Footer count when filtering */}
            {q && (
              <div
                style={{
                  marginTop: 'var(--space-3)',
                  font: '400 12px/16px var(--font-sans)',
                  color: 'var(--color-fg-secondary)',
                }}
              >
                Showing {filtered.length} of {categories.length} categories
              </div>
            )}
          </>
        ) : (
          /* Empty state — no model selected yet */
          <div
            style={{
              border: '1.5px dashed var(--color-border-soft)',
              borderRadius: 'var(--radius-lg)',
              padding: '48px 24px',
              textAlign: 'center',
              color: 'var(--color-fg-secondary)',
              font: '400 14px/20px var(--font-sans)',
            }}
          >
            Select a Topic AI Model above to load its categories.
          </div>
        )}
      </div>
      {/* /scrollable body */}

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <div className="wz-footer">
        <button className="btn" onClick={() => guardedNavigate(onCancel)}>
          Cancel
        </button>
        <span style={{ flex: 1 }} />
        <button
          className="btn primary"
          disabled={!canPublish}
          onClick={() => onPublish(selectedModel, categories)}
        >
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            stroke="currentColor"
            fill="none"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="4 13 10 19 20 5" />
          </svg>
          Publish changes
        </button>
      </div>

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div className="toast">
          <div className="toast-icon">
            <svg viewBox="0 0 16 16">
              <polyline points="3 8.5 6.5 12 13 5" />
            </svg>
          </div>
          <span className="toast-msg">{toast.msg}</span>
          <button
            className="toast-close"
            onClick={() => setToast(null)}
            aria-label="Dismiss"
          >
            <svg viewBox="0 0 16 16">
              <line x1="4" y1="4" x2="12" y2="12" />
              <line x1="12" y1="4" x2="4" y2="12" />
            </svg>
          </button>
        </div>
      )}

      {/* ── Cancel-after-changes warning modal (Lyra destructive variant) ── */}
      {showCancelWarning && (
        <div
          onClick={() => setShowCancelWarning(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.24)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: 400,
              background: 'var(--lyra-white, #ffffff)',
              borderRadius: 12,
              boxShadow: '0px 20px 40px 0px rgba(0,0,0,0.12)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header — 80px tall, warning icon + heading-md title */}
            <div
              style={{
                height: 80,
                padding: '0 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flex: 1,
                  minWidth: 0,
                }}
              >
                {/* Lyra alert/warning-fill icon: yellow triangle, dark stroke */}
                <div
                  style={{
                    width: 24,
                    height: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6.86 2.573a1.317 1.317 0 012.28 0l5.527 9.572A1.317 1.317 0 0113.527 14H2.473a1.317 1.317 0 01-1.14-1.855L6.86 2.573z"
                      fill="#FACB33"
                    />
                    <path
                      d="M8 6.5v3M8 11h.007"
                      stroke="#7A5200"
                      strokeWidth="1.25"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <span
                  style={{
                    font: '500 16px/20px var(--font-sans)',
                    color: 'rgba(0,0,0,0.80)',
                    letterSpacing: '-0.01em',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  {refreshDone ? 'Discard refreshed changes?' : 'Discard unsaved changes?'}
                </span>
              </div>
            </div>

            {/* Content — body-md */}
            <div style={{ padding: '0 24px', flexShrink: 0 }}>
              <p
                style={{
                  margin: 0,
                  font: '400 14px/20px var(--font-sans)',
                  color: 'rgba(0,0,0,0.80)',
                }}
              >
                {refreshDone ? (
                  <>
                    You've refreshed the model —{' '}
                    <span style={{ fontWeight: 500 }}>
                      {newlyAddedIds.length} new{' '}
                      {newlyAddedIds.length === 1 ? 'category' : 'categories'}
                    </span>{' '}
                    and{' '}
                    <span style={{ fontWeight: 500 }}>
                      {removedIds.length} pending{' '}
                      {removedIds.length === 1 ? 'removal' : 'removals'}
                    </span>{' '}
                    will be lost. The ontology will remain unchanged until you return and publish.
                  </>
                ) : (
                  'You have unsaved changes. If you leave now, all your edits will be lost.'
                )}
              </p>
            </div>

            {/* Footer — 80px tall, secondary + destructive red button */}
            <div
              style={{
                height: 80,
                padding: '0 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 8,
                flexShrink: 0,
              }}
            >
              <button
                onClick={() => setShowCancelWarning(false)}
                style={{
                  height: 36,
                  padding: '0 16px',
                  font: '500 14px/20px var(--font-sans)',
                  color: 'rgba(0,0,0,0.80)',
                  background: 'var(--lyra-white, #ffffff)',
                  border: '1px solid rgba(0,0,0,0.16)',
                  borderRadius: 8,
                  cursor: 'pointer',
                  outline: 'none',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.04)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    'var(--lyra-white, #ffffff)'
                }}
              >
                Keep editing
              </button>
              <button
                onClick={() => {
                  setShowCancelWarning(false)
                  const action = pendingNavAction.current ?? onCancel
                  pendingNavAction.current = null
                  action()
                }}
                style={{
                  height: 36,
                  padding: '0 16px',
                  font: '500 14px/20px var(--font-sans)',
                  color: 'var(--lyra-white, #ffffff)',
                  background: 'var(--lyra-color-bg-destructive)',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  outline: 'none',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = '#9E2222'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    'var(--lyra-color-bg-destructive)'
                }}
              >
                Discard &amp; exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
