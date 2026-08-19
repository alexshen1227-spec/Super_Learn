/**
 * RUNGS AND METHODS — two structural gaps in one pass (2026-08-19).
 *
 * 1. THE DIFFICULTY DIAL'S HOLLOW ENDS. Outside mathematics the dial had
 *    almost nothing at either extreme: physics carried one 1★ and one 5★
 *    template in seventy, observer 2/1 in eighty-six, meta 1/1 in ninety,
 *    coding 3/2, insight 3/2 (RESEARCH.md §32a: "the dial's bottom end
 *    remains thin"). A struggling learner in those buckets had nowhere to
 *    step down to, and a cruising one nowhere to step up to. This file adds
 *    three genuine entry items (1★: one step, low reading load, honest floor
 *    — not baby talk) and one genuine stretch item (5★, on a skill that had
 *    no 4-5★ rung) to each of the five buckets.
 *
 * 2. THE PUZZLE METHOD SKILLS WERE LOCKED TO CUSTOM PLAYERS. The puzzle
 *    bucket was 45% chess, and its four METHOD skills (z-invariant, z-search,
 *    z-extremal, z-sequence) shared seventeen families with only two
 *    `single`-kind templates among them. Six new families here use ordinary
 *    AnswerSpec kinds only — no custom player — spanning 1★ to 5★.
 *
 * HOUSE LAWS OBSERVED HERE
 *  - Answers are COMPUTED from the drawn values, never hand-typed; where a
 *    claim is search-shaped it is decided by search in this file (the cup
 *    puzzle's reachability and minimum moves come from a breadth-first search
 *    over up-counts; the glove worst case is maximised by enumerating every
 *    adversary side-choice; the backwards sequence only ships when exactly
 *    one menu rule fits the shown terms, checked by the fits* testers).
 *  - The extremal items never name the counting principle behind guarantees:
 *    `pfl-pigeonhole` measures cold pick-up of the NAMED principle, and its
 *    scope note depends on teaching items keeping it unnamed.
 *  - Observer/Insight items are defence-only, and where the form allows it,
 *    a benign "nothing is wrong" reading is an available RIGHT answer
 *    (`rng-o-anchor-noise`, `rng-h-nothing-to-fix`), not just a decoy.
 *  - Multiple-choice option sets keep the key off a fixed length rank; the
 *    conceptual sets rotate decoys between variants where the key is fixed.
 */
import type { ItemPart, ItemTemplate } from '../../domain/types'
import { cycle, mcq, mcqNoted, numeric, tpl } from '../lib'
import { fitsAlternating, fitsArithmetic, fitsGeometric, fitsQuadratic } from './searchLab'

const PROV_RUNGS = 'original construction (2026-08-19 rungs pass)'

type Noted = [text: string, note: string | null, tag?: 'concept' | 'strategy' | 'slip' | 'misread' | 'inference']

/** Rotate which decoys accompany a fixed key, so its length rank moves. */
function window<T>(seed: number, pool: readonly T[], take: number): T[] {
  const out: T[] = []
  for (let i = 0; i < take; i++) out.push(pool[(seed + i) % pool.length])
  return out
}

/* ==================================================================
 * PHYSICS — three ways in, one way up
 * ================================================================== */

const speedFloor = tpl(
  {
    id: 'rng-p-read-speed',
    name: 'Distance over time',
    skillIds: ['p-motion'],
    bucket: 'physics',
    difficulty: 1,
    variants: 12,
    minutes: 1.5,
    provenance: PROV_RUNGS,
  },
  (_rng, seed) => {
    const V = [8, 12, 15, 20][seed % 4]
    const H = [2, 3, 4][Math.floor(seed / 4) % 3]
    const D = V * H
    return {
      title: 'Distance over time',
      prompt: `A cyclist rides **${D} km** in **${H} hours** at a steady pace.\n\nWhat is her average speed, in km/h?`,
      answer: numeric(V),
      hints: [
        'Speed asks one thing: how far in ONE hour?',
        'Average speed = distance ÷ time. Divide the kilometres by the hours.',
        `${D} ÷ ${H} = **${V} km/h**.`,
      ],
      explanation:
        `Average speed = distance ÷ time = ${D} ÷ ${H} = **${V} km/h**.\n\nA quick sense-check protects the division: she needed ${H} whole hours for ${D} km, so one hour covers less than ${D} — if your answer came out bigger than ${D}, the division went the wrong way round.`,
      commonErrors: {
        representation: `Dividing time by distance gives ${Math.round((H / D) * 1000) / 1000}, a number with upside-down units (hours per km).`,
      },
    }
  },
)

const waveFloor = tpl(
  {
    id: 'rng-p-wave-speed',
    name: 'Waves past a buoy',
    skillIds: ['p-waves'],
    bucket: 'physics',
    difficulty: 1,
    variants: 12,
    minutes: 1.5,
    provenance: PROV_RUNGS,
  },
  (_rng, seed) => {
    const f = [2, 3, 4, 5][seed % 4]
    const L = [2, 3, 5][Math.floor(seed / 4) % 3]
    const v = f * L
    return {
      title: 'Waves past a buoy',
      prompt: `Ocean waves roll past a buoy. **${f} waves** pass every second, and each wave is **${L} m** long.\n\nHow fast are the waves travelling, in m/s?`,
      answer: numeric(v),
      hints: [
        'Picture one second: how much water moved past the buoy?',
        'Wave speed = frequency × wavelength — waves per second times metres per wave.',
        `${f} × ${L} = **${v} m/s**.`,
      ],
      explanation:
        `In one second, ${f} waves pass, each ${L} m long, so ${f} × ${L} = **${v} m** of wave goes by per second.\n\nThe units do the thinking: (waves per second) × (metres per wave) leaves metres per second, because the "waves" cancel. That cancellation is the whole formula v = f × λ.`,
      commonErrors: {
        concept: `Adding ${f} + ${L} = ${f + L} mixes two different kinds of quantity; only multiplying makes the units come out as a speed.`,
      },
    }
  },
)

const workFloor = tpl(
  {
    id: 'rng-p-work-push',
    name: 'Force times distance',
    skillIds: ['p-energy'],
    bucket: 'physics',
    difficulty: 1,
    variants: 12,
    minutes: 1.5,
    provenance: PROV_RUNGS,
  },
  (_rng, seed) => {
    const F = [5, 10, 20, 25][seed % 4]
    const d = [2, 3, 4][Math.floor(seed / 4) % 3]
    const W = F * d
    return {
      title: 'Force times distance',
      prompt: `A crate is pushed along the floor with a steady force of **${F} N**, moving it **${d} m**.\n\nHow much work is done on the crate, in joules?`,
      answer: numeric(W),
      hints: [
        'Work measures effort × how far the effort carried.',
        'Work = force × distance moved, when the push points the way it moves.',
        `${F} × ${d} = **${W} J**.`,
      ],
      explanation:
        `Work = force × distance = ${F} × ${d} = **${W} J**.\n\nOne joule is exactly one newton of push carried through one metre — the unit is the formula in miniature. Push twice as hard OR twice as far and you have done twice the work; the two matter equally.`,
      commonErrors: {
        concept: 'Holding a heavy crate still feels like effort, but with no distance moved the work done on it is zero — work needs movement.',
      },
    }
  },
)

/**
 * 5★ circuits: one series resistor feeding a parallel pair. The parameter
 * table is chosen so the pair resistance, the battery current, the pair
 * voltage and the branch current are ALL exact integers, and the two branch
 * currents recombine to the battery current (stated in the explanation as the
 * self-check). Physics had exactly one 5★ template before this.
 */
const CIRCUIT_PAIRS: readonly [r2: number, r3: number, pair: number, amps: number][] = [
  [6, 3, 2, 3],
  [12, 4, 3, 4],
  [10, 15, 6, 5],
  [20, 5, 4, 5],
  [6, 6, 3, 2],
  [8, 8, 4, 4],
]

const circuitStretch = tpl(
  {
    id: 'rng-p-two-loop-circuit',
    name: 'One battery, two paths',
    skillIds: ['p-circuits'],
    bucket: 'physics',
    difficulty: 5,
    variants: 24,
    minutes: 4,
    kind: 'multi',
    provenance: `${PROV_RUNGS}; every value in the parameter table keeps all three currents and both voltages exact integers, and the branch currents recombine to the battery current.`,
  },
  (_rng, seed) => {
    const [R2, R3, P, I] = CIRCUIT_PAIRS[seed % 6]
    const R1 = [4, 7, 10, 14][Math.floor(seed / 6) % 4]
    const V = I * (R1 + P)
    const Vpair = I * P
    const I2 = Vpair / R2
    const I3 = Vpair / R3
    const parts: ItemPart[] = [
      {
        prompt: 'What single resistance could replace the parallel pair R2 and R3, in ohms?',
        answer: numeric(P),
        hints: [
          'Two resistors side by side give the current two routes, so together they resist LESS than either alone.',
          'For exactly two in parallel: combined = (R2 × R3) ÷ (R2 + R3).',
          `(${R2} × ${R3}) ÷ (${R2} + ${R3}) = ${R2 * R3} ÷ ${R2 + R3} = **${P} Ω**.`,
        ],
        explanation:
          `(${R2} × ${R3}) ÷ (${R2} + ${R3}) = **${P} Ω**. Sanity check: ${P} is smaller than both ${R2} and ${R3}, which parallel resistance always must be — adding a second route can only make the passage easier.`,
      },
      {
        prompt: 'What current does the battery supply, in amps?',
        answer: numeric(I),
        hints: [
          'Collapse the circuit first: with the pair replaced, only a series chain is left.',
          `Series resistances add: total = R1 + pair = ${R1} + ${P}. Then use I = V ÷ R on the whole circuit.`,
          `${V} ÷ ${R1 + P} = **${I} A**.`,
        ],
        explanation:
          `Total resistance = ${R1} + ${P} = ${R1 + P} Ω, so the battery drives I = ${V} ÷ ${R1 + P} = **${I} A**. Reducing the circuit BEFORE reaching for Ohm's law is the whole strategy: V = IR only ever applies to one resistance at a time.`,
      },
      {
        prompt: `What current flows through R2, the ${R2} Ω resistor, in amps?`,
        answer: numeric(I2),
        hints: [
          'The pair shares the battery current between its two branches — but not equally.',
          `Both branches sit across the SAME voltage. Find it first: pair voltage = battery current × pair resistance = ${I} × ${P}.`,
          `${Vpair} V across ${R2} Ω gives ${Vpair} ÷ ${R2} = **${I2} A**.`,
        ],
        explanation:
          `The pair drops ${I} × ${P} = ${Vpair} V, and both branches feel all of it, so R2 carries ${Vpair} ÷ ${R2} = **${I2} A**. Self-check: R3 carries ${Vpair} ÷ ${R3} = ${I3} A, and ${I2} + ${I3} = ${I} A — exactly the battery current. If the branches do not add back up, something upstream is wrong.`,
      },
    ]
    return {
      title: 'One battery, two paths',
      prompt:
        `A **${V} V** battery is connected to **R1 = ${R1} Ω**, and then the circuit splits: **R2 = ${R2} Ω** and **R3 = ${R3} Ω** sit side by side on the two branches before the wires rejoin and return to the battery.\n\nSo R1 is in series with the parallel pair R2–R3.`,
      parts,
      hints: [
        'Do not chase all three resistors at once — simplify the picture first.',
        'Collapse the parallel pair into one resistor, solve the series circuit, then climb back in for the branch.',
        'Three small steps: pair resistance, battery current, then the shared pair voltage gives each branch current.',
      ],
      explanation:
        `The whole problem is one move applied three times: replace a cluster with its single equivalent, apply V = IR at that level, then descend one level with what you learned. Collapse the pair (${P} Ω), solve the series loop (${I} A), then use the pair voltage (${Vpair} V) to split the current between branches. The recombination check — ${I2} + ${I3} = ${I} — catches most slips, because charge cannot leak out of a junction.`,
    }
  },
)

/* ==================================================================
 * OBSERVER — three ways in, one way up
 * ================================================================== */

interface StatedScene {
  scene: string
  stated: string
  beyond: [string, string, string]
}

/** Each scene STATES exactly one of the four candidate lines. */
const STATED_SCENES: StatedScene[] = [
  {
    scene: 'A bike leans against the school fence with its front tyre flat and a helmet hanging from the handlebar.',
    stated: 'The front tyre is flat',
    beyond: ['The rider hit something sharp', 'The bike has sat there all day', 'The helmet belongs to the rider'],
  },
  {
    scene: 'Two mugs sit on the kitchen table; one is full and still steaming, the other lies empty on its side.',
    stated: 'One mug is still steaming',
    beyond: ['Somebody left here in a hurry', 'The empty mug was knocked over', 'Two people were drinking here'],
  },
  {
    scene: 'The classroom door is propped open with a chair, and wet footprints lead from the door to the sink.',
    stated: 'Wet footprints lead to the sink',
    beyond: ['Somebody spilled water by the sink', 'A student came in from the rain', 'The cleaner has just mopped here'],
  },
  {
    scene: 'A phone lies on the bench beside a half-eaten sandwich, buzzing every few seconds.',
    stated: 'The phone keeps on buzzing',
    beyond: ['Its owner is getting urgent news', 'Whoever ate here is coming back', 'The sandwich was left this morning'],
  },
  {
    scene: 'The library window is open and three loose pages are scattered across the floor below it.',
    stated: 'Three pages lie on the floor',
    beyond: ['The wind blew the pages down', 'Somebody left the window open', 'The pages fell from one book'],
  },
  {
    scene: 'A queue of six people stands at the bus stop, and two of them are holding folded umbrellas.',
    stated: 'Two people hold folded umbrellas',
    beyond: ['It rained earlier this morning', 'The bus is running late again', 'The forecast promised rain today'],
  },
  {
    scene: 'The hamster cage door hangs open and wood shavings are sprinkled on the carpet in front of it.',
    stated: 'The cage door is hanging open',
    beyond: ['The hamster escaped on its own', 'Somebody forgot to shut the door', 'The hamster is under the sofa'],
  },
  {
    scene: 'A trophy cabinet key sits in its lock, and one shelf inside holds a gap in the row of cups.',
    stated: 'The key is sitting in the lock',
    beyond: ['A cup was taken out recently', 'The caretaker forgot the key', 'One cup is away for engraving'],
  },
]

const statedFloor = tpl(
  {
    id: 'rng-o-see-or-guess',
    name: 'Stated, or added?',
    skillIds: ['o-obsinf'],
    bucket: 'observer',
    difficulty: 1,
    variants: STATED_SCENES.length,
    minutes: 1.5,
    provenance: PROV_RUNGS,
  },
  (rng, seed) => {
    const s = cycle(seed, STATED_SCENES)
    return {
      title: 'Stated, or added?',
      prompt: `Read the scene once.\n\n> ${s.scene}\n\nExactly one of these is STATED by the scene. The rest add something. Which is stated?`,
      answer: mcq(rng, s.stated, [...s.beyond]),
      hints: [
        'Three of the four go beyond the sentence; one sits inside it.',
        'The test is pointing: can you put a finger on the exact words in the scene that say it?',
        `Only "${s.stated}" is in the scene itself; each of the others adds a story about how things got that way.`,
      ],
      explanation:
        `**${s.stated}** — the scene says it in so many words. The other three might all be TRUE, and that is exactly the trap: they are explanations the scene invites but never states. Keeping "what I read" separate from "what I added" is the smallest version of the observation habit, and everything harder in this bucket builds on it.`,
    }
  },
)

interface ClaimCase {
  text: string
  cat: 0 | 1 | 2
  note: string
}

const CLAIM_KINDS = ['A fact you could check now', 'A judgement call', 'A guess about the future'] as const

const CLAIM_CASES: ClaimCase[] = [
  { text: 'Our street has three lamp posts.', cat: 0, note: 'Walk the street and count — it settles today, no taste involved.' },
  { text: 'Next summer will be hotter than this one.', cat: 2, note: 'Nothing settles it until next summer arrives; today it can only be a forecast.' },
  { text: 'The new library layout is more welcoming.', cat: 1, note: '"Welcoming" lives in the eye of the visitor — two careful people can land on opposite sides.' },
  { text: 'This bottle holds exactly one litre.', cat: 0, note: 'A measuring jug settles it this afternoon.' },
  { text: 'Tomorrow\'s match will end in a draw.', cat: 2, note: 'Checkable eventually, but not by anything you can do before the whistle.' },
  { text: 'Blue is the best colour for the team kit.', cat: 1, note: '"Best" here is preference wearing a confident voice; no measurement decides it.' },
  { text: 'The 8:15 bus stops outside the swimming pool.', cat: 0, note: 'The timetable or one morning at the stop settles it.' },
  { text: 'The canteen queue will be shorter on Friday.', cat: 2, note: 'A reasonable bet, maybe — but only Friday can grade it.' },
  { text: 'This year\'s school play was better than last year\'s.', cat: 1, note: 'Better how? Funnier, tighter, braver? The standard is a choice, so this is a judgement.' },
  { text: 'This month has thirty-one days.', cat: 0, note: 'One glance at a calendar settles it completely.' },
  { text: 'Our class will win the quiz next week.', cat: 2, note: 'Confidence does not change its type: until the quiz happens, it is a prediction.' },
  { text: 'The corner shop is friendlier than the supermarket.', cat: 1, note: '"Friendlier" depends on whose visits you count and what counts as friendly.' },
]

const claimFloor = tpl(
  {
    id: 'rng-o-claim-sort',
    name: 'What kind of claim is this?',
    skillIds: ['o-claimtype'],
    bucket: 'observer',
    difficulty: 1,
    variants: CLAIM_CASES.length,
    minutes: 1.5,
    provenance: PROV_RUNGS,
  },
  (rng, seed) => {
    const c = cycle(seed, CLAIM_CASES)
    const key = CLAIM_KINDS[c.cat]
    return {
      title: 'What kind of claim is this?',
      prompt: `One sentence:\n\n> ${c.text}\n\nWhich kind of claim is it?`,
      answer: mcq(rng, key, CLAIM_KINDS.filter((k) => k !== key)),
      hints: [
        'Ask what it would take to settle the sentence.',
        'Checkable today = fact. Settled by taste or standards = judgement. Settled only by waiting = guess about the future.',
        c.note,
      ],
      explanation:
        `**${key}.** ${c.note}\n\nThe sorting matters because the three kinds earn trust differently: a fact can be checked, a judgement can be argued, and a guess can only be scored later. Trouble starts when one kind is dressed as another — most often a judgement delivered in the flat voice of a fact.`,
    }
  },
)

const ANCHOR_SCENES: readonly { setup: string; ask: string }[] = [
  { setup: 'At the fair you pick raffle ticket number **NUM** out of the drum. The next stall asks you to guess how many marbles fill a tall jar', ask: 'your marble guess' },
  { setup: 'Your locker combination ends in **NUM**. In science you are asked to estimate how many pages the new textbook has', ask: 'your page estimate' },
  { setup: 'A quiz show wheel lands on **NUM** for a bonus round. Then the host asks the audience to estimate how many steps the town hall staircase has', ask: 'your step estimate' },
  { setup: 'The bus you ride to the museum is route **NUM**. Inside, a card asks visitors to guess the age of a fossil display in years', ask: 'your age guess' },
  { setup: 'You finish a game with a score ending in **NUM**. Straight after, a friend asks you to guess how many songs are on their playlist', ask: 'your song guess' },
  { setup: 'The page you happen to open a puzzle book at is page **NUM**. The puzzle asks you to estimate how many beans fill a photographed bowl', ask: 'your bean estimate' },
  { setup: 'Your cinema seat is number **NUM**. During the trailers, a competition card asks you to guess how many films the cinema shows in a year', ask: 'your film guess' },
  { setup: 'A spinner at the school fete stops on **NUM**. The next stand asks you to estimate how many bricks are in its model tower', ask: 'your brick estimate' },
]

const anchorFloor = tpl(
  {
    id: 'rng-o-anchor-noise',
    name: 'The number that means nothing',
    skillIds: ['o-anchor'],
    bucket: 'observer',
    difficulty: 1,
    variants: 16,
    minutes: 1.5,
    provenance: PROV_RUNGS,
  },
  (rng, seed) => {
    const sc = cycle(seed, ANCHOR_SCENES)
    const num = 12 + ((seed * 37) % 80)
    const setup = sc.setup.replace('NUM', String(num))
    const decoyPool: Noted[] = [
      ['Nudge your estimate toward it, to be safe', 'moving toward an unrelated number is exactly the pull to resist — "to be safe" is how it sneaks in', 'strategy'],
      ['Use it as the starting point you adjust from', 'starting there is how the pull works: adjustments away from a start point stop too early', 'concept'],
      ['Replace your guess with it if you feel unsure', 'feeling unsure does not make an unrelated number informative', 'strategy'],
      ['Double it and treat that as a rough ceiling', 'any recipe built on it inherits its irrelevance — doubling noise is still noise', 'concept'],
    ]
    const pick = mcqNoted(rng, 'Nothing — it has no connection to the question', window(seed, decoyPool, 3))
    return {
      title: 'The number that means nothing',
      prompt: `${setup}.\n\nWhat should the number **${num}** do to ${sc.ask}?`,
      answer: pick.answer,
      distractorNotes: pick.distractorNotes,
      distractorTags: pick.distractorTags,
      hints: [
        'Ask one question first: is there ANY link between where that number came from and the thing being estimated?',
        'The move is to name the number irrelevant OUT LOUD before estimating — an unrelated number still drags guesses toward it if you let it hang around.',
        `${num} came from a draw that knows nothing about the answer, so the honest response is to set it aside completely and build your estimate from the thing itself.`,
      ],
      explanation:
        `**Nothing** — the number arrived by chance and carries no information about the estimate. The unsettling part is that unrelated numbers still tug at people's guesses when they sit nearby; the defence is not willpower but a habit: before estimating, ask where the numbers in front of you came from, and say plainly which ones have no business influencing you. A number with no connection to the question earns exactly no weight.`,
    }
  },
)

/**
 * 5★ selection effects with real numbers: the club surveyed only the people
 * who stayed. Values are chosen so the count of satisfied members and the
 * worst-case share of ALL members are exact.
 */
const SURVEY_ROWS: readonly [start: number, renewed: number, pct: number, club: string][] = [
  [200, 80, 90, 'climbing club'],
  [200, 100, 88, 'coding club'],
  [240, 120, 90, 'swim squad'],
  [300, 120, 95, 'drama group'],
  [300, 150, 90, 'chess club'],
  [250, 150, 90, 'orchestra'],
]

const surveyStretch = tpl(
  {
    id: 'rng-o-missing-half',
    name: 'The survey that asked the stayers',
    skillIds: ['o-selection'],
    bucket: 'observer',
    difficulty: 5,
    variants: SURVEY_ROWS.length,
    minutes: 4,
    kind: 'multi',
    provenance: `${PROV_RUNGS}; every row of the parameter table keeps the satisfied count and the worst-case share exact integers.`,
  },
  (rng, seed) => {
    const [start, renewed, pct, club] = cycle(seed, SURVEY_ROWS)
    const left = start - renewed
    const happy = (renewed * pct) / 100
    const lowPct = (happy * 100) / start
    const fix = mcq(rng, 'Track down the people who left, and ask them', [
      'Survey the renewing members a second time',
      'Add next year\'s new joiners to the sample',
      'Reword the question to sound more neutral',
    ])
    const parts: ItemPart[] = [
      {
        prompt: `How many people actually told the survey the ${club} was welcoming?`,
        answer: numeric(happy),
        hints: [
          'Start with who received the survey at all.',
          `The ${pct}% is a share of the SURVEYED group only — the ${renewed} renewers — so take ${pct}% of ${renewed}.`,
          `${pct}% of ${renewed} = **${happy}**.`,
        ],
        explanation:
          `${pct}% of the ${renewed} renewers is **${happy} people**. Notice what the headline quietly did: a claim about "${pct}% of members" is really a claim about ${happy} individuals, all drawn from the group that chose to stay.`,
      },
      {
        prompt: `Suppose every one of the ${left} people who left found the club unwelcoming. What share of ALL ${start} original members found it welcoming, in percent?`,
        answer: numeric(lowPct),
        hints: [
          'The people who left were never asked, so the data cannot rule out the harshest case.',
          `Put the ${happy} known "welcoming" answers over the WHOLE starting group of ${start}, not over the surveyed group.`,
          `${happy} ÷ ${start} = ${lowPct}%.`,
        ],
        explanation:
          `**${lowPct}%.** The ${happy} satisfied voices are real, but against all ${start} original members they could be as few as ${happy}/${start}. The survey's ${pct}% and this ${lowPct}% describe the same club with the same data — the gap between them is the ${left} people nobody asked.`,
      },
      {
        prompt: 'Which single step would do most to make the "welcoming" claim trustworthy?',
        answer: fix,
        hints: [
          'The weakness is not the wording or the sample size — it is WHO could be reached at all.',
          'Name the group the survey structurally missed, then go to that group directly.',
          `The ${left} members who left are the missing evidence; only their answers can close the gap.`,
        ],
        explanation:
          `Only asking the leavers helps. Re-surveying renewers polishes the half you already have; new joiners have not experienced the year in question; rewording changes tone, not coverage. The defect is structural — the unhappy were filtered out before the first question was sent — so the fix has to reach the filtered-out group.`,
      },
    ]
    return {
      title: 'The survey that asked the stayers',
      prompt:
        `A ${club} started the year with **${start} members**. At renewal time, **${renewed}** renewed and **${left}** left.\n\nThe club emailed a survey to everyone who renewed, and **${pct}%** of them called the club welcoming. The newsletter now says: "**${pct}% of members find the club welcoming.**"`,
      parts,
      hints: [
        'Before judging the number, ask who never received a questionnaire.',
        'Name the missing group and its size first — the people who left — then recompute against everyone.',
        `The ${pct}% covers only the ${renewed} who stayed; the ${left} leavers could all disagree, and the arithmetic of that worst case is the honest floor.`,
      ],
      explanation:
        `The survey filtered out its critics before asking a single question: anyone who found the club unwelcoming had likely already left, and the questionnaire never followed them. So "${pct}% of members" is really "${pct}% of the ${renewed} who stayed" — ${happy} people — and across everyone who began the year the guaranteed floor is ${lowPct}%. The general habit: when a satisfaction number looks great, ask what someone had to do to end up in the surveyed group at all.`,
    }
  },
)

/* ==================================================================
 * META — three ways in, one way up
 * ================================================================== */

const QUIZ_MATERIALS = [
  'this week\'s spelling list',
  'twenty French words',
  'the capital cities of Europe',
  'ten science key terms',
  'the dates for the history test',
  'the first twenty element symbols',
  'the parts of a plant cell',
  'the formulas for area and volume',
] as const

const retrievalFloor = tpl(
  {
    id: 'rng-x-next-day-quiz',
    name: 'Ten minutes before a quiz',
    skillIds: ['x-learn'],
    bucket: 'meta',
    difficulty: 1,
    variants: QUIZ_MATERIALS.length,
    minutes: 1.5,
    provenance: PROV_RUNGS,
  },
  (rng, seed) => {
    const material = cycle(seed, QUIZ_MATERIALS)
    return {
      title: 'Ten minutes before a quiz',
      prompt: `Tomorrow there is a short quiz on ${material}. You have ten minutes tonight, and you have already read the list through twice.\n\nWhich use of the ten minutes is the better bet?`,
      answer: mcq(rng, 'Cover the list and write it from memory, then check', [
        'Read the whole list through another three times',
        'Copy the list out once in your neatest writing',
        'Highlight the hardest half of the list in colour',
      ]),
      hints: [
        'Re-reading feels smooth. Ask what the quiz will actually demand of you.',
        'The quiz makes your memory PRODUCE the answers, so practise producing them — that move is called retrieval practice.',
        'Cover, write from memory, then check: the checking step shows you exactly which items re-reading would have hidden.',
      ],
      explanation:
        `**Cover it and write it from memory, then check.** Pulling something out of memory strengthens it far more than looking at it again, and the advantage grows when the test is tomorrow rather than in five minutes — this is one of the most consistently repeated findings in learning research. The catch is how it feels: re-reading feels fluent and recall feels bumpy, so your own comfort points at the weaker option. The bumps are the finding — each one marks an item you would have lost.`,
    }
  },
)

const STUCK_THINGS = [
  'a maths word problem',
  'a physics question',
  'a stubborn code bug',
  'a geometry proof',
  'a logic puzzle',
  'a chemistry calculation',
  'an essay opening',
  'a chess puzzle',
] as const

const stuckFloor = tpl(
  {
    id: 'rng-x-stuck-first-move',
    name: 'Two minutes of nothing',
    skillIds: ['x-stuck'],
    bucket: 'meta',
    difficulty: 1,
    variants: STUCK_THINGS.length,
    minutes: 1.5,
    provenance: PROV_RUNGS,
  },
  (rng, seed) => {
    const thing = cycle(seed, STUCK_THINGS)
    return {
      title: 'Two minutes of nothing',
      prompt: `You have stared at ${thing} for two minutes and written nothing.\n\nWhat is the best FIRST move?`,
      answer: mcq(rng, 'Reread it and write down what it actually asks', [
        'Keep staring until the idea finally arrives',
        'Rush any answer down so something is on paper',
        'Skip it and hope it makes sense again later',
      ]),
      hints: [
        'Staring longer replays the same failed loop — change what your eyes and hands are doing.',
        'The move is to externalise: reread, then WRITE the goal and the givens in your own words.',
        'Half of two-minute stalls end during the rewrite, because the stall was a misread rather than a wall.',
      ],
      explanation:
        `**Reread it and write down what it asks.** A surprising share of stalls are misreads — a condition skimmed past, a question answered that was never asked — and writing the goal and givens in your own words is the cheapest test for that. It also breaks the stare-loop: your working memory gets the problem back in fresh form instead of the echo of your last failed attempt. Skipping has its place LATER; as a first move it throws away the two minutes you already invested.`,
    }
  },
)

const MIX_TRIOS: readonly [string, string, string][] = [
  ['fractions', 'percentages', 'ratios'],
  ['area', 'perimeter', 'volume'],
  ['speed', 'density', 'pressure'],
  ['mean', 'median', 'mode'],
  ['past tense', 'present tense', 'future tense'],
  ['addition of fractions', 'multiplication of fractions', 'division of fractions'],
  ['expanding brackets', 'factorising', 'collecting like terms'],
  ['reflections', 'rotations', 'translations'],
]

const mixFloor = tpl(
  {
    id: 'rng-x-mix-or-block',
    name: 'Twelve problems, two orders',
    skillIds: ['x-interleave'],
    bucket: 'meta',
    difficulty: 1,
    variants: MIX_TRIOS.length,
    minutes: 1.5,
    provenance: PROV_RUNGS,
  },
  (rng, seed) => {
    const [a, b, c] = cycle(seed, MIX_TRIOS)
    return {
      title: 'Twelve problems, two orders',
      prompt:
        `Tonight's sheet has twelve problems: four on ${a}, four on ${b}, four on ${c}. Two ways to order them:\n\n- **Blocked**: all the ${a} first, then ${b}, then ${c}.\n- **Mixed**: the twelve shuffled together.\n\nWhich order forces you to decide, on every problem, WHICH method it needs?`,
      answer: mcq(rng, 'The mixed order', [
        'The blocked order',
        'Both orders equally',
        'Neither — the sheet says which is which',
      ]),
      hints: [
        'In the blocked order, ask how you know what method problem number three needs.',
        'Spot the free ride: in a block, the POSITION answers the "which method?" question before you read a word.',
        'Shuffled problems carry no position clue, so every single one makes you choose — and choosing is a skill of its own.',
      ],
      explanation:
        `**The mixed order.** In a block, problem seven is a ${b} problem because it sits in the ${b} block — the sheet has already made the decision that a test or real life would hand to you. Mixing removes that free ride, so you practise recognising each problem type, not just executing it. Honest warning from the research on maths practice: mixed order feels worse and produces more errors on the night, then wins on later tests — so the discomfort is not a sign it is failing.`,
    }
  },
)

/**
 * 5★ calibration arithmetic: two students, stated confidence against actual
 * results. Every expected count is an exact integer, and the verdict is
 * computed by comparing the two calibration gaps (rows are chosen so the
 * verdict is never ambiguous unless it is exactly a tie, which appears too).
 */
const FORECAST_ROWS: readonly [cA: number, rA: number, cB: number, rB: number][] = [
  [90, 6, 60, 6],
  [80, 8, 90, 6],
  [70, 4, 60, 6],
  [90, 9, 50, 5],
  [60, 9, 80, 8],
  [80, 5, 70, 7],
  [90, 9, 70, 4],
  [50, 5, 90, 5],
]

const calibrationStretch = tpl(
  {
    id: 'rng-x-two-forecasters',
    name: 'The confidence scoreboard',
    skillIds: ['x-calib'],
    bucket: 'meta',
    difficulty: 5,
    variants: FORECAST_ROWS.length,
    minutes: 3.5,
    kind: 'multi',
    provenance: `${PROV_RUNGS}; expected counts are exact by construction and the verdict is computed from the two calibration gaps, including an exact-tie row.`,
  },
  (rng, seed) => {
    const [cA, rA, cB, rB] = cycle(seed, FORECAST_ROWS)
    const expA = (10 * cA) / 100
    const expB = (10 * cB) / 100
    const gapA = Math.abs(rA - expA)
    const gapB = Math.abs(rB - expB)
    const verdict = gapA === gapB ? 'Both students equally' : gapA < gapB ? 'Student A' : 'Student B'
    const who = mcq(rng, verdict, ['Student A', 'Student B', 'Both students equally'].filter((o) => o !== verdict))
    const direction = (r: number, e: number) =>
      r < e ? 'overconfident — promised more than was delivered' : r > e ? 'underconfident — delivered more than was promised' : 'spot on'
    const parts: ItemPart[] = [
      {
        prompt: `If Student A's "${cA}% sure" is honest, how many of the ten answers should A expect to have right?`,
        answer: numeric(expA),
        hints: [
          'A confidence level is a promise about a rate.',
          `Turn the percentage into a count: ${cA}% of the 10 questions.`,
          `${cA}% of 10 = **${expA}**.`,
        ],
        explanation: `Saying "${cA}% sure" ten times predicts ${cA}% of 10 = **${expA} right answers**. That is what makes a confidence honest or not — it is a checkable forecast, not a mood.`,
      },
      {
        prompt: `Same question for Student B: how many right answers does "${cB}% sure" predict out of ten?`,
        answer: numeric(expB),
        hints: [
          'Exactly the same conversion as before, with B\'s number.',
          `Take ${cB}% of the 10 questions.`,
          `${cB}% of 10 = **${expB}**.`,
        ],
        explanation: `${cB}% of 10 = **${expB}**. Two different promises are now on the table: A predicted ${expA} and B predicted ${expB}. Neither is "better" yet — the results decide.`,
      },
      {
        prompt: 'Whose stated confidence matched their actual results better?',
        answer: who,
        hints: [
          'Compare each student\'s PREDICTED count with their ACTUAL count, separately.',
          `Work out the two gaps: A promised ${expA} and got ${rA}; B promised ${expB} and got ${rB}. The smaller gap wins.`,
          `A's gap is ${gapA} and B's gap is ${gapB}.`,
        ],
        explanation:
          `A promised ${expA} and delivered ${rA} (gap ${gapA}); B promised ${expB} and delivered ${rB} (gap ${gapB}). So: **${verdict.toLowerCase().startsWith('both') ? 'they matched equally well' : verdict + ' matched better'}**. A was ${direction(rA, expA)}; B was ${direction(rB, expB)}. Note what the question did NOT ask: who scored more. Calibration is about the match between promise and outcome — a modest promise kept beats a grand promise missed.`,
      },
    ]
    return {
      title: 'The confidence scoreboard',
      prompt:
        `Two students rated every answer on the same 10-question quiz.\n\n- **Student A** said "${cA}% sure" on all ten answers, and got **${rA}** right.\n- **Student B** said "${cB}% sure" on all ten answers, and got **${rB}** right.`,
      parts,
      hints: [
        'Treat each stated confidence as a prediction you can score.',
        'Convert each percentage into an expected COUNT out of ten, then compare expected with actual for each student separately.',
        'The better-calibrated student is the one with the smaller gap — regardless of who got more questions right.',
      ],
      explanation:
        `A confidence level is a forecast: "${cA}% sure" ten times over predicts ${expA} right answers, and reality then grades the forecast. Here A's gap was ${gapA} and B's was ${gapB}. The uncomfortable lesson is that the higher scorer and the better-calibrated student are different questions — knowing a lot and knowing HOW MUCH you know are separate skills, and this app can only trust your self-reports to the extent the second one is in shape.`,
    }
  },
)

/* ==================================================================
 * CODING — three ways in, one way up
 * ================================================================== */

const boolFloor = tpl(
  {
    id: 'rng-c-pick-true',
    name: 'Which comparison is true?',
    skillIds: ['c-bool'],
    bucket: 'coding',
    difficulty: 1,
    variants: 12,
    minutes: 1.5,
    provenance: `${PROV_RUNGS}; each option's truth value is evaluated by the generator, and exactly one is true by construction.`,
  },
  (rng, seed) => {
    const x = [4, 7, 11][Math.floor(seed / 4) % 3]
    const mode = seed % 4
    // [expression text, truth] — truth COMPUTED by evaluating the comparison.
    const sets: [string, boolean][][] = [
      [
        [`x > ${x - 2}`, x > x - 2],
        [`x < ${x - 1}`, x < x - 1],
        [`x === ${x + 3}`, x === x + 3],
        [`x <= ${x - 3}`, x <= x - 3],
      ],
      [
        [`x < ${x + 2}`, x < x + 2],
        [`x > ${x + 1}`, x > x + 1],
        [`x === ${x - 2}`, x === x - 2],
        [`x >= ${x + 4}`, x >= x + 4],
      ],
      [
        [`x <= ${x}`, x <= x],
        [`x < ${x}`, x < x],
        [`x > ${x}`, x > x],
        [`x === ${x + 1}`, x === x + 1],
      ],
      [
        [`x >= ${x}`, x >= x],
        [`x > ${x}`, x > x],
        [`x < ${x}`, x < x],
        [`x === ${x - 1}`, x === x - 1],
      ],
    ]
    const set = sets[mode]
    const key = set.find(([, t]) => t)![0]
    const wrong = set.filter(([, t]) => !t).map(([s]) => `\`${s}\``)
    return {
      title: 'Which comparison is true?',
      prompt: `The variable holds:\n\n\`\`\`js\nconst x = ${x}\n\`\`\`\n\nExactly one of these comparisons is true. Which one?`,
      answer: mcq(rng, `\`${key}\``, wrong),
      hints: [
        `Substitute the value: everywhere you see x, read ${x}.`,
        `Check each comparison one at a time with x = ${x} — and remember that <= and >= mean "or equal", so ${x} <= ${x} counts as true.`,
        `Only \`${key}\` holds when x is ${x}; each of the others fails on the substituted numbers.`,
      ],
      explanation:
        `With x = ${x}, only **\`${key}\`** is true. ${set.map(([s, t]) => `\`${s}\` is ${t ? 'true' : 'false'}`).join('; ')}.\n\nThe boundary operators are where slips live: \`<\` excludes the exact value, \`<=\` includes it, and \`===\` demands exact equality. Reading a condition as a plain yes/no question about specific numbers — before worrying about any surrounding code — is the foundational move of debugging.`,
    }
  },
)

const loopFloor = tpl(
  {
    id: 'rng-c-loop-count',
    name: 'How many beeps?',
    skillIds: ['c-loops'],
    bucket: 'coding',
    difficulty: 1,
    variants: 12,
    minutes: 1.5,
    provenance: PROV_RUNGS,
  },
  (_rng, seed) => {
    const a = [1, 2, 3, 5][seed % 4]
    const b = [6, 9, 12][Math.floor(seed / 4) % 3]
    const count = b - a + 1
    return {
      title: 'How many beeps?',
      prompt: `\`\`\`js\nfor (let i = ${a}; i <= ${b}; i++) {\n  console.log("beep")\n}\n\`\`\`\n\nHow many times does \`beep\` print?`,
      answer: numeric(count),
      hints: [
        `List the first few values i takes: ${a}, ${a + 1}, ${a + 2}, …`,
        `Count the values from ${a} to ${b} INCLUDING both ends — the \`<=\` keeps ${b} in.`,
        `${b} − ${a} + 1 = **${count}**.`,
      ],
      explanation:
        `The loop body runs once for every value i takes: ${a}, ${a + 1}, … up to and including ${b} (because the condition is \`<=\`, not \`<\`). That is ${b} − ${a} + 1 = **${count}** times.\n\nThe "+ 1" is the classic fence-post correction: subtracting alone counts the gaps between values, and there is always one more post than gaps.`,
      commonErrors: {
        slip: `${b} − ${a} = ${b - a} counts the steps between values but forgets that i = ${a} also runs the body.`,
      },
    }
  },
)

const INDEX_ARRAYS: readonly number[][] = [
  [4, 9, 2, 7, 5],
  [8, 3, 11, 6, 2],
  [5, 12, 7, 3, 9],
  [10, 2, 6, 14, 8],
  [3, 8, 15, 4, 12],
  [7, 13, 2, 9, 6],
]

const indexFloor = tpl(
  {
    id: 'rng-c-read-index',
    name: 'Counting from zero',
    skillIds: ['c-arrays'],
    bucket: 'coding',
    difficulty: 1,
    variants: 12,
    minutes: 1.5,
    provenance: PROV_RUNGS,
  },
  (_rng, seed) => {
    const xs = INDEX_ARRAYS[seed % 6]
    const idx = [2, 3][Math.floor(seed / 6) % 2]
    return {
      title: 'Counting from zero',
      prompt: `\`\`\`js\nconst xs = [${xs.join(', ')}]\n\`\`\`\n\nWhat value is \`xs[${idx}]\`?`,
      answer: numeric(xs[idx]),
      hints: [
        'The first slot is not slot number 1.',
        `Indexes count from zero: \`xs[0]\` is ${xs[0]}, \`xs[1]\` is ${xs[1]}, and so on.`,
        `Counting 0, 1${idx === 3 ? ', 2' : ''} … the value at index ${idx} is **${xs[idx]}**.`,
      ],
      explanation:
        `**${xs[idx]}.** Walking the array with its indexes: ${xs.map((v, i) => `\`xs[${i}]\` = ${v}`).join(', ')}. Index ${idx} is the ${idx + 1}th value, because counting starts at zero.\n\nThis off-by-one is the single most common early array error, and it never fully goes away — experienced programmers still say "index ${idx}, so the ${idx + 1}th item" under their breath.`,
      commonErrors: {
        concept: `Reading \`xs[${idx}]\` as the ${idx}th item gives ${xs[idx - 1]} — that is what one-based counting would return.`,
      },
    }
  },
)

/**
 * 5★ complexity: exact iteration count of the all-pairs double loop, then the
 * same count with n doubled, then the growth-shape conclusion. Every count is
 * n(n−1)/2 — an integer — and the parts build the "roughly quadruples"
 * observation from two exact numbers rather than asserting it.
 */
const pairsStretch = tpl(
  {
    id: 'rng-c-count-pairs',
    name: 'The cost of every pair',
    skillIds: ['c-complexity'],
    bucket: 'coding',
    difficulty: 5,
    variants: 6,
    minutes: 3.5,
    kind: 'multi',
    provenance: `${PROV_RUNGS}; both iteration counts are computed exactly as n(n−1)/2, and the growth conclusion is drawn from those two computed values.`,
  },
  (rng, seed) => {
    const n = [8, 10, 12, 16, 20, 30][seed % 6]
    const pairs = (n * (n - 1)) / 2
    const n2 = 2 * n
    const pairs2 = (n2 * (n2 - 1)) / 2
    const growth = mcq(rng, 'It roughly quadruples', [
      'It roughly doubles',
      'It grows by a fixed amount',
      'It stays about the same',
    ])
    const parts: ItemPart[] = [
      {
        prompt: `With n = ${n}, what is \`count\` when the loops finish?`,
        answer: numeric(pairs),
        hints: [
          'Follow the inner loop for each i in turn — it does not always run the same number of times.',
          `The inner loop starts at i + 1, so it runs ${n - 1} times for i = 0, then ${n - 2}, then ${n - 3}, … down to 0. Add up that staircase.`,
          `${n - 1} + ${n - 2} + … + 1 = ${n} × ${n - 1} ÷ 2 = **${pairs}**.`,
        ],
        explanation:
          `The body runs once for every pair i < j, and there are ${n} × ${n - 1} ÷ 2 = **${pairs}** such pairs. The staircase sum (${n - 1}) + (${n - 2}) + … + 1 collapses to that formula because the terms pair up: first + last = ${n - 1} + 1, second + second-last = ${n - 2} + 2, and so on.`,
      },
      {
        prompt: `Now the input doubles: n = ${n2}. What is \`count\` at the end?`,
        answer: numeric(pairs2),
        hints: [
          'Same code, same reasoning — only the number changed.',
          `Use the pair formula again with the new size: ${n2} × ${n2 - 1} ÷ 2.`,
          `${n2} × ${n2 - 1} ÷ 2 = **${pairs2}**.`,
        ],
        explanation:
          `${n2} × ${n2 - 1} ÷ 2 = **${pairs2}**. Set the two results side by side: ${pairs} became ${pairs2}, which is ${Math.round((pairs2 / pairs) * 100) / 100} times bigger — not 2 times, even though the input only doubled.`,
      },
      {
        prompt: 'In general, when the input to this code doubles, what happens to the amount of work?',
        answer: growth,
        hints: [
          `You just measured it: ${pairs} grew to ${pairs2}.`,
          `Divide the two counts — ${pairs2} ÷ ${pairs} — and compare the ratio with 2 and with 4.`,
          'Doubling n doubles BOTH loops, and the two factors multiply.',
        ],
        explanation:
          `**It roughly quadruples** — ${pairs2} ÷ ${pairs} ≈ ${Math.round((pairs2 / pairs) * 10) / 10}. Doubling n doubles the outer loop's range and the inner loop's average range, and the two doublings multiply: 2 × 2 = 4. That is the signature of n² growth, and the \`i + 1\` start does not change it — it halves the count (every pair once instead of twice) without changing its shape. Halving a quadratic still leaves a quadratic, which is why "half as much work" and "scales better" are different claims.`,
      },
    ]
    return {
      title: 'The cost of every pair',
      prompt:
        `This code compares every item in a list with every LATER item:\n\n\`\`\`js\nlet count = 0\nfor (let i = 0; i < n; i++) {\n  for (let j = i + 1; j < n; j++) {\n    count = count + 1\n  }\n}\n\`\`\`\n\nStart with **n = ${n}**.`,
      parts,
      hints: [
        'Do not trace iteration by iteration — count structurally.',
        'Ask what the body runs once FOR: every pair i < j. Counting the pairs replaces tracing the loops.',
        'Then compare the count at two sizes; the ratio, not either number alone, is what tells you how the code scales.',
      ],
      explanation:
        `The body runs once per unordered pair, so the count is n(n−1)/2: **${pairs}** at n = ${n}, **${pairs2}** at n = ${n2}. The ratio near 4 for a doubled input is the fingerprint of quadratic growth, and it is why all-pairs code that feels instant in a test can stall on real data — multiply the input by ten and the work multiplies by about a hundred. Counting what the body runs FOR, rather than simulating, is the move that scales to code too big to trace.`,
    }
  },
)

/* ==================================================================
 * INSIGHT — three ways in, one way up. Defence-only throughout: these teach
 * asking over guessing, reading demands for the need underneath, letting a
 * benign explanation win when the scene supplies one, and RECOGNISING
 * pressure in repair — never applying it.
 * ================================================================== */

const ASK_SCENES = [
  'Your closest friend has been unusually quiet at lunch all week',
  'A teammate skipped practice yesterday without a word to anyone',
  'Your sibling has kept their door shut every evening this week',
  'A friend who normally fills the group chat has gone silent for two days',
  'Your lab partner sighed through the whole session today',
  'A friend left game night early without saying goodbye',
  'A classmate who always sat at your table has moved seats this week',
  'Your cousin was short-tempered on the call yesterday',
] as const

const askFloor = tpl(
  {
    id: 'rng-h-ask-first',
    name: 'Ask, or decode?',
    skillIds: ['h-asking'],
    bucket: 'insight',
    difficulty: 1,
    variants: ASK_SCENES.length,
    minutes: 1.5,
    provenance: PROV_RUNGS,
  },
  (rng, seed) => {
    const scene = cycle(seed, ASK_SCENES)
    const decoyPool: Noted[] = [
      ['Watch them closely for the rest of the week', 'guessing from a distance invents stories, and quiet monitoring is not a kindness', 'inference'],
      ['Ask their other friends what they think it is', 'second-hand guesses add noise and quietly spread the question around', 'strategy'],
      ['Wait and act normal until they explain it', 'sometimes kind — but it hands the whole job to time and luck', 'strategy'],
      ['Reread their old messages for hidden clues', 'old texts become a mirror for your worry, not a window into them', 'inference'],
      ['Guess the reason from how they seemed today', 'one day of behaviour fits too many different stories to pick one', 'inference'],
    ]
    const pick = mcqNoted(rng, 'Ask them directly, somewhere private', window(seed, decoyPool, 3))
    return {
      title: 'Ask, or decode?',
      prompt: `${scene}. You would like to know what is going on.\n\nWhat is the best first move?`,
      answer: pick.answer,
      distractorNotes: pick.distractorNotes,
      distractorTags: pick.distractorTags,
      hints: [
        'Every option except one involves guessing on their behalf.',
        'The move is to trade decoding for asking: one open question, asked kindly and in private.',
        'Something like "you seem quieter this week — everything OK?" gives them the chance to tell you, or not to.',
      ],
      explanation:
        `**Ask them directly, somewhere private.** Reading minds from clues fails quietly: the same quiet week fits tiredness, family stuff, a problem with you, or nothing at all, and whichever story you pick, you will start acting as if it were true. A direct, private question respects both of you — and if the answer is "all good, honestly", take it at face value the first time. Asking once is care; monitoring someone who has told you they are fine is where care tips into something else.`,
    }
  },
)

interface InterestCase {
  scene: string
  who: string
  key: string
  decoys: [string, string, string]
}

const INTEREST_CASES: InterestCase[] = [
  {
    scene: 'On every car trip your brother insists on the window seat. Last month he was carsick twice in the middle seat.',
    who: 'your brother',
    key: 'To avoid feeling sick on the drive',
    decoys: ['To win the argument one more time', 'To make you sit in the middle seat', 'To watch the scenery going past'],
  },
  {
    scene: '"No revision after dinner," your friend declares before exam week. She has morning training every day at six.',
    who: 'your friend',
    key: 'To protect her sleep before training',
    decoys: ['To show everyone she never worries', 'To copy what the top students all do', 'To spend every evening on her phone'],
  },
  {
    scene: 'Your teammate demands to take the last penalty in the shoot-out. He missed the final penalty last season in front of everyone.',
    who: 'your teammate',
    key: 'To make up for last season\'s miss',
    decoys: ['To be the one the crowd remembers', 'To prove the coach picked him right', 'To claim the glory if the team wins'],
  },
  {
    scene: 'Grandpa refuses the new phone you offer and keeps his old one with the cracked screen. Every photo of Grandma lives on that phone.',
    who: 'Grandpa',
    key: 'To keep the photos he fears losing',
    decoys: ['To avoid learning yet another gadget', 'To save the family a little money', 'To prove old things still work fine'],
  },
  {
    scene: '"I am not going to the pool party," your cousin says flatly. She mentioned last week that she never learned to swim.',
    who: 'your cousin',
    key: 'To avoid being seen unable to swim',
    decoys: ['To make everyone beg her to come', 'To protest about the chosen weekend', 'To stay home with a book instead'],
  },
  {
    scene: 'Your lab partner insists on writing up the experiment alone this time. Last time, the shared write-up was marked down for being a mess.',
    who: 'your lab partner',
    key: 'To protect the grade from another mess',
    decoys: ['To take all of the credit this time', 'To avoid having to talk to anybody', 'To finish faster by skipping checks'],
  },
  {
    scene: 'Dad wants everyone home by six on Sunday, no exceptions. It is the only evening this week the whole family can eat together.',
    who: 'Dad',
    key: 'To get one real family meal this week',
    decoys: ['To keep control of everyone\'s plans', 'To stop Sunday homework being rushed', 'To start the school week early and calm'],
  },
  {
    scene: 'Your little sister begs to bring her torn old blanket on the trip, though you bought her a lovely new one. She has slept with it since she was two.',
    who: 'your sister',
    key: 'To keep the comfort she sleeps with',
    decoys: ['To annoy you for buying the wrong gift', 'To pack as many soft things as she can', 'To prove she decides what gets packed'],
  },
]

const interestFloor = tpl(
  {
    id: 'rng-h-want-under-ask',
    name: 'The want under the demand',
    skillIds: ['h-interests'],
    bucket: 'insight',
    difficulty: 1,
    variants: INTEREST_CASES.length,
    minutes: 1.5,
    provenance: PROV_RUNGS,
  },
  (rng, seed) => {
    const c = cycle(seed, INTEREST_CASES)
    return {
      title: 'The want under the demand',
      prompt: `${c.scene}\n\nThe demand is the surface. Given the clue in the scene, what is ${c.who} most likely actually after?`,
      answer: mcq(rng, c.key, [...c.decoys]),
      hints: [
        'The scene contains one detail that explains the demand — find it.',
        'Split the two layers: the POSITION is what they insist on; the INTEREST is the need underneath it.',
        `The clue points one way: **${c.key.charAt(0).toLowerCase() + c.key.slice(1)}** is the need the demand protects.`,
      ],
      explanation:
        `**${c.key}.** The demand names one solution; the clue in the scene names the need it serves. The pay-off of splitting them: a position allows exactly one outcome, while an interest usually has several — once you see WHY, you can often meet the need a different way and the standoff dissolves. One honesty note: the clue makes this a strong inference, not a certainty, so the finished move is still to check ("is it the carsickness?") rather than to act on the guess.`,
    }
  },
)

interface ReadingCase {
  scene: string
  key: string
  decoys: [string, string, string]
  note: string
}

/**
 * Discernment both ways: five scenes where the benign reading is right
 * (the ordinary explanation is IN the scene), three where a sharp unexplained
 * change makes "worth a gentle ask" the honest call — and in those, the
 * benign option is still offered and still wrong.
 */
const READING_CASES: ReadingCase[] = [
  {
    scene: 'Maya answers your long message with just "ok". Ten minutes earlier she texted that her phone was on 2% battery.',
    key: 'Nothing is wrong — her phone was about to die',
    decoys: ['She is upset and waiting for you to notice', 'Short replies are her way of raising a problem', 'She wants the conversation over for good'],
    note: 'The scene hands you the ordinary cause: a dying phone produces exactly this reply.',
  },
  {
    scene: 'Dev leaves your birthday party an hour early. When he arrived he mentioned his shift starts at six tomorrow morning.',
    key: 'Nothing is wrong — he told you he works early',
    decoys: ['He found the party too boring to stay on', 'He is quietly cross with somebody who came', 'He only came because he felt he had to'],
    note: 'He announced the reason on arrival; leaving early confirms his plan, not a problem.',
  },
  {
    scene: 'Sam usually sends three messages a minute. Today he answered "fine." and then left your two calls unanswered all evening.',
    key: 'Something may be up — worth a gentle ask soon',
    decoys: ['Nothing is wrong — everyone types less some days', 'He is punishing you and wants you to know it', 'His phone must have run out of battery again'],
    note: 'A sharp break from HIS normal, with no stated cause, is worth one kind question — not a verdict.',
  },
  {
    scene: 'Priya yawns twice while you explain your project. She mentioned on the way in that her baby brother kept the house awake all night.',
    key: 'Nothing is wrong — she is just short of sleep',
    decoys: ['She finds your project dull but is polite', 'She wishes you would ask about her week', 'She is hinting the meeting should end now'],
    note: 'A stated sleepless night explains a yawn better than any story about your project does.',
  },
  {
    scene: 'Jon jokes about everything, but today he snapped at two people over tiny things and apologised to neither — that has never happened before.',
    key: 'Something may be up — a change this sharp matters',
    decoys: ['Nothing is wrong — everyone has an off morning', 'He has decided the group is beneath him now', 'He is copying how the older students behave'],
    note: 'One grumpy morning is ordinary; a first-ever double snap with no repair is a real change worth a private question.',
  },
  {
    scene: 'Ana passes you in the corridor without a wave. She is walking fast, reading a sheet of paper, and the bell rings in one minute.',
    key: 'Nothing is wrong — she is rushing and absorbed',
    decoys: ['She saw you and blanked you on purpose', 'She is annoyed about something from before', 'She wants you to chase after her and ask'],
    note: 'Absorbed and late explains a missed wave completely; being seen is what the story-versions all quietly assume.',
  },
  {
    scene: 'Leo declines your game invite for the third night running. His exam timetable, pinned in the group chat, shows papers all this week.',
    key: 'Nothing is wrong — his exams run all week',
    decoys: ['He has found a group he prefers playing with', 'He is waiting for a better invitation to come', 'Three refusals in a row always mean a grudge'],
    note: 'The timetable is public and sufficient; "three refusals = grudge" is a rule of thumb doing your worrying for you.',
  },
  {
    scene: 'Noor talks nonstop about the art club she started, but this week she changed the subject twice when it came up and stared at the table.',
    key: 'Something may be up — worth a private, kind ask',
    decoys: ['Nothing is wrong — clubs get boring eventually', 'She wants the club to seem more exclusive', 'She is dropping hints that you should join'],
    note: 'Avoiding her own favourite subject is a marked change with no stated cause — the honest reading is a question, not a conclusion.',
  },
]

const readingFloor = tpl(
  {
    id: 'rng-h-nothing-to-fix',
    name: 'Is anything actually wrong?',
    skillIds: ['h-emotion'],
    bucket: 'insight',
    difficulty: 1,
    variants: READING_CASES.length,
    minutes: 1.5,
    provenance: `${PROV_RUNGS}; five of eight variants have the benign reading as the key and three have "worth a gentle ask", so neither blanket suspicion nor blanket reassurance can score.`,
  },
  (rng, seed) => {
    const c = cycle(seed, READING_CASES)
    return {
      title: 'Is anything actually wrong?',
      prompt: `${c.scene}\n\nWhat is the most reasonable reading?`,
      answer: mcq(rng, c.key, [...c.decoys]),
      hints: [
        'Check the scene itself for an ordinary explanation before you build a story.',
        'Weigh two things: is a mundane cause stated right there, and how far is this from THEIR normal?',
        c.note,
      ],
      explanation:
        `**${c.key}.** ${c.note}\n\nThe habit: a stated ordinary cause beats an invented story, and a sharp unexplained change from someone's own normal earns exactly one thing — a kind, private question. Neither "everything is a sign" nor "nothing ever is" survives contact with real people, which is why both kinds of answer are right somewhere in this family.`,
    }
  },
)

interface RepairCase {
  scene: string
  reply: string
  p1key: string
  p1decoys: [string, string, string]
  p1note: string
}

const REPAIR_CASES: RepairCase[] = [
  {
    scene: 'You snapped at a close friend in front of others, and apologised properly an hour later — specific, no excuses.',
    reply: '"Whatever," she says, and walks off.',
    p1key: 'She is not ready to talk about it yet',
    p1decoys: ['The apology has made everything worse', 'She is holding out for a public apology', 'The friendship is effectively over now'],
    p1note: 'A cold word an hour after a public sting measures the sting, not your apology.',
  },
  {
    scene: 'You forgot your friend\'s big audition and apologised the same evening, plainly and without excuses.',
    reply: '"It\'s fine," he says, in a flat voice, and changes the subject.',
    p1key: 'He says fine but likely needs more time',
    p1decoys: ['He has genuinely forgotten it already', 'He wants you to raise it again at once', 'He is testing how often you will apologise'],
    p1note: 'A flat "fine" plus a changed subject usually means "not now" — neither disaster nor closure.',
  },
  {
    scene: 'You shared something a friend told you privately, and apologised as soon as you realised — no minimising.',
    reply: '"I just need some space right now," she says.',
    p1key: 'She means it — space is part of the repair',
    p1decoys: ['She is inviting you to argue your case now', 'She expects you to follow and keep trying', 'She wants someone else to referee it later'],
    p1note: 'A stated need is the one thing in the scene you can take at face value.',
  },
  {
    scene: 'You made a joke at a friend\'s expense that landed badly, and apologised for it directly the next morning.',
    reply: 'He laughs it off — "forget it, seriously" — but he has been quieter with you since.',
    p1key: 'The laugh papered over a hurt still there',
    p1decoys: ['The joke proves the matter is fully closed', 'He is angling for a favour in exchange', 'He wants the whole group to weigh in first'],
    p1note: 'Words say closed; the quietness since says mending. Behaviour over time outweighs one laugh.',
  },
  {
    scene: 'You cancelled on a friend at the last minute for the second time this term, and apologised honestly for it.',
    reply: '"You always do this," she says, arms folded.',
    p1key: 'The hurt is bigger than this one incident',
    p1decoys: ['She is exaggerating to win the argument', 'She wants a bigger scene before moving on', 'The word "always" makes her claim untrue'],
    p1note: '"Always" is rarely literal and usually accurate about a pattern — answer the pattern, not the word.',
  },
  {
    scene: 'You took credit in class for an idea that was mostly your friend\'s, and owned it to him fully that afternoon.',
    reply: 'He accepts — "we\'re good" — but sits somewhere else at lunch the next two days.',
    p1key: 'Accepted in words, still mending in practice',
    p1decoys: ['The seat change proves he lied about it', 'He now expects daily proof you meant it', 'Lunch seats are a code you must decode'],
    p1note: 'Acceptance and full warmth are two different milestones, and the gap between them is normal.',
  },
]

const PRESSURE_LINES = [
  '"So are we good now? I need to hear a yes."',
  '"I said sorry — you cannot stay mad at me."',
  '"If you were my friend you would let this go."',
] as const

const OPEN_LINES = [
  '"That was unfair of me, and I get why it stung."',
  '"Take whatever time you need — no rush at all."',
  '"I will be around whenever you want to talk."',
  '"You do not have to answer anything right now."',
] as const

const repairStretch = tpl(
  {
    id: 'rng-h-after-sorry',
    name: 'After the apology',
    skillIds: ['h-repair'],
    bucket: 'insight',
    difficulty: 5,
    variants: REPAIR_CASES.length,
    minutes: 4,
    kind: 'multi',
    provenance: PROV_RUNGS,
  },
  (rng, seed) => {
    const c = cycle(seed, REPAIR_CASES)
    const p1 = mcq(rng, c.p1key, [...c.p1decoys])
    const movePool: Noted[] = [
      ['Repeat the apology until it finally lands', 'a repeated apology stops being an offer and starts demanding a response', 'strategy'],
      ['Point out that you already said sorry once', 'keeping score converts repair into a debt they now owe you', 'strategy'],
      ['Ask a friend to talk them around for you', 'recruiting others makes a private hurt public and adds social pressure', 'strategy'],
      ['Match their coolness until they come back', 'mirroring coldness restarts the original fight in slow motion', 'strategy'],
      ['Keep checking whether they forgive you yet', 'each check makes them manage YOUR feelings, which is the wrong way round', 'strategy'],
      ['Explain the ways it was partly their fault', 'a late "but" retracts the apology it follows', 'concept'],
    ]
    const p2 = mcqNoted(rng, 'Give it time, and stay friendly as normal', window(seed, movePool, 3))
    const pressure = PRESSURE_LINES[seed % PRESSURE_LINES.length]
    const p3 = mcq(rng, pressure, window(seed, OPEN_LINES, 3))
    const parts: ItemPart[] = [
      {
        prompt: `What is the most reasonable reading of that reply?`,
        answer: p1,
        hints: [
          'Read the reply as information about TIMING, not a final verdict on you.',
          'Strike out every option that assigns a motive the scene cannot support — most of them invent one.',
          c.p1note,
        ],
        explanation:
          `**${c.p1key}.** ${c.p1note} The wrong options share one shape: each spins a story about motive — revenge, theatre, manipulation — from a single moment that does not contain it. Right after a hurt, the least dramatic reading is usually the honest one: not yet.`,
      },
      {
        prompt: 'You have apologised once, properly. What is the best move now?',
        answer: p2.answer,
        hints: [
          'Your half of the repair is done; ask what the other half needs from you.',
          'The move is steadiness: no pressure, no scorekeeping — behave like the friend you are claiming to be.',
          'Time plus ordinary friendliness lets them come back without a toll booth at the door.',
        ],
        explanation:
          `**Give it time, and stay friendly as normal.** A real apology is an offer, and offers do not chase. Every other move applies pressure somewhere: repetition demands a reply, scorekeeping creates a debt, recruiting friends makes it public, mirrored coldness reopens the fight, forgiveness-checking puts them on your schedule. Steady ordinary warmth is not doing nothing — it is the visible evidence that the apology was true.`,
      },
      {
        prompt: 'Days later you want to say one more thing. Three of these lines leave the door open. Which one turns the repair into PRESSURE?',
        answer: p3,
        hints: [
          'Check what each line asks of the other person, right now.',
          'Sort them by direction: open lines GIVE something (time, room, understanding); a pressure line DEMANDS something on your schedule.',
          `The line ${pressure} requires an answer from them, now — that requirement is the pressure.`,
        ],
        explanation:
          `**${pressure}** demands a verdict on your timetable — a yes now, an end to their feelings now, or their friendship as the price of dropping it. The other three hand something over and ask nothing back. It matters to recognise the pressure shape from the inside, because after an apology it FEELS like seeking reassurance — and to recognise it from the outside, because a demand dressed as an apology is not an apology.`,
      },
    ]
    return {
      title: 'After the apology',
      prompt: `${c.scene}\n\n${c.reply}`,
      parts,
      distractorNotes: p2.distractorNotes,
      distractorTags: p2.distractorTags,
      hints: [
        'An apology starts a repair; it does not complete one.',
        'Split the repair into halves: yours (said plainly, no "but", changed behaviour) and theirs (when to re-open) — then keep entirely to your half.',
        'Read their reply as timing rather than verdict, keep the pressure off, and let steadiness do the talking.',
      ],
      explanation:
        `The hard part of repair is not the apology — it is the gap after, when nothing seems to happen. Their reply here is timing information, not a verdict; your remaining job is consistency without pressure; and the line between checking in and leaning on someone is whether your words hand something over or demand something back. None of this guarantees the friendship resumes on your schedule. That is the honest price of having caused the hurt, and pressing to skip it is how repairs fail twice.`,
    }
  },
)

/* ==================================================================
 * PUZZLE — six graded families for the four METHOD skills, none of which
 * needs a custom player. Reachability and minimum-move claims are decided by
 * breadth-first search; the glove worst case by enumerating every adversary
 * strategy; the backwards sequence ships only when exactly one menu rule
 * fits the shown terms.
 * ================================================================== */

const lampFloor = tpl(
  {
    id: 'rng-zi-lamp-parity',
    name: 'On or off?',
    skillIds: ['z-invariant'],
    bucket: 'puzzle',
    difficulty: 1,
    variants: 16,
    minutes: 1.5,
    provenance: PROV_RUNGS,
  },
  (rng, seed) => {
    const a = 3 + (seed % 4)
    const b = 2 + (Math.floor(seed / 4) % 4)
    const total = a + b
    const on = total % 2 === 1
    const key = on ? 'On' : 'Off'
    return {
      title: 'On or off?',
      prompt: `A lamp starts **off**. During the day its switch is flipped **${a} times** before lunch and **${b} more times** after lunch.\n\nIs the lamp on or off at the end of the day?`,
      answer: mcq(rng, key, [on ? 'Off' : 'On', 'It depends on the timing of the flips']),
      hints: [
        'Try two flips in a row: where does the lamp end up?',
        'Pairs of flips cancel out, so only one thing matters — whether the TOTAL count of flips is odd or even.',
        `${a} + ${b} = ${total} flips, which is ${on ? 'odd: one flip is left over after the pairs cancel, so the lamp is **on**' : 'even: the flips cancel in pairs, so the lamp is **off**'}.`,
      ],
      explanation:
        `**${key}.** Every two flips undo each other, so the lamp's final state ignores everything about WHEN the flips happened and keeps exactly one bit: whether the total, ${total}, is odd or even. ${on ? 'Odd leaves one flip unpaired — on.' : 'Even pairs everything off again.'}\n\nThis is the smallest possible invariant argument: find the one thing the moves cannot scramble, and the question answers itself without replaying a single flip. The bigger puzzles in this bucket are this idea wearing heavier clothes.`,
    }
  },
)

/**
 * Exact reachability and distances for the cup-flipping puzzle: from n cups
 * up, each move flips exactly k cups. States collapse to the up-count, and a
 * breadth-first search over 0..n decides everything — the parity argument is
 * what the explanation teaches, never what the key relies on.
 */
export function cupDistances(n: number, k: number): number[] {
  const dist = new Array<number>(n + 1).fill(-1)
  dist[n] = 0
  const queue = [n]
  while (queue.length) {
    const u = queue.shift()!
    for (let j = Math.max(0, k - (n - u)); j <= Math.min(k, u); j++) {
      const v = u - j + (k - j)
      if (dist[v] !== -1) continue
      dist[v] = dist[u] + 1
      queue.push(v)
    }
  }
  return dist
}

/** All rows keep n ≥ 2k, so every parity-allowed change really is achievable. */
const CUP_ROWS: readonly [n: number, k: number][] = [
  [5, 2],
  [6, 2],
  [7, 2],
  [8, 2],
  [6, 3],
  [7, 3],
  [8, 3],
  [8, 4],
]

const cupInvariant = tpl(
  {
    id: 'rng-zi-flip-cups',
    name: 'All cups down',
    skillIds: ['z-invariant'],
    bucket: 'puzzle',
    difficulty: 4,
    variants: CUP_ROWS.length,
    minutes: 4,
    kind: 'multi',
    provenance: `${PROV_RUNGS}; reachability and the minimum move count come from a breadth-first search over up-counts (cupDistances), so no parity claim is ever asserted without the search backing it.`,
  },
  (rng, seed) => {
    const [n, k] = cycle(seed, CUP_ROWS)
    const dist = cupDistances(n, k)
    const reachable = dist[0] !== -1
    const best = dist[0]
    const floor = Math.ceil(n / k)
    let minUp = n
    for (let u = 0; u <= n; u++) {
      if (dist[u] !== -1) {
        minUp = u
        break
      }
    }
    const claim = (d: number) => `Move the up-count by exactly ${d}`
    const stayClaim = 'Leave the up-count where it was'
    const changeDecoys = [claim(k)]
    if (k - 2 > 0) changeDecoys.push(claim(k - 2))
    if (k % 2 === 0) changeDecoys.push(stayClaim)
    const yesKey = 'Yes — some sequence of moves manages it'
    const noKey = 'No — the up-count is stuck on one odd-or-even kind'
    const reachKey = reachable ? yesKey : noKey
    const reach = mcq(rng, reachKey, [
      reachable ? noKey : yesKey,
      'Only if you never flip the same cup twice',
      'It depends on the order you pick the cups in',
    ])
    const parts: ItemPart[] = [
      {
        prompt: `One move flips exactly ${k} cups. Which of these can a single move NEVER do, from any position?`,
        answer: mcq(rng, claim(k - 1), changeDecoys),
        hints: [
          `Say a move flips j cups that were up (and therefore ${k} − j that were down).`,
          `Write the change as one expression: the up-count moves by ${k} − 2j — down j, up ${k} − j.`,
          `Whatever j is, ${k} − 2j is always ${k % 2 === 0 ? 'even' : 'odd'}, so a change of ${k - 1} is impossible.`,
        ],
        explanation:
          `Flipping j up-cups and ${k} − j down-cups changes the up-count by ${k} − 2j. As j runs over its options, that change takes only values with the same odd-or-even kind as ${k} itself — so a change of exactly **${k - 1}** can never happen. This one line is the engine of the whole puzzle.`,
      },
      {
        prompt: `Can some sequence of moves reach ALL ${n} cups down?`,
        answer: reach,
        hints: [
          `You know every move changes the up-count by an amount of the same odd-or-even kind as ${k}.`,
          k % 2 === 0
            ? `With ${k} even, every change is even, so the up-count's odd-or-even status is frozen at the start.`
            : `With ${k} odd, the up-count's odd-or-even status flips every single move — nothing is frozen.`,
          reachable
            ? `Here a search of all up-counts confirms 0 is reachable from ${n}.`
            : `The up-count starts at ${n} (odd) and 0 is even — the frozen status rules it out.`,
        ],
        explanation: reachable
          ? `**Yes.** ${k % 2 === 0 ? `Every change is even and ${n} is even, so no parity wall stands in the way — ` : `With ${k} odd there is no frozen status to block anything — `}and searching every reachable up-count confirms 0 is reached. Note the division of labour: the invariant could only ever say NO; the search is what says yes.`
          : `**No.** Every move changes the up-count by an even amount, so it stays odd forever — and 0 is even. No cleverness with orders or choices touches this: the argument kills every possible sequence at once, which is exactly what an invariant is for.`,
      },
      reachable
        ? {
            prompt: 'What is the smallest number of moves that gets every cup down?',
            answer: numeric(best),
            hints: [
              `Each move turns at most ${k} up-cups down, and ${n} cups must come down.`,
              `That gives a floor of ${floor} moves. Now ask whether some plan actually achieves the floor${best > floor ? ' — here it cannot' : ''}.`,
              best > floor
                ? `Every cup must flip an odd number of times, so the total flip count is even — but ${floor} moves make only ${floor * k} flips, an odd total. It takes **${best}**.`
                : `A plan that downs ${k} fresh cups per move as long as it can reaches it: **${best}**.`,
            ],
            explanation:
              best > floor
                ? `**${best}.** The simple floor is ${floor} (each move downs at most ${k} cups), but it is unreachable: each of the ${n} cups needs an odd number of flips, so the grand total of flips is a sum of ${n} odd numbers — an even number — while ${floor} moves supply exactly ${floor} × ${k} = ${floor * k} flips, which is odd. The move count must rise until the totals can agree, and the search confirms ${best} suffices. Two different invariant-style counts, one answer.`
                : `**${best}.** The floor argument (${n} cups down, at most ${k} per move, so at least ${floor} moves) is matched by an actual plan, confirmed by the search. When a bound and a construction meet, the answer is exact — that pairing is the standard finish for this kind of puzzle.`,
          }
        : {
            prompt: 'Since all-down is impossible: what is the smallest number of UP cups you can ever reach?',
            answer: numeric(minUp),
            hints: [
              `The up-count starts at ${n} and every move changes it by an even amount.`,
              `So the up-count keeps its odd-or-even kind forever — list the smallest values of that kind.`,
              `The smallest ${n % 2 === 1 ? 'odd' : 'even'} count the search actually reaches is **${minUp}**.`,
            ],
            explanation:
              `**${minUp}.** The up-count is trapped on ${n % 2 === 1 ? 'odd' : 'even'} values, and the search over all reachable up-counts confirms ${minUp} is attained. An invariant does two jobs at once here: it forbids 0, and it tells you exactly what the best possible outcome looks like instead.`,
          },
    ]
    return {
      title: 'All cups down',
      prompt:
        `**${n} cups** stand upside-up on a table. A move flips **exactly ${k} cups** of your choice (each chosen cup turns over: up becomes down, down becomes up). You may make as many moves as you like.\n\nGoal: every cup facing down.`,
      parts,
      hints: [
        'Do not chase sequences of moves — ask what one move does to a single COUNT.',
        'Track the number of up-cups: flipping j up-cups and the rest down-cups changes it by k − 2j.',
        'That change always has the same odd-or-even kind as k, and comparing that with the start and the goal settles everything.',
      ],
      explanation:
        `Everything reduces to one number, the up-count, and one fact: a move changes it by ${k} − 2j, which always shares its odd-or-even kind with ${k}. ${reachable ? 'No parity wall blocks the goal here, and a search over up-counts finds the shortest route.' : 'That freezes the up-count on odd values, and the goal is even — impossible, with no sequence worth trying.'} The habit to keep: invariants prove impossibility for free, but only a search or a construction ever proves possibility. The jar-of-stones and domino puzzles in this bucket run on the same two-stroke engine.`,
    }
  },
)

const firstCutFloor = tpl(
  {
    id: 'rng-zs-first-cut',
    name: 'One question, two piles',
    skillIds: ['z-search'],
    bucket: 'puzzle',
    difficulty: 1,
    variants: 8,
    minutes: 1.5,
    provenance: PROV_RUNGS,
  },
  (_rng, seed) => {
    const N = [16, 20, 24, 30, 40, 50, 60, 80][seed % 8]
    const half = N / 2
    return {
      title: 'One question, two piles',
      prompt: `A friend has picked a whole number from **1 to ${N}**. You ask one honest yes/no question: **"Is it bigger than ${half}?"**\n\nWhichever answer you get, how many numbers are still possible?`,
      answer: numeric(half),
      hints: [
        'Count the two piles separately: the numbers a "no" leaves, and the numbers a "yes" leaves.',
        `The question splits 1 to ${N} into two piles — 1 to ${half}, and ${half + 1} to ${N} — and the answer only tells you which pile you are in.`,
        `Both piles hold ${half} numbers, so either way **${half}** remain.`,
      ],
      explanation:
        `**${half}.** A "no" leaves the numbers 1 to ${half}; a "yes" leaves ${half + 1} to ${N}. The piles are the same size, so the question guarantees the possibilities are cut in half no matter how it is answered.\n\nThat is the right way to judge any question in a search: not by what it might luckily reveal, but by how many possibilities SURVIVE each of its answers. A question with one huge pile and one tiny pile is a gamble; equal piles are a guarantee.`,
    }
  },
)

const lockSpace = tpl(
  {
    id: 'rng-zs-size-the-space',
    name: 'How big is the haystack?',
    skillIds: ['z-search'],
    bucket: 'puzzle',
    difficulty: 4,
    variants: 12,
    minutes: 3.5,
    kind: 'multi',
    provenance: `${PROV_RUNGS}; all three counts follow from the multiplication principle on the drawn parameters, and each part's count divides the previous one's.`,
  },
  (_rng, seed) => {
    const L = [3, 4][seed % 2]
    const A = [5, 6][Math.floor(seed / 2) % 2]
    const t = Math.floor(seed / 4) % 3
    const total = A ** L
    const perm = (start: number) => {
      let out = 1
      for (let i = 0; i < L; i++) out *= start - i
      return out
    }
    const noRepeat = perm(A)
    const firstChoices = t === 0 ? Math.floor(A / 2) : t === 1 ? Math.ceil(A / 2) : 2
    const clueText =
      t === 0 ? 'the first symbol is even' : t === 1 ? 'the first symbol is odd' : `the first symbol is ${A - 1} or ${A}`
    const rest = (() => {
      let out = 1
      for (let i = 1; i < L; i++) out *= A - i
      return out
    })()
    const withClue = firstChoices * rest
    const parts: ItemPart[] = [
      {
        prompt: 'Before remembering anything: how many codes are possible in total?',
        answer: numeric(total),
        hints: [
          'Count choices dial by dial, not code by code.',
          `Each of the ${L} dials offers ${A} symbols independently, so multiply the choices: ${Array.from({ length: L }, () => A).join(' × ')}.`,
          `${A}^${L} = **${total}**.`,
        ],
        explanation:
          `${Array.from({ length: L }, () => A).join(' × ')} = **${total}**. Multiplying the per-dial choices counts every code exactly once — the multiplication principle is the tape measure for search spaces, and measuring the haystack is worth doing before planning any search of it.`,
      },
      {
        prompt: 'You remember: no symbol appears twice in the code. How many codes survive?',
        answer: numeric(noRepeat),
        hints: [
          'Multiply dial by dial again, but let each choice shrink what is left.',
          `First dial: ${A} choices. Second: ${A - 1}, since one symbol is used up. Keep going for all ${L} dials.`,
          `${Array.from({ length: L }, (_, i) => A - i).join(' × ')} = **${noRepeat}**.`,
        ],
        explanation:
          `${Array.from({ length: L }, (_, i) => A - i).join(' × ')} = **${noRepeat}**. One remembered fact deleted ${total - noRepeat} candidates — ${Math.round((100 * (total - noRepeat)) / total)}% of the haystack — before you touched the lock once. Facts about the code are worth more than speed at trying codes.`,
      },
      {
        prompt: `You also remember: ${clueText}. Now how many codes are left to try, at worst?`,
        answer: numeric(withClue),
        hints: [
          'The new fact only constrains the FIRST dial; the no-repeat rule still runs the rest.',
          `First dial: ${firstChoices} choices now. The remaining dials still go ${Array.from({ length: L - 1 }, (_, i) => A - 1 - i).join(', then ')}.`,
          `${firstChoices} × ${Array.from({ length: L - 1 }, (_, i) => A - 1 - i).join(' × ')} = **${withClue}**.`,
        ],
        explanation:
          `${firstChoices} × ${Array.from({ length: L - 1 }, (_, i) => A - 1 - i).join(' × ')} = **${withClue}**. From ${total} candidates down to ${withClue} using two remembered facts and zero attempts at the lock. At one try every few seconds, that is the difference between hopeless and a lunch break — and it is why a searcher's first job is shrinking the space, not opening the first drawer faster.`,
      },
    ]
    return {
      title: 'How big is the haystack?',
      prompt:
        `A padlock code has **${L} symbols**, each chosen from **1 to ${A}** (repeats allowed unless you know otherwise). You have forgotten the code, but facts about it will come back to you.\n\nYou want to know, at each stage, how many candidates a brute-force search would face.`,
      parts,
      hints: [
        'Never count codes one by one — count CHOICES, dial by dial.',
        'Multiply the number of options for each dial; when a fact constrains a dial, change that dial\'s factor and multiply again.',
        'Watch the count fall as each fact lands: the ratio of before to after is what the fact was worth.',
      ],
      explanation:
        `Three multiplications tell the whole story: ${total} codes exist, "no repeats" cuts the space to ${noRepeat}, and one fact about the first dial cuts it to ${withClue}. Sizing the space is the unglamorous half of every search method in this bucket: pruning, clue ordering and halving are all just ways of making this number collapse quickly — and you cannot tell whether a search is even worth starting until you have measured what it faces.`,
    }
  },
)

/**
 * Worst case for the glove drawer, by enumerating every adversary strategy.
 * Taking any left AND any right of one colour completes a pair, so a
 * pair-avoiding run takes only one side per colour; the enumeration tries
 * every side assignment and keeps the largest haul.
 */
export function gloveWorstCase(lefts: number[], rights: number[]): number {
  const c = lefts.length
  let worst = 0
  for (let mask = 0; mask < 1 << c; mask++) {
    let take = 0
    for (let i = 0; i < c; i++) take += mask & (1 << i) ? lefts[i] : rights[i]
    worst = Math.max(worst, take)
  }
  return worst
}

const GLOVE_COLOURS = ['black', 'grey', 'blue'] as const

const GLOVE_ROWS_2: readonly [number, number, number, number][] = [
  [3, 2, 2, 4],
  [2, 4, 3, 2],
  [4, 3, 2, 5],
  [5, 2, 4, 3],
  [3, 5, 2, 2],
  [2, 3, 5, 4],
]

const GLOVE_ROWS_3: readonly [number, number, number, number, number, number][] = [
  [4, 2, 3, 3, 2, 4],
  [3, 3, 2, 4, 4, 2],
  [2, 5, 3, 2, 2, 3],
  [5, 2, 2, 3, 3, 4],
  [3, 2, 4, 4, 2, 5],
  [2, 4, 2, 5, 3, 2],
]

const gloveStretch = tpl(
  {
    id: 'rng-ze-glove-pairs',
    name: 'Gloves in the dark',
    skillIds: ['z-extremal'],
    bucket: 'puzzle',
    difficulty: 5,
    variants: 12,
    minutes: 4,
    kind: 'multi',
    provenance: `${PROV_RUNGS}; the worst pair-free run is found by enumerating every per-colour side choice (gloveWorstCase), never by quoting a formula.`,
  },
  (_rng, seed) => {
    const c = 2 + (seed % 2)
    const row = Math.floor(seed / 2) % 6
    const flat = c === 2 ? GLOVE_ROWS_2[row] : GLOVE_ROWS_3[row]
    const lefts: number[] = []
    const rights: number[] = []
    for (let i = 0; i < c; i++) {
      lefts.push(flat[2 * i])
      rights.push(flat[2 * i + 1])
    }
    const worst = gloveWorstCase(lefts, rights)
    const need = worst + 1
    const total = lefts.reduce((a, b) => a + b, 0) + rights.reduce((a, b) => a + b, 0)
    const sides = lefts.map((l, i) => `${l > rights[i] ? 'all ' + l + ' lefts' : 'all ' + rights[i] + ' rights'} of ${GLOVE_COLOURS[i]}`)
    const parts: ItemPart[] = [
      {
        prompt: 'What is the LONGEST run of picks that can still leave you without a usable pair?',
        answer: numeric(worst),
        hints: [
          'Build the unluckiest run on purpose. Ask: which gloves can pile up without ever completing a pair?',
          'Within one colour, lefts alone never pair, and rights alone never pair — so the worst run takes only ONE side of each colour, the bigger side.',
          `Bigger side per colour: ${sides.join('; ')} — together **${worst}** gloves.`,
        ],
        explanation:
          `**${worst}.** A pair needs a left AND a right of one colour, so a pair-free pile holds only one side of each colour — and the worst pile takes the bigger side every time: ${sides.join('; ')}. Checking every side-combination confirms nothing longer is possible. Note how much worse this is than "one of each colour": handedness lets bad luck run for ${worst} picks, not ${c}.`,
      },
      {
        prompt: 'How many picks GUARANTEE a usable pair, however unlucky you are?',
        answer: numeric(need),
        hints: [
          'You know the longest run that still fails.',
          'A guarantee is that failing run plus one: the next pick has nowhere unhelpful left to go.',
          `${worst} + 1 = **${need}**.`,
        ],
        explanation:
          `**${need}.** After ${worst} picks you might still be pairless — that exact run really can happen, so ${worst} is not enough. But pick number ${need} must land in a colour where you already hold the opposite side, completing a pair. Both halves matter: the run shows ${need} cannot be lowered, the plus-one shows it suffices. That is what makes the answer exact rather than an estimate.`,
      },
      {
        prompt: `Now suppose the drawer held ${total} SOCKS in the same ${c} colours instead — any two of one colour match. How many picks guarantee a matching pair?`,
        answer: numeric(c + 1),
        hints: [
          'Rebuild the unluckiest run under the new matching rule.',
          'With socks, two of one colour already match — so a pair-free pile holds at most ONE sock per colour.',
          `The failing run tops out at ${c}, so ${c} + 1 = **${c + 1}** picks guarantee a pair.`,
        ],
        explanation:
          `**${c + 1}.** The moment "any two of a colour match", a pair-free pile cannot hold two of anything, so it tops out at ${c} socks — one per colour — and the next pick must complete a pair. Same drawer, same colours, answers ${need} versus ${c + 1}: the guarantee lives in the MATCHING RULE, not in the counts. Worst-case questions are always answered by rebuilding the longest failing run under the exact rules you were given.`,
      },
    ]
    return {
      title: 'Gloves in the dark',
      prompt:
        `A drawer holds gloves in ${c} colours, all jumbled:\n\n` +
        lefts.map((l, i) => `- **${GLOVE_COLOURS[i]}**: ${l} left-hand, ${rights[i]} right-hand`).join('\n') +
        `\n\nYou pull gloves out one at a time in the dark. A **usable pair** is a left and a right of the SAME colour.`,
      parts,
      hints: [
        '"Guarantee" means surviving the unluckiest possible run — so build that run yourself, on purpose.',
        'Ask which picks never complete a pair: within a colour, one side alone is always safe, so the worst run stockpiles the bigger side of each colour.',
        'Count that longest failing run, then add one.',
      ],
      explanation:
        `The whole family is one recipe: construct the longest run that still fails, count it, add one. Gloves sharpen the recipe because "unhelpful" is roomier than intuition expects — a pair-free pile can hold every left glove in the drawer. The count-of-colours answer that works for socks (${c + 1}) collapses here into ${need}, and the only difference is the matching rule. Whenever a guarantee is asked for, the first question is: exactly what counts as success, and how long can picks avoid it?`,
    }
  },
)

const BACKWARD_MENU =
  'Exactly one of these two rules fits every number shown:\n\n' +
  '- add the same amount each time\n' +
  '- multiply by the same amount each time'

const runItBack = tpl(
  {
    id: 'rng-zq-run-it-back',
    name: 'The missing first number',
    skillIds: ['z-sequence'],
    bucket: 'puzzle',
    difficulty: 2,
    variants: 16,
    minutes: 2,
    provenance: `${PROV_RUNGS}; the generator verifies with the rule testers that exactly one menu rule fits the shown window, so the missing first term is genuinely determined.`,
  },
  (_rng, seed) => {
    const geometric = seed % 2 === 1
    const q = Math.floor(seed / 2)
    let terms: number[]
    let d = 0
    let r = 0
    if (geometric) {
      r = q < 4 ? 2 : 3
      const s = (r === 2 ? [3, 5, 7, 9] : [2, 4, 5, 7])[q % 4]
      terms = Array.from({ length: 7 }, (_, i) => s * r ** i)
    } else {
      const a1 = [4, 7, 10, 13][q % 4]
      d = [3, 5][Math.floor(q / 4) % 2]
      terms = Array.from({ length: 7 }, (_, i) => a1 + d * i)
    }
    let shown = terms.slice(1)
    let answer = terms[0]
    // Exactly one menu rule may fit the shown window; otherwise fall back.
    const fits = [fitsArithmetic(shown), fitsGeometric(shown), fitsQuadratic(shown), fitsAlternating(shown)]
    const fitCount = fits.filter(Boolean).length
    if (fitCount !== 1 || fits[geometric ? 1 : 0] !== true) {
      terms = [4, 7, 10, 13, 16, 19, 22]
      shown = terms.slice(1)
      answer = 4
      d = 3
    }
    const step = geometric ? `divide ${shown[0]} by the common ratio ${r}` : `subtract the common difference ${d} from ${shown[0]}`
    return {
      title: 'The missing first number',
      prompt: `${BACKWARD_MENU}\n\nA sequence has lost its first number:\n\n**?, ${shown.join(', ')}**\n\nWhat is the missing first number?`,
      answer: numeric(answer),
      hints: [
        'Find the forward rule first: check the gaps between neighbours, then the ratios.',
        'Then run the rule BACKWARDS one step: subtract the common difference, or divide by the common ratio.',
        `Here the rule is "${geometric ? `multiply by ${r}` : `add ${d}`}", so ${step}: the missing number is **${answer}**.`,
      ],
      explanation:
        `**${answer}.** The ${geometric ? `ratios between neighbours are all ${r}` : `gaps between neighbours are all ${d}`}, which picks out one rule from the menu — and a rule that runs forwards runs backwards too: ${geometric ? `each term is the next one divided by ${r}` : `each term is the next one minus ${d}`}.\n\nThe check costs one step: run ${answer} forwards and it must land on ${shown[0]}, which it does. Inverting a rule is the quiet half of sequence work — the same move that predicts term 20 also recovers term zero.`,
    }
  },
)

export const RUNGS_AND_METHODS_TEMPLATES: ItemTemplate[] = [
  // physics — floors and a stretch
  speedFloor,
  waveFloor,
  workFloor,
  circuitStretch,
  // observer
  statedFloor,
  claimFloor,
  anchorFloor,
  surveyStretch,
  // meta
  retrievalFloor,
  stuckFloor,
  mixFloor,
  calibrationStretch,
  // coding
  boolFloor,
  loopFloor,
  indexFloor,
  pairsStretch,
  // insight
  askFloor,
  interestFloor,
  readingFloor,
  repairStretch,
  // puzzle method skills — ordinary AnswerSpec kinds only
  lampFloor,
  cupInvariant,
  firstCutFloor,
  lockSpace,
  gloveStretch,
  runItBack,
]
