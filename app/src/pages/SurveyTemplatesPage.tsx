import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  ListPageHeader, SearchInput, StatusPill,
} from '@/components/feedback-management/ListPagePrimitives'

/* ============================================================
 * Surveys Page — TypeScript port of lyra/designs.jsx
 * Manages its own internal navigation: list → detail / create / edit
 * ============================================================ */

// ── Types ──────────────────────────────────────────────────────────────────────

interface SurveyDesign {
  id: string
  name: string
  description: string
  channel: 'Digital' | 'IVR'
  surveyType?: string
  displayStyle: string
  listPickerLabel: string
  aiQuestions: boolean
  maxQuestions?: number
  freeText?: string
  welcomeMode: 'with-optout' | 'without-optout' | 'none'
  welcomeMessage: string
  buttonToStart: string
  buttonToOptOut: string
  defaultScaleQuestion: string
  defaultCommentQuestion: string
  expiryMinutes: number
  realtimeAlerts: boolean
  usedBy?: number
  updated: string
  owner: string
  status?: 'active' | 'draft'
  isDefault?: boolean
  isNew?: boolean
  _sortTs?: number
  questionModeDigital: 'ai' | 'standard'
  questionModeIVR: 'ai' | 'standard'
  standardQuestionsDigital: QuestionItem[]
  standardQuestionsIVR: QuestionItem[]
  sendGenericQuestion?: boolean
}

interface QuestionItem {
  id: string
  editedText?: string
  scaleLabels: string[]
  yesnoLabels?: string[]
  displayStyle?: string
  menuLabel?: string
  fallbackText: string
}

interface QuestionDef {
  id: string
  text: string
  type: 'scale' | 'nps' | 'yesno' | 'select' | 'text'
  options?: string[]
  fallbackText?: string
}

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

// ── Data ──────────────────────────────────────────────────────────────────────

function makeSeed(p: {
  id: string; name: string; description: string; aiQuestions: boolean
  status: 'active' | 'draft'; usedBy: number; updated: string; owner: string
  channel?: 'Digital' | 'IVR'; isDefault?: boolean; realtimeAlerts?: boolean
}): SurveyDesign {
  return {
    channel: 'Digital',
    surveyType: 'CSAT (1–5 star)',
    displayStyle: 'Quick Reply',
    listPickerLabel: '',
    maxQuestions: 2,
    freeText: 'Conditional',
    welcomeMode: 'with-optout',
    welcomeMessage: "We'd love to hear about your experience today.",
    buttonToStart: 'Get started',
    buttonToOptOut: 'Not today',
    defaultScaleQuestion: 'On a scale of 1 to 5, how would you rate your experience today?',
    defaultCommentQuestion: 'What could we have done better?',
    expiryMinutes: 2880,
    realtimeAlerts: false,
    questionModeDigital: p.aiQuestions ? 'ai' : 'standard',
    questionModeIVR: p.aiQuestions ? 'ai' : 'standard',
    standardQuestionsDigital: [],
    standardQuestionsIVR: [],
    ...p,
  }
}

const SEED_DESIGNS: SurveyDesign[] = [
  /* ── LIVE (70) ─────────────────────────────────────────────────────────── */
  makeSeed({ id: 'csat-quick',                  name: 'Post Interaction CSAT Survey',      description: 'Captures customer satisfaction immediately after each interaction.',          aiQuestions: true,  status: 'active', usedBy: 3, updated: '01 Mar 2026', owner: 'Maria Cohen',      isDefault: true, realtimeAlerts: true }),
  makeSeed({ id: 'billing-contextual',           name: 'Billing — contextual',               description: '2 questions · CSAT 1–5 + verbatim · topic-driven.',                        aiQuestions: true,  status: 'active', usedBy: 1, updated: '12 Jul 2026', owner: 'Priya Raman',      realtimeAlerts: true }),
  makeSeed({ id: 'post-contact-csat-standard',   name: 'Post-contact CSAT — standard',       description: 'Fixed CSAT + comment question, same on every send.',                       aiQuestions: false, status: 'active', usedBy: 1, updated: '02 Jul 2026', owner: 'Tom Belfield',     channel: 'IVR' }),
  makeSeed({ id: 'escalation-diagnostic',        name: 'Escalation diagnostic',              description: 'Deeper diagnostic question set for escalated interactions.',               aiQuestions: true,  status: 'active', usedBy: 1, updated: '28 Jul 2026', owner: 'Priya Raman',      realtimeAlerts: true }),
  makeSeed({ id: 'delivery-experience',          name: 'Delivery experience',                description: 'Fixed delivery-satisfaction questions across all teams.',                   aiQuestions: false, status: 'active', usedBy: 1, updated: '19 Jul 2026', owner: 'Alia Nasser' }),
  makeSeed({ id: 'chat-csat-retail',             name: 'Chat CSAT — retail',                 description: 'Post-chat satisfaction for retail contact journeys.',                       aiQuestions: true,  status: 'active', usedBy: 2, updated: '15 Jul 2026', owner: 'Leon Park',        realtimeAlerts: true }),
  makeSeed({ id: 'tech-support-satisfaction',    name: 'Technical support satisfaction',     description: 'Measures how effectively the agent resolved the technical issue.',          aiQuestions: false, status: 'active', usedBy: 2, updated: '10 Jul 2026', owner: 'Ravi Mehta' }),
  makeSeed({ id: 'first-call-resolution',        name: 'First call resolution check',        description: 'Single targeted question confirming whether the issue was resolved.',       aiQuestions: false, status: 'active', usedBy: 1, updated: '08 Jul 2026', owner: 'Tom Belfield',     channel: 'IVR' }),
  makeSeed({ id: 'agent-empathy-digital',        name: 'Agent empathy — digital',            description: 'AI-driven empathy assessment for digital channel agents.',                  aiQuestions: true,  status: 'active', usedBy: 3, updated: '05 Jul 2026', owner: 'Sophie Turner',    realtimeAlerts: true }),
  makeSeed({ id: 'complaint-resolution',         name: 'Complaint resolution diagnostic',    description: 'Captures experience quality on complaint-handling interactions.',           aiQuestions: true,  status: 'active', usedBy: 2, updated: '03 Jul 2026', owner: 'Priya Raman',      realtimeAlerts: true }),
  makeSeed({ id: 'nps-post-purchase',            name: 'NPS — post-purchase',                description: 'Net Promoter Score survey sent after a confirmed purchase.',                aiQuestions: false, status: 'active', usedBy: 4, updated: '01 Jul 2026', owner: 'Maria Cohen' }),
  makeSeed({ id: 'onboarding-experience',        name: 'Onboarding experience',              description: 'Tracks satisfaction through the customer onboarding journey.',              aiQuestions: true,  status: 'active', usedBy: 2, updated: '28 Jun 2026', owner: 'Alia Nasser',      realtimeAlerts: true }),
  makeSeed({ id: 'retention-risk',               name: 'Retention risk assessment',          description: 'Identifies at-risk customers following a service failure event.',           aiQuestions: true,  status: 'active', usedBy: 1, updated: '25 Jun 2026', owner: 'Chen Wei',         realtimeAlerts: true }),
  makeSeed({ id: 'payment-dispute',              name: 'Payment dispute follow-up',          description: 'Post-resolution survey for billing and payment dispute contacts.',          aiQuestions: false, status: 'active', usedBy: 1, updated: '22 Jun 2026', owner: 'Fatima Al-Hassan' }),
  makeSeed({ id: 'service-recovery',             name: 'Service recovery check',             description: 'Measures customer confidence after a service recovery interaction.',        aiQuestions: true,  status: 'active', usedBy: 2, updated: '20 Jun 2026', owner: 'Leon Park',        realtimeAlerts: true }),
  makeSeed({ id: 'ivr-self-service',             name: 'IVR self-service feedback',          description: 'Evaluates IVR containment and self-service satisfaction.',                  aiQuestions: false, status: 'active', usedBy: 1, updated: '18 Jun 2026', owner: 'Tom Belfield',     channel: 'IVR' }),
  makeSeed({ id: 'product-knowledge',            name: 'Product knowledge rating',           description: 'Assesses whether agents demonstrated sufficient product knowledge.',        aiQuestions: false, status: 'active', usedBy: 1, updated: '16 Jun 2026', owner: 'Ravi Mehta' }),
  makeSeed({ id: 'wait-time-satisfaction',       name: 'Wait time satisfaction',             description: 'Dedicated survey for contacts where wait time exceeded the SLA.',           aiQuestions: false, status: 'active', usedBy: 2, updated: '14 Jun 2026', owner: 'Sophie Turner' }),
  makeSeed({ id: 'claims-handling',              name: 'Claims handling review',             description: 'Post-claims survey measuring clarity, speed, and empathy.',                 aiQuestions: true,  status: 'active', usedBy: 3, updated: '12 Jun 2026', owner: 'James Okafor',     realtimeAlerts: true }),
  makeSeed({ id: 'account-closure',              name: 'Account closure exit survey',        description: 'Captures reason and sentiment on account closure interactions.',            aiQuestions: true,  status: 'active', usedBy: 1, updated: '10 Jun 2026', owner: 'Chen Wei',         realtimeAlerts: true }),
  makeSeed({ id: 'digital-channel-pref',         name: 'Digital channel preference',         description: 'Lightweight survey capturing preferred digital contact channel.',           aiQuestions: false, status: 'active', usedBy: 1, updated: '08 Jun 2026', owner: 'Maria Cohen' }),
  makeSeed({ id: 'repeat-contact-diag',          name: 'Repeat contact diagnostic',          description: 'Targets customers who contacted more than once for the same issue.',        aiQuestions: true,  status: 'active', usedBy: 2, updated: '06 Jun 2026', owner: 'Priya Raman',      realtimeAlerts: true }),
  makeSeed({ id: 'cx-benchmark-q1',              name: 'CX benchmark — Q1',                  description: 'Quarterly CX benchmark survey for Q1 reporting.',                           aiQuestions: false, status: 'active', usedBy: 5, updated: '04 Jun 2026', owner: 'James Okafor' }),
  makeSeed({ id: 'cx-benchmark-q2',              name: 'CX benchmark — Q2',                  description: 'Quarterly CX benchmark survey for Q2 reporting.',                           aiQuestions: false, status: 'active', usedBy: 5, updated: '02 Jun 2026', owner: 'James Okafor' }),
  makeSeed({ id: 'cx-benchmark-q3',              name: 'CX benchmark — Q3',                  description: 'Quarterly CX benchmark survey for Q3 reporting.',                           aiQuestions: false, status: 'active', usedBy: 5, updated: '01 Jun 2026', owner: 'James Okafor' }),
  makeSeed({ id: 'email-support-csat',           name: 'Email support CSAT',                 description: 'Satisfaction survey for email-channel support interactions.',               aiQuestions: false, status: 'active', usedBy: 2, updated: '28 May 2026', owner: 'Sophie Turner' }),
  makeSeed({ id: 'social-media-support',         name: 'Social media support',               description: 'Short survey for contacts originating from social media channels.',         aiQuestions: true,  status: 'active', usedBy: 1, updated: '25 May 2026', owner: 'Leon Park',        realtimeAlerts: true }),
  makeSeed({ id: 'chatbot-handoff-quality',      name: 'Chatbot handoff quality',            description: 'Evaluates smoothness of bot-to-agent handoff in digital journeys.',         aiQuestions: true,  status: 'active', usedBy: 2, updated: '22 May 2026', owner: 'Ravi Mehta',       realtimeAlerts: true }),
  makeSeed({ id: 'scheduling-satisfaction',      name: 'Scheduling satisfaction',            description: 'Post-scheduling survey for appointment or callback booking contacts.',      aiQuestions: false, status: 'active', usedBy: 1, updated: '20 May 2026', owner: 'Alia Nasser' }),
  makeSeed({ id: 'policy-explanation',           name: 'Policy explanation clarity',         description: 'Assesses whether policy information was clearly communicated.',             aiQuestions: false, status: 'active', usedBy: 1, updated: '18 May 2026', owner: 'Fatima Al-Hassan' }),
  makeSeed({ id: 'churn-prevention',             name: 'Churn prevention survey',            description: 'Targets customers flagged at risk of churn within the next 30 days.',       aiQuestions: true,  status: 'active', usedBy: 3, updated: '15 May 2026', owner: 'Chen Wei',         realtimeAlerts: true }),
  makeSeed({ id: 'credit-dispute',               name: 'Credit dispute resolution',          description: 'Post-resolution satisfaction check for credit-related dispute contacts.',   aiQuestions: false, status: 'active', usedBy: 1, updated: '12 May 2026', owner: 'Tom Belfield' }),
  makeSeed({ id: 'account-setup',                name: 'Account setup experience',           description: 'Captures experience quality during new account creation contacts.',         aiQuestions: false, status: 'active', usedBy: 2, updated: '10 May 2026', owner: 'Maria Cohen' }),
  makeSeed({ id: 'app-support-satisfaction',     name: 'App support satisfaction',           description: 'Measures satisfaction after app-related technical support contacts.',       aiQuestions: true,  status: 'active', usedBy: 1, updated: '08 May 2026', owner: 'Ravi Mehta',       realtimeAlerts: true }),
  makeSeed({ id: 'enterprise-onboarding',        name: 'Enterprise onboarding',              description: 'Long-form survey for enterprise account onboarding journeys.',              aiQuestions: true,  status: 'active', usedBy: 2, updated: '05 May 2026', owner: 'Sophie Turner',    realtimeAlerts: true }),
  makeSeed({ id: 'incident-resolution-sev1',     name: 'Incident resolution — severity 1',   description: 'Post-resolution survey for P1 incidents requiring executive escalation.',   aiQuestions: true,  status: 'active', usedBy: 1, updated: '02 May 2026', owner: 'James Okafor',     realtimeAlerts: true }),
  makeSeed({ id: 'sla-compliance-feedback',      name: 'SLA compliance feedback',            description: 'Sent when a contact resolution exceeded the agreed service level.',         aiQuestions: false, status: 'active', usedBy: 1, updated: '28 Apr 2026', owner: 'Leon Park' }),
  makeSeed({ id: 'it-helpdesk-satisfaction',     name: 'IT helpdesk satisfaction',           description: 'Internal IT helpdesk CSAT, distributed to employees post-ticket.',         aiQuestions: false, status: 'active', usedBy: 2, updated: '25 Apr 2026', owner: 'Tom Belfield' }),
  makeSeed({ id: 'fraud-alert-follow-up',        name: 'Fraud alert follow-up',              description: 'Assesses customer confidence after a confirmed fraud alert interaction.',   aiQuestions: true,  status: 'active', usedBy: 2, updated: '22 Apr 2026', owner: 'Fatima Al-Hassan', realtimeAlerts: true }),
  makeSeed({ id: 'identity-verification',        name: 'Identity verification rating',       description: 'Short satisfaction check after identity verification contacts.',            aiQuestions: false, status: 'active', usedBy: 1, updated: '20 Apr 2026', owner: 'Chen Wei' }),
  makeSeed({ id: 'regulatory-disclosure',        name: 'Regulatory disclosure check',        description: 'Confirms that required disclosures were understood by the customer.',       aiQuestions: false, status: 'active', usedBy: 1, updated: '18 Apr 2026', owner: 'James Okafor' }),
  makeSeed({ id: 'field-service-satisfaction',   name: 'Field service satisfaction',         description: 'Post-visit survey for field technician and engineer dispatch contacts.',    aiQuestions: false, status: 'active', usedBy: 2, updated: '15 Apr 2026', owner: 'Alia Nasser' }),
  makeSeed({ id: 'remote-support-feedback',      name: 'Remote support feedback',            description: 'Captures satisfaction from remote desktop or co-browse support sessions.',  aiQuestions: false, status: 'active', usedBy: 1, updated: '12 Apr 2026', owner: 'Ravi Mehta' }),
  makeSeed({ id: 'partnership-support',          name: 'Partnership support rating',         description: 'Measures satisfaction for contacts relating to partner accounts.',          aiQuestions: false, status: 'active', usedBy: 1, updated: '10 Apr 2026', owner: 'Leon Park' }),
  makeSeed({ id: 'loyalty-program-feedback',     name: 'Loyalty program feedback',           description: 'Survey for customers enquiring about or enrolling in loyalty programs.',    aiQuestions: true,  status: 'active', usedBy: 3, updated: '08 Apr 2026', owner: 'Maria Cohen',      realtimeAlerts: true }),
  makeSeed({ id: 'upsell-experience',            name: 'Upsell experience check',            description: 'Assesses how customers perceived an upsell or cross-sell interaction.',     aiQuestions: true,  status: 'active', usedBy: 2, updated: '05 Apr 2026', owner: 'Sophie Turner',    realtimeAlerts: true }),
  makeSeed({ id: 'premium-support-rating',       name: 'Premium support rating',             description: 'Dedicated survey for customers on a premium or SLA-backed support tier.',   aiQuestions: false, status: 'active', usedBy: 1, updated: '02 Apr 2026', owner: 'Chen Wei' }),
  makeSeed({ id: 'cancellation-prevention',      name: 'Cancellation prevention',            description: 'Sent after a successful retention save following a cancellation request.',  aiQuestions: true,  status: 'active', usedBy: 2, updated: '28 Mar 2026', owner: 'Priya Raman',      realtimeAlerts: true }),
  makeSeed({ id: 'knowledge-base-effectiveness', name: 'Knowledge base effectiveness',       description: 'Checks whether the agent directed the customer to self-serve content.',     aiQuestions: false, status: 'active', usedBy: 1, updated: '25 Mar 2026', owner: 'Ravi Mehta' }),
  makeSeed({ id: 'back-office-resolution',       name: 'Back-office resolution',             description: 'Tracks satisfaction for contacts that required back-office processing.',    aiQuestions: false, status: 'active', usedBy: 1, updated: '22 Mar 2026', owner: 'James Okafor' }),
  makeSeed({ id: 'multilingual-support',         name: 'Multilingual support check',         description: 'Assesses language handling quality on multilingual support contacts.',      aiQuestions: false, status: 'active', usedBy: 1, updated: '20 Mar 2026', owner: 'Fatima Al-Hassan' }),
  makeSeed({ id: 'proactive-outreach',           name: 'Proactive outreach response',        description: 'Captures sentiment on outbound proactive notification contacts.',           aiQuestions: true,  status: 'active', usedBy: 2, updated: '18 Mar 2026', owner: 'Leon Park',        realtimeAlerts: true }),
  makeSeed({ id: 'compliance-query',             name: 'Compliance query feedback',          description: 'Post-contact survey for regulatory and compliance-related enquiries.',      aiQuestions: false, status: 'active', usedBy: 1, updated: '15 Mar 2026', owner: 'Fatima Al-Hassan' }),
  makeSeed({ id: 'appointment-follow-up',        name: 'Appointment follow-up',              description: 'Satisfaction check sent after a scheduled appointment is completed.',       aiQuestions: false, status: 'active', usedBy: 2, updated: '12 Mar 2026', owner: 'Alia Nasser' }),
  /* 15 live surveys with no linked programs ─ usedBy: 0 */
  makeSeed({ id: 'dispatch-quality',             name: 'Dispatch quality rating',            description: 'Quality check for contacts involving field dispatch or logistics teams.',    aiQuestions: false, status: 'active', usedBy: 0, updated: '10 Mar 2026', owner: 'Tom Belfield' }),
  makeSeed({ id: 'vendor-onboarding',            name: 'Vendor onboarding check',            description: 'Satisfaction survey for vendor and supplier onboarding contacts.',          aiQuestions: false, status: 'active', usedBy: 0, updated: '08 Mar 2026', owner: 'James Okafor' }),
  makeSeed({ id: 'subscription-management',      name: 'Subscription management',            description: 'Survey for contacts relating to subscription changes or renewals.',         aiQuestions: true,  status: 'active', usedBy: 0, updated: '06 Mar 2026', owner: 'Chen Wei' }),
  makeSeed({ id: 'refund-experience',            name: 'Refund experience check',            description: 'Post-resolution satisfaction for refund processing contacts.',              aiQuestions: false, status: 'active', usedBy: 0, updated: '04 Mar 2026', owner: 'Sophie Turner' }),
  makeSeed({ id: 'device-return-survey',         name: 'Device return survey',               description: 'Assesses experience for contacts relating to device returns or exchanges.',  aiQuestions: false, status: 'active', usedBy: 0, updated: '28 Feb 2026', owner: 'Leon Park' }),
  makeSeed({ id: 'security-incident',            name: 'Security incident response',         description: 'Post-incident survey for contacts flagged as security-related.',            aiQuestions: true,  status: 'active', usedBy: 0, updated: '25 Feb 2026', owner: 'Fatima Al-Hassan', realtimeAlerts: true }),
  makeSeed({ id: 'data-privacy-inquiry',         name: 'Data privacy inquiry',               description: 'Captures satisfaction on contacts relating to data subject requests.',      aiQuestions: false, status: 'active', usedBy: 0, updated: '22 Feb 2026', owner: 'Fatima Al-Hassan' }),
  makeSeed({ id: 'procurement-support',          name: 'Procurement support',                description: 'Survey for procurement and purchasing-related support contacts.',           aiQuestions: false, status: 'active', usedBy: 0, updated: '20 Feb 2026', owner: 'James Okafor' }),
  makeSeed({ id: 'hr-query-resolution',          name: 'HR query resolution',                description: 'Internal HR service satisfaction survey distributed post-ticket.',          aiQuestions: false, status: 'active', usedBy: 0, updated: '18 Feb 2026', owner: 'Alia Nasser' }),
  makeSeed({ id: 'migration-support',            name: 'Migration support check',            description: 'Tracks satisfaction during platform or product migration contacts.',        aiQuestions: true,  status: 'active', usedBy: 0, updated: '15 Feb 2026', owner: 'Ravi Mehta',       realtimeAlerts: true }),
  makeSeed({ id: 'finance-query',                name: 'Finance query resolution',           description: 'Survey for finance and accounts-related support contacts.',                 aiQuestions: false, status: 'active', usedBy: 0, updated: '12 Feb 2026', owner: 'Chen Wei' }),
  makeSeed({ id: 'api-support-feedback',         name: 'API support feedback',               description: 'Developer-focused satisfaction survey for API integration support.',         aiQuestions: false, status: 'active', usedBy: 0, updated: '10 Feb 2026', owner: 'Ravi Mehta' }),
  makeSeed({ id: 'legal-query',                  name: 'Legal query follow-up',              description: 'Satisfaction check for contacts involving legal or contractual queries.',   aiQuestions: false, status: 'active', usedBy: 0, updated: '08 Feb 2026', owner: 'Fatima Al-Hassan' }),
  makeSeed({ id: 'facilities-support',           name: 'Facilities support check',           description: 'Internal facilities management satisfaction survey post-request.',          aiQuestions: false, status: 'active', usedBy: 0, updated: '05 Feb 2026', owner: 'Alia Nasser' }),
  makeSeed({ id: 'password-reset-support',       name: 'Password reset support',             description: 'Quick satisfaction check for identity and password reset contacts.',        aiQuestions: false, status: 'active', usedBy: 0, updated: '02 Feb 2026', owner: 'Tom Belfield' }),
  makeSeed({ id: 'voice-agent-csat',             name: 'Voice agent CSAT',                   description: 'Post-call satisfaction for voice channel contacts across all queues.',       aiQuestions: false, status: 'active', usedBy: 2, updated: '25 Jan 2026', owner: 'Tom Belfield',     channel: 'IVR' }),
  /* ── DRAFT (30) ─────────────────────────────────────────────────────────── */
  makeSeed({ id: 'voice-only-quick-score',       name: 'Voice-only quick score',             description: 'Single-question quick score, IVR only.',                                    aiQuestions: true,  status: 'draft',  usedBy: 0, updated: '05 Jun 2026', owner: 'Tom Belfield',     channel: 'IVR' }),
  makeSeed({ id: 'cx-benchmark-q4',              name: 'CX benchmark — Q4',                  description: 'Quarterly CX benchmark survey for Q4 reporting, in draft for review.',      aiQuestions: true,  status: 'draft',  usedBy: 0, updated: '20 Jul 2026', owner: 'James Okafor' }),
  makeSeed({ id: 'holiday-peak-survey',          name: 'Holiday peak survey',                description: 'Seasonal survey variant for high-volume holiday contact periods.',           aiQuestions: true,  status: 'draft',  usedBy: 0, updated: '18 Jul 2026', owner: 'Maria Cohen' }),
  makeSeed({ id: 'new-product-launch',           name: 'New product launch feedback',        description: 'Survey drafted for an upcoming product launch campaign.',                   aiQuestions: true,  status: 'draft',  usedBy: 0, updated: '15 Jul 2026', owner: 'Sophie Turner' }),
  makeSeed({ id: 'beta-program-experience',      name: 'Beta program experience',            description: 'Feedback survey for customers enrolled in a beta product programme.',       aiQuestions: true,  status: 'draft',  usedBy: 0, updated: '12 Jul 2026', owner: 'Leon Park' }),
  makeSeed({ id: 'ab-test-concise',              name: 'A/B test variant — concise',         description: 'Shorter survey variant for A/B testing against the standard CSAT.',         aiQuestions: true,  status: 'draft',  usedBy: 0, updated: '09 Jul 2026', owner: 'Ravi Mehta' }),
  makeSeed({ id: 'weekend-support-pilot',        name: 'Weekend support pilot',              description: 'Pilot survey for the weekend-only extended support team.',                  aiQuestions: true,  status: 'draft',  usedBy: 0, updated: '06 Jul 2026', owner: 'Alia Nasser' }),
  makeSeed({ id: 'proactive-chat-trial',         name: 'Proactive chat trial',               description: 'Pilot survey linked to the proactive chat outreach experiment.',            aiQuestions: true,  status: 'draft',  usedBy: 0, updated: '03 Jul 2026', owner: 'Chen Wei' }),
  makeSeed({ id: 'ivr-redesign-pilot',           name: 'IVR redesign pilot',                 description: 'Pilot survey attached to the IVR menu redesign initiative.',                aiQuestions: true,  status: 'draft',  usedBy: 0, updated: '30 Jun 2026', owner: 'Tom Belfield',     channel: 'IVR' }),
  makeSeed({ id: 'digital-first-contact-pilot',  name: 'Digital first contact pilot',        description: 'Draft survey for the digital-first contact resolution pilot programme.',    aiQuestions: true,  status: 'draft',  usedBy: 0, updated: '27 Jun 2026', owner: 'Priya Raman' }),
  makeSeed({ id: 'agent-tone-experiment',        name: 'Agent tone experiment',              description: 'Experimental survey measuring tone perception across agent cohorts.',       aiQuestions: true,  status: 'draft',  usedBy: 0, updated: '24 Jun 2026', owner: 'Sophie Turner' }),
  makeSeed({ id: 'short-form-csat-1q',           name: 'Short-form CSAT — 1 question',       description: 'Single-question CSAT variant for lowest-friction measurement.',              aiQuestions: true,  status: 'draft',  usedBy: 0, updated: '21 Jun 2026', owner: 'Maria Cohen' }),
  makeSeed({ id: 'long-form-diagnostic',         name: 'Long-form diagnostic',               description: 'Extended diagnostic survey for deep-dive programme analysis.',              aiQuestions: true,  status: 'draft',  usedBy: 0, updated: '18 Jun 2026', owner: 'James Okafor' }),
  makeSeed({ id: 'accessibility-pilot',          name: 'Accessibility pilot',                description: 'Accessibility-first survey variant for contacts with special requirements.', aiQuestions: true,  status: 'draft',  usedBy: 0, updated: '15 Jun 2026', owner: 'Fatima Al-Hassan' }),
  makeSeed({ id: 'video-support-rating',         name: 'Video support rating',               description: 'Draft survey for the forthcoming video support channel.',                   aiQuestions: true,  status: 'draft',  usedBy: 0, updated: '12 Jun 2026', owner: 'Ravi Mehta' }),
  makeSeed({ id: 'async-messaging-check',        name: 'Async messaging check',              description: 'Survey designed for asynchronous messaging channels pending launch.',       aiQuestions: true,  status: 'draft',  usedBy: 0, updated: '09 Jun 2026', owner: 'Leon Park' }),
  makeSeed({ id: 'ai-draft-billing',             name: 'AI draft — billing',                 description: 'AI-generated draft survey for billing topic interactions, under review.',   aiQuestions: true,  status: 'draft',  usedBy: 0, updated: '06 Jun 2026', owner: 'Priya Raman' }),
  makeSeed({ id: 'ai-draft-tech-support',        name: 'AI draft — tech support',            description: 'AI-generated draft for technical support contacts, awaiting approval.',     aiQuestions: true,  status: 'draft',  usedBy: 0, updated: '03 Jun 2026', owner: 'Priya Raman' }),
  makeSeed({ id: 'ai-draft-complaints',          name: 'AI draft — complaints',              description: 'AI-generated draft for complaints handling, pending stakeholder sign-off.',  aiQuestions: true,  status: 'draft',  usedBy: 0, updated: '01 Jun 2026', owner: 'Priya Raman' }),
  makeSeed({ id: 'ai-draft-retention',           name: 'AI draft — retention',               description: 'AI-generated retention survey draft, under CX team review.',                aiQuestions: true,  status: 'draft',  usedBy: 0, updated: '28 May 2026', owner: 'Chen Wei' }),
  makeSeed({ id: 'seasonal-check-in',            name: 'Seasonal check-in',                  description: 'Seasonal satisfaction survey planned for Q3 campaign window.',              aiQuestions: true,  status: 'draft',  usedBy: 0, updated: '25 May 2026', owner: 'Alia Nasser' }),
  makeSeed({ id: 'post-automation-survey',       name: 'Post-automation survey',             description: 'Survey drafted for interactions fully resolved by automation.',              aiQuestions: true,  status: 'draft',  usedBy: 0, updated: '22 May 2026', owner: 'Ravi Mehta' }),
  makeSeed({ id: 'journey-pilot-onboarding',     name: 'Journey pilot — onboarding',         description: 'Journey-level survey tracking sentiment across the onboarding arc.',         aiQuestions: true,  status: 'draft',  usedBy: 0, updated: '19 May 2026', owner: 'Sophie Turner' }),
  makeSeed({ id: 'journey-pilot-renewal',        name: 'Journey pilot — renewal',            description: 'Journey-level survey drafted for contract and subscription renewal arc.',    aiQuestions: true,  status: 'draft',  usedBy: 0, updated: '16 May 2026', owner: 'Sophie Turner' }),
  makeSeed({ id: 'journey-pilot-upgrade',        name: 'Journey pilot — upgrade',            description: 'Journey-level survey draft for the product upgrade path.',                   aiQuestions: true,  status: 'draft',  usedBy: 0, updated: '13 May 2026', owner: 'Chen Wei' }),
  makeSeed({ id: 'return-experience-pilot',      name: 'Return experience pilot',            description: 'Draft survey for the returns and exchange experience pilot.',               aiQuestions: true,  status: 'draft',  usedBy: 0, updated: '10 May 2026', owner: 'Leon Park' }),
  makeSeed({ id: 'cobrowse-satisfaction',        name: 'Co-browse satisfaction',             description: 'Draft satisfaction survey for co-browsing session contacts.',               aiQuestions: true,  status: 'draft',  usedBy: 0, updated: '07 May 2026', owner: 'Tom Belfield' }),
  makeSeed({ id: 'agent-availability-rating',    name: 'Agent availability rating',          description: 'Draft survey measuring perceived agent availability and response speed.',    aiQuestions: true,  status: 'draft',  usedBy: 0, updated: '04 May 2026', owner: 'Maria Cohen' }),
  makeSeed({ id: 'complaint-acknowledgement',    name: 'Complaint acknowledgement',          description: 'Draft survey sent after a formal complaint is acknowledged.',               aiQuestions: true,  status: 'draft',  usedBy: 0, updated: '01 May 2026', owner: 'James Okafor' }),
  makeSeed({ id: 'service-desk-rating',          name: 'Service desk rating',                description: 'Draft internal service desk CSAT pending HR sign-off.',                     aiQuestions: true,  status: 'draft',  usedBy: 0, updated: '28 Apr 2026', owner: 'Alia Nasser' }),
]

const DEFAULT_DESIGN: SurveyDesign = {
  id: '',
  name: 'Post Interaction CSAT',
  description: 'Captures customer satisfaction immediately after each interaction to track quality and identify coaching opportunities.',
  channel: 'Digital',
  surveyType: 'CSAT (1–5 Star)',
  displayStyle: 'Quick Reply',
  listPickerLabel: 'Rate your experience',
  welcomeMode: 'with-optout',
  welcomeMessage: "We'd love to hear about your experience today. We have just a few quick questions, just two minutes of your time. Press 1 to start the survey, or press 2 to skip the survey.",
  buttonToStart: 'Get started',
  buttonToOptOut: 'Not today',
  aiQuestions: true,
  sendGenericQuestion: true,
  questionModeDigital: 'ai',
  questionModeIVR: 'ai',
  standardQuestionsDigital: [],
  standardQuestionsIVR: [],
  defaultScaleQuestion: 'On a scale of 1 to 5, how would you rate your experience today?',
  defaultCommentQuestion: 'What could we have done better?',
  maxQuestions: 2,
  freeText: 'Conditional',
  expiryMinutes: 2880,
  realtimeAlerts: true,
  status: 'active',
  updated: '',
  owner: '',
}

const QUESTION_BANK: QuestionDef[] = [
  { id: 'q1',  text: 'How do you rate your overall chat experience with us today?',                                                          type: 'scale', fallbackText: 'How do you rate your overall chat experience with us today? Please answer on a 1-5 scale where 5 is excellent.' },
  { id: 'q2',  text: 'How satisfied were you with the level of effort required to resolve your question or issue?',                         type: 'scale' },
  { id: 'q3',  text: 'Did we fully resolve the reason(s) you got in touch with us?',                                                        type: 'yesno' },
  { id: 'q4',  text: 'What do you think about the speed of the responses you received?',                                                    type: 'text' },
  { id: 'q5',  text: 'How many times before have you contacted NICE CXone about this query?',                                               type: 'select', options: ['None', '1', '2', '3', '>3'], fallbackText: 'How many times before have you contacted NICE CXone about this query? Please reply by typing 1 for none, 2 for once, 3 for twice, 4 for thrice or 5 for more than thrice.' },
  { id: 'q6',  text: 'Did you get in touch with us in any other way before using live chat?',                                               type: 'yesno' },
  { id: 'q7',  text: 'How else did you contact NICE CXone with your query?',                                                                type: 'select', options: ['Live Chat', 'Telephone', 'Whats App', 'Social Media', 'More than one of these'], fallbackText: 'How else did you contact NICE CXone with your query? Please reply by typing 1 for Live Chat, 2 for Telephone, 3 for Whats App, 4 for Social Media or 5 for More than one of these.' },
  { id: 'q8',  text: "What are the key pieces of feedback you'd like us to take away about your chat experience with NICE CXone?",          type: 'text' },
  { id: 'q9',  text: 'Provide any specific suggestions you have for improving the chat experience. Enter your comments below.',             type: 'text' },
  { id: 'q10', text: "Thinking about NICE CXone's services, how likely are you to recommend us to a friend or family member?",              type: 'nps' },
  { id: 'q11', text: "Thinking about NICE CXone's services, how likely are you to recommend us to a colleague or a friend?",               type: 'nps' },
  { id: 'q12', text: 'Please describe the factors that contributed to your stated likelihood to recommend NICE CXone?',                    type: 'text' },
]

const TEMPLATE_BANK_IDS = ['q1', 'q2', 'q3', 'q4']

const Q_TYPE_META: Record<string, { label: string; color: string; bg: string }> = {
  scale:  { label: '1–5 Scale',     color: 'var(--lyra-color-status-info-strong)',    bg: 'var(--lyra-color-status-info-subtle)' },
  nps:    { label: '0–10 Scale',    color: 'var(--lyra-brand-700)',                   bg: 'var(--lyra-brand-50)' },
  yesno:  { label: 'Yes / No',      color: 'var(--lyra-color-status-success-strong)', bg: 'var(--lyra-color-status-success-subtle)' },
  select: { label: 'Single Select', color: 'var(--lyra-color-status-warning-strong)', bg: 'var(--lyra-color-status-warning-subtle)' },
  text:   { label: 'Free Text',     color: 'var(--lyra-slate-600)',                   bg: 'var(--lyra-slate-100)' },
}

// ── DesignRowActions ──────────────────────────────────────────────────────────

function DesignRowActions({
  design,
  onEdit,
  onDelete,
  onDuplicate,
  deleteDisabled,
}: {
  design: SurveyDesign
  onEdit: (d: SurveyDesign) => void
  onDelete: (id: string) => void
  onDuplicate: (d: SurveyDesign) => void
  deleteDisabled: boolean
}) {
  const [open, setOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (
        btnRef.current && !btnRef.current.contains(e.target as Node) &&
        menuRef.current && !menuRef.current.contains(e.target as Node)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  function handleOpen(e: React.MouseEvent) {
    e.stopPropagation()
    if (!btnRef.current) return
    const r = btnRef.current.getBoundingClientRect()
    setMenuPos({ top: r.bottom + 4, right: window.innerWidth - r.right })
    setOpen(o => !o)
  }

  return (
    <div style={{ display: 'inline-flex' }} onClick={e => e.stopPropagation()}>
      <button
        ref={btnRef}
        aria-label="Row actions"
        onClick={handleOpen}
        title="Actions"
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 28, height: 28, borderRadius: 'var(--radius-sm)',
          border: 'none', background: 'transparent',
          color: 'var(--lyra-color-fg-action)', cursor: 'pointer',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" stroke="none">
          <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
        </svg>
      </button>
      {open && createPortal(
        <div
          ref={menuRef}
          onClick={e => e.stopPropagation()}
          style={{
            position: 'fixed', top: menuPos.top, right: menuPos.right, zIndex: 9999,
            minWidth: 160, background: 'var(--lyra-color-bg-surface-overlay)',
            border: '1px solid var(--lyra-color-border-soft)', borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--sol-effect-shadowlg)', padding: '4px 0', overflow: 'hidden',
          }}
        >
          <button
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 12px', border: 'none', background: 'transparent',
              color: 'var(--lyra-color-fg-default)', fontSize: 14, cursor: 'pointer', textAlign: 'left',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            onClick={() => { onEdit(design); setOpen(false) }}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
            </svg>
            Edit Survey
          </button>
          <button
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 12px', border: 'none', background: 'transparent',
              color: 'var(--lyra-color-fg-default)', fontSize: 14, cursor: 'pointer', textAlign: 'left',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            onClick={() => { onDuplicate(design); setOpen(false) }}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            Duplicate Survey
          </button>

          <div style={{ height: 1, background: 'var(--lyra-color-border-subtle)', margin: '4px 0' }} />
          <button
            disabled={deleteDisabled}
            onClick={() => { if (!deleteDisabled) { onDelete(design.id); setOpen(false) } }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 12px', border: 'none', background: 'transparent',
              color: deleteDisabled ? 'var(--lyra-color-fg-disabled)' : 'var(--lyra-color-status-critical-strong)',
              fontSize: 14, cursor: deleteDisabled ? 'not-allowed' : 'pointer',
              opacity: deleteDisabled ? 0.5 : 1, textAlign: 'left',
            }}
            onMouseEnter={e => { if (!deleteDisabled) (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-status-critical-subtle)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
            </svg>
            Delete
          </button>
        </div>,
        document.body
      )}
    </div>
  )
}

// ── SortIcon ──────────────────────────────────────────────────────────────────

function SortIcon({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      style={{ marginLeft: 4, verticalAlign: '-1px', opacity: active ? 1 : 0.3, color: active ? 'var(--lyra-color-fg-link)' : 'currentColor', flexShrink: 0 }}>
      {(!active || dir === 'asc')  && <polyline points="4 10 8 6 12 10" style={{ opacity: active && dir === 'asc'  ? 1 : 0.4 }}/>}
      {(!active || dir === 'desc') && <polyline points="4 6 8 10 12 6"  style={{ opacity: active && dir === 'desc' ? 1 : 0.4 }}/>}
    </svg>
  )
}

// ── TypeBadge — dot + label indicator for Contextual / Manual ─────────────────

function TypeBadge({ type }: { type: 'Contextual' | 'Manual' }) {
  const isContextual = type === 'Contextual'
  return (
    <span style={{
      font: '500 14px/20px var(--font-sans)',
      color: isContextual ? 'var(--lyra-color-fg-ai)' : 'var(--lyra-color-fg-secondary)',
    }}>
      {type}
    </span>
  )
}

// ── CreateSurveyModal ─────────────────────────────────────────────────────────

function CubeIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2.5L17 6.5V13.5L10 17.5L3 13.5V6.5L10 2.5Z"/>
      <path d="M10 2.5V17.5"/>
      <path d="M3 6.5L10 10.5L17 6.5"/>
    </svg>
  )
}

function CreateSurveyModal({
  onConfirm,
  onClose,
}: {
  onConfirm: (type: 'Contextual' | 'Manual') => void
  onClose: () => void
}) {
  const [hoveredCard, setHoveredCard] = useState<'ai' | 'manual' | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const CARD_BASE: React.CSSProperties = {
    display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)',
    padding: 'var(--space-4)', borderRadius: 'var(--radius-md)',
    cursor: 'pointer', userSelect: 'none',
    transition: 'border-color 0.12s, background 0.12s',
  }

  const aiHovered = hoveredCard === 'ai'
  const manualHovered = hoveredCard === 'manual'

  const aiCardStyle: React.CSSProperties = {
    ...CARD_BASE,
    border: aiHovered ? '1.5px solid var(--lyra-color-border-active)' : '1px solid var(--lyra-color-border-soft)',
    background: aiHovered ? 'var(--lyra-color-bg-active-subtle)' : 'var(--lyra-color-bg-surface-base)',
  }
  const manualCardStyle: React.CSSProperties = {
    ...CARD_BASE,
    border: manualHovered ? '1px solid var(--lyra-color-border-medium)' : '1px solid var(--lyra-color-border-soft)',
    background: manualHovered ? 'var(--lyra-color-state-bg-hover-opacity)' : 'var(--lyra-color-bg-surface-base)',
  }

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.24)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-survey-title"
        style={{
          background: 'var(--lyra-color-bg-surface-overlay)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--sol-effect-shadowlg)',
          width: '100%', maxWidth: 600, margin: 'var(--space-7)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 'var(--space-6)',
          borderBottom: '1px solid var(--lyra-color-border-subtle)',
        }}>
          <h2 id="create-survey-title" style={{
            margin: 0, font: '600 20px/28px var(--font-sans)',
            color: 'var(--lyra-color-fg-default)', letterSpacing: '-0.01em',
          }}>
            New survey — choose a creation method
          </h2>
          <button
            aria-label="Close"
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 28, height: 28, borderRadius: 'var(--radius-sm)',
              border: 'none', background: 'transparent', flexShrink: 0,
              color: 'var(--lyra-color-fg-secondary)', cursor: 'pointer',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <line x1="12" y1="4" x2="4" y2="12"/><line x1="4" y1="4" x2="12" y2="12"/>
            </svg>
          </button>
        </div>

        {/* Cards */}
        <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

          {/* AI / Contextual card */}
          <div
            role="button"
            tabIndex={0}
            style={aiCardStyle}
            onClick={() => onConfirm('Contextual')}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onConfirm('Contextual') } }}
            onMouseEnter={() => setHoveredCard('ai')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 'var(--radius-md)',
              background: aiHovered ? 'var(--lyra-color-bg-active-subtle)' : 'var(--lyra-color-bg-surface-shell)',
              border: aiHovered ? '1px solid var(--lyra-color-border-active)' : '1px solid var(--lyra-color-border-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              transition: 'border-color 0.12s, background 0.12s',
            }}>
              <CubeIcon color={aiHovered ? 'var(--lyra-color-fg-link)' : 'var(--lyra-color-fg-secondary)'} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <span style={{
                font: '500 16px/24px var(--font-sans)',
                color: aiHovered ? 'var(--lyra-color-fg-link)' : 'var(--lyra-color-fg-default)',
                transition: 'color 0.12s',
              }}>
                AI - Interaction driven contextual questions
              </span>
              <p style={{ margin: 0, font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)' }}>
                Add the questions you want - OSAT, ASAT, CSAT, Verbatim. The runtime writes the wording from the topic it detects.
              </p>
            </div>
          </div>

          {/* Manual card */}
          <div
            role="button"
            tabIndex={0}
            style={manualCardStyle}
            onClick={() => onConfirm('Manual')}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onConfirm('Manual') } }}
            onMouseEnter={() => setHoveredCard('manual')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 'var(--radius-md)',
              background: 'var(--lyra-color-bg-surface-shell)',
              border: '1px solid var(--lyra-color-border-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <CubeIcon color="var(--lyra-color-fg-secondary)" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <span style={{ font: '500 16px/24px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>
                Manual survey
              </span>
              <p style={{ margin: 0, font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)' }}>
                You author every question. Start blank, start from a template, or draft with AI and edit each one by hand.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>,
    document.body
  )
}

// ── SurveyDesignsGrid ─────────────────────────────────────────────────────────

const TH_STYLE: React.CSSProperties = {
  height: 48,
  padding: '0 var(--space-4)',
  textAlign: 'left',
  font: '500 14px/20px var(--font-sans)',
  color: 'var(--lyra-color-fg-default)',
  borderBottom: '1px solid var(--lyra-color-border-soft)',
  whiteSpace: 'nowrap',
  userSelect: 'none',
  background: 'transparent',
}

function SurveyDesignsGrid({
  onCreate,
  onOpen,
  onEdit,
  onDuplicate,
  newDesigns = [],
  highlightId,
}: {
  onCreate: (type: 'Contextual' | 'Manual') => void
  onOpen: (d: SurveyDesign) => void
  onEdit: (d: SurveyDesign) => void
  onDuplicate: (d: SurveyDesign) => void
  newDesigns?: SurveyDesign[]
  highlightId?: string | null
}) {
  const [search, setSearch] = useState('')
  const [deletedIds, setDeletedIds] = useState<string[]>([])
  const [sortCol, setSortCol] = useState<'date' | 'programs'>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [typeFilter, setTypeFilter] = useState<'' | 'Contextual' | 'Manual'>('')
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const typeOf = (d: SurveyDesign): 'Contextual' | 'Manual' => (d.aiQuestions ? 'Contextual' : 'Manual')

  const newDesignIds = new Set(newDesigns.map(d => d.id))
  const allDesigns = [...newDesigns, ...SEED_DESIGNS.filter(d => !newDesignIds.has(d.id))]
  const dateSortKey = (d: SurveyDesign) => d._sortTs ?? (new Date(d.updated ?? '').getTime() || 0)
  const rows = allDesigns
    .filter(d => {
      if (deletedIds.includes(d.id)) return false
      if (typeFilter && typeOf(d) !== typeFilter) return false
      if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      const av = sortCol === 'programs' ? (a.usedBy ?? 0) : dateSortKey(a)
      const bv = sortCol === 'programs' ? (b.usedBy ?? 0) : dateSortKey(b)
      return sortDir === 'asc' ? av - bv : bv - av
    })

  const total = allDesigns.filter(d => !deletedIds.includes(d.id)).length
  const isFilterActive = typeFilter !== ''

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: 'var(--lyra-color-bg-surface-base)' }}>
      {createModalOpen && (
        <CreateSurveyModal
          onConfirm={type => { setCreateModalOpen(false); onCreate(type) }}
          onClose={() => setCreateModalOpen(false)}
        />
      )}
      {/* Page header */}
      <ListPageHeader
        title="Surveys"
        breadcrumb="Library"
        actionLabel="New survey"
        onAction={() => setCreateModalOpen(true)}
        tooltipText="A Survey defines the questions asked and the experience delivered to customers after an interaction."
      />

      {/* Scrollable content frame — pt-32 px-32 pb-0 per Figma */}
      <div className="flex-1 overflow-auto" style={{ padding: 'var(--space-7) var(--space-7) 0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-7)', minHeight: '100%' }}>

          {/* Description */}
          <p style={{
            margin: 0,
            font: '400 14px/20px var(--font-sans)',
            color: 'var(--lyra-color-fg-default)',
          }}>
            Channel-agnostic definitions — the questions and their scales, nothing else. How they look and read comes from the theme; who is asked comes from the program.
          </p>

          {/* Grid section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>

            {/* Filter bar — above Grid Panel */}
            <div style={{
              display: 'flex', flexWrap: 'wrap', alignItems: 'center',
              gap: 'var(--space-2)', minHeight: 32,
            }}>
              <SearchInput value={search} onChange={setSearch} placeholder="Search Surveys" />

              {/* Query chip: Type: Select */}
              <div style={{
                position: 'relative', display: 'inline-flex', alignItems: 'center',
                height: 32, borderRadius: 'var(--radius-md)',
                border: isFilterActive
                  ? '1px solid var(--lyra-color-border-active)'
                  : '1px solid var(--lyra-color-border-soft)',
                background: isFilterActive
                  ? 'var(--lyra-color-bg-active-subtle)'
                  : 'var(--lyra-color-bg-surface-shell)',
              }}>
                <span style={{
                  paddingLeft: 8,
                  font: '500 14px/20px var(--font-sans)',
                  color: 'var(--lyra-color-fg-default)',
                  whiteSpace: 'nowrap', pointerEvents: 'none',
                }}>
                  Type:
                </span>
                <span style={{
                  padding: '0 4px 0 4px',
                  font: '400 14px/20px var(--font-sans)',
                  color: isFilterActive ? 'var(--lyra-color-fg-active-strong)' : 'var(--lyra-color-fg-secondary)',
                  whiteSpace: 'nowrap', pointerEvents: 'none',
                }}>
                  {typeFilter || 'Select'}
                </span>
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value as '' | 'Contextual' | 'Manual')}
                  style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                  aria-label="Filter by type"
                >
                  <option value="">Select</option>
                  <option value="Contextual">Contextual</option>
                  <option value="Manual">Manual</option>
                </select>
                <ChevronDown size={12} style={{ marginRight: 6, color: 'var(--lyra-color-fg-secondary)', pointerEvents: 'none', flexShrink: 0 }} />
              </div>

              {/* Clear ghost button */}
              {isFilterActive && (
                <button
                  onClick={() => setTypeFilter('')}
                  style={{
                    background: 'none', border: 'none', padding: '0 var(--space-2)',
                    font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-link)',
                    cursor: 'pointer', borderRadius: 'var(--radius-md)',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
                >
                  Clear
                </button>
              )}
            </div>

            {/* Grid Panel */}
            <div style={{ borderRadius: 'var(--lyra-radius-lg, 12px)', overflow: 'hidden' }}>
              {/* Toolbar */}
              <div style={{
                height: 56,
                display: 'flex', alignItems: 'center',
                padding: '0 var(--space-4)',
                borderBottom: '1px solid var(--lyra-color-border-subtle)',
                flexShrink: 0,
              }}>
                <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>
                  Surveys - {rows.length}/{total}
                </span>
              </div>

              {/* Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-sans)' }}>
                  <thead>
                    <tr>
                      <th scope="col" style={TH_STYLE}>Survey</th>
                      <th
                        scope="col"
                        style={{ ...TH_STYLE, cursor: 'pointer' }}
                        onClick={() => {
                          if (sortCol === 'programs') setSortDir(d => d === 'asc' ? 'desc' : 'asc')
                          else { setSortCol('programs'); setSortDir('desc') }
                        }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                          Linked Programs <SortIcon active={sortCol === 'programs'} dir={sortDir} />
                        </span>
                      </th>
                      <th
                        scope="col"
                        style={{ ...TH_STYLE, cursor: 'pointer' }}
                        onClick={() => {
                          if (sortCol === 'date') setSortDir(d => d === 'asc' ? 'desc' : 'asc')
                          else { setSortCol('date'); setSortDir('desc') }
                        }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                          Modified / Created <SortIcon active={sortCol === 'date'} dir={sortDir} />
                        </span>
                      </th>
                      <th scope="col" style={TH_STYLE}>Status</th>
                      <th scope="col" style={TH_STYLE}>Type</th>
                      <th scope="col" style={{ ...TH_STYLE, width: 48 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{
                          height: 120, textAlign: 'center', verticalAlign: 'middle',
                          font: '400 14px/24px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)',
                        }}>
                          No surveys match your search.
                        </td>
                      </tr>
                    )}
                    {rows.map(d => {
                      const isHovered = hoveredId === d.id
                      const isHighlighted = highlightId === d.id
                      const cellBase: React.CSSProperties = {
                        height: 40, padding: '0 var(--space-4)',
                        borderBottom: '1px solid var(--lyra-color-border-subtle)',
                        verticalAlign: 'middle',
                        background: isHighlighted
                          ? 'var(--lyra-color-bg-active-subtle)'
                          : isHovered ? 'var(--lyra-color-state-bg-hover-opacity)' : 'transparent',
                        transition: 'background 0.5s ease',
                      }
                      return (
                        <tr
                          key={d.id}
                          onMouseEnter={() => setHoveredId(d.id)}
                          onMouseLeave={() => setHoveredId(null)}
                          style={{ cursor: 'default' }}
                        >
                          {/* Survey name */}
                          <td style={{ ...cellBase, position: 'relative' }}>
                            {isHovered && (
                              <span style={{
                                position: 'absolute', left: 0, top: 4, bottom: 4,
                                width: 2, borderRadius: 1,
                                background: 'var(--lyra-color-fg-default)',
                              }} />
                            )}
                            <button
                              onClick={() => onOpen(d)}
                              style={{
                                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                                textAlign: 'left', font: '500 14px/20px var(--font-sans)',
                                color: 'var(--lyra-color-fg-link)',
                              }}
                            >
                              {d.name}
                            </button>
                          </td>

                          {/* Linked programs */}
                          <td style={cellBase}>
                            <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>
                              {d.status === 'draft' || !d.usedBy ? '—' : `${d.usedBy} ${d.usedBy === 1 ? 'Program' : 'Programs'}`}
                            </span>
                          </td>

                          {/* Modified */}
                          <td style={cellBase}>
                            <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)' }}>
                              {d.updated || '—'}
                            </span>
                          </td>

                          {/* Status */}
                          <td style={cellBase}>
                            <StatusPill
                              label={d.status === 'draft' ? 'Draft' : 'Live'}
                              tone={d.status === 'draft' ? 'neutral' : 'success'}
                            />
                          </td>

                          {/* Type */}
                          <td style={cellBase}>
                            <TypeBadge type={typeOf(d)} />
                          </td>

                          {/* Actions */}
                          <td style={{ ...cellBase, textAlign: 'right' }}>
                            <div onClick={e => e.stopPropagation()}>
                              <DesignRowActions
                                design={d}
                                onEdit={onEdit}
                                onDuplicate={onDuplicate}
                                onDelete={(id) => setDeleteConfirmId(id)}
                                deleteDisabled={!!d.isDefault || d.status !== 'draft'}
                              />
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete survey confirmation modal — portal to body so it escapes overflow:hidden ancestors */}
      {deleteConfirmId && createPortal(
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9000,
            background: 'rgba(0,0,0,0.32)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => setDeleteConfirmId(null)}
        >
          <div
            style={{
              background: 'var(--lyra-color-bg-surface-base)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
              width: 400,
              padding: 'var(--space-6)',
              display: 'flex', flexDirection: 'column', gap: 'var(--space-4)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <p style={{ margin: 0, font: '600 16px/24px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>
              Delete survey?
            </p>
            <p style={{ margin: 0, font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)' }}>
              This survey is in draft and hasn't been published. Deleting it is permanent and cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <button
                onClick={() => setDeleteConfirmId(null)}
                style={{
                  height: 36, padding: '0 var(--space-4)',
                  border: '1px solid var(--lyra-color-border-soft)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--lyra-color-bg-surface-base)',
                  color: 'var(--lyra-color-fg-default)',
                  font: '500 14px/20px var(--font-sans)',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-bg-surface-base)' }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setDeletedIds(prev => [...prev, deleteConfirmId])
                  setDeleteConfirmId(null)
                }}
                style={{
                  height: 36, padding: '0 var(--space-4)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--lyra-color-bg-destructive)',
                  color: 'var(--lyra-color-fg-on-primary)',
                  font: '500 14px/20px var(--font-sans)',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.88' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
              >
                Delete survey
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

// ── TemplateConfigGroup ───────────────────────────────────────────────────────

function TemplateConfigGroup({
  title,
  num,
  children,
  defaultOpen = true,
}: {
  title: string
  num: number
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section style={{
      border: '1px solid var(--lyra-color-border-soft)',
      borderRadius: 'var(--radius-xl)', overflow: 'hidden',
      marginBottom: open ? 'var(--space-4)' : 'var(--space-3)',
    }}>
      <header
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '16px 24px', cursor: 'pointer', userSelect: 'none',
          background: 'var(--lyra-color-bg-surface-shell)',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-slate-200)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-bg-surface-shell)' }}
        onClick={() => setOpen(!open)}
      >
        <span style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 24, height: 24, borderRadius: 'var(--radius-full)',
          background: 'var(--lyra-color-bg-primary)', color: 'var(--lyra-color-fg-on-primary)',
          fontSize: 12, fontWeight: 600, flexShrink: 0,
        }}>
          {num}
        </span>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--lyra-color-fg-default)', flex: 1 }}>{title}</span>
        <svg
          viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: 'var(--lyra-color-fg-secondary)' }}
        >
          <path d="M3.5 6 8 10.5 12.5 6"/>
        </svg>
      </header>
      {open && <div style={{ padding: '20px 24px', background: 'var(--lyra-color-bg-surface-base)' }}>{children}</div>}
    </section>
  )
}

// ── DefRow ─────────────────────────────────────────────────────────────────────

function DefRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', gap: 16, padding: '8px 0',
      borderBottom: '1px solid var(--lyra-color-border-subtle)', fontSize: 14,
    }}>
      <div style={{ width: 176, flexShrink: 0, color: 'var(--lyra-color-fg-secondary)', fontWeight: 500 }}>{label}</div>
      <div style={{ flex: 1, color: 'var(--lyra-color-fg-default)' }}>{children}</div>
    </div>
  )
}

// ── SurveyTemplateDetail ──────────────────────────────────────────────────────

function SurveyTemplateDetail({
  design,
  onBack,
  onEdit,
}: {
  design: SurveyDesign
  onBack: () => void
  onEdit: (d: SurveyDesign) => void
}) {
  const d = design

  const welcomeLabel: Record<string, string> = {
    'with-optout':    'Invitation with Opt Out',
    'without-optout': 'Invitation without Opt Out',
    'none':           'None',
  }

  const SECTION_LABEL_STYLE: React.CSSProperties = {
    fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.01em',
    color: 'var(--lyra-color-fg-secondary)', marginBottom: 8,
  }
  const SECTION_DIVIDER_STYLE: React.CSSProperties = {
    borderTop: '1px solid var(--lyra-color-border-subtle)', paddingTop: 20, marginBottom: 20,
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'var(--lyra-color-bg-surface-base)',
      borderRadius: 'var(--radius-xl)', border: '1px solid var(--lyra-color-border-soft)',
      overflow: 'hidden',
    }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '16px 32px 0', flexShrink: 0 }}
        className="body-sm">
        <button
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--lyra-color-fg-secondary)', fontSize: 12 }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--lyra-color-fg-default)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--lyra-color-fg-secondary)' }}
          onClick={onBack}
        >Surveys</button>
        <span style={{ color: 'var(--lyra-color-fg-disabled)' }}>/</span>
        <span style={{ color: 'var(--lyra-color-fg-default)', fontWeight: 500, fontSize: 12 }}>{d.name}</span>
      </div>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 32px 16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 className="heading-xl" style={{ color: 'var(--lyra-color-fg-default)', margin: 0 }}>{d.name}</h1>
          <StatusPill
            label={d.status === 'draft' ? 'Draft' : 'Active'}
            tone={d.status === 'draft' ? 'neutral' : 'success'}
          />
        </div>
        <button
          onClick={() => onEdit(d)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '7px 16px', borderRadius: 'var(--radius-md)',
            border: 'none', background: 'var(--lyra-color-bg-primary)',
            color: 'var(--lyra-color-fg-on-primary)', fontSize: 14, fontWeight: 500, cursor: 'pointer',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-primary)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-bg-primary)' }}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
          </svg>
          Edit Template
        </button>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 32px 32px' }}>
        {/* Meta row */}
        <div className="body-sm" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, color: 'var(--lyra-color-fg-secondary)' }}>
          <span><strong style={{ color: 'var(--lyra-color-fg-default)', fontWeight: 500 }}>Owner:</strong> {d.owner}</span>
          <span>·</span>
          <span><strong style={{ color: 'var(--lyra-color-fg-default)', fontWeight: 500 }}>Last Updated:</strong> {d.updated || '—'}</span>
        </div>

        {/* 1 — Identity */}
        <TemplateConfigGroup title="Identity" num={1}>
          <DefRow label="Template Name">{d.name}</DefRow>
          <DefRow label="Description">
            {d.description || <span style={{ color: 'var(--lyra-color-fg-disabled)', fontStyle: 'italic' }}>Not set</span>}
          </DefRow>
        </TemplateConfigGroup>

        {/* 2 — Survey Content */}
        <TemplateConfigGroup title="Survey Content" num={2}>
          <div style={{ marginBottom: 20 }}>
            <div className="heading-xs" style={SECTION_LABEL_STYLE}>Channel</div>
            <DefRow label="Survey Channel">{d.channel || 'Digital'}</DefRow>
          </div>

          <div style={SECTION_DIVIDER_STYLE}>
            <div className="heading-xs" style={SECTION_LABEL_STYLE}>Welcome Message</div>
            <DefRow label="Message Mode">{welcomeLabel[d.welcomeMode] || d.welcomeMode}</DefRow>
            {d.welcomeMode !== 'none' && d.welcomeMessage && (
              <DefRow label="Invitation Text">{d.welcomeMessage}</DefRow>
            )}
            {d.welcomeMode !== 'none' && (
              <>
                <DefRow label="Start Button Label">{d.buttonToStart}</DefRow>
                {d.welcomeMode === 'with-optout' && (
                  <DefRow label="Opt-out Button Label">{d.buttonToOptOut}</DefRow>
                )}
              </>
            )}
          </div>

          <div style={{ borderTop: '1px solid var(--lyra-color-border-subtle)', paddingTop: 20 }}>
            <div className="heading-xs" style={SECTION_LABEL_STYLE}>Rating Format</div>
            <DefRow label="Display Style">{d.displayStyle}</DefRow>
            {d.listPickerLabel && <DefRow label="List Picker Label">{d.listPickerLabel}</DefRow>}
          </div>
        </TemplateConfigGroup>

        {/* 3 — Linked Programs */}
        <TemplateConfigGroup title="Linked Programs" num={3}>
          {d.isDefault ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '40px 24px', textAlign: 'center',
              background: 'var(--lyra-color-bg-surface-shell)',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--lyra-color-border-soft)',
            }}>
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ color: 'var(--lyra-color-fg-disabled)', marginBottom: 12 }}>
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--lyra-color-fg-default)', margin: '0 0 4px' }}>No programs linked yet</p>
              <p className="body-sm" style={{ color: 'var(--lyra-color-fg-secondary)', maxWidth: 360, margin: 0 }}>
                Save this template first, then go to a Program and select this template to link it. Linked programs will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="body-sm" style={{ color: 'var(--lyra-color-fg-secondary)', fontStyle: 'italic', padding: '8px 0' }}>
              No programs are linked to this template.
            </div>
          )}
        </TemplateConfigGroup>
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: '16px 32px',
        borderTop: '1px solid var(--lyra-color-border-subtle)',
        background: 'var(--lyra-color-bg-surface-shell)', flexShrink: 0,
      }}>
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '7px 16px', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--lyra-color-border-soft)',
            background: 'var(--lyra-color-bg-surface-base)',
            color: 'var(--lyra-color-fg-default)', fontSize: 14, fontWeight: 500, cursor: 'pointer',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-bg-surface-base)' }}
        >
          ← Back
        </button>
      </div>
    </div>
  )
}

// ── QuestionWizard ─────────────────────────────────────────────────────────────

const AI_GENERATED_DEFS: QuestionDef[] = [
  { id: 'ai-billing-scale', text: 'How satisfied were you with the support you received for your recent billing enquiry?', type: 'scale' },
  { id: 'ai-billing-text',  text: 'Please tell us what went well or what could have been better during your billing support interaction.', type: 'text' },
]

const AI_DEFAULT_PROMPT = "I would like to create a satisfaction survey with 2 questions. 1st question should be a scale question followed by an open text question. The questions should be related to last customer interaction with an agent on billing enquiry"

function QuestionWizard({
  channelLabel,
  initialSelected,
  onSave,
  onCancel,
}: {
  channelLabel: string
  initialSelected: QuestionItem[]
  onSave: (items: QuestionItem[]) => void
  onCancel: () => void
}) {
  const MAX = 5
  const dragRef = useRef<{ type: 'bank'; id: string } | { type: 'selected'; id: string; index: number } | null>(null)

  const [selected, setSelected] = useState<QuestionItem[]>(() =>
    (initialSelected || []).map(q =>
      typeof q === 'string'
        ? { id: q, scaleLabels: ['', '', '', '', ''], fallbackText: '' }
        : q
    )
  )
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const [dragOverBank, setDragOverBank] = useState(false)
  const [wizardMode, setWizardMode] = useState<'ai' | 'template'>('ai')
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)
  const [editingItem, setEditingItem] = useState<QuestionItem | null>(null)
  const [editingSettingsItem, setEditingSettingsItem] = useState<QuestionItem | null>(null)
  const [showSamplePrompts, setShowSamplePrompts] = useState(false)

  const addAiQuestions = () => {
    setSelected(prev => {
      const withoutAi = prev.filter(q => !AI_GENERATED_DEFS.some(def => def.id === q.id))
      const newItems: QuestionItem[] = AI_GENERATED_DEFS.map(def => ({
        id: def.id,
        editedText: def.text,
        scaleLabels: def.type === 'nps' ? Array(11).fill('') : ['', '', '', '', ''],
        yesnoLabels: def.type === 'yesno' ? ['Yes', 'No'] : undefined,
        displayStyle: 'Quick Reply',
        menuLabel: '',
        fallbackText: def.fallbackText ?? '',
      }))
      return [...withoutAi, ...newItems].slice(0, MAX)
    })
  }

  const selectedIds = selected.map(q => q.id)
  const available = QUESTION_BANK.filter(q => TEMPLATE_BANK_IDS.includes(q.id) && !selectedIds.includes(q.id))
  const atMax = selected.length >= MAX

  const addQuestion = (id: string) => {
    if (atMax) return
    const qDef = QUESTION_BANK.find(x => x.id === id)
    const emptyLabels = qDef?.type === 'nps' ? Array(11).fill('') : ['', '', '', '', '']
    const yesnoLabels = qDef?.type === 'yesno' ? ['Yes', 'No'] : undefined
    setSelected(prev => [...prev, {
      id,
      editedText: qDef?.text ?? '',
      scaleLabels: emptyLabels,
      yesnoLabels,
      displayStyle: 'Quick Reply',
      menuLabel: '',
      fallbackText: qDef?.fallbackText ?? '',
    }])
  }

  const removeQuestion = (id: string) => {
    setSelected(prev => prev.filter(q => q.id !== id))
  }

  const handleDropOnSelected = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault(); e.stopPropagation()
    const src = dragRef.current
    if (!src) return
    if (src.type === 'bank') {
      if (atMax) return
      const qDef = QUESTION_BANK.find(x => x.id === src.id)
      const newItem: QuestionItem = {
        id: src.id,
        editedText: qDef?.text ?? '',
        scaleLabels: qDef?.type === 'nps' ? Array(11).fill('') : ['', '', '', '', ''],
        yesnoLabels: qDef?.type === 'yesno' ? ['Yes', 'No'] : undefined,
        displayStyle: 'Quick Reply',
        menuLabel: '',
        fallbackText: qDef?.fallbackText ?? '',
      }
      const next = [...selected]; next.splice(targetIdx, 0, newItem); setSelected(next)
    } else if (src.type === 'selected') {
      const next = [...selected]
      const [moved] = next.splice(src.index, 1)
      const at = src.index < targetIdx ? targetIdx - 1 : targetIdx
      next.splice(at, 0, moved); setSelected(next)
    }
    setDragOverIdx(null); dragRef.current = null
  }

  const handleDropOnBank = (e: React.DragEvent) => {
    e.preventDefault()
    const src = dragRef.current
    if (src && src.type === 'selected') removeQuestion(src.id)
    dragRef.current = null; setDragOverBank(false)
  }

  return createPortal(
    <>
    {editingItem && (() => {
      const def = findQuestionDef(editingItem.id)
      if (!def) return null
      return (
        <QuestionConfigModal
          item={editingItem}
          def={def}
          onClose={() => setEditingItem(null)}
          onSave={updated => {
            setSelected(prev => prev.map(q => q.id === editingItem.id ? { ...q, ...updated } : q))
          }}
        />
      )
    })()}
    {editingSettingsItem && (() => {
      const def = findQuestionDef(editingSettingsItem.id)
      if (!def) return null
      return (
        <QuestionSettingsModal
          item={editingSettingsItem}
          def={def}
          channelLabel={channelLabel}
          onClose={() => setEditingSettingsItem(null)}
          onSave={updated => {
            setSelected(prev => prev.map(q => q.id === editingSettingsItem.id ? { ...q, ...updated } : q))
          }}
        />
      )
    })()}
    {showSamplePrompts && (
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 960, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.48)' }}
        onClick={e => { if (e.target === e.currentTarget) setShowSamplePrompts(false) }}
      >
        <div
          style={{ background: '#fff', width: '100%', maxWidth: 560, margin: 32, borderRadius: 16, boxShadow: '0 20px 48px rgba(0,0,0,0.18)', overflow: 'hidden' }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
            <h2 style={{ font: '600 17px/22px Inter, sans-serif', color: '#0F172A', margin: 0 }}>Sample Prompts</h2>
            <button onClick={() => setShowSamplePrompts(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 4, borderRadius: 6 }}>
              <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <line x1="12" y1="4" x2="4" y2="12"/><line x1="4" y1="4" x2="12" y2="12"/>
              </svg>
            </button>
          </div>
          <div style={{ padding: 24 }}>
            <div style={{ border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px 16px', background: '#F8FAFC' }}>
              <p style={{ font: '400 13px/20px Inter, sans-serif', color: '#0F172A', margin: '0 0 14px' }}>{AI_DEFAULT_PROMPT}</p>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { setAiPrompt(AI_DEFAULT_PROMPT); setShowSamplePrompts(false) }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8, border: 'none', background: '#126bce', color: '#fff', font: '500 13px/18px Inter, sans-serif', cursor: 'pointer' }}
                >Insert into Prompt</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 800, display: 'flex', alignItems: 'stretch', justifyContent: 'center', background: 'rgba(0,0,0,0.48)' }}
      onClick={e => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div
        style={{ position: 'relative', background: '#fff', width: '100%', maxWidth: 960, margin: '32px auto', borderRadius: 16, display: 'flex', flexDirection: 'column', boxShadow: '0 20px 48px rgba(0,0,0,0.18)', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '20px 28px 16px', borderBottom: '1px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexShrink: 0 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#126bce" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <h2 style={{ font: '600 16px/22px Inter, sans-serif', color: '#0F172A', margin: 0 }}>Add Questions</h2>
            </div>
            {/* Mode toggle */}
            <div style={{ display: 'inline-flex', gap: 8 }}>
              <button
                onClick={() => setWizardMode('ai')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 999, border: wizardMode === 'ai' ? '1.5px solid #E2E8F0' : '1.5px solid #E2E8F0', background: wizardMode === 'ai' ? '#fff' : 'transparent', font: '500 13px/18px Inter, sans-serif', color: '#0F172A', cursor: 'pointer', boxShadow: wizardMode === 'ai' ? '0 1px 4px rgba(0,0,0,0.10)' : 'none', transition: 'all 0.15s' }}
              >
                {/* flame icon */}
                <svg viewBox="0 0 20 20" width="15" height="15" fill="none">
                  <path d="M10 2C10 2 7 6 7 9c0 1.657 1.343 3 3 3s3-1.343 3-3c0-1-.5-2-1-2.5 0 0 .5 3-1.5 3S8 7.5 8 6c0-1.5 2-4 2-4z" fill="#f97316"/>
                  <path d="M10 14c-2.761 0-5 2-5 4h10c0-2-2.239-4-5-4z" fill="#fb923c" opacity=".4"/>
                </svg>
                Create with AI
              </button>
              <button
                onClick={() => setWizardMode('template')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 999, border: wizardMode === 'template' ? '1.5px solid #E2E8F0' : '1.5px solid #E2E8F0', background: wizardMode === 'template' ? '#fff' : 'transparent', font: '500 13px/18px Inter, sans-serif', color: '#0F172A', cursor: 'pointer', boxShadow: wizardMode === 'template' ? '0 1px 4px rgba(0,0,0,0.10)' : 'none', transition: 'all 0.15s' }}
              >
                {/* template icon */}
                <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="14" height="14" rx="2"/><line x1="3" y1="7" x2="17" y2="7"/><line x1="7" y1="7" x2="7" y2="17"/>
                </svg>
                Questions from Template
              </button>
            </div>
          </div>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 4, flexShrink: 0, borderRadius: 6 }}>
            <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <line x1="12" y1="4" x2="4" y2="12"/><line x1="4" y1="4" x2="12" y2="12"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        {wizardMode === 'ai' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '32px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, minHeight: 320 }}>
            <div style={{ textAlign: 'center', maxWidth: 520 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#fff7ed,#ffedd5)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid #fed7aa' }}>
                <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
                  <path d="M12 2C12 2 8.5 7 8.5 11c0 1.933 1.567 3.5 3.5 3.5S15.5 12.933 15.5 11c0-1.2-.6-2.4-1.2-3C14.3 8 14.8 11 12.5 11S9.5 9.5 9.5 8c0-2 2.5-6 2.5-6z" fill="#f97316"/>
                  <path d="M12 17c-3.314 0-6 1.5-6 4h12c0-2.5-2.686-4-6-4z" fill="#fb923c" opacity=".35"/>
                </svg>
              </div>
              <h3 style={{ font: '600 16px/22px Inter, sans-serif', color: '#0F172A', margin: '0 0 8px' }}>Generate questions with AI</h3>
              <p style={{ font: '400 13px/20px Inter, sans-serif', color: '#64748B', margin: '0 0 24px' }}>
                Describe your survey goal and the AI will suggest the most relevant questions for your customers.
              </p>
            </div>
            <div style={{ width: '100%', maxWidth: 560 }}>
              <div style={{ border: '1.5px solid #E2E8F0', borderRadius: 14, background: '#fff', padding: '16px 18px 12px', display: 'flex', flexDirection: 'column' }}>
                <textarea
                  rows={7}
                  maxLength={5000}
                  style={{ width: '100%', font: '400 14px/22px Inter, sans-serif', border: 'none', outline: 'none', resize: 'none', color: '#0F172A', background: 'transparent', padding: 0 }}
                  placeholder="(Provide a detailed description of the survey, including its topic and purpose.)"
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingTop: 10, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                  <button
                    onClick={() => setShowSamplePrompts(true)}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: '400 13px/18px Inter, sans-serif', color: '#c2410c', textDecoration: 'underline' }}
                  >Sample Prompts</button>
                  <span style={{ font: '400 12px/16px Inter, sans-serif', color: '#94A3B8' }}>{aiPrompt.length} / 5000</span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                <button
                  disabled={!aiPrompt.trim() || aiGenerating}
                  onClick={() => {
                    setAiGenerating(true)
                    setTimeout(() => { setAiGenerating(false); addAiQuestions() }, 1800)
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 20px', borderRadius: 8, border: 'none', background: aiPrompt.trim() ? '#126bce' : '#E2E8F0', color: aiPrompt.trim() ? '#fff' : '#94A3B8', font: '500 13px/18px Inter, sans-serif', cursor: aiPrompt.trim() ? 'pointer' : 'not-allowed', transition: 'background 0.15s' }}
                >
                  {aiGenerating ? (
                    <>
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ animation: 'spin 1s linear infinite' }}>
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                      </svg>
                      Generating…
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 20 20" width="14" height="14" fill="none">
                        <path d="M10 2C10 2 7.5 6 7.5 9c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5c0-.8-.4-1.6-.8-2 0 0 .3 2-1.2 2S8 7.5 8 6c0-1.5 2-4 2-4z" fill="currentColor"/>
                      </svg>
                      Generate Questions
                    </>
                  )}
                </button>
              </div>
              {(() => {
                const aiSelectedItems = selected.filter(item => AI_GENERATED_DEFS.some(def => def.id === item.id))
                if (aiSelectedItems.length === 0) return null
                return (
                  <div style={{ marginTop: 20 }}>
                    <div style={{ font: '500 12px/16px Inter, sans-serif', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                      Static Questions Added
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {aiSelectedItems.map(item => {
                        const def = AI_GENERATED_DEFS.find(d => d.id === item.id)!
                        const tm = Q_TYPE_META[def.type] || Q_TYPE_META.text
                        return (
                          <div key={item.id} style={{ padding: '12px 14px', borderRadius: 10, background: '#EFF6FF', border: '1.5px solid #BFDBFE', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                            <svg viewBox="0 0 16 16" width="14" height="14" fill="#94A3B8" style={{ flexShrink: 0, marginTop: 4 }}>
                              <circle cx="5" cy="3.5" r="1.3"/><circle cx="5" cy="8" r="1.3"/><circle cx="5" cy="12.5" r="1.3"/>
                              <circle cx="11" cy="3.5" r="1.3"/><circle cx="11" cy="8" r="1.3"/><circle cx="11" cy="12.5" r="1.3"/>
                            </svg>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                                <span style={{ font: '400 14px/20px Inter, sans-serif', color: '#0F172A' }}>{item.editedText || def.text}</span>
                                <button
                                  onClick={() => setEditingSettingsItem(item)}
                                  title="Settings"
                                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 6, border: 'none', background: 'transparent', color: '#64748B', cursor: 'pointer', flexShrink: 0 }}
                                >
                                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="3"/>
                                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                                  </svg>
                                </button>
                              </div>
                              <div style={{ marginTop: 8 }}>
                                <span style={{ font: '500 11px/16px Inter, sans-serif', color: tm.color, background: tm.bg, padding: '3px 9px', borderRadius: 999 }}>{tm.label}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 14, marginTop: 10 }}>
                                <button
                                  onClick={() => setEditingItem(item)}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 7, border: '1px solid #E2E8F0', background: '#fff', font: '500 12px/16px Inter, sans-serif', color: '#0F172A', cursor: 'pointer', flexShrink: 0 }}
                                >
                                  <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
                                  </svg>
                                  Edit
                                </button>
                                <button
                                  onClick={() => removeQuestion(item.id)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', font: '400 12px/16px Inter, sans-serif', color: '#64748B', padding: 0 }}
                                >Remove</button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        )}

        {wizardMode === 'template' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px', display: 'grid', gridTemplateColumns: '2fr 3fr', gap: 24 }}>

          {/* Left: Question Bank */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ font: '500 12px/16px Inter, sans-serif', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Question Bank</span>
              <span style={{ font: '400 12px/16px Inter, sans-serif', color: '#64748B' }}>{available.length} available</span>
            </div>
            <div
              onDragOver={e => { e.preventDefault(); setDragOverBank(true) }}
              onDragLeave={() => setDragOverBank(false)}
              onDrop={handleDropOnBank}
              style={{ flex: 1, border: '1px solid rgba(0,0,0,0.10)', borderRadius: 10, padding: 10, background: dragOverBank ? 'rgba(0,0,0,0.03)' : '#fafafa', overflowY: 'auto', minHeight: 400, transition: 'background 0.12s' }}
            >
              {available.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 8, color: '#64748B', font: '400 13px/18px Inter, sans-serif', textAlign: 'center' }}>
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  All questions added
                </div>
              )}
              {available.map(q => {
                const tm = Q_TYPE_META[q.type] || Q_TYPE_META.text
                return (
                  <div key={q.id}
                    draggable
                    onDragStart={() => { dragRef.current = { type: 'bank', id: q.id } }}
                    style={{ padding: '12px 14px', marginBottom: 8, borderRadius: 10, background: '#EFF6FF', border: '1.5px solid #BFDBFE', display: 'flex', alignItems: 'flex-start', gap: 10, cursor: atMax ? 'not-allowed' : 'grab', opacity: atMax ? 0.5 : 1, userSelect: 'none' }}
                  >
                    <svg viewBox="0 0 16 16" width="14" height="14" fill="#94A3B8" style={{ flexShrink: 0, marginTop: 4 }}>
                      <circle cx="5" cy="3.5" r="1.3"/><circle cx="5" cy="8" r="1.3"/><circle cx="5" cy="12.5" r="1.3"/>
                      <circle cx="11" cy="3.5" r="1.3"/><circle cx="11" cy="8" r="1.3"/><circle cx="11" cy="12.5" r="1.3"/>
                    </svg>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                        <span style={{ font: '400 14px/20px Inter, sans-serif', color: '#0F172A' }}>{q.text}</span>
                        <button
                          onClick={() => addQuestion(q.id)}
                          disabled={atMax}
                          title={atMax ? 'Maximum 5 questions reached' : 'Add to survey'}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 7, border: '1px solid #E2E8F0', background: '#fff', font: '500 12px/16px Inter, sans-serif', color: '#0F172A', cursor: atMax ? 'not-allowed' : 'pointer', flexShrink: 0 }}
                        >
                          <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round">
                            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                          </svg>
                          Add
                        </button>
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <span style={{ font: '500 11px/14px Inter, sans-serif', color: tm.color, background: tm.bg, padding: '2px 7px', borderRadius: 999 }}>{tm.label}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right: Selected Questions */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ font: '500 12px/16px Inter, sans-serif', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Survey Questions</span>
              <span style={{ font: '500 12px/16px Inter, sans-serif', color: atMax ? '#dc2626' : '#64748B', background: atMax ? '#fee2e2' : 'rgba(0,0,0,0.05)', padding: '3px 10px', borderRadius: 999 }}>{selected.length} / {MAX}</span>
            </div>
            <div
              onDragOver={e => { e.preventDefault(); setDragOverIdx(selected.length) }}
              onDragLeave={() => setDragOverIdx(null)}
              onDrop={e => handleDropOnSelected(e, selected.length)}
              style={{ flex: 1, border: `2px dashed ${dragOverIdx !== null ? '#126bce' : 'rgba(0,0,0,0.12)'}`, borderRadius: 10, padding: 10, background: selected.length === 0 ? '#fafafa' : '#fff', minHeight: 400, overflowY: 'auto', transition: 'border-color 0.15s' }}
            >
              {selected.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 240, gap: 10, color: '#64748B', font: '400 13px/18px Inter, sans-serif', textAlign: 'center', padding: '0 24px' }}>
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  <div>Click a question in the bank to add it,<br/>or drag it across.</div>
                  <div style={{ font: '400 12px/16px Inter, sans-serif' }}>Up to {MAX} questions allowed.</div>
                </div>
              )}
              {selected.map((item, idx) => {
                const q = QUESTION_BANK.find(x => x.id === item.id) || AI_GENERATED_DEFS.find(x => x.id === item.id)
                if (!q) return null
                const isOver = dragOverIdx === idx
                const tm = Q_TYPE_META[q.type] || Q_TYPE_META.text
                return (
                  <div key={item.id}>
                    {isOver && <div style={{ height: 3, borderRadius: 2, background: '#126bce', margin: '0 0 6px' }}/>}
                    <div
                      draggable
                      onDragStart={() => { dragRef.current = { type: 'selected', id: item.id, index: idx } }}
                      onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDragOverIdx(idx) }}
                      onDrop={e => handleDropOnSelected(e, idx)}
                      style={{ marginBottom: 8, borderRadius: 8, border: '1px solid rgba(0,0,0,0.10)', background: '#fff', padding: '10px 12px', display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'grab', userSelect: 'none' }}
                    >
                      <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" style={{ flexShrink: 0, marginTop: 3, color: 'rgba(0,0,0,0.25)' }}>
                        <circle cx="5" cy="3.5" r="1.2"/><circle cx="5" cy="8" r="1.2"/><circle cx="5" cy="12.5" r="1.2"/>
                        <circle cx="11" cy="3.5" r="1.2"/><circle cx="11" cy="8" r="1.2"/><circle cx="11" cy="12.5" r="1.2"/>
                      </svg>
                      <span style={{ font: '600 12px/16px Inter, sans-serif', color: '#126bce', marginTop: 2, flexShrink: 0, minWidth: 16 }}>{idx + 1}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                          <span style={{ font: '400 13px/20px Inter, sans-serif', color: '#0F172A' }}>{item.editedText || q.text}</span>
                          <button
                            onClick={() => setEditingSettingsItem(item)}
                            title="Settings"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 6, border: 'none', background: 'transparent', color: '#64748B', cursor: 'pointer', flexShrink: 0 }}
                          >
                            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="3"/>
                              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                            </svg>
                          </button>
                        </div>
                        <div style={{ marginTop: 8 }}>
                          <span style={{ font: '500 11px/14px Inter, sans-serif', color: tm.color, background: tm.bg, padding: '2px 7px', borderRadius: 999 }}>{tm.label}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 14, marginTop: 10 }}>
                          <button
                            onClick={() => setEditingItem(item)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 7, border: '1px solid #E2E8F0', background: '#fff', font: '500 12px/16px Inter, sans-serif', color: '#0F172A', cursor: 'pointer', flexShrink: 0 }}
                          >
                            <svg viewBox="0 0 24 24" width="11" height="11" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={() => removeQuestion(item.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', font: '400 12px/16px Inter, sans-serif', color: '#64748B' }}
                          >Remove</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            {atMax && <div style={{ marginTop: 8, font: '400 12px/16px Inter, sans-serif', color: '#dc2626' }}>Maximum of {MAX} questions reached.</div>}
          </div>
        </div>
        )}

        {/* Footer */}
        <div style={{ padding: '16px 28px', borderTop: '1px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: '#fff' }}>
          <span style={{ font: '400 13px/18px Inter, sans-serif', color: '#64748B' }}>
            {selected.length === 0
              ? 'No questions selected yet.'
              : `${selected.length} question${selected.length !== 1 ? 's' : ''} selected — click Edit on a question to configure its answer format.`}
          </span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              style={{ padding: '7px 16px', border: '1px solid #E2E8F0', background: '#fff', borderRadius: 8, cursor: 'pointer', font: '500 13px/18px Inter, sans-serif', color: '#0F172A' }}
              onClick={onCancel}
            >Cancel</button>
            <button
              style={{ padding: '7px 16px', background: '#126bce', border: 'none', borderRadius: 8, cursor: selected.length === 0 ? 'not-allowed' : 'pointer', font: '500 13px/18px Inter, sans-serif', color: '#fff', opacity: selected.length === 0 ? 0.45 : 1 }}
              onClick={() => onSave(selected)}
              disabled={selected.length === 0}
            >Save Questions</button>
          </div>
        </div>
      </div>
    </div>
    </>,
    document.body
  )
}

// ── QuestionConfigModal ─────────────────────────────────────────────────────────

function findQuestionDef(id: string): QuestionDef | undefined {
  return QUESTION_BANK.find(x => x.id === id) || AI_GENERATED_DEFS.find(x => x.id === id)
}

function QuestionConfigModal({
  item,
  def,
  onSave,
  onClose,
}: {
  item: QuestionItem
  def: QuestionDef
  onSave: (updated: Partial<QuestionItem>) => void
  onClose: () => void
}) {
  const [editedText, setEditedText] = useState(item.editedText ?? def.text)
  const [scaleLabels, setScaleLabels] = useState<string[]>(
    item.scaleLabels && item.scaleLabels.length ? [...item.scaleLabels] : (def.type === 'nps' ? Array(11).fill('') : ['', '', '', '', ''])
  )
  const [yesnoLabels, setYesnoLabels] = useState<string[]>(item.yesnoLabels ?? ['Yes', 'No'])

  const updateScaleLabel = (idx: number, value: string) => {
    if (value.length > 20) return
    setScaleLabels(prev => { const next = [...prev]; next[idx] = value; return next })
  }

  const updateYesnoLabel = (idx: number, value: string) => {
    setYesnoLabels(prev => { const next = [...prev]; next[idx] = value; return next })
  }

  const handleSave = () => {
    onSave({
      editedText,
      scaleLabels,
      yesnoLabels: def.type === 'yesno' ? yesnoLabels : item.yesnoLabels,
    })
    onClose()
  }

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 950, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.48)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{ background: '#fff', width: '100%', maxWidth: 640, margin: 32, borderRadius: 16, boxShadow: '0 20px 48px rgba(0,0,0,0.18)', maxHeight: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(0,0,0,0.08)', flexShrink: 0 }}>
          <h2 style={{ font: '600 17px/22px Inter, sans-serif', color: '#0F172A', margin: 0 }}>Edit</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 4, borderRadius: 6 }}>
            <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <line x1="12" y1="4" x2="4" y2="12"/><line x1="4" y1="4" x2="12" y2="12"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {/* Question text */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ font: '500 14px/20px Inter, sans-serif', color: '#0F172A' }}>Edit Question Text</span>
              <span style={{ font: '400 12px/16px Inter, sans-serif', color: editedText.length > 180 ? '#f97316' : '#94A3B8' }}>{editedText.length}/200</span>
            </div>
            <textarea
              rows={3}
              maxLength={200}
              value={editedText}
              onChange={e => setEditedText(e.target.value)}
              style={{ width: '100%', font: '400 14px/20px Inter, sans-serif', padding: '12px 14px', border: '1px solid #E2E8F0', borderRadius: 10, outline: 'none', resize: 'vertical', color: '#0F172A' }}
            />
          </div>

          {/* Scale / NPS labels */}
          {(def.type === 'scale' || def.type === 'nps') && (() => {
            const points = def.type === 'nps' ? Array.from({ length: 11 }, (_, i) => i) : [1, 2, 3, 4, 5]
            const defaultPlaceholders = def.type === 'nps'
              ? ['Not at all likely', '', '', '', '', '', '', '', '', '', 'Extremely likely']
              : ['Very Bad', 'Bad', 'Neutral', 'Good', 'Excellent']
            return (
              <div>
                <div style={{ font: '500 14px/20px Inter, sans-serif', color: '#0F172A', marginBottom: 12 }}>Edit Answer: Scale Labels</div>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${points.length}, 1fr)`, gap: 10 }}>
                  {points.map((point, idx) => {
                    const val = scaleLabels[idx] || ''
                    return (
                      <div key={point}>
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ font: '500 12px/16px Inter, sans-serif', color: '#0F172A', whiteSpace: 'nowrap' }}>
                            {point}
                          </span>
                          <span style={{ font: '400 11px/14px Inter, sans-serif', color: val.length >= 18 ? '#f97316' : '#94A3B8' }}>{val.length}/20</span>
                        </div>
                        <input
                          maxLength={20}
                          value={val}
                          placeholder={defaultPlaceholders[idx] ? `eg: ${defaultPlaceholders[idx]}` : ''}
                          onChange={e => updateScaleLabel(idx, e.target.value)}
                          style={{ width: '100%', font: '400 13px/18px Inter, sans-serif', padding: '9px 10px', border: '1px solid #E2E8F0', borderRadius: 8, outline: 'none', color: '#0F172A' }}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })()}

          {/* Yes/No labels */}
          {def.type === 'yesno' && (
            <div>
              <div style={{ font: '500 14px/20px Inter, sans-serif', color: '#0F172A', marginBottom: 12 }}>Edit Answer: Yes / No Labels</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {['Yes', 'No'].map((defaultLabel, idx) => (
                  <div key={idx}>
                    <div style={{ font: '500 12px/16px Inter, sans-serif', color: '#0F172A', marginBottom: 6 }}>Option {idx + 1}</div>
                    <input
                      value={yesnoLabels[idx] ?? defaultLabel}
                      placeholder={defaultLabel}
                      onChange={e => updateYesnoLabel(idx, e.target.value)}
                      style={{ width: '100%', font: '400 13px/18px Inter, sans-serif', padding: '9px 10px', border: '1px solid #E2E8F0', borderRadius: 8, outline: 'none', color: '#0F172A' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Select options — fixed, read only */}
          {def.type === 'select' && def.options && (
            <div>
              <div style={{ font: '500 14px/20px Inter, sans-serif', color: '#0F172A', marginBottom: 12 }}>Answer Options</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {def.options.map((opt, i) => (
                  <span key={i} style={{ font: '400 13px/20px Inter, sans-serif', color: '#0F172A', background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 6, padding: '6px 14px' }}>{opt}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid rgba(0,0,0,0.08)', flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: '8px 18px', border: '1px solid #E2E8F0', background: '#fff', borderRadius: 8, cursor: 'pointer', font: '500 13px/18px Inter, sans-serif', color: '#0F172A' }}>Cancel</button>
          <button onClick={handleSave} style={{ padding: '8px 18px', background: '#126bce', border: 'none', borderRadius: 8, cursor: 'pointer', font: '500 13px/18px Inter, sans-serif', color: '#fff' }}>Save Changes</button>
        </div>
      </div>
    </div>,
    document.body
  )
}

function QuestionSettingsModal({
  item,
  def,
  channelLabel,
  onSave,
  onClose,
}: {
  item: QuestionItem
  def: QuestionDef
  channelLabel: string
  onSave: (updated: Partial<QuestionItem>) => void
  onClose: () => void
}) {
  const isIVR = channelLabel === 'IVR'
  const [displayStyle, setDisplayStyle] = useState(item.displayStyle || 'Quick Reply')
  const [menuLabel, setMenuLabel] = useState(item.menuLabel || '')
  const [fallbackText, setFallbackText] = useState(item.fallbackText || '')
  const [showPreview, setShowPreview] = useState(false)
  const [activeSection, setActiveSection] = useState<'channel'>('channel')

  const questionText = item.editedText || def.text

  const handleSave = () => {
    onSave({ displayStyle, menuLabel, fallbackText })
    onClose()
  }

  return createPortal(
    <>
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 950, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.48)' }}
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
      >
        <div
          style={{ background: '#fff', width: '100%', maxWidth: 900, margin: 32, borderRadius: 16, boxShadow: '0 20px 48px rgba(0,0,0,0.18)', maxHeight: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(0,0,0,0.08)', flexShrink: 0 }}>
            <h2 style={{ font: '600 17px/22px Inter, sans-serif', color: '#0F172A', margin: 0 }}>Question Settings</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 4, borderRadius: 6 }}>
              <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <line x1="12" y1="4" x2="4" y2="12"/><line x1="4" y1="4" x2="12" y2="12"/>
              </svg>
            </button>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', minHeight: 460 }}>

            {/* Left nav */}
            <div style={{ width: 190, flexShrink: 0, borderRight: '1px solid rgba(0,0,0,0.08)', padding: 12, overflowY: 'auto', background: '#F8FAFC' }}>
              {([
                {
                  key: 'channel' as const,
                  label: 'Channel Settings',
                  icon: (
                    <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="4" y1="6" x2="20" y2="6"/><circle cx="9" cy="6" r="1.8" fill="none"/>
                      <line x1="4" y1="12" x2="20" y2="12"/><circle cx="15" cy="12" r="1.8" fill="none"/>
                      <line x1="4" y1="18" x2="20" y2="18"/><circle cx="9" cy="18" r="1.8" fill="none"/>
                    </svg>
                  ),
                },
              ]).map(nav => {
                const active = activeSection === nav.key
                return (
                  <button
                    key={nav.key}
                    onClick={() => setActiveSection(nav.key)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 10px', borderRadius: 8, border: 'none', background: active ? '#EFF6FF' : 'transparent', cursor: 'pointer', marginBottom: 4, textAlign: 'left' }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 7, background: active ? '#126bce' : 'transparent', color: active ? '#fff' : '#94A3B8', flexShrink: 0 }}>
                      {nav.icon}
                    </span>
                    <span style={{ font: active ? '600 13px/18px Inter, sans-serif' : '400 13px/18px Inter, sans-serif', color: active ? '#0F172A' : '#64748B' }}>{nav.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Right content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
              {!isIVR ? (
                <>
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div style={{ font: '500 13px/18px Inter, sans-serif', color: '#0F172A' }}>
                        Digital Display Style <span style={{ color: '#dc2626' }}>*</span>
                      </div>
                      <button
                        onClick={() => setShowPreview(true)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', padding: 0, whiteSpace: 'nowrap', color: '#126bce', cursor: 'pointer', font: '400 13px/18px Inter, sans-serif' }}
                      >
                        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/>
                        </svg>
                        Preview
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      {([
                        { v: 'Quick Reply', desc: 'Customer taps a button to answer' },
                        { v: 'List Picker', desc: 'Customer selects from a scrollable list' },
                      ] as { v: string; desc: string }[]).map(({ v, desc }) => {
                        const active = displayStyle === v
                        return (
                          <label key={v}
                            style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 12, borderRadius: 10, border: `1.5px solid ${active ? '#126bce' : '#E2E8F0'}`, background: active ? '#EFF6FF' : '#fff', cursor: 'pointer' }}
                            onClick={() => setDisplayStyle(v)}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${active ? '#126bce' : '#CBD5E1'}`, background: active ? '#126bce' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {active && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }}/>}
                              </div>
                              <span style={{ font: '500 13px/18px Inter, sans-serif', color: '#0F172A' }}>{v}</span>
                            </div>
                            <p style={{ font: '400 12px/16px Inter, sans-serif', color: '#64748B', margin: 0, paddingLeft: 24 }}>{desc}</p>
                          </label>
                        )
                      })}
                    </div>
                    {displayStyle === 'List Picker' && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ font: '500 13px/18px Inter, sans-serif', color: '#0F172A', marginBottom: 6 }}>Menu Label</div>
                        <input
                          style={{ font: '400 13px/20px Inter, sans-serif', padding: '8px 10px', width: '100%', border: '1px solid #E2E8F0', borderRadius: 8, outline: 'none' }}
                          placeholder="Select"
                          value={menuLabel}
                          onChange={e => setMenuLabel(e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ font: '500 13px/18px Inter, sans-serif', color: '#0F172A' }}>Fallback Text</span>
                      <span style={{ font: '400 12px/16px Inter, sans-serif', color: fallbackText.length > 900 ? '#f97316' : '#94A3B8' }}>{fallbackText.length}/1000</span>
                    </div>
                    <textarea
                      rows={3}
                      maxLength={1000}
                      value={fallbackText}
                      onChange={e => setFallbackText(e.target.value)}
                      style={{ width: '100%', font: '400 14px/20px Inter, sans-serif', padding: '12px 14px', border: '1px solid #E2E8F0', borderRadius: 10, outline: 'none', resize: 'vertical', color: '#0F172A' }}
                    />
                    <div style={{ font: '400 12px/16px Inter, sans-serif', color: '#64748B', marginTop: 6 }}>Fallback text shown when buttons can't render on the channel.</div>
                  </div>
                </>
              ) : (
                <>
                  <p style={{ font: '400 13px/20px Inter, sans-serif', color: '#64748B', margin: '0 0 20px' }}>
                    <span style={{ font: '600 13px/20px Inter, sans-serif', color: '#0F172A' }}>IVR Configuration –</span> Define fallback text for IVR survey
                  </p>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ font: '500 13px/18px Inter, sans-serif', color: '#0F172A' }}>Fallback Text</span>
                      <span style={{ font: '400 12px/16px Inter, sans-serif', color: fallbackText.length > 900 ? '#f97316' : '#94A3B8' }}>{fallbackText.length}/1000</span>
                    </div>
                    <textarea
                      rows={3}
                      maxLength={1000}
                      value={fallbackText}
                      onChange={e => setFallbackText(e.target.value)}
                      style={{ width: '100%', font: '400 14px/20px Inter, sans-serif', padding: '12px 14px', border: '1px solid #E2E8F0', borderRadius: 10, outline: 'none', resize: 'vertical', color: '#0F172A' }}
                    />
                    <div style={{ font: '400 12px/16px Inter, sans-serif', color: '#64748B', marginTop: 6 }}>Fallback text played when this question can't be delivered as configured.</div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid rgba(0,0,0,0.08)', flexShrink: 0 }}>
            <button onClick={onClose} style={{ padding: '8px 18px', border: '1px solid #E2E8F0', background: '#fff', borderRadius: 8, cursor: 'pointer', font: '500 13px/18px Inter, sans-serif', color: '#0F172A' }}>Cancel</button>
            <button onClick={handleSave} style={{ padding: '8px 18px', background: '#126bce', border: 'none', borderRadius: 8, cursor: 'pointer', font: '500 13px/18px Inter, sans-serif', color: '#fff' }}>Save Changes</button>
          </div>
        </div>
      </div>

      {showPreview && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.40)' }}
          onClick={() => setShowPreview(false)}
        >
          <div
            style={{ background: '#fff', borderRadius: 16, padding: '28px 28px 24px', width: 380, boxShadow: '0px 12px 24px rgba(0,0,0,0.12)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ font: '600 15px/20px Inter, sans-serif', color: '#0F172A' }}>
                  {displayStyle === 'Quick Reply' ? 'Quick Reply' : 'List Picker'} Preview
                </div>
                <div style={{ font: '400 12px/16px Inter, sans-serif', color: '#64748B', marginTop: 2 }}>How customers will see this question</div>
              </div>
              <button onClick={() => setShowPreview(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 4 }}>
                <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <line x1="12" y1="4" x2="4" y2="12"/><line x1="4" y1="4" x2="12" y2="12"/>
                </svg>
              </button>
            </div>
            <div style={{ background: '#f5f7f9', borderRadius: 12, padding: '16px 14px', border: '1px solid rgba(0,0,0,0.08)' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#126bce', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg viewBox="0 0 16 16" width="14" height="14" fill="white"><circle cx="8" cy="6" r="3"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" fill="white"/></svg>
                </div>
                <div style={{ background: '#fff', borderRadius: '4px 12px 12px 12px', padding: '10px 12px', font: '400 13px/18px Inter, sans-serif', color: '#0F172A', boxShadow: '0 1px 2px rgba(0,0,0,0.06)', maxWidth: 260 }}>
                  {questionText}
                </div>
              </div>
              {displayStyle === 'Quick Reply' ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingLeft: 36 }}>
                  {(def.type === 'nps' ? Array.from({ length: 11 }, (_, i) => String(i)) : def.type === 'yesno' ? ['Yes', 'No'] : ['1', '2', '3', '4', '5']).map(n => (
                    <div key={n} style={{ background: '#fff', border: '1px solid #126bce', borderRadius: 20, padding: '6px 14px', font: '500 13px/18px Inter, sans-serif', color: '#126bce', cursor: 'pointer' }}>{n}</div>
                  ))}
                </div>
              ) : (
                <div style={{ paddingLeft: 36 }}>
                  <div style={{ background: '#fff', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)' }}>
                    {menuLabel && (
                      <div style={{ padding: '8px 14px', font: '500 11px/16px Inter, sans-serif', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid rgba(0,0,0,0.06)', background: '#f5f7f9' }}>
                        {menuLabel}
                      </div>
                    )}
                    {(def.type === 'nps' ? Array.from({ length: 11 }, (_, i) => String(i)) : def.type === 'yesno' ? ['Yes', 'No'] : ['1 — Poor', '2 — Fair', '3 — Good', '4 — Very Good', '5 — Excellent']).map((r, i, arr) => (
                      <div key={r} style={{ padding: '10px 14px', font: '400 13px/18px Inter, sans-serif', color: '#0F172A', borderBottom: i < arr.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none', cursor: 'pointer' }}>{r}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div style={{ marginTop: 16, font: '400 12px/16px Inter, sans-serif', color: '#64748B', textAlign: 'center' }}>
              Click outside or press × to close
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  )
}

// ── ChannelQuestionMode ────────────────────────────────────────────────────────

function ChannelQuestionMode({
  label,
  mode,
  onModeChange,
  selected,
  onSelectedChange,
}: {
  label: string
  mode: 'ai' | 'standard'
  onModeChange: (m: 'ai' | 'standard') => void
  selected: QuestionItem[]
  onSelectedChange: (items: QuestionItem[]) => void
}) {
  const [wizardOpen, setWizardOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<QuestionItem | null>(null)
  const [editingSettingsItem, setEditingSettingsItem] = useState<QuestionItem | null>(null)

  const handleModeClick = (opt: 'ai' | 'standard') => {
    if (opt === 'standard') setWizardOpen(true)
    else onModeChange('ai')
  }

  const handleWizardSave = (questions: QuestionItem[]) => {
    onSelectedChange(questions)
    onModeChange('standard')
    setWizardOpen(false)
  }

  const handleWizardCancel = () => {
    setWizardOpen(false)
    if (mode !== 'standard') onModeChange('ai')
  }

  return (
    <>
      {wizardOpen && (
        <QuestionWizard
          channelLabel={label}
          initialSelected={selected}
          onSave={handleWizardSave}
          onCancel={handleWizardCancel}
        />
      )}
      {editingItem && (() => {
        const def = findQuestionDef(editingItem.id)
        if (!def) return null
        return (
          <QuestionConfigModal
            item={editingItem}
            def={def}
            onClose={() => setEditingItem(null)}
            onSave={updated => {
              onSelectedChange(selected.map(q => q.id === editingItem.id ? { ...q, ...updated } : q))
            }}
          />
        )
      })()}
      {editingSettingsItem && (() => {
        const def = findQuestionDef(editingSettingsItem.id)
        if (!def) return null
        return (
          <QuestionSettingsModal
            item={editingSettingsItem}
            def={def}
            channelLabel={label}
            onClose={() => setEditingSettingsItem(null)}
            onSave={updated => {
              onSelectedChange(selected.map(q => q.id === editingSettingsItem.id ? { ...q, ...updated } : q))
            }}
          />
        )
      })()}
      <div>
        <div className="text-sm font-medium text-[#0F172A] mb-3">
          Select Question Mode <span className="text-[#dc2626]">*</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {([
            { opt: 'ai',       title: 'AI Generated Questions', desc: 'Questions adapt to each interaction. The AI writes the most relevant questions for every customer' },
            { opt: 'standard', title: 'Static Questions',        desc: 'Every customer answers the same fixed set of questions you build below' },
          ] as { opt: 'ai' | 'standard'; title: string; desc: string }[]).map(({ opt, title, desc }) => {
            const active = mode === opt
            return (
              <label key={opt}
                className={cn('flex flex-col gap-2 p-3 rounded-lg border cursor-pointer transition-colors', active ? 'border-[#126bce] bg-[#EFF6FF]' : 'border-[#E2E8F0] bg-white hover:bg-[#F8FAFC]')}
                onClick={() => handleModeClick(opt)}
              >
                <div className="flex items-center gap-2">
                  <div className={cn('flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center', active ? 'border-[#126bce]' : 'border-[#CBD5E1]')}>
                    {active && <div className="w-2 h-2 rounded-full bg-[#126bce]"/>}
                  </div>
                  <span className="text-sm font-medium text-[#0F172A]">{title}</span>
                </div>
                <p className="text-xs text-[#64748B] leading-relaxed pl-6">{desc}</p>
                {opt === 'standard' && active && selected.length === 0 && (
                  <p className="text-xs text-[#dc2626] pl-6">No questions configured yet — click to add.</p>
                )}
              </label>
            )
          })}
        </div>

        {mode === 'standard' && selected.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            {selected.map(item => {
              const def = QUESTION_BANK.find(x => x.id === item.id) || AI_GENERATED_DEFS.find(x => x.id === item.id)
              if (!def) return null
              const tm = Q_TYPE_META[def.type] || Q_TYPE_META.text
              return (
                <div key={item.id} className="flex items-start gap-2.5 rounded-lg border border-[#E2E8F0] bg-white px-3.5 py-3">
                  <svg viewBox="0 0 16 16" width="14" height="14" fill="#94A3B8" className="flex-shrink-0 mt-1">
                    <circle cx="5" cy="3.5" r="1.3"/><circle cx="5" cy="8" r="1.3"/><circle cx="5" cy="12.5" r="1.3"/>
                    <circle cx="11" cy="3.5" r="1.3"/><circle cx="11" cy="8" r="1.3"/><circle cx="11" cy="12.5" r="1.3"/>
                  </svg>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2.5">
                      <span className="text-sm text-[#0F172A]">{item.editedText || def.text}</span>
                      <button
                        onClick={() => setEditingSettingsItem(item)}
                        title="Settings"
                        className="flex items-center justify-center w-[26px] h-[26px] rounded-md text-[#64748B] hover:bg-[#F1F5F9] transition-colors flex-shrink-0"
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="3"/>
                          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                        </svg>
                      </button>
                    </div>
                    <div className="mt-2">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ color: tm.color, background: tm.bg }}>{tm.label}</span>
                    </div>
                    <div className="mt-2.5 flex items-center justify-end gap-3.5">
                      <button
                        onClick={() => setEditingItem(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md border border-[#E2E8F0] bg-white text-xs font-medium text-[#0F172A] hover:bg-[#F8FAFC] transition-colors flex-shrink-0"
                      >
                        <svg viewBox="0 0 24 24" width="11" height="11" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => onSelectedChange(selected.filter(q => q.id !== item.id))}
                        className="text-xs text-[#64748B] hover:text-[#dc2626] transition-colors"
                      >Remove</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}

// ── Segmented control ─────────────────────────────────────────────────────────

function Segmented({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', borderRadius: 8, border: '1px solid #E2E8F0', overflow: 'hidden', width: 'fit-content' }}>
      {options.map(opt => {
        const active = value === opt
        return (
          <button key={opt}
            style={{ padding: '8px 18px', border: 'none', cursor: 'pointer', font: '500 13px/18px Inter, sans-serif', background: active ? '#126bce' : '#fff', color: active ? '#fff' : '#64748B', transition: 'background 0.15s, color 0.15s', borderRight: opt !== options[options.length - 1] ? '1px solid #E2E8F0' : 'none' }}
            onClick={() => onChange(opt)}>
            {opt}
          </button>
        )
      })}
    </div>
  )
}

// ── LinkedCampaignsTable ──────────────────────────────────────────────────────

function LinkedCampaignsTable({ linkedIds }: { linkedIds: (string | number)[] }) {
  // Since we don't have window.CAMPAIGNS in TS, render a placeholder
  if (linkedIds.length === 0) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: '#64748B', font: '400 14px/20px Inter, sans-serif', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
        No programs are linked to this template yet.
      </div>
    )
  }
  return (
    <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', padding: '8px 16px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
        <span style={{ font: '500 11px/16px Inter, sans-serif', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Program</span>
        <span style={{ font: '500 11px/16px Inter, sans-serif', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</span>
      </div>
      {linkedIds.map((id, i) => (
        <div key={String(id)} style={{ display: 'grid', gridTemplateColumns: '1fr 140px', alignItems: 'center', padding: '12px 16px', borderBottom: i < linkedIds.length - 1 ? '1px solid #E2E8F0' : 'none', background: '#fff' }}>
          <div style={{ font: '500 14px/20px Inter, sans-serif', color: '#0F172A' }}>Program {String(id)}</div>
          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: 999, background: '#DCFCE7', color: '#166534', font: '500 12px/16px Inter, sans-serif' }}>Active</span>
        </div>
      ))}
    </div>
  )
}

// ── CreateSurveyDesign ────────────────────────────────────────────────────────

function CreateSurveyDesign({
  onCancel,
  onSave,
  initial,
}: {
  onCancel: () => void
  onSave: (d: SurveyDesign) => void
  initial?: SurveyDesign
}) {
  const [d, setD] = useState<SurveyDesign>(initial ?? DEFAULT_DESIGN)
  const set = <K extends keyof SurveyDesign>(k: K, v: SurveyDesign[K]) =>
    setD(prev => ({ ...prev, [k]: v }))

  const isEdit = !!initial
  const [activeStep, setActiveStep] = useState(0)
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set())
  const [saving, setSaving] = useState(false)
  const [savedAsDraft, setSavedAsDraft] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showQuestionSettings, setShowQuestionSettings] = useState(false)
  const [settingsSection, setSettingsSection] = useState<'channel'>('channel')

  function handleSaveTemplate(asDraft = false) {
    setSavedAsDraft(asDraft)
    setSaving(true)
    setTimeout(() => { onSave({ ...d, status: asDraft ? 'draft' : 'active' }) }, 2500)
  }

  const [linkedIds] = useState<(string | number)[]>([1, 2, 7, 10, 5])

  const STEPS = [
    { n: 0, label: 'Identity',         done: !!d.name },
    { n: 1, label: 'Survey Content',   done: !!d.defaultScaleQuestion },
    { n: 2, label: 'Linked Programs', done: linkedIds.length > 0 },
    { n: 3, label: 'Summary & Review', done: false },
  ]

  function stepState(s: typeof STEPS[number]): 'active' | 'done' | 'error' | 'default' {
    if (s.n === activeStep) return 'active'
    if (visitedSteps.has(s.n) && s.done) return 'done'
    if (visitedSteps.has(s.n) && !s.done) return 'error'
    return 'default'
  }

  function goNext() {
    setVisitedSteps(prev => new Set([...prev, activeStep]))
    setActiveStep(prev => Math.min(prev + 1, 4))
  }

  function goBack() {
    setActiveStep(prev => Math.max(prev - 1, 0))
  }

  const canSave = !!d.name

  // Step node colors
  const nodeStyle = (st: string): React.CSSProperties => {
    if (st === 'active') return { background: '#126bce', color: '#fff', border: '2px solid #126bce' }
    if (st === 'done')   return { background: '#126bce', color: '#fff', border: '2px solid #126bce' }
    if (st === 'error')  return { background: '#fff', color: '#dc2626', border: '2px solid #dc2626' }
    return { background: '#fff', color: '#94A3B8', border: '2px solid #CBD5E1' }
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 px-8 pt-4 text-xs text-[#64748B] flex-shrink-0">
        <button className="hover:text-[#0F172A] transition-colors" onClick={onCancel}>Surveys</button>
        <span className="text-[#CBD5E1]">/</span>
        <span className="text-[#0F172A] font-medium">{isEdit ? d.name : 'New Survey'}</span>
      </div>

      {/* Page header */}
      <div className="flex items-center gap-3 px-8 pt-3 pb-4 flex-shrink-0">
        <h1 className="text-2xl font-semibold text-[#0F172A] tracking-tight">
          {isEdit ? d.name : 'New Survey'}
        </h1>
        <span className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
          d.channel === 'IVR'
            ? 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
            : 'bg-[#EFF6FF] text-[#126bce] border-[#BFDBFE]'
        )}>
          {d.channel === 'IVR' ? (
            <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M5.2 2.6A6 6 0 0 1 14 8a6 6 0 0 1-2.1 4.6M3 5a5 5 0 0 0 0 6M6.5 6.2a2.5 2.5 0 0 1 0 3.6"/>
            </svg>
          ) : (
            <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <rect x="1" y="3" width="14" height="9" rx="1.5"/><path d="M5 14h6M8 12v2"/>
            </svg>
          )}
          {d.channel === 'IVR' ? 'IVR' : 'Digital'}
        </span>
      </div>

      {/* Page description */}
      <div style={{
        margin: '0 32px 16px',
        padding: '10px 14px',
        flexShrink: 0,
        background: 'var(--lyra-color-status-info-subtle)',
        border: '1px solid var(--lyra-color-status-info-medium)',
        borderRadius: 'var(--radius-md)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--lyra-color-status-info-strong)', flexShrink: 0 }}>
          <circle cx="8" cy="8" r="7"/><path d="M8 7v4"/><circle cx="8" cy="5" r=".5" fill="currentColor" stroke="none"/>
        </svg>
        <p style={{
          margin: 0,
          font: '400 13px/18px var(--font-sans)',
          color: 'var(--lyra-color-status-info-strong)',
        }}>
          {d.aiQuestions
            ? 'Questions are automatically created based on the customer\'s interaction and conversation topic'
            : 'Build your survey by adding and configuring questions below'}
        </p>
      </div>

      {/* Wizard step bar */}
      <div className="px-8 pb-4 flex-shrink-0 border-b border-[#E2E8F0]">
        <div className="flex items-center">
          {STEPS.map((s, i) => {
            const st = stepState(s)
            const prevDone = i > 0 && stepState(STEPS[i - 1]) === 'done'
            return (
              <div key={s.n} className="flex items-center">
                {i > 0 && (
                  <div className={cn('h-px w-8 mx-2', prevDone ? 'bg-[#126bce]' : 'bg-[#E2E8F0]')}/>
                )}
                <button
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => setActiveStep(s.n)}
                >
                  <div
                    className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold flex-shrink-0 transition-all"
                    style={nodeStyle(st)}
                  >
                    {st === 'done' ? (
                      <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="2 6 5 9.5 10 2.5"/>
                      </svg>
                    ) : s.n + 1}
                  </div>
                  <span className={cn('text-sm font-medium whitespace-nowrap', st === 'active' ? 'text-[#126bce]' : 'text-[#64748B]')}>
                    {s.label}
                  </span>
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Wizard body */}
      <div className="flex-1 overflow-y-auto px-8 py-6">

        {/* Step 0: Identity */}
        {activeStep === 0 && (() => {
          const showErr = visitedSteps.has(0)
          const nameErr = showErr && !d.name
          return (
            <div className="max-w-2xl">
              <div className="mb-6">
                <h2 className="text-base font-semibold text-[#0F172A] mb-1">Identity</h2>
                <p className="text-sm text-[#64748B]">Name this template so your team knows when to use it.</p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#0F172A] mb-1">
                    Template Name<span className="text-[#dc2626] ml-0.5">*</span>
                    <span className="float-right text-xs text-[#94A3B8] font-normal">{(d.name || '').length}/50</span>
                  </label>
                  <input
                    className={cn('w-full px-3 py-2 text-sm border rounded-lg bg-white placeholder:text-[#94A3B8] focus:outline-none focus:ring-1', nameErr ? 'border-[#dc2626] focus:ring-[#dc2626]' : 'border-[#E2E8F0] focus:border-[#126bce] focus:ring-[#126bce]')}
                    placeholder="e.g. Post-Chat CSAT"
                    maxLength={50}
                    value={d.name}
                    onChange={e => set('name', e.target.value)}
                  />
                  {nameErr && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-[#dc2626]">
                      <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <circle cx="8" cy="8" r="6"/><line x1="8" y1="5" x2="8" y2="8.5"/><circle cx="8" cy="11" r=".6" fill="currentColor"/>
                      </svg>
                      Template name is required
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0F172A] mb-1">
                    Description
                    <span className="float-right text-xs text-[#94A3B8] font-normal">{(d.description || '').length}/200</span>
                  </label>
                  <textarea
                    className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg bg-white placeholder:text-[#94A3B8] focus:outline-none focus:border-[#126bce] focus:ring-1 focus:ring-[#126bce] resize-none"
                    rows={3}
                    maxLength={200}
                    placeholder="What this template is for and which programs should use it."
                    value={d.description}
                    onChange={e => set('description', e.target.value)}
                  />
                  <div className="mt-1 text-xs text-[#94A3B8]">Help your team understand when to apply this template.</div>
                </div>
              </div>
            </div>
          )
        })()}

        {/* Step 1: Survey Content */}
        {activeStep === 1 && (() => {
          return (
            <div className="max-w-2xl space-y-6">

              {/* Survey Introduction card */}
              <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
                <div className="px-6 py-5 bg-white space-y-5">

                  {/* Mode selection — 3 horizontal cards */}
                  <div>
                    <div className="text-sm font-medium text-[#0F172A] mb-3">
                      Select Survey Introduction Mode <span className="text-[#dc2626]">*</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {([
                        { v: 'with-optout',    label: 'Invitation with Opt Out',    desc: 'The customer sees your invitation message & can choose to start the survey or decline it.' },
                        { v: 'without-optout', label: 'Invitation without Opt Out', desc: 'The customer sees your invitation message but cannot skip it. They must tap Start to proceed.' },
                        { v: 'none',           label: 'None',                       desc: 'The survey starts immediately with the first question. No greeting is shown.' },
                      ] as { v: 'with-optout' | 'without-optout' | 'none'; label: string; desc: string }[]).map(opt => {
                        const active = d.welcomeMode === opt.v
                        return (
                          <label key={opt.v}
                            className={cn('flex flex-col gap-2 p-3 rounded-lg border cursor-pointer transition-colors', active ? 'border-[#126bce] bg-[#EFF6FF]' : 'border-[#E2E8F0] bg-white hover:bg-[#F8FAFC]')}>
                            <input type="radio" name="welcomeMode" value={opt.v} checked={active}
                              onChange={() => set('welcomeMode', opt.v)} className="sr-only"/>
                            <div className="flex items-center gap-2">
                              <div className={cn('flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center', active ? 'border-[#126bce]' : 'border-[#CBD5E1]')}>
                                {active && <div className="w-2 h-2 rounded-full bg-[#126bce]"/>}
                              </div>
                              <span className="text-sm font-medium text-[#0F172A]">{opt.label}</span>
                            </div>
                            <p className="text-xs text-[#64748B] leading-relaxed pl-6">{opt.desc}</p>
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  {/* Introduction message */}
                  {d.welcomeMode !== 'none' && (
                    <div className="border border-[#E2E8F0] rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-[#0F172A]">Introduction Message</span>
                        <span className={cn('text-xs', (d.welcomeMessage || '').length > 220 ? 'text-[#f97316]' : 'text-[#94A3B8]')}>
                          {(d.welcomeMessage || '').length}/240
                        </span>
                      </div>
                      <textarea
                        className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg bg-white placeholder:text-[#94A3B8] focus:outline-none focus:border-[#126bce] focus:ring-1 focus:ring-[#126bce] resize-y min-h-[72px]"
                        rows={3}
                        maxLength={240}
                        placeholder={`"{{First Name}}", we'd love to hear about your experience today. Just two minutes of your time.`}
                        value={d.welcomeMessage}
                        onChange={e => set('welcomeMessage', e.target.value)}
                      />
                      <p className="text-xs text-[#64748B]">This is the first thing the customer reads before the survey starts.</p>
                    </div>
                  )}

                </div>
              </div>

              {/* Question Configuration card */}
              <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
                <div className="px-6 py-4 bg-white border-b border-[#E2E8F0]">
                  <h2 className="text-sm font-semibold text-[#0F172A]">Question Configuration</h2>
                </div>
                <div className="px-6 py-5 bg-white space-y-4">
                  {d.channel === 'Digital' && (
                    <ChannelQuestionMode
                      label="Digital Chat"
                      mode={d.questionModeDigital}
                      onModeChange={v => set('questionModeDigital', v)}
                      selected={d.standardQuestionsDigital}
                      onSelectedChange={v => set('standardQuestionsDigital', v)}
                    />
                  )}
                  {d.channel === 'IVR' && (
                    <ChannelQuestionMode
                      label="IVR"
                      mode={d.questionModeIVR}
                      onModeChange={v => set('questionModeIVR', v)}
                      selected={d.standardQuestionsIVR}
                      onSelectedChange={v => set('standardQuestionsIVR', v)}
                    />
                  )}
                </div>
              </div>

              {/* Rating Format — Digital + AI Generated only */}
              {d.channel === 'Digital' && d.questionModeDigital === 'ai' && (
                <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
                  <div className="px-6 py-5 bg-white flex items-center justify-between gap-4">
                    <p className="text-sm text-[#0F172A]">
                      <span className="font-medium">Question Settings –</span>{' '}
                      <span className="text-[#64748B]">Configure settings for AI-generated questions.</span>
                    </p>
                    <button
                      onClick={() => setShowQuestionSettings(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border-none bg-[#126bce] text-xs font-semibold text-white hover:bg-[#0f5ab8] transition-colors flex-shrink-0"
                    >
                      <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                      </svg>
                      Settings
                    </button>
                  </div>

                  {/* Question Settings modal */}
                  {showQuestionSettings && createPortal(
                    <div
                      style={{ position: 'fixed', inset: 0, zIndex: 950, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.48)' }}
                      onClick={e => { if (e.target === e.currentTarget) setShowQuestionSettings(false) }}
                    >
                      <div
                        style={{ background: '#fff', width: '100%', maxWidth: 900, margin: 32, borderRadius: 16, boxShadow: '0 20px 48px rgba(0,0,0,0.18)', maxHeight: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
                        onClick={e => e.stopPropagation()}
                      >
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(0,0,0,0.08)', flexShrink: 0 }}>
                          <h2 style={{ font: '600 17px/22px Inter, sans-serif', color: '#0F172A', margin: 0 }}>Question Settings</h2>
                          <button onClick={() => setShowQuestionSettings(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 4, borderRadius: 6 }}>
                            <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                              <line x1="12" y1="4" x2="4" y2="12"/><line x1="4" y1="4" x2="12" y2="12"/>
                            </svg>
                          </button>
                        </div>

                        {/* Body */}
                        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', minHeight: 460 }}>

                          {/* Left nav */}
                          <div style={{ width: 190, flexShrink: 0, borderRight: '1px solid rgba(0,0,0,0.08)', padding: 12, overflowY: 'auto', background: '#F8FAFC' }}>
                            {([
                              {
                                key: 'channel' as const,
                                label: 'Channel Settings',
                                icon: (
                                  <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="4" y1="6" x2="20" y2="6"/><circle cx="9" cy="6" r="1.8" fill="none"/>
                                    <line x1="4" y1="12" x2="20" y2="12"/><circle cx="15" cy="12" r="1.8" fill="none"/>
                                    <line x1="4" y1="18" x2="20" y2="18"/><circle cx="9" cy="18" r="1.8" fill="none"/>
                                  </svg>
                                ),
                              },
                            ]).map(nav => {
                              const active = settingsSection === nav.key
                              return (
                                <button
                                  key={nav.key}
                                  onClick={() => setSettingsSection(nav.key)}
                                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 10px', borderRadius: 8, border: 'none', background: active ? '#EFF6FF' : 'transparent', cursor: 'pointer', marginBottom: 4, textAlign: 'left' }}
                                >
                                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 7, background: active ? '#126bce' : 'transparent', color: active ? '#fff' : '#94A3B8', flexShrink: 0 }}>
                                    {nav.icon}
                                  </span>
                                  <span style={{ font: active ? '600 13px/18px Inter, sans-serif' : '400 13px/18px Inter, sans-serif', color: active ? '#0F172A' : '#64748B' }}>{nav.label}</span>
                                </button>
                              )
                            })}
                          </div>

                          {/* Right content */}
                          <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <label className="text-sm font-medium text-[#0F172A]">
                                    Digital Display Style <span className="text-[#dc2626]">*</span>
                                  </label>
                                  <button
                                    className="flex items-center gap-1.5 text-xs text-[#126bce] hover:underline"
                                    onClick={() => setShowPreview(true)}
                                  >
                                    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/>
                                    </svg>
                                    Preview
                                  </button>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  {([
                                    { v: 'Quick Reply', desc: 'Customer taps a button to answer' },
                                    { v: 'List Picker', desc: 'Customer selects from a scrollable list' },
                                  ] as { v: string; desc: string }[]).map(({ v, desc }) => {
                                    const active = d.displayStyle === v
                                    return (
                                      <label key={v}
                                        className={cn('flex flex-col gap-2 p-3 rounded-lg border cursor-pointer transition-colors', active ? 'border-[#126bce] bg-[#EFF6FF]' : 'border-[#E2E8F0] bg-white hover:bg-[#F8FAFC]')}
                                        onClick={() => set('displayStyle', v)}
                                      >
                                        <div className="flex items-center gap-2">
                                          <div className={cn('flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center', active ? 'border-[#126bce]' : 'border-[#CBD5E1]')}>
                                            {active && <div className="w-2 h-2 rounded-full bg-[#126bce]"/>}
                                          </div>
                                          <span className="text-sm font-medium text-[#0F172A]">{v}</span>
                                        </div>
                                        <p className="text-xs text-[#64748B] leading-relaxed pl-6">{desc}</p>
                                      </label>
                                    )
                                  })}
                                </div>
                              </div>

                              {d.displayStyle === 'List Picker' && (
                                <div style={{ marginTop: 16 }}>
                                  <label className="block text-sm font-medium text-[#0F172A] mb-1">
                                    List Picker Label<span className="text-[#dc2626] ml-0.5">*</span>
                                  </label>
                                  <input
                                    className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg bg-white placeholder:text-[#94A3B8] focus:outline-none focus:border-[#126bce] focus:ring-1 focus:ring-[#126bce]"
                                    maxLength={20}
                                    placeholder="Rate your experience"
                                    value={d.listPickerLabel}
                                    onChange={e => set('listPickerLabel', e.target.value)}
                                  />
                                  <div className="mt-1 text-xs text-[#94A3B8]">{(d.listPickerLabel || '').length}/20 characters</div>
                                </div>
                              )}
                          </div>
                        </div>

                        {/* Footer */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 24px', borderTop: '1px solid rgba(0,0,0,0.08)', flexShrink: 0 }}>
                          <button
                            onClick={() => setShowQuestionSettings(false)}
                            style={{ padding: '8px 18px', background: '#126bce', border: 'none', borderRadius: 8, cursor: 'pointer', font: '500 13px/18px Inter, sans-serif', color: '#fff' }}
                          >Done</button>
                        </div>
                      </div>
                    </div>,
                    document.body
                  )}

                  {/* Preview modal */}
                  {showPreview && createPortal(
                      <div
                        style={{ position: 'fixed', inset: 0, zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.40)' }}
                        onClick={() => setShowPreview(false)}
                      >
                        <div
                          style={{ background: '#fff', borderRadius: 16, padding: '28px 28px 24px', width: 380, boxShadow: '0px 12px 24px rgba(0,0,0,0.12)' }}
                          onClick={e => e.stopPropagation()}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                            <div>
                              <div style={{ font: '600 15px/20px Inter, sans-serif', color: '#0F172A' }}>
                                {d.displayStyle === 'Quick Reply' ? 'Quick Reply' : 'List Picker'} Preview
                              </div>
                              <div style={{ font: '400 12px/16px Inter, sans-serif', color: '#64748B', marginTop: 2 }}>How customers will see the survey</div>
                            </div>
                            <button onClick={() => setShowPreview(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 4 }}>
                              <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                <line x1="12" y1="4" x2="4" y2="12"/><line x1="4" y1="4" x2="12" y2="12"/>
                              </svg>
                            </button>
                          </div>
                          <div style={{ background: '#f5f7f9', borderRadius: 12, padding: '16px 14px', border: '1px solid rgba(0,0,0,0.08)' }}>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#126bce', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <svg viewBox="0 0 16 16" width="14" height="14" fill="white"><circle cx="8" cy="6" r="3"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" fill="white"/></svg>
                              </div>
                              <div style={{ background: '#fff', borderRadius: '4px 12px 12px 12px', padding: '10px 12px', font: '400 13px/18px Inter, sans-serif', color: '#0F172A', boxShadow: '0 1px 2px rgba(0,0,0,0.06)', maxWidth: 260 }}>
                                {d.defaultScaleQuestion || 'On a scale of 1 to 5, how would you rate your experience today?'}
                              </div>
                            </div>
                            {d.displayStyle === 'Quick Reply' ? (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingLeft: 36 }}>
                                {['1', '2', '3', '4', '5'].map(n => (
                                  <div key={n} style={{ background: '#fff', border: '1px solid #126bce', borderRadius: 20, padding: '6px 14px', font: '500 13px/18px Inter, sans-serif', color: '#126bce', cursor: 'pointer' }}>{n}</div>
                                ))}
                              </div>
                            ) : (
                              <div style={{ paddingLeft: 36 }}>
                                <div style={{ background: '#fff', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)' }}>
                                  {d.listPickerLabel && (
                                    <div style={{ padding: '8px 14px', font: '500 11px/16px Inter, sans-serif', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid rgba(0,0,0,0.06)', background: '#f5f7f9' }}>
                                      {d.listPickerLabel}
                                    </div>
                                  )}
                                  {['1 — Poor', '2 — Fair', '3 — Good', '4 — Very Good', '5 — Excellent'].map((r, i, arr) => (
                                    <div key={r} style={{ padding: '10px 14px', font: '400 13px/18px Inter, sans-serif', color: '#0F172A', borderBottom: i < arr.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none', cursor: 'pointer' }}>{r}</div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <div style={{ marginTop: 16, font: '400 12px/16px Inter, sans-serif', color: '#64748B', textAlign: 'center' }}>
                            Click outside or press × to close
                          </div>
                        </div>
                      </div>,
                      document.body
                    )}
                </div>
              )}
            </div>
          )
        })()}

        {/* Step 2: Linked Programs */}
        {activeStep === 2 && (
          <div className="max-w-2xl">
            <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
              <div className="px-6 py-4 bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <h2 className="text-sm font-semibold text-[#0F172A]">Linked Programs</h2>
                {isEdit && (
                  <p className="text-xs text-[#64748B] mt-0.5">Programs currently using this template. To link or unlink programs, edit the individual program.</p>
                )}
              </div>
              <div className="px-6 py-5 bg-white">
                {!isEdit ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center bg-[#F8FAFC] rounded-lg border border-dashed border-[#CBD5E1]">
                    <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                    </svg>
                    <p className="text-sm font-medium text-[#0F172A] mb-1">No programs linked yet</p>
                    <p className="text-xs text-[#64748B] max-w-sm">
                      Save this template first, then go to a Program and select this template to link it. Linked programs will appear here automatically.
                    </p>
                  </div>
                ) : (
                  <LinkedCampaignsTable linkedIds={linkedIds} />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Summary & Review */}
        {activeStep === 3 && (() => {
          const missingRequired = !d.name

          const SRSection = ({ title, num, children, noEdit }: { title: string; num: number; children: React.ReactNode; noEdit?: boolean }) => (
            <div className="border border-[#E2E8F0] rounded-xl overflow-hidden mb-4">
              <div className="flex items-center gap-3 px-5 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#126bce] text-white text-xs font-semibold flex-shrink-0">{num}</span>
                <span className="text-sm font-semibold text-[#0F172A] flex-1">{title}</span>
                {!noEdit && (
                  <button
                    className="flex items-center gap-1.5 text-xs text-[#126bce] hover:underline"
                    onClick={() => setActiveStep(num - 1)}
                  >
                    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M11 2.5a2 2 0 0 1 2.8 2.8L5 14l-3.5.8.8-3.5z"/>
                    </svg>
                    Edit
                  </button>
                )}
              </div>
              <div className="px-5 py-4 bg-white">{children}</div>
            </div>
          )

          const SRRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
            <div className="flex gap-4 py-2 border-b border-[#F0F4F8] last:border-b-0 text-sm">
              <div className="w-44 flex-shrink-0 text-[#64748B] font-medium">{label}</div>
              <div className="flex-1 text-[#0F172A]">{children || <span className="text-[#94A3B8]">—</span>}</div>
            </div>
          )

          return (
            <div className="max-w-2xl">
              <div className="mb-5">
                <h2 className="text-base font-semibold text-[#0F172A] mb-1">Summary &amp; Review</h2>
                <p className="text-sm text-[#64748B]">Review every setting before saving. Click Edit on any section to go back.</p>
              </div>

              {missingRequired && (
                <div className="flex items-center gap-3 px-4 py-3 bg-[#FFF0F0] border border-[#FECACA] rounded-lg mb-4 text-sm text-[#dc2626]">
                  <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <circle cx="8" cy="8" r="6"/><line x1="8" y1="5" x2="8" y2="8.5"/><circle cx="8" cy="11" r=".6" fill="currentColor"/>
                  </svg>
                  Some required fields are incomplete. Return to the relevant steps to fill them in.
                </div>
              )}

              <SRSection title="Identity" num={1}>
                <SRRow label="Template Name">
                  {d.name || <span className="text-[#dc2626]">Required</span>}
                </SRRow>
                {d.description && <SRRow label="Description">{d.description}</SRRow>}
              </SRSection>

              <SRSection title="Survey Content" num={2}>
                <SRRow label="Survey Channel">{d.channel || 'Digital'}</SRRow>
                <SRRow label="Welcome Message">
                  {d.welcomeMode === 'with-optout'    ? 'Invitation with Opt Out' :
                   d.welcomeMode === 'without-optout' ? 'Invitation without Opt Out' : 'None'}
                </SRRow>
                {d.welcomeMode !== 'none' && d.welcomeMessage && (
                  <SRRow label="Invitation Text">
                    <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}>{d.welcomeMessage}</span>
                  </SRRow>
                )}
                {d.channel === 'Digital' && d.questionModeDigital === 'ai' && (
                  <SRRow label="Display Style">{d.displayStyle || 'Quick Reply'}</SRRow>
                )}
                <SRRow label="Rating Question">
                  {d.defaultScaleQuestion || <span className="text-[#dc2626]">Required</span>}
                </SRRow>
                {d.defaultCommentQuestion && <SRRow label="Follow-up Question">{d.defaultCommentQuestion}</SRRow>}
              </SRSection>

              <SRSection title="Linked Programs" num={3} noEdit>
                <LinkedCampaignsTable linkedIds={linkedIds} />
              </SRSection>
            </div>
          )
        })()}

      </div>

      {/* Wizard footer */}
      <div className="flex items-center gap-3 px-8 py-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex-shrink-0">
        <button
          className="inline-flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white text-sm font-medium text-[#0F172A] px-4 py-2 hover:bg-[#F8FAFC] transition-colors"
          onClick={onCancel}
        >Cancel</button>
        <span className="flex-1"/>
        {activeStep < 3 ? (
          <>
            {activeStep > 0 && (
              <button
                className="inline-flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white text-sm font-medium text-[#0F172A] px-4 py-2 hover:bg-[#F8FAFC] transition-colors"
                onClick={goBack}
              >← Back</button>
            )}
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-[#126bce] text-white text-sm font-medium px-4 py-2 hover:bg-[#0f5ab8] transition-colors"
              onClick={goNext}
            >
              {activeStep === 2 ? 'Review →' : 'Next →'}
            </button>
          </>
        ) : (
          <>
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white text-sm font-medium text-[#0F172A] px-4 py-2 hover:bg-[#F8FAFC] transition-colors"
              onClick={goBack}
            >← Back</button>
            {!isEdit && (
              <button
                className={cn('inline-flex items-center gap-2 rounded-lg border text-sm font-medium px-4 py-2 transition-colors', canSave ? 'border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC]' : 'border-[#E2E8F0] bg-white text-[#94A3B8] cursor-not-allowed opacity-50')}
                disabled={!canSave}
                onClick={() => handleSaveTemplate(true)}
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
                Save as draft
              </button>
            )}
            <button
              className={cn('inline-flex items-center gap-2 rounded-lg text-sm font-medium px-4 py-2 transition-colors', canSave ? 'bg-[#126bce] text-white hover:bg-[#0f5ab8]' : 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed')}
              disabled={!canSave}
              onClick={() => handleSaveTemplate(false)}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 13 10 19 20 5"/>
              </svg>
              {isEdit ? 'Save changes' : 'Publish'}
            </button>
          </>
        )}
      </div>

      {/* Save success overlay */}
      {saving && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.50)' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '40px 48px', textAlign: 'center', boxShadow: '0 20px 48px rgba(0,0,0,0.18)', minWidth: 320 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 13 10 19 20 5"/>
              </svg>
            </div>
            <h2 style={{ font: '600 18px/24px Inter, sans-serif', color: '#0F172A', margin: '0 0 8px' }}>
              {savedAsDraft ? 'Saved as Draft' : 'Template Published!'}
            </h2>
            <p style={{ font: '400 14px/20px Inter, sans-serif', color: '#64748B', margin: 0 }}>
              {savedAsDraft
                ? `"${d.name}" was saved as a draft. Publish it when it's ready.`
                : `"${d.name}" is now active and ready to use in programs.`}
            </p>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

// ── SurveyTemplatesPage — main export ─────────────────────────────────────────

// ── Toast ─────────────────────────────────────────────────────────────────────

function SurveyToast({ message, type, onDismiss }: { message: string; type: 'success' | 'draft'; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000)
    return () => clearTimeout(t)
  }, [onDismiss])

  const isSuccess = type === 'success'

  return createPortal(
    <div style={{
      position: 'fixed', bottom: 24, right: 24,
      display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
      padding: 'var(--space-3) var(--space-4)',
      background: isSuccess ? 'var(--lyra-color-status-success-subtle)' : 'var(--lyra-color-bg-surface-base)',
      border: isSuccess
        ? '1px solid var(--lyra-color-status-success-medium)'
        : '1px solid var(--lyra-color-border-soft)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--sol-effect-shadowlg)',
      zIndex: 9999,
      minWidth: 240,
    }}>
      {/* Icon */}
      {isSuccess ? (
        <svg viewBox="0 0 20 20" width="20" height="20" fill="none" style={{ flexShrink: 0 }}>
          <circle cx="10" cy="10" r="10" fill="var(--lyra-color-status-success-strong)"/>
          <path d="M6 10.5l2.8 2.8 5-5.6" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) : (
        <svg viewBox="0 0 20 20" width="20" height="20" fill="none" style={{ flexShrink: 0 }}>
          <circle cx="10" cy="10" r="9" stroke="var(--lyra-color-fg-secondary)" strokeWidth="1.5"/>
          <path d="M10 6v5M10 13.5v.5" stroke="var(--lyra-color-fg-secondary)" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      )}

      {/* Message */}
      <span style={{
        flex: 1,
        font: '500 14px/20px var(--font-sans)',
        color: isSuccess ? 'var(--lyra-color-status-success-strong)' : 'var(--lyra-color-fg-default)',
      }}>
        {message}
      </span>

      {/* Dismiss */}
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        style={{
          background: 'none', border: 'none', padding: 2, cursor: 'pointer',
          color: isSuccess ? 'var(--lyra-color-status-success-strong)' : 'var(--lyra-color-fg-secondary)',
          display: 'flex', alignItems: 'center', borderRadius: 'var(--radius-xs)', flexShrink: 0,
        }}
      >
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <line x1="12" y1="4" x2="4" y2="12"/><line x1="4" y1="4" x2="12" y2="12"/>
        </svg>
      </button>
    </div>,
    document.body
  )
}

// ── MetricInfoTooltip ─────────────────────────────────────────────────────────

const METRIC_EXPLANATIONS = [
  { key: 'OSAT', label: 'OSAT', full: 'Overall Satisfaction', desc: 'Measures how satisfied the customer was with the person who handled their interaction.' },
  { key: 'ASAT', label: 'ASAT', full: 'Agent Satisfaction', desc: 'Measures satisfaction specifically with the agent who handled the call or chat.' },
  { key: 'CSAT', label: 'CSAT', full: 'Customer Satisfaction', desc: 'Measures how well this specific request or issue was resolved.' },
  { key: 'Verbatim', label: 'Verbatim', full: 'Open Text', desc: 'A free-text follow-up question where customers describe their experience in their own words.' },
]

const TOOLTIP_WIDTH = 296
const TOOLTIP_MARGIN = 12

function MetricInfoTooltip() {
  const [visible, setVisible] = useState(false)
  const [style, setStyle] = useState<React.CSSProperties>({})
  const btnRef = useRef<HTMLButtonElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  function computePos() {
    if (!btnRef.current) return
    const r = btnRef.current.getBoundingClientRect()
    const vw = window.innerWidth

    // Prefer right of button; flip to left if not enough space
    const spaceRight = vw - r.right - TOOLTIP_MARGIN
    let left: number
    if (spaceRight >= TOOLTIP_WIDTH) {
      left = r.right + 8
    } else {
      left = r.left - TOOLTIP_WIDTH - 8
    }
    left = Math.max(TOOLTIP_MARGIN, left)

    // Align top with button, clamped — actual height measured after render
    setStyle({ top: r.top, left })
  }

  // After render, clamp bottom to viewport
  useEffect(() => {
    if (!visible || !tooltipRef.current) return
    const vh = window.innerHeight
    const r = tooltipRef.current.getBoundingClientRect()
    if (r.bottom > vh - TOOLTIP_MARGIN) {
      setStyle(prev => ({ ...prev, top: Math.max(TOOLTIP_MARGIN, vh - r.height - TOOLTIP_MARGIN) }))
    }
  }, [visible])

  function show() {
    computePos()
    setVisible(true)
  }

  useEffect(() => {
    if (!visible) return
    const hide = (e: MouseEvent) => {
      if (
        btnRef.current?.contains(e.target as Node) ||
        tooltipRef.current?.contains(e.target as Node)
      ) return
      setVisible(false)
    }
    document.addEventListener('mousedown', hide)
    return () => document.removeEventListener('mousedown', hide)
  }, [visible])

  return (
    <>
      <button
        ref={btnRef}
        aria-label="What are these metrics?"
        onMouseEnter={show}
        onMouseLeave={e => {
          if (!tooltipRef.current?.contains(e.relatedTarget as Node)) setVisible(false)
        }}
        onClick={e => { e.stopPropagation(); visible ? setVisible(false) : show() }}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 20, height: 20, border: 'none', background: 'none',
          color: 'var(--lyra-color-fg-secondary)', cursor: 'pointer', padding: 0,
          borderRadius: 'var(--radius-full)', flexShrink: 0,
          transition: 'color 120ms',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--lyra-color-fg-default)'; show() }}
        onMouseLeave={e => {
          if (!tooltipRef.current?.contains(e.relatedTarget as Node)) {
            (e.currentTarget as HTMLElement).style.color = 'var(--lyra-color-fg-secondary)'
            setVisible(false)
          }
        }}
      >
        <Info size={14} />
      </button>
      {visible && createPortal(
        <div
          ref={tooltipRef}
          onMouseLeave={e => {
            if (!btnRef.current?.contains(e.relatedTarget as Node)) setVisible(false)
          }}
          style={{
            position: 'fixed', zIndex: 9999,
            width: TOOLTIP_WIDTH,
            background: 'var(--lyra-color-bg-surface-overlay)',
            border: '1px solid var(--lyra-color-border-soft)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--sol-effect-shadowlg)',
            padding: 'var(--space-4)',
            ...style,
          }}
        >
          {/* Header */}
          <p style={{
            margin: '0 0 var(--space-3)',
            font: '500 11px/14px var(--font-sans)',
            color: 'var(--lyra-color-fg-secondary)',
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            Metric types
          </p>

          {/* Divider */}
          <div style={{ height: 1, background: 'var(--lyra-color-border-subtle)', marginBottom: 'var(--space-3)' }} />

          {/* Metric rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {METRIC_EXPLANATIONS.map(m => (
              <div key={m.key} style={{ display: 'flex', gap: 'var(--space-3)' }}>
                {/* Acronym pill */}
                <div style={{
                  flexShrink: 0,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 44, height: 20, marginTop: 2,
                  borderRadius: 'var(--radius-xs)',
                  background: 'var(--lyra-color-bg-active-subtle)',
                  font: '500 11px/14px var(--font-sans)',
                  color: 'var(--lyra-color-fg-active-strong)',
                  letterSpacing: '0.03em',
                }}>
                  {m.label}
                </div>
                {/* Text */}
                <div>
                  <p style={{ margin: '0 0 2px', font: '500 13px/18px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>
                    {m.full}
                  </p>
                  <p style={{ margin: 0, font: '400 12px/18px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)' }}>
                    {m.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Verbatim ordering note */}
          <div style={{
            marginTop: 'var(--space-3)',
            paddingTop: 'var(--space-3)',
            borderTop: '1px solid var(--lyra-color-border-subtle)',
            font: '400 12px/16px var(--font-sans)',
            color: 'var(--lyra-color-fg-secondary)',
          }}>
            Verbatim must follow at least one scored metric (OSAT, ASAT, or CSAT) — it cannot be added first.
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

// ── CreateContextualSurvey ────────────────────────────────────────────────────

type MetricKey = 'OSAT' | 'ASAT' | 'CSAT' | 'Verbatim'

const METRIC_DEFS: { key: MetricKey; buttonLabel: string; cardLabel: string; desc: string }[] = [
  { key: 'OSAT',     buttonLabel: 'OSAT Questions',    cardLabel: 'OSAT question',     desc: 'Satisfaction with the person who handles the interaction.' },
  { key: 'ASAT',     buttonLabel: 'ASAT Questions',    cardLabel: 'ASAT question',     desc: 'Satisfaction with the person who handled the interaction.' },
  { key: 'CSAT',     buttonLabel: 'CSAT Questions',    cardLabel: 'CSAT question',     desc: 'Satisfaction with how this specific request was handled.' },
  { key: 'Verbatim', buttonLabel: 'Verbatim Question', cardLabel: 'Verbatim question', desc: 'Open text follow up, prompted from what the customer just contacted about.' },
]

function CreateContextualSurvey({
  onCancel,
  onSave,
  onDelete,
  onDuplicate,
  initial,
  allSurveyNames = [],
}: {
  onCancel: () => void
  onSave: (d: SurveyDesign) => void
  onDelete?: (id: string) => void
  onDuplicate?: (source: SurveyDesign) => void
  initial?: SurveyDesign
  allSurveyNames?: string[]
}) {
  const isEdit = !!initial
  const isLive = initial?.status === 'active'

  const [name, setName] = useState(initial?.name ?? '')
  const [nameError, setNameError] = useState(false)
  const [nameCharError, setNameCharError] = useState(false)
  const [metrics, setMetrics] = useState<MetricKey[]>(
    isEdit ? ['CSAT', 'ASAT', 'Verbatim'] : []
  )
  const [showDiscardWarning, setShowDiscardWarning] = useState(false)
  const [showDeleteWarning, setShowDeleteWarning] = useState(false)

  // Duplicate is disabled when a draft copy of this survey already exists
  const duplicateBase = initial?.name.replace(/ copy \d+$/, '') ?? ''
  const duplicateAlreadyExists = isEdit && isLive && allSurveyNames.some(
    n => n !== initial?.name && n.startsWith(duplicateBase + ' copy ')
  )
  const dragItem = useRef<number | null>(null)
  const dragOverItem = useRef<number | null>(null)

  function handleDragSort() {
    const from = dragItem.current
    const to = dragOverItem.current
    if (from === null || to === null || from === to) {
      dragItem.current = null
      dragOverItem.current = null
      return
    }
    const reordered = [...metrics]
    const [moved] = reordered.splice(from, 1)
    reordered.splice(to, 0, moved)
    // Verbatim cannot be first — swap with next item
    if (reordered[0] === 'Verbatim' && reordered.length > 1) {
      ;[reordered[0], reordered[1]] = [reordered[1], reordered[0]]
    }
    setMetrics(reordered)
    dragItem.current = null
    dragOverItem.current = null
  }

  // Whitelist: letters, digits, spaces, hyphens, underscores, apostrophes, periods
  const INVALID_NAME_CHARS = /[^A-Za-z0-9 \-_'.]/g

  // Track whether the user has changed anything from the initial values
  const initialMetricsKey = isEdit ? 'CSAT|ASAT|Verbatim' : ''
  const isDirty = isEdit
    ? (name !== (initial?.name ?? '') || metrics.join('|') !== initialMetricsKey)
    : (name.trim().length > 0 || metrics.length > 0)

  // Check if typed name clashes with an existing survey (excluding the survey being edited)
  const nameDuplicate = name.trim().length > 0 && allSurveyNames.some(
    n => n.toLowerCase() === name.trim().toLowerCase() && n !== (initial?.name ?? '')
  )

  const canPublish = name.trim().length > 0 && metrics.length > 0 && !nameDuplicate && (!isLive || isDirty)
  // For live survey edits, Discard & Publish require actual changes
  const canActOnLive = !isLive || isDirty

  const CARD = {
    background: 'var(--lyra-color-bg-surface-base)',
    border: '1px solid var(--lyra-color-border-subtle)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
  } as const

  const CARD_TOOLBAR = {
    padding: 'var(--space-4)',
  } as const

  const CARD_CONTENT = {
    padding: 'var(--space-6) var(--space-5)',
  } as const

  const INPUT_STYLE = {
    display: 'block', width: '100%', height: 36, boxSizing: 'border-box' as const,
    padding: '0 var(--space-3)',
    border: '1px solid var(--lyra-color-border-soft)',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--lyra-color-bg-field)',
    color: 'var(--lyra-color-fg-default)',
    font: '400 14px/20px var(--font-sans)',
    outline: 'none',
  }

  const LABEL_STYLE = {
    display: 'block',
    marginBottom: 'var(--space-2)',
    font: '500 14px/20px var(--font-sans)',
    color: 'var(--lyra-color-fg-default)',
  } as const

  const HELPER_STYLE = {
    margin: 'var(--space-2) 0 0',
    font: '400 14px/20px var(--font-sans)',
    color: 'var(--lyra-color-fg-secondary)',
  } as const

  const BTN_SECONDARY = {
    height: 32, padding: '0 var(--space-4)',
    border: '1px solid var(--lyra-color-border-soft)',
    borderRadius: 'var(--radius-md)',
    background: 'var(--lyra-color-bg-surface-base)',
    color: 'var(--lyra-color-fg-default)',
    font: '500 14px/20px var(--font-sans)',
    cursor: 'pointer', display: 'inline-flex' as const, alignItems: 'center' as const,
  }

  const BTN_DANGER = {
    height: 32, padding: '0 var(--space-4)',
    border: '1px solid var(--lyra-color-status-critical-medium)',
    borderRadius: 'var(--radius-md)',
    background: 'var(--lyra-color-bg-surface-base)',
    color: 'var(--lyra-color-status-critical-strong)',
    font: '500 14px/20px var(--font-sans)',
    cursor: 'pointer', display: 'inline-flex' as const, alignItems: 'center' as const,
  }

  const BTN_DISCARD = {
    height: 32, padding: '0 var(--space-4)',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    background: 'var(--lyra-color-bg-destructive)',
    color: 'var(--lyra-color-fg-on-primary)',
    font: '500 14px/20px var(--font-sans)',
    cursor: 'pointer', display: 'inline-flex' as const, alignItems: 'center' as const,
  }

  function save(asDraft: boolean) {
    if (!name.trim()) { setNameError(true); return }
    if (nameDuplicate) return
    if (!asDraft && !canPublish) return
    onSave({
      ...DEFAULT_DESIGN,
      ...(initial ?? {}),
      id: initial?.id ?? `contextual-${Date.now()}`,
      name: name.trim(),
      aiQuestions: true,
      questionModeDigital: 'ai',
      questionModeIVR: 'ai',
      status: asDraft ? 'draft' : 'active',
    })
  }

  const contextualBadge = (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 10px', borderRadius: 'var(--radius-full)',
      background: 'var(--lyra-color-bg-ai-surface)',
      color: 'var(--lyra-color-fg-ai)',
      font: '500 14px/20px var(--font-sans)',
    }}>
      Contextual
    </span>
  )

  const publishBtn = (
    <button
      onClick={() => save(false)}
      disabled={!canPublish}
      style={{
        height: 32, padding: '0 var(--space-4)',
        border: 'none', borderRadius: 'var(--radius-md)',
        background: canPublish ? 'var(--lyra-color-bg-primary)' : 'var(--lyra-color-bg-disabled)',
        color: canPublish ? 'var(--lyra-color-fg-on-primary)' : 'var(--lyra-color-fg-disabled)',
        font: '500 14px/20px var(--font-sans)',
        cursor: canPublish ? 'pointer' : 'not-allowed',
        display: 'inline-flex', alignItems: 'center',
      }}
      onMouseEnter={e => { if (canPublish) (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-primary)' }}
      onMouseLeave={e => { if (canPublish) (e.currentTarget as HTMLElement).style.background = canPublish ? 'var(--lyra-color-bg-primary)' : 'var(--lyra-color-bg-disabled)' }}
    >
      Publish
    </button>
  )

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: 'var(--lyra-color-bg-surface-base)' }}>

      {/* Page header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '16px 40px',
        minHeight: 80, padding: 'var(--space-4) var(--space-7)',
        borderBottom: '1px solid var(--lyra-color-border-subtle)',
        flexShrink: 0,
      }}>
        {/* Breadcrumb + title + badge — inline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          {isEdit ? (
            <>
              <button
                onClick={() => isDirty ? setShowDiscardWarning(true) : onCancel()}
                style={{
                  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                  font: '500 16px/20px var(--font-sans)',
                  color: 'var(--lyra-color-fg-link)',
                  textDecoration: 'none',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.textDecoration = 'underline' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.textDecoration = 'none' }}
              >Library</button>
              <span style={{ font: '400 16px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)' }}>/</span>
              <span style={{ font: '600 20px/24px var(--font-sans)', letterSpacing: '-0.019em', color: 'var(--lyra-color-fg-default)' }}>
                {initial.name}
              </span>
            </>
          ) : (
            <>
              <button
                onClick={() => isDirty ? setShowDiscardWarning(true) : onCancel()}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: '500 16px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)' }}
              >
                Library
              </button>
              <span style={{ font: '400 16px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>/</span>
              <button
                onClick={() => isDirty ? setShowDiscardWarning(true) : onCancel()}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: '600 20px/24px var(--font-sans)', letterSpacing: '-0.019em', color: 'var(--lyra-color-fg-default)' }}
              >
                Surveys
              </button>
            </>
          )}
          {contextualBadge}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          {isEdit ? (
            <>
              <button
                onClick={() => isDirty ? setShowDiscardWarning(true) : onCancel()}
                style={BTN_SECONDARY}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-bg-surface-base)' }}
              >
                Cancel
              </button>
              {/* Draft-only: Delete Survey (secondary, triggers warning modal) */}
              {!isLive && onDelete && (
                <>
                  <button
                    onClick={() => setShowDeleteWarning(true)}
                    style={BTN_SECONDARY}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-bg-surface-base)' }}
                  >
                    Delete Survey
                  </button>
                  <div style={{ width: 1, height: 20, background: 'var(--lyra-color-border-subtle)', flexShrink: 0 }} />
                </>
              )}
              <button
                onClick={() => { if (onDuplicate && initial && !duplicateAlreadyExists) onDuplicate(initial) }}
                disabled={duplicateAlreadyExists}
                style={{
                  ...BTN_SECONDARY,
                  opacity: duplicateAlreadyExists ? 0.4 : 1,
                  cursor: duplicateAlreadyExists ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={e => { if (!duplicateAlreadyExists) (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
                onMouseLeave={e => { if (!duplicateAlreadyExists) (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-bg-surface-base)' }}
              >
                Duplicate Survey
              </button>
              {/* Separator before Discard Changes */}
              <div style={{ width: 1, height: 20, background: 'var(--lyra-color-border-soft)', flexShrink: 0 }} />
              {isLive ? (
                /* Live: Discard Changes is destructive red, disabled until dirty */
                <button
                  onClick={() => canActOnLive ? onCancel() : undefined}
                  disabled={!canActOnLive}
                  style={{
                    ...BTN_DISCARD,
                    opacity: canActOnLive ? 1 : 0.4,
                    cursor: canActOnLive ? 'pointer' : 'not-allowed',
                  }}
                >
                  Discard Changes
                </button>
              ) : (
                /* Draft: Discard Changes resets the form when dirty */
                <button
                  disabled={!isDirty}
                  onClick={() => {
                    if (isDirty) {
                      setName(initial?.name ?? '')
                      setMetrics(isEdit ? ['CSAT', 'ASAT', 'Verbatim'] : [])
                    }
                  }}
                  style={{
                    ...BTN_DISCARD,
                    opacity: isDirty ? 1 : 0.4,
                    cursor: isDirty ? 'pointer' : 'not-allowed',
                  }}
                >
                  Discard Changes
                </button>
              )}
              {/* Separator before Publish */}
              <div style={{ width: 1, height: 20, background: 'var(--lyra-color-border-soft)', flexShrink: 0 }} />
              {publishBtn}
</>
          ) : (
            <>
              <button
                onClick={() => isDirty ? setShowDiscardWarning(true) : onCancel()}
                style={BTN_SECONDARY}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-bg-surface-base)' }}
              >
                Cancel
              </button>
              <div style={{ width: 1, height: 20, background: 'var(--lyra-color-border-soft)' }} />
              <button
                onClick={() => isDirty ? save(true) : undefined}
                disabled={!isDirty}
                style={{
                  ...BTN_SECONDARY,
                  opacity: isDirty ? 1 : 0.4,
                  cursor: isDirty ? 'pointer' : 'not-allowed',
                }}
                onMouseEnter={e => { if (isDirty) (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
                onMouseLeave={e => { if (isDirty) (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-bg-surface-base)' }}
              >
                Save as Draft
              </button>
              {publishBtn}
            </>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-auto" style={{ padding: 'var(--space-7)', background: 'var(--lyra-color-bg-surface-base)' }}>

        <p style={{ margin: '0 0 var(--space-10)', font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)' }}>
          Questions are automatically created based on the customer's interaction and conversation topic
        </p>

        {/* Two-column layout */}
        <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>

          {/* Left — form cards */}
          <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>

            {/* Name card */}
            <div style={CARD}>
              <div style={CARD_TOOLBAR}>
                <div style={{ font: '500 16px/24px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>Name</div>
                <div style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', letterSpacing: '0.01em', marginTop: 'var(--space-1)' }}>
                  Shown in the survey picker on every program.
                </div>
              </div>
              <div style={CARD_CONTENT}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                  <label style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>
                    Survey name <span style={{ color: 'var(--lyra-color-status-critical-strong)' }}>*</span>
                  </label>
                  <span style={{ font: '400 14px/20px var(--font-sans)', color: name.length >= 50 ? 'var(--lyra-color-status-critical-strong)' : 'var(--lyra-color-fg-secondary)' }}>
                    {name.length}/50
                  </span>
                </div>
                <input
                  style={{
                    ...INPUT_STYLE,
                    borderColor: (nameError || nameCharError || nameDuplicate) ? 'var(--lyra-color-status-critical-strong)' : 'var(--lyra-color-border-soft)',
                  }}
                  placeholder="Eg: Post Chat CSAT"
                  value={name}
                  maxLength={50}
                  onChange={e => {
                    const raw = e.target.value
                    const filtered = raw.replace(INVALID_NAME_CHARS, '')
                    setName(filtered)
                    setNameCharError(raw.length !== filtered.length)
                    if (filtered.trim()) setNameError(false)
                    if (raw.length === filtered.length) setNameCharError(false)
                  }}
                  onFocus={e => {
                    const hasErr = nameError || nameCharError || nameDuplicate
                    e.target.style.borderColor = hasErr ? 'var(--lyra-color-status-critical-strong)' : 'var(--lyra-color-border-active)'
                    e.target.style.boxShadow = hasErr ? '0 0 0 2px rgba(189,42,42,0.12)' : '0 0 0 2px rgba(24,91,164,0.12)'
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = (nameError || nameCharError || nameDuplicate) ? 'var(--lyra-color-status-critical-strong)' : 'var(--lyra-color-border-medium)'
                    e.target.style.boxShadow = 'none'
                  }}
                />
                {nameError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', marginTop: 'var(--space-1)' }}>
                    <svg viewBox="0 0 12 12" width="12" height="12" fill="none" style={{ flexShrink: 0 }}>
                      <circle cx="6" cy="6" r="5.25" stroke="var(--lyra-color-status-critical-strong)" strokeWidth="1.5"/>
                      <line x1="6" y1="4" x2="6" y2="6.5" stroke="var(--lyra-color-status-critical-strong)" strokeWidth="1.5" strokeLinecap="round"/>
                      <circle cx="6" cy="8.5" r="0.6" fill="var(--lyra-color-status-critical-strong)"/>
                    </svg>
                    <p style={{ margin: 0, font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-status-critical-strong)' }}>
                      Required
                    </p>
                  </div>
                )}
                {!nameError && nameCharError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', marginTop: 'var(--space-1)' }}>
                    <svg viewBox="0 0 12 12" width="12" height="12" fill="none" style={{ flexShrink: 0 }}>
                      <circle cx="6" cy="6" r="5.25" stroke="var(--lyra-color-status-critical-strong)" strokeWidth="1.5"/>
                      <line x1="6" y1="4" x2="6" y2="6.5" stroke="var(--lyra-color-status-critical-strong)" strokeWidth="1.5" strokeLinecap="round"/>
                      <circle cx="6" cy="8.5" r="0.6" fill="var(--lyra-color-status-critical-strong)"/>
                    </svg>
                    <p style={{ margin: 0, font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-status-critical-strong)' }}>
                      Only letters, numbers, spaces, and hyphens are allowed
                    </p>
                  </div>
                )}
                {!nameError && !nameCharError && nameDuplicate && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', marginTop: 'var(--space-1)' }}>
                    <svg viewBox="0 0 12 12" width="12" height="12" fill="none" style={{ flexShrink: 0 }}>
                      <circle cx="6" cy="6" r="5.25" stroke="var(--lyra-color-status-critical-strong)" strokeWidth="1.5"/>
                      <line x1="6" y1="4" x2="6" y2="6.5" stroke="var(--lyra-color-status-critical-strong)" strokeWidth="1.5" strokeLinecap="round"/>
                      <circle cx="6" cy="8.5" r="0.6" fill="var(--lyra-color-status-critical-strong)"/>
                    </svg>
                    <p style={{ margin: 0, font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-status-critical-strong)' }}>
                      A survey with this name already exists. Try a different name.
                    </p>
                  </div>
                )}
                {!nameError && !nameCharError && !nameDuplicate && <p style={HELPER_STYLE}>Shown in the programs list and in reporting.</p>}
              </div>
            </div>

            {/* Generation policy card */}
            <div style={CARD}>
              <div style={CARD_TOOLBAR}>
                <div style={{ font: '500 16px/24px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>Generation policy</div>
              </div>
              <div style={CARD_CONTENT}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div>
                    <label style={LABEL_STYLE}>Survey Language</label>
                    <select
                      disabled
                      style={{
                        ...INPUT_STYLE,
                        appearance: 'none' as const,
                        WebkitAppearance: 'none' as const,
                        backgroundColor: 'var(--lyra-color-bg-disabled)',
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2382959e' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right var(--space-3) center',
                        paddingRight: 'var(--space-7)',
                        color: 'var(--lyra-color-fg-disabled)',
                        cursor: 'not-allowed',
                      }}
                    >
                      <option value="en">English</option>
                    </select>
                    <p style={HELPER_STYLE}>Questions are shown in the customer's language when supported.</p>
                  </div>
                  <div>
                    <label style={LABEL_STYLE}>Fallback when the customer's language is not supported</label>
                    <select
                      disabled
                      style={{
                        ...INPUT_STYLE,
                        appearance: 'none' as const,
                        WebkitAppearance: 'none' as const,
                        backgroundColor: 'var(--lyra-color-bg-disabled)',
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2382959e' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right var(--space-3) center',
                        paddingRight: 'var(--space-7)',
                        color: 'var(--lyra-color-fg-disabled)',
                        cursor: 'not-allowed',
                      }}
                    >
                      <option value="en">Ask in English</option>
                    </select>
                    <p style={HELPER_STYLE}>Applied automatically when the survey is sent.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Question metrics card */}
            <div style={CARD}>
              <div style={CARD_TOOLBAR}>
                <div style={{ font: '500 16px/24px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>Question metrics</div>
                <div style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)', letterSpacing: '0.01em', marginTop: 'var(--space-1)' }}>
                  Choose a metric type below. The system will generate the question automatically
                </div>
              </div>
              <div style={{ ...CARD_CONTENT, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>

                {/* Section header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>
                      Metric types
                    </span>
                    <MetricInfoTooltip />
                  </div>
                  {metrics.length === 0 && (
                    <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)' }}>
                      Select at least one
                    </span>
                  )}
                </div>

                {/* Draggable added-metric rows */}
                {metrics.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    {metrics.map((key, idx) => {
                      const def = METRIC_DEFS.find(d => d.key === key)!
                      const CHEVRON_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2382959e' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`
                      return (
                        <div
                          key={key}
                          draggable
                          onDragStart={() => { dragItem.current = idx }}
                          onDragEnter={() => { dragOverItem.current = idx }}
                          onDragEnd={handleDragSort}
                          onDragOver={e => e.preventDefault()}
                          style={{
                            background: 'var(--lyra-color-bg-surface-shell)',
                            borderRadius: 'var(--radius-md)',
                            padding: 'var(--space-3) var(--space-4)',
                            display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)',
                            cursor: 'grab',
                          }}
                        >
                          {/* Grip handle */}
                          <svg
                            viewBox="0 0 16 16" width="16" height="16"
                            fill="var(--lyra-color-fg-secondary)"
                            style={{ flexShrink: 0, marginTop: 2, cursor: 'grab' }}
                          >
                            <circle cx="5.5" cy="3.5" r="1.2"/><circle cx="10.5" cy="3.5" r="1.2"/>
                            <circle cx="5.5" cy="8" r="1.2"/><circle cx="10.5" cy="8" r="1.2"/>
                            <circle cx="5.5" cy="12.5" r="1.2"/><circle cx="10.5" cy="12.5" r="1.2"/>
                          </svg>

                          {/* Metric info */}
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: '0 0 2px', font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>
                              {def.cardLabel}
                            </p>
                            <p style={{ margin: 0, font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)' }}>
                              {def.desc}
                            </p>
                            {key !== 'Verbatim' && (
                              <div style={{ marginTop: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>Scale</span>
                                <select
                                  disabled
                                  style={{
                                    height: 28, width: 120,
                                    padding: '0 20px 0 8px',
                                    border: '1px solid var(--lyra-color-border-soft)',
                                    borderRadius: 'var(--radius-sm)',
                                    background: `var(--lyra-color-bg-disabled) ${CHEVRON_SVG} no-repeat right 6px center`,
                                    color: 'var(--lyra-color-fg-secondary)',
                                    font: '400 14px/20px var(--font-sans)',
                                    appearance: 'none' as const, WebkitAppearance: 'none' as const,
                                    cursor: 'not-allowed', outline: 'none', boxSizing: 'border-box' as const,
                                  }}
                                >
                                  <option value="1-5">1 to 5</option>
                                </select>
                              </div>
                            )}
                          </div>

                          {/* Remove button */}
                          <button
                            onClick={() => setMetrics(prev => prev.filter(x => x !== key))}
                            aria-label={`Remove ${key}`}
                            style={{
                              flexShrink: 0, width: 28, height: 28,
                              border: 'none',
                              borderRadius: 'var(--radius-sm)',
                              background: 'transparent',
                              color: 'var(--lyra-color-fg-secondary)',
                              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              padding: 0,
                            }}
                            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--lyra-color-bg-disabled)'; el.style.color = 'var(--lyra-color-status-critical-strong)' }}
                            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.color = 'var(--lyra-color-fg-secondary)' }}
                          >
                            <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="2,4 14,4"/>
                              <path d="M5 4V2.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 .5.5V4"/>
                              <rect x="3" y="4" width="10" height="10" rx="1.5"/>
                              <line x1="6.5" y1="7" x2="6.5" y2="11"/>
                              <line x1="9.5" y1="7" x2="9.5" y2="11"/>
                            </svg>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Add metric section */}
                <div style={{ background: 'var(--lyra-color-bg-active-subtle)', borderRadius: 'var(--radius-md)', padding: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)' }}>
                    Add metric
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                    {METRIC_DEFS.map(({ key, buttonLabel }) => {
                      const added = metrics.includes(key)
                      const verbatimLocked = key === 'Verbatim' && !metrics.some(m => m !== 'Verbatim')
                      const disabled = added || verbatimLocked
                      return (
                        <button
                          key={key}
                          disabled={disabled}
                          title={verbatimLocked ? 'Add OSAT, ASAT, or CSAT first' : added ? 'Already added' : undefined}
                          onClick={() => setMetrics(prev => [...prev, key])}
                          style={{
                            height: 32, padding: '0 var(--space-3)',
                            border: '1px solid var(--lyra-color-border-soft)',
                            borderRadius: 'var(--radius-md)',
                            background: disabled ? 'var(--lyra-color-bg-disabled)' : 'var(--lyra-color-bg-surface-base)',
                            color: disabled ? 'var(--lyra-color-fg-disabled)' : 'var(--lyra-color-fg-secondary)',
                            font: '500 14px/20px var(--font-sans)',
                            cursor: disabled ? 'not-allowed' : 'pointer',
                            display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)',
                          }}
                          onMouseEnter={e => { if (!disabled) { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover)' } }}
                          onMouseLeave={e => { if (!disabled) { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-bg-surface-base)' } }}
                        >
                          {!added && !verbatimLocked && (
                            <svg viewBox="0 0 10 10" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <line x1="5" y1="1" x2="5" y2="9"/><line x1="1" y1="5" x2="9" y2="5"/>
                            </svg>
                          )}
                          {buttonLabel}
                        </button>
                      )
                    })}
                  </div>
                </div>
                </div>

              </div>
            </div>
          </div>{/* end left column */}

          {/* Right column */}
          <div style={{ width: 327, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

            {/* Summary card — edit mode only */}
            {isEdit && (
              <div style={{
                background: 'var(--lyra-color-bg-active-subtle)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
              }}>
                <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                  <p style={{ margin: 0, font: '500 16px/24px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>Summary</p>
                  {/* Row: Linked Programs */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 20 }}>
                    <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)' }}>Linked Programs</span>
                    <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>
                      {initial.usedBy ?? 0}
                    </span>
                  </div>
                  {/* Row: Modified */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 20 }}>
                    <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)' }}>Modified</span>
                    <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>{initial.updated || '—'}</span>
                  </div>
                  {/* Row: Modified By */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 20 }}>
                    <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)' }}>Modified By</span>
                    <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>{initial.owner || 'Jaden Smith'}</span>
                  </div>
                  {/* Row: Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 20 }}>
                    <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)' }}>Status</span>
                    {initial.status === 'active' ? (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        height: 24, padding: '0 var(--space-2)',
                        borderRadius: 'var(--radius-lg)',
                        background: '#d2f4d5',
                        font: '400 14px/20px var(--font-sans)',
                        color: '#2e430f',
                        letterSpacing: '0.01em',
                      }}>Live</span>
                    ) : (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        height: 24, padding: '0 var(--space-2)',
                        borderRadius: 'var(--radius-lg)',
                        background: '#e9edf1',
                        font: '400 14px/20px var(--font-sans)',
                        color: 'var(--lyra-color-fg-secondary)',
                        letterSpacing: '0.01em',
                      }}>Draft</span>
                    )}
                  </div>
                  {/* Row: Question Type */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 20 }}>
                    <span style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)' }}>Question Type</span>
                    <span style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>Contextual</span>
                  </div>
                </div>
              </div>
            )}

            {/* AI info panel */}
            <div style={{
              background: 'var(--lyra-color-bg-ai)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
            }}>
              <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                <p style={{ margin: 0, font: '500 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>
                  AI — How this works
                </p>
                <p style={{ margin: 0, font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>
                  You don't need to write questions manually. Choose the feedback metrics you want to measure, and AI will create relevant questions based on each customer interaction. Survey scores remain consistent, making results easy to track and compare.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Discard changes warning modal */}
      {showDiscardWarning && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.32)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => setShowDiscardWarning(false)}
        >
          <div
            style={{
              background: 'var(--lyra-color-bg-surface-base)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
              width: 400,
              padding: 'var(--space-6)',
              display: 'flex', flexDirection: 'column', gap: 'var(--space-4)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <p style={{ margin: 0, font: '600 16px/24px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>
              Discard changes?
            </p>
            <p style={{ margin: 0, font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)' }}>
              You have unsaved changes. If you leave now, your changes will be lost.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <button
                onClick={() => setShowDiscardWarning(false)}
                style={{
                  height: 36, padding: '0 var(--space-4)',
                  border: '1px solid var(--lyra-color-border-soft)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--lyra-color-bg-surface-base)',
                  color: 'var(--lyra-color-fg-default)',
                  font: '500 14px/20px var(--font-sans)',
                  cursor: 'pointer',
                }}
              >
                Keep editing
              </button>
              <button
                onClick={() => { setShowDiscardWarning(false); onCancel() }}
                style={{
                  height: 36, padding: '0 var(--space-4)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--lyra-color-bg-destructive)',
                  color: 'var(--lyra-color-fg-on-primary)',
                  font: '500 14px/20px var(--font-sans)',
                  cursor: 'pointer',
                }}
              >
                Discard changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete draft survey confirmation modal */}
      {showDeleteWarning && onDelete && initial && createPortal(
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.32)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowDeleteWarning(false)}
        >
          <div
            style={{ background: 'var(--lyra-color-bg-surface-base)', borderRadius: 'var(--radius-lg)', boxShadow: '0 8px 32px rgba(0,0,0,0.16)', width: 400, padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
            onClick={e => e.stopPropagation()}
          >
            <p style={{ margin: 0, font: '600 16px/24px var(--font-sans)', color: 'var(--lyra-color-fg-default)' }}>Delete survey?</p>
            <p style={{ margin: 0, font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-secondary)' }}>
              This draft survey hasn't been published. Deleting it is permanent and cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <button
                onClick={() => setShowDeleteWarning(false)}
                style={{ height: 36, padding: '0 var(--space-4)', border: '1px solid var(--lyra-color-border-soft)', borderRadius: 'var(--radius-md)', background: 'var(--lyra-color-bg-surface-base)', color: 'var(--lyra-color-fg-default)', font: '500 14px/20px var(--font-sans)', cursor: 'pointer' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-bg-surface-base)' }}
              >
                Cancel
              </button>
              <button
                onClick={() => { onDelete(initial.id); onCancel() }}
                style={{ height: 36, padding: '0 var(--space-4)', border: 'none', borderRadius: 'var(--radius-md)', background: 'var(--lyra-color-bg-destructive)', color: 'var(--lyra-color-fg-on-primary)', font: '500 14px/20px var(--font-sans)', cursor: 'pointer' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.88' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
              >
                Delete survey
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export function SurveyTemplatesPage() {
  const [view, setView] = useState<ViewMode>('list')
  const [openDesign, setOpenDesign] = useState<SurveyDesign | null>(null)
  const [editDesign, setEditDesign] = useState<SurveyDesign | null>(null)
  const [newDesigns, setNewDesigns] = useState<SurveyDesign[]>([])
  const [createChannel] = useState<'Digital' | 'IVR'>('Digital')
  const [createIsContextual, setCreateIsContextual] = useState(true)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [toastType, setToastType] = useState<'success' | 'draft'>('success')
  const [highlightedId, setHighlightedId] = useState<string | null>(null)

  const handleCreate = (type: 'Contextual' | 'Manual') => {
    setCreateIsContextual(type === 'Contextual')
    setEditDesign(null)
    setView('create')
  }

  const handleOpen = (d: SurveyDesign) => {
    setEditDesign(d)
    setView('edit')
  }

  const handleEdit = (d: SurveyDesign) => {
    setEditDesign(d)
    setView('edit')
  }

  const handleSave = (d: SurveyDesign) => {
    const isNew = !editDesign || d.id !== editDesign.id
    const saved: SurveyDesign = {
      ...d,
      id: d.id || `design-${Date.now()}`,
      updated: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: d.status ?? 'active',
      isNew: true,
      channel: createChannel,
      _sortTs: Date.now(),
    }
    setNewDesigns(prev => {
      const existing = prev.findIndex(x => x.id === saved.id)
      if (existing >= 0) {
        const next = [...prev]
        next[existing] = saved
        return next
      }
      return [saved, ...prev]
    })
    const isDraft = saved.status === 'draft'
    setToastType(isDraft ? 'draft' : 'success')
    setToastMsg(
      isDraft
        ? 'Survey saved as draft'
        : isNew
          ? 'Survey Created Successfully'
          : 'Survey Published Successfully'
    )
    // Highlight the saved row for 3 seconds
    setHighlightedId(saved.id)
    setTimeout(() => setHighlightedId(null), 3000)
    setView('list')
  }

  const handleDelete = (id: string) => {
    setNewDesigns(prev => prev.filter(x => x.id !== id))
    setView('list')
  }

  const handleDuplicate = (source: SurveyDesign) => {
    const allNames = [...newDesigns, ...SEED_DESIGNS].map(d => d.name)
    const base = source.name.replace(/ copy \d+$/, '')
    let copyName = ''
    for (let n = 1; ; n++) {
      const candidate = `${base} copy ${n}`
      if (!allNames.includes(candidate)) { copyName = candidate; break }
    }
    const duplicate: SurveyDesign = {
      ...source,
      id: `design-${Date.now()}`,
      name: copyName,
      status: 'draft',
      usedBy: 0,
      isNew: true,
      updated: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      _sortTs: Date.now(),
    }
    setNewDesigns(prev => [duplicate, ...prev])
    setToastType('draft')
    setToastMsg('Duplicate survey created in draft state')
    setHighlightedId(duplicate.id)
    setTimeout(() => setHighlightedId(null), 3000)
    setTimeout(() => setToastMsg(null), 3000)
  }

  const handleDuplicateAndEdit = (source: SurveyDesign) => {
    const allNames = [...newDesigns, ...SEED_DESIGNS].map(d => d.name)
    const base = source.name.replace(/ copy \d+$/, '')
    let copyName = ''
    for (let n = 1; ; n++) {
      const candidate = `${base} copy ${n}`
      if (!allNames.includes(candidate)) { copyName = candidate; break }
    }
    const duplicate: SurveyDesign = {
      ...source,
      id: `design-${Date.now()}`,
      name: copyName,
      status: 'draft',
      usedBy: 0,
      isNew: true,
      owner: 'Jaden Smith',
      updated: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      _sortTs: Date.now(),
    }
    setNewDesigns(prev => [duplicate, ...prev])
    setEditDesign(duplicate)
    setView('edit')
  }

  const handleCancel = () => {
    setView('list')
  }

  const editIsContextual = editDesign?.aiQuestions === true
  const allSurveyNames = [...newDesigns, ...SEED_DESIGNS].map(d => d.name)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {view === 'list' && (
        <SurveyDesignsGrid
          onCreate={handleCreate}
          onOpen={handleOpen}
          onEdit={handleEdit}
          onDuplicate={handleDuplicate}
          newDesigns={newDesigns}
          highlightId={highlightedId}
        />
      )}
      {view === 'detail' && openDesign && (
        <SurveyTemplateDetail
          design={openDesign}
          onBack={() => setView('list')}
          onEdit={handleEdit}
        />
      )}
      {view === 'create' && createIsContextual && (
        <CreateContextualSurvey onCancel={handleCancel} onSave={handleSave} allSurveyNames={allSurveyNames} />
      )}
      {view === 'edit' && editIsContextual && editDesign && (
        <CreateContextualSurvey
          key={editDesign.id}
          onCancel={handleCancel}
          onSave={handleSave}
          onDelete={handleDelete}
          onDuplicate={handleDuplicateAndEdit}
          initial={editDesign}
          allSurveyNames={allSurveyNames}
        />
      )}
      {((view === 'create' && !createIsContextual) || (view === 'edit' && !editIsContextual)) && (
        <CreateSurveyDesign
          onCancel={handleCancel}
          onSave={handleSave}
          initial={view === 'edit'
            ? (editDesign ?? undefined)
            : { ...DEFAULT_DESIGN, channel: createChannel, aiQuestions: false, questionModeDigital: 'standard', questionModeIVR: 'standard' }}
        />
      )}
      {toastMsg && (
        <SurveyToast message={toastMsg} type={toastType} onDismiss={() => setToastMsg(null)} />
      )}
    </div>
  )
}
