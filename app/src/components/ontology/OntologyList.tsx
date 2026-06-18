// OntologyList — the Ontology Studio landing table view.
// Mirrors prototype.html lines 10837–10941: pane header with count badge +
// "Configure New Model" CTA, info banner, table rows with model name / mapped
// campaigns / last-updated / kebab actions.
// Also mirrors CampaignList (lines 11070–11152) and CampaignListPopover
// (lines 10981–11068) for the "+N more" flow.

import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Ontology } from '../../types'
import { formatUpdatedAt } from '../../data/ontology'
import { OntologyRowActions } from './OntologyRowActions'

// ---------------------------------------------------------------------------
// CampaignListPopover — fixed-position dropdown listing hidden campaigns
// ---------------------------------------------------------------------------

interface CampaignListPopoverProps {
  anchor: HTMLElement | null
  hidden: string[]
  onClose: () => void
}

function CampaignListPopover({ anchor, hidden, onClose }: CampaignListPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  // position: fixed — relative to viewport, no scroll offset needed
  useLayoutEffect(() => {
    if (!anchor) return
    const r = anchor.getBoundingClientRect()
    const popW = 320
    const vw = window.innerWidth
    const gap = 16
    let left = r.right - popW
    if (left < gap) left = gap
    if (left + popW > vw - gap) left = vw - popW - gap
    setPos({ top: r.bottom + 8, left })
  }, [anchor])

  // Dismiss on outside-click or Escape
  useLayoutEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
        anchor?.focus()
      }
    }
    function onDown(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        anchor &&
        !anchor.contains(e.target as Node)
      ) {
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [onClose, anchor])

  return createPortal(
    <div
      ref={popoverRef}
      role="dialog"
      aria-label={`${hidden.length} additional campaigns`}
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        width: 320,
        zIndex: 9999,
        background: 'var(--color-bg-surface-overlay)',
        border: '1px solid var(--color-border-soft)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0px 12px 24px 0px rgba(0,0,0,0.12)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-3) var(--space-4)',
          borderBottom: '1px solid var(--color-border-subtle)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 12,
            fontWeight: 500,
            lineHeight: '16px',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--color-fg-secondary)',
          }}
        >
          {hidden.length} more campaign{hidden.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 24,
            height: 24,
            borderRadius: 'var(--radius-sm)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-fg-secondary)',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-state-bg-hover)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none' }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Campaign rows */}
      <div style={{ maxHeight: 260, overflowY: 'auto', padding: 'var(--space-1) 0' }}>
        {hidden.map((c, i) => (
          <div
            key={i}
            style={{
              padding: 'var(--space-2) var(--space-4)',
              fontFamily: 'var(--font-sans)',
              fontSize: 14,
              fontWeight: 400,
              lineHeight: '20px',
              color: 'var(--color-fg-default)',
              borderBottom: i < hidden.length - 1 ? '1px solid var(--color-border-subtle)' : 'none',
            }}
          >
            {c}
          </div>
        ))}
      </div>
    </div>,
    document.body,
  )
}

// ---------------------------------------------------------------------------
// CampaignList — inline chip list that measures available width and shows a
// "+N more" button revealing the popover for the rest.
// ---------------------------------------------------------------------------

interface CampaignListProps {
  campaigns: string[]
  valueStyle: React.CSSProperties
}

function CampaignList({ campaigns, valueStyle }: CampaignListProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLSpanElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [visibleCount, setVisibleCount] = useState(campaigns.length)
  const [popoverOpen, setPopoverOpen] = useState(false)

  // Measure & clip — recalculate whenever container width changes
  useLayoutEffect(() => {
    if (!containerRef.current || campaigns.length === 0) return

    function recalc() {
      const container = containerRef.current
      const measure = measureRef.current
      if (!container || !measure) return
      const availW = container.clientWidth
      const moreW = 80
      let used = 0
      let count = 0
      for (let i = 0; i < campaigns.length; i++) {
        measure.textContent = campaigns[i]
        const chipW = measure.scrollWidth + (i > 0 ? 14 : 0)
        const needMore = i < campaigns.length - 1
        if (used + chipW + (needMore ? moreW : 0) <= availW) {
          used += chipW
          count = i + 1
        } else {
          break
        }
      }
      setVisibleCount(Math.max(1, count))
    }

    recalc()
    const ro = new ResizeObserver(recalc)
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [campaigns])

  const visible = campaigns.slice(0, visibleCount)
  const hidden = campaigns.slice(visibleCount)
  const closePopover = useCallback(() => setPopoverOpen(false), [])

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        alignItems: 'center',
        minWidth: 0,
        overflow: 'hidden',
        whiteSpace: 'nowrap',
      }}
    >
      {/* Hidden measurer — invisible span used only for pixel-width measurement */}
      <span
        ref={measureRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          visibility: 'hidden',
          pointerEvents: 'none',
          fontFamily: 'var(--font-sans)',
          fontSize: 14,
          fontWeight: 400,
          whiteSpace: 'nowrap',
        }}
      />

      {/* Visible campaign names */}
      <span
        style={{
          ...valueStyle,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          flexShrink: 1,
        }}
      >
        {visible.join(', ')}
      </span>

      {/* +N more trigger + popover */}
      {hidden.length > 0 && (
        <>
          <button
            ref={triggerRef}
            aria-haspopup="dialog"
            aria-expanded={popoverOpen}
            onClick={e => {
              e.stopPropagation()
              setPopoverOpen(o => !o)
            }}
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 14,
              fontWeight: 500,
              lineHeight: '20px',
              color: 'var(--color-fg-link)',
              background: 'none',
              border: 'none',
              padding: 0,
              marginLeft: 'var(--space-1)',
              cursor: 'pointer',
              flexShrink: 0,
              whiteSpace: 'nowrap',
              textDecoration: 'none',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.textDecoration = 'underline' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.textDecoration = 'none' }}
          >
            +{hidden.length} more
          </button>

          {popoverOpen && (
            <CampaignListPopover
              anchor={triggerRef.current}
              hidden={hidden}
              onClose={closePopover}
            />
          )}
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// OntologyList — the main landing table
// ---------------------------------------------------------------------------

interface OntologyListProps {
  ontologies: Ontology[]
  onEdit: (id: string) => void
  onRemove: (id: string) => void
  onNew: () => void
  /** ID of the most-recently published ontology — triggers the row highlight animation */
  publishedId: string | null
}

export function OntologyList({
  ontologies,
  onEdit,
  onRemove,
  onNew,
  publishedId,
}: OntologyListProps) {
  return (
    <div className="pane">
      {/* Pane header */}
      <div className="pane-head">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          Ontology Studio
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
            {ontologies.length}
          </span>
        </h1>

        <div className="head-actions">
          <button className="btn primary" onClick={onNew}>
            <svg viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Configure New Model
          </button>
        </div>
      </div>

      {/* Scrollable table area */}
      <div className="table-wrap">
        {/* Info banner */}
        <div className="info-banner" style={{ marginBottom: 'var(--space-4)' }}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          <span>
            Each row is the VU-score ontology for a Topic AI Model. Edit a row to update category
            weights, or configure a new model to add a fresh ontology.
          </span>
        </div>

        <table>
          <thead>
            <tr>
              <th>Topic AI Model</th>
              <th>Mapped campaigns</th>
              <th style={{ width: 200, whiteSpace: 'nowrap' }}>Last updated</th>
              <th style={{ width: 52, textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {ontologies.map(o => {
              const mapped = o.mappedCampaigns || []
              const valueStyle: React.CSSProperties = {
                font: '400 14px/20px var(--font-sans)',
                color: 'var(--color-fg-default)',
              }
              return (
                <tr
                  key={o.id}
                  onClick={() => onEdit(o.id)}
                  style={{ cursor: 'pointer' }}
                  className={o.id === publishedId ? 'new-campaign-row' : undefined}
                >
                  {/* Model name + upstream-changes pill */}
                  <td style={{ width: 340 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                        flexWrap: 'wrap',
                      }}
                    >
                      <a
                        className="agent-link"
                        href="#"
                        style={{ fontWeight: 500 }}
                        onClick={e => {
                          e.preventDefault()
                          onEdit(o.id)
                        }}
                      >
                        {o.modelName}
                      </a>

                      {o.hasUpstreamChanges && (
                        <span
                          className="fi-pill warning"
                          title="Topic AI has new updates for this model"
                        >
                          <span className="dot" />
                          Updates available
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        marginTop: 'var(--space-1)',
                        font: '400 12px/16px var(--font-sans)',
                        color: 'var(--color-fg-secondary)',
                      }}
                    >
                      {o.categories.length} categories
                    </div>
                  </td>

                  {/* Mapped campaigns — inline chip list with +N more */}
                  <td>
                    {mapped.length === 0 ? (
                      <span
                        style={{
                          font: '400 14px/20px var(--font-sans)',
                          color: 'var(--color-fg-secondary)',
                          fontStyle: 'italic',
                        }}
                      >
                        None
                      </span>
                    ) : (
                      <>
                        <div
                          style={{
                            font: '500 14px/20px var(--font-sans)',
                            color: 'var(--color-fg-default)',
                          }}
                        >
                          {mapped.length} {mapped.length === 1 ? 'campaign' : 'campaigns'}
                        </div>
                        <div
                          style={{
                            font: '400 12px/16px var(--font-sans)',
                            color: 'var(--color-fg-secondary)',
                            marginTop: 'var(--space-1)',
                          }}
                        >
                          {mapped.slice(0, 2).join(', ')}
                          {mapped.length > 2 && (
                            <>
                              ,{' '}
                              <span
                                style={{
                                  color: 'var(--color-fg-link)',
                                  fontWeight: 500,
                                }}
                              >
                                +{mapped.length - 2} more
                              </span>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </td>

                  {/* Last updated */}
                  <td>
                    <div
                      style={{
                        font: '400 14px/20px var(--font-sans)',
                        color: 'var(--color-fg-default)',
                      }}
                    >
                      {formatUpdatedAt(o.updatedAt)}
                    </div>
                    {o.updatedBy && (
                      <div
                        style={{
                          font: '400 12px/16px var(--font-sans)',
                          color: 'var(--color-fg-secondary)',
                          marginTop: 'var(--space-1)',
                        }}
                      >
                        by {o.updatedBy}
                      </div>
                    )}
                  </td>

                  {/* Row actions */}
                  <td style={{ textAlign: 'center' }}>
                    <OntologyRowActions
                      onEdit={() => onEdit(o.id)}
                      onRemove={() => onRemove(o.id)}
                    />
                  </td>
                </tr>
              )
            })}

            {ontologies.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    padding: 'var(--space-6)',
                    textAlign: 'center',
                    font: '400 14px/20px var(--font-sans)',
                    color: 'var(--color-fg-secondary)',
                  }}
                >
                  No ontology configurations yet. Click{' '}
                  <strong>Configure New Model</strong> to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
