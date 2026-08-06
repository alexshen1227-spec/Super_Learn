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
    version: '2.0',
    date: '2026-08-05',
    title: 'The Expansion',
    points: [
      'Four named Paths — Observer, Investigator, Strategist, Guardian — each with a visible mastery arc, its own code of practice, and per-path progress drawn from real evidence.',
      'Deeper banks everywhere: game theory (dominant strategies, commitment, coordination), algebra and physics depth, and new lab activities across every archetype.',
      'Curated "go deeper" video links on skills (Khan Academy, 3Blue1Brown and friends) — optional, clearly marked as online-only, never required.',
      'Quality of life: Enter submits, answer fields auto-focus, smarter signed-number formatting in generated problems, search in Practice.',
      'Robustness: session drafts validate their content on resume, finished sessions can never resurrect as ghosts, batch-safe answer inputs, focus-trapped dialogs, live-region feedback for screen readers.',
      'The update log you are reading, and the refresh banner that brought you here.',
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
