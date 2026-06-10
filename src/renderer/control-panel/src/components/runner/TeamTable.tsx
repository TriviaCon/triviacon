import { FormEvent, useEffect, useRef, useState } from 'react'
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
      <TableCell>
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
          <span className="cursor-pointer hover:underline" onClick={onEditStart}>
            {team.name}
          </span>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-between gap-1">
          <Button variant="outline" size="sm" className="h-6 w-8 text-xs" onClick={() => window.api.updateScore(team.id, -1)}>-1</Button>
          <span className="font-medium tabular-nums">{team.score}</span>
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
  const { teams, currentTeamId, tiebreakerTeamIds } = useGameState()

  const [orderedIds, setOrderedIds] = useState<string[]>(() => teams.map((t) => t.id))
  const [locked, setLocked] = useState(false)
  const [round, setRound] = useState(1)
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null)
  const [editingTeamName, setEditingTeamName] = useState('')
  const [deletingTeam, setDeletingTeam] = useState<{ id: string; name: string } | null>(null)

  const prevTeamIdRef = useRef<string | null>(null)

  // Sync orderedIds when teams are added or removed (but preserve manual order)
  useEffect(() => {
    setOrderedIds((prev) => {
      const existing = prev.filter((id) => teams.some((t) => t.id === id))
      const added = teams.map((t) => t.id).filter((id) => !prev.includes(id))
      return [...existing, ...added]
    })
  }, [teams])

  // Round counter: increments when currentTeam rolls from last to first while locked
  useEffect(() => {
    const prev = prevTeamIdRef.current
    prevTeamIdRef.current = currentTeamId

    if (!locked || !prev || !currentTeamId || orderedIds.length < 2) return
    // Frozen during a tiebreaker sub-game (cycling tied teams isn't a real round).
    if (tiebreakerTeamIds) return

    const prevIdx = orderedIds.indexOf(prev)
    const currIdx = orderedIds.indexOf(currentTeamId)
    if (prevIdx === orderedIds.length - 1 && currIdx === 0) {
      setRound((r) => r + 1)
    }
  }, [currentTeamId, locked, orderedIds, tiebreakerTeamIds])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const orderedTeams = orderedIds
    .map((id) => teams.find((t) => t.id === id))
    .filter((t): t is Team => t !== undefined)

  const currentTeam = teams.find((t) => t.id === currentTeamId) ?? null

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setOrderedIds((ids) => {
      const oldIdx = ids.indexOf(String(active.id))
      const newIdx = ids.indexOf(String(over.id))
      return arrayMove(ids, oldIdx, newIdx)
    })
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
            variant={locked ? 'default' : 'outline'}
            className="h-7 gap-1"
            onClick={() => setLocked((l) => !l)}
            title={locked ? t('runner.unlockOrder') : t('runner.lockOrder')}
          >
            {locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
            {locked ? t('runner.unlockOrder') : t('runner.lockOrder')}
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
        <div className="text-center">
          <div className="text-xs text-muted-foreground">{t('runner.currentTeam')}</div>
          <div className="font-semibold text-sm">{currentTeam?.name || t('runner.noTeamSelected')}</div>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.api.nextTeam()}>
          {t('actions.next')} <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Team table with DnD */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">{locked ? '#' : ''}</TableHead>
                <TableHead>{t('runner.teamName')}</TableHead>
                <TableHead className="text-center">{t('runner.score')}</TableHead>
                <TableHead className="text-center w-12">{t('actions.delete')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderedTeams.map((team, index) => (
                <SortableTeamRow
                  key={team.id}
                  team={team}
                  index={index}
                  isCurrent={team.id === currentTeamId}
                  isTiebreaker={tiebreakerTeamIds?.includes(team.id) ?? false}
                  locked={locked}
                  editing={editingTeamId === team.id}
                  editingName={editingTeamName}
                  onEditStart={() => { setEditingTeamId(team.id); setEditingTeamName(team.name) }}
                  onEditChange={setEditingTeamName}
                  onEditSave={handleSaveTeamName}
                  onDeleteRequest={() => setDeletingTeam({ id: team.id, name: team.name })}
                />
              ))}
              {orderedTeams.length === 0 && (
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
