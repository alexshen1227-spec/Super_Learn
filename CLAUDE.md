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

## Correctness rules (the ones people break)

1. **Content answers are COMPUTED, never hand-typed.** A generator derives its
   answer from its own values; the audit re-validates every template across
   seeds (`src/content/contentAudit.test.ts`). If you add content, the audit
   must stay green — it is the release gate.
2. **Hinted ≠ independent.** `firstCorrect` means first submission, zero
   hints. Guided evidence is real but labeled. Do not "round up".
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
