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
    version: '3.9',
    date: '2026-08-07',
    title: 'One If-Then Plan, No Log to Read',
    points: [
      'When a Path skill has been held long enough to actually use — Retained, not merely learned — the end of that session asks for one if-then plan: "if someone pushes me to decide right now, then I say I\'ll answer tomorrow." Two short boxes, about twenty seconds.',
      'There is nothing to come back and read. Writing the plan is what does the work; re-reading it adds almost nothing, so no log or journal screen was built. Roughly two weeks later, one session ends by asking whether that situation ever came up — three buttons, then it is done and never asked again.',
      'It is not scored and it moves no rung, ever. Real life cannot be machine-checked, so anything you report about it is self-assessment — which this app refuses as evidence everywhere else, and refuses here too. A test now locks that: a plan reporting "I used it" changes no skill state, schedules no review, and cannot create a rung on its own.',
      'Paths only. Your math is already checked by the app and by school; the four Paths are the ones whose whole point is outside the app.',
      'The plans you write are listed at the bottom of Progress, with what you reported back — newest first, below every evidence section, and labelled as not being evidence. Nothing chases you to read it; it is there if you want it. It also travels in your export like everything else.',
    ],
  },
  {
    version: '3.8',
    date: '2026-08-07',
    title: 'Structure Bridges — Aimed at Using This Outside the App',
    points: [
      'Every Path gains two new question types built specifically to make the ideas usable outside the app. "Shared structure" shows you two situations that look nothing alike — a show you keep buying tickets for, and a company funding a dead project — and asks what is the same underneath. "Same thing elsewhere" gives you the pattern and asks you to find it in an unlabelled third situation.',
      'The wrong answers are deliberately surface matches: both involve money, both happen at school, both are people behaving badly. Matching on surface and missing structure is exactly the failure that stops a skill leaving the app, so it is the thing being trained against.',
      'This shape was not a guess. Comparing two examples is the version of this that works in the research; abstracting a principle from a single example — teach one case, then state the rule — is close to the version that was tested and largely failed. That is roughly what most explanations in this app do, so these items do the other thing.',
      'Being straight about the ceiling: nothing here guarantees you will use this in real life, and no honest app can promise that. What it can do is train recognition on the kind of question where the answer is not labelled, which is what real situations are like. The research ledger records the full claim, its limits, and the piece still missing — if-then plans tied to real situations in your own life.',
    ],
  },
  {
    version: '3.7',
    date: '2026-08-07',
    title: 'Best Explanation — the Investigator Gets the Missing Half',
    points: [
      'New Investigator skill: Best explanation. The Path could already deduce from premises, update a belief with evidence, and test rival hypotheses — but nothing taught you to GENERATE the explanations in the first place, or to choose between two that both fit. That is the actual detective move, and it was missing.',
      'Four question families. "Explain all of it" — the wrong answer covers most of the evidence and quietly drops one observation. "Fewest coincidences" — two stories both fit, so you count what each needs you to accept without evidence; a more detailed story is more expensive, not better supported. "What is it resting on" — name the one fact an inference depends on, because sharp deduction in any subject is specific knowledge, not general cleverness. And "When the evidence will not decide", where the correct answer is repeatedly "leading candidate, not proven — here is the test that would settle it".',
      'The scenarios reason about objects, places and events — never about reading a person\'s character or history from how they look. That famous version of this trick is cold reading, which this app refuses to teach anywhere.',
    ],
  },
  {
    version: '3.6',
    date: '2026-08-07',
    title: 'The Balance Sliders Actually Have to Be Dragged',
    points: [
      'The practice-balance sliders now only respond to a real drag of the handle. Pressing anywhere else on the line does nothing at all.',
      'The previous attempt at this only worked with a mouse. A standard slider jumps to wherever the line is pressed, and the code cancelled that jump on press — but touch never goes through that path, so on a phone the tap-to-jump survived untouched. The sliders are now built from scratch rather than restyled, so the behaviour is the same on touch, mouse and keyboard.',
      'Only the handle claims a touch gesture, so swiping anywhere else on the row still scrolls the page normally. The handle is a 44px target, keeps its own focus ring, and arrow keys, Page keys, Home and End all still adjust it — dragging is required for pointers, not for keyboards.',
    ],
  },
  {
    version: '3.5',
    date: '2026-08-07',
    title: 'Harder, Longer, and Honest About Mastery',
    points: [
      'Mastery got substantially harder to reach, because it should mean you can actually use the thing. "Independent" used to accept two versions of the SAME question generator — the same problem with different numbers, counted as two. It now requires two genuinely different question families, and the four Paths require three, since observation, logic, strategy and influence-defence are the easiest skills to pass by recognising a familiar question shape rather than thinking. Some skills will drop a rung when this recalculates. Nothing was lost; the old rung was not earned under the stricter rule.',
      'A session no longer ends early. Planned minutes are only estimates, so a "30 minute" session could finish in twelve real ones. It now tops itself up with fresh work until it is within five minutes of the length you chose, always stopping at a block boundary rather than mid-problem, and never starting something that would run it long. A minute counter sits in the session header — counting up, not down, because a countdown turns thinking time into time pressure.',
      'Your phone stays awake during a session, placement, or exam. Thinking time is not idle time, and the screen locking mid-problem was interrupting the one thing this app is for.',
      'Fixed: the same problem could appear twice in a row. When the session stepped difficulty up or down it picked the replacement from the same skill — without checking what you had already been given, so it could hand back the question you had just answered. Reported from real use, reproduced, and now covered by a test that fails against the old behaviour.',
      'First sessions after the diagnostic start much closer to your actual level. Every skill previously began at the easiest difficulty regardless of what placement had just watched you do, and the planner kept parking on foundational material because "other skills depend on it" — even when placement had already cleared it. Measured across a full plan, mean difficulty rose from 2.0 to 2.5 with no bottom-rung items at all.',
      'No block can be filled with clones of one question family any more. A skill with only one question type was quietly repeating it up to seven times in a single block; the cap is now two, and the session fills the rest from elsewhere.',
    ],
  },
  {
    version: '3.4',
    date: '2026-08-06',
    title: 'First Day of Real Use',
    points: [
      'The practice-balance sliders now have to be grabbed. Tapping anywhere on the track used to jump the value to that spot, and a swipe that merely started on a slider was read as a drag — so passing through Settings could quietly rewrite your targets, and since moving one slider rebalances the rest, a bump you never noticed changed several areas at once. Only the handle responds now; tapping elsewhere on the track selects the slider so the arrow keys can nudge it, without changing anything.',
      'A "Reset to recommended" link sits under those sliders, appearing only once something has actually moved. There was previously no way back from an accidental change.',
      'Quiet hours for review reminders now read on the 12-hour clock — 9 PM to 7 AM instead of 21:00 to 7:00 — with midnight and noon written out, since "12 AM" is read backwards about half the time.',
      '"Export problem reports" in Settings → Data used to appear only after you had filed a report, which made it impossible to find when you went looking for it. It is always listed now, and when empty it explains where reports come from: the flag icon at the top of any question.',
      'Four layout breaks fixed, found by sweeping every screen for content escaping its container at both 375px and 320px, with relaxed text spacing on and off. The quiet-hours pickers pushed the second dropdown clean out of its card; the balance sliders shoved their own percentage readout past the card edge; the Progress tiles let single words like "Independent" spill out; and the Coach tone selector pushed the entire page sideways. Only the first needed relaxed spacing to show up — the rest were already broken on a narrow phone and spacing just made them obvious.',
    ],
  },
  {
    version: '3.3',
    date: '2026-08-06',
    title: 'Updates Install Themselves Before You Start',
    points: [
      'On the very first screen — the one asking for a nickname and age band — a waiting update now installs itself instead of waiting to be tapped. The refresh banner lives inside the main app shell, which that screen does not render, so an update arriving during setup previously had no way to be applied at all.',
      'After setup nothing changes: you still get the banner and decide when to reload, and it still never appears during a session, placement, or exam.',
    ],
  },
  {
    version: '3.2',
    date: '2026-08-06',
    title: 'The Bridge to High School, and an Honest Count',
    points: [
      'Four topics the app talked around without ever teaching are now covered: absolute value, arithmetic and geometric sequences, right-triangle trigonometry, and reading a trend line off a scatter plot. These are the first things the high-school sequence assumes you already have.',
      'Game theory gained the two ideas a course opens with rather than ends with: that you should play the game before analysing it, and that changing what the outcomes are worth changes what a rational player does. Both are checkable questions, not lectures.',
      'Unit checkpoints arrive on Today once you own enough of a unit and enough of it has gone cold — a short cumulative pass across the whole unit instead of one skill at a time. It appears when the evidence says it is due and stays away otherwise.',
      'Fermi estimation was a single question wearing a variant count. It now has eight estimates and a second family that asks you to audit somebody else\'s estimate — find the factor with the widest range, convert a total into a rate you have intuition about, and resist averaging two answers that disagree by 60×.',
      'The variant audit had a hole: it treated a reshuffled option list as a brand-new question, so a template with three real questions could claim thirty-six. Forty-four templates were overstating themselves. Every count now matches what the generator actually produces, and the honest total for the whole app is about 216 hours of distinct material rather than 231.',
      'Nothing was deleted to achieve that. Where a question bank existed but random selection kept missing it, the app now cycles through every case before repeating any — several families gained real questions that were always there and rarely shown. The right-triangle template went from three real questions to thirty-six.',
      'A new release check refuses to ship a skill whose evidence ladder cannot be climbed — too few question forms to ever reach Independent, or a single question family so Transferred is unreachable by construction. It found one on its first run.',
    ],
  },
  {
    version: '3.1',
    date: '2026-08-06',
    title: 'You Can No Longer Guess by Reading the Options',
    points: [
      'Multiple choice used to leak the answer through its shape. Correct options were the careful, fully-qualified ones and the wrong ones were short dismissals you could rule out on sight, so "always pick the longest" scored 52.8% against a 25% baseline — half the questions were clearable with no knowledge at all. Roughly a hundred distractors have been rewritten as equally specific, equally tempting statements. That strategy now scores 30.7%, and the build fails if it ever gets back above 34%.',
      'The side effect is that the questions genuinely got harder. A wrong answer that is a full, reasonable-sounding position takes actual understanding to reject, rather than a glance at how short it is.',
      'Fixed several sentences that read wrongly because a value was dropped into them: "on-time returns was 58%", "library text reminders improves…", "longer rotor blades always causes…", and a lower-case word opening a sentence. All were plural phrases meeting a singular verb. The audit now fails any sentence that starts in lower case where a value was interpolated, so this class cannot come back.',
    ],
  },
  {
    version: '3.0',
    date: '2026-08-06',
    title: 'Show Your Work — and the App Reads It',
    points: [
      'Some problems now ask for the middle values, not just the answer. Each line is checked on its own, so when the final number is wrong the app tells you exactly which step broke — and everything after it follows from that one line, so it is the only one worth redoing.',
      'That kills the last piece of self-assessment in the app. You used to be asked to classify your own mistake afterwards, which is guesswork dressed as data. Now the broken step names it: a wrong base in a percent problem is a concept gap, right base with wrong multiplication is a slip, and those need completely different repairs. The tag comes from your work, not your opinion of it.',
      '"Transferred" now means something measured. It used to fire whenever an item an author had tagged as a transfer item was solved — so a label decided the top rung. It now also requires the problem to come from a question family you have never practiced that skill on, checked against your own history. Some skills may drop back from Transferred to Retained, because that rung had not actually been earned.',
      'The daily session interleaves once a skill is yours. Below independence it stays blocked on one skill, which is right for learning something new. Above it, the core block mixes in neighbouring skills — because on a real test the hard part is recognising which method applies, and blocked practice never trains that.',
      'Sessions now adapt as they go. Two misses in a row and the next problem steps back a level; three clean and it steps up. It says so when it happens rather than adjusting behind your back, and it never changes what an attempt is worth.',
      'Confidence ratings finally do something. When your stated confidence is running well ahead of or behind your accuracy, the session favours items that ask you to rate it, and the coach says why.',
      'The app got faster where it was quietly getting slower. Every submitted item used to replay your entire history about five times over; that is now cached. The Today screen was recomputing its four most expensive figures on every single render because of a stray timestamp.',
    ],
  },
  {
    version: '2.2',
    date: '2026-08-06',
    title: 'More Questions, and Harder Ones That Are Honest',
    points: [
      'A big content release: about 46% more distinct material than before, and for the first time every declared variant count has been verified to equal the number of genuinely different questions the generator produces. No category now recycles its material inside a year.',
      'Algebra gained a full strand — 22 new question families from easy on-ramps up to non-routine work. Several are deliberate traps: the inequality where dividing by a negative flips the sign, the equation with no solution or infinitely many, squaring a sum, a sum of squares that looks factorable and is not, zero slope versus undefined slope. Their wrong answers are the tempting-but-wrong ones, so a miss names the misconception instead of just scoring zero.',
      'Game theory became a real subject rather than two payoff tables: best response, dominance, finding the stable point, the dilemma where the stable outcome is worse for everyone, coordination versus conflict, repeated play, credible commitment, spotting a threat nobody would carry out, and thinking one step further than the other side. Two new skills track it, and every answer is computed by actually analysing the generated game.',
      'Physics gained five more question families with exact, typeable answers — average speed over two legs (which is not the average of the speeds), net force, height-to-speed energy conversion, density, and Ohm\'s law rearranged.',
      'A generator stress sweep found real defects that had shipped. Two items were literally unanswerable: one demanded 55.00000000000001 and another 13.333…, values no keyboard produces. A studio was printing "0.3999999999999999 higher than control" into its prompt, its options, and its model report. A boolean-logic question offered only two options, making it a coin flip. All fixed, and each defect class is now a release-blocking audit rule.',
      'Multiple choice can no longer be beaten by test-wiseness. Correct answers were the careful, fully-spelled-out ones and distractors were short dismissals, so "always pick the longest option" scored 52.8% against a 25% guessing baseline — you could clear half the questions knowing nothing. Distractors have been rebuilt to be equally specific and equally plausible, and the build now fails if that strategy ever gets back above 45%.',
    ],
  },
  {
    version: '2.1',
    date: '2026-08-06',
    title: 'Every Error Gets a Repair',
    points: [
      'The corrective loop now covers all of your work. Case files, work studios, and the "which method?" drill used to show the explanation after a wrong checkpoint and move straight on — no corrected attempt. That was about 30% of every graded thing in the app, including all 360 forms of the method drill, which is the activity that trains recognising what kind of problem you are looking at.',
      'A wrong checkpoint now stops and offers the same fork the single problems always had: try again, or have it walked through. Getting it right after a correction counts as guided evidence — it can never become independent evidence, and a hint anywhere in the activity still disqualifies the whole thing.',
      'Repairing an error is no longer treated the same as walking away from one. Previously a multi-part activity was scored purely on first attempts, so correcting your mistake changed nothing. Now a corrected activity earns guided credit, while an abandoned error still counts as a miss and still shortens the review interval.',
      'The method drill scaffolds each of its six checkpoints separately. They are six different problems, so the single shared hint list could not help with any of them; each now has its own ladder that goes from "read the question sentence, not the story" to naming the method.',
      'The coach stops describing your bottleneck and hands you the work. The highest-leverage blocked skill now has a button that starts a focused session on it directly.',
    ],
  },
  {
    version: '2.0',
    date: '2026-08-06',
    title: 'Nothing Grades Itself Any More',
    points: [
      'Self-scoring is gone. Written work used to be rated against criteria by you, and a rating of 75% or better counted as a first-attempt success — meaning a skill could reach Independent on writing nobody checked. It cannot now: only deterministic grading produces evidence, and the mastery replay ignores scores entirely.',
      'Every written artifact became a draft: you write it from memory, then read it beside the model and the criteria. There is no rating control, because neither the app nor you should be grading it. All nineteen of these checkpoints are now followed by an objective probe on the same material — a peer-review discrimination, a repair test, a real problem — and that probe is what counts.',
      'Explain-it-back is the clearest case. You still explain a retained skill from memory, ungraded; then you solve a real problem drawn from that skill\'s own audited bank. An explanation that reads well but cannot drive a problem is exactly the hollow retention this drill exists to catch.',
      'The content audit now enforces all of it: no item can be graded by anything but the validator, no draft may end an activity, and every draft must be followed by a graded part. Three new mastery tests prove that ungraded work never promotes, never counts as a miss, and never moves a review date.',
      'Your history recomputes honestly, as it always has. Past self-scored attempts stay in the log as practice, but they no longer prop up any rung — so a skill that reached Independent purely on self-rated writing will show its real state.',
      'Puzzles are now generated rather than finite. The hand-authored bank held 53 distinct forms against roughly 660 focused minutes a year — the same puzzles three times over. New generators build spatial layouts by partitioning a solved rectangle, and logic grids solution-first with clues pruned against the real solver until exactly one solution survives. Every generated form is verified solvable and unique across its whole variant range.',
      'Observation and deduction gained parameterized families with computed answers: scene audits, delayed-recall stock checks, natural-frequency base-rate problems, and validity checks. No category now recycles its material inside a year — the worst was three times over, and the audit fails the build if any declared variant count is padded.',
    ],
  },
  {
    version: '1.9',
    date: '2026-08-06',
    title: 'Authentic Work, Not Worksheet Theater',
    points: [
      'Authentic Work upgrades the existing Case File mode into a studio for projects, evidence writing, program building, experiments, original-book seminars, expert office hours, field investigations, real-life decisions, and difficult Guardian conversations.',
      'Nine long-form studios provide 70 generated scenarios and more than 400 staged checkpoints. Each preserves a real workflow—brief, evidence, objective decisions, substantial artifact, critique, and revision—while stating exactly what the offline simulation cannot reproduce.',
      'Nineteen new real-world question families add 284 automatically graded variants across receipts, unit prices, travel time, energy use, automations, bug reports, household experiments, source claims, schedules, subscriptions, privacy, boundaries, incident response, project triage, and constraint-safe packing.',
      'Serious drafts now require meaningful word counts, provide deliverable-specific prompts, and compare against explicit models and criteria. Self-assessed artifacts remain separated from verified mastery evidence.',
      'Long multi-stage work now resumes at the exact checkpoint after a reload—including the unfinished draft and rubric state. Every new activity belongs to one of the ten existing percentage categories; the coach can periodically schedule a whole studio from an under-target category when time, readiness, energy, and active missions permit, but never squeezes one into a short block.',
    ],
  },
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
