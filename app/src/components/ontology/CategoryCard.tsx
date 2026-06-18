// CategoryCard — single category card: Lyra slider + numeric weight input + badges.
// Mirrors prototype.html lines 11585–11715 (the per-category card block inside the
// 2-column grid), including the isNew / isRemoved visual states, hover/focus ring,
// slider CSS variable trick for the filled-track gradient, and the inline error for
// out-of-range weight values.

import '../../styles/ontology.css'
import type { Category } from '../../types'

interface CategoryCardProps {
  category: Category
  isNew: boolean
  isRemoved: boolean
  onChange: (patch: Partial<Category>) => void
}

const SLIDER_MIN = 1
const SLIDER_MAX = 10

export function CategoryCard({ category, isNew, isRemoved, onChange }: CategoryCardProps) {
  const safeWeight = Math.min(SLIDER_MAX, Math.max(SLIDER_MIN, isNaN(category.weight) ? SLIDER_MIN : category.weight))
  const sliderPct = ((safeWeight - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN) * 100) + '%'

  // The weight input may hold a transient raw string while the user is typing
  const raw = category._rawInput !== undefined ? category._rawInput : String(category.weight)
  const parsed = parseInt(raw)
  const hasError = raw !== '' && (isNaN(parsed) || parsed < SLIDER_MIN || parsed > SLIDER_MAX)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        background: 'var(--lyra-white, #fff)',
        border: '1px solid rgba(0,0,0,0.16)',
        borderRadius: 'var(--radius-md)',
        padding: '7px var(--space-4)',
        minHeight: 44,
        opacity: isRemoved ? 0.7 : 1,
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={e => {
        if (!isRemoved) {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--lyra-brand-300)'
          ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-sm)'
        }
      }}
      onMouseLeave={e => {
        ;(e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,0,0,0.16)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
      }}
    >
      {/* Category name + badge */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: 'block',
            font: '600 13px/18px var(--font-sans)',
            color: 'var(--color-fg-default)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textDecoration: isRemoved ? 'line-through' : 'none',
          }}
        >
          {category.name}
        </span>

        {isNew && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              height: 20,
              padding: '0 8px',
              marginTop: 4,
              font: '500 12px/20px var(--font-sans)',
              letterSpacing: '0.01em',
              color: 'var(--lyra-color-status-success-strong)',
              background: 'var(--lyra-color-status-success-subtle)',
              border: '1px solid var(--lyra-color-status-success-medium)',
              borderRadius: 'var(--radius-full)',
            }}
          >
            New Category
          </span>
        )}

        {isRemoved && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              height: 20,
              padding: '0 8px',
              marginTop: 4,
              font: '500 12px/20px var(--font-sans)',
              letterSpacing: '0.01em',
              color: 'var(--lyra-color-status-critical-strong)',
              background: 'var(--lyra-color-status-critical-subtle)',
              border: '1px solid var(--lyra-color-status-critical-medium)',
              borderRadius: 'var(--radius-full)',
            }}
          >
            Removed
          </span>
        )}
      </div>

      {/* Lyra Slider + Numeric Stepper */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '42px',
          flexShrink: 0,
          opacity: isRemoved ? 0.4 : 1,
          pointerEvents: isRemoved ? 'none' : 'auto',
        }}
      >
        {/* Slider track + tick marks */}
        <div style={{ width: 300 }}>
          <input
            type="range"
            min={SLIDER_MIN}
            max={SLIDER_MAX}
            value={safeWeight}
            className="lyra-slider-input"
            disabled={isRemoved}
            onChange={e => onChange({ weight: parseInt(e.target.value) })}
            // CSS custom property drives the filled-track gradient
            style={{ '--lyra-slider-pct': sliderPct } as React.CSSProperties}
            aria-label={`Weight for ${category.name}`}
          />
          <div className="lyra-slider-marks">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
              <div key={n} className="lyra-slider-mark">
                <div className="lyra-slider-tick" />
                {/* Only show labels at 1, 5, 10 — others hidden but present for layout */}
                <span
                  className="lyra-slider-tick-label"
                  style={n === 1 || n === 5 || n === 10 ? undefined : { visibility: 'hidden' }}
                >
                  {n}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Numeric weight input */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
          <input
            type="number"
            className={`lyra-weight-input${hasError ? ' has-error' : ''}`}
            value={raw}
            min={SLIDER_MIN}
            max={SLIDER_MAX}
            disabled={isRemoved}
            aria-label={`Numeric weight for ${category.name}`}
            onChange={e => {
              const v = e.target.value
              const n = parseInt(v)
              if (v === '' || isNaN(n)) {
                onChange({ _rawInput: v })
              } else {
                onChange({ weight: n, _rawInput: v })
              }
            }}
            onBlur={e => {
              const n = parseInt(e.target.value)
              if (!isNaN(n) && n >= SLIDER_MIN && n <= SLIDER_MAX) {
                onChange({ weight: n, _rawInput: undefined })
              }
            }}
            onFocus={e => {
              e.target.style.borderColor = hasError
                ? 'var(--lyra-color-status-critical-strong)'
                : 'var(--lyra-brand-600)'
              e.target.style.boxShadow = hasError
                ? '0 0 0 2px rgba(189,42,42,0.15)'
                : '0 0 0 2px rgba(22,108,202,0.15)'
            }}
            onBlurCapture={e => {
              e.target.style.borderColor = hasError
                ? 'var(--lyra-color-status-critical-strong)'
                : 'rgba(0,0,0,0.46)'
              e.target.style.boxShadow = 'none'
            }}
          />
          {hasError && <div className="lyra-stepper-error">Enter 1–10</div>}
        </div>
      </div>
    </div>
  )
}
