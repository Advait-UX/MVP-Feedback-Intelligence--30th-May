// ChannelChip — small icon chip for campaign channels (voice / digital).
// CSS class channel-chip comes from global stylesheet.

interface ChannelChipProps {
  kind: 'voice' | 'digital' | string
}

const DIGITAL_PATHS = (
  <>
    <path d="M7 4h9a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3h-1v2.5a.5.5 0 0 1-.82.39L10.5 16H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z" />
    <circle cx="9" cy="10" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="12" cy="10" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="15" cy="10" r="0.9" fill="currentColor" stroke="none" />
  </>
)

const VOICE_PATHS = (
  <>
    <path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
  </>
)

export function ChannelChip({ kind }: ChannelChipProps) {
  const paths = kind === 'voice' ? VOICE_PATHS : DIGITAL_PATHS
  return (
    <span className="channel-chip" title={kind}>
      <svg viewBox="0 0 24 24">{paths}</svg>
    </span>
  )
}
