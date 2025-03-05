import React from "react";
import { Accordion, Button, Form } from "react-bootstrap";
import { useLocalStorage } from "../../../hooks/useLocalStorage";
import {
  CategoriesContextType,
  Category,
  Question,
} from "../../../context/categories";
import { CameraFill, PlusLg, Trash } from "react-bootstrap-icons";

interface QuizTreeProps extends CategoriesContextType {
  selectedCategory: Category | null;
  setSelectedCategory: (category: Category | null) => void;
  selectedQuestion: Question | null;
  setSelectedQuestion: (question: Question | null) => void;
}

const QuizTree: React.FC<QuizTreeProps> = ({
  categories,
  addCategory,
  deleteCategory,
  updateCategory,
  addQuestion,
  selectedCategory,
  setSelectedCategory,
  setSelectedQuestion,
}) => {
  const [currentView, setCurrentView] = useLocalStorage<string>(
    "currentView",
    "start"
  );
  return (
    <div className="d-flex flex-column">
      <h3>Categories ({categories.length})</h3>
      <Form className="d-flex gap-2 mb-2" onSubmit={addCategory}>
        <Form.Control type="text" name="name" placeholder="Add new category" />
        <Button type="submit" variant="primary">
          Add
        </Button>
      </Form>
      <div style={{flex: "grow"}}>
        <Accordion flush className="me-1">
          {categories.map((category) => (
            <Accordion.Item key={category.cID} eventKey={category.cID}>
              <Accordion.Header
                onClick={() => {
                  setSelectedCategory(category);
                  setCurrentView("questions");
                  setSelectedQuestion(null);
                }}
              >
                <strong>
                  {category.name} ({
                      category.questions.filter(
                        (question) => question.used === false
                      ).length
                    }
                    /{category.questions.length})
                </strong>
              </Accordion.Header>
              <Accordion.Body
              onExited={() => {
                setCurrentView("categories");
              }}
              >
                <div className="d-flex mb-2">
                  <Form.Control
                    className="me-2"
                    name="name"
                    type="text"
                    defaultValue={category.name || ""}
                    onChange={(e) => {
                      updateCategory(selectedCategory?.cID, e);
                    }}
                  />
                  <Button
                    variant="outline-danger"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Are you sure you want to delete category "${selectedCategory?.name}" and all its questions?`
                        )
                      ) {
                        deleteCategory(selectedCategory?.cID);
                      }
                    }}
                  >
                    <Trash />
                  </Button>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {category.questions.map((question) => (
                    <Button
                      key={question.qID}
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => {
                        setSelectedQuestion(question);
                        setCurrentView("single");
                      }}
                    >
                      {category.questions.indexOf(question) + 1}
                      <span className="ms-1">
                        <CameraFill className={
                          !question.media ? "opacity-50" : ""
                        } />
                      </span>
                    </Button>
                  ))}                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      alert(
                        "Not implemented yet!\n" +
                          "This will add a new question to \n" +
                          "category: " +
                          category.name +
                          "\n" +
                          "cID: " +
                          category.cID +
                          "\n"
                      );
                      addQuestion({
                        cID: selectedCategory?.cID,
                      });
                    }}
                  >
                    <PlusLg />
                  </Button>
                </div>
              </Accordion.Body>
            </Accordion.Item>
          ))}
          {categories.length === 0 && (
            <Accordion.Item eventKey="0">
              <Accordion.Body>No categories</Accordion.Body>
            </Accordion.Item>
          )}
        </Accordion>
      </div>
    </div>
  );
};

export default QuizTree;
