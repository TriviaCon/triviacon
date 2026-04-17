import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ActiveQuestionState } from '@shared/types/state'
import { detectMediaType } from '@shared/media'
import { mediaUrl } from '@shared/mediaUrl'

function optionClass(
  correct: boolean,
  marked: boolean,
  answerRevealed: boolean
): string {
  if (answerRevealed && correct) return 'bg-success text-success-foreground'
  if (answerRevealed && marked && !correct) return 'bg-wrong text-wrong-foreground'
  if (marked) return 'bg-marked text-marked-foreground'
  return 'bg-card text-card-foreground border border-border'
}

const QuestionScreen = ({ activeQuestion }: { activeQuestion: ActiveQuestionState | null }) => {
  const { t } = useTranslation()
  const audioRef = useRef<HTMLAudioElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [mediaFullscreen, setMediaFullscreen] = useState(false)

  // Reset fullscreen when the active question changes
  useEffect(() => {
    setMediaFullscreen(false)
  }, [activeQuestion?.question.id])

  useEffect(() => {
    const cleanups: (() => void)[] = []

    cleanups.push(
      window.api.onMediaPlay(() => {
        audioRef.current?.play()
        videoRef.current?.play()
      })
    )
    cleanups.push(
      window.api.onMediaPause(() => {
        audioRef.current?.pause()
        videoRef.current?.pause()
      })
    )
    cleanups.push(
      window.api.onMediaStop(() => {
        if (audioRef.current) {
          audioRef.current.pause()
          audioRef.current.currentTime = 0
        }
        if (videoRef.current) {
          videoRef.current.pause()
          videoRef.current.currentTime = 0
        }
      })
    )
    cleanups.push(
      window.api.onMediaToggleFullscreen(() => {
        setMediaFullscreen((prev) => !prev)
      })
    )

    return () => cleanups.forEach((fn) => fn())
  }, [])

  if (!activeQuestion) {
    return (
      <div className="flex items-center justify-center h-screen">
        <h2 className="text-3xl text-muted-foreground">{t('gameScreen.noQuestionSelected')}</h2>
      </div>
    )
  }

  const { question, answerOptions, answerRevealed, markedAnswerId } = activeQuestion
  const correctOptions = answerOptions.filter((opt) => opt.correct)
  const mediaType = detectMediaType(question.media)
  const mediaSrc = mediaUrl(question.media)

  return (
    <>
      {/* Fullscreen media overlay */}
      {mediaFullscreen && mediaSrc && (mediaType === 'image' || mediaType === 'video') && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          {mediaType === 'image' && (
            <img
              src={mediaSrc}
              className="w-full h-full object-contain"
              alt=""
            />
          )}
          {mediaType === 'video' && (
            <video
              ref={videoRef}
              src={mediaSrc}
              preload="auto"
              className="w-full h-full object-contain"
            />
          )}
        </div>
      )}

      <div className="w-full py-8 px-6">
        <div className="text-center">
          <h1 className="text-5xl mb-6">{question.text}</h1>

          {mediaSrc && mediaType === 'image' && !mediaFullscreen && (
            <img src={mediaSrc} className="max-w-full h-auto mx-auto mt-2 mb-6" alt="" />
          )}
          {mediaSrc && mediaType === 'audio' && (
            <audio ref={audioRef} src={mediaSrc} preload="auto" />
          )}
          {mediaSrc && mediaType === 'video' && !mediaFullscreen && (
            <video
              ref={videoRef}
              src={mediaSrc}
              preload="auto"
              className="max-w-full max-h-[50vh] mx-auto mt-2 mb-6"
            />
          )}

          <h1
            className="text-7xl font-bold mb-6"
            style={{ visibility: answerRevealed ? 'visible' : 'hidden' }}
          >
            {correctOptions.map((o) => o.text).join(', ')}
          </h1>

          {answerOptions.length > 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              {answerOptions.map((opt, index) => (
                <div
                  key={opt.id}
                  className={`rounded-lg p-4 transition-colors ${optionClass(opt.correct, opt.id === markedAnswerId, answerRevealed)}`}
                >
                  <p className="text-4xl">
                    {String.fromCharCode(65 + index)}. {opt.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default QuestionScreen
