import React, { useState } from "react";
import { Alert, Button, Form } from "react-bootstrap";
import { Table } from "react-bootstrap";
import { useLocalStorage } from "../../../hooks/useLocalStorage";
import { PersonFillAdd, PersonXFill } from "react-bootstrap-icons";

const TeamTable: React.FC = () => {
  const [teams, setTeams] = useLocalStorage("teams", []);
  const [currentTeam, setCurrentTeam] = useLocalStorage("currentTeam", null);
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [editingTeamName, setEditingTeamName] = useState("");

  const handleAddTeam = (event: FormEvent) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const data = new FormData(form);
    const newTeamName = data.get("teamName") as string;
    if (
      teams.some(
        (team) => team.name.toLowerCase() === newTeamName.toLowerCase()
      )
    ) {
      alert("A team with this name already exists!");
      return;
    }
    setTeams([...teams, { id: teams.length, name: newTeamName, score: 0 }]);
    form.reset();
  };

  const handleRemoveTeam = (id: number) => {
    setTeams(teams.filter((team) => team.id !== id));
  };

  const handleUpdateScore = (id: number, mod: number) => {
    const teamToUpdate = teams.find(
      (team: { id: number; score: number }) => team.id === id
    );
    if (teamToUpdate) {
      const newScore = teamToUpdate.score + mod;
      setTeams(
        teams.map((team: { id: number; score: number }) =>
          team.id === id ? { ...team, score: newScore } : team
        )
      );
    }
  };

  const handleEditTeamName = (team: Team) => {
    setEditingTeamId(team.id);
    setEditingTeamName(team.name);
  };

  const handleSaveTeamName = () => {
    if (editingTeamId !== null) {
      setTeams(
        teams.map((team) =>
          team.id === editingTeamId ? { ...team, name: editingTeamName } : team
        )
      );
      setEditingTeamId(null);
      setEditingTeamName("");
    }
  };

  const handleCancelEdit = () => {
    setEditingTeamId(null);
    setEditingTeamName("");
  };

  return (
    <div className="d-flex flex-column h-100">
      <div className="d-flex justify-content-between align-items-center">
        <h2>Teams</h2>
        <Form className="d-flex align-items-center" onSubmit={handleAddTeam}>
          <Form.Group className="input-group input-group-sm">
            <Form.Control
              type="text"
              name="teamName"
              placeholder="Team Name"
              aria-label="Team Name"
              required
            />
            <Button variant="primary" type="submit">
              <PersonFillAdd className="me-1" />
              Add Team
            </Button>
          </Form.Group>
        </Form>
      </div>
      <Table striped>
        <thead>
          <tr>
            <th>#</th>
            <th>Team Name</th>
            <th className="text-center">Score</th>
            <th className="text-center">Del. Team?</th>
          </tr>
        </thead>
        <tbody>
          {JSON.parse(localStorage.getItem("teams") || "[]")
            .sort(
              (a: { score: number }, b: { score: number }) => b.score - a.score
            )
            .map((team, index) => (
              <tr key={team.id}>
                <th>{index + 1}</th>
                <td>
                  {editingTeamId === team.id ? (
                    <Form.Control
                      type="text"
                      value={editingTeamName}
                      onChange={(e) => setEditingTeamName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSaveTeamName();
                        } else if (e.key === "Escape") {
                          handleCancelEdit();
                        }
                      }}
                      onBlur={handleSaveTeamName}
                      autoFocus
                    />
                  ) : (
                    <span
                      onClick={() => handleEditTeamName(team)}
                      style={{ cursor: "pointer" }}
                    >
                      {team.name}
                    </span>
                  )}
                </td>
                <td className="d-flex justify-content-between align-items-center">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => handleUpdateScore(team.id, -1)}
                  >
                    -1
                  </Button>
                  <span>{team.score}</span>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => handleUpdateScore(team.id, 1)}
                  >
                    +1
                  </Button>
                </td>
                <td className="text-center">
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleRemoveTeam(team.id)}
                  >
                    <PersonXFill className="me-1" />
                  </Button>
                </td>
              </tr>
            ))}
          {JSON.parse(localStorage.getItem("teams") || "[]").length === 0 && (
            <tr>
              <td colSpan={4} className="text-center">
                No teams added yet.
              </td>
            </tr>
          )}
        </tbody>
      </Table>
      <Alert
        variant="info"
        className="d-flex justify-content-between align-items-center mb-0"
      >
        <span>Current Team:</span>
        <span>
          <strong>{currentTeam?.name || "No team selected"}</strong>
        </span>
        <div>
          <Button
            variant="outline-secondary"
            size="sm"
            className="me-2"
            onClick={() => {
              const teams = JSON.parse(localStorage.getItem("teams") || "[]");
              const currentIndex = teams.findIndex(
                (team) => team.id === currentTeam?.id
              );
              const prevIndex =
                (currentIndex - 1 + teams.length) % teams.length;
              setCurrentTeam(teams[prevIndex]);
            }}
          >
            <i className="bi bi-rewind-circle-fill me-1"></i>
            Prev.
          </Button>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => {
              const teams = JSON.parse(localStorage.getItem("teams") || "[]");
              const currentIndex = teams.findIndex(
                (team) => team.id === currentTeam?.id
              );
              const nextIndex = (currentIndex + 1) % teams.length;
              setCurrentTeam(teams[nextIndex]);
            }}
          >
            <i className="bi bi-fast-forward-circle-fill me-1"></i>
            Next
          </Button>
        </div>
      </Alert>
    </div>
  );
};

export default TeamTable;
