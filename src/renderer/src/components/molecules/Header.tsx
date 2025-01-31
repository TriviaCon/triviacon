import React from "react";
import Logo from "../atoms/logo";
import './Header.css'
import { Button, Container, Navbar } from "react-bootstrap";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { XLg } from "react-bootstrap-icons";

const Header: React.FC<{ isScreen: boolean }> = ({ isScreen }) => {
  const [currentTeam] = useLocalStorage("currentTeam", null); // Replace with actual current team value or state

  return (
    <Container fluid className="pb-1 ">
      <Navbar bg="dark" variant="dark" className="mb-1 px-3 draggable d-flex justify-content-between">
        <Logo />
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


          <Button variant="outline-danger"
            size="sm"
            onClick={() => { window.electron.ipcRenderer.send('close-window') }}
            className="ms-2 nodrag">
            <XLg />
          </Button>
      </Navbar>
    </Container>
  );
};
export default Header;
