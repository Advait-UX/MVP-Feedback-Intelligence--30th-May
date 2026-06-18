// Shared domain types for Feedback Intelligence.
// Import from '../types' (resolves to this file via the directory index).

// ---------------------------------------------------------------------------
// Campaign
// ---------------------------------------------------------------------------

export type Campaign = {
  id: number
  name: string
  status: 'active' | 'inactive' | 'expired'
  channels: string[]
  surveyDesignId: string
  aiModelId?: string
  queues: string[]
  startDate: string
  ongoing: boolean
  endDate: string | null
  description?: string
  interactionLength: number
  suppressOptOut: boolean
  suppressRecent: boolean
  recentDays: number
  hasWorkingCopy?: boolean
  workingCopyVersion?: number
  publishedVersion?: number
  publishedAt?: string
  workingCopyEditedBy?: string
  workingCopyEditedAt?: string
  sampling: number
  sent: number
  completion: number
  vu: number | null
  owner: string
  created: string
  updated: string
  isNew?: boolean
}

// ---------------------------------------------------------------------------
// Ontology Studio types
// ---------------------------------------------------------------------------

export type Category = {
  id: number
  name: string
  weight: number
  active: boolean
  isNew?: boolean
  isRemoved?: boolean
  _rawInput?: string
}

export type Ontology = {
  id: string
  modelId: string
  modelName: string
  categories: Category[]
  updatedAt: string
  updatedBy: string
  mappedCampaigns: string[]
  hasUpstreamChanges?: boolean
}

export type TopicModel = {
  id: string
  name: string
}

export type Modifier = {
  id: number
  name: string
  when: string
  effect: 'multiply' | 'add'
  value: number
  active: boolean
}

export type SentimentLevel = {
  id: string
  label: string
  range: string
  multiplier: number
  color: string
}

// ---------------------------------------------------------------------------
// Survey Designs (Templates)
// ---------------------------------------------------------------------------

export type SurveyDesign = {
  id: string
  name: string
  type: string
  description: string
  questionCount: number
  channels: string
  tags: string[]
  owner: string
  created: string
  updated: string
  isNew?: boolean
}

// Survey design as used in prototype campaign builder
export type SurveyDesignIntent = {
  group: string
  tags: string[]
}

export type SurveyDesignTemplate = {
  id: string
  name: string
  category: string
  why: string
  channels: string
  intents: SurveyDesignIntent[]
  // Operational fields populated for fully-configured templates
  description?: string
  channel?: string
  surveyType?: string
  displayStyle?: string
  listPickerLabel?: string
  aiQuestions?: boolean
  sendGenericQuestion?: boolean
  maxQuestions?: number
  freeText?: string
  welcomeMode?: 'with-optout' | 'without-optout' | 'none'
  welcomeMessage?: string
  buttonToStart?: string
  buttonToOptOut?: string
  defaultScaleQuestion?: string
  defaultCommentQuestion?: string
  expiryMinutes?: number
  realtimeAlerts?: boolean
  usedBy?: number
  updated?: string
  owner?: string
  isDefault?: boolean
  isNew?: boolean
}

// ---------------------------------------------------------------------------
// AI Models
// ---------------------------------------------------------------------------

export type AiModelCategoryIntent = {
  category: string
  intents: string[]
}

export type AiModel = {
  id: string
  name: string
  badge: string | null
  description: string
  whenToUse: string
  industry: string
  tags: string[]
  categoryIntents: AiModelCategoryIntent[]
}

// ---------------------------------------------------------------------------
// Routing
// ---------------------------------------------------------------------------

export type Route = {
  product: 'fi' | 'wfm'
  section: string
  view: string
  template?: Record<string, unknown> | null
  editCampaign?: Campaign | null
  campaign?: Campaign | null
  design?: SurveyDesign | null
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

export type NavItem = {
  type: 'leaf' | 'group'
  icon?: string
  label: string
  key?: string
  active?: boolean
  expanded?: boolean
  children?: NavItem[]
  isNew?: boolean
  hasUpdates?: boolean
}

// ---------------------------------------------------------------------------
// Toast notification
// ---------------------------------------------------------------------------

export type Toast = {
  msg: string
  duration?: number
}
