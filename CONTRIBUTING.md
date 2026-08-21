# Contributing to TriviaCON

Thanks for your interest in improving TriviaCON. Bug fixes, translations, docs, and polish are all very welcome.

Before anything else, please read the principles below. **TriviaCON has a deliberately narrow, fixed scope.** It is feature-complete by intent — "not everything is a feature." Contributions that fit the scope are easy to accept; contributions that pull against it, however well-built, are likely to be declined. Reading this first saves everyone the disappointment of a rejected PR.

## Design principles

These are the ideas the app is built around. They are not up for incremental erosion.

1. **Single machine, dual display, no networking.** The host runs everything from a control panel window; the audience sees a separate game screen on a projector or second monitor. The control panel is always the master — the game screen cannot function without it. This tight coupling is by design. Networked, multi-device, or client/server setups are out of scope permanently.

2. **The host is in command; the app never adjudicates.** Scoring is entirely manual — the host awards and deducts points per team. The game phases (splash, category board, question, ranking) are freely navigable display states, not an enforced progression. The host can jump anywhere at any time. The app never auto-scores and never decides the flow of the night.

3. **Never block the host.** Validation and warnings are informative, never blocking. A questionable quiz — a multiple-choice question with no correct answer marked, a very long list — still saves, runs, and exports. Warn, explain, respect the host's judgment; don't gate them out of their own game.

4. **AI does the plumbing; humans do the quiz.** AI helped build the app, and AI-assisted tooling may scaffold the empty structure of a quiz file (`.tcq` skeleton) to save clicks. It must never author the substance — questions, answers, difficulty, or media are always human-written — and it never runs the game. No auto-generated content, no auto-scoring, no auto-advancing. The metaphor: a car versus a bicycle, but the car doesn't drive itself.

5. **Portable and zero-trace.** The app must leave nothing behind on the host machine. All storage prefers the exe-adjacent directory; temp extraction dirs are cleaned up on quit and purged on startup. Run it from a USB stick and walk away clean. No telemetry, ever.

## Non-goals (permanent)

To be explicit, so a proposal to add any of these can be closed with a link here:

- **Networking / online multiplayer / player devices** — no phones-as-buzzers, no companion apps, no remote screens.
- **Automatic scoring or answer grading** — the host judges every answer live.
- **Automated game flow** — no timers that force transitions, no "next question" automation that takes the wheel.
- **AI-authored quiz content** — see principle 4.
- **Cloud sync, accounts, or telemetry** — quizzes are plain portable files; nothing phones home.
- **Enforced quiz validity** — the app warns, it never refuses to save or run.

If you have an idea that lives *near* one of these lines, open a [discussion](https://github.com/TriviaCon/triviacon/discussions) before writing code — it's the fastest way to find out whether it fits.

## Development

Setup, scripts, and the tech stack are documented in the [README](README.md#for-developers). In short:

```bash
pnpm install
pnpm dev          # both windows, hot reload
```

Before opening a PR, make sure these pass:

```bash
pnpm typecheck
pnpm test
pnpm lint
```

`main` is protected — everything (including version bumps) lands via PR behind a passing `Lint · Typecheck · Test · Build` check. Add or update tests when you change logic that's hard to verify by hand (state machines, data transforms, file I/O edge cases); UI layout and rendering don't need tests.

### Conventions

- **Branches:** `feat/description`, `fix/description`, `chore/description`. Squash-merge into `main`.
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/) — `feat:`, `fix:`, `test:`, `chore:`, etc.
- **Code:** TypeScript strict mode, Tailwind v4, Radix primitives. No comments unless the "why" is non-obvious.
- **Development language is English** — code, comments, commit messages, and docs.
- **Translations are welcome.** The app is fully localizable — a new language is just another locale file. When you add or change UI strings, update every existing locale (currently `pl.json` and `en.json`) so none fall behind. New-language contributions are especially appreciated.

Architecture is described in [CLAUDE.md](CLAUDE.md); the quiz content model (question types, answer options, grading) in [CONTEXT.md](CONTEXT.md).

## Reporting bugs

Open an [issue](https://github.com/TriviaCon/triviacon/issues) with what you were trying to do, what happened instead, and your OS and TriviaCON version. For questions and ideas, use [Discussions](https://github.com/TriviaCon/triviacon/discussions).
