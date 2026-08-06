/**
 * Investigator Lab — logic, Bayesian updating, hypotheses, information value.
 * All cases fictional/synthetic. Never turns real people into suspects.
 */
import type { ItemTemplate } from '../../domain/types'
import { rint } from '../../engine/rng'
import { fixed, fraction, mcq, tpl } from '../lib'

// ---------- Deduction & syllogisms ----------

const syllogism = tpl(
  { id: 'i-syllogism', name: 'Valid or not?', skillIds: ['i-logic'], bucket: 'investigator', difficulty: 2, variants: 6, minutes: 2.5 },
  (rng, seed) => {
    const cases = [
      {
        premises: 'All robins are birds. All birds have feathers.',
        conclusion: 'Therefore all robins have feathers.',
        verdict: 'Valid — the conclusion must be true if the premises are',
        wrong: ['Invalid — robins were never mentioned in premise 2', 'Invalid — "all" statements cannot chain', 'Valid only if we check every robin'],
        note: 'A chain of "all A are B, all B are C" forces "all A are C" — validity is about FORM.',
      },
      {
        premises: 'All cats are mammals. Rex is a mammal.',
        conclusion: 'Therefore Rex is a cat.',
        verdict: 'Invalid — Rex could be any mammal (a dog, a whale…)',
        wrong: ['Valid — Rex satisfies both statements', 'Valid — mammals and cats overlap', 'Invalid — because Rex is a dog\'s name'],
        note: 'This is "affirming the consequent" in category form: mammal is the LARGER circle; being in it does not place Rex in the cat circle.',
      },
      {
        premises: 'If it rained overnight, the field is muddy. The field is muddy.',
        conclusion: 'Therefore it rained overnight.',
        verdict: 'Invalid — mud has other causes (sprinklers, a burst pipe)',
        wrong: ['Valid — muddy fields prove rain', 'Valid — because rain usually causes mud', 'Invalid — fields cannot be muddy without grass'],
        note: 'If-then only guarantees the forward direction. The converse needs its own evidence.',
      },
      {
        premises: 'If the alarm was set, it rings at 7. The alarm did NOT ring at 7.',
        conclusion: 'Therefore the alarm was not set.',
        verdict: 'Valid — this is the contrapositive, and it always holds',
        wrong: ['Invalid — the alarm might have rung quietly', 'Invalid — denying anything proves nothing', 'Valid only for reliable alarms'],
        note: 'Modus tollens: if A→B and B is false, A must be false. (The "quiet ring" objection attacks the PREMISE, not the logic — a useful distinction.)',
      },
      {
        premises: 'No reptiles are warm-blooded. All snakes are reptiles.',
        conclusion: 'Therefore no snakes are warm-blooded.',
        verdict: 'Valid — snakes sit inside reptiles, which sit outside warm-blooded',
        wrong: ['Invalid — some snakes bask to warm up', 'Invalid — "no" statements cannot chain with "all"', 'Valid only in cold climates'],
        note: 'Draw the circles: snakes ⊆ reptiles, reptiles ∩ warm-blooded = ∅. Basking raises temperature but does not make a snake warm-blooded — watch for real-world noise attacking a formal question.',
      },
      {
        premises: 'Some students walk to school. All who walk to school live nearby.',
        conclusion: 'Therefore some students live nearby.',
        verdict: 'Valid — the walking students themselves must live nearby',
        wrong: ['Invalid — "some" can never yield a conclusion', 'Invalid — most students take the bus', 'Valid only if more than half walk'],
        note: 'Follow the specific group: those "some" walkers are all nearby-livers, so at least those students live nearby.',
      },
    ]
    const c = cases[seed % cases.length]
    return {
      title: 'Does it follow?',
      prompt: `Premises: **${c.premises}**\nConclusion: **${c.conclusion}**\n\nIs the argument valid?`,
      answer: mcq(rng, c.verdict, c.wrong),
      hints: [
        'Valid = IF the premises were true, the conclusion could not be false. Truth of premises is a separate question.',
        'Draw the circles (categories) or the arrow (if→then) and check whether escape is possible.',
        `Worked path: **${c.verdict}**.`,
      ],
      explanation: `**${c.verdict}**. ${c.note}`,
    }
  },
)

// ---------- Bayes with natural frequencies ----------

const bayesNatural = tpl(
  { id: 'i-bayes-natural', name: 'Bayes by counting', skillIds: ['i-bayes'], bucket: 'investigator', difficulty: 3, variants: 12, minutes: 4, calibration: true },
  (rng) => {
    // Construct clean natural-frequency scenarios.
    const pop = 1000
    const baseRate = rint(rng, 1, 4) * 10 // 10..40 per 1000
    const sens = 0.8 + rint(rng, 0, 2) * 0.1 // 0.8, 0.9, 1.0 → keep 0.8/0.9
    const sensClean = sens > 0.95 ? 0.9 : sens
    const falsePos = rint(rng, 1, 2) * 0.1 // 0.1 or 0.2
    const sick = baseRate
    const healthy = pop - sick
    const truePos = Math.round(sick * sensClean)
    const falsePosN = Math.round(healthy * falsePos)
    const totalPos = truePos + falsePosN
    return {
      title: 'What does a positive really mean?',
      prompt:
        `A screening quiz flags "possible fake news sharers" at a fictional school of **${pop}** students.\n\n` +
        `- **${sick}** of the ${pop} actually share fake news.\n` +
        `- The quiz flags **${Math.round(sensClean * 100)}%** of the actual sharers.\n` +
        `- It also wrongly flags **${Math.round(falsePos * 100)}%** of the innocent students.\n\n` +
        `A student is flagged. Out of everyone flagged, what fraction actually shares fake news? Answer as a fraction (e.g. 24/119).`,
      answer: fraction(truePos, totalPos),
      hints: [
        'Count people, not percentages: how many true flags? How many false flags?',
        `True flags: ${Math.round(sensClean * 100)}% of ${sick} = ${truePos}. False flags: ${Math.round(falsePos * 100)}% of ${healthy} = ${falsePosN}.`,
        `Worked path: ${truePos} true out of ${truePos} + ${falsePosN} = ${totalPos} flagged → **${truePos}/${totalPos}**.`,
      ],
      explanation:
        `Count the four groups. Sharers flagged: ${truePos}. Innocent flagged: ${falsePosN}. So flagged students total ${totalPos}, of whom only ${truePos} are actual sharers: **${truePos}/${totalPos} ≈ ${Math.round((truePos / totalPos) * 100)}%**. ` +
        `Even a decent test drowns in false positives when the base rate is low (${sick} in ${pop}) — the flagged group is mostly innocents. This is THE structural insight of base-rate reasoning, and it applies to medical tests, spam filters, and accusations alike.`,
      commonErrors: { concept: `Answering ${Math.round(sensClean * 100)}% confuses P(flag | sharer) with P(sharer | flag) — the two directions differ exactly by the base rate.` },
    }
  },
)

// ---------- Best next test ----------

const bestTest = tpl(
  { id: 'i-best-test', name: 'Best Next Test', skillIds: ['i-hypo'], bucket: 'investigator', difficulty: 3, variants: 4, minutes: 3 },
  (rng, seed) => {
    const cases = [
      {
        mystery: 'Your desk lamp will not turn on. Hypotheses: (1) dead bulb, (2) dead outlet, (3) broken lamp switch/wiring.',
        correct: 'Plug the lamp into a different outlet',
        wrong: ['Stare at the bulb for damage', 'Buy a new lamp to compare', 'Flip the lamp switch several more times'],
        note: 'One move splits the hypothesis space: works elsewhere → outlet; still dead → bulb or lamp (then swap the bulb). Visual bulb inspection is weak evidence; repeat-flipping repeats the same test.',
      },
      {
        mystery: 'A web page loads on your laptop but not on your phone. Hypotheses: (1) phone\'s Wi-Fi, (2) phone\'s browser, (3) the page blocks mobile devices.',
        correct: 'On the phone, try a different site; if that works, try this page in another browser',
        wrong: ['Restart the laptop', 'Reload the page on the laptop again', 'Wait an hour and hope'],
        note: 'Different-site tests the Wi-Fi; different-browser then isolates browser vs site. The laptop is the control that already works — testing it again adds nothing.',
      },
      {
        mystery: 'Cookies came out flat. Hypotheses: (1) butter too melted, (2) oven too hot, (3) expired baking soda.',
        correct: 'Bake one tray of the SAME dough at a lower temperature',
        wrong: ['Change the butter, soda, and temperature together next batch', 'Ask a friend if their cookies are also flat', 'Switch to a different recipe entirely'],
        note: 'Same dough isolates temperature cleanly. Changing everything at once produces cookies but no knowledge; the friend\'s cookies share none of your variables.',
      },
      {
        mystery: 'Your code prints the wrong total. Hypotheses: (1) input data wrong, (2) loop skips items, (3) math inside the loop wrong.',
        correct: 'Print the list length and each item as the loop runs',
        wrong: ['Rewrite the whole function from scratch', 'Run it five more times unchanged', 'Assume the input file is fine because it opens'],
        note: 'One instrumented run tests (1) and (2) directly and localizes (3). Rewriting destroys the evidence; identical reruns produce identical ignorance.',
      },
    ]
    const c = cases[seed % cases.length]
    return {
      title: 'Which test teaches the most?',
      prompt: `${c.mystery}\n\nYou can do ONE thing next. Which choice best separates the hypotheses?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Score each action: which hypotheses does each possible RESULT eliminate?',
        'The best test has different outcomes under different hypotheses — a test that comes out the same either way teaches nothing.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. ${c.note} The habit: before acting, ask "what will each possible result tell me?" — that question is the whole discipline of efficient investigation.`,
    }
  },
)

// ---------- Disconfirmation ----------

const disconfirm = tpl(
  { id: 'i-disconfirm', name: 'Disconfirmation Challenge', skillIds: ['i-hypo', 'i-logic'], bucket: 'investigator', difficulty: 3, variants: 3, minutes: 3, transfer: true },
  (_rng, seed) => {
    const cases = [
      {
        rule: 'Claim: "Every card with a vowel on one side has an even number on the other." Cards on the table show: **A**, **K**, **4**, **7**.',
        options: ['Turn A', 'Turn K', 'Turn 4', 'Turn 7'],
        correct: [0, 3],
        note: 'A can break the rule (odd behind a vowel) and 7 can break it (vowel behind an odd). K is irrelevant; 4 can only CONFIRM — an odd letter behind it violates nothing. This is Wason\'s selection task: most people pick the confirming 4 and skip the falsifying 7.',
      },
      {
        rule: 'Claim: "Whenever the app crashes, the log file contains the word TIMEOUT." You have four records: a crash report, a normal-exit report, a log with TIMEOUT, a log without TIMEOUT.',
        options: ['Check the crash report\'s log', 'Check the normal exit\'s log', 'Check what happened when TIMEOUT appeared', 'Check what happened when no TIMEOUT appeared'],
        correct: [0, 3],
        note: 'A crash without TIMEOUT breaks the claim (check crashes), and a no-TIMEOUT log with a crash behind it breaks it too. TIMEOUT appearing without a crash is consistent — the claim never said only crashes produce it.',
      },
      {
        rule: 'Claim: "All of Dana\'s plants that sit in the south window bloom." Evidence available: a south-window plant, a north-window plant, a blooming plant, a non-blooming plant.',
        options: ['Inspect the south-window plant', 'Inspect the north-window plant', 'Find where the blooming plant sits', 'Find where the non-blooming plant sits'],
        correct: [0, 3],
        note: 'South-window plant not blooming = violation; non-blooming plant in the south window = violation. The blooming plant\'s location cannot hurt the claim, and north-window plants are outside it.',
      },
    ]
    const c = cases[seed % cases.length]
    return {
      title: 'Test what could prove it wrong',
      prompt: `${c.rule}\n\nSelect **exactly the checks that could FALSIFY** the claim.`,
      answer: { type: 'multi', options: c.options, correct: c.correct },
      hints: [
        'For each check ask: is there a possible result that BREAKS the rule? If not, skip it.',
        'Rules of the form "every A is B" break only via an A-without-B — so check the As and the not-Bs.',
        `Worked path: ${c.correct.map((i) => c.options[i]).join(' + ')}.`,
      ],
      explanation: `**${c.correct.map((i) => c.options[i]).join(' and ')}**. ${c.note} Confirmation feels productive and proves little; the falsifying checks are where claims actually get tested.`,
    }
  },
)

// ---------- Proof debugger ----------

const proofDebug = tpl(
  { id: 'i-proof-debug', name: 'Proof Debugger', skillIds: ['i-logic'], bucket: 'investigator', difficulty: 4, variants: 3, minutes: 3.5 },
  (rng, seed) => {
    const cases = [
      {
        argument:
          'Step 1: My bus was late on Monday and Tuesday.\nStep 2: So the bus is always late.\nStep 3: So there is no point leaving on time tomorrow.',
        correct: 'Step 2 — two observations cannot support "always"',
        wrong: ['Step 1 — the observations must be misremembered', 'Step 3 — it follows fine from step 2', 'Nothing is wrong with the argument'],
        note: 'Hasty generalization at step 2. (Step 3 has its own issue — even a usually-late bus is occasionally on time — but the first break in the chain is where repair starts.)',
      },
      {
        argument:
          'Step 1: Great athletes drink QuickAde in ads.\nStep 2: Drinking QuickAde is what great athletes do.\nStep 3: So drinking QuickAde will make me a great athlete.',
        correct: 'Step 3 — sharing one habit with a group does not transfer the group\'s other traits',
        wrong: ['Step 1 — athletes never appear in ads', 'Step 2 — restating step 1 is already false', 'Nothing is wrong with the argument'],
        note: 'The reversal at step 3 (from "athletes drink it" to "drinking it makes athletes") is the classic direction flip that advertising rents.',
      },
      {
        argument:
          'Step 1: If I study, I will pass.\nStep 2: I will study.\nStep 3: Therefore I don\'t need to sleep well or check my work — the pass is guaranteed.',
        correct: 'Step 3 — it imports guarantees the premises never gave',
        wrong: ['Step 1 — studying never causes passing', 'Step 2 — intentions cannot appear in arguments', 'Nothing is wrong with the argument'],
        note: 'Steps 1–2 support "I will pass" AS FAR AS THE PREMISES GO — step 3 quietly upgrades a conditional promise into an unconditional one and then spends the surplus.',
      },
    ]
    const c = cases[seed % cases.length]
    return {
      title: 'Find the broken step',
      prompt: `${c.argument}\n\nWhere does the argument break?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Check each arrow separately: does step N truly follow from what came before?',
        'The first bad inference is the one to name — everything after it inherits the damage.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. ${c.note} Debugging an argument is the same skill as debugging code: isolate the first step where the state (belief) goes wrong.`,
    }
  },
)

// ---------- Knights & Knaves ----------

const knightsKnaves = tpl(
  { id: 'i-knights', name: 'Truth-tellers & liars', skillIds: ['i-logic'], bucket: 'investigator', difficulty: 3, variants: 3, minutes: 3.5, transfer: true },
  (rng, seed) => {
    const cases = [
      {
        puzzle: 'On an island, knights always tell the truth and knaves always lie. Ari says: **"We are both knaves."**\n\nWhat are Ari and their companion Bo?',
        correct: 'Ari is a knave, Bo is a knight',
        wrong: ['Both are knaves', 'Both are knights', 'Ari is a knight, Bo is a knave'],
        note: 'A knight cannot say "we are both knaves" (it would be a true self-accusation — contradiction). So Ari is a knave and the statement is false: NOT both are knaves, so Bo is a knight.',
      },
      {
        puzzle: 'Knights always tell the truth, knaves always lie. Cam says: **"If I am a knight, then the treasure is real."**\n\nWhat can you conclude?',
        correct: 'Cam is a knight and the treasure is real',
        wrong: ['Cam is a knave; nothing about the treasure', 'The treasure is fake', 'Nothing at all can be concluded'],
        note: 'Suppose Cam is a knave: then the statement is a lie — but an if-statement with a false "if" part ("I am a knight") is automatically true, and knaves cannot say true things. Contradiction. So Cam is a knight, the statement is true, and with a true "if" part, the treasure is real.',
      },
      {
        puzzle: 'Dee and Eli. Dee says: **"Exactly one of us is a knave."** Eli says: **"Dee is a knight."**\n\nWhat are they?',
        correct: 'Both are knaves',
        wrong: ['Both are knights', 'Dee is a knight, Eli is a knave', 'Dee is a knave, Eli is a knight'],
        note: 'Try all four cases. Both knights: Dee\'s "exactly one knave" would be false ✗. Dee knight + Eli knave: Eli\'s statement would be true, impossible for a knave ✗. Dee knave + Eli knight: Eli truthfully calls Dee a knight — false ✗. Both knaves: Dee\'s claim is false (there are TWO knaves) ✓ a proper lie; Eli\'s claim is false ✓ a proper lie. The only consistent world: both knaves.',
      },
    ]
    const c = cases[seed % cases.length]
    return {
      title: 'Case analysis',
      prompt: c.puzzle,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Assume each case in turn and follow it to consistency or contradiction.',
        'A knave\'s statements must be FALSE — not merely doubtful — and a knight\'s must be TRUE.',
        `Worked path: ${c.note}`,
      ],
      explanation: `${c.note} The transferable move is exhaustive case analysis: assume, propagate, and keep only the worlds without contradiction.`,
    }
  },
)

// ---------- Information gain ----------

const infoGain = fixed(
  { id: 'i-info-gain', name: 'Information-Gain Puzzle', skillIds: ['i-hypo', 'i-bayes'], bucket: 'investigator', difficulty: 3, minutes: 3, calibration: true },
  {
    title: 'Twenty questions, one question',
    prompt:
      'A friend picks a whole number from **1 to 16**. You may ask one yes/no question before guessing. Which question sets you up best?',
    answer: {
      type: 'mcq',
      options: [
        '"Is it 9 or more?" (splits 8/8)',
        '"Is it exactly 16?" (splits 1/15)',
        '"Is it a perfect square?" (splits 4/12)',
        '"Is it my lucky number, 7?" (splits 1/15)',
      ],
      correct: 0,
    },
    hints: [
      'Measure a question by its WORST case: how many candidates can survive?',
      'A 1/15 split is amazing if you hear "yes" — but you almost never will.',
      'Worked path: the 8/8 split guarantees 8 remain — the best guarantee available.',
    ],
    explanation:
      'The even split maximizes guaranteed information: whatever the answer, 8 candidates remain (then 4, 2, 1 — four questions total finds any number, since 2⁴ = 16). "Is it exactly 16?" leaves 15 candidates in the 94%-likely branch. Questions are worth their EXPECTED narrowing, not their jackpot branch — the same principle behind binary search and good diagnostic tests.',
  },
)

// ---------- What would change your mind ----------

const wouldChange = tpl(
  { id: 'i-would-change', name: 'What would change your mind?', skillIds: ['i-hypo', 'i-forecast'], bucket: 'investigator', difficulty: 3, variants: 3, minutes: 3 },
  (rng, seed) => {
    const cases = [
      {
        belief: 'You believe your study playlist helps you focus.',
        correct: 'Two weeks of homework scores/time, alternating music days and silent days',
        wrong: [
          'Remembering your best-ever session, which had music',
          'A friend agreeing that music helps them too',
          'How focused you FEEL while the music plays',
        ],
        note: 'The alternating comparison could come out either way — that is what makes it evidence. Memories and feelings select their own confirmation.',
      },
      {
        belief: 'You believe the school\'s new schedule causes worse test scores.',
        correct: 'Score trends from before/after the change, compared with a school that kept the old schedule',
        wrong: [
          'Collecting complaints about the new schedule',
          'Noticing you personally feel more tired',
          'A poll asking students if they LIKE the schedule',
        ],
        note: 'The comparison school controls for everything else that changed that year. Complaints and liking measure mood, not scores.',
      },
      {
        belief: 'You believe your free-throw form change made you more accurate.',
        correct: 'Logging 50 attempts with each form and comparing the make-rates',
        wrong: [
          'The three shots you hit right after changing',
          'Your coach saying the new form looks better',
          'Feeling more confident at the line',
        ],
        note: 'Three shots is noise; 50-vs-50 has enough attempts for the difference to mean something. "Looks better" is a prediction, not a result.',
      },
    ]
    const c = cases[seed % cases.length]
    return {
      title: 'Pick the evidence with teeth',
      prompt: `${c.belief}\n\nWhich evidence could genuinely settle it — including AGAINST you?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Good evidence has two possible outcomes, and you can say in advance what each would mean.',
        'If a result could only ever support your belief, it is decoration.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. ${c.note} "What would change my mind?" is the question that separates beliefs from teams. If nothing could, the belief has left the domain of evidence.`,
    }
  },
)

// ---------- Game & cooperation ----------

const gamePayoff = fixed(
  { id: 'i-game-payoff', name: 'Payoff table reasoning', skillIds: ['i-game'], bucket: 'investigator', difficulty: 3, minutes: 3.5 },
  {
    title: 'The project split',
    prompt:
      'You and a partner each secretly choose: **Prepare** or **Coast**. Grades (you, partner):\n\n| | Partner prepares | Partner coasts |\n| --- | --- | --- |\n| **You prepare** | (A, A) | (B, C) |\n| **You coast** | (C, B) | (D, D) |\n\nwith A = 92, B = 85, C = 88, D = 70.\n\nIf you only cared about YOUR grade for this one project, what is your best choice, and what happens if both players reason that way?',
    answer: {
      type: 'mcq',
      options: [
        'Prepare — it wins in both columns (92 vs 88, and 85 vs 70), so both players prepare and get 92',
        'Coast — effort is wasted either way, so both coast and land on 70',
        'Prepare only if the partner prepares; otherwise coast',
        'The table gives no best choice without reading the partner\'s mind',
      ],
      correct: 0,
    },
    hints: [
      'Compare your payoffs column by column: partner prepares → your 92 (prepare) vs 88 (coast); partner coasts → your 85 vs 70.',
      'A choice better in BOTH columns is dominant.',
      'Worked path: prepare dominates (92 > 88 and 85 > 70) — this game rewards effort even selfishly.',
    ],
    explanation:
      'Check both columns: if partner prepares, you get 92 by preparing vs 88 coasting; if partner coasts, 85 vs 70. Preparing is better in BOTH cases — a dominant strategy — so two self-interested players both prepare and land on (92, 92). Not every game is a prisoner\'s dilemma: here incentives align with cooperation. The skill is CHECKING the table instead of assuming betrayal pays.',
  },
)

const cooperateRepeat = fixed(
  { id: 'i-game-repeat', name: 'Repeated games', skillIds: ['i-game'], bucket: 'investigator', difficulty: 3, minutes: 3 },
  {
    title: 'Why cooperation survives',
    prompt:
      'In a ONE-round trading game, cheating a stranger pays slightly more than dealing fairly. You will trade with the SAME partner every week all year, and they remember. What changes?',
    answer: {
      type: 'mcq',
      options: [
        'Repetition makes fairness profitable: one cheat costs a year of good trades',
        'Nothing — the best move in one round is best in every round',
        'Cheating becomes even better because there are more chances',
        'The game becomes impossible to analyze',
      ],
      correct: 0,
    },
    hints: [
      'Compare the one-time gain from cheating with the stream of future cooperation it destroys.',
      'Your partner\'s memory turns today\'s choice into tomorrow\'s reputation.',
      'Worked path: the shadow of the future makes cooperation the winning strategy.',
    ],
    explanation:
      'With repetition and memory, defection buys a small one-time bonus and forfeits a long stream of mutual gains — so strategies like "cooperate, and respond in kind" dominate. This is why reputation, trust, and long-term relationships are not naive: they are strategically sound. (It also explains why one-shot anonymous settings — like scam calls — attract cheating: no shadow of the future.)',
  },
)

export const INVESTIGATOR_TEMPLATES: ItemTemplate[] = [
  syllogism,
  bayesNatural,
  bestTest,
  disconfirm,
  proofDebug,
  knightsKnaves,
  infoGain,
  wouldChange,
  gamePayoff,
  cooperateRepeat,
]
