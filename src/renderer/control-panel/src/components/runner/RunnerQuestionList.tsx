import { useTranslation } from 'react-i18next'
import { FileAudio, FileVideo, Image } from 'lucide-react'
import { cn } from '@renderer/lib/utils'
import useCategoryQuestions from '@renderer/hooks/useCategoryQuestions'
import type { Category, Question, QuestionType } from '@shared/types/quiz'
import { detectMediaType } from '@shared/media'

const TYPE_LABELS: Record<QuestionType, string> = {
  'multiple-choice': 'Multi',
  'single-answer': 'Single',
  'list': 'List',
}

const TYPE_CLASSES: Record<QuestionType, string> = {
  'multiple-choice': 'bg-blue-100 text-blue-700 border-blue-200',
  'single-answer': 'bg-green-100 text-green-700 border-green-200',
  'list': 'bg-purple-100 text-purple-700 border-purple-200',
}

function MediaIcon({ media }: { media: string | null }) {
  const type = detectMediaType(media)
  if (type === 'video') return <FileVideo className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
  if (type === 'audio') return <FileAudio className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
  if (type === 'image') return <Image className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
  return null
}

function QuestionCard({
  question,
  index,
  isActive,
  isUsed,
  onClick
}: {
  question: Question
  index: number
  isActive: boolean
  isUsed: boolean
  onClick: () => void
}) {
  return (
    <div
      className={cn(
        'flex items-stretch gap-3 rounded-md border p-3 text-sm cursor-pointer transition-colors select-none',
        isActive
          ? 'border-primary bg-primary/5'
          : 'border-border bg-card hover:border-primary/40 hover:bg-accent/40',
        isUsed && !isActive && 'opacity-40'
      )}
      onClick={onClick}
    >
      <span className={cn('text-2xl font-bold tabular-nums shrink-0 leading-none pt-0.5', isUsed ? 'text-muted-foreground/40' : 'text-muted-foreground')}>
        #{index + 1}
      </span>
      <div className="flex-1 min-w-0 flex flex-col justify-between gap-1.5">
        <div
          className={cn(
            'text-sm leading-snug line-clamp-2 [&_p]:m-0 [&_strong]:font-semibold [&_em]:italic [&_u]:underline',
            isUsed && 'line-through'
          )}
          dangerouslySetInnerHTML={{ __html: question.text || '&nbsp;' }}
        />
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn('inline-flex items-center rounded-full border px-1.5 py-0 text-[10px] font-medium', TYPE_CLASSES[question.type])}>
            {TYPE_LABELS[question.type]}
          </span>
          <MediaIcon media={question.media} />
        </div>
      </div>
    </div>
  )
}

function CategorySection({
  category,
  activeQuestionId,
  usedQuestions,
  onSelect
}: {
  category: Category
  activeQuestionId: number | null
  usedQuestions: number[]
  onSelect: (id: number) => void
}) {
  const { data: questions = [] } = useCategoryQuestions(category.id)
  const usedSet = new Set(usedQuestions)
  const remaining = questions.filter((q) => !usedSet.has(q.id)).length

  return (
    <div>
      <h3 className={cn(
        'text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 px-1',
        remaining === 0 && 'line-through opacity-50'
      )}>
        {category.name}
        <span className="ml-1.5 font-normal normal-case">
          {remaining}/{questions.length}
        </span>
      </h3>
      <div className="space-y-1.5">
        {questions.map((q, i) => (
          <QuestionCard
            key={q.id}
            question={q}
            index={i}
            isActive={activeQuestionId === q.id}
            isUsed={usedSet.has(q.id)}
            onClick={() => onSelect(q.id)}
          />
        ))}
      </div>
    </div>
  )
}

interface RunnerQuestionListProps {
  categories: Category[]
  selectedCategoryId: number | null
  activeQuestionId: number | null
  usedQuestions: number[]
  onSelect: (id: number) => void
}

export function RunnerQuestionList({
  categories,
  selectedCategoryId,
  activeQuestionId,
  usedQuestions,
  onSelect
}: RunnerQuestionListProps) {
  const { t } = useTranslation()

  if (selectedCategoryId === null) {
    return <div className="flex-1" />
  }

  const visibleCategories = categories.filter((c) => c.id === selectedCategoryId)

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-4">
      {visibleCategories.map((cat) => (
        <CategorySection
          key={cat.id}
          category={cat}
          activeQuestionId={activeQuestionId}
          usedQuestions={usedQuestions}
          onSelect={onSelect}
        />
      ))}
      {visibleCategories.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">{t('builder.noCategories')}</p>
      )}
    </div>
  )
}
