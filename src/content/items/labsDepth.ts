/**
 * Depth for everything that is not math: the four Paths, Meta Lab, scientific
 * reasoning, physics, and coding — two new families each, at the harder end of
 * each skill's range.
 *
 * Path content law holds: Observer/Insight teach DEFENSE and recognition,
 * never operational manipulation; Strategist rewards wins that survive
 * daylight. All original; every answer computed.
 */
import { rint } from '../../engine/rng'
import type { ErrorTag, ItemTemplate } from '../../domain/types'
import { cycle, mcq, mcqNoted, numeric, tpl } from '../lib'

// ---------------------------------------------------------------- observer

const sourceMemory = tpl(
  { id: 'obs-source-memory', name: 'Who actually said it?', skillIds: ['o-recall'], bucket: 'observer', difficulty: 4, variants: 4, minutes: 2.5, calibration: true },
  (rng, seed) => {
    const c = cycle(seed, [
      {
        scene: 'Three witnesses describe a bike accident. RIVER: "The van was turning left, signal on." JUNO: "The cyclist had a green light." PARK: "The van was going fast — too fast for that corner."',
        q: 'Who claimed the cyclist had the right of way?',
        correct: 'Juno — the green-light claim implies right of way',
        bads: [
          ['River — the signal comment implies the van had priority', 'River described the van\'s signal, said nothing about the cyclist'],
          ['Park — "too fast" implies the van was at fault', 'fault and right-of-way are different claims; Park spoke only to speed'],
          ['All three said so in different words', 'only one witness mentioned the light at all'],
        ] as [string, string, ErrorTag?][],
      },
      {
        scene: 'Three group-chat messages about a project. ANA: "The deadline moved to Thursday." BEN: "The rubric now counts sources double." CARA: "Ms. Ortiz said slides are optional."',
        q: 'Who reported a change to how the work is GRADED?',
        correct: 'Ben — double-counting sources is a grading change',
        bads: [
          ['Ana — a deadline is part of the grade', 'a deadline changes when, not how points are awarded', 'misread'],
          ['Cara — optional slides change the requirements', 'requirements changed, but nothing about scoring weights', 'misread'],
          ['Ana and Cara both did', 'neither mentioned scoring at all', 'misread'],
        ] as [string, string, ErrorTag?][],
      },
      {
        scene: 'Overheard while leaving practice. COACH: "Scrimmage moved to the east field." TEAM CAPTAIN: "Bring both jerseys tomorrow." A PARENT: "The east field floods when it rains."',
        q: 'Who gave an instruction (not information)?',
        correct: 'The captain — "bring both jerseys" asks for an action',
        bads: [
          ['The coach — moving the scrimmage is an order', 'the coach reported a fact about location; no action was requested of the listener'],
          ['The parent — the flood comment is a warning to act', 'it describes the field; any action is inferred, not asked'],
          ['All three gave instructions', 'only one sentence asks the listener to do anything'],
        ] as [string, string, ErrorTag?][],
      },
      {
        scene: 'Lab debrief. DEV: "Trial 2 used the warmer water." MIRA: "I logged trial 3 twice by mistake." SOL: "The thermometer was reading high all day."',
        q: 'Who reported a problem with the RECORDS (not the equipment or setup)?',
        correct: 'Mira — a duplicated log entry is a records problem',
        bads: [
          ['Sol — a high-reading thermometer corrupts the records', 'the instrument was faulty; the records faithfully recorded its bad readings'],
          ['Dev — warmer water invalidates the data', 'that is a setup difference between trials, not a record-keeping error'],
          ['Sol and Dev both did', 'neither described the log itself'],
        ] as [string, string, ErrorTag?][],
      },
    ] as const)
    const { answer, distractorNotes, distractorTags } = mcqNoted(rng, c.correct, c.bads.map((b) => [...b] as [string, string, ErrorTag?]))
    return {
      title: 'Source memory',
      prompt: `${c.scene}\n\n${c.q}`,
      answer,
      distractorNotes,
      distractorTags,
      hints: [
        'Re-read each speaker\'s EXACT words — the question is who said what, not what is plausible.',
        'Reject any option that attributes an inference to a speaker who stated only a fact.',
      ],
      explanation: `**${c.correct}.** Misattributing WHO said something is one of the most common and confident memory errors — the content survives while the source label swaps. The defense is mechanical: bind each claim to its speaker at encoding time, because plausibility will happily forge the signature later.`,
    }
  },
)

const paraphraseFidelity = tpl(
  { id: 'obs-paraphrase', name: 'Restate without smuggling', skillIds: ['o-listen'], bucket: 'observer', difficulty: 4, variants: 4, minutes: 2.5, calibration: true },
  (rng, seed) => {
    const c = cycle(seed, [
      {
        said: '"I can make the study session, but only after 4, and I\'d rather we focus on the lab report."',
        correct: 'They can come after 4 and prefer working on the lab report',
        bads: [
          ['They will arrive at 4 to work on the lab report', '"after 4" became "at 4", and a preference became a plan'],
          ['They do not really want to study together', 'invents a reluctance the speaker never voiced'],
          ['They can only stay briefly after 4', 'duration was never mentioned'],
        ] as [string, string, ErrorTag?][],
      },
      {
        said: '"The tryout results are not final — coach said the roster gets one more look on Monday."',
        correct: 'The roster is provisional until a review on Monday',
        bads: [
          ['Someone will be cut on Monday', 'a review does not promise cuts', 'inference'],
          ['The tryouts were unfair, so there is a re-do', 'no complaint was made; a scheduled review is not a re-do', 'inference'],
          ['The roster is final unless someone appeals', 'reverses the stated status — it is NOT final by default', 'misread'],
        ] as [string, string, ErrorTag?][],
      },
      {
        said: '"Grandpa\'s okay — the doctor is keeping him overnight just to watch the medication change."',
        correct: 'He is staying overnight for observation after a medication change',
        bads: [
          ['He got worse, so they kept him', 'adds a deterioration the speaker denied'],
          ['The medication caused a bad reaction', 'a change being watched is not a reaction that happened'],
          ['He is fine and coming home tonight', 'drops the overnight stay entirely'],
        ] as [string, string, ErrorTag?][],
      },
      {
        said: '"I didn\'t lose your charger — I left it in the band room, and the room was locked when I went back."',
        correct: 'They know where the charger is but could not retrieve it yet',
        bads: [
          ['They lost the charger and are making excuses', 'assumes bad faith the words do not contain'],
          ['They will bring the charger tomorrow', 'no promise was made'],
          ['The charger is gone from the band room', 'the speaker claims it is IN the band room'],
        ] as [string, string, ErrorTag?][],
      },
    ] as const)
    const { answer, distractorNotes, distractorTags } = mcqNoted(rng, c.correct, c.bads.map((b) => [...b] as [string, string, ErrorTag?]))
    return {
      title: 'Faithful paraphrase',
      prompt: `Someone says: ${c.said}\n\nWhich restatement adds nothing and drops nothing?`,
      answer,
      distractorNotes,
      distractorTags,
      hints: [
        'Check each option twice: once for smuggled additions, once for dropped qualifiers.',
        'Words like "only", "but", and "yet" carry load — a paraphrase that loses them changes the claim.',
      ],
      explanation: `**${c.correct}.** A faithful paraphrase is a compression, not an interpretation: same claims, fewer words. The failure modes are exactly the distractors — upgrading preferences to plans, importing motives, and dropping qualifiers — and they are how relayed messages drift into arguments nobody started.`,
    }
  },
)

// ---------------------------------------------------------------- investigator

const argumentForms = tpl(
  { id: 'inv-argument-form', name: 'Valid shape or broken shape?', skillIds: ['i-logic'], bucket: 'investigator', difficulty: 4, variants: 4, minutes: 2.5, calibration: true },
  (rng, seed) => {
    const c = cycle(seed, [
      { arg: 'If the trail is muddy, practice moves indoors. Practice moved indoors. So the trail was muddy.', verdict: 'Invalid — affirming the consequent', why: 'indoor practice could have other causes; "if A then B" plus B proves nothing about A' },
      { arg: 'If the seal is broken, the kit fails inspection. The kit passed inspection. So the seal was not broken.', verdict: 'Valid — denying the consequent', why: 'passing rules out every condition that would have forced a failure; this is the contrapositive at work' },
      { arg: 'If the code compiles, the tests can run. The code did not compile. So the tests could not run.', verdict: 'Invalid — denying the antecedent', why: '"if A then B" says nothing about what happens without A; the tests might run from a cached build' },
      { arg: 'If the bridge is open, the shortcut saves time. The bridge is open. So the shortcut saves time.', verdict: 'Valid — affirming the antecedent', why: 'this is the one direct move the conditional licenses: A holds, so B follows' },
    ] as const)
    const all = [
      'Invalid — affirming the consequent',
      'Valid — denying the consequent',
      'Invalid — denying the antecedent',
      'Valid — affirming the antecedent',
    ]
    return {
      title: 'Judge the argument',
      prompt: `${c.arg}\n\nWhat is the verdict on this argument's FORM?`,
      answer: mcq(rng, c.verdict, all.filter((x) => x !== c.verdict)),
      hints: [
        'Name the parts: which sentence is the IF-part (antecedent), which the THEN-part (consequent)?',
        'Only two shapes are valid: affirm the antecedent, or deny the consequent.',
      ],
      explanation: `**${c.verdict}** — ${c.why}. The four shapes are worth owning as a checklist, because the two invalid ones FEEL exactly like the two valid ones. Validity is about shape, not plausibility: a valid argument can have false content, and a seductive argument can have a broken spine.`,
    }
  },
)

const bayesOdds = tpl(
  { id: 'inv-bayes-strength', name: 'How strong is this clue?', skillIds: ['i-bayes'], bucket: 'investigator', difficulty: 5, variants: 24, minutes: 3, calibration: true },
  (_rng, seed) => {
    const c = cycle(seed, [
      ['a rare stamp is genuine', 'passes the watermark check', 'genuine stamps', 'forgeries'],
      ['a package was mis-scanned', 'shows a corner dent', 'mis-scanned packages', 'normal packages'],
      ['a plant has the fungus', 'shows leaf spots', 'infected plants', 'healthy plants'],
    ] as const)
    const pHitD = cycle(Math.floor(seed / 3), [80, 90] as const)
    const pHitH = cycle(Math.floor(seed / 6), [10, 20, 40] as const)
    const lr = pHitD / pHitH
    return {
      title: 'Likelihood ratio',
      prompt: `Suppose ${pHitD}% of ${c[2]} ${c[1]}, but so do ${pHitH}% of ${c[3]}. Observing it, how many times more likely does the observation make "${c[0]}" versus the alternative? (One number — the strength of the clue.)`,
      answer: numeric(lr),
      hints: [
        'A clue\'s strength is a RATIO: how often it appears when true vs when false.',
        `${pHitD}% ÷ ${pHitH}%.`,
        `Worked path: **${lr}**.`,
      ],
      explanation: `The clue multiplies the odds by ${pHitD}/${pHitH} = **${lr}**. That ratio IS the evidence — a clue seen ${pHitD}% of the time when true and ${pHitH}% when false is ${lr}× evidence, no more. Two habits follow: a clue common under BOTH explanations (${lr === 2 ? 'like this modest one' : 'unlike this strong one'}) barely moves anything, and no single clue settles a question with a low base rate — it only scales whatever odds you started with.`,
    }
  },
)

// ---------------------------------------------------------------- strategist

const criticalPath = tpl(
  { id: 'strat-critical-path', name: 'What actually sets the finish?', skillIds: ['st-decomp'], bucket: 'strategist', difficulty: 4, variants: 24, minutes: 3 },
  (rng, seed) => {
    const c = cycle(seed, [
      ['bake the layers', 'make the frosting', 'assemble and decorate', 'a birthday cake'],
      ['print the posters', 'book the room', 'set up the room', 'a club fair booth'],
      ['record the vocals', 'mix the backing track', 'master the final song', 'a song release'],
      ['sand the frame', 'cut the shelves', 'assemble the bookcase', 'a bookcase build'],
    ] as const)
    const a = rint(rng, 3, 6) * 10
    const b = rint(rng, 2, 5) * 10
    const join = rint(rng, 2, 4) * 10
    const critical = Math.max(a, b) + join
    return {
      title: 'The critical path',
      prompt: `For ${c[3]}: "${c[0]}" takes **${a} min** and "${c[1]}" takes **${b} min** — they can happen AT THE SAME TIME. "${c[2]}" takes **${join} min** and needs both finished first. What is the shortest total time, in minutes?`,
      answer: numeric(critical),
      hints: [
        'Parallel tasks cost the LONGER of the two, not the sum.',
        `max(${a}, ${b}) = ${Math.max(a, b)}, then + ${join}.`,
        `Worked path: **${critical}**.`,
      ],
      explanation: `The parallel pair finishes when the SLOWER one does — ${Math.max(a, b)} min — then the final step adds ${join}: **${critical} min**. Adding all three (${a + b + join}) prices the plan as if nothing overlapped. The chain that sets the finish (${a >= b ? c[0] : c[1]} → ${c[2]}) is the critical path: speeding up anything OFF it buys exactly nothing, which is the single most useful fact in planning.`,
    }
  },
)

const evThreshold = tpl(
  { id: 'strat-ev-threshold', name: 'When the average is the wrong boss', skillIds: ['st-ev'], bucket: 'strategist', difficulty: 5, variants: 24, minutes: 3, calibration: true },
  (rng, seed) => {
    const c = cycle(seed, [
      ['reach the airport by the cutoff', 'the highway (variable traffic)', 'the back road (slower, steady)'],
      ['submit before the portal closes', 'the fast flaky uploader', 'the slow reliable uploader'],
      ['make the last ferry', 'the shortcut trail (weather-dependent)', 'the main road (longer, certain)'],
    ] as const)
    const safe = rint(rng, 50, 70)
    const fastGood = safe - rint(rng, 15, 25)
    const fastBad = safe + rint(rng, 20, 40)
    const cutoff = safe + 5
    const evFast = (fastGood + fastBad) / 2
    const { answer, distractorNotes, distractorTags } = mcqNoted(
      rng,
      `${c[2]} — it is the only option that makes the cutoff for certain`,
      [
        [`${c[1]} — its average time (${evFast} min) is better`, `the average is meaningless here: miss the cutoff and the whole trip fails; a coin-flip ${fastBad}-minute outcome blows it`, 'strategy'],
        [`${c[1]} — its best case (${fastGood} min) is the fastest on offer`, 'best-case planning bets the outcome on luck', 'strategy'],
        [`Either — they are close enough`, `one arrives by ${safe} min for certain; the other misses the ${cutoff}-minute cutoff half the time`],
      ],
    )
    return {
      title: 'Threshold beats average',
      prompt: `You must ${c[0]} — hard cutoff **${cutoff} min** from now. ${c[1]}: 50/50 between **${fastGood}** and **${fastBad}** min. ${c[2]}: **${safe} min** for certain. Which do you take?`,
      answer,
      distractorNotes,
      distractorTags,
      hints: [
        'When a threshold exists, ask of each option: what is the chance of ENOUGH?',
        `The certain route lands at ${safe} < ${cutoff}. The gamble misses whenever it rolls ${fastBad}.`,
      ],
      explanation: `**${c[2]}** — ${safe} min beats the ${cutoff}-min cutoff every time, while the gamble fails half the time even though its AVERAGE (${evFast} min) looks better. Expected value ranks repeated choices; a one-shot with a cliff is ranked by P(enough). Knowing which regime you are in — repeatable vs one-shot-with-threshold — is the strategist's actual skill, and it is a win that survives daylight: nothing here needed luck or fine print.`,
    }
  },
)

// ---------------------------------------------------------------- insight (defense only)

const pressureStack = tpl(
  { id: 'ins-pressure-stack', name: 'Count the pressure tactics', skillIds: ['h-influence'], bucket: 'insight', difficulty: 4, variants: 4, minutes: 2.5, calibration: true },
  (_rng, seed) => {
    const c = cycle(seed, [
      {
        msg: '"Only 2 left at this price! 14 people are viewing this right now. Sale ends in 09:58… Add a protection plan? 87% of buyers do."',
        n: 4,
        list: 'scarcity ("only 2 left"), social crowding ("14 people viewing"), a countdown clock, and a social-proof upsell ("87% of buyers")',
      },
      {
        msg: '"Your account shows unusual activity. Verify within 24 hours to avoid suspension. This is your FINAL notice. Reply YES to keep access."',
        n: 4,
        list: 'manufactured alarm ("unusual activity"), a deadline, escalation language ("FINAL notice"), and a compliance-priming micro-ask ("reply YES")',
      },
      {
        msg: '"Everyone from class already joined the group buy. Spots close tonight. You\'d be letting the group down — and you owe me for the notes I shared."',
        n: 4,
        list: 'consensus pressure ("everyone joined"), a deadline, guilt framing ("letting the group down"), and invoked reciprocity ("you owe me")',
      },
      {
        msg: '"Congratulations, you\'ve been selected! Claim your reward in the next 10 minutes. Just cover a small shipping fee. Don\'t tell anyone until it\'s confirmed."',
        n: 4,
        list: 'flattery-by-selection, a countdown, a small-fee foot in the door, and a secrecy request — the last one is the loudest alarm',
      },
    ] as const)
    return {
      title: 'Tactic census',
      prompt: `A message reads:\n\n${c.msg}\n\nHow many DISTINCT pressure tactics is it running at once?`,
      answer: numeric(c.n),
      hints: [
        'Name each move: urgency, scarcity, social proof, guilt, reciprocity, secrecy, micro-asks.',
        'Count kinds, not sentences — one sentence can carry two tactics.',
      ],
      explanation: `**${c.n}**: ${c.list}. Counting tactics is a defensive skill with a sharp payoff — pressure stacks precisely because each tactic feels small alone. The rule of thumb: one tactic might be enthusiasm; three or more is choreography, and choreography deserves a pause and a second opinion. Anything demanding secrecy has forfeited the benefit of the doubt.`,
    }
  },
)

const boundaryQuality = tpl(
  { id: 'ins-boundary-quality', name: 'Which "no" holds?', skillIds: ['h-boundary'], bucket: 'insight', difficulty: 4, variants: 4, minutes: 2.5 },
  (rng, seed) => {
    const c = cycle(seed, [
      {
        setup: 'A teammate keeps sending homework-answer requests at midnight.',
        correct: '"I\'m not sending answers. I can explain the method tomorrow at lunch if you want."',
        bads: [
          ['"Maybe, I\'ll see — I\'m pretty busy tonight…"', 'a soft maybe invites the same ask tomorrow; the limit never gets stated'],
          ['"You always do this. You\'re using me and everyone knows it."', 'attacks the person instead of stating the limit — now it\'s a fight about character'],
          ['"Fine, but only this once (again)."', 'a boundary that yields when pushed teaches that pushing works'],
        ] as [string, string, ErrorTag?][],
      },
      {
        setup: 'A friend pressures you to share your streaming password "since you trust me".',
        correct: '"No — I don\'t share passwords, that one\'s a rule for everyone. Happy to watch together at mine."',
        bads: [
          ['"My parents would kill me, sorry, it\'s them not me."', 'outsourcing the no makes it negotiable — the friend now argues with your parents\' rule, not yours', 'strategy'],
          ['"If you were a real friend you wouldn\'t ask."', 'returns pressure with pressure; the limit gets lost in the counterattack', 'strategy'],
          ['"Ugh, fine, just don\'t change anything."', 'consent under pressure is the outcome the pressure was for', 'concept'],
        ] as [string, string, ErrorTag?][],
      },
      {
        setup: 'A group chat keeps roasting one member and tags you to join in.',
        correct: '"Not my thing — I\'m out of the roasting. Game night still on Friday?"',
        bads: [
          ['(Leave the chat silently)', 'exits the situation but leaves the norm untouched and the target alone'],
          ['"You\'re all bullies and I\'m reporting everyone."', 'may escalate past what the situation needs before a plain refusal was even tried — and threats you don\'t mean erode the ones you do'],
          ['(Join with a mild roast so it stays friendly)', 'participation IS endorsement, however gentle the line'],
        ] as [string, string, ErrorTag?][],
      },
      {
        setup: 'An online "friend" of two weeks asks for a photo you\'re not comfortable sharing, "to prove you trust me".',
        correct: '"No. And asking again ends the conversation." (Then tell a trusted adult if it continues.)',
        bads: [
          ['"Not yet — maybe when we\'ve talked longer."', '"not yet" schedules a future yes; discomfort deserves a full no'],
          ['"Why would you even want that? What\'s wrong with you?"', 'debating motives opens a negotiation; the ask itself is the problem'],
          ['(Block instantly and tell no one)', 'blocking is right — telling no one leaves you carrying it alone, and adults exist for exactly this'],
        ] as [string, string, ErrorTag?][],
      },
    ] as const)
    const { answer, distractorNotes, distractorTags } = mcqNoted(rng, c.correct, c.bads.map((b) => [...b] as [string, string, ErrorTag?]))
    return {
      title: 'Boundary under pressure',
      prompt: `${c.setup}\n\nWhich response sets a boundary that actually holds?`,
      answer,
      distractorNotes,
      distractorTags,
      hints: [
        'A boundary that holds is: clear, owned by you, and not an attack.',
        'Offering an alternative you ARE comfortable with is strength, not weakness.',
      ],
      explanation: `**${c.correct}** — short, owned ("I don't", not "I can't"), no character attack, and where possible an alternative on your terms. The failing patterns are stable across every scenario: the soft maybe (invites re-asking), the outsourced no (invites negotiation), the counterattack (changes the subject to your tone), and the yield (trains the pusher). A boundary is a sentence you can hold at full volume and half volume alike — and when an interaction turns coercive, the game frame is over: bring in a trusted adult.`,
    }
  },
)

// ---------------------------------------------------------------- meta

const interleaving = tpl(
  { id: 'meta-interleave', name: 'Blocked or mixed practice?', skillIds: ['x-learn'], bucket: 'meta', difficulty: 4, variants: 4, minutes: 2.5, calibration: true },
  (rng, seed) => {
    const c = cycle(seed, [
      {
        q: 'Two study plans for three solve-methods (factoring, square roots, formula): AAABBBCCC vs interleaved ABCACBCAB. A test two weeks later mixes all three. Which plan predicts better test performance, and why?',
        correct: 'Mixed — the test\'s real task is choosing the method, and only mixing practices the choosing',
        bads: [
          ['Blocked — it felt smoother, and smooth practice means strong learning', 'fluency during practice is the classic false signal; the smoothness comes from already knowing which method applies'],
          ['Blocked — switching wastes time that could be spent drilling', 'the "wasted" switching is the retrieval the test will demand'],
          ['They are equal if total time matches', 'time matched, demands differ: one practices execution only, the other execution plus selection'],
        ] as [string, string, ErrorTag?][],
      },
      {
        q: 'A learner reports: "Blocked practice felt great, mixed practice felt rough — so blocked must be working better." What is the honest reading?',
        correct: 'Feeling of ease is not learning: mixed practice usually feels worse and tests better',
        bads: [
          ['They are right — struggle is a sign the method is failing', 'desirable difficulty predicts retention; effortless practice often predicts forgetting', 'concept'],
          ['They are right about themselves — feelings track learning for the person having them', 'the metacognitive illusion is precisely that it feels true from inside', 'concept'],
          ['Neither method matters compared to total hours', 'hours matter, but the same hours produce measurably different retention by structure', 'concept'],
        ] as [string, string, ErrorTag?][],
      },
      {
        q: 'When is BLOCKED practice actually the right call?',
        correct: 'In the first minutes with a brand-new skill, before mixing anything',
        bads: [
          ['Never — mixing is always better', 'a skill you cannot yet execute once has nothing to interleave'],
          ['Whenever the test is more than a week away', 'distance to the test favors MORE mixing, not less'],
          ['When the skills being practiced are easily confused', 'confusable skills are exactly where mixing pays most — it forces the discrimination'],
        ] as [string, string, ErrorTag?][],
      },
      {
        q: 'A quiz will show quadratics all of one type. A final, months later, mixes everything. What does the evidence recommend?',
        correct: 'Mix anyway — the final and real use are mixed, and the quiz cost is small',
        bads: [
          ['Block for the quiz, then re-block before the final', 're-blocking never practices selection, which is what the final tests'],
          ['Mixing is only for math, so it does not apply here', 'interleaving evidence spans categories from math to art styles'],
          ['Block everything; use the saved time for rereading', 'rereading is among the weakest strategies measured'],
        ] as [string, string, ErrorTag?][],
      },
    ] as const)
    const { answer, distractorNotes, distractorTags } = mcqNoted(rng, c.correct, c.bads.map((b) => [...b] as [string, string, ErrorTag?]))
    return {
      title: 'Interleaving',
      prompt: c.q,
      answer,
      distractorNotes,
      distractorTags,
      hints: [
        'Ask what the TEST will demand: executing a method, or choosing one?',
        'Distrust "it felt smooth" as evidence — ease during practice routinely misleads.',
      ],
      explanation: `**${c.correct}.** Mixed practice forces method SELECTION on every item, which is what mixed tests and real life demand; blocked practice quietly deletes that step. The feeling reverses the truth — blocked feels better and tests worse — which is why this is a Meta Lab skill: the evidence has to overrule the vibe. (Evidence tier: interleaving's benefit for problem-CLASS discrimination is well replicated; the boundary conditions are in RESEARCH.md.)`,
    }
  },
)

const errorTriage = tpl(
  { id: 'meta-error-triage', name: 'Sort errors by cause', skillIds: ['x-focus'], bucket: 'meta', difficulty: 3, variants: 4, minutes: 2.5 },
  (rng, seed) => {
    const c = cycle(seed, [
      { err: 'Solving 3x + 5 = 20, a learner writes x = 25/3 — they added 5 instead of subtracting.', kind: 'A concept-or-rule slip in the INVERSE operation', fix: 'Re-derive why the balance move is subtraction; two clean reps' },
      { err: 'Solving 4x = 36, a learner writes x = 8 and moves on without noticing 4 × 8 = 32.', kind: 'A skipped-verification slip — no check ran', fix: 'Install the 5-second substitute-back habit on every solve' },
      { err: 'A learner reads "at least 12" and solves x ≤ 12.', kind: 'A misread of the constraint language', fix: 'Slow down at quantifier words; translate them before touching algebra' },
      { err: 'A learner can solve every practiced equation type but freezes on x/3 + 2 = 7, a shape they never met.', kind: 'A method-selection gap, not an execution gap', fix: 'Practice mixed problem SETS where the shape must be recognized first' },
    ] as const)
    const all = [
      'A concept-or-rule slip in the INVERSE operation',
      'A skipped-verification slip — no check ran',
      'A misread of the constraint language',
      'A method-selection gap, not an execution gap',
    ]
    return {
      title: 'Diagnose before treating',
      prompt: `${c.err}\n\nWhat KIND of error is this?`,
      answer: mcq(rng, c.kind, all.filter((x) => x !== c.kind)),
      hints: [
        'Ask where the process broke: reading, choosing, executing, or checking?',
        'The same wrong answer can come from different breaks — the fix depends on which.',
      ],
      explanation: `**${c.kind}** — and the matching repair is: ${c.fix.toLowerCase()}. Sorting errors by CAUSE instead of by topic is the highest-leverage study move there is, because "more practice" only fixes execution gaps; misreads, missing checks, and selection gaps each need their own drill, and untargeted volume fixes none of them.`,
    }
  },
)

// ---------------------------------------------------------------- science

const effectSize = tpl(
  { id: 'sci-effect-size', name: 'Real, and also big?', skillIds: ['s-sources', 's-measure'], bucket: 'science', difficulty: 5, variants: 12, minutes: 3, calibration: true },
  (rng, seed) => {
    const c = cycle(seed, [
      ['a memory supplement', 'test scores', 'points on a 100-point test'],
      ['a new running insole', '5K times', 'seconds over a ~25-minute race'],
      ['a focus app', 'homework completion', 'minutes of a ~2-hour evening'],
    ] as const)
    const tiny = rint(rng, 1, 2)
    const n = cycle(Math.floor(seed / 3), [20000, 50000] as const)
    const { answer, distractorNotes, distractorTags } = mcqNoted(
      rng,
      `Probably real but too small to matter — judge the SIZE, not just the certainty`,
      [
        ['Fake — a difference that small must be chance', `with n = ${n.toLocaleString()}, even tiny true differences are detected reliably; small ≠ chance`, 'concept'],
        ['Important — a proven difference is a difference worth acting on', 'statistical detectability and practical importance are different questions; this conflates them', 'concept'],
        ['Impossible to say anything without the raw data', 'the two numbers given — effect size and sample size — are exactly the ones needed for this judgment', 'incomplete'],
      ],
    )
    return {
      title: 'Statistically real, practically tiny',
      prompt: `A study of **${n.toLocaleString()} people** finds ${c[0]} improves ${c[1]} by **${tiny} ${c[2]}**, and the difference is "statistically significant". What is the right take?`,
      answer,
      distractorNotes,
      distractorTags,
      hints: [
        'Huge samples can certify differences too small to feel.',
        `Ask two separate questions: is it real? is ${tiny} ${c[2].split(' ')[0]} worth anything?`,
      ],
      explanation: `**Probably real, probably negligible.** "Significant" answers only "is it likely non-zero?" — and with ${n.toLocaleString()} people, near-anything non-zero gets certified. Whether ${tiny} ${c[2]} matters is a judgment about SIZE that no p-value makes for you. Headlines run on the certainty word; decisions should run on the size number. Asking "how big?" before "how sure?" is the single best upgrade to reading any study.`,
    }
  },
)

const confoundHunt = tpl(
  { id: 'sci-confound-pick', name: 'Design away the confound', skillIds: ['s-design'], bucket: 'science', difficulty: 4, variants: 4, minutes: 3 },
  (rng, seed) => {
    const c = cycle(seed, [
      {
        claim: 'Students who sit in front score higher, so a teacher concludes front seats CAUSE better grades.',
        fix: 'Randomly assign seats for a term and compare',
        confound: 'motivated students choose the front — seat choice and motivation arrive together',
        bads: [
          ['Survey students about why they chose their seats', 'answers describe the confound; only breaking the choice removes it'],
          ['Compare the same students\' grades before and after they chose seats', 'motivation changes over time too; the confound rides along'],
          ['Study a bigger sample of self-chosen seats', 'more data measures the same tangled thing more precisely'],
        ] as [string, string, ErrorTag?][],
      },
      {
        claim: 'A cafe owner notes customers who order oat milk stay longer, so oat milk must make people linger.',
        fix: 'Note laptop use and visit purpose FIRST, then compare within each group',
        confound: 'remote workers both order trend drinks and camp for hours — the drink is a marker, not a motor',
        bads: [
          ['Offer free oat milk for a week and watch stay times', 'the freebie changes who shows up — a new confound replaces the old', 'inference'],
          ['Interview oat-milk drinkers about their plans', 'self-reports of the confound do not remove it from the comparison', 'inference'],
          ['Track stay times across more cafes', 'replicating a confounded design replicates its confound', 'inference'],
        ] as [string, string, ErrorTag?][],
      },
      {
        claim: 'Players who own the premium racket win more league matches; the shop cites this as proof the racket wins games.',
        fix: 'Loan standard and premium rackets at random within a skill tier and count wins',
        confound: 'serious players buy premium gear AND practice more — spending tracks dedication',
        bads: [
          ['Compare win rates only among players who can afford the racket', 'affordability was never the confound; dedication was'],
          ['Ask premium owners whether the racket helps', 'owners who paid are the last people who can judge it neutrally'],
          ['Check whether winners recommend the racket', 'reverses the question and keeps the tangle'],
        ] as [string, string, ErrorTag?][],
      },
      {
        claim: 'Kids who do music lessons have better vocabularies, so a headline says music BUILDS vocabulary.',
        fix: 'Randomly offer lessons to half a waitlist and compare growth',
        confound: 'families that buy lessons differ in a dozen vocabulary-relevant ways',
        bads: [
          ['Control for family income statistically', 'income is one thread of many; adjustment cannot name them all'],
          ['Compare musical vs non-musical siblings', 'closer, but which sibling gets lessons is still a choice made for reasons'],
          ['Find more studies with the same design', 'a stack of confounded studies is a taller confounded study'],
        ] as [string, string, ErrorTag?][],
      },
    ] as const)
    const { answer, distractorNotes, distractorTags } = mcqNoted(rng, c.fix, c.bads.map((b) => [...b] as [string, string, ErrorTag?]))
    return {
      title: 'Break the tangle',
      prompt: `${c.claim}\n\nThe worry: ${c.confound}. Which redesign actually removes that worry?`,
      answer,
      distractorNotes,
      distractorTags,
      hints: [
        'The confound lives in WHO ENDS UP IN WHICH GROUP. Which option changes that?',
        'Measuring or describing a confound is not removing it — only assignment does that.',
      ],
      explanation: `**${c.fix}.** The confound exists because people SORTED THEMSELVES into groups for reasons connected to the outcome; random assignment is the one move that cuts that cord, because chance has no motives. Every rejected option measures, describes, or replicates the tangle — the design habit worth keeping is asking "who chose, and why?" before believing any group comparison.`,
    }
  },
)

// ---------------------------------------------------------------- physics

const energyConserve = tpl(
  { id: 'phys-energy-swap', name: 'Trade height for speed', skillIds: ['p-energy'], bucket: 'physics', difficulty: 4, variants: 10, minutes: 3 },
  (_rng, seed) => {
    // v² = 2gh with g = 10 for clean numbers (stated in-problem).
    const vs = [4, 6, 8, 10, 12]
    // Derived from the seed, not the rng, so declared variants are exactly real.
    const v = vs[Math.floor(seed / 2) % vs.length]
    const h = (v * v) / 20
    const down = seed % 2 === 0
    return down
      ? {
          title: 'Drop height → speed',
          prompt: `A skater rolls from rest down a ramp of height **${h} m** (ignore friction; take g = 10 m/s²). Using energy conservation, what speed at the bottom, in m/s?`,
          answer: numeric(v),
          hints: [
            'Potential energy mgh becomes kinetic ½mv² — mass cancels.',
            `v² = 2gh = 2 × 10 × ${h} = ${v * v}.`,
            `Worked path: **${v}**.`,
          ],
          explanation: `mgh = ½mv² → v = √(2gh) = √${v * v} = **${v} m/s** — for ANY mass, which is the quiet punchline: the m on both sides cancels, so the skater's weight never mattered. Energy bookkeeping answers "how fast at the bottom?" without touching forces or time, which is exactly when to reach for it.`,
        }
      : {
          title: 'Speed → climb height',
          prompt: `A ball leaves a ramp UPWARD at **${v} m/s** (ignore air resistance; g = 10 m/s²). Using energy conservation, what maximum height does it gain, in meters?`,
          answer: numeric(h),
          hints: [
            'Kinetic ½mv² converts to potential mgh at the top.',
            `h = v²/(2g) = ${v * v}/20.`,
            `Worked path: **${h}**.`,
          ],
          explanation: `½mv² = mgh → h = v²/2g = ${v * v}/20 = **${h} m**. Note the square: DOUBLE the launch speed buys FOUR times the height, which is why "a bit faster" is so much more dangerous than it feels. Same ledger as the downhill case, read in reverse.`,
        }
  },
)

const circuitOhm = tpl(
  { id: 'phys-series-circuit', name: 'One loop, one current', skillIds: ['p-circuits'], bucket: 'physics', difficulty: 3, variants: 36, minutes: 2.5 },
  (rng, seed) => {
    const r1 = rint(rng, 1, 6)
    const r2 = rint(rng, 1, 6)
    const i = rint(rng, 1, 3)
    const vTot = i * (r1 + r2)
    const askI = seed % 2 === 0
    return askI
      ? {
          title: 'Current in a series loop',
          prompt: `A **${vTot} V** battery drives two resistors in SERIES: **${r1} Ω** and **${r2} Ω**. What current flows, in amps?`,
          answer: numeric(i),
          hints: [
            'Series resistances add into one total.',
            `I = V / (R₁ + R₂) = ${vTot}/${r1 + r2}.`,
            `Worked path: **${i}**.`,
          ],
          explanation: `Series: R = ${r1} + ${r2} = ${r1 + r2} Ω, so I = ${vTot}/${r1 + r2} = **${i} A** — and that SAME current threads both resistors, because a single loop offers charge no alternative path. Using only one resistor in the division (${vTot}/${r1}) is the standard slip; the battery feels the whole chain.`,
        }
      : {
          title: 'Share the voltage',
          prompt: `In that same series loop (**${vTot} V**, resistors **${r1} Ω** then **${r2} Ω**), what voltage does the **${r1} Ω** resistor take, in volts?`,
          answer: numeric(i * r1),
          hints: [
            `First the loop current: ${vTot}/(${r1} + ${r2}) = ${i} A.`,
            `Then V₁ = I·R₁.`,
            `Worked path: **${i * r1}**.`,
          ],
          explanation: `The loop current is ${i} A everywhere, so V₁ = ${i} × ${r1} = **${i * r1} V** (and V₂ = ${i * r2} V — together ${vTot}, the whole battery, as they must). Series resistors SPLIT the voltage in proportion to their resistance while sharing one current: the bigger resistor takes the bigger bite.`,
        }
  },
)

// ---------------------------------------------------------------- coding

const recursionTrace = tpl(
  { id: 'code-recursion-trace', name: 'Trust the recursion, then check it', skillIds: ['c-funcs', 'c-trace'], bucket: 'coding', difficulty: 5, variants: 6, minutes: 3 },
  (_rng, seed) => {
    const kind = cycle(seed, ['sumdown', 'double', 'count'] as const)
    // Seed-derived so declared variants are exactly real: 3 kinds × 2 sizes.
    const n = 4 + (Math.floor(seed / 3) % 2)
    if (kind === 'sumdown') {
      const val = (n * (n + 1)) / 2
      return {
        title: 'Trace the self-call',
        prompt: `\`\`\`\nfunction f(n) {\n  if (n === 0) return 0;\n  return n + f(n - 1);\n}\n\`\`\`\nWhat does **f(${n})** return?`,
        answer: numeric(val),
        hints: [
          'Unroll one layer at a time: f(n) = n + f(n−1), until the base case.',
          `${n} + ${n - 1} + … + 1 + 0.`,
          `Worked path: **${val}**.`,
        ],
        explanation: `f(${n}) = ${n} + f(${n - 1}) = ${n} + ${n - 1} + … + 1 + f(0) = **${val}** — the sum 1..${n}. Two reading strategies work: unroll the calls mechanically, or trust the SPEC ("f(n) sums 0..n"), verify it on the base case and one step, and stop unrolling. The second scales to recursions too deep to trace, and learning to trust a verified spec is the real lesson.`,
      }
    }
    if (kind === 'double') {
      const val = 2 ** n
      return {
        title: 'Branches multiply',
        prompt: `\`\`\`\nfunction g(n) {\n  if (n === 0) return 1;\n  return g(n - 1) + g(n - 1);\n}\n\`\`\`\nWhat does **g(${n})** return?`,
        answer: numeric(val),
        hints: [
          'Each layer doubles the result of the one below.',
          `g(0)=1, g(1)=2, g(2)=4, …`,
          `Worked path: **${val}**.`,
        ],
        explanation: `Each level returns twice the level below: g(${n}) = 2^${n} = **${val}**. Worth noticing on the way: as WRITTEN it makes two identical calls per level — about ${2 ** n} calls to compute what \`2 * g(n-1)\` gets in ${n} — a first taste of how identical code shapes can hide wildly different costs.`,
      }
    }
    const val = n
    return {
      title: 'What does it count?',
      prompt: `\`\`\`\nfunction h(n) {\n  if (n < 10) return 1;\n  return 1 + h(Math.floor(n / 10));\n}\n\`\`\`\nWhat does **h(${10 ** (n - 1)})** return?`,
      answer: numeric(val),
      hints: [
        'Each call strips one digit (divides by 10).',
        `How many digits does ${10 ** (n - 1)} have?`,
        `Worked path: **${val}**.`,
      ],
      explanation: `Each level chops one digit off; the base case fires at a single digit. ${10 ** (n - 1)} has ${n} digits, so h returns **${val}** — this function counts DIGITS. Naming what a recursion computes (its spec) beats tracing it call by call, and checking the spec on the base case plus one step is the whole proof pattern.`,
    }
  },
)

const invariantSpot = tpl(
  { id: 'code-invariant', name: 'What stays true?', skillIds: ['c-decomp', 'c-loops'], bucket: 'coding', difficulty: 4, variants: 4, minutes: 3, calibration: true },
  (rng, seed) => {
    const c = cycle(seed, [
      {
        code: 'let sum = 0;\nfor (let i = 0; i < arr.length; i++) {\n  sum += arr[i];\n}',
        correct: 'After each pass: sum equals the total of the first i elements processed',
        bads: [
          ['`sum` equals the total of the whole array at every step', 'only true at the END — an invariant must hold every iteration'],
          ['`i` is always less than the array length inside the loop body', 'true, but it is the loop CONDITION, and it says nothing about what sum means'],
          ['`sum` is always positive', 'false with negative elements — and never the point'],
        ] as [string, string, ErrorTag?][],
      },
      {
        code: 'let best = arr[0];\nfor (let i = 1; i < arr.length; i++) {\n  if (arr[i] > best) best = arr[i];\n}',
        correct: 'After each pass: best is the largest of the elements examined so far',
        bads: [
          ['`best` is the largest element of the array throughout', 'only guaranteed after the FINAL pass', 'concept'],
          ['`best` only changes on the first iteration', 'best changes whenever a new maximum appears', 'concept'],
          ['`arr[i]` is always greater than `best`', 'usually false — that is the condition being TESTED, not maintained', 'concept'],
        ] as [string, string, ErrorTag?][],
      },
      {
        code: 'let lo = 0, hi = arr.length - 1; // arr is sorted\nwhile (lo <= hi) {\n  const mid = Math.floor((lo + hi) / 2);\n  if (arr[mid] === target) return mid;\n  if (arr[mid] < target) lo = mid + 1;\n  else hi = mid - 1;\n}',
        correct: 'If target is in the array, it always lies between positions lo and hi',
        bads: [
          ['`mid` is always the exact middle of the whole array', 'mid is the middle of the CURRENT window, which shrinks'],
          ['`arr[lo]` is always less than `arr[hi]`', 'can fail as the window narrows to one element'],
          ['The loop always runs log(n) times exactly', 'that is its cost ceiling, not a truth maintained each pass'],
        ] as [string, string, ErrorTag?][],
      },
      {
        code: 'let open = 0;\nfor (const ch of text) {\n  if (ch === "(") open++;\n  if (ch === ")") open--;\n  if (open < 0) return false;\n}\nreturn open === 0;',
        correct: 'open always equals unmatched "(" seen so far — and dipping negative means a ")" arrived with nothing to close',
        bads: [
          ['`open` counts all parentheses of either kind', 'it counts the DIFFERENCE, which is why zero at the end means balanced'],
          ['`open` is always at least 1 inside the loop', 'open starts at 0 and legitimately returns to 0 after each balanced pair'],
          ['The function returns true whenever the text contains "()"', 'the check is global balance, not the presence of one pair'],
        ] as [string, string, ErrorTag?][],
      },
    ] as const)
    const { answer, distractorNotes, distractorTags } = mcqNoted(rng, c.correct, c.bads.map((b) => [...b] as [string, string, ErrorTag?]))
    return {
      title: 'Find the invariant',
      prompt: `\`\`\`\n${c.code}\n\`\`\`\nWhich statement stays true after EVERY pass of the loop?`,
      answer,
      distractorNotes,
      distractorTags,
      hints: [
        'An invariant must hold after pass 1, pass 2, … not just at the end.',
        'Test each candidate against the very first iteration — most impostors die there.',
      ],
      explanation: `**${c.correct}.** An invariant is the sentence the loop keeps re-earning, and it is how loops are UNDERSTOOD rather than simulated: check it holds before the loop, show each pass preserves it, and the final state follows without tracing all n iterations. The impostor options are the usual suspects — end-state truths, loop conditions, and cost facts, none of which is maintained every pass.`,
    }
  },
)

export const LABS_DEPTH_TEMPLATES: ItemTemplate[] = [
  sourceMemory,
  paraphraseFidelity,
  argumentForms,
  bayesOdds,
  criticalPath,
  evThreshold,
  pressureStack,
  boundaryQuality,
  interleaving,
  errorTriage,
  effectSize,
  confoundHunt,
  energyConserve,
  circuitOhm,
  recursionTrace,
  invariantSpot,
]
