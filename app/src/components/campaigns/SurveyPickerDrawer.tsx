/**
 * SurveyPickerDrawer — slide-in panel for choosing a Survey Template.
 *
 * Mirrors the `SurveyPickerDrawer` function in prototype.html:
 *   - Same class names: `.tmpl-drawer-overlay`, `.model-picker-drawer`,
 *     `.model-picker-head`, `.model-picker-search-wrap`, `.model-picker-count`,
 *     `.model-picker-list`, `.model-picker-row`, `.model-picker-foot`
 *   - `.lyra-radio` indicator
 *   - "When to use" and "Channels" meta rows
 *
 * Rendered into document.body via a React portal.
 */

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { SURVEY_DESIGNS } from '../../data/campaigns'
import type { SurveyDesignTemplate } from '../../types'

interface SurveyPickerDrawerProps {
  currentId: string
  onClose: () => void
  onSelect: (id: string) => void
}

export function SurveyPickerDrawer({ currentId, onClose, onSelect }: SurveyPickerDrawerProps) {
  const [query, setQuery] = useState('')
  const [pendingId, setPendingId] = useState(currentId || '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const filtered: SurveyDesignTemplate[] = query.trim()
    ? SURVEY_DESIGNS.filter(
        (s) =>
          s.name.toLowerCase().includes(query.toLowerCase()) ||
          s.category.toLowerCase().includes(query.toLowerCase()) ||
          s.why.toLowerCase().includes(query.toLowerCase())
      )
    : SURVEY_DESIGNS

  const drawer = (
    <div className="tmpl-drawer-overlay" onClick={onClose}>
      <div className="model-picker-drawer" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="model-picker-head">
          <div style={{ flex: 1 }}>
            <div
              style={{ font: '600 16px/24px var(--font-sans)', color: 'var(--color-fg-default)' }}
            >
              Choose Survey Template
            </div>
            <div
              style={{
                font: '400 13px/20px var(--font-sans)',
                color: 'var(--color-fg-secondary)',
                marginTop: 2,
              }}
            >
              Select the survey that best matches your campaign's measurement goal.
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
            placeholder="Search by name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search survey templates"
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
          {filtered.length} survey{filtered.length !== 1 ? 's' : ''}
          {query ? ` matching "${query}"` : ' available'}
        </div>

        {/* Survey list */}
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
              No surveys match your search.
            </div>
          ) : (
            filtered.map((s) => {
              const isSelected = pendingId === s.id
              return (
                <div
                  key={s.id}
                  className={`model-picker-row ${isSelected ? 'selected' : ''}`}
                  onClick={() => setPendingId(s.id)}
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') setPendingId(s.id)
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
                          marginBottom: 'var(--space-1)',
                        }}
                      >
                        <span
                          style={{
                            font: '500 14px/20px var(--font-sans)',
                            color: 'var(--color-fg-default)',
                          }}
                        >
                          {s.name}
                        </span>
                      </div>

                      {s.why && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 5,
                            marginTop: 5,
                          }}
                        >
                          <svg
                            viewBox="0 0 14 14"
                            width="12"
                            height="12"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            style={{
                              flexShrink: 0,
                              marginTop: 2,
                              color: 'var(--color-fg-action)',
                            }}
                          >
                            <circle cx="7" cy="7" r="6" />
                            <path d="M7 4.5v3l1.8 1.2" />
                          </svg>
                          <div>
                            <span
                              style={{
                                font: '500 12px/16px var(--font-sans)',
                                color: 'var(--color-fg-secondary)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                              }}
                            >
                              When to use{'  '}
                            </span>
                            <span
                              style={{
                                font: '400 12px/18px var(--font-sans)',
                                color: 'var(--color-fg-secondary)',
                              }}
                            >
                              {s.why}
                            </span>
                          </div>
                        </div>
                      )}

                      {s.channels && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 5,
                            marginTop: 5,
                          }}
                        >
                          <svg
                            viewBox="0 0 14 14"
                            width="12"
                            height="12"
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
                            <path d="M1 4.5C3.5 2 10.5 2 13 4.5" />
                            <path d="M3 7c1.4-1.4 7.6-1.4 8 0" />
                            <path d="M5.5 9.5c.8-.8 2.2-.8 3 0" />
                            <circle cx="7" cy="12" r=".6" fill="currentColor" stroke="none" />
                          </svg>
                          <div>
                            <span
                              style={{
                                font: '500 12px/16px var(--font-sans)',
                                color: 'var(--color-fg-secondary)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                              }}
                            >
                              Channels{'  '}
                            </span>
                            <span
                              style={{
                                font: '400 12px/18px var(--font-sans)',
                                color: 'var(--color-fg-secondary)',
                              }}
                            >
                              {s.channels}
                            </span>
                          </div>
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

export default SurveyPickerDrawer
