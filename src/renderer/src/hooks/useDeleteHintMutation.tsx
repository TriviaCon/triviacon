import { ipc } from '@renderer/main'
import keys from '@renderer/utils/keys'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export const useDeleteHintMutation = (questionId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => ipc.db.hints.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.hints(questionId) })
  })
}
