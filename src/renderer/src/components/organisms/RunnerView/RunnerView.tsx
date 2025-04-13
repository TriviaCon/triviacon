import { Row, Col, Container, Card } from 'react-bootstrap'
import ScreenControls from './ScreenControls'
import TeamTable from '../TeamTable/TeamTable'
import QuizTree from '../QuizTree/QuizTree'
import BasicQuestionViewer from '../QuestionView/BasicQuestionViewer'
import { useCategories } from '../../../hooks/useCategories'
import { useLocalStorage } from '../../../hooks/useLocalStorage'
import { Category, Question } from '../../../context/categories'

export const RunnerView = () => {
  const { categories, updateCategory, loadQuizData, addCategory, deleteCategory } = useCategories()
  const [category, setCategory] = useLocalStorage<Category | null>('selectedCategory', null)
  const [question, setQuestion] = useLocalStorage<Question | null>('selectedQuestion', null)

  const updateQuestion = (questionId: string, updates: Partial<Question>) => {
    if (question && category) {
      const updatedQuestions = category.questions.map((q) =>
        q.qID === questionId ? { ...q, ...updates } : q
      )
      updateCategory(category.cID, { questions: updatedQuestions })
      setQuestion({ ...question, ...updates })
    }
  }

  return (
    <Container fluid className="d-flex flex-column">
      <Row>
        <ScreenControls />
      </Row>
      <Row className="flex-grow-1">
        <Col xs={4} className="border-end">
          <TeamTable />
        </Col>
        <Col className="border-start d-flex flex-column">
          <Row className="flex-grow-1">
            <Col xs={4}>
              <QuizTree
                categories={categories}
                loadQuizData={loadQuizData}
                addCategory={addCategory}
                deleteCategory={deleteCategory}
                updateCategory={updateCategory}
                selectedCategory={category}
                setSelectedCategory={setCategory}
                selectedQuestion={question}
                setSelectedQuestion={setQuestion}
              />
            </Col>
            <Col className="border-start">
              <BasicQuestionViewer
                categories={categories}
                selectedCategory={category}
                selectedQuestion={question}
                updateQuestion={updateQuestion}
              />
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  )
}
