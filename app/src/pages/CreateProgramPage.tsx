import React, { useState, useRef, useEffect } from 'react'
import {
  CheckCircle2, Info, Search, Monitor, Phone, Clock,
  ChevronUp, ChevronDown, ChevronRight, Check, ClipboardList, Power, UserRoundCheck,
} from 'lucide-react'
import { Toggle, SurveyPickerDrawer, ThemePickerDrawer, ThemeDetailDrawer, FiDatePicker } from '../components/campaign-wizard/WizardPrimitives'
import { SURVEY_DESIGNS, DIGITAL_THEMES } from '../lib/campaignWizard'
import type { Campaign } from '../lib/campaigns'

const ALL_TEAMS_COUNT = 50
const AGENTS_PER_TEAM = 10

const TEAMS = Array.from({ length: ALL_TEAMS_COUNT }, (_, i) => ({
  id: i + 1,
  name: `Team ${String(i + 1).padStart(2, '0')}`,
}))

const SKILL_NAMES = [
  'Billing Inquiry', 'Billing Dispute', 'Invoice Request', 'Payment Processing', 'Refund Processing',
  'Overcharge Dispute', 'Subscription Billing', 'Late Payment', 'Credit Adjustment', 'Billing Escalation',
  'Finance Consulting', 'Budget Advisory', 'Tax Assistance', 'Loan Processing', 'Account Reconciliation',
  'Financial Planning', 'Credit Assessment', 'Expense Review', 'Audit Support', 'Revenue Queries',
  'Retail Support', 'Product Exchange', 'Merchandise Return', 'Store Credit', 'Order Tracking',
  'Product Availability', 'In-store Pickup', 'Loyalty Rewards', 'Promotional Pricing', 'Gift Card Support',
  'Refund Approval', 'Partial Refund', 'Return Authorization', 'Refund Status', 'Refund Escalation',
  'Disputes Resolution', 'Chargeback Handling', 'Fraud Disputes', 'Transaction Dispute', 'Dispute Follow-up',
  'Technical Support L1', 'Technical Support L2', 'Network Issues', 'Device Setup', 'Software Troubleshoot',
  'Connectivity Issues', 'App Support', 'Account Recovery', 'Password Reset', 'Two-Factor Auth',
  'Customer Onboarding', 'General Inquiry', 'Account Management', 'Complaint Handling', 'Feedback Collection',
  'VIP Customer Care', 'Retention Specialist', 'Win-back Campaign', 'Upsell Support', 'Cross-sell Assist',
  'Shipping Inquiry', 'Delivery Issue', 'Lost Package', 'Damaged Goods', 'Address Change',
  'Warranty Claim', 'Product Registration', 'Repair Request', 'Parts Ordering', 'Service Scheduling',
  'Healthcare Billing', 'Insurance Verification', 'Claims Processing', 'Pre-authorization', 'Medical Records',
  'Appointment Scheduling', 'Prescription Support', 'Lab Results Inquiry', 'Patient Follow-up', 'Provider Referral',
  'Sales Support', 'Quote Generation', 'Contract Renewal', 'Order Management', 'Lead Qualification',
  'Partner Support', 'Reseller Assist', 'Wholesale Inquiry', 'Vendor Relations', 'Procurement Support',
  'HR Helpdesk', 'Payroll Inquiry', 'Benefits Support', 'Leave Management', 'Compliance Queries',
  'IT Helpdesk', 'Hardware Support', 'VPN Assistance', 'System Access', 'License Management',
]
const SKILLS = SKILL_NAMES.map((name, i) => ({ id: i + 1, name }))

const DAYS = [
  { key: 'Mon', label: 'Monday' },
  { key: 'Tue', label: 'Tuesday' },
  { key: 'Wed', label: 'Wednesday' },
  { key: 'Thu', label: 'Thursday' },
  { key: 'Fri', label: 'Friday' },
  { key: 'Sat', label: 'Saturday' },
  { key: 'Sun', label: 'Sunday' },
]

// Survey type badge label derived from category
function getSurveyBadge(category: string): string {
  const map: Record<string, string> = {
    'Customer Satisfaction': 'CSAT',
    'Automation Quality': 'Automation',
    'Customer Retention': 'Retention',
    'Brand Loyalty': 'Brand',
    'Quality Assurance': 'QA',
    'Voice Experience': 'Voice',
  }
  return map[category] ?? category
}

interface Form {
  name: string
  surveyId: string
  themeId: string
  audienceMode: 'teams' | 'skills'
  selectedTeams: number[]
  selectedSkills: number[]
  filterByDuration: boolean
  interactionMins: number
  suppressOptOut: boolean
  suppressRecency: boolean
  recencyDays: number
  digitalChannel: boolean
  ivrChannel: boolean
  ongoing: boolean
  startDate: string
  endDate: string
  allDay: boolean
  startTime: string
  endTime: string
  selectAllDays: boolean
  surveyDays: string[]
  actionSetId: string
}

const DEFAULT_FORM: Form = {
  name: '',
  surveyId: '',
  themeId: 'system-default',
  audienceMode: 'teams',
  selectedTeams: TEAMS.map(t => t.id),
  selectedSkills: SKILLS.map(s => s.id),
  filterByDuration: false,
  interactionMins: 2,
  suppressOptOut: true,
  suppressRecency: true,
  recencyDays: 30,
  digitalChannel: true,
  ivrChannel: false,
  ongoing: true,
  startDate: new Date().toISOString().slice(0, 10),
  endDate: '',
  allDay: true,
  startTime: '',
  endTime: '',
  selectAllDays: true,
  surveyDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  actionSetId: '',
}

/* ── Header button ── */
function HBtn({
  children,
  variant = 'secondary',
  onClick,
  disabled,
}: {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'danger'
  onClick?: () => void
  disabled?: boolean
}) {
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    height: 36,
    padding: '0 14px',
    borderRadius: 'var(--radius-md)',
    font: '500 14px/20px var(--font-sans)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none',
    outline: 'none',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  }
  if (variant === 'primary') {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        style={{
          ...base,
          background: disabled ? 'var(--lyra-color-bg-disabled)' : 'var(--lyra-color-bg-primary)',
          color: disabled ? 'var(--lyra-color-fg-disabled)' : 'var(--lyra-color-fg-on-primary)',
        }}
        onMouseEnter={e => {
          if (!disabled) (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-primary)'
        }}
        onMouseLeave={e => {
          if (!disabled) (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-bg-primary)'
        }}
      >
        {children}
      </button>
    )
  }
  if (variant === 'danger') {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        style={{
          ...base,
          background: 'var(--lyra-color-bg-surface-base)',
          color: 'var(--lyra-color-status-critical-strong)',
          border: '1px solid var(--lyra-color-status-critical-medium)',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-status-critical-subtle)'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-bg-surface-base)'
        }}
      >
        {children}
      </button>
    )
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...base,
        background: 'var(--lyra-color-bg-surface-base)',
        color: disabled ? 'var(--lyra-color-fg-disabled)' : 'var(--lyra-color-fg-default)',
        border: '1px solid var(--lyra-color-border-soft)',
      }}
      onMouseEnter={e => {
        if (!disabled) (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-bg-surface-base)'
      }}
    >
      {children}
    </button>
  )
}

/* ── Section header ── */
function InfoTooltip({ text }: { text: string }) {
  const [visible, setVisible] = useState(false)
  return (
    <div
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <Info size={15} style={{ color: 'var(--lyra-color-fg-secondary)', flexShrink: 0, cursor: 'default' }} aria-label={text} />
      {visible && (
        <div style={{
          position: 'absolute',
          left: 'calc(100% + 8px)',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 20,
          width: 330,
          minHeight: 70,
          padding: '8px 12px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--lyra-color-border-soft)',
          background: 'var(--lyra-color-bg-surface-overlay)',
          boxShadow: 'var(--sol-effect-shadowlg)',
          font: '400 13px/18px var(--font-sans)',
          color: 'var(--lyra-color-fg-default)',
          whiteSpace: 'normal',
          pointerEvents: 'none',
        }}>
          {text}
        </div>
      )}
    </div>
  )
}

const ErrorCircle18 = () => (
  <svg viewBox="0 0 18 18" width="18" height="18" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="9" cy="9" r="9" fill="var(--lyra-color-status-critical-strong)" />
    <line x1="9" y1="5.5" x2="9" y2="10" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="9" cy="12.5" r="0.9" fill="white" />
  </svg>
)

function SectionHeader({
  label,
  infoTip,
  status,
}: {
  label: React.ReactNode
  infoTip?: string
  status?: 'ok' | 'warn' | 'error' | 'none'
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ font: '500 16px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', letterSpacing: '-0.01em' }}>
          {label}
        </span>
        {infoTip && <InfoTooltip text={infoTip} />}
      </div>
      {status === 'ok' && <CheckCircle2 size={18} style={{ color: 'var(--lyra-color-status-success-medium)' }} />}
      {status === 'error' && <ErrorCircle18 />}
      {status === 'warn' && <div style={{ width: 18, height: 18, borderRadius: '50%', border: '1.5px solid var(--lyra-color-border-medium)', background: 'transparent', flexShrink: 0 }} />}
    </div>
  )
}

/* ── Field label ── */
function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <div style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', display: 'flex', alignItems: 'center', gap: 4 }}>
      {children}
      {required && <span style={{ color: 'var(--lyra-color-status-critical-strong)' }}>*</span>}
    </div>
  )
}

function ErrMsg({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
      <svg viewBox="0 0 12 12" width="12" height="12" fill="none" style={{ flexShrink: 0 }}>
        <circle cx="6" cy="6" r="5.25" stroke="var(--lyra-color-status-critical-strong)" strokeWidth="1.5"/>
        <line x1="6" y1="4" x2="6" y2="6.5" stroke="var(--lyra-color-status-critical-strong)" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="6" cy="8.5" r="0.6" fill="var(--lyra-color-status-critical-strong)"/>
      </svg>
      <p style={{ margin: 0, font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-status-critical-strong)' }}>{text}</p>
    </div>
  )
}

/* ── Recency days stepper ── */
function MinsStepper({ value, onChange, onError }: { value: number; onChange: (v: number) => void; onError?: (e: boolean) => void }) {
  const [raw, setRaw] = useState(String(value))
  const hasError = raw !== '' && !/^\d+$/.test(raw)

  useEffect(() => { onError?.(hasError) }, [hasError])

  function commit(str: string) {
    if (!/^\d+$/.test(str)) return
    const n = parseInt(str, 10)
    const clamped = Math.min(10, Math.max(1, n))
    onChange(clamped)
    setRaw(String(clamped))
  }

  return (
    <div style={{ alignSelf: 'stretch' }}>
      <div style={{
        display: 'flex', alignItems: 'center', height: 36,
        background: hasError ? 'var(--lyra-color-status-critical-subtle)' : 'var(--lyra-color-bg-field)',
        borderRadius: 8,
        outline: `1px solid ${hasError ? 'var(--lyra-color-status-critical-strong)' : 'var(--lyra-color-border-strong)'}`,
        outlineOffset: -1,
        overflow: 'hidden',
      }}>
        <input
          type="text"
          inputMode="numeric"
          value={raw}
          onChange={e => setRaw(e.target.value)}
          onBlur={() => commit(raw)}
          onKeyDown={e => { if (e.key === 'Enter') commit(raw) }}
          style={{
            flex: 1, height: '100%', border: 'none', outline: 'none',
            padding: '0 8px 0 12px', background: 'transparent',
            font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)',
          }}
        />
        <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', paddingRight: 8 }}>
          Min{value !== 1 ? 's' : ''}
        </span>
        <div style={{ width: 32, alignSelf: 'stretch', borderLeft: `1px solid ${hasError ? 'var(--lyra-color-status-critical-strong)' : 'var(--lyra-color-border-strong)'}`, display: 'flex', flexDirection: 'column', padding: '1px 1px 1px 0' }}>
          <button
            onClick={() => { const next = Math.min(10, value + 1); onChange(next); setRaw(String(next)) }}
            style={{ flex: 1, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            aria-label="Increase minutes"
          >
            <ChevronUp size={12} style={{ color: 'var(--lyra-color-fg-secondary)' }} />
          </button>
          <button
            onClick={() => { const next = Math.max(1, value - 1); onChange(next); setRaw(String(next)) }}
            style={{ flex: 1, borderTop: `1px solid ${hasError ? 'var(--lyra-color-status-critical-strong)' : 'var(--lyra-color-border-strong)'}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, border: 'none', borderTop: `1px solid ${hasError ? 'var(--lyra-color-status-critical-strong)' : 'var(--lyra-color-border-strong)'}` }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            aria-label="Decrease minutes"
          >
            <ChevronDown size={12} style={{ color: 'var(--lyra-color-fg-secondary)' }} />
          </button>
        </div>
      </div>
      {hasError && <ErrMsg text="Please enter a valid number" />}
    </div>
  )
}

function DayStepper({ value, onChange, onError }: { value: number; onChange: (v: number) => void; onError?: (e: boolean) => void }) {
  const [raw, setRaw] = useState(String(value))
  const isNonNumeric = raw !== '' && !/^\d+$/.test(raw)
  const parsedRaw = parseInt(raw, 10)
  const isOutOfRange = /^\d+$/.test(raw) && !isNaN(parsedRaw) && (parsedRaw < 1 || parsedRaw > 365)
  const hasError = isNonNumeric || isOutOfRange
  const errorMsg = isNonNumeric ? 'Please enter a valid number' : 'Value must be between 1 and 365 days'

  useEffect(() => { onError?.(hasError) }, [hasError])

  function commit(str: string) {
    if (!/^\d+$/.test(str)) return
    const n = parseInt(str, 10)
    const clamped = isNaN(n) ? value : Math.min(365, Math.max(1, n))
    onChange(clamped)
    setRaw(String(clamped))
  }

  return (
    <div style={{ width: 400 }}>
      <div style={{
        display: 'flex', alignItems: 'center',
        height: 36,
        border: `1px solid ${hasError ? 'var(--lyra-color-status-critical-strong)' : 'var(--lyra-color-border-soft)'}`,
        borderRadius: 'var(--radius-sm)',
        background: hasError ? 'var(--lyra-color-status-critical-subtle)' : 'var(--lyra-color-bg-field)',
        overflow: 'hidden',
      }}>
        <input
          type="text"
          inputMode="numeric"
          value={raw}
          onChange={e => setRaw(e.target.value)}
          onBlur={() => commit(raw)}
          onKeyDown={e => { if (e.key === 'Enter') commit(raw) }}
          style={{
            flex: 1, height: '100%', border: 'none', outline: 'none',
            padding: '0 12px', background: 'transparent',
            font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)',
          }}
        />
        <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', paddingRight: 8 }}>Days</span>
        <div style={{ display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--lyra-color-border-soft)', alignSelf: 'stretch', width: 28 }}>
          <button
            onClick={() => { const next = Math.min(value + 1, 365); onChange(next); setRaw(String(next)) }}
            style={{ flex: 1, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, color: 'var(--lyra-color-fg-secondary)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
          >
            <ChevronUp size={12} />
          </button>
          <button
            onClick={() => { const next = Math.max(value - 1, 1); onChange(next); setRaw(String(next)) }}
            style={{ flex: 1, borderTop: '1px solid var(--lyra-color-border-soft)', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, color: 'var(--lyra-color-fg-secondary)', border: 'none', borderTop: '1px solid var(--lyra-color-border-soft)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
          >
            <ChevronDown size={12} />
          </button>
        </div>
      </div>
      {hasError && <ErrMsg text={errorMsg} />}
    </div>
  )
}

/* ── Day chip ── */
function DayChip({ label, active, onClick, flex }: { label: string; active: boolean; onClick: () => void; flex?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
        height: 36, padding: '0 12px',
        ...(flex ? { flex: 1 } : {}),
        font: `${active ? 500 : 400} 13px/20px var(--font-sans)`,
        color: active ? 'var(--lyra-color-fg-active-strong)' : 'var(--lyra-color-fg-secondary)',
        background: active ? 'var(--lyra-color-bg-active-subtle, #F1F7FE)' : 'var(--lyra-color-bg-surface-base)',
        border: 'none',
        outline: active ? '1px solid var(--lyra-color-status-info-strong, #2D5BB9)' : '1px solid var(--lyra-color-border-soft)',
        borderRadius: 'var(--radius-sm)', cursor: 'pointer',
      }}
    >
      {active && <Check size={12} strokeWidth={2.5} style={{ flexShrink: 0 }} />}
      {label}
    </button>
  )
}

/* ── Divider ── */
function Divider() {
  return <div style={{ borderTop: '1px solid var(--lyra-color-border-subtle)', margin: '24px 0' }} />
}

/* ── Teams/Skills dropdown ── */
function TeamsDropdown({
  selected, onChange, items, noun,
}: {
  selected: number[]
  onChange: (ids: number[]) => void
  items: { id: number; name: string }[]
  noun: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const filtered = items.filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
  const allSelected = selected.length === items.length
  const noneSelected = selected.length === 0

  function toggle(id: number) {
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id])
  }

  function toggleAll() {
    onChange(allSelected ? [] : items.map(t => t.id))
  }

  const triggerLabel = noneSelected
    ? `Select ${noun}…`
    : allSelected
    ? `All ${noun} selected`
    : `${selected.length} ${noun.replace(/s$/, '')}${selected.length === 1 ? '' : 's'} selected`

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', height: 36, padding: '0 12px', boxSizing: 'border-box',
          font: '400 14px/20px var(--font-sans)',
          color: noneSelected ? 'var(--lyra-color-fg-disabled)' : 'var(--lyra-color-fg-default)',
          background: 'var(--lyra-color-bg-field)',
          border: '1px solid var(--lyra-color-border-soft)',
          borderRadius: 'var(--radius-sm)', cursor: 'pointer', outline: 'none',
        }}
        onFocus={e => { e.currentTarget.style.borderColor = 'var(--lyra-color-border-active)'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(24,91,164,0.12)' }}
        onBlur={e => { e.currentTarget.style.borderColor = 'var(--lyra-color-border-soft)'; e.currentTarget.style.boxShadow = '' }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{triggerLabel}</span>
        <ChevronDown size={14} style={{ color: 'var(--lyra-color-fg-secondary)', flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50,
          background: 'var(--lyra-color-bg-surface-overlay)',
          border: '1px solid var(--lyra-color-border-soft)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--sol-effect-shadowlg)',
          overflow: 'hidden',
        }}>
          {/* Search */}
          <div style={{ padding: '8px 8px 4px', borderBottom: '1px solid var(--lyra-color-border-subtle)' }}>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--lyra-color-fg-secondary)', pointerEvents: 'none' }} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={`Search ${noun}…`}
                autoFocus
                style={{
                  width: '100%', height: 30, padding: '0 8px 0 28px', boxSizing: 'border-box',
                  font: '400 13px/18px var(--font-sans)', color: 'var(--lyra-color-fg-default)',
                  background: 'var(--lyra-color-bg-field)',
                  border: '1px solid var(--lyra-color-border-soft)',
                  borderRadius: 'var(--radius-xs)', outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Select all row */}
          <button
            onMouseDown={e => { e.preventDefault(); toggleAll() }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: '8px 12px', border: 'none', boxSizing: 'border-box',
              background: 'transparent', cursor: 'pointer', textAlign: 'left',
              borderBottom: '1px solid var(--lyra-color-border-subtle)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            {/* Checkbox */}
            <div style={{
              width: 16, height: 16, borderRadius: 4, flexShrink: 0,
              border: allSelected ? 'none' : selected.length > 0 ? 'none' : '1.5px solid var(--lyra-color-border-medium)',
              background: allSelected ? 'var(--lyra-color-bg-primary)' : selected.length > 0 ? 'var(--lyra-color-bg-primary)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {allSelected && <Check size={10} style={{ color: 'white' }} />}
              {!allSelected && selected.length > 0 && (
                <div style={{ width: 8, height: 2, background: 'white', borderRadius: 1 }} />
              )}
            </div>
            <span style={{ font: '500 13px/18px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>
              All {noun}
            </span>
            <span style={{ marginLeft: 'auto', font: '400 12px/16px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)' }}>
              {items.length}
            </span>
          </button>

          {/* Team list */}
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {filtered.length === 0 && (
              <div style={{ padding: '12px', font: '400 13px/18px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', textAlign: 'center' }}>
                No {noun} found
              </div>
            )}
            {filtered.map(team => {
              const checked = selected.includes(team.id)
              return (
                <button
                  key={team.id}
                  onMouseDown={e => { e.preventDefault(); toggle(team.id) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '7px 12px', border: 'none', boxSizing: 'border-box',
                    background: checked ? 'var(--lyra-color-bg-active-subtle)' : 'transparent',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                  onMouseEnter={e => { if (!checked) (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = checked ? 'var(--lyra-color-bg-active-subtle)' : 'transparent' }}
                >
                  <div style={{
                    width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                    border: checked ? 'none' : '1.5px solid var(--lyra-color-border-medium)',
                    background: checked ? 'var(--lyra-color-bg-primary)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {checked && <Check size={10} style={{ color: 'white' }} />}
                  </div>
                  <span style={{
                    font: `${checked ? 500 : 400} 13px/18px var(--font-sans)`,
                    color: checked ? 'var(--lyra-color-fg-active-strong)' : 'var(--lyra-color-fg-default)',
                  }}>
                    {team.name}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Footer */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 12px', borderTop: '1px solid var(--lyra-color-border-subtle)',
            font: '400 12px/16px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)',
          }}>
            <span>{selected.length} of {items.length} selected</span>
            <button
              onMouseDown={e => { e.preventDefault(); setOpen(false) }}
              style={{
                height: 28, padding: '0 12px', borderRadius: 'var(--radius-sm)',
                border: 'none', background: 'var(--lyra-color-bg-primary)',
                font: '500 12px/16px var(--font-sans)', color: 'var(--lyra-color-fg-on-primary)',
                cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Step indicator in sidebar ── */
function StepItem({
  label,
  sublabel,
  status,
  onClick,
}: {
  label: string
  sublabel?: string
  status: 'ok' | 'warn' | 'error'
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        width: '100%', height: 36, padding: '0 8px 0 0',
        border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left',
        borderRadius: 8, overflow: 'hidden',
      }}
    >
      <div style={{ flexShrink: 0 }}>
        {status === 'ok'
          ? <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--lyra-color-status-success-strong, #197E26)' }} />
          : status === 'error'
          ? <svg viewBox="0 0 16 16" width="16" height="16" fill="none">
              <circle cx="8" cy="8" r="8" fill="var(--lyra-color-status-critical-strong)"/>
              <line x1="8" y1="4.5" x2="8" y2="9" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
              <circle cx="8" cy="11.5" r="0.8" fill="white"/>
            </svg>
          : <div style={{
              width: 16, height: 16, borderRadius: '50%',
              border: '1px solid var(--lyra-color-border-soft, rgba(0,0,0,0.16))',
              background: 'transparent', flexShrink: 0,
            }} />
        }
      </div>
      <div>
        <div style={{ font: '500 12px/16px var(--font-sans)', color: 'var(--lyra-color-fg-default)', letterSpacing: '0.2px' }}>
          {label}
          {sublabel && (
            <span style={{ font: '400 12px/16px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', letterSpacing: '0.2px' }}>
              {' '}{sublabel}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

/* ═══════════════════════════════════════════════════════════════════ */
/* ── MAIN COMPONENT ── */
/* ═══════════════════════════════════════════════════════════════════ */

interface Props {
  onCancel: () => void
  onSave: (status: 'draft' | 'active', data?: { name: string; channels: string[]; editedId?: string }) => void
  editCampaign?: Campaign
}

function campaignToForm(c: Campaign): Form {
  const digital = c.channels.some(ch => ch !== 'IVR')
  const ivr = c.channels.includes('IVR')
  const hasEndDate = !!c.endDate
  return {
    ...DEFAULT_FORM,
    name: c.name,
    digitalChannel: digital,
    ivrChannel: ivr,
    ongoing: !hasEndDate,
    startDate: '2026-05-12',
    endDate: c.endDate ?? '',
    surveyId: SURVEY_DESIGNS[0]?.id ?? '',
  }
}

export function CreateProgramPage({ onCancel, onSave, editCampaign }: Props) {
  const [form, setForm] = useState<Form>(() => editCampaign ? campaignToForm(editCampaign) : DEFAULT_FORM)
  const [surveyDrawerOpen, setSurveyDrawerOpen] = useState(false)
  const [themeDrawerOpen, setThemeDrawerOpen] = useState(false)
  const [themeDetailOpen, setThemeDetailOpen] = useState(false)
  const [showProgramTooltip, setShowProgramTooltip] = useState(false)
  const [showNameError, setShowNameError] = useState(false)
  const [nameCharError, setNameCharError] = useState(false)
  const [minsFieldError, setMinsFieldError] = useState(false)
  const [daysFieldError, setDaysFieldError] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showDeactivateModal, setShowDeactivateModal] = useState(false)
  const [originalForm] = useState<Form>(() => editCampaign ? campaignToForm(editCampaign) : DEFAULT_FORM)

  const audienceError = minsFieldError || daysFieldError
  const programTooltipRef = useRef<HTMLDivElement>(null)
  const programTooltipHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function openProgramTooltip() {
    if (programTooltipHideTimer.current) clearTimeout(programTooltipHideTimer.current)
    setShowProgramTooltip(true)
  }
  function closeProgramTooltip() {
    programTooltipHideTimer.current = setTimeout(() => setShowProgramTooltip(false), 80)
  }

  const surveyRef = useRef<HTMLDivElement>(null)
  const audienceRef = useRef<HTMLDivElement>(null)
  const deliveryRef = useRef<HTMLDivElement>(null)
  const actionsRef = useRef<HTMLDivElement>(null)

  function set<K extends keyof Form>(k: K, v: Form[K]) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  const selectedSurvey = form.surveyId ? SURVEY_DESIGNS.find(s => s.id === form.surveyId) : null
  const selectedTheme = DIGITAL_THEMES.find(t => t.id === form.themeId) ?? DIGITAL_THEMES[0]
  const nameChars = form.name.length

  const surveyDone = !!form.surveyId

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const startDatePast = !!form.startDate && new Date(form.startDate + 'T00:00:00') < today
  const endDateBeforeStart = !form.ongoing && !!form.endDate && !!form.startDate && new Date(form.endDate + 'T00:00:00') < new Date(form.startDate + 'T00:00:00')
  const endDateMissing = !form.ongoing && !form.endDate

  const deliveryError = startDatePast || endDateBeforeStart
  const deliveryDone = !!form.startDate && !startDatePast && (form.ongoing || (!!form.endDate && !endDateBeforeStart))
  const stepsOk = [surveyDone, true, deliveryDone].filter(Boolean).length

  function scrollTo(ref: React.RefObject<HTMLDivElement | null>) {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function toggleDay(key: string) {
    const next = form.surveyDays.includes(key)
      ? form.surveyDays.filter(d => d !== key)
      : [...form.surveyDays, key]
    set('surveyDays', next)
    set('selectAllDays', next.length === 7)
  }

  function toggleSelectAll(v: boolean) {
    set('selectAllDays', v)
    set('surveyDays', v ? DAYS.map(d => d.key) : [])
  }

  const hasChanges = editCampaign ? JSON.stringify(form) !== JSON.stringify(originalForm) : false
  const isEditActive = editCampaign?.status === 'active'
  const isEditPaused = editCampaign?.status === 'paused'

  // Rule 9: auto-expired inactive — paused program whose end date has crossed
  const endDatePast = !form.ongoing && !!form.endDate && new Date(form.endDate + 'T00:00:00') < today
  const isExpiredInactive = isEditPaused && endDatePast && !hasChanges
  // Manually deactivated: paused but NOT because end date crossed
  const isManuallyInactive = isEditPaused && !isExpiredInactive

  // Rules 1+9: suppress all validation for active programs AND manually inactive programs on load
  const suppressValidation = (isEditActive || isManuallyInactive) && !hasChanges

  // Nav statuses — expired inactive shows delivery error; active/manually-inactive show all-green on load
  const navDeliveryStatus = isExpiredInactive ? 'error' : ((isEditActive || isManuallyInactive) && !hasChanges) ? 'ok' : (deliveryDone ? 'ok' : deliveryError ? 'error' : 'warn')
  const navAudienceStatus = ((isEditActive || isManuallyInactive) && !hasChanges) ? 'ok' : (audienceError ? 'error' : 'ok')
  const navSurveyStatus   = ((isEditActive || isManuallyInactive) && !hasChanges) ? 'ok' : (surveyDone ? 'ok' : 'warn')
  const navStepsOk = [navDeliveryStatus, navAudienceStatus, navSurveyStatus].filter(s => s === 'ok').length

  const canSave = editCampaign
    ? hasChanges && !!form.name && !nameCharError && !deliveryError && !endDateMissing && !audienceError
    : !!form.name
  const canDuplicate = editCampaign?.status === 'active' || editCampaign?.status === 'inactive'
  const canActivate = surveyDone && deliveryDone && !!form.name && !nameCharError && !audienceError
  const canTest = surveyDone

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, background: 'var(--lyra-color-bg-surface-base)' }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', flexWrap: 'wrap', alignContent: 'center',
        flexShrink: 0, minHeight: 72, padding: '16px 32px',
        gap: '16px 40px',
        borderBottom: '1px solid var(--lyra-color-border-subtle)',
        background: 'var(--lyra-color-bg-surface-base)',
      }}>

        {/* Left: breadcrumb + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* "Programs /" breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={() => { if (editCampaign ? hasChanges : (form.name || form.surveyId)) { setShowCancelModal(true) } else { onCancel() } }}
                style={{ font: '500 16px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--lyra-color-fg-default)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--lyra-color-fg-secondary)' }}
              >Programs</button>
              <span style={{ font: '500 16px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>/</span>
            </div>
            {/* Page title */}
            <span style={{ font: '600 20px/24px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>
              {form.name || (editCampaign ? editCampaign.name : 'Create new program')}
            </span>
          </div>
          {/* Info icon + tooltip */}
          <div
            ref={programTooltipRef}
            style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
            onMouseEnter={openProgramTooltip}
            onMouseLeave={closeProgramTooltip}
          >
            <Info
              size={16}
              style={{ color: 'var(--lyra-color-fg-action)', flexShrink: 0, cursor: 'pointer' }}
              aria-label="Program info"
              onClick={() => setShowProgramTooltip(v => !v)}
            />
            {showProgramTooltip && (
              <div
                onMouseEnter={openProgramTooltip}
                onMouseLeave={closeProgramTooltip}
                style={{
                  position: 'absolute',
                  left: 'calc(100% + 10px)',
                  top: '50%',
                  transform: 'translateY(-8px)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  zIndex: 9999,
                }}>
                {/* Left-pointing arrow (border layer then fill layer) */}
                <div style={{
                  width: 0, height: 0, flexShrink: 0,
                  borderTop: '6px solid transparent',
                  borderBottom: '6px solid transparent',
                  borderRight: '7px solid var(--lyra-color-border-soft)',
                  marginRight: -1,
                }} />
                <div style={{
                  width: 0, height: 0, flexShrink: 0,
                  borderTop: '5px solid transparent',
                  borderBottom: '5px solid transparent',
                  borderRight: '6px solid var(--lyra-color-bg-surface-base)',
                  marginRight: -1,
                  position: 'relative', zIndex: 1,
                }} />
                {/* Tooltip card */}
                <div style={{
                  width: 248,
                  padding: '12px 12px 8px 8px',
                  background: 'var(--lyra-color-bg-surface-base)',
                  borderRadius: 'var(--radius-md)',
                  outline: '1px solid var(--lyra-color-border-soft)',
                  boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.06)',
                  fontSize: 14, lineHeight: '20px', fontWeight: 400,
                  color: 'var(--lyra-color-fg-default)',
                  fontFamily: 'var(--font-sans)',
                  whiteSpace: 'normal',
                }}>
                  A Program controls who receives a survey, when it is sent, and which survey experience is used.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Spacer */}
        <div style={{ flex: '1 1 0', height: 36 }} />

        {/* Right: action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Cancel — always active */}
          <button
            onClick={() => { if (editCampaign ? hasChanges : (form.name || form.surveyId)) { setShowCancelModal(true) } else { onCancel() } }}
            style={{ height: 36, minWidth: 80, padding: '0 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--lyra-color-border-soft)', background: 'var(--lyra-color-bg-surface-base)', font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-action)', cursor: 'pointer', outline: 'none' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-bg-surface-base)' }}
          >Cancel</button>

          {/* Test program */}
          {canTest ? (
            <button
              style={{ height: 36, minWidth: 80, padding: '0 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--lyra-color-border-soft)', background: 'var(--lyra-color-bg-surface-base)', font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', cursor: 'pointer', outline: 'none' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-bg-surface-base)' }}
            >Test program</button>
          ) : (
            <div style={{ height: 36, minWidth: 80, padding: '0 16px', borderRadius: 'var(--radius-md)', background: 'var(--lyra-color-bg-disabled)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-disabled)', cursor: 'not-allowed' }}>
              Test program
            </div>
          )}

          {editCampaign ? (
            <>
              {/* Duplicate — enabled for active/inactive, disabled for draft */}
              {canDuplicate ? (
                <button
                  style={{ height: 36, minWidth: 80, padding: '0 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--lyra-color-border-soft)', background: 'var(--lyra-color-bg-surface-base)', font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-action)', cursor: 'pointer', outline: 'none' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-bg-surface-base)' }}
                >Duplicate</button>
              ) : (
                <div style={{ height: 36, minWidth: 80, padding: '0 16px', borderRadius: 'var(--radius-md)', background: 'var(--lyra-color-bg-disabled)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-disabled)' }}>
                  Duplicate
                </div>
              )}
              {/* Deactivate / Activate — context-sensitive */}
              {editCampaign?.status === 'active' ? (
                <button
                  onClick={() => setShowDeactivateModal(true)}
                  style={{ height: 36, minWidth: 80, padding: '0 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--lyra-color-border-soft)', background: 'var(--lyra-color-bg-destructive)', font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-on-primary)', cursor: 'pointer', outline: 'none' }}
                >Deactivate</button>
              ) : (
                <button
                  onClick={() => onSave('active', { name: form.name, channels: [], editedId: editCampaign?.id })}
                  style={{ height: 36, minWidth: 80, padding: '0 16px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--lyra-color-bg-primary)', font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-on-primary)', cursor: 'pointer', outline: 'none' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-primary)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-bg-primary)' }}
                >Activate</button>
              )}
              {/* Save — only for active programs, not inactive */}
              {isEditActive && (canSave ? (
                <button
                  onClick={() => { if (!form.name || nameCharError) { setShowNameError(!form.name); return } onSave('active', { name: form.name, channels: [], editedId: editCampaign?.id }) }}
                  style={{ height: 36, minWidth: 80, padding: '0 16px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--lyra-color-bg-primary)', font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-on-primary)', cursor: 'pointer', outline: 'none' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-primary)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-bg-primary)' }}
                >Save</button>
              ) : (
                <div style={{ height: 36, minWidth: 80, padding: '0 16px', borderRadius: 'var(--radius-md)', background: 'var(--lyra-color-bg-disabled)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-disabled)', cursor: 'not-allowed' }}>Save</div>
              ))}
            </>
          ) : (
            <>
              {/* Save as draft */}
              {canSave ? (
                <button
                  onClick={() => { if (nameCharError) return; onSave('draft', { name: form.name, channels: [] }) }}
                  style={{ height: 36, minWidth: 80, padding: '0 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--lyra-color-border-soft)', background: 'var(--lyra-color-bg-surface-base)', font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-action)', cursor: 'pointer', outline: 'none' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-bg-surface-base)' }}
                >Save as draft</button>
              ) : (
                <div style={{ height: 36, minWidth: 80, padding: '0 16px', borderRadius: 'var(--radius-md)', background: 'var(--lyra-color-bg-disabled)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-disabled)', cursor: 'not-allowed' }}>Save as draft</div>
              )}
              {/* Activate */}
              {canActivate ? (
                <button
                  onClick={() => {
                    if (!form.name || nameCharError) { setShowNameError(!form.name); return }
                    const channels: string[] = []
                    if (form.digitalChannel) channels.push('Digital')
                    onSave('active', { name: form.name, channels })
                  }}
                  style={{ height: 36, minWidth: 80, padding: '0 16px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--lyra-color-bg-primary)', font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-on-primary)', cursor: 'pointer', outline: 'none' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-primary)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-bg-primary)' }}
                >Activate</button>
              ) : (
                <div style={{ height: 36, minWidth: 80, padding: '0 16px', borderRadius: 'var(--radius-md)', background: 'var(--lyra-color-bg-disabled)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-disabled)' }}>Activate</div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, gap: 16, padding: '24px 24px 0' }}>

        {/* ① Left step sidebar */}
        <div style={{ width: 160, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4, alignSelf: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <StepItem label="Delivery" status={editCampaign ? navDeliveryStatus : (deliveryDone ? 'ok' : deliveryError ? 'error' : 'warn')} onClick={() => scrollTo(deliveryRef)} />
            <StepItem label="Audience" status={editCampaign ? navAudienceStatus : (audienceError ? 'error' : 'ok')} onClick={() => scrollTo(audienceRef)} />
            <StepItem label="Survey" status={editCampaign ? navSurveyStatus : (surveyDone ? 'ok' : 'warn')} onClick={() => scrollTo(surveyRef)} />
            <StepItem label="Actions" sublabel="(optional)" status="warn" onClick={() => scrollTo(actionsRef)} />
          </div>
          <div style={{ paddingTop: 8, paddingBottom: 8 }}>
            <div style={{ height: 0, outline: '1px solid var(--lyra-color-border-subtle)', outlineOffset: -0.5 }} />
          </div>
          <div style={{ font: '400 12px/16px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', letterSpacing: '0.2px' }}>
            {editCampaign ? navStepsOk : stepsOk} of 4 steps done
          </div>
        </div>

        {/* ② Scrollable form */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <div style={{ maxWidth: 1283, width: '100%', margin: 0, padding: '0 0 64px 0' }}>

            {/* Expired inactive banner */}
            {isExpiredInactive && (
              <div style={{ marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'var(--lyra-color-status-critical-subtle)', border: '1px solid rgba(189,42,42,0.2)' }}>
                <svg viewBox="0 0 16 16" width="16" height="16" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
                  <circle cx="8" cy="8" r="7.25" stroke="var(--lyra-color-status-critical-strong)" strokeWidth="1.5" />
                  <line x1="8" y1="5" x2="8" y2="9" stroke="var(--lyra-color-status-critical-strong)" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="8" cy="11.5" r="0.75" fill="var(--lyra-color-status-critical-strong)" />
                </svg>
                <p style={{ margin: 0, font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-status-critical-strong)' }}>
                  This program has expired and is currently inactive. Change the end date to a future date to reactivate it.
                </p>
              </div>
            )}

            {/* Program name */}
            <div style={{ marginBottom: 24, border: '1px solid var(--lyra-color-border-subtle)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, maxWidth: 400 }}>
                <Label required>Program name</Label>
                <span style={{ font: '400 12px/16px var(--font-sans)', color: nameChars > 45 ? 'var(--lyra-color-status-critical-strong)' : 'var(--lyra-color-fg-secondary)' }}>
                  {nameChars}/50
                </span>
              </div>
              {(() => {
                const hasErr = (showNameError && !form.name) || (!!form.name && nameCharError)
                return (
                  <>
                    <input
                      type="text"
                      value={form.name}
                      maxLength={50}
                      onChange={e => {
                        const raw = e.target.value.slice(0, 50)
                        set('name', raw)
                        const hasInvalid = /[\/!+<>?#&,%]/.test(raw)
                        setNameCharError(hasInvalid)
                        if (raw.trim() && !hasInvalid) setShowNameError(false)
                      }}
                      placeholder="Eg: CSAT survey program"
                      style={{
                        width: '100%', maxWidth: 400, boxSizing: 'border-box',
                        height: 36, padding: '0 12px',
                        font: '400 14px/20px var(--font-sans)',
                        color: 'var(--lyra-color-fg-default)',
                        background: hasErr ? 'var(--lyra-color-status-critical-subtle)' : 'var(--lyra-color-bg-field)',
                        border: `1px solid ${hasErr ? 'var(--lyra-color-status-critical-strong)' : 'var(--lyra-color-border-soft)'}`,
                        borderRadius: 'var(--radius-sm)', outline: 'none',
                      }}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = hasErr ? 'var(--lyra-color-status-critical-strong)' : 'var(--lyra-color-border-active)'
                        e.currentTarget.style.boxShadow = hasErr ? '0 0 0 2px rgba(189,42,42,0.12)' : '0 0 0 2px rgba(24,91,164,0.12)'
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = hasErr ? 'var(--lyra-color-status-critical-strong)' : 'var(--lyra-color-border-soft)'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    />
                    {showNameError && !form.name && <ErrMsg text="Required" />}
                    {form.name && nameCharError && <ErrMsg text='Special characters like / ! + &lt; &gt; ? # &amp; , % are not allowed' />}
                  </>
                )
              })()}
            </div>

            {/* Delivery */}
            <div ref={deliveryRef} style={{ marginBottom: 24, border: '1px solid var(--lyra-color-border-subtle)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
              <SectionHeader label="Delivery" infoTip="Choose how and when customers receive this survey. Select the channel, schedule, and survey hours for this program." status={suppressValidation ? 'ok' : isExpiredInactive ? 'error' : (deliveryDone ? 'ok' : deliveryError ? 'error' : 'warn')} />

              {/* Active date range */}
              <div style={{ paddingBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>Active date range</span>
                  <Toggle checked={form.ongoing} onChange={v => set('ongoing', v)} />
                  <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)' }}>Ongoing</span>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 400 }}>
                    <Label required>Start date</Label>
                    <FiDatePicker value={form.startDate} onChange={v => set('startDate', v)} placeholder="Select date" error={!suppressValidation && !isExpiredInactive && startDatePast} />
                    {!suppressValidation && !isExpiredInactive && startDatePast && <ErrMsg text="Start date cannot be in the past" />}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 400 }}>
                    <Label required={!form.ongoing}>End date</Label>
                    <FiDatePicker value={form.endDate} onChange={v => set('endDate', v)} disabled={form.ongoing} placeholder={form.ongoing ? 'Ongoing' : 'Select date'} error={(!suppressValidation && endDateBeforeStart) || isExpiredInactive} />
                    {isExpiredInactive && <ErrMsg text="Expired" />}
                    {!suppressValidation && !isExpiredInactive && endDateMissing && <ErrMsg text="End date is required" />}
                    {!suppressValidation && endDateBeforeStart && <ErrMsg text="End date must be on or after the start date" />}
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--lyra-color-border-subtle)', margin: '8px 0' }} />

              {/* Survey hours */}
              <div style={{ paddingBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: form.allDay ? 0 : 16 }}>
                  <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>Survey hours</span>
                  <Toggle checked={form.allDay} onChange={v => set('allDay', v)} />
                  <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)' }}>All day (24 hrs)</span>
                </div>
                {!form.allDay && (
                  <div style={{ display: 'flex', gap: 16 }}>
                    {(['startTime', 'endTime'] as const).map((field, i) => (
                      <div key={field} style={{ width: 400 }}>
                        <label style={{ display: 'block', font: '500 13px/16px var(--font-sans)', color: 'var(--lyra-color-fg-default)', marginBottom: 6 }}>
                          {i === 0 ? 'Start Time' : 'End Time'} <span style={{ color: 'var(--lyra-color-status-critical-strong)' }}>*</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type="text"
                            value={form[field]}
                            onChange={e => set(field, e.target.value)}
                            placeholder="00:00"
                            style={{
                              height: 36, width: '100%', padding: '0 36px 0 12px', boxSizing: 'border-box',
                              background: 'var(--lyra-color-bg-field)',
                              border: '1px solid var(--lyra-color-border-soft)',
                              borderRadius: 'var(--radius-sm)',
                              font: '400 14px/20px var(--font-sans)',
                              color: 'var(--lyra-color-fg-default)',
                              outline: 'none',
                            }}
                            onFocus={e => { e.currentTarget.style.borderColor = 'var(--lyra-color-border-active)'; e.currentTarget.style.boxShadow = 'var(--sol-effect-activering)' }}
                            onBlur={e => { e.currentTarget.style.borderColor = 'var(--lyra-color-border-soft)'; e.currentTarget.style.boxShadow = '' }}
                          />
                          <Clock size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--lyra-color-fg-secondary)', pointerEvents: 'none' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px solid var(--lyra-color-border-subtle)', margin: '8px 0' }} />

              {/* Surveying days */}
              <div style={{ paddingBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>Surveying days</span>
                  <span style={{ color: 'var(--lyra-color-status-critical-strong)', font: '500 14px/20px var(--font-sans)' }}>*</span>
                  <Toggle checked={form.selectAllDays} onChange={toggleSelectAll} />
                  <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)' }}>Select all</span>
                </div>
                <div style={{ display: 'flex', gap: 20 }}>
                  {DAYS.map(d => (
                    <DayChip key={d.key} label={d.label} active={form.surveyDays.includes(d.key)} onClick={() => toggleDay(d.key)} flex />
                  ))}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--lyra-color-border-subtle)', margin: '8px 0' }} />

              {/* Select channels */}
              <div style={{ paddingBottom: 20 }}>
                <div style={{ marginBottom: 8 }}><Label required>Select channels</Label></div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {/* Digital — active toggle */}
                  <button
                    onClick={() => { if (!form.digitalChannel || form.ivrChannel) set('digitalChannel', !form.digitalChannel) }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                      width: 197, height: 36, padding: '0 16px', boxSizing: 'border-box',
                      borderRadius: 'var(--radius-md)',
                      font: `${form.digitalChannel ? 500 : 400} 14px/20px var(--font-sans)`,
                      color: form.digitalChannel ? 'var(--lyra-color-fg-active-strong)' : 'var(--lyra-color-fg-secondary)',
                      background: form.digitalChannel ? 'var(--lyra-color-bg-active-subtle)' : 'transparent',
                      border: `1px solid ${form.digitalChannel ? 'var(--lyra-color-border-active)' : 'var(--lyra-color-border-soft)'}`,
                      cursor: 'pointer', outline: 'none',
                    }}
                  >
                    <Monitor size={14} />Digital
                  </button>
                  {/* IVR — permanently disabled */}
                  <div
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                      width: 197, height: 36, padding: '0 16px', boxSizing: 'border-box',
                      borderRadius: 'var(--radius-md)',
                      font: '400 14px/20px var(--font-sans)',
                      color: 'var(--lyra-color-fg-disabled)',
                      background: 'var(--lyra-color-bg-disabled)',
                      border: '1px solid var(--lyra-color-border-disabled)',
                      cursor: 'not-allowed',
                    }}
                  >
                    <Phone size={14} />IVR
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--lyra-color-border-subtle)', margin: '8px 0' }} />

              {/* Themes */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>Themes</span>
                  <InfoTooltip text="The theme owns how each question looks and every message the customer reads. One per channel." />
                </div>
                <div style={{ background: 'var(--lyra-color-bg-surface-shell)', borderRadius: 12, overflow: 'hidden' }}>
                  {/* Header row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', height: 56, borderBottom: '1px solid var(--lyra-color-border-subtle)' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--lyra-color-bg-surface-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Monitor size={18} style={{ color: 'var(--lyra-color-fg-secondary)' }} />
                    </div>
                    <span style={{ font: '500 16px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', flex: 1 }}>{selectedTheme.name}</span>
                    {selectedTheme.type === 'system' ? (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4, height: 24, padding: '0 8px',
                        font: '400 14px/20px var(--font-sans)',
                        color: 'var(--lyra-color-status-info-strong)',
                        background: 'var(--lyra-color-status-info-subtle)',
                        borderRadius: 'var(--radius-sm)', flexShrink: 0,
                      }}>
                        System Default
                      </span>
                    ) : (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4, height: 24, padding: '0 8px',
                        font: '400 14px/20px var(--font-sans)',
                        color: 'var(--lyra-color-status-success-strong)',
                        background: 'var(--lyra-color-status-success-subtle)',
                        borderRadius: 'var(--radius-sm)', flexShrink: 0,
                      }}>
                        Custom
                      </span>
                    )}
                    <button
                      onClick={() => setThemeDrawerOpen(true)}
                      style={{
                        display: 'inline-flex', alignItems: 'center',
                        height: 36, padding: '0 12px',
                        font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-action)',
                        background: 'var(--lyra-color-bg-surface-base)',
                        border: '1px solid var(--lyra-color-border-soft)',
                        borderRadius: 'var(--radius-sm)', cursor: 'pointer', outline: 'none',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-bg-surface-base)' }}
                    >
                      Change theme
                    </button>
                  </div>
                  {/* Metadata row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)' }}>
                    <span>
                      Control style: <strong style={{ color: 'var(--lyra-color-fg-default)', fontWeight: 500 }}>{selectedTheme.controlStyle}</strong>
                      <span style={{ margin: '0 12px', color: 'var(--lyra-color-border-soft)' }}>|</span>
                      Message mode: <strong style={{ color: 'var(--lyra-color-fg-default)', fontWeight: 500 }}>{selectedTheme.messageMode}</strong>
                    </span>
                    <button onClick={() => setThemeDetailOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 2, font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, outline: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      View more details <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>


            {/* Audience */}
            <div ref={audienceRef} style={{ marginBottom: 24, border: '1px solid var(--lyra-color-border-subtle)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
              <SectionHeader label="Audience" infoTip="Choose who can receive this survey. These audience settings apply only to this program and won't affect other programs." status={suppressValidation ? 'ok' : (audienceError ? 'error' : 'ok')} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* ① Teams & Skills selection */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                  {/* Who gets surveyed segmented */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <Label required>Who gets surveyed</Label>
                    <div style={{ display: 'flex', width: 400, height: 36, borderRadius: 8, outline: '1px solid var(--lyra-color-border-soft)', outlineOffset: -1, overflow: 'hidden', background: 'var(--lyra-color-bg-control, white)' }}>
                      {(['teams', 'skills'] as const).map(m => {
                        const active = form.audienceMode === m
                        return (
                          <button
                            key={m}
                            onClick={() => set('audienceMode', m)}
                            style={{
                              flex: 1, alignSelf: 'stretch', padding: '0 16px',
                              font: `${active ? 500 : 400} 14px/20px var(--font-sans)`,
                              color: active ? 'var(--lyra-color-fg-active-strong)' : 'var(--lyra-color-fg-default)',
                              background: active ? 'var(--lyra-color-bg-active-subtle, #ECF4FE)' : 'transparent',
                              border: 'none', cursor: 'pointer',
                              outline: active ? '1px solid var(--lyra-color-status-info-strong, #3163C9)' : 'none',
                              outlineOffset: -1,
                              borderRadius: 8,
                            }}
                          >
                            {m === 'teams' ? 'Teams' : 'Skills'}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Select teams / skills dropdown */}
                  <div style={{ width: 400, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <Label required>{form.audienceMode === 'teams' ? 'Select teams' : 'Select skills'}</Label>
                    {form.audienceMode === 'teams'
                      ? <TeamsDropdown selected={form.selectedTeams} onChange={v => set('selectedTeams', v)} items={TEAMS} noun="teams" />
                      : <TeamsDropdown selected={form.selectedSkills} onChange={v => set('selectedSkills', v)} items={SKILLS} noun="skills" />
                    }
                    <div style={{ font: '400 12px/16px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', letterSpacing: '0.2px' }}>
                      {form.audienceMode === 'teams'
                        ? (form.selectedTeams.length === 0
                          ? 'No teams selected'
                          : `${form.selectedTeams.length} of ${TEAMS.length} team${form.selectedTeams.length === 1 ? '' : 's'} selected`)
                        : (form.selectedSkills.length === 0
                          ? 'No skills selected'
                          : `${form.selectedSkills.length} of ${SKILLS.length} skill${form.selectedSkills.length === 1 ? '' : 's'} selected`)
                      }
                    </div>
                  </div>

                  {/* Total agents selected */}
                  {(() => {
                    const count = form.audienceMode === 'teams' ? form.selectedTeams.length : form.selectedSkills.length
                    return count > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <UserRoundCheck size={20} style={{ color: 'var(--lyra-color-fg-secondary)', flexShrink: 0 }} />
                        <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>
                          Total agents selected: {count * AGENTS_PER_TEAM}
                        </span>
                      </div>
                    ) : null
                  })()}
                </div>

                <div style={{ borderTop: '1px solid var(--lyra-color-border-subtle)', margin: '8px 0' }} />

                {/* ② Filter by interaction duration */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
                  {/* Toggle row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Toggle checked={form.filterByDuration} onChange={v => set('filterByDuration', v)} />
                    <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>
                      Filter by interaction length{' '}
                      <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)' }}>(optional)</span>
                    </span>
                  </div>

                  {/* Expanded panel — visible only when ON */}
                  {form.filterByDuration && (
                    <div style={{ width: 400, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                      {/* Label row */}
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>
                          Minimum interaction duration
                        </span>
                        <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)' }}>
                          (Range: 1–10 mins)
                        </span>
                      </div>

                      <MinsStepper value={form.interactionMins} onChange={v => set('interactionMins', v)} onError={setMinsFieldError} />

                      {/* Helper text */}
                      <div style={{
                        font: '400 12px/16px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)',
                        letterSpacing: '0.2px',
                      }}>
                        Only send survey if the interaction lasted at least this long
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--lyra-color-border-subtle)', margin: '8px 0' }} />

                {/* ③ Suppression rules */}
                <div>
                  <div style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', marginBottom: 2 }}>
                    Suppression rules
                  </div>
                  <div style={{ font: '400 12px/16px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', letterSpacing: '0.2px' }}>
                    Define when not to send surveys, even if an interaction otherwise qualifies.
                  </div>
                </div>

                {/* Opt-out tag */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Toggle checked={form.suppressOptOut} onChange={v => set('suppressOptOut', v)} />
                    <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>Opt-out tag</span>
                  </div>
                  {form.suppressOptOut && (
                    <div style={{ font: '400 12px/16px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', letterSpacing: '0.2px' }}>
                      Skip any customer flagged as opted out.
                    </div>
                  )}
                </div>

                {/* Recency window */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Toggle checked={form.suppressRecency} onChange={v => set('suppressRecency', v)} />
                    <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>Recency window</span>
                  </div>
                  {form.suppressRecency && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>Number of days</span>
                        <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)' }}>(Range: 1–365 days)</span>
                      </div>
                      <DayStepper value={form.recencyDays} onChange={v => set('recencyDays', v)} onError={setDaysFieldError} />
                      <div style={{ font: '400 12px/16px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', letterSpacing: '0.2px' }}>
                        Don't survey the same customer twice within a configurable number of days
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>


            {/* Survey */}
            <div ref={surveyRef} style={{ marginBottom: 24, border: '1px solid var(--lyra-color-border-subtle)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
              <SectionHeader
                label={<><span>Survey </span><span style={{ color: 'var(--lyra-color-status-critical-strong, #C93232)' }}>*</span></>}
                infoTip="Choose the survey you want to send. If the survey is updated in the library, all programs using it will automatically use the latest version."
                status={surveyDone ? 'ok' : 'warn'}
              />

              {selectedSurvey ? (
                <div style={{ background: 'var(--lyra-color-bg-surface-shell)', borderRadius: 12, overflow: 'hidden' }}>
                  {/* Survey header row */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    height: 56, padding: '0 16px',
                    borderBottom: '1px solid var(--lyra-color-border-subtle)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--lyra-color-bg-secondary, white)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <ClipboardList size={18} style={{ color: 'var(--lyra-color-fg-default)' }} />
                      </div>
                      <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>
                        {selectedSurvey.name}
                      </span>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center',
                        height: 24, padding: '0 8px',
                        font: '400 14px/20px var(--font-sans)',
                        color: 'var(--lyra-color-accent-purple-subtle-fg, #6E56CC)',
                        background: 'var(--lyra-color-accent-purple-subtle-bg, #EFEBFF)',
                        outline: '1px solid var(--lyra-color-accent-purple-subtle-fg, #6E56CC)',
                        outlineOffset: -1,
                        borderRadius: 6, flexShrink: 0,
                      }}>
                        Contextual
                      </span>
                    </div>
                    <button
                      onClick={() => setSurveyDrawerOpen(true)}
                      style={{
                        display: 'inline-flex', alignItems: 'center',
                        height: 36, padding: '0 16px',
                        font: '500 14px/20px var(--font-sans)',
                        color: 'var(--lyra-color-fg-action, #5D6A79)',
                        background: 'var(--lyra-color-bg-secondary, white)',
                        border: 'none',
                        outline: '1px solid var(--lyra-color-border-soft)',
                        outlineOffset: -1,
                        borderRadius: 8, cursor: 'pointer', flexShrink: 0,
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-bg-secondary, white)' }}
                    >Change survey</button>
                  </div>
                  {/* Survey metadata row */}
                  <div style={{ padding: 16, display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                    {[
                      { label: 'Question types:', value: 'CSAT (1-5), Verbatim' },
                      { label: 'Updated on:', value: 'May 12, 2026  10:55:06 AM' },
                      { label: 'Updated by:', value: 'Maria Cohen' },
                    ].map(m => (
                      <div key={m.label} style={{ display: 'flex', gap: 4 }}>
                        <span style={{ font: '400 12px/16px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', letterSpacing: '0.2px' }}>{m.label}</span>
                        <span style={{ font: '400 12px/16px var(--font-sans)', color: 'var(--lyra-color-fg-default)', letterSpacing: '0.2px' }}>{m.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setSurveyDrawerOpen(true)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    height: 36, padding: '0 16px',
                    font: '500 14px/20px var(--font-sans)',
                    color: 'var(--lyra-color-fg-on-primary, white)',
                    background: 'var(--lyra-color-bg-primary, #166CCA)',
                    border: 'none',
                    borderRadius: 8, cursor: 'pointer', outline: 'none',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-primary)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-bg-primary, #166CCA)' }}
                >
                  <Search size={15} />
                  Select survey from library
                </button>
              )}
            </div>


            {/* Actions (optional) */}
            <div ref={actionsRef} style={{ border: '1px solid var(--lyra-color-border-subtle)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
              <SectionHeader
                label={<>Actions <span style={{ fontWeight: 400, lineHeight: '24px', color: 'var(--lyra-color-fg-secondary)' }}>(optional)</span></>}
                infoTip="Optional. Who gets notified when a response needs attention. Pick a reusable set from the library."
                status="warn"
              />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                <button
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    height: 36, padding: '0 16px',
                    font: '500 14px/20px var(--font-sans)',
                    color: 'var(--lyra-color-fg-action, #677280)',
                    background: 'var(--lyra-color-bg-secondary, white)',
                    border: 'none',
                    outline: '1px solid var(--lyra-color-border-soft)',
                    outlineOffset: -1,
                    borderRadius: 8, cursor: 'pointer',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-bg-secondary, white)' }}
                >
                  <Search size={14} style={{ color: 'var(--lyra-color-fg-action, #66717F)', flexShrink: 0 }} />
                  Select action set from library
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* ③ Right summary panel — edit mode only */}
        {editCampaign && (
          <div style={{ width: 224, flexShrink: 0, alignSelf: 'flex-start' }}>
            <div style={{
              background: 'var(--lyra-color-bg-surface-container-subtle, #FBFCFE)',
              borderRadius: 12,
              display: 'flex',
              flexDirection: 'column',
              padding: 16,
              gap: 16,
            }}>
              {/* Heading */}
              <div style={{ font: '500 16px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>Summary</div>

              {/* Updated on */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', flexShrink: 0 }}>Updated on</span>
                <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', textAlign: 'right' }}>May 12, 2026<br />10:55:06 AM</span>
              </div>

              {/* Updated by */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', flexShrink: 0 }}>Updated by</span>
                <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', textAlign: 'right' }}>Jaden Smith</span>
              </div>

              {/* Status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', flex: '1 1 0' }}>Status</span>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 32 }}>
                  <Power size={16} style={{
                    color: editCampaign.status === 'active'
                      ? 'var(--lyra-color-status-success-strong)'
                      : editCampaign.status === 'paused'
                      ? 'var(--lyra-color-status-warning-strong)'
                      : 'var(--lyra-color-fg-secondary)',
                  }} />
                  <span style={{
                    font: '500 14px/20px var(--font-sans)',
                    color: editCampaign.status === 'active'
                      ? 'var(--lyra-color-status-success-strong)'
                      : editCampaign.status === 'paused'
                      ? 'var(--lyra-color-status-warning-strong)'
                      : 'var(--lyra-color-fg-secondary)',
                  }}>
                    {editCampaign.status === 'active' ? 'Active' : editCampaign.status === 'paused' ? 'Inactive' : editCampaign.status === 'draft' ? 'Draft' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Survey picker drawer */}
      {surveyDrawerOpen && (
        <SurveyPickerDrawer
          currentId={form.surveyId}
          onClose={() => setSurveyDrawerOpen(false)}
          onSelect={id => { set('surveyId', id); setSurveyDrawerOpen(false) }}
        />
      )}

      {/* Theme picker drawer */}
      {themeDrawerOpen && (
        <ThemePickerDrawer
          currentId={form.themeId}
          onClose={() => setThemeDrawerOpen(false)}
          onSelect={id => { set('themeId', id); setThemeDrawerOpen(false) }}
        />
      )}

      {/* Theme detail drawer */}
      {themeDetailOpen && selectedTheme && (
        <ThemeDetailDrawer
          theme={selectedTheme}
          onClose={() => setThemeDetailOpen(false)}
        />
      )}

      {/* Deactivate confirmation modal */}
      {showDeactivateModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.24)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setShowDeactivateModal(false) }}
        >
          <div style={{ width: 400, background: 'var(--lyra-color-bg-surface-overlay)', borderRadius: 'var(--radius-lg)', boxShadow: '0px 20px 40px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg viewBox="0 0 16 16" width="16" height="16" fill="none" style={{ flexShrink: 0 }}>
                <path d="M8 1L15 14H1L8 1Z" fill="var(--lyra-color-status-warning-strong)" />
                <line x1="8" y1="6" x2="8" y2="10" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="8" cy="12" r="0.8" fill="white" />
              </svg>
              <span style={{ font: '500 16px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>Deactivate program?</span>
            </div>
            <div style={{ padding: '0 24px', font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>
              This will stop the program from sending surveys.<br />Are you sure you want to deactivate?
            </div>
            <div style={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={() => setShowDeactivateModal(false)}
                style={{ height: 36, minWidth: 80, padding: '0 16px', borderRadius: 'var(--radius-md)', border: 'none', outline: '1px solid var(--lyra-color-border-soft)', outlineOffset: -1, background: 'var(--lyra-color-bg-surface-base)', font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-action)', cursor: 'pointer' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-bg-surface-base)' }}
              >Cancel</button>
              <button
                onClick={() => { setShowDeactivateModal(false); onSave('draft') }}
                style={{ height: 36, minWidth: 80, padding: '0 16px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--lyra-color-bg-destructive)', font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-on-primary)', cursor: 'pointer' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.9' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
              >Deactivate</button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel confirmation modal */}
      {showCancelModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.24)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setShowCancelModal(false) }}
        >
          <div style={{ width: 400, background: 'var(--lyra-color-bg-surface-overlay)', borderRadius: 'var(--radius-lg)', boxShadow: '0px 20px 40px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg viewBox="0 0 16 16" width="16" height="16" fill="none" style={{ flexShrink: 0 }}>
                <path d="M8 1L15 14H1L8 1Z" fill="var(--lyra-color-status-warning-strong)" />
                <line x1="8" y1="6" x2="8" y2="10" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="8" cy="12" r="0.8" fill="white" />
              </svg>
              <span style={{ font: '500 16px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>Cancel program?</span>
            </div>
            {/* Body */}
            <div style={{ padding: '0 24px', font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>
              All changes will be lost<br />Are you sure you want to exit without saving?
            </div>
            {/* Footer */}
            <div style={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={() => setShowCancelModal(false)}
                style={{ height: 36, minWidth: 80, padding: '0 16px', borderRadius: 'var(--radius-md)', border: 'none', outline: '1px solid var(--lyra-color-border-soft)', outlineOffset: -1, background: 'var(--lyra-color-bg-surface-base)', font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-action)', cursor: 'pointer' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-bg-surface-base)' }}
              >No</button>
              <button
                onClick={onCancel}
                style={{ height: 36, minWidth: 80, padding: '0 16px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--lyra-color-bg-destructive)', font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-on-primary)', cursor: 'pointer' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.9' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
              >Yes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
