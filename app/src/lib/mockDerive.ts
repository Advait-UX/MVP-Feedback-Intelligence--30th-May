// Deterministic display-data derivation for the leaner Programs / Program Health
// list pages. These pages need a few fields (survey name, audience, owner,
// modified date, funnel counts) that the canonical Campaign model doesn't
// track. Rather than hand-author them per campaign, we derive them from a
// string seed (the campaign id) so the same campaign always renders the same
// values across re-renders and filters, without reaching for Math.random.
import type { Campaign } from './campaigns'

function seedNumber(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function seededPick<T>(seed: string, pool: T[], salt = ''): T {
  const n = seedNumber(seed + salt)
  return pool[n % pool.length]
}

function seededRange(seed: string, min: number, max: number, salt = ''): number {
  const n = seedNumber(seed + salt)
  return min + (n % (max - min + 1))
}

const OWNERS = ['Priya Raman', 'Tom Belfield', 'Alia Nasser', 'Jordan Meeks', 'Sana Farooqi']
const UPDATED_BY = ['Jaden Smith', 'Maria Cohen', 'Jessica', 'John Smith', 'Emily Johnson', 'Michael Brown', 'Sarah Davis', 'David Wilson', 'Jessica Taylor', 'Daniel Anderson', 'Laura Thomas', 'James Martinez', 'Linda Garcia', 'Robert Rodriguez', 'Patricia Lee']

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const PRIORITIES = ['P1', 'P2', 'P4', 'P7', 'P9', 'P10', 'P18', 'P20', 'P30', '-', '-', '-']
const ALERTS = ['Detractor alert', 'Notify lead', 'Notify CX', 'Notify escalation', '-', '-', '-']

function seededDate(seed: string): string {
  const day = seededRange(seed, 1, 28, 'day')
  const month = MONTH_NAMES[seededRange(seed, 0, 11, 'month')]
  const year = seededRange(seed, 2025, 2026, 'year')
  return `${String(day).padStart(2, '0')} ${month} ${year}`
}

function seededDateWithTime(seed: string): string {
  const day = seededRange(seed, 1, 28, 'day')
  const monthIdx = seededRange(seed, 0, 11, 'month')
  const year = 2026
  const hour = seededRange(seed, 0, 23, 'hour')
  const minute = seededRange(seed, 0, 59, 'minute')
  const generated = new Date(year, monthIdx, day, hour, minute)
  const capped = generated > new Date() ? new Date() : generated
  return `${MONTH_NAMES[capped.getMonth()]} ${capped.getDate()}, ${capped.getFullYear()} ${String(capped.getHours()).padStart(2, '0')}:${String(capped.getMinutes()).padStart(2, '0')}`
}

export type ProgramRowExtras = {
  survey: string
  audience: string
  owner: string
  modified: string
  statusLabel: string
  priority: string
  alert: string
  updatedBy: string
  updatedOn: string
}

const STATUS_LABELS: Record<Campaign['status'], string> = {
  active: 'Active',
  paused: 'Inactive',
  draft: 'Draft',
  ended: 'Inactive',
}

export function deriveProgramRow(c: Campaign): ProgramRowExtras {
  const isContextual = seededRange(c.id, 0, 1, 'survey-kind') === 0
  const survey = `${c.category} — ${isContextual ? 'contextual' : 'standard'}`
  const audience = c.topIntents.length
    ? c.topIntents.slice(0, 2).join(', ')
    : `${seededRange(c.id, 2, 8, 'teams')} teams`

  return {
    survey,
    audience,
    owner: seededPick(c.id, OWNERS, 'owner'),
    modified: seededDate(c.id),
    statusLabel: STATUS_LABELS[c.status],
    priority: seededPick(c.id, PRIORITIES, 'priority'),
    alert: seededPick(c.id, ALERTS, 'alert'),
    updatedBy: seededPick(c.id, UPDATED_BY, 'updatedBy'),
    updatedOn: seededDateWithTime(c.id),
  }
}

export type ProgramHealthRow = {
  interactions: number
  eligibilityRate: number
  eligible: number
  coverage: number
  surveysSent: number
  responseRate: number
  responsesReceived: number
  completionRate: number
  completed: number
  partial: number
}

// Funnel: interactions -> eligible (eligibility rate) -> surveys sent (coverage)
// -> responses received (response rate) -> completed + partial (completion rate).
export function deriveHealthRow(c: Campaign): ProgramHealthRow {
  const surveysSent = c.sent ?? 0
  const coverage = seededRange(c.id, 80, 96, 'coverage')
  const eligible = Math.round(surveysSent / (coverage / 100)) || 0
  const eligibilityRate = seededRange(c.id, 25, 45, 'eligibility')
  const interactions = Math.round(eligible / (eligibilityRate / 100)) || 0
  const responseRate = c.responseRate ?? 0
  const responsesReceived = Math.round((surveysSent * responseRate) / 100)
  const completionRate = seededRange(c.id, 55, 78, 'completion')
  const completed = Math.round((responsesReceived * completionRate) / 100)
  const partial = responsesReceived - completed

  return {
    interactions, eligibilityRate, eligible, coverage, surveysSent,
    responseRate, responsesReceived, completionRate, completed, partial,
  }
}

export function deriveQuestionType(c: Campaign): 'AI questions' | 'Static questions' {
  return seededRange(c.id, 0, 1, 'qtype') === 0 ? 'AI questions' : 'Static questions'
}
