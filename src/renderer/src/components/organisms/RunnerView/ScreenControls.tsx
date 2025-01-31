import { Button, Alert } from "react-bootstrap";
import { useLocalStorage } from "../../../hooks/useLocalStorage";

const ScreenControls = () => {
  const [currentView, setCurrentView] = useLocalStorage("currentView", "start");
  return (
    <Alert variant="dark" className="d-inline-block p-1">
      <div className="d-flex align-items-center">
        <h2 className="me-3">Quiz Controls</h2>
        <div className="d-flex">
          <Button
            variant={
              currentView === "start" ? "secondary" : "outline-secondary"
            }
            className="me-1"
            onClick={() => setCurrentView("start")}
          >
            Start Screen
          </Button>
          <Button
            variant={
              currentView === "ranking" ? "secondary" : "outline-secondary"
            }
            className="me-1"
            onClick={() => setCurrentView("ranking")}
          >
            Ranking
          </Button>
          <Button
            variant={
              currentView === "categories" ? "secondary" : "outline-secondary"
            }
            className="me-1"
            onClick={() => setCurrentView("categories")}
          >
            Categories
          </Button>
          <Button
            variant={
              currentView === "questions" ? "secondary" : "outline-secondary"
            }
            className="me-1"
            onClick={() => setCurrentView("questions")}
          >
            Questions Grid
          </Button>
          <Button
            variant={
              currentView === "single" ? "secondary" : "outline-secondary"
            }
            className="me-1"
            onClick={() => setCurrentView("single")}
          >
            Question
          </Button>
        </div>
      </div>
    </Alert>
  );
};
export default ScreenControls;
