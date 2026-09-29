import { useMemo, useRef, useState, useEffect } from 'react'
import { Lock, MoreVertical, X, ChevronDown } from 'lucide-react'
import {
  ListPageHeader, SearchInput, GridPanel, GridToolbar,
  TableShell, Th, Td, EmptyRow,
} from '@/components/feedback-management/ListPagePrimitives'
import {
  type Theme, getAllThemes, duplicateTheme, deleteTheme,
  suggestDuplicateName, isThemeNameTaken, hasRestrictedChars,
} from '@/lib/themes'

const F = 'var(--lyra-font-sans, var(--font-sans))'

function WarningIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.86 2.573a1.3 1.3 0 0 1 2.28 0l5.534 9.6A1.3 1.3 0 0 1 13.534 14H2.466a1.3 1.3 0 0 1-1.14-1.827l5.534-9.6Z" fill="var(--lyra-color-status-warning-subtle)" stroke="var(--lyra-color-status-warning-strong)" strokeWidth="1.3"/>
      <line x1="8" y1="6" x2="8" y2="9.5" stroke="var(--lyra-color-status-warning-strong)" strokeWidth="1.3" strokeLinecap="round"/>
      <circle cx="8" cy="11.5" r="0.65" fill="var(--lyra-color-status-warning-strong)"/>
    </svg>
  )
}

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

/* ── Row kebab menu (vertical dots) ── */
function ThemeRowMenu({ theme, onEdit, onDuplicate, onDelete }: {
  theme: Theme; onEdit: () => void; onDuplicate: () => void; onDelete: () => void
}) {
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
      setMenuPos({ top: rect.top + rect.height / 2, right: window.innerWidth - rect.left + 4 })
    }
    setOpen(v => !v)
  }

  function MenuItem({ label, variant = 'default', onClick }: { label: string; variant?: 'default' | 'danger'; onClick: () => void }) {
    const color = variant === 'danger' ? 'var(--lyra-color-status-critical-strong)' : 'var(--lyra-color-fg-default)'
    return (
      <button
        onClick={() => { onClick(); setOpen(false) }}
        style={{
          width: '100%', textAlign: 'left', background: 'none', border: 'none',
          padding: '0 var(--space-3)', height: 36, borderRadius: 'var(--radius-sm)',
          cursor: 'pointer', font: '400 14px/20px var(--font-sans)', color,
          display: 'flex', alignItems: 'center',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
      >
        {label}
      </button>
    )
  }

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }} onClick={e => e.stopPropagation()}>
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
        <MoreVertical size={16} />
      </button>

      {open && menuPos && (
        <div
          onClick={e => e.stopPropagation()}
          style={{ position: 'fixed', right: menuPos.right, top: menuPos.top, transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', zIndex: 9999 }}
        >
          <div style={{
            padding: 'var(--space-2)', background: 'var(--lyra-color-bg-surface-overlay)',
            borderRadius: 'var(--radius-lg)', outline: '1px solid var(--lyra-color-border-soft)',
            boxShadow: 'var(--sol-effect-shadowlg)', display: 'flex', flexDirection: 'column',
            gap: 2, minWidth: 160, position: 'relative',
          }}>
            {!theme.sys && <MenuItem label="Edit" onClick={onEdit} />}
            <MenuItem label="Duplicate" onClick={onDuplicate} />
            {!theme.sys && <MenuItem label="Delete" variant="danger" onClick={onDelete} />}

            <div style={{
              position: 'absolute', right: -8, top: '50%', transform: 'translateY(-50%) rotate(45deg)',
              width: 14, height: 14, background: 'var(--lyra-color-bg-surface-overlay)',
              borderRight: '1px solid var(--lyra-color-border-soft)', borderTop: '1px solid var(--lyra-color-border-soft)',
            }} />
          </div>
        </div>
      )}
    </div>
  )
}

export function ThemesListPage({ onSelectTheme, onCreateTheme, newlyCreatedId, onClearNewlyCreated }: {
  onSelectTheme: (id: string) => void
  onCreateTheme: () => void
  newlyCreatedId?: string | null
  onClearNewlyCreated?: () => void
}) {
  const [search, setSearch] = useState('')
  const [pendingDelete, setPendingDelete] = useState<Theme | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [showLinkedPrograms, setShowLinkedPrograms] = useState(false)
  const [duplicateSource, setDuplicateSource] = useState<Theme | null>(null)
  const [duplicateName, setDuplicateName] = useState('')
  const [duplicateNameTouched, setDuplicateNameTouched] = useState(false)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [, forceRerender] = useState(0)

  useEffect(() => {
    if (!newlyCreatedId) return
    setHighlightedId(newlyCreatedId)
    setToast('Theme created')
    const t1 = setTimeout(() => setHighlightedId(null), 5000)
    const t2 = setTimeout(() => setToast(null), 5000)
    const t3 = setTimeout(() => onClearNewlyCreated?.(), 5100)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [newlyCreatedId])

  const allThemes = getAllThemes()

  const rows = useMemo(() => {
    const base = search
      ? allThemes.filter(t => t.nm.toLowerCase().includes(search.toLowerCase()))
      : allThemes
    return [...base].sort((a, b) => {
      if (a.sys !== b.sys) return Number(b.sys) - Number(a.sys)
      const at = a.updatedOn ? new Date(a.updatedOn).getTime() : 0
      const bt = b.updatedOn ? new Date(b.updatedOn).getTime() : 0
      return bt - at
    })
  }, [search, allThemes])


  function openDuplicate(theme: Theme) {
    setDuplicateSource(theme)
    setDuplicateName(suggestDuplicateName(theme))
    setDuplicateNameTouched(false)
  }

  function handleDuplicateConfirm() {
    if (!duplicateSource) return
    const nm = duplicateName.trim()
    if (!nm || hasRestrictedChars(nm) || isThemeNameTaken(nm)) return
    const copy = duplicateTheme(duplicateSource, nm)
    setDuplicateSource(null)
    setSearch('')
    setHighlightedId(copy.id)
    setToast('Theme duplicated')
    forceRerender(n => n + 1)
    setTimeout(() => setHighlightedId(null), 5000)
    setTimeout(() => setToast(null), 5000)
  }

  function handleDelete(theme: Theme) {
    if ((theme.linkedPrograms?.length ?? 0) > 0) return
    const result = deleteTheme(theme)
    if (result.ok) {
      setPendingDelete(null)
      forceRerender(n => n + 1)
    } else {
      setDeleteError(result.reason ?? 'This theme cannot be deleted.')
    }
  }

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden" style={{ background: 'var(--lyra-color-bg-surface-base)' }}>
        <ListPageHeader
          title="Themes"
          actionLabel="New Theme"
          onAction={onCreateTheme}
          tooltipText="Themes control how surveys are presented to customers, including the layout, response style, and messages shown during the survey."
        />

        <div className="flex-1 overflow-auto" style={{ padding: 'var(--space-7)' }}>
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <SearchInput value={search} onChange={setSearch} placeholder="Search theme name" />
          </div>

          <GridPanel>
            <GridToolbar label="Themes" shown={rows.length} total={allThemes.length} />
            <TableShell style={{ maxHeight: 400, overflowY: 'auto' }}>
                <thead>
                  <tr>
                    <Th style={{ position: 'sticky', top: 0, zIndex: 2, background: 'var(--lyra-color-bg-surface-base)' }}>Theme</Th>
                    <Th style={{ position: 'sticky', top: 0, zIndex: 2, background: 'var(--lyra-color-bg-surface-base)' }}>Updated On</Th>
                    <Th style={{ position: 'sticky', top: 0, zIndex: 2, background: 'var(--lyra-color-bg-surface-base)' }}>Updated By</Th>
                    <Th style={{ position: 'sticky', top: 0, zIndex: 2, background: 'var(--lyra-color-bg-surface-base)' }}>Type</Th>
                    <Th align="right" style={{ position: 'sticky', top: 0, zIndex: 2, background: 'var(--lyra-color-bg-surface-base)' }}>Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <EmptyRow colSpan={5} message="No themes match your search." />
                  )}
                  {rows.map(t => {
                    const isHighlighted = highlightedId === t.id
                    const restBg = t.sys ? 'var(--lyra-color-bg-surface-base)' : ''
                    return (
                    <tr
                      key={t.id}
                      style={{
                        borderBottom: '1px solid var(--lyra-color-border-subtle)', cursor: 'pointer', transition: 'background 0.8s ease',
                        background: isHighlighted ? 'var(--lyra-color-bg-active-subtle)' : restBg,
                        ...(t.sys ? { position: 'sticky', top: 48, zIndex: 1 } : {}),
                      }}
                      onClick={() => onSelectTheme(t.id)}
                      onMouseEnter={e => { if (!isHighlighted) (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isHighlighted ? 'var(--lyra-color-bg-active-subtle)' : restBg }}
                    >
                      <Td>
                        <span style={{ fontWeight: 500, color: 'var(--lyra-color-fg-link)', fontFamily: F }}>
                          {t.nm}
                        </span>
                      </Td>
                      <Td>{t.updatedOn ?? '-'}</Td>
                      <Td>{t.updatedBy ?? '-'}</Td>
                      <Td><TypeChip sys={t.sys} /></Td>
                      <Td align="right">
                        <ThemeRowMenu
                          theme={t}
                          onEdit={() => onSelectTheme(t.id)}
                          onDuplicate={() => openDuplicate(t)}
                          onDelete={() => { setPendingDelete(t); setDeleteError(null); setShowLinkedPrograms(false) }}
                        />
                      </Td>
                    </tr>
                  )})}
                </tbody>
            </TableShell>
          </GridPanel>
        </div>
      </div>

      {/* Duplicate theme modal */}
      {duplicateSource && (() => {
        const trimmed = duplicateName.trim()
        const charError = hasRestrictedChars(duplicateName)
        const isDuplicateName = !!trimmed && !charError && isThemeNameTaken(trimmed)
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
              width: '100%', maxWidth: 480,
              padding: 'var(--space-6)',
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
                <h2 style={{ margin: 0, font: '600 16px/20px ' + F, color: 'var(--lyra-color-fg-default)' }}>
                  Duplicate Theme
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
                font: '400 13px/18px ' + F, color: 'var(--lyra-color-status-info-strong)',
              }}>
                Duplicating the theme creates a new custom theme that can be edited independently.
              </div>

              {/* Theme name field */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <label htmlFor="dup-nm" style={{ font: '500 14px/20px ' + F, color: 'var(--lyra-color-fg-default)' }}>
                      Theme name
                    </label>
                    <span style={{ font: '500 14px/20px ' + F, color: 'var(--lyra-color-status-critical-strong)' }}>*</span>
                  </div>
                  <span style={{
                    font: '400 12px/16px ' + F,
                    color: duplicateName.length >= 50 ? 'var(--lyra-color-status-critical-strong)' : 'var(--lyra-color-fg-secondary)',
                  }}>
                    {duplicateName.length}/50
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <input
                    id="dup-nm"
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
                      font: '400 14px/20px ' + F, color: 'var(--lyra-color-fg-default)',
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
                  <span style={{ font: '400 12px/16px ' + F, color: 'var(--lyra-color-status-critical-strong)' }}>Required</span>
                )}
                {trimmed && charError && (
                  <span style={{ font: '400 12px/16px ' + F, color: 'var(--lyra-color-status-critical-strong)' }}>
                    Special characters like / ! + &lt; &gt; ? # &amp; , % are not allowed
                  </span>
                )}
                {isDuplicateName && (
                  <span style={{ font: '400 12px/16px ' + F, color: 'var(--lyra-color-status-warning-strong)' }}>
                    A theme with this name already exists. Please enter a unique theme name.
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
                    font: '500 14px/20px ' + F, color: 'var(--lyra-color-fg-default)',
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
                    font: '500 14px/20px ' + F,
                    color: isValid ? 'var(--lyra-color-fg-on-primary)' : 'var(--lyra-color-fg-disabled)',
                    cursor: isValid ? 'pointer' : 'not-allowed',
                    transition: 'background 0.12s',
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

      {/* Delete confirmation modal */}
      {pendingDelete && (() => {
        const linked = pendingDelete.linkedPrograms ?? []
        const hasLinked = linked.length > 0
        const closeModal = () => { setPendingDelete(null); setDeleteError(null); setShowLinkedPrograms(false) }
        return (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.24)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={closeModal}
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
                <span style={{ font: '500 16px/20px ' + F, color: 'var(--lyra-color-fg-default)', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {hasLinked || deleteError ? 'Cannot Delete Theme' : 'Delete theme?'}
                </span>
              </div>

              {/* Body */}
              <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <p style={{ font: '400 14px/20px ' + F, color: 'var(--lyra-color-fg-default)', margin: 0 }}>
                  {hasLinked
                    ? `This theme is currently used by ${linked.length} program${linked.length !== 1 ? 's' : ''}. Remove the theme from all linked programs before deleting it.`
                    : deleteError ?? <>Delete this theme? This action is permanent.<br />Do you want to continue?</>
                  }
                </p>

                {hasLinked && (
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    <button
                      onClick={() => setShowLinkedPrograms(v => !v)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, font: '400 14px/20px ' + F, color: 'var(--lyra-color-fg-link)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      {showLinkedPrograms ? 'Collapse' : 'View linked programs'}
                      <ChevronDown size={12} style={{ transform: showLinkedPrograms ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                    </button>
                    {showLinkedPrograms && (
                      <>
                        <p style={{ font: '500 16px/20px ' + F, color: 'var(--lyra-color-fg-default)', letterSpacing: '-0.01em', margin: 0 }}>
                          Linked programs - {String(linked.length).padStart(2, '0')}
                        </p>
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                          {linked.map(p => (
                            <div key={p} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--lyra-color-border-subtle)' }}>
                              <span style={{ font: '400 14px/20px ' + F, color: 'var(--lyra-color-fg-default)' }}>{p}</span>
                              <span style={{ font: '400 14px/20px ' + F, color: 'var(--lyra-color-fg-link)', cursor: 'pointer', flexShrink: 0 }}>View</span>
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
                <button
                  onClick={closeModal}
                  style={{
                    height: 36, padding: '0 var(--space-4)', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--lyra-color-border-soft)',
                    background: 'var(--lyra-color-bg-surface-base)',
                    font: '500 14px/20px ' + F, color: 'var(--lyra-color-fg-default)',
                    cursor: 'pointer', transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-bg-surface-base)' }}
                >
                  {hasLinked || deleteError ? 'Back' : 'Cancel'}
                </button>
                {!hasLinked && !deleteError && (
                  <button
                    onClick={() => handleDelete(pendingDelete)}
                    style={{
                      height: 36, padding: '0 var(--space-4)', borderRadius: 'var(--radius-md)',
                      border: 'none', background: 'var(--lyra-color-bg-destructive)',
                      font: '500 14px/20px ' + F, color: 'var(--lyra-color-fg-inverse)',
                      cursor: 'pointer', transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.88' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
                  >
                    Delete theme
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })()}

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
          <div style={{ flex: 1, font: '400 14px/20px ' + F, color: 'var(--lyra-color-fg-default)' }}>
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
    </>
  )
}
