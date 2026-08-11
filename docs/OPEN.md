# Open work

What is known to be missing, wrong, or unproven. Kept here rather than in a
head or a chat scrollback, so the next session starts from the truth.

Ordered by the project's own tie-breakers: fixing a way the app is wrong about
the learner beats adding anything; honest evidence beats more content;
measurement beats features; depth in maths beats breadth elsewhere.

Last reviewed: 2026-08-11 (second pass).

---

## Committed to, not yet built

### 5. Item cooldown — PARTLY DONE
Shipped: template-level repeat tracking, a three-stage degrade that never
skips a due review, the twelve-hour rest applied to the family warm-up path,
`cooldownPressure()`, and retention no longer counting a repaired repeat.

NOT shipped, deliberately: "never the same template twice in a session" as an
absolute rule, and the 30-day window. Measured over simulated years:

| config | owned @85% | owned @55% |
| --- | --- | --- |
| baseline | 67 | 45 |
| cap 1 | 69 | 41 |
| cap 1 + repeat-if-well-fitted | 72 | **38** |
| cap 2 + repeat-if-well-fitted | 68 | **31** |

Every version that reduced repetition cost a STRUGGLING learner owned skills —
RESEARCH.md §37j re-derived. The cap-1 variants also pushed one diagram to 11
servings against a soft cap of 9, cause not found. The measured cap of 2
stands.

Worth revisiting IF the thin pools get filled by step 6: the trade exists
because there is not enough content at the right difficulty, so importing may
dissolve it rather than balance it.

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

Result: skills below the independence bar 23 to 21; fully blocked 6 to 4.
`s-hypo`, `s-corr` and `m-sampling` are fixed.

STILL BLOCKED, and not fixable from this source: `i-abduce`, `c-decomp`,
`i-commit`, `x-stuck`. The thinnest pools are reasoning skills — abduction,
commitment, decomposition, working while stuck — and no openly licensed
statistics or algebra text contains problems about them. This is the central
obstacle to finishing step 6: the abundant CC BY sources serve pools that are
already healthy, and the starved pools have no obvious open source at all.

Next options, roughly by promise: OpenStax *Introductory Business Statistics*
and the CC BY algebra titles for more maths depth; pre-1930 public domain
logic and puzzle texts for `i-abduce`; accepting that `x-stuck` and `c-decomp`
may have to stay generator-backed.

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

### 21 skills cannot currently be proven
Marking 204 templates burned left 6 skills with no clean template family at all
and 17 more below the number independence requires. The OpenStax import fixed
three, so it now stands at **4 fully blocked and 17 thin**. They are still
taught and practised; they cannot reach Independent. `poolPressure()` ranks
them worst-first and that ranking is the import shortlist.

Still fully blocked: `i-abduce`, `c-decomp`, `i-commit`, `x-stuck`.

This is the honest cost of the burned flag rather than a defect, but it is a
real ceiling on the north-star metric and should not be forgotten because it
was deliberate.

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
47 of 624 templates carry any exposition, and 9 of those are `pfl-*` probes
which are deliberately barred from the ladder. This is a real gap, and the
project has decided NOT to close it: lectures do that job, and the app's stated
purpose is proving retention rather than delivering instruction. Recorded so
the decision stays a decision rather than an oversight.

### Breadth outside mathematics is a sample
Maths is 298 of 624 templates and 5,503 of 8,173 generated problems. Every
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
