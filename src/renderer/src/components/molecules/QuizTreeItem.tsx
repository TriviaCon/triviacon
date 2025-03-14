import { Category } from '@renderer/context/categories'
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
  onSelectQuestion: (id: string) => void
  onClose: VoidFunction
  onDelete: () => Promise<unknown>
  onAddQuestion: VoidFunction
}) => {
  return (
    <Accordion.Item eventKey={category.cID}>
      <Accordion.Header onClick={onOpen}>
        <strong>
          {category.name} ({category.questions.filter((question) => question.used === false).length}
          /{category.questions.length})
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
          {category.questions.map((question) => (
            <Button
              key={question.qID}
              variant="outline-secondary"
              size="sm"
              onClick={() => {
                onSelectQuestion(question.qID)
              }}
            >
              {category.questions.indexOf(question) + 1}
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
                  category.cID +
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
