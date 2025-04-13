import { Button, Card, Form } from 'react-bootstrap'
import { CloudUpload } from 'react-bootstrap-icons'
import useQuestion from '@renderer/hooks/useQuestion'

const QuestionView = ({ id }: { id: number }) => {
  const { question, updateText, updateAnswer, updateMedia, addHint, deleteHint, updateHint } =
    useQuestion(id)

  if (!question) {
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
            value={question.text}
            onChange={(e) => {
              updateText(e.target.value)
            }}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label htmlFor="answer">Answer:</Form.Label>
          <Form.Control
            type="text"
            id="answer"
            value={question.answer}
            onChange={(e) => updateAnswer(e.target.value)}
          />
        </Form.Group>
        <Card className="mb-3">
          <Card.Body className="py-1 px-2">
            <h6 className="mt-0">Media:</h6>
            <Card
              style={{
                width: '320px',
                height: '240px',
                flexShrink: 0,
                flexGrow: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <Card.Body className="py-1 px-2 d-flex justify-content-center align-items-center">
                <div
                  className="drag-upload-area"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    const file = e.dataTransfer.files[0]
                    if (file && question) {
                      const fileExtension = file.name.split('.').pop()
                      const qIDLastSection = question.id.split('-').pop()
                      const newFileName = `${qIDLastSection}.${fileExtension}`
                      const relativePath = `media/${newFileName}`
                      updateMedia(relativePath)
                      console.log(`New file name: ${newFileName}`)
                      console.log(`Relative path: ${relativePath}`)
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
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file && question) {
                        const fileExtension = file.name.split('.').pop()
                        const qIDLastSection = question.qID.split('-').pop()
                        const newFileName = `${qIDLastSection}.${fileExtension}`
                        const relativePath = `media/${newFileName}`
                        updateMedia(relativePath)
                        console.log(`New file name: ${newFileName}`)
                        console.log(`Relative path: ${relativePath}`)
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
              value={question.media}
              onChange={(e) => updateMedia(e.target.value)}
            />
          </Card.Body>
        </Card>
        <Card>
          <Card.Body className="py-1 px-2">
            <h6 className="mt-0 d-flex justify-content-between align-items-center">
              Hints
              <Button size="sm" className="ms-auto" onClick={addHint}>
                Add
              </Button>
            </h6>
            {/* <Form.Group className="mb-3"> */}
            {/*   {question.hints.length > 0 */}
            {/*     ? question.hints.map((hint, index) => ( */}
            {/*         <div key={index} className="d-flex align-items-center mb-2"> */}
            {/*           <Form.Label htmlFor={`hint-${index}`} className="me-2 mb-0"> */}
            {/*             <strong>#{index + 1}:</strong> */}
            {/*           </Form.Label> */}
            {/*           <Form.Control */}
            {/*             type="text" */}
            {/*             id={`hint-${index}`} */}
            {/*             value={hint} */}
            {/*             onChange={(e) => updateHint(index, e.target.value)} */}
            {/*           /> */}
            {/*           <Button */}
            {/*             variant="outline-danger" */}
            {/*             className="ms-2" */}
            {/*             onClick={() => deleteHint(index)} */}
            {/*           > */}
            {/*             <Trash size={16} /> */}
            {/*           </Button> */}
            {/*         </div> */}
            {/*       )) */}
            {/*     : null} */}
            {/* </Form.Group> */}
          </Card.Body>
        </Card>
      </Form>
    </div>
  )
}
export default QuestionView
