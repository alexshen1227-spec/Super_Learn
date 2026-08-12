/**
 * Choice Lab — the four moves that come BEFORE weighing options against each
 * other: dominance, reversibility, second-order effects, and sunk cost.
 *
 * Covers `st-tradeoff`, `st-reversible`, `st-secondorder` and `st-sunk`.
 * Every numeric key is COMPUTED. The two decision-table generators build a
 * Pareto structure whose dominance relation is fixed by construction and then
 * RE-DERIVE the answer from the generated values, so a table cannot carry two
 * right answers; the property is asserted across every variant rather than
 * assumed from the construction argument.
 *
 * Evidence, and its limits:
 *
 * - SUNK COST. Arkes & Blumer (1985, Organizational Behavior and Human
 *   Decision Processes 35(1), 124-140) is the canonical demonstration: given
 *   two non-refundable, conflicting ski trips, a majority chose the more
 *   expensive trip they expected to enjoy less. Larrick, Morgan & Nisbett
 *   (1990, Psychological Science 1(6), 362-370) is why this is taught rather
 *   than merely named: brief training in the cost-benefit rules (sunk cost,
 *   opportunity cost) changed reasoning and self-reported behaviour, including
 *   on a later probe that did not resemble the training. That is unusually
 *   good news for a debiasing intervention, and it is why `cl-sunk-*` drills
 *   the FORWARD comparison instead of the slogan. `cl-finish-or-stop` makes
 *   "continue" correct in half its variants by construction: a bank where
 *   abandoning is always right teaches "quit", which is not the rule.
 *
 * - DOMINANCE. Dropping a dominated option is a logical move, not an empirical
 *   claim, so nothing is cited for it. The neighbouring empirical claim — that
 *   ADDING a dominated option shifts preference between the others (Huber,
 *   Payne & Puto 1982, J. Consumer Research 9(1), 90-98) — is deliberately NOT
 *   taught: Frederick, Lee & Baskin (2014, J. Marketing Research 51(4))
 *   failed to obtain it with realistic stimuli and argued the conditions are
 *   restrictive. Contested is not settled.
 *
 * - TRADING WHOLE ISSUES. Integrative bargaining ("logrolling") is standard
 *   negotiation theory: where two sides value several issues UNEQUALLY, each
 *   can concede the whole of what it values least. One of `cl-issue-trade`'s
 *   seven cases has no trade available at all — one issue, valued equally —
 *   because a technique that always applies is a superstition. Scenarios are
 *   disjoint from `cc-tradeoff` in `caseComparison.ts`, which teaches the same
 *   principle by comparison and owns the chores/room/car/budget/band/grocery
 *   cover stories.
 *
 * - SECOND-ORDER EFFECTS. Campbell (1979) and Goodhart (1975), popularised in
 *   Strathern's (1997) phrasing "when a measure becomes a target, it ceases to
 *   be a good measure", are OBSERVATIONS about institutions, not experiments,
 *   and the copy says so rather than dressing them as findings. Two of the
 *   nine `cl-then-what` cases have a benign key — the change simply worked —
 *   for the same reason the Observer bank must let "nothing is wrong" be
 *   right: answering "it will backfire" every time is cynicism, not
 *   prediction, and would score full marks on a one-sided bank.
 *
 * - REVERSIBILITY. Matching decision SPEED to how hard a decision is to undo
 *   is a management heuristic (the "one-way door / two-way door" framing from
 *   corporate decision writing), not a measured result, and the copy labels it
 *   as a rule of thumb. `cl-try-vs-commit` grounds it in arithmetic the
 *   learner can check instead: what the mistake costs under each route.
 *
 * Two famous techniques are pointedly NOT used as scaffolding here, because
 * their evidence is thinner than their reputation. The PRE-MORTEM (taught by
 * `st-premortem`) rests on Mitchell, Russo & Pennington (1989, J. Behavioral
 * Decision Making 2(1)), which measured the COUNT of reasons generated and not
 * their quality, and on Veinott, Klein & Wiggins (2010, ISCRAM conference
 * paper, 178 students), which found reduced confidence; no study shows it
 * improves real decisions. CHECKLISTS are not treated as a model of thinking
 * either: the surgical result (Haynes et al. 2009, NEJM) did not replicate at
 * population level (Urbach et al. 2014, NEJM — adjusted mortality 0.71% to
 * 0.65%, not significant).
 *
 * Safety: every scenario is invented and school- or community-scale, no real
 * person, organisation or brand appears, and no strategy here works by
 * deceiving anyone. Where a rule invites misreporting, that is presented as a
 * fact about the RULE's design, never as a move for the learner to make.
 */
import type { ItemTemplate } from '../../domain/types'
import { rint, shuffle, type Rng } from '../../engine/rng'
import { cycle, mcq, mcqNoted, money, multi, numeric, round, steps, tpl } from '../lib'

// ---------------------------------------------------------------- shared bits

const BUCKET = 'strategist' as const

/** Value formatting per criterion unit. Integers only — no float dust. */
type Unit = 'money' | 'min' | 'day' | 'kg' | 'ten' | 'seat' | 'hour' | 'gb'

function show(v: number, unit: Unit): string {
  switch (unit) {
    case 'money':
      return money(v)
    case 'min':
      return `${v} min`
    case 'day':
      return `${v} days`
    case 'kg':
      return `${v} kg`
    case 'ten':
      return `${v}/10`
    case 'seat':
      return `${v} seats`
    case 'hour':
      return `${v} h`
    case 'gb':
      return `${v} GB`
  }
}

/**
 * Indexes of options beaten by ANOTHER option on every criterion at once.
 *
 * `higher[j]` says which direction is better on criterion j, and the test is
 * strict on every criterion, so a tie anywhere means no domination. This is
 * the single source of truth for both table generators: the answer key is read
 * off THIS function, never off the construction that built the table.
 */
function dominatedIndexes(rows: number[][], higher: boolean[]): number[] {
  const better = (a: number, b: number, j: number) => (higher[j] ? a > b : a < b)
  const out: number[] = []
  for (let i = 0; i < rows.length; i++) {
    const beaten = rows.some((_, k) => k !== i && rows[k].every((_, j) => better(rows[k][j], rows[i][j], j)))
    if (beaten) out.push(i)
  }
  return out
}

// ================================================================= st-tradeoff

/**
 * Rows are laid out on six strictly ordered quality levels per criterion.
 * Base options take levels 0/2/4 in the rank permutations below, which are
 * pairwise non-dominating; the fourth row copies a target row one level worse
 * on every criterion, which makes it — and only it — dominated.
 */
const RANKS: number[][] = [
  [0, 4, 2],
  [2, 0, 4],
  [4, 2, 0],
]

interface TableCase {
  scene: string
  noun: string
  crits: { label: string; unit: Unit; higher: boolean; from: [number, number]; step: [number, number] }[]
}

const TABLE_CASES: TableCase[] = [
  {
    scene: 'Four second-hand bikes at the school sale. You want one to ride to school every day.',
    noun: 'Bike',
    crits: [
      { label: 'price', unit: 'money', higher: false, from: [70, 130], step: [12, 22] },
      { label: 'weight', unit: 'kg', higher: false, from: [9, 12], step: [1, 2] },
      { label: 'condition', unit: 'ten', higher: true, from: [9, 10], step: [1, 1] },
    ],
  },
  {
    scene: 'Four holiday coding courses. You can only take one, and the fee is yours to pay.',
    noun: 'Course',
    crits: [
      { label: 'fee', unit: 'money', higher: false, from: [40, 90], step: [10, 20] },
      { label: 'travel each way', unit: 'min', higher: false, from: [10, 25], step: [5, 9] },
      { label: 'hands-on hours', unit: 'hour', higher: true, from: [26, 34], step: [3, 5] },
    ],
  },
  {
    scene: 'Four halls the club could hire for its end-of-term showcase.',
    noun: 'Hall',
    crits: [
      { label: 'hire cost', unit: 'money', higher: false, from: [55, 95], step: [10, 18] },
      { label: 'walk from school', unit: 'min', higher: false, from: [4, 10], step: [3, 6] },
      { label: 'seats', unit: 'seat', higher: true, from: [140, 200], step: [12, 20] },
    ],
  },
  {
    scene: 'Four phone plans, all on the same one-year contract.',
    noun: 'Plan',
    crits: [
      { label: 'monthly cost', unit: 'money', higher: false, from: [11, 19], step: [2, 4] },
      { label: 'signal score here', unit: 'ten', higher: true, from: [9, 10], step: [1, 1] },
      { label: 'data', unit: 'gb', higher: true, from: [40, 60], step: [5, 9] },
    ],
  },
  {
    scene: 'Four study rooms in the library, bookable for the exam fortnight.',
    noun: 'Room',
    crits: [
      { label: 'booking fee', unit: 'money', higher: false, from: [6, 14], step: [2, 4] },
      { label: 'noise level', unit: 'ten', higher: false, from: [1, 2], step: [1, 2] },
      { label: 'desks', unit: 'seat', higher: true, from: [10, 16], step: [2, 3] },
    ],
  },
]

const dominatedTable = tpl(
  {
    id: 'cl-dominated-table',
    name: 'The row you can drop without deciding anything',
    skillIds: ['st-tradeoff'],
    bucket: BUCKET,
    difficulty: 2,
    variants: 10,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, TABLE_CASES)
    // Six strictly ordered levels per criterion, best (index 0) first.
    const levels = c.crits.map((crit) => {
      const start = rint(rng, crit.from[0], crit.from[1])
      const step = rint(rng, crit.step[0], crit.step[1])
      return Array.from({ length: 6 }, (_, k) => (crit.higher ? start - k * step : start + k * step))
    })
    const target = rint(rng, 0, 2)
    const levelRows = [...RANKS, RANKS[target].map((l) => l + 1)]
    const rows = levelRows.map((lv) => lv.map((l, j) => levels[j][l]))

    const order = shuffle(rng, [0, 1, 2, 3])
    const shown = order.map((i) => rows[i])
    const names = shown.map((_, i) => `${c.noun} ${'ABCD'[i]}`)
    const higher = c.crits.map((crit) => crit.higher)
    const dominated = dominatedIndexes(shown, higher)
    // The key is read off the dominance test, not off the construction.
    const key = dominated[0] ?? 0
    const beatenBy = shown.findIndex((_, k) => k !== key && shown[k].every((_, j) => (higher[j] ? shown[k][j] > shown[key][j] : shown[k][j] < shown[key][j])))

    const rowText = shown
      .map((r, i) => `- **${names[i]}** — ${r.map((v, j) => `${c.crits[j].label} ${show(v, c.crits[j].unit)}`).join(', ')}`)
      .join('\n')
    const lowers = c.crits.filter((x) => !x.higher).map((x) => x.label)
    const highers = c.crits.filter((x) => x.higher).map((x) => x.label)

    /** Which criterion this row is strictly best on — why it cannot be dropped. */
    const bestOn = (i: number): string => {
      const j = c.crits.findIndex((_, jj) => shown.every((r, k) => k === i || (higher[jj] ? shown[i][jj] > r[jj] : shown[i][jj] < r[jj])))
      return c.crits[j >= 0 ? j : 0].label
    }
    const others = names.map((_n, i) => i).filter((i) => i !== key)
    const noted = mcqNoted(
      rng,
      names[key],
      others.map((i) => [
        names[i],
        `Best on ${bestOn(i)} — nothing in the table beats it there, so ruling it out needs a decision about what matters, not a comparison.`,
        'strategy' as const,
      ]),
    )

    const gaps = c.crits
      .map((crit, j) => `${crit.label} ${show(shown[beatenBy][j], crit.unit)} against ${show(shown[key][j], crit.unit)}`)
      .join(', ')

    return {
      title: 'Drop one without weighing',
      prompt:
        `${c.scene}\n\n${rowText}\n\n` +
        `Lower is better for ${lowers.join(' and ')}; higher is better for ${highers.join(' and ')}.\n\n` +
        `One row here loses to a single other row on **every** column. Which row can go before you decide what matters most to you?`,
      ...noted,
      hints: [
        'Compare rows in PAIRS. You are hunting for a row that one particular rival beats on every single column.',
        'Being worst on one column proves nothing — the row might still be the best on another. It has to lose everywhere, to the same rival.',
        `Worked path: **${names[beatenBy]}** beats **${names[key]}** on all three (${gaps}), so **${names[key]}** goes.`,
      ],
      explanation:
        `**${names[key]}** is the one to drop. **${names[beatenBy]}** beats it on all three columns at once — ${gaps}. ` +
        `Because a single rival wins everywhere, no view you could take about which column matters most would ever make ${names[key]} the winner, so it leaves the table before any weighing starts. That is the whole value of the move: it shrinks the problem using no opinions at all.\n\n` +
        `The tempting error is to drop the row that is worst on the column YOU care about most. That is a preference dressed as a deduction — every remaining row here is the best in the table on something, which is exactly why they all survive.`,
    }
  },
)

interface WeightCase {
  scene: string
  noun: string
  crits: [string, string, string]
}

const WEIGHT_CASES: WeightCase[] = [
  { scene: 'Three weekend jobs you could take for the term.', noun: 'Job', crits: ['pay', 'hours that suit you', 'what you learn'] },
  { scene: 'Three project topics your group could take on.', noun: 'Topic', crits: ['how interesting it is', 'sources you can get', 'how well it fits the brief'] },
  { scene: 'Three routes the walking club could take on Saturday.', noun: 'Route', crits: ['scenery', 'how hard it is', 'how easy it is to reach'] },
  { scene: 'Three second-hand laptops for schoolwork.', noun: 'Laptop', crits: ['speed', 'battery life', 'how sturdy it is'] },
  { scene: 'Three venues for the year-group quiz night.', noun: 'Venue', crits: ['space', 'cost', 'how easy it is to get to'] },
]

const weightedScore = tpl(
  {
    id: 'cl-weighted-score',
    name: 'Weights change the answer',
    skillIds: ['st-tradeoff'],
    bucket: BUCKET,
    difficulty: 3,
    variants: 10,
    minutes: 3.5,
    kind: 'multi',
  },
  (rng, seed) => {
    const c = cycle(seed, WEIGHT_CASES)
    // Draw until the weighted winner and the raw-sum winner are BOTH unique
    // and DIFFERENT: an item where the weights change nothing teaches nothing.
    let w = [4, 3, 3]
    let s = [
      [7, 5, 6],
      [6, 7, 5],
      [5, 6, 7],
    ]
    const weighted = () => s.map((row) => row.reduce((a, v, j) => a + v * w[j], 0))
    const raws = () => s.map((row) => row.reduce((a, v) => a + v, 0))
    const uniqueMax = (xs: number[]) => xs.filter((x) => x === Math.max(...xs)).length === 1
    for (let tries = 0; tries < 400; tries++) {
      const w0 = rint(rng, 1, 6)
      const w1 = rint(rng, 1, 6)
      const w2 = 10 - w0 - w1
      if (w2 < 1 || w2 > 6) continue
      const cand = [w0, w1, w2]
      const rows = Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => rint(rng, 3, 10)))
      const wt = rows.map((row) => row.reduce((a, v, j) => a + v * cand[j], 0))
      const rw = rows.map((row) => row.reduce((a, v) => a + v, 0))
      if (!uniqueMax(wt) || !uniqueMax(rw)) continue
      if (wt.indexOf(Math.max(...wt)) === rw.indexOf(Math.max(...rw))) continue
      w = cand
      s = rows
      break
    }
    const totals = weighted()
    const raw = raws()
    const names = [0, 1, 2].map((i) => `${c.noun} ${'ABC'[i]}`)
    const winner = totals.indexOf(Math.max(...totals))
    const rawWinner = raw.indexOf(Math.max(...raw))

    const weightLines = c.crits.map((label, j) => `- **${label}** — weight ${w[j]}`).join('\n')
    const scoreLines = names
      .map((n, i) => `- **${n}** — ${c.crits.map((label, j) => `${label} ${s[i][j]}`).join(', ')}`)
      .join('\n')

    return {
      title: 'Score it with the weights',
      prompt:
        `${c.scene} You have scored each one out of 10 on three things, and decided how much each thing matters (the weights add up to 10).\n\n` +
        `${weightLines}\n\nScores out of 10:\n\n${scoreLines}`,
      parts: [
        {
          stage: 'Total',
          prompt: `What is **${names[0]}**'s weighted total? Multiply each score by its weight and add the three results.`,
          answer: numeric(totals[0]),
          explanation:
            `(${s[0][0]} × ${w[0]}) + (${s[0][1]} × ${w[1]}) + (${s[0][2]} × ${w[2]}) = **${totals[0]}**. ` +
            `Because the weights add to 10 and the scores are out of 10, every total lands between 10 and 100 — a useful check that you have not added a weight in twice.`,
          hints: [
            'Take one row at a time: score × weight, then add the three products.',
            `Start with ${c.crits[0]}: ${s[0][0]} × ${w[0]}.`,
            `${s[0][0]} × ${w[0]} = ${s[0][0] * w[0]}, ${s[0][1]} × ${w[1]} = ${s[0][1] * w[1]}, ${s[0][2]} × ${w[2]} = ${s[0][2] * w[2]}. Add them: **${totals[0]}**.`,
          ],
        },
        {
          stage: 'Winner',
          prompt: 'Now do the other two the same way. Which one comes out highest?',
          answer: mcq(rng, names[winner], names.filter((_, i) => i !== winner)),
          explanation:
            `Totals: ${names.map((n, i) => `${n} ${totals[i]}`).join(', ')} — so **${names[winner]}** wins.\n\n` +
            `Notice what the weights did. Adding the raw scores with no weights at all, **${names[rawWinner]}** comes top (${raw.map((r, i) => `${names[i]}) ${r}`).join(', ').replace(/\)/g, ' ')}). The weights are not decoration on the arithmetic; they ARE the decision. Everything else is just multiplication.`,
          hints: [
            'You do not need all three totals if one is already far ahead — but two close ones must both be worked out.',
            'Ignoring the weights and adding the raw scores gives a different answer here. That is the trap.',
            `Totals: ${names.map((n, i) => `${n} ${totals[i]}`).join(', ')}.`,
          ],
        },
      ],
      hints: [
        'Weighted total = (score × weight) added up across the three things.',
        'Do one option completely before starting the next; mixing rows is where slips come from.',
        `Totals: ${names.map((n, i) => `${n} ${totals[i]}`).join(', ')}.`,
      ],
      explanation:
        `Weighted totals: ${names.map((n, i) => `${n} ${totals[i]}`).join(', ')}. **${names[winner]}** wins.\n\n` +
        `Two honest limits on this method, worth knowing before you trust a number you built yourself. The weights come from you, so the output is your judgement multiplied out, not an independent verdict — if you dislike the answer, the useful question is which weight you disagree with. And a weighted score can hide a deal-breaker: an option that scores 1 on something you actually cannot live with still totals well if the other columns carry it.`,
    }
  },
)

interface FixedCase {
  setup: string
  ask: string
  key: string
  wrong: [string, string, string]
  note: string
}

const TRADE_CASES: FixedCase[] = [
  {
    setup:
      'Two cousins share a room for the summer. Ravi wants lights out early and barely uses the desk; Noor works late and needs the desk most evenings. They currently alternate: one night by Ravi\'s rules, the next by Noor\'s.',
    ask: 'What change leaves both of them better off?',
    key: 'Give Ravi the lights-out rule every night and Noor the desk every night',
    wrong: [
      'Keep alternating the nights, but write the rota down so that it is followed',
      'Split each evening in half so both get quiet time and both get a desk',
      'Ask an adult to set one fixed rule for the whole of the summer break',
    ],
    note:
      'Their priorities are lopsided, so each can hand over the whole of what they care about least. Alternating gives each of them a bad night every other night; halving each evening gives each of them half a bad evening, every evening.',
  },
  {
    setup:
      'The school paper has two editors. Ida argues hardest about which story leads the front page and shrugs at the layout; Sam has firm views on layout and photos and no opinion on the lead. Both sign off on everything, and each issue takes three meetings.',
    ask: 'What is the change worth making?',
    key: 'Let Ida decide the lead story and let Sam decide layout and photos',
    wrong: [
      'Keep both signing off on everything, but cap each meeting at 20 minutes',
      'Alternate whole issues: Ida decides this one, Sam decides the next one',
      'Add a third editor whose vote settles disagreements',
    ],
    note:
      'Each already concedes one issue in every argument — the trade only formalises what they would agree to anyway. Alternating whole issues is worse than it looks: half the time the person who cares least is deciding.',
  },
  {
    setup:
      'Two friends are planning a Saturday. Theo cares enormously about where they eat and is happy with any afternoon plan; Mira wants a particular exhibition and will eat anywhere. Both decisions are currently settled by coin toss.',
    ask: 'What should they do instead?',
    key: 'Let Theo choose where they eat and Mira choose the afternoon plan',
    wrong: [
      'Toss the coin twice on each and take the best of three',
      'Toss once, and let whoever wins that toss decide both parts of the day',
      'Each names a second choice, and they go with the two second choices',
    ],
    note:
      'A coin toss treats both decisions as equally contested when neither actually is. The second-choice compromise is the classic bad trade: it makes both people worse off than simply handing each the decision they care about.',
  },
  {
    setup:
      'A science-fair pair has to build a model and write a report. Kofi enjoys building and finds writing painful; Ana writes easily and dreads the soldering. They have agreed to split each of the two jobs exactly in half.',
    ask: 'What is the better split?',
    key: 'Kofi builds the whole model and Ana writes the whole report',
    wrong: [
      'Keep halving both jobs, but agree who starts which half first',
      'Swap halfway through, so each of them tries both parts of it',
      'Whoever has more free time that week takes the larger half',
    ],
    note:
      'Halving each job guarantees both people spend half their time on the part they are worse at and dislike. Trading whole jobs uses the same total hours and produces better work on both.',
  },
  {
    setup:
      'After the school fair, two volunteers must stack the chairs and count the cash box. Bea is fast with numbers and hates lifting; Dan lifts happily and loses track of totals. Every year they split both jobs down the middle.',
    ask: 'What should they change?',
    key: 'Bea counts the whole cash box and Dan stacks all of the chairs',
    wrong: [
      'Halve both jobs, but start earlier so it is less rushed',
      'Take turns by year: one does both jobs, the other does both next',
      'Ask a third volunteer to take half of each job off the two of them',
    ],
    note:
      'Starting earlier fixes the rush and not the mismatch. Taking turns by year is a trade across time rather than across issues, and it makes one person miserable for a whole evening instead of neither of them.',
  },
  {
    setup:
      'Two walkers are planning a weekend hike. Jonah cares only about the route and will eat anything; Priti wants proper food and will walk wherever. They currently vote on every item on the list, route and menu alike.',
    ask: 'What is the better arrangement?',
    key: 'Jonah picks the route outright and Priti plans all of the food',
    wrong: [
      'Keep voting on every single item but with a strict time limit',
      'Each gives way on alternate items, all the way down the list',
      'Pick the middle option on every item so that neither one loses',
    ],
    note:
      'The middle option on everything is the even split in disguise: same effort, nobody satisfied. Giving way on alternate items ignores which items are which, so half the concessions land on the wrong side.',
  },
  {
    setup:
      'Two students both want the single Saturday slot in the recording studio. Neither has any view about which microphone or which engineer they get, and there is nothing else being decided.',
    ask: 'What does the situation allow?',
    key: 'There is nothing to trade here — split the slot or draw for it',
    wrong: [
      'Give one of them the slot and the other the pick of microphones',
      'Give one the slot this month and let the other pick the room next',
      'Have each of them rank the microphones and trade along that list',
    ],
    note:
      'A trade needs at least two issues valued UNEQUALLY. Here there is one issue and they want it equally, so nothing can be swapped and the honest answer is a fair split or a draw. Reaching for the technique when the ingredients are missing is how a method turns into a superstition.',
  },
]

const issueTrade = tpl(
  {
    id: 'cl-issue-trade',
    name: 'Trade whole issues, not halves of each',
    skillIds: ['st-tradeoff'],
    bucket: BUCKET,
    difficulty: 3,
    variants: TRADE_CASES.length,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, TRADE_CASES)
    return {
      title: 'Split it, or swap it?',
      prompt: `${c.setup}\n\n${c.ask}`,
      answer: mcq(rng, c.key, c.wrong),
      hints: [
        'List the separate issues first, then ask how much EACH side cares about each one.',
        'Where the two sides care unequally, splitting every issue down the middle throws that difference away.',
        `Worked path: **${c.key}**.`,
      ],
      explanation: `**${c.key}**. ${c.note}`,
    }
  },
)

interface RateCase {
  scene: string
  slow: string
  fast: string
}

const RATE_CASES: RateCase[] = [
  { scene: 'Getting to the county chess match on Saturday.', slow: 'the bus', fast: 'the train' },
  { scene: 'Getting the club badges made in time for the fair.', slow: 'standard post', fast: 'courier' },
  { scene: 'Getting across town to the Saturday art class.', slow: 'two buses', fast: 'a direct taxi' },
  { scene: 'Getting the printed programmes back before the show.', slow: 'the cheap printer', fast: 'the fast printer' },
  { scene: 'Getting home from the away fixture on Sunday.', slow: 'the shuttle bus', fast: 'the express coach' },
]

const tradeRate = tpl(
  {
    id: 'cl-trade-rate',
    name: 'What one minute costs you here',
    skillIds: ['st-tradeoff'],
    bucket: BUCKET,
    difficulty: 3,
    variants: 10,
    minutes: 3,
    kind: 'multi',
  },
  (rng, seed) => {
    const c = cycle(seed, RATE_CASES)
    const slowMin = rint(rng, 55, 95)
    const saved = rint(rng, 12, 40)
    const fastMin = slowMin - saved
    const cheap = rint(rng, 3, 12)
    const cents = rint(rng, 6, 34)
    const extraCents = cents * saved
    const dear = round(cheap + extraCents / 100, 2)
    const hourly = round((cents * 60) / 100, 2)

    return {
      title: 'Price the minutes',
      prompt:
        `${c.scene}\n\n` +
        `- **Slower** — ${c.slow}, ${money(cheap)}, takes ${slowMin} minutes\n` +
        `- **Faster** — ${c.fast}, ${money(dear)}, takes ${fastMin} minutes\n\n` +
        `The faster one costs ${money(round(extraCents / 100, 2))} more and saves ${saved} minutes.`,
      parts: [
        {
          stage: 'Rate',
          prompt: 'How many **cents** is each minute saved costing you? Give a whole number of cents.',
          answer: numeric(cents),
          explanation:
            `${money(round(extraCents / 100, 2))} is ${extraCents} cents, spread over ${saved} minutes saved: ${extraCents} ÷ ${saved} = **${cents} cents a minute**. ` +
            `Dividing the extra cost by the time saved is what turns two things that cannot be compared into one number that can.`,
          hints: [
            'Turn the extra cost into cents first, then share it over the minutes saved.',
            `Extra cost = ${money(dear)} − ${money(cheap)} = ${money(round(extraCents / 100, 2))}, which is ${extraCents} cents.`,
            `${extraCents} ÷ ${saved} = **${cents}** cents per minute.`,
          ],
        },
        {
          stage: 'Per hour',
          prompt: 'At that rate, what would a whole hour of saved time cost? Answer in dollars.',
          answer: numeric(hourly, { tolerance: 0.005 }),
          explanation:
            `${cents} cents × 60 = ${cents * 60} cents = **${money(hourly)} an hour**. ` +
            `The per-hour figure is the useful one, because it is the unit you already have a feel for — you can compare ${money(hourly)} against what an hour is worth to you, which is impossible to do with "${cents} cents".`,
          hints: [
            'An hour is 60 of those minutes.',
            `${cents} × 60 gives the cost in cents; divide by 100 for dollars.`,
            `${cents} × 60 = ${cents * 60} cents = **${money(hourly)}**.`,
          ],
        },
        {
          stage: 'Decide',
          prompt: 'That number does not decide anything on its own. What does it have to be compared against?',
          answer: mcq(rng, 'Whether that hour is worth more to you than the money it costs', [
            'Whether the faster option is more than twice as fast overall',
            'Whether the extra amount is small compared with the fare itself',
            'Whether the faster option is the one that most people take here',
          ]),
          explanation:
            `The exchange rate converts minutes into money; it cannot tell you your own price. ${money(hourly)} an hour is a bargain if the hour goes on something you value and a waste if the hour goes on nothing. ` +
            `"The extra is small compared with the fare" is the tempting one, and it is a percentage talking: ${money(round(extraCents / 100, 2))} is the same ${money(round(extraCents / 100, 2))} whether the base fare is ${money(cheap)} or ten times that.`,
          hints: [
            'The number is a price. A price only means something next to what the thing is worth to you.',
            'Two of the options compare the extra cost with something other than the value of your time.',
            'Worked path: compare the hourly figure with what an hour of your time is actually worth to you.',
          ],
        },
      ],
      hints: [
        'Find the extra cost and the time saved, then divide one by the other.',
        'Work in cents while dividing — it keeps the arithmetic whole-numbered.',
        `Worked path: ${extraCents} cents ÷ ${saved} min = **${cents} cents a minute**, so an hour costs **${money(hourly)}**.`,
      ],
      explanation:
        `Extra cost ${extraCents} cents ÷ ${saved} minutes saved = **${cents} cents a minute**, which is **${money(hourly)} an hour**.\n\n` +
        `This is the general move behind every trade-off: when two options differ on two things, divide the difference on one by the difference on the other, and you get an exchange rate. The rate is a fact. Whether to accept it is a preference — and keeping those two apart is most of the skill.`,
    }
  },
)

/**
 * Every noun here is FIVE letters, which is not decoration: it makes
 * `Drop Route A` and `Drop nothing` exactly the same length, so the option that
 * says "nothing can be eliminated" is never the longest or the shortest choice
 * on screen. A learner who spots that this item sometimes has no answer must
 * not be able to spot WHICH times from the shape of the options.
 */
const DROP_CASES: { scene: string; noun: string; a: string; b: string; unitA: Unit; unitB: Unit; fromA: [number, number]; fromB: [number, number] }[] = [
  { scene: 'Three routes to the museum on Saturday.', noun: 'Route', a: 'fare', b: 'journey', unitA: 'money', unitB: 'min', fromA: [4, 9], fromB: [25, 45] },
  { scene: 'Three stores that could make the club badges.', noun: 'Store', a: 'price', b: 'wait', unitA: 'money', unitB: 'day', fromA: [18, 34], fromB: [4, 12] },
  { scene: 'Three places to buy lunch near school.', noun: 'Place', a: 'price', b: 'walk', unitA: 'money', unitB: 'min', fromA: [4, 8], fromB: [3, 11] },
  { scene: 'Three quotes for repairing the club laptop.', noun: 'Quote', a: 'price', b: 'wait', unitA: 'money', unitB: 'day', fromA: [35, 70], fromB: [2, 9] },
  { scene: 'Three offers from printers for the posters.', noun: 'Offer', a: 'cost', b: 'turnaround', unitA: 'money', unitB: 'day', fromA: [22, 45], fromB: [3, 10] },
]

const dropOrWeigh = tpl(
  {
    id: 'cl-drop-or-weigh',
    name: 'Can you rule one out yet?',
    skillIds: ['st-tradeoff'],
    bucket: BUCKET,
    difficulty: 1,
    variants: 10,
    minutes: 2,
  },
  (rng, seed) => {
    const c = cycle(seed, DROP_CASES)
    const wantDominated = seed % 2 === 0
    const pA = rint(rng, c.fromA[0], c.fromA[1])
    const pB = pA + rint(rng, 3, 8)
    const pC = pB + rint(rng, 3, 8)
    const tA = rint(rng, c.fromB[0], c.fromB[1])
    const tB = tA - rint(rng, 2, 6)
    const tC = tB - rint(rng, 2, 6)
    // Front: cheaper is slower. Adding a row one notch worse than the first
    // row on BOTH columns leaves exactly that row dominated, and nothing else.
    const rows = wantDominated
      ? [
          [pA, tA],
          [pC, tC],
          [pA + rint(rng, 1, 2), tA + rint(rng, 2, 5)],
        ]
      : [
          [pA, tA],
          [pB, tB],
          [pC, tC],
        ]
    const order = shuffle(rng, [0, 1, 2])
    const shown = order.map((i) => rows[i])
    const names = shown.map((_, i) => `${c.noun} ${'ABC'[i]}`)
    const dominated = dominatedIndexes(shown, [false, false])
    // `Drop nothing` is exactly as long as `Drop Route A` by construction.
    const NONE = 'Drop nothing'
    const key = dominated.length === 1 ? `Drop ${names[dominated[0]]}` : NONE
    const wrong =
      dominated.length === 1
        ? [...names.filter((_, i) => i !== dominated[0]).map((n) => `Drop ${n}`), NONE]
        : names.map((n) => `Drop ${n}`)

    const rowText = shown
      .map((r, i) => `- **${names[i]}** — ${c.a} ${show(r[0], c.unitA)}, ${c.b} ${show(r[1], c.unitB)}`)
      .join('\n')
    const worked =
      dominated.length === 1
        ? `**${names[dominated[0]]}** loses on both columns to another row, so it can go.`
        : `Every row here is the best on one of the two columns, so nothing can go yet.`

    return {
      title: 'Rule one out, or weigh them',
      prompt:
        `${c.scene}\n\n${rowText}\n\nLower is better on both columns.\n\n` +
        `Which one can you rule out **without** deciding whether ${c.a} or ${c.b} matters more to you?`,
      answer: mcq(rng, key, wrong),
      hints: [
        `Check each row: is there another row that beats it on ${c.a} AND on ${c.b}?`,
        'If a row is the best in the table on either column, it survives — you would need a preference to remove it.',
        `Worked path: ${worked}`,
      ],
      explanation:
        `${worked}\n\n` +
        `A row can only be ruled out for free when one single rival beats it on everything. If each row wins somewhere, the table has done all it can and the rest of the decision is about you: which column you would pay more to improve. Noticing WHICH of those two situations you are in is the point — about half of these tables have nothing to drop at all, and reaching for an elimination that is not there is how people talk themselves out of a perfectly good option.`,
    }
  },
)

// =============================================================== st-reversible

const UNDO_SETS: { title: string; steps: string[] }[] = [
  {
    title: 'the club poster',
    steps: [
      'Redraw the pencil layout (rub it out, two minutes)',
      'Reprint 40 colour posters (paper and ink, about $22)',
      'Collect the posters already stuck up around school (a morning of walking)',
      'Recall the version already emailed to 300 families (it cannot be recalled)',
    ],
  },
  {
    title: 'the school play',
    steps: [
      'Change a line in the script (edit the shared file, no cost)',
      'Change the costume order (the shop keeps a $15 restocking fee)',
      'Change the set design after the timber is cut (buy timber again, $140)',
      'Change the play itself after the tickets are printed and sold (not possible)',
    ],
  },
  {
    title: 'the group project files',
    steps: [
      'Rename a file in the shared folder (rename it back, seconds)',
      'Move the folder to another account (re-share it with four people, an hour)',
      'Overwrite the final file with an old one (rebuild two evenings of work)',
      'Empty the bin holding the only backup (there is nothing left to restore)',
    ],
  },
  {
    title: 'the community garden',
    steps: [
      'Move a plant pot to a different corner (carry it back, one minute)',
      'Turn the empty bed over with a fork (rake it flat again, about an hour)',
      'Lay the paving slabs on sand (lift them and relay them, a whole weekend)',
      'Cut down the old apple tree (it will not grow back in your lifetime)',
    ],
  },
  {
    title: 'forty dollars',
    steps: [
      'Move $40 between your own two accounts (move it straight back)',
      'Buy a game that is refundable for 14 days (ask for a refund, minus $2)',
      'Lend $40 to someone who repays slowly (you may be waiting months)',
      'Spend $40 on a ticket for a gig that has now happened (nothing to recover)',
    ],
  },
]

const undoCost = tpl(
  {
    id: 'cl-undo-cost',
    name: 'Order by what undoing costs',
    skillIds: ['st-reversible'],
    bucket: BUCKET,
    difficulty: 2,
    variants: UNDO_SETS.length,
    minutes: 3,
  },
  (rng, seed) => {
    const set = cycle(seed, UNDO_SETS)
    let display = shuffle(rng, set.steps)
    // A display order that already IS the answer turns the item into "submit".
    if (display.every((s, i) => s === set.steps[i])) display = [...display.slice(1), display[0]]
    const correct = set.steps.map((s) => display.indexOf(s))
    return {
      title: 'Cheapest mistake first',
      prompt:
        `Four moves in ${set.title}. Each one could turn out to be wrong.\n\n` +
        `Put them in order by what UNDOING would cost — the cheapest mistake to reverse first, the most expensive last.`,
      answer: { type: 'order', options: display, correct },
      hints: [
        'Ignore how big the action feels. Ask only one question: if this turns out wrong, what does getting back cost?',
        'Money, time and "impossible" are three different sizes of answer — and impossible always comes last.',
        `Worked path: ${set.steps.join(' → ')}.`,
      ],
      explanation:
        `${set.steps.join(' → ')}.\n\n` +
        `The useful habit that falls out of this ordering: spend your deliberation where undoing is expensive, and move fast where it is cheap. A decision you can reverse in two minutes does not deserve an evening of thought, and one that cannot be reversed at all deserves more than it usually gets. This is a rule of thumb rather than a measured result — no study says it makes people decide better — but it is cheap to apply and it costs nothing when it is wrong.`,
    }
  },
)

const TEST_CASES: FixedCase[] = [
  {
    setup:
      'You are about to spend all your savings on a second-hand electric piano from an online listing, sight unseen. What you do not know is whether all the keys work.',
    ask: 'What is the smallest thing that would settle it first?',
    key: 'Ask to visit and play every key for ten minutes before paying',
    wrong: [
      'Read every review of that model that you can find online first',
      'Buy it, and rely on being able to resell it if the keys fail',
      'Ask a friend who owns a different model whether they like theirs',
    ],
    note:
      'Reviews describe the model; the uncertainty is about this particular instrument. Reselling is not a test, it is the commitment with a hopeful ending attached.',
  },
  {
    setup:
      'Your club is about to print 300 programmes with the running order on them. What you do not know is whether two of the acts will actually turn up.',
    ask: 'What settles it most cheaply, first?',
    key: 'Ask both acts to confirm in writing before the print run starts',
    wrong: [
      'Print the 300 and add a correction slip later if anyone drops out',
      'Print 300 anyway, because the printer gives a discount at that size',
      'Ask the audience afterwards whether the running order was clear to them',
    ],
    note:
      'The discount is real and it is answering a different question — a cheaper way to be wrong is still being wrong. Asking afterwards produces the information one day after it could have been used.',
  },
  {
    setup:
      'You are about to sign up for a full-year Saturday course whose fee cannot be refunded. What you do not know is whether you can face the Saturday travel every week.',
    ask: 'What is the smallest test worth running?',
    key: 'Do the Saturday journey once, at the real time, before you sign',
    wrong: [
      'Sign up now and drop out later if the travel turns out to be too hard',
      'Check the timetable and estimate the time',
      'Ask somebody who lives near the venue how they find the journey there',
    ],
    note:
      'A timetable tells you the scheduled time, not what an early Saturday actually feels like; someone who lives nearby is answering about a different journey. One real trip costs a morning and answers exactly the question.',
  },
  {
    setup:
      'The stage crew is about to repaint the whole set in a new colour. What nobody knows is whether that colour reads properly under the stage lights.',
    ask: 'What should happen before the repaint?',
    key: 'Paint one small board and stand it under the real stage lights',
    wrong: [
      'Buy all the paint first; the shop sells it in bulk',
      'Ask the drama teacher which colour they would personally choose',
      'Paint the whole set and judge it in the daylight the next morning',
    ],
    note:
      'Judging it in daylight tests the paint under the wrong conditions, which is worse than not testing at all because it produces a confident wrong answer. One board under the real lights costs an hour.',
  },
  {
    setup:
      'You are about to book non-refundable coach seats for twelve people going to the tournament. What you do not know is whether all twelve can really come.',
    ask: 'What is the cheapest way to find out first?',
    key: 'Collect the deposit from all twelve before you book the coach',
    wrong: [
      'Book the twelve seats and chase anybody who has not paid up later',
      'Count the thumbs-up reactions in the group chat',
      'Book ten seats now and hope the last two sort themselves out later',
    ],
    note:
      'A thumbs-up costs nothing to give, so it measures enthusiasm rather than commitment. A deposit costs something, which is exactly why it carries information.',
  },
  {
    setup:
      'You are about to delete the old project folder to free up space. What you do not know is whether the new version really contains everything.',
    ask: 'What is the smallest safe move?',
    key: 'Rename the old folder and leave it untouched for a week first',
    wrong: [
      'Delete it now and rebuild anything that turns out to be missing',
      'Compare the two folder sizes and delete if they roughly match up',
      'Ask a group member whether they think the new version is complete',
    ],
    note:
      'Matching folder sizes is a proxy that fails silently — two folders can weigh the same and differ. Renaming costs nothing and turns an irreversible move into a reversible one for a week.',
  },
  {
    setup:
      'The club is about to commit its whole budget to one big end-of-term event. What nobody knows is whether enough people will actually turn up.',
    ask: 'What is worth doing first?',
    key: 'Run a small free version first and count who turns up to it',
    wrong: [
      'Commit the budget now and advertise harder if ticket sales are low',
      'Ask the committee whether it will be busy',
      'Book the biggest hall, because a full small hall looks worse anyway',
    ],
    note:
      'The committee is the group most likely to overestimate its own event. A small free run costs an afternoon and produces an actual head count instead of an opinion.',
  },
  {
    setup:
      'You are about to order 40 hoodies with the team logo, in the sizes people gave you. What you do not know is whether those sizes are right.',
    ask: 'What would settle it before the order goes in?',
    key: 'Order one hoodie in the most common size and try it on first',
    wrong: [
      'Order all 40 and swap sizes between people once they arrive',
      'Ask everyone to confirm their size again in the group chat now',
      'Order 40 in one middle size, so at least everything will match',
    ],
    note:
      'Asking again re-collects the same guessed numbers; people report the size they think they are. One physical hoodie replaces everyone\'s guess with a measurement.',
  },
]

const smallestTest = tpl(
  {
    id: 'cl-smallest-test',
    name: 'The smallest test that would settle it',
    skillIds: ['st-reversible'],
    bucket: BUCKET,
    difficulty: 3,
    variants: TEST_CASES.length,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, TEST_CASES)
    return {
      title: 'Test before the door shuts',
      prompt: `${c.setup}\n\n${c.ask}`,
      answer: mcq(rng, c.key, c.wrong),
      hints: [
        'Name the ONE thing you are unsure about, in a sentence. A good test answers that sentence and nothing else.',
        'Two things disqualify a test: it costs about as much as the mistake, or it produces its answer after the door has shut.',
        `Worked path: **${c.key}**.`,
      ],
      explanation:
        `**${c.key}**. ${c.note}\n\n` +
        `A test earns its place when it is much cheaper than the mistake it prevents AND it answers the actual uncertainty. Failing either half makes it theatre: a cheap test of the wrong thing buys false confidence, and an expensive test of the right thing is just the commitment in disguise.`,
    }
  },
)

interface PlanCase {
  title: string
  steps: string[]
  key: number
  notes: Record<number, string>
  why: string
}

const NO_RETURN_CASES: PlanCase[] = [
  {
    title: 'The club trip',
    steps: [
      'Ask who wants to come and write the names on a list.',
      'Collect a $10 deposit from each person. The club refunds it if the trip is cancelled.',
      'Pay the coach company. Their terms say the payment is not returned once made.',
      'Print the day schedules at school. Paper and ink cost about $4.',
      'Hand the schedules out on the morning of the trip.',
    ],
    key: 3,
    notes: {
      1: 'Nobody has spent anything yet. A list of names feels like a commitment and costs nothing to change.',
      2: 'Money has moved, but the club refunds it. A step that can be undone at no cost is not the door.',
      4: 'It costs money — about $4 — and it can simply be reprinted. Expense is not the same as irreversibility.',
      5: 'By here the door has already closed. This step is downstream of the decision that could not be taken back.',
    },
    why: 'The coach payment is the first step the club cannot walk back from at any price.',
  },
  {
    title: 'The corridor mural',
    steps: [
      'Sketch three designs on paper and pick one.',
      'Buy the paint. The shop takes unopened tins back within 30 days.',
      'Mark the outline on the wall in chalk.',
      'Roll the base coat over the old mural, covering it completely.',
      'Paint the detail on top of the base coat.',
    ],
    key: 4,
    notes: {
      1: 'Sketches are the cheapest possible thing to change, which is exactly what they are for.',
      2: 'It is the biggest spend so far, and unopened tins go back. Size of spend is not the test.',
      3: 'Chalk wipes off. It looks like commitment on the actual wall, and it is not one.',
      5: 'The irreversible thing already happened underneath this. Detail can be painted over again.',
    },
    why: 'The old mural stops existing the moment the base coat goes on; nothing after that can bring it back.',
  },
  {
    title: 'The year-group newsletter',
    steps: [
      'Draft the articles in a shared document.',
      'Ask two teachers to read it and suggest changes.',
      'Send the newsletter to the 400 addresses on the list.',
      'Post the same text on the noticeboard outside the hall.',
      'Collect replies and note what to change next month.',
    ],
    key: 3,
    notes: {
      1: 'A draft is the most editable object in the whole plan.',
      2: 'Feedback can be taken or ignored; asking for it costs the teachers ten minutes and commits nobody.',
      4: 'A noticeboard sheet can be taken down in the time it takes to walk there.',
      5: 'This is reading what happened after the fact, not a step that could go wrong.',
    },
    why: 'Four hundred sent emails cannot be unsent — a wrong name or a wrong date is out and stays out.',
  },
  {
    title: 'The bookshelf build',
    steps: [
      'Measure the alcove and sketch the shelf sizes.',
      'Order the timber, which the yard will take back uncut.',
      'Cut every board to the measured length.',
      'Sand the cut edges smooth.',
      'Screw the shelves into the wall brackets.',
    ],
    key: 3,
    notes: {
      1: 'A wrong measurement here is a rubbed-out number, as long as it is caught before the saw.',
      2: 'Uncut timber goes back to the yard. The money is recoverable, so this is not the door.',
      4: 'Sanding removes very little; a badly sanded edge can be sanded again.',
      5: 'Screws come out and holes get filled. It is annoying, not final.',
    },
    why: 'A board cut too short cannot be made longer, so the saw is where the plan stops being reversible.',
  },
  {
    title: 'The competition entry',
    steps: [
      'Choose which piece to enter from the three you have.',
      'Ask a teacher to check the entry form with you.',
      'Submit the entry form. Entries cannot be changed or withdrawn after this.',
      'Book the travel, which is refundable up to two days before.',
      'Rehearse the piece in the week before the date.',
    ],
    key: 3,
    notes: {
      1: 'You can change your mind about the piece right up until the form goes in.',
      2: 'A check is advice. Nothing about the entry has actually happened yet.',
      4: 'The travel is refundable up to two days before, so the money is not committed here.',
      5: 'Rehearsal changes how well it goes, not whether you are in.',
    },
    why: 'The form is the one step whose terms say plainly that it cannot be taken back.',
  },
  {
    title: 'The old laptop',
    steps: [
      'Copy the photos and coursework onto a memory stick.',
      'Check that the copies open on another machine.',
      'Sign out of the accounts on the laptop.',
      'Wipe the drive, which removes everything that was on it.',
      'Give the laptop to the school recycling collection.',
    ],
    key: 4,
    notes: {
      1: 'Copying adds a second copy. Nothing is lost even if the copy is bad.',
      2: 'Checking is what makes the next steps safe. It changes nothing by itself.',
      3: 'You can sign back in. This is the reversible half of the tidying up.',
      5: 'Once the drive is wiped, handing the machine over adds nothing that was not already gone.',
    },
    why: 'The wipe is where the only remaining copy of anything not backed up disappears for good.',
  },
]

const pointOfNoReturn = tpl(
  {
    id: 'cl-no-return',
    name: 'Where the door shuts',
    skillIds: ['st-reversible'],
    bucket: BUCKET,
    difficulty: 3,
    variants: NO_RETURN_CASES.length,
    minutes: 3,
    transfer: true,
  },
  (rng, seed) => {
    const c = cycle(seed, NO_RETURN_CASES)
    const label = (n: number) => `Step ${n}`
    const noted = mcqNoted(
      rng,
      label(c.key),
      c.steps
        .map((_, i) => i + 1)
        .filter((n) => n !== c.key)
        .map((n) => [label(n), c.notes[n] ?? 'This step can be undone at modest cost.', 'inference' as const]),
    )
    return {
      title: 'Find the one-way step',
      prompt:
        `PLAN — ${c.title}:\n\n` +
        c.steps.map((s, i) => `- **Step ${i + 1}** ${s}`).join('\n') +
        `\n\nWhich step is the point of no return — the first one that cannot be undone at any sensible cost?`,
      ...noted,
      hints: [
        'Go step by step and ask what undoing THAT step would take. Most of them have a price; one has no price at all.',
        'Costing money is not the test. A step can be the most expensive one in the plan and still be completely reversible.',
        `Worked path: **${label(c.key)}**. ${c.why}`,
      ],
      explanation:
        `**${label(c.key)}**. ${c.why}\n\n` +
        `Two things this changes. Everything BEFORE that step can be done quickly, because a mistake there is cheap to fix — and treating those steps as weighty is how plans stall. Everything that matters about the decision should happen just before that step: the checks, the second opinion, the small test. Afterwards the checking is theatre, because there is nothing left to do with the answer.`,
    }
  },
)

const TRY_CASES: { thing: string; trial: string; sell: string }[] = [
  { thing: 'a trumpet', trial: 'rent one for a fortnight', sell: 'sell it on second-hand' },
  { thing: 'a mountain bike', trial: 'hire one for a weekend', sell: 'sell it on second-hand' },
  { thing: 'a drawing tablet', trial: 'borrow the club\'s for a week', sell: 'sell it on second-hand' },
  { thing: 'a sewing machine', trial: 'use the library\'s for a week', sell: 'sell it on second-hand' },
  { thing: 'a set of climbing shoes', trial: 'hire a pair for two sessions', sell: 'sell them on second-hand' },
]

const tryVsCommit = tpl(
  {
    id: 'cl-try-vs-commit',
    name: 'What being wrong costs each way',
    skillIds: ['st-reversible'],
    bucket: BUCKET,
    difficulty: 3,
    variants: 10,
    minutes: 3.5,
    kind: 'multi',
  },
  (rng, seed) => {
    const c = cycle(seed, TRY_CASES)
    const buy = rint(rng, 12, 40) * 5
    const resell = rint(rng, 4, 12) * 5
    const lost = buy - resell
    const trial = rint(rng, 2, Math.max(3, Math.floor(lost / 5) - 2)) * 3
    const saved = lost - trial

    return {
      title: 'Two ways to be wrong',
      prompt:
        `You are not sure whether ${c.thing} will suit you.\n\n` +
        `- **Commit** — buy it new for **${money(buy)}**. If it turns out not to suit you, you can ${c.sell} for about **${money(resell)}**.\n` +
        `- **Try** — ${c.trial} for **${money(trial)}**, then decide.`,
      parts: [
        {
          stage: 'Commit',
          prompt: 'If you buy it and it turns out to be wrong for you, how many dollars are gone for good?',
          answer: numeric(lost),
          explanation:
            `${money(buy)} out, ${money(resell)} back: **${money(lost)}** is unrecoverable. ` +
            `The full price is not the size of the mistake — what you can get back shrinks it, which is why "how much can I recover?" is worth asking BEFORE buying rather than after.`,
          hints: [
            'The mistake costs what you cannot get back, not what you paid.',
            `${money(buy)} minus what it resells for.`,
            `${money(buy)} − ${money(resell)} = **${money(lost)}**.`,
          ],
        },
        {
          stage: 'Try',
          prompt: 'How many dollars more does the mistake cost you if you skip the trial and buy straight away?',
          answer: numeric(saved),
          explanation:
            `Being wrong after a trial costs ${money(trial)}. Being wrong after buying costs ${money(lost)}. The difference is **${money(saved)}** — that is what the trial is buying you, and it is the number to compare against its ${money(trial)} price.`,
          hints: [
            'Compare the two ways of being wrong, not the two ways of being right.',
            `${money(lost)} is the cost of one, ${money(trial)} is the cost of the other.`,
            `${money(lost)} − ${money(trial)} = **${money(saved)}**.`,
          ],
        },
        {
          stage: 'Rule',
          prompt: 'In general, what makes a trial like this one worth running?',
          answer: mcq(rng, 'Costs far less than the mistake, and answers the real uncertainty', [
            'Costs far less than the mistake, whatever it answers',
            'Answers the real uncertainty, at whatever price the trial comes to',
            'Confirms the choice you already prefer, before you commit money',
          ]),
          explanation:
            `Both halves are needed. A ${money(trial)} trial that tells you nothing about whether ${c.thing} suits you is ${money(trial)} spent on reassurance; a trial that answers the question perfectly but costs ${money(lost)} has simply moved the mistake, not shrunk it. ` +
            `The last option names the commonest failure: running a trial designed to agree with you, which is why deciding in advance what result would change your mind is part of the test.`,
          hints: [
            'Two of the options keep one half of the rule and quietly drop the other.',
            'Ask what a trial is FOR: it has to be cheap, and it has to be about the thing you do not know.',
            'Worked path: it must cost far less than the mistake AND answer the real uncertainty.',
          ],
        },
      ],
      hints: [
        'Work out what each route costs WHEN IT GOES WRONG — that is where the two differ.',
        'Buying and reselling does not cost the full price; the gap between them is the real loss.',
        `Worked path: mistake after buying ${money(lost)}, mistake after trying ${money(trial)}, difference **${money(saved)}**.`,
      ],
      explanation:
        `Buying and being wrong costs ${money(buy)} − ${money(resell)} = **${money(lost)}**. Trying and being wrong costs **${money(trial)}**. The trial caps the mistake at ${money(trial)} for a price of ${money(trial)}, saving ${money(saved)} in the bad case.\n\n` +
        `This is what "reversible" means in numbers rather than in atmosphere. A decision is not simply reversible or not — it has an undo price, and the whole trick is to find the route with a small one and pay a little for it. Matching how long you deliberate to how big that undo price is has no study behind it; it is a rule of thumb, and this arithmetic is why it is a reasonable one.`,
    }
  },
)

// ============================================================== st-secondorder

const THEN_WHAT_CASES: FixedCase[] = [
  {
    setup:
      'The canteen opens a second till reserved for people buying one item only, to shorten the main queue. In the first week the main queue really does get shorter.',
    ask: 'What happens after that?',
    key: 'People split their orders and rejoin, so the express till backs up',
    wrong: [
      'Everyone keeps buying the same way and both queues stay shorter',
      'The canteen sells less food because two queues confuse the buyers',
      'The main queue gets longer because the staff are split between tills',
    ],
    note:
      'The rule creates a reward for buying one item at a time, and rewards get taken. The queue does not disappear; it moves to wherever the rule made it cheapest to stand.',
  },
  {
    setup:
      'A school offers a prize to the tutor group reporting the fewest lost-property items each month. Reports halve in the first month. The lost-property cupboard is as full as it has ever been.',
    ask: 'What is the most likely explanation?',
    key: 'Fewer items are being reported, and not fewer items being lost',
    wrong: [
      'Students are looking after their belongings far more carefully now',
      'The lost-property office has got better at returning things quickly',
      'Fewer items are brought into school now',
    ],
    note:
      'The full cupboard settles it: the losing has not changed, only the reporting. The prize was attached to the count, and the count is the one thing anybody can move directly.',
  },
  {
    setup:
      'The chess club starts charging $2 a session to stop the room being overcrowded. Numbers fall from 40 to 22, and the room is comfortable.',
    ask: 'What else has the fee done?',
    key: 'It has filtered out the casual beginners, not just the excess',
    wrong: [
      'It has raised the standard of play by removing the weaker members',
      'It has spread the same 40 players out across more sessions weekly',
      'It has made the remaining players turn up more',
    ],
    note:
      'A price does not select the people you meant to lose; it selects the people for whom $2 matters most, which in a school is beginners and anyone whose parents are not paying. The room got quieter and the entry route got narrower.',
  },
  {
    setup:
      'A teacher docks 10% a day for late homework, to stop work arriving late. Late submissions drop sharply, and the marks for content drop at the same time. The same pattern appears again the following term.',
    ask: 'What is the most likely mechanism?',
    key: 'Work arrives on time but unfinished, so the content marks fall',
    wrong: [
      'Students are simply spending less time on their homework than before',
      'The teacher is marking harder now that the work is arriving on time',
      'The hardest topics landed in those weeks',
    ],
    note:
      'The rule prices lateness and prices nothing else, so the cheapest response is to hand in whatever exists at the deadline. The coincidence explanation is a fair thing to raise — and it is killed by the pattern repeating in a different term with different topics.',
  },
  {
    setup:
      'A shop near school starts letting only two students in at a time, to cut the crowding inside. Crowding inside drops immediately.',
    ask: 'What happens outside?',
    key: 'A queue of waiting students forms on the pavement outside',
    wrong: [
      'Students stop going to the shop and buy from the canteen instead',
      'The shop sells more, because students now buy in smaller groups',
      'Crowding outside falls as well, because fewer students come at all',
    ],
    note:
      'The rule limited where people could stand, not how many wanted to buy. Displacement is the most common second-order effect there is: the problem is usually moved before it is solved.',
  },
  {
    setup:
      'A tutor group earns a point for every book review handed in, to encourage reading. Reviews triple. Average length falls from 200 words to 40, and the number of students taking part is unchanged.',
    ask: 'What is going on?',
    key: 'Reviews are being written to be counted, not to describe a book',
    wrong: [
      'Students have become a great deal more efficient at describing a book',
      'The books being read are much shorter than they used to be',
      'More students are taking part, which pulls the average down',
    ],
    note:
      'Counting reviews rewards the act of handing one in, so the cheapest review wins. The "more students" explanation is ruled out by the prompt: the same people are producing three times as many, three-quarters shorter.',
  },
  {
    setup:
      'To cut noise, the music practice rooms close at 5 pm. Complaints about the practice rooms stop, and complaints from the corridor-facing classrooms begin the same week.',
    ask: 'What has actually happened?',
    key: 'Practice has moved into the corridors rather than stopping',
    wrong: [
      'Students are practising much less than before',
      'The people who used to complain have simply gone home earlier now',
      'The corridor complaints are unrelated and happen every year anyway',
    ],
    note:
      'The demand for somewhere to practise did not close at 5 pm. The timing of the new complaints is the giveaway — the noise found the nearest place the rule did not cover.',
  },
  {
    setup:
      'A club moves its meeting from Monday to Thursday because six members have Monday practice. Attendance rises from 14 to 19 and stays there all term.',
    ask: 'What is the most likely explanation?',
    key: 'The change did what it was for — the clash was the whole problem',
    wrong: [
      'The rise is temporary, and attendance will soon fall back towards 14',
      'Members are turning up to be counted rather than to take part',
      'Thursday members have replaced the Monday ones, one for one',
    ],
    note:
      'Sometimes a change simply works. The clash was named in advance, the size of the rise matches the six people who had it, and it held for a term. Expecting a hidden backfire everywhere is its own error — a suspicion that always fires carries no information.',
  },
  {
    setup:
      'The club buys a second set of boards so two games can run at once, to cut the waiting. Waiting time falls from 20 minutes to 4 and stays there all term, with attendance unchanged.',
    ask: 'What is the most likely explanation?',
    key: 'The shortage was the whole problem, and more boards fixed it',
    wrong: [
      'Members are playing shorter games, which is why boards free up',
      'Fewer members are attending, which is why the wait has dropped',
      'The wait will climb back as word spreads and more people come',
    ],
    note:
      'Adding capacity to a queue caused by capacity is one of the few changes with no interesting second effect. Attendance is unchanged, so nothing about who comes has shifted — the prediction to make here is that it keeps working.',
  },
]

const thenWhat = tpl(
  {
    id: 'cl-then-what',
    name: 'And then what happens?',
    skillIds: ['st-secondorder'],
    bucket: BUCKET,
    difficulty: 3,
    variants: THEN_WHAT_CASES.length,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, THEN_WHAT_CASES)
    return {
      title: 'The next move belongs to them',
      prompt: `${c.setup}\n\n${c.ask}`,
      answer: mcq(rng, c.key, c.wrong),
      hints: [
        'Ask who now has a reason to behave differently, and what the cheapest thing for them to do is.',
        'Check the numbers in the prompt against each explanation — usually one detail rules out all but one story.',
        `Worked path: **${c.key}**.`,
      ],
      explanation:
        `**${c.key}**. ${c.note}\n\n` +
        `The habit is one extra question: after the rule lands, who changes what they do, and does the goal survive that? Two of the nine situations in this family have no twist at all, deliberately — a change that names a real cause and removes it usually just works, and a reader who answers "it will backfire" every time is not predicting anything.`,
    }
  },
)

const UNDERMINE_CASES: { goal: string; rule: string; key: string; wrong: [string, string, string]; note: string }[] = [
  {
    goal: 'fewer students arriving late to first lesson',
    rule: 'anyone arriving after 8:55 has to sign the late book at reception',
    key: 'Late students go straight to the lesson and skip reception',
    wrong: [
      'Reception is crowded for ten minutes each morning by the book',
      'Some students sprint the last stretch and arrive out of breath',
      'Tutors copy the book into a list each week',
    ],
    note: 'skipping reception leaves the lateness exactly as it was while the late book reports an improvement',
  },
  {
    goal: 'the club stops losing its equipment',
    rule: 'anyone borrowing equipment writes their name on a sheet by the cupboard',
    key: 'People take equipment without writing, so the sheet stays short',
    wrong: [
      'Borrowing now takes an extra minute at the start of each session',
      'The sheet fills up and has to be replaced about twice each term',
      'Two members find the sheet awkward and borrow less than before',
    ],
    note: 'an unwritten borrowing is invisible, so the record improves while the equipment keeps walking',
  },
  {
    goal: 'the main group chat stops filling with off-topic messages',
    rule: 'off-topic messages must go in a second chat set up for them',
    key: 'Off-topic messages return to the main chat, since nobody reads two',
    wrong: [
      'The two chats have to be checked separately every single evening now',
      'A few members leave the second chat and miss the jokes entirely',
      'Setting up and naming the second chat took someone half an hour',
    ],
    note: 'if the second chat is unread it is not a destination, so the messages come back and the main chat is no cleaner',
  },
  {
    goal: 'fewer people forget their kit on match day',
    rule: 'a reminder message goes out at 7 am on every match day',
    key: 'People stop reading the 7 am message, so it reminds nobody',
    wrong: [
      'One person has to remember to send the reminder every match day',
      'The 7 am message wakes two members who would rather sleep later',
      'The group chat gains one more message on each of the match days',
    ],
    note: 'an unread reminder is not a reminder, and the kit is forgotten at exactly the old rate',
  },
  {
    goal: 'the shared printer stops running out of paper mid-print',
    rule: 'whoever takes the last of the paper has to refill the tray',
    key: 'People stop printing before the last sheets, so nobody refills',
    wrong: [
      'Refilling takes about two minutes out of whoever is printing',
      'The paper cupboard has to be left unlocked for everyone to use',
      'Two people argue about who actually took the very last sheet',
    ],
    note: 'the rule punishes being the one who finishes the paper, so the tray sits at two sheets and the next print still fails',
  },
  {
    goal: 'meetings finish on time',
    rule: 'the agenda is fixed two days ahead and nothing is added on the day',
    key: 'The agenda grows in advance, so meetings run as long as before',
    wrong: [
      'Genuinely urgent items now wait a full week to be discussed',
      'Someone has to write and circulate the agenda two days ahead',
      'New members find it harder to raise anything in their first weeks',
    ],
    note: 'the rule controls when items are added and not how many, so the length comes back through the front door',
  },
]

const undermines = tpl(
  {
    id: 'cl-undermines',
    name: 'Side cost, or the goal quietly failing?',
    skillIds: ['st-secondorder'],
    bucket: BUCKET,
    difficulty: 4,
    variants: UNDERMINE_CASES.length,
    minutes: 3.5,
    calibration: true,
  },
  (rng, seed) => {
    const c = cycle(seed, UNDERMINE_CASES)
    const noted = mcqNoted(
      rng,
      c.key,
      c.wrong.map((w) => [w, 'A real cost of the rule — but the goal is still being met, so this is a price to weigh, not a failure.', 'inference' as const]),
    )
    return {
      title: 'Which one defeats the point?',
      prompt:
        `GOAL: ${c.goal}.\n\nRULE: ${c.rule}.\n\n` +
        `All four of these follow from the rule. Which one means the **goal itself** is not being met, however good the numbers look?`,
      ...noted,
      hints: [
        'Ask of each one: with this happening, has the goal actually been achieved?',
        'Three of them are prices you might decide are worth paying. One means you are paying and getting nothing.',
        `Worked path: **${c.key}** — ${c.note}.`,
      ],
      explanation:
        `**${c.key}** — ${c.note}.\n\n` +
        `The other three are real costs, and they need a different response: you weigh them against the benefit and decide whether the rule is worth it. This one cannot be weighed, because there is no benefit on the other side of the scale — the measurement improved and the thing being measured did not. That difference decides what you do next. A side cost means "is this worth it?". A defeated goal means "this rule needs redesigning", usually so that the easy way to satisfy it is also the way that achieves it.\n\n` +
        `This pattern has been written about for decades under names like Goodhart's law and Campbell's law — the version most people meet is "when a measure becomes a target, it ceases to be a good measure". Worth knowing what that is: a widely observed pattern in institutions, not an experimental result, so treat it as a thing to check for rather than a law that must hold.`,
    }
  },
)

const MEASURE_CASES: { goal: string; key: string; wrong: [string, string, string]; note: string }[] = [
  {
    goal: 'students are actually reading more books',
    key: 'Short written notes on something not printed on the cover',
    wrong: [
      'The number of books borrowed from the library each month',
      'The number of minutes students log as reading time weekly',
      'The number of students who say they enjoy reading, surveyed',
    ],
    note: 'borrowing, logged minutes and survey answers can all be produced without opening a book; a detail from inside one cannot',
  },
  {
    goal: 'the club is genuinely welcoming to newcomers',
    key: 'How many first-time visitors come back a third time',
    wrong: [
      'How many people sign the attendance sheet each session',
      'How many new members the club recruits every September',
      'How welcoming the committee rates the club out of ten',
    ],
    note: 'coming back twice more is a decision only the newcomer can make, and it is made after they know what the club is like',
  },
  {
    goal: 'the team\'s passing has actually improved',
    key: 'Completed passes counted from match video by two people',
    wrong: [
      'How many passing drills the team runs during its training sessions',
      'The coach\'s rating of the team\'s passing after a match',
      'How many matches the team wins over the same period',
    ],
    note: 'drills measure effort rather than result, ratings drift with mood, and wins depend on ten other things',
  },
  {
    goal: 'the corridor is genuinely quieter at break',
    key: 'Sound readings taken at the same spot each break time',
    wrong: [
      'The number of noise complaints staff make in a week',
      'How quiet the corridor feels to the duty teacher there',
      'The number of students told off for shouting each week',
    ],
    note: 'complaints and tellings-off measure how staff respond, which can move on its own while the noise stays put',
  },
  {
    goal: 'the homework help sessions actually help',
    key: 'Scores on the next test among the people who attended',
    wrong: [
      'How many students attend the homework help sessions each week',
      'How useful attendees rate the session, out of five',
      'How many questions get asked during each session',
    ],
    note: 'attendance and ratings can rise while nobody learns anything; scores at least depend on the thing you wanted',
  },
  {
    goal: 'the recycling bins are being used properly',
    key: 'The weight of wrong items pulled out of the bins weekly',
    wrong: [
      'The number of recycling posters put up around school',
      'The number of bins emptied by the caretakers each week',
      'How careful students say they are, asked in a short survey',
    ],
    note: 'posters and emptying counts measure activity rather than sorting, and self-report measures how people wish to be seen',
  },
  {
    goal: 'the newsletter is actually being read',
    key: 'Answers to a one-line question hidden halfway down it',
    wrong: [
      'The number of copies of the newsletter handed out',
      'The number of people who open the newsletter email',
      'How interesting readers rate it, out of ten, when asked',
    ],
    note: 'handing out and opening both happen before a word is read, and a rating can be given by anyone who saw the title',
  },
  {
    goal: 'the garden project is actually being maintained',
    key: 'Photographs of the same three beds taken each month',
    wrong: [
      'The number of volunteers signed up to the garden rota',
      'The number of hours volunteers log in the shared sheet',
      'How healthy volunteers say the garden looks, when asked',
    ],
    note: 'a rota and a log record intentions and self-reports; a photograph of the bed records the bed',
  },
]

const hardToFake = tpl(
  {
    id: 'cl-hard-to-fake',
    name: 'The number that only moves when the thing moves',
    skillIds: ['st-secondorder'],
    bucket: BUCKET,
    difficulty: 3,
    variants: MEASURE_CASES.length,
    minutes: 3,
    transfer: true,
  },
  (rng, seed) => {
    const c = cycle(seed, MEASURE_CASES)
    return {
      title: 'Choose what to count',
      prompt:
        `You want to know whether this is true: **${c.goal}**. You can track exactly one number, and everyone will know which one it is.\n\n` +
        `Which number is hardest to move without the real thing also happening?`,
      answer: mcq(rng, c.key, c.wrong),
      hints: [
        'Ask of each number: what is the cheapest way to make it go up WITHOUT the real thing happening?',
        'Numbers made of what people say, or of activity rather than result, are usually the easiest to move on their own.',
        `Worked path: **${c.key}** — ${c.note}.`,
      ],
      explanation:
        `**${c.key}** — ${c.note}.\n\n` +
        `Announcing which number you are tracking is what makes this hard. Once people know, the number stops being a quiet observation and becomes something worth moving, so the right question is not "which number describes this best?" but "which number would still need the real thing to happen?"\n\n` +
        `No measure is immune, and the winner here is not clean either: the people who choose to attend, read or take part are not a random group, so the number partly reflects who selected themselves into it. Best available beats no measure, as long as you say out loud what it still cannot tell you.`,
    }
  },
)

const FEE_CASES: { scene: string; unit: string; group: string }[] = [
  { scene: 'The club has been free and is short of money, so the committee proposes a small charge per session.', unit: 'session', group: 'members' },
  { scene: 'The library has been printing for free and is over budget, so it proposes a charge per print job.', unit: 'print job', group: 'regular users' },
  { scene: 'The minibus to the away fixture has been free, so the team proposes a small charge per trip.', unit: 'trip', group: 'players' },
  { scene: 'The lockers have been free and need repairs, so the school proposes a charge per term.', unit: 'term', group: 'locker holders' },
]

const feeHeadcount = tpl(
  {
    id: 'cl-headcount',
    name: 'The forecast that assumed nobody would react',
    skillIds: ['st-secondorder'],
    bucket: BUCKET,
    difficulty: 2,
    variants: 10,
    minutes: 3,
    kind: 'multi',
  },
  (rng, seed) => {
    const c = cycle(seed, FEE_CASES)
    const drop = rint(rng, 6, 18)
    const people = drop + rint(rng, 12, 40)
    const fee = rint(rng, 2, 6)
    const forecast = people * fee
    const actual = (people - drop) * fee

    return {
      title: 'Predicted, then counted',
      prompt:
        `${c.scene}\n\n` +
        `There are **${people} ${c.group}**, and the charge is **${money(fee)}** per ${c.unit}. The committee works out what it will raise by multiplying.\n\n` +
        `Once the charge starts, **${drop}** of them stop coming.`,
      parts: [
        {
          stage: 'Forecast',
          prompt: `How much did the committee's calculation predict, in dollars?`,
          answer: numeric(forecast),
          explanation:
            `${people} × ${money(fee)} = **${money(forecast)}**. ` +
            `The multiplication is right; what it quietly assumes is that all ${people} still turn up after the price changes.`,
          hints: [
            'Everyone pays, at the stated price.',
            `Multiply the head count by the fee: ${people} × ${fee}.`,
            `${people} × ${money(fee)} = **${money(forecast)}**.`,
          ],
        },
        {
          stage: 'Actual',
          prompt: 'How much does it actually raise, in dollars?',
          answer: numeric(actual),
          explanation:
            `${people} − ${drop} = ${people - drop} still come, so ${people - drop} × ${money(fee)} = **${money(actual)}**, which is ${money(forecast - actual)} short of the forecast.`,
          hints: [
            'Take the leavers off the head count first, then multiply.',
            `${people} − ${drop} = ${people - drop}.`,
            `${people - drop} × ${money(fee)} = **${money(actual)}**.`,
          ],
        },
        {
          stage: 'Why',
          prompt: 'What was wrong with the committee\'s calculation?',
          answer: mcq(rng, 'It assumed the charge would not change who turns up', [
            'It used a charge set too low to cover costs',
            'It counted the wrong number of sessions in the term ahead',
            'It should have asked the leavers to pay a reduced amount',
          ]),
          explanation:
            `A price is not only a number collected from people; it is a reason for some of them to leave. Multiplying the old head count by the new price treats the group as fixed, which is exactly the assumption the price attacks. ` +
            `The honest way to forecast this is to ask how many would still come at ${money(fee)}, and the honest way to check it is to count afterwards.`,
          hints: [
            'The arithmetic was fine. Look at what the numbers going into it assumed.',
            'Which of the two numbers multiplied together was the one that moved?',
            'Worked path: the head count was treated as fixed when the charge is a reason to leave.',
          ],
        },
      ],
      hints: [
        'Forecast = everybody × the price. Actual = the ones who stayed × the price.',
        `${drop} people leaving takes ${drop} × ${money(fee)} straight off the total.`,
        `Worked path: ${money(forecast)} predicted, ${money(actual)} collected, ${money(forecast - actual)} short.`,
      ],
      explanation:
        `Predicted ${people} × ${money(fee)} = **${money(forecast)}**. Actual ${people - drop} × ${money(fee)} = **${money(actual)}** — ${money(forecast - actual)} short.\n\n` +
        `Nothing here says the charge was wrong. It may well have been the right call: ${money(actual)} is still more than nothing, and a smaller group can be easier to run. What is wrong is the FORECAST, because it modelled a world in which a price change moves money and moves nobody. Any time a plan multiplies a head count by a new rule, that is the assumption to check first.`,
    }
  },
)

// ===================================================================== st-sunk

const PROJECT_CASES: { name: string; spentOn: string; needs: [string, string]; payoff: string }[] = [
  { name: 'The class stall for the summer fair', spentOn: 'timber and paint', needs: ['fabric for the awning', 'stock to sell'], payoff: 'the stall is expected to take' },
  { name: 'The club\'s competition robot', spentOn: 'parts and a spare motor', needs: ['a replacement gearbox', 'the entry fee'], payoff: 'the prize and sponsorship come to' },
  { name: 'The group\'s short film', spentOn: 'costumes and location fees', needs: ['two more shooting days', 'the sound edit'], payoff: 'the festival pays out' },
  { name: 'The year-group cookbook', spentOn: 'photography and design', needs: ['the print run', 'the launch stall'], payoff: 'the copies are expected to raise' },
  { name: 'The community garden bed', spentOn: 'soil and timber', needs: ['the plants', 'the watering system'], payoff: 'the produce is worth about' },
  { name: 'The band\'s demo recording', spentOn: 'studio time already used', needs: ['the mixing session', 'the artwork'], payoff: 'the sales and gig fees come to' },
]

const finishOrStop = tpl(
  {
    id: 'cl-finish-or-stop',
    name: 'Finish it, or stop?',
    skillIds: ['st-sunk'],
    bucket: BUCKET,
    difficulty: 3,
    variants: 12,
    minutes: 3.5,
    kind: 'multi',
    calibration: true,
  },
  (rng, seed) => {
    const c = cycle(seed, PROJECT_CASES)
    // Seed-driven, so the bank is balanced by construction rather than by luck:
    // half the variants make finishing correct, and the sunk amount is large in
    // half of each of those. If "stop" were always right, the item would teach
    // the slogan instead of the rule.
    const shouldFinish = seed % 2 === 0
    const bigSunk = Math.floor(seed / 2) % 2 === 0

    const f1 = rint(rng, 6, 20) * 5
    const f2 = rint(rng, 4, 16) * 5
    const remaining = f1 + f2
    const gap = rint(rng, 5, 18) * 5
    const value = shouldFinish ? remaining + gap : remaining - gap
    const forward = value - remaining
    const hours = rint(rng, 12, 60)
    // The whole project is a loss counted from the start in EVERY variant, so
    // "total spend beats the value" is always true and never decides anything.
    const spent = (shouldFinish ? gap : 0) + rint(rng, bigSunk ? 60 : 8, bigSunk ? 140 : 30) * 5

    // "Carry on:" and "Stop now:" are both nine characters, so whichever of the
    // two is the key, the key's length is identical. The two sunk-cost lines
    // sit either side of it, which is what stops option length carrying any
    // information about the answer.
    const finishLine = `Carry on: the ${money(remaining)} left to spend buys ${money(value)} of value`
    const stopLine = `Stop now: the ${money(remaining)} left to spend buys ${money(value)} of value`
    const sunkFinish = `Carry on: stopping now would waste the ${money(spent)} already spent`
    const sunkStop = `Stop now: ${money(spent + remaining)} spent beats ${money(value)}`
    const key = shouldFinish ? finishLine : stopLine

    return {
      title: 'Decide from here forward',
      prompt:
        `${c.name}.\n\n` +
        `- **Already spent** — ${money(spent)} on ${c.spentOn}, and about ${hours} hours of work\n` +
        `- **Still needed** — ${money(f1)} for ${c.needs[0]} and ${money(f2)} for ${c.needs[1]}\n` +
        `- **If it is finished** — ${c.payoff} about ${money(value)}\n\n` +
        `None of the money already spent can be got back.`,
      parts: [
        {
          stage: 'From here',
          prompt: 'How much more money does finishing cost, counting only from today? Answer in dollars.',
          answer: numeric(remaining),
          explanation:
            `${money(f1)} + ${money(f2)} = **${money(remaining)}**. The ${money(spent)} and the ${hours} hours are not part of this number, because they are the same in both futures — spend them or not, they are already gone.`,
          hints: [
            'Only money that has not left yet belongs in this total.',
            `Add the two remaining costs: ${money(f1)} and ${money(f2)}.`,
            `${money(f1)} + ${money(f2)} = **${money(remaining)}**.`,
          ],
        },
        {
          stage: 'Forward gain',
          prompt: 'What does finishing gain from here? Take the value of finishing and subtract what is still to spend. A negative number is a real answer.',
          answer: numeric(forward),
          explanation:
            `${money(value)} − ${money(remaining)} = **${forward < 0 ? `−${money(-forward)}` : money(forward)}**. ` +
            `${forward > 0 ? 'The remaining spend buys more than it costs, so finishing is worth it from here.' : 'The remaining spend buys less than it costs, so finishing loses money from here.'} Notice that the ${money(spent)} never entered the calculation.`,
          hints: [
            'Value of finishing, minus what is still to spend. Nothing else.',
            `${money(value)} − ${money(remaining)}.`,
            `${money(value)} − ${money(remaining)} = **${forward < 0 ? `−${money(-forward)}` : money(forward)}**.`,
          ],
        },
        {
          stage: 'Call it',
          prompt: 'Which line gets both the decision AND the reason right?',
          answer: mcq(rng, key, [
            shouldFinish ? stopLine : finishLine,
            sunkFinish,
            sunkStop,
          ]),
          explanation:
            `**${key}** — ${money(value)} against ${money(remaining)} is the only comparison that changes with the decision.\n\n` +
            `The other two reasons are the trap in both of its directions. "Stopping would waste what we spent" pushes you to finish; "we will have spent more in total than it is worth" pushes you to stop. Both are true statements here, and neither is a reason, because the ${money(spent)} is identical whichever you choose. In this project the total spend does exceed the value — and that is true in the versions of this problem where finishing is clearly right too, which is exactly why it cannot be what decides.`,
          hints: [
            'Two of the four lines mention money that is already gone. Cross those out first.',
            `Compare ${money(remaining)} with ${money(value)}, and nothing else.`,
            `Worked path: ${money(value)} is ${forward > 0 ? 'more' : 'less'} than ${money(remaining)}, so **${shouldFinish ? 'finish' : 'stop'}**.`,
          ],
        },
      ],
      hints: [
        'Cover the "already spent" line with your hand. The decision should not change when you do.',
        'Compare what is STILL to spend against what finishing is worth.',
        `Worked path: ${money(remaining)} still to spend against ${money(value)} of value, so **${shouldFinish ? 'finish it' : 'stop'}**.`,
      ],
      explanation:
        `Still to spend ${money(remaining)}; worth ${money(value)} if finished; forward gain **${forward < 0 ? `−${money(-forward)}` : money(forward)}**, so **${shouldFinish ? 'finish it' : 'stop now'}**.\n\n` +
        `The ${money(spent)} and the ${hours} hours are real, and they are not evidence about anything. They are identical in both futures, so they cancel out of the comparison entirely — which is why the rule works in both directions. ` +
        `${shouldFinish
          ? `Here the answer is to CARRY ON, and the ${money(spent)} is no more a reason to carry on than it would have been a reason to stop. Counted from the very beginning this project loses money: ${money(spent + remaining)} spent for ${money(value)} of value. Starting it was a mistake. Finishing it is still right, because the only choice available today is between spending ${money(remaining)} to gain ${money(value)} and spending nothing to gain nothing.`
          : `Here the answer is to STOP, and it would still be to stop if only ${money(5)} had been spent so far. The size of the loss behind you does not appear anywhere in the reasoning.`}`,
    }
  },
)

const IRRELEVANT_CASES: { setup: string; irrelevant: string[]; relevant: string[]; note: string }[] = [
  {
    setup: 'You are deciding whether to keep going with the model rocket you started in the spring.',
    irrelevant: ['The $34 already spent on parts', 'The eleven weekends already given to it', 'The price you first expected the parts to be'],
    relevant: ['The $18 of parts still needed to finish', 'How much a finished rocket would be worth to you', 'What else the next three weekends could be for'],
    note: 'the first three are the same number whether you continue or stop, so no comparison between the two futures can turn on them',
  },
  {
    setup: 'The group is deciding whether to keep working on the app they began in September.',
    irrelevant: ['The four months of evenings already spent', 'The $60 already paid for the developer account', 'The fact that the first plan was more ambitious'],
    relevant: ['The three weeks of work still left to do', 'Whether anyone would actually use the finished app', 'What the group could build in those three weeks instead'],
    note: 'the months and the $60 are gone in both futures; only the three weeks and what they buy are still in play',
  },
  {
    setup: 'You are deciding whether to keep the Saturday guitar lessons going next term.',
    irrelevant: ['The two terms of lessons already paid for', 'The guitar you bought at the start of it', 'How much you were enjoying it back in autumn'],
    relevant: ['The $120 the next term would cost you', 'How much you would enjoy playing in a year', 'What else Saturday mornings could be used for'],
    note: 'the guitar and the past terms are yours either way, and last autumn is not evidence about next term',
  },
  {
    setup: 'The committee is deciding whether to finish the club\'s half-built website.',
    irrelevant: ['The 40 hours two members have already put in', 'The $25 spent on the domain name last year', 'The fact that it was promised at the AGM'],
    relevant: ['The 8 hours of work it still needs', 'Whether members would use it once it existed', 'What those 8 hours could otherwise achieve'],
    note: 'the promise is worth honouring or renegotiating on its own terms, but the 40 hours and the $25 are spent in both futures',
  },
  {
    setup: 'You are deciding whether to keep reading a 600-page novel you are 200 pages into.',
    irrelevant: ['The 200 pages you have already read', 'The $14 the book cost you to buy', 'How strongly it was recommended to you'],
    relevant: ['The 400 pages of reading time still left', 'Whether the last 200 pages have been enjoyable', 'What else you would read in that time instead'],
    note: 'the recent 200 pages are evidence about the book; the money and the reading time behind you are not',
  },
  {
    setup: 'The team is deciding whether to keep repairing the old minibus.',
    irrelevant: ['The $900 of repairs paid for last year', 'The weekend the team spent cleaning it out', 'The price the club originally paid for it'],
    relevant: ['The $400 the next repair would cost', 'How many more years it would then last', 'The cost of the alternative way to travel'],
    note: 'last year\'s $900 buys nothing more; the question is whether $400 today buys more than $400 of travel',
  },
]

const irrelevantFacts = tpl(
  {
    id: 'cl-irrelevant-facts',
    name: 'Which facts cannot help you decide',
    skillIds: ['st-sunk'],
    bucket: BUCKET,
    difficulty: 2,
    variants: IRRELEVANT_CASES.length,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, IRRELEVANT_CASES)
    return {
      title: 'Cross out what cannot decide it',
      prompt:
        `${c.setup}\n\n` +
        `Select every fact below that **cannot** help decide it — the ones that would read exactly the same whether you carried on or stopped today.`,
      answer: multi(rng, c.irrelevant, c.relevant),
      hints: [
        'Take each fact and ask: would this sentence be different in the world where you stop?',
        'If the answer is no, the fact is the same in both futures, so it cannot separate them.',
        `Worked path: ${c.irrelevant.join('; ')}.`,
      ],
      explanation:
        `The ones to cross out: ${c.irrelevant.join('; ')}. What is left — ${c.relevant.join('; ')} — is the whole decision, because ${c.note}.\n\n` +
        `This is not a rule about being tough-minded, and it does not mean quitting. It is a filter: facts that differ between the two futures stay, facts that are identical in both go. Sometimes the surviving facts say carry on, and then carrying on is right for exactly the same reason.`,
    }
  },
)

const SPOT_CASES: { key: string; wrong: [string, string, string]; note: string }[] = [
  {
    key: 'Ravi keeps repairing the old bike because he has spent $90 on it already',
    wrong: [
      'Mia keeps repairing hers because the last part costs just $12 and it works',
      'Sam stops repairing his because the frame is cracked beyond repair',
      'Lena stops repairing hers because a working bike is now free at home',
    ],
    note: 'the $90 is spent whether Ravi carries on or stops, so it is the same in both of his futures',
  },
  {
    key: 'Tom stays in the course because he has already sat through eight weeks',
    wrong: [
      'Ada stays in the course because the last four weeks are the useful ones',
      'Joe leaves the course because it clashes with the exam he must sit',
      'Nina leaves the course because a better one starts the following term',
    ],
    note: 'the eight weeks Tom has sat through are behind him in both futures, so they cannot pick one',
  },
  {
    key: 'The club keeps the fair stall because it has paid the pitch fee already',
    wrong: [
      'The choir keeps its stall because it sells far more there than anywhere else',
      'The band drops its stall because everyone is away that whole weekend',
      'The team drops its stall because the fair now clashes with a fixture',
    ],
    note: 'the pitch fee is not coming back, so it reads the same whether the stall goes ahead or not',
  },
  {
    key: 'Ella finishes the puzzle because she has already done 800 of the pieces',
    wrong: [
      'Omar finishes his puzzle because the last corner is the enjoyable part of it',
      'Kit abandons the puzzle because four of the pieces are clearly missing',
      'Rosa abandons the puzzle because she needs the table for homework',
    ],
    note: 'the 800 placed pieces are done in both futures; only the remaining pieces are still a choice',
  },
  {
    key: 'The group keeps the design because it has already paid for the printing plates',
    wrong: [
      'The class keeps its design because changing it now would miss the print deadline',
      'The team changes its design because the old one is unreadable at distance',
      'The crew changes its design because the printer cannot handle that colour',
    ],
    note: 'the plates are paid for either way, so they say nothing about which design is better now',
  },
  {
    key: 'Dev keeps the subscription because he has been paying for it for two years',
    wrong: [
      'Ines keeps hers because she still uses it two or three times a week',
      'Milo cancels his because the one feature he actually wanted has now been removed',
      'Suri cancels hers because the free version does everything she needs',
    ],
    note: 'two years of payments are gone whether Dev cancels today or not, so they cannot decide today',
  },
]

const spotTheReason = tpl(
  {
    id: 'cl-spot-the-reason',
    name: 'The reason that would be true either way',
    skillIds: ['st-sunk'],
    bucket: BUCKET,
    difficulty: 3,
    variants: SPOT_CASES.length,
    minutes: 3,
    transfer: true,
  },
  (rng, seed) => {
    const c = cycle(seed, SPOT_CASES)
    return {
      title: 'Which reason cannot be a reason?',
      prompt:
        'Four people give a reason for what they are doing. In exactly one of them the reason would be **equally true** whether that person carried on or stopped — so it cannot be what settles it.\n\nWhich one?',
      answer: mcq(rng, c.key, c.wrong),
      hints: [
        'For each reason, imagine both futures side by side and ask whether the reason changes between them.',
        'Three of these reasons describe something that is still ahead. One describes something already behind.',
        `Worked path: **${c.key}**.`,
      ],
      explanation:
        `**${c.key}** — ${c.note}.\n\n` +
        `The other three all point at something that differs between the two futures: a remaining cost, a fault that will still be there tomorrow, a better option available now. Those are reasons. A fact about what has already happened is a fact, and it can be a sad one, but it is the same fact on both sides of the choice — which is precisely what stops it from choosing.`,
    }
  },
)

const TIME_CASES: { setup: string; key: string; wrong: [string, string, string]; note: string }[] = [
  {
    setup: 'You are 40 minutes into a two-hour film you are not enjoying.',
    key: 'Whether the next 80 minutes beat anything else you could do',
    wrong: [
      'Whether stopping now would waste the 40 minutes already sat',
      'Whether you are the sort of person who finishes what they start',
      'Whether the ticket price was high enough to be worth sitting for',
    ],
    note: 'the 40 minutes are spent in both futures; the 80 ahead are the only part still in your gift',
  },
  {
    setup: 'You are 300 pages into a 400-page book that has just started to get good.',
    key: 'Whether the last 100 pages beat anything else you could read',
    wrong: [
      'Whether abandoning it now would waste the 300 pages already read',
      'Whether you would feel guilty leaving it unfinished',
      'Whether the book was expensive enough to justify the reading time',
    ],
    note: 'here the forward comparison says keep reading — the same rule, pointing the other way',
  },
  {
    setup: 'You have queued 25 minutes and an announcement says the wait is another 40.',
    key: 'Whether the next 40 minutes beat what else the time could buy',
    wrong: [
      'Whether leaving would waste the 25 minutes you have already stood',
      'Whether the people behind you would think badly of you for leaving',
      'Whether the queue was shorter than you expected',
    ],
    note: 'a queue is the purest version of this: the time behind you buys nothing more, whatever you do next',
  },
  {
    setup: 'You are three weeks into a club you signed up for and do not enjoy.',
    key: 'Whether the rest of the term beats what else that slot could be',
    wrong: [
      'Whether leaving now would waste the three weeks already attended',
      'Whether people would notice that you had dropped out partway in',
      'Whether the club was hard enough to get into to be worth staying',
    ],
    note: 'what other people notice is a genuine forward cost worth naming; the three weeks behind you are not one',
  },
  {
    setup: 'You are 90 minutes into a game you have stopped enjoying, with two hours left.',
    key: 'Whether the next two hours beat anything else this evening',
    wrong: [
      'Whether stopping would waste the 90 minutes you have put in',
      'Whether the game came strongly recommended',
      'Whether you would be able to pick it up again from here later',
    ],
    note: 'being able to resume later is a real fact and it cuts the other way — it makes stopping cheaper, not more wasteful',
  },
  {
    setup: 'You are halfway through a jigsaw and someone offers you a walk instead.',
    key: 'Whether the second half beats the walk you were just offered',
    wrong: [
      'Whether stopping halfway would waste the pieces already placed',
      'Whether the jigsaw would have to be broken up before it is done',
      'Whether the box was expensive enough to be worth finishing off',
    ],
    note: 'having to break it up is a forward cost and belongs in the comparison; the placed pieces do not',
  },
  {
    setup: 'You are two episodes into a ten-episode series that people say improves.',
    key: 'Whether the eight ahead beat the other things you could watch',
    wrong: [
      'Whether quitting now would waste the two episodes already seen',
      'Whether you had told people you were going to watch the series',
      'Whether the series was popular enough to be worth persisting at',
    ],
    note: 'that it improves later is a claim about the eight ahead, so it belongs in the comparison',
  },
  {
    setup: 'You are 20 minutes into a 30-minute walk when it starts raining hard.',
    key: 'Whether ten minutes more beats turning back through the rain',
    wrong: [
      'Whether turning back would waste the 20 minutes already walked',
      'Whether you had promised yourself you would do the whole route',
      'Whether the walk was long enough to matter',
    ],
    note: 'both directions are forward costs here, which is why the 20 minutes behind you are irrelevant to both',
  },
]

const sunkTime = tpl(
  {
    id: 'cl-sunk-time',
    name: 'Time already spent',
    skillIds: ['st-sunk'],
    bucket: BUCKET,
    difficulty: 2,
    variants: TIME_CASES.length,
    minutes: 2.5,
  },
  (rng, seed) => {
    const c = cycle(seed, TIME_CASES)
    return {
      title: 'What should decide it',
      prompt: `${c.setup}\n\nWhat should decide whether you carry on?`,
      answer: mcq(rng, c.key, c.wrong),
      hints: [
        'Ask what is still ahead of you, and what else that same time could be spent on.',
        'Time already spent is spent in both futures — carrying on does not get any of it back.',
        `Worked path: **${c.key}**.`,
      ],
      explanation:
        `**${c.key}** — ${c.note}.\n\n` +
        `Carrying on never recovers spent time; it only adds more. So the comparison is always between the time STILL to come and the best thing you could do with it instead — and that comparison sometimes says carry on and sometimes says stop, which is how you can tell it is a rule rather than a slogan.`,
    }
  },
)

const CHAIN_CASES: { name: string; sunkLabel: string; costA: string; costB: string; gain: string }[] = [
  { name: 'The drama group\'s set', sunkLabel: 'timber', costA: 'paint', costB: 'fabric', gain: 'hiring a set instead would cost' },
  { name: 'The cycling club\'s trailer', sunkLabel: 'the frame', costA: 'wheels', costB: 'a hitch', gain: 'renting a trailer each season would cost' },
  { name: 'The allotment shed', sunkLabel: 'the base', costA: 'panels', costB: 'roofing felt', gain: 'the storage it replaces is worth' },
  { name: 'The chess club\'s clock repairs', sunkLabel: 'spare parts', costA: 'a new battery set', costB: 'a service', gain: 'buying replacement clocks would cost' },
]

const sunkChain = tpl(
  {
    id: 'cl-sunk-chain',
    name: 'Forward numbers, one line at a time',
    skillIds: ['st-sunk'],
    bucket: BUCKET,
    difficulty: 3,
    variants: 8,
    minutes: 3.5,
  },
  (rng, seed) => {
    const c = cycle(seed, CHAIN_CASES)
    const shouldFinish = seed % 2 === 0
    const a = rint(rng, 5, 22) * 4
    const b = rint(rng, 4, 18) * 4
    const remaining = a + b
    const gap = rint(rng, 4, 15) * 4
    const value = shouldFinish ? remaining + gap : remaining - gap
    const spent = rint(rng, 30, 90) * 5
    const hours = rint(rng, 8, 40)
    const forward = value - remaining
    const verdict = shouldFinish ? 'Carry on — the money still to spend earns its keep' : 'Stop now — the money still to spend does not pay off'
    const call = shouldFinish ? 'carry on' : 'stop'

    return {
      title: 'Three lines, then a decision',
      prompt:
        `${c.name}. So far: **${money(spent)}** on ${c.sunkLabel} and about **${hours} hours** of work, none of it recoverable.\n\n` +
        `Still needed: **${money(a)}** of ${c.costA} and **${money(b)}** of ${c.costB}.\n\n` +
        `If it is finished, ${c.gain} **${money(value)}** — that is what finishing saves.\n\nWork it through one line at a time.`,
      answer: steps([
        {
          label: 'Money still to spend from today ($)',
          answer: numeric(remaining),
          diagnoses: 'misread',
          why: `${money(a)} + ${money(b)} = ${money(remaining)}. The ${money(spent)} already spent belongs to neither future, so adding it in here is the error that makes every project look too far gone to finish.`,
        },
        {
          label: 'Forward gain: value of finishing minus that ($)',
          answer: numeric(forward),
          diagnoses: 'strategy',
          why: `${money(value)} − ${money(remaining)} = ${forward < 0 ? `−${money(-forward)}` : money(forward)}. This single number is the entire decision, and the ${hours} hours never appear in it.`,
        },
        {
          label: 'So what should happen?',
          answer: mcq(rng, verdict, [
            shouldFinish ? 'Stop now — the money still to spend does not pay off' : 'Carry on — the money still to spend earns its keep',
            'Carry on — otherwise the money spent so far is wasted',
            'Stop now — the total spent beats the value',
          ]),
          diagnoses: 'concept',
          why: `A positive forward gain means carrying on; a negative one means stopping. Both of the other reasons point at money that is equally gone whichever answer you give.`,
        },
      ]),
      hints: [
        'The first line should contain only money that has not left your hands yet.',
        'Second line: what finishing is worth, minus what finishing still costs.',
        `Worked path: ${money(a)} + ${money(b)} = ${money(remaining)}; ${money(value)} − ${money(remaining)} = ${forward < 0 ? `−${money(-forward)}` : money(forward)}; so **${call}**.`,
      ],
      explanation:
        `Still to spend ${money(remaining)}; finishing is worth ${money(value)}; forward gain ${forward < 0 ? `−${money(-forward)}` : money(forward)} — so **${call}**.\n\n` +
        `Splitting it into lines shows where this goes wrong, and it is almost always the first one. Sliding the ${money(spent)} into the "still to spend" box is a misreading, and it produces a confident answer built on money that no decision can reach. Getting that box right and then mis-subtracting is an ordinary slip and needs nothing but care. One answer box could not tell those apart.\n\n` +
        `${shouldFinish
          ? `Note what the answer is here: carry on. The ${money(spent)} is not the reason — it would be right to carry on if that figure were ${money(5)}, and wrong to carry on if the forward gain were negative however large the ${money(spent)} had grown.`
          : `Note that the answer would be the same if only ${money(10)} had been spent so far. The size of what is behind you never enters the arithmetic in either direction.`}`,
    }
  },
)

export const CHOICE_TEMPLATES: ItemTemplate[] = [
  // st-tradeoff
  dominatedTable,
  weightedScore,
  issueTrade,
  tradeRate,
  dropOrWeigh,
  // st-reversible
  undoCost,
  smallestTest,
  pointOfNoReturn,
  tryVsCommit,
  // st-secondorder
  thenWhat,
  undermines,
  hardToFake,
  feeHeadcount,
  // st-sunk
  finishOrStop,
  irrelevantFacts,
  spotTheReason,
  sunkTime,
  sunkChain,
]

/** Unused-parameter guard for the shared Rng type import. */
export type ChoiceRng = Rng
