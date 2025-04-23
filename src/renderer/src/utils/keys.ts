export default {
  stats: () => ['stats'],
  categories: () => ['categories'],
  questions: (categoryId: number) => ['questions', categoryId],
  question: (questionId: number) => ['question', questionId]
}
