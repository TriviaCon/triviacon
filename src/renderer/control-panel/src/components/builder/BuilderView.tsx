import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useQueryClient } from '@tanstack/react-query'
import { CategorySidebar } from './CategorySidebar'
import { QuestionList } from './QuestionList'
import QuestionEditor from './QuestionEditor'
import { useGameState } from '@renderer/hooks/useGameState'
import keys from '@renderer/utils/keys'

export const BuilderView = () => {
  const { t } = useTranslation()
  const { categories, quizFilePath } = useGameState()
  const queryClient = useQueryClient()

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [activeQuestionId, setActiveQuestionId] = useState<number | null>(null)

  function selectCategory(id: number | null) {
    setSelectedCategoryId(id)
    setActiveQuestionId(null)
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  if (!quizFilePath) {
    return <span className="text-muted-foreground">{t('builder.noQuizLoaded')}</span>
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeStr = String(active.id)
    const overStr = String(over.id)

    if (activeStr.startsWith('category:') && overStr.startsWith('category:')) {
      const activeId = parseInt(activeStr.replace('category:', ''), 10)
      const overId = parseInt(overStr.replace('category:', ''), 10)
      const oldIndex = categories.findIndex((c) => c.id === activeId)
      const newIndex = categories.findIndex((c) => c.id === overId)
      if (oldIndex === -1 || newIndex === -1) return
      const reordered = arrayMove(categories, oldIndex, newIndex)
      await window.api.categoriesReorder(reordered.map((c) => c.id))
      queryClient.invalidateQueries({ queryKey: keys.categories() })
    }

    if (activeStr.startsWith('question:') && overStr.startsWith('question:') && selectedCategoryId !== null) {
      const activeQId = parseInt(activeStr.replace('question:', ''), 10)
      const overQId = parseInt(overStr.replace('question:', ''), 10)
      const questions = queryClient.getQueryData<{ id: number }[]>(keys.questions(selectedCategoryId)) ?? []
      const oldIndex = questions.findIndex((q) => q.id === activeQId)
      const newIndex = questions.findIndex((q) => q.id === overQId)
      if (oldIndex === -1 || newIndex === -1) return
      const reordered = arrayMove(questions, oldIndex, newIndex)
      await window.api.questionsReorder(reordered.map((q) => q.id))
      queryClient.invalidateQueries({ queryKey: keys.questions(selectedCategoryId) })
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="w-full h-full flex overflow-hidden">
        <CategorySidebar
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelect={selectCategory}
          onDeleted={() => queryClient.invalidateQueries({ queryKey: keys.categories() })}
        />

        <QuestionList
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          activeQuestionId={activeQuestionId}
          onSelectQuestion={setActiveQuestionId}
        />

        {activeQuestionId !== null && (
          <div className="flex-1 min-w-0 border-l border-border overflow-y-auto p-4">
            <QuestionEditor
              id={activeQuestionId}
              onDelete={() => setActiveQuestionId(null)}
            />
          </div>
        )}
      </div>

    </DndContext>
  )
}
