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
- **Source**: Gollwitzer & Sheeran (2006), *Implementation intentions and goal
  achievement: a meta-analysis of effects and processes*, Advances in
  Experimental Social Psychology 38 — d = 0.65 across 94 independent tests and
  over 8,000 participants.
  https://www.semanticscholar.org/paper/c4deb3507fe725ce6363c1735f1ba83bab20d665
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

One real oddity in that area, not yet changed: `pflProbes` forces
`prereqsOwned = false` for any probe whose skill has no prerequisites, so
`pfl-modular` (attached to `m-integers`, which has none) is permanently counted
on the "without prerequisites" side. Vacuously it belongs on neither. One probe
in nine is mis-assigned; excluding it from the split rather than defaulting it
to false is the honest shape. Open work.

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
