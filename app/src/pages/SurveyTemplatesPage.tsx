// SurveyTemplatesPage — top-level page for Survey Templates admin.
// Handles internal routing between:
//   list  → SurveyDesignsGrid
//   create → CreateSurveyDesign (new)
//   edit   → CreateSurveyDesign (pre-filled)
//   detail → SurveyTemplateDetail
//
// All child views are rendered inside the same white content pane so the
// AppShell chrome (sidebar + topbar) stays mounted and unchanged.

import { useState } from 'react'
import type { SurveyDesignTemplate } from '../types'
import { SurveyDesignsGrid } from '../components/surveys/SurveyDesignsGrid'
import { SurveyTemplateDetail } from '../components/surveys/SurveyTemplateDetail'
import { CreateSurveyDesign } from '../components/surveys/CreateSurveyDesign'

// ---------------------------------------------------------------------------
// Internal router state
// ---------------------------------------------------------------------------

type TemplateView =
  | { type: 'list' }
  | { type: 'detail'; design: SurveyDesignTemplate }
  | { type: 'create' }
  | { type: 'edit'; design: SurveyDesignTemplate }

// ---------------------------------------------------------------------------
// SurveyTemplatesPage
// ---------------------------------------------------------------------------

export interface SurveyTemplatesPageProps {
  /** Designs created during the session that should be prepended to the list. */
  newDesigns?: SurveyDesignTemplate[]
  /** Called when the user saves a new or edited template. */
  onNewDesign?: (d: SurveyDesignTemplate) => void
}

export function SurveyTemplatesPage({
  newDesigns = [],
  onNewDesign,
}: SurveyTemplatesPageProps) {
  const [view, setView] = useState<TemplateView>({ type: 'list' })

  // Session-local newly saved designs (kept in local state so the grid
  // highlights them immediately without needing a parent callback).
  const [localNewDesigns, setLocalNewDesigns] = useState<SurveyDesignTemplate[]>([])

  // Combine prop-provided and locally created designs; deduplicate by id.
  const allNewDesigns = [
    ...localNewDesigns,
    ...newDesigns.filter(d => !localNewDesigns.some(n => n.id === d.id)),
  ]

  function handleSave(d: SurveyDesignTemplate) {
    const saved: SurveyDesignTemplate = {
      ...d,
      id: d.id ?? `design-${Date.now()}`,
      isNew: true,
      updated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    }
    setLocalNewDesigns(prev => {
      // Replace if editing an existing local design; prepend otherwise.
      const idx = prev.findIndex(x => x.id === saved.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = saved
        return next
      }
      return [saved, ...prev]
    })
    onNewDesign?.(saved)
    setView({ type: 'list' })
  }

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--lyra-color-bg-surface-base)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--lyra-color-border-subtle)',
        boxShadow: 'var(--sol-effect-shadowsm)',
      }}
    >
      {view.type === 'list' && (
        <SurveyDesignsGrid
          newDesigns={allNewDesigns}
          onCreate={() => setView({ type: 'create' })}
          onOpen={d => setView({ type: 'detail', design: d })}
          onEdit={d => setView({ type: 'edit', design: d })}
        />
      )}

      {view.type === 'detail' && (
        <SurveyTemplateDetail
          design={view.design}
          onBack={() => setView({ type: 'list' })}
          onEdit={d => setView({ type: 'edit', design: d })}
        />
      )}

      {view.type === 'create' && (
        <CreateSurveyDesign
          onCancel={() => setView({ type: 'list' })}
          onSave={handleSave}
        />
      )}

      {view.type === 'edit' && (
        <CreateSurveyDesign
          initial={view.design}
          onCancel={() => setView({ type: 'list' })}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
