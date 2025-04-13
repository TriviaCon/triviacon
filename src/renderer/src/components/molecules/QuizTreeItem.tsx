import useCategoryQuestions from '@renderer/hooks/useCategoryQuestions'
import { Category } from '@renderer/types'
import { useState } from 'react'
import { Accordion, Button, Form } from 'react-bootstrap'
import { CameraFill, PlusLg, Trash } from 'react-bootstrap-icons'

const DeleteCategoryButton = ({
  name,
  onDelete
}: {
  name: string
  onDelete: () => Promise<unknown>
}) => {
  const [pending, setPending] = useState(false)
  const handleClick = async () => {
    if (
      !window.confirm(`Are you sure you want to delete category "${name}" and all its questions?`)
    ) {
      return
    }

    setPending(true)
    await onDelete()
    setPending(false)
  }
  return (
    <Button variant="outline-danger" onClick={handleClick} disabled={pending}>
      <Trash />
    </Button>
  )
}

const CategoriesAccordionItem = ({
  category,
  onOpen,
  onSelectQuestion,
  onClose,
  onDelete,
  onAddQuestion
}: {
  category: Category
  onOpen: VoidFunction
  onSelectQuestion: (id: number) => void
  onClose: VoidFunction
  onDelete: () => Promise<unknown>
  onAddQuestion: VoidFunction
}) => {
  const { questions } = useCategoryQuestions(category.id)
  return (
    <Accordion.Item eventKey={`${category.id}`}>
      <Accordion.Header onClick={onOpen}>
        <strong>
          {category.name} ({questions.filter((question) => question.used === false).length}/
          {questions.length})
        </strong>
      </Accordion.Header>
      <Accordion.Body onExited={onClose}>
        <div className="d-flex mb-2">
          <Form.Control
            className="me-2"
            name="name"
            type="text"
            defaultValue={category.name || ''}
            onChange={() => {
              alert('todo')
              // updateCategory(selectedCategory?.cID, e)
            }}
          />
          <DeleteCategoryButton name={category.name} onDelete={onDelete} />
        </div>
        <div className="d-flex flex-wrap gap-2">
          {questions.map((question) => (
            <Button
              key={question.id}
              variant="outline-secondary"
              size="sm"
              onClick={() => {
                onSelectQuestion(question.id)
              }}
            >
              {questions.indexOf(question) + 1}
              <span className="ms-1">
                <CameraFill className={!question.media ? 'opacity-50' : ''} />
              </span>
            </Button>
          ))}{' '}
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              alert(
                'Not implemented yet!\n' +
                  'This will add a new question to \n' +
                  'category: ' +
                  category.name +
                  '\n' +
                  'cID: ' +
                  category.id +
                  '\n'
              )
              onAddQuestion()
            }}
          >
            <PlusLg />
          </Button>
        </div>
      </Accordion.Body>
    </Accordion.Item>
  )
}

export default CategoriesAccordionItem
