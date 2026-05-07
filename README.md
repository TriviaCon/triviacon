# Triviacon

> Przenośna aplikacja do prowadzenia quizów na żywo — Portable live quiz host for events

Triviacon is a self-contained desktop application for running trivia quiz nights. The host manages the game from a control panel window while contestants follow along on a separate game screen — ideal for projectors, TVs, or second monitors.

---

## Download

Head to the [Releases page](https://github.com/TriviaCon/triviacon/releases/latest) and grab the build for your platform:

| Platform | File |
|---|---|
| Windows | `Triviacon-x.x.x-win.zip` — extract and run `triviacon.exe` |
| Linux | `Triviacon-x.x.x.AppImage` — `chmod +x`, then run |
| macOS | `Triviacon-x.x.x-mac.zip` — extract and run `Triviacon.app` |

No installation required. The app is fully portable — put it on a USB drive, a shared folder, or anywhere you like.

---

## Running a quiz night

1. **Launch Triviacon** — the control panel opens automatically
2. **Open or create a quiz file** (`.tcq`) using the toolbar
3. **Build your quiz** — add categories, questions, answer options, and optional media (images, audio, video) in the Builder tab
4. **Set up teams** in the Runner tab before the game starts
5. **Open the game screen** — click the monitor icon in the toolbar; point a projector or second display at this window
6. **Run the game** — navigate questions from the control panel; reveal answers, mark scores, and track team standings in real time

### Quiz files

Quizzes are saved as `.tcq` files — a ZIP archive containing the quiz data and all attached media. They are fully self-contained and easy to share.

---

## Interface language

The UI is available in **Polish** and **English**. Change the language in the Settings tab of the control panel.

---

## Reporting issues & suggestions

Found a bug or have an idea? [Open an issue](https://github.com/TriviaCon/triviacon/issues) on GitHub. Please include:
- What you were trying to do
- What happened instead
- Your operating system and Triviacon version

---

## For developers

### Prerequisites

- [Node.js](https://nodejs.org/) v22+
- [pnpm](https://pnpm.io/) v10+ — install with `npm i -g pnpm` or via [Corepack](https://pnpm.io/installation#using-corepack)

> This project uses pnpm exclusively. Running `npm install` is blocked by a `preinstall` guard to avoid lockfile drift.

### Setup

```bash
git clone https://github.com/TriviaCon/triviacon.git
cd triviacon
pnpm install
```

### Development

```bash
pnpm dev
```

Starts the app in dev mode with hot reload on both the main process and both renderer windows.

### Build

```bash
pnpm build:win    # Windows (zip)
pnpm build:mac    # macOS (zip, x64 + arm64)
pnpm build:linux  # Linux (AppImage)
```

### Other useful scripts

```bash
pnpm typecheck    # TypeScript checks (node + web configs)
pnpm test         # Run the Vitest test suite
pnpm lint         # ESLint with autofix
pnpm format       # Prettier
```

### Tech stack

- [Electron](https://www.electronjs.org/) — desktop runtime
- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS v4](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/)
- [TanStack Query](https://tanstack.com/query) — data fetching and cache
- [i18next](https://www.i18next.com/) — internationalisation
- [adm-zip](https://github.com/cthackers/adm-zip) — quiz file packaging
