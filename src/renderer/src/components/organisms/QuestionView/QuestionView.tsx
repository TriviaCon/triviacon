import { Button, Card, Form } from "react-bootstrap";
import { Category, Question } from "../../../context/categories";
import { useLocalStorage } from "../../../hooks/useLocalStorage";
import { CloudUpload, Trash } from "react-bootstrap-icons";

interface QuestionViewProps {
  selectedCategory: Category | null;
  selectedQuestion: Question | null;
  categories: Category[];
}

const QuestionView: React.FC<QuestionViewProps> = ({
  selectedCategory,
  selectedQuestion,
}) => {
  const [question, setQuestion] = useLocalStorage("question", "");
  const [answer, setAnswer] = useLocalStorage("answer", "");
  const [media, setMedia] = useLocalStorage("media", "");
  const [hints, setHints] = useLocalStorage<string[]>("hints", []);

  if (!selectedQuestion) {
    return (
      <h2>
        {selectedCategory
          ? `Question (${selectedCategory?.name ?? "Uncategorized"})`
          : "Question"}
      </h2>
    );
  }

  const handleAddHint = () => {
    if (selectedQuestion) {
      const newHints = [...(selectedQuestion.hints || []), ""];
      selectedQuestion.hints = newHints;
      setHints(newHints);
    }
  };

  const handleRemoveHint = (index: number) => {
    if (selectedQuestion && selectedQuestion.hints) {
      const newHints = [...selectedQuestion.hints];
      newHints.splice(index, 1);
      selectedQuestion.hints = newHints;
      setHints(newHints);
    }
  };

  const handleHintChange = (index: number, value: string) => {
    if (selectedQuestion && selectedQuestion.hints) {
      const newHints = [...selectedQuestion.hints];
      newHints[index] = value;
      selectedQuestion.hints = newHints;
      setHints(newHints);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (file && selectedQuestion) {
      const fileExtension = file.name.split(".").pop();
      const qIDLastSection = selectedQuestion.qID.split("-").pop();
      const newFileName = `${qIDLastSection}.${fileExtension}`;
      const relativePath = `media/${newFileName}`;

      try {
        // Request permission to access the file system
        const dirHandle = await window.showDirectoryPicker();

        // Create or access the 'media' folder
        const mediaHandle = await dirHandle.getDirectoryHandle("media", {
          create: true,
        });

        // Create a new file in the 'media' folder
        const newFileHandle = await mediaHandle.getFileHandle(newFileName, {
          create: true,
        });

        // Write the file content
        const writable = await newFileHandle.createWritable();
        await writable.write(file);
        await writable.close();

        setMedia(relativePath);
        console.log(`File saved: ${relativePath}`);
      } catch (error) {
        console.error("Error saving file:", error);
      }
    }
  };
  return (
    <div className="h-100 d-flex flex-column">
      <h2>
        {selectedCategory
          ? `Question (${selectedCategory?.name ?? "Uncategorized"}, ${
              selectedCategory?.questions.findIndex(
                (question) => question.qID === selectedQuestion.qID
              ) + 1
            }/${selectedCategory?.questions.length})`
          : "Question"}
      </h2>
      <Form>
        <Form.Group className="mb-1">
          <Form.Label htmlFor="question">Question:</Form.Label>
          <Form.Control
            type="text"
            id="question"
            value={selectedQuestion.text}
            onChange={(e) => {
              const updatedQuestion = {
                ...selectedQuestion,
                text: e.target.value,
              };
              setQuestion(updatedQuestion);
            }}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label htmlFor="answer">Answer:</Form.Label>
          <Form.Control
            type="text"
            id="answer"
            value={selectedQuestion.answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
        </Form.Group>
        <Card className="mb-3">
          <Card.Body className="py-1 px-2">
            <h6 className="mt-0">Media:</h6>
            <Card
              style={{
                width: "320px",
                height: "240px",
                flexShrink: 0,
                flexGrow: 0,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Card.Body className="py-1 px-2 d-flex justify-content-center align-items-center">
                <div
                  className="drag-upload-area"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file && selectedQuestion) {
                      const fileExtension = file.name.split(".").pop();
                      const qIDLastSection = selectedQuestion.qID
                        .split("-")
                        .pop();
                      const newFileName = `${qIDLastSection}.${fileExtension}`;
                      const relativePath = `media/${newFileName}`;
                      setMedia(relativePath);
                      console.log(`New file name: ${newFileName}`);
                      console.log(`Relative path: ${relativePath}`);
                    }
                  }}
                  style={{
                    border: "2px dashed #007bff",
                    borderRadius: "4px",
                    padding: "20px",
                    textAlign: "center",
                    cursor: "pointer",
                  }}
                >
                  <CloudUpload size={32} />
                  <p>Drag and drop your file here or click to select</p>
                  <input
                    type="file"
                    accept="image/*, video/*, audio/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && selectedQuestion) {
                        const fileExtension = file.name.split(".").pop();
                        const qIDLastSection = selectedQuestion.qID
                          .split("-")
                          .pop();
                        const newFileName = `${qIDLastSection}.${fileExtension}`;
                        const relativePath = `media/${newFileName}`;
                        setMedia(relativePath);
                        console.log(`New file name: ${newFileName}`);
                        console.log(`Relative path: ${relativePath}`);
                      }
                    }}
                    style={{ display: "none" }}
                  />
                </div>
              </Card.Body>
            </Card>{" "}
            <Form.Control
              type="text"
              id="media"
              value={selectedQuestion.media}
              onChange={(e) => setMedia(e.target.value)}
            />
          </Card.Body>
        </Card>
        <Card>
          <Card.Body className="py-1 px-2">
            <h6 className="mt-0 d-flex justify-content-between align-items-center">
              Hints
              <Button size="sm" className="ms-auto" onClick={handleAddHint}>
                Add
              </Button>
            </h6>
            <Form.Group className="mb-3">
              {selectedQuestion.hints.length > 0
                ? selectedQuestion.hints.map((hint, index) => (
                    <div key={index} className="d-flex align-items-center mb-2">
                      <Form.Label
                        htmlFor={`hint-${index}`}
                        className="me-2 mb-0"
                      >
                        <strong>#{index + 1}:</strong>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        id={`hint-${index}`}
                        value={hint}
                        onChange={(e) =>
                          handleHintChange(index, e.target.value)
                        }
                      />
                      <Button
                        variant="outline-danger"
                        className="ms-2"
                        onClick={() => handleRemoveHint(index)}
                      >
                        <Trash size={16} />
                      </Button>
                    </div>
                  ))
                : null}
            </Form.Group>
          </Card.Body>
        </Card>
      </Form>
    </div>
  );
};
export default QuestionView;
