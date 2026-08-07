/**
 * Scientific & quantitative reasoning items. Scenarios are fictional;
 * interpretive items use MCQ with one defensibly-best answer and an
 * explanation that names why the others fall short.
 */
import type { ItemTemplate } from '../../domain/types'
import { rint } from '../../engine/rng'
import { cycle, fixed, mcq, numeric, round, tpl } from '../lib'

const hypoControl = tpl(
  { id: 's-control-var', name: 'Control the variable', skillIds: ['s-hypo'], bucket: 'science', difficulty: 2, variants: 3, minutes: 2.5 },
  (rng, seed) => {
    const cases = [
      {
        setup: 'Mia thinks plants grow taller with classical music. She puts one plant by a sunny window with music and one in a dark closet without music.',
        q: 'Why can\'t this experiment answer her question?',
        correct: 'Light differs along with music, so either could explain any difference',
        wrong: [
          'One plant is not enough to grow at all',
          'Music must be played for at least a month',
          'Plants cannot hear, so the experiment is pointless',
        ],
        why: 'Change ONE variable at a time: both plants need identical light, water, and soil — differing only in music.',
      },
      {
        setup: 'Leo tests whether a new backpack strap reduces shoulder soreness. He uses the new strap during the week he also stops carrying his laptop.',
        q: 'What is the design flaw?',
        correct: 'Two things changed at once — the strap and the load',
        wrong: [
          'One week is exactly the right length for a study',
          'Soreness cannot be measured',
          'He should have used the new strap only on weekends',
        ],
        why: 'The lighter load is a confound. Keep the load constant and vary only the strap.',
      },
      {
        setup: 'A cereal ad says "kids who eat SparkOs get better grades." SparkOs cost more than other cereals.',
        q: 'Which variable most obviously tags along with eating SparkOs?',
        correct: 'Family income, which relates to many school advantages',
        wrong: [
          'The color of the cereal box',
          'The day of the week the cereal is eaten',
          'The font used in the ad',
        ],
        why: 'Expensive products select for wealthier families — a classic lurking variable behind food-and-grades claims.',
      },
    ]
    const c = cycle(seed, cases)
    return {
      title: 'One variable at a time',
      prompt: `${c.setup}\n\n${c.q}`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'List everything that differs between the groups being compared.',
        'A fair test isolates the one factor in question; everything else stays matched.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. ${c.why}`,
    }
  },
)

const measureReliability = tpl(
  { id: 's-reliability', name: 'Repeat the measurement', skillIds: ['s-measure'], bucket: 'science', difficulty: 2, variants: 8, minutes: 2.5 },
  (rng) => {
    const base = rint(rng, 20, 40)
    const readings = [base, base + 1, base - 1, base, base + 12]
    const clean = readings.slice(0, 4)
    const mean = round(clean.reduce((a, b) => a + b, 0) / clean.length, 2)
    return {
      title: 'The odd reading',
      prompt: `Five timings of the same pendulum swing (seconds ÷ 10): **${readings.join(', ')}**. The last one was taken while the timer's phone buzzed. What is the best estimate of the true value?`,
      answer: mcq(rng, `About ${mean} — average the four consistent readings and investigate the outlier`, [
        `${round(readings.reduce((a, b) => a + b, 0) / 5, 2)} — always average everything, no exceptions`,
        `${base + 12} — the largest value is the most complete swing`,
        'Impossible to estimate without 100 more readings',
      ]),
      hints: [
        'Why repeat measurements at all? What does the spread tell you?',
        'Four readings cluster tightly; one sits far out WITH a known disturbance.',
        `Worked path: average the consistent four → **≈ ${mean}**, and note the exclusion openly.`,
      ],
      explanation: `The tight cluster (${clean.join(', ')}) shows the measurement repeats well; the outlier has a documented cause (the distraction). Excluding it — and SAYING so — beats both blind averaging and cherry-picking. Repetition exists to reveal exactly this.`,
    }
  },
)

const corrCause = tpl(
  { id: 's-corr-cause', name: 'Correlation ≠ causation', skillIds: ['s-corr'], bucket: 'science', difficulty: 3, variants: 4, minutes: 3, calibration: true },
  (rng, seed) => {
    const cases = [
      {
        obs: 'Cities with more ice-cream sales have more swimming-pool accidents.',
        correct: 'Hot weather increases both — a common cause',
        wrong: ['Ice cream impairs swimming', 'Pool accidents cause ice-cream cravings', 'The correlation must be a coincidence'],
        test: 'Compare months with equal temperatures: the link should vanish.',
      },
      {
        obs: 'Students who bring calculators to the exam score higher.',
        correct: 'Being prepared drives both calculator-bringing and scores',
        wrong: ['Calculators directly cause high scores on all questions', 'High scores cause calculator ownership', 'Someone miscounted the calculators'],
        test: 'Randomly hand calculators to half of all students: if preparation is the driver, the gap should mostly remain.',
      },
      {
        obs: 'Kids with bigger shoe sizes read better.',
        correct: 'Age drives both foot size and reading skill',
        wrong: ['Foot growth stimulates the reading brain', 'Reading practice enlarges feet', 'Shoe companies fund the studies'],
        test: 'Compare kids of the SAME age: the correlation should disappear.',
      },
      {
        obs: 'People who sleep with their shoes on wake up with more headaches.',
        correct: 'A third factor (like going to bed after drinking) plausibly causes both',
        wrong: ['Shoes squeeze blood toward the head overnight', 'Headaches make people forget to remove shoes before sleep — the only possibility', 'The finding proves nothing can cause headaches'],
        test: 'Account for the bedtime condition of each sleeper; the shoe-headache link should fade.',
      },
    ]
    const c = cycle(seed, cases)
    return {
      title: 'What explains the link?',
      prompt: `Observed: **${c.obs}**\n\nWhat is the most plausible explanation?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Three suspects behind every correlation: A→B, B→A, or hidden C→both.',
        'Ask: what kind of person/place/time produces BOTH things at once?',
        `Worked path: **${c.correct}**. Test to check it: ${c.test}`,
      ],
      explanation: `**${c.correct}**. The give-away is a plausible common cause. And note the test that would settle it: ${c.test}`,
    }
  },
)

const graphClaim = tpl(
  { id: 's-graph-claim', name: 'Does the chart back the claim?', skillIds: ['s-graphs'], bucket: 'science', difficulty: 3, variants: 2, minutes: 3 },
  (rng, seed) => {
    const cases = [
      {
        data: 'A bar chart of "app downloads" has its vertical axis running from **90,000 to 100,000**. Bar A (Month 1) = 91,000; Bar B (Month 2) = 99,000.',
        claim: 'Claim: "Downloads exploded — Month 2 towers 9× higher!"',
        correct: 'The truncated axis exaggerates a ~9% increase into a 9× visual',
        wrong: [
          'The claim is right: the bar is visibly 9 times taller',
          'The claim is wrong because downloads actually fell',
          'Bar charts can never show growth',
        ],
        why: 'Starting the axis at 90,000 makes an 8,000 difference fill the whole plot. The honest change is 91k → 99k ≈ +8.8%.',
      },
      {
        data: 'A line graph of test scores shows: 2021: 71, 2022: 74, 2023: 69, 2024: 75. A report shows ONLY 2023 → 2024.',
        claim: 'Claim: "Scores are on a strong upward trend."',
        correct: 'One rising segment was cherry-picked; the full series wobbles around 72',
        wrong: [
          'The claim is fully supported — 69 to 75 is an increase',
          'Scores actually declined every year',
          'Line graphs cannot show trends',
        ],
        why: 'A trend claim needs the whole series. 71 → 74 → 69 → 75 is fluctuation, not a steady climb.',
      },
    ]
    const c = cycle(seed, cases)
    return {
      title: 'Chart vs claim',
      prompt: `${c.data}\n\n${c.claim}\n\nWhat is the right verdict?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Check the axis start and the time window BEFORE reading the shape.',
        'Recompute the honest change from the numbers, ignoring the picture.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. ${c.why} The two most common chart tricks: axis truncation and window cherry-picking — always reconstruct the numbers.`,
    }
  },
)

const fermi = tpl(
  { id: 's-fermi', name: 'Fermi estimate', skillIds: ['s-fermi'], bucket: 'science', difficulty: 3, variants: 8, minutes: 3.5, transfer: true, calibration: true },
  (_rng, seed) => {
    const cases = [
      {
        q: 'Roughly how many minutes does a typical student spend in class per school year? (US: ~180 days, ~6 hours of class per day)',
        decomp: '180 days × 6 h × 60 min',
        answer: 64800,
        tolerance: 20000,
        unit: 'minutes',
      },
      {
        q: 'Roughly how many breaths do you take per day? (Estimate ~15 breaths per minute)',
        decomp: '15 × 60 min × 24 h',
        answer: 21600,
        tolerance: 8000,
        unit: 'breaths',
      },
      {
        q: 'Roughly how many words are in a 300-page novel? (~300 words per page)',
        decomp: '300 pages × 300 words',
        answer: 90000,
        tolerance: 40000,
        unit: 'words',
      },
      {
        q: 'Roughly how many heartbeats has a 14-year-old had? (Estimate ~75 beats per minute)',
        decomp: '75 × 60 min × 24 h × 365 days × 14 years',
        answer: 552000000,
        tolerance: 250000000,
        unit: 'beats',
      },
      {
        q: 'A school has 900 students. Roughly how many sheets of paper does it use in a year? (Estimate ~5 sheets per student per school day, ~180 days)',
        decomp: '900 students × 5 sheets × 180 days',
        answer: 810000,
        tolerance: 400000,
        unit: 'sheets',
      },
      {
        q: 'Roughly how many seconds are there in a typical human lifetime? (Use ~75 years)',
        decomp: '75 years × 365 days × 24 h × 3600 s',
        answer: 2400000000,
        tolerance: 900000000,
        unit: 'seconds',
      },
      {
        q: 'Roughly how many text messages does a busy teenager send in a year? (Estimate ~60 per day)',
        decomp: '60 messages × 365 days',
        answer: 21900,
        tolerance: 9000,
        unit: 'messages',
      },
      {
        q: 'A standard classroom is about 9 m × 7 m × 3 m. Roughly how many basketballs (~0.007 m³ each) would fill it?',
        decomp: '(9 × 7 × 3) m³ ÷ 0.007 m³',
        answer: 27000,
        tolerance: 12000,
        unit: 'basketballs',
      },
    ]
    const c = cycle(seed, cases)
    return {
      title: 'Estimate, then own the roughness',
      prompt: `${c.q}\n\nGive your estimate — within the right ballpark counts as correct.`,
      answer: numeric(c.answer, { tolerance: c.tolerance }),
      hints: [
        'Break it into factors you can estimate separately.',
        `Decomposition: ${c.decomp}.`,
        `Worked path: ≈ **${c.answer.toLocaleString('en-US')} ${c.unit}** (accepted range reflects estimation, not precision).`,
      ],
      explanation: `${c.decomp} ≈ **${c.answer.toLocaleString('en-US')} ${c.unit}**. Fermi answers are judged by the ballpark (within ~2×), because the goal is a decision-grade number, not a measurement. Notice which factor you were least sure of — that is where better data would go first.`,
    }
  },
)

/**
 * The OTHER half of estimation: auditing an estimate you did not make. Same
 * skill, deliberately different form — producing a number and interrogating
 * one exercise different muscles, and a second family is what makes the
 * Transferred rung reachable for s-fermi at all.
 */
const fermiAudit = tpl(
  { id: 's-fermi-audit', name: 'Audit an estimate', skillIds: ['s-fermi'], bucket: 'science', difficulty: 3, variants: 6, minutes: 3, transfer: true },
  (rng, seed) => {
    const cases = [
      {
        setup: 'A classmate estimates the number of pizza slices eaten in your 900-student school each year as: 900 students × 2 slices × 180 days ≈ 324,000.',
        q: 'Which factor should you challenge FIRST?',
        correct: 'The 2 slices per student per day — it assumes every student eats pizza daily',
        wrong: [
          'The 900 students — school sizes are impossible to know',
          'The 180 days — the school year is a well-known number',
          'The multiplication — the arithmetic is what usually fails',
        ],
        why: 'Attack the factor with the widest plausible range, not the one that is easiest to look up. Student count and school days are both known within a few percent; daily pizza consumption could be off by 10×.',
      },
      {
        setup: 'An estimate claims a city of 500,000 people needs about 50 dentists.',
        q: 'What is the fastest sanity check?',
        correct: 'That is 10,000 people per dentist — ask whether one dentist can serve 10,000 patients',
        wrong: [
          'Look up the exact number of dentists in that city',
          'Nothing — 50 is a reasonable-sounding number',
          'Check whether 500,000 is the correct population',
        ],
        why: 'Invert the estimate into a per-unit rate. A rate you have intuition about (patients per dentist) exposes an error that the raw total hides — real ratios are closer to 1,500-2,000 people per dentist, so 50 is roughly 5× too low.',
      },
      {
        setup: 'Someone estimates that a smartphone battery stores enough energy to lift a car one meter.',
        q: 'What should you do before believing or rejecting it?',
        correct: 'Convert both to the same units and compare orders of magnitude',
        wrong: [
          'Reject it — batteries obviously cannot lift cars',
          'Accept it — phone batteries are surprisingly powerful',
          'Search for someone who has tried the experiment',
        ],
        why: 'Surprising claims are not automatically false. A phone battery holds ~40,000 J; lifting a 1,500 kg car one meter takes ~15,000 J. The claim survives the check — which is exactly why you run the check instead of trusting your reaction.',
      },
      {
        setup: 'A report estimates 4 million people in a country of 60 million are professional musicians.',
        q: 'Which check kills this estimate fastest?',
        correct: 'That is 1 in 15 people — compare it to a job you know is common, like teaching',
        wrong: [
          'Musicians are hard to count, so the number cannot be checked',
          'Divide by the number of concert venues in the country',
          'The number is too round to be a real measurement',
        ],
        why: 'Convert to a share of the population and compare against an anchor you already have. Teachers are around 1 in 50; "more musicians than teachers by 3×" fails instantly without any research.',
      },
      {
        setup: 'You estimate a road trip: 600 miles ÷ 60 mph = 10 hours.',
        q: 'What is the most likely reason your estimate comes in LOW?',
        correct: 'It ignores stops — fuel, food, and traffic are real hours the formula omits',
        wrong: [
          'The division is wrong',
          '60 mph is far too slow for highway driving',
          'Distances on maps are always underestimates',
        ],
        why: 'Most estimation errors are omitted factors, not bad arithmetic. Before refining a number you have, ask what the model leaves out entirely — a missing term beats a mis-estimated one every time.',
      },
      {
        setup: 'Two estimates of the same quantity: yours says 8,000, a friend\'s says 500,000.',
        q: 'What does a 60× disagreement usually mean?',
        correct: 'One of you has a factor the other is missing, or you are estimating different things',
        wrong: [
          'The average, about 254,000, is the best answer',
          'The larger estimate is safer, so use it',
          'Estimation does not work for this quantity',
        ],
        why: 'Averaging hides the error instead of finding it. Gaps that large come from a structural difference — a missing factor or a different definition of the quantity — so compare the decompositions term by term rather than splitting the difference.',
      },
    ]
    const c = cycle(seed, cases)
    return {
      title: 'Audit an estimate',
      prompt: `${c.setup}\n\n${c.q}`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Ask which factor has the widest range of plausible values.',
        'Convert the estimate into a rate or share you already have intuition about.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. ${c.why}`,
    }
  },
)

const statsTrap = tpl(
  { id: 's-stats-trap', name: 'Statistics traps', skillIds: ['s-sources'], bucket: 'science', difficulty: 3, variants: 4, minutes: 3 },
  (rng, seed) => {
    const cases = [
      {
        q: 'A headline: "Risk DOUBLES for people who skip breakfast!" The study shows the risk went from 1 in 10,000 to 2 in 10,000. What is the fair takeaway?',
        correct: 'The relative jump (2×) sounds big, but the absolute risk rose by only 0.01 percentage points',
        wrong: [
          'Doubling always means a large danger',
          'The study must be fraudulent',
          'Absolute and relative risk are the same thing',
        ],
        why: 'Relative changes on tiny bases mislead; always ask for the absolute numbers.',
      },
      {
        q: '"90% of our customers rate us 5 stars!" — printed on a card handed out only to customers who agreed to give feedback in the store. What is the main problem?',
        correct: 'Selection bias: people willing to respond in person are not typical customers',
        wrong: [
          '90% is impossible statistically',
          'Five-star scales are illegal in surveys',
          'The sample is fine as long as it is large',
        ],
        why: 'How the sample was gathered matters more than its size — volunteers and survivors skew everything.',
      },
      {
        q: 'A support rate moves from 40% to 44%. A pundit says "support rose 4%". What is more precise?',
        correct: 'It rose 4 percentage POINTS, which is a 10% relative increase',
        wrong: [
          'It rose 4% — points and percent are interchangeable',
          'It rose 44%',
          'It rose 0.4%',
        ],
        why: 'Points measure the gap between percentages; percent measures relative change: 4/40 = 10%.',
      },
      {
        q: 'WWII engineers studied returning planes and saw bullet holes clustered on wings and tails. Where should armor go?',
        correct: 'Where returning planes show FEW holes (like engines) — planes hit there did not come back',
        wrong: [
          'On the wings and tails where the holes cluster',
          'Spread evenly, since data cannot help here',
          'Nowhere; armor only slows planes down',
        ],
        why: 'Survivorship bias: the data set silently excludes the planes that were lost — the missing data IS the message.',
      },
    ]
    const c = cycle(seed, cases)
    return {
      title: 'Read numbers like a skeptic',
      prompt: c.q,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Ask: what is the base? Who is in the sample? What is missing?',
        'Recompute the claim in absolute numbers, or name who never got counted.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. ${c.why}`,
    }
  },
)

const sourceQuality = fixed(
  { id: 's-source-rank', name: 'Rank the evidence', skillIds: ['s-sources'], bucket: 'science', difficulty: 3, minutes: 2.5 },
  {
    title: 'Which evidence is strongest?',
    prompt:
      'You want to know whether a study technique actually improves test scores. Which single source is the **strongest** evidence?',
    answer: {
      type: 'mcq',
      options: [
        'A meta-analysis pooling 40 randomized experiments on the technique',
        'A viral video by a straight-A student who swears by it',
        'One classroom that tried it and improved (no comparison group)',
        'A textbook company\'s brochure for its product based on the technique',
      ],
      correct: 0,
    },
    hints: [
      'Rank by: how many independent tests, how well-controlled, and who profits.',
      'Anecdotes and sellers sit at the bottom; controlled comparisons in the middle; pooled controlled comparisons at top.',
      'Worked path: **the meta-analysis** — many controlled tests, aggregated.',
    ],
    explanation:
      'A meta-analysis of randomized experiments stacks many fair tests and averages out flukes. The single classroom lacks a comparison group; the student is one unverified case; the brochure has a financial stake. Strength of evidence ≈ (controlled comparisons) × (independent replications) − (conflicts of interest).',
  },
)

const claimEvidence = fixed(
  { id: 's-claim-strength', name: 'Claim vs evidence strength', skillIds: ['s-hypo'], bucket: 'science', difficulty: 2, minutes: 2.5, transfer: true },
  {
    title: 'How much does the claim outrun the data?',
    prompt:
      'A fictional study: 30 plants got fertilizer X and grew an average of 2 cm taller than 30 unfertilized plants over one month.\n\nWhich conclusion stays INSIDE what the evidence supports?',
    answer: {
      type: 'mcq',
      options: [
        'In this test, fertilizer X was associated with modestly taller growth over one month',
        'Fertilizer X makes all plants grow taller everywhere',
        'Fertilizer X is the best fertilizer available',
        'Everyone should switch to fertilizer X immediately',
      ],
      correct: 0,
    },
    hints: [
      'Match the SCOPE of the conclusion to the scope of the test: which plants, how long, compared to what?',
      'Words like "all", "best", and "should" carry claims the experiment never tested.',
      'Worked path: the modest, scoped statement is the only one the data covers.',
    ],
    explanation:
      'The experiment tested one fertilizer vs none, one species-set, one month: the defensible claim is exactly that association. "All plants", "best", and "should switch" import comparisons and generality the study never measured. Calibrating claim-size to evidence-size is the core skill of scientific reading.',
  },
)

export const SCIENCE_TEMPLATES: ItemTemplate[] = [
  hypoControl,
  measureReliability,
  corrCause,
  graphClaim,
  fermi,
  fermiAudit,
  statsTrap,
  sourceQuality,
  claimEvidence,
]
