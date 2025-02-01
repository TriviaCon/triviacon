import React from "react";
import { Card, Col, Container, Row, Image } from "react-bootstrap";
import { useLocalStorage } from "../../../hooks/useLocalStorage";
import { Category, Question } from "../../../context/categories";

const SingleQuestionView: React.FC = () => {
  // const [category] = useLocalStorage<Category | null>("selectedCategory", null);
  const [question] = useLocalStorage<Question | null>("selectedQuestion", null);

  return (
    <Container fluid className="d-flex justify-content-space-between">
      <Col className="text-center justify-content-space-between">
        <h1 className="display-4 mb-4">{question?.text}</h1>
        {question?.media && 
          <Image src={"https://via.assets.so/img.jpg?w=1280&h=720&tc=blue&bg=#cecece"} fluid className="mt-1 mb-1" />
        }
        
        <h1
          className="display-1"
          style={{
            visibility: question?.answerRevealed ? "visible" : "hidden",
          }}
        >
          <strong>{question?.answer}</strong>
        </h1>

        {question?.hints && question.hints.length > 0 && (
          <Row
            className="mt-3"
            style={{
              visibility: question?.hintsRevealed ? "visible" : "hidden",
            }}
          >
            {question.hints.map((hint, index) => (
              <Col key={index} xs={12} sm={6} className="mb-3">
                <Card bg="light" text="dark">
                  <Card.Body>
                    <Card.Text className="h1">{hint}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Col>
    </Container>
  );
};

export default SingleQuestionView;
