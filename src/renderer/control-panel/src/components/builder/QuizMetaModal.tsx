import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart3, ImagePlus, Trash2 } from 'lucide-react'
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
import {
  useQuizMeta,
  useUpdateName,
  useUpdateAuthor,
  useUpdateDate,
  useUpdateLocation,
  useUpdateSplash,
  useUpdateTimer
} from '@renderer/hooks/useQuizMeta'
import { QueryLoading, QueryError } from '@renderer/components/ui/query-state'
import { useState } from 'react'

const ACCEPTED_IMAGE_TYPES = 'image/png,image/jpeg,image/gif,image/webp'

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
  const updateSplash = useUpdateSplash()
  const updateTimer = useUpdateTimer()
  const [showStats, setShowStats] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') updateSplash.mutate(reader.result)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const hasSplash = !!(meta.data?.splash && meta.data.splash.length > 0)

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
              <div className="flex gap-8 py-2">
                <div className="flex-1 space-y-4">
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

                <div className="w-48 shrink-0 flex flex-col gap-2">
                  {hasSplash ? (
                    <img src={meta.data.splash} className="w-full rounded border border-border" alt={t('builder.splashImage')} />
                  ) : (
                    <div className="w-full aspect-video rounded border border-dashed border-border flex items-center justify-center text-muted-foreground text-xs">
                      {t('builder.noImage')}
                    </div>
                  )}
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => fileInputRef.current?.click()}>
                      <ImagePlus className="mr-1 h-3 w-3" />
                      {hasSplash ? t('actions.change') : t('actions.add')}
                    </Button>
                    {hasSplash && (
                      <Button variant="outline" size="sm" className="text-destructive border-destructive/50 hover:bg-destructive/10" onClick={() => updateSplash.mutate('')}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept={ACCEPTED_IMAGE_TYPES} onChange={handleImageSelect} className="hidden" />
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-border">
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
