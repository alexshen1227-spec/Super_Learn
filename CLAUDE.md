# Axiom Lab — working notes for agents and developers

Local-first adaptive-learning PWA. Vite + React 19 + TypeScript + Tailwind v4.
No backend, no router lib, no state lib: one reducer, IndexedDB primary with
backup + localStorage mirror, nav via pushState. Nothing a user does ever
leaves their device.

## Talking to the person who owns this app

**Write your summaries in plain English, not developer English.** The owner of
this app is a student, not a programmer. They can read code if they have to,
but they should never have to in order to understand what you did or whether it
was worth doing.

- Say what CHANGED FOR THE LEARNER first, and why it matters. The file you
  edited is a detail; the fact that a whole subject was getting 1% of their
  practice time is the point.
- Explain any technical thing you have to mention. Not "the planner's
  tie-break was unstable" but "when two topics scored equally, the app always
  picked the same one, so it kept teaching the same thing forever."
- Skip the jargon by default: no "refactor", "closure", "regression",
  "invariant", "DAG", "heuristic tier" without a plain-language gloss beside
  it. Function and file names are fine as a pointer, never as the explanation.
- Numbers are welcome — they are usually the clearest part. "It went from
  reaching 58 of 122 topics to 120 of 122" needs no translation.
- Be honest in plain language too. If something is unproven, say "no study
  backs this, it's my best guess", not "HEURISTIC tier".
- This is about the SUMMARY you write back, not the code. Comments, commit
  messages, and `docs/RESEARCH.md` stay as precise and technical as they need
  to be — the next agent reads those.

## Reading the owner's bug reports

They report through the in-app flag, and they have asked for this to be written
down: **they are human and some reports will be wrong.** Treat each one as a
observation to check, not a verdict to act on. Three rules follow:

- **Verify before fixing.** Reproduce or measure first. Some reports are exact,
  some are half-right, and at least one has been right about the symptom and
  wrong about the cause.
- **"I misunderstood" is itself a finding.** They said so explicitly: if the app
  confused them, that is a defect in the app even when the behaviour is
  technically correct. A question like "for what observation?" was a genuine
  rendering bug; "wtf is a log" is a content-prerequisite bug. Neither is user
  error.
- **A vague report can still be right.** "Some of the answers are kinda obvious
  because they're long" was measured afterwards at 62% in one bucket against a
  25% chance baseline, while the bank-wide gate read 24% and passed. Feel
  spotted what an average hid. Chase the mechanism before dismissing the
  wording.

Say plainly which reports turned out to be real, which did not, and why —
knowing a report was mistaken is worth as much to them as a fix.

## Commands

- `npm run dev` — dev server (port 5199, strictPort)
- `npm run test` — vitest (engine + FULL CONTENT AUDIT; chess search takes ~1 min)
- `npm run sim` — behavioral gates: five-year matrix, cold-start day-by-day,
  census, variants (~5-6 min; not in `npm test`, run it for any planner or
  mastery change)
- `npm run test:e2e` — playwright mobile smoke (CI runs it; needs the dev port free)
- `npm run check` — tests, then `tsc --noEmit` + production build
- `npm run icons` — regenerate PNG icons (procedural, dependency-free)
- `node scripts/find-tactics.mjs` — mine new search-verified chess positions

## Looking at the app in a browser

**Screenshot anything visual before you call it done.** Bounds checks prove a
diagram's data is *correct*; they are structurally unable to see that it is
*unreadable*. On 2026-08-10 a dot plot passed every audit gate — seven dots,
all finite, all inside the box — while the rendered picture showed six, because
two equal values were drawn at the same point under a caption reading "seven
values". Two more of the same class shipped in the same pass: a label centred
on its own line reached across a neighbouring one, and a chart kept the full
height of an xy graph, leaving an empty band that reads as a failed load.

So: after building or changing any SVG, chart, or new mark type, take a real
screenshot in the running app — not just `read_page` or DOM measurement. Pick a
variant whose data has duplicates or near-ties, since that is where overlap
hides. Keep the audit gates too; they caught an invisible polyline and
duplicate captions before anything rendered. The two are complementary.

**When `computer`/screenshot fails** with "the pane is not displayed / not
compositing" while `read_page`, `javascript_tool` and `navigate` all work
perfectly:

- **The pane has to be visible in the user's own window**, and that is not
  something an agent can change. A hidden pane composites no frames, so
  screenshots and clicks fail while every DOM tool keeps working, which reads
  exactly like a broken tool. Restarting the preview does not fix it; asking
  the user to show the Browser pane does.
- Things that look like the cause and are NOT: a spare open tab, the URL path,
  a stale dev server. All three were tested on 2026-08-10 and none of them
  explains it — the pane simply worked for a stretch and then stopped.
- A screenshot can also return a **stale frame** — check it against the DOM
  before believing it. A real `computer` click forces a fresh one.
- When the pane is unavailable, fall back to measuring the rendered SVG through
  `javascript_tool` (coordinates, computed styles, contrast ratios). That
  catches wrong data and, as §37e records, cannot catch illegible data — so
  say plainly in the summary that the visual check did not happen.
- Reaching a specific item: Practice → a bucket card opens a browse sheet
  listing every template, and clicking one launches it directly. The sheet
  renders at the END of the document, so a truncated `innerText` read will miss
  it entirely and look like the click did nothing.

**Is that console error real, or a dev-server artifact?** Run the built app.
`.claude/launch.json` carries an `axiom-prod` config (`vite preview` on port
5210) that serves `dist/`, so it needs a `npm run build` first and has no HMR
at all. It is a different origin, so it gets its own empty IndexedDB — which
also makes it the only honest way to test the first-run experience.

The recurring `useStore outside provider` error in `<Shell>` was chased three
times before this settled it: the dev server throws it after a tab has sat
through a batch of hot edits, and the production build logs **nothing** across
a full onboarding plus a complete Challenge Creator run. It is not a bug. Do
not spend a fourth session on it.

## Architecture in one paragraph

Attempts are APPEND-ONLY events (`AttemptEvent`); skill states, review dues,
calibration, allocation — everything — derives by replaying them through
`src/engine/mastery.ts`. Never mutate progress; append events. The planner
(`engine/planner.ts`) is a weighted, inspectable scorer whose every selection
carries a plain-language `why`; the coach (`engine/coach.ts`) only *describes*
derived evidence and must keep its "not enough evidence" branches reachable.
Live sessions mirror to `axiomlab.draft` (localStorage + IDB echo) on every
change, so a dying tab loses nothing; a draft whose phase is `summary` is
garbage and must never resume.

## The founding brief — read this before you change anything

Axiom Lab was specified in one long V1 master prompt. The full text lives at
`docs/ORIGINAL-BRIEF.md` and it is **not** historical trivia: it is the
product's constitution, and most of the rules elsewhere in this file are
downstream of it. Read it when a decision feels like a judgment call.

The parts that must not drift:

- **North star**: delayed, independent, transferable learning gained per
  focused minute. Everything else is a means.
- **Explicitly NOT optimized for**: daily active usage, screen time, streaks,
  virality, social comparison, engagement, or making the user *feel*
  productive without learning. No infinite feed, no hearts, no loot boxes, no
  leaderboards, no fake urgency. Every session has a deliberate endpoint.
- **One learner, one device, zero servers.** No backend, account, paid API,
  telemetry, or tracker may become required. Static hosting must stay viable.
- **The four archetype Paths are original constructions**, inspired by
  fictional characters but never naming or depicting them: Observer
  (observation vs inference, calibration), Investigator (logic, Bayes,
  hypotheses, game theory), Strategist (planning, EV, pre-mortems, *ethical*
  strategy only), and Human Insight / Guardian (influence DEFENCE, boundaries,
  de-escalation — the direction is reversed from manipulation to protection).
  Meta Lab carries learning-how-to-learn. These are the app's identity; ideas
  borrowed from other products are additions beside them, never replacements.
- **The safety boundaries are content law**, not preferences. No covert
  information extraction, profiling, lie-detection "tells", surveillance, or
  operational manipulation instruction. Danger-adjacent scenarios break the
  game frame and point to a trusted adult.
- **No IQ number, ever**, and no unsupported far-transfer claim. Puzzles and
  chess are framed as skills in their own right plus arenas for *taught*
  strategies whose transfer is tested directly.
- **Correctness is a release blocker**, not cleanup. The content audit is the
  gate.
- **Autonomous improvement was mandated from the start.** The brief explicitly
  asks for improvements nobody requested, judged against learning value rather
  than impressiveness. Proposing and building those is in scope by default —
  but so is refusing features that would weaken the core.

When a later request conflicts with the brief, say so plainly and let the user
decide. The brief has been right more often than any single session's instinct.

## Research first — this is not optional

This app makes claims about how people learn, so **look things up before you
build**. Do not work from memory about pedagogy, a competitor's design, or a
paper's findings — memory is confidently wrong about exactly the details that
matter, and a wrong instructional claim here becomes a wrong claim to a real
learner.

Search the web when you are about to:
- add or change a **learning mechanic** (spacing, feedback, difficulty,
  transfer, motivation) — find the actual evidence and its limits;
- take inspiration from another product — read how it really works rather than
  guessing, then take the *idea* and write our own implementation;
- state a number to the user (an interval, a threshold, an effect) — either
  source it or label it a heuristic;
- touch anything in `docs/RESEARCH.md`.

Rules that follow from that:
- Every load-bearing behavior gets a ledger entry with a source and a tier
  (EVIDENCE vs HEURISTIC). If you cannot source it, it is a HEURISTIC and the
  copy must say so.
- **Record what the evidence does NOT support**, not just what it does. The
  neuromyth table exists because refusing a plausible-sounding feature is as
  valuable as shipping one.
- When the implementation turns out narrower than a ledger claim, correct the
  ledger — several entries carry dated "coverage correction" notes for exactly
  this reason. An overclaiming ledger is worse than no ledger.
- Inspiration is fine; copying is not. No question text, artwork, scoring
  constants, or trademarked names from other products. Cite what inspired a
  design in the ledger's provenance section.

**Also measure before you build.** Render the content bank and count, replay a
simulated learner, check the actual distribution — estimates from reading the
source have been badly wrong more than once (a regex undercounted 307 templates
as 161 and produced the wrong conclusions about which categories were starved).

## The app is self-contained

**Nothing the app does may depend on what happened in a build transcript.**

This was violated once and is worth stating outright. Problem text printed
into an assistant conversation was treated as "the learner has seen the
answer", and 204 templates were blocked from carrying evidence on that basis.
The inference was wrong — the learner had not read those stretches — and the
cost was heavy: four skills became unprovable and a simulated year lost a
third of its owned skills.

Two things follow. Being wrong in the CAUTIOUS direction is still being wrong;
a pessimistic error is not a safe error when the whole product is an honest
record. And the app has to be judgeable on its own behaviour: what it knows
about the learner comes from attempts inside it, full stop. If a session shows
a problem in chat, that is a fact about the chat, not about the learner.

"I have seen this recently" already has a home — the review ladder and the
template cooldown, both keyed off events in the app.

## Correctness rules (the ones people break)

1. **Content answers are COMPUTED, never hand-typed.** A generator derives its
   answer from its own values; the audit re-validates every template across
   seeds (`src/content/contentAudit.test.ts`). If you add content, the audit
   must stay green — it is the release gate.
2. **Hinted ≠ independent, and repaired ≠ independent.** `firstCorrect` means
   first submission, zero hints. Guided evidence is real but labeled. Do not
   "round up". EVERY graded checkpoint — single item or one part of a case
   file, studio, or drill — enters the same corrective fork on an error, and a
   corrected checkpoint earns guided credit only. Multi-part evidence rules
   live in `engine/activity.ts` (`aggregateParts`) so they are testable without
   a DOM; the player must not re-implement them.
3. **Placement routes, never proves.** Its events count once (`'placement'`
   form key) and schedule no reviews.
4. **Every number must be able to refuse to exist.** Calibration bands hide
   under 3 samples; the coach admits ignorance under 5 graded attempts;
   forecasts and gaps return null rather than a guess. Keep those branches.
5. **Imports are hostile.** All external JSON goes through
   `store/sanitize.ts` / `engine/contentSchema.ts` — assign validated fields
   unconditionally; never spread unknown input and patch over it.
6. **One primary bucket per activity** (allocation integrity), and skill
   `bucket` must match its template's bucket (audited).
7. **Safety boundaries are content law.** Observer/Insight teach DEFENSE
   (cold-reading, manipulation recognition) and never operational
   manipulation; danger-adjacent scenarios break the game frame and point to
   trusted adults / 988. Strategy content rewards wins that survive daylight.
8. **No IQ scores, no global intelligence number, anywhere.** Transfer claims
   are tested per-user (transfer items), never asserted from puzzle play.

## Update flow

`vite-plugin-pwa` in `prompt` mode: new builds surface a refresh banner
(never during an active session — `App.tsx` gates on session view). Ship user
visible changes with a `src/content/changelog.ts` entry.
