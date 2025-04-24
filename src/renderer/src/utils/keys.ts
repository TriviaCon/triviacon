export default {
  stats: () => ['stats'],
  category: (id: number) => ['category', id],
  categories: () => ['categories'],
  questions: (categoryId: number) => ['questions', categoryId],
  question: (questionId: number) => ['question', questionId],
  hints: (questionId: number) => ['hints', questionId]
}
