import { Hint, Question } from '@renderer/types'
import { Alert, Card, Col, Container, Form, Row, ToggleButton } from 'react-bootstrap'

const BasicQuestionViewer = ({
  question,
  hints,
  answerRevealed,
  onRevealAnswer,
  hintsRevealed,
  onRevealHints,
  used,
  onUse
}: {
  question: Question
  hints: Hint[]
  answerRevealed: boolean
  onRevealAnswer: VoidFunction
  hintsRevealed: boolean
  onRevealHints: VoidFunction
  used: boolean
  onUse: VoidFunction
}) => {
  return (
    <Container>
      <Row>
        <Col xs={12}>
          <h2>{question.text}</h2>
        </Col>
      </Row>
      <Row>
        <Col xs={12}>
          <h3>{question.answer}</h3>
        </Col>
      </Row>
      <Row className="mb-1">
        <Col xs={3}>
          <strong>Media</strong>
        </Col>
        <Col xs={9}>
          <Card className="mb-2">
            <Card.Body>
              <Row>
                <Col>
                  <img src={question.media} />
                </Col>
                <Col className="border-start">
                  Controls
                  <Row>
                    <Col>
                      <ToggleButton type="checkbox" variant="secondary" value="1">
                        Fullscreen
                      </ToggleButton>
                    </Col>
                    <Col></Col>
                  </Row>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <Row>
        <Col xs={3}>
          <strong>Reveal Hints</strong>
        </Col>
        <Col xs={9}>
          <Form.Check
            type="switch"
            id="revealhints-switch"
            name="revealHints"
            label={hintsRevealed ? 'Yes' : 'No'}
            checked={hintsRevealed}
            onChange={onRevealHints}
          />
        </Col>
      </Row>
      <Row>
        <Col xs={3}>
          <strong>Hints</strong>
        </Col>
        <Col xs={9}>
          {hints.length > 0
            ? hints.map((hint, index) => (
                <Alert key={index} variant="info" className="mb-2">
                  {hint.hint}
                </Alert>
              ))
            : 'No hints'}
        </Col>
      </Row>
      <Row>
        <Col xs={3}>
          <strong>Used</strong>
        </Col>
        <Col xs={9}>
          <Form.Check
            type="switch"
            id="used-switch"
            name="used"
            label={used ? 'Yes' : 'No'}
            checked={used}
            onChange={onUse}
          />
        </Col>
      </Row>
      <Row>
        <Col xs={3}>
          <strong>Reveal Answer</strong>
        </Col>
        <Col xs={9}>
          <Form.Check
            type="switch"
            name="answerRevealed"
            id="answer-reveal-switch"
            label={answerRevealed ? 'Yes' : 'No'}
            checked={answerRevealed}
            onChange={onRevealAnswer}
          />
        </Col>
      </Row>
    </Container>
  )
}

export default BasicQuestionViewer
