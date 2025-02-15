import React, { useState } from "react";
import Logo from "../atoms/logo";
import './Header.css'
import { Button, Container, Navbar } from "react-bootstrap";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { QuestionCircleFill, XLg } from "react-bootstrap-icons";
import DebugMenu from "./DebugMenu";
import { CreditsModal } from "./CreditsModal";


const Header: React.FC<{ isScreen: boolean }> = ({ isScreen }) => {
  const [currentTeam] = useLocalStorage("currentTeam", null); // Replace with actual current team value or state
  const [showCredits, setShowCredits] = useState(false);

  return (
    <Container fluid className="pb-1 ">
      <Navbar bg="dark" variant="dark" className="mb-1 px-3 draggable d-flex justify-content-between">
        <Logo bg="transparent" />
        {isScreen ? (
          <>
            <h1
              style={{
                display: "flex",
                color: "#FFFFFF",
                flex: 1,
                justifyContent: "center",
              }}
            >
              Current Team: {currentTeam?.name}
            </h1>
          </>
        ) : null}
        <div className="nodrag" style={{ display: "flex", alignItems: "center" }}>
          <DebugMenu />
          <Button variant="outline-success" size="sm">
            <QuestionCircleFill 
            onClick={() => setShowCredits(true)}
            />
          </Button>
          <Button variant="outline-danger"
            className="ms-2"
            size="sm"
            onClick={() => { window.electron.ipcRenderer.invoke('close-window') }}>
            <XLg />
          </Button>
        </div>
      </Navbar>
      <CreditsModal show={showCredits} onHide={() => setShowCredits(false)} />
    </Container>
  );
};
export default Header;
