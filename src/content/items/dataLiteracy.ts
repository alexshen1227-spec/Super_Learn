/**
 * DATA LITERACY — depth for the seven existing `science` skills.
 *
 * The science bucket was the thinnest in the bank: 33 families and ~209
 * declared variants, and a five-year simulated learner exhausted most of them.
 * This file adds ~24 families whose content target is the ASSESSABLE core of
 * two real standards sets, chosen because both are public, both are written as
 * lists of things a student should be able to DO, and both survive translation
 * to an offline single-item format without pretending to be a classroom.
 *
 * GAISE II (ASA, 2020), Level C — the higher-yield of the two. Its four-step
 * cycle (formulate a statistical investigative question, collect/consider data,
 * analyse, interpret) maps onto items directly for everything except the
 * "collect" step, which needs a real classroom. Targeted here:
 *   - s-hypo    : the investigative-question / deterministic-question contrast
 *                 that GAISE II opens with (a statistical question anticipates
 *                 VARIABILITY; "how tall is this plant?" does not), and the
 *                 randomisation-test framing of "could chance alone do this?".
 *                 Level C deliberately teaches inference through simulation
 *                 rather than a significance threshold, so `dl-chance-alone`
 *                 reports a shuffle count, never a p < 0.05 verdict.
 *   - s-design  : survey / observational study / experiment, where the single
 *                 discriminator is whether a treatment was IMPOSED; and the
 *                 two-licence rule that random ASSIGNMENT buys a causal claim
 *                 for the participants while random SELECTION buys
 *                 generalisation to a population. Confusing those two is the
 *                 classic error, so `dl-random-licence` makes every wrong pick
 *                 a named over- or under-claim, computed from a bitmask rather
 *                 than hand-tagged.
 *   - s-measure : margin of error as a 1/sqrt(n) law (quadruple the sample,
 *                 halve the margin — COMPUTED both directions), the standard
 *                 misinterpretations, and measurement error vs sampling error,
 *                 which matters because only one of the two shrinks with n.
 *   - s-corr    : relative risk and difference-in-proportions off a 2x2 table,
 *                 and Simpson's paradox. The paradox variants are generated and
 *                 then VERIFIED: `simpsonCase` searches a parameter grid and
 *                 keeps only tuples where the loser of both strata genuinely
 *                 wins the aggregate by a visible margin.
 *   - s-graphs  : least-squares slope / intercept / prediction / residual,
 *                 Pearson's r (including that r near 0 rules out a LINEAR
 *                 relationship only), leverage, and axis truncation. Every
 *                 fitted line here comes out of `fitLine` over generated
 *                 points, never a typed constant; the residual family builds
 *                 its deviations so that sum(d) = 0 and sum(d*x) = 0, which
 *                 makes the least-squares fit provably the line shown and the
 *                 residual provably the deviation.
 *   - s-sources : missing data and the DIRECTION of the bias it creates, plus
 *                 best-case / worst-case recomputation under non-response.
 *
 * NGSS Science & Engineering Practices — audited against SEP ELEMENTS, not
 * performance expectations. That distinction is deliberate: the NRC's 2014
 * assessment report (Developing Assessments for the NGSS) states that a
 * performance expectation needs a multi-component task set and cannot be
 * satisfied by any single item, so nothing here claims PE coverage.
 *   - SEP 3 (planning investigations): controlling variables, deciding how much
 *     data and at what precision given cost/time limits, and stating a
 *     DIRECTIONAL hypothesis. The last one is `dl-hypothesis-form`, which uses
 *     a draft (ungraded, for the generation effect) followed by graded probes
 *     on the form of the claim and on which variable was manipulated. It is not
 *     a `construct` answer because construct slots hold numbers.
 *   - SEP 4 (analysing data): function fit, slope, intercept, r, the limits of
 *     an analysis, and what NEW data does to a working explanation.
 *   - SEP 5 (mathematics): limit-case testing of an expression — plug in zero,
 *     a symmetric case, an extreme — and compound-unit arithmetic (mg/mL,
 *     g/cm^3, person-hours, L/min to m^3/h).
 *   - SEP 7/8 (argument, information): which of two explanations the evidence
 *     favours, and what further information would resolve a contradiction.
 *
 * HONESTY, s-fermi. Arlebäck & Albarracin's (2019) review of Fermi problems in
 * STEM education found evidence that they support modelling and problem-solving
 * work, and NO study explicitly testing whether they improve estimation skill
 * itself — let alone general reasoning. Every explanation in this file that
 * touches what estimation practice buys says so in plain words. The two
 * s-fermi families here are therefore justified as skills in their own right
 * (sanity-checking an expression; carrying units through a calculation), not as
 * transfer engines.
 *
 * Every statistic below is computed by the generator from its own values and
 * re-derivable from the numbers shown to the learner. Divisions are rounded
 * explicitly and the prompt says to what precision wherever it matters.
 */
import type { ErrorTag, ItemPart, ItemTemplate } from '../../domain/types'
import { classify, cycle, draft, mcq, mcqNoted, numeric, round, tpl } from '../lib'

// ---------------------------------------------------------------- helpers

/** Least-squares fit over generated points. Nothing in this file types a slope. */
function fitLine(points: readonly (readonly [number, number])[]): { slope: number; intercept: number } {
  const n = points.length
  const mx = points.reduce((a, p) => a + p[0], 0) / n
  const my = points.reduce((a, p) => a + p[1], 0) / n
  let sxy = 0
  let sxx = 0
  for (const [x, y] of points) {
    sxy += (x - mx) * (y - my)
    sxx += (x - mx) * (x - mx)
  }
  const slope = sxy / sxx
  return { slope, intercept: my - slope * mx }
}

/** Signed value with a real minus sign, for prose. */
function signed(v: number): string {
  return v < 0 ? `−${Math.abs(v)}` : String(v)
}

/**
 * Two distinct members of a pool, rotating so that N seeds give N distinct
 * pairs. `cycle` alone would repeat a pair every `pool.length` seeds.
 */
function pairFrom<T>(pool: readonly T[], seed: number, offset: number): [T, T] {
  const i = (seed + offset) % pool.length
  const step = 1 + (Math.floor(seed / pool.length) % (pool.length - 1))
  return [pool[i], pool[(i + step) % pool.length]]
}

// ============================================================== s-design

const SURVEYS = [
  'A school draws 200 students at random from its roll and asks each one how many hours they slept last night.',
  'A council mails a questionnaire to 500 randomly chosen households asking how often they use the town buses.',
  'A club phones 150 randomly selected members and records whether each one intends to renew this year.',
  'A team randomly selects 300 shoppers leaving a centre and asks each how far they travelled to get there.',
  'A magazine emails 400 randomly chosen subscribers and asks which of six sections they read most often.',
  'A charity randomly samples 250 households and records the number of working bicycles each one owns.',
] as const

const OBSERVATIONAL = [
  'Researchers record which students already eat breakfast, then compare their attention scores with the rest.',
  'A vet compares recovery times of dogs whose owners had already chosen a raw diet against those who had not.',
  'Analysts compare crash rates for drivers who bought winter tyres against drivers who kept summer tyres.',
  'A study compares exam marks of students who signed up for the optional revision club with those who did not.',
  'Researchers follow two towns for a year: one already had a cycle lane, the other never built one.',
  'A clinic compares resting heart rate in patients who already walk to work against patients who drive.',
] as const

const EXPERIMENTS = [
  'Volunteers are split by coin toss: half get the new drink 30 minutes before the test, half get plain water.',
  'Seedlings are divided at random into two trays; one tray gets the new fertiliser and the other gets none.',
  'Each participant is assigned at random to either the 20-minute nap condition or the 20-minute reading one.',
  'A shop tosses a coin each morning to decide whether to run the discount, then records that day\'s sales.',
  'Students are randomly given one of two versions of a worksheet and their completion times are compared.',
  'Runners are assigned by lottery to warm up either with stretching or with a slow jog before the time trial.',
] as const

/**
 * GAISE II Level C opens on this three-way sort, and the discriminator is a
 * single question: did anybody IMPOSE a condition? Deliberately 2 stars — this
 * is the entry point into s-design, and the work is applying a stated rule to
 * cases that are built to be mistakable (a shop assigning its own discount days
 * IS an experiment; two towns that already differ is not).
 */
const studyType = tpl(
  {
    id: 'dl-study-type',
    name: 'Survey, observation, or experiment?',
    skillIds: ['s-design'],
    bucket: 'science',
    difficulty: 2,
    variants: 12,
    minutes: 3,
  },
  (rng, seed) => {
    const surveys = pairFrom(SURVEYS, seed, 0)
    const observed = pairFrom(OBSERVATIONAL, seed, 2)
    const trials = pairFrom(EXPERIMENTS, seed, 4)
    return {
      title: 'What kind of study is this?',
      prompt:
        'Three kinds of study, and one question that separates them: **did anyone impose a condition?**\n\n' +
        '**Sample survey** — ask a sample in order to describe a wider group.\n' +
        '**Observational study** — compare groups that already differ, exactly as you found them.\n' +
        '**Experiment** — the investigator decides who gets which condition.\n\nSort each one.',
      answer: classify(
        rng,
        ['Sample survey', 'Observational study', 'Experiment'],
        [
          { text: surveys[0], category: 0 },
          { text: surveys[1], category: 0 },
          { text: observed[0], category: 1 },
          { text: observed[1], category: 1 },
          { text: trials[0], category: 2 },
          { text: trials[1], category: 2 },
        ],
      ),
      hints: [
        'Ask one question of each study: who decided which condition each subject got — the investigator, or the subject?',
        'Random selection is about WHO IS IN the study. Random assignment is about WHAT HAPPENS to them. Only the second makes it an experiment.',
        'A survey measures what is already there and reports on a wider group; an observational study compares groups that formed by themselves; an experiment intervenes.',
      ],
      explanation:
        'The dividing line is imposition, not randomness. A study can use random numbers everywhere and still be observational, because randomly CHOOSING who to look at is a different act from randomly DECIDING what happens to them.\n\n' +
        'A survey asks and reports. An observational study compares groups that assembled themselves — which is why anything that made people join one group rather than the other rides along in the comparison. An experiment sets the condition, which is the only one of the three that can break that link.',
    }
  },
)

/**
 * The two-licence rule, and the single most reliable error in the whole topic:
 * treating random assignment as if it also licensed generalisation, or random
 * sampling as if it licensed cause.
 *
 * Licences are a bitmask (1 = causal, 2 = generalises), so the misconception
 * tag on a wrong pick is COMPUTED — over-claiming is `inference`, under-claiming
 * is `concept` — rather than guessed per option.
 */
/*
 * Option lengths are deliberately tied at the top (entries 0 and 2 are the same
 * length) so that no set has a strictly longest option. With a fixed option
 * bank every entry is the key in some variant, so a single longest option would
 * hand two of the eight variants to anyone counting characters.
 */
const LICENCES = [
  'Cause and effect, and a description of the wider group sampled',
  'Cause and effect, but only for the people who took part here',
  'A description of the wider group but no cause-and-effect claim',
  'Neither cause and effect nor a claim about any wider group',
] as const
const LICENCE_BITS = [3, 1, 2, 0] as const

const randomLicence = tpl(
  {
    id: 'dl-random-licence',
    name: 'What the randomness licenses',
    skillIds: ['s-design'],
    bucket: 'science',
    difficulty: 4,
    variants: 8,
    minutes: 3,
    calibration: true,
  },
  (rng, seed) => {
    const cases = [
      {
        setup:
          'A city draws 600 residents at random from the electoral roll. Each one is then assigned by lottery to receive one of two versions of a recycling leaflet, and their recycling is measured a month later.',
        licence: 0,
        why: 'The draw from the roll makes the 600 stand in for the city; the lottery makes the two leaflet groups comparable before anything was sent.',
      },
      {
        setup:
          'Ninety students volunteer for a sleep study after seeing a poster. Each volunteer is assigned by coin toss to either an eight-hour or a six-hour night before the memory test.',
        licence: 1,
        why: 'The coin toss balances the two groups, so a difference can be pinned on the sleep. But volunteers who answer a poster are not a random draw from anyone, so the size of the effect elsewhere is untested.',
      },
      {
        setup:
          'A researcher takes a random sample of 800 adults from a national register and records who already walks to work and how each one rates their own health.',
        licence: 2,
        why: 'The sample represents the register, so the walking rate and the health ratings generalise. Nobody assigned the walking, so walkers and drivers may have differed long before the study.',
      },
      {
        setup:
          'A fitness app compares users who switched its reminders on against users who did not, using whoever happened to be active last month.',
        licence: 3,
        why: 'Users chose the reminders and chose to be active, so neither the comparison nor the sample was made by the investigator.',
      },
      {
        setup:
          'A teacher asks her own class of 28 to take part, then randomly gives half of them the diagram version of the notes and half the plain version before the quiz.',
        licence: 1,
        why: 'Random assignment inside one class supports a causal reading for that class. One class is not a random draw from all classes, so nothing here says what happens elsewhere.',
      },
      {
        setup:
          'A chain randomly selects 40 of its 500 stores, then tosses a coin at each selected store to decide whether the new shelf label goes up that week.',
        licence: 0,
        why: 'Selection at random from the 500 stores plus assignment at random within them is the design that buys both licences at once.',
      },
      {
        setup:
          'A polling firm dials randomly generated phone numbers nationwide and asks each person reached how many hours they worked last week.',
        licence: 2,
        why: 'Random dialling supports a claim about the population reached by phone. No condition was imposed on anybody, so no comparison here is causal.',
      },
      {
        setup:
          'An online forum asks members to post whether the new keyboard eased their wrist pain, and a moderator counts the replies.',
        licence: 3,
        why: 'People chose the keyboard and chose to reply. Two self-selections stacked on each other license nothing at all.',
      },
    ] as const
    const c = cycle(seed, cases)
    const correctBits = LICENCE_BITS[c.licence]
    const noted = mcqNoted(
      rng,
      LICENCES[c.licence],
      LICENCES.map((_text, i) => i)
        .filter((i) => i !== c.licence)
        .map((i): [string, string, ErrorTag] => {
          const bits = LICENCE_BITS[i]
          const over = (bits & ~correctBits) !== 0
          return [
            LICENCES[i],
            over
              ? 'Claims a licence this design did not buy — cause needs random assignment, and reaching a wider group needs a random draw from it.'
              : 'Under-reads the design — something here WAS randomised, and that buys one of the two licences.',
            over ? 'inference' : 'concept',
          ]
        }),
    )
    return {
      title: 'Two kinds of randomness',
      prompt: `${c.setup}\n\nWhat does this design support?`,
      answer: noted.answer,
      distractorNotes: noted.distractorNotes,
      distractorTags: noted.distractorTags,
      hints: [
        'There are two separate questions: how did people get INTO the study, and how did they get into their GROUP?',
        'Random draw from a population → the result describes that population. Random assignment to conditions → the difference can be blamed on the condition.',
        `Worked path: **${LICENCES[c.licence]}**. ${c.why}`,
      ],
      explanation:
        `**${LICENCES[c.licence]}.** ${c.why}\n\n` +
        'The two kinds of randomness buy different things and neither substitutes for the other. Random ASSIGNMENT makes the groups comparable, so a difference between them can be blamed on the condition — for the people in the study. Random SELECTION makes the people in the study stand in for a wider group, so a rate measured on them can be quoted for that group. A design with both supports a causal claim about the population; a design with one supports exactly half of that.',
    }
  },
)

const confounder = tpl(
  {
    id: 'dl-confounder',
    name: 'Which variable is the confounder?',
    skillIds: ['s-design'],
    bucket: 'science',
    difficulty: 3,
    variants: 6,
    minutes: 3,
  },
  (rng, seed) => {
    const cases = [
      {
        claim: 'Students who own a graphing calculator score higher in maths, so a shop advertises the calculator as a way to raise grades.',
        correct: 'Being in the advanced course, which requires the calculator',
        wrong: [
          ['The price of the calculator model each student bought', 'Linked to the calculator but not to the score — a confounder must connect to both.', 'concept'],
          ['How hard the final examination happened to be that year', 'Linked to the score, but it hits everyone equally, so it cannot explain a gap.', 'concept'],
          ['The hours of practice each student put in with the calculator', 'This sits ON the path from calculator to score, so it is a mechanism, not a rival explanation.', 'inference'],
        ] as [string, string, ErrorTag][],
        why: 'Advanced-course students are required to buy the calculator AND study harder material with more support, so course enrolment is tied to the calculator and to the score at the same time.',
      },
      {
        claim: 'Neighbourhoods with more parks have lower rates of long-term illness, and a councillor calls parks a public health measure.',
        correct: 'Average household income across the neighbourhood',
        wrong: [
          ['The number of benches inside each of the parks', 'Attached to the parks alone; it has no separate route to illness rates.', 'concept'],
          ['How many minutes residents spend walking in a week', 'A step on the path from parks to health, so removing it removes the effect itself.', 'inference'],
          ['The year in which each of the parks was first opened', 'Interesting history, but nothing links it to illness independently.', 'concept'],
        ] as [string, string, ErrorTag][],
        why: 'Wealthier areas get more parks AND more of everything else that protects health, so income is attached to both ends of the comparison.',
      },
      {
        claim: 'People who take the daily supplement report fewer colds, and the label quotes this as evidence that it works.',
        correct: 'General health habits, which the takers also have more of',
        wrong: [
          ['The flavour of the supplement each person picked', 'Connected to the supplement only; colds do not care about flavour.', 'concept'],
          ['The number of colds going around in that season', 'Connected to colds only, and it affects takers and non-takers alike.', 'concept'],
          ['How much of the supplement the body actually absorbs', 'That is the proposed mechanism, so it cannot also be the rival explanation.', 'inference'],
        ] as [string, string, ErrorTag][],
        why: 'People who buy a daily supplement also tend to sleep, wash and eat differently, so the habit bundle travels with the pill.',
      },
      {
        claim: 'Schools that hand out tablets have higher reading scores, and the supplier presents this as proof the tablets teach reading.',
        correct: 'How much money the school has to spend overall',
        wrong: [
          ['The screen size of the tablet model chosen', 'Tied to the tablet alone, with no separate route to reading.', 'concept'],
          ['How many minutes pupils read on the tablet', 'A step on the path from tablet to score, not a competing cause.', 'inference'],
          ['The reading test that was used at the end of the year', 'Affects the measured score for every school in the comparison equally.', 'concept'],
        ] as [string, string, ErrorTag][],
        why: 'A school that can afford tablets can usually afford smaller classes, more staff and more books, and all of those move reading scores.',
      },
      {
        claim: 'Employees who attend the optional training get promoted more often, and HR calls the training a route to promotion.',
        correct: 'The manager\'s rating of the employee before any of it',
        wrong: [
          ['How many hours the training course actually ran', 'A property of the course, identical for everyone who went.', 'concept'],
          ['The number of promotion slots open that year', 'It limits promotions for attenders and non-attenders alike.', 'concept'],
          ['The new skills that people picked up during the training', 'That is how the training is supposed to work, so it is the mechanism.', 'inference'],
        ] as [string, string, ErrorTag][],
        why: 'Managers nominate and encourage the people they already rate highly, and those people are also the ones who get promoted, so the prior rating feeds both.',
      },
      {
        claim: 'Drivers with a dashcam fitted have fewer at-fault crashes, and an insurer offers the camera as a safety device.',
        correct: 'How cautious the driver was to begin with',
        wrong: [
          ['The video resolution of the camera fitted', 'A feature of the camera; it has no independent link to crashes.', 'concept'],
          ['The number of kilometres driven in a year', 'A real risk factor, but nothing ties it to owning a camera.', 'concept'],
          ['Knowing the camera is running while driving', 'That is the proposed mechanism of the camera, not a rival to it.', 'inference'],
        ] as [string, string, ErrorTag][],
        why: 'Careful drivers are the ones who go and buy a camera, and careful drivers crash less anyway, so caution is attached to the camera and to the outcome.',
      },
    ] as const
    const c = cycle(seed, cases)
    const noted = mcqNoted(rng, c.correct, c.wrong.map((w) => [w[0], w[1], w[2]] as [string, string, ErrorTag]))
    return {
      title: 'Find the third variable',
      prompt: `${c.claim}\n\nWhich variable is a confounder here?`,
      answer: noted.answer,
      distractorNotes: noted.distractorNotes,
      distractorTags: noted.distractorTags,
      hints: [
        'A confounder has to reach BOTH ends: it must be linked to who is in which group, and separately linked to the outcome.',
        'Rule out anything that only touches one end, and anything that is the way the effect is supposed to work.',
        `Worked path: **${c.correct}**. ${c.why}`,
      ],
      explanation:
        `**${c.correct}.** ${c.why}\n\n` +
        'The two-arrow test settles most of these. A confounder needs an arrow to the thing being compared AND a separate arrow to the outcome. A variable with one arrow cannot manufacture a difference, and a variable that lies ON the path from cause to effect is the mechanism — removing it would remove the effect you are trying to measure, not the confusion.',
    }
  },
)

/*
 * The first two entries are the same length and the longest, and the distractor
 * slice below always keeps at least one of them, so the key is never strictly
 * the longest option whichever flaw a case carries.
 */
const FLAWS = [
  'There is no comparison group to judge the result against',
  'The groups were not assigned to the conditions at random',
  'The people in the study chose to take part in it',
  'Whoever measured the outcome knew which group it was',
  'One trial only, so ordinary variation is left in it',
] as const

const designFix = tpl(
  {
    id: 'dl-design-fix',
    name: 'Name the flaw, then repair it',
    skillIds: ['s-design'],
    bucket: 'science',
    difficulty: 4,
    variants: 8,
    minutes: 4,
    kind: 'multi',
  },
  (rng, seed) => {
    const cases = [
      {
        setup: 'A gardener waters 40 seedlings with the new plant food and reports that 35 of them grew past 12 cm.',
        flaw: 0,
        fix: 'Grow a matched tray with plain water and compare the two',
        bad: [
          'Grow another 40 seedlings with the plant food as well',
          'Measure every seedling twice and use the average height',
          'Repeat the whole thing next spring under warmer conditions',
        ],
        why: 'With nothing to compare against, 35 out of 40 is a number without a meaning: seedlings might do that on plain water.',
      },
      {
        setup: 'A coach lets players pick either the new drill or the old one, then reports that the new-drill players improved more.',
        flaw: 1,
        fix: 'Allocate players to the two drills by lottery instead',
        bad: [
          'Ask the players afterwards which drill they preferred',
          'Run the same comparison with three times as many players',
          'Let the players swap drills whenever they feel like it',
        ],
        why: 'Keen players pick the new thing, so the drill groups differed in keenness before a single session ran.',
      },
      {
        setup: 'An app posts a banner asking users to report whether its new focus mode helped, and reports that 78% said yes.',
        flaw: 2,
        fix: 'Draw a random sample of users and ask all of them',
        bad: [
          'Leave the banner up for a month rather than a week',
          'Add a comment box so users can explain their answer',
          'Report the raw number of replies alongside the percent',
        ],
        why: 'The people who answer a banner about a feature are the people with something to say about it, usually the delighted and the furious.',
      },
      {
        setup: 'A researcher who designed the new therapy also scores each participant\'s recovery from a video afterwards.',
        flaw: 3,
        fix: 'Have the videos scored by someone told nothing about groups',
        bad: [
          'Score each of the recovery videos a second time, on another day',
          'Publish the videos so that anybody who wants to can check them',
          'Use a recovery scale with a great many more points along it',
        ],
        why: 'Someone who wants the therapy to work will read borderline videos generously, without ever deciding to cheat.',
      },
      {
        setup: 'A student times one paper aeroplane flight per design and declares the winged design the best.',
        flaw: 4,
        fix: 'Fly each design ten times and compare the spread',
        bad: [
          'Build the two designs from thicker and heavier paper',
          'Throw both designs harder to get longer flight times',
          'Time the flights with a more precise digital stopwatch',
        ],
        why: 'One throw of each cannot separate the design from the throw; the difference between two single flights is mostly the arm.',
      },
      {
        setup: 'A shop reports that customers who joined the loyalty scheme spend more per visit than customers who never joined.',
        flaw: 1,
        fix: 'Offer the scheme to a randomly chosen half of customers',
        bad: [
          'Compare spending across a much longer stretch of months',
          'Ask the loyalty members what they like about the scheme',
          'Include online orders in the spending figures as well',
        ],
        why: 'Frequent, high-spending customers are exactly the ones who sign up, so the scheme is a marker of the habit before it is a cause of it.',
      },
      {
        setup: 'A nurse records blood pressure once for each patient on the new diet and compares those readings with the clinic average.',
        flaw: 4,
        fix: 'Take three readings per patient on separate days',
        bad: [
          'Compare against last year\'s clinic average instead',
          'Recruit more patients onto the new diet programme',
          'Record the exact time of day of each reading',
        ],
        why: 'Blood pressure swings from hour to hour, so one reading per person mixes the diet with the noise of a single moment.',
      },
      {
        setup: 'A teacher tries the new seating plan in her own class and marks the end-of-term work herself, knowing the plan is on trial.',
        flaw: 3,
        fix: 'Have the work marked anonymously by another teacher',
        bad: [
          'Use the seating plan for two terms rather than one',
          'Tell the class that the seating plan is being tested',
          'Mark the work twice and average the two marks',
        ],
        why: 'A marker who knows what result would be pleasing does not need to be dishonest to produce it; borderline answers drift.',
      },
    ] as const
    const c = cycle(seed, cases)
    const flawText = FLAWS[c.flaw]
    const parts: ItemPart[] = [
      {
        stage: 'Diagnose',
        prompt: 'What is the single biggest problem with this design?',
        answer: mcq(rng, flawText, FLAWS.filter((f) => f !== flawText).slice(0, 3) as unknown as string[]),
        explanation: `**${flawText}.** ${c.why}`,
        hints: [
          'Ask what the reported number is being compared against, and how each subject ended up where they did.',
          'Separate a problem with the GROUPS from a problem with the MEASURING — they need different repairs.',
        ],
      },
      {
        stage: 'Repair',
        prompt: 'Which change fixes that problem, rather than a different one?',
        answer: mcq(rng, c.fix, [...c.bad]),
        explanation: `**${c.fix}.** The other three change something real, but none of them touches the fault: ${c.why.toLowerCase()}`,
        hints: [
          'A repair has to remove the specific fault you just named, not improve the study in general.',
          'More data, more precision and more time all make a flawed comparison sharper without making it fair.',
        ],
      },
    ]
    return {
      title: 'Diagnose and repair',
      prompt: `${c.setup}`,
      parts,
      hints: [
        'Name the fault before you reach for the fix; most wrong repairs are answers to a different fault.',
        'Ask in order: compared with what? assigned by whom? chosen by whom? measured by whom? how many times?',
        `Worked path: the fault is that **${flawText.toLowerCase()}**, and the repair is to **${c.fix.toLowerCase()}**.`,
      ],
      explanation:
        `The fault: **${flawText.toLowerCase()}**. The repair: **${c.fix.toLowerCase()}**.\n\n${c.why}\n\n` +
        'Most study repair goes wrong in the same way: the fix improves the study without touching the fault. A bigger sample makes a self-selected comparison more precise and no less biased, and a better stopwatch does nothing about a single trial.',
    }
  },
)

// ============================================================= s-measure

const sampleTarget = tpl(
  {
    id: 'dl-sample-target',
    name: 'Sizing a sample for a target margin',
    skillIds: ['s-measure'],
    bucket: 'science',
    difficulty: 3,
    variants: 16,
    minutes: 3,
  },
  (_rng, seed) => {
    const NS = [400, 500, 600, 800, 900, 1000, 1200, 1500]
    const MS = [2.4, 3.0, 3.6, 4.2, 4.8, 6.0]
    const idx = Math.floor(seed / 2)
    const n = NS[idx % NS.length]
    const moe = MS[idx % MS.length]
    const k = 2 + (idx % 2)
    const form = seed % 2
    if (form === 0) {
      const target = round(moe / k, 2)
      const needed = n * k * k
      return {
        title: 'How many people would that take?',
        prompt:
          `A survey of **${n}** people reports a margin of error of **±${moe.toFixed(1)} percentage points**.\n\n` +
          `The team wants to cut that to **±${target} points** using the same method.\n\nAbout how many people would they need to ask?`,
        answer: numeric(needed, { unit: 'people' }),
        hints: [
          'The margin of error shrinks with the SQUARE ROOT of the sample size, not with the sample size itself.',
          `Going from ±${moe.toFixed(1)} to ±${target} is a factor of ${k}, and a factor of ${k} in precision costs ${k} × ${k} in people.`,
          `Worked path: ${n} × ${k}² = ${n} × ${k * k} = **${needed}**.`,
        ],
        explanation:
          `Precision improves with √n, so cutting the margin by a factor of ${k} takes ${k}² = ${k * k} times as many people: ${n} × ${k * k} = **${needed}**.\n\n` +
          `The uncomfortable part is the price. Those extra ${needed - n} people buy one thing only — less random sampling wobble. They buy nothing at all against a badly chosen sample, because the √n law describes random error and a biased sample is not random error. A huge sample of the wrong people is a very precise wrong answer.`,
      }
    }
    const halved = round(moe / Math.SQRT2, 1)
    return {
      title: 'What does doubling buy?',
      prompt:
        `A survey of **${n}** people reports a margin of error of **±${moe.toFixed(1)} percentage points**.\n\n` +
        `A colleague says that asking **twice** as many people will halve it.\n\nWhat is the margin of error with ${2 * n} people, to one decimal place?`,
      answer: numeric(halved, { tolerance: 0.08 }),
      hints: [
        'Halving the margin needs FOUR times the people. Twice the people gives a smaller improvement than that.',
        `Divide by √2 ≈ 1.41, not by 2: ${moe.toFixed(1)} ÷ 1.41.`,
        `Worked path: ${moe.toFixed(1)} ÷ √2 = **${halved}** points, against the ${round(moe / 2, 2)} your colleague expected.`,
      ],
      explanation:
        `Margin of error goes as 1/√n, so doubling the sample divides it by √2 ≈ 1.41: ${moe.toFixed(1)} ÷ 1.41 = **±${halved} points**. Your colleague expected ±${round(moe / 2, 2)}.\n\n` +
        `That is the whole shape of the law. Doubling buys about a 29% reduction; halving the margin needs four times the people; and a tenth of the margin needs a hundred times. It is why national polls sit at a thousand-odd respondents and stop — the next big improvement costs more than it is worth.`,
    }
  },
)

const moeReading = tpl(
  {
    id: 'dl-moe-reading',
    name: 'Reading a margin of error',
    skillIds: ['s-measure'],
    bucket: 'science',
    difficulty: 4,
    variants: 6,
    minutes: 3,
  },
  (rng, seed) => {
    const cases = [
      {
        setup: 'A poll of 1,000 people finds 52% support for a proposal, with a margin of error of ±3 percentage points at 95% confidence.',
        q: 'Which reading is fair?',
        correct: 'Population values from 49% to 55% sit comfortably with this sample',
        wrong: [
          ['There is a 95% chance that the true value lies between 49% and 55%', 'The 95% describes the METHOD across many samples, not this one interval.', 'concept'],
          ['About 95% of the people polled answered within 3 points of 52%', 'Reads the margin as a spread of individual answers rather than of the estimate.', 'concept'],
          ['The poll cannot be out by more than 3 percentage points either way', 'Treats the margin as a hard ceiling; it covers sampling wobble only.', 'concept'],
        ] as [string, string, ErrorTag][],
        why: 'The interval is the set of population values that would not be surprising given this sample. The 95% is a property of the procedure: repeat the whole survey many times and about 95% of the intervals built this way would contain the true value. It says nothing about the chance that THIS interval is one of them, because the true value is not a coin.',
      },
      {
        setup: 'The same poll reports candidate A on 51% and candidate B on 47%, each with a margin of error of ±3 percentage points.',
        q: 'What can be said about the lead?',
        correct: 'This sample does not establish that A is genuinely ahead',
        wrong: [
          ['A leads by 4 points, and 4 points is bigger than the ±3 margin', 'Compares one gap against one margin; the margin on a DIFFERENCE is wider than either.', 'concept'],
          ['A is ahead, since 51% is above the halfway mark', 'The halfway mark is irrelevant to whether the gap is resolved.', 'concept'],
          ['Nothing at all can be said about either candidate here', 'The over-correction: each estimate is still informative on its own.', 'inference'],
        ] as [string, string, ErrorTag][],
        why: 'The two intervals, 48-54 and 44-50, overlap. Worse, comparing a 4-point gap against a 3-point margin is the wrong comparison entirely: the uncertainty on a DIFFERENCE between two estimates is larger than the uncertainty on either one alone, so a lead needs to clear more than a single margin before a sample settles it.',
      },
      {
        setup: 'A survey emails 20,000 customers and 1,600 reply. The report quotes a margin of error of ±2.5 percentage points.',
        q: 'What does that margin fail to cover?',
        correct: 'The 18,400 customers who never replied at all',
        wrong: [
          ['The chance that some people misread the questions they were asked', 'Real, but it is measurement error — a separate problem from non-response.', 'concept'],
          ['The fact that 1,600 is a small sample out of 20,000 people', 'Sample size is exactly what the margin already accounts for.', 'concept'],
          ['Nothing — with 1,600 replies in hand the margin covers everything', 'The margin never covers who is missing, at any sample size.', 'inference'],
        ] as [string, string, ErrorTag][],
        why: 'A margin of error is computed as though the respondents were a random draw. They were not: they are the people who chose to reply. If repliers differ from non-repliers — and on most questions they do — the estimate is off by an amount the margin knows nothing about, and collecting more replies the same way does not shrink it.',
      },
      {
        setup: 'A second poll, run the same week with the same method, puts support at 55% rather than 52%. Both quote ±3 points.',
        q: 'What is the sensible reading?',
        correct: 'Two samples landing this far apart is entirely unremarkable',
        wrong: [
          ['One of the two polls must have been carried out wrongly', 'Treats ordinary sampling variation as evidence of a mistake.', 'concept'],
          ['Support genuinely rose by 3 points between the two polls', 'Reads sampling noise as a real change over a few days.', 'inference'],
          ['Polling clearly does not work if the results move like that', 'The over-correction; the movement is the size the method predicts.', 'inference'],
        ] as [string, string, ErrorTag][],
        why: 'Both intervals (49-55 and 52-58) contain values in common, and a gap of 3 points between two samples of this size is exactly what the margin is warning you to expect. Reading each new poll as news about a change, rather than as one more draw, is how a flat trend gets reported as a rollercoaster.',
      },
      {
        setup: 'A club surveys 60 of its 900 members and finds 40% want later opening. The margin of error is about ±12 percentage points.',
        q: 'What is the honest summary?',
        correct: 'Anything from about a quarter to about half of them want it',
        wrong: [
          ['A clear minority of the members want later opening hours', 'Treats a 40% point estimate as settled when the interval reaches 52%.', 'inference'],
          ['The survey is worthless, because the margin is so very wide', 'A wide interval is still information; it rules out the extremes.', 'inference'],
          ['Exactly 360 of the 900 members want the later opening hours', 'Scales a sample estimate to the population as if it were a count.', 'concept'],
        ] as [string, string, ErrorTag][],
        why: 'With ±12 points the interval runs from 28% to 52%, which straddles the halfway line — so this survey cannot say whether later opening is a minority or a majority position. It is not worthless: it does rule out "almost everyone" and "almost nobody". Quoting 40% on its own is the error, because it hides how little 60 people can settle.',
      },
      {
        setup: 'A report says: "Support is 47%, with a margin of error of ±3 points, so support is definitely below half."',
        q: 'What is wrong with that sentence?',
        correct: 'The interval reaches 50%, so "definitely" is not earned',
        wrong: [
          ['Nothing is wrong here, since 47% plus 3 points is still under 50%', 'Arithmetic slip: 47 + 3 = 50, which touches the line.', 'slip'],
          ['A margin of error should never be quoted beside a percentage', 'Quoting the margin is the good part of the sentence.', 'concept'],
          ['Support is definitely above half, since the margin is so wide', 'Flips the error rather than removing it.', 'inference'],
        ] as [string, string, ErrorTag][],
        why: 'The interval runs 44% to 50%, so the halfway line sits at its edge. The word doing the damage is "definitely": the sample leans towards under half and does not establish it. A margin of error printed and then ignored in the next clause is one of the commonest ways a correct number supports an incorrect sentence.',
      },
    ] as const
    const c = cycle(seed, cases)
    const noted = mcqNoted(rng, c.correct, c.wrong.map((w) => [w[0], w[1], w[2]] as [string, string, ErrorTag]))
    return {
      title: 'What the margin does and does not say',
      prompt: `${c.setup}\n\n${c.q}`,
      answer: noted.answer,
      distractorNotes: noted.distractorNotes,
      distractorTags: noted.distractorTags,
      hints: [
        'Write the interval out first: the estimate minus the margin, and the estimate plus the margin.',
        'A margin of error covers ONE thing — the wobble from drawing a random sample. It never covers who is missing, and never attaches a probability to the truth.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}.** ${c.why}`,
    }
  },
)

const MEASUREMENT_ERRORS = [
  'The scale was never zeroed, so every weight recorded comes out 0.4 kg too high.',
  'The stopwatch is started a moment late on every run because of reaction time.',
  'Students round their own sleep to the nearest whole hour when they write it down.',
  'The tape has stretched with age, so every length recorded comes out slightly short.',
  'The thermometer reads half a degree low whenever the weather is cold.',
  'People understate their spending because the question feels embarrassing to answer.',
] as const

const SAMPLING_ERRORS = [
  'By chance this random sample of 40 holds more seniors than the school as a whole.',
  'A second random sample of the same size gives a mean 0.3 cm above the first one.',
  'The random sample of 25 trees happened to include two unusually tall specimens.',
  'Repeating the survey with a fresh random sample moves the estimate by two points.',
  'This random sample of 60 households happens to contain no family with four children.',
  'Two randomly chosen classes give slightly different average scores on the same test.',
] as const

const errorSource = tpl(
  {
    id: 'dl-error-source',
    name: 'Measurement error or sampling error?',
    skillIds: ['s-measure'],
    bucket: 'science',
    difficulty: 3,
    variants: 12,
    minutes: 3,
  },
  (rng, seed) => {
    const measured = pairFrom(MEASUREMENT_ERRORS, seed, 0)
    const sampled = pairFrom(SAMPLING_ERRORS, seed, 3)
    const third = MEASUREMENT_ERRORS[(seed * 2 + 1) % MEASUREMENT_ERRORS.length]
    const fourth = SAMPLING_ERRORS[(seed * 2 + 4) % SAMPLING_ERRORS.length]
    const mSet = [...new Set([measured[0], measured[1], third])]
    const sSet = [...new Set([sampled[0], sampled[1], fourth])]
    return {
      title: 'Two different ways to be wrong',
      prompt:
        'Two things can put a number off, and they behave differently.\n\n' +
        '**Measurement error** — what was recorded differs from the truth for that individual.\n' +
        '**Sampling error** — the recording is fine, but this sample differs from the whole group by chance.\n\nSort each one.',
      answer: classify(
        rng,
        ['Measurement error', 'Sampling error'],
        [...mSet.map((text) => ({ text, category: 0 })), ...sSet.map((text) => ({ text, category: 1 }))],
      ),
      hints: [
        'Ask whether the number written down is wrong FOR THAT INDIVIDUAL, or right for them and merely unlucky as a group.',
        'If measuring the whole population with the same instrument would still leave the fault, it is measurement error.',
        'A wobble that changes when you draw a fresh random sample is sampling error; a fault built into the instrument or the question is not.',
      ],
      explanation:
        'The reason to separate them is that only one of the two responds to a bigger sample. Sampling error shrinks as 1/√n — take four times as many and it halves. Measurement error does not move at all: a scale reading 0.4 kg high on every reading is 0.4 kg high whether you weigh ten people or ten thousand, and averaging simply gives a very precise estimate of the wrong quantity.\n\n' +
        'So the repairs differ too. Sampling error is answered with more data; measurement error is answered by fixing the instrument, the question, or the procedure — and by checking it against a known standard before the study, not after.',
    }
  },
)

// ================================================================ s-corr

const TWO_BY_TWO = [
  {
    unit: 'runners',
    exposed: 'followed the new warm-up',
    unexposed: 'kept the old warm-up',
    outcome: 'finished the season without a strain',
    short: 'strain-free',
  },
  {
    unit: 'seedlings',
    exposed: 'grew under the new lamp',
    unexposed: 'grew under the old lamp',
    outcome: 'flowered within eight weeks',
    short: 'flowered in time',
  },
  {
    unit: 'users',
    exposed: 'saw the new tutorial',
    unexposed: 'never saw the tutorial',
    outcome: 'finished a first project',
    short: 'finished a project',
  },
  {
    unit: 'bikes',
    exposed: 'were serviced last winter',
    unexposed: 'went unserviced',
    outcome: 'needed a roadside repair',
    short: 'needed a repair',
  },
] as const

const twoByTwo = tpl(
  {
    id: 'dl-two-by-two',
    name: 'Two rates, two ways to compare them',
    skillIds: ['s-corr'],
    bucket: 'science',
    difficulty: 3,
    variants: 12,
    minutes: 4,
    kind: 'multi',
  },
  (rng, seed) => {
    const ctx = TWO_BY_TWO[seed % TWO_BY_TWO.length]
    const NS = [200, 300, 400, 500]
    const BASE = [8, 10, 12, 16, 20]
    const MULT = [1.5, 2, 2.5]
    const nA = NS[seed % NS.length] + 100 * (Math.floor(seed / 4) % 2)
    const nB = NS[(seed + 2) % NS.length]
    const pB = BASE[seed % BASE.length]
    const mult = MULT[Math.floor(seed / 4) % MULT.length]
    const pA = pB * mult
    const cA = (pA * nA) / 100
    const cB = (pB * nB) / 100
    const diff = round(pA - pB, 1)
    const parts: ItemPart[] = [
      {
        stage: 'Rate',
        prompt: `What percent of the ${ctx.unit} that ${ctx.exposed} ${ctx.outcome}? (Number only.)`,
        answer: numeric(pA, { unit: '%' }),
        explanation: `${cA} out of ${nA} is ${cA} ÷ ${nA} × 100 = **${pA}%**.`,
        hints: [
          'A rate is the count in that group divided by the SIZE of that group — never by the total across both groups.',
          `Worked path: ${cA} ÷ ${nA} × 100 = ${pA}.`,
        ],
      },
      {
        stage: 'Difference',
        prompt: 'How many percentage POINTS higher is that than the other group?',
        answer: numeric(diff, { unit: 'points' }),
        explanation: `${pA}% − ${pB}% = **${diff} percentage points**. This is the absolute difference: out of every 100 ${ctx.unit}, about ${diff} more ${ctx.short} in the first group.`,
        hints: [
          'Points are the gap between two percentages. Subtract; do not divide.',
          `Worked path: ${pA} − ${pB} = ${diff}.`,
        ],
      },
      {
        stage: 'Ratio',
        prompt: `How many times as likely was the outcome in the group that ${ctx.exposed}? (Two decimal places.)`,
        answer: numeric(mult, { tolerance: 0.01 }),
        explanation: `${pA}% ÷ ${pB}% = **${mult.toFixed(2)}**. That is the relative risk: the rate in one group as a multiple of the rate in the other.`,
        hints: [
          'This one is a ratio, not a subtraction: divide one rate by the other.',
          `Worked path: ${pA} ÷ ${pB} = ${mult.toFixed(2)}.`,
        ],
      },
      {
        stage: 'Report',
        prompt: 'Which single sentence uses these numbers correctly?',
        answer: mcq(rng, `The rate rose by ${diff} percentage points, from ${pB}% to ${pA}%`, [
          `The rate rose by ${round((mult - 1) * 100, 0)} percentage points in that group`,
          `About ${pA}% of every one of the ${ctx.unit} in the study ${ctx.short}`,
          `Being in that group is what made the rate ${mult.toFixed(1)} times as high`,
        ]),
        explanation:
          `**The rate rose by ${diff} percentage points, from ${pB}% to ${pA}%.** One wrong option confuses a ${round((mult - 1) * 100, 0)}% relative rise with ${round((mult - 1) * 100, 0)} percentage POINTS — different numbers here. Another quotes one group's rate as if it were everyone's. The last adds a cause nobody tested.`,
        hints: [
          'Check each sentence against the four numbers you have just computed.',
          'Watch for three traps: percent against percentage points, one group\'s rate quoted as everyone\'s, and a cause that was never tested.',
        ],
      },
    ]
    return {
      title: 'Difference or ratio?',
      prompt:
        `Of the ${nA} ${ctx.unit} that ${ctx.exposed}, **${cA}** ${ctx.outcome}.\n` +
        `Of the ${nB} ${ctx.unit} that ${ctx.unexposed}, **${cB}** ${ctx.outcome}.`,
      parts,
      hints: [
        'Work each group\'s rate out separately first, using that group\'s own size as the denominator.',
        'Then two comparisons: subtract for the difference in points, divide for the ratio.',
        `Worked path: ${pA}% against ${pB}% — a difference of ${diff} points and a ratio of ${mult.toFixed(2)}.`,
      ],
      explanation:
        `Rates: ${cA}/${nA} = ${pA}% and ${cB}/${nB} = ${pB}%. Difference: **${diff} percentage points**. Ratio: **${mult.toFixed(2)} times**.\n\n` +
        'Both comparisons are true and they carry very different weight, which is why a headline gets to choose. The ratio is the same whether the base rate is 1 in 10 or 1 in a million; the difference tells you how many actual cases move. Ask for both, and be suspicious of anyone who only ever quotes the one that sounds bigger.',
    }
  },
)

/**
 * Simpson's paradox with the reversal VERIFIED, not trusted.
 *
 * `simpsonCase` walks a deterministic grid and returns the first tuple where
 * one method loses both strata and still wins the aggregate by at least three
 * percentage points. If the grid ever stopped producing a reversal the search
 * would return null and the selfcheck would fail rather than the item quietly
 * shipping a non-paradox.
 */
function simpsonCase(seed: number): {
  easyA: number
  easyB: number
  hardA: number
  hardB: number
  nEasyA: number
  nHardA: number
  nEasyB: number
  nHardB: number
  totalA: number
  totalB: number
  okA: number
  okB: number
  rateA: number
  rateB: number
} {
  const easyRates = [70, 75, 80, 85]
  const gaps = [5, 10, 15]
  const hardRates = [25, 30, 35, 40]
  const splits: [number, number][] = [
    [180, 20],
    [160, 40],
    [200, 40],
    [240, 60],
  ]
  const candidates: ReturnType<typeof simpsonCase>[] = []
  for (const e of easyRates) {
    for (const g of gaps) {
      for (const h of hardRates) {
        for (const [big, small] of splits) {
          const easyA = e
          const easyB = e + g
          const hardA = h
          const hardB = h + g
          if (easyB > 95 || hardB > easyA) continue
          const nEasyA = big
          const nHardA = small
          const nEasyB = small
          const nHardB = big
          const okA = (easyA * nEasyA) / 100 + (hardA * nHardA) / 100
          const okB = (easyB * nEasyB) / 100 + (hardB * nHardB) / 100
          const totalA = nEasyA + nHardA
          const totalB = nEasyB + nHardB
          if (!Number.isInteger(okA) || !Number.isInteger(okB)) continue
          const rateA = round((okA / totalA) * 100, 1)
          const rateB = round((okB / totalB) * 100, 1)
          // The reversal: B wins BOTH strata, A wins the total by a visible gap.
          if (rateA - rateB < 3) continue
          candidates.push({
            easyA,
            easyB,
            hardA,
            hardB,
            nEasyA,
            nHardA,
            nEasyB,
            nHardB,
            totalA,
            totalB,
            okA,
            okB,
            rateA,
            rateB,
          })
        }
      }
    }
  }
  return candidates[seed % candidates.length]
}

const SIMPSON_CONTEXTS = [
  {
    unitA: 'Method A',
    unitB: 'Method B',
    subject: 'repair jobs',
    easy: 'simple jobs',
    hard: 'complex jobs',
    one: 'complex job',
    mix: 'job difficulty',
    win: 'finished on time',
  },
  {
    unitA: 'Clinic A',
    unitB: 'Clinic B',
    subject: 'cases',
    easy: 'routine cases',
    hard: 'difficult cases',
    one: 'difficult case',
    mix: 'case difficulty',
    win: 'recovered fully',
  },
  {
    unitA: 'Tutor A',
    unitB: 'Tutor B',
    subject: 'students',
    easy: 'students already on target',
    hard: 'students well below target',
    one: 'student well below target',
    mix: 'starting level',
    win: 'reached the target grade',
  },
] as const

const simpson = tpl(
  {
    id: 'dl-simpson-reversal',
    name: 'When the totals point the other way',
    skillIds: ['s-corr'],
    bucket: 'science',
    difficulty: 5,
    variants: 12,
    minutes: 5,
    kind: 'multi',
    calibration: true,
  },
  (rng, seed) => {
    const d = simpsonCase(seed)
    const ctx = SIMPSON_CONTEXTS[seed % SIMPSON_CONTEXTS.length]
    const parts: ItemPart[] = [
      {
        stage: 'Total A',
        prompt: `Across ALL ${d.totalA} ${ctx.subject}, what percent did ${ctx.unitA} get ${ctx.win}? (One decimal place.)`,
        answer: numeric(d.rateA, { tolerance: 0.05, unit: '%' }),
        explanation: `${(d.easyA * d.nEasyA) / 100} + ${(d.hardA * d.nHardA) / 100} = ${d.okA} out of ${d.totalA}, so ${d.okA} ÷ ${d.totalA} × 100 = **${d.rateA}%**.`,
        hints: [
          'Add the successes from both groups, then divide by the total number of jobs — never average the two percentages.',
          `Worked path: ${(d.easyA * d.nEasyA) / 100} + ${(d.hardA * d.nHardA) / 100} = ${d.okA}; ${d.okA} ÷ ${d.totalA} × 100 = ${d.rateA}.`,
        ],
      },
      {
        stage: 'Total B',
        prompt: `And across all ${d.totalB} of ${ctx.unitB}'s ${ctx.subject}? (One decimal place.)`,
        answer: numeric(d.rateB, { tolerance: 0.05, unit: '%' }),
        explanation: `${(d.easyB * d.nEasyB) / 100} + ${(d.hardB * d.nHardB) / 100} = ${d.okB} out of ${d.totalB}, so ${d.okB} ÷ ${d.totalB} × 100 = **${d.rateB}%**. So ${ctx.unitB} wins both groups separately and loses the total.`,
        hints: [
          'Same method as before, using this row\'s own numbers.',
          `Worked path: ${(d.easyB * d.nEasyB) / 100} + ${(d.hardB * d.nHardB) / 100} = ${d.okB}; ${d.okB} ÷ ${d.totalB} × 100 = ${d.rateB}.`,
        ],
      },
      {
        stage: 'Mechanism',
        prompt: 'Both totals are computed correctly. So what produced the reversal?',
        answer: mcq(rng, `The two took on very different mixes of ${ctx.mix}`, [
          'The percentages were averaged together instead of being properly weighted',
          'The group sizes here are far too small for the totals to mean anything',
          'One of the four success rates must have been written down wrongly',
        ]),
        explanation:
          `**The two took on very different mixes of ${ctx.mix}.** ${ctx.unitA} handled ${d.nEasyA} ${ctx.easy} against only ${d.nHardA} ${ctx.hard}; ${ctx.unitB} had the opposite load (${d.nEasyB} and ${d.nHardB}). Difficulty is a confounder here: it drives the success rate AND differs between the two, so the totals compare workloads as much as methods.`,
        hints: [
          'Nothing is wrong with the arithmetic, so look at what each total is an average OF.',
          'Compare how many easy and how many hard jobs each one took on.',
        ],
      },
      {
        stage: 'Decide',
        prompt: `One more ${ctx.one} needs doing. Which comparison should decide it?`,
        answer: mcq(rng, `The ${ctx.hard} row: ${d.hardB}% against ${d.hardA}%`, [
          `The overall totals, since those are based on all of the ${ctx.subject}`,
          'The average of the two rows, which balances the two of them out',
          'Neither of them — a reversal makes both comparisons useless',
        ]),
        explanation:
          `**The ${ctx.hard} row.** For a decision about a ${ctx.one}, the relevant evidence is what happened to ${ctx.hard}: ${d.hardB}% against ${d.hardA}%. The totals mix in a load of ${ctx.easy} that has nothing to do with this decision. "More data" is not the same as "the right comparison", and a reversal does not make the data useless — it tells you which split to look at.`,
        hints: [
          'Ask which rows contain jobs like the one being decided.',
          'The total is a weighted blend of both rows; the weights are case mix, not performance.',
        ],
      },
    ]
    return {
      title: 'The winner that loses every group',
      prompt:
        `**${ctx.easy.charAt(0).toUpperCase() + ctx.easy.slice(1)}.** ${ctx.unitA}: ${(d.easyA * d.nEasyA) / 100} of ${d.nEasyA} ${ctx.win} (${d.easyA}%). ${ctx.unitB}: ${(d.easyB * d.nEasyB) / 100} of ${d.nEasyB} (${d.easyB}%).\n\n` +
        `**${ctx.hard.charAt(0).toUpperCase() + ctx.hard.slice(1)}.** ${ctx.unitA}: ${(d.hardA * d.nHardA) / 100} of ${d.nHardA} ${ctx.win} (${d.hardA}%). ${ctx.unitB}: ${(d.hardB * d.nHardB) / 100} of ${d.nHardB} (${d.hardB}%).\n\n` +
        `${ctx.unitB} is ahead in both rows. Now work out the totals.`,
      parts,
      hints: [
        'To combine two groups, add the successes and add the totals. Averaging two percentages ignores how many are behind each one.',
        `${ctx.unitA} did mostly ${ctx.easy}; ${ctx.unitB} did mostly ${ctx.hard}. Ask what that does to the totals.`,
        `Worked path: ${ctx.unitA} is ${d.okA}/${d.totalA} = ${d.rateA}%, ${ctx.unitB} is ${d.okB}/${d.totalB} = ${d.rateB}% — the reverse of both rows.`,
      ],
      explanation:
        `${ctx.unitB} wins ${ctx.easy} (${d.easyB}% to ${d.easyA}%) and wins ${ctx.hard} (${d.hardB}% to ${d.hardA}%), yet loses the total ${d.rateB}% to ${d.rateA}%. Every one of those numbers is correct.\n\n` +
        `The totals are weighted averages, and the weights are the case mix: ${ctx.unitA}'s total is dominated by ${ctx.easy}, where everybody does well, and ${ctx.unitB}'s by ${ctx.hard}, where nobody does. Aggregating threw away the variable that was doing the work.\n\n` +
        'The general lesson is uncomfortable: a total is not a neutral summary. Whenever a group difference reverses on aggregation, look for the variable that is unevenly distributed between the groups — and prefer the comparison made INSIDE it.',
    }
  },
)

const adjustDirection = tpl(
  {
    id: 'dl-adjust-direction',
    name: 'Which way does adjusting move it?',
    skillIds: ['s-corr'],
    bucket: 'science',
    difficulty: 4,
    variants: 6,
    minutes: 3,
    transfer: true,
  },
  (rng, seed) => {
    const OPTIONS = [
      'The gap should shrink, perhaps to nothing',
      'The gap should grow once the groups match',
      'The gap should stay roughly where it is now',
      'The gap should flip and point the other way',
    ] as const
    const cases = [
      {
        setup:
          'Runners wearing the new shoe post faster times than runners in ordinary shoes. The new shoe is expensive, and the runners who buy it are the club\'s fastest members.',
        adjust: 'Compare only within each ability tier',
        answer: 0,
        why: 'The confounder (ability) pushes in the SAME direction as the claimed effect, so removing it takes some of the apparent advantage away with it.',
      },
      {
        setup:
          'Drivers who have taken the advanced safety course crash about as often as drivers who have not. The course is compulsory for drivers who have already had two or more crashes.',
        adjust: 'Compare only within groups matched on crash history',
        answer: 1,
        why: 'The confounder pushes AGAINST the claimed effect: the course group was worse to begin with. Matching on history removes that handicap and lets any real benefit show.',
      },
      {
        setup:
          'Patients treated at the specialist hospital die more often than patients at the local one. The specialist hospital receives the most serious cases from the whole region.',
        adjust: 'Compare within each severity band',
        answer: 3,
        why: 'The whole difference is case mix and it runs strongly against the specialist unit. Once severity is held level, the ranking can reverse outright.',
      },
      {
        setup:
          'Students who use the study app score higher on the end-of-year test. The app is free, and take-up is about the same in every subject and every year group.',
        adjust: 'Compare within subject and year group',
        answer: 2,
        why: 'A variable that is spread evenly across the two groups is not a confounder at all, so adjusting for it moves nothing.',
      },
      {
        setup:
          'Employees who took the optional coding course earn more a year later. Managers nominated the employees they already rated most highly for the course.',
        adjust: 'Compare within each prior performance rating',
        answer: 0,
        why: 'Prior rating drives both selection and pay, in the same direction as the claimed effect, so holding it constant eats into the gap.',
      },
      {
        setup:
          'A charity finds that its emergency grants go to households with WORSE outcomes six months later. Grants are given only to households already in the deepest difficulty.',
        adjust: 'Compare within households matched on starting difficulty',
        answer: 3,
        why: 'The grant is targeted at the worst-off, so the raw comparison is upside down. Matching on starting difficulty can turn an apparent harm into an apparent benefit.',
      },
    ] as const
    const c = cycle(seed, cases)
    const noted = mcqNoted(
      rng,
      OPTIONS[c.answer],
      OPTIONS.map((_text, i) => i)
        .filter((i) => i !== c.answer)
        .map((i): [string, string, ErrorTag] => [
          OPTIONS[i],
          i === 0
            ? 'Assumes every confounder inflates an effect. Some hide one instead.'
            : i === 1
              ? 'Assumes the confounder works against the effect; check which way it actually leans.'
              : i === 2
                ? 'Treats the variable as irrelevant, but it differs between the groups here.'
                : 'Expects a full reversal, which needs the confounder to be doing all of the work.',
          'inference',
        ]),
    )
    return {
      title: 'Before and after adjusting',
      prompt: `${c.setup}\n\n${c.adjust}. What happens to the difference?`,
      answer: noted.answer,
      distractorNotes: noted.distractorNotes,
      distractorTags: noted.distractorTags,
      hints: [
        'Work out which group the confounder favours BEFORE the comparison is adjusted.',
        'If the confounder leans the same way as the claimed effect, adjusting shrinks the gap; if it leans against, adjusting can enlarge or reverse it.',
        `Worked path: **${OPTIONS[c.answer]}**. ${c.why}`,
      ],
      explanation:
        `**${OPTIONS[c.answer]}.** ${c.why}\n\n` +
        'The useful habit is to predict the direction before you look. A confounder is not a general fog that makes effects look bigger; it has a direction, and you can usually work it out from who ends up in which group. That is also the honest test of understanding: anyone can say "there might be a confounder", and only the direction argument survives contact with the data.',
    }
  },
)

// ============================================================== s-graphs

const LINE_CONTEXTS = [
  { x: 'minutes of revision', y: 'quiz score', xUnit: 'minutes', yUnit: 'points', at: 45 },
  { x: 'millimetres of rain in the week', y: 'kilograms picked', xUnit: 'mm', yUnit: 'kg', at: 12 },
  { x: 'age of the phone in months', y: 'battery hours', xUnit: 'months', yUnit: 'hours', at: 20 },
  { x: 'kilometres from the city centre', y: 'monthly rent in hundreds', xUnit: 'km', yUnit: 'hundreds', at: 8 },
] as const

const linePredict = tpl(
  {
    id: 'dl-line-predict',
    name: 'Slope, intercept, prediction',
    skillIds: ['s-graphs'],
    bucket: 'science',
    difficulty: 3,
    variants: 16,
    minutes: 3.5,
    kind: 'multi',
  },
  (rng, seed) => {
    const ctx = LINE_CONTEXTS[seed % LINE_CONTEXTS.length]
    const block = Math.floor(seed / LINE_CONTEXTS.length)
    const negative = seed % LINE_CONTEXTS.length >= 2
    const magnitude = [0.5, 1.5, 2, 2.5][block % 4]
    const slope = negative ? -magnitude : magnitude
    const intercept = [12, 20, 34, 46][(block + seed) % 4]
    const at = ctx.at + block * 4
    // Points sit exactly on the line, so the fit is exact and re-derivable.
    const xs = [at - 12, at - 6, at, at + 6, at + 12]
    const points = xs.map((x) => [x, round(intercept + slope * x, 2)] as [number, number])
    const fit = fitLine(points)
    const b = round(fit.slope, 4)
    const a = round(fit.intercept, 4)
    const predicted = round(a + b * at, 2)
    const step = round(Math.abs(b) * 10, 2)
    const parts: ItemPart[] = [
      {
        stage: 'Predict',
        prompt: `What does the line predict for ${ctx.y} at **${at} ${ctx.xUnit}**? (Two decimal places at most.)`,
        answer: numeric(predicted, { tolerance: 0.01, unit: ctx.yUnit }),
        explanation: `Substitute: ${a} + (${b} × ${at}) = **${predicted}**.`,
        hints: [
          'Put the x value into the equation and evaluate. Nothing else is needed.',
          `Worked path: ${a} + ${b} × ${at} = ${predicted}.`,
        ],
      },
      {
        stage: 'Slope',
        prompt: 'What does the slope mean here?',
        answer: mcq(
          rng,
          `Each extra 10 ${ctx.xUnit} goes with about ${step} ${negative ? 'fewer' : 'more'} ${ctx.yUnit}`,
          [
            `Each extra 10 ${ctx.xUnit} makes ${ctx.y} change by ${step}`,
            `The average ${ctx.y} across this data is about ${step} ${ctx.yUnit}`,
            `About ${step}% of the change in ${ctx.y} is explained`,
          ],
        ),
        explanation:
          `**Each extra 10 ${ctx.xUnit} goes with about ${step} ${negative ? 'fewer' : 'more'} ${ctx.yUnit}.** A slope is a rate of association per unit of x, so ten units move it ten times as far. The second option is the same arithmetic wearing a causal verb — "makes" claims something a fitted line cannot show. The third confuses the slope with an average, and the fourth with r².`,
        hints: [
          'A slope answers: if x goes up by one, what happens to the predicted y?',
          'Check the VERB in each option as carefully as the number.',
        ],
      },
      {
        stage: 'Intercept',
        prompt: `The line puts ${ctx.y} at ${a} when ${ctx.x} is zero. Why treat that with caution?`,
        answer: mcq(rng, `No data was collected anywhere near zero ${ctx.xUnit}`, [
          'An intercept is a fitted constant, so it never means anything',
          'The intercept can only be read when the slope is positive',
          `The formula cannot be worked out at zero ${ctx.xUnit} at all`,
        ]),
        explanation:
          `**No data was collected anywhere near zero.** The x values here run from ${xs[0]} to ${xs[4]} ${ctx.xUnit}, so zero is outside the range the line was fitted to, and a line has no obligation to keep behaving beyond its data. That is extrapolation. The intercept is not meaningless in general — where data reaches zero it is a real prediction — and nothing about it depends on the sign of the slope.`,
        hints: [
          'Compare zero against the range of x values the line was actually fitted to.',
          'Ask what evidence the line has about a region it never saw.',
        ],
      },
    ]
    return {
      title: 'Reading a fitted line',
      prompt:
        `A least-squares line is fitted to ${ctx.y} against ${ctx.x}:\n\n**predicted ${ctx.y} = ${a} + ${b} × (${ctx.x})**\n\n` +
        `The data used to fit it covers ${ctx.x} from ${xs[0]} to ${xs[4]} ${ctx.xUnit}.`,
      parts,
      hints: [
        'The equation does all the arithmetic; read it as "start at the intercept, then add the slope for every unit of x".',
        'For meaning questions, watch for a causal verb slipped into an option about a fitted line.',
        `Worked path: at ${at} ${ctx.xUnit} the prediction is ${a} + ${b} × ${at} = ${predicted}.`,
      ],
      explanation:
        `The line predicts ${predicted} ${ctx.yUnit} at ${at} ${ctx.xUnit}, moves ${step} ${ctx.yUnit} per 10 ${ctx.xUnit}, and reads ${a} at zero — outside the fitted range of ${xs[0]} to ${xs[4]}.\n\n` +
        'Three habits go with any fitted line: substitute rather than eyeball, state the slope as an association per unit unless something licensed a causal claim, and check whether the x you are asking about lies inside the data before trusting the answer.',
    }
  },
)

const RESIDUAL_CONTEXTS = [
  { x: 'weeks of practice', y: 'words typed per minute', unit: 'wpm', xs: [1, 2, 3, 4, 5] },
  { x: 'hours of light per day', y: 'height in millimetres', unit: 'mm', xs: [2, 4, 6, 8, 10] },
  { x: 'grams of feed per day', y: 'eggs collected in a month', unit: 'eggs', xs: [10, 20, 30, 40, 50] },
  { x: 'kilometres from the coast', y: 'summer rainfall in millimetres', unit: 'mm', xs: [5, 10, 15, 20, 25] },
] as const

const residual = tpl(
  {
    id: 'dl-residual',
    name: 'Residual, and which way the line missed',
    skillIds: ['s-graphs'],
    bucket: 'science',
    difficulty: 4,
    variants: 12,
    minutes: 4,
    kind: 'multi',
  },
  (rng, seed) => {
    const ctx = RESIDUAL_CONTEXTS[seed % RESIDUAL_CONTEXTS.length]
    const block = Math.floor(seed / RESIDUAL_CONTEXTS.length)
    // Deviations chosen so that sum(d) = 0 AND sum(d * x) = 0, which makes the
    // least-squares fit EXACTLY the line the item shows and the residual at
    // point i exactly d[i]. Verified by fitLine below rather than asserted.
    const k = [2, 3, 4][block % 3]
    const patterns: number[][] = [
      [k, -k, 0, -k, k],
      [-k, k, 0, k, -k],
      [k, 0, -2 * k, 0, k],
    ]
    const dev = patterns[block % patterns.length]
    const baseSlope = [3, 2, 4][block % 3]
    const baseIntercept = [20, 14, 30][seed % 3]
    const negative = seed % RESIDUAL_CONTEXTS.length === 3
    const slope = negative ? -baseSlope : baseSlope
    const points = ctx.xs.map((x, i) => [x, baseIntercept + slope * x + dev[i]] as [number, number])
    const fit = fitLine(points)
    const b = round(fit.slope, 4)
    const a = round(fit.intercept, 4)
    const askIndex = [0, 1, 4][block % 3]
    const askX = ctx.xs[askIndex]
    const observed = points[askIndex][1]
    const predicted = round(a + b * askX, 2)
    const res = round(observed - predicted, 2)
    const above = res > 0
    const listed = points.map(([x, y]) => `${x} → ${y}`).join(', ')
    const parts: ItemPart[] = [
      {
        stage: 'Predict',
        prompt: `What does the line predict at ${ctx.x} = **${askX}**?`,
        answer: numeric(predicted, { tolerance: 0.01, unit: ctx.unit }),
        explanation: `${a} + ${b} × ${askX} = **${predicted} ${ctx.unit}**.`,
        hints: [
          'Use the equation, not the data point. The prediction is what the line says, before you look at what happened.',
          `Worked path: ${a} + ${b} × ${askX} = ${predicted}.`,
        ],
      },
      {
        stage: 'Residual',
        prompt: `The value actually recorded there was ${observed}. What is the residual?`,
        answer: numeric(res, { tolerance: 0.01, unit: ctx.unit }),
        explanation: `Residual = observed − predicted = ${observed} − ${predicted} = **${signed(res)}**.`,
        hints: [
          'Residual = observed − predicted, always in that order. The order is what gives the sign its meaning.',
          `Worked path: ${observed} − ${predicted} = ${signed(res)}.`,
        ],
      },
      {
        stage: 'Sign',
        prompt: 'What does the sign of that residual tell you?',
        answer: mcq(
          rng,
          above ? 'The line predicted too low at that point' : 'The line predicted too high at that point',
          above
            ? [
                'The line predicted too high at that point',
                'The point lies further to the right than the others do',
                'The line has been given too steep a slope everywhere',
              ]
            : [
                'The line predicted too low at that point',
                'The point lies further to the left than the others do',
                'The line has been given too shallow a slope everywhere',
              ],
        ),
        explanation:
          `A ${above ? 'positive' : 'negative'} residual means the observed value sits ${above ? 'ABOVE' : 'BELOW'} the line, so the model predicted too ${above ? 'low' : 'high'} there. The sign is about the vertical gap at that x — it says nothing about where the point sits left to right, and nothing about the slope, which is fitted to all five points at once.`,
        hints: [
          'Rewrite it as: observed = predicted + residual. Then ask what a positive residual does to the observed value.',
          'The sign describes the vertical gap at one x value, not the whole line.',
        ],
      },
    ]
    return {
      title: 'How far off, and which way',
      prompt:
        `Five measurements of ${ctx.y} against ${ctx.x}:\n\n${listed}\n\n` +
        `The least-squares line through them is **predicted ${ctx.y} = ${a} + ${b} × (${ctx.x})**.`,
      parts,
      hints: [
        'Prediction comes from the equation; the residual compares it with what was actually recorded.',
        'Residual = observed − predicted. Positive means the real value was above the line.',
        `Worked path: predicted ${predicted}, observed ${observed}, residual ${signed(res)}.`,
      ],
      explanation:
        `At ${ctx.x} = ${askX} the line predicts ${predicted} and the data says ${observed}, so the residual is ${signed(res)} — the line sits ${above ? 'below' : 'above'} the point.\n\n` +
        'Residuals are where a fitted line becomes checkable. Their signs should look scattered: a run of positives at one end and negatives at the other means the relationship bends and a straight line is the wrong summary, which is the single most useful thing a residual plot can tell you.',
    }
  },
)

const rMeaning = tpl(
  {
    id: 'dl-r-meaning',
    name: 'What r does and does not say',
    skillIds: ['s-graphs'],
    bucket: 'science',
    difficulty: 4,
    variants: 8,
    minutes: 3,
  },
  (rng, seed) => {
    const cases = [
      {
        setup: 'A scatterplot forms a clear upside-down U: yield rises with fertiliser, peaks, then falls. The correlation coefficient is r = 0.03.',
        q: 'What does that r establish?',
        correct: 'A straight-line pattern is ruled out; a curved one is not',
        wrong: [
          ['Fertiliser and yield are essentially unrelated here', 'Reads r as a measure of relationship in general rather than of LINEAR relationship.', 'concept'],
          ['The measurements must contain a serious recording error somewhere', 'Blames the data for a number the shape fully explains.', 'concept'],
          ['Correlation cannot be computed at all for a curved pattern', 'It can be computed; it just answers a question about straight lines.', 'concept'],
        ] as [string, string, ErrorTag][],
        why: 'r measures how well a STRAIGHT line describes the cloud. A symmetric arch has a rising half and a falling half that cancel, so r lands near zero while the relationship is strong and obvious. Always look at the plot before believing an r near zero.',
      },
      {
        setup: 'Two variables are recorded on 90 people and the correlation comes out at r = 0.88.',
        q: 'What follows?',
        correct: 'The points sit close to a straight line, in one direction',
        wrong: [
          ['One of the two variables is driving the other one along', 'A correlation of any size carries no direction of cause.', 'inference'],
          ['About 88% of the points fall exactly on the fitted line', 'r is not a percentage of points; r² is a share of variance.', 'concept'],
          ['The slope of the relationship must be a steep one as well', 'Tightness around a line and the steepness of that line are separate facts.', 'concept'],
        ] as [string, string, ErrorTag][],
        why: 'A high r says the scatter hugs a line. It does not say which way cause runs, does not count points on the line, and does not tell you the slope: a nearly flat line can have r = 0.99 if the points hug it closely.',
      },
      {
        setup: 'Heights and arm spans are recorded in centimetres, giving r = 0.82. Someone converts both columns to metres and recomputes.',
        q: 'What is the new r?',
        correct: 'Still 0.82, because r has no units at all',
        wrong: [
          ['0.0082, since both columns shrank by a factor of 100', 'Treats r as if it carried the units of the measurements.', 'concept'],
          ['Larger, because the numbers are now closer together', 'Confuses the spread of the numbers with the tightness of the pattern.', 'concept'],
          ['Impossible to know without recomputing from the data', 'Misses that a linear rescaling cannot change r.', 'concept'],
        ] as [string, string, ErrorTag][],
        why: 'r is computed from standardised distances, so multiplying every value by a constant leaves it untouched. That is a genuine strength — it lets you compare the tightness of two relationships measured in completely different units — and it is also why r tells you nothing about the practical size of an effect.',
      },
      {
        setup: 'A study of 40 towns finds r = −0.76 between the number of bus routes and average commute time.',
        q: 'How strong is that relationship?',
        correct: 'Strong; the minus sign only fixes the direction',
        wrong: [
          ['Weak, because a negative correlation is a poor one', 'Reads the sign as a quality judgement rather than a direction.', 'concept'],
          ['Weaker than an r of +0.5 would have been here', 'Compares signed values instead of distance from zero.', 'concept'],
          ['Impossible to judge without knowing the sample size', 'Sample size affects precision, not what the value means.', 'concept'],
        ] as [string, string, ErrorTag][],
        why: 'Strength lives in the distance from zero, so −0.76 and +0.76 are equally strong and point opposite ways. Sample size matters for how precisely r is pinned down, but it does not change what a given value describes.',
      },
      {
        setup: 'Nineteen points lie in a loose blob with r ≈ 0. A twentieth is then added far out to the upper right, and r jumps to 0.71.',
        q: 'What is the right conclusion?',
        correct: 'One extreme point can carry a correlation on its own',
        wrong: [
          ['The twentieth point revealed the true underlying pattern', 'Treats the most influential single observation as the most informative one.', 'inference'],
          ['The first nineteen points must have been measured badly', 'Blames the bulk of the data for the behaviour of one point.', 'concept'],
          ['Adding one point out of twenty cannot change r much', 'Contradicts the arithmetic: distant points dominate the calculation.', 'concept'],
        ] as [string, string, ErrorTag][],
        why: 'r is built from products of distances from the means, so a point far out in both directions contributes an enormous term. The fix is not to delete it silently: report r with and without, say which point drives the difference, and find out what that point is.',
      },
      {
        setup: 'A report states that revision time and exam score have r = 0.6, and adds: "so revision explains 60% of the difference in scores".',
        q: 'What is wrong with the added sentence?',
        correct: 'It should be 36%, and only as shared variation',
        wrong: [
          ['Nothing is wrong; r of 0.6 does mean 60% explained', 'The common slip: reading r itself as a proportion.', 'concept'],
          ['It should be 60% of the scores rather than the difference', 'Rewords the claim without fixing the arithmetic.', 'concept'],
          ['It should be 77%, since that is the square root of 0.6', 'Applies the transformation backwards.', 'slip'],
        ] as [string, string, ErrorTag][],
        why: 'r² is the share of variation accounted for by the linear fit: 0.6² = 0.36. And "explains" is doing quiet work — the fit accounts for variation arithmetically; it does not establish that revision produced it.',
      },
      {
        setup: 'Two variables have r = 0.95, and the fitted line has a slope of 0.02 units of y per unit of x.',
        q: 'What does the high r tell you about how much y moves?',
        correct: 'Nothing — tightness and steepness are separate',
        wrong: [
          ['That y moves a great deal for each unit of x', 'Reads a high r as a large effect.', 'concept'],
          ['That the slope must have been computed wrongly', 'Assumes a high r and a small slope cannot coexist.', 'concept'],
          ['That the relationship is strong and so worth acting on', 'Jumps from tight fit to practical importance.', 'inference'],
        ] as [string, string, ErrorTag][],
        why: 'r says the points hug a line; the slope says how tilted that line is. A near-perfect correlation with a slope of 0.02 describes a relationship you can predict beautifully and which barely matters in practice — which is exactly why a report should give both.',
      },
      {
        setup: 'Across a whole city, house price and distance from the centre have r = 0.1. Within each neighbourhood taken separately, r is about −0.7.',
        q: 'What is going on?',
        correct: 'Pooling different groups can mask a within-group pattern',
        wrong: [
          ['The city-wide figure is much the more reliable of the two', 'Prefers the bigger sample without asking what it pooled.', 'inference'],
          ['One of the two calculations has to be a mistake somewhere', 'Both can be correct at once; that is the point.', 'concept'],
          ['Distance stops mattering once a city gets big enough', 'Invents a mechanism to explain away an artefact of pooling.', 'inference'],
        ] as [string, string, ErrorTag][],
        why: 'Neighbourhoods differ in overall price level, so pooling them stacks clouds at different heights and the combined shape says little about any of them. It is the correlation version of a reversing average: whenever pooled and within-group answers disagree, the grouping variable is doing the work.',
      },
    ] as const
    const c = cycle(seed, cases)
    const noted = mcqNoted(rng, c.correct, c.wrong.map((w) => [w[0], w[1], w[2]] as [string, string, ErrorTag]))
    return {
      title: 'Reading a correlation coefficient',
      prompt: `${c.setup}\n\n${c.q}`,
      answer: noted.answer,
      distractorNotes: noted.distractorNotes,
      distractorTags: noted.distractorTags,
      hints: [
        'r answers one narrow question: how closely do these points hug a STRAIGHT line, and in which direction?',
        'Things r never answers: what causes what, how steep the line is, and whether the pattern is curved.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}.** ${c.why}`,
    }
  },
)

const outlierLeverage = tpl(
  {
    id: 'dl-outlier-leverage',
    name: 'The point that moves the line',
    skillIds: ['s-graphs'],
    bucket: 'science',
    difficulty: 5,
    variants: 8,
    minutes: 4,
    transfer: true,
  },
  (_rng, seed) => {
    const ctx = RESIDUAL_CONTEXTS[seed % RESIDUAL_CONTEXTS.length]
    const block = Math.floor(seed / RESIDUAL_CONTEXTS.length)
    const slope = [2, 3][block % 2]
    const intercept = [15, 25][block % 2]
    const step = ctx.xs[1] - ctx.xs[0]
    const base = ctx.xs.map((x) => [x, intercept + slope * x] as [number, number])
    const edgeX = ctx.xs[4] + step
    const midX = ctx.xs[2]
    const off = [14, 21][block % 2]
    const withEdge = [...base, [edgeX, intercept + slope * edgeX + off] as [number, number]]
    const withMid = [...base, [midX, intercept + slope * midX + off] as [number, number]]
    const fitBase = fitLine(base)
    const fitEdge = fitLine(withEdge)
    const fitMid = fitLine(withMid)
    const b0 = round(fitBase.slope, 2)
    const bEdge = round(fitEdge.slope, 2)
    const bMid = round(fitMid.slope, 2)
    const shiftEdge = round(bEdge - b0, 2)
    return {
      title: 'Where an odd point does its damage',
      prompt:
        `Five ${ctx.y} readings lie exactly on a straight line: **${base.map(([x, y]) => `${x} → ${y}`).join(', ')}**, giving a slope of **${b0}**.\n\n` +
        `A sixth reading is now added, sitting **${off} ${ctx.unit} above** the line. Two versions of where it could sit:\n\n` +
        `**Version A** — at ${ctx.x} = ${edgeX}, beyond the end of the original range. The refitted slope becomes **${bEdge}**.\n` +
        `**Version B** — at ${ctx.x} = ${midX}, in the middle of the range. The refitted slope becomes **${bMid}**.\n\n` +
        `In version A, how much did the slope change? (Two decimal places.)`,
      answer: numeric(shiftEdge, { tolerance: 0.01 }),
      hints: [
        'Subtract the original slope from the refitted one. Mind the sign.',
        `Both extra points are the same distance off the line — compare what each did to the slope: ${b0} → ${bEdge}, and ${b0} → ${bMid}.`,
        `Worked path: ${bEdge} − ${b0} = **${shiftEdge}**.`,
      ],
      explanation:
        `Version A moved the slope by ${bEdge} − ${b0} = **${shiftEdge}**. Version B, the same ${off} ${ctx.unit} off the line but in the middle, left the slope at ${bMid}.\n\n` +
        'Same size of error, very different consequence. A point far from the mean of x has LEVERAGE: it sits at the end of a long arm, so pulling it up tilts the whole line. A point near the middle of the x range pulls the line up bodily and barely rotates it — it changes the intercept, not the slope.\n\n' +
        'Two working rules follow. First, an outlier is not one thing: how much it matters depends on where it sits along x, not only on how far it is from the line. Second, do not delete it quietly. Report the fit with and without, name the point, and go and find out what it was — a stuck sensor and a real rare event look identical in a scatterplot and mean opposite things.',
    }
  },
)

const axisFactor = tpl(
  {
    id: 'dl-axis-factor',
    name: 'How much the axis exaggerates',
    skillIds: ['s-graphs'],
    bucket: 'science',
    difficulty: 3,
    variants: 12,
    minutes: 2.5,
  },
  (_rng, seed) => {
    const firsts = [120, 140, 160, 180]
    const gaps = [10, 20, 25]
    const rises = [15, 20, 30, 40]
    const first = firsts[seed % firsts.length]
    const gap = gaps[Math.floor(seed / 4) % gaps.length]
    const rise = rises[(seed + Math.floor(seed / 4)) % rises.length]
    const base = first - gap
    const second = first + rise
    const looks = round((second - base) / (first - base), 2)
    const truth = round((second / first) * 100 - 100, 1)
    return {
      title: 'The bar that lies without lying',
      prompt:
        `A bar chart shows two months of orders. The vertical axis starts at **${base}** instead of zero.\n\n` +
        `March: **${first}** orders. April: **${second}** orders.\n\n` +
        `Each bar is drawn from the axis line upward, so its height is the amount ABOVE ${base}.\n\n` +
        `How many times taller than March's bar does April's bar LOOK? (Two decimal places.)`,
      answer: numeric(looks, { tolerance: 0.01 }),
      hints: [
        'Work out how tall each bar actually is on the page: the value minus where the axis starts.',
        `March draws ${first} − ${base} = ${first - base} units of height; April draws ${second} − ${base} = ${second - base}.`,
        `Worked path: ${second - base} ÷ ${first - base} = **${looks}**.`,
      ],
      explanation:
        `Drawn heights are ${first - base} and ${second - base}, so April's bar looks **${looks} times** taller. The real increase is ${second} ÷ ${first} = ${round(second / first, 3)}, a rise of ${truth}%.\n\n` +
        `Nothing on this chart is false. Both numbers are printed correctly and the bars are drawn to scale — from ${base}. The distortion is in the reader's eye, which takes bar LENGTH as quantity, and a truncated axis breaks that correspondence by cutting ${base} units off the bottom of every bar.\n\n` +
        'The check takes two seconds and works every time: find where the vertical axis starts before you look at the shape. If it is not zero, recompute the ratio from the numbers.',
    }
  },
)

// ============================================================= s-sources

const MISSING_OPTIONS = [
  'The reported figure comes out too high',
  'The reported figure comes out too low',
  'It stays unbiased, but becomes less precise',
  'The direction cannot be settled by this one',
] as const

const missingDirection = tpl(
  {
    id: 'dl-missing-direction',
    name: 'Which way does the missing data push?',
    skillIds: ['s-sources'],
    bucket: 'science',
    difficulty: 4,
    variants: 8,
    minutes: 3,
  },
  (rng, seed) => {
    const cases = [
      {
        setup: 'A gym emails a satisfaction survey to everyone on its current membership list and reports an average rating of 4.6 out of 5.',
        answer: 0,
        why: 'Everyone who disliked the gym enough to leave is already off the list, so the unhappiest members were removed before the survey was sent.',
      },
      {
        setup: 'A course reports the average final grade of the students who completed it. About a fifth of those who enrolled dropped out partway.',
        answer: 0,
        why: 'Students who drop out are, on the whole, the ones who were struggling, so the completers are the stronger part of the original group.',
      },
      {
        setup: 'A salary survey is sent to everyone in a company. Most people reply, but many of the highest earners decline to give a figure.',
        answer: 1,
        why: 'The values missing are concentrated at the top of the distribution, so the average of what remains sits below the true average.',
      },
      {
        setup: 'A researcher phones a random sample of households at 10am on weekdays and asks how long each person\'s daily commute takes.',
        answer: 1,
        why: 'People at home mid-morning on a weekday are disproportionately those who do not commute far, or at all, so long commutes are systematically under-sampled.',
      },
      {
        setup: 'A hospital reports recovery scores for the patients who came back for their six-month check-up. Attendance at that check-up was about 60%.',
        answer: 3,
        why: 'Two forces pull opposite ways: people who feel completely better often skip a follow-up, and people who feel worst may be too unwell to attend. Without knowing which dominates, the direction is genuinely open — and saying so is the honest answer.',
      },
      {
        setup: 'A step-counting app reports the average daily steps of its users, counting only the days on which the phone was carried.',
        answer: 0,
        why: 'Days when the phone was left behind are usually low-activity days at home, and dropping them lifts the average above the true one.',
      },
      {
        setup: 'A survey of 2,000 randomly chosen adults has a 3% refusal rate, and the refusals are spread evenly across ages, regions and incomes.',
        answer: 2,
        why: 'This is the case where missing data is not a bias problem: if who is missing is unrelated to what is being measured, the estimate stays centred and only its precision suffers.',
      },
      {
        setup: 'A product page shows an average of 4.8 stars. Reviews can only be left by customers who did not return the item.',
        answer: 0,
        why: 'Returning the item is the strongest possible signal of dissatisfaction, and exactly those customers are barred from the average.',
      },
    ] as const
    const c = cycle(seed, cases)
    const noted = mcqNoted(
      rng,
      MISSING_OPTIONS[c.answer],
      MISSING_OPTIONS.map((_t, i) => i)
        .filter((i) => i !== c.answer)
        .map((i): [string, string, ErrorTag] => [
          MISSING_OPTIONS[i],
          i === 2
            ? 'Treats missing data as harmless. It is only harmless when who is missing is unrelated to what is measured.'
            : i === 3
              ? 'Gives up on a direction that the description does let you work out.'
              : 'The direction is the other way — ask which end of the scale the missing people sit at.',
          'inference',
        ]),
    )
    return {
      title: 'Who is missing, and where do they sit?',
      prompt: `${c.setup}\n\nWhat does the missing data do to the reported figure?`,
      answer: noted.answer,
      distractorNotes: noted.distractorNotes,
      distractorTags: noted.distractorTags,
      hints: [
        'Name the people who are NOT in the data, in one sentence, before you think about direction.',
        'Then ask: would those people have scored higher or lower than the ones who are in it?',
        `Worked path: **${MISSING_OPTIONS[c.answer]}**. ${c.why}`,
      ],
      explanation:
        `**${MISSING_OPTIONS[c.answer]}.** ${c.why}\n\n` +
        'Missing data is not a fog that makes everything vaguer. It usually has a direction, and you can often work it out from the description alone by asking two questions: who got left out, and where would they have sat on the scale? Only when the answer to the second is genuinely both ways is "cannot tell" the right call — and only when the missing people are unrelated to the measurement does the estimate stay honest.',
    }
  },
)

const missingBounds = tpl(
  {
    id: 'dl-missing-bounds',
    name: 'Best case and worst case under non-response',
    skillIds: ['s-sources'],
    bucket: 'science',
    difficulty: 4,
    variants: 12,
    minutes: 4,
    kind: 'multi',
  },
  (rng, seed) => {
    const SETTINGS = [
      { who: 'students', ask: 'said they would join the trip' },
      { who: 'members', ask: 'said they wanted later opening' },
      { who: 'staff', ask: 'said the new rota worked for them' },
    ] as const
    const NS = [200, 500, 1000]
    const RR = [0.4, 0.5, 0.6, 0.75]
    const YR = [0.5, 0.6, 0.7, 0.8]
    const combos: { n: number; rr: number; yr: number }[] = []
    for (const n of NS) for (const rr of RR) for (const yr of YR) combos.push({ n, rr, yr })
    const c = cycle(seed, combos)
    const ctx = SETTINGS[seed % SETTINGS.length]
    const n = c.n
    const replied = Math.round(n * c.rr)
    const yes = Math.round(replied * c.yr)
    const silent = n - replied
    const amongRepliers = round((yes / replied) * 100, 1)
    const best = round(((yes + silent) / n) * 100, 1)
    const worst = round((yes / n) * 100, 1)
    const width = round(best - worst, 1)
    const parts: ItemPart[] = [
      {
        stage: 'As reported',
        prompt: 'What percent of the people who replied said yes? (One decimal place.)',
        answer: numeric(amongRepliers, { tolerance: 0.05, unit: '%' }),
        explanation: `${yes} ÷ ${replied} × 100 = **${amongRepliers}%**. This is the figure the report quoted — and its denominator is the repliers, not the ${n}.`,
        hints: [
          'Divide by the number who actually replied, since that is the group this figure describes.',
          `Worked path: ${yes} ÷ ${replied} × 100 = ${amongRepliers}.`,
        ],
      },
      {
        stage: 'Best case',
        prompt: `Suppose every one of the ${silent} silent ${ctx.who} would have said yes. What percent of all ${n} is that? (One decimal place.)`,
        answer: numeric(best, { tolerance: 0.05, unit: '%' }),
        explanation: `(${yes} + ${silent}) ÷ ${n} × 100 = ${yes + silent} ÷ ${n} × 100 = **${best}%**.`,
        hints: [
          'Add all the silent people to the yes column, then divide by the WHOLE group.',
          `Worked path: (${yes} + ${silent}) ÷ ${n} × 100 = ${best}.`,
        ],
      },
      {
        stage: 'Worst case',
        prompt: 'And if every silent person would have said no? (One decimal place.)',
        answer: numeric(worst, { tolerance: 0.05, unit: '%' }),
        explanation: `${yes} ÷ ${n} × 100 = **${worst}%**. So the truth is somewhere in the band ${worst}% to ${best}%, a range ${width} points wide.`,
        hints: [
          'The yes count does not change; only the denominator becomes the whole group.',
          `Worked path: ${yes} ÷ ${n} × 100 = ${worst}.`,
        ],
      },
      {
        stage: 'Read it',
        prompt: `The report headlines "${amongRepliers}% of ${ctx.who} ${ctx.ask}". What is the fair criticism?`,
        answer: mcq(rng, `All it settles is a figure between ${worst}% and ${best}%`, [
          `The sample of ${n} ${ctx.who} was far too small for a question like this`,
          'The percentage should have been rounded off to a whole number instead',
          `The ${silent} silent ${ctx.who} ought simply to be counted as saying no`,
        ]),
        explanation:
          `**Between ${worst}% and ${best}%.** The bounds are what the data can support without assuming anything about the silent ${silent}. Counting them all as "no" is not neutral — it is the worst case asserted as fact. And the problem is not the sample size: asking ten times as many people the same way would leave the same gap, because the gap comes from who answered, not from how many were asked.`,
        hints: [
          'Ask what the survey can establish without any assumption about the people who did not reply.',
          'Check whether a bigger sample would have closed this particular gap.',
        ],
      },
    ]
    return {
      title: 'The band the survey can support',
      prompt:
        `A survey goes to **${n}** ${ctx.who}. **${replied}** reply, and of those, **${yes}** ${ctx.ask}. The remaining **${silent}** never answered.`,
      parts,
      hints: [
        'Three different denominators appear here. Decide which group each percentage is about before dividing.',
        'For the bounds, push the silent group all the way one way, then all the way the other.',
        `Worked path: ${amongRepliers}% among repliers; the whole group is somewhere between ${worst}% and ${best}%.`,
      ],
      explanation:
        `Among repliers: ${amongRepliers}%. Across everyone asked: between **${worst}%** and **${best}%**, a band ${width} points wide.\n\n` +
        'This is the cheapest honest thing you can do with non-response, and it needs no statistics at all: assume the missing people all answered one way, then all the other, and report the two numbers. If the band is narrow, the non-response did not matter much. If it straddles the number you care about — a majority, a target, a threshold — then the survey did not answer the question, however large it was.',
    }
  },
)

const whatSettles = tpl(
  {
    id: 'dl-what-settles',
    name: 'What would resolve the disagreement?',
    skillIds: ['s-sources'],
    bucket: 'science',
    difficulty: 4,
    variants: 8,
    minutes: 3,
    transfer: true,
  },
  (rng, seed) => {
    const cases = [
      {
        setup:
          'Police figures show recorded crime in a town fell 18% last year. A door-to-door victim survey in the same town found no change in how many people had been victims.',
        q: 'Which single piece of information would resolve this best?',
        correct: 'Whether the share of incidents reported to police changed',
        wrong: [
          ['Whether the police force changed its own budget last year', 'Plausible background, but it does not connect the two measures.', 'concept'],
          ['Whether other towns saw a similar fall in their recorded crime', 'Tells you how common the pattern is, not which measure to believe.', 'concept'],
          ['Whether the victim survey used a large enough sample', 'Sample size affects precision, not the gap between two definitions.', 'concept'],
        ] as [string, string, ErrorTag][],
        why: 'The two sources measure different things: incidents REPORTED versus incidents EXPERIENCED. A change in reporting rate reconciles them without either being wrong, so that is the fact to get first.',
      },
      {
        setup:
          'A controlled trial found the new inhaler clearly better than the old one. A hospital that switched all its patients over saw no improvement at all.',
        q: 'What would explain the gap most directly?',
        correct: 'Who was eligible to join the trial in the first place',
        wrong: [
          ['How much the new inhaler costs the hospital per patient', 'A real constraint, and irrelevant to whether it works.', 'concept'],
          ['Whether the trial was funded by the inhaler manufacturer', 'Worth knowing, but it does not explain a clean trial failing to replicate.', 'concept'],
          ['How many patients the hospital switched over in total', 'Numbers affect precision, not the direction of the difference.', 'concept'],
        ] as [string, string, ErrorTag][],
        why: 'Trials usually enrol a narrower group than a hospital treats — often younger, with fewer other conditions, and better at using the device. If the trial population differs from the ward population, both results can be correct about different people.',
      },
      {
        setup:
          'Two thermometers in the same greenhouse disagree by about 2 degrees, consistently, all week.',
        q: 'What is the most useful next step?',
        correct: 'Read both against a thermometer of known accuracy',
        wrong: [
          ['Average the two readings and use that as the value', 'Hides the fault instead of finding it; the average may be wrong too.', 'strategy'],
          ['Take many more readings from each of the two devices', 'A consistent offset does not shrink with more readings.', 'concept'],
          ['Move the two thermometers closer together in the greenhouse', 'Sensible if the gap varied; it is constant, which points at calibration.', 'strategy'],
        ] as [string, string, ErrorTag][],
        why: 'A constant offset is the signature of a calibration fault rather than random noise. Comparing against a known standard finds out which one is wrong, and no amount of extra reading or averaging can do that.',
      },
      {
        setup:
          'National exam results were flat this year. One school reports its own results jumped by nine points and credits its new timetable.',
        q: 'What should you ask for first?',
        correct: 'Whether the intake of that school changed this year',
        wrong: [
          ['How many hours the new timetable added to each subject', 'Describes the treatment; it cannot rule out the rival explanation.', 'concept'],
          ['Whether the staff supported the timetable change', 'Interesting for adoption, not for whether the jump is real.', 'concept'],
          ['Whether other schools also changed their timetables this year', 'Useful later, but it does not explain THIS school\'s jump.', 'concept'],
        ] as [string, string, ErrorTag][],
        why: 'A single school moving against a flat national picture has two common explanations: something the school did, or a change in who the school teaches. Intake is the cheaper one to check and it invalidates the claim outright if it moved.',
      },
      {
        setup:
          'A product has 4.9 stars on the maker\'s own website and 3.2 stars on an independent retailer that sells it.',
        q: 'Which fact settles the most?',
        correct: 'Who is allowed to leave a review on each site',
        wrong: [
          ['How many reviews each of the two sites has collected', 'Volume does not fix a difference in who can post.', 'concept'],
          ['Whether the two sites use the same star scale', 'Worth checking, but both use five stars here.', 'concept'],
          ['How long the product has been on sale at each site', 'Could matter at the margins; it is not the main difference.', 'concept'],
        ] as [string, string, ErrorTag][],
        why: 'If one site posts only reviews it has approved, or only from buyers who did not return the item, the two averages are computed over different populations and the gap needs no other explanation.',
      },
      {
        setup:
          'A large observational study of 90,000 people links a supplement to fewer heart attacks. A randomised trial of 3,000 people finds no effect.',
        q: 'How should the disagreement be read?',
        correct: 'The trial answers the causal question; the study cannot',
        wrong: [
          ['The observational study wins, since it has thirty times the people', 'Size cannot repair confounding; it makes a biased estimate more precise.', 'concept'],
          ['Both are unreliable, so nothing can be concluded from either', 'The over-correction; the trial is exactly the design for this question.', 'inference'],
          ['The two must be measuring different heart conditions entirely', 'Invents a difference rather than reading the designs.', 'inference'],
        ] as [string, string, ErrorTag][],
        why: 'People who take supplements differ from people who do not in dozens of health-related ways, and 90,000 of them differ just as systematically as 3,000 would. Random assignment is what breaks that link, so on a causal question the smaller trial carries more weight.',
      },
      {
        setup:
          'A charity reports that 70% of the families it helped are better off a year later. A journalist writes that the programme "clearly works".',
        q: 'What information would most change your reading?',
        correct: 'How similar families who were not helped got on',
        wrong: [
          ['How the charity defines a family being "better off"', 'A real question, and it applies equally to any comparison group.', 'concept'],
          ['How many families the charity helped in that year', 'Numbers tell you precision, not whether 70% is good.', 'concept'],
          ['How the charity followed families up after a year', 'Follow-up method matters, but the missing piece is a baseline.', 'concept'],
        ] as [string, string, ErrorTag][],
        why: 'Seventy percent is a number without a scale until you know what happens anyway. If 68% of similar unhelped families also improve, the programme has shown almost nothing; if 20% do, it has shown a great deal.',
      },
      {
        setup:
          'A weather model predicted rain on 40 of the last 100 days and it rained on 38 of them. A critic says the model is useless because it rained on 12 days it did not predict.',
        q: 'What would settle whether the model is any good?',
        correct: 'How often it rains here regardless of the model',
        wrong: [
          ['How far ahead each of the predictions was made', 'Relevant to difficulty, not to whether these predictions beat guessing.', 'concept'],
          ['Whether the model uses satellite data as an input', 'How it works says nothing about how well it works.', 'concept'],
          ['How many days the model predicted no rain in total', 'Derivable from what is given; it adds no new information.', 'concept'],
        ] as [string, string, ErrorTag][],
        why: 'Any hit rate needs a base rate to be judged against. If it rains here 50 days in 100, predicting rain 40 times and being right 38 is impressive; if it rains 90 days in 100, a model that always said "rain" would do better.',
      },
    ] as const
    const c = cycle(seed, cases)
    const noted = mcqNoted(rng, c.correct, c.wrong.map((w) => [w[0], w[1], w[2]] as [string, string, ErrorTag]))
    return {
      title: 'The one fact that would settle it',
      prompt: `${c.setup}\n\n${c.q}`,
      answer: noted.answer,
      distractorNotes: noted.distractorNotes,
      distractorTags: noted.distractorTags,
      hints: [
        'Write out both explanations as full sentences. The useful fact is the one they disagree about.',
        'Ignore facts that would leave you believing exactly the same thing whichever way they turned out.',
        `Worked path: **${c.correct}**. ${c.why}`,
      ],
      explanation:
        `**${c.correct}.** ${c.why}\n\n` +
        'The test for whether a question is worth asking: imagine each possible answer, and check that they would leave you believing different things. A fact that cannot change your reading is not evidence, however interesting it is — and it is usually the easiest one to go and get.',
    }
  },
)

// =============================================================== s-hypo

const DEFINITE_QUESTIONS = [
  'How tall is the plant on the classroom windowsill this morning?',
  'What was the temperature at this station at noon today?',
  'How many students are sitting in this room right now?',
  'How long did my bus journey take this morning?',
  'What is the mass of this particular rock in grams?',
  'How much did this specific book cost at the shop?',
] as const

const STATISTICAL_QUESTIONS = [
  'Do plants given more light grow taller than plants given less?',
  'Is the noon temperature at this station higher in June than in September?',
  'Do students in this school sleep less on school nights than at weekends?',
  'Do journeys on this bus route take longer when it is raining?',
  'Do rocks from the upper layer weigh more than rocks from the lower layer?',
  'Do pupils who walk to school arrive more alert than pupils who are driven?',
] as const

const investigable = tpl(
  {
    id: 'dl-investigable',
    name: 'Is that a question data can investigate?',
    skillIds: ['s-hypo'],
    bucket: 'science',
    difficulty: 2,
    variants: 12,
    minutes: 2.5,
  },
  (rng, seed) => {
    const definite = pairFrom(DEFINITE_QUESTIONS, seed, 0)
    const statistical = pairFrom(STATISTICAL_QUESTIONS, seed, 3)
    const third = DEFINITE_QUESTIONS[(seed * 2 + 1) % DEFINITE_QUESTIONS.length]
    const fourth = STATISTICAL_QUESTIONS[(seed * 2 + 4) % STATISTICAL_QUESTIONS.length]
    const dSet = [...new Set([definite[0], definite[1], third])]
    const sSet = [...new Set([statistical[0], statistical[1], fourth])]
    return {
      title: 'One answer, or a pattern?',
      prompt:
        'Some questions have one definite answer you can go and read off. Others are about a GROUP, and their answers vary — so they need data collected on many cases before anything can be said.\n\nSort each question.',
      answer: classify(
        rng,
        ['Investigable with data', 'One definite answer'],
        [...sSet.map((text) => ({ text, category: 0 })), ...dSet.map((text) => ({ text, category: 1 }))],
      ),
      hints: [
        'Ask whether the answer would be the SAME for every case you looked at, or whether it would vary.',
        'If one measurement settles it, it is not a question for statistics. If you would need many, and expect them to disagree, it is.',
        'A question about "this one" usually has a definite answer; a question comparing groups usually does not.',
      ],
      explanation:
        'The dividing line is variability. "How tall is this plant?" has one answer, and taking a second measurement is a check on your ruler, not new information. "Do plants with more light grow taller?" is about a whole group whose members differ, so it needs many plants, and the answer arrives as a comparison of two spreads rather than one number.\n\n' +
        'This matters before any analysis, because the second kind of question is the only kind the rest of statistics applies to. Sorting it out first also protects you from the commonest wasted investigation: measuring one thing very carefully when the question was really about a pattern.',
    }
  },
)

const chanceAlone = tpl(
  {
    id: 'dl-chance-alone',
    name: 'Could the split alone have done this?',
    skillIds: ['s-hypo'],
    bucket: 'science',
    difficulty: 4,
    variants: 12,
    minutes: 4,
    kind: 'multi',
  },
  (rng, seed) => {
    const CONTEXTS = [
      { what: 'a new revision sheet', measure: 'test score', unit: 'points' },
      { what: 'a longer warm-up', measure: 'sprint time', unit: 'tenths of a second' },
      { what: 'a brighter grow lamp', measure: 'plant height', unit: 'millimetres' },
    ] as const
    const ctx = CONTEXTS[seed % CONTEXTS.length]
    const rare = seed % 2 === 0
    const SMALL = [7, 12, 23, 41]
    const BIG = [180, 240, 310, 420]
    const shuffles = 1000
    const extreme = rare ? SMALL[Math.floor(seed / 2) % 4] : BIG[Math.floor(seed / 2) % 4]
    const share = round((extreme / shuffles) * 100, 1)
    const gap = 4 + (seed % 5)
    const conclusion = rare
      ? 'A gap this big is uncommon when chance alone is at work'
      : 'A gap this big turns up often from chance alone'
    const parts: ItemPart[] = [
      {
        stage: 'Share',
        prompt: `What percent of the ${shuffles} shuffles produced a gap at least as large as the real one? (One decimal place.)`,
        answer: numeric(share, { tolerance: 0.05, unit: '%' }),
        explanation: `${extreme} ÷ ${shuffles} × 100 = **${share}%**.`,
        hints: [
          'It is a share of the shuffles: the count divided by how many shuffles were run.',
          `Worked path: ${extreme} ÷ ${shuffles} × 100 = ${share}.`,
        ],
      },
      {
        stage: 'Read it',
        prompt: 'What does that share tell you?',
        answer: mcq(rng, conclusion, [
          `There is a ${share}% chance that ${ctx.what} does nothing`,
          `${ctx.what.charAt(0).toUpperCase() + ctx.what.slice(1)} worked for ${share}% of the group`,
          `About ${share}% of the ${gap}-${ctx.unit} gap came from chance`,
        ]),
        explanation:
          `**${conclusion}.** The shuffle test asks one question: if the labels meant nothing, how often would a gap this size appear anyway? The answer is ${share}% of the time. It is not the chance that the treatment does nothing — that would be a probability about the world, and this simulation only ever shuffles labels. It is not a share of people helped, and it is not a portion of the gap.`,
        hints: [
          'Every shuffle destroys any real difference on purpose. So the share describes a world where the treatment does nothing.',
          'Check what each option is a percentage OF: shuffles, people, or the gap itself.',
        ],
      },
      {
        stage: 'Size',
        prompt: `What does this test say about HOW MUCH ${ctx.what} changed the ${ctx.measure}?`,
        answer: mcq(rng, 'Nothing — it only asks how often chance produces this', [
          `It says the real effect is about ${gap} ${ctx.unit} either way`,
          `It says the effect is ${rare ? 'large' : 'small'}, given that share`,
          `It says the effect size cannot be estimated from any data`,
        ]),
        explanation:
          `**Nothing.** A shuffle test answers "could chance alone do this?" and nothing else. The size of the effect is the observed gap of ${gap} ${ctx.unit}, and it should be reported with its own uncertainty. A rare result from a huge study can be a tiny effect, and a common one from a small study can be a large effect measured imprecisely — which is why "did it reach the threshold?" is the wrong first question and "how big, and how sure?" is the right one.`,
        hints: [
          'Separate two questions: how often chance does this, and how much the thing actually moved.',
          'Which of those two did the shuffling procedure measure?',
        ],
      },
    ]
    return {
      title: 'The shuffle test',
      prompt:
        `A group given ${ctx.what} ended up **${gap} ${ctx.unit}** ahead of the group that was not.\n\n` +
        `To ask whether the random split alone could produce a gap that size, the group labels were shuffled at random and the gap recomputed — **${shuffles}** times. In **${extreme}** of those shuffles the gap was at least as large as the one actually observed.`,
      parts,
      hints: [
        'Shuffling the labels deliberately breaks any real link, so it shows what pure chance can manage.',
        'Compare the real gap against that pile of chance-only gaps: is it ordinary among them, or unusual?',
        `Worked path: ${extreme} of ${shuffles} is ${share}%, so a gap this size is ${rare ? 'uncommon' : 'common'} under chance alone.`,
      ],
      explanation:
        `${extreme} of ${shuffles} shuffles reached the observed gap, which is ${share}%. ${conclusion}.\n\n` +
        'Two things this does NOT say, both of them common readings. It is not the probability that the treatment does nothing: every shuffle is run in a world where it does nothing, so the number describes that world rather than weighing it against others. And it says nothing about the size of the effect — a shuffle test tells you whether to take a difference seriously, never how much it is worth.',
    }
  },
)

const hypothesisForm = tpl(
  {
    id: 'dl-hypothesis-form',
    name: 'State it so it could come out wrong',
    skillIds: ['s-hypo'],
    bucket: 'science',
    difficulty: 3,
    variants: 8,
    minutes: 5,
    kind: 'multi',
  },
  (rng, seed) => {
    const cases = [
      {
        plan: 'You have two identical trays of cress seedlings, a lamp you can set to 6, 10 or 14 hours a day, and a ruler. Everything else is kept the same.',
        iv: 'The number of hours of lamp light per day',
        ivWrong: ['The height of the seedlings after two weeks', 'The type of soil used in both of the trays', 'The room temperature during the two weeks'],
        good: 'Seedlings given more hours of light per day will grow taller over two weeks',
        bad: [
          'Light has an important effect on how seedlings grow in trays',
          'Seedlings grow better and healthier when conditions are good',
          'The seedlings under the lamp will do what seedlings normally do',
        ],
        model:
          'If I increase the hours of lamp light per day, then the average height of the seedlings after two weeks will increase. I change the light hours; I measure height in millimetres; I expect more light to give more height.',
      },
      {
        plan: 'You can add 0, 2 or 4 grams of salt to a litre of water and time how long it takes to freeze in the same freezer, in identical containers.',
        iv: 'The grams of salt added to the litre of water',
        ivWrong: ['The time the water takes to freeze solid', 'The size and shape of the containers used', 'The setting the freezer is left on'],
        good: 'Water with more salt added will take longer to freeze',
        bad: [
          'Salt changes the way that water behaves when it is cooled',
          'Adding salt to water will produce an interesting difference',
          'The salty water and the plain water will freeze differently',
        ],
        model:
          'If I increase the salt added per litre, then the time to freeze will increase. I change the grams of salt; I measure freezing time in minutes; I expect more salt to mean a longer time.',
      },
      {
        plan: 'You have a ramp whose angle you can set to 10, 20 or 30 degrees, the same toy car each time, and a stopwatch.',
        iv: 'The angle the ramp is set to',
        ivWrong: ['The time the car takes to reach the bottom', 'The mass of the toy car being released', 'The length of the ramp being used'],
        good: 'The car will reach the bottom faster from a steeper ramp',
        bad: [
          'Ramp angle is an important factor in how the car rolls',
          'A steeper ramp will make quite a difference to the car',
          'The car will roll down the ramp at various different speeds',
        ],
        model:
          'If I increase the ramp angle, then the time to reach the bottom will decrease. I change the angle; I measure time in seconds; I expect a steeper ramp to give a shorter time.',
      },
      {
        plan: 'You can revise for 10, 20 or 30 minutes before each of a series of equivalent practice quizzes, and record the score each time.',
        iv: 'The number of minutes spent revising beforehand',
        ivWrong: ['The score achieved on each practice quiz', 'The difficulty of the quizzes being used', 'The time of day the quizzes are taken'],
        good: 'Longer revision before a quiz will give a higher score',
        bad: [
          'Revision is one of the main things that affects quiz scores',
          'More revision will probably be better than less revision',
          'Quiz scores will vary depending on several different things',
        ],
        model:
          'If I increase revision time before a quiz, then my score will increase. I change the minutes of revision; I measure the quiz score out of twenty; I expect more revision to give a higher score.',
      },
      {
        plan: 'You can water identical potted plants with 50, 100 or 200 millilitres per day and measure leaf count after three weeks.',
        iv: 'The millilitres of water given per day',
        ivWrong: ['The number of leaves counted at the end', 'The kind of pot each plant is grown in', 'The amount of light the shelf receives'],
        good: 'Plants given more water per day will grow more leaves',
        bad: [
          'Watering is important to how many leaves a plant grows',
          'Different amounts of water will give different leaf counts',
          'The plants will respond to water in some measurable way',
        ],
        model:
          'If I increase the daily water, then the leaf count after three weeks will increase. I change millilitres per day; I measure leaves counted; I expect more water to give more leaves.',
      },
      {
        plan: 'You can inflate the same football to 8, 10 or 12 units of pressure and measure how far it travels from an identical kick machine.',
        iv: 'The pressure the football is inflated to',
        ivWrong: ['The distance the football finally travels', 'The make and model of the football used', 'The force the kick machine delivers'],
        good: 'A ball inflated to a higher pressure will travel further',
        bad: [
          'Pressure is an important factor in how a football travels',
          'Changing the pressure will change how far the ball goes',
          'The football will travel a range of different distances',
        ],
        model:
          'If I increase the inflation pressure, then the distance travelled will increase. I change the pressure units; I measure distance in metres; I expect higher pressure to give more distance.',
      },
      {
        plan: 'You can set a phone screen to 20%, 50% or 80% brightness and record how many hours the battery lasts from full under identical use.',
        iv: 'The screen brightness setting chosen',
        ivWrong: ['The hours the battery lasts from full', 'The age of the phone being tested', 'The apps that are running in the background'],
        good: 'A brighter screen setting will give fewer hours of battery',
        bad: [
          'Screen brightness is a major factor in battery life',
          'Battery life will change when the brightness is changed',
          'The phone will last different amounts of time each day',
        ],
        model:
          'If I increase screen brightness, then battery hours from full will decrease. I change the brightness setting; I measure hours until the battery empties; I expect brighter to mean fewer hours.',
      },
      {
        plan: 'You can bake identical dough discs for 8, 11 or 14 minutes at one fixed temperature and rate crispness on a fixed scale.',
        iv: 'The number of minutes each disc is baked',
        ivWrong: ['The crispness rating each disc receives', 'The oven temperature used throughout', 'The thickness of the dough discs'],
        good: 'Discs baked for longer will score higher for crispness',
        bad: [
          'Baking time is important to how the dough turns out',
          'Longer baking will lead to a noticeably different result',
          'The discs will come out crisp to varying degrees',
        ],
        model:
          'If I increase baking time, then the crispness rating will increase. I change minutes in the oven; I measure crispness on the fixed scale; I expect longer baking to score higher.',
      },
    ] as const
    const c = cycle(seed, cases)
    const parts: ItemPart[] = [
      {
        stage: 'Draft',
        prompt:
          'Write ONE sentence stating what you will change, what you will measure, and which way you expect the measurement to move.',
        answer: draft({
          criteria: [
            'Names the thing you will change, in units you could actually set.',
            'Names the thing you will measure, in units you could actually record.',
            'Says which DIRECTION you expect: more of this goes with more, or less, of that.',
            'Could turn out to be wrong — a result exists that would contradict it.',
          ],
          model: c.model,
          minWords: 12,
          placeholder: 'If I increase … then … will …',
        }),
        explanation:
          'A usable hypothesis names both variables and commits to a direction. Compare yours with the model: it should be possible to point at a result and say "that would have proved me wrong".',
      },
      {
        stage: 'Form',
        prompt: 'Which of these is stated in a form that a result could actually contradict?',
        answer: mcq(rng, c.good, [...c.bad]),
        explanation: `**${c.good}.** It names both variables and commits to a direction, so a result in the other direction refutes it. The others sound scientific and cannot lose: "has an effect", "will be different", "will vary" are all satisfied by any outcome whatsoever, including no effect at all.`,
        hints: [
          'For each option, try to describe a result that would prove it WRONG. If you cannot, it is not a hypothesis.',
          'Look for a direction word — more, longer, faster, higher. Vague strength words like "important" do not commit to anything.',
        ],
      },
      {
        stage: 'Variables',
        prompt: 'In this plan, which is the variable you deliberately change?',
        answer: mcq(rng, c.iv, [...c.ivWrong]),
        explanation: `**${c.iv}.** That is the one the plan lets you SET at chosen levels. What you record at the end is the measured variable, and the things held the same for every run are controls — naming them separately is what keeps a test fair.`,
        hints: [
          'Look at the plan and ask which quantity you are given the power to set to specific values.',
          'The thing you record at the end is the response, not the thing you changed.',
        ],
      },
    ]
    return {
      title: 'From a plan to a testable claim',
      prompt: `**The setup.** ${c.plan}`,
      parts,
      hints: [
        'Three things make a claim testable: what you change, what you measure, and which way you expect it to go.',
        'A claim that no possible result could contradict is not a prediction, however scientific it sounds.',
        `Worked path: change ${c.iv.toLowerCase()}, measure the outcome, and state a direction — for example, "${c.good.toLowerCase()}".`,
      ],
      explanation:
        `A workable statement here: "${c.good}." It names what changes (${c.iv.toLowerCase()}), what gets measured, and which way it should move.\n\n` +
        'The direction is what makes it worth testing. "Light affects growth" cannot lose — dimmer plants growing taller would confirm it just as happily as the reverse — and a claim that cannot lose cannot teach you anything when the data comes back.',
    }
  },
)

const newEvidence = tpl(
  {
    id: 'dl-new-evidence',
    name: 'What the new data does to the explanation',
    skillIds: ['s-hypo'],
    bucket: 'science',
    difficulty: 4,
    variants: 6,
    minutes: 3,
  },
  (rng, seed) => {
    const cases = [
      {
        setup:
          'Working explanation: the classroom is cold in the mornings because the heating comes on too late.\n\nNew data: on three mornings the heating was switched on two hours earlier, and the room was still cold at 9am.',
        q: 'What should happen to the explanation?',
        correct: 'It survives only if something else is also losing the heat',
        wrong: [
          ['It is refuted, so the heating timer plays no part at all', 'Over-corrects: the test rules out timing as the WHOLE story, not as a part of it.', 'inference'],
          ['It is unaffected, since three mornings is far too few', 'Dismisses a test whose result was clear and repeated.', 'inference'],
          ['It is confirmed, because the room warmed up eventually', 'Reads the outcome as support for the claim it contradicts.', 'misread'],
        ] as [string, string, ErrorTag][],
        why: 'The prediction failed: earlier heating should have meant a warm room. That kills the explanation as a complete account and leaves a narrower version alive — timing plus a draught, say. Refuting a claim as stated is not the same as showing the factor is irrelevant.',
      },
      {
        setup:
          'Working explanation: the shop is busiest on Saturdays because that is when families shop together.\n\nNew data: a full month of till records shows Thursday evenings are just as busy, and the Thursday baskets are single-person sized.',
        q: 'What is the right update?',
        correct: 'Keep it for Saturday and look for a second pattern',
        wrong: [
          ['Abandon the family explanation, since Thursdays disprove it', 'Treats a second busy period as refuting the account of the first.', 'inference'],
          ['Ignore Thursdays, because the explanation was about Saturdays', 'Protects the claim by shrinking its scope after seeing the data.', 'inference'],
          ['Conclude that basket size cannot tell you who is shopping', 'Discards the most informative part of the new data.', 'concept'],
        ] as [string, string, ErrorTag][],
        why: 'The new data does not contradict the Saturday account; it shows the explanation was incomplete as a theory of when the shop is busy. Two peaks with different basket profiles is evidence of two mechanisms, and the honest move is to add one rather than to defend or abandon the first.',
      },
      {
        setup:
          'Working explanation: the fish in the upper pond are smaller because there is less food there.\n\nNew data: food added to the upper pond for six weeks produced no change in size, and water tests show it is 4 degrees colder than the lower pond.',
        q: 'How should the explanation change?',
        correct: 'Replace food with temperature as the leading candidate',
        wrong: [
          ['Keep food as the cause, since six weeks is a short trial', 'Rescues the claim with a reason invented after the result.', 'inference'],
          ['Conclude that fish size is not explainable from pond data', 'Gives up exactly when the data got informative.', 'inference'],
          ['Add temperature and food together as a combined cause', 'Keeps a factor the direct test just failed to support.', 'inference'],
        ] as [string, string, ErrorTag][],
        why: 'A direct intervention on food produced nothing, and a plausible rival turned up in the same measurements. That is the strongest kind of update available outside a controlled trial: one candidate tested and failed, another supported by a measured difference.',
      },
      {
        setup:
          'Working explanation: the app crashes because of the update released last month.\n\nNew data: the crash logs show the same crash occurring for two months before that update was released.',
        q: 'What follows?',
        correct: 'The update cannot be the original cause of the crash',
        wrong: [
          ['The logs must be recording the wrong dates for the crashes', 'Rejects the data because it is inconvenient for the explanation.', 'inference'],
          ['The update made an existing crash happen more often', 'Possible, but nothing in the new data says the rate changed.', 'inference'],
          ['The crash has two separate causes that both need fixing', 'Invents a second cause the evidence has not indicated.', 'inference'],
        ] as [string, string, ErrorTag][],
        why: 'A cause cannot precede its effect backwards: crashes before the update rule the update out as the origin. It might still have made things worse, but the new data says nothing about frequency, so claiming that is adding a story the evidence does not carry.',
      },
      {
        setup:
          'Working explanation: the new bus lane cut journey times on that road.\n\nNew data: journey times on three nearby roads with no bus lane fell by a similar amount over the same period.',
        q: 'What is the update?',
        correct: 'Something affecting all four roads is the better bet',
        wrong: [
          ['The bus lane still worked, since times on that road fell', 'The comparison roads are exactly what removes that reading.', 'inference'],
          ['The bus lane made the nearby roads faster as well', 'Possible in principle, and a much bigger claim than the data supports.', 'inference'],
          ['Nothing changed anywhere; the fall must be a measurement error', 'Rejects a consistent fall on four roads without any reason to.', 'inference'],
        ] as [string, string, ErrorTag][],
        why: 'This is what a comparison group is for. A fall on the treated road alone would support the bus lane; the same fall everywhere points at a shared cause — a fuel price change, roadworks ending, a school holiday. The bus lane is not refuted, but it has lost the evidence it had.',
      },
      {
        setup:
          'Working explanation: the bread rises poorly because the yeast is old.\n\nNew data: a fresh packet of yeast gives the same poor rise, and the kitchen thermometer reads 14 degrees.',
        q: 'What should you conclude?',
        correct: 'Old yeast is ruled out, and the cold is worth testing',
        wrong: [
          ['Yeast is still likely, since the new packet may also be stale', 'Saves the explanation by assuming the test itself failed.', 'inference'],
          ['Bread rising is too variable for any explanation to hold', 'Abandons an investigation that just produced a clean result.', 'inference'],
          ['The thermometer is faulty, since kitchens are warmer than that', 'Rejects the measurement in favour of an expectation.', 'inference'],
        ] as [string, string, ErrorTag][],
        why: 'Swapping in fresh yeast is a direct test, and it failed to change the outcome. Meanwhile a measured 14 degrees is a real candidate, since yeast activity drops sharply in the cold. Rule out what the test ruled out, and follow what the measurement points at.',
      },
    ] as const
    const c = cycle(seed, cases)
    const noted = mcqNoted(rng, c.correct, c.wrong.map((w) => [w[0], w[1], w[2]] as [string, string, ErrorTag]))
    return {
      title: 'Updating on new evidence',
      prompt: `${c.setup}\n\n${c.q}`,
      answer: noted.answer,
      distractorNotes: noted.distractorNotes,
      distractorTags: noted.distractorTags,
      hints: [
        'Write down what the explanation PREDICTED for this new data before you decide what the result did to it.',
        'There are more than two options: an explanation can be narrowed, extended, or demoted, not only kept or scrapped.',
        `Worked path: **${c.correct}**. ${c.why}`,
      ],
      explanation:
        `**${c.correct}.** ${c.why}\n\n` +
        'Two failure modes sit either side of the right answer. One rescues the explanation with a reason invented after the result — "the trial was too short", "the packet was stale too" — which can be repeated forever and makes the claim untestable. The other throws everything out at the first contradiction. The useful move is usually in between: say exactly which part of the explanation the new data killed, and what is left standing.',
    }
  },
)

// =============================================================== s-fermi

const limitCase = tpl(
  {
    id: 'dl-limit-case',
    name: 'Test the formula at an extreme',
    skillIds: ['s-fermi'],
    bucket: 'science',
    difficulty: 4,
    variants: 8,
    minutes: 3,
    transfer: true,
  },
  (rng, seed) => {
    const cases = [
      {
        setup:
          'A classmate says: for a there-and-back trip of distance d each way, at speed v out and speed w back, the total time is d ÷ (v + w).',
        correct: 'Set w to zero: the trip never ends, but this gives a finite time',
        wrong: [
          ['Set d to zero: the time comes out as zero, which is right', 'A limit the formula PASSES, so it discriminates nothing.', 'strategy'],
          ['Set v equal to w: the formula gives d ÷ 2v, which looks fine', 'Also passes, and it is the case people check first.', 'strategy'],
          ['Try d = 100, v = 50, w = 50 and see whether it looks sensible', 'A specific number without a reason to expect a particular answer.', 'strategy'],
        ] as [string, string, ErrorTag][],
        why: 'The right total is d/v + d/w. Setting w to zero makes the true time infinite while the proposed formula returns d/v, which is finite and small. A limit test only earns its keep when the correct answer at that limit is obvious and extreme.',
      },
      {
        setup:
          'Someone claims that if you drive out at speed v and back at speed w, your average speed for the whole trip is (v + w) ÷ 2.',
        correct: 'Let w approach zero: the real average must too, and this does not',
        wrong: [
          ['Let v equal w: the formula returns v, which is correct', 'True and useless — the formula is right in the symmetric case.', 'strategy'],
          ['Let both speeds double: the average doubles, as it should', 'Scaling is preserved by the wrong formula as well.', 'strategy'],
          ['Take v = 60 and w = 40 and check the arithmetic carefully', 'Checks the sum, not whether the sum is the right thing.', 'strategy'],
        ] as [string, string, ErrorTag][],
        why: 'Crawling home at almost zero speed means almost all the time is spent on the return leg, so the average over the whole trip goes to zero. The formula gives v/2, which is nowhere near. Equal distances need a harmonic mean, and this is exactly the limit that exposes it.',
      },
      {
        setup:
          'A student writes: if worker A alone takes a hours and worker B alone takes b hours, together they take a + b hours.',
        correct: 'Compare against A working alone: help cannot make it slower',
        wrong: [
          ['Set b equal to a and check the formula returns a', 'It returns 2a, but the objection is easier to see the other way.', 'strategy'],
          ['Set both a and b to one hour and check the answer', 'Gives two hours; the fault is clearer as a general argument.', 'strategy'],
          ['Try a = 4 and b = 6 and see whether ten hours feels right', 'A single case with no principle to test it against.', 'strategy'],
        ] as [string, string, ErrorTag][],
        why: 'Monotonicity is the fastest check here: adding a helper can never take longer than working alone, yet the formula always exceeds both a and b. The correct combination is 1/(1/a + 1/b), which is smaller than either.',
      },
      {
        setup:
          'A proposal: mixing equal volumes of two solutions, one at c1 grams per litre and one at c2, gives a mixture at c1 + c2 grams per litre.',
        correct: 'Mix a solution with itself: the strength must not double',
        wrong: [
          ['Set c2 to zero: the answer is c1, which seems right', 'A limit the formula passes, so it proves nothing about it.', 'strategy'],
          ['Set both to zero: the answer is zero, which is correct', 'Passes as well; zero cases rarely discriminate.', 'strategy'],
          ['Use c1 = 10 and c2 = 30 and check whether 40 is plausible', 'Plausibility of one number, with nothing to compare it against.', 'strategy'],
        ] as [string, string, ErrorTag][],
        why: 'Set c2 = c1. Mixing a solution with more of itself cannot change its strength, so the answer must be c1, and the formula returns 2c1. The identical-inputs test is one of the most productive limits available, and it costs nothing to run.',
      },
      {
        setup:
          'A claim: if the chance of success on one attempt is p, then the chance of at least one success in n attempts is p × n.',
        correct: 'Take n large: the formula passes 1, which no chance can',
        wrong: [
          ['Take n = 1: the formula gives p, which is exactly right', 'It is right there; that is why the fault needs a bigger n.', 'strategy'],
          ['Take p = 0: the formula gives zero for every n', 'Correct behaviour, so it discriminates nothing.', 'strategy'],
          ['Take p = 0.1 and n = 3 and check 0.3 against intuition', 'Close enough to be plausible, so intuition cannot rule.', 'strategy'],
        ] as [string, string, ErrorTag][],
        why: 'With p = 0.2 and n = 10 the formula gives 2. A probability cannot exceed 1, so the expression is wrong before any careful derivation. The true value is 1 − (1 − p)^n, which approaches 1 without ever passing it.',
      },
      {
        setup:
          'Someone proposes: doubling every side length of a solid block doubles the amount of material it contains.',
        correct: 'Take a unit cube: doubling the sides gives eight of them',
        wrong: [
          ['Take a cube of side zero: doubling still gives zero material', 'True and uninformative — zero is preserved by any scaling rule.', 'strategy'],
          ['Take a very long thin rod and double only its length', 'Changes one dimension, which is not the claim being tested.', 'misread'],
          ['Take a cube of side 10 and check whether 2,000 is sensible', 'The wrong answer looks perfectly sensible on its own.', 'strategy'],
        ] as [string, string, ErrorTag][],
        why: 'A 1 × 1 × 1 cube holds one unit; a 2 × 2 × 2 cube holds eight. Volume scales with the cube of the length, so doubling multiplies it by 8, not 2. The unit cube is the cheapest limit case in geometry because the arithmetic is done before you start.',
      },
      {
        setup:
          'A shop says: growing 5% a year for 10 years means growing 50% in total.',
        correct: 'Try 100% a year for 10 years: it is not 1,000% growth',
        wrong: [
          ['Try 0% a year: the formula gives 0% total, which is right', 'A limit the rule survives, so it settles nothing.', 'strategy'],
          ['Try 5% for one year: the formula gives 5%, as it should', 'Correct at n = 1, which is where the two rules agree.', 'strategy'],
          ['Try 5% for 10 years and compare it against 50% exactly', 'Restates the claim rather than testing it.', 'misread'],
        ] as [string, string, ErrorTag][],
        why: 'Doubling every year for ten years multiplies by 1,024 — a growth of 102,300%, not 1,000%. Pushing a rate to an extreme makes the gap between adding and compounding impossible to miss, and the same gap is quietly there at 5%.',
      },
      {
        setup:
          'A student combines two classes: one of 10 students averaging 60, one of 30 averaging 80, and reports the combined average as 70.',
        correct: 'Shrink one class to a single student: the answer must barely move',
        wrong: [
          ['Make both classes exactly the same size and check it gives 70', 'That is the one case where the simple average is right.', 'strategy'],
          ['Set both class averages to 60 and check the answer is 60', 'Passes, since equal averages make the weights irrelevant.', 'strategy'],
          ['Add ten more students to the larger class and recompute', 'Changes the numbers without pointing at the principle.', 'strategy'],
        ] as [string, string, ErrorTag][],
        why: 'With one student at 60 and thirty at 80, the combined average must sit very close to 80. The plain average still says 70, which shows it is ignoring how many people are behind each number. The correct value here is (10 × 60 + 30 × 80) ÷ 40 = 75.',
      },
    ] as const
    const c = cycle(seed, cases)
    const noted = mcqNoted(rng, c.correct, c.wrong.map((w) => [w[0], w[1], w[2]] as [string, string, ErrorTag]))
    return {
      title: 'Push it to an extreme',
      prompt: `${c.setup}\n\nWhich single test exposes the mistake fastest?`,
      answer: noted.answer,
      distractorNotes: noted.distractorNotes,
      distractorTags: noted.distractorTags,
      hints: [
        'Look for a value where you already know what the answer HAS to be, without doing any algebra.',
        'A test the expression passes tells you nothing. You want one where the right answer is extreme and the formula clearly misses it.',
        `Worked path: **${c.correct}**. ${c.why}`,
      ],
      explanation:
        `**${c.correct}.** ${c.why}\n\n` +
        'The move generalises. Before trusting an expression, substitute values whose answers you already know: zero, one, both inputs equal, one input enormous. If the formula disagrees with something you are certain of, it is wrong, and you have found it in seconds instead of after a page of algebra.\n\n' +
        'Worth being straight about the limits of the claim: this is standard practice among people who work with formulas, and no study shows that practising it makes anyone a better reasoner in general. It is a specific, cheap check for a specific kind of mistake, and that is the whole of what it is being offered as.',
    }
  },
)

const compoundRate = tpl(
  {
    id: 'dl-compound-rate',
    name: 'Carry the units through',
    skillIds: ['s-fermi'],
    bucket: 'science',
    difficulty: 3,
    variants: 20,
    minutes: 3,
  },
  (_rng, seed) => {
    const form = seed % 4
    const idx = Math.floor(seed / 4) % 5
    if (form === 0) {
      const conc = [2, 4, 5, 8, 10][idx]
      const dose = conc * [3, 6, 7, 9, 12][idx]
      return {
        title: 'Milligrams to millilitres',
        prompt:
          `A liquid is labelled **${conc} mg per mL**.\n\nA measurement calls for **${dose} mg**. How many millilitres is that?`,
        answer: numeric(dose / conc, { unit: 'mL' }),
        hints: [
          'Write the units as a fraction and see which way they cancel: mg ÷ (mg/mL) leaves mL.',
          `The label says every millilitre carries ${conc} mg, so ask how many lots of ${conc} fit into ${dose}.`,
          `Worked path: ${dose} mg ÷ ${conc} mg/mL = **${dose / conc} mL**.`,
        ],
        explanation:
          `${dose} ÷ ${conc} = **${dose / conc} mL**.\n\n` +
          'The units decide the operation. Dividing mg by mg/mL cancels the milligrams and leaves millilitres, which is the quantity asked for; multiplying instead would have left mg² per mL, which is not a thing. Writing the units beside every number is the cheapest error check available in any calculation with a compound unit.',
      }
    }
    if (form === 1) {
      const people = [3, 4, 5, 6, 8][idx]
      const hours = [6, 9, 12, 15, 20][idx]
      const personHours = people * hours
      const newPeople = [2, 3, 4, 5, 8][(idx + 2) % 5]
      return {
        title: 'Person-hours',
        prompt:
          `A job took **${people} people ${hours} hours** to finish.\n\nAssume the work splits evenly and the total effort is fixed. How many hours would **${newPeople} people** take?`,
        answer: numeric(round(personHours / newPeople, 2), { tolerance: 0.01, unit: 'hours' }),
        hints: [
          'First find the total effort in person-hours: people multiplied by hours.',
          `Then share that effort out: person-hours ÷ people leaves hours.`,
          `Worked path: ${people} × ${hours} = ${personHours} person-hours; ${personHours} ÷ ${newPeople} = **${round(personHours / newPeople, 2)} hours**.`,
        ],
        explanation:
          `${people} × ${hours} = ${personHours} person-hours, and ${personHours} ÷ ${newPeople} = **${round(personHours / newPeople, 2)} hours**.\n\n` +
          'A person-hour is one unit of effort, and treating it as a currency makes the two steps obvious: buy the total, then divide it among the workers. The assumption is doing real work, though — jobs that cannot be split, or that need people to coordinate, break this arithmetic badly, and "nine women can produce a baby in one month" is the standard reminder that the model has limits.',
      }
    }
    if (form === 2) {
      const l = [4, 5, 6, 8, 10][idx]
      const w = [2, 4, 5, 5, 4][idx]
      const h = [5, 5, 4, 5, 5][idx]
      const density = [2, 3, 4, 5, 6][(idx + 1) % 5]
      const volume = l * w * h
      const mass = volume * density
      return {
        title: 'Density from mass and volume',
        prompt:
          `A solid block measures **${l} cm by ${w} cm by ${h} cm** and has a mass of **${mass} g**.\n\nWhat is its density in grams per cubic centimetre?`,
        answer: numeric(density, { unit: 'g/cm³' }),
        hints: [
          'Density is mass per unit of volume, so find the volume first.',
          `Volume of a box = length × width × height = ${l} × ${w} × ${h}.`,
          `Worked path: volume ${volume} cm³; ${mass} g ÷ ${volume} cm³ = **${density} g/cm³**.`,
        ],
        explanation:
          `Volume = ${l} × ${w} × ${h} = ${volume} cm³, so density = ${mass} ÷ ${volume} = **${density} g/cm³**.\n\n` +
          'The compound unit tells you the recipe: "grams per cubic centimetre" literally means grams divided by cubic centimetres. Any time a unit contains the word "per", the arithmetic is already written down for you — which also means an answer whose units do not match the question is wrong before you check the number.',
      }
    }
    const litresPerMin = [12, 15, 20, 25, 40][idx]
    const perHour = litresPerMin * 60
    const cubic = round(perHour / 1000, 2)
    return {
      title: 'Litres per minute to cubic metres per hour',
      prompt:
        `A pump moves **${litresPerMin} litres per minute**.\n\nOne cubic metre is 1,000 litres. How many cubic metres per hour is that?`,
      answer: numeric(cubic, { tolerance: 0.005, unit: 'm³/h' }),
      hints: [
        'Do it in two steps: litres per minute to litres per hour, then litres to cubic metres.',
        `${litresPerMin} × 60 gives litres per hour; dividing by 1,000 converts to cubic metres.`,
        `Worked path: ${litresPerMin} × 60 = ${perHour} L/h; ${perHour} ÷ 1000 = **${cubic} m³/h**.`,
      ],
      explanation:
        `${litresPerMin} × 60 = ${perHour} litres per hour, and ${perHour} ÷ 1,000 = **${cubic} m³/h**.\n\n` +
        'Two conversions, each one a multiplication by a fraction equal to 1: 60 min/h and 1 m³/1000 L. Setting them out that way makes the direction unmistakable — if the unit you wanted to remove does not cancel, the fraction is upside down, and the answer will be out by a factor of 3,600 rather than slightly off.',
    }
  },
)

export const DATA_LITERACY_TEMPLATES: ItemTemplate[] = [
  // s-design
  studyType,
  randomLicence,
  confounder,
  designFix,
  // s-measure
  sampleTarget,
  moeReading,
  errorSource,
  // s-corr
  twoByTwo,
  simpson,
  adjustDirection,
  // s-graphs
  linePredict,
  residual,
  rMeaning,
  outlierLeverage,
  axisFactor,
  // s-sources
  missingDirection,
  missingBounds,
  whatSettles,
  // s-hypo
  investigable,
  chanceAlone,
  hypothesisForm,
  newEvidence,
  // s-fermi
  limitCase,
  compoundRate,
]
