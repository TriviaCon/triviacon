import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ActiveQuestionState, TimerSoundMode, TimerState } from '@shared/types/state'
import { detectMediaType } from '@shared/media'
import { mediaUrl } from '@shared/mediaUrl'
import { RichText } from '@shared/RichText'
import AudioVisualizer from '@shared/AudioVisualizer'
import PieTimer from './PieTimer'

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

interface QuestionScreenProps {
  activeQuestion: ActiveQuestionState | null
  categoryName: string | null
  questionIndex: number
  currentTeamName: string | null
  timer: TimerState
  timerDuration: number
  timerSound: TimerSoundMode
}

const QuestionScreen = ({
  activeQuestion,
  categoryName,
  questionIndex,
  currentTeamName,
  timer,
  timerDuration,
  timerSound
}: QuestionScreenProps) => {
  const { t } = useTranslation()
  const audioRef = useRef<HTMLAudioElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [mediaFullscreen, setMediaFullscreen] = useState(false)
  const savedTimeRef = useRef(0)
  const savedVolumeRef = useRef(0.1)
  const savedPlayingRef = useRef(false)

  useEffect(() => {
    window.api.getDefaultVolume().then((v) => { savedVolumeRef.current = v })
  }, [])

  // Reset fullscreen and playback bookkeeping when the active question changes
  useEffect(() => {
    setMediaFullscreen(false)
    savedTimeRef.current = 0
    savedPlayingRef.current = false
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
        const el = audioRef.current ?? videoRef.current
        if (el) {
          savedTimeRef.current = el.currentTime
          savedVolumeRef.current = el.volume
          savedPlayingRef.current = !el.paused
        }
        setMediaFullscreen((prev) => !prev)
      })
    )
    cleanups.push(
      window.api.onMediaSeek((time: number) => {
        if (audioRef.current) audioRef.current.currentTime = time
        if (videoRef.current) videoRef.current.currentTime = time
      })
    )
    cleanups.push(
      window.api.onMediaSetVolume((volume: number) => {
        if (audioRef.current) audioRef.current.volume = volume
        if (videoRef.current) videoRef.current.volume = volume
      })
    )

    return () => cleanups.forEach((fn) => fn())
  }, [])

  useEffect(() => {
    const el = audioRef.current ?? videoRef.current
    if (!el) return

    if (savedTimeRef.current > 0) el.currentTime = savedTimeRef.current
    el.volume = savedVolumeRef.current
    if (savedPlayingRef.current) void el.play().catch(() => {})

    const report = () => {
      savedTimeRef.current = el.currentTime
      savedVolumeRef.current = el.volume
      window.api.sendMediaState({
        currentTime: el.currentTime,
        duration: el.duration || 0,
        volume: el.volume
      })
    }
    el.addEventListener('timeupdate', report)
    el.addEventListener('loadedmetadata', report)
    el.addEventListener('volumechange', report)
    report()
    return () => {
      el.removeEventListener('timeupdate', report)
      el.removeEventListener('loadedmetadata', report)
      el.removeEventListener('volumechange', report)
    }
  }, [activeQuestion?.question.id, mediaFullscreen])

  if (!activeQuestion) {
    return (
      <div className="flex items-center justify-center h-screen">
        <h2 className="text-3xl text-muted-foreground">{t('gameScreen.noQuestionSelected')}</h2>
      </div>
    )
  }

  const { question, answerOptions, answerRevealed, markedAnswerId, revealedOptionIds } = activeQuestion
  const correctOptions = answerOptions.filter((opt) => opt.correct)
  const mediaType = detectMediaType(question.media)
  const mediaSrc = mediaUrl(question.media)
  const audioOnly = question.audioOnly && mediaType === 'video'
  const hasVisualMedia =
    mediaSrc && (mediaType === 'image' || (mediaType === 'video' && !audioOnly)) && !mediaFullscreen
  const hasAudioVisualizer = (mediaSrc && mediaType === 'audio') || audioOnly
  const hasMediaZone = hasVisualMedia || hasAudioVisualizer
  const type = question.type

  return (
    <>
      {/* Fullscreen media overlay */}
      {mediaFullscreen && mediaSrc && (mediaType === 'image' || (mediaType === 'video' && !audioOnly)) && (
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

      <div className="flex flex-col h-screen bg-background text-foreground">
        <div className="grid grid-cols-3 items-center px-6 py-4 shrink-0">
          <div className="text-2xl font-semibold text-muted-foreground">
            {categoryName}
          </div>
          <div className="text-2xl font-semibold flex items-center justify-center gap-3">
            {currentTeamName && (
              <>
                <span className="text-muted-foreground">{t('gameScreen.answering')}</span>{' '}
                <span className="text-foreground">{currentTeamName}</span>
                <PieTimer timer={timer} durationSeconds={timerDuration} timerSound={timerSound} size={48} />
              </>
            )}
          </div>
          <div className="text-2xl font-semibold text-muted-foreground text-right">
            {questionIndex > 0 &&
              t('gameScreen.questionIndicator', { current: questionIndex })}
          </div>
        </div>
        <hr className="border-border mx-6 shrink-0" />

        {mediaSrc && mediaType === 'audio' && (
          <audio ref={audioRef} src={mediaSrc} preload="auto" />
        )}
        {audioOnly && mediaSrc && (
          <video ref={videoRef} src={mediaSrc} preload="auto" className="hidden" />
        )}

        <div className="flex-1 min-h-0 flex flex-col px-6 pb-4 pt-2 overflow-hidden">
          {/* Question text */}
          <div
            className={`shrink-0 text-center ${!hasMediaZone ? 'flex-1 flex items-center justify-center' : ''}`}
          >
            <RichText
              html={question.text}
              className="text-6xl [&_p]:m-0 [&_p+p]:mt-3"
            />
          </div>

          {/* Media — scales to fill remaining space, capped so answers aren't squeezed */}
          {hasVisualMedia && (
            <div className="flex-1 min-h-0 max-h-[40vh] flex items-center justify-center mt-2">
              {mediaType === 'image' && (
                <img
                  src={mediaSrc!}
                  className="w-full h-full object-contain"
                  alt=""
                />
              )}
              {mediaType === 'video' && (
                <video
                  ref={videoRef}
                  src={mediaSrc!}
                  preload="auto"
                  className="w-full h-full object-contain"
                />
              )}
            </div>
          )}

          {/* Audio visualizer — fills the media zone for audio-only questions */}
          {hasAudioVisualizer && (
            <div className="flex-1 min-h-0 max-h-[40vh] mt-2 px-8">
              <AudioVisualizer audioRef={audioOnly ? videoRef : audioRef} />
            </div>
          )}

          {/* Answers — pinned to bottom */}
          <div className="shrink-0 mt-auto">
            {type === 'single-answer' && (
              <div
                className="text-8xl font-bold text-center [&_p]:m-0"
                style={{ visibility: answerRevealed ? 'visible' : 'hidden' }}
              >
                <RichText html={answerOptions[0]?.text ?? ''} />
              </div>
            )}

            {type === 'multiple-choice' && (
              <>
                {correctOptions.length > 0 && (
                  <div
                    className="text-8xl font-bold mb-4 flex flex-wrap justify-center gap-x-6 [&_p]:m-0"
                    style={{ visibility: answerRevealed ? 'visible' : 'hidden' }}
                  >
                    {correctOptions.map((o) => (
                      <RichText key={o.id} html={o.text} />
                    ))}
                  </div>
                )}
                {answerOptions.length > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    {answerOptions.map((opt, index) => (
                      <div
                        key={opt.id}
                        className={`rounded-lg p-4 transition-colors flex items-center justify-center gap-3 text-5xl ${optionClass(opt.correct, opt.id === markedAnswerId, answerRevealed)}`}
                      >
                        <span className="font-semibold">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        <RichText html={opt.text} className="[&_p]:m-0" />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {type === 'list' && answerOptions.length > 0 && (() => {
              const isOdd = answerOptions.length % 2 !== 0
              const lastIndex = answerOptions.length - 1
              return (
                <div className="grid grid-cols-2 gap-4">
                  {answerOptions.map((opt, index) => {
                    const found = revealedOptionIds.includes(opt.id)
                    const revealed = answerRevealed && !found
                    const visible = found || revealed
                    return (
                      <div
                        key={opt.id}
                        className={`rounded-lg px-6 py-3 text-4xl font-semibold transition-colors flex items-center gap-3 ${
                          isOdd && index === lastIndex ? 'col-span-2 mx-auto min-w-[50%]' : ''
                        } ${
                          found
                            ? 'bg-success text-success-foreground'
                            : revealed
                              ? 'bg-muted text-muted-foreground'
                              : 'bg-card text-card-foreground/20 border border-border'
                        }`}
                      >
                        <span className={!visible ? 'text-foreground' : ''}>{index + 1}.</span>
                        {visible && <RichText html={opt.text} className="[&_p]:m-0" />}
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>
        </div>
      </div>
    </>
  )
}

export default QuestionScreen
