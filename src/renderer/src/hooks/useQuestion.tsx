import { Question } from '@renderer/types'
import { ipc } from '@renderer/main'
import { useEffect, useState } from 'react'

const useQuestion = (id) => {
  const [question, setQuestion] = useState<Question>()

  useEffect(() => {
    const fetch = async () => {
      setQuestion(await ipc.db.questions.byId(id))
    }
    fetch()
  }, [id])

  const update = async (partial: Partial<Question>) => {
    if (!question) return
    try {
      await ipc.db.questions.update(id, partial)
      setQuestion({
        ...question,
        ...partial
      })
    } catch (e) {
      console.error('Failed to update question', e)
    }
  }

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
    // update({
    //   hints: [...question.hints, '']
    // })
  }

  const deleteHint = (idx: number) => {
    // const hints = [...question.hints]
    // hints.splice(idx, 1)
    // update({ hints })
  }

  const updateHint = (idx: number, value: string) => {
    // const hints = [...question.hints]
    // hints[idx] = value
    // update({ hints })
  }

  return { question, updateText, updateAnswer, updateMedia, addHint, deleteHint, updateHint }
}

export default useQuestion
