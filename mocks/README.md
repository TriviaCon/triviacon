# Mock quiz files

Sample `.tcq` files for manual testing and local development.

This directory is intentionally empty in the repo. The historical samples
that lived here were in legacy formats (raw SQLite and an early inline
JSON schema) that the app no longer reads. Regenerate fresh ones with
the current app:

1. `pnpm dev`
2. **New Quiz** → save into `mocks/` as `mockQuiz.tcq` (or similar)
3. Add a few categories / questions / media and save again

A current `.tcq` file is a ZIP archive containing `quiz.json` plus a
`media/` directory (see `src/data/quizStore.ts` for the `QuizDocument`
schema and `src/data/db.ts` for the on-disk packaging).
