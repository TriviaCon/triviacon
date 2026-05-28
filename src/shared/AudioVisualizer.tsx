import { useEffect, useRef } from 'react'

const BAR_COUNT = 48
const BAR_GAP = 4

type MediaElement = HTMLAudioElement | HTMLVideoElement

const audioSources = new WeakMap<
  MediaElement,
  { analyser: AnalyserNode; ctx: AudioContext }
>()

function getOrCreateAnalyser(audio: MediaElement) {
  const existing = audioSources.get(audio)
  if (existing) {
    if (existing.ctx.state === 'suspended') existing.ctx.resume()
    return existing
  }
  const ctx = new AudioContext()
  const source = ctx.createMediaElementSource(audio)
  const analyser = ctx.createAnalyser()
  analyser.fftSize = 256
  source.connect(analyser)
  analyser.connect(ctx.destination)
  const entry = { analyser, ctx }
  audioSources.set(audio, entry)
  return entry
}

interface AudioVisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement | HTMLVideoElement | null>
}

export default function AudioVisualizer({ audioRef }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    const canvas = canvasRef.current
    if (!audio || !canvas) return

    const { analyser } = getOrCreateAnalyser(audio)
    const data = new Uint8Array(analyser.frequencyBinCount)
    const ctx2d = canvas.getContext('2d')!
    let raf: number

    const draw = () => {
      raf = requestAnimationFrame(draw)
      analyser.getByteFrequencyData(data)

      const { width, height } = canvas
      ctx2d.clearRect(0, 0, width, height)

      const barWidth = (width - BAR_GAP * (BAR_COUNT - 1)) / BAR_COUNT
      const style = getComputedStyle(canvas)
      const color = style.getPropertyValue('--color-primary').trim()
      ctx2d.fillStyle = color ? `oklch(${color})` : '#6366f1'

      for (let i = 0; i < BAR_COUNT; i++) {
        const dataIndex = Math.floor((i / BAR_COUNT) * data.length)
        const value = data[dataIndex] / 255
        const barHeight = value * height * 0.9
        const x = i * (barWidth + BAR_GAP)
        const y = (height - barHeight) / 2
        const radius = Math.min(barWidth / 2, 4)
        ctx2d.beginPath()
        ctx2d.roundRect(x, y, barWidth, barHeight, radius)
        ctx2d.fill()
      }
    }

    draw()
    return () => cancelAnimationFrame(raf)
  }, [audioRef])

  return (
    <canvas
      ref={canvasRef}
      width={960}
      height={300}
      className="w-full h-full"
    />
  )
}
