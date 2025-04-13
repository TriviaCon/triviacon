import { useState, useEffect } from 'react'
import { Question } from '@renderer/types'
import { ipc } from '@renderer/main'

const useCategoryQuestions = (categoryId: number) => {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true)
        const fetchedQuestions: Question[] = await ipc.db.questions.allByCategoryId(categoryId)
        setQuestions(fetchedQuestions)
      } catch (err) {
        setError('Failed to fetch questions')
      } finally {
        setLoading(false)
      }
    }

    fetchQuestions()
  }, [categoryId])

  return { questions, loading, error }
}

export default useCategoryQuestions
