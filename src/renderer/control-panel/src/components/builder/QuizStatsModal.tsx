import { useTranslation } from 'react-i18next'
import { useGameState } from '@renderer/hooks/useGameState'
import { useStats } from '@renderer/hooks/useStats'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@renderer/components/ui/dialog'
import { Table, TableBody, TableCell, TableRow } from '@renderer/components/ui/table'

export const QuizStatsModal = ({ show, onHide }: { show: boolean; onHide: () => void }) => {
  const { t } = useTranslation()
  const { categories } = useGameState()
  const stats = useStats()

  return (
    <Dialog open={show} onOpenChange={(open) => !open && onHide()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('stats.title')}</DialogTitle>
        </DialogHeader>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="text-right font-semibold whitespace-nowrap">
                {t('stats.totalCategories')}
              </TableCell>
              <TableCell>{categories.length}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="text-right font-semibold whitespace-nowrap">
                {t('stats.totalQuestions')}
              </TableCell>
              <TableCell>{stats.data?.totalQuestions}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="text-right font-semibold whitespace-nowrap">
                {t('stats.mediaQuestions')}
              </TableCell>
              <TableCell>{stats.data?.questionsWithMedia}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  )
}
