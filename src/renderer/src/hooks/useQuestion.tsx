import { useMemo } from 'react'
import { useCategories } from './useCategories'
import { Question } from '@renderer/context/categories'

const useQuestion = ({ cID, qID }: { cID: string; qID: string }) => {
  const { categories, updateQuestion } = useCategories()
  const category = useMemo(
    () => categories.find((category) => category.cID === cID)!,
    [categories, cID]
  )
  const question = useMemo(
    () => category.questions.find((question) => question.qID === qID)!,
    [category, qID]
  )

  const update = (question: Partial<Question>) => updateQuestion(cID, qID, question)

  const updateText = (text: string) => {
    update({ text })
  }

  const updateAnswer = (answer: string) => {
    update({ answer })
  }

  const updateMedia = (media: string) => {
    update({ media })
  }

  const addHint = () => {
    update({
      hints: [...question.hints, '']
    })
  }

  const deleteHint = (idx: number) => {
    const hints = [...question.hints]
    hints.splice(idx, 1)
    update({ hints })
  }

  const updateHint = (idx: number, value: string) => {
    const hints = [...question.hints]
    hints[idx] = value
    update({ hints })
  }

  return { question, updateText, updateAnswer, updateMedia, addHint, deleteHint, updateHint }
}

export default useQuestion
