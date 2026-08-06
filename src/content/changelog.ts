/**
 * The update log. Every shipped build gets its story told here — what
 * changed and why it serves learning. Shown in Settings → About.
 */
export interface ChangelogEntry {
  version: string
  date: string
  title: string
  points: string[]
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.8',
    date: '2026-08-06',
    title: 'A Real Difficulty Ladder',
    points: [
      'Practice balance now uses real percentages that always total 100%, with a hard 5% minimum for every category. Learner slider changes and temporary coach boosts rebalance the remaining flexible share without breaking any floor.',
      'The four thinking Paths gain 12 new question families and 100 more deterministic variants. Every Path now has automatically graded practice at all five difficulty levels, from direct foundations through multi-constraint expert synthesis.',
      'The five-star system is defined everywhere it appears: Foundation, Guided, Independent, Advanced, and Expert. Stars measure reasoning complexity, not learner worth or speed, and active questions display both stars and the level name.',
      'Difficulty filters use readable numbered stars, activity cards expose level names, and the complete guide explains what changes from one level to the next.',
    ],
  },
  {
    version: '1.7',
    date: '2026-08-06',
    title: 'Four Paths, Fully Checkable',
    points: [
      'Each of the Observer, Investigator, Strategist, and Guardian Paths gains four new deterministic question families: 126 additional variants spanning exact recall, evidence boundaries, logic, Bayes, separating tests, payoff tables, dependency planning, expected value, estimation, ethical strategy, pressure defense, boundaries, and de-escalation.',
      'Every new Path question is automatically graded from an authored or computed answer key. A release-blocking test proves every correct response passes and a deliberately wrong response fails across all 126 variants.',
      'Practice emphasis initially introduced a protected breadth floor; version 1.8 replaces its relative weights with a clearer true-percentage model.',
      'Mobile sheets regain full bottom padding on every phone, including devices without a notch, and bottom navigation gets edge spacing so actions and focus rings no longer sit outside their boxes.',
    ],
  },
  {
    version: '1.6',
    date: '2026-08-06',
    title: 'Mission Control & Quality Pass',
    points: [
      'Learning Missions turn a test or real-world goal into an exact skill target: choose the date, curriculum skills, and daily focused dose. The planner prioritizes both the targets and any unmet prerequisites, and says so in every session plan.',
      'Today now shows mission readiness from real evidence: targets independent, retained, needing repair, and the next prerequisite or skill the session will pursue.',
      'The default program is 30 focused minutes every day. Progress reports the 28-day dose separately from actual outcome evidence, and refuses to call time-on-task learning unless skills cross independent, retained, or transferred thresholds.',
      'Curriculum expansion: variability and distributions, exponential growth and decay, waves and sound, algorithmic complexity, and rigorous experimental design — ten new generated activities with transfer prompts and misconception feedback.',
      'Existing daily sessions now fill the time you selected with fresh generated forms instead of stopping after a fixed handful of activities; a 30-minute plan is tested to schedule roughly 24–33 minutes of focused work without duplicate forms.',
      'Error Clinic now repairs up to three open errors in priority order, distinguishes confidence traps, revisits the failed problem family, then requires fresh reproof instead of drilling only the first error.',
      'Progress adds spaced-review and transfer success rates plus a like-for-like trend that compares only activity families seen in both halves of the month, reducing curriculum-mix distortion.',
      'Interface quality pass: consistent 44px controls, accurate screen-reader progress, safer dialogs and back navigation, equal-height practice cards, clearer time labels, live system-theme changes, and a polished responsive navigation dock.',
      'Reliability and speed: date-only deadlines now use local calendar math everywhere, service-worker update listeners clean up correctly, and screen/curriculum bundles are split into stable cache groups for much faster startup parsing.',
    ],
  },
  {
    version: '1.5',
    date: '2026-08-06',
    title: 'The Proving Grounds',
    points: [
      'Exam Simulator: timed, cumulative, blind mock tests built from your own skill map — no hints, mixed order, answers graded only at the end, then a structured post-mortem that feeds the Error Clinic. Built to close the practice→test-day gap.',
      '“Which method?” drills: real problems from the banks shown as stems — your job is to pick the strategy, not solve. Trains the discrimination step that interleaving research targets.',
      'Explain-it-back: every third session ends by explaining one of your retained skills from memory against its concept card — the self-explanation effect, scheduled.',
      'Personal forgetting curves: once a skill has real review history, its intervals stretch or shrink to fit YOUR lapse pattern (labeled a heuristic, capped both ways).',
      'Named misconceptions: common wrong answers now name the specific trap they represent, not just “incorrect”.',
      'Placement 2.0: a wrong answer on the math ladder triggers an easier constructed follow-up on the same skill, separating slips from real gaps before routing.',
      'Content: five new Case Files (two with values that change every run), three search-and-legality-verified pawn-endgame chess drills, and per-theme chess stats in the skill detail.',
      'Pack Author: build, validate, export, and install your own content packs entirely in-app.',
      'Week in Review: a Sunday ritual card — what advanced, what decayed, minutes by area, your best banked principle, and next week’s objective.',
      'Opt-in review reminders (zero-server: local notifications while the app is open or backgrounded, honoring quiet hours) and read-aloud for item prompts.',
    ],
  },
  {
    version: '1.1',
    date: '2026-08-06',
    title: "The Expansion & the Coach's Ledger",
    points: [
      'Four named Paths — Observer, Investigator, Strategist, Guardian — each with a visible mastery arc, its own code of practice, and per-path progress drawn from real evidence.',
      'Deeper banks everywhere: game theory (dominant strategies, commitment, coordination), algebra and physics depth, and new lab activities across every archetype — plus curated "go deeper" links (optional, online-only).',
      'The Coach shows exactly what it is counting: a live intake of every attempt — daily sessions, Practice launches, reviews, puzzles, case files — all visibly feeding one evidence log, with beliefs that acknowledge puzzle and self-assessed work honestly.',
      'The coach can tune practice balance itself (yours to switch off): bounded, disclosed nudges for deadlines and review pressure, always drifting back to your base.',
      'Quality of life: Enter submits, auto-focused answers, Practice search, batch-safe inputs, focus-trapped dialogs, live-region feedback, ghost-draft and sample-mode isolation fixes, and installed-app update checks on resume and network-regain.',
      'Fixed along the way: Case File self-assessments scoring zero, toggle knobs escaping their track, and a settings gear that finally looks like one.',
    ],
  },
  {
    version: '1.0',
    date: '2026-08-05',
    title: 'The Founding Build',
    points: [
      'A private, offline-first adaptive learning lab: no account, no server, no tracking — everything on your device, exportable and deletable.',
      '84-skill map across math (grades 6–10 into Algebra), physics, coding, scientific reasoning, and six thinking labs; 130+ validated item templates, most parameterized into hundreds of variants.',
      'Evidence-ladder mastery (Unseen → Introduced → Guided → Independent → Retained → Transferred) derived by replaying an append-only attempt log — honest by construction.',
      'A deterministic coach: explainable session plans, spaced review with an adaptive interval ladder, misconception blocks from high-confidence errors, a Model-of-You with stated uncertainty.',
      'The daily session: check-in, retrieval warm-up, academic core with worked-example fading and a repair loop, a rotating lab block, exit ticket, and a deliberate end — crash-proof and resumable mid-item.',
      'Chess tactics verified by exhaustive search, a touch spatial-assembly puzzle, solver-proven logic grids, weekly cross-domain Case Files, a forecast ledger with Brier scoring, and calibration analytics.',
      'Every content item ships with computed answers, hint ladders, worked explanations, and provenance — enforced by an automated content audit in the test suite.',
    ],
  },
]
