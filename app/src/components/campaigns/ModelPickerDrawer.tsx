/**
 * ModelPickerDrawer — slide-in panel for choosing a Topic AI Model.
 *
 * Matches the `ModelPickerDrawer` function in prototype.html exactly:
 *   - `.tmpl-drawer-overlay` backdrop
 *   - `.model-picker-drawer` panel
 *   - `.model-picker-head`, `.model-picker-search-wrap`, `.model-picker-count`
 *   - `.model-picker-list`, `.model-picker-row`, `.model-picker-foot`
 *   - `.lyra-radio` radio indicator
 *   - `.model-badge` badge chip
 *
 * Rendered into document.body via a React portal in the parent.
 */

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AI_MODELS } from '../../data/campaigns'
import type { AiModel } from '../../types'

interface ModelPickerDrawerProps {
  currentId: string
  onClose: () => void
  onSelect: (id: string) => void
}

export function ModelPickerDrawer({ currentId, onClose, onSelect }: ModelPickerDrawerProps) {
  const [query, setQuery] = useState('')
  const [pendingId, setPendingId] = useState(currentId || '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const filtered: AiModel[] = query.trim()
    ? AI_MODELS.filter(
        (m) =>
          m.name.toLowerCase().includes(query.toLowerCase()) ||
          m.description.toLowerCase().includes(query.toLowerCase()) ||
          m.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()))
      )
    : AI_MODELS

  const drawer = (
    <div className="tmpl-drawer-overlay" onClick={onClose}>
      <div className="model-picker-drawer" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="model-picker-head">
          <div style={{ flex: 1 }}>
            <div
              style={{ font: '600 16px/24px var(--font-sans)', color: 'var(--color-fg-default)' }}
            >
              Choose AI Model
            </div>
            <div
              style={{
                font: '400 13px/20px var(--font-sans)',
                color: 'var(--color-fg-secondary)',
                marginTop: 2,
              }}
            >
              Select the model that best fits your campaign goals.
            </div>
          </div>
          <button className="tmpl-drawer-close" onClick={onClose} aria-label="Close drawer">
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

        {/* Search */}
        <div className="model-picker-search-wrap">
          <svg
            viewBox="0 0 16 16"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            style={{ color: 'var(--color-fg-secondary)', flexShrink: 0 }}
          >
            <circle cx="6.5" cy="6.5" r="4.5" />
            <line x1="10.5" y1="10.5" x2="14" y2="14" />
          </svg>
          <input
            ref={inputRef}
            className="model-picker-search"
            placeholder="Search model by name, industry…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search AI models"
          />
          {query && (
            <button
              className="model-picker-search-clear"
              onClick={() => setQuery('')}
              aria-label="Clear search"
            >
              <svg
                viewBox="0 0 12 12"
                width="10"
                height="10"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
              >
                <line x1="2" y1="2" x2="10" y2="10" />
                <line x1="10" y1="2" x2="2" y2="10" />
              </svg>
            </button>
          )}
        </div>

        {/* Count */}
        <div className="model-picker-count">
          {filtered.length} model{filtered.length !== 1 ? 's' : ''}
          {query ? ` matching "${query}"` : ' available'}
        </div>

        {/* Model list */}
        <div className="model-picker-list">
          {filtered.length === 0 ? (
            <div
              style={{
                padding: 'var(--space-8) var(--space-6)',
                textAlign: 'center',
                color: 'var(--color-fg-secondary)',
                font: '400 14px/20px var(--font-sans)',
              }}
            >
              No models match your search.
            </div>
          ) : (
            filtered.map((m) => {
              const isSelected = pendingId === m.id
              return (
                <div
                  key={m.id}
                  className={`model-picker-row ${isSelected ? 'selected' : ''}`}
                  onClick={() => setPendingId(m.id)}
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') setPendingId(m.id)
                  }}
                >
                  <div className="model-picker-row-head">
                    <span
                      className={`lyra-radio ${isSelected ? 'selected' : ''}`}
                      style={{ marginTop: 2, flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
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
                            font: '500 14px/20px var(--font-sans)',
                            color: 'var(--color-fg-default)',
                          }}
                        >
                          {m.name}
                        </span>
                        {m.badge && <span className="model-badge">{m.badge}</span>}
                      </div>

                      {m.whenToUse && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 5,
                            marginTop: 6,
                          }}
                        >
                          <svg
                            viewBox="0 0 12 12"
                            width="11"
                            height="11"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{
                              flexShrink: 0,
                              marginTop: 2,
                              color: 'var(--color-fg-action)',
                            }}
                          >
                            <circle cx="6" cy="6" r="5" />
                            <path d="M6 4v2.5l1.5 1" />
                          </svg>
                          <span
                            style={{
                              font: '400 12px/16px var(--font-sans)',
                              color: 'var(--color-fg-secondary)',
                            }}
                          >
                            {m.whenToUse}
                          </span>
                        </div>
                      )}

                      {m.industry && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 5,
                            marginTop: 4,
                          }}
                        >
                          <svg
                            viewBox="0 0 12 12"
                            width="11"
                            height="11"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{
                              flexShrink: 0,
                              marginTop: 2,
                              color: 'var(--color-fg-action)',
                            }}
                          >
                            <rect x="1" y="5" width="10" height="6" rx="1" />
                            <path d="M4 5V3.5a2 2 0 0 1 4 0V5" />
                          </svg>
                          <span
                            style={{
                              font: '400 12px/16px var(--font-sans)',
                              color: 'var(--color-fg-secondary)',
                            }}
                          >
                            {m.industry}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="model-picker-foot">
          <button className="clear-link" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn primary"
            disabled={!pendingId}
            onClick={() => onSelect(pendingId)}
          >
            Apply selection
          </button>
        </div>

      </div>
    </div>
  )

  return createPortal(drawer, document.body)
}

export default ModelPickerDrawer
