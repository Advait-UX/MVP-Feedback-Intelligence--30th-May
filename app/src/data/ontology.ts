// Ontology Studio seed data and persistence helpers.
// Mirrors the prototype.html constants so the React app has the same
// starting state as the HTML prototype.

import type { Category, Ontology, TopicModel, Modifier, SentimentLevel } from '../types'

// ---------------------------------------------------------------------------
// Topic AI models
// ---------------------------------------------------------------------------

export const TOPIC_MODELS: TopicModel[] = [
  { id: 'cx-quality',  name: 'CX Quality Model' },
  { id: 'agent-perf',  name: 'Agent Performance Model' },
  { id: 'resolution',  name: 'Resolution Intelligence' },
  { id: 'effort-ease', name: 'Effort & Ease Model' },
]

// ---------------------------------------------------------------------------
// Seed categories — 50 topics for the CX Quality model
// ---------------------------------------------------------------------------

export const SEED_CATEGORIES: Category[] = [
  { id:  1, name: 'Resolution',                weight: 1, active: true },
  { id:  2, name: 'Agent Empathy',             weight: 1, active: true },
  { id:  3, name: 'Customer Effort',           weight: 1, active: true },
  { id:  4, name: 'Wait Time',                 weight: 1, active: true },
  { id:  5, name: 'Billing Accuracy',          weight: 1, active: true },
  { id:  6, name: 'Product Knowledge',         weight: 1, active: true },
  { id:  7, name: 'Channel Handoff',           weight: 1, active: true },
  { id:  8, name: 'Communication Clarity',     weight: 1, active: true },
  { id:  9, name: 'First Contact Resolution',  weight: 1, active: true },
  { id: 10, name: 'Active Listening',          weight: 1, active: true },
  { id: 11, name: 'Tone & Professionalism',    weight: 1, active: true },
  { id: 12, name: 'Compliance Adherence',      weight: 1, active: true },
  { id: 13, name: 'Escalation Handling',       weight: 1, active: true },
  { id: 14, name: 'Proactive Communication',   weight: 1, active: true },
  { id: 15, name: 'Issue Ownership',           weight: 1, active: true },
  { id: 16, name: 'Sentiment Alignment',       weight: 1, active: true },
  { id: 17, name: 'Hold Time Management',      weight: 1, active: true },
  { id: 18, name: 'Transfer Accuracy',         weight: 1, active: true },
  { id: 19, name: 'Follow-up Commitment',      weight: 1, active: true },
  { id: 20, name: 'Self-Service Guidance',     weight: 1, active: true },
  { id: 21, name: 'Empowerment & Authority',   weight: 1, active: true },
  { id: 22, name: 'Root Cause Analysis',       weight: 1, active: true },
  { id: 23, name: 'Digital Literacy',          weight: 1, active: true },
  { id: 24, name: 'Response Accuracy',         weight: 1, active: true },
  { id: 25, name: 'Callback Adherence',        weight: 1, active: true },
  { id: 26, name: 'Script Compliance',         weight: 1, active: true },
  { id: 27, name: 'NPS Alignment',             weight: 1, active: true },
  { id: 28, name: 'Interaction Wrap-up',       weight: 1, active: true },
  { id: 29, name: 'Repeat Contact Rate',       weight: 1, active: true },
  { id: 30, name: 'Cross-sell Effectiveness',  weight: 1, active: true },
  { id: 31, name: 'Data Capture Accuracy',     weight: 1, active: true },
  { id: 32, name: 'Authentication Handling',   weight: 1, active: true },
  { id: 33, name: 'Queue Expectation Setting', weight: 1, active: true },
  { id: 34, name: 'Language Adaptability',     weight: 1, active: true },
  { id: 35, name: 'Objection Handling',        weight: 1, active: true },
  { id: 36, name: 'Complaint Acknowledgment',  weight: 1, active: true },
  { id: 37, name: 'Policy Explanation',        weight: 1, active: true },
  { id: 38, name: 'Technical Troubleshooting', weight: 1, active: true },
  { id: 39, name: 'CRM Utilisation',           weight: 1, active: true },
  { id: 40, name: 'Closing Quality',           weight: 1, active: true },
  { id: 41, name: 'Greeting Quality',          weight: 1, active: true },
  { id: 42, name: 'Interruption Avoidance',    weight: 1, active: true },
  { id: 43, name: 'Knowledge Base Usage',      weight: 1, active: true },
  { id: 44, name: 'Silence Management',        weight: 1, active: true },
  { id: 45, name: 'Soft Skills Application',   weight: 1, active: true },
  { id: 46, name: 'Trust Building',            weight: 1, active: true },
  { id: 47, name: 'Issue Recurrence Prevention', weight: 1, active: true },
  { id: 48, name: 'Accessibility Handling',    weight: 1, active: true },
  { id: 49, name: 'Schedule Adherence',        weight: 1, active: true },
  { id: 50, name: 'CSAT Commitment',           weight: 1, active: true },
]

// ---------------------------------------------------------------------------
// Refreshed categories — simulates Topic AI API response after a refresh.
// Drops ids 1–4 (isRemoved) and adds 3 new entries (isNew).
// ---------------------------------------------------------------------------

export const REFRESHED_CATEGORIES: Category[] = [
  { id: 201, name: 'Sentiment Shift Detection', weight: 1, active: true, isNew: true },
  { id: 202, name: 'Escalation Propensity',     weight: 1, active: true, isNew: true },
  { id: 203, name: 'Compliance Risk Flag',      weight: 1, active: true, isNew: true },
  ...SEED_CATEGORIES.map((c, i) => (i < 4 ? { ...c, isRemoved: true } : { ...c })),
]

// ---------------------------------------------------------------------------
// Default category sets keyed by model id
// ---------------------------------------------------------------------------

export const CATEGORIES_BY_MODEL: Record<string, Category[]> = {
  'cx-quality': SEED_CATEGORIES.map(c => ({ ...c })),
  'agent-perf': [
    { id: 1, name: 'First Call Resolution', weight: 1, active: true },
    { id: 2, name: 'Active Listening',      weight: 1, active: true },
    { id: 3, name: 'Knowledge Application', weight: 1, active: true },
    { id: 4, name: 'Tone Management',       weight: 1, active: true },
    { id: 5, name: 'Compliance Adherence',  weight: 1, active: true },
    { id: 6, name: 'Resolution Speed',      weight: 1, active: true },
  ],
  'resolution': [
    { id: 1, name: 'Issue Identification',  weight: 1, active: true },
    { id: 2, name: 'Root Cause Analysis',   weight: 1, active: true },
    { id: 3, name: 'Resolution Quality',    weight: 1, active: true },
    { id: 4, name: 'Follow-up Adequacy',    weight: 1, active: true },
    { id: 5, name: 'Customer Confirmation', weight: 1, active: true },
  ],
  'effort-ease': [
    { id: 1, name: 'Effort to Reach',       weight: 1, active: true },
    { id: 2, name: 'Steps to Resolve',      weight: 1, active: true },
    { id: 3, name: 'Self-Service Coverage', weight: 1, active: true },
    { id: 4, name: 'Re-contact Need',       weight: 1, active: true },
    { id: 5, name: 'Resolution Time',       weight: 1, active: true },
  ],
}

// ---------------------------------------------------------------------------
// Seed ontologies — shown on the Ontology Studio landing grid
// ---------------------------------------------------------------------------

export const SEED_ONTOLOGIES: Ontology[] = [
  {
    id: 'ont-cx-quality',
    modelId: 'cx-quality',
    modelName: 'CX Quality Model',
    categories: CATEGORIES_BY_MODEL['cx-quality'].map(c => ({ ...c })),
    updatedAt: '2026-05-04T14:23:00Z',
    updatedBy: 'Maria Cohen',
    mappedCampaigns: [
      'Post-Chat CSAT — Tier 1 Billing',
      'Cognigy AI Session — Bot Handoff Audit',
      'NPS Quarterly — Enterprise Clients',
      'General Inquiry Pulse',
      'Mobile App Feedback',
      'Cancellation Recovery',
      'Complaint Resolution Follow-Up',
      'Product Feedback — Beta Testers',
      'Negative Sentiment Catcher — All Digital',
      'Social Media Response Quality',
      'VIP Customer Satisfaction',
      'Onboarding Experience Check',
      'Tech Support — Tier 2',
      'Retention Campaign — At-Risk',
      'First Contact Resolution Tracker',
      'Agent Empathy Benchmark',
      'Chat Escalation Monitor',
      'Self-Service Fallout Survey',
      'Post-IVR Satisfaction',
      'Email Response Quality',
      'Account Management Touchpoint',
      'Renewal Experience Survey',
      'Partner Channel Feedback',
      'Digital Channel CSAT',
      'Voice Channel Quality',
      'Complaint Acknowledgement',
      'Proactive Outreach Response',
      'Churn Risk Early Warning',
      'Billing Dispute Resolution',
      'Service Recovery Follow-Up',
    ],
    // Topic AI has published updates to this model after the ontology was
    // last saved. Drives the "Updates available" badge on the grid and the
    // info banner in the editor.
    hasUpstreamChanges: true,
  },
  {
    id: 'ont-resolution',
    modelId: 'resolution',
    modelName: 'Resolution Intelligence',
    categories: CATEGORIES_BY_MODEL['resolution'].map(c => ({ ...c })),
    updatedAt: '2026-04-22T09:15:00Z',
    updatedBy: 'John Smith',
    mappedCampaigns: [
      'Email Support — Resolution Quality',
      'FCR Check — Tier 2 Support',
    ],
  },
]

// ---------------------------------------------------------------------------
// Modifiers
// ---------------------------------------------------------------------------

export const SEED_MODIFIERS: Modifier[] = [
  {
    id: 1,
    name: 'Escalation penalty',
    when: 'Interaction was escalated to supervisor',
    effect: 'multiply',
    value: 0.75,
    active: true,
  },
  {
    id: 2,
    name: 'Repeat-contact penalty',
    when: 'Same customer contacted within 72h on same topic',
    effect: 'multiply',
    value: 0.80,
    active: true,
  },
  {
    id: 3,
    name: 'First-contact resolution',
    when: 'Resolved without callback, transfer, or escalation',
    effect: 'multiply',
    value: 1.15,
    active: true,
  },
  {
    id: 4,
    name: 'Compliance violation',
    when: 'Compliance topic detected with negative sentiment',
    effect: 'add',
    value: -15,
    active: true,
  },
  {
    id: 5,
    name: 'VIP segment uplift',
    when: 'Customer is in VIP / tier-1 segment',
    effect: 'add',
    value: 5,
    active: false,
  },
]

// ---------------------------------------------------------------------------
// Sentiment levels
// ---------------------------------------------------------------------------

export const SEED_SENTIMENT: SentimentLevel[] = [
  { id: 'vpos', label: 'Very positive', range: '+0.6 to +1.0', multiplier: 1.20, color: 'var(--lyra-green-700)' },
  { id: 'pos',  label: 'Positive',      range: '+0.2 to +0.6', multiplier: 1.10, color: 'var(--lyra-green-700)' },
  { id: 'neu',  label: 'Neutral',       range: '−0.2 to +0.2', multiplier: 1.00, color: 'var(--lyra-slate-500)' },
  { id: 'neg',  label: 'Negative',      range: '−0.6 to −0.2', multiplier: 0.80, color: 'var(--lyra-red-600)'   },
  { id: 'vneg', label: 'Very negative', range: '−1.0 to −0.6', multiplier: 0.55, color: 'var(--lyra-red-600)'   },
]

// ---------------------------------------------------------------------------
// Persistence helpers — localStorage shim; swap for a real API call later
// ---------------------------------------------------------------------------

const ONTOLOGIES_STORAGE_KEY = 'fi-ontologies-v1'

export function loadOntologies(): Ontology[] {
  try {
    const raw = localStorage.getItem(ONTOLOGIES_STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Ontology[]
  } catch (_) { /* ignore parse errors */ }
  return SEED_ONTOLOGIES.map(o => ({
    ...o,
    categories: o.categories.map(c => ({ ...c })),
  }))
}

export function saveOntologies(list: Ontology[]): void {
  try {
    localStorage.setItem(ONTOLOGIES_STORAGE_KEY, JSON.stringify(list))
  } catch (_) { /* ignore quota errors */ }
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

export function formatUpdatedAt(iso: string | undefined | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return (
    d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  )
}
