import React from "react";
import { useLocalStorage } from "../../../hooks/useLocalStorage";
import { useCategories } from "../../../hooks/useCategories";
import { Card, Col, Container, Row, Image } from "react-bootstrap";

const Categories: React.FC = () => {
  const [categories, setCategories] = useLocalStorage<Category[]>(
    "categories",
    []
  );
  return (
    <>
      <div style={{ textAlign: "center" }}>
        <h1>CATEGORIES</h1>
        <hr />
      </div>
      <Container fluid>
        <Row
          xs={1}
          sm={2}
          md={3}
          lg={6}
          className="g-2 justify-content-center align-items-stretch"
        >
          {categories.map((category) => (
            <Col key={category.id} className="d-flex">
              <Card className="w-100" style={{ backgroundColor: category.questions.filter(q => q.used === false).length === 0 ? '#ccc' : undefined }}>
                <Card.Body className="d-flex flex-column">
                  <Card.Title className="h4 mb-1 text-center">
                    <strong>{category.name}</strong>
                  </Card.Title>
                  <Card.Text className="flex-grow-1 text-center">
                    {
                      category.questions.filter(
                        (question) => question.used === false
                      ).length
                    }
                    &nbsp;/&nbsp;{category.questions.length}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}        
          </Row>
      </Container>
    </>
  );
};

export default Categories;
