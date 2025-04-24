import { ipc } from '@renderer/main'
import keys from '@renderer/utils/keys'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export const useAddHintMutation = (questionId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => ipc.db.hints.create(questionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.hints(questionId) })
  })
}
