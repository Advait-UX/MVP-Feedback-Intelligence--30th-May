// CreateSurveyDesign — 4-step wizard for creating / editing a survey template.
// Port of CreateSurveyDesign from prototype.html §9922–10453.
// Uses only Lyra CSS custom-property tokens; no hardcoded colours.

import { useState, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ChevronRight, Check, X, Eye } from 'lucide-react'
import type { SurveyDesignTemplate } from '../../types'
import { CAMPAIGNS } from '../../data/campaigns'
import { StatusPill } from '../campaigns/StatusPill'
import { DEFAULT_SURVEY_DESIGN } from '../../data/surveys'

// ---------------------------------------------------------------------------
// Wizard step definitions
// ---------------------------------------------------------------------------

interface WizardStep {
  n: number
  label: string
  desc: string
  valid: (d: Partial<SurveyDesignTemplate>) => boolean
}

const STEPS: WizardStep[] = [
  {
    n: 0,
    label: 'Identity',
    desc: 'Name this template and set ownership so your team knows when to use it.',
    valid: d => !!d.name,
  },
  {
    n: 1,
    label: 'Survey Content',
    desc: 'Configure the questions, channel, display style, and delivery rules for this template.',
    valid: d => !!d.defaultScaleQuestion,
  },
  {
    n: 2,
    label: 'Linked Campaigns',
    desc: 'Review campaigns that use this template. Changes here will affect all linked campaigns.',
    valid: () => true,
  },
  {
    n: 3,
    label: 'Summary & Review',
    desc: 'Review all settings before publishing your survey template.',
    valid: () => true,
  },
]

type StepState = 'default' | 'active' | 'done' | 'error'

// ---------------------------------------------------------------------------
// Segmented control
// ---------------------------------------------------------------------------

function Segmented({
  options,
  value,
  onChange,
  disabled = [],
}: {
  options: string[]
  value: string
  onChange: (v: string) => void
  disabled?: string[]
}) {
  return (
    <div
      role="group"
      style={{
        display: 'inline-flex',
        border: '1px solid var(--lyra-color-border-soft)',
        borderRadius: 'var(--radius-sm)',
        overflow: 'hidden',
        background: 'var(--lyra-slate-100)',
      }}
    >
      {options.map(opt => {
        const isActive = value === opt
        const isDisabled = disabled.includes(opt)
        return (
          <button
            key={opt}
            role="radio"
            aria-checked={isActive}
            disabled={isDisabled}
            onClick={() => !isDisabled && onChange(opt)}
            style={{
              padding: '6px 14px',
              border: 'none',
              background: isActive ? 'var(--lyra-color-bg-primary)' : 'transparent',
              color: isActive
                ? 'var(--lyra-color-fg-on-primary)'
                : isDisabled
                  ? 'var(--lyra-color-fg-disabled)'
                  : 'var(--lyra-color-fg-default)',
              font: `${isActive ? 500 : 400} 14px/20px var(--font-sans)`,
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              transition: 'background 100ms',
            }}
            onFocus={e => {
              if (!isActive) {
                (e.currentTarget).style.outline = '2px solid var(--lyra-color-border-focus-default)'
                ;(e.currentTarget).style.outlineOffset = '2px'
              }
            }}
            onBlur={e => { (e.currentTarget).style.outline = '' }}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// LinkedCampaignsTable — used in Steps 2 & 3.
// ---------------------------------------------------------------------------

interface LinkedCampaignsTableProps {
  linkedIds: number[]
}

function LinkedCampaignsTable({ linkedIds }: LinkedCampaignsTableProps) {
  const rows = CAMPAIGNS.filter(c => linkedIds.includes(c.id) && c.status !== 'inactive')

  if (rows.length === 0) {
    return (
      <div
        style={{
          padding: 'var(--space-8)',
          textAlign: 'center',
          color: 'var(--lyra-color-fg-secondary)',
          font: '400 14px/20px var(--font-sans)',
          background: 'var(--lyra-slate-50)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--lyra-color-border-subtle)',
        }}
      >
        No campaigns are linked to this template yet.
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid var(--lyra-color-border-subtle)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--sol-effect-shadowsm)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 140px',
          padding: '8px var(--space-5)',
          background: 'var(--lyra-slate-100)',
          borderBottom: '1px solid var(--lyra-color-border-subtle)',
        }}
      >
        {(['Campaign', 'Status'] as const).map(h => (
          <span
            key={h}
            style={{
              font: '500 12px/16px var(--font-sans)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--lyra-color-fg-secondary)',
            }}
          >
            {h}
          </span>
        ))}
      </div>

      {rows.map((c, i) => (
        <div
          key={c.id}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 140px',
            alignItems: 'center',
            padding: 'var(--space-4) var(--space-5)',
            borderBottom: i < rows.length - 1 ? '1px solid var(--lyra-color-border-subtle)' : 'none',
            background: 'var(--lyra-color-bg-surface-base)',
          }}
        >
          <div>
            <div style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>
              {c.name}
            </div>
          </div>
          <div><StatusPill s={c.status} /></div>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// WelcomeModeOption — radio card for welcome message mode.
// ---------------------------------------------------------------------------

function WelcomeModeOption({
  value,
  label,
  desc,
  checked,
  onChange,
}: {
  value: string
  label: string
  desc: string
  checked: boolean
  onChange: (v: string) => void
}) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '12px 14px',
        borderRadius: 'var(--radius-md)',
        border: checked
          ? '1.5px solid var(--lyra-color-border-active)'
          : '1px solid var(--lyra-color-border-soft)',
        background: checked ? 'var(--lyra-color-bg-active-subtle)' : 'var(--lyra-color-bg-surface-base)',
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
        transition: 'background 100ms, border-color 100ms',
      }}
    >
      <input
        type="radio"
        name="welcomeMode"
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        style={{ marginTop: 3, accentColor: 'var(--lyra-color-border-active)' }}
      />
      <span style={{ flex: 1 }}>
        <span style={{ display: 'block', font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>
          {label}
        </span>
        <span style={{ display: 'block', font: '400 12px/16px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', marginTop: 2 }}>
          {desc}
        </span>
      </span>
    </label>
  )
}

// ---------------------------------------------------------------------------
// SurveyPreviewModal — modal showing quick reply / list picker preview.
// ---------------------------------------------------------------------------

function SurveyPreviewModal({
  displayStyle,
  listPickerLabel,
  scaleQuestion,
  onClose,
}: {
  displayStyle: string
  listPickerLabel: string
  scaleQuestion: string
  onClose: () => void
}) {
  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 900,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.40)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--lyra-color-bg-surface-overlay)',
          borderRadius: 'var(--radius-xl)',
          padding: '28px 28px 24px',
          width: 380,
          boxShadow: 'var(--sol-effect-shadowxl)',
          fontFamily: 'var(--font-sans)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ font: '600 15px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>
              {displayStyle === 'Quick Reply' ? 'Quick Reply' : 'List Picker'} Preview
            </div>
            <div style={{ font: '400 12px/16px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', marginTop: 2 }}>
              How customers will see the survey
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close preview"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--lyra-color-fg-secondary)',
              padding: 4,
              borderRadius: 'var(--radius-sm)',
            }}
            onFocus={e => {
              (e.currentTarget).style.outline = '2px solid var(--lyra-color-border-focus-default)'
              ;(e.currentTarget).style.outlineOffset = '2px'
            }}
            onBlur={e => { (e.currentTarget).style.outline = '' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Mock chat UI */}
        <div
          style={{
            background: 'var(--lyra-slate-100)',
            borderRadius: 12,
            padding: '16px 14px',
            border: '1px solid var(--lyra-color-border-subtle)',
          }}
        >
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'var(--lyra-brand-500)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
              aria-hidden="true"
            >
              <svg viewBox="0 0 16 16" width="14" height="14" fill="white">
                <circle cx="8" cy="6" r="3"/>
                <path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" fill="white"/>
              </svg>
            </div>
            <div
              style={{
                background: 'var(--lyra-color-bg-surface-base)',
                borderRadius: '4px 12px 12px 12px',
                padding: '10px 12px',
                font: '400 13px/18px var(--font-sans)',
                color: 'var(--lyra-color-fg-default)',
                boxShadow: 'var(--sol-effect-shadowsm)',
                maxWidth: 260,
              }}
            >
              {scaleQuestion || 'On a scale of 1 to 5, how would you rate your experience today?'}
            </div>
          </div>

          {displayStyle === 'Quick Reply' ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingLeft: 36 }}>
              {['1', '2', '3', '4', '5'].map(n => (
                <div
                  key={n}
                  style={{
                    background: 'var(--lyra-color-bg-surface-base)',
                    border: '1px solid var(--lyra-brand-500)',
                    borderRadius: 20,
                    padding: '6px 14px',
                    font: '500 13px/18px var(--font-sans)',
                    color: 'var(--lyra-brand-600)',
                    cursor: 'pointer',
                  }}
                >
                  {n}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ paddingLeft: 36 }}>
              <div
                style={{
                  background: 'var(--lyra-color-bg-surface-base)',
                  borderRadius: 10,
                  overflow: 'hidden',
                  border: '1px solid var(--lyra-color-border-subtle)',
                }}
              >
                {listPickerLabel && (
                  <div
                    style={{
                      padding: '8px 14px',
                      font: '500 12px/16px var(--font-sans)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'var(--lyra-color-fg-secondary)',
                      borderBottom: '1px solid var(--lyra-color-border-subtle)',
                      background: 'var(--lyra-slate-50)',
                    }}
                  >
                    {listPickerLabel}
                  </div>
                )}
                {['1 — Poor', '2 — Fair', '3 — Good', '4 — Very Good', '5 — Excellent'].map((r, i, arr) => (
                  <div
                    key={r}
                    style={{
                      padding: '10px 14px',
                      font: '400 13px/18px var(--font-sans)',
                      color: 'var(--lyra-color-fg-default)',
                      borderBottom: i < arr.length - 1 ? '1px solid var(--lyra-color-border-subtle)' : 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {r}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            marginTop: 16,
            font: '400 12px/16px var(--font-sans)',
            color: 'var(--lyra-color-fg-secondary)',
            textAlign: 'center',
          }}
        >
          Click outside or press × to close
        </div>
      </div>
    </div>,
    document.body,
  )
}

// ---------------------------------------------------------------------------
// SaveOverlay — shown while saving.
// ---------------------------------------------------------------------------

function SaveOverlay({ name }: { name: string }) {
  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.45)',
      }}
      aria-live="assertive"
      role="status"
    >
      <div
        style={{
          background: 'var(--lyra-color-bg-surface-overlay)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-7)',
          textAlign: 'center',
          width: 320,
          boxShadow: 'var(--sol-effect-shadowxl)',
          fontFamily: 'var(--font-sans)',
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 'var(--radius-full)',
            background: 'var(--lyra-color-status-success-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto var(--space-4)',
          }}
        >
          <Check
            size={28}
            stroke="var(--lyra-color-status-success-strong)"
            strokeWidth={2.5}
          />
        </div>
        <h2
          style={{
            font: '600 20px/24px var(--font-sans)',
            color: 'var(--lyra-color-fg-default)',
            margin: '0 0 8px',
          }}
        >
          Template Saved!
        </h2>
        <p
          style={{
            font: '400 14px/20px var(--font-sans)',
            color: 'var(--lyra-color-fg-secondary)',
            margin: 0,
          }}
        >
          "{name}" is ready to use in campaigns.
        </p>
      </div>
    </div>,
    document.body,
  )
}

// ---------------------------------------------------------------------------
// WizardBar — horizontal step indicator.
// ---------------------------------------------------------------------------

function WizardBar({
  steps,
  activeStep,
  getState,
  onStepClick,
}: {
  steps: WizardStep[]
  activeStep: number
  getState: (s: WizardStep) => StepState
  onStepClick: (n: number) => void
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px var(--space-6)',
        borderBottom: '1px solid var(--lyra-color-border-subtle)',
        background: 'var(--lyra-color-bg-surface-shell)',
        flexShrink: 0,
        gap: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        {steps.map((s, i) => {
          const st = getState(s)
          const prevSt = i > 0 ? getState(steps[i - 1]) : null
          const lineActive = prevSt === 'done'

          return (
            <div key={s.n} style={{ display: 'flex', alignItems: 'center' }}>
              {/* Connector line */}
              {i > 0 && (
                <div
                  aria-hidden="true"
                  style={{
                    width: 48,
                    height: 2,
                    background: lineActive
                      ? 'var(--lyra-color-border-active)'
                      : 'var(--lyra-color-border-subtle)',
                    transition: 'background 200ms',
                  }}
                />
              )}

              {/* Step node + label */}
              <button
                onClick={() => onStepClick(s.n)}
                aria-current={st === 'active' ? 'step' : undefined}
                aria-label={`Step ${s.n + 1}: ${s.label}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0 4px',
                }}
                onFocus={e => {
                  (e.currentTarget).style.outline = '2px solid var(--lyra-color-border-focus-default)'
                  ;(e.currentTarget).style.outlineOffset = '4px'
                  ;(e.currentTarget).style.borderRadius = '4px'
                }}
                onBlur={e => { (e.currentTarget).style.outline = '' }}
              >
                {/* Circle node */}
                <div
                  aria-hidden="true"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 'var(--radius-full)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    font: '500 13px/16px var(--font-sans)',
                    transition: 'background 200ms, border-color 200ms',
                    ...(st === 'active'
                      ? {
                          background: 'var(--lyra-color-bg-primary)',
                          color: 'var(--lyra-color-fg-on-primary)',
                          border: '2px solid var(--lyra-color-bg-primary)',
                        }
                      : st === 'done'
                        ? {
                            background: 'var(--lyra-color-border-active)',
                            color: 'var(--lyra-color-fg-on-primary)',
                            border: '2px solid var(--lyra-color-border-active)',
                          }
                        : st === 'error'
                          ? {
                              background: 'var(--lyra-color-status-critical-subtle)',
                              color: 'var(--lyra-color-status-critical-strong)',
                              border: '2px solid var(--lyra-color-status-critical-strong)',
                            }
                          : {
                              background: 'var(--lyra-color-bg-surface-base)',
                              color: 'var(--lyra-color-fg-secondary)',
                              border: '2px solid var(--lyra-color-border-soft)',
                            }),
                  }}
                >
                  {st === 'done'
                    ? <Check size={13} strokeWidth={2.5} />
                    : st === 'error'
                      ? <X size={11} strokeWidth={2.2} />
                      : s.n + 1}
                </div>

                {/* Label */}
                <span
                  style={{
                    font: `${st === 'active' ? 500 : 400} 12px/14px var(--font-sans)`,
                    color: st === 'active'
                      ? 'var(--lyra-color-fg-active-strong)'
                      : st === 'error'
                        ? 'var(--lyra-color-status-critical-strong)'
                        : 'var(--lyra-color-fg-secondary)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {s.label}
                </span>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// SectionHeader — wizard section title + description.
// ---------------------------------------------------------------------------

function SectionHeader({ label, desc }: { label: string; desc: string }) {
  return (
    <div
      style={{
        padding: 'var(--space-6) var(--space-7) 0',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <h2
        style={{
          margin: '0 0 4px',
          font: '600 18px/24px var(--font-sans)',
          color: 'var(--lyra-color-fg-default)',
        }}
      >
        {label}
      </h2>
      <p style={{ margin: 0, font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)' }}>
        {desc}
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// SummarySection — used on the review step.
// ---------------------------------------------------------------------------

function SummarySection({
  title,
  num,
  children,
  onEdit,
}: {
  title: string
  num: number
  children: React.ReactNode
  onEdit?: () => void
}) {
  return (
    <div
      style={{
        background: 'var(--lyra-color-bg-surface-base)',
        border: '1px solid var(--lyra-color-border-soft)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--sol-effect-shadowsm)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          padding: '12px var(--space-5)',
          borderBottom: '1px solid var(--lyra-color-border-subtle)',
          background: 'var(--lyra-slate-50)',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 20,
            height: 20,
            borderRadius: 'var(--radius-full)',
            background: 'var(--lyra-color-bg-primary)',
            color: 'var(--lyra-color-fg-on-primary)',
            font: '500 11px/14px var(--font-sans)',
            flexShrink: 0,
          }}
        >
          {num}
        </span>
        <span style={{ flex: 1, font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>
          {title}
        </span>
        {onEdit && (
          <button
            onClick={onEdit}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              font: '400 13px/18px var(--font-sans)',
              color: 'var(--lyra-color-fg-action)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 6px',
              borderRadius: 'var(--radius-sm)',
            }}
            onFocus={e => {
              (e.currentTarget).style.outline = '2px solid var(--lyra-color-border-focus-default)'
              ;(e.currentTarget).style.outlineOffset = '2px'
            }}
            onBlur={e => { (e.currentTarget).style.outline = '' }}
          >
            Edit
          </button>
        )}
      </div>
      <div style={{ padding: 'var(--space-4) var(--space-5)' }}>{children}</div>
    </div>
  )
}

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '160px 1fr',
        gap: 'var(--space-4)',
        padding: '6px 0',
        borderBottom: '1px solid var(--lyra-color-border-subtle)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <div style={{ font: '500 13px/18px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)' }}>
        {label}
      </div>
      <div style={{ font: '400 13px/18px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>
        {children || <span style={{ color: 'var(--lyra-color-fg-disabled)' }}>—</span>}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// CreateSurveyDesign
// ---------------------------------------------------------------------------

export interface CreateSurveyDesignProps {
  /** When provided, the wizard is in edit mode. */
  initial?: SurveyDesignTemplate
  onCancel: () => void
  onSave: (d: SurveyDesignTemplate) => void
}

export function CreateSurveyDesign({ initial, onCancel, onSave }: CreateSurveyDesignProps) {
  const isEdit = !!initial

  const [d, setD] = useState<Partial<SurveyDesignTemplate>>(
    initial ?? { ...DEFAULT_SURVEY_DESIGN },
  )

  const set = useCallback(<K extends keyof SurveyDesignTemplate>(key: K, value: SurveyDesignTemplate[K]) => {
    setD(prev => ({ ...prev, [key]: value }))
  }, [])

  const [activeStep, setActiveStep] = useState(0)
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set())
  const [triedSteps, setTriedSteps] = useState<Set<number>>(new Set())
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Campaigns linked to this template (for step 2 / summary).
  const initialLinkedIds = useMemo<number[]>(() => {
    if (initial) {
      return CAMPAIGNS.filter(c => c.surveyDesignId === initial.id).map(c => c.id)
    }
    // Default preview: show a handful of placeholder campaigns.
    return CAMPAIGNS.slice(0, 3).map(c => c.id)
  }, [initial])

  const [linkedIds] = useState<number[]>(initialLinkedIds)

  // Step state computation.
  function getState(s: WizardStep): StepState {
    if (s.n === activeStep) {
      if (triedSteps.has(s.n) && !s.valid(d)) return 'error'
      return 'active'
    }
    if (triedSteps.has(s.n) && !s.valid(d)) return 'error'
    if (visitedSteps.has(s.n) && s.valid(d)) return 'done'
    if (visitedSteps.has(s.n) && !s.valid(d)) return 'error'
    return 'default'
  }

  function goNext() {
    setTriedSteps(prev => new Set([...prev, activeStep]))
    setVisitedSteps(prev => new Set([...prev, activeStep]))
    setActiveStep(prev => Math.min(prev + 1, STEPS.length - 1))
  }

  function goBack() {
    setActiveStep(prev => Math.max(prev - 1, 0))
  }

  function handleSave() {
    setSaving(true)
    setTimeout(() => {
      onSave(d as SurveyDesignTemplate)
    }, 2500)
  }

  const canSave = !!(d.name && d.defaultScaleQuestion)

  // Welcome mode options change slightly for IVR channel.
  const welcomeModeOptions = d.channel === 'IVR'
    ? [
        { v: 'with-optout',    label: 'Invitation with Opt Out',    desc: 'After hearing the message, the customer can press 1 to decline.' },
        { v: 'without-optout', label: 'Invitation without Opt Out', desc: 'The customer hears the message, then goes to the survey.' },
        { v: 'none',           label: 'None',                       desc: 'Survey starts immediately with no introduction.' },
      ]
    : [
        { v: 'with-optout',    label: 'Invitation with Opt Out',    desc: 'Customer can read the invitation & choose to decline it.' },
        { v: 'without-optout', label: 'Invitation without Opt Out', desc: 'Customer sees the invitation & start button only.' },
        { v: 'none',           label: 'None',                       desc: 'Survey starts immediately with no introduction.' },
      ]

  const FONT = 'var(--font-sans)'
  const currentStep = STEPS[activeStep]

  // Field-level validation triggers.
  const showErr0 = triedSteps.has(0)
  const showErr1 = triedSteps.has(1)
  const nameErr = showErr0 && !d.name
  const scaleErr = showErr1 && !d.defaultScaleQuestion

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        background: 'var(--lyra-color-bg-surface-base)',
        fontFamily: FONT,
      }}
    >
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '10px 24px',
          borderBottom: '1px solid var(--lyra-color-border-subtle)',
          font: '400 13px/18px var(--font-sans)',
          color: 'var(--lyra-color-fg-secondary)',
          flexShrink: 0,
        }}
      >
        <button
          onClick={onCancel}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            font: '400 13px/18px var(--font-sans)',
            color: 'var(--lyra-color-fg-link)',
          }}
          onFocus={e => {
            (e.currentTarget).style.outline = '2px solid var(--lyra-color-border-focus-default)'
            ;(e.currentTarget).style.outlineOffset = '2px'
            ;(e.currentTarget).style.borderRadius = '2px'
          }}
          onBlur={e => { (e.currentTarget).style.outline = '' }}
        >
          Survey Templates
        </button>
        <ChevronRight size={12} aria-hidden="true" />
        <span style={{ color: 'var(--lyra-color-fg-default)' }}>
          {isEdit ? d.name : 'New Survey Template'}
        </span>
      </nav>

      {/* Page header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '16px 24px',
          borderBottom: '1px solid var(--lyra-color-border-subtle)',
          flexShrink: 0,
        }}
      >
        <h1
          style={{
            flex: 1,
            margin: 0,
            font: '600 20px/24px var(--font-sans)',
            letterSpacing: '-0.01em',
            color: 'var(--lyra-color-fg-default)',
          }}
        >
          {isEdit ? d.name : 'New Survey Template'}
        </h1>
      </div>

      {/* Wizard step bar */}
      <WizardBar
        steps={STEPS}
        activeStep={activeStep}
        getState={getState}
        onStepClick={setActiveStep}
      />

      {/* Scrollable wizard body */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Section header */}
        {currentStep && (
          <SectionHeader label={currentStep.label} desc={currentStep.desc} />
        )}

        <div style={{ padding: 'var(--space-6) var(--space-7)' }}>

          {/* ── Step 0: Identity ── */}
          {activeStep === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-7)', maxWidth: 600 }}>
              {/* Template Name */}
              <div>
                <label
                  htmlFor="tmpl-name"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}
                >
                  <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>
                    Template Name
                    <span style={{ color: 'var(--lyra-color-status-critical-strong)', marginLeft: 2 }} aria-hidden="true">*</span>
                  </span>
                  <span style={{ font: '400 12px/16px var(--font-sans)', color: 'var(--lyra-color-fg-disabled)' }}>
                    {(d.name ?? '').length}/50
                  </span>
                </label>
                <input
                  id="tmpl-name"
                  type="text"
                  placeholder="e.g. Post-Chat CSAT"
                  maxLength={50}
                  aria-required="true"
                  aria-invalid={nameErr || undefined}
                  value={d.name ?? ''}
                  onChange={e => set('name', e.target.value)}
                  style={{
                    width: '100%',
                    height: 36,
                    padding: '0 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: nameErr
                      ? '1px solid var(--lyra-color-status-critical-strong)'
                      : '1px solid var(--lyra-color-border-soft)',
                    background: 'var(--lyra-color-bg-field)',
                    color: 'var(--lyra-color-fg-default)',
                    font: '400 14px/20px var(--font-sans)',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => {
                    (e.currentTarget).style.borderColor = 'var(--lyra-color-border-active)'
                    ;(e.currentTarget).style.boxShadow = '0 0 0 2px var(--lyra-brand-200)'
                  }}
                  onBlur={e => {
                    (e.currentTarget).style.borderColor = nameErr
                      ? 'var(--lyra-color-status-critical-strong)'
                      : 'var(--lyra-color-border-soft)'
                    ;(e.currentTarget).style.boxShadow = ''
                  }}
                />
                {nameErr && (
                  <div
                    role="alert"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      marginTop: 5,
                      font: '400 12px/16px var(--font-sans)',
                      color: 'var(--lyra-color-status-critical-strong)',
                    }}
                  >
                    <svg viewBox="0 0 16 16" width="12" height="12" fill="none"
                      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                      <circle cx="8" cy="8" r="6"/>
                      <line x1="8" y1="5" x2="8" y2="8.5"/>
                      <circle cx="8" cy="11" r=".6" fill="currentColor"/>
                    </svg>
                    Template name is required
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="tmpl-desc"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}
                >
                  <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>
                    Description
                  </span>
                  <span style={{ font: '400 12px/16px var(--font-sans)', color: 'var(--lyra-color-fg-disabled)' }}>
                    {(d.description ?? '').length}/200
                  </span>
                </label>
                <textarea
                  id="tmpl-desc"
                  rows={3}
                  maxLength={200}
                  placeholder="What this template is for and which campaigns should use it."
                  value={d.description ?? ''}
                  onChange={e => set('description', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--lyra-color-border-soft)',
                    background: 'var(--lyra-color-bg-field)',
                    color: 'var(--lyra-color-fg-default)',
                    font: '400 14px/20px var(--font-sans)',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => {
                    (e.currentTarget).style.borderColor = 'var(--lyra-color-border-active)'
                    ;(e.currentTarget).style.boxShadow = '0 0 0 2px var(--lyra-brand-200)'
                  }}
                  onBlur={e => {
                    (e.currentTarget).style.borderColor = 'var(--lyra-color-border-soft)'
                    ;(e.currentTarget).style.boxShadow = ''
                  }}
                />
                <div style={{ font: '400 12px/16px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', marginTop: 4 }}>
                  Help your team understand when to apply this template.
                </div>
              </div>
            </div>
          )}

          {/* ── Step 1: Survey Content ── */}
          {activeStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-7)' }}>

              {/* Channel */}
              <div>
                <h2 style={{ font: '500 16px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', margin: '0 0 4px' }}>
                  Channel
                </h2>
                <p style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', margin: '0 0 12px' }}>
                  Choose how this survey is delivered to customers.
                </p>
                <label
                  htmlFor="survey-channel"
                  style={{ display: 'block', font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', marginBottom: 8 }}
                >
                  Survey Channel<span style={{ color: 'var(--lyra-color-status-critical-strong)', marginLeft: 2 }} aria-hidden="true">*</span>
                </label>
                <Segmented
                  options={['Digital', 'IVR', 'All']}
                  disabled={['All']}
                  value={d.channel ?? 'Digital'}
                  onChange={v => set('channel', v)}
                />
                <div style={{ font: '400 12px/16px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', marginTop: 6 }}>
                  {d.channel === 'Digital'
                    ? 'Delivered on chat, AI sessions, social & email.'
                    : d.channel === 'IVR'
                      ? 'Sent after a phone call — customers respond using their keypad.'
                      : 'Delivered on both phone and digital channels.'}
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--lyra-color-border-subtle)', margin: '0' }} />

              {/* Welcome Message */}
              <div>
                <h2 style={{ font: '500 16px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', margin: '0 0 4px' }}>
                  Welcome Message
                </h2>
                <p style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', margin: '0 0 12px' }}>
                  Optionally introduce the survey before the first question.
                </p>
                <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
                  <legend style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', marginBottom: 8 }}>
                    Message Mode<span style={{ color: 'var(--lyra-color-status-critical-strong)', marginLeft: 2 }} aria-hidden="true">*</span>
                  </legend>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {welcomeModeOptions.map(opt => (
                      <WelcomeModeOption
                        key={opt.v}
                        value={opt.v}
                        label={opt.label}
                        desc={opt.desc}
                        checked={d.welcomeMode === opt.v}
                        onChange={v => set('welcomeMode', v as 'with-optout' | 'without-optout' | 'none')}
                      />
                    ))}
                  </div>
                </fieldset>

                {d.welcomeMode !== 'none' && (
                  <div style={{ marginTop: 'var(--space-5)', maxWidth: 600 }}>
                    <label
                      htmlFor="invite-text"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 6,
                      }}
                    >
                      <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>
                        Invitation Text
                      </span>
                      <span
                        style={{
                          font: '400 12px/16px var(--font-sans)',
                          color: (d.welcomeMessage ?? '').length > 220
                            ? 'var(--lyra-color-status-warning-strong)'
                            : 'var(--lyra-color-fg-disabled)',
                        }}
                      >
                        {(d.welcomeMessage ?? '').length}/240
                      </span>
                    </label>
                    <textarea
                      id="invite-text"
                      rows={4}
                      maxLength={240}
                      placeholder={`"{{First Name}}", we'd love to hear about your experience today. Just two minutes of your time.`}
                      value={d.welcomeMessage ?? ''}
                      onChange={e => set('welcomeMessage', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--lyra-color-border-soft)',
                        background: 'var(--lyra-color-bg-field)',
                        color: 'var(--lyra-color-fg-default)',
                        font: '400 14px/20px var(--font-sans)',
                        outline: 'none',
                        resize: 'vertical',
                        minHeight: 88,
                        boxSizing: 'border-box',
                      }}
                      onFocus={e => {
                        (e.currentTarget).style.borderColor = 'var(--lyra-color-border-active)'
                        ;(e.currentTarget).style.boxShadow = '0 0 0 2px var(--lyra-brand-200)'
                      }}
                      onBlur={e => {
                        (e.currentTarget).style.borderColor = 'var(--lyra-color-border-soft)'
                        ;(e.currentTarget).style.boxShadow = ''
                      }}
                    />

                    {/* Button labels (read-only) */}
                    {d.channel !== 'IVR' && (
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: d.welcomeMode === 'with-optout' ? '1fr 1fr' : '1fr',
                          gap: 'var(--space-4)',
                          marginTop: 'var(--space-4)',
                        }}
                      >
                        <div>
                          <label style={{ display: 'block', font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', marginBottom: 6 }}>
                            Start survey button label
                          </label>
                          <input
                            readOnly
                            disabled
                            value={d.buttonToStart ?? ''}
                            style={{
                              width: '100%',
                              height: 36,
                              padding: '0 12px',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--lyra-color-border-disabled)',
                              background: 'var(--lyra-color-bg-disabled)',
                              color: 'var(--lyra-color-fg-disabled)',
                              font: '400 14px/20px var(--font-sans)',
                              cursor: 'not-allowed',
                              boxSizing: 'border-box',
                            }}
                          />
                        </div>
                        {d.welcomeMode === 'with-optout' && (
                          <div>
                            <label style={{ display: 'block', font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', marginBottom: 6 }}>
                              Opt-out button label
                            </label>
                            <input
                              readOnly
                              disabled
                              value={d.buttonToOptOut ?? ''}
                              style={{
                                width: '100%',
                                height: 36,
                                padding: '0 12px',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--lyra-color-border-disabled)',
                                background: 'var(--lyra-color-bg-disabled)',
                                color: 'var(--lyra-color-fg-disabled)',
                                font: '400 14px/20px var(--font-sans)',
                                cursor: 'not-allowed',
                                boxSizing: 'border-box',
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--lyra-color-border-subtle)', margin: '0' }} />

              {/* Rating Format */}
              <div>
                <h2 style={{ font: '500 16px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', margin: '0 0 4px' }}>
                  Rating Format
                </h2>
                <p style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', margin: '0 0 12px' }}>
                  Choose the rating scale and how answer options are displayed.
                </p>

                {d.channel !== 'IVR' && (
                  <div style={{ maxWidth: 400, marginBottom: 'var(--space-4)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <label style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>
                        Digital Display Style<span style={{ color: 'var(--lyra-color-status-critical-strong)', marginLeft: 2 }} aria-hidden="true">*</span>
                      </label>
                      <button
                        onClick={() => setShowPreview(true)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          font: '400 13px/18px var(--font-sans)',
                          color: 'var(--lyra-color-fg-action)',
                          padding: '2px 4px',
                        }}
                        onFocus={e => {
                          (e.currentTarget).style.outline = '2px solid var(--lyra-color-border-focus-default)'
                          ;(e.currentTarget).style.outlineOffset = '2px'
                          ;(e.currentTarget).style.borderRadius = '2px'
                        }}
                        onBlur={e => { (e.currentTarget).style.outline = '' }}
                      >
                        <Eye size={14} aria-hidden="true" />
                        Preview
                      </button>
                    </div>
                    <Segmented
                      options={['Quick Reply', 'List Picker']}
                      value={d.displayStyle ?? 'Quick Reply'}
                      onChange={v => set('displayStyle', v)}
                    />
                    <div style={{ font: '400 12px/16px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', marginTop: 6 }}>
                      {d.displayStyle === 'Quick Reply'
                        ? 'Inline tappable bubbles — fastest to answer, best for mobile.'
                        : 'Rating options as a scrollable list — good for desktop.'}
                    </div>

                    {d.displayStyle === 'List Picker' && (
                      <div style={{ marginTop: 'var(--space-4)' }}>
                        <label
                          htmlFor="list-picker-label"
                          style={{ display: 'block', font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', marginBottom: 6 }}
                        >
                          List Picker Label<span style={{ color: 'var(--lyra-color-status-critical-strong)', marginLeft: 2 }} aria-hidden="true">*</span>
                        </label>
                        <input
                          id="list-picker-label"
                          type="text"
                          maxLength={20}
                          placeholder="Rate your experience"
                          value={d.listPickerLabel ?? ''}
                          onChange={e => set('listPickerLabel', e.target.value)}
                          style={{
                            width: '100%',
                            height: 36,
                            padding: '0 12px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--lyra-color-border-soft)',
                            background: 'var(--lyra-color-bg-field)',
                            color: 'var(--lyra-color-fg-default)',
                            font: '400 14px/20px var(--font-sans)',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                          onFocus={e => {
                            (e.currentTarget).style.borderColor = 'var(--lyra-color-border-active)'
                            ;(e.currentTarget).style.boxShadow = '0 0 0 2px var(--lyra-brand-200)'
                          }}
                          onBlur={e => {
                            (e.currentTarget).style.borderColor = 'var(--lyra-color-border-soft)'
                            ;(e.currentTarget).style.boxShadow = ''
                          }}
                        />
                        <div style={{ font: '400 12px/16px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', marginTop: 4 }}>
                          {(d.listPickerLabel ?? '').length}/20 characters
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Rating question */}
                <div style={{ maxWidth: 600, marginTop: 'var(--space-4)' }}>
                  <label
                    htmlFor="rating-q"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}
                  >
                    <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>
                      Rating Question<span style={{ color: 'var(--lyra-color-status-critical-strong)', marginLeft: 2 }} aria-hidden="true">*</span>
                    </span>
                    <span
                      style={{
                        font: '400 12px/16px var(--font-sans)',
                        color: (d.defaultScaleQuestion ?? '').length > 100
                          ? 'var(--lyra-color-status-warning-strong)'
                          : 'var(--lyra-color-fg-disabled)',
                      }}
                    >
                      {(d.defaultScaleQuestion ?? '').length}/120
                    </span>
                  </label>
                  <textarea
                    id="rating-q"
                    rows={2}
                    maxLength={120}
                    aria-required="true"
                    aria-invalid={scaleErr || undefined}
                    placeholder="On a scale of 1 to 5, how would you rate your experience today?"
                    value={d.defaultScaleQuestion ?? ''}
                    onChange={e => set('defaultScaleQuestion', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: scaleErr
                        ? '1px solid var(--lyra-color-status-critical-strong)'
                        : '1px solid var(--lyra-color-border-soft)',
                      background: 'var(--lyra-color-bg-field)',
                      color: 'var(--lyra-color-fg-default)',
                      font: '400 14px/20px var(--font-sans)',
                      outline: 'none',
                      resize: 'vertical',
                      minHeight: 64,
                      boxSizing: 'border-box',
                    }}
                    onFocus={e => {
                      (e.currentTarget).style.borderColor = 'var(--lyra-color-border-active)'
                      ;(e.currentTarget).style.boxShadow = '0 0 0 2px var(--lyra-brand-200)'
                    }}
                    onBlur={e => {
                      (e.currentTarget).style.borderColor = scaleErr
                        ? 'var(--lyra-color-status-critical-strong)'
                        : 'var(--lyra-color-border-soft)'
                      ;(e.currentTarget).style.boxShadow = ''
                    }}
                  />
                  {scaleErr && (
                    <div
                      role="alert"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        marginTop: 5,
                        font: '400 12px/16px var(--font-sans)',
                        color: 'var(--lyra-color-status-critical-strong)',
                      }}
                    >
                      <svg viewBox="0 0 16 16" width="12" height="12" fill="none"
                        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                        <circle cx="8" cy="8" r="6"/>
                        <line x1="8" y1="5" x2="8" y2="8.5"/>
                        <circle cx="8" cy="11" r=".6" fill="currentColor"/>
                      </svg>
                      Rating question is required
                    </div>
                  )}
                  <div style={{ font: '400 12px/16px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', marginTop: 4 }}>
                    This is the primary question customers will answer.
                  </div>
                </div>

                {/* Follow-up question */}
                <div style={{ maxWidth: 600, marginTop: 'var(--space-4)' }}>
                  <label
                    htmlFor="followup-q"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}
                  >
                    <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>
                      Follow-up Question{' '}
                      <span style={{ font: '400 13px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)' }}>
                        (optional)
                      </span>
                    </span>
                    <span style={{ font: '400 12px/16px var(--font-sans)', color: 'var(--lyra-color-fg-disabled)' }}>
                      {(d.defaultCommentQuestion ?? '').length}/120
                    </span>
                  </label>
                  <textarea
                    id="followup-q"
                    rows={2}
                    maxLength={120}
                    placeholder="What could we have done better?"
                    value={d.defaultCommentQuestion ?? ''}
                    onChange={e => set('defaultCommentQuestion', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--lyra-color-border-soft)',
                      background: 'var(--lyra-color-bg-field)',
                      color: 'var(--lyra-color-fg-default)',
                      font: '400 14px/20px var(--font-sans)',
                      outline: 'none',
                      resize: 'vertical',
                      minHeight: 64,
                      boxSizing: 'border-box',
                    }}
                    onFocus={e => {
                      (e.currentTarget).style.borderColor = 'var(--lyra-color-border-active)'
                      ;(e.currentTarget).style.boxShadow = '0 0 0 2px var(--lyra-brand-200)'
                    }}
                    onBlur={e => {
                      (e.currentTarget).style.borderColor = 'var(--lyra-color-border-soft)'
                      ;(e.currentTarget).style.boxShadow = ''
                    }}
                  />
                  <div style={{ font: '400 12px/16px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', marginTop: 4 }}>
                    An open-text follow-up shown after the rating response.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Linked Campaigns ── */}
          {activeStep === 2 && (
            <div>
              {!isEdit || d.isDefault ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '40px 32px',
                    textAlign: 'center',
                    background: 'var(--lyra-slate-50)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px dashed var(--lyra-color-border-soft)',
                  }}
                >
                  <svg viewBox="0 0 24 24" width="32" height="32" fill="none"
                    stroke="var(--lyra-slate-400)" strokeWidth="1.5" strokeLinecap="round"
                    strokeLinejoin="round" aria-hidden="true" style={{ marginBottom: 12 }}>
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                  </svg>
                  <p style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', margin: '0 0 6px' }}>
                    No campaigns linked yet
                  </p>
                  <p style={{ font: '400 13px/18px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', margin: 0, maxWidth: 400 }}>
                    Save this template first, then go to a Campaign and select this template to link it.
                    Linked campaigns will appear here automatically.
                  </p>
                </div>
              ) : (
                <LinkedCampaignsTable linkedIds={linkedIds} />
              )}
            </div>
          )}

          {/* ── Step 3: Summary & Review ── */}
          {activeStep === 3 && (() => {
            const missingRequired = !d.name || !d.defaultScaleQuestion
            const WELCOME_LABEL: Record<string, string> = {
              'with-optout': 'Invitation with Opt Out',
              'without-optout': 'Invitation without Opt Out',
              none: 'None',
            }

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {/* Error banner */}
                {missingRequired && (
                  <div
                    role="alert"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 14px',
                      background: 'var(--lyra-color-status-critical-subtle)',
                      border: '1px solid var(--lyra-color-status-critical-medium)',
                      borderRadius: 'var(--radius-md)',
                      font: '400 13px/18px var(--font-sans)',
                      color: 'var(--lyra-color-status-critical-strong)',
                    }}
                  >
                    <svg viewBox="0 0 16 16" width="14" height="14" fill="none"
                      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                      <circle cx="8" cy="8" r="6"/>
                      <line x1="8" y1="5" x2="8" y2="8.5"/>
                      <circle cx="8" cy="11" r=".6" fill="currentColor"/>
                    </svg>
                    Some required fields are incomplete. Return to the relevant steps to fill them in.
                  </div>
                )}

                {/* Summary sections */}
                <SummarySection title="Identity" num={1} onEdit={() => setActiveStep(0)}>
                  <SummaryRow label="Template Name">
                    {d.name || (
                      <span style={{ color: 'var(--lyra-color-status-critical-strong)' }}>Required</span>
                    )}
                  </SummaryRow>
                  {d.description && <SummaryRow label="Description">{d.description}</SummaryRow>}
                </SummarySection>

                <SummarySection title="Survey Content" num={2} onEdit={() => setActiveStep(1)}>
                  <SummaryRow label="Survey Channel">{d.channel ?? 'Digital'}</SummaryRow>
                  <SummaryRow label="Welcome Message">
                    {d.welcomeMode ? WELCOME_LABEL[d.welcomeMode] ?? d.welcomeMode : 'Not set'}
                  </SummaryRow>
                  {d.welcomeMode && d.welcomeMode !== 'none' && d.welcomeMessage && (
                    <SummaryRow label="Invitation Text">
                      <span style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      } as React.CSSProperties}>
                        {d.welcomeMessage}
                      </span>
                    </SummaryRow>
                  )}
                  {d.channel !== 'IVR' && (
                    <SummaryRow label="Display Style">{d.displayStyle ?? 'Quick Reply'}</SummaryRow>
                  )}
                  <SummaryRow label="Rating Question">
                    {d.defaultScaleQuestion || (
                      <span style={{ color: 'var(--lyra-color-status-critical-strong)' }}>Required</span>
                    )}
                  </SummaryRow>
                  {d.defaultCommentQuestion && (
                    <SummaryRow label="Follow-up Question">{d.defaultCommentQuestion}</SummaryRow>
                  )}
                </SummarySection>

                <SummarySection title="Linked Campaigns" num={3}>
                  <div style={{ margin: '0 calc(-1 * var(--space-4)) calc(-1 * var(--space-3))' }}>
                    <LinkedCampaignsTable linkedIds={linkedIds} />
                  </div>
                </SummarySection>
              </div>
            )
          })()}

        </div>
      </div>

      {/* ── Wizard footer ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 24px',
          borderTop: '1px solid var(--lyra-color-border-subtle)',
          flexShrink: 0,
          gap: 8,
        }}
      >
        {/* Cancel */}
        <button
          onClick={onCancel}
          style={{
            height: 36,
            padding: '0 16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--lyra-color-border-soft)',
            background: 'var(--lyra-color-bg-surface-base)',
            color: 'var(--lyra-color-fg-default)',
            font: '500 14px/20px var(--font-sans)',
            cursor: 'pointer',
            transition: 'background 120ms',
          }}
          onMouseEnter={e => { (e.currentTarget).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
          onMouseLeave={e => { (e.currentTarget).style.background = 'var(--lyra-color-bg-surface-base)' }}
          onFocus={e => {
            (e.currentTarget).style.outline = '2px solid var(--lyra-color-border-focus-default)'
            ;(e.currentTarget).style.outlineOffset = '2px'
          }}
          onBlur={e => { (e.currentTarget).style.outline = '' }}
        >
          Cancel
        </button>

        <span style={{ flex: 1 }} />

        {/* Back (steps 1–3) */}
        {activeStep > 0 && (
          <button
            onClick={goBack}
            style={{
              height: 36,
              padding: '0 16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--lyra-color-border-soft)',
              background: 'var(--lyra-color-bg-surface-base)',
              color: 'var(--lyra-color-fg-default)',
              font: '500 14px/20px var(--font-sans)',
              cursor: 'pointer',
              transition: 'background 120ms',
            }}
            onMouseEnter={e => { (e.currentTarget).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
            onMouseLeave={e => { (e.currentTarget).style.background = 'var(--lyra-color-bg-surface-base)' }}
            onFocus={e => {
              (e.currentTarget).style.outline = '2px solid var(--lyra-color-border-focus-default)'
              ;(e.currentTarget).style.outlineOffset = '2px'
            }}
            onBlur={e => { (e.currentTarget).style.outline = '' }}
          >
            ← Back
          </button>
        )}

        {/* Next / Save */}
        {activeStep < STEPS.length - 1 ? (
          <button
            onClick={goNext}
            style={{
              height: 36,
              padding: '0 16px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: 'var(--lyra-color-bg-primary)',
              color: 'var(--lyra-color-fg-on-primary)',
              font: '500 14px/20px var(--font-sans)',
              cursor: 'pointer',
              transition: 'background 120ms',
            }}
            onMouseEnter={e => { (e.currentTarget).style.background = 'var(--lyra-color-state-bg-hover-primary)' }}
            onMouseLeave={e => { (e.currentTarget).style.background = 'var(--lyra-color-bg-primary)' }}
            onFocus={e => {
              (e.currentTarget).style.outline = '2px solid var(--lyra-color-border-focus-default)'
              ;(e.currentTarget).style.outlineOffset = '2px'
            }}
            onBlur={e => { (e.currentTarget).style.outline = '' }}
          >
            {activeStep === STEPS.length - 2 ? 'Review →' : 'Next →'}
          </button>
        ) : (
          <button
            disabled={!canSave}
            onClick={handleSave}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              height: 36,
              padding: '0 16px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: canSave ? 'var(--lyra-color-bg-primary)' : 'var(--lyra-color-bg-disabled)',
              color: canSave ? 'var(--lyra-color-fg-on-primary)' : 'var(--lyra-color-fg-disabled)',
              font: '500 14px/20px var(--font-sans)',
              cursor: canSave ? 'pointer' : 'not-allowed',
              opacity: canSave ? 1 : 0.6,
              transition: 'background 120ms',
            }}
            onMouseEnter={e => { if (canSave) (e.currentTarget).style.background = 'var(--lyra-color-state-bg-hover-primary)' }}
            onMouseLeave={e => { if (canSave) (e.currentTarget).style.background = 'var(--lyra-color-bg-primary)' }}
            onFocus={e => {
              if (canSave) {
                (e.currentTarget).style.outline = '2px solid var(--lyra-color-border-focus-default)'
                ;(e.currentTarget).style.outlineOffset = '2px'
              }
            }}
            onBlur={e => { (e.currentTarget).style.outline = '' }}
          >
            <Check size={14} aria-hidden="true" />
            {isEdit ? 'Save changes' : 'Save template'}
          </button>
        )}
      </div>

      {/* Preview modal */}
      {showPreview && (
        <SurveyPreviewModal
          displayStyle={d.displayStyle ?? 'Quick Reply'}
          listPickerLabel={d.listPickerLabel ?? ''}
          scaleQuestion={d.defaultScaleQuestion ?? ''}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* Save overlay */}
      {saving && <SaveOverlay name={d.name ?? 'Template'} />}
    </div>
  )
}
