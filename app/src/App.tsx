import { Fragment, useState, useRef, useEffect } from 'react'
import './styles/tokens.css'
import './styles/prototype.css'

// Layout
import { AppShell } from './components/layout/AppShell'
import { TopBar } from './components/layout/TopBar'
import { LeftNav } from './components/layout/LeftNav'

// App-wide UI
import { AppSwitcher } from './components/AppSwitcher'
import { Toast } from './components/ui/Toast'
import { useToast } from './hooks/useToast'

// Pages
import { LandingPage } from './pages/LandingPage'
import { AdminPage } from './pages/AdminPage'
import { AnalysisPage } from './pages/AnalysisPage'
import { CohortPage } from './pages/CohortPage'
import { InteractionPage } from './pages/InteractionPage'
import { SurveyFlowPage } from './pages/SurveyFlowPage'
import { CampaignMonitorPage } from './pages/CampaignMonitorPage'
import { SurveyCampaignMonitoringPage } from './pages/SurveyCampaignMonitoringPage'
import { SurveyDetailPage } from './pages/SurveyDetailPage'
import { SurveyTemplatesPage } from './pages/SurveyTemplatesPage'
import { OntologyStudioPage } from './pages/OntologyStudioPage'

// Campaign components
import { SurveyCampaignsGrid } from './components/campaigns/SurveyCampaignsGrid'
import { CampaignDetail } from './components/campaigns/CampaignDetail'
import { CreateCampaign } from './components/campaigns/CreateCampaign'

// Feedback Intelligence domain components
import { CampaignInsightDashboard } from './components/feedback-intelligence/CampaignInsightDashboard'
import { FeedbackIntelligenceDashboard } from './components/feedback-intelligence/FeedbackIntelligenceDashboard'

// Icons (used by stat cards and inline components)
import {
  TrendingUp,
  Minus,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  Activity,
  Megaphone,
  FileText,
  Network,
} from 'lucide-react'

// Data
import { getCampaignById, CAMPAIGNS } from './lib/campaigns'
import type { Campaign as LibCampaign } from './lib/campaigns'
import { getSurveyById } from './lib/surveys'
import type { NavItem, Campaign as TypesCampaign, SurveyDesignTemplate } from './types'

/* ======================================================================
   FI_NAV / WFM_NAV — matching prototype.html exactly (lines 12614–12629)
   ====================================================================== */

const FI_NAV: NavItem[] = [
  { type: 'leaf',  icon: 'dashboard', label: 'Dashboard',          key: 'dashboard' },
  { type: 'group', icon: 'campaigns', label: 'Campaign Management', expanded: true, children: [
    { type: 'leaf', label: 'Survey Campaigns', key: 'campaigns' },
    { type: 'leaf', label: 'Survey Templates', key: 'designs' },
  ]},
  { type: 'leaf',  icon: 'topics',    label: 'Ontology',            key: 'ontology' },
]

const WFM_NAV: NavItem[] = [
  { type: 'leaf',  icon: 'campaigns', label: 'Schedule Manager' },
  { type: 'leaf',  icon: 'alerts',    label: 'Real Time Adherence', active: true },
  { type: 'leaf',  icon: 'topics',    label: 'Intraday Manager' },
  { type: 'group', icon: 'insights',  label: 'Forecasting' },
  { type: 'group', icon: 'settings',  label: 'Setup' },
]

/* ======================================================================
   Route shape
   ====================================================================== */

type FiSection = 'dashboard' | 'campaigns' | 'designs' | 'ontology'
type ViewMode  = 'list' | 'create' | 'edit' | 'detail' | 'detail-design'

interface Route {
  product:       'fi' | 'wfm'
  section:       string
  view:          ViewMode
  template?:     Record<string, unknown> | null
  editCampaign?: TypesCampaign | null
  campaign?:     TypesCampaign | null
  design?:       SurveyDesignTemplate | null
}

/* ======================================================================
   Stat card — kept from original App.tsx
   ====================================================================== */
function StatCard({
  title,
  value,
  subtitle,
  borderColor = 'var(--lyra-color-status-success-strong)',
  alert,
}: {
  title: string
  value: string
  subtitle: string
  borderColor?: string
  alert?: { delta: string }
}) {
  const isAlert = !!alert
  return (
    <div
      className="rounded-lg p-6 overflow-hidden relative flex flex-col min-h-[160px] justify-center"
      style={{
        backgroundColor: 'var(--lyra-color-bg-surface-base)',
        border: isAlert ? `1px solid ${borderColor}` : '1px solid var(--lyra-color-border-soft)',
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: borderColor }} />
      <div className="text-sm font-medium" style={{ color: 'var(--lyra-color-fg-secondary)' }}>{title}</div>
      <div className="mt-2 flex items-baseline gap-3">
        <span
          className="text-5xl tracking-tight"
          style={{
            color:      isAlert ? 'var(--lyra-color-status-critical-strong)' : 'var(--lyra-color-fg-default)',
            fontWeight: isAlert ? '400' : '600',
          }}
        >
          {value}
        </span>
        {isAlert && (
          <span className="text-sm font-medium" style={{ color: 'var(--lyra-color-status-critical-strong)' }}>
            {alert.delta}
          </span>
        )}
      </div>
      <div className="mt-2 text-sm italic" style={{ color: 'var(--lyra-color-fg-secondary)' }}>{subtitle}</div>
    </div>
  )
}

/* ======================================================================
   PatternAlertBar
   ====================================================================== */
function PatternAlertBar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div
      className="rounded-lg border px-5 py-4 flex items-center"
      style={{
        backgroundColor: 'var(--lyra-color-bg-surface-base)',
        borderColor: 'var(--lyra-color-status-critical-strong)',
      }}
    >
      <div className="flex items-start gap-2.5 flex-1">
        <Sparkles className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--lyra-color-status-critical-strong)' }} />
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.05em]" style={{ color: 'var(--lyra-color-status-critical-strong)' }}>
            CROSS-INTENT FRICTION DETECTED
          </div>
          <div className="text-sm font-semibold mt-1" style={{ color: 'var(--lyra-color-fg-default)' }}>
            Customers are rating agents low for friction the agents didn't cause.
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--lyra-color-fg-secondary)' }}>
            3 billing-flow intents · 1,343 customers affected by handoff repetition · ↑15% week-over-week
          </div>
        </div>
      </div>
      <button
        onClick={onNavigate}
        className="inline-flex items-center rounded-lg border px-3.5 py-1.5 text-xs font-medium transition-colors flex-shrink-0 cursor-pointer"
        style={{
          borderColor:     'var(--lyra-color-status-critical-strong)',
          backgroundColor: 'var(--lyra-color-bg-surface-base)',
          color:           'var(--lyra-color-fg-default)',
        }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--lyra-color-status-critical-subtle)')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--lyra-color-bg-surface-base)')}
      >
        see analysis →
      </button>
    </div>
  )
}

/* ======================================================================
   Intent Trending Table
   ====================================================================== */
type TrendRow = {
  intent:     string
  category:   string
  volume:     string
  volumeNote?: string
  avgVU:      string
  trend:      { type: 'up'; value: string } | { type: 'flat' } | { type: 'sentiment'; value: string }
  linked?:    boolean
  friction?:  boolean
}

const INTENT_ROWS: TrendRow[] = [
  { intent: 'Refund Processing',       category: 'Billing',      volume: '1,420', avgVU: '34', trend: { type: 'up', value: '+18%' }, linked: true },
  { intent: 'Billing Dispute',         category: 'Billing',      volume: '1,210', avgVU: '32', trend: { type: 'up', value: '+12%' }, linked: true },
  { intent: 'Call Transfer Impact',    category: 'Tech Support', volume: '890', volumeNote: '(flat)', avgVU: '29', trend: { type: 'sentiment', value: '-29%' }, linked: true, friction: true },
  { intent: 'Payment Gateway Timeout', category: 'Other',        volume: '210', avgVU: '35', trend: { type: 'flat' } },
]

function TrendCell({ trend, linked }: { trend: TrendRow['trend']; linked?: boolean }) {
  if (trend.type === 'up') {
    const color = linked ? 'var(--lyra-color-status-critical-strong)' : 'var(--lyra-color-status-success-strong)'
    return (
      <span className="inline-flex items-center gap-1" style={{ color }}>
        <TrendingUp className="h-3.5 w-3.5" />
        <span className="text-sm">{trend.value}</span>
      </span>
    )
  }
  if (trend.type === 'sentiment') {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
        style={{ backgroundColor: 'var(--lyra-color-status-critical-subtle)', color: 'var(--lyra-color-status-critical-strong)' }}
      >
        <AlertTriangle className="h-3 w-3" />
        <span>FI signal {trend.value}</span>
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1" style={{ color: 'var(--lyra-color-fg-disabled)' }}>
      <Minus className="h-3.5 w-3.5" />
      <span className="text-sm">Flat</span>
    </span>
  )
}

function IntentTrendingTable() {
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ border: '1px solid var(--lyra-color-border-soft)', backgroundColor: 'var(--lyra-color-bg-surface-base)' }}
    >
      <div className="flex items-center justify-between px-5 py-4">
        <h3 className="text-base font-semibold" style={{ color: 'var(--lyra-color-fg-default)' }}>
          Intent trending by VU - Last 7 days
        </h3>
        <span className="text-xs" style={{ color: 'var(--lyra-color-fg-disabled)' }}>VU ≥ 32 Trend</span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr
            style={{
              borderTop:       '1px solid var(--lyra-color-border-subtle)',
              borderBottom:    '1px solid var(--lyra-color-border-subtle)',
              backgroundColor: 'var(--lyra-color-bg-surface-shell)',
            }}
          >
            <th className="px-5 py-3 text-left font-medium" style={{ color: 'var(--lyra-color-fg-secondary)' }}>Intent</th>
            <th className="px-5 py-3 text-left font-medium" style={{ color: 'var(--lyra-color-fg-secondary)' }}>Volume</th>
            <th className="px-5 py-3 text-left font-medium" style={{ color: 'var(--lyra-color-fg-secondary)' }}>Avg VU</th>
            <th className="px-5 py-3 text-left font-medium" style={{ color: 'var(--lyra-color-fg-secondary)' }}>Trend</th>
          </tr>
        </thead>
        <tbody>
          {INTENT_ROWS.map((row, i) => (
            <tr
              key={i}
              className="last:border-b-0"
              style={{ borderBottom: '1px solid var(--lyra-color-border-subtle)' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--lyra-color-bg-surface-shell)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
            >
              <td className="px-5 py-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--lyra-color-fg-default)' }}>{row.intent}</span>
                  <span className="text-sm" style={{ color: 'var(--lyra-color-fg-disabled)' }}>·</span>
                  <span className="text-sm" style={{ color: 'var(--lyra-color-fg-secondary)' }}>{row.category}</span>
                  {row.linked && (
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={{ backgroundColor: 'var(--lyra-color-status-warning-subtle)', color: 'var(--lyra-color-status-warning-strong)' }}
                    >
                      linked
                    </span>
                  )}
                  {row.friction && (
                    <span
                      className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={{ backgroundColor: 'var(--lyra-color-status-critical-subtle)', color: 'var(--lyra-color-status-critical-strong)' }}
                    >
                      <AlertTriangle className="h-2.5 w-2.5" /> friction
                    </span>
                  )}
                </div>
              </td>
              <td className="px-5 py-4 text-sm" style={{ color: 'var(--lyra-color-fg-secondary)' }}>
                <div>{row.volume}</div>
                {row.volumeNote && (
                  <div className="text-xs" style={{ color: 'var(--lyra-color-fg-disabled)' }}>{row.volumeNote}</div>
                )}
              </td>
              <td className="px-5 py-4 text-sm" style={{ color: 'var(--lyra-color-fg-secondary)' }}>{row.avgVU}</td>
              <td className="px-5 py-4"><TrendCell trend={row.trend} linked={row.linked} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ======================================================================
   Intent Intelligence Health heatmap
   ====================================================================== */
type HeatCell = { value: string; pct?: number; alert?: boolean }

const HEAT_COLS = [
  { title: 'Transfer',   sub: 'bounced between agents?' },
  { title: 'Hold',       sub: 'kept waiting in-call?' },
  { title: 'Escalation', sub: 'raised above the agent?' },
  { title: 'Repeat',     sub: 'recurring contact?' },
  { title: 'No action',  sub: 'resolved smoothly?' },
]

const HEAT_ROWS: { label: string; cells: HeatCell[] }[] = [
  { label: 'Billing Dispute',    cells: [{ value: '75%', pct: 75 }, { value: '64%', pct: 64 }, { value: '71%', pct: 71 }, { value: '52%', pct: 52 }, { value: '38%', pct: 38 }] },
  { label: 'Refund Processing',  cells: [{ value: '73%', pct: 73 }, { value: '61%', pct: 61 }, { value: '68%', pct: 68 }, { value: '49%', pct: 49 }, { value: 'Low volume' }] },
  { label: 'Tech Support',       cells: [{ value: '62%', pct: 62 }, { value: '54%', pct: 54 }, { value: '70%', pct: 70 }, { value: '58%', pct: 58 }, { value: '31%', pct: 31 }] },
  { label: 'General Inquiry',    cells: [{ value: '31%', pct: 31 }, { value: '28%', pct: 28 }, { value: 'Low volume' }, { value: 'Low volume' }, { value: '19%', pct: 19, alert: true }] },
]

function heatCellStyle(cell: HeatCell): { bg: string; fg: string } {
  if (cell.alert) return { bg: 'var(--lyra-color-status-critical-subtle)', fg: 'var(--lyra-color-status-critical-strong)' }
  if (cell.pct === undefined) return { bg: 'var(--lyra-color-status-info-subtle)', fg: 'var(--lyra-color-fg-disabled)' }
  if (cell.pct >= 70) return { bg: 'var(--lyra-color-fg-active-strong)', fg: 'var(--lyra-color-fg-inverse)' }
  if (cell.pct >= 60) return { bg: 'var(--lyra-brand-500)', fg: 'var(--lyra-color-fg-inverse)' }
  if (cell.pct >= 50) return { bg: 'var(--lyra-brand-300)', fg: 'var(--lyra-color-fg-inverse)' }
  if (cell.pct >= 40) return { bg: 'var(--lyra-brand-200)', fg: 'var(--lyra-color-fg-default)' }
  if (cell.pct >= 30) return { bg: 'var(--lyra-brand-100)', fg: 'var(--lyra-color-fg-default)' }
  return { bg: 'var(--lyra-brand-50)', fg: 'var(--lyra-color-fg-default)' }
}

function HealthHeatmapCard() {
  return (
    <div
      className="rounded-xl p-4"
      style={{ border: '1px solid var(--lyra-color-border-subtle)', backgroundColor: 'var(--lyra-color-bg-surface-base)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--lyra-color-fg-default)' }}>Intent Intelligence Health</h3>
        <span className="text-xs" style={{ color: 'var(--lyra-color-fg-disabled)' }}>Last 7 days · VU ≥ 32 confirmed</span>
      </div>
      <div className="grid gap-1" style={{ gridTemplateColumns: '180px repeat(5, 1fr)' }}>
        <div />
        {HEAT_COLS.map((col, i) => (
          <div key={i} className="px-3 py-2">
            <div className="text-sm font-medium" style={{ color: 'var(--lyra-color-fg-default)' }}>{col.title}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--lyra-color-fg-disabled)' }}>{col.sub}</div>
          </div>
        ))}
        {HEAT_ROWS.map((row, ri) => (
          <Fragment key={ri}>
            <div className="flex items-center px-2 text-sm" style={{ color: 'var(--lyra-color-fg-secondary)' }}>{row.label}</div>
            {row.cells.map((cell, ci) => {
              const { bg, fg } = heatCellStyle(cell)
              return (
                <div
                  key={ci}
                  className="flex items-center justify-center h-11 rounded text-sm font-medium"
                  style={{ backgroundColor: bg, color: fg }}
                >
                  {cell.value}
                </div>
              )
            })}
          </Fragment>
        ))}
      </div>
    </div>
  )
}

/* ======================================================================
   Recommendation cards
   ====================================================================== */
type Metric    = { value: string; label: string }
type BadgeKind = 'red' | 'green' | 'orange'
type Rec = {
  num:         number
  title:       string
  subtitle:    string
  description: string
  metrics:     Metric[]
  badge:       { text: string; kind: BadgeKind }
  cta:         string
}

const RECS: Rec[] = [
  {
    num: 1,
    title: 'Tighten the campaign filter',
    subtitle: 'require an Action signal',
    description:
      'No-action interactions convert at 19–38%; interactions with any Action signal convert at 49–75%. Adding "require ≥ 1 Action" lifts expected conversion and frees wasted survey sends.',
    metrics: [
      { value: '+34 pts', label: 'Expected\nconversion lift' },
      { value: '~720',    label: 'Sends saved\nper week' },
      { value: '2,140',   label: 'Look-a-likes,\n8 campaigns' },
    ],
    badge: { text: 'High impact · this week', kind: 'red' },
    cta: 'Apply to all campaigns',
  },
  {
    num: 2,
    title: 'Always sample',
    subtitle: 'Tech Support × Escalation',
    description:
      'Escalated tech tickets convert at 70% with high validation alignment. Drop random sampling on this combo and switch to "always include" priority sampling.',
    metrics: [
      { value: '+180', label: 'Confirmed signals /\nweek' },
      { value: '70%',  label: 'Conversion on\ncombo' },
      { value: '94%',  label: 'Validation\nalignment' },
    ],
    badge: { text: 'High value · Low effort', kind: 'green' },
    cta: 'Promote to priority',
  },
  {
    num: 3,
    title: 'General Inquiry is too vague ,',
    subtitle: 'split or pause',
    description:
      'All cells score 19–31%. The category likely conflates several real intents. Re-enrich Telco-tuned v4 (Account Status, Service Hours, Pricing) — or pause it until split.',
    metrics: [
      { value: '18%', label: 'Of survey\nvolume' },
      { value: '6%',  label: 'Of confirmed\nsignals' },
      { value: '3',   label: 'Likely\nsub-intents' },
    ],
    badge: { text: 'Clean up · planing needed', kind: 'orange' },
    cta: 'Re-enrich model',
  },
]

function badgeStyles(kind: BadgeKind): { backgroundColor: string; color: string } {
  switch (kind) {
    case 'red':    return { backgroundColor: 'var(--lyra-color-status-critical-subtle)', color: 'var(--lyra-color-status-critical-strong)' }
    case 'green':  return { backgroundColor: 'var(--lyra-color-status-success-subtle)',  color: 'var(--lyra-color-status-success-strong)' }
    case 'orange': return { backgroundColor: 'var(--lyra-color-status-warning-subtle)',  color: 'var(--lyra-color-status-warning-strong)' }
  }
}

function RecommendationCard({ rec }: { rec: Rec }) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col"
      style={{ border: '1px solid var(--lyra-color-border-subtle)', backgroundColor: 'var(--lyra-color-bg-surface-base)' }}
    >
      <div
        className="rounded-lg px-3 py-3 mb-3 flex items-center gap-3"
        style={{ backgroundColor: 'var(--lyra-color-bg-surface-shell)' }}
      >
        <div
          className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium"
          style={{ backgroundColor: 'var(--lyra-color-bg-surface-base)', border: '1px solid var(--lyra-color-border-soft)', color: 'var(--lyra-color-fg-secondary)' }}
        >
          {rec.num}
        </div>
        <div className="leading-tight">
          <div className="text-sm font-medium" style={{ color: 'var(--lyra-color-fg-default)' }}>{rec.title}</div>
          <div className="text-sm" style={{ color: 'var(--lyra-color-fg-secondary)' }}>{rec.subtitle}</div>
        </div>
      </div>
      <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--lyra-color-fg-secondary)' }}>{rec.description}</p>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {rec.metrics.map((m, i) => (
          <div key={i}>
            <div className="text-xl font-semibold" style={{ color: 'var(--lyra-color-fg-default)' }}>{m.value}</div>
            <div className="text-xs whitespace-pre-line mt-0.5" style={{ color: 'var(--lyra-color-fg-secondary)' }}>{m.label}</div>
          </div>
        ))}
      </div>
      <div className="mt-auto flex items-center justify-between">
        <span
          className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
          style={badgeStyles(rec.badge.kind)}
        >
          {rec.badge.text}
        </span>
        <button
          className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium outline-none focus:outline-none"
          style={{ borderColor: 'var(--lyra-color-border-soft)', backgroundColor: 'var(--lyra-color-bg-surface-base)', color: 'var(--lyra-color-fg-secondary)' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--lyra-color-bg-surface-shell)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--lyra-color-bg-surface-base)')}
        >
          {rec.cta}
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}

function RecommendationsSection() {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--lyra-color-fg-default)' }}>What you should do about it</h3>
        <span className="text-xs" style={{ color: 'var(--lyra-color-fg-disabled)' }}>3 recommendations · ranked by impact</span>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {RECS.map(rec => (
          <RecommendationCard key={rec.num} rec={rec} />
        ))}
      </div>
    </div>
  )
}

/* ======================================================================
   WFM Placeholder — mirrors prototype.html WFMPlaceholder component
   ====================================================================== */
function WFMPlaceholder({ onOpenSwitcher }: { onOpenSwitcher: () => void }) {
  return (
    <div className="pane">
      <div className="pane-head">
        <h1>Real Time Adherence</h1>
        <div className="head-actions">
          <button className="btn">Export</button>
        </div>
      </div>
      <div
        style={{
          padding: '0 var(--space-6) var(--space-6)',
          color: 'var(--lyra-slate-500)',
          font: '400 13px/var(--space-5) Inter',
        }}
      >
        <div
          style={{
            background:   'var(--lyra-color-bg-surface-base)',
            border:       '1px dashed rgba(0,0,0,0.16)',
            borderRadius: 10,
            padding:      32,
            textAlign:    'center',
          }}
        >
          <div
            style={{
              font:         '500 16px/24px Inter',
              color:        'var(--lyra-slate-900)',
              marginBottom: 6,
            }}
          >
            Workforce Management
          </div>
          <p style={{ maxWidth: 520, margin: '0 auto var(--space-4)' }}>
            This is the existing WFM surface. Open the app switcher to jump into{' '}
            <strong style={{ color: 'var(--lyra-slate-900)' }}>Feedback Intelligence</strong>{' '}
            — it lives under Workforce Engagement and is marked NEW.
          </p>
          <button className="btn primary" onClick={onOpenSwitcher}>
            Open app switcher
          </button>
        </div>
      </div>
    </div>
  )
}

/* ======================================================================
   App — main router
   ====================================================================== */

export default function App() {
  // ---- Embed mode (URL params) ----
  const _params =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams()
  const EMBED         = _params.get('embed')
  const EMBED_SECTION = _params.get('section')
  const HIDE_TOPBAR   = EMBED === 'topbar' || EMBED === 'full'
  const HIDE_NAV      = EMBED === 'full'

  // ---- Route state machine (matches prototype.html App()) ----
  const [route, setRoute] = useState<Route>({
    product:     'fi',
    section:     EMBED_SECTION || 'dashboard',
    view:        'list',
    template:    null,
    editCampaign: null,
    campaign:    null,
    design:      null,
  })

  const [switcherOpen,   setSwitcherOpen]   = useState(false)
  const [navMinimized,   setNavMinimized]   = useState(false)
  const [newCampaigns,   setNewCampaigns]   = useState<TypesCampaign[]>([])
  const [newDesigns,     setNewDesigns]     = useState<SurveyDesignTemplate[]>([])

  // Toast (auto-clear handled by useToast)
  const { toast, setToast } = useToast()

  // Leave-guard ref for ontology navigation guard (window.__FI_LEAVE_GUARD__)
  const leaveGuardRef = useRef<((action: () => void) => void) | null>(null)

  // postMessage listener — ?embed=full host drives section changes
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.data && e.data.type === 'fi-navigate' && e.data.section) {
        setRoute(r => ({ ...r, section: e.data.section as string, view: 'list' }))
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // ---- Legacy flow state (kept for backward compatibility) ----
  const [flow, setFlow] = useState<'admin' | 'landing' | 'feedback' | 'agent' | 'prototype'>('feedback')
  const [page, setPage] = useState<
    'campaign-portfolio' | 'dashboard' | 'analysis' | 'cohort' | 'interaction' |
    'campaign-monitor'  | 'survey-detail' | 'campaign-insight'
  >('campaign-portfolio')
  const [fiSection, setFiSection] = useState<FiSection>('campaigns')
  const protoIframeRef = useRef<HTMLIFrameElement>(null)
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(CAMPAIGNS[0].id)
  const selectedCampaign = getCampaignById(selectedCampaignId)
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null)
  const selectedSurvey = selectedSurveyId ? getSurveyById(selectedSurveyId) : undefined

  // App-switcher routing for legacy admin/wfm flows
  const handleAppSwitch = (appLabel: string) => {
    if (appLabel === 'Feedback Intelligence') {
      setFlow('feedback')
      setFiSection('dashboard')
      setPage('campaign-portfolio')
      setRoute(r => ({ ...r, product: 'fi', section: 'dashboard', view: 'list' }))
    } else if (appLabel === 'Admin') {
      setFlow('admin')
    }
  }

  // ---- Build nav tree with active states ----
  const buildFiNav = (): NavItem[] =>
    FI_NAV.map(n => {
      if (n.type === 'group') {
        const children = (n.children ?? []).map(c => ({
          ...c,
          active: c.key === route.section,
        }))
        const anyActive = children.some(c => c.active)
        return { ...n, children, expanded: anyActive || n.expanded }
      }
      const extra: Partial<NavItem> = n.key === 'ontology' ? { hasUpdates: true } : {}
      return { ...n, active: n.key === route.section, ...extra }
    })

  // ---- LeftNav leaf click handler (routes through leaveGuardRef) ----
  function handleLeafClick(item: NavItem) {
    if (!item.key) return
    const navigate = () =>
      setRoute({ product: 'fi', section: item.key!, view: 'list', template: null, editCampaign: null, campaign: null, design: null })
    const guard = leaveGuardRef.current ?? (window as Window & { __FI_LEAVE_GUARD__?: (fn: () => void) => void }).__FI_LEAVE_GUARD__
    if (typeof guard === 'function') {
      guard(navigate)
    } else {
      navigate()
    }
  }

  // ---- Campaign section content ----
  function renderCampaignContent() {
    if (route.view === 'create') {
      return (
        <CreateCampaign
          template={route.template ?? null}
          editCampaign={route.editCampaign ?? null}
          onCancel={() => setRoute({ ...route, view: 'list', editCampaign: null })}
          onSave={(c) => {
            const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            setNewCampaigns(prev => [
              { ...(c as unknown as TypesCampaign), id: Date.now(), created: today, updated: today, owner: 'Maria Cohen', isNew: true } as TypesCampaign,
              ...prev,
            ])
            setToast({
              msg: c.status === 'active'
                ? `Campaign "${(c as { name?: string }).name}" created and activated successfully.`
                : `Campaign "${(c as { name?: string }).name}" saved as draft.`,
            })
            setRoute({ ...route, view: 'list', editCampaign: null })
          }}
        />
      )
    }

    if (route.view === 'detail' && route.campaign) {
      return (
        <CampaignDetail
          campaign={route.campaign}
          onBack={() => setRoute({ ...route, view: 'list', campaign: null })}
          onEdit={(c) => setRoute({ ...route, view: 'create', editCampaign: c })}
        />
      )
    }

    return (
      <SurveyCampaignsGrid
        onCreate={() => setRoute({ ...route, view: 'create' })}
        onOpen={(c) => setRoute({ ...route, view: 'detail', campaign: c })}
        onEdit={(c) => setRoute({ ...route, view: 'create', editCampaign: c })}
        newCampaigns={newCampaigns}
      />
    )
  }

  // ---- Top-level flow guards (kept for backward compatibility) ----
  if (flow === 'admin') return <AdminPage onAppSwitch={handleAppSwitch} />
  if (flow === 'landing') return <LandingPage onSelectFlow={(f) => setFlow(f)} />
  if (flow === 'prototype') {
    return (
      <div
        className="flex h-screen w-screen flex-col overflow-hidden"
        style={{ backgroundColor: 'var(--lyra-color-bg-surface-shell)' }}
      >
        <TopBar appName="Feedback Intelligence" onAppSwitch={handleAppSwitch} />
        <iframe
          src="./prototype.html?embed=topbar"
          title="Feedback Intelligence prototype"
          style={{ flex: 1, width: '100%', border: 0, display: 'block' }}
        />
      </div>
    )
  }
  if (flow === 'agent') return <SurveyFlowPage onBackToLanding={() => setFlow('landing')} />

  // Legacy drill-down pages (still reachable via FeedbackIntelligenceDashboard)
  if (page === 'survey-detail' && selectedSurvey) {
    return (
      <SurveyDetailPage
        survey={selectedSurvey}
        campaign={selectedCampaign}
        onBack={() => setPage('dashboard')}
      />
    )
  }
  if (page === 'campaign-monitor') {
    return <CampaignMonitorPage campaign={selectedCampaign} onBack={() => setPage('dashboard')} />
  }
  if (page === 'interaction') {
    return <InteractionPage onBack={() => setPage('cohort')} onBackToAnalysis={() => setPage('analysis')} />
  }
  if (page === 'cohort') {
    return <CohortPage onBack={() => setPage('analysis')} onOpenInteraction={() => setPage('interaction')} />
  }
  if (page === 'analysis') {
    return <AnalysisPage onBack={() => setPage('dashboard')} onOpenCohort={() => setPage('cohort')} />
  }

  // ---- WFM product shell ----
  if (route.product === 'wfm') {
    return (
      <div className="flex h-screen w-screen flex-col overflow-hidden" style={{ background: 'var(--lyra-color-bg-surface-shell)' }}>
        {!HIDE_TOPBAR && (
          <TopBar
            onAppSwitch={handleAppSwitch}
          />
        )}
        <div className="relative flex flex-1 overflow-hidden">
          {!HIDE_NAV && (
            <LeftNav
              items={WFM_NAV}
              minimized={navMinimized}
              onToggleMinimized={() => setNavMinimized(m => !m)}
            />
          )}
          <main className="flex flex-col flex-1 overflow-auto" style={{ background: 'var(--lyra-color-bg-surface-canvas)' }}>
            <div className="flex-1 m-4 md:m-6 rounded-xl overflow-hidden flex flex-col">
              <WFMPlaceholder onOpenSwitcher={() => setSwitcherOpen(true)} />
            </div>
          </main>
        </div>

        {switcherOpen && (
          <AppSwitcher
            currentProduct="wfm"
            onClose={() => setSwitcherOpen(false)}
            onNavigate={(p) => {
              setSwitcherOpen(false)
              if (p === 'fi') {
                setRoute({ product: 'fi', section: 'campaigns', view: 'list', template: null, editCampaign: null, campaign: null, design: null })
              }
            }}
          />
        )}
        <Toast toast={toast} onDismiss={() => setToast(null)} />
      </div>
    )
  }

  // ---- FI product shell ----
  const fiNav    = buildFiNav()
  const section  = route.section as FiSection

  const FI_TITLES: Record<FiSection, string> = {
    dashboard: page === 'campaign-portfolio'
      ? 'Operations Dashboard'
      : page === 'campaign-insight' && selectedCampaign
        ? `${selectedCampaign.name} · Campaign Insight`
        : selectedCampaign
          ? `${selectedCampaign.name} ${selectedCampaign.version}`
          : 'Feedback Intelligence Dashboard',
    campaigns: 'Survey Campaigns',
    designs:   'Survey Templates',
    ontology:  'Ontology Studio',
  }

  // ---- Render content for current section ----
  function renderFiContent() {
    if (section === 'dashboard') {
      // Legacy Operations Dashboard / Campaign FI detail
      if (page === 'campaign-portfolio') {
        return (
          <SurveyCampaignMonitoringPage
            onSelectCampaign={(id) => {
              setSelectedCampaignId(id)
              setPage('dashboard')
            }}
            onBackToAdmin={() => setFlow('admin')}
          />
        )
      }
      if (page === 'campaign-insight') {
        return (
          <div className="p-6 lg:px-8 flex-1" style={{ backgroundColor: 'var(--lyra-color-bg-surface-shell)' }}>
            <div className="flex items-center gap-1.5 text-xs mb-2">
              <button
                onClick={() => setPage('campaign-portfolio')}
                className="font-medium transition-colors outline-none focus:outline-none"
                style={{ color: 'var(--lyra-color-fg-secondary)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--lyra-color-fg-default)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--lyra-color-fg-secondary)')}
              >
                Operations Dashboard
              </button>
              <ChevronRight className="h-3 w-3" style={{ color: 'var(--lyra-color-fg-disabled)' }} />
              <button
                onClick={() => setPage('dashboard')}
                className="font-medium transition-colors outline-none focus:outline-none"
                style={{ color: 'var(--lyra-color-fg-secondary)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--lyra-color-fg-default)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--lyra-color-fg-secondary)')}
              >
                {selectedCampaign ? selectedCampaign.name : 'Campaign'}
              </button>
              <ChevronRight className="h-3 w-3" style={{ color: 'var(--lyra-color-fg-disabled)' }} />
              <span className="font-medium" style={{ color: 'var(--lyra-color-fg-default)' }}>Campaign Insight</span>
            </div>
            <div className="flex items-center justify-between mb-8 gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] mb-1" style={{ color: '#4E39A8' }}>
                  <Sparkles className="h-3 w-3" fill="#4E39A8" />
                  Campaign Insight
                </div>
                <h1 className="text-[28px] font-semibold leading-[1.2]" style={{ color: 'var(--lyra-color-fg-default)' }}>
                  {selectedCampaign ? selectedCampaign.name : 'Campaign Insight'}
                </h1>
              </div>
            </div>
            <CampaignInsightDashboard />
          </div>
        )
      }
      // Default: per-campaign FI dashboard
      return (
        <div className="p-6 lg:px-8 flex-1" style={{ backgroundColor: 'var(--lyra-color-bg-surface-shell)' }}>
          <div className="flex items-center gap-1.5 text-xs mb-2">
            <button
              onClick={() => setPage('campaign-portfolio')}
              className="font-medium transition-colors outline-none focus:outline-none"
              style={{ color: 'var(--lyra-color-fg-secondary)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--lyra-color-fg-default)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--lyra-color-fg-secondary)')}
            >
              Operations Dashboard
            </button>
            <ChevronRight className="h-3 w-3" style={{ color: 'var(--lyra-color-fg-disabled)' }} />
            <span className="font-medium" style={{ color: 'var(--lyra-color-fg-default)' }}>
              {selectedCampaign ? selectedCampaign.name : 'Campaign'}
            </span>
          </div>
          <div className="flex items-center justify-between mb-8 gap-4">
            <h1 className="text-[28px] font-semibold leading-[1.2]" style={{ color: 'var(--lyra-color-fg-default)' }}>
              {selectedCampaign ? selectedCampaign.name : 'Feedback Intelligence Dashboard'}
            </h1>
            <div className="flex items-center gap-4 flex-shrink-0">
              <button
                onClick={() => setPage('campaign-insight')}
                className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors outline-none focus:outline-none"
                style={{ borderColor: '#4E39A8', backgroundColor: 'var(--lyra-color-bg-ai)', color: '#4E39A8' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                <Sparkles className="h-3.5 w-3.5" fill="#4E39A8" />
                View Campaign Insight
              </button>
            </div>
          </div>
          <FeedbackIntelligenceDashboard
            campaign={selectedCampaign}
            onOpenSurvey={(id) => {
              setSelectedSurveyId(id)
              setPage('survey-detail')
            }}
          />
        </div>
      )
    }

    if (section === 'campaigns') {
      return renderCampaignContent()
    }

    if (section === 'designs') {
      return (
        <SurveyTemplatesPage
          newDesigns={newDesigns}
          onNewDesign={(d) => {
            const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            setNewDesigns(prev => [{ ...d, id: `new-${Date.now()}`, updated: today, owner: 'Maria Cohen', isNew: true }, ...prev])
            setToast({ msg: `Survey template "${d.name}" created successfully.` })
          }}
        />
      )
    }

    if (section === 'ontology') {
      return (
        <OntologyStudioPage
          onPublishSuccess={(modelName) =>
            setToast({ msg: `Ontology for "${modelName}" published successfully.`, duration: 5000 })
          }
        />
      )
    }

    // Fallback for unknown section
    return (
      <div className="pane">
        <div className="pane-head">
          <h1>{FI_NAV.find(n => n.key === section)?.label ?? ''}</h1>
        </div>
        <div
          style={{
            padding:   32,
            color:     'var(--lyra-slate-500)',
            font:      '400 14px/22px Inter',
            textAlign: 'center',
          }}
        >
          This area is part of Feedback Intelligence — wire-up coming after Survey Campaigns is reviewed.
        </div>
      </div>
    )
  }

  // ---- FI AppShell with LeftNav2 ----
  return (
    <AppShell
      title={FI_TITLES[section] ?? 'Feedback Intelligence'}
      breadcrumb={['Feedback Intelligence']}
      onAppSwitch={handleAppSwitch}
      navItems2={HIDE_NAV ? [] : fiNav}
      onLeafClick={handleLeafClick}
      hidePageHeader={section !== 'dashboard' || page !== 'campaign-portfolio'}
    >
      {/* Main section content */}
      {renderFiContent()}

      {/* App switcher overlay */}
      {switcherOpen && (
        <AppSwitcher
          currentProduct="fi"
          onClose={() => setSwitcherOpen(false)}
          onNavigate={(p) => {
            setSwitcherOpen(false)
            if (p === 'wfm') {
              setRoute({ product: 'wfm', section: 'rta', view: 'list', template: null, editCampaign: null, campaign: null, design: null })
            } else {
              setRoute({ product: 'fi', section: 'campaigns', view: 'list', template: null, editCampaign: null, campaign: null, design: null })
            }
          }}
        />
      )}

      {/* Toast notification */}
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </AppShell>
  )
}
