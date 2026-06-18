// Sparkline — deterministic pseudo-random sparkline SVG chart.
// Uses a seeded LCG so the same seed always produces the same line.
// CSS class spark comes from global stylesheet.

interface SparklineProps {
  seed?: number
  color?: string
}

export function Sparkline({ seed = 1, color = 'var(--fi-accent)' }: SparklineProps) {
  // Deterministic pseudo-random number generation via LCG.
  const pts: number[] = []
  let x = seed * 17
  for (let i = 0; i < 14; i++) {
    x = (x * 9301 + 49297) % 233280
    pts.push(8 + (x % 14))
  }

  const max = Math.max(...pts)
  const min = Math.min(...pts)
  const d = pts
    .map((p, i) => {
      const xi = (i / (pts.length - 1)) * 80
      const yi = 22 - ((p - min) / (max - min || 1)) * 18
      return `${i === 0 ? 'M' : 'L'}${xi.toFixed(1)} ${yi.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg className="spark" viewBox="0 0 80 22">
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
