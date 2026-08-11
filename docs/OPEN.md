# Open work

What is known to be missing, wrong, or unproven. Kept here rather than in a
head or a chat scrollback, so the next session starts from the truth.

Ordered by the project's own tie-breakers: fixing a way the app is wrong about
the learner beats adding anything; honest evidence beats more content;
measurement beats features; depth in maths beats breadth elsewhere.

Last reviewed: 2026-08-10.

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

### 6. Curation, not generation
Import human-authored problems. CC BY 4.0 and public domain only —
Illustrative Mathematics FIRST edition (2019–2021; v.360 is CC BY-NC),
OpenStax verified per book, pre-1930 texts. ShareAlike is refused because this
repository is public and SA would propagate. `ATTRIBUTIONS.md` holds the rule;
the `source` field on `ItemTemplate` and the audit gate already exist and are
unused. Prioritise whatever step 5 reports as thinnest.

### 7. Measure the north star
Delayed retention checks (unaided re-test at 14+ days, hints unavailable,
reported separately), transfer probes as their own metric, minutes-to-retention
as a trend. A plain dashboard: no streaks, no points, no encouragement. If the
number is flat it should look flat.

The app cannot currently answer any of its three defining questions in numbers:
what can I do unaided now that I could not three months ago; what has survived
from three months ago; how many focused minutes did each retained skill cost.

---

## Known gaps in what has shipped

### 23 skills cannot currently be proven
Marking 204 templates burned left **6 skills with no clean template family at
all** and **17 more below the number independence requires**. They are still
taught and practised; they cannot reach Independent. `poolPressure()` ranks
them worst-first and that ranking is the import shortlist for step 6.

This is the honest cost of the burned flag rather than a defect, but it is a
real ceiling on the north-star metric and should not be forgotten because it
was deliberate.

### The construct grader has a known false-negative class
`docs/RESEARCH.md` §39b lists what it rejects that a person would accept: an
unevaluated expression (`2^3`, `sqrt(9)`, `12/4 + 1`), a unicode fraction
glyph, scientific notation with a unit attached. No item currently needs any of
these, so nothing is broken today; adding one that does would break quietly.

### Nothing catches an over-strict constraint
Four layers now catch a construct constraint that is too loose or outright
wrong (§39d). None catches one that is too STRICT in a way the witness happens
to satisfy — it would reject correct answers and every gate would stay green.
The only defence is the hand-written positives.

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

- **`nr-digit-target` accepts any arrangement matching the optimal distance,**
  not only the optimal arrangement. Correct as specified, but the explanation
  claims a specific pairing; a learner who ties by another route reads a
  mismatch.
- **Dispute resolution has no reminder, deliberately.** Open disputes are
  already out of the numbers, so there is no urgency — but if one is never
  settled, the attempt is silently discarded forever. Watch whether that
  becomes a way to quietly delete inconvenient evidence.
- **`ATTRIBUTIONS.md` lists no adapted material** because none has been
  imported. The audit gate that enforces the licence rule has therefore never
  fired against a real source.
- **The Browser pane intermittently stops compositing**, so screenshots fail
  while every DOM tool keeps working (see CLAUDE.md). Cause unknown; it is a
  pane-visibility problem outside the app.
