import { useMutation } from '@tanstack/react-query'
import keys from '@renderer/utils/keys'

export const useAddCategoryMutation = () => {
  return useMutation({
    mutationFn: (name: string) => window.api.categoryCreate(name),
    meta: {
      invalidateQueries: keys.categories()
    }
  })
}
