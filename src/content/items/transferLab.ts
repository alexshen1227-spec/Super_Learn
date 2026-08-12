/**
 * Transfer Lab — three new Meta Lab skills plus six more case-comparison sets.
 *
 * The problem all of this exists to attack is Ross (1984): over 80% of
 * spontaneous remindings are driven by SURFACE similarity, so a principle the
 * learner already owns sits inert the moment the cover story changes. Knowing
 * a method and noticing that it applies are different abilities, and only the
 * second one is what "transfer" means.
 *
 *   `x-transfer`   — noticing when a method applies. The Ross design is used
 *                    directly: the distractors are surface-matched (same
 *                    setting, same nouns, same subject) and the key is
 *                    structure-matched with an unrelated cover story, so a
 *                    learner reading for topic words scores at chance.
 *   `x-interleave` — mixing practice on purpose, INCLUDING its boundary
 *                    conditions. Rohrer, Dedrick & Burgess (2014) is the
 *                    strongest classroom result (delayed test 72% interleaved
 *                    vs 38% blocked, grade 7); Taylor & Rohrer (2010) and
 *                    Sana & Yan (2022) agree on direction. But the pooled
 *                    effect is g = 0.29 after trim-and-fill with I² = 77.3%
 *                    (RESEARCH.md §3), and Sorensen & Woltz (2016) found
 *                    BLOCKED exposure better during initial category
 *                    induction. Two of the six schedule cases therefore have
 *                    "blocked" as the correct answer, and one distractor in
 *                    those cases is the overgeneralisation itself ("mixing
 *                    always beats blocking"). An item bank whose answer is
 *                    always "interleave" would teach a slogan.
 *   `x-desirable`  — desirable difficulties, with the distortion named. Per
 *                    RESEARCH.md §12 the myth is "difficulty is good because
 *                    it hurts": Bjork's desirable difficulties are SPECIFIC
 *                    (retrieval, spacing, generation, interleaving), and a
 *                    broken tool or a noisy room is difficulty that buys
 *                    nothing. The three-way `classify` exists because a
 *                    two-way sort cannot separate "just harder" from "harder
 *                    now, better later", which is the whole confusion.
 *
 * The six case-comparison templates reuse the shape from `caseComparison.ts`
 * (compare → name the structure → apply it to a third cover story) because
 * that is the mechanism with the best controlled evidence behind it: Gentner,
 * Loewenstein & Thompson (2003, J. Educ. Psych. 95(2)) found .59 vs .22
 * transfer for comparison against studying the same two cases separately, with
 * an active control holding content constant, and guided comparison beat a
 * bare "compare these" 90% to 70%. What that study licenses is transfer to a
 * structurally similar NEW CASE, in students, at delays up to about a week.
 * It licenses nothing about general intelligence, and nothing in this file
 * claims otherwise. Structures here are new: regression to the mean, sunk
 * cost, base-rate neglect, second-order effects, the contrapositive check, and
 * the fluency illusion — the trade-off, selection-effect and outside-view sets
 * already live in `caseComparison.ts`.
 *
 * Deliberately absent: learning styles, brain training, memory-athlete claims,
 * and any suggestion that this work raises general ability. Simons et al.
 * (2016, PSPI 17(3)), Melby-Lervåg, Redick & Hulme (2016, PPS 11(4)) and
 * Sala & Gobet (2017) on chess all report no advantage over active controls,
 * and RESEARCH.md §12 lists them as rejected.
 */
import type { ItemPart, ItemTemplate } from '../../domain/types'
import { classify, cycle, draft, mcq, tpl } from '../lib'
import type { Rng } from '../../engine/rng'

// =====================================================================
// x-transfer — noticing when a method applies
// =====================================================================

/**
 * Entry point for the whole unit (difficulty 2). Before a learner can be
 * reminded by structure, they have to be able to SEE the difference between a
 * detail that could change with no consequence and a feature the method rests
 * on. The sort is deliberately concrete: one problem, already solved, and
 * eight of its features.
 */
interface FeatureCase {
  problem: string
  method: string
  /** Change these and the method is untouched. */
  surface: string[]
  /** Change these and a different method is needed. */
  structure: string[]
  why: string
}

const FEATURE_CASES: FeatureCase[] = [
  {
    problem:
      'Two taps fill a tank. On its own, tap A fills it in 6 hours and tap B in 4 hours. Both are opened at once. How long until the tank is full?',
    method: 'Add the rates — 1/6 of a tank an hour plus 1/4 — then turn the total back into a time.',
    surface: [
      'It is water into a tank rather than paint onto a wall',
      'The tank holds 300 litres',
      'Tap A happens to be the slower of the two',
      'The answer is wanted in hours rather than in minutes',
    ],
    structure: [
      'Both taps are open for the whole of the time',
      'The tank starts completely empty',
      'Neither tap is draining the tank while the other fills it',
      'Each tap runs at a steady rate the whole way through',
    ],
    why: 'Rates only add up when they act together, in the same direction, on the same starting point, without changing.',
  },
  {
    problem: 'A coat costs £68 after a 15% discount. What was its price before the discount?',
    method: 'The sale price is 85% of the original, so divide by 0.85.',
    surface: [
      'The item is a coat rather than a bicycle',
      'The discount happens to be 15% rather than some other figure',
      'The prices are quoted in pounds',
      'The shop is running a January sale',
    ],
    structure: [
      'The £68 is the price AFTER the change, not before it',
      'The 15% was taken off the original price, not off £68',
      'Only one discount was applied, not two one after the other',
      'The reduction is a percentage rather than a fixed sum off',
    ],
    why: 'Every step of the method depends on which number the percentage was taken FROM. The coat, the currency and the month never enter it.',
  },
  {
    problem:
      'One printer charges a £15 setup fee plus 20p a poster. Another charges no setup fee and 45p a poster. At how many posters do the two cost the same?',
    method: 'Write each total as a starting amount plus a rate times the count, then set the two equal.',
    surface: [
      'The things being counted are posters',
      'The setup fee happens to be £15',
      'Both firms are in the same town',
      'The costs are quoted in pounds and pence',
    ],
    structure: [
      'One option carries a fixed cost that the other does not',
      'Each option adds the same amount for every extra poster',
      'The two totals are being set equal to one another',
      'Neither price drops once you order a large number',
    ],
    why: 'A bulk discount, or a fee on both sides, would need a different setup. The word "poster" would not.',
  },
  {
    problem:
      'A bag holds 5 red and 3 blue counters. Two are drawn without putting the first one back. What is the chance both are red?',
    method: 'Multiply 5/8 by 4/7 — the second draw is taken from what is actually left.',
    surface: [
      'The objects are counters rather than playing cards',
      'The two colours are red and blue',
      'The counters are drawn by hand rather than by a machine',
      'The question asks about red rather than about blue',
    ],
    structure: [
      'The first counter is not put back before the second draw',
      'Both draws have to succeed, so the two chances multiply',
      'The counters are identical apart from colour, so each is equally likely',
      'Exactly two counters are drawn, not three',
    ],
    why: 'Replacing the counter changes 4/7 back to 5/8, and that single word changes the method. The colours could be anything.',
  },
  {
    problem: 'A 5 m ladder rests against a wall with its foot 1.4 m from the base. How far up the wall does it reach?',
    method: 'The wall and ground meet at a right angle, so the two shorter sides square and add to 25.',
    surface: [
      'The leaning object is a ladder rather than a ramp',
      'The lengths are given in metres',
      'The wall belongs to a house',
      'The ladder is described as aluminium',
    ],
    structure: [
      'The wall meets the ground at a right angle',
      'The ladder is the side opposite that right angle',
      'The ladder is straight rather than bending under weight',
      'Two of the three lengths are known and one is not',
    ],
    why: 'Take away the right angle and the whole method goes with it. Take away the aluminium and nothing happens.',
  },
  {
    problem: 'Pond weed covers 3 m² and its area multiplies by 1.4 every week. In which week does it pass 30 m²?',
    method: 'Starting amount times the growth factor raised to the number of weeks.',
    surface: [
      'The growing thing is pond weed rather than money',
      'The area is measured in square metres',
      'The pond is in a public park',
      'The threshold asked about happens to be 30',
    ],
    structure: [
      'The area is multiplied each week, not increased by a fixed amount',
      'The same factor applies in every single week',
      'The starting amount is known',
      'Nothing is removing weed while it grows',
    ],
    why: 'Multiplied each week and increased by a fixed amount each week are two different methods that look almost identical in words.',
  },
]

const surfaceOrStructure = tpl(
  {
    id: 'xt-surface-or-structure',
    name: 'Surface detail or structural feature?',
    skillIds: ['x-transfer'],
    bucket: 'meta',
    difficulty: 2,
    variants: FEATURE_CASES.length,
    minutes: 3,
    calibration: true,
  },
  (rng, seed) => {
    const c = cycle(seed, FEATURE_CASES)
    return {
      title: 'What is the story, and what is the method?',
      prompt: `**Problem.** ${c.problem}\n\n**How it is solved.** ${c.method}\n\nSort each feature below. Ask one question about each: if this changed, would you still solve it the same way?`,
      answer: classify(
        rng,
        ['Change it, method stays', 'Change it, method changes'],
        [
          ...c.surface.map((text) => ({ text, category: 0 })),
          ...c.structure.map((text) => ({ text, category: 1 })),
        ],
      ),
      hints: [
        'Take one feature at a time and imagine it different. Does the working change, or only the wording?',
        'Names, materials, units, currencies and places almost never change a method. What is being done to what usually does.',
        `The four that matter are the ones the working leans on: ${c.why}`,
      ],
      explanation: `The method rests on: ${c.structure.join('; ')}. Everything else is the story. ${c.why} This is worth practising on its own because remindings mostly arrive by surface: people are reminded of the last problem about ladders, not the last problem with a right angle in it. Sorting features deliberately is how you get reminded by the right thing.`,
    }
  },
)

/**
 * The Ross (1984) design, run straight. Three candidates share the new
 * problem's SETTING and use different methods; one shares its METHOD and has
 * an unrelated cover story. Reading for topic words scores at chance, which is
 * exactly the failure the item exists to expose.
 *
 * Within a case, all four candidates keep the same genre — four calculations
 * or four arguments — because a lone reasoning option among three sums could
 * be picked on shape without reading a word.
 */
interface SameSolutionCase {
  problem: string
  /** Same structure, different cover story. */
  key: string
  /** Same cover story, different structure. */
  decoys: string[]
  structure: string
  why: string
}

const SAME_SOLUTION_CASES: SameSolutionCase[] = [
  {
    problem:
      'A poster shop charges a £15 setup fee then 20p a poster. A rival charges no setup fee but 45p a poster. At how many posters do the two cost the same?',
    key: 'A plant stands 15 cm tall and grows 0.2 cm a day; a seedling starts at nothing and grows 0.45 cm a day',
    decoys: [
      'A run of 60 posters was quoted at £27, so what would a run of 100 identical posters cost at that rate?',
      'A poster is £1.02 after a 15% discount has been taken off it, so what was the price before the sale?',
      'One press prints 12 posters a minute and another prints 8, so how long would the two together take to do 300?',
    ],
    structure: 'a starting amount plus a steady rate, on both sides, set equal',
    why: 'The plant problem has the same two lines: one starts ahead and gains slowly, the other starts at nothing and gains fast. The three poster problems are a proportion, a reverse percentage and a combined rate — same nouns, three different methods.',
  },
  {
    problem:
      'A café gives a free pastry with 1 coffee in 6, at random. Yusuf buys four coffees. What is the chance he gets at least one pastry?',
    key: 'A seed germinates with probability 1/4, so what is the chance that at least one of eight planted comes up?',
    decoys: [
      'The café sells 3 cup sizes and 4 different syrups, so how many distinct drinks can a customer order?',
      'A coffee is £2.80 after a 30% staff discount has been applied, so what does it cost a member of the public?',
      'Of 40 customers, 25 bought coffee and 18 bought cake and 9 bought both, so how many bought neither of them?',
    ],
    structure: '"at least one" answered as 1 minus the chance of none',
    why: 'Both the coffees and the seeds ask for at least one success out of several independent tries, which is one clean calculation only when you flip it to "none". The other café problems are counting, reverse percentage and overlapping groups.',
  },
  {
    problem: 'After a 15% fare rise, a bus pass costs £46. What did the pass cost before the rise?',
    key: 'A reservoir is 8% fuller than it was last month and now holds 54 million litres, so what did it hold then?',
    decoys: [
      'A bus pass costs £46 and a single fare £2.30, so after how many single journeys does the pass pay for itself?',
      'Bus fares rose 15% in March and then 15% again in June, so what was the total rise across the whole year?',
      'A bus covers 46 km in 50 minutes on its usual route, so what is its average speed in kilometres per hour?',
    ],
    structure: 'a known amount AFTER a percentage change, divided back to recover the amount before',
    why: 'The reservoir gives the figure after the change and asks for the one before it, which is the same division. The other transport problems are a break-even, two successive percentages and a rate conversion.',
  },
  {
    problem:
      'A fitness app says 92% of members who answered its survey feel fitter. Every member was emailed, and 12% answered.',
    key: 'A town counts injuries at a junction, finds almost none involving cyclists, and calls the junction cycle-safe',
    decoys: [
      'The app’s users all got fitter over the year, but a comparison group who used nothing improved by nearly as much',
      'The app’s advert says that members lose weight fast, without ever saying how fast, or faster than what exactly',
      'The app’s founder says that the plan works because it matches the way the human body evolved to move about',
    ],
    structure: 'a group filtered by something connected to the outcome, read as if it were everyone',
    why: 'Cyclists who avoid the junction never appear in its injury figures, exactly as members who felt no fitter mostly never answered. The other three are a missing comparison, an unfalsifiable claim and an appeal to how things evolved — all real faults, none of them this one.',
  },
  {
    problem:
      'A coach shouts at the crew after their slowest row of the season. The next week they are faster, and he concludes that shouting works.',
    key: 'A clinic gives a supplement to the patients whose blood-pressure readings were highest, and theirs fall',
    decoys: [
      'The crew wins more races at home than away, and the coach credits the home crowd rather than the travel',
      'A rower has finished in the top three six times running, so a pundit says a poor result must now be due',
      'Two rowers have the same average finishing time, so the coach treats the two as equally dependable',
    ],
    structure: 'a group picked BECAUSE it was extreme, whose next measurement moves back on its own',
    why: 'Both groups were selected for being at an extreme, and extremes contain luck that does not repeat, so the next reading drifts back whether or not anything was done. The other three are a confound, the gambler’s fallacy and ignoring spread.',
  },
  {
    problem: 'A library plans a 50p-a-day fine on overdue books so that books come back faster.',
    key: 'A city plans to widen its busiest road so that the queue on it every morning gets shorter',
    decoys: [
      'A library counts how many readers use its study room by asking the people sitting in the study room',
      'A library’s busiest month last year was March, so it books extra staff for every month resembling March',
      'A library has spent £2,000 on a catalogue nobody likes, and keeps it because of the £2,000 spent',
    ],
    structure: 'a change whose own effect on behaviour works against what it was meant to do',
    why: 'A wider road attracts drivers who were avoiding it, and a fine that grows daily gives an already-late reader a reason to keep the book. In both, the response to the change eats the change. The others are a filtered count, one month treated as a rule, and money already spent.',
  },
]

const sameSolution = tpl(
  {
    id: 'xt-same-solution',
    name: 'Which one is worked out the same way?',
    skillIds: ['x-transfer'],
    bucket: 'meta',
    difficulty: 3,
    variants: SAME_SOLUTION_CASES.length,
    minutes: 3,
    transfer: true,
    calibration: true,
  },
  (rng, seed) => {
    const c = cycle(seed, SAME_SOLUTION_CASES)
    return {
      title: 'Same method, different story',
      prompt: `**New problem.** ${c.problem}\n\nOne of the four below is worked out in the same way as it. Which one?`,
      answer: mcq(rng, c.key, [...c.decoys]),
      hints: [
        'Three of the four are about the same things as the new problem. That is not a reason to pick any of them.',
        'Cross out every noun in all five texts. Describe what is left: what is known, what changes, what is being asked for.',
        `The method underneath is ${c.structure}. Find the option that has it.`,
      ],
      explanation: `The match is: ${c.key}. ${c.why}\n\nThe reason this is hard is measurable rather than personal — when people are asked what an old problem reminds them of, over 80% of the remindings come from shared surface details rather than shared method. So the three options that share the subject are not badly written traps; they are what your memory actually offers first.`,
    }
  },
)

/**
 * The same discrimination, asked the other way round. Instead of naming the
 * matching case, the learner is given four ideas — each tagged with the kind
 * of case people usually meet it in — and must pick the one whose STRUCTURE
 * fits, when three of the four tags match the scenario's subject.
 *
 * The tags are honest: they say where an idea usually comes up, not that this
 * learner has met that exact problem before. The app must never depend on what
 * happened outside it.
 */
interface PrincipleCase {
  scenario: string
  key: string
  decoys: string[]
  why: string
}

const PRINCIPLE_CASES: PrincipleCase[] = [
  {
    scenario:
      'A school finds that students who eat breakfast in its canteen get better grades, and plans to make canteen breakfast free for everyone.',
    key: 'Tide gauges — which readings exist can depend on the very thing being measured',
    decoys: [
      'Exam marking — an average can hide a very wide spread of individual results',
      'School timetables — a change that helps one class can quietly cost another one',
      'Homework clubs — a small group swings far more week to week than a big one does',
    ],
    why: 'The students who already choose canteen breakfast differ from the rest in other ways — money, routine, how far they live — and those differences also move grades. Making it free reaches a different group, so the 92%-style figure need not follow. Spread, side effects and small samples are all real ideas; none of them is what is wrong here.',
  },
  {
    scenario:
      'A rare condition affects 1 patient in 800. A ward’s screening test misses nobody, but it also flags 3 healthy patients in every 100. One patient has just been flagged.',
    key: 'Airport scanners — when nearly every bag is harmless, most alarms are harmless too',
    decoys: [
      'Ward rotas — two nurses with the same average workload can have very different weeks',
      'Drug trials — the patients who volunteer are not the same as the ones who did not',
      'Patient surveys — the people who reply are those who felt strongly enough to reply',
    ],
    why: 'Out of 800 patients about 1 is ill and about 24 healthy ones are flagged, so a flag is mostly a false alarm. The rarity of the condition does the work, and the ward setting of the other three options is the only thing recommending them.',
  },
  {
    scenario:
      'A band has spent eight months and most of its savings on an album that nobody in the band still likes. They are carrying on because of the eight months.',
    key: 'Roadworks — money already poured into a tunnel is not recovered by finishing it',
    decoys: [
      'Setlists — the song the band enjoys most is not always the song a room enjoys most',
      'Rehearsals — practising one song for hours feels smoother than switching between three',
      'Recording — the first take often sets what everyone expects the rest to sound like',
    ],
    why: 'The eight months are gone under either choice, so they cannot favour either one. The only live question is what the next month buys. The other three ideas are all about music and all irrelevant to that.',
  },
  {
    scenario:
      'A supermarket plans to open a tenth checkout so that the five o’clock queue gets shorter, and expects the same shoppers to arrive at the same times.',
    key: 'Motorways — an extra lane can pull in the drivers who were avoiding the road',
    decoys: [
      'Stock control — the shelf that empties fastest is not always the most profitable one',
      'Loyalty cards — the shoppers who sign up were already the ones shopping most often',
      'Price labels — the first figure a shopper sees sets what later counts as a bargain',
    ],
    why: 'Shoppers who currently avoid five o’clock because of the queue will start coming at five o’clock, which is how the queue rebuilds. The plan assumes behaviour holds still while changing the thing that behaviour responds to.',
  },
  {
    scenario:
      'A farmer gives extra feed to the six hens that laid worst last month. This month those six lay better than they did, and he credits the feed.',
    key: 'Weather stations — the hottest day of a decade is rarely followed by another one',
    decoys: [
      'Crop trials — a field given more sun as well as more fertiliser settles nothing at all',
      'Milk yields — two herds with the same average can differ hugely from cow to cow',
      'Egg counts — a single week is a small sample, so any two weeks will differ a bit',
    ],
    why: 'The six were chosen for being at an extreme, and a bad month is part real and part luck; the luck does not repeat, so the next month rises on its own. The egg-count option is the nearest miss: noise alone says the numbers wobble in either direction, while picking the worst makes the direction of the wobble almost certain.',
  },
  {
    scenario:
      'A student rereads her chemistry notes four times. By the fourth pass everything on the page feels completely familiar, so she stops revising.',
    key: 'Road signs — you have passed one a thousand times and still cannot draw it',
    decoys: [
      'Revision timetables — a plan that looks balanced on paper can be impossible to run',
      'Group study — the loudest person in the group is not the one who knows the most',
      'Past papers — one paper is a small sample of everything a syllabus could ask you',
    ],
    why: 'Recognising something and being able to produce it are different operations, and rereading trains only the first. A blank page is the only honest check. The other three are real study problems, and all three are about studying, which is the only reason they look right.',
  },
]

const whichPrinciple = tpl(
  {
    id: 'xt-which-principle',
    name: 'Which idea fits this situation?',
    skillIds: ['x-transfer'],
    bucket: 'meta',
    difficulty: 3,
    variants: PRINCIPLE_CASES.length,
    minutes: 3,
    calibration: true,
  },
  (rng, seed) => {
    const c = cycle(seed, PRINCIPLE_CASES)
    return {
      title: 'Four ideas, one that fits',
      prompt: `**Situation.** ${c.scenario}\n\nFour ideas below, each tagged with the kind of case it usually comes up in. Which one describes what is going on here?`,
      answer: mcq(rng, c.key, [...c.decoys]),
      hints: [
        'The tag in front of each idea says where people usually meet it. It is not evidence that it fits here.',
        'Read past the tag to the idea itself, then check that idea against the situation word by word.',
        'Three of the four tags come from the same world as the situation. Expect the fit to be somewhere else.',
      ],
      explanation: `The idea that fits is: ${c.key}. ${c.why}`,
    }
  },
)

/**
 * Four problems, two of which share a method. The surface groups them one way
 * and the structure another, so the answer disagrees with the first grouping
 * that comes to mind. Options are generated from the stored pair indices, so
 * the key cannot drift away from the data.
 */
interface PairCase {
  problems: string[]
  /** One-indexed positions of the two problems that share a method. */
  pair: [number, number]
  /** Surface-matched pairs, offered as distractors. */
  decoyPairs: [number, number][]
  structure: string
  why: string
}

const pairLabel = (p: [number, number]): string => `Problems ${p[0]} and ${p[1]}`

const PAIR_CASES: PairCase[] = [
  {
    problems: [
      'A bakery’s flour bill is £92 after a 20% supplier discount. What was the bill before it?',
      'A bakery sold 40 loaves on Monday and 55 on Tuesday. By what percentage did sales rise?',
      'A bakery buys 12 kg of flour for £9.60. What would 30 kg cost at exactly the same rate?',
      'A glacier is 6% shorter than a decade ago and now measures 4.7 km. How long was it then?',
    ],
    pair: [1, 4],
    decoyPairs: [
      [1, 2],
      [1, 3],
      [2, 3],
    ],
    structure: 'an amount known AFTER a percentage change, divided back to find the amount before',
    why: 'Both give the figure after a percentage change and ask for the one before it, so both divide. Problem 2 is a percentage change forward, and problem 3 is a proportion — three bakeries and three different methods.',
  },
  {
    problems: [
      'Two hoses fill a paddling pool. Alone they would take 30 and 45 minutes. How long together?',
      'A hose delivers 14 litres a minute. How long does it take to fill a 350-litre paddling pool?',
      'Two proofreaders working alone would take 9 hours and 6 hours. How long working together?',
      'A pool loses 3% of its water a day to evaporation. How much is left after five hot days?',
    ],
    pair: [1, 3],
    decoyPairs: [
      [1, 2],
      [1, 4],
      [2, 4],
    ],
    structure: 'two steady rates working at once, added together and turned back into a time',
    why: 'Hoses and proofreaders both add two rates and invert. Problem 2 is one division, and problem 4 is repeated multiplication — all three of the water problems look alike and only one of them matches.',
  },
  {
    problems: [
      'A vending machine holds 6 snacks and 4 drinks. How many ways can one of each be chosen?',
      'A vending machine jams on 1 purchase in 12. Over 5 purchases, what is the chance of a jam?',
      'A vending machine takes £1.20 a snack and holds £54 at closing. How many snacks were sold?',
      'A tent has 8 pegs, each with a 1-in-15 chance of pulling out overnight. Chance any pulls out?',
    ],
    pair: [2, 4],
    decoyPairs: [
      [1, 2],
      [2, 3],
      [1, 3],
    ],
    structure: '"at least one" turned round into 1 minus the chance that none of them happens',
    why: 'Jams and tent pegs both ask for at least one out of several independent tries, which is one calculation once you flip it to "none". Problem 1 multiplies choices and problem 3 divides — same machine, different work.',
  },
  {
    problems: [
      'A gaming site asks its own subscribers whether the subscription is worth it. 94% say yes.',
      'A game sold far more copies after a price cut, and the studio credits its new cover artwork.',
      'A studio spent three years on a game nobody enjoys, and ships it because of the three years.',
      'A charity measures how many people its helpline reaches by asking the people who call it.',
    ],
    pair: [1, 4],
    decoyPairs: [
      [1, 2],
      [2, 3],
      [1, 3],
    ],
    structure: 'a group filtered by the very thing being asked about, then read as if it were everyone',
    why: 'People who stopped subscribing are not subscribers any more, and people the helpline never reached do not call it, so both groups were filtered before anyone counted. Problem 2 is a confound and problem 3 is money already spent.',
  },
  {
    problems: [
      'A tutor takes on the five pupils with the worst mock grades. Their next grades are better.',
      'A tutor’s pupils all improved this term, but so did the pupils of every other tutor in town.',
      'A tutor says longer sessions work better, and only ever offers the longer kind of session.',
      'A factory services the machines with the worst output that week. Next week they run better.',
    ],
    pair: [1, 4],
    decoyPairs: [
      [1, 2],
      [1, 3],
      [2, 3],
    ],
    structure: 'a group chosen for being at an extreme, whose next measurement moves back on its own',
    why: 'Worst pupils and worst machines were both picked for being at an extreme, and extremes contain luck that does not repeat. Problem 2 has no comparison group and problem 3 never gathers the evidence that would test it.',
  },
  {
    problems: [
      'A city plans a charge for driving into the centre, and expects the same drivers to pay it.',
      'A city counts cyclists at one junction on one sunny Tuesday and plans the whole year on it.',
      'A city has spent £2m on a car park nobody uses, and finishes it because of the £2m spent.',
      'A shop pays a bonus to its fastest checkout staff and expects service quality to hold up.',
    ],
    pair: [1, 4],
    decoyPairs: [
      [1, 2],
      [2, 3],
      [1, 3],
    ],
    structure: 'a rule that changes the behaviour it was aimed at, so the behaviour undoes the rule',
    why: 'Drivers switch route or mode rather than pay, and staff hurry rather than serve well, so in both the response to the rule eats what the rule was for. Problem 2 is a tiny sample and problem 3 is money already gone.',
  },
]

const pairUp = tpl(
  {
    id: 'xt-pair-up',
    name: 'Which two are solved the same way?',
    skillIds: ['x-transfer'],
    bucket: 'meta',
    difficulty: 3,
    variants: PAIR_CASES.length,
    minutes: 3.5,
    transfer: true,
  },
  (rng, seed) => {
    const c = cycle(seed, PAIR_CASES)
    const listed = c.problems.map((p, i) => `**${i + 1}.** ${p}`).join('\n')
    return {
      title: 'Sort by method, not by subject',
      prompt: `Four problems. Exactly two of them are solved in the same way.\n\n${listed}\n\nWhich two?`,
      answer: mcq(
        rng,
        pairLabel(c.pair),
        c.decoyPairs.map(pairLabel),
      ),
      hints: [
        'Three of these four share a subject. Subject is not method.',
        'For each one write a single line with no nouns in it: what is given, what is wanted, what happens in between.',
        `Two of those lines will match. The method they share is ${c.structure}.`,
      ],
      explanation: `${pairLabel(c.pair)}. ${c.why}\n\nGrouping by subject is the default, and it is the default because most remindings arrive by surface. Writing the noun-free line is the cheap fix: it takes ten seconds and it is the only version of the problem that can match anything.`,
    }
  },
)

// =====================================================================
// x-interleave — mixing practice on purpose
// =====================================================================

/**
 * Two schedules, two questions, two different answers — which is the entire
 * point. Blocked practice reliably produces better performance DURING
 * acquisition; the mixed schedule wins the delayed mixed test. If the item
 * asked only one of those, it would teach half a fact.
 *
 * Two of the six cases have "blocked" as the delayed-test answer, because the
 * conditions the evidence identifies (confusable categories, a delay, a mixed
 * test, and acquisition already under way) are genuinely absent in them. One
 * distractor in those cases is the overgeneralisation, worded as a learner
 * would word it.
 */
interface ScheduleCase {
  goal: string
  blocked: string
  mixed: string
  duringKey: string
  duringDecoys: string[]
  duringWhy: string
  laterKey: string
  laterDecoys: string[]
  laterWhy: string
}

const SCHEDULE_CASES: ScheduleCase[] = [
  {
    goal: 'Volumes of prisms, cylinders and cones. The test is in two weeks and mixes all three without saying which is which.',
    blocked: 'Twelve prism questions, then twelve cylinder questions, then twelve cone questions.',
    mixed: 'The same thirty-six questions, shuffled so the type changes almost every time.',
    duringKey: 'Blocked — more right answers during the session, and it feels smoother',
    duringDecoys: [
      'Mixed — the variety holds attention, so more goes right during the session',
      'Blocked — fewer right answers during the session, but noticeably less effort',
      'The same — both sessions contain exactly the same thirty-six questions',
    ],
    duringWhy:
      'In a block you already know the formula before you read the question, so the only work left is arithmetic.',
    laterKey: 'Mixed — the three are easy to confuse and the test mixes them',
    laterDecoys: [
      'Blocked — more uninterrupted repetitions of each of the three formulas',
      'Whichever felt smoother in the session, since that is what got learned',
      'Neither — the two sessions contained the same thirty-six questions',
    ],
    laterWhy:
      'The test never announces the shape, so choosing the formula is part of the work — and only the mixed session ever rehearses choosing. In the closest classroom experiment to this, a delayed test after mixed practice ran 72% against 38% for blocked.',
  },
  {
    goal: 'A Spanish vocabulary quiz tomorrow morning, covering the food list only. The weather and travel lists are not on it.',
    blocked: 'Forty minutes on the food list, then a short break, then ten minutes more on it.',
    mixed: 'Fifty minutes shuffled across the food, weather and travel lists together.',
    duringKey: 'Blocked — more right answers during the session, and it feels smoother',
    duringDecoys: [
      'Mixed — the variety holds attention, so more goes right during the session',
      'Blocked — fewer right answers during the session, but noticeably less effort',
      'The same — both sessions contain exactly the same fifty minutes of work',
    ],
    duringWhy: 'Switching lists costs a moment each time, and two of the three lists are not being tested at all.',
    laterKey: 'Blocked — the quiz is tomorrow and covers the food list only',
    laterDecoys: [
      'Mixed — mixing beats blocking on any test that comes afterwards',
      'Mixed — practice that felt harder always produces the better result',
      'Neither — both sessions contain the same fifty minutes of work',
    ],
    laterWhy:
      'Mixing pays when several confusable things have to be told apart on a delayed test that mixes them. Here there is one list, one night, and no confusion to resolve, so two-thirds of a mixed session would be spent on material the quiz never asks about. The two "mixed" answers are the overgeneralisation, and it is worth being able to spot: difficulty is not useful because it is difficult.',
  },
  {
    goal: 'A method for solving two-step equations, taught for the first time this morning. Homework is tonight; the unit test is in a month.',
    blocked: 'Fifteen two-step equations in a row, all of the same shape, worked slowly.',
    mixed: 'Five two-step equations shuffled among ten problems of other kinds from the term.',
    duringKey: 'Blocked — more right answers during the session, and it feels smoother',
    duringDecoys: [
      'Mixed — the variety holds attention, so more goes right during the session',
      'Blocked — fewer right answers during the session, but noticeably less effort',
      'The same — both sessions contain fifteen problems either way',
    ],
    duringWhy: 'A method met four hours ago is not yet reliable enough to be interrupted every other question.',
    laterKey: 'Blocked — the method is hours old and not yet reliable on its own',
    laterDecoys: [
      'Mixed — mixing beats blocking on absolutely any test that comes afterwards',
      'Mixed — the unit test is a whole month away, so it counts as a delayed test',
      'Neither — both of the sessions contain fifteen problems either way',
    ],
    laterWhy:
      'Mixing helps AFTER a method is reliable enough to run. While a category is first being formed, seeing examples of it together is what makes the category; one experiment on verbal categories found blocked exposure beat interleaving at exactly that stage. Tonight the method needs to become executable; next week it needs mixing.',
  },
  {
    goal: 'Three tennis strokes — forehand, backhand and volley. A match in a month, where shots arrive in no particular order.',
    blocked: 'Forty forehands, then forty backhands, then forty volleys, fed by a machine.',
    mixed: 'One hundred and twenty shots fed in an order the player cannot predict.',
    duringKey: 'Blocked — more clean shots during the session, and it feels smoother',
    duringDecoys: [
      'Mixed — the unpredictability holds attention, so more goes right in the session',
      'Blocked — fewer clean shots during the session, but noticeably less effort',
      'The same — both sessions feed exactly one hundred and twenty shots',
    ],
    duringWhy: 'When every ball comes to the same wing you can set your feet before it is fed, which is most of the shot.',
    laterKey: 'Mixed — in a match the stroke has to be chosen before it is played',
    laterDecoys: [
      'Blocked — more uninterrupted repetitions of each of the three strokes',
      'Whichever felt smoother in the session, since that is what got learned',
      'Neither — both sessions feed the same hundred and twenty shots',
    ],
    laterWhy:
      'A blocked feed removes the hardest part of the match — reading the ball and picking the stroke — and then never puts it back. This mirrors the classroom result rather than repeating it: the mixed-practice work in sport is a separate literature, so treat this as the same reasoning applied, not as the same finding.',
  },
  {
    goal: 'Three reaction types in chemistry that students routinely mistake for one another. The unit test is in ten days and covers all three.',
    blocked: 'Ten questions on the first type, then ten on the second, then ten on the third.',
    mixed: 'The same thirty questions, shuffled so the type changes without warning.',
    duringKey: 'Blocked — more right answers during the session, and it feels smoother',
    duringDecoys: [
      'Mixed — the variety holds attention, so more goes right during the session',
      'Blocked — fewer right answers during the session, but noticeably less effort',
      'The same — both sessions contain exactly the same thirty questions',
    ],
    duringWhy: 'Inside a block the type is given away by the heading, so nothing has to be told apart.',
    laterKey: 'Mixed — the three are routinely confused and the test mixes them',
    laterDecoys: [
      'Blocked — more uninterrupted repetitions of each of the three types',
      'Whichever felt smoother in the session, since that is what got learned',
      'Neither — both sessions contain exactly the same thirty questions',
    ],
    laterWhy:
      'The reported difficulty is telling the three apart, and a block is the one arrangement in which they never have to be told apart. Mixing puts the confusion into practice, where it is cheap, instead of into the test, where it is not.',
  },
  {
    goal: 'Three driving manoeuvres for a test in six weeks. The examiner asks for them in whatever order they choose.',
    blocked: 'A whole lesson on parallel parking, then a whole lesson on hill starts, then one on turning.',
    mixed: 'Three lessons that each move between all three manoeuvres several times.',
    duringKey: 'Blocked — more clean attempts in the lesson, and it feels smoother',
    duringDecoys: [
      'Mixed — the variety holds attention, so more goes right during the lesson',
      'Blocked — fewer clean attempts in the lesson, but noticeably less effort',
      'The same — both plans use exactly three lessons of the same length',
    ],
    duringWhy: 'Repeating one manoeuvre lets you carry the setup forward from the last attempt instead of rebuilding it.',
    laterKey: 'Mixed — on the day, the manoeuvre is named without any warning',
    laterDecoys: [
      'Blocked — more uninterrupted repetitions of each of the three manoeuvres',
      'Whichever felt smoother in the lessons, since that is what got learned',
      'Neither — both plans use exactly three lessons of the same length',
    ],
    laterWhy:
      'Six weeks is a real delay and the examiner supplies the mixing whether the lessons did or not. Practising in the arrangement the test uses is the cheapest form of realism there is.',
  },
]

const twoSchedules = tpl(
  {
    id: 'xi-two-schedules',
    name: 'Two practice schedules, two questions',
    skillIds: ['x-interleave'],
    bucket: 'meta',
    difficulty: 2,
    variants: SCHEDULE_CASES.length,
    minutes: 4,
    kind: 'multi',
  },
  (rng, seed) => {
    const c = cycle(seed, SCHEDULE_CASES)
    return {
      title: 'How it feels, and how it turns out',
      prompt: `**What is being practised.** ${c.goal}\n\nTwo ways to spend the same practice time on it. The two questions below have different answers, and that is the interesting part.`,
      hints: [
        'Answer the two questions separately. Do not let your answer to the first one decide the second.',
        'For the second question, check three things: how far away the test is, whether it mixes the types, and whether the types are easy to confuse.',
        'Mixing is not automatically better. When one of those three conditions is missing, it has nothing to buy.',
      ],
      explanation: `${c.duringWhy} ${c.laterWhy}`,
      parts: [
        {
          stage: 'During',
          study: `**Schedule A — blocked.** ${c.blocked}\n\n**Schedule B — mixed.** ${c.mixed}`,
          studySeconds: 45,
          prompt: 'First question: what happens during the practice session itself?',
          answer: mcq(rng, c.duringKey, [...c.duringDecoys]),
          explanation: `${c.duringWhy} This is not a side note — the fact that blocked practice performs better while you are doing it is exactly why people choose it, and why they trust the choice.`,
          hints: [
            'Ask what you already know at the moment you read each question inside a block.',
            'Performance during practice and learning that lasts are two different measurements.',
          ],
        },
        {
          stage: 'Later',
          prompt: 'Second question: which schedule does better on the test described above?',
          answer: mcq(rng, c.laterKey, [...c.laterDecoys]),
          explanation: `${c.laterKey}. ${c.laterWhy}`,
          hints: [
            'Reread the description of the test before choosing. When it happens and what it covers both matter.',
            'Ask what the test makes you do that only one of the two schedules ever rehearses.',
          ],
        },
      ],
    }
  },
)

interface TrainsCase {
  question: string
  key: string
  decoys: string[]
  why: string
}

const TRAINS_CASES: TrainsCase[] = [
  {
    question:
      'A student gets every question at the end of the chapter right, then loses most of the marks on the mixed review at the end of term. What does a mixed set practise that a blocked set does not?',
    key: 'Working out which method a question needs before running it',
    decoys: [
      'Running each of the methods faster once you know which one it is',
      'Remembering the formulas themselves for longer afterwards',
      'Reading questions more carefully than you would otherwise',
    ],
    why: 'Inside a chapter the method arrives with the page number. On a mixed paper it does not, and that missing step is the one that was never practised.',
  },
  {
    question: 'In a page of questions all of one type, what tells you the method before you have read a single word of the question?',
    key: 'The heading on the page, which has already chosen it for you',
    decoys: [
      'The first number in the question, which suits one of the methods',
      'The wording of the question, which usually names its own method',
      'Nothing does — the method still has to be worked out',
    ],
    why: 'That is the hidden cost of blocked practice. It is not that the questions are too easy; it is that one step has been silently removed from every one of them.',
  },
  {
    question:
      'A student tries a mixed set, gets far more wrong than usual, and concludes that mixing made them worse at the topic. What actually happened?',
    key: 'The task changed: choosing was added to executing',
    decoys: [
      'Their grasp of each method genuinely got weaker that day',
      'Mixing added enough new material to overload them',
      'The mixed questions were simply harder than the others',
    ],
    why: 'Nothing was lost. A harder task was measured. Judging a schedule by accuracy during the schedule is the mistake the whole idea is about.',
  },
  {
    question: 'Which test would show no advantage at all for a mixed practice schedule, even if the mixing had worked?',
    key: 'One taken straight afterwards, on a single type of problem',
    decoys: [
      'One taken a month afterwards, covering several problem types',
      'One taken a week afterwards, with the types in a new order',
      'One taken a month afterwards, on a single type of problem',
    ],
    why: 'No delay and no mixing means nothing for the mixed schedule to be better at. This is also why blocked practice keeps its reputation: end-of-chapter tests are exactly this shape.',
  },
  {
    question: 'Mixing helps most with a particular kind of material. Which kind?',
    key: 'Types that are genuinely easy to mistake for each other',
    decoys: [
      'Types that are difficult to carry out once they are identified',
      'Types that are new and have never once been seen before',
      'Types that come from completely different subjects',
    ],
    why: 'If two types can never be confused, telling them apart costs nothing and there is nothing for the mixing to train. This is why the benefit is conditional rather than universal.',
  },
  {
    question: 'Which of these does mixing practice NOT do?',
    key: 'Make any single one of the methods easier to carry out',
    decoys: [
      'Make it clearer which method a question is asking for',
      'Make practice feel worse while you are actually doing it',
      'Make later performance on a mixed test better than blocking',
    ],
    why: 'Execution is trained by doing the method. Mixing trains selection. Naming what it does not do keeps it from becoming a slogan applied to everything.',
  },
]

const whatItTrains = tpl(
  {
    id: 'xi-what-it-trains',
    name: 'What mixing actually trains',
    skillIds: ['x-interleave'],
    bucket: 'meta',
    difficulty: 3,
    variants: TRAINS_CASES.length,
    minutes: 2.5,
    calibration: true,
  },
  (rng, seed) => {
    const c = cycle(seed, TRAINS_CASES)
    return {
      title: 'Choosing, not executing',
      prompt: c.question,
      answer: mcq(rng, c.key, [...c.decoys]),
      hints: [
        'Split the work into two steps: deciding which method, then carrying it out. Which step does a block hand to you?',
        'A test only rewards a schedule for something the test actually asks for.',
        `The answer turns on this: ${c.why.split('.')[0]}.`,
      ],
      explanation: `${c.key}. ${c.why}`,
    }
  },
)

interface PlanCase {
  plan: string
  key: string
  decoys: string[]
  why: string
}

const PLAN_CASES: PlanCase[] = [
  {
    plan: 'A goalkeeping coach runs 20 minutes of shots to the bottom left, then 20 to the top right, then 20 straight at the keeper. The match is in three weeks, and shots arrive in no order.',
    key: 'Feed the three shot types in an order the keeper cannot predict',
    decoys: [
      'Add a fourth target corner so the session covers more of the goal',
      'Keep the three blocks but change their order every week',
      'Double the session so each of the three blocks lasts longer',
    ],
    why: 'Reordering blocks changes nothing inside a block: the keeper still knows where the next ball is going. Only unpredictable feeding rehearses the reading step, which is the part a match actually tests.',
  },
  {
    plan: 'A guitarist has a gig in a month and three chord changes that keep going wrong. She practises change one for ten minutes, then change two, then change three, every evening.',
    key: 'Shuffle the three changes through the whole ten-minute session',
    decoys: [
      'Practise the hardest of the three changes for the full time',
      'Keep the blocks and add a fourth change to the rotation',
      'Play the whole of the song through slowly instead of the changes',
    ],
    why: 'Three confusable moves and a month before they are needed in an unpredictable order is exactly the case where mixing pays. Playing the song through is useful for other reasons, but it does not target the changes.',
  },
  {
    plan: 'Someone is holding a chef’s knife properly for the first time this afternoon. They will cook for friends in five weeks. The tutor plans twenty minutes on the one grip.',
    key: 'Leave it blocked today — the grip is only minutes old',
    decoys: [
      'Mix the grip with two other knife skills from the start',
      'Shorten it to five minutes and move on to something else',
      'Mix in chopping speed drills to make the session harder',
    ],
    why: 'A skill still being formed needs to become reliable before it can be interrupted. Blocked exposure has been found better than interleaving at exactly this stage. Next week, with the grip reliable, mixing becomes the right call — the answer is about timing, not about which schedule is better in general.',
  },
  {
    plan: 'A trainee practises three bandage types for an assessment in five weeks, where the assessor names one at random. Each session covers one bandage from start to finish.',
    key: 'Have the three called out in a random order each session',
    decoys: [
      'Add a fourth bandage type to widen what the sessions cover',
      'Run the three sessions in a different order every week',
      'Spend the whole of every session on the hardest bandage',
    ],
    why: 'The assessment names the bandage without warning, so choosing it is part of the task. A session that announces the bandage never rehearses that, however many repetitions it contains.',
  },
  {
    plan: 'A chess player keeps losing one specific endgame. The club match is in two days and the endgame is the only weakness they know of.',
    key: 'Keep it blocked — one known weakness and two days left',
    decoys: [
      'Mix the endgame with two openings and a tactics set',
      'Mix in three unrelated endgames to make it feel harder',
      'Skip the endgame and play full games until the match',
    ],
    why: 'Mixing buys the ability to tell confusable things apart on a delayed test. There is one thing here and two days, so there is nothing to tell apart and no delay to survive. Worth being straight about: no study covers this exact case, so this is reasoning from the conditions the evidence identifies, not a finding.',
  },
  {
    plan: 'A juggler has a show in six weeks and three tricks that keep collapsing. Practice is one trick a night, cycling through the week.',
    key: 'Move between the three tricks several times each night',
    decoys: [
      'Keep one trick a night but add a fourth to the cycle',
      'Practise the trick that collapses most for the whole week',
      'Perform all three straight through, over and over, nightly',
    ],
    why: 'A whole night on one trick lets each attempt start from the last one. The show needs each trick started cold, from whatever came before it, which is what moving between them within a session rehearses.',
  },
]

const mixOrBlock = tpl(
  {
    id: 'xi-mix-or-block',
    name: 'Fix the practice plan',
    skillIds: ['x-interleave'],
    bucket: 'meta',
    difficulty: 3,
    variants: PLAN_CASES.length,
    minutes: 3,
    transfer: true,
  },
  (rng, seed) => {
    const c = cycle(seed, PLAN_CASES)
    return {
      title: 'One change to the plan',
      prompt: `**The plan as it stands.** ${c.plan}\n\nOne change would do the most for how this goes on the day. Which?`,
      answer: mcq(rng, c.key, [...c.decoys]),
      hints: [
        'Check three things before deciding: how far off the day is, whether the skills are easy to confuse, and whether they are reliable yet.',
        'If any of those three is missing, shuffling buys nothing and may cost something.',
        'Reordering blocks is not the same as shuffling within a session. Inside a block, the next repetition is still predictable.',
      ],
      explanation: `${c.key}. ${c.why}`,
    }
  },
)

// =====================================================================
// x-desirable — difficulty that helps
// =====================================================================

/**
 * A three-way sort, because a two-way one cannot express the actual idea.
 * "Harder" and "better" are not the same axis: retrieval, spacing, generation
 * and mixing cost effort AND pay it back; a noisy room or a broken tool costs
 * effort and pays nothing; rereading and highlighting cost little and pay
 * little. RESEARCH.md §12 lists "difficulty is good because it hurts" as a
 * distortion of Bjork's term, and this is the item that refuses it.
 */
interface EffortCase {
  setting: string
  /** Effortful AND productive. */
  useful: string[]
  /** Effortful and unproductive. */
  wasted: string[]
  /** Comfortable and unproductive. */
  fluent: string[]
}

const EFFORT_CASES: EffortCase[] = [
  {
    setting: 'A history test in two weeks. Six hours of study are available.',
    useful: [
      'Closing the book and writing down everything you can remember',
      'Splitting the six hours across two weeks instead of one long night',
    ],
    wasted: [
      'Working in a room with a television on behind you the whole time',
      'Revising from notes written so fast that half of them are unreadable',
    ],
    fluent: [
      'Reading the chapter a fourth time because it now feels familiar',
      'Highlighting most of the chapter in three different colours',
    ],
  },
  {
    setting: 'A maths unit test in ten days, covering three topics you keep mixing up.',
    useful: [
      'Trying the problem for two minutes before opening the worked solution',
      'Shuffling the three topics you keep confusing into one practice set',
    ],
    wasted: [
      'Practising on a site that logs you out every few minutes',
      'Starting at one in the morning after a full day of school',
    ],
    fluent: [
      'Copying the worked solutions out neatly into a fresh notebook',
      'Keeping the answer sheet open beside you while you work',
    ],
  },
  {
    setting: 'Learning twenty new words in another language, needed in three weeks.',
    useful: [
      'Covering the English side and saying the word before turning the card',
      'Returning to the same twenty words on day one, day three and day seven',
    ],
    wasted: [
      'Learning from a printout with half of the accents missing',
      'Studying on a bus where one hand has to hold on the whole way',
    ],
    fluent: [
      'Reading the whole vocabulary list aloud again because it flows now',
      'Watching a video of someone else translating the same sentences',
    ],
  },
  {
    setting: 'A biology exam in a month, including a diagram of a cycle with eight labels.',
    useful: [
      'Drawing the cycle from memory, then comparing it against the diagram',
      'Explaining the whole process out loud with the book shut',
    ],
    wasted: [
      'Revising with a pen that skips, so every line has to be written twice',
      'Working in a corridor where people keep stopping to talk to you',
    ],
    fluent: [
      'Looking at the labelled diagram until you would recognise it anywhere',
      'Colouring the diagram in neatly rather than labelling a blank one',
    ],
  },
  {
    setting: 'A piano piece to be performed in five weeks, with three bars that keep collapsing.',
    useful: [
      'Playing the piece from memory before opening the score again',
      'Practising the three hard bars on four separate days rather than one',
    ],
    wasted: [
      'Practising on a keyboard with two keys that no longer sound',
      'Practising at midnight so quietly you cannot hear your own mistakes',
    ],
    fluent: [
      'Listening to a recording of the piece instead of playing it',
      'Playing the easy sections again because they sound good',
    ],
  },
  {
    setting: 'Three weeks of revision before a set of exams, planned out in advance.',
    useful: [
      'Sitting a past paper under timed conditions before you feel ready',
      'Answering from a blank page before looking anything up',
    ],
    wasted: [
      'Revising in a room too cold to hold the pen steady',
      'Using a revision app that has lost most of your saved decks',
    ],
    fluent: [
      'Rereading the mark scheme rather than attempting the question',
      'Making the notes look neat rather than testing yourself on them',
    ],
  },
]

const sortTheEffort = tpl(
  {
    id: 'xd-sort-the-effort',
    name: 'Which effort is worth it?',
    skillIds: ['x-desirable'],
    bucket: 'meta',
    difficulty: 2,
    variants: EFFORT_CASES.length,
    minutes: 3.5,
  },
  (rng, seed) => {
    const c = cycle(seed, EFFORT_CASES)
    return {
      title: 'Three kinds of study, not two',
      prompt: `**The situation.** ${c.setting}\n\nSort each way of studying. Two questions decide it: does it cost real effort, and does the effort go into remembering the material?`,
      answer: classify(
        rng,
        ['Harder now, better later', 'Just harder', 'Easier and worse'],
        [
          ...c.useful.map((text) => ({ text, category: 0 })),
          ...c.wasted.map((text) => ({ text, category: 1 })),
          ...c.fluent.map((text) => ({ text, category: 2 })),
        ],
      ),
      hints: [
        'Ask where the effort goes. Into pulling the material out of your own head, or into fighting the room, the tool or your own tiredness?',
        'Then ask what the method makes you produce. Recognising a page is not the same as producing what is on it.',
        'The middle category is the one people miss. Effort spent on a broken pen is still effort, and it buys nothing at all.',
      ],
      explanation: `**Harder now, better later:** ${c.useful.join('; ')}. Each one makes you generate the material rather than look at it, or spreads the work out so some forgetting has to be undone — and the undoing is the part that lasts.\n\n**Just harder:** ${c.wasted.join('; ')}. Real effort, spent on the room, the tool or your own tiredness rather than on the material.\n\n**Easier and worse:** ${c.fluent.join('; ')}. Comfortable, and they mostly produce a feeling of knowing.\n\nThe distinction matters because the useful kind gets misquoted as "difficulty is good". It is not. The techniques with evidence behind them are specific — retrieval, spacing, generating before being told, mixing confusable types — and they happen to be hard. Being hard is a side effect, never the reason. One honest caveat: reading a worked solution is genuinely valuable when a method is brand new, so "read the answer first" belongs in the third pile only when you could have attempted the problem yourself.`,
    }
  },
)

interface FluencyCase {
  question: string
  key: string
  decoys: string[]
  why: string
}

const FLUENCY_CASES: FluencyCase[] = [
  {
    question:
      'Two students study the same chapter for the same hour. One rereads it and rates their learning 9 out of 10. The other self-tests, gets half wrong, and rates it 5 out of 10. Who is likely to score higher on a test next week?',
    key: 'The self-tester, whose low rating came from seeing what was missing',
    decoys: [
      'The rereader, because a high rating reflects material that went in',
      'Neither, because the two of them studied for the same length of time',
      'The rereader, because the self-tester spent the hour making mistakes',
    ],
    why: 'The ratings measure how the hour felt, and the hour that felt worse was the one that practised the thing the test asks for. Confidence formed during study is a poor guide to what will still be there later.',
  },
  {
    question: 'Rereading produces an unusually strong feeling of knowing. What is actually producing that feeling?',
    key: 'The text has become easy to process, and ease reads as knowledge',
    decoys: [
      'The material really has been stored more deeply than before',
      'The second pass fills in gaps that the first pass left behind',
      'Repetition of any kind builds memory, so that feeling is well earned',
    ],
    why: 'Familiarity with the page is real; it is just not the same thing as being able to produce what is on it. The feeling tracks how smoothly the words go by.',
  },
  {
    question: 'You finish studying and predict how much you will still know in a week. What is usually wrong with that prediction?',
    key: 'It is made while everything is still in mind, so it runs high',
    decoys: [
      'It is made too quickly to be based on anything but a guess',
      'It runs low, because finishing a session feels like hard work',
      'It is accurate on average, but varies a lot between people',
    ],
    why: 'The material is in front of you and in your head at the same moment, so the prediction is made under the easiest possible conditions and then applied to the hardest ones.',
  },
  {
    question: 'Which check gives the most honest reading of what you will actually remember?',
    key: 'A blank page a day or more later, with nothing open beside you',
    decoys: [
      'A quick reread of the notes to see whether it all looks familiar',
      'A multiple-choice quiz taken right at the end of the session',
      'A rating out of ten written down as soon as you stop studying',
    ],
    why: 'Delay and a blank page remove both crutches: the material is no longer in mind, and nothing on the page can be recognised instead of recalled.',
  },
  {
    question:
      'A student abandons a mixed practice set after one session because they got more wrong than usual. What is the flaw in that reasoning?',
    key: 'Accuracy during practice is not the outcome being aimed at',
    decoys: [
      'One session is too short to judge any study method fairly',
      'The mixed set was probably harder than the blocked one was',
      'They should have compared the two sets on the very same day',
    ],
    why: 'The measurement that matters happens later, on a test. Judging a method by how it feels while you use it is the same error as trusting a high confidence rating.',
  },
  {
    question: 'Highlighting feels productive while you do it. What is it mostly producing?',
    key: 'A decision about what matters, made while reading it',
    decoys: [
      'A stronger memory of the sentences that were marked out',
      'A summary that can be revised from later on much faster',
      'Nothing at all, since marking text has no effect whatever',
    ],
    why: 'Deciding what is important is a real act, but it happens once and it does not make you produce anything. In reviews of study techniques highlighting sits near the bottom, and the last option overstates it in the other direction.',
  },
]

const fluencyIllusion = tpl(
  {
    id: 'xd-fluency-illusion',
    name: 'The feeling of learning',
    skillIds: ['x-desirable', 'x-calib'],
    bucket: 'meta',
    difficulty: 3,
    variants: FLUENCY_CASES.length,
    minutes: 2.5,
    calibration: true,
  },
  (rng, seed) => {
    const c = cycle(seed, FLUENCY_CASES)
    return {
      title: 'Smooth is not the same as learned',
      prompt: c.question,
      answer: mcq(rng, c.key, [...c.decoys]),
      hints: [
        'Separate two things that usually travel together: how the studying felt, and what you could produce cold a week later.',
        'Ask what the method makes you generate. If the answer is "nothing", the good feeling came from somewhere else.',
        'The method that feels most productive is often the one producing least, and that is measurable rather than a matter of taste.',
      ],
      explanation: `${c.key}. ${c.why} This is why the app asks for an attempt before showing anything, and why it compares your confidence ratings against your actual results instead of taking either one on its own.`,
    }
  },
)

interface RepairCase {
  situation: string
  key: string
  decoys: string[]
  why: string
}

const REPAIR_CASES: RepairCase[] = [
  {
    situation: 'Flashcards, flipped after about two seconds each. Two hundred cards go by in fifteen minutes and almost all of them feel known.',
    key: 'Wait until you have actually produced the answer, however slow',
    decoys: [
      'Increase the pace so that more cards can be covered per session',
      'Add another hundred cards so the deck covers the whole topic',
      'Read both sides of each card aloud to make the session harder',
    ],
    why: 'Two seconds is enough to recognise the answer and not enough to retrieve it. The change costs time and adds the one thing the deck was missing; the third option adds effort that produces nothing.',
  },
  {
    situation: 'Study happens on an app that crashes every few minutes and loses your place, so about a third of each session is spent finding where you were.',
    key: 'Replace the tool — this difficulty buys nothing at all',
    decoys: [
      'Keep it, since working around the crashes adds useful effort',
      'Keep it but study for longer to make up the lost third',
      'Keep it and write everything down on paper as a backup too',
    ],
    why: 'This is the case that separates the two kinds of hard. Effort spent recovering from a crash is not effort spent remembering anything, and "harder" on its own was never the goal.',
  },
  {
    situation: 'Every evening ends by rereading the day’s lecture notes from top to bottom. The notes are good and the rereading feels like it is working.',
    key: 'Close the notes and write what you remember, then check',
    decoys: [
      'Reread them twice each evening instead of only once',
      'Rewrite the notes more neatly so they are easier to reread',
      'Read them aloud rather than silently to keep attention up',
    ],
    why: 'All four take about the same time. Only one of them makes you produce the material from your own head, and producing it is what the exam will ask for.',
  },
  {
    situation: 'Twenty practice problems are worked in a row, all of the same type, the night before a test that also covers two similar types.',
    key: 'Shuffle them with the two types you keep confusing',
    decoys: [
      'Work through forty of the same type instead of twenty',
      'Time yourself so that each problem must be done faster',
      'Do the twenty standing up so the session feels harder',
    ],
    why: 'The test mixes three confusable types, so choosing between them is part of it, and a block of one type never rehearses choosing. The other three add effort or volume without adding that step.',
  },
  {
    situation: 'Four hours of study for a test, all of it on the night before. The test is two weeks away, and the four hours are the only ones available.',
    key: 'Split it across four evenings spread over the two weeks',
    decoys: [
      'Keep it as one block but move it to the night before the test',
      'Keep it as one block and start much earlier in the evening',
      'Split it into two evenings, both in the last two days',
    ],
    why: 'The same four hours, spread out, means some forgetting has happened before each session and has to be undone — which is where the durability comes from. Spacing is one of the most consistently supported findings in the literature, though for mathematical procedures specifically the picture is weaker than for verbal material.',
  },
  {
    situation: 'Practice happens with the worked answer open on the desk beside the problems, so a glance settles anything that stalls for more than a moment.',
    key: 'Cover it, attempt properly, and uncover it after a real try',
    decoys: [
      'Keep it open — checking each step prevents learning it wrong',
      'Close it entirely and never look, however long you are stuck',
      'Copy the worked answer out first so the method is fresh',
    ],
    why: 'A visible answer means the attempt never happens, and the attempt is what carries the benefit. Never looking is the opposite error: being stuck with no way forward teaches nothing either, which is why the change is "after a real try" rather than "never".',
  },
]

const usefulDifficulty = tpl(
  {
    id: 'xd-useful-difficulty',
    name: 'Add the difficulty that pays',
    skillIds: ['x-desirable'],
    bucket: 'meta',
    difficulty: 3,
    variants: REPAIR_CASES.length,
    minutes: 3,
    transfer: true,
  },
  (rng, seed) => {
    const c = cycle(seed, REPAIR_CASES)
    return {
      title: 'One change, and the reason for it',
      prompt: `**How it is being done now.** ${c.situation}\n\nWhich single change does the most for what is remembered a week later?`,
      answer: mcq(rng, c.key, [...c.decoys]),
      hints: [
        'Ask what each change would make you PRODUCE that you are not producing now.',
        'A change that only adds effort is not automatically an improvement. Effort has to land on the material.',
        'One of these situations is fixed by removing a difficulty rather than adding one. Check whether this is that situation.',
      ],
      explanation: `${c.key}. ${c.why}`,
    }
  },
)

// =====================================================================
// x-compare — six more case-comparison sets
// =====================================================================

function part(stage: string, body: Omit<ItemPart, 'stage'>): ItemPart {
  return { stage, ...body }
}

interface CaseSet {
  /** Short label for the shared structure, used in the explanation. */
  principle: string
  a: { title: string; text: string }
  b: { title: string; text: string }
  /** What a good written comparison contains. Guides, never grades. */
  criteria: string[]
  model: string
  key: string
  decoys: string[]
  /** A third cover story, surface-different from both. */
  transfer: { text: string; key: string; decoys: string[] }
  why: string
}

/**
 * The same three checkpoints as `caseComparison.ts`, deliberately identical in
 * shape so the structure cannot drift between files: compare in writing
 * (ungraded, because the app cannot read prose and pretending to would be
 * worse than saying so), name the structure (graded), then apply it to a third
 * cover story (graded, and the actual transfer test).
 */
function comparisonItem(rng: Rng, set: CaseSet) {
  return {
    title: 'Two cases',
    prompt: 'Two situations that look nothing alike. Read both, then work out what they have in common.',
    explanation: `${set.principle}. ${set.why}`,
    hints: [
      'Cross out every name, place and subject. Describe what is left.',
      'Ask what happened first, what happened next, and what was concluded from it.',
      'The structure is whatever makes the same objection land in BOTH cases.',
    ],
    parts: [
      part('Compare', {
        study: `CASE 1 — ${set.a.title}\n\n${set.a.text}\n\n---\n\nCASE 2 — ${set.b.title}\n\n${set.b.text}`,
        studySeconds: 90,
        prompt:
          'In your own words: what is the same about how these two situations WORK? Ignore the surface — the people, the setting, the subject. Describe the shared structure and what it means for what should be done.',
        answer: draft({
          criteria: set.criteria,
          model: set.model,
          minWords: 25,
          placeholder: 'The thing both have in common is…',
        }),
        explanation:
          'This part is never scored — the app cannot read writing, and marking it would be pretending. Writing the comparison is what does the work: in the study this method comes from, learners who wrote out the shared structure transferred it to a new case two to three times as often as learners who read the same two cases separately.',
        hints: [
          'Strip out the names and the setting. What is left?',
          'Say what was measured, what was done, and what was concluded — in that order.',
          'What makes the conclusion unsafe in BOTH cases, rather than in one of them?',
        ],
      }),
      part('Principle', {
        prompt: 'Which statement names the structure the two cases share?',
        answer: mcq(rng, set.key, set.decoys),
        explanation: `${set.principle}. ${set.why}`,
      }),
      part('New case', {
        prompt: `A third situation, unrelated to either of the first two:\n\n${set.transfer.text}\n\nWhat does the shared structure say to do here?`,
        answer: mcq(rng, set.transfer.key, set.transfer.decoys),
        explanation:
          'This is the point of the exercise. Recognising the structure in a case that shares none of the surface details is the thing that was actually learned; getting the first two right only shows they were read.',
      }),
    ],
  }
}

// ------------------------------------------------- regression to the mean

const REGRESSION_SETS: CaseSet[] = [
  {
    principle: 'Extremes were picked for being extreme, so the next measurement drifts back on its own',
    a: {
      title: 'The coach who shouts',
      text: 'A rowing coach shouts at the crew after their slowest time of the season. The next week they are faster. He has also praised the crew after their fastest time, and the week after that they were slower. He concludes that shouting works and praise makes people complacent.',
    },
    b: {
      title: 'The blood-pressure clinic',
      text: 'A clinic offers a new supplement to the forty patients with the highest readings at one screening. Six weeks later those forty average noticeably lower. Nobody else was measured twice, and there was no comparison group.',
    },
    criteria: [
      'Say how the group in each case was chosen, and what that choice guarantees',
      'Say what would have happened to the same group with no action at all',
      'Say what comparison would tell the two explanations apart',
    ],
    model:
      'In both cases a group was selected for sitting at an extreme of a measurement that is partly skill and partly luck. Luck does not repeat, so the next measurement from the same group moves back towards the middle whether or not anything was done to them. That means the improvement was guaranteed by the selection before any shouting or any supplement happened. Telling the two stories apart needs a second group, equally extreme, that got nothing.',
    key: 'Both groups were chosen for being extreme, so their next measurement moves back regardless',
    decoys: [
      'Both groups quietly changed how hard they were trying once someone singled them out',
      'Both sets of measurements were taken under different conditions, so they cannot be compared',
      'Both samples were far too small, so a great many more readings should have been collected',
      'Both of the people running these studies wanted their own method to come out looking effective',
    ],
    transfer: {
      text: 'A driving school gives four extra lessons to the ten learners with the worst mock-test scores. Their next mocks are better on average, and the school advertises the extra lessons as the reason.',
      key: 'Compare against ten equally poor scorers who were given no extra lessons',
      decoys: [
        'Ask the ten learners whether they felt that the extra lessons had helped them',
        'Give the same extra lessons to the ten best scorers and compare the two groups',
        'Repeat the mock test several more times until the scores settle at a stable level',
        'Check whether the second mock paper happened to be easier than the first one was',
      ],
    },
    why: 'The trap is that the improvement is real. Nobody made the numbers up; they moved exactly as reported. What did not happen is any evidence that the action caused the movement, because selecting the extreme already guaranteed the direction.',
  },
  {
    principle: 'Extremes were picked for being extreme, so the next measurement drifts back on its own',
    a: {
      title: 'The rescue campaign',
      text: 'A shop has its worst sales month in four years, so the owner runs an advertising campaign the following month. Sales recover to roughly their usual level and the owner books the same campaign for next year.',
    },
    b: {
      title: 'The new stretch',
      text: 'A physiotherapist teaches a new stretch to the patients who report the most pain in a given week. At the next appointment those patients report less pain on average, and the stretch is added to the standard programme.',
    },
    criteria: [
      'Identify what triggered the action in each case, and note that it was an extreme reading',
      'Explain why the observed recovery would appear even if the action did nothing',
      'Name the group that is missing from both stories',
    ],
    model:
      'Both actions were triggered by an unusually bad reading, and both were judged by whether the next reading was better. A month of sales and a week of reported pain both bounce around; the worst one in a stretch is partly a genuinely bad month and partly bad luck, and the luck component is gone next time. So the recovery arrives on schedule with or without the campaign and with or without the stretch. What both stories lack is the group that was equally bad and got nothing.',
    key: 'The action was triggered by an unusually bad reading, which was going to improve anyway',
    decoys: [
      'The action was judged on a single follow-up reading rather than on a much longer run of them',
      'The people affected knew that something new was being tried and quietly responded to that',
      'The two readings measure slightly different things, so the comparison was never a valid one',
      'The person deciding also collected the data, so the recording may well have been generous',
    ],
    transfer: {
      text: 'An airline reviews the ten routes with the worst punctuality last quarter, adjusts their schedules, and finds punctuality improved on all ten this quarter. It plans to adjust the next ten worst.',
      key: 'Look at how the routes just outside the worst ten did with no changes at all',
      decoys: [
        'Check that the schedule adjustments were actually implemented on all ten routes',
        'Ask the crews on those ten routes whether the new schedules felt more workable',
        'Adjust the schedules on the ten best routes as well and compare the two groups',
        'Wait another quarter before drawing any conclusion about the schedule changes',
      ],
    },
    why: 'The pattern is easy to run forever: pick the worst, act, watch it improve, conclude the action worked, repeat. It generates a permanent supply of apparent successes without any of them being evidence.',
  },
]

const regressionComparison = tpl(
  {
    id: 'cc-regression',
    name: 'Two cases: it was going to improve anyway',
    skillIds: ['x-compare', 'i-samplesize'],
    bucket: 'meta',
    difficulty: 4,
    variants: REGRESSION_SETS.length,
    minutes: 7,
    kind: 'multi',
    transfer: true,
  },
  (rng, seed) => comparisonItem(rng, cycle(seed, REGRESSION_SETS)),
)

// ------------------------------------------------------------- sunk cost

const SUNK_SETS: CaseSet[] = [
  {
    principle: 'What has already gone cannot be recovered by continuing',
    a: {
      title: 'The album nobody likes',
      text: 'A band has spent eight months and most of its savings recording an album that none of them still enjoys. Finishing it will take four more months. Starting something new would take five. They are carrying on because of the eight months.',
    },
    b: {
      title: 'The half-dug tunnel',
      text: 'A council has spent £4m on a tunnel. Finishing it will cost £6m more and deliver benefits now valued at £5m. Abandoning it costs £1m to make the site safe. Councillors argue that stopping would waste the £4m already spent.',
    },
    criteria: [
      'Say what each side is treating as a reason, and whether it can change either way',
      'Restate each decision using only what happens from now on',
      'Say what the answer would be if the past spending had never happened',
    ],
    model:
      'In both cases a cost that has already been paid is being used as an argument for one of the options. But it has been paid under every option, so it is identical on both sides of the comparison and cannot favour either. The live question is only what the next four months, or the next £6m, buys compared with what else those could buy. Written that way the tunnel is £6m for £5m of benefit against £1m to stop, and the album is four months for something nobody wants against five for something they might.',
    key: 'The cost already paid is the same under both options, so it cannot favour either one',
    decoys: [
      'The cost already paid should count for less than a cost that is still to come',
      'The people deciding are much too close to the project to judge it in a fair way',
      'The remaining cost has probably been underestimated, as it usually is on projects like these',
      'A commitment once made should be honoured, whatever the numbers happen to say about it',
    ],
    transfer: {
      text: 'A student is two years into a five-year course she no longer wants, and has found a three-year course she does want. She says she cannot switch because of the two years she has already put in.',
      key: 'Compare three more years of the wanted course against three of the unwanted one',
      decoys: [
        'Finish the current course, since two years of work would otherwise be thrown away',
        'Ask which course her family and friends would prefer her to end up completing',
        'Stay, because changing course looks worse to an employer than finishing does',
        'Wait one more year and decide again once the third year has been completed',
      ],
    },
    why: 'The tempting wrong answer is that the past cost should count for something rather than nothing. It counts for nothing in the decision — which is not the same as saying it did not matter, or that it was a mistake to have spent it.',
  },
  {
    principle: 'What has already gone cannot be recovered by continuing',
    a: {
      title: 'The unwatched season',
      text: 'Someone has watched fourteen hours of a television series they stopped enjoying around hour four. Six hours remain. They say they will finish it because otherwise the fourteen hours were wasted.',
    },
    b: {
      title: 'The rehearsed play',
      text: 'A drama group is six weeks into rehearsing a play that is not working. Switching to a different script means eight weeks of rehearsal from the start; carrying on means five more weeks to a performance nobody in the group expects to enjoy.',
    },
    criteria: [
      'Name what is being counted as a reason in each case and say where it has gone',
      'State each choice as a comparison between what happens next under each option',
      'Explain why finishing does not turn the earlier time into something useful',
    ],
    model:
      'Fourteen hours and six weeks have both been spent and neither can come back. Watching six more hours does not retrieve the fourteen; it spends six more. Finishing the play does not retrieve the six weeks; it spends five more. In both cases the only comparison that means anything is between what the remaining time buys under each option, and in both cases the past figure has been quietly promoted from a fact into an argument.',
    key: 'Continuing spends more of the same thing rather than recovering what was spent',
    decoys: [
      'Finishing something already started is a good habit worth protecting in general',
      'The remaining time is short compared with what has already been put in',
      'Abandoning a thing halfway makes it harder to start the next one properly',
      'The earlier time was enjoyable at the time, so it was not really wasted at all',
    ],
    transfer: {
      text: 'A gamer has spent ninety hours levelling a character in a game they now find repetitive. A new game they expect to enjoy sits unopened. They say the ninety hours mean they should keep going.',
      key: 'Compare the next ten hours in each game and ignore the ninety entirely',
      decoys: [
        'Keep going, since ninety hours of progress would otherwise count for nothing',
        'Keep going until the character is finished, then start the new game after that',
        'Sell or trade the account so that the ninety hours produce something in return',
        'Play both in alternate weeks so that neither of the two is fully abandoned',
      ],
    },
    why: 'The wording that does the damage is "otherwise it was wasted". Whether it was wasted was settled by what already happened; the only thing still open is what the next hours are spent on.',
  },
]

const sunkComparison = tpl(
  {
    id: 'cc-sunk-cost',
    name: 'Two cases: what is already spent',
    skillIds: ['x-compare', 'st-sunk'],
    bucket: 'meta',
    difficulty: 3,
    variants: SUNK_SETS.length,
    minutes: 7,
    kind: 'multi',
    transfer: true,
  },
  (rng, seed) => comparisonItem(rng, cycle(seed, SUNK_SETS)),
)

// ------------------------------------------------------- base-rate neglect

const BASE_RATE_SETS: CaseSet[] = [
  {
    principle: 'When the thing being looked for is rare, most of the alarms are false ones',
    a: {
      title: 'The orchard scanner',
      text: 'A scanner checks apple trees for a disease that affects about 1 tree in 500. It catches every diseased tree and also flags 4 healthy trees in every 100. A grower with 5,000 trees is told that 205 trees were flagged and wants to fell all of them.',
    },
    b: {
      title: 'The bag alarm',
      text: 'An airport scanner alarms on every bag containing a prohibited item and on 2 harmless bags in every 100. Prohibited items turn up in about 1 bag in 4,000. A new officer assumes an alarm almost certainly means a prohibited item.',
    },
    criteria: [
      'Work each case out as counts from a stated group rather than as percentages',
      'Say how many of the flagged cases are the thing being looked for',
      'Say what makes the alarm rate misleading on its own',
    ],
    model:
      'Take the orchard as counts. Out of 5,000 trees about 10 are diseased and all 10 are flagged; of the 4,990 healthy ones about 200 are flagged too. So roughly 210 flags contain 10 diseased trees, and a flagged tree is about 1 in 21. The airport works out the same way: 4,000 bags contain about 1 with a prohibited item, and about 80 harmless bags alarm. In both, the test is doing what it claims, and the rarity of the target is what makes almost every alarm a false one.',
    key: 'The target is so rare that the few real cases are swamped by false alarms',
    decoys: [
      'The test is inaccurate, since a properly built test would not flag healthy cases',
      'The sample examined was too small to support any conclusion about the whole group',
      'The two error rates were reported in different units, so they cannot be combined',
      'The people reading the results wanted to find something and so found something',
    ],
    transfer: {
      text: 'A school installs software that flags essays as copied. It flags every copied essay and 3% of honest ones. About 1 essay in 300 is actually copied. A teacher receives a flagged essay.',
      key: 'Out of 300 essays, about 1 is copied and about 9 honest ones are flagged',
      decoys: [
        'The software is unreliable and the school should stop using it altogether',
        'The flag is strong evidence, since the software catches every copied essay',
        'The teacher should flag the essay to the student and ask them to explain it',
        'Three per cent is a small error rate, so the flag is very likely to be right',
      ],
    },
    why: 'The tempting mistake is to read "catches every case" as "a flag means a case". Those are different claims, and the gap between them is entirely down to how rare the thing is. Counting people or objects rather than juggling percentages is what makes it obvious.',
  },
]

const baseRateComparison = tpl(
  {
    id: 'cc-base-rate',
    name: 'Two cases: how rare the thing is',
    skillIds: ['x-compare', 'i-bayes'],
    bucket: 'meta',
    difficulty: 4,
    variants: BASE_RATE_SETS.length,
    minutes: 7,
    kind: 'multi',
    transfer: true,
  },
  (rng, seed) => comparisonItem(rng, cycle(seed, BASE_RATE_SETS)),
)

// ---------------------------------------------------- second-order effects

const SECOND_ORDER_SETS: CaseSet[] = [
  {
    principle: 'The rule changes the behaviour it was aimed at, and the change works against the rule',
    a: {
      title: 'The late fine',
      text: 'A library introduces a fine of 50p a day for overdue books, expecting books to come back faster. A year later the average book is out for longer. Readers who are already several pounds overdue stop bringing books back at all rather than face the desk.',
    },
    b: {
      title: 'The wider road',
      text: 'A city widens its busiest road from four lanes to six to cut the morning queue. Within eighteen months the queue is as long as before. Drivers who used to take the train or leave at six now drive at eight, because the road looked quicker.',
    },
    criteria: [
      'Say what each change was meant to do, and what it did on the first day',
      'Say how the people affected changed what they did in response',
      'Explain how that response cancelled the original effect',
    ],
    model:
      'Both changes worked exactly as designed for about a day, and then the people affected adjusted. The fine made returning late expensive, so the readers with the largest fines stopped returning at all; the extra lanes made the road quicker, so people who had been avoiding it came back. In both cases the plan assumed behaviour would hold still while changing the very thing behaviour was responding to. The fix is the same in both: follow the plan one step further and ask what people will do differently once it exists.',
    key: 'The people affected changed what they did, and the change undid the intended effect',
    decoys: [
      'The change was far too small to have any lasting effect on a system of that size',
      'The measurement was taken much too late, after other unrelated things had changed',
      'The plan was implemented badly, so a better version of it would have worked as intended',
      'Both of the effects were real at first and simply faded away as people got used to them',
    ],
    transfer: {
      text: 'A company starts paying its support team a bonus based on how many calls each person closes per hour, expecting waiting times to fall.',
      key: 'Ask what staff will do differently once closing calls fast is what pays',
      decoys: [
        'Increase the size of the bonus so that the incentive is felt more strongly',
        'Measure waiting times weekly so that any problem is spotted early enough',
        'Hire more staff at the same time so the team is not stretched by the change',
        'Explain the reasoning behind the bonus so the team supports the new policy',
      ],
    },
    why: 'The trap is that the first effect is real. Fines do make lateness expensive and lanes do carry more cars. The second effect runs through people, arrives later, and is the one that decides the outcome.',
  },
  {
    principle: 'The rule changes the behaviour it was aimed at, and the change works against the rule',
    a: {
      title: 'The bug bounty',
      text: 'A software team pays testers a small amount for each bug they report, hoping to find more real problems. Reports go up sharply, but almost all of them are trivial spelling issues, and the serious bugs take longer to find than before because the queue is full.',
    },
    b: {
      title: 'The attendance prize',
      text: 'A school offers a prize to the form with the best attendance, hoping fewer students will stay home. Attendance rises, and so does the number of clearly unwell students sitting in lessons, and the number of days lost to illness across the term.',
    },
    criteria: [
      'Name what was measured in each case and what was actually wanted',
      'Say how people found a cheaper way to move the measured number',
      'Say what happened to the thing that was actually wanted',
    ],
    model:
      'In both cases a number was chosen as a stand-in for something harder to measure — bug count for software quality, attendance for learning — and then rewarded. Once the number is what pays, the cheapest way to raise it wins, and the cheapest way is not the one anybody intended. Reporting typos is easier than hunting real bugs; coming in ill is easier than being well. The stand-in rises and the thing it stood for falls, which is the shape rather than a coincidence.',
    key: 'A stand-in measure was rewarded, so people moved the measure the cheapest way',
    decoys: [
      'The reward offered was too small to motivate the behaviour that was wanted',
      'The people involved deliberately set out to undermine what was being asked',
      'The measurement period was too short to show the real effect of the change',
      'The wrong group was targeted, so the reward reached people it should not have',
    ],
    transfer: {
      text: 'A city decides to rank its hospitals publicly by the share of operations that succeed, expecting surgical standards to rise.',
      key: 'Expect the riskiest patients to be turned away or sent somewhere else',
      decoys: [
        'Expect hospitals to invest more in training so that their scores go up',
        'Expect the rankings to be inaccurate because hospitals differ in size',
        'Expect the public to ignore the rankings when choosing a hospital',
        'Expect success rates to rise across every one of the hospitals ranked',
      ],
    },
    why: 'Both cases share the same engine: reward the measure, and the measure stops describing the thing. Naming what people would do to move the number cheaply is the whole of the check.',
  },
]

const secondOrderComparison = tpl(
  {
    id: 'cc-second-order',
    name: 'Two cases: and then what happens',
    skillIds: ['x-compare', 'st-secondorder'],
    bucket: 'meta',
    difficulty: 4,
    variants: SECOND_ORDER_SETS.length,
    minutes: 7,
    kind: 'multi',
    transfer: true,
  },
  (rng, seed) => comparisonItem(rng, cycle(seed, SECOND_ORDER_SETS)),
)

// ------------------------------------------------- the contrapositive check

const CONDITIONAL_SETS: CaseSet[] = [
  {
    principle: 'A rule is tested by the cases that could break it, not by the ones that fit it',
    a: {
      title: 'The kitchen rule',
      text: 'A café rule says: every dish containing nuts must carry a red sticker. An inspector has an hour. She can look inside dishes with red stickers, look inside dishes with no sticker, check which dishes the chef says contain nuts, or check which stickers are the right shade of red.',
    },
    b: {
      title: 'The club rule',
      text: 'A club rule says: every member under sixteen must have a signed form on file. An auditor can pull the files that have forms, pull the files of members under sixteen, pull the files of members over sixteen, or check that the signatures on the forms are genuine.',
    },
    criteria: [
      'State each rule in the form "if A then B"',
      'Say which cases could show the rule being broken, and which could not',
      'Explain why checking cases that fit the rule cannot settle anything',
    ],
    model:
      'Both rules say: if A then B. A rule of that shape is broken by exactly one thing — a case that is A and not B. So the checks worth an hour are the ones that could turn one up: dishes with no sticker (which might contain nuts) and files of members under sixteen (which might have no form). Looking at dishes that already carry a sticker, or at files that already have a form, can only produce cases that fit, and a case that fits is consistent with the rule holding and with it being broken elsewhere.',
    key: 'Only a case that has the first part and lacks the second can break the rule',
    decoys: [
      'Every case covered by the rule has to be checked before it can be trusted',
      'The cases that clearly follow the rule should be checked first as a baseline',
      'The rule is too vaguely worded to be tested by any inspection at all',
      'Checking the cases that fit is enough if there are a large number of them',
    ],
    transfer: {
      text: 'A school rule says: every trip with a minibus must have a qualified driver listed. A governor has time to inspect one pile of paperwork.',
      key: 'The trips with no driver listed, to see whether any used a minibus',
      decoys: [
        'The trips that already list a qualified driver, to confirm the rule works',
        'The list of all qualified drivers, to check their qualifications are current',
        'The trips that used no minibus, to confirm they needed no driver listed',
        'A random sample of all trips, since that is the fairest way to inspect',
      ],
    },
    why: 'The pull towards checking the cases that fit is strong because they are the ones the rule brings to mind. They cannot break it, so they cannot test it. The cases with the first part missing cannot break it either — the rule says nothing about them.',
  },
]

const conditionalComparison = tpl(
  {
    id: 'cc-conditional',
    name: 'Two cases: which check tests the rule',
    skillIds: ['x-compare', 'i-conditional'],
    bucket: 'meta',
    difficulty: 4,
    variants: CONDITIONAL_SETS.length,
    minutes: 7,
    kind: 'multi',
    transfer: true,
  },
  (rng, seed) => comparisonItem(rng, cycle(seed, CONDITIONAL_SETS)),
)

// ------------------------------------------------------ the fluency illusion

const FLUENCY_SETS: CaseSet[] = [
  {
    principle: 'Ease of processing is being read as evidence of learning',
    a: {
      title: 'The fourth reading',
      text: 'A student reads a chemistry chapter four times. By the fourth pass nothing on the page surprises her, so she rates herself ready and stops. In the test a week later she can recognise every term in the questions and produce almost none of the explanations.',
    },
    b: {
      title: 'The watched tutorial',
      text: 'Someone watches a video of a repair being done three times. Each step looks obvious and the whole job looks straightforward. Standing in front of the actual machine with the video closed, he cannot remember which part comes off first.',
    },
    criteria: [
      'Say what feeling each person had and what produced that feeling',
      'Say what each person could actually do at the moment of testing',
      'Name the check that would have revealed the gap in advance',
    ],
    model:
      'Both people used how smoothly the material went past as their measure of how well they knew it, and in both cases the smoothness came from having seen it before rather than from being able to produce it. Recognising and producing are different operations, and only one of them was ever practised. The check that would have caught it in either case is the same: close the source and generate the thing cold — write the explanation on a blank page, or take the part off without the video.',
    key: 'Smoothness came from having seen it before, not from being able to produce it',
    decoys: [
      'Not enough time was spent, so a fifth reading or a fourth viewing would fix it',
      'The material was too difficult for the amount of background either person had',
      'Both were distracted while studying and so failed to take the material in',
      'Both left too long a gap between the studying and the moment of testing',
    ],
    transfer: {
      text: 'A student highlights a textbook chapter carefully, finds the highlighted version very easy to read back, and feels confident about tomorrow.',
      key: 'Cover the page and write the section from memory before trusting that feeling',
      decoys: [
        'Highlight in a second colour to separate the main ideas from the details',
        'Read the highlighted parts once more slowly to make them stick better',
        'Compare her highlights against a friend’s to check she marked the right parts',
        'Trust it, since deciding what to highlight required understanding the chapter',
      ],
    },
    why: 'The feeling is not a lie about anything; it accurately reports that the material is easy to process. It is being asked a question it cannot answer — what will still be there tomorrow, cold, with nothing to recognise.',
  },
]

const fluencyComparison = tpl(
  {
    id: 'cc-fluency-illusion',
    name: 'Two cases: it felt like it was working',
    skillIds: ['x-compare', 'x-desirable'],
    bucket: 'meta',
    difficulty: 3,
    variants: FLUENCY_SETS.length,
    minutes: 7,
    kind: 'multi',
    transfer: true,
  },
  (rng, seed) => comparisonItem(rng, cycle(seed, FLUENCY_SETS)),
)

export const TRANSFER_LAB_TEMPLATES: ItemTemplate[] = [
  surfaceOrStructure,
  sameSolution,
  whichPrinciple,
  pairUp,
  twoSchedules,
  whatItTrains,
  mixOrBlock,
  sortTheEffort,
  fluencyIllusion,
  usefulDifficulty,
  regressionComparison,
  sunkComparison,
  baseRateComparison,
  secondOrderComparison,
  conditionalComparison,
  fluencyComparison,
]
