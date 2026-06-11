import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart3, Image as ImageIcon } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@renderer/components/ui/dialog'
import { QuizStatsModal } from './QuizStatsModal'
import { SplashControl } from './SplashControl'
import {
  useQuizMeta,
  useUpdateName,
  useUpdateAuthor,
  useUpdateDate,
  useUpdateLocation,
  useUpdateTimer
} from '@renderer/hooks/useQuizMeta'
import { QueryLoading, QueryError } from '@renderer/components/ui/query-state'

interface QuizMetaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const QuizMetaModal = ({ open, onOpenChange }: QuizMetaModalProps) => {
  const { t } = useTranslation()
  const meta = useQuizMeta()
  const updateName = useUpdateName()
  const updateAuthor = useUpdateAuthor()
  const updateDate = useUpdateDate()
  const updateLocation = useUpdateLocation()
  const updateTimer = useUpdateTimer()
  const [showStats, setShowStats] = useState(false)

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('builder.quizInfo')}</DialogTitle>
          </DialogHeader>

          {meta.isLoading && <QueryLoading label={t('builder.loadingMeta')} />}
          {meta.error && <QueryError message={meta.error.message} />}
          {meta.data && (
            <>
              <div className="space-y-4 py-2">
                {[
                  { id: 'quiz-name', label: t('builder.name'), placeholder: t('builder.namePlaceholder'), value: meta.data.name, onChange: (v: string) => updateName.mutate(v) },
                  { id: 'quiz-author', label: t('builder.author'), placeholder: t('builder.authorPlaceholder'), value: meta.data.author, onChange: (v: string) => updateAuthor.mutate(v) },
                  { id: 'quiz-location', label: t('builder.location'), placeholder: t('builder.locationPlaceholder'), value: meta.data.location, onChange: (v: string) => updateLocation.mutate(v) },
                ].map(({ id, label, placeholder, value, onChange }) => (
                  <div key={id} className="flex items-center gap-4">
                    <Label htmlFor={id} className="w-24 text-right text-sm shrink-0">{label}</Label>
                    <Input id={id} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
                  </div>
                ))}
                <div className="flex items-center gap-4">
                  <Label htmlFor="quiz-date" className="w-24 text-right text-sm shrink-0">{t('builder.date')}</Label>
                  <Input id="quiz-date" type="date" value={meta.data.date} onChange={(e) => updateDate.mutate(e.target.value)} />
                </div>
                <div className="flex items-center gap-4">
                  <Label htmlFor="quiz-timer" className="w-24 text-right text-sm shrink-0">{t('builder.timer')}</Label>
                  <Input
                    id="quiz-timer"
                    type="number"
                    min={0}
                    placeholder={t('builder.timerPlaceholder')}
                    value={meta.data.timerSeconds || ''}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10)
                      updateTimer.mutate(isNaN(v) || v < 0 ? 0 : v)
                    }}
                  />
                </div>
              </div>

              <div className="border-t border-border pt-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <ImageIcon className="h-4 w-4" /> {t('builder.splash')}
                </div>
                <SplashControl meta={meta.data} />
              </div>

              <div className="flex justify-end pt-3 border-t border-border">
                <Button variant="outline" onClick={() => setShowStats(true)}>
                  <BarChart3 className="mr-2 h-4 w-4" /> {t('builder.stats')}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <QuizStatsModal show={showStats} onHide={() => setShowStats(false)} />
    </>
  )
}
