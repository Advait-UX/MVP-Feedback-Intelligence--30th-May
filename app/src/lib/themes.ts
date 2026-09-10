export type QType = 'osat' | 'asat' | 'csat' | 'verbatim'
export type ThemeChannel = 'digital'

export interface QuestionConfig {
  control: string
  scaleLabels: boolean
  lowLabel: string
  highLabel: string
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
}

export const CONTROL_OPTIONS: Record<ThemeChannel, { scale: string[]; verbatim: string[] }> = {
  digital: { scale: ['quickreply', 'listpicker'], verbatim: ['textarea'] },
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
      },
      {
        id:  't3',
        nm:  'Billing — Digital',
        sys: false,
        def: false,
        ds:  'Quick reply control with scale labels on. Used by the Billing Support program.',
        ch:  'digital',
        q: {
          osat:     { control: 'quickreply', scaleLabels: true,  lowLabel: 'Very dissatisfied', highLabel: 'Very satisfied', listPickerLabel: 'Rate your experience' },
          asat:     { control: 'quickreply', scaleLabels: true,  lowLabel: 'Very dissatisfied', highLabel: 'Very satisfied', listPickerLabel: 'Rate your experience' },
          csat:     { control: 'quickreply', scaleLabels: false, lowLabel: 'Very dissatisfied', highLabel: 'Very satisfied', listPickerLabel: 'Rate your experience' },
          verbatim: { control: 'textarea',   scaleLabels: false, lowLabel: '',                  highLabel: '',               listPickerLabel: '' },
        },
        msg: {
          ...makeMsg(),
          intro: 'How was your billing support experience? Your feedback helps our team.',
        },
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
  if (idx !== -1) arr[idx] = updated
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
  }
  db.lf[ch].push(t)
  return t
}

export function duplicateTheme(theme: Theme): Theme {
  const baseName = theme.sys ? 'Digital theme' : theme.nm
  const copy: Theme = {
    ...(JSON.parse(JSON.stringify(theme)) as Theme),
    id:  `t${Date.now()}`,
    nm:  `${baseName} (copy)`.slice(0, 50),
    sys: false,
    def: false,
    ds:  'Custom digital theme',
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
