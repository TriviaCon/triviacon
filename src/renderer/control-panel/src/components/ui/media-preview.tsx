import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle, Maximize, Music, Play, Pause, Square, Volume2 } from 'lucide-react'
import { detectMediaType } from '@shared/media'
import { mediaUrl } from '@shared/mediaUrl'
import AudioVisualizer from '@shared/AudioVisualizer'
import type { MediaPlaybackState } from '@shared/types/ipc'
import { Button } from '@renderer/components/ui/button'
import { cn } from '@renderer/lib/utils'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ── Playback controls (audio / video via IPC) ──────────────────────

export const PlaybackControls = ({ mediaType }: { mediaType: 'audio' | 'video' }) => (
  <div className="flex gap-1">
    <Button size="sm" variant="outline" onClick={() => window.api.mediaPlay()}>
      <Play className="h-4 w-4" />
    </Button>
    <Button size="sm" variant="outline" onClick={() => window.api.mediaPause()}>
      <Pause className="h-4 w-4" />
    </Button>
    <Button size="sm" variant="outline" onClick={() => window.api.mediaStop()}>
      <Square className="h-4 w-4" />
    </Button>
    {mediaType === 'video' && (
      <Button size="sm" variant="outline" onClick={() => window.api.mediaToggleFullscreen()}>
        <Maximize className="h-4 w-4" />
      </Button>
    )}
  </div>
)

export const MediaControls = ({ mediaType }: { mediaType: 'audio' | 'video' }) => {
  const { t } = useTranslation()
  const [state, setState] = useState<MediaPlaybackState>({
    currentTime: 0,
    duration: 0,
    volume: 1
  })
  const draggingRef = useRef(false)

  useEffect(() => {
    return window.api.onMediaStateUpdate((incoming) => {
      if (!draggingRef.current) setState(incoming)
    })
  }, [])

  const startDrag = useCallback(() => { draggingRef.current = true }, [])
  const stopDrag = useCallback(() => {
    setTimeout(() => { draggingRef.current = false }, 150)
  }, [])

  const handleSeek = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const time = Number(e.target.value)
      setState((prev) => ({ ...prev, currentTime: time }))
      window.api.mediaSeek(time)
    },
    []
  )

  const handleVolume = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const vol = Number(e.target.value)
      setState((prev) => ({ ...prev, volume: vol }))
      window.api.mediaSetVolume(vol)
    },
    []
  )

  return (
    <div className="rounded-lg border border-border p-3 space-y-2">
      <span className="text-sm text-muted-foreground block">
        {mediaType === 'audio' ? t('runner.audioControls') : t('runner.videoControls')}
      </span>
      <PlaybackControls mediaType={mediaType} />
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground tabular-nums w-9 text-right">
          {formatTime(state.currentTime)}
        </span>
        <input
          type="range"
          min={0}
          max={state.duration || 0}
          step={0.1}
          value={state.currentTime}
          onChange={handleSeek}
          onPointerDown={startDrag}
          onPointerUp={stopDrag}
          className="flex-1 h-1.5 accent-primary cursor-pointer"
        />
        <span className="text-xs text-muted-foreground tabular-nums w-9">
          {formatTime(state.duration)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Volume2 className="h-4 w-4 text-muted-foreground shrink-0" />
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={state.volume}
          onChange={handleVolume}
          onPointerDown={startDrag}
          onPointerUp={stopDrag}
          className="w-full h-1.5 accent-primary cursor-pointer"
        />
      </div>
    </div>
  )
}

// ── Local media player (builder preview) ──────────────────────────

const LocalMediaPlayer = ({ src, mediaType }: { src: string; mediaType: 'audio' | 'video' }) => {
  const audioRef = useRef<HTMLAudioElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [playing, setPlaying] = useState(false)

  const el = () => (mediaType === 'audio' ? audioRef.current : videoRef.current)

  useEffect(() => {
    const m = el()
    if (!m) return
    const onTime = () => setCurrentTime(m.currentTime)
    const onMeta = () => setDuration(m.duration || 0)
    const onVol = () => setVolume(m.volume)
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    m.addEventListener('timeupdate', onTime)
    m.addEventListener('loadedmetadata', onMeta)
    m.addEventListener('volumechange', onVol)
    m.addEventListener('play', onPlay)
    m.addEventListener('pause', onPause)
    return () => {
      m.removeEventListener('timeupdate', onTime)
      m.removeEventListener('loadedmetadata', onMeta)
      m.removeEventListener('volumechange', onVol)
      m.removeEventListener('play', onPlay)
      m.removeEventListener('pause', onPause)
    }
  }, [src, mediaType])

  const toggle = useCallback(() => {
    const m = el()
    if (!m) return
    if (m.paused) m.play(); else m.pause()
  }, [mediaType])

  const stop = useCallback(() => {
    const m = el()
    if (!m) return
    m.pause()
    m.currentTime = 0
  }, [mediaType])

  const handleSeek = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const m = el()
      if (m) m.currentTime = Number(e.target.value)
    },
    [mediaType]
  )

  const handleVolume = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const m = el()
      if (m) m.volume = Number(e.target.value)
    },
    [mediaType]
  )

  return (
    <div className="space-y-2">
      {mediaType === 'audio' && (
        <>
          <audio ref={audioRef} src={src} preload="auto" />
          <div className="h-20 rounded border border-border bg-muted/30 overflow-hidden">
            <AudioVisualizer audioRef={audioRef} />
          </div>
        </>
      )}
      {mediaType === 'video' && (
        <video
          ref={videoRef}
          src={src}
          preload="auto"
          className="max-w-full max-h-[200px] rounded"
        />
      )}
      <div className="flex gap-1">
        <Button size="sm" variant="outline" onClick={toggle}>
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button size="sm" variant="outline" onClick={stop}>
          <Square className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground tabular-nums w-9 text-right">
          {formatTime(currentTime)}
        </span>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          className="flex-1 h-1.5 accent-primary cursor-pointer"
        />
        <span className="text-xs text-muted-foreground tabular-nums w-9">
          {formatTime(duration)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Volume2 className="h-4 w-4 text-muted-foreground shrink-0" />
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={handleVolume}
          className="w-full h-1.5 accent-primary cursor-pointer"
        />
      </div>
    </div>
  )
}

// ── MediaPreview ───────────────────────────────────────────────────

interface MediaPreviewProps {
  /** Raw media filename / UUID stored in the quiz document. */
  media: string | null | undefined
  /** Show a fullscreen button below images. Default: false */
  fullscreenButton?: boolean
  /** Show IPC playback controls for audio/video. Default: false */
  playbackControls?: boolean
  /** Show a local inline player for audio/video preview. Default: false */
  localPlayer?: boolean
  /** Extra classes on the img element. */
  imageClassName?: string
  className?: string
}

/**
 * Renders a media preview for a question attachment.
 *
 * - image  → <img> (+ optional fullscreen button)
 * - audio/video + localPlayer → local inline player with controls
 * - audio/video + playbackControls → IPC-driven <MediaControls>
 * - audio/video - playbackControls → text badge
 * - no media / unknown type → null
 */
export function MediaPreview({
  media,
  fullscreenButton = false,
  playbackControls = false,
  localPlayer = false,
  imageClassName,
  className
}: MediaPreviewProps) {
  const { t } = useTranslation()
  const mediaType = detectMediaType(media ?? null)
  const src = mediaUrl(media ?? null)

  if (!src || !mediaType) return null

  if (mediaType === 'image') {
    return (
      <div className={cn('space-y-2', className)}>
        <img src={src} className={cn('max-w-[200px] rounded', imageClassName)} alt="" />
        {fullscreenButton && (
          <Button size="sm" variant="outline" onClick={() => window.api.mediaToggleFullscreen()}>
            <Maximize className="h-4 w-4 mr-1" /> {t('actions.fullscreen')}
          </Button>
        )}
      </div>
    )
  }

  if (mediaType === 'audio' || mediaType === 'video') {
    if (localPlayer) return <LocalMediaPlayer src={src} mediaType={mediaType} />
    if (playbackControls) return <MediaControls mediaType={mediaType} />
    return (
      <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
        {mediaType === 'video' ? (
          <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
        ) : (
          <Music className="h-4 w-4 shrink-0" />
        )}
        <span className="truncate">{media}</span>
      </div>
    )
  }

  return null
}
