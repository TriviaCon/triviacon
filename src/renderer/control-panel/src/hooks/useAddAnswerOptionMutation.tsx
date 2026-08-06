import keys from '@renderer/utils/keys'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export const useAddAnswerOptionMutation = (questionId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (correct: boolean = false) =>
      window.api.answerOptionCreate(questionId, undefined, correct),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.answerOptions(questionId) })
  })
}
