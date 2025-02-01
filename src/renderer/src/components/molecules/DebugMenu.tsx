import React from "react";
import { useCategories } from "../../hooks/useCategories";
import { Dropdown } from "react-bootstrap";
import { Bug, ExclamationTriangleFill, Github, QuestionOctagon, Trash } from "react-bootstrap-icons";

const DebugMenu: React.FC = () => {
  const { loadQuizData } = useCategories();
  return (
    <>
          <Dropdown align="end" drop="up">
            <Dropdown.Toggle id="debug-dropdown" size="sm">
              <Bug className="me-2"/> Debug
            </Dropdown.Toggle>
            <Dropdown.Menu >
              <Dropdown.Item
                href="#"
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
              >
                <Trash className="me-2"/> Clear Local Storage
              </Dropdown.Item>
              <Dropdown.Item
                href="#"
                onClick={async () => {
                  localStorage.clear();
                  console.log("Loading mock quiz");
                  const mockData = await window.electron.ipcRenderer.invoke('read-mock-file', 'mocks/mockQuiz.json');
                  await loadQuizData(mockData);
                  window.location.reload();
                }}              >
                <QuestionOctagon className="me-2"/>Load Mock Quiz
              </Dropdown.Item>
              <Dropdown.Item
                href="#"
                onClick={async () => {
                  localStorage.clear();
                  console.log("Loading mock quiz");
                  const mockData = await window.electron.ipcRenderer.invoke('read-mock-file', 'mocks/big_mockQuiz.json');
                  await loadQuizData(mockData);
                  window.location.reload();
                }}
              >
              <ExclamationTriangleFill style={{ color: "red" }} className="me-2"/>
                Load BIG Quiz
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item href="#">
                <Github/> Submit Bug Report
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
    </>
  );
};

export default DebugMenu;
