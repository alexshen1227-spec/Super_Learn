# Axiom Lab — Research Ledger

This ledger records the evidence behind every load-bearing product behavior, and
just as importantly what the evidence does **not** support. Two tiers are used:

- **EVIDENCE** — supported by meta-analyses, systematic reviews, or a practice
  guide with at least moderate evidence. The app may state these plainly.
- **HEURISTIC** — a reasonable product decision consistent with the literature
  but not itself validated (e.g. exact review intervals, promotion thresholds).
  Wherever a HEURISTIC reaches the user, the copy says "rule of thumb" or
  "heuristic", never "proven".

Access dates: sources marked ✓ were re-accessed 2026-08-05 from this machine;
others are cited from their stable published records.

---

## 1. Retrieval practice ("testing effect") — EVIDENCE

- **Claim**: Retrieving knowledge from memory produces more durable learning
  than re-reading or passive review; effects grow at longer delays.
- **Sources**:
  - Roediger & Karpicke (2006), *Test-Enhanced Learning: Taking Memory Tests
    Improves Long-Term Retention*, Psychological Science 17(3).
    DOI: 10.1111/j.1467-9280.2006.01693.x
  - Dunlosky et al. (2013), *Improving Students' Learning With Effective
    Learning Techniques*, PSPI 14(1). DOI: 10.1177/1529100612453266 — rates
    **practice testing** as HIGH utility.
  - IES Practice Guide *Organizing Instruction and Study* (2007),
    Rec. 5b "Use quizzes to re-expose students to key content" — **Strong**
    evidence. ✓ https://ies.ed.gov/ncee/wwc/PracticeGuide/1
- **Product behavior**: every activity demands an attempt (solve / predict /
  explain / reconstruct) before any answer is shown; reviews are retrieval
  attempts, not re-reads; lessons end in retrieval, not summaries.
- **Limitations**: most lab studies use verbal materials; effect sizes vary
  with feedback timing and initial success rate. This supports the design
  direction, not any specific quiz count.

## 2. Spaced (distributed) practice — EVIDENCE; exact intervals HEURISTIC

- **Claim**: Spreading practice over time beats massing it; the optimal gap
  scales with the retention interval you care about.
- **Sources**:
  - Cepeda, Pashler, Vul, Wixted & Rohrer (2006), *Distributed practice in
    verbal recall tasks*, Psychological Bulletin 132(3).
    DOI: 10.1037/0033-2909.132.3.354
  - Dunlosky et al. (2013) — **distributed practice** rated HIGH utility.
  - IES Practice Guide Rec. 1 "Space learning over time" — **Moderate**. ✓
- **Product behavior**: review scheduler with an explainable interval ladder
  (~1 → 3 → 7 → 14 → 30 → 60 days), shortened by errors and high-confidence
  mistakes, lengthened by easy independent recall.
- **Tier correction (2026-08-09)**: for MATHEMATICAL PROCEDURES specifically,
  spacing drops from EVIDENCE to HEURISTIC here. A well-powered experiment
  found no retention benefit from distributing practice on a math procedure at
  either a 1-week or 5-week test, and the authors decline to recommend it for
  mathematics on current evidence. The ladder stays — retrieval (§1) is not in
  question and nothing suggests spacing hurts — but the tier is now honest.
  See §29e.1.
- **HEURISTIC label**: the specific ladder values and multipliers are product
  heuristics; Cepeda et al. support *expanding gaps tuned to the retention
  goal*, not these exact numbers. The Settings/About screen says so.
- **Granularity correction (2026-08-06)**: spacing was tracked per SKILL, but a
  skill spans many question families (`m-percent` has ten). A single schedule
  meant a strong family could satisfy the review and push the interval out
  while a family the learner had actually failed went untested — verified in
  `formSpacing.test.ts`, where the skill reaches **Retained** on the easy
  family while the failed one is never re-asked. Each family now carries its
  own ladder position, and the planner asks for the family that lapsed rather
  than any item from the topic. Families never attempted have no schedule (so
  they cannot flood the queue) and the due list is capped, because per-family
  scheduling multiplies review load roughly fivefold.

## 3. Interleaving — EVIDENCE (moderate, strongest in math)

- **Claim**: Mixing confusable problem types improves discrimination and later
  test performance versus blocked practice, especially in mathematics.
- **Sources**: Rohrer & Taylor (2007) *The shuffling of mathematics problems
  improves learning*, Instr Sci 35; Rohrer, Dedrick & Stershic (2015), JEP
  107(3); Dunlosky et al. (2013) rate interleaved practice MODERATE utility.
- **Product behavior**: once a skill leaves the guided state, mixed-review
  blocks interleave neighboring skills and ask strategy-identification
  contrast questions ("what feature of this problem picks the method?").
- **Coverage correction (2026-08-06)**: this previously described the
  mixed-review MODE only — the daily core block stayed blocked practice on a
  single skill however well the learner knew it. The core block now interleaves
  up to two neighbouring skills from the same bucket once the target skill
  reaches independence, and stays blocked below that, which is the direction
  the evidence actually supports.
- **Limitations**: blocked practice is still used at first exposure — the
  literature supports interleaving *after* initial acquisition.
- **Effect-size correction (2026-08-09)**: heterogeneity is very high
  (I² = 77.3%) and trim-and-fill indicates publication bias, adjusting the
  pooled effect down to g = 0.29 [0.20, 0.38]. See §29e.2.

## 4. Worked examples and faded guidance — EVIDENCE

- **Claim**: Studying worked examples, then completion problems, then
  independent problems outperforms pure problem-solving for novices; the
  advantage reverses as expertise grows (expertise-reversal effect).
- **Sources**: Sweller & Cooper (1985) Cognition & Instruction 2(1);
  Renkl (2014) in Cambridge Handbook of Multimedia Learning; Kalyuga et al.
  (2003) *Expertise reversal effect*, Educational Psychologist 38(1); IES
  Practice Guide Rec. 2 (interleave worked examples with practice) —
  **Moderate**. ✓
- **Product behavior**: the six-rung support ladder (worked example →
  self-explanation → completion → hinted → independent → transfer); support
  fades on evidence of competence and is restored after diagnostic errors.

## 5. Corrective feedback + required re-attempt — EVIDENCE (direction), flow HEURISTIC

- **Claim**: Feedback that identifies the error and requires a corrected
  attempt beats answer-only feedback; delayed re-testing of the same concept
  consolidates the repair.
- **Sources**: Hattie & Timperley (2007) *The Power of Feedback*, RER 77(1);
  Metcalfe (2017) *Learning from errors*, Annual Review of Psychology 68;
  Butler & Roediger (2008) Memory & Cognition 36.
- **Product behavior**: wrong answers trigger the repair loop (what was right →
  first meaningful error → why → smallest next step → corrected attempt →
  a different item on the same idea later). The exact 6-step script is a
  HEURISTIC implementation of these findings.
- **Coverage correction (2026-08-06)**: this claim was previously broader than
  the implementation. The repair fork existed only for single-item activities;
  multi-part activities — case files, work studios, and the method drill —
  showed the explanation on an error and moved on, with no corrected attempt.
  That was ~30% of all graded forms, including the 360 forms of the method
  drill. Every graded checkpoint now enters the same fork. Where a full reveal
  is taken inside a multi-part activity there is no twin problem (regenerating
  the template would swap every other checkpoint), so the repair is
  consolidated by the shortened review interval instead — which is the
  delayed re-testing half of the finding rather than the immediate half.
- **Diagnosis, not self-report (2026-08-06)**: feedback can only target an
  error it can identify. Where the interesting failure is WHERE reasoning broke,
  items now ask for the intermediate values (`steps` answers) and the first
  broken link supplies the error tag. This replaces asking the learner to
  classify their own mistake — self-diagnosis is self-assessment, which the
  evidence model refuses everywhere else, and novices are known to be poor at
  it (Chi et al. 1994 on self-explanation quality varying widely by learner).
  The step→tag mapping is authored and therefore a HEURISTIC; what is not
  heuristic is that the tag now comes from observed work rather than opinion.
- **Coverage correction (2026-08-09)**: the paragraph above described the
  design; the implementation reached 4.1% of misses. Measured, fixed and
  re-measured at 51.3% — see §29e.4 and §30.
- **Evidence rule**: a repaired checkpoint yields GUIDED evidence only.
  `firstCorrect` is fixed at the first submission and a hint anywhere in the
  activity disqualifies independent evidence (`engine/activity.ts`, tested in
  `activity.test.ts`).

## 6. Self-explanation — EVIDENCE (moderate)

- **Claim**: Prompting learners to explain steps to themselves improves
  comprehension and transfer.
- **Sources**: Chi et al. (1994) Cognitive Science 18; Dunlosky et al. (2013)
  rate self-explanation MODERATE utility; IES Rec. 7 (deep explanatory
  questions) — **Strong**. ✓
- **Product behavior**: worked examples pause for "why this step?"; exit
  tickets ask for one reusable principle; Learning Compression activities.

## 7. Metacognition and calibration — EVIDENCE (direction)

- **Claim**: Teaching learners to plan, monitor, and evaluate — and giving
  them calibration feedback — improves learning; learners' confidence is
  often miscalibrated.
- **Sources**: EEF Guidance Report *Metacognition and Self-Regulated
  Learning* (2018), educationendowmentfoundation.org.uk — "high impact for
  very low cost, extensive evidence" per the EEF toolkit; Dunning et al.
  (2004) PSPI 5(3) on miscalibration.
- **Product behavior**: periodic confidence ratings on substantive items;
  calibration curves by confidence band; high-confidence errors flagged and
  scheduled for early review; "I don't know" is an honored answer, never
  penalized relative to a wild guess.
- **Limitation**: EEF evidence is about classroom metacognitive instruction;
  the app's specific calibration UI is a HEURISTIC application.

## 8. Multiple representations — EVIDENCE (moderate)

- **Claim**: Pairing verbal, symbolic, and visual representations, and
  connecting concrete to abstract, aids learning.
- **Sources**: IES Practice Guide Recs. 3 & 4 — **Moderate** ✓; Mayer,
  multimedia learning principles (2009).
- **Product behavior**: concept cards pair a plain-language statement with a
  diagram/table and a symbolic form; items ask for representation choice.

## 9. Deliberate practice — EVIDENCE (direction)

- **Claim**: Improvement comes from focused work on specific weaknesses just
  beyond current reliable performance, with feedback — not from accumulated
  hours alone.
- **Sources**: Ericsson, Krampe & Tesch-Römer (1993) Psych Review 100(3);
  Ericsson & Pool, *Peak* (2016) for the popular formulation.
- **Product behavior**: the planner targets the highest-leverage weakness and
  tracks improvement on that weakness, not minutes; the Error Clinic converts
  real mistakes into targeted practice.

## 10. Transfer requires explicit bridging — EVIDENCE (direction)

- **Claim**: Transfer is hard and rarely automatic; abstracting the principle
  and comparing cases helps; teaching in varied contexts helps.
- **Sources**: *How People Learn II* (National Academies, 2018),
  https://www.nationalacademies.org/publications/24783 (chapters on transfer);
  Gick & Holyoak (1983) Cognitive Psychology 15 (schema induction from
  comparing analogs); Barnett & Ceci (2002) Psych Bulletin 128 (transfer
  taxonomy).
- **Product behavior**: Transfer Bridges after puzzles (name the principle,
  strip the surface, apply in a new domain); skills only reach "Transferred"
  through success on a novel-context item; Weekly Case Files mix domains.
- **Coverage correction (2026-08-07)**: two things in the line above were
  narrower than they sounded. (a) Barnett & Ceci was cited here but never used
  structurally — "novel-context item" meant a single dial, an unfamiliar
  question family inside the same subject, format and sitting. The taxonomy is
  now actually applied; see §21. (b) The Transfer Bridge that "applies in a new
  domain" NAMED the principle in its prompt, which is cued application rather
  than transfer; see §22. Both are fixed, and both were overclaims in this
  entry rather than in the code alone.

## 11. What does NOT transfer — EVIDENCE of absence

- **Working-memory training** does not improve intelligence or far-transfer
  measures. Melby-Lervåg, Redick & Hulme (2016), Perspectives on Psychological
  Science 11(4), meta-analysis of 145 comparisons: "no convincing evidence of
  any reliable improvements" on far-transfer measures vs treated controls. ✓
  https://pubmed.ncbi.nlm.nih.gov/27474138/
- **Chess instruction** shows at best small, low-quality-design effects on
  academic outcomes; the skill trained is mostly chess. Sala & Gobet (2016),
  *Do the benefits of chess instruction transfer to academic and cognitive
  skills? A meta-analysis*, Educational Research Review 18.
  https://www.sciencedirect.com/science/article/pii/S1747938X16300112
- **Brain-training games**: Simons et al. (2016), PSPI 17(3) — improvements
  are task-specific.
- **Product behavior**: Axiom Lab never claims puzzles or chess "raise IQ".
  Chess and puzzles are framed as (a) valuable skills in their own right and
  (b) practice arenas for *taught* general strategies (calculation habits,
  candidate-move discipline) whose transfer the app tests directly and
  reports honestly. The app displays **no global intelligence score**.

## 12. Neuromyths explicitly rejected — EVIDENCE of falsity

| Myth | Status | Key source |
| --- | --- | --- |
| "You use only 10% of your brain" | False | Boyd (2008); neuroimaging shows near-total activity |
| Left-brain/right-brain learner types | False | Nielsen et al. (2013) PLOS ONE 8(8) |
| Matching visual/auditory/kinesthetic styles | No supporting evidence | Pashler, McDaniel, Rohrer & Bjork (2008) PSPI 9(3) |
| Microexpressions reliably reveal lies | Unsupported | Bond & DePaolo (2006) meta-analysis: ~54% lie-detection accuracy |
| Brain games raise general intelligence | Unsupported | Simons et al. (2016); Melby-Lervåg et al. (2016) ✓ |
| Chess automatically improves academics | Unsupported | Sala & Gobet (2016) |
| Speed = intelligence | Conflates constructs | speed is trained only after accuracy/retention (see §14) |
| One quiz proves permanent mastery | False | forgetting curves; Cepeda et al. (2006) |
| A single app IQ number | Invalid measurement | no app task battery is a validated IQ instrument |
| Difficulty is good because it hurts | Distortion | "desirable difficulties" (Bjork) are *specific* (spacing, retrieval, interleaving), not discomfort per se |

The app's copy never asserts any of the left column. The Observer/Insight labs
teach *calibration about people* (including the microexpression myth) rather
than "reading" people.

## 13. Mastery, prerequisites, and the evidence model — HEURISTIC (informed)

- Promotion thresholds (2 independent first-attempt successes on distinct
  forms; retention checked ≥48h later; transfer via novel context) are
  **product heuristics**, labeled as such in the UI. They implement the
  direction of §§1–2 and the mastery-learning tradition (Bloom 1968; modern
  implementations in Khan Academy mastery systems) without claiming precision.
  **Citation correction (2026-08-09)**: Bloom's 2-sigma does not survive —
  pooled tutoring is about d = 0.79, his comparison used an unequal mastery
  criterion, and mastery gains fade and may be test-specific. See §29e.3.
- **Transfer is now measured (2026-08-06)**: "Transferred" previously fired on
  any success in transfer mode, which meant an authoring flag decided the top
  rung. It now additionally requires the item to come from a template family
  the learner has never practiced that skill on — novelty checked against their
  own event history at replay time. This is a narrower and more defensible
  reading of Barnett & Ceci's "different context" dimension; it still does not
  claim far transfer, and the app makes no such claim.
- **Correction to that correction (2026-08-07)**: calling one dial "a narrower
  and more defensible reading of Barnett & Ceci" was itself too generous. A
  novel template family inside the same subject, the same answer format and the
  same sitting moves ONE of nine dimensions, which is near transfer by their
  own taxonomy. The rung now requires at least two observable dimensions and
  records which were crossed. Measured effect: over a simulated year, skills
  reaching Transferred fall to 2 of 47 practiced. See §21.
- Append-only evidence with derived state ensures deleting/editing history
  recomputes progress honestly.

## 14. Speed after accuracy — HEURISTIC (informed)

Fluency matters (e.g. fact fluency frees working memory — Codding et al. 2011
meta-analysis on math fact interventions), but timing pressure before accuracy
encourages guessing and penalizes accommodations. The app orders goals:
accuracy → explanation → independence → retention → transfer → (optional)
fluency, and never penalizes slow reading or motor input outside explicit,
user-opted fluency drills.

## 15. Privacy & youth safety — regulatory guidance

- FTC COPPA FAQ: verifiable parental consent duties fall on operators
  *collecting* personal information from children under 13 online.
  https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions
  Axiom Lab's posture: collect nothing, transmit nothing — all data stays in
  browser storage on the device; no accounts, no analytics, no ads. This is a
  privacy-by-architecture posture, not a substitute for legal review if the
  app were ever publicly distributed to children.
- NIST AI Risk Management Framework 1.0 (2023),
  https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10 —
  informs the coach's transparency rules: decisions are explainable,
  uncertainty is surfaced, no covert inference about protected traits or
  mental states, and the "coach" is deterministic rules over local evidence,
  not a model presented as a mind.

## 16. High-school readiness — EVIDENCE (direction); allocation HEURISTIC

- **Claim**: Middle-grade **grades and attendance/steady habits** predict high
  school success better than test scores or background; students leaving 8th
  grade with a GPA ≥ 3.0 are the ones with a moderate-or-better chance of a
  college-bound high school GPA. Algebra readiness is the academic gateway
  into the HS math sequence.
- **Source**: UChicago Consortium on School Research (2014), *Looking Forward
  to High School and College: Middle Grade Indicators of Readiness in Chicago
  Public Schools*. ✓ (record located 2026-08-05)
  https://consortium.uchicago.edu/publications/looking-forward-high-school-and-college-middle-grade-indicators-readiness-chicago
- **Product behavior**: the app's high-school-readiness lever is therefore
  (a) durable mastery of the middle-school → Algebra 1 spine (the math course
  graph is exactly this ladder), (b) support for real schoolwork (deadline-
  aware planning, homework scaffolding that teaches instead of answering),
  and (c) a sustainable, non-punitive practice rhythm — never cramming
  rewards or streak-shaming. Readiness is woven into the normal curriculum
  and coach behavior rather than advertised as a separate mode.
- **Allocation note (HEURISTIC)**: default allocations weight the academic
  core at ~55% (math heaviest) because grades and algebra readiness are the
  best-evidenced levers for the user's stated goals; thinking labs and
  puzzles keep meaningful shares for breadth, calibration, and motivation.
  These defaults are a design judgment, editable in Settings.

## 17. Platform references

- PWA install/offline patterns: MDN Progressive Web Apps guide,
  https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps
- IndexedDB usage and eviction/persistence:
  https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB
  plus `navigator.storage.persist()` for eviction protection.

## 18. Design-inspiration provenance (not evidence)

- **Yale ECON 159, *Game Theory* (Ben Polak), Open Yale Courses** —
  https://oyc.yale.edu/economics/econ-159 and lecture 1, "Introduction: five
  first lessons". Two things taken as DESIGN, not content: (a) the course's
  signature sequence of **playing a game before formalising it**, which the app
  implements as a commitment step preceding the payoff table (`gt-play-first`);
  and (b) the observation that identical structures with different payoffs are
  different games — "you can't get what you want till you know what you want" —
  which the strand was missing entirely and which is now `gt-payoffs-matter`.
  No lecture text, examples, or numbers were reproduced; the scenarios and all
  payoffs are original and generated.
- **Khan Academy Mastery Challenges** —
  https://support.khanacademy.org/hc/en-us/articles/360037127892 . Taken: the
  **two-questions-per-skill** rule, because one question cannot separate a
  lucky guess from retained knowledge, and it mirrors this app's existing "two
  unaided successes on distinct forms" rule for independence. Also the idea of
  a periodic cumulative check spread across previously practised skills
  (implemented unit-scoped, in `engine/checkpoint.ts`). Deliberately NOT taken:
  the mastery-points economy (50/80/100), because a parallel score would
  compete with the evidence ladder and would reintroduce a number that means
  less than the rung it sits beside.
  **Coverage correction, 2026-08-07:** "distinct forms" was implemented as
  distinct `templateId:seed` pairs, so two randomisations of ONE generator
  satisfied it — the same question with different numbers, counted as two
  forms. A form is now the template FAMILY, and the four Paths require three
  families rather than two, because judgment skills are the easiest to pass by
  recognising a question shape. Both numbers remain HEURISTIC: no study fixes
  them. The change came from the learner asking that mastery mean something
  usable in real life, and it demotes some previously-earned rungs on replay —
  which is the append-only evidence model working as intended.
- **AoPS Alcumus** (already cited below) — its adaptive selection and
  "problems seen recently are less likely to reappear" behaviour informed the
  planner's novelty tracking and within-session difficulty adaptation.

- Alcumus design notes (difficulty near the frontier, mixed current + review):
  https://artofproblemsolving.com/blog/articles/alcumus-a-peek-under-the-hood-of-our-adaptive-learning-tool
- Khan Academy mastery system (course→unit→skill, mastery challenges):
  https://support.khanacademy.org/hc/en-us/articles/360007253831 and
  https://support.khanacademy.org/hc/en-us/articles/360037127892
- No content, artwork, question text, or scoring constants were copied from
  either product. All items in `src/content/` are original (provenance field
  on every item).

## §19 — Abduction / inference to the best explanation (`i-abduce`)

**Claim taught:** explanation-choosing is two steps. Abduction generates the
candidate explanations; inference to the best explanation (IBE) ranks them by
explanatory virtues. The two virtues the content trains directly are **scope**
(how much of the evidence a candidate accounts for) and **parsimony** (how many
unsupported auxiliary assumptions it needs). A third family trains **fit with
background knowledge** — naming the specific fact an inference rests on.

**Tier: ESTABLISHED CONCEPT, not an effect size.** This is a description of a
reasoning method from philosophy of science, not a claim that practising it
produces a measured learning gain. No number is asserted to the learner
anywhere in this content, and no transfer claim is made beyond the app's normal
per-user transfer testing.

**Sources**
- Inference to the Best Explanation — an overview (Cabrera):
  https://philsci-archive.pitt.edu/20363/ — sets out abduction as the
  candidate-generating first step and IBE as the evaluative second, and
  surveys the explanatory virtues.
- Explanatory virtues and coherence (Synthese):
  https://link.springer.com/article/10.1007/s11229-011-0054-y — parsimony as
  the size of the set of auxiliary assumptions a hypothesis needs; scope /
  unification as breadth of evidence covered.

**The ceiling is taught, not hidden.** Lipton names the gap between the
explanation that would give the most understanding if true and the one most
likely to be true ("Voltaire's objection"). The `abd-overreach` family exists
so the method never ships without it: the correct answer there is repeatedly
"leading candidate, not proven — and here is the test that would settle it".

**Safety boundary (content law).** The famous fictional demonstration of this
skill is reading a person's history off their appearance. That is cold reading
and profiling, which Observer/Insight content explicitly refuses, so it is
refused here too. Every scenario reasons about objects, places and events;
where a person appears, the inference is about what happened, never about what
they are like. The `abd-parsimony` case about an unanswered message is
deliberately scored the other way — the elaborate story about someone's inner
state is the WRONG answer.

**Provenance note.** Prompted by the learner asking whether a Sherlock
Holmes-inspired Path should be added. The measured answer was no: Observer
(observation vs inference, recall, listening, bias) and Investigator (logic,
Bayes, competing hypotheses, forecasting) already cover that ground, and the
app's four Paths are named in the founding brief as its identity. What the
question did surface was a real gap — nothing taught generating or ranking
explanations — which is what this skill fills, inside the Path where it belongs.

## §20 — Making the Paths reach real life — EVIDENCE (mechanisms), OUTCOME NOT GUARANTEED

The learner's ask: practise the four Paths consistently for a year or two and
be able to use them outside the app. Their own framing was "not guaranteed,
nothing is, but that is the goal" — which is the correct framing, and this
entry keeps the app to it.

**What must not be claimed.** No study supports "practise these skills for N
months and you will apply them in life". Far transfer is the hardest result in
the field and the app's own neuromyth table already refuses adjacent claims
(brain games raising general intelligence, chess improving academics). Nothing
in the UI says or implies that. What the app CAN do is use the mechanisms that
raise the odds, and keep measuring what it can actually see.

### 20a. Comparing two analogues to abstract the structure — EVIDENCE

- **Claim**: abstracting a transferable schema from a single worked example
  largely fails; comparing TWO analogues from different surfaces produces the
  schema as a by-product and raises later spontaneous transfer.
- **Source**: Gick & Holyoak (1983), *Schema induction and analogical
  transfer*, Cognitive Psychology 15(1).
  https://www.sciencedirect.com/science/article/abs/pii/0010028583900026 —
  Part I tried to induce a schema from one analogue via summarising, stating
  the principle, and diagramming, with little success; Part II found subjects
  derived the schema while describing the similarities between two analogues.
  Gentner, Loewenstein & Thompson (2003) replicate the comparison effect in
  applied training settings:
  https://groups.psych.northwestern.edu/gentner/papers/GentnerLoewensteinThompson03.pdf
- **Uncomfortable implication, recorded deliberately**: "teach one case, then
  state the principle" is close to the Part I manipulation that did NOT work,
  and that is what most of this app's Path explanations do. The bridge items in
  `content/items/transferBridge.ts` implement the Part II version instead: two
  scenarios far apart on the surface, one shared structure, and the question is
  what the structure IS. Distractors are deliberately SURFACE matches, because
  matching on surface is the failure being trained against.
- **Product behavior**: two families per Path — `*-compare` (extract the shared
  structure from two cases) and `*-spot` (given the structure, find it in an
  unlabelled third situation). The second carries `transfer: true`.
- **Limitation**: this raises transfer to novel PROBLEMS, mostly measured
  minutes-to-days later in lab settings. It is not evidence about behaviour in
  someone's life two years on.

### 20b. Implementation intentions — EVIDENCE

- **Claim**: an if-then plan naming a specific cue ("if situation Y, then I do
  Z") substantially narrows the gap between intending an action and performing
  it, by making the cue itself trigger the behaviour.
- **Source, CORRECTED 2026-08-12**: this entry cited Gollwitzer & Sheeran
  (2006), d = 0.65 across 94 tests. **That number is roughly four times the
  current best estimate and must not be quoted again.** The same authors have
  published a far larger update: Sheeran, Listrom & Gollwitzer (2024), *The when
  and how of planning: meta-analysis of the scope and components of
  implementation intentions in 642 tests*, European Review of Social Psychology
  36(1).
  https://kops.uni-konstanz.de/server/api/core/bitstreams/d703c468-46e9-47fc-8900-d32d7d19c8d9/content
  - Overall **d = .36** [.33, .40] across 642 tests.
  - Egger's b = 1.06 — the authors themselves call it substantial publication
    bias. Trim-and-fill d = .35; **Robust Bayesian correction d = .15**
    [.08, .22], with extreme evidence both for an effect AND for the bias.
  - **This app sits in the worst cell of every moderator**: field rather than
    lab (.27 vs .49), online delivery (.31 vs .53 in person), a horizon of weeks
    to months (1–6 months: **.19**), and an adolescent learner, where the whole
    literature is 25 tests against 557 adult ones. A children's meta-analysis
    (Breitwieser et al. 2026, *BJP*, g = 0.31, 42 studies, N = 12,957) finds the
    effect **stronger in YOUNGER children**, which points away from a
    secondary-school user.
  - Honest expectation for the feature as built: **d ≈ 0.2, possibly 0.15 after
    bias correction**, on an outcome the app cannot verify because it is
    self-reported. It stays because it is cheap, honest, and never touches
    evidence — not because it is strong.
- **Component moderators, and what they changed here.** The same paper measures
  the parts, and two of them were being got wrong:
  - **One plan at a time.** 1 plan d = .41, 2 plans .30, **3 plans d = .07**.
    The benefit is essentially gone by the third. `planCandidate` used to
    exclude only skills that already HAD a plan while the caller suppressed new
    ones only once a follow-up fell due — fourteen days later — so a learner
    could accumulate one open plan per session. Fixed, and pinned by a test.
  - **Cue should name a place as well as a moment** (time+place d = .46 vs time
    alone .25), and **must not ask how or how long** (elaborating that drops it
    to .24). Task junctures — starting, finishing, the moment of being asked —
    are the strongest cues at .49–.64.
  - **Rehearsing the plan once** raises it from .33 to .50 (k = 59).
- **Status: IMPLEMENTED 2026-08-07** — `engine/fieldPlan.ts`, prompted at the
  session exit. Once a Path skill reaches **Retained** (not merely Independent:
  asking someone to carry a technique into their week before it survives a
  delay is asking them to rehearse something they will not have when the moment
  comes), the exit asks for one if-then plan naming a real recurring cue.
  Roughly 14 days later, one session exit asks whether it came up — once, three
  options, never repeated. Paths only; academic skills are already checked.
- **Hard constraint, enforced by `engine/fieldPlan.test.ts`**: what the learner
  reports about their own life is SELF-REPORT, and self-report advances no rung
  anywhere in this app. Plans live in `AppState` and are **not an input to
  `deriveEvidence` at all** — the strongest available form of the guarantee,
  since the replay physically cannot see them. Tests assert that a plan
  reporting "I used it" changes no skill state, schedules no review, and cannot
  create evidence for a skill never practised.
- **No log screen, deliberately.** The learner said plainly they would not read
  one. Forming the plan is what carries the effect; re-reading adds little. A
  journal nobody opens is a feature that only looks good in a changelog, so it
  was not built.
- **Limitation**: the meta-analytic effect is on goal attainment in studies
  that set the goal and measure the behaviour. Nothing here measures whether
  the learner's own reported use is accurate — it is not, and cannot be,
  verified. It is a prompt, not a result.

## 21. Transfer distance is multi-dimensional — EVIDENCE (taxonomy), threshold HEURISTIC

- **Claim**: "near" and "far" transfer are not two boxes. Barnett & Ceci
  decompose transfer distance into **nine dimensions**, grouped as CONTENT
  (learned skill, performance change, memory demands) and CONTEXT (knowledge
  domain, physical context, temporal context, functional context, social
  context, modality). A transfer task sits at a position in that space, and the
  dimensions can be moved one at a time.
- **Source**: Barnett, S. M. & Ceci, S. J. (2002), *When and where do we apply
  what we learn? A taxonomy for far transfer*, Psychological Bulletin 128(4),
  612-637. DOI 10.1037/0033-2909.128.4.612 —
  https://pubmed.ncbi.nlm.nih.gov/12081085/ . Accessed 2026-08-07. The nine
  dimensions and their grouping were confirmed against two independent
  secondary reproductions; the primary PDF reachable from this machine was a
  scanned image and could not be text-extracted, so the dimension NAMES come
  from those reproductions rather than from quoted primary text.
- **Limitations**: the authors state the taxonomy is a simplified model and
  caution that it does not capture every relevant factor. They also conclude
  that **far transfer occurs unreliably** — a constraint on this product, not a
  licence for it.
- **Product behavior**: `transferred` no longer fires on a single dial. It
  requires an unaided first-attempt success in transfer mode crossing **at
  least two** observable dimensions. `SkillEvidence.transferCrossed` records
  which ones, and Progress and Path state them in plain language.

### What this app can and cannot observe

Four of the nine are visible to a single-device event log. Only these are claimed:

| Dimension (Barnett & Ceci) | How it is measured here |
| --- | --- |
| content / surface features | a question family never practiced on this skill |
| knowledge domain | the item's bucket differs from where the skill was first practiced |
| memory demands (≈ modality) | a different answer format from any practiced on this skill |
| temporal context | at least the 48h retention gap since the last success |

**Physical, functional and social context are not observable.** The app cannot
know where the learner is, what they are trying to accomplish, or who is
present. Nothing in the UI claims those, and this table is why.

- **Tier**: the taxonomy is EVIDENCE. The "at least two dimensions" threshold
  is a **HEURISTIC** — no study fixes that number. What is not a judgment call
  is the direction: moving one dial is near transfer.

### Measured consequence (2026-08-07)

Simulated 365 days at 30 min/day against the real content bank and planner:

- 2,641 attempts, of which **58 (2.2%) were served in transfer mode at all**;
- **2 of 47 practiced skills reached `transferred`** under the new rule;
- of the four dimensions, **knowledge domain never crossed once**. That is
  structural rather than a bug: "one primary bucket per activity" is an
  allocation law (founding brief §5), so a skill's items nearly all sit in its
  own bucket. In practice the rule is therefore "novel family + (format shift
  or delay)", and the domain dial is close to dead until content deliberately
  crosses buckets. Recorded so a future session does not mistake it for
  working.

## 22. Cued application is not transfer — EVIDENCE (methodological)

- **Claim**: an item that tells the learner which principle applies measures
  application, not transfer. Transfer has to be spontaneous.
- **Source**: Detterman, D. K. (1993), *The case for the prosecution: transfer
  as an epiphenomenon*, in Detterman & Sternberg (eds.), *Transfer on Trial:
  Intelligence, Cognition, and Instruction*, Ablex. Accessed 2026-08-07 via
  https://gwern.net/doc/iq/1993-detterman.pdf — that PDF is scanned images and
  could not be text-extracted here, so this entry rests on the chapter's
  argument as reported in secondary sources rather than on quoted primary
  text. Flagged deliberately: a weaker citation than the others in this file.
- **Limitations**: this is the strong-sceptic position and it is contested.
  Bransford & Schwartz (§23) argue the opposite — that the standard measure is
  too strict, not too lax. The app follows Detterman for what it will CLAIM and
  Bransford for what it should try to teach.
- **Coverage correction, 2026-08-07 — an audit of our own content**: all 392
  non-authentic templates were rendered and their prompts checked. 88 carried
  `transfer: true`. **Four named the principle in the prompt** — the entire
  `bridge-*-spot` family, which opened "The pattern: **X**" and then asked the
  learner to find an instance, while flagged as transfer evidence. They could
  grant the app's top rung for exactly the thing this critique excludes, and
  the explanation under them asserted that "nothing in real life arrives tagged
  with which idea applies" while the prompt did the tagging. Four further
  templates were flagged by a crude word-overlap heuristic and manually
  confirmed as false positives (a paraphrase item necessarily shares words with
  its prompt).
- **Product behavior**: those four keep their content — cued application is
  useful practice, and it is the natural step between comparing two cases and
  recognising one cold — but they no longer carry `transfer: true`, and their
  explanation now says plainly that being told the pattern makes this
  application rather than transfer. `contentAudit.test.ts` now fails the build
  if any `transfer: true` template names the principle in its prompt.

## 23. Preparation for Future Learning — EVIDENCE (implemented 2026-08-07)

Bransford, J. D. & Schwartz, D. L. (1999), *Rethinking transfer: a simple
proposal with multiple implications*, Review of Research in Education 24,
61-100. https://journals.sagepub.com/doi/10.3102/0091732X024001061 . Accessed
2026-08-07. They argue that measuring transfer as **sequestered problem
solving** — no resources, no help, apply it cold — systematically
underestimates what prior learning bought, and propose measuring **readiness to
learn something new** instead. Every rung in this app is sequestered problem
solving, so the critique landed squarely on our evidence model.

**Shape as built** (`src/engine/pfl.ts`, `src/content/items/pflProbes.ts`):
a probe teaches a genuinely new idea in a short study phase, hides it, then
asks questions answerable only from that explanation. Three exist —
`pfl-modular` (clock arithmetic), `pfl-simpson` (Simpson's paradox),
`pfl-growth` (asymptotic growth). The readout compares pick-up rate **within
one learner** between probes whose prerequisites they owned and probes whose
prerequisites they did not, judged at the time of the probe, never against a
population.

**The three honesty rules, and how each is enforced:**

1. **A probe is never a rung.** Probes are written as EXPOSURE — `correct` and
   `firstCorrect` both null — which is the ungraded shape mastery already
   understands: no success, no miss, no review scheduled, no promotion. The
   outcome survives only in `score`, which nothing but the PFL report reads.
   Enforced in `SessionScreen.logEvent`, the single line every attempt passes
   through, rather than by trusting templates to behave.
2. **Within-learner comparison only.** No norms, no cohort, no percentile.
3. **It refuses to exist** below `MIN_PROBES` (4), and stays silent on the
   prerequisite split until both sides have samples.

**Coverage correction (2026-08-07, same day).** The first implementation wrote
probes as *guided* work — `hintLevel` forced to 1, but `firstCorrect` left
true. The ladder held, because `isFirstUnaidedSuccess` re-checks `hintLevel`.
Six other readers do not: the coach's per-bucket accuracy, the weekly accuracy
readout, and the session summary all treat `firstCorrect` as unaided success on
its own. Measured consequence: 24 perfect probes dragged 50% real accuracy to
83%, over the 80% threshold at which the coach declares a bucket "a strength" —
the app telling a learner they were strong at math on the strength of work
where it had handed them the explanation. The exposure shape fixes all of them
at once, because every one filters on `firstCorrect !== null`. Regression tests:
`engine/pfl.test.ts` ("probes are invisible to the derived readouts").

**Coverage correction 2 (2026-08-07, same day).** The first cut shipped THREE
probes against a threshold of four, so the only way to reach the readout was to
repeat one — and a repeat measures memory, not pick-up. The readout could not
honestly be reached at all. Fixed on both sides rather than by lowering the
threshold, which would have been the dishonest repair:

- `pflProbes` now counts a learner's FIRST encounter with each probe and
  discards everything after it, so repeats cannot inflate the figure.
- Six probes now exist: clock arithmetic, Simpson's paradox, the pigeonhole
  principle, regression to the mean, the handshake lemma, and Benford's law.
- `pfl-growth` was RETIRED. It taught asymptotic growth, which the tree already
  teaches in `complexity-count` and `complexity-choose` — so for any learner
  who had met those it measured recall. Found by grepping the rendered bank,
  not by reading the source, which is now the release gate (`pflProbes.test.ts`
  → "probes teach ideas the tree never teaches"): each probe declares terms
  distinctive to its idea, those terms must appear in its own resource, and
  they must appear nowhere in ordinary content.

**Cadence — HEURISTIC, measured not sourced.** One probe at most per 7 days,
always last in a session, never in a session under 15 minutes. There is no
evidence for a specific interval; the constants are set so probes never compete
with practice, and the short-session guard follows the same reasoning that fixed
ten-minute sessions (§ changelog 4.3) — a small budget must go to learning, not
instrumentation. Simulated over a year: the 7-day interval delivers all six
probes by day 40 and splits them 3 with prerequisites owned / 3 without, which
is the most balanced of the intervals tried (21 and 35 days both give 4/2,
because by then the learner owns most prerequisites). The readout first appears
around day 24.

**Known limits, stated plainly.**

- Six probes is enough to make the readout appear, not enough to characterise a
  learner. Pick-up rate is a within-app measure of how well a new idea lands in
  this app's format; it is not a validated PFL instrument, and the copy says so.
- Probes are a FINITE resource — each idea is only new once. After roughly six
  weeks a learner has met all of them and the readout stops updating. It is a
  snapshot of pick-up, NOT a measure of pick-up improving over time, which is
  what Bransford & Schwartz's argument would really want. Measuring change
  would need a steady supply of genuinely new ideas; the honest position is
  that this app measures the level, not the trend.
- A learner who only ever runs sessions under 15 minutes will never meet a
  probe in a session. They can still start one from Practice, and the readout
  refuses to exist rather than reporting from too few.

## 23b. What was deliberately NOT built, and why

- **Authored transfer-distance tags.** Rejected. Letting content declare its
  own distance repeats the mistake §13 already corrected once, when an
  authoring flag decided the top rung. Distance is derived from the learner's
  own history instead.
- **A shared vocabulary between the difficulty scale and the evidence ladder.**
  Removed rather than added: difficulty tiers 2 and 3 were named "Guided" and
  "Independent", the same words the evidence ladder uses for rungs, so a 3-star
  problem answered with three hints displayed the word "Independent". Renamed
  to "Routine" and "Combining", with an audit gate keeping the two scales
  disjoint (`contentAudit.test.ts`).

## 24. Abstract rule training does transfer — EVIDENCE (strongest positive)

- **Claim**: brief training in *formal abstract rule systems* (the law of large
  numbers, cost-benefit reasoning, methodological reasoning about confounds)
  improves everyday reasoning **in domains that were never trained**.
- **Sources**:
  - Fong, G. T., Krantz, D. H. & Nisbett, R. E. (1986), *The effects of
    statistical training on thinking about everyday problems*, Cognitive
    Psychology 18(3), 253-292.
    https://www.sciencedirect.com/science/article/abs/pii/0010028586900010 —
    brief training in the formal properties of the law of large numbers raised
    both the frequency and the quality of statistical reasoning on everyday
    problems, and **improvement in untaught domains matched improvement in
    taught ones**. Accessed 2026-08-07.
  - Nisbett, R. E., Fong, G. T., Lehman, D. R. & Cheng, P. W. (1987),
    *Teaching reasoning*, Science 238, 625-631. DOI 10.1126/science.3672116 —
    even brief formal training in inferential rules enhances their use in
    reasoning about everyday events; earlier pessimism rested partly on
    misidentifying which rules people actually use.
- **Limitations**: short-horizon studies with verbal-protocol outcomes, not
  year-long behaviour change. Fong & Nisbett's later work on immediate versus
  delayed transfer found the advantage in **untrained** domains decayed across
  a two-week delay while trained-domain performance held. The finding therefore
  argues for spaced re-exposure of a rule across several domains, not for one
  lesson.
- **Product behavior**: this is the evidential basis for teaching rule systems
  explicitly — base rates, expected value, confound detection, inference to the
  best explanation, parsimony — rather than hoping domain practice generalises
  on its own, and for scheduling those rules for review like any other skill
  instead of teaching them once.
- **Tier**: EVIDENCE for the direction. No effect size is asserted to the
  learner anywhere in the app.

## 25. Curriculum ledger: math tracks and the 2026-08-08 content expansion

The math tracks (`src/content/tracks.ts`) map real courses onto the skill
tree so "raise my grades" can mean something concrete. Course contents are
FACTS about curricula, sourced below; how the app uses them is design, and
the design constants are HEURISTICS labeled as such.

**Sources for course contents (all fetched 2026-08-08):**

- CCSS-M grade 6 and grade 7 standards, read verbatim (Oregon DOE's official
  copies of the identical text; corestandards.org 403s automated fetches):
  https://www.oregon.gov/ode/educator-resources/standards/mathematics/Documents/ccssm6.pdf
  and …/ccssm7.pdf. California's adopted standards are the CCSS-M
  (per https://www.cde.ca.gov/ci/ma/cf/ ).
- CCSS Appendix A "Accelerated 7th Grade" — the compacted-pathway model the
  CA State Board circulated — defines Math 7+ as ALL of grade 7 plus
  8.NS.1-2, 8.EE.1-7, 8.G.1-5, and 8.G.9, explicitly RETAINING systems
  (8.EE.8), functions (8.F), the Pythagorean cluster (8.G.6-8), and
  bivariate statistics (8.SP) for the accelerated 8th-grade Algebra year:
  https://www.cde.ca.gov/be/cc/cd/documents/may2012item12catt2.pdf
- District verification: Cambrian SD follows Appendix A verbatim; Cupertino
  Union's Math 7+ pulls down MORE (essentially all of grade 8, via CPM
  CC2+CC3); Irvine runs an integrated compaction; SRVUSD historically
  accelerates by whole-course skip instead. The track model follows Appendix
  A — the state's own definition — and places the district-variable topics at
  the START of the next track, so no district's student finds them missing.
- Algebra readiness: MDTP Algebra 1/IM1 readiness test strands (integers,
  fractions, decimals/percents/absolute value, exponents & roots, scientific
  notation, linear equations & inequalities, function representations,
  geometry/measurement, data): https://mdtp.ucsd.edu/assessments/readiness-tests.html
- Algebra 1 course map: Khan Academy Algebra 1 (14 mastery units, read from
  the live course page), AoPS Introduction to Algebra (official ToC PDF,
  22 chapters), CPM Core Connections Algebra 2013 (chapter lists via
  Mathleaks + teacher course sites). The new content families target the
  consensus core present in all three.
- Global-typical comparison (England KS3 statutory programme, gov.uk):
  systems abroad commonly front-load negative-number arithmetic, formal
  equation solving, nth-term sequences, and inverse proportion about a year
  before the CCSS placement. Covered in the app by CONTENT DEPTH (sequences,
  series, non-routine families) rather than by changing the CA course maps.
- "Tapis Algebra 1": could not be identified as a real textbook after
  multiple searches (nearest hits are Montessori counting mats — "tapis" is
  French for mat). Not used as a source; flagged to the user.

**Design rules (HEURISTIC, tested in `engine/tracks.test.ts`):**

- A track is a TILT, never a filter: `TRACK_BONUS` 1.2 + `TRACK_UNIT_BONUS`
  0.5 for the earliest unfinished unit, both below a due review's weight (3),
  both stating themselves in the selection's why. Non-course content keeps
  rotating; allocation sliders and floors still rule.
- `TRACK_PREREQ_BONUS` 0.8 for unmet prerequisites of course skills — added
  after measurement, not before: a simulated fresh learner on the
  algebra-readiness track owned 2 of 18 course skills after a year because
  the tilt pointed only at locked doors.
- The coach's course readout counts ONLY independent-or-better — "we did
  that unit in class" is guided exposure, not ownership — and renders from
  day one because it claims course coverage, not learner traits.
- gradeBand correction: m-variability 8 → 6 (IQR/MAD is verbatim 6.SP.5).

**Content added (all original, computed answers, audit-gated):** 4 new
skills (scale drawings 7.G.1, sampling & inference 7.SP.1-2, forms of linear
equations, two-variable inequalities); ~70 new template families across
gradeCore/algebraOne/middleDepth/nonRoutine/beyondCore/labsDepth, targeting
the researched kinds with the DOCUMENTED mal-rules as distractors
(transposition slips, flip omission, additive proportional strategy,
equiprobability bias — the [lit]-tagged patterns; untagged distractors are
teacher-practice heuristics). Non-math got 16 families (two per Path/lab
plus science/physics/coding); the ceiling moved up via quadratics-by-method,
radicals, rational exponents, series, combinatorics, and logarithms.

**Probes:** three added (Little's law, Condorcet cycles, the serial-number
maximum estimate) → nine total, ~a school quarter of weekly runway. One
COLLISION caught by the untaught-idea gate during this very expansion: the
new `count-combinations` family teaches n(n−1)/2, which the network probe's
handshake question relied on — the probe yielded (rebuilt on the degree-sum
idea alone), demonstrating the intended direction: when the tree grows into
probe territory, the probe moves, never the tree.

### §25 addendum (2026-08-08): all-stage tracks + the platform survey

**Tracks extended beyond middle school** — hs-geo (Geometry), hs-alg2
(Algebra 2/Precalc), college-quant (college & beyond refresh) — reframed
everywhere as "your CURRENT course" with an explicit "None right now",
because the app serves any learner middle school onward, including out of
school. gradeLevel gained 12th and "Not in school" (null; every consumer
already defaulted safely). A quiet quarterly course check-in card appears on
Today after ~90 days of silence (`trackConfirmedAt`) — one dismissible card,
confirming is one tap, no urgency theater; cadence is a HEURISTIC.

**Platform survey** (agent-run, 2026-08-08; full report in the session log)
of Brilliant, Alcumus, Beast Academy, IXL, DeltaMath, Desmos/Amplify,
Schoolhouse.world, OpenStax, Paul's Online Math Notes, MIT OCW, Math
Academy, Khan get-ready tracks, plus ALEKS/Mathspace/Open Middle/NRICH/
Underground Mathematics/EdReady. Mining shortlist for future content
sessions — kinds and structures only, never text:

- HS Geometry/A2/Precalc: DeltaMath's parameterized-type census (nearest
  architectural neighbor: type + seed + computed answer), IXL's per-course
  skill lists as coverage checklists, Open Middle's constraint problems
  (brute-force verifiable — same muscle as the chess miner), Desmos
  mechanics (equation-meets-constraints, discrimination, card sorts),
  Alcumus for non-routine kinds + per-item difficulty ratings.
- College/adult: OpenStax (CC BY 4.0 — the only adaptable license; its
  Elementary→College Algebra sequence is the skeleton of what adults are
  assumed to have lost), Paul's Notes (prerequisite-resurfacing kinds + a
  misconception catalog for distractors), Math Academy's structure
  (diagnostic course-compression, implicit-review multistep tasks), Khan
  "Get ready for X" packaging as the returning-learner on-ramp, MIT OCW
  Scholar chained psets (matches `aggregateParts`).
- Licensing hygiene recorded: OpenStax CC BY; OCW/Open Middle/NRICH are
  NC/SA (structure only); Brilliant/IXL/DeltaMath/Math Academy/Mathspace/
  ALEKS/Beast proprietary (public taxonomies only); Paul's Notes forbids
  incorporation — kinds and error categories only. The app's standing rule
  (original problems, computed answers) keeps every source safely usable.

## 26. The 2026-08-09 build: constraint problems, on-ramps, mal-rules, counterexamples

**Goal-tilt correction (measured, then fixed).** Goal deltas were applied one
bucket at a time via `rebalanceAllocationPercentage`, and each call pulled back
from the buckets already raised — so the first delta in the list silently
funded the last. Measured: a request for math +9.6 / meta +2.4 landed at +8 /
+2, and two goals pointing opposite ways cancelled to roughly baseline. New
`applyAllocationDeltas` raises every boosted bucket in ONE pass and takes the
cost from the untouched ones by surplus share. After: math +10 / meta +2, and
opposing goals now both register (math +5 plus each Path +1). Order of
application is now provably irrelevant (`goals.test.ts`). The user-facing note
was also corrected: with several goals it now says the budget is SHARED, since
"your goals tilt ~12 points" was a promise the mechanism does not keep when
ten goals net about two points of movement.

**Constraint problems — EVIDENCE for the format, HEURISTIC for the selection.**
Modeled on the Open Middle problem style surveyed in §25 (closed beginning,
closed end, open middle). Answers are OPTIMA found by exhaustive search in
`engine/constraintPuzzle.ts`, never authored, and re-derived by the audit from
the digit pool printed in each prompt — the same discipline that replaced
authored chess "best moves" with search-verified ones. The solver itself is
validated against hand-checkable cases (max sum 183, balanced product 96×87 =
8352 beating the greedy 98×76 = 7448) so it cannot silently relocate the
"optimum nobody checked" problem into the engine.

**Get-ready mini-courses — DERIVED, not authored.** Inspired by Khan's "Get
ready for X" packaging (§25). `engine/getReady.ts` walks the prerequisite
closure of a target track and keeps what the learner does not own, foundations
first. Two honesty rules, both tested: ownership means independent-or-better
(guided exposure is not readiness — a mini-course built on hinted evidence
would send someone into a course they cannot hold), and a ready learner is
told they are ready rather than handed busywork.

**Mal-rule profile — HEURISTIC repairs, evidence-gated naming.** Sorting errors
by CAUSE rather than topic is the highest-leverage study move available (it is
why `x-focus` exists); the coach now does it from tagged misses. Refuses below
8 tagged errors, requires a pattern to recur 3+ times AND hold ≥20% share
before naming it, counts untagged misses separately rather than assigning them
to the nearest cause, and pairs each named cause with a specific repair — never
"practise more", which only fixes execution gaps. The repairs are HEURISTIC
study advice consistent with error-analysis practice, not measured effects.

**Counterexample items — the asymmetry of universal claims.** One case kills a
"for all" claim; no number of supporting cases establishes one. Every claim in
the bank carries a machine-checkable predicate, and the gate proves the stated
counterexample really fails the claim while every distractor really satisfies
it. Two claims (shared-cause reasoning, sampling bias) are refuted by argument
rather than arithmetic; the gate checks they are marked deliberately rather
than passing by omission.

**Phone-to-phone handoff — QR REJECTED on measurement.** A year of daily
practice exports to ~1.75 MB; a maximum-density QR code holds 2,953 bytes,
i.e. **607 codes**. An animated QR chain would be worse than a file for every
learner who has actually used the app. Built instead on the Web Share API,
which hands the export file to the OS share sheet — Nearby Share, AirDrop, or
any app the learner picks. Still zero servers: this app uploads nothing, and
the destination is the user's choice. Falls back to plain export where the
browser does not support file sharing.

## 27. The 2026-08-09 hunt: three silent failures found by measurement

None of these looked wrong in the code, in the UI, or in any passing test.

**1. A whole bucket starved behind another bucket's prerequisite.** Every
physics skill sits behind a math gateway (`p-measure` needs `m-units`, four
links deep in the math chain), and the rotation block only serves LAB buckets —
so the core block is physics' only route. That loop `break`-ed as soon as math
had been considered, so buckets after math in the debt order were never scored.
Measured over 365 simulated days: **physics served 1.2-2.4% against an 8%
target, with `m-units` still `unseen`.** It was never blocked; it was eligible
the whole time, scored 2.0, and lost the tie-break to twenty other math skills
every session for a year. Fixed with three coupled pieces:

- `GATEWAY_BONUS` (1.6 × debt) for a skill whose non-ownership blocks a bucket
  that is behind target — the allocation nudge could never fix this itself,
  because it boosts skills IN the starved bucket and there were none eligible.
- Removing the `break`, so every academic bucket is scored.
- `STARVED_BOOST` (3.4) when a non-math academic bucket is below half its
  target, versus `MATH_CORE_MARGIN` (2) for math's incumbency. **These two are
  coupled**: set at 1.8 against a margin of 2, starvation could never overcome
  incumbency and physics fell straight back to −8 while every test passed.
  `starvation.test.ts` pins both the outcome and the ordering.

Result: worst academic gap −8 → −3, math over-service +19 → +4, and every
simulated learner's independent-skill count rose.

**2. A uniform penalty that reordered nothing and handicapped everything.** The
`alreadyCapable` −2 exists to push the frontier past placement-cleared
material. When a diagnostic marks EVERY skill in a bucket strong, it lands on
every candidate equally — the within-bucket ranking is unchanged, but the
bucket's best score falls (measured: math −0.50 against untouched physics 3.20)
and the bucket loses the core block entirely. It was invisible only because the
`break` above happened to pick math before anything else was scored; fixing one
bug exposed the other. The penalty is now cancelled when it applies to every
candidate, which preserves the reordering and drops the accidental handicap.

**3. Length as an answer key — and a correction to the first measurement.**
Counting ANY length lead put "pick the longest option" at 38.2% against a 25.3%
chance baseline, which looked alarming. That metric was wrong: it counts being
longest by three characters, which no learner can see or use. At a 25% margin
the shortcut scores 25.0% — chance exactly. The genuine excess is ~5 points at
a 15% margin. The audit now gates the app-wide rate at a visible margin
(`CUE_MARGIN` 0.15, cap 0.32), and the worst offenders were rebalanced by
writing distractors as specific as the key rather than by padding.

**Also fixed:** "Send to another device" appeared whenever the Web Share API
merely existed, then always failed — Chrome enforces an allow-list of shareable
MIME types and `application/json` is not on it. The type is now probed with a
dummy payload at render time (probing with the real ~1.75 MB export would be
its own performance bug), `text/plain` is the fallback, and the import accepts
both extensions.

**Stress results (clean):** hostile input — null/array/nested-junk state,
negative and 1e12 numbers, 100k-character strings, unknown track ids, malformed
JSON — all sanitized or rejected, none crash. Scale: 20,000 events derive in
12 ms, coach beliefs in 10 ms, an 11.3 MB export round-trips intact. UI: no
horizontal overflow, no sub-40px tap targets, and no clipped elements on any of
the five tabs at 375 px, including the relaxed-spacing + reminders combination
that broke layout once before.

## 28. Daily question coverage: varied after acquisition, blocked at first — EVIDENCE; exact rotation HEURISTIC

- **Claim**: once learners have enough familiarity to identify a method,
  interleaving different problem types improves delayed performance and trains
  method selection. It can feel worse during practice even when the later test
  is better. Initial induction is a boundary condition: blocking closely
  related examples can help while a category is first being formed.
- **Sources (re-accessed 2026-08-08)**:
  - Taylor & Rohrer (2010), *The Effects of Interleaved Practice*, Applied
    Cognitive Psychology 24. DOI: 10.1002/acp.1598.
    https://onlinelibrary.wiley.com/doi/10.1002/acp.1598
  - Rohrer, Dedrick & Burgess (2014), *The benefit of interleaved mathematics
    practice is not limited to superficially similar kinds of problems*.
    Grade-7 classroom experiment; delayed test 72% interleaved vs 38% blocked.
    https://pubmed.ncbi.nlm.nih.gov/24578089/
  - Sana & Yan (2022), *Interleaving Retrieval Practice Promotes Science
    Learning*. High-school classroom quizzes; delayed performance was higher
    after interleaved than blocked retrieval. DOI: 10.1177/09567976211057507.
    https://pubmed.ncbi.nlm.nih.gov/35436145/
  - Sorensen & Woltz (2016), *Blocking as a friend of induction in verbal
    category learning*. Initial blocked exposure outperformed interleaving for
    these verbal categories, which is why the app does not mix a brand-new core
    skill immediately. https://pubmed.ncbi.nlm.nih.gov/27115608/
- **Product behavior**: every template has an explicit Today route. Ordinary
  question families compete only when they are near the learner's current
  difficulty; unseen comparable families get a bounded coverage nudge,
  recently repeated families step back, and old families gradually return.
  Authentic projects keep whole application days, and preparation-for-future-
  learning probes remain one-time and at most weekly. The core stays blocked
  for first acquisition and interleaves only after ownership begins.
- **What is heuristic**: the 3-day recent window, the size of the coverage
  nudge, the 14-day stale-return slope, application every fourth established
  session, and the weekly probe interval. No paper establishes those numbers.
  Tests therefore pin the intended ordering and reachability, not a claim that
  the constants are optimal.

## 29. California mathematics course floor — AUTHORITATIVE STANDARD; mapping and difficulty gates are implementation safeguards

**Question researched.** Do the learner-facing math courses include every major
topic cluster California requires at the right stage, with “more is okay, less
is not” as the product rule?

**Primary sources (accessed 2026-08-08):**

- California Department of Education, *California Common Core State Standards:
  Mathematics* (adopted 2010, modified January 2013). This is the controlling
  content specification. Grade overviews and the traditional Algebra I,
  Geometry, and Algebra II model-course overviews were used; California-added
  standards marked “CA” were retained.
  https://www.cde.ca.gov/be/st/ss/documents/ccssmathstandardaug2013.pdf
- California Department of Education, *2023 Mathematics Framework for
  California Public Schools*, SBE-adopted July 12, 2023. The framework is
  implementation guidance, not a replacement standards list.
  https://www.cde.ca.gov/ci/ma/cf/index.asp
- Framework Chapter 7, grades six through eight. Used to cross-check the
  current big-idea organization and the intended connections among content
  clusters.
  https://www.cde.ca.gov/ci/ma/cf/documents/mathframeworkch7.pdf
- Framework Chapter 8, high school. Used for the traditional/integrated
  pathway context, the Grade 6–7–8 foundation, and the readiness boundary on
  middle-school acceleration.
  https://www.cde.ca.gov/ci/ma/cf/documents/mathframeworkch8.pdf
- CDE Mathematics Framework FAQ. Used to verify that California affirms both
  traditional and integrated pathways, that Math 8 is a rigorous foundation,
  and that Algebra I in eighth grade is an option for ready students rather
  than the default destination for everyone.
  https://www.cde.ca.gov/ci/ma/cf/mathfwfaqs.asp

**Measured before changing.** The selector had seven tracks but no standard
Math 8 and no ordinary high-school Algebra I. Its default Math 7 “next course”
was accelerated Math 7+, so the normal California 6→7→8 foundation was not
representable. The Algebra II/Precalculus label named logarithms, but the
skill map lacked explicit complex numbers, rational functions, radical/rational
equations, polynomial division and zeros, unit-circle trigonometry, conics, and
study-design inference. Geometry lacked explicit congruence/construction,
circle-theorem, coordinate-proof, solid/cross-section, conditional-probability,
and general-triangle clusters. Grade 6 also routed signed-number operations too
early because one broad “integer operations” skill mixed Grade 6 number-line
concepts with Grade 7 arithmetic.

**Product behavior.** The standard route is now Math 6 → Math 7 → Math 8 →
Algebra I → Geometry → Algebra II. The readiness-dependent accelerated branch
remains Math 7+ → accelerated Algebra I → Geometry, and accelerated Algebra I
keeps the same Algebra I content floor regardless of the learner’s age. Twenty-
one explicit skills and 37 original generated question families close the
measured gaps. Existing signed-operation questions were not deleted; they were
remapped into the new Grade 7 rational-operations skill and remain in normal
adaptive practice. `californiaAlignment.ts` records every course cluster and
official code family. A release test now refuses to ship if a standards-labeled
course omits a mapped skill, lacks normal-flow content, has no accessible
on-ramp, or never reaches its declared course-level reasoning demand. Extra
topics and harder tasks are allowed by design.

**Limits / what this does not support.** This is a standards-aligned adaptive
practice map, not a claim that Axiom Lab is a complete state-adopted textbook or
instructional-materials program. A topic-to-skill mapping does not by itself
prove instructional quality or learner mastery; the content audit checks
correctness and reachability, while mastery still comes only from independent,
delayed evidence. California permits local course organization and both
traditional and integrated high-school pathways; the app currently presents
the traditional pathway because its learner-facing courses are Algebra I,
Geometry, and Algebra II. The exact 2/3/4-star cluster challenge floors are a
**HEURISTIC implementation gate**, not numbers prescribed by CDE. The
framework also does not support universal middle-school acceleration, so the
accelerated branch stays explicitly optional rather than replacing Math 8.

## 28. Reviewing the Codex merge (2026-08-09)

The California alignment work is sound and its standard codes check out against
the verbatim CCSS structure recorded in §25 (6.RP.A.1–3, 6.NS.C.5–8,
8.G.A.1–5/B.6–8/C.9, 7.SP.A–C). `californiaAlignment.test.ts` is a real gate,
not menu copy: a cluster may only be claimed when its skills are in the course,
have reachable question families, an on-ramp no harder than the access ceiling,
and at least one task at the course's challenge floor. The two audit gates it
rewrote both got STRICTER — variant inflation now reports every offender rather
than failing on the first, and transfer reachability now requires an actual
`transfer` task instead of merely counting families.

**A correction to my own reporting.** My "502 tests green" claims across this
session were inflated. A stale git worktree at `.claude/worktrees/` held 26
test files — a frozen snapshot from an earlier session — and vitest's default
glob was collecting them alongside the 34 real ones. About 194 of those "502"
tests were duplicates running against OLD source. The suite is 40 files / 319
tests, all live. Codex's `test: { include: ['src/**/*.test.{ts,tsx}'] }` is the
right fix; the lesson is that a green count means nothing if you never check
WHAT ran.

**Two real defects found while reviewing:**

1. *The incremental replay cache could answer from the wrong history.* The new
   append-only fast path in `deriveEvidence` verified only the LAST element of
   its cached prefix. Two histories of the same length can share a final event
   object and differ earlier, and the cache then reuses trackers built from the
   wrong past — a differential test (cached vs from-scratch across four
   interleaved call patterns) reported `recentMisses: 0` where a fresh replay
   said `1`. Latent rather than live, since every array the app builds is a
   prefix or an append of one canonical list, but this is the evidence engine.
   The guard now compares the whole prefix by reference: ~50k pointer checks
   cost microseconds against the milliseconds of replay it avoids.

2. *Physics starved again on the new tracks.* The course tilt (TRACK_BONUS 1.2
   + TRACK_UNIT_BONUS 0.5) stacks on math's core incumbency (2) for 3.7 against
   a starving bucket's 3.4, so physics fell back to **0% on ca-8** — §27's bug,
   resurrected by constants tuned before those tracks existed. Rather than
   out-bid it (whack-a-mole across four coupled constants), incumbency now
   stands down entirely while another academic bucket is starving.

   Fixing that exposed a THIRD failure the first fix had masked: physics has
   one skill reachable with no prerequisite (`p-estimate`), which quietly
   filled the bucket's MINUTES, cleared the debt, and let the gateway bonus
   fade while the other ten physics skills stayed locked forever. Minutes-
   starvation and BREADTH-starvation are different failures, and only the
   second explains a learner doing the same physics skill for a year. The
   gateway weight is now `max(minutes debt, locked share of the bucket)`.

   `starvation.test.ts` now runs the simulation for EVERY track, not just the
   no-track case the original covered — which is why the regression was caught.

## 29. The 2026-08-09 landscape review — what the literature changed here

A multi-source review of the "makes you smarter" market, the spaced-repetition
and mastery systems this app is structurally related to, the calibration and
debiasing literature, physics education research, and the motivation
literature. Ninety-two source-reading agents; every claim below was fetched
from a primary or authoritative secondary source and adversarially checked.
Several findings CORRECT entries already in this ledger, which is recorded
here rather than quietly patched — see §29e.

### 29a. Far transfer is zero, and that is now a much harder number — EVIDENCE

- **Second-order meta-analysis.** Across ten first-order meta-analyses,
  restricted to ACTIVE control groups and corrected for publication bias, the
  far-transfer effect of cognitive training is **g = 0.00** (range −0.03 to
  0.02, true between-meta-analyses variance = 0). Uncorrected and including
  passive controls it looks like g = 0.12. No modality beats any other:
  working-memory training g = 0.00–0.02, action video games −0.01, and music,
  chess and exergames all sit inside the same band. N-back's nominal effect
  against treated controls disappeared once a single problematic study was
  excluded. P-curve found the treated-control literature to have no
  evidential value.
- **Owen et al. (2010), Nature.** 11,430 completing participants, six weeks
  online: every trained task improved (d ≈ 0.73–1.63) while the four untrained
  benchmarks moved essentially not at all (as low as 0.01, 99% CI crossing
  zero). **No dose-response** — sessions completed correlated with benchmark
  change at Spearman rho <= 0.059. The active control group, who only looked
  up trivia answers online, improved on all four benchmarks by similar
  amounts. Even *near* transfer failed: the group trained on three
  abstract-reasoning tasks gained numerically LESS on the abstract-reasoning
  benchmark than the group that trained no reasoning tasks at all.
- **Two things this app takes from it.** (1) The trivia-control result means
  any internal "you improved" readout computed from repeated exposure to the
  same assessment is measuring test-retest, not learning. (2) The absent
  dose-response is a direct argument against minutes as a proxy for progress —
  which is why the north star is learning *per* minute rather than minutes.
- **Near transfer is real** and survives active-control adjustment; the
  second-order authors' explicit recommendation to the field is to build for
  near transfer instead. That is the position this app already takes, now with
  a stronger citation than §11 had.
- **FTC v. Lumos Labs (Jan 5 2016)**, N.D. Cal., Commission vote 4-0: a $50M
  judgment suspended to $2M on inability to pay. Three claim categories were
  charged as unfounded — real-world transfer to school, work and athletics;
  delay of age-related decline; reduction of impairment from named conditions
  — and separately, asserting that "scientific studies proved" them was itself
  charged as deceptive. The order binds the company **and two named founders**
  to hold "competent and reliable scientific evidence" BEFORE making such
  claims. This is the operative external standard for cognitive-training
  benefit claims in US advertising, and the app is written to clear it. These
  are allegations settled by stipulated order, not adjudicated findings.
- **ACTIVE 10-year follow-up.** Gains persisted only WITHIN the trained
  ability — reasoning ES = 0.23, speed of processing ES = 0.66 — and the
  memory arm showed no maintained memory effect at all. The much-cited
  everyday-functioning benefit is **self-reported** IADL only; the memory arm
  produced the largest self-reported benefit (ES = 0.48) while producing no
  measured memory gain, which breaks the mediation story and looks like
  response bias. No active control, self-selected volunteers, mean age 73.6 —
  nothing here licenses claims about adolescents. Booster sessions at 11 and
  35 months produced additional durable gains, which is real RCT evidence for
  very-long-interval re-practice of a trained skill.

### 29b. Calibration and debiasing — the strongest positive evidence this app has

- **Morewedge et al. (2015).** One ~60-minute interactive debiasing game
  reduced *commission* of six biases: d = 1.68 / 1.74 pre-post and
  **d = 1.11 / 1.16 at 8–12 weeks**. It generalised to facets of a bias the
  game never trained (d = 0.79 at posttest, 0.65 at follow-up).
- **The dissociation that matters for content design**: the passive
  instructional video taught bias RECOGNITION *better* than the game
  (knowledge d = 1.69 vs 1.05), while the game reduced actual COMMISSION more,
  immediately and at eight weeks. Knowing a bias and not committing it are
  different skills. An item asking "which bias is this?" trains the first; an
  item where the bias is the trap and the topic is something else trains the
  second. **Design consequence: the Paths should keep shifting weight from
  naming biases to falling for them.** Caveats: no untrained control group, so
  only game-vs-video is a clean contrast. Notably, gamification embellishments
  (a game score, narrative, hints) and training dose made no measurable
  difference to bias reduction.
- **Sellier, Scopelliti & Morewedge (2019).** Debiasing transferred to an
  unannounced, structurally unrelated business case 43–52 days later with no
  reminder and no disclosed connection: 58.8% versus 72.2% chose the
  confirming option (OR 0.549, 95% CI [0.33, 0.92], p = .022), and the effect
  did not decay across seven weeks. **Cite the corrigendum figure, 19%, not
  the printed 29%** (Psychological Science 2020, 31(6), 762). Quasi-experiment
  — condition determined by which voluntary sign-up slot students picked, one
  school — not an RCT.
- **Good Judgment / CHAMPS KNOW.** Under an hour of probabilistic-reasoning
  training improved Brier accuracy by roughly 6–12%, replicated in all four
  tournament years, with trained forecasters ahead at both the start and the
  end of each 9-month tournament. Two findings that should steer content: of
  the ten trained principles, **only "comparison classes / base rates" (the
  outside view) was significantly associated with better accuracy**, and two
  principles were associated with WORSE accuracy; and **depth per question
  beat volume** — average forecasts per question predicted accuracy and
  partially mediated the training effect, while total forecast count did not
  differ between conditions and prior-year experience produced no Brier
  improvement. The full model explained only 10–20% of variance.
- **Natural frequencies (meta-analysis, 35 articles, 226 estimates).** ~24%
  correct under natural frequencies versus ~4% under conditional
  probabilities — sixfold, but **76% still fail** even in the facilitating
  format, so the framing is a representation improvement and not sufficient
  instruction. The strongest moderators were representational: "short menu"
  formats that display the joint events, and visual aids, both of which helped
  under BOTH framings. The field also argues the outcome measure should
  include the intermediate steps rather than only the final posterior.
  Sedlmeier & Gigerenzer (2001) found that teaching learners to *perform the
  translation themselves* produced competence still intact at 15 weeks,
  whereas merely presenting a problem in natural-frequency format is a
  context-specific fix. (That last is a secondhand citation inside a review,
  with no effect size reported there.)
- **Hertwig & Grüne-Yanoff's reversibility criterion.** The test separating a
  built competence from a propped-up performance: remove the intervention and
  see whether performance persists. This app already has the apparatus —
  hinted work never earns independent evidence, and the ladder re-tests
  unaided later — so the criterion validates the existing evidence model
  rather than asking for a new feature. Their boost/nudge distinction is also
  the right frame for Human Insight: a boost targets a competence and is
  necessarily transparent, where a nudge may work behind the chooser's back.

### 29c. Formats and content design worth copying

- **TIPERs** (Hieggelke, Kanim, Maloney & O'Kuma): ten physics task formats
  engineered so an item cannot be answered by substituting into a formula —
  Ranking, Working Backwards, "What, if Anything, is Wrong", Conflicting
  Contentions, Changing Representation, Troubleshooting, Comparison, Bar
  Chart, Linked Multiple-Choice, Qualitative Reasoning. Tasks are short and
  mutually independent, which is exactly what an item-level scheduler needs.
  **Tier: HEURISTIC.** PhysPort's own rubric rates TIPERs at its lowest
  validation level — "based on research into" only, with no "demonstrated to
  improve" and no "studied using" entries, which does not reach even their
  Bronze tier. Adopted as a design vocabulary, not as a validated method.
  Implemented in `content/items/physicsReasoning.ts`; all scenarios, numbers
  and answers are original and computed. The TIPERs banks are commercial and
  were not consulted for content.
  - The anti-gaming rule taken with it: "What, if Anything, is Wrong" tasks
    are distinguished from Troubleshooting tasks precisely by admitting the
    answer **"nothing is wrong"**. A fault-finding bank where something is
    always wrong teaches "name an objection" rather than judgement.
    `p-whats-wrong` renders clean in three of its nine variants.
- **Force Concept Inventory.** Its distractors were **empirically derived from
  students' own open-ended responses**, expert-reviewed, refined through
  interviews, then piloted on 1000+ students. That is the gold standard our
  authored distractors approximate and must not claim to equal. The FCI is not
  redistributable (faculty-only download), so FCI-style measurement requires
  building our own items — which is the standing rule anyway. Even this
  instrument has documented differential item functioning, question-order
  effects, and false positives (students choosing the Newtonian option for
  non-Newtonian reasons).
- **Hake (1998).** 62 courses, 6,542 students: interactive engagement
  <g> = 0.48 against traditional lecture 0.23. Two caveats that block naive
  adoption: the sample is self-selected toward high-performing courses (Hake
  says so), and his definition of "interactive engagement" **requires
  immediate feedback through discussion with peers or instructors** — the
  social channel is part of the construct, and a solo offline app cannot claim
  it. No course reached <g> >= 0.7, and 15% of IE courses were
  indistinguishable from lecture.
  - Worth recording for a future honest progress measure: **normalized gain
    `<g> = (post − pre) / (100 − pre)` correlates +0.02 with prior knowledge**,
    against +0.55 for raw post-test score and −0.49 for raw gain. NOT adopted:
    it needs a fixed pre/post instrument, and the app deliberately avoids
    single-number scores. Kept here so the option is not forgotten.
- **Schwartz & Martin, Inventing to Prepare for Future Learning.** Ninth
  graders; the invention condition's advantage was **invisible on a
  conventional transfer test** and appeared only when a worked-example
  resource was embedded in the test itself — the design this app already
  implements as PFL probes (§23). Two things to keep: the invention activity
  had a **0% success rate** during the activity and still prepared later
  learning, so a graded-correctness metric misclassifies it as worthless
  (which is why probes are written as exposure); and the readiness produced
  was **topic-specific**, as the authors state. One-year delayed retention of
  the invention-prepared procedure was 56.7% against 0% for university
  students who had not had it.
- **Productive failure (Sinha & Kapur).** The strongest moderator by a wide
  margin is **instruction built on the learner's own attempted solutions**:
  g = 0.56 with that feature present versus 0.20 without. Cite the pooled
  **g = 0.36**, not the widely-quoted 0.87 — that figure is a p-curve estimate
  assuming no publication bias, not a corrected effect size (Egger's test was
  non-significant and trim-and-fill imputed zero studies).
- **Math Academy's Fractional Implicit Repetition.** Review credit propagates
  down an **"encompassing" graph** — succeeding on an advanced topic
  fractionally advances the simpler skills it implicitly exercises, while
  failures propagate the other way. Two reasons this app is NOT adopting it:
  the encompassing graph is explicitly **not** the prerequisite graph, and
  running the mechanism over a prerequisite DAG (which is what we have)
  produces systematically wrong credit; and there is no peer-reviewed evidence
  for it — its author says so plainly, and the citations offered establish only
  that learning rates vary between students and topics. Recorded as
  considered-and-declined rather than unnoticed.
- **FSRS**, for the record, since it is the obvious thing to be asked about.
  Its memory model is Difficulty / Stability / Retrievability with a power
  forgetting curve, and its interval is closed-form from a **desired retention
  dial**: `I(r,S) = 9S(1/r − 1)`. Two findings matter more than the formula.
  First, its "minimum recommended retention" objective is **study minutes
  divided by expected total recall** — which is this app's north star written
  as an objective function, and worth revisiting. Second, **there is no
  universal optimal retention number**: the FSRS documentation states none, and
  computes the optimum per learner by simulation. Any app quoting "0.9 is
  optimal" as evidence is wrong. Not adopted now: FSRS-6 has 21 trainable
  parameters, and while the defaults work cold, fitting them to one learner's
  log is a large-parameter fit on small data, and the published evaluations
  measure recall PREDICTION, not learning gain.
- **ALEKS knowledge spaces**: tractable at curriculum scale (Beginning Algebra
  = 88 problem types yielding ~60,000 feasible states out of 2^88 subsets).
  But the foundational paper's single efficacy claim is uncited, unquantified
  and untested — **marketing, not evidence**.
- **Duolingo half-life regression** is a population fit over 13 million traces,
  so a zero-server single-learner app cannot reproduce it; only its feature set
  (elapsed time, cumulative seen/correct, within-session counts) is adoptable,
  and its published evaluation measures recall prediction, not learning.

### 29d. Motivation — the anti-gamification stance now has a number

- **Deci, Koestner & Ryan, 128 experiments.** Expected tangible rewards
  contingent on engagement, completion or performance significantly reduce
  free-choice intrinsic motivation: engagement-contingent d = −0.40,
  completion-contingent d = −0.36, performance-contingent d = −0.28; pooled
  across all expected tangible rewards d = −0.36.
- **The single worst structure in the meta-analysis is the one gamified
  learning apps use most**: performance-contingent rewards where the learner
  receives LESS than the maximum available — **d = −0.80** (−0.88 after
  outlier removal), significantly worse than maximum-reward conditions
  (−0.15). That is the shape of a broken streak, a two-of-three-stars score, a
  progress bar deliberately left short.
- **Bounded**: the undermining applies to tasks the learner already finds
  interesting (d = −0.68) and not to boring ones (d = 0.18, ns); unexpected
  rewards do not undermine. **Durable**: in child studies, free-choice
  motivation measured more than a week after the reward ended showed
  d = −0.55, at least as large as the immediate effect.
- **Verbal/informational feedback ENHANCES** intrinsic motivation (free-choice
  d = 0.33) — but this is age-moderated and did **not** hold for children
  (d = 0.11, ns, 7 studies) against college students (d = 0.43, 14 studies).
  The app's readouts are informational rather than contingent, which is the
  right side of this literature; the age moderation is a reason not to claim
  the evidence readouts are motivating for a teenage learner. They are there
  because they are TRUE, not because they are motivating.
- **Inoculation durability is format-dependent in a direction that penalises
  gamification**: text interventions held about a month unboosted while
  **gamified and video interventions lost statistical significance within
  roughly two weeks**. Objective memory for the content mediated the effect
  and motivation did not — the authors formally rejected their motivation
  hypotheses. A memory-focused booster (restating the techniques) beat both
  re-inoculation and a threat/urgency booster at ~30 days, and the
  threat-focused booster with no technique content was ineffective. Retrieval
  practice alone worked as a booster.

### 29e. Corrections to entries already in this ledger

1. **§2 (spacing) is narrower than it reads, for mathematics specifically.**
   A well-powered experiment (N = 235, designed for 95% power at f² = 0.15,
   38–40 per cell) distributed eight practice tasks on a mathematical
   PROCEDURE across sessions 1 or 11 days apart and found **no retention
   benefit over massing** at either a 1-week or 5-week unannounced test, and
   **no lag effect** (RI × ISI interactions non-significant, p = .078 and
   .633). The authors propose a declarative/procedural boundary — spacing
   evidence comes overwhelmingly from facts and vocabulary — consistent with
   Donovan & Radosevich (1999) finding complex content benefits less, and they
   explicitly **decline to endorse distributed practice as a recommended
   mathematics strategy on current evidence**. Dunlosky et al. themselves
   quote the IES guide conceding that few studies examined complex structured
   material.
   - *What changes here*: the review ladder stays. The retrieval half of it
     (§1) is not in question, forgetting is real, and no evidence says spacing
     HURTS. What changes is the tier: for **mathematical procedures**, spacing
     is downgraded from EVIDENCE to **HEURISTIC** in this ledger. And the
     null is a failure to reject rather than proof of absence — no Bayes
     factor and no equivalence test were reported.
2. **§3 (interleaving) should quote the corrected figure.** Heterogeneity is
   very high (I² = 77.3%, tau² = .20; sample-level effects from −1.37 to
   +1.85, math alone I² = 76.9%) and trim-and-fill on the independent-effect
   subset indicates publication bias, adjusting the pooled effect down to
   **g = 0.29 [0.20, 0.38]** with 23 studies imputed as missing.
3. **§13's appeal to "the mastery-learning tradition (Bloom 1968)" is too
   strong.** Bloom's 2-sigma does not survive the broader literature: pooled
   tutoring is about **d = 0.79**, and Bloom's comparison is confounded by an
   unequal mastery criterion (90% for tutored students against 80% for the
   classroom mastery condition), so it does not isolate tutoring as the causal
   ingredient. Kulik et al. (1990) report d = 0.61 for less able and **0.4 for
   more able** learners. Mastery gains fade and are plausibly **test-specific
   — overfitting to the assessment** — which is a direct warning against
   reading a mastery ladder as evidence of transferable learning. This app's
   ladder already refuses that reading; the citation should stop implying a
   bigger effect than exists. The underlying evidence base is also
   methodologically weak (small, non-randomised, heterogeneous), so these
   pooled figures are unreliable point estimates rather than settled facts.
4. **§5's "diagnosis, not self-report" was true of the design and false of the
   implementation.** Measured over 120 simulated days with no manual tagging:
   **318 misses, 13 of them (4.1%) machine-taggable**, leaving 4 tagged
   against 68 untagged in the trailing 28 days — permanently below
   `malRuleProfile`'s floor of 8. The feature could only be reached by the
   learner tapping a cause chip, which is exactly the self-assessment the
   entry says the app refuses. Fixed; see §30.
5. **Immediate feedback has no measured advantage over days-delayed
   feedback.** ManyClasses 1: 38 authentic college classes, 2,081 students
   across 15 campuses — **d = 0.002, 95% HDI [−0.05, 0.05]**, tight enough to
   rule out even small effects in either direction, with all 40 preregistered
   moderators overlapping zero and the only directional hint favouring
   DELAYED feedback. Scope: days-scale delay on graded coursework, not
   within-item corrective feedback and not a no-feedback control. Nothing in
   the app claims immediacy is what makes its feedback work, and nothing
   should start.

### 29f. An assessment rule adopted from the misinformation literature

The field's methodological standard for measuring misinformation skill is to
expose people to a **mix of true and false items** and score discernment
across both, because scoring only the rejection of false content confounds
genuine skill with blanket scepticism. Directly applicable to Observer and
Human Insight: a set where every scenario contains a manipulation trains
"always accuse", which is the same failure mode the TIPERs "nothing is wrong"
rule addresses in physics. Recorded as a content law for those Paths. Current
status: partially honoured — several Insight families already include
legitimate-request options — but a full audit of the ratio across
Observer/Insight is open work, and this entry claims the rule, not compliance
with it.

## 30. Causes come from the work — closing the 4.1% gap

`engine/diagnose.ts`, `engine/diagnose.test.ts`.

**Problem, measured.** §29e.4 above. Only worked chains (6 of 548 template
families at the time), chess and logic grids could produce an error cause at
all, so the coach's mal-rule profile said "not enough yet to name a pattern"
forever unless the learner hand-classified their own mistakes.

**Three sources, in precedence order.** (1) the broken link of a worked chain;
(2) the cause authored on the distractor the learner actually picked, now
machine-readable through `mcqNoted`'s optional third element and
`RenderedItem.distractorTags`; (3) **how the repair went** — corrected unaided
on the next attempt reads as an execution slip, needing a hint or the full
solution reads as a concept gap.

**Source 3 is a HEURISTIC and the coach's copy says so.** What it is not is an
opinion: the input is what the learner did next, not what they believe went
wrong. That is the distinction §5 draws, and it is the same one the
productive-failure literature draws when it finds that instruction built on the
learner's own attempted solutions is the strongest moderator of the effect
(§29c: g = 0.56 present versus 0.20 absent).

**It refuses to fire on choice formats.** A second pick among four options
after being told the first was wrong succeeds by luck about a third of the
time, so a lucky retry would be recorded as "you had the method". Only
constructed answers — numeric, fraction, text, steps — feed the repair-path
fallback; multiple choice, multi-select, ordering and classification rely on
sources 1 and 2 and otherwise produce no tag at all. `malRuleProfile` counts
untagged misses separately and never reassigns them to the nearest cause.

**Measured after.** The same 120-day simulation, still with no self-tagging and
assuming the learner never picks a named distractor: **51.3% of misses now
carry a machine-derived cause** (was 4.1%), and the trailing 28-day window
holds 43 tagged against 29 untagged — the profile names real patterns instead
of refusing. Multi-part activities (case files, work studios, the method drill)
also stopped discarding their causes: `errorTag` was hard-coded `null` at the
aggregation step, so the earliest broken checkpoint's diagnosis is now carried.

**The manual chip picker still exists**, and that is deliberate rather than an
oversight: where the app derives a cause it arrives pre-selected, and the
learner can correct it. So the profile is not purely derived — it is derived by
default and overridable. What changed is the direction of the burden. Before,
the feature was unreachable WITHOUT self-classification; now self-report is a
correction to an observation rather than the only source of one.

**Known limits.** The repair-path route can only ever distinguish "slip" from
"concept" — the two most actionable causes, and the two whose repairs differ
most, but coarse. Finer causes (misread, strategy, representation) still need
either a worked chain or an authored distractor tag. Of 39 templates carrying
named distractors, 3 currently carry machine-readable tags; extending the rest
is open work and each one narrows the untagged share.

## 31. The frontier stopped moving for the learners doing best

**Found by simulation, invisible everywhere else.** Two defects compounded:

1. `prereqLeverage` counted every unowned dependent of a skill whether or not
   that skill was what blocked them. An owned skill's dependents are already
   unlocked, so nothing waits on it — yet it kept the leverage bonus (capped at
   2.5, the largest term in the scorer after a due review) permanently. The
   root of the tree has the most dependents, so the root won every tie forever.
   The same reasoning was already written one screen below for the
   `alreadyCapable` case; it had simply never been applied to a skill the
   learner had EARNED. The learner-facing `why` was false too: "4 skills are
   waiting on it" was printed for a skill exactly 1 was waiting on.
2. Three skills carried fewer question families than their own promotion rule
   requires, counting only the families an ordinary daily block can serve —
   `m-data` and `s-graphs` had one, and `i-forecast` had two against the three
   the Paths require. They could never reach Independent, so they never left
   the `guided` frontier, so they kept the frontier bonus permanently too. The
   existing audit gate missed this because it counted ALL templates attached to
   a skill, including authentic work (application-day route only) and PFL
   probes (deliberately one-time) — a superset of what the planner can serve.

**Measured over 365 simulated days at ~90% first-try accuracy.**

| | before | after |
| --- | --- | --- |
| skills ever served | 58 / 122 | **120 / 122** |
| skills reaching Independent or better | 34 | **119** |
| distinct core-block focuses | 39 | **153** |
| most-repeated question family | 611 of 2,938 attempts (21%) | 111 (3.8%) |
| worst single core focus | 215 of 365 days | 57 |

A learner answering ~100% correctly previously spent **215 of 365 core blocks
on `m-integers`** — the first skill in the tree, long since Retained — and
their touched-skill count froze at 56 by day 60 and moved three skills in the
following 300 days. Physics on the `ca-8` track recovered as a side effect:
`m-data` had been absorbing the math core block, so the gateway into physics
was never reached.

**Gates added.** `engine/frontier.test.ts` pins curriculum coverage, ownership
and anti-monopoly bounds over a simulated year at three accuracies, plus the
unit fact that an owned skill claims no leverage. `contentAudit.test.ts` gains
"every skill can reach Independent through ordinary daily practice", which
applies the planner's own pool filter rather than counting every attached
template.

**Content closing the gap** (all original, computed answers, audit-gated):
`m-data` gained bar-chart reading, line-graph reading and a display-choice
family — its blurb had promised "tables, bar charts, line graphs, and scatter
plots" while shipping one table family. `s-graphs` gained two families that
make chart defence arithmetical (recompute what a truncated axis hides;
recompute the whole series behind a cherry-picked window) rather than a
four-option judgement call. `i-forecast` gained Brier scoring, which the app
already computed for the Forecast Ledger but never taught. Physics — the
thinnest bucket, at a median of two families per skill with six of eleven
skills sitting exactly on the promotion floor — gained six TIPERs-format
families and now has a median of three and none on the floor.

## 32. The second hunt (2026-08-09): the dial, the dose, and the door

A sweep across eight learner profiles — three abilities, five session lengths,
two courses, and the first thirty days — plus a second harness in which the
learner's accuracy RESPONDS to difficulty. That second harness is the reason
this round found anything: every previous simulation used a fixed accuracy, so
the difficulty dial had no effect *by construction* and could not be tested at
all. Four defects, all invisible to 331 passing tests.

### 32a. The difficulty dial could not lower the difficulty

**Measured.** A learner whose accuracy responds to difficulty, simulated for a
year: at **14–19% first-try accuracy for twelve consecutive months**,
`stretchSignal` reported its maximum easing (`adjust = −1`) every single month,
and the mean difficulty actually served **rose** from 2.6★ to 2.9★. The core
block computed a target of **2.06★ and was handed 2.8★**.

**Two causes.**

1. `dailyTemplateScore` penalised easier-than-target at 2.6 per star and
   harder-than-target at only 1.4. That lean is deliberate and right for a
   learner in range — "repeatedly easy is pleasant and does not move the
   frontier" — and exactly wrong for one who is drowning. Combined with the
   +3.25 an unseen family earns in coverage debt, a two-star overshoot cost
   2.8 and novelty out-bid appropriateness. Fixed: while the global signal is
   asking for easier work the lean REVERSES (`MISMATCH_EASING`, 1.2 easy / 2.8
   hard) rather than merely softening, and the flag is threaded through the
   warm-up, core, rotation and exit picks. All four constants are HEURISTIC;
   what is not a judgment call is that a dial which cannot lower the work is
   not a dial.
2. **44 of 122 skills offered nothing easier than 3★** ("combine ideas without
   scaffolding, or choose the method yourself") and **14 started at 4★**. On
   those skills the first thing a learner ever met was an advanced problem, so
   there was nothing easier to serve however loudly the dial asked. This
   contradicts §4 directly: worked-example and expertise-reversal evidence is
   the reason the support ladder exists, and a skill whose easiest task is 3★
   has no novice rung.

**After.** Core target 2.15★ against 2.5★ served (was 2.06 against 2.8);
struggling accuracy 14–19% → 17–23%. Gated by `engine/easing.test.ts` and by a
new content audit, "every skill has an entry point a struggling learner can
reach".

**Still open, stated plainly.** Fourteen 1–2★ on-ramps were authored
(`content/items/onRamps.ts`); **30 skills still start at 3★** and the gate
holds the line at 3★ rather than 2★ because that is what the bank supports.
Only 32 of 574 families are 1★ (6%), so the dial's bottom end remains thin and
a struggling learner still sits near 20%. Lowering the gate is the direction of
travel.

### 32b. A ten-minute session was a fifteen-minute session

**Measured.** Against a 10-minute target the planner produced **15.1 minutes on
99% of days**; 20-minute sessions overran on 38%. Three independent arithmetic
faults:

- `coreBudget` on a short session did not subtract `labBudget` — while the
  comment beside `labBudget` explicitly claimed it did. A comment asserting an
  invariant the code does not hold is worse than no comment.
- The warm-up tested `warmMin >= warmBudget` BEFORE adding an item, so it could
  always overshoot by one whole item: a 3-minute budget reliably produced a
  5-minute block.
- The every-third-session "explain it back" retention check costs 4 minutes,
  but was chosen at the END, after the rest of the plan had been sized against
  a guessed exit budget of 2.

**Why it matters beyond tidiness.** The founding brief makes a deliberate
endpoint a hard constraint and rules out "just one more". Overrunning a
learner's stated dose by half lands hardest on the person who chose ten minutes
because ten minutes is what they had.

**After.** 10-minute target: **15.1 → 10.0 mean**. The exit is now decided
before anything spends the budget, and is skipped on short sessions rather than
claiming a 4-minute activity takes 2. Gated by "never plans more than the
chosen length plus the grace window", across five lengths and six consecutive
sessions.

**Side effect, measured:** Meta Lab ran at **14.3% against its 5% target** on
short sessions and `x-explain-back` alone was **8.2% of a short-session
learner's entire year**. Both were the oversized exit. Now 5.5% and 2.2%.

### 32c. Review debt grew without bound at every ability

**Measured.** Due reviews climbed monotonically across a simulated year for
EVERY ability level — 26 → 44 for the weakest, and **15 → 44 even for the
strongest**. Supply was constant (a fixed ~18% warm-up, about two retrievals a
session) while demand scaled with ownership: every skill that reaches Retained
adds its own recurring schedule.

This is the same arithmetic Math Academy uses to argue flat per-item SRS is
infeasible in a densely connected curriculum (§29c). Their answer — propagating
credit down an "encompassing" graph — is one this app declined, and for a
recorded reason: that graph is explicitly not the prerequisite graph, and there
is no peer-reviewed evidence for the mechanism.

**What was done instead.** The warm-up allowance now scales with review
pressure (18% → at most 30% of the session, item cap 3 → 5 when the queue is
long). Bounded on purpose: the brief is explicit that urgent work must never
permanently erase the rest of the plan, so this is a lean, not a takeover.
Measured: reviews served over a year **643 → 1,095**, and the debt curve
flattens instead of climbing (strongest learner ends at 36 with a flat trace
rather than 44 and rising).

**Honest limits.** Debt is stabilised, not cleared — a learner who owns 70
skills will always have a queue, and the steady state is still around 40.
Nothing here changes the interval ladder itself. A second cost is measured and
recorded rather than hidden: more reviews means the warm-up now serves the
HARDEST block of a struggling learner's session (3.1★), because reviews target
owned skills and family-level reviews deliberately re-serve the exact question
that lapsed regardless of its difficulty.

### 32d. Checked and found sound

The preparation-for-future-learning readout (§23) appeared dead in the first
sweep — nine probes served, zero reaching the report. That was an artifact of
the harness, which wrote probes with a null `score`; the player writes the
graded outcome there deliberately (`probeScore`), and with the harness
corrected the readout works: 9 probes, a pick-up rate, and both sides of the
prerequisite split populated. Recorded because a "dead feature" finding that
turns out to be a measurement error is worth the same honesty as one that does
not.

One real oddity in that area: `pflProbes` forced `prereqsOwned = false` for any
probe whose skill has no prerequisites, so `pfl-modular` (attached to
`m-integers`, which has none) was permanently counted on the "without
prerequisites" side. Vacuously it belongs on neither.

**FIXED** (verified 2026-08-10): `prereqsOwned` is `boolean | null`, the null
case is excluded from both sides of the split rather than swept onto one, and
`pfl.test.ts` covers it. This note said "Open work" for longer than the code
did — a stale ledger entry is the same class of defect as an overclaiming one,
so it is worth re-reading old open items before trusting them.

## 33. The third hunt (2026-08-09): the paths simulations do not reach

The first two hunts simulated a learner playing forward. That misses everything
a learner reaches by TAPPING something, everything that arrives from outside
the app, and the grader itself. This round covered those, plus the two items
§32 left open.

### 33a. Items §32 left open, now closed

- **Thirty skills still had no daily task easier than 3★.** `onRampsB.ts` adds a
  1–2★ entry for every one; the audit ceiling drops from 3★ to **2★**. Every
  skill in the tree now has a way in. The 1★ share of the daily pool rose from
  6% to **11%** (62 of 581 families), and the number of skills whose easiest
  task is 3★ or harder is **0, from 44**.
- **`pflProbes` mis-assigned no-prerequisite probes.** `prereqsOwned` was
  `false` for a probe whose skill has no prerequisites, which put `pfl-modular`
  (`m-integers`) permanently on the "without prerequisites" side for every
  learner — one probe in nine, biasing the comparison it fed. It is `null` now
  and excluded from both sides; the overall pick-up rate still counts it.

### 33b. The grader could be fooled

Fuzzed every template with 50 junk inputs across five seeds. Option indexes
were parsed with `Number()`, which is far too generous for a value that selects
an answer: `"1e-999"` underflows to **0** and so picked option 0 on 180
templates, and a bare `","` split to `['', '']` → `[0, 0]` → deduped `[0]`,
which **scored** a multi-select whose answer was the first option.

Not reachable from the player, which sends indexes it generated itself. Fixed
anyway, for a specific reason: this is the **third** appearance of the
`Number('') === 0` family in `validate.ts` (a blank multiple choice grading as
option 0, then the same trap in `describeResponse`), and the grader is the last
thing standing between a learner and a false claim about what they know.
Indexes are now matched against plain digits rather than coerced, in both the
validator and the read-back. `engine/graderFuzz.test.ts` also pins that padding
never changes a verdict and that no input throws.

### 33c. Observer and Insight trained suspicion, not discernment

Of 55 families in those two buckets, **exactly one** ever had "nothing is
wrong" as the correct answer. Everywhere else the right answer was that
something WAS an inference or a pressure tactic — so a learner who answered
"suspicious" every single time would have scored close to full marks without
holding the skill.

This is the failure §29f records from the misinformation-assessment literature:
scoring only the rejection of bad content confounds genuine skill with blanket
scepticism, and the field standard is to mix true and false items and score
discernment across both. The physics bank already took the same medicine from
TIPERs, whose "What, if Anything, is Wrong" tasks are *defined* by admitting
that sometimes nothing is.

It matters more here than anywhere else in the app. A teenager taught to read
every direct request as manipulation has not been protected — they have been
handed a different problem, and one that costs them people who were being
straight with them. `content/items/discernment.ts` adds three roughly-half-
benign families: pressure versus an ordinary ask, observation versus inference,
and different versus contradictory. The benign cases deliberately share the
surface of the real thing — a genuine deadline, a genuine disappointment, a
genuine request for an answer today — so they cannot be passed on tone.

An audit rule now keeps at least two families per bucket able to answer
"nothing is wrong". The floor is low on purpose: much Observer work (scene
recall, choosing the best question) has no benign shape and should not be
forced into one. What it forbids is the state this was in — zero.

### 33d. Requested modes substituted silently

Challenge produced an EMPTY plan for a cold learner, a one-event learner and a
learner who had got everything wrong; Mixed review for two of those. The
session screen already fell back to the daily plan, so nothing crashed — but it
did so without a word, so tapping a card promising "non-routine, near your
ceiling" produced an ordinary session carrying the ordinary session's
rationale. Every substitution now names what was missing, which the
error-clinic branch had been doing alone.

### 33e. A keyboard route nobody could find

The spatial puzzle's keyboard alternative to dragging — arrows to move, R to
rotate, Enter to place — was fully implemented and mentioned nowhere except an
`aria-label` on the Rotate button. The founding brief asks for a keyboard
alternative to every drag; one that cannot be discovered does not satisfy it.
The tray hint now names the controls, and only while a piece is selected.

### 33f. Checked and found sound

Recorded because "we looked" is worth as much as "we fixed", and because
several of these were suspicions that did not survive contact with a
measurement:

- **Session recovery.** Sixteen shapes of corrupt draft (truncated JSON, wrong
  types, negative and out-of-range positions, unknown phase, a far-future
  clock, a half-megabyte scratchpad), plus a storage layer throwing on read and
  on write. Every one rejected safely; nothing threw; a finished session never
  resumed; and everything that DID load pointed at a real question in a plan
  whose templates still exist. Kept as `store/sessionRecovery.test.ts`.
- **Hostile imports.** Seventeen malformed payloads — including a
  prototype-pollution attempt — fed all the way through evidence replay,
  allocation, the coach and the planner. Allocations always normalise to 100
  with no negative share; no reader printed a broken value.
- **The `useStore outside provider` console error** seen throughout development
  is a Vite HMR artifact from live editing (a second module instance holding a
  different context object). A clean page load produces **zero** console
  errors. Confirmed by reproducing it on a stashed baseline and then by loading
  a fresh tab.
- **Layout.** No horizontal overflow and no sub-40px tap target on any of the
  five tabs at **320px**, nor on any of the new content — including the fenced
  ASCII bar chart, which renders monospaced with its own scroll container and
  stays legible in dark mode.
- **Keyboard and roles.** Chess squares and logic-grid cells are real buttons
  with `gridcell` roles and labels; code-split screens show an `aria-live`
  fallback rather than a blank flash.
- **The PFL readout** (§32d) works; the earlier "nine probes, zero reaching the
  report" was a harness artifact.

### 33g. What is still not fixed, stated plainly

- The bottom of the difficulty range is **thinner than the top**: 11% of the
  daily pool is 1★ against 32% at 4-5★. Every skill now has an entry point, but
  a learner well below grade level still runs out of gentle material faster
  than a strong one runs out of hard material.
- **Review debt stabilises around 40**, it does not clear. A learner who owns
  seventy skills will always have a queue; §32c bounded its growth rather than
  removing it.
- Of 39 templates carrying named distractors, **3 carry machine-readable cause
  tags** (§30). Each one added narrows the share of misses the coach can only
  diagnose from the repair path.
- **No claim is made that the bug list is empty.** Three hunts have each found
  real defects that the previous one missed, and the honest reading of that is
  that a fourth would too. What has changed is that each class found is now
  held by a gate: curriculum coverage, session length, difficulty easing, entry
  points, promotion reachability, grader robustness, practice modes, hostile
  input, session recovery, unsupported markup, and benign-answer coverage.

## 34. Closing §33g — and one thing that was never wired up

The three items §33g left open, each measured before and after.

### 34a. The named distractors never reached the coach

`mcqNoted` has produced a `distractorTags` map since §30 — the machine-readable
cause behind each named wrong answer, the most precise diagnosis the app can
make. **Thirty-nine call sites destructured `{ answer, distractorNotes }` and
dropped it on the floor.** The tags were computed on every render and thrown
away before they reached the item, so the feature had never once fired outside
the three templates written after it.

That is the more useful half of this entry. Authoring tags was the visible
work; the reason "3 of 39" looked like an authoring backlog was that the
plumbing was missing, and no amount of authoring would have changed the number.
Several case tables also mapped their own data through
`([t, n]) => [t, n]`, discarding the third element a second time.

Fixed at every site, and every named distractor now carries an **authored**
cause — never inferred from the note text, which would repeat the mistake §13
corrected when an authoring flag decided a rung.

**Measured:** templates delivering machine-readable causes **3 → 39 of 39**;
wrong multiple-choice options carrying a cause **1.0% → 10.9%** (106 of 976).

**Honest about the size of the win.** Overall machine-derived diagnosis did NOT
move much — 51.3% → 48.7% across a fresh 120-day simulation, within the noise
of a different random seed. A learner only benefits when their wrong pick lands
on a *named* option, which happened 19 times in 312 misses. What improved is
PRECISION, not coverage: those 19 now carry `misread`, `representation`,
`strategy` or `inference` instead of the repair path's coarse slip-or-concept.
The profile still names only `concept` and `slip` as recurring patterns,
because the finer causes each fall below `MIN_OCCURRENCES`. That is the refusal
working, not a defect.

### 34b. "Reviews due: 48" was a wall, not a number

The Today card printed the raw due count. §32c stabilised the queue at roughly
forty for a learner who owns a lot of skills — a standing figure no session
could ever clear, presented as work outstanding. That is the manufactured
urgency the founding brief rules out, produced by accident rather than design.

The count stays visible (hiding it would be its own dishonesty), but once the
queue is longer than a session can take, the card now says how many today will
actually pick up: *"today takes the 5 most urgent — the rest keep their own
dates."* The number comes from `reviewsPerSession`, extracted from the planner
so the screen cannot drift from what the planner really does.

### 34c. The bottom of the difficulty range

Thirty on-ramps (§33a) took the 1★ share of the daily pool from **6% to 11%**
and skills with no sub-3★ entry from **44 to 0**. The distribution is still
top-heavy — 11% at 1★ against 32% at 4-5★ — and that remains the honest
description: a learner well below grade level runs out of gentle material
faster than a strong learner runs out of hard material. It is no longer a hole,
which is what §32a called it; it is a slope.

### 34d. Standing position on "are there bugs left"

Four hunts, each finding what the previous missed. The rational expectation is
that a fifth would too, and nothing here should be read as a claim otherwise.
What can be said precisely is what is now *held*, rather than merely *checked
once* — each of these fails the build:

| Gate | What it holds |
| --- | --- |
| `frontier.test.ts` | curriculum coverage and no single-topic monopoly over a simulated year |
| `easing.test.ts` | the difficulty dial can actually lower difficulty |
| `sessionLength.test.ts` | a plan never exceeds the chosen length plus grace |
| `starvation.test.ts` | no academic bucket starves, on every course |
| `graderFuzz.test.ts` | the grader never throws, never accepts junk, ignores padding |
| `practiceModes.test.ts` | every mode, five learner shapes, usable-or-empty |
| `hostileInput.test.ts` | malformed imports and impossible clocks reach no reader |
| `sessionRecovery.test.ts` | sixteen corrupt drafts, hostile storage, no lost work |
| `contentAudit.test.ts` | computed answers, entry points, promotion reachability, unsupported markup, benign-answer coverage, variant honesty |

The measurement harnesses that found each defect were kept as those gates
rather than deleted, which is the only durable part of any of this.

## 35. The content law nobody was checking

Every content rule in this app has a release gate — computed answers, variant
honesty, transfer reachability, entry points, unsupported markup,
benign-answer coverage. The rules CLAUDE.md calls **law**, and the ones with
the highest stakes for a teenage user, were enforced by nobody:

- Observer and Human Insight teach influence DEFENCE, never operational
  manipulation.
- Danger-adjacent scenarios break the game frame and point to a trusted adult
  or an emergency resource.
- No IQ number, no microexpression lie-detection, no learning styles (§12).

`content/safetyBoundaries.test.ts` now holds all three.

**What it found: nothing — and that took two corrections to establish.** Both
earlier drafts of the detector reported the app's BEST safety content as
non-compliant:

1. The first looked for the phrase "trusted adult" and missed "teacher or
   parent", "responsible adult", "emergency help" and "school authority". It
   flagged `h-trusted-person`, whose correct answers name 988 and 911 and whose
   title is "This one is not a game".
2. The second matched the generic hint text listing risks ("when threats,
   self-harm or stalking appear…"), which appears on every variant of a family
   including the deliberately benign one, and so reported five compliant
   renders as bare.

Corrected: all **fourteen** danger-adjacent scenarios in the bank already carry
an escalation route, no render instructs a manipulation technique, and no
banned claim appears anywhere including the knowledge-base cards.

**Design of the matchers, since two got it wrong.** DANGER reads only the
SCENARIO the learner reasons about, never the coaching around it. POINTER
accepts any real-world escalation route rather than one house phrase.
INSTRUCTION matches the imperative VOICE, not the vocabulary — defensive
content has to name gaslighting and guilt-tripping to teach recognition, so a
keyword scan would flag exactly the content the rule protects.

**The gate verifies itself.** A matcher that has rotted into matching nothing
is indistinguishable from a clean bank, which is how this rule went unguarded
in the first place. One test pins every regex against known-bad AND known-good
strings ("Notice when someone tries to make you feel guilty" must pass; "Here
is how to make them feel guilty" must not), and another fails if the danger
matcher stops finding scenarios at all.

**Also checked this round and sound:** calendar handling. `engine/time.ts`
compares local calendar ordinals rather than raw timestamps, so a deadline does
not drift a day in western time zones or across DST. A semantically invalid
date (2026-02-30) passes the sanitizer's shape regex but fails `dateParts`'
round-trip check, yielding NaN — and every consumer filters on `>= 0`, which
NaN fails, so it is dropped rather than displayed. Both date inputs in the UI
are `<input type="date">`, so it is not reachable there anyway.

## 36. Two tabs, one learner

Saving is a blind whole-state overwrite from an in-memory snapshot — there is
no cross-tab coordination anywhere in the app: no `storage` listener, no lock,
no version check. So a second tab holding an older snapshot silently clobbers
the first tab's work on its next write. A learner with the installed PWA and a
browser tab, or simply an old tab left open on a laptop, is in this situation.

**Measured against a two-tab replay** (tab A completes a session and adds a
deadline and a forecast; tab B, holding the pre-session snapshot, then writes):

| | survives |
| --- | --- |
| attempt events | **yes** — all three |
| session records | no |
| deadlines | no |
| forecasts | no |

The events survive because of the append-only per-event journal, which is
unioned back into the snapshot by id on hydrate. That is precisely what it was
built for, and it means the catastrophic case — losing learning evidence — was
already prevented by design. Every rung the learner holds derives from events,
so mastery is untouched.

**Why this is not fixed by merging.** Union-on-write looks like the obvious
answer, and it is wrong: deadlines and problem reports can be DELETED, so a
blind union would resurrect them. Restoring a deadline the learner removed is a
worse failure than losing one they added, and silently either way.

**What was done instead.** `saveState` now writes a tiny per-tab beacon
(`axiomlab.writer`, carrying a module-scoped `TAB_ID`) on every save — a
separate key rather than the mirror, because the mirror is skipped above
`LS_MIRROR_MAX`, which is exactly the heavy user with the most to lose. A
`storage` listener raises `staleTab`, and the shell shows one honest line:
*"Open in another tab, which has newer work. Reload to catch up before saving
here."* Suppressed during a session, where a data warning mid-question would be
the most disruptive possible moment and the session draft is written separately
anyway.

The collision is named rather than resolved, which is the honest shape when
both resolutions lose something.

**Limits, stated.** This detects a second tab that has SAVED; it does not
prevent the overwrite, and a learner who ignores the banner still loses the
other tab's session records. Making that impossible needs either tombstones on
every deletable collection or a real lock, and both are larger changes to the
most safety-critical code in the app — where a botched fix loses more than the
bug does.

### 36a. Sample mode, checked end to end

The only feature that moves the learner's whole profile aside and puts a demo
in its place. While it runs, the IndexedDB stash is the ONLY copy of everything
they have ever done.

**One guard added.** `enterSample` did not check whether sample mode was
already on. Running it twice would stash the DEMO over the real profile —
permanent, total, unrecoverable. Settings only offers the button when
`sampleMode` is false so it was not reachable, but the cost of being wrong
about that is everything the learner has, and the function should not depend on
its callers. It now refuses.

**Verified in a real browser, not asserted.** Entering: the real profile
(3 events, real name) went to the stash while the demo (70 events, "Sample
Learner") took over, with the warning strip up. Exiting: the real profile came
back into both the live state AND the backup slot before the stash was cleared,
and the strip went away. `exitSample` was already ordered correctly — save,
checkpoint, then clear — and returns false rather than restoring nothing when
the stash cannot be read.

`store/sampleMode.test.ts` pins the double-entry guard and that a stashed
profile survives the sanitiser it is restored through, including sessions,
deadlines, forecasts and if-then plans. The IndexedDB half is not unit-tested:
there is no IDB in the test environment and this project does not carry a fake
for it, which is stated in the file rather than papered over.

### 36b. Performance after everything

Re-measured, because this round added ~90 question families and changed the
planner repeatedly. Nothing regressed:

| history | derive | plan | coach | allocation | due | mal-rules |
| --- | --- | --- | --- | --- | --- | --- |
| 500 | 2.4ms | 6.7ms | 3.7ms | 0.8ms | 0.3ms | 0.5ms |
| 5,000 | 4.7ms | 10.0ms | 4.7ms | 0.7ms | 0.0ms | 0.5ms |
| 20,000 | 12.4ms | 9.0ms | 7.0ms | 0.9ms | 0.1ms | 2.1ms |

Rendering all 607 families once takes 67ms, which happens only in the Practice
browser and the audit.

## 37. Learning from the competition (2026-08-09): what to take, what to refuse

§25's platform survey catalogued what these products TEACH. This one looks at
how the experience WORKS, which is where the transferable design is. Every one
of them is a paid or school-sold product, so the first job is separating
pedagogy from retention machinery.

### 37a. The machinery to keep refusing — now with three named examples

- **Brilliant** runs daily streaks, bonus points and unlockable content. Its own
  gamification case study names the mechanism: *fear of breaking a streak* as
  the motivator, and "dopamine loops similar to mobile games".
  https://trophy.so/blog/brilliant-gamification-case-study
- **IXL SmartScore** is 0-100 per skill, and above 90 it enters a "Challenge
  Zone" where a correct answer adds 1-2 points and a wrong one removes 3-8.
  One mistake erases four right answers. IXL documents this as intended
  design. https://www.ixl.com/materials/SmartScore_Guide.pdf
- **DeltaMath** requires N correct IN A ROW, and one wrong answer resets the
  streak to zero; teachers can configure it to reset the whole module.

All three are the same shape, and §29d already carries the number that
condemns it: Deci, Koestner & Ryan's 128-experiment meta-analysis finds
performance-contingent rewards where the learner receives LESS than the maximum
at **d = −0.80** on intrinsic motivation — the single worst structure in the
whole literature, and worse than no reward at all. A SmartScore falling from 96
to 90, or a streak resetting to zero, is precisely that structure.

Recorded so this is a decision with a citation behind it rather than a taste.
Reports from families of anxious and neurodivergent students describe exactly
the predicted effect, which is corroboration rather than evidence.

### 37b. Alcumus's ability model — TAKEN, and measured

AoPS Alcumus keeps a per-topic rating that is explicitly *"the probability that
she will correctly answer the average problem in the topic"*, computed from a
logistic comparison of a hidden student score against a hidden problem score —
the chess-rating family — and updated as outcomes arrive. It prefers problems
at the learner's level while mixing in some easier and some harder, and
down-weights problems already seen.
https://artofproblemsolving.com/blog/articles/alcumus-a-peek-under-the-hood-of-our-adaptive-learning-tool

**Why this app needed it.** `targetDifficulty` derived the next problem's
difficulty from the evidence RUNG through a five-value lookup (unseen 1.5,
guided 2, independent 3, retained 4, transferred 5). The rung answers *what has
this learner proved*; it was being asked *what can they currently do*, and
those are different questions. A learner can hold Retained on a skill and still
fail its 4-star items, and nothing in the ladder can see that.

**Built** in `mastery.ts`, derived by replay like everything else:
`P(correct at difficulty d) = 1 / (1 + e^(d − ability))`, updated per unaided
first attempt with a decaying step so early answers move it and later ones
refine it. Placement and hinted work are excluded, for the same reasons they
are excluded everywhere else. It reports `null` below four samples rather than
a number built from two answers, and the rung remains the fallback.

**Measured** over simulated years against learners of five true abilities,
second-half first-try accuracy and end-of-year coverage:

| true ability | accuracy before → after | skills touched | skills owned |
| --- | --- | --- | --- |
| 1.0 | 19% → 22% | 47 → 45 | 35 → 33 |
| 2.0 | 34% → **42%** | 57 → **64** | 49 → **53** |
| 3.0 | 46% → **55%** | 71 → 69 | 62 → 61 |
| 4.0 | 59% → **66%** | 76 → **84** | 71 → **80** |
| 5.0 | 77% → 77% | 94 → 92 | 93 → 90 |

Accuracy rises at every level, into the productive band rather than only at the
top, and coverage rises with it at the two mid-to-high levels instead of being
traded for it.

**The target rate was swept, not chosen.** At 0.7 the calibration gain came
with a real coverage cost (a mid learner reached 62 skills instead of 71). At
0.6 that cost disappears and most of the gain remains, so 0.6 ships. It also
sits toward the demanding end of the band `stretchSignal` already calls healthy
(0.5-0.82), which is the side this app leans on anyway. Still a HEURISTIC: no
study fixes it.

**A latent hole found while wiring it.** The first guard tested
`ev.ability !== null`, and a `SkillEvidence` built anywhere but `finalize` — an
older cached shape, a hand-made fixture, anything imported — carries
`undefined`, making `difficultyForRate` return NaN and silently lose every
difficulty comparison downstream. Five existing tests caught it immediately.
The guard now checks for a usable number rather than the absence of one
particular empty value, which is the same correction the calibration readouts
needed in §33.

### 37c. Taken already, or deliberately not

- **Brilliant: no video, manipulate before explanation.** The app is already
  retrieval-first everywhere. What it did NOT have is a manipulable
  visualisation, which is Brilliant's real distinctive. **Now built — see
  §37d.**
- **Beast Academy: three tiers per chapter** (foundation → practice → starred
  10-15 minute multi-step) and productive struggle taught as a NAMED skill.
  The tiers now exist as the 1-5 star scale with an entry point on every skill
  (§33a). Naming the struggle itself is not done.
- **Desmos: card sorts, marbleslides, Challenge Creator.** The card sort is our
  `classify` answer type; marbleslides ("make an equation satisfy a visual
  constraint") is the same muscle as the constraint puzzles from §26. Challenge
  Creator — the learner AUTHORS a problem — has no equivalent here and is the
  most interesting gap, with support from the invention literature (§29c,
  Schwartz & Martin).
- **Khan: mastery levels gated on ALL questions right**, not a percentage, and
  their own analysis that reaching proficient on fewer skills beats familiar on
  many. Our ladder is already stricter (two unaided first-attempt successes on
  distinct FAMILIES, three for the Paths).
- **Mathigon/Polypad: manipulatives and interactive narrative** — and, per
  review, *no spaced repetition or adaptive retesting at all; once a course
  ends nothing brings it back*. Worth recording as the thing this app has that
  the prettiest product in the category does not.

### 37d. The manipulable diagram — BUILT, and what it is not allowed to be

Three families ship (`content/items/explore.ts`): slope/intercept invariance on
`m-linfunc`, k versus k² on `m-scale`, and linear versus compounding on
`m-exponential`. Each is a slider over precomputed stops, followed by two
graded checkpoints.

**Evidence status: EXPOSURE ONLY, enforced.** Manipulation is a study phase and
carries no rung, exactly like a draft or a PFL probe. The spec has no field
that could express a correct position, and `engine/explore.test.ts` asserts the
absence by walking the whole object — an interactive that could be *scored*
would be a graded item wearing a diagram's clothes.

**Structure: Notice, then Predict.** The first checkpoint asks what stayed
fixed while everything moved; the second asks the same relationship at a value
the slider could not reach, with the picture gone. Only the second one
separates "I watched it move" from "I know what it does", and without it the
activity would be exposure billed as evidence.

**Evidence tier: EVIDENCE for the structure, HEURISTIC for this instance —
and the evidence says the questions are not optional.**

Alfieri, Brooks, Aldrich & Tenenbaum (2011), 164 studies across two
meta-analyses in *Journal of Educational Psychology* 103(1), 1–18:

| comparison | comparisons | d |
| --- | --- | --- |
| unassisted discovery vs explicit instruction | 580 | **−0.38** [−.44, −.31] |
| enhanced/assisted discovery vs other instruction | 360 | **+0.30** |

https://physics.uwyo.edu/~rudim/S14_JEduPsych_DoesDiscoveryLrngEnhance.pdf

Read the sign on the first row. **Letting a learner play with a slider and
work it out for themselves is worse than simply telling them** — not neutral,
worse, and by a decent margin. The effect only turns positive once the
discovery is *assisted*: scaffolded, with feedback, with the learner made to
commit to something.

This is the finding that shaped the build rather than decorating it. A
manipulable diagram on its own is the −0.38 condition. Notice-then-Predict,
each with a graded answer, an explanation and the corrective fork, is the
+0.30 condition. Had the diagram shipped as a pretty thing you drag before
moving on — which is the obvious way to copy Brilliant — it would have made
this app measurably worse at its one job.

**What is NOT claimed.** A frequently cited meta-analysis puts PhET simulations
at d = 0.83, but the comparator is "traditional approaches", which bundles
novelty, extra time on task and teacher enthusiasm into the estimate; it is not
evidence for a five-stop slider inside a spaced-retrieval app, and it is not
relied on here. No claim is made that these three diagrams transfer to
untaught graph reading. The transfer questions test that directly, per §8, and
until they report, the honest statement is that the structure is supported and
this instance of it is unmeasured.

**Deliberately refused.** A "3 of 6 seen" counter was built and removed: it read
as a completion meter, which converts noticing into a chore and is the exact
machinery §37a rejects. Continuing is never blocked either; the button names
what you are doing ("Skip the exploring") instead of preventing it.

**Nine release gates, and what they caught.** A diagram is the only content
whose FRAMES can be wrong while its ANSWER is right, so the ordinary answer
checks say nothing about it. The new gates in the content audit found three
real defects on first run:

1. A line steep enough to exit the plot at BOTH ends produced an empty
   polyline, because the clipper tested endpoint-insideness — and a segment
   crossing the whole visible band is outside at both ends. Replaced with a
   proper parametric (Liang–Barsky) clip returning each visible run separately,
   so a curve that leaves and re-enters can never be joined by a chord the
   function does not contain.
2. `explore-line` declared five variants and produced two, because the
   parameters were drawn with `rint` instead of an explicit table. The same
   correction `cycle` exists for (see its docstring).
3. At ×1.5 the caption claimed "it passes the steady line at step 4" while the
   two curves were under a pixel apart there. Arithmetically true, visually
   unreadable. The invitation now asks *whether* it catches up rather than
   *where* — which is also the question the item actually grades.

The strongest gate is the one that fires on nothing today: **all stops must
share identical axis bounds**. A grid that rescales with its drawing makes a
tripling rectangle look motionless, and it is the easiest possible thing to
introduce by accident.

**Measured, not assumed.** Axis tick labels rendered at 2.61:1 contrast against
the card in light mode — below the 4.5:1 AA floor for small text, on 9px digits
the learner must read to interpret the graph. Now 5.35:1 light and 6.82:1 dark.
Found by computing the ratio in a browser, not by looking at it.

### 37e. Four more, and what the second pass caught (2026-08-10)

Extended to seven families, choosing targets by *misconception* rather than by
topic — a draggable diagram earns its minutes only where a learner holds a
belief that reading does not shift:

| skill | control | belief it attacks |
| --- | --- | --- |
| `m-area` | pen shape, perimeter fixed | "same perimeter ⇒ same area" |
| `p-forces` | net force, including zero | "no force ⇒ it stops" |
| `m-stats` | one outlier's value | "mean and median are interchangeable" |
| `m-sampling` | tries per survey | "a small sample is a smaller big sample" |

The physics one exists for a single stop. At zero net force the line is flat
and sitting at 12 m/s, not at zero — putting a genuinely flat, genuinely
non-zero velocity on screen is the most direct attack available on the
best-documented misconception in mechanics.

**A new primitive, and the defect it brought.** Dot plots needed `dots` and
labelled `marks` on `PlotSpec`. The first render put a vertical axis beside
them reading 0, 0.5, 1, 1.5, 2 — the dots are staggered vertically only so
equal values stay countable, so that axis measured nothing while inviting a
learner to read a quantity off it. Now suppressed by `hideY`. Worth recording
as a general shape: a new mark type inherits the old chart's furniture, and the
furniture can lie even when the data does not.

**Caught in the second pass:**

1. **Negative speed.** The trolley's axis was labelled "speed" and the hardest
   brake drove the line to −10. Speed has no sign; the graph was teaching a
   vocabulary error in passing while teaching a physics idea on purpose. The
   numbers are now chosen so the hardest brake reaches exactly zero at the end
   of the window — which also gives a better picture, since coming to rest
   contrasts with the flat line instead of muddying it with reversal.
2. **A fixed perimeter makes w × h and h × w equal**, so a 1×11 pen and an
   11×1 pen produced identical captions and the slider looked broken. The
   caption now names the shape, which surfaces the symmetry as a bonus.
3. Means printed to three decimals (`31.429` minutes of homework).

**Three defects that only LOOKING found.** The browser pane finally rendered
(two tabs had drifted apart; screenshots follow the fronted tab, not the one
being driven), and the first screenshot of a finished dot plot showed three
things every measurement had passed:

1. **The chart under-reported its own data.** Caption "seven values", six dots
   visible — two learners with the same answer drawn at the same point. Equal
   values now stack. Note that every numeric check passed: seven dots existed,
   all in bounds, all finite. Overlap is invisible to a bounds check.
2. **A marker label reached across a neighbouring marker's line.** Centred
   labels straddle their own line, which is exactly wrong when two markers sit
   a few units apart — which is the normal state of this item at its first
   stop. Labels now sit beside their line, pointing inward.
3. **Dot plots kept the full height of an xy graph**, leaving an empty band
   above the data that reads as missing content.

Recorded because the lesson generalises past this widget: geometric assertions
catch data that is *wrong*, and cannot catch data that is *illegible*. The
audit gates are still worth more — they caught the empty polyline and the
duplicate captions before anything rendered — but a rendered screenshot is not
a redundant check, and this session shipped three fixes that only it produced.

**Sample data is illustrative, and says so.** The twelve surveys per sample
size are written down rather than drawn at render time, because a picture that
differs per device is one the audit cannot check. They are not decorative: the
ranges are 60, 34, 16 and 8 percentage points at n = 10, 30, 100, 500 — a 7.5×
narrowing where 1/√n predicts √50 ≈ 7.1. A learner who measured them would
find the relationship the item claims.

### 37f. Challenge Creator — BUILT, and what it refuses to claim

Desmos's Challenge Creator was recorded in §37c as the most interesting gap in
this app. Built now, in the only shape a serverless app can honestly support.

**The problem it had to solve.** Learner-authored content has no quality
control here — no server, no model, no reviewer. The answer is CONSTRAINED
authoring: the learner picks the numbers, and the shape computes its own
answer and recognises its own degenerate cases. That keeps the bank's oldest
law intact (`content/creators.ts` computes answers; nothing is hand-typed) and
lets `flaw()` say *why* a combination asks nothing.

**Evidence status: NONE, enforced by test.** `engine/authored.test.ts` proves
that adding, judging and deleting an authored problem append no `AttemptEvent`,
no coach decision and no session, and that creator ids cannot collide with
template ids. Nothing has audited a learner's own wording, so letting it move a
rung would break the rule the whole progress model rests on. The UI says this
plainly rather than staying quiet about it.

**Why it is still worth session minutes.** The graded-feeling moment is not
solving your own problem — you would know the answer. It is PREDICTING what
the thing you assembled will do, before it is computed, and every shape hides a
trap that survives being told:

| shape | the trap |
| --- | --- |
| price up then down | equal percentages feel like they cancel |
| two-leg journey | the average speed is not the average of the speeds |
| fee plus monthly rate | doubling the months does not double the bill |
| sharing in a ratio | the number of PEOPLE is not the number of PARTS |

Meeting "100 km at 100 km/h then 100 km at 20 km/h averages **33.3**, not 60"
in a journey you designed yourself is harder to wave away than meeting it in
one handed to you. That is the §29c invention argument, and it is the only
claim made here.

**A usability defect found by measuring, not by using.** The first ratio shape
treated "the shares come out as pennies" as a flaw and blocked it, refusing
**72% of the combinations a learner could reach** — a feature that says no
three times in four reads as broken, not as rigorous. Split into `flaw` (asks
nothing; blocks) and `note` (works, reads awkwardly; advises). Now 11% blocked,
61% advised, and a gate caps blocking at 25% so it cannot regress.

**On dev-server ghosts.** A `useStore outside provider` error had been chased
three times across sessions. Settled by serving the production build
(`.claude/launch.json` → `axiom-prod`, no HMR, its own empty database): zero
console output across a full onboarding plus a complete Challenge Creator run.
Recorded so a fourth session does not spend on it. The general lesson is that
"reproduce it without the dev server" is cheap and should come before theory.

### 37g. Exposure must not repeat like retrieval (2026-08-10)

Found by replaying a simulated learner-year against the finished bank, which
is the only level at which it was visible — every scoring decision involved was
individually defensible.

| accuracy | diagrams reached | worst repeat | after the fix |
| --- | --- | --- | --- |
| 30% | **1 of 15** | `explore-powers` × **45** | × 6 |
| 50% | 5 of 15 | × 21 | × 6 |
| 70% | 9 of 15 | × 11 | × 3 |
| 90% | 12 of 15 | × 6 | × 4 |

A learner having a hard time met ONE manipulable diagram, forty-five times, and
never met the other fourteen.

**The distinction that matters.** Heavy repetition is normal for this planner
and defensible: `exp-evaluate` runs 123 times in the same simulated year, and
repeated retrieval is the point. It is NOT defensible for exposure. "Notice
what stayed fixed while everything else moved" happens once; the forty-fifth
drag of the same slider re-reads a caption. This is the same argument that
already excludes PFL probes from ordinary pools (§30), applied to the other
kind of exposure content in the bank.

`exploreExhausted` in `plannerPolicy.ts` stops offering a family after
`EXPLORE_SERVE_LIMIT = 3`. A soft cap — the count comes from events already
written, so a plan built before this session's events land can overshoot to
about six across a year. The number that would actually read as a bug is two in
one session, and that is measured at zero.

Coverage stays low for a struggling learner (1-5 families), and that is
correct rather than a residual problem: a learner who never reaches
`m-circles` should not be handed the π diagram. What the fix bought is that
their minutes stop being spent re-dragging one slider.

The limit is a HEURISTIC. Three is "an initial meeting plus two spaced
revisits", reasoned from the graded checkpoints attached to each diagram being
ordinary retrieval that does benefit from spacing. No study fixes it.

### 37h. Returning a learner's own problem (2026-08-10)

Challenge Creator (§37f) shipped with the review living in a tab the learner
had to go and open, which realistically means three problems written and the
tab never opened again. Now one comes back at the end of a session.

**The delay is the mechanism, not a detail.** A problem is only handed back
after `COLD_READ_DAYS = 3`. Returned at the end of the session it was written
in, the learner still holds the whole construction in working memory and simply
agrees with themselves — which measures nothing and teaches nothing. The value
is in reading your own question after the specifics have faded, which is the
same spacing argument the rest of the app runs on, applied to self-critique.
HEURISTIC: three days is "long enough to lose the details, short enough that
the loop still closes". No study fixes it.

**Restraint, encoded.** One at a time, oldest first — a queue of six waiting to
be judged is a chore, and a chore at the end of a session is the obligation the
founding brief refuses to manufacture. Neither card blocks "Leave the lab", and
neither records being ignored.

**The invitation cadence is keyed to finished sessions, deliberately.** Every
seventh, suppressed while a problem is waiting to be re-read and for a week
after one is written. It is NOT keyed to a stored "last asked" timestamp,
because a cadence that responds to refusals — backing off, or pressing harder —
is the shape of a nag. Declining changes nothing, and `authoredReview.test.ts`
asserts that the same session count always produces the same answer.

**Two more defects only looking could find**, both in the diagram renderer:

1. A y-axis name and the topmost tick label shared a line, printing as
   `test1(0core`. Fixed by reserving a band (`Y_LABEL_HEADROOM`), and now
   caught by `overlappingLabels` — a general text-collision check built on the
   same shared projection as the dot-overlap gate.
2. The zero-net-force line was drawn in the amber `warn` tone to highlight it.
   In this palette amber means caution, which is the wrong signal for the one
   correct state the whole item exists to demonstrate — and it made the line
   lower-contrast than the four it was meant to stand out from. All five states
   are now the subject colour; flatness is the highlight.

**Canaries added.** Each pixel-space detector now has a test that hands it the
defect deliberately, because a gate that passes might be checking nothing.
Writing them immediately showed the first clipped-label canary was asserting
the wrong condition — marker labels anchor inward, so they escape the frame
only when the text is wider than half the plot.

### 37i. A retention check that only checked one skill (2026-08-10)

Found by measuring repeats-per-FORM rather than repeats-per-template, which is
the distinction that made it visible at all.

`x-explain-back` declares 51 forms — one per skill with both a concept card and
an audited probe. A simulated learner-year used **one**:

| accuracy | servings/yr | forms used | before → after |
| --- | --- | --- | --- |
| 30% | 89 | **1 of 51** | 89 repeats → ~5.9 |
| 60% | 89 | **1 of 51** | 89 repeats → ~3.4 |
| 90% | 102 | 1 of 51 | → 51 of 51, ~2.0 |

**The mechanism.** `pickExplainTarget` returned the oldest RETAINED skill, and
explaining a skill does not change its `retainedAt` — the explain-back logs
under `x-explain` with the target carried only as context, precisely so a
self-written explanation cannot advance an academic skill. So the oldest
retained skill stayed the oldest retained skill forever. Now: least recently
EXPLAINED first, oldest-retained breaking ties, read from the event's
`aboutSkillIds` rather than by decoding the seed against `EXPLAIN_TARGETS`
(which would silently mean something else the moment that list is reordered).

### 37j. MEASURED AND REJECTED: penalising finite content for repeating

The same sweep showed single-form content repeating hard — the same chess
position 34 times a year at 30% accuracy. 82 of this bank's 622 templates have
exactly one form, because a search-verified tactic cannot be randomised.

Four penalty shapes were built and measured against a simulated year:

| variant | owned @30% | owned @60% | worst repeat |
| --- | --- | --- | --- |
| unchanged | **43** | **65** | 34 / 19 / 15 |
| replace the breadth term | 40 | 65 | 23 / 13 / 13 |
| extra term, all templates | 42 | 62 | 24 / 15.5 / 12 |
| extra term, finite content only | 39 | 62 | 23 / 16 / 13.3 |

Every version cut repetition. Every version cost OWNED SKILLS. The mechanism is
legible: promotion needs repeated unaided successes on a skill, so pushing the
planner off a well-fitting template scatters attempts thinner and leaves fewer
skills crossing their threshold.

**Left unchanged deliberately.** The trade runs the wrong way — skills genuinely
owned is the north star, and "I have seen that puzzle a lot" is a comfort
complaint. Recorded in `plannerPolicy.ts` beside the function so the experiment
is not repeated. If revisited, the thing to fix is the SUPPLY of single-form
puzzles, not the scorer.

Worth noting as a general result: this app's planner has now been measured
twice in one day trading breadth against depth, and both times depth won on the
north-star metric. That is not an argument for more repetition — it is an
argument that any change to the scorer must report owned-skills, not just the
number it was aimed at.

### 37k. Naming the struggle — BUILT, and kept narrower than the slogan

Beast Academy teaches productive struggle as a named skill rather than a mood
to endure (§37c). Built as `x-stuck` in Meta Lab, two families:
reading the state, and choosing the next move.

**What the evidence supports.** Sinha & Kapur (2021), 53 studies / 166
comparisons: attempting a problem BEFORE instruction beats instruction-then-
problem at Hedge's g = 0.36 [0.20, 0.51], rising to 0.37-0.58 at high fidelity
to the productive-failure design.
https://journals.sagepub.com/doi/10.3102/00346543211019105

That structure is ALREADY what this app runs — PFL probes, the Notice-then-
Predict diagrams, the Challenge Creator prediction. Nothing new is claimed for
it. The addition is metacognitive: help-seeking is itself a skill with two
failure modes, avoidance and over-reliance, and novices show both.

**What is deliberately NOT claimed.** That struggling as such makes you learn
more; that difficulty is inherently valuable; anything mindset-shaped. The
content never says "struggle is good for you". It says these are two different
states, here is the cue that separates them (did the last few attempts produce
new information?), and here is what each one asks for. The cue is deliberately
not time and not comfort, because both states feel equally bad.

### 37l. Session rhythms: two real bugs that only irregular use exposed

Several rules key off the COUNT of finished sessions rather than calendar days,
so two-a-day, five-a-day and long gaps exercise paths one-a-day never does.
`sessionRhythm.test.ts` plays seven rhythms.

**1. The identical question, twice in one session.** `pickSeed` tries 24 random
seeds looking for an unused variant, then hands one back anyway. For a
single-form template every seed maps to form 0, so all 24 collide and the guard
silently fails. Two due skills naming the same family then produced the same
question back to back. Measured at 1 session in 40 before, 0 after.

Worth separating from the thing that is NOT a bug: repeating a template with
DIFFERENT numbers happened in 17 of those 40 sessions and is ordinary
interleaving. The test asserts on `templateId#form`, not `templateId`.

**2. Same-day review, which is massing wearing a spacing badge.** A skill that
is `struggling` or `blockedByMisconception` is marked due IMMEDIATELY rather
than on an interval — right intent, but with two sessions a day it returns
three hours later, and re-testing a repair that fast reads working memory. 16
same-day repeats over 21 simulated days.

`MIN_REVIEW_GAP_MS = 12h` keeps "tomorrow morning" and refuses "again this
afternoon", and is inert for a once-a-day learner. HEURISTIC. Measured after,
across 1/2/3 sessions a day at three accuracy levels: owned skills 44-48 (30%),
69-77 (60%), 114-120 (90%) — no regression, and better than the 43/65/119
baseline at the two lower levels.

A third, smaller one: the no-dues warm-up fallback could pick the same template
for two different skills, because a template may list several. Deduped.

### 38. The first real bug report (2026-08-10)

Twelve flagged items plus two prose reports from an actual session. Recorded in
full because the hit rate matters: **every substantive report was right**, two
of them pointed at defect CLASSES far larger than the instance reported, and
the reporter's own caveat ("I'm a human that makes mistakes") turned out to be
unnecessary.

**Two class-level findings.**

1. *"For what observation? It didn't gave me any observation or story?"* —
   `item.prompt` frames a multi-part activity while each part carries only its
   own question, and `ItemPlayer` rendered `parts[i].prompt` and never the
   top-level one. **41 of 55 multi-part templates** were carrying content up
   there, including `gt-play-first`'s entire payoff matrix and `st-premortem`'s
   plan. The content audit had been right all along — `visibleText()` already
   treats `item.prompt` as learner-facing — and the renderer was the half that
   disagreed.

2. *"You have to make all the answer around the same length!!"* — measured at a
   15% margin, the longest option was correct in **62% of insight questions**
   against a 25% chance baseline. The existing gate read 24.4% bank-wide and
   passed, because math carries 1032 of 2192 MCQs at 12% and drags the mean to
   chance. An average concealing what it averages over — the exact lesson
   `explore-spread` teaches, which made it an uncomfortable one to find.

Insight was rewritten first (distractors elaborated to match, which also makes
them better distractors) and the rest queued behind a per-bucket ratchet. Both
the number and the ratchet turned out to be wrong; see §38a.

**The rest, each real.** A paused session was destroyed by starting another
(single draft slot, silent loss — now names the clash rather than guessing, the
same call the two-tab warning makes). `pfl-benford` required log₁₀ to answer,
so a probe measuring pick-up of a NEW idea was gated on an unmet OLD one; it
now supplies a table. Diagram numbers carried hyphen-minus, three-place
decimals, and `Speed 20.001 m/s` on the item whose lesson is that speed never
changes. The de-escalation ordering puzzle stated no situation. The L-shaped
room never said the orientation does not affect area. The Android keyboard
scrolled the page under a bottom sheet instead of resizing it.

**The lesson for reading reports.** Two of these arrived as feelings rather
than diagnoses — "kinda obvious", "kinda broken" — and both were correct about
a mechanism the reporter could not see. Written into CLAUDE.md: verify before
fixing, treat confusion as a defect in the app, and do not discount a vague
report. Measurement is how a feeling becomes a bug.

### 38a. The length cue, measured against the right baseline (2026-08-10)

Finishing §38's second finding turned up a worse problem than the one being
fixed: **the measurement was wrong**, and it was wrong in the direction that
hides defects.

**The baseline error.** The gate compared the hit rate against `1/k` averaged
over EVERY option set. That is not the null. A set whose four options are all
the same length can never be cued in either direction, so under the null it
contributes zero — not 0.25. Only sets containing a clear length outlier can be
cued at all, and for those the null probability that the key is the outlier is
1/k. Summing `1/k` over just those sets is the expectation.

The difference is not cosmetic. Science read 26% and was called "at chance";
against the real null of 8% it had an excess of 38 checkpoints. Every "at
chance" reading in §38's table was similarly inflated, and the `BUCKET_CEILING`
ratchet built on top of it was calibrated against a number that meant nothing.

A cue is only visible if a learner can see it, so "outlier" requires BOTH a 15%
relative lead and an 8-character absolute gap. Without the second test the
metric flagged `o-scene-recall`, whose options are "Two/Three/Four/Five": five
characters against four is a 25% lead and invisible.

**Measured before and after, observed against expected.** Excess is
observed − expected, in checkpoints; a healthy bucket sits at or below zero.

| bucket | sets | longest-is-key before | after | expected |
| --- | --- | --- | --- | --- |
| insight | 107 | 39 (+28.8) | 4 (+2.5) | 1.5 |
| meta | 132 | 48 (+34.2) | 0 (−2.1) | 2.1 |
| investigator | 215 | 60 (+39.0) | 8 (0.0) | 8.0 |
| science | 212 | 55 (+38.0) | 4 (−0.5) | 4.5 |
| observer | 138 | 31 (+17.5) | 1 (−2.0) | 3.0 |
| strategist | 133 | 66 (+61) † | 1 (−1.3) | 2.3 |
| coding | 59 | 16 (+10.8) | 1 (−1.0) | 2.0 |
| math | 774 | 81 (+29.3) | 32 (−9.9) | 41.9 |
| physics | 72 | 6 (−1.0) | 6 (−1.0) | 7.0 |

† strategist's "before" is the pre-fix reading from §38's naive metric; the
expected-value figure was not captured before the first edits landed.

**What the rewrites actually were.** Almost never shortening the key. The
recurring shape is a right answer that carries its qualifier ("keep all three
live, *because* …") against distractors written as one-line dismissals. The fix
is to give each distractor the same procedural texture while keeping its
specific flaw — an elaborate bad plan is both length-matched AND a harder,
more realistic discrimination than a terse one. Three cases needed the reverse:
`h-influence-firewall` and `path-h-pressure-defense` name a technique in four
words while the distractors described theirs in a sentence, so the distractors
were compressed to labels.

One case was not about words at all. `studio-program-build` pretty-printed the
correct implementation across seven lines and left the three wrong ones as
one-liners — the key was identifiable from block shape before reading a token.
All four are now formatted identically; measured in the running app, the four
option buttons render at 67px each.

**A second, weaker cue is now visible and is being left alone.** Across every
bucket the key is almost never the SHORTEST option (math: 14 observed against
43 expected). "Never pick the shortest" eliminates one option on the ~6% of
sets that have a clear-shortest outlier — worth roughly a point bank-wide,
against the ~18 points the longest-answer cue was worth. Chasing it would mean
padding terse-but-correct answers, which costs more in readability than it buys
in validity. Recorded rather than fixed.

**The gate now in place** (`contentAudit.test.ts`) checks observed-minus-
expected per bucket, in both directions, capped at 5% of that bucket's sets.
Unlike the ratchet it replaces, it needs no hand-tuned constants: expectation
is computed from the same option sets being judged, so it cannot drift.

**Method note for the next hunt.** The reason this took two passes is that the
first metric was validated against intuition ("25% is chance, so 24% is fine")
instead of against a simulation of the null. Any "is this above chance?"
question in this codebase should compute chance from the actual data, not from
the number of options.

## 39. Constructed answers, and the limit of generators (2026-08-10)

An outside review of the bank made five criticisms. Measured against 624
templates and 701 graded checkpoints, four were right and one was half-right:

| claim | measured | verdict |
| --- | --- | --- |
| ~95% of content is a number or a choice | 89% of checkpoints; 8% constructed | right |
| the top of the ladder is thin | 46 of 624 at difficulty 5 (7%) | right |
| non-math buckets are a sample | math is 298 of 624 templates, 5,503 of 8,173 problems | right |
| nothing teaches | 47 of 624 carry exposition, and 9 of those are `pfl-*` probes barred from the ladder | right |
| variants are not novel problems | true about generators; **but the ladder already refuses to reward them** | half-right |

Two findings the reviewer could not see, both worse: physics and meta have
**zero** difficulty-5 templates (observer has one, coding and insight two), and
the only real teaching surface in the app is deliberately excluded from
progress. One kinder: `formKey` is the template id, so all 18 variants of
`expr-evaluate` are ONE piece of evidence and Independent needs two families.
Variants buy speed, never rungs. The criticism lands on the ceiling, not the
accounting.

### 39a. What a generator cannot do, and what can

The half-right claim is the important one. A generator randomises the NUMBERS
in a fixed question, so the method is recoverable from the question's shape and
after a few variants nothing is being solved. No volume of extra templates
fixes that; it is a property of the form.

Construction problems invert it. The method is trivial to state -- "make the
mean 7" -- and the work is search. There is no shape to recognise because the
learner is building the shape, so every instance is genuinely worked whatever
the seed. `ConstructAnswer` grades a learner-built object against declarative
constraints (`src/engine/construct.ts`): statistics, linear and bilinear forms,
digit pools, ordering, and relations between two statistics of the same values.
Many objects satisfy any given problem and all of them are accepted.

This also widens assessability, which was criticism three. Constructed
reasoning was outside what the app could evaluate; this is constructed and
still graded exactly, offline, with no model. **It does not close the gap.** A
proof, a derivation with justification, or an argued explanation remain
ungradable here and will stay that way while the app has no server and no
model -- `draft` takes them, compares them against an explicit model, and
refuses to score them, which is the honest ceiling rather than a keyword
matcher pretending to comprehend.

Provenance: the digit-placement item uses the widely-practised "open middle"
genre -- a frame with blanks a solver fills toward a target. The genre is not
anyone's property; no problem text, target, digit set or constant is taken from
a published set, and every optimum is found by exhaustive search at generation
time. `ATTRIBUTIONS.md` records the licence rule for any future adapted
material: CC BY 4.0 and public domain only, ShareAlike refused because it would
propagate to this repository, and edition-level verification because
Illustrative Mathematics' first edition is CC BY while v.360 is CC BY-NC.

### 39b. Optimising the grader against false negatives, deliberately

A strict grader looks safer than a loose one and is not. The mastery ladder
blocks promotion on unrepaired errors, so a grader that rejects a correct
answer does not merely annoy -- it silently parks a learner on a skill they
already hold. The first version of the construct grader shipped its own number
parser, which rejected `3 1/2` and `50%`, forms the numeric validator has
accepted since the beginning. Both now share `parseValue.ts`, and the content
audit asserts that a correct answer written as a fraction, with a leading plus,
or padded with spaces is still accepted at every seed of every item.

**What this grader still rejects that a human would accept**, stated plainly
because a grader's blind spots should be written down rather than discovered:
an unevaluated arithmetic expression (`2^3`, `sqrt(9)`, `12/4 + 1`), a unicode
fraction glyph, scientific notation with a unit attached, and any answer whose
slot values are correct but entered against different slot keys than intended
-- though for every current item the constraints are symmetric, so slot order
does not matter. Constraints are also evaluated at IEEE double precision with a
1e-9 tolerance, so a construction requiring exact rational equality at very
large magnitudes would be at risk; none currently does.

### 39c. The gate that adding content revealed

Registering seven construction items broke three planner simulations, and the
failures were the point. A COLD learner began receiving difficulty-4 and -5
constructions and out-scored the strong-placement learner on mean difficulty.

The content was fine; there was no rule saying who it was for. Handing a search
problem to someone with no foothold on the skill is unassisted discovery, the
one instructional move with a clearly negative effect size (Alfieri et al.
2011: d = -0.38 unassisted, +0.30 assisted -- §14). `nonRoutineTooEarly` now
withholds `novelty: 'nonRoutine'` work until at least one of its skills is past
`unseen`. The gate is deliberately at the LOWEST rung: the requirement is
somewhere to search from, not readiness.

Applied once, where `buildSessionPlan` unpacks its context, rather than at each
of the eight pickers -- which is how one of them would eventually be missed.

The general lesson is worth more than the fix. **Adding content can break the
planner**, because content and selection are one system. Any future import has
to run the planner simulations, not only the content audit.

### 39d. Gates added

`contentAudit.test.ts` gains six, all canaried against deliberate breakage
(56 construct checkpoints over 224 constraints are actually in scope):

1. every construction has a solution and the app knows one;
2. the witness round-trips through the real grader;
3. a correct answer in another written form is still accepted;
4. constraints bite -- under 2% of pseudo-random junk may pass;
5. nothing claims `nonRoutine` without being a construction, chain or puzzle;
6. any `source` names a licence this repository can carry.

### 39e. Still open, and not pretended otherwise

Nothing here teaches yet. The lesson type (attempt first, then instruction,
then a worked example, then a faded one, then solo -- Barbieri et al. 2023
g = 0.48 over 55 studies for worked examples, gated on novice state by Kalyuga
et al. 2003's expertise reversal) is designed and unbuilt. So are per-template
exposure tracking, a dispute flow, an item cooldown with recycled-evidence
weighting, and the curation pipeline. Breadth outside mathematics remains a
sample; that is a volume problem no mechanism solves.

**Licensing unchanged from §25**: Brilliant, IXL, DeltaMath, Alcumus, Beast and
Math Academy are proprietary. Nothing here is text, artwork, a scoring constant
or a taxonomy lifted from them — only mechanisms described in their own public
writing, reimplemented from scratch against this app's own measurements.

## 40. Five years, and what is actually known about training reasoning (2026-08-11)

The brief: make the app good for a **five-year** learner, make every area rich,
and add a goal aimed at real-life reasoning that genuinely does what it says.
Two of those are volume problems. The third is an evidence problem, and it is
the one that could have gone badly, so it was researched before anything was
built.

### 40a. What five years measured — the app was a two-year app

Six five-year simulations through the real planner (`src/sim/`), across session
lengths, multi-session days and missed weeks. The headline: **owned skills
plateaued at ~105 of 123 by year 3**, and years 3-5 bought roughly ten skills
for thirty thousand minutes. Three distinct causes, all invisible at one year:

1. **`state.sessions` is capped at 2000 records**, and two planner cadences
   counted with `state.sessions.length`. Past the cap it freezes: `2000 % 3` is
   permanently 2, so the retention exit fired EVERY session forever; `2000 % 4`
   is never 3, so authentic applied work was never scheduled again. Measured at
   three sessions a day: 4,138 serves of one 4-minute item, Meta Lab at 19.4%
   against a ~5% target, Human Insight squeezed to 2.0%. Fixed by counting
   distinct session ids in the event log, which is never truncated.
2. **A maths course is finite and the aim never left it.** Starting at Math 8,
   the learner retained the entire course inside two years and then reviewed it
   for three more — one exponent template served 688 times, all fifteen variants
   worn out — while ten skills that EXIST in the app were never scheduled once.
   `effectiveTrack` now walks `next` once the stated course is fully proved.
   Unreached skills over five years: 11 to 1. A ten-minute-a-day learner went
   from 107 skills to all 123.
3. **The content bank is a two-year bank.** With the first two fixed, the
   plateau simply arrives sooner. 123 skills is the whole app; 259 templates
   wore out their entire declared variant pool inside five years. That is not a
   mechanism problem and no scheduler fixes it.

A methodological note worth keeping: the first version of this measurement
reported the retention exit serving 2 of its 51 variants. That was **the
harness**, not the app — the fixture omitted `aboutSkillIds`, which is what the
rotation reads. The app serves all 51. A simulation is a fixture and can lie in
exactly the direction that makes a bug look worse.

### 40b. Training that transfers — the honest list

Searched, read, and tiered. The short version: **most of what an app would want
to claim here is not supported, and the small supported part is worth building
properly.**

**EVIDENCE — replicated, with a measured effect on something the learner did not
train on:**

- **Case comparison / analogical encoding.** Gentner, Loewenstein & Thompson
  (2003, *J. Educational Psychology* 95(2)). Two surface-different cases that
  share a structure, with the learner asked to describe what they have in
  common, transferred to a NEW case at .59 vs .22 for studying the same two
  cases separately (Exp 2; second structure .38 vs .16). Exp 3 reached live
  behaviour: guided analogy 90%, bare "compare these" 70%, separate cases 55%,
  baseline 37%. Schema quality mediated it (42% vs 13% stated the full
  principle) and predicted transfer. Loewenstein et al. (1999, *Psychonomic
  Bulletin & Review* 6(4)) held it across a one-week delay.
  **Why this one counts more than the rest of the literature:** the control
  holds the content identical and varies only the instruction. That is the
  design quality the chess, music and working-memory literatures lack.
  **Limits, stated:** one research group, negotiation domain, students, delays
  up to a week, and "far transfer" means a structurally similar new case — not
  an unrelated part of life.
  *Built as:* `x-compare`, and the three-checkpoint shape in
  `content/items/caseComparison.ts` — both cases, a PROMPTED ungraded written
  comparison, then a graded principle question, then a graded THIRD case.
- **Natural frequencies.** Gigerenzer & Hoffrage (1995, *Psych Review* 102(4));
  McDowell & Jacobs (2017, *Psych Bulletin* 143(12)) meta-analysed 35 articles
  and 226 estimates: **24% correct vs 4%**, odds ratio 7.1. Sedlmeier &
  Gigerenzer (2001, *JEP:General* 130(3)) is the durability result and the
  reason the app teaches a frequency TREE and not Bayes' formula: at 15 weeks
  the tree held 93% to 100% while formula training decayed 86% to 50%.
  **Limits:** after the best known fix, three quarters still get it wrong. The
  programme calls itself a **"boost"** — a local fix with no aspiration beyond
  the current context. That is the right register for the app's copy too.
  *Built as:* `i-natfreq`.
- **Reference classes / the outside view.** Mellers et al. (2014, *Psych
  Science* 25(5)); Chang et al. (2016, *JDM* 11(5)). A randomised four-year
  forecasting tournament, ~1,000+ forecasters a year; under an hour of
  probabilistic-reasoning training improved Brier scores **6-11%**, sustained
  across all four years, and self-reported use of comparison classes was the
  component that correlated with accuracy.
  **Limits:** measured entirely inside the forecasting task. It does not show
  calibration improving unrelated everyday decisions, and two large recent
  experiments (N = 610, N = 871; Martin & Mandel 2025, *Futures & Foresight
  Science* 7) found outcome and scoring-rule feedback alone did nothing at all.
  *Built as:* `i-refclass`.
- **Abstract rule plus worked examples across several surface domains.** Fong,
  Krantz & Nisbett (1986, *Cognitive Psychology* 18(3)): brief law-of-large-
  numbers training improved statistical reasoning on everyday problems, and
  **improvement was as large in untaught domains as taught ones**. Fong &
  Nisbett (1991, *JEP:General* 120(1)) adds the part that matters to a
  scheduler: after two weeks there was **no decline in the trained domain and a
  significant decline in the untrained one**. If that generalises, transfer
  items need SHORTER intervals than same-domain items, not equal ones.
  *Built as:* `i-samplesize`, taught abstractly then exampled across unrelated
  settings. The scheduling consequence is recorded here and NOT yet built.
- **Interactive practice beats exposition, for the thing that matters.** Rhodes
  et al. (2017, *Games and Culture* 12(3)) is the independent evaluation: games
  beat video on **procedural** knowledge (not committing the bias) and had no
  advantage on **declarative** knowledge (naming it). So the app grades the
  first, never the second.

**HEURISTIC — plausible, and the app must say so:**

- **Debiasing training generally.** The famous numbers (Morewedge et al. 2015,
  *Policy Insights* 2(1), d up to 1.74) are pre-post within-subject on a
  purpose-built self-report scale **with no untrained control**, and the
  anchoring subscale had alpha of .52-.62. The defensible figure is the 2025
  meta-analysis of **54 RCTs and 10,941 participants: g = 0.26** (Swaryandini et
  al., *Nature Human Behaviour* 9(12)). Real-world transfer rests on a **single
  quasi-experimental study** — Sellier, Scopelliti & Morewedge (2019, *Psych
  Science* 30(9)), OR 0.55 — where assignment came from scheduling accident
  rather than randomisation. The 2021 systematic review (Korteling et al.,
  *Frontiers in Psychology* 12:629354) concludes there is "insufficient evidence
  that bias mitigation interventions will substantially help people to make
  better decisions in real life conditions."
- **Argument mapping.** The circulated ~0.8 SD per semester traces to an
  **unpublished master's thesis** (Alvarez Ortiz 2007), and Huber & Kuncel
  (2016, *RER* 86(2)) point out it implies ~6.24 SD across a degree, which is
  not a real quantity. One genuinely automated, machine-graded study exists —
  Butchart et al. (2009, *AJET* 25(2)), 0.45 SD — which is why argument mapping
  is on the "maybe build" list and not in the goal's skill set. **The 0.8 SD
  figure must not appear anywhere in this app.**
- **Fermi estimation.** No study has tested whether it improves general
  estimation or reasoning. Worth having as a skill in its own right and as
  base-rate practice; the copy says so.
- **Premortems.** The "30% more reasons" is Mitchell, Russo & Pennington (1989,
  *JBDM* 2(1)) and counts REASONS GENERATED, not their quality. The only
  quantitative test of the technique itself is a 2010 ISCRAM conference paper
  (178 students) showing reduced confidence.
- **Checklists.** Haynes et al. (2009, *NEJM* 360) is before-after with no
  concurrent control; Urbach et al. (2014, *NEJM* 370) is the population-level
  replication across 100+ hospitals — adjusted 30-day mortality 0.71% to 0.65%,
  not significant. Not a model for a reasoning app.

**REFUSED — in the neuromyth table, with numbers:**

| Claim | Evidence against |
|---|---|
| Brain training improves general cognition | Owen et al. 2010, *Nature* 465, **N = 11,430**: gains on trained tasks, no transfer |
| Brain training improves everyday cognition | Simons et al. 2016, *PSPI* 17(3): "little evidence… improves everyday cognitive performance" |
| Working-memory training raises intelligence | Melby-Lervag, Redick & Hulme 2016, *PPS* 11(4), 145 comparisons: no convincing far transfer |
| Chess instruction improves maths | Sala & Gobet 2017, *Learning & Behavior* 45(4): N = 233 vs checkers, N = 52 vs Go — **no significant difference** |
| Music training raises cognition | Sala & Gobet 2017/2020: 0.25 vs passive controls, **0.03 vs active** |
| Puzzles or spatial training transfer to maths | Sala & Gobet 2017 Table 1; Xu & LeFevre 2016 |

The generalisation that ties them together: **effect size is inversely related
to design quality.** Swap a passive control for an active one and these collapse
to zero. That is the single most useful line in the whole table, and it is why
this app's own puzzle content carries no transfer claim at all.

### 40c. The goal, and what it deliberately does not promise

`Everyday reasoning & judgement` is the first goal that names SKILLS rather than
only areas, because a bucket tilt cannot tell natural-frequency Bayes from
equilibrium game theory and only one of those has carry-over evidence. The bonus
is 1.0 — under the course tilt, well under a due review — and it always renders
its reason.

Two absences are deliberate and both are pinned by a test in
`engine/goalSkills.test.ts`:

- **Confirmation bias.** The 2025 meta-analysis singles it out as the bias
  education essentially fails to shift; Sellier's own mechanism analysis found
  training suppressed confirming arguments without significantly increasing
  disconfirming ones (d = 0.11, n.s.). A goal that promised to fix it would be
  promising something the app cannot deliver.
- **Anything resting on puzzle, memory or chess practice.** See the table.

The Settings copy says what the goal leans toward, and says outright that it
does not promise better thinking in general.

### 40d. Standards, and the honest gap

Audited against the real documents. Maths (CA CCSSM) runs Grade 8 to Algebra I
to Geometry to Algebra II to Precalculus and the app's track ladder already
mirrors it; ~76-90% of statements are offline-assessable, with **Geometry the
worst at 24% proof-production**. Science must be audited against **SEPs and
CCCs, not performance expectations** — the NRC's 2014 assessment report is
explicit that a PE needs a multi-component task set, so claiming PE coverage
from single items would be exactly the overclaim this ledger exists to prevent.
GAISE II Level C is the richest seam at **22 of 29 essentials assessable**.
CSTA 3A/3B is 31 of 58, concentrated in algorithm analysis, recursion tracing
and bit representations.

For reasoning there is **no adopted K-12 standard at all**. The only citable
hooks in US standards are CCSS ELA **RI.8.8** ("recognize when irrelevant
evidence is introduced"), **RI.9-10.8** ("identify false statements and
fallacious reasoning"), and **RH.6-8.8 / RST.6-8.8** (fact vs reasoned judgment
vs speculation). Texas approved a Logic I course (PEIMS N1290100, 2025-26) with
a closed fallacy taxonomy, but it is an elective innovative course outside TEKS.
Everything else — P21's 4Cs, Portrait of a Graduate, AAC&U VALUE, PISA Creative
Thinking — is either uncoded, human-rated, or both.

So the honest statement, and the one the app makes: **the reasoning content is
the app's own construction**, anchored to RI.8 and RH.8 where it genuinely
matches and to nothing where it does not. That is consistent with the founding
brief, which always said the four Paths were original constructions.

One practical warning recorded for later: Cognitive Reflection Test items are
near single-use for one learner — their entire published limitation is prior
exposure — so anything in that shape belongs behind the longest cooldown in the
app, in generated-variant families, never in normal rotation.

### 40e. Version traps found while auditing standards

Recorded so a later agent does not re-derive them. CSTA's 3A/3B identifiers are
the **2017** revision; a 2026 revision retires them. California publishes its
own CS codes (`9-12.*` / `9-12S.*`) which differ from CSTA's, and California is
the alignment this app claims elsewhere. And the CA Precalculus course has no
chapter in the 2023 Mathematics Framework — its only CDE course definition is
the 2015-published chapter of the previous framework, now 404 on cde.ca.gov.
Superseded but not replaced.

## 41. What actually makes anything transfer (2026-08-12)

§40 asked which SKILLS have carry-over evidence and answered it. This asks the
different question: what DESIGN makes anything transfer out of a practice app at
all. Mechanism and format, not skill selection.

### 41a. The headline, stated first

**No app can make someone functionally smarter, and the evidence is strong
enough that the claim must never appear here.** §29a already carries the number
(g = 0.00 far transfer against active controls). This pass adds that the same
collapse appears INSIDE the mechanisms this app already relies on.

The defensible smaller claim: *taught, named, abstract rules, practised until
they can be produced unprompted on surface-different material, are retrievable
later in situations resembling the ones they were practised on.* That is
Perkins & Salomon's high-road transfer via bridging plus Fong/Nisbett rule
training (§40b). Everything below raises the odds on that sentence. None of it
raises general ability.

There is also **no honest base rate for far transfer**: Barnett & Ceci (2002)
argue explicitly that pooling this literature would mislead, because the studies
lack common structure. Anyone quoting one number is quoting a subliterature.

### 41b. The negative result that matters most

**Pan & Rickard (2018), *Psychological Bulletin* 144(7), 710-756.** 192 effect
sizes, 122 experiments, N = 10,382, against a restudy control.

Overall d = 0.40. By category: different test FORMAT d = .58; application and
inference d = .32; **problem-solving d = .29, p = .10 n.s.; rearranged
stimulus-response d = .22, p = .066 n.s.; untested material d = .16, p = .20
n.s.**

Two moderators survive joint fitting: *response congruency* (same answer,
different question) +.35, and *elaborated retrieval* (explanatory feedback
processed after retrieval) +.22. With both, d = .78. With neither, d = .21 —
and the publication-bias-adjusted intercept with neither is **d = 0.015**,
negative on one subset.

**Consequence: retrieval practice reliably transfers across question FORMAT and
does not reliably transfer to problem-solving or to unpractised material.** §1
is safe as written because it claims retention. Nothing may start claiming that
reviewing a skill builds transferable competence.

Butler (2010) is the strongest positive study and cannot be used here: its
participants were TOLD the final test related to what they had studied, which is
Detterman's objection and §22's own gate.

### 41c. The measurement result that should worry us most

**Schwartz & Bransford (1998), *Cognition and Instruction* 16(4), 475-522.** The
main effect (contrasting cases before the telling, not after) is useful. The
finding this app needs is buried in the method:

**Their true/false verification test sat at 93% accuracy in EVERY condition with
no difference between them, while the uncued prediction task showed a strong
crossover — and verification scores predicted prediction performance not at all,
F(1,18) = 0.21, p > .6.**

The app's whole ladder is built from graded correctness. So **a skill can be
fully Retained and carry no information about whether it will ever be used.**
`northStar`'s "durable" is a retention measure and its docstring says so; it
must never drift into transfer language.

Related: Barnett & Ceci's own text defines their "memory demands" dimension as
whether the learner must SELECT the approach or merely execute a prompted one —
i.e. spontaneity. §21 maps that dimension onto answer format, which is really
the modality dimension. **The app is not currently measuring spontaneity at
all.** Gick & Holyoak size the gap: ~30% solve after reading a structurally
identical story, ~75-80% once TOLD to use it. Roughly two-thirds of people who
already hold the solution fail to retrieve it unprompted. That gap, not
knowledge, is the target.

### 41d. The app is the retrieval cue

Morris, Bransford & Franks (1977) — transfer-appropriate processing: semantic
encoding beats rhyme encoding on a recognition test, and **rhyme encoding beats
semantic on a rhyme test**. There is no "deep" encoding in the abstract; it is
good or bad relative to the retrieval demand.

Smith & Vela (2001), 93 studies: incidental environmental context-dependence
d = .28. Smith, Glenberg & Bjork (1978): studying in two rooms beat studying
twice in one, including when tested in a THIRD room.

**For a single-device app the context that risks becoming the cue is the app
itself** — its layout, phrasing register, answer widgets, time of day. A skill
practised only inside Axiom Lab has Axiom Lab as part of its cue. This is the
strongest theoretical argument in the whole pass for varying surface features
within a skill's pool, and nothing currently measures that.

### 41e. Self-explanation — the most directly applicable number

**Bisra, Liu, Nesbit, Salimi & Winne (2018), *Educational Psychology Review*
30(3), 703-725.** 69 effect sizes, N = 5,917: **g = 0.55**. The moderator that
matters: prompts asking learners to explain a CONCEPT significantly outperform
metacognitive prompts asking about their planning or performance.

**Tan et al. (2025), *Educational Psychology Review*** (secondary — abstract
only): 204 effect sizes, digital environments, overall g = .46, **transfer
g = .33**, better for conceptual than procedural.

So self-explanation delivered exactly as this app delivers it — typed, digital,
ungraded — is worth about **g = 0.33 on transfer**. Modest, real, quotable. The
explain-back exit already uses a CONCEPT prompt, which is the stronger class; it
must not be "improved" later into "how did you approach this?".

### 41f. Gamification — the refusal is defensible, and it is not free

**Sailer & Homner (2020), *Educational Psychology Review* 32, 77-112.** Overall
cognitive g = .49, motivational .36, behavioural .25. Restricted to
high-methodological-rigor studies: **cognitive g = .42 [.14, .68] on nine
studies; motivational g = .22, p = .20 n.s.; behavioural g = .27, p = .22 n.s.**

Read honestly: there is a small cognitive-learning effect that survives
filtering, resting on nine studies, and the motivation and behaviour effects do
not survive at all. Points, badges and leaderboards were not the active
ingredient in anything; game fiction and competition-with-collaboration were,
and a solo offline app can use neither.

Set beside §29d (performance-contingent rewards, d = -0.80 on free-choice
intrinsic motivation), the founding brief's refusal is evidentially defensible.
**It is not costless — the refusal declines a g ≈ .42 cognitive effect — and
this ledger should say so rather than pretend the evidence is one-sided.**

Also: Deslauriers et al. (2019, *PNAS* 116(39)) — randomised, identical
materials, same instructor: active-learning students **learned more and rated
their own learning lower**. Any UI that lets perceived fluency drive what gets
practised next will systematically select the worse option. The planner derives
from performance rather than preference, which is the right side of this.

### 41g. Corrections this pass forced

- **§20b was overclaiming by roughly four times.** Corrected in place; see that
  entry. d = 0.65 (94 tests) is superseded by d = .36 raw / .15 bias-corrected
  (642 tests), and this app sits in the worst cell of every moderator.
- **A real bug fell out of the same paper.** One plan d = .41, three plans
  d = .07 — yet `planCandidate` excluded only skills that already had a plan
  while the caller suppressed new ones only once a follow-up fell due fourteen
  days later, so a learner could accumulate one open plan per session. Fixed and
  pinned.
- **§21's Barnett & Ceci caveat can be lifted**: the primary PDF does extract as
  text at rapunselshair.pbworks.com/f/barnett_2002.pdf and all nine dimensions
  verify. §22's Detterman citation can be strengthened the same way — Barnett &
  Ceci quote him directly, including the line that matters here: *"Telling
  subjects to use a principle is not transfer. It is following instructions"*
  (Detterman 1993, p. 10).

### 41h. Built, and still to build

**Done in this pass** (cheap, and each tied to a moderator): one open plan at a
time; the cue asks for a place as well as a moment (d = .46 vs .25) and
deliberately never asks how or how long (which drops it to .24).

**Not done, ranked.** Each is recorded so a later session does not re-derive it:

1. Rehearse the if-then plan exactly once at save time (no rehearsal .33 →
   rehearsed once .50). A single echo on the confirm step, not a log screen.
2. Author response-congruent review pairs — same answer, different question form
   (d = .58 vs .28). Content work, not engine work.
3. Elaborative rather than merely corrective feedback after a retrieval (+.22).
4. A surface-diversity audit per skill: refuse the `transferred` rung when a
   skill's whole pool shares one surface context. HEURISTIC threshold over an
   EVIDENCE mechanism (41d).
5. Contrasting cases BEFORE the explanation, not after — §20a already records
   that most Path explanations do the failing order.
6. ~~A genuine spontaneity probe~~ — **BUILT 2026-08-15.** `sp-` templates,
   `engine/spontaneity.ts`, and a readout on Progress comparing the unprompted
   rate against the same learner's prompted rate on the same skills. Three
   things had to be true and each was got wrong first: probes must never move
   the ladder (the flag was declarative and unenforced until `mastery.ts`
   excluded the `sp-` prefix during replay, exactly as it does for PFL); the
   prompt must never name the method (pinned by a banned-word list with a
   canary); and "nothing applies" must be correct sometimes and not always
   WITHIN each template — pooled across templates it read as a healthy mix
   while one template carried every null answer and the other none.
7. Concreteness fading as an authored sequence, concrete → faded → abstract and
   never reversed (Fyfe et al. 2014/2015 — EVIDENCE for children's maths,
   HEURISTIC elsewhere).

### 41i. Refused, with numbers

| Claim | Against it |
|---|---|
| Retrieval practice builds transferable competence | Pan & Rickard 2018: problem-solving d = .29 p = .10 n.s.; untested material d = .16 p = .20 n.s.; adjusted intercept d = 0.015 |
| An if-then plan will make a technique fire in real life | Sheeran 2024: field .27, online .31, 1-6 months .19, RoBMA-corrected .15 |
| 66 days makes a habit | Lally 2010: median 66 days AMONG THOSE WHO PLATEAUED; curve fit good for 39 of 96; behaviours were eating and exercise, not cognitive moves |
| Gamification is motivating | Sailer & Homner high-rigor: motivational g = .22 p = .20 n.s.; behavioural .27 p = .22 n.s. |
| Varied examples transfer strongly | Brady 2004: d ≈ .19 applied vs .57 lab, and it is a motor-skill literature |
| Concreteness fading is established for transfer | Fyfe et al. 2014 is a systematic review with NO pooled effect; direct tests are grade 2-3 maths |
| Faded worked examples produce far transfer | Reliable for near transfer only |
| Passing the app's checkpoints shows the idea is usable | Schwartz & Bransford: verification 93% in every condition, predicted nothing (p > .6) |
| Bridging is proven | Perkins & Salomon 1988 is a practitioner article; its support is 1980s vote-counts that would fail §29a's standard |
| There is a known base rate for far transfer | Barnett & Ceci argue pooling would mislead |

---

## 42. Theory of mind and inner speech (2026-08-15)

Asked for directly by the owner: make the app enhance "theory of mind /
mentalizing" and "inner dialogue". Both turn out to be areas where the popular
claim and the evidence point in different directions, so the headline goes
first.

### 42a. The headline, stated first

**Neither is trainable-by-app in the way the request assumes, and the reason is
different in each case.**

Theory of mind is a developmental milestone that this app's learner passed
around a decade ago. Every strong training result is in preschoolers acquiring
first-order false belief for the first time; there is nothing comparable for
adolescents, and the best review of ToM training in a population that keeps
struggling with it found the gains do not generalise.

Inner speech is not a milestone but a *variable*: people differ enormously in
how much of it they have, and the one intervention literature with a solid
effect size is about motor skills in sport.

**What IS defensible, and is what this pass builds: the epistemics of reading
other people.** Not "get better at knowing what someone thinks", which the
evidence says an app cannot deliver, but "know how reliable your reading of
someone is, and know what actually improves it". That is a taught, named,
abstract rule of exactly the kind 41a identifies as the only thing with real
support, it is falsifiable, it is assessable offline, and it belongs to
Observer/Insight as DEFENCE rather than as social technique.

### 42b. Theory of mind: what the training evidence actually says

**Hofmann, Doan, Sprung, Wilson, Ebesutani et al. (2016), *Cognition* 150,
200-212.** 32 papers, 45 procedures, 1,529 children. Aggregate **Hedges'
g = 0.75, CI [0.60, 0.89], p < .001** — the number usually quoted as "theory of
mind is trainable".

**The number that disqualifies it here is in the sample description: mean age
63 months (SD 28.7).** These are four-to-six-year-olds being taught first-order
false belief, a milestone typically reached at about four. A 14-year-old passed
it a decade ago. Quoting g = 0.75 at an adolescent would be transferring an
effect from acquiring a capacity to sharpening one already held, across a
ten-year age gap, with no study in between. Moderators that reached
significance were length of session and length of training period — dosage, not
mechanism.

**Fletcher-Watson, McConnell, Manola & McConachie (2014), Cochrane Database of
Systematic Reviews, CD008785.** 22 studies, 695 participants. The conclusion is
the decisive one for anything an app would build: there is some evidence ToM
skills **can be taught**, and **poor quality evidence that they are maintained,
that they generalise to other settings, or that teaching them affects
developmentally-linked abilities.**

So the honest summary is: the trained task improves, and nothing else has been
shown to. That is the same shape as the working-memory training literature
(29a) and deserves the same treatment.

### 42c. The measure most people mean is probably not measuring it

The Reading the Mind in the Eyes Test is what "mentalizing test" usually means
in popular coverage, and it is contested as a ToM measure at all. The recurring
critiques: it may index **emotion recognition rather than mental-state
attribution**; performance depends heavily on **emotion vocabulary**, so a low
score can mean not knowing a word rather than not reading a face; and it is
**moderately related to verbal IQ**.

Consequence: the app must not use eye/face reading as a mentalizing measure, and
should not build content in that shape at all. It would be measuring vocabulary
and calling it social insight — the app's own 29a-style error, one level up.

### 42d. The result that changes what to build

**Eyal, Steffel & Epley (2018), *JPSP* 114(4), 547-571, "Perspective
mistaking".** 25 experiments. Experiments 1-15 standard interpersonal-accuracy
tests, 16-24 naturalistic (married couples, romantic partners, friends), 25 the
decisive contrast. Tasks included reading emotions from faces, RMET,
genuine-versus-fake smiles, lie detection, and predicting a partner's
preferences.

**Being instructed to take another person's perspective did not reliably
improve accuracy, if anything decreased it, and increased confidence.**
Experiment 25 tested *perspective getting* — actually asking the person — and
that improved accuracy.

This is the most useful finding in the whole pass, for two reasons. It is a
crisp, teachable, counterintuitive rule. And it is **protective**: confident
mind-reading is the engine both of being manipulated and of ordinary conflict.
Teaching its unreliability is Insight-path DEFENCE in the strictest sense, and
it points the learner toward asking rather than toward inferring — the opposite
direction from every cold-reading technique the founding brief refuses.

It also connects to machinery the app already has: the gap between confidence
and accuracy is precisely what `engine/calibration.ts` measures.

### 42e. The fiction claim, since it will come up

Kidd & Castano (2013, *Science*) reported that reading literary fiction improves
ToM. Panero et al. (2016, *JPSP*) failed to replicate. Kidd & Castano (2017)
replied that the replication's participants demonstrably had not read the
passages and that two of its largest studies failed random assignment; Panero et
al. (2017) reaffirmed the null after reanalysis. **Unresolved, actively
disputed, and measured on RMET (42c) — so unusable in either direction.**
Recorded here only so a later session does not treat it as settled.

### 42f. Inner speech: the construct is a variable, not a skill

**Nedergaard & Lupyan (2024), *Psychological Science*, "Not everybody has an
inner voice: behavioral consequences of anendophasia".** Adults reporting low
inner speech (N = 46) versus high (N = 47): the low group performed worse on
verbal working memory and rhyme judgment, and **no differently on task-switching
or categorical perceptual judgments**. Lind (2025, same journal) disputes that
anyone truly lacks it.

Two consequences, both binding on design. Inner speech varies from near-constant
to nearly absent across ordinary people, and **the app has no way to tell which
kind of learner it has** — self-report about one's own inner experience is
exactly the sort of thing this app elsewhere refuses to grade. And where the low
group did differ, it was on verbal-memory tasks; the reasoning-shaped measures
showed nothing.

So a feature that *requires* an inner voice would work unevenly and invisibly.
Anything built here has to be an offered option phrased as "some people find",
never an instruction.

### 42g. Self-talk: the good effect size is in the wrong domain

**Hatzigeorgiadis, Zourbanos, Galanis & Theodorakis (2011), *Perspectives on
Psychological Science* 6(4), 348-356.** 32 studies, 62 effect sizes,
**ES = .48**. Moderators: larger for **fine** than gross motor demands, and
larger for **novel** than well-learned tasks.

This is a sports motor-skill literature. The novelty moderator is the one that
tempts a reader toward generalising — new tasks benefit most, and this app works
at a learner's frontier — but a dart throw and a proportional-reasoning problem
share no mechanism, and nothing in the meta-analysis speaks to cognitive work.
**HEURISTIC at best if borrowed; it is not evidence for this app's domain.**

**Distanced self-talk** (Kross et al. 2014, *JPSP* 106(2), 304-324; seven
studies, N = 585) is the most-cited practical version: using your own name or
"you" instead of "I" while thinking through something stressful. Kross reported
better observer-rated performance and less distress under social stress.

**Murdoch et al. (2023), *Stress and Health*, meta-analysed it: 25 experiments,
2,397 adults, a small-to-moderate advantage for self-distanced over
self-immersed reflection — with the authors' own overall quality-of-evidence
assessment reporting "uncertainty regarding the benefit of this pragmatic
self-regulatory tactic" and an "urgent need for high-powered, high-quality
experiments".** So: real enough to mention, nowhere near strong enough to build
a mechanic on, and its outcomes are affect and distress rather than reasoning
quality.

**Meichenbaum & Goodman (1971) self-instructional training** is the classic
"teach the inner voice" intervention. Its modern standing is poor: effects
typically did not generalise beyond the trained task and setting, and reviews
conclude it has not demonstrated an effect on the self-regulatory system itself.
Same shape as 42b.

### 42h. Where inner speech actively HURTS, which matters more here

**Alogna et al. (2014), *Perspectives on Psychological Science* 9(5), Registered
Replication Report of Schooler & Engstler-Schooler (1990).** Describing a face
in words before identifying it — verbal overshadowing. The original reported 25%
worse identification. The RRR found **4% worse when the description immediately
followed the event, and 16% worse at a 20-minute delay**: a real effect, much
smaller than reported, and strongly timing-dependent.

**This app contains exactly the tasks that literature warns about**: chess
positions, manipulable diagrams, and the Observer path's perceptual observation
work. A feature that prompted learners to narrate their thinking during visual
work would be pushing on the one place the evidence says verbalising costs
accuracy. Any inner-speech prompt must be excluded from perceptual and
visual-search items.

Note also 41e, already in this ledger: self-explanation prompts asking about a
**concept** significantly outperform **metacognitive** prompts about one's own
planning or performance. Generic "narrate your thinking" prompts are the weaker
class by the app's own best-supported number.

### 42i. What this pass builds, and at what tier

1. **The unreliability of mind-reading, as a named rule** — EVIDENCE
   (Eyal/Steffel/Epley 2018, 25 experiments). Offline-assessable: given a
   situation, which move actually raises your odds of being right? Confidence
   and accuracy separated. Insight/Observer, DEFENCE framing.
2. **Observation versus inference about a person** — extends the Observer
   path's existing core to social material rather than inventing a mechanic.
   The claim is about the learner's own epistemics, not about reading anyone.
3. **Nested belief reasoning** ("A believes that B believes X") — HEURISTIC as
   social skill, EVIDENCE-adjacent as *logic*. This is nested conditional
   reasoning in a social costume and should be labelled as such: it is a
   reasoning form the app already teaches, not a route to understanding real
   people. Second-order false belief is assessable offline as ordinary multiple
   choice.
4. **Asking beats guessing, as a checkable habit** — EVIDENCE for the direction
   (Experiment 25), HEURISTIC that practising it in an app changes anything
   outside one.

### 42j. Refused, with numbers

| Claim | Against it |
|---|---|
| The app can improve theory of mind / mentalizing | Hofmann 2016's g = .75 is on children of mean age 63 months acquiring first-order false belief; no adolescent evidence exists |
| Teaching ToM skills improves social functioning | Fletcher-Watson 2014 (Cochrane, 22 studies, 695 participants): poor quality evidence for maintenance, generalisation, or effect on linked abilities |
| Eye/face reading measures mentalizing | RMET is contested as measuring emotion recognition and emotion vocabulary, and is moderately related to verbal IQ |
| Taking someone's perspective helps you understand them | Eyal, Steffel & Epley 2018, 25 experiments: no reliable accuracy gain, sometimes worse, confidence up |
| Reading fiction improves theory of mind | Kidd & Castano 2013 vs Panero et al. 2016 unresolved; both sides dispute the other's method; outcome measure is RMET |
| Training your inner voice improves self-regulation | Meichenbaum-style self-instruction did not generalise beyond trained tasks; no demonstrated effect on the self-regulatory system |
| Self-talk improves performance (ES = .48) | True for sport: fine motor, novel tasks. Nothing in that meta-analysis is cognitive work |
| Distanced self-talk is an established technique | Murdoch 2023, 25 experiments N = 2,397: small-to-moderate, authors report "uncertainty regarding the benefit" and call for high-quality trials |
| Everyone has an inner voice to train | Nedergaard & Lupyan 2024: inner speech ranges from near-constant to nearly absent; the app cannot tell which learner it has |
| Narrating your thinking is generally good | Alogna 2014 RRR: verbalising costs 4% immediate / 16% delayed on visual identification; 41e: concept prompts beat metacognitive prompts |

---

## 43. Measuring spontaneity, and what game theory is for (2026-08-15)

Asked for as "make the user functionally smarter / better reasoning, game
theory helps with that too". §41a already answers the first half and the answer
has not changed: **no app makes anyone functionally smarter**, and this ledger
will not start claiming otherwise. What this pass did was build the one thing
that makes the *defensible* version checkable, and expand the content where the
named-rule argument is strongest.

### 43a. The gap that was never measured

§41c recorded it and nothing acted on it. Every checkpoint in the bank
announces its own topic simply by existing inside that topic's practice, so a
correct answer shows the method can be RUN once selected and says nothing about
whether it would be selected. Barnett & Ceci's "memory demands" dimension is
exactly that distinction, and §21 had mapped it onto answer format, which is
really the modality dimension.

Gick & Holyoak size it: roughly **30% solve after reading a structurally
identical story, 75-80% once told to use it**. About two thirds of people who
already hold the answer fail to retrieve it unprompted. Detterman, quoted in
Barnett & Ceci: *"Telling subjects to use a principle is not transfer. It is
following instructions."*

**Built:** `sp-` templates, `engine/spontaneity.ts`, and a Progress readout that
compares the unprompted rate against the same learner's rate on ORDINARY items
for the same skills — the only comparison that is not confounded by difficulty.
Under five probes it says nothing; without enough ordinary practice on the same
skills it reports the rate and refuses the comparison.

### 43b. Three ways a spontaneity probe stops being one

Each was got wrong first and each is now pinned by a test, because none of them
is visible by reading the item:

1. **The flag was declarative.** `spontaneous: true` marked the templates and
   nothing enforced it — the events advanced the ladder exactly like any other.
   Caught on the production build, where the feedback banner read "that is the
   evidence that advances skills" directly above an explanation saying the
   opposite. Now excluded during REPLAY by id prefix in `mastery.ts`, the same
   mechanism PFL probes use, so the guarantee does not depend on who wrote the
   event. An audit pins prefix and flag together in both directions.
2. **Naming the method.** One option said "anchoring" outright. A banned-word
   list now covers the textbook terms and the app's own topic names, with a
   canary asserting the list matches a known string — a previous audit here was
   assembled programmatically, picked up a stray escape, and matched nothing at
   all for weeks.
3. **A predictable null answer.** "Nothing applies" must be correct sometimes
   and not always, and the first version checked that POOLED across templates.
   It passed while the design was broken: one template carried every null
   answer and the other none, so recognising which template you were in gave
   you the answer. Now checked within each template, and both templates draw
   from one mixed pool.

### 43c. Game theory: why these six

The existing file covers best response, dominance, Nash, the prisoner's
dilemma, coordination, repetition, commitment and signalling on 2x2 games.
Added: iterated elimination, backward induction, the winner's curse and adverse
selection, common knowledge, unpredictability, and the commons.

The selection rule was §41a's: a named, abstract rule that can be produced on
surface-different material. Each has a transfer item set outside any payoff
table, and `i-common` deliberately shares its structure with `h-nested` in the
Insight path so the same idea is met in two costumes (§41d — the app itself
becoming the retrieval cue is the risk).

**What is claimed:** these are reasoning forms with clear structure, and the app
can teach and test them. **What is not:** that knowing them makes anyone a
better negotiator or decision-maker in life. No study is offered for that
because none was found, and §41b is blunt that practice does not reliably
transfer to problem-solving.

### 43d. The audit that structure cannot do

A generator that computed dominance with a flipped comparison would emit a
perfectly well-formed item with a wrong key, and every gate in
`contentAudit.test.ts` would pass it — the audit checks that items are
answerable and fair, not that they are *right*.

So `gameTheoryDepth.test.ts` re-derives every key from the RENDERED prompt:
it parses the payoff table or the tree back out of the text the learner sees,
runs the analysis a second time, and checks the marked answer is the one that
analysis picks. A shared bug would have to exist in both directions to survive.

It immediately found two real defects that no structural gate could see: the
3x3 grids were leaving a SECOND dominated row on one seed in four, and a second
dominated column before the elimination step — in both cases two different
answers were defensible and the item claimed one. The grid is now constructed so
exactly one row and one column die, and the column only after the row.

**Generalisable:** any content whose answer is computed rather than looked up
should have a second, independent computation checking it, and that check
should read the rendered output rather than the generator's own variables.

### 43e. A probe nobody meets measures nothing

Built, audited, correct, and very nearly invisible. `sim/probes.sim.ts` plays
four learner shapes forward and counts what actually arrives, and the first run
said: 30 min/day 7 unaided probes in a year, 15 min/day **2**, struggling
learner **0**. `MIN_PROBES` is five, so for half the shapes the readout would
have silently never appeared — indistinguishable, from the outside, from a
feature nobody built.

Cause: both probes were authored at difficulty 4, and being UNPROMPTED is not
the same as being HARD. Difficulty 2 and 3 probes fixed the reachable half.

The struggling learner still meets none, and after measuring it that is correct
rather than a hole: they never reach `x-method` at all in a year — 1,005 minutes
of Meta Lab and none of it there. A probe asks whether a taught rule fires
unprompted; a learner who has not yet acquired the rules has nothing to probe,
and the readout refusing to speak for them is the designed behaviour. The gate
now asserts delivery for learners who are progressing and prints the struggler's
zero anyway, so the exemption stays visible rather than tidied away.

**Generalisable, and the second time this pass:** a feature whose failure mode is
SILENCE needs a delivery measurement, not just a correctness one. Every gate
here was green while the thing never ran.

---

## 44. Behavioural game theory, and the "neuroplasticity" claim (2026-08-15)

Two requests in one message: complete the game-theory curriculum against named
sources, and a screenshot of a search-engine summary asserting that you can
"absolutely increase your functional intelligence by practicing and tackling
tough problems". The second is answered first because it is the one that would
change what the app is allowed to say.

### 44a. The summary is partly right, and wrong where it matters

The claim bundles two things that behave completely differently.

**True, and it is the whole app**: you get better at what you practise, and the
brain changes as you do. Nobody disputes that.

**Not supported**: that this raises general ability. Simons, Boot, Charness,
Gathercole, Chabris, Hambrick & Stine-Morrow (2016), *Psychological Science in
the Public Interest* 17(3), 103-186 — the largest review of the field — found
extensive evidence that training improves performance **on the trained tasks**,
less evidence for closely related tasks, and **little evidence that it improves
distantly related tasks or everyday cognitive performance**. That sits beside
§29a's g = 0.00 far transfer against active controls.

Two specific mechanisms in the summary are shakier than it implies:

- **"Drives neurogenesis: heavy learning grows new brain cells."** Stated as
  settled; it is not. Sorrells et al. (2018), *Nature* 555, found young neurons
  dropping to **undetectable levels in adults aged 18-77**, while Boldrini et
  al. (2018, *Cell Stem Cell*) reported persistent neurogenesis using comparable
  tissue. The field is in open methodological disagreement about whether the
  phenomenon exists in adult humans at all.
- **"Thicker myelin makes thoughts travel faster"** → therefore smarter. Each
  step is plausible and the chain from conduction velocity to general ability is
  not established. A mechanism that could explain a result is not evidence for
  the result.

**Consequence for the app: nothing changes.** The founding brief's refusal to
claim an intelligence gain stands, and §41a's defensible substitute stands with
it. The right reply to a learner who reads that summary is not "you cannot get
better at thinking" — you can — but "you get better at the things you practise,
and the app should be judged on whether those things show up unprompted", which
is exactly what §43's spontaneity probes now measure.

### 44b. The curriculum is now complete against a named standard

Requested sources: Dixit & Nalebuff (*Thinking Strategically*, *The Art of
Strategy*) and Yale's ECON 159 (Ben Polak, Open Yale Courses). ECON 159's
24-lecture sequence was used as the checklist, since it is public and specific:

| ECON 159 | Where it lives now |
|---|---|
| Dominance; never play a dominated strategy | `gameTheory.ts` (part one) |
| Iterative deletion | `i-iterated` |
| Median voter | `i-median` — **added this pass** |
| Best response | part one |
| Nash equilibrium | part one |
| Mixed strategies (tennis, penalties) | `i-mixed` — **added this pass** |
| Evolutionary stability | not built — see below |
| Backward induction | `i-backward` |
| Credible threats, commitment | `i-credible` — **added this pass** |
| Ultimatums and bargaining | `i-fairness` — **added this pass** |
| Subgame perfection | partly, via `i-credible` |
| Wars of attrition | not built |
| Repeated games | part one |
| Asymmetric information, signalling | part one, `i-selection` |
| Auctions and the winner's curse | `i-selection` |

Deliberately not built: **evolutionary stability** and **wars of attrition**.
The first needs a population dynamic the app has no way to render or grade
offline; the second is largely a variant of commitment and would duplicate
`i-credible` without adding a distinct rule. Recorded so a later session does
not treat the gap as an oversight.

From Dixit & Nalebuff the debt is emphasis rather than content: rules a person
can carry — "look ahead and reason back", make a threat impossible to back out
of, mix deliberately — rather than solution concepts they can name. Every
scenario, payoff and phrase is original; the app reproduces nothing from either
book or from the course.

### 44c. Behavioural game theory, and why it belongs

Equilibrium answers "what would two perfectly rational players do", and the
experimental record repeatedly says that is not what happens. A learner who knew
only the theory would get all three of these wrong:

- **The guessing game** (pick a number, closest to two thirds of the average
  wins). The unique equilibrium is 0 and **playing it loses**. Real play
  clusters at 50, 33 and 22 — one, two and three steps of reasoning. A large
  online study of chess players averaged 32.15 with visible spikes at those
  points; in a 1981 French magazine competition with roughly 15,000 entrants,
  two thirds of the average landed at about 9% of the maximum.
- **The ultimatum game.** Theory: offer the minimum, since something beats
  nothing. Practice: offers cluster at 40-50%, and an offer near 20% is refused
  about half the time, more as it falls.
- **Public goods with punishment.** Fehr & Gächter (2000), *American Economic
  Review* 90(4), 980-994: adding a costly punishment option takes cooperation to
  near-complete and holds it, where selfish rationality predicts none.

Trust: Berg, Dickhaut & McCabe (1995) — with a $10 stake tripled in transit, the
average sent was **$5.16** and the average returned **$4.66**, against a
backward-induction prediction of zero in both directions.

**Why this is not a debunking section.** The equilibrium is the correct answer
to a precise question, and the useful skill is knowing which question you are
in. `i-levelk` is the sharpest form: aim one step past the ACTUAL crowd, not one
step past a perfect reasoner, because reasoning to the end overshoots the room.

Boundary held throughout: the ultimatum material is framed as "the offer people
accept", never "the least you can extract", and the punishment items are about
norms a group would agree to in the open. The expected-value item makes the
point without needing goodwill — the greedy offer loses on arithmetic.

### 44d. What the second computation caught this time

`gameTheoryLab.test.ts` re-derives every key from the rendered prompt, as §43d
recommended. It found a defect that no structural gate could:

**The trust item's prompt said the stake was "tripled" while the arithmetic used
whichever multiplier the seed had chosen.** A learner reading carefully would
compute a different answer from the key, on roughly two thirds of variants. The
word and the number are now generated together.

It also verifies the harder claims positively rather than by inspection: that
the mixed-strategy key really does equalise the opponent's two payoffs (checked
by evaluating both), and that the median-voter key really does beat every one of
the other 100 possible proposals head to head (checked by brute force, not by
trusting the sorting).

## 45. The opening week, honest review arithmetic, and the second rescue (2026-08-18)

Engine pass, measured with the day-by-day cold-start sim (new,
`src/sim/coldstart.sim.ts`), the five-year matrix, and unit gates. Everything
here is inspectable in `planner.ts` / `mastery.ts`; nothing new is claimed
about far transfer.

### 45a. The opening breadth sampler — HEURISTIC (structure), measured

The first three days were a maths app: 7-8 maths items in 10 on each of days
one to three at 25 minutes (docs/OPEN.md, 2026-08-12, four failed fixes
recorded). Cause restated: every balancing mechanism keys off debt, debt needs
~60 minutes of history, and before that the core block goes wholly to the
highest scorer — mathematics, whose gateway role and course tilt are correct
and should not be weakened.

The structural fix those failures pointed at: while the balance system is
blind (first ~6 sessions, under an hour of history, never on short sessions or
against a focus request), the two next-best ACADEMIC buckets each get one
"first look" item, paid out of the core budget in minutes. The core keeps its
winner and its difficulty ramp; the session keeps its length.

Measured (fresh 25m learner, with and without a course):

- days 1-3 maths: 7-8/10 → 5-6/10 (still leading, no longer the whole day)
- areas per day, days 1-3: 2-3 → 4
- areas met in week one: 8/10 → 9/10
- session size days 1-3: 10-11 items (no under-fill)
- week-one maths difficulty mean 2.4-2.5, and difficultyFloor's
  strong-placement ordering still holds (see 45c).

No study fixes "two samplers for six sessions"; the constants are product
judgment. What is evidence-adjacent is only the refusal to hand a first
session entirely to one subject the product promised was one of ten.

### 45b. First meetings do not get the far end of the pool — EVIDENCE-aligned direction

`targetDifficulty` already ruled that the dial may lower a first meeting and
never raise one. The POOL could still raise it: thin skills carry 4-5★ search
items beside their 2★ introductions, and the budget picker serves essentially
the whole pool when it is small. Measured: a cold learner's first session
carried a 5★ digit-placement optimisation against an aim of 1.5. While a
skill is below `guided`, items more than 2★ above the aim now step aside
unless almost nothing else exists. Direction from Alfieri et al. 2011
(unassisted discovery d = −0.38, §14); the "+2 stars" line is HEURISTIC.

### 45c. The exit ticket aims at today's level — correction of a silent constant

The exit was hardcoded to difficulty 2 and a flat 2-minute claim. Both were
invisible while the core was large; the sampler surfaced them. It now aims at
the session's own target for the core skill, capped at 3★ so a session never
ends on the hardest thing it contains, restricted to short single items
(≤3 minutes — a 14-minute case file once ranked "nearest" and a 20-minute ask
planned 38), and reports its real minutes. Consequence stated plainly: plan
estimates read ~1 minute higher because they stopped under-reporting, and the
engine gate now checks against the app's own promise (ask + SESSION_GRACE_MIN)
instead of a magic number.

### 45d. The second academic rescue — HEURISTIC pair, checked by the five-year gate

Physics sat at 3.8-4.9% against 7% on multi-session and goal-tilted shapes: a
relative debt of 0.30-0.46, parked just under `STARVED_DEBT`'s 0.4 bar exactly
as Human Insight once parked under 0.5. Lowering the main bar thrashes
(measured 2026-08-12). The new rescue fires on a smaller relative shortfall
(≥0.25) only when it is also real in MINUTES (≥24 owed in the 28-day window —
about two core blocks). The absolute-minutes condition self-selects the
high-volume shapes that were measured short and cannot be tripped by a
ten-minute learner's drift; serving one block does not clear 24 minutes, so
consecutive rescues are catch-up rather than thrash.

Measured across the matrix: physics worst case 3.8% → 4.8%, mean 6.3%.
The remaining shortfall concentrates where goal tilts deliberately pull
minutes elsewhere, and in the persistent struggler, whose frontier logic is
working as intended.

### 45e. Interleaving now interleaves in PLAY ORDER — closing a gap in §3's claim

The core block's "interleaved" pool was emitted in rank order, which tends to
run all of skill A then all of skill B — blocked practice wearing the label.
The evidence (§3, Rohrer lines) is about the schedule the learner experiences.
Picks are now round-robined by skill (greedy, stable within a skill so each
skill's difficulty ramp survives). No new claim; the implementation now
matches the ledger's existing one.

### 45f. Review arithmetic became honest in both directions — form EVIDENCE-aligned, constants HEURISTIC

Two defects in `mastery.ts`, both directional lies:

1. **The survived gap was thrown away.** A review answered 45 days late and
   still correct was rescheduled from its ladder step as if the memory had
   only been shown to survive a week. The demonstrated gap is now the FLOOR
   for the next interval's base (then the personal stability factor applies),
   capped at `MAX_REVIEW_DAYS = 120` — the same ceiling the old arithmetic
   already implied (60 × factor 2). Cepeda et al.'s optimal-gap curves and the
   personalised-spacing literature support intervals that grow with
   demonstrated retention; no study fixes this exact rule, so: form
   evidence-aligned, arithmetic HEURISTIC.

2. **Massed successes bought spacing credit.** Every post-independence unaided
   success fed the stability factor, so five correct answers in one core block
   stretched the schedule as far as five successes spread over weeks. Only
   retrievals ≥48h after the previous success count now (the same bar the
   retention rung uses, so "spaced" means one thing in the file), at both the
   skill and the family level — which also closes a documented divergence
   where the family ladder counted its very first success.

   A consequence worth recording: a family's first success now schedules its
   review at the ladder's stated 1.0 days rather than an accidental 1.15. One
   checkpoint test rode on that 3.6-hour artifact and its probe time was
   corrected to match its own comment ("checked immediately").

   NOT built, deliberately: per-item ease factors, FSRS-style memory models,
   or a retention-target parameter. They would be tuning an instrument this
   app cannot validate offline; the two fixes above remove measured lies
   without adding a model. §40b's "transfer items need shorter intervals"
   remains recorded and unbuilt.

### 45g. The dispute quarantine now reaches every consumer — completing a stated invariant

The rule (types.ts): a disputed attempt informs no derived number. The planner
obeyed it; the coach, the Error Clinic and the weekly objective read the raw
log, so a contested confident miss kept driving "weak area" beliefs,
calibration, mal-rule profiles and repair plans while the evidence engine had
already set it aside. All three now read through `evidenceEvents`. Regression
tests with controls (the undisputed twin still fires) in `dispute.test.ts`.

### 45h. Two five-year shapes pinned as razor-edge — a gate lesson

"Reaches everything by day 1825" is not a stable property of shapes whose
game-theory tail becomes ready only in the final months. Measured across four
planner configurations: the same skill arrived on day ~1400 in one and NEVER
in the next, while total ownership stayed at 157-164 of 165 throughout. The
harness's own documented noise (±1 skill of coverage) decides which side of
the horizon the last arrival lands on. '30m sporadic' and 'plateaus early'
join the pinned list with that reasoning written beside them; the hard total
ceiling moves 53 → 57 (the measured worst), and any NEW shape stranding still
fails.
