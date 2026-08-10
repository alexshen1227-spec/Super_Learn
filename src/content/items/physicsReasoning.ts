/**
 * Physics tasks that cannot be answered by plugging numbers into a formula.
 *
 * ## Why this file exists
 *
 * Measured: physics was the thinnest bucket in the bank — a median of two
 * question families per skill, with six of eleven skills sitting at exactly the
 * two that Independent requires. And almost every existing family is a
 * compute-the-quantity item (`p-speed`, `p-acceleration`, `p-fma`, `p-work`,
 * `p-momentum`, `p-density`, `p-ohm`). A learner can hold all of them and still
 * not be able to say which of two carts is harder to stop.
 *
 * ## Where the formats come from
 *
 * TIPERs (Hieggelke, Kanim, Maloney & O'Kuma) is a published taxonomy of ten
 * short physics task formats — Ranking, Working Backwards, "What, if Anything,
 * is Wrong", Conflicting Contentions, Changing Representation, Troubleshooting,
 * Comparison, Bar Chart, Linked Multiple-Choice, Qualitative Reasoning — each
 * deliberately engineered so the item cannot be answered by substituting into
 * an equation, and each sized to a few minutes and independent of the others.
 * Item independence is exactly what an item-level scheduler needs, so the
 * taxonomy drops straight into this app's model.
 *
 * **Tier: HEURISTIC, and deliberately so.** PhysPort's own research-validation
 * rubric rates TIPERs at its LOWEST level — "based on research into" only, with
 * no "demonstrated to improve" or "studied using" entries, which does not reach
 * even their Bronze tier. What is adopted here is the FORMAT taxonomy as a
 * design vocabulary, not a claim that these formats are validated to teach
 * better. The items, numbers, scenarios and answers are all original and
 * computed; nothing is reproduced from the TIPERs banks, which are commercial.
 * See docs/RESEARCH.md §30.
 *
 * ## The anti-gaming rule, taken from the taxonomy
 *
 * "What, if Anything, is Wrong" tasks are distinguished from Troubleshooting
 * tasks precisely by admitting the answer "nothing is wrong". A bank where
 * every fault-finding item contains a fault teaches a meta-strategy — always
 * name something — rather than the skill. `p-whats-wrong` below is generated
 * clean about a third of the time, and the content audit's own long-standing
 * discipline (a derived answer must be re-derivable) is what keeps that honest.
 */
import type { ErrorTag, ItemTemplate } from '../../domain/types'
import { rint } from '../../engine/rng'
import { cycle, mcqNoted, numeric, round, tpl } from '../lib'

/* ------------------------------------------------------------------ ranking */

/**
 * RANKING TASK — order four carts by how hard each is to stop.
 *
 * Momentum is the classic place where "bigger" and "faster" compete, and a
 * ranking exposes whether the learner is combining the two or following
 * whichever is more salient. Masses and speeds are chosen so that the momentum
 * order disagrees with BOTH the mass order and the speed order — otherwise a
 * learner who ranks by mass alone scores full marks on a momentum item.
 */
const momentumRank = tpl(
  {
    id: 'p-momentum-rank',
    name: 'Rank by momentum',
    skillIds: ['p-momentum'],
    bucket: 'physics',
    difficulty: 3,
    variants: 10,
    minutes: 3,
    calibration: true,
  },
  (rng) => {
    const labels = ['Cart W', 'Cart X', 'Cart Y', 'Cart Z']
    let carts: { label: string; m: number; v: number; p: number }[] = []
    /*
     * Re-draw until the winner is NEITHER the heaviest nor the fastest cart,
     * every momentum is distinct, and the momentum order matches neither
     * single-column order.
     *
     * The winner condition is the one that matters and it was learned the hard
     * way: an earlier version only required the ORDERS to differ, which they
     * can do at positions two and three while the heaviest cart still tops the
     * momentum list — and then the explanation's own sentence ("the heaviest is
     * W … but the largest momentum belongs to W") contradicted itself on a real
     * render. Guaranteeing it in the generator is better than hedging the prose.
     */
    for (let attempt = 0; attempt < 400; attempt++) {
      carts = labels.map((label) => {
        const m = rint(rng, 2, 9)
        const v = rint(rng, 2, 9)
        return { label, m, v, p: m * v }
      })
      const ps = carts.map((c) => c.p)
      if (new Set(ps).size !== 4) continue
      if (new Set(carts.map((c) => c.m)).size !== 4) continue
      if (new Set(carts.map((c) => c.v)).size !== 4) continue
      const top = [...carts].sort((a, b) => b.p - a.p)[0]
      const heavy = [...carts].sort((a, b) => b.m - a.m)[0]
      const quick = [...carts].sort((a, b) => b.v - a.v)[0]
      if (top.label === heavy.label || top.label === quick.label) continue
      break
    }
    const table =
      `| Cart | Mass (kg) | Speed (m/s) |\n| --- | --- | --- |\n` +
      carts.map((c) => `| ${c.label} | ${c.m} | ${c.v} |`).join('\n')
    const options = carts.map((c) => `${c.label} (${c.m} kg at ${c.v} m/s)`)
    // The key is COMPUTED: indexes into `options`, greatest momentum first.
    const correct = carts
      .map((c, i) => ({ i, p: c.p }))
      .sort((a, b) => b.p - a.p)
      .map((x) => x.i)
    const ranked = correct.map((i) => `${carts[i].label} (${carts[i].p})`).join(' > ')
    const heaviest = [...carts].sort((a, b) => b.m - a.m)[0]
    const fastest = [...carts].sort((a, b) => b.v - a.v)[0]
    const winner = carts[correct[0]]
    return {
      title: 'Ranking task',
      prompt:
        `Four loaded carts roll along a level track.\n\n${table}\n\n` +
        `Rank them by **momentum**, greatest first. (Momentum is what a stopping force has to remove, so this is also the order of "hardest to stop".)`,
      answer: { type: 'order', options, correct },
      hints: [
        'Momentum is p = mv. Neither column alone decides it — one cart can be heavy and slow, another light and quick.',
        'Work out all four products before you order anything.',
        `Worked path: ${carts.map((c) => `${c.label} = ${c.m}×${c.v} = ${c.p}`).join(', ')}. So ${ranked}.`,
      ],
      explanation:
        `p = mv for each: ${carts.map((c) => `${c.label} = ${c.m}×${c.v} = **${c.p}** kg·m/s`).join(', ')}.\n\n` +
        `Order: ${ranked}.\n\n` +
        `Notice what this set is built to catch: the heaviest cart is ${heaviest.label} and the fastest is ${fastest.label}, ` +
        `yet the largest momentum belongs to ${winner.label} — neither of them. Ranking by either column alone gets a different order, ` +
        `which is why a ranking task tests something a "compute p" question cannot.`,
    }
  },
)

/* ------------------------------------------- what, if anything, is wrong */

/**
 * WHAT, IF ANYTHING, IS WRONG — and about a third of the time, nothing is.
 *
 * Faults are drawn from documented novice patterns: dropping a unit conversion,
 * inverting a rate, and reporting more precision than the inputs carry.
 */
const whatsWrong = tpl(
  {
    id: 'p-whats-wrong',
    name: 'What, if anything, is wrong?',
    skillIds: ['p-measure'],
    bucket: 'physics',
    difficulty: 3,
    variants: 9,
    minutes: 3,
    transfer: true,
    calibration: true,
  },
  (rng, seed) => {
    // Quarter-hour durations keep every displayed number exact: `min / 60` for
    // an arbitrary minute count is a repeating decimal, and the audit's
    // float-dust gate is right to refuse showing a learner 0.8333333333333334.
    const quarters = rint(rng, 1, 8)
    const min = quarters * 15
    const hours = quarters / 4
    const k = rint(rng, 2, 9)
    const km = 5 * k * quarters
    const trueKmh = 20 * k
    const trueMs = round((km * 1000) / (min * 60), 2)
    // Three of nine variants are CLEAN. A fault-finding bank where something is
    // always wrong trains "name any objection", not measurement sense.
    const fault = cycle(seed, ['clean', 'units', 'inverted', 'clean', 'precision', 'units', 'clean', 'inverted', 'precision'] as const)

    const shown =
      fault === 'units'
        ? `speed = ${km} km ÷ ${min} min = ${round(km / min, 3)} **m/s**`
        : fault === 'inverted'
          ? `speed = ${min} min ÷ ${km} km = ${round(min / km, 3)} **min/km**`
          : fault === 'precision'
            ? `speed = ${km * 1000} m ÷ ${min * 60} s = **${((km * 1000) / (min * 60)).toFixed(6)} m/s**`
            : `speed = ${km} km ÷ ${hours} h = **${trueKmh} km/h**`

    const correct =
      fault === 'units'
        ? 'The units are wrong: km ÷ min cannot be m/s without converting both'
        : fault === 'inverted'
          ? 'The division is upside down: this is time per distance, not distance per time'
          : fault === 'precision'
            ? 'The conversion is right but the answer claims far more precision than the measurements carry'
            : 'Nothing is wrong — the work and the units are both correct'

    const { answer, distractorNotes, distractorTags } = mcqNoted(rng, correct, [
      [
        'Nothing is wrong — the work and the units are both correct',
        fault === 'clean' ? null : 'There is a real fault here. Check the units and the direction of the division before accepting a number.',
        'concept',
      ],
      [
        'The units are wrong: km ÷ min cannot be m/s without converting both',
        fault === 'units' ? null : 'The units in this one actually do follow from the division as written.',
        'concept',
      ],
      [
        'The division is upside down: this is time per distance, not distance per time',
        fault === 'inverted' ? null : 'Distance is on top here, which is the right way up for a speed.',
        'representation',
      ],
      [
        'The conversion is right but the answer claims far more precision than the measurements carry',
        fault === 'precision' ? null : 'The number of digits shown is reasonable for these inputs.',
        'concept',
      ],
    ] as [string, string | null, ErrorTag][])

    return {
      title: 'What, if anything, is wrong?',
      prompt:
        `A trip covers **${km} km** in **${min} minutes**. A student writes:\n\n> ${shown}\n\n` +
        `What, if anything, is wrong with this work?\n\n**Some of these are fine.** Saying "nothing is wrong" is a real answer.`,
      answer,
      distractorNotes,
      distractorTags,
      hints: [
        'Check three things separately: is the division the right way up, do the units cancel to the unit claimed, and is the precision honest?',
        `Written out with units: ${km} km ÷ ${round(hours, 3)} h = ${trueKmh} km/h, which is ${trueMs} m/s.`,
        `Worked path: **${correct}**`,
      ],
      explanation:
        `**${correct}**\n\n` +
        `The honest version of this calculation is ${km} km ÷ ${round(hours, 3)} h = **${trueKmh} km/h** (equivalently ${trueMs} m/s).\n\n` +
        (fault === 'clean'
          ? 'Being able to say "this is fine" is half of checking. A bank where something is always wrong would just teach you to find an objection, and finding objections is not the same skill as judging work.'
          : 'A units check catches this before the arithmetic does — which is the whole reason to carry units through a calculation instead of tacking them on at the end.'),
    }
  },
)

/* ------------------------------------------------- changing representation */

/**
 * CHANGING REPRESENTATION — a position-time table to the motion it describes.
 *
 * A table of numbers and a sentence about motion are the same fact in two
 * representations, and moving between them is where "slope means speed" either
 * exists or does not. The distractors are the three other motions in the set,
 * so a learner cannot eliminate on wording.
 */
const graphStory = tpl(
  {
    id: 'p-graph-story',
    name: 'Table to motion story',
    skillIds: ['p-graphs'],
    bucket: 'physics',
    difficulty: 3,
    variants: 8,
    minutes: 3,
    transfer: true,
  },
  (rng, seed) => {
    const start = rint(rng, 0, 4) * 5
    const step = rint(rng, 3, 9)
    const shapes = [
      {
        key: 'steady',
        xs: [0, 1, 2, 3, 4].map((i) => start + step * i),
        story: 'Moving away at a steady speed the whole time',
        why: 'equal position changes in equal times — a straight line on a position-time graph',
      },
      {
        key: 'speeding',
        xs: [0, 1, 3, 6, 10].map((i) => start + step * i),
        story: 'Moving away and speeding up',
        why: 'the position changes grow each second, so the graph curves upward',
      },
      {
        key: 'slowing',
        xs: [0, 4, 7, 9, 10].map((i) => start + step * i),
        story: 'Moving away but slowing down',
        why: 'the position changes shrink each second, so the graph flattens out',
      },
      {
        key: 'stopped',
        xs: [0, 2, 4, 4, 4].map((i) => start + step * i),
        story: 'Moving away at a steady speed, then stopping',
        why: 'equal changes and then no change at all — a straight line that goes flat',
      },
      {
        key: 'back',
        xs: [0, 3, 5, 3, 0].map((i) => start + step * i),
        story: 'Moving away, then turning around and coming back',
        why: 'the position rises and then falls, which only happens if the direction reverses',
      },
    ]
    const c = cycle(seed, shapes)
    const table =
      `| Time (s) | 0 | 1 | 2 | 3 | 4 |\n| --- | --- | --- | --- | --- | --- |\n| Position (m) | ${c.xs.join(' | ')} |`
    const deltas = c.xs.slice(1).map((x, i) => x - c.xs[i])
    const { answer, distractorNotes, distractorTags } = mcqNoted(
      rng,
      c.story,
      shapes
        .filter((s) => s.key !== c.key)
        .map((s) => [
          s.story,
          `That motion would give ${s.why}. This table does not.`,
          s.key === 'back' || c.key === 'back' ? 'representation' : 'concept',
        ]) as [string, string | null, ErrorTag][],
    )
    return {
      title: 'Changing representation',
      prompt: `An object's position is recorded each second:\n\n${table}\n\nWhich description matches this motion?`,
      answer,
      distractorNotes,
      distractorTags,
      hints: [
        'Do not read the positions — read the CHANGES between them. Speed is how much the position moves per second.',
        `Second by second the position changes by ${deltas.join(', ')} m.`,
        `Worked path: **${c.story}**`,
      ],
      explanation:
        `The second-by-second changes are ${deltas.join(', ')} m, which means ${c.why}. So: **${c.story}**.\n\n` +
        `The habit worth taking from this: on a position-time table or graph, the positions tell you WHERE and the differences tell you HOW FAST. ` +
        `Most confusion between "far away" and "moving quickly" is this distinction going missing.`,
    }
  },
)

/* ---------------------------------------------------- working backwards */

/**
 * WORKING BACKWARDS — the answer is given; find the input that produces it.
 *
 * Same equation, run in the direction the learner has not rehearsed, which is
 * where a memorised substitution pattern stops helping.
 */
const accelBackwards = tpl(
  {
    id: 'p-accel-backwards',
    name: 'Working backwards from the answer',
    skillIds: ['p-accel'],
    bucket: 'physics',
    difficulty: 3,
    variants: 12,
    minutes: 3,
  },
  (rng, seed) => {
    const a = rint(rng, 2, 6)
    const t = rint(rng, 3, 9)
    const v0 = rint(rng, 0, 8)
    const v1 = v0 + a * t
    const unknown = cycle(seed, ['v0', 't'] as const)
    const ask =
      unknown === 'v0'
        ? `It finishes at **${v1} m/s** after **${t} s**. What was its **starting** speed, in m/s?`
        : `It started at **${v0} m/s** and finished at **${v1} m/s**. **How many seconds** did that take?`
    const ans = unknown === 'v0' ? v0 : t
    return {
      title: 'Working backwards',
      prompt:
        `A trolley speeds up at a constant **${a} m/s²** — meaning its speed rises by ${a} m/s every second.\n\n${ask}`,
      answer: numeric(ans),
      hints: [
        'You are not being asked for the acceleration this time; you already have it. Write down what a = Δv / Δt says and solve for the piece that is missing.',
        unknown === 'v0'
          ? `In ${t} s at ${a} m/s² the speed rises by ${a} × ${t} = ${a * t} m/s. The finish was ${v1} m/s.`
          : `The speed rose from ${v0} to ${v1}, a change of ${v1 - v0} m/s, at ${a} m/s each second.`,
        `Worked path: **${ans}**.`,
      ],
      explanation:
        unknown === 'v0'
          ? `The gain in speed is a × t = ${a} × ${t} = ${a * t} m/s. Working back from the finish: ${v1} − ${a * t} = **${v0} m/s**.`
          : `The change in speed is ${v1} − ${v0} = ${v1 - v0} m/s, and it gains ${a} m/s each second, so t = ${v1 - v0} ÷ ${a} = **${t} s**.`,
    }
  },
)

/* -------------------------------------------------- conflicting contentions */

/**
 * CONFLICTING CONTENTIONS — two students argue; decide who is right and why.
 *
 * Both positions are stated as reasoning, not as answers, so the learner has to
 * evaluate an argument rather than check a number. The wrong student always
 * holds a real, common misconception.
 */
const waveArgument = tpl(
  {
    id: 'p-wave-argument',
    name: 'Two students disagree',
    skillIds: ['p-waves'],
    bucket: 'physics',
    difficulty: 3,
    // Three authored disagreements. Declaring more would be a padded count:
    // reshuffling the same options is not a new question.
    variants: 3,
    minutes: 3,
    transfer: true,
    calibration: true,
  },
  (rng, seed) => {
    const cases = [
      {
        setup: 'A speaker plays a steady tone. Someone turns the volume up — nothing else changes.',
        aName: 'Ada',
        aSays: 'The sound now travels faster, because it is louder.',
        bName: 'Bo',
        bSays: 'The speed is unchanged. Loudness is amplitude; the speed of sound depends on the air, not on how hard the speaker pushes.',
        right: 'Bo',
        why: 'Amplitude carries the energy of a wave. Its speed is set by the medium, so in the same room the tone arrives at the same moment however loud it is.',
        trap: 'Louder feels like "more", and "more" gets read as "faster". Amplitude, frequency and speed are three separate things.',
      },
      {
        setup: 'The same tone is played, then the frequency is doubled. The room is unchanged.',
        aName: 'Ada',
        aSays: 'Doubling the frequency halves the wavelength, because the speed cannot change.',
        bName: 'Bo',
        bSays: 'Doubling the frequency doubles the wavelength, since v = fλ means they rise together.',
        right: 'Ada',
        why: 'v = fλ with v fixed by the medium makes f and λ inversely proportional: double one and the other halves.',
        trap: 'Reading v = fλ as "f and λ both grow" ignores that v is the constant here. In a fixed medium the product is what is pinned.',
      },
      {
        setup: 'A wave travels from air into water, where sound moves faster. Its source keeps vibrating at the same rate.',
        aName: 'Ada',
        aSays: 'The frequency changes when it enters the water, because the speed changed.',
        bName: 'Bo',
        bSays: 'The frequency is set by the source and does not change; the wavelength stretches to match the new speed.',
        right: 'Bo',
        why: 'Frequency is how often the source shakes, which the medium cannot alter. With v larger and f fixed, λ = v/f must grow.',
        trap: 'When one quantity in v = fλ changes, it is tempting to change whichever other one comes to mind. Which quantity is PINNED — and by what — decides it.',
      },
    ]
    const c = cycle(seed, cases)
    const wrongName = c.right === c.aName ? c.bName : c.aName
    const correct = `${c.right} is right`
    const { answer, distractorNotes, distractorTags } = mcqNoted(rng, correct, [
      [`${wrongName} is right`, c.trap, 'concept'],
      ['Both are right — they are describing the same thing differently', 'They make incompatible claims about the same quantity, so they cannot both hold.', 'inference'],
      ['Neither is right — you cannot tell without measuring', `This one is settled by the relationship itself. ${c.why}`, 'inference'],
    ] as [string, string | null, ErrorTag][])
    return {
      title: 'Conflicting contentions',
      prompt:
        `${c.setup}\n\n> **${c.aName}:** ${c.aSays}\n\n> **${c.bName}:** ${c.bSays}\n\nWho is right?`,
      answer,
      distractorNotes,
      distractorTags,
      hints: [
        'Write down v = fλ and mark which of the three is FIXED by the situation. That one decides the argument.',
        'Amplitude (loudness) is not in v = fλ at all — check whether the disagreement is even about a quantity in the relationship.',
        `Worked path: **${correct}** — ${c.why}`,
      ],
      explanation: `**${correct}.** ${c.why}\n\nWhy the other position tempts: ${c.trap}`,
    }
  },
)

/* -------------------------------------------------------- troubleshooting */

/**
 * TROUBLESHOOTING — an estimate with exactly one broken step; repair the total.
 *
 * A Fermi estimate is a chain, and the useful skill is locating the bad link
 * rather than redoing the whole thing. The learner returns the CORRECTED total,
 * so a plausible-sounding critique that does not fix the arithmetic scores zero.
 */
const estimateTroubleshoot = tpl(
  {
    id: 'p-estimate-troubleshoot',
    name: 'Find the broken step in an estimate',
    skillIds: ['p-estimate'],
    bucket: 'physics',
    difficulty: 4,
    variants: 8,
    minutes: 3.5,
    transfer: true,
    calibration: true,
  },
  (rng, seed) => {
    const students = rint(rng, 3, 9) * 100
    const sheetsPerDay = rint(rng, 2, 5)
    const daysPerWeek = 5
    const weeks = rint(rng, 30, 40)
    const trueTotal = students * sheetsPerDay * daysPerWeek * weeks
    // The broken link: a factor-of-ten slip, a dropped factor, or a swapped unit.
    const bug = cycle(seed, ['tenfold', 'dropped', 'perweek', 'tenfold'] as const)
    const shownTotal =
      bug === 'tenfold' ? trueTotal * 10 : bug === 'dropped' ? students * sheetsPerDay * weeks : students * sheetsPerDay * daysPerWeek * weeks * 7
    const shownLine =
      bug === 'tenfold'
        ? `${students} × ${sheetsPerDay} × ${daysPerWeek} × ${weeks} = ${shownTotal.toLocaleString('en-US')}`
        : bug === 'dropped'
          ? `${students} × ${sheetsPerDay} × ${weeks} = ${shownTotal.toLocaleString('en-US')}`
          : `${students} × ${sheetsPerDay} × 7 × ${weeks} = ${shownTotal.toLocaleString('en-US')}`
    const faultText =
      bug === 'tenfold'
        ? 'the multiplication is set up correctly but the arithmetic is off by a factor of ten'
        : bug === 'dropped'
          ? 'the school-days-per-week factor was dropped entirely'
          : 'it used 7 days a week, but sheets are only handed out on school days'
    return {
      title: 'Troubleshooting an estimate',
      prompt:
        `A student estimates how many worksheet pages a school gets through in a year:\n\n` +
        `> **Assumptions:** ${students} students · ${sheetsPerDay} sheets each per school day · ` +
        `${daysPerWeek} school days a week · ${weeks} school weeks a year\n>\n` +
        `> **Their work:** ${shownLine} sheets\n\n` +
        `Exactly one step is broken. Give the **corrected total** (a whole number, no commas).`,
      answer: numeric(trueTotal),
      hints: [
        'Do not re-estimate from scratch. Their assumptions are all reasonable — check whether the arithmetic actually uses every one of them, once each.',
        'List the four assumptions, then check them off against the factors in their line of work.',
        `Worked path: ${students} × ${sheetsPerDay} × ${daysPerWeek} × ${weeks} = **${trueTotal}**.`,
      ],
      explanation:
        `The fault: ${faultText}.\n\n` +
        `Corrected: ${students} students × ${sheetsPerDay} sheets × ${daysPerWeek} days × ${weeks} weeks = **${trueTotal.toLocaleString('en-US')}** sheets.\n\n` +
        `The general move is worth more than this answer: an estimate is a CHAIN, so audit it link by link — one factor per assumption, each used exactly once, ` +
        `and a final sanity check on the order of magnitude. Most broken estimates fail at a single link, and rebuilding the whole chain hides which one.`,
    }
  },
)

export const PHYSICS_REASONING_TEMPLATES: ItemTemplate[] = [
  momentumRank,
  whatsWrong,
  graphStory,
  accelBackwards,
  waveArgument,
  estimateTroubleshoot,
]
