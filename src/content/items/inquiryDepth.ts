/**
 * Inquiry Depth — reasoning families for the Investigator path and physics.
 *
 * ## What this file is for
 *
 * Two buckets, one file, because both halves are built on the same authoring
 * move: an item whose answer is DERIVED from the item's own data, and whose
 * distractors are what a specific, nameable wrong idea produces. The
 * `bucket` field is set per template to match each skill's own bucket
 * (`investigator` or `physics`); nothing here is shared state between them.
 *
 * ### Investigator half
 *
 * Coverage was thin per topic rather than thin overall — 19 Investigator
 * skills across 77 question families. The families added here are chosen so
 * that each one is a DIFFERENT MOVE rather than a re-skin:
 *
 *  - `i-logic` — validity as a property of FORM. The sorting item pairs each
 *    valid argument with an invalid one built from the same rule, so surface
 *    plausibility carries no signal at all and only the shape does. The
 *    contrapositive item exploits a useful accident: the contrapositive and
 *    the inverse of a rule are the same words rearranged, so the key and its
 *    nearest decoy are the same LENGTH by construction (see the option-length
 *    note below).
 *  - `i-hypo` — the separating test, not the confirming one. Where a test's
 *    outcome is stored per hypothesis, the key is computed by comparing those
 *    outcomes; a test whose predicted outcome is identical under both
 *    hypotheses can never be in the key, whatever it looks like.
 *  - `i-forecast` — Brier scoring with real arithmetic. Brier is a STRICTLY
 *    PROPER scoring rule: the expected score is optimised by reporting your
 *    actual belief, and 50% scores exactly 0.25 whatever happens, which is why
 *    hedging is safe and never good. All scoring is done in integer
 *    percent-space and divided once at the end, because `(0.1 - 0)**2` in
 *    binary floating point is 0.010000000000000002 and the audit's float-dust
 *    gate is right to refuse showing that to a learner.
 *  - `i-abduce` — coverage against assumptions. The scoring rule used here
 *    (facts covered minus extra assumptions needed) is a WORKING RULE with no
 *    study behind it; it is stated in the prompt so the item is well-defined,
 *    and the explanations say plainly that it is a rule of thumb rather than a
 *    finding. Its only real job is to stop "explains everything" being read as
 *    "is therefore best".
 *  - `i-game` / `i-equilibrium` / `i-commit` — payoff tables with COMPUTED best
 *    responses. Every generator resamples until the situation it describes is
 *    the one it means to describe: no tied payoffs, a dominant action that
 *    really dominates (or provably none), and exactly one pure-strategy
 *    equilibrium. Action names inside a scenario are chosen at equal character
 *    length, which makes all four cell-labels identical in length and removes
 *    option length as a signal entirely.
 *  - the seven one-per-skill families (`i-natfreq`, `i-refclass`,
 *    `i-samplesize`, `i-diagnostic`, `i-conditional`, `i-fallacy`, `i-bayes`)
 *    are each deliberately a move NOT already in `uncertaintyLab.ts`: mixing
 *    two unequal groups rather than screening one; choosing between a narrow
 *    and a broad reference class by size; regression to the mean on a repeat;
 *    the diagnostic value of an ABSENT sign; a rule and its contrapositive as
 *    one statement; the unstated premise an argument needs; and a second
 *    independent check run on the survivors of the first.
 *
 * ### Physics half
 *
 * Same complaint as `physicsReasoning.ts`: most physics families compute a
 * quantity, and a learner can hold all of them without being able to say what
 * happens when something doubles. So every family here is one of four shapes,
 * all of which resist plug-and-chug:
 *
 *  1. SCALING — what factor does the answer change by, when an input changes.
 *     Linear, square and cube dependences are mixed inside one template so
 *     "double it, double the answer" cannot be applied blind.
 *  2. LIMIT CASE — set a quantity to zero (or let it grow without bound) and
 *     ask whether the formula still says something sensible. Some limits are
 *     physically fine (v = 0 gives zero momentum) and some are the formula
 *     announcing that it has left its domain (V = 0 in ρ = m/V), and telling
 *     those apart is the skill.
 *  3. UNIT ALGEBRA — catching a wrong answer without doing any arithmetic.
 *     `pq-meas-units` encodes each quantity as an exponent vector over
 *     (m, kg, s) and computes which candidate expression matches the target,
 *     so the key cannot drift from the units it claims.
 *  4. REPRESENTATION — a velocity-time table to the motion it describes, and
 *     an area-under-the-graph distance, which is the one place where reading a
 *     motion graph stops being about slope.
 *
 * Format vocabulary for the physics half follows the TIPERs task taxonomy
 * already adopted in `physicsReasoning.ts` — see that file's header and
 * docs/RESEARCH.md §30 for the honest tier on it (HEURISTIC: adopted as a
 * design vocabulary, not as a validated instructional method). No item, number
 * or scenario is reproduced from any published bank.
 *
 * ## Two authoring constraints that shaped the code
 *
 * 1. OPTION LENGTH, BOTH DIRECTIONS. The app shipped a bug where the correct
 *    option was systematically the longest and a learner scored well above
 *    chance by picking the long one. The rule followed here is stricter than
 *    "comparable": in every option set the key must be neither the strictly
 *    longest NOR the strictly shortest option. Three devices do the work —
 *    a mirror decoy built from the same words as the key (contrapositive vs
 *    inverse; the four cells of a payoff table), a deliberately long
 *    "cannot be decided from this" decoy, and a deliberately terse one.
 * 2. UNIQUENESS IS ENFORCED IN THE GENERATOR, NOT HOPED FOR. Wherever a
 *    generated instance could accidentally have two right answers — two payoff
 *    cells tying, two forecasters scoring the same, a velocity pattern
 *    matching two stories, a distractor landing on the key — the generator
 *    resamples until the degenerate case is gone. Physics values are chosen so
 *    every displayed number is exact.
 */
import type { ItemPart, ItemTemplate } from '../../domain/types'
import { classify, cycle, mcq, multi, numeric, round, tpl } from '../lib'
import { shuffle, type Rng } from '../../engine/rng'

function part(stage: string, body: Omit<ItemPart, 'stage'>): ItemPart {
  return { stage, ...body }
}

/**
 * Build an ordering key, and never hand the learner the identity permutation.
 *
 * An `order` item shows its options in the given order and asks for them to be
 * rearranged, so a variant whose correct answer happens to BE the display order
 * is a free mark for submitting without touching anything. With four options
 * that lands about one time in twenty-four, which is often enough to matter
 * across a bank this size. Swapping the first two entries removes it.
 */
function orderKey<T>(display: T[], score: (x: T) => number): { list: T[]; correct: number[] } {
  const rank = (list: T[]) => list.map((_, i) => i).sort((a, b) => score(list[b]) - score(list[a]))
  let list = display
  let correct = rank(list)
  if (correct.every((v, i) => v === i)) {
    list = [list[1], list[0], ...list.slice(2)]
    correct = rank(list)
  }
  return { list, correct }
}

// ===========================================================================
// i-logic — validity is a property of the SHAPE
// ===========================================================================

/**
 * Valid and invalid arguments are stored as PAIRS built from the same rule, so
 * that a variant always shows a learner both "if A then B, not B, so not A"
 * and "if A then B, not A, so not B" about different subject matter. Content
 * plausibility is therefore worthless as a cue and only the form decides.
 */
const VALID_ARGS: string[] = [
  'Every locker on row C has a blue tag. Locker 14 is on row C. So locker 14 has a blue tag.',
  'If the van was loaded, the ramp is down. The ramp is not down. So the van was not loaded.',
  'No item in the damp store is dry. Every crate here came from the damp store. So no crate here is dry.',
  'Some bulbs in this box are cracked. Every bulb in this box was made on Tuesday. So some bulbs made on Tuesday are cracked.',
  'Everyone in the choir can read music. Priya is in the choir. So Priya can read music.',
  'If the alarm was armed, the panel light is red. The panel light is green, and it is never both. So the alarm was not armed.',
  'Every ticket sold on Friday is numbered above 400. This ticket is numbered 260. So this ticket was not sold on Friday.',
  'All the seeds in tray A came from packet 2. No seed from packet 2 sprouts in the cold. So no seed in tray A sprouts in the cold.',
  'If the bin was emptied, the lid is standing open. The bin was emptied. So the lid is standing open.',
  'No book on the top shelf may be borrowed. This atlas is on the top shelf. So this atlas may not be borrowed.',
  'Some letters posted today are late. Everything posted today went second class. So some second-class letters are late.',
  'If the tap drips, the water meter turns. The water meter is still. So the tap is not dripping.',
]

const INVALID_ARGS: string[] = [
  'Every locker on row C has a blue tag. Locker 9 has a blue tag. So locker 9 is on row C.',
  'If the van was loaded, the ramp is down. The van was not loaded. So the ramp is not down.',
  'No item in the damp store is dry. This crate did not come from the damp store. So this crate is dry.',
  'Some bulbs in this box are cracked. Some bulbs in this box were made on Tuesday. So some bulbs made on Tuesday are cracked.',
  'Everyone in the choir can read music. Sam can read music. So Sam is in the choir.',
  'If the alarm was armed, the panel light is red. The panel light is red. So the alarm was armed.',
  'Every ticket sold on Friday is numbered above 400. This ticket is numbered 620. So this ticket was sold on Friday.',
  'All the seeds in tray A came from packet 2. This seed came from packet 2. So this seed is in tray A.',
  'If the bin was emptied, the lid is standing open. The lid is standing open. So the bin was emptied.',
  'No book on the top shelf may be borrowed. This atlas may not be borrowed. So the atlas is on the top shelf.',
  'Some letters posted today are late. Some letters posted today went first class. So some first-class letters are late.',
  'If the tap drips, the water meter turns. The tap is not dripping. So the water meter is still.',
]

const logicSort = tpl(
  {
    id: 'iq-logic-sort',
    name: 'Sort the arguments by validity',
    skillIds: ['i-logic'],
    bucket: 'investigator',
    difficulty: 3,
    variants: 12,
    minutes: 3.5,
  },
  (rng, seed) => {
    const n = VALID_ARGS.length
    // A stride of 4 over a 12-item bank cycles every FOUR seeds, so twelve
    // declared variants rendered four distinct question sets. Consecutive
    // windows give twelve, and the two banks are offset so the valid and
    // invalid halves do not move in lockstep.
    const good = [0, 1, 2].map((k) => VALID_ARGS[(seed + k) % n])
    const bad = [0, 1, 2].map((k) => INVALID_ARGS[(seed * 5 + k) % n])
    return {
      title: 'It follows, or it does not',
      prompt:
        'Six short arguments. For each one, assume the first two lines are TRUE and ask only this: could the last line still be false?\n\n' +
        'If it could, the argument does not follow — however sensible it sounds.',
      answer: classify(rng, ['It follows', 'It does not follow'], [
        ...good.map((text) => ({ text, category: 0 })),
        ...bad.map((text) => ({ text, category: 1 })),
      ]),
      hints: [
        'Do not ask whether the last line is true in real life. Ask whether it is forced by the two lines above it.',
        'For "if-then" arguments only two moves are safe: the if-part is true, so the then-part follows; or the then-part is false, so the if-part must be false. For "all" arguments, draw the circles and look for a way out.',
        'Worked path: three of the six leave no escape route at all. In each of the other three you can imagine the two given lines holding while the conclusion fails.',
      ],
      explanation:
        'Three of these follow and three do not, and they were chosen in pairs so that the pair shares a rule and differs only in the move made with it.\n\n' +
        'The two safe moves are: the if-part happened, so the then-part happened; and the then-part did NOT happen, so the if-part cannot have. The two unsafe moves are the mirror images of those: the then-part happened, so the if-part must have (other things can cause it), and the if-part did not happen, so the then-part did not either (the rule said nothing about that case).\n\n' +
        'The same split runs through the "all" arguments. Being inside the big circle does not put you in the small one, and being outside the small one does not put you outside the big one.\n\n' +
        'Validity is about the SHAPE, not the subject. That is why the arguments here are about lockers and seed packets: strip the subject out and the same six shapes are left.',
    }
  },
)

interface CondPair {
  p: string
  notP: string
  q: string
  notQ: string
  both: string
}

/**
 * The key (contrapositive) and its nearest decoy (inverse) are the SAME WORDS
 * in the other order, so they are exactly the same length in every case. That
 * removes length as a cue without any hand-tuning, and it also puts the most
 * tempting wrong answer right beside the right one.
 */
const COND_PAIRS: CondPair[] = [
  { p: 'the gate is bolted', notP: 'the gate is not bolted', q: 'the tag reads green', notQ: 'the tag does not read green', both: 'The gate is bolted at exactly the times when the tag reads green.' },
  { p: 'the oven is on', notP: 'the oven is not on', q: 'the fan is running', notQ: 'the fan is not running', both: 'The oven is on at exactly the times when the fan is running.' },
  { p: 'the parcel was scanned', notP: 'the parcel was not scanned', q: 'a time is printed on the label', notQ: 'no time is printed on the label', both: 'A parcel was scanned exactly when a time is printed on the label.' },
  { p: 'the vent is open', notP: 'the vent is not open', q: 'the greenhouse fan has stopped', notQ: 'the greenhouse fan has not stopped', both: 'The vent is open at exactly the times when the greenhouse fan has stopped.' },
  { p: 'the meter has been read', notP: 'the meter has not been read', q: 'a card sits in the slot', notQ: 'no card sits in the slot', both: 'The meter has been read exactly when a card sits in the slot.' },
  { p: 'the boat is moored', notP: 'the boat is not moored', q: 'the blue rope is tied', notQ: 'the blue rope is not tied', both: 'The boat is moored at exactly the times when the blue rope is tied.' },
  { p: 'the kiln reached full heat', notP: 'the kiln did not reach full heat', q: 'the cone has bent over', notQ: 'the cone has not bent over', both: 'The kiln reached full heat exactly when the cone has bent over.' },
  { p: 'the form went in late', notP: 'the form did not go in late', q: 'it carries a grey stamp', notQ: 'it carries no grey stamp', both: 'A form went in late at exactly the times when it carries a grey stamp.' },
  { p: 'the pump is running', notP: 'the pump is not running', q: 'the pipe is warm', notQ: 'the pipe is not warm', both: 'The pump is running at exactly the times when the pipe is warm.' },
  { p: 'the hall was booked', notP: 'the hall was not booked', q: 'the caretaker was told', notQ: 'the caretaker was not told', both: 'The hall was booked at exactly the times when the caretaker was told.' },
  { p: 'the sensor saw movement', notP: 'the sensor saw no movement', q: 'the log holds an entry', notQ: 'the log holds no entry', both: 'The sensor saw movement at exactly the times when the log holds an entry.' },
  { p: 'the batch passed the check', notP: 'the batch did not pass the check', q: 'a green seal is attached', notQ: 'no green seal is attached', both: 'The batch passed the check exactly when a green seal is attached.' },
]

const logicContrapositive = tpl(
  {
    id: 'iq-logic-contrapositive',
    name: 'The other true version of a rule',
    skillIds: ['i-logic', 'i-conditional'],
    bucket: 'investigator',
    difficulty: 3,
    variants: 12,
    minutes: 2.5,
  },
  (rng, seed) => {
    const c = cycle(seed, COND_PAIRS)
    const key = `If ${c.notQ}, then ${c.notP}.`
    return {
      title: 'Same rule, said backwards',
      prompt:
        `Rule: **If ${c.p}, then ${c.q}.**\n\n` +
        'Assume the rule always holds. Which of these must ALSO be true, every single time?',
      answer: mcq(rng, key, [
        `If ${c.notP}, then ${c.notQ}.`,
        `If ${c.q}, then ${c.p}.`,
        c.both,
      ]),
      hints: [
        'A rule promises one direction only. Ask what it rules OUT: which combination of the two facts can never happen if the rule holds?',
        `The rule forbids exactly one situation — ${c.p} while ${c.notQ}. Now say that same ban the other way round.`,
        `Worked path: **${key}** If the then-part failed, the if-part cannot have happened, because the rule would have made the then-part happen.`,
      ],
      explanation:
        `**${key}**\n\n` +
        `A rule of this shape bans exactly one thing: ${c.p} together with ${c.notQ}. Reading that ban from the other end gives the answer, and it is not a new claim — it is the same rule in different words.\n\n` +
        `The decoy that catches nearly everyone is "If ${c.notP}, then ${c.notQ}." It is the same words as the answer with the two halves swapped, which is exactly why it slips past: switching off the if-part switches off the RULE, not the then-part. Something else may well be making it true that ${c.q}.\n\n` +
        `"If ${c.q}, then ${c.p}" fails for the same reason from the other side, and the "exactly when" version claims both directions at once, which is a strictly stronger rule than the one you were given.`,
    }
  },
)

interface CounterCase {
  thing: string
  a: string
  notA: string
  b: string
  notB: string
}

const COUNTER_CASES: CounterCase[] = [
  { thing: 'crate', a: 'came from the north yard', notA: 'did not come from the north yard', b: 'carries a red seal', notB: 'carries no red seal' },
  { thing: 'entry', a: 'was made after eight', notA: 'was not made after eight', b: 'has a signature', notB: 'has no signature' },
  { thing: 'plant', a: 'sits in the shaded bed', notA: 'does not sit in the shaded bed', b: 'has flowered', notB: 'has not flowered' },
  { thing: 'loaf', a: 'was baked on Monday', notA: 'was not baked on Monday', b: 'went to the market', notB: 'never went to the market' },
  { thing: 'photo', a: 'was taken indoors', notA: 'was not taken indoors', b: 'used the flash', notB: 'did not use the flash' },
  { thing: 'bike', a: 'came off the old rack', notA: 'did not come off the old rack', b: 'has a worn chain', notB: 'has no worn chain' },
  { thing: 'letter', a: 'went second class', notA: 'did not go second class', b: 'arrived late', notB: 'did not arrive late' },
  { thing: 'tile', a: 'was fired last week', notA: 'was not fired last week', b: 'has a hairline crack', notB: 'has no hairline crack' },
  { thing: 'ticket', a: 'was bought at the door', notA: 'was not bought at the door', b: 'went through the cash tin', notB: 'never went through the cash tin' },
  { thing: 'sample', a: 'came from the deep pool', notA: 'did not come from the deep pool', b: 'tested cloudy', notB: 'did not test cloudy' },
  { thing: 'batch', a: 'used the new mix', notA: 'did not use the new mix', b: 'set within an hour', notB: 'did not set within an hour' },
  { thing: 'reading', a: 'was taken before dawn', notA: 'was not taken before dawn', b: 'came in below zero', notB: 'did not come in below zero' },
]

const logicCounterexample = tpl(
  {
    id: 'iq-logic-counterexample',
    name: 'The one case that kills the claim',
    skillIds: ['i-logic'],
    bucket: 'investigator',
    difficulty: 3,
    variants: 12,
    minutes: 2.5,
    transfer: true,
  },
  (rng, seed) => {
    const c = cycle(seed, COUNTER_CASES)
    const key = `A ${c.thing} that ${c.a} and ${c.notB}`
    return {
      title: 'Find the killer case',
      prompt:
        `Someone claims: **Every ${c.thing} that ${c.a} also ${c.b}.**\n\n` +
        'Four single cases turn up. Which ONE of them, on its own, shows the claim is false?',
      answer: mcq(rng, key, [
        `A ${c.thing} that ${c.a} and ${c.b}`,
        `A ${c.thing} that ${c.notA} and ${c.b}`,
        `A ${c.thing} that ${c.notA} and ${c.notB}`,
      ]),
      hints: [
        'The claim is a promise about one group only. Work out which group, then ask what the promise says every member of it must have.',
        `Nothing outside that group can break the promise. So the killer case has to be one that ${c.a}.`,
        `Worked path: **${key}** — inside the group the claim covers, without the thing the claim promised.`,
      ],
      explanation:
        `**${key}**\n\n` +
        `The claim only speaks about the ones that ${c.a}, and about those it promises one thing. So the only way to break it is a case that is inside the group and missing the promised feature.\n\n` +
        `The tempting wrong pick is the one that ${c.a} and ${c.b}: it is the case people go looking for, because it is the case the claim is ABOUT. But it agrees with the claim, and any number of agreeing cases leaves the claim exactly as unproven as before.\n\n` +
        `The two cases that ${c.notA} are outside the claim altogether. They can look dramatic — especially the one that also ${c.notB} — and they say nothing either way. A universal claim is cheap to state, cheap to confirm, and takes exactly one case to destroy, which is why looking for that one case is worth more than collecting a hundred of the others.`,
    }
  },
)

interface ChainCase {
  intro: string
  steps: [string, string, string, string]
}

const CHAIN_CASES: ChainCase[] = [
  {
    intro: 'A workshop is trying to work out why the trip switch went overnight.',
    steps: [
      'The gauge on the tank reads empty.',
      'An empty tank means the pump has been running since noon.',
      'A pump running since noon has drawn more power than the meter allows.',
      'Drawing more power than the meter allows is what throws the trip switch.',
    ],
  },
  {
    intro: 'A club secretary is working out why nobody came to the Thursday session.',
    steps: [
      'The noticeboard is still showing the programme from last month.',
      'An out-of-date noticeboard means the new dates were never posted.',
      'Dates that were never posted reached only the people on the mailing list.',
      'The mailing list holds eleven of the sixty members of the club.',
    ],
  },
  {
    intro: 'A gardener is working out why the seedlings in the far frame died.',
    steps: [
      'The lid of the far frame was propped open all week.',
      'A lid propped open all week let the night frost straight in.',
      'Night frost gets into the compost before it reaches the leaves.',
      'Frost in the compost kills the roots, and the leaves follow.',
    ],
  },
  {
    intro: 'A driver is working out why the fuel figure has fallen this spring.',
    steps: [
      'The dashboard warning for tyre pressure came on in March.',
      'A pressure warning in March means at least one tyre is soft.',
      'A soft tyre drags, so the engine works harder at the same speed.',
      'An engine working harder at the same speed burns more fuel per mile.',
    ],
  },
  {
    intro: 'A librarian is working out why the returns shelf keeps overflowing.',
    steps: [
      'The self-service machine has been out of order since Tuesday.',
      'With the machine out of order, every return is handled at the desk.',
      'Returns handled at the desk are only processed while the desk is staffed.',
      'The desk is staffed for three hours a day, and returns arrive all day.',
    ],
  },
  {
    intro: 'A baker is working out why the bread has been coming out pale.',
    steps: [
      'The oven takes twice as long as usual to reach temperature.',
      'A slow heat-up points to one of the two elements having failed.',
      'With one element gone, the top of the oven never gets properly hot.',
      'Bread browns from the top, so a cool top leaves the crust pale.',
    ],
  },
  {
    intro: 'A photographer is working out why the evening shots are blurred.',
    steps: [
      'The camera is set to choose its own shutter speed.',
      'Left to choose, it picks a slow shutter once the light drops.',
      'A slow shutter keeps the sensor open long enough to record movement.',
      'Recorded movement is exactly what a blurred picture is made of.',
    ],
  },
  {
    intro: 'A coach is working out why the team fades in the last ten minutes.',
    steps: [
      'Training sessions have been ending forty minutes early since June.',
      'Sessions ending early means the last block of running was dropped.',
      'The dropped block was the only part done at match pace.',
      'Nothing done at match pace means nothing rehearsed for the closing minutes.',
    ],
  },
  {
    intro: 'A shopkeeper is working out why the freezer bill has doubled.',
    steps: [
      'The freezer door seal has a gap you can post a coin through.',
      'A gap in the seal lets warm air into the cabinet all day.',
      'Warm air in the cabinet keeps the compressor running far longer.',
      'A compressor running far longer is the whole of the extra bill.',
    ],
  },
  {
    intro: 'A teacher is working out why one class scores lower on the same test.',
    steps: [
      'That class is timetabled in the room with no working clock.',
      'With no working clock, nobody in the room can pace the paper.',
      'Unpaced papers get spent on the early questions.',
      'The marks in this paper are concentrated in the last two questions.',
    ],
  },
]

const logicChain = tpl(
  {
    id: 'iq-logic-chain',
    name: 'Put the reasoning in order',
    skillIds: ['i-logic'],
    bucket: 'investigator',
    difficulty: 3,
    variants: 10,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, CHAIN_CASES)
    const { list, correct } = orderKey(
      shuffle(rng, c.steps.map((text, i) => ({ text, i }))),
      (d) => -d.i,
    )
    return {
      title: 'Rebuild the chain',
      prompt:
        `${c.intro}\n\nThese four lines belong to one chain of reasoning, but they have been jumbled. ` +
        'Put them in the order where each line is built on the one before it.',
      answer: { type: 'order', options: list.map((d) => d.text), correct },
      hints: [
        'Find the line that assumes nothing — the one that reports something you could simply look at. That is the start.',
        'Every other line begins by naming a fact that an earlier line established. Follow those references.',
        `Worked path: ${c.steps.map((s, i) => `${i + 1}. ${s}`).join(' ')}`,
      ],
      explanation:
        `In order: ${c.steps.map((s, i) => `**${i + 1}.** ${s}`).join(' ')}\n\n` +
        'Notice how the chain is held together. Each line after the first opens by naming the thing the previous line concluded, so there is exactly one order in which every line has its input available.\n\n' +
        'That is worth more than the puzzle. An argument written this way can be checked link by link, and a broken one can be repaired at the link that broke instead of thrown out whole. An argument that jumps from the first fact to the last conclusion is not shorter — it has simply hidden the steps where the mistake would have shown.',
    }
  },
)
// ===========================================================================
// i-hypo — hold several explanations, then find the test that separates them
// ===========================================================================

interface SepCase {
  setup: string
  hypA: string
  hypB: string
  /** [what you would do, what it shows under A, what it shows under B]. */
  tests: [string, string, string][]
}

/**
 * The key is COMPUTED by comparing the two stored outcomes: a test is in the
 * answer exactly when its predicted outcome differs between the hypotheses. A
 * test whose two outcomes are the same string can never be selected, however
 * energetic it looks — which is the entire lesson, enforced in code rather
 * than trusted to the author.
 *
 * In every case the LONGEST option is deliberately one of the useless tests.
 */
const SEP_CASES: SepCase[] = [
  {
    setup: 'A guitar has started buzzing on the low strings.',
    hypA: 'the neck has bowed',
    hypB: 'one fret has lifted',
    tests: [
      ['Play every note up the low string and note where the buzz begins', 'buzzing over a whole stretch', 'buzzing at one spot only'],
      ['Turn the guitar over and look along the back for new scratches', 'nothing to see', 'nothing to see'],
      ['Sight down the neck from the body end to see if it runs straight', 'a visible curve', 'a straight line'],
      ['Press each fret down in turn and feel whether any of them shifts', 'none of them shift', 'one of them shifts'],
      ['Play the same phrase again much louder so that the buzz is easier to hear', 'the same buzz, louder', 'the same buzz, louder'],
    ],
  },
  {
    setup: 'A fridge has stopped keeping food properly cold.',
    hypA: 'the door seal has failed',
    hypB: 'the thermostat has stuck at its warmest setting',
    tests: [
      ['Shut the door on a sheet of paper and try to pull the paper out', 'the paper slides free', 'the paper is gripped'],
      ['Listen for whether the motor runs at all during a quiet hour', 'the motor runs almost constantly', 'the motor barely starts'],
      ['Read the temperature at the top and at the bottom of the cabinet', 'both read too warm', 'both read too warm'],
      ['Look for a line of condensation along one edge of the door', 'a damp line along one edge', 'no damp line anywhere'],
      ['Write down how warm the cabinet is at the same hour every day for a week', 'too warm every day', 'too warm every day'],
    ],
  },
  {
    setup: 'Tomato plants in a greenhouse are flowering but setting no fruit.',
    hypA: 'the greenhouse gets too hot at midday',
    hypB: 'nothing is pollinating the flowers',
    tests: [
      ['Hang a maximum thermometer at plant height and read it each evening', 'a very high midday peak', 'an ordinary midday peak'],
      ['Tap the flower trusses each morning and watch what happens next', 'still no fruit sets', 'fruit begins to set'],
      ['Count how many flowers have opened on each plant this week', 'plenty of flowers', 'plenty of flowers'],
      ['Watch whether the flowers drop off or stay on and slowly wither', 'flowers drop off', 'flowers stay and wither'],
      ['Take a photograph of the whole greenhouse and compare it with the one from last year', 'much the same picture', 'much the same picture'],
    ],
  },
  {
    setup: 'A phone loses most of its charge overnight.',
    hypA: 'the battery has worn out',
    hypB: 'an app is waking the phone all night',
    tests: [
      ['Switch the phone fully off overnight and read the charge in the morning', 'a large drop even when off', 'almost no drop at all'],
      ['Open the battery screen and read which app used the most power', 'no app stands out', 'one app stands out'],
      ['Charge it to full and unplug it at bedtime exactly as usual', 'flat by morning', 'flat by morning'],
      ['Compare how fast it drains in use with how fast it drains sitting idle', 'both drain quickly', 'only idle draining is odd'],
      ['Carry the phone to a different room of the house and leave it there overnight', 'flat by morning', 'flat by morning'],
    ],
  },
  {
    setup: 'One radiator in a hall stays cold while the rest heat up.',
    hypA: 'air is trapped inside the radiator',
    hypB: 'the valve at its foot is closed',
    tests: [
      ['Feel the radiator at the top and at the bottom and compare them', 'warm below, cold above', 'cold all over'],
      ['Open the bleed screw at the top and listen to what comes out', 'a hiss of air first', 'nothing comes out'],
      ['Check whether the boiler is firing at all this morning', 'the boiler is firing', 'the boiler is firing'],
      ['Turn the small nut at the foot and see whether it moves freely', 'it is already fully open', 'it turns and opens up'],
      ['Ask whether anybody else in the building has complained about the heating this week', 'no other complaints', 'no other complaints'],
    ],
  },
  {
    setup: 'A car pulls steadily to the left on a flat road.',
    hypA: 'the two front tyres are at different pressures',
    hypB: 'the front wheels are out of alignment',
    tests: [
      ['Check the pressure in each front tyre with a gauge', 'the two readings differ', 'the two readings match'],
      ['Look at whether one front tyre is worn along its inner edge', 'even wear on both', 'heavy wear on one edge'],
      ['Drive the same stretch of road again at the same speed', 'it pulls left again', 'it pulls left again'],
      ['Swap the two front wheels over and drive the same stretch', 'the pull moves to the right', 'the pull stays on the left'],
      ['Ask the last person who drove the car whether they noticed anything unusual about it', 'they noticed the pull', 'they noticed the pull'],
    ],
  },
  {
    setup: 'An outdoor light keeps switching itself on in broad daylight.',
    hypA: 'the daylight sensor is covered over',
    hypB: 'the timer has been set to the wrong hours',
    tests: [
      ['Cover the sensor with a hand at midday and watch what the light does', 'no change, it is already on', 'the light comes on'],
      ['Read which times the timer is currently set to switch on and off', 'sensible times', 'clearly wrong times'],
      ['Check that the bulb in the fitting is the right one for it', 'the right bulb', 'the right bulb'],
      ['Watch whether it switches on at the same clock time every day', 'it varies with the weather', 'it is the same time daily'],
      ['Turn the whole circuit off at the fuse box for an hour and then switch it back on', 'it comes on again', 'it comes on again'],
    ],
  },
  {
    setup: 'A kettle now takes far longer to boil than it used to.',
    hypA: 'limescale has coated the element',
    hypB: 'it is simply being filled much fuller than before',
    tests: [
      ['Fill it to the same marked line each time and time the boil', 'still slow at the same level', 'back to its old speed'],
      ['Empty it and look at the element with a torch to see what is on it', 'a thick white crust', 'a clean metal surface'],
      ['Boil it twice in a row and see whether the second boil is quicker', 'the second is quicker', 'the second is quicker'],
      ['Weigh the kettle before switching it on, on several days running', 'much the same weight', 'a much heavier weight'],
      ['Try the kettle on a different socket in a different room of the house and time it there', 'no change at all', 'no change at all'],
    ],
  },
]

const hypoSeparate = tpl(
  {
    id: 'iq-hypo-separate',
    name: 'Every test that would separate them',
    skillIds: ['i-hypo'],
    bucket: 'investigator',
    difficulty: 4,
    variants: 8,
    minutes: 4,
  },
  (rng, seed) => {
    const c = cycle(seed, SEP_CASES)
    const splits = c.tests.filter((t) => t[1] !== t[2])
    const flats = c.tests.filter((t) => t[1] === t[2])
    const table = c.tests
      .map((t) => `- ${t[0]}\n  - If ${c.hypA}: ${t[1]}.\n  - If ${c.hypB}: ${t[2]}.`)
      .join('\n')
    return {
      title: 'Which checks would actually settle it',
      prompt:
        `${c.setup}\n\nTwo explanations are on the table: ${c.hypA}, or ${c.hypB}.\n\n` +
        'Select **every** check below that would come out DIFFERENTLY depending on which explanation is right.',
      answer: multi(
        rng,
        splits.map((t) => t[0]),
        flats.map((t) => t[0]),
      ),
      hints: [
        'Take one check at a time and write down two predictions for it: what you would see if the first explanation is right, and what you would see if the second one is.',
        'If those two predictions are the same sentence, the check is worthless here — no matter how sensible or thorough it sounds.',
        `Worked path: ${splits.length} of the ${c.tests.length} checks give different results under the two explanations. The others give the same result either way.`,
      ],
      explanation:
        `The ${splits.length} checks worth doing are the ones whose two predictions differ:\n\n${table}\n\n` +
        `The rest are not careless suggestions — they are the kind of thing people really do. Repeating the observation that started the whole thing, gathering more of the same, moving the object somewhere else: each feels like work and each returns the same answer whichever explanation is true, so each leaves you exactly where you began.\n\n` +
        `The habit that fixes this is writing the two predictions BEFORE acting. A check you cannot predict two different outcomes for is not a check.`,
    }
  },
)

interface FavCase {
  setup: string
  hypA: string
  hypB: string
  key: string
  /** [would happen under both, changes two things at once, repeats the symptom]. */
  decoys: [string, string, string]
  why: string
}

const FAV_CASES: FavCase[] = [
  {
    setup: 'A loaf rises well but collapses in the middle during baking.',
    hypA: 'the dough is being left to prove for too long',
    hypB: 'the oven is running cooler than its dial says',
    key: 'Bake half the batch with an oven thermometer sitting beside it',
    decoys: [
      'Check that the loaf really does sink, by watching it through the door',
      'Bake the next loaf with a shorter prove and a hotter oven and a new tin',
      'Bake the same loaf again tomorrow',
    ],
    why: 'A thermometer reads high or low, and that reading means different things under the two explanations. Watching it sink again confirms the symptom you already have.',
  },
  {
    setup: 'A bicycle brake squeals every time it is used.',
    hypA: 'the rim has grease on it',
    hypB: 'the pads are sitting at the wrong angle',
    key: 'Wipe the rim clean with a cloth and ride the same hill again',
    decoys: [
      'Squeeze the brake while standing still and listen for the squeal',
      'Clean the rim, change the pads and adjust the cable all in one go',
      'Ride the same hill again',
    ],
    why: 'Cleaning the rim alone changes exactly one thing. Doing three jobs at once fixes the bike and teaches nothing about which one mattered.',
  },
  {
    setup: 'The internet is slow in the back bedroom and fine everywhere else.',
    hypA: 'the room is too far from the router',
    hypB: 'a neighbouring network is crowding the same channel',
    key: 'Take a laptop into the room at three in the morning and test it',
    decoys: [
      'Run a speed test in the back bedroom to confirm that it is slow there',
      'Move the router, change its channel and replace the cable together',
      'Run the speed test again later',
    ],
    why: 'At three in the morning the distance is unchanged but the neighbours are off the air, so the two explanations predict different results. Everything else leaves both alive.',
  },
  {
    setup: 'A mechanical watch has started losing about ten minutes a day.',
    hypA: 'it is overdue for a service',
    hypB: 'it has been magnetised',
    key: 'Hold a compass beside the watch and watch the needle',
    decoys: [
      'Set the watch correctly and check tomorrow whether it has lost time',
      'Have it serviced, demagnetised and regulated all in the same visit',
      'Check it again tomorrow',
    ],
    why: 'A compass needle swings for a magnetised watch and sits still for a worn one. Resetting and re-checking measures the same loss you already knew about.',
  },
  {
    setup: 'A houseplant is yellowing from the lower leaves upwards.',
    hypA: 'it is being watered too often',
    hypB: 'it is not getting enough light',
    key: 'Push a finger into the compost two days after watering it',
    decoys: [
      'Look at the lower leaves again to check that they really are yellow',
      'Move it to a window, water it less and repot it into fresh compost',
      'Photograph the leaves again next week',
    ],
    why: 'Compost still soaking two days later points one way and dry compost points the other. The rest either restate the symptom or change three things at once.',
  },
  {
    setup: 'A door sticks badly in July and swings freely in January.',
    hypA: 'the timber swells in damp weather',
    hypB: 'the frame has dropped on a loose hinge',
    key: 'Measure the gap at the top and bottom of the door in each season',
    decoys: [
      'Try the door again on a humid day to check that it really sticks',
      'Plane the edge, tighten the hinges and rehang the whole door at once',
      'Open and close it several more times to see if it still catches',
    ],
    why: 'Swollen timber closes the gap all round; a dropped frame closes it on one corner only. That is a difference you can measure; the others are not.',
  },
  {
    setup: 'One side of a pair of headphones crackles.',
    hypA: 'the cable is broken near the plug',
    hypB: 'the speaker in that earpiece has failed',
    key: 'Wiggle the cable near the plug while a steady note is playing',
    decoys: [
      'Play the same track again and listen for the crackle in that ear',
      'Buy new headphones and a new cable and try a different music app',
      'Put them on again later',
    ],
    why: 'A broken cable crackles in time with the wiggling and a failed speaker does not care. The other three cannot come out two different ways.',
  },
  {
    setup: 'A camera memory card is filling up about twice as fast as expected.',
    hypA: 'every picture is being saved in two formats',
    hypB: 'the quality setting has been turned up',
    key: 'Take one picture, then count how many new files appear on the card',
    decoys: [
      'Check how much space is left on the card to confirm it is filling fast',
      'Format the card, reset every setting and update the camera software',
      'Shoot another set of pictures and watch the space drop again',
    ],
    why: 'Two files from one press separates the explanations in a single move. One file that happens to be large points the other way.',
  },
  {
    setup: 'A class scores lower on Friday tests than on Tuesday tests.',
    hypA: 'the Friday papers are simply harder',
    hypB: 'the class is tired by the end of the week',
    key: 'Give one Friday paper on a Tuesday and one Tuesday paper on a Friday',
    decoys: [
      'Mark the Friday papers again to confirm the scores really are lower',
      'Move the test, shorten the paper and change the seating for next week',
      'Set another Friday test and see whether the scores are low again',
    ],
    why: 'Swapping the papers between days pulls the two explanations apart, because only one of them travels with the paper. The rest leave them tangled together.',
  },
  {
    setup: 'A shop card machine declines roughly one payment in four.',
    hypA: 'the machine keeps losing its network connection',
    hypB: 'one type of card is not supported',
    key: 'Write down the card type and the time for every declined payment',
    decoys: [
      'Try one of the declined payments again to check that it declines',
      'Replace the machine, change provider and move it to a new socket',
      'Wait for the next decline and see whether it happens once more',
    ],
    why: 'A log sorts the declines by card and by time, and the two explanations predict different patterns in it. Nothing else on the list distinguishes them.',
  },
]

const hypoFavourite = tpl(
  {
    id: 'iq-hypo-favourite',
    name: 'The test that separates, not the one that agrees',
    skillIds: ['i-hypo'],
    bucket: 'investigator',
    difficulty: 3,
    variants: 10,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, FAV_CASES)
    return {
      title: 'One move, chosen well',
      prompt:
        `${c.setup}\n\nTwo explanations fit what has been seen so far: ${c.hypA}, or ${c.hypB}.\n\n` +
        'You have time for ONE thing. Which of these is worth doing?',
      answer: mcq(rng, c.key, [...c.decoys]),
      hints: [
        'For each option, imagine doing it twice: once in a world where the first explanation is true, and once in a world where the second one is. Would you notice any difference between the two worlds?',
        'Two of these cannot come out two ways at all. One of them changes several things at once, so whatever happens you will not know which change did it.',
        `Worked path: **${c.key}**`,
      ],
      explanation:
        `**${c.key}** ${c.why}\n\n` +
        'The three rejected options are the three things people actually do, and each one feels productive. Checking the symptom again produces certainty about the thing you were already sure of. Fixing everything at once solves the problem and destroys the evidence, so the same problem next year starts from nothing. Repeating the observation adds a second copy of the information you already had.\n\n' +
        'A test earns its place by having at least two possible results that mean different things. That is the only property that matters, and it is not the same as being thorough.',
    }
  },
)

interface ThreeCase {
  setup: string
  hyps: [string, string, string]
  /** [what you could check, whether each hypothesis predicts it]. */
  obs: [string, [boolean, boolean, boolean]][]
}

/**
 * In every case exactly ONE observation has a mixed prediction pattern; the
 * other three are predicted identically by all three explanations. The key is
 * computed by looking for the mixed pattern, so a bank edit that made two
 * observations informative would be caught by the generator, not shipped.
 */
const THREE_CASES: ThreeCase[] = [
  {
    setup: 'A school printer keeps jamming.',
    hyps: ['the paper has taken up damp', 'the feed roller is worn smooth', 'the wrong weight of paper is loaded'],
    obs: [
      ['Every jam happens at the same point in the paper path', [true, true, true]],
      ['The jammed sheet comes out creased across its width', [true, true, true]],
      ['A fresh ream straight out of a sealed pack jams just as often', [false, true, true]],
      ['Jams have become steadily more frequent over the last few months', [true, true, true]],
    ],
  },
  {
    setup: 'A community minibus is using far more fuel than it used to.',
    hyps: ['the tyres are soft', 'a new driver brakes and accelerates hard', 'the roof rack has been left on'],
    obs: [
      ['The extra use shows up on every kind of journey', [true, true, true]],
      ['The change began in the same week as three other changes', [true, true, true]],
      ['The extra use is worst on the long fast run to the coast', [false, false, true]],
      ['The engine sounds exactly as it always has done', [true, true, true]],
    ],
  },
  {
    setup: 'A village hall is losing bookings.',
    hyps: ['the hire charge went up', 'a new hall opened nearby', 'the online booking form is broken'],
    obs: [
      ['Bookings are down compared with the same months last year', [true, true, true]],
      ['Regular users as well as occasional one-off users have dropped away', [true, true, true]],
      ['Bookings made by phone have held up while online ones vanished', [false, false, true]],
      ['The decline started at some point during the spring term', [true, true, true]],
    ],
  },
  {
    setup: 'A running club is seeing more injuries this season.',
    hyps: ['the new training plan is too hard', 'the club has taken on many beginners', 'the winter routes are icier than usual'],
    obs: [
      ['The injury count is clearly above last season at this point', [true, true, true]],
      ['Most of the injuries are to legs and ankles rather than arms', [true, true, true]],
      ['Members who trained through last winter are getting hurt too', [true, false, true]],
      ['The injuries are spread across the whole membership list', [true, true, true]],
    ],
  },
  {
    setup: 'A small cafe is throwing away far more bread than usual.',
    hyps: ['it is ordering too much', 'customers have moved to the new wraps', 'the bread is going stale faster'],
    obs: [
      ['The amount of waste has roughly doubled since the start of the term', [true, true, true]],
      ['The bread that is thrown out is the same kind every time', [true, true, true]],
      ['Bread opened at nine is already dry by the middle of the day', [false, false, true]],
      ['Nobody has complained about the bread at the counter', [true, true, true]],
    ],
  },
  {
    setup: 'A photography group finds its prints are coming back too dark.',
    hyps: ['the screens are set too bright', 'the files are being exported wrongly', 'the print shop has changed its paper'],
    obs: [
      ['Every member of the group has the same complaint', [true, true, true]],
      ['The pictures look correct on the screens they were edited on', [true, true, true]],
      ['Prints ordered from a different shop come back correct', [false, false, true]],
      ['The problem started somewhere around the middle of March', [true, true, true]],
    ],
  },
  {
    setup: 'A school garden is producing far fewer beans than last year.',
    hyps: ['the seed was old', 'the bed is short of water', 'the new fence has put the bed in shade'],
    obs: [
      ['The plants are visibly smaller than they were last year at this stage', [true, true, true]],
      ['The same variety was sown in the same bed as last year', [true, true, true]],
      ['A tray sown from the same packet on a sunny windowsill did well', [false, true, true]],
      ['The leaves are pale rather than eaten or spotted', [true, true, true]],
    ],
  },
  {
    setup: 'A bookshop finds its Saturday takings have fallen.',
    hyps: ['the market has moved to another street', 'the card reader is turning people away', 'a nearby car park has closed'],
    obs: [
      ['Saturday is the only day of the week that has clearly changed at all', [true, true, true]],
      ['Takings fell suddenly rather than drifting down slowly', [true, true, true]],
      ['The number of people entering the shop has not changed at all', [false, true, false]],
      ['Nothing about the shop itself changed in that week', [true, true, true]],
    ],
  },
]

const hypoThree = tpl(
  {
    id: 'iq-hypo-three',
    name: 'Three explanations, four possible checks',
    skillIds: ['i-hypo'],
    bucket: 'investigator',
    difficulty: 4,
    variants: 8,
    minutes: 3.5,
  },
  (rng, seed) => {
    const c = cycle(seed, THREE_CASES)
    const informative = c.obs.filter((o) => new Set(o[1]).size > 1)
    const key = informative[0]
    const yes = key[1].map((b, i) => (b ? c.hyps[i] : null)).filter((x): x is string => x !== null)
    const no = key[1].map((b, i) => (b ? null : c.hyps[i])).filter((x): x is string => x !== null)
    const list = c.hyps.map((h, i) => `${i + 1}. Perhaps ${h}.`).join('\n')
    return {
      title: 'Which check narrows the field',
      prompt:
        `${c.setup}\n\nThree explanations are in play:\n\n${list}\n\n` +
        'Only one of the four checks below would rule any of them out. Which one?',
      answer: mcq(
        rng,
        key[0],
        c.obs.filter((o) => o[0] !== key[0]).map((o) => o[0]),
      ),
      hints: [
        'Do not ask which check sounds most thorough. For each one, ask what each of the three explanations predicts you would find.',
        'Three of these are predicted by all three explanations, so whatever they show, all three survive. Look for the one where the three explanations disagree with each other.',
        `Worked path: **${key[0]}** — expected under ${yes.length === 1 ? 'only one' : `${yes.length}`} of the three, and not under the ${no.length === 1 ? 'other one' : 'others'}.`,
      ],
      explanation:
        `**${key[0]}**\n\n` +
        `That result is what you would expect if ${yes.join(' or ')}, and not what you would expect if ${no.join(' or ')}. So whichever way it comes out, at least one explanation is finished — and that is what "narrowing the field" means.\n\n` +
        `The other three checks are all things a careful person would look at, and every one of them is predicted by all three explanations. Confirming them feels like progress and moves nothing: you end up with more facts and exactly the same three candidates.\n\n` +
        `With three explanations rather than two the trap gets stronger, because a fact that fits your favourite explanation usually fits the other two as well. The question to keep asking is not "does this fit?" but "which of these would this rule out?"`,
    }
  },
)

interface PredictCase {
  setup: string
  h1: string
  h2: string
  /** Four possible findings; the two keys sit in the middle of the length range. */
  findings: [string, string, string, string]
  k1: number
  k2: number
  check: string
  checkDecoys: [string, string, string]
}

const PREDICT_CASES: PredictCase[] = [
  {
    setup: 'A wall in an old house has a damp patch near the floor.',
    h1: 'water is rising through the brickwork',
    h2: 'a pipe behind the wall is leaking',
    findings: ['The damp forms an even band along the whole wall', 'The damp is a rough circle around a single point', 'The whole room smells strongly of fresh paint', 'The wall feels colder than the ceiling above it'],
    k1: 0,
    k2: 1,
    check: 'Map the damp with a meter along the whole length of the wall',
    checkDecoys: [
      'Repaint the wall and wait to see whether the patch returns',
      'Photograph the damp patch so there is a record of its size',
      'Ask a neighbour in the same terrace whether they have damp as well',
    ],
  },
  {
    setup: 'A laptop shuts itself down after about twenty minutes of use.',
    h1: 'it is overheating',
    h2: 'the power supply is failing',
    findings: ['It survives far longer when it is running on battery', 'It shuts down sooner when the room is warm', 'The screen flickers just before it shuts itself down', 'It makes no unusual sound at any point'],
    k1: 1,
    k2: 0,
    check: 'Run it on battery in a cool room and time how long it lasts',
    checkDecoys: [
      'Reinstall the operating system and see whether it still happens',
      'Note the exact time of each shutdown over the next few days',
      'Leave it switched off for a day and then try using it as normal',
    ],
  },
  {
    setup: 'A pond is losing water faster than evaporation could explain.',
    h1: 'the liner has a hole below the waterline',
    h2: 'the stream feeding it has been diverted',
    findings: ['The level stops falling once it reaches a certain depth', 'The inflow pipe is dry when you put a hand to it', 'The water is clearer than it was in the spring', 'Frogs are still using the pond in just the way they always did'],
    k1: 0,
    k2: 1,
    check: 'Mark the level, then check both the mark and the inflow each morning',
    checkDecoys: [
      'Top the pond up with a hose and watch what happens next',
      'Measure exactly how much the level drops in a single day',
      'Look up how much a pond of this size would lose to evaporation in summer',
    ],
  },
  {
    setup: 'A choir sounds flat in the second half of every concert.',
    h1: 'the singers are tiring',
    h2: 'the hall warms up and the piano drifts',
    findings: ['The piano is flat too when it is checked at the interval', 'Only the sopranos slip, and only on the highest lines', 'The audience applauds just as warmly at the end', 'The programme this year is a good deal longer than it was last year'],
    k1: 1,
    k2: 0,
    check: 'Put a tuner on the piano and on the choir at the start and again later',
    checkDecoys: [
      'Rehearse the second half more often before the next concert',
      'Record the concert so that the flatness can be heard again',
      'Ask the singers afterwards whether they were feeling tired towards the end',
    ],
  },
  {
    setup: 'A bakery finds its cakes are drier than they were.',
    h1: 'the oven is running hot',
    h2: 'the flour has been changed to a stronger one',
    findings: ['The crusts are darker than they used to be as well', 'The batter takes noticeably more water to come together', 'The finished cakes weigh much the same as they have always done', 'The tins are the same ones used last year'],
    k1: 0,
    k2: 1,
    check: 'Bake one batch of the old recipe with a thermometer inside the oven',
    checkDecoys: [
      'Change the oven and the flour together and taste the result',
      'Weigh a finished cake to record exactly how much it has lost',
      'Ask customers whether they have noticed the cakes being drier lately',
    ],
  },
  {
    setup: 'A weather station reports rain on days when none falls.',
    h1: 'the gauge is catching run-off from the roof',
    h2: 'the recorder is picking up electrical noise',
    findings: ['The false readings come only after a windy night', 'The false readings appear in bursts of a fixed size', 'The station has been in the same place for six years', 'The gauge is the same model as the one nearby'],
    k1: 0,
    k2: 1,
    check: 'Compare each false reading against the wind record for that night',
    checkDecoys: [
      'Move the station and replace the recorder at the same time',
      'Count how many false readings there were during the month',
      'Check whether the nearby station reported rain on those days as well',
    ],
  },
  {
    setup: 'A newsletter has stopped reaching about half its readers.',
    h1: 'the mailing list has been cut in half by an error',
    h2: 'the message is being filtered out as junk',
    findings: ['The sending report shows far fewer addresses than before', 'The sending report is unchanged but far fewer opens follow', 'Nobody has written in to say the newsletter is missing', 'The newsletter looks exactly the same as it did in previous months'],
    k1: 0,
    k2: 1,
    check: 'Compare the number of addresses sent to with the number of opens',
    checkDecoys: [
      'Send the newsletter again and hope more people receive it',
      'Write down how many people opened the last three newsletters',
      'Ask two readers whether they remember getting the last one at all',
    ],
  },
  {
    setup: 'A greenhouse heater is burning through fuel far too quickly.',
    h1: 'the thermostat is set higher than anyone realises',
    h2: 'the greenhouse is losing heat through a gap',
    findings: ['The inside temperature runs well above the target all night', 'The heater runs constantly and the inside stays barely warm', 'The fuel tank is the same one used last winter', 'The heater is serviced at the same time every year'],
    k1: 0,
    k2: 1,
    check: 'Log the inside temperature overnight next to the heater running time',
    checkDecoys: [
      'Turn the thermostat down and seal the frame in the same week',
      'Record how much fuel is used over the course of one week',
      'Ask the supplier whether other customers are using more fuel this winter',
    ],
  },
]

const hypoPredict = tpl(
  {
    id: 'iq-hypo-predict',
    name: 'Write both predictions first',
    skillIds: ['i-hypo'],
    bucket: 'investigator',
    difficulty: 3,
    variants: 8,
    minutes: 4.5,
    kind: 'multi',
    transfer: true,
  },
  (rng, seed) => {
    const c = cycle(seed, PREDICT_CASES)
    return {
      title: 'Two predictions, then one check',
      prompt:
        `${c.setup}\n\nTwo explanations are possible: ${c.h1}, or ${c.h2}.\n\n` +
        'Before deciding what to do, say what each explanation would lead you to find.',
      hints: [
        'Take each explanation on its own and finish the sentence "if this is what is happening, then I would expect to see...".',
        'Two of the four findings would happen whichever explanation is right, so neither of them can be the prediction of one and not the other.',
        `Worked path: the two explanations predict different things, and the check to run is the one that looks at exactly that difference — ${c.check.charAt(0).toLowerCase()}${c.check.slice(1)}.`,
      ],
      explanation:
        `If ${c.h1}, you would expect: **${c.findings[c.k1]}**. If ${c.h2}, you would expect: **${c.findings[c.k2]}**.\n\n` +
        `Those two predictions differ, and the check worth doing is the one that looks straight at the difference: ${c.check.charAt(0).toLowerCase()}${c.check.slice(1)}.\n\n` +
        `The order matters more than it looks. Writing the predictions first means the check is chosen by what would separate the explanations. Choosing the check first — which is what most people do — means the predictions get written afterwards, to fit whatever the check happened to show.`,
      parts: [
        part('Prediction one', {
          prompt: `If ${c.h1}, which of these would you expect to find?`,
          answer: mcq(rng, c.findings[c.k1], c.findings.filter((_, i) => i !== c.k1)),
          explanation:
            `**${c.findings[c.k1]}** is what this explanation actually implies. Two of the other options would be true whichever explanation is right, which is exactly why they are no use as predictions.`,
          hints: [
            'Ignore the other explanation for a moment and follow this one through on its own.',
            'Ask which of the four findings this explanation, and only this explanation, would produce.',
            `Worked path: **${c.findings[c.k1]}**`,
          ],
        }),
        part('Prediction two', {
          prompt: `Now the other one. If ${c.h2}, which of these would you expect to find?`,
          answer: mcq(rng, c.findings[c.k2], c.findings.filter((_, i) => i !== c.k2)),
          explanation:
            `**${c.findings[c.k2]}**. Notice that this is a different finding from the one the first explanation predicted — which is what makes the pair of them useful. If both explanations had predicted the same thing, no check could tell them apart.`,
          hints: [
            'Same move again, on the second explanation, without looking back at your first answer.',
            'If you find yourself choosing the same finding for both explanations, one of the two predictions is wrong.',
            `Worked path: **${c.findings[c.k2]}**`,
          ],
        }),
        part('The check', {
          prompt: 'Given those two predictions, what is worth doing?',
          answer: mcq(rng, c.check, [...c.checkDecoys]),
          explanation:
            `**${c.check}** This is the one action whose result lands on the difference between the two predictions. Recording the symptom more precisely, or acting on both explanations at once, both leave the question exactly where it was.`,
          hints: [
            'You now have two different predictions. Which action would show you which of the two is happening?',
            'An action that changes two things at once cannot tell you which change mattered.',
            `Worked path: **${c.check}**`,
          ],
        }),
      ],
    }
  },
)
// ===========================================================================
// i-forecast — probabilities you can be scored on
// ===========================================================================

/**
 * All Brier arithmetic is done in INTEGER PERCENT SPACE and divided by 10000
 * exactly once, at the end. Working in decimals instead produces
 * `(0.1 - 0) ** 2 === 0.010000000000000002`, and a sum of three such terms
 * carries the dust into the learner-facing string. Probabilities are multiples
 * of 5, so every squared term is a multiple of 25 and every displayed score
 * lands on at most four decimal places.
 */
interface BrierCase {
  context: string
  rows: [event: string, percent: number, happened: boolean][]
}

const BRIER_CASES: BrierCase[] = [
  {
    context: 'A student wrote down three forecasts on Sunday evening.',
    rows: [
      ['The bus would be late at least once', 70, true],
      ['It would rain during Wednesday practice', 40, false],
      ['The club would reach its fundraising target', 90, false],
    ],
  },
  {
    context: 'A gardening group made three forecasts in March.',
    rows: [
      ['The first beans would be up within two weeks', 80, true],
      ['The frost would return after the clocks changed', 30, true],
      ['The water butt would run dry before June', 20, false],
    ],
  },
  {
    context: 'A cycling club made three forecasts before its spring ride.',
    rows: [
      ['Everyone would finish inside four hours', 60, false],
      ['At least one puncture would happen', 85, true],
      ['The cafe stop would take over an hour', 50, true],
    ],
  },
  {
    context: 'A shop owner forecast three things about the new stock.',
    rows: [
      ['The blue mugs would sell out first', 45, false],
      ['The whole delivery would arrive on time', 75, true],
      ['At least one box would be damaged', 25, true],
    ],
  },
  {
    context: 'A drama club forecast three things about its summer show.',
    rows: [
      ['Every seat would sell for the Saturday', 55, true],
      ['The set would be finished a week early', 20, false],
      ['At least one lead would miss a rehearsal', 95, true],
    ],
  },
  {
    context: 'A weather-watching group made three forecasts for the month.',
    rows: [
      ['The month would end wetter than average', 65, false],
      ['There would be frost on at least three nights', 90, true],
      ['The river would reach the flood marker', 15, false],
    ],
  },
  {
    context: 'A student forecast three things about the end of term.',
    rows: [
      ['The maths test would be moved', 35, true],
      ['The trip would be cancelled', 10, false],
      ['The library would open at weekends', 50, false],
    ],
  },
  {
    context: 'A choir made three forecasts before the regional competition.',
    rows: [
      ['They would place in the top half', 60, true],
      ['The coach would arrive late', 40, true],
      ['They would sing the new piece from memory', 85, false],
    ],
  },
  {
    context: 'A repair group forecast three things about a month of jobs.',
    rows: [
      ['More than twenty items would come in', 75, true],
      ['At least half would be fixed the same day', 55, false],
      ['A part would have to be ordered in', 80, true],
    ],
  },
  {
    context: 'A bakery forecast three things about a new loaf.',
    rows: [
      ['It would sell out on the first Saturday', 50, true],
      ['It would still be on the menu in a month', 70, true],
      ['A customer would ask for it sliced', 30, false],
    ],
  },
  {
    context: 'A five-a-side team forecast three things about the season.',
    rows: [
      ['They would win the opening match', 45, false],
      ['They would finish above halfway', 65, true],
      ['Nobody would be injured all season', 15, false],
    ],
  },
  {
    context: 'A film society forecast three things about the autumn programme.',
    rows: [
      ['The opening night would fill the room', 40, true],
      ['A speaker would cancel at short notice', 60, false],
      ['Membership would pass a hundred', 25, true],
    ],
  },
]

const brierTotal = tpl(
  {
    id: 'iq-fc-brier-total',
    name: 'Score a whole set of forecasts',
    skillIds: ['i-forecast'],
    bucket: 'investigator',
    difficulty: 3,
    variants: 12,
    minutes: 3.5,
    calibration: true,
  },
  (_rng, seed) => {
    const c = cycle(seed, BRIER_CASES)
    const squares = c.rows.map(([, p, happened]) => (p - (happened ? 100 : 0)) ** 2)
    const terms = squares.map((sq) => round(sq / 10000, 4))
    const total = round(squares.reduce((a, b) => a + b, 0) / 10000, 4)
    const lines = c.rows
      .map(([event, p, happened]) => `- ${event} — said **${p}%**, and it **${happened ? 'happened' : 'did not happen'}**.`)
      .join('\n')
    const working = c.rows
      .map(([, p, happened], i) => `(${p / 100} − ${happened ? 1 : 0})² = ${terms[i]}`)
      .join(', ')
    const worst = c.rows
      .map(([, p, happened], i) => ({ p, happened, term: terms[i] }))
      .sort((a, b) => b.term - a.term)[0]
    return {
      title: 'Add up the score',
      prompt:
        `${c.context}\n\n${lines}\n\n` +
        'The score for one forecast is **(probability − outcome)²**, where the outcome counts as 1 if it happened and 0 if it did not. Lower is better.\n\n' +
        'What do the three scores add up to?',
      answer: numeric(total),
      hints: [
        'Turn each outcome into a number first — 1 for happened, 0 for did not — and turn each percentage into a decimal.',
        'Then subtract, square, and only add at the very end. Squaring is what makes the sign stop mattering.',
        `Worked path: ${working}. Adding those gives **${total}**.`,
      ],
      explanation:
        `${working}, so the three add up to **${total}**.\n\n` +
        `The heaviest single term is the ${worst.p}% forecast on something that ${worst.happened ? 'happened' : 'did not happen'}, at ${worst.term}. That is the squaring doing its job: the further a forecast sat from what actually occurred, the more it costs, and the cost climbs faster than the distance does.\n\n` +
        `Two facts about this scoring rule are worth carrying. A flat 50% always scores exactly 0.25, whatever happens — so hedging is safe and can never be good. And the rule is built so that the lowest score you can expect comes from writing down the probability you actually believe; shading a number to protect your average makes your expected score worse, not better. That is what makes a scored forecast an honest claim rather than a hedge.`,
    }
  },
)

const FC_PAIRS: [string, string][] = [
  ['the school play sells out its first night', 'the bus route changes before September'],
  ['the club finishes the season unbeaten', 'the hall roof is repaired before winter'],
  ['the river reaches the flood marker', 'the new footbridge opens on time'],
  ['the shop stays open past nine all summer', 'the market moves to a different street'],
  ['the choir places in the top three', 'the rehearsal night moves to a Thursday'],
  ['the allotment site fills every plot', 'the water supply is cut off for a week'],
  ['the library extends its Saturday hours', 'the mobile van stops visiting the village'],
  ['the team reaches the county final', 'the pitch is closed for drainage work'],
  ['the newsletter passes two hundred readers', 'the printing cost rises before spring'],
  ['the orchestra fills every seat in June', 'the conductor steps down at the end of term'],
  ['the cafe adds a second serving counter', 'the delivery slot moves to the morning'],
  ['the festival runs across both weekends', 'the field is too wet to use in May'],
]

const FC_NAMES = ['Ana', 'Ben', 'Cal', 'Dev']

const brierRank = tpl(
  {
    id: 'iq-fc-order',
    name: 'Rank four forecasters by their scores',
    skillIds: ['i-forecast'],
    bucket: 'investigator',
    difficulty: 4,
    variants: 12,
    minutes: 4,
  },
  (rng, seed) => {
    const [e1, e2] = cycle(seed, FC_PAIRS)
    const choices = [10, 20, 30, 40, 50, 60, 70, 80, 90]
    let people: { name: string; p1: number; p2: number; score: number }[] = []
    // Resample until all four totals are distinct: a tie would make the
    // ranking ambiguous and the item unanswerable as posed.
    for (let attempt = 0; attempt < 400; attempt++) {
      people = FC_NAMES.map((name) => {
        const p1 = choices[Math.floor(rng() * choices.length)]
        const p2 = choices[Math.floor(rng() * choices.length)]
        return { name, p1, p2, score: (p1 - 100) ** 2 + p2 ** 2 }
      })
      if (new Set(people.map((p) => p.score)).size === 4) break
    }
    const { list, correct } = orderKey(people, (p) => -p.score)
    const options = list.map((p) => `${p.name} — ${p.p1}% and ${p.p2}%`)
    const ranked = correct.map((i) => `${list[i].name} (${round(list[i].score / 10000, 4)})`).join(', then ')
    const lines = list.map((p) => `- ${p.name}: **${p.p1}%** and **${p.p2}%**`).join('\n')
    return {
      title: 'Best score first',
      prompt:
        `Four people forecast the same two things: first, that ${e1}; second, that ${e2}.\n\n${lines}\n\n` +
        `In the end the first one **happened** and the second one **did not**.\n\n` +
        'Score each forecast as **(probability − outcome)²**, then add the two scores for each person together. Rank the four people, best (lowest total) first.',
      answer: { type: 'order', options, correct },
      hints: [
        'Write the two outcomes as numbers before anything else: the first is 1, the second is 0.',
        'For each person you need two subtractions and two squares. Nobody can be ranked on one forecast alone — a good first guess and a bad second one can still lose.',
        `Worked path: ${ranked}.`,
      ],
      explanation:
        `Totals, best first: ${ranked}.\n\n` +
        `Notice what the ranking is NOT. It is not "who was closest on the first one", and it is not "who sounded most confident". A person who was nearly right on the event that happened can still finish last by being badly wrong on the one that did not, because both forecasts count and being confident in the wrong direction is punished hardest.\n\n` +
        `This is why forecasting is scored over a set rather than a single call. One lucky forecast says almost nothing; a total across several says something, and a total across dozens says quite a lot.`,
    }
  },
)

const TRACK_CONTEXTS: [string, string][] = [
  ['school and club events', 'sports results'],
  ['weather over the weekend', 'delivery arrival times'],
  ['whether homework would be set', 'whether trains would run late'],
  ['bus arrival times', 'match results in the local league'],
  ['whether the shop would have stock', 'whether the film would sell out'],
  ['garden jobs finishing on time', 'rain during the afternoon'],
  ['exam topics coming up', 'club attendance on a Friday'],
  ['parcel delivery days', 'whether the pool would be busy'],
  ['practice sessions being cancelled', 'library books arriving in time'],
  ['weekend plans going ahead', 'the cafe running out of soup'],
  ['bike repairs taking one visit', 'the field being playable'],
  ['friends replying the same day', 'the bus being standing-room only'],
]

const trackCalibration = tpl(
  {
    id: 'iq-fc-track',
    name: 'What a batch of forecasts should have done',
    skillIds: ['i-forecast'],
    bucket: 'investigator',
    difficulty: 3,
    variants: 12,
    minutes: 4,
    kind: 'multi',
    calibration: true,
  },
  (rng, seed) => {
    const [topicA, topicB] = cycle(seed, TRACK_CONTEXTS)
    const n1 = 20 + (seed % 5) * 10
    const pct1 = [60, 70, 80, 90][seed % 4]
    const n2 = 20 + ((seed + 2) % 4) * 10
    const pct2 = [50, 60, 70, 80][(seed + 1) % 4]
    const exp1 = (n1 * pct1) / 100
    const exp2 = (n2 * pct2) / 100
    const under = seed % 2 === 0
    const gap = Math.max(3, Math.round(n2 * 0.2))
    const actual2 = under ? Math.min(n2, exp2 + gap) : Math.max(0, exp2 - gap)
    const keyUnder = 'Underconfident there — the real rate ran higher than claimed'
    const keyOver = 'Overconfident there — the real rate ran lower than claimed'
    const key = actual2 > exp2 ? keyUnder : keyOver
    return {
      title: 'Check a batch against itself',
      prompt:
        `Over a term someone recorded every forecast they made and sorted them by the number they had written down.\n\n` +
        `- **${n1}** forecasts about ${topicA}, each given a **${pct1}%** chance.\n` +
        `- **${n2}** forecasts about ${topicB}, each given a **${pct2}%** chance.\n\n` +
        `A well-calibrated forecaster is one whose ${pct1}% forecasts come true about ${pct1} times in every 100 — no more and no less.`,
      hints: [
        'A percentage is a claim about a whole group, not about any one forecast. Apply it to the group and see what number it predicts.',
        `For the first group: ${pct1} out of every 100, applied to ${n1} forecasts.`,
        `Worked path: ${n1} × ${pct1} ÷ 100 = ${exp1}, and ${n2} × ${pct2} ÷ 100 = ${exp2}.`,
      ],
      explanation:
        `The ${pct1}% group should produce about **${exp1}** hits out of ${n1}, and the ${pct2}% group about **${exp2}** out of ${n2}.\n\n` +
        `In fact the second group produced ${actual2}, which is ${Math.abs(actual2 - exp2)} ${actual2 > exp2 ? 'more' : 'fewer'} than the number claimed. Said the other way round: the forecaster wrote ${pct2}% and the world delivered about ${Math.round((actual2 / n2) * 100)}%.\n\n` +
        `That is the whole trick of checking your own forecasts. A single call cannot be right or wrong as a probability — only the batch can. Sorting your forecasts by the number you wrote and counting each pile is the only way a probability ever gets checked, and it needs no special tools, just the record.`,
      parts: [
        part('First group', {
          prompt: `Of the ${n1} forecasts given a ${pct1}% chance, how many should come true if the forecaster is well calibrated?`,
          answer: numeric(exp1),
          explanation:
            `${pct1} out of every 100 means ${pct1 / 100} of the group, so ${n1} × ${pct1} ÷ 100 = **${exp1}**. This is a prediction about the pile as a whole; no single forecast in it is expected to be ${pct1}% true.`,
          hints: [
            `Take ${pct1}% of ${n1}.`,
            `Each forecast contributes ${pct1 / 100} of a hit on average.`,
            `Worked path: ${n1} × ${pct1} ÷ 100 = ${exp1}.`,
          ],
        }),
        part('Second group', {
          prompt: `And of the ${n2} forecasts given a ${pct2}% chance?`,
          answer: numeric(exp2),
          explanation:
            `${n2} × ${pct2} ÷ 100 = **${exp2}**. Doing this for every pile is what a calibration check is: expected count against actual count, group by group.`,
          hints: [
            `Same method, different numbers: ${pct2}% of ${n2}.`,
            `Take ${pct2 / 100} of ${n2}.`,
            `Worked path: ${n2} × ${pct2} ÷ 100 = ${exp2}.`,
          ],
        }),
        part('The verdict', {
          prompt: `In fact **${actual2}** of those ${n2} came true. What does that say about the ${pct2}% forecasts?`,
          answer: mcq(rng, key, [
            key === keyUnder ? keyOver : keyUnder,
            'About right, given how few forecasts that group holds',
            'It cannot be judged without knowing which weeks the forecasts covered',
            'Simply luck',
          ]),
          explanation:
            `${actual2} out of ${n2} is about ${Math.round((actual2 / n2) * 100)}%, against the ${pct2}% claimed — so the forecaster was **${actual2 > exp2 ? 'underconfident' : 'overconfident'}** on this pile. ` +
            `Being underconfident is a real error, not a safe hedge: it costs score in exactly the same way, and it hides knowledge you actually had.`,
          hints: [
            'Compare the number that actually happened with the number the percentage predicted.',
            'More than predicted means the true rate was higher than claimed; fewer means it was lower.',
            `Worked path: ${actual2} against an expected ${exp2}.`,
          ],
        }),
      ],
    }
  },
)

interface ResolveCase {
  topic: string
  key: string
  decoys: [string, string, string]
}

/**
 * The key is deliberately the CRISP option and the decoys are the woolly ones,
 * several of which run longer than it. Length as a cue therefore points the
 * wrong way here, which is the honest way round for a question about whether a
 * claim has been pinned down.
 */
const RESOLVE_CASES: ResolveCase[] = [
  {
    topic: 'a school club',
    key: 'Will the club have over 60 paid members on 1 March?',
    decoys: [
      'Will the club really be doing well?',
      'Will the club have a genuinely successful year, taking everything into account and allowing for how hard the term has been?',
      'Will people generally feel that the club has grown in the way it ought to have grown by now?',
    ],
  },
  {
    topic: 'a bus route',
    key: 'Will the 8:14 bus arrive by 8:20 on at least 15 of the next 20 school days?',
    decoys: [
      'Will the bus service improve?',
      'Will the bus service become the sort of service that people can genuinely rely on for getting to school?',
      'Will most people agree, by the end of the year, that the buses have got better than they used to be?',
    ],
  },
  {
    topic: 'a garden',
    key: 'Will the first bean flower open before 15 June?',
    decoys: [
      'Will this be a good year for beans?',
      'Will the beans do noticeably better than they did last year, once everything has been taken into consideration?',
      'Will the garden as a whole turn out to have been worth all the effort that has gone into it this spring?',
    ],
  },
  {
    topic: 'a repair',
    key: 'Will the bike be ridden again before the end of April?',
    decoys: [
      'Will the repair be a proper job?',
      'Will the bike end up being repaired to a standard that would satisfy somebody who really knew about bikes?',
      'Will the repair prove, in the long run, to have been the sensible choice rather than buying a new one?',
    ],
  },
  {
    topic: 'a piece of writing',
    key: 'Will the essay be handed in before the deadline on Friday?',
    decoys: [
      'Will the essay turn out well?',
      'Will the essay be good enough that it would be worth showing to somebody outside the class as an example?',
      'Will the writing feel, on rereading it in a month, like the best work that could have been done in the time?',
    ],
  },
  {
    topic: 'a village hall',
    key: 'Will the hall take more than £400 in hire fees in October?',
    decoys: [
      'Will the hall be busier this year?',
      'Will the hall come to be regarded by the village as somewhere worth going to on an ordinary weekday evening?',
      'Will the committee end up feeling that the changes they made to the booking system were the right ones?',
    ],
  },
  {
    topic: 'a running plan',
    key: 'Will a 5 km run be finished under 25 minutes before 30 September?',
    decoys: [
      'Will the training plan actually work?',
      'Will the running get to the point where it feels easy rather than something that has to be forced every week?',
      'Will this turn out to have been the year when running finally became a habit rather than an occasional effort?',
    ],
  },
  {
    topic: 'a shop',
    key: 'Will the shop still be open for business on 1 December?',
    decoys: [
      'Will the shop survive the winter?',
      'Will the shop come through the quiet months in a condition that its owner would describe as healthy?',
      'Will the decision to stay open through January look, by the spring, like it was the right one to have made?',
    ],
  },
  {
    topic: 'a music group',
    key: 'Will the group play at least four paid gigs before the end of term?',
    decoys: [
      'Will the band get anywhere this year?',
      'Will the band reach the sort of level where other people start treating it as a serious group rather than a hobby?',
      'Will the members look back on this year as the one where the group finally started to go somewhere worthwhile?',
    ],
  },
  {
    topic: 'a weather claim',
    key: 'Will more than 40 mm of rain fall at the village gauge in May?',
    decoys: [
      'Will it be a wet spring this year?',
      'Will the spring turn out wet enough that people around here start complaining about it in the usual way?',
      'Will this spring end up being remembered as one of the wetter ones in recent years by most of the people here?',
    ],
  },
]

const resolvable = tpl(
  {
    id: 'iq-fc-resolve',
    name: 'Which forecast can actually be scored?',
    skillIds: ['i-forecast'],
    bucket: 'investigator',
    difficulty: 2,
    variants: 10,
    minutes: 2.5,
  },
  (rng, seed) => {
    const c = cycle(seed, RESOLVE_CASES)
    return {
      title: 'Pin the question down',
      prompt:
        `Four versions of the same question about ${c.topic}. You are going to write a probability beside one of them and check it later.\n\n` +
        'Which version could be settled as clearly right or clearly wrong when the time comes?',
      answer: mcq(rng, c.key, [...c.decoys]),
      hints: [
        'Imagine the day arrives. For each version, ask: could two reasonable people who both saw what happened still disagree about whether it came true?',
        'A question that can be settled names a deadline, a measurable thing, and a level that counts as yes.',
        `Worked path: **${c.key}**`,
      ],
      explanation:
        `**${c.key}**\n\n` +
        'It names a date, a quantity and a threshold, so on the day there is nothing left to argue about. That is the whole requirement.\n\n' +
        'The other three sound more thoughtful, and two of them are longer, which is exactly the trap. Words like "well", "successful", "reliable" and "worth it" move to fit whatever happened, so a forecast attached to them can never be wrong — and a claim that cannot be wrong cannot be evidence of good judgement either.\n\n' +
        'Vague forecasts are not modest. They are unfalsifiable, which is a stronger claim to safety than any number you could write down, and it is bought by giving up the ability to learn anything from the result.',
    }
  },
)
// ===========================================================================
// i-abduce — rank explanations by what they cover and what they assume
// ===========================================================================

/**
 * The trade-off rule used here — one more fact explained is worth about one
 * more assumption, and no more — is a WORKING RULE, not a finding. No study
 * backs the exchange rate, and the explanations say so in plain words. It is
 * stated inside the prompt so the item has a definite answer, and its only
 * real job is to stop "it explains everything" being read as "it is therefore
 * the best explanation".
 */
interface AbduceCase {
  setup: string
  facts: [string, string, string, string]
  /** Four explanations; `covers` holds 1-based fact numbers. */
  exps: { label: string; text: string; covers: number[]; assumes: string[] }[]
}

const ABDUCE_CASES: AbduceCase[] = [
  {
    setup: 'A community centre finds its electricity bill has tripled since October.',
    facts: [
      'The bill tripled between September and October.',
      'The meter reading climbs even on days the building is shut.',
      'The main hall has felt cold all autumn.',
      'A new tenant took the back office in September.',
    ],
    exps: [
      { label: 'A', text: 'The hall heating was rerouted to warm the back office for the new tenant, so it runs day and night and never reaches the hall.', covers: [1, 2, 3, 4], assumes: ['the rerouting was done in September'] },
      { label: 'B', text: 'The hall thermostat has failed and is calling for heat constantly while a broken damper vents it outside.', covers: [1, 2, 3, 4], assumes: ['the thermostat failed in September', 'the damper broke at the same time', 'the tenant arriving was a coincidence'] },
      { label: 'C', text: 'The hall heating is running full time through a fault, and the extra bill is all from that.', covers: [1, 2, 3], assumes: ['the fault began in September'] },
      { label: 'D', text: 'The electricity supplier has changed its tariff and is charging a higher rate.', covers: [1], assumes: ['no letter about it arrived'] },
    ],
  },
  {
    setup: 'A school library finds books going missing from one section only.',
    facts: [
      'Only the graphic-novel shelves lose books.',
      'The losses happen on Tuesdays and Thursdays.',
      'The security gate never sounds.',
      'The section sits out of sight of the desk.',
    ],
    exps: [
      { label: 'A', text: 'Books are being taken out through the fire door beside that section.', covers: [1, 3, 4], assumes: ['the fire door alarm is off'] },
      { label: 'B', text: 'Books are being taken through the fire door, the gate has been sabotaged, and the timetable puts a free period there twice a week.', covers: [1, 2, 3, 4], assumes: ['the gate was sabotaged', 'the fire alarm was disabled', 'two separate people are involved'] },
      { label: 'C', text: 'Books are being taken during the two free periods that section is unsupervised, and carried out unscanned.', covers: [1, 2, 3, 4], assumes: ['the gate only reads the tags at the desk'] },
      { label: 'D', text: 'The books are being reshelved wrongly by helpers and are still in the building.', covers: [1], assumes: ['nobody has searched the other shelves'] },
    ],
  },
  {
    setup: 'A market stall is taking less money than it did a year ago.',
    facts: [
      'Takings are down about a third.',
      'The number of customers is unchanged.',
      'The stall next door has closed.',
      'The stall stopped selling hot drinks in spring.',
    ],
    exps: [
      { label: 'A', text: 'Customers used to buy a drink alongside their order, and that line has gone.', covers: [1, 2, 4], assumes: ['drinks were about a third of takings'] },
      { label: 'B', text: 'The neighbouring closure has cut the footfall that used to spill across.', covers: [1, 3], assumes: ['the customer count is being miscounted'] },
      { label: 'C', text: 'Drinks were dropped, the neighbour closed, prices were cut, and the till has been undercounting.', covers: [1, 2, 3, 4], assumes: ['prices were cut without anyone recording it', 'the till is faulty', 'three changes landed in the same season'] },
      { label: 'D', text: 'The stall stopped selling drinks and the neighbouring closure took the passing trade with it.', covers: [1, 2, 3, 4], assumes: ['the two changes happened in the same season'] },
    ],
  },
  {
    setup: 'A rowing club finds its boats are taking on water.',
    facts: [
      'Three boats of the same age are affected.',
      'The water appears after the boats sit on the rack.',
      'None of the three has been in a collision.',
      'All three were re-varnished last summer.',
    ],
    exps: [
      { label: 'A', text: 'The varnish used last summer has cracked with age and lets water through the seams.', covers: [1, 2, 3, 4], assumes: ['the varnish batch was faulty'] },
      { label: 'B', text: 'The rack straps are pressing on the hulls hard enough to open the seams.', covers: [1, 2, 3], assumes: ['the straps were overtightened'] },
      { label: 'C', text: 'A faulty varnish batch, badly set racks, and rainwater blowing in under the doors are all contributing.', covers: [1, 2, 3, 4], assumes: ['the varnish was faulty', 'the racks were badly set', 'the doors leak as well'] },
      { label: 'D', text: 'The boats are simply old, and old boats leak.', covers: [1], assumes: ['age alone explains the timing'] },
    ],
  },
  {
    setup: 'A weather station is producing readings that do not match its neighbours.',
    facts: [
      'Its temperatures run about two degrees high.',
      'The gap is widest on sunny afternoons.',
      'Its rainfall figures agree with everyone else.',
      'A shed was built beside it in March.',
    ],
    exps: [
      { label: 'A', text: 'The new shed reflects afternoon sun onto the temperature screen.', covers: [1, 2, 3, 4], assumes: ['the shed wall faces the screen'] },
      { label: 'B', text: 'The temperature sensor has drifted and now reads consistently high.', covers: [1, 3], assumes: ['the drift started in March'] },
      { label: 'C', text: 'The sensor has drifted, the shed reflects sun, the screen has lost its paint, and the logger clock is wrong.', covers: [1, 2, 3, 4], assumes: ['the sensor drifted', 'the paint has failed', 'the clock is wrong too'] },
      { label: 'D', text: 'The neighbouring stations are the ones that are wrong.', covers: [1], assumes: ['several stations failed together'] },
    ],
  },
  {
    setup: 'A bakery is finding its bread does not rise on some days.',
    facts: [
      'The failures come in runs of two or three days.',
      'The same recipe works perfectly in between.',
      'The failures started when a new flour arrived.',
      'The kitchen thermometer reads the same all week.',
    ],
    exps: [
      { label: 'A', text: 'One pallet of the new flour is damaged, and it is used up over two or three days at a time.', covers: [1, 2, 3, 4], assumes: ['the damage affects whole pallets'] },
      { label: 'B', text: 'The yeast is dying in storage and recovers when a new tub is opened.', covers: [1, 2], assumes: ['the storage temperature swings'] },
      { label: 'C', text: 'Damaged flour, dying yeast, a faulty thermometer and a change in the water supply are all at work.', covers: [1, 2, 3, 4], assumes: ['the flour is damaged', 'the yeast is dying', 'the thermometer lies', 'the water changed'] },
      { label: 'D', text: 'The baker is measuring the water differently on some mornings.', covers: [2], assumes: ['the measuring changed without notice'] },
    ],
  },
  {
    setup: 'A cycle path is collecting broken glass at one particular bend.',
    facts: [
      'The glass appears at the same bend each week.',
      'It is nearly always the same kind of bottle.',
      'The bin twenty metres away is usually empty.',
      'The bend is the only spot hidden from the road.',
    ],
    exps: [
      { label: 'A', text: 'People stop at the one spot out of sight, drink there, and drop the bottles rather than walk on.', covers: [1, 2, 3, 4], assumes: ['the same group returns each week'] },
      { label: 'B', text: 'A bin lorry loses bottles as it turns the bend on collection day.', covers: [1, 2], assumes: ['the lorry route passes there'] },
      { label: 'C', text: 'Bottles fall from a lorry, the bin has been welded shut, cyclists drop them, and a shop nearby sells that brand only.', covers: [1, 2, 3, 4], assumes: ['a lorry passes weekly', 'the bin is unusable', 'a nearby shop sells only that brand'] },
      { label: 'D', text: 'The council has stopped sweeping that stretch of path.', covers: [1], assumes: ['sweeping stopped recently'] },
    ],
  },
  {
    setup: 'A pottery class finds glazes coming out patchy on some pieces only.',
    facts: [
      'Only pieces from the back of the kiln are patchy.',
      'The same glaze works on the front shelves.',
      'The patches are always on the upward faces.',
      'The kiln was moved closer to the wall in June.',
    ],
    exps: [
      { label: 'A', text: 'Dust falls from the wall onto the upward faces of the pieces nearest the back.', covers: [1, 2, 3, 4], assumes: ['the wall sheds dust when the kiln heats'] },
      { label: 'B', text: 'The back of the kiln runs cooler than the front and the glaze never matures there.', covers: [1, 2], assumes: ['the back element is weak'] },
      { label: 'C', text: 'A weak element, falling dust, a bad glaze batch and uneven stacking are all playing a part.', covers: [1, 2, 3, 4], assumes: ['an element is weak', 'the glaze batch is bad', 'the stacking is uneven'] },
      { label: 'D', text: 'The glaze is being stirred too little before use.', covers: [2], assumes: ['stirring changed this term'] },
    ],
  },
]

const abduceCover = tpl(
  {
    id: 'iq-ab-cover',
    name: 'Coverage against assumptions',
    skillIds: ['i-abduce'],
    bucket: 'investigator',
    difficulty: 3,
    variants: 8,
    minutes: 3.5,
  },
  (rng, seed) => {
    const c = cycle(seed, ABDUCE_CASES)
    const full = c.exps.filter((e) => e.covers.length === c.facts.length)
    const key = [...full].sort((a, b) => a.assumes.length - b.assumes.length)[0]
    const rival = [...full].sort((a, b) => b.assumes.length - a.assumes.length)[0]
    const factList = c.facts.map((f, i) => `${i + 1}. ${f}`).join('\n')
    const expList = c.exps
      .map(
        (e) =>
          `- **Explanation ${e.label}.** ${e.text}\n  - Accounts for: ${e.covers.join(', ')}.\n  - Has to assume: ${e.assumes.join('; ')}.`,
      )
      .join('\n')
    return {
      title: 'Which explanation is strongest?',
      prompt:
        `${c.setup}\n\nFour things are known:\n\n${factList}\n\nFour explanations are on the table:\n\n${expList}\n\n` +
        'Which is the strongest explanation? An explanation is stronger when it accounts for more of the facts, and weaker for every extra thing it has to assume.',
      answer: mcq(
        rng,
        `Explanation ${key.label}`,
        c.exps.filter((e) => e.label !== key.label).map((e) => `Explanation ${e.label}`),
      ),
      hints: [
        'Two numbers per explanation: how many of the four facts it accounts for, and how many separate things it has to assume.',
        'Start by crossing off the ones that leave facts unexplained. Then compare what is left on assumptions alone.',
        `Worked path: **Explanation ${key.label}** accounts for all four and assumes ${key.assumes.length}. Explanation ${rival.label} also accounts for all four but assumes ${rival.assumes.length}.`,
      ],
      explanation:
        `**Explanation ${key.label}.** It accounts for all four facts while assuming only ${key.assumes.length} thing${key.assumes.length === 1 ? '' : 's'}.\n\n` +
        `The dangerous rival is Explanation ${rival.label}, which also accounts for everything — and that is exactly what makes it dangerous. It buys the last few facts by assuming ${rival.assumes.length} separate things all happened to be true at once, and every one of those is a further claim that could be wrong. An explanation that can be made to fit anything, given enough extra assumptions, is not telling you much about this case.\n\n` +
        `The two thin explanations fail the other way: they leave facts sitting there unexplained, and a fact you have decided to ignore is still a fact.\n\n` +
        `Worth being honest about: there is no proven exchange rate between "one more fact covered" and "one more assumption needed". Nothing measured says how to trade them. What the comparison does reliably do is stop the widest explanation winning simply because it is widest.`,
    }
  },
)

/** [facts in play, assumptions explanation A needs, assumptions explanation B needs]. */
const ASSUME_PARAMS: [number, number, number][] = [
  [4, 2, 1],
  [5, 4, 1],
  [6, 3, 2],
  [4, 5, 1],
  [5, 3, 2],
  [6, 5, 2],
  [4, 3, 1],
  [5, 2, 1],
  [6, 4, 1],
  [4, 4, 2],
  [5, 5, 2],
  [6, 2, 1],
]

const ASSUME_TOPICS: string[] = [
  'a run of faults on one bus route',
  'a set of odd readings from a school weather station',
  'a string of complaints about one delivery round',
  'a group of plants dying in one corner of a garden',
  'a batch of photographs that all came out badly',
  'a set of late finishes on one production line',
  'a run of dropped calls in one part of a building',
  'a series of failures in one kind of repair job',
  'a cluster of returns of one product line',
  'a set of unexplained charges on one account',
  'a group of members leaving one club section',
  'a run of missed collections on one street',
]

const abduceAssume = tpl(
  {
    id: 'iq-ab-assume',
    name: 'What the last fact costs',
    skillIds: ['i-abduce'],
    bucket: 'investigator',
    difficulty: 4,
    variants: 12,
    minutes: 3,
  },
  (rng, seed) => {
    const [n, a, b] = ASSUME_PARAMS[seed % ASSUME_PARAMS.length]
    const topic = cycle(seed, ASSUME_TOPICS)
    const extra = a - b
    const keyA = 'A, because one more fact covered is worth one more assumption'
    const keyB = 'B, because the extra fact costs more assumptions than it is worth'
    const key = extra <= 1 ? keyA : keyB
    const pool = [
      keyA,
      keyB,
      'A, because an explanation that leaves a fact out is incomplete',
      'B, because the simpler story is always the one to believe',
      'Neither, since coverage and assumptions are not the same kind of thing at all',
    ]
    return {
      title: 'Paying for coverage',
      prompt:
        `A group is trying to explain **${n}** separate facts about ${topic}.\n\n` +
        `- **Explanation A** accounts for all ${n} of them, but only if **${a}** separate unlikely things all happened to be true.\n` +
        `- **Explanation B** accounts for **${n - 1}** of them and needs only **${b}**; the remaining one has an ordinary, separate cause of its own.\n\n` +
        `Use this working rule: one more fact covered is worth about one more assumption, and no more.\n\n` +
        'Which explanation is stronger, and why?',
      answer: mcq(
        rng,
        key,
        pool.filter((o) => o !== key),
      ),
      hints: [
        'Line the two up on both counts before choosing: facts covered, and assumptions needed.',
        `Explanation A covers one more fact than B. Work out how many extra assumptions that one fact costs: ${a} − ${b}.`,
        `Worked path: the extra fact costs **${extra}** extra assumption${extra === 1 ? '' : 's'}, so ${extra <= 1 ? 'it is worth paying and A wins' : 'it is too expensive and B wins'}.`,
      ],
      explanation:
        `**${key}**\n\n` +
        `Explanation A covers one more fact than B and costs ${a} − ${b} = **${extra}** extra assumption${extra === 1 ? '' : 's'} to do it. Under the rule stated in the question, ${extra <= 1 ? 'that is a fair price, so A is the stronger of the two' : 'that is more than the extra fact is worth, so B is the stronger of the two'}.\n\n` +
        `The wrong reasons matter as much as the wrong answers here. "It leaves a fact out, so it is incomplete" treats coverage as the only thing that counts, which is what lets an explanation win by piling on assumptions. "The simpler story is always right" treats assumptions as the only thing that counts, which would leave you preferring an explanation that explains nothing at all. Both are half of the comparison.\n\n` +
        `Say plainly what this rule is: a working rule, not a measured finding. Nothing in the research says one fact is worth exactly one assumption, and anyone who tells you the exchange rate precisely is inventing it. What the comparison is reliably good for is noticing when an explanation is only winning because it has been allowed to assume its way to a perfect fit.`,
    }
  },
)

interface RankExp {
  label: string
  text: string
  covers: number
  assumes: number
}

interface AbRankCase {
  setup: string
  total: number
  exps: [RankExp, RankExp, RankExp]
}

const AB_RANK_CASES: AbRankCase[] = [
  {
    setup: 'A village shop has five odd facts about its missing stock.',
    total: 5,
    exps: [
      { label: 'A', text: 'A delivery has been counted twice in the records', covers: 3, assumes: 1 },
      { label: 'B', text: 'Stock is walking out through the unwatched side door', covers: 5, assumes: 2 },
      { label: 'C', text: 'Four separate errors have piled up over the same month', covers: 5, assumes: 4 },
    ],
  },
  {
    setup: 'A leisure centre has six facts about its rising water bill.',
    total: 6,
    exps: [
      { label: 'A', text: 'A pipe under the changing rooms has been leaking since spring', covers: 6, assumes: 1 },
      { label: 'B', text: 'The pool is being refilled more often than the log records', covers: 4, assumes: 1 },
      { label: 'C', text: 'A leak, a faulty meter and an unrecorded refill are all involved', covers: 6, assumes: 3 },
    ],
  },
  {
    setup: 'A farm has five facts about a field that yielded badly.',
    total: 5,
    exps: [
      { label: 'A', text: 'The seed drill was set too deep across that whole field', covers: 5, assumes: 1 },
      { label: 'B', text: 'The field is short of one nutrient after two heavy crops', covers: 3, assumes: 1 },
      { label: 'C', text: 'Deep drilling, poor seed and a wet April together did the damage', covers: 5, assumes: 3 },
    ],
  },
  {
    setup: 'A theatre has six facts about its falling ticket sales.',
    total: 6,
    exps: [
      { label: 'A', text: 'The online booking page has been broken on phones since June', covers: 5, assumes: 1 },
      { label: 'B', text: 'The programme this season is aimed at a different audience', covers: 4, assumes: 2 },
      { label: 'C', text: 'A broken page, a poor programme and a rival venue all combined', covers: 6, assumes: 3 },
    ],
  },
  {
    setup: 'A workshop has five facts about tools going blunt too fast.',
    total: 5,
    exps: [
      { label: 'A', text: 'The new timber batch has grit embedded in its surface', covers: 5, assumes: 1 },
      { label: 'B', text: 'The sharpening jig has been set at the wrong angle', covers: 4, assumes: 2 },
      { label: 'C', text: 'Gritty timber, a bad jig and a cheaper steel are all at work', covers: 5, assumes: 3 },
    ],
  },
  {
    setup: 'A charity has six facts about donations arriving late.',
    total: 6,
    exps: [
      { label: 'A', text: 'The bank changed its clearing times at the start of the year', covers: 4, assumes: 1 },
      { label: 'B', text: 'The reminder letters are going out a fortnight later than before', covers: 6, assumes: 2 },
      { label: 'C', text: 'Slow clearing, late letters and a lost mailing list all matter here', covers: 6, assumes: 4 },
    ],
  },
  {
    setup: 'A hospital radio group has five facts about dead air on Sundays.',
    total: 5,
    exps: [
      { label: 'A', text: 'The Sunday presenter is arriving after the handover time', covers: 5, assumes: 1 },
      { label: 'B', text: 'The playout computer restarts itself on Sunday mornings', covers: 3, assumes: 1 },
      { label: 'C', text: 'A late presenter, a restarting computer and a loose lead all play a part', covers: 5, assumes: 3 },
    ],
  },
  {
    setup: 'A canal society has six facts about a lock that keeps jamming.',
    total: 6,
    exps: [
      { label: 'A', text: 'Silt has built up behind the lower gate over the winter', covers: 6, assumes: 1 },
      { label: 'B', text: 'The gate hinges have worn and the gate now sits lower', covers: 5, assumes: 2 },
      { label: 'C', text: 'Silt, worn hinges and a bent paddle rod are all contributing', covers: 6, assumes: 4 },
    ],
  },
  {
    setup: 'A photography club has five facts about washed-out prints.',
    total: 5,
    exps: [
      { label: 'A', text: 'The printer is being fed the wrong paper profile', covers: 5, assumes: 1 },
      { label: 'B', text: 'The screens in the club room have never been calibrated', covers: 4, assumes: 2 },
      { label: 'C', text: 'Wrong profile, uncalibrated screens and old ink all contribute', covers: 5, assumes: 3 },
    ],
  },
  {
    setup: 'A scout group has six facts about tents coming back damp.',
    total: 6,
    exps: [
      { label: 'A', text: 'The tents are being packed before the morning dew has dried', covers: 6, assumes: 1 },
      { label: 'B', text: 'The store shed has a leak in one corner of its roof', covers: 3, assumes: 1 },
      { label: 'C', text: 'Early packing, a leaking shed and torn groundsheets all combine', covers: 6, assumes: 3 },
    ],
  },
]

const abduceRank = tpl(
  {
    id: 'iq-ab-rank',
    name: 'Score the explanations and rank them',
    skillIds: ['i-abduce'],
    bucket: 'investigator',
    difficulty: 4,
    variants: 10,
    minutes: 3.5,
  },
  (rng, seed) => {
    const c = cycle(seed, AB_RANK_CASES)
    const { list, correct } = orderKey(shuffle(rng, c.exps), (e) => e.covers - e.assumes)
    const lines = list
      .map((e) => `- **${e.label}.** ${e.text} — accounts for **${e.covers}** of the ${c.total}, and needs **${e.assumes}** extra assumption${e.assumes === 1 ? '' : 's'}.`)
      .join('\n')
    const ranking = correct
      .map((i) => `${list[i].label} (${list[i].covers} − ${list[i].assumes} = ${list[i].covers - list[i].assumes})`)
      .join(', then ')
    return {
      title: 'Strongest first',
      prompt:
        `${c.setup}\n\n${lines}\n\n` +
        'Score each explanation as (facts accounted for) − (extra assumptions needed). Rank the three, highest score first.',
      answer: { type: 'order', options: list.map((e) => `${e.label} — ${e.text}`), correct },
      hints: [
        'Work out one number for each explanation before comparing any of them.',
        'The score subtracts, so an explanation that covers everything can still finish last if it had to assume enough to get there.',
        `Worked path: ${ranking}.`,
      ],
      explanation:
        `Highest score first: ${ranking}.\n\n` +
        'The interesting comparison is between the one that covers everything cheaply and the one that covers everything expensively. On coverage alone they are identical, so coverage alone cannot separate them — and coverage alone is what most people compare.\n\n' +
        'The one that covers less is not disgraced. It may well be the true one with a second, separate cause sitting beside it, which is why the scoring rule is a way of ordering explanations for testing rather than a way of deciding which is true.\n\n' +
        'Being straight about the rule: subtracting assumptions from facts is a rough device with no study behind it. It is here because it forces both halves of the comparison onto the page at once, not because the arithmetic is meaningful on its own.',
    }
  },
)

// ===========================================================================
// i-game / i-equilibrium / i-commit — payoff tables with computed answers
// ===========================================================================

interface GameScene {
  setup: string
  them: string
  /** Your two actions, deliberately the same length as each other. */
  you: [string, string]
  /** Their two actions, also equal length, so all four cell labels match. */
  theirs: [string, string]
  unit: string
}

/**
 * Action names inside a scenario are chosen at EQUAL character length. That
 * makes every "You X, they Y" cell label exactly the same length as every
 * other, so in the equilibrium and best-response items option length carries
 * no information at all — no hand-tuning, no drift when the bank grows.
 */
const GAME_SCENES: GameScene[] = [
  { setup: 'Two stalls at the same market each decide their price for the day.', them: 'the other stall', you: ['Match', 'Under'], theirs: ['Match', 'Under'], unit: 'points of profit' },
  { setup: 'Two clubs share a hall and each decides when to book its slot.', them: 'the other club', you: ['Early', 'Later'], theirs: ['Early', 'Later'], unit: 'points of usefulness' },
  { setup: 'Two teams on a joint project each decide how much to put in.', them: 'the other team', you: ['Train', 'Coast'], theirs: ['Train', 'Coast'], unit: 'points of credit' },
  { setup: 'Two shops on the same street each decide when to open on Sunday.', them: 'the other shop', you: ['Open', 'Shut'], theirs: ['Open', 'Shut'], unit: 'points of takings' },
  { setup: 'Two neighbours decide whether to clear the shared path themselves.', them: 'your neighbour', you: ['Clear', 'Leave'], theirs: ['Clear', 'Leave'], unit: 'points of comfort' },
  { setup: 'Two suppliers each decide whether to hold extra stock this month.', them: 'the other supplier', you: ['Stock', 'Order'], theirs: ['Stock', 'Order'], unit: 'points of margin' },
  { setup: 'Two societies each decide how to send out their notices.', them: 'the other society', you: ['Print', 'Email'], theirs: ['Print', 'Email'], unit: 'points of reach' },
  { setup: 'Two players in a duet each decide what to prepare for the concert.', them: 'your partner', you: ['Solo', 'Duet'], theirs: ['Solo', 'Duet'], unit: 'points of applause' },
  { setup: 'Two stallholders each decide whether to advertise the fair.', them: 'the other holder', you: ['Post', 'Wait'], theirs: ['Post', 'Wait'], unit: 'points of footfall' },
  { setup: 'Two groups sharing a minibus each decide when to claim it.', them: 'the other group', you: ['Push', 'Hold'], theirs: ['Push', 'Hold'], unit: 'points of value' },
  { setup: 'Two allotment holders each decide whether to build a shared shed.', them: 'the other holder', you: ['Build', 'Delay'], theirs: ['Build', 'Delay'], unit: 'points of benefit' },
  { setup: 'Two teams in a relay each decide how hard to go on the first leg.', them: 'the other team', you: ['Press', 'Guard'], theirs: ['Press', 'Guard'], unit: 'points of position' },
]

function payoffLines(s: GameScene, y: number[][]): string {
  return [
    `- You ${s.you[0]}, they ${s.theirs[0]}: **${y[0][0]}**`,
    `- You ${s.you[0]}, they ${s.theirs[1]}: **${y[0][1]}**`,
    `- You ${s.you[1]}, they ${s.theirs[0]}: **${y[1][0]}**`,
    `- You ${s.you[1]}, they ${s.theirs[1]}: **${y[1][1]}**`,
  ].join('\n')
}

const gameDominant = tpl(
  {
    id: 'iq-game-dominant',
    name: 'Is one choice better whatever they do?',
    skillIds: ['i-game'],
    bucket: 'investigator',
    difficulty: 3,
    variants: 12,
    minutes: 3,
  },
  (rng, seed) => {
    const s = cycle(seed, GAME_SCENES)
    // Two thirds of the seeds have a dominant action and one third has none, so
    // "find the dominant one" cannot be answered without checking.
    const wantDominant = seed % 3 !== 2
    let y: number[][] = [[0, 0], [0, 0]]
    for (let attempt = 0; attempt < 500; attempt++) {
      const vals = [0, 1, 2, 3].map(() => 1 + Math.floor(rng() * 9))
      y = [
        [vals[0], vals[1]],
        [vals[2], vals[3]],
      ]
      if (new Set(vals).size !== 4) continue
      const topWins = y[0][0] > y[1][0]
      const topWinsToo = y[0][1] > y[1][1]
      const hasDominant = topWins === topWinsToo
      if (hasDominant !== wantDominant) continue
      break
    }
    const topDominates = y[0][0] > y[1][0] && y[0][1] > y[1][1]
    const bottomDominates = y[1][0] > y[0][0] && y[1][1] > y[0][1]
    const key = topDominates
      ? `${s.you[0]} — better whichever they choose`
      : bottomDominates
        ? `${s.you[1]} — better whichever they choose`
        : 'It depends on their choice, so neither is always better'
    const pool = [
      `${s.you[0]} — better whichever they choose`,
      `${s.you[1]} — better whichever they choose`,
      'It depends on their choice, so neither is always better',
      'Both actions add up to the same total across the row, so it makes no difference',
    ]
    return {
      title: 'Check both columns',
      prompt:
        `${s.setup}\n\nYou pick ${s.you[0]} or ${s.you[1]}; ${s.them} picks ${s.theirs[0]} or ${s.theirs[1]}. ` +
        `Neither of you sees what the other has chosen.\n\nYour ${s.unit}:\n\n${payoffLines(s, y)}\n\n` +
        'Do you have a choice that is better for you whatever they do?',
      answer: mcq(
        rng,
        key,
        pool.filter((o) => o !== key),
      ),
      hints: [
        'Compare down the columns, not across the rows. Their choice is fixed inside a column, so a column is a fair comparison of your two options.',
        `If they ${s.theirs[0]}: ${y[0][0]} against ${y[1][0]}. If they ${s.theirs[1]}: ${y[0][1]} against ${y[1][1]}.`,
        `Worked path: **${key}**`,
      ],
      explanation:
        `**${key}**\n\n` +
        `If they ${s.theirs[0]} you get ${y[0][0]} for ${s.you[0]} against ${y[1][0]} for ${s.you[1]}. If they ${s.theirs[1]} you get ${y[0][1]} against ${y[1][1]}.\n\n` +
        (topDominates || bottomDominates
          ? `The same action wins in both columns, so it wins whatever they do — and that is worth knowing, because it means you can choose without predicting them at all. Guessing their move is the hardest part of any game like this, and a dominant action lets you skip it entirely.`
          : `One action wins in one column and the other wins in the other, so there is no answer that ignores what they do. That is not a failure of the table; it is the situation. What follows is that any confident advice here has a prediction about them hidden inside it, and the honest next move is to make that prediction explicit.`) +
        `\n\nThe common mistake is adding each row up and comparing the totals. That silently assumes the two columns are equally likely, which nothing here says.`,
    }
  },
)

const gameMaximin = tpl(
  {
    id: 'iq-game-maximin',
    name: 'What can you guarantee yourself?',
    skillIds: ['i-game'],
    bucket: 'investigator',
    difficulty: 3,
    variants: 12,
    minutes: 3,
  },
  (rng, seed) => {
    const s = cycle(seed, GAME_SCENES)
    let y: number[][] = [[0, 0], [0, 0]]
    for (let attempt = 0; attempt < 500; attempt++) {
      const vals = [0, 1, 2, 3].map(() => 1 + Math.floor(rng() * 12))
      y = [
        [vals[0], vals[1]],
        [vals[2], vals[3]],
      ]
      if (new Set(vals).size !== 4) continue
      const worstTop = Math.min(y[0][0], y[0][1])
      const worstBottom = Math.min(y[1][0], y[1][1])
      if (worstTop === worstBottom) continue
      // Keep the item interesting: the safe action must NOT also be the one
      // with the single largest payoff in the table, or "pick the big number"
      // would score full marks.
      const best = Math.max(...vals)
      const safeRow = worstTop > worstBottom ? 0 : 1
      if (y[safeRow].includes(best)) continue
      break
    }
    const worstTop = Math.min(y[0][0], y[0][1])
    const worstBottom = Math.min(y[1][0], y[1][1])
    const guarantee = Math.max(worstTop, worstBottom)
    const safe = worstTop > worstBottom ? s.you[0] : s.you[1]
    const biggest = Math.max(y[0][0], y[0][1], y[1][0], y[1][1])
    return {
      title: 'The best worst case',
      prompt:
        `${s.setup}\n\nYou pick ${s.you[0]} or ${s.you[1]}; ${s.them} picks ${s.theirs[0]} or ${s.theirs[1]}, and you cannot see their choice.\n\n` +
        `Your ${s.unit}:\n\n${payoffLines(s, y)}\n\n` +
        'Suppose you want the highest score you can be sure of, whatever they pick. What is that score?',
      answer: numeric(guarantee),
      hints: [
        'For each of your two actions, ignore the best that could happen and find the WORST that could happen.',
        `Choosing ${s.you[0]} you could end up with ${worstTop}; choosing ${s.you[1]} you could end up with ${worstBottom}.`,
        `Worked path: the better of those two floors is **${guarantee}**.`,
      ],
      explanation:
        `**${guarantee}.** The worst that ${s.you[0]} can bring is ${worstTop}, and the worst that ${s.you[1]} can bring is ${worstBottom}. Picking ${safe} means never scoring below ${guarantee}, whatever they do.\n\n` +
        `Notice what this deliberately ignores. The biggest number in the whole table is ${biggest}, and it is not on the row you would pick — the safe action gives that number up in exchange for a floor. That is the trade, and it is a choice rather than a rule: this way of choosing is right when a bad outcome would really hurt, and needlessly timid when the downside is survivable and you get many goes.\n\n` +
        `The move worth keeping is the first one: read each of your options by its WORST column rather than its best. Most confident plans are argued from their best column.`,
    }
  },
)

function bothPayoffLines(s: GameScene, y: number[][], t: number[][]): string {
  return [
    `- You ${s.you[0]}, they ${s.theirs[0]}: you **${y[0][0]}**, they **${t[0][0]}**`,
    `- You ${s.you[0]}, they ${s.theirs[1]}: you **${y[0][1]}**, they **${t[0][1]}**`,
    `- You ${s.you[1]}, they ${s.theirs[0]}: you **${y[1][0]}**, they **${t[1][0]}**`,
    `- You ${s.you[1]}, they ${s.theirs[1]}: you **${y[1][1]}**, they **${t[1][1]}**`,
  ].join('\n')
}

/**
 * Generates a 2x2 with no ties in any comparison either player ever makes, and
 * with exactly one cell where neither side wants to move. Without the resample
 * an item could quietly have two right answers, or none.
 */
function twoByTwo(rng: Rng, wantUniqueEquilibrium: boolean): { y: number[][]; t: number[][] } {
  let y: number[][] = [[0, 0], [0, 0]]
  let t: number[][] = [[0, 0], [0, 0]]
  for (let attempt = 0; attempt < 800; attempt++) {
    const yv = [0, 1, 2, 3].map(() => 1 + Math.floor(rng() * 9))
    const tv = [0, 1, 2, 3].map(() => 1 + Math.floor(rng() * 9))
    y = [
      [yv[0], yv[1]],
      [yv[2], yv[3]],
    ]
    t = [
      [tv[0], tv[1]],
      [tv[2], tv[3]],
    ]
    if (y[0][0] === y[1][0] || y[0][1] === y[1][1]) continue
    if (t[0][0] === t[0][1] || t[1][0] === t[1][1]) continue
    if (!wantUniqueEquilibrium) break
    let count = 0
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        if (y[i][j] > y[1 - i][j] && t[i][j] > t[i][1 - j]) count++
      }
    }
    if (count !== 1) continue
    break
  }
  return { y, t }
}

const bestResponse = tpl(
  {
    id: 'iq-eq-best-response',
    name: 'Best reply to each of their moves',
    skillIds: ['i-equilibrium'],
    bucket: 'investigator',
    difficulty: 3,
    variants: 12,
    minutes: 3,
  },
  (rng, seed) => {
    const s = cycle(seed, GAME_SCENES)
    const { y, t } = twoByTwo(rng, false)
    const replyTo0 = y[0][0] > y[1][0] ? 0 : 1
    const replyTo1 = y[0][1] > y[1][1] ? 0 : 1
    const label = (r0: number, r1: number) =>
      `If they ${s.theirs[0]}: ${s.you[r0]}. If they ${s.theirs[1]}: ${s.you[r1]}.`
    const key = label(replyTo0, replyTo1)
    return {
      title: 'Two questions, not one',
      prompt:
        `${s.setup}\n\nBoth sides choose at the same time. Each line gives your ${s.unit} first, then theirs:\n\n` +
        `${bothPayoffLines(s, y, t)}\n\n` +
        'What is your best reply to each of their two possible choices?',
      answer: mcq(rng, key, [
        label(replyTo0, 1 - replyTo1),
        label(1 - replyTo0, replyTo1),
        label(1 - replyTo0, 1 - replyTo1),
      ]),
      hints: [
        'A best reply is answered one column at a time. Fix their choice, then compare only your own two numbers inside that column.',
        `If they ${s.theirs[0]} your two numbers are ${y[0][0]} and ${y[1][0]}. If they ${s.theirs[1]} they are ${y[0][1]} and ${y[1][1]}.`,
        `Worked path: **${key}**`,
      ],
      explanation:
        `**${key}**\n\n` +
        `In the ${s.theirs[0]} column your two numbers are ${y[0][0]} and ${y[1][0]}, so ${s.you[replyTo0]} is your best reply there. In the ${s.theirs[1]} column they are ${y[0][1]} and ${y[1][1]}, so ${s.you[replyTo1]} wins that one.\n\n` +
        `Their numbers are printed beside yours and none of them entered this calculation. That is the point of the exercise: a best reply is a question about YOUR payoffs given a fixed choice of theirs, and mixing their numbers in is the commonest way of getting it wrong.\n\n` +
        `${replyTo0 === replyTo1 ? 'Here the same reply wins in both columns, which means it is a dominant choice and their move never has to be predicted at all.' : 'Here the two replies differ, which is exactly when predicting them starts to matter — and it is worth noticing that their best reply depends on you in the same way.'}`,
    }
  },
)

const equilibrium = tpl(
  {
    id: 'iq-eq-stable',
    name: 'The cell where nobody wants to move',
    skillIds: ['i-equilibrium'],
    bucket: 'investigator',
    difficulty: 4,
    variants: 12,
    minutes: 3.5,
  },
  (rng, seed) => {
    const s = cycle(seed, GAME_SCENES)
    const { y, t } = twoByTwo(rng, true)
    let ei = 0
    let ej = 0
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        if (y[i][j] > y[1 - i][j] && t[i][j] > t[i][1 - j]) {
          ei = i
          ej = j
        }
      }
    }
    const cell = (i: number, j: number) => `You ${s.you[i]}, they ${s.theirs[j]}`
    const key = cell(ei, ej)
    return {
      title: 'Find the stable pair',
      prompt:
        `${s.setup}\n\nEach line gives your ${s.unit} first, then theirs:\n\n${bothPayoffLines(s, y, t)}\n\n` +
        'In one of these four pairings, neither side could do better by changing their own choice on their own. Which one?',
      answer: mcq(rng, key, [cell(ei, 1 - ej), cell(1 - ei, ej), cell(1 - ei, 1 - ej)]),
      hints: [
        'Take each pairing in turn and ask two separate questions: could you gain by switching while they stay put, and could they gain by switching while you stay put?',
        'If either answer is yes, that pairing falls apart. Only the one where both answers are no can hold.',
        `Worked path: at **${key}** you have ${y[ei][ej]} against ${y[1 - ei][ej]} for switching, and they have ${t[ei][ej]} against ${t[ei][1 - ej]} for switching.`,
      ],
      explanation:
        `**${key}**\n\n` +
        `Check it from both sides. If you switched on your own you would go from ${y[ei][ej]} to ${y[1 - ei][ej]}, which is worse for you. If they switched on their own they would go from ${t[ei][ej]} to ${t[ei][1 - ej]}, which is worse for them. Neither has a reason to move, so it holds.\n\n` +
        `A stable pairing is not the same as the best pairing. There may well be a cell here where you both score higher — and it is still not stable, because getting there needs both of you to move at once, and each of you would gain by stepping back off it alone. That gap between "stable" and "good for everyone" is most of what makes agreements hard, and it is why the useful question is often not "what should we do?" but "what would each of us do next if we agreed?"\n\n` +
        `The usual mistake is looking for the pair with the biggest total. Nobody in this game is choosing the total.`,
    }
  },
)

interface CommitScene {
  setup: string
  other: string
  commitment: string
}

const COMMIT_SCENES: CommitScene[] = [
  { setup: 'Two market stalls can share the cost of one delivery van instead of hiring two.', other: 'the other stallholder', commitment: 'signing a fixed contract with the courier that leaves you unable to accept less' },
  { setup: 'Two clubs can share one hall booking instead of paying for two evenings.', other: 'the other club', commitment: 'voting your share into a locked account that only pays out at that level' },
  { setup: 'Two neighbours can share the cost of one fence instead of building two.', other: 'your neighbour', commitment: 'ordering the materials at that split in front of both households' },
  { setup: 'Two societies can share the cost of one printing run instead of two.', other: 'the other society', commitment: 'publishing your share in the minutes, which the committee cannot change alone' },
  { setup: 'Two growers can share one polytunnel instead of buying one each.', other: 'the other grower', commitment: 'paying that exact share up front, with no refund available' },
  { setup: 'Two teams can share one coach to an away fixture instead of two.', other: 'the other team', commitment: 'booking and paying your seats at that split before the meeting' },
  { setup: 'Two workshops can share one delivery of timber instead of two.', other: 'the other workshop', commitment: 'placing the order at that split, which the supplier will not amend' },
  { setup: 'Two choirs can share the hire of one accompanist instead of two.', other: 'the other choir', commitment: 'writing that share into a signed agreement both sides can read' },
  { setup: 'Two allotment holders can share one water delivery instead of two.', other: 'the other holder', commitment: 'paying that share into the site fund, which cannot be drawn back' },
  { setup: 'Two shops can share one window display instead of paying for two.', other: 'the other shop', commitment: 'announcing your share to the traders association in writing' },
]

const commitRemove = tpl(
  {
    id: 'iq-commit-remove',
    name: 'Why taking away your own option can win',
    skillIds: ['i-commit'],
    bucket: 'investigator',
    difficulty: 4,
    variants: 10,
    minutes: 4.5,
    kind: 'multi',
  },
  (rng, seed) => {
    const c = cycle(seed, COMMIT_SCENES)
    const total = 60 + (seed % 8) * 20
    const share = [0.6, 0.7, 0.75][seed % 3]
    const yours = Math.round(total * share)
    const theirs = total - yours
    const even = total / 2
    const key = 'It was public and could not be taken back, so their best reply changed'
    return {
      title: 'A door you cannot reopen',
      prompt:
        `${c.setup} Sharing saves **£${total}** a month between the two of you, and you have to agree how to split it. ` +
        `If you cannot agree, nothing is shared and both of you save nothing at all.\n\n` +
        `You are considering ${c.commitment}, at **£${yours}** for you — before ${c.other} has said anything.`,
      hints: [
        'Work out what each side ends up with in each of the two situations, and compare each amount with what they would get from no agreement at all.',
        `With nothing said, an even split of £${total} is the obvious landing point. With the commitment made, the only question left for them is whether £${theirs} beats nothing.`,
        `Worked path: £${even} each without the commitment, and £${yours} to you with it, because £${theirs} still beats £0 for them.`,
      ],
      explanation:
        `Without a commitment the two of you are arguing over £${total} with no reason for either side to give way, and an even £${even} each is where that usually lands.\n\n` +
        `Once the commitment is genuinely made, their choice is no longer "how much of the £${total} do I get" — it is "£${theirs} or nothing". They take the £${theirs}, and you end up with £${yours}.\n\n` +
        `What did the work is not the size of the demand. It is that the demand became TRUE: an option you used to have was removed in a way the other side can check, so their best reply changed. A claim that you would not go below £${yours} carries none of that force, because both of you know it could be dropped in the next sentence.\n\n` +
        `Two limits worth stating. This only works while the other side is still better off agreeing than walking away, so a commitment set too high destroys the deal and leaves you with nothing. And it only works because it is honest and visible — a bluff dressed up as a commitment is not the same move, it stops working the first time it is called, and it is the sort of tactic that only pays while nobody is looking closely.`,
      parts: [
        part('No commitment', {
          prompt: `If neither side does anything unusual and you simply split the £${total} evenly, how much do you get, in pounds?`,
          answer: numeric(even, { unit: '£' }),
          explanation:
            `Half of £${total} is **£${even}**. With nothing to separate the two of you, an even split is the natural landing point — neither side has a reason to concede more than the other.`,
          hints: [
            `Divide £${total} between two people equally.`,
            'Nothing in the situation yet favours either side.',
            `Worked path: ${total} ÷ 2 = ${even}.`,
          ],
        }),
        part('After the commitment', {
          prompt: `Now suppose the commitment is real and they can verify it. How much is left for them, in pounds?`,
          answer: numeric(theirs, { unit: '£' }),
          explanation:
            `£${total} − £${yours} = **£${theirs}**. The number that matters is not whether that feels fair; it is that £${theirs} is more than the £0 they get by refusing, so agreeing is now their better move.`,
          hints: [
            `Take your committed share off the total.`,
            `Then ask what they are comparing it with — what do they get if they refuse?`,
            `Worked path: ${total} − ${yours} = ${theirs}, against 0 for no deal.`,
          ],
        }),
        part('What did the work', {
          prompt: 'Why did the commitment change the outcome?',
          answer: mcq(rng, key, [
            'It sounded more determined than before',
            'It took a choice away from the other side, leaving them with nothing at all to decide about',
            'It was a bigger demand, and bigger demands tend to win out in the end',
          ]),
          explanation:
            `**${key}** They still have a free choice — take £${theirs} or take nothing — and they make it in their own interest. What changed is the set of options on YOUR side of the table, which is the whole trick: you got a better result by having fewer choices, not more.`,
          hints: [
            'Ask whose options actually changed when the commitment was made.',
            'The other side still chooses freely. Something about what they are choosing between is different.',
            `Worked path: **${key}**`,
          ],
        }),
      ],
    }
  },
)

interface CredibleCase {
  setup: string
  key: string
  decoys: [string, string, string]
  why: string
}

const CREDIBLE_CASES: CredibleCase[] = [
  {
    setup: 'A club wants a supplier to believe it will not pay above a set price.',
    key: 'It publishes the price cap in its minutes, which only a full vote can change',
    decoys: [
      'It says firmly that it will not pay more',
      'It tells the supplier privately that the committee is losing patience with the whole arrangement',
      'It writes the cap on an internal note that nobody outside the committee will ever see',
    ],
    why: 'A published cap that needs a vote to change is costly to reverse and visible to the other side. The other three cost nothing to drop.',
  },
  {
    setup: 'A student wants their study group to believe they will really leave at nine.',
    key: 'They book the last bus home and cannot get back afterwards',
    decoys: [
      'They announce at the start that they are leaving at nine',
      'They tell one member of the group quietly that they are hoping to get away by about nine',
      'They set an alarm on their phone which they can turn off without anybody in the room noticing',
    ],
    why: 'A booked last bus removes the option of staying. An announcement and an alarm both leave it fully available.',
  },
  {
    setup: 'A shop wants customers to believe its sale prices really end on Sunday.',
    key: 'The new price labels are printed and dated in the window from Monday',
    decoys: [
      'A sign says the sale ends on Sunday',
      'Staff are told to mention to anyone browsing that the offer will not be running for very much longer',
      'The manager privately decides that the discount will definitely be stopping at the end of the weekend',
    ],
    why: 'Dated labels already in the window would have to be visibly torn down to go back on it. A sign and a decision cost nothing to change.',
  },
  {
    setup: 'A band wants a venue to believe it will not play for less than its fee.',
    key: 'It has already accepted a clashing booking for that night at its fee',
    decoys: [
      'It states the fee clearly in every reply',
      'It mentions that other venues have been asking about that date and that things are getting quite busy',
      'It decides between the members that the fee is final and that nobody will agree to anything lower',
    ],
    why: 'A clashing booking makes playing for less physically impossible. The other three are all statements that could be withdrawn.',
  },
  {
    setup: 'A parent wants a teenager to believe screen time really ends at ten.',
    key: 'The router is on a timer switch that nobody in the house has the code for',
    decoys: [
      'The rule is written on the fridge door',
      'They explain carefully why late screens make the following school morning so much harder for everybody',
      'They say that from now on there will be consequences if the rule is broken more than once again',
    ],
    why: 'A timer with no accessible code takes the choice out of everyone is hands, including the parent is. Rules and warnings stay reversible every single night.',
  },
  {
    setup: 'A society wants members to believe the subscription deadline is fixed.',
    key: 'The membership list is sent to the printer on the deadline day itself',
    decoys: [
      'The deadline is printed in the newsletter',
      'The treasurer reminds people at every meeting that the deadline this year is going to be a firm one',
      'The committee agrees among themselves that late payments will not be accepted under any circumstances',
    ],
    why: 'Sending the list to a printer makes the list unchangeable by anyone in the society. Reminders and internal agreements do not.',
  },
  {
    setup: 'A runner wants a training partner to believe they will be at the six o clock run.',
    key: 'They have paid a non-refundable entry for a race that needs the training',
    decoys: [
      'They promise to be there every Tuesday',
      'They put the sessions in a shared calendar that either of them is able to move at any point',
      'They tell their partner that missing sessions is something they are really trying hard to stop doing',
    ],
    why: 'Money already spent cannot be recovered by staying in bed. A promise and a movable calendar entry both survive being ignored.',
  },
  {
    setup: 'A workshop wants a customer to believe the quote will not be revised.',
    key: 'The quote is signed by both sides with the price fixed in the terms',
    decoys: [
      'The quote is marked as final in the email',
      'The owner explains that quotes have been revised in the past but that this time it really will not happen',
      'The office notes internally that this particular quote should be treated as fixed whatever the customer says',
    ],
    why: 'A signed price is enforceable against the workshop as well as the customer. The rest are assurances the workshop could take back.',
  },
  {
    setup: 'A group wants a landlord to believe it will leave if the rent rises.',
    key: 'It has signed a lease on the alternative hall starting next quarter',
    decoys: [
      'It says it will move if the rent goes up',
      'It asks the landlord to consider how difficult a rise would make things for a group of this size',
      'It looks at three other halls and agrees at a meeting that moving would be perfectly possible',
    ],
    why: 'A signed lease elsewhere makes staying expensive. Looking at options and saying you might move leaves everything open.',
  },
  {
    setup: 'A committee wants a contractor to believe the finish date matters.',
    key: 'The hall is already booked and paid for the week after the finish date',
    decoys: [
      'The date is written into the brief in bold',
      'The chair tells the contractor that the committee would be extremely disappointed by any further delay',
      'The committee resolves privately that it will not tolerate the date slipping for a second time this year',
    ],
    why: 'A paid booking turns a missed date into a cost the committee cannot avoid, which is what makes the deadline real to the contractor.',
  },
]

const commitCredible = tpl(
  {
    id: 'iq-commit-credible',
    name: 'Which commitment would you believe?',
    skillIds: ['i-commit'],
    bucket: 'investigator',
    difficulty: 3,
    variants: 10,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, CREDIBLE_CASES)
    return {
      title: 'Words against locked doors',
      prompt:
        `${c.setup}\n\nFour things could be done. Which one would actually be believed by the other side, and why?`,
      answer: mcq(rng, c.key, [...c.decoys]),
      hints: [
        'A commitment is believed when the other side can see that going back on it would cost you something real.',
        'Ask of each option: what would it take to undo this quietly, and would anyone find out?',
        `Worked path: **${c.key}**`,
      ],
      explanation:
        `**${c.key}** ${c.why}\n\n` +
        'Two things make a commitment credible, and both have to be present. It has to be costly or impossible to reverse, and the other side has to be able to SEE that. A private decision can be perfectly sincere and still carry no weight, because sincerity is not observable and a change of mind leaves no trace.\n\n' +
        'This also explains why the strongest commitments feel uncomfortable. They work by removing your own room to manoeuvre, which is exactly the thing people are most reluctant to give up — and it is why "I might" and "I intend to" are so common: they keep the door open, and keeping the door open is what makes them worthless as commitments.\n\n' +
        'Worth saying plainly: this only works when the commitment is real. Pretending to have burnt a bridge you have not burnt is a different thing entirely, it fails the moment anyone checks, and it costs you the ability to be believed next time.',
    }
  },
)
// ===========================================================================
// One family each for the six remaining Uncertainty skills, plus i-bayes.
// Each is deliberately a move that `uncertaintyLab.ts` does not already carry.
// ===========================================================================

interface MixCase {
  place: string
  groupA: string
  groupB: string
  cond: string
}

const MIX_CASES: MixCase[] = [
  { place: 'A repair workshop takes in', groupA: 'kettles', groupB: 'toasters', cond: 'need a new element' },
  { place: 'A depot receives', groupA: 'pallets from the north yard', groupB: 'pallets from the docks', cond: 'arrive damaged' },
  { place: 'A nursery sows', groupA: 'trays of the old seed', groupB: 'trays of the new seed', cond: 'germinate within ten days' },
  { place: 'A print shop runs off', groupA: 'gloss posters', groupB: 'matt posters', cond: 'come out with a mark' },
  { place: 'A hire company sends out', groupA: 'bikes from the new fleet', groupB: 'bikes from the old fleet', cond: 'come back needing work' },
  { place: 'A bakery bakes', groupA: 'sourdough loaves', groupB: 'tin loaves', cond: 'are sold before noon' },
  { place: 'A library lends', groupA: 'reference copies', groupB: 'ordinary copies', cond: 'come back late' },
  { place: 'A cannery fills', groupA: 'cans on the old line', groupB: 'cans on the new line', cond: 'fail the seal check' },
  { place: 'A club sends out', groupA: 'letters by post', groupB: 'letters by email', cond: 'get a reply' },
  { place: 'A grower packs', groupA: 'hand-picked apples', groupB: 'machine-picked apples', cond: 'bruise in transit' },
  { place: 'A garage services', groupA: 'vans over five years old', groupB: 'newer vans', cond: 'need an extra part' },
  { place: 'A theatre sells', groupA: 'seats in the balcony', groupB: 'seats in the stalls', cond: 'go unsold on the night' },
]

/** [count in group A, count in group B, rate per 100 in A, rate per 100 in B]. */
const MIX_PARAMS: [number, number, number, number][] = [
  [200, 800, 30, 5],
  [400, 600, 25, 10],
  [100, 900, 60, 20],
  [300, 700, 40, 10],
  [600, 400, 15, 45],
  [800, 200, 5, 35],
  [600, 400, 20, 50],
  [200, 800, 75, 25],
  [900, 100, 10, 80],
  [400, 600, 55, 15],
  [700, 300, 30, 70],
  [100, 900, 90, 10],
]

const natfreqMix = tpl(
  {
    id: 'iq-nf-mix',
    name: 'Two groups of different sizes',
    skillIds: ['i-natfreq'],
    bucket: 'investigator',
    difficulty: 3,
    variants: 12,
    minutes: 3,
  },
  (_rng, seed) => {
    const c = cycle(seed, MIX_CASES)
    const [nA, nB, rA, rB] = MIX_PARAMS[seed % MIX_PARAMS.length]
    const hitsA = (nA * rA) / 100
    const hitsB = (nB * rB) / 100
    const total = hitsA + hitsB
    const naive = ((rA + rB) / 2) * 10
    return {
      title: 'Count them, do not average them',
      prompt:
        `${c.place} **${nA}** ${c.groupA} and **${nB}** ${c.groupB} in a month — **${nA + nB}** items in all.\n\n` +
        `- Of every 100 ${c.groupA}, **${rA}** ${c.cond}.\n` +
        `- Of every 100 ${c.groupB}, **${rB}** ${c.cond}.\n\n` +
        `Out of all ${nA + nB} items, how many ${c.cond}?`,
      answer: numeric(total),
      hints: [
        'Do not touch the two rates until you have turned each one into a COUNT. A rate is a fact about its own group and cannot be compared with a rate from a group of a different size.',
        `Among the ${nA} ${c.groupA}: ${rA} in every 100, so ${nA / 100} hundreds gives ${hitsA}. Do the same for the other group.`,
        `Worked path: ${hitsA} + ${hitsB} = **${total}**.`,
      ],
      explanation:
        `**${total}.** Counting each group separately: ${hitsA} of the ${nA} ${c.groupA}, plus ${hitsB} of the ${nB} ${c.groupB}.\n\n` +
        `The tempting answer is ${naive}, which comes from averaging the two rates — ${rA} and ${rB} give ${(rA + rB) / 2} in every 100, and ${(rA + rB) / 2}% of ${nA + nB} is ${naive}. That would be right if the two groups were the same size, and they are not. Averaging the rates quietly gives the small group and the large group an equal vote.\n\n` +
        `Whenever two rates have to be combined, the safe move is the same one every time: turn each into a count of actual things, add the counts, and only then turn back into a rate if you need one. It takes one extra line and it removes the whole class of mistake.`,
    }
  },
)

interface NarrowCase {
  setting: string
  outcome: string
  narrowGroup: string
  thisOne: string
}

const NARROW_CASES: NarrowCase[] = [
  { setting: 'A workshop has records of past repair jobs', outcome: 'were finished the same day', narrowGroup: 'jobs on the same make of machine', thisOne: 'Today a machine of that make comes in.' },
  { setting: 'A club has records of past open evenings', outcome: 'drew more than forty people', narrowGroup: 'evenings held in the summer term', thisOne: 'The next one falls in the summer term.' },
  { setting: 'A grower has records of past sowings', outcome: 'germinated within two weeks', narrowGroup: 'sowings made under glass', thisOne: 'The next sowing will be under glass.' },
  { setting: 'A courier has records of past deliveries', outcome: 'arrived before noon', narrowGroup: 'deliveries to the northern yard', thisOne: 'The next one goes to the northern yard.' },
  { setting: 'A theatre has records of past productions', outcome: 'sold out the opening night', narrowGroup: 'productions with a Saturday opening', thisOne: 'The next one opens on a Saturday.' },
  { setting: 'A team has records of past league matches', outcome: 'ended in a win', narrowGroup: 'matches played away from home', thisOne: 'The next match is away from home.' },
  { setting: 'A shop has records of past new lines', outcome: 'were still stocked a year later', narrowGroup: 'lines suggested by staff', thisOne: 'The next new line was suggested by staff.' },
  { setting: 'A choir has records of past competitions', outcome: 'placed in the top half', narrowGroup: 'competitions with a set piece', thisOne: 'The next competition has a set piece.' },
  { setting: 'A society has records of past guest talks', outcome: 'filled the room', narrowGroup: 'talks given on a Friday evening', thisOne: 'The next talk is on a Friday evening.' },
  { setting: 'A garage has records of past services', outcome: 'needed no extra parts', narrowGroup: 'services on vans under three years old', thisOne: 'The next van in is two years old.' },
  { setting: 'A bakery has records of past special orders', outcome: 'were collected on time', narrowGroup: 'orders placed more than a week ahead', thisOne: 'The next order was placed ten days ahead.' },
  { setting: 'A hall has records of past bookings', outcome: 'were paid before the day', narrowGroup: 'bookings made by regular hirers', thisOne: 'The next booking is from a regular hirer.' },
]

/** [broad total, broad hits, narrow total, narrow hits]. Narrow is a subgroup. */
const NARROW_PARAMS: [number, number, number, number][] = [
  [60, 24, 20, 12],
  [50, 30, 8, 2],
  [40, 14, 25, 13],
  [80, 28, 6, 3],
  [100, 45, 40, 26],
  [200, 70, 4, 3],
  [25, 16, 5, 4],
  [50, 28, 30, 21],
  [40, 22, 20, 5],
  [20, 13, 4, 1],
  [100, 38, 25, 12],
  [60, 33, 8, 6],
]

const refclassNarrow = tpl(
  {
    id: 'iq-rc-narrower',
    name: 'Closer cases, or more of them?',
    skillIds: ['i-refclass'],
    bucket: 'investigator',
    difficulty: 4,
    variants: 12,
    minutes: 3.5,
  },
  (_rng, seed) => {
    const c = cycle(seed, NARROW_CASES)
    const [bN, bH, nN, nH] = NARROW_PARAMS[seed % NARROW_PARAMS.length]
    const broadRate = (bH * 100) / bN
    const narrowRate = (nH * 100) / nN
    const bigEnough = nN >= 10
    const answer = bigEnough ? narrowRate : broadRate
    return {
      title: 'Which record should anchor it',
      prompt:
        `${c.setting}. Of the last **${bN}**, **${bH}** ${c.outcome}.\n\n` +
        `Within those same ${bN} there were **${nN}** ${c.narrowGroup}, and **${nH}** of those ${c.outcome}.\n\n` +
        `${c.thisOne}\n\n` +
        `Use this working rule: prefer the closer-matching group, but only while it holds at least **10** cases; below that its rate is mostly noise.\n\n` +
        `Out of every 100 similar occasions, how many ${c.outcome}?`,
      answer: numeric(answer, { unit: 'per 100' }),
      hints: [
        'Work out both rates first, rescaled to be out of 100, and only then decide which of the two to keep.',
        `The wider group gives ${bH} out of ${bN}. The closer group gives ${nH} out of ${nN}, and there are ${nN} cases in it.`,
        `Worked path: the closer group holds ${nN} cases, which is ${bigEnough ? 'enough, so its rate is the one to use' : 'too few, so fall back on the wider group'} — **${answer}** per 100.`,
      ],
      explanation:
        `**${answer} out of every 100.** The wider record reads ${broadRate} per 100 and the closer one reads ${narrowRate} per 100, and ${bigEnough ? `the closer group has ${nN} cases in it, which is enough to trust` : `the closer group has only ${nN} cases in it, which is too few to trust`}.\n\n` +
        (bigEnough
          ? `Both numbers are true. They answer different questions, and the closer group answers the one actually being asked, because ${c.thisOne.charAt(0).toLowerCase()}${c.thisOne.slice(1, -1)}.`
          : `The closer group looks like the better match, and it is — that is exactly the trap. With ${nN} cases the only rates available are a handful of coarse steps, so whatever it reports is mostly an accident of which few cases happened to land in it.`) +
        `\n\nThis is the trade that makes reference classes hard. Narrowing the group makes it more like this case and makes its rate wobblier, and there is no formula that says where to stop. The 10-case line used here is a working rule rather than a finding: it is a place to stop arguing, not a discovery. What is not a matter of judgement is that BOTH numbers should be worked out before either is chosen — the mistake worth avoiding is narrowing until the rate agrees with you and then stopping.`,
    }
  },
)

interface RegressCase {
  setting: string
  units: string
  measure: string
  n: number
  top: boolean
}

const REGRESS_CASES: RegressCase[] = [
  { setting: 'A county runs a spelling contest for its primary schools', units: 'schools', measure: 'average score', n: 40, top: true },
  { setting: 'A club times every member over one lap of the track', units: 'runners', measure: 'lap time', n: 30, top: false },
  { setting: 'A market records takings for every stall on one Saturday', units: 'stalls', measure: 'takings', n: 50, top: true },
  { setting: 'A firm scores every delivery round for one week', units: 'rounds', measure: 'on-time share', n: 24, top: false },
  { setting: 'A festival scores every act on one night', units: 'acts', measure: 'audience rating', n: 36, top: true },
  { setting: 'A network grades every weather station on one month', units: 'stations', measure: 'accuracy score', n: 60, top: false },
  { setting: 'A league records goals for every player over one month', units: 'players', measure: 'goals scored', n: 45, top: true },
  { setting: 'A school ranks every tutor group on one attendance week', units: 'groups', measure: 'attendance rate', n: 28, top: false },
  { setting: 'A garden society judges every plot on one visit', units: 'plots', measure: 'judging score', n: 32, top: true },
  { setting: 'A charity scores every shop on one month of sales', units: 'shops', measure: 'sales figure', n: 20, top: false },
]

const sampleRegress = tpl(
  {
    id: 'iq-ss-regress',
    name: 'What the extremes do next time',
    skillIds: ['i-samplesize'],
    bucket: 'investigator',
    difficulty: 3,
    variants: 10,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, REGRESS_CASES)
    const five = 5
    const keyTop = 'The top group will average lower next time, with nothing having changed'
    const keyBottom = 'The bottom group will average higher next time, with nothing changed'
    const key = c.top ? keyTop : keyBottom
    return {
      title: 'The second round',
      prompt:
        `${c.setting}, and every one of the ${c.n} ${c.units} is measured once. The whole thing will be repeated next month in exactly the same way.\n\n` +
        `Nothing is going to change in between: no training, no new equipment, no new rules.\n\n` +
        `Look at the **${c.top ? 'top' : 'bottom'} ${five}** ${c.units} by ${c.measure} this month. What should you expect from that group next month?`,
      answer: mcq(rng, key, [
        'The group will hold its position, because the ranking reflects real skill',
        'The whole field will improve, because everybody has had more practice',
        'The gap will widen, since early success feeds confidence',
        'The second round will come out much the same, because the same people take part in it',
      ]),
      hints: [
        'A single measurement is made of two things added together: how good something really is, and how the day happened to go.',
        `To reach the very ${c.top ? 'top' : 'bottom'} of ${c.n} ${c.units} in one go, both parts usually have to line up — genuinely ${c.top ? 'good' : 'weak'} AND a ${c.top ? 'lucky' : 'bad'} day. The luck half does not repeat.`,
        `Worked path: **${key}**`,
      ],
      explanation:
        `**${key}**\n\n` +
        `Any single measurement is a real level plus whatever the day added or took away. The ${c.top ? 'top' : 'bottom'} ${five} of ${c.n} were picked BY that measurement, so they are the ones where both parts pointed the same way, and the day-to-day part does not come back next month. The group therefore drifts toward the middle — not because anything about them changed, but because the way they were selected cannot be repeated.\n\n` +
        `This is why it is so easy to believe in interventions that do nothing. Give extra help to the bottom group and they improve; the improvement would have happened anyway. Praise the top group and they fall back; the falling back would have happened anyway. To find out whether the help worked you need a comparison group that was picked the same way and left alone, and without that the pattern above is guaranteed to produce a result.\n\n` +
        `The size of the effect depends on how much of the score is luck. With ${c.units} measured just once, that share is large.`,
    }
  },
)

interface AbsenceCase {
  setup: string
  hypA: string
  hypB: string
  sign: string
}

const ABSENCE_CASES: AbsenceCase[] = [
  { setup: 'A boiler keeps losing pressure.', hypA: 'a leak in the pipework', hypB: 'a failing expansion vessel', sign: 'a damp mark shows on a ceiling' },
  { setup: 'A field of wheat has patchy growth.', hypA: 'waterlogging in the hollows', hypB: 'a shortage of nitrogen', sign: 'the patches follow the low ground' },
  { setup: 'A car will not start on cold mornings.', hypA: 'a tired battery', hypB: 'a fuel line problem', sign: 'the starter turns over slowly' },
  { setup: 'A phone loses signal at home only.', hypA: 'new metal-lined blinds', hypB: 'a mast fault in the area', sign: 'other phones in the house are fine' },
  { setup: 'A hall floor is marked each Monday.', hypA: 'the cleaning machine leaks', hypB: 'equipment is dragged across', sign: 'the marks follow the machine route' },
  { setup: 'A camera keeps producing dark photographs.', hypA: 'a stuck exposure setting', hypB: 'a dirty filter on the lens', sign: 'every shot is dark by the same amount' },
  { setup: 'A beehive is producing far less honey.', hypA: 'the queen has been lost', hypB: 'the forage nearby has failed', sign: 'no new brood appears for three weeks' },
  { setup: 'A website slows at certain hours.', hypA: 'a backup running on a timer', hypB: 'a surge of real visitors', sign: 'the slowdown begins at the same minute' },
  { setup: 'A pond has turned green.', hypA: 'the pump has stopped circulating', hypB: 'run-off is feeding the algae', sign: 'the surface stays flat on windy days' },
  { setup: 'A kiln fires unevenly along one shelf.', hypA: 'an element has failed', hypB: 'the shelf is packed too tightly', sign: 'the cool zone is a wide even band' },
  { setup: 'A radio show loses listeners on the half hour.', hypA: 'the transmitter dips then', hypB: 'listeners leave when adverts start', sign: 'online listening drops at the same time' },
  { setup: 'A hedge has died along one stretch.', hypA: 'road salt reaching the roots', hypB: 'a fungus spreading down the row', sign: 'the dead stretch is one unbroken run' },
]

/** [times in 100 under A, times in 100 under B] — chosen so the absence ratio divides exactly. */
const ABSENCE_PARAMS: [number, number][] = [
  [90, 20],
  [80, 20],
  [95, 25],
  [90, 30],
  [75, 25],
  [90, 10],
  [80, 40],
  [96, 20],
  [85, 25],
  [90, 50],
  [92, 20],
  [88, 40],
]

const diagnosticAbsence = tpl(
  {
    id: 'iq-dg-absence',
    name: 'What the missing sign tells you',
    skillIds: ['i-diagnostic'],
    bucket: 'investigator',
    difficulty: 4,
    variants: 12,
    minutes: 3,
  },
  (_rng, seed) => {
    const c = cycle(seed, ABSENCE_CASES)
    const [x, y] = ABSENCE_PARAMS[seed % ABSENCE_PARAMS.length]
    const absentA = 100 - x
    const absentB = 100 - y
    const ratio = absentB / absentA
    const presentRatio = round(x / y, 2)
    return {
      title: 'The dog that did not bark',
      prompt:
        `${c.setup} It could be ${c.hypA} or ${c.hypB}.\n\n` +
        `- Out of every 100 cases caused by ${c.hypA}, ${c.sign} in **${x}** of them.\n` +
        `- Out of every 100 caused by ${c.hypB}, it happens in **${y}** of them.\n\n` +
        `This time the sign is **absent**. How many times more common is that absence when ${c.hypB} is behind it?`,
      answer: numeric(ratio, { unit: 'times' }),
      hints: [
        'Every one of the 100 cases either shows the sign or does not. So write down the two counts you have not been given yet.',
        `Under ${c.hypA} the sign is absent in ${100} − ${x} = ${absentA} cases in 100. Under ${c.hypB} it is absent in ${100} − ${y} = ${absentB}.`,
        `Worked path: ${absentB} ÷ ${absentA} = **${ratio}**.`,
      ],
      explanation:
        `**${ratio} times.** The absence happens ${absentA} times in 100 under ${c.hypA} and ${absentB} times in 100 under ${c.hypB}, so it is ${ratio} times more common under the second.\n\n` +
        `Notice how the two directions differ. The PRESENCE of the sign favours ${c.hypA} by about ${presentRatio} times; its ABSENCE favours ${c.hypB} by ${ratio} times. Those two numbers are usually nothing like each other, and neither one can be worked out from the other without going back to the counts.\n\n` +
        `The practical lesson is that not seeing something is evidence, and how much evidence depends entirely on how reliably you would have seen it. A sign that shows up in ${x} of every 100 cases of ${c.hypA} is one you would have expected to see; its absence therefore says a good deal. A sign that only shows up occasionally tells you almost nothing by being missing.\n\n` +
        `This is the half of the evidence that goes uncollected. People record what they found and rarely record what they looked for and did not find, and the second list is the one that would have narrowed things down.`,
    }
  },
)

interface OnlyIfCase {
  rule: string
  p: string
  notP: string
  q: string
  notQ: string
  both: string
}

const ONLY_IF_CASES: OnlyIfCase[] = [
  { rule: 'No book leaves the building unless it has been scanned at the desk.', p: 'this book left the building', notP: 'this book did not leave the building', q: 'it was scanned at the desk', notQ: 'it was not scanned at the desk', both: 'This book left the building exactly when it was scanned at the desk.' },
  { rule: 'Only paid-up members may take out the club minibus.', p: 'this person took out the minibus', notP: 'this person did not take out the minibus', q: 'they are a paid-up member', notQ: 'they are not a paid-up member', both: 'A person takes out the minibus exactly when they are a paid-up member.' },
  { rule: 'The heating comes on only if the hall is booked.', p: 'the heating came on', notP: 'the heating did not come on', q: 'the hall was booked', notQ: 'the hall was not booked', both: 'The heating comes on exactly when the hall is booked.' },
  { rule: 'No parcel is loaded without a barcode on the label.', p: 'this parcel was loaded', notP: 'this parcel was not loaded', q: 'it has a barcode on the label', notQ: 'it has no barcode on the label', both: 'A parcel is loaded exactly when it has a barcode on the label.' },
  { rule: 'A seedling is potted on only if it has four true leaves.', p: 'this seedling was potted on', notP: 'this seedling was not potted on', q: 'it has four true leaves', notQ: 'it does not have four true leaves', both: 'A seedling is potted on exactly when it has four true leaves.' },
  { rule: 'Only work handed in by Friday goes to the second marker.', p: 'this work went to the second marker', notP: 'this work did not go to the second marker', q: 'it was handed in by Friday', notQ: 'it was not handed in by Friday', both: 'Work goes to the second marker exactly when it is handed in by Friday.' },
  { rule: 'No batch is shipped unless the seal test has been passed.', p: 'this batch was shipped', notP: 'this batch was not shipped', q: 'it passed the seal test', notQ: 'it did not pass the seal test', both: 'A batch is shipped exactly when it has passed the seal test.' },
  { rule: 'The alarm sounds only if a door is left open.', p: 'the alarm sounded', notP: 'the alarm did not sound', q: 'a door was left open', notQ: 'no door was left open', both: 'The alarm sounds exactly when a door is left open.' },
  { rule: 'Only tickets bought online carry a seat number.', p: 'this ticket carries a seat number', notP: 'this ticket carries no seat number', q: 'it was bought online', notQ: 'it was not bought online', both: 'A ticket carries a seat number exactly when it is bought online.' },
  { rule: 'No kiln is fired without a signature in the log.', p: 'this kiln was fired', notP: 'this kiln was not fired', q: 'there is a signature in the log', notQ: 'there is no signature in the log', both: 'A kiln is fired exactly when there is a signature in the log.' },
  { rule: 'A boat leaves the pontoon only if the flag is green.', p: 'this boat left the pontoon', notP: 'this boat did not leave the pontoon', q: 'the flag was green', notQ: 'the flag was not green', both: 'A boat leaves the pontoon exactly when the flag is green.' },
  { rule: 'Only entries with a photograph reach the final round.', p: 'this entry reached the final round', notP: 'this entry did not reach the final round', q: 'it has a photograph', notQ: 'it has no photograph', both: 'An entry reaches the final round exactly when it has a photograph.' },
]

const conditionalOnlyIf = tpl(
  {
    id: 'iq-cd-only-if',
    name: 'A rule and the other way of saying it',
    skillIds: ['i-conditional'],
    bucket: 'investigator',
    difficulty: 3,
    variants: 12,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, ONLY_IF_CASES)
    const direct = `If ${c.p}, then ${c.q}.`
    const contra = `If ${c.notQ}, then ${c.notP}.`
    const converse = `If ${c.q}, then ${c.p}.`
    const inverse = `If ${c.notP}, then ${c.notQ}.`
    return {
      title: 'Translate the rule',
      prompt:
        `Rule: **${c.rule}**\n\nAssume the rule always holds. Select **every** statement below that must then be true.`,
      answer: multi(rng, [direct, contra], [converse, inverse, c.both]),
      hints: [
        'Sentences with "only" and "unless" in them point the arrow in the direction people least expect. Work out which fact is the REQUIREMENT and which one is the thing that needs it.',
        `Here the requirement is that ${c.q}. The thing that needs it is that ${c.p}. So the arrow runs from the second of those to the first.`,
        `Worked path: **${direct}** and **${contra}** — the same rule, said forwards and said backwards.`,
      ],
      explanation:
        `Two of the five are true, and they are two ways of saying one thing:\n\n- **${direct}**\n- **${contra}**\n\n` +
        `The rule names a requirement. "Only", "unless" and "without" all mean the same shape: the thing described cannot happen without the requirement being met. So the arrow runs from the thing to the requirement, which is the opposite of the way the sentence reads left to right — and that is the whole difficulty.\n\n` +
        `The converse — "${converse}" — turns the requirement into a guarantee. Meeting a requirement does not make the thing happen: it is allowed to be met and for nothing to follow. The version reading "${inverse}" is the same error seen from behind. And the "exactly when" version claims both directions at once, which is a stronger rule than anything you were told.\n\n` +
        `A rule and its backwards form are ONE statement, not two. Noticing that is worth more than the translation itself: it means every rule you are given already tells you something about the cases where the requirement was missing, without any further evidence at all.`,
    }
  },
)

interface HiddenCase {
  argument: string
  key: string
  decoys: [string, string, string]
  why: string
}

const HIDDEN_CASES: HiddenCase[] = [
  {
    argument: 'The new bus lane must be working — traffic has been lighter ever since it opened.',
    key: 'Nothing else that affects traffic changed at the same time',
    decoys: ['The bus lane cost less than the alternatives did', 'Most drivers in the town are in favour of the bus lane', 'Buses now run more often along that road than they used to'],
    why: 'The argument reads a change over time as an effect of one cause. That only follows if the one cause was the only thing that changed.',
  },
  {
    argument: 'She must be the best person for the job — she got the most votes.',
    key: 'Votes go to whoever is best at the job',
    decoys: ['The turnout was high', 'The other candidates were all qualified for the job', 'The vote was held after the candidates had spoken'],
    why: 'Votes measure who is preferred. Turning that into "best at the job" needs the extra claim that the two are the same thing.',
  },
  {
    argument: 'That medicine works — I took it and I was better within three days.',
    key: 'The illness would not have cleared up on its own in three days',
    decoys: ['The medicine was taken exactly as the label said', 'Other people who took the same medicine also got better afterwards', 'The illness was correctly identified before treatment'],
    why: 'A recovery only counts as evidence if recovery without the medicine was unlikely. Most short illnesses end on their own.',
  },
  {
    argument: 'The team is losing because the new coach is no good — they won plenty under the old one.',
    key: 'Nothing else about the team changed when the coach did',
    decoys: ['The old coach was popular with the players', 'The new coach has a good deal less experience than the old one', 'The team has the same number of players as before'],
    why: 'Two things changed at once at most clubs — the coach and the squad, the fixtures, or the league. The argument needs everything else to have held still.',
  },
  {
    argument: 'The exam must have been easier this year — the average mark went up.',
    key: 'This year group is no stronger than the one before',
    decoys: ['The paper was set by the same examiner as last year', 'The exam lasted the same length of time as before', 'The marks were checked by a second marker this year'],
    why: 'An average depends on the paper and on the people sitting it. Blaming the paper requires assuming the people were the same.',
  },
  {
    argument: 'Our shop is doing well — we sold more items last month than the month before.',
    key: 'Selling more items means taking more money',
    decoys: ['The shop was open the same number of days', 'The items sold were the same ones as before', 'No items were returned during the month'],
    why: 'Item count and money are different measures, and a shift toward cheap items can raise one while lowering the other.',
  },
  {
    argument: 'He cannot possibly be tired — he slept for nine hours last night.',
    key: 'Nine hours is enough sleep for him',
    decoys: ['He went to bed early', 'He has not done anything unusually tiring today', 'His room was quiet and dark throughout the night'],
    why: 'The argument moves from an amount of sleep to a state of rest, which needs the amount to be enough for this person.',
  },
  {
    argument: 'The soil in that corner must be poor — nothing has ever grown there.',
    key: 'Nothing else in that corner stops plants from growing',
    decoys: ['The corner has been planted more than once before', 'The same plants grow perfectly well elsewhere in the garden', 'The soil there looks the same as the soil nearby'],
    why: 'Shade, roots, wind and drainage all stop plants growing without the soil being poor. The argument silently rules them out.',
  },
  {
    argument: 'The change to the website worked — visits doubled in the week after it went live.',
    key: 'Nothing else was bringing visitors in that week',
    decoys: ['The change was made carefully and tested first', 'The website had been running for over a year', 'Visitor numbers are counted the same way each week'],
    why: 'A jump in the same week as a change is evidence only if nothing else in that week could have caused it.',
  },
  {
    argument: 'That road is dangerous — three crashes happened on it last year.',
    key: 'No more traffic uses that road than uses the others',
    decoys: ['The crashes all happened during daylight hours', 'The road has been resurfaced within the last few years', 'The three crashes involved different kinds of vehicle'],
    why: 'A count without a denominator says nothing about risk. A busy road can have more crashes and a lower rate.',
  },
  {
    argument: 'The club is in good health — membership is at a record high.',
    key: 'Membership numbers measure how healthy the club is',
    decoys: ['Members are paying the same fee as in past years', 'The record was checked against the old paper lists', 'The club has more sections than it used to have'],
    why: 'The argument treats one number as the definition of health. Money, volunteers and attendance may all be pointing the other way.',
  },
  {
    argument: 'The alarm must be faulty — it went off when there was nobody in the building.',
    key: 'Nothing other than a person can set that alarm off',
    decoys: ['The alarm has gone off without cause before now', 'The building was locked for the whole of that night', 'The alarm was serviced within the last twelve months'],
    why: 'Draughts, insects, and moving displays all trigger sensors. Calling it faulty assumes only people can.',
  },
]

const fallacyHidden = tpl(
  {
    id: 'iq-fl-hidden',
    name: 'The premise nobody said out loud',
    skillIds: ['i-fallacy', 'i-logic'],
    bucket: 'investigator',
    difficulty: 3,
    variants: 12,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, HIDDEN_CASES)
    return {
      title: 'What it needs you not to notice',
      prompt:
        `Someone argues:\n\n"${c.argument}"\n\n` +
        'The argument needs one further thing to be true that it never states. Which one?',
      answer: mcq(rng, c.key, [...c.decoys]),
      hints: [
        'Write the reason and the conclusion on separate lines, then look at the gap between them.',
        'Ask what would have to be added to that gap to make the conclusion actually follow. If a statement could be false while the conclusion still held, it is not the missing piece.',
        `Worked path: **${c.key}**`,
      ],
      explanation:
        `**${c.key}** ${c.why}\n\n` +
        'The three rejected options are all things that might well be true, and might even make the conclusion more believable. That is not the test. The test is whether the argument FALLS APART without them — and it does not. It falls apart without the missing premise, which is why that one and not the others is the thing being assumed.\n\n' +
        'Naming a hidden premise is more useful than naming a fault, because it turns a disagreement into something checkable. "Your argument is bad" goes nowhere; "your argument needs nothing else to have changed that year, and two other things did" is a claim that can be settled.\n\n' +
        'It also protects you from the opposite error. Sometimes the hidden premise turns out to be perfectly true, and the argument is fine after all. You cannot know which until you have said what it is.',
    }
  },
)

interface DoubleCase {
  unit: string
  place: string
  cond: string
  check1: string
  check2: string
  flag: string
}

const DOUBLE_CASES: DoubleCase[] = [
  { unit: 'castings', place: 'in one foundry batch', cond: 'have an internal void', check1: 'the tap test', check2: 'an ultrasound scan', flag: 'a mark' },
  { unit: 'apples', place: 'in one delivery', cond: 'are bruised inside', check1: 'the light scanner', check2: 'a hand check', flag: 'a mark' },
  { unit: 'welds', place: 'on one gantry', cond: 'have a hairline fault', check1: 'the dye test', check2: 'an x-ray', flag: 'a flag' },
  { unit: 'seedlings', place: 'in one greenhouse', cond: 'carry root rot', check1: 'the leaf-strip test', check2: 'a root inspection', flag: 'a mark' },
  { unit: 'recordings', place: 'from one monitor', cond: 'contain a bat call', check1: 'the call finder', check2: 'a slowed-down listen', flag: 'a marker' },
  { unit: 'tiles', place: 'from one firing', cond: 'are cracked through', check1: 'the ring test', check2: 'a water soak', flag: 'a mark' },
  { unit: 'cables', place: 'on one drum', cond: 'have a broken core', check1: 'the continuity check', check2: 'a pull test', flag: 'a flag' },
  { unit: 'jars', place: 'on one pallet', cond: 'have a weak seal', check1: 'the vacuum check', check2: 'a pressure test', flag: 'a mark' },
  { unit: 'bearings', place: 'in one crate', cond: 'run rough', check1: 'the spin test', check2: 'a noise meter', flag: 'a flag' },
  { unit: 'photographs', place: 'in one archive box', cond: 'are fading badly', check1: 'the colour scan', check2: 'a close inspection', flag: 'a marker' },
  { unit: 'timber boards', place: 'in one yard stack', cond: 'are warped', check1: 'the laser check', check2: 'a straight-edge check', flag: 'a mark' },
  { unit: 'batteries', place: 'in one shipment', cond: 'hold no charge', check1: 'the quick test', check2: 'a full discharge test', flag: 'a flag' },
]

/** [how many of 1000 are affected, hit rate %, false-flag rate %]. Every product is a whole number. */
const DOUBLE_PARAMS: [number, number, number][] = [
  [200, 90, 20],
  [100, 80, 20],
  [300, 90, 10],
  [200, 80, 10],
  [400, 90, 20],
  [100, 90, 10],
  [500, 80, 20],
  [200, 90, 10],
  [400, 80, 10],
  [300, 80, 20],
  [100, 80, 10],
  [500, 90, 10],
]

const bayesDouble = tpl(
  {
    id: 'iq-bayes-double',
    name: 'A second check on the survivors',
    skillIds: ['i-bayes', 'i-natfreq'],
    bucket: 'investigator',
    difficulty: 4,
    variants: 12,
    minutes: 5,
    kind: 'multi',
    calibration: true,
  },
  (rng, seed) => {
    const c = cycle(seed, DOUBLE_CASES)
    const [aff, hit, fal] = DOUBLE_PARAMS[seed % DOUBLE_PARAMS.length]
    const well = 1000 - aff
    const tp1 = (aff * hit) / 100
    const fp1 = (well * fal) / 100
    const flag1 = tp1 + fp1
    const tp2 = (tp1 * hit) / 100
    const fp2 = (fp1 * fal) / 100
    const flag2 = tp2 + fp2
    const pct1 = Math.round((tp1 / flag1) * 100)
    const pct2 = Math.round((tp2 / flag2) * 100)
    const key = `Up from about ${pct1}% to about ${pct2}%`
    const setup =
      `Out of **1000** ${c.unit} ${c.place}, **${aff}** ${c.cond}.\n\n` +
      `Every one goes through ${c.check1}, which gives ${c.flag} to **${hit}%** of those that ${c.cond} and to **${fal}%** of those that do not.\n\n` +
      `Everything ${c.check1} flags then goes through ${c.check2}, which is a completely separate method — and it happens to behave the same way: ${c.flag} for **${hit}%** of those that ${c.cond} and for **${fal}%** of those that do not.`
    return {
      title: 'Two checks, one after the other',
      prompt: `${setup}\n\nWork through the 1000 in two stages.`,
      hints: [
        'Do one stage at a time, and at every stage keep the group split into two: the ones that really do have it, and the ones that do not.',
        `After the first check the flagged pile holds ${tp1} that really ${c.cond} and ${fp1} that do not. The second check is then applied to those two groups separately.`,
        `Worked path: ${flag1} flagged first time, ${flag2} flagged again — and of those, ${tp2} really ${c.cond}.`,
      ],
      explanation:
        `The first check flags ${tp1} + ${fp1} = **${flag1}**, of which ${tp1} really ${c.cond} — about ${pct1}%.\n\n` +
        `The second check is applied to that pile, and to each half of it separately: ${hit}% of the ${tp1} real ones is ${tp2}, and ${fal}% of the ${fp1} false ones is ${fp2}. So ${flag2} are flagged twice, and **${tp2}** of those really ${c.cond} — about ${pct2}%.\n\n` +
        `What has changed is not the checks. Each is the same check it always was; what changed is the group it was applied to. The first check ran on a pile that was ${Math.round((aff / 1000) * 100)}% affected, and the second ran on a pile that was already ${pct1}% affected, and a check is worth far more when the thing is common in the group being checked.\n\n` +
        `One condition has to be stated, because it is doing a lot of work: the second check has to be INDEPENDENT of the first — a genuinely different method that fails for different reasons. Two checks that share a weakness will agree with each other on exactly the cases the first one got wrong, and the improvement calculated above simply does not happen. In real life that is the usual situation, which is why "we checked it twice" is a much weaker claim than it sounds.`,
      parts: [
        part('First check', {
          prompt: `How many of the 1000 ${c.unit} get ${c.flag} from ${c.check1}?`,
          answer: numeric(flag1),
          explanation:
            `${hit}% of the ${aff} that ${c.cond} is ${tp1}, and ${fal}% of the other ${well} is ${fp1}. Together **${flag1}**. The second group is much the larger of the two, which is why it contributes so many flags at only ${fal}%.`,
          hints: [
            `Split the 1000 first: ${aff} that ${c.cond} and ${well} that do not.`,
            `Then take ${hit}% of ${aff} and ${fal}% of ${well}.`,
            `Worked path: ${tp1} + ${fp1} = ${flag1}.`,
          ],
        }),
        part('Second check', {
          prompt: `Those ${flag1} now go through ${c.check2}. How many of them get ${c.flag} again?`,
          answer: numeric(flag2),
          explanation:
            `Keep the pile split: ${tp1} really ${c.cond} and ${fp1} do not. The second check flags ${hit}% of the first group, which is ${tp2}, and ${fal}% of the second, which is ${fp2} — **${flag2}** in all.`,
          hints: [
            `The pile of ${flag1} is not all the same. Split it into the ${tp1} real ones and the ${fp1} false ones before applying anything.`,
            `Then apply ${hit}% to one part and ${fal}% to the other.`,
            `Worked path: ${tp2} + ${fp2} = ${flag2}.`,
          ],
        }),
        part('What it bought', {
          prompt: 'What happened to the share of the flagged pile that really has the fault?',
          answer: mcq(rng, key, [
            `Unchanged at about ${pct1}%`,
            `Down to about ${100 - pct2}%, because the second check ruled more out`,
            'Straight up to 100%, because two separate checks agreeing settles it',
          ]),
          explanation:
            `After one check, ${tp1} of ${flag1} were real — about ${pct1}%. After two, ${tp2} of ${flag2} are real — about ${pct2}%. The share rose because the second check was applied to a pile where the fault was already common, and that is what decides how much a check is worth.`,
          hints: [
            'Work out the fraction that is real at each stage before comparing them.',
            `First stage: ${tp1} out of ${flag1}. Second stage: ${tp2} out of ${flag2}.`,
            `Worked path: about ${pct1}% becomes about ${pct2}%.`,
          ],
        }),
      ],
    }
  },
)
// ===========================================================================
// PHYSICS — scaling, limit cases, unit algebra and representation
// ===========================================================================

/**
 * Picks `n` decoys from a pool with a GUARANTEE about option length: at least
 * one decoy is no shorter than the key and at least one is no longer, so the
 * key can be neither the strictly longest nor the strictly shortest option.
 *
 * Doing this in code rather than by eye is what keeps the property true as a
 * bank grows. The pools it is used on all carry a deliberately long entry and
 * a deliberately terse one so the guarantee can always be met.
 */
function balanced(key: string, pool: string[], n: number): string[] {
  const rest = pool.filter((o) => o !== key)
  const notShorter = rest.filter((o) => o.length >= key.length).sort((a, b) => a.length - b.length)
  const notLonger = rest.filter((o) => o.length <= key.length).sort((a, b) => b.length - a.length)
  const out: string[] = []
  if (notShorter.length) out.push(notShorter[0])
  if (notLonger.length && !out.includes(notLonger[0])) out.push(notLonger[0])
  for (const o of rest) {
    if (out.length >= n) break
    if (!out.includes(o)) out.push(o)
  }
  return out.slice(0, n)
}

interface ScaleCase {
  setup: string
  quantity: string
  k: number
  power: number
  /** How many directions the quantity grows in, said in words. */
  reason: string
}

const SCALE_CASES: ScaleCase[] = [
  { setup: 'A cube-shaped water tank is rebuilt with every side twice as long.', quantity: 'the mass of water it holds', k: 2, power: 3, reason: 'a volume grows in all three directions at once' },
  { setup: 'A circular pizza is made with three times the radius.', quantity: 'its area', k: 3, power: 2, reason: 'an area grows in two directions at once' },
  { setup: 'A cable of the same material and thickness is made twice as long.', quantity: 'its mass', k: 2, power: 1, reason: 'only the length has changed' },
  { setup: 'A spherical balloon is blown up until its radius has doubled.', quantity: 'the volume of air inside it', k: 2, power: 3, reason: 'a volume grows in all three directions at once' },
  { setup: 'A square solar panel is replaced by one whose sides are four times as long.', quantity: 'the sunlight it collects', k: 4, power: 2, reason: 'the light collected depends on the area, which grows in two directions' },
  { setup: 'A model bridge is rebuilt five times bigger in every direction.', quantity: 'the amount of material in it', k: 5, power: 3, reason: 'the material fills a volume, which grows in all three directions' },
  { setup: 'A cylindrical tin keeps its height but has its radius tripled.', quantity: 'the volume it holds', k: 3, power: 2, reason: 'the height is unchanged, so only the two directions across the tin grow' },
  { setup: 'A rectangular field is enlarged so that every side is three times longer.', quantity: 'the area that has to be mown', k: 3, power: 2, reason: 'an area grows in two directions at once' },
  { setup: 'A rope of the same thickness is made four times as long.', quantity: 'its weight', k: 4, power: 1, reason: 'only the length has changed' },
  { setup: 'A cube of ice is replaced by one whose every edge is three times as long.', quantity: 'its mass', k: 3, power: 3, reason: 'a volume grows in all three directions at once' },
  { setup: 'A round pond liner is bought for a pond of twice the radius.', quantity: 'the area of liner needed', k: 2, power: 2, reason: 'an area grows in two directions at once' },
  { setup: 'A tower is built five times as tall from the same blocks, at the same width.', quantity: 'the number of blocks used', k: 5, power: 1, reason: 'only the height has changed' },
]

const estScaling = tpl(
  {
    id: 'pq-est-scaling',
    name: 'What happens when a size doubles',
    skillIds: ['p-estimate'],
    bucket: 'physics',
    difficulty: 3,
    variants: 12,
    minutes: 2.5,
  },
  (_rng, seed) => {
    const c = cycle(seed, SCALE_CASES)
    const factor = c.k ** c.power
    const chain = Array.from({ length: c.power }, () => String(c.k)).join(' × ')
    return {
      title: 'Scaling',
      prompt:
        `${c.setup}\n\nBy what factor does **${c.quantity}** change? Give the number you would multiply by.`,
      answer: numeric(factor, { unit: 'times' }),
      hints: [
        'Do not reach for a formula. Ask how many separate directions the quantity in question grows in when the object is made bigger.',
        `Here ${c.reason}, so the size factor of ${c.k} is applied ${c.power === 1 ? 'once' : c.power === 2 ? 'twice' : 'three times'}.`,
        `Worked path: ${chain} = **${factor}**.`,
      ],
      explanation:
        `**${factor} times.** ${c.reason.charAt(0).toUpperCase()}${c.reason.slice(1)}, so the factor of ${c.k} is used ${c.power === 1 ? 'once' : c.power === 2 ? 'twice' : 'three times'}: ${chain} = ${factor}.\n\n` +
        (c.power === 1
          ? `The trap in this family runs the other way. Here the answer really is just ${c.k}, and it is worth being able to say WHY — one direction changed, so the factor is used once. Applying a square or a cube because the question mentions a solid object is as wrong as failing to apply one.`
          : `The tempting answer is ${c.k}, because that is the number in the question. It is what you get by assuming that everything grows in step with length, and almost nothing does: areas grow with the square and volumes with the cube.\n\nThat is why doubling a recipe tin does not double the cake, and why a model made at half scale needs about an eighth of the material. Whenever a question says a size has changed, the first move is to ask how many directions the answer lives in.`),
    }
  },
)

interface MagCase {
  question: string
  /** Each label with its rough size in one common unit; all separated by ~10x. */
  items: [string, number][]
  unit: string
}

const MAG_CASES: MagCase[] = [
  { question: 'mass', unit: 'kilograms', items: [['A paperclip', 0.001], ['A house cat', 4], ['A small car', 1200], ['A loaded lorry', 20000]] },
  { question: 'length', unit: 'metres', items: [['A grain of rice', 0.005], ['A school ruler', 0.3], ['A tennis court', 24], ['A marathon course', 42000]] },
  { question: 'time', unit: 'seconds', items: [['A camera flash', 0.001], ['One heartbeat', 1], ['A school lesson', 3600], ['A summer holiday', 5000000]] },
  { question: 'volume', unit: 'litres', items: [['A teaspoon', 0.005], ['A full kettle', 1.7], ['A bathtub', 150], ['A swimming pool', 2500000]] },
  { question: 'speed', unit: 'metres per second', items: [['A crawling snail', 0.001], ['A walking person', 1.5], ['A car on a main road', 25], ['Sound through air', 340]] },
  { question: 'area', unit: 'square metres', items: [['A postage stamp', 0.0005], ['A front door', 2], ['A tennis court', 260], ['A large farm field', 40000]] },
  { question: 'number of people', unit: 'people', items: [['Seats in a car', 5], ['Pupils in a school', 900], ['A crowd at a big concert', 60000], ['People in a large city', 3000000]] },
  { question: 'force', unit: 'newtons', items: [['The weight of an apple', 1], ['The weight of a school bag', 50], ['The weight of an adult', 700], ['The weight of a small car', 10000]] },
  { question: 'power', unit: 'watts', items: [['A phone charger', 5], ['A reading lamp', 60], ['An electric kettle', 2500], ['A mainline train', 5000000]] },
  { question: 'distance', unit: 'metres', items: [['Across a classroom', 10], ['Across a small town', 5000], ['End to end of a country', 900000], ['Once around the Earth', 40000000]] },
]

const estRank = tpl(
  {
    id: 'pq-est-rank',
    name: 'Rank them by size',
    skillIds: ['p-estimate'],
    bucket: 'physics',
    difficulty: 2,
    variants: 10,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, MAG_CASES)
    const { list, correct } = orderKey(shuffle(rng, c.items), (x) => x[1])
    const ordered = [...c.items].sort((a, b) => b[1] - a[1])
    const gaps = ordered
      .slice(1)
      .map((x, i) => `${ordered[i][0].toLowerCase()} is roughly ${Math.round(ordered[i][1] / x[1])} times ${x[0].toLowerCase()}`)
      .join(', ')
    return {
      title: 'Orders of magnitude',
      prompt:
        `Four everyday things, each with a ${c.question} you could estimate without looking anything up.\n\n` +
        `Rank them by ${c.question}, largest first. Nothing here is a close call — every step is at least ten times the one below it.`,
      answer: { type: 'order', options: list.map((d) => d[0]), correct },
      hints: [
        'Anchor each one on something you know cold, then say roughly what power of ten it lands on. You are not being asked for accurate values.',
        'Two of these are probably obvious. Spend the effort on the pair you are least sure about, and ask whether one could be ten times the other.',
        `Worked path: ${ordered.map((o) => `${o[0].toLowerCase()} about ${o[1]} ${c.unit}`).join(', ')}.`,
      ],
      explanation:
        `Largest first: ${ordered.map((o) => `**${o[0]}** (about ${o[1]} ${c.unit})`).join(', ')}.\n\n` +
        `Roughly: ${gaps}.\n\n` +
        `Ranking is a fairer test of size sense than picking a value from a list, because there is nothing to recognise — you have to produce an estimate for each one and then compare. And the estimates only have to be right to the nearest power of ten, which is usually reachable from things you already know: your own height, your own mass, the length of a lesson.\n\n` +
        `That is the whole use of order-of-magnitude sense. It will not tell you whether an answer is 24 or 26, and it will tell you instantly that an answer of 2400 is wrong.`,
    }
  },
)

interface TensCase {
  small: string
  smallText: string
  smallExp: number
  big: string
  bigText: string
  bigExp: number
  unit: string
}

const TENS_CASES: TensCase[] = [
  { small: 'a sheet of paper', smallText: '0.0001', smallExp: -4, big: 'a school corridor', bigText: '100', bigExp: 2, unit: 'metres' },
  { small: 'a mosquito', smallText: '0.000001', smallExp: -6, big: 'an adult person', bigText: '100', bigExp: 2, unit: 'kilograms' },
  { small: 'a single blink', smallText: '0.1', smallExp: -1, big: 'a whole school year', bigText: '10000000', bigExp: 7, unit: 'seconds' },
  { small: 'a drop of water', smallText: '0.0001', smallExp: -4, big: 'a full water butt', bigText: '100', bigExp: 2, unit: 'litres' },
  { small: 'a bacterium', smallText: '0.000001', smallExp: -6, big: 'a classroom', bigText: '10', bigExp: 1, unit: 'metres' },
  { small: 'a small coin', smallText: '0.01', smallExp: -2, big: 'a small car', bigText: '1000', bigExp: 3, unit: 'kilograms' },
  { small: 'a hearing aid', smallText: '0.001', smallExp: -3, big: 'a power station', bigText: '1000000000', bigExp: 9, unit: 'watts' },
  { small: 'a postage stamp', smallText: '0.0001', smallExp: -4, big: 'a sports hall', bigText: '1000', bigExp: 3, unit: 'square metres' },
  { small: 'a mustard seed', smallText: '0.001', smallExp: -3, big: 'a bus', bigText: '10', bigExp: 1, unit: 'metres' },
  { small: 'a short text message', smallText: '100', smallExp: 2, big: 'a full-length film file', bigText: '1000000000', bigExp: 9, unit: 'bytes' },
  { small: 'a phone charger', smallText: '10', smallExp: 1, big: 'a power station', bigText: '1000000000', bigExp: 9, unit: 'watts' },
  { small: 'hair growth in an hour', smallText: '0.00001', smallExp: -5, big: 'walking for an hour', bigText: '1000', bigExp: 3, unit: 'metres' },
]

const estTens = tpl(
  {
    id: 'pq-est-tens',
    name: 'How many powers of ten apart?',
    skillIds: ['p-estimate'],
    bucket: 'physics',
    difficulty: 3,
    variants: 12,
    minutes: 2.5,
  },
  (_rng, seed) => {
    const c = cycle(seed, TENS_CASES)
    const diff = c.bigExp - c.smallExp
    return {
      title: 'Counting the zeros',
      prompt:
        `Two quantities measured in ${c.unit}:\n\n` +
        `- ${c.small.charAt(0).toUpperCase()}${c.small.slice(1)}: about **${c.smallText}** ${c.unit}.\n` +
        `- ${c.big.charAt(0).toUpperCase()}${c.big.slice(1)}: about **${c.bigText}** ${c.unit}.\n\n` +
        'How many powers of ten separate them? (In other words, how many times would you have to multiply the smaller one by ten to reach the larger?)',
      answer: numeric(diff),
      hints: [
        'Write each quantity as 1 followed by a power of ten rather than as a decimal. A number smaller than one has a negative power.',
        `The smaller is 10 to the power ${c.smallExp}, and the larger is 10 to the power ${c.bigExp}.`,
        `Worked path: ${c.bigExp} − (${c.smallExp}) = **${diff}**.`,
      ],
      explanation:
        `**${diff}.** Written as powers of ten, the two are 10 to the power ${c.smallExp} and 10 to the power ${c.bigExp}, and ${c.bigExp} − (${c.smallExp}) = ${diff}.\n\n` +
        `Subtracting the powers is the same thing as dividing the quantities, which is why counting zeros beats counting decimal places: the arithmetic gets shorter as the numbers get more extreme, instead of longer.\n\n` +
        `Being able to do this quickly is what makes a wrong answer visible. If a calculation about ${c.big} came out at ${c.smallText} ${c.unit}, no algebra check is needed — a gap of ${diff} powers of ten is not a rounding error, it is a mistake somewhere in the setup.`,
    }
  },
)

interface UnitTarget {
  name: string
  /** Exponents of length, mass and time. */
  v: [number, number, number]
  units: string
}

interface UnitExpr {
  label: string
  v: [number, number, number]
}

/**
 * The pool deliberately carries a very short entry and a very long one so
 * `balanced` can always meet its guarantee, whichever expression is the key.
 * The four combinations with no physical meaning are still plausible slips:
 * multiplying where the relation divides, or carrying a factor twice.
 */
const UNIT_EXPRS: UnitExpr[] = [
  { label: 'L × T', v: [1, 0, 1] },
  { label: 'm × L', v: [1, 1, 0] },
  { label: 'm ÷ T', v: [0, 1, -1] },
  { label: 'm × m × L ÷ (T × T × T)', v: [1, 2, -3] },
  { label: 'L ÷ T', v: [1, 0, -1] },
  { label: 'L ÷ (T × T)', v: [1, 0, -2] },
  { label: 'm × L ÷ T', v: [1, 1, -1] },
  { label: 'm × L ÷ (T × T)', v: [1, 1, -2] },
  { label: 'm × L × L ÷ (T × T)', v: [2, 1, -2] },
  { label: 'm × L × L ÷ (T × T × T)', v: [2, 1, -3] },
  { label: 'm ÷ (L × T × T)', v: [-1, 1, -2] },
  { label: 'm ÷ (L × L × L)', v: [-3, 1, 0] },
  { label: 'm × T ÷ L', v: [-1, 1, 1] },
  { label: 'L × L ÷ T', v: [2, 0, -1] },
  { label: 'm × L × T', v: [1, 1, 1] },
  { label: 'm × L × L ÷ T', v: [2, 1, -1] },
]

const UNIT_TARGETS: UnitTarget[] = [
  { name: 'a speed', v: [1, 0, -1], units: 'metres per second' },
  { name: 'an acceleration', v: [1, 0, -2], units: 'metres per second per second' },
  { name: 'a momentum', v: [1, 1, -1], units: 'kilogram metres per second' },
  { name: 'a force', v: [1, 1, -2], units: 'kilogram metres per second per second' },
  { name: 'an energy', v: [2, 1, -2], units: 'kilogram square metres per second per second' },
  { name: 'a power', v: [2, 1, -3], units: 'kilogram square metres per second cubed' },
  { name: 'a pressure', v: [-1, 1, -2], units: 'kilograms per metre per second per second' },
  { name: 'a density', v: [-3, 1, 0], units: 'kilograms per cubic metre' },
  { name: 'a force', v: [1, 1, -2], units: 'kilogram metres per second per second' },
  { name: 'an energy', v: [2, 1, -2], units: 'kilogram square metres per second per second' },
  { name: 'a speed', v: [1, 0, -1], units: 'metres per second' },
  { name: 'a pressure', v: [-1, 1, -2], units: 'kilograms per metre per second per second' },
]

const UNIT_CONTEXTS: string[] = [
  'A student has measured three things about a trolley on a track',
  'A technician has measured three things about a falling weight',
  'A group has measured three things about a spinning flywheel',
  'A student has measured three things about a block on a ramp',
  'A team has measured three things about a jet of water',
  'A class has measured three things about a swinging pendulum',
  'A student has measured three things about a rolling ball',
  'A group has measured three things about a stretched spring',
  'A technician has measured three things about a lift and its load',
  'A class has measured three things about a bouncing ball',
  'A student has measured three things about a toy car and a ramp',
  'A team has measured three things about a sinking float',
]

const unitAlgebra = tpl(
  {
    id: 'pq-meas-units',
    name: 'Which combination has the right units?',
    skillIds: ['p-measure'],
    bucket: 'physics',
    difficulty: 3,
    variants: 12,
    minutes: 3,
  },
  (rng, seed) => {
    const target = UNIT_TARGETS[seed % UNIT_TARGETS.length]
    const context = cycle(seed, UNIT_CONTEXTS)
    const same = (a: [number, number, number], b: [number, number, number]) =>
      a[0] === b[0] && a[1] === b[1] && a[2] === b[2]
    const key = UNIT_EXPRS.find((e) => same(e.v, target.v))!
    const pool = UNIT_EXPRS.filter((e) => !same(e.v, target.v)).map((e) => e.label)
    return {
      title: 'Unit algebra',
      prompt:
        `${context}: a mass **m** in kilograms, a length **L** in metres and a time **T** in seconds.\n\n` +
        `Which of these combinations comes out with the units of **${target.name}**?\n\n` +
        'Work it out from the units alone. No arithmetic is needed and no values are given.',
      answer: mcq(rng, key.label, balanced(key.label, pool, 3)),
      hints: [
        'Treat the units like algebra: multiply them, divide them, and cancel what appears on both sides.',
        `${target.name.charAt(0).toUpperCase()}${target.name.slice(1)} is measured in ${target.units}. Build that out of kilograms, metres and seconds and see which line matches.`,
        `Worked path: **${key.label}** gives ${target.units}.`,
      ],
      explanation:
        `**${key.label}** — its units come out as ${target.units}, which is exactly ${target.name}.\n\n` +
        `Nothing here needed a number. Carrying units through a calculation turns them into a check that runs alongside the arithmetic and catches a whole class of mistake before any of the arithmetic happens: an inverted division, a missing factor, a squared quantity that should not have been squared.\n\n` +
        `It is also the cheapest thing you can do to an answer you are unsure of. If the units of your result do not match the units of the thing you were asked for, the result is wrong, and no amount of rechecking the arithmetic will fix it.`,
    }
  },
)

interface LimitCase {
  formula: string
  meaning: string
  limit: string
  key: string
  decoys: [string, string, string]
  why: string
}

/**
 * Option sets here are hand-balanced: every case carries one terse decoy and
 * two long ones, so the key is never the longest or the shortest option.
 */
const LIMIT_CASES: LimitCase[] = [
  {
    formula: 'distance = speed × time',
    meaning: 'how far something travels at a steady speed',
    limit: 'the time is set to zero',
    key: 'It gives zero distance, which is right — no time, no travel',
    decoys: [
      'It breaks down completely',
      'It gives the speed back again, which is a distance in disguise if you look at it the right way',
      'It gives an answer that grows without limit, since dividing by nothing is what happens here',
    ],
    why: 'Multiplying by zero is a perfectly ordinary thing for this formula to do, and the answer it gives is the physically right one.',
  },
  {
    formula: 'acceleration = force ÷ mass',
    meaning: 'how quickly a push changes the motion of an object',
    limit: 'the mass is made smaller and smaller towards zero',
    key: 'The acceleration grows without any limit at all',
    decoys: [
      'The acceleration settles down',
      'The acceleration goes to zero, because there is less and less left for the force to act on at all',
      'The acceleration stays exactly the same, since the force has not changed anywhere in the calculation',
    ],
    why: 'Dividing a fixed number by something approaching zero grows without bound, which is the formula saying that an object with no mass is not something it can describe.',
  },
  {
    formula: 'density = mass ÷ volume',
    meaning: 'how much stuff is packed into a space',
    limit: 'the volume is set to exactly zero',
    key: 'The formula stops meaning anything — there is nothing to divide into',
    decoys: [
      'The density becomes zero',
      'The density becomes equal to the mass, because dividing by nothing leaves the top of the fraction alone',
      'The density becomes very small, since a tiny space cannot hold very much material inside it at all',
    ],
    why: 'A zero volume is not a small object; it is no object. The formula refusing to give an answer is the formula behaving correctly.',
  },
  {
    formula: 'pressure = force ÷ area',
    meaning: 'how concentrated a push is',
    limit: 'the area is made smaller and smaller',
    key: 'The pressure grows without limit, which is why a point cuts',
    decoys: [
      'The pressure drops away',
      'The pressure stays where it is, because the force pressing down has not been changed at any point',
      'The pressure falls towards zero, since a smaller area has less of the object to push against it',
    ],
    why: 'The same force spread over less and less area gives more and more pressure, which is exactly why sharpening a blade works.',
  },
  {
    formula: 'time = distance ÷ speed',
    meaning: 'how long a journey takes',
    limit: 'the speed is set to zero',
    key: 'It never arrives, and the formula says so by refusing to give a time',
    decoys: [
      'It arrives instantly',
      'It takes exactly as long as the distance, because the two are the only numbers left in the calculation',
      'It takes no time at all, since nothing is moving and therefore nothing can be delayed along the way',
    ],
    why: 'Dividing by zero has no answer, and here that is not a defect: an object that is not moving really does not arrive.',
  },
  {
    formula: 'kinetic energy = half × mass × speed × speed',
    meaning: 'the energy something has because it is moving',
    limit: 'the speed is set to zero',
    key: 'The energy is zero, which is exactly what it should be',
    decoys: [
      'The formula breaks down',
      'The energy is half the mass, because that is what is left once the speed has gone from the calculation',
      'The energy is still large, since a heavy object at rest is holding a great deal of energy inside it',
    ],
    why: 'Something standing still has no energy of motion. The formula gives zero, and zero is the right answer rather than a failure.',
  },
  {
    formula: 'resistance = voltage ÷ current',
    meaning: 'how hard a component makes it for charge to flow',
    limit: 'the current falls towards zero with the voltage still applied',
    key: 'The resistance grows without limit, which is a broken circuit',
    decoys: [
      'The resistance vanishes',
      'The resistance becomes equal to the voltage, since the current has stopped playing any part in it',
      'The resistance stays the same, because a component keeps the resistance it was manufactured with',
    ],
    why: 'A gap in a circuit lets no current through however much voltage is applied, and an unbounded resistance is the honest description of a gap.',
  },
  {
    formula: 'current = voltage ÷ resistance',
    meaning: 'how much charge flows each second',
    limit: 'the resistance falls towards zero',
    key: 'The current grows without limit, which is a short circuit',
    decoys: [
      'The current settles down',
      'The current falls to zero, because there is nothing left in the circuit for the voltage to push against',
      'The current becomes equal to the voltage, since dividing by nothing leaves the top of the fraction alone',
    ],
    why: 'Removing the resistance removes the only thing limiting the flow, and a real circuit answers this by melting something.',
  },
  {
    formula: 'momentum = mass × speed',
    meaning: 'how much motion something carries',
    limit: 'the speed is set to zero',
    key: 'The momentum is zero, however heavy the object is',
    decoys: [
      'The momentum equals the mass',
      'The momentum stays large, because a heavy object is hard to get moving from a standing start anyway',
      'The formula stops working, because a multiplication cannot be carried out when one side of it is nothing',
    ],
    why: 'Momentum is about motion, so no motion means none of it. That a heavy object is hard to start is a statement about force, not about momentum.',
  },
  {
    formula: 'wave speed = frequency × wavelength',
    meaning: 'how fast a wave travels through a material',
    limit: 'the frequency is set to zero',
    key: 'There is no wave at all, so there is nothing for it to describe',
    decoys: [
      'The wave stops moving',
      'The wave travels at the speed the material allows, since the medium is what sets the speed of any wave',
      'The wavelength becomes unlimited, because a fixed speed divided by nothing has to grow without any bound',
    ],
    why: 'A frequency of zero means nothing is vibrating. The relation still holds arithmetically and has no wave left to be about, which is a different situation from a wave standing still.',
  },
]

const limitCheck = tpl(
  {
    id: 'pq-meas-limit',
    name: 'Push a quantity to zero and see',
    skillIds: ['p-measure'],
    bucket: 'physics',
    difficulty: 3,
    variants: 10,
    minutes: 3,
    transfer: true,
  },
  (rng, seed) => {
    const c = cycle(seed, LIMIT_CASES)
    return {
      title: 'The limit case',
      prompt:
        `A relation you already know: **${c.formula}** — ${c.meaning}.\n\n` +
        `Now test it at its edge. Suppose ${c.limit}. What does the relation then say, and does it make sense?`,
      answer: mcq(rng, c.key, [...c.decoys]),
      hints: [
        'Put the extreme value into the relation and read off what comes out, before deciding whether you like it.',
        'Then ask the separate question: is that answer a sensible description of what would really happen, or is the relation telling you it has run out of things to say?',
        `Worked path: **${c.key}**`,
      ],
      explanation:
        `**${c.key}** ${c.why}\n\n` +
        'This is worth doing to any relation you are unsure of, and it takes seconds. Set one quantity to zero, or let it grow without bound, and see whether what comes out matches what you would actually expect. A relation you have remembered wrongly usually fails this test loudly — an upside-down division gives zero where it should give something huge, and a missing square gives an answer that barely moves when it should move a lot.\n\n' +
        'It also sorts two very different things that look alike. Sometimes an extreme value gives a sensible answer, and sometimes it gives no answer at all — and "no answer" is often the relation correctly telling you that the situation you described is not a situation it covers.',
    }
  },
)

interface ConvertCase {
  what: string
  from: string
  to: string
  num: number
  den: number
  note: string
}

const CONVERT_CASES: ConvertCase[] = [
  { what: 'the area of a window pane', from: 'cm²', to: 'm²', num: 1, den: 10000, note: 'a metre is 100 cm, so a square metre is 100 × 100 = 10000 cm²' },
  { what: 'the volume of a tank', from: 'cm³', to: 'm³', num: 1, den: 1000000, note: 'a metre is 100 cm, so a cubic metre is 100 × 100 × 100 = 1000000 cm³' },
  { what: 'the speed of a van', from: 'km/h', to: 'm/s', num: 5, den: 18, note: '1000 metres in a kilometre and 3600 seconds in an hour, and 1000 ÷ 3600 simplifies to 5 ÷ 18' },
  { what: 'the density of a rock', from: 'g/cm³', to: 'kg/m³', num: 1000, den: 1, note: '1000 g in a kilogram and 1000000 cm³ in a cubic metre, and 1000000 ÷ 1000 is 1000' },
  { what: 'the volume of a water butt', from: 'L', to: 'm³', num: 1, den: 1000, note: 'a cubic metre holds 1000 litres' },
  { what: 'the area of a solar panel', from: 'cm²', to: 'm²', num: 1, den: 10000, note: 'a square metre is 100 × 100 = 10000 cm²' },
  { what: 'the speed of a train', from: 'km/h', to: 'm/s', num: 5, den: 18, note: '1000 metres per kilometre against 3600 seconds per hour gives 5 ÷ 18' },
  { what: 'the volume of a fish tank', from: 'cm³', to: 'm³', num: 1, den: 1000000, note: 'a cubic metre is 100 × 100 × 100 = 1000000 cm³' },
  { what: 'the density of cooking oil', from: 'g/cm³', to: 'kg/m³', num: 1000, den: 1, note: 'the two conversions do not cancel: 1000000 ÷ 1000 leaves a factor of 1000' },
  { what: 'the speed of a cyclist', from: 'km/h', to: 'm/s', num: 5, den: 18, note: 'divide by 3.6, which is the same as multiplying by 5 and dividing by 18' },
  { what: 'the area of a notice board', from: 'cm²', to: 'm²', num: 1, den: 10000, note: 'the factor is squared because an area has two directions in it' },
  { what: 'the volume of a rainwater store', from: 'L', to: 'm³', num: 1, den: 1000, note: 'a cubic metre holds 1000 litres' },
]

const CONVERT_VALUES: number[] = [250, 4500, 72, 2.7, 350, 8000, 90, 12500, 0.9, 54, 1500, 2500]

const measureConvert = tpl(
  {
    id: 'pq-meas-convert',
    name: 'Conversions that are not what they look like',
    skillIds: ['p-measure'],
    bucket: 'physics',
    difficulty: 3,
    variants: 12,
    minutes: 2.5,
  },
  (_rng, seed) => {
    const c = cycle(seed, CONVERT_CASES)
    const value = CONVERT_VALUES[seed % CONVERT_VALUES.length]
    const answer = round((value * c.num) / c.den, 4)
    const naive = c.den === 10000 || c.den === 1000000 ? round(value / 100, 4) : null
    return {
      title: 'Change the unit',
      prompt: `Convert **${value} ${c.from}** — ${c.what} — into **${c.to}**.`,
      answer: numeric(answer, { unit: c.to }),
      hints: [
        'Write down the conversion between the basic units first, then work out what it becomes for this quantity.',
        `Here: ${c.note}.`,
        `Worked path: ${value} × ${c.num} ÷ ${c.den} = **${answer}** ${c.to}.`,
      ],
      explanation:
        `**${answer} ${c.to}.** ${c.note.charAt(0).toUpperCase()}${c.note.slice(1)}.\n\n` +
        (naive !== null
          ? `The mistake this catches is using the plain length factor of 100 and getting ${naive}. It feels right because the unit names look like a small change — cm to m is only "one step" — but the factor between two units gets squared for an area and cubed for a volume, so one step in the name is two or three steps in the number.\n\n`
          : `Conversions like this one are worth doing in two visible stages rather than reaching for a single remembered number, because the single remembered number is the thing people get upside down.\n\n`) +
        `A quick check that costs nothing: after converting, ask whether the number moved in the direction you expected. A larger unit must give a smaller number, and a smaller unit a larger one. Getting that backwards is far more common than getting the factor wrong.`,
    }
  },
)

interface DenScaleCase {
  setup: string
  massText: string
  volText: string
  a: number
  b: number
}

const DEN_SCALE_CASES: DenScaleCase[] = [
  { setup: 'A block of the same material is remade in a workshop.', massText: 'six times the mass', volText: 'twice the volume', a: 6, b: 2 },
  { setup: 'A loaf recipe is changed for a bigger tin.', massText: 'twice the mass', volText: 'four times the volume', a: 2, b: 4 },
  { setup: 'A concrete slab is recast to a new specification.', massText: 'eight times the mass', volText: 'twice the volume', a: 8, b: 2 },
  { setup: 'A cushion is refilled with a different amount of stuffing.', massText: 'three times the mass', volText: 'twice the volume', a: 3, b: 2 },
  { setup: 'A foam packing insert is redesigned.', massText: 'the same mass', volText: 'four times the volume', a: 1, b: 4 },
  { setup: 'A metal ingot is recast for a new order.', massText: 'ten times the mass', volText: 'twice the volume', a: 10, b: 2 },
  { setup: 'A batch of clay is scaled up for a larger pot.', massText: 'twice the mass', volText: 'twice the volume', a: 2, b: 2 },
  { setup: 'A ballast weight is rebuilt to a new design.', massText: 'twelve times the mass', volText: 'twice the volume', a: 12, b: 2 },
  { setup: 'A stage prop is rebuilt from lighter material.', massText: 'three times the mass', volText: 'four times the volume', a: 3, b: 4 },
  { setup: 'A rubber buffer is remoulded to a new shape.', massText: 'five times the mass', volText: 'twice the volume', a: 5, b: 2 },
  { setup: 'A soap bar is reformulated for a larger mould.', massText: 'five times the mass', volText: 'four times the volume', a: 5, b: 4 },
  { setup: 'A paving block is remade to a new size.', massText: 'four times the mass', volText: 'twice the volume', a: 4, b: 2 },
]

const densityScale = tpl(
  {
    id: 'pq-den-scale',
    name: 'What happens to density',
    skillIds: ['p-density'],
    bucket: 'physics',
    difficulty: 3,
    variants: 12,
    minutes: 2.5,
  },
  (_rng, seed) => {
    const c = cycle(seed, DEN_SCALE_CASES)
    const factor = round(c.a / c.b, 4)
    return {
      title: 'Density under change',
      prompt:
        `${c.setup} The new version has **${c.massText}** and **${c.volText}** of the old one.\n\n` +
        'By what factor does its **density** change? Give the number you would multiply the old density by.',
      answer: numeric(factor, { unit: 'times' }),
      hints: [
        'Density is mass divided by volume, so a change in either one lands on it — but they pull in opposite directions.',
        `The top of the fraction is multiplied by ${c.a} and the bottom by ${c.b}.`,
        `Worked path: ${c.a} ÷ ${c.b} = **${factor}**.`,
      ],
      explanation:
        `**${factor} times.** Density is mass ÷ volume, so multiplying the mass by ${c.a} and the volume by ${c.b} multiplies the density by ${c.a} ÷ ${c.b} = ${factor}.\n\n` +
        (factor === 1
          ? `Here the two changes cancel exactly, which is the whole point of density: it is a property of the MATERIAL, not of how much of it you have. A larger piece of the same stuff has the same density, and that is why density can be used to identify a material at all.`
          : factor > 1
            ? `The density went up, so the new version is made of packed-in material: more mass squeezed into each unit of space. Notice that neither number on its own could have told you this — ${c.a} times the mass sounds like a lot until you see what happened to the volume.`
            : `The density went down, so the new version is more spread out: the same or more material occupying much more space. This is what makes foam, bread and cork behave as they do, and it is why "heavy" and "dense" are not the same word.`) +
        `\n\nThe habit worth taking: when a fraction changes, deal with the top and the bottom separately and combine at the end. Trying to judge the whole thing in one go is where the sign of the effect gets lost.`,
    }
  },
)

interface FloatCase {
  object: string
  liquid: string
  liquidRho: number
  mass: number
  volume: number
}

const FLOAT_CASES: FloatCase[] = [
  { object: 'a sealed plastic box', liquid: 'water', liquidRho: 1, mass: 240, volume: 300 },
  { object: 'a lump of stone', liquid: 'water', liquidRho: 1, mass: 1200, volume: 400 },
  { object: 'a candle stub', liquid: 'surgical spirit', liquidRho: 0.8, mass: 180, volume: 200 },
  { object: 'a block of balsa', liquid: 'cooking oil', liquidRho: 0.9, mass: 210, volume: 300 },
  { object: 'a glass paperweight', liquid: 'water', liquidRho: 1, mass: 600, volume: 500 },
  { object: 'a sealed jar of air', liquid: 'golden syrup', liquidRho: 1.4, mass: 750, volume: 600 },
  { object: 'a cork float', liquid: 'water', liquidRho: 1, mass: 160, volume: 400 },
  { object: 'an iron bracket', liquid: 'water', liquidRho: 1, mass: 960, volume: 300 },
  { object: 'a sealed tin of oil', liquid: 'water', liquidRho: 1, mass: 450, volume: 500 },
  { object: 'a brass fitting', liquid: 'strong brine', liquidRho: 1.2, mass: 1100, volume: 500 },
  { object: 'a wax block', liquid: 'cooking oil', liquidRho: 0.9, mass: 320, volume: 400 },
  { object: 'a rubber puck', liquid: 'water', liquidRho: 1, mass: 560, volume: 400 },
]

const densityFloat = tpl(
  {
    id: 'pq-den-float',
    name: 'Work out the density, then decide',
    skillIds: ['p-density'],
    bucket: 'physics',
    difficulty: 3,
    variants: 12,
    minutes: 3.5,
    kind: 'multi',
  },
  (rng, seed) => {
    const c = cycle(seed, FLOAT_CASES)
    const rho = round(c.mass / c.volume, 4)
    const floats = rho < c.liquidRho
    const key = floats ? 'Floats to the top' : 'Sinks to the base'
    return {
      title: 'Float or sink',
      prompt:
        `${c.object.charAt(0).toUpperCase()}${c.object.slice(1)} has a mass of **${c.mass} g** and takes up **${c.volume} cm³**.\n\n` +
        `It is lowered into ${c.liquid}, whose density is **${c.liquidRho} g/cm³**.`,
      hints: [
        'Mass on its own decides nothing here. Two objects of the same mass behave completely differently if one of them takes up ten times the space.',
        `Work out how many grams each cubic centimetre of the object carries, then compare that with the ${c.liquidRho} g/cm³ of the ${c.liquid}.`,
        `Worked path: ${c.mass} ÷ ${c.volume} = ${rho} g/cm³, which is ${floats ? 'less' : 'more'} than ${c.liquidRho}.`,
      ],
      explanation:
        `Its density is ${c.mass} ÷ ${c.volume} = **${rho} g/cm³**, against **${c.liquidRho} g/cm³** for the ${c.liquid}, so it **${floats ? 'floats' : 'sinks'}**.\n\n` +
        `What decides it is a comparison of two densities and nothing else. The mass on its own tells you nothing: a ${c.mass} g object floats or sinks depending entirely on how much room it takes up, which is why a steel ship floats and a steel bolt does not.\n\n` +
        `A useful check on the arithmetic: the answer should feel right for the material. If it had come out at ${round(rho * 10, 4)} g/cm³ — ten times the value above — that would be denser than most metals, and the misplaced factor of ten would be visible without rechecking anything.`,
      parts: [
        part('Density', {
          prompt: 'What is the density of the object, in grams per cubic centimetre?',
          answer: numeric(rho, { unit: 'g/cm³' }),
          explanation:
            `Density is mass ÷ volume: ${c.mass} ÷ ${c.volume} = **${rho} g/cm³**. Read that as "every cubic centimetre of this object carries ${rho} grams", which is what makes it comparable with a liquid.`,
          hints: [
            'Density is how much mass sits in each unit of volume.',
            `Divide ${c.mass} by ${c.volume}.`,
            `Worked path: ${c.mass} ÷ ${c.volume} = ${rho}.`,
          ],
        }),
        part('Float or sink', {
          prompt: `Placed in ${c.liquid} at ${c.liquidRho} g/cm³, what does it do?`,
          answer: mcq(rng, key, [
            floats ? 'Sinks to the base' : 'Floats to the top',
            'Hovers wherever it is placed',
            'Cannot be told from these numbers',
          ]),
          explanation:
            `At ${rho} g/cm³ against ${c.liquidRho} g/cm³, the object is ${floats ? 'less dense than the liquid, so it rises until part of it is above the surface' : 'denser than the liquid, so it keeps going down'}. Hovering would need the two densities to be equal, and they are not.`,
          hints: [
            'Compare the two densities directly — they are now in the same units.',
            'Less dense than the liquid means it rises; more dense means it goes down.',
            `Worked path: ${rho} against ${c.liquidRho}.`,
          ],
        }),
      ],
    }
  },
)

interface PressureCase {
  setup: string
  force: number
  area: number
  shrink: number
  why: string
}

const PRESSURE_CASES: PressureCase[] = [
  { setup: 'A stack of crates rests on a wooden pallet.', force: 120, area: 2, shrink: 2, why: 'half the pallet is removed' },
  { setup: 'A garden bench stands on flat feet.', force: 240, area: 3, shrink: 3, why: 'the feet are swapped for ones a third of the size' },
  { setup: 'A water tank sits on a concrete base.', force: 360, area: 4, shrink: 2, why: 'the base is rebuilt at half the area' },
  { setup: 'A marquee pole stands on a spreader plate.', force: 480, area: 6, shrink: 3, why: 'a plate a third of the size is used instead' },
  { setup: 'A tractor stands on wide tyres.', force: 600, area: 8, shrink: 4, why: 'narrow tyres a quarter of the width are fitted' },
  { setup: 'A greenhouse rests on a gravel bed.', force: 720, area: 12, shrink: 2, why: 'the bed is halved in area' },
  { setup: 'A workbench stands on four broad feet.', force: 240, area: 2, shrink: 4, why: 'the feet are replaced by ones a quarter of the size' },
  { setup: 'A sculpture sits on a flat plinth.', force: 360, area: 3, shrink: 3, why: 'a plinth a third of the area is used' },
  { setup: 'A trailer rests on its parking legs.', force: 480, area: 4, shrink: 2, why: 'the leg pads are halved in area' },
  { setup: 'A cold frame sits on paving slabs.', force: 600, area: 12, shrink: 5, why: 'it is moved onto supports a fifth of the area' },
  { setup: 'A boiler stands on a steel frame.', force: 720, area: 8, shrink: 2, why: 'half the frame is taken away' },
  { setup: 'A planter rests on decking boards.', force: 120, area: 3, shrink: 3, why: 'it is moved onto a third of the boards' },
]

const densityPressure = tpl(
  {
    id: 'pq-den-pressure',
    name: 'Same push, smaller area',
    skillIds: ['p-density'],
    bucket: 'physics',
    difficulty: 3,
    variants: 12,
    minutes: 3,
    kind: 'multi',
  },
  (_rng, seed) => {
    const c = cycle(seed, PRESSURE_CASES)
    const p1 = c.force / c.area
    const p2 = p1 * c.shrink
    const newArea = round(c.area / c.shrink, 4)
    return {
      title: 'Pressure and area',
      prompt:
        `${c.setup} It presses down with a force of **${c.force} N**, spread over **${c.area} m²**.\n\n` +
        `Later, ${c.why} — the same force, now on **${newArea} m²**.`,
      hints: [
        'Pressure is the force divided by the area it is spread over, so the same force can give very different pressures.',
        `First situation: ${c.force} N over ${c.area} m². Second: the same ${c.force} N over ${newArea} m².`,
        `Worked path: ${c.force} ÷ ${c.area} = ${p1} Pa, and ${c.force} ÷ ${newArea} = ${p2} Pa.`,
      ],
      explanation:
        `The pressure goes from **${p1} Pa** to **${p2} Pa** — ${c.shrink} times as much, from a force that never changed.\n\n` +
        `That is the whole relationship in one line: cut the area to a ${c.shrink === 2 ? 'half' : c.shrink === 3 ? 'third' : c.shrink === 4 ? 'quarter' : 'fifth'} and the pressure multiplies by ${c.shrink}. Push the idea to its edge and it explains a lot of everyday things — an area approaching zero gives a pressure growing without limit, which is what a knife edge, a drawing pin and a stiletto heel all rely on. The same weight through a snowshoe does the opposite.\n\n` +
        `The mistake worth naming: treating "heavier" and "higher pressure" as the same thing. The force here never changed at all.`,
      parts: [
        part('Before', {
          prompt: `What is the pressure to begin with, in pascals? (One pascal is one newton per square metre.)`,
          answer: numeric(p1, { unit: 'Pa' }),
          explanation:
            `Pressure = force ÷ area = ${c.force} ÷ ${c.area} = **${p1} Pa**. Every square metre underneath is carrying ${p1} newtons.`,
          hints: [
            'Spread the force out evenly over the area it acts on.',
            `Divide ${c.force} by ${c.area}.`,
            `Worked path: ${c.force} ÷ ${c.area} = ${p1}.`,
          ],
        }),
        part('After', {
          prompt: `Now the same ${c.force} N acts on ${newArea} m². What is the pressure, in pascals?`,
          answer: numeric(p2, { unit: 'Pa' }),
          explanation:
            `${c.force} ÷ ${newArea} = **${p2} Pa**, which is ${c.shrink} times the first answer. Dividing the area by ${c.shrink} multiplies the pressure by ${c.shrink}, because the area is on the bottom of the fraction.`,
          hints: [
            'Same force, new area — nothing else has changed.',
            `The area is now ${c.shrink} times smaller, so ask what that does to a number on the bottom of a fraction.`,
            `Worked path: ${c.force} ÷ ${newArea} = ${p2}.`,
          ],
        }),
      ],
    }
  },
)
interface MomScaleCase {
  thing: string
  aText: string
  a: number
  bText: string
  b: number
}

const MOM_SCALE_CASES: MomScaleCase[] = [
  { thing: 'trolley', aText: 'twice', a: 2, bText: 'half', b: 0.5 },
  { thing: 'cart', aText: 'three times', a: 3, bText: 'twice', b: 2 },
  { thing: 'sledge', aText: 'twice', a: 2, bText: 'twice', b: 2 },
  { thing: 'wagon', aText: 'four times', a: 4, bText: 'half', b: 0.5 },
  { thing: 'canoe', aText: 'half', a: 0.5, bText: 'four times', b: 4 },
  { thing: 'ball bearing', aText: 'three times', a: 3, bText: 'half', b: 0.5 },
  { thing: 'puck', aText: 'twice', a: 2, bText: 'three times', b: 3 },
  { thing: 'float', aText: 'half', a: 0.5, bText: 'half', b: 0.5 },
  { thing: 'barrow', aText: 'five times', a: 5, bText: 'twice', b: 2 },
  { thing: 'buggy', aText: 'one and a half times', a: 1.5, bText: 'twice', b: 2 },
  { thing: 'drone', aText: 'four times', a: 4, bText: 'a quarter of', b: 0.25 },
  { thing: 'skater', aText: 'twice', a: 2, bText: 'one and a half times', b: 1.5 },
]

const momentumScale = tpl(
  {
    id: 'pq-mom-scale',
    name: 'Momentum when both quantities change',
    skillIds: ['p-momentum'],
    bucket: 'physics',
    difficulty: 2,
    variants: 12,
    minutes: 2,
  },
  (_rng, seed) => {
    const c = cycle(seed, MOM_SCALE_CASES)
    const factor = round(c.a * c.b, 4)
    return {
      title: 'Two changes at once',
      prompt:
        `A second ${c.thing} has **${c.aText}** the mass of the first and moves at **${c.bText}** the speed.\n\n` +
        'By what factor is its **momentum** bigger or smaller than the first one? Give the number you would multiply by.',
      answer: numeric(factor, { unit: 'times' }),
      hints: [
        'Momentum is mass multiplied by speed, so a change in either one carries straight through to it.',
        `Two factors are at work here: ${c.a} on the mass and ${c.b} on the speed. They multiply together.`,
        `Worked path: ${c.a} × ${c.b} = **${factor}**.`,
      ],
      explanation:
        `**${factor} times.** Momentum is mass × speed, so the two factors simply multiply: ${c.a} × ${c.b} = ${factor}.\n\n` +
        (factor === 1
          ? `The two changes cancel exactly, so the second ${c.thing} is every bit as hard to stop as the first even though it is a different object moving at a different speed. That is the useful thing about momentum — it is the single number that says how much stopping there is to do, and neither mass nor speed tells you on its own.`
          : factor > 1
            ? `The second ${c.thing} is ${factor} times harder to stop. Notice that neither number in the question would have told you that alone: the mass factor and the speed factor pull in the same direction here, so they compound.`
            : `The second ${c.thing} is easier to stop, by a factor of ${round(1 / factor, 4)}. The mass went one way and the speed went the other, and the speed change won.`) +
        `\n\nWorth contrasting with energy of motion, which depends on the SQUARE of the speed. The same pair of changes would do something different there — which is why "how hard to stop" and "how much damage" are two different questions with two different answers.`,
    }
  },
)

/** [mass kg, speed m/s (even), braking force N] — momentum and stopping time both come out whole. */
const MOM_STOP_PARAMS: [number, number, number][] = [
  [4, 6, 8],
  [6, 10, 12],
  [3, 8, 6],
  [5, 4, 10],
  [8, 6, 16],
  [2, 12, 8],
  [7, 4, 14],
  [6, 6, 9],
  [9, 4, 12],
  [4, 10, 8],
  [10, 6, 20],
  [5, 8, 10],
]

const MOM_STOP_SCENES: string[] = [
  'Two loaded trolleys roll along a level corridor.',
  'Two carts run down the same length of track.',
  'Two sledges slide across flat ice.',
  'Two wagons roll along a level siding.',
  'Two trays slide along a polished bench.',
  'Two model boats glide across still water.',
  'Two pucks slide along an air table.',
  'Two barrows roll down a level path.',
  'Two buggies roll along a smooth floor.',
  'Two skateboards roll along a flat yard.',
  'Two crates slide along a loading deck.',
  'Two rollers run along a level frame.',
]

const momentumStop = tpl(
  {
    id: 'pq-mom-stop',
    name: 'How long a steady force takes to stop it',
    skillIds: ['p-momentum'],
    bucket: 'physics',
    difficulty: 3,
    variants: 12,
    minutes: 3.5,
    kind: 'multi',
  },
  (rng, seed) => {
    const [m, v, f] = MOM_STOP_PARAMS[seed % MOM_STOP_PARAMS.length]
    const scene = cycle(seed, MOM_STOP_SCENES)
    const p = m * v
    const t = p / f
    const key = 'The same — their momentum is equal'
    return {
      title: 'Stopping time',
      prompt:
        `${scene}\n\n- **A** has a mass of **${m} kg** and moves at **${v} m/s**.\n` +
        `- **B** has **${2 * m} kg** and moves at **${v / 2} m/s**.\n\n` +
        `The same steady braking force of **${f} N** is applied to each.`,
      hints: [
        'A steady force removes momentum at a steady rate: every second, it takes away an amount equal to the force.',
        `So the time to stop is the momentum divided by the force — for A that is ${p} ÷ ${f}.`,
        `Worked path: A has ${m} × ${v} = ${p} kg m/s, and ${p} ÷ ${f} = ${t} s. B has ${2 * m} × ${v / 2} = ${p} kg m/s, which is the same.`,
      ],
      explanation:
        `A carries ${m} × ${v} = **${p} kg m/s** and stops in ${p} ÷ ${f} = **${t} s**. B carries ${2 * m} × ${v / 2} = **${p} kg m/s** as well, so it takes exactly the same ${t} s.\n\n` +
        `A steady force takes momentum away at a steady rate — ${f} units of it every second — so the stopping time depends on the momentum and on nothing else. The heavier object being slower is not a coincidence in this question; it is what makes the two momenta equal.\n\n` +
        `A limit-case check on the relation: with no braking force at all, the time to stop grows without limit, which is the correct description of something that never stops. With zero speed the momentum is zero and the stopping time is zero, which is also right. A relation that survives both ends is usually the right way up.`,
      parts: [
        part('Momentum', {
          prompt: `What is the momentum of A, in kg m/s?`,
          answer: numeric(p, { unit: 'kg m/s' }),
          explanation: `Momentum is mass × speed: ${m} × ${v} = **${p} kg m/s**. This is the quantity the braking force has to remove.`,
          hints: ['Momentum is mass multiplied by speed.', `Multiply ${m} by ${v}.`, `Worked path: ${m} × ${v} = ${p}.`],
        }),
        part('Stopping time', {
          prompt: `A steady ${f} N brings A to rest. How many seconds does that take?`,
          answer: numeric(t, { unit: 's' }),
          explanation:
            `A force of ${f} N removes ${f} kg m/s of momentum every second, so clearing ${p} takes ${p} ÷ ${f} = **${t} s**. Units check: kg m/s ÷ N gives seconds, because a newton is a kg m/s per second.`,
          hints: [
            'The force removes the same amount of momentum every second.',
            `How many lots of ${f} are there in ${p}?`,
            `Worked path: ${p} ÷ ${f} = ${t}.`,
          ],
        }),
        part('Comparing', {
          prompt: `The same ${f} N is applied to B. Compared with A, how long does B take to stop?`,
          answer: mcq(rng, key, [
            'B stops first',
            'B takes longer, because it is heavier',
            'A takes longer, because it is moving faster',
          ]),
          explanation:
            `The same time. B has ${2 * m} × ${v / 2} = ${p} kg m/s, exactly the momentum A has, and stopping time is momentum divided by force. Heaviness alone does not decide it and neither does speed alone — the product does.`,
          hints: [
            'Work out the momentum of B before comparing anything.',
            `Twice the mass at half the speed — what does that do to the product?`,
            `Worked path: ${2 * m} × ${v / 2} = ${p}, the same as A.`,
          ],
        }),
      ],
    }
  },
)

/** [mass of the moving cart, its speed, mass of the stationary cart]. */
const COLLIDE_PARAMS: [number, number, number][] = [
  [2, 6, 4],
  [3, 8, 1],
  [4, 5, 6],
  [6, 4, 2],
  [2, 9, 1],
  [5, 6, 5],
  [8, 3, 4],
  [3, 10, 2],
  [9, 2, 3],
  [4, 7, 3],
  [10, 3, 5],
  [6, 5, 9],
]

const COLLIDE_SCENES: [string, string][] = [
  ['trolley', 'a corridor'],
  ['cart', 'a straight track'],
  ['wagon', 'a level siding'],
  ['sledge', 'flat ice'],
  ['puck', 'an air table'],
  ['truck', 'a model railway'],
  ['float', 'a still tank'],
  ['block', 'a low-friction rail'],
  ['glider', 'an air track'],
  ['buggy', 'a smooth floor'],
  ['roller', 'a level frame'],
  ['skate', 'a polished floor'],
]

const momentumCollide = tpl(
  {
    id: 'pq-mom-collide',
    name: 'They stick together — how fast?',
    skillIds: ['p-momentum'],
    bucket: 'physics',
    difficulty: 3,
    variants: 12,
    minutes: 3,
  },
  (_rng, seed) => {
    const [m1, v1, m2] = COLLIDE_PARAMS[seed % COLLIDE_PARAMS.length]
    const [thing, place] = cycle(seed, COLLIDE_SCENES)
    const total = m1 * v1
    const vf = round(total / (m1 + m2), 4)
    return {
      title: 'Sticking together',
      prompt:
        `A **${m1} kg** ${thing} moving at **${v1} m/s** along ${place} runs into a **${m2} kg** ${thing} standing still. ` +
        'They lock together and carry on as one.\n\n' +
        'How fast do they move afterwards, in metres per second?',
      answer: numeric(vf, { unit: 'm/s' }),
      hints: [
        'Nothing outside is pushing along the direction of travel, so the total momentum after the collision is the same as before it.',
        `Before: ${m1} × ${v1} = ${total} kg m/s in total, because the second one contributes nothing. After: the same ${total}, now carried by ${m1 + m2} kg.`,
        `Worked path: ${total} ÷ ${m1 + m2} = **${vf} m/s**.`,
      ],
      explanation:
        `**${vf} m/s.** The momentum before is ${m1} × ${v1} = ${total} kg m/s, all of it in the moving ${thing}. Afterwards the same ${total} kg m/s is shared by a combined mass of ${m1} + ${m2} = ${m1 + m2} kg, so the speed is ${total} ÷ ${m1 + m2} = ${vf} m/s.\n\n` +
        `The tempting answer is ${v1} — the speed it came in at — or the average of ${v1} and 0. Both ignore the mass that has just been picked up. A useful check runs the mass of the second ${thing} to its extremes: make it almost nothing and the answer should barely change from ${v1}, and make it enormous and the answer should approach zero. This relation does both, which is a good sign that it is the right way up.\n\n` +
        `One honest note: momentum is conserved here, and energy is not. Some of the energy of motion goes into deforming, warming and making a noise, which is why the two objects stay together rather than bouncing apart.`,
    }
  },
)

/** [resistance of each resistor, how many are in the loop, battery voltage]. */
const SERIES_PARAMS: [number, number, number][] = [
  [4, 2, 24],
  [5, 3, 60],
  [6, 1, 12],
  [3, 4, 60],
  [2, 5, 60],
  [10, 2, 60],
  [4, 3, 48],
  [5, 1, 10],
  [8, 2, 48],
  [6, 3, 72],
  [3, 2, 18],
  [2, 3, 24],
]

const seriesCurrent = tpl(
  {
    id: 'pq-cir-series',
    name: 'One more resistor in the loop',
    skillIds: ['p-circuits'],
    bucket: 'physics',
    difficulty: 3,
    variants: 12,
    minutes: 2.5,
  },
  (_rng, seed) => {
    const [r, n, v] = SERIES_PARAMS[seed % SERIES_PARAMS.length]
    const before = v / (n * r)
    const after = v / ((n + 1) * r)
    const askAfter = seed % 2 === 0
    return {
      title: 'Series current',
      prompt:
        `A **${v} V** battery drives a loop containing **${n}** identical **${r} Ω** resistor${n === 1 ? '' : 's'} in series.\n\n` +
        (askAfter
          ? `One more identical **${r} Ω** resistor is added to the loop, in series with the others. What is the current then, in amps?`
          : `What is the current in the loop, in amps?`),
      answer: numeric(askAfter ? after : before, { unit: 'A' }),
      hints: [
        'Resistors in a single loop add up. Find the total resistance the battery is pushing against, then use it once.',
        askAfter
          ? `With ${n + 1} of them the total is ${n + 1} × ${r} = ${(n + 1) * r} Ω.`
          : `With ${n} of them the total is ${n} × ${r} = ${n * r} Ω.`,
        askAfter
          ? `Worked path: ${v} ÷ ${(n + 1) * r} = **${after} A**.`
          : `Worked path: ${v} ÷ ${n * r} = **${before} A**.`,
      ],
      explanation:
        askAfter
          ? `**${after} A.** With ${n + 1} resistors the total is ${(n + 1) * r} Ω, so the current is ${v} ÷ ${(n + 1) * r} = ${after} A — down from ${before} A before the extra resistor was added.\n\n` +
            `Notice what the current did NOT do: it did not fall by ${r}, and it did not halve unless the numbers happened to work out that way. It fell in the ratio ${n} to ${n + 1}, because that is the ratio of the totals. Adding a resistor changes the current by a factor, not by an amount.\n\n` +
            `The check worth having: the current is the same everywhere in a single loop, so there is only ever one current to find. If your working produced a different current for different parts of the loop, the setup is wrong before the arithmetic is.`
          : `**${before} A.** The ${n} resistor${n === 1 ? '' : 's'} in series total ${n * r} Ω, and ${v} ÷ ${n * r} = ${before} A.\n\n` +
            `Series resistances add because the same current has to force its way through each of them in turn, so their effects stack. If one more ${r} Ω resistor joined the loop, the total would become ${(n + 1) * r} Ω and the current would drop to ${after} A — a change by a factor of ${n} to ${n + 1} rather than by any fixed amount.\n\n` +
            `Limit case worth trying on this relation: as the total resistance grows without bound the current goes to zero, which is a broken circuit, and as it falls towards zero the current grows without bound, which is a short circuit. Both ends match what really happens.`,
    }
  },
)

/** [battery volts, first resistance, second resistance]. */
const DIVIDE_PARAMS: [number, number, number][] = [
  [12, 2, 4],
  [24, 3, 5],
  [20, 5, 15],
  [18, 1, 2],
  [30, 4, 6],
  [36, 3, 6],
  [9, 1, 2],
  [48, 2, 6],
  [15, 2, 3],
  [40, 3, 5],
  [12, 1, 3],
  [27, 2, 7],
]

const voltageDivide = tpl(
  {
    id: 'pq-cir-divide',
    name: 'How a series pair shares the voltage',
    skillIds: ['p-circuits'],
    bucket: 'physics',
    difficulty: 3,
    variants: 12,
    minutes: 2.5,
  },
  (_rng, seed) => {
    const [v, r1, r2] = DIVIDE_PARAMS[seed % DIVIDE_PARAMS.length]
    const total = r1 + r2
    const current = round(v / total, 4)
    const v1 = round((v * r1) / total, 4)
    const v2 = round(v - v1, 4)
    return {
      title: 'Sharing the voltage',
      prompt:
        `A **${v} V** battery drives two resistors in series: one of **${r1} Ω** and one of **${r2} Ω**.\n\n` +
        `How many volts are dropped across the **${r1} Ω** one?`,
      answer: numeric(v1, { unit: 'V' }),
      hints: [
        'The same current passes through both resistors, because there is only one path. Find that current first.',
        `Total resistance ${r1} + ${r2} = ${total} Ω, so the current is ${v} ÷ ${total} = ${current} A.`,
        `Worked path: ${current} × ${r1} = **${v1} V**.`,
      ],
      explanation:
        `**${v1} V.** The two in series total ${total} Ω, so the current is ${v} ÷ ${total} = ${current} A, and across the ${r1} Ω resistor that current drops ${current} × ${r1} = ${v1} V. The other ${r2} Ω takes the remaining ${v2} V, and the two add back to ${v} V.\n\n` +
        `The shortcut worth seeing is that the voltages split in the same ratio as the resistances — ${r1} to ${r2} — because the current is the same through both. So the ${r1 > r2 ? `${r1} Ω` : `${r2} Ω`} resistor always takes the larger share, whatever the battery is.\n\n` +
        `The mistake this catches is halving the voltage automatically. An even split only happens when the two resistances are equal, and here they are not.`,
    }
  },
)

interface CircuitCase {
  change: string
  key: string
  decoys: [string, string, string]
  why: string
}

const CIRCUIT_CASES: CircuitCase[] = [
  {
    change: 'A second identical bulb is added in series with the first.',
    key: 'The current halves',
    decoys: ['The current rises', 'The current is unchanged', 'The current stops everywhere in the loop'],
    why: 'The resistance in the single path has doubled while the battery has not changed, so the current is halved.',
  },
  {
    change: 'One bulb is unscrewed from a series loop of three.',
    key: 'The current stops everywhere in the loop',
    decoys: ['The current rises', 'The other two get brighter than before', 'The other two carry on exactly as before'],
    why: 'A series loop has one path, and removing any part of it breaks that path for everything on it.',
  },
  {
    change: 'The battery voltage is doubled and the resistance is left alone.',
    key: 'The current doubles',
    decoys: ['The current halves', 'The current is unchanged', 'The current goes up a little, but not by twice'],
    why: 'Current is voltage divided by resistance, so with the resistance fixed the current follows the voltage exactly.',
  },
  {
    change: 'A resistor is replaced by one with three times the resistance.',
    key: 'The current falls to a third of what it was',
    decoys: ['The current triples', 'The current is unchanged', 'The current falls, but by less than a third'],
    why: 'Resistance is on the bottom of the relation, so multiplying it by three divides the current by three.',
  },
  {
    change: 'A second identical cell is added in series with the first.',
    key: 'The current doubles',
    decoys: ['The current halves', 'The current is unchanged', 'The current rises a little because the cells share the work'],
    why: 'Cells in series add their voltages, and with the resistance unchanged twice the voltage gives twice the current.',
  },
  {
    change: 'One of the connecting wires is replaced by a thicker one of lower resistance.',
    key: 'The current rises',
    decoys: ['The current falls', 'The current is unchanged', 'The current stops until the circuit is rebuilt'],
    why: 'The wire is part of the total resistance, so lowering it lowers the total and raises the current.',
  },
  {
    change: 'A switch anywhere in the series loop is opened.',
    key: 'No current flows anywhere in the circuit',
    decoys: ['The current rises', 'Only the part after the switch stops carrying current', 'The current keeps flowing until the cell runs down'],
    why: 'There is one path, so a gap anywhere in it stops the flow everywhere in it at the same instant.',
  },
  {
    change: 'Two unequal resistors sit in series, with the same current through both.',
    key: 'The bigger resistor takes the bigger share of the voltage',
    decoys: ['The voltage splits evenly between them', 'The smaller resistor takes the bigger share of the voltage', 'Each resistor takes the whole of the battery voltage in turn'],
    why: 'With the same current through both, the voltage across each is proportional to its own resistance.',
  },
  {
    change: 'A wire is connected straight across one of two series resistors.',
    key: 'The current rises',
    decoys: ['The current falls', 'The current is unchanged', 'The current stops because the circuit is now broken'],
    why: 'The wire gives the current a way past that resistor, so the total resistance drops and the current goes up.',
  },
  {
    change: 'A third identical bulb is added in series with two others.',
    key: 'Each bulb becomes dimmer than before',
    decoys: ['Each bulb stays as it was', 'Each bulb becomes brighter than before', 'The first two dim and the new one stays bright'],
    why: 'The total resistance rises, so the shared current falls, and every bulb on that path gets less of it.',
  },
]

const circuitReason = tpl(
  {
    id: 'pq-cir-reason',
    name: 'What changing the circuit does',
    skillIds: ['p-circuits'],
    bucket: 'physics',
    difficulty: 3,
    variants: 10,
    minutes: 2.5,
  },
  (rng, seed) => {
    const c = cycle(seed, CIRCUIT_CASES)
    return {
      title: 'Change one thing',
      prompt: `A simple series circuit runs from one battery.\n\n**${c.change}**\n\nWhat happens?`,
      answer: mcq(rng, c.key, [...c.decoys]),
      hints: [
        'Ask two questions in order: what has happened to the total resistance in the loop, and what has happened to the battery voltage?',
        'Then use the fact that the current is the voltage divided by the total resistance — and that in a single loop the current is the same everywhere.',
        `Worked path: **${c.key}**`,
      ],
      explanation:
        `**${c.key}** ${c.why}\n\n` +
        'Two ideas carry almost every question of this kind. In a single loop the current is the same at every point, so there is only ever one current to think about. And that current is set by the battery voltage divided by everything in its way, so any change has to be traced to one of those two before anything else is decided.\n\n' +
        'The habit worth building is refusing to answer from the picture. A change that looks small can double a total, and a change that looks dramatic can leave the total alone.',
    }
  },
)

interface WaveScaleCase {
  medium: string
  v: number
  f: number
  k: number
  kText: string
}

const WAVE_SCALE_CASES: WaveScaleCase[] = [
  { medium: 'air', v: 340, f: 170, k: 2, kText: 'doubled' },
  { medium: 'air', v: 340, f: 85, k: 4, kText: 'multiplied by four' },
  { medium: 'water', v: 1500, f: 500, k: 3, kText: 'tripled' },
  { medium: 'water', v: 1500, f: 250, k: 2, kText: 'doubled' },
  { medium: 'a long rope', v: 240, f: 60, k: 4, kText: 'multiplied by four' },
  { medium: 'a long rope', v: 240, f: 80, k: 2, kText: 'doubled' },
  { medium: 'cold air', v: 320, f: 80, k: 2, kText: 'doubled' },
  { medium: 'cold air', v: 320, f: 160, k: 2, kText: 'doubled' },
  { medium: 'a steel rail', v: 1200, f: 400, k: 2, kText: 'doubled' },
  { medium: 'a steel rail', v: 1200, f: 300, k: 2, kText: 'doubled' },
  { medium: 'a stretched spring', v: 480, f: 160, k: 2, kText: 'doubled' },
  { medium: 'a stretched spring', v: 480, f: 120, k: 4, kText: 'multiplied by four' },
]

const waveScale = tpl(
  {
    id: 'pq-wav-scale',
    name: 'Change the frequency, keep the medium',
    skillIds: ['p-waves'],
    bucket: 'physics',
    difficulty: 3,
    variants: 12,
    minutes: 2.5,
  },
  (_rng, seed) => {
    const c = cycle(seed, WAVE_SCALE_CASES)
    const lambda = round(c.v / c.f, 4)
    const newF = c.f * c.k
    const newLambda = round(c.v / newF, 4)
    return {
      title: 'Wavelength after a change',
      prompt:
        `A wave travels through ${c.medium} at **${c.v} m/s**, and the source vibrates at **${c.f} Hz**.\n\n` +
        `The frequency is then **${c.kText}**, to ${newF} Hz. The ${c.medium} is unchanged.\n\n` +
        'What is the new wavelength, in metres?',
      answer: numeric(newLambda, { unit: 'm' }),
      hints: [
        'Before working anything out, decide which of the three quantities is PINNED by the situation. That one does not move, and the other two have to accommodate each other.',
        `The speed is set by the ${c.medium}, so it stays at ${c.v} m/s. The original wavelength is ${c.v} ÷ ${c.f} = ${lambda} m.`,
        `Worked path: ${c.v} ÷ ${newF} = **${newLambda} m**.`,
      ],
      explanation:
        `**${newLambda} m.** The wavelength started at ${c.v} ÷ ${c.f} = ${lambda} m, and after the change it is ${c.v} ÷ ${newF} = ${newLambda} m.\n\n` +
        `The speed never moved, because the speed of a wave is a property of what it is travelling through and not of how fast the source is shaken. With the speed pinned, frequency and wavelength are locked together the other way round: multiply one by ${c.k} and the other is divided by ${c.k}.\n\n` +
        `The common error is reading v = f × λ as "f goes up, so λ goes up too". That would be right if the SPEED were free to change, and it is not — which is why the first move on any question like this is to ask which of the three the situation has pinned down.`,
    }
  },
)

interface WaveCatchCase {
  shown: string
  key: string
  decoys: [string, string, string]
  why: string
}

const WAVE_CATCH_CASES: WaveCatchCase[] = [
  {
    shown: 'wavelength ÷ frequency, to find the speed',
    key: 'That gives metre-seconds, and a speed needs metres per second',
    decoys: ['Nothing is wrong here', 'That gives a plain number with no units at all', 'That gives metres per second squared, which is an acceleration'],
    why: 'Metres divided by per-second is metres × seconds. Speed needs the seconds underneath, so the two should have been multiplied.',
  },
  {
    shown: 'frequency × wavelength, to find the speed',
    key: 'Nothing is wrong — the units come out as metres per second',
    decoys: ['That gives metre-seconds', 'The two should have been divided, not multiplied together', 'The wavelength should have been squared before multiplying'],
    why: 'Per-second multiplied by metres is metres per second, which is exactly what a speed is.',
  },
  {
    shown: '1 ÷ frequency, to find the period',
    key: 'Nothing is wrong — one over per-second gives seconds',
    decoys: ['That gives hertz', 'The frequency should have been multiplied by the wavelength', 'That gives a plain number, because the one has no units'],
    why: 'A frequency is a count per second, so one divided by it is seconds per count — a period.',
  },
  {
    shown: 'frequency ÷ 1, to find the period',
    key: 'That gives hertz again, and a period has to be in seconds',
    decoys: ['Nothing is wrong here', 'That gives metre-seconds instead of the seconds wanted', 'That gives a plain number, since dividing by one removes the unit'],
    why: 'Dividing by a bare one changes nothing at all, so the answer is still a frequency wearing the name of a period.',
  },
  {
    shown: 'speed ÷ frequency, to find the wavelength',
    key: 'Nothing is wrong — that gives metres',
    decoys: ['That gives hertz', 'The two should have been multiplied, not divided at all', 'That gives metres per second squared, an acceleration'],
    why: 'Metres per second divided by per-second leaves metres, which is a length.',
  },
  {
    shown: 'speed × frequency, to find the wavelength',
    key: 'That gives metres per second squared, not metres',
    decoys: ['Nothing is wrong here', 'That gives seconds', 'The speed should have been divided by the frequency instead'],
    why: 'Multiplying by a per-second quantity adds another second to the denominator, taking the answer further from a length rather than towards one.',
  },
  {
    shown: 'speed ÷ wavelength, to find the frequency',
    key: 'Nothing is wrong — that gives per second, which is hertz',
    decoys: ['That gives seconds', 'That gives metre-seconds rather than anything per second', 'The two should have been multiplied to give a frequency'],
    why: 'Metres per second divided by metres leaves per second, and per second is what a frequency is measured in.',
  },
  {
    shown: 'wavelength ÷ speed, to find the frequency',
    key: 'That gives seconds, and a frequency has to be per second',
    decoys: ['Nothing is wrong here', 'That gives metres', 'The wavelength should have been squared before dividing it'],
    why: 'This is the right division turned upside down, so it produces a time rather than a rate.',
  },
  {
    shown: 'period × frequency, to find the wavelength',
    key: 'That gives a plain number with no units, so not a length',
    decoys: ['Nothing is wrong here', 'That gives seconds squared', 'The period should have been divided by the frequency here'],
    why: 'Period and frequency are reciprocals, so multiplying them always gives exactly one — a number with no units and no length in it.',
  },
  {
    shown: '1 ÷ period, to find the frequency',
    key: 'Nothing is wrong — one over seconds gives per second',
    decoys: ['That gives seconds', 'That gives metres per second, which is a speed not a rate', 'The period should have been multiplied by the wavelength'],
    why: 'Frequency and period are each one divided by the other, and the units follow the same way round.',
  },
]

const waveCatch = tpl(
  {
    id: 'pq-wav-catch',
    name: 'Catch it with units alone',
    skillIds: ['p-waves', 'p-measure'],
    bucket: 'physics',
    difficulty: 3,
    variants: 10,
    minutes: 3,
    transfer: true,
  },
  (rng, seed) => {
    const c = cycle(seed, WAVE_CATCH_CASES)
    const clean = c.key.startsWith('Nothing is wrong')
    return {
      title: 'Units as the check',
      prompt:
        `A student is working with a wave and writes down:\n\n> ${c.shown}\n\n` +
        'Without doing any arithmetic at all, and without any numbers, what can you say about that step?\n\n' +
        '**Some of these are fine.** Saying nothing is wrong is a real answer.',
      answer: mcq(rng, c.key, [...c.decoys]),
      hints: [
        'Write each quantity as its unit and nothing else: a wavelength is metres, a frequency is per second, a period is seconds, a speed is metres per second.',
        'Then carry out the multiplication or division on the units alone and see what you are left with. Compare that with the unit the answer is supposed to have.',
        `Worked path: **${c.key}**`,
      ],
      explanation:
        `**${c.key}** ${c.why}\n\n` +
        (clean
          ? 'Being able to say "this is fine" is half of checking. A bank of these where something is always wrong would train you to invent an objection, and inventing objections is not the same skill as judging work.'
          : 'A units check finds this before any arithmetic happens, which is why it is worth doing first rather than last. The number that would have come out of this step might well have looked reasonable — plausible size, sensible decimal places — and it would still have been the wrong kind of quantity.') +
        '\n\nThe general move: carry the units through every line instead of writing them on at the end. Units that do not cancel to the thing you were asked for are proof of an error, and they are proof you can get without knowing the right answer.',
    }
  },
)

/** [frequency in hertz, which direction the question runs]. */
const PERIOD_PARAMS: [number, 'toT' | 'toF' | 'double'][] = [
  [4, 'toT'],
  [5, 'toF'],
  [8, 'double'],
  [10, 'toT'],
  [20, 'toF'],
  [25, 'double'],
  [50, 'toT'],
  [40, 'toF'],
  [2, 'double'],
  [16, 'toT'],
  [100, 'toF'],
  [250, 'toT'],
]

const PERIOD_SOURCES: string[] = [
  'a loudspeaker cone',
  'a tuning fork',
  'a plucked string',
  'a vibrating plate',
  'a swinging pendulum',
  'a shaking table',
  'a signal generator',
  'a rotating fan blade',
  'a bobbing float',
  'a struck drum skin',
  'a buzzing reed',
  'a tapped metal bar',
]

const wavePeriod = tpl(
  {
    id: 'pq-wav-period',
    name: 'Frequency and period are one relation',
    skillIds: ['p-waves'],
    bucket: 'physics',
    difficulty: 2,
    variants: 12,
    minutes: 2,
  },
  (_rng, seed) => {
    const [f, mode] = PERIOD_PARAMS[seed % PERIOD_PARAMS.length]
    const source = cycle(seed, PERIOD_SOURCES)
    const period = round(1 / f, 6)
    const halved = round(1 / (2 * f), 6)
    const prompt =
      mode === 'toT'
        ? `${source.charAt(0).toUpperCase()}${source.slice(1)} vibrates at **${f} Hz**. How long does one complete vibration take, in seconds?`
        : mode === 'toF'
          ? `One complete vibration of ${source} takes **${period} s**. What is its frequency, in hertz?`
          : `${source.charAt(0).toUpperCase()}${source.slice(1)} vibrates at **${f} Hz**, and the frequency is then doubled. How long does one vibration take now, in seconds?`
    const answer = mode === 'toT' ? period : mode === 'toF' ? f : halved
    return {
      title: 'One over the other',
      prompt,
      answer: numeric(answer, { unit: mode === 'toF' ? 'Hz' : 's' }),
      hints: [
        'Frequency counts vibrations per second; period is the seconds each vibration takes. Each is one divided by the other, and nothing else is involved.',
        mode === 'toT'
          ? `${f} vibrations share one second between them.`
          : mode === 'toF'
            ? `If one vibration takes ${period} s, ask how many of those fit into a whole second.`
            : `At ${f} Hz the period is ${period} s. Doubling the frequency packs twice as many vibrations into the same second.`,
        mode === 'toT'
          ? `Worked path: 1 ÷ ${f} = **${period} s**.`
          : mode === 'toF'
            ? `Worked path: 1 ÷ ${period} = **${f} Hz**.`
            : `Worked path: 1 ÷ ${2 * f} = **${halved} s**.`,
      ],
      explanation:
        (mode === 'toT'
          ? `**${period} s.** With ${f} vibrations in every second, each one gets ${1} ÷ ${f} = ${period} of a second.`
          : mode === 'toF'
            ? `**${f} Hz.** If one vibration takes ${period} s, then ${f} of them fit into a second, because 1 ÷ ${period} = ${f}.`
            : `**${halved} s.** At ${f} Hz the period was ${period} s; at ${2 * f} Hz it is 1 ÷ ${2 * f} = ${halved} s, exactly half as long.`) +
        `\n\nThe two are not separate facts to remember. They are one relation read in two directions, which is why doubling either one always halves the other — no formula sheet needed, just the meaning of the words.\n\n` +
        `A limit-case check: as the frequency falls towards zero the period grows without limit, which correctly describes something that never completes a vibration. As the frequency grows the period shrinks towards zero and never reaches it, which is also right.`,
    }
  },
)

interface VelShape {
  key: string
  base: [number, number, number, number, number]
  story: string
  why: string
}

const VEL_SHAPES: VelShape[] = [
  { key: 'steady', base: [6, 6, 6, 6, 6], story: 'Moving at a steady speed the whole way', why: 'the speed never changes, so the velocity-time line is flat' },
  { key: 'speeding', base: [0, 3, 6, 9, 12], story: 'Speeding up steadily from a standstill', why: 'the speed starts at zero and climbs by the same amount each second' },
  { key: 'slowing', base: [12, 9, 6, 3, 0], story: 'Slowing down steadily until it stops', why: 'the speed falls by the same amount each second and reaches zero at the end' },
  { key: 'brake', base: [8, 8, 8, 4, 0], story: 'Moving steadily, then braking to a halt', why: 'the speed holds level and then drops away to nothing' },
  { key: 'ramp', base: [0, 4, 8, 8, 8], story: 'Speeding up from rest, then holding a steady speed', why: 'the speed climbs from zero and then levels off' },
]

const VEL_DECOY_STORIES: string[] = [
  'Speeding up, then slowing down again before the end',
  'Standing still the whole time',
]

const VEL_SCENES: string[] = [
  'A trolley runs along a level bench',
  'A cyclist rides along a flat road',
  'A model train runs along a straight track',
  'A cart rolls along a corridor',
  'A skater crosses a flat rink',
  'A drone flies along a straight line',
  'A boat moves along a still canal',
  'A lift travels between two floors',
  'A trolley runs along a shop aisle',
  'A buggy crosses a smooth yard',
]

const velocityStory = tpl(
  {
    id: 'pq-gra-velocity-story',
    name: 'A speed table to the motion it describes',
    skillIds: ['p-graphs'],
    bucket: 'physics',
    difficulty: 3,
    variants: 10,
    minutes: 3,
    transfer: true,
  },
  (rng, seed) => {
    const shape = VEL_SHAPES[seed % VEL_SHAPES.length]
    const scale = seed < VEL_SHAPES.length ? 1 : 2
    const scene = cycle(seed, VEL_SCENES)
    const speeds = shape.base.map((b) => b * scale)
    const lines = speeds.map((s, i) => `- At **${i} s**: **${s} m/s**`).join('\n')
    const pool = [...VEL_SHAPES.map((s) => s.story), ...VEL_DECOY_STORIES]
    return {
      title: 'Reading a speed record',
      prompt:
        `${scene}. The speed is recorded once a second:\n\n${lines}\n\n` +
        'Which description matches this motion?',
      answer: mcq(rng, shape.story, balanced(shape.story, pool, 3)),
      hints: [
        'These numbers are SPEEDS, not positions. A row of identical numbers means moving steadily, not standing still.',
        'Look at how the speed changes from one second to the next: rising, falling, or staying put — and whether it does the same thing all the way through.',
        `Worked path: **${shape.story}**`,
      ],
      explanation:
        `**${shape.story}** — ${shape.why}.\n\n` +
        `The mistake this family is built to catch is reading a speed record as if it were a position record. A flat line here means a constant SPEED, which is steady movement; on a position record the same flat line would mean standing still. The two graphs look identical and say opposite things.\n\n` +
        `A second habit worth taking: read the DIFFERENCES rather than the values. Second by second these change by ${speeds.slice(1).map((s, i) => s - speeds[i]).join(', ')} m/s, and that list alone identifies the motion without looking at a single speed value.`,
    }
  },
)

/** [top speed reached, seconds spent speeding up, seconds spent at that speed]. */
const AREA_PARAMS: [number, number, number][] = [
  [8, 4, 5],
  [6, 4, 6],
  [10, 2, 4],
  [12, 4, 3],
  [4, 6, 5],
  [14, 2, 5],
  [6, 6, 4],
  [8, 6, 2],
  [10, 4, 6],
  [12, 2, 6],
  [4, 4, 8],
  [16, 2, 3],
]

const AREA_SCENES: string[] = [
  'A trolley starts from rest on a level bench',
  'A cyclist sets off from a standstill on a flat road',
  'A model train pulls away from a station',
  'A cart is released at the top of a level run',
  'A skater pushes off from the barrier',
  'A drone lifts away along a straight line',
  'A narrowboat pulls away from a mooring',
  'A lift starts upward from a standstill',
  'A buggy sets off across a smooth yard',
  'A go-kart pulls away from the line',
  'A wheelchair sets off along a level corridor',
  'A scooter pushes off along a flat path',
]

const graphArea = tpl(
  {
    id: 'pq-gra-area',
    name: 'Distance from a speed record',
    skillIds: ['p-graphs'],
    bucket: 'physics',
    difficulty: 4,
    variants: 12,
    minutes: 3,
  },
  (_rng, seed) => {
    const [v, t1, t2] = AREA_PARAMS[seed % AREA_PARAMS.length]
    const scene = cycle(seed, AREA_SCENES)
    const ramp = (v * t1) / 2
    const flat = v * t2
    const total = ramp + flat
    const wrong = v * (t1 + t2)
    return {
      title: 'Area under the line',
      prompt:
        `${scene}.\n\n` +
        `- For the first **${t1} s** its speed rises steadily from 0 to **${v} m/s**.\n` +
        `- It then holds **${v} m/s** for a further **${t2} s**.\n\n` +
        'How far does it travel altogether, in metres?',
      answer: numeric(total, { unit: 'm' }),
      hints: [
        'Distance is not speed × time here, because the speed was not the same throughout. Deal with the two stretches separately.',
        `Over the second stretch the speed really is steady, so that part is ${v} × ${t2} = ${flat} m. Over the first stretch the speed averaged half of ${v}.`,
        `Worked path: ${ramp} + ${flat} = **${total} m**.`,
      ],
      explanation:
        `**${total} m.** During the speeding-up stretch the speed ran from 0 to ${v} m/s, so it averaged ${v / 2} m/s for ${t1} s — that is ${ramp} m. During the steady stretch it covered ${v} × ${t2} = ${flat} m. Together ${ramp} + ${flat} = ${total} m.\n\n` +
        `Drawn as a speed-time graph, those two pieces are a triangle and a rectangle, and the distance is the area underneath the whole line. That is the general rule and it is worth more than this answer: on a speed-time graph the area is the distance, whatever shape the line makes.\n\n` +
        `The tempting answer is ${wrong}, from using the top speed for the whole journey. It is exactly the area of the rectangle that would sit over both stretches, and it counts the empty space above the sloping part as though the object had been travelling at ${v} m/s from the first instant.`,
    }
  },
)

const SPEED_SETS: number[][] = [
  [1, 2, 3, 5],
  [2, 3, 4, 6],
  [1, 3, 4, 6],
  [2, 4, 5, 8],
  [1, 2, 4, 5],
  [3, 4, 6, 8],
  [2, 3, 5, 6],
  [1, 4, 5, 7],
  [2, 5, 6, 9],
  [3, 5, 7, 10],
]

const DUR_SETS: number[][] = [
  [3, 4, 2, 5],
  [2, 5, 3, 4],
  [4, 2, 5, 3],
  [5, 3, 4, 2],
  [3, 2, 4, 5],
  [2, 4, 3, 5],
  [4, 5, 2, 3],
  [5, 2, 3, 4],
  [3, 5, 2, 4],
  [2, 3, 5, 4],
]

const GRAPH_RANK_SCENES: string[] = [
  'A delivery robot moves along a straight corridor',
  'A trolley is pushed along a straight aisle',
  'A drone flies out and back along a straight line',
  'A model train runs along a straight length of track',
  'A cyclist rides along a straight cycle path',
  'A boat moves along a straight stretch of canal',
  'A survey rover crosses a straight test lane',
  'A cart is moved along a straight loading bay',
  'A wheelchair moves along a straight corridor',
  'A scooter rides along a straight promenade',
]

/**
 * Speeds are drawn from a set of four DISTINCT values, so the ranking can never
 * be ambiguous, and exactly one segment runs backwards — which makes the item
 * test "speed is the size of the change, direction aside" rather than "read the
 * biggest number".
 */
const graphRank = tpl(
  {
    id: 'pq-gra-rank',
    name: 'Rank the segments by speed',
    skillIds: ['p-graphs'],
    bucket: 'physics',
    difficulty: 3,
    variants: 10,
    minutes: 3,
  },
  (rng, seed) => {
    const scene = cycle(seed, GRAPH_RANK_SCENES)
    // Reshuffle until the fastest-first order is NOT the order the segments are
    // listed in: an ordering item whose key is the order already on screen
    // scores full marks for touching nothing.
    let speeds = shuffle(rng, SPEED_SETS[seed % SPEED_SETS.length])
    for (let attempt = 0; attempt < 50; attempt++) {
      const desc = [0, 1, 2, 3].map((i) => ({ i, s: speeds[i] })).sort((a, b) => b.s - a.s).map((x) => x.i)
      if (!desc.every((v, i) => v === i)) break
      speeds = shuffle(rng, speeds)
    }
    const durs = DUR_SETS[seed % DUR_SETS.length]
    const back = seed % 4
    const times: number[] = [0]
    const positions: number[] = [60]
    for (let i = 0; i < 4; i++) {
      times.push(times[i] + durs[i])
      positions.push(positions[i] + (i === back ? -1 : 1) * speeds[i] * durs[i])
    }
    const options = [0, 1, 2, 3].map((i) => `Segment ${i + 1}, from ${times[i]} s to ${times[i + 1]} s`)
    const correct = [0, 1, 2, 3]
      .map((i) => ({ i, s: speeds[i] }))
      .sort((a, b) => b.s - a.s)
      .map((x) => x.i)
    const rows = times.map((t, i) => `- At **${t} s** the position is **${positions[i]} m**`).join('\n')
    const working = [0, 1, 2, 3]
      .map((i) => `segment ${i + 1}: ${Math.abs(positions[i + 1] - positions[i])} m in ${durs[i]} s, so ${speeds[i]} m/s`)
      .join('; ')
    return {
      title: 'Steepest first',
      prompt:
        `${scene}. Its position is recorded at five moments:\n\n${rows}\n\n` +
        'Rank the four segments by **speed**, fastest first.',
      answer: { type: 'order', options, correct },
      hints: [
        'Speed is not the position and it is not the change in position either. It is the change in position divided by the time that change took.',
        `The four stretches last ${durs.join(', ')} seconds, and they are not all the same length — so the biggest jump in position is not automatically the fastest.`,
        `Worked path: ${working}.`,
      ],
      explanation:
        `Working each one out: ${working}.\n\n` +
        `Fastest first: ${correct.map((i) => `segment ${i + 1} (${speeds[i]} m/s)`).join(', ')}.\n\n` +
        `Two traps are built into this. The stretches last different lengths of time, so comparing the jumps in position alone gets the order wrong. And segment ${back + 1} runs BACKWARDS — the position falls — which does not make its speed negative or small: speed is the size of the change, and something returning quickly is moving quickly.\n\n` +
        `On a position-time graph all of this is the steepness of the line, downhill counting the same as uphill. Steepness is speed; height is only where it is.`,
    }
  },
)

export const INQUIRY_DEPTH_TEMPLATES: ItemTemplate[] = [
  // Investigator — i-logic
  logicSort,
  logicContrapositive,
  logicCounterexample,
  logicChain,
  // Investigator — i-hypo
  hypoSeparate,
  hypoFavourite,
  hypoThree,
  hypoPredict,
  // Investigator — i-forecast
  brierTotal,
  brierRank,
  trackCalibration,
  resolvable,
  // Investigator — i-abduce
  abduceCover,
  abduceAssume,
  abduceRank,
  // Investigator — game theory
  gameDominant,
  gameMaximin,
  bestResponse,
  equilibrium,
  commitRemove,
  commitCredible,
  // Investigator — one family each for the remaining uncertainty skills
  natfreqMix,
  refclassNarrow,
  sampleRegress,
  diagnosticAbsence,
  conditionalOnlyIf,
  fallacyHidden,
  bayesDouble,
  // Physics — estimation
  estScaling,
  estRank,
  estTens,
  // Physics — measurement and units
  unitAlgebra,
  limitCheck,
  measureConvert,
  // Physics — density and pressure
  densityScale,
  densityFloat,
  densityPressure,
  // Physics — momentum
  momentumScale,
  momentumStop,
  momentumCollide,
  // Physics — circuits
  seriesCurrent,
  voltageDivide,
  circuitReason,
  // Physics — waves
  waveScale,
  waveCatch,
  wavePeriod,
  // Physics — motion graphs
  velocityStory,
  graphArea,
  graphRank,
]
