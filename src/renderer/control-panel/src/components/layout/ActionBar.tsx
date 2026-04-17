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
  Image
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
  const { phase, currentCategoryId, gameScreenDarkMode } = useGameState()

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
        : null

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
          {backLabel && (
            <>
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="mr-1 h-4 w-4" /> {backLabel}
              </Button>
              <Separator orientation="vertical" className="mx-1 h-8" />
            </>
          )}
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
