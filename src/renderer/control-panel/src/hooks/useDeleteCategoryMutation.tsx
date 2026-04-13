import { useMutation } from '@tanstack/react-query'
import keys from '@renderer/utils/keys'

export const useDeleteCategoryMutation = (categoryId: number) => {
  return useMutation({
    mutationFn: () => window.api.categoryRemove(categoryId),
    meta: {
      invalidateQueries: keys.categories()
    }
  })
}
