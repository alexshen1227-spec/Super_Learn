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

/** Growth rates — reachable from loops, never taught as complexity theory. */
const growthRates = tpl(
  {
    id: 'pfl-growth',
    name: 'New idea: how work grows',
    skillIds: ['c-algo'],
    bucket: 'coding',
    difficulty: 4,
    variants: 4,
    minutes: 4,
    kind: 'multi',
  },
  (rng, seed) => {
    const n = [10, 20, 50, 100][seed % 4]
    const doubled = n * 2
    const linear = doubled
    const quadratic = doubled * doubled
    const quadStart = n * n
    return {
      title: 'Learn it here, then use it',
      prompt: 'A short explanation of something this app has never taught you. Read it, then answer from it.',
      parts: [
        {
          study: study(
            `**HOW THE WORK GROWS WHEN THE DATA GROWS**\n\n` +
              `Programmers describe an algorithm by how its work grows with the size of the input, written **n**.\n\n` +
              `· A single pass over the list does about **n** steps. Doubling n doubles the work.\n\n` +
              `· A loop inside a loop, each running over the whole list, does about **n × n = n²** steps. Doubling n makes the work **four times** bigger, because (2n)² = 4n².\n\n` +
              `· Repeatedly halving the list does about **log₂ n** steps — 1024 items takes only about 10.\n\n` +
              `The point is not the exact count. It is the SHAPE: as n grows, an n² method falls behind an n method no matter how fast each individual step is, because a constant speed-up is a fixed multiplier while the gap between n and n² keeps widening.`,
          ),
          studySeconds: 80,
          prompt: `From the explanation: a single-pass method does about ${n} steps on ${n} items. About how many steps on **${doubled}** items?`,
          answer: numeric(linear, { tolerance: 0 }),
          explanation: `A single pass grows in step with n, so doubling ${n} to ${doubled} gives about **${linear}** steps.`,
          hints: ['The text says doubling n doubles the work for a single pass.', `Double ${n}.`],
        },
        {
          prompt: `A nested-loop method does about ${quadStart} steps on ${n} items. About how many on **${doubled}** items?`,
          answer: numeric(quadratic, { tolerance: 0 }),
          explanation: `Nested loops grow as n², and (2n)² = 4n², so the work goes up four times: ${quadStart} × 4 = **${quadratic}**.`,
          hints: ['The text says doubling n makes n² work four times bigger.', `Multiply ${quadStart} by 4.`],
        },
        {
          prompt: 'The explanation says a faster individual step cannot rescue an n² method at large n. Why not?',
          answer: mcq(rng, 'A speed-up is a fixed multiplier, while the gap between n and n² keeps widening', [
            'Because n² methods always contain a bug that slows them down',
            'Because faster steps make the number of steps go up to compensate',
            'Because n² only applies to lists that are already sorted',
          ]),
          explanation:
            'The last paragraph makes exactly this point: a constant factor multiplies the work by a fixed amount once, while the difference between n and n² grows without limit as n grows.',
          hints: ['Re-read the final paragraph.', 'Compare something that multiplies once against something that keeps growing.'],
        },
      ],
      hints: ['Everything needed is in the explanation.', 'Watch whether the rule says double or quadruple.'],
      explanation:
        'A preparation-for-future-learning probe: how much of a new idea did a short explanation buy you? Recorded apart from your skills, and it never changes a rung.',
    }
  },
)

export const PFL_TEMPLATES: ItemTemplate[] = [clockArithmetic, simpsonsParadox, growthRates]
