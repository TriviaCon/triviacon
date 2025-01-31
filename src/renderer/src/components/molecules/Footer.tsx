import React from "react";
import { Navbar, Container } from "react-bootstrap";
import DebugMenu from "./DebugMenu";

const Footer: React.FC = () => {
  return (
    <Container fluid>
      <Navbar
        bg="dark"
        variant="dark"
        className="border-top border-body d-flex justify-content-end"
        >
        <DebugMenu />
        <Navbar.Text className="ms-2 me-2 p-0">
          ©2024 by <a href="mailto:triviacon@a87.pl">Alucard</a>
        </Navbar.Text>
      </Navbar>
    </Container>
  );
};
export default Footer;
