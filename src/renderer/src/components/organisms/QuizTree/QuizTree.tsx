import React, { FormEvent, useState } from 'react'
import { Accordion, Button, Form } from 'react-bootstrap'
import { useLocalStorage } from '../../../hooks/useLocalStorage'
import { CategoriesContextType, Category, Question } from '../../../context/categories'
import CategoriesAccordionItem from '@renderer/components/molecules/QuizTreeItem'

const AddCategoryForm = ({ onAdd }: { onAdd: (name: string) => Promise<unknown> }) => {
  const [pending, setPending] = useState(false)
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const form = event.target as HTMLFormElement
    const data = new FormData(form)
    setPending(true)
    await onAdd(data.get('name') as string)
    form.reset()
    setPending(false)
  }
  return (
    <Form className="d-flex gap-2 mb-2" onSubmit={handleSubmit}>
      <Form.Control type="text" name="name" placeholder="Add new category" readOnly={pending} />
      <Button type="submit" variant="primary" disabled={pending}>
        Add
      </Button>
    </Form>
  )
}

interface QuizTreeProps extends CategoriesContextType {
  selectedCategory: Category | null
  setSelectedCategory: (category: Category | null) => void
  selectedQuestion: Question | null
  setSelectedQuestion: (question: Question | null) => void
}

const QuizTree: React.FC<QuizTreeProps> = ({
  categories,
  addCategory,
  deleteCategory,
  addQuestion,
  setSelectedCategory,
  setSelectedQuestion
}) => {
  const [currentView, setCurrentView] = useLocalStorage<string>('currentView', 'start')
  return (
    <div className="d-flex flex-column">
      <h3>Categories ({categories.length})</h3>
      <AddCategoryForm onAdd={addCategory} />
      <div style={{ flex: 'grow' }}>
        <Accordion flush className="me-1">
          {categories.map((category) => (
            <CategoriesAccordionItem
              key={category.cID}
              category={category}
              onOpen={() => {
                setSelectedCategory(category)
                setCurrentView('questions')
                setSelectedQuestion(null)
              }}
              onSelectQuestion={(id) => {
                setSelectedQuestion(category.questions.find((q) => q.qID === id)!)
                setCurrentView('single')
              }}
              onClose={() => {
                setCurrentView('categories')
              }}
              onDelete={() => deleteCategory(category.cID)}
              onAddQuestion={() => {
                addQuestion({
                  cID: category.cID
                })
              }}
            />
          ))}
          {categories.length === 0 && (
            <Accordion.Item eventKey="0">
              <Accordion.Body>No categories</Accordion.Body>
            </Accordion.Item>
          )}
        </Accordion>
      </div>
    </div>
  )
}

export default QuizTree
