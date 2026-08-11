/**
 * Auto-graded expansion for the four thinking Paths.
 *
 * These drills deliberately avoid rubric answers: every response is checked
 * by the same validator used for mathematics. Static scenarios have authored
 * keys; parameterized problems compute their keys from generated values.
 */
import type { AnswerSpec, ItemTemplate } from '../../domain/types'
import { rint, shuffle, type Rng } from '../../engine/rng'
import { fraction, mcq, numeric, round, tpl } from '../lib'

function orderAnswer(rng: Rng, correctOrder: string[]): Extract<AnswerSpec, { type: 'order' }> {
  const options = shuffle(rng, correctOrder)
  return { type: 'order', options, correct: correctOrder.map((step) => options.indexOf(step)) }
}

// ---------------------------------------------------------------- Observer

const exactParaphraseCases = [
  {
    quote: 'I can review the first half tonight, but I need help with the graphs tomorrow.',
    correct: 'They can review only the first half tonight and need graph help tomorrow.',
    wrong: [
      'They will get the whole of the review finished by tonight.',
      'They are refusing to do any of the work on the graphs at all.',
      'They will need help with every single part of the work again tomorrow.',
    ],
  },
  {
    quote: 'The bus was late twice this week; I am not saying it is always late.',
    correct: 'The bus was late twice this week, and the speaker rejects a broader claim.',
    wrong: [
      'The bus is late on most mornings of the week, as a general rule.',
      'The bus was running exactly two minutes late on that particular morning.',
      'The speaker thinks that the whole bus schedule ought to be changed.',
    ],
  },
  {
    quote: 'I liked the evidence in your opening, though the conclusion felt too certain.',
    correct: 'They liked the opening evidence but thought the conclusion overstated certainty.',
    wrong: [
      'They disliked more or less the whole of the argument.',
      'They agreed completely with the conclusion as it was written.',
      'They wanted more evidence in the opening section and nowhere else in it.',
    ],
  },
  {
    quote: 'If the rain stops by four, I will walk; otherwise I will take the train.',
    correct: 'Walking depends on the rain stopping by four; otherwise they will take the train.',
    wrong: [
      'They have already decided to walk, regardless of what the weather does.',
      'They will only take the train if it happens to be raining after four.',
      'They expect the trains to stop running altogether at around four in the afternoon.',
    ],
  },
  {
    quote: 'Three people opened the document, but I do not know whether any of them read it.',
    correct: 'Three opens were recorded; reading is still unknown.',
    wrong: [
      'Three separate people read the whole document.',
      'Nobody has read the document at all.',
      'Exactly one person has actually read the document.',
    ],
  },
  {
    quote: 'I am free after practice, unless the coach adds a team meeting.',
    correct: 'They are available after practice only if no team meeting is added.',
    wrong: [
      'They are definitely free once practice has finished for the day.',
      'The team meeting has already been added to the schedule this week.',
      'They are skipping practice altogether in order to go to a meeting.',
    ],
  },
]

const exactParaphrase = tpl(
  {
    id: 'path-o-exact-paraphrase',
    name: 'Exact Paraphrase Check',
    skillIds: ['o-listen'],
    bucket: 'observer',
    difficulty: 2,
    variants: exactParaphraseCases.length,
    minutes: 2,
  },
  (rng, seed) => {
    const c = exactParaphraseCases[seed % exactParaphraseCases.length]
    return {
      title: 'Keep every limit intact',
      prompt: `A speaker says:\n\n> ${c.quote}\n\nWhich paraphrase preserves the exact meaning without adding a claim?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Underline qualifiers such as only, but, if, unless, and unknown.',
        'Reject any option that turns a possibility or condition into a fact.',
        `Worked check: ${c.correct}`,
      ],
      explanation: `**${c.correct}** The correct paraphrase keeps the scope, condition, and uncertainty of the original. Listening accurately means compressing words without silently strengthening them.`,
    }
  },
)

const observationCount = tpl(
  {
    id: 'path-o-observation-count',
    name: 'Selective Attention Count',
    skillIds: ['o-obsinf', 'o-recall'],
    bucket: 'observer',
    difficulty: 2,
    variants: 12,
    minutes: 2.5,
    transfer: true,
  },
  (rng) => {
    const colors = ['blue', 'green', 'amber']
    const states = ['open', 'closed']
    const rows = Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      color: colors[rint(rng, 0, colors.length - 1)],
      state: states[rint(rng, 0, states.length - 1)],
      count: rint(rng, 1, 9),
    }))
    const targetColor = colors[rint(rng, 0, colors.length - 1)]
    const targetState = states[rint(rng, 0, states.length - 1)]
    const matches = rows.filter((row) => row.color === targetColor && row.state === targetState && row.count % 2 === 0)
    return {
      title: 'Count only what fits',
      prompt: `Event log:\n\n${rows.map((row) => `${row.id}. ${row.color} | ${row.state} | ${row.count}`).join('\n')}\n\nHow many rows are **${targetColor}**, **${targetState}**, and have an **even** final number?`,
      answer: numeric(matches.length),
      hints: [
        'There are three filters. Apply them one at a time instead of scanning for a general resemblance.',
        `First keep only ${targetColor}; then ${targetState}; then test divisibility by 2.`,
        `Matching row numbers: ${matches.length ? matches.map((row) => row.id).join(', ') : 'none'}.`,
      ],
      explanation: `The answer is **${matches.length}**. The matching rows are ${matches.length ? matches.map((row) => row.id).join(', ') : 'none'}. A fixed scan order prevents attention from accepting rows that satisfy only two of the three rules.`,
    }
  },
)

const evidenceBoundaryCases = [
  {
    prompt: 'A mug is beside a laptop. The laptop screen is dark.',
    correct: 'A mug is sitting right beside the laptop.',
    wrong: ['The laptop battery has run all the way down.', 'The owner forgot to put it on charge last night.', 'The mug still has cold coffee sitting in it.'],
  },
  {
    prompt: 'At 2:10, the door opened and Lee entered carrying a folded umbrella.',
    correct: 'Lee entered at 2:10 carrying a folded umbrella.',
    wrong: ['It must have been raining outside at the time.', 'Lee had only just bought that umbrella today.', 'Lee arrived later than they were meant to.'],
  },
  {
    prompt: 'The message shows a sent time of 8:03 and no reply beneath it.',
    correct: 'No reply is displayed beneath the 8:03 message.',
    wrong: ['The recipient is deliberately ignoring the sender.', 'The recipient read the message at about 8:04.', 'The friendship is in some kind of trouble.'],
  },
  {
    prompt: 'Four chairs face the board; one chair has a green backpack on it.',
    correct: 'A green backpack is on one of the four chairs.',
    wrong: ['The backpack belongs to one of the students.', 'Somebody left the room in rather a hurry.', 'The other three chairs are not being used.'],
  },
  {
    prompt: 'The scoreboard reads 12-12 with 40 seconds remaining.',
    correct: 'The displayed score is tied with 40 seconds left.',
    wrong: ['The home team is going to win this one.', 'Both teams have played about equally well.', 'A timeout is about to be called by someone.'],
  },
  {
    prompt: 'A plant has three yellow leaves and seven green leaves.',
    correct: 'Three leaves are yellow and seven are green.',
    wrong: ['The plant has been given too much water.', 'The plant is in the process of dying.', 'The room it sits in is far too dark.'],
  },
]

const evidenceBoundary = tpl(
  {
    id: 'path-o-evidence-boundary',
    name: 'Evidence Boundary',
    skillIds: ['o-obsinf', 'o-bias'],
    bucket: 'observer',
    difficulty: 2,
    variants: evidenceBoundaryCases.length,
    minutes: 2,
    calibration: true,
  },
  (rng, seed) => {
    const c = evidenceBoundaryCases[seed % evidenceBoundaryCases.length]
    return {
      title: 'Report only the visible facts',
      prompt: `${c.prompt}\n\nWhich statement stays completely inside the evidence?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Ask whether a camera and clock could verify every word.',
        'Causes, ownership, intentions, and predictions usually cross the evidence boundary.',
        `Worked check: ${c.correct}`,
      ],
      explanation: `**${c.correct}** It restates only supplied details. The other choices may be plausible, but plausibility is not observation; each adds an unverified cause, owner, intention, or prediction.`,
    }
  },
)

const memorySequences = [
  ['copper key', 'blue kite', 'glass jar', 'paper crown', 'red leaf'],
  ['north gate', 'silent bell', 'third stair', 'yellow door', 'stone bird'],
  ['orbit', 'harbor', 'cedar', 'mirror', 'lantern'],
  ['ticket 42', 'green ribbon', 'small drum', 'silver spoon', 'map corner'],
  ['river', 'clock', 'acorn', 'violin', 'snowflake'],
  ['triangle 7', 'violet cup', 'iron bridge', 'white glove', 'moon card'],
]

const sequenceRecall = tpl(
  {
    id: 'path-o-sequence-recall',
    name: 'Sequence Recall Check',
    skillIds: ['o-memory', 'o-recall'],
    bucket: 'observer',
    difficulty: 3,
    variants: memorySequences.length,
    minutes: 3,
    kind: 'multi',
  },
  (rng, seed) => {
    const sequence = memorySequences[seed % memorySequences.length]
    return {
      title: 'Encode, hide, rebuild',
      prompt: 'Study five items in order. When the study card closes, rebuild the exact sequence.',
      parts: [
        {
          study: `Create one connected mental movie in this order:\n\n**${sequence.join(' -> ')}**`,
          studySeconds: 35,
          prompt: 'Put the five items back in their original order.',
          answer: orderAnswer(rng, sequence),
          explanation: `The stored order was **${sequence.join(' -> ')}**. A connected image gives each item a retrieval cue from the one before it.`,
        },
      ],
      hints: [
        'Make each object interact with the next instead of picturing five separate flashcards.',
        'Replay the movie from its first image and let each action cue the next object.',
        `Answer key after recall: ${sequence.join(' -> ')}.`,
      ],
      explanation: `The correct sequence is **${sequence.join(' -> ')}**. Because the answer is an ordering key, the app checks every position rather than asking you to judge your own recall.`,
    }
  },
)

// ------------------------------------------------------------- Investigator

const logicCases = [
  {
    rules: 'All kestrels are birds. No birds are mammals.',
    claim: 'No kestrels are mammals.',
    correct: 'Valid: the two rules form a chain that excludes every kestrel from mammals.',
    wrong: ['Invalid: some of the birds might be mammals.', 'Invalid: we would first need to know how many kestrels actually exist.', 'Valid only if kestrels are able to fly.'],
  },
  {
    rules: 'If the sensor is wet, its light turns red. The light is red.',
    claim: 'The sensor is wet.',
    correct: 'Invalid: another cause could also make the light red.',
    wrong: ['Valid, by simply reversing the if-then rule.', 'Valid, because red always means that it is wet.', 'Invalid only when the sensor happens to be broken.'],
  },
  {
    rules: 'If a file is encrypted, it cannot be read without a key. This file can be read without a key.',
    claim: 'This file is not encrypted.',
    correct: 'Valid by contrapositive: readable without a key rules out encryption under the rule.',
    wrong: ['Invalid, because a contrapositive has to reverse both of the parts of the rule.', 'Invalid, because the file in question might be large.', 'Valid only if the key is genuinely secret.'],
  },
  {
    rules: 'Some musicians are coders. All coders solve puzzles.',
    claim: 'Some musicians solve puzzles.',
    correct: 'Valid: the musicians who are coders must also solve puzzles.',
    wrong: ['Invalid, because not all of the musicians are coders.', 'Invalid, because "some" does not mean "any".', 'Valid only if all of the puzzle solvers are coders.'],
  },
  {
    rules: 'No blue tokens are heavy. Some square tokens are heavy.',
    claim: 'Some square tokens are not blue.',
    correct: 'Valid: any heavy square token cannot be blue.',
    wrong: ['Invalid because square and blue are unrelated.', 'Invalid unless every square is heavy.', 'Valid only if every token is square.'],
  },
  {
    rules: 'If practice happens, accuracy improves. Practice did not happen.',
    claim: 'Accuracy did not improve.',
    correct: 'Invalid: accuracy might improve for a different reason.',
    wrong: ['Valid by denying the first part.', 'Valid because practice is necessary for all improvement.', 'Invalid only if accuracy was already perfect.'],
  },
]

const logicCounterexample = tpl(
  {
    id: 'path-i-logic-counterexample',
    name: 'Validity and Counterexample',
    skillIds: ['i-logic'],
    bucket: 'investigator',
    difficulty: 3,
    variants: logicCases.length,
    minutes: 2.5,
  },
  (rng, seed) => {
    const c = logicCases[seed % logicCases.length]
    return {
      title: 'Does the conclusion have to follow?',
      prompt: `Rules: **${c.rules}**\n\nClaim: **${c.claim}**\n\nWhich verdict is correct?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'A valid claim must be true in every world where the rules are true.',
        'For an if-then rule, affirming the result and denying the condition are both danger zones.',
        `Worked verdict: ${c.correct}`,
      ],
      explanation: `**${c.correct}** Validity is about necessity, not whether the claim sounds likely. One possible counterexample is enough to defeat an invalid argument.`,
    }
  },
)

const bayesCounts = tpl(
  {
    id: 'path-i-bayes-counts',
    name: 'Natural-Frequency Update',
    skillIds: ['i-bayes'],
    bucket: 'investigator',
    difficulty: 4,
    variants: 6,
    minutes: 3,
  },
  (rng) => {
    const population = 10_000
    const baseRate = [1, 2, 5, 10][rint(rng, 0, 3)]
    const sensitivity = [80, 90][rint(rng, 0, 1)]
    const falsePositiveRate = [1, 2, 5, 10][rint(rng, 0, 3)]
    const real = (population * baseRate) / 100
    const trueFlags = (real * sensitivity) / 100
    const falseFlags = ((population - real) * falsePositiveRate) / 100
    const allFlags = trueFlags + falseFlags
    return {
      title: 'Count the flagged worlds',
      prompt: `Out of ${population.toLocaleString()} cases, ${baseRate}% truly have a condition. A screen flags ${sensitivity}% of true cases and ${falsePositiveRate}% of cases without it.\n\nAmong all flagged cases, what fraction truly have the condition? Give a simplified fraction.`,
      answer: fraction(trueFlags, allFlags),
      hints: [
        `Start with counts: ${real} true cases and ${population - real} cases without the condition.`,
        `The screen flags ${trueFlags} true cases and ${falseFlags} false positives.`,
        `Use true flags / all flags = ${trueFlags} / ${allFlags}, then simplify.`,
      ],
      explanation: `There are **${trueFlags} true flags** and **${falseFlags} false flags**, so the answer is ${trueFlags}/${allFlags}, simplified by the app's fraction key. Natural counts prevent the base rate from disappearing behind a percentage.`,
    }
  },
)

const separatorCases = [
  {
    hypotheses: 'The plant droops because it lacks water OR because its roots are waterlogged.',
    correct: 'Check soil moisture near the roots before adding anything.',
    wrong: ['Add a good deal more water immediately.', 'Move the plant into a prettier pot.', 'Ask somebody else whether the plant is looking a bit sad.'],
  },
  {
    hypotheses: 'The app is slow because the network is slow OR because one local calculation is expensive.',
    correct: 'Run the same action offline and compare its timing.',
    wrong: ['Change the colours used in the app.', 'Restart it without recording any timing.', 'Ask one of the users whether it feels faster today.'],
  },
  {
    hypotheses: 'The class score fell because the new unit is harder OR because fewer students completed the test.',
    correct: 'Compare difficulty on common questions and completion rates separately.',
    wrong: ['Look only at the average across the whole class.', 'Assume that the new unit is simply harder.', 'Remove the single lowest score from the set and then stop there.'],
  },
  {
    hypotheses: 'A light fails because the bulb is dead OR because the outlet has no power.',
    correct: 'Test a known-working device in the outlet, then test the bulb elsewhere.',
    wrong: ['Buy a brighter bulb and try that.', 'Flip the switches at random until something or other finally changes.', 'Conclude that both of them are broken.'],
  },
  {
    hypotheses: 'A teammate missed messages because notifications were off OR because they chose not to answer.',
    correct: 'Ask neutrally and check whether notifications were delivered.',
    wrong: ['Send a rather angrier message back.', 'Assume that the silence was entirely intentional.', 'Ask some other people to have a guess at what their motive was.'],
  },
  {
    hypotheses: 'Seedlings differ because of light OR because of soil type.',
    correct: 'Use the same soil across light levels, then repeat with light held constant across soils.',
    wrong: ['Change both the light and the soil at the same time.', 'Measure only the tallest of the seedlings.', 'Choose whichever of the two explanations happens to sound the more scientific one.'],
  },
]

const separatingTest = tpl(
  {
    id: 'path-i-separating-test',
    name: 'Separating Test',
    skillIds: ['i-hypo'],
    bucket: 'investigator',
    difficulty: 3,
    variants: separatorCases.length,
    minutes: 2.5,
    transfer: true,
  },
  (rng, seed) => {
    const c = separatorCases[seed % separatorCases.length]
    return {
      title: 'Choose the test that separates',
      prompt: `${c.hypotheses}\n\nWhich next move best separates the rival explanations?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Predict what each hypothesis expects before choosing a test.',
        'Prefer one observation whose outcomes point in different directions.',
        `Best discriminator: ${c.correct}`,
      ],
      explanation: `**${c.correct}** A useful test creates different expected results under the competing hypotheses. More information is not automatically better; discriminating information is.`,
    }
  },
)

const payoffChoice = tpl(
  {
    id: 'path-i-payoff-choice',
    name: 'Payoff Table Check',
    skillIds: ['i-game', 'i-forecast'],
    bucket: 'investigator',
    difficulty: 3,
    variants: 12,
    minutes: 3,
  },
  (rng) => {
    const pLeft = [20, 40, 60, 80][rint(rng, 0, 3)]
    const safe = rint(rng, 3, 8)
    const leftPayoff = rint(rng, 8, 15)
    const rightPayoff = rint(rng, 0, 4)
    const pL = round(pLeft / 100, 2)
    const pR = round(1 - pLeft / 100, 2)
    const riskyEv = round(pL * leftPayoff + pR * rightPayoff, 2)
    const correct = riskyEv > safe ? `Choose Flexible: expected payoff ${riskyEv}` : riskyEv < safe ? `Choose Steady: expected payoff ${safe}` : `Either choice: both have expected payoff ${safe}`
    return {
      title: 'Read the payoff table',
      prompt: `Another player chooses Left with probability ${pLeft}% and Right otherwise.\n\n- **Steady** pays ${safe} either way.\n- **Flexible** pays ${leftPayoff} against Left and ${rightPayoff} against Right.\n\nWhich choice has the higher expected payoff?`,
      answer: mcq(rng, correct, [
        `Choose Steady: expected payoff ${safe}`,
        `Choose Flexible: expected payoff ${riskyEv}`,
        `Either choice: both have expected payoff ${safe}`,
        'Choose Flexible because its best outcome is highest, without averaging.',
      ]),
      hints: [
        'Multiply each Flexible payoff by the probability of meeting that column.',
        `Flexible = ${pL} x ${leftPayoff} + ${pR} x ${rightPayoff}. Compare that with ${safe}.`,
        `Flexible EV is ${riskyEv}; Steady EV is ${safe}.`,
      ],
      explanation: `**${correct}** Flexible averages to ${riskyEv}; Steady remains ${safe}. Expected payoff evaluates the whole distribution instead of choosing by the most vivid best or worst cell.`,
    }
  },
)

// ---------------------------------------------------------------- Strategist

const planOrders = [
  ['Confirm the submission requirements', 'Draft the main sections', 'Get feedback on the draft', 'Revise weak sections', 'Submit and verify receipt'],
  ['Check the event date and constraints', 'Reserve the location', 'Assign owners to tasks', 'Run a final readiness check', 'Hold the event'],
  ['Define what successful repair looks like', 'Reproduce the failure', 'Identify the smallest likely cause', 'Test the repair', 'Document what changed'],
  ['Read the rubric and due date', 'Break the project into deliverables', 'Schedule the hardest deliverable first', 'Combine and review the pieces', 'Turn it in'],
  ['Choose the measurable goal', 'Record the starting value', 'Make one controlled change', 'Measure the result', 'Decide whether to keep the change'],
  ['Verify the destination and arrival time', 'Choose a route', 'Add a delay buffer', 'Leave at the calculated time', 'Confirm arrival'],
]

const backwardOrder = tpl(
  {
    id: 'path-st-backward-order',
    name: 'Dependency Order',
    skillIds: ['st-decomp'],
    bucket: 'strategist',
    difficulty: 2,
    variants: planOrders.length,
    minutes: 3,
  },
  (rng, seed) => {
    const steps = planOrders[seed % planOrders.length]
    return {
      title: 'Put dependencies before dependents',
      prompt: 'Arrange the plan so every step has the information or output it needs from earlier steps.',
      answer: orderAnswer(rng, steps),
      hints: [
        'Find the final visible result, then ask what must exist immediately before it.',
        'Requirements and measurements usually come before drafting or changing.',
        `Dependency chain: ${steps.join(' -> ')}.`,
      ],
      explanation: `The dependency-safe order is **${steps.join(' -> ')}**. Backward planning starts from the finished condition, identifies its prerequisites, and then executes those prerequisites forward.`,
    }
  },
)

const strategyEv = tpl(
  {
    id: 'path-st-expected-value',
    name: 'Decision Tree Value',
    skillIds: ['st-ev'],
    bucket: 'strategist',
    difficulty: 3,
    variants: 12,
    minutes: 3,
  },
  (rng) => {
    const successChance = rint(rng, 2, 8) * 10
    const successValue = rint(rng, 8, 20)
    const failureValue = -rint(rng, 1, 8)
    // 1 - 0.8 is 0.19999999999999996 in binary floating point. Round the
    // complement before it is ever printed into a hint or explanation.
    const pWin = round(successChance / 100, 2)
    const pLose = round(1 - successChance / 100, 2)
    const answer = round(pWin * successValue + pLose * failureValue, 2)
    return {
      title: 'Price both branches',
      prompt: `A plan has a ${successChance}% chance of producing ${successValue} value points and otherwise produces ${failureValue} points. What is its expected value?`,
      answer: numeric(answer, { tolerance: 0.01 }),
      hints: [
        'Expected value = probability x value, added across every branch.',
        `Compute ${pWin} x ${successValue} + ${pLose} x (${failureValue}).`,
        `The result is ${answer} value points.`,
      ],
      explanation: `The expected value is **${answer}**: (${pWin} x ${successValue}) + (${pLose} x ${failureValue}). Keeping the failure value signed prevents a decision tree from hiding its downside.`,
    }
  },
)

const estimateBuffer = tpl(
  {
    id: 'path-st-estimate-buffer',
    name: 'Evidence-Based Time Buffer',
    skillIds: ['st-estimate', 'st-premortem'],
    bucket: 'strategist',
    difficulty: 3,
    variants: 12,
    minutes: 2.5,
  },
  (rng) => {
    const middle = rint(rng, 4, 12) * 5
    const sorted = [middle - 10, middle - 5, middle, middle + 5, middle + 15]
    const durations = shuffle(rng, sorted)
    const bufferPercent = [20, 30, 40][rint(rng, 0, 2)]
    const estimate = Math.ceil((middle * (1 + bufferPercent / 100)) / 5) * 5
    return {
      title: 'Use history, then armor the plan',
      prompt: `Your last five comparable tasks took **${durations.join(', ')} minutes**. Use the median, add a ${bufferPercent}% uncertainty buffer, then round up to the next 5 minutes. What should you schedule?`,
      answer: numeric(estimate, { unit: 'minutes' }),
      hints: [
        'Sort the five times; the median is the middle value, not the average.',
        `The sorted middle is ${middle}. Multiply it by ${1 + bufferPercent / 100}.`,
        `Round upward to a 5-minute boundary: ${estimate} minutes.`,
      ],
      explanation: `Schedule **${estimate} minutes**. The median is ${middle}; adding ${bufferPercent}% gives ${round(middle * (1 + bufferPercent / 100), 2)}, which rounds up to ${estimate}. Tracking actuals turns planning fallacy into a correctable estimate.`,
    }
  },
)

const cleanStrategyCases = [
  {
    situation: 'Your team can win a vote by hiding the meeting time from two opponents.',
    correct: 'Share the time equally and improve the proposal enough to win an informed vote.',
    wrong: [
      'Hide the time from them, because the outcome of the vote genuinely matters.',
      'Send them a misleading time now, then apologise for the mix-up afterwards.',
      'Tell everyone the time but leave those two off the final reminder message.',
    ],
  },
  {
    situation: 'A study partner asks for your finished answers before attempting the work.',
    correct: 'Offer a hint or compare methods after they make a real attempt.',
    wrong: [
      'Send the finished answers over, but ask them to change the wording first.',
      'Trade the answers for a favour of similar size from them later on.',
      'Say yes, then pretend the file simply failed to attach to the message.',
    ],
  },
  {
    situation: 'A club wants more sign-ups and considers pre-checking a consent box.',
    correct: 'Leave consent unchecked and make the value of joining clear enough for an active yes.',
    wrong: [
      'Pre-check the box, on the grounds that anybody can still opt out later.',
      'Keep the box unchecked but set the choice in noticeably smaller text.',
      'Enrol everyone in a free trial first and tell them about it afterwards.',
    ],
  },
  {
    situation: 'You notice a competitor made an arithmetic error that helps your side in a public comparison.',
    correct: 'Correct the error publicly and argue from the accurate comparison.',
    wrong: [
      'Stay silent about the error, since you were not the one who made it.',
      'Repeat the mistaken number yourself, without attributing it to them.',
      'Point the error out, but only once the decision has already been made.',
    ],
  },
  {
    situation: 'A deadline can be met only if a teammate works late without being asked.',
    correct: 'Ask explicitly, offer a real no, and shrink scope or move the deadline if needed.',
    wrong: [
      'Assign them the extra work and announce it to the team as already decided.',
      'Bring up how much the rest of the team has put in, and let guilt do the work.',
      'Wait until it is late enough in the day that refusing is no longer realistic.',
    ],
  },
  {
    situation: 'A shortcut would collect classmates personal data that is not needed for the project.',
    correct: 'Collect only the minimum necessary data and explain its use before consent.',
    wrong: [
      'Collect all of it now, on the chance that some of it proves useful later.',
      'Strip the names out but quietly keep identifiers that can re-link the rows.',
      'Run the analysis first and ask the class to forgive the shortcut afterwards.',
    ],
  },
]

const ethicalConstraint = tpl(
  {
    id: 'path-st-ethical-constraint',
    name: 'Daylight Strategy',
    skillIds: ['st-ethics', 'st-premortem'],
    bucket: 'strategist',
    difficulty: 3,
    variants: cleanStrategyCases.length,
    minutes: 2.5,
  },
  (rng, seed) => {
    const c = cleanStrategyCases[seed % cleanStrategyCases.length]
    return {
      title: 'Choose the plan that survives daylight',
      prompt: `${c.situation}\n\nWhich strategy protects honesty, consent, and other people's agency?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Ask whether every affected person could know the method and still call the process fair.',
        'A robust plan does not require secrecy, trapped consent, or manufactured pressure.',
        `Clean strategy: ${c.correct}`,
      ],
      explanation: `**${c.correct}** Ethical constraints are design requirements, not decorations. A strategy that depends on hiding its method carries reputational, relational, and practical failure modes inside the plan.`,
    }
  },
)

// ----------------------------------------------------------------- Guardian

const readingSets = [
  [
    { text: 'Avery looked at the clock twice during the conversation.', category: 0 },
    { text: 'Avery may be worried about being late.', category: 1 },
    { text: 'Avery wants the conversation to end.', category: 2 },
    { text: 'Avery did not say why they checked the time.', category: 0 },
  ],
  [
    { text: 'The reply contains only the word "okay."', category: 0 },
    { text: 'The sender may be busy or upset.', category: 1 },
    { text: 'The sender is definitely angry.', category: 2 },
    { text: 'No tone of voice is available in the text.', category: 0 },
  ],
  [
    { text: 'Morgan spoke more quietly after the interruption.', category: 0 },
    { text: 'Morgan may have felt discouraged.', category: 1 },
    { text: 'Morgan dislikes everyone in the group.', category: 2 },
    { text: 'The reason for the volume change was not stated.', category: 0 },
  ],
  [
    { text: 'Kai declined the invitation and thanked the host.', category: 0 },
    { text: 'Kai may have another commitment.', category: 1 },
    { text: 'Kai never enjoys spending time with the group.', category: 2 },
    { text: 'No reason for declining was included.', category: 0 },
  ],
  [
    { text: 'The teammate erased their first answer and wrote a new one.', category: 0 },
    { text: 'They may have noticed a mistake.', category: 1 },
    { text: 'They copied the answer from someone else.', category: 2 },
    { text: 'The source of the new answer was not observed.', category: 0 },
  ],
  [
    { text: 'Rowan stopped speaking when the teacher entered.', category: 0 },
    { text: 'Rowan may have been finishing a private story.', category: 1 },
    { text: 'Rowan was planning something harmful.', category: 2 },
    { text: 'The conversation topic is unknown.', category: 0 },
  ],
]

const readingVsVerdict = tpl(
  {
    id: 'path-h-reading-vs-verdict',
    name: 'Reading, Not Verdict',
    skillIds: ['h-emotion'],
    bucket: 'insight',
    difficulty: 2,
    variants: readingSets.length,
    minutes: 3,
  },
  (_rng, seed) => ({
    title: 'Keep readings provisional',
    prompt: 'Classify each sentence as **Observed**, a **Possible reading**, or an **Unsupported verdict**.',
    answer: {
      type: 'classify',
      categories: ['Observed', 'Possible reading', 'Unsupported verdict'],
      statements: readingSets[seed % readingSets.length],
    },
    hints: [
      'Observed statements describe visible words or actions without a hidden motive.',
      'A possible reading uses uncertainty honestly; a verdict pretends to know a mind from thin evidence.',
      'Check for words such as may versus definitely, always, or never.',
    ],
    explanation: 'Observed facts stay camera-checkable. Possible readings remain hypotheses that invite a respectful question. Unsupported verdicts convert limited behavior into certainty about motive or character.',
  }),
)

const pressureCases = [
  {
    message: 'Answer in the next two minutes or I will ask someone who actually cares.',
    correct: 'Manufactured urgency plus guilt pressure',
    defense: 'Pause; urgency does not create an obligation. Reply only when ready.',
    wrong: ['Neutral scheduling of a genuinely urgent thing', 'Evidence-based persuasion you can check', 'A normal apology for the short notice given'],
  },
  {
    message: 'Everyone already shared their password with me. Why are you making this weird?',
    correct: 'False social proof used to push a security boundary',
    defense: 'Do not share credentials; verify through the official channel and tell a trusted adult or administrator.',
    wrong: ['A harmless popularity poll that nothing much depends upon', 'A technical support procedure of the kind real services do use', 'A fair group rule that everybody in the chat already agreed to'],
  },
  {
    message: 'Keep this between us. Other people would not understand our special friendship.',
    correct: 'Isolation and secrecy pressure',
    defense: 'Safety outranks secrecy: stop, preserve the message, and involve a trusted adult.',
    wrong: ['Ordinary respect for a confidence', 'A surprise party that must stay quiet', 'Ordinary confidentiality between friends'],
  },
  {
    message: 'The trial is free. Cancellation requires a weekday phone interview, but that is no big deal.',
    correct: 'Dark pattern: easy in, costly out',
    defense: 'Judge the exit before entering and decline designs that trap consent behind friction.',
    wrong: ['A standard security feature', 'A loyalty reward for staying', 'A neutral comparison of prices'],
  },
  {
    message: 'You are the only person smart enough to do my entire assignment for me.',
    correct: 'Flattery tied to a boundary crossing',
    defense: 'Separate compliment from request: offer explanation, not completed work.',
    wrong: ['Constructive feedback on work', 'A fair exchange of favours', 'A plan for studying together'],
  },
  {
    message: 'If you leave the group chat, I will tell everyone what you said last month.',
    correct: 'Threat and coercion',
    defense: 'Do not negotiate alone; save evidence, block or report, and get trusted help.',
    wrong: ['Friendly accountability', 'A normal consequence', 'A misunderstanding about notifications'],
  },
]

const pressureDefense = tpl(
  {
    id: 'path-h-pressure-defense',
    name: 'Pressure Defense Check',
    skillIds: ['h-influence', 'h-boundary'],
    bucket: 'insight',
    difficulty: 3,
    variants: pressureCases.length,
    minutes: 2.5,
    calibration: true,
  },
  (rng, seed) => {
    const c = pressureCases[seed % pressureCases.length]
    return {
      title: 'Name the pressure to disarm it',
      prompt: `Message:\n\n> ${c.message}\n\nWhat tactic is operating?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Look for a lever that removes time, choice, outside checking, or the ability to say no.',
        'The emotional discomfort may be the mechanism, not evidence that you owe compliance.',
        `Tactic: ${c.correct}. Defense: ${c.defense}`,
      ],
      explanation: `**${c.correct}.** ${c.defense} Recognizing the mechanism creates a pause between pressure and action, which restores choice.`,
    }
  },
)

const boundaryCases = [
  {
    situation: 'A classmate repeatedly asks to copy your answers after you already said no.',
    correct: 'I am not sharing answers. I can explain the first step after you try it.',
    wrong: ['Maybe later on, if you keep asking me about it enough.', 'You are lazy about this and honestly everybody already knows it.', 'Fine, take them this once, but do not ever ask me again.'],
  },
  {
    situation: 'A friend keeps posting photos of you after you asked them not to.',
    correct: 'Do not post photos of me. If another goes up, I will report it and leave the event.',
    wrong: ['I suppose it is fine to leave it up, as long as the photo is a decent one.', 'Delete every bit of it right now or I will get your account taken down.', 'Say nothing at all and just hope that they notice how you feel.'],
  },
  {
    situation: 'Someone keeps interrupting your study block with non-urgent messages.',
    correct: 'I am studying until 7. I will mute messages and reply after that.',
    wrong: ['Stop being annoying.', 'I will answer just this once every time.', 'Turn off the phone without telling anyone when you will return.'],
  },
  {
    situation: 'A teammate makes the same personal joke after you asked them to stop.',
    correct: 'That joke is not okay with me. If it continues, I will step away and involve the coach.',
    wrong: ['Make an even harsher joke back at them so that they drop it.', 'Laugh along with all of it, so that nobody decides that you are too sensitive.', 'Give them a ten-minute explanation while they argue with each point.'],
  },
  {
    situation: 'An online contact asks you to hide your conversations from trusted adults.',
    correct: 'Stop replying, keep the messages, block or report the account, and tell a trusted adult now.',
    wrong: ['Promise that you will keep it secret, but ask them to be nicer about it.', 'Argue with them until they finally admit that the request was wrong to make.', 'Delete all of the messages so that nobody sees them, and handle it entirely alone.'],
  },
  {
    situation: 'A group keeps pressuring you to join an activity that feels unsafe.',
    correct: 'I am not doing that. I am leaving now and contacting someone I trust.',
    wrong: ['Stay nearby anyway so that nobody gets to call you scared of it.', 'Join in briefly and then leave again if it starts getting worse.', 'Insult all of them on your way out so they know what you think.'],
  },
]

const boundaryLine = tpl(
  {
    id: 'path-h-boundary-line',
    name: 'Boundary Line Check',
    skillIds: ['h-boundary'],
    bucket: 'insight',
    difficulty: 3,
    variants: boundaryCases.length,
    minutes: 2.5,
  },
  (rng, seed) => {
    const c = boundaryCases[seed % boundaryCases.length]
    return {
      title: 'State the limit and your action',
      prompt: `${c.situation}\n\nWhich response is clear, proportionate, and enforceable?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'A boundary controls your action, not another person by force.',
        'Prefer one clear limit and one action you can actually take; safety cases call for outside help.',
        `Strong line: ${c.correct}`,
      ],
      explanation: `**${c.correct}** It names the limit and a proportionate action without insult or endless negotiation. Where secrecy, threats, or physical risk appear, involving trusted help is part of the correct boundary.`,
    }
  },
)

/*
 * Each sequence now carries the SITUATION it belongs to.
 *
 * Reported by a learner: "The question didn't specify the situation, what
 * situation were you in? That decides what the answer to this question will
 * be." Exactly right — the steps mentioned "the message" and "the account"
 * while the prompt described no scene at all, so the learner had to reverse-
 * engineer the scenario from the options.
 *
 * The same report also said some steps "can be switched and are both a
 * decently correct answer", which was true of the online one: it had blocking
 * before reporting, and either order is defensible in real life. Each step is
 * now worded so its position is forced by something the previous step makes
 * possible — save before anything is hidden, report while the messages still
 * exist, block once they are no longer needed on screen.
 */
const deescalationOrders: { situation: string; steps: string[] }[] = [
  {
    situation: 'A disagreement with a friend has got loud, and you are both talking over each other.',
    steps: ['Pause and lower your own voice', 'Name the concrete issue without insult', 'Ask one specific question', 'Agree on the next small action', 'Leave or get help if safety worsens'],
  },
  {
    situation: 'Someone you barely know is sending you nasty messages online, and more keep arriving.',
    steps: [
      'Stop typing the reply you were about to send',
      'Screenshot the messages while they are still visible to you',
      'Report the account, which needs those messages to still exist',
      'Block the account so that nothing new arrives',
      'Tell a trusted adult if it carries on after that',
    ],
  },
  {
    situation: 'A family member is upset with you and has said something about you that is not true.',
    steps: ['Take one slow breath', 'Acknowledge the feeling without agreeing to a false claim', 'Move from accusations to observable facts', 'Offer one workable next step', 'Revisit later if either person is still flooded'],
  },
  {
    situation: 'Someone keeps pressuring you to do something you have already said you do not want to do.',
    steps: ['Notice the pressure signal in your body', 'Create physical or digital distance', 'State a short no', 'Contact a trusted person', 'Document and report repeated threats'],
  },
  {
    situation: 'You and a teammate start arguing in front of the rest of the group.',
    steps: ['Stop the public argument', 'Move to a calmer setting if safe', 'Let each person state one fact at a time', 'Choose a reversible next step', 'Check later whether the agreement held'],
  },
  {
    situation: 'A confrontation nearby is escalating and someone could get hurt.',
    steps: ['Put down anything that could escalate harm', 'Create distance and use a steady voice', 'Do not debate while danger is rising', 'Get a responsible adult or emergency help', 'Record details only after everyone is safe'],
  },
]

const deescalationOrder = tpl(
  {
    id: 'path-h-deescalation-order',
    name: 'De-escalation Sequence',
    skillIds: ['h-boundary', 'h-emotion'],
    bucket: 'insight',
    difficulty: 3,
    variants: deescalationOrders.length,
    minutes: 3,
  },
  (rng, seed) => {
    const scene = deescalationOrders[seed % deescalationOrders.length]
    const steps = scene.steps
    return {
      title: 'Sequence the safer response',
      prompt: `**The situation:** ${scene.situation}\n\nArrange these actions from the first stabilizing move to the final follow-through.`,
      answer: orderAnswer(rng, steps),
      hints: [
        'Regulate and create safety before trying to solve the disagreement.',
        'Move from facts to one small action; reporting and follow-up come after immediate stabilization.',
        `Safe sequence: ${steps.join(' -> ')}.`,
      ],
      explanation: `The sequence is **${steps.join(' -> ')}**. De-escalation is ordered: stabilize first, clarify second, choose a bounded action third, and escalate to help whenever safety requires it.`,
    }
  },
)

export const PATH_QUESTION_TEMPLATES: ItemTemplate[] = [
  exactParaphrase,
  observationCount,
  evidenceBoundary,
  sequenceRecall,
  logicCounterexample,
  bayesCounts,
  separatingTest,
  payoffChoice,
  backwardOrder,
  strategyEv,
  estimateBuffer,
  ethicalConstraint,
  readingVsVerdict,
  pressureDefense,
  boundaryLine,
  deescalationOrder,
]
