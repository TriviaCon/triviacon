import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  CheckSquare,
  FileAudio,
  FileVideo,
  GripVertical,
  Image,
  Plus,
  Square,
  X
} from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { NativeSelect } from '@renderer/components/ui/native-select'
import { cn } from '@renderer/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import { useAddQuestionMutation } from '@renderer/hooks/useAddQuestionMutation'
import useCategoryQuestions from '@renderer/hooks/useCategoryQuestions'
import keys from '@renderer/utils/keys'
import type { Category, Question, QuestionType } from '@shared/types/quiz'
import { detectMediaType } from '@shared/media'

// ── Helpers ─────────────────────────────────────────────────────

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

function MediaIcon({ media, audioOnly }: { media: string | null; audioOnly?: boolean }) {
  const type = detectMediaType(media)
  if (type === 'video') return audioOnly
    ? <FileAudio className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
    : <FileVideo className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
  if (type === 'audio') return <FileAudio className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
  if (type === 'image') return <Image className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
  return null
}

// ── Bulk action bar ─────────────────────────────────────────────

function BulkActionBar({
  count,
  categories,
  onMove,
  onClear
}: {
  count: number
  categories: Category[]
  onMove: (targetId: number) => void
  onClear: () => void
}) {
  const { t } = useTranslation()
  const [targetId, setTargetId] = useState('')

  return (
    <div className="flex items-center gap-2 border-b border-border bg-primary/5 px-4 py-2 shrink-0">
      <span className="text-sm font-medium">{count} {t('builder.selected')}</span>
      <NativeSelect value={targetId} onChange={(e) => setTargetId(e.target.value)} className="w-48 h-7 text-xs">
        <option value="">{t('builder.moveToCategory')}</option>
        {categories.map((c) => (
          <option key={c.id} value={String(c.id)}>{c.name}</option>
        ))}
      </NativeSelect>
      <Button size="sm" variant="secondary" onClick={() => { if (targetId) { onMove(parseInt(targetId, 10)); setTargetId('') } }} disabled={!targetId}>
        {t('builder.move')}
      </Button>
      <Button size="sm" variant="ghost" onClick={onClear}>
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

// ── Sortable question card ──────────────────────────────────────

function QuestionCard({
  question,
  index,
  isActive,
  isSelected,
  isSortable,
  onToggleSelect,
  onClick
}: {
  question: Question
  index: number
  isActive: boolean
  isSelected: boolean
  isSortable: boolean
  onToggleSelect: () => void
  onClick: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } = useSortable({
    id: `question:${question.id}`,
    disabled: !isSortable
  })

  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {isOver && (
        <div className="absolute -top-0.5 left-2 right-2 h-0.5 bg-primary rounded-full z-10" />
      )}
      <div
        className={cn(
          'group flex items-start gap-2 rounded-md border p-3 text-sm cursor-pointer transition-colors select-none',
          isActive
            ? 'border-primary bg-primary/5'
            : 'border-border bg-card hover:border-primary/40 hover:bg-accent/40',
          isSelected && !isActive && 'border-primary/60 bg-primary/5',
          isDragging && 'opacity-30'
        )}
        onClick={onClick}
      >
        {isSortable && (
          <span
            {...attributes}
            {...listeners}
            className="mt-0.5 shrink-0 cursor-grab text-muted-foreground/30 hover:text-muted-foreground/60"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4" />
          </span>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); onToggleSelect() }}
          className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary"
        >
          {isSelected
            ? <CheckSquare className="h-4 w-4 text-primary" />
            : <Square className="h-4 w-4 opacity-0 group-hover:opacity-100" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[11px] font-semibold tabular-nums text-muted-foreground shrink-0">
              #{index + 1}
            </span>
            <span className={cn('inline-flex items-center rounded-full border px-1.5 py-0 text-[10px] font-medium shrink-0', TYPE_CLASSES[question.type])}>
              {TYPE_LABELS[question.type]}
            </span>
            <MediaIcon media={question.media} audioOnly={question.audioOnly} />
            <div
              className="text-sm leading-snug line-clamp-2 [&_p]:m-0 [&_strong]:font-semibold [&_em]:italic [&_u]:underline min-w-0"
              dangerouslySetInnerHTML={{ __html: question.text || '&nbsp;' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Category question list (single category) ────────────────────

function CategoryQuestionList({
  categoryId,
  activeQuestionId,
  selectedIds,
  onToggleSelect,
  onSelectQuestion
}: {
  categoryId: number
  activeQuestionId: number | null
  selectedIds: Set<number>
  onToggleSelect: (id: number) => void
  onSelectQuestion: (id: number) => void
}) {
  const { data: questions = [] } = useCategoryQuestions(categoryId)

  const sortableIds = questions.map((q) => `question:${q.id}`)

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-2">
      <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
        {questions.map((q, i) => (
          <QuestionCard
            key={q.id}
            question={q}
            index={i}
            isActive={activeQuestionId === q.id}
            isSelected={selectedIds.has(q.id)}
            isSortable={true}
            onToggleSelect={() => onToggleSelect(q.id)}
            onClick={() => onSelectQuestion(q.id)}
          />
        ))}
      </SortableContext>
      {questions.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">No questions yet</p>
      )}
    </div>
  )
}

// ── All-questions view ──────────────────────────────────────────

function AllQuestionsList({
  categories,
  activeQuestionId,
  selectedIds,
  onToggleSelect,
  onSelectQuestion
}: {
  categories: Category[]
  activeQuestionId: number | null
  selectedIds: Set<number>
  onToggleSelect: (id: number) => void
  onSelectQuestion: (id: number) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-4">
      {categories.map((cat) => (
        <AllCategorySection
          key={cat.id}
          category={cat}
          activeQuestionId={activeQuestionId}
          selectedIds={selectedIds}
          onToggleSelect={onToggleSelect}
          onSelectQuestion={onSelectQuestion}
        />
      ))}
      {categories.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">{t('builder.noCategories')}</p>
      )}
    </div>
  )
}

function AllCategorySection({
  category,
  activeQuestionId,
  selectedIds,
  onToggleSelect,
  onSelectQuestion
}: {
  category: Category
  activeQuestionId: number | null
  selectedIds: Set<number>
  onToggleSelect: (id: number) => void
  onSelectQuestion: (id: number) => void
}) {
  const { data: questions = [] } = useCategoryQuestions(category.id)
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 px-1">
        {category.name} <span className="font-normal">({questions.length})</span>
      </h3>
      <div className="space-y-2">
        {questions.map((q, i) => (
          <QuestionCard
            key={q.id}
            question={q}
            index={i}
            isActive={activeQuestionId === q.id}
            isSelected={selectedIds.has(q.id)}
            isSortable={false}
            onToggleSelect={() => onToggleSelect(q.id)}
            onClick={() => onSelectQuestion(q.id)}
          />
        ))}
      </div>
    </div>
  )
}

// ── Main export ─────────────────────────────────────────────────

interface QuestionListProps {
  categories: Category[]
  selectedCategoryId: number | null
  activeQuestionId: number | null
  onSelectQuestion: (id: number | null) => void
}

export function QuestionList({
  categories,
  selectedCategoryId,
  activeQuestionId,
  onSelectQuestion
}: QuestionListProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const addQuestion = useAddQuestionMutation(selectedCategoryId ?? 0)

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId)
  const heading = selectedCategory
    ? selectedCategory.name
    : t('builder.allQuestions')

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleBulkMove(targetCategoryId: number) {
    await window.api.questionsBulkMove([...selectedIds], targetCategoryId)
    setSelectedIds(new Set())
    // Invalidate all affected category question lists
    categories.forEach((c) => queryClient.invalidateQueries({ queryKey: keys.questions(c.id) }))
    queryClient.invalidateQueries({ queryKey: keys.categories() })
    if (activeQuestionId && selectedIds.has(activeQuestionId)) {
      onSelectQuestion(null)
    }
  }

  const otherCategories = categories.filter((c) => c.id !== selectedCategoryId)

  return (
    <div className="flex-1 flex flex-col min-h-0 border-r border-border">
      {selectedIds.size > 0 && (
        <BulkActionBar
          count={selectedIds.size}
          categories={otherCategories}
          onMove={handleBulkMove}
          onClear={() => setSelectedIds(new Set())}
        />
      )}

      <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
        <h2 className="font-semibold text-sm">
          {heading}
          {selectedCategory && (
            <span className="ml-2 text-muted-foreground font-normal text-xs">
              {selectedCategory.questionCount} {t('builder.questions')}
            </span>
          )}
        </h2>
        {selectedCategoryId !== null ? (
          <Button size="sm" onClick={() => addQuestion.mutate()}>
            <Plus className="mr-1 h-3.5 w-3.5" /> {t('builder.addQuestion')}
          </Button>
        ) : (
          <span className="text-[10px] text-muted-foreground">{t('builder.selectCategoryToReorder')}</span>
        )}
      </div>

      {selectedCategoryId !== null ? (
        <CategoryQuestionList
          categoryId={selectedCategoryId}
          activeQuestionId={activeQuestionId}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onSelectQuestion={(id) => {
            onSelectQuestion(activeQuestionId === id ? null : id)
            setSelectedIds(new Set())
          }}
        />
      ) : (
        <AllQuestionsList
          categories={categories}
          activeQuestionId={activeQuestionId}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onSelectQuestion={(id) => {
            onSelectQuestion(activeQuestionId === id ? null : id)
            setSelectedIds(new Set())
          }}
        />
      )}
    </div>
  )
}
