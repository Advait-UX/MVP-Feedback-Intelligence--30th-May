// OntologyRowActions — kebab (⋮) menu for each ontology table row.
// Mirrors prototype.html lines 10944–10979: outside-click dismiss,
// Edit and Remove items with matching SVG icons.

import { useEffect, useRef, useState } from 'react'

interface OntologyRowActionsProps {
  onEdit: () => void
  onRemove: () => void
}

export function OntologyRowActions({ onEdit, onRemove }: OntologyRowActionsProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Dismiss when clicking outside the menu container
  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  return (
    <div
      ref={ref}
      style={{ position: 'relative', display: 'inline-flex' }}
      onClick={e => e.stopPropagation()}
    >
      <button
        className="kebab"
        onClick={() => setOpen(o => !o)}
        title="Actions"
        aria-label="Row actions"
        aria-haspopup="true"
        aria-expanded={open}
      >
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
              onEdit()
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

          <div className="row-action-divider" />

          <button
            className="row-action-item danger"
            onClick={() => {
              onRemove()
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
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
            </svg>
            Remove
          </button>
        </div>
      )}
    </div>
  )
}
