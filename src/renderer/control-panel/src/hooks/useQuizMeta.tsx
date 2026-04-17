import { useMutation, useQuery } from '@tanstack/react-query'
import keys from '@renderer/utils/keys'

export const useQuizMeta = () =>
  useQuery({
    queryKey: keys.meta(),
    queryFn: () => window.api.quizMetaGet()
  })

const createMetaMutation = (fn: (v: string) => Promise<void>) =>
  useMutation({
    mutationFn: (v: string) => fn(v),
    meta: {
      invalidateQueries: keys.meta()
    }
  })

export const useUpdateName = () => createMetaMutation(window.api.quizMetaUpdateName)
export const useUpdateAuthor = () => createMetaMutation(window.api.quizMetaUpdateAuthor)
export const useUpdateDate = () => createMetaMutation(window.api.quizMetaUpdateDate)
export const useUpdateLocation = () => createMetaMutation(window.api.quizMetaUpdateLocation)
export const useUpdateSplash = () => createMetaMutation(window.api.quizMetaUpdateSplash)
