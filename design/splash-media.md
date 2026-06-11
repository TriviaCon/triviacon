# Splash media rework — design note

Status: **implemented** — shipping in 0.9.9 ("Fresh Coat of Paint")
Branch: `feat/splash-media`

## Motivation

The splash (idle/lobby) screen is the first thing the audience sees while
settling in, and it's what the host flips back to between rounds. Today it is
static and limited:

- The splash image is stored as a **base64 data URI inline in `quiz.json`**
  (`meta.splash`). Image only.
- Rendering (`IdleScreen.tsx`) is a hard either/or: with an image, the quiz
  *name* is hidden but location/date/author still overlay below it; without an
  image, it's just text on a flat fill.
- No motion, no sound, no entrance — it just sits there.

We want the splash to optionally carry **richer media (video, audio)** so it can
feel alive, while keeping the **text metadata as the meaningful anchor** — the
media is icing, not the substance.

## Core decision: reuse the question-media pipeline

The proposal is to stop encoding the splash inline and instead reference a
**file inside the `.tcq` archive**, exactly as question media already works:

- Files live in `media/` inside the archive, UUID-renamed (`name-uuid.ext`).
- Referenced by **filename string**, not inline data.
- Served at runtime via the `triviacon-media://` custom protocol, which already
  supports **HTTP range requests** (i.e. video seeking/streaming works for free).
- `attachMedia` / `removeMedia` / extraction / zip-on-save already sweep
  `media/`.

We reuse `media/` rather than introducing a separate `meta/` directory. A
separate dir buys only tidiness when manually unzipping the archive; the file
model is identical and the protocol/extraction/save already handle `media/`
wholesale.

### Backward compatibility (no format bump)

`mediaUrl()` already passes `data:` URIs through untouched and only routes
*relative paths* through the protocol. Therefore **existing base64 splashes keep
rendering with zero migration**. New fields are added **additively** — no
v2 → v3 bump, honoring "v2 is final."

A video cannot be a practical data URI, so video naturally forces the file
model. Images may be either; new image attachments route through `media/` too,
leaving the legacy `meta.splash` field for reads only.

## The model: two tracks

Think in **two tracks**, not "attachments":

- **Visual track**: none / image / video
- **Soundtrack**: none / the video's own audio / a separate audio file

with one structural rule that eliminates the double-audio trap:

> **A video in the Visual slot disables the separate Soundtrack.**
> A video plays its own audio (with a Mute option). Only an image-or-nothing
> splash can take a separate soundtrack.

(Note: a video in the **Soundtrack** slot is fine — see "audio-from-video"
below — because the visual is then an image. The rule is specifically about a
video occupying the *Visual* slot.)

### The six configurations

The text metadata card is **always rendered**; these describe what composites
with it:

| # | Visual | Sound          | Audience sees                  |
|---|--------|----------------|--------------------------------|
| 1 | none   | none           | info card on plain background  |
| 2 | none   | tune           | info card + intro music        |
| 3 | image  | none           | image + info card (today)      |
| 4 | image  | tune           | image + intro music            |
| 5 | video  | own audio      | looping video with sound       |
| 6 | video  | muted          | silent looping video           |

**Explicitly rejected:** *video + a separate swapped tune* (mute the clip, lay
your own track over it). Not worth the code/UX cost. Dropping it is what makes a
separate soundtrack and a video mutually exclusive at the visual level.

### Audio-from-video ("audioOnly" without the flag)

"Image visual + a video's audio" is **not a new layout** — it is case #4. The
video simply goes in the **Soundtrack** slot, where its frames are discarded and
only its audio is used. The image occupies the visual; the result is identical
to image + tune.

The only spec consequence: **the Soundtrack slot's file picker accepts video
formats too** and uses just the audio. Questions need an `audioOnly` toggle
because they have a *single* media slot and must disambiguate; splash has two
slots, so the slot you choose *is* the answer — no flag required.

The alternative (video in the Visual slot + a "show this image instead of the
frames" override + a second image attachment) is rejected: it forces two
attachments into one slot and a new display mode to produce the identical
audience result.

## Layout: contained hero

Because the info card is **always** present, the visual composites *with* it.
Chosen approach: **contained hero** — the visual sits in a framed element above
the metadata card (today's image-above-text arrangement, extended to video). The
metadata stays prominent and legible; the video animates the hero box instead of
an image sitting in it. One media-type-agnostic layout.

Rejected alternative: **full-bleed backdrop** with the card overlaid as a
lower-third strip. More immersive, but it inverts the stated priority (metadata
is the substance) and forces authors to design media around the card.

No fade-in/out: the splash should simply *be there* when people look up, not
perform. Render immediately on phase enter.

## Builder UI: the informative form

Two slots with context-aware rules, plus a **plain-language summary line** that
collapses whatever is attached into one sentence — so the author never reasons
about the matrix.

```
┌─ Splash ──────────────────────────────────────────┐
│  Visual                    Soundtrack              │
│  ┌────────────┐            ┌────────────┐          │
│  │ image /    │            │  ♪ audio   │          │
│  │ video      │            │  or video  │          │
│  └────────────┘            └────────────┘          │
│  ☐ Mute video audio        (disabled when a        │
│                             video fills Visual)    │
│                                                    │
│  ▸ Audience sees: a looping video with sound,      │
│    over the info card.                             │
└────────────────────────────────────────────────────┘
```

Rules that carry the whole control:

- **Attach a video (Visual) → Soundtrack greys out** with an inline reason
  ("A video plays its own audio — remove it to add a separate soundtrack"), and
  a **Mute** toggle appears under the video.
- **Attach an image, or nothing → Soundtrack is live** (accepts audio or video,
  using audio only).

The controls cannot produce an invalid state; the summary sentence states
exactly what was built. That same sentence is reused on the runner panel.

### Summary-line copy (per configuration)

1. info card on a plain background
2. info card with intro music
3. your image with the info card
4. your image with intro music
5. a looping video with sound
6. a silent looping video

## Runner control surface

A **Splash panel** in the Runner View (mirroring how question media already has
runner-side controls) makes playback **live** during the night rather than baked
into authoring:

- Play / Pause
- **Loop** toggle (default on for video; the splash persists while people settle)
- Mute
- The same plain-language summary line for at-a-glance confirmation

## Playback defaults

- **Video loops** by default (a clip freezing on its last frame is worse than
  today's static image). Runner Loop toggle can override live.
- **Intro tune plays once** on entering Splash (it's an *intro*, not lobby
  muzak; looping ambient is a separable later feature).
- Volume reuses the existing default-volume setting (same as the fanfare).

## Data model sketch (additive)

New `meta` fields (names TBD at implementation):

- `splashVisual: string | null` — `media/` filename (image or video)
- `splashAudio: string | null` — `media/` filename (audio or video, audio used)
- `splashMuted: boolean` — mute a video in the Visual slot
- `splashLoop: boolean` — loop default (runner-toggleable at runtime)
- `meta.splash` (legacy base64) — **read-only**, kept for backward compat;
  rendered via the existing data-URI passthrough.

Invariant enforced in the store/IPC: if `splashVisual` resolves to a video,
`splashAudio` is ignored (cleared on attach).

## Out of scope (deliberately)

- Background theming / gradients / particles (revisit if/when quiz theming
  becomes a feature).
- Swapped tune over a video (case #7).
- Looping lobby music.
- Entrance/exit animations.
- Full-bleed backdrop layout.

## Open questions to confirm before coding

1. Final field names in `meta`.
2. Whether the legacy `meta.splash` should be **migrated** to `splashVisual` on
   next save, or left untouched as a pure read path.
3. Exact placement of the Splash panel within the Runner View layout.
