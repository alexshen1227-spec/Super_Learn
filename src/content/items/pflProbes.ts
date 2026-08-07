/**
 * Preparation-for-future-learning probes.
 *
 * Each one hands over a short, self-contained explanation of an idea the app
 * has never taught, then asks machine-graded questions about it immediately.
 * The measurement is how much of a NEW idea the learner picks up from a
 * resource — the thing a cold test cannot see (RESEARCH.md §23).
 *
 * Authoring rules, all of them load-bearing:
 *
 *  - THE RESOURCE MUST BE SUFFICIENT. Every graded checkpoint has to be
 *    answerable from the study text alone. A probe that needs outside
 *    knowledge measures prior knowledge, which is the thing this is supposed
 *    to be independent of. The audit checks that the resource is substantial;
 *    sufficiency itself is an authoring duty and is stated here so it is not
 *    quietly forgotten.
 *  - THE IDEA MUST BE GENUINELY NEW. These deliberately sit outside the skill
 *    tree's taught content — modular arithmetic, Simpson's paradox, Bayes
 *    factors as odds, big-O of a nested loop. If the app taught it, the probe
 *    would measure recall.
 *  - ANSWERS ARE COMPUTED. Same law as everywhere else: the generator derives
 *    them from its own values.
 *  - NEVER A RUNG. Enforced in the player, not here — see engine/pfl.ts.
 *
 * The `skillIds` on each probe name the skill it is a stepping stone TOWARD,
 * because the readout compares pick-up when that target's prerequisites were
 * already owned against when they were not. The probe does not teach that
 * skill and cannot advance it.
 */
import type { ItemTemplate } from '../../domain/types'
import { mcq, numeric, tpl } from '../lib'

const study = (s: string) => s

/** Modular arithmetic — never taught in the tree; reachable from integers. */
const clockArithmetic = tpl(
  {
    id: 'pfl-modular',
    name: 'New idea: clock arithmetic',
    skillIds: ['m-integers'],
    bucket: 'math',
    difficulty: 3,
    variants: 12,
    minutes: 4,
    kind: 'multi',
  },
  (rng, seed) => {
    const m = [5, 7, 9, 12][seed % 4]
    const a = 20 + ((seed * 7) % 40)
    const rem = a % m
    const big = 2 + (Math.floor(seed / 4) % 3)
    const powRem = Math.pow(big, 4) % m
    return {
      title: 'Learn it here, then use it',
      prompt: 'A short explanation of something this app has never taught you. Read it, then answer from it.',
      parts: [
        {
          study: study(
            // Blank lines between points on purpose: the rich-text renderer
            // starts a new paragraph on a blank line and keeps a single
            // newline inline, which ran the worked examples together.
            `**CLOCK ARITHMETIC (working "mod n")**\n\n` +
              `On a 12-hour clock, 15 o'clock is 3 o'clock: once you pass 12 you start again from 0. Mathematicians write this **15 mod 12 = 3**.\n\n` +
              `To compute **a mod n**: divide a by n and keep only the REMAINDER.\n\n` +
              `· 17 mod 5 = 2, because 17 = 3×5 + 2.\n\n` +
              `· 40 mod 7 = 5, because 40 = 5×7 + 5.\n\n` +
              `The remainder is always between 0 and n−1.\n\n` +
              `**A useful shortcut.** To find a big power mod n you may reduce at every step, instead of computing the whole number:\n\n` +
              `3⁴ mod 5 → 3×3 = 9, and 9 mod 5 = 4 → 4×3 = 12, and 12 mod 5 = 2 → 2×3 = 6, and 6 mod 5 = **1**.\n\n` +
              `You never had to know that 3⁴ = 81.`,
          ),
          studySeconds: 75,
          prompt: `Using the explanation: what is **${a} mod ${m}**?`,
          answer: numeric(rem),
          explanation: `${a} = ${Math.floor(a / m)}×${m} + ${rem}, so the remainder is **${rem}**. Remainders always land between 0 and ${m - 1}.`,
          hints: [
            `Divide ${a} by ${m} and keep what is left over.`,
            `${m} goes into ${a} exactly ${Math.floor(a / m)} times, with something left.`,
          ],
        },
        {
          prompt: `Now the shortcut: what is **${big}⁴ mod ${m}**?`,
          answer: numeric(powRem),
          explanation: `Reducing at each step keeps the numbers small: ${big}⁴ = ${Math.pow(big, 4)}, and ${Math.pow(big, 4)} = ${Math.floor(Math.pow(big, 4) / m)}×${m} + ${powRem}, so the answer is **${powRem}**.`,
          hints: [
            'Multiply by the base once at a time, taking the remainder after each step.',
            `You can also compute ${big}⁴ = ${Math.pow(big, 4)} and then reduce.`,
          ],
        },
        {
          prompt: 'What does the explanation say a remainder can never be?',
          answer: mcq(rng, `Equal to or larger than ${m}`, [
            'A number smaller than the thing being divided',
            'Zero, because something always remains',
            'An even number when the divisor is odd',
          ]),
          explanation: `The text says the remainder always sits between 0 and n−1, so it can never reach ${m}. Zero IS allowed — that is what happens when the division is exact.`,
          hints: ['Re-read the sentence about the range a remainder can take.', 'The range given is 0 to n−1 inclusive.'],
        },
      ],
      hints: ['Everything you need is in the explanation above.', 'Work one step at a time and keep the numbers small.'],
      explanation:
        'This is a preparation-for-future-learning probe: the point is not whether you already knew modular arithmetic — you were not taught it here — but how much of it you picked up from a short explanation. It is recorded separately from your skills and never changes a rung.',
    }
  },
)

/** Simpson's paradox — genuinely counterintuitive, fully explained in-text. */
const simpsonsParadox = tpl(
  {
    id: 'pfl-simpson',
    name: 'New idea: a reversing average',
    skillIds: ['s-corr'],
    bucket: 'science',
    difficulty: 4,
    variants: 6,
    minutes: 4,
    kind: 'multi',
  },
  (rng, seed) => {
    /*
     * Parameterised, not hardcoded — and that matters more here than in
     * ordinary content. A PFL probe re-served with the same numbers measures
     * whether the learner REMEMBERS it, which is the opposite of what this is
     * for. `pflProbes.test.ts` proves the paradox genuinely holds on every
     * seed rather than trusting the arithmetic to have been chosen carefully.
     *
     * The reversal needs A to win both groups while B wins the total, which
     * survives because the two clinics see opposite case mixes.
     */
    const aSmall = { n: 10, ok: 9 } // 90%
    const aBig = { n: 90, ok: 45 + (seed % 4) } // 50-53%
    const bSmall = { n: 90, ok: 70 + (Math.floor(seed / 4) % 4) } // ~78-81%
    const bBig = { n: 10, ok: 4 } // 40%
    const aRate = (aSmall.ok + aBig.ok) / (aSmall.n + aBig.n)
    const bRate = (bSmall.ok + bBig.ok) / (bSmall.n + bBig.n)
    const overallWinner = aRate > bRate ? 'A' : 'B'
    const groupWinner = 'A'
    const pct = (x: number) => `${Math.round(x * 100)}%`
    return {
      title: 'Learn it here, then use it',
      prompt: 'A short explanation of something this app has never taught you. Read it, then answer from it.',
      parts: [
        {
          study: study(
            `**WHEN THE OVERALL WINNER LOSES EVERY GROUP**\n\n` +
              `Two clinics treat easy cases and hard cases.\n\n` +
              `Clinic A: **${aSmall.ok}/${aSmall.n}** easy cases succeed (${pct(aSmall.ok / aSmall.n)}), and **${aBig.ok}/${aBig.n}** hard cases succeed (${pct(aBig.ok / aBig.n)}).\n\n` +
              `Clinic B: **${bSmall.ok}/${bSmall.n}** easy cases succeed (${pct(bSmall.ok / bSmall.n)}), and **${bBig.ok}/${bBig.n}** hard cases succeed (${pct(bBig.ok / bBig.n)}).\n\n` +
              `Clinic A wins on easy cases (${pct(aSmall.ok / aSmall.n)} vs ${pct(bSmall.ok / bSmall.n)}) AND on hard cases (${pct(aBig.ok / aBig.n)} vs ${pct(bBig.ok / bBig.n)}).\n\n` +
              `But add the columns up: A is ${aSmall.ok + aBig.ok}/${aSmall.n + aBig.n} = **${pct(aRate)}**, and B is ${bSmall.ok + bBig.ok}/${bSmall.n + bBig.n} = **${pct(bRate)}**.\n\n` +
              `B wins overall while losing both groups. This is called **Simpson's paradox**. It happens because the clinics saw different MIXES: clinic A took mostly hard cases, clinic B mostly easy ones. The totals are comparing different workloads, not different skill.`,
          ),
          studySeconds: 90,
          prompt: 'From the explanation: which clinic has the better rate in BOTH groups?',
          answer: mcq(rng, `Clinic ${groupWinner}`, ['Clinic B', 'They are equal in both groups', 'It cannot be worked out from these numbers']),
          explanation: `Clinic A wins easy (${pct(aSmall.ok / aSmall.n)} vs ${pct(bSmall.ok / bSmall.n)}) and hard (${pct(aBig.ok / aBig.n)} vs ${pct(bBig.ok / bBig.n)}) — both groups.`,
          hints: ['Compare the two clinics one group at a time.', 'Do the easy row first, then the hard row.'],
        },
        {
          prompt: 'And which clinic has the better rate when you combine both groups?',
          answer: mcq(rng, `Clinic ${overallWinner === 'A' ? 'A' : 'B'}`, [
            `Clinic ${overallWinner === 'A' ? 'B' : 'A'}`,
            'They are exactly equal overall',
            'Combining the groups is not mathematically allowed',
          ]),
          explanation: `Combined, A is ${pct(aRate)} and B is ${pct(bRate)}, so **${overallWinner}** wins overall — the reverse of the group-by-group result.`,
          hints: ['Add the successes, add the totals, then divide.', `A: ${aSmall.ok + aBig.ok}/${aSmall.n + aBig.n}. B: ${bSmall.ok + bBig.ok}/${bSmall.n + bBig.n}.`],
        },
        {
          prompt: 'The explanation gives a reason this reversal happens. What is it?',
          answer: mcq(rng, 'The two clinics handled very different mixes of easy and hard cases', [
            'One clinic simply recorded its results dishonestly',
            'The sample sizes were too small for any comparison to hold',
            'Percentages cannot be added together in any circumstance',
          ]),
          explanation:
            'The text names the mix: clinic A took mostly hard cases, clinic B mostly easy ones, so the totals compare workloads rather than skill. Nothing about the numbers is dishonest or too small.',
          hints: ['Re-read the final paragraph.', 'Look at how many easy versus hard cases each clinic saw.'],
        },
      ],
      hints: ['Everything needed is in the explanation.', 'Do each group separately before combining.'],
      explanation:
        'A preparation-for-future-learning probe. It measures how much of an unfamiliar idea you took from a short explanation — not what you already knew. Recorded separately from your skills; it never moves a rung.',
    }
  },
)

/**
 * Pigeonhole — guarantees existence without ever naming the box. Absent from
 * the tree (verified by grep over the rendered bank); reachable from integers.
 */
const pigeonhole = tpl(
  {
    id: 'pfl-pigeonhole',
    name: 'New idea: the pigeonhole principle',
    skillIds: ['m-proof'],
    bucket: 'math',
    difficulty: 3,
    variants: 12,
    minutes: 4,
    kind: 'multi',
  },
  (rng, seed) => {
    const colours = [3, 4, 5, 6][seed % 4]
    const want = [2, 3, 4][Math.floor(seed / 4) % 3]
    // Worst case: (want-1) of every colour, then one more forces a match.
    const socks = colours * (want - 1) + 1
    const people = 30 + ((seed * 7) % 25)
    const months = 12
    const guaranteed = Math.ceil(people / months)
    return {
      title: 'Learn it here, then use it',
      prompt: 'A short explanation of something this app has never taught you. Read it, then answer from it.',
      parts: [
        {
          study: study(
            `**THE PIGEONHOLE PRINCIPLE**\n\n` +
              `Put more items than boxes, and some box must hold more than one. That is the whole idea, and it is obvious — but it proves things that are not.\n\n` +
              `**The basic form.** If **n + 1** items go into **n** boxes, at least one box holds at least **2**.\n\n` +
              `· 13 people, 12 birth months → at least two share a month. You cannot say WHICH month, and you do not need to.\n\n` +
              `**The general form.** To force some box to hold **k** items, you need **n × (k − 1) + 1** items across n boxes. The reasoning is the worst case: fill every box with k − 1 items — that is as far as you can get without any box reaching k — then one more item has nowhere safe to go.\n\n` +
              `· 4 suits, want 3 of one suit → 4 × 2 + 1 = 9 cards guarantees it.\n\n` +
              `**Averaging form.** With m items in n boxes, some box holds at least **m ÷ n, rounded up**.\n\n` +
              `The principle only ever promises that such a box EXISTS. It never identifies it, and it says nothing about the likely case — only the guaranteed one.`,
          ),
          studySeconds: 85,
          prompt: `Using the general form: a drawer holds socks in **${colours}** colours, mixed up in the dark. How many socks must you take to GUARANTEE **${want}** of the same colour?`,
          answer: numeric(socks, { tolerance: 0 }),
          explanation: `Worst case first: you could draw ${want - 1} of every colour — that is ${colours} × ${want - 1} = ${colours * (want - 1)} socks — and still not have ${want} alike. One more sock must match something, so **${socks}**.`,
          hints: [
            `Use n × (k − 1) + 1 with n = ${colours} boxes and k = ${want}.`,
            `Imagine the unluckiest possible draw: ${want - 1} of each colour, and then one more.`,
          ],
        },
        {
          prompt: `Now the averaging form: **${people}** people, **${months}** birth months. At least how many must share a single month?`,
          answer: numeric(guaranteed, { tolerance: 0 }),
          explanation: `${people} ÷ ${months} = ${(people / months).toFixed(2)}, rounded up is **${guaranteed}**. Spreading people as evenly as possible still leaves one month with ${guaranteed}.`,
          hints: [
            `Divide ${people} by ${months} and round UP.`,
            'Think about spreading them as evenly as you can — the fullest month is what you want.',
          ],
        },
        {
          prompt: 'The explanation is careful about one limit of the principle. Which is it?',
          answer: mcq(rng, 'It proves such a box exists but never says which one', [
            'It only works when the number of boxes is even',
            'It tells you which box is fullest, but not by how much',
            'It gives the most likely outcome rather than a guarantee',
          ]),
          explanation:
            'The last paragraph says it exactly: the principle promises existence, not identity, and it is about the guaranteed case rather than the likely one.',
          hints: ['Re-read the closing paragraph.', 'Notice what the birthday example says you cannot name.'],
        },
      ],
      hints: ['Everything you need is in the explanation.', 'Work out the unluckiest case first.'],
      explanation:
        'A preparation-for-future-learning probe: how much of a new idea did a short explanation buy you? Recorded apart from your skills, and it never changes a rung.',
    }
  },
)

/**
 * Regression to the mean — the trap that makes praise look harmful and
 * punishment look effective. Absent from the tree; hosted on measurement
 * reliability, where it actually belongs.
 */
const regressionToMean = tpl(
  {
    id: 'pfl-regression',
    name: 'New idea: why extremes come back',
    skillIds: ['s-measure'],
    bucket: 'science',
    difficulty: 4,
    variants: 8,
    minutes: 4,
    kind: 'multi',
  },
  (rng, seed) => {
    const mean = 60 + ((seed % 4) * 5)
    const gap = 16 + (Math.floor(seed / 4) % 2) * 8
    const top = mean + gap
    // The resource states the premise explicitly: half of an all-luck gap
    // persists. That makes the arithmetic defined rather than an empirical claim.
    const expected = mean + gap / 2
    return {
      title: 'Learn it here, then use it',
      prompt: 'A short explanation of something this app has never taught you. Read it, then answer from it.',
      parts: [
        {
          study: study(
            `**WHY EXTREME RESULTS DRIFT BACK**\n\n` +
              `Suppose a score is part real ability and part luck — a good night's sleep, an easy question set, a lucky guess.\n\n` +
              `Now pick out the people who scored HIGHEST. You have selected two things at once: people who are genuinely good, AND people who got lucky. Their ability shows up again next time. Their luck does not.\n\n` +
              `So the group's second score lands **closer to the average** than their first — with no coaching, no change, nothing done to them at all. Pick the LOWEST scorers and the same thing happens upward.\n\n` +
              `This is called **regression to the mean**, and it sets a trap. Praise your best performers and they get worse; criticise your worst and they improve. It looks like praise hurts and criticism works. Both groups simply drifted back toward the middle, exactly as they would have with silence.\n\n` +
              `**A rule of thumb for this exercise:** if a measure is about half ability and half luck, expect about **half of the gap** between an extreme group and the average to remain next time.\n\n` +
              `The size of the drift depends on how much luck the measure carries. A perfectly reliable measure has no luck and shows no drift.`,
          ),
          studySeconds: 90,
          prompt: `A test averages **${mean}**. A group scores **${top}** on it. Using the rule of thumb, what is their expected average on a retest — with nothing done to them in between?`,
          answer: numeric(expected, { tolerance: 0 }),
          explanation: `The gap is ${top} − ${mean} = ${gap}. About half of it remains, so expect ${mean} + ${gap / 2} = **${expected}**. They "got worse" without anything happening to them.`,
          hints: [
            `Find the gap between ${top} and the average ${mean}, then keep half of it.`,
            `Half of ${gap} is ${gap / 2}. Add that to ${mean}.`,
          ],
        },
        {
          prompt: 'A coach praises the top scorers and criticises the bottom ones. Next test, the praised group drops and the criticised group rises. What does the explanation say is going on?',
          answer: mcq(rng, 'Both groups drifted toward the average, which would have happened anyway', [
            'Praise genuinely harms performance and criticism genuinely helps it',
            'The second test must have been unfairly marked',
            'The praised group stopped trying because they felt safe',
          ]),
          explanation:
            'This is the trap named in the text. Selecting an extreme group selects for luck as well as ability, and the luck does not repeat. The coach is reading a drift back to the middle as an effect of their own actions.',
          hints: ['Re-read the paragraph about the trap.', 'Ask what would have happened if the coach had said nothing.'],
        },
        {
          prompt: 'According to the explanation, when would you expect NO drift at all?',
          answer: mcq(rng, 'When the measure carries no luck — it is perfectly reliable', [
            'When the group is large enough for averages to settle',
            'When the same people are tested on the very same day',
            'When the first scores were below average rather than above',
          ]),
          explanation:
            'The final line makes this exact point: the drift comes from the luck component, so a measure with no luck in it shows no regression.',
          hints: ['Re-read the final sentence.', 'The drift is caused by one specific ingredient of the score.'],
        },
      ],
      hints: ['Everything you need is in the explanation.', 'Separate the part of a score that repeats from the part that does not.'],
      explanation:
        'A preparation-for-future-learning probe: how much of a new idea did a short explanation buy you? Recorded apart from your skills, and it never changes a rung.',
    }
  },
)

/**
 * The handshake lemma — counting the same thing two ways. Absent from the tree
 * (no graph theory anywhere); deliberately worded as dots and links so it does
 * not collide with motion graphs or data graphs.
 */
const networkDegrees = tpl(
  {
    id: 'pfl-network',
    name: 'New idea: counting links two ways',
    skillIds: ['m-counting'],
    bucket: 'math',
    difficulty: 3,
    variants: 12,
    minutes: 4,
    kind: 'multi',
  },
  (rng, seed) => {
    /*
     * Every degree list here must describe a network that can ACTUALLY be
     * built, because part three teaches the learner to tell possible lists
     * from impossible ones. Showing an impossible one as an ordinary example
     * would teach the opposite of the lesson.
     *
     * An earlier version added a varying bump to the first degree, which
     * pushed that degree above n − 1 and produced four impossible lists out of
     * twelve. Variants now come from pairing a verified list with the party
     * size — lcm(4, 6) = 12 distinct combinations — and `pflProbes.test.ts`
     * re-checks realisability with Erdős–Gallai on every seed.
     */
    const degrees = [[2, 2, 3, 3], [1, 2, 2, 3, 4], [2, 3, 3, 4, 4, 2], [1, 1, 2, 2, 3, 3]][seed % 4]
    const sum = degrees.reduce((a, b) => a + b, 0)
    const links = sum / 2
    const party = 5 + (seed % 6)
    const allPairs = (party * (party - 1)) / 2
    return {
      title: 'Learn it here, then use it',
      prompt: 'A short explanation of something this app has never taught you. Read it, then answer from it.',
      parts: [
        {
          study: study(
            `**COUNTING THE SAME THING TWO WAYS**\n\n` +
              `Draw some dots and join some pairs of them with links. Each dot's **degree** is the number of links touching it.\n\n` +
              `Now add up every dot's degree. Every link has two ends, so each link gets counted exactly **twice** — once at each end.\n\n` +
              `**Sum of all degrees = 2 × (number of links).**\n\n` +
              `· Degrees 1, 1, 2, 2 add to 6, so there are 3 links.\n\n` +
              `Two consequences follow immediately, and neither needs a drawing:\n\n` +
              `· The sum of the degrees is **always even**. A list of degrees adding to an odd number describes something that cannot be built.\n\n` +
              `· The number of dots with an ODD degree is always even. Odd numbers must pair up to reach an even total.\n\n` +
              `If everyone links to everyone else, each of n dots has degree n − 1, so the sum is n(n − 1) and the number of links is **n(n − 1) ÷ 2**.`,
          ),
          studySeconds: 85,
          prompt: `A network has dots with degrees **${degrees.join(', ')}**. How many links does it have?`,
          answer: numeric(links, { tolerance: 0 }),
          explanation: `The degrees add to ${sum}. Every link is counted twice, so there are ${sum} ÷ 2 = **${links}** links.`,
          hints: ['Add all the degrees, then halve the total.', `The degrees sum to ${sum}.`],
        },
        {
          prompt: `**${party}** people are at a party and every person shakes hands with every other person exactly once. How many handshakes happen?`,
          answer: numeric(allPairs, { tolerance: 0 }),
          explanation: `Each of the ${party} people shakes ${party - 1} hands, giving ${party} × ${party - 1} = ${party * (party - 1)} ends. Each handshake has two ends, so there are ${allPairs} handshakes.`,
          hints: [
            `The text gives the formula n(n − 1) ÷ 2 with n = ${party}.`,
            `${party} × ${party - 1} = ${party * (party - 1)}, then halve it.`,
          ],
        },
        {
          prompt: 'Someone claims a network has dots of degree 1, 2 and 2. What does the explanation let you say?',
          answer: mcq(rng, 'It cannot exist, because the degrees add to an odd number', [
            'It exists and has exactly 5 links',
            'It exists, but only if two of the dots are joined twice',
            'Nothing — degree lists never determine whether a network is possible',
          ]),
          explanation:
            '1 + 2 + 2 = 5, which is odd. The text says the degree sum is always even because every link is counted twice, so no such network can be built.',
          hints: ['Add the degrees and check the rule about even totals.', 'The text says an odd total describes something unbuildable.'],
        },
      ],
      hints: ['Everything you need is in the explanation.', 'Remember every link gets counted at both ends.'],
      explanation:
        'A preparation-for-future-learning probe: how much of a new idea did a short explanation buy you? Recorded apart from your skills, and it never changes a rung.',
    }
  },
)

/**
 * Benford's law — leading digits are not uniform. Absent from the tree, and a
 * genuine tool for questioning a dataset, which is what s-sources is about.
 */
const leadingDigits = tpl(
  {
    id: 'pfl-benford',
    name: 'New idea: the first-digit rule',
    skillIds: ['s-sources'],
    bucket: 'science',
    difficulty: 4,
    variants: 8,
    minutes: 4,
    kind: 'multi',
  },
  (rng, seed) => {
    const d = 2 + (seed % 8) // 2..9 — the digit the learner computes for
    const pct = Math.round(100 * Math.log10(1 + 1 / d))
    const onePct = Math.round(100 * Math.log10(2)) // 30
    return {
      title: 'Learn it here, then use it',
      prompt: 'A short explanation of something this app has never taught you. Read it, then answer from it.',
      parts: [
        {
          study: study(
            `**THE FIRST-DIGIT RULE**\n\n` +
              `Take a big pile of real-world numbers that spans many sizes — river lengths, town populations, invoice totals. Look only at the FIRST digit of each.\n\n` +
              `You might expect each of 1-9 to turn up about 11% of the time. They do not. **1** turns up about **30%** of the time, and the frequency falls away steadily to about 5% for **9**.\n\n` +
              `The reason is that such data grows by multiplying rather than adding. A quantity growing steadily spends far longer between 100 and 200 — a 100% climb — than between 900 and 1000, an 11% climb. It lingers on a leading 1.\n\n` +
              `The frequency of leading digit **d** is **log₁₀(1 + 1 ÷ d)**, as a fraction. For d = 1 that is log₁₀(2) ≈ 0.30.\n\n` +
              `Because people inventing numbers tend to spread first digits evenly, auditors use this as a **flag**: a real-looking dataset with a flat first-digit spread is worth a closer look.\n\n` +
              `It is only a flag. The rule needs data spanning several orders of magnitude, and it fails on things like human heights or numbers with an imposed floor or ceiling.`,
          ),
          studySeconds: 90,
          prompt: `Using the formula in the explanation: about what percentage of numbers begin with the digit **${d}**? Give a whole number.`,
          answer: numeric(pct, { tolerance: 1 }),
          explanation: `log₁₀(1 + 1/${d}) = log₁₀(${(1 + 1 / d).toFixed(3)}) ≈ ${(Math.log10(1 + 1 / d)).toFixed(3)}, which is about **${pct}%**. Compare that with the ${onePct}% for a leading 1.`,
          hints: [
            `Put d = ${d} into log₁₀(1 + 1 ÷ d), then turn the fraction into a percentage.`,
            `1 + 1/${d} = ${(1 + 1 / d).toFixed(3)}.`,
          ],
        },
        {
          prompt: 'The explanation gives a REASON the rule holds. Which is it?',
          answer: mcq(rng, 'Such data grows by multiplying, so it lingers longer on a leading 1', [
            'Small digits are easier to write, so they get recorded more often',
            'Most real-world measurements are rounded down to the nearest unit',
            'There are simply more numbers beginning with 1 than with any other digit',
          ]),
          explanation:
            'The text explains it through growth: climbing from 100 to 200 is a 100% increase, while 900 to 1000 is only 11%, so a steadily growing quantity spends much longer showing a leading 1.',
          hints: ['Re-read the paragraph comparing 100→200 with 900→1000.', 'The reason is about how the data grows.'],
        },
        {
          prompt: 'A dataset shows a flat spread of first digits. What does the explanation license you to conclude?',
          answer: mcq(rng, 'It is worth a closer look — the rule is a flag, not proof', [
            'The data has certainly been fabricated',
            'Nothing at all, since the rule applies to every dataset equally',
            'The data must have been rounded, which caused the flat spread',
          ]),
          explanation:
            'The closing paragraph is deliberate about this: it is a flag rather than proof, it needs data spanning several orders of magnitude, and it fails on bounded quantities like human heights.',
          hints: ['Re-read the final paragraph.', 'Notice the word the text chooses instead of "proof".'],
        },
      ],
      hints: ['Everything you need is in the explanation.', 'The formula is stated in the text — you do not need to recall it.'],
      explanation:
        'A preparation-for-future-learning probe: how much of a new idea did a short explanation buy you? Recorded apart from your skills, and it never changes a rung.',
    }
  },
)

/**
 * Six distinct ideas, against a readout that needs four probes. That headroom
 * is the point: with only three, reaching the threshold forced a repeat, and a
 * repeated probe measures memory rather than pick-up. `retiredGrowthRates` is
 * deliberately absent — see its comment.
 */
export const PFL_TEMPLATES: ItemTemplate[] = [
  clockArithmetic,
  simpsonsParadox,
  pigeonhole,
  regressionToMean,
  networkDegrees,
  leadingDigits,
]
