// Survey design templates — sourced from prototype.html SURVEY_DESIGNS +
// SEED_DESIGNS. These are the pre-built templates surfaced in the campaign
// builder's survey-picker drawer and the Survey Templates admin page.

import type { SurveyDesignTemplate } from '../types'

// Re-export the type so consumers can import it from this module if needed.
export type { SurveyDesignTemplate }

// ---------------------------------------------------------------------------
// SURVEY_DESIGNS — All available survey template objects with full data.
// The `csat-quick` entry carries the complete SEED_DESIGNS operational
// fields (surveyType, displayStyle, welcomeMode, etc.) as it is the default
// / most-used template and drives the Survey Templates admin page.
// ---------------------------------------------------------------------------

export const SURVEY_DESIGNS: SurveyDesignTemplate[] = [
  {
    id: 'csat-quick',
    name: 'Post Interaction CSAT Survey',
    category: 'Customer Satisfaction',
    why: 'Best for digital interactions where the conversation just ended. Short surveys (2–3 questions) get the highest response rates.',
    channels: 'Digital',
    intents: [
      { group: 'Primary',   tags: ['Resolution quality', 'Agent friendliness'] },
      { group: 'Secondary', tags: ['Response time', 'First-contact resolution'] },
    ],
    description: 'Captures customer satisfaction immediately after each interaction to track quality and identify coaching opportunities.',
    channel: 'Digital',
    surveyType: 'CSAT (1–5 star)',
    displayStyle: 'Quick Reply',
    listPickerLabel: '',
    aiQuestions: true,
    sendGenericQuestion: false,
    maxQuestions: 2,
    freeText: 'Conditional',
    welcomeMode: 'with-optout',
    welcomeMessage: 'We\'d love to hear about your experience today. We have just a few quick questions, just two minutes of your time.',
    buttonToStart: 'Get started',
    buttonToOptOut: 'Not today',
    defaultScaleQuestion: 'On a scale of 1 to 5, how would you rate your experience today?',
    defaultCommentQuestion: 'What could we have done better?',
    expiryMinutes: 2880,
    realtimeAlerts: true,
    usedBy: 3,
    updated: '',
    owner: 'Maria Cohen',
    isDefault: true,
  },
  {
    id: 'bot-simple',
    name: 'Bot Handoff Audit',
    category: 'AI Quality',
    why: 'Use after virtual agent transfers to measure where AI confidence dropped and human escalation was needed.',
    channels: 'Digital',
    intents: [
      { group: 'Primary',   tags: ['Bot containment', 'Handoff smoothness'] },
      { group: 'Secondary', tags: ['Escalation trigger', 'AI confidence'] },
    ],
  },
  {
    id: 'vip-followup',
    name: 'VIP Escalation Follow-Up',
    category: 'Retention',
    why: 'Deploy after high-priority escalations. VIP customers churn silently — a personal survey shows the brand cares.',
    channels: 'Digital · Voice',
    intents: [
      { group: 'Primary',   tags: ['Satisfaction', 'Relationship recovery'] },
      { group: 'Secondary', tags: ['Churn risk', 'Brand perception'] },
    ],
  },
  {
    id: 'nps-pulse',
    name: 'NPS Pulse Survey',
    category: 'Net Promoter',
    why: 'Captures likelihood to recommend after any significant interaction. Pairs well with open-text follow-up for promoter and detractor classification.',
    channels: 'Digital · Voice',
    intents: [
      { group: 'Primary',   tags: ['Recommend likelihood', 'Promoter signal'] },
      { group: 'Secondary', tags: ['Detractor risk', 'Passive conversion'] },
    ],
  },
  {
    id: 'fcr-check',
    name: 'First Contact Resolution',
    category: 'Resolution Quality',
    why: 'One focused question on whether the issue was fully resolved. High correlation with loyalty — ideal for QA teams tracking resolution rates.',
    channels: 'Digital · Voice',
    intents: [
      { group: 'Primary',   tags: ['Issue resolved', 'Follow-up needed'] },
      { group: 'Secondary', tags: ['Root cause', 'Knowledge gap flag'] },
    ],
  },
  {
    id: 'email-quality',
    name: 'Email Support Quality',
    category: 'Email Channel',
    why: 'Optimised for async email threads. Measures clarity, helpfulness and tone — signals often lost in real-time chat surveys.',
    channels: 'Digital',
    intents: [
      { group: 'Primary',   tags: ['Response clarity', 'Helpfulness'] },
      { group: 'Secondary', tags: ['Tone quality', 'Resolution satisfaction'] },
    ],
  },
  {
    id: 'ivr-postcall',
    name: 'IVR Post-Call Survey',
    category: 'Voice Channel',
    why: 'Triggers immediately after an IVR-assisted call ends. Captures in-the-moment effort and resolution signals before the customer disengages.',
    channels: 'Voice',
    intents: [
      { group: 'Primary',   tags: ['Call resolution', 'IVR ease of use'] },
      { group: 'Secondary', tags: ['Hold time satisfaction', 'Agent handoff quality'] },
    ],
  },
  {
    id: 'ivr-nps',
    name: 'IVR NPS Survey',
    category: 'Net Promoter',
    why: 'Short NPS delivered post-call via IVR keypad input. High completion rates due to low friction — single question, single keypress.',
    channels: 'Voice',
    intents: [
      { group: 'Primary',   tags: ['Recommend likelihood', 'Loyalty signal'] },
      { group: 'Secondary', tags: ['Detractor flag', 'Promoter identification'] },
    ],
  },
  {
    id: 'csat-list',
    name: 'CSAT Ranked List',
    category: 'Customer Satisfaction',
    why: 'Multi-question CSAT covering resolution, effort, and agent behaviour. Best for complex interactions where a single score misses detail.',
    channels: 'Digital · Voice',
    intents: [
      { group: 'Primary',   tags: ['Overall satisfaction', 'Issue resolution'] },
      { group: 'Secondary', tags: ['Agent effectiveness', 'Process friction'] },
    ],
  },
  {
    id: 'brand-pulse',
    name: 'Brand Perception Pulse',
    category: 'Brand Health',
    why: 'Measures brand perception beyond the single interaction. Use for loyalty programs, retention campaigns, and long-term relationship tracking.',
    channels: 'Digital · Voice',
    intents: [
      { group: 'Primary',   tags: ['Brand trust', 'Loyalty intent'] },
      { group: 'Secondary', tags: ['Perception shift', 'Competitor sensitivity'] },
    ],
  },
  {
    id: 'voice-coaching',
    name: 'Voice Coaching Survey',
    category: 'Quality Assurance',
    why: 'Purpose-built for QA and coaching workflows. Captures specific agent behaviour signals that map directly to coaching rubrics.',
    channels: 'Voice',
    intents: [
      { group: 'Primary',   tags: ['Agent clarity', 'Empathy score'] },
      { group: 'Secondary', tags: ['Script adherence', 'Resolution ownership'] },
    ],
  },
]

// ---------------------------------------------------------------------------
// Default operational values for new survey templates (mirrors DEFAULT_DESIGN
// in the prototype). Used as the base when creating a template from scratch.
// ---------------------------------------------------------------------------

export const DEFAULT_SURVEY_DESIGN: Omit<SurveyDesignTemplate, 'id' | 'category' | 'why' | 'intents'> = {
  name: 'Post Interaction CSAT',
  description: 'Captures customer satisfaction immediately after each interaction to track quality and identify coaching opportunities.',
  channels: 'Digital',
  channel: 'Digital',
  surveyType: 'CSAT (1–5 Star)',
  displayStyle: 'Quick Reply',
  listPickerLabel: 'Rate your experience',
  welcomeMode: 'with-optout',
  welcomeMessage: 'We\'d love to hear about your experience today. We have just a few quick questions, just two minutes of your time.',
  buttonToStart: 'Get started',
  buttonToOptOut: 'Not today',
  aiQuestions: true,
  sendGenericQuestion: true,
  defaultScaleQuestion: 'On a scale of 1 to 5, how would you rate your experience today?',
  defaultCommentQuestion: 'What could we have done better?',
  maxQuestions: 2,
  freeText: 'Conditional',
  expiryMinutes: 2880,
  realtimeAlerts: true,
}

// ---------------------------------------------------------------------------
// Helper — look up a design by id; falls back to the default template.
// ---------------------------------------------------------------------------

export function getSurveyDesignById(id: string): SurveyDesignTemplate {
  return SURVEY_DESIGNS.find(d => d.id === id) ?? SURVEY_DESIGNS[0]
}

// Unique category values across all templates — useful for filter pills.
export const SURVEY_DESIGN_CATEGORIES: string[] = Array.from(
  new Set(SURVEY_DESIGNS.map(d => d.category))
)
