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
