/**
 * Strategist Lab — planning, decisions, estimation, ethical strategy.
 * Boundary: strategy is trained for goals achieved WITH honesty, consent,
 * and mutual benefit — never domination, deception, or coercion.
 */
import type { ItemTemplate } from '../../domain/types'
import { rint } from '../../engine/rng'
import { fixed, mcq, numeric, round, tpl } from '../lib'

// ---------- Backward planning ----------

const backwardPlan = tpl(
  { id: 'st-backward-plan', name: 'Backward Plan', skillIds: ['st-decomp'], bucket: 'strategist', difficulty: 2, variants: 3, minutes: 3 },
  (_rng, seed) => {
    const cases = [
      {
        goal: 'Deliver a 5-minute history presentation on Friday.',
        steps: ['Pick the topic and check it with the teacher', 'Gather sources and take notes', 'Draft the slides', 'Rehearse out loud and time it', 'Fix slides based on the rehearsal'],
        note: 'Rehearsal must precede the fix-up pass it feeds; sources cannot be gathered before a topic exists. Backward: "to present Friday I need a rehearsed deck → to rehearse I need a draft → to draft I need notes → to take notes I need a topic."',
      },
      {
        goal: 'Cook dinner for the family at 6 pm.',
        steps: ['Choose the recipe and check ingredients', 'Shop for the missing ingredients', 'Prep (wash, chop, measure)', 'Cook the dish', 'Set the table while it simmers'],
        note: 'Shopping before choosing a recipe buys the wrong things; prep before shopping stalls on missing items. The parallel step (table-setting) slots into the simmer — backward planning also reveals what can overlap.',
      },
      {
        goal: 'Be ready for Saturday morning\'s chess tournament.',
        steps: ['Confirm registration and round times', 'Review your two main openings', 'Play two practice games with those openings', 'Pack (water, snack, charged phone, board notation sheet)', 'Sleep early Friday night'],
        note: 'Practice games test the review; packing and sleep anchor to Friday evening. Working backward from the goal exposes the real deadline: preparation ends Friday night, not Saturday morning.',
      },
    ]
    const c = cases[seed % cases.length]
    const displayOrder = [...c.steps].sort()
    const correct = c.steps.map((s) => displayOrder.indexOf(s))
    return {
      title: 'Order the plan',
      prompt: `GOAL: **${c.goal}**\n\nArrange the steps into the order that actually works.`,
      answer: { type: 'order', options: displayOrder, correct },
      hints: [
        'Start at the goal and ask "what must be true JUST before this?" — repeat until you reach today.',
        'Look for hard dependencies: which steps consume another step\'s output?',
        `Worked path: ${c.steps.join(' → ')}.`,
      ],
      explanation: `${c.steps.join(' → ')}. ${c.note}`,
    }
  },
)

// ---------- Decision trees & EV ----------

const decisionTree = tpl(
  { id: 'st-decision-tree', name: 'Decision Tree Lab', skillIds: ['st-ev'], bucket: 'strategist', difficulty: 3, variants: 12, minutes: 3.5, calibration: true },
  (rng) => {
    const sureShot = rint(rng, 4, 7)
    const riskyWin = rint(rng, 10, 16)
    const pWin = rint(rng, 3, 6) / 10
    const evRisky = round(riskyWin * pWin, 2)
    const better = evRisky > sureShot ? 'risky' : 'safe'
    return {
      title: 'Which line scores more?',
      prompt:
        `End of a quiz-bowl match. You can choose:\n\n` +
        `- **Safe play**: guaranteed **${sureShot} points**.\n` +
        `- **Risky play**: **${Math.round(pWin * 100)}%** chance of **${riskyWin} points**, otherwise 0.\n\n` +
        `What is the expected value of the risky play, in points?`,
      answer: numeric(evRisky, { tolerance: 0.001 }),
      hints: [
        'EV = probability × payoff (the miss contributes 0).',
        `${pWin} × ${riskyWin}.`,
        `Worked path: **${evRisky}** — ${better === 'risky' ? 'higher' : 'lower'} than the safe ${sureShot}.`,
      ],
      explanation:
        `EV(risky) = ${pWin} × ${riskyWin} = **${evRisky}** vs a certain ${sureShot}: on average the ${better} play wins. ` +
        `Two honest caveats the numbers force you to notice: EV describes the LONG RUN (a single match may punish the "right" choice), and if you NEED at least ${Math.max(sureShot, 8)} points to win, the decision flips from maximizing average to maximizing the chance of enough — context can overrule EV.`,
    }
  },
)

const oppCost = tpl(
  { id: 'st-opp-cost', name: 'Opportunity cost', skillIds: ['st-ev'], bucket: 'strategist', difficulty: 2, variants: 3, minutes: 2.5 },
  (rng, seed) => {
    const cases = [
      {
        q: 'You have one free hour before a math test tomorrow and a history test in five days. You are shaky in both. What is the real cost of spending the hour on history?',
        correct: 'The math practice you gave up — the more urgent gain that hour could have bought',
        wrong: ['Nothing — studying anything is always free', 'One hour of clock time', 'The history knowledge you gained'],
        note: 'Cost = the best alternative forgone. With math due first and both shaky, the passed-up math hour is the price paid.',
      },
      {
        q: 'A shop offers you a "free" $10 gift card if you wait in line for 45 minutes. You earn $12/hour tutoring and could be tutoring right now. What does the "free" card cost you?',
        correct: 'About $9 of tutoring time — the card is nearly break-even, not free',
        wrong: ['Nothing, because no money leaves your pocket', '$10, the card\'s value', '45 minutes is not a cost since you were not working'],
        note: '45 min × $12/h = $9 of forgone earnings. "Free" things priced in your time are not free — they are priced in your best alternative.',
      },
      {
        q: 'Your team spent 3 weeks building a game level that tests show players skip. Finishing it needs 1 more week; a new, wanted feature also needs 1 week. What should weigh in the decision?',
        correct: 'Only the NEXT week\'s best use — the 3 spent weeks are gone either way',
        wrong: ['The 3 weeks already invested, which must not be wasted', 'Whoever argued loudest for the level', 'Finishing everything started, as a rule'],
        note: 'Sunk cost: the 3 weeks are identical in both futures, so they cancel out of the comparison. Only the forward-looking week differs.',
      },
    ]
    const c = cases[seed % cases.length]
    return {
      title: 'What does it really cost?',
      prompt: c.q,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Cost is measured in the best thing you COULD have done instead.',
        'Money already spent and time already gone are the same in every option — they cannot break ties.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. ${c.note}`,
    }
  },
)

// ---------- Pre-mortem ----------

const premortem = tpl(
  { id: 'st-premortem', name: 'Pre-Mortem', skillIds: ['st-premortem'], bucket: 'strategist', difficulty: 3, variants: 3, minutes: 4 },
  (_rng, seed) => {
    const cases = [
      {
        plan: 'PLAN: Study for the science final by reviewing one unit per evening for the five nights before the exam.',
        model:
          'Likely failure modes: (1) An evening gets eaten by homework/family plans — no slack night exists. (2) Unit 3 turns out twice as hard as the others — equal time per unit assumed equal difficulty. (3) "Review" drifts into rereading — no retrieval, so the final feels familiar but unanswerable. (4) The plan starts the night AFTER it should — no defined start trigger. Repairs: one buffer night, difficulty-weighted time, self-testing as the review method, a phone reminder to start.',
      },
      {
        plan: 'PLAN: Save $60 in six weeks by putting aside $10 of allowance each week.',
        model:
          'Likely failures: (1) A week with an unmissable expense (gift, outing) breaks the streak and the plan dies of discouragement. (2) The money sits reachable and gets spent. (3) Allowance timing shifts. Repairs: define a catch-up rule in advance ("a missed week splits over the rest"), move savings somewhere annoying to access, save the DAY allowance arrives.',
      },
      {
        plan: 'PLAN: The group will finish the project website the weekend before Monday\'s deadline.',
        model:
          'Likely failures: (1) Weekend availability was never actually confirmed — assumed. (2) All integration lands in one moment; any missing piece blocks everything. (3) No one owns the final merge. (4) A laptop/file-format surprise at the last minute. Repairs: confirm hours now, integrate a rough version FRIDAY, name an owner, do a 10-minute tech check midweek.',
      },
    ]
    const c = cases[seed % cases.length]
    return {
      title: 'Assume it failed — why?',
      prompt: `${c.plan}\n\nIt is the day after the deadline and the plan **failed**. Write down the two or three most likely reasons why, then one repair for each.`,
      answer: {
        type: 'rubric',
        criteria: [
          'I named at least two DIFFERENT failure modes (not one reworded)',
          'At least one failure is boring/logistical (time, access, energy) rather than dramatic',
          'Each failure got a concrete repair that changes the plan now',
          'I checked the plan for hidden assumptions (availability, equal difficulty, motivation)',
        ],
        model: c.model,
      },
      hints: [
        'Write as if the failure already happened: "It failed because…" unlocks more honest answers than "what might go wrong?"',
        'The most common killers are boring: no start trigger, no slack, no owner, resources assumed.',
        'Compare with the model after scoring yourself.',
      ],
      explanation: `Model pre-mortem: ${c.model} Evidence note: prospective hindsight ("it already failed") reliably surfaces more risks than plain risk-listing — that is the entire trick.`,
    }
  },
)

const planRepair = tpl(
  { id: 'st-plan-repair', name: 'Plan Repair', skillIds: ['st-premortem', 'st-decomp'], bucket: 'strategist', difficulty: 3, variants: 3, minutes: 3 },
  (rng, seed) => {
    const cases = [
      {
        setup: 'Your five-night study plan (one unit per night) just lost night 2 to a family event. The exam date is fixed.',
        correct: 'Re-plan the remaining nights by unit difficulty — split the easiest unit across two evenings\' margins',
        wrong: [
          'Abandon the plan since it is already broken',
          'Do nothing differently and hope night 5 stretches',
          'Stay up most of the night to protect the original schedule',
        ],
        note: 'Plans are forecasts, not contracts. Repair = redistribute by value under the new constraint. All-nighters trade tomorrow\'s learning for today\'s schedule-pride, and abandonment turns one lost night into four.',
      },
      {
        setup: 'Your project partner just told you they cannot do the poster, which was their half. Three days remain.',
        correct: 'Shrink scope: agree on a simpler poster you can split, and tell the teacher early if quality will dip',
        wrong: [
          'Secretly do everything yourself and stay resentful',
          'Report the partner immediately without talking to them',
          'Keep the original poster plan and assume they will change their mind',
        ],
        note: 'Repair under resource loss = scope cut + honest communication. The silent-hero and instant-escalation options both skip the cheapest fix: renegotiating the plan with the people in it.',
      },
      {
        setup: 'Halfway through the bake sale you planned, it starts raining on your outdoor table.',
        correct: 'Execute the fallback: move under the covered entrance you scouted, and message the group chat the new spot',
        wrong: [
          'Pack up and cancel the rest of the sale',
          'Keep selling in the rain to honor the plan',
          'Argue about whose fault the weather is',
        ],
        note: 'A plan with a pre-scouted fallback converts a disruption into a 5-minute move. If you had no fallback — that is the pre-mortem lesson for next time, not a reason to cancel.',
      },
    ]
    const c = cases[seed % cases.length]
    return {
      title: 'The plan just broke',
      prompt: `${c.setup}\n\nWhat is the best repair?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Separate the GOAL (unchanged) from the PLAN (broken) — repair serves the goal.',
        'Check the repair against reality: does it fit the time, people, and energy that actually remain?',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. ${c.note}`,
    }
  },
)

// ---------- Constraint scheduling ----------

const constraintSchedule = fixed(
  { id: 'st-schedule', name: 'Constraint Scheduler', skillIds: ['st-decomp'], bucket: 'strategist', difficulty: 3, minutes: 3.5, transfer: true },
  {
    title: 'Fit the afternoon',
    prompt:
      'After school (3:30–6:00) you must fit: **homework (60 min, needs your desk)**, **soccer practice (45 min, starts exactly at 4:00 at the field)**, and a **10-min walk each way** between home and field. You get home from school at 3:30. Which schedule works?',
    answer: {
      type: 'mcq',
      options: [
        '3:30 start 20 min of homework → 3:50 walk → 4:00 practice → 4:45 walk home → 4:55 finish 40 min of homework by 5:35',
        '3:30 do all homework → 4:30 walk → practice from 4:40',
        '3:30 walk to field early → wait → practice → walk → homework 4:55–5:55, but skip the first walk',
        'Homework cannot be split, so practice must be skipped',
      ],
      correct: 0,
    },
    hints: [
      'Anchor the FIXED event first (practice at 4:00 sharp) and lay travel around it.',
      'Ask which tasks are splittable: homework can split; practice cannot; walks cannot.',
      'Worked path: the split-homework schedule hits every constraint with 25 minutes to spare.',
    ],
    explanation:
      'Fixed-time events are laid down first, travel glued to them, and flexible tasks poured into the gaps — splitting them if allowed. Option A fits: 20 + 40 homework minutes around the anchored 3:50–4:55 block. Option B misses the 4:00 start; the others invent constraints. Transfer: this anchor-then-pour method schedules study weeks, mornings, and projects identically.',
  },
)

// ---------- Reversible vs irreversible ----------

const reversible = tpl(
  { id: 'st-reversible', name: 'Reversible vs irreversible', skillIds: ['st-ethics', 'st-decomp'], bucket: 'strategist', difficulty: 2, variants: 2, minutes: 3 },
  (_rng, seed) => {
    const sets = [
      {
        statements: [
          { text: 'Trying a new after-school club for two weeks', category: 0 },
          { text: 'Posting an angry rant about a friend online', category: 1 },
          { text: 'Rearranging your room layout', category: 0 },
          { text: 'Quitting the team the day before playoffs', category: 1 },
          { text: 'Choosing which topic to draft your essay on', category: 0 },
          { text: 'Sending the essay to the teacher a week early', category: 1 },
        ],
      },
      {
        statements: [
          { text: 'Spending saved allowance on a game you can refund', category: 0 },
          { text: 'Telling someone a secret that is not yours to share', category: 1 },
          { text: 'Signing up for the harder math section (switchable first month)', category: 0 },
          { text: 'Skipping the audition that happens once a year', category: 1 },
          { text: 'Trying a bold haircut', category: 0 },
          { text: 'Deleting your project files without a backup', category: 1 },
        ],
      },
    ]
    const s = sets[seed % sets.length]
    return {
      title: 'Which doors close behind you?',
      prompt:
        'Label each choice. **Reversible** = you can back out at modest cost. **Hard to reverse** = undoing is impossible or very costly.\n\nDecide fast on reversible ones; slow down on the others.',
      answer: { type: 'classify', categories: ['Reversible', 'Hard to reverse'], statements: s.statements },
      hints: [
        'Ask: what would undoing ACTUALLY take — time, money, trust?',
        'Information released (secrets, posts) and one-time windows (auditions, deadlines) rarely reopen.',
        'Worked path: shared information and missed one-shot windows are the hard-to-reverse ones.',
      ],
      explanation:
        'Reversible choices deserve speed — trying and undoing beats deliberating. Hard-to-reverse ones (released information, burned trust, one-time windows, destroyed work) deserve the slow lane: sleep on them, ask someone, prototype first. Matching decision SPEED to decision REVERSIBILITY is one of the highest-leverage strategic habits there is.',
    }
  },
)

// ---------- Stakeholder check & ethical strategy ----------

const stakeholder = fixed(
  { id: 'st-stakeholder', name: 'Stakeholder Impact Check', skillIds: ['st-ethics'], bucket: 'strategist', difficulty: 3, minutes: 3 },
  {
    title: 'Who does the plan touch?',
    prompt:
      'PLAN: To get more study time, you will quietly skip your Saturday shift at the family shop and say the library "ran long".\n\nSelect **everyone** materially affected by this plan.',
    answer: {
      type: 'multi',
      options: [
        'You (short-term time, long-term trust)',
        'The family member covering the shift unplanned',
        'Customers waiting longer that day',
        'Your future self asking for flexibility later',
        'The library',
      ],
      correct: [0, 1, 2, 3],
    },
    hints: [
      'Trace the plan\'s effects one hop past the people in the room.',
      'Include your FUTURE self — trust spent today is unavailable later.',
      'Worked path: everyone but the library is touched.',
    ],
    explanation:
      'The skipped shift lands on whoever covers it and on that day\'s customers; the lie lands on you, twice — now (stress of maintaining it) and later (when you genuinely need flexibility, your word is worth less). The library is scenery. And notice: the honest version of this plan ("could I swap this Saturday to study?") likely achieves the goal WITHOUT the damage — that is the recurring shape of ethical strategy: honesty is usually the cheaper path once every stakeholder is priced in.',
  },
)

const ethicalBoard = tpl(
  { id: 'st-ethical-board', name: 'Ethical Strategy Board', skillIds: ['st-ethics'], bucket: 'strategist', difficulty: 3, variants: 3, minutes: 3, calibration: true },
  (rng, seed) => {
    const cases = [
      {
        goal: 'You want the lead role in the school play, and your friend wants it too.',
        correct: 'Prepare hard, do a great audition, and run lines with your friend when they ask',
        wrong: [
          'Tell your friend the audition moved to a later time',
          'Spread word that your friend is unreliable at rehearsals',
          'Guilt-trip the director about how much you need this',
        ],
        note: 'The honest path competes on the actual merit the decision should turn on. The others "win" by degrading the decision itself — and each is a time bomb in a small community where everything surfaces.',
      },
      {
        goal: 'You want your group to pick your project topic.',
        correct: 'Make the case with two concrete reasons, then call a fair vote and commit to the result',
        wrong: [
          'Schedule the deciding chat when the main opponent is at practice',
          'Say the teacher "prefers" your topic when they never said so',
          'Repeat your choice louder until others give up',
        ],
        note: 'Persuasion = reasons + fair process. Excluding opponents, borrowing fake authority, and attrition all get a topic chosen while making every FUTURE group decision worse.',
      },
      {
        goal: 'You want to rank higher in the chess club ladder.',
        correct: 'Study your losses, play more rated games, and ask the player above you for a training match',
        wrong: [
          'Only challenge players right after their exhausting matches',
          'Distract opponents with table talk during their clock',
          'Dodge every player who might beat you',
        ],
        note: 'The honest route builds the strength the ranking is supposed to measure. The exploits raise the number while hollowing what it measures — and teach everyone to distrust playing you.',
      },
    ]
    const c = cases[seed % cases.length]
    return {
      title: 'Win it clean',
      prompt: `GOAL: ${c.goal}\n\nWhich strategy pursues the goal while keeping honesty, consent, and other people's agency intact?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Test each option: does it work by improving your case, or by degrading someone else\'s?',
        'Ask the daylight question: would the strategy still work if everyone could see it?',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. ${c.note} Strategic intelligence that needs darkness is fragile intelligence: it converts every witness into a risk. Clean wins compound — reputation is the asset the other options quietly sell.`,
    }
  },
)

// ---------- Estimation ----------

const estimation = tpl(
  { id: 'st-estimate', name: 'Estimation & the planning fallacy', skillIds: ['st-estimate'], bucket: 'strategist', difficulty: 3, variants: 3, minutes: 3 },
  (rng, seed) => {
    const cases = [
      {
        q: 'Your last three "one-hour" homework sessions actually took 80, 95, and 100 minutes. Tonight\'s feels like an hour again. What should you plan for?',
        correct: 'About 90 minutes — your track record outranks tonight\'s feeling',
        wrong: ['60 minutes — this time feels different', '3 hours — always assume the worst', '45 minutes — optimism creates speed'],
        note: 'Reference-class forecasting: the outside view (your actual history: ~92 min average) beats the inside view (the plan as imagined). Feelings of "this time is different" are the planning fallacy talking.',
      },
      {
        q: 'You estimate the poster will take 2 hours. Your estimates have been running about 50% low lately. The poster is due in exactly 3 hours. What follows?',
        correct: 'Realistically it needs ~3 hours — start immediately and cut scope up front',
        wrong: ['2 hours is the estimate, so a 1-hour buffer remains', 'Estimates do not apply to creative work', 'Start in an hour to build pressure'],
        note: 'Correct the estimate BY YOUR KNOWN BIAS: 2h × 1.5 = 3h — the buffer was imaginary. Scope-cutting at the start (fewer sections, simpler art) beats quality-collapse at the end.',
      },
      {
        q: 'To predict how long your science-fair project will take, what is the best FIRST question?',
        correct: '"How long did similar projects actually take other students?"',
        wrong: ['"How long does it feel like it should take?"', '"What is the fastest it could possibly go?"', '"How motivated am I right now?"'],
        note: 'Similar-projects data is the outside view — the single best debiasing move for time estimates, before any inside-view detail planning.',
      },
    ]
    const c = cases[seed % cases.length]
    return {
      title: 'Estimate like your history matters',
      prompt: c.q,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Your past actuals are data; tonight\'s optimism is not.',
        'Outside view first (what do such tasks take?), inside view second.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. ${c.note} The Forecast Ledger in this app exists exactly for this: log predictions, collect actuals, learn YOUR correction factor.`,
    }
  },
)

export const STRATEGIST_TEMPLATES: ItemTemplate[] = [
  backwardPlan,
  decisionTree,
  oppCost,
  premortem,
  planRepair,
  constraintSchedule,
  reversible,
  stakeholder,
  ethicalBoard,
  estimation,
]
