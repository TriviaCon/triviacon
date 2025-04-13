import { Row, Col, Container } from 'react-bootstrap'
import QuestionView from '../QuestionView/QuestionView'
import { QuizMeta } from './QuizMeta'
import QuizTree from '../QuizTree/QuizTree'
import { useLocalStorage } from '../../../hooks/useLocalStorage'
import { Category, Question } from '../../../context/categories'
import { useCategories } from '../../../hooks/useCategories'
import { useState } from 'react'

type View = { view: 'question'; id: number } | { view: 'category'; id: number } | null

export const BuilderView = () => {
  const [view, setView] = useState<View>(null)
  const [category, setCategory] = useLocalStorage<Category | null>('selectedCategory', null)
  const [question, setQuestion] = useLocalStorage<Question | null>('selectedQuestion', null)
  const categories = useCategories()

  return (
    <Container fluid className="d-flex flex-column">
      <Row>
        <Col>
          <QuizMeta />
          <QuizTree
            {...categories}
            selectedCategory={category}
            setSelectedCategory={setCategory}
            selectedQuestion={question}
            setSelectedQuestion={(id) => {
              setView({ view: 'question', id })
            }}
            isBuilder={true}
          />
        </Col>
        <Col md={8} className="border-start">
          {/* {category && question && <QuestionView category={category} qID={question.qID} />} */}
          {view?.view === 'question' && <QuestionView category={category} qID={view.id} />}
        </Col>
      </Row>
    </Container>
  )
}
