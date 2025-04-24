import { ipc } from '@renderer/main'
import { queryOptions, useQuery } from '@tanstack/react-query'
import keys from '@renderer/utils/keys'

export const hintsQuery = (questionId: number) =>
  queryOptions({
    queryKey: keys.hints(questionId),
    queryFn: () => ipc.db.hints.byQuestionId(questionId)
  })

export const useHints = (questionId: number) => useQuery(hintsQuery(questionId))
