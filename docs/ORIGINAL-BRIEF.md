# Axiom Lab — the original V1 master brief

This is the founding specification, preserved verbatim in substance so that it
survives across sessions and authors. `CLAUDE.md` summarises the parts that
must not drift; this file is the source they come from.

It is kept because the brief has repeatedly turned out to be right where a
single session's instinct was not — particularly on what NOT to build.

---

## Roles the brief assigns

Principal product designer · senior React/TypeScript/PWA engineer · learning
scientist · mathematics, physics, coding and reasoning curriculum architect ·
adaptive-learning systems designer · privacy and youth-safety engineer ·
accessibility specialist · meticulous QA lead.

The instruction was explicit: build a complete, working, highly polished V1 —
"not a mockup, product proposal, static dashboard, or partial scaffold. Plan
carefully, then implement the product, run it, test it, inspect it visually,
fix its problems, and continue until it is genuinely usable."

## 1. Primary mission

> "Help the user acquire valuable knowledge and cognitive skills, retain them,
> and transfer them to unfamiliar problems as quickly as possible."

**North-star metric:** delayed, independent, transferable learning gained per
focused minute.

**Optimize for:** durable knowledge · independent problem-solving · deep
understanding · transfer to unfamiliar situations · accurate self-judgment ·
reduced dependence on hints · efficient use of study time · better real school
performance · ethical, prosocial strategic and social intelligence.

**Do NOT optimize for:** daily active usage · screen time · revenue · user
acquisition · subscription conversion · streak preservation · advertising ·
virality · social comparison · artificial engagement · making the user feel
productive without learning · a fictional or scientifically unsupported "IQ
increase".

Built for one person. No classroom administration, teacher dashboards, social
features, enterprise architecture, billing, or multi-user growth systems.

## 2. User context (settled — do not re-ask)

Teenage, United States, roughly one year above 7th grade at the start (~8th
grade). Architecture supports middle school upward; seed curriculum excellent
around the user's actual level while the data model supports later high-school
and advanced packs.

Desired improvements: school grades, mathematics, logic, problem-solving,
memory, learning speed, focus, strategic planning, observation, social
intelligence, communication, creativity, chess, general scientific and
computational reasoning.

Highest-value subjects: mathematics, physics, coding/CS, scientific reasoning,
quantitative and information literacy. History is not a V1 priority.

Mobile-first and installable. Effectively zero recurring maintenance cost. Core
functionality must not require a paid API, hosted backend, subscription,
account, or cloud database. "V1 must feel like a mature V10 product." Clarity
and efficiency matter more than flashy visual complexity.

## 3. Reference products

Structural inspiration from the Planche Lab repo (central daily recommendation,
adaptive coach, visible progression road, evidence-based unlocks, guided
sessions, session recovery, local-first data, transparent explanations,
progress analytics, sample-data mode, export/import, installable offline PWA,
polished phone experience).

From **Khan Academy**: course → unit → skill hierarchy, prerequisites, guided
instruction then practice, unit tests and course challenges, visible mastery
evidence, corrective recommendations, review of older material.

From **AoPS Alcumus**: high-quality non-routine problems, topic-specific
learner estimates, problems near the frontier, adjustable difficulty, mixture
of current work and older review, deep worked solutions, "coach chooses" /
"focus topic" / "mixed review" modes, challenge rewarding careful thought over
worksheet speed.

> "Do not copy their copyrighted questions, writing, artwork, branding,
> layouts, or scoring systems. Create original content and interaction design."

## 4. Research-first requirement

Research the learning science using primary research, systematic reviews,
meta-analyses, government practice guides and national academies BEFORE
finalising the instructional system. Maintain a research ledger recording per
claim: claim, source, URL/DOI, evidence type, strength and limitations, which
product behavior it supports, whether it is evidence-backed or only a product
hypothesis, and date accessed.

> "Never turn a weak or mixed finding into confident marketing copy."

Neuromyths explicitly rejected: 10% of the brain · left/right-brained learner
types · learning-style matching · microexpression lie detection · brain games
raising general intelligence · chess automatically improving academics · speed
equalling intelligence · one quiz proving permanent mastery · a single app IQ
number · difficulty being valuable merely because it is unpleasant.

## 5. Adaptive allocation

Balance actual focused minutes over a rolling 28-day window. Default: 30% math,
8% physics, 7% coding, 5% scientific/quantitative reasoning (50% Academic
Core), 10% Observer, 10% Investigator, 10% Strategist, 10% Puzzle Lab & chess,
5% Human Insight, 5% Meta Lab.

**Every activity has exactly ONE primary allocation bucket**, even with
secondary tags, so nothing is counted twice. The coach may deviate temporarily
for deadlines, prerequisite gaps, explicit focus, over/under-practice, review
pressure or fatigue — but must show the change openly, explain it, display
actual-versus-target, and drift back. Urgent work must never permanently erase
other areas. Track active task time, not navigation.

## 6. The four archetypes (original constructions)

Fictional characters are internal design inspiration ONLY — no names,
likenesses, art, quotes, logos, voice, storylines, or claims that the user is
becoming a character.

**Observer** (inspired by Patrick Jane) — observation vs inference, relevant
detail, recall, noticing change and contradiction, active listening, accurate
paraphrase, high-information questions, multiple explanations, bias
recognition, memory techniques, calibration. *Never*: covert extraction,
manipulating strangers, mind-reading, profiling, diagnosing, lie-detection
"tells", surveillance, practising on people without consent.

**Investigator** (inspired by L) — formal and informal logic, Bayesian
updating, base rates, competing hypotheses, falsification, evidence
reliability, information value, proof and counterexample, game theory,
forecasting, calibrated uncertainty, knowing when evidence is insufficient.
Fictional/synthetic cases only; never real people as suspects.

**Strategist** (inspired by Light Yagami — safe fragments only) — goal
decomposition, backward planning, constraints, expected value, opportunity
cost, decision trees, second-order effects, estimation, pre-mortems,
contingency, plan repair, self-regulation, cooperative strategy. *Never*:
domination, concealed agendas, deception, vigilantism, coercion,
impersonation, exploiting trust, surveillance, avoiding accountability.
"Reward achieving goals while preserving honesty, consent, agency, and mutual
benefit."

**Human Insight / Guardian** (inspired by Johan Liebert — direction reversed
from manipulation to protection) — emotional vocabulary, composure,
perspective-taking under uncertainty, manipulation recognition, boundaries,
consent-based negotiation, rhetorical analysis, de-escalation, help-seeking,
protecting oneself and vulnerable people, recognising false urgency. *Never*
operational instruction in gaslighting, grooming, blackmail, social
engineering, love-bombing, isolation, humiliation, seduction tactics, coercive
persuasion, vulnerability profiling, or destabilising someone. Danger-adjacent
scenarios break the game frame and point to a trusted person or emergency
resource.

**Meta Lab** — learning how to learn, calibration, epistemic humility, source
literacy, clear explanation, argument comprehension, creative synthesis, focus
planning, error diagnosis, better questions, knowledge compression, choosing
the right representation.

## 7. Learning engine (non-negotiable)

Retrieval first (a genuine attempt before any answer) · spacing on an
explainable ladder (~1, 3, 7, 14, 30, 60 days, adapted not sacred) ·
interleaving once initial understanding exists · worked-example fading through
six rungs · corrective feedback that identifies the first meaningful error and
**requires a corrected attempt**, then re-tests the idea later · deliberate
practice on narrow high-leverage weaknesses · explicit transfer bridging ·
metacognitive calibration · cognitive-load discipline (one main task per
screen) · speed only after accuracy, explanation, independence, retention and
transfer.

## 8. Mastery and evidence model

No single percentage. States: Unseen · Introduced · Guided · Independent ·
Retained · Transferred · Needs Review. Separate dimensions for exposure,
guided success, independent success, delayed retention, novel transfer,
calibration, hint dependence, misconceptions, item diversity.

V1 heuristics (labelled as heuristics): Independent = 2 successful first
attempts on distinct item forms; Retained = independent delayed retrieval ≥48h
later; Transferred = success on a novel-looking or mixed-context task; a
high-confidence misconception blocks promotion until repaired; one good score
never establishes permanent mastery. Previous achievement stays visible when a
skill needs review.

**Append-only evidence events; derive current state by replaying them.**
Editing or deleting history must recalculate progress honestly.

## 9–12. Selection, architecture, onboarding, session player

A simple inspectable planner — never an opaque model pretending to know the
user before evidence exists — scoring review urgency, prerequisite leverage,
weakness, allocation debt, deadline relevance, time fit, energy fit, frontier
difficulty, novelty, transfer need, calibration need and repetition penalty,
and able to explain every selection in plain language.

Five destinations: Today · Path · Coach · Practice · Progress, with Settings
behind a top-right control. Onboarding is short and purposeful, followed by a
12–18 minute adaptive placement that **routes but never proves mastery**, and
which never outputs IQ, personality diagnosis, predicted potential, or a fake
completion date.

Sessions default to ~25 minutes: arrival check → retrieval warm-up → academic
core → rotating intelligence block → exit ticket → deliberate end. Save after
every answer and on visibility change; resume exactly; never refresh for an
update mid-session; work offline. Hint ladder of six rungs, and after a full
solution present a fresh isomorphic problem. **Hinted work never earns
independent evidence.**

## 13–18. Content

Academic core across mathematics (integers through non-routine problem
solving), introductory quantitative physics, coding and computational
reasoning, and scientific/quantitative reasoning. Homework support is "a coach,
not an answer vending machine" and must not facilitate cheating on an active
assessment. Puzzle Lab covers chess tactics, a genuine touch-friendly spatial
puzzle, and programmatically validated logic puzzles — with transfer bridges,
and without claiming puzzles raise general intelligence.

Cross-domain features: Error Clinic (grouped by CAUSE, not topic) · Weekly Case
File · Forecast Ledger · Model of Me · Learning Compression · Focus Protocol.

Content correctness is a release blocker. Every item carries id, version,
skills, prerequisites, difficulty, prompt, answer or rubric, deterministic
validator where possible, hint ladder, worked explanation, common-error
explanations, transfer target, provenance, evidence tier and safety tags. An
automated content audit must load every seed item and verify all of it.

V1 targets: 40–60 academic skill nodes · 100–200 validated items or templates ·
8–12 templates per archetype lab · ≥20 validated chess tactics · a working
spatial puzzle engine · a validated logic-puzzle engine · ≥3 case files · a
sample profile. "Do not replace missing content with fake buttons, 'coming
soon' cards, or nonfunctional menus."

## 19–23. Architecture, privacy, anti-addiction, design, accessibility

No required backend, account, cloud database, paid API, telemetry, ads,
trackers, subscription, server job, or client secrets. IndexedDB primary,
localStorage for tiny preferences, versioned migrations, append-only evidence,
derived progress, session drafts, redundant local backup, export/import, full
reset, `navigator.storage.persist()`.

Maximum privacy by default: age band not birth date, optional name, no
contacts, location, ad identifiers, hidden analytics, social graph, or covert
camera/microphone. Under-13 defaults to entirely local.

**Anti-addiction is a hard constraint**: no infinite feeds, streak loss, hearts
or energy, loot boxes, random rewards, countdown claims, FOMO prompts, public
leaderboards, intelligence rankings, social comparison, autoplay, time-spent
badges, punitive notifications or fake urgency. Allowed: meaningful competency
milestones, mastery evidence, unit completion, personal bests tied to real
ability, a non-punitive weekly rhythm, optional reminders.

Visual direction: "quiet intelligence laboratory" — clear modern academic
interface with restrained detective-notebook influence, strong hierarchy, calm
and serious, light and dark themes, minimal purposeful motion. Mobile-first
from ~390×844, support ~320px, ≥44px touch targets, verify ~1440px desktop.
Accessibility to a strong WCAG-oriented standard including keyboard
alternatives to drag-and-drop and no speed penalty for accommodations.

## 27. Autonomous improvement mandate

> "Do not merely implement the ideas listed above. Before coding, privately
> generate at least ten additional product improvements that neither the user
> nor this prompt explicitly supplied."

Judged against expected improvement to delayed learning per minute, transfer
value, correctness risk, privacy and youth-safety impact, cognitive-load cost,
implementation and maintenance complexity, and fit with a personal offline
product. "Do not add features merely because they are impressive."

Preferred inventions: make misconceptions easier to diagnose · improve transfer
· make the coach more honest · reduce wasted practice · reveal uncertainty ·
improve session recovery · improve accessibility · **help the user become
independent of the app** · make content correctness auditable.

## 26. Definition of done

The app runs; production build passes; tests pass; installable as a PWA; core
works offline; onboarding, placement, daily plan, complete session and resume
all work; wrong answers produce correction and re-attempts; hints tracked
separately from independent success; reviews come due correctly; skills advance
through evidence states; the Coach explains its decisions; Progress
distinguishes independent, retained and transferred; chess validates legal
moves; the spatial puzzle works on touch; data exports, imports and deletes; no
paid service; no network call by default; no dead buttons; no placeholder
experiences; no mobile overflows; no console errors; educational claims sourced
or labelled heuristics; never claims to prove or maximise an IQ score;
manipulation-related safety boundaries enforced; and the result behaves like a
mature product rather than a hackathon prototype.
