import { useTranslation } from 'react-i18next'
import { Film, ImagePlus, Music, Repeat, VolumeX, X } from 'lucide-react'
import { Toggle } from '@renderer/components/ui/toggle'
import { cn } from '@renderer/lib/utils'
import { mediaUrl } from '@shared/mediaUrl'
import { detectMediaType, mediaDisplayName } from '@shared/media'
import type { QuizMeta } from '@shared/types/quiz'
import {
  useSplashPickVisual,
  useSplashPickAudio,
  useSplashClearVisual,
  useSplashClearAudio,
  useSplashSetMuted,
  useSplashSetLoop,
  useUpdateSplash
} from '@renderer/hooks/useQuizMeta'

// ── Filled slot preview ──────────────────────────────────────────────

function SlotChip({
  filename,
  kind,
  onClear
}: {
  filename: string
  kind: 'image' | 'video' | 'audio'
  onClear: () => void
}) {
  const src = mediaUrl(filename)
  const { t } = useTranslation()
  return (
    <div className="relative h-24 rounded-lg border border-border bg-muted/30 overflow-hidden flex items-center justify-center">
      <button
        onClick={onClear}
        className="absolute top-1.5 right-1.5 z-10 grid h-5 w-5 place-items-center rounded-md bg-background/80 text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
        aria-label={t('actions.delete')}
      >
        <X className="h-3.5 w-3.5" />
      </button>
      {kind === 'image' && src && (
        <img src={src} className="h-full w-full object-cover" alt="" />
      )}
      {kind === 'video' && src && (
        <video src={src} muted preload="metadata" className="h-full w-full object-cover" />
      )}
      {kind === 'audio' && (
        <Music className="h-8 w-8 text-muted-foreground" />
      )}
      <div className="absolute bottom-0 inset-x-0 bg-background/85 px-2 py-1 text-[11px] font-medium truncate">
        {mediaDisplayName(filename)}
      </div>
    </div>
  )
}

// ── Empty drop target ────────────────────────────────────────────────

function SlotEmpty({
  hint,
  icon,
  disabled,
  onClick
}: {
  hint: string
  icon: React.ReactNode
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'h-24 w-full rounded-lg border-[1.5px] border-dashed border-border flex flex-col items-center justify-center gap-1.5 text-muted-foreground transition-colors',
        disabled
          ? 'opacity-50 cursor-not-allowed bg-muted/30'
          : 'hover:border-primary hover:text-primary hover:bg-primary/5'
      )}
    >
      {icon}
      <span className="text-[11px]">{hint}</span>
    </button>
  )
}

// ── Splash control ───────────────────────────────────────────────────

export function SplashControl({ meta }: { meta: QuizMeta }) {
  const { t } = useTranslation()

  const pickVisual = useSplashPickVisual()
  const pickAudio = useSplashPickAudio()
  const clearVisual = useSplashClearVisual()
  const clearAudio = useSplashClearAudio()
  const setMuted = useSplashSetMuted()
  const setLoop = useSplashSetLoop()
  const updateSplash = useUpdateSplash()

  // Resolve current visual: new field wins; legacy base64 splash is a fallback image.
  const legacyImage = meta.splash && meta.splash.length > 0 ? meta.splash : null
  const visual = meta.splashVisual ?? null
  const visualType = visual ? detectMediaType(visual) : legacyImage ? 'image' : null
  const isVideo = visualType === 'video'

  const audio = meta.splashAudio ?? null
  const muted = meta.splashMuted ?? false
  const loop = meta.splashLoop ?? true

  // Plain-language summary of what the audience will see.
  const summary = (() => {
    if (!visual && !legacyImage) {
      return audio ? t('builder.splashSummary_cardAudio') : t('builder.splashSummary_card')
    }
    if (isVideo) {
      return muted ? t('builder.splashSummary_videoMuted') : t('builder.splashSummary_video')
    }
    // image (new or legacy)
    return audio ? t('builder.splashSummary_imageAudio') : t('builder.splashSummary_image')
  })()

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {/* Visual slot */}
        <div className="space-y-1.5">
          <div className="text-xs font-semibold">{t('builder.splashVisual')}</div>
          {visual ? (
            <SlotChip
              filename={visual}
              kind={(visualType ?? 'image') as 'image' | 'video'}
              onClear={() => clearVisual.mutate()}
            />
          ) : legacyImage ? (
            <div className="relative h-24 rounded-lg border border-border overflow-hidden">
              <img src={legacyImage} className="h-full w-full object-cover" alt="" />
              <button
                onClick={() => updateSplash.mutate('')}
                className="absolute top-1.5 right-1.5 grid h-5 w-5 place-items-center rounded-md bg-background/80 text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <SlotEmpty
              hint={t('builder.splashVisualHint')}
              icon={<ImagePlus className="h-6 w-6" />}
              onClick={() => pickVisual.mutate()}
            />
          )}

          {isVideo && (
            <div className="flex gap-1.5 pt-0.5">
              <Toggle
                size="sm"
                variant="outline"
                pressed={muted}
                onPressedChange={(v) => setMuted.mutate(v)}
                className="text-xs gap-1"
              >
                <VolumeX className="h-3.5 w-3.5" />
                {t('builder.muteVideoAudio')}
              </Toggle>
              <Toggle
                size="sm"
                variant="outline"
                pressed={loop}
                onPressedChange={(v) => setLoop.mutate(v)}
                className="text-xs gap-1"
              >
                <Repeat className="h-3.5 w-3.5" />
                {t('builder.loopVideo')}
              </Toggle>
            </div>
          )}
        </div>

        {/* Soundtrack slot */}
        <div className="space-y-1.5">
          <div className="text-xs font-semibold">{t('builder.splashSoundtrack')}</div>
          {isVideo ? (
            <>
              <SlotEmpty
                hint={t('builder.splashAudioHint')}
                icon={<Music className="h-6 w-6" />}
                disabled
                onClick={() => {}}
              />
              <p className="text-[10.5px] leading-tight text-muted-foreground">
                {t('builder.splashAudioDisabled')}
              </p>
            </>
          ) : audio ? (
            <SlotChip filename={audio} kind="audio" onClear={() => clearAudio.mutate()} />
          ) : (
            <SlotEmpty
              hint={t('builder.splashAudioHint')}
              icon={<Music className="h-6 w-6" />}
              onClick={() => pickAudio.mutate()}
            />
          )}
        </div>
      </div>

      {/* Summary line */}
      <div className="flex items-start gap-2 rounded-md bg-primary/5 border border-primary/15 px-3 py-2 text-[13px]">
        <Film className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <span>
          <span className="font-semibold text-primary">{t('builder.splashSummaryLabel')} </span>
          {summary}
        </span>
      </div>
    </div>
  )
}
