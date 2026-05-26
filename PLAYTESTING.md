# Help Me Break Triviacon

Thanks for agreeing to take Triviacon for a spin. Before you start, the
single most useful thing to know:

**I want you to try to break it.** Click the wrong things, type nonsense,
do what no "sensible" user ever would. And tell me honestly what you
think — "this confused me" or "this looks ugly" is just as valuable as
finding a crash. You won't hurt my feelings, and vague politeness helps
nobody.

## What Triviacon is

Triviacon is a desktop app for running trivia quiz nights. You build a
quiz, then run it live: you drive the game from a **control panel**
window while players watch a separate **game screen** (meant for a TV or
projector). It runs on Windows, Linux, and macOS, and the interface is
available in Polish and English.

## Getting started

1. You've been handed a build for your platform — unzip it (or, on
   Linux, make the `.AppImage` executable) and run it. No installation.
2. The app opens with the control panel window.
3. To see it with real content straight away, open the sample quiz I
   sent along (`mockQuiz.tcq`) using **Load Quiz**. Or start from
   scratch with **New Quiz**.

If it won't even launch, that's the most important bug of all — tell me
right away.

## Take the tour

No particular order, and no need to finish everything. Just make sure
you wander through all of these at least once so nothing goes unseen:

- **Build a quiz.** Make a few categories, add questions, give them
  answer options. Try attaching an image, an audio clip, and a video to
  different questions.
- **Fill in the quiz info** — name, author, date, and so on.
- **Run a game.** Switch to the runner, add two or three teams, open the
  game screen, and play through it: show the categories, pick questions,
  reveal answers, award points, show the final ranking.
- **Use a second screen** if you have one — a TV, a projector, an extra
  monitor. The game screen is built for exactly that, so see how it
  behaves.
- **Switch the language** between Polish and English in the settings.
- **Save your quiz, close the app, and reopen it.** Make sure your work
  comes back intact.

## Now actually try to break it

This is the part that matters most. Some ideas to get you going — but
please improvise, the weirder the better:

- **Feed it nothing.** A quiz with no categories. A question with no
  text. No answer options. No teams. Try running a game that's empty.
- **Feed it too much.** A category name a paragraph long. A question
  that's a wall of text. Thirty categories. Thirty teams. A huge video
  file.
- **Be rough.** Double-click everything. Mash buttons quickly. Hit the
  reveal button five times in a row.
- **Mess with the windows.** Resize them tiny, then huge. Go fullscreen.
  Close the game screen in the middle of a question. Close the control
  panel without saving. Unplug the second monitor mid-game.
- **Change your mind.** Switch language halfway through building a quiz.
  Start a "Save As", then cancel it. Close without saving, then reopen.
- **Try silly values.** Negative scores. Absurdly large scores. Open a
  file that isn't a quiz at all.

If something looks wrong, freezes, or just feels off — that's a finding.
Note it down.

## Tell me what you think

Two kinds of feedback, and I want both:

**Something broke or behaved weirdly.** Jot down:

- What you were doing (the steps, as best you remember them)
- What happened
- What you expected to happen instead
- Your operating system (Windows / Linux / macOS)
- A screenshot, if you can grab one

**Honest impressions.** Don't hold back:

- Was anything confusing? Did you ever feel lost?
- Did anything look ugly, cramped, or unfinished?
- Did anything feel slow or sluggish?
- What did you genuinely like?
- If you could change one thing, what would it be?

You don't need to write an essay — bullet points, a voice note, a messy
list, whatever's easiest. Partial feedback beats no feedback, and rough
notes beat polished silence.

## How to reach me

The app has a built in link to the github issues (requires a free
GitHub account) and depending on what you choose there it will be either an issue or a feature suggestion

If I gave you the link through messenger, reply there.
If it was Discord, through there.

---

Thank you — seriously. An hour of someone genuinely trying to break this
is worth more than a week of me staring at my own app.
