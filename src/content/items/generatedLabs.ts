/**
 * GENERATED thinking-lab items — supply for the two buckets that were still
 * recycling faster than once a year (observer and investigator, both ~1.34x).
 *
 * The existing lab content is case-based: a hand-written scenario with a
 * hand-written key. Excellent, but each case is one form, so the bank grows
 * only as fast as someone writes prose. These families are parameterized, and
 * every answer is COMPUTED from the generated values — the same law the maths
 * bank follows — so they scale without a key ever drifting out of sync.
 *
 * Safety boundary (content law): the observer items train self-calibration and
 * the observation/inference split on fictional scenes with no people to read.
 * Nothing here profiles a person or claims to detect deception.
 */
import type { ItemTemplate } from '../../domain/types'
import { pick, rint } from '../../engine/rng'
import { classify, mcq, numeric, tpl } from '../lib'

// ================================================================ observer

const OBJECTS = ['umbrella', 'backpack', 'jacket', 'lunchbox', 'water bottle', 'notebook'] as const
const PLACES = ['the bus-stop bench', 'the library table', 'the corridor windowsill', 'the front desk'] as const
const STATES = ['soaking wet', 'half open', 'neatly zipped', 'covered in chalk dust'] as const

/**
 * Observation vs inference on a generated scene. Two categories only — the
 * three-way ledger already exists — so every statement has an unambiguous
 * home: either the scene states it, or it does not.
 */
const genObsInf = tpl(
  {
    id: 'o-gen-obsinf',
    name: 'Scene audit: seen or concluded?',
    skillIds: ['o-obsinf'],
    bucket: 'observer',
    difficulty: 2,
    variants: 36,
    minutes: 3,
    calibration: true,
  },
  (rng) => {
    const object = pick(rng, OBJECTS)
    const place = pick(rng, PLACES)
    const state = pick(rng, STATES)
    const hour = rint(rng, 1, 6)
    const time = `${hour === 6 ? 12 : hour + 7}:${String(rint(rng, 0, 5) * 10).padStart(2, '0')}`
    const scene = `At ${time} you walk past ${place}. A ${state} ${object} is lying on it. Nobody is standing within a few metres of it. The corridor lights are on.`
    return {
      title: 'Seen or concluded?',
      prompt: `**Scene.** ${scene}\n\nSort each statement: does the scene *state* it, or does it go beyond what you saw?`,
      answer: classify(rng, ['Stated by the scene', 'Goes beyond it'], [
        { text: `The ${object} is ${state}.`, category: 0 },
        { text: `The ${object} is on ${place}.`, category: 0 },
        { text: `Nobody is standing close to it at ${time}.`, category: 0 },
        { text: 'The corridor lights are on.', category: 0 },
        { text: `Its owner forgot the ${object}.`, category: 1 },
        { text: 'Whoever left it was in a hurry.', category: 1 },
        { text: `The ${object} has been there a long time.`, category: 1 },
        { text: 'Someone will come back for it.', category: 1 },
      ]),
      hints: [
        'Test each statement against the scene text alone: could you quote a line that says it?',
        'Words about someone\'s intention — forgot, hurried, meant to — are never in a scene. They are supplied by you.',
        'Absence of a person is observed. WHY they are absent is not.',
      ],
      explanation:
        `The four stated items are all quotable from the scene: the ${object}, its condition, its position, the empty space around it, the lights. The other four smuggle in a mind — forgetting, hurrying, intending to return — or a history the scene never mentions. None of them is unreasonable; that is exactly why they are dangerous. The habit worth keeping: notice the moment your description acquires a verb about someone's intentions, because that is the moment you stopped reporting and started explaining.`,
    }
  },
)

const SUPPLIES = ['pencils', 'markers', 'rulers', 'erasers', 'glue sticks', 'notebooks'] as const

/**
 * Delayed recall on a generated inventory. The table lives in `study`, so the
 * player hides it before the question — this is retrieval, not reading.
 */
const genRecall = tpl(
  {
    id: 'o-gen-recall',
    name: 'Stock check: recall the table',
    skillIds: ['o-recall'],
    bucket: 'observer',
    difficulty: 3,
    variants: 36,
    minutes: 3,
    kind: 'multi',
    calibration: true,
  },
  (rng) => {
    const items = [...SUPPLIES].sort(() => rng() - 0.5).slice(0, 4)
    const counts = items.map(() => rint(rng, 3, 19))
    const rows = items.map((s, i) => `| ${s} | ${counts[i]} |`).join('\n')
    const maxIndex = counts.indexOf(Math.max(...counts))
    const total = counts.reduce((a, b) => a + b, 0)
    const askTotal = rng() < 0.5
    return {
      title: 'Stock check',
      prompt: 'Study the stock table, then answer from memory.',
      parts: [
        {
          study: `SUPPLY CUPBOARD — Monday count\n\n| Item | Count |\n| --- | --- |\n${rows}`,
          studySeconds: 25,
          prompt: askTotal
            ? 'From memory: how many items were in the cupboard in total?'
            : `From memory: how many **${items[maxIndex]}** were there?`,
          answer: numeric(askTotal ? total : counts[maxIndex]),
          explanation: askTotal
            ? `${counts.join(' + ')} = **${total}**. Totals are harder than single values because they must be built during encoding — if you read the rows without adding, the number was never stored and no amount of concentration recovers it.`
            : `There were **${counts[maxIndex]}** ${items[maxIndex]} — the largest count in the table. Extreme values are the easiest to retain, which is worth knowing: your memory of a table is not uniform, so the middle rows are where you should spend the extra second.`,
        },
        {
          prompt: 'Which encoding would have made that recall most reliable?',
          // Options are deliberately the same length and specificity. A
          // correct answer that is visibly the longest can be picked off by
          // test-wiseness alone, which would make the item look like evidence
          // without testing anything.
          answer: mcq(rng, 'Impose an order on the rows — largest first, smallest last — and total them as you read', [
            'Read the table start to finish three times over before it disappears from view',
            'Hold a mental photograph of the whole table and read the numbers back off it later',
            'Concentrate hard on each row in turn and trust that the numbers will stay put',
          ]),
          explanation:
            'Structure beats repetition and beats effort. Re-reading feels productive but leaves no retrieval route; "picture it as a photograph" fails because memory does not store images that way. Imposing a shape — an order, a comparison, a total — gives the number somewhere to live and a path back to it.',
        },
      ],
      hints: [
        'Before the table disappears, decide what structure you will impose on it.',
        'Extremes stick; middles slide. Spend your attention on the middle rows.',
        'If a total might be asked, build it while reading — you cannot add numbers you no longer have.',
      ],
      explanation:
        'Scene recall is an encoding skill far more than a retention one. What you do in the first few seconds — grouping, ordering, totalling — determines almost everything about what you can retrieve later.',
    }
  },
)

// ================================================================ investigator

const CONDITIONS = [
  { name: 'the sap-blight fungus', unit: 'orchard trees', test: 'the leaf-strip test' },
  { name: 'a cracked frame joint', unit: 'returned bicycles', test: 'the stress-rig check' },
  { name: 'a faulty battery cell', unit: 'used laptops', test: 'the discharge test' },
  { name: 'water in the fuel line', unit: 'workshop engines', test: 'the sight-glass check' },
] as const

/**
 * Natural-frequency Bayes. Numbers are chosen so every count stays a whole
 * number — the entire pedagogical point is that counting beats formulas here,
 * and a fractional "0.4 of a tree" would destroy that.
 */
const genBayes = tpl(
  {
    id: 'i-gen-bayes',
    name: 'Base rates by counting',
    skillIds: ['i-bayes'],
    bucket: 'investigator',
    difficulty: 4,
    variants: 48,
    minutes: 4,
    calibration: true,
    transfer: true,
  },
  (_rng, seed) => {
    // ENUMERATE the parameter space rather than sampling it. Random draws
    // collide (28 distinct from 36 seeds when this sampled), which quietly
    // inflates the declared variant count; indexing guarantees all 48 differ.
    const PREVALENCE = [1, 2, 4, 5] as const
    const SENSITIVITY = [80, 90, 100] as const
    const c = CONDITIONS[seed % CONDITIONS.length]
    const population = 1000
    const prevalencePct = PREVALENCE[Math.floor(seed / 4) % PREVALENCE.length]
    const sensitivityPct = SENSITIVITY[Math.floor(seed / 16) % SENSITIVITY.length]
    const falsePositivePct = ([5, 10] as const)[Math.floor(seed / 48) % 2]

    const affected = (population * prevalencePct) / 100
    const truePositives = (affected * sensitivityPct) / 100
    const unaffected = population - affected
    const falsePositives = (unaffected * falsePositivePct) / 100
    const totalPositives = truePositives + falsePositives
    const precision = Math.round((truePositives / totalPositives) * 100)

    return {
      title: 'What does a positive really mean?',
      prompt:
        `Out of **${population} ${c.unit}**, about **${prevalencePct}%** have ${c.name}.\n\n` +
        `${c.test} flags **${sensitivityPct}%** of the affected ones, and also wrongly flags **${falsePositivePct}%** of the healthy ones.\n\n` +
        `Work in whole counts, not percentages.\n\n**Of the ones that test positive, how many actually have ${c.name}?**`,
      answer: numeric(truePositives),
      hints: [
        `Start by splitting the ${population}: how many are affected, how many are not?`,
        `Affected: ${affected}. Of those, ${sensitivityPct}% are flagged → ${truePositives} true positives.`,
        `Healthy: ${unaffected}. Of those, ${falsePositivePct}% are wrongly flagged → ${falsePositives} false positives. So ${totalPositives} positives in all, of which **${truePositives}** are real.`,
      ],
      explanation:
        `Counting it out: ${affected} of the ${population} are affected, and ${c.test} flags ${sensitivityPct}% of them — **${truePositives}** true positives. The other ${unaffected} are healthy, but ${falsePositivePct}% get flagged anyway — ${falsePositives} false positives. That is ${totalPositives} positives in total, so only ${truePositives}/${totalPositives} ≈ **${precision}%** of positive results are real.\n\nThe lesson is the size of that gap: a test that sounds ${sensitivityPct}% accurate produces a positive result that is right about ${precision}% of the time. Nothing is wrong with the test — the base rate is doing the damage. When the thing you are looking for is rare, the false positives are drawn from a much larger pool, and they swamp the true ones.`,
      commonErrors: {
        concept: `Answering ${totalPositives} counts every flagged case as real. Answering ${sensitivityPct} confuses "how many affected ones get caught" with "how many caught ones are affected" — those are different questions with very different answers.`,
      },
    }
  },
)

const SYLLOGISM_SETS = [
  { a: 'field mice', b: 'seed eaters', c: 'active at dusk' },
  { a: 'copper wires', b: 'conductors', c: 'checked before shipping' },
  { a: 'harbour ferries', b: 'diesel boats', c: 'refuelled weekly' },
  { a: 'clay tiles', b: 'fired ceramics', c: 'frost resistant' },
  { a: 'night trains', b: 'sleeper services', c: 'booked in advance' },
  { a: 'estuary crabs', b: 'shore feeders', c: 'active at low tide' },
  { a: 'library atlases', b: 'reference books', c: 'kept off the loan shelf' },
  { a: 'winter apples', b: 'late croppers', c: 'stored until spring' },
  { a: 'quarry lorries', b: 'heavy vehicles', c: 'weighed at the gate' },
  { a: 'salt marshes', b: 'tidal wetlands', c: 'surveyed each autumn' },
  { a: 'brass valves', b: 'cast fittings', c: 'pressure tested' },
  { a: 'moorland ponies', b: 'free-roaming stock', c: 'ear-tagged' },
  { a: 'stage lanterns', b: 'mains-powered lamps', c: 'checked for earth faults' },
  { a: 'river gauges', b: 'telemetry stations', c: 'calibrated twice a year' },
  { a: 'pine seedlings', b: 'nursery stock', c: 'hardened off before planting' },
  { a: 'harbour buoys', b: 'moored markers', c: 'lifted for inspection' },
] as const

/**
 * Validity, not plausibility. Distractors are the two classic invalid forms
 * (affirming the consequent, denying the antecedent) plus an over-reach, so a
 * learner who reasons from the CONTENT rather than the FORM will pick wrong.
 */
const genSyllogism = tpl(
  {
    id: 'i-gen-syllogism',
    name: 'What actually follows?',
    skillIds: ['i-logic'],
    bucket: 'investigator',
    difficulty: 3,
    // 16 term sets x 2 argument forms. Exactly the distinct content available.
    variants: 32,
    minutes: 3,
    calibration: true,
  },
  (rng, seed) => {
    const s = SYLLOGISM_SETS[seed % SYLLOGISM_SETS.length]
    // Note the division, not `seed % 2`: SYLLOGISM_SETS has an even length, so
    // seed and seed+len share a parity and the two forms would never separate.
    const form = Math.floor(seed / SYLLOGISM_SETS.length) % 2 === 0 ? 'universal' : 'conditional'
    if (form === 'universal') {
      return {
        title: 'What follows?',
        prompt: `Given:\n\n1. All **${s.a}** are **${s.b}**.\n2. All **${s.b}** are **${s.c}**.\n\nWhich conclusion follows *necessarily*?`,
        answer: mcq(rng, `All ${s.a} are ${s.c}.`, [
          `All ${s.c} are ${s.a}.`,
          `All ${s.b} are ${s.a}.`,
          `Some ${s.c} are not ${s.a}.`,
        ]),
        hints: [
          'Draw it as three nested rings and see which containment is forced.',
          `${s.a} sits inside ${s.b}, and ${s.b} sits inside ${s.c}. Read off what that forces.`,
          `The inner ring is inside the outer one: **all ${s.a} are ${s.c}**. The reverse is not forced — the outer ring is bigger.`,
        ],
        explanation:
          `Nesting is transitive: ${s.a} ⊆ ${s.b} ⊆ ${s.c}, so **all ${s.a} are ${s.c}**. Every wrong option reverses a containment that was only ever stated one way. That reversal is the single most common error in everyday reasoning, and it survives because the reversed claim usually sounds just as sensible — validity is about the shape of the argument, never about whether the conclusion sounds right.`,
      }
    }
    return {
      title: 'What follows?',
      prompt: `Given:\n\n1. If something is one of the **${s.a}**, then it is **${s.c}**.\n2. This one is **not ${s.c}**.\n\nWhich conclusion follows *necessarily*?`,
      answer: mcq(rng, `It is not one of the ${s.a}.`, [
        `It is one of the ${s.a}.`,
        `It is one of the ${s.b}.`,
        `Nothing follows from these two statements.`,
      ]),
      hints: [
        'This is the contrapositive pattern — the one valid move that runs backwards along an "if".',
        'If being in the group guarantees the property, then lacking the property rules out the group.',
        `No ${s.c} means it cannot be one of the ${s.a} — that is the contrapositive, and it is always valid.`,
      ],
      explanation:
        `"If A then C" is equivalent to "if not C then not A" — the contrapositive, and the only reversal of an implication that is valid. So **it is not one of the ${s.a}**. Note what is NOT available: from "not C" you cannot conclude anything about ${s.b}, and "nothing follows" is the over-cautious trap. Knowing which reversals are legal is what separates checking an argument from agreeing with it.`,
    }
  },
)

export const GENERATED_LAB_TEMPLATES: ItemTemplate[] = [genObsInf, genRecall, genBayes, genSyllogism]
