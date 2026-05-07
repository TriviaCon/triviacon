import { useTranslation } from 'react-i18next'
import type { Category, Question } from '@shared/types/quiz'
import { useSquareGrid } from '../hooks/useSquareGrid'

const QuestionsScreen = ({
  categories,
  currentCategoryId,
  questions,
  usedQuestions,
  selectedQuestionId
}: {
  categories: Category[]
  currentCategoryId: number | null
  questions: Question[]
  usedQuestions: number[]
  selectedQuestionId: number | null
}) => {
  const { t } = useTranslation()
  const category = categories.find((c) => c.id === currentCategoryId)
  const { containerRef, cols, tileSize } = useSquareGrid(questions.length)

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <div className="text-center py-4 shrink-0">
        <h1 className="text-5xl font-bold">{category?.name ?? t('gameScreen.questions')}</h1>
        <hr className="border-border mt-3 mx-6" />
      </div>
      <div
        ref={containerRef}
        className="flex-1 min-h-0 overflow-hidden flex items-center justify-center px-6 pb-6"
      >
        {questions.length === 0 ? (
          <div className="text-center text-muted-foreground">
            {t('gameScreen.noQuestions')}
          </div>
        ) : (
          <div
            className="grid justify-center content-center"
            style={{
              gridTemplateColumns: `repeat(${cols}, ${tileSize}px)`,
              gap: '12px'
            }}
          >
            {questions.map((q, index) => {
              const used = usedQuestions.includes(q.id)
              const selected = q.id === selectedQuestionId
              return (
                <div
                  key={q.id}
                  className={`rounded-lg border font-bold flex items-center justify-center transition-all ${
                    used
                      ? 'border-border/30 bg-muted/20 text-muted-foreground/30 line-through opacity-40'
                      : selected
                        ? 'border-primary bg-primary/15 text-card-foreground shadow-md ring-2 ring-primary/40'
                        : 'border-primary/50 bg-card text-card-foreground shadow-sm'
                  }`}
                  style={{
                    width: tileSize,
                    height: tileSize,
                    fontSize: tileSize * 0.35
                  }}
                >
                  {index + 1}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default QuestionsScreen
