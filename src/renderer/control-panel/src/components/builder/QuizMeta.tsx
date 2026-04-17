import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart3, ImagePlus, Info, Trash2 } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { QuizStatsModal } from './QuizStatsModal'
import {
  useQuizMeta,
  useUpdateName,
  useUpdateAuthor,
  useUpdateDate,
  useUpdateLocation,
  useUpdateSplash
} from '@renderer/hooks/useQuizMeta'
import { QueryLoading, QueryError } from '@renderer/components/ui/query-state'

const ACCEPTED_IMAGE_TYPES = 'image/png,image/jpeg,image/gif,image/webp'

export const QuizMeta = () => {
  const { t } = useTranslation()
  const meta = useQuizMeta()
  const updateName = useUpdateName()
  const updateAuthor = useUpdateAuthor()
  const updateDate = useUpdateDate()
  const updateLocation = useUpdateLocation()
  const updateSplash = useUpdateSplash()
  const [showStatsModal, setShowStatsModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (meta.isLoading) return <QueryLoading label={t('builder.loadingMeta')} />
  if (meta.error) return <QueryError message={meta.error.message} />
  if (!meta.data) return null

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateSplash.mutate(reader.result)
      }
    }
    reader.readAsDataURL(file)
    // Reset so the same file can be re-selected
    e.target.value = ''
  }

  const hasSplash = meta.data.splash && meta.data.splash.length > 0

  return (
    <>
      <h2 className="text-lg font-semibold mb-2">{t('builder.quiz')}</h2>
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <Info className="h-4 w-4" /> {t('builder.quizInfo')}
            </span>
            <Button variant="outline" size="sm" onClick={() => setShowStatsModal(true)}>
              <BarChart3 className="mr-1 h-4 w-4" /> {t('builder.stats')}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="quiz-name" className="w-16 text-right text-sm shrink-0">
                  {t('builder.name')}
                </Label>
                <Input
                  id="quiz-name"
                  placeholder={t('builder.namePlaceholder')}
                  value={meta.data.name}
                  onChange={(e) => updateName.mutate(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="quiz-author" className="w-16 text-right text-sm shrink-0">
                  {t('builder.author')}
                </Label>
                <Input
                  id="quiz-author"
                  placeholder={t('builder.authorPlaceholder')}
                  value={meta.data.author}
                  onChange={(e) => updateAuthor.mutate(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="quiz-date" className="w-16 text-right text-sm shrink-0">
                  {t('builder.date')}
                </Label>
                <Input
                  id="quiz-date"
                  type="date"
                  value={meta.data.date}
                  onChange={(e) => updateDate.mutate(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="quiz-location" className="w-16 text-right text-sm shrink-0">
                  {t('builder.location')}
                </Label>
                <Input
                  id="quiz-location"
                  placeholder={t('builder.locationPlaceholder')}
                  value={meta.data.location}
                  onChange={(e) => updateLocation.mutate(e.target.value)}
                />
              </div>
            </div>
            <div className="w-40 shrink-0 flex flex-col gap-2">
              {hasSplash ? (
                <img
                  src={meta.data.splash}
                  className="w-full rounded border border-border"
                  alt={t('builder.splashImage')}
                />
              ) : (
                <div className="w-full aspect-video rounded border border-dashed border-border flex items-center justify-center text-muted-foreground text-xs">
                  {t('builder.noImage')}
                </div>
              )}
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus className="mr-1 h-3 w-3" />
                  {hasSplash ? t('actions.change') : t('actions.add')}
                </Button>
                {hasSplash && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive/50 hover:bg-destructive/10"
                    onClick={() => updateSplash.mutate('')}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_IMAGE_TYPES}
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      <QuizStatsModal show={showStatsModal} onHide={() => setShowStatsModal(false)} />
    </>
  )
}
