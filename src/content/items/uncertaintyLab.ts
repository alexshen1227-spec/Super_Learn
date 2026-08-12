/**
 * Uncertainty Lab — the six Investigator skills in `u-uncertainty`.
 *
 * Each family here was chosen because a controlled study says the TAUGHT
 * REPRESENTATION does the work, not because the topic sounds rigorous.
 *
 * `i-natfreq` — natural frequencies, never Bayes' formula. McDowell & Jacobs
 *   (2017, Psychological Bulletin 143(12), 1273-1312) meta-analysed 35 articles
 *   and found 24% correct with natural frequencies against 4% with the same
 *   problems written as conditional probabilities (OR ≈ 7.1). Sedlmeier &
 *   Gigerenzer (2001, JEP:General 130(3)) compared REPRESENTATION training
 *   (frequency grid + frequency tree) against RULE training (Bayes' formula):
 *   ~10% → ~90% correct for representation against 0% → ~65% for the rule, and
 *   the representation advantage survived the delayed tests where rule training
 *   decayed. So every item here counts people (or bolts, or recordings) out of a
 *   whole group; the formula appears nowhere, including in the hints.
 *
 * `i-refclass` — the outside view. Probability training in the IARPA forecasting
 *   tournament explicitly told forecasters to use reference classes, and the
 *   randomised training arm improved accuracy across four years (Mellers et al.
 *   2014, Psychological Science 25(5); Chang et al. 2016, JDM 11(5)). This is
 *   the rare forecasting technique with a randomised field test behind it, which
 *   is why the entry item is "compute the base rate from the record" rather than
 *   anything about intuition.
 *
 * `i-samplesize` — the law of large numbers, taught as an ABSTRACT RULE plus
 *   worked examples spread across unrelated surface domains. Fong, Krantz &
 *   Nisbett (1986, Cognitive Psychology 18(3), 253-292) found brief training on
 *   the formal rule improved everyday statistical reasoning, and that guided
 *   induction from examples transferred just as much to domains that had NOT
 *   been taught as to the ones that had. The case banks therefore rotate through
 *   shops, sport, weather, school and services on purpose — the domain spread is
 *   the instructional design, not decoration.
 *
 * `i-diagnostic` — evidence strength as a FREQUENCY COMPARISON ("9 times in 10
 *   under one story, 2 in 10 under the other"), never a likelihood ratio in
 *   symbols. Same representation argument as `i-natfreq`; the counts are the
 *   teaching, and the key is computed as the largest gap so the generator cannot
 *   drift from its own answer.
 *
 * `i-conditional` — the four conditional moves, two valid and two not, plus
 *   selection items in ordinary work settings. Deliberately NOT the standard
 *   card wording: every cover story here is original, and `i-disconfirm` already
 *   carries the abstract version for `i-logic`.
 *
 * `i-fallacy` — the one genuine standards hook in the app's reasoning content:
 *   CCSS ELA RI.9-10.8 ("identify false statements and fallacious reasoning")
 *   and RI.8.8 ("recognize when irrelevant evidence is introduced"), with a
 *   closed taxonomy of the kind Texas's approved Logic I course (PEIMS
 *   N1290100) specifies. `FAULTS` is that closed list and nothing outside it is
 *   ever named.
 *
 * Two authoring constraints worth stating because they shaped the code:
 *
 *  1. OPTION LENGTH. The correct option must never be the longest in its set.
 *     The `FAULTS` and `FORM_NAMES` option strings are engineered to identical
 *     character counts so that no combination can leak; elsewhere every set
 *     carries a decoy at least as long as the key. The app shipped this bug once
 *     (52.8% for "always pick the longest" against a 25% baseline) and the gate
 *     in `contentAudit.test.ts` measures it per bucket.
 *  2. EXACT ARITHMETIC. Every parameter set is chosen so the counts divide
 *     whole: populations of 1000 with the affected group a multiple of 20, so
 *     80%/90% of it and 5%/10% of the remainder are all integers. No rounding
 *     reaches a string.
 *
 * What is NOT claimed anywhere in the learner-facing text: that any of this
 * makes someone generally smarter. The explanations say what the studies
 * measured and stop there.
 */
import type { ItemPart, ItemTemplate } from '../../domain/types'
import { classify, cycle, fraction, mcq, mcqNoted, multi, numeric, round, tpl } from '../lib'
import { shuffle } from '../../engine/rng'

function part(stage: string, body: Omit<ItemPart, 'stage'>): ItemPart {
  return { stage, ...body }
}

// ===========================================================================
// i-natfreq — counting people, not percentages
// ===========================================================================

interface FreqCase {
  /** Plural noun for the things being checked. */
  unit: string
  /** Where they are; follows the count directly. */
  place: string
  /** Verb phrase for what the minority group actually has. */
  cond: string
  /** Short noun for that condition, used mid-sentence. */
  condShort: string
  /** The check they all go through. */
  test: string
  /** Noun phrase for a positive result. */
  flag: string
}

const FREQ_CASES: FreqCase[] = [
  { unit: 'seedlings', place: 'in one greenhouse', cond: 'have root rot', condShort: 'root rot', test: 'the leaf-strip test', flag: 'a yellow strip' },
  { unit: 'second-hand phones', place: 'on a repair bench', cond: 'have a worn-out battery', condShort: 'a worn battery', test: 'the charge test', flag: 'a fail mark' },
  { unit: 'apples', place: 'in one delivery', cond: 'are bruised under the skin', condShort: 'hidden bruising', test: 'the light scanner', flag: 'a scanner mark' },
  { unit: 'bolts', place: 'in one production batch', cond: 'have a hairline crack', condShort: 'a hairline crack', test: 'the sound probe', flag: 'a beep' },
  { unit: 'emails', place: 'arriving at a club address', cond: 'are junk', condShort: 'junk mail', test: 'the club filter', flag: 'a junk label' },
  { unit: 'night recordings', place: 'from one woodland monitor', cond: 'contain an owl call', condShort: 'an owl call', test: 'the call-finder software', flag: 'a marked clip' },
  { unit: 'entry tickets', place: 'handed in at one gate', cond: 'are forgeries', condShort: 'a forgery', test: 'the gate reader', flag: 'a red light' },
  { unit: 'library books', place: 'returned this term', cond: 'have a torn page', condShort: 'a torn page', test: 'the sorting machine', flag: 'a damage flag' },
  { unit: 'hire bikes', place: 'at one depot', cond: 'have a slow puncture', condShort: 'a slow puncture', test: 'the pressure check', flag: 'a low reading' },
  { unit: 'timber boards', place: 'in one yard', cond: 'are warped', condShort: 'warping', test: 'the laser check', flag: 'a laser mark' },
  { unit: 'bulbs', place: 'in one warehouse batch', cond: 'burn out early', condShort: 'early burnout', test: 'the burn-in test', flag: 'a fail flag' },
  { unit: 'paint tins', place: 'on one pallet', cond: 'have separated inside', condShort: 'separated paint', test: 'the shake test', flag: 'a fail result' },
]

/**
 * Parameters chosen so every count is a whole number: the affected group is a
 * multiple of 20 out of 1000, which keeps 80% and 90% of it integral and keeps
 * the remainder a multiple of 20 as well, so 5% and 10% of it are integral too.
 */
const NF_AFFECTED = [20, 40, 60, 80, 100]
const NF_HIT_RATE = [80, 90]
const NF_FALSE_RATE = [5, 10]

interface FreqNumbers {
  pop: number
  sick: number
  well: number
  truePos: number
  falsePos: number
  flagged: number
  missed: number
  clear: number
  hitRate: number
  falseRate: number
}

function freqNumbers(seed: number): FreqNumbers {
  const pop = 1000
  const sick = NF_AFFECTED[seed % NF_AFFECTED.length]
  const hitRate = NF_HIT_RATE[Math.floor(seed / NF_AFFECTED.length) % NF_HIT_RATE.length]
  const falseRate = NF_FALSE_RATE[Math.floor(seed / (NF_AFFECTED.length * NF_HIT_RATE.length)) % NF_FALSE_RATE.length]
  const well = pop - sick
  const truePos = (sick * hitRate) / 100
  const falsePos = (well * falseRate) / 100
  return {
    pop,
    sick,
    well,
    truePos,
    falsePos,
    flagged: truePos + falsePos,
    missed: sick - truePos,
    clear: pop - (truePos + falsePos),
    hitRate,
    falseRate,
  }
}

function freqSetup(c: FreqCase, n: FreqNumbers): string {
  return (
    `Out of **${n.pop}** ${c.unit} ${c.place}, **${n.sick}** ${c.cond}.\n\n` +
    `Every one of them goes through ${c.test}.\n\n` +
    `- Of the ${n.sick} that ${c.cond}, **${n.truePos}** get ${c.flag}.\n` +
    `- Of the other ${n.well}, **${n.falsePos}** get ${c.flag}.`
  )
}

const nfCount = tpl(
  {
    id: 'i-nf-count',
    name: 'How many get flagged altogether?',
    skillIds: ['i-natfreq'],
    bucket: 'investigator',
    difficulty: 2,
    variants: 12,
    minutes: 2.5,
  },
  (_rng, seed) => {
    const c = cycle(seed, FREQ_CASES)
    const n = freqNumbers(seed)
    return {
      title: 'Count the two groups',
      prompt: `${freqSetup(c, n)}\n\nHow many ${c.unit} altogether get ${c.flag}?`,
      answer: numeric(n.flagged),
      hints: [
        `Two separate groups end up with ${c.flag}, and they have nothing to do with each other. Find each one before adding.`,
        `Among the ${n.sick} that ${c.cond}: ${n.truePos}. Among the ${n.well} that do not: ${n.falsePos}.`,
        `Worked path: ${n.truePos} + ${n.falsePos} = **${n.flagged}**.`,
      ],
      explanation:
        `**${n.flagged}**, because ${c.flag} comes from two places: ${n.truePos} of the ${n.sick} that ${c.cond}, plus ${n.falsePos} of the ${n.well} that do not.\n\n` +
        `The tempting answer is ${n.truePos} — the ones the check got right. It feels like the whole answer because it is the group the check is FOR, and the other ${n.falsePos} are easy to forget when they are described as a small percentage of a big group. But ${n.falseRate}% of ${n.well} is ${n.falsePos}, and every one of them is sitting in the flagged pile too.\n\n` +
        `This single number is the one most people skip, and skipping it is what makes the next question feel impossible.`,
    }
  },
)

const nfPositive = tpl(
  {
    id: 'i-nf-positive',
    name: 'What does a flag actually mean?',
    skillIds: ['i-natfreq', 'i-bayes'],
    bucket: 'investigator',
    difficulty: 3,
    variants: 12,
    minutes: 3.5,
    calibration: true,
  },
  (rng, seed) => {
    const c = cycle(seed + 4, FREQ_CASES)
    const n = freqNumbers(seed)
    const pct = Math.round((n.truePos / n.flagged) * 100)
    const noted = mcqNoted(rng, `${n.truePos} out of ${n.flagged}`, [
      [
        `${n.truePos} out of ${n.sick}`,
        `Right numbers, wrong direction — that is how often ${c.condShort} produces ${c.flag}, not how often ${c.flag} means ${c.condShort}.`,
        'inference',
      ],
      [
        `${n.falsePos} out of ${n.flagged}`,
        `That is the false-flag share. It answers the opposite question: how many of the flagged are fine.`,
        'misread',
      ],
      [
        `${n.sick} out of ${n.pop}`,
        `That is the rate before any checking at all, so it throws away the one piece of new information you were given.`,
        'concept',
      ],
    ])
    return {
      title: 'Out of everything flagged',
      prompt:
        `${freqSetup(c, n)}\n\n` +
        `Now take the whole pile of ${c.unit} that got ${c.flag}. Out of that pile, how many actually ${c.cond}?`,
      ...noted,
      hints: [
        `The question is about the FLAGGED pile, so build that pile first: who is in it, and where did each of them come from?`,
        `The pile holds ${n.truePos} that really ${c.cond} and ${n.falsePos} that do not, so it holds ${n.flagged} in all.`,
        `Worked path: ${n.truePos} of the ${n.flagged} flagged really ${c.cond} — **${n.truePos} out of ${n.flagged}**, about ${pct}%.`,
      ],
      explanation:
        `**${n.truePos} out of ${n.flagged}** — about ${pct}%.\n\n` +
        `The check finds ${n.hitRate}% of the real cases, and almost everyone reads that as "so a flag is ${n.hitRate}% likely to be real". Those are two different questions. "${n.hitRate} of every 100 real cases get flagged" is a fact about the real cases; "how many flagged ones are real" is a fact about the flagged pile, and the flagged pile is mostly made of the huge group that was fine: ${n.falseRate}% of ${n.well} is ${n.falsePos} ${c.unit}.\n\n` +
        `Nothing about the check changed. What decides the answer is that only ${n.sick} in ${n.pop} had ${c.condShort} to begin with.\n\n` +
        `Written as percentages, problems shaped like this one are solved by about 4 people in 100. Written as counts out of a group — the way it is written above — the figure is about 24 in 100 (McDowell and Jacobs reviewed 35 studies of exactly this comparison). The counts are not a crutch; they are the thing that makes it visible.`,
    }
  },
)

const nfNegative = tpl(
  {
    id: 'i-nf-negative',
    name: 'What a clear result leaves behind',
    skillIds: ['i-natfreq'],
    bucket: 'investigator',
    difficulty: 4,
    variants: 10,
    minutes: 4,
  },
  (_rng, seed) => {
    const c = cycle(seed + 8, FREQ_CASES)
    const n = freqNumbers(seed)
    return {
      title: 'The other pile',
      prompt:
        `${freqSetup(c, n)}\n\n` +
        `Now take the ${c.unit} that did NOT get ${c.flag}. What fraction of THEM ${c.cond}?\n\n` +
        `Give your answer as a fraction, in the form (number that ${c.cond}) / (number not flagged).`,
      answer: fraction(n.missed, n.clear),
      hints: [
        `Four groups exist, not two: flagged and really affected, flagged and fine, unflagged and really affected, unflagged and fine. This question is about the third one.`,
        `Of the ${n.sick} that ${c.cond}, ${n.truePos} were flagged — so ${n.missed} were missed. The unflagged pile holds ${n.pop} − ${n.flagged} = ${n.clear}.`,
        `Worked path: **${n.missed}/${n.clear}**.`,
      ],
      explanation:
        `**${n.missed}/${n.clear}**. The check missed ${n.missed} of the ${n.sick}, and ${n.clear} ${c.unit} came through unflagged, so ${n.missed} of those ${n.clear} still ${c.cond}.\n\n` +
        `The tempting answer is zero. A check that catches ${n.hitRate}% of cases feels like it clears everything it lets through, and the ${n.missed} it missed have to go somewhere — they go here, quietly, into the pile everyone stops thinking about.\n\n` +
        `Notice the shape of the two answers together. A flag is far weaker news than it feels, and a clear result is far stronger news than it feels, and both come from the same fact: ${n.sick} in ${n.pop}. The counts show it; the percentages hide it.`,
    }
  },
)

interface ShiftCase {
  unit: string
  test: string
  flag: string
  cond: string
  rare: string
  common: string
}

const SHIFT_CASES: ShiftCase[] = [
  { unit: 'recordings', test: 'the call-finder', flag: 'a marked clip', cond: 'contain an owl call', rare: 'the young plantation', common: 'the old oak wood' },
  { unit: 'tickets', test: 'the gate reader', flag: 'a red light', cond: 'are forgeries', rare: 'a midweek local match', common: 'the cup final' },
  { unit: 'crates', test: 'the rust scanner', flag: 'an alert', cond: 'hold rusted tins', rare: 'the dry indoor store', common: 'the leaky outdoor shed' },
  { unit: 'messages', test: 'the junk filter', flag: 'a junk label', cond: 'are junk', rare: 'the private staff address', common: 'the public contact address' },
  { unit: 'hire bikes', test: 'the pressure check', flag: 'a low reading', cond: 'have a slow puncture', rare: 'the new fleet', common: 'the ten-year-old fleet' },
  { unit: 'boards', test: 'the laser check', flag: 'a laser mark', cond: 'are warped', rare: 'the kiln-dried stack', common: 'the rain-soaked stack' },
  { unit: 'apples', test: 'the light scanner', flag: 'a scanner mark', cond: 'are bruised inside', rare: 'the hand-picked tray', common: 'the machine-shaken tray' },
  { unit: 'bolts', test: 'the sound probe', flag: 'a beep', cond: 'have a hairline crack', rare: 'the new machine', common: 'the worn machine' },
]

/** [rare per 1000, common per 1000, hit rate %, false-flag rate %]. */
const SHIFT_PARAMS: [number, number, number, number][] = [
  [10, 200, 90, 10],
  [20, 300, 90, 10],
  [40, 400, 90, 10],
  [10, 300, 80, 10],
  [20, 400, 80, 10],
  [40, 200, 80, 10],
  [20, 200, 90, 5],
  [40, 300, 80, 5],
]

const nfShift = tpl(
  {
    id: 'i-nf-shift',
    name: 'Same check, two places',
    skillIds: ['i-natfreq'],
    bucket: 'investigator',
    difficulty: 3,
    variants: 8,
    minutes: 4.5,
    kind: 'multi',
    transfer: true,
  },
  (rng, seed) => {
    const c = cycle(seed, SHIFT_CASES)
    const [rare, common, hit, fal] = SHIFT_PARAMS[seed % SHIFT_PARAMS.length]
    const count = (affected: number) => {
      const well = 1000 - affected
      const tp = (affected * hit) / 100
      const fp = (well * fal) / 100
      return { affected, well, tp, fp, flagged: tp + fp, pct: Math.round((tp / (tp + fp)) * 100) }
    }
    const a = count(rare)
    const b = count(common)
    const setup =
      `The same ${c.test} is used in two places, and it behaves identically in both: it gives ${c.flag} to **${hit}%** of the ${c.unit} that ${c.cond}, and to **${fal}%** of those that do not.\n\n` +
      `- At ${c.rare}, **${rare}** of every 1000 ${c.unit} ${c.cond}.\n` +
      `- At ${c.common}, **${common}** of every 1000 ${c.unit} ${c.cond}.`
    return {
      title: 'One check, two places',
      prompt: `${setup}\n\nWork through 1000 ${c.unit} from each place.`,
      hints: [
        'Do each place separately, and in each one split the 1000 into the two groups before you count anything.',
        `At ${c.rare}: ${a.tp} true plus ${a.fp} false. At ${c.common}: ${b.tp} true plus ${b.fp} false.`,
        `Worked path: ${a.flagged} flagged at ${c.rare} (${a.tp} of them real, about ${a.pct}%), ${b.flagged} at ${c.common} (${b.tp} real, about ${b.pct}%).`,
      ],
      explanation:
        `At ${c.rare}, ${a.flagged} get ${c.flag} and only ${a.tp} of those really ${c.cond} — about ${a.pct}%. At ${c.common}, ${b.flagged} get ${c.flag} and ${b.tp} of those are real — about ${b.pct}%.\n\n` +
        `The ${c.test} never changed. What changed is how common the thing already was, and that alone moved what ${c.flag} is worth from about ${a.pct}% to about ${b.pct}%.`,
      parts: [
        part('First place', {
          prompt: `At ${c.rare}, out of 1000 ${c.unit}, how many get ${c.flag} altogether?`,
          answer: numeric(a.flagged),
          explanation:
            `${a.tp} of the ${rare} that ${c.cond}, plus ${fal}% of the other ${a.well}, which is ${a.fp}. Together **${a.flagged}**. The second group is much larger, which is why it contributes so many flags even at ${fal}%.`,
          hints: [
            `Split the 1000 first: ${rare} that ${c.cond} and ${a.well} that do not.`,
            `Then take ${hit}% of ${rare} and ${fal}% of ${a.well}.`,
            `Worked path: ${a.tp} + ${a.fp} = ${a.flagged}.`,
          ],
        }),
        part('Second place', {
          prompt: `At ${c.common}, out of 1000 ${c.unit}, how many get ${c.flag} altogether?`,
          answer: numeric(b.flagged),
          explanation:
            `${b.tp} of the ${common} that ${c.cond}, plus ${fal}% of the other ${b.well}, which is ${b.fp}. Together **${b.flagged}**. Compared with the first place the true flags have grown and the false ones have shrunk, because the two groups changed size.`,
          hints: [
            `Same method, different split: ${common} that ${c.cond} and ${b.well} that do not.`,
            `Take ${hit}% of ${common} and ${fal}% of ${b.well}.`,
            `Worked path: ${b.tp} + ${b.fp} = ${b.flagged}.`,
          ],
        }),
        part('What moved', {
          prompt: `${c.flag} is much better news in one of the two places. Which kind of place, and why?`,
          answer: mcq(rng, 'Where the thing is common — most flags are then real', [
            'Where the thing is rare — the test has less to confuse it',
            'Neither: the test is equally trustworthy in both',
            'Wherever more were tested in total',
          ]),
          explanation:
            `Where it is common. False flags are a slice of the UNAFFECTED group, so the smaller that group is, the fewer false flags there are to drown the real ones. The tempting answer is the opposite one — rare things feel like they should be easier to pick out of a quiet background — but rarity is exactly what fills the flagged pile with the group that was fine all along.`,
          hints: [
            'Compare the two answers you just computed as fractions, not as raw counts.',
            'Ask which group the false flags are drawn from, and what happens to that group when the thing becomes common.',
            `Worked path: ${a.tp}/${a.flagged} against ${b.tp}/${b.flagged}.`,
          ],
        }),
      ],
    }
  },
)

// ===========================================================================
// i-refclass — reference classes and the outside view
// ===========================================================================

interface RecordCase {
  setting: string
  total: number
  hits: number
  outcome: string
  thisOne: string
}

const RECORD_CASES: RecordCase[] = [
  { setting: 'A stall has run at the Saturday market for years.', total: 25, hits: 15, outcome: 'sold out before closing', thisOne: 'This Saturday the stallholder is sure it will sell out, because the weather is good.' },
  { setting: 'A drama club puts on a play every term.', total: 20, hits: 7, outcome: 'filled every seat', thisOne: 'The director is confident this one will fill, because the cast is strong.' },
  { setting: 'A repair shop promises same-day fixes when it can.', total: 40, hits: 14, outcome: 'were finished the same day', thisOne: 'The owner tells a customer this one will be done today.' },
  { setting: 'A cycling club runs a long ride once a month.', total: 50, hits: 33, outcome: 'finished with the whole group together', thisOne: 'The leader expects everyone to stay together on Sunday.' },
  { setting: 'A choir enters a regional competition each year.', total: 25, hits: 8, outcome: 'placed in the top three', thisOne: 'The conductor thinks this year is their year.' },
  { setting: 'A bus route is timed to arrive on the hour.', total: 20, hits: 13, outcome: 'arrived within five minutes of time', thisOne: 'A passenger plans to catch a connection with six minutes to spare.' },
  { setting: 'A garden group starts seeds indoors every spring.', total: 40, hits: 26, outcome: 'germinated within two weeks', thisOne: 'The organiser tells members to expect shoots by the fifteenth.' },
  { setting: 'A small publisher prints short runs of local books.', total: 50, hits: 21, outcome: 'sold out the first run', thisOne: 'The editor is planning a second run before the first has shipped.' },
  { setting: 'A hiking group attempts a summit each summer.', total: 25, hits: 19, outcome: 'reached the top', thisOne: 'A newcomer asks whether they are likely to make it.' },
  { setting: 'A cafe tries a new item on the menu each month.', total: 20, hits: 9, outcome: 'stayed on the menu after a month', thisOne: 'The chef has already ordered three months of one ingredient.' },
  { setting: 'A film society books a guest speaker most months.', total: 40, hits: 18, outcome: 'drew more than fifty people', thisOne: 'The secretary has booked a room that holds sixty.' },
  { setting: 'A allotment site runs a produce swap each autumn.', total: 50, hits: 37, outcome: 'ended with nothing left over', thisOne: 'The organiser plans not to arrange any collection this year.' },
]

const rcRate = tpl(
  {
    id: 'i-rc-rate',
    name: 'What the record already says',
    skillIds: ['i-refclass'],
    bucket: 'investigator',
    difficulty: 2,
    variants: 12,
    minutes: 2.5,
  },
  (_rng, seed) => {
    const c = cycle(seed, RECORD_CASES)
    const rate = (c.hits * 100) / c.total
    return {
      title: 'Start from the record',
      prompt:
        `${c.setting}\n\nOf the last **${c.total}**, **${c.hits}** ${c.outcome}.\n\n${c.thisOne}\n\n` +
        `Before thinking about this one at all: out of every 100 times, how many ${c.outcome}?`,
      answer: numeric(rate, { unit: 'per 100' }),
      hints: [
        `You are being asked to rescale ${c.hits} out of ${c.total} so it is out of 100 instead. Nothing about this particular occasion enters into it.`,
        `Each of the ${c.total} is worth ${100 / c.total} out of 100.`,
        `Worked path: ${c.hits} × ${100 / c.total} = **${rate}** out of every 100.`,
      ],
      explanation:
        `**${rate} out of every 100.** That is the whole record, rescaled and nothing more.\n\n` +
        `This number is worth having BEFORE the details, because the details are where confidence comes from and they are also where the record gets forgotten. In the forecasting tournament that tested this directly, the training that helped told people to find cases like this one and count how they turned out; forecasters who took that training scored better over four years than those who did not (Mellers and colleagues, 2014).\n\n` +
        `It is a starting point, not a verdict. The next skill is knowing which differences are big enough to move it.`,
    }
  },
)

interface ClassCase {
  situation: string
  key: string
  narrow: string
  broad: string
  filtered: string
  why: string
}

const CLASS_CASES: ClassCase[] = [
  {
    situation: 'A student wants to know how likely it is that their group finishes a science coursework project on time.',
    key: 'The 22 coursework projects this class has handed in this year',
    narrow: 'The two projects this exact group of friends has done together',
    broad: 'Every piece of work anybody in the school has ever handed in',
    filtered: 'The projects that people still talk about because they went well',
    why: 'Same task, same course, same kind of group, and enough of them to have a rate at all.',
  },
  {
    situation: 'A club treasurer wants to know how likely a summer fundraiser is to cover its costs.',
    key: 'The 14 fundraisers this club has run in the last four years',
    narrow: 'The one fundraiser the current treasurer has run before now',
    broad: 'Every charity event held anywhere in the county last year',
    filtered: 'The fundraisers the club chose to write up in its newsletter',
    why: 'Same club, same scale, same kind of event, and fourteen is enough to see a pattern.',
  },
  {
    situation: 'A runner wants to know how likely they are to finish a half marathon under two hours.',
    key: 'The 11 half marathons this runner has finished at this training level',
    narrow: 'The one race this runner ran last month in unusually cool weather',
    broad: 'Every race of every distance this runner has entered since school',
    filtered: 'The races this runner remembers because they went unusually well',
    why: 'Same distance, same runner, same rough level of fitness, with enough races to give a rate.',
  },
  {
    situation: 'A shop owner wants to know how likely a new supplier is to deliver within three days.',
    key: 'The 30 deliveries this supplier has made to shops of this size',
    narrow: 'The two deliveries this supplier made during the holiday rush',
    broad: 'Every delivery this shop has received from anyone, ever',
    filtered: 'The deliveries the supplier lists as examples on its own website',
    why: 'Same supplier, comparable customers, thirty cases: close enough and numerous enough.',
  },
  {
    situation: 'A group wants to know how likely a bank holiday walk is to be rained on.',
    key: 'The 40 bank holiday weekends recorded at this station',
    narrow: 'The two bank holidays somebody in the group happens to remember',
    broad: 'Every day of the year recorded at this station since it opened',
    filtered: 'The bank holidays that made the local paper for bad weather',
    why: 'Same kind of day, same place, and forty of them is a real record rather than an impression.',
  },
  {
    situation: 'A band wants to know how likely it is that a support slot leads to a paid booking.',
    key: 'The 18 support slots bands at this level have played at this venue',
    narrow: 'The two support slots this band played before its line-up changed',
    broad: 'Every gig ever played at this venue by anyone at any level',
    filtered: 'The support slots the venue mentions when it advertises itself',
    why: 'Same venue, same level of band, same kind of slot, and enough of them to count.',
  },
  {
    situation: 'A school wants to know how likely a repair job on the hall roof is to run past its date.',
    key: 'The 16 building jobs of this size this school has commissioned',
    narrow: 'The one roof job the current caretaker remembers clearly',
    broad: 'Every building project undertaken by any school in the country',
    filtered: 'The jobs the contractor puts in its brochure as finished early',
    why: 'Same scale, same client, same kind of work, and sixteen jobs is a usable record.',
  },
  {
    situation: 'A library wants to know how likely a borrowed book is to come back within the loan period.',
    key: 'The 900 loans of this kind of book made in the last year',
    narrow: 'The two loans made to the one borrower everyone remembers',
    broad: 'Every item this library has ever lent, including equipment',
    filtered: 'The loans that generated a note in the complaints book',
    why: 'Same kind of item, same library, same year, and nine hundred is plenty.',
  },
]

const rcClass = tpl(
  {
    id: 'i-rc-class',
    name: 'Which cases count as similar?',
    skillIds: ['i-refclass'],
    bucket: 'investigator',
    difficulty: 3,
    variants: 8,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, CLASS_CASES)
    const noted = mcqNoted(rng, c.key, [
      [c.narrow, 'Too narrow — two cases can only ever read 0%, 50% or 100%, so the number it gives you is mostly noise.', 'inference'],
      [c.broad, 'Too broad — it has plenty of cases, but they are not cases of THIS, so the rate answers a different question.', 'strategy'],
      [c.filtered, 'Filtered on the outcome — whichever way the truth falls, this group will look successful, so it cannot tell them apart.', 'concept'],
    ])
    return {
      title: 'Choose the comparison group',
      prompt: `${c.situation}\n\nWhich set of past cases should the estimate start from?`,
      ...noted,
      hints: [
        'A good comparison group has to pass two tests, not one: similar on what matters, AND numerous enough for a rate to mean anything.',
        'Check each option against both. One of them is similar but tiny; one is huge but not similar; one was picked because of how it turned out.',
        `Worked path: **${c.key}**. ${c.why}`,
      ],
      explanation:
        `**${c.key}.** ${c.why}\n\n` +
        `The narrow option is the seductive one, because it is the most similar of all — and that is exactly why it fails. With two cases the only rates available are none, half and all, so whatever it reports is mostly an accident.\n\n` +
        `The broad option has the opposite problem: lots of cases, none of them about this. And the filtered option is the quiet one, because it looks like data. If cases only enter the record when they went well, the record agrees with you whether or not you are right, which makes it worse than having no record.`,
    }
  },
)

interface AdjustCase {
  setting: string
  total: number
  hits: number
  outcome: string
  now: string
  key: string
  decoys: [string, string, string]
  why: string
}

const ADJUST_CASES: AdjustCase[] = [
  {
    setting: 'A youth orchestra has run 20 open rehearsals.',
    total: 20,
    hits: 9,
    outcome: 'drew more than thirty players',
    now: 'The next one has been moved from a Tuesday evening to a Saturday morning, and every previous one was on a Tuesday.',
    key: 'The day and time changed, and every past case shares the old one',
    decoys: [
      'The organiser has a strong feeling that this one will be different',
      'The last open rehearsal was quiet, so the next one is probably busy',
      'The orchestra has more players on its list than it did four years ago',
    ],
    why: 'A structural difference from every case in the record is a reason to move; a mood, a bounce-back hunch and a slow drift are not.',
  },
  {
    setting: 'A takeaway has recorded 25 Friday evenings.',
    total: 25,
    hits: 10,
    outcome: 'ran out of the special before nine',
    now: 'This Friday it is running the special at half price for the first time.',
    key: 'The price has halved, and no case in the record had that',
    decoys: [
      'The manager thinks this Friday feels quieter than most Fridays',
      'It did not run out last Friday, so it is more likely to this week',
      'The takeaway has been open for two years longer than when it started',
    ],
    why: 'A first-time change to the thing that drives demand is a real reason to move off the record; the others are feel, gambler-style reasoning, and an irrelevant trend.',
  },
  {
    setting: 'A repair volunteer has logged 40 broken lamps.',
    total: 40,
    hits: 22,
    outcome: 'were fixed with a new cable alone',
    now: 'The next lamp is a type the volunteer has never seen, with sealed wiring.',
    key: 'The wiring is sealed, which none of the logged lamps had',
    decoys: [
      'The volunteer is feeling more practised than they were last month',
      'Two easy lamps in a row means a hard one is probably due',
      'The repair group has moved to a bigger room with better lighting',
    ],
    why: 'A difference in the thing being repaired changes the rate; practice, a due-a-hard-one instinct and a nicer room do not.',
  },
  {
    setting: 'A netball team has played 20 league matches.',
    total: 20,
    hits: 13,
    outcome: 'were won',
    now: 'The next match is against the only team in the league that is unbeaten.',
    key: 'The opponent is the strongest in the league, unlike the record',
    decoys: [
      'The captain says the squad feels sharper than it has all season',
      'They lost the last one, so they are more likely to win this one',
      'The team has new kit and a new sponsor for this half of the season',
    ],
    why: 'Who you play against is part of what the rate measures; sharpness, a bounce-back feeling and new kit are not.',
  },
  {
    setting: 'A print shop has taken 50 same-week orders.',
    total: 50,
    hits: 31,
    outcome: 'were delivered within the week',
    now: 'The next order arrives in the week the shop closes for two days of maintenance.',
    key: 'Two of the five working days are gone this week',
    decoys: [
      'The customer has been particularly polite about the deadline',
      'The last three orders were late, so this one is due to be early',
      'The shop has bought a second guillotine since it opened',
    ],
    why: 'Losing 40% of the working week is a difference that acts directly on the outcome; politeness, a due-an-early-one hunch and an old purchase do not.',
  },
  {
    setting: 'A gardening group has sown 25 trays of the same seed.',
    total: 25,
    hits: 16,
    outcome: 'germinated within ten days',
    now: 'This tray uses seed from a packet that is four years past its date.',
    key: 'The seed is four years out of date, unlike every logged tray',
    decoys: [
      'The gardener has a good feeling about this particular tray',
      'The last two trays failed, so this one is more likely to take',
      'The group has twice as many members as when it started',
    ],
    why: 'Seed age acts directly on germination; optimism, a run-must-end instinct and membership growth do not.',
  },
  {
    setting: 'A film society has booked 40 speakers.',
    total: 40,
    hits: 18,
    outcome: 'drew more than fifty people',
    now: 'The next talk clashes with the town carnival, which no previous talk did.',
    key: 'It clashes with the carnival, which no logged talk did',
    decoys: [
      'The secretary is unusually excited about this particular speaker',
      'The last two talks were packed, so this one will probably be quiet',
      'The society has been running for six years rather than four',
    ],
    why: 'A clash with a big local event takes the audience away; excitement, an it-must-even-out feeling and the society ageing do not.',
  },
  {
    setting: 'A bike courier has taken 50 city-centre jobs.',
    total: 50,
    hits: 34,
    outcome: 'were delivered inside the hour',
    now: 'The next job falls on the day the main bridge is closed for resurfacing.',
    key: 'The main bridge is shut, which was open in every logged job',
    decoys: [
      'The courier has been riding this route for a couple of months longer',
      'The last job took ages, so this one is probably going to be quick',
      'The courier has a lighter bag than they used at the start of the year',
    ],
    why: 'Closing the route acts on the journey itself; extra weeks of familiarity, a things-even-out instinct and a lighter bag do not.',
  },
]

const rcAdjust = tpl(
  {
    id: 'i-rc-adjust',
    name: 'Start from the record, then adjust',
    skillIds: ['i-refclass'],
    bucket: 'investigator',
    difficulty: 3,
    variants: 8,
    minutes: 4,
    kind: 'multi',
  },
  (rng, seed) => {
    const c = cycle(seed, ADJUST_CASES)
    const rate = (c.hits * 100) / c.total
    return {
      title: 'Two steps, in order',
      prompt:
        `${c.setting} Of those ${c.total}, **${c.hits}** ${c.outcome}.\n\n` +
        `${c.now}`,
      hints: [
        'Do the counting first and the thinking second. Reversing that order is how the record gets quietly ignored.',
        'A reason to move off the record has to be something that acts on the outcome AND is absent from the cases in it.',
        `Worked path: the record says ${rate} in 100, and the one real difference is that ${c.key.charAt(0).toLowerCase()}${c.key.slice(1)}.`,
      ],
      explanation:
        `The record says **${rate} out of every 100**, and the only listed fact that earns a move away from that number is: ${c.key.charAt(0).toLowerCase()}${c.key.slice(1)}. ${c.why}`,
      parts: [
        part('The record', {
          prompt: `Out of every 100 similar occasions, how many ${c.outcome}?`,
          answer: numeric(rate, { unit: 'per 100' }),
          explanation:
            `${c.hits} out of ${c.total} rescales to **${rate} out of 100**. This is the number to argue away from, and having it in front of you is most of the work — the alternative is arguing from nothing but the details of this one case.`,
          hints: [
            `Rescale ${c.hits} out of ${c.total} so it is out of 100.`,
            `Each one of the ${c.total} is worth ${100 / c.total} out of 100.`,
            `Worked path: ${c.hits} × ${100 / c.total} = ${rate}.`,
          ],
        }),
        part('The adjustment', {
          prompt: 'Which single fact is a real reason to move away from that number?',
          answer: mcq(rng, c.key, [...c.decoys]),
          explanation:
            `${c.why} The hardest decoy is the one about the last occasion: a run of results feels like it owes you the opposite, but past occasions are already inside the ${c.total} you counted, and counting them twice is not an adjustment.`,
          hints: [
            'Ask of each fact: does it act on the outcome, and is it absent from every case in the record?',
            'A feeling about this occasion is not a difference in the occasion.',
            `Worked path: **${c.key}**.`,
          ],
        }),
      ],
    }
  },
)

interface OutsideCase {
  story: string
  inside: string
  unit: string
  past: [number, number, number, number, number]
  what: string
}

const OUTSIDE_CASES: OutsideCase[] = [
  { story: 'A student is planning a history essay.', inside: 'Two hours reading, one drafting, one checking — four hours, done Sunday.', unit: 'hours', past: [7, 9, 6, 11, 8], what: 'essays this student has written this year' },
  { story: 'A group is costing its first quiz night.', inside: 'Room, prizes, printing and drinks add up to 120.', unit: 'pounds', past: [210, 260, 180, 320, 240], what: 'quiz nights this society has run' },
  { story: 'A workshop is quoting for a garden gate.', inside: 'Cut, weld, sand, paint — three days, easily.', unit: 'days', past: [6, 5, 9, 7, 11], what: 'gates this workshop has built' },
  { story: 'A club is estimating turnout for its open evening.', inside: 'Forty members, most will bring a friend — say seventy.', unit: 'people', past: [31, 44, 22, 38, 27], what: 'open evenings this club has held' },
  { story: 'A team is planning a charity walk.', inside: 'Twenty miles at three miles an hour, so seven hours with breaks.', unit: 'hours', past: [9, 11, 8, 13, 10], what: 'walks of this length the team has done' },
  { story: 'A shop is forecasting sales of a new loaf.', inside: 'Fifty a day seems safe given how the counter looks.', unit: 'loaves a day', past: [18, 26, 12, 31, 22], what: 'new lines this shop has launched' },
  { story: 'A school is budgeting a coach trip.', inside: 'Coach hire plus entry divided among the group comes to 18 each.', unit: 'pounds each', past: [26, 31, 24, 38, 29], what: 'trips this school has run' },
  { story: 'A volunteer is planning to catalogue an archive.', inside: 'Two hundred boxes at ten minutes each is about thirty-three hours.', unit: 'hours', past: [58, 71, 49, 82, 64], what: 'archives this group has catalogued' },
  { story: 'A band is planning a recording weekend.', inside: 'Eight songs, an hour each, plus mixing — say twelve hours.', unit: 'hours', past: [19, 26, 16, 31, 22], what: 'recording sessions this band has done' },
]

const rcOutside = tpl(
  {
    id: 'i-rc-outside',
    name: 'The record against the reasoning',
    skillIds: ['i-refclass'],
    bucket: 'investigator',
    difficulty: 4,
    variants: 9,
    minutes: 4.5,
    kind: 'multi',
    transfer: true,
    calibration: true,
  },
  (rng, seed) => {
    const c = cycle(seed, OUTSIDE_CASES)
    const sorted = [...c.past].sort((x, y) => x - y)
    const middle = sorted[2]
    const lo = sorted[0]
    const hi = sorted[4]
    return {
      title: 'Two ways to estimate',
      prompt:
        `${c.story}\n\nThe estimate, worked out step by step: ${c.inside}\n\n` +
        `The last five ${c.what} took: **${c.past.join(', ')}** ${c.unit}.`,
      hints: [
        'One of the two numbers in front of you was produced by listing the steps of this job. The other is a record of how jobs like it actually went.',
        'Adding up steps can only include the steps you thought of. A record of finished jobs already contains everything nobody thought of.',
        `Worked path: sorted, the five are ${sorted.join(', ')}, so the middle one is ${middle}.`,
      ],
      explanation:
        `Sorted, the five past cases run ${sorted.join(', ')} ${c.unit}, so the middle one is **${middle}** and the whole range sits between ${lo} and ${hi}. The step-by-step figure is not in that range at all.\n\n` +
        `That gap is not carelessness. Listing steps can only ever count the steps you thought of, and the things that stretch a job — waiting, redoing, interruptions, the bit nobody remembered — are not steps. The finished record already contains all of them, which is why it beats a careful list.`,
      parts: [
        part('The record', {
          prompt: `Put the five past figures in order. What is the middle one, in ${c.unit}?`,
          answer: numeric(middle),
          explanation:
            `Sorted they are ${sorted.join(', ')}, so the middle value is **${middle}** ${c.unit}. The middle is used rather than the average because one unusually long case would drag an average without saying anything about the typical case.`,
          hints: [
            'Write the five out smallest to largest before picking anything.',
            `Sorted: ${sorted.join(', ')}.`,
            `The third of five is ${middle}.`,
          ],
        }),
        part('What to do', {
          prompt: 'The step-by-step figure and the record disagree. What is the right move?',
          answer: mcq(rng, 'Start from the record and adjust for real differences', [
            'Keep the step-by-step figure and add a margin on top of it',
            'Average the step-by-step figure with the record and use that',
            'Trust the step-by-step figure, since it was built from this case',
          ]),
          explanation:
            `Start from the record. The tempting answer is adding a margin, and it feels like the responsible thing to do — but a margin is still measured from the step-by-step figure, so it inherits the same missing pieces and simply pads them. Averaging the two has the same problem in gentler form. Starting from the record and then arguing about specific differences puts the two kinds of information in the right order.`,
          hints: [
            'Ask what each option is measured FROM, not how cautious it sounds.',
            'A margin bolted onto a figure that missed things still starts from the figure that missed things.',
            'Worked path: the record is the starting point; the details are the adjustment.',
          ],
        }),
      ],
    }
  },
)

// ===========================================================================
// i-samplesize — how much a sample can tell you
// ===========================================================================

interface SwingCase {
  small: string
  smallN: number
  large: string
  largeN: number
  each: string
  outcome: string
  base: number
  extreme: number
}

const SWING_CASES: SwingCase[] = [
  { small: 'A village bakery', smallN: 20, large: 'a city supermarket', largeN: 900, each: 'loaves', outcome: 'sell before noon', base: 40, extreme: 70 },
  { small: 'A two-court tennis club', smallN: 12, large: 'a regional centre', largeN: 600, each: 'matches', outcome: 'go to a deciding set', base: 30, extreme: 60 },
  { small: 'A rural weather station', smallN: 15, large: 'a national network', largeN: 800, each: 'readings', outcome: 'record rain', base: 25, extreme: 55 },
  { small: 'A corner shop', smallN: 25, large: 'a chain branch', largeN: 1200, each: 'card payments', outcome: 'are contactless', base: 60, extreme: 85 },
  { small: 'A small post office', smallN: 18, large: 'a sorting hub', largeN: 1500, each: 'parcels', outcome: 'are collected same-day', base: 50, extreme: 80 },
  { small: 'A school of sixty', smallN: 10, large: 'a school of nine hundred', largeN: 150, each: 'pupils arriving', outcome: 'come by bike', base: 20, extreme: 45 },
  { small: 'A one-room library', smallN: 14, large: 'a central library', largeN: 700, each: 'loans', outcome: 'are renewed online', base: 35, extreme: 65 },
  { small: 'A village surgery', smallN: 16, large: 'a large practice', largeN: 400, each: 'appointments', outcome: 'run past their slot', base: 30, extreme: 60 },
  { small: 'A single food stall', smallN: 22, large: 'a covered market', largeN: 1000, each: 'sales', outcome: 'are paid in cash', base: 45, extreme: 75 },
  { small: 'A two-lane bowling alley', smallN: 11, large: 'a twenty-lane centre', largeN: 500, each: 'games', outcome: 'end with a strike', base: 25, extreme: 55 },
]

const ssSwing = tpl(
  {
    id: 'i-ss-swing',
    name: 'Which one swings further?',
    skillIds: ['i-samplesize'],
    bucket: 'investigator',
    difficulty: 2,
    variants: 10,
    minutes: 3,
    calibration: true,
  },
  (rng, seed) => {
    const c = cycle(seed, SWING_CASES)
    const askExtreme = seed % 2 === 0
    const setup =
      `${c.small} records about **${c.smallN}** ${c.each} a day; ${c.large} records about **${c.largeN}**.\n\n` +
      `In the long run the same share applies to both: about **${c.base}%** of ${c.each} ${c.outcome}.`
    const answer = askExtreme
      ? mcq(rng, 'The smaller one — small counts swing further', [
          'The larger one — it records far more each day',
          'Both about equally, since the long-run share is the same',
          'There is no way to tell from the numbers given here',
        ])
      : mcq(rng, 'The larger one — big counts settle down', [
          'The smaller one — it has fewer oddities to average in',
          'Both about equally, since the long-run share is the same',
          'There is no way to tell from the numbers given here',
        ])
    return {
      title: 'Small counts, big swings',
      prompt: askExtreme
        ? `${setup}\n\nOver a year, which is more likely to record at least one day where more than **${c.extreme}%** of its ${c.each} ${c.outcome}?`
        : `${setup}\n\nOver a whole year, which one ends the year with an overall figure closer to **${c.base}%**?`,
      answer,
      hints: [
        askExtreme
          ? `Imagine an unusual day at each. One odd hour at ${c.small.toLowerCase()} moves a handful of ${c.each}; the same odd hour at the larger place is swallowed.`
          : `Ask which figure has more ${c.each} underneath it, and what that does to the effect of any single odd day.`,
        'The rule is that the share of a small group bounces around far more than the share of a large one, even when the underlying truth is identical.',
        askExtreme
          ? `Worked path: with only ${c.smallN} ${c.each} a day, a handful of extra ones takes the share past ${c.extreme}%; with ${c.largeN} it would take hundreds.`
          : `Worked path: a year at ${c.largeN} a day rests on far more ${c.each} than a year at ${c.smallN}, so its figure settles nearer ${c.base}%.`,
      ],
      explanation: askExtreme
        ? `**The smaller one.** At ${c.smallN} ${c.each} a day, a few extra takes the share well past ${c.extreme}%. At ${c.largeN} a day the same handful barely moves the figure, and reaching ${c.extreme}% would need hundreds of extra ${c.each} at once.\n\n` +
          `The tempting answer is the larger one, because it has so many more chances for something unusual to happen. It does — but the question is about the SHARE, and a big total is exactly what stops any share from moving. Both places sit at ${c.base}% in the long run; only the small one wanders far from it.\n\n` +
          `This rule is not about shops or ${c.each}. The training study that established it taught the rule in the abstract and then worked examples in a few unrelated settings; people improved just as much on the settings they had never been shown as on the ones they had (Fong, Krantz and Nisbett, 1986).`
        : `**The larger one.** A year of ${c.largeN} ${c.each} a day rests on far more observations than a year of ${c.smallN}, and the more there are, the closer the overall figure sits to the true ${c.base}%.\n\n` +
          `The tempting answer is the smaller one, on the reasoning that a small place is simpler and has fewer odd cases to muddy things. It has fewer odd cases in total, but each one counts for far more of its figure, which is the opposite of what settling down requires.\n\n` +
          `The same rule runs in both directions: small samples produce more extreme results AND less reliable averages, because those are two descriptions of one fact.`,
    }
  },
)

const MARGIN_CASES: string[] = [
  'A student survey about lunch queues',
  'A quality check on a run of printed posters',
  'A taste test for a new fruit squash',
  'A count of birds at a feeding station',
  'A survey of which route people cycle to work',
  'A check on how many parcels arrive undamaged',
]

const MARGIN_N = [200, 300, 400, 500, 600, 800]

const ssMargin = tpl(
  {
    id: 'i-ss-margin',
    name: 'How many to halve the wobble?',
    skillIds: ['i-samplesize'],
    bucket: 'investigator',
    difficulty: 3,
    variants: 12,
    minutes: 3,
  },
  (_rng, seed) => {
    const ctx = cycle(seed, MARGIN_CASES)
    const n = MARGIN_N[seed % MARGIN_N.length]
    const shrink = seed < 6 ? 2 : 3
    const margin = 12
    const target = margin / shrink
    const needed = n * shrink * shrink
    return {
      title: 'Shrinking the margin',
      prompt:
        `${ctx} asked **${n}** people and reported its result give or take about **${margin}** points.\n\n` +
        `A repeat wants that down to about **${target}** points — ${shrink === 2 ? 'half' : 'a third'} the wobble.\n\n` +
        `Roughly how many people does the repeat need?`,
      answer: numeric(needed, { unit: 'people' }),
      hints: [
        'The wobble does not fall in step with the number of people. It falls with the SQUARE ROOT of it, which is much slower.',
        `To divide the wobble by ${shrink}, the number of people has to be multiplied by ${shrink} × ${shrink}.`,
        `Worked path: ${n} × ${shrink * shrink} = **${needed}**.`,
      ],
      explanation:
        `**${needed} people.** Wobble shrinks with the square root of the sample, so cutting it to ${shrink === 2 ? 'a half' : 'a third'} costs ${shrink * shrink} times the people: ${n} × ${shrink * shrink} = ${needed}.\n\n` +
        `The tempting answer is ${n * shrink} — ${shrink === 2 ? 'double' : 'triple'} the people for ${shrink === 2 ? 'half' : 'a third'} the wobble — because everything else in life scales that way. Here it does not, and the mismatch has a practical edge: the first few hundred people buy a lot of precision and every further batch buys less. It is also why a survey of ${needed} is not ${shrink * shrink} times more trustworthy than one of ${n}; it is ${shrink} times more precise.`,
    }
  },
)

interface LeagueCase {
  units: string
  measure: string
  small: string
}

const LEAGUE_CASES: LeagueCase[] = [
  { units: 'primary schools', measure: 'average reading scores', small: 'schools with fewer than eighty pupils' },
  { units: 'garden centres', measure: 'customer ratings', small: 'single-site centres with a handful of staff' },
  { units: 'weather stations', measure: 'days of record sunshine', small: 'stations that report only a few times a week' },
  { units: 'village cricket clubs', measure: 'batting averages', small: 'clubs that play under ten matches a season' },
  { units: 'bakeries', measure: 'share of loaves sold before noon', small: 'bakeries that bake fewer than thirty loaves' },
  { units: 'dental practices', measure: 'share of appointments starting on time', small: 'practices with a single dentist' },
  { units: 'choirs', measure: 'competition placings', small: 'choirs with under fifteen singers' },
  { units: 'community libraries', measure: 'share of loans returned early', small: 'libraries lending a few dozen books a month' },
]

const ssLeague = tpl(
  {
    id: 'i-ss-league',
    name: 'Top of the table and bottom of it',
    skillIds: ['i-samplesize'],
    bucket: 'investigator',
    difficulty: 3,
    variants: 8,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, LEAGUE_CASES)
    return {
      title: 'Both ends of the list',
      prompt:
        `A regional report ranks every one of the area's ${c.units} by ${c.measure}.\n\n` +
        `Nine of the **top ten** are ${c.small}. Eight of the **bottom ten** are ${c.small} as well.\n\n` +
        `What is the most likely explanation?`,
      answer: mcq(rng, 'Small groups land at both extremes more often', [
        'Being small genuinely helps some and hurts others here',
        'The two ends of the list must have been mixed up somehow',
        'Bigger ones deliberately avoid standing out in either direction',
      ]),
      hints: [
        'A real advantage would show up at one end of the list. This shows up at both.',
        `Ask how many ${c.measure.includes('share') ? 'cases' : 'observations'} sit underneath one figure at a small place, and what a couple of unusual ones do to it.`,
        'Worked path: figures built on few observations wander further in BOTH directions, so they fill both ends of any ranking.',
      ],
      explanation:
        `**Small groups land at both extremes more often.** A figure resting on very few observations wanders a long way from the truth in whichever direction the luck fell, so small ${c.units} crowd the top of a table AND the bottom of it.\n\n` +
        `The tempting answer is the first one — that being small really does help. It is tempting because half the evidence supports it perfectly: nine of the top ten. Reading only the top of a list is what makes this mistake almost invisible, and it is the reason the bottom ten is the important half of this question.\n\n` +
        `The practical consequence is uncomfortable and worth stating: a ranking that mixes large and small units mostly ranks them by size of sample, not by quality.`,
    }
  },
)

interface TwoStudyCase {
  small: { text: string; n: number; unit: string }
  large: { text: string; n: number; unit: string }
  ratio: number
}

const TWO_STUDY_CASES: TwoStudyCase[] = [
  { small: { text: 'A running club tried a new warm-up and found injuries fell by a third.', n: 25, unit: 'runners' }, large: { text: 'A council trial of the same warm-up found injuries fell by a tenth.', n: 400, unit: 'runners' }, ratio: 16 },
  { small: { text: 'A cafe changed its lighting and found sales of cake rose by a fifth.', n: 40, unit: 'days' }, large: { text: 'A chain made the same change and found cake sales rose by a twentieth.', n: 360, unit: 'days' }, ratio: 9 },
  { small: { text: 'A class tried spaced quizzes and scored eight points higher.', n: 18, unit: 'pupils' }, large: { text: 'A year group tried the same quizzes and scored three points higher.', n: 450, unit: 'pupils' }, ratio: 25 },
  { small: { text: 'A grower used a new compost and saw a quarter more seedlings survive.', n: 30, unit: 'trays' }, large: { text: 'A nursery used the same compost and saw a tenth more survive.', n: 480, unit: 'trays' }, ratio: 16 },
  { small: { text: 'A depot changed its loading order and cut late vans by half.', n: 20, unit: 'days' }, large: { text: 'A regional firm made the same change and cut late vans by a sixth.', n: 500, unit: 'days' }, ratio: 25 },
  { small: { text: 'A shop moved its till and found queues shortened by two minutes.', n: 35, unit: 'shifts' }, large: { text: 'Six shops moved their tills and queues shortened by forty seconds.', n: 315, unit: 'shifts' }, ratio: 9 },
  { small: { text: 'A team changed its stretching and reported far fewer stiff mornings.', n: 15, unit: 'players' }, large: { text: 'A league trialled the same change and reported a small improvement.', n: 375, unit: 'players' }, ratio: 25 },
  { small: { text: 'A library moved new titles to the door and loans of them doubled.', n: 22, unit: 'weeks' }, large: { text: 'A city service made the same move and loans rose by a seventh.', n: 352, unit: 'weeks' }, ratio: 16 },
  { small: { text: 'A stall switched to paper bags and takings rose noticeably.', n: 24, unit: 'market days' }, large: { text: 'A market switched all its stalls and takings barely moved.', n: 216, unit: 'market days' }, ratio: 9 },
  { small: { text: 'A choir changed its warm-up and reported a much better blend.', n: 12, unit: 'rehearsals' }, large: { text: 'A federation of choirs tried it and reported a slight improvement.', n: 300, unit: 'rehearsals' }, ratio: 25 },
]

const ssTwo = tpl(
  {
    id: 'i-ss-two',
    name: 'Two findings, two sizes',
    skillIds: ['i-samplesize'],
    bucket: 'investigator',
    difficulty: 3,
    variants: 10,
    minutes: 4,
    kind: 'multi',
    transfer: true,
  },
  (rng, seed) => {
    const c = cycle(seed, TWO_STUDY_CASES)
    const askSafer = seed % 2 === 0
    const factor = Math.round(Math.sqrt(c.ratio))
    const study = `Finding A. ${c.small.text} It rested on ${c.small.n} ${c.small.unit}.\n\nFinding B. ${c.large.text} It rested on ${c.large.n} ${c.large.unit}.`
    const verdict = askSafer
      ? mcq(rng, 'Finding B — its figure wobbles far less', [
          'Finding A — its effect was much bigger than the other',
          'Both equally, since each reports a real measured difference',
          'Neither, because the two were measured in different places',
        ])
      : mcq(rng, 'Finding A — it had the least to steady it', [
          'Finding B — its effect was too small to be real anyway',
          'Both equally, since a repeat is unpredictable either way',
          'Neither, because a repeat always returns the same figure',
        ])
    return {
      title: 'Which number would you bet on?',
      prompt: 'Two groups tried the same change and reported different-sized effects. Read both, then answer.',
      hints: [
        'Before comparing the two effects, compare what each one rests on.',
        'The bigger effect is not the better evidence. A figure built on few observations is free to land a long way from the truth.',
        `Worked path: ${c.large.n} is ${c.ratio} times ${c.small.n}, and wobble falls with the square root, so it is about ${factor} times steadier.`,
      ],
      explanation:
        `Finding A reports the bigger effect and Finding B rests on ${c.ratio} times as many ${c.large.unit}. Because wobble falls with the square root of the number of observations, B's figure is about ${factor} times steadier than A's — which is exactly the pattern you would expect if the true effect were small and A had simply been lucky.\n\n` +
        `The trap is that a big number feels like strong evidence. Effect size and reliability are separate things, and a small sample can produce an enormous effect out of nothing at all.`,
      parts: [
        part('Read both', {
          study,
          studySeconds: 45,
          prompt: askSafer
            ? 'Which finding would you rather bet on being repeated?'
            : 'Which finding would surprise you least if it shrank to almost nothing on a repeat?',
          answer: verdict,
          explanation: askSafer
            ? `Finding B. It rests on ${c.large.n} ${c.large.unit} against ${c.small.n}, so its figure has far less room to wander. The tempting pick is A, because a third or a half sounds like a much stronger result than a tenth — but the size of an effect says nothing about how firmly it was pinned down.`
            : `Finding A. With only ${c.small.n} ${c.small.unit} behind it, a striking figure can appear from ordinary variation alone, so a repeat shrinking it towards B's figure is the expected outcome rather than a surprise. The tempting pick is B on the grounds that a small effect is fragile, but B's small effect is the well-measured one.`,
          hints: [
            'Look at what sits underneath each number before looking at the numbers.',
            'Ask which figure had more room to land somewhere it did not belong.',
            `Worked path: ${c.small.n} against ${c.large.n}.`,
          ],
        }),
        part('By how much', {
          prompt: `Finding B rests on ${c.ratio} times as many ${c.large.unit} as Finding A. Roughly how many times steadier does that make its figure?`,
          answer: numeric(factor, { unit: 'times' }),
          explanation:
            `**${factor} times.** Steadiness improves with the square root of the count, and the square root of ${c.ratio} is ${factor}. The tempting answer is ${c.ratio}: ${c.ratio} times the observations feels like it ought to buy ${c.ratio} times the precision, and the fact that it buys only ${factor} times is the whole reason big studies are expensive.`,
          hints: [
            'Precision does not improve in step with the count.',
            `Ask what number multiplied by itself gives ${c.ratio}.`,
            `Worked path: the square root of ${c.ratio} is ${factor}.`,
          ],
        }),
      ],
    }
  },
)

// ===========================================================================
// i-diagnostic — how much this evidence moves things
// ===========================================================================

interface SplitCase {
  setup: string
  hypA: string
  hypB: string
  /** [observation, times in 10 under A, times in 10 under B] */
  obs: [string, number, number][]
}

const SPLIT_CASES: SplitCase[] = [
  {
    setup: 'A shop card reader fails about once a week.',
    hypA: 'the reader itself is faulty',
    hypB: 'the shop broadband keeps dropping',
    obs: [
      ['The till screen freezes as well', 3, 8],
      ['The failure happens at busy times', 5, 6],
      ['A card works on the spare reader', 1, 9],
      ['The receipt printer still works', 9, 9],
    ],
  },
  {
    setup: 'A greenhouse of tomatoes is wilting on one side only.',
    hypA: 'the drip line is blocked there',
    hypB: 'that side gets too much afternoon sun',
    obs: [
      ['The soil there is dry at midnight', 9, 2],
      ['The leaves curl upward by noon', 6, 7],
      ['Wilting started in the same week', 5, 5],
      ['Plants in pots there wilt as well', 2, 8],
    ],
  },
  {
    setup: 'A choir sounds flat in the second half of rehearsals.',
    hypA: 'the singers are tiring',
    hypB: 'the hall warms up and the piano drifts',
    obs: [
      ['The piano alone drifts by the break', 1, 9],
      ['It happens on long rehearsals too', 6, 5],
      ['The sopranos say their throats ache', 8, 2],
      ['It happens in every kind of piece', 8, 8],
    ],
  },
  {
    setup: 'A bike keeps losing pressure in one tyre overnight.',
    hypA: 'the inner tube has a slow puncture',
    hypB: 'the valve is not seating properly',
    obs: [
      ['Bubbles appear at the valve in water', 1, 9],
      ['The tyre is soft every single morning', 7, 7],
      ['A new tube fixes it for a fortnight', 8, 3],
      ['The rim tape looks worn in one place', 5, 4],
    ],
  },
  {
    setup: 'A club newsletter is reaching fewer members each month.',
    hypA: 'it is going to junk folders',
    hypB: 'members have lost interest in it',
    obs: [
      ['Opens fell on one day, not gradually', 8, 2],
      ['Nobody has asked to be removed', 6, 5],
      ['A test copy landed in junk', 9, 1],
      ['The newsletter is sent monthly', 9, 9],
    ],
  },
  {
    setup: 'A pond has turned green over three weeks.',
    hypA: 'the pump has stopped circulating',
    hypB: 'run-off from the lawn is feeding algae',
    obs: [
      ['It greened after the lawn was fed', 2, 9],
      ['The surface is still on windy days', 9, 2],
      ['It is worse near the far bank', 5, 6],
      ['The pond is green all over', 7, 7],
    ],
  },
  {
    setup: 'A laptop battery now lasts two hours instead of six.',
    hypA: 'the battery itself has aged',
    hypB: 'something is running in the background',
    obs: [
      ['The fan runs constantly while idle', 2, 9],
      ['It drains fast when switched off', 8, 2],
      ['The change happened over months', 6, 5],
      ['It charges to full every time', 6, 6],
    ],
  },
  {
    setup: 'A hall floor is marked in curved streaks each Monday.',
    hypA: 'the cleaning machine is leaking',
    hypB: 'the badminton nets are dragged across',
    obs: [
      ['The streaks follow the machine route', 9, 2],
      ['They appear after the weekend only', 6, 7],
      ['The marks lift with plain water', 5, 5],
      ['Net feet have rubber scuffs on them', 3, 8],
    ],
  },
  {
    setup: 'A radio show loses listeners exactly at the half hour.',
    hypA: 'the transmitter dips at that time',
    hypB: 'listeners leave when the ads start',
    obs: [
      ['Online listening drops as well', 9, 4],
      ['It happens every weekday', 8, 8],
      ['Ads run at exactly that minute', 5, 9],
      ['The drop lasts about four minutes', 6, 6],
    ],
  },
  {
    setup: 'A kiln is firing unevenly along one shelf.',
    hypA: 'one element has failed',
    hypB: 'the shelf is packed too tightly',
    obs: [
      ['The cool zone is a wide even band', 8, 3],
      ['It happened after a new shelf plan', 2, 9],
      ['Both firings this month were uneven', 6, 6],
      ['The pyrometer reads normally', 6, 5],
    ],
  },
]

function bestSplit(obs: [string, number, number][]): [string, number, number] {
  let best = obs[0]
  for (const o of obs) {
    if (Math.abs(o[1] - o[2]) > Math.abs(best[1] - best[2])) best = o
  }
  return best
}

const dgSplit = tpl(
  {
    id: 'i-dg-split',
    name: 'Which check tells them apart?',
    skillIds: ['i-diagnostic'],
    bucket: 'investigator',
    difficulty: 2,
    variants: 10,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, SPLIT_CASES)
    const key = bestSplit(c.obs)
    const gap = Math.abs(key[1] - key[2])
    const worst = [...c.obs].sort((x, y) => Math.abs(x[1] - x[2]) - Math.abs(y[1] - y[2]))[0]
    const lines = c.obs
      .map((o) => `- ${o[0]}: **${o[1]} times in 10** if ${c.hypA}, **${o[2]} in 10** if ${c.hypB}`)
      .join('\n')
    return {
      title: 'Pick the check that separates',
      prompt:
        `${c.setup}\n\nTwo explanations are on the table: ${c.hypA}, or ${c.hypB}.\n\n` +
        `Here is how often each thing shows up under each explanation:\n\n${lines}\n\n` +
        `Which one tells you the most about which explanation is right?`,
      answer: mcq(rng, key[0], c.obs.filter((o) => o[0] !== key[0]).map((o) => o[0])),
      hints: [
        'Ignore how dramatic each line sounds. Compare the two numbers on each line and nothing else.',
        'The useful line is the one where the two numbers are furthest apart, because that is the one whose answer would mean different things under the two explanations.',
        `Worked path: the widest gap is ${key[1]} against ${key[2]} — **${key[0]}**.`,
      ],
      explanation:
        `**${key[0]}** — ${key[1]} in 10 against ${key[2]} in 10, a gap of ${gap}. Whichever way that one comes out, it points somewhere.\n\n` +
        `Compare it with "${worst[0]}": ${worst[1]} in 10 against ${worst[2]} in 10. That happens about as often either way, so however striking it looks, seeing it leaves you exactly where you started.\n\n` +
        `The whole idea sits in that comparison. Evidence is not strong because it is dramatic, or because it fits your favourite explanation — it is strong when it would have come out DIFFERENTLY under the other one.`,
    }
  },
)

interface CommonCase {
  setup: string
  hypA: string
  hypB: string
  obs: string
  a: number
  b: number
}

const COMMON_CASES: CommonCase[] = [
  { setup: 'A greenhouse heater cuts out overnight.', hypA: 'the thermostat is faulty', hypB: 'the fuel line freezes', obs: 'The alarm was shrieking when the owner arrived', a: 92, b: 90 },
  { setup: 'A van fails to start on cold mornings.', hypA: 'the battery is failing', hypB: 'the glow plugs are worn', obs: 'The dashboard lit up completely and then went dark', a: 88, b: 30 },
  { setup: 'A community hall floods after heavy rain.', hypA: 'the gutters are blocked', hypB: 'the drain outside is undersized', obs: 'Water was ankle deep across the whole floor', a: 85, b: 88 },
  { setup: 'A camera stops recording partway through the night.', hypA: 'the card filled up', hypB: 'the power supply is loose', obs: 'The final frame is violently blurred', a: 20, b: 80 },
  { setup: 'A sourdough starter has stopped rising.', hypA: 'the kitchen has grown too cold', hypB: 'the flour was changed last week', obs: 'The surface has a sharp, strong smell', a: 78, b: 82 },
  { setup: 'A school printer produces streaked pages.', hypA: 'the drum is worn', hypB: 'the paper has absorbed damp', obs: 'A whole ream came out ruined at once', a: 35, b: 90 },
  { setup: 'A car alarm goes off in the night.', hypA: 'the sensor is too sensitive', hypB: 'someone tried the door handle', obs: 'The siren was extremely loud and lasted a minute', a: 95, b: 93 },
  { setup: 'A pond fish population has dropped sharply.', hypA: 'a heron has been visiting', hypB: 'the oxygen level fell in the heat', obs: 'Several fish were found at the surface', a: 25, b: 85 },
  { setup: 'A phone charges very slowly.', hypA: 'the cable is damaged', hypB: 'the battery has aged', obs: 'The phone became noticeably hot in use', a: 60, b: 64 },
  { setup: 'A hedge has died back along one stretch.', hypA: 'road salt has reached the roots', hypB: 'a fungus has spread along the row', obs: 'The dead stretch is a single unbroken run', a: 84, b: 32 },
]

const dgCommon = tpl(
  {
    id: 'i-dg-common',
    name: 'Dramatic is not the same as telling',
    skillIds: ['i-diagnostic'],
    bucket: 'investigator',
    difficulty: 3,
    variants: 10,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, COMMON_CASES)
    const gap = c.a - c.b
    const key =
      Math.abs(gap) < 10
        ? 'Barely — it is nearly as common either way'
        : gap > 0
          ? 'Strongly toward the first explanation given'
          : 'Strongly toward the second explanation given'
    const options = [
      'Barely — it is nearly as common either way',
      'Strongly toward the first explanation given',
      'Strongly toward the second explanation given',
      'It rules the second explanation out completely',
    ]
    return {
      title: 'How far does it move you?',
      prompt:
        `${c.setup}\n\nTwo explanations: **first**, ${c.hypA}; **second**, ${c.hypB}.\n\n` +
        `Observation: ${c.obs}.\n\n` +
        `Out of every 100 times the first explanation is behind it, that shows up **${c.a}** times. Out of every 100 times the second is behind it, it shows up **${c.b}** times.\n\n` +
        `How far does the observation move you?`,
      answer: mcq(
        rng,
        key,
        options.filter((o) => o !== key),
      ),
      hints: [
        'The size of the two numbers does not matter. Only the distance between them does.',
        `Compare ${c.a} in 100 with ${c.b} in 100 and ask whether hearing it would have been a surprise under either explanation.`,
        `Worked path: ${c.a} against ${c.b} is a gap of ${Math.abs(gap)}, so the answer is **${key.toLowerCase()}**.`,
      ],
      explanation:
        Math.abs(gap) < 10
          ? `**Barely.** ${c.a} in 100 against ${c.b} in 100 is almost no difference at all, so the observation would have turned up either way and separates nothing.\n\n` +
            `It is tempting to treat it as important because it is vivid, and vivid detail is what people report and remember. But a fact that both explanations predict cannot choose between them, however alarming it is to witness. The only thing carrying information is the gap.`
          : `**${key}** ${c.a} in 100 against ${c.b} in 100 is a gap of ${Math.abs(gap)}, so this observation genuinely favours ${gap > 0 ? 'the first' : 'the second'} explanation.\n\n` +
            `Note what it does not do: it does not rule the other one out. ${gap > 0 ? c.b : c.a} times in 100 is uncommon, not impossible, and treating strong evidence as proof is how a reasonable conclusion turns into a stuck one. Evidence moves you; it rarely closes the question.`,
    }
  },
)

interface RatioCase {
  setup: string
  hypA: string
  hypB: string
  sign: string
  x: number
  y: number
}

const RATIO_CASES: RatioCase[] = [
  { setup: 'A field of barley has patches of yellowing.', hypA: 'waterlogging', hypB: 'nitrogen shortage', sign: 'the yellowing follows the low ground', x: 60, y: 15 },
  { setup: 'A boiler is losing pressure weekly.', hypA: 'a leak in the pipework', hypB: 'a failing expansion vessel', sign: 'a damp patch appears on a ceiling', x: 90, y: 30 },
  { setup: 'A shop is short of cash at closing.', hypA: 'a till-entry mistake', hypB: 'a faulty card terminal', sign: 'the card total and the bank total disagree', x: 80, y: 10 },
  { setup: 'A dog is scratching more than usual.', hypA: 'a new food', hypB: 'dry indoor air', sign: 'the scratching started within two days of a change', x: 45, y: 9 },
  { setup: 'A choir is arriving late to rehearsal.', hypA: 'the bus timetable changed', hypB: 'the start time moved earlier', sign: 'the same handful of people are late each week', x: 72, y: 12 },
  { setup: 'A greenhouse fan runs constantly.', hypA: 'a stuck thermostat', hypB: 'genuinely hot weather', sign: 'the fan runs through the night as well', x: 50, y: 25 },
  { setup: 'A website is slow at certain hours.', hypA: 'a scheduled backup', hypB: 'a surge of visitors', sign: 'the slowdown starts at exactly the same minute', x: 96, y: 16 },
  { setup: 'A kettle trips the fuse box.', hypA: 'a fault in the kettle', hypB: 'an overloaded circuit', sign: 'it trips even when nothing else is switched on', x: 35, y: 7 },
  { setup: 'A hedge is thinning at the base.', hypA: 'deep shade', hypB: 'rabbit damage', sign: 'the stems are cut cleanly at an angle', x: 64, y: 8 },
  { setup: 'A car is using more fuel than usual.', hypA: 'under-inflated tyres', hypB: 'a change in driving route', sign: 'the change appeared on the same day as a cold snap', x: 90, y: 60 },
  { setup: 'A phone loses signal indoors only.', hypA: 'new metal-lined blinds', hypB: 'a mast fault nearby', sign: 'other phones in the same room are fine', x: 70, y: 28 },
  { setup: 'A pond pump keeps stopping.', hypA: 'a blocked intake', hypB: 'an overheating motor', sign: 'it restarts on its own after about an hour', x: 81, y: 27 },
]

const dgRatio = tpl(
  {
    id: 'i-dg-ratio',
    name: 'How much likelier under one story?',
    skillIds: ['i-diagnostic'],
    bucket: 'investigator',
    difficulty: 3,
    variants: 12,
    minutes: 3,
  },
  (_rng, seed) => {
    const c = cycle(seed, RATIO_CASES)
    const ratio = round(c.x / c.y, 4)
    return {
      title: 'The size of the gap',
      prompt:
        `${c.setup} It could be ${c.hypA} or ${c.hypB}.\n\n` +
        `Out of every 100 cases caused by ${c.hypA}, ${c.sign} in **${c.x}** of them.\n` +
        `Out of every 100 caused by ${c.hypB}, it happens in **${c.y}** of them.\n\n` +
        `How many times more common is that sign when ${c.hypA} is behind it?`,
      answer: numeric(ratio, { unit: 'times' }),
      hints: [
        'Both figures are already out of the same 100, so they can be compared directly.',
        `Ask how many ${c.y}s fit into ${c.x}.`,
        `Worked path: ${c.x} ÷ ${c.y} = **${ratio}**.`,
      ],
      explanation:
        `**${ratio} times.** Both counts are already out of 100, so dividing them compares like with like: ${c.x} ÷ ${c.y} = ${ratio}.\n\n` +
        `The tempting answer is ${c.x - c.y}, the difference between the two. Subtracting feels natural and it is the wrong operation here: a sign that appears 90 times against 60 and a sign that appears 31 times against 1 have almost the same difference, but the second is far more telling. What decides how much a piece of evidence moves you is the RATIO, not the gap in counts.\n\n` +
        `${ratio >= 4 ? 'A ratio this size is genuinely strong evidence.' : 'A ratio this size nudges rather than settles — worth having, not worth concluding from on its own.'}`,
    }
  },
)

interface RankCase {
  setup: string
  hypA: string
  hypB: string
  obs: [string, number, number][]
}

const RANK_CASES: RankCase[] = [
  {
    setup: 'A shed light flickers most evenings.',
    hypA: 'a loose connection',
    hypB: 'a failing bulb',
    obs: [
      ['It flickers when the door slams', 8, 1],
      ['It is worse late in the evening', 6, 4],
      ['A new bulb changed nothing', 7, 2],
    ],
  },
  {
    setup: 'A bread dough is failing to rise.',
    hypA: 'dead yeast',
    hypB: 'a cold kitchen',
    obs: [
      ['A yeast test in warm water stayed flat', 9, 1],
      ['It rose slowly rather than not at all', 2, 8],
      ['The kitchen felt normal to the baker', 5, 4],
    ],
  },
  {
    setup: 'A club is losing members each term.',
    hypA: 'the new meeting time',
    hypB: 'the higher subscription',
    obs: [
      ['Leavers are mostly those who worked evenings', 9, 3],
      ['Leaving began the term the change landed', 6, 6],
      ['Concession members left at the same rate', 4, 8],
    ],
  },
  {
    setup: 'A garden tap drips only in winter.',
    hypA: 'a perished washer',
    hypB: 'expansion in the pipe',
    obs: [
      ['It drips within an hour of the heating', 1, 9],
      ['A new washer made no difference at all', 2, 7],
      ['The drip is slow rather than a stream', 5, 6],
    ],
  },
  {
    setup: 'A tablet screen responds badly some days.',
    hypA: 'a cracked digitiser',
    hypB: 'a case pressing the edge',
    obs: [
      ['It works perfectly with the case removed', 1, 9],
      ['The dead area is always the same strip', 7, 5],
      ['It has been dropped at some point', 6, 4],
    ],
  },
  {
    setup: 'A hall is cold at one end only.',
    hypA: 'an airlock in a radiator',
    hypB: 'a draught from the fire door',
    obs: [
      ['That radiator is cold at the top', 9, 2],
      ['A smoke test drifts from the door', 3, 9],
      ['It is worse on windy days', 4, 7],
    ],
  },
  {
    setup: 'A camera keeps producing dark photographs.',
    hypA: 'a stuck exposure setting',
    hypB: 'a dirty lens filter',
    obs: [
      ['Every shot is dark by the same amount', 9, 3],
      ['The corners are darker than the middle', 2, 8],
      ['It happens indoors and outdoors alike', 6, 5],
    ],
  },
  {
    setup: 'A bee hive is producing less honey.',
    hypA: 'a lost queen',
    hypB: 'poor forage nearby',
    obs: [
      ['No new brood has appeared for three weeks', 9, 1],
      ['Neighbouring hives are also down', 2, 8],
      ['The bees are calm and numerous', 4, 6],
    ],
  },
]

const dgOrder = tpl(
  {
    id: 'i-dg-order',
    name: 'Rank the evidence',
    skillIds: ['i-diagnostic'],
    bucket: 'investigator',
    difficulty: 4,
    variants: 8,
    minutes: 3.5,
    transfer: true,
  },
  (rng, seed) => {
    const c = cycle(seed, RANK_CASES)
    const display = shuffle(rng, c.obs)
    const ranked = [...display].sort((x, y) => Math.abs(y[1] - y[2]) - Math.abs(x[1] - x[2]))
    const correct = ranked.map((r) => display.indexOf(r))
    const lines = display
      .map((o) => `- ${o[0]}: **${o[1]} in 10** if ${c.hypA}, **${o[2]} in 10** if ${c.hypB}`)
      .join('\n')
    return {
      title: 'Strongest first',
      prompt:
        `${c.setup} It could be ${c.hypA} or ${c.hypB}.\n\n` +
        `How often each thing turns up under each explanation:\n\n${lines}\n\n` +
        `Put the three in order, from the one that separates the explanations most to the one that separates them least.`,
      answer: { type: 'order', options: display.map((o) => o[0]), correct },
      hints: [
        'Work out one number for each line before comparing anything: how far apart its two figures are.',
        'A line whose two figures are close is near-useless no matter how interesting it sounds.',
        `Worked path: gaps of ${ranked.map((r) => Math.abs(r[1] - r[2])).join(', ')} respectively.`,
      ],
      explanation:
        `Strongest first: ${ranked.map((r, i) => `${i + 1}. ${r[0]} (gap ${Math.abs(r[1] - r[2])})`).join('  ')}.\n\n` +
        `Ranking is harder than picking a winner, because it forces a judgement on the middle one — and the middle one is where the mistake usually lives. A fact that fits your preferred explanation feels like support even when it fits the other one nearly as well, and only measuring the gap makes that visible.\n\n` +
        `The last item on the list is not wrong or irrelevant. It is simply something both explanations expect, so knowing it changes nothing.`,
    }
  },
)

// ===========================================================================
// i-conditional — if-then and what follows
// ===========================================================================

type CondForm = 'affirm-if' | 'deny-then' | 'affirm-then' | 'deny-if'

interface CondCase {
  rule: string
  fact: string
  form: CondForm
  key: string
  decoys: [string, string, string]
  note: string
}

const COND_CASES: CondCase[] = [
  {
    rule: 'If the kettle is switched on, the red light glows.',
    fact: 'The kettle is switched on.',
    form: 'affirm-if',
    key: 'The red light is glowing — the rule says so',
    decoys: [
      'The red light may or may not glow — unstated',
      'The red light is off — the rule rules that out',
      'Only a kettle can ever make that light glow',
    ],
    note: 'The if-part is true, so the rule fires and the then-part follows.',
  },
  {
    rule: 'If the gate is bolted, the tag reads GREEN.',
    fact: 'The tag does not read GREEN.',
    form: 'deny-then',
    key: 'The gate is not bolted — the rule forces that',
    decoys: [
      'The gate is bolted — the tag must be faulty',
      'The gate may or may not be bolted — nothing settles it',
      'Only a bolted gate ever shows any tag at all',
    ],
    note: 'The then-part is false, so the if-part cannot be true — otherwise the rule would have made it true.',
  },
  {
    rule: 'If the oven is on, the extractor fan runs.',
    fact: 'The extractor fan is running.',
    form: 'affirm-then',
    key: 'The oven may or may not be on — untested',
    decoys: [
      'The oven is on — the running fan proves it',
      'The oven is off — the fan says otherwise',
      'Only the oven can ever start that fan running',
    ],
    note: 'The rule only points one way. Other things can run the fan, and nothing here rules them out.',
  },
  {
    rule: 'If a form is late, it goes in the grey tray.',
    fact: 'This form is not late.',
    form: 'deny-if',
    key: 'It may still be in the grey tray — unsettled',
    decoys: [
      'It is not in the grey tray — the rule says so',
      'It is in the grey tray — the rule puts it there',
      'Nothing but late forms ever reaches that tray',
    ],
    note: 'The rule says where late forms go. It never said the tray is only for them.',
  },
  {
    rule: 'If the tank is below a quarter, the buzzer sounds.',
    fact: 'The tank is below a quarter.',
    form: 'affirm-if',
    key: 'The buzzer is sounding — the rule says so',
    decoys: [
      'The buzzer may or may not sound — unstated',
      'The buzzer is silent — the rule forbids that',
      'Only a low tank can ever set that buzzer off',
    ],
    note: 'The if-part holds, so the then-part follows. Nothing more, and nothing less.',
  },
  {
    rule: 'If the parcel was scanned, a time is printed on it.',
    fact: 'No time is printed on this parcel.',
    form: 'deny-then',
    key: 'The parcel was not scanned — the rule forces it',
    decoys: [
      'The parcel was scanned — the printer failed',
      'The parcel may or may not have been scanned at all',
      'Only scanned parcels ever carry a printed time',
    ],
    note: 'A missing then-part guarantees a missing if-part. This is the one valid move that runs backwards.',
  },
  {
    rule: 'If the choir rehearsed, the hall chairs are stacked.',
    fact: 'The hall chairs are stacked.',
    form: 'affirm-then',
    key: 'The choir may or may not have rehearsed today',
    decoys: [
      'The choir rehearsed — the stacking shows it',
      'The choir did not rehearse — someone else did',
      'Nobody but the choir ever stacks up those chairs',
    ],
    note: 'Stacked chairs are what the rule predicts, not what it requires. Anyone else could have stacked them.',
  },
  {
    rule: 'If a plant is in the shaded bed, it has a blue tag.',
    fact: 'This plant is not in the shaded bed.',
    form: 'deny-if',
    key: 'It might still have a blue tag — unsettled',
    decoys: [
      'It has no blue tag — the rule denies it',
      'It has a blue tag — every plant here does',
      'Blue tags are only ever given to shaded plants',
    ],
    note: 'Switching off the if-part switches off the rule, not the then-part.',
  },
  {
    rule: 'If the club van is booked, the key is off its hook.',
    fact: 'The club van is booked.',
    form: 'affirm-if',
    key: 'The key is off its hook — the rule says so',
    decoys: [
      'The key may or may not be on its hook now',
      'The key is on its hook — the rule allows it',
      'Only a booked van ever takes that key away',
    ],
    note: 'A rule plus its if-part gives you the then-part, and that is the whole move.',
  },
  {
    rule: 'If the alarm was armed, the panel shows a dot.',
    fact: 'The panel shows no dot.',
    form: 'deny-then',
    key: 'The alarm was not armed — the rule forces it',
    decoys: [
      'The alarm was armed — the panel is broken',
      'The alarm may or may not have been armed then',
      'Only an armed alarm ever puts a dot up there',
    ],
    note: 'A broken panel would attack the RULE, which is a different objection from attacking the reasoning.',
  },
  {
    rule: 'If the printer jammed, the counter skips a number.',
    fact: 'The counter skipped a number.',
    form: 'affirm-then',
    key: 'The printer may or may not have jammed',
    decoys: [
      'The printer jammed — the skip proves it',
      'The printer did not jam — the count is wrong',
      'Nothing but a jam can ever skip that counter',
    ],
    note: 'The rule guarantees a skip after a jam. It says nothing about what else can cause a skip.',
  },
  {
    rule: 'If a book is overdue, a slip goes in the file.',
    fact: 'This book is not overdue.',
    form: 'deny-if',
    key: 'A slip may still be in the file — unsettled',
    decoys: [
      'No slip is in the file — the rule says so',
      'A slip is in the file — the rule puts it there',
      'Slips only ever go in for overdue books',
    ],
    note: 'Slips can be filed for other reasons. The rule never promised otherwise.',
  },
]

const cdFollows = tpl(
  {
    id: 'i-cd-follows',
    name: 'What follows from the rule?',
    skillIds: ['i-conditional'],
    bucket: 'investigator',
    difficulty: 2,
    variants: 12,
    minutes: 2.5,
  },
  (rng, seed) => {
    const c = cycle(seed, COND_CASES)
    const valid = c.form === 'affirm-if' || c.form === 'deny-then'
    return {
      title: 'Follow the rule, no further',
      prompt: `Rule: **${c.rule}**\n\nFact: **${c.fact}**\n\nWhat follows?`,
      answer: mcq(rng, c.key, [...c.decoys]),
      hints: [
        'An if-then rule is a one-way street. It promises the then-part whenever the if-part holds, and promises nothing else at all.',
        'Two of the four moves are safe: switching the if-part ON, and switching the then-part OFF. The other two feel just as natural and prove nothing.',
        `Worked path: **${c.key}**.`,
      ],
      explanation:
        `**${c.key}.** ${c.note}\n\n` +
        (valid
          ? 'This one is safe, and the trap sits beside it: the same rule read backwards would not be. Being able to say WHICH direction you just used is the difference between following a rule and guessing with it.'
          : 'This is the tempting shape. The rule fits the facts perfectly well, which is exactly the problem — so does the opposite conclusion, and a rule that is consistent with two answers has not chosen between them. It feels like a conclusion because nothing contradicts it.'),
    }
  },
)

const FORM_NAMES: Record<CondForm, string> = {
  'affirm-if': 'Affirming the if-part — valid, it follows',
  'deny-then': 'Denying the then-part — valid, it follows',
  'affirm-then': 'Affirming the then-part — invalid, a trap',
  'deny-if': 'Denying the if-part — invalid, a trap too',
}

const FORM_NOTES: Record<CondForm, string> = {
  'affirm-if': 'The if-part is switched on, so the rule delivers the then-part.',
  'deny-then': 'The then-part is switched off, so the if-part cannot have been on.',
  'affirm-then': 'The then-part is switched on, which the rule never claimed only one thing could do.',
  'deny-if': 'The if-part is switched off, which switches off the rule rather than the then-part.',
}

const cdName = tpl(
  {
    id: 'i-cd-name',
    name: 'Name the move',
    skillIds: ['i-conditional'],
    bucket: 'investigator',
    difficulty: 3,
    variants: 12,
    minutes: 2.5,
  },
  (rng, seed) => {
    const c = cycle(seed + 5, COND_CASES)
    const forms: CondForm[] = ['affirm-if', 'deny-then', 'affirm-then', 'deny-if']
    return {
      title: 'Which of the four moves?',
      prompt:
        `Rule: **${c.rule}**\n\nSomeone observes: **${c.fact}**\n\n` +
        `Which of the four moves is that, and does it work?`,
      answer: mcq(
        rng,
        FORM_NAMES[c.form],
        forms.filter((f) => f !== c.form).map((f) => FORM_NAMES[f]),
      ),
      hints: [
        'Two questions, in order. First: is the observation about the if-part or the then-part? Second: is it switching that part on or off?',
        'Switching the if-part ON works. Switching the then-part OFF works. The other two combinations do not.',
        `Worked path: **${FORM_NAMES[c.form]}**.`,
      ],
      explanation:
        `**${FORM_NAMES[c.form]}** ${FORM_NOTES[c.form]}\n\n` +
        `The two invalid moves are the ones worth naming, because they are the ones that feel right. Both leave you with a story that fits every fact you have — and a story that fits is not the same as a story that was forced. Naming the move you just made is the quickest way to catch it, which is why this is worth practising as a label and not only as a verdict.`,
    }
  },
)

interface CheckCase {
  rule: string
  /** The two checks that could actually break the rule. */
  must: [string, string]
  /** The two that cannot. */
  cannot: [string, string]
  note: string
}

const CHECK_CASES: CheckCase[] = [
  {
    rule: 'Every parcel marked FRAGILE is packed in a padded box.',
    must: ['Open a parcel marked FRAGILE and see its box', 'Read the label on a parcel in a plain box'],
    cannot: ['Open a parcel with no mark and see its box', 'Read the label on a parcel in a padded box'],
    note: 'A fragile parcel in a plain box breaks it. A plain box with a fragile label breaks it. Nothing else can.',
  },
  {
    rule: 'Every member who booked the trip has paid a deposit.',
    must: ['Look up the payments of someone who booked', 'Look up the bookings of someone who never paid'],
    cannot: ['Look up the payments of someone who never booked', 'Look up the bookings of someone who has paid'],
    note: 'A booker with no deposit breaks it. A non-payer who booked breaks it. Payers and non-bookers cannot.',
  },
  {
    rule: 'Every recipe card with nuts in it carries a red dot.',
    must: ['Read the ingredients on a card with a red dot missing', 'Check the dot on a card whose recipe uses nuts'],
    cannot: ['Read the ingredients on a card that has a red dot', 'Check the dot on a card with no nuts in it'],
    note: 'A nut recipe without a dot breaks it, and a dotless card turning out to use nuts is the same failure seen from the other side.',
  },
  {
    rule: 'Every song on tonight has been rehearsed at least once.',
    must: ['Check the rehearsal log for a song on tonight', 'Check tonight for a song never rehearsed'],
    cannot: ['Check the rehearsal log for a song not on tonight', 'Check tonight for a song rehearsed twice'],
    note: 'A song on the list that was never rehearsed breaks it. Extra rehearsals of anything break nothing.',
  },
  {
    rule: 'Every box on the top shelf weighs under five kilos.',
    must: ['Weigh a box currently on the top shelf', 'Find where a box over five kilos is kept'],
    cannot: ['Weigh a box currently on the bottom shelf', 'Find where a box of two kilos is kept'],
    note: 'A heavy box on the top shelf is the only violation, and it can be found from either end.',
  },
  {
    rule: 'Every plant in the shaded bed carries a blue tag.',
    must: ['Look for a tag on a plant in the shaded bed', 'Look at where an untagged plant is growing'],
    cannot: ['Look for a tag on a plant in the sunny bed', 'Look at where a blue-tagged plant is growing'],
    note: 'A shaded plant without a tag breaks it. A tagged plant anywhere is allowed.',
  },
  {
    rule: 'Every message from the club account is signed with the club name.',
    must: ['Read the sign-off on a message from the club account', 'Check the sender of an unsigned message'],
    cannot: ['Read the sign-off on a message from a member account', 'Check the sender of a signed message'],
    note: 'A club message with no signature breaks it, and an unsigned message that came from the club account is the same case.',
  },
  {
    rule: 'Every bike returned late has a note in the file.',
    must: ['Search the file for a bike returned late', 'Check the return time of a bike with no note'],
    cannot: ['Search the file for a bike returned on time', 'Check the return time of a bike with a note'],
    note: 'A late return with no note breaks it. A note on an on-time return breaks nothing at all.',
  },
  {
    rule: 'Every drink sold after eight is in the evening log.',
    must: ['Search the evening log for a drink sold at nine', 'Check the sale time of a drink missing from the log'],
    cannot: ['Search the evening log for a drink sold at six', 'Check the sale time of a drink that is in the log'],
    note: 'A late sale missing from the log breaks it; an early sale recorded anyway breaks nothing.',
  },
  {
    rule: 'Every photo marked ARCHIVE has a date on the back.',
    must: ['Turn over a photo marked ARCHIVE', 'Look at the front of a photo with no date'],
    cannot: ['Turn over a photo with no marking on it', 'Look at the front of a photo carrying a date'],
    note: 'An archive photo with a blank back breaks it, and an undated photo marked ARCHIVE is the same failure.',
  },
]

const cdCheck = tpl(
  {
    id: 'i-cd-check',
    name: 'Which check actually tests it?',
    skillIds: ['i-conditional'],
    bucket: 'investigator',
    difficulty: 3,
    variants: 10,
    minutes: 3.5,
    transfer: true,
  },
  (rng, seed) => {
    const c = cycle(seed, CHECK_CASES)
    return {
      title: 'Two checks, not four',
      prompt:
        `A team has written down a rule they believe holds: **${c.rule}**\n\n` +
        `Four checks are possible. Select exactly the ones whose result could show the rule is FALSE.`,
      answer: multi(rng, [...c.must], [...c.cannot]),
      hints: [
        'Take each check in turn and ask what its two possible results would be. If neither result could break the rule, the check is decoration.',
        'A rule of the form "every A is B" can only be broken by an A that is not a B. So look at the As, and look at the not-Bs.',
        `Worked path: ${c.must.join(' and ')}.`,
      ],
      explanation:
        `**${c.must[0]}** and **${c.must[1]}**. ${c.note}\n\n` +
        `The check people almost always add is the one that looks at something already satisfying the then-part. It feels productive, because whatever comes back agrees with the rule — and that is exactly the reason it is worthless. A check that cannot come out badly is not a test.\n\n` +
        `The check people almost always skip is the second one on the list, because it means starting from a failure and working backwards. That is where the counterexample actually lives.`,
    }
  },
)

interface SameCase {
  rule: string
  contra: string
  converse: string
  inverse: string
  slip: string
}

const SAME_CASES: SameCase[] = [
  {
    rule: 'If a badge is red, the holder is a volunteer.',
    contra: 'Not a volunteer means the badge is not red',
    converse: 'Being a volunteer means the badge is red',
    inverse: 'A badge that is not red means not a volunteer',
    slip: 'A red badge means the holder is not a volunteer',
  },
  {
    rule: 'If a loaf is seeded, it is baked on the lower shelf.',
    contra: 'Not the lower shelf means the loaf is not seeded',
    converse: 'The lower shelf means the loaf is seeded',
    inverse: 'A loaf that is not seeded means not the lower shelf',
    slip: 'A seeded loaf means it is not on the lower shelf',
  },
  {
    rule: 'If a bike is hired out, its key is in the pouch.',
    contra: 'No key in the pouch means the bike is not hired out',
    converse: 'A key in the pouch means the bike is hired out',
    inverse: 'A bike not hired out means no key in the pouch',
    slip: 'A hired-out bike means no key is in the pouch',
  },
  {
    rule: 'If a room is booked, the door sign is turned round.',
    contra: 'A sign not turned means the room is not booked',
    converse: 'A turned sign means the room has been booked',
    inverse: 'A room not booked means the sign is not turned',
    slip: 'A booked room means the sign is not turned round',
  },
  {
    rule: 'If a plant is a fern, it is kept out of direct sun.',
    contra: 'Kept in direct sun means the plant is not a fern',
    converse: 'Being out of the sun means the plant is a fern',
    inverse: 'A plant that is not a fern is kept in direct sun',
    slip: 'Being a fern means the plant is kept in direct sun',
  },
  {
    rule: 'If a file is archived, its name begins with a year.',
    contra: 'A name without a year means the file is not archived',
    converse: 'A name with a year means the file is archived',
    inverse: 'A file not archived has no year in its name',
    slip: 'An archived file has no year at the start of its name',
  },
  {
    rule: 'If a match is postponed, the club sends a text.',
    contra: 'No text sent means the match was not postponed',
    converse: 'A text sent means the match has been postponed',
    inverse: 'A match not postponed means no text was sent',
    slip: 'A postponed match means no text is sent by the club',
  },
  {
    rule: 'If a jar is pickled, its lid is sealed with wax.',
    contra: 'A lid without wax means the jar is not pickled',
    converse: 'A waxed lid means the jar has been pickled',
    inverse: 'A jar that is not pickled has no wax on its lid',
    slip: 'A pickled jar means its lid is not sealed with wax',
  },
  {
    rule: 'If a ticket is a concession, it is printed in green.',
    contra: 'Not printed in green means it is not a concession',
    converse: 'Printed in green means it is a concession ticket',
    inverse: 'Not a concession means it is not printed in green',
    slip: 'A concession ticket means it is not printed in green',
  },
  {
    rule: 'If a van is loaded, its rear door is chained shut.',
    contra: 'An unchained rear door means the van is not loaded',
    converse: 'A chained rear door means the van has been loaded',
    inverse: 'A van that is not loaded has an unchained rear door',
    slip: 'A loaded van means its rear door is not chained shut',
  },
  {
    rule: 'If a lamp is on the sale table, it has a yellow sticker.',
    contra: 'No yellow sticker means it is not on the sale table',
    converse: 'A yellow sticker means it is on the sale table',
    inverse: 'Not on the sale table means it has no yellow sticker',
    slip: 'Being on the sale table means it has no yellow sticker',
  },
  {
    rule: 'If a boat is moored here, it carries a harbour pass.',
    contra: 'No harbour pass means the boat is not moored here',
    converse: 'A harbour pass means the boat is moored here',
    inverse: 'A boat not moored here carries no harbour pass',
    slip: 'A boat moored here carries no harbour pass at all',
  },
]

const cdSame = tpl(
  {
    id: 'i-cd-same',
    name: 'Which one says the same thing?',
    skillIds: ['i-conditional'],
    bucket: 'investigator',
    difficulty: 3,
    variants: 12,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, SAME_CASES)
    const noted = mcqNoted(rng, c.contra, [
      [c.converse, 'The rule read backwards. It is a different claim, and believing it is the commonest error there is.', 'inference'],
      [c.inverse, 'Both halves negated but the direction left alone — the backwards rule again, in disguise.', 'inference'],
      [c.slip, 'One negation applied to the wrong half, which contradicts the rule rather than restating it.', 'slip'],
    ])
    return {
      title: 'Same rule, different words',
      prompt: `Rule: **${c.rule}**\n\nWhich statement says exactly the same thing?`,
      ...noted,
      hints: [
        'There is exactly one rewrite that always means the same: flip the two halves AND negate both.',
        'Test any candidate by asking whether a case could satisfy the rule and break the candidate. If it could, they are not the same claim.',
        `Worked path: **${c.contra}**.`,
      ],
      explanation:
        `**${c.contra}.** Flip the two halves and negate both, and the meaning is untouched — if the then-part is missing, the if-part cannot have been there, because the rule would have produced it.\n\n` +
        `The tempting one is the plain reversal, and it is tempting because in ordinary speech an if-then usually IS meant both ways: "if you tidy up, you get pudding" is normally a promise that no tidying means no pudding. Written rules are not that generous, and reading one both ways is how a rule quietly gains a clause it never had.`,
    }
  },
)

// ===========================================================================
// i-fallacy — named ways an argument breaks
// ===========================================================================

/**
 * The closed taxonomy. These option strings are ENGINEERED to identical
 * character counts (49 each) so that no combination of key and decoys can leak
 * the answer through option length — the failure mode the audit's per-bucket
 * length gate exists to catch. Do not edit one without re-measuring it.
 */
const FAULTS = {
  begging: 'Begging the question — it restates what it proves',
  dilemma: 'False dilemma — only two options, when more exist',
  moderation: 'Fallacy of moderation — just split the difference',
  isought: 'Is-ought — what is the case sets what ought to be',
  composition: 'Composition — true of parts, so true of the whole',
  division: 'Division — true of the whole, so true of the part',
  adhominem: 'Ad hominem — attacks the person, not the argument',
  authority: 'Appeal to authority — an expert, just not in this',
  posthoc: 'Post hoc — it came after, so it must be the cause',
  hasty: 'Hasty generalisation — a few cases treated as all',
  straw: 'Straw man — answers a weaker version nobody holds',
  equivocation: 'Equivocation — one word doing two different tasks',
  popularity: 'Appeal to popularity — many say it, so it is true',
  slope: 'Slippery slope — one small step and then disaster',
  herring: 'Red herring — a true point about another question',
} as const

type FaultKey = keyof typeof FAULTS

interface FaultCase {
  argument: string
  key: FaultKey
  decoys: [FaultKey, FaultKey, FaultKey]
  why: string
  trap: string
}

const FAULT_CASES: FaultCase[] = [
  {
    argument: 'Our team lost the week after the new kit arrived, and lost again the week after that. The kit is why we are losing.',
    key: 'posthoc',
    decoys: ['hasty', 'herring', 'composition'],
    why: 'Two losses came after the kit, and that ordering is the entire argument.',
    trap: 'Hasty generalisation is close and worth ruling out deliberately: two cases is thin. But the flaw named here is not the number of cases, it is treating "afterwards" as "because of".',
  },
  {
    argument: 'I asked two people in my class and both said the test was easy, so the whole year found it easy.',
    key: 'hasty',
    decoys: ['posthoc', 'popularity', 'authority'],
    why: 'Two people are made to speak for a whole year group.',
    trap: 'Appeal to popularity is the tempting near-miss, since it also involves what people say. But nobody here is claiming the test is easy BECAUSE many say so — the claim is about how many were asked.',
  },
  {
    argument: 'You say the club should buy fewer new balls. So you want us to play with no equipment at all.',
    key: 'straw',
    decoys: ['herring', 'dilemma', 'adhominem'],
    why: 'A modest proposal is replaced by an extreme one that nobody made, and the extreme one is answered instead.',
    trap: 'False dilemma is close, because the reply does squeeze the options. The difference is that it puts words in the other person\'s mouth first, which is what makes it a straw man.',
  },
  {
    argument: 'Either we cancel the trip completely or we accept that somebody will be left behind.',
    key: 'dilemma',
    decoys: ['slope', 'moderation', 'begging'],
    why: 'Two options are presented as the only ones, when part-cancelling, rescheduling and fundraising all exist.',
    trap: 'Slippery slope also predicts something bad, but it predicts a CHAIN of consequences. This one simply deletes the middle options in a single move.',
  },
  {
    argument: 'This rule is fair because it treats everyone the way a fair rule would.',
    key: 'begging',
    decoys: ['equivocation', 'moderation', 'isought'],
    why: 'The reason offered is the conclusion, reworded.',
    trap: 'Equivocation is worth checking, because "fair" appears twice — but it means the same thing both times, which is precisely why the argument goes in a circle instead of shifting ground.',
  },
  {
    argument: 'One person wants the deadline on Friday and another wants it on the thirtieth, so the right answer is halfway between.',
    key: 'moderation',
    decoys: ['dilemma', 'begging', 'hasty'],
    why: 'The midpoint is treated as correct simply because it is the midpoint.',
    trap: 'Sometimes the middle IS right, which is what makes this so hard to spot. The fault is not the answer but the reasoning: no reason has been given except that it sits between two positions.',
  },
  {
    argument: 'Most people already ignore the sign-in sheet, so there is nothing wrong with ignoring it.',
    key: 'isought',
    decoys: ['popularity', 'hasty', 'herring'],
    why: 'What people do is turned straight into what people may do.',
    trap: 'Appeal to popularity is genuinely close. The tell is what the claim is about: popularity arguments say a claim is TRUE because many believe it; this one says an action is RIGHT because many do it.',
  },
  {
    argument: 'Every player in the squad is quick, so the squad will be a quick team.',
    key: 'composition',
    decoys: ['division', 'hasty', 'moderation'],
    why: 'A property of each part is assumed to carry to the whole, when a team also has to move together.',
    trap: 'Division is the mirror image and is the option most often picked by mistake. Check which way the argument travels: here it goes from parts to whole.',
  },
  {
    argument: 'This is the cheapest cafe in town, so the coffee here must be the cheapest cup you can buy.',
    key: 'division',
    decoys: ['composition', 'hasty', 'equivocation'],
    why: 'A property of the whole is pushed down onto one part, when a cheap place can still have one dear item.',
    trap: 'Composition is the mirror image. The direction is the test: this one goes from whole to part.',
  },
  {
    argument: 'You cannot take her budget plan seriously — she was late to every meeting last term.',
    key: 'adhominem',
    decoys: ['herring', 'authority', 'straw'],
    why: 'The plan is never examined; the person is.',
    trap: 'Red herring is close and often defensible as an answer, because lateness is indeed off the point. The stronger name is the specific one: the irrelevance is aimed at the arguer.',
  },
  {
    argument: 'A famous chemist says the new timetable will help us learn better, so it will.',
    key: 'authority',
    decoys: ['popularity', 'adhominem', 'hasty'],
    why: 'Real expertise, wrong field: chemistry is not evidence about timetables.',
    trap: 'This is not "experts are useless". An expert speaking inside their field is good evidence; the fault is borrowing standing from one field and spending it in another.',
  },
  {
    argument: 'Nearly everyone in the year has signed up for the app, so it must be the best one.',
    key: 'popularity',
    decoys: ['authority', 'hasty', 'begging'],
    why: 'Wide uptake is treated as proof of quality, when uptake follows whatever came first or was pushed hardest.',
    trap: 'Hasty generalisation is the near-miss: there is nothing thin about the sample here. The problem is not how many were counted, it is that counting them settles nothing about quality.',
  },
  {
    argument: 'A light lunch is healthy, and this cake is light, so this cake is healthy.',
    key: 'equivocation',
    decoys: ['composition', 'division', 'begging'],
    why: 'The word light shifts from "small" to "airy" between the two lines.',
    trap: 'The argument is valid in shape, which is what makes it convincing. Nothing is wrong with the logic; the word underneath it changed meaning halfway through.',
  },
  {
    argument: 'If we allow one class to eat outside, next it will be every class, and then nobody will eat indoors at all.',
    key: 'slope',
    decoys: ['dilemma', 'posthoc', 'herring'],
    why: 'A chain of steps is asserted with nothing offered to show each one follows from the last.',
    trap: 'Slopes are not always fallacies. If someone gives reasons why each step really does lead to the next, that is an argument. Here the steps are simply listed.',
  },
  {
    argument: 'People are asking whether the fee rise is fair. But look how much work the committee did this year.',
    key: 'herring',
    decoys: ['straw', 'adhominem', 'begging'],
    why: 'A true and pleasant fact is offered in place of an answer to the question actually asked.',
    trap: 'Straw man is the near-miss. The difference is that a straw man distorts the question before answering it, while this one leaves the question untouched and walks away from it.',
  },
]

const flName = tpl(
  {
    id: 'i-fl-name',
    name: 'Name the fault',
    skillIds: ['i-fallacy'],
    bucket: 'investigator',
    difficulty: 2,
    variants: 15,
    minutes: 2.5,
  },
  (rng, seed) => {
    const c = cycle(seed, FAULT_CASES)
    return {
      title: 'What broke here?',
      prompt: `Someone argues:\n\n"${c.argument}"\n\nWhich fault is that?`,
      answer: mcq(rng, FAULTS[c.key], c.decoys.map((d) => FAULTS[d])),
      hints: [
        'Separate the conclusion from the reason offered for it, and write both down before choosing.',
        'Then ask what the reason would have to be true for. If the conclusion could still be false with the reason intact, the gap between them is the fault.',
        `Worked path: **${FAULTS[c.key]}**.`,
      ],
      explanation: `**${FAULTS[c.key]}** ${c.why}\n\n${c.trap}\n\nNaming a fault is not a way of winning an argument. The conclusion here might still turn out to be true — what has been shown is that THIS reason does not establish it, which is a smaller and much more defensible claim.`,
    }
  },
)

interface StrawCase {
  claim: string
  straw: string
  fair: [string, string, string]
}

const STRAW_CASES: StrawCase[] = [
  {
    claim: 'The library should close an hour earlier on Fridays.',
    straw: 'So you think students should have nowhere to study.',
    fair: [
      'Friday evening use is the lowest of the week, so little is lost.',
      'The staff rota would take about a month to rewrite properly.',
      'Two nearby schools tried it and Thursday use rose instead.',
    ],
  },
  {
    claim: 'Players should attend at least two practices a week.',
    straw: 'So you would throw out anyone who ever misses one.',
    fair: [
      'Attendance last season averaged one and a half sessions a week.',
      'The hall is only free on Tuesdays, which limits how it could work.',
      'Teams that trained twice a week finished higher in the league.',
    ],
  },
  {
    claim: 'The club should charge a small fee for guest entry.',
    straw: 'So guests are no longer welcome at this club at all.',
    fair: [
      'Guest numbers doubled last year and the room is close to full.',
      'Collecting cash at the door needs someone there every session.',
      'The two clubs nearby charge, and their guest numbers held up.',
    ],
  },
  {
    claim: 'We should move the newsletter from paper to email.',
    straw: 'So anyone without a computer can be forgotten about.',
    fair: [
      'Printing and postage came to a third of last year is spending.',
      'About a fifth of members have never given us an email address.',
      'Email would let us send it weekly rather than once a month.',
    ],
  },
  {
    claim: 'Rehearsals should start ten minutes later on Thursdays.',
    straw: 'So punctuality no longer matters to you in any way.',
    fair: [
      'The bus from the north side does not arrive until quarter past.',
      'The hall booking ends at nine, so we would lose ten minutes.',
      'We tried a later start in spring and attendance was unchanged.',
    ],
  },
  {
    claim: 'The allotment should ban bonfires between May and August.',
    straw: 'So you want every plot holder policed all summer long.',
    fair: [
      'Most complaints last year fell in exactly those four months.',
      'Green waste collection only runs fortnightly in that period.',
      'Two neighbouring sites already do this and report fewer rows.',
    ],
  },
  {
    claim: 'The shop should stop stocking the least popular six lines.',
    straw: 'So the shop should only ever sell what is already popular.',
    fair: [
      'Those six lines together made under two percent of takings.',
      'Three of them are the only stock we carry for one supplier.',
      'Shelf space freed up would take the new bread range easily.',
    ],
  },
  {
    claim: 'Committee minutes should be published within a week.',
    straw: 'So you are accusing the committee of hiding things.',
    fair: [
      'Members currently wait about six weeks to read what was decided.',
      'The secretary writes them up on paper before typing anything.',
      'A week would mean approving them before the next meeting.',
    ],
  },
]

const flStraw = tpl(
  {
    id: 'i-fl-straw',
    name: 'Which reply is a straw man?',
    skillIds: ['i-fallacy'],
    bucket: 'investigator',
    difficulty: 3,
    variants: 8,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, STRAW_CASES)
    return {
      title: 'Answering what was said',
      prompt: `A proposal: **${c.claim}**\n\nFour replies follow. Which one answers a version of the proposal that was never made?`,
      answer: mcq(rng, c.straw, [...c.fair]),
      hints: [
        'Read each reply and ask what proposal it would be a good answer to. Then compare that with the proposal actually on the table.',
        'Disagreeing strongly is not a straw man. Replacing the proposal with a bigger one and defeating that is.',
        `Worked path: **${c.straw}**`,
      ],
      explanation:
        `**${c.straw}** The proposal was ${c.claim.charAt(0).toLowerCase()}${c.claim.slice(1).replace(/\.$/, '')} — a limited change. The reply answers something far larger that nobody proposed.\n\n` +
        `The other three all push back, and two of them are genuine objections. That is the thing to notice: disagreement is not the fault here. An objection engages with the size of the actual proposal; a straw man swaps it for one that is easier to knock down and then knocks it down.\n\n` +
        `It is also worth noticing how the swap happens. It usually arrives as "so you think", and the words after that phrase are almost always someone else is words.`,
    }
  },
)

interface IrrelevantCase {
  claim: string
  irrelevant: string
  relevant: [string, string, string]
  why: string
}

const IRRELEVANT_CASES: IrrelevantCase[] = [
  {
    claim: 'Moving the bus stop 200 metres down the road would cut the morning queue.',
    irrelevant: 'The bus company repainted its whole fleet dark green last year.',
    relevant: [
      'The queue at the present stop averages eleven minutes each morning.',
      'The proposed spot has a lay-by long enough to hold two buses.',
      'Forty-one of the sixty riders live nearer the proposed spot.',
    ],
    why: 'The colour of the buses cannot affect how long a queue takes to clear.',
  },
  {
    claim: 'The hall should be rewired before the winter concert season.',
    irrelevant: 'The hall was originally built as a grain store in the 1880s.',
    relevant: [
      'The main fuse tripped four times during last season is concerts.',
      'An electrician found cable insulation cracking in two circuits.',
      'Rewiring costs about a third more once the season has started.',
    ],
    why: 'The building is history is interesting and has no bearing on the wiring is condition.',
  },
  {
    claim: 'The club should switch its away matches to Sunday mornings.',
    irrelevant: 'The club is treasurer has held the post for eleven years.',
    relevant: [
      'Seven players work Saturday shifts and miss most away games.',
      'Two of the four away grounds are unavailable on Sundays.',
      'The league allows fixture moves with a fortnight is notice.',
    ],
    why: 'How long the treasurer has served says nothing about when matches should be played.',
  },
  {
    claim: 'The shop should open an hour earlier on market days.',
    irrelevant: 'The shop is awning was replaced by a local firm in April.',
    relevant: [
      'Market traders set up from six and buy supplies as they go.',
      'Staff would need an earlier bus, which runs only twice a week.',
      'A trial in September took ninety pounds in the extra hour.',
    ],
    why: 'Who replaced the awning has no connection to opening hours.',
  },
  {
    claim: 'The choir should hold auditions rather than take all comers.',
    irrelevant: 'The choir is founder also started a walking group nearby.',
    relevant: [
      'The soprano line has grown to twice the size of the bass line.',
      'Three members left last year saying rehearsals moved too slowly.',
      'The two festivals it enters both require balanced voice parts.',
    ],
    why: 'What the founder did elsewhere has no bearing on how members join now.',
  },
  {
    claim: 'The path across the field should be surfaced with gravel.',
    irrelevant: 'The field was used for a summer fair in each of the last two years.',
    relevant: [
      'The path is impassable after rain for roughly four months.',
      'Gravel would need edging boards to stop it spreading into the grass.',
      'A surfaced path elsewhere on the site has needed no work in six years.',
    ],
    why: 'Hosting a fair does not speak to whether the path needs surfacing.',
  },
  {
    claim: 'The newsletter should carry advertisements to cover its costs.',
    irrelevant: 'The newsletter has used the same typeface since it began.',
    relevant: [
      'Printing costs rose by a quarter over the last two years.',
      'Two local businesses have already asked about buying space.',
      'Members were surveyed and a majority said adverts were acceptable.',
    ],
    why: 'The typeface is unrelated to whether adverts should be sold.',
  },
  {
    claim: 'The society should meet monthly instead of fortnightly.',
    irrelevant: 'The society is meetings have always been held on a Tuesday.',
    relevant: [
      'Average attendance has fallen from twenty-two to nine this year.',
      'Speakers are hard to find at the rate of two a month.',
      'The room hire bill would halve, saving about four hundred a year.',
    ],
    why: 'Which day meetings fall on is a separate question from how often they happen.',
  },
  {
    claim: 'The garden should replace the lawn with a wildflower meadow.',
    irrelevant: 'The garden gate was rehung by two volunteers in the spring.',
    relevant: [
      'Mowing the lawn takes one volunteer four hours every fortnight.',
      'Meadow seed needs bare soil, so the turf must be lifted first.',
      'A meadow strip sown two years ago has needed cutting only once.',
    ],
    why: 'Work on the gate has nothing to do with what grows in the middle of the garden.',
  },
  {
    claim: 'The workshop should buy a second sewing machine.',
    irrelevant: 'The workshop shares its building with a pottery class.',
    relevant: [
      'Six people regularly wait for the one machine on Thursday evenings.',
      'A second-hand machine of the same model costs about ninety pounds.',
      'The bench beside the window is already wired and free to use.',
    ],
    why: 'Sharing a building with another class has no bearing on whether a second machine is needed.',
  },
]

const flIrrelevant = tpl(
  {
    id: 'i-fl-irrelevant',
    name: 'Which evidence is beside the point?',
    skillIds: ['i-fallacy'],
    bucket: 'investigator',
    difficulty: 2,
    variants: 10,
    minutes: 2.5,
  },
  (rng, seed) => {
    const c = cycle(seed, IRRELEVANT_CASES)
    return {
      title: 'The one that does no work',
      prompt: `Someone argues: **${c.claim}**\n\nFour facts are offered in support. Which one does nothing for the case?`,
      answer: mcq(rng, c.irrelevant, [...c.relevant]),
      hints: [
        'Take each fact and ask a single question: if this were false instead, would the case be any weaker?',
        'A fact can be perfectly true, and about the same subject, and still do no work at all.',
        `Worked path: **${c.irrelevant}**`,
      ],
      explanation:
        `**${c.irrelevant}** ${c.why}\n\n` +
        `The other three all bear on the case: change any one of them and the argument gets stronger or weaker. The irrelevant one can be true or false without moving anything, which is the test.\n\n` +
        `Beside-the-point facts are rarely put in to deceive. They are put in because they are true and available, and a list of true things feels like a stronger case than a short list of relevant ones. It is not — padding a case with facts that cannot move it hides how thin the rest of it is.`,
    }
  },
)

interface SortVariant {
  categories: [string, string, string]
  statements: { text: string; category: 0 | 1 | 2 }[]
  note: string
}

const SORT_VARIANTS: SortVariant[] = [
  {
    categories: ['Post hoc', 'Hasty generalisation', 'Straw man'],
    statements: [
      { text: 'We changed the warm-up and won the next two games, so the warm-up did it.', category: 0 },
      { text: 'The bus was late twice this week, so this route is always late.', category: 1 },
      { text: 'You want a later start, so you must want lessons cancelled.', category: 2 },
      { text: 'Sales rose the month after the new sign went up, so the sign works.', category: 0 },
      { text: 'Two of my friends liked the film, so it is popular with everyone.', category: 1 },
      { text: 'She asked for one more rehearsal, so she thinks we are hopeless.', category: 2 },
    ],
    note: 'Post hoc leans on the order of events; hasty generalisation leans on too few cases; a straw man answers something nobody said.',
  },
  {
    categories: ['False dilemma', 'Appeal to popularity', 'Ad hominem'],
    statements: [
      { text: 'Either we buy new nets or the club shuts down for good.', category: 0 },
      { text: 'Almost everyone in the year uses that revision site, so it works.', category: 1 },
      { text: 'His safety plan is worthless — he failed his own driving test.', category: 2 },
      { text: 'We hold the fair on Saturday, or we give up on fundraising.', category: 0 },
      { text: 'The petition already has 900 names, so the change is clearly right.', category: 1 },
      { text: 'You cannot trust her figures; she has never run a stall in her life.', category: 2 },
    ],
    note: 'A false dilemma deletes the middle options; an appeal to popularity counts heads; an ad hominem changes the subject to the person.',
  },
  {
    categories: ['Composition', 'Division', 'Slippery slope'],
    statements: [
      { text: 'Every musician in the group is excellent, so the group sounds excellent.', category: 0 },
      { text: 'This is the best-rated school around, so every lesson in it is best-rated.', category: 1 },
      { text: 'Let one class eat outside and soon nobody will eat indoors at all.', category: 2 },
      { text: 'Each ingredient here is cheap, so the finished dish must be cheap.', category: 0 },
      { text: 'That orchestra is famous, so its second oboe must be famous too.', category: 1 },
      { text: 'Allow one late hand-in and by December nothing will arrive on time.', category: 2 },
    ],
    note: 'Composition runs from parts to whole and division runs from whole to parts; the direction of travel is the whole test. A slippery slope asserts a chain without supporting any link.',
  },
  {
    categories: ['Begging the question', 'Equivocation', 'Red herring'],
    statements: [
      { text: 'The plan is sensible because a sensible person would choose it.', category: 0 },
      { text: 'A light lunch is healthy, and this cake is light, so the cake is healthy.', category: 1 },
      { text: 'You ask whether the fee is fair; look how hard the committee worked.', category: 2 },
      { text: 'This is the safest route because no safer route exists.', category: 0 },
      { text: 'Only man is rational, and no woman is a man, so no woman is rational.', category: 1 },
      { text: 'People query the timetable, but the caretakers have been marvellous.', category: 2 },
    ],
    note: 'Begging the question offers the conclusion as its own reason; equivocation lets one word change meaning mid-argument; a red herring answers a different question truthfully.',
  },
  {
    categories: ['Appeal to authority', 'Hasty generalisation', 'Is-ought'],
    statements: [
      { text: 'A well-known actor endorses this diet, so it must be sound nutrition.', category: 0 },
      { text: 'Three people I asked hated the new seating, so the school hates it.', category: 1 },
      { text: 'Most people already park on the grass, so parking there is fine.', category: 2 },
      { text: 'A famous novelist says the bridge design is unsafe, so it is unsafe.', category: 0 },
      { text: 'Both matches this month ran late, so this referee always runs late.', category: 1 },
      { text: 'Captains have always been picked this way, so this is how it should be.', category: 2 },
    ],
    note: 'A misused appeal to authority borrows standing from the wrong field; a hasty generalisation counts too few; an is-ought turns a description into a permission.',
  },
  {
    categories: ['Straw man', 'Post hoc', 'False dilemma'],
    statements: [
      { text: 'You suggest fewer trips, so you want the club to stop going anywhere.', category: 0 },
      { text: 'I started using the new pen and my marks went up, so the pen helped.', category: 1 },
      { text: 'Either the rota is scrapped or nobody gets a fair share of shifts.', category: 2 },
      { text: 'You asked for one quieter room, so you want the whole building silent.', category: 0 },
      { text: 'The boiler was serviced and broke a week later, so the service broke it.', category: 1 },
      { text: 'We either double the fee or close the trip to everyone.', category: 2 },
    ],
    note: 'A straw man enlarges what was said; post hoc reads a sequence as a cause; a false dilemma hides the options in between.',
  },
]

const flSort = tpl(
  {
    id: 'i-fl-sort',
    name: 'Sort the faults',
    skillIds: ['i-fallacy'],
    bucket: 'investigator',
    difficulty: 3,
    variants: 6,
    minutes: 4,
  },
  (rng, seed) => {
    const v = cycle(seed, SORT_VARIANTS)
    return {
      title: 'Three faults, six arguments',
      prompt:
        `Six short arguments. Each one goes wrong in one of three ways.\n\n` +
        `Put each into the fault it commits: **${v.categories.join('**, **')}**.`,
      answer: classify(rng, [...v.categories], v.statements.map((s) => ({ text: s.text, category: s.category }))),
      hints: [
        'Do the ones you are sure of first, and use them to sharpen what each label actually means before returning to the rest.',
        'For each argument, write the conclusion and the reason separately. The fault lives in the step between them, not in either half.',
        `Worked path: ${v.note}`,
      ],
      explanation:
        `${v.note}\n\n` +
        `Sorting is harder than naming one fault at a time, and it is harder for a useful reason: several of these labels overlap at the edges, so an argument can look like two of them until you say precisely what the step between reason and conclusion was. That is why the closed list matters. A vague sense that something is off is not a diagnosis, and cannot be argued with.\n\n` +
        `One honest limit: real arguments often break in more than one way at once, and a few break in ways no list covers. Naming the fault is a starting point for the conversation, not the end of it.`,
    }
  },
)

export const UNCERTAINTY_TEMPLATES: ItemTemplate[] = [
  // i-natfreq
  nfCount,
  nfPositive,
  nfNegative,
  nfShift,
  // i-refclass
  rcRate,
  rcClass,
  rcAdjust,
  rcOutside,
  // i-samplesize
  ssSwing,
  ssMargin,
  ssLeague,
  ssTwo,
  // i-diagnostic
  dgSplit,
  dgCommon,
  dgRatio,
  dgOrder,
  // i-conditional
  cdFollows,
  cdName,
  cdCheck,
  cdSame,
  // i-fallacy
  flName,
  flStraw,
  flIrrelevant,
  flSort,
]
