# Axiom Lab — working notes for agents and developers

Local-first adaptive-learning PWA. Vite + React 19 + TypeScript + Tailwind v4.
No backend, no router lib, no state lib: one reducer, IndexedDB primary with
backup + localStorage mirror, nav via pushState. Nothing a user does ever
leaves their device.

## Commands

- `npm run dev` — dev server (port 5199, strictPort)
- `npm run test` — vitest (engine + FULL CONTENT AUDIT; chess search takes ~1 min)
- `npm run check` — tests, then `tsc --noEmit` + production build
- `npm run icons` — regenerate PNG icons (procedural, dependency-free)
- `node scripts/find-tactics.mjs` — mine new search-verified chess positions

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
