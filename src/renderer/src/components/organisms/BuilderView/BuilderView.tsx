import { Row, Col, Container } from 'react-bootstrap'
import QuestionView from '../QuestionView/QuestionView'
import { QuizMeta } from './QuizMeta'
import QuizTree from '../QuizTree/QuizTree'
import { useLocalStorage } from '../../../hooks/useLocalStorage'
import { Category, Question } from '../../../context/categories'
import { useCategories } from '../../../hooks/useCategories'

export const BuilderView = () => {
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
            setSelectedQuestion={setQuestion}
            isBuilder={true}
          />
        </Col>
        <Col md={8} className="border-start">
          {category && question && <QuestionView category={category} qID={question.qID} />}
        </Col>
      </Row>
    </Container>
  )
}
