/**
 * Game theory, part three: the classroom core, and what people actually do.
 *
 * Part one (`gameTheory.ts`) covers best response, dominance, Nash, the
 * prisoner's dilemma, coordination, repetition, commitment and signalling.
 * Part two (`gameTheoryDepth.ts`) adds iterated elimination, backward
 * induction, the winner's curse, common knowledge, unpredictability and the
 * commons. This file closes the two remaining gaps:
 *
 *   i-levelk    how many steps ahead is everyone ELSE taking?
 *   i-mixed     the probability that makes an opponent indifferent
 *   i-median    why competitors and parties end up in the middle
 *   i-credible  a threat you would not carry out is not a threat
 *   i-fairness  the offer theory predicts, and the offer that actually works
 *   i-trust     why strangers cooperate, and what keeps them doing it
 *
 * PROVENANCE, as CLAUDE.md requires. The SEQUENCE these follow is the standard
 * one — Yale's ECON 159 (Ben Polak, Open Yale Courses) runs dominance →
 * iterated deletion and the median voter → best response → Nash → mixed
 * strategies → backward induction → subgame perfection → repeated games →
 * asymmetric information → auctions, and this app now covers all of it. The
 * emphasis on rules a person can carry around rather than solution concepts
 * they can name comes from Dixit & Nalebuff (*Thinking Strategically*, and its
 * later rewrite *The Art of Strategy*), whose signature moves are "look ahead
 * and reason back", credible commitment, and deliberate mixing.
 *
 * **Nothing is copied.** No question text, payoff numbers, scenario, or phrasing
 * comes from any of those sources; every generator here builds its own game and
 * derives its own key. The classic experimental PARADIGMS (guessing game,
 * ultimatum, trust, public goods with punishment) are named in explanations as
 * findings, which is citation rather than reuse — the app's own scenarios are
 * original and none reproduces an experimental instrument.
 *
 * WHY BEHAVIOURAL GAME THEORY IS HERE AT ALL, and it is not decoration.
 * Equilibrium analysis answers "what two perfectly rational players would do",
 * and the experimental record says that is frequently not what happens. Three
 * results that a learner who only knew the theory would get wrong:
 *
 * - **The guessing game.** Pick a number; whoever is closest to two thirds of
 *   the average wins. The only equilibrium is zero and almost nobody plays it.
 *   Real play clusters at 50, 33 and 22 — one, two and three steps of reasoning
 *   — and a large online study of chess players averaged 32.15 with visible
 *   spikes at exactly those points. In a 1981 French magazine competition with
 *   about 15,000 entrants, two thirds of the average came out at 8.99% of the
 *   maximum. **Playing the equilibrium loses.** The skill is estimating how many
 *   steps the actual people around you are taking.
 * - **The ultimatum game.** Theory says offer the minimum and it will be
 *   accepted, since something beats nothing. Offers cluster at 40-50%, and an
 *   offer of 20% is rejected about half the time, more as it falls further.
 * - **Public goods with punishment.** Fehr & Gächter (2000, *American Economic
 *   Review* 90(4), 980-994): with a costly punishment option available, near
 *   complete cooperation is reached and held, where selfish rationality predicts
 *   none at all.
 *
 * The honest framing throughout: the equilibrium is the answer to a precise
 * question, and that question is often not the one in front of you.
 *
 * BOUNDARY, AS CONTENT LAW. The founding brief admits strategy only where the
 * win survives daylight. `i-fairness` and `i-trust` are written so the useful
 * move is always the one you could say out loud to the other player: read the
 * ultimatum results as "an offer people accept" rather than "the least you can
 * get away with", and punishment items are about norms a group agrees to in the
 * open, never about retaliation. Nothing here teaches extracting a better deal
 * from someone who does not know what you know.
 */
import type { ItemTemplate } from '../../domain/types'
import { pick, rint } from '../../engine/rng'
import { mcq, multi, numeric, tpl } from '../lib'

/** Capitalise an interpolated fragment that opens a sentence. */
const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1)

// ============================================================ i-levelk
// How many steps is everyone else taking?

const GUESS_STORIES = [
  { who: 'everyone in your year group', what: 'a number between 0 and 100' },
  { who: 'the twenty people in the club', what: 'a number between 0 and 100' },
  { who: 'all the readers of a school newsletter', what: 'a number between 0 and 100' },
  { who: 'the thirty entrants in an online contest', what: 'a number between 0 and 100' },
] as const

/** Level-k anchors for the two-thirds game, starting from a random level-0 of 50. */
function levels(start: number, steps: number): number[] {
  const out = [start]
  for (let i = 0; i < steps; i++) out.push(Math.round(out[out.length - 1] * (2 / 3)))
  return out
}

const levelkEntry = tpl(
  {
    id: 'gtl-levelk-entry',
    name: 'One step, two steps',
    skillIds: ['i-levelk'],
    bucket: 'investigator',
    difficulty: 2,
    // Four stories x four anchors, minus the collisions the rng actually
    // produces across served seeds. Measured, not assumed.
    variants: 13,
    minutes: 2,
  },
  (rng, seed) => {
    const s = GUESS_STORIES[seed % GUESS_STORIES.length]
    const anchor = pick(rng, [50, 45, 60, 40])
    const chain = levels(anchor, 3)
    const step = rint(rng, 1, 3)
    return {
      title: 'Two thirds of the average',
      prompt:
        `${cap(s.who)} each write down ${s.what}. Whoever is closest to **two thirds of the average** wins.\n\n` +
        `Suppose you believed everyone else was going to write about **${anchor}**.\n\n` +
        `What should you write? And if you then thought they had worked that out too, what next?`,
      answer: mcq(rng, `${chain[1]}, then ${chain[2]} if they are one step ahead`, [
        `${anchor}, then ${chain[1]} if they are one step ahead`,
        `${chain[2]}, then ${chain[3]} if they are one step ahead`,
        `${Math.round(anchor * 1.5)}, then ${anchor} if they are one step ahead`,
        `It cannot be worked out until the average is actually known`,
      ]),
      hints: [
        'Two thirds of a number is that number times 2/3.',
        `If they all write ${anchor}, the average is ${anchor}, and two thirds of that is ${chain[1]}.`,
        `Now repeat: if they all write ${chain[1]}, two thirds of that is ${chain[2]}.`,
      ],
      explanation:
        `If everyone else writes ${anchor}, two thirds of the average is **${chain[1]}** — so that is your best reply. ` +
        `But if they think that too, the average becomes ${chain[1]} and the target drops to **${chain[2]}**. ` +
        `Then ${chain[3]}, and so on down.\n\n` +
        `Each round of "but they will have thought of that" is one **step**. The whole skill is not doing more steps than everyone else — it is doing exactly **one more step than the people you are actually playing against**, which is usually far fewer than you would guess.` +
        (step > 0 ? '' : ''),
    }
  },
)

const levelkBeauty = tpl(
  {
    id: 'gtl-levelk-play',
    name: 'How many steps do THEY take?',
    skillIds: ['i-levelk'],
    bucket: 'investigator',
    difficulty: 3,
    variants: 32,
    minutes: 3,
    calibration: true,
  },
  (rng, seed) => {
    const s = GUESS_STORIES[seed % GUESS_STORIES.length]
    // A realistic crowd: mostly one and two steps, a few at zero and three.
    const n0 = rint(rng, 2, 4)
    const n1 = rint(rng, 5, 9)
    const n2 = rint(rng, 4, 7)
    const n3 = rint(rng, 1, 3)
    const guesses = [
      ...Array.from({ length: n0 }, () => 50),
      ...Array.from({ length: n1 }, () => 33),
      ...Array.from({ length: n2 }, () => 22),
      ...Array.from({ length: n3 }, () => 15),
    ]
    const total = guesses.reduce((a, b) => a + b, 0)
    const mean = total / guesses.length
    const target = Math.round((mean * 2) / 3)
    return {
      title: 'A real crowd, not a perfect one',
      prompt:
        `${cap(s.who)} play the two-thirds game. From past rounds you know roughly how this group thinks:\n\n` +
        `- ${n0} people will write about **50** (they have not thought past the middle)\n` +
        `- ${n1} people will write about **33** (one step)\n` +
        `- ${n2} people will write about **22** (two steps)\n` +
        `- ${n3} people will write about **15** (three steps)\n\n` +
        `What number should YOU write?`,
      answer: numeric(target, { tolerance: 2 }),
      hints: [
        'Work out the average of all those guesses first. Weight each number by how many people write it.',
        `Total: ${guesses.length} people. Sum of guesses ${total}, so the average is about ${mean.toFixed(1)}.`,
        `Two thirds of ${mean.toFixed(1)} is about ${target}.`,
      ],
      explanation:
        `The average of that crowd is about **${mean.toFixed(1)}**, so the winning number is about **${target}**.\n\n` +
        `Notice what did NOT win: **0**. Zero is the only equilibrium of this game — the number that survives every round of "but they will have thought of that" — and it loses badly against real people, who stop after one or two steps.\n\n` +
        `That is the whole lesson. In a large online study of chess players the average guess was 32.15, with visible clusters at exactly 50, 33 and 22. In a 1981 French magazine competition with around fifteen thousand entrants, two thirds of the average came out at about 9% of the maximum. **Being more rational than everyone else is not the same as winning.** You want to be one step ahead of the actual crowd, not infinitely ahead of an imaginary one.`,
    }
  },
)

const LEVELK_APPLY = [
  {
    scene:
      'Everyone in your year has to pick a revision topic to present. The unpopular topics get less competition and a better mark for the same work. You have worked out which topic is least popular.',
    correct: 'Ask how many other people are likely to have gone through that same reasoning',
    wrong: [
      'Take the least popular topic, since less competition is straightforwardly better',
      'Take the most popular topic, since everyone else will be avoiding it by now',
      'Take a middling topic, since the extremes will both be crowded with clever people',
      'It makes no difference which you take, since everyone is reasoning the same way',
    ],
    why: 'The first option is one step of reasoning and the second is two, and neither is right on its own — what matters is how many steps the actual year group takes. If almost nobody thinks about it, one step wins. If everyone is strategic, one step is exactly where the crowd is and you want two. The question is empirical, not logical.',
  },
  {
    scene:
      'Two shops are the only ones selling a popular item. You want to buy it and you know both will discount at some point before the end of the month.',
    correct: 'Work out how far ahead each shop is likely to think, not how far ahead they could think',
    wrong: [
      'Wait until the last possible day, since that is when the discount will be deepest',
      'Buy now, since the shops will have already worked out how to avoid discounting at all',
      'Buy the moment either one discounts, since the other will immediately match it',
      'Nothing can be judged without knowing what each shop paid for the stock',
    ],
    why: 'Reasoning "they will discount at the end, so they will do it a day earlier to beat the rival, so a day earlier than that" unravels to discounting immediately — which is what perfect reasoners would do and not what shops do. The useful question is how many rounds of that the actual shops run.',
  },
  {
    scene:
      'A group is choosing a meeting spot with no way to discuss it first. You are trying to pick the place most likely to be chosen by everyone else.',
    correct: 'Pick the most obvious place, which is not the same as the best one',
    wrong: [
      'Pick the place that is best for the group, since others will reason the same way',
      'Pick the place nearest the middle of everyone, since that is the fairest choice',
      'Pick your own preferred place and let the others come to you there',
      'There is no way to choose without being able to talk to each other first',
    ],
    why: 'The question is not which place is best, it is which place everyone expects everyone to expect. Obviousness beats quality here, and the second option is the near-miss: the geographic middle is only the answer if everybody would independently think of it, which is a different property from being fair.',
  },
]

const levelkApply = tpl(
  {
    id: 'gtl-levelk-apply',
    name: 'One step ahead of the actual crowd',
    skillIds: ['i-levelk'],
    bucket: 'investigator',
    difficulty: 4,
    variants: LEVELK_APPLY.length,
    minutes: 2.5,
    transfer: true,
  },
  (rng, seed) => {
    const c = LEVELK_APPLY[((seed % LEVELK_APPLY.length) + LEVELK_APPLY.length) % LEVELK_APPLY.length]
    return {
      title: 'No numbers this time',
      prompt: `${c.scene}\n\nWhat is the move?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Ask how many rounds of "but they will have thought of that" the people involved actually run.',
        'Being the most rational player in the room is not the same as winning against the people in it.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**\n\n${c.why}\n\nThe rule: **aim one step past the people you are actually playing, not one step past a perfect reasoner.** Reasoning all the way to the end usually overshoots the room.`,
    }
  },
)

// ============================================================ i-mixed
// The probability that makes them indifferent.

const MIXED_STORIES = [
  { you: 'attacker', them: 'keeper', a: 'left', b: 'right', setting: 'penalty kicks' },
  { you: 'server', them: 'returner', a: 'wide', b: 'body', setting: 'a tennis serve' },
  { you: 'runner', them: 'defender', a: 'outside', b: 'inside', setting: 'a ball game' },
  { you: 'stallholder', them: 'rival', a: 'the busy end', b: 'the quiet end', setting: 'a weekly market' },
] as const

const mixedEntry = tpl(
  {
    id: 'gtl-mixed-entry',
    name: 'Why a pure plan loses here',
    skillIds: ['i-mixed'],
    bucket: 'investigator',
    difficulty: 2,
    variants: 16,
    minutes: 2,
  },
  (rng, seed) => {
    const s = MIXED_STORIES[seed % MIXED_STORIES.length]
    const scoreIfWrong = rint(rng, 7, 9)
    const scoreIfRight = rint(rng, 1, 3)
    return {
      title: 'They react to you',
      prompt:
        `You are the ${s.you} in ${s.setting}. You go **${s.a}** or **${s.b}**; the ${s.them} guesses one and commits before you act.\n\n` +
        `- If they guess wrong you score about ${scoreIfWrong} times in 10.\n` +
        `- If they guess right you score about ${scoreIfRight} times in 10.\n\n` +
        `Suppose you decide, once and for all, always to go **${s.a}**. What happens?`,
      answer: mcq(rng, `They start always guessing ${s.a}, and I end up scoring about ${scoreIfRight} in 10`, [
        `They cannot know my plan, so I keep scoring about ${scoreIfWrong} in 10`,
        `They guess randomly regardless, so I score about ${Math.round((scoreIfWrong + scoreIfRight) / 2)} in 10`,
        `It depends entirely on whether ${s.a} is the stronger side for me`,
        `Nothing changes, because each attempt is independent of the last one`,
      ]),
      hints: [
        'They are watching. A plan you follow every time is a plan they will notice.',
        'Once they know which side you take, they take it too.',
        `That leaves you on the "guessed right" line: about ${scoreIfRight} in 10.`,
      ],
      explanation:
        `They start guessing ${s.a} every time, and you fall to about **${scoreIfRight} in 10**.\n\n` +
        `This is what makes these situations different from ordinary decisions: your best choice depends on their choice, and their choice depends on yours. There is **no single best move** — any fixed plan gets read and beaten.\n\n` +
        `The way out is to mix. The harder question, which the next level of this skill asks, is not "mix a bit" but exactly what proportion — and the answer is the one that leaves them with no reason to prefer either guess.`,
    }
  },
)

const mixedSolve = tpl(
  {
    id: 'gtl-mixed-solve',
    name: 'The proportion that leaves them guessing',
    skillIds: ['i-mixed'],
    bucket: 'investigator',
    difficulty: 4,
    variants: 32,
    minutes: 4,
    calibration: true,
  },
  (rng, seed) => {
    const s = MIXED_STORIES[seed % MIXED_STORIES.length]
    /*
     * Their payoff from guessing A is p*x + (1-p)*y where p is how often you go
     * A. Their payoff from guessing B is p*u + (1-p)*v. Setting them equal:
     *   p = (v - y) / (x - y - u + v)
     * Values are chosen so the solution is a clean tenth.
     */
    const pTenths = rint(rng, 3, 7)
    const p = pTenths / 10
    // Build their payoff table around that solution.
    const x = rint(rng, 6, 9) // they guess A, you went A → good for them
    const y = rint(rng, 1, 3) // they guess A, you went B → bad for them
    const v = Math.round(y + p * (x - y) - p * 0 + 0) // placeholder, fixed below
    void v
    // Choose u and w so that indifference lands exactly on p.
    // Their A-payoff: p*x + (1-p)*y. Pick their B-payoff pair (u,w) with
    // u = payoff when they guess B and you went A, w = when both B.
    const u = rint(rng, 1, 3)
    const aVal = p * x + (1 - p) * y
    // p*u + (1-p)*w = aVal  →  w = (aVal - p*u) / (1-p)
    const w = Math.round(((aVal - p * u) / (1 - p)) * 10) / 10
    const pct = Math.round(p * 100)
    return {
      title: 'Solve the mix',
      prompt:
        `You are the ${s.you} in ${s.setting}, choosing **${s.a}** or **${s.b}**. The ${s.them} chooses which side to cover. Their payoffs:\n\n` +
        `| | you go **${s.a}** | you go **${s.b}** |\n| --- | --- | --- |\n` +
        `| they cover **${s.a}** | ${x} | ${y} |\n| they cover **${s.b}** | ${u} | ${w} |\n\n` +
        `You want to choose ${s.a} with some probability **p** such that the ${s.them} gains nothing by favouring either side — because the moment one side is better for them, they take it and you are readable.\n\n` +
        `What percentage of the time should you go **${s.a}**?`,
      answer: numeric(pct, { tolerance: 3, unit: '%' }),
      hints: [
        'Write their payoff from covering each side as a formula in p, then set the two equal.',
        `Covering ${s.a} pays them p×${x} + (1−p)×${y}. Covering ${s.b} pays them p×${u} + (1−p)×${w}.`,
        `Solving p×${x} + (1−p)×${y} = p×${u} + (1−p)×${w} gives p = ${p.toFixed(2)}, so ${pct}%.`,
      ],
      explanation:
        `**${pct}%.**\n\n` +
        `Set their two payoffs equal and solve:\n\n` +
        `p×${x} + (1−p)×${y} = p×${u} + (1−p)×${w}  →  p = **${p.toFixed(2)}**\n\n` +
        `The move that catches people out: you are solving for the mix that makes **THEIR** two options equally good, using **THEIR** numbers, not yours. That feels backwards and it is the whole method. If one side were better for them they would always cover it and you would be exploitable; making them indifferent is exactly what removes their edge.\n\n` +
        `Worth being clear about what this does NOT mean: it is not the mix that maximises your score against a fixed opponent. Against someone who always covers one side, you should simply take the other. This is the mix that cannot be punished by an opponent who adapts.`,
    }
  },
)

const MIXED_APPLY = [
  {
    scene: 'You check homework answers against a friend\'s about half the time, at no fixed pattern.',
    correct: 'This is a reasonable mix only if somebody would act on knowing when you check',
    wrong: [
      'This is the right approach, since unpredictability is always the safer policy',
      'This is wrong — checking every time would catch more mistakes overall',
      'This is wrong — a coin flip means you check when it matters least half the time',
      'It cannot be judged without knowing how often the answers actually differ',
    ],
    why: 'Mixing costs something and only earns it back against someone adapting to you. A friend is not gaming your checking schedule, so the mix buys nothing here. The third option is the interesting one: it is a fair criticism of random checking in a world with no opponent, which is exactly the world this is.',
  },
  {
    scene: 'A ticket inspector cannot check every passenger, so they check a randomly chosen fraction.',
    correct: 'The fraction should be just high enough that fare-dodging stops being worth it',
    wrong: [
      'The fraction should be as high as the budget allows, since more checks catch more people',
      'The fraction should be exactly half, so that passengers cannot predict anything',
      'The fraction does not matter as long as it is genuinely random and unannounced',
      'They should check everyone on some days and nobody on others, to keep it unpredictable',
    ],
    why: 'The target is not catching people, it is making the sum come out against dodging — which is the same "make them indifferent" logic pointed at deterrence rather than at a penalty kick. Note that half is not special, and maximum checking is the wrong objective: the cheapest fraction that flips the incentive is the right one.',
  },
  {
    scene: 'In a repeated game against a friend, you notice they play rock slightly more often than the other two.',
    correct: 'Stop mixing and exploit the bias, because they are not adapting',
    wrong: [
      'Keep mixing evenly, since that is the equilibrium and cannot be beaten',
      'Play rock more often too, since matching their pattern makes you unpredictable',
      'Mix but weight it only slightly toward paper, to avoid being noticed exploiting them',
      'Nothing can be done — a slight bias over a few rounds could easily be chance',
    ],
    why: 'The even mix is the strategy that cannot be EXPLOITED; it is not the strategy that exploits. Against a fixed, readable opponent it is exactly the wrong choice, because it throws away the edge you have found. The first option confuses "unbeatable" with "best", which is the most common error about equilibrium there is.',
  },
]

const mixedApply = tpl(
  {
    id: 'gtl-mixed-apply',
    name: 'When to mix, and when not to',
    skillIds: ['i-mixed'],
    bucket: 'investigator',
    difficulty: 4,
    variants: MIXED_APPLY.length,
    minutes: 2.5,
    transfer: true,
  },
  (rng, seed) => {
    const c = MIXED_APPLY[((seed % MIXED_APPLY.length) + MIXED_APPLY.length) % MIXED_APPLY.length]
    return {
      title: 'Is there anyone to be unpredictable against?',
      prompt: `${c.scene}\n\nWhat is the right read?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Mixing protects you from an opponent who ADAPTS. Ask whether anyone here is adapting.',
        'The equilibrium mix is the one that cannot be exploited — not the one that exploits.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**\n\n${c.why}\n\nThe two halves of the rule: **mix when someone is reading you, and stop mixing the moment you can read them.**`,
    }
  },
)

// ============================================================ i-median
// Why everything ends up in the middle.

const MEDIAN_STORIES = [
  { thing: 'two ice-cream vans', line: 'a long beach', ends: ['the north end', 'the south end'] as const },
  { thing: 'two bus routes', line: 'a straight main road', ends: ['the east end', 'the west end'] as const },
  { thing: 'two coffee stalls', line: 'a single station platform', ends: ['the front', 'the back'] as const },
  { thing: 'two clubs pitching to the same year group', line: 'a range from very casual to very serious', ends: ['the casual end', 'the serious end'] as const },
] as const

const medianEntry = tpl(
  {
    id: 'gtl-median-entry',
    name: 'Where should you stand?',
    skillIds: ['i-median'],
    bucket: 'investigator',
    difficulty: 2,
    variants: 16,
    minutes: 2.5,
  },
  (rng, seed) => {
    const s = MEDIAN_STORIES[seed % MEDIAN_STORIES.length]
    const rivalPos = pick(rng, [20, 25, 30, 70, 75, 80])
    const towardMiddle = rivalPos < 50
    return {
      title: 'The other one has already chosen',
      prompt:
        `${cap(s.thing)} are placing themselves along ${s.line}. Customers are spread evenly along it and each goes to whichever is nearer.\n\n` +
        `Think of the line as running from 0 to 100. The other one has set up at **${rivalPos}**.\n\n` +
        `Where should you set up to get the larger share?`,
      answer: mcq(
        rng,
        towardMiddle
          ? `Just above ${rivalPos} — say ${rivalPos + 2} — which gives me everything above that point`
          : `Just below ${rivalPos} — say ${rivalPos - 2} — which gives me everything below that point`,
        [
          `At ${rivalPos < 50 ? 90 : 10}, so that I have that whole end of the line to myself`,
          `At exactly 50, since the middle is the fairest and most central position`,
          `At exactly ${rivalPos}, so that customers split evenly between the two of us`,
          `It does not matter where I go, since customers simply pick the nearer one`,
        ],
      ),
      hints: [
        'Everyone goes to the nearer one, so the line splits at the midpoint between the two of you.',
        `If you set up just ${towardMiddle ? 'above' : 'below'} them, that midpoint is right next to them.`,
        `That hands you the whole of the ${towardMiddle ? 'larger side above' : 'larger side below'} — about ${Math.max(rivalPos, 100 - rivalPos)}% of the line.`,
      ],
      explanation:
        `Set up just ${towardMiddle ? 'above' : 'below'} them, at about **${towardMiddle ? rivalPos + 2 : rivalPos - 2}**.\n\n` +
        `Customers split at the midpoint between you, so standing right beside them on the side with more line puts that midpoint right next to them and hands you roughly **${Math.max(rivalPos, 100 - rivalPos)}%**.\n\n` +
        `The tempting answer is to take the far end and "own" it. That gives you only your own end and cedes everything else. The middle is not fair — it is where the pressure pushes.\n\n` +
        `Now run it forward: they will move next to you too, and you will both keep shuffling until you are both at 50. Two competitors on the same line end up **side by side in the middle**, which is not what either wanted and not good for customers at the ends.`,
    }
  },
)

const medianVoter = tpl(
  {
    id: 'gtl-median-voter',
    name: 'The one in the middle decides',
    skillIds: ['i-median'],
    bucket: 'investigator',
    difficulty: 3,
    variants: 24,
    minutes: 3,
  },
  (rng, seed) => {
    void seed
    const n = 7
    const prefs = Array.from({ length: n }, () => rint(rng, 0, 100)).sort((a, b) => a - b)
    const median = prefs[Math.floor(n / 2)]
    const mean = Math.round(prefs.reduce((a, b) => a + b, 0) / n)
    return {
      title: 'Seven people, one number',
      prompt:
        `Seven people must agree a single number between 0 and 100 — how much to spend, how strict a rule should be, anything on a line. Each prefers a particular value and dislikes any proposal in proportion to how far it sits from theirs.\n\n` +
        `Their preferred values are: **${prefs.join(', ')}**.\n\n` +
        `Proposals are voted on two at a time, and the winner faces the next challenger. Which value beats every other in a head-to-head vote?`,
      answer: numeric(median, { tolerance: 0 }),
      hints: [
        'Take any two proposals. Each person votes for whichever is nearer their own preferred value.',
        'Sort the seven preferences and think about who is in the middle of the list.',
        `Sorted, the middle one of the seven is ${median}. Any proposal above it loses to it, and so does any below.`,
      ],
      explanation:
        `**${median}** — the middle preference, not the average.\n\n` +
        `Against any proposal higher than ${median}, the four people at or below ${median} all prefer ${median}, and four of seven is a majority. The same argument runs downwards. So ${median} beats everything.\n\n` +
        `The average here is ${mean}, and it has no such property. **The person in the middle decides, and how strongly anyone feels does not enter into it** — which is why a majority-rule process ignores intensity, and why two competitors chasing the same crowd converge on whoever is in the middle of it.\n\n` +
        `Worth knowing where this stops: it needs preferences to sit on a single line with each person having one favourite. Add a second dimension and the whole result collapses.`,
    }
  },
)

const MEDIAN_APPLY = [
  {
    scene:
      'Two candidates for a school position start with very different platforms. By the week of the vote their pitches sound almost identical, and people complain that there is no real choice.',
    correct: 'Each moved toward the middle because that is where the deciding voters were',
    wrong: [
      'They both discovered that their original positions were unpopular with everybody',
      'They copied each other because neither had confidence in their own ideas',
      'They were told to tone it down by whoever was organising the election',
      'It is a coincidence — two sensible people often arrive at similar conclusions',
    ],
    why: 'Convergence is what the process produces, not evidence about the candidates. Anyone stopping short of the middle is beaten by someone who goes past them, so both are pushed there whatever they privately think. The complaint about "no real choice" is a fair description of a real cost.',
  },
  {
    scene:
      'A group is picking a start time. Most want 10am, two want 8am and feel very strongly, and two want noon and do not much mind.',
    correct: 'A straight vote lands on 10am and takes no account of how strongly the 8am pair feel',
    wrong: [
      'A straight vote lands somewhere near 10am, which balances the strength of everyone\'s feelings',
      'A straight vote lands at 9am, since it splits the difference between the extremes',
      'A straight vote cannot settle this, since three different times are wanted',
      'A straight vote lands at 8am, since the people who feel strongest will argue hardest',
    ],
    why: 'The middle wins and intensity is invisible to it. That is not an argument against voting — it is a reason to notice when a decision needs something else, like asking who genuinely cannot make a time rather than who would prefer not to.',
  },
  {
    scene:
      'Two rival cafés on the same street both move, over a few months, until they are almost next door to each other at the busiest point.',
    correct: 'Each move was sensible, and the quiet end is served worse than before',
    wrong: [
      'They must have found that the busiest point has room for both of them',
      'One followed the other, so only the second one was behaving strategically',
      'It is bad business for both, since being adjacent splits the same customers',
      'Rents must be cheaper at that particular point, which is what really drove both of the moves',
    ],
    why: 'Both ends up worse off than a spread-out arrangement and neither could have done anything else — a move toward the rival always gained share. Note the third option: adjacency does not split the same customers, it wins the larger side, which is exactly why the move is irresistible.',
  },
]

const medianApply = tpl(
  {
    id: 'gtl-median-apply',
    name: 'Pushed to the middle',
    skillIds: ['i-median'],
    bucket: 'investigator',
    difficulty: 4,
    variants: MEDIAN_APPLY.length,
    minutes: 2.5,
    transfer: true,
  },
  (rng, seed) => {
    const c = MEDIAN_APPLY[((seed % MEDIAN_APPLY.length) + MEDIAN_APPLY.length) % MEDIAN_APPLY.length]
    return {
      title: 'Why did they end up there?',
      prompt: `${c.scene}\n\nWhat is going on?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Ask what happens to anyone who stops short of the middle while the other keeps moving.',
        'The outcome may be bad for everyone and still be what each individual step produced.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**\n\n${c.why}\n\nThe rule: **when people choose the nearest option, competitors are pushed together at the middle, and the middle is decided by whoever sits there — not by who cares most.**`,
    }
  },
)

// ============================================================ i-credible
// A threat you would not carry out is not a threat.

const THREAT_STORIES = [
  { who: 'a shop', threat: 'to match any price cut, however deep', setting: 'a rival is deciding whether to open nearby' },
  { who: 'a group member', threat: 'to do none of the work if their section is changed', setting: 'the group is deciding how to split it' },
  { who: 'a club', threat: 'to cancel the whole trip if fewer than everyone signs up', setting: 'members are deciding whether to commit' },
  { who: 'a seller', threat: 'to walk away rather than take a penny less', setting: 'a buyer is deciding what to offer' },
] as const

const credibleEntry = tpl(
  {
    id: 'gtl-credible-entry',
    name: 'Would they actually do it?',
    skillIds: ['i-credible'],
    bucket: 'investigator',
    difficulty: 2,
    variants: 16,
    minutes: 2,
  },
  (rng, seed) => {
    const s = THREAT_STORIES[seed % THREAT_STORIES.length]
    // Their payoff from carrying out the threat vs backing down, once called.
    const carryOut = rint(rng, 1, 3)
    const backDown = carryOut + rint(rng, 2, 5)
    return {
      title: 'Called on it',
      prompt:
        `${cap(s.setting)}. ${cap(s.who)} threatens **${s.threat}**.\n\n` +
        `Suppose the threat gets called — the other side goes ahead anyway. At that moment:\n\n` +
        `- Carrying out the threat leaves ${s.who} with **${carryOut}**.\n` +
        `- Quietly not carrying it out leaves them with **${backDown}**.\n\n` +
        `Is the threat credible?`,
      answer: mcq(rng, `No — once it is called, they do better by not carrying it out`, [
        `Yes — they said it publicly, so backing down would cost them their reputation`,
        `Yes — the threat only works if they mean it, and they clearly do mean it`,
        `No — but only because the numbers happen to be close together here`,
        `It cannot be judged without knowing what the other side would get`,
      ]),
      hints: [
        'Do not ask whether they mean it now. Ask what they would actually do at the moment of truth.',
        `Compare ${carryOut} against ${backDown} from their point of view, once the threat has been called.`,
        `${backDown} is larger, so carrying it out would hurt them more than letting it go.`,
      ],
      explanation:
        `**No.** Once it is called, carrying out the threat leaves them with ${carryOut} and quietly dropping it leaves them with ${backDown}. They will drop it.\n\n` +
        `And because the other side can work that out too, the threat does not even change what they do. **A threat that would hurt the threatener to carry out is not a threat — it is an announcement.**\n\n` +
        `This is why the useful move is not making threats more frightening but making them harder to back out of: a public commitment, a signed rule, a bridge burned. That is the difference between saying you will and not being able not to.`,
      commonErrors: {
        misread: 'Judging a threat by how firmly it is stated rather than by what happens at the moment it would be carried out.',
      },
    }
  },
)

const credibleFix = tpl(
  {
    id: 'gtl-credible-fix',
    name: 'Making it stick',
    skillIds: ['i-credible'],
    bucket: 'investigator',
    difficulty: 3,
    variants: 4,
    minutes: 2.5,
  },
  (rng, seed) => {
    const CASES = [
      {
        scene: 'You have told your group you will not do anyone else\'s section this time. Last time you said the same thing and then did it anyway at midnight.',
        correct: 'Agree the split in writing at the start, with each name against a section',
        wrong: [
          'Say it more firmly this time, and explain that you really mean it now',
          'Warn them earlier in the week so they have time to plan around it',
          'Do a smaller share of the extra work, so the point is made without a fight',
          'Say nothing and simply do not do it when the time comes',
        ],
        why: 'Your problem is a track record, and nothing said more firmly fixes that. A written split changes what happens at midnight: the section has somebody\'s name on it and the cost of it being unfinished lands visibly on them. Note the last option gets the outcome and teaches nobody anything, which is why it fails as a strategy rather than as an action.',
      },
      {
        scene: 'A shop wants rivals to believe it will match any price cut. Rivals suspect matching would cost the shop more than it is worth.',
        correct: 'Publish a written promise to refund the difference to anyone who finds it cheaper',
        wrong: [
          'Announce loudly and often that any cut will be matched immediately',
          'Cut the prices pre-emptively, so that rivals can see there is nothing to be gained by entering',
          'Match one rival\'s cut very publicly and hope the message spreads to others',
          'Keep the policy vague, so rivals cannot work out what would happen',
        ],
        why: 'A public refund promise hands the enforcement to customers and makes NOT matching the expensive option — the threat becomes automatic rather than chosen. Cutting pre-emptively pays the whole cost now to avoid a cost that might never come, and vagueness removes the only thing that makes a threat work: the other side being able to predict it.',
      },
      {
        scene: 'You want a friend to believe you will leave at nine, having stayed past midnight every previous time.',
        correct: 'Arrange something at half past nine that you would have to cancel in front of them',
        wrong: [
          'Tell them at the start of the evening that tonight you are definitely leaving at nine',
          'Set an alarm for nine so that you are reminded when the time comes',
          'Leave at nine this once, so that next time they will believe you',
          'Ask them to remind you at nine and to hold you to it',
        ],
        why: 'The arrangement makes staying costly to YOU, which is what a commitment is. An alarm and a reminder both leave the decision exactly where it was — with you, at nine, wanting to stay. The third option genuinely works and is slower: it buys credibility by spending an evening, which is the honest price of having no commitment device.',
      },
      {
        scene: 'A club says the trip is cancelled unless everyone signs up, but everyone knows it has run with two missing before.',
        correct: 'Set a real deadline with a deposit that is genuinely non-refundable after it',
        wrong: [
          'Repeat the all-or-nothing rule more clearly in the next announcement',
          'Explain to members why it is important that everybody comes along',
          'Cancel this year\'s trip to prove the rule is real for future years',
          'Reduce the threshold to something the club could actually stick to',
        ],
        why: 'A deposit changes the arithmetic at the deadline for both sides. The last option is worth pausing on: lowering a threat to something you would actually carry out IS a real fix and often the best one — it is listed as wrong only because it abandons the stated goal rather than making it credible.',
      },
    ]
    const c = CASES[((seed % CASES.length) + CASES.length) % CASES.length]
    return {
      title: 'From announcement to commitment',
      prompt: `${c.scene}\n\nWhat actually makes it credible?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Saying it harder changes nothing. Ask what would have to change about the MOMENT it would be carried out.',
        'A commitment works by removing your own option to back down, not by strengthening your intention.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**\n\n${c.why}\n\nThe rule: **credibility comes from having fewer options, not more.** Anything that leaves you free to change your mind at the moment of truth leaves the other side free to ignore you.`,
    }
  },
)

const CREDIBLE_APPLY = [
  {
    scene:
      'Someone says that if you do not reply within the hour the offer is gone. The offer has been available for a fortnight.',
    correct: 'The deadline is an announcement, since nothing stops them accepting later',
    wrong: [
      'The deadline is real, since they have stated it explicitly and clearly',
      'The deadline is probably real but worth testing by replying slightly late',
      'The deadline cannot be judged without knowing how many other people want it',
      'The deadline is real if this is the first time they have set one',
    ],
    why: 'Ask what happens to THEM at 61 minutes. Nothing does, so nothing enforces it. This is the everyday version of the same test, and it is the most common manufactured-urgency move there is — which is why recognising it is defensive rather than clever.',
  },
  {
    scene:
      'A friend says they will stop lending things to people who return them late. They have said this three times and lent again each time.',
    correct: 'The rule is not credible, and everybody involved already knows that',
    wrong: [
      'The rule will work this time, since three warnings is more than anyone deserves',
      'The rule was never needed, since people generally return things eventually',
      'The rule would work if they explained the reason behind it more clearly',
      'The rule is unfair, since it punishes lateness rather than fixing the cause',
    ],
    why: 'A threat repeated and dropped teaches its own unreliability, and each repetition makes it weaker. The honest fixes are the boring ones: lend only what you can lose, or ask for something back as security — both change what happens rather than what is said.',
  },
  {
    scene:
      'A group is deciding where to eat. One person says they genuinely cannot eat at the first place; another says they would really rather not.',
    correct: 'Only the first of the two changes what the group should actually do',
    wrong: [
      'Both should count, since a strong preference is as real as a restriction',
      'Neither of them should count, since either could be exaggerating for effect',
      'Both should count equally, since the group cannot verify either claim',
      'The second should count more, since they are being more reasonable about it',
    ],
    why: 'A constraint and a preference behave differently even though they sound alike — and this is the same distinction as a credible threat versus a stated one, applied kindly rather than adversarially. The second option is the cynical reading and it costs the group the person who actually cannot go.',
  },
]

const credibleApply = tpl(
  {
    id: 'gtl-credible-apply',
    name: 'Announcement or commitment?',
    skillIds: ['i-credible'],
    bucket: 'investigator',
    difficulty: 4,
    variants: CREDIBLE_APPLY.length,
    minutes: 2.5,
    transfer: true,
  },
  (rng, seed) => {
    const c = CREDIBLE_APPLY[((seed % CREDIBLE_APPLY.length) + CREDIBLE_APPLY.length) % CREDIBLE_APPLY.length]
    return {
      title: 'Test it at the moment of truth',
      prompt: `${c.scene}\n\nWhat should you conclude?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Ask what actually happens to the person making the claim if it gets called.',
        'If nothing does, the claim is not doing any work whatever it costs to say.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**\n\n${c.why}\n\nThe rule: **test a threat, a deadline or a promise by asking what happens to the person making it at the moment it would bind.** If the answer is "nothing", it is an announcement.`,
    }
  },
)

// ============================================================ i-fairness
// The offer theory predicts, and the offer that works.

const SPLIT_STORIES = [
  { pot: 'twenty pounds of prize money', a: 'you', b: 'the other entrant' },
  { pot: 'a hundred raffle tickets', a: 'you', b: 'your partner in the draw' },
  { pot: 'sixty minutes of studio time', a: 'you', b: 'the other band' },
  { pot: 'forty pounds from a joint sale', a: 'you', b: 'the person who helped' },
] as const

const fairnessEntry = tpl(
  {
    id: 'gtl-fair-entry',
    name: 'Take it or leave it',
    skillIds: ['i-fairness'],
    bucket: 'investigator',
    difficulty: 2,
    variants: 10,
    minutes: 2.5,
  },
  (rng, seed) => {
    const s = SPLIT_STORIES[seed % SPLIT_STORIES.length]
    const total = pick(rng, [20, 40, 60, 100])
    const lowOffer = Math.round(total * 0.1)
    return {
      title: 'Something beats nothing',
      prompt:
        `You and ${s.b} must divide ${s.pot} — call it ${total} units. **You propose a split; they either accept it or reject it. If they reject, you both get nothing.** There is no second round.\n\n` +
        `You offer them **${lowOffer}** and keep ${total - lowOffer}.\n\n` +
        `A purely self-interested person on the other side compares ${lowOffer} against 0 and accepts. What actually happens in experiments?`,
      answer: mcq(rng, `An offer that small is rejected about half the time, and more often as it shrinks`, [
        `It is accepted almost always, exactly as the reasoning predicts it should be`,
        `It is rejected almost always, since nobody accepts an obviously unfair split`,
        `It depends entirely on the total, since people care about the amount not the share`,
        `It is accepted only when the two people already know each other well`,
      ]),
      hints: [
        'The prediction rests on the other person caring only about their own total.',
        'Rejecting costs them something real. Ask what they get in exchange for paying that.',
        'Across many experiments, offers around 40-50% are the norm and very low offers are frequently refused.',
      ],
      explanation:
        `About half the time, an offer that small is turned down — and rejection rates climb as the offer falls further.\n\n` +
        `Proposers know this, and offers in these experiments cluster around **40-50%**, not at the minimum.\n\n` +
        `Two things are worth taking from this and neither is "people are irrational". First, the person rejecting is paying real money to refuse an insult, so something other than the total is in the payoff — and a model that leaves it out predicts the wrong thing. Second, and more useful: **the split that actually gets accepted is nowhere near the split the arithmetic points at.** If you are ever tempted to reason your way to an offer somebody has to swallow, this is the experiment that says they will not.`,
    }
  },
)

const fairnessExpected = tpl(
  {
    id: 'gtl-fair-expected',
    name: 'The offer that actually pays best',
    skillIds: ['i-fairness'],
    bucket: 'investigator',
    difficulty: 4,
    variants: 4,
    minutes: 3.5,
    calibration: true,
  },
  (rng, seed) => {
    const s = SPLIT_STORIES[seed % SPLIT_STORIES.length]
    const total = 100
    // Acceptance probabilities in the shape the experimental record has.
    const options = [10, 20, 30, 40, 50]
    const accept = [0.15, 0.5, 0.8, 0.95, 0.99]
    const ev = options.map((o, i) => Math.round((total - o) * accept[i]))
    const bestIdx = ev.indexOf(Math.max(...ev))
    void rint(rng, 0, 1)
    void seed
    return {
      title: 'Work out which offer wins',
      prompt:
        `Same one-shot split of ${s.pot} — call it ${total} units. You propose, they accept or you both get nothing.\n\n` +
        `From the experimental record, roughly how often each offer is accepted:\n\n` +
        `| you offer | they accept | you keep if accepted |\n| --- | --- | --- |\n` +
        options.map((o, i) => `| ${o} | ${Math.round(accept[i] * 100)}% | ${total - o} |`).join('\n') +
        `\n\nWhich offer leaves you with the most **on average**?`,
      answer: mcq(rng, `Offer ${options[bestIdx]} — it averages about ${ev[bestIdx]}`, [
        `Offer ${options[0]} — it averages about ${ev[0]}`,
        `Offer ${options[1]} — it averages about ${ev[1]}`,
        `Offer ${options[options.length - 1]} — it averages about ${ev[ev.length - 1]}`,
        `They all come out about the same once the rejections are counted`,
      ]),
      hints: [
        'For each row, multiply what you keep by the chance they accept it.',
        `Offering ${options[0]} keeps you ${total - options[0]} but only ${Math.round(accept[0] * 100)}% of the time: ${ev[0]}.`,
        `Run every row and compare: ${ev.join(', ')}.`,
      ],
      explanation:
        `Offering **${options[bestIdx]}** averages about **${ev[bestIdx]}**, which beats every other row: ${options.map((o, i) => `${o}→${ev[i]}`).join(', ')}.\n\n` +
        `The greedy offer is not the best offer, and not because of fairness — because of arithmetic. A large share of a deal that usually collapses is worth less than a fair share of one that usually holds.\n\n` +
        `That is the practical form of the ultimatum result, and it survives being cynical: even a person who cared about nothing but their own total should offer close to half here. Note also what makes offering everything wrong — pushing past the point where acceptance is near-certain buys nothing and costs the difference.`,
    }
  },
)

const FAIR_APPLY = [
  {
    scene:
      'You are dividing a shared job with someone who has no way to refuse — they have to do whatever you leave them.',
    correct: 'The ultimatum result does not apply, and that is exactly when to watch yourself',
    wrong: [
      'Offer them close to half anyway, since that is what the experiments say works',
      'Take the larger share, since there is no rejection risk to price in here',
      'Offer slightly more than half, to make up for them not having a choice',
      'The situation is identical, since they can still refuse informally by doing it badly',
    ],
    why: 'Everything in this skill is about what happens when the other side CAN say no. Remove that and the arithmetic stops arguing for fairness — which means anything fair you do here comes from you, not from the incentives. Naming that is more useful than pretending the model still covers it.',
  },
  {
    scene:
      'A first offer in a negotiation comes in far below what you expected, and the other side says it is their final one.',
    correct: 'Two separate questions: is the offer worth taking, and is "final" doing any work',
    wrong: [
      'Reject it, since accepting a lowball offer encourages more of them next time',
      'Accept it, since something is better than nothing and they have said it is final',
      'Counter with the mirror image of their offer, so the midpoint lands where you want',
      'Ask them to justify the number before deciding anything about it',
    ],
    why: 'The two questions get tangled and they are separate. "Final" is a credibility claim to test the usual way — what happens to them if you say no? — and the offer is worth what it is worth regardless. Note that rejecting to send a message is a real strategy and only works when there IS a next time.',
  },
  {
    scene:
      'You and a friend must split an odd number of identical sweets, and neither of you can divide one.',
    correct: 'Nothing clever applies — agree a way to settle the last one and move on',
    wrong: [
      'Whoever proposes the split should take the extra one as a proposer\'s advantage',
      'Neither should take it, since an unequal split is what causes the argument',
      'Work out who values sweets more and give the extra one to them',
      'Take turns proposing until one of you accepts the other\'s split',
    ],
    why: 'This is the version where the machinery earns nothing. A coin settles it in two seconds; the strategic answers all cost more attention than the sweet is worth. Knowing when a situation is too small for the tools is part of having them.',
  },
]

const fairApply = tpl(
  {
    id: 'gtl-fair-apply',
    name: 'When can they say no?',
    skillIds: ['i-fairness'],
    bucket: 'investigator',
    difficulty: 4,
    variants: FAIR_APPLY.length,
    minutes: 2.5,
    transfer: true,
  },
  (rng, seed) => {
    const c = FAIR_APPLY[((seed % FAIR_APPLY.length) + FAIR_APPLY.length) % FAIR_APPLY.length]
    return {
      title: 'Does the result apply here?',
      prompt: `${c.scene}\n\nWhat is the right read?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'The whole result depends on the other side being able to walk away. Check whether they can.',
        'Two questions that feel like one: what is this worth, and is their claim credible?',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**\n\n${c.why}`,
    }
  },
)

// ============================================================ i-trust
// Why strangers cooperate, and what keeps them doing it.

const trustEntry = tpl(
  {
    id: 'gtl-trust-entry',
    name: 'Sending it across',
    skillIds: ['i-trust'],
    bucket: 'investigator',
    difficulty: 2,
    variants: 9,
    minutes: 3,
  },
  (_rng, seed) => {
    const STARTS = [10, 20, 30]
    const MULTS = [2, 3, 4]
    const start = STARTS[seed % STARTS.length]
    const mult = MULTS[Math.floor(seed / STARTS.length) % MULTS.length]
    // The word and the number have to agree. They did not: the prompt said
    // "tripled" while the arithmetic used whichever multiplier the seed chose,
    // so a learner reading the question carefully would compute a different
    // answer from the key. Caught by the independent check beside this file,
    // which re-derives from the RENDERED text — the whole reason it reads the
    // prompt rather than these variables.
    const multWord = ({ 2: 'doubled', 3: 'tripled', 4: 'quadrupled' } as const)[mult as 2 | 3 | 4]
    const send = Math.round(start / 2)
    const grown = send * mult
    return {
      title: 'It grows on the way',
      prompt:
        `Two strangers, no names exchanged, one round only. You both start with ${start} units.\n\n` +
        `You may send any part of yours to the other person. **Whatever you send is ${multWord} on the way.** They may then send back as much or as little as they like — and nothing forces them to send anything.\n\n` +
        `If you send **${send}** and they return half of what arrives, how much do you end up with?`,
      answer: numeric(start - send + grown / 2, { tolerance: 0 }),
      hints: [
        `You keep ${start} − ${send} = ${start - send}.`,
        `They receive ${send} × ${mult} = ${grown}.`,
        `Half of ${grown} comes back: ${start - send} + ${grown / 2} = ${start - send + grown / 2}.`,
      ],
      explanation:
        `${start} − ${send} = ${start - send} kept, plus half of ${grown} returned = **${start - send + grown / 2}**, against the ${start} you started with.\n\n` +
        `Working backwards, a purely self-interested second player returns nothing — there is no next round and no reputation at stake. Knowing that, a purely self-interested first player sends nothing, and both walk away with ${start} while ${grown} of value never gets created.\n\n` +
        `That is the prediction. In the original experiment of this shape, first players sent around half their stake on average and second players returned a substantial part of it. **The value only exists if somebody moves first without a guarantee** — which is what trust is for, and why a group that has it is simply richer than one that does not.`,
    }
  },
)

const trustPunish = tpl(
  {
    id: 'gtl-trust-punish',
    name: 'What holds it together',
    skillIds: ['i-trust'],
    bucket: 'investigator',
    difficulty: 3,
    variants: 9,
    minutes: 3,
    calibration: true,
  },
  (rng, seed) => {
    const SIZES = [4, 5, 6]
    const MULTS = [1.6, 2, 2.4]
    const n = SIZES[seed % SIZES.length]
    const stake = 20
    const mult = MULTS[Math.floor(seed / SIZES.length) % MULTS.length]
    const allIn = Math.round((stake * n * mult) / n)
    const freeRide = Math.round(stake + (stake * (n - 1) * mult) / n)
    return {
      title: 'Everyone puts in, everyone shares',
      prompt:
        `${n} people each hold ${stake} units. Each secretly chooses how much to put into a shared pot. **The pot is multiplied by ${mult} and split equally between all ${n}, whatever anyone put in.**\n\n` +
        `- If everyone puts in everything, each ends with **${allIn}**.\n` +
        `- If three put in everything and one puts in nothing, that one ends with **${freeRide}**.\n\n` +
        `Which statements are true?`,
      answer: multi(
        rng,
        [
          `Holding back is individually better whatever the others do`,
          `Everyone reasoning that way leaves all four with ${stake}, worse than the ${allIn} they could have had`,
          `A way for the group to punish holding back, at a cost to the punisher, changes what people do`,
        ],
        [
          `Holding back is only better if at least one other person also holds back`,
          `The group ends up at ${allIn} anyway, since cooperating is obviously best for everyone`,
          `Punishment cannot help, because punishing costs the punisher and gains them nothing`,
        ],
      ),
      hints: [
        `Compare ${freeRide} against ${allIn}: the free rider does better than a full contributor.`,
        'Now ask what happens when all four notice that at the same time.',
        'The third true statement is an experimental finding, not something the arithmetic predicts.',
      ],
      explanation:
        `Holding back pays whatever the others do — you keep your own stake and still take a quarter of everyone else\'s. So all four hold back, and all four end on ${stake} instead of ${allIn}. The arithmetic argues everyone into a worse outcome, with nobody behaving badly.\n\n` +
        `The third statement is the interesting one, because pure self-interest says it is impossible: punishing costs the punisher and the benefit goes to everybody. In Fehr and Gächter's experiments (2000) that option was made available anyway — and cooperation rose to near-complete levels and stayed there, where selfish reasoning predicts none at all.\n\n` +
        `**What holds a group together is not that people are nice, and not that free-riding stops paying. It is that somebody is willing to pay to enforce the norm.** Which is also why the fixes that work are visible ones a group agrees to in the open, rather than private irritation.`,
    }
  },
)

const TRUST_APPLY = [
  {
    scene:
      'You are lending something to someone you will probably never deal with again, and there is no way to enforce getting it back.',
    correct: 'Lend only what you can afford to lose, and treat the return as a gift rather than a debt',
    wrong: [
      'Lend it, since most people return things and the odds are on your side',
      'Refuse, since a one-off with no enforcement is the exact case where trust fails',
      'Lend it but make clear you expect it back, so the social pressure does the work',
      'Ask someone who knows them whether they are reliable before deciding',
    ],
    why: 'Everything that normally sustains trust — repetition, reputation, enforcement — is absent, so the honest move is to size the risk rather than to reason your way to confidence. The third option is worth noting: social pressure only works when there is a shared group to apply it, which is precisely what a one-off stranger lacks.',
  },
  {
    scene:
      'A shared kitchen is left in a mess. A few people clean up after everyone; most do nothing; nobody says anything.',
    correct: 'The quiet cleaners are subsidising it, and silence is what lets that continue',
    wrong: [
      'The cleaners should stop, since carrying it is what allows the mess to continue',
      'The mess-makers are being selfish and should be told so individually',
      'A rota would fix it, since the problem is that nobody knows whose turn it is',
      'Nothing can be done — shared spaces are always like this in the end',
    ],
    why: 'Enforcement is missing, not information — a rota helps when people are confused and not when they are free-riding. The first option is tempting and makes everyone worse off in the short run without changing anything; what changes it is somebody being willing to make the norm visible and pay a little social cost to do it.',
  },
  {
    scene:
      'You are the first person asked to contribute to something where nobody can see what anyone else gives.',
    correct: 'What you do sets what people expect, so contribute as if it were visible',
    wrong: [
      'Give less than you would if it were visible, since nobody can tell either way',
      'Give more than you would, to compensate for the people who will give nothing',
      'Wait to see what others give before deciding what your own share should be',
      'It makes no difference what you give, since your share is a small part of the total',
    ],
    why: 'Being first is the whole situation: contributions in these settings track what people believe others are doing, so a first move that nobody sees still shapes the total through whoever it is reported to. Waiting is the move that collapses the whole thing if everyone makes it.',
  },
]

const trustApply = tpl(
  {
    id: 'gtl-trust-apply',
    name: 'What is actually holding this up?',
    skillIds: ['i-trust'],
    bucket: 'investigator',
    difficulty: 4,
    variants: TRUST_APPLY.length,
    minutes: 2.5,
    transfer: true,
  },
  (rng, seed) => {
    const c = TRUST_APPLY[((seed % TRUST_APPLY.length) + TRUST_APPLY.length) % TRUST_APPLY.length]
    return {
      title: 'Repetition, reputation, enforcement',
      prompt: `${c.scene}\n\nWhat is the honest read?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Three things normally sustain cooperation: it happens again, others find out, and somebody enforces. Check which are present.',
        'When all three are missing, the answer is to size the risk rather than to reason yourself into confidence.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**\n\n${c.why}\n\nThe rule: **cooperation is held up by repetition, reputation and enforcement — so when one goes missing, look for what is replacing it before relying on it.**`,
    }
  },
)

export const GAME_LAB_TEMPLATES: ItemTemplate[] = [
  levelkEntry,
  levelkBeauty,
  levelkApply,
  mixedEntry,
  mixedSolve,
  mixedApply,
  medianEntry,
  medianVoter,
  medianApply,
  credibleEntry,
  credibleFix,
  credibleApply,
  fairnessEntry,
  fairnessExpected,
  fairApply,
  trustEntry,
  trustPunish,
  trustApply,
]
