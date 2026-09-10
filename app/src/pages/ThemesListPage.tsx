import { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import {
  ListPageHeader, SearchInput, GridPanel, GridToolbar,
  TableShell, Th, Td, EmptyRow,
} from '@/components/feedback-management/ListPagePrimitives'
import { getAllThemes, createTheme, sanitizeName } from '@/lib/themes'

const F = 'var(--lyra-font-sans, var(--font-sans))'

function TypeChip({ sys }: { sys: boolean }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 9px', borderRadius: 5,
      font: '500 11px/16px ' + F,
      background: sys ? 'var(--lyra-color-bg-active-subtle)' : 'var(--lyra-slate-100)',
      color:      sys ? 'var(--lyra-color-fg-active-strong)' : 'var(--lyra-slate-600)',
    }}>
      {sys ? 'System default' : 'Custom'}
    </span>
  )
}

export function ThemesListPage({ onSelectTheme }: { onSelectTheme: (id: string) => void }) {
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')

  const allThemes = getAllThemes()

  const rows = useMemo(() => {
    if (!search) return allThemes
    const q = search.toLowerCase()
    return allThemes.filter(t =>
      t.nm.toLowerCase().includes(q) || t.ds.toLowerCase().includes(q)
    )
  }, [search, allThemes])

  function openCreate() {
    setNewName('')
    setCreateOpen(true)
  }

  function handleCreate() {
    if (!newName.trim()) return
    const theme = createTheme(newName.trim(), 'digital')
    setCreateOpen(false)
    onSelectTheme(theme.id)
  }

  const canCreate = newName.trim().length > 0

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden" style={{ background: 'var(--lyra-color-bg-surface-base)' }}>
        <ListPageHeader
          title="Themes"
          breadcrumb="Library"
          actionLabel="New theme"
          onAction={openCreate}
          tooltipText="A Theme controls the visual style and interaction pattern used when a survey is presented digitally."
        />

        <div className="flex-1 overflow-auto" style={{ background: 'var(--lyra-color-bg-surface-base)', padding: '24px 32px' }}>
          <p style={{ margin: '0 0 20px', font: '400 14px/22px ' + F, color: 'var(--lyra-color-fg-secondary)', maxWidth: 640 }}>
            Themes control how survey questions are presented — the control style (quick reply, list picker), scale labels, and every customer-facing message. One theme per channel per program.
          </p>

          {/* Filter toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 20, flexWrap: 'wrap' }}>
            <SearchInput value={search} onChange={setSearch} placeholder="Search themes" />
            <span style={{ marginLeft: 'auto', font: '400 12px/16px ' + F, color: 'var(--lyra-color-fg-secondary)', whiteSpace: 'nowrap' }}>
              {rows.length} {rows.length === 1 ? 'theme' : 'themes'}
            </span>
          </div>

          {/* Grid */}
          <GridPanel>
            <GridToolbar label="Themes" shown={rows.length} total={allThemes.length} />
            <TableShell>
              <thead>
                <tr>
                  <Th>Theme</Th>
                  <Th>Channel</Th>
                  <Th>Type</Th>
                  <Th>Description</Th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <EmptyRow colSpan={4} message="No themes match your search." />
                )}
                {rows.map(t => (
                  <tr
                    key={t.id}
                    style={{ borderBottom: '1px solid var(--lyra-color-border-subtle)', cursor: 'pointer', transition: 'background 0.12s' }}
                    onClick={() => onSelectTheme(t.id)}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}
                  >
                    <Td>
                      <span style={{ fontWeight: 500, color: 'var(--lyra-color-fg-link)', fontFamily: F }}>
                        {t.nm}
                      </span>
                    </Td>
                    <Td>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center',
                        padding: '3px 9px', borderRadius: 5,
                        font: '500 11px/16px ' + F,
                        background: 'var(--lyra-color-bg-active-subtle)',
                        color: 'var(--lyra-color-fg-active-strong)',
                      }}>
                        Digital
                      </span>
                    </Td>
                    <Td><TypeChip sys={t.sys} /></Td>
                    <Td>
                      <span style={{ color: 'var(--lyra-color-fg-secondary)', font: '400 14px/20px ' + F }}>
                        {t.ds}
                      </span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableShell>
          </GridPanel>
        </div>
      </div>

      {/* Create theme modal */}
      {createOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.24)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setCreateOpen(false) }}
        >
          <div style={{
            background: 'var(--lyra-color-bg-surface-overlay)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--sol-effect-shadowlg)',
            width: '100%', maxWidth: 480,
            padding: 'var(--space-6)',
          }}>
            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
              <h2 style={{ margin: 0, font: '600 16px/20px ' + F, color: 'var(--lyra-color-fg-default)' }}>
                New theme
              </h2>
              <button
                onClick={() => setCreateOpen(false)}
                aria-label="Close"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 'var(--radius-sm)', border: 'none', background: 'transparent', color: 'var(--lyra-color-fg-secondary)', cursor: 'pointer', transition: 'background 0.12s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <label htmlFor="create-nm" style={{ display: 'block', font: '500 13px/16px ' + F, color: 'var(--lyra-color-fg-default)', marginBottom: 6 }}>
                  Name <span style={{ color: 'var(--lyra-color-status-critical-strong)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="create-nm"
                    type="text"
                    value={newName}
                    onChange={e => setNewName(sanitizeName(e.target.value).slice(0, 50))}
                    placeholder="e.g. Billing – Digital"
                    autoFocus
                    onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
                    style={{
                      height: 38, width: '100%', padding: '0 12px', paddingRight: 52,
                      background: 'var(--lyra-color-bg-field)',
                      border: '1px solid var(--lyra-color-border-soft)',
                      borderRadius: 'var(--radius-sm)',
                      font: '400 14px/20px ' + F, color: 'var(--lyra-color-fg-default)',
                      outline: 'none', boxSizing: 'border-box',
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--lyra-color-border-active)'; e.currentTarget.style.boxShadow = 'var(--sol-effect-activering)' }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'var(--lyra-color-border-soft)'; e.currentTarget.style.boxShadow = '' }}
                  />
                  <span style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    font: '400 11px/14px ' + F,
                    color: newName.length >= 50 ? 'var(--lyra-color-status-critical-strong)' : 'var(--lyra-color-fg-disabled)',
                    pointerEvents: 'none',
                  }}>
                    {newName.length}/50
                  </span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', font: '500 13px/16px ' + F, color: 'var(--lyra-color-fg-default)', marginBottom: 6 }}>
                  Channel
                </label>
                <div style={{
                  height: 38, display: 'flex', alignItems: 'center', padding: '0 12px',
                  background: 'var(--lyra-color-bg-disabled)',
                  border: '1px solid var(--lyra-color-border-soft)',
                  borderRadius: 'var(--radius-sm)',
                  font: '400 14px/20px ' + F, color: 'var(--lyra-color-fg-default)',
                  boxSizing: 'border-box',
                }}>
                  Digital
                </div>
                <span style={{ display: 'block', marginTop: 4, font: '400 12px/16px ' + F, color: 'var(--lyra-color-fg-secondary)' }}>
                  Only Digital themes are available in this release.
                </span>
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-6)' }}>
              <button
                onClick={() => setCreateOpen(false)}
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
                onClick={handleCreate}
                disabled={!canCreate}
                style={{
                  height: 36, padding: '0 var(--space-4)', borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: canCreate ? 'var(--lyra-color-bg-primary)' : 'var(--lyra-color-bg-disabled)',
                  font: '500 14px/20px ' + F,
                  color: canCreate ? 'var(--lyra-color-fg-on-primary)' : 'var(--lyra-color-fg-disabled)',
                  cursor: canCreate ? 'pointer' : 'not-allowed',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => { if (canCreate) (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-primary)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = canCreate ? 'var(--lyra-color-bg-primary)' : 'var(--lyra-color-bg-disabled)' }}
              >
                Create theme
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
