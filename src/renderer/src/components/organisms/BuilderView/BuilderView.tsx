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

  return (
    <Container fluid className="d-flex flex-column">
      <Row>
        <Col>
          <QuizMeta />
          <QuizTree
            {...categories}
            setSelectedCategory={(id) => (id ? setView({ view: 'category', id }) : setView(null))}
            setSelectedQuestion={(id) => (id ? setView({ view: 'question', id }) : setView(null))}
          />
        </Col>
        <Col md={8} className="border-start">
          {view?.view === 'question' && <QuestionView id={view.id} />}
        </Col>
      </Row>
    </Container>
  )
}
