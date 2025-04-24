import { Button, Card, Form } from 'react-bootstrap'
import { CloudUpload, Trash } from 'react-bootstrap-icons'
import toBase64 from '@renderer/utils/toBase64'
import { useQuestion } from '@renderer/hooks/useQuestion'
import { Question } from '@renderer/types'
import { useUpdateQuestionMutation } from '@renderer/hooks/useUpdateQuestionMutation'
import { useHints } from '@renderer/hooks/useHints'
import { useUpdateHintMutation } from '@renderer/hooks/useUpdateHintMutation'
import { useDeleteHintMutation } from '@renderer/hooks/useDeleteHintMutation'
import { useAddHintMutation } from '@renderer/hooks/useAddHintMutation'

const QuestionView = ({ id }: { id: number }) => {
  const question = useQuestion(id)
  const hints = useHints(id)
  const addHint = useAddHintMutation(id)
  const updateHint = useUpdateHintMutation(id)
  const deleteHint = useDeleteHintMutation(id)
  const updateQuestionMutation = useUpdateQuestionMutation(id)

  const update = (q: Partial<Question>) => updateQuestionMutation.mutate(q)

  if (!question.data || !hints.data) {
    return 'loading...'
  }

  return (
    <div className="h-100 d-flex flex-column">
      <h2>
        {/* Question ({category.name},{' '} */}
        {/* {category.questions.findIndex((question) => question.qID === qID) + 1}/ */}
        {/* {category.questions.length}) */}
      </h2>
      <Form>
        <Form.Group className="mb-1">
          <Form.Label htmlFor="question">Question:</Form.Label>
          <Form.Control
            type="text"
            id="question"
            value={question.data.text}
            onChange={(e) => update({ text: e.target.value })}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label htmlFor="answer">Answer:</Form.Label>
          <Form.Control
            type="text"
            id="answer"
            value={question.data.answer}
            onChange={(e) => update({ answer: e.target.value })}
          />
        </Form.Group>
        <Card className="mb-3">
          <Card.Body className="py-1 px-2">
            <h6 className="mt-0">Media:</h6>
            <Card
              style={{
                // width: '320px',
                // height: '240px',
                flexShrink: 0,
                flexGrow: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              {question.data.media && <img style={{ width: '100%' }} src={question.data.media} />}
              <Card.Body className="py-1 px-2 d-flex justify-content-center align-items-center">
                <div
                  className="drag-upload-area"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={async (e) => {
                    e.preventDefault()
                    const file = e.dataTransfer.files[0]
                    if (file && question) {
                      update({ media: await toBase64(file) })
                    }
                  }}
                  style={{
                    border: '2px dashed #007bff',
                    borderRadius: '4px',
                    padding: '20px',
                    textAlign: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <CloudUpload size={32} />
                  <p>Drag and drop your file here or click to select</p>
                  <input
                    type="file"
                    accept="image/*, video/*, audio/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (file && question) {
                        update({ media: await toBase64(file) })
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                </div>
              </Card.Body>
            </Card>{' '}
            <Form.Control
              type="text"
              id="media"
              value={question.data.media}
              onChange={(e) => update({ media: e.target.value })}
            />
          </Card.Body>
        </Card>
        <Card>
          <Card.Body className="py-1 px-2">
            <h6 className="mt-0 d-flex justify-content-between align-items-center">
              Hints
              <Button size="sm" className="ms-auto" onClick={() => addHint.mutate()}>
                Add
              </Button>
            </h6>
            <Form.Group className="mb-3">
              {hints.data.map((hint, index) => (
                <div key={index} className="d-flex align-items-center mb-2">
                  <Form.Label htmlFor={`hint-${index}`} className="me-2 mb-0">
                    <strong>#{index + 1}:</strong>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    id={`hint-${index}`}
                    value={hint.hint}
                    onChange={(e) => {
                      updateHint.mutate({ id: hint.id, hint: e.target.value })
                    }}
                  />
                  <Button
                    variant="outline-danger"
                    className="ms-2"
                    onClick={() => deleteHint.mutate(hint.id)}
                  >
                    <Trash size={16} />
                  </Button>
                </div>
              ))}
            </Form.Group>
          </Card.Body>
        </Card>
      </Form>
    </div>
  )
}
export default QuestionView
