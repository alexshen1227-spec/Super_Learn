# Open work

What is known to be missing, wrong, or unproven. Kept here rather than in a
head or a chat scrollback, so the next session starts from the truth.

Ordered by the project's own tie-breakers: fixing a way the app is wrong about
the learner beats adding anything; honest evidence beats more content;
measurement beats features; depth in maths beats breadth elsewhere.

Last reviewed: 2026-08-18 (fifth pass — the upgrade section at the bottom).

**Numbers measured before 2026-08-11 are STALE.** Removing the burned-item
flag changed the baseline for anything involving owned skills or pool depth —
a simulated year went from 77 owned to 123. Tables below are marked where they
were taken under the old baseline; treat them as directional, not current.

---

## Committed to, not yet built

### 5. Item cooldown — PARTLY DONE
Shipped: template-level repeat tracking, a three-stage degrade that never
skips a due review, the twelve-hour rest applied to the family warm-up path,
`cooldownPressure()`, and retention no longer counting a repaired repeat.

NOT shipped, deliberately: "never the same template twice in a session" as an
absolute rule, and the 30-day window. Measured over simulated years — STALE,
taken while the burned flag was suppressing 204 templates, so the absolute
values are far too low. The RANKING is what mattered and should survive:

| config | owned @85% | owned @55% |
| --- | --- | --- |
| baseline | 67 | 45 |
| cap 1 | 69 | 41 |
| cap 1 + repeat-if-well-fitted | 72 | **38** |
| cap 2 + repeat-if-well-fitted | 68 | **31** |

Every version that reduced repetition cost a STRUGGLING learner owned skills —
RESEARCH.md §37j re-derived. The measured cap of 2 stands.

The diagram-at-11-servings note that used to sit here is RESOLVED, and was a
real bug in the shipped planner rather than an artefact of the variant. See the
smaller-items list below.

WORTH REDOING. The trade existed because there was not enough content at the
right difficulty, and the pool is now much deeper than when this was measured:
every template can carry evidence again and nothing sits below the independence
bar. A repeat of this experiment might find the cost has gone.

### 5b. Original cooldown spec, for reference
Suppress recently-seen problems without ever blocking a due skill review.
Keys on TEMPLATE, not variant. Target 30 days, configurable. Hard floor:
never the same template twice in a session or on consecutive days.

**Verify first, and do not duplicate:** `formKey` in `mastery.ts` is already
the template id, so re-serving one template cannot add a second form of
evidence however often it appears. Part of what a cooldown would provide
exists. Find out exactly which part before building alongside it.

Surface cooldown pressure per skill — eligible pool size at current
difficulty, and how often the window could not be honoured. `poolPressure()`
in `provable.ts` already does the burned-item half of this and is the natural
place for it.

### 6. Curation — PARTLY DONE
Shipped: `scripts/import-openstax.mjs`, 30 verified items from OpenStax
*Statistics* (CC BY 4.0), and a per-book licence survey of the OpenStax
catalogue (129 books: 46 CC BY, 72 CC BY-NC-SA, 11 unstated). First editions
are CC BY and second editions are NC-SA — verified, not assumed.

Yield was deliberately low: 1,929 exercises down to 30. Only bare-numeric
solutions with self-contained problem text survive, because that is the subset
where a misaligned parse is detectable.

Result AT THE TIME: skills below the independence bar 23 to 21, fully blocked
6 to 4. Both numbers are now 0 for a different reason — the burned flag that
caused them was withdrawn — so the import's real contribution is 30 items of
human-authored statistics, not the unblocking.

The "still blocked" skills listed here originally — `i-abduce`, `c-decomp`,
`i-commit`, `x-stuck` — were blocked by the burned-item flag, not by a content
shortage. With that removed they are fine, and nothing in the bank is below the
independence bar.

The observation underneath it still stands and is worth keeping: the openly
licensed sources are all mathematics and statistics. If a reasoning pool ever
does run thin, there is no obvious CC BY text of "spot the best explanation"
problems, because those are this app's own constructions rather than a school
subject with textbooks behind it.

Next options, roughly by promise: OpenStax *Introductory Business Statistics*
and the CC BY algebra titles for more maths depth; pre-1930 public domain logic
and puzzle texts if a reasoning pool ever needs them. No longer urgent, since
nothing is starved — this is now about DEPTH and about problems a generator
cannot produce, not about filling holes.

### 6b. Original curation spec, for reference
Import human-authored problems. CC BY 4.0 and public domain only —
Illustrative Mathematics FIRST edition (2019–2021; v.360 is CC BY-NC),
OpenStax verified per book, pre-1930 texts. ShareAlike is refused because this
repository is public and SA would propagate. `ATTRIBUTIONS.md` holds the rule;
the `source` field on `ItemTemplate` and the audit gate already exist and are
unused. Prioritise whatever step 5 reports as thinnest.

### 7. Measure the north star — DONE
`engine/northStar.ts` derives, from the event log alone: skills that survived
14+ days unaided on a different family, minutes per surviving skill, the
three-month gained/held/not-asked split, transfer counted separately, and a
twelve-week trend. Surfaced at the top of Progress. 18 tests, each one an
attempt to earn a durable skill without retaining anything.

The 48-hour `retained` rung in `mastery.ts` was NOT changed. It is load-bearing
for the planner, the coach and the review scheduler, and the goal says to stop
and ask before touching mastery. The strict measure sits beside it instead.

SETTLED 2026-08-11: leave the 48-hour rung alone. Both measures now show on
Progress and that is the intended end state, not a stopgap.

The reasoning had to be corrected. The claim first written here — that moving
the rung to 14 days would cause "a large drop in reported progress" — was
asserted without measuring and is WRONG. Simulated learner-year:

STALE ABSOLUTE VALUES (taken while the burned flag was active; owned has since
roughly doubled). The comparison between the columns is the point and holds:

| accuracy | independent | "Retained" badge (48h) | survived (14d + new family) |
| --- | --- | --- | --- |
| 85% | 77 | 77 | **75** |
| 60% | 51 | 50 | **52** |

They land within a couple of skills of each other, and at 60% the STRICTER
measure is higher. The reason is the review ladder: it spaces returns at
1/3/10/30 days, so by the time a skill comes back a fortnight has usually
passed anyway and the 48-hour threshold almost never binds. The strict count
can exceed the badge because it does not require the ladder to have promoted
the skill first — two unaided wins on different families, 14 days apart, is
enough on its own.

The real argument against merging them is different and was only found while
checking: `RETENTION_GAP_MS` is used for TWO things. As well as the retention
rung it decides whether a transfer attempt crossed the "a real delay"
dimension (`crossedDimensions` in mastery.ts). Moving it to 14 days would
silently make Transferred harder to earn as a side effect. If the constants
are ever unified, SPLIT IT FIRST so retention and transfer-delay can move
independently.

Caveat on the measurement: it simulates daily practice. A pattern with long
gaps spaces returns further apart, which pushes the two measures closer
together rather than apart, so the conclusion should hold or strengthen.

### 7b. Original north-star spec, for reference
Delayed retention checks (unaided re-test at 14+ days, hints unavailable,
reported separately), transfer probes as their own metric, minutes-to-retention
as a trend. A plain dashboard: no streaks, no points, no encouragement. If the
number is flat it should look flat.

The app cannot currently answer any of its three defining questions in numbers:
what can I do unaided now that I could not three months ago; what has survived
from three months ago; how many focused minutes did each retained skill cost.

---

## Known gaps in what has shipped

### ~~21 skills cannot currently be proven~~ WITHDRAWN
This was a consequence of the burned-item flag, which has been removed: it
rested on an inference that the learner had read problem text printed into a
build transcript, and they had not. Measured after removal — 661 templates,
**0 skills below the independence bar, 0 blocked**. The four that had been
unreachable (`i-abduce`, `c-decomp`, `i-commit`, `x-stuck`) are fine.

The rule that replaced it is in CLAUDE.md: nothing the app does may depend on
what happened in a build transcript. `poolPressure()` survives and still finds
thin content — it simply counts every template now.

### ~~The construct grader has a known false-negative class~~ CLOSED
`parseExpression` now accepts `2^3`, `sqrt(9)`, `12/4 + 1`, `(3+5)/2`, unicode
fractions, mixed numbers, percentages, typographic operators and thousands
separators, and still refuses anything it cannot fully parse. Used ONLY by the
constructed-answer grader: for an ordinary numeric question, accepting
"12/4 + 1" would credit typing the question back, and the strictness there is
correct. A construction cannot be restated from its prompt, so it has no such
risk.

### ~~Nothing catches an over-strict constraint~~ CLOSED
A gate now asks the question the others cannot: does a SECOND valid answer
exist? The player promises "more than one answer works", so a unique solution
makes the app state something false on screen.

It found one immediately. `nr-integer-pair` had exactly ONE answer at three of
eight seeds. It now resamples until at least two exist, the gate prefers the
generator’s own exhaustive count over its local search, and the player’s claim
is conditional rather than asserted.

`nr-digit-target` was flagged by the same gate and was a false alarm — 2 to 4
solutions per seed, the search was just too weak to find them. Verified before
changing anything.

### Constructed argument remains ungradable
Proofs, derivations with justification, and explanations cannot be graded
offline without a model. `draft` accepts them, compares them against an
explicit model, and refuses to score. That is the ceiling, not a gap to be
closed by cleverness, and it should not be papered over with keyword matching.

### Nothing in the app teaches from zero
47 of 661 templates carry any exposition, and 9 of those are `pfl-*` probes
which are deliberately barred from the ladder. This is a real gap, and the
project has decided NOT to close it: lectures do that job, and the app's stated
purpose is proving retention rather than delivering instruction. Recorded so
the decision stays a decision rather than an oversight.

### Breadth outside mathematics is a sample
Maths is 329 of 661 templates and 5,602 of 8,323 generated problems. Every
other bucket is a probe that can maintain knowledge acquired elsewhere but
cannot be where it is acquired. Accepted, per the fourth tie-breaker.

---

## Smaller, still open

- ~~**`nr-digit-target`'s explanation claims a specific pairing**~~ CLOSED. It
  now says how many arrangements tie and that another one landing the same
  distance away is equally right.
- **Dispute resolution has no reminder, deliberately.** Open disputes are
  already out of the numbers, so there is no urgency — but if one is never
  settled, the attempt is silently discarded forever. Watch whether that
  becomes a way to quietly delete inconvenient evidence.
- **The licence audit gate now fires against a real source** (OpenStax
  Statistics, CC BY 4.0). It had never been exercised before this.
- ~~**A diagram reached 11 servings against a soft cap**~~ CLOSED, and it was a
  real bug in the SHIPPED planner rather than only the unshipped variant. The
  first warm-up loop serves a due FAMILY by looking the template up directly,
  bypassing `pickTemplates` and with it the exposure cap: three servings
  through core, then four more through the warm-up as the family review fell
  due. Seven against a limit of three, now 3, with a regression test.
- **The 30 imported items carry answers parsed from OpenStax’ printed
  solutions**, not answers this app derived. The filter drops everything it
  cannot cross-check (1,929 down to 30), but a misparse would be invisible from
  inside. If one looks wrong, dispute it — that flow exists and works.
- ~~**`sessionRhythm` lost its same-day-review proxy**~~ CLOSED. The rule it
  protected is now tested directly rather than by proxy: a skill attempted three
  hours ago must not reappear in the next warm-up, with a CONTROL proving the
  same skill IS reviewed once the rest has passed.
- **The Browser pane intermittently stops compositing**, so screenshots fail
  while every DOM tool keeps working (see CLAUDE.md). Cause unknown; it is a
  pane-visibility problem outside the app.

---

## The five-year expansion (2026-08-11) — what it fixed, and what it did not

Full write-up of the evidence in `docs/RESEARCH.md` §40. This section records
only what is still OPEN, with the numbers that measured it.

### Closed by this pass

- **Two planner cadences froze after 2000 sessions.** `state.sessions` is capped
  at 2000 records and both cadences counted with it, so the retention exit fired
  every session forever and applied work stopped entirely. Now counted from the
  event log (`engine/sessionOrdinal.ts`).
- **The maths aim never left the stated course.** Ten skills that exist in the
  app were unreachable in five years. `engine/effectiveTrack.ts` walks `next`
  once the stated course is fully proved, and says so in the session rationale.
- **The bank was a two-year bank.** 661 → 832 templates, 123 → 150 skills,
  8,323 → 10,337 variants; every non-maths bucket grew, and the Paths gained a
  prerequisite ladder they did not have.

### Still open, measured

**Human Insight cannot reach its 5% floor on short sessions.** Measured across
38 five-year runs: 2.4-2.9% on 15m, 20m, 2x15m, 3x20m and split-day shapes,
against 5.8-8.3% on 30m and longer. The mechanism is structural rather than a
content shortage — tripling the bucket's content did not move it. On a short
session the lab block is a SINGLE item shared across ten buckets, so any bucket
reachable only through the rotation lands near `labBudget / 10`. The academic
buckets also appear in the core block and Meta Lab also receives the retention
exit; Human Insight has neither, and the lowest target of any bucket. The gate
in `fiveYear.sim.ts` holds the starvation line (2%) and does not pretend the
floor is met.

Options not taken, and why: raising the default share is a product decision
about the balance between four named Paths and would not fix the mechanism;
giving short sessions two lab slots would lengthen the session past what the
learner chose.

**At 60 minutes a day the app runs dry in year one.** That learner meets 765 of
~800 question families inside twelve months, leaving years three to five with
almost nothing new. Three 20-minute sessions is the same story. This is the size
of the bank, not a scheduling fault, and the corresponding gate excludes those
volumes BY THEIR MINUTES rather than by name, so a future expansion lets them
back in automatically.

**A struggling learner meets about two thirds of the app.** At a flat 40%
first-try accuracy the five-year figure is 56 of 150 skills owned; a learner
whose accuracy fades to 30% reaches 108. This is the frontier logic working as
intended and is recorded so nobody later reads it as coverage failure. The
coverage gate is scoped to learners whose frontier is actually moving.

**Review backlogs do not clear for learners who fade or stop.** 58-100 items due
after five years for the fading and the cooled-off shapes. A failed review is
re-queued by design, so a backlog under sustained failure is the schedule
telling the truth. Worth watching only if it appears for a learner who is
succeeding.

**132 templates still overstate their variant count**, all mildly (70-95% of
declared render distinctly) and all from ordinary collisions between random
draws. The two that mattered — declaring 12 and 14 while asking five questions —
are fixed by indexing parameters off the folded seed instead of drawing them.
`src/sim/variants.sim.ts` gates the catastrophic case at 60%.

**A pigeonhole probe is narrower than it was.** `pfl-pigeonhole` measures cold
pick-up of an idea the app never teaches. The new Puzzle Lab skill `z-extremal`
includes a guarantee-by-counting item that is a pigeonhole argument without
naming it, so the probe now measures pick-up of the NAMED general principle
only. A third item that stated the general argument outright was removed rather
than let the claim quietly rot; the narrowing is written into the probe's own
comment.

### A note on measuring the measurement

Three separate findings in this pass turned out to be defects in the probe
rather than in the app, and all three pointed the same way — making the app look
worse than it was:

- the harness omitted `aboutSkillIds`, which pinned the retention exit's
  rotation to one target and reported 2 of 51 variants in use (it uses all 51);
- the variant probe ignored the puzzle payloads and reported the polyomino
  generators rendering 1 distinct item out of 30 (they render all 30);
- the harness read `sessions` from the same 2000-capped list the planner bug was
  about, inflating every per-session rate for a multi-session learner by up to
  2.7x — which produced a template "served 2,484 times in 2,000 sessions" that
  was really 2,484 in 5,475.

The fix that this suggests is not more caution; it is that any alarming
simulation result should be re-derived a second way before anything is changed
because of it. One attempted fix based on the third of these made the product
worse and was caught by an existing test.

---

## Closing the 2026-08-11 items (2026-08-12)

### CLOSED — Human Insight could not reach its floor

Not a content shortage: tripling the bucket did not move it. The cause was that
`STARVED_DEBT`, the bar a bucket must cross before the planner intervenes, was
set BELOW where the problem lived. At 0.5 — "served less than half of target" —
a bucket parked at 60-70% never reaches the bar, so nothing ever intervenes and
it stays there. Insight held 4.3-5.0% against 7% (debt 0.29-0.39); physics held
3.3-4.9% against 7%. A threshold set below the problem is invisible: nothing
fails, the number is simply always a bit wrong.

Fixed by `PATH_CORE_DEBT = 0.2` (a gentler, separate bar for a Path competing
for the core block, which is the only route it has) and `STARVED_DEBT` 0.5 to
0.4. 0.3 was tried and is too aggressive — the planner thrashes between starving
buckets, `sessionRhythm` caught it reviewing a skill twice in a day, and the
lightest learner's coverage collapsed.

Delivered against target at 30 minutes a day is now within about a point
everywhere except mathematics, which runs ~3 points high because a learner who
owns 70 of 150 maths skills reviews more maths.

### CLOSED, by admitting it rather than fixing it — the bank runs out

At an hour a day every skill is owned by year two and every one clears the
14-day bar; years three to five hold almost nothing new. No realistic amount of
authoring changes that, because the curriculum is finite by design. The actual
defect was the SILENCE: the app carried on serving reviews and never said the
ground had run out, which is the same failure as a progress bar that keeps
moving.

`engine/curriculumEnd.ts` derives the state and Progress says it plainly, with
the same refusal-to-exist rule as every other number here — a learner who has
met a third of the bank is never told they are near the end of it.

### NEW, and the most important thing found this pass

**The five-year gate was never deterministic, and nobody noticed.**

`pickSeed` uses `Math.random` to look for an unused variant, so the same
simulated learner played twice meets different questions. Measured spread
between two runs of the same matrix: **1 skill of coverage and 0.4 points of
delivered share**. The gate was built without accounting for it, so a borderline
assertion flipped depending on what else ran first — which presented as tests
interfering with each other and was really just noise.

Two consequences, both stated rather than quietly fixed:

1. **Any difference this session smaller than that spread was never real.** The
   larger movements (maths 38% -> ~30%, Insight 2.4% -> 6.8%) are far outside
   it and stand. Anything quoted to a tenth of a point should be read as
   plus-or-minus half a point.
2. A gate that flakes is worse than no gate, because it teaches people to
   re-run until it passes.

`Math.random` is now pinned per run inside the harness — deliberately there
rather than in the app, since the randomness is wanted in real use so two
learners on the same day do not get identical variants.

### Still open

- ~~**Physics is now the thinnest-served area** at 3.8-4.9% against a 7% target on
  multi-session and goal-tilted shapes.~~ CLOSED 2026-08-18: a second, gentler
  academic rescue (relative debt ≥ 0.25 AND ≥ 24 owed minutes in the window)
  fires for persistent small shortfalls without the thrash that killed the
  0.3 experiment. Worst case 4.8%, mean 6.3%. RESEARCH.md §45d.
- **Mathematics delivers ~3 points above target** through the review queue. This
  is arguably correct and is recorded so nobody later reads it as bias.
- Everything under "Still open, measured" from the previous section that is not
  named above remains as written.

---

## ~~The first three days are a maths app~~ (2026-08-12) — CLOSED 2026-08-18

CLOSED by the structural fix this section asked for: an opening breadth
sampler, separate from the core, paid in minutes, fading exactly where the
debt machinery switches on. Days 1-3 went from 7-8/10 maths across 2-3 areas
to 5-6/10 across 4 areas; week one now meets 9 of 10 areas; sessions stay
full; the strong-placement difficulty ordering holds. Day-by-day gate:
`src/sim/coldstart.sim.ts`. Full account: RESEARCH.md §45a-c. The analysis
below is kept because the four failed attempts are why the fix has this shape.

Found because the owner reset their progress, which made the first-run
experience suddenly the live question. Almost everything verified until now has
been a five-year aggregate; the opening fortnight had never been looked at.

**Measured on a fresh profile at 25 minutes a day:**

| day | items | mathematics |
|---|---|---|
| 1 | 10 | 7 |
| 2 | 10 | 8 |
| 3 | 10 | 8 |
| 4 | 9 | 2 |
| 5 | 7 | 0 |

Unbroken runs of six maths items at 25 minutes and eight at 45. It corrects
sharply on day four, because every balancing mechanism in `planner.ts` keys off
DEBT and `historyEnough` requires 60 minutes of practice before any of it
switches on. Before that there is no debt to balance.

The app introduces itself as ten areas and then spends a learner's first three
days on one of them.

### What the cause is NOT

Array ordering. On a cold start every bucket has identical relative debt, the
sort is stable, and `ACADEMIC_BUCKETS` lists mathematics first — so rotating the
starting point looked like the obvious fix. **It changed nothing**, because the
core bucket is chosen by SCORE, not by position. That attempt was written,
measured, found to be a no-op, and reverted rather than shipped with a comment
claiming an effect it did not have.

### What the cause is

Mathematics legitimately outscores everything early. Its skills are the
cross-bucket GATEWAYS — physics sits behind `m-units` and `m-exponents` — and
`prereqLeverage`/`GATEWAY_BONUS` correctly rank a door nobody can get through
above a door already open. The chosen course adds its own tilt on top. That
logic is right and should not be weakened.

Note that coding and science are NOT gated: `c-vars` and `s-hypo` have no
prerequisites at all. They are available on day one and simply lose on score.

### The fix that was tried, and why it was reverted

The block mathematics wins is up to eight items, which is most of a 25-minute
session — so winning the core once means owning the day. Capping the core to
three items before any history exists left the session **under-filled**: 20.5
planned minutes against a 30-minute request, where the floor is 24. Capping at
five filled the session but broke something more important — a learner who
placed STRONG got a lower mean difficulty than a cold learner (2.7 against 2.9),
because shrinking the core dilutes it with rotation items and the core is where
placement-aware difficulty aiming happens.

So breadth and difficulty-aiming currently live in the same block, and shrinking
it trades one for the other. Reverted.

### What a real fix needs

Either the rotation and top-up blocks become placement-aware so difficulty
survives a smaller core, or the first few sessions get a deliberate breadth slot
that is separate from the core rather than carved out of it. Both are larger
than a tuning change and want measuring properly, including against the
`difficultyFloor` test which is doing its job here.

**Open product question for the owner, not a bug to fix unilaterally:** is
front-loading the gateway skills the right first impression? It is defensible —
you cannot do quantitative physics before units — and it self-corrects inside a
week. The counter-argument is that a first impression is worth more than three
days of optimal sequencing, and that coding and science could carry breadth on
day one at no pedagogical cost.

### Update 2026-08-12: four attempts, none shipped

Tried again with the free rein and failed four different ways. Recording all of
them, because the pattern is the finding.

1. **Rotate the cold-start bucket order** — no-op. The core bucket is chosen by
   score, not array position.
2. **Cap the cold-start core at three items** — under-fills the session: 20.5
   planned minutes against a 30-minute request, floor 24.
3. **Cap it at five** — fills the session, but a STRONG placement then gets
   EASIER maths than a cold learner (2.83 against 3.17, measured on maths items
   alone). The core's item count is doing difficulty work: it ramps through a
   skill's templates, so taking items away takes the hard tail away.
4. **Widen the rotation budget instead of capping the core** (0.25 to 0.4 of the
   session before any history) — makes sessions longer than the learner asked
   for, and still moves the difficulty number.

The coupling is the point: **breadth, session length and difficulty aiming are
all carried by the same block**, and every lever that buys one spends another.
This is not a tuning constant, and four failed attempts is enough evidence that
it wants the structural change already described above rather than another try.

One thing did improve. `difficultyFloor.test.ts` was averaging difficulty across
the WHOLE plan to test a claim about the maths frontier — the fixture marks
every MATHS skill strong, and a rotation item's difficulty is aimed at its own
skill, so being strong at maths correctly does not make an Observer question
harder. Averaging them together meant any breadth/core change moved the number
for reasons unrelated to the frontier. Narrowed to maths items, and CANARIED:
making the frontier ignore the placement signal still fails it (2.56 against
2.78), so it caught what it was written for.

---

## The deepest game theory does not reach the lightest users (2026-08-15)

Found by reframing the five-year reach gate. It used to ask "did this learner
touch 85% of all skills" — a constant that breaks every time the curriculum
grows, so growing the bank made it fail for arithmetic reasons while hiding
anything real underneath. It now asks the question it always meant: **of the
skills whose prerequisites this learner has PROVED to Independent, how many
were never served at all?**

**Measured over five years, after the game-theory expansion — 53 across five of
the 38 shapes:**

| learner shape | skills stranded | why |
|---|---|---|
| goal: everything at once | 13 | tilt |
| goal: Everyday reasoning & judgement | 11 | tilt |
| keen for a year, then weekends | 11 | volume |
| 10m sporadic — the lightest real user | 10 | volume |
| leans on hints (45% hinted) | 8 | volume |
| the other 33 shapes | 0 | — |

Every stranded skill is one added in this pass: `i-levelk`, `i-mixed`,
`i-median`, `i-credible`, `i-fairness`, `i-trust`, `i-commons`, `i-unpredict`,
`i-selection`, `i-iterated`, `i-common`, `i-backward`.

### Two causes, and only one is a defect

**Volume.** Twelve new topics went into one bucket. That bucket has a fixed share of the
minutes, so its tail now takes longer to arrive than a ten-minute sporadic
learner has in five years. Nothing is unreachable in principle and no earlier
skill was displaced — the pre-existing Path skills that appeared in the first
measurement turned out to be an artifact of a looser definition of "ready", and
do not strand once readiness means prerequisites PROVED rather than merely met.

Shortening four prerequisite chains helped and was worth doing on its own
terms: level-k, mixed strategies, fairness and trust now hang off the
cooperation lab rather than off each other, because they are parallel ideas
rather than sequential ones.

### The honest trade

The game-theory material is now deep enough that the lightest users will not
finish it inside five years. Two ways to make that number go away and both are
worse: thin the curriculum, or give the Investigator bucket a larger share and
starve something else. **This is a real cost of depth and it is worth paying.**
For the app's actual owner at 30+ minutes a day, everything is reached.

The gate pins the three shapes by name and asserts the count does not grow, so
the cost stays visible and anything NEW stranding fails.

---

## The 2026-08-18 upgrade pass — closed, opened, and a process scar

### Closed (details in RESEARCH.md §45)

- **The first three days are a maths app** — opening breadth sampler (§45a).
- **Physics under-serving** — second academic rescue, worst 4.8% / mean 6.3% (§45d).
- **Interleaving order** — interleaved core blocks now alternate skills in play order (§45e).
- **Review arithmetic lied twice** — survived gaps now floor the next interval; only spaced (≥48h) retrievals feed the stability factor (§45f).
- **Dispute quarantine leaked** — coach, Error Clinic and weekly objective now read the filtered log like the planner always did (§45g).
- **Warm-up ceiling** — the flat min(9, …) swallowed the queue-pressure widening for every session over ~30 minutes; the ceiling now scales (30% of the session), and 40+ minute sessions under pressure may retire 7 reviews.

### Newly pinned, not fixed

- **'30m sporadic' and 'plateaus early' joined the razor-edge list** in the
  five-year stranded gate: their game-theory tail arrives within ~90 days of
  the horizon and which side it lands on is harness noise (ownership 157-164
  of 165 across four configurations). Ceiling 53 → 57. §45h.

### A process scar worth keeping

During this pass an agent ran `git stash` on the shared working tree and swept
every in-flight edit from four parallel workstreams. Recovery was clean (the
stash held everything), but the rule it wrote: **commit each verified batch
before parallel agents start, and agents never run git write commands.** The
engine batch went in as its own commit within minutes of being re-verified.
