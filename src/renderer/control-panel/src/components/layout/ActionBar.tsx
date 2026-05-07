import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FilePlus,
  Upload,
  Save,
  Play,
  LayoutGrid,
  Trophy,
  Maximize,
  ChevronLeft,
  Sun,
  Moon,
  Image,
  Eye
} from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Separator } from '@renderer/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@renderer/components/ui/dropdown-menu'
import { useGameState } from '@renderer/hooks/useGameState'
import { GamePhase } from '@shared/types/state'

interface ActionBarProps {
  activeTab: string
}

const ActionBar: React.FC<ActionBarProps> = ({ activeTab }) => {
  const { t } = useTranslation()
  const {
    phase,
    currentCategoryId,
    gameScreenDarkMode,
    selectedCategoryId,
    selectedQuestionId,
    categories,
    categoryQuestions
  } = useGameState()

  const handleBack = () => {
    if (phase === GamePhase.Question && currentCategoryId !== null) {
      window.api.showQuestions(currentCategoryId)
    } else if (phase === GamePhase.Questions) {
      window.api.showCategories()
    }
  }

  const backLabel =
    phase === GamePhase.Question
      ? t('actions.backQuestions')
      : phase === GamePhase.Questions
        ? t('actions.backCategories')
        : t('actions.back')
  const backDisabled = phase !== GamePhase.Question && phase !== GamePhase.Questions

  // ── Pending reveal (preview before showing on game screen) ──
  let pendingRevealLabel: string | null = null
  let pendingRevealAction: (() => void) | null = null
  let pendingClearAction: (() => void) | null = null

  if (phase === GamePhase.Categories && selectedCategoryId !== null) {
    const cat = categories.find((c) => c.id === selectedCategoryId)
    if (cat) {
      pendingRevealLabel = cat.name
      pendingRevealAction = () => window.api.showQuestions(selectedCategoryId)
      pendingClearAction = () => window.api.selectCategory(null)
    }
  } else if (phase === GamePhase.Questions && selectedQuestionId !== null) {
    const idx = categoryQuestions.findIndex((q) => q.id === selectedQuestionId)
    if (idx >= 0) {
      pendingRevealLabel = `#${idx + 1}`
      pendingRevealAction = () => window.api.showQuestion(selectedQuestionId)
      pendingClearAction = () => window.api.selectQuestion(null)
    }
  }

  useEffect(() => {
    if (activeTab === 'builder') return
    const handler = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === 'Enter' && pendingRevealAction) {
        e.preventDefault()
        pendingRevealAction()
      } else if (e.key === 'Escape' && pendingClearAction) {
        e.preventDefault()
        pendingClearAction()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [activeTab, pendingRevealAction, pendingClearAction])

  return (
    <div className="flex gap-1 mb-2 pb-2 border-b border-border">
      {activeTab === 'builder' ? (
        <>
          <Button
            onClick={async () => {
              if (confirm(t('confirm.newQuiz'))) {
                await window.api.fileNew()
              }
            }}
          >
            <FilePlus className="mr-1 h-4 w-4" /> {t('actions.newQuiz')}
          </Button>
          <Button
            variant="secondary"
            onClick={async () => {
              if (confirm(t('confirm.loadQuiz'))) {
                await window.api.fileOpen()
              }
            }}
          >
            <Upload className="mr-1 h-4 w-4" /> {t('actions.loadQuiz')}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="text-green-600 border-green-600/50 hover:bg-green-600/10"
              >
                <Save className="mr-1 h-4 w-4" /> {t('actions.saveQuiz')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => window.api.fileSave()}>
                <Save className="mr-2 h-4 w-4" /> {t('actions.save')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.api.fileSaveAs()}>
                <Save className="mr-2 h-4 w-4" /> {t('actions.saveAs')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      ) : (
        <>
          <Button variant="destructive" onClick={() => window.api.openGameScreen()}>
            <Play className="mr-1 h-4 w-4" />
            <strong>{t('actions.runQuiz')}</strong>
          </Button>
          <Separator orientation="vertical" className="mx-1 h-8" />
          <Button
            variant="outline"
            className="text-green-600 border-green-600/50 hover:bg-green-600/10 disabled:text-muted-foreground disabled:border-border"
            onClick={pendingRevealAction ?? undefined}
            disabled={!pendingRevealAction}
          >
            <Eye className="mr-1 h-4 w-4" />
            <strong>
              {pendingRevealLabel
                ? t('actions.reveal', { name: pendingRevealLabel })
                : t('actions.revealNone')}
            </strong>
          </Button>
          <Separator orientation="vertical" className="mx-1 h-8" />
          <Button variant="outline" onClick={handleBack} disabled={backDisabled}>
            <ChevronLeft className="mr-1 h-4 w-4" /> {backLabel}
          </Button>
          <Separator orientation="vertical" className="mx-1 h-8" />
          <Button variant="outline" onClick={() => window.api.showSplash()}>
            <Image className="mr-1 h-4 w-4" /> {t('actions.splash')}
          </Button>
          <Button variant="outline" onClick={() => window.api.showCategories()}>
            <LayoutGrid className="mr-1 h-4 w-4" /> {t('actions.categories')}
          </Button>
          <Button variant="outline" onClick={() => window.api.showRanking()}>
            <Trophy className="mr-1 h-4 w-4" /> {t('actions.ranking')}
          </Button>
          <Separator orientation="vertical" className="mx-1 h-8" />
          <Button variant="outline" onClick={() => window.api.toggleGameFullscreen()}>
            <Maximize className="mr-1 h-4 w-4" /> {t('actions.fullscreen')}
          </Button>
          <Button variant="outline" onClick={() => window.api.toggleGameDarkMode()}>
            {gameScreenDarkMode ? (
              <Sun className="mr-1 h-4 w-4" />
            ) : (
              <Moon className="mr-1 h-4 w-4" />
            )}
            {gameScreenDarkMode ? t('actions.light') : t('actions.dark')}
          </Button>
        </>
      )}
    </div>
  )
}

export default ActionBar
