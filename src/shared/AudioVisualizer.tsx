import { useEffect, useRef, useState } from 'react'

const BAR_GAP = 4

const GRADIENT_START = { h: 195, s: 100, l: 50 } // cyan
const GRADIENT_END = { h: 300, s: 100, l: 50 } // magenta

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

function barColor(mode: string, i: number, count: number, value: number): string {
  const t = count > 1 ? i / (count - 1) : 0

  switch (mode) {
    case 'rainbow':
      return `hsl(${t * 360}, 85%, 55%)`
    case 'gradient': {
      const h = GRADIENT_START.h + t * (GRADIENT_END.h - GRADIENT_START.h)
      const s = GRADIENT_START.s + t * (GRADIENT_END.s - GRADIENT_START.s)
      const l = GRADIENT_START.l + t * (GRADIENT_END.l - GRADIENT_START.l)
      return `hsl(${h}, ${s}%, ${l}%)`
    }
    case 'heatmap':
    default: {
      const hue = (1 - value) * 240
      return `hsl(${hue}, 90%, 50%)`
    }
  }
}

interface AudioVisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement | HTMLVideoElement | null>
}

export default function AudioVisualizer({ audioRef }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [colorMode, setColorMode] = useState('heatmap')
  const [barCount, setBarCount] = useState(48)

  useEffect(() => {
    window.api.getVisualizer().then((v) => {
      setColorMode(v.colorMode)
      setBarCount(v.barCount)
    })
  }, [])

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

      const barWidth = (width - BAR_GAP * (barCount - 1)) / barCount

      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * data.length)
        const value = data[dataIndex] / 255
        const barHeight = value * height * 0.9
        const x = i * (barWidth + BAR_GAP)
        const y = (height - barHeight) / 2
        const radius = Math.min(barWidth / 2, 4)

        ctx2d.fillStyle = barColor(colorMode, i, barCount, value)
        ctx2d.beginPath()
        ctx2d.roundRect(x, y, barWidth, barHeight, radius)
        ctx2d.fill()
      }
    }

    draw()
    return () => cancelAnimationFrame(raf)
  }, [audioRef, colorMode, barCount])

  return (
    <canvas
      ref={canvasRef}
      width={960}
      height={300}
      className="w-full h-full"
    />
  )
}
