import { ipc } from '@renderer/main'
import keys from '@renderer/utils/keys'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export const useUpdateHintMutation = (questionId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, hint }: { id: number; hint: string }) => ipc.db.hints.update(id, hint),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.hints(questionId) })
  })
}
