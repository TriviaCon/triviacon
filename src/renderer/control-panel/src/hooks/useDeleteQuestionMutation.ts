import { useMutation, useQueryClient } from '@tanstack/react-query'
import keys from '@renderer/utils/keys'

export const useDeleteQuestionMutation = (categoryId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => window.api.questionDelete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.questions(categoryId) })
      qc.invalidateQueries({ queryKey: keys.categories() })
    }
  })
}
