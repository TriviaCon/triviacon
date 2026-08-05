# Triviacon

Portable desktop trivia-night app: a host runs the show from a control panel while a separate game screen displays to the audience. This context covers the quiz content model — categories, questions, and answer options — and how they're authored, validated, and displayed.

## Language

**Question Type**:
One of three modes a question can be authored in: `single-answer` (one fixed answer, revealed as-is), `multiple-choice` (host picks the intended answer from a set of options), `list` (an unordered set of items revealed one-by-one as the audience names them). Determines both the authoring UI and the answer layout on the game screen.
_Avoid_: "question kind", "answer type"

**Answer Option**:
One entry in a question's set of possible answers (`AnswerOption`). For `single-answer`, there is exactly one, and it *is* the answer. For `multiple-choice`, exactly one option is marked `correct`; the rest are distractors. For `list`, every option is a correct item — there is no `correct` flag distinction.
_Avoid_: "choice", "item" (except when specifically talking about `list` questions, where "item" is natural)

**Presentation order**:
The order Answer Options are shown to the audience/host, controlled by `sortOrder` and reorderable via drag-and-drop in the Editor. Presentation order is purely cosmetic — it never implies which answer is correct or affects grading.
_Avoid_: "answer order" alone (ambiguous with grading)

**Grading**:
Deciding whether a team's spoken answer counts. Always a manual host judgment call made live in the Runner — the app never auto-scores. This is orthogonal to presentation order.

**Numbering convention**:
`multiple-choice` options are labeled with letters (A, B, C…) everywhere — Editor, Runner, Game Screen. `list` options are labeled with numbers (1, 2, 3…) everywhere. The two types are visually distinct on purpose; don't unify them.

**Invalid question** (multiple-choice only):
A `multiple-choice` question is invalid when it has no Answer Option marked `correct`, or fewer than two Answer Options. Invalid questions are flagged with a non-blocking warning in the Editor only — the host can still save, run, and export the quiz. There is no enforcement at the data layer, IPC layer, or Runner/Game Screen.
_Avoid_: "incomplete question" (this app doesn't distinguish "incomplete" from "invalid")

## Example dialogue

> **Dev**: Should I block the host from leaving a multiple-choice question that has no correct answer marked?
> **Host**: No — just warn them in the Editor. I might mark the correct answer later, or the game screen might not even need it revealed that night. Never block me.
> **Dev**: And should reordering Answer Options in a `list` question change how it's graded?
> **Host**: No, presentation order and grading are separate. I'm judging answers live regardless of what order they're listed in the Editor. Reordering is just so I can slot a forgotten item in without deleting everything after it.
