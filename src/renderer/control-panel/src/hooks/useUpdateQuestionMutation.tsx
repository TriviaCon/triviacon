import { Question } from '@shared/types/quiz'
import keys from '@renderer/utils/keys'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export const useUpdateQuestionMutation = (id: number, categoryId?: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (q: Partial<Question>) => window.api.questionUpdate(id, q),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.question(id) })
      if (categoryId !== undefined) {
        qc.invalidateQueries({ queryKey: keys.questions(categoryId) })
      }
    }
  })
}
