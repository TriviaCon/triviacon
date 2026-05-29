# Mock quiz files

Sample `.tcq` quiz files for manual testing and development. Open them
from the app (**Load Quiz**) to exercise the builder and runner without
hand-building a quiz first.

| File | Contents |
|------|----------|
| `mockQuiz.tcq`          | A small quiz — a few categories, mixed media (images + video). |
| `big_mockQuiz.tcq`      | A larger quiz for stress-testing layout and the quiz tree. |
| `stress_test_quiz.tcq`  | Exercises all question types, rich text, media placeholders, and edge cases. |

## Format

A `.tcq` file is a ZIP archive containing:

- `quiz.json` — the quiz document (see the `QuizDocument` schema in
  [`src/data/quizStore.ts`](../src/data/quizStore.ts))
- `media/` — attached media files, UUID-named

Packaging is handled by [`src/data/quizFile.ts`](../src/data/quizFile.ts).

## Regenerating

To refresh these samples, open one in the app, edit it, and save — or
create a new quiz and save it over the file. They are committed
intentionally so contributors have something to test against out of the
box; keep them reasonably small.
