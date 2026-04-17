import { FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, UserPlus, UserX } from 'lucide-react'
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

const TeamTable = () => {
  const { t } = useTranslation()
  const gameState = useGameState()
  const { teams, currentTeamId } = gameState
  const currentTeam = teams.find((tm) => tm.id === currentTeamId) ?? null

  const [editingTeamId, setEditingTeamId] = useState<string | null>(null)
  const [editingTeamName, setEditingTeamName] = useState('')

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

  const sortedTeams = [...teams].sort((a, b) => b.score - a.score)

  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold">{t('runner.teams')}</h2>
        <form className="flex items-center gap-1" onSubmit={handleAddTeam}>
          <Input
            type="text"
            name="teamName"
            placeholder={t('runner.teamName')}
            aria-label={t('runner.teamName')}
            required
            className="h-8 w-32"
          />
          <Button type="submit" size="sm">
            <UserPlus className="mr-1 h-4 w-4" /> {t('actions.add')}
          </Button>
        </form>
      </div>

      <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 mb-2 border border-border">
        <span className="text-sm">{t('runner.currentTeam')}</span>
        <span className="font-semibold text-sm">{currentTeam?.name || t('runner.noTeamSelected')}</span>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={() => window.api.prevTeam()}>
            <ChevronLeft className="h-4 w-4" /> {t('actions.prev')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.api.nextTeam()}>
            {t('actions.next')} <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8">#</TableHead>
            <TableHead>{t('runner.teamName')}</TableHead>
            <TableHead className="text-center">{t('runner.score')}</TableHead>
            <TableHead className="text-center w-12">{t('actions.delete')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTeams.map((team, index) => (
            <TableRow key={team.id}>
              <TableCell className="font-semibold">{index + 1}</TableCell>
              <TableCell>
                {editingTeamId === team.id ? (
                  <Input
                    value={editingTeamName}
                    onChange={(e) => setEditingTeamName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTeamName()
                      else if (e.key === 'Escape') {
                        setEditingTeamId(null)
                        setEditingTeamName('')
                      }
                    }}
                    onBlur={handleSaveTeamName}
                    autoFocus
                    className="h-7"
                  />
                ) : (
                  <span
                    onClick={() => {
                      setEditingTeamId(team.id)
                      setEditingTeamName(team.name)
                    }}
                    className="cursor-pointer hover:underline"
                  >
                    {team.name}
                  </span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-between gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 w-8 text-xs"
                    onClick={() => window.api.updateScore(team.id, -1)}
                  >
                    -1
                  </Button>
                  <span className="font-medium">{team.score}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 w-8 text-xs"
                    onClick={() => window.api.updateScore(team.id, 1)}
                  >
                    +1
                  </Button>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 text-destructive border-destructive/50 hover:bg-destructive/10"
                  onClick={() => {
                    if (window.confirm(t('confirm.deleteTeam', { name: team.name }))) {
                      window.api.removeTeam(team.id)
                    }
                  }}
                >
                  <UserX className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
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
    </div>
  )
}

export default TeamTable
