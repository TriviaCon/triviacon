import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CloudUpload, Trash2, Volume2 } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Label } from '@renderer/components/ui/label'
import { Card, CardContent } from '@renderer/components/ui/card'
import { ToggleGroup, ToggleGroupItem } from '@renderer/components/ui/toggle-group'
import { RichTextEditor } from '@renderer/components/ui/rich-text-editor'
import { useQuestion } from '@renderer/hooks/useQuestion'
import { AnswerOption, Question } from '@shared/types/quiz'
import { useUpdateQuestionMutation } from '@renderer/hooks/useUpdateQuestionMutation'
import { useAnswerOptions } from '@renderer/hooks/useAnswerOptions'
import { useUpdateAnswerOptionMutation } from '@renderer/hooks/useUpdateAnswerOptionMutation'
import { useDeleteAnswerOptionMutation } from '@renderer/hooks/useDeleteAnswerOptionMutation'
import { useAddAnswerOptionMutation } from '@renderer/hooks/useAddAnswerOptionMutation'
import { useDeleteQuestionMutation } from '@renderer/hooks/useDeleteQuestionMutation'
import { QueryLoading, QueryError } from '@renderer/components/ui/query-state'
import { MediaPreview } from '@renderer/components/ui/media-preview'
import { detectMediaType, ALLOWED_MEDIA_EXTENSIONS } from '@shared/media'
import { usePairQueryState } from '@renderer/hooks/usePairQueryState'

/**
 * Single-answer editor. The question has exactly one answer option, which
 * IS the answer (no "correct" checkbox). The option is created lazily on
 * first edit so a brand-new question doesn't carry an empty option.
 */
const SingleAnswerField = ({
  questionId,
  option,
  onRefetch
}: {
  questionId: number
  option: AnswerOption | undefined
  onRefetch: () => void
}) => {
  const { t } = useTranslation()
  const updateOption = useUpdateAnswerOptionMutation(questionId)
  const creatingRef = useRef(false)

  const handleChange = async (html: string) => {
    if (option) {
      updateOption.mutate({ id: option.id, text: html, correct: true })
    } else if (!creatingRef.current) {
      creatingRef.current = true
      await window.api.answerOptionCreate(questionId, html, true, 0)
      onRefetch()
      creatingRef.current = false
    }
  }

  return (
    <RichTextEditor
      key={`single-${questionId}`}
      value={option?.text ?? ''}
      onChange={handleChange}
      ariaLabel={t('builder.answer')}
    />
  )
}

const QuestionView = ({ id, onDelete }: { id: number; onDelete?: () => void }) => {
  const { t } = useTranslation()
  const question = useQuestion(id)
  const answerOptions = useAnswerOptions(id)
  const addOption = useAddAnswerOptionMutation(id)
  const updateOption = useUpdateAnswerOptionMutation(id)
  const deleteOption = useDeleteAnswerOptionMutation(id)
  const updateQuestionMutation = useUpdateQuestionMutation(id)
  const deleteQuestionMutation = useDeleteQuestionMutation(question.data?.categoryId ?? 0)
  const [deleting, setDeleting] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [dropError, setDropError] = useState<string | null>(null)
  const dropTimerRef = useRef<ReturnType<typeof setTimeout>>()

  const update = (q: Partial<Question>) => updateQuestionMutation.mutate(q)

  const showDropError = useCallback((msg: string) => {
    setDropError(msg)
    clearTimeout(dropTimerRef.current)
    dropTimerRef.current = setTimeout(() => setDropError(null), 3000)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragOver(false)
      setDropError(null)

      const files = e.dataTransfer.files
      if (files.length > 1) {
        showDropError(t('builder.dropOneFileOnly'))
        return
      }
      if (files.length === 0) return

      const file = files[0]
      const ext = file.name.split('.').pop()?.toLowerCase()
      if (!ext || !ALLOWED_MEDIA_EXTENSIONS.includes(ext)) {
        showDropError(t('builder.dropUnsupportedType'))
        return
      }

      const hasExisting = !!question.data?.media
      if (hasExisting && !window.confirm(t('builder.replaceMedia'))) return

      await window.api.mediaAttachFile(id, file.path)
      question.refetch()
    },
    [id, question, t, showDropError]
  )

  const guard = usePairQueryState(question, answerOptions)
  if (!guard.ok) {
    if (guard.loading) return <QueryLoading label={t('builder.loadingQuestion')} />
    if (guard.errorMessage) return <QueryError message={guard.errorMessage} />
    return null
  }

  const type = question.data!.type
  const options = answerOptions.data!

  const handleDeleteQuestion = async () => {
    if (!window.confirm(t('confirm.deleteQuestion'))) return
    setDeleting(true)
    try {
      await deleteQuestionMutation.mutateAsync(id)
      onDelete?.()
    } finally {
      setDeleting(false)
    }
  }

  const handleTypeChange = (newType: string) => {
    if (!newType || newType === type) return
    update({ type: newType as Question['type'] })
    if (newType === 'single-answer' && options.length > 0) {
      // Collapse to one option: keep the first correct one (else the first),
      // force it correct, delete the rest.
      const keep = options.find((o) => o.correct) ?? options[0]
      options.filter((o) => o.id !== keep.id).forEach((o) => deleteOption.mutate(o.id))
      if (!keep.correct) updateOption.mutate({ id: keep.id, correct: true })
    }
  }

  const renderOptionList = (withCorrect: boolean) => (
    <Card>
      <CardContent className="py-2 px-3">
        <div className="flex items-center justify-between mb-2">
          <h6 className="text-sm font-semibold">
            {withCorrect ? t('builder.answerOptions') : t('builder.answers')}
          </h6>
          <Button size="sm" onClick={() => addOption.mutate()}>
            {t('builder.addAnswer')}
          </Button>
        </div>
        <div className="space-y-2">
          {options.map((opt, index) => (
            <div key={opt.id} className="flex items-start gap-2">
              {withCorrect && (
                <input
                  type="checkbox"
                  checked={opt.correct}
                  onChange={(e) => updateOption.mutate({ id: opt.id, correct: e.target.checked })}
                  className="h-4 w-4 rounded border-input mt-2.5"
                  title={t('builder.correctAnswer')}
                />
              )}
              <Label className="font-semibold shrink-0 mt-2">
                {String.fromCharCode(65 + index)}.
              </Label>
              <RichTextEditor
                key={opt.id}
                value={opt.text}
                onChange={(html) => updateOption.mutate({ id: opt.id, text: html })}
                ariaLabel={`${t('builder.answer')} ${String.fromCharCode(65 + index)}`}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0 mt-1 text-destructive border-destructive/50 hover:bg-destructive/10"
                onClick={() => deleteOption.mutate(opt.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="h-full flex flex-col space-y-3">
      <div className="space-y-1">
        <Label>{t('builder.question')}</Label>
        <RichTextEditor
          key={`q-${id}`}
          value={question.data!.text}
          onChange={(html) => update({ text: html })}
          ariaLabel={t('builder.question')}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="questionType">{t('builder.type')}</Label>
        <ToggleGroup id="questionType" type="single" value={type} onValueChange={handleTypeChange}>
          <ToggleGroupItem value="single-answer">{t('builder.typeSingle')}</ToggleGroupItem>
          <ToggleGroupItem value="multiple-choice">{t('builder.typeMultiple')}</ToggleGroupItem>
          <ToggleGroupItem value="list">{t('builder.typeList')}</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <Card
        className={dragOver ? 'border-dashed border-primary border-2' : ''}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="py-2 px-3 space-y-2">
          <h6 className="text-sm font-semibold">{t('builder.media')}</h6>
          {dropError && (
            <p className="text-sm text-destructive">{dropError}</p>
          )}
          {question.data!.media ? (
            <>
              <div className="flex items-center gap-3">
                <div className="flex-1 border border-border rounded p-2">
                  <MediaPreview media={question.data!.media} localPlayer />
                </div>
                <div className="flex flex-col gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      const path = await window.api.mediaPickFile(id)
                      if (path) question.refetch()
                    }}
                  >
                    {t('actions.change')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive border-destructive/50 hover:bg-destructive/10"
                    onClick={async () => {
                      await window.api.mediaRemoveFile(id)
                      question.refetch()
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {detectMediaType(question.data!.media) === 'video' && (
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={question.data!.audioOnly ?? false}
                    onChange={(e) => update({ audioOnly: e.target.checked })}
                    className="h-4 w-4 rounded border-input"
                  />
                  <Volume2 className="h-4 w-4" />
                  {t('builder.audioOnly')}
                </label>
              )}
            </>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={async () => {
                const path = await window.api.mediaPickFile(id)
                if (path) question.refetch()
              }}
            >
              <CloudUpload className="mr-2 h-4 w-4" /> {t('builder.attachMedia')}
            </Button>
          )}
        </CardContent>
      </Card>

      {type === 'single-answer' ? (
        <Card>
          <CardContent className="py-2 px-3 space-y-2">
            <h6 className="text-sm font-semibold">{t('builder.answer')}</h6>
            <SingleAnswerField
              questionId={id}
              option={options[0]}
              onRefetch={answerOptions.refetch}
            />
          </CardContent>
        </Card>
      ) : (
        renderOptionList(type === 'multiple-choice')
      )}

      {onDelete && (
        <Button
          variant="outline"
          className="w-full text-destructive border-destructive/50 hover:bg-destructive/10"
          onClick={handleDeleteQuestion}
          disabled={deleting}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {t('actions.delete')}
        </Button>
      )}
    </div>
  )
}

export default QuestionView
