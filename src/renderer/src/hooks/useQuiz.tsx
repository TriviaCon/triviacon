import { useLocalStorage } from './useLocalStorage'

const useQuiz = () => {
  const [quizInfo, setQuizInfo] = useLocalStorage('quizInfo', {
    quizName: '',
    quizAuthor: '',
    quizLocation: '',
    quizDate: '',
    quizImage: ''
  })

  const setName = (name: string) => {
    setQuizInfo({
      ...quizInfo,
      quizName: name
    })
  }

  const setAuthor = (author: string) => {
    setQuizInfo({
      ...quizInfo,
      quizAuthor: author
    })
  }

  const setDate = (date: string) => {
    setQuizInfo({
      ...quizInfo,
      quizDate: date
    })
  }

  const setLocation = (location: string) => {
    setQuizInfo({
      ...quizInfo,
      quizLocation: location
    })
  }

  return { quizInfo, setName, setAuthor, setDate, setLocation }
}

export default useQuiz
