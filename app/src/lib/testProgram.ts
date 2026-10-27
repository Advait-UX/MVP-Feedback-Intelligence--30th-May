// Mock data for the "Test program" flow.
// One program (Billing Effort Score) · a batch of 6 interactions the PM
// has already found. Marcus and Priya carry full transcripts because the
// demo walks through them; the rest are lighter.

export type RatingBand = 'low' | 'mid' | 'high'   // 1–2 · 3 · 4–5

export type TranscriptLine = { t: string; who: 'customer' | 'agent'; text: string; topicHit?: boolean }

export type FollowUp = {
  band: RatingBand
  text: string
  // The transcript lines this question was written from (indexes into transcript)
  lines: number[]
}

export type TestInteraction = {
  id: string
  customer: string
  firstName: string
  agent: string
  channel: string
  when: string            // "Today, 09:14"
  durationMin: number
  turns: number
  endedWith: string
  team: string            // phone header — "Billing team"
  primaryTopic: string | null
  topicLineCount: number
  transcript: TranscriptLine[]
  followUps: FollowUp[]   // empty when primaryTopic is null → standard question
  // Quick answers offered on the phone, by band
  answerChips: Record<RatingBand, string[]>
  // Rewritten versions offered by "Suggest a change", keyed by band
  rewrites: Record<RatingBand, { text: string; changed: string }>
}

export const SAMPLE_INTERACTION_ID = '3f6a9c20-41d7-4b8e-9c55-2e7d10a4b9f1'
export const STANDARD_QUESTION = 'Is there anything else you would like to tell us about your experience?'
export const RATING_PROMPT = 'How would you rate your experience today?'
export const RATING_LABELS = ['Very dissatisfied', 'Dissatisfied', 'Neutral', 'Satisfied', 'Very satisfied']
export const BATCH_LIMIT = 10
export const RECOMMENDED_CONFIDENT = 5

export function bandOf(rating: number): RatingBand {
  return rating <= 2 ? 'low' : rating === 3 ? 'mid' : 'high'
}
export const BAND_LABEL: Record<RatingBand, string> = { low: '1 to 2', mid: '3', high: '4 to 5' }

export const TEST_BATCH: TestInteraction[] = [
  {
    id: SAMPLE_INTERACTION_ID,
    customer: 'Marcus Wright', firstName: 'Marcus', agent: 'Rajat S.', channel: 'Digital',
    when: 'Today, 09:14', durationMin: 6, turns: 7, endedWith: 'Great, thanks.',
    team: 'Billing team', primaryTopic: 'Refund Processing', topicLineCount: 2,
    transcript: [
      { t: '09:14:02', who: 'customer', text: 'Hi, I was charged twice for my subscription this month. $49.90 both times.', topicHit: true },
      { t: '09:14:41', who: 'agent',    text: 'Sorry about that, Marcus. Let me check your account.' },
      { t: '09:15:30', who: 'customer', text: 'I also tried to downgrade last week and the app kept crashing.' },
      { t: '09:17:12', who: 'agent',    text: "I can see both charges. I've refunded the duplicate, it will be back in 3 to 5 days.", topicHit: true },
      { t: '09:17:48', who: 'customer', text: 'OK. And the downgrade?' },
      { t: '09:19:05', who: 'agent',    text: "Done. You're on the Basic plan from your next billing date." },
      { t: '09:19:31', who: 'customer', text: 'Great, thanks.' },
    ],
    followUps: [
      { band: 'low',  text: 'That is not the experience we wanted. What went wrong with your refund?', lines: [0, 3] },
      { band: 'mid',  text: 'What was missing from how we handled your refund?', lines: [0, 3] },
      { band: 'high', text: "Glad it's sorted. How confident are you the refund will arrive in 3 to 5 days?", lines: [3] },
    ],
    answerChips: {
      low:  ['I had to chase the refund twice.', 'The app crashed again when I tried to downgrade.', 'It took too long to sort out.'],
      mid:  ['Nobody told me why I was charged twice.', 'The downgrade should have worked in the app.'],
      high: ['Fairly confident, Rajat was clear.', 'I will believe it when I see it.'],
    },
    rewrites: {
      low:  { text: 'Sorry about the double charge. What made the refund harder than it should have been?', changed: 'more specific to the double charge' },
      mid:  { text: 'You were charged twice, then refunded. What would have made that feel handled?', changed: 'names the double charge' },
      high: { text: 'Rajat refunded the duplicate charge. How sure are you it will land in 3 to 5 days?', changed: 'names the agent and the timeline' },
    },
  },
  {
    id: 'b81d4e7a-0c3f-4a52-9e1d-5f6a7c8b9d01',
    customer: 'Priya Shah', firstName: 'Priya', agent: 'Hannah L.', channel: 'Digital',
    when: 'Yesterday, 16:40', durationMin: 9, turns: 7, endedWith: "That's really not good enough.",
    team: 'Delivery team', primaryTopic: 'Delivery Delay', topicLineCount: 2,
    transcript: [
      { t: '16:40:10', who: 'customer', text: 'My order was due Monday. It is Thursday and the tracking has not moved.', topicHit: true },
      { t: '16:41:02', who: 'agent',    text: 'I am sorry, Priya. Let me look at the shipment.' },
      { t: '16:43:15', who: 'agent',    text: 'The parcel is held at the regional depot. I have raised a priority release.', topicHit: true },
      { t: '16:44:01', who: 'customer', text: 'When will it actually arrive?' },
      { t: '16:45:30', who: 'agent',    text: 'The depot says Saturday. I have added a 10% credit to your account for the delay.' },
      { t: '16:46:12', who: 'customer', text: 'Saturday is five days late.' },
      { t: '16:49:40', who: 'customer', text: "That's really not good enough." },
    ],
    followUps: [
      { band: 'low',  text: 'That is not the experience we wanted. What went wrong with your delivery?', lines: [0, 2] },
      { band: 'mid',  text: 'What was missing from how we handled your delivery?', lines: [0, 2] },
      { band: 'high', text: "Glad it's moving. What would make the next delivery easier?", lines: [2] },
    ],
    answerChips: {
      low:  ['Nobody told me it was stuck.', 'Five days late is too long.', 'The credit does not fix a missed delivery.'],
      mid:  ['The tracking page never updated.', 'I had to contact you to find out.'],
      high: ['Proactive updates when something is held.', 'A clearer delivery window.'],
    },
    rewrites: {
      low:  { text: 'Your parcel was held at the depot for days. What should we have done differently?', changed: 'names the depot hold' },
      mid:  { text: 'Your order ran late and we added a credit. What else would have helped?', changed: 'mentions the credit' },
      high: { text: 'Your parcel was released with a 10% credit. What would make the next one smoother?', changed: 'names the release and the credit' },
    },
  },
  {
    id: 'c92e5f8b-1d4a-4b63-8f2e-6a7b8c9d0e12',
    customer: 'Leo Martins', firstName: 'Leo', agent: 'Ana R.', channel: 'Digital',
    when: 'Yesterday, 11:05', durationMin: 4, turns: 5, endedWith: 'Perfect, I am in.',
    team: 'Billing team', primaryTopic: 'Account Access', topicLineCount: 2,
    transcript: [
      { t: '11:05:12', who: 'customer', text: 'I cannot log in. It says my account is locked.', topicHit: true },
      { t: '11:05:50', who: 'agent',    text: 'Let me check that for you, Leo.' },
      { t: '11:07:20', who: 'agent',    text: 'Three failed attempts locked it. I have unlocked it and sent a reset link.', topicHit: true },
      { t: '11:08:05', who: 'customer', text: 'Got it. Trying now.' },
      { t: '11:09:01', who: 'customer', text: 'Perfect, I am in.' },
    ],
    followUps: [
      { band: 'low',  text: 'Sorry you were locked out. What made getting back in difficult?', lines: [0, 2] },
      { band: 'mid',  text: 'What could have made unlocking your account easier?', lines: [0, 2] },
      { band: 'high', text: 'Glad you are back in. Was there anything about the lockout we should prevent?', lines: [2] },
    ],
    answerChips: {
      low:  ['I should not have been locked out at all.', 'The reset link took ages to arrive.'],
      mid:  ['A self-service unlock would have been faster.'],
      high: ['Warn me before the account locks.', 'Nothing, it was quick.'],
    },
    rewrites: {
      low:  { text: 'Three failed attempts locked you out. What would have made that less frustrating?', changed: 'names the cause' },
      mid:  { text: 'Ana unlocked your account and sent a reset link. What else would have helped?', changed: 'names the fix' },
      high: { text: 'You are back in after a lockout. Should we have warned you earlier?', changed: 'asks about prevention' },
    },
  },
  {
    id: 'd03f6a9c-2e5b-4c74-9a3f-7b8c9d0e1f23',
    customer: 'Daniel Kim', firstName: 'Daniel', agent: 'Rajat S.', channel: 'Digital',
    when: '2 days ago, 14:22', durationMin: 5, turns: 6, endedWith: 'OK, thanks for clarifying.',
    team: 'Billing team', primaryTopic: 'Subscription Change', topicLineCount: 2,
    transcript: [
      { t: '14:22:08', who: 'customer', text: 'I switched to the annual plan but I am still being billed monthly.', topicHit: true },
      { t: '14:23:00', who: 'agent',    text: 'Thanks, Daniel. Let me look at the plan history.' },
      { t: '14:25:41', who: 'agent',    text: 'The annual plan starts at your next renewal on the 3rd. The monthly charge was the final one.', topicHit: true },
      { t: '14:26:15', who: 'customer', text: 'That was not clear when I switched.' },
      { t: '14:27:02', who: 'agent',    text: 'Understood. I have passed that on to the product team.' },
      { t: '14:27:40', who: 'customer', text: 'OK, thanks for clarifying.' },
    ],
    followUps: [
      { band: 'low',  text: 'Sorry the plan change was confusing. What should we have explained better?', lines: [0, 2] },
      { band: 'mid',  text: 'What was unclear about when your annual plan starts?', lines: [2] },
      { band: 'high', text: 'Glad that is clear now. Anything else about your plan we should know?', lines: [2] },
    ],
    answerChips: {
      low:  ['The switch screen should have said when it starts.', 'I expected the annual price straight away.'],
      mid:  ['The renewal date was not shown anywhere.'],
      high: ['No, all good.'],
    },
    rewrites: {
      low:  { text: 'Your annual plan starts at renewal, not right away. What should we have said when you switched?', changed: 'names the timing gap' },
      mid:  { text: 'The annual plan begins on the 3rd. Where should we have shown that?', changed: 'asks where, not what' },
      high: { text: 'Your plan switches on the 3rd. Anything else we can make clearer?', changed: 'names the date' },
    },
  },
  {
    id: 'e14a7b0d-3f6c-4d85-8b4a-8c9d0e1f2a34',
    customer: 'Amara Okafor', firstName: 'Amara', agent: 'Hannah L.', channel: 'Digital',
    when: '2 days ago, 09:48', durationMin: 7, turns: 6, endedWith: 'Fine. I will wait for the email.',
    team: 'Support team', primaryTopic: 'Service Outage', topicLineCount: 2,
    transcript: [
      { t: '09:48:30', who: 'customer', text: 'Your service has been down since last night. I run a shop on it.', topicHit: true },
      { t: '09:49:10', who: 'agent',    text: 'I am sorry, Amara. There is an outage in your region and the team is on it.' },
      { t: '09:51:02', who: 'customer', text: 'When will it be back? I am losing orders.' },
      { t: '09:52:45', who: 'agent',    text: 'The current estimate is within two hours. I will email you when it is restored.', topicHit: true },
      { t: '09:53:20', who: 'customer', text: 'And compensation?' },
      { t: '09:55:01', who: 'agent',    text: 'Once restored, outage credits are applied automatically within 48 hours.' },
    ],
    followUps: [
      { band: 'low',  text: 'Sorry about the outage. What hurt most while the service was down?', lines: [0, 3] },
      { band: 'mid',  text: 'What was missing from how we kept you informed during the outage?', lines: [0, 3] },
      { band: 'high', text: 'Thanks for your patience during the outage. What did we get right?', lines: [3] },
    ],
    answerChips: {
      low:  ['I lost a morning of orders.', 'I found out from my customers, not from you.'],
      mid:  ['A status page would have saved the call.'],
      high: ['Hannah was honest about the timeline.'],
    },
    rewrites: {
      low:  { text: 'Your shop was down for hours. What should we have done sooner?', changed: 'names the business impact' },
      mid:  { text: 'You had to call to learn about the outage. How should we have told you?', changed: 'asks about the channel' },
      high: { text: 'We restored service and credits apply within 48 hours. What worked for you?', changed: 'names the credit' },
    },
  },
  {
    id: 'f25b8c1e-4a7d-4e96-9c5b-9d0e1f2a3b45',
    customer: 'Tom Becker', firstName: 'Tom', agent: 'Ana R.', channel: 'Digital',
    when: '3 days ago, 17:12', durationMin: 2, turns: 4, endedWith: 'Thanks, bye.',
    team: 'Billing team', primaryTopic: null, topicLineCount: 0,
    transcript: [
      { t: '17:12:05', who: 'customer', text: 'Hi, quick one. What are your opening hours on Saturdays?' },
      { t: '17:12:40', who: 'agent',    text: '9am to 1pm, Tom.' },
      { t: '17:13:02', who: 'customer', text: 'And is the chat open then too?' },
      { t: '17:13:30', who: 'agent',    text: 'Yes, same hours.' },
    ],
    followUps: [],
    answerChips: {
      low:  ['The answer was fine, the wait was not.'],
      mid:  ['Nothing really.'],
      high: ['Quick and clear.'],
    },
    rewrites: {
      low:  { text: STANDARD_QUESTION, changed: 'no primary topic, standard question kept' },
      mid:  { text: STANDARD_QUESTION, changed: 'no primary topic, standard question kept' },
      high: { text: STANDARD_QUESTION, changed: 'no primary topic, standard question kept' },
    },
  },
]
