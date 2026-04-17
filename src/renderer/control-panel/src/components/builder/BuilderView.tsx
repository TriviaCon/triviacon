import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import QuestionView from './QuestionView'
import { QuizMeta } from './QuizMeta'
import QuizTree from './QuizTree'
import { useGameState } from '@renderer/hooks/useGameState'

type View = { view: 'question'; id: number } | { view: 'category'; id: number } | null

export const BuilderView = () => {
  const { t } = useTranslation()
  const [view, setView] = useState<View>(null)
  const { categories } = useGameState()

  if (!categories.length) {
    return <span className="text-muted-foreground">{t('builder.noQuizLoaded')}</span>
  }

  return (
    <div className="w-full h-full">
      <div className="flex gap-4 flex-grow">
        <div className="flex flex-col h-full w-1/3 min-w-[280px]">
          <QuizMeta />
          <QuizTree
            categories={categories}
            setSelectedCategory={(id) => (id ? setView({ view: 'category', id }) : setView(null))}
            setSelectedQuestion={(id) => (id ? setView({ view: 'question', id }) : setView(null))}
            editable={true}
          />
        </div>
        <div className="flex-1 border-l border-border pl-4">
          {view?.view === 'question' && <QuestionView id={view.id} />}
        </div>
      </div>
    </div>
  )
}
