import { useTranslation } from 'react-i18next'
import type { QuizMeta } from '@shared/types/quiz'
import { mediaUrl } from '@shared/mediaUrl'
import { detectMediaType } from '@shared/media'

const IdleScreen = ({ quizMeta }: { quizMeta: QuizMeta | null }) => {
  const { t } = useTranslation()

  // Resolve the visual: new field wins; legacy base64 splash is a fallback image.
  const legacyImage = quizMeta?.splash && quizMeta.splash.length > 0 ? quizMeta.splash : null
  const visualName = quizMeta?.splashVisual ?? null
  const visualSrc = visualName ? mediaUrl(visualName) : legacyImage
  const visualType = visualName ? detectMediaType(visualName) : legacyImage ? 'image' : null

  const muted = quizMeta?.splashMuted ?? false
  const loop = quizMeta?.splashLoop ?? true

  // Soundtrack only applies when the visual isn't a video (a video carries its own audio).
  const audioName = quizMeta?.splashAudio ?? null
  const audioSrc = audioName && visualType !== 'video' ? mediaUrl(audioName) : null

  const hasMeta = !!(quizMeta?.name || quizMeta?.location || quizMeta?.date || quizMeta?.author)

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-10 bg-background text-foreground p-12">
      {/* Contained hero */}
      {visualSrc && (
        <div className="w-[58vw] max-w-[60vh] aspect-video rounded-xl overflow-hidden shadow-2xl shrink-0">
          {visualType === 'video' ? (
            <video
              src={visualSrc}
              autoPlay
              loop={loop}
              muted={muted}
              playsInline
              className="h-full w-full object-cover"
            />
          ) : (
            <img src={visualSrc} alt="" className="h-full w-full object-contain" />
          )}
        </div>
      )}

      {/* Metadata card — always present */}
      <div className="text-center">
        {quizMeta?.name && <h1 className="text-[5rem] leading-none font-bold">{quizMeta.name}</h1>}
        {quizMeta?.location && <h2 className="text-[3rem] mt-4">{quizMeta.location}</h2>}
        {quizMeta?.date && <h3 className="text-[2rem] opacity-70 mt-2">{quizMeta.date}</h3>}
        {quizMeta?.author && (
          <p className="text-2xl opacity-50 mt-2">{t('gameScreen.byAuthor', { author: quizMeta.author })}</p>
        )}
        {!quizMeta && <p className="text-xl opacity-70">{t('app.waitingForData')}</p>}
        {quizMeta && !hasMeta && !visualSrc && (
          <h1 className="text-[5rem] font-bold">{t('app.name')}</h1>
        )}
      </div>

      {/* Soundtrack (hidden audio element) */}
      {audioSrc && <audio src={audioSrc} autoPlay loop={loop} />}
    </div>
  )
}

export default IdleScreen
