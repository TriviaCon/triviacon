import React from "react";
import { Button } from "react-bootstrap";
import { useCategories } from "../../../hooks/useCategories";
import { FileEarmarkPlus, Floppy, Play, PlayFill, Upload } from "react-bootstrap-icons";

interface ActionBarProps {
  activeTab: string;
}

const ActionBar: React.FC<ActionBarProps> = ({ activeTab }) => {
  const { loadQuizData } = useCategories();
  return (
    <div className="d-flex mb-2 pb-2 border-bottom">
      {activeTab === "builder" ? (
        <>
          <Button
            variant="primary"
            className="me-1"
            onClick={() => {
              if (
                confirm(
                  "Create a new, empty Quiz? \n\nUnsaved changes will be lost!"
                )
              ) {
                localStorage.clear();
                loadQuizData("/blankQuiz.json");
                window.location.reload();
              }
            }}
          >
            <FileEarmarkPlus/> New Quiz
          </Button>
          <Button
            variant="warning"
            className="me-1"
            onClick={() =>
              confirm("Load a Quiz? \n\nUnsaved changes will be lost!")
            }
          >
            <Upload className="me-1"/>Load Quiz
          </Button>
          <Button
            variant="success"
            onClick={() =>
              alert("Quiz {quizName_quizDate} saved successfully!")
            }
          >
            <Floppy className="me-1"/>Save Quiz
          </Button>
        </>
      ) : (
        <Button
          variant="danger"
          className="me-1"
          onClick={() => {
            if (confirm("Run the quiz?")) {
              window.electron.ipcRenderer.send('open-screen')
            } else {
              alert("Quiz {quizName_quizDate} cancelled!");
            }
          }}
        >
          <PlayFill className="me-1"/>
          <strong>RUN QUIZ</strong>
        </Button>
      )}
    </div>
  );
};

export default ActionBar;
