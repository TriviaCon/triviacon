import { FormEvent, useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ConfirmDialog } from '@renderer/components/ui/confirm-dialog'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, GripVertical, Lock, Unlock, UserPlus, UserX } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { TruncatedText } from '@renderer/components/ui/truncated-text'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@renderer/components/ui/table'
import { useGameState } from '@renderer/hooks/useGameState'
import { cn } from '@renderer/lib/utils'
import type { Team } from '@shared/types/quiz'
import { formatScore } from '@shared/ranking'

// ── Sortable row ────────────────────────────────────────────────

function SortableTeamRow({
  team,
  index,
  isCurrent,
  isTiebreaker,
  locked,
  editing,
  editingName,
  onEditStart,
  onEditChange,
  onEditSave,
  onDeleteRequest
}: {
  team: Team
  index: number
  isCurrent: boolean
  isTiebreaker: boolean
  locked: boolean
  editing: boolean
  editingName: string
  onEditStart: () => void
  onEditChange: (v: string) => void
  onEditSave: () => void
  onDeleteRequest: () => void
}) {
  const { i18n } = useTranslation()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: team.id,
    disabled: locked
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={cn(
        isTiebreaker ? 'bg-amber-400/20' : isCurrent && 'bg-primary/10',
        isCurrent && 'font-semibold'
      )}
    >
      <TableCell className="w-8 pr-0">
        {locked ? (
          <span className="text-sm font-semibold text-muted-foreground">{index + 1}</span>
        ) : (
          <span
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-muted-foreground flex items-center"
          >
            <GripVertical className="h-4 w-4" />
          </span>
        )}
      </TableCell>
      <TableCell className="min-w-0">
        {editing ? (
          <Input
            value={editingName}
            onChange={(e) => onEditChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onEditSave()
              else if (e.key === 'Escape') onEditSave()
            }}
            onBlur={onEditSave}
            autoFocus
            className="h-7"
          />
        ) : (
          <TruncatedText
            text={team.name}
            className="cursor-pointer hover:underline"
            onClick={onEditStart}
          />
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-between gap-0.5">
          <Button variant="outline" size="sm" className="h-6 w-8 text-xs" onClick={() => window.api.updateScore(team.id, -1)}>-1</Button>
          <Button variant="outline" size="sm" className="h-6 w-7 text-xs" onClick={() => window.api.updateScore(team.id, -0.5)}>-½</Button>
          <span className="min-w-9 text-center font-medium tabular-nums">
            {formatScore(team.score, i18n.language)}
          </span>
          <Button variant="outline" size="sm" className="h-6 w-7 text-xs" onClick={() => window.api.updateScore(team.id, 0.5)}>+½</Button>
          <Button variant="outline" size="sm" className="h-6 w-8 text-xs" onClick={() => window.api.updateScore(team.id, 1)}>+1</Button>
        </div>
      </TableCell>
      <TableCell className="text-center">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7 text-destructive border-destructive/50 hover:bg-destructive/10"
          onClick={onDeleteRequest}
        >
          <UserX className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  )
}

// ── TeamTable ───────────────────────────────────────────────────

const TeamTable = () => {
  const { t } = useTranslation()
  // Team order, lock, and round live in authoritative GameState so they survive
  // view switches (tab changes, the Ranking screen) that unmount this component.
  const { teams, currentTeamId, tiebreakerTeamIds, teamOrderLocked, round } = useGameState()

  const [editingTeamId, setEditingTeamId] = useState<string | null>(null)
  const [editingTeamName, setEditingTeamName] = useState('')
  const [deletingTeam, setDeletingTeam] = useState<{ id: string; name: string } | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const currentTeam = teams.find((t) => t.id === currentTeamId) ?? null

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = teams.map((tm) => tm.id)
    const oldIdx = ids.indexOf(String(active.id))
    const newIdx = ids.indexOf(String(over.id))
    window.api.reorderTeams(arrayMove(ids, oldIdx, newIdx))
  }

  const handleAddTeam = (event: FormEvent) => {
    event.preventDefault()
    const form = event.target as HTMLFormElement
    const data = new FormData(form)
    const name = data.get('teamName') as string
    if (teams.some((tm) => tm.name.toLowerCase() === name.toLowerCase())) {
      alert(t('runner.teamExists'))
      return
    }
    window.api.addTeam(name)
    form.reset()
  }

  const handleSaveTeamName = () => {
    if (editingTeamId !== null) {
      window.api.renameTeam(editingTeamId, editingTeamName)
      setEditingTeamId(null)
      setEditingTeamName('')
    }
  }

  return (
    <div className="flex flex-col gap-2">

      {/* Header: Teams label + round counter + lock */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{t('runner.teams')}</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {t('runner.round')}
            <span className="ml-1.5 font-bold text-foreground tabular-nums text-base">{round}</span>
          </span>
          <Button
            size="sm"
            variant={teamOrderLocked ? 'default' : 'outline'}
            className="h-7 gap-1"
            onClick={() => window.api.setTeamOrderLocked(!teamOrderLocked)}
            title={teamOrderLocked ? t('runner.unlockOrder') : t('runner.lockOrder')}
          >
            {teamOrderLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
            {teamOrderLocked ? t('runner.unlockOrder') : t('runner.lockOrder')}
          </Button>
        </div>
      </div>

      {/* Add team */}
      <form className="flex items-center gap-1" onSubmit={handleAddTeam}>
        <Input type="text" name="teamName" placeholder={t('runner.teamName')} aria-label={t('runner.teamName')} required className="h-8 flex-1" />
        <Button type="submit" size="sm">
          <UserPlus className="mr-1 h-4 w-4" /> {t('actions.add')}
        </Button>
      </form>

      {/* Current team bar */}
      <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 border border-border">
        <Button variant="outline" size="sm" onClick={() => window.api.prevTeam()}>
          <ChevronLeft className="h-4 w-4" /> {t('actions.prev')}
        </Button>
        <div className="min-w-0 flex-1 px-2 text-center">
          <div className="text-xs text-muted-foreground">{t('runner.currentTeam')}</div>
          {currentTeam ? (
            <TruncatedText text={currentTeam.name} className="font-semibold text-sm" />
          ) : (
            <div className="font-semibold text-sm">{t('runner.noTeamSelected')}</div>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => window.api.nextTeam()}>
          {t('actions.next')} <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Team table with DnD */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={teams.map((tm) => tm.id)} strategy={verticalListSortingStrategy}>
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">{teamOrderLocked ? '#' : ''}</TableHead>
                <TableHead>{t('runner.teamName')}</TableHead>
                <TableHead className="w-44 text-center">{t('runner.score')}</TableHead>
                <TableHead className="text-center w-12">{t('actions.delete')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team, index) => (
                <SortableTeamRow
                  key={team.id}
                  team={team}
                  index={index}
                  isCurrent={team.id === currentTeamId}
                  isTiebreaker={tiebreakerTeamIds?.includes(team.id) ?? false}
                  locked={teamOrderLocked}
                  editing={editingTeamId === team.id}
                  editingName={editingTeamName}
                  onEditStart={() => { setEditingTeamId(team.id); setEditingTeamName(team.name) }}
                  onEditChange={setEditingTeamName}
                  onEditSave={handleSaveTeamName}
                  onDeleteRequest={() => setDeletingTeam({ id: team.id, name: team.name })}
                />
              ))}
              {teams.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    {t('runner.noTeams')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </SortableContext>
      </DndContext>

      <ConfirmDialog
        open={deletingTeam !== null}
        title={t('confirm.deleteTeamTitle')}
        description={t('confirm.deleteTeam', { name: deletingTeam?.name ?? '' })}
        confirmLabel={t('actions.delete')}
        destructive
        onConfirm={() => { if (deletingTeam) window.api.removeTeam(deletingTeam.id) }}
        onCancel={() => setDeletingTeam(null)}
      />
    </div>
  )
}

export default TeamTable
