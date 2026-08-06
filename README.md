# Axiom Lab

A private, offline-first adaptive learning lab. One learner, one device, zero
servers. Math (middle school → Algebra), physics, coding, and scientific
reasoning at the core — wrapped in deliberately-trained thinking crafts:
observation, deduction, strategy, influence-defense, and learning-how-to-learn.

**North star:** delayed, independent, transferable learning per focused minute.
Not streaks, not screen time, not a fictional IQ number.

**Live app:** https://alexshen1227-spec.github.io/Super_Learn/ — open on your phone and “Add to Home Screen / Install app” for the full offline experience.

## Run it

```bash
npm install
npm run dev        # dev server on http://localhost:5199
npm run check      # vitest suite (incl. full content audit) + tsc + production build
npm run preview    # serve the production build
```

## Install on a phone

Open the deployed site in Chrome (Android) or Safari (iOS) → browser menu →
**Add to Home Screen / Install app**. After the first load everything —
curriculum, coach, puzzles, progress — works fully offline. When a new build
ships, a banner offers a refresh; it never interrupts an active session.

## What makes it honest

- **Append-only evidence.** Every attempt is an event; mastery states, review
  schedules, and analytics are derived by replay. Delete or import history and
  every number recomputes.
- **Independence is earned.** Hinted solves count as *guided*. A skill becomes
  *Independent* only after two unaided first-try successes on distinct item
  forms, *Retained* only after a delayed success (≥48 h), *Transferred* only in
  a novel context. High-confidence errors block promotion until repaired.
  These thresholds are labeled heuristics, in-app and in code.
- **A coach that shows its work.** Deterministic planner; every selection
  carries a plain-language "why", its evidence, its confidence, and what would
  change it. With sparse data it says "I don't know much about you yet."
- **Audited content.** `npm test` re-renders every template across seeds,
  validates the computed answer through the real validator, proves every chess
  tactic by exhaustive search, every logic grid unique by brute force, and
  every spatial puzzle solvable by construction.
- **Privacy by architecture.** No account, no analytics, no network calls in
  use. IndexedDB primary + backup + localStorage mirror;
  `navigator.storage.persist()` requested; full export/import/delete in
  Settings.

## Research grounding

Every load-bearing instructional behavior is sourced (retrieval practice,
spacing, interleaving, worked-example fading, corrective feedback,
metacognitive calibration) and every rejected neuromyth is documented — see
[docs/RESEARCH.md](docs/RESEARCH.md). Where the app uses a specific number
(intervals, promotion rules) it is labeled a heuristic, never a finding.

## Repository shape

```
src/domain/     types — the contract (append-only events, one bucket per activity)
src/engine/     pure logic: mastery replay, scheduler, planner, coach, validators,
                chess/mate search, polyomino, logic-grid solver, import sanitizers
src/content/    skill graph, item templates (answers COMPUTED, never typed),
                knowledge base, sample profile, changelog
src/store/      reducer + IndexedDB persistence + crash-proof session drafts
src/ui/         screens and players; learning logic stays out of components
docs/           research ledger
scripts/        icon generator, chess-tactic finder (search-verified positions)
```
