import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FilePlus,
  Upload,
  Save,
  Play,
  LayoutGrid,
  Trophy,
  Maximize,
  Sun,
  Moon,
  Image,
  Check
} from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Separator } from '@renderer/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@renderer/components/ui/dropdown-menu'
import { ConfirmDialog } from '@renderer/components/ui/confirm-dialog'
import { useGameState } from '@renderer/hooks/useGameState'
import { OpenProgressModal } from './OpenProgressModal'
import { cn } from '@renderer/lib/utils'

type PendingAction = 'new' | 'load' | null

interface ActionBarProps {
  activeTab: string
}

const ActionBar: React.FC<ActionBarProps> = ({ activeTab }) => {
  const { t } = useTranslation()
  const [progressOpen, setProgressOpen] = useState(false)
  const [pending, setPending] = useState<PendingAction>(null)
  const [savedFlash, setSavedFlash] = useState(false)
  const flashTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const { gameScreenDarkMode, quizDirty, quizFilePath } = useGameState()

  const handleSave = async () => {
    await window.api.fileSave()
    triggerSavedFlash()
  }

  const handleSaveAs = async () => {
    const result = await window.api.fileSaveAs()
    if (result) triggerSavedFlash()
  }

  const triggerSavedFlash = () => {
    setSavedFlash(true)
    clearTimeout(flashTimerRef.current)
    flashTimerRef.current = setTimeout(() => setSavedFlash(false), 2000)
  }

  useEffect(() => () => clearTimeout(flashTimerRef.current), [])

  const handleConfirm = async () => {
    if (pending === 'new') {
      await window.api.fileNew()
    } else if (pending === 'load') {
      setProgressOpen(true)
      const result = await window.api.fileOpen()
      if (result === null) setProgressOpen(false)
    }
    setPending(null)
  }

  return (
    <>
    <div className="flex gap-1 mb-2 pb-2 border-b border-border">
      {activeTab === 'builder' ? (
        <>
          <Button onClick={() => setPending('new')}>
            <FilePlus className="mr-1 h-4 w-4" /> {t('actions.newQuiz')}
          </Button>
          <Button variant="secondary" onClick={() => setPending('load')}>
            <Upload className="mr-1 h-4 w-4" /> {t('actions.loadQuiz')}
          </Button>

          <div className="flex items-center gap-1.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'transition-colors',
                    quizDirty
                      ? 'text-amber-600 border-amber-500/60 hover:bg-amber-500/10'
                      : 'text-green-600 border-green-600/50 hover:bg-green-600/10'
                  )}
                  disabled={!quizFilePath}
                >
                  <Save className="mr-1 h-4 w-4" />
                  {t('actions.saveQuiz')}
                  {quizDirty && (
                    <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleSave}>
                  <Save className="mr-2 h-4 w-4" /> {t('actions.save')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSaveAs}>
                  <Save className="mr-2 h-4 w-4" /> {t('actions.saveAs')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <span
              className={cn(
                'flex items-center gap-1 text-xs text-green-600 transition-opacity duration-500',
                savedFlash ? 'opacity-100' : 'opacity-0'
              )}
            >
              <Check className="h-3.5 w-3.5" />
              {t('actions.saved')}
            </span>
          </div>
        </>
      ) : (
        <>
          <Button variant="destructive" onClick={() => window.api.openGameScreen()}>
            <Play className="mr-1 h-4 w-4" />
            <strong>{t('actions.runQuiz')}</strong>
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

    <ConfirmDialog
      open={pending !== null}
      title={pending === 'new' ? t('actions.newQuiz') : t('actions.loadQuiz')}
      description={pending === 'new' ? t('confirm.newQuiz') : t('confirm.loadQuiz')}
      confirmLabel={pending === 'new' ? t('actions.newQuiz') : t('actions.loadQuiz')}
      onConfirm={handleConfirm}
      onCancel={() => setPending(null)}
    />
    <OpenProgressModal open={progressOpen} onClose={() => setProgressOpen(false)} />
    </>
  )
}

export default ActionBar
