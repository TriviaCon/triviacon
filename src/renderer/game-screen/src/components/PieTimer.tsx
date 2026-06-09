import type { TimerState } from '@shared/types/state'

interface Props {
  timer: TimerState
  durationSeconds: number
  size?: number
}

const PieTimer = ({ timer, durationSeconds, size = 48 }: Props) => {
  if (durationSeconds <= 0) return null

  const { status, remaining } = timer
  if (status === 'idle') return null

  const fraction = durationSeconds > 0 ? remaining / durationSeconds : 0
  const r = (size / 2) * 0.8
  const cx = size / 2
  const cy = size / 2
  const angle = (1 - fraction) * 2 * Math.PI
  const x = cx + r * Math.sin(angle)
  const y = cy - r * Math.cos(angle)
  const largeArc = fraction < 0.5 ? 1 : 0

  const isExpired = status === 'expired'
  const isPaused = status === 'paused'

  const fillColor = isExpired
    ? 'hsl(var(--color-destructive, 0 84.2% 60.2%))'
    : 'currentColor'

  const trackPath =
    fraction <= 0
      ? ''
      : fraction >= 1
        ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.001} ${cy - r} Z`
        : `M ${cx} ${cy - r} A ${r} ${r} 0 ${largeArc} 1 ${x} ${y} L ${cx} ${cy} Z`

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`shrink-0 ${isExpired ? 'text-destructive' : isPaused ? 'text-muted-foreground' : 'text-foreground'} ${isExpired ? 'animate-pulse' : ''}`}
    >
      {/* Track ring */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth={2} opacity={0.2} />
      {/* Filled pie */}
      {trackPath && <path d={trackPath} fill={fillColor} opacity={isExpired ? 1 : 0.85} />}
      {/* Outer ring */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth={2} opacity={0.5} />
    </svg>
  )
}

export default PieTimer
