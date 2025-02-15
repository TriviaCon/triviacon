import { Modal, Table } from "react-bootstrap";
import { InfoCircle, Github, Bug } from "react-bootstrap-icons";
import Versions from "../Versions";
import Logo from "../atoms/logo";

interface CreditsModalProps {
  show: boolean;
  onHide: () => void;
}

export const CreditsModal: React.FC<CreditsModalProps> = ({ show, onHide }) => {
  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>
          <Logo />
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Version <kbd>0.1.0</kbd></p>
        <p>Developed by TriviaCon Team:</p>
        <ul>
          <li>alucard87pl (idea, main code)</li>
          <li>Matrix89 (React guru, code cleanup)</li>
          <li>extensive list of beta testers</li>
        </ul>
        <p>Built using:</p>
        <ul>
          <li><a href="https://www.electronjs.org/" onClick={(e) => { e.preventDefault(); window.open('https://www.electronjs.org/', '_blank') }}>ElectronJS</a></li>
          <li><a href="https://react.dev/" onClick={(e) => { e.preventDefault(); window.open('https://react.dev/', '_blank') }}>ReactJS</a></li>
          <li><a href="https://getbootstrap.com/" onClick={(e) => { e.preventDefault(); window.open('https://getbootstrap.com/', '_blank') }}>Bootstrap</a></li>
        </ul>
        <p>Licensed under the MIT License.</p>
        <p><Github className="me-2" /><a href="#" onClick={(e) => { e.preventDefault(); window.open('https://github.com/TriviaCon/triviacon-react', '_blank') }}>view the source on GitHub</a> </p>
        <p><Bug className="me-2" /><a href="#" onClick={(e) => { e.preventDefault(); window.open('https://github.com/TriviaCon/triviacon-react/issues', '_blank') }}>report an issue</a></p>
      </Modal.Body>
    </Modal>
  );
};
