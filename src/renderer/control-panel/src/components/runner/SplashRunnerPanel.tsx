import { useTranslation } from 'react-i18next'
import { Image as ImageIcon, Maximize2, Repeat, Music, Film } from 'lucide-react'
import { detectMediaType, mediaDisplayName } from '@shared/media'
import { mediaUrl } from '@shared/mediaUrl'
import { MediaControls } from '@renderer/components/ui/media-preview'
import { Toggle } from '@renderer/components/ui/toggle'
import { useGameState } from '@renderer/hooks/useGameState'
import { useSplashSetLoop, useSplashSetGrow } from '@renderer/hooks/useQuizMeta'

export function SplashRunnerPanel() {
  const { t } = useTranslation()
  const { quizMeta } = useGameState()
  const setLoop = useSplashSetLoop()
  const setGrow = useSplashSetGrow()

  const visual = quizMeta?.splashVisual ?? null
  const legacyImage = quizMeta?.splash && quizMeta.splash.length > 0 ? quizMeta.splash : null
  const visualType = visual ? detectMediaType(visual) : legacyImage ? 'image' : null
  const audio = quizMeta?.splashAudio ?? null
  const loop = quizMeta?.splashLoop ?? true
  const grow = quizMeta?.splashGrow ?? false
  const hasVisual = !!(visual || legacyImage)

  // The single controllable element: a video visual, else a soundtrack.
  const controlType: 'video' | 'audio' | null =
    visualType === 'video' ? 'video' : audio ? 'audio' : null

  const visualSrc = visual ? mediaUrl(visual) : legacyImage
  const controlName = controlType === 'video' ? visual : audio

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-md flex flex-col gap-4">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Film className="h-5 w-5" /> {t('runner.splashTitle')}
        </div>

        {/* Visual thumbnail */}
        {visualSrc && (
          <div className="rounded-lg border border-border overflow-hidden bg-muted/30 aspect-video max-h-48 mx-auto">
            {visualType === 'video' ? (
              <video src={visualSrc} muted preload="metadata" className="h-full w-full object-contain" />
            ) : (
              <img src={visualSrc} alt="" className="h-full w-full object-contain" />
            )}
          </div>
        )}

        {/* Attached-media summary line */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {visual && (
            <span className="flex items-center gap-1.5">
              {visualType === 'video' ? <Film className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
              {mediaDisplayName(visual)}
            </span>
          )}
          {audio && controlType === 'audio' && (
            <span className="flex items-center gap-1.5">
              <Music className="h-4 w-4" /> {mediaDisplayName(audio)}
            </span>
          )}
        </div>

        {/* Grow toggle — applies to any visual, even a static image */}
        {hasVisual && (
          <Toggle
            variant="outline"
            pressed={grow}
            onPressedChange={(v) => setGrow.mutate(v)}
            className="w-full gap-2"
          >
            <Maximize2 className="h-4 w-4" />
            {t('builder.splashGrow')}
          </Toggle>
        )}

        {/* Playback controls */}
        {controlType ? (
          <div className="space-y-3">
            <MediaControls key={controlName} mediaType={controlType} showFullscreen={false} />
            <Toggle
              variant="outline"
              pressed={loop}
              onPressedChange={(v) => setLoop.mutate(v)}
              className="w-full gap-2"
            >
              <Repeat className="h-4 w-4" />
              {t('runner.loop')}
            </Toggle>
          </div>
        ) : (
          !hasVisual && (
            <p className="text-sm text-muted-foreground italic">{t('runner.splashStatic')}</p>
          )
        )}
      </div>
    </div>
  )
}
