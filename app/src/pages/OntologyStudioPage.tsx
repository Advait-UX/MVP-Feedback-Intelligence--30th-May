// OntologyStudioPage — top-level page component for Ontology Studio.
// Mirrors the VUScoreModel function from prototype.html (lines 10715–10812):
//   - Manages ontologies state (loaded from localStorage via loadOntologies)
//   - Controls the view state: 'list' | 'edit' | 'new'
//   - Handles edit, remove (with confirm modal), new, cancel, and publish flows
//   - Drives the publishedId highlight animation on the list row
//   - Accepts onPublishSuccess callback (used by parent shell to show a toast)

import { useEffect, useState } from 'react'
import type { Category, Ontology } from '../types'
import {
  TOPIC_MODELS,
  loadOntologies,
  saveOntologies,
} from '../data/ontology'
import { OntologyList } from '../components/ontology/OntologyList'
import { OntologyEditor } from '../components/ontology/OntologyEditor'

// ---------------------------------------------------------------------------
// ConfirmModal — Lyra Modal Message (destructive variant).
// Mirrors prototype.html lines 10814–10835.
// ---------------------------------------------------------------------------

interface ConfirmModalProps {
  title: string
  body: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}

function ConfirmModal({ title, body, confirmLabel, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <div
      className="ly-modal-backdrop"
      onClick={onCancel}
      role="presentation"
    >
      <div
        className="ly-modal"
        style={{ width: 400 }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <div className="ly-modal-head">
          <span className="ly-modal-title" id="confirm-modal-title">
            {title}
          </span>
          <button className="ly-modal-close" aria-label="Close" onClick={onCancel}>
            {/* X icon */}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <div
          style={{
            padding: 'var(--space-5) var(--space-6)',
            font: '400 14px/24px var(--font-sans)',
            color: 'var(--color-fg-secondary)',
          }}
        >
          {body}
        </div>

        <div className="ly-modal-foot">
          <button className="btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn destructive" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// OntologyStudioPage — VUScoreModel equivalent
// ---------------------------------------------------------------------------

interface OntologyStudioPageProps {
  /** Called after a successful publish so the shell can show a success toast */
  onPublishSuccess?: (modelName: string) => void
}

export function OntologyStudioPage({ onPublishSuccess }: OntologyStudioPageProps) {
  // Ontologies are loaded from localStorage (or seed data) on first render
  const [ontologies, setOntologies] = useState<Ontology[]>(loadOntologies)

  // View state: landing table vs. editor
  const [view, setView] = useState<'list' | 'edit' | 'new'>('list')
  const [editingId, setEditingId] = useState<string | null>(null)

  // Remove confirmation
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)

  // Row-highlight after publish — cleared after 3 s
  const [publishedId, setPublishedId] = useState<string | null>(null)
  useEffect(() => {
    if (!publishedId) return
    const t = setTimeout(() => setPublishedId(null), 3000)
    return () => clearTimeout(t)
  }, [publishedId])

  const editing = editingId ? ontologies.find(o => o.id === editingId) ?? null : null

  // ── Persist helper ────────────────────────────────────────────────────────
  const persist = (next: Ontology[]) => {
    setOntologies(next)
    saveOntologies(next)
  }

  // ── Navigation handlers ───────────────────────────────────────────────────
  const handleEdit   = (id: string)  => { setEditingId(id); setView('edit') }
  const handleNew    = ()             => { setEditingId(null); setView('new') }
  const handleRemove = (id: string)  => { setConfirmRemoveId(id) }
  const handleCancel = ()             => { setView('list'); setEditingId(null) }

  const handleConfirmRemove = () => {
    if (confirmRemoveId) {
      persist(ontologies.filter(o => o.id !== confirmRemoveId))
    }
    setConfirmRemoveId(null)
  }

  // ── Publish ───────────────────────────────────────────────────────────────
  const handlePublish = (modelId: string, categories: Category[]) => {
    if (!modelId) return

    const now = new Date().toISOString()
    const model = TOPIC_MODELS.find(m => m.id === modelId)
    const modelName = model ? model.name : modelId

    // Strip transient flags before persisting
    const clean = categories.map(({ isNew: _isNew, ...rest }) => rest)

    let next: Ontology[]

    if (view === 'edit' && editing) {
      // Update existing ontology — publish clears the upstream-changes flag
      next = ontologies.map(o =>
        o.id === editing.id
          ? { ...o, categories: clean, updatedAt: now, updatedBy: 'You', hasUpstreamChanges: false }
          : o,
      )
    } else {
      // New ontology — upsert by modelId (in case the user submitted twice)
      const existing = ontologies.find(o => o.modelId === modelId)
      if (existing) {
        next = ontologies.map(o =>
          o.id === existing.id
            ? {
                ...o,
                modelName,
                categories: clean,
                updatedAt: now,
                updatedBy: 'You',
                hasUpstreamChanges: false,
              }
            : o,
        )
      } else {
        next = [
          ...ontologies,
          {
            id: 'ont-' + Date.now(),
            modelId,
            modelName,
            categories: clean,
            updatedAt: now,
            updatedBy: 'You',
            mappedCampaigns: [],
            hasUpstreamChanges: false,
          },
        ]
      }
    }

    // Capture the id of the saved ontology before persisting changes the list
    const savedId =
      view === 'edit' && editing
        ? editing.id
        : (ontologies.find(o => o.modelId === modelId)?.id ?? next[next.length - 1]?.id)

    persist(next)
    setView('list')
    setEditingId(null)
    setPublishedId(savedId ?? null)
    onPublishSuccess?.(modelName)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  const confirmTarget = confirmRemoveId
    ? ontologies.find(o => o.id === confirmRemoveId)
    : null

  if (view === 'list') {
    return (
      <>
        <OntologyList
          ontologies={ontologies}
          onEdit={handleEdit}
          onRemove={handleRemove}
          onNew={handleNew}
          publishedId={publishedId}
        />

        {confirmRemoveId && (
          <ConfirmModal
            title="Remove ontology configuration"
            body={
              confirmTarget
                ? `"${confirmTarget.modelName}" will be permanently removed. This cannot be undone.`
                : 'This configuration will be permanently removed. This cannot be undone.'
            }
            confirmLabel="Remove"
            onConfirm={handleConfirmRemove}
            onCancel={() => setConfirmRemoveId(null)}
          />
        )}
      </>
    )
  }

  return (
    <OntologyEditor
      mode={view}
      ontology={editing}
      configuredModelIds={ontologies.map(o => o.modelId)}
      onCancel={handleCancel}
      onPublish={handlePublish}
    />
  )
}
