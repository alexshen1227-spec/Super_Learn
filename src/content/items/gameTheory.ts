/**
 * Game theory: best response, equilibrium, commitment, and repetition.
 *
 * Every answer is COMPUTED by actually analysing the generated payoff matrix —
 * best responses are found by comparison, equilibria by marking cells that are
 * mutual best responses. No key is authored by hand, so a generator cannot
 * drift away from its own game.
 *
 * Boundary (content law): strategy here is for reaching good outcomes with
 * honesty and mutual benefit. Commitment items are about making promises
 * CREDIBLE, never about coercing or deceiving anyone.
 */
import type { ItemTemplate } from '../../domain/types'
import { pick, rint } from '../../engine/rng'
import { mcq, multi, tpl } from '../lib'

// ---------------------------------------------------------------- engine

type Pay = [[number, number], [number, number]]

/** Row's best response to a given column (index of the better row). */
const rowBest = (row: Pay, c: number): number => (row[0][c] >= row[1][c] ? 0 : 1)
/** All pure-strategy Nash cells as [row, col] pairs. */
function nashCells(row: Pay, col: Pay): [number, number][] {
  const out: [number, number][] = []
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      const rOk = row[r][c] >= row[1 - r][c]
      const cOk = col[r][c] >= col[r][1 - c]
      if (rOk && cOk) out.push([r, c])
    }
  }
  return out
}

/** Strictly dominant row for the row player, or null. Exported for tests. */
export function dominantRow(row: Pay): number | null {
  if (row[0][0] > row[1][0] && row[0][1] > row[1][1]) return 0
  if (row[1][0] > row[0][0] && row[1][1] > row[0][1]) return 1
  return null
}

function matrix(
  rowNames: readonly [string, string],
  colNames: readonly [string, string],
  row: Pay,
  col: Pay,
): string {
  return (
    `| | **${colNames[0]}** | **${colNames[1]}** |\n| --- | --- | --- |\n` +
    `| **${rowNames[0]}** | ${row[0][0]} , ${col[0][0]} | ${row[0][1]} , ${col[0][1]} |\n` +
    `| **${rowNames[1]}** | ${row[1][0]} , ${col[1][0]} | ${row[1][1]} , ${col[1][1]} |\n\n` +
    `*Each cell reads: your points , their points.*`
  )
}

const PAIRS = [
  { row: ['Stall A', 'Stall B'] as const, col: ['Morning', 'Afternoon'] as const, story: 'two food stalls choosing a shift at the same market' },
  { row: ['Advertise', 'Stay quiet'] as const, col: ['Advertise', 'Stay quiet'] as const, story: 'two clubs deciding whether to run a recruitment push' },
  { row: ['Share notes', 'Keep notes'] as const, col: ['Share notes', 'Keep notes'] as const, story: 'two study partners deciding whether to pool their notes' },
  { row: ['Low price', 'High price'] as const, col: ['Low price', 'High price'] as const, story: 'two stands setting a price for the same drink' },
] as const

// ---------------------------------------------------------------- items

const bestResponse = tpl(
  {
    id: 'gt-best-response',
    name: 'Best response',
    skillIds: ['i-equilibrium'],
    bucket: 'investigator',
    difficulty: 2,
    variants: 48,
    minutes: 2.5,
    calibration: true,
  },
  (rng, seed) => {
    const p = PAIRS[seed % PAIRS.length]
    const row: Pay = [
      [rint(rng, 1, 9), rint(rng, 1, 9)],
      [rint(rng, 1, 9), rint(rng, 1, 9)],
    ]
    // Keep the comparison decisive so there is exactly one right reply.
    if (row[0][0] === row[1][0]) row[0][0] += 1
    if (row[0][1] === row[1][1]) row[1][1] += 1
    const col: Pay = [
      [rint(rng, 1, 9), rint(rng, 1, 9)],
      [rint(rng, 1, 9), rint(rng, 1, 9)],
    ]
    const theirChoice = rint(rng, 0, 1)
    const best = rowBest(row, theirChoice)
    return {
      title: 'Their move is known',
      prompt: `You are choosing between **${p.row[0]}** and **${p.row[1]}** — ${p.story}.\n\n${matrix(p.row, p.col, row, col)}\n\nYou have learned they will play **${p.col[theirChoice]}**. What is your best reply?`,
      answer: mcq(rng, `${p.row[best]}, which pays me ${row[best][theirChoice]} instead of ${row[1 - best][theirChoice]}`, [
        `${p.row[1 - best]}, which pays me ${row[1 - best][theirChoice]} instead of ${row[best][theirChoice]}`,
        `${p.row[best]}, because it is the choice that keeps their points lowest overall`,
        `Either one, because the difference between the two rows is not large enough to matter`,
      ]),
      hints: [
        'Their move is fixed, so only one column of the table is live. Cover the other one.',
        `Read down the **${p.col[theirChoice]}** column and compare only YOUR two numbers (the first in each cell).`,
        `${row[0][theirChoice]} vs ${row[1][theirChoice]} → **${p.row[best]}**.`,
      ],
      explanation: `With ${p.col[theirChoice]} fixed, only that column matters: ${p.row[0]} pays you ${row[0][theirChoice]}, ${p.row[1]} pays you ${row[1][theirChoice]}. So **${p.row[best]}** is the best response.\n\nThe habit worth keeping is narrowing: once the other side's choice is known, half the table is irrelevant. Most game-theory mistakes come from staring at all four cells at once instead of the one column that is actually live.`,
      commonErrors: {
        misread: 'Comparing the second number in each cell reads THEIR payoff instead of yours — the most common table-reading slip.',
      },
    }
  },
)

const dominantStrategy = tpl(
  {
    id: 'gt-dominant',
    name: 'Is there a dominant choice?',
    skillIds: ['i-equilibrium'],
    bucket: 'investigator',
    difficulty: 3,
    variants: 40,
    minutes: 3,
    calibration: true,
  },
  (rng, seed) => {
    const p = PAIRS[seed % PAIRS.length]
    // Half the variants really have a dominant row; half deliberately do not,
    // so "find the dominant move" cannot be answered by pattern alone.
    const hasDominant = seed % 2 === 0
    const base = rint(rng, 2, 6)
    const row: Pay = hasDominant
      ? [
          [base + 3, base + 4],
          [base, base + 1],
        ]
      : [
          [base + 3, base],
          [base, base + 3],
        ]
    const col: Pay = [
      [rint(rng, 1, 9), rint(rng, 1, 9)],
      [rint(rng, 1, 9), rint(rng, 1, 9)],
    ]
    const correct = hasDominant
      ? `${p.row[0]} — it pays more in both columns, whatever they choose`
      : `Neither — the better row depends on which column they pick`
    return {
      title: 'Dominant or not?',
      prompt: `${p.story.charAt(0).toUpperCase() + p.story.slice(1)}.\n\n${matrix(p.row, p.col, row, col)}\n\nDo you have a choice that is better **no matter what they do**?`,
      answer: mcq(rng, correct, [
        hasDominant
          ? `${p.row[1]} — it pays more in both columns, whatever they choose`
          : `${p.row[0]} — it pays more in both columns, whatever they choose`,
        hasDominant
          ? `Neither — the better row depends on which column they pick`
          : `${p.row[1]} — it pays more in both columns, whatever they choose`,
        `It cannot be decided without knowing how likely each of their choices is`,
      ]),
      hints: [
        'Dominance is a column-by-column test: check each column separately.',
        `In the ${p.col[0]} column, compare ${row[0][0]} with ${row[1][0]}. Then do the same in the ${p.col[1]} column.`,
        hasDominant
          ? `${p.row[0]} wins in both columns (${row[0][0]}>${row[1][0]} and ${row[0][1]}>${row[1][1]}), so it dominates.`
          : `${p.row[0]} wins one column and ${p.row[1]} wins the other, so nothing dominates.`,
      ],
      explanation: hasDominant
        ? `${p.row[0]} beats ${p.row[1]} in the ${p.col[0]} column (${row[0][0]} vs ${row[1][0]}) **and** in the ${p.col[1]} column (${row[0][1]} vs ${row[1][1]}). That is what dominance means: you can decide without predicting them at all.\n\nDominance is rare and precious. When you have it, stop forecasting — a dominant move is right against every possible opponent, including one who plays badly.`
        : `${p.row[0]} is better against ${p.col[0]} (${row[0][0]} vs ${row[1][0]}), but ${p.row[1]} is better against ${p.col[1]} (${row[1][1]} vs ${row[0][1]}). No row wins both columns, so nothing is dominant and your choice genuinely depends on theirs.\n\nThis is the honest and common case. Notice the trap: needing to predict them is not a failure of analysis — it is the actual structure of the situation.`,
    }
  },
)

const nashFind = tpl(
  {
    id: 'gt-nash-find',
    name: 'Find the stable point',
    skillIds: ['i-equilibrium'],
    bucket: 'investigator',
    difficulty: 4,
    variants: 32,
    minutes: 4,
    calibration: true,
    transfer: true,
  },
  (rng, seed) => {
    const p = PAIRS[seed % PAIRS.length]
    const row: Pay = [
      [rint(rng, 1, 9), rint(rng, 1, 9)],
      [rint(rng, 1, 9), rint(rng, 1, 9)],
    ]
    const col: Pay = [
      [rint(rng, 1, 9), rint(rng, 1, 9)],
      [rint(rng, 1, 9), rint(rng, 1, 9)],
    ]
    // Break ties so best responses are unique and the answer is well-defined.
    if (row[0][0] === row[1][0]) row[0][0]++
    if (row[0][1] === row[1][1]) row[1][1]++
    if (col[0][0] === col[0][1]) col[0][0]++
    if (col[1][0] === col[1][1]) col[1][1]++
    // A randomly drawn 2x2 game often has NO pure-strategy equilibrium, and a
    // "select every stable cell" question cannot express "none of them". Force
    // at least one by making a chosen cell a mutual best response, rather than
    // shipping a question whose correct answer would be fabricated.
    if (nashCells(row, col).length === 0) {
      const r = rint(rng, 0, 1)
      const c = rint(rng, 0, 1)
      row[r][c] = Math.max(row[0][c], row[1][c]) + 1
      col[r][c] = Math.max(col[r][0], col[r][1]) + 1
    }
    const cells = nashCells(row, col)
    const label = ([r, c]: [number, number]) => `${p.row[r]} / ${p.col[c]}`
    const all: [number, number][] = [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ]
    const correctTexts = cells.map(label)
    const wrongTexts = all.filter((x) => !cells.some((n) => n[0] === x[0] && n[1] === x[1])).map(label)
    return {
      title: 'Where does it settle?',
      prompt: `${p.story.charAt(0).toUpperCase() + p.story.slice(1)}.\n\n${matrix(p.row, p.col, row, col)}\n\nSelect **every** cell where neither side could improve by changing their own choice alone.`,
      answer: multi(rng, correctTexts, wrongTexts),
      hints: [
        'Work one side at a time. In each column, mark YOUR better row. Then in each row, mark THEIR better column.',
        'A cell is stable only if it carries both marks — your best reply to them, and their best reply to you.',
        cells.length
          ? `Stable: ${correctTexts.join(', ')}.`
          : 'No cell carries both marks in pure strategies here.',
      ],
      explanation: `${cells.length ? `Stable cell${cells.length > 1 ? 's' : ''}: **${correctTexts.join(', ')}**.` : 'No pure-strategy cell is stable here — every cell has someone who wants to move.'}\n\nThe test is always the same and always one-sided: hold their choice fixed and ask whether YOU want to move; hold yours fixed and ask whether THEY do. If nobody wants to move alone, the situation stays put.\n\nCritically, "stable" does not mean "good". A stable point can be worse for both sides than a cell they could have reached together — stability only rules out one person gaining by deviating **on their own**.`,
    }
  },
)

const dilemma = tpl(
  {
    id: 'gt-dilemma',
    name: 'When stable is worse for everyone',
    skillIds: ['i-game', 'i-equilibrium'],
    bucket: 'investigator',
    difficulty: 4,
    variants: 24,
    minutes: 3.5,
    calibration: true,
    transfer: true,
  },
  (rng, seed) => {
    const p = PAIRS[(seed + 1) % PAIRS.length]
    // Construct a genuine dilemma: T > R > P > S for both sides.
    const S = rint(rng, 0, 2)
    const P = S + rint(rng, 1, 2)
    const R = P + rint(rng, 1, 3)
    const T = R + rint(rng, 1, 3)
    // Row 0 = cooperate, Row 1 = defect.
    const row: Pay = [
      [R, S],
      [T, P],
    ]
    const col: Pay = [
      [R, T],
      [S, P],
    ]
    const coop = ['Cooperate', 'Go it alone'] as const
    const cells = nashCells(row, col)
    const stable = cells.map(([r, c]) => `${coop[r]} / ${coop[c]}`)
    return {
      title: 'The trap that is stable anyway',
      prompt: `Both sides choose at the same time — ${p.story}.\n\n${matrix(coop, coop, row, col)}\n\nBoth cooperating pays **${R}** each. Both going alone pays only **${P}** each. Which statement is true?`,
      answer: mcq(
        rng,
        `Going alone is stable even though both would do better by cooperating`,
        [
          `Cooperating is stable, because ${R} each beats the ${P} each they would otherwise get`,
          `Neither pairing is stable, since each side always wants to change what it just chose`,
          `Both pairings are equally stable, so the outcome depends only on who moves first`,
        ],
      ),
      hints: [
        'Test cooperation for stability: if they cooperate, what do YOU get by switching?',
        `If they cooperate you get ${R} by cooperating but ${T} by going alone — and ${T} is larger.`,
        `So each side has a private reason to switch, and the pair lands on ${P} each. Stable: ${stable.join(', ')}.`,
      ],
      explanation: `If they cooperate, going alone pays you ${T} instead of ${R}. If they go alone, going alone pays you ${P} instead of ${S}. So going alone is better whatever they do — it is dominant — and both reason identically, landing on **${P} each** when **${R} each** was available.\n\nThis is the most important shape in the subject: individually rational choices producing a collectively worse result. It explains overfishing, arms races, unusable group chats, and price wars.\n\nWhat actually breaks it is not being nicer inside this table — the table is the table. It is changing the game: repetition so reputation matters, agreements that bind, or shared information about who did what.`,
      commonErrors: {
        concept: 'Assuming the best joint outcome must be the stable one. Stability is tested one player at a time, so a cell can be stable and bad for everybody at once.',
      },
    }
  },
)

const coordination = tpl(
  {
    id: 'gt-coordination',
    name: 'Two good answers, one problem',
    skillIds: ['i-equilibrium'],
    bucket: 'investigator',
    difficulty: 3,
    variants: 24,
    minutes: 3,
  },
  (rng, seed) => {
    const p = PAIRS[seed % PAIRS.length]
    const both = rint(rng, 4, 8)
    const solo = rint(rng, 0, 2)
    // Matching pays; mismatching does not. Two equilibria, no conflict.
    const row: Pay = [
      [both, solo],
      [solo, both],
    ]
    const col: Pay = [
      [both, solo],
      [solo, both],
    ]
    return {
      title: 'Coordination, not conflict',
      prompt: `${p.story.charAt(0).toUpperCase() + p.story.slice(1)} — you both do well only if you pick the SAME option.\n\n${matrix(p.row, p.row, row, col)}\n\nWhat does this situation actually require?`,
      answer: mcq(rng, 'Communication, since two arrangements are equally stable and the only real risk is mismatching', [
        'A stronger negotiating position, since one of the two sides has to give way before the other one can be satisfied',
        'A careful probability estimate, since the payoffs here reward whichever side predicts the other one most accurately',
        'Nothing much, since both sides already want the same outcome and will therefore tend to arrive at it on their own',
      ]),
      hints: [
        'Check both matching cells for stability. Does either side want to move alone from them?',
        'Both matching cells are stable, and both sides prefer either of them to a mismatch.',
        'When several stable points are all fine, the difficulty is agreeing which one — not conflict.',
      ],
      explanation: `Both matching cells pay ${both} each and both are stable: from either one, moving alone drops you to ${solo}. There is no conflict of interest at all here — you want the same thing — and yet you can still fail, by picking different options.\n\nThat is a coordination problem, and it needs a different tool from a conflict. Talking, a convention, a default, or a visible signal solves it. Negotiating leverage does not, because nobody is fighting you.\n\nThe practical lesson: diagnose which kind of problem you are in before choosing a tactic. Treating a coordination failure as a conflict manufactures an opponent who was never there.`,
    }
  },
)

const repeated = tpl(
  {
    id: 'gt-repeated',
    name: 'Once versus many times',
    skillIds: ['i-commit'],
    bucket: 'investigator',
    difficulty: 4,
    variants: 20,
    minutes: 3.5,
    transfer: true,
  },
  (rng) => {
    const gain = rint(rng, 3, 6)
    const perRound = rint(rng, 2, 4)
    const rounds = rint(rng, 5, 12)
    const longRun = perRound * rounds
    const onceThenNothing = gain + 0
    const worthIt = longRun > onceThenNothing
    const setting = pick(rng, [
      'a weekly trade with the same neighbour',
      'a repeated swap with the same teammate',
      'an ongoing arrangement with the same supplier',
    ] as const)
    return {
      title: 'The shadow of the future',
      prompt: `In ${setting}, breaking your word once earns you an extra **${gain} points** now, but the other side will never deal with you again.\n\nKeeping your word earns **${perRound} points per round**, and there are about **${rounds} rounds** left.\n\nWhich analysis is right?`,
      answer: mcq(
        rng,
        worthIt
          ? `Keep your word: ${perRound} × ${rounds} = ${longRun} points beats the ${gain} you would gain once`
          : `Break it: the ${gain} points now beat ${perRound} × ${rounds} = ${longRun} from the rounds remaining`,
        [
          worthIt
            ? `Break it: the ${gain} points now beat ${perRound} × ${rounds} = ${longRun} from the rounds remaining`
            : `Keep your word: ${perRound} × ${rounds} = ${longRun} points beats the ${gain} you would gain once`,
          `It cannot be compared, because trust and points are different kinds of thing entirely`,
          `Always keep your word here, because breaking a promise can never be the higher-scoring option`,
        ],
      ),
      hints: [
        'Put both paths in the same units and compare totals, not feelings.',
        `One-off gain: ${gain}. Continuing: ${perRound} per round for about ${rounds} rounds.`,
        `${perRound} × ${rounds} = ${longRun}, against ${onceThenNothing}. ${worthIt ? 'The relationship is worth more.' : 'The one-off is larger here.'}`,
      ],
      explanation: `${perRound} × ${rounds} = **${longRun}** against a one-time **${gain}**. ${worthIt ? 'The remaining rounds are worth more than the betrayal, so keeping your word is also the higher-scoring play.' : 'Here the one-off gain is actually larger — which is exactly why this case is worth seeing.'}\n\nRepetition is what converts trustworthiness from a nice trait into a strategically strong one: the future payoff of being dealt with again outweighs one profitable betrayal. That is the "shadow of the future".\n\nNotice the honest edge case: when the rounds run out, the shadow disappears, and the arithmetic can flip. This is why last-round behaviour differs, and why a reputation you want to keep is worth more when everyone expects to meet again.${worthIt ? '' : ' Worth saying plainly: the maths is only one input here — a promise you made is also a promise you made.'}`,
    }
  },
)

const commitment = tpl(
  {
    id: 'gt-commitment',
    name: 'Winning by giving up options',
    skillIds: ['i-commit'],
    bucket: 'investigator',
    difficulty: 5,
    variants: 4,
    minutes: 4,
    transfer: true,
    calibration: true,
  },
  (rng, seed) => {
    const cases = [
      {
        setup: 'You are selling a bike and say you will not go below a set price.',
        credible: 'Publish the price publicly and tell every buyer the same figure, so lowering it later would be visible',
        weak: [
          'Tell each buyer privately that this is your final price and that you really cannot move on it',
          'Decide firmly in your own mind that you will refuse, and hold that line during the conversation',
          'Mention that other people have offered more, so there is little reason for you to come down',
        ],
        why: 'A commitment is credible when breaking it would visibly cost you something. A private declaration costs nothing to abandon, so a buyer correctly discounts it.',
      },
      {
        setup: 'Your group needs a task finished by Friday and past promises have slipped.',
        credible: 'Agree a checkpoint on Wednesday where the partial work is shown to the whole group',
        weak: [
          'Ask everyone to promise sincerely that this particular deadline will definitely be met',
          'Explain in detail how important the deadline is and what happens if the group misses it',
          'Set the internal deadline earlier than Friday so there is spare time if something goes wrong',
        ],
        why: 'A checkpoint makes the state of the work observable before the deadline, so slipping cannot stay hidden. Sincerity and buffers do not change what anyone can see.',
      },
      {
        setup: 'You want to stop checking your phone during study blocks.',
        credible: 'Leave the phone in another room, so retrieving it costs a visible interruption',
        weak: [
          'Resolve at the start of each session that you will not pick the phone up this time',
          'Turn off notifications so the phone is much less likely to interrupt you while working',
          'Keep the phone face down beside you so that checking it takes a deliberate action',
        ],
        why: 'Distance removes the option rather than relying on resisting it. The others reduce temptation but leave the choice available at the exact moment willpower is weakest.',
      },
      {
        setup: 'Two clubs keep undercutting each other on ticket prices.',
        credible: 'Announce a published price list that both clubs can check at any time',
        weak: [
          'Agree privately that neither club will undercut the other for the rest of the term',
          'Explain to the other club how damaging the price war has been for both sides so far',
          'Wait for the other club to raise prices first and then match whatever they have set',
        ],
        why: 'Published prices make defection observable immediately, which is what makes the agreement hold. A private agreement is unobservable, so both sides expect quiet undercutting.',
      },
    ] as const
    const c = cases[seed % cases.length]
    return {
      title: 'Make the promise believable',
      prompt: `${c.setup}\n\nWhich move makes your position **credible** to the other side — rather than merely sincere?`,
      answer: mcq(rng, c.credible, [...c.weak]),
      hints: [
        'Credibility is not about how strongly you mean it. Ask what it would COST you to go back on it.',
        'A promise the other side cannot check, and you can quietly abandon, gets discounted — correctly.',
        `Look for the option that makes breaking your word visible or expensive: **${c.credible}**`,
      ],
      explanation: `**${c.credible}.** ${c.why}\n\nThe counter-intuitive core: you often gain power by REMOVING your own options. A promise you could easily break is weak precisely because you could easily break it, and the other side knows that. Tying your own hands is what makes the promise worth believing.\n\nThis stays on the right side of the line as long as the commitment is honest — you are making a true intention believable, not manufacturing a threat you never intend to carry out.`,
      commonErrors: {
        concept: 'Confusing sincerity with credibility. How much you mean it is invisible to the other side; what it would cost you to break it is not.',
      },
    }
  },
)

const zeroSum = tpl(
  {
    id: 'gt-zero-sum',
    name: 'Is the pie fixed?',
    skillIds: ['i-game'],
    bucket: 'investigator',
    difficulty: 3,
    variants: 24,
    minutes: 3,
    transfer: true,
  },
  (rng, seed) => {
    const zero = seed % 2 === 0
    const p = PAIRS[seed % PAIRS.length]
    const a = rint(rng, 2, 7)
    const b = rint(rng, 2, 7)
    // Zero-sum: payoffs in every cell add to the same total. Otherwise some
    // cells create more combined value than others.
    const total = a + b + 4
    const row: Pay = zero
      ? [
          [a, a + 2],
          [a + 1, a - 1],
        ]
      : [
          [a + 3, a],
          [a, a + 1],
        ]
    const col: Pay = zero
      ? [
          [total - a, total - (a + 2)],
          [total - (a + 1), total - (a - 1)],
        ]
      : [
          [b + 3, b],
          [b, b + 1],
        ]
    const sums = [row[0][0] + col[0][0], row[0][1] + col[0][1], row[1][0] + col[1][0], row[1][1] + col[1][1]]
    return {
      title: 'Fixed pie or not?',
      prompt: `${p.story.charAt(0).toUpperCase() + p.story.slice(1)}.\n\n${matrix(p.row, p.col, row, col)}\n\nAdd the two numbers in each cell. What does that tell you?`,
      answer: mcq(
        rng,
        zero
          ? `Every cell totals ${sums[0]}, so one side only gains what the other loses`
          : `The totals differ (${sums.join(', ')}), so some outcomes create more combined value`,
        [
          zero
            ? `The totals differ, so some outcomes create more combined value than others`
            : `Every cell totals the same, so one side only gains what the other loses`,
          `The totals show which single cell both sides should be aiming to reach together`,
          `Cell totals cannot be compared, because each side's points are measured differently`,
        ],
      ),
      hints: [
        'Add both numbers in each of the four cells and write the four totals down.',
        `The totals are ${sums.join(', ')}.`,
        zero
          ? 'All four are equal — the pie is a fixed size, so this really is win/lose.'
          : 'They are not all equal — the size of the pie depends on which cell you land in.',
      ],
      explanation: zero
        ? `Every cell totals ${sums[0]}. This is genuinely **zero-sum**: there is a fixed amount to divide, and any gain for you is exactly a loss for them. Cooperation cannot create value here — only shift it.\n\nRecognising this matters because the right tactics differ. In a fixed-pie situation, looking for a clever win-win is wasted effort.`
        : `The totals are ${sums.join(', ')} — not equal. The combined result depends on which cell you reach, so this is **not** zero-sum: there are outcomes that make the pie bigger.\n\nMost real situations look adversarial but are not. Treating a positive-sum situation as win/lose is the expensive mistake — it throws away the cells where both sides do better, in order to win a contest nobody was actually forced into.`,
      commonErrors: {
        strategy: 'Assuming every competitive-looking situation is zero-sum. Adding the cell totals is a ten-second check that often shows otherwise.',
      },
    }
  },
)

const threatTest = tpl(
  {
    id: 'gt-threat-credible',
    name: 'Would they really do it?',
    skillIds: ['i-commit', 'i-equilibrium'],
    bucket: 'investigator',
    difficulty: 5,
    variants: 12,
    minutes: 3.5,
    transfer: true,
  },
  (rng, seed) => {
    void seed
    const punishCost = rint(rng, 3, 7)
    const punishGain = rint(rng, 0, 2)
    const scenarios = [
      'a club says it will run a rival event on the same night if you do not move yours',
      'a seller says they will withdraw the offer entirely if you ask for any discount',
      'a teammate says they will redo the whole section themselves if you change anything',
    ] as const
    const s = scenarios[seed % scenarios.length]
    return {
      title: 'Test the threat',
      prompt: `In negotiation, ${s}. Carrying that out would cost them **${punishCost} points** and gain them only **${punishGain}**.\n\nHow should you read the threat?`,
      answer: mcq(
        rng,
        `Not credible on its own: carrying it out costs them ${punishCost} to gain ${punishGain}, so they would not want to follow through`,
        [
          `Credible, because they have stated it openly and backing down now would visibly damage how they are seen`,
          `Credible, because being willing to spend ${punishCost} on it shows just how seriously they are treating this`,
          `Impossible to judge either way, because whether they would really follow through is not something you can observe`,
        ],
      ),
      hints: [
        'A threat is an action they would have to take LATER. Ask whether they would still want to, at that moment.',
        `Carrying it out costs ${punishCost} and returns ${punishGain} — a net loss for them.`,
        'A threat nobody would want to execute is not believable unless something makes backing out costlier.',
      ],
      explanation: `Executing the threat costs them ${punishCost} and returns ${punishGain}, so at the moment of truth they would prefer not to. A threat that the threatener would not want to carry out is not credible — and both sides can work that out.\n\nWhat WOULD make it credible is a change to their own payoffs: a public promise that makes backing down embarrassing, a policy that removes their discretion, or a reputation across many negotiations that is worth more than this one.\n\nThe defensive value here is large. Recognising an unbacked threat stops you conceding to pressure that has nothing behind it — and the honest counter-move is to test it calmly, not to bluff back.`,
      commonErrors: {
        inference: 'Treating stated intensity as evidence. How firmly something is said is not information about whether following through would serve them.',
      },
    }
  },
)

const mixedSignals = tpl(
  {
    id: 'gt-elimination',
    name: 'Think one step further',
    skillIds: ['i-equilibrium'],
    bucket: 'investigator',
    difficulty: 5,
    variants: 12,
    minutes: 4,
    calibration: true,
  },
  (rng, seed) => {
    const p = PAIRS[(seed + 2) % PAIRS.length]
    const base = rint(rng, 2, 5)
    // Column player has a dominated strategy; once removed, the row player's
    // choice becomes obvious. Answer computed from that reduced game.
    const col: Pay = [
      [base + 4, base],
      [base + 3, base + 1],
    ]
    const row: Pay = [
      [base + 1, base + 5],
      [base + 4, base + 2],
    ]
    // Column prefers column 0 in both rows -> column 1 is dominated.
    const colDominant = 0
    const rowBestAfter = rowBest(row, colDominant)
    return {
      title: 'Use what they will never do',
      prompt: `${p.story.charAt(0).toUpperCase() + p.story.slice(1)}.\n\n${matrix(p.row, p.col, row, col)}\n\nWork out what THEY will never play, then choose. What is your move?`,
      answer: mcq(
        rng,
        `${p.row[rowBestAfter]} — they will never play ${p.col[1]}, and ${p.row[rowBestAfter]} is my best reply to ${p.col[0]}`,
        [
          `${p.row[1 - rowBestAfter]} — they will never play ${p.col[1]}, and it is my best reply to ${p.col[0]}`,
          `${p.row[0]} — it contains the single highest payoff available to me anywhere in the whole table`,
          `Either row is defensible, because nothing in the table lets me predict which column they will actually pick`,
        ],
      ),
      hints: [
        'Look at THEIR numbers (the second in each cell) and compare their two columns within each row.',
        `Their payoff from ${p.col[0]} beats ${p.col[1]} in both rows (${col[0][0]}>${col[0][1]} and ${col[1][0]}>${col[1][1]}), so ${p.col[1]} is dominated.`,
        `Delete that column and compare your two numbers in the ${p.col[0]} column: ${row[0][0]} vs ${row[1][0]}.`,
      ],
      explanation: `Their payoffs from ${p.col[0]} (${col[0][0]}, ${col[1][0]}) beat ${p.col[1]} (${col[0][1]}, ${col[1][1]}) in both rows, so a rational opponent never plays ${p.col[1]}. Delete that column, then compare your own numbers in what remains: ${row[0][0]} vs ${row[1][0]} → **${p.row[rowBestAfter]}**.\n\nThis is iterated elimination, and it is the first genuine piece of "thinking about their thinking". The tempting error is chasing your own biggest number (${Math.max(row[0][0], row[0][1], row[1][0], row[1][1])}) — but it sits in a column they will never choose, so it is not actually on the menu.\n\nThe transferable move: before optimising your choice, delete the parts of the situation the other side would never pick.`,
    }
  },
)

/**
 * PLAY FIRST, THEN FORMALIZE.
 *
 * Yale's ECON 159 opens by having students play a game before any theory
 * exists, then organises what happened into players, strategies and payoffs.
 * Committing to a move before you can analyse it is retrieval before reveal:
 * you find out what your instinct actually was, and the formalism then has
 * something of yours to correct rather than a blank page to fill.
 *
 * Both steps are genuinely graded — the commitment has a defensible answer
 * once reasoned through, and the second step asks what the game turned out to
 * be, so the theory arrives attached to a decision you already made.
 */
const playFirst = tpl(
  {
    id: 'gt-play-first',
    name: 'Play it, then name it',
    skillIds: ['i-game', 'i-equilibrium'],
    bucket: 'investigator',
    difficulty: 4,
    variants: 12,
    minutes: 4,
    kind: 'multi',
    calibration: true,
    transfer: true,
  },
  (rng) => {
    // A genuine dilemma (T > R > P > S), but the table is withheld until after
    // the learner has already committed to a move.
    const S = rint(rng, 0, 1)
    const P = S + rint(rng, 1, 2)
    const R = P + rint(rng, 2, 3)
    const T = R + rint(rng, 1, 3)
    const row: Pay = [
      [R, S],
      [T, P],
    ]
    const col: Pay = [
      [R, T],
      [S, P],
    ]
    const names = ['Split', 'Take'] as const
    const setting = pick(rng, [
      'You and one other person, chosen at random and never named, each decide privately',
      'Two teams are asked, separately and at the same moment, to decide',
      'You and an anonymous partner each submit one sealed choice',
    ] as const)
    return {
      title: 'Decide first. Theory after.',
      prompt: `${setting}. You may **Split** or **Take**.\n\n- Both Split: you each get **${R}**.\n- Both Take: you each get **${P}**.\n- One Takes while the other Splits: the taker gets **${T}**, the splitter gets **${S}**.\n\nNo table yet. Decide, and then we will build one.`,
      parts: [
        {
          stage: 'Commit',
          prompt: 'Before any analysis: which do you choose, and on what grounds? Pick the reasoning that matches your decision.',
          answer: mcq(rng, `Take — whatever they do, taking pays me more (${T} beats ${R}, and ${P} beats ${S})`, [
            `Split — if we both do it we each get ${R}, which is better than the ${P} we get by both taking`,
            `Split — taking risks ending up with very little if they happen to take as well, so it is safer`,
            `Take — the ${T} payoff is the largest single number available anywhere in the description`,
          ]),
          hints: [
            'Hold their choice fixed, one case at a time. If they Split, what do each of your options pay?',
            `If they Split: Take pays ${T}, Split pays ${R}. If they Take: Take pays ${P}, Split pays ${S}.`,
            'Taking wins in BOTH cases — that is what makes it dominant.',
          ],
          explanation: `Taking pays more whichever way they go: ${T} against ${R} if they Split, ${P} against ${S} if they Take. Dominant, and dominant before you know anything at all about them.\n\nThe two Split answers are the interesting wrong ones. "We both do better if we both Split" is TRUE — ${R} each beats ${P} each — but it is not a reason for YOUR choice to change, because your choice cannot move theirs. And "safer" is the wrong frame entirely: Take is not a gamble here, it is better in every single case.`,
        },
        {
          stage: 'Formalize',
          prompt: `Here is what you just played, written out properly.\n\n${matrix(names, names, row, col)}\n\nWhat kind of situation was it?`,
          answer: mcq(rng, 'Both taking is the stable outcome, and it pays both of you less than both splitting would', [
            `Both splitting is the stable outcome, since ${R} each is the best result available to the pair`,
            'Nothing here is stable, because whichever pair of choices happens somebody wishes they had moved',
            'Both outcomes are equally stable, so which one happens comes down to who decides first',
          ]),
          hints: [
            'Stability is a one-sided test: from a given cell, does either player gain by moving alone?',
            `From both-Split, moving alone to Take pays ${T} instead of ${R} — so somebody does want to move.`,
            `From both-Take, moving alone to Split pays ${S} instead of ${P} — nobody wants to move. That is the stable cell.`,
          ],
          explanation: `Both-Take is the only cell nobody wants to leave, and it pays **${P} each** when **${R} each** was sitting right there.\n\nThat gap between "stable" and "good" is the most important idea in the subject, and you now have your own decision to hang it on — you reasoned your way to the outcome that leaves both sides worse off, and the reasoning was correct.\n\nNotice what does not fix it: being told to cooperate. The table is the table. What fixes it is changing the game — repetition so reputation matters, or an agreement that actually binds.`,
        },
      ],
      hints: [
        'First part: hold their choice fixed and compare your two options inside that case.',
        'Second part: a cell is stable only when neither side gains by moving on their own.',
        '"Stable" and "good" are different questions. Check them separately.',
      ],
      explanation:
        'Deciding before analysing is the whole point here. It is easy to nod along to a dilemma explained on a page; it is a different thing to notice that you had already reasoned your way into it.',
    }
  },
)

/**
 * "Payoffs matter" — the lesson this strand was missing.
 *
 * ECON 159's third lesson: the same strategic structure with different payoffs
 * is a different game, so you cannot choose a strategy until you know what you
 * are actually trying to get. That is a planning skill long before it is a
 * mathematical one, and it is the step most real arguments about strategy skip.
 */
const payoffsMatter = tpl(
  {
    id: 'gt-payoffs-matter',
    name: 'What are you actually trying to get?',
    skillIds: ['i-game'],
    bucket: 'investigator',
    difficulty: 4,
    variants: 6,
    minutes: 3.5,
    calibration: true,
    transfer: true,
  },
  (rng, seed) => {
    const cases = [
      {
        setting: 'You and a partner are finalising a shared project. You can push on every disagreement or let the small ones go.',
        goalA: 'you care only about the mark this project receives',
        goalB: 'you care mainly about still wanting to work together next term',
        answerA: 'Push on every disagreement, since the mark is the only thing being measured here',
        answerB: 'Let the small disagreements go and spend your objections on the one that moves the mark most',
      },
      {
        setting: 'You and another club each choose whether to hold an event on the popular night.',
        goalA: 'you want the biggest possible turnout at your own event',
        goalB: 'you want as many people as possible to attend something at all',
        answerA: 'Book the popular night regardless, because your own turnout is the thing being maximised',
        answerB: 'Coordinate onto different nights, because splitting the audience shrinks the total you care about',
      },
      {
        setting: 'Two stalls set a price for the same item, and each can see what the other charges.',
        goalA: 'you want the most profit this month',
        goalB: 'you want to still be trading here in two years',
        answerA: 'Undercut sharply now, because this month is the window the profit is being counted in',
        answerB: 'Hold your price, because a price war both sides can see coming ends with neither able to trade',
      },
    ] as const
    const c = cases[seed % cases.length]
    const askA = Math.floor(seed / cases.length) % 2 === 0
    const goal = askA ? c.goalA : c.goalB
    const correct = askA ? c.answerA : c.answerB
    const other = askA ? c.answerB : c.answerA
    return {
      title: 'Same game, different goal',
      prompt: `${c.setting}\n\nThe structure of the situation is fixed. What changes is what you want out of it.\n\n**Suppose ${goal}.** What follows?`,
      answer: mcq(rng, correct, [
        other,
        'Neither, because the right move here is settled by the situation rather than by what you want from it',
        'Neither, because nothing can be decided until you know what the other side is going to do first',
      ]),
      hints: [
        'The moves available have not changed. Only the thing being maximised has.',
        `Read the option that follows from "${goal}", and set aside the one that would follow from the other aim.`,
        `With that goal, the answer is: ${correct}`,
      ],
      explanation: `**${correct}**\n\nThe other option is not wrong in general — it is the right answer to a different question, the one where ${askA ? c.goalB : c.goalA}. Identical situation, identical moves, opposite conclusion.\n\nThis is why "what should I do here?" is usually the wrong first question. You cannot get what you want until you know what you want, and a surprising number of arguments about strategy turn out, on inspection, to be arguments about goals that nobody stated out loud.`,
      commonErrors: {
        strategy: 'Treating the situation as fixing the answer. Two people in the same position with different aims should reason to different moves — if they do not, one of them has not named their aim.',
      },
    }
  },
)

export const GAME_THEORY_TEMPLATES: ItemTemplate[] = [
  playFirst,
  payoffsMatter,
  bestResponse,
  dominantStrategy,
  nashFind,
  dilemma,
  coordination,
  repeated,
  commitment,
  zeroSum,
  threatTest,
  mixedSignals,
]
