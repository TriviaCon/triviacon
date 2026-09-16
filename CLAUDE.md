# TriviaCON

Portable desktop app for running live trivia quiz nights. The host drives the game from a **control panel** window while players watch a separate **game screen** (projector/TV/second monitor). Single machine, dual display — no networking.

Feature-complete, heading toward 1.0. Version numbering is informal; the app is stable and in active playtesting.

## Quick reference

```bash
pnpm install          # install deps (pnpm only — npm is blocked)
pnpm dev              # dev mode with hot reload (both windows)
pnpm typecheck        # tsc against node + web configs
pnpm test             # vitest
pnpm lint             # eslint with autofix
pnpm build:linux      # AppImage
pnpm build:win        # Windows zip
pnpm build:mac        # macOS zip (x64 + arm64)
```

## Architecture

```
src/
├── main/                  # Electron main process
│   ├── index.ts           # App lifecycle, protocol registration
│   ├── ipc/index.ts       # All IPC handlers (single file)
│   ├── state/GameEngine   # Game state machine (pure logic, no I/O)
│   ├── windows.ts         # Window creation and management
│   ├── settings.ts        # Portable settings (JSON next to exe)
│   ├── portablePath.ts    # Resolves the portable root (AppImage/.app/exe dir)
│   ├── dialogs.ts         # Native dialogs with remembered dirs (quiz vs media)
│   └── mediaProtocol.ts   # Custom protocol for serving media from temp dir
├── data/
│   ├── quizStore.ts       # In-memory quiz document (synchronous CRUD)
│   ├── quizFile.ts        # ZIP archive I/O, media file management
│   └── zipArchive.ts      # Streaming .tcq writer (Electron-free, testable)
├── preload/
│   ├── controlPanel.ts    # Typed API exposed to control panel renderer
│   └── gameScreen.ts      # Typed API exposed to game screen renderer
├── renderer/
│   ├── control-panel/     # React app — builder, runner, settings
│   └── game-screen/       # React app — display for audience
└── shared/
    ├── types/             # Quiz, IPC, and state type definitions
    ├── locales/           # i18n strings (pl.json, en.json)
    ├── hooks/             # Hooks both renderers use (useGameState, ...)
    └── ...                # Shared components (AudioVisualizer, RichText) and
                           # logic (ranking, media, mediaUrl, constants)
```

### Data flow

1. Control panel calls preload API (e.g. `window.api.categoryCreate(...)`)
2. Preload forwards via `ipcRenderer.invoke` to main process
3. IPC handler mutates `quizStore` and/or `GameEngine`
4. `broadcastState()` pushes full `GameState` to both renderer windows
5. Renderers re-render from the new state

State is authoritative in the main process. Renderers are display-only consumers. The control panel uses TanStack Query for IPC data fetching; the game screen subscribes to state pushes.

### Game phases

`Idle → Builder → Splash → Categories → Questions → Question → Ranking`

These are **display states, not a progression**. The host can jump freely between any phase at any time during a live game. There is no enforced sequence.

### Scoring

Entirely manual. The host awards or deducts points per team. The app never auto-scores.

## Quiz file format

`.tcq` files are ZIP archives containing:
- `quiz.json` — document schema version 2 (final format, no migration needed)
- `media/` — attached media files (UUID-renamed on import)

Version 2 is the only accepted format. Older formats are rejected with an upgrade message.

## Core constraints

### Portability

The app must leave zero trace on the host machine. All storage (settings, runtime temp dirs) prefers the exe-adjacent directory. `userData` is a fallback only for non-writable exe locations (e.g. `/opt`, `/Applications`).

Temp extraction directories are cleaned up on app quit. Stale dirs from crashed sessions are purged on startup.

Any new file I/O must follow this pattern: portable path first, `userData` fallback.

### Dual-window coupling

The control panel is always the master. The game screen cannot function without it. This tight coupling is by design, not a limitation. Single-machine-only — networked setups are out of scope permanently.

## Content model

### Rich text

Question text and answer options support rich text (TipTap/ProseMirror). Category names are plain text. The game screen renders formatted HTML where applicable.

### Media

Questions can have one attached media file: image, audio, or video. The `audioOnly` flag strips the video track on the game screen and shows an audio visualizer instead — useful when the video would give away the answer.

Supported formats: mp3, wav, ogg, aac, m4a, mp4, webm, mov, png, jpg, jpeg, gif, webp.

## Languages

The app is fully localizable — a new language is just another locale file, and translation contributions are welcome. It currently ships **Polish** and **English**. When adding or changing UI strings, update every existing locale (`pl.json`, `en.json`) so none fall behind. Polish is the maintainer's working language, so in practice it's usually the most complete — but that's a working reality, not a limit on what the app can speak.

**Development language is English**: code, comments, commit messages, documentation.

## Conventions

### Branches

`feat/description`, `fix/description`, `chore/description`. Squash-merge into `main` preferred.

### Commits

Conventional Commits style: `feat:`, `fix:`, `test:`, `chore:`, etc.

### Code style

- TypeScript strict mode
- Tailwind CSS v4 for styling
- Radix UI primitives for accessible components
- No comments unless the "why" is non-obvious
- Control panel colours come from the theme tokens in `index.css` (`primary`,
  `destructive`, `success`, `warning`, `muted`, ...), never Tailwind palette
  values — a hardcoded `green-600` looks wrong in at least one of the ten
  built-in themes and ignores the user's choice entirely.
- Anything that represents a state uses `Toggle`, not `Button` or `Switch`. The
  pressed style carries the state, so the label names the state (`Muted`,
  `Revealed`) rather than the next action.

### Testing

Focus tests on logic that's hard to verify by using the app: state machines, data transformations, file I/O edge cases. Not UI layout or component rendering. Currently:

- `main/` — `GameEngine.test.ts`, `dialogs.test.ts`
- `data/` — `quizStore.test.ts`, `zipArchive.test.ts`
- `shared/` — `ranking.test.ts`, `media.test.ts`, `mediaUrl.test.ts`, `constants.test.ts`, `RichText.test.ts`
- `renderer/control-panel/` — `runnerActions.test.ts`, `lib/theme.test.ts`

When fixing bugs or adding features, include tests for affected logic by default.
