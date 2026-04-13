import { useMutation } from '@tanstack/react-query'
import keys from '@renderer/utils/keys'

export const useAddQuestionMutation = (categoryId: number) =>
  useMutation({
    mutationFn: () =>
      window.api.questionCreate({ categoryId, type: 'single-answer', text: '', media: null }),
    meta: {
      invalidateQueries: keys.questions(categoryId)
    }
  })
