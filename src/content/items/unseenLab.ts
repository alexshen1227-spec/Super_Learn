/**
 * OBSERVER — "What is not in front of you" (unit `u-unseen`).
 *
 * The original Observer Lab trains a learner to read ONE scene accurately:
 * observed vs inferred, recall, paraphrase, cold-reading defence. This file
 * extends the same subject past the single scene, to the five specific,
 * nameable ways a careful observer still gets a wrong picture:
 *
 *  - `o-selection`  the rows that never reached the table (survivorship,
 *                   self-selection, non-response, selecting on the outcome)
 *  - `o-expect`     evidence that could not have come out the other way
 *  - `o-anchor`     an opening figure that quietly set the range being argued in
 *  - `o-frame`      one fact wearing a gain costume or a loss costume
 *  - `o-claimtype`  measured fact vs reasoned judgement vs speculation
 *
 * DESIGN NOTES AND THEIR SOURCES
 *
 * 1. Naming a bias and not committing it are different skills, and the app has
 *    already recorded which one matters more. RESEARCH.md §29b: in Morewedge
 *    et al. (2015, Policy Insights 2(1)) the passive instructional VIDEO taught
 *    bias recognition better than the interactive game (knowledge d = 1.69 vs
 *    1.05), while the GAME reduced actual commission more, both immediately and
 *    at 8-12 weeks (d = 1.11/1.16). The design consequence recorded there is to
 *    keep shifting weight from naming biases to falling for them. So most of
 *    `o-anchor` and `o-frame` here puts the trap inside an ordinary task —
 *    a price, a queue, a haggle, a percentage conversion — rather than asking
 *    "which bias is this?". Only the entry-point items name anything.
 *
 * 2. Anchoring specifically. The EFFECT is about as well replicated as anything
 *    in this literature: Klein et al. (2014, Many Labs 1) ran classic anchoring
 *    across 36 samples in 11 countries and recovered effects LARGER than the
 *    original, and four of the four anchoring sub-studies were significant.
 *    The TRAINING claim is much weaker and must stay weak in copy: Morewedge's
 *    Experiment 2 bundled anchoring with two other biases and reported ~32%
 *    immediate / ~24% long-term reduction ACROSS the bundle, with no untrained
 *    control group — so no per-bias figure exists, and none is printed to the
 *    learner anywhere in this file. Heerma van Voss et al. (2025, Sci Reports
 *    15:42529) extends the same training programme to professional risk
 *    analysts but its headline outcome is confirmation bias, not anchoring;
 *    nature.com would not serve its full text to the authoring session, so the
 *    reliability figures quoted for its self-report bias scales COULD NOT BE
 *    VERIFIED HERE and are therefore not cited in the file or the copy. Treat
 *    "training reduces anchoring" as HEURISTIC, not EVIDENCE, until someone
 *    reads that paper.
 *
 * 3. The repair move taught in `unseen-reanchor` — throw the given figure away
 *    and rebuild from an independent reference class or a computed floor — is
 *    the one trained forecasting principle that actually earned its keep. Good
 *    Judgment / CHAMPS KNOW (RESEARCH.md §29b): of ten trained principles, only
 *    "comparison classes / base rates" was significantly associated with better
 *    Brier accuracy, and two principles were associated with WORSE accuracy.
 *    That is the reason this file teaches ONE repair rather than a checklist.
 *
 * 4. `o-claimtype` is a standards hook, not an invention: CCSS RH.6-8.8
 *    ("distinguish among fact, opinion, and reasoned judgment in a text") and
 *    RST.6-8.8 ("distinguish among facts, reasoned judgment based on research
 *    findings, and speculation"). The three categories are deliberately worded
 *    to stay disjoint from the existing `o-obsinf` Evidence Ledger's
 *    Observed / Inferred / Unknown: that ladder is about ONE scene and what you
 *    personally saw; this one is about a TEXT and what it is entitled to say.
 *    "Opinion" appears as a permanent MCQ distractor and is never the key —
 *    the standard names it, and confusing an unsupported prediction with a
 *    stated preference is the specific error worth catching.
 *
 * SAFETY (content law, `CLAUDE.md` §7 and the founding brief).
 * Observer teaches DEFENCE. `unseen-barnum` teaches a learner to RECOGNISE and
 * resist statements that fit everyone; it contains no instruction in composing
 * them, no profiling, and no "tells". No real people, organisations or brands
 * appear anywhere. No scenario places a young person under pressure or in
 * danger, so no frame-break is needed — and none should be added by editing a
 * scenario into that territory.
 *
 * BALANCE. Two families here can key to "nothing is wrong": `unseen-barnum`
 * (half its statements are genuinely falsifiable) and `unseen-confirms-both`
 * (half its tests genuinely discriminate), plus `unseen-frame-same`, whose
 * benign key is that two framings really do say the same thing. That is
 * deliberate — the audit gate on this exists because a bucket where the answer
 * is always "something is wrong" rewards blanket suspicion instead of
 * discernment.
 */
import type { ErrorTag, ItemTemplate } from '../../domain/types'
import { classify, cycle, draft, mcq, mcqNoted, money, multi, numeric, tpl } from '../lib'

/**
 * Rotate a decoy pool, so a family whose QUESTION never changes does not hand
 * the learner the same length cue on every encounter.
 *
 * Four templates here are parameterised arithmetic with one fixed conceptual
 * multiple choice at the end. Written naively, that MCQ shows identical
 * wording across all 16-36 variants, which means the key sits at exactly the
 * same length rank forever — and a learner who notices once has it for good.
 * Taking three consecutive entries from a five-entry pool gives five different
 * option sets. Every pool below is written so that each window of three
 * contains at least one decoy LONGER than the key (the fix is always to
 * lengthen decoys, never to clip the key), and so that the rank actually moves
 * between windows.
 */
function rotateDecoys(seed: number, pool: string[]): string[] {
  return [0, 1, 2].map((i) => pool[(seed + i) % pool.length])
}

/* ==================================================================
 * o-selection — who is missing from the data
 * ================================================================== */

interface MissingCase {
  scene: string
  ask: string
  correct: string
  wrong: [text: string, note: string, tag: ErrorTag][]
  why: string
}

/**
 * Entry point for `o-selection`. The correct option is always a group that the
 * described mechanism could not have collected; every distractor is a group
 * that IS in the data, or whose absence does not bear on the claim. Option
 * lengths are held inside a few characters of each other on purpose — the key
 * being the wordiest option is the test-wiseness defect this bank already
 * shipped once (see the audit's option-length gate).
 */
const MISSING_CASES: MissingCase[] = [
  {
    scene:
      'A study app shows an average rating of 4.7 stars. The rating box only appears inside the app, on the thirtieth day of use.',
    ask: 'Whose experience is missing from that 4.7?',
    correct: 'Everyone who quit before day thirty',
    wrong: [
      ['Everyone who rated it one or two stars', 'Low ratings are counted — they are inside the average, not outside it.', 'misread'],
      ['Everyone still using it after a year', 'The longest-staying users are the most represented group of all.', 'concept'],
      ['Everyone who paid for the full version', 'Paying does not decide whether the box appeared; day thirty does.', 'misread'],
    ],
    why: 'The box cannot reach someone who has already deleted the app, so the number describes survivors and nothing else.',
  },
  {
    scene:
      'A hallway crossing is called safe: only two injuries were logged there last year. Teachers say most students take the long way round because the crossing feels risky.',
    ask: 'Whose experience is missing from that injury count?',
    correct: 'Students who avoid the crossing entirely',
    wrong: [
      ['Students who were injured somewhere else', 'Injuries elsewhere are a different question, not a missing row here.', 'misread'],
      ['Teachers who supervise that hallway daily', 'The supervisors are present; it is the at-risk group that is absent.', 'concept'],
      ['Students who cross it several times a day', 'Frequent crossers are exactly who the two injuries came from.', 'concept'],
    ],
    why: 'The people at most risk removed themselves, so a low count is what a feared crossing looks like, not a safe one.',
  },
  {
    scene:
      'A magazine profiles twelve founders who left school early, and concludes that leaving early frees people to build things.',
    ask: 'Who is missing from those twelve profiles?',
    correct: 'Everyone who dropped out and never made it',
    wrong: [
      ['Founders who finished their degrees first', 'A fair comparison group, but not the group the filter removed.', 'strategy'],
      ['The employees those twelve founders hired', 'Employees were never the subject of the claim being made.', 'misread'],
      ['Readers who disagreed with the magazine\'s take', 'Readers are not data about founders at all.', 'concept'],
    ],
    why: 'Only successes get profiled, so "they all did X" is guaranteed in advance whatever X is.',
  },
  {
    scene:
      'An optional advanced maths class posts a 94% pass rate. Enrolment is open only to students who scored a B or better the year before.',
    ask: 'Whose result is missing from that 94%?',
    correct: 'Students whose earlier grade was below a B',
    wrong: [
      ['Students who failed this year\'s final exam', 'They are the other 6% — counted, not missing.', 'misread'],
      ['Teachers who taught the ordinary class', 'Teachers are not sitting the exam being counted.', 'concept'],
      ['Students who took the class as a repeat', 'Repeats still met the entry bar, so they are inside the data.', 'concept'],
    ],
    why: 'The entry rule already selected for the outcome being measured, so the pass rate partly reports the rule.',
  },
  {
    scene:
      'A school sends every student a survey about the new lunch menu. Of 900 students, 140 reply, and 78% of those say the menu improved.',
    ask: 'Whose view is missing from that 78%?',
    correct: 'The 760 students who did not reply',
    wrong: [
      ['The 140 students who did reply', 'Those are the only students whose view IS in the figure.', 'misread'],
      ['Students who bring lunch from home', 'Some of them replied; the reply/no-reply split is the real filter.', 'concept'],
      ['Staff who eat in the same canteen', 'Staff were never the population the survey described.', 'misread'],
    ],
    why: 'Answering an optional survey about a change is itself related to how you feel about the change.',
  },
  {
    scene:
      'A coach says the pre-season fitness plan works: every player who completed it made the final squad.',
    ask: 'Which players are missing from that claim?',
    correct: 'Players who started the plan and stopped',
    wrong: [
      ['Players who made the squad without it', 'A useful comparison, but they are not who the filter removed.', 'strategy'],
      ['Players who were injured during matches', 'Match injuries come after selection, so they change nothing.', 'misread'],
      ['Coaches from the school\'s other sports teams', 'Other coaches are not players and not in the count.', 'concept'],
    ],
    why: '"Everyone who finished" quietly excludes everyone who could not finish, which is where the failures went.',
  },
  {
    scene:
      'An online thread asks which bike lock is best. Almost every reply names the lock the writer owns and adds that their bike has never been stolen.',
    ask: 'Whose experience is missing from that thread?',
    correct: 'Owners whose bike was stolen anyway',
    wrong: [
      ['Owners who bought the cheapest lock', 'Plenty of them are replying; price is not the filter here.', 'misread'],
      ['Shops that sell the locks discussed', 'Shops are not lock owners reporting an outcome.', 'concept'],
      ['Riders who never lock their bikes', 'They were never testing a lock, so they say nothing about one.', 'concept'],
    ],
    why: 'Someone whose bike was taken has usually left the hobby forum, and their lock is not there to be named.',
  },
  {
    scene:
      'A repair shop owner says the older kettles were built to last: the twenty-year-old models on her bench still work, while the new ones break.',
    ask: 'Which kettles are missing from that bench?',
    correct: 'Old kettles that broke and were binned',
    wrong: [
      ['New kettles that are still working fine', 'They exist, but the missing group is on the OLD side.', 'strategy'],
      ['Customers who repair their own kettles', 'Customers are not kettles and are not the sample.', 'concept'],
      ['Kettles the shop has never stocked', 'Stock has nothing to do with which kettles survived.', 'misread'],
    ],
    why: 'Twenty years removed the weak old kettles, so what survives to be admired is the strongest slice of a whole generation.',
  },
]

const missingWho = tpl(
  {
    id: 'unseen-missing-who',
    name: 'Who never made it into the data',
    skillIds: ['o-selection'],
    bucket: 'observer',
    difficulty: 2,
    variants: MISSING_CASES.length,
    minutes: 2,
    calibration: true,
  },
  (rng, seed) => {
    const c = cycle(seed, MISSING_CASES)
    const { answer, distractorNotes, distractorTags } = mcqNoted(rng, c.correct, c.wrong)
    return {
      title: 'Who is not here?',
      prompt: `${c.scene}\n\n**${c.ask}**`,
      answer,
      distractorNotes,
      distractorTags,
      hints: [
        'Ask how someone got INTO this data. Whoever could not take that route is your answer.',
        'Three of the four groups are either already counted or irrelevant to the claim. Cross those off first.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}.** ${c.why}\n\nThe tempting wrong answers all name a group that is **already in** the data — and once a group is in, it cannot be the one distorting the picture by its absence. The one question that does the work every time: how did a row get into this table, and who could never have taken that route?`,
    }
  },
)

/**
 * Filtering on the outcome is ONE fault among many. A learner who learns to
 * shout "biased sample!" at every flawed statistic has swapped one reflex for
 * another, so half of these statements are perfectly ordinary samples with a
 * completely different defect — a loaded question, a truncated axis, a
 * confound, arithmetic that does not add up.
 */
const FILTER_SETS: { text: string; category: number }[][] = [
  [
    { text: 'The gym\'s satisfaction score counts only members who renewed this year', category: 0 },
    { text: 'The survey asked: "How much did the new timetable improve your week?"', category: 1 },
    { text: 'A bakery quotes the shelf life of the loaves customers came back to praise', category: 0 },
    { text: 'Ice-cream sales and sunburn rise together, so the report calls one the cause', category: 1 },
    { text: 'A summer camp reports the fitness gains of campers who stayed all six weeks', category: 0 },
  ],
  [
    { text: 'The app\'s average rating comes from users who still had it installed on day 30', category: 0 },
    { text: 'One class answered, and the result is printed as the whole school\'s view', category: 1 },
    { text: 'A ski resort\'s safety page counts only the runs that stayed open all season', category: 0 },
    { text: 'The before and after scores were measured with two different tests', category: 1 },
    { text: 'A coding course lists the salaries of graduates who replied to its jobs survey', category: 0 },
  ],
  [
    { text: 'A charity reports outcomes for the families it managed to reach a year later', category: 0 },
    { text: 'The report compares this January against last July', category: 1 },
    { text: 'A driving instructor\'s pass rate counts only pupils he judged ready to book', category: 0 },
    { text: 'Two hundred people answered, and the article calls 51% "most people"', category: 1 },
    { text: 'The forum\'s list of reliable cars comes from owners who still drive theirs', category: 0 },
  ],
  [
    { text: 'An advanced class posts its results; entry needed a B the year before', category: 0 },
    { text: 'The graph starts its vertical axis at 90 rather than at 0', category: 1 },
    { text: 'A diet page shows the twelve-week results of everyone who finished twelve weeks', category: 0 },
    { text: 'The two groups were tested on different days, one of them before a holiday', category: 1 },
    { text: 'Only players still on the squad were asked whether training is fair', category: 0 },
  ],
  [
    { text: 'A tutoring service averages the gains of pupils who booked a second term', category: 0 },
    { text: 'The word "most" is used for a figure of 34%', category: 1 },
    { text: 'A trail blog rates the signposts using reports from walkers who found the end', category: 0 },
    { text: 'The sample was drawn at random, but only twelve people were in it', category: 1 },
    { text: 'The company\'s engagement score comes from the staff who are still employed', category: 0 },
  ],
  [
    { text: 'A phone\'s durability score is built from handsets brought in for a trade-in', category: 0 },
    { text: 'Both groups improved, and the write-up credits only the group given the new book', category: 1 },
    { text: 'A festival hands out its "would you come again?" card at the exit on day three', category: 0 },
    { text: 'The percentages in the table add up to 118', category: 1 },
    { text: 'An instrument dealer says old builds last, judging by the ones left on his wall', category: 0 },
  ],
]

const filteredOrNot = tpl(
  {
    id: 'unseen-filtered-or-not',
    name: 'Filtered, or faulty some other way?',
    skillIds: ['o-selection', 'o-obsinf'],
    bucket: 'observer',
    difficulty: 3,
    variants: FILTER_SETS.length,
    minutes: 3.5,
    calibration: true,
  },
  (rng, seed) => {
    const set = cycle(seed, FILTER_SETS)
    return {
      title: 'Sort the faults',
      prompt:
        'Each line below describes a real problem with a number. Only some of them are problems with **who got counted**.\n\n' +
        '**Filtered by the outcome** = the cases in the data were selected by the very thing being measured.\n' +
        '**Not filtered** = the sample is not the fault; something else is (the question, the chart, the comparison, the arithmetic).',
      answer: classify(rng, ['Filtered by the outcome', 'Not filtered — a different fault'], set),
      hints: [
        'For each line, ask whether the result itself decided who got in. Renewed, finished, survived, replied, still there — those are outcome words.',
        'If everyone had an equal chance of being counted, the sample is not the problem. Then look at the question, the axis, the comparison, or the sums.',
        `Worked path: ${set.map((s) => `"${s.text.slice(0, 34)}…" → ${s.category === 0 ? 'filtered' : 'not filtered'}`).join('; ')}.`,
      ],
      explanation:
        `${set
          .map((s) => `**${s.category === 0 ? 'Filtered' : 'Not filtered'}**: ${s.text}`)
          .join('. ')}.\n\n` +
        'The reason this item mixes the two is that "biased sample" becomes a reflex very fast, and a reflex is not a skill. A loaded question, a chopped axis and a table that sums to 118 are all serious faults, and none of them is fixed by recruiting differently. Name the fault you can actually see.',
    }
  },
)

interface SettleCase {
  claim: string
  correct: string
  wrong: string[]
  why: string
}

const SETTLE_CASES: SettleCase[] = [
  {
    claim:
      'A tutoring centre\'s site says: "Our students gain 140 points on average." The average covers students who completed all twelve sessions.',
    correct: 'The gains of students who stopped early',
    wrong: ['The gains of students at other centres', 'How many points the very top student gained', 'How long each of the sessions actually ran'],
    why: 'Anyone who was not improving is the likeliest person to stop, so the drop-outs hold the part of the average that was removed.',
  },
  {
    claim: 'A club claims its warm-up prevents injuries: "Nobody who does it has been injured this season."',
    correct: 'The injury rate among players who skip it',
    wrong: ['How many of the players do the warm-up at all', 'How long the warm-up takes each session', 'Which injuries are the most common ones here'],
    why: 'A claim about prevention is a comparison, and only one side of the comparison has been shown.',
  },
  {
    claim: 'A stall of old tools: "They do not make them like this any more — every one of these still works."',
    correct: 'How many of that make were thrown out',
    wrong: ['How old the surviving tools actually are', 'How much the stall charges for them', 'How many people still use old tools'],
    why: 'Only the survivors reached the stall. The failure rate is sitting in a landfill where nobody counts it.',
  },
  {
    claim: 'A revision blog: "Every student I interviewed who got an A revised with flashcards."',
    correct: 'Whether students without A\'s used them',
    wrong: ['How many hours each student revised', 'Which subjects the interviews actually covered', 'How many students were interviewed'],
    why: 'If the flashcard rate is just as high among students who did not get an A, the flashcards have explained nothing.',
  },
  {
    claim: 'A driving school advertises a 91% first-time pass rate. Instructors decide when a learner is ready to book the test.',
    correct: 'How many learners never got to book',
    wrong: ['How many lessons the average learner takes', 'The pass rate at other driving schools', 'Which examiners the learners were given'],
    why: 'The school controls entry to the very test it is scored on, so holding weaker learners back raises the figure without teaching anyone more.',
  },
  {
    claim: 'A running app\'s blog: "Of the runners who filled in our one-year survey, 84% had kept up the habit."',
    correct: 'How many runners never filled it in',
    wrong: ['How many runners downloaded the app', 'What the survey counted as keeping up', 'How far the average runner now runs'],
    why: 'Someone who gave up running a year ago is unlikely to answer a survey about running, so the 84% is a figure about repliers.',
  },
  {
    claim: 'A school newsletter: "Students in the homework club get better grades than students who are not in it."',
    correct: 'The grades those students had before',
    wrong: ['How many students the club is able to take', 'How often the club actually manages to meet', 'Which teachers supervise the club'],
    why: 'Joining is a choice, and the students who make it may have been ahead already. Only the earlier grades separate the club from the joiners.',
  },
  {
    claim: 'A hiring page: "Nine in ten of our engineers would join again." The survey goes to current employees.',
    correct: 'What the people who left would say',
    wrong: ['How many engineers the company has', 'How long the average engineer stays', 'Which teams answered the survey'],
    why: 'Everyone who found the answer to be "no" has already acted on it and is no longer on the mailing list.',
  },
]

const whatWouldSettle = tpl(
  {
    id: 'unseen-what-would-settle',
    name: 'What would you need to see?',
    skillIds: ['o-selection'],
    bucket: 'observer',
    difficulty: 3,
    variants: SETTLE_CASES.length,
    minutes: 2.5,
    transfer: true,
  },
  (rng, seed) => {
    const c = cycle(seed, SETTLE_CASES)
    return {
      title: 'The one thing you are not shown',
      prompt: `${c.claim}\n\nWhich single missing figure would settle whether the claim means anything?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Do not look for a flaw in the number you were given. Ask which number was never collected.',
        'Every option here is real information. Only one of them can move you from believing the claim to disbelieving it.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}.** ${c.why}\n\nThe other three are tempting because they are all genuinely interesting, and asking for more detail **feels** like scepticism. It is not. Detail about the group you were shown cannot repair a group you were not shown — only the missing side can do that.`,
    }
  },
)

/**
 * The same idea as an arithmetic problem, because the size of the distortion is
 * the part a learner cannot feel. The second part deliberately asks for a
 * SUPPOSED figure, not a known one: the honest conclusion is not "the real
 * rating is 2.5", it is "the posted rating is compatible with almost anything",
 * and the third part is where that gets said.
 */
const REVIEW_CONTEXTS = [
  { thing: 'a homework-planner app', who: 'installed it', leave: 'deleted it in the first fortnight' },
  { thing: 'an online revision course', who: 'signed up', leave: 'stopped logging in after week one' },
  { thing: 'a bouldering gym', who: 'took out a membership', leave: 'never came back after a month' },
  { thing: 'a card game', who: 'bought a copy', leave: 'shelved it after a single play' },
]

/** Chosen so `(reviewers·posted + silent·quiet)` divides the total exactly. */
const REVIEW_NUMBERS = [
  { total: 500, reviewers: 100, posted: 45, quiet: 20 },
  { total: 400, reviewers: 100, posted: 48, quiet: 20 },
  { total: 250, reviewers: 50, posted: 45, quiet: 10 },
  { total: 800, reviewers: 200, posted: 46, quiet: 30 },
]

const reviewGap = tpl(
  {
    id: 'unseen-review-gap',
    name: 'The rating the quitters never left',
    skillIds: ['o-selection', 'm-stats'],
    bucket: 'observer',
    difficulty: 3,
    variants: REVIEW_CONTEXTS.length * REVIEW_NUMBERS.length,
    minutes: 3.5,
    kind: 'multi',
  },
  (rng, seed) => {
    const ctx = REVIEW_CONTEXTS[seed % REVIEW_CONTEXTS.length]
    const n = REVIEW_NUMBERS[Math.floor(seed / REVIEW_CONTEXTS.length) % REVIEW_NUMBERS.length]
    const silent = n.total - n.reviewers
    // Integer tenths throughout, so no binary dust can reach a rendered string.
    const totalTenths = n.reviewers * n.posted + silent * n.quiet
    const blended = Math.round(totalTenths / n.total) / 10
    const postedStars = n.posted / 10
    const quietStars = n.quiet / 10
    return {
      title: 'Stars from the people who stayed',
      prompt:
        `In total ${n.total} people ${ctx.who}, and ${n.reviewers} of them left a star rating. ` +
        `Those ratings average **${postedStars} stars**, and that is the figure shown on the listing for ${ctx.thing}.`,
      parts: [
        {
          prompt: `How many of the ${n.total} people have **no** rating in that average?`,
          answer: numeric(silent, { unit: 'people' }),
          explanation: `${n.total} minus ${n.reviewers} leaves **${silent} people** whose experience never entered the number. That is the majority of everyone who tried it, and the listing does not mention them.`,
          hints: [
            'Only the people who left a rating are inside the average.',
            'Take the raters away from the total.',
            `Worked path: ${n.total} − ${n.reviewers} = ${silent}.`,
          ],
        },
        {
          prompt:
            `Now a check, not a fact. **Suppose** every one of those ${silent} silent people would have given ${quietStars} stars. ` +
            `What would the average across all ${n.total} people be? Give it to one decimal place.`,
          answer: numeric(blended, { unit: 'stars' }),
          explanation:
            `(${n.reviewers} × ${postedStars}) + (${silent} × ${quietStars}) = ${totalTenths / 10} stars in total, and dividing by ${n.total} gives **${blended} stars**. ` +
            `The listing says ${postedStars}. Nothing about the product changed between those two numbers — only who was allowed to speak.`,
          hints: [
            'Total up the stars from both groups, then divide by everyone.',
            `The raters contribute ${n.reviewers} × ${postedStars}; the silent group contributes ${silent} × ${quietStars}.`,
            `Worked path: (${n.reviewers} × ${postedStars} + ${silent} × ${quietStars}) ÷ ${n.total} = ${blended}.`,
          ],
        },
        {
          prompt: `The ${postedStars} on the listing is honest evidence about what, exactly?`,
          answer: mcq(
            rng,
            'How the people who stayed feel about it',
            rotateDecoys(seed, [
              'What the buyers all think of it',
              'How many people it has managed to keep so far',
              'Whether it is better than any of its rivals',
              'How everyone who tried it feels about it',
              'Whether it is worth what it costs',
            ]),
          ),
          explanation:
            `**How the people who stayed feel about it.** That is not nothing — it is a real fact about a real group. What it cannot do is stand in for everyone, and the calculation above shows how far the two can drift apart.\n\n` +
            `The trap is the second option, because a listing prints one average and lets you assume it covers all buyers. Note also what the ${blended} is NOT: nobody knows what the silent group would have said. The supposed rating was a stress test, not a measurement, and the honest summary is "this number could be anywhere" rather than a different number.`,
          hints: [
            'A number is evidence about the group it was collected from, and no wider.',
            'Ask who was able to answer, then say only that.',
            'Worked path: it describes the raters, who are the people still using it.',
          ],
        },
      ],
      hints: [
        'Part one is a subtraction; part two is a weighted average.',
        'Keep the two groups separate, total their stars, then divide by everyone.',
        'The last part is not arithmetic — it asks what the posted number is allowed to claim.',
      ],
      explanation:
        `Ratings are left by people who are still around to leave them. Everyone who walked away took their rating with them, which is why the listing shows ${postedStars} while a plausible whole-population figure sits near ${blended}. This is the same shape as a review average, a satisfaction score, a "would you recommend us" percentage and an alumni survey: the collection method quietly excludes the unhappy.`,
    }
  },
)

/* ==================================================================
 * o-expect — what would I see if this were false?
 * ================================================================== */

/**
 * DEFENCE ONLY. This teaches recognition of statements that fit nearly anyone,
 * and the defensive question that exposes them ("what fraction of all people
 * would accept this?"). It contains no instruction in composing such statements
 * and no profiling technique. Half the cases are genuinely falsifiable, so the
 * answer "this one actually says something" stays reachable.
 */
const BARNUM_CASES: { line: string; barnum: boolean; why: string }[] = [
  {
    line: 'At times you are outgoing, and at other times you keep to yourself.',
    barnum: true,
    why: 'It covers both settings of the same dial, so there is no way for it to be wrong about anybody.',
  },
  {
    line: 'You have played a wind instrument for at least three years.',
    barnum: false,
    why: 'Most people would have to say no. A statement that most people must reject is one that can be checked.',
  },
  {
    line: 'You have a few private worries you have not shared with anyone.',
    barnum: true,
    why: 'Near enough everyone has one. Agreeing feels like being seen, and it costs the speaker nothing.',
  },
  {
    line: 'You walked to school this morning rather than taking a bus or a car.',
    barnum: false,
    why: 'It picks out one route out of several and rules the others out. It could have come out false this morning.',
  },
  {
    line: 'You want variety, and get restless when there are too many rules.',
    barnum: true,
    why: 'Both halves are things almost everyone says about themselves, so the sentence never risks anything.',
  },
  {
    line: 'Your most recent maths result came back above eighty per cent.',
    barnum: false,
    why: 'A specific threshold on a specific test. Roughly half the room would have to disagree.',
  },
  {
    line: 'Some of your hopes for the future are more ambitious than realistic.',
    barnum: true,
    why: 'Anyone with a hope can find one that fits, and anyone who denies it looks like they are the exception.',
  },
  {
    line: 'You have an older brother or sister living in the same house.',
    barnum: false,
    why: 'It names a fact about your household that is straightforwardly either true or not.',
  },
]

const BARNUM_KEYS = {
  fits: 'No — nearly everyone would accept it as accurate',
  real: 'Yes — it names something that could have been false',
}

const barnumDefence = tpl(
  {
    id: 'unseen-barnum',
    name: 'Does that line say anything?',
    skillIds: ['o-expect', 'o-bias'],
    bucket: 'observer',
    difficulty: 2,
    variants: BARNUM_CASES.length,
    minutes: 2,
    calibration: true,
  },
  (rng, seed) => {
    const c = cycle(seed, BARNUM_CASES)
    const correct = c.barnum ? BARNUM_KEYS.fits : BARNUM_KEYS.real
    const opposite = c.barnum ? BARNUM_KEYS.real : BARNUM_KEYS.fits
    const { answer, distractorNotes, distractorTags } = mcqNoted(rng, correct, [
      [
        opposite,
        c.barnum
          ? 'Reading agreement as accuracy — you nodded, so it felt aimed at you.'
          : 'Over-correction — a checkable claim got treated as empty flattery.',
        'inference',
      ],
      ['No — the sentence is too vague to have a meaning', 'Vague is not the same as meaningless; it means true of too many.', 'concept'],
      ['Yes — it would be a remarkable coincidence otherwise', 'Coincidence reflex — no coincidence is needed if the line fits all.', 'inference'],
    ])
    return {
      title: 'The line that fits everyone',
      prompt:
        `A site claims it can describe your personality from the way you scroll. It prints this line about you:\n\n> ${c.line}\n\n` +
        '**Does it tell you anything about you in particular?**\n\nAbout half of these lines really do say something. "Yes" is a live answer.',
      answer,
      distractorNotes,
      distractorTags,
      hints: [
        'Ask what fraction of everyone in your year group would nod at that sentence.',
        'A statement worth having is one that a lot of people would have to reject. If nobody has to reject it, it has ruled nothing out.',
        `Worked path: **${correct}**.`,
      ],
      explanation:
        `**${correct}.** ${c.why}\n\n` +
        (c.barnum
          ? 'The feeling of being described is doing all the work here, and that feeling is what the trick runs on: you supply the specifics from your own life and remember the line as a hit. The defence is one question — what fraction of all people would accept this? — and it costs nothing to ask.'
          : 'Calling this one empty is the mirror-image mistake, and it is not the safe one. If every statement counts as flattery then you lose the ability to notice the ones that were actually checkable, which are the only ones worth arguing about.') +
        '\n\nThis is a defensive skill: the point is to spot the machinery when it is aimed at you — in a horoscope, a personality quiz, or a sales line that opens "you strike me as the sort of person who…". It is not a technique to use on anyone.',
    }
  },
)

interface DiscriminateCase {
  setup: string
  correct: string
  wrong: string[]
  why: string
}

const DISCRIMINATE_CASES: DiscriminateCase[] = [
  {
    setup: 'Your laptop is slow. Either too many browser tabs are open, or the drive is nearly full.',
    correct: 'Check the free-space figure with every tab shut',
    wrong: ['Time how long the machine takes to start up', 'Note whether it feels slower than it did last month', 'Count how many programs are installed on it'],
    why: 'With the tabs gone, one story predicts a fast machine and the other predicts a slow one. The two answers part company.',
  },
  {
    setup: 'The plant on the windowsill is wilting. Either it needs water, or it is getting too much direct sun.',
    correct: 'Push a finger into the soil and feel how damp',
    wrong: ['Count the leaves that have turned yellow so far', 'Check whether the pot is the right size for it', 'Note how long it has sat on that windowsill'],
    why: 'Dry soil and soaked soil are opposite predictions from the two stories, and a finger settles it in five seconds.',
  },
  {
    setup: 'Your friend has stopped replying quickly. Either they are buried in exams, or something is up between you.',
    correct: 'See whether they are also slow to reply to others',
    wrong: ['Reread your last message for anything harsh', 'Count the days since they last replied fast', 'Check whether they are showing as online in the evenings'],
    why: 'If everyone is waiting, exams explain it; if only you are waiting, exams do not. Nothing else here separates the two.',
  },
  {
    setup: 'The Wi-Fi drops every evening. Either the router overheats, or the network is busy at that hour.',
    correct: 'Try it at two in the morning after a long day on',
    wrong: ['Restart the router and see if it stays on', 'Move the laptop nearer to the router and try again', 'Note the exact minute the drop happens'],
    why: 'Late at night the router is at its hottest and the network is at its quietest, so the two stories predict opposite results.',
  },
  {
    setup: 'Two students gave the same wrong answer. Either they copied, or the question steers everyone that way.',
    correct: 'Count how many other students gave that answer',
    wrong: ['Ask where each of them was sitting in the room', 'Check which of them finished the paper first', 'Compare the handwriting on the two answer sheets'],
    why: 'A steering question produces that answer all over the room; copying produces it in exactly two places.',
  },
  {
    setup: 'Bread from the new bakery goes stale in a day. Either it has no preservatives, or the bag is left open.',
    correct: 'Seal one loaf tightly and leave a second open',
    wrong: ['Read the ingredients printed on the paper bag', 'Ask another customer what they think of the bread', 'Buy a loaf on a different day of the week'],
    why: 'If both loaves go stale together, the bag is not the culprit; if only the open one does, it is. Either result is possible before you look.',
  },
  {
    setup: 'Your 400 m times have improved this term. Either the training is working, or the new track is faster.',
    correct: 'Run one timed lap back on the old track today',
    wrong: ['Compare your times against last term\'s average', 'Ask your coach whether the training plan works', 'Check whether the weather has been warmer'],
    why: 'The old track holds the training constant and changes the surface, which is the only difference the two stories disagree about.',
  },
  {
    setup: 'A shop\'s queue crawls on Saturdays. Either fewer staff work then, or Saturday shoppers buy more.',
    correct: 'Count staff on the tills on Saturday and Tuesday',
    wrong: ['Time how long you personally wait on each visit', 'Ask the person ahead of you how long they waited', 'Note how full the shop looks when you walk in'],
    why: 'Staff numbers are the thing one story claims changes and the other says does not, so counting them splits the two.',
  },
]

const discriminate = tpl(
  {
    id: 'unseen-discriminate',
    name: 'The check that could go either way',
    skillIds: ['o-expect', 'i-hypo'],
    bucket: 'observer',
    difficulty: 3,
    variants: DISCRIMINATE_CASES.length,
    minutes: 2.5,
  },
  (rng, seed) => {
    const c = cycle(seed, DISCRIMINATE_CASES)
    return {
      title: 'Which check separates them?',
      prompt: `${c.setup}\n\nWhich check would actually tell the two apart?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Take each option and ask what you would expect to see under story one, then under story two. If the two expectations match, the check is useless.',
        'A useful check is one where you genuinely do not know the result in advance.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}.** ${c.why}\n\nThe other three feel like investigation because they gather information, and gathering information is what investigating looks like from the outside. But every one of them returns the same answer whichever story is true, so you finish the check believing exactly what you believed before it. A check earns its name only when both results were live.`,
    }
  },
)

interface EitherWayCase {
  test: string
  discriminating: boolean
  why: string
}

const EITHER_WAY_CASES: EitherWayCase[] = [
  {
    test: '"This charm brings good luck. I wore it today and nothing bad happened."',
    discriminating: false,
    why: 'Most days nothing bad happens. The charmless version of today would have looked identical.',
  },
  {
    test: '"I think this key opens the shed. I tried it, and the lock turned."',
    discriminating: true,
    why: 'The lock could have refused to turn. It did not, and that is information you did not have a minute earlier.',
  },
  {
    test: '"The new revision playlist works — I used it and passed the test."',
    discriminating: false,
    why: 'You would probably have passed anyway, and there is no version of this without the playlist to compare against.',
  },
  {
    test: '"I think the kitchen scale reads heavy. I set a sealed 500 g bag on it and it showed 530."',
    discriminating: true,
    why: 'A scale that was fine would have shown 500. The reading picked one of two possible worlds.',
  },
  {
    test: '"Horoscopes are accurate. Mine said I would face a decision today, and I did."',
    discriminating: false,
    why: 'Everyone faces a decision every day, so the prediction was safe before it was made.',
  },
  {
    test: '"I think the back door sets off the alarm. I opened it with everything else shut, and it sounded."',
    discriminating: true,
    why: 'Silence was fully available as an outcome. Getting the noise instead rules one explanation out.',
  },
  {
    test: '"This filter removes everything harmful. The water tastes perfectly clean."',
    discriminating: false,
    why: 'Most things a filter targets have no taste, so the water would taste the same either way.',
  },
  {
    test: '"I think the map app drains my phone. I left it shut all day and the battery fell 6% instead of 40%."',
    discriminating: true,
    why: 'A 40% drop was entirely possible and would have cleared the app. The number that appeared did not.',
  },
]

const confirmsBoth = tpl(
  {
    id: 'unseen-confirms-both',
    name: 'Would it have looked different?',
    skillIds: ['o-expect'],
    bucket: 'observer',
    difficulty: 3,
    variants: EITHER_WAY_CASES.length,
    minutes: 2.5,
    transfer: true,
    calibration: true,
  },
  (rng, seed) => {
    const c = cycle(seed, EITHER_WAY_CASES)
    const correct = c.discriminating
      ? 'Nothing is wrong — a different result was possible'
      : 'No — the same result would have appeared anyway'
    const opposite = c.discriminating
      ? 'No — the same result would have appeared anyway'
      : 'Nothing is wrong — a different result was possible'
    return {
      title: 'Does that count as evidence?',
      prompt: `Somebody tests a belief:\n\n> ${c.test}\n\nDoes the result count as evidence for it?\n\nHalf of these tests are perfectly sound.`,
      answer: mcq(rng, correct, [
        opposite,
        'No — a single try is far too small a sample',
        'Yes — but only once somebody has repeated the whole test',
      ]),
      hints: [
        'Imagine the belief is FALSE. Now replay the test. What would you have seen?',
        'If the false world and the true world produce the same observation, the observation cannot tell them apart.',
        `Worked path: **${correct}**.`,
      ],
      explanation:
        `**${correct}.** ${c.why}\n\n` +
        (c.discriminating
          ? 'The tempting answer is that one try proves nothing. Sample size is a real concern elsewhere, but not here: this test had two possible outcomes and only one of them was compatible with the belief, so a single run genuinely moved the needle.'
          : 'The tempting answer is that the test just needs repeating. Repeating it will not help. A test that returns the same result whether or not the belief is true returns that same useless result every single time you run it.') +
        '\n\nThe question that does the work is not "did it confirm?" but "could it have failed?" — and it is worth asking BEFORE the test, while the answer is still honest.',
    }
  },
)

interface PredictCase {
  claim: string
  model: string
  good: string[]
  weak: string[]
}

const PREDICT_CASES: PredictCase[] = [
  {
    claim: 'This playlist makes me revise better.',
    model:
      'If the playlist made no difference, I would expect the same amount of material covered per hour with it and without it, and quiz scores that sit in the same range either way. So: run a week of revision without it, time the sessions the same way, and compare what got covered.',
    good: ['A week of revision without it, timed alike', 'Quiz scores from sessions with and without it', 'How much of each session went on revising'],
    weak: ['How much I enjoy having the playlist on', 'How often I choose to put the playlist on', 'Whether other people recommend the playlist'],
  },
  {
    claim: 'The bus is always late on Fridays.',
    model:
      'If Fridays were no different, Friday arrival times would sit in the same spread as other weekdays. So: log the arrival time against the timetable for four Fridays and four Tuesdays, and compare the two sets.',
    good: ['Arrival times logged across four Fridays', 'Arrival times logged across four Tuesdays', 'The timetabled arrival time for that stop'],
    weak: ['How annoyed people look at the bus stop', 'How often you personally miss that bus', 'What the driver says about Friday traffic'],
  },
  {
    claim: 'My plant does better on the kitchen windowsill.',
    model:
      'If the spot made no difference, new growth would be the same in both places once light and watering are held steady. So: measure new growth in each spot over equal periods, moving the same plant back and forth rather than comparing two plants.',
    good: ['New growth measured in both spots in turn', 'The same plant moved back for a fortnight', 'Light and watering kept alike in both spots'],
    weak: ['How healthy the plant looks to you today', 'Which of the two spots you prefer to see', 'How long it has been in the kitchen so far'],
  },
  {
    claim: 'This brand of pen skips less than the others.',
    model:
      'If the brands were equal, skips per page would come out roughly level across them on the same paper. So: count skips per page for each brand on identical paper, ideally with the brand hidden while you write.',
    good: ['Skips counted per page for each brand', 'The same paper used for every brand tested', 'A test where you cannot see the brand'],
    weak: ['Which of the pens feels smoothest to hold', 'Which of the brands costs the most per pen', 'Which pen you reach for out of habit'],
  },
  {
    claim: 'The team plays better at home.',
    model:
      'If the venue made no difference, points per match would be similar home and away once opponent strength is accounted for. So: compare points per match across a full season, and check who the opponents were in each set.',
    good: ['Points scored per match, home and away', 'The strength of the opponents in each set', 'Results across a season, not a short run'],
    weak: ['How loud the home crowd usually sounds', 'Which kit the team prefers to play in', 'How the players describe playing at home'],
  },
  {
    claim: 'I sleep less on nights I use screens late.',
    model:
      'If late screens made no difference, sleep length would come out the same on screen nights and non-screen nights. So: log sleep length and bedtime for both kinds of night, and count how many of each you actually have.',
    good: ['Sleep length logged for both kinds of night', 'What time you went to bed on each night', 'How many of each kind of night you logged'],
    weak: ['How tired you feel when you think back', 'How much you enjoy the late-night screens', 'What articles say about screens and sleep'],
  },
]

const predictFirst = tpl(
  {
    id: 'unseen-predict-first',
    name: 'Write the false world first',
    skillIds: ['o-expect', 'i-hypo'],
    bucket: 'observer',
    difficulty: 4,
    variants: PREDICT_CASES.length,
    minutes: 4.5,
    kind: 'multi',
  },
  (rng, seed) => {
    const c = cycle(seed, PREDICT_CASES)
    return {
      title: 'Before you look',
      prompt: `Someone believes:\n\n> ${c.claim}`,
      parts: [
        {
          stage: 'Predict',
          prompt:
            'Before anything is measured, write down what you would expect to see **if this belief were false**. Be concrete — an observation somebody could actually make this week.',
          answer: draft({
            criteria: [
              'A concrete observation, not a feeling ("I would see X", not "it would feel off")',
              'Something that could genuinely be checked within a week',
              'Different from what you would see if the belief were TRUE',
              'Not just the belief with "not" put in front of it',
            ],
            model: c.model,
            minWords: 25,
            placeholder: 'If it were false, I would expect to see… I could check that by…',
          }),
          explanation:
            'Writing the false world down first is the whole exercise, because after the result arrives almost any observation can be made to fit. Nothing here is scored — the graded part is next.',
        },
        {
          stage: 'Select',
          prompt: `Now the graded part. Select **every** observation below that could genuinely come out either way for the belief "${c.claim}".`,
          answer: multi(rng, c.good, c.weak),
          explanation:
            'The three that count are the ones where you could not name the result in advance. The three that do not are all about preference, habit or hearsay — real information about you, and completely silent about the belief. Preference in particular is the trap: liking something and it working are separate facts that usually arrive together.',
          hints: [
            'For each line, ask what you would see if the belief were false. If the answer is "the same thing", leave it unticked.',
            'Anything measuring how you FEEL about the thing will read the same either way.',
            'Exactly three of the six could have gone either way.',
          ],
        },
      ],
      hints: [
        'Start from the false world, not the true one — it is the harder half to imagine and the more useful.',
        'A prediction has to name something observable: a time, a count, a measurement.',
        'The selection at the end is checkable; the writing is for you.',
      ],
      explanation:
        `Model prediction: ${c.model}\n\nThe habit this builds is small and unglamorous: before you look, say out loud what a disappointing result would look like. Anyone who cannot answer that is not about to test anything — they are about to collect agreement.`,
    }
  },
)

/* ==================================================================
 * o-anchor — first numbers and first impressions
 * ================================================================== */

const STRIKE_ITEMS = ['a pair of headphones', 'a second-hand tablet', 'a bike helmet', 'a desk lamp']
/** Indexed alongside STRIKE_ITEMS, so each "was" figure suits its own object. */
const STRIKE_WAS = [120, 200, 80, 60]
const STRIKE_OFF = [25, 40, 50]
const STRIKE_DELTA = [-12, 0, 6]

/**
 * Entry point for `o-anchor`, and deliberately arithmetic rather than
 * conceptual: the advertised discount and the real saving are two different
 * subtractions, and doing both is what makes the gap between them visible.
 * All money is integer cents-free by construction — the discount is applied as
 * `X·d/100` on integers so no binary dust can reach a rendered price.
 */
const strikePrice = tpl(
  {
    id: 'unseen-strike-price',
    name: 'Was, now, and what you actually save',
    skillIds: ['o-anchor', 'm-percent'],
    bucket: 'observer',
    difficulty: 2,
    variants: STRIKE_ITEMS.length * STRIKE_OFF.length * STRIKE_DELTA.length,
    minutes: 3,
    kind: 'multi',
  },
  (rng, seed) => {
    const item = STRIKE_ITEMS[seed % STRIKE_ITEMS.length]
    const off = STRIKE_OFF[Math.floor(seed / STRIKE_ITEMS.length) % STRIKE_OFF.length]
    const delta = STRIKE_DELTA[Math.floor(seed / (STRIKE_ITEMS.length * STRIKE_OFF.length)) % STRIKE_DELTA.length]
    const was = STRIKE_WAS[seed % STRIKE_WAS.length]
    const now = was - Math.round((was * off) / 100)
    const everyday = now + delta
    const verdict =
      delta > 0
        ? `the sale really is ${money(delta)} cheaper than the everyday price`
        : delta === 0
          ? 'the sale price and the everyday price are exactly the same'
          : `the "sale" price is actually ${money(-delta)} MORE than the everyday price`
    return {
      title: 'Read the price twice',
      prompt:
        `A listing for ${item} reads:\n\n> **Was ${money(was)} — now ${money(now)}**\n\n` +
        `Three other shops sell the identical model at ${money(everyday)}, every day, with no sale on.`,
      parts: [
        {
          prompt: 'What percentage discount is the listing advertising? Give a whole number.',
          answer: numeric(off, { unit: '%' }),
          explanation: `The listing takes ${money(was)} down to ${money(now)}, a drop of ${money(was - now)}, and ${money(was - now)} out of ${money(was)} is **${off}%**. That is the number the page wants in your head.`,
          hints: [
            'Work out the drop in dollars first.',
            'Then ask what share of the "was" price that drop is.',
            `Worked path: (${was} − ${now}) ÷ ${was} = ${off / 100}, so ${off}%.`,
          ],
        },
        {
          prompt: `Against the everyday price of ${money(everyday)}, how many dollars does this sale actually save you? Enter a negative number if it saves nothing, and 0 if the two match.`,
          answer: numeric(delta, { unit: 'dollars' }),
          explanation: `${money(everyday)} minus ${money(now)} gives **${delta}**, so ${verdict}. Notice that the ${money(was)} played no part in this calculation at all — it is not a price anyone is charging.`,
          hints: [
            'Compare the sale price against a price that someone is genuinely charging today.',
            'The "was" figure is not one of the two numbers you need.',
            `Worked path: ${everyday} − ${now} = ${delta}.`,
          ],
        },
        {
          prompt: `What job is the ${money(was)} doing on that page?`,
          answer: mcq(
            rng,
            'It sets the number you compare against',
            rotateDecoys(seed, [
              'It records the highest price ever charged for it',
              'It shows what the shop originally paid',
              'It marks the maker\'s recommended price',
              'It is required on every item that is discounted',
              'It proves the discount here is a genuine one',
            ]),
          ),
          explanation:
            '**It sets the number you compare against.** A struck-through price is not an offer; it is a starting point installed in your head so the real price feels like a rescue. The tempting answer is that it records a genuine past price — sometimes it does, but even a truthful "was" is doing this job, and the calculation you just ran needed neither.\n\nThe repair is the same every time: find a price somebody is actually charging today, and compare against that instead.',
          hints: [
            'Ask which of the three numbers on this page you could actually pay.',
            'A number nobody is charging cannot tell you what something is worth.',
            'Worked path: it is a reference point, not a price.',
          ],
        },
      ],
      hints: [
        'There are three numbers here and only two of them are real prices.',
        'Do the advertised discount and the true saving as separate sums — the gap between them is the point.',
        'The last part asks what the struck-out figure is FOR.',
      ],
      explanation:
        `The listing advertises ${off}% off, and against a price anyone is genuinely charging, ${verdict}. Nothing on the page is necessarily a lie. The ${money(was)} simply arrives first and sets the scale everything after it is measured on.\n\nThat effect on estimates is about as well established as anything in this area — it has been reproduced across dozens of separate labs and settings. Resisting it by "trying not to be influenced" is not the move that works; recomputing from a number you found yourself is.`,
    }
  },
)

interface ReanchorCase {
  setup: string
  correct: string
  wrong: string[]
  why: string
}

const REANCHOR_CASES: ReanchorCase[] = [
  {
    setup: 'A classmate offers you $40 for your used bike. You have no idea what it is worth.',
    correct: 'Look up what three similar bikes sold for',
    wrong: ['Counter at $70 and settle somewhere near $55', 'Ask if they can stretch a little above $40', 'Say $40 feels low and wait for a better offer'],
    why: 'Three completed sales give you a range that exists whether or not the $40 was ever said.',
  },
  {
    setup: 'A shop quotes $180 to replace a laptop screen. You do not know the going rate.',
    correct: 'Price the part itself and add a labour rate',
    wrong: ['Ask them to knock $30 off the quoted price', 'Get the quote down to $150 and then accept it', 'Say $180 sounds steep and see what happens'],
    why: 'Part plus labour builds a floor from the ground up, so you find out whether $180 was ever reasonable.',
  },
  {
    setup: 'A project partner says the report should be "about twelve pages". The brief gives no length.',
    correct: 'Count what the brief\'s sections actually need',
    wrong: ['Suggest nine or ten pages as a fair compromise', 'Agree to twelve and cut it back later', 'Ask whether twelve includes the appendix'],
    why: 'The sections determine the length. Twelve was one person\'s guess, and every other option treats it as the origin.',
  },
  {
    setup: 'A ticket page shows the "usual price" as $95 and today\'s price as $68.',
    correct: 'Check what other sellers charge this week',
    wrong: ['Compare it against the $95 usual price', 'Wait and see whether it falls under $60', 'Treat the $27 gap as the size of the deal'],
    why: 'Other sellers this week is a figure the page did not choose, which is the only kind that can check it.',
  },
  {
    setup: 'Someone estimates the science write-up at "maybe twenty minutes?" Nobody has done one before.',
    correct: 'Time one section, then scale up from that',
    wrong: ['Round it up to half an hour to be safe', 'Split the difference and call it fifteen', 'Accept twenty and start work straight away'],
    why: 'One timed section is measured, not guessed, and it produces a total that owes nothing to the twenty.',
  },
  {
    setup: 'A used phone is listed at $310. The seller mentions they paid $600 for it new.',
    correct: 'Search completed listings for that model',
    wrong: ['Offer them half of what they paid for it new', 'Treat $600 as the ceiling and work down', 'Offer $280 and expect to meet near $295'],
    why: 'What the model actually sells for now is the reference class. The $600 is history and the $310 is a hope.',
  },
  {
    setup: 'A fundraising page asks: "would you give $50, or whatever you can manage?"',
    correct: 'Decide from your own monthly giving budget',
    wrong: ['Give $20, a little under what was suggested', 'Give $25 — half of the figure suggested', 'Give $50 because that is the standard ask'],
    why: 'Your own budget is the only figure in the room that was set before the page loaded.',
  },
  {
    setup: 'A coach says the team should aim for "at least fifteen wins" this season.',
    correct: 'Look at what similar teams won last year',
    wrong: ['Aim for fourteen, which feels achievable', 'Take fifteen as the target and push on', 'Ask if fifteen includes friendly matches'],
    why: 'Comparable teams give a range built from results. Fifteen was a sentence, and adjusting from it keeps it in charge.',
  },
]

const reanchor = tpl(
  {
    id: 'unseen-reanchor',
    name: 'Start the sum somewhere else',
    skillIds: ['o-anchor'],
    bucket: 'observer',
    difficulty: 3,
    variants: REANCHOR_CASES.length,
    minutes: 2.5,
    transfer: true,
  },
  (rng, seed) => {
    const c = cycle(seed, REANCHOR_CASES)
    return {
      title: 'Where does your number come from?',
      prompt: `${c.setup}\n\nWhich response gets you to a figure you can defend?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Three of these start from the number you were handed and move away from it. One does not use that number at all.',
        'Ask where each figure would come from if the first number had never been said.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}.** ${c.why}\n\nThe tempting options are the ones that feel like resistance — countering, splitting the difference, holding out for better. Every one of them is still measured from the figure you were given, so the other side chose the ruler and you only chose where on it to stand.\n\nOne caution about the repair, stated plainly: building your own reference class is the single forecasting habit that has been shown to go with better accuracy in trained forecasters, but "notice it and adjust harder" is not, and telling yourself to ignore a number generally does not work. Replace the number; do not wrestle it.`,
    }
  },
)

const IRRELEVANT_TARGETS = [
  { what: 'how many books the school library holds', unit: 'books', low: 1200, high: 4100 },
  { what: 'how many bricks are in the sports hall wall', unit: 'bricks', low: 3400, high: 7800 },
  { what: 'how many minutes of announcements a term contains', unit: 'minutes', low: 210, high: 640 },
  { what: 'how many litres of water the school uses in a day', unit: 'litres', low: 900, high: 2600 },
]
const IRRELEVANT_TICKETS = [
  [12, 86],
  [23, 78],
  [17, 91],
]

const irrelevantNumber = tpl(
  {
    id: 'unseen-irrelevant-number',
    name: 'The number that had nothing to do with it',
    skillIds: ['o-anchor'],
    bucket: 'observer',
    difficulty: 3,
    variants: IRRELEVANT_TARGETS.length * IRRELEVANT_TICKETS.length,
    minutes: 3,
    kind: 'multi',
    calibration: true,
  },
  (rng, seed) => {
    const t = IRRELEVANT_TARGETS[seed % IRRELEVANT_TARGETS.length]
    const [lowTicket, highTicket] = IRRELEVANT_TICKETS[Math.floor(seed / IRRELEVANT_TARGETS.length) % IRRELEVANT_TICKETS.length]
    const gap = t.high - t.low
    return {
      title: 'Two groups, one question',
      prompt:
        `A class runs a demonstration. Everyone is put into one of two groups **at random**, then handed a ticket and asked to copy its number down.\n\n` +
        `Every ticket in Group A reads **${lowTicket}**. Every ticket in Group B reads **${highTicket}**. Both groups are then asked the same question: estimate ${t.what}.\n\n` +
        `Group A's estimates averaged **${t.low} ${t.unit}**. Group B's averaged **${t.high} ${t.unit}**.`,
      parts: [
        {
          prompt: `How far apart are the two groups' average estimates, in ${t.unit}?`,
          answer: numeric(gap, { unit: t.unit }),
          explanation: `${t.high} minus ${t.low} is **${gap} ${t.unit}**. Both groups were asked one identical question about one identical building, in one room, on one afternoon.`,
          hints: [
            'Subtract the smaller average from the larger one.',
            'Both numbers are averages of estimates, so they subtract like ordinary numbers.',
            `Worked path: ${t.high} − ${t.low} = ${gap}.`,
          ],
        },
        {
          prompt: `What is the most likely reason for a gap of ${gap} ${t.unit}?`,
          answer: mcq(
            rng,
            'The ticket numbers pulled the estimates apart',
            rotateDecoys(seed, [
              'Group B happened to include more expert guessers',
              'The question was ambiguous for both of the groups',
              'Estimating this kind of thing is simply unreliable',
              'Group B simply knew more about the building',
              'The two groups were asked different questions',
            ]),
          ),
          explanation:
            '**The ticket numbers pulled the estimates apart.** The tickets were drawn at random, so the two groups should have been alike in every way that matters — and the only thing that differed before the question was the number each group had just written down.\n\nThe tempting answer is that Group B knew more. Random assignment is exactly what rules that out: with people split by raffle ticket, any difference in expertise is chance, and chance does not usually produce a one-way gap this size. "Estimating is unreliable" would predict noise scattered in both directions, not both groups landing near their own tickets.',
          hints: [
            'The tickets were random, so ask what the two groups could possibly differ in.',
            'Compare the direction of the gap against the direction of the tickets.',
            'Worked path: the only prior difference between the groups was the number they wrote down.',
          ],
        },
      ],
      hints: [
        'Start with the arithmetic — the size of the gap is the point.',
        'Then ask what the two groups differed in before the question was asked.',
        'Random assignment is doing quiet work in this setup.',
      ],
      explanation:
        `A number with no bearing on the question, written down moments earlier, dragged the estimates ${gap} ${t.unit} apart. That is the classic shape of an anchoring demonstration, and it is one of the most reliably reproduced results of its kind — repeated across dozens of separate labs and countries with effects as large as the original.\n\nWhat that does NOT mean is that you are helpless. It means that noticing a number is not the same as neutralising it, so the useful response is to build your estimate from something you chose — a count, a comparable case, a rough calculation — rather than to adjust away from whatever arrived first.`,
    }
  },
)

const HAGGLE_CASES = [
  {
    setup: 'You are selling a used bike and you have decided you want $260 for it.',
    unitWord: 'dollars',
    counter: 260,
    pairs: [
      [120, 200],
      [140, 220],
      [160, 240],
      [180, 100],
    ],
  },
  {
    setup: 'You are quoting for a weekend of garden work, and your own figure is $620.',
    unitWord: 'dollars',
    counter: 620,
    pairs: [
      [300, 500],
      [380, 420],
      [420, 300],
      [500, 380],
    ],
  },
  {
    setup: 'A club is agreeing a fundraising target. Your worked-out figure is $110.',
    unitWord: 'dollars',
    counter: 110,
    pairs: [
      [30, 70],
      [50, 90],
      [70, 30],
      [90, 50],
    ],
  },
  {
    setup: 'A group is agreeing how long the weekly meeting runs. Your figure is 36 minutes.',
    unitWord: 'minutes',
    counter: 36,
    pairs: [
      [10, 24],
      [12, 20],
      [20, 10],
      [24, 12],
    ],
  },
]

/**
 * "Split the difference" is the most common fairness rule people reach for, and
 * it is entirely determined by where the other side opened. Running the same
 * midpoint twice against two different openings is the cheapest possible
 * demonstration of that, and it is arithmetic rather than assertion.
 */
const haggleRange = tpl(
  {
    id: 'unseen-anchor-range',
    name: 'Splitting the difference with whom?',
    skillIds: ['o-anchor', 'm-stats'],
    bucket: 'observer',
    difficulty: 4,
    variants: HAGGLE_CASES.length * 4,
    minutes: 4,
    kind: 'multi',
  },
  (rng, seed) => {
    const c = HAGGLE_CASES[seed % HAGGLE_CASES.length]
    const [openA, openB] = c.pairs[Math.floor(seed / HAGGLE_CASES.length) % c.pairs.length]
    const midA = (openA + c.counter) / 2
    const midB = (openB + c.counter) / 2
    const shift = Math.abs(midA - midB)
    return {
      title: 'The midpoint moves',
      prompt: `${c.setup}\n\nThe other side opens at **${openA}**. You hold at **${c.counter}**, and somebody proposes splitting the difference.`,
      parts: [
        {
          prompt: `Splitting the difference between ${openA} and ${c.counter}, what figure results?`,
          answer: numeric(midA, { unit: c.unitWord }),
          explanation: `(${openA} + ${c.counter}) ÷ 2 = **${midA}**. That is what "meeting in the middle" produces, given where the other side chose to start.`,
          hints: [
            'The midpoint of two numbers is their total divided by two.',
            `Add ${openA} and ${c.counter} first.`,
            `Worked path: (${openA} + ${c.counter}) ÷ 2 = ${midA}.`,
          ],
        },
        {
          prompt: `Now rewind. Suppose they had opened at **${openB}** instead, and you had held at exactly the same ${c.counter}. What would splitting the difference give now?`,
          answer: numeric(midB, { unit: c.unitWord }),
          explanation: `(${openB} + ${c.counter}) ÷ 2 = **${midB}**. Your figure never moved, the thing being agreed never changed, and the "fair middle" landed ${shift} ${c.unitWord} away from where it landed before.`,
          hints: [
            'Same method, one different number.',
            `Add ${openB} and ${c.counter}.`,
            `Worked path: (${openB} + ${c.counter}) ÷ 2 = ${midB}.`,
          ],
        },
        {
          prompt: 'What do those two midpoints show?',
          answer: mcq(
            rng,
            'The midpoint moves with the opening figure',
            rotateDecoys(seed, [
              'Splitting the difference is always a fair method',
              'The counter figure was set far too high here',
              'Both sides simply valued the thing apart',
              'The two sides were never going to agree',
              'Whoever holds out longest gets the better deal',
            ]),
          ),
          explanation:
            `**The midpoint moves with the opening figure.** Splitting the difference sounds neutral, and it is not: whoever names the first number chooses one of the two endpoints, and so gets to choose the middle. Between the two versions here, the same fair-sounding rule produced answers ${shift} ${c.unitWord} apart.\n\nThe tempting option is that splitting the difference is fair. It is fair in one specific case — when both opening figures were reached honestly. It stops being fair the instant one side picks its opening with the midpoint in mind.\n\nThe repair is not to refuse the method. It is to work out your own figure before you hear theirs, and to check the midpoint against that figure rather than against their opening.`,
          hints: [
            'Compare what changed between the two calculations and what did not.',
            'Your own number stayed put in both versions.',
            'Worked path: only their opening changed, and the middle changed with it.',
          ],
        },
      ],
      hints: [
        'Both parts are one addition and one halving.',
        'Watch which of the three numbers changes between the two parts.',
        'The last part asks what the pair of answers demonstrates.',
      ],
      explanation:
        `Same goods, same person, same figure from you — and "meet in the middle" produced ${midA} in one version and ${midB} in the other, ${shift} ${c.unitWord} apart. The opening number is not an opinion about value that you then negotiate against; it is one endpoint of the range you have agreed to argue inside.\n\nThe practical move is to fix your own number, in writing, before the conversation. Then a midpoint is something you can check rather than something you inherit.`,
    }
  },
)

/* ==================================================================
 * o-frame — same fact, different framing
 * ================================================================== */

const FRAME_PAIRS = [
  { subject: 'A leaflet about a routine operation reports', pre: 'a survival rate of', post: '', ask: 'what percentage did not survive' },
  { subject: 'A snack packet reports', pre: 'that the snack is', post: ' fat free', ask: 'what percentage of it is fat' },
  { subject: 'A rail company reports', pre: 'that', post: ' of trains arrived on time', ask: 'what percentage arrived late' },
  { subject: 'A course page reports', pre: 'a pass rate of', post: '', ask: 'what percentage did not pass' },
  { subject: 'A hire company reports', pre: 'that', post: ' of the deposit is refunded', ask: 'what percentage is kept' },
]
const FRAME_PCTS = [96, 88, 75, 99]

/**
 * The entry point for the whole unit (1 star). One subtraction, and the entire
 * lesson lives in noticing that both sentences are the same measurement.
 */
const frameConvert = tpl(
  {
    id: 'unseen-frame-convert',
    name: 'Say it the other way round',
    skillIds: ['o-frame', 'm-percent'],
    bucket: 'observer',
    difficulty: 1,
    variants: FRAME_PAIRS.length * FRAME_PCTS.length,
    minutes: 1.5,
  },
  (_rng, seed) => {
    const pair = FRAME_PAIRS[seed % FRAME_PAIRS.length]
    const pct = FRAME_PCTS[Math.floor(seed / FRAME_PAIRS.length) % FRAME_PCTS.length]
    const answer = 100 - pct
    return {
      title: 'The same number, flipped',
      prompt: `${pair.subject} **${pair.pre} ${pct}%${pair.post}**.\n\nStated the other way round, ${pair.ask}? Give a whole number.`,
      answer: numeric(answer, { unit: '%' }),
      hints: [
        'The two ways of saying it have to cover everybody between them.',
        'So the two percentages add up to 100.',
        `Worked path: 100 − ${pct} = ${answer}.`,
      ],
      explanation:
        `**${answer}%.** The two sentences report one measurement. Nothing was recounted between them.\n\nThat is worth sitting with, because the two versions do not land the same way: ${pct}% is the sentence somebody prints when they want you calm, and ${answer}% is the sentence somebody prints when they want you worried. Both are true, and choosing which one to show you is a choice being made on your behalf. The habit worth building is to do this subtraction automatically whenever a percentage arrives, and see whether your reaction survives the flip.`,
    }
  },
)

const SAME_CONTEXTS = [
  { total: 200, noun: 'club members', act: 'renewed', notAct: 'did not renew' },
  { total: 400, noun: 'ticket holders', act: 'turned up', notAct: 'did not turn up' },
  { total: 500, noun: 'saplings planted', act: 'survived the winter', notAct: 'did not survive' },
  { total: 250, noun: 'entries submitted', act: 'were complete', notAct: 'were incomplete' },
]
/** Chosen so both the true share and the flipped share are whole percentages. */
const SAME_FRACTIONS = [20, 40]
const SAME_KINDS = ['same', 'flipped', 'wrongbase'] as const

const frameSame = tpl(
  {
    id: 'unseen-frame-same',
    name: 'Do these two say the same thing?',
    skillIds: ['o-frame', 'm-percent'],
    bucket: 'observer',
    difficulty: 2,
    variants: SAME_CONTEXTS.length * SAME_FRACTIONS.length * SAME_KINDS.length,
    minutes: 2.5,
    calibration: true,
  },
  (rng, seed) => {
    const ctx = SAME_CONTEXTS[seed % SAME_CONTEXTS.length]
    const notPct = SAME_FRACTIONS[Math.floor(seed / SAME_CONTEXTS.length) % SAME_FRACTIONS.length]
    const kind = SAME_KINDS[Math.floor(seed / (SAME_CONTEXTS.length * SAME_FRACTIONS.length)) % SAME_KINDS.length]
    const notCount = (ctx.total * notPct) / 100
    const didCount = ctx.total - notCount
    // Statement B's figure, by kind: correct, the other side's share, or the
    // right count divided by the wrong total.
    const shown =
      kind === 'same' ? notPct : kind === 'flipped' ? 100 - notPct : Math.round((notCount / didCount) * 100)
    const keys = {
      same: 'Nothing is wrong — both state the very same fact',
      flipped: 'They differ — the second counts the wrong side',
      wrongbase: 'They differ — the second divides by the wrong total',
    }
    const correct = keys[kind]
    const options = [keys.same, keys.flipped, keys.wrongbase, 'They differ — the second has been rounded far too crudely']
    return {
      title: 'One fact, two sentences',
      prompt:
        `**Statement A:** Of the ${ctx.total} ${ctx.noun}, ${didCount} ${ctx.act}.\n\n` +
        `**Statement B:** ${shown}% ${ctx.notAct}.\n\n` +
        'Do the two statements report the same fact? Work it out rather than eyeballing it.',
      answer: mcq(rng, correct, options.filter((o) => o !== correct)),
      hints: [
        `Start from Statement A: how many of the ${ctx.total} ${ctx.notAct}?`,
        `Turn that count into a percentage of ${ctx.total}, then compare it against the ${shown}% in Statement B.`,
        `Worked path: ${notCount} of ${ctx.total} is ${notPct}%, against B's ${shown}%. **${correct}**`,
      ],
      explanation:
        `From Statement A: ${ctx.total} − ${didCount} = ${notCount} ${ctx.notAct}, and ${notCount} out of ${ctx.total} is **${notPct}%**. Statement B says ${shown}%. ${correct}.\n\n` +
        (kind === 'same'
          ? 'These two really are one fact in two costumes, and saying so is the right answer. That matters: if you learn to distrust every restatement, you lose the ability to check one — and checking is a subtraction and a division, not a suspicion.'
          : kind === 'flipped'
            ? `The trap is that ${shown}% is a real figure from this data — it is the share who ${ctx.act}. Attaching it to the opposite verb is the commonest framing error there is, and it survives because both numbers look like they belong.`
            : `The trap is that B divided ${notCount} by ${didCount} instead of by ${ctx.total} — it compared the ${ctx.notAct} group against the ${ctx.act} group rather than against everybody. That kind of figure is legitimate in its own right, but it is not the percentage the sentence claims to be reporting.`),
    }
  },
)

interface RestateCase {
  fact: string
  correct: string
  wrong: [text: string, note: string, tag: ErrorTag][]
}

const RESTATE_CASES: RestateCase[] = [
  {
    fact: 'In the trial, head injuries fell from 8 riders in 100 to 2 riders in 100.',
    correct: 'Six fewer riders in a hundred were hurt',
    wrong: [
      ['Helmets cut head injuries by six per cent', 'Percentage points read as percentages — the drop was six points.', 'representation'],
      ['Three in four riders avoided a head injury', 'The relative drop of three-quarters mistaken for a rate.', 'representation'],
      ['Only two riders in the trial were injured', 'The per-hundred rate quietly dropped from the sentence.', 'misread'],
    ],
  },
  {
    fact: 'Nine in ten students finished the new lunch.',
    correct: 'One student in ten left food on the plate',
    wrong: [
      ['Nine in ten students liked the new lunch', 'Finishing swapped for enjoying, which was never measured.', 'inference'],
      ['The new lunch was finished 90% more often', 'A level turned into a comparison with nothing to compare.', 'representation'],
      ['Ten per cent of the lunch went uneaten', 'Students counted as if they were portions of food.', 'representation'],
    ],
  },
  {
    fact: 'Of the 40 club members, 30 renewed.',
    correct: 'One quarter of the members did not renew',
    wrong: [
      ['Renewals rose by three quarters this year', 'A share reported as a change over time.', 'representation'],
      ['Thirty members out of a hundred renewed', 'The base swapped from 40 to 100.', 'representation'],
      ['Three in four members joined this year', 'Renewing quietly became joining.', 'misread'],
    ],
  },
  {
    fact: 'There is a 30% chance of rain on each day this weekend.',
    correct: 'Seven days in ten like these stay dry',
    wrong: [
      ['It will rain for 30% of the weekend', 'A chance read as a duration.', 'concept'],
      ['There is a 60% chance across the two days', 'Two probabilities added instead of combined.', 'concept'],
      ['Rain is more likely than not this weekend', 'A minority chance read as the favourite.', 'concept'],
    ],
  },
  {
    fact: 'The battery keeps 80% of its capacity after two years.',
    correct: 'After two years a fifth of capacity is gone',
    wrong: [
      ['The battery loses 80% of its charge in two years', 'Kept swapped for lost, and capacity for charge.', 'misread'],
      ['The battery lasts 80% as long as two years', 'The percentage attached to time instead of capacity.', 'representation'],
      ['It holds a full charge for the first two years', 'A gradual decline read as a cliff at year two.', 'concept'],
    ],
  },
  {
    fact: 'Attendance was 96% last term.',
    correct: 'Four days in a hundred were missed',
    wrong: [
      ['Ninety-six students attended every single day', 'A rate read as a headcount.', 'representation'],
      ['Attendance rose by 96% over the term', 'A level read as a change.', 'representation'],
      ['Four per cent of students never attended', 'Days swapped for students.', 'representation'],
    ],
  },
  {
    fact: 'The team won 12 of its 20 matches.',
    correct: 'The team failed to win eight matches',
    wrong: [
      ['The team lost eight of its twenty matches', 'Draws quietly counted as losses.', 'inference'],
      ['The team won twelve per cent of its matches', 'A count read as a percentage.', 'representation'],
      ['The team\'s win rate rose to three fifths', 'A level read as a change.', 'representation'],
    ],
  },
  {
    fact: 'The charger reaches 50% in twenty minutes.',
    correct: 'Twenty minutes gives half a full battery',
    wrong: [
      ['A full charge takes about forty minutes', 'Charging assumed to run at a constant rate.', 'concept'],
      ['It charges 50% faster than the older model', 'A level restated as a comparison.', 'representation'],
      ['Half the chargers reach full in twenty minutes', 'The percentage attached to chargers, not charge.', 'representation'],
    ],
  },
]

const frameRestate = tpl(
  {
    id: 'unseen-frame-restate',
    name: 'The restatement that survives',
    skillIds: ['o-frame'],
    bucket: 'observer',
    difficulty: 3,
    variants: RESTATE_CASES.length,
    minutes: 2.5,
  },
  (rng, seed) => {
    const c = cycle(seed, RESTATE_CASES)
    const { answer, distractorNotes, distractorTags } = mcqNoted(rng, c.correct, c.wrong)
    return {
      title: 'Which restatement is still true?',
      prompt: `A report states:\n\n> ${c.fact}\n\nWhich of these says the same thing?`,
      answer,
      distractorNotes,
      distractorTags,
      hints: [
        'Check three things in each option: what is being counted, what it is being counted out of, and whether it is a level or a change.',
        'A restatement may flip the sentence around, but it cannot change the base, the unit, or the verb.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}.**\n\nEvery wrong option here is one substitution away from being right, which is exactly why they work: they keep the original number and quietly change what it is a number OF. Swapping the base, swapping a level for a change, or swapping the thing being counted are the three moves to check for, in that order, every time.`,
    }
  },
)

interface ComparisonCase {
  claim: string
  correct: string
  wrong: string[]
  why: string
}

const COMPARISON_CASES: ComparisonCase[] = [
  {
    claim: 'Skipping breakfast triples your chance of an afternoon slump.',
    correct: 'The chance for people who do eat breakfast',
    wrong: ['The share of people who skip breakfast', 'The total number of people in the survey group', 'The chance measured across everyone'],
    why: '"Triples" needs a starting chance. Tripling something tiny is still tiny, and tripling something common is serious — and the sentence never says which it was.',
  },
  {
    claim: 'Our filter removes four times more sediment.',
    correct: 'The rival product it is measured against',
    wrong: ['The amount of sediment in the water beforehand', 'The size of the filter\'s own cartridge', 'How long the filter has been in use'],
    why: 'Four times more than what? Without the other filter named, the number can be true against anything, including a filter nobody buys.',
  },
  {
    claim: 'The new route is twenty per cent faster.',
    correct: 'The old route, timed the same way',
    wrong: ['The speed limit along the new route', 'The distance the new route covers', 'The time of day the timing was done'],
    why: 'Faster is a comparison, and the sentence supplies only one side of it. Timing the old route the same way is the missing half.',
  },
  {
    claim: 'Twice as many students chose the science trip.',
    correct: 'The number who chose the other trip',
    wrong: ['The number of students in the whole year group', 'The number of places on each trip', 'The number who chose neither trip'],
    why: 'Twice as many as the other trip could mean 40 against 20 or 4 against 2. Without the second figure the word "twice" is decoration.',
  },
  {
    claim: 'Absences are down forty per cent since the new start time.',
    correct: 'The absence level before the change',
    wrong: ['The absence level at other schools', 'The number of school days in a term', 'The share of absences that were illness'],
    why: 'Down forty per cent from what? A drop from 10% to 6% and a drop from 2% to 1.2% are both forty per cent and mean very different things.',
  },
  {
    claim: 'This bar has thirty per cent less sugar.',
    correct: 'The bar it is being compared against',
    wrong: ['The total weight of the bar itself', 'The sugar limit set by the label rules', 'The amount of sugar people should eat'],
    why: 'Less than the same brand\'s old recipe, less than a rival, or less than a cake? All three are "less", and only one of them is news.',
  },
  {
    claim: 'It was the most popular choice in our survey.',
    correct: 'What the other choices actually scored',
    wrong: ['How the survey questions were worded', 'When the survey was actually carried out', 'Who paid for the survey to be run'],
    why: 'Most popular of three near-ties is a different fact from most popular by a mile, and the word covers both without distinguishing them.',
  },
  {
    claim: 'Sales doubled after the redesign.',
    correct: 'The sales figure before the redesign',
    wrong: ['The cost of running the redesign', 'The number of new customers gained since then', 'The month the redesign went live'],
    why: 'Doubling from four to eight is a sentence anybody can write. The starting figure decides whether doubling is an achievement or a rounding error.',
  },
]

const frameComparison = tpl(
  {
    id: 'unseen-frame-comparison',
    name: 'Half a comparison',
    skillIds: ['o-frame'],
    bucket: 'observer',
    difficulty: 4,
    variants: COMPARISON_CASES.length,
    minutes: 2.5,
    transfer: true,
    calibration: true,
  },
  (rng, seed) => {
    const c = cycle(seed, COMPARISON_CASES)
    return {
      title: 'Than what?',
      prompt: `An advert reads:\n\n> ${c.claim}\n\nWhat is missing before that number tells you anything?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Read the sentence again and find the word doing the comparing.',
        'A comparison needs two figures. Count how many the sentence actually gives you.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}.** ${c.why}\n\nThe other options are all real questions worth asking, which is what makes them tempting — but none of them is the second half of the comparison. That is the specific gap here: the sentence performs a subtraction or a multiplication in front of you and shows you only one of the two numbers it used.`,
    }
  },
)

/* ==================================================================
 * o-claimtype — fact, judgement, or guess
 * ================================================================== */

const CLAIM_CATEGORIES = ['Measured fact', 'Reasoned judgement', 'Speculation']

interface PassageCase {
  label: string
  passage: string
  statements: { text: string; category: number }[]
}

const PASSAGES: PassageCase[] = [
  {
    label: 'FIELD LOG — pond survey',
    passage:
      'We counted 41 tadpoles in the north pond and 6 in the south pond. Water temperature read 14°C north and 11°C south. Both ponds were netted for ten minutes with the same net. The north pond is shaded by trees for most of the afternoon.',
    statements: [
      { text: '41 tadpoles were counted in the north pond', category: 0 },
      { text: 'Both ponds were netted for ten minutes', category: 0 },
      { text: 'The temperature difference is part of why the counts differ', category: 1 },
      { text: 'The south pond will catch up by August', category: 2 },
      { text: 'Frogs prefer shaded water', category: 2 },
    ],
  },
  {
    label: 'TOWN NEWS — library hours',
    passage:
      'The library extended its opening hours to 8 pm in March. Borrowing for April came to 2,310 items, against 1,870 in April last year. The librarian says the evening desk is busiest between 6 and 7 pm. A second branch is considering the same change.',
    statements: [
      { text: 'April borrowing came to 2,310 items', category: 0 },
      { text: 'The longer hours account for at least part of the rise', category: 1 },
      { text: 'The rise is larger than an ordinary year-to-year wobble', category: 1 },
      { text: 'Borrowing will keep rising all year', category: 2 },
      { text: 'The second branch will see the same effect', category: 2 },
    ],
  },
  {
    label: 'PRODUCT PAGE — desk lamp',
    passage:
      'The lamp draws 6 watts and puts out 450 lumens. In our test room it lit an A4 page to 320 lux at 40 cm. The arm held position through 200 tested bends. Buyers tell us it makes late work easier.',
    statements: [
      { text: 'The lamp draws 6 watts', category: 0 },
      { text: 'The arm held position through 200 bends', category: 0 },
      { text: 'It is bright enough for close reading at that distance', category: 1 },
      { text: 'The arm is unlikely to sag in ordinary use', category: 1 },
      { text: 'It will still be working in ten years', category: 2 },
    ],
  },
  {
    label: 'NOTICE — canteen times',
    passage:
      'From Monday the canteen opens at 12:05 instead of 12:20. Last term the average queue ran 11 minutes. The kitchen has added a second serving point. We expect shorter queues.',
    statements: [
      { text: 'The canteen will open at 12:05 from Monday', category: 0 },
      { text: 'Last term the average queue ran 11 minutes', category: 0 },
      { text: 'Two serving points should move a queue faster than one', category: 1 },
      { text: 'Nobody will wait more than five minutes', category: 2 },
      { text: 'Students will eat more vegetables now', category: 2 },
    ],
  },
  {
    label: 'WEATHER LOG — monthly summary',
    passage:
      'Rainfall for the month totalled 84 mm across 12 rainy days. The wettest day gave 31 mm. The stream gauge rose 40 cm that day and fell back within 48 hours. The gauge has been in place since 2019.',
    statements: [
      { text: 'The month\'s rainfall totalled 84 mm', category: 0 },
      { text: 'The 31 mm day is what drove the gauge spike', category: 1 },
      { text: 'Most of the month\'s rain fell on a few days', category: 1 },
      { text: 'Next month will be drier than this one', category: 2 },
      { text: 'The stream will flood if 40 mm falls', category: 2 },
    ],
  },
  {
    label: 'MATCH REPORT — home fixture',
    passage:
      'The team took 14 shots to the visitors\' 5 and won 2–0. Both goals came in the second half. Two regular defenders were unavailable. The team has now won four home matches in a row.',
    statements: [
      { text: 'The team took 14 shots to the visitors\' 5', category: 0 },
      { text: 'Two regular defenders did not play', category: 0 },
      { text: 'The team controlled most of the play', category: 1 },
      { text: 'The result did not depend on a full-strength defence', category: 1 },
      { text: 'The visitors will finish the season bottom', category: 2 },
    ],
  },
  {
    label: 'MUSEUM LABEL — clay bowl',
    passage:
      'This bowl was found in a pit beneath the old market square. Its clay matches deposits 6 km upriver. Similar bowls from three nearby sites date to the same century. No maker\'s mark survives.',
    statements: [
      { text: 'No maker\'s mark survives on the bowl', category: 0 },
      { text: 'The clay matches deposits 6 km upriver', category: 0 },
      { text: 'The bowl was probably made in this region', category: 1 },
      { text: 'The bowl belonged to a wealthy family', category: 2 },
      { text: 'The market square was a trading centre', category: 2 },
    ],
  },
  {
    label: 'TEST KITCHEN — oven temperature',
    passage:
      'We baked the same dough at 200°C and at 230°C, six loaves each. The 230°C loaves browned in 22 minutes, the 200°C loaves in 34. Crumb moisture measured 41% and 44%. Every loaf used flour from one sack.',
    statements: [
      { text: 'Six loaves were baked at each temperature', category: 0 },
      { text: 'The hotter oven dries the crumb a little', category: 1 },
      { text: 'Browning time is what the temperature mainly changed', category: 1 },
      { text: 'Home ovens will give the same result', category: 2 },
      { text: 'The 230°C loaves taste better', category: 2 },
    ],
  },
]

const claimtypeSort = tpl(
  {
    id: 'unseen-claimtype-sort',
    name: 'Measured, concluded, or supposed',
    skillIds: ['o-claimtype'],
    bucket: 'observer',
    difficulty: 2,
    variants: PASSAGES.length,
    minutes: 3.5,
    calibration: true,
  },
  (rng, seed) => {
    const p = cycle(seed, PASSAGES)
    return {
      title: 'Sort the claims',
      prompt:
        `**${p.label}**\n\n> ${p.passage}\n\nSort each statement.\n\n` +
        '**Measured fact** = the text records it directly. **Reasoned judgement** = the text does not say it, but its own findings support it. **Speculation** = nothing measured here bears on it.',
      answer: classify(rng, CLAIM_CATEGORIES, p.statements),
      hints: [
        'For a measured fact, point at the words. If your finger lands on a number or a plain statement in the text, it is measured.',
        'For the rest, ask whether the findings in this text push you towards it. If they do, it is a judgement; if they are silent, it is speculation.',
        `Worked path: ${p.statements.map((s) => `"${s.text.slice(0, 30)}…" → ${CLAIM_CATEGORIES[s.category]}`).join('; ')}.`,
      ],
      explanation:
        `${p.statements.map((s) => `**${CLAIM_CATEGORIES[s.category]}**: ${s.text}`).join('. ')}.\n\n` +
        'The line that catches people is between judgement and speculation, and the test for it is single: does anything actually measured in THIS text move you towards the claim? A judgement leans on the findings and would change if the findings changed. A speculation would survive any findings at all, which is another way of saying it rests on none of them.\n\nA judgement is not a weaker fact — it is a different kind of claim, and a good report is full of them. What matters is that it is labelled, so a reader can check the step from the measurement to the conclusion instead of swallowing both together.',
    }
  },
)

const ONE_LINERS = [
  {
    context: 'A report describes weighing the school recycling bins every Friday for six weeks.',
    line: 'The bins held 38 kg in week one and 61 kg in week six.',
    category: 0,
  },
  {
    context: 'A report describes weighing the school recycling bins every Friday for six weeks.',
    line: 'The posters put up in week two are part of why the weight rose.',
    category: 1,
  },
  {
    context: 'A report describes weighing the school recycling bins every Friday for six weeks.',
    line: 'By next year the school will recycle everything it can.',
    category: 2,
  },
  {
    context: 'A cycling club logged every member\'s commute for a month.',
    line: 'Members rode 2,140 km between them over the month.',
    category: 0,
  },
  {
    context: 'A cycling club logged every member\'s commute for a month.',
    line: 'The rainy fortnight accounts for most of the missing rides.',
    category: 1,
  },
  {
    context: 'A cycling club logged every member\'s commute for a month.',
    line: 'Cycling will eventually replace the school bus route.',
    category: 2,
  },
  {
    context: 'A shop tested two till layouts for a fortnight each.',
    line: 'The second layout served 18% more customers an hour.',
    category: 0,
  },
  {
    context: 'A shop tested two till layouts for a fortnight each.',
    line: 'The wider aisle is doing most of that work.',
    category: 1,
  },
  {
    context: 'A shop tested two till layouts for a fortnight each.',
    line: 'Customers will start doing their weekly shop here.',
    category: 2,
  },
  {
    context: 'A weather station logged wind speed hourly for a year. The mast is rated to 120 km/h.',
    line: 'The highest hourly reading was 74 km/h.',
    category: 0,
  },
  {
    context: 'A weather station logged wind speed hourly for a year. The mast is rated to 120 km/h.',
    line: 'The mast was never close to its rated limit.',
    category: 1,
  },
  {
    context: 'A weather station logged wind speed hourly for a year. The mast is rated to 120 km/h.',
    line: 'Next winter will bring a stronger gust than this one.',
    category: 2,
  },
]

const CLAIM_OPTIONS = [
  'Measured fact — it reports what was recorded',
  'Reasoned judgement — it follows from findings',
  'Speculation — nothing measured supports it',
]

const claimtypeOne = tpl(
  {
    id: 'unseen-claimtype-one',
    name: 'One sentence, three boxes',
    skillIds: ['o-claimtype'],
    bucket: 'observer',
    difficulty: 2,
    variants: ONE_LINERS.length,
    minutes: 1.5,
  },
  (rng, seed) => {
    const c = cycle(seed, ONE_LINERS)
    const correct = CLAIM_OPTIONS[c.category]
    const wrong = CLAIM_OPTIONS.filter((o) => o !== correct)
    return {
      title: 'Which kind of claim?',
      prompt: `${c.context}\n\nOne sentence from it reads:\n\n> ${c.line}\n\nWhich kind of claim is that?`,
      answer: mcq(rng, correct, [...wrong, 'Opinion — it states a preference rather than a fact']),
      hints: [
        'Measured means the sentence reports a reading, a count or a date that somebody took down.',
        'If it is not measured, ask whether the study\'s own findings push towards it. Support makes it a judgement; silence makes it speculation.',
        `Worked path: **${correct}**.`,
      ],
      explanation:
        `**${correct}.**\n\n` +
        (c.category === 0
          ? 'It reports a number that somebody wrote down. The temptation is to call it a judgement because it sits inside an argument — but the sentence itself asserts only the reading.'
          : c.category === 1
            ? 'It goes past the readings while resting on them: change the findings and this sentence changes with them. That dependence is what separates a judgement from a guess, and it is why a judgement can be argued with.'
            : 'Nothing here was measured that bears on it. Note that it may well turn out to be true — speculation is not the same as wrong, it means the text has given you no reason either way.') +
        '\n\nThe permanent fourth option, "opinion", is never the answer in this item and is worth knowing for that reason. An opinion states a preference ("I like the wider aisle"). An unsupported prediction states a fact about the future with nothing behind it. They feel similar and they fail differently.',
    }
  },
)

interface UpgradeCase {
  finding: string
  claim: string
  correct: string
  wrong: string[]
  why: string
}

const UPGRADE_CASES: UpgradeCase[] = [
  {
    finding: 'Over six weeks, the class given a five-minute recap at the start of each lesson scored 8 points higher on the end-of-unit test than the class without one.',
    claim: 'Recaps make students smarter.',
    correct: 'On this unit, the recap was worth about 8 points',
    wrong: ['Recaps probably make students a bit smarter', 'The recap class simply scored 8 more points overall', 'Recaps raise test scores in every subject there is'],
    why: 'It ties the size of the effect to the thing that was actually measured, and it stops at the unit that was tested.',
  },
  {
    finding: 'Of 60 plants, the 30 watered every third day grew 4 cm taller in a month than the 30 watered daily.',
    claim: 'Plants like being left alone.',
    correct: 'Less frequent watering suited these plants better',
    wrong: ['Plants in general do better with far less attention', 'The two groups of plants ended 4 cm apart', 'Daily watering does harm to plants of every single kind'],
    why: 'It states what the comparison showed, about the plants in the comparison, and claims nothing about plants in general.',
  },
  {
    finding: 'Across a fortnight of testing, the self-checkout served 22 customers an hour against the staffed till\'s 17.',
    claim: 'Machines are better than people at this.',
    correct: 'Self-checkout was the faster option in this shop',
    wrong: ['Machines beat human staff for speed in most shops', 'The self-checkout served 22 an hour here', 'Staffed tills are simply too slow to be worth having'],
    why: 'It names the one dimension that was measured — speed — in the one place it was measured.',
  },
  {
    finding: 'Attendance at the 8:50 start averaged 94%; under the old 8:20 start it averaged 88%.',
    claim: 'Teenagers need to sleep in.',
    correct: 'The later start went with better attendance',
    wrong: ['Later starts fix attendance at every single school', 'Attendance moved from 88% up to 94% here', 'Teenagers probably do need a later start'],
    why: 'It reports the association without asserting the cause, which is all a before-and-after comparison can carry.',
  },
  {
    finding: 'Across 20 matches the team scored 2.1 goals a game at home and 0.9 away.',
    claim: 'The crowd wins them games.',
    correct: 'Something about home matches helps this team',
    wrong: ['Crowd noise is what wins the home games', 'The team scored 2.1 at home and 0.9 away', 'Home advantage is a real thing across every sport'],
    why: 'It commits to the pattern being real and stays honest about not knowing which part of "home" is doing it.',
  },
  {
    finding: 'A month of logs: on nights with screens after 10 pm sleep averaged 6.4 hours; on other nights, 7.6.',
    claim: 'Screens damage your brain.',
    correct: 'Late screens went with about an hour less sleep',
    wrong: ['Screens after ten are bad for almost anyone\'s health', 'Sleep averaged 6.4 hours on the screen nights', 'Screens are the cause of the shorter nights'],
    why: 'It reports the size of the gap and the fact that the two went together, which is what a log can show.',
  },
  {
    finding: 'Of 400 survey replies, 268 said the new bus stop is easier to reach and 132 said it is not.',
    claim: 'Everyone likes the new stop.',
    correct: 'About two in three of those who replied prefer it',
    wrong: ['Nearly everybody around here prefers the new bus stop', '268 people out of 400 said it is easier', 'The old stop was hard for most to reach'],
    why: 'It gives the proportion and keeps the group it applies to — the people who replied — attached to the number.',
  },
  {
    finding: 'A test kitchen baked 24 loaves: those rested 30 minutes rose 2 cm higher than those baked at once.',
    claim: 'Resting dough is the secret to good baking.',
    correct: 'A 30-minute rest helped these loaves rise',
    wrong: ['Resting dough is what makes any bread good', 'The rested loaves rose 2 cm higher here', 'Bread must always be rested before baking'],
    why: 'It names the treatment, the effect and the loaves it was seen in, and claims nothing about baking as a whole.',
  },
]

const claimtypeUpgrade = tpl(
  {
    id: 'unseen-claimtype-upgrade',
    name: 'Turn the guess into a judgement',
    skillIds: ['o-claimtype'],
    bucket: 'observer',
    difficulty: 3,
    variants: UPGRADE_CASES.length,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, UPGRADE_CASES)
    return {
      title: 'Rewrite it so the findings can carry it',
      prompt: `**Finding:** ${c.finding}\n\nSomeone writes: "${c.claim}"\n\nWhich rewrite turns that into a claim the finding can actually support?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'A judgement has to lean on the finding: change the numbers and the sentence should change too.',
        'Two failures to watch for — a sentence that still reaches past the data even with "probably" in it, and a sentence that retreats to just repeating the measurement.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation:
        `**${c.correct}.** ${c.why}\n\nThe three wrong answers are the three ways this normally goes. One hedges the original guess without shrinking it — "probably" and "a bit" change the tone and not the reach. One over-generalises to every subject, every shop, every plant, when one comparison was run in one place. And one retreats all the way back to restating the measurement, which is safe and is not a judgement at all: it adds nothing a reader could disagree with.\n\nA reasoned judgement lives between those. It says more than the numbers and stays inside what they can hold up.`,
    }
  },
)

interface HeadlineCase {
  headline: string
  piece: string
  statements: { text: string; category: number }[]
  ask: string
  basis: string
  others: string[]
  why: string
}

const HEADLINE_CASES: HeadlineCase[] = [
  {
    headline: 'NEW LIGHTS MAKE THE RIVER PATH SAFE AT NIGHT',
    piece:
      'The council fitted 22 lamps along the river path in September. Reported trips and falls on the path fell from 19 last winter to 6 this winter. Use of the path after 6 pm rose by about a third on the gate counter. A resident said the path feels completely different now. The council plans the same work on the canal path.',
    statements: [
      { text: '22 lamps were fitted in September', category: 0 },
      { text: 'Reported falls fell from 19 to 6', category: 0 },
      { text: 'The lamps are part of why falls dropped', category: 1 },
      { text: 'The canal path will see the same drop', category: 2 },
    ],
    ask: 'Which line is the only measured basis for the word "safe"?',
    basis: 'Reported falls fell from 19 to 6',
    others: ['Path use after 6 pm rose by a third', 'A resident said it feels different now', '22 lamps were fitted in September'],
    why: 'Falls are the only thing measured that is about harm. Use and feelings could both rise on a path that had got no safer.',
  },
  {
    headline: 'BREAKFAST CLUB LIFTS TEST RESULTS',
    piece:
      'The club opened in January and 84 pupils attend. Mean test scores among attenders were 62% in the spring term, against 57% for the year as a whole. Attendance at the club is voluntary. The head teacher says the room is full every morning. Two more schools are opening clubs in September.',
    statements: [
      { text: '84 pupils attend the breakfast club', category: 0 },
      { text: 'Attenders averaged 62% against 57% overall', category: 0 },
      { text: 'The gap of 5 points is worth investigating', category: 1 },
      { text: 'The two new clubs will lift scores too', category: 2 },
    ],
    ask: 'Which line is the only measured basis for the word "lifts"?',
    basis: 'Attenders averaged 62% against 57% overall',
    others: ['84 pupils attend the breakfast club', 'The head says the room is full each morning', 'Attendance at the club is voluntary'],
    why: 'Only the score comparison touches results at all — and because attending is voluntary, even that cannot show the club did the lifting.',
  },
  {
    headline: 'RECYCLING SCHEME A CLEAR SUCCESS',
    piece:
      'Kerbside collections began in April. Recycled tonnage rose from 310 to 388 tonnes over the following quarter. General waste tonnage stayed level at 1,140. Nine in ten households now have a bin. A councillor called the response overwhelming.',
    statements: [
      { text: 'Recycled tonnage rose from 310 to 388', category: 0 },
      { text: 'General waste stayed level at 1,140 tonnes', category: 0 },
      { text: 'The extra recycling did not come out of general waste', category: 1 },
      { text: 'The scheme will pay for itself within a year', category: 2 },
    ],
    ask: 'Which line most complicates the word "success"?',
    basis: 'General waste stayed level at 1,140 tonnes',
    others: ['Recycled tonnage rose from 310 to 388', 'Nine in ten households now have a bin', 'A councillor called the response overwhelming'],
    why: 'If general waste did not fall, the extra 78 tonnes came from somewhere else — the headline figure rose without anything being diverted.',
  },
  {
    headline: 'NEW SIGNAL CUTS JUNCTION QUEUES',
    piece:
      'The signal was switched on in May. Average queue length at 8 am fell from 14 cars to 9. Queue length on the side road rose from 3 cars to 7. Traffic volume across the junction was unchanged. A driver said the main road flows much better.',
    statements: [
      { text: 'The main-road queue fell from 14 cars to 9', category: 0 },
      { text: 'The side-road queue rose from 3 cars to 7', category: 0 },
      { text: 'Some of the main-road wait has moved sideways', category: 1 },
      { text: 'The junction will cope with future growth', category: 2 },
    ],
    ask: 'Which line does the headline leave out?',
    basis: 'The side-road queue rose from 3 cars to 7',
    others: ['The main-road queue fell from 14 cars to 9', 'Traffic volume across it was unchanged', 'A driver said the main road flows better'],
    why: 'With volume unchanged, five cars leaving one queue and four joining another is mostly redistribution — the headline reports one queue and not the pair.',
  },
  {
    headline: 'READING APP DOUBLES BOOKS FINISHED',
    piece:
      'The app was given to one class of 28 in October. Books finished per pupil rose from 3 in the autumn term to 6 in the spring term. The other three classes went from 3 to 4. Book length was not recorded. The school is buying the app for every class.',
    statements: [
      { text: 'The app class went from 3 books to 6', category: 0 },
      { text: 'The other classes went from 3 books to 4', category: 0 },
      { text: 'The app class gained more than the others did', category: 1 },
      { text: 'Every class will double next year', category: 2 },
    ],
    ask: 'Which line stops "doubles" from meaning what it sounds like?',
    basis: 'Book length was not recorded anywhere',
    others: ['The app class went from 3 books up to 6', 'The other classes went from 3 to 4', 'The app was given to one class of 28'],
    why: 'Books finished can double by finishing shorter books. Without length, the count cannot separate more reading from lighter reading.',
  },
  {
    headline: 'LATER BUSES END SCHOOL LATENESS',
    piece:
      'A later bus was added in September. Recorded lateness fell from 41 pupils a week to 12. The school also began sending a text home on the day a pupil is late. Bus passenger numbers were not recorded. Attendance overall was unchanged.',
    statements: [
      { text: 'Recorded lateness fell from 41 a week to 12', category: 0 },
      { text: 'A text home began at the same time', category: 0 },
      { text: 'Two changes landed together, so neither is isolated', category: 1 },
      { text: 'The bus is what ended the lateness', category: 2 },
    ],
    ask: 'Which line makes the headline\'s cause unprovable?',
    basis: 'A text home began at the same time',
    others: ['Recorded lateness fell from 41 to 12', 'Bus passenger numbers were not recorded', 'Attendance overall was unchanged'],
    why: 'Two changes started together, so any drop is shared between them and no measurement here can split it.',
  },
]

const claimtypeHeadline = tpl(
  {
    id: 'unseen-claimtype-headline',
    name: 'What the headline is standing on',
    skillIds: ['o-claimtype', 'o-selection'],
    bucket: 'observer',
    difficulty: 4,
    variants: HEADLINE_CASES.length,
    minutes: 4,
    kind: 'multi',
    transfer: true,
    calibration: true,
  },
  (rng, seed) => {
    const c = cycle(seed, HEADLINE_CASES)
    return {
      title: 'Headline and body',
      prompt: `**${c.headline}**\n\n> ${c.piece}`,
      parts: [
        {
          stage: 'Sort',
          prompt:
            'Sort each statement about the piece above.\n\n**Measured fact** = the piece records it. **Reasoned judgement** = the piece supports it without saying it. **Speculation** = nothing measured here bears on it.',
          answer: classify(rng, CLAIM_CATEGORIES, c.statements),
          explanation: `${c.statements.map((s) => `**${CLAIM_CATEGORIES[s.category]}**: ${s.text}`).join('. ')}. A short news piece almost always mixes all three, and it rarely labels which is which — that is the reader's job.`,
          hints: [
            'Point at the words for the measured ones first; whatever is left is a judgement or a guess.',
            'A judgement would change if the numbers changed. A speculation would not.',
          ],
        },
        {
          stage: 'Test',
          prompt: c.ask,
          answer: mcq(rng, c.basis, c.others),
          explanation: `**${c.basis}.** ${c.why}\n\nA headline is a claim, and somewhere in the body there is either a measurement that carries it or there is not. Finding that one line — and noticing when the line that matters is the one the headline skipped — is the whole move.`,
          hints: [
            'Read the headline as a claim, then hunt for the single measurement it depends on.',
            'Quotes and counts of participation are not measurements of the thing the headline asserts.',
          ],
        },
      ],
      hints: [
        'Sort the claim types first — it tells you which lines are measurements at all.',
        'Then match the headline\'s strongest word against the measurements available.',
        'The line that matters is sometimes the one the headline left out.',
      ],
      explanation:
        `Headlines compress, and compression has to drop something. What gets dropped is usually the qualifier that made the finding honest — the comparison group, the unchanged figure, the second change that landed at the same time.\n\nIn this piece the load-bearing line is "${c.basis}". ${c.why}\n\nNothing here says the headline is a lie. It says a headline is a judgement written by somebody else, and reading the body is how you check whether the findings can hold it up.`,
    }
  },
)

export const UNSEEN_TEMPLATES: ItemTemplate[] = [
  // o-selection
  missingWho,
  filteredOrNot,
  whatWouldSettle,
  reviewGap,
  // o-expect
  barnumDefence,
  discriminate,
  confirmsBoth,
  predictFirst,
  // o-anchor
  strikePrice,
  reanchor,
  irrelevantNumber,
  haggleRange,
  // o-frame
  frameConvert,
  frameSame,
  frameRestate,
  frameComparison,
  // o-claimtype
  claimtypeSort,
  claimtypeOne,
  claimtypeUpgrade,
  claimtypeHeadline,
]
