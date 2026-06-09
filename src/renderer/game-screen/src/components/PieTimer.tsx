import { useEffect, useRef } from 'react'
import type { TimerSoundMode, TimerState } from '@shared/types/state'

interface Props {
  timer: TimerState
  durationSeconds: number
  timerSound?: TimerSoundMode
  size?: number
}

function beep(ctx: AudioContext, freq: number, duration: number, delay = 0) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = 'square'
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0.3, ctx.currentTime + delay)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration)
  osc.start(ctx.currentTime + delay)
  osc.stop(ctx.currentTime + delay + duration)
}

function playTick(ctx: AudioContext) {
  beep(ctx, 880, 0.12)
}

function playExpire(ctx: AudioContext) {
  const duration = 0.7
  const osc = ctx.createOscillator()
  const lfo = ctx.createOscillator()
  const lfoGain = ctx.createGain()
  const masterGain = ctx.createGain()

  osc.type = 'square'
  osc.frequency.value = 220

  // LFO chops amplitude at 30 Hz → buzzer rattle
  lfo.type = 'square'
  lfo.frequency.value = 30
  lfoGain.gain.value = 0.08

  lfo.connect(lfoGain)
  lfoGain.connect(masterGain.gain)
  osc.connect(masterGain)
  masterGain.connect(ctx.destination)

  masterGain.gain.setValueAtTime(0.08, ctx.currentTime)
  masterGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

  lfo.start(ctx.currentTime)
  osc.start(ctx.currentTime)
  lfo.stop(ctx.currentTime + duration)
  osc.stop(ctx.currentTime + duration)
}

const PieTimer = ({ timer, durationSeconds, timerSound = 'beeps-and-buzz', size = 48 }: Props) => {
  const audioCtxRef = useRef<AudioContext | null>(null)
  const prevStatusRef = useRef(timer.status)
  const prevRemainingRef = useRef(timer.remaining)

  useEffect(() => {
    const prevStatus = prevStatusRef.current
    const prevRemaining = prevRemainingRef.current
    prevStatusRef.current = timer.status
    prevRemainingRef.current = timer.remaining

    if (timer.status !== 'running' && timer.status !== 'expired') return
    if (timerSound === 'silent') return

    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext()
    }
    const ctx = audioCtxRef.current

    if (timer.status === 'expired' && prevStatus === 'running') {
      if (timerSound === 'beeps-and-buzz' || timerSound === 'buzz') playExpire(ctx)
      return
    }

    if (
      timer.status === 'running' &&
      timer.remaining !== prevRemaining &&
      timer.remaining >= 1 &&
      timer.remaining <= 5 &&
      (timerSound === 'beeps-and-buzz' || timerSound === 'beeps')
    ) {
      playTick(ctx)
    }
  }, [timer.status, timer.remaining, timerSound])

  if (durationSeconds <= 0) return null

  const { status, remaining } = timer
  const isIdle = status === 'idle'
  const isExpired = status === 'expired'
  const isPaused = status === 'paused'

  // Remaining fraction — full circle when idle (not yet started)
  const fraction = isIdle ? 1 : durationSeconds > 0 ? remaining / durationSeconds : 0

  const r = (size / 2) * 0.8
  const cx = size / 2
  const cy = size / 2

  // Elapsed point: how far clockwise from 12 o'clock the "eaten" portion has reached
  const elapsedAngle = (1 - fraction) * 2 * Math.PI
  const ex = cx + r * Math.sin(elapsedAngle)
  const ey = cy - r * Math.cos(elapsedAngle)
  // Draw remaining portion: from the elapsed point, clockwise back to 12 o'clock.
  // largeArc=1 when remaining > 180° (fraction > 0.5).
  const largeArc = fraction > 0.5 ? 1 : 0

  const fillPath =
    fraction <= 0
      ? ''
      : fraction >= 1
        ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.001} ${cy - r} Z`
        : `M ${ex} ${ey} A ${r} ${r} 0 ${largeArc} 1 ${cx} ${cy - r} L ${cx} ${cy} Z`

  const colorClass = isExpired
    ? 'text-destructive'
    : isPaused
      ? 'text-muted-foreground'
      : 'text-foreground'

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`shrink-0 ${colorClass} ${isExpired ? 'animate-pulse' : ''}`}
    >
      {/* Track ring */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth={2} opacity={0.2} />
      {/* Remaining pie — shrinks as time passes */}
      {fillPath && <path d={fillPath} fill="currentColor" opacity={isExpired ? 1 : 0.85} />}
      {/* Outer ring */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth={2} opacity={0.5} />
    </svg>
  )
}

export default PieTimer
