import { Row, Col, Container } from 'react-bootstrap'
import QuestionView from '../QuestionView/QuestionView'
import { QuizMeta } from './QuizMeta'
import QuizTree from '../QuizTree/QuizTree'
import { useCategories } from '../../../hooks/useCategories'
import { useState } from 'react'

type View = { view: 'question'; id: number } | { view: 'category'; id: number } | null

export const BuilderView = () => {
  const [view, setView] = useState<View>(null)
  const categories = useCategories()

  if (!categories.data) {
    return 'loading...'
  }

  return (
    <Container fluid className="h-100">
      <Row className="flex-grow-1">
        <Col className="d-flex flex-column h-100" md={4}>
          <QuizMeta />
          <QuizTree
            categories={categories.data ?? []}
            setSelectedCategory={(id) => (id ? setView({ view: 'category', id }) : setView(null))}
            setSelectedQuestion={(id) => (id ? setView({ view: 'question', id }) : setView(null))}
            editable={true}
          />
        </Col>
        <Col className="border-start">
          {view?.view === 'question' && <QuestionView id={view.id} />}
        </Col>
      </Row>
    </Container>
  )
}
