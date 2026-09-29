export type QType = 'osat' | 'asat' | 'csat' | 'verbatim'
export type ThemeChannel = 'digital'

export interface QuestionConfig {
  control: string
  scaleLabels: boolean
  lowLabel: string
  highLabel: string
  midLabels: [string, string, string]
  listPickerLabel: string
}

export interface MessageConfig {
  mode: 'optout' | 'plain' | 'none'
  startLabel: string
  intro: string
  optLabel: string
  thanks: string
}

export interface Theme {
  id: string
  nm: string
  sys: boolean
  def: boolean
  ds: string
  ch: ThemeChannel
  q: Record<QType, QuestionConfig>
  msg: MessageConfig
  updatedOn?: string
  updatedBy?: string
  linkedPrograms?: string[]
}

export const CONTROL_OPTIONS: Record<ThemeChannel, { scale: string[]; verbatim: string[] }> = {
  digital: { scale: ['listpicker', 'quickreply'], verbatim: ['textarea'] },
}

const DEFAULT_CONTROLS: Record<ThemeChannel, { scale: string; verbatim: string }> = {
  digital: { scale: 'listpicker', verbatim: 'textarea' },
}

function makeQ(ch: ThemeChannel): Record<QType, QuestionConfig> {
  const s = DEFAULT_CONTROLS[ch]
  const base: Omit<QuestionConfig, 'control'> = {
    scaleLabels: false,
    lowLabel: 'Very dissatisfied',
    highLabel: 'Very satisfied',
    midLabels: ['Dissatisfied', 'Neutral', 'Satisfied'],
    listPickerLabel: 'Rate your experience',
  }
  return {
    osat:     { ...base, control: s.scale },
    asat:     { ...base, control: s.scale },
    csat:     { ...base, control: s.scale },
    verbatim: { ...base, control: s.verbatim },
  }
}

function makeMsg(): MessageConfig {
  return {
    mode: 'optout',
    startLabel: 'Get Started',
    intro: "Dear {contact_firstName}, We'd love to hear about your experience today. We have just a few quick questions, just two minutes. Thanks! What will your feedback tell us.",
    optLabel: 'Not Today',
    thanks: 'Thank you {contact_firstName} for providing your valuable feedback.',
  }
}

export const db: { lf: Record<ThemeChannel, Theme[]> } = {
  lf: {
    digital: [
      {
        id:  'lfd1',
        nm:  'Digital — system default',
        sys: true,
        def: true,
        ds:  "Default digital theme. Applied to any program that hasn't set a custom theme.",
        ch:  'digital',
        q:   makeQ('digital'),
        msg: makeMsg(),
        linkedPrograms: ['Billing Effort Score', 'Home service feedback survey', 'Tech support satisfaction survey', 'Product quality feedback survey', 'Fitness program satisfaction survey', 'Onboarding Feedback B2B'],
      },
      {
        id:  't3',
        nm:  'Digital - Theme for billing related survey',
        sys: false,
        def: false,
        ds:  'Quick reply control with scale labels on. Used by the Billing Support program.',
        ch:  'digital',
        q: {
          osat:     { control: 'quickreply', scaleLabels: true,  lowLabel: 'Very dissatisfied', highLabel: 'Very satisfied', midLabels: ['Dissatisfied', 'Neutral', 'Satisfied'], listPickerLabel: 'Rate your experience' },
          asat:     { control: 'quickreply', scaleLabels: true,  lowLabel: 'Very dissatisfied', highLabel: 'Very satisfied', midLabels: ['Dissatisfied', 'Neutral', 'Satisfied'], listPickerLabel: 'Rate your experience' },
          csat:     { control: 'quickreply', scaleLabels: false, lowLabel: 'Very dissatisfied', highLabel: 'Very satisfied', midLabels: ['Dissatisfied', 'Neutral', 'Satisfied'], listPickerLabel: 'Rate your experience' },
          verbatim: { control: 'textarea',   scaleLabels: false, lowLabel: '',                  highLabel: '',               midLabels: ['', '', ''],                             listPickerLabel: '' },
        },
        msg: {
          ...makeMsg(),
          intro: 'How was your billing support experience? Your feedback helps our team.',
        },
        updatedOn: 'Aug 11, 2026 10:55:06 AM',
        updatedBy: 'Maria',
        linkedPrograms: ['Billing Effort Score'],
      },
      {
        id:  't4',
        nm:  'Digital - Theme for retail survey',
        sys: false,
        def: false,
        ds:  'Quick reply control. Used by the Retail Feedback program.',
        ch:  'digital',
        q:   makeQ('digital'),
        msg: {
          ...makeMsg(),
          intro: 'How was your shopping experience with us today?',
        },
        updatedOn: 'Aug 12, 2026 10:55:06 AM',
        updatedBy: 'Dave',
        linkedPrograms: [],
      },
    ],
  },
}

export function getAllThemes(): Theme[] {
  return [...db.lf.digital]
}

export function getThemeById(id: string): Theme | undefined {
  return getAllThemes().find(t => t.id === id)
}

export function getControlOptions(ch: ThemeChannel, qType: QType): string[] {
  return qType === 'verbatim' ? CONTROL_OPTIONS[ch].verbatim : CONTROL_OPTIONS[ch].scale
}

export function syncTheme(updated: Theme): void {
  const arr = db.lf[updated.ch]
  const idx = arr.findIndex(t => t.id === updated.id)
  if (idx !== -1) arr[idx] = { ...updated, updatedOn: nowStamp(), updatedBy: 'Advait Patil' }
}

function nowStamp(): string {
  const now = new Date()
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  let h = now.getHours()
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()} ${String(h).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')} ${ampm}`
}

export function createTheme(nm: string, ch: ThemeChannel): Theme {
  const t: Theme = {
    id:  `t${Date.now()}`,
    nm:  sanitizeName(nm).slice(0, 50),
    sys: false,
    def: false,
    ds:  'Custom digital theme',
    ch,
    q:   makeQ(ch),
    msg: makeMsg(),
    updatedOn: nowStamp(),
    updatedBy: 'Advait Patil',
  }
  db.lf[ch].push(t)
  return t
}

export function makeDraftTheme(ch: ThemeChannel): Theme {
  return {
    id: '',
    nm: '',
    sys: false,
    def: false,
    ds: 'Custom digital theme',
    ch,
    q: makeQ(ch),
    msg: makeMsg(),
  }
}

export function saveNewTheme(theme: Theme): Theme {
  const t: Theme = {
    ...theme,
    id: `t${Date.now()}`,
    nm: sanitizeName(theme.nm).trim().slice(0, 50),
    updatedOn: nowStamp(),
    updatedBy: 'Advait Patil',
  }
  db.lf[theme.ch].push(t)
  return t
}

export function suggestDuplicateName(theme: Theme): string {
  const baseName = theme.sys ? 'Digital —' : theme.nm
  const existing = new Set(getAllThemes().map(t => t.nm.trim().toLowerCase()))
  let n = 1
  let candidate = `${baseName} (Copy ${n})`.slice(0, 50)
  while (existing.has(candidate.trim().toLowerCase())) {
    n += 1
    candidate = `${baseName} (Copy ${n})`.slice(0, 50)
  }
  return candidate
}

export function isThemeNameTaken(nm: string, excludeId?: string): boolean {
  const q = nm.trim().toLowerCase()
  return getAllThemes().some(t => t.id !== excludeId && t.nm.trim().toLowerCase() === q)
}

export function duplicateTheme(theme: Theme, name?: string): Theme {
  const nm = (name?.trim() || suggestDuplicateName(theme)).slice(0, 50)
  const copy: Theme = {
    ...(JSON.parse(JSON.stringify(theme)) as Theme),
    id:  `t${Date.now()}`,
    nm,
    sys: false,
    def: false,
    ds:  'Custom digital theme',
    updatedOn: nowStamp(),
    updatedBy: 'Advait Patil',
  }
  db.lf[theme.ch].push(copy)
  return copy
}

export function deleteTheme(theme: Theme): { ok: boolean; reason?: string } {
  if (theme.sys) return { ok: false, reason: 'System themes cannot be deleted.' }
  const arr = db.lf[theme.ch]
  if (arr.length <= 1) return { ok: false, reason: 'Cannot delete the only theme for this channel.' }
  const idx = arr.findIndex(t => t.id === theme.id)
  if (idx === -1) return { ok: false }
  arr.splice(idx, 1)
  if (theme.def && arr.length > 0) arr[0].def = true
  return { ok: true }
}

/* ─── Validation helpers ─── */

const RESTRICTED_RE = /[\\\/!+<>?#&,%"]/g

export function sanitizeName(v: string): string {
  return v.replace(RESTRICTED_RE, '')
}

export function hasRestrictedChars(v: string): boolean {
  return RESTRICTED_RE.test(v)
}

export interface ThemeValidationErrors {
  nm?: string
  listPickerLabel?: string
  startLabel?: string
  optLabel?: string
}

export function validateTheme(theme: Theme): ThemeValidationErrors {
  const errors: ThemeValidationErrors = {}
  if (!theme.nm.trim()) errors.nm = 'Required'
  if (theme.q.osat.control === 'listpicker' || theme.q.asat.control === 'listpicker' ||
      theme.q.csat.control === 'listpicker') {
    const hasEmpty = (['osat', 'asat', 'csat'] as QType[]).some(
      qt => theme.q[qt].control === 'listpicker' && !theme.q[qt].listPickerLabel.trim()
    )
    if (hasEmpty) errors.listPickerLabel = 'Required'
  }
  if (!theme.msg.startLabel.trim()) errors.startLabel = 'Required'
  if (theme.msg.mode === 'optout' && !theme.msg.optLabel.trim()) errors.optLabel = 'Required'
  return errors
}

export function hasValidationErrors(errors: ThemeValidationErrors): boolean {
  return Object.keys(errors).length > 0
}
