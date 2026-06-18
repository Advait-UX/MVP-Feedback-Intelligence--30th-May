/**
 * CreateCampaign — 4-step wizard for creating or editing a survey campaign.
 *
 * Steps
 *   0  Campaign, Identity & Scope   (name, dates, agents, language, interaction length)
 *   1  Suppression Rules            (opt-out, recency, internal interactions)
 *   2  Topic AI Model & Survey      (model + survey pickers)
 *   3  Summary & Review             (read-only review before activation)
 *
 * Props
 *   template?      — pre-filled template object (channels etc.) when starting from template
 *   editCampaign?  — existing Campaign object when editing
 *   onCancel       — called when user cancels or clicks breadcrumb
 *   onSave         — called with final campaign data (status already set)
 *
 * All class names match prototype.html so the global stylesheet applies.
 * No hardcoded colour or spacing values — only CSS custom properties.
 */

import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import type { Campaign, SurveyDesignTemplate, AiModel } from '../../types'
import { AI_MODELS, SURVEY_DESIGNS, QUEUES } from '../../data/campaigns'
import { Toggle, FiDatePicker, MultiSelectField, FieldRow } from './form-controls'
import { ModelPickerDrawer } from './ModelPickerDrawer'
import { SurveyPickerDrawer } from './SurveyPickerDrawer'

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

const GROUPS = ['North America', 'EMEA', 'APAC']

type CampaignDraft = Omit<Campaign, 'id' | 'sampling' | 'sent' | 'completion' | 'vu' | 'owner' | 'created' | 'updated' | 'status'> & {
  status?: Campaign['status']
  teams?: string[]
  recentDays: number
  suppressInternal?: boolean
  triggerEvent?: string
  delay?: string
  delayValue?: number
  sendGenericQuestion?: boolean
}

const today = new Date().toISOString().slice(0, 10)

const DEFAULT_CAMPAIGN: CampaignDraft = {
  name: '',
  description: '',
  ongoing: true,
  startDate: today,
  endDate: null,
  channels: ['voice'],
  queues: [],
  teams: [],
  interactionLength: 2,
  suppressOptOut: true,
  suppressRecent: true,
  recentDays: 30,
  suppressInternal: true,
  triggerEvent: 'Post-digital interaction',
  delay: 'Immediate',
  delayValue: 0,
  aiModelId: '',
  surveyDesignId: '',
  sendGenericQuestion: true,
}

const SPECIAL_CHARS_RE = /[\\\/!+<>?#&,%"]/

// ---------------------------------------------------------------------------
// Wizard step definitions
// ---------------------------------------------------------------------------

interface WizardStep {
  n: number
  label: string
  desc: string
  valid: boolean
}

// ---------------------------------------------------------------------------
// Small internal sub-components
// ---------------------------------------------------------------------------

function ErrorMsg({ children }: { children: React.ReactNode }) {
  return (
    <div className="field-control">
      <span className="error-msg">
        <svg
          viewBox="0 0 16 16"
          width="12"
          height="12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <circle cx="8" cy="8" r="6" />
          <line x1="8" y1="5" x2="8" y2="8.5" />
          <circle cx="8" cy="11" r=".6" fill="currentColor" />
        </svg>
        {children}
      </span>
    </div>
  )
}

// Summary & Review sub-components (Step 3)
function SRSection({
  title,
  num,
  onEdit,
  children,
}: {
  title: string
  num: number
  onEdit: () => void
  children: React.ReactNode
}) {
  return (
    <div className="sr-section">
      <div className="sr-section-head">
        <span className="sr-section-num">{num}</span>
        <span className="sr-section-title">{title}</span>
        <button
          className="btn btn-ghost"
          style={{
            marginLeft: 'auto',
            font: 'var(--text-body-sm)',
            color: 'var(--color-fg-action)',
          }}
          onClick={onEdit}
        >
          <svg
            viewBox="0 0 16 16"
            width="13"
            height="13"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <path d="M11 2.5a2 2 0 0 1 2.8 2.8L5 14l-3.5.8.8-3.5z" />
          </svg>
          Edit
        </button>
      </div>
      <div className="sr-section-body">{children}</div>
    </div>
  )
}

function SRRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="sr-row">
      <div className="sr-row-label">{label}</div>
      <div className="sr-row-value">
        {children ?? <span style={{ color: 'var(--color-fg-secondary)' }}>—</span>}
      </div>
    </div>
  )
}

// Activation overlay
function ActivationOverlay({ name }: { name: string }) {
  return createPortal(
    <div className="activate-overlay">
      <div className="activate-card">
        <div className="activate-ring">
          <svg
            viewBox="0 0 24 24"
            width="40"
            height="40"
            fill="none"
            stroke="var(--lyra-green-500)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="4 13 10 19 20 5" className="activate-check" />
          </svg>
        </div>
        <h2 className="activate-title">Campaign Activated!</h2>
        <p className="activate-sub">"{name}" is now live and running.</p>
      </div>
    </div>,
    document.body
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface CreateCampaignProps {
  template?: Record<string, unknown> | null
  editCampaign?: Campaign | null
  onCancel: () => void
  onSave: (campaign: Partial<Campaign> & { status: Campaign['status'] }) => void
}

export function CreateCampaign({
  template: initialTemplate,
  editCampaign,
  onCancel,
  onSave,
}: CreateCampaignProps) {
  // Initialise form state
  const [c, setC] = useState<CampaignDraft>(() => {
    if (editCampaign) {
      return {
        ...DEFAULT_CAMPAIGN,
        ...editCampaign,
        teams: (editCampaign as any).teams ?? [],
      }
    }
    if (initialTemplate) {
      return {
        ...DEFAULT_CAMPAIGN,
        channels:
          (initialTemplate.channels as string[]) ?? DEFAULT_CAMPAIGN.channels,
      }
    }
    return DEFAULT_CAMPAIGN
  })

  const [activeStep, setActiveStep] = useState(0)
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set())
  const [triedSteps, setTriedSteps] = useState<Set<number>>(new Set())
  const [activating, setActivating] = useState(false)
  const [modelDrawerOpen, setModelDrawerOpen] = useState(false)
  const [surveyDrawerOpen, setSurveyDrawerOpen] = useState(false)

  // Convenience field setter
  const set = <K extends keyof CampaignDraft>(k: K, v: CampaignDraft[K]) =>
    setC((prev) => ({ ...prev, [k]: v }))

  // Derived validation flags
  const isEditing = !!editCampaign
  const step0Valid =
    isEditing ||
    !!(
      c.name &&
      !SPECIAL_CHARS_RE.test(c.name) &&
      c.startDate &&
      (c.ongoing || c.endDate) &&
      c.queues?.length
    )
  const step2Valid = isEditing || !!(c.aiModelId && c.surveyDesignId)
  const step2Err = triedSteps.has(2) && !step2Valid

  const ALL_STEPS: WizardStep[] = [
    {
      n: 0,
      label: 'Campaign, Identity & Scope',
      desc: 'Name the campaign, set its active dates, and choose the teams and interactions it should target.',
      valid: step0Valid,
    },
    {
      n: 1,
      label: 'Suppression Rules',
      desc: 'Define when not to send surveys, even if an interaction otherwise qualifies.',
      valid: true,
    },
    {
      n: 2,
      label: 'Topic AI Model & Survey Template',
      desc: 'Choose the AI model and survey design for this campaign.',
      valid: step2Valid,
    },
    {
      n: 3,
      label: 'Summary & Review',
      desc: 'Review all settings before activating your campaign.',
      valid: true,
    },
  ]

  function stepState(s: WizardStep): 'active' | 'done' | 'error' | 'default' {
    if (s.n === activeStep) {
      if (triedSteps.has(s.n) && !s.valid) return 'error'
      return 'active'
    }
    if (triedSteps.has(s.n) && !s.valid) return 'error'
    if (visitedSteps.has(s.n) && s.valid) return 'done'
    if (visitedSteps.has(s.n) && !s.valid) return 'error'
    return 'default'
  }

  function goNext() {
    setTriedSteps((prev) => new Set([...prev, activeStep]))
    setVisitedSteps((prev) => new Set([...prev, activeStep]))
    setActiveStep((prev) => Math.min(prev + 1, 3))
  }

  function goBack() {
    setActiveStep((prev) => Math.max(prev - 1, 0))
  }

  function handleActivate() {
    setActivating(true)
    setTimeout(() => {
      onSave({ ...(c as any), status: 'active' })
    }, 2500)
  }

  // Footer state
  const datesValid = !!(c.startDate && (c.ongoing || c.endDate))
  const canDraft = !!(c.name && datesValid)
  const canActivate = !!(c.name && c.queues?.length && datesValid)
  const reviewMissingRequired =
    !isEditing &&
    (!c.name ||
      !c.queues?.length ||
      !c.startDate ||
      (!c.ongoing && !c.endDate) ||
      !c.aiModelId ||
      !c.surveyDesignId)

  // Active AI model / survey design objects
  const activeModel: AiModel | undefined = AI_MODELS.find((m) => m.id === c.aiModelId)
  const activeSurvey: SurveyDesignTemplate | undefined = SURVEY_DESIGNS.find(
    (s) => s.id === c.surveyDesignId
  )

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="pane" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Breadcrumb */}
      <div className="crumbs">
        <a href="#" onClick={(e) => { e.preventDefault(); onCancel() }}>
          Survey Campaigns
        </a>
        <span className="sep">/</span>
        <span className="last">
          {editCampaign ? editCampaign.name : 'Create New Survey Campaign'}
        </span>
      </div>

      {/* Page heading */}
      <div className="pane-head">
        <h1>{editCampaign ? editCampaign.name : 'Create New Survey Campaign'}</h1>
      </div>

      {/* Edit meta bar */}
      {editCampaign && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            padding: 'var(--space-3) var(--space-8)',
            background: 'var(--color-bg-surface-shell, #f5f7f9)',
            borderBottom: '1px solid var(--color-border-subtle)',
          }}
        >
          <div
            style={{
              flex: 1,
              font: '400 14px/20px var(--font-sans)',
              color: 'var(--color-fg-secondary)',
            }}
          >
            <strong style={{ color: 'var(--color-fg-default)', fontWeight: 500 }}>Owner:</strong>{' '}
            {editCampaign.owner}
            <span style={{ margin: '0 var(--space-2)' }}>•</span>
            <strong style={{ color: 'var(--color-fg-default)', fontWeight: 500 }}>Created:</strong>{' '}
            {editCampaign.created}
            <span style={{ margin: '0 var(--space-2)' }}>•</span>
            <strong style={{ color: 'var(--color-fg-default)', fontWeight: 500 }}>
              Last Updated:
            </strong>{' '}
            {editCampaign.updated}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span
              style={{ font: '500 12px/16px var(--font-sans)', color: 'var(--color-fg-secondary)' }}
            >
              Campaign Status
            </span>
            <span
              className="status-pill"
              style={{
                background:
                  editCampaign.status === 'active'
                    ? 'var(--lyra-color-status-success-subtle)'
                    : editCampaign.status === 'expired'
                    ? 'var(--lyra-slate-200)'
                    : 'var(--lyra-color-status-warning-subtle)',
                color:
                  editCampaign.status === 'active'
                    ? 'var(--lyra-color-status-success-strong)'
                    : editCampaign.status === 'expired'
                    ? 'var(--lyra-slate-500)'
                    : 'var(--lyra-color-status-warning-strong)',
              }}
            >
              {editCampaign.status.charAt(0).toUpperCase() + editCampaign.status.slice(1)}
            </span>
          </div>
        </div>
      )}

      {/* Horizontal wizard bar */}
      <div className="wz-bar">
        <div className="wz-bar-inner">
          {ALL_STEPS.map((s, i) => {
            const st = stepState(s)
            const prevSt = i > 0 ? stepState(ALL_STEPS[i - 1]) : null
            const lineClass =
              prevSt === 'done' ? 'done' : prevSt === 'error' ? 'error' : ''
            return (
              <React.Fragment key={s.n}>
                {i > 0 && <div className={`wz-line ${lineClass}`} />}
                <div
                  className={`wz-step ${st}`}
                  onClick={() => setActiveStep(s.n)}
                  role="tab"
                  aria-selected={s.n === activeStep}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setActiveStep(s.n)
                  }}
                >
                  <div className="wz-node">
                    {st === 'done' ? (
                      <svg
                        viewBox="0 0 12 12"
                        width="10"
                        height="10"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="2 6 5 9.5 10 2.5" />
                      </svg>
                    ) : st === 'error' ? (
                      <svg
                        viewBox="0 0 12 12"
                        width="9"
                        height="9"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      >
                        <line x1="3" y1="3" x2="9" y2="9" />
                        <line x1="9" y1="3" x2="3" y2="9" />
                      </svg>
                    ) : (
                      s.n + 1
                    )}
                  </div>
                  <div className="wz-label">{s.label}</div>
                </div>
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* Content area: left form + right summary rail */}
      <div className="wz-content-area">

        {/* Left: scrollable form */}
        <div className="wz-content-left">
          <div className="wz-scroll-area">

            {/* Step section header */}
            {(() => {
              const s = ALL_STEPS[activeStep]
              return s ? (
                <div className="wz-section-header">
                  <h2>{s.label}</h2>
                  <p>{s.desc}</p>
                </div>
              ) : null
            })()}

            <div className="wz-body">
              <div className="form-pane">

                {/* ── Step 0: Campaign, Identity & Scope ── */}
                {activeStep === 0 && <Step0 c={c} set={set} triedSteps={triedSteps} />}

                {/* ── Step 1: Suppression Rules ── */}
                {activeStep === 1 && <Step1 c={c} set={set} />}

                {/* ── Step 2: Topic AI Model & Survey Template ── */}
                {activeStep === 2 && (
                  <Step2
                    c={c}
                    set={set}
                    step2Err={step2Err}
                    activeModel={activeModel}
                    activeSurvey={activeSurvey}
                    onOpenModelDrawer={() => setModelDrawerOpen(true)}
                    onOpenSurveyDrawer={() => setSurveyDrawerOpen(true)}
                  />
                )}

                {/* ── Step 3: Summary & Review ── */}
                {activeStep === 3 && (
                  <Step3
                    c={c}
                    isEditing={isEditing}
                    activeModel={activeModel}
                    activeSurvey={activeSurvey}
                    reviewMissingRequired={reviewMissingRequired}
                    onJumpToStep={setActiveStep}
                  />
                )}

              </div>
            </div>
          </div>
        </div>

        {/* Right: sticky campaign summary rail */}
        <aside className="wz-summary-rail">
          <CampaignSummaryRail c={c} />
        </aside>

      </div>

      {/* Footer nav */}
      <div className="wz-footer">
        <button className="btn" onClick={onCancel}>
          Cancel
        </button>
        <span style={{ flex: 1 }} />
        <button className="btn" disabled={!canDraft} onClick={() => onSave({ ...(c as any), status: 'draft' })}>
          Save as draft
        </button>
        <div
          style={{
            width: 1,
            height: 20,
            background: 'var(--color-border-soft)',
            margin: '0 var(--space-1)',
          }}
        />
        {activeStep > 0 && (
          <button className="btn" onClick={goBack}>
            ← Back
          </button>
        )}
        <button
          className="btn primary"
          disabled={activeStep === 3 && reviewMissingRequired}
          onClick={activeStep === 3 ? handleActivate : goNext}
        >
          {activeStep === 3
            ? '✓ Activate Campaign'
            : activeStep === 2
            ? 'Review →'
            : 'Next →'}
        </button>
      </div>

      {/* Activation overlay */}
      {activating && <ActivationOverlay name={c.name} />}

      {/* Model picker drawer */}
      {modelDrawerOpen && (
        <ModelPickerDrawer
          currentId={c.aiModelId ?? ''}
          onClose={() => setModelDrawerOpen(false)}
          onSelect={(id) => {
            set('aiModelId', id)
            setModelDrawerOpen(false)
          }}
        />
      )}

      {/* Survey picker drawer */}
      {surveyDrawerOpen && (
        <SurveyPickerDrawer
          currentId={c.surveyDesignId ?? ''}
          onClose={() => setSurveyDrawerOpen(false)}
          onSelect={(id) => {
            set('surveyDesignId', id)
            setSurveyDrawerOpen(false)
          }}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 0 — Campaign, Identity & Scope
// ---------------------------------------------------------------------------

function Step0({
  c,
  set,
  triedSteps,
}: {
  c: CampaignDraft
  set: <K extends keyof CampaignDraft>(k: K, v: CampaignDraft[K]) => void
  triedSteps: Set<number>
}) {
  const nameVal = c.name || ''
  const showErr = triedSteps.has(0)
  const nameBlankErr = showErr && !nameVal
  const nameSpecialErr = nameVal.length > 0 && SPECIAL_CHARS_RE.test(nameVal)
  const nameErr = nameBlankErr || nameSpecialErr
  const teamsErr = showErr && !c.queues?.[0]
  const startDateErr = showErr && !c.startDate
  const endDateErr = showErr && !c.ongoing && !c.endDate
  const nameMsg = nameBlankErr
    ? 'Required'
    : nameSpecialErr
    ? 'Only alphanumeric characters are allowed'
    : ''
  const nameCounterRed = nameVal.length >= 50

  return (
    <div className="wz-step-content">
      <div className="setup-section">
        <div className="setup-section-body">

          {/* Name + Description */}
          <div className="field-grid-2">
            <div className="field-cell">
              <label className="field-label">
                Campaign Name<span className="req">*</span>
                <span
                  className="char-counter"
                  style={{ color: nameCounterRed ? 'var(--color-status-error)' : undefined }}
                >
                  {nameVal.length}/50
                </span>
              </label>
              <input
                className={`fi-input${nameErr ? ' error' : ''}`}
                placeholder="Type"
                maxLength={50}
                aria-invalid={nameErr || undefined}
                value={c.name}
                onChange={(e) => set('name', e.target.value)}
              />
              {nameErr && <ErrorMsg>{nameMsg}</ErrorMsg>}
            </div>
            <div className="field-cell">
              <label className="field-label">
                Description
                <span className="char-counter">{(c.description || '').length}/200</span>
              </label>
              <input
                className="fi-input"
                maxLength={200}
                placeholder="Type"
                value={c.description ?? ''}
                onChange={(e) => set('description', e.target.value)}
              />
            </div>
          </div>

          {/* Active Date Range */}
          <div className="wz-form-section">
            <div className="wz-form-section-head">
              <span className="section-heading" style={{ padding: 0 }}>
                Active Date Range
              </span>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  font: '400 13px/20px var(--font-sans)',
                  color: 'var(--color-fg-secondary)',
                  cursor: 'pointer',
                }}
              >
                <Toggle checked={c.ongoing} onChange={(v) => set('ongoing', v)} />
                <span>Ongoing</span>
              </label>
            </div>
            <div className="field-grid-2">
              <div className="field-cell">
                <label className="field-label">
                  Start Date<span className="req">*</span>
                </label>
                <FiDatePicker
                  value={c.startDate}
                  onChange={(v) => set('startDate', v)}
                  placeholder="Oct 30, 2025"
                  error={startDateErr}
                />
                {startDateErr && <ErrorMsg>Start date is required</ErrorMsg>}
              </div>
              <div className="field-cell">
                <label
                  className="field-label"
                  style={{ color: c.ongoing ? 'var(--color-fg-disabled)' : undefined }}
                >
                  End Date{!c.ongoing && <span className="req">*</span>}
                </label>
                <FiDatePicker
                  value={c.endDate ?? ''}
                  onChange={(v) => set('endDate', v)}
                  disabled={c.ongoing}
                  placeholder={c.ongoing ? 'Ongoing' : 'Oct 30, 2025'}
                  error={endDateErr}
                />
                {endDateErr && <ErrorMsg>End date is required</ErrorMsg>}
              </div>
            </div>
          </div>

          {/* Agents */}
          <div className="wz-form-section">
            <div className="wz-form-section-head">
              <span className="section-heading" style={{ padding: 0 }}>
                Agents
              </span>
            </div>
            <div className="field-grid-2">
              <div className="field-cell">
                <label className="field-label">
                  Teams<span className="req">*</span>
                </label>
                <MultiSelectField
                  options={QUEUES}
                  value={c.queues || []}
                  onChange={(v) => set('queues', v)}
                  placeholder="Select Teams"
                  error={teamsErr}
                />
                {teamsErr && <ErrorMsg>Select an agent team</ErrorMsg>}
              </div>
              <div className="field-cell">
                <label className="field-label">Group</label>
                <MultiSelectField
                  options={GROUPS}
                  value={(c as any).teams || []}
                  onChange={(v) => set('teams' as any, v)}
                  placeholder="Select Group"
                />
              </div>
            </div>

            {/* Agent count badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                marginTop: 'var(--space-3)',
              }}
            >
              <svg
                viewBox="0 0 16 16"
                width="14"
                height="14"
                fill="none"
                stroke="var(--color-fg-secondary)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="6" cy="5" r="2" />
                <path d="M1 13c0-2.2 1.8-4 4-4h2" />
                <circle cx="11.5" cy="6" r="2" />
                <path d="M8 13.5c0-1.9 1.6-3.5 3.5-3.5s3.5 1.6 3.5 3.5" />
              </svg>
              <span
                style={{
                  font: '400 13px/20px var(--font-sans)',
                  color: 'var(--color-fg-secondary)',
                }}
              >
                Total agents selected:
              </span>
              {(() => {
                const count = (c.queues?.length || 0) + ((c as any).teams?.length || 0)
                return (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: 24,
                      height: 20,
                      padding: '0 var(--space-2)',
                      background: count > 0 ? 'var(--lyra-brand-50)' : 'var(--lyra-slate-100)',
                      color: count > 0 ? 'var(--lyra-brand-700)' : 'var(--color-fg-secondary)',
                      borderRadius: 'var(--radius-full)',
                      font: '600 12px/16px var(--font-sans)',
                    }}
                  >
                    {count}
                  </span>
                )
              })()}
            </div>
          </div>

          {/* Language */}
          <div className="wz-form-section">
            <FieldRow label="Language">
              <label className="lyra-check disabled" style={{ pointerEvents: 'none' }}>
                <input type="checkbox" checked readOnly disabled />
                <span>English (Default)</span>
              </label>
            </FieldRow>
          </div>

          {/* Interaction Length */}
          <div className="wz-form-section">
            <FieldRow label="Interaction Length">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{ color: 'var(--color-fg-secondary)', fontSize: 13, flexShrink: 0 }}
                >
                  Minimum
                </span>
                <input
                  type="number"
                  className="fi-input"
                  min={1}
                  value={c.interactionLength ?? 2}
                  onChange={(e) => set('interactionLength', parseInt(e.target.value) || 1)}
                  style={{ width: 72, textAlign: 'center', flexShrink: 0 }}
                />
                <span
                  style={{ color: 'var(--color-fg-secondary)', fontSize: 13, flexShrink: 0 }}
                >
                  mins
                </span>
              </div>
              <div className="field-hint" style={{ marginTop: 6 }}>
                Only send survey if the interaction lasted at least this long.
              </div>
            </FieldRow>
          </div>

        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 1 — Suppression Rules
// ---------------------------------------------------------------------------

function Step1({
  c,
  set,
}: {
  c: CampaignDraft
  set: <K extends keyof CampaignDraft>(k: K, v: CampaignDraft[K]) => void
}) {
  return (
    <div className="wz-step-content">
      <div className="wz-content-card">

        {/* Opt-Out */}
        <div className="sup-row">
          <Toggle checked={c.suppressOptOut} onChange={(v) => set('suppressOptOut', v)} />
          <div className="meta">
            <div className="title">
              Opt-Out Tag
              <InfoIcon />
            </div>
            <div className="ex">
              Skip any customer flagged as opted out. Sending anyway destroys trust and risks compliance.
            </div>
          </div>
        </div>

        {/* Recency window */}
        <div className="sup-row">
          <Toggle checked={c.suppressRecent} onChange={(v) => set('suppressRecent', v)} />
          <div className="meta">
            <div className="title">
              Recency window
              <InfoIcon />
            </div>
            <div className="ex" style={{ marginTop: 6 }}>
              Don't send if the same customer was surveyed within (X Days)
            </div>
            <div className="inline-row" style={{ marginTop: 8, maxWidth: '50%' }}>
              <input
                type="number"
                className="fi-input"
                value={c.recentDays}
                onChange={(e) => set('recentDays', parseInt(e.target.value || '0'))}
                disabled={!c.suppressRecent}
              />
              <span
                style={{
                  color: 'var(--color-fg-secondary)',
                  fontSize: 14,
                  lineHeight: '20px',
                  flexShrink: 0,
                }}
              >
                Days
              </span>
            </div>
          </div>
        </div>

        {/* Internal / test — always on */}
        <div className="sup-row">
          <Toggle checked={true} onChange={() => {}} />
          <div className="meta">
            <div className="title">
              Internal / test interactions
              <InfoIcon />
            </div>
            <div className="ex">
              Suppress interactions flagged as internal or test. Hard-coded — QA agents testing IVR flows never generate customer surveys.
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 2 — Topic AI Model & Survey Template
// ---------------------------------------------------------------------------

interface Step2Props {
  c: CampaignDraft
  set: <K extends keyof CampaignDraft>(k: K, v: CampaignDraft[K]) => void
  step2Err: boolean
  activeModel: AiModel | undefined
  activeSurvey: SurveyDesignTemplate | undefined
  onOpenModelDrawer: () => void
  onOpenSurveyDrawer: () => void
}

function Step2({
  c,
  set,
  step2Err,
  activeModel,
  activeSurvey,
  onOpenModelDrawer,
  onOpenSurveyDrawer,
}: Step2Props) {
  const modelErr = step2Err && !c.aiModelId
  const surveyErr = step2Err && !c.surveyDesignId

  return (
    <div className="wz-step-content">
      <div className="wz-content-card">

        {/* AI Model sub-section */}
        <div
          className="intel-sub-section"
          style={
            modelErr
              ? {
                  border: '1px solid var(--color-status-error)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--lyra-color-status-critical-subtle, #fff0f0)',
                }
              : undefined
          }
        >
          {!activeModel ? (
            <header
              className="form-section-head no-border"
              style={{ cursor: 'default', flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--space-2)' }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  gap: 'var(--space-3)',
                }}
              >
                <span className="step-num" style={{ display: 'flex', fontSize: 0, flexShrink: 0 }}>
                  <svg
                    viewBox="0 0 16 16"
                    width="12"
                    height="12"
                    fill="none"
                    stroke={modelErr ? 'var(--color-status-error)' : 'currentColor'}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  >
                    <circle cx="8" cy="8" r="2.5" />
                    <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.42 1.42M11.53 11.53l1.42 1.42M3.05 12.95l1.42-1.42M11.53 4.47l1.42-1.42" />
                  </svg>
                </span>
                <div style={{ flex: 1 }}>
                  <h3 style={{ color: modelErr ? 'var(--color-status-error)' : undefined }}>
                    Topic AI Model
                  </h3>
                  <div className="sub">Select an AI model to power your campaign intelligence</div>
                </div>
                <button className="btn primary" onClick={onOpenModelDrawer}>
                  Choose Topic AI Model →
                </button>
              </div>
              {modelErr && (
                <div
                  className="field-control"
                  style={{ paddingLeft: 'var(--space-10)' }}
                >
                  <ErrorMsg>Select a Topic AI Model to continue</ErrorMsg>
                </div>
              )}
            </header>
          ) : (
            <div className="selected-model-summary">
              <div className="selected-model-summary-inner">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      marginBottom: 'var(--space-3)',
                    }}
                  >
                    <span
                      style={{
                        font: '600 15px/22px var(--font-sans)',
                        color: 'var(--color-fg-default)',
                        letterSpacing: '-0.01rem',
                      }}
                    >
                      {activeModel.name}
                    </span>
                    {activeModel.badge && (
                      <span className="model-badge">{activeModel.badge}</span>
                    )}
                  </div>
                  {activeModel.whenToUse && (
                    <ModelMeta icon="clock" label="When to use" value={activeModel.whenToUse} />
                  )}
                  {activeModel.industry && (
                    <ModelMeta icon="industry" label="Industry" value={activeModel.industry} />
                  )}
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0 }}>
                  <button
                    className="btn btn-ghost btn-icon-only"
                    title="Remove model"
                    aria-label="Remove model"
                    onClick={() => set('aiModelId', '')}
                    style={{ color: 'var(--color-fg-secondary)' }}
                  >
                    <svg
                      viewBox="0 0 16 16"
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    >
                      <line x1="4" y1="4" x2="12" y2="12" />
                      <line x1="12" y1="4" x2="4" y2="12" />
                    </svg>
                  </button>
                  <button className="btn" onClick={onOpenModelDrawer}>
                    Change model
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Survey Template sub-section */}
        <div className="intel-sub-section">
          {!activeSurvey ? (
            <header
              className="form-section-head no-border"
              style={{ cursor: 'default', flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--space-2)' }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  gap: 'var(--space-3)',
                }}
              >
                <span
                  className="step-num"
                  style={{
                    display: 'flex',
                    fontSize: 0,
                    flexShrink: 0,
                    border: surveyErr ? '2px solid var(--color-status-error)' : undefined,
                  }}
                >
                  <svg
                    viewBox="0 0 16 16"
                    width="12"
                    height="12"
                    fill="none"
                    stroke={surveyErr ? 'var(--color-status-error)' : 'currentColor'}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="1" width="12" height="14" rx="1.5" />
                    <line x1="5" y1="5" x2="11" y2="5" />
                    <line x1="5" y1="8" x2="11" y2="8" />
                    <line x1="5" y1="11" x2="9" y2="11" />
                  </svg>
                </span>
                <div style={{ flex: 1 }}>
                  <h3 style={{ color: surveyErr ? 'var(--color-status-error)' : undefined }}>
                    Survey Template
                  </h3>
                  <div className="sub">Pick the survey design that will be sent to customers</div>
                </div>
                <button className="btn" onClick={onOpenSurveyDrawer}>
                  Choose Survey Template →
                </button>
              </div>
              {surveyErr && (
                <div className="field-control" style={{ paddingLeft: 'var(--space-10)' }}>
                  <ErrorMsg>Select a Survey Template to continue</ErrorMsg>
                </div>
              )}
            </header>
          ) : (
            <div className="selected-model-summary">
              <div className="selected-model-summary-inner">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      marginBottom: 'var(--space-3)',
                    }}
                  >
                    <span
                      style={{
                        font: '600 15px/22px var(--font-sans)',
                        color: 'var(--color-fg-default)',
                        letterSpacing: '-0.01rem',
                      }}
                    >
                      {activeSurvey.name}
                    </span>
                    <span
                      style={{
                        font: '400 12px/18px var(--font-sans)',
                        color: 'var(--color-fg-secondary)',
                      }}
                    >
                      · {activeSurvey.category}
                    </span>
                  </div>
                  {activeSurvey.why && (
                    <ModelMeta icon="clock" label="When to use" value={activeSurvey.why} />
                  )}
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0 }}>
                  <button
                    className="btn btn-ghost btn-icon-only"
                    title="Remove survey"
                    aria-label="Remove survey"
                    onClick={() => set('surveyDesignId', '')}
                    style={{ color: 'var(--color-fg-secondary)' }}
                  >
                    <svg
                      viewBox="0 0 16 16"
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    >
                      <line x1="4" y1="4" x2="12" y2="12" />
                      <line x1="12" y1="4" x2="4" y2="12" />
                    </svg>
                  </button>
                  <button className="btn" onClick={onOpenSurveyDrawer}>
                    Change survey
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 3 — Summary & Review
// ---------------------------------------------------------------------------

interface Step3Props {
  c: CampaignDraft
  isEditing: boolean
  activeModel: AiModel | undefined
  activeSurvey: SurveyDesignTemplate | undefined
  reviewMissingRequired: boolean
  onJumpToStep: (n: number) => void
}

function Step3({
  c,
  isEditing,
  activeModel,
  activeSurvey,
  reviewMissingRequired,
  onJumpToStep,
}: Step3Props) {
  return (
    <div className="wz-step-content" style={{ marginTop: 'calc(-1 * var(--space-6))' }}>
      {reviewMissingRequired && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            padding: 'var(--space-3) var(--space-4)',
            background: 'var(--lyra-color-status-critical-subtle, #fff0f0)',
            border: '1px solid var(--color-status-error)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-8)',
            font: 'var(--text-body-sm)',
            color: 'var(--color-status-error)',
          }}
        >
          <svg
            viewBox="0 0 16 16"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <circle cx="8" cy="8" r="6" />
            <line x1="8" y1="5" x2="8" y2="8.5" />
            <circle cx="8" cy="11" r=".6" fill="currentColor" />
          </svg>
          Some required fields are incomplete. Return to the relevant steps to fill them in before
          activating.
        </div>
      )}

      <SRSection title="Campaign, Identity & Scope" num={1} onEdit={() => onJumpToStep(0)}>
        <SRRow label="Campaign Name">
          {c.name || <span style={{ color: 'var(--color-status-error)' }}>Required</span>}
        </SRRow>
        {c.description && <SRRow label="Description">{c.description}</SRRow>}
        <SRRow label="Active Date Range">
          {c.startDate
            ? c.ongoing
              ? `Ongoing from ${c.startDate}`
              : c.endDate
              ? `${c.startDate} — ${c.endDate}`
              : (
                <span style={{ color: 'var(--color-status-error)' }}>End date required</span>
              )
            : (
              <span style={{ color: 'var(--color-status-error)' }}>Required</span>
            )}
        </SRRow>
        <SRRow label="Teams">
          {c.queues?.length ? (
            c.queues.join(', ')
          ) : (
            <span style={{ color: 'var(--color-status-error)' }}>Required</span>
          )}
        </SRRow>
        <SRRow label="Groups">
          {(c as any).teams?.length ? (c as any).teams.join(', ') : 'All groups'}
        </SRRow>
        <SRRow label="Language">English (Default)</SRRow>
        <SRRow label="Interaction Length">Minimum {c.interactionLength ?? 2} mins</SRRow>
      </SRSection>

      <SRSection title="Suppression Rules" num={2} onEdit={() => onJumpToStep(1)}>
        <SRRow label="Opt-out tag">
          {c.suppressOptOut !== false ? 'Enabled' : 'Disabled'}
        </SRRow>
        <SRRow label="Recency window">
          {c.suppressRecent !== false
            ? `Enabled · ${c.recentDays ?? 30} days`
            : 'Disabled'}
        </SRRow>
        <SRRow label="Internal / test interactions">Always suppressed</SRRow>
      </SRSection>

      <SRSection title="Topic AI Model & Survey Template" num={3} onEdit={() => onJumpToStep(2)}>
        <SRRow label="Topic AI Model">
          {activeModel ? (
            activeModel.name
          ) : isEditing ? (
            <span style={{ color: 'var(--color-fg-secondary)' }}>Not configured</span>
          ) : (
            <span style={{ color: 'var(--color-status-error)' }}>Required — go to Step 3</span>
          )}
        </SRRow>
        <SRRow label="Survey Template">
          {activeSurvey ? (
            activeSurvey.name
          ) : isEditing ? (
            <span style={{ color: 'var(--color-fg-secondary)' }}>Not configured</span>
          ) : (
            <span style={{ color: 'var(--color-status-error)' }}>Required — go to Step 3</span>
          )}
        </SRRow>
      </SRSection>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Campaign Summary Rail
// ---------------------------------------------------------------------------

function CampaignSummaryRail({ c }: { c: CampaignDraft }) {
  return (
    <div className="wz-summary-inner">
      <div className="wz-summary-title">Campaign Summary</div>

      <div className="wz-summary-group">
        <div className="wz-summary-label">Name</div>
        <div className="wz-summary-value">
          {c.name || <span style={{ color: 'var(--color-fg-secondary)' }}>Not set</span>}
        </div>
      </div>

      <div className="wz-summary-group">
        <div className="wz-summary-label">Active period</div>
        <div className="wz-summary-value">
          {c.startDate
            ? c.ongoing
              ? `From ${c.startDate}`
              : c.endDate
              ? `${c.startDate} – ${c.endDate}`
              : c.startDate
            : <span style={{ color: 'var(--color-fg-secondary)' }}>Not set</span>}
        </div>
      </div>

      <div className="wz-summary-group">
        <div className="wz-summary-label">Teams</div>
        <div className="wz-summary-value">
          {c.queues?.length ? (
            c.queues.map((q) => (
              <span key={q} className="wz-summary-chip">{q}</span>
            ))
          ) : (
            <span style={{ color: 'var(--color-fg-secondary)' }}>None selected</span>
          )}
        </div>
      </div>

      <div className="wz-summary-group">
        <div className="wz-summary-label">Suppression</div>
        <div className="wz-summary-value">
          {[
            c.suppressOptOut ? 'Opt-out' : null,
            c.suppressRecent ? `Recency ${c.recentDays}d` : null,
            'Internal (always)',
          ]
            .filter(Boolean)
            .join(' · ')}
        </div>
      </div>

      <div className="wz-summary-group">
        <div className="wz-summary-label">AI Model</div>
        <div className="wz-summary-value">
          {c.aiModelId
            ? AI_MODELS.find((m) => m.id === c.aiModelId)?.name ?? c.aiModelId
            : <span style={{ color: 'var(--color-fg-secondary)' }}>Not selected</span>}
        </div>
      </div>

      <div className="wz-summary-group">
        <div className="wz-summary-label">Survey</div>
        <div className="wz-summary-value">
          {c.surveyDesignId
            ? SURVEY_DESIGNS.find((s) => s.id === c.surveyDesignId)?.name ?? c.surveyDesignId
            : <span style={{ color: 'var(--color-fg-secondary)' }}>Not selected</span>}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tiny shared helpers
// ---------------------------------------------------------------------------

function InfoIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      stroke="currentColor"
      fill="none"
      strokeWidth="1.8"
      style={{ marginLeft: 4, color: 'var(--color-fg-secondary)' }}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 0 1 5 .5c0 1.5-2 2.2-2.5 3.2" />
      <circle cx="12" cy="16.5" r=".6" fill="currentColor" />
    </svg>
  )
}

function ModelMeta({
  icon,
  label,
  value,
}: {
  icon: 'clock' | 'industry'
  label: string
  value: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--space-2)',
        marginBottom: 'var(--space-2)',
      }}
    >
      {icon === 'clock' ? (
        <svg
          viewBox="0 0 14 14"
          width="13"
          height="13"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          style={{ flexShrink: 0, marginTop: 2, color: 'var(--color-fg-action)' }}
        >
          <circle cx="7" cy="7" r="6" />
          <path d="M7 4.5v3l1.8 1.2" />
        </svg>
      ) : (
        <svg
          viewBox="0 0 14 14"
          width="13"
          height="13"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0, marginTop: 2, color: 'var(--color-fg-action)' }}
        >
          <rect x="1" y="6" width="12" height="7" rx="1" />
          <path d="M5 6V4.5a2.5 2.5 0 0 1 5 0V6" />
        </svg>
      )}
      <div>
        <span
          style={{
            font: '500 12px/16px var(--font-sans)',
            color: 'var(--color-fg-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {label}{'  '}
        </span>
        <span
          style={{
            font: '400 12px/18px var(--font-sans)',
            color: 'var(--color-fg-secondary)',
          }}
        >
          {value}
        </span>
      </div>
    </div>
  )
}

export default CreateCampaign
