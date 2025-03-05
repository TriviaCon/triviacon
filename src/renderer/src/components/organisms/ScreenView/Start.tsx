import React from "react";
import { useLocalStorage } from "../../../hooks/useLocalStorage";
import { Col, Container, Row, Image } from "react-bootstrap";

const StartScreen: React.FC = () => {
  const [quizInfo] = useLocalStorage("quizInfo", null);
  return (
    <>
      <Container fluid className="h-100 d-flex align-items-center">
        <Row className="d-flex align-items-center w-100">
          <Col xs="auto" className="d-flex justify-content-center">
            {(() => {
              const [imageLoaded, setImageLoaded] = React.useState(false);
              React.useEffect(() => {
                const img = new window.Image();
                img.onload = () => setImageLoaded(true);
                img.src = "https://placehold.co/1280x720";
              }, []);

              return imageLoaded ? (
                <Image src="https://placehold.co/1280x720" alt="Logo" fluid />
              ) : (
                <div>Loading image...</div>
              );
            })()}
          </Col>
          <Col className="d-flex align-items-center flex-grow-1">
            <Col className="d-flex flex-column justify-content-center text-center">
              <h1 style={{ fontSize: "8rem" }}>{quizInfo?.quizName}</h1>
              <h2 style={{ fontSize: "5rem" }}>{quizInfo?.quizLocation}</h2>
              <h2>{quizInfo?.quizDate}</h2>
              <h3 style={{ fontSize: "3rem" }}>by: {quizInfo?.quizAuthor}</h3>
            </Col>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default StartScreen;
