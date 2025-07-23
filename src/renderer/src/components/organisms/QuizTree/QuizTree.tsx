import React, { FormEvent } from 'react'
import { Accordion, Button, Form } from 'react-bootstrap'
import CategoriesAccordionItem from '@renderer/components/molecules/QuizTreeItem'
import { Category } from '@renderer/types'
import { useAddCategoryMutation } from '@renderer/hooks/useAddCategoryMutation'

const AddCategoryForm = () => {
  const mutation = useAddCategoryMutation()
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const form = event.target as HTMLFormElement
    const data = new FormData(form)
    await mutation.mutateAsync(data.get('name') as string)
    form.reset()
  }
  return (
    <Form className="d-flex gap-2 mb-2" onSubmit={handleSubmit}>
      <Form.Control
        type="text"
        name="name"
        placeholder="Add new category"
        readOnly={mutation.isPending}
      />
      <Button type="submit" variant="primary" disabled={mutation.isPending}>
        Add
      </Button>
    </Form>
  )
}

type QuizTreeProps = {
  categories: Category[]
  setSelectedCategory: (id: number | null) => void
  setSelectedQuestion: (id: number | null) => void
  editable: boolean
}

const QuizTree: React.FC<QuizTreeProps> = ({
  categories,
  setSelectedCategory,
  setSelectedQuestion,
  editable
}) => {
  return (
    <div className="d-flex flex-column">
      <h3>Categories ({categories.length})</h3>
      {editable && <AddCategoryForm />}
      {/* <div style={{ flex: 'grow' }}> */}
      <Accordion flush className="me-1 overflow-scroll">
        {categories.map((category) => (
          <CategoriesAccordionItem
            key={category.id}
            category={category}
            onOpen={() => {
              setSelectedCategory(category.id)
              setSelectedQuestion(null)
              window.electron.ipcRenderer.invoke('set-quiz-view', 'questions')
            }}
            onSelectQuestion={(id) => setSelectedQuestion(id)}
            onClose={() => {
              setSelectedCategory(null)
              setSelectedQuestion(null)
              window.electron.ipcRenderer.invoke('set-quiz-view', 'categories')
            }}
            editable={editable}
          />
        ))}
        {categories.length === 0 && (
          <Accordion.Item eventKey="0">
            <Accordion.Body>No categories</Accordion.Body>
          </Accordion.Item>
        )}
      </Accordion>
      {/* </div> */}
    </div>
  )
}

export default QuizTree
