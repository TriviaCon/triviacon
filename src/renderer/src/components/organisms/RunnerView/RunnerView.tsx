import { Row, Col, Container } from 'react-bootstrap'
import ScreenControls from './ScreenControls'
import TeamTable from '../TeamTable/TeamTable'
import QuizTree from '../QuizTree/QuizTree'
import { useCategories } from '../../../hooks/useCategories'
import { useRuntimeControls } from '@renderer/hooks/runtime'
import { useQueryClient } from '@tanstack/react-query'
import { questionsQuery } from '@renderer/hooks/useCategoryQuestions'
import { categoryQuery } from '@renderer/hooks/useCategory'
import { questionQuery, useQuestion } from '@renderer/hooks/useQuestion'
import { hintsQuery, useHints } from '@renderer/hooks/useHints'
import BasicQuestionViewer from '../QuestionView/BasicQuestionViewer'
import { useState } from 'react'

const QuestionColumn = ({ id }: { id: number }) => {
  const { toggleAnswer, toggleHints, toggleUsed, revealedAnswers, revealedHints, used } =
    useRuntimeControls()
  const question = useQuestion(id)
  const hints = useHints(id)

  if (!question.data || !hints.data) {
    return
  }

  return (
    <BasicQuestionViewer
      question={question.data}
      hints={hints.data}
      answerRevealed={revealedAnswers.includes(id)}
      onRevealAnswer={() => toggleAnswer(id)}
      hintsRevealed={revealedHints.includes(id)}
      onRevealHints={() => toggleHints(id)}
      used={used.includes(id)}
      onUse={() => toggleUsed(id)}
    />
  )
}

export const RunnerView = () => {
  const queryClient = useQueryClient()
  const { transition } = useRuntimeControls()
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null)
  const categories = useCategories()

  if (!categories.data) {
    return
  }

  const handleCategoryClicked = async (id: number | null) => {
    if (!id) {
      return
    }

    const [category, questions] = await Promise.all([
      queryClient.fetchQuery(categoryQuery(id)),
      queryClient.fetchQuery(questionsQuery(id))
    ])

    if (!category) {
      throw new Error(`Category ${id} not found`)
    }

    setSelectedQuestionId(null)
    transition({
      screen: 'questions',
      data: {
        category,
        questions
      }
    })
  }

  const handleQuestionClicked = async (id: number | null) => {
    if (!id) {
      return
    }

    const [question, hints] = await Promise.all([
      queryClient.fetchQuery(questionQuery(id)),
      queryClient.fetchQuery(hintsQuery(id))
    ])

    setSelectedQuestionId(id)
    transition({
      screen: 'question',
      data: { question, hints, answerRevealed: true }
    })
  }

  return (
    <Container fluid className="h-100">
      <Row>
        <ScreenControls />
      </Row>
      <Row>
        <Col sm={4} md={3} className="border-end">
          <TeamTable />
        </Col>
        <Col className="border-start d-flex flex-column">
          <Row>
            <Col xs={4}>
              <QuizTree
                categories={categories.data}
                setSelectedCategory={handleCategoryClicked}
                setSelectedQuestion={handleQuestionClicked}
                editable={false}
              />
            </Col>
            <Col>{selectedQuestionId && <QuestionColumn id={selectedQuestionId} />}</Col>
          </Row>
        </Col>
      </Row>
    </Container>
  )
}
