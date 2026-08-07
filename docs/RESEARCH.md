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
