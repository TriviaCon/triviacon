import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutGrid } from 'lucide-react'
import { cn } from '@renderer/lib/utils'
import TeamTable from './TeamTable'
import { RankingModule } from './RankingModule'
import { SplashRunnerPanel } from './SplashRunnerPanel'
import QuestionPreview from './QuestionPreview'
import { RunnerQuestionList } from './RunnerQuestionList'
import { useGameState } from '@renderer/hooks/useGameState'
import { useQuestion } from '@renderer/hooks/useQuestion'
import { useAnswerOptions } from '@renderer/hooks/useAnswerOptions'
import { QueryLoading, QueryError } from '@renderer/components/ui/query-state'
import { usePairQueryState } from '@renderer/hooks/usePairQueryState'
import { GamePhase } from '@shared/types/state'
import { canRevealQuestions, resolveQuestionClick } from './runnerActions'

// ── Category sidebar (runner two-step: first click selects, second reveals) ──

function RunnerCategorySidebar({
  categories,
  selectedCategoryId,
  currentCategoryId,
  onClick
}: {
  categories: { id: number; name: string; questionCount: number; sortOrder: number }[]
  selectedCategoryId: number | null
  currentCategoryId: number | null
  onClick: (id: number) => void
}) {
  const { t } = useTranslation()
  const focusedId = selectedCategoryId ?? currentCategoryId

  return (
    <aside className="w-64 shrink-0 border-r border-border flex flex-col overflow-hidden">
      <div className="px-3 py-1.5 border-b border-border shrink-0 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t('actions.categories')}
        </span>
        <button
          type="button"
          title={t('actions.categories')}
          className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-primary border border-primary/40 rounded px-2 py-0.5 hover:bg-primary/10 transition-colors"
          onClick={() => window.api.showCategories()}
        >
          <LayoutGrid className="h-3 w-3" />
          {t('runner.showCategories')}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
        {categories.map((cat) => {
          const isFocused = focusedId === cat.id
          const isLive = currentCategoryId === cat.id
          return (
            <div
              key={cat.id}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-2 text-sm cursor-pointer transition-colors select-none',
                isFocused
                  ? 'ring-2 ring-primary bg-primary/10 text-foreground'
                  : 'hover:bg-accent'
              )}
              onClick={() => onClick(cat.id)}
            >
              <span className="flex-1 truncate">{cat.name}</span>
              {isLive && <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />}
              <span className="text-xs shrink-0 tabular-nums text-muted-foreground">
                {cat.questionCount}
              </span>
            </div>
          )
        })}
      </div>
    </aside>
  )
}

// ── Question preview column ─────────────────────────────────────

const PreviewColumn = ({
  id,
  phase,
  selectedQuestionId
}: {
  id: number
  phase: GamePhase
  selectedQuestionId: number | null
}) => {
  const { t } = useTranslation()
  const { revealedAnswers, usedQuestions, activeQuestion } = useGameState()
  const question = useQuestion(id)
  const answerOptions = useAnswerOptions(id)

  const guard = usePairQueryState(question, answerOptions)
  if (!guard.ok) {
    if (guard.loading) return <QueryLoading label={t('builder.loadingQuestion')} />
    if (guard.errorMessage) return <QueryError message={guard.errorMessage} />
    return null
  }

  const markedAnswerId =
    activeQuestion?.question.id === id ? (activeQuestion.markedAnswerId ?? null) : null
  const revealedOptionIds =
    activeQuestion?.question.id === id ? (activeQuestion.revealedOptionIds ?? []) : []

  const isActiveOnScreen = activeQuestion?.question.id === id
  const isPending = selectedQuestionId === id && !isActiveOnScreen
  const canShow = canRevealQuestions(phase) && isPending

  return (
    <QuestionPreview
      question={question.data!}
      answerOptions={answerOptions.data!}
      answerRevealed={revealedAnswers.includes(id)}
      onRevealAnswer={() => window.api.toggleAnswer(id)}
      markedAnswerId={markedAnswerId}
      onMarkAnswer={(answerId) => window.api.markAnswer(answerId)}
      revealedOptionIds={revealedOptionIds}
      onToggleListOption={(optId) => window.api.toggleListOption(optId)}
      used={usedQuestions.includes(id)}
      onUse={() => window.api.markUsed(id)}
      onShowOnScreen={canShow ? () => window.api.showQuestion(id) : null}
    />
  )
}

// ── Runner view ─────────────────────────────────────────────────

export const RunnerView = () => {
  const {
    categories,
    usedQuestions,
    selectedCategoryId,
    selectedQuestionId,
    activeQuestion,
    currentCategoryId,
    phase,
  } = useGameState()

  const [stickyPreviewId, setStickyPreviewId] = useState<number | null>(null)

  useEffect(() => {
    const currentId = selectedQuestionId ?? activeQuestion?.question.id ?? null
    if (currentId !== null) setStickyPreviewId(currentId)
  }, [selectedQuestionId, activeQuestion?.question.id])

  useEffect(() => {
    if (
      phase === GamePhase.Categories ||
      phase === GamePhase.Splash ||
      phase === GamePhase.Ranking ||
      phase === GamePhase.Idle
    ) {
      setStickyPreviewId(null)
    }
  }, [phase])

  // Keyboard: Enter reveals the focused selection (question wins over category),
  // Escape clears the deepest selection.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === 'Enter') {
        if (selectedQuestionId !== null && canRevealQuestions(phase)) {
          e.preventDefault()
          window.api.showQuestion(selectedQuestionId)
        } else if (selectedCategoryId !== null && selectedCategoryId !== currentCategoryId) {
          e.preventDefault()
          window.api.showQuestions(selectedCategoryId)
        }
      } else if (e.key === 'Escape') {
        if (selectedQuestionId !== null) {
          e.preventDefault()
          window.api.selectQuestion(null)
        } else if (selectedCategoryId !== null) {
          e.preventDefault()
          window.api.selectCategory(null)
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedQuestionId, selectedCategoryId, currentCategoryId, phase])

  if (!categories.length) return null

  const handleCategoryClick = (id: number) => {
    if (selectedCategoryId === id) {
      window.api.showQuestions(id)
    } else {
      window.api.selectCategory(id)
    }
  }

  const handleQuestionClick = (id: number) => {
    const action = resolveQuestionClick(id, selectedQuestionId, phase)
    if (action.type === 'show') {
      window.api.showQuestion(action.id)
    } else {
      window.api.selectQuestion(action.id)
    }
  }

  // List follows the preview selection, falling back to the live category once
  // a reveal clears the selection — so it never snaps back to "all categories".
  const listCategoryId = selectedCategoryId ?? currentCategoryId

  if (phase === GamePhase.Ranking) {
    return <RankingModule />
  }

  return (
    <div className="w-full h-full flex flex-col gap-0 overflow-hidden">
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Teams */}
        <div className="w-80 shrink-0 border-r border-border overflow-y-auto p-3">
          <TeamTable />
        </div>

        {/* Category sidebar — click previews, inline button / Enter reveals */}
        <RunnerCategorySidebar
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          currentCategoryId={currentCategoryId}
          onClick={handleCategoryClick}
        />

        {/* Question list — flexes to fill remaining space. During Splash the list
            is dead space, so the splash control panel takes over here instead. */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0 border-r border-border overflow-hidden">
          {phase === GamePhase.Splash ? (
            <SplashRunnerPanel />
          ) : (
            <RunnerQuestionList
              categories={categories}
              selectedCategoryId={listCategoryId}
              activeQuestionId={stickyPreviewId}
              usedQuestions={usedQuestions}
              onSelect={handleQuestionClick}
            />
          )}
        </div>

        {/* Question preview */}
        {stickyPreviewId !== null && (
          <div className="w-[420px] shrink-0 overflow-y-auto p-4 border-l border-border">
            <PreviewColumn
              id={stickyPreviewId}
              phase={phase}
              selectedQuestionId={selectedQuestionId}
            />
          </div>
        )}
      </div>
    </div>
  )
}
