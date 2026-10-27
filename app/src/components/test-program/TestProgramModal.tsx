import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  FlaskConical, Sparkles, X, Info, Search, Layers, ChevronDown, ChevronUp, Check, CheckCircle2,
  Circle, MessageSquare, Smartphone, ShieldCheck, Bell, Activity, ArrowRight, RotateCcw, Play,
  Send, AlertTriangle, Lock, CirclePlay,
} from 'lucide-react'
import {
  TEST_BATCH, SAMPLE_INTERACTION_ID, STANDARD_QUESTION, RATING_PROMPT, RATING_LABELS,
  BATCH_LIMIT, RECOMMENDED_CONFIDENT, bandOf, BAND_LABEL,
} from '../../lib/testProgram'
import type { RatingBand, TestInteraction } from '../../lib/testProgram'

/* ───────────────────────────── tokens / helpers ───────────────────────────── */

const F = 'var(--font-sans)'
const AI_COLOR = 'var(--lyra-purple-700, #4E39A8)'   // Lyra AI purple-700
const T = {
  fg: 'var(--lyra-color-fg-default)',
  fg2: 'var(--lyra-color-fg-secondary)',
  fg3: 'var(--lyra-color-fg-disabled)',
  link: 'var(--lyra-color-fg-link)',
  border: 'var(--lyra-color-border-soft)',
  borderSubtle: 'var(--lyra-color-border-subtle)',
  active: 'var(--lyra-color-border-active)',
  base: 'var(--lyra-color-bg-surface-base)',
  shell: 'var(--lyra-color-bg-surface-shell)',
  canvas: 'var(--lyra-color-bg-surface-canvas)',
  activeSubtle: 'var(--lyra-color-bg-active-subtle)',
  primary: 'var(--lyra-color-bg-primary)',
  onPrimary: 'var(--lyra-color-fg-on-primary)',
  ok: 'var(--lyra-color-status-success-strong)',
  okBg: 'var(--lyra-color-status-success-subtle)',
  warn: 'var(--lyra-color-status-warning-strong)',
  warnBg: 'var(--lyra-color-status-warning-subtle)',
  warnMid: 'var(--lyra-color-status-warning-medium)',
  err: 'var(--lyra-color-status-critical-strong)',
  aiBg: 'var(--lyra-color-bg-ai)',
}

type BtnVariant = 'primary' | 'secondary' | 'ghost'
function Btn({ children, variant = 'secondary', onClick, disabled, small, style }: {
  children: React.ReactNode; variant?: BtnVariant; onClick?: () => void; disabled?: boolean; small?: boolean; style?: React.CSSProperties
}) {
  const h = small ? 32 : 36
  const base: React.CSSProperties = {
    height: h, padding: small ? '0 12px' : '0 16px', borderRadius: 'var(--radius-md)',
    font: `500 14px/20px ${F}`, cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', flexShrink: 0,
    transition: 'background 120ms',
  }
  const v: React.CSSProperties =
    disabled ? { border: 'none', background: 'var(--lyra-color-bg-disabled)', color: T.fg3 }
    : variant === 'primary' ? { border: 'none', background: T.primary, color: T.onPrimary }
    : variant === 'ghost' ? { border: 'none', background: 'transparent', color: T.link }
    : { border: `1px solid ${T.border}`, background: T.base, color: T.fg }
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{ ...base, ...v, ...style }}
      onMouseEnter={e => { if (disabled) return; (e.currentTarget as HTMLElement).style.background = variant === 'primary' ? 'var(--lyra-color-state-bg-hover-primary)' : 'var(--lyra-color-state-bg-hover-opacity)' }}
      onMouseLeave={e => { if (disabled) return; (e.currentTarget as HTMLElement).style.background = variant === 'primary' ? T.primary : variant === 'ghost' ? 'transparent' : T.base }}
    >{children}</button>
  )
}

function LinkBtn({ children, onClick, style }: { children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties }) {
  return (
    <button onClick={onClick} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: `500 13px/18px ${F}`, color: T.link, display: 'inline-flex', alignItems: 'center', gap: 4, ...style }}>
      {children}
    </button>
  )
}

function AiBadge({ label = 'Feedback Intelligence' }: { label?: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 'var(--radius-full)', background: T.aiBg, border: `1px solid ${T.borderSubtle}`, font: `500 12px/16px ${F}`, color: AI_COLOR }}>
      <Sparkles size={12} /> {label}
    </span>
  )
}

function Card({ children, style, tone }: { children: React.ReactNode; style?: React.CSSProperties; tone?: 'ai' | 'subtle' }) {
  return (
    <div style={{
      background: tone === 'ai' ? T.aiBg : tone === 'subtle' ? T.canvas : T.base,
      border: `1px solid ${T.border}`, borderRadius: 'var(--radius-lg)', padding: 16, ...style,
    }}>{children}</div>
  )
}

function SectionTitle({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: T.activeSubtle, color: T.link, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ font: `500 16px/20px ${F}`, color: T.fg, letterSpacing: '-0.01em' }}>{title}</div>
        <div style={{ font: `400 13px/18px ${F}`, color: T.fg2, marginTop: 2 }}>{sub}</div>
      </div>
    </div>
  )
}

function StatTile({ label, value, hint }: { label: string; value: React.ReactNode; hint: string }) {
  return (
    <div style={{ flex: 1, minWidth: 0, background: T.base, border: `1px solid ${T.border}`, borderRadius: 'var(--radius-md)', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ font: `400 12px/16px ${F}`, color: T.fg2 }}>{label}</div>
      <div style={{ font: `600 20px/24px ${F}`, color: T.fg, letterSpacing: '-0.01em' }}>{value}</div>
      <div style={{ font: `400 12px/16px ${F}`, color: T.fg2 }}>{hint}</div>
    </div>
  )
}

function Pill({ children, tone }: { children: React.ReactNode; tone: 'ok' | 'warn' | 'neutral' | 'ai' | 'info' }) {
  const s: Record<string, React.CSSProperties> = {
    ok: { background: T.okBg, color: T.ok },
    warn: { background: T.warnBg, color: T.warn },
    neutral: { background: 'var(--lyra-slate-100)', color: 'var(--lyra-slate-600)' },
    ai: { background: T.aiBg, color: AI_COLOR, border: `1px solid ${T.borderSubtle}` },
    info: { background: T.activeSubtle, color: T.link },
  }
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 'var(--radius-full)', font: `500 12px/16px ${F}`, whiteSpace: 'nowrap', ...s[tone] }}>{children}</span>
}

function BandTag({ band }: { band: RatingBand }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: AI_COLOR, color: T.onPrimary, font: `500 11px/16px ${F}`, whiteSpace: 'nowrap', flexShrink: 0 }}>
      {BAND_LABEL[band]}
    </span>
  )
}

/* ───────────────────────────── stepper ───────────────────────────── */

const STEPS = ['Find an interaction', 'Conversation', 'Feedback Intelligence Read', 'The customer answers', 'Your decision']

function Stepper({ current }: { current: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderBottom: `1px solid ${T.borderSubtle}`, overflowX: 'auto', flexShrink: 0 }}>
      {STEPS.map((label, i) => {
        const n = i + 1
        const done = n < current, active = n === current
        return (
          <React.Fragment key={label}>
            {i > 0 && <div style={{ width: 24, height: 1, background: done || active ? 'var(--lyra-brand-300)' : T.border, flexShrink: 0 }} />}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: active ? '4px 12px 4px 6px' : '4px 4px', borderRadius: 'var(--radius-full)', background: active ? T.activeSubtle : 'transparent', whiteSpace: 'nowrap' }}>
              {done ? <Check size={14} style={{ color: T.ok }} /> : (
                <span style={{ width: 20, height: 20, borderRadius: 'var(--radius-full)', background: active ? T.primary : 'transparent', color: active ? T.onPrimary : T.fg2, font: `500 12px/20px ${F}`, textAlign: 'center' }}>{n}</span>
              )}
              <span style={{ font: `${active ? 500 : 400} 13px/18px ${F}`, color: active ? T.link : done ? T.fg : T.fg2 }}>{label}</span>
            </div>
          </React.Fragment>
        )
      })}
    </div>
  )
}

/* ───────────────────────────── phone ───────────────────────────── */

type PhoneStage = 'invite' | 'declined' | 'rating' | 'followup' | 'done'

function Bubble({ from, children, strong }: { from: 'team' | 'customer'; children: React.ReactNode; strong?: boolean }) {
  const isC = from === 'customer'
  return (
    <div style={{ display: 'flex', justifyContent: isC ? 'flex-end' : 'flex-start' }}>
      <div style={{
        maxWidth: '88%', padding: '10px 12px', borderRadius: 12,
        background: isC ? T.primary : T.base, color: isC ? T.onPrimary : T.fg,
        border: isC ? 'none' : `1px solid ${T.borderSubtle}`,
        font: `${strong ? 500 : 400} 13px/18px ${F}`,
        borderBottomRightRadius: isC ? 4 : 12, borderBottomLeftRadius: isC ? 12 : 4,
      }}>{children}</div>
    </div>
  )
}

function Phone({ ix, stage, rating, answer, followUpText, whyOpen, writeOwn, draft, themeName, onStart, onDecline, onRate, onAnswer, onToggleWhy, onWriteOwn, onDraft, onRestart }: {
  ix: TestInteraction; stage: PhoneStage; rating: number | null; answer: string | null; followUpText: string
  whyOpen: boolean; writeOwn: boolean; draft: string; themeName: string
  onStart: () => void; onDecline: () => void; onRate: (r: number) => void; onAnswer: (a: string) => void
  onToggleWhy: () => void; onWriteOwn: () => void; onDraft: (v: string) => void; onRestart: () => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => { const el = scrollRef.current; if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }) }, [stage, whyOpen, writeOwn, followUpText])
  const band = rating ? bandOf(rating) : 'low'
  const hint =
    stage === 'invite' ? "You're the customer. Tap Get Started." :
    stage === 'declined' ? `${ix.firstName} declined the survey. Restart to try again.` :
    stage === 'rating' ? "You're the customer. Tap a rating." :
    stage === 'followup' ? 'Pick an answer, or write your own.' :
    'Survey complete. Your next step is below.'
  const inputOn = stage === 'followup' && writeOwn

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ font: `500 13px/18px ${F}`, color: AI_COLOR, textAlign: 'center' }}>{hint}</div>
      <div style={{ width: 300, height: 480, borderRadius: 28, background: 'var(--lyra-color-bg-surface-inverse)', padding: 8, boxShadow: 'var(--sol-effect-shadowmd)', flexShrink: 0 }}>
        <div style={{ width: '100%', height: '100%', borderRadius: 22, background: T.shell, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px 10px', background: T.base, borderBottom: `1px solid ${T.borderSubtle}`, font: `500 13px/18px ${F}`, color: T.fg, textAlign: 'center', flexShrink: 0 }}>{ix.team}</div>
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Bubble from="team">Dear {ix.firstName}, we'd love to hear about your experience today. We have just a few quick questions, just two minutes. Thanks! What will your feedback tell us.</Bubble>
            {stage === 'invite' && (
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn variant="primary" small onClick={onStart}>Get Started</Btn>
                <Btn small onClick={onDecline}>Not Today</Btn>
              </div>
            )}
            {stage === 'declined' && (
              <>
                <Bubble from="customer">Not today</Bubble>
                <Bubble from="team">No problem, {ix.firstName}. Thanks for your time.</Bubble>
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}><Btn small onClick={onRestart}><RotateCcw size={14} />Restart survey</Btn></div>
              </>
            )}
            {(stage === 'rating' || stage === 'followup' || stage === 'done') && (
              <>
                <Bubble from="customer">Get Started</Bubble>
                <Bubble from="team">{RATING_PROMPT}</Bubble>
                <div style={{ background: T.base, border: `1px solid ${T.borderSubtle}`, borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '8px 12px 4px', font: `500 10px/14px ${F}`, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.fg2 }}>Rate your experience</div>
                  {RATING_LABELS.map((l, i) => {
                    const r = i + 1, chosen = rating === r
                    return (
                      <button key={l} disabled={stage !== 'rating'} onClick={() => onRate(r)} style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', border: 'none', borderTop: `1px solid ${T.borderSubtle}`,
                        background: chosen ? T.activeSubtle : 'transparent', cursor: stage === 'rating' ? 'pointer' : 'default', textAlign: 'left',
                        font: `${chosen ? 500 : 400} 13px/18px ${F}`, color: chosen ? T.link : stage === 'rating' ? T.fg : T.fg2,
                      }}
                        onMouseEnter={e => { if (stage === 'rating') (e.currentTarget as HTMLElement).style.background = T.activeSubtle }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = chosen ? T.activeSubtle : 'transparent' }}
                      ><span style={{ color: T.fg3, width: 10 }}>{r}</span>{l}</button>
                    )
                  })}
                </div>
              </>
            )}
            {(stage === 'followup' || stage === 'done') && rating && (
              <>
                <Bubble from="customer" strong>{rating} · {RATING_LABELS[rating - 1]}</Bubble>
                <Bubble from="team">{followUpText}</Bubble>
                <button onClick={onToggleWhy} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: `400 11px/14px ${F}`, color: T.fg2, textDecoration: 'underline dotted' }}>Why this question?</button>
                {whyOpen && (
                  <div style={{ padding: '8px 10px', borderRadius: 8, background: T.aiBg, border: `1px solid ${T.borderSubtle}`, font: `400 12px/16px ${F}`, color: T.fg }}>
                    <span style={{ color: AI_COLOR, fontWeight: 500 }}>Feedback Intelligence</span>{' '}
                    {ix.primaryTopic ? <>wrote this from <strong style={{ fontWeight: 500 }}>{ix.primaryTopic}</strong> in the conversation, for a {BAND_LABEL[band]} rating. The customer never sees this note.</> : <>found no clear primary topic, so the survey's own question is used.</>}
                  </div>
                )}
                {stage === 'followup' && !writeOwn && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end' }}>
                    {ix.answerChips[band].map(c => (
                      <button key={c} onClick={() => onAnswer(c)} style={{ padding: '6px 10px', borderRadius: 'var(--radius-full)', border: `1px solid ${T.active}`, background: T.base, color: T.link, font: `400 12px/16px ${F}`, cursor: 'pointer', textAlign: 'left' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = T.activeSubtle }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = T.base }}
                      >{c}</button>
                    ))}
                    <button onClick={onWriteOwn} style={{ padding: '6px 10px', borderRadius: 'var(--radius-full)', border: `1px solid ${T.border}`, background: T.base, color: T.fg2, font: `400 12px/16px ${F}`, cursor: 'pointer' }}>Write your own</button>
                  </div>
                )}
                {stage === 'done' && answer && (
                  <>
                    <Bubble from="customer">{answer}</Bubble>
                    <Bubble from="team">Got it, {ix.firstName}. This goes straight to the {ix.team.toLowerCase()}.</Bubble>
                    <Bubble from="team">Thank you {ix.firstName} for providing your valuable feedback.</Bubble>
                  </>
                )}
              </>
            )}
          </div>
          <div style={{ padding: 10, background: T.base, borderTop: `1px solid ${T.borderSubtle}`, display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <input
              value={draft} onChange={e => onDraft(e.target.value)} disabled={!inputOn} placeholder="Message"
              onKeyDown={e => { if (e.key === 'Enter' && draft.trim()) onAnswer(draft.trim()) }}
              style={{ flex: 1, height: 32, padding: '0 12px', borderRadius: 'var(--radius-full)', border: `1px solid ${inputOn ? T.active : T.borderSubtle}`, background: inputOn ? T.base : T.shell, font: `400 13px/18px ${F}`, color: T.fg, outline: 'none' }}
            />
            <button aria-label="Send" disabled={!inputOn || !draft.trim()} onClick={() => draft.trim() && onAnswer(draft.trim())} style={{ width: 32, height: 32, borderRadius: 'var(--radius-full)', border: 'none', background: inputOn && draft.trim() ? T.primary : 'var(--lyra-color-bg-active-moderate)', color: T.onPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: inputOn && draft.trim() ? 'pointer' : 'default' }}><Send size={14} /></button>
          </div>
        </div>
      </div>
      <div style={{ font: `400 11px/14px ${F}`, color: T.fg2 }}>Theme: {themeName}</div>
    </div>
  )
}

/* ───────────────────────────── main ───────────────────────────── */

type Verdict = 'none' | 'confident' | 'skipped'
type Result = { verdict: Verdict; played: boolean; rating: number | null; kept: Partial<Record<RatingBand, string>> }
type Stage = 'intro' | 'find' | 'play' | 'decision'

interface Props {
  programName: string
  channel: string
  themeName: string
  isProgramActive: boolean
  onClose: () => void
  onGoLive: () => void
}

const EMPTY_RESULT: Result = { verdict: 'none', played: false, rating: null, kept: {} }

export function TestProgramModal({ programName, channel, themeName, isProgramActive, onClose, onGoLive }: Props) {
  const [stage, setStage] = useState<Stage>('intro')
  const [howOpen, setHowOpen] = useState(false)   // "How this works" re-opens the intro over the current stage

  // Step 1 — find
  const [findId, setFindId] = useState('')
  const [findError, setFindError] = useState<string | null>(null)
  const [foundId, setFoundId] = useState<string | null>(null)
  const [transcriptOpen, setTranscriptOpen] = useState(false)

  // Batch
  const [results, setResults] = useState<Record<string, Result>>(() => Object.fromEntries(TEST_BATCH.map(i => [i.id, { ...EMPTY_RESULT }])))
  const [current, setCurrent] = useState<string>(TEST_BATCH[0].id)
  const ix = useMemo(() => TEST_BATCH.find(i => i.id === current) ?? TEST_BATCH[0], [current])
  const res = results[ix.id] ?? EMPTY_RESULT

  // Play — phone
  const [phoneStage, setPhoneStage] = useState<PhoneStage>('invite')
  const [rating, setRating] = useState<number | null>(null)
  const [answer, setAnswer] = useState<string | null>(null)
  const [whyOpen, setWhyOpen] = useState(false)
  const [writeOwn, setWriteOwn] = useState(false)
  const [draft, setDraft] = useState('')
  const [convOpen, setConvOpen] = useState(false)

  // Play — follow-ups panel
  const [openBand, setOpenBand] = useState<RatingBand>('low')
  const [linesBand, setLinesBand] = useState<RatingBand | null>(null)
  const [suggestBand, setSuggestBand] = useState<RatingBand | null>(null)
  const [reasons, setReasons] = useState<string[]>([])
  const [anythingElse, setAnythingElse] = useState('')
  const [rewriteBand, setRewriteBand] = useState<RatingBand | null>(null)
  const [justUpdated, setJustUpdated] = useState<RatingBand | null>(null)
  const [lastReason, setLastReason] = useState<string | null>(null)

  // Decision
  const [decision, setDecision] = useState<'live' | 'notyet'>('live')
  const [agreed, setAgreed] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  /* derived */
  const confidentCount = Object.values(results).filter(r => r.verdict === 'confident').length
  const playedCount = Object.values(results).filter(r => r.played).length
  const changedCount = Object.values(results).reduce((n, r) => n + Object.keys(r.kept).length, 0)
  const contextualCount = TEST_BATCH.filter(i => i.primaryTopic).length
  const changePending = suggestBand !== null || rewriteBand !== null
  const recConfidentDone = confidentCount >= RECOMMENDED_CONFIDENT
  const recNoPendingDone = !changePending
  const recDone = (recConfidentDone ? 1 : 0) + (recNoPendingDone ? 1 : 0)
  const nextIx = TEST_BATCH.find(i => i.id !== ix.id && results[i.id]?.verdict === 'none')
  const band = rating ? bandOf(rating) : null
  const currentStep = stage === 'find' ? 1 : stage === 'decision' ? 5 : phoneStage === 'invite' || phoneStage === 'declined' ? 3 : phoneStage === 'done' ? 5 : 4

  function followUpText(b: RatingBand) {
    return res.kept[b] ?? (ix.primaryTopic ? ix.followUps.find(f => f.band === b)!.text : STANDARD_QUESTION)
  }

  function resetPlay() {
    setPhoneStage('invite'); setRating(null); setAnswer(null); setWhyOpen(false); setWriteOwn(false); setDraft('')
    setOpenBand('low'); setLinesBand(null); setSuggestBand(null); setReasons([]); setAnythingElse(''); setRewriteBand(null); setJustUpdated(null); setLastReason(null); setConvOpen(false)
  }
  function openInteraction(id: string) {
    setCurrent(id); resetPlay(); setStage('play')
  }
  function setResult(id: string, patch: Partial<Result>) {
    setResults(prev => ({ ...prev, [id]: { ...(prev[id] ?? EMPTY_RESULT), ...patch } }))
  }

  /* find */
  function doFind() {
    const v = findId.trim()
    if (!v) { setFindError('Enter an interaction ID, or use a sample ID.'); setFoundId(null); return }
    const hit = TEST_BATCH.find(i => i.id.toLowerCase() === v.toLowerCase())
    if (!hit) { setFindError(`No interaction with that ID was handled by ${programName}'s audience in the last 30 days. Check the ID, or use a sample ID.`); setFoundId(null); return }
    setFindError(null); setFoundId(hit.id); setTranscriptOpen(false)
  }

  /* phone handlers */
  function onRate(r: number) {
    setRating(r); setPhoneStage('followup'); setOpenBand(bandOf(r))
    setResult(ix.id, { played: true, rating: r })
  }
  function onAnswer(a: string) { setAnswer(a); setDraft(''); setWriteOwn(false); setPhoneStage('done') }

  /* verdicts */
  function markConfident() { setResult(ix.id, { verdict: 'confident' }) }
  function markSkipped() { setResult(ix.id, { verdict: 'skipped' }) }
  function undoVerdict() { setResult(ix.id, { verdict: 'none' }) }

  /* rewrite */
  function keepRewritten(b: RatingBand) {
    setResult(ix.id, { kept: { ...res.kept, [b]: ix.rewrites[b].text } })
    setLastReason(reasons[0] ?? (anythingElse ? 'Custom note' : null))
    setRewriteBand(null); setSuggestBand(null); setReasons([]); setAnythingElse(''); setJustUpdated(b)
  }
  function keepOriginal() { setRewriteBand(null); setSuggestBand(null); setReasons([]); setAnythingElse('') }

  /* ───────── footer content ───────── */
  const footer = (() => {
    if (stage === 'find') {
      const first = TEST_BATCH.find(i => results[i.id]?.verdict === 'none') ?? TEST_BATCH[0]
      return { text: "Open an interaction from your batch, play the customer, then say if you're confident.", actions: <Btn variant="primary" onClick={() => openInteraction(first.id)}>Open {first.customer}</Btn> }
    }
    if (stage === 'play') {
      if (res.verdict !== 'none') {
        const verb = res.verdict === 'confident' ? `You're confident in ${confidentCount} of ${TEST_BATCH.length} interactions in your batch.` : `You skipped ${ix.firstName}. Confident in ${confidentCount} of ${TEST_BATCH.length} so far.`
        return {
          text: <>{verb} {RECOMMENDED_CONFIDENT} is recommended. {nextIx ? 'Go to the next one, or stop here.' : 'That was the last one in your batch.'} <LinkBtn onClick={undoVerdict} style={{ font: `400 13px/18px ${F}`, color: T.fg2, marginLeft: 4 }}>Undo</LinkBtn></>,
          actions: <>
            {nextIx
              ? <><Btn variant="primary" onClick={() => openInteraction(nextIx.id)}>Next interaction: {nextIx.firstName}</Btn><Btn onClick={() => setStage('decision')}>I'm confident enough</Btn></>
              : <Btn variant="primary" onClick={() => setStage('decision')}>Review your decision</Btn>}
          </>,
        }
      }
      if (changePending) return { text: `Your change to the ${BAND_LABEL[(suggestBand ?? rewriteBand)!]} follow-up is waiting. Rewrite it, then keep one version.`, actions: null }
      if (phoneStage === 'done') return {
        text: `Happy with what ${ix.firstName} would get? Try another rating on the right, or suggest a change.`,
        actions: <><Btn onClick={markSkipped}>Skip this one</Btn><Btn variant="primary" onClick={markConfident}>I'm confident</Btn></>,
      }
      return { text: "You're the customer now. Answer the survey on the phone.", actions: confidentCount > 0 ? <Btn onClick={() => setStage('decision')}>I'm confident enough</Btn> : null }
    }
    return null
  })()

  /* ───────── render pieces ───────── */

  const header = (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '20px 24px 16px', borderBottom: `1px solid ${T.borderSubtle}`, flexShrink: 0 }}>
      <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: T.activeSubtle, color: T.link, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><FlaskConical size={18} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ font: `600 18px/24px ${F}`, color: T.fg, letterSpacing: '-0.01em' }}>Test program</span>
          <AiBadge />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
          <span style={{ font: `500 13px/18px ${F}`, color: T.fg }}>{programName}</span>
          <span style={{ font: `400 12px/16px ${F}`, color: T.fg2 }}>{channel}</span>
        </div>
        <div style={{ font: `400 13px/18px ${F}`, color: T.fg2, marginTop: 4 }}>See what your customers would get, before anyone does.</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        {stage !== 'intro' && (
          <button onClick={() => setHowOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 8px', borderRadius: 'var(--radius-md)', font: `400 13px/18px ${F}`, color: T.fg2, display: 'inline-flex', alignItems: 'center', gap: 6 }}><Info size={14} />How this works</button>
        )}
        {stage === 'play' && (
          <>
            <LinkBtn onClick={() => { setStage('find'); setFoundId(null); setFindId('') }} style={{ padding: '6px 8px' }}>Try another conversation</LinkBtn>
            <button aria-label="Restart this interaction" title="Restart this interaction" onClick={resetPlay} style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--lyra-color-fg-action)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><RotateCcw size={16} /></button>
          </>
        )}
        <button aria-label="Close" onClick={onClose} style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--lyra-color-fg-action)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
        ><X size={18} /></button>
      </div>
    </div>
  )

  const introCard = (
    <div style={{ width: 560, maxWidth: '100%', background: T.base, border: `1px solid ${T.border}`, borderRadius: 'var(--radius-lg)', boxShadow: 'var(--sol-effect-shadowmd)', padding: 24 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: T.aiBg, color: AI_COLOR, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Sparkles size={16} /></div>
        <div>
          <div style={{ font: `500 16px/20px ${F}`, color: T.fg }}>Before you start</div>
          <div style={{ font: `400 13px/18px ${F}`, color: T.fg2, marginTop: 4 }}>See what customers of {programName} would get. Nothing here reaches a customer.</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
        {[
          { icon: <CirclePlay size={16} />, t: 'Watch', d: 'Find a conversation by its ID, add it to your batch, and watch Feedback Intelligence read it.' },
          { icon: <Smartphone size={16} />, t: 'Play the customer', d: "Answer the survey on their phone, then say if you're confident in what they'd get." },
          { icon: <ShieldCheck size={16} />, t: 'Decide', d: `Go to the next interaction, or stop when you're confident enough. ${RECOMMENDED_CONFIDENT} is recommended.` },
        ].map(s => (
          <div key={s.t} style={{ display: 'flex', gap: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-full)', background: T.activeSubtle, color: T.link, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.icon}</div>
            <div><div style={{ font: `500 14px/20px ${F}`, color: T.fg }}>{s.t}</div><div style={{ font: `400 13px/18px ${F}`, color: T.fg2 }}>{s.d}</div></div>
          </div>
        ))}
      </div>
      <details style={{ marginTop: 16 }}>
        <summary style={{ cursor: 'pointer', font: `500 13px/18px ${F}`, color: T.link, listStyle: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}><Info size={14} />How follow-ups are written<ChevronDown size={14} /></summary>
        <div style={{ marginTop: 8, padding: 12, borderRadius: 'var(--radius-md)', background: T.aiBg, border: `1px solid ${T.borderSubtle}`, font: `400 13px/18px ${F}`, color: T.fg }}>
          Feedback Intelligence reads the transcript, picks one primary topic, and writes one follow-up per rating band (1 to 2, 3, 4 to 5) before the customer answers. When no clear topic is found, the survey's own question is used. Nothing is generated live on the customer's phone.
        </div>
      </details>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, paddingTop: 16, borderTop: `1px solid ${T.borderSubtle}`, gap: 12 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: `400 12px/16px ${F}`, color: T.fg2 }}><Lock size={12} />Nothing goes live until you decide.</span>
        {howOpen
          ? <Btn variant="primary" onClick={() => setHowOpen(false)}>Back to testing</Btn>
          : <Btn variant="primary" onClick={() => setStage('find')}>Got it, start testing <ArrowRight size={16} /></Btn>}
      </div>
    </div>
  )

  const found = foundId ? TEST_BATCH.find(i => i.id === foundId)! : null

  const findBody = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card style={{ padding: 20 }}>
        <SectionTitle icon={<Search size={16} />} title="Find an interaction" sub={`Paste an interaction ID from ${programName}, one at a time. Read it, add it to your batch, then Analyze: Feedback Intelligence reads it and you play the customer.`} />
        <div style={{ marginTop: 16 }}>
          <label htmlFor="tp-find" style={{ font: `500 13px/18px ${F}`, color: T.fg, display: 'block', marginBottom: 6 }}>Interaction ID</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 320px', maxWidth: 440 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: 11, color: T.fg3 }} />
              <input id="tp-find" value={findId} onChange={e => { setFindId(e.target.value); setFindError(null) }} onKeyDown={e => { if (e.key === 'Enter') doFind() }}
                placeholder={`e.g. ${SAMPLE_INTERACTION_ID}`}
                style={{ width: '100%', height: 36, padding: '0 12px 0 34px', borderRadius: 'var(--radius-sm)', border: `1px solid ${findError ? T.err : T.border}`, background: 'var(--lyra-color-bg-field)', font: `400 13px/18px ${F}`, color: T.fg, outline: 'none', fontFamily: findId ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : F }}
                onFocus={e => { e.currentTarget.style.borderColor = T.active }} onBlur={e => { e.currentTarget.style.borderColor = findError ? T.err : T.border }}
              />
            </div>
            <Btn onClick={doFind}>Find</Btn>
            <LinkBtn onClick={() => { setFindId(SAMPLE_INTERACTION_ID); setFindError(null) }}>Use a sample ID</LinkBtn>
          </div>
          {findError && <div style={{ marginTop: 6, font: `400 12px/16px ${F}`, color: T.err }}>{findError}</div>}
        </div>

        {found && (
          <div style={{ marginTop: 16, border: `1px solid ${T.active}`, borderRadius: 'var(--radius-md)', background: T.base, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', flexWrap: 'wrap' }}>
              <button aria-label={transcriptOpen ? 'Hide transcript' : 'Show transcript'} onClick={() => setTranscriptOpen(v => !v)} style={{ width: 28, height: 28, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--lyra-color-fg-action)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-sm)' }}>{transcriptOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
              <span style={{ font: `500 14px/20px ${F}`, color: T.fg }}>{found.customer}</span>
              <span style={{ font: `400 13px/18px ${F}`, color: T.fg2 }}>Agent {found.agent}</span>
              <span style={{ font: `400 13px/18px ${F}`, color: T.fg2 }}>{found.channel}</span>
              <span style={{ font: `400 13px/18px ${F}`, color: T.fg2 }}>{found.when}</span>
              <span style={{ font: `400 13px/18px ${F}`, color: T.fg2 }}>{found.durationMin} min</span>
              <span style={{ flex: 1 }} />
              <span style={{ font: `400 11px/16px ui-monospace, SFMono-Regular, Menlo, monospace`, color: T.fg3 }}>{found.id}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, font: `500 12px/16px ${F}`, color: T.ok }}><Check size={14} />In your batch</span>
              <Btn variant="primary" small onClick={() => openInteraction(found.id)}>Analyze</Btn>
            </div>
            {transcriptOpen && (
              <div style={{ borderTop: `1px solid ${T.borderSubtle}`, padding: '12px 16px', background: T.canvas }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ font: `500 11px/16px ${F}`, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.fg2 }}>Transcript</span>
                  <LinkBtn><Play size={12} />Play agent recording</LinkBtn>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {found.transcript.map((l, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, font: `400 13px/18px ${F}`, color: T.fg }}>
                      <span style={{ font: `400 11px/18px ui-monospace, SFMono-Regular, Menlo, monospace`, color: T.fg3, flexShrink: 0 }}>{l.t}</span>
                      <span><strong style={{ fontWeight: 500, color: l.who === 'agent' ? T.link : T.fg }}>{l.who === 'agent' ? found.agent : found.customer}:</strong> {l.text}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 8, font: `400 12px/16px ${F}`, color: T.fg2 }}>Feedback Intelligence reads the transcript, not the recording.</div>
              </div>
            )}
          </div>
        )}

        {/* Batch */}
        <div style={{ marginTop: 16, border: `1px solid ${T.borderSubtle}`, borderRadius: 'var(--radius-md)', background: T.aiBg, padding: 16 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-md)', background: T.base, color: AI_COLOR, border: `1px solid ${T.borderSubtle}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Layers size={14} /></div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ font: `500 14px/20px ${F}`, color: T.fg }}>Your test batch</span><Pill tone="neutral">{TEST_BATCH.length} of {BATCH_LIMIT}</Pill></div>
              <div style={{ font: `400 12px/16px ${F}`, color: T.fg2, marginTop: 2 }}>The interactions you test, newest first. Keeps the latest {BATCH_LIMIT}. Being confident in {RECOMMENDED_CONFIDENT} is recommended before go-live. Nothing is sent.</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <StatTile label="In your batch" value={TEST_BATCH.length} hint={`Up to ${BATCH_LIMIT}, the latest kept`} />
            <StatTile label="Contextual follow-ups" value={`${contextualCount} of ${TEST_BATCH.length}`} hint="Written from what the customer said" />
            <StatTile label="Fell back to the standard question" value={TEST_BATCH.length - contextualCount} hint="No clear primary topic, so the survey's own question is used" />
          </div>
          <div style={{ marginTop: 12, background: T.base, border: `1px solid ${T.borderSubtle}`, borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['Customer', 'Primary topic', 'Follow-ups', 'You', ''].map(h => <th key={h} scope="col" style={{ textAlign: 'left', padding: '8px 12px', font: `500 11px/16px ${F}`, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.fg2, borderBottom: `1px solid ${T.borderSubtle}` }}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {TEST_BATCH.map(i => {
                  const r = results[i.id]
                  return (
                    <tr key={i.id} style={{ borderBottom: `1px solid ${T.borderSubtle}` }}>
                      <td style={{ padding: '10px 12px', font: `500 13px/18px ${F}`, color: T.fg }}>{i.customer}</td>
                      <td style={{ padding: '10px 12px', font: `400 13px/18px ${F}`, color: i.primaryTopic ? T.fg : T.fg3 }}>{i.primaryTopic ?? 'No clear topic'}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ font: `400 13px/18px ${F}`, color: T.fg }}>{i.primaryTopic ? 'Contextual' : 'Standard question'}</div>
                        <div style={{ font: `400 11px/14px ${F}`, color: T.fg2 }}>{i.primaryTopic ? 'One per rating' : 'Not written by AI'}</div>
                      </td>
                      <td style={{ padding: '10px 12px', font: `400 13px/18px ${F}` }}>
                        {r.verdict === 'confident' ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: T.ok, fontWeight: 500 }}><CheckCircle2 size={14} />Confident</span>
                          : r.verdict === 'skipped' ? <span style={{ color: T.fg2 }}>Skipped</span>
                          : <span style={{ color: T.fg3 }}>Not yet</span>}
                      </td>
                      <td style={{ padding: '6px 12px', textAlign: 'right' }}><Btn small onClick={() => openInteraction(i.id)} style={{ color: T.link }}>{r.verdict === 'none' ? 'Open' : 'Reopen'}</Btn></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  )

  /* ── play: three columns ── */
  const fu = (b: RatingBand) => ix.followUps.find(f => f.band === b)
  const playBody = (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 1fr) minmax(340px, 1.1fr) minmax(320px, 1.3fr)', gap: 16, alignItems: 'start' }}>
      {/* Left — what happened */}
      <Card style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 560 }}>
        <SectionTitle icon={<MessageSquare size={16} />} title="What happened" sub="The conversation, and how it was read" />
        <div style={{ border: `1px solid ${T.borderSubtle}`, borderRadius: 'var(--radius-md)', background: T.canvas, padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ font: `500 13px/18px ${F}`, color: T.fg, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Conversation · {ix.customer} · handled by {ix.agent}</span>
            <LinkBtn onClick={() => setConvOpen(v => !v)}>{convOpen ? 'Hide' : 'Show'}</LinkBtn>
          </div>
          <div style={{ font: `400 12px/16px ${F}`, color: T.fg2, marginTop: 4 }}>{ix.turns} turns · {ix.durationMin} min · {ix.when}</div>
          <div style={{ font: `400 12px/16px ${F}`, color: T.fg2 }}>Ended with {ix.firstName}: {ix.endedWith}</div>
          {convOpen && (
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360, overflowY: 'auto', paddingRight: 4 }}>
              {ix.transcript.map((l, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: l.who === 'agent' ? 'flex-end' : 'flex-start', gap: 3 }}>
                  <div style={{ maxWidth: '92%', padding: '8px 10px', borderRadius: 10, font: `400 12px/16px ${F}`, background: l.who === 'agent' ? T.primary : T.base, color: l.who === 'agent' ? T.onPrimary : T.fg, border: l.who === 'agent' ? 'none' : `1px solid ${T.borderSubtle}`, outline: l.topicHit ? `2px solid var(--lyra-brand-200)` : 'none', outlineOffset: 2 }}>{l.text}</div>
                  {l.topicHit && ix.primaryTopic && <Pill tone="ai">{ix.primaryTopic}</Pill>}
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ border: `1px solid ${T.borderSubtle}`, borderRadius: 'var(--radius-md)', background: T.aiBg, padding: 12 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: `500 12px/16px ${F}`, color: AI_COLOR }}><Sparkles size={12} />Feedback Intelligence Read</div>
          <div style={{ font: `400 12px/16px ${F}`, color: T.fg2, marginTop: 8 }}>Primary topic</div>
          {ix.primaryTopic ? (
            <>
              <div style={{ font: `600 18px/24px ${F}`, color: T.fg, letterSpacing: '-0.01em' }}>{ix.primaryTopic}</div>
              <div style={{ font: `400 12px/16px ${F}`, color: T.link, marginTop: 2 }}>From {ix.topicLineCount} lines in the conversation</div>
              <div style={{ font: `400 12px/16px ${F}`, color: T.fg2, marginTop: 8 }}>The follow-ups are written from {ix.primaryTopic}.</div>
            </>
          ) : (
            <>
              <div style={{ font: `600 18px/24px ${F}`, color: T.fg2, letterSpacing: '-0.01em' }}>No clear topic</div>
              <div style={{ font: `400 12px/16px ${F}`, color: T.fg2, marginTop: 8 }}>A {ix.durationMin}-minute chat about opening hours. Nothing to write a follow-up from, so {ix.firstName} gets the survey's own question.</div>
            </>
          )}
          <div style={{ borderTop: `1px solid ${T.borderSubtle}`, marginTop: 10, paddingTop: 8, display: 'inline-flex', alignItems: 'center', gap: 4, font: `500 12px/16px ${F}`, color: T.ok }}><Check size={14} />In your batch · {TEST_BATCH.length} of {BATCH_LIMIT}</div>
        </div>
        {phoneStage === 'done' && (
          <div style={{ border: `1px solid ${T.borderSubtle}`, borderRadius: 'var(--radius-md)', background: T.base, padding: 12 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: `500 12px/16px ${F}`, color: T.fg }}><Layers size={12} style={{ color: T.link }} />What happens next</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <Bell size={14} style={{ color: T.fg2, flexShrink: 0, marginTop: 1 }} />
              <span style={{ font: `400 12px/16px ${F}`, color: T.fg }}>{rating && rating <= 2 ? `No alert is set for this program, so nobody is notified about this low rating. Add one under Actions.` : `No alert is set for this program. A ${rating} rating would not notify anyone.`}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <Activity size={14} style={{ color: T.fg2, flexShrink: 0, marginTop: 1 }} />
              <span style={{ font: `400 12px/16px ${F}`, color: T.fg }}>The response shows on Program Health under Customer Responses, with the read, the rating and the customer's words.</span>
            </div>
          </div>
        )}
      </Card>

      {/* Center — phone */}
      <Card style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 560 }}>
        <SectionTitle icon={<Smartphone size={16} />} title="The customer's phone" sub="You play the customer" />
        <Phone
          ix={ix} stage={phoneStage} rating={rating} answer={answer} followUpText={band ? followUpText(band) : ''} whyOpen={whyOpen} writeOwn={writeOwn} draft={draft} themeName={themeName}
          onStart={() => setPhoneStage('rating')} onDecline={() => setPhoneStage('declined')} onRate={onRate} onAnswer={onAnswer}
          onToggleWhy={() => setWhyOpen(v => !v)} onWriteOwn={() => setWriteOwn(true)} onDraft={setDraft} onRestart={resetPlay}
        />
      </Card>

      {/* Right — follow-ups */}
      <Card style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 560 }}>
        <SectionTitle icon={<Sparkles size={16} />} title={ix.primaryTopic ? 'Follow-ups by rating' : 'Standard question'} sub={ix.primaryTopic ? 'One per rating, written before the customer answers. Pick one to play it on the phone.' : "No primary topic was found, so every rating gets the survey's own question."} />
        {(['low', 'mid', 'high'] as RatingBand[]).map(b => {
          const open = openBand === b
          const onPhone = band === b
          const text = followUpText(b)
          const kept = !!res.kept[b]
          const suggesting = suggestBand === b
          const rewriting = rewriteBand === b
          return (
            <div key={b} style={{ border: `1px solid ${open ? T.active : T.border}`, borderRadius: 'var(--radius-md)', background: T.base, overflow: 'hidden', boxShadow: open ? '0 0 0 1px var(--lyra-brand-100)' : 'none' }}>
              <button onClick={() => setOpenBand(b)} style={{ width: '100%', display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 12px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}>
                <BandTag band={b} />
                <span style={{ flex: 1, minWidth: 0, font: `${open ? 500 : 400} 13px/18px ${F}`, color: T.fg, overflow: open ? 'visible' : 'hidden', textOverflow: 'ellipsis', whiteSpace: open ? 'normal' : 'nowrap' }}>{text}</span>
                {/* Status pills sit inline when collapsed; when open they move to the meta row so the question keeps its width */}
                {!open && onPhone && <span style={{ font: `500 10px/16px ${F}`, letterSpacing: '0.06em', color: T.link, textTransform: 'uppercase', flexShrink: 0 }}>On the phone</span>}
                {!open && (suggesting || rewriting) && <Pill tone="warn">Needs a change</Pill>}
                {!open && kept && !suggesting && !rewriting && <Pill tone="ok"><Check size={12} />Updated</Pill>}
                {open ? <ChevronUp size={16} style={{ color: 'var(--lyra-color-fg-action)', flexShrink: 0 }} /> : <ChevronDown size={16} style={{ color: 'var(--lyra-color-fg-action)', flexShrink: 0 }} />}
              </button>
              {open && (
                <div style={{ padding: '0 12px 12px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {onPhone && <Pill tone="info"><Smartphone size={12} />On the phone</Pill>}
                    {(suggesting || rewriting) && <Pill tone="warn">Needs a change</Pill>}
                    {kept && !suggesting && !rewriting && <Pill tone="ok"><Check size={12} />Updated</Pill>}
                    <span style={{ font: `400 12px/16px ${F}`, color: T.fg2, display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      {ix.primaryTopic ? <>Written from {ix.primaryTopic} for a {BAND_LABEL[b]} rating.</> : <>The survey's own question. Not written by AI.</>}
                      {ix.primaryTopic && <LinkBtn onClick={() => setLinesBand(linesBand === b ? null : b)}>{linesBand === b ? 'Hide lines' : 'Show lines'}</LinkBtn>}
                    </span>
                  </div>
                  {linesBand === b && fu(b) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 10, borderRadius: 'var(--radius-md)', background: T.aiBg, border: `1px solid ${T.borderSubtle}` }}>
                      {fu(b)!.lines.map(n => { const l = ix.transcript[n]; return <div key={n} style={{ font: `400 12px/16px ${F}`, color: T.fg }}><span style={{ color: T.fg3, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 11 }}>{l.t}</span> <strong style={{ fontWeight: 500 }}>{l.who === 'agent' ? ix.agent : ix.customer}:</strong> {l.text}</div> })}
                    </div>
                  )}
                  {kept && !suggesting && !rewriting && lastReason && justUpdated === b && <div><Pill tone="neutral">{lastReason}</Pill></div>}

                  {!suggesting && !rewriting && ix.primaryTopic && (
                    <div><Btn small onClick={() => { setSuggestBand(b); setReasons([]); setAnythingElse(''); setJustUpdated(null) }}>Suggest a change</Btn></div>
                  )}

                  {suggesting && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {['Too generic', 'Wrong topic', 'Tone', 'Too long', 'Leading'].map(r => {
                          const on = reasons.includes(r)
                          return <button key={r} onClick={() => setReasons(on ? reasons.filter(x => x !== r) : [...reasons, r])} style={{ padding: '4px 10px', borderRadius: 'var(--radius-full)', border: `1px solid ${on ? T.active : T.border}`, background: on ? T.activeSubtle : T.base, color: on ? T.link : T.fg, font: `${on ? 500 : 400} 12px/16px ${F}`, cursor: 'pointer' }}>{r}</button>
                        })}
                      </div>
                      <input value={anythingElse} onChange={e => setAnythingElse(e.target.value)} placeholder="Anything else?" style={{ height: 32, padding: '0 10px', borderRadius: 'var(--radius-sm)', border: `1px solid ${T.border}`, background: 'var(--lyra-color-bg-field)', font: `400 13px/18px ${F}`, color: T.fg, outline: 'none' }} onFocus={e => { e.currentTarget.style.borderColor = T.active }} onBlur={e => { e.currentTarget.style.borderColor = T.border }} />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Btn variant="primary" small disabled={reasons.length === 0 && !anythingElse.trim()} onClick={() => { setRewriteBand(b); setSuggestBand(null) }}><Sparkles size={14} />Rewrite</Btn>
                        <Btn small onClick={keepOriginal}>Cancel</Btn>
                      </div>
                    </div>
                  )}

                  {rewriting && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <div style={{ padding: 10, borderRadius: 'var(--radius-md)', background: T.canvas, border: `1px solid ${T.borderSubtle}` }}>
                          <div style={{ font: `500 10px/14px ${F}`, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.fg2 }}>Original</div>
                          <div style={{ font: `400 12px/16px ${F}`, color: T.fg2, marginTop: 6 }}>{text}</div>
                        </div>
                        <div style={{ padding: 10, borderRadius: 'var(--radius-md)', background: T.aiBg, border: `1px solid var(--lyra-brand-200)` }}>
                          <div style={{ font: `500 10px/14px ${F}`, letterSpacing: '0.06em', textTransform: 'uppercase', color: AI_COLOR, display: 'flex', alignItems: 'center', gap: 4 }}><Sparkles size={10} />Rewritten</div>
                          <div style={{ font: `400 12px/16px ${F}`, color: T.fg, marginTop: 6 }}>{ix.rewrites[b].text}</div>
                          <div style={{ font: `400 11px/14px ${F}`, color: T.fg2, marginTop: 6 }}>Changed: {ix.rewrites[b].changed}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Btn variant="primary" small onClick={() => keepRewritten(b)}>Keep rewritten</Btn>
                        <Btn small onClick={keepOriginal}>Keep original</Btn>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </Card>
    </div>
  )

  /* ── decision ── */
  const warnNeeded = decision === 'live' && recDone < 2
  const canGoLive = decision === 'notyet' || !warnNeeded || agreed
  const decisionBody = (
    <div style={{ maxWidth: 980, margin: '0 auto' }}>
      <Card style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SectionTitle icon={<ShieldCheck size={16} />} title="Your decision" sub="Feedback Intelligence recommends. You decide. Here is what this test showed." />
        <div style={{ display: 'flex', gap: 12 }}>
          <StatTile label="Confident in" value={`${confidentCount} of ${TEST_BATCH.length}`} hint={`${RECOMMENDED_CONFIDENT} or more recommended`} />
          <StatTile label="Played as the customer" value={playedCount} hint="Surveys you answered yourself" />
          <StatTile label="Contextual follow-ups" value={`${contextualCount} of ${TEST_BATCH.length}`} hint="The rest use the standard question" />
          <StatTile label="Follow-ups you changed" value={changedCount} hint="Rewritten and kept by you" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ font: `400 12px/16px ${F}`, color: T.fg2 }}>Your batch</span>
          {TEST_BATCH.map(i => {
            const v = results[i.id]?.verdict
            const ok = v === 'confident'
            return <button key={i.id} onClick={() => openInteraction(i.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 'var(--radius-full)', border: `1px solid ${ok ? 'var(--lyra-color-status-success-medium)' : T.border}`, background: ok ? T.okBg : T.base, color: ok ? T.ok : T.fg, font: `${ok ? 500 : 400} 12px/16px ${F}`, cursor: 'pointer' }}>{ok ? <CheckCircle2 size={14} /> : <Circle size={14} style={{ color: T.fg3 }} />}{i.customer}</button>
          })}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ border: `1px solid ${T.border}`, borderRadius: 'var(--radius-md)', padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ font: `500 14px/20px ${F}`, color: T.fg }}>Recommended before go-live</span>
              <span style={{ font: `400 12px/16px ${F}`, color: T.fg2 }}>{recDone} of 2 done</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, font: `400 13px/18px ${F}` }}>
              {recConfidentDone ? <CheckCircle2 size={16} style={{ color: T.ok }} /> : <Circle size={16} style={{ color: 'var(--lyra-orange-500)' }} />}
              <span style={{ color: recConfidentDone ? T.fg : 'var(--lyra-orange-500)', flex: 1 }}>Confident in {confidentCount} of {RECOMMENDED_CONFIDENT} recommended interactions</span>
              {!recConfidentDone && nextIx && <LinkBtn onClick={() => openInteraction(nextIx.id)}>Next interaction</LinkBtn>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, font: `400 13px/18px ${F}` }}>
              {recNoPendingDone ? <CheckCircle2 size={16} style={{ color: T.ok }} /> : <Circle size={16} style={{ color: 'var(--lyra-orange-500)' }} />}
              <span style={{ color: T.fg, flex: 1 }}>{recNoPendingDone ? 'No follow-up waiting on a change' : '1 follow-up waiting on a change'}</span>
              {!recNoPendingDone && <LinkBtn onClick={() => setStage('play')}>Finish it</LinkBtn>}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {([
              { k: 'live', t: 'Go live for all', d: `Contextual follow-ups on every interaction of ${programName}.${isProgramActive ? '' : ' Takes effect when you activate the program.'}` },
              { k: 'notyet', t: 'Not yet', d: 'The program keeps its static questions. Test again whenever you like.' },
            ] as const).map(o => {
              const on = decision === o.k
              return (
                <label key={o.k} style={{ display: 'flex', gap: 12, padding: 12, borderRadius: 'var(--radius-md)', border: `1px solid ${on ? T.active : T.border}`, background: on ? T.activeSubtle : T.base, cursor: 'pointer' }}>
                  <input type="radio" name="tp-decision" checked={on} onChange={() => { setDecision(o.k); setAgreed(false) }} style={{ marginTop: 3, accentColor: 'var(--lyra-brand-600)' }} />
                  <span><span style={{ display: 'block', font: `500 14px/20px ${F}`, color: T.fg }}>{o.t}</span><span style={{ display: 'block', font: `400 12px/16px ${F}`, color: T.fg2, marginTop: 2 }}>{o.d}</span></span>
                </label>
              )
            })}
          </div>
        </div>
        {warnNeeded && (
          <div style={{ border: `1px solid ${T.warnMid}`, background: T.warnBg, borderRadius: 'var(--radius-md)', padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, font: `500 14px/20px ${F}`, color: T.warn }}><AlertTriangle size={16} />You're going ahead with {2 - recDone} recommendation{2 - recDone > 1 ? 's' : ''} not done</div>
            <ul style={{ margin: '8px 0 0 24px', padding: 0, font: `400 13px/18px ${F}`, color: T.warn }}>
              {!recConfidentDone && <li>Confident in {confidentCount} of {RECOMMENDED_CONFIDENT} recommended interactions</li>}
              {!recNoPendingDone && <li>1 follow-up waiting on a change</li>}
            </ul>
            <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 12, cursor: 'pointer' }}>
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop: 3, accentColor: 'var(--lyra-brand-600)' }} />
              <span><span style={{ display: 'block', font: `500 13px/18px ${F}`, color: T.fg }}>I've reviewed this and I'm going ahead.</span><span style={{ display: 'block', font: `400 12px/16px ${F}`, color: T.fg2 }}>Signed as Jaden Smith, and saved to this program's decision log.</span></span>
            </label>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTop: `1px solid ${T.borderSubtle}` }}>
          <Btn onClick={() => setStage(res.played ? 'play' : 'find')}>Back to testing</Btn>
          {decision === 'live'
            ? <Btn variant="primary" disabled={!canGoLive} onClick={onGoLive}>Go live for all</Btn>
            : <Btn variant="primary" onClick={onClose}>Close testing</Btn>}
        </div>
      </Card>
    </div>
  )

  /* ───────── layout ───────── */
  const showIntro = stage === 'intro' || howOpen
  return (
    <div role="dialog" aria-modal="true" aria-label="Test program" onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'var(--lyra-color-bg-overlay, rgba(0,0,0,0.24))', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: 'min(1280px, 100%)', height: 'min(920px, 100%)', background: T.base, borderRadius: 'var(--radius-xl)', boxShadow: 'var(--sol-effect-shadowxl)', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        {header}
        {!showIntro && <Stepper current={currentStep} />}

        {/* Body */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 24, background: showIntro ? T.canvas : T.canvas, display: showIntro ? 'flex' : 'block', alignItems: 'center', justifyContent: 'center' }}>
          {showIntro ? introCard : stage === 'find' ? findBody : stage === 'play' ? playBody : decisionBody}
        </div>

        {/* Footer */}
        {!showIntro && footer && (
          <div style={{ flexShrink: 0, borderTop: `1px solid ${T.borderSubtle}`, padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 16, background: T.base }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 'var(--radius-full)', background: T.activeSubtle, color: T.link, font: `500 10px/16px ${F}`, letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0 }}><ArrowRight size={10} />Next step</span>
                <span style={{ font: `500 13px/18px ${F}`, color: T.fg }}>{footer.text}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 6, flexWrap: 'wrap', font: `400 12px/16px ${F}`, color: T.fg2 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>Recommended before go-live
                  <span style={{ width: 48, height: 4, borderRadius: 'var(--radius-full)', background: 'var(--lyra-slate-200)', overflow: 'hidden', display: 'inline-block' }}><span style={{ display: 'block', height: '100%', width: `${recDone * 50}%`, background: T.ok, transition: 'width 200ms' }} /></span>
                  {recDone} of 2</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>{recConfidentDone ? <CheckCircle2 size={12} style={{ color: T.ok }} /> : <Circle size={12} />}Confident in {confidentCount} of {RECOMMENDED_CONFIDENT} interactions</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: recNoPendingDone ? T.ok : T.fg2 }}>{recNoPendingDone ? <CheckCircle2 size={12} /> : <Circle size={12} />}{recNoPendingDone ? 'No follow-up waiting on a change' : '1 follow-up waiting on a change'}</span>
              </div>
            </div>
            {footer.actions && <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>{footer.actions}</div>}
          </div>
        )}
      </div>
    </div>
  )
}
