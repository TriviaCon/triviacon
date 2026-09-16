import { useTranslation } from 'react-i18next'
import { CheckCircle2, Eye, EyeOff, StickyNote } from 'lucide-react'
import { AnswerOption, Question } from '@shared/types/quiz'
import { Label } from '@renderer/components/ui/label'
import { Button } from '@renderer/components/ui/button'
import { Toggle } from '@renderer/components/ui/toggle'
import { MediaPreview } from '@renderer/components/ui/media-preview'
import { RichText, richTextToPlain } from '@shared/RichText'
import { cn } from '@renderer/lib/utils'
import { mediaUrl } from '@shared/mediaUrl'
import { activeQuestionMedia, detectMediaType, mediaDisplayName } from '@shared/media'

/**
 * One media slot. Transport controls go only to the file the game screen is
 * actually playing — the two panels drive the same element, so showing controls
 * on both made them mirror each other's time and volume. An image keeps its
 * preview either way; the idle player just says why it's idle.
 */
const MediaSlot = ({
  media,
  active,
  inactiveHint
}: {
  media: string | null
  active: boolean
  inactiveHint: string
}) => {
  if (detectMediaType(media) === 'image') {
    return <MediaPreview media={media} fullscreenButton={active} />
  }
  if (active) return <MediaPreview media={media} fullscreenButton playbackControls />
  return <p className="text-xs text-muted-foreground italic">{inactiveHint}</p>
}

const QuestionPreview = ({
  question,
  answerOptions,
  answerRevealed,
  onRevealAnswer,
  markedAnswerId,
  onMarkAnswer,
  revealedOptionIds,
  onToggleListOption,
  used,
  onUse,
  onShowOnScreen
}: {
  question: Question
  answerOptions: AnswerOption[]
  answerRevealed: boolean
  onRevealAnswer: () => void
  markedAnswerId: number | null
  onMarkAnswer: (id: number | null) => void
  revealedOptionIds: number[]
  onToggleListOption: (id: number) => void
  used: boolean
  onUse: () => void
  onShowOnScreen: (() => void) | null
}) => {
  const { t } = useTranslation()
  const mediaSrc = mediaUrl(question.media)
  const answerMediaSrc = mediaUrl(question.answerMedia)
  const activeMedia = activeQuestionMedia(question.media, question.answerMedia, answerRevealed)
  const type = question.type

  return (
    <div className="space-y-3">
      {onShowOnScreen && (
        <Button
          className="w-full"
          onClick={onShowOnScreen}
        >
          <Eye className="mr-2 h-4 w-4" />
          {t('runner.showOnScreen')}
        </Button>
      )}

      <RichText
        html={question.text}
        className="text-xl font-semibold [&_p]:m-0 [&_p+p]:mt-1"
      />

      {question.notes && richTextToPlain(question.notes).trim().length > 0 && (
        <div className="rounded-md border border-border bg-muted/40 px-3 py-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            <StickyNote className="h-3.5 w-3.5" /> {t('runner.notes')}
          </div>
          <RichText html={question.notes} className="text-sm [&_p]:m-0 [&_p+p]:mt-1" />
        </div>
      )}

      <div className="space-y-3">
        <div className="space-y-1">
          <Label>{t('runner.media')}</Label>
          {!mediaSrc ? (
            <span className="text-sm text-muted-foreground">{t('runner.noMedia')}</span>
          ) : (
            <div className="rounded-lg border border-border p-3 space-y-2">
              <span className="text-sm text-muted-foreground truncate block">
                {mediaDisplayName(question.media) ?? question.media}
              </span>
              <MediaSlot
                media={question.media}
                active={activeMedia.slot === 'question'}
                inactiveHint={t('runner.mediaHandedToAnswer')}
              />
            </div>
          )}
        </div>

        <div className="space-y-1">
          <Label>{t('runner.answerMedia')}</Label>
          {!answerMediaSrc ? (
            <span className="text-sm text-muted-foreground">{t('runner.noMedia')}</span>
          ) : (
            <div className="rounded-lg border border-border p-3 space-y-2">
              <span className="text-sm text-muted-foreground truncate block">
                {mediaDisplayName(question.answerMedia) ?? question.answerMedia}
              </span>
              <MediaSlot
                media={question.answerMedia ?? null}
                active={activeMedia.slot === 'answer'}
                inactiveHint={t('runner.mediaAfterReveal')}
              />
            </div>
          )}
        </div>

        <div className="space-y-1">
          <Label>{t('runner.answers')}</Label>
          <div className="space-y-1.5">
            {answerOptions.length === 0 ? (
              <span className="text-sm text-muted-foreground">{t('runner.noAnswerOptions')}</span>
            ) : type === 'multiple-choice' ? (
              answerOptions.map((opt, index) => {
                const isMarked = opt.id === markedAnswerId
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onMarkAnswer(isMarked ? null : opt.id)}
                    className={cn(
                      'w-full text-left rounded-md px-3 py-2 text-sm border cursor-pointer transition-colors flex items-baseline gap-1 flex-wrap',
                      answerRevealed && opt.correct
                        ? 'bg-green-100 border-green-300 text-green-900'
                        : answerRevealed && isMarked && !opt.correct
                          ? 'bg-red-100 border-red-300 text-red-900'
                          : isMarked
                            ? 'bg-amber-100 border-amber-300 text-amber-900'
                            : opt.correct
                              ? 'bg-muted/50 border-green-400/50 hover:bg-muted'
                              : 'bg-muted/50 border-border hover:bg-muted'
                    )}
                  >
                    <strong>{String.fromCharCode(65 + index)}.</strong>
                    <RichText html={opt.text} className="[&_p]:m-0" />
                    {opt.correct && !answerRevealed && <span className="text-green-600">{'✓'}</span>}
                    {answerRevealed && opt.correct && <span>{'✔'}</span>}
                    {isMarked && !answerRevealed && <span>{'◀'}</span>}
                  </button>
                )
              })
            ) : type === 'single-answer' ? (
              <div className="rounded-md px-3 py-2 text-sm border bg-muted/50 border-green-400/50 flex items-baseline gap-1">
                <RichText html={answerOptions[0]?.text ?? ''} className="[&_p]:m-0" />
              </div>
            ) : (
              answerOptions.map((opt, index) => {
                const found = revealedOptionIds.includes(opt.id)
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onToggleListOption(opt.id)}
                    className={cn(
                      'w-full text-left rounded-md px-3 py-2 text-sm border cursor-pointer transition-colors flex items-baseline gap-1',
                      found
                        ? 'bg-green-100 border-green-300 text-green-900'
                        : 'bg-muted/50 border-green-400/50 hover:bg-muted'
                    )}
                  >
                    <strong>{index + 1}.</strong>
                    <RichText html={opt.text} className="[&_p]:m-0" />
                    {found && <span className="ml-auto">{'✔'}</span>}
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Both are states of the question, so they read as pressed or not
            rather than as a switch with a Yes/No caption beside it. */}
        <div className="grid grid-cols-2 gap-2">
          <Toggle
            variant="outline"
            pressed={used}
            onPressedChange={onUse}
            className="w-full"
          >
            <CheckCircle2 /> {t('runner.used')}
          </Toggle>
          <Toggle
            variant="outline"
            pressed={answerRevealed}
            onPressedChange={onRevealAnswer}
            className="w-full"
          >
            {answerRevealed ? <Eye /> : <EyeOff />}
            {answerRevealed ? t('runner.revealed') : t('runner.reveal')}
          </Toggle>
        </div>
      </div>
    </div>
  )
}

export default QuestionPreview
