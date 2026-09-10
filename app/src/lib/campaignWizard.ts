export const ALL_TEAMS = [
  'Tier 1 Billing', 'Tier 2 Support', 'Sales', 'Retention',
  'Digital Support', 'Chat Team', 'Email Support', 'AI Bot Team',
  'Handoff Queue', 'Social Media Team', 'VIP Support',
  'Returns Team', 'Enterprise Support', 'Voice Quality Team',
  'Onboarding Team', 'Escalations', 'Self Service', 'Bot Deflection',
  'Beta Program', 'Complaints Team', 'Seasonal Team', 'IVR Team',
  'Technical Support', 'Premium Tier', 'Installation Team',
  'Fraud Prevention',
]

export const ALL_SKILLS = [
  'Active Listening', 'Conflict Resolution', 'Empathy', 'Problem Solving',
  'Product Knowledge', 'Technical Troubleshooting', 'Billing & Payments',
  'Upselling', 'Retention', 'Complaint Handling', 'Chat Support',
  'Email Handling', 'Voice Support', 'Multilingual — Spanish',
  'Multilingual — French', 'Multilingual — German', 'Multilingual — Mandarin',
  'Compliance Awareness', 'Data Privacy', 'CRM Proficiency',
  'Escalation Management', 'First Call Resolution', 'Customer Onboarding',
  'Account Management', 'Sales Closing', 'Objection Handling',
  'SLA Adherence', 'KYC Verification',
]

export const DIGITAL_CHANNELS = [
  'Email', 'WhatsApp', 'Instagram Messenger', 'Facebook Messenger',
  'Live Chat', 'SMS', 'Twitter / X', 'WeChat', 'Telegram', 'LINE',
]

export interface WizardCampaign {
  name: string
  description: string
  ongoing: boolean
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  surveyDays: string[]
  agentMode: 'teams' | 'skills'
  queues: string[]
  teams: string[]
  skills: string[]
  interactionChannel: 'voice' | 'digital'
  digitalChannel: string
  surveyChannel: 'voice' | 'digital'
  surveyDigitalChannels: string[]
  interactionLength: number
  suppressOptOut: boolean
  suppressRecent: boolean
  recentDays: number
  surveyDesignId: string
}

export const DEFAULT_WIZARD_CAMPAIGN: WizardCampaign = {
  name: '',
  description: '',
  ongoing: true,
  startDate: '',
  endDate: '',
  startTime: '',
  endTime: '',
  surveyDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  agentMode: 'teams',
  queues: [],
  teams: [],
  skills: [],
  interactionChannel: 'voice',
  digitalChannel: '',
  surveyChannel: 'voice',
  surveyDigitalChannels: [],
  interactionLength: 2,
  suppressOptOut: true,
  suppressRecent: true,
  recentDays: 30,
  surveyDesignId: '',
}

export interface SurveyDesign {
  id: string
  name: string
  category: string
  why: string
  questionTypes: string
  updatedOn: string
}

export interface DigitalTheme {
  id: string
  name: string
  type: 'system' | 'custom'
  controlStyle: string
  messageMode: string
}

export const DIGITAL_THEMES: DigitalTheme[] = [
  { id: 'system-default',    name: 'Digital - system default',          type: 'system', controlStyle: 'List picker',  messageMode: 'Invitation with opt out' },
  { id: 'custom-retail',     name: 'Digital - custom theme for retail', type: 'custom', controlStyle: 'Quick reply',  messageMode: 'Invitation with opt out' },
  { id: 'custom-finance',    name: 'Digital - custom theme for finance',type: 'custom', controlStyle: 'Quick reply',  messageMode: 'Invitation with opt out' },
  { id: 'custom-healthcare', name: 'Digital - custom theme for healthcare', type: 'custom', controlStyle: 'List picker', messageMode: 'Opt-in only' },
  { id: 'custom-telecom',    name: 'Digital - custom theme for telecom',type: 'custom', controlStyle: 'Quick reply',  messageMode: 'Invitation with opt out' },
]

export const SURVEY_DESIGNS: SurveyDesign[] = [
  { id: 'csat-quick',     name: 'Post-Chat CSAT',           category: 'Customer Satisfaction', why: 'Best for high-volume digital interactions. Short 2–3 question surveys.',          questionTypes: 'CSAT (1 to 5), Verbatim',                         updatedOn: 'May 12, 2026  10:55:06 AM' },
  { id: 'bot-simple',     name: 'Bot Interaction Survey',   category: 'Automation Quality',    why: 'Measures bot resolution quality and escalation accuracy.',                        questionTypes: 'CSAT (1 to 5), Verbatim',                         updatedOn: 'May 12, 2026  10:55:06 AM' },
  { id: 'vip-followup',   name: 'VIP Follow-Up Survey',     category: 'Customer Retention',    why: 'For high-value customers. Longer, more personal survey flow.',                    questionTypes: 'ASAT (1 to 5), CSAT (1 to 5), Verbatim',         updatedOn: 'May 12, 2026  10:55:06 AM' },
  { id: 'nps-pulse',      name: 'NPS Pulse Survey',         category: 'Brand Loyalty',         why: 'Standard NPS with follow-up open question. Best for quarterly tracking.',         questionTypes: 'NPS (0 to 10), Verbatim',                         updatedOn: 'May 12, 2026  10:55:06 AM' },
  { id: 'fcr-check',      name: 'First Contact Resolution', category: 'Quality Assurance',     why: 'Directly asks if issue was resolved. Pairs well with FCR reporting.',             questionTypes: 'FCR, Verbatim',                                   updatedOn: 'May 12, 2026  10:55:06 AM' },
  { id: 'email-quality',  name: 'Email Resolution Quality', category: 'Quality Assurance',     why: 'Evaluate whether email interactions actually solved the problem.',                 questionTypes: 'CSAT (1 to 5), Verbatim',                         updatedOn: 'May 12, 2026  10:55:06 AM' },
  { id: 'ivr-postcall',   name: 'IVR Post-Call Survey',     category: 'Voice Experience',      why: 'Triggered immediately after IVR flow ends. Captures deflection sentiment.',       questionTypes: 'ASAT (1 to 5), Verbatim',                         updatedOn: 'May 12, 2026  10:55:06 AM' },
  { id: 'ivr-nps',        name: 'IVR NPS',                  category: 'Brand Loyalty',         why: 'Voice-first NPS survey. Short and frictionless for IVR customers.',               questionTypes: 'NPS (0 to 10)',                                   updatedOn: 'May 12, 2026  10:55:06 AM' },
  { id: 'csat-list',      name: 'CSAT + Topic List',        category: 'Customer Satisfaction', why: 'CSAT with a follow-up topic list. Great for intent classification.',              questionTypes: 'CSAT (1 to 5), Topic List, Verbatim',             updatedOn: 'May 12, 2026  10:55:06 AM' },
  { id: 'brand-pulse',    name: 'Brand Perception Survey',  category: 'Brand Loyalty',         why: 'Tracks brand affinity across interactions. Best for monthly cadence.',             questionTypes: 'ASAT (1 to 5), NPS (0 to 10)',                    updatedOn: 'May 12, 2026  10:55:06 AM' },
  { id: 'voice-coaching', name: 'Agent Coaching Survey',    category: 'Quality Assurance',     why: 'Evaluates specific agent behaviours. Used by QA teams for coaching.',             questionTypes: 'ASAT (1 to 5), Verbatim, CSAT (1 to 5), Verbatim', updatedOn: 'May 12, 2026  10:55:06 AM' },
]
