import React from "react";
import { useLocalStorage } from "../../../hooks/useLocalStorage";
import { Card } from "react-bootstrap";
import Categories from "./Categories";
import SingleQuestionView from "./SingleQuestion";
import RankingView from "./Ranking";
import StartScreen from "./Start";
import Questions from "./Questions";

const ScreenView: React.FC = () => {
  const [currentView] = useLocalStorage("currentView", "default");
  const viewComponents = {
    categories: <Categories />,
    questions: <Questions />,
    single: <SingleQuestionView />,
    ranking: <RankingView />,
    default: <StartScreen />,
  };

  React.useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "currentView" && event.newValue !== currentView) {
        console.log("Storage event triggered for currentView");
        window.location.reload();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [currentView]);

  const renderView = () => {
    return viewComponents[currentView] || viewComponents.default;
  };

  return (
    <Card className="flex-grow-1 d-flex flex-column">
      <Card.Body className="flex-grow-1 d-flex flex-column">
        {renderView()}
      </Card.Body>
    </Card>
  );
};

export default ScreenView;
