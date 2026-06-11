# Theming — design note

Status: **design, pre-implementation**
Branch: `feat/theming`

## Motivation

The only "theming" today is the game screen's dark toggle — and that's a
**functional** tool (blacking out the projector background in poor lighting),
not an aesthetic choice. Separately, there's a request for a **dark mode for the
control panel itself**, which generalised into: ship a handful of **baked-in
color schemes** (lifted from popular editors/terminals), each with light/dark
variants. Framed as an **accessibility / usability** improvement for the host —
**theme, but never at the cost of functionality.**

## Scope

- **Control panel only.** The operator-facing app gets the color schemes.
- **Game screen is explicitly out of scope.** Its current palette + functional
  dark toggle are sufficient for varied lighting, and its colours are
  legibility-critical and semantically meaningful to the audience
  (`success`/`marked`/`wrong`). It stays untouched. Its CSS lives in a separate
  stylesheet (`game-screen/src/index.css`), so there's no bleed risk.

## Decisions (from grilling)

1. **Surface** — control panel only; game screen unchanged.
2. **Ownership** — app-wide host preference in `settings.json` (like
   language/volume). Never per-quiz.
3. **Selection model** — a **flat list**: every variant is its own dropdown
   entry (no separate light/dark/system axis). One `System` entry follows the OS.
4. **Reach** — themes repaint the **chrome + `primary`**; the semantic **signal
   colors are frozen** (red≈delete, green≈success, amber≈highlight, blue≈info).
   `destructive` stays in the red family across every theme.
5. **Default on fresh install** — `System` (follows the OS light/dark live).
6. **UI** — a dropdown in the **Settings** tab; applies live (the app is its own
   preview); persists immediately. Per-option swatches are an optional later
   nicety, not MVP.

## The theme list (the dropdown)

```
System              ← follows OS light/dark on the Default palette   [default]
─────────
Default · Light     ← today's exact look (zero regression)
Default · Dark      ← the dark tokens already in the CSS, finally reachable
─────────
Solarized · Light
Solarized · Dark
Catppuccin · Latte  (light)
Catppuccin · Mocha  (dark)
Dracula             (dark)
Alucard             (light — Dracula's official light twin)
─────────
Borland             (novelty — navy bg, yellow/white text, cyan accents)
Matrix              (novelty — phosphor green on black, monochrome)
```

- Gruvbox was cut.
- Borland and Matrix are **single-variant** novelty themes — no light/dark twin —
  which the flat-list model absorbs naturally (each is just one complete palette).
- Palette hex values are sourced from canonical references
  (https://iterm2colorschemes.com/ and each project's own spec) and mapped onto
  the UI tokens per the recipe below.

## What a theme reaches

The control panel's colours split two ways (verified by grep):

- **Token-driven → rethemed:** `background`, `foreground`, `card`, `popover`,
  `muted`, `secondary`, `accent`, `border`, `input`, `ring`, and **`primary`**
  (selection rings / accents).
- **Hardcoded Tailwind palette colours → frozen (left exactly as-is):** ~40
  usages of `green-*` (success: live dots, saved pills), `amber-*` (tiebreaker
  highlight, Finish button), `blue-*` (info), stray `red-*`. These are the
  **signals**; they must read identically in every theme.

`destructive` is technically a token (18 usages) but is a **danger signal**, so
it is treated as frozen — kept in the red family across all themes rather than
following the palette.

**Net guarantee:** switching theme repaints the surface; affordances (delete is
red, live is green, tiebreaker is amber) never move. This is the
"not at the cost of functionality" line.

Deliberately **not** doing the "full recolor" option (tokenising those ~40
hardcoded usages into `success`/`warning`/`info` so novelty themes go
pure-palette). Consequence: Matrix is a black/green *console* look with the usual
signal accents still poking through — by design. A "let novelty themes go
full-send" pass is a possible future toggle, out of scope here.

## Token-mapping recipe (terminal palette → UI tokens)

iTerm-style palettes give a background, foreground, and 16 ANSI colours — not UI
tokens. For each theme, derive:

- `background` ← terminal background
- `foreground` ← terminal foreground
- `card` / `popover` ← background ± small lightness shift
- `muted` ← background nudged toward foreground; `muted-foreground` ← dimmed fg
- `secondary` / `accent` ← subtle background variants; foregrounds accordingly
- `border` / `input` ← low-contrast line off the background
- `primary` ← the theme's signature accent (e.g. its blue/purple/green);
  `primary-foreground` ← contrasting
- `ring` ← `primary`
- `destructive` ← **frozen red** (not redefined per theme)
- `chart-*` ← leave default (low-priority; minimal usage)

The *character* of each scheme carries over; it won't be 1:1 because a control
panel isn't a terminal.

## Selection, persistence & apply mechanism

- **Setting:** add `appTheme: string` to `AppSettings` (`src/main/settings.ts`),
  default `'system'`. Persists in the portable `settings.json`.
- **IPC:** `SETTINGS_GET_THEME` / `SETTINGS_SET_THEME`, mirroring the existing
  `SETTINGS_GET_LANGUAGE` pattern (`src/shared/types/ipc.ts`,
  `src/main/ipc/index.ts`, `src/preload/controlPanel.ts`, `src/renderer/env.d.ts`).
- **Apply:** each entry is a **self-contained `data-theme` value** on the control
  panel root (`document.documentElement`), e.g. `data-theme="solarized-dark"`.
  CSS defines the full token set per selector:
  `[data-theme="solarized-dark"] { --color-background: …; … }`. This is the same
  custom-property override mechanism the existing `.dark` block already proves
  works under Tailwind v4. The current `.dark` block is refactored into
  `[data-theme="default-dark"]`; the base `@theme inline` light tokens back
  `default-light`.
- **System entry:** resolves to `default-light` / `default-dark` from
  `window.matchMedia('(prefers-color-scheme: dark)')` (Chromium honours the OS
  theme in Electron renderers), with a `change` listener for live OS switches.
  No main-process involvement needed.
- **No FOUC:** the persisted theme is exposed synchronously by the preload
  (`ipcRenderer.sendSync` → `window.api.initialTheme`) and applied in the renderer
  entry (`src/renderer/control-panel/src/main.tsx`) **before** React's first
  paint, so a dark theme never flashes light on startup.

## UI

- A new **Appearance / Theme** row at the top of `SettingsView.tsx`, using the
  existing `native-select` component.
- Options lightly grouped: `System` and `Default · Light/Dark` up top, named
  themes below.
- **Live apply** on change (same window → instant repaint; the app is its own
  preview). Persist immediately.
- **Swatches** beside each name = optional enhancement (needs a custom Radix
  dropdown instead of the native select). Deferred, not MVP.

## i18n

- Translate: the setting label ("Appearance"/"Theme"), `System`, and the
  `Light`/`Dark` mode words (pl/en).
- **Do not** translate proper-noun palette names (Solarized, Dracula, Catppuccin,
  Borland, Matrix, Alucard) — verbatim.

## Files to touch

- `src/main/settings.ts` — `appTheme` in `AppSettings` + `DEFAULTS` (`'system'`).
- `src/shared/types/ipc.ts` — `SETTINGS_GET_THEME` / `SETTINGS_SET_THEME`.
- `src/main/ipc/index.ts` — handlers (+ sync getter for `initialTheme`).
- `src/preload/controlPanel.ts` — `getTheme`/`setTheme` + sync `initialTheme`.
- `src/renderer/env.d.ts` — matching `window.api` types.
- `src/renderer/control-panel/src/index.css` — per-theme `[data-theme=…]` token
  blocks; refactor `.dark` → `[data-theme="default-dark"]`.
- `src/renderer/control-panel/src/lib/theme.ts` (NEW) — theme registry
  (id, label key, isDark), `applyTheme()`, system-resolution + matchMedia wiring.
- `src/renderer/control-panel/src/main.tsx` — apply `initialTheme` pre-render;
  start the system-follow listener.
- `src/renderer/control-panel/src/components/settings/SettingsView.tsx` — the
  dropdown row.
- `src/shared/locales/{en,pl}.json` — labels.

## Tests

Per project guidance (test logic, not UI):

- Theme registry / `resolveSystem(isOsDark: boolean) → 'default-dark' | 'default-light'`.
- Settings round-trip for `appTheme` (get/set default).

UI repaint itself isn't unit-tested.

## Verification

- `pnpm typecheck`, `pnpm lint`, `pnpm test`.
- `pnpm dev`:
  - Settings → cycle every theme → control panel repaints live.
  - Across **all** themes, confirm the **signals hold**: delete = red,
    live dot = green, tiebreaker tint = amber, saved pill = green.
  - `System` follows the OS; flip the OS theme and watch it switch live.
  - Restart → the chosen theme persists with **no flash** of the default on boot.
  - Game screen is visually unchanged by any control-panel theme.

## Out of scope (deliberately)

- Theming the game screen (functional dark toggle stays as-is).
- Custom / user-defined palettes (presets only).
- Full recolor of the signal colours for novelty-theme purity.
- Per-option swatches (native dropdown for MVP).
- Per-quiz theme overrides (app-wide preference only).

## Open questions

- Final per-theme hex values (authoring step — pull from the references above).
- Whether `chart-*` tokens are worth theming (minimal usage; default for now).
