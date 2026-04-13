import { useGameState } from '@renderer/hooks/useGameState'
import { useStats } from '@renderer/hooks/useStats'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@renderer/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableRow
} from '@renderer/components/ui/table'

export const QuizStatsModal = ({ show, onHide }: { show: boolean; onHide: () => void }) => {
  const { categories } = useGameState()
  const stats = useStats()

  return (
    <Dialog open={show} onOpenChange={(open) => !open && onHide()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quiz Statistics</DialogTitle>
        </DialogHeader>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="text-right font-semibold whitespace-nowrap">Total Categories</TableCell>
              <TableCell>{categories.length}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="text-right font-semibold whitespace-nowrap">Total Questions</TableCell>
              <TableCell>{stats.data?.totalQuestions}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="text-right font-semibold whitespace-nowrap">Media Questions</TableCell>
              <TableCell>{stats.data?.questionsWithMedia}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  )
}
