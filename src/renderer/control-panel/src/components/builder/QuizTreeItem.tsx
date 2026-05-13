import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Camera, Music, Play, Plus, Trash2 } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@renderer/components/ui/accordion'
import { Category } from '@shared/types/quiz'
import useCategoryQuestions from '@renderer/hooks/useCategoryQuestions'
import { useDeleteCategoryMutation } from '@renderer/hooks/useDeleteCategoryMutation'
import { useAddQuestionMutation } from '@renderer/hooks/useAddQuestionMutation'
import { detectMediaType } from '@shared/media'

/**
 * Icon for the per-question media slot in the quiz tree.
 *
 * - image → camera, audio → musical note, video → play arrow.
 * - When no media is attached, render a faded camera as a placeholder
 *   so the button keeps its width.
 */
const MediaIcon = ({ media }: { media: string | null }) => {
  const type = detectMediaType(media)
  const className = 'ml-1 h-3 w-3'
  switch (type) {
    case 'audio':
      return <Music className={className} />
    case 'video':
      return <Play className={className} />
    case 'image':
      return <Camera className={className} />
    default:
      // No media — render a faded placeholder to preserve button sizing.
      return <Camera className={`${className} opacity-30`} aria-hidden="true" />
  }
}

const DeleteCategoryButton = ({
  name,
  onDelete
}: {
  name: string
  onDelete: () => Promise<unknown>
}) => {
  const { t } = useTranslation()
  const [pending, setPending] = useState(false)
  const handleClick = async () => {
    if (!window.confirm(t('confirm.deleteCategory', { name }))) {
      return
    }
    setPending(true)
    await onDelete()
    setPending(false)
  }
  return (
    <Button
      variant="outline"
      size="icon"
      className="h-8 w-8 text-destructive border-destructive/50 hover:bg-destructive/10"
      onClick={handleClick}
      disabled={pending}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}

const QuizTreeItem = ({
  category,
  onOpen,
  onSelectQuestion,
  onClose,
  editable,
  usedQuestions
}: {
  category: Category
  onOpen: () => void
  onSelectQuestion: (id: number) => void
  onClose: () => void
  editable: boolean
  usedQuestions?: number[]
}) => {
  const { data: questions } = useCategoryQuestions(category.id)
  const deleteCategoryMutation = useDeleteCategoryMutation(category.id)
  const addQuestionMutation = useAddQuestionMutation(category.id)
  const renameTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  if (!questions) return null

  const usedSet = usedQuestions ? new Set(usedQuestions) : null
  const usedCount = usedSet ? questions.filter((q) => usedSet.has(q.id)).length : 0
  const remaining = questions.length - usedCount

  const handleRename = (value: string) => {
    clearTimeout(renameTimeout.current)
    renameTimeout.current = setTimeout(() => {
      if (value.trim() && value !== category.name) {
        window.api.categoryUpdate(category.id, value.trim())
      }
    }, 500)
  }

  return (
    <AccordionItem value={`${category.id}`}>
      <AccordionTrigger
        onClick={onOpen}
        className={`text-sm font-semibold ${usedSet && remaining === 0 ? 'opacity-40 line-through' : ''}`}
      >
        {category.name} ({usedSet ? `${remaining}/${questions.length}` : questions.length})
      </AccordionTrigger>
      <AccordionContent
        onAnimationEnd={(e) => {
          if ((e.target as HTMLElement).dataset.state === 'closed') onClose()
        }}
      >
        <div className="flex gap-2 mb-2">
          <Input
            readOnly={!editable}
            name="name"
            type="text"
            defaultValue={category.name || ''}
            onChange={(e) => handleRename(e.target.value)}
          />
          {editable && (
            <DeleteCategoryButton
              name={category.name}
              onDelete={deleteCategoryMutation.mutateAsync}
            />
          )}
        </div>
        <div className="flex flex-wrap gap-1">
          {questions.map((question, index) => {
            const isUsed = usedSet?.has(question.id)
            return (
              <Button
                key={question.id}
                variant="outline"
                size="sm"
                onClick={() => onSelectQuestion(question.id)}
                className={isUsed ? 'opacity-40 line-through' : ''}
              >
                {index + 1}
                <MediaIcon media={question.media} />
              </Button>
            )
          })}
          {editable && (
            <Button size="sm" onClick={() => addQuestionMutation.mutate()}>
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

export default QuizTreeItem
