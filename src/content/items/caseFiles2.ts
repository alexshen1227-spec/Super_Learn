/**
 * Case Files, second wave — five cross-domain capstones, two of them
 * PARAMETERIZED (values change per run, answers computed from the values).
 */
import type { ItemPart, ItemTemplate, RenderedItem } from '../../domain/types'
import { mulberry32, rint } from '../../engine/rng'

function mk(
  def: {
    id: string
    name: string
    skillIds: string[]
    bucket: ItemTemplate['bucket']
    minutes: number
    variants: number
  },
  gen: (seed: number) => Omit<RenderedItem, 'templateId' | 'version' | 'seed' | 'kind'>,
): ItemTemplate {
  return {
    id: def.id,
    version: 1,
    kind: 'multi',
    name: def.name,
    skillIds: def.skillIds,
    bucket: def.bucket,
    difficulty: 4,
    variants: def.variants,
    minutes: def.minutes,
    transfer: true,
    provenance:
      def.variants > 1
        ? 'Original parameterized case for Axiom Lab; every numeric answer computed from the generated values.'
        : 'Original fictional case composed for Axiom Lab; deterministic parts solved during authoring.',
    generate: (seed: number): RenderedItem => ({
      templateId: def.id,
      version: 1,
      seed,
      kind: 'multi',
      ...gen(seed % Math.max(1, def.variants)),
    }),
  }
}

// ---------------------------------------------------------------- 1. streaming plans (parameterized)

const streamingPlans = mk(
  { id: 'case-streaming', name: 'Case File: The Streaming Plans', skillIds: ['m-linfunc', 'm-systems', 'st-ev'], bucket: 'math', minutes: 11, variants: 12 },
  (v) => {
    const rng = mulberry32(v * 7919 + 3)
    const m1 = rint(rng, 2, 3) // per-movie price, plan A
    const m2 = m1 + rint(rng, 2, 3) // pricier per movie
    const cross = rint(rng, 3, 6) // break-even movies
    const b2 = rint(rng, 2, 6) // plan B base
    const b1 = b2 + (m2 - m1) * cross // computed so lines cross at `cross`
    const k = cross + rint(rng, 2, 4) // your usage, past break-even
    const costA = b1 + m1 * k
    const costB = b2 + m2 * k
    const parts: ItemPart[] = [
      {
        study: `TWO STREAMING PLANS (monthly)\n\n| Plan | Base fee | Per movie |\n| --- | --- | --- |\n| A | $${b1} | $${m1} |\n| B | $${b2} | $${m2} |`,
        prompt: `You usually watch **${k} movies** a month. What does plan **A** cost that month, in dollars?`,
        answer: { type: 'numeric', answer: costA },
        explanation: `Cost = base + rate × movies: ${b1} + ${m1}×${k} = **$${costA}**. Same model shape as every "fee plus rate" situation.`,
      },
      {
        prompt: `At how many movies per month do the two plans cost the **same**?`,
        answer: { type: 'numeric', answer: cross },
        explanation: `Set them equal: ${b1} + ${m1}x = ${b2} + ${m2}x → ${b1 - b2} = ${m2 - m1}x → x = **${cross}**. Below it, the low-base plan wins; above it, the low-RATE plan wins.`,
      },
      {
        prompt: `Given your ${k} movies a month, which plan should you pick — and what's the reasoning shape?`,
        answer: {
          type: 'mcq',
          options: [
            `Plan A — past the break-even (${cross}), the lower per-movie rate dominates (saves $${costB - costA}/month)`,
            `Plan B — its base fee is lower, and base fees matter most`,
            `They're equal for any usage`,
            `Plan B — bigger per-movie price means better quality`,
          ],
          correct: 0,
        },
        explanation: `At ${k} > ${cross} movies, A costs $${costA} vs B's $${costB}. The transferable shape: with two linear options, find the crossing point, then ask which side of it YOU live on. (Price tells you nothing about quality — that's a different question needing different evidence.)`,
      },
      {
        prompt: 'Your friend watches 2 movies a month. Same answer?',
        answer: {
          type: 'mcq',
          options: [
            `No — below the break-even, plan B's lower base wins; the right plan depends on usage`,
            'Yes — the better plan is the better plan for everyone',
            'No — friends should pick different plans to compare',
            'Yes — plan A has the bigger base fee, so it must be premium',
          ],
          correct: 0,
        },
        explanation: `2 < ${cross}: B costs ${b2 + 2 * m2} vs A's ${b1 + 2 * m1}. "Which is better?" is the wrong question; "better FOR WHOM, at WHAT usage?" is the modeling habit worth keeping.`,
      },
    ]
    return {
      title: 'The Streaming Plans',
      prompt: 'Two plans, one decision. Build the models, find the crossing, and place yourself on the right side of it.',
      parts,
      hints: ['Cost = base + rate × amount.', 'Equal costs: set the two expressions equal.', 'The break-even splits the world into two regimes.'],
      explanation: 'Linear models + a crossing point = a decision framework that reprices phone plans, gym passes, and bulk buying. The math was y = mx + b twice; the wisdom was asking where YOU sit relative to the intersection.',
    }
  },
)

// ---------------------------------------------------------------- 2. free-throw claim (parameterized)

const freeThrow = mk(
  { id: 'case-freethrow', name: 'Case File: The Free-Throw Claim', skillIds: ['s-measure', 'm-percent', 'i-hypo'], bucket: 'science', minutes: 10, variants: 10 },
  (v) => {
    const rng = mulberry32(v * 104729 + 11)
    const beforeMade = rint(rng, 9, 12)
    const beforeTotal = 20
    const afterTotal = rint(rng, 5, 6)
    const afterMade = afterTotal - 1 // high small-sample rate
    const beforePct = (beforeMade / beforeTotal) * 100
    const afterPct = Math.round((afterMade / afterTotal) * 1000) / 10
    return {
      title: 'The Free-Throw Claim',
      prompt: `Your teammate: "New routine! I'm way better now." The numbers are below. Investigate before the team changes anything.`,
      parts: [
        {
          study: `FREE-THROW LOG\n\n| Period | Made | Attempts |\n| --- | --- | --- |\n| Last month (old routine) | ${beforeMade} | ${beforeTotal} |\n| Yesterday (new routine) | ${afterMade} | ${afterTotal} |`,
          prompt: `What was the make percentage **last month**? (Enter just the number.)`,
          answer: { type: 'numeric', answer: beforePct },
          explanation: `${beforeMade}/${beforeTotal} = **${beforePct}%** across a real sample of ${beforeTotal} attempts.`,
        },
        {
          prompt: `Yesterday's rate is ${afterPct}%. What's the main reason to hold off on "way better"?`,
          answer: {
            type: 'mcq',
            options: [
              `${afterTotal} attempts is a tiny sample — streaks that size happen by chance at the OLD skill level too`,
              'Percentages from different days can never be compared',
              'The old rate must be wrong',
              'Free throws are pure luck, so no data means anything',
            ],
            correct: 0,
          },
          explanation: `A ${beforePct}% shooter goes ${afterMade}-for-${afterTotal} pretty often by luck alone. Small samples swing wildly — the size of the sample IS part of the evidence.`,
        },
        {
          prompt: 'What is the best next test of the routine?',
          answer: {
            type: 'mcq',
            options: [
              'Log the next 50+ attempts with the new routine and compare rates',
              'Ask the teammate how confident they feel',
              'Watch one more session and eyeball it',
              'Compare against the team\'s best shooter',
            ],
            correct: 0,
          },
          explanation: 'More attempts shrink luck\'s share of the story; 50 vs 20 makes a real comparison. Confidence and eyeballing measure mood; the best-shooter comparison answers a different question entirely.',
        },
        {
          prompt: 'Write the two-sentence reply you\'d actually send: honest about the data, kind about the effort.',
          answer: {
            type: 'rubric',
            criteria: [
              'Acknowledges the promising start without calling it proof',
              'Names the sample-size issue in plain words',
              'Proposes the concrete next test (more logged attempts)',
            ],
            model:
              'Model: "Nice start — ' + afterMade + ' of ' + afterTotal + ' is exactly what we want to see. Small samples lie though, so let\'s log your next 50 with the new routine; if you\'re still above ' + beforePct + '%, the routine has earned its case."',
          },
          explanation: 'The social skill and the statistical skill are the same move here: take the claim seriously enough to TEST it properly. That sentence pattern — "promising, unproven, here\'s the test" — works on far more than free throws.',
        },
      ],
      hints: ['Percent = made ÷ attempts.', 'Ask how often chance alone produces the new streak.', 'Better data beats better arguing.'],
      explanation: 'Small-sample enthusiasm is the most common statistical trap in daily life. The case\'s skeleton: compute honestly, size the sample, design the cheap decisive test, and communicate without deflating anyone.',
    }
  },
)

// ---------------------------------------------------------------- 3. the garden grid (fixed)

const gardenGrid = mk(
  { id: 'case-garden', name: 'Case File: The Garden Grid', skillIds: ['m-area', 'st-decomp', 'm-model'], bucket: 'math', minutes: 10, variants: 1 },
  () => ({
    title: 'The Garden Grid',
    prompt: 'You have **24 m of fencing** for a rectangular vegetable patch, whole-meter sides. Design it like an optimizer.',
    parts: [
      {
        prompt: 'One candidate: a 6 × 6 square. What area does it enclose, in m²?',
        answer: { type: 'numeric', answer: 36 },
        explanation: 'Perimeter check: 2(6+6) = 24 ✓. Area 6 × 6 = **36 m²**.',
      },
      {
        prompt: 'Another candidate with the same 24 m of fence: 8 × 4. Its area, in m²?',
        answer: { type: 'numeric', answer: 32 },
        explanation: '2(8+4) = 24 ✓ but area 8 × 4 = **32 m²** — same fence, four square meters less garden.',
      },
      {
        prompt: 'Try 10 × 2 in your head. What pattern is emerging?',
        answer: {
          type: 'mcq',
          options: [
            'For a fixed perimeter, area shrinks as the rectangle stretches — the square is the maximum',
            'Longer rectangles always enclose more area',
            'All rectangles with equal perimeter enclose equal area',
            'Area depends only on the longest side',
          ],
          correct: 0,
        },
        explanation: '10 × 2 = 20 m². The sequence 36 → 32 → 20 tells the story: equal perimeter, shrinking area as sides diverge. The square maximizes — a fact worth banking, and a first taste of optimization (the calculus version arrives years later; the INSIGHT is available now).',
      },
      {
        prompt: 'Now plan the build. Order the steps so nothing blocks anything.',
        answer: {
          type: 'order',
          options: [
            'Measure and mark the 6 × 6 corners with stakes and string',
            'Clear and level the marked ground',
            'Set the fence posts along the string lines',
            'Attach fencing to the posts and hang the gate',
          ],
          correct: [0, 1, 2, 3],
        },
        explanation: 'Backward from "gate hangs on fence": fence needs posts, posts need prepared ground, ground prep needs marked boundaries. Each step consumes the previous step\'s output — the dependency chain IS the plan.',
      },
    ],
    hints: ['Check every candidate against the fence budget first.', 'Compare areas at EQUAL perimeter.', 'Plan backward from the finished gate.'],
    explanation: 'One case, two transferable results: the isoperimetric insight (fixed boundary → square beats stretched) and dependency-ordered planning. Both outlive the garden.',
  }),
)

// ---------------------------------------------------------------- 4. the group chat argument (fixed)

const groupChat = mk(
  { id: 'case-groupchat', name: 'Case File: The Group Chat Argument', skillIds: ['h-influence', 'h-boundary', 'i-logic'], bucket: 'insight', minutes: 10, variants: 1 },
  () => ({
    title: 'The Group Chat Argument',
    prompt: 'The class group chat is melting down over a canceled trip-planning meeting. Read the thread like an analyst, then act like a Guardian.',
    parts: [
      {
        study:
          'THE THREAD\n\nJordan: "Mr. P canceled Friday\'s meeting. Third time. He obviously doesn\'t care about this trip."\nSam: "My sister had him last year and said he canceled stuff constantly."\nRiley: "If everyone spams his inbox tonight he HAS to respond. Who\'s in??"\nAlex: "The calendar says he has parent conferences all week."',
        prompt: 'Label each message.',
        answer: {
          type: 'classify',
          categories: ['Claim about motives', 'Weak evidence', 'Pressure move', 'Checkable fact'],
          statements: [
            { text: 'Jordan: "he obviously doesn\'t care"', category: 0 },
            { text: 'Sam: "my sister said he cancels constantly"', category: 1 },
            { text: 'Riley: "spam his inbox tonight"', category: 2 },
            { text: 'Alex: "calendar says parent conferences all week"', category: 3 },
          ],
        },
        explanation: 'One motive-read presented as fact, one secondhand anecdote, one urgency-driven pile-on, and exactly one checkable fact — which happens to explain the cancellations innocently. Sorting BEFORE reacting is the whole skill.',
      },
      {
        prompt: 'Which reply actually helps?',
        answer: {
          type: 'mcq',
          options: [
            '"Conferences week would explain it — I\'ll ask him tomorrow for a new date and report back. Hold off on the inbox thing?"',
            '"Yeah he clearly hates us, let\'s escalate"',
            '"This chat is so dramatic, muting"',
            '"Spam him but politely"',
          ],
          correct: 0,
        },
        explanation: 'It picks up the checkable fact, volunteers a single point of contact, and declines the pile-on without shaming anyone. De-escalation is redirecting energy toward the testable path, not lecturing the group.',
      },
      {
        prompt: 'Steelman Jordan before you reply privately: write the strongest fair version of their frustration.',
        answer: {
          type: 'rubric',
          criteria: [
            'States Jordan\'s real grievance (three cancellations) without the mind-reading',
            'Grants what\'s legitimate: repeated cancellations DO cost the group time and trust',
            'Separates "this pattern is frustrating" from "he doesn\'t care"',
          ],
          model:
            'Model: "Three cancellations in a row is genuinely frustrating — the group keeps clearing Friday for nothing, and no explanation was communicated. That\'s a real planning failure worth raising. It still doesn\'t tell us WHY: conference season fits the same facts without anyone being the villain."',
        },
        explanation: 'Steelmanning the angriest person keeps them an ally while removing the motive-reading. Most group blowups are a legitimate grievance wearing a mind-reading costume — honor the first, decline the second.',
      },
    ],
    hints: ['Sort claim / evidence / pressure / fact first.', 'Find the checkable thing and volunteer to check it.', 'Grant the legitimate grievance; drop the motive-read.'],
    explanation: 'The Guardian pattern end-to-end: analyze the thread, defuse the pile-on by redirecting to the testable fact, and steelman the upset person so the group stays whole. Notably: nobody had to be wrong for everyone to calm down.',
  }),
)

// ---------------------------------------------------------------- 5. science fair data (parameterized)

const scienceFair = mk(
  { id: 'case-sciencefair', name: 'Case File: The Science Fair Data', skillIds: ['m-stats', 's-measure', 'x-explain'], bucket: 'science', minutes: 10, variants: 10 },
  (v) => {
    const rng = mulberry32(v * 65537 + 29)
    const base = rint(rng, 18, 26)
    const clean = [base, base + 1, base - 1, base + 2]
    const outlier = base + rint(rng, 14, 20)
    const all = [...clean, outlier]
    const meanAll = Math.round((all.reduce((a, b) => a + b, 0) / all.length) * 10) / 10
    const meanClean = (clean.reduce((a, b) => a + b, 0) / clean.length + 0) // integer-ish
    return {
      title: 'The Science Fair Data',
      prompt: 'Your paper-airplane experiment produced five flight distances — and a problem. Handle it like a scientist writing for judges.',
      parts: [
        {
          study: `FLIGHT DISTANCES (meters ÷ 10): **${all.join(', ')}**\n\nLab note from trial 5: "table got bumped mid-launch."`,
          prompt: 'What is the mean of ALL five trials? (One decimal.)',
          answer: { type: 'numeric', answer: meanAll, tolerance: 0.05 },
          explanation: `(${all.join(' + ')}) ÷ 5 = **${meanAll}** — dragged upward by the bumped trial.`,
        },
        {
          prompt: 'And the mean of the four clean trials?',
          answer: { type: 'numeric', answer: meanClean, tolerance: 0.05 },
          explanation: `(${clean.join(' + ')}) ÷ 4 = **${meanClean}**. The tight cluster (${clean.join(', ')}) is what a repeatable process looks like.`,
        },
        {
          prompt: 'What should the report do with trial 5?',
          answer: {
            type: 'mcq',
            options: [
              'Exclude it, SAY SO, and give the documented reason (the bump) — reporting both means for transparency',
              'Keep it silently — data is data',
              'Delete it silently — it ruins the average',
              'Re-run the average until the number looks better',
            ],
            correct: 0,
          },
          explanation: 'Exclusion with disclosure is honest; silent keeping misleads with a known-corrupted point; silent deletion is indistinguishable from cherry-picking. The lab note is what makes the exclusion legitimate — this is why scientists keep lab notes.',
        },
        {
          prompt: 'Write the one-paragraph "Results" section a judge would trust.',
          answer: {
            type: 'rubric',
            criteria: [
              'Reports the clean mean AND mentions the excluded trial with its reason',
              'Describes the spread/consistency of the clean trials',
              'Claims only what five (four) trials can support',
            ],
            model:
              `Model: "Across four valid trials the plane flew a mean of ${meanClean} (range ${Math.min(...clean)}–${Math.max(...clean)}), a tight cluster suggesting a repeatable design. A fifth trial (${outlier}) was excluded: the launch table was bumped mid-throw, recorded at the time in the lab log; including it would raise the mean to ${meanAll}. More trials would sharpen the estimate."`,
          },
          explanation: 'Judges (and reviewers, and bosses) trust reports that show their seams: what was excluded, why, and what the number would have been otherwise. Transparency converts a flaw into credibility.',
        },
      ],
      hints: ['Compute both means — the difference IS the outlier\'s story.', 'Documented cause is what separates exclusion from cherry-picking.', 'Report the seams, not just the number.'],
      explanation: 'Mean-vs-outlier, documented exclusion, and transparent writing — one small dataset, three habits that make quantitative work trustworthy.',
    }
  },
)

export const CASEFILE2_TEMPLATES: ItemTemplate[] = [streamingPlans, freeThrow, gardenGrid, groupChat, scienceFair]
