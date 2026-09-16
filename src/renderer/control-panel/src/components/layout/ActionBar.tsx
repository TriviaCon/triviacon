import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FilePlus,
  Upload,
  Save,
  ChevronDown,
  Play,
  Monitor,
  Trophy,
  LayoutGrid,
  Maximize,
  Moon,
  Image,
  Check,
  Info,
  Loader2
} from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Toggle } from '@renderer/components/ui/toggle'
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
import { QuizMetaModal } from '../builder/QuizMetaModal'
import { cn } from '@renderer/lib/utils'

type PendingAction = 'new' | 'load' | null

/** A run of related actions. Groups are told apart by a rule, not by spacing. */
const Group: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center gap-1">{children}</div>
)

const GroupRule = () => <Separator orientation="vertical" className="mx-1 h-8" />

interface ActionBarProps {
  activeTab: string
}

const ActionBar: React.FC<ActionBarProps> = ({ activeTab }) => {
  const { t } = useTranslation()
  const [progressOpen, setProgressOpen] = useState(false)
  const [pending, setPending] = useState<PendingAction>(null)
  const [savedFlash, setSavedFlash] = useState(false)
  const [saving, setSaving] = useState<{ files: number; totalFiles: number } | null>(null)
  const [metaOpen, setMetaOpen] = useState(false)
  const flashTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const { gameScreenDarkMode, gameScreenFullscreen, quizDirty, quizFilePath, gameStarted } =
    useGameState()

  const triggerSavedFlash = useCallback(() => {
    setSavedFlash(true)
    clearTimeout(flashTimerRef.current)
    flashTimerRef.current = setTimeout(() => setSavedFlash(false), 2000)
  }, [])

  const handleSave = () => window.api.fileSave()
  const handleSaveAs = () => window.api.fileSaveAs()

  // Save progress is driven by main-process events so the indicator reflects
  // real per-file write progress, not just when the invoke() resolves.
  useEffect(() => {
    const unsub = window.api.onSaveProgress((event) => {
      if (event.phase === 'saving') {
        setSaving({ files: event.files, totalFiles: event.totalFiles })
        return
      }
      setSaving(null)
      if (event.phase === 'done' || event.phase === 'clean') triggerSavedFlash()
    })
    return unsub
  }, [triggerSavedFlash])

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
    <div className="flex gap-1 pt-2 px-0.5">
      {activeTab === 'builder' ? (
        <>
          {/* Save is the action of the evening, so it carries the weight; New is
              the rare, destructive one and stays quiet behind its confirm. */}
          {/* Split control: the halves keep one seam of their own so hovering
              either can't dissolve the join. */}
          <Group>
            <div className="flex">
              <Button
                className="rounded-r-none bg-success text-success-foreground hover:bg-success/90"
                disabled={!quizFilePath}
                onClick={handleSave}
              >
                <Save />
                {t('actions.saveQuiz')}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="icon"
                    className="rounded-l-none border-l border-success-foreground/25 bg-success text-success-foreground hover:bg-success/90"
                    disabled={!quizFilePath}
                    title={t('actions.saveAs')}
                    aria-label={t('actions.saveAs')}
                  >
                    <ChevronDown />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleSaveAs}>
                    <Save /> {t('actions.saveAs')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </Group>

          <GroupRule />

          <Group>
            <Button variant="outline" onClick={() => setPending('new')}>
              <FilePlus /> {t('actions.newQuiz')}
            </Button>
            <Button variant="outline" onClick={() => setPending('load')}>
              <Upload /> {t('actions.loadQuiz')}
            </Button>
          </Group>

          <GroupRule />

          <Group>
            <Button variant="ghost" onClick={() => setMetaOpen(true)}>
              <Info /> {t('builder.quizInfo')}
            </Button>
          </Group>

          {/* File state — a status, not an action, so it sits out of the button
              flow at the far end and wears no button chrome. */}
          {quizFilePath && (
            <span
              className={cn(
                'ml-auto self-center inline-flex items-center gap-1.5 pr-1 text-xs font-medium transition-opacity duration-500',
                saving
                  ? 'text-muted-foreground opacity-100'
                  : savedFlash
                    ? 'text-success opacity-100'
                    : quizDirty
                      ? 'text-warning opacity-100'
                      : 'opacity-0 pointer-events-none'
              )}
            >
              {saving ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />{' '}
                  {t('actions.saving')} <span className="tabular-nums">{saving.files}/{saving.totalFiles}</span>
                </>
              ) : savedFlash ? (
                <><Check className="h-3 w-3" /> {t('actions.saved')}</>
              ) : (
                <><span className="h-1.5 w-1.5 rounded-full bg-warning" /> {t('actions.unsaved')}</>
              )}
            </span>
          )}
        </>
      ) : (
        <>
          <Group>
            <Button variant="outline" onClick={() => window.api.openGameScreen()}>
              <Monitor /> {t('actions.openScreen')}
            </Button>
            {gameStarted ? (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-success/50 bg-success/10 px-3 text-sm font-semibold text-success">
                <span className="h-2 w-2 rounded-full bg-success" /> {t('runner.live')}
              </span>
            ) : (
              <Button
                className="bg-success font-semibold text-success-foreground hover:bg-success/90"
                disabled={!quizFilePath}
                onClick={() => window.api.startGame()}
              >
                <Play /> {t('actions.startGame')}
              </Button>
            )}
          </Group>

          <GroupRule />

          <Group>
            <Button variant="outline" onClick={() => window.api.showSplash()}>
              <Image /> {t('actions.splash')}
            </Button>
            <Button variant="outline" onClick={() => window.api.showCategories()}>
              <LayoutGrid /> {t('actions.categories')}
            </Button>
            <Button variant="outline" onClick={() => window.api.showRanking()}>
              <Trophy /> {t('actions.ranking')}
            </Button>
          </Group>

          <GroupRule />

          {/* Both of these are states of the game screen, not one-shot actions,
              so they show whether they are on rather than naming the next flip. */}
          <Group>
            <Toggle
              variant="outline"
              pressed={gameScreenFullscreen}
              onPressedChange={() => window.api.toggleGameFullscreen()}
              disabled={!quizFilePath}
            >
              <Maximize /> {t('actions.fullscreen')}
            </Toggle>
            <Toggle
              variant="outline"
              pressed={gameScreenDarkMode}
              onPressedChange={() => window.api.toggleGameDarkMode()}
              disabled={!quizFilePath}
            >
              <Moon /> {t('actions.dark')}
            </Toggle>
          </Group>
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
    <QuizMetaModal open={metaOpen} onOpenChange={setMetaOpen} />
    </>
  )
}

export default ActionBar
