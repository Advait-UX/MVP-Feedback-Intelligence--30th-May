import { Fragment, useState } from 'react'
import { AppShell } from './components/layout/AppShell'
import { TopBar } from './components/layout/TopBar'
import { TrendingUp, Minus, ChevronRight, Sparkles, AlertTriangle, Megaphone, Library, LayoutGrid } from 'lucide-react'
import { LandingPage } from './pages/LandingPage'
import { AdminPage } from './pages/AdminPage'
import { AnalysisPage } from './pages/AnalysisPage'
import { CohortPage } from './pages/CohortPage'
import { InteractionPage } from './pages/InteractionPage'
import { SurveyFlowPage } from './pages/SurveyFlowPage'
import { CampaignMonitorPage } from './pages/CampaignMonitorPage'
import { ProgramsListPage } from './pages/ProgramsListPage'
import { ThemesListPage } from './pages/ThemesListPage'
import { ThemeDetailPage } from './pages/ThemeDetailPage'
import { AlertsListPage } from './pages/AlertsListPage'
import type { Alert } from './pages/AlertsListPage'
import { CreateAlertPage } from './pages/CreateAlertPage'
import { EditAlertPage } from './pages/EditAlertPage'
import { ProgramHealthPage } from './pages/ProgramHealthPage'
import { SurveyDetailPage } from './pages/SurveyDetailPage'
import { CampaignInsightDashboard } from './components/feedback-intelligence/CampaignInsightDashboard'
import { FeedbackIntelligenceDashboard } from './components/feedback-intelligence/FeedbackIntelligenceDashboard'
import { getCampaignById, CAMPAIGNS } from './lib/campaigns'
import { getSurveyById } from './lib/surveys'
import { CreateProgramPage } from './pages/CreateProgramPage'
import { SurveyTemplatesPage } from './pages/SurveyTemplatesPage'

/* -------------------- Stat card -------------------- */
function StatCard({ title, value, subtitle, borderColor = '#208337', alert }: {
  title: string
  value: string
  subtitle: string
  borderColor?: string
  alert?: { delta: string }
}) {
  const isAlert = !!alert
  const alertColor = '#e32926'
  const alertBg = '#fdeaea'

  return (
    <div
      className="rounded-lg p-6 overflow-hidden relative flex flex-col min-h-[160px] justify-center"
      style={{
        backgroundColor: '#FFFFFF',
        border: isAlert ? `1px solid ${borderColor}` : '1px solid #e5e7eb'
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: borderColor }} />
      <div className="text-sm font-medium text-[#475569]">{title}</div>
      <div className="mt-2 flex items-baseline gap-3">
        <span className="text-5xl tracking-tight" style={{ color: isAlert ? alertColor : '#0F172A', fontWeight: isAlert ? '400' : '700' }}>{value}</span>
        {isAlert && (
          <span className="text-[13px] font-medium" style={{ color: alertColor }}>{alert.delta}</span>
        )}
      </div>
      <div className="mt-2 text-[13px] italic text-[#64748B]">{subtitle}</div>
    </div>
  )
}

/* -------------------- Component 1: Pattern Alert Bar -------------------- */
function PatternAlertBar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="rounded-lg bg-white border border-[#e53935] px-5 py-4 flex items-center">
      <div className="flex items-start gap-2.5 flex-1">
        <Sparkles className="h-[18px] w-[18px] text-[#e32926] flex-shrink-0 mt-0.5" />
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#e32926]">CROSS-INTENT FRICTION DETECTED</div>
          <div className="text-sm font-semibold text-[#1f2937] mt-1">Customers are rating agents low for friction the agents didn't cause.</div>
          <div className="text-xs text-[#4b5563] mt-1">3 billing-flow intents · 1,343 customers affected by handoff repetition · ↑15% week-over-week</div>
        </div>
      </div>
      <button
        onClick={onNavigate}
        className="inline-flex items-center rounded-lg border border-[#e53935] bg-white px-3.5 py-1.5 text-xs font-medium text-[#1f2937] hover:bg-[#fdeaea] transition-colors flex-shrink-0 cursor-pointer"
      >
        see analysis →
      </button>
    </div>
  )
}

/* -------------------- Component 2: Intent Trending Table -------------------- */
type TrendRow = {
  intent: string
  category: string
  volume: string
  volumeNote?: string
  avgVU: string
  trend: { type: 'up'; value: string } | { type: 'flat' } | { type: 'sentiment'; value: string }
  linked?: boolean
  friction?: boolean
}

const INTENT_ROWS: TrendRow[] = [
  { intent: 'Refund Processing', category: 'Billing', volume: '1,420', avgVU: '34', trend: { type: 'up', value: '+18%' }, linked: true },
  { intent: 'Billing Dispute', category: 'Billing', volume: '1,210', avgVU: '32', trend: { type: 'up', value: '+12%' }, linked: true },
  { intent: 'Call Transfer Impact', category: 'Tech Support', volume: '890', volumeNote: '(flat)', avgVU: '29', trend: { type: 'sentiment', value: '-29%' }, linked: true, friction: true },
  { intent: 'Payment Gateway Timeout', category: 'Other', volume: '210', avgVU: '35', trend: { type: 'flat' } },
]

function TrendCell({ trend, linked }: { trend: TrendRow['trend']; linked?: boolean }) {
  if (trend.type === 'up') {
    const color = linked ? '#e32926' : '#208337'
    return (
      <span className="inline-flex items-center gap-1" style={{ color }}>
        <TrendingUp className="h-3.5 w-3.5" />
        <span className="text-sm">{trend.value}</span>
      </span>
    )
  }
  if (trend.type === 'sentiment') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fdeaea] px-2.5 py-1 text-[11px] font-semibold text-[#e32926]">
        <AlertTriangle className="h-3 w-3" />
        <span>FI signal {trend.value}</span>
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[#94A3B8]">
      <Minus className="h-3.5 w-3.5" />
      <span className="text-sm">Flat</span>
    </span>
  )
}

function IntentTrendingTable() {
  return (
    <div className="rounded-lg border border-[#E5E7EB] bg-white overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4">
        <h3 className="text-base font-semibold text-[#1E293B]">Intent trending by VU - Last 7 days</h3>
        <span className="text-xs text-[#94A3B8]">VU ≥ 32 Trend</span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-y border-[#F0F4F8] bg-[#F8FAFC]">
            <th className="px-5 py-3 text-left font-medium text-[#64748B]">Intent</th>
            <th className="px-5 py-3 text-left font-medium text-[#64748B]">Volume</th>
            <th className="px-5 py-3 text-left font-medium text-[#64748B]">Avg VU</th>
            <th className="px-5 py-3 text-left font-medium text-[#64748B]">Trend</th>
          </tr>
        </thead>
        <tbody>
          {INTENT_ROWS.map((row, i) => (
            <tr key={i} className="border-b border-[#F0F4F8] last:border-b-0 hover:bg-[#F8FAFC]">
              <td className="px-5 py-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#0F172A]">{row.intent}</span>
                  <span className="text-sm text-[#94A3B8]">·</span>
                  <span className="text-sm text-[#64748B]">{row.category}</span>
                  {row.linked && (
                    <span className="inline-flex items-center rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[11px] font-semibold text-[#92400E]">linked</span>
                  )}
                  {row.friction && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-[#FEE2E2] px-2 py-0.5 text-[11px] font-semibold text-[#991B1B]">
                      <AlertTriangle className="h-2.5 w-2.5" /> friction
                    </span>
                  )}
                </div>
              </td>
              <td className="px-5 py-4 text-sm text-[#334155]">
                <div>{row.volume}</div>
                {row.volumeNote && <div className="text-[11px] text-[#94A3B8]">{row.volumeNote}</div>}
              </td>
              <td className="px-5 py-4 text-sm text-[#334155]">{row.avgVU}</td>
              <td className="px-5 py-4"><TrendCell trend={row.trend} linked={row.linked} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}



/* -------------------- Intent Intelligence Health heatmap -------------------- */
type HeatCell = { value: string; pct?: number; alert?: boolean }

const HEAT_COLS = [
  { title: 'Transfer',   sub: 'bounced between agents?' },
  { title: 'Hold',       sub: 'kept waiting in-call?' },
  { title: 'Escalation', sub: 'raised above the agent?' },
  { title: 'Repeat',     sub: 'recurring contact?' },
  { title: 'No action',  sub: 'resolved smoothly?' },
]

const HEAT_ROWS: { label: string; cells: HeatCell[] }[] = [
  {
    label: 'Billing Dispute',
    cells: [{ value: '75%', pct: 75 }, { value: '64%', pct: 64 }, { value: '71%', pct: 71 }, { value: '52%', pct: 52 }, { value: '38%', pct: 38 }],
  },
  {
    label: 'Refund Processing',
    cells: [{ value: '73%', pct: 73 }, { value: '61%', pct: 61 }, { value: '68%', pct: 68 }, { value: '49%', pct: 49 }, { value: 'Low volume' }],
  },
  {
    label: 'Tech Support',
    cells: [{ value: '62%', pct: 62 }, { value: '54%', pct: 54 }, { value: '70%', pct: 70 }, { value: '58%', pct: 58 }, { value: '31%', pct: 31 }],
  },
  {
    label: 'General Inquiry',
    cells: [{ value: '31%', pct: 31 }, { value: '28%', pct: 28 }, { value: 'Low volume' }, { value: 'Low volume' }, { value: '19%', pct: 19, alert: true }],
  },
]

function heatCellStyle(cell: HeatCell): { bg: string; fg: string } {
  if (cell.alert) return { bg: '#FEE4E2', fg: '#DC2626' }
  if (cell.pct === undefined) return { bg: '#EFF5FB', fg: '#94A3B8' }
  if (cell.pct >= 70) return { bg: '#1E6BC2', fg: '#FFFFFF' }
  if (cell.pct >= 60) return { bg: '#3D8AD9', fg: '#FFFFFF' }
  if (cell.pct >= 50) return { bg: '#7AB0E5', fg: '#FFFFFF' }
  if (cell.pct >= 40) return { bg: '#A8C9ED', fg: '#1E293B' }
  if (cell.pct >= 30) return { bg: '#C7DCF4', fg: '#1E293B' }
  return { bg: '#DDE9F8', fg: '#1E293B' }
}

function HealthHeatmapCard() {
  return (
    <div className="rounded-xl border border-[#F0F4F8] bg-white p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#1E293B]">Intent Intelligence Health</h3>
        <span className="text-xs text-[#94A3B8]">Last 7 days · VU ≥ 32 confirmed</span>
      </div>
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: '180px repeat(5, 1fr)' }}
      >
        {/* Empty top-left + column headers */}
        <div />
        {HEAT_COLS.map((col, i) => (
          <div key={i} className="px-3 py-2">
            <div className="text-sm font-medium text-[#1E293B]">{col.title}</div>
            <div className="text-xs text-[#94A3B8] mt-0.5">{col.sub}</div>
          </div>
        ))}

        {/* Rows */}
        {HEAT_ROWS.map((row, ri) => (
          <Fragment key={ri}>
            <div className="flex items-center px-2 text-sm text-[#334155]">{row.label}</div>
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

/* -------------------- Recommendation cards -------------------- */
type Metric = { value: string; label: string }
type BadgeKind = 'red' | 'green' | 'orange'
type Rec = {
  num: number
  title: string
  subtitle: string
  description: string
  metrics: Metric[]
  badge: { text: string; kind: BadgeKind }
  cta: string
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

function badgeClasses(kind: BadgeKind) {
  switch (kind) {
    case 'red':    return 'bg-[#FEE4E2] text-[#B42318]'
    case 'green':  return 'bg-[#DCFCE7] text-[#15803D]'
    case 'orange': return 'bg-[#FFEDD5] text-[#C2410C]'
  }
}

function RecommendationCard({ rec }: { rec: Rec }) {
  return (
    <div className="rounded-xl border border-[#F0F4F8] bg-white p-4 flex flex-col">
      {/* Header: number + title in subtle gray panel */}
      <div className="rounded-lg bg-[#F8FAFC] px-3 py-3 mb-3 flex items-center gap-3">
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center text-sm font-medium text-[#475569]">
          {rec.num}
        </div>
        <div className="leading-tight">
          <div className="text-sm font-medium text-[#1E293B]">{rec.title}</div>
          <div className="text-sm text-[#64748B]">{rec.subtitle}</div>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-[#475569] leading-relaxed mb-4">{rec.description}</p>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {rec.metrics.map((m, i) => (
          <div key={i}>
            <div className="text-xl font-semibold text-[#1E293B]">{m.value}</div>
            <div className="text-xs text-[#64748B] whitespace-pre-line mt-0.5">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Footer: badge + CTA */}
      <div className="mt-auto flex items-center justify-between">
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${badgeClasses(rec.badge.kind)}`}>
          {rec.badge.text}
        </span>
        <button className="inline-flex items-center gap-1 rounded-md border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-medium text-[#334155] hover:bg-[#F8FAFC] outline-none focus:outline-none">
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
        <h3 className="text-sm font-semibold text-[#1E293B]">What you should do about it</h3>
        <span className="text-xs text-[#94A3B8]">3 recommendations · ranked by impact</span>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {RECS.map(rec => (
          <RecommendationCard key={rec.num} rec={rec} />
        ))}
      </div>
    </div>
  )
}

/* -------------------- App -------------------- */
export default function App() {
  const [flow, setFlow] = useState<'admin' | 'landing' | 'feedback' | 'agent' | 'prototype'>('feedback')
  const [page, setPage] = useState<'campaign-portfolio' | 'dashboard' | 'analysis' | 'cohort' | 'interaction' | 'campaign-monitor' | 'survey-detail' | 'campaign-insight'>('campaign-portfolio')
  // Active section within the Feedback Intelligence shell (drives the sidebar)
  const [fiSection, setFiSection] = useState<'dashboard' | 'programs' | 'surveys' | 'themes' | 'alerts' | 'health'>('programs')
  // Selected campaign drives Level 2 and Level 3 scoping. Defaults to the
  // demo star performer so the campaign-context strip always has a value.
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(CAMPAIGNS[0].id)
  const selectedCampaign = getCampaignById(selectedCampaignId)
  // Selected survey drives the Survey Detail Level 3 page.
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null)
  const selectedSurvey = selectedSurveyId ? getSurveyById(selectedSurveyId) : undefined
  const [showWizard, setShowWizard] = useState(false)
  const [editCampaignId, setEditCampaignId] = useState<string | null>(null)
  const editCampaign = editCampaignId ? getCampaignById(editCampaignId) : undefined
  const [activatedProgram, setActivatedProgram] = useState<{ id: string; name: string; channels: string[] } | null>(null)
  const [draftedProgram, setDraftedProgram] = useState<{ id: string; name: string } | null>(null)
  const [savedProgram, setSavedProgram] = useState<{ id: string; name: string; editedBy: string; action?: 'deactivated' } | null>(null)
  const [themeId, setThemeId] = useState<string | null>(null)
  const [newThemeId, setNewThemeId] = useState<string | null>(null)
  const [showCreateAlert, setShowCreateAlert] = useState(false)
  const [activatedAlert, setActivatedAlert] = useState<{ name: string } | null>(null)
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null)
  const [savedAlert, setSavedAlert] = useState<{ id: string; name: string } | null>(null)

  // App-switcher routing (nice_world TopBar dropdown).
  const handleAppSwitch = (appLabel: string) => {
    if (appLabel === 'Feedback Intelligence') {
      setFlow('feedback')
      setFiSection('programs')
      setPage('campaign-portfolio')
    } else if (appLabel === 'Admin') setFlow('admin')
    // other apps: no-op
  }

  // Entry point — nice_world Admin page (Employees + WEM nav)
  if (flow === 'admin') {
    return <AdminPage onAppSwitch={handleAppSwitch} />
  }

  // Landing page (still reachable, no longer the entry)
  if (flow === 'landing') {
    return <LandingPage onSelectFlow={(selectedFlow) => setFlow(selectedFlow)} />
  }

  // Prototype flow — the full CXone prototype embedded inside the nice_world
  // shell. The host supplies the nice_world TopBar; the prototype renders its
  // own left nav + screens below it (chrome stripped via ?embed=topbar).
  if (flow === 'prototype') {
    return (
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#F8FAFC]">
        <TopBar
          appName="Feedback Intelligence"
          onAppSwitch={handleAppSwitch}
        />
        <iframe
          src={`./${__PROTO_FILE__}?embed=topbar`}
          title="Feedback Intelligence prototype"
          style={{ flex: 1, width: '100%', border: 0, display: 'block' }}
        />
      </div>
    )
  }

  // Agent flow - Survey Flow
  if (flow === 'agent') {
    return <SurveyFlowPage onBackToLanding={() => setFlow('landing')} />
  }

  // Feedback Intelligence flow
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
    return (
      <CampaignMonitorPage
        campaign={selectedCampaign}
        onBack={() => setPage('dashboard')}
      />
    )
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

  // Feedback Intelligence shell — one nice_world sidebar drives all sections.
  // Dashboard renders the native nice_world dashboard; the other three render
  // the prototype screens (own chrome hidden via ?embed=full).
  const FI_NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard',      icon: LayoutGrid },
    { id: 'programs',  label: 'Programs',        icon: Megaphone },
    {
      type: 'group' as const,
      id: 'library',
      label: 'Library',
      icon: Library,
      children: [
        { id: 'surveys', label: 'Surveys' },
        { id: 'themes',  label: 'Themes' },
        { id: 'alerts',  label: 'Alerts' },
      ],
    },
  ]
  const FI_TITLES: Record<typeof fiSection, string> = {
    dashboard: 'Dashboard',
    programs: page === 'campaign-portfolio'
      ? 'Programs'
      : page === 'campaign-insight' && selectedCampaign
      ? `${selectedCampaign.name} · Insight`
      : selectedCampaign
      ? `${selectedCampaign.name} ${selectedCampaign.version}`
      : 'Programs',
    surveys: 'Surveys',
    themes:  'Themes',
    alerts:  'Alerts',
    health:  'Program health',
  }

  return (
    <AppShell
      title={FI_TITLES[fiSection]}
      breadcrumb={['Feedback Management']}
      onAppSwitch={handleAppSwitch}
      navItems={FI_NAV_ITEMS}
      activeNav={fiSection}
      hidePageHeader={true}
      onNavSelect={(id) => {
        setFiSection(id as typeof fiSection)
        // Clicking Programs always returns to the portfolio top-level
        if (id === 'programs') { setPage('campaign-portfolio'); setShowWizard(false); setEditCampaignId(null) }
        if (id === 'dashboard') setPage('campaign-portfolio')
        // Clicking Themes from within a detail view returns to the grid
        if (id === 'themes') setThemeId(null)
      }}
    >
      {fiSection === 'programs' ? (
        showWizard ? (
          <CreateProgramPage
            key="create-program-new"
            onCancel={() => setShowWizard(false)}
            onSave={(status, data) => {
              if (status === 'active' && data) {
                setActivatedProgram({ id: `new-${Date.now()}`, name: data.name, channels: data.channels })
              } else if (status === 'draft' && data) {
                setDraftedProgram({ id: `draft-${Date.now()}`, name: data.name })
              }
              setShowWizard(false)
            }}
          />
        ) : editCampaign ? (
          <CreateProgramPage
            key={`edit-program-${editCampaign.id}`}
            editCampaign={editCampaign}
            onCancel={() => setEditCampaignId(null)}
            onSave={(status, data) => {
              if (data?.editedId) {
                setSavedProgram({ id: data.editedId, name: data.name, editedBy: 'Advait Patil', action: status === 'draft' ? 'deactivated' : undefined })
              }
              setEditCampaignId(null)
            }}
          />
        ) : page === 'campaign-portfolio' ? (
          <ProgramsListPage
            onSelectCampaign={(id) => { setEditCampaignId(id) }}
            onCreateCampaign={() => setShowWizard(true)}
            activatedProgram={activatedProgram}
            onClearActivated={() => setActivatedProgram(null)}
            draftedProgram={draftedProgram}
            onClearDrafted={() => setDraftedProgram(null)}
            savedProgram={savedProgram}
            onClearSaved={() => setSavedProgram(null)}
          />
        ) : page === 'campaign-insight' ? (
          <div className="p-6 lg:px-8 bg-[#F8FAFC] flex-1">
            {/* Breadcrumb row */}
            <div className="flex items-center gap-1.5 text-[12px] mb-2">
              <button
                onClick={() => setPage('campaign-portfolio')}
                className="text-[#64748b] hover:text-[#0f172a] font-medium transition-colors outline-none focus:outline-none"
              >
                Operations Dashboard
              </button>
              <ChevronRight className="h-3 w-3 text-[#94a3b8]" />
              <button
                onClick={() => setPage('dashboard')}
                className="text-[#64748b] hover:text-[#0f172a] font-medium transition-colors outline-none focus:outline-none"
              >
                {selectedCampaign ? selectedCampaign.name : 'Campaign'}
              </button>
              <ChevronRight className="h-3 w-3 text-[#94a3b8]" />
              <span className="text-[#0f172a] font-medium">Campaign Insight</span>
            </div>

            {/* Title row */}
            <div className="flex items-center justify-between mb-8 gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#4f46e5] mb-1">
                  <Sparkles className="h-3 w-3" fill="#6366f1" />
                  Campaign Insight
                </div>
                <h1 className="text-[28px] font-semibold text-[#0f172a] leading-[1.2]">
                  {selectedCampaign ? selectedCampaign.name : 'Campaign Insight'}
                </h1>
              </div>
            </div>

            <CampaignInsightDashboard />
          </div>
        ) : (
          <div className="p-6 lg:px-8 bg-[#F8FAFC] flex-1">
            {/* Breadcrumb row */}
            <div className="flex items-center gap-1.5 text-[12px] mb-2">
              <button
                onClick={() => setPage('campaign-portfolio')}
                className="text-[#64748b] hover:text-[#0f172a] font-medium transition-colors outline-none focus:outline-none"
              >
                Operations Dashboard
              </button>
              <ChevronRight className="h-3 w-3 text-[#94a3b8]" />
              <span className="text-[#0f172a] font-medium">
                {selectedCampaign ? selectedCampaign.name : 'Campaign'}
              </span>
            </div>

            {/* Title row: campaign name on the left, navigation actions on the right */}
            <div className="flex items-center justify-between mb-8 gap-4">
              <h1 className="text-[28px] font-semibold text-[#0f172a] leading-[1.2]">
                {selectedCampaign ? selectedCampaign.name : 'Feedback Intelligence Dashboard'}
              </h1>
              <div className="flex items-center gap-4 flex-shrink-0">
                <button
                  onClick={() => setPage('campaign-insight')}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#c7d2fe] bg-[#eef2ff] hover:bg-[#e0e7ff] px-3 py-1.5 text-[12px] font-semibold text-[#4f46e5] transition-colors outline-none focus:outline-none"
                >
                  <Sparkles className="h-3.5 w-3.5" fill="#6366f1" />
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
      ) : fiSection === 'surveys' ? (
        <SurveyTemplatesPage />
      ) : fiSection === 'themes' ? (
        themeId === '__new__' ? (
          <ThemeDetailPage
            onBack={() => setThemeId(null)}
            onCreated={(id) => { setThemeId(null); setNewThemeId(id) }}
          />
        ) : themeId ? (
          <ThemeDetailPage
            themeId={themeId}
            onBack={() => setThemeId(null)}
          />
        ) : (
          <ThemesListPage
            onSelectTheme={(id) => setThemeId(id)}
            onCreateTheme={() => setThemeId('__new__')}
            newlyCreatedId={newThemeId}
            onClearNewlyCreated={() => setNewThemeId(null)}
          />
        )
      ) : fiSection === 'alerts' ? (
        showCreateAlert ? (
          <CreateAlertPage
            onCancel={() => setShowCreateAlert(false)}
            onActivate={(name) => { setShowCreateAlert(false); setActivatedAlert({ name }) }}
          />
        ) : editingAlert ? (
          <EditAlertPage
            alert={editingAlert}
            onCancel={() => setEditingAlert(null)}
            onSave={(name) => { const id = editingAlert.id; setEditingAlert(null); setSavedAlert({ id, name }) }}
          />
        ) : (
          <AlertsListPage
            onCreateAlert={() => setShowCreateAlert(true)}
            activatedAlert={activatedAlert}
            onClearActivated={() => setActivatedAlert(null)}
            onEditAlert={(alert) => setEditingAlert(alert)}
            savedAlert={savedAlert}
            onClearSaved={() => setSavedAlert(null)}
          />
        )
      ) : (
        <ProgramHealthPage />
      )}
    </AppShell>
  )
}
